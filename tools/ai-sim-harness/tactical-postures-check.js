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
assert.equal(staged.orders.length, 0, 'posture does not become a second destination writer');
assert.equal(move.r.BattleLeases.get(move.q, 'bound'), null, 'eligibility never directly grants a bound');
assert.equal(move.P.current(move.b, move.q).mode, 'maneuver');
/* Commander ticks refresh the evidence cadence, rather than skipping 14
   seconds (which would correctly revoke an unobserved posture entirely). */
let finish = null;
for (let i = 0; i < 45; i++) {
  move.b.time += 0.4;
  finish = move.P.update(move.b, move.q, { fireSupport: move.q.members.slice(1, 4) });
  if (finish && finish.mode === 'hold') break;
}
assert.ok(
  finish && finish.mode === 'hold',
  'finite maneuver window closes to defensive hold under normal update cadence'
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

console.log(
  'PASS masked ambush native preparation, minimum hold, unsafe stations, authority/lifecycle invalidation and pressure hysteresis',
  JSON.stringify({ holdAt, readyAt, firstShot, shots: combat.b.events.fired })
);
