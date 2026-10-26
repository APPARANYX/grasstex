#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const H = require('./harness');
const { loadModule } = require('./module-loader');
const C = require('../../battle/tactical-capability-contract');
let count = 0;
function test(name, fn) {
  fn();
  count++;
  console.log('PASS ' + name);
}
function world(range = 100, flags = '&commandPosture=0') {
  H.resetIds();
  const r = H.bootstrap({
    search: '?stressAct=0&commandRelay=0&tacticalController=new' + flags,
    stats: true
  });
  const systems = {};
  r.BattleModules.registerSystem = (id, s) => (systems[id] = s);
  r.BattleModules.unitsFor = b => b._roster.us.concat(b._roster.ge);
  r.BattleTacticalCapabilityContract = C;
  for (const f of [
    'battle/movement-resolver.js',
    'battle/modules/13a-tactical-controller.js',
    'battle/modules/13b-tactical-owner-adapters.js',
    'battle/modules/13c-tactical-march-provider.js',
    'battle/modules/13d-tactical-contact-skills.js',
    'battle/modules/13e-tactical-covered-maneuver.js',
    'battle/modules/46-ammunition-stoppages.js'
  ])
    loadModule(r, f, { location: r.location });
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
  q.commandPhase = 'assault';
  q.state = 'advance';
  q._macroMission = { version: 1, owner: 'force-command', intent: 'capture', status: 'executing' };
  q.route = [{ x: 0, z: 300 }];
  q.orderAnchor = { x: 0, z: 0 };
  q.rally = { x: 0, z: 0 };
  const w = {
    r,
    b,
    q,
    ge,
    target: ge.members[2],
    E: r.BattleEngagement,
    TC: r.BattleTacticalController,
    S: r.BattleTacticalContactSkills
  };
  systems['tactical-march-provider'].onBattleStart(b);
  for (const s of q.members.concat(ge.members)) r.BattleAmmunition.initialize(s);
  // Long training magazines isolate team/adoption lifecycle; separate cases revoke ammo/reload.
  q.members.forEach(s => (s.weapon.ammo = 500));
  b.onHit = () => {};
  b.random = () => 0.99;
  ge.members.forEach(s => {
    s.hp = 100000;
    s.maxHp = 100000;
  });
  w.M = r.BattleTacticalCoveredManeuver;
  w.ammoTick = () => systems['ammunition-stoppages'].onSimulationStep(b, { dt: 0.15 });
  // Controlled geometry fixture: test lifecycle and adoption independently of the real-map
  // route sampler (covered-bounds-check and hosted QA exercise the physical geometry).
  const cover = r.BattleCoverPositions;
  cover.boundThreats = () => [{ x: 0, z: range, at: b.time, confidence: 1, source: 'seen' }];
  const origins = new Map(q.members.map(s => [s, { x: s.root.position.x, z: s.root.position.z }]));
  cover.candidates = (s, sim, threat, max) =>
    [-1, 1].map(dir => {
      const origin = origins.get(s);
      const p = { x: origin.x, z: origin.z + dir * 6 };
      const slot = { ...p, id: 'fixture:' + s.id + ':' + dir, normalX: 0, normalZ: -1 };
      return { ...p, slot, slotId: slot.id };
    });
  cover.boundRoute = () => ({ eligible: true, reason: 'fixture-covered-segment' });
  // The contact-route planner has its own deterministic geometry tests.
  // Here isolate the Meso/Engagement adoption and support-fire lifecycle
  // using a physically valid six-meter cover waypoint and live shot receipts.
  r.BattleTacticalContactRoute = {
    tuning: { maxHop: 26 },
    pick: (soldier, sim, reports, goal) => {
      const points = cover.candidates(soldier, sim, reports[0], 26);
      const current = soldier.root.position;
      const remaining = Math.hypot(current.x - goal.x, current.z - goal.z);
      const toward = points.filter(p =>
        Math.hypot(p.x - goal.x, p.z - goal.z) < remaining - 1 &&
        cover.boundRoute(soldier, sim, p, reports).eligible
      );
      const point = toward[0];
      return {
        point: point ? { x: point.x, z: point.z } : null,
        score: point ? Math.hypot(point.x - goal.x, point.z - goal.z) : null,
        exposure: 0,
        stats: { total: points.length, progressing: toward.length, safe: toward.length, rejected: {} }
      };
    },
    evaluate: (soldier, sim, point, reports) => cover.boundRoute(soldier, sim, point, reports)
  };
  see(w);
  return w;
}
function see(w, target = w.target) {
  w.target = target;
  w.q.members.forEach(s => {
    s.target = target;

    s.root.rotation.y = 0;
    w.r.SquadAI.rememberSeen(s, target, w.b, true, 'contact-fixture');
  });
  w.q.contact = {
    unit: target,
    x: target.root.position.x,
    z: target.root.position.z,
    at: w.b.time,
    firstHandAt: w.b.time,
    seenBy: w.q.members[2].id,
    stance: 'stand'
  };
}
function squad(w) {
  w.TC.dispatch(w.b, w.q, 'executeMission');
  w.r.SquadAI.updateSquad(w.q, w.b);
}
function micro(w) {
  w.q.members.forEach(s => {
    w.E.updateSoldier(s, w.b);
    w.r.BattleMovementResolver.resolve(s, w.b);
  });
}
function live(w, cap) {
  return (w.TC.summary(w.b).live || []).filter(a => !cap || a.capability === cap);
}
function clean(w) {
  const s = w.TC.summary(w.b);
  assert.equal(s.stats.faults, 0);
  assert.equal(s.pending, 0);
}

