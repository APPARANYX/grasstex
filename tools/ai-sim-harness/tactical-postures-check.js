'use strict';
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
function world(on = true, terrain = true, maneuver = false, options = {}) {
  H.resetIds();
  const r = H.bootstrap({
    search:
      '?localPlan=1&coa=0&commandMovement=' + (options.commandMovement ? '1' : '0') + '&slStress=0&scoutsForward=0&stressAct=0' +
      (on ? '&localAmbush=1' : '') +
      (maneuver ? '&localManeuver=1&coveredBounds=1' : '')
  });
  const load = f => loadModule(r, f, { console: quietConsole, location: r.location });
  load('battle/movement-resolver.js');
  load('battle/battle-navigation.js');
  load('battle/modules/39-navigation-physicality-debug.js');
  const scene = { buildings: [], roads: [] },
    b = H.makeBattle(r, { heightAt: (x, z) => (terrain ? 1.4 * Math.exp(-Math.pow((z - 8) / 1.4, 2)) : 0) });
  b.scene = { metadata: { battleScenario: scene } };
  r.BattleNavigation.installScenario(scene);
  const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
  q.members.forEach((s, i) => {
    s.root.position.x = (i - 5) * 2;
    s.root.position.z = 0;
    s.root.position.y = b.heightAt(s.root.position.x, 0);
  });
  r.BattleCommanderAI = {
    acceptMission(b, q) {
      q._macroMission.status = 'executing';
    }
  };
  q._macroMission = {
    version: 1,
    status: 'issued',
    intent: 'capture',
    action: 'assault',
    point: { x: 0, z: 100 },
    route: [
      { x: 0, z: 0 },
      { x: 0, z: 80 }
    ]
  };
  const S = r.BattleSquadStability,
    P = S.tacticalPostures;
  S.executeMission(b, q, null);
  r.SquadAI.rememberReportedContact(q.members[0], b, {
    x: 0,
    z: 20,
    observedAt: 0,
    confidence: 1,
    sourceSoldier: 999,
    source: 'heard',
    combatThreat: true
  });
  S.localPlan.update(b, q);
  return { r, b, q, S, P, scene };
}
const off = world(false);
assert.equal(off.P.on, false);
assert.equal(off.P.update(off.b, off.q), null);
const exposed = world(true, false);
assert.equal(exposed.P.update(exposed.b, exposed.q), null, 'bare firing lane is not masked');
const w = world(),
  { r, b, q, S, P } = w;
const st = P.update(b, q);
assert.ok(st, 'real terrain crest provides masked stations');
assert.equal(st.mode, 'ambush');
assert.equal(st.stage, 'assemble');
assert.equal(
  r.BattleEngagement.fireAuthorized(q.members[0], b),
  false,
  'an adopted masked-ambush position cannot fire before the first fire-control adoption'
);
q.fireControl = { state: 'open' };
assert.equal(
  r.BattleEngagement.fireAuthorized(q.members[0], b),
  false,
  'an inherited/open fire order cannot bypass pre-contact masked hold'
);
q.fireControl = null;
assert.equal(
  off.r.BattleEngagement.fireAuthorized(off.q.members[0], off.b),
  true,
  'ambush disabled preserves normal Engagement fire permission'
);
const original = JSON.stringify([q._macroMission, q.route, q.members.map(s => [s.destination, s.crouching])]);
P.update(b, q);
assert.equal(
  JSON.stringify([q._macroMission, q.route, q.members.map(s => [s.destination, s.crouching])]),
  original,
  'policy never writes commands, destinations or stance'
);
let holdAt = null,
  readyAt = null;
