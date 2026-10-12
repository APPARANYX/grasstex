'use strict';
// Policy-seam fixtures supply support reports; effective-fire truth is tested
// separately by effective-fire-support and native covered-fire-maneuver checks.
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
const { loadSquadCommandStack } = require('./squad-command-stack');
function world(search = '?localPlan=1&localResources=1&coa=0&fireControl=0&slStress=0') {
  H.resetIds();
  const r = H.bootstrap({ modules: false, search: search + '&effectiveFire=0' }),
    systems = {},
    events = [];
  r.BattleModules = {
    registerSystem(id, s) {
      systems[id] = s;
    },
    unitsFor(b) {
      return [...b._roster.us, ...b._roster.ge];
    }
  };
  r.BattleTelemetry = {
    record(type, data) {
      events.push({ type, data });
    }
  };
  r.BattleCommanderDoctrine = {
    policyFor() {
      return { cohesionRadius: 34, captainlessCohesion: 26 };
    }
  };
  loadSquadCommandStack(
    (root, f) => loadModule(root, f, { console: quietConsole, location: root.location }),
    r
  );
  const b = H.makeBattle(r),
    q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 200 } });
  loadModule(r, 'battle/modules/46-ammunition-stoppages.js', { console: quietConsole, location: r.location });
  q.members.forEach(s => r.BattleAmmunition.initialize(s, b));
  q._macroMission = { version: 1, intent: 'capture', status: 'executing', point: { x: 0, z: 200 } };
  q.commandPhase = 'assault';
  b.time = 5;
  return { r, b, q, systems, events, S: r.BattleSquadStability, E: r.BattleEngagement, L: r.BattleLeases };
}
function strategic(q) {
  return JSON.stringify([
    q._macroMission,
    q.commandPhase,
    q.route,
    q.routeIndex,
    q.objective,
    q.members.map(s => [s.destination, s.prone, s.crawling, s.tacticalCrouch])
  ]);
}
function report(w, underFire = 0, supports = 2) {
  return {
    underFire,
    effective: w.q.members.length,
    pinned: 0,
    fireSupport: w.q.members.filter(s => !s.isPlayer).slice(0, supports),
    fled: [],
    contactStarted: false
  };
}
const off = world('?coa=0&fireControl=0&slStress=0');
assert.equal(off.S.localPlanOn(), false);
off.S.localPlan.update(off.b, off.q);
assert.equal(off.q._localTask, undefined, 'OFF does not observe or create task state');
assert.equal(off.S.localPlanTelemetry(off.b), null, 'OFF benchmark schema unchanged');
const w = world(),
  P = w.S.localPlan,
  frozen = strategic(w.q);
assert.equal(w.S.localPlanOn(), true);
assert.equal(P.update(w.b, w.q).kind, 'approach');
assert.equal(P.update(w.b, w.q).reconAllowed, true);
assert.equal(strategic(w.q), frozen, 'policy never writes General/route/stance/destinations');
const stable = JSON.stringify(w.q._localTask),
  events = w.events.length;
assert.equal(JSON.stringify(P.update(w.b, w.q)), stable, 'unchanged time/state yields identical snapshot');
assert.equal(w.events.length, events, 'stable decision does not emit extra transitions');
w.L.grant(w.q, 'regroup', 'squad-leader', 5, 20, 'fixture', 'release', { missionVersion: 1 });
w.b.time = 10;
assert.equal(P.update(w.b, w.q).kind, 'regroup');
assert.equal(w.q._localTask.reconAllowed, false);
w.L.end(w.q, 'regroup', 10, 'fixture');
w.q._reconTask = { missionVersion: 1 };
w.L.grant(w.q, 'recon', 'squad-leader', 10, 30, 'fixture');
assert.equal(P.update(w.b, w.q).kind, 'recon', 'live eligible recon owns the uncertainty task');
w.L.end(w.q, 'recon', 10, 'fixture');
w.q._reconTask = null;
w.q.inContact = true;
w.r.SquadAI.squadContactsMap = () => [{ at: w.b.time, confidence: 0.9, source: 'told' }];
assert.equal(P.update(w.b, w.q, report(w)).kind, 'maneuver');
assert.equal(w.q._localTask.inputs.confidence, 0.9);
assert.deepEqual(Array.from(w.q._localTask.inputs.sources), ['told']);
// Confidence has causal weight after the existing commitment, not just an export label.
w.b.time = 15;
assert.equal(P.update(w.b, w.q, report(w, Math.ceil(w.q.members.length * 0.15))).kind, 'maneuver');
w.r.SquadAI.squadContactsMap = () => [{ at: w.b.time, confidence: 0.1, source: 'heard' }];
w.b.time = 20;
assert.equal(P.update(w.b, w.q, report(w, Math.ceil(w.q.members.length * 0.15))).kind, 'support');
// Immediate pressure bypasses an ordinary hold, then uses different release/entry thresholds.
w.E.orderBound(w.q.members);
w.q.members[0].isPlayer = true;
w.L.grant(w.q, 'bound', 'squad-leader', 20, 30, 'fixture');
const beforePressure = strategic(w.q);
assert.equal(P.update(w.b, w.q, report(w, Math.ceil(w.q.members.length * 0.8))).kind, 'protect');
assert.equal(w.q._localTask.emergency, true);
w.S.resolveLeaseConflicts(w.b, w.q);
assert.equal(w.L.get(w.q, 'bound'), null, 'real lease resolver consumes situational protection');
assert.ok(
  w.q.members.slice(1).every(s => !s.eng.boundOrder),
  'real Engagement cleanup occurs'
);
assert.equal(w.q.members[0].eng.boundOrder, true, 'possession is independent');
assert.equal(strategic(w.q), beforePressure);
assert.equal(P.update(w.b, w.q, report(w, Math.ceil(w.q.members.length * 0.3))).kind, 'protect');
assert.notEqual(P.update(w.b, w.q, report(w, 0)).kind, 'protect', 'protection releases below exit threshold');
// A missing base of fire revokes maneuver eligibility even during a minimum hold.
w.b.time = 30;
assert.equal(P.update(w.b, w.q, report(w)).kind, 'maneuver');
assert.equal(P.update(w.b, w.q, report(w, 0, 1)).kind, 'support');
// Fresh-report freshness and enemy hidden truth cannot change policy inputs.
const own = world(),
  enemy = H.addSquad(own.r, own.b, { id: 'ge-0', faction: 'ge', x: 0, z: 10, objective: { x: 0, z: 0 } });
