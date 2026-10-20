#!/usr/bin/env node
'use strict';
// DTO allocation probe, not a battle benchmark. Both APIs execute shipping Command Reception
// against one adopted order. Timings measure this lookup only; they do not predict battle FPS.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../battle/modules/18-command-reception.js'), 'utf8');
const root = { location: { search: '?commandRelay=0' }, GTLog() {} };
root.window = root;
vm.runInNewContext(source, root);
const C = root.BattleCommandReception;
const soldier = { id: 1, root: { position: { x: 0, z: 0 } } };
const squad = { id: 'probe', faction: 'us', members: [soldier] };
const battle = { time: 0 };
C.publish(squad, battle, 'movement', [soldier], {
  sender: soldier,
  action: 'move',
  point: { x: 20, z: 30 },
  data: { publishKey: 'probe', urgent: false }
});
battle.time = 10;
assert.ok(C.adoptedView(soldier, battle, 'movement'));
const iterations = 100000;
function sample(method) {
  let previous = null;
  let recordChanges = 0;
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const record = C[method](soldier, battle, 'movement');
    if (record !== previous) recordChanges++;
    previous = record;
  }
  return { milliseconds: performance.now() - start, recordChanges };
}
for (let i = 0; i < 2; i++) {
  sample('adopted');
  sample('adoptedView');
}
const copied = [],
  shared = [];
for (let i = 0; i < 7; i++) {
  // Alternate measurement order to reduce warm-up/order bias.
  if (i % 2) {
    shared.push(sample('adoptedView'));
    copied.push(sample('adopted'));
  } else {
    copied.push(sample('adopted'));
    shared.push(sample('adoptedView'));
  }
}
assert.ok(copied.every(s => s.recordChanges === iterations));
assert.ok(shared.every(s => s.recordChanges === 1));
const median = samples => samples.map(s => s.milliseconds).sort((a, b) => a - b)[3];
console.log(
  JSON.stringify(
    {
      scope: 'Single-order DTO lookup microprofile; no battle, rendering or end-to-end CPU claim',
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      iterationsPerSample: iterations,
      copied,
      shared,
      copiedMedianMs: median(copied),
      sharedMedianMs: median(shared),
      unchangedLookupRecordAllocations: { copied: iterations, shared: 0 },
      note: 'Shared identity is created once at adoption before measurement; recordChanges=1 is first observation.'
    },
    null,
    2
  )
);