H.run(r, b, 6, () => {
  const p = P.current(b, q);
  if (p?.stage === 'hold' && holdAt == null) holdAt = b.time;
  if (p?.stage === 'ready' && readyAt == null) readyAt = b.time;
  if (readyAt == null) {
    assert.equal(b.events.fired, 0);
    assert.ok(!r.BattleLeases.get(q, 'bound'));
  }
});
assert.ok(readyAt != null, 'shipping commands, movement and Engagement establish line');
assert.ok(readyAt - holdAt >= P.tuning.minimumHold - 0.15, 'minimum masked dwell is enforced');
assert.ok(
  q.members.every(
    s =>
      Math.hypot(
        s.root.position.x - st.orders.find(o => o.soldierId === String(s.id)).point.x,
        s.root.position.z
      ) <= 0.6
  ),
  'no unnecessary repositioning'
);
/* Confidence >= 0.5 selects a new ambush, but a personally issued
   preparation must not self-cancel only because the SAME still-live report's
   deterministic confidence decay crosses that threshold during the required
   four-second hold. The report identity and ten-second freshness cap remain
   mandatory; explicit observation loss still cancels. */
const confidenceContinuity = world();
let continuityLive = true,
  continuityConfidence = 0.6;
confidenceContinuity.r.SquadAI.squadContactsMap = () =>
  continuityLive
    ? [{
        x: 0, z: 20, at: 0, confidence: continuityConfidence,
        targetId: 'continuity-threat', sector: 2, source: 'told'
      }]
    : [];
const continuityPosture = confidenceContinuity.P.update(
  confidenceContinuity.b,
  confidenceContinuity.q
);
assert.ok(continuityPosture && continuityPosture.mode === 'ambush');
continuityConfidence = 0.49;
let continuityReady = null;
H.run(confidenceContinuity.r, confidenceContinuity.b, 6, () => {
  const state = confidenceContinuity.P.current(confidenceContinuity.b, confidenceContinuity.q);
  if (state?.readyAt != null) continuityReady = state;
});
assert.ok(
  continuityReady,
  'same fresh underlying report survives confidence-floor crossing through the mandatory dwell'
);
continuityLive = false;
assert.equal(
  confidenceContinuity.P.update(confidenceContinuity.b, confidenceContinuity.q),
  null,
  'actual report loss still revokes the prepared posture immediately'
);

/* Full-battle Command Reception is enabled in production. Prove that the
   four-second hold follows the personally adopted ambush intent even when the
   physical movement owner legally displaces the final body endpoint. The
   posture may not demand the Squad Leader's abstract point after Navigation /
   personal-space physicality has selected a different safe place to stand. */
const physicalEndpoint = world(true, true, false, { commandMovement: true });
const physicalPosture = physicalEndpoint.P.update(physicalEndpoint.b, physicalEndpoint.q);
assert.ok(physicalPosture && physicalPosture.orders.length >= 3);
physicalEndpoint.r.BattleSoldierPersonalSpace = {
  resolveDestination(sim, soldier, goal, kind) {
    return kind === 'formation' ? { x: goal.x + 0.9, z: goal.z } : goal;
  }
};
let physicalReady = null;
H.run(physicalEndpoint.r, physicalEndpoint.b, 10, () => {
  const state = physicalEndpoint.P.current(physicalEndpoint.b, physicalEndpoint.q);
  if (state?.readyAt != null && physicalReady == null) physicalReady = state;
});
assert.ok(physicalReady, 'personally adopted ambush reaches readiness at Movement-authoritative endpoints');
const physicalHeld = physicalReady.heldActorIds.map(id => {
  const soldier = physicalEndpoint.q.members.find(s => String(s.id) === id);
  const order = physicalReady.orders.find(o => o.soldierId === id);
  return { soldier, order };
});
assert.ok(
  physicalHeld.some(({ soldier, order }) =>
    Math.hypot(soldier.root.position.x - order.point.x, soldier.root.position.z - order.point.z) > 0.5
  ),
  'regression must exercise a legal physical endpoint displaced from the abstract post'
);
assert.ok(
  physicalHeld.every(({ soldier, order }) => {
    const outcome = physicalEndpoint.r.BattleExecutionOutcome.man(soldier, physicalEndpoint.b);
    return (
      outcome.current &&
      outcome.state === 'completed' &&
      outcome.publishKey === order.key &&
      !soldier.moving &&
      physicalEndpoint.r.BattleCoverPositions.maskedPost(
        physicalEndpoint.b,
        soldier.root.position,
        physicalReady.threats
      )
    );
  }),
  'the stable core has canonical movement completion and remains masked at its actual body positions'
);

