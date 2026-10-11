'use strict';
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
const { loadSquadCommandStack } = require('./squad-command-stack');
function world(on = true) {
  H.resetIds();
  const r = H.bootstrap({
    modules: false,
    search:
      '?coa=0&fireControl=0&slStress=0&fireteamSplit=0&scoutsForward=0' +
      '&localPlan=1&localResources=1&coveredBounds=1' +
      (on ? '&localDegrade=1' : '')
  });
  const systems = {},
    events = [];
  r.BattleTelemetry = {
    record(type, data) {
      events.push({ type, data });
    }
  };
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
    events,
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
function loss(w) {
  const leader = w.r.SquadAI.leaderOf(w.q);
  assert.ok(leader);
  leader.dead = true;
  w.S.leaderDown(w.q);
  const original = w.E.updateSquad;
  w.E.updateSquad = () => w.report;
  try {
    w.r.SquadAI.updateSquad(w.q, w.b);
  } finally {
    w.E.updateSquad = original;
  }
  assert.ok(w.q._leaderlessIntent);
}
function readyBound(w) {
  w.report.fireSupport = w.q.members.slice(2);
  publish(w);
  assert.ok(w.q.members[1].eng.boundOrder);
  assert.equal(w.q._localTask.kind, 'maneuver');
}
function commandSnapshot(w) {
  return JSON.stringify([
    w.q._localTask,
    w.q._macroMission,
    w.q.commandPhase,
    w.q.objective,
    w.q.route,
    w.q.routeIndex,
    w.q.orderAnchor
  ]);
}
assert.equal(world(false).P.degradationOn, false);
const unparented = H.bootstrap({ modules: false, search: '?localDegrade=1' });
loadModule(unparented, 'battle/modules/15n-squad-leader-local-plan.js', {
  console: quietConsole,
  location: unparented.location
});
assert.equal(unparented._squadLeaderLocalPlan({}).degradationOn, false);
for (const on of [false, true]) {
  const w = world(on);
  readyBound(w);
  loss(w);
  assert.ok(w.L.get(w.q, 'bound'), 'valid inherited authorization remains live');
  if (on) {
    assert.equal(w.q._leaderlessIntent.localValidity.status, 'inherited');
    assert.equal(w.q._leaderlessIntent.localValidity.finishBound, true);
    assert.equal(w.q._leaderlessIntent.localValidity.boundsAllowed, false);
  }
  w.q._macroMission.version++;
  const frozen = commandSnapshot(w);
  publish(w);
  assert.equal(commandSnapshot(w), frozen, 'fallback cannot invent or rewrite tasks/mission/route/anchor');
  assert.equal(!!w.L.get(w.q, 'bound'), !on, 'only opt-in fallback rejects superseded pending authorization');
  assert.equal(w.q.members[1].eng.boundOrder, !on);
  if (on) assert.equal(w.q._leaderlessIntent.localValidity.reason, 'mission-replaced');
}
for (const [reason, change] of [
  [
    'pressure',
    w => {
      w.report.underFire = 3;
    }
  ],
  [
    'lost-eligibility',
    w => {
      w.q.members[2].weapon.ammo = 0;
    }
  ],
  [
    'bound-expired',
    w => {
      w.b.time = 9.6;
    }
  ],
  [
    'unmatched-bound',
    w => {
      delete w.L.get(w.q, 'bound').data.missionVersion;
    }
  ],
  [
    'invalid-task-time',
    w => {
      w.q._localTask.at = 100;
    }
  ]
]) {
  const w = world();
  readyBound(w);
  loss(w);
  change(w);
  const task = JSON.stringify(w.q._localTask);
  publish(w);
  assert.equal(w.q._leaderlessIntent.localValidity.reason, reason);
  assert.equal(w.L.get(w.q, 'bound'), null);
  assert.equal(w.q.members[1].eng.boundOrder, false);
  assert.equal(JSON.stringify(w.q._localTask), task);
  assert.equal(w.q._leaderlessIntent.lastAction, 'hold-local-task');
  const events = w.events.length;
  publish(w);
  assert.equal(w.events.length, events, 'unchanged hold does not emit more transitions');
}
const unknown = world();
loss(unknown);
assert.equal(unknown.q._leaderlessIntent.localValidity.reason, 'no-local-task');
assert.equal(unknown.q._localTask, undefined, 'no invented fallback task');
const isolated = world();
readyBound(isolated);
loss(isolated);
const enemyHidden = H.addSquad(isolated.r, isolated.b, {
  id: 'ge-hidden',
  faction: 'ge',
  x: 100,
  z: 100,
  objective: { x: 0, z: 0 }
});
const view = () =>
  JSON.stringify(
    isolated.P.degradation(isolated.b, isolated.q, isolated.q._leaderlessIntent.localTask, isolated.report)
  );
const beforeHidden = view();
enemyHidden.members.forEach(s => {
  s.root.position.x = -10000;
  s.dead = true;
});
assert.equal(view(), beforeHidden, 'hidden enemy truth cannot change inherited validity');
const recovered = world();
readyBound(recovered);
loss(recovered);
recovered.report.underFire = 3;
publish(recovered);
recovered.report.underFire = 0;
publish(recovered);
assert.equal(recovered.q._leaderlessIntent.localValidity.reason, 'pressure');
assert.equal(
  recovered.L.get(recovered.q, 'bound'),
  null,
  'withdrawn permission cannot revive before handback'
);
const possessed = world();
readyBound(possessed);
loss(possessed);
possessed.q.members[1].isPlayer = true;
possessed.q._macroMission.version++;
publish(possessed);
assert.equal(possessed.q.members[1].eng.boundOrder, true, 'possession remains independent');
const deterministic = () => {
  const w = world();
  readyBound(w);
  loss(w);
  w.report.underFire = 3;
  publish(w);
  return JSON.stringify(w.events);
};
assert.equal(deterministic(), deterministic());
// Real inherited bound adoption/execution, then mission/pressure invalidation while already moving.
const w = world(),
  mover = w.q.members[1];
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
readyBound(w);
loss(w);
w.E.updateSoldier(mover, w.b);
assert.equal(mover.eng.state, 'bound', 'real Engagement adopts a valid inherited order during succession');
const finish = { x: mover.eng.cover.x, z: mover.eng.cover.z };
w.q._macroMission.version++;
w.report.underFire = 3;
publish(w);
assert.equal(w.q._leaderlessIntent.localValidity.reason, 'mission-replaced');
assert.equal(mover.eng.state, 'bound', 'withdrawal of pending authority preserves adopted Micro execution');
assert.equal(w.L.get(w.q, 'bound'), null);
for (let i = 0; i < 80; i++) {
  w.b.time += 0.15;
  w.E.updateSoldier(mover, w.b);
  w.r.BattleMovementResolver.resolve(mover, w.b);
  H.stepMovement(w.b, mover, 0.15);
}
const metres = Math.hypot(mover.root.position.x - start.x, mover.root.position.z - start.z),
  arrivedDistance = Math.hypot(mover.root.position.x - finish.x, mover.root.position.z - finish.z);
assert.ok(metres > 0.75 && arrivedDistance < 0.45);
assert.ok(w.b.events.fired > 0, 'real fire resumes after inherited cover movement');
// Successor handback uses existing six-second succession owner, not a new fallback timer.
const successor = world();
readyBound(successor);
loss(successor);
const serial = successor.q._localTask.serial;
successor.b.time = 11.1;
const original = successor.E.updateSquad;
successor.E.updateSquad = () => successor.report;
try {
  successor.r.SquadAI.updateSquad(successor.q, successor.b);
} finally {
  successor.E.updateSquad = original;
}
assert.ok(successor.r.SquadAI.leaderOf(successor.q));
assert.equal(successor.q._leaderlessIntent, null);
assert.ok(successor.q._localTask.at === 11.1 && successor.q._localTask.serial >= serial);
const retreat = world();
readyBound(retreat);
loss(retreat);
retreat.q.state = 'retreat';
assert.equal(
  retreat.P.degradation(retreat.b, retreat.q, retreat.q._leaderlessIntent.localTask, retreat.report).reason,
  'retreat'
);
assert.equal(retreat.P.update(retreat.b, retreat.q), null, 'retreat keeps its execution owner');
w.systems['squad-command'].onBattleRestart(w.b);
assert.equal(w.q._leaderlessIntent, null, 'nonempty inherited snapshot and validity clear on restart');
assert.equal(w.q._localTask, null);
assert.equal(w.S.leaderlessTelemetry(w.b), null);
console.log(
  'PASS inherited local validity, causal pending denials, independent committed/possessed authority, deterministic succession/restart; outcome ' +
    JSON.stringify({ metres, arrivedDistance, shots: w.b.events.fired })
);
