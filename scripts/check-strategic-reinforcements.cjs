'use strict';
/* Reinforcement trial on the 5 km front-lines layout (?frontLines=1&reinforcements=1,
   battle/modules/21c-strategic-reinforcements.js): a fresh squad per full squad of losses, at
   most one per base, entering on the rearmost held line away from enemy soldiers. No Babylon
   or browser resources. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadModule, quietConsole } = require('../tools/ai-sim-harness/module-loader');
const repo = path.resolve(__dirname, '..');

function generator() {
  const sandbox = { console: { log() {} }, location: { search: '?strategicInterception=1&frontLines=1' } };
  vm.createContext(sandbox);
  ['battle/core-runtime.js', 'battle/scenario-generator.js'].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(repo, file), 'utf8'), sandbox, { filename: file });
  });
  return sandbox.BattleScenarioGenerator;
}
const G = generator();
const SIZE = 10;

function world(search = '?strategicInterception=1&frontLines=1&reinforcements=1', town) {
  town = town || G.create('lines-0001', { profile: 'strategic' });
  const hooks = {},
    events = [],
    spawned = [],
    objectives = town.objectives.map(o => ({ id: o.id, def: o, state: { owner: 'neutral' } }));
  const roster = { us: [], ge: [] };
  const sim = {
    time: 100,
    winner: null,
    scene: { metadata: { battleScenario: town } },
    _sides: { meeting: true },
    _roster: roster,
    factions: { us: { squads: [] }, ge: { squads: [] } }
  };
  const root = {
    location: { search },
    SquadAI: { COMPOSITION: new Array(SIZE).fill('rifleman') },
    BattleModules: {
      registerSystem: (id, api) => {
        hooks[id] = api;
      },
      spawnUnitType: (id, s, faction, opts) => {
        const sq = { id: faction + '-inf-' + s.factions[faction].squads.length, faction, members: [] };
        for (let i = 0; i < SIZE; i++) {
          const man = { dead: false, root: { position: { x: opts.x, z: opts.z } } };
          sq.members.push(man);
          roster[faction].push(man);
        }
        s.factions[faction].squads.push(sq);
        spawned.push({ id, faction, opts, squad: sq });
        return { squad: sq, count: SIZE };
      }
    },
    BattleTelemetry: { record: (kind, payload) => events.push({ kind, payload }) },
    BattleObjectiveSystem: {
      get: (s, id) => objectives.find(o => o.id === id) || null,
      status: (s, id) => {
        const o = objectives.find(x => x.id === id);
        return o ? { owner: o.state.owner } : null;
      },
      tick() {}
    }
  };
  loadModule(root, 'battle/modules/21b-strategic-front-lines.js');
  loadModule(root, 'battle/modules/21c-strategic-reinforcements.js');
  if (/aerialRecon=1/.test(search))
    loadModule(root, 'battle/modules/59-strategic-aerial-recon.js', { console: quietConsole });
  hooks['strategic-front-lines'].onBattleStart(sim);
  hooks['strategic-reinforcements'].onBattleStart(sim);
  const kill = (faction, n) => {
    for (let i = 0; i < n; i++) roster[faction].push({ dead: true });
  };
  const own = (id, f) => {
    objectives.find(o => o.id === id).state.owner = f;
  };
  const tick = () => hooks['strategic-reinforcements'].onCommanderTick(sim, {});
  return { root, sim, town, events, spawned, kill, own, tick, R: root.BattleStrategicReinforcements };
}
const base = (town, f, i) => town.spawnZones[f].bases[i];

// Off without the flag, and off on the 12-point map.
{
  const w = world('?strategicInterception=1&frontLines=1');
  w.kill('us', 40);
  w.tick();
  assert.equal(w.spawned.length, 0, 'no reinforcements without ?reinforcements=1');
  assert.equal(w.R.summary(w.sim), null);
  const ring = world(
    '?strategicInterception=1&reinforcements=1',
    G.createStrategic('lines-0001', { profile: 'strategic' })
  );
  ring.kill('us', 40);
  ring.tick();
  assert.equal(ring.spawned.length, 0, 'the 12-point map keeps one life');
}

// One fresh squad per full squad of losses, at the bases in turn, up to one per base.
{
  const w = world();
  w.kill('us', SIZE - 1);
  w.tick();
  assert.equal(w.spawned.length, 0, 'nine dead is not yet a squad');
  w.kill('us', 1);
  w.tick();
  assert.equal(w.spawned.length, 1, 'ten dead bring one squad');
  const first = w.spawned[0],
    b0 = base(w.town, 'us', 0);
  assert.equal(first.id, 'infantry-squad', 'built by the ordinary infantry unit module');
  assert.ok(Math.hypot(first.opts.x - b0.x, first.opts.z - b0.z) < 30, 'enters at a base');
  assert.equal(first.squad.homeBaseObjectiveId, b0.objectiveId);
  assert.equal(first.squad.homeBaseId, b0.id);
  assert.equal(first.squad._reinforcement.wave, 1);
  assert.ok(w.events.some(e => e.kind === 'strategic-reinforcement' && e.payload.wave === 1));
  w.tick();
  assert.equal(w.spawned.length, 1, 'the fresh squad is not counted twice');
  assert.equal(w.R.summary(w.sim).ge.sent.length, 0, 'the other side lost nobody');
  w.kill('us', 30);
  w.tick();
  assert.equal(w.spawned.length, 2, 'one squad per tick');
  w.tick();
  w.tick();
  w.tick();
  assert.equal(w.spawned.length, 3, 'the pool is one squad per base');
  assert.deepEqual(
    w.spawned.map(s => s.squad.homeBaseObjectiveId),
    [0, 1, 2].map(i => base(w.town, 'us', i).objectiveId),
    'the bases take turns'
  );
  const s = w.R.summary(w.sim).us;
  assert.equal(s.pool, 3);
  assert.equal(s.sent.length, 3);
}

// Never into enemy soldiers; waits until a base is clear.
{
  const w = world();
  const near = (f, p) => ({ dead: false, root: { position: { x: p.x + 5, z: p.z } } });
  const bases = [0, 1, 2].map(i => base(w.town, 'us', i));
  w.sim._roster.ge.push(near('ge', bases[0]));
  w.kill('us', SIZE);
  w.tick();
  assert.equal(
    w.spawned[0].squad.homeBaseObjectiveId,
    bases[1].objectiveId,
    'skips the base with an enemy on it'
  );
  const blockers = bases.map(b => near('ge', b));
  w.sim._roster.ge.push(...blockers);
  w.kill('us', SIZE);
  w.tick();
  w.tick();
  assert.equal(w.spawned.length, 1, 'no squad while every base has an enemy on it');
  assert.equal(
    w.events.filter(e => e.kind === 'strategic-reinforcement-blocked').length,
    1,
    'the block is reported once'
  );
  assert.ok(w.R.summary(w.sim).us.blocked);
  w.sim._roster.ge.forEach(m => {
    m.dead = true;
  });
  w.sim.time = 160;
  w.tick();
  assert.equal(w.spawned.length, 2, 'the waiting squad enters once a base is clear');
  assert.equal(w.R.summary(w.sim).us.sent[1].waitedSeconds, 60);
}

// The rearmost held line moves forward when the bases fall.
{
  const w = world();
  [0, 1, 2].forEach(i => w.own(base(w.town, 'us', i).objectiveId, 'ge'));
  w.kill('us', SIZE);
  w.tick();
  const L1 = w.town.frontLines.lines[1].objectiveIds[0];
  assert.equal(w.spawned[0].squad.homeBaseObjectiveId, L1, 'enters on line 1 when every base is lost');
  assert.equal(w.spawned[0].squad.homeBaseId, undefined, 'line 1 is not a base');
  w.own(L1, 'ge');
  w.kill('us', SIZE);
  w.tick();
  assert.equal(w.spawned.length, 1, 'no held ground, no reinforcement');
}

// A finished battle takes no reinforcements; a restart clears the count.
{
  const w = world();
  w.sim.winner = 'ge';
  w.kill('us', SIZE);
  w.tick();
  assert.equal(w.spawned.length, 0);
  w.sim.winner = null;
  w.tick();
  assert.equal(w.spawned.length, 1);
}

// Each fresh squad earns its General a sortie, and waits for it before its first brief.
function sortieWorld(extra = '') {
  const w = world(
    '?strategicInterception=1&frontLines=1&reinforcements=1&aerialRecon=1&interception=1' + extra
  );
  w.sim.macroCommandEnabled = true;
  w.sim.factions.us.squads.push({
    id: 'us-0',
    faction: 'us',
    members: [],
    _macroMission: { owner: 'force-command', status: 'executing', intent: 'capture' }
  });
  return w;
}
{
  const w = sortieWorld('&reinforcementSortie=1'),
    A = w.root.BattleAerialRecon,
    own = () => w.sim._strategicAerialRecon.us;
  A.request(w.sim, 'us');
  assert.ok(own().used && own().pass, 'the first sortie flies');
  own().pass = null;
  A.request(w.sim, 'us');
  assert.ok(!own().pass, 'no second sortie without a reason');
  w.kill('us', SIZE);
  w.tick();
  const fresh = w.spawned[0].squad;
  assert.ok(own().pass && own().sorties === 2, 'the fresh squad earns a sortie at once');
  assert.ok(w.events.some(e => e.kind === 'strategic-aerial-recon-rearmed'));
  assert.equal(w.R.awaitingReport(w.sim, fresh), true, 'the fresh squad waits while its sortie flies');
  own().pass = null;
  assert.equal(w.R.awaitingReport(w.sim, fresh), false, 'the report is in: brief it');
  fresh._macroMission = { intent: 'capture' };
  assert.equal(w.R.awaitingReport(w.sim, fresh), false, 'a briefed squad is never held');
  A.request(w.sim, 'us');
  assert.ok(!own().pass, 'one sortie per fresh squad');
  assert.equal(
    w.R.awaitingReport(w.sim, w.sim.factions.us.squads[0]),
    false,
    'opening squads are never held'
  );

  const off = sortieWorld(),
    ownOff = () => off.sim._strategicAerialRecon.us;
  off.root.BattleAerialRecon.request(off.sim, 'us');
  ownOff().pass = null;
  off.kill('us', SIZE);
  off.tick();
  assert.equal(off.spawned.length, 1);
  assert.ok(!ownOff().pass, 'without ?reinforcementSortie=1: no sortie for a fresh squad');
  ownOff().pass = { startedAt: 100, fixes: [] };
  assert.equal(
    off.R.awaitingReport(off.sim, off.spawned[0].squad),
    false,
    'without ?reinforcementSortie=1: briefed at once'
  );
}

console.log('strategic reinforcements: ok');