const combat = world();
combat.P.update(combat.b, combat.q);
const hostile = H.addSquad(combat.r, combat.b, {
  id: 'ge-0',
  faction: 'ge',
  x: 0,
  z: 20,
  objective: { x: 0, z: 20 },
  composition: ['rifleman']
}).members[0];
hostile.isPlayer = true;
hostile.root.position.x = 0;
hostile.root.position.z = 20;
let firstShot = null;
H.run(combat.r, combat.b, 10, () => {
  if (combat.b.events.fired && firstShot == null) firstShot = combat.b.time;
  const st = combat.P.current(combat.b, combat.q);
  if (st && st.readyAt == null) {
    assert.equal(combat.b.events.fired, 0, 'no volley before minimum hold');
    assert.ok(
      combat.q.members.every(s => s.crouching || s.prone),
      'native preparation stays low'
    );
  }
});
assert.ok(
  firstShot >= 4 && combat.b.events.fired > 0,
  'native personal LOS/contact, readiness and fire permission release actual shots'
);
for (const spoil of [
  x => x.q._macroMission.version++,
  x => x.q.route[x.q.routeIndex].z++,
  x => x.r.BattleNavigation.installScenario(x.scene),
  x => (x.q.state = 'retreat'),
  x => (x.r.SquadAI.leaderOf(x.q).dead = true),
  x => (x.q.members[1].dead = true),
  x => x.r.BattleEngagement.commitStance(x.q.members[1], x.b, 'stand', 0, 'player-possession'),
  x => (x.b.time += 1),
  x => (x.b.scene = { metadata: { battleScenario: x.scene } }),
  x => x.P.reset(x.q)
]) {
  const x = world();
  assert.ok(x.P.update(x.b, x.q));
  spoil(x);
  assert.equal(x.P.current(x.b, x.q), null, 'stale evidence cannot authorize posture');
}
/* A different owner can reserve an MG/emplacement specialist without
   suppressing the other riflemen's opt-in masked firing line. Membership
   changes revoke stale fireteam and position evidence immediately. */
const station = world();
const stationedMan = station.q.members[0];
station.r.BattleTacticalPositions = {
  current: s => (s === stationedMan ? { owner: 'emplacement' } : null)
};
const stationedPosture = station.P.update(station.b, station.q);
assert.ok(
  stationedPosture,
  'remaining riflemen may form a masked line without station-owned specialist'
);
assert.ok(
  stationedPosture.orders.every(o => o.soldierId !== String(stationedMan.id)),
  'Squad Leader must not issue posture orders to the already committed station owner'
);
station.r.BattleTacticalPositions.current = () => null;
assert.equal(
  station.P.current(station.b, station.q),
  stationedPosture,
  'nonparticipant station handback cannot cancel the prepared element'
);
const assignedMan = station.q.members.find(s => String(s.id) === stationedPosture.orders[0].soldierId);
station.r.BattleTacticalPositions.current = s => (s === assignedMan ? { owner: 'emplacement' } : null);
assert.equal(
  station.P.current(station.b, station.q),
  null,
  'a reassigned ambush rifleman immediately revokes the existing posture'
);

/* One exposed rifleman must not cancel a real three-plus-rifle masked
   element, but never receives a fake covered order himself. Two viable masked
   stations are deliberately insufficient for an ambush. */
const partialLine = world();
const exposedMan = partialLine.q.members[0];
exposedMan.root.position.z = 24;
const partialPosture = partialLine.P.update(partialLine.b, partialLine.q);
assert.ok(partialPosture, 'native terrain accepts a viable concealed subelement');
assert.ok(partialPosture.orders.length >= 3, 'at least three masked riflemen required');
assert.equal(
  partialPosture.orders.some(o => o.soldierId === String(exposedMan.id)),
  false,
  'no unsafe firing-post fallback for the exposed rifleman'
);
const shortLine = world();
shortLine.q.members.slice(2).forEach(s => {
  s.root.position.z = 24;
});
assert.equal(shortLine.P.update(shortLine.b, shortLine.q), null, 'two masked stations fail closed');

