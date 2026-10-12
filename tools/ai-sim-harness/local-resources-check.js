'use strict';
// Policy-seam fixtures supply support reports; effective-fire truth is tested
// separately by effective-fire-support and native covered-fire-maneuver checks.
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
const { loadSquadCommandStack } = require('./squad-command-stack');
function world(on = true) {
  H.resetIds();
  const r = H.bootstrap({
    modules: false,
    search:
      '?effectiveFire=0&coa=0&fireControl=0&slStress=0&fireteamSplit=0&scoutsForward=0' +
      (on ? '&localPlan=1&localResources=1&coveredBounds=1' : '')
  });
  const systems = {};
  r.BattleModules = {
    registerSystem(id, s) {
      systems[id] = s;
    },
    unitsFor: b => b._roster.us.concat(b._roster.ge)
  };
  const load = f => loadModule(r, f, { console: quietConsole, location: r.location });
  load('battle/battle-navigation.js');
  load('battle/movement-resolver.js');
  load('battle/modules/39-navigation-physicality-debug.js');
  loadSquadCommandStack((root, f) => load(f), r);
  load('battle/modules/46-ammunition-stoppages.js');
  const b = H.makeBattle(r),
    q = H.addSquad(r, b, {
      id: 'us-0',
      faction: 'us',
      x: 0,
      z: -4,
      objective: { x: 0, z: 50 },
      composition: ['sergeant', 'rifleman', 'rifleman', 'gunner']
    });
  b.time = 5;
  r.__battle__ = b;
  r.BattleNavigation.installScenario({ buildings: [] });
  q.members.forEach((s, i) => {
    r.BattleAmmunition.initialize(s, b);
    s._fireteamKey = i < 2 ? 'alpha' : 'bravo';
    r.BattleEngagement.stateOf(s).state = 'engage';
  });
  q.state = 'engaged';
  q.inContact = true;
  q.commandPhase = 'assault';
  q._macroMission = { version: 1, intent: 'capture', status: 'executing', point: { x: 0, z: 50 } };
  const report = {
    contactStarted: false,
    underFire: 0,
    pinned: 0,
    effective: 4,
    fireSupport: q.members.slice(),
    reacting: [],
    fled: []
  };
  const contact = { x: 0, z: 60, at: 5, confidence: 0.9, source: 'told' };
  r.SquadAI.squadContactsMap = () => [contact];
  r.SquadAI.soldierContact = () => contact;
  return {
    r,
    b,
    q,
    report,
    systems,
    P: r.BattleSquadStability.localPlan,
    S: r.BattleSquadStability,
    E: r.BattleEngagement,
    L: r.BattleLeases
  };
}
function publish(w) {
  const original = w.E.updateSquad;
  // Isolate upward evidence; the publisher, resource/ammo owners and bound executor are real.
  w.E.updateSquad = () => w.report;
  try {
    w.S.fireAndMovement(w.q, w.b);
  } finally {
    w.E.updateSquad = original;
  }
}
for (const mutation of [
  s => {
    s.dead = true;
  },
  s => {
    s.hp = 0;
  },
  s => {
    s.incapacitated = true;
  },
  s => {
    s.isPlayer = true;
  },
  s => {
    s.suppressedUntil = 50;
  },
  s => {
    s.reloading = true;
  },
  s => {
    s.clearingStoppage = true;
  },
  s => {
    s.outOfAmmo = true;
  },
  s => {
    s.weapon.ammo = 0;
  },
  s => {
    s.weapon.jammed = true;
  },
  s => {
    s.eng.state = 'freeze';
  },
  s => {
    s.eng.fledPhase = 'wait';
  },
  s => {
    s.squad = {};
  }
]) {
  const w = world(),
    s = w.q.members[2];
  w.report.fireSupport = w.q.members.slice(2);
  assert.equal(w.P.update(w.b, w.q, w.report).kind, 'maneuver');
  mutation(s);
  assert.equal(w.P.update(w.b, w.q).kind, 'support', 'cached supporter is revalidated immediately');
  assert.equal(w.q._localTask.inputs.supporting, 1);
  assert.equal(w.P.moverEligible(s, w.q, w.b), false);
  publish(w);
  assert.equal(w.L.get(w.q, 'bound'), null, 'no new bound with only one usable supporter');
}
const duplicate = world();
duplicate.report.fireSupport = [duplicate.q.members[3], duplicate.q.members[3]];
assert.equal(duplicate.P.update(duplicate.b, duplicate.q, duplicate.report).inputs.supporting, 1);
const foreign = world();
const enemy = H.addSquad(foreign.r, foreign.b, {
  id: 'ge-0',
  faction: 'ge',
  x: 0,
  z: 60,
  objective: { x: 0, z: 0 }
});
enemy.members.forEach(s => foreign.r.BattleAmmunition.initialize(s, foreign.b));
foreign.report.fireSupport = enemy.members;
assert.equal(
  foreign.P.update(foreign.b, foreign.q, foreign.report).inputs.supporting,
  0,
  'foreign roster cannot supply local resources'
);
const stale = world();
stale.P.update(stale.b, stale.q, stale.report);
stale.b.time += stale.S.boundDuration + 1;
assert.ok(Number.isFinite(stale.b.time));
assert.equal(stale.P.read(stale.b, stale.q).supporting, null, 'cached report expires');
stale.b.time = 4;
assert.equal(stale.P.read(stale.b, stale.q).supporting, null, 'future resource evidence rejected');
stale.b.time = 5;
stale.q._macroMission.version++;
assert.equal(stale.P.read(stale.b, stale.q).supporting, null, 'replacement mission rejects prior evidence');
const removed = world();
removed.P.update(removed.b, removed.q, removed.report);
removed.q.members.pop();
assert.equal(
  removed.P.read(removed.b, removed.q).supporting,
  3,
  'removed roster member cannot survive as a scalar count'
);
const unknown = world();
delete unknown.r.BattleAmmunition;
publish(unknown);
assert.equal(unknown.L.get(unknown.q, 'bound'), null, 'missing readiness owner fails closed');
const budget = world();
budget.report.fireSupport = Array(33).fill(budget.q.members[0]);
assert.equal(budget.P.update(budget.b, budget.q, budget.report).inputs.resources.status, 'over-budget');
publish(budget);
assert.equal(budget.L.get(budget.q, 'bound'), null);
const station = world();
station.r.BattleTacticalPositions = {
  current: s => (s === station.q.members[0] ? { status: 'holding' } : null)
};
assert.equal(
  station.P.moverEligible(station.q.members[0], station.q, station.b),
  false,
  'existing station retains its man'
);
// Reject unusable movers while keeping enough valid support; player control remains untouched.
for (const on of [false, true]) {
  const w = world(on),
    held = w.q.members[0];
  held.incapacitated = true;
  w.report.fireSupport = w.q.members.slice(2);
  publish(w);
  assert.equal(!!held.eng.boundOrder, !on, 'resource gate is opt-in');
  assert.ok(w.q.members[1].eng.boundOrder, 'usable partner still receives the actual bound');
  assert.ok(w.L.get(w.q, 'bound'));
}
// Actual positive outcome through existing Engagement, Resolver and physical execution.
const w = world(),
  mover = w.q.members[1];
