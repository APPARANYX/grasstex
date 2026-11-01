#!/usr/bin/env node
'use strict';
/* Controller flank and assault skill (module 13i): an attacking squad in contact sends one fireteam round
   the reported enemy through the covered-bound skill (13e) while the rest stay the base of fire, then
   assaults the reported position once it has a crossing line of fire. On old code (no 13i) the same
   squad only bounds men from any team straight up the frontal axis. ?controllerAssault=0 restores that. */
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule } = require('./module-loader');
const C = require('../../battle/tactical-capability-contract');
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log('PASS ' + name);
}
const RANGE = 80;
function world({ flags = '', action = 'assault', phase = 'assault', range = RANGE } = {}) {
  H.resetIds();
  const r = H.bootstrap({
    search: '?stressAct=0&commandRelay=0&tacticalController=new&commandPosture=0' + flags,
    stats: true
  });
  const systems = {};
  r.BattleModules.registerSystem = (id, s) => (systems[id] = s);
  r.BattleModules.unitsFor = b => b._roster.us.concat(b._roster.ge);
  r.BattleTacticalCapabilityContract = C;
  const files = [
    'battle/movement-resolver.js',
    'battle/modules/13a-tactical-controller.js',
    'battle/modules/13b-tactical-owner-adapters.js',
    'battle/modules/13c-tactical-march-provider.js',
    'battle/modules/13d-tactical-contact-skills.js',
    'battle/modules/13e-tactical-covered-maneuver.js',
    'battle/modules/13i-tactical-flank-assault.js',
    'battle/modules/46-ammunition-stoppages.js'
  ].filter(f => require('node:fs').existsSync(require('node:path').join(__dirname, '../..', f)));
  for (const f of files) loadModule(r, f, { location: r.location });
  r.BattleCommanderAI = { policyFor: () => ({ routeArrivalRadius: 8 }) };
  const b = H.makeBattle(r, { seed: 77 });
  b.time = 10;
  const q = H.addSquad(r, b, {
    id: 'us-0',
    faction: 'us',
    x: 0,
    z: 0,
    objective: { x: 0, z: 300 },
    facing: 0
  });
  const ge = H.addSquad(r, b, {
    id: 'ge-0',
    faction: 'ge',
    x: 0,
    z: range,
    objective: { x: 0, z: -300 },
    facing: Math.PI
  });
  q.commandPhase = phase;
  q.state = 'advance';
  q._macroMission = { version: 1, owner: 'force-command', intent: 'capture', action, status: 'executing' };
  q.route = [{ x: 0, z: 300 }];
  q.orderAnchor = { x: 0, z: 0 };
  q.rally = { x: 0, z: 0 };
  systems['tactical-march-provider'].onBattleStart(b);
  for (const s of q.members.concat(ge.members)) r.BattleAmmunition.initialize(s);
  q.members.forEach(s => (s.weapon.ammo = 500));
  b.onHit = () => {};
  b.random = () => 0.99;
  ge.members.forEach(s => {
    s.hp = 100000;
    s.maxHp = 100000;
  });
  /* Geometry fixture, as in tactical-covered-maneuver-check: cover six metres from a man in each of the
     four directions, every segment covered, so the test reads who moves and where, not the route sampler. */
  const cover = r.BattleCoverPositions;
  cover.boundThreats = () => [{ x: 0, z: range, at: b.time, confidence: 1, source: 'seen' }];
  cover.candidates = s => {
    const p0 = s.root.position;
    return [
      [6, 0],
      [-6, 0],
      [0, 6],
      [0, -6]
    ].map(([dx, dz], i) => {
      const p = { x: Math.round(p0.x + dx), z: Math.round(p0.z + dz) };
      const slot = { ...p, id: 'fixture:' + s.id + ':' + p.x + ':' + p.z + ':' + i, normalX: 0, normalZ: -1 };
      return { ...p, slot, slotId: slot.id };
    });
  };
  cover.boundRoute = () => ({ eligible: true, reason: 'fixture-covered-segment' });
  r.BattleTacticalContactRoute = {
    tuning: { maxHop: 26 },
    pick: (soldier, sim, reports, goal) => {
      const here = soldier.root.position,
        remaining = Math.hypot(here.x - goal.x, here.z - goal.z);
      const toward = cover
        .candidates(soldier)
        .filter(p => Math.hypot(p.x - goal.x, p.z - goal.z) < remaining - 1)
        .sort((a, c) => Math.hypot(a.x - goal.x, a.z - goal.z) - Math.hypot(c.x - goal.x, c.z - goal.z));
      const point = toward[0];
      return {
        point: point ? { x: point.x, z: point.z } : null,
        score: point ? Math.hypot(point.x - goal.x, point.z - goal.z) : null,
        exposure: 0,
        stats: { total: 4, progressing: toward.length, safe: toward.length, rejected: {} }
      };
    },
    evaluate: () => ({ eligible: true, reason: 'fixture-covered-segment' })
  };
  const w = {
    r,
    b,
    q,
    ge,
    systems,
    target: ge.members[2],
    E: r.BattleEngagement,
    TC: r.BattleTacticalController,
    M: r.BattleTacticalCoveredManeuver,
    X: r.BattleTacticalFlankAssault,
    Q: r.BattleSquadStability
  };
  see(w);
  return w;
}
function see(w) {
  w.q.members.forEach(s => {
    s.target = w.target;
    w.r.SquadAI.rememberSeen(s, w.target, w.b, true, 'contact-fixture');
  });
  w.q.contact = {
    unit: w.target,
    x: w.target.root.position.x,
    z: w.target.root.position.z,
    at: w.b.time,
    firstHandAt: w.b.time,
    seenBy: w.q.members[2].id,
    stance: 'stand'
  };
}
function tick(w) {
  w.b.time += 0.15;
  w.systems['ammunition-stoppages'].onSimulationStep(w.b, { dt: 0.15 });
  see(w);
  w.TC.dispatch(w.b, w.q, 'executeMission');
  w.r.SquadAI.updateSquad(w.q, w.b);
  w.q.members.forEach(s => {
    w.E.updateSoldier(s, w.b);
    w.r.BattleMovementResolver.resolve(s, w.b);
  });
  for (const s of w.q.members) {
    w.r.SquadAI.tickFireCooldown(s, 0.15);
    H.stepMovement(w.b, s, 0.15);
  }
}
/* Every man the covered-bound skill sent on a hop, with where he was asked to go. */
function hops(w, seconds) {
  const seen = new Map();
  const start = new Map(w.q.members.map(s => [String(s.id), { x: s.root.position.x, z: s.root.position.z }]));
  for (let i = 0; i < seconds / 0.15; i++) {
    tick(w);
    for (const a of w.TC.summary(w.b).live || [])
      if (a.capability === 'combat.bound' && !seen.has(String(a.actorId))) seen.set(String(a.actorId), true);
  }
  return [...seen.keys()].map(id => {
    const s = w.q.members.find(m => String(m.id) === id);
    const o = start.get(id);
    return { id, team: w.Q.teamKeyFor(s), dx: s.root.position.x - o.x, dz: s.root.position.z - o.z };
  });
}
function clean(w) {
  const s = w.TC.summary(w.b);
  assert.equal(s.stats.faults, 0, JSON.stringify(s.stats.faultExamples));
}