const pressure = world();
pressure.P.update(pressure.b, pressure.q);
pressure.b.time += 0.15;
pressure.S.localPlan.update(pressure.b, pressure.q, { underFire: 4 });
assert.equal(pressure.P.update(pressure.b, pressure.q, { underFire: 4 }).mode, 'hold');
pressure.b.time += 0.15;
pressure.S.localPlan.update(pressure.b, pressure.q);
assert.equal(
  pressure.P.update(pressure.b, pressure.q).mode,
  'hold',
  'pressure hysteresis prevents immediate ambush rebound'
);
function nativePreparedLine(x) {
  /* Do not assign readyAt/stage in eligibility tests: the shipping commands,
     physical movement and same-three-riflemen dwell must really complete. */
  for (let i = 0; i < 85; i++) {
    H.run(x.r, x.b, 0.15);
    const st = x.P.current(x.b, x.q);
    if (st?.readyAt != null) return st;
  }
  assert.fail('the shipping Squad Leader must naturally hold the concealed fireteam');
}
// The same posture owner may switch a fully prepared ambush to covered
// maneuver under pressure, but only when the shipping physicality sampler
// accepts a real short segment AND at least two other men can support.
// Candidate enumeration is isolated here; the route/LOS verdict stays real.
const man = world(true, true, true);
assert.equal(man.P.maneuverOn, true);
assert.equal(world().P.maneuverOn, false, 'maneuver flag remains default OFF');
const mc = man.r.BattleCoverPositions,
  me = man.q.members[0],
  reported = [{ x: 0, z: 20, at: man.b.time, confidence: 1 }],
  paths = [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 11],
  safe = paths
    .map(z => ({ x: me.root.position.x, z }))
    .find(p => mc.boundRoute(me, man.b, p, reported).eligible);
assert.ok(safe, 'real crest/Navigation geometry must provide an actual eligible covered segment');
mc.candidates = () => [safe];
const support = { underFire: 1, fireSupport: man.q.members.slice(1, 4) };
assert.equal(man.P.coveredTeam(man.b, man.q, [me], support), true);
assert.equal(
  man.P.coveredTeam(man.b, man.q, [me], {
    fireSupport: [man.q.members[1], man.q.members[1]]
  }),
  false,
  'one rifle listed twice is still only one live supporting rifle'
);
assert.equal(
  man.P.coveredTeam(man.b, man.q, [me], { fireSupport: Array(33).fill(man.q.members[1]) }),
  false,
  'oversized support evidence fails closed'
);
assert.equal(
  man.P.coveredTeam(man.b, man.q, [me], { fireSupport: [man.q.members[1]] }),
  false,
  'one remaining rifle cannot support a team bound'
);
mc.candidates = () => [{ x: me.root.position.x, z: 18 }];
assert.equal(
  man.P.coveredTeam(man.b, man.q, [me], support),
  false,
  'exposed/distant hedge end may not be accepted as cover'
);
mc.candidates = () => [];
assert.equal(
  man.P.coveredTeam(man.b, man.q, [me], support),
  false,
  'no-safe-route requires a tactical hold, not an exposed rush'
);
const holding = nativePreparedLine(man);
assert.equal(holding.stage, 'ready');
man.q.inContact = true;
assert.equal(
  man.P.update(man.b, man.q, support).mode,
  'hold',
  'pressure without any safe path cannot publish movement'
);
assert.equal(man.r.BattleLeases.get(man.q, 'bound'), null);
const move = world(true, true, true);
const mm = move.q.members[0],
  cover = move.r.BattleCoverPositions;
const moveSafe = paths
  .map(z => ({ x: mm.root.position.x, z }))
  .find(p => cover.boundRoute(mm, move.b, p, [{ x: 0, z: 20, at: 0, confidence: 1 }]).eligible);
assert.ok(moveSafe);
cover.candidates = () => [moveSafe];
const ready = nativePreparedLine(move);
assert.equal(ready.stage, 'ready');
move.q.inContact = true;
/* Narrow only this expiry test's deadline below the ten-second unrefreshed
   contact-memory age; otherwise the correct stale-threat fail-close ends
   the posture before the independent maneuver-window branch can execute. */