w.report.fireSupport = w.q.members.slice(2);
const wall = {
  id: 'wall',
  physicalId: 'wall',
  shape: 'obb',
  type: 'wall',
  x: 0,
  z: 0,
  hx: 14,
  hz: 1,
  ux: 1,
  uz: 0,
  vx: 0,
  vz: 1,
  radius: 1,
  y: 0,
  height: 1.1,
  cover: 0.62
};
w.b.obstacles = [wall];
w.b.obstacles.__physicalFootprints = w.b.obstacles;
w.b.obstacles.__physicalVersion = 1;
const target = H.addSquad(w.r, w.b, {
  id: 'ge-fire',
  faction: 'ge',
  x: 0,
  z: 60,
  objective: { x: 0, z: -50 },
  composition: ['rifleman']
}).members[0];
mover.root.position.x = 0;
mover.target = target;
const start = { x: mover.root.position.x, z: mover.root.position.z };
publish(w);
assert.ok(mover.eng.boundOrder, 'Meso resource eligibility reaches real Engagement order');
w.E.updateSoldier(mover, w.b);
assert.equal(mover.eng.state, 'bound');
const finish = { x: mover.eng.cover.x, z: mover.eng.cover.z };
for (let i = 0; i < 80; i++) {
  w.b.time += 0.15;
  w.E.updateSoldier(mover, w.b);
  w.r.BattleMovementResolver.resolve(mover, w.b);
  H.stepMovement(w.b, mover, 0.15);
}
const metres = Math.hypot(mover.root.position.x - start.x, mover.root.position.z - start.z),
  arrivedDistance = Math.hypot(mover.root.position.x - finish.x, mover.root.position.z - finish.z);
assert.ok(metres > 0.75 && arrivedDistance < 0.45, 'eligible bound makes physical progress to cover');
assert.ok(w.b.events.fired > 0, 'real fire resumes afterward');
const inherited = w.q._localTask;
w.r.SquadAI.leaderOf(w.q).dead = true;
assert.equal(w.P.update(w.b, w.q, w.report), null);
assert.equal(w.q._localTask, inherited, 'leaderless intent remains inherited without a new task');
w.q.state = 'retreat';
assert.equal(w.P.update(w.b, w.q, w.report), null);
w.systems['squad-command'].onBattleRestart(w.b);
assert.equal(w.q._localTask, null, 'nonempty resources cleared by shipping restart owner');
console.log(
  'PASS bounded local resources, readiness/roster invalidation, opt-in actual publisher, succession/restart; causal outcome ' +
    JSON.stringify({ metres, arrivedDistance, shots: w.b.events.fired })
);
