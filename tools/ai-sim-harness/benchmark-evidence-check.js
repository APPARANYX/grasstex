#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const { assessEvidence } = require('../../scripts/lib/benchmark-evidence.cjs');
const timeline = { markers: [
  { t: 3, kind: 'stall-start', side: 'ge', squad: 'a', soldier: '1', owner: 'navigation' },
  { t: 7, kind: 'phase-change', side: 'ge', squad: 'a' },
  { t: 9, kind: 'stall-end', side: 'ge', squad: 'a', soldier: '1', reason: 'moving' },
  { t: 12, kind: 'stall-start', side: 'us', squad: 'b', soldier: '2' }
]};
const data = { timeline, writerConflicts: 2, diagnosticEvidence: {
  conflicts: [{at: 4}, {at: 8}], loops: [], sourceTotals: { conflicts: 8, loops: 1 }
}};
const full = assessEvidence(data);
assert.equal(full.movementStallCompleted, 1);
assert.equal(full.movementStallCensored, 1);
assert.equal(full.movementStallEpisodes[0].durationSeconds, 6);
assert.equal(full.movementStallEpisodes[0].resolution, 'moving');
assert.equal(full.integrity.ok, true);
const windowed = assessEvidence({ ...data, window: {openedAt: 5, closedAt: 10} });
assert.deepEqual(windowed.incidentKinds, { 'phase-change': 1, 'stall-end': 1 });
assert.equal(windowed.movementStallCompleted, 1, 'stall ending in window carries prior onset');
assert.equal(windowed.movementStallCensored, 0);
const bad = assessEvidence({ ...data, writerConflicts: 3 });
assert.deepEqual(bad.integrity.discrepancies, ['writer-conflict-count']);
console.log('PASS benchmark evidence: scoped timeline events, cross-window stall pairing, censored episodes and count integrity');
