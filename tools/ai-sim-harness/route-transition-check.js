'use strict';
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
const { loadSquadCommandStack } = require('./squad-command-stack');
function world() {
  H.resetIds();
  const r = H.bootstrap({ modules: false }),
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
      return { cohesionRadius: 34, captainlessCohesion: 26, routeArrivalRadius: 8 };
    }
  };
  r.BattleCommanderAI = {
    strategicStallReplan: 120,
    acceptMission(b, q) {
      q._macroMission.status = 'executing';
    }
  };
  loadSquadCommandStack((root, file) => loadModule(root, file, { console: quietConsole }), r);
  const b = H.makeBattle(r),
    q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 400 } });
  q.members.forEach(s => {
    s.root.position.x = 0;
    s.root.position.z = 0;
  });
  q._macroMission = {
    version: 1,
    status: 'issued',
    intent: 'capture',
    action: 'assault',
    point: { x: 0, z: 400 },
    route: [
      { x: 0, z: 0 },
      { x: 0, z: 200 }
    ],
    objectiveId: 'a'
  };
  b.time = 1;
  r.BattleSquadStability.executeMission(b, q, null);
  assert.equal(q.routeIndex, 1, 'existing route advancement activates the observer');
  assert.ok(r.BattleLeases.get(q, 'route-transition'));
  return { r, b, q, L: r.BattleLeases, S: r.BattleSquadStability, systems, events };
}
function gameplay(q) {
  return JSON.stringify({
    phase: q.commandPhase,
    objective: q.objective,
    route: q.route,
    routeIndex: q.routeIndex,
    mission: q._macroMission,
    members: q.members.map(s => ({
      destination: s.destination,
      stance: [s.prone, s.crawling, s.tacticalCrouch]
    }))
  });
}
const w = world(),
  { r, b, q, L, S } = w;
const live = L.get(q, 'route-transition');
assert.equal(live.data.missionVersion, 1);
assert.equal(live.data.leg, 1);
assert.equal(live.owner, 'squad-leader');
assert.equal(live.until, 121);
q.members.forEach(s => (s.root.position.z = 50));
b.time = 10;
const before = gameplay(q);
S.observeRouteTransition(b, q);
assert.equal(gameplay(q), before, 'observer cannot change execution/stance/destinations/mission');
const progress = L.active(q, b.time).find(l => l.kind === 'route-transition').progress;
assert.equal(progress.distanceMoved, 50);
assert.equal(progress.distanceRemaining, 150);
assert.equal(progress.elapsed, 9);
assert.equal(progress.noProgress, 0);
assert.equal(live.until, 130, 'progress updates the diagnostic deadline only');
const stable = JSON.stringify(L.active(q, b.time));
S.observeRouteTransition(b, q);
assert.equal(JSON.stringify(L.active(q, b.time)), stable);
q.members.forEach(s => (s.root.position.z = 200));
b.time = 11;
S.observeRouteTransition(b, q);
assert.equal(L.get(q, 'route-transition'), null);
assert.equal(q._leases.observedEnded.at(-1).endReason, 'arrived');
assert.equal(w.events.at(-1).data.distanceMoved, 200);
for (const [why, change] of [
  ['contact', w => (w.q.inContact = true)],
  ['blocked', w => (w.q._macroMissionRequest = { missionVersion: 1, reason: 'execution-blocked' })],
  ['superseded', w => (w.q._macroMission = { ...w.q._macroMission, version: 2 })],
  ['retreat', w => (w.q.state = 'retreat')],
  ['destroyed', w => w.q.members.forEach(s => (s.dead = true))],
  ['stalled', w => (w.b.time = 121)],
  ['superseded', w => (w.q.routeIndex = 0)]
]) {
  const w = world();
  change(w);
  const before = gameplay(w.q);
  w.S.observeRouteTransition(w.b, w.q);
  assert.equal(w.q._leases.observedEnded.at(-1).endReason, why);
  assert.equal(gameplay(w.q), before, why + ' is diagnostic only');
}
for (const [phase, reason] of [
  ['capture', 'capture-committed'],
  ['defend', 'defense-committed'],
  ['support-hold', 'doctrine-hold']
]) {
  const w = world();
  w.q.routeIndex = w.q.route.length - 1;
  w.L.get(w.q, 'route-transition').data.leg = w.q.routeIndex;
  w.q.commandPhase = phase;
  w.S.observeRouteTransition(w.b, w.q);
  assert.equal(w.q._leases.observedEnded.at(-1).endReason, reason);
}
const pending = world();
pending.q._macroMissionRequest = { missionVersion: 0, reason: 'execution-blocked' };
pending.S.observeRouteTransition(pending.b, pending.q);
assert.ok(pending.L.get(pending.q, 'route-transition'), 'stale execution reports cannot abort this version');
const history = world();
history.L.grant(history.q, 'regroup', 'squad-leader', 0, 4, 'test');
history.L.end(history.q, 'regroup', 4, 'cohesion restored');
const old = JSON.stringify(history.q._leases.ended);
for (let i = 0; i < 20; i++) {
  history.L.grant(history.q, 'route-transition', 'squad-leader', i, i + 1, 'test', 'test', {});
  history.L.end(history.q, 'route-transition', i + 1, 'arrived');
}
assert.equal(
  JSON.stringify(history.q._leases.ended),
  old,
  'diagnostic outcomes never evict gameplay lease history'
);
assert.equal(history.q._leases.observedEnded.length, 8);
history.systems['squad-command'].onBattleRestart(history.b);
assert.equal(history.L.get(history.q, 'route-transition'), null);
assert.equal(
  history.q._leases.observedEnded,
  undefined,
  'nonempty diagnostic ledger clears on same-object restart'
);
console.log(
  'PASS route transition activation, distance/time progress, read-only execution, aborts, bounded independent history and restart'
);
