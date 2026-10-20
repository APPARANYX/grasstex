'use strict';
// Dismount must not erase a personally adopted order that Meso correctly coalesces.
const assert = require('node:assert/strict');
const H = require('./harness');
const { loadModule } = require('./module-loader');
H.resetIds();
const r = H.bootstrap({ search: '?commandMovement=1&commandRelay=0&stressAct=0&scoutsForward=0' });
loadModule(r, 'battle/movement-resolver.js');
const b = H.makeBattle(r, { seed: 57 });
const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 300 } });
q.state = 'advance';
q.commandPhase = 'approach';
const Q = r.BattleSquadStability,
  R = r.BattleMovementResolver;
Q.updateFireteams(q, b);
b.time = 3;
Q.updateFireteams(q, b);
const orders = q.members.map(s => ({
  s,
  envelope: s._fireteamAdoptedEnvelope,
  point: { ...s.orderDestination }
}));
assert.ok(orders.every(o => o.envelope && o.s._movementResolver.order));
for (const o of orders) {
  // The carrier has moved the body while the accepted infantry order is suspended.
  o.s.root.position.z -= 100;
  R.proposeCombat(o.s, o.s.root.position, b, 'hold');
  const at = { x: o.s.root.position.x, z: o.s.root.position.z };
  R.restoreAfterTransport(o.s, b);
  assert.equal(o.s.root.position.z, at.z, 'dismount cannot teleport');
  assert.deepEqual(o.s.orderDestination, o.point, 'accepted foot order survives dismount');
  assert.equal(o.s._movementResolver.combat, null, 'old combat hold is discarded');
}
Q.updateFireteams(q, b);
for (const o of orders) {
  assert.equal(o.s._fireteamAdoptedEnvelope, o.envelope, 'no new command/reception required');
  R.resolve(o.s, b);
  assert.ok(Math.hypot(o.s.destination.x - o.point.x, o.s.destination.z - o.point.z) < 0.01);
}
const start = orders.map(o => o.s.root.position.z);
H.run(r, b, 8);
assert.ok(
  orders.every((o, i) => o.s.root.position.z > start[i] + 2),
  'every soldier resumes physical walking'
);
// No committed order: do not invent a destination from a pending fireteam slot.
const s = orders[0].s;
R.resetSoldier(s);
s._fireteamDestination = { x: 999, z: 999 };
R.restoreAfterTransport(s, b);
assert.equal(s.orderDestination.z, s.root.position.z);
console.log('PASS transport dismount preserves adopted movement and resumes physical travel');