move.P.tuning.maneuverWindow = 8.5;
const staged = move.P.update(move.b, move.q, { underFire: 1, fireSupport: move.q.members.slice(1, 4) });
assert.equal(staged.mode, 'maneuver', 'one existing Squad Leader posture transition');
assert.equal(staged.stage, 'supporting-fire');
assert.equal(
  staged.maneuverUntil - move.b.time,
  move.P.tuning.maneuverWindow,
  'the one-owner posture has a bounded maneuver lease deadline'
);
assert.equal(staged.orders.length, 0, 'posture does not become a second destination writer');
assert.equal(move.r.BattleLeases.get(move.q, 'bound'), null, 'eligibility never directly grants a bound');
assert.equal(move.P.current(move.b, move.q).mode, 'maneuver');
/* Commander ticks refresh the evidence cadence, rather than skipping 14
   seconds (which would correctly revoke an unobserved posture entirely). */
let finish = null;
for (let i = 0; i < 45; i++) {
  move.b.time += 0.4;
  finish = move.P.update(move.b, move.q, { fireSupport: move.q.members.slice(1, 4) });
  if (!finish || finish.mode === 'hold') break;
}
assert.ok(
  !finish || finish.mode === 'hold',
  'a stale reported threat revokes the posture, or the finite maneuver window closes to hold'
);
const readGap = world(true, true, true),
  gap = nativePreparedLine(readGap);
assert.equal(gap.stage, 'ready');
readGap.r.BattleCoverPositions.candidates = () => [
  { x: readGap.q.members[0].root.position.x, z: moveSafe.z }
];
readGap.q.inContact = true;
assert.equal(
  readGap.P.update(readGap.b, readGap.q, { underFire: 1, fireSupport: readGap.q.members.slice(1, 4) }).mode,
  'maneuver'
);
readGap.b.time += 0.3;
assert.equal(
  readGap.P.update(readGap.b, readGap.q).mode,
  'maneuver',
  'read-only commander tick without a fresh report preserves bounded support evidence'
);
readGap.b.time += 0.4;
assert.equal(
  readGap.P.update(readGap.b, readGap.q).mode,
  'hold',
  'missing real Engagement support reports cannot silently persist'
);
const supportLoss = world(true, true, true),
  supportLossStation = nativePreparedLine(supportLoss);
assert.equal(supportLossStation.stage, 'ready');
supportLoss.q.inContact = true;
supportLoss.r.BattleCoverPositions.candidates = () => [
  { x: supportLoss.q.members[0].root.position.x, z: moveSafe.z }
];
assert.equal(
  supportLoss.P.update(supportLoss.b, supportLoss.q, {
    underFire: 1,
    fireSupport: supportLoss.q.members.slice(1, 4)
  }).mode,
  'maneuver'
);
assert.equal(
  supportLoss.P.update(supportLoss.b, supportLoss.q, {
    fireSupport: [supportLoss.q.members[1], supportLoss.q.members[1]]
  }).mode,
  'hold',
  'duplicate native support identities cannot extend an authorized maneuver'
);
const noSupport = world(true, true, true);
const nos = nativePreparedLine(noSupport);
assert.equal(nos.stage, 'ready');
noSupport.q.inContact = true;
assert.equal(
  noSupport.P.update(noSupport.b, noSupport.q, { underFire: 1, fireSupport: [] }).mode,
  'hold',
  'an unsupported exposed advance is denied'
);

/* A separately owned tactical station may remove an EXTRA participant
   without invalidating three other concealed men. Once one of the stable held
   three is reassigned, however, the posture must fail closed rather than
   substitute a new identity into accrued dwell. */
const actorReassign = world();
const actorState = actorReassign.P.update(actorReassign.b, actorReassign.q);
assert.ok(actorState && actorState.orders.length >= 4, 'reassignment fixture needs a spare ambush actor');
const spareOrder = actorState.orders[actorState.orders.length - 1],
  spareActor = actorReassign.q.members.find(s => String(s.id) === spareOrder.soldierId),
  originalStationCurrent = actorReassign.r.BattleTacticalPositions.current.bind(
    actorReassign.r.BattleTacticalPositions
  );
actorReassign.r.BattleTacticalPositions.current = s =>
  s === spareActor ? { id: 'separate-station', kind: 'firing-station' } : originalStationCurrent(s);