const inputs = JSON.stringify(own.S.localPlan.read(own.b, own.q));
enemy.members.forEach(s => {
  s.root.position.z = 10000;
  s.dead = true;
});
assert.equal(JSON.stringify(own.S.localPlan.read(own.b, own.q)), inputs);
own.r.SquadAI.squadContactsMap = sq =>
  sq.faction === 'ge' ? [{ at: 5, confidence: 1, source: 'seen' }] : [];
assert.equal(own.S.localPlan.read(own.b, own.q).confidence, 0, 'faction knowledge remains isolated');
own.r.SquadAI.squadContactsMap = () => [{ at: -20, confidence: 1, source: 'seen' }];
assert.equal(own.S.localPlan.read(own.b, own.q).confidence, 0, 'expired report cannot boost confidence');
// Version changes bypass commitment; stale parent leases have no authority.
w.q._macroMission.version = 2;
w.L.grant(w.q, 'regroup', 'squad-leader', 30, 50, 'stale fixture', 'release', { missionVersion: 1 });
w.q.inContact = false;
w.r.SquadAI.squadContactsMap = () => [];
assert.equal(P.update(w.b, w.q).kind, 'approach');
assert.equal(w.q._localTask.missionVersion, 2);
const leader = w.r.SquadAI.leaderOf(w.q),
  inherited = w.q._localTask;
leader.dead = true;
assert.equal(P.update(w.b, w.q), null);
assert.equal(w.q._localTask, inherited, 'succession preserves inherited task without new Meso choices');
w.q.state = 'retreat';
assert.equal(P.update(w.b, w.q), null, 'retreat keeps its existing owner');
// Actual publisher, not just pure scores: high pressure revokes assault authorization.
for (const enabled of [false, true]) {
  const hook = world('?coa=0&fireControl=0&slStress=0' + (enabled ? '&localPlan=1' : ''));
  hook.q.inContact = true;
  hook.E.updateSquad = () => report(hook, hook.q.members.length);
  hook.S.fireAndMovement(hook.q, hook.b);
  assert.equal(hook.q._assaultAuthorized, !enabled, 'shipping bound publisher consumes policy');
  if (enabled) assert.equal(hook.q._localTask.kind, 'protect');
}
const recon = world();
recon.q.members.forEach(s => {
  s.suppressedUntil = 50;
});
assert.equal(
  recon.S.startRecon(recon.q, recon.b, { signature: 'causal', point: { x: 0, z: 50 }, axis: { x: 0, z: 1 } }),
  false
);
assert.equal(recon.q._reconTask, undefined, 'real recon owner rejects a fresh scouting task under pressure');
assert.equal(recon.q._localTask.kind, 'protect');
const restart = world();
restart.systems['squad-command'].onCommanderTick(restart.b, {});
assert.ok(restart.q._localTask.history.length, 'shipping commander hook activates policy');
restart.systems['squad-command'].onBattleRestart(restart.b);
assert.equal(restart.q._localTask, null, 'same-object restart clears nonempty policy/history');
assert.equal(restart.S.localPlanTelemetry(restart.b).transitions, 0);
console.log(
  'PASS situational weighting, actual bound/recon consumers, pressure hysteresis, mission/succession/possession, report isolation and restart'
);