test('an attacking squad in contact flanks with one fireteam while the rest stay the base of fire', () => {
  const w = world();
  assert.ok(w.X, 'module 13i is loaded');
  assert.equal(w.X.on, true);
  const moved = hops(w, 40);
  const row = w.X.summary(w.q);
  assert.ok(row.started >= 1, JSON.stringify(row));
  assert.ok(moved.length >= 2, 'the flank team bounds: ' + JSON.stringify(moved));
  assert.ok(
    moved.every(m => m.team === row.team || row.history.some(h => h.phase === 'idle')),
    'only the flank team is drafted while the flank runs: ' + JSON.stringify(moved)
  );
  const lateral = moved.filter(m => m.team === 'bravo').map(m => m.dx * row.side);
  assert.ok(
    lateral.some(dx => dx >= 5),
    'the flank team leaves the frontal axis sideways: ' + JSON.stringify({ moved, row })
  );
  const diag = w.M.summary(w.q).history.length ? w.M.summary(w.q) : null;
  assert.ok(diag, 'the covered-bound skill carried the hops');
  clean(w);
});

test('a crossing line of fire turns the flank into an assault on the reported position', () => {
  const w = world();
  for (let i = 0; i < 1200 && !(w.X.summary(w.q) && w.X.summary(w.q).assaults); i++) tick(w);
  const row = w.X.summary(w.q);
  assert.ok(row.assaults >= 1, JSON.stringify(row));
  const g = w.X.goal(w.q);
  if (g) {
    assert.equal(g.phase, 'assault');
    assert.equal(Math.round(g.point.z), RANGE, 'the assault goal is the reported enemy, not a live unit');
  }
  clean(w);
});

test('?controllerAssault=0 restores the frontal covered bound', () => {
  const w = world({ flags: '&controllerAssault=0' });
  assert.equal(w.X.on, false);
  hops(w, 20);
  assert.equal(w.X.summary(w.q), undefined);
  assert.equal(w.X.goal(w.q), null);
  assert.ok(w.M.summary(w.q).windowsStarted >= 1, 'the frontal skill still bounds');
  assert.notEqual(w.M.summary(w.q).diagnostic.direction, 'flank');
  clean(w);
});

test('no flank inside one covered hop, and none outside an attack', () => {
  const near = world({ range: 20 });
  hops(near, 6);
  assert.equal(near.X.summary(near.q).started, 0);
  assert.equal(near.X.summary(near.q).reason, 'contact-within-one-hop');
  const hold = world({ action: 'hold', phase: 'hold' });
  hops(hold, 6);
  assert.ok(!hold.X.summary(hold.q) || hold.X.summary(hold.q).started === 0);
});

test('a flank mission in its flank phase gets a Meso window (16 accepts the skill goal)', () => {
  const w = world({ action: 'flank', phase: 'flank' });
  const moved = hops(w, 30);
  assert.ok(w.X.summary(w.q).started >= 1, JSON.stringify(w.X.summary(w.q)));
  assert.ok(moved.length >= 1, 'a flank-phase squad bounds: ' + JSON.stringify(w.M.summary(w.q).reason));
  clean(w);
});

test('a depleted flank team ends the flank with a reason and the frontal skill takes over', () => {
  const w = world();
  for (let i = 0; i < 20 && !(w.X.summary(w.q) && w.X.summary(w.q).phase === 'flank'); i++) tick(w);
  assert.equal(w.X.summary(w.q).phase, 'flank');
  const team = w.X.summary(w.q).team;
  w.q.members.filter(s => w.Q.teamKeyFor(s) === team).forEach(s => (s.outOfAmmo = true));
  tick(w);
  assert.equal(w.X.summary(w.q).phase, 'idle');
  assert.equal(w.X.summary(w.q).releases['team-depleted'], 1);
  assert.equal(w.X.goal(w.q), null);
});

console.log(count + ' flank and assault checks passed');
