'use strict';
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule, quietConsole } = require('./module-loader');
function world(search = '?localPlan=1&coveredBounds=1') {
  H.resetIds();
  const r = H.bootstrap({ modules: false, search });
  r.BattleModules = { registerSystem() {}, unitsFor: b => b._roster.us.concat(b._roster.ge) };
  loadModule(r, 'battle/battle-navigation.js', { console: quietConsole, location: r.location });
  loadModule(r, 'battle/movement-resolver.js', { console: quietConsole, location: r.location });
  loadModule(r, 'battle/modules/39-navigation-physicality-debug.js', {
    console: quietConsole,
    location: r.location
  });
  const b = H.makeBattle(r),
    q = H.addSquad(r, b, {
      id: 'us-0',
      faction: 'us',
      x: 0,
      z: -4,
      objective: { x: 0, z: 50 },
      composition: ['rifleman', 'rifleman', 'rifleman']
    });
  b.time = 5;
  b.obstacles = [];
  b.obstacles.__physicalFootprints = [];
  r.__battle__ = b;
  r.BattleNavigation.installScenario({ buildings: [] });
  q.inContact = true;
  q.state = 'engaged';
  q.commandPhase = 'capture';
  q._assaultAuthorized = true;
  const s = q.members[0],
    contact = { x: 0, z: 60, at: 5, confidence: 0.9, source: 'told' };
  s.target = { id: 900, root: { position: { x: 0, y: 0, z: 60 } } };
  r.SquadAI.soldierContact = () => contact;
  r.SquadAI.squadContactsMap = () => [contact];
  r.BattleLeases.define('bound', { priority: 1 });
  r.BattleLeases.grant(q, 'bound', 'squad-leader', 5, 15, 'fixture', 'expiry');
  return { r, b, q, s, contact, C: r.BattleCoverPositions, E: r.BattleEngagement };
}
function hedge(id = 'hedge', x = 0, z = 0) {
  return {
    id,
    physicalId: id,
    shape: 'obb',
    type: 'hedge',
    x,
    z,
    hx: 14,
    hz: 1,
    ux: 1,
    uz: 0,
    vx: 0,
    vz: 1,
    radius: 1,
    y: 0,
    height: 2,
    cover: 0.62
  };
}
function obstacles(w, obs) {
  w.b.obstacles = obs;
  obs.__physicalFootprints = obs;
  obs.__physicalVersion = 1;
}
function order(w) {
  w.E.resetSoldier(w.s);
  const e = w.E.stateOf(w.s);
  e.state = 'engage';
  e.boundOrder = true;
  w.E.updateSoldier(w.s, w.b);
  return e;
}
function assess(w, point) {
  return w.C.boundRoute(w.s, w.b, point, w.C.boundThreats(w.s, w.b));
}
const off = world('?coveredBounds=1');
assert.equal(off.C.coveredBoundsOn(), false, 'cannot activate without localPlan');
const legacy = order(off);
assert.equal(legacy.state, 'assault', 'default policy retains exposed legacy fallback');
assert.equal(legacy.coveredBound, undefined);
const open = world();
const denied = order(open);
assert.notEqual(denied.state, 'assault', 'no safe route never issues an objective rush');
assert.equal(denied.boundOrder, false);
assert.equal(denied.coveredBound.rejected, 1);
assert.equal(denied.assaultGoal, undefined);
const w = world();
obstacles(w, [Object.assign(hedge(), { type: 'wall', height: 1.1 })]);
// Lateral short movement stays behind the physical face from reported front contact.
assert.equal(assess(w, { x: 6, z: -4 }).eligible, true);
const frozen = JSON.stringify([w.q.objective, w.q.commandPhase, w.s.destination, w.s.eng]);
assert.deepEqual(assess(w, { x: 6, z: -4 }), assess(w, { x: 6, z: -4 }));
assert.equal(
  JSON.stringify([w.q.objective, w.q.commandPhase, w.s.destination, w.s.eng]),
  frozen,
  'eligibility has no command/stance/movement writes'
);
assert.equal(w.C.current(w.s, w.b), null, 'pure preview does not reserve');
const e = order(w);
assert.equal(e.state, 'bound', 'shipping Engagement adopts a safe real cover slot');
assert.equal(e.coveredBound.accepted, 1);
assert.ok(e.cover && w.C.current(w.s, w.b), 'one existing Engagement cover reservation');
assert.equal(e.stance, 'crouch', 'existing bound executor owns stance');
assert.ok(e.cover.z > w.s.root.position.z, 'actual selected goal advances');
// The exposed end-of-hedge flank is a negative control, not a rewarded lateral detour.
assert.equal(assess(w, { x: 16, z: -4 }).eligible, false);
Object.assign(w.s.root.position, { x: -18, z: 0 });
Object.assign(w.contact, { x: 60, z: 0 });
assert.equal(assess(w, { x: -15, z: 4 }).eligible, false, 'end-on flank loses the physical mask');
const flank = order(w);
assert.notEqual(flank.state, 'assault');
if (flank.coveredBound.accepted)
  assert.equal(assess(w, flank.cover).eligible, true, 'only a still-masked alternative can be adopted');
// Distant cover endpoints do not excuse an exposed middle segment.
const gap = world();
obstacles(gap, [
  Object.assign(hedge('left', -4, 0), { hx: 2 }),
  Object.assign(hedge('right', 4, 0), { hx: 2 })
]);
gap.s.root.position.x = -4;
assert.equal(assess(gap, { x: 4, z: -4 }).reason, 'exposed-route');
const blocked = world();
obstacles(blocked, [hedge()]);
assert.equal(
  assess(blocked, { x: 0, z: 4 }).reason,
  'nonstraight-route',
  'does not pretend a graph detour is checked'
);
// Hidden live-unit movement and opposite-faction truth cannot influence reported-coordinate safety.
const isolation = world();
obstacles(isolation, [hedge()]);
isolation.contact.unit = isolation.s.target;
const before = assess(isolation, { x: 6, z: -4 });
Object.assign(isolation.s.target.root.position, { x: -100, z: -100 });
H.addSquad(isolation.r, isolation.b, { id: 'ge-0', faction: 'ge', x: 0, z: -6, objective: { x: 0, z: -50 } });
assert.deepEqual(assess(isolation, { x: 6, z: -4 }), before);
isolation.contact.at = -10;
assert.equal(assess(isolation, { x: 6, z: -4 }).reason, 'unknown-contact');
isolation.contact.at = 100;
assert.equal(isolation.C.boundThreats(isolation.s, isolation.b).length, 0, 'future reports not accepted');
isolation.contact.at = 5;
isolation.contact.confidence = 0.1;
assert.equal(isolation.C.boundThreats(isolation.s, isolation.b).length, 0);
// Same-object restart: the existing Engagement reset removes nonempty decision counters.
assert.ok(w.E.coveredBoundTelemetry(w.b).attempts > 0);
w.q.members.forEach(s => w.E.resetSoldier(s));
w.b.time = 0;
assert.equal(w.E.coveredBoundTelemetry(w.b).attempts, 0);
assert.equal(w.C.boundThreats(w.s, w.b).length, 0);
console.log(
  'covered-bounds-check: PASS (safe shipping adoption, no-safe-route, exposed hedge/gap, observed-only geometry, OFF and restart)'
);
