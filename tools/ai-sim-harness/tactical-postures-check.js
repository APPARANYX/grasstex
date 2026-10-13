'use strict';
// Policy-seam fixtures supply support reports; effective-fire truth is tested
// separately by effective-fire-support and native covered-fire-maneuver checks.
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
function world(on = true, terrain = true, maneuver = false, options = {}) {
  H.resetIds();
  const r = H.bootstrap({
    search:
      '?effectiveFire=0&localPlan=1&coa=0&commandMovement=' +
      (options.commandMovement ? '1' : '0') +
      '&slStress=0&scoutsForward=0&stressAct=0' +
      (on ? '&localAmbush=1' : '') +
      (maneuver ? '&localManeuver=1&coveredBounds=1' : '')
  });
  const load = f => loadModule(r, f, { console: quietConsole, location: r.location });
  load('battle/movement-resolver.js');
  load('battle/battle-navigation.js');
  load('battle/modules/39-navigation-physicality-debug.js');
  const scene = { buildings: [], roads: [] },
    b = H.makeBattle(r, {
      heightAt: (x, z) => (terrain ? (options.crestHeight || 1.4) * Math.exp(-Math.pow((z - 8) / 1.4, 2)) : 0)
    });
  if (options.commandMovement) b._movementRoot = r;
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
  q.commandPhase = 'assault'; // Capture-mission fixture: General has approved bounds.
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
  continuityConfidence = 0.6,
  continuityZ = 20;
confidenceContinuity.r.SquadAI.squadContactsMap = () =>
  continuityLive
    ? [
        {
          x: 0,
          z: continuityZ,
          at: 0,
          confidence: continuityConfidence,
          targetId: 'continuity-threat',
          sector: 2,
          source: 'told'
        }
      ]
    : [];
const continuityPosture = confidenceContinuity.P.update(confidenceContinuity.b, confidenceContinuity.q);
assert.ok(continuityPosture && continuityPosture.mode === 'ambush');
continuityConfidence = 0.49;
continuityZ = -20; // sub-threshold motion cannot move the detached threat reference.
let continuityReady = null;
H.run(confidenceContinuity.r, confidenceContinuity.b, 6, () => {
  const state = confidenceContinuity.P.current(confidenceContinuity.b, confidenceContinuity.q);
  if (state?.readyAt != null) continuityReady = state;
});
assert.ok(
  continuityReady,
  'same fresh underlying report survives confidence-floor crossing through the mandatory dwell'
);
assert.equal(
  continuityReady.threats[0].z,
  20,
  'sub-threshold belief motion cannot drag a prepared firing line away from its detached report'
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
const physicalEndpoint = world(true, true, false, { commandMovement: true, crestHeight: 1.3 });
const physicalPosture = physicalEndpoint.P.update(physicalEndpoint.b, physicalEndpoint.q);
assert.ok(physicalPosture && physicalPosture.orders.length >= 3);
physicalEndpoint.r.BattleSoldierPersonalSpace = {
  resolveDestination(sim, soldier, goal, kind) {
    return kind === 'formation' ? { x: goal.x + 0.9, z: goal.z } : goal;
  }
};
let physicalReady = null;
H.run(physicalEndpoint.r, physicalEndpoint.b, 14, () => {
  // Keep the controlled report live while real receipt and movement settle.
  // This fixture tests endpoints; stale-intel expiry has its own negative case.
  physicalEndpoint.r.SquadAI.rememberReportedContact(physicalEndpoint.q.members[0], physicalEndpoint.b, {
    x: 0,
    z: 20,
    observedAt: physicalEndpoint.b.time,
    confidence: 1,
    sourceSoldier: 999,
    source: 'heard',
    combatThreat: true
  });
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
  physicalHeld.some(
    ({ soldier, order }) =>
      Math.hypot(soldier.root.position.x - order.point.x, soldier.root.position.z - order.point.z) > 0.5
  ),
  'regression must exercise a legal physical endpoint displaced from the abstract post'
);
assert.ok(
  physicalHeld.every(({ soldier, order }) => {
    const outcome = physicalEndpoint.r.BattleExecutionOutcome.man(soldier, physicalEndpoint.b);
    return (
      outcome.current &&
      (outcome.state === 'completed' || outcome.state === 'held') &&
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
// Readiness hands the verified physical post to quiet Micro observation.
// The old abstract destination is still offset, but must not restart a march
// while these same men stand up to look for their own first-hand contact.
const heldBodies = physicalHeld.map(({ soldier }) => ({
  id: soldier.id,
  x: soldier.root.position.x,
  z: soldier.root.position.z
}));
H.run(physicalEndpoint.r, physicalEndpoint.b, 0.6);
assert.ok(physicalEndpoint.P.current(physicalEndpoint.b, physicalEndpoint.q));
assert.ok(
  physicalHeld.every(({ soldier }, i) => {
    const anchor = heldBodies[i];
    const last = soldier._movementResolver?.last;
    return (
      Math.hypot(soldier.root.position.x - anchor.x, soldier.root.position.z - anchor.z) <= 0.05 &&
      !soldier.moving &&
      last?.owner === 'engagement' &&
      last.kind === 'hold'
    );
  }),
  'prepared observation holds the actual posts instead of resuming the offset formation destinations'
);
assert.equal(physicalEndpoint.b.events.fired, 0, 'quiet observation never invents fire authority');
assert.equal(physicalEndpoint.r.BattleLeases.get(physicalEndpoint.q, 'bound'), null);

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
let contactHoldSamples = 0;
H.run(combat.r, combat.b, 10, () => {
  if (combat.b.events.fired && firstShot == null) firstShot = combat.b.time;
  const st = combat.P.current(combat.b, combat.q);
  if (
    st?.readyAt != null &&
    st.stage === 'contact' &&
    combat.q.members.some(
      s =>
        s.eng?.state === 'engage' &&
        s._movementResolver?.last?.owner === 'engagement' &&
        s._movementResolver?.last?.kind === 'hold'
    )
  )
    contactHoldSamples++;
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
assert.ok(contactHoldSamples > 0, 'a ready firing line survives the native Engagement aim/fire handoff');
assert.equal(
  combat.P.summary(combat.b).releaseReasons['prepared fireteam left firing line'] || 0,
  0,
  'holding and firing from the prepared line is not leaving it'
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
  revision: () => 0,
  station: () => null,
  update: () => false,
  current: s => (s === stationedMan ? { owner: 'emplacement' } : null)
};
const stationedPosture = station.P.update(station.b, station.q);
assert.ok(stationedPosture, 'remaining riflemen may form a masked line without station-owned specialist');
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
  station.P.soldierOrder(assignedMan, station.b),
  null,
  'a separately committed actor cannot consume an old posture order'
);
assert.ok(
  station.P.update(station.b, station.q),
  'an extra actor reassignment retains the remaining element'
);
assert.ok(!stationedPosture.orders.some(o => o.soldierId === String(assignedMan.id)));

/* One exposed rifleman must not cancel a real three-plus-rifle masked
   element, but never receives a fake covered order himself. Two viable masked
   stations are deliberately insufficient for an ambush. */
/* A real masked approach post with a pop-up firing ray should win over
   the first equally masked post that has no line of fire. Previewing must
   neither mutate a soldier nor issue fire authority. */
const popUpPosts = world(true, true, true);
const popUpCover = popUpPosts.r.BattleCoverPositions;
popUpCover.maskedPost = () => true;
popUpCover.maskedApproach = () => true;
popUpCover.candidates = s => [{ x: s.root.position.x, z: 2 }];
popUpPosts.r.SquadAI.canSuppressStanding = s => Math.abs(s.root.position.z - 2) < 0.001;
const popUpStart = popUpPosts.q.members.map(s => ({ x: s.root.position.x, z: s.root.position.z }));
const popUp = popUpPosts.P.update(popUpPosts.b, popUpPosts.q);
assert.ok(popUp && popUp.orders.length >= 3, 'the existing masked-post gate still applies');
assert.ok(
  popUp.orders.every(o => o.point.z === 2),
  'a physically shootable standing ray wins over a blocked concealed first option'
);
assert.deepEqual(
  popUpPosts.q.members.map(s => ({ x: s.root.position.x, z: s.root.position.z })),
  popUpStart,
  'the standing-ray preview never changes a soldier position'
);
const blockedPosts = world(true, true, true);
blockedPosts.r.BattleCoverPositions.maskedPost = () => true;
blockedPosts.r.BattleCoverPositions.maskedApproach = () => true;
blockedPosts.r.BattleCoverPositions.candidates = s => [{ x: s.root.position.x, z: 2 }];
blockedPosts.r.SquadAI.canSuppressStanding = () => false;
const blocked = blockedPosts.P.update(blockedPosts.b, blockedPosts.q);
assert.ok(blocked && blocked.orders.length >= 3, 'valid masked fallback remains eligible');
assert.ok(
  blocked.orders.every(o => o.point.z === 0),
  'no shootable alternative retains the original concealed post'
);

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
/* Fire-and-maneuver formation: a WHOLE alpha fireteam may be staged as
   actual pre-contact cover reserve only if independent physicality proves
   masked origins with safe exits AND two shootable rifles remain in the
   firing element. This is the shipping Squad Leader planning path on real
   crest geometry; no actor positioning or acceptance metric is injected. */
function setReserveTeam(x) {
  x.q.members.forEach((s, i) => {
    s._fireteamKey = i < 2 ? 'command' : i < 5 ? 'alpha' : i < 8 ? 'bravo' : 'charlie';
  });
}
const reservePositive = world(true, true, true);
setReserveTeam(reservePositive);
const reservePosture = reservePositive.P.update(reservePositive.b, reservePositive.q);
assert.ok(reservePosture, 'real masked firing-line plan is still produced');
const reserveOrders = reservePosture.orders.filter(o => o.reserve);
assert.equal(
  reserveOrders.length === 0 || reserveOrders.length === 3,
  true,
  'never reserve a partial alpha team'
);
assert.ok(
  reservePosture.orders.filter(o => !o.reserve).length >= 3,
  'reserve staging never steals the three firing posts'
);
if (reserveOrders.length) {
  const reserveIds = reservePositive.q.members.filter(s => s._fireteamKey === 'alpha').map(s => String(s.id));
  assert.deepEqual(
    reserveOrders.map(o => o.soldierId).sort(),
    reserveIds.sort(),
    'whole alpha fireteam is the sole reserve'
  );
  for (const order of reserveOrders) {
    const soldier = reservePositive.q.members.find(s => String(s.id) === order.soldierId);
    const threat = { x: 0, z: 20, at: 0, confidence: 1 };
    assert.equal(
      reservePositive.r.SquadAI.hasLineOfSight(
        { root: { position: order.point }, crouching: true },
        { root: { position: threat } },
        reservePositive.b.heightAt,
        reservePositive.b.obstacles
      ),
      false,
      'reserve really starts behind terrain masking'
    );
    assert.equal(soldier._fireteamKey, 'alpha');
  }
}
const reserveBlocked = world(true, true, true);
setReserveTeam(reserveBlocked);
reserveBlocked.r.BattleCoverPositions.boundRoute = () => ({ eligible: false });
const blockedPosture = reserveBlocked.P.update(reserveBlocked.b, reserveBlocked.q);
assert.ok(blockedPosture && blockedPosture.orders.length >= 3);
assert.equal(
  blockedPosture.orders.some(o => o.reserve),
  false,
  'physically invalid routes do not create reserve orders or steal the original firing plan'
);

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
/* A physically plausible covered maneuver is NOT authorization if the
   General says defend. The upstream policy must agree with the native
   fire-and-movement phase gate, rather than count a phantom maneuver. */
const defensive = world(true, true, true);
const preparedDefense = nativePreparedLine(defensive);
assert.ok(preparedDefense.readyAt != null);
defensive.q.commandPhase = 'defend';
defensive.q.inContact = true;
const defensiveSupport = {
  underFire: 2,
  fireSupport: defensive.q.members.slice(1, 4)
};
const defensiveHold = defensive.P.update(defensive.b, defensive.q, defensiveSupport);
assert.ok(defensiveHold && defensiveHold.mode === 'hold');
assert.equal(defensiveHold.lastManeuverDecision.phaseAllowsBound, false);
assert.equal(defensiveHold.lastManeuverDecision.reason, 'general-phase-holds');
assert.equal(defensive.P.summary(defensive.b).coveredManeuvers, 0);
assert.equal(defensive.r.BattleLeases.get(defensive.q, 'bound'), null);

/* An attacking Squad Leader may move behind an established, real base
   of fire even if its own opening volley precedes enemy return fire.
   Keep zero-pressure, fresh own-squad contact and genuine covered route.
   Assigned-only/one-man support never starts the maneuver. */
const initiative = world(true, true, true);
const initiativeMan = initiative.q.members[0],
  initiativeCover = initiative.r.BattleCoverPositions;
const initiativeThreats = [{ x: 0, z: 20, at: 0, confidence: 1 }];
const initiativeRoute = paths
  .map(z => ({ x: initiativeMan.root.position.x, z }))
  .find(p => initiativeCover.boundRoute(initiativeMan, initiative.b, p, initiativeThreats).eligible);
assert.ok(initiativeRoute, 'live terrain has a valid short covered route');
initiativeCover.candidates = () => [initiativeRoute];
const initiativeReady = nativePreparedLine(initiative);
assert.equal(initiativeReady.stage, 'ready');
initiative.q.inContact = true;
assert.ok(
  initiative.q._localTask.inputs.pressure < initiative.P.tuning.pressureEnter,
  'the initiative scenario has no incoming tactical pressure'
);
const noBase = initiative.P.update(initiative.b, initiative.q, {
  underFire: 0,
  fireSupport: [initiative.q.members[1]]
});
assert.equal(noBase.mode, 'ambush', 'one effective rifle cannot authorize a proactive bound');
const initiativeBound = initiative.P.update(initiative.b, initiative.q, {
  underFire: 0,
  fireSupport: initiative.q.members.slice(1, 4)
});
assert.equal(initiativeBound.mode, 'maneuver', 'two effective rifles permit a safe assault-bound review');
assert.equal(initiativeBound.lastManeuverDecision.reason, 'authorized');
assert.equal(initiative.r.BattleLeases.get(initiative.q, 'bound'), null, 'posture never writes bounds');

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
actorReassign.r.BattleTacticalPositions = {
  current: () => null,
  revision: () => 0,
  station: () => null,
  update: () => false
};
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
const heldReassigned = actorReassign.q.members.find(s => String(s.id) === reassignedReady.heldActorIds[0]);
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
const lagging = partialCore.q.members.find(
  s => String(s.id) === core.orders[core.orders.length - 1].soldierId
);
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
assert.ok(
  partialReady && partialReady.heldActorIds.length === 3,
  'three stationary adopted men form one held line'
);
assert.ok(
  !partialReady.heldActorIds.includes(String(lagging.id)),
  'lagging fourth cannot count toward readiness'
);
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
  const observed = x.P.update(x.b, x.q);
  assert.equal(observed.mode, 'ambush', 'commander report gap cannot destroy a ready firing line');
  assert.equal(x.r.BattleLeases.get(x.q, 'bound'), null, 'missing support report never authorizes movement');
  const awaiting = x.P.update(x.b, x.q, { ...report, fireSupport: [] });
  assert.equal(awaiting.mode, 'hold', 'an actual empty support report denies maneuver');
  assert.ok(awaiting.orders.length >= 3, 'prepared hold preserves adopted posts for native defensive fire');
  assert.equal(x.r.BattleLeases.get(x.q, 'bound'), null);
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

/* Concealment is a PREPARATION criterion. Before readiness a post the fresh
   reported picture can see is abandoned; a READY line whose post becomes
   visible from a reported coordinate is compromised, not dissolved, because
   marching the men back into formation is the exposed move. The same rule
   splits the old catch-all release into specific reasons. */
const visibleWalker = x => [
  { x: 0, z: 4, at: x.b.time, confidence: 1, targetId: 'walker', sector: '0:0', source: 'told' }
];
const unreadyMask = world();
assert.ok(unreadyMask.P.update(unreadyMask.b, unreadyMask.q));
unreadyMask.r.SquadAI.squadContactsMap = () => visibleWalker(unreadyMask);
assert.equal(
  unreadyMask.P.update(unreadyMask.b, unreadyMask.q),
  null,
  'an unready post that lost masking is abandoned'
);
assert.equal(unreadyMask.P.summary(unreadyMask.b).releaseReasons['firing station lost masking/ray'], 1);
/* An extra rifleman losing his masked post must not cancel the three
   independently safe members; he loses his order and cannot contribute to
   the four-second held-core timer. Losing a held core member still fails
   closed, even when the squad has spare concealed participants. */
const extraMask = world();
const extraPosture = extraMask.P.update(extraMask.b, extraMask.q);
assert.ok(extraPosture && extraPosture.orders.length >= 4, 'fixture requires a real surplus post');
const extraOrder = extraPosture.orders[extraPosture.orders.length - 1];
const originalMask = extraMask.r.BattleCoverPositions.maskedPost;
extraMask.r.BattleCoverPositions.maskedPost = (battle, p, reports) =>
  Math.hypot(p.x - extraOrder.point.x, p.z - extraOrder.point.z) > 0.05 && originalMask(battle, p, reports);
const remainingLine = extraMask.P.update(extraMask.b, extraMask.q);
assert.equal(remainingLine, extraPosture, 'uncompromised firing element stays in place');
assert.equal(remainingLine.orders.length, extraPosture.members.length - 1);
assert.ok(
  remainingLine.orders.every(o => o.soldierId !== extraOrder.soldierId),
  'exposed surplus member no longer receives a posture order'
);
assert.equal(
  extraMask.P.summary(extraMask.b).releaseReasons['firing station lost masking/ray'] || 0,
  0,
  'a single exposed surplus man is not a whole-line failure'
);
const heldMask = world();
const heldPosture = heldMask.P.update(heldMask.b, heldMask.q);
let heldMaskCore = null;
for (let i = 0; i < 45 && !heldMaskCore; i++) {
  H.run(heldMask.r, heldMask.b, 0.15);
  const current = heldMask.P.current(heldMask.b, heldMask.q);
  if (current && current.stage === 'hold' && current.heldActorIds.length === 3) heldMaskCore = current;
}
assert.ok(heldMaskCore && heldMaskCore.orders.length > 3, 'fixture needs a held core and an extra man');
const threatenedOrder = heldMaskCore.orders.find(o => o.soldierId === heldMaskCore.heldActorIds[0]);
const beforeMask = heldMask.r.BattleCoverPositions.maskedPost;
heldMask.r.BattleCoverPositions.maskedPost = (battle, p, reports) =>
  Math.hypot(p.x - threatenedOrder.point.x, p.z - threatenedOrder.point.z) > 0.05 &&
  beforeMask(battle, p, reports);
assert.equal(
  heldMask.P.update(heldMask.b, heldMask.q),
  null,
  'a held core member losing concealment cannot silently borrow a spare man or his dwell'
);

const readyMask = world();
const readyMaskLine = nativePreparedLine(readyMask);
assert.equal(readyMaskLine.stage, 'ready');
assert.equal(readyMaskLine.compromisedAt, null);
readyMask.r.SquadAI.squadContactsMap = () => visibleWalker(readyMask);
const compromised = readyMask.P.update(readyMask.b, readyMask.q);
assert.ok(
  compromised && compromised.readyAt != null,
  'a ready line keeps its posts when a reported coordinate can see them'
);
assert.ok(Number.isFinite(compromised.compromisedAt), 'the compromise is recorded on the posture');
assert.equal(readyMask.P.summary(readyMask.b).compromisedLines, 1);
assert.equal(readyMask.P.summary(readyMask.b).releaseReasons['firing station lost masking/ray'] || 0, 0);
const staleUnready = world();
assert.ok(staleUnready.P.update(staleUnready.b, staleUnready.q));
staleUnready.r.SquadAI.squadContactsMap = () => [];
assert.equal(staleUnready.P.update(staleUnready.b, staleUnready.q), null);
assert.equal(
  staleUnready.P.summary(staleUnready.b).releaseReasons['no-fresh-reported-threat'],
  1,
  'stale intel before readiness is a specific release, not an unknown override'
);
const ambiguousUnready = world();
assert.ok(ambiguousUnready.P.update(ambiguousUnready.b, ambiguousUnready.q));
ambiguousUnready.r.SquadAI.squadContactsMap = () =>
  [0, 1, 2, 3].map(i => ({ x: i * 25, z: 20, at: ambiguousUnready.b.time, confidence: 1, sector: i + ':1' }));
assert.equal(ambiguousUnready.P.update(ambiguousUnready.b, ambiguousUnready.q), null);
assert.equal(ambiguousUnready.P.summary(ambiguousUnready.b).releaseReasons['ambiguous-threat-picture'], 1);
assert.deepEqual(
  ambiguousUnready.P.releases(ambiguousUnready.q).map(r => [r.serial, r.reason, r.prepared]),
  [[1, 'ambiguous-threat-picture', false]],
  'the bounded release log names the serial, reason and preparation state'
);

/* A prepared line that Engagement reports IN CONTACT is held by positional
   continuity of the same three identities at their verified posts, not by
   Engagement's movement labels or a one-tick `moving` flag. Its posts survive
   a transient core failure under pressure; a man who actually leaves his
   post still breaks the core, and an aged-out or ambiguous picture cannot
   dissolve a line that is already fighting. */
const contactLine = world(true, true, true);
const contactReady = nativePreparedLine(contactLine);
assert.equal(contactReady.stage, 'ready');
contactLine.q.inContact = true;
contactLine.S.localPlan.update(contactLine.b, contactLine.q, { underFire: 3, fireSupport: [] });
const pressured = contactLine.P.update(contactLine.b, contactLine.q, { underFire: 3, fireSupport: [] });
assert.equal(pressured.mode, 'hold');
assert.equal(pressured.lastManeuverDecision.reason, 'insufficient-support');
assert.ok(pressured.orders.length >= 3, 'the prepared hold keeps publishing its posts');
const jitterMan = contactLine.q.members.find(s => String(s.id) === pressured.heldActorIds[0]);
jitterMan.moving = true;
jitterMan._movementResolver = { last: { owner: 'engagement', kind: 'contact-reaction' } };
contactLine.b.time += 0.15;
const jittered = contactLine.P.update(contactLine.b, contactLine.q, { underFire: 3, fireSupport: [] });
assert.equal(jittered.mode, 'hold');
assert.equal(
  jittered.lastManeuverDecision.coreReady,
  true,
  'a stationary man at his post holds the line whatever Micro labels his hold'
);
assert.ok(jittered.orders.length >= 3, 'the posts are not wiped by Micro jitter');
jitterMan.moving = false;
jitterMan.root.position.x += 1.2;
contactLine.b.time += 0.15;
const walkedOff = contactLine.P.update(contactLine.b, contactLine.q, { underFire: 3, fireSupport: [] });
assert.equal(walkedOff.mode, 'hold');
assert.equal(walkedOff.lastManeuverDecision.reason, 'held-core-invalid', 'leaving the post breaks the core');
assert.ok(
  walkedOff.orders.length >= 3,
  'the remaining posts stay published while the squad fights from them'
);
assert.equal(contactLine.r.BattleLeases.get(contactLine.q, 'bound'), null);
jitterMan.root.position.x -= 1.2;
contactLine.b.time += 0.15;
contactLine.r.SquadAI.squadContactsMap = () => [];
const agedOut = contactLine.P.update(contactLine.b, contactLine.q, { underFire: 3, fireSupport: [] });
assert.ok(agedOut && agedOut.mode === 'hold', 'an aged-out picture cannot dissolve a line in contact');
assert.equal(agedOut.lastManeuverDecision.coreReady, true);
assert.deepEqual(agedOut.threats, [], 'without a fresh detached coordinate no route can be judged');
contactLine.r.SquadAI.squadContactsMap = () =>
  [0, 1, 2, 3].map(i => ({ x: i * 25, z: 20, at: contactLine.b.time, confidence: 1, sector: i + ':1' }));
contactLine.b.time += 0.15;
assert.ok(
  contactLine.P.update(contactLine.b, contactLine.q, { underFire: 3, fireSupport: [] }),
  'an ambiguous picture cannot dissolve a line in contact'
);
const quietContact = world();
const quietReady = nativePreparedLine(quietContact);
assert.equal(quietReady.stage, 'ready');
quietContact.q.inContact = true;
quietContact.b.time += 0.15;
assert.equal(quietContact.P.update(quietContact.b, quietContact.q).stage, 'contact');
quietContact.r.SquadAI.squadContactsMap = () => [];
quietContact.b.time += 0.15;
const contactKept = quietContact.P.update(quietContact.b, quietContact.q);
assert.ok(
  contactKept && contactKept.stage === 'contact',
  'a coordinated contact outlives its triggering report'
);
quietContact.q.inContact = false;
quietContact.b.time += 0.15;
assert.equal(quietContact.P.update(quietContact.b, quietContact.q), null, 'contact ending releases the line');
assert.equal(quietContact.P.summary(quietContact.b).releaseReasons['contact ended'], 1);

/* During the pre-ready dwell a held man who is still CLOSING on his post
   (Movement completes inside its own tolerance, then keeps closing, so his
   `moving` flag flickers) stays held and the dwell keeps accruing; a held man
   who moves away from his post beyond where he was chosen breaks the core. */
const closing = world();
assert.ok(closing.P.update(closing.b, closing.q));
let holding3 = null;
for (let i = 0; i < 40 && !holding3; i++) {
  H.run(closing.r, closing.b, 0.15);
  const st = closing.P.current(closing.b, closing.q);
  if (st && st.stage === 'hold' && st.heldActorIds.length === 3) holding3 = st;
}
assert.ok(holding3 && holding3.readyAt == null, 'fixture needs a held, not yet ready, core');
const heldSince = holding3.heldSince,
  heldIds = holding3.heldActorIds.slice(),
  closer = closing.q.members.find(s => String(s.id) === heldIds[0]),
  closerOrder = holding3.orders.find(o => o.soldierId === heldIds[0]);
closer.moving = true;
closer.root.position.x = closerOrder.point.x + 0.3;
closer.root.position.z = closerOrder.point.z;
closing.b.time += 0.15;
const stillHeld = closing.P.update(closing.b, closing.q);
assert.ok(stillHeld && stillHeld.stage === 'hold', 'closing on the post keeps the line in hold');
assert.deepEqual(stillHeld.heldActorIds, heldIds, 'the held core is not rotated by a closing man');
assert.equal(stillHeld.heldSince, heldSince, 'the dwell is not restarted by a closing man');
closer.moving = false;
const leaver = closing.q.members.find(s => String(s.id) === heldIds[1]),
  leaverOrder = holding3.orders.find(o => o.soldierId === heldIds[1]);
leaver.root.position.x = leaverOrder.point.x + 0.9;
leaver.root.position.z = leaverOrder.point.z;
closing.b.time += 0.15;
const broken = closing.P.update(closing.b, closing.q);
assert.ok(broken, 'an unready line reselects rather than ends when a held man steps off his post');
assert.ok(
  broken.heldSince !== heldSince || broken.heldActorIds.indexOf(heldIds[1]) < 0,
  'moving away from the post does break the held core'
);

console.log(
  'PASS masked ambush native preparation, minimum hold, unsafe stations, authority/lifecycle invalidation and pressure hysteresis',
  JSON.stringify({ holdAt, readyAt, firstShot, shots: combat.b.events.fired })
);