function tick(w) {
  w.b.time += 0.15;
  w.ammoTick();
  see(w);
  squad(w);
  micro(w);
  for (const s of w.q.members) {
    w.r.SquadAI.tickFireCooldown(s, 0.15);
    H.stepMovement(w.b, s, 0.15);
  }
}
function until(w, predicate, seconds = 20) {
  for (let i = 0; i < seconds / 0.15; i++) {
    tick(w);
    if (predicate()) return;
  }
  throw Error(
    'condition did not occur: ' + JSON.stringify(w.M.summary(w.q)) + ' ' + JSON.stringify(w.TC.summary(w.b))
  );
}
test('advance waits for real discharges, personal movement adoption, physical arrival and alternates teams', () => {
  const w = world();
  squad(w);
  micro(w);
  assert.equal(w.M.summary(w.q).phase, 'support');
  assert.equal(live(w, 'combat.bound').length, 0, 'readiness is not discharge');
  until(w, () => w.M.summary(w.q).phase === 'moving');
  assert.ok(w.M.summary(w.q).supporters.length >= 1);
  const firstMover = w.M.summary(w.q).history.find(h => h.phase === 'support').movers[0].id;
  until(w, () => w.M.summary(w.q).completed >= 1);
  until(w, () => w.M.summary(w.q).phase === 'moving');
  assert.notEqual(w.M.summary(w.q).history.filter(h => h.phase === 'support').slice(-1)[0].movers[0].id, firstMover);
  until(w, () => w.M.summary(w.q).completed >= 2);
  clean(w);
});
test('retreat retains a real firing holder, moves backward, selects another mover and falls back on support loss', () => {
  const w = world();
  w.q.establishment = 25; // fixed casualty ratio keeps the native morale owner in retreat
  w.q.home = { x: 0, z: -200 };
  until(w, () => w.M.summary(w.q)?.phase === 'moving');
  assert.equal(w.q.state, 'retreat');
  assert.equal(w.M.summary(w.q).direction, 'back');
  const first = w.M.summary(w.q).history.find(h => h.phase === 'support').movers[0].id;
  const movers = live(w, 'combat.bound').map(a => w.q.members.find(s => String(s.id) === a.actorId));
  const origins = movers.map(s => s.root.position.z);
  until(w, () => w.M.summary(w.q).completed >= 1);
  assert.ok(movers.every((s, i) => s.root.position.z < origins[i]));
  until(w, () => w.M.summary(w.q).phase === 'moving');
  assert.notEqual(w.M.summary(w.q).history.filter(h => h.phase === 'support').slice(-1)[0].movers[0].id, first);
  for (const s of w.q.members)
    if (w.r.BattleSquadStability.controllerBound.role(s, w.b) === 'cover') s.suppressedUntil = w.b.time + 10;
  tick(w);
  assert.equal(live(w, 'combat.bound').length, 0);
  assert.equal(live(w, 'maneuver.cover').length, 0);
  assert.equal(w.q.state, 'retreat');
  assert.ok(w.q.members.some(s => s._movementResolver?.last?.kind === 'retreat'));
  clean(w);
});
test('a movement publication cannot execute before the mover personally adopts its envelope', () => {
  const w = world();
  until(w, () => w.M.summary(w.q)?.phase === 'moving');
  const moving = live(w, 'combat.bound');
  assert.ok(moving.some(a => a.stage === 'published'));
  for (const a of moving.filter(a => a.stage === 'published')) {
    const s = w.q.members.find(s => String(s.id) === a.actorId);
    assert.notEqual(s._movementResolver?.last?.kind, 'cover-bound');
  }
  until(w, () => live(w, 'combat.bound').some(a => a.stage === 'executing'));
  clean(w);
});
test('window expiry releases all cover authority when no real shot can occur', () => {
  const w = world();
  w.q.members.forEach(s => w.r.SquadAI.setFireCooldown(s, 100));
  squad(w);
  micro(w);
  until(w, () => w.M.summary(w.q).failed > 0);
  assert.equal(live(w, 'maneuver.cover').length, 0);
  assert.equal(live(w, 'combat.bound').length, 0);
  clean(w);
});
test('unsafe geometry, wrong direction, missing reports and non-assault phase cannot begin a window', () => {
  for (const reason of ['geometry', 'direction', 'reports', 'phase']) {
    const w = world();
    if (reason === 'geometry') w.r.BattleCoverPositions.boundRoute = () => ({ eligible: false });
    if (reason === 'direction') w.r.BattleTacticalMarchProvider.target = () => ({ x: 0, z: -300 });
    if (reason === 'reports') w.r.BattleCoverPositions.boundThreats = () => [];
    if (reason === 'phase') w.q.commandPhase = 'defend';
    // Direction test has only forward slots, so the target behind cannot borrow them.
    if (reason === 'direction') {
      const choices = w.r.BattleCoverPositions.candidates;
      w.r.BattleCoverPositions.candidates = (...args) =>
        choices(...args).filter(p => p.z > args[0].root.position.z);
    }
    squad(w);
    micro(w);
    assert.equal(live(w, 'maneuver.cover').length, 0, reason);
    clean(w);
  }
});
test('mission supersession, actor death, player takeover, controller switch and restart release the episode', () => {
  for (const reason of ['mission', 'death', 'player', 'switch', 'restart']) {
    const w = world();
    until(w, () => w.M.summary(w.q)?.phase === 'moving');
    const actor = w.q.members.find(s => String(s.id) === live(w, 'combat.bound')[0].actorId);
    if (reason === 'mission') {
      w.q._macroMission = { version: 2, status: 'executing' };
      w.q.commandPhase = 'defend';
      squad(w);
    }
    if (reason === 'death') {
      actor.dead = true;
      squad(w);
    }
    if (reason === 'player') {
      actor.isPlayer = true;
      squad(w);
    }
    if (reason === 'switch') assert.equal(w.TC.requestMode(w.b, w.q, 'legacy').ok, true);
    if (reason === 'restart') w.TC.beforeRestart(w.b);
    assert.equal(live(w, 'combat.bound').length, 0, reason);
    assert.equal(live(w, 'maneuver.cover').length, 0, reason);
    assert.equal(w.r.BattleCoverPositions.current(actor, w.b), null, reason);
    clean(w);
  }
});
test('small extraction remnants never acquire covering authority', () => {
  const w = world();
  w.q.members.slice(3).forEach(s => (s.dead = true));
  squad(w);
  micro(w);
  assert.equal(w.q.state, 'retreat');
  assert.equal(live(w, 'maneuver.cover').length, 0);
  clean(w);
});
test('discharge evidence does not survive ammunition reset, weapon change or another battle', () => {
  const w = world();
  until(w, () => w.M.summary(w.q)?.phase === 'moving');
  const s = w.q.members.find(s => w.r.BattleAmmunition.shotEvidence(s, w.b));
  assert.ok(s);
  assert.equal(w.r.BattleAmmunition.shotEvidence(s, {}), null);
  const weapon = s.weapon;
  s.weapon = { ...weapon };
  assert.equal(w.r.BattleAmmunition.shotEvidence(s, w.b), null);
  s.weapon = weapon;
  w.r.BattleAmmunition.initialize(s, w.b);
  assert.equal(w.r.BattleAmmunition.shotEvidence(s, w.b), null);
});
console.log(count + ' tactical covered maneuver checks passed');
