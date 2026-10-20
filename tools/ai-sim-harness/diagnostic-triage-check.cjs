#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { triage, markdown } = require('../../scripts/triage_battle_diagnostics.cjs');

function battle(seed, extra) {
  return Object.assign(
    {
      seed,
      battleType: 'ge-defend',
      timeline: {
        markers: [{ kind: 'strategic-stall-wake', t: 130, faction: 'us', squad: 'us-2' }]
      },
      diagnosticEvidence: {
        loops: [{ at: 140, kind: 'low-forward-progress', faction: 'us', squad: 'us-2' }],
        conflicts: []
      },
      diagnosticAnalysis: { integrity: { ok: true } },
      movementStalls: [],
      routeStalls: []
    },
    extra || {}
  );
}
const report = triage({
  summary: { commit: 'test-head' },
  battles: [
    battle('loop'),
    battle('writer', {
      diagnosticEvidence: {
        loops: [],
        conflicts: [{ at: 80, field: 'orderAnchor', squad: 'ge-1' }]
      }
    })
  ]
});
assert.equal(report.totals.battles, 2);
assert.equal(report.totals.writers, 1);
assert.equal(report.totals.loops, 1);
assert.equal(report.top[0].seed, 'writer', 'writer conflict should outrank one loop alert');
assert.match(markdown(report), /ge-1/);
const missing = triage({ battles: [battle('missing', { timeline: null })] });
assert.equal(missing.totals.evidenceInvalid, 1);
assert.equal(missing.top[0].evidenceValid, false);
const quiet = triage({
  battles: [battle('quiet', {
    timeline: { markers: [] },
    diagnosticEvidence: { loops: [], conflicts: [] }
  })]
});
assert.equal(quiet.top[0].score, 0);
console.log('PASS read-only automated benchmark diagnostic triage');
