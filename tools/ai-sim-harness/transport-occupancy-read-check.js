#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const { loadModule, quietConsole } = require('./module-loader');
const root = { BattleModules: { registerSystem() {} } };
loadModule(root, 'battle/core-runtime.js', { console: quietConsole });
loadModule(root, 'battle/modules/58-strategic-abstract-transport.js', { console: quietConsole });
const T = root.BattleSquadTransport;
const squad = {};
const first = { id: 1, squad },
  second = { id: 2, squad };
for (const phase of ['boarding', 'embarked', 'disembarking', 'dismounted', 'aborted']) {
  for (const admitted of [false, true])
    for (const exited of [false, true]) {
      const t = (squad._transport = {
        phase,
        vehicleId: 'truck-a',
        access: true,
        boardedIds: admitted ? [1, 2] : [2],
        exitedIds: exited ? [1] : [],
        boardingOrder: [1, 2],
        boardedCount: 2
      });
      const active = ['boarding', 'embarked', 'disembarking'].includes(phase);
      assert.equal(T.isPassenger(first), active);
      // Preserve the existing fully-embarked legacy read as distinct from incremental boarding/dismount.
      assert.equal(
        T.carrierId(first),
        active && (phase === 'embarked' || (admitted && !exited)) ? 'truck-a' : null
      );
      const ids = T.seatedIds(squad);
      assert.deepEqual(
        ids,
        t.boardedIds.filter(id => !t.exitedIds.includes(id))
      );
      ids.push(99);
      assert.ok(!T.seatedIds(squad).includes(99), 'detached projection');
    }
}
squad._transport = {
  phase: 'boarding',
  vehicleId: 'truck-b',
  access: true,
  boardingOrder: [2, 1],
  boardedCount: 1
};
assert.deepEqual(T.seatedIds(squad), [2], 'preserve historical presentation prefix fallback');
assert.equal(T.carrierId(second), null, 'prefix-only visual history does not manufacture admission for LOS');
squad._transport.phase = 'embarked';
assert.equal(T.carrierId(second), 'truck-b');
squad._transport = { phase: 'embarked', vehicleId: 'truck-c' };
assert.equal(T.seatedIds(squad), null, 'legacy non-access presentation retains its path');
assert.equal(T.carrierId(first), 'truck-c', 'replacement read immediately');
squad._transport = null;
assert.equal(T.isPassenger(first), false);
assert.equal(T.carrierId(first), null);
assert.equal(T.seatedIds(squad), null);
const task = {
  phase: 'disembarking',
  vehicleId: 'truck-d',
  access: true,
  boardedIds: Object.freeze([1, 2]),
  exitedIds: Object.freeze([1]),
  boardingOrder: Object.freeze([1, 2]),
  boardedCount: 2
};
squad._transport = Object.freeze(task);
Object.freeze(squad);
Object.freeze(first);
Object.freeze(second);
assert.equal(
  T.isPassenger(first),
  true,
  'an exited man remains committed until journey completion, as before'
);
assert.equal(T.carrierId(first), null);
assert.equal(T.carrierId(second), 'truck-d');
assert.deepEqual(T.seatedIds(squad), [2]);
assert.equal(T.isPassenger(null), false);
assert.equal(T.carrierId(null), null);
assert.equal(T.seatedIds(null), null);
console.log(
  'PASS transport-owned occupancy reads: 20 phase/admission/exit cases, distinct capture/LOS/presentation policy, detached IDs, legacy fallback, replacement/clear and frozen-state purity'
);
