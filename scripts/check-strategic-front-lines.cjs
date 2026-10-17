'use strict';
/* Front-lines variant of the 5 km profile (?frontLines=1): generator contract, the
   "only the next line" rule, start ownership, the held-line rear point and the
   defender's prepared lines. No Babylon or browser resources. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadModule, quietConsole } = require('../tools/ai-sim-harness/module-loader');
const repo = path.resolve(__dirname, '..');
// Arrays built inside vm contexts carry another realm's prototype; compare their content.
const same = (a, b, msg) => assert.equal(JSON.stringify(a), JSON.stringify(b), msg);

function runtime(query) {
  const sandbox = { console: { log() {} }, location: { search: query || '' } };
  vm.createContext(sandbox);
  ['battle/core-runtime.js', 'battle/scenario-generator.js', 'battle/commander-routes.js'].forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(repo, file), 'utf8'), sandbox, { filename: file });
  });
  return sandbox;
}
function segmentDistance(p, road) {
  const dx = road.bx - road.ax,
    dz = road.bz - road.az,
    t = Math.max(0, Math.min(1, ((p.x - road.ax) * dx + (p.z - road.az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(p.x - road.ax - t * dx, p.z - road.az - t * dz);
}

// Generator contract.
const off = runtime('?strategicInterception=1');
const on = runtime('?strategicInterception=1&frontLines=1');
const G = on.BattleScenarioGenerator,
  routes = on.BattleCommanderRoutes;
assert.equal(
  JSON.stringify(off.BattleScenarioGenerator.create('lines-0001', { profile: 'strategic' })),
  JSON.stringify(on.BattleScenarioGenerator.createStrategic('lines-0001', { profile: 'strategic' })),
  'without ?frontLines=1 the 5 km layout is unchanged'
);
assert.equal(
  off.BattleScenarioGenerator.create('lines-0001', { profile: 'strategic' }).frontLines,
  undefined
);
const flavors = new Set(),
  sites = new Set();
for (let n = 1; n <= 24; n++) {
  const seed = 'lines-' + String(n).padStart(4, '0'),
    a = G.create(seed, { profile: 'strategic' });
  assert.equal(JSON.stringify(a), JSON.stringify(G.create(seed, { profile: 'strategic' })), 'seeded replay');
  assert.equal(a.profile, 'strategic');
  assert.equal(a.map.width, 5000);
  assert.equal(a.objectives.length, 9, 'six bases and three line points');
  same(
    a.frontLines.lines.map(l => l.objectiveIds.length),
    [3, 1, 1, 1, 3],
    'five lines from base line to base line, one point per middle line'
  );
  same(a.frontLines.startOwners.meeting, ['us', 'us', null, 'ge', 'ge']);
  for (const f of ['us', 'ge']) {
    assert.equal(a.spawnZones[f].bases.length, 3);
    assert.equal(a.objectives.filter(o => o.baseFaction === f).length, 3);
  }
  const points = a.objectives.filter(o => !o.baseFaction);
  points.forEach((o, i) => {
    assert.equal(o.frontLine, i + 1);
    flavors.add(o.flavor);
    sites.add(i + ':' + o.siteIndex);
    if (i) assert.ok(o.z - points[i - 1].z > 700, 'lines run from the US rear to the German rear');
    const roads = a.roads.filter(r => r.fromObjectiveId === o.id || r.toObjectiveId === o.id);
    const behind = id => {
      const other = a.objectives.find(x => x.id === id);
      return other.frontLine;
    };
    for (const [side, rear] of [
      ['us', l => l < o.frontLine],
      ['ge', l => l > o.frontLine]
    ]) {
      const approaches = roads.filter(r =>
        rear(behind(r.fromObjectiveId === o.id ? r.toObjectiveId : r.fromObjectiveId))
      );
      if (o.frontLine === (side === 'us' ? 1 : 3))
        assert.ok(approaches.length >= 3, side + ' reaches its forward line from every base');
      else assert.ok(approaches.length >= 2, side + ' has a main and a side road into line ' + o.frontLine);
      assert.ok(approaches.some(r => r.frontLineRoad === 'main'));
    }
  });
  const towns = points.filter(o => o.flavor === 'town');
  assert.equal(a.settlements.length, towns.length, 'every town point gets a settlement');
  // Every base reaches every objective over generated roads.
  for (const base of a.spawnZones.us.bases.concat(a.spawnZones.ge.bases)) {
    const sq = { faction: base.id.slice(0, 2), home: base, homeBaseObjectiveId: base.objectiveId };
    for (const objective of a.objectives) {
      const route = routes.missionRouteFor(sq, a, objective.id, { x: base.x, z: base.z });
      for (const step of route)
        assert.ok(
          a.roads.some(r => segmentDistance(step, r) < 0.01),
          'waypoint on a road'
        );
    }
    const opening = routes.routeFor(sq, 'center', a, 0);
    const last = opening[opening.length - 1];
    assert.ok(
      Math.hypot(last.x - points[1].x, last.z - points[1].z) < 0.01,
      'squads open on the centre line'
    );
  }
}
assert.ok(flavors.size === 3, 'town, forest and open lines all occur');
assert.ok(sites.size >= 7, 'line points move between their seeded spots');

// Rules module against a deterministic objective system.
function world(defender, search = '?strategicInterception=1&frontLines=1') {
  const town = G.create('lines-0001', { profile: 'strategic' }),
    hooks = {},
    events = [],
    objectives = town.objectives.map(o => ({ id: o.id, def: o, state: { owner: 'neutral' } }));
  const root = {
    location: { search },
    BattleModules: {
      registerSystem: (id, api) => {
        hooks[id] = api;
      }
    },
    BattleTelemetry: { record: (kind, payload) => events.push({ kind, payload }) },
    BattleObjectiveSystem: {
      get: (sim, id) => objectives.find(o => o.id === id) || null,
      status: (sim, id) => {
        const o = objectives.find(x => x.id === id);
        return o ? { owner: o.state.owner } : null;
      },
      tick() {}
    }
  };
  loadModule(root, 'battle/modules/21b-strategic-front-lines.js');
  const squad = (f, x, z) => ({
    id: f + '-0',
    faction: f,
    members: [{ dead: false, root: { position: { x, z } } }]
  });
  const sim = {
    scene: { metadata: { battleScenario: town } },
    _sides: defender ? { defender } : { meeting: true },
    factions: { us: { squads: [squad('us', 0, -300)] }, ge: { squads: [squad('ge', 0, 300)] } }
  };
  hooks['strategic-front-lines'].onBattleStart(sim);
  const own = (id, f) => {
    objectives.find(o => o.id === id).state.owner = f;
  };
  return { root, sim, town, own, events, hooks, F: root.BattleFrontLines };
}
const m = world(null),
  [L1, L2, L3] = m.town.frontLines.lines.slice(1, 4).map(l => l.objectiveIds[0]);
same(
  m.town.objectives.map(o => m.root.BattleObjectiveSystem.status(m.sim, o.id).owner),
  ['us', 'us', 'us', 'ge', 'ge', 'ge', 'us', 'neutral', 'ge'],
  'meeting: bases and forward lines held, centre neutral'
);
assert.ok(m.events.some(e => e.kind === 'strategic-front-lines-seeded'));
for (const f of ['us', 'ge'])
  same(
    m.town.objectives.filter(o => m.F.attackable(m.sim, f, o.id)).map(o => o.id),
    [L2],
    f + ' may attack only the centre line'
  );
assert.equal(m.sim.factions.us.squads[0]._frontLineRear.objectiveId, L1, 'US rear point is its forward line');
assert.equal(
  m.sim.factions.ge.squads[0]._frontLineRear.objectiveId,
  L3,
  'German rear point is its forward line'
);
m.own(L2, 'us');
m.hooks['strategic-front-lines'].onCommanderTick(m.sim);
assert.ok(
  m.F.attackable(m.sim, 'us', L3) && !m.F.attackable(m.sim, 'us', 'strategic-obj-3'),
  'US moves on to the next line'
);
assert.ok(
  m.F.attackable(m.sim, 'ge', L2) && !m.F.attackable(m.sim, 'ge', L1),
  'Germans must retake the centre first'
);
assert.equal(
  m.sim.factions.us.squads[0]._frontLineRear.objectiveId,
  L2,
  'the captured line becomes the US rear point'
);
m.own('strategic-obj-1', 'ge');
same(
  m.town.objectives.filter(o => m.F.attackable(m.sim, 'us', o.id)).map(o => o.id),
  ['strategic-obj-1'],
  'a lost rear objective is retaken before anything further forward'
);
assert.ok(
  ['strategic-obj-0', 'strategic-obj-2'].includes(
    m.F.rearFor(m.sim, m.sim.factions.us.squads[0]).objectiveId
  ),
  'with the base line broken, the rear point is a base still held'
);
const g = world('ge');
assert.equal(
  g.root.BattleObjectiveSystem.status(g.sim, L2).owner,
  'ge',
  'a German defender holds the centre too'
);
same(
  g.town.objectives.filter(o => g.F.attackable(g.sim, 'us', o.id)).map(o => o.id),
  [L2],
  'the US attack opens on the centre'
);
const free = world(null, '?strategicInterception=1&frontLines=1&frontLineRule=0');
assert.ok(free.F.attackable(free.sim, 'us', L3), '?frontLineRule=0 lifts the next-line rule');

// Defender's prepared lines.
const sidesRoot = {
  console: { log() {} },
  location: { search: '?log=0' },
  BattleModules: { registerSystem() {} }
};
loadModule(sidesRoot, 'battle/core-runtime.js', { console: quietConsole });
loadModule(sidesRoot, 'battle/modules/00-battle-sides.js', { console: quietConsole });
const S = sidesRoot.BattleSides;
assert.ok(S && S.build, 'battle sides loaded');
{
  const sides = S.build(m.town, { defender: 'ge' });
  assert.ok(sides.heldSectors.length >= 2, 'German defender prepares its lines');
  assert.equal(sides.heldSectors[0].objectiveId, L2, 'the front line is the security line');
  assert.equal(sides.heldSectors[1].objectiveId, L3);
  sides.heldSectors.forEach((s, i) =>
    assert.equal(
      s.fallbackSectorId,
      sides.heldSectors[i + 1] ? sides.heldSectors[i + 1].id : null,
      'each line falls back to the one behind'
    )
  );
  assert.ok(
    sides.heldSectors.every(
      s =>
        m.town.frontLines.startOwners.ge[m.town.objectives.find(o => o.id === s.objectiveId).frontLine] ===
        'ge'
    ),
    'only lines the defender holds at the start are prepared'
  );
}

// Air-recon corridors: a watch point where the column leaves its trucks short of the next line.
function corridors(search, layout) {
  const r = { location: { search }, GTLog() {}, BattleModules: { registerSystem() {} } };
  loadModule(r, 'battle/modules/58-strategic-abstract-transport.js', { console: quietConsole });
  loadModule(r, 'battle/modules/59-strategic-aerial-recon.js', { console: quietConsole });
  const road = layout.roads.find(
    x => x.fromObjectiveId === 'strategic-obj-4' && x.toObjectiveId === 'strategic-obj-8'
  );
  assert.ok(road, 'a German base road into line 3');
  const len = Math.hypot(road.bx - road.ax, road.bz - road.az),
    contact = {
      squadId: 'ge-0',
      x: road.ax + (road.bx - road.ax) * 0.3,
      z: road.az + (road.bz - road.az) * 0.3,
      headingRadians: Math.atan2(road.bx - road.ax, road.bz - road.az),
      speedMps: 9,
      speedUncertaintyMps: 1,
      positionUncertaintyM: 40
    };
  assert.ok(len > 300);
  return {
    list: r.BattleAerialRecon.corridorsFor(layout, contact, 'us'),
    dismount: r.BattleSquadTransport.tuning.dismountMetres
  };
}
{
  const town = G.create('lines-0001', { profile: 'strategic' }),
    centre = town.objectives.find(o => o.id === 'strategic-obj-7'),
    flags = '?strategicInterception=1&frontLines=1&interception=1',
    near = (c, d) =>
      c.hop === 1 &&
      c.likelyObjectiveId === 'strategic-obj-7' &&
      Math.abs(Math.hypot(c.point.x - centre.x, c.point.z - centre.z) - d) < 1;
  const on = corridors(flags, town);
  assert.ok(
    on.list.some(c => near(c, on.dismount)),
    'a watch point where the column must dismount short of the centre'
  );
  const off = corridors(flags + '&lineApproachPost=0', town);
  assert.ok(
    !off.list.some(c => near(c, off.dismount)),
    '?lineApproachPost=0 keeps the 1/3 and 2/3 points only'
  );
  const plain = corridors(flags, Object.assign({}, town, { frontLines: undefined }));
  assert.ok(!plain.list.some(c => near(c, plain.dismount)), 'the ring layout is untouched');
}
console.log(
  'PASS front-lines layout, next-line rule, start ownership, held-line rear point, prepared lines, line approach posts'
);
