'use strict';
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
function world(on = true, terrain = true, maneuver = false) {
  H.resetIds();
  const r = H.bootstrap({
    search:
      '?localPlan=1&coa=0&commandMovement=0&slStress=0&scoutsForward=0&stressAct=0' +
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
const holding = man.P.update(man.b, man.q);
assert.ok(holding && holding.mode === 'ambush');
holding.readyAt = man.b.time;
holding.stage = 'ready';
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
const ready = move.P.update(move.b, move.q);
ready.readyAt = move.b.time;
ready.stage = 'ready';
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
  gap = readGap.P.update(readGap.b, readGap.q);
gap.readyAt = readGap.b.time;
gap.stage = 'ready';
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
  supportLossStation = supportLoss.P.update(supportLoss.b, supportLoss.q);
supportLossStation.readyAt = supportLoss.b.time;
supportLossStation.stage = 'ready';
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
const nos = noSupport.P.update(noSupport.b, noSupport.q);
nos.readyAt = noSupport.b.time;
nos.stage = 'ready';
noSupport.q.inContact = true;
assert.equal(
  noSupport.P.update(noSupport.b, noSupport.q, { underFire: 1, fireSupport: [] }).mode,
  'hold',
  'an unsupported exposed advance is denied'
);

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
