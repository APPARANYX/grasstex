#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const H = require('./harness');
const r = H.bootstrap();
const b = H.makeBattle(r, { seed: 31 });
const sq = H.addSquad(r, b, {
  id: 'us-0',
  faction: 'us',
  x: 0,
  z: 0,
  objective: { x: 0, z: 120 },
  facing: 0
});
const C = r.BattleCommandReception;
const s = sq.members[1];
const other = sq.members[2];
const read = () => C.adoptedView(s, b, 'movement', 'test');
const issue = signature =>
  C.publish(sq, b, 'movement', [s, other], {
    scope: 'test',
    action: 'move',
    signature,
    point: { x: 25, z: 40 },
    data: { publishKey: signature, urgent: false }
  });
assert.equal(read(), null);
assert.equal(b._commandReception, undefined, 'empty read must not initialize state');
const envelope = issue('first');
assert.equal(read(), null, 'pending order is not adopted');
b.time = 10;
const first = read();
assert.ok(first);
assert.equal(first.envelopeId, envelope.id);
assert.equal(first.countedAdopted, undefined);
assert.ok(Object.isFrozen(first));
assert.ok(Object.isFrozen(first.data));
assert.ok(Object.isFrozen(first.point));
for (const mutate of [
  () => {
    first.version = 99;
  },
  () => {
    first.data.publishKey = 'bad';
  },
  () => {
    first.point.x = 99;
  }
]) {
  assert.throws(mutate, TypeError);
}
for (let i = 0; i < 1000; i++) assert.equal(read(), first, 'unchanged adopted slot reuses its read model');
b.time = 11;
assert.equal(read(), first, 'advancing time alone cannot invalidate an adopted order');
const copy = C.adopted(s, b, 'movement', 'test');
assert.deepEqual(copy, first);
assert.notEqual(copy, first);
copy.point.x = -1;
copy.data.publishKey = 'external';
copy.version = 99;
const snapshot = C.snapshot(s, b);
snapshot.adopted['movement|test'].point.z = -1;
assert.equal(read().point.x, 25);
assert.equal(read().point.z, 40);
assert.equal(read().data.publishKey, 'first');
assert.equal(read().version, 1);
assert.notEqual(C.adoptedView(other, b, 'movement', 'test'), first, 'recipients own separate records');
const secondEnvelope = issue('second');
assert.equal(read(), first, 'a pending replacement retains the prior adopted view');
b.time = 20;
const second = read();
assert.notEqual(second, first);
assert.equal(second.envelopeId, secondEnvelope.id);
assert.equal(first.data.publishKey, 'first', 'retained historical view remains immutable');
const before = JSON.stringify(C.telemetry(b));
for (let i = 0; i < 1000; i++) read();
assert.equal(JSON.stringify(C.telemetry(b)), before, 'repeated reads do not double-count adoption');
C.reset(b);
assert.equal(read(), null, 'reset releases the canonical slot');
assert.equal(b._commandReception, undefined);
b.time = 0;
issue('restart');
b.time = 10;
assert.notEqual(read(), first, 'reused envelope serial after reset must not reuse a prior battle view');
assert.equal(read().data.publishKey, 'restart');
console.log(
  'PASS immutable adopted read models: identity, isolation, replacement, recipients, copy compatibility and reset'
);
