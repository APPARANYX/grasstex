#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const { auditMatrixDiagnostics } = require('../../scripts/lib/matrix-diagnostic-audit.cjs');

function battle(seed, battleType) {
  return {
    seed, battleType, simulatedSeconds: 2,
    timeline: {
      format: 'grasstex-ai-timeline-v1', battleTime: 2,
      samples: [{ t: 0 }, { t: 1 }, { t: 2 }],
      markers: [{ t: 1.1, kind: 'stall-start' }, { t: 1.8, kind: 'stall-end' }],
      observer: { format: 'grasstex-battle-observer-v1', dropped: 0, windows: [] }
    },
    diagnosticEvidence: {
      schema: 'grasstex-benchmark-evidence-v1', conflicts: [{ at: 1 }], loops: []
    },
    diagnosticAnalysis: {
      schema: 'grasstex-benchmark-analysis-v1', movementStallCompleted: 1,
      movementStallCensored: 0, integrity: { ok: true, discrepancies: [] }
    }
  };
}
const good = battle('seed-1', 'meeting');
const another = battle('seed-2', 'ge-defend');
another.timeline.observer.windows.push({ id: 1, frames: [{ t: 1.0 }, { t: 1.5 }] });
const clean = auditMatrixDiagnostics([good, another]);
assert.equal(clean.ok, true);
assert.equal(clean.totals.validBattles, 2);
assert.equal(clean.totals.timelineSamples, 6);
assert.equal(clean.totals.observerWindows, 1);
assert.equal(clean.totals.observerFrames, 2);
assert.equal(clean.totals.evidenceConflicts, 2);
assert.equal(clean.totals.movementStallCompleted, 2);
assert.equal(clean.byType.meeting.valid, 1);
assert.equal(clean.byType['ge-defend'].valid, 1);
assert.deepEqual(clean.issueCounts, {});
assert.equal(clean.records[0].ok, true, 'no focus window required on a quiet battle');

const duplicate = auditMatrixDiagnostics([good, good]);
assert.equal(duplicate.ok, false);
assert.equal(duplicate.issueCounts['duplicate-seed'], 1);
assert.equal(duplicate.records[0].ok, true);
assert.equal(duplicate.records[1].ok, false);

const missingTimeline = auditMatrixDiagnostics([{ ...good, timeline: null }]);
assert.equal(missingTimeline.issueCounts['missing-or-invalid-timeline'], 1);
assert.equal(missingTimeline.ok, false);

const missingObserver = auditMatrixDiagnostics([{
  ...good, timeline: { ...good.timeline, observer: null }
}]);
assert.equal(missingObserver.issueCounts['missing-or-invalid-observer'], 1);

const invalidTime = auditMatrixDiagnostics([{
  ...good, timeline: { ...good.timeline, samples: [{ t: 0 }, { t: 2 }, { t: 1.8 }] }
}]);
assert.equal(invalidTime.issueCounts['nonmonotonic-timeline'], 1);

const invalidEnd = auditMatrixDiagnostics([{
  ...good, timeline: { ...good.timeline, battleTime: 200 }
}]);
assert.equal(invalidEnd.issueCounts['timeline-end-mismatch'], 1);

const integrity = auditMatrixDiagnostics([{
  ...good, diagnosticAnalysis: {
    ...good.diagnosticAnalysis, integrity: { ok: false, discrepancies: ['writer-conflict-count'] }
  }
}]);
assert.equal(integrity.issueCounts['evidence:writer-conflict-count'], 1);
assert.equal(integrity.totals.invalidBattles, 1);
assert.deepEqual(integrity.records[0].issues, ['evidence:writer-conflict-count']);

const old = auditMatrixDiagnostics([{ ...good, diagnosticAnalysis: undefined,
  diagnosticEvidence: undefined, timeline: { ...good.timeline, observer: undefined } }]);
assert.equal(old.issueCounts['missing-benchmark-analysis'], 1);
assert.equal(old.issueCounts['missing-benchmark-evidence'], 1);
assert.equal(old.issueCounts['missing-or-invalid-observer'], 1);

// Bounded report examples must not imply errors beyond the bound were discarded.
const rows = Array.from({ length: 70 }, (_, i) => battle('duplicate', 'meeting'));
const bounded = auditMatrixDiagnostics(rows);
assert.equal(bounded.examples.length, 60);
assert.equal(bounded.records.length, 70);
assert.equal(bounded.issueCounts['duplicate-seed'], 69);
console.log('PASS matrix diagnostics audit: current schemas, timeline clock, observer, evidence, duplicate seeds and complete issue accounting');
