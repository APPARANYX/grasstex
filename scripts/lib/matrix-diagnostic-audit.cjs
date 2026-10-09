'use strict';

/* Matrix-level, observe-only audit of the current benchmark evidence contract.
 * Keep outcome coverage (N battles) separate from diagnostic fidelity (valid evidence).
 * Runs after battles finish; never executes in the simulation or calls the AI.
 */
const TYPES = ['meeting', 'us-defend', 'ge-defend'];
const TIMELINE = 'grasstex-ai-timeline-v1';
const OBSERVER = 'grasstex-battle-observer-v1';
const ANALYSIS = 'grasstex-benchmark-analysis-v1';
const EVIDENCE = 'grasstex-benchmark-evidence-v1';
const MAX_EXAMPLES = 60;

function auditMatrixDiagnostics(battles) {
  const rows = Array.isArray(battles) ? battles : [];
  const byType = {};
  for (const type of TYPES) byType[type] = { battles: 0, valid: 0, invalid: 0, observerWindows: 0, timelineSamples: 0 };
  const issues = {};
  const examples = [];
  const records = [];
  const seen = new Set();
  let recordIssues = [];
  const totals = {
    battles: rows.length, validBattles: 0, invalidBattles: 0,
    timelineSamples: 0, timelineMarkers: 0, observerWindows: 0,
    observerFrames: 0, observerDropped: 0, focusedBattles: 0,
    evidenceConflicts: 0, evidenceLoops: 0,
    movementStallCompleted: 0, movementStallCensored: 0,
    markerKinds: {}
  };
  function problem(seed, type, code) {
    recordIssues.push(code);
    issues[code] = (issues[code] || 0) + 1;
    if (examples.length < MAX_EXAMPLES) examples.push({ seed, type, code });
  }
  function countMap(o, k) { o[k] = (o[k] || 0) + 1; }
  for (const b of rows) {
    recordIssues = [];
    const seed = String(b?.seed ?? ''), type = String(b?.battleType ?? 'unknown');
    const prior = Object.values(issues).reduce((n, v) => n + v, 0);
    if (!TYPES.includes(type)) problem(seed, type, 'unknown-battle-type');
    else byType[type].battles++;
    if (!seed) problem(seed, type, 'missing-seed');
    else if (seen.has(seed)) problem(seed, type, 'duplicate-seed');
    else seen.add(seed);

    const tl = b?.timeline;
    if (!tl || tl.format !== TIMELINE || !Array.isArray(tl.samples) || !tl.samples.length ||
        !Array.isArray(tl.markers)) {
      problem(seed, type, 'missing-or-invalid-timeline');
    } else {
      totals.timelineSamples += tl.samples.length;
      totals.timelineMarkers += tl.markers.length;
      if (byType[type]) byType[type].timelineSamples += tl.samples.length;
      for (const marker of tl.markers) countMap(totals.markerKinds, String(marker?.kind || 'unknown'));
      let prev = -Infinity;
      let monotonic = true;
      for (const sample of tl.samples) {
        if (!Number.isFinite(+sample?.t) || +sample.t + 1e-7 < prev) { monotonic = false; break; }
        prev = +sample.t;
      }
      if (!monotonic) problem(seed, type, 'nonmonotonic-timeline');
      const end = +b?.simulatedSeconds, stamp = +tl.battleTime;
      if (!Number.isFinite(end) || !Number.isFinite(stamp) || Math.abs(stamp - end) > 0.5)
        problem(seed, type, 'timeline-end-mismatch');
      else if (prev > end + 1 || prev < end - 1.6)
        problem(seed, type, 'timeline-samples-not-reaching-end');

      const obs = tl.observer;
      if (!obs || obs.format !== OBSERVER || !Array.isArray(obs.windows)) {
        problem(seed, type, 'missing-or-invalid-observer');
      } else {
        totals.observerWindows += obs.windows.length;
        if (byType[type]) byType[type].observerWindows += obs.windows.length;
        if (obs.windows.length) totals.focusedBattles++;
        totals.observerDropped += +obs.dropped || 0;
        for (const w of obs.windows) {
          if (!Array.isArray(w.frames)) problem(seed, type, 'malformed-observer-window');
          else totals.observerFrames += w.frames.length;
        }
      }
    }
    const ev = b?.diagnosticEvidence;
    if (!ev || ev.schema !== EVIDENCE ||
        !Array.isArray(ev.conflicts) || !Array.isArray(ev.loops)) {
      problem(seed, type, 'missing-benchmark-evidence');
    } else {
      totals.evidenceConflicts += ev.conflicts.length;
      totals.evidenceLoops += ev.loops.length;
    }
    const analysis = b?.diagnosticAnalysis;
    if (!analysis || analysis.schema !== ANALYSIS || !analysis.integrity ||
        typeof analysis.integrity.ok !== 'boolean') {
      problem(seed, type, 'missing-benchmark-analysis');
    } else {
      totals.movementStallCompleted += +analysis.movementStallCompleted || 0;
      totals.movementStallCensored += +analysis.movementStallCensored || 0;
      if (!analysis.integrity.ok)
        for (const code of analysis.integrity.discrepancies || ['unclassified'])
          problem(seed, type, 'evidence:' + String(code));
    }
    const count = Object.values(issues).reduce((n, v) => n + v, 0) - prior;
    records.push({ seed, type, ok: count === 0, issues: recordIssues });
    if (count) {
      totals.invalidBattles++;
      if (byType[type]) byType[type].invalid++;
    } else {
      totals.validBattles++;
      if (byType[type]) byType[type].valid++;
    }
  }
  return {
    schema: 'grasstex-matrix-diagnostics-audit-v1',
    ok: totals.invalidBattles === 0 && rows.length > 0,
    standards: { timeline: TIMELINE, observer: OBSERVER, analysis: ANALYSIS, evidence: EVIDENCE },
    totals, byType, issueCounts: issues, examples, records,
    interpretation: 'Diagnostic validity and expected-seed coverage are independent. Observer windows are conditional; zero windows is valid. A resolved stall is not evidence of recovered forward movement.'
  };
}
module.exports = { auditMatrixDiagnostics };
