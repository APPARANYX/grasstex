'use strict';
const assert = require('node:assert/strict');
const summarize = require('../../scripts/lib/cpu-profile-summary.cjs');
const frame = (functionName, url = 'http://test/battle/owner.js', lineNumber = 9) => ({
  functionName,
  url,
  lineNumber,
  columnNumber: 2
});
const summary = summarize({
  startTime: 100,
  endTime: 800,
  nodes: [
    { id: 1, callFrame: frame('(root)', '', -1), children: [2] },
    { id: 2, callFrame: frame('owner'), children: [3] },
    { id: 3, callFrame: frame('owner'), children: [4] },
    { id: 4, callFrame: frame('nativeQuery', 'http://test/battle/nav.js', 19) }
  ],
  samples: [2, 3, 4, 999, 4],
  timeDeltas: [100, 200, 300, 50]
});
assert.equal(summary.sampledUs, 650);
assert.equal(summary.unattributedUs, 50, 'unknown sample ID remains visible');
assert.equal(summary.untimedSamples, 1, 'missing delta is not assigned an invented interval');
const owner = summary.functions.find(r => r.functionName === 'owner');
const native = summary.functions.find(r => r.functionName === 'nativeQuery');
assert.equal(owner.selfUs, 300);
assert.equal(owner.inclusiveUs, 600, 'recursive locations do not double-count inclusive time');
assert.equal(native.selfUs, 300);
assert.equal(native.line, 20, 'CDP zero-based locations become human-readable lines');
assert.equal(owner.line, 10);
assert.equal(summary.functions.reduce((n, r) => n + r.selfUs, 0) + summary.unattributedUs, summary.sampledUs);
assert.equal(summarize({ nodes: [] }).sampledUs, 0, 'empty/failed collection produces no fabricated samples');
console.log(
  'CPU_PROFILE_SUMMARY_CHECK passed: sampled time, recursive stacks, source locations, missing data'
);
