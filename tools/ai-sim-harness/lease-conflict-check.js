'use strict';
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
const { loadSquadCommandStack } = require('./squad-command-stack');
function world(search = '?leaseConflicts=1') {
  H.resetIds();
  const r = H.bootstrap({ modules: false, search }),
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
    (root, file) => loadModule(root, file, { console: quietConsole, location: root.location }),
    r
  );
  const b = H.makeBattle(r),
    q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 200 } });
  q._macroMission = { version: 1, status: 'executing', intent: 'capture', point: { x: 0, z: 200 } };
  q.commandPhase = 'assault';
  b.time = 5;
  const L = r.BattleLeases,
    S = r.BattleSquadStability,
    E = r.BattleEngagement;
  E.orderBound(q.members);
  L.grant(q, 'bound', 'squad-leader', 0, 10, 'fixture');
  return { r, b, q, L, S, E, systems, events };
}
function hold(w, kind = 'regroup', version = 1) {
  w.L.grant(w.q, kind, 'squad-leader', 1, 20, 'fixture', 'release', { missionVersion: version });
  if (kind === 'recon') w.q._reconTask = { missionVersion: version };
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
for (const kind of ['regroup', 'recon']) {
  const w = world();
  hold(w, kind);
  const before = strategic(w.q),
    leases = JSON.stringify(w.q._leases),
    orders = w.q.members.map(s => s.eng.boundOrder);
  const decisions = w.S.leaseConflictDecision(w.q, w.b.time);
  assert.equal(decisions[0].winner, kind);
  assert.equal(JSON.stringify(w.q._leases), leases, 'query cannot mutate leases');
  assert.deepEqual(
    w.q.members.map(s => s.eng.boundOrder),
    orders,
    'query cannot mutate Micro orders'
  );
  w.S.resolveLeaseConflicts(w.b, w.q);
  assert.equal(w.L.get(w.q, 'bound'), null);
  assert.ok(w.L.get(w.q, kind), 'parent hold retained');
  assert.ok(
    w.q.members.every(s => !s.eng.boundOrder),
    'cleanup reaches actual Engagement state'
  );
  assert.equal(strategic(w.q), before, 'resolution cannot replace strategic/route/stance destinations');
  assert.equal(w.q._leases.conflicts.at(-1).at, 5);
  assert.equal(w.events.at(-1).type, 'decision-lease-conflict');
  assert.equal(w.S.resolveLeaseConflicts(w.b, w.q).length, 0, 'no duplicate terminal events');
}
const off = world('');
hold(off);
const old = JSON.stringify(off.q._leases);
assert.equal(off.S.leaseConflictsOn(), false);
off.S.resolveLeaseConflicts(off.b, off.q);
assert.equal(JSON.stringify(off.q._leases), old, 'default performs no conflict writes');
const stale = world();
hold(stale, 'regroup', 0);
stale.S.resolveLeaseConflicts(stale.b, stale.q);
assert.ok(stale.L.get(stale.q, 'bound'), 'superseded parent has no authority');
const player = world();
hold(player);
player.q.members[0].isPlayer = true;
player.S.resolveLeaseConflicts(player.b, player.q);
assert.equal(player.q.members[0].eng.boundOrder, true, 'possession retains independent authority');
const leaderless = world();
hold(leaderless);
const leader = leaderless.r.SquadAI.leaderOf(leaderless.q);
assert.ok(leader);
leader.dead = true;
assert.equal(leaderless.S.leaderlessActive(leaderless.q), true);
leaderless.S.resolveLeaseConflicts(leaderless.b, leaderless.q);
assert.ok(leaderless.L.get(leaderless.q, 'bound'), 'succession preserves inherited committed bound');
for (const enabled of [false, true]) {
  const w = world('?coa=0&fireControl=0&slStress=0' + (enabled ? '&leaseConflicts=1' : ''));
  hold(w);
  w.L.end(w.q, 'bound', w.b.time, 'fixture starts between bounds');
  w.q.inContact = true;
  w.E.updateSquad = () => ({
    contactStarted: false,
    effective: 8,
    pinned: 0,
    underFire: 0,
    fireSupport: w.q.members.slice(0, 2),
    fled: []
  });
  w.S.fireAndMovement(w.q, w.b);
  assert.equal(w.q._assaultAuthorized, !enabled, 'real bound publisher applies the opt-in parent hold gate');
}
const corner = world();
corner.q._engagementPlan = { status: 'active', missionVersion: 1, serial: 7 };
corner.L.grant(corner.q, 'tactical-plan', 'squad-leader', 0, Infinity, 'contact');
corner.L.grant(corner.q, 'corner-hold', 'squad-leader', 0, 10, 'corner');
corner.S.resolveLeaseConflicts(corner.b, corner.q);
assert.equal(corner.q._leases.conflicts.at(-1).winner, 'tactical-plan');
assert.ok(corner.L.get(corner.q, 'tactical-plan'), 'corner timer cannot cancel committed firefight');
assert.ok(corner.L.get(corner.q, 'bound'), 'tactical plan owns compatible child bound');
assert.equal(corner.S.resolveLeaseConflicts(corner.b, corner.q).length, 0, 'overlap telemetry is coalesced');
for (let i = 0; i < 20; i++) {
  corner.q._engagementPlan.serial++;
  corner.S.resolveLeaseConflicts(corner.b, corner.q);
}
assert.equal(corner.q._leases.conflicts.length, 8, 'bounded independent history');
corner.systems['squad-command'].onBattleRestart(corner.b);
assert.equal(corner.q._leases.conflicts, undefined, 'nonempty history clears on same-object restart');
// Actual commander hook must resolve the conflict; querying the new API alone is insufficient.
const hook = world();
hold(hook);
hook.q.commandPhase = 'regroup';
hook.b.time = 1.5; // The real regroup owner retains its minimum commitment before releasing cohesion.
hook.systems['squad-command'].onCommanderTick(hook.b, { town: null });
assert.equal(hook.L.get(hook.q, 'bound'), null, 'shipping commander hook invokes resolution');
console.log(
  'PASS Meso lease precedence, Engagement cleanup, pure queries, OFF control, parent versions, compatible child bounds, possession/succession, bounded history and actual hook/restart'
);
