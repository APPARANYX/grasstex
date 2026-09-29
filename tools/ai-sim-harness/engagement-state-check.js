/* Phase 1: transition ownership must preserve each pre-refactor entry path's effects. */
'use strict';
const assert = require('assert');
const H = require('./harness');
const r = H.bootstrap(),
  E = r.BattleEngagement;
assert(E.states && E.requestState, 'Engagement declares states and owns external state requests');
const b = H.makeBattle(r, { seed: +(process.env.HARNESS_SEED || 12345) });
const q = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
const s = q.members[1],
  e = E.stateOf(s);
assert.deepStrictEqual(Object.keys(E.states).sort(), [
  'advance',
  'alert',
  'assault',
  'bound',
  'engage',
  'orient',
  'pinned',
  'station',
  'withdraw'
]);
for (const def of Object.values(E.states)) {
  for (const key of ['meaning', 'enteredBy', 'exits', 'rate', 'next']) assert(def[key], key);
  for (const next of def.next) assert(E.states[next], 'transition names a declared state');
}
b.time = 7;
e.state = 'pinned';
e.since = 2;
e.until = 3;
e.setUpSince = 4;
e.assaultGoal = { x: 1, z: 2 };
e.moveReason = 'old';
E.requestState(s, b, 'urgent-cover', 2.25);
assert.strictEqual(e.state, 'bound');
assert.strictEqual(e.since, 7);
assert.strictEqual(e.until, 9.25);
assert.strictEqual(e.setUpSince, 4);
assert.strictEqual(e.moveReason, 'old');
assert.deepStrictEqual(e.assaultGoal, { x: 1, z: 2 });
assert.strictEqual(e.transition.reason, 'suppressed cover move');
e.state = 'advance';
b.time = 9;
E.requestState(s, b, 'shared-contact', 1.8);
assert.strictEqual(e.state, 'alert');
assert.strictEqual(e.since, 9);
assert.strictEqual(e.until, 10.8);
assert.strictEqual(e.setUpSince, 4);
assert.strictEqual(e.moveReason, 'old');
e.state = 'station';
e.cover = { x: 5, z: 6 };
E.requestState(s, b, 'station-release');
assert.strictEqual(e.state, 'advance');
assert.strictEqual(e.since, 9);
assert.strictEqual(e.until, 10.8);
assert.strictEqual(e.cover, null);
assert.strictEqual(e.setUpSince, 0);
assert.strictEqual(e.moveReason, 'old');
assert.throws(() => E.requestState(s, b, 'unknown'), /request/);
assert.throws(() => E.requestState(s, b, 'urgent-cover', 2), /transition/);
// A normal same-state entry renews until but preserves since and transition side effects.
e.state = 'withdraw';
e.since = 1;
e.until = 99;
e.moveReason = 'old';
q.state = 'retreat';
E.updateSoldier(s, b);
assert.strictEqual(e.since, 1);
assert.strictEqual(e.until, 9);
assert.strictEqual(e.moveReason, 'old');
q.state = 'advance';
s.target = q.members[0];
e.state = 'advance';
E.updateSoldier(s, b);
assert.strictEqual(e.state, 'orient');
assert.strictEqual(e.since, 9);
assert.strictEqual(e.transition.reason, 'contact');
assert.strictEqual(e.moveReason, 'contact');
console.log('PASS Engagement state definitions, request guards and legacy entry/timing effects');