const pruned = actorReassign.P.update(actorReassign.b, actorReassign.q);
assert.ok(pruned, 'one non-core station reassignment cannot destroy the whole ambush');
assert.ok(
  !pruned.orders.some(o => o.soldierId === String(spareActor.id)) && pruned.orders.length >= 3,
  'the separately owned actor is removed from posture publishing while a full element remains'
);
let reassignedReady = null;
H.run(actorReassign.r, actorReassign.b, 7, () => {
  const state = actorReassign.P.current(actorReassign.b, actorReassign.q);
  if (state?.readyAt != null) reassignedReady = state;
});
assert.ok(reassignedReady && reassignedReady.heldActorIds.length === 3);
const heldReassigned = actorReassign.q.members.find(
  s => String(s.id) === reassignedReady.heldActorIds[0]
);
actorReassign.r.BattleTacticalPositions.current = s =>
  s === spareActor || s === heldReassigned
    ? { id: 'separate-station', kind: 'firing-station' }
    : originalStationCurrent(s);
assert.equal(
  actorReassign.P.update(actorReassign.b, actorReassign.q),
  null,
  'reassigning a stable held-core actor revokes the posture'
);
assert.equal(
  actorReassign.P.summary(actorReassign.b).releaseReasons['prepared fireteam actor reassigned'],
  1
);

/* One inaccessible/lagging fourth masked soldier cannot strand three
   genuinely adopted riflemen, but borrowing hold time from changing identities
   is impossible. This is a readiness rule, not a new movement owner. */
const partialCore = world();
const core = partialCore.P.update(partialCore.b, partialCore.q);
assert.ok(core && core.orders.length >= 4, 'fixture needs at least four masked posts');
const lagging = partialCore.q.members.find(s => String(s.id) === core.orders[core.orders.length - 1].soldierId);
let partialReady = null;
for (let i = 0; i < 90; i++) {
  H.run(partialCore.r, partialCore.b, 0.15);
  /* A failed adoption is not settled even if the rifleman is physically
     standing in cover; keep just this soldier's publish identity foreign. */
  lagging._fireteamPublishKey = 'unadopted/foreign';
  const state = partialCore.P.current(partialCore.b, partialCore.q);
  if (state && state.readyAt != null) {
    partialReady = state;
    break;
  }
}
assert.ok(partialReady && partialReady.heldActorIds.length === 3, 'three stationary adopted men form one held line');
assert.ok(!partialReady.heldActorIds.includes(String(lagging.id)), 'lagging fourth cannot count toward readiness');
const movingCore = partialCore.q.members.find(s => String(s.id) === partialReady.heldActorIds[0]);
movingCore.moving = true;
assert.equal(
  partialCore.P.update(partialCore.b, partialCore.q),
  null,
  'a broken ready core is revoked before the next pressure/contact order'
);
assert.equal(partialCore.P.summary(partialCore.b).releaseReasons['prepared fireteam left firing line'], 1);

/* Natural posture lifecycle: unlike the earlier targeted policy-seam cases,
   do not set readyAt/stage or substitute P.update/current. The real SquadAI
   ticks must assemble and hold the firing line for the entire dwell first.
   Only then is a pressure contact report and terrain-verified prospective
   slot presented; no movement destination or bound lease is invented. */
