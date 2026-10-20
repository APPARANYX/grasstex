'use strict';
const assert = require('node:assert/strict');
const {
  safeDiff,
  validReport,
  sameCollectionWorkflow
} = require('../../scripts/reuse_strategic_evidence.cjs');
assert(
  safeDiff([
    'scripts/probes/strategic-mission-trace.js',
    'tools/ai-sim-harness/strategic-mission-trace-check.js',
    'scripts/probe_fbx_render_pose.cjs',
    '.github/workflows/strategic-diagnostics.yml'
  ])
);
for (const file of [
  'battle/squad-ai.js',
  'battle/modules/58-strategic-abstract-transport.js',
  'Assets/soldiers/ge-scout.fbx',
  'battle_sim_local.php',
  'scripts/run_battle_benchmark.mjs',
  'scripts/run_probe.cjs',
  'package.json'
]) {
  assert(!safeDiff([file]), 'simulation/runner changes require fresh battle collection: ' + file);
}
const fs = require('node:fs');
const currentWorkflow = fs.readFileSync('.github/workflows/strategic-diagnostics.yml', 'utf8');
const priorWorkflow = currentWorkflow.replace("        if: needs.evidence.outputs.run == ''\n", '');
assert(
  sameCollectionWorkflow(priorWorkflow, currentWorkflow),
  'reuse-only workflow edits preserve collection contract'
);
assert(
  !sameCollectionWorkflow(currentWorkflow, currentWorkflow.replace('frontLines=0', 'frontLines=1')),
  'scenario flag changes invalidate reuse'
);
assert(
  !sameCollectionWorkflow(
    currentWorkflow,
    currentWorkflow.replace("BATTLE_BENCHMARK_STEP: '0.15'", "BATTLE_BENCHMARK_STEP: '0.3'")
  ),
  'step changes invalidate reuse'
);
const config = { seed: 'example', seconds: 1800, count: 1 };
const report = () => ({
  summary: {
    commit: 'source',
    timeLimit: 1800,
    fixedDt: 0.15,
    seedPrefix: 'example-meeting',
    runtimeErrors: 0
  },
  battles: [
    {
      seed: 'example-meeting-0001',
      battleType: 'meeting',
      objectiveCount: 12,
      motorTransport: { enabled: true },
      diagnosticAnalysis: { integrity: { ok: true } }
    }
  ]
});
assert(validReport(report(), 'meeting', config, 'source'));
for (const change of [
  d => {
    d.summary.timeLimit = 600;
  },
  d => {
    d.summary.commit = 'other';
  },
  d => {
    d.summary.runtimeErrors = 1;
  },
  d => {
    d.summary.seedPrefix = 'other';
  },
  d => {
    d.battles = [];
  },
  d => {
    d.battles[0].objectiveCount = 9;
  },
  d => {
    d.battles[0].motorTransport.enabled = false;
  },
  d => {
    d.battles[0].seed = 'example-meeting-0002';
  },
  d => {
    d.battles[0].diagnosticAnalysis.integrity.ok = false;
  }
]) {
  const d = report();
  change(d);
  assert(!validReport(d, 'meeting', config, 'source'));
}
assert(!validReport(report(), 'us-defend', config, 'source'));
assert(!validReport(report(), 'meeting', { ...config, count: 2 }, 'source'));
console.log(
  'PASS strategic evidence reuse: simulation changes, source SHA, seeds, duration, count, profile, transport and diagnostic integrity guards'
);
