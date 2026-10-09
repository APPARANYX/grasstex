#!/usr/bin/env node
'use strict';
/* End-to-end merger test: fixture shard JSON -> current matrix JSON/CSV/Markdown.
   The report must not silently drop diagnostic-integrity failures from its summaries. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const repo = path.resolve(__dirname, '../..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'matrix-diagnostic-'));
function battle(seed, battleType, bad) {
  return {
    seed, battleType, winner: 'ge', simulatedSeconds: 2, captures: 1, objectiveCount: 2,
    health: { overall: 75, strategic: 70, movement: 80, cohesion: 90, combat: 60, objective: 75 },
    squadPerformance: { squads: [] },
    timeline: {
      format: 'grasstex-ai-timeline-v1', battleTime: 2,
      samples: [{ t: 0 }, { t: 1 }, { t: 2 }],
      markers: [{ t: 1.5, kind: 'stall-start' }],
      observer: { format: 'grasstex-battle-observer-v1', dropped: 0,
        windows: bad ? [] : [{ id: 1, frames: [{ t: 1.5 }] }] }
    },
    diagnosticEvidence: { schema: 'grasstex-benchmark-evidence-v1', conflicts: [], loops: [] },
    diagnosticAnalysis: {
      schema: 'grasstex-benchmark-analysis-v1', movementStallCompleted: 0,
      movementStallCensored: 1, integrity: bad ?
        { ok: false, discrepancies: ['writer-conflict-count'] } :
        { ok: true, discrepancies: [] }
    }
  };
}
function run(battles) {
  const inDir = path.join(tmp, 'shard-reports');
  const outDir = path.join(tmp, 'reports');
  fs.rmSync(inDir, { recursive: true, force: true });
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(inDir, { recursive: true });
  const payload = { summary: { commit: 'fixture-sha', build: 'fixture', policySource: 'stashed-defaults',
    policyRevision: 0, wallSeconds: 1, requestedBattles: battles.length }, battles };
  fs.writeFileSync(path.join(inDir, 'battle-benchmark.json'), JSON.stringify(payload));
  const proc = spawnSync(process.execPath, ['scripts/merge_battle_benchmarks.mjs'], {
    cwd: repo, env: { ...process.env,
      BATTLE_BENCHMARK_MERGE_INPUT: inDir,
      BATTLE_BENCHMARK_OUTPUT: outDir },
    encoding: 'utf8', timeout: 30000
  });
  assert.equal(proc.status, 0, 'merger must finish: ' + (proc.stderr || proc.stdout).slice(0, 1200));
  return {
    json: JSON.parse(fs.readFileSync(path.join(outDir, 'battle-benchmark.json'), 'utf8')),
    csv: fs.readFileSync(path.join(outDir, 'battle-benchmark.csv'), 'utf8'),
    md: fs.readFileSync(path.join(outDir, 'battle-benchmark.md'), 'utf8')
  };
}
try {
  const a = run([battle('m1', 'meeting', false), battle('g1', 'ge-defend', false)]);
  assert.equal(a.json.summary.diagnosticAudit.ok, true);
  assert.equal(a.json.summary.diagnosticEvidence.integrityOk, true);
  assert.equal(a.json.summary.diagnosticAudit.totals.timelineSamples, 6);
  assert.equal(a.json.summary.diagnosticAudit.totals.observerWindows, 2);
  assert.equal(a.json.summary.diagnosticAudit.byType.meeting.valid, 1);
  assert.ok(a.csv.includes('diagnosticIntegrityOk'));
  assert.ok(a.csv.includes('observerFrames'));
  assert.ok(a.md.includes('Diagnostic evidence audit'));
  assert.ok(a.md.includes('Integrity: **PASS**'));

  const b = run([battle('m1', 'meeting', true)]);
  assert.equal(b.json.summary.diagnosticAudit.ok, false);
  assert.equal(b.json.summary.diagnosticEvidence.integrityOk, false);
  assert.equal(b.json.summary.diagnosticAudit.totals.invalidBattles, 1);
  assert.equal(b.json.summary.diagnosticAudit.issueCounts['evidence:writer-conflict-count'], 1);
  assert.ok(b.csv.includes('evidence:writer-conflict-count'));
  assert.ok(b.md.includes('Integrity: **FAIL**'));

  // The shipping runner does not set battleType; the merger must recognize seed layouts.
  const smokeMeeting = battle('matrix-smoke-meeting-0001', undefined, false);
  const smokeGerman = battle('matrix-smoke-ge-defend-0001', undefined, false);
  const legacyAmerican = battle('manual-benchmark-us-defend-s2-b0002-0001', undefined, false);
  const c = run([smokeMeeting, smokeGerman, legacyAmerican]);
  assert.equal(c.json.summary.diagnosticAudit.ok, true, JSON.stringify(c.json.summary.diagnosticAudit.issueCounts));
  assert.equal(c.json.summary.battleTypes.meeting.completedBattles, 1);
  assert.equal(c.json.summary.battleTypes['ge-defend'].completedBattles, 1);
  assert.equal(c.json.summary.battleTypes['us-defend'].completedBattles, 1);
    console.log('PASS matrix merger: diagnostics retained in JSON/CSV/Markdown, partial scenario grouping and integrity failures surfaced');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