function preparedNaturalPressure() {
  const x = world(true, true, true);
  let ready = null;
  for (let i = 0; i < 75; i++) {
    H.run(x.r, x.b, 0.15);
    const st = x.P.current(x.b, x.q);
    if (st && st.readyAt != null) {
      ready = st;
      break;
    }
  }
  assert.ok(ready && ready.stage === 'ready', 'native squad ticks must produce a prepared ambush');
  assert.ok(x.b.time >= x.P.tuning.minimumHold, 'live masked firing-line dwell cannot be skipped');
  assert.equal(x.b.events.fired, 0, 'precontact guns remain silent during natural preparation');
  const mover = x.q.members[0];
  const report = {
    underFire: Math.ceil(x.q.members.length * 0.35),
    fireSupport: x.q.members.slice(1, 5)
  };
  const contact = x.r.SquadAI.squadContactsMap(x.q, x.b)[0];
  assert.ok(contact && contact.confidence >= 0.5, 'pressure transition needs fresh own reported evidence');
  const covered = [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5.5, 6, 7, 8]
    .map(z => ({ x: mover.root.position.x, z }))
    .find(p => x.r.BattleCoverPositions.boundRoute(mover, x.b, p, [contact]).eligible);
  assert.ok(covered, 'real Navigation and Perception must validate a concealed short route');
  // This focused policy transition supplies a candidate, not a line-of-sight
  // verdict or movement permission. The real-map physical candidate/arrival
  // proof is the separate final-head Chromium #523 acceptance.
  x.r.BattleCoverPositions.candidates = () => [covered];
  x.q.inContact = true;
  const local = x.S.localPlan.update(x.b, x.q, report);
  assert.ok(
    local.inputs.pressure >= 0.25 && !local.emergency,
    'non-emergency pressure from native local-plan inputs: ' + JSON.stringify(local)
  );
  const active = x.P.update(x.b, x.q, report);
  assert.ok(active && active.mode === 'maneuver', 'native ready ambush changes to covered maneuver');
  assert.equal(active.stats.coveredManeuvers, 1, 'one transition, no repeated orders');
  assert.equal(x.r.BattleLeases.get(x.q, 'bound'), null, 'posture never authors movement');
  return { ...x, mover, active, report };
}
const natural = preparedNaturalPressure();
const urgentReport = {
  underFire: natural.q.members.length,
  fireSupport: natural.report.fireSupport
};
const urgentTask = natural.S.localPlan.update(natural.b, natural.q, urgentReport);
assert.ok(urgentTask.emergency, 'local-plan owner identifies emergency pressure');
const emergencyHold = natural.P.update(natural.b, natural.q, urgentReport);
assert.equal(emergencyHold.mode, 'hold', 'emergency must preempt ongoing covered maneuver');
assert.equal(emergencyHold.stage, 'emergency-hold');
assert.equal(natural.r.BattleLeases.get(natural.q, 'bound'), null, 'no second movement owner');

const urgentBefore = preparedNaturalPressure();
urgentBefore.P.reset(urgentBefore.q);
const initial = urgentBefore.P.update(urgentBefore.b, urgentBefore.q);
assert.equal(initial, null, 'restart reset clears stale posture authority');

/* The same *naturally prepared* posture must fail closed when any identity
   or command context changes mid-maneuver; these are not merely pre-contact
   validation tests. */
for (const [name, spoil] of [
  [
    'retreat',
    x => {
      x.q.state = 'retreat';
    }
  ],
  [
    'leader-loss',
    x => {
      x.r.SquadAI.leaderOf(x.q).dead = true;
    }
  ],
  [
    'casualty',
    x => {
      x.q.members[1].dead = true;
    }
  ],
  [
    'possession',
    x => {
      x.mover.isPlayer = true;
    }
  ],
  [
    'mission-replacement',
    x => {
      x.q._macroMission.version++;
    }
  ],
  [
    'reported-contact-expired',
    x => {
      x.b.time += 11;
    }
  ]
]) {
  const x = preparedNaturalPressure();
  spoil(x);
  assert.equal(x.P.current(x.b, x.q), null, name + ' must invalidate an active moving posture');
}
const lostSupport = preparedNaturalPressure();
const supportHold = lostSupport.P.update(lostSupport.b, lostSupport.q, {
  fireSupport: [lostSupport.q.members[1], lostSupport.q.members[1]]
});
assert.equal(supportHold.mode, 'hold', 'one duplicated rifle cannot sustain a naturally entered bound');
console.log(
  'PHASE_C_NATURAL_PRESSURE_ACCEPTANCE',
  JSON.stringify({
    preparedAt: natural.active.readyAt,
    admittedAt: natural.active.since,
    receivedPressure: natural.report.underFire,
    afterEmergency: emergencyHold.stage,
    cases: 7,
    stagedCandidate: true,
    physicalRouteVerified: true
  })
);

console.log(
  'PASS masked ambush native preparation, minimum hold, unsafe stations, authority/lifecycle invalidation and pressure hysteresis',
  JSON.stringify({ holdAt, readyAt, firstShot, shots: combat.b.events.fired })
);
