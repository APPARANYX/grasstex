'use strict';
/* Reuse only battle collection whose simulation sources and requested scenario are unchanged.
   Forensic probes and the aggregate gate always execute again on the current checkout. */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const TYPES = ['meeting', 'us-defend', 'ge-defend'];
function safeDiff(files) {
  return files.every(file =>
    /^(docs\/|tools\/ai-sim-harness\/|\.github\/workflows\/|scripts\/probe_[^/]+\.cjs$|scripts\/probes\/strategic-mission-trace\.js$|scripts\/reuse_strategic_evidence\.cjs$)/.test(
      file
    )
  );
}
function collectionContract(text) {
  return [
    'Start isolated 5 km simulation server',
    'Replay the real strategic battle and collect diagnostic evidence'
  ].map(name => {
    const start = text.indexOf('      - name: ' + name + '\n');
    if (start < 0) return null;
    const end = text.indexOf('      - name:', start + 7);
    return text
      .slice(start, end < 0 ? undefined : end)
      .replace(/^        if: needs\.evidence\.outputs\.run == ''\n/m, '')
      .trim();
  });
}
function sameCollectionWorkflow(before, after) {
  const a = collectionContract(before),
    b = collectionContract(after);
  return a.every((part, i) => part && part === b[i]);
}
function validReport(data, type, config, sourceSha) {
  const s = data.summary || {},
    bs = data.battles || [];
  return (
    s.commit === sourceSha &&
    s.timeLimit === config.seconds &&
    s.fixedDt === 0.15 &&
    s.seedPrefix === config.seed + '-' + type &&
    s.runtimeErrors === 0 &&
    bs.length === config.count &&
    bs.every(
      (b, i) =>
        b.seed === config.seed + '-' + type + '-' + String(i + 1).padStart(4, '0') &&
        b.battleType === type &&
        b.objectiveCount === 12 &&
        b.motorTransport?.enabled === true &&
        b.diagnosticAnalysis?.integrity?.ok === true
    )
  );
}
function reportFile(dir) {
  const out = [];
  function walk(at) {
    for (const d of fs.readdirSync(at, { withFileTypes: true })) {
      const p = path.join(at, d.name);
      if (d.isDirectory()) walk(p);
      else if (d.name === 'battle-benchmark.json') out.push(p);
    }
  }
  walk(dir);
  if (out.length !== 1) throw Error('Expected one collected benchmark report, found ' + out.length);
  return out[0];
}
function main() {
  const config = {
    seed: process.env.SEED_PREFIX,
    count: +process.env.REQUESTED,
    seconds: +process.env.SIM_SECONDS
  };
  const head = process.env.HEAD_SHA,
    repo = process.env.GITHUB_REPOSITORY;
  const gh = args => execFileSync('gh', args, { encoding: 'utf8' });
  const git = args => execFileSync('git', args, { encoding: 'utf8' }).trim();
  if (process.argv[2] === 'prepare') {
    const file = reportFile('reused-results'),
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!validReport(data, process.env.TYPE, config, process.env.SOURCE_SHA))
      throw Error('Reused collection does not match request');
    fs.mkdirSync('reports', { recursive: true });
    fs.copyFileSync(file, 'reports/battle-benchmark.json');
    fs.writeFileSync(
      'reports/collection-provenance.json',
      JSON.stringify(
        {
          sourceRun: process.env.SOURCE_RUN,
          sourceSha: process.env.SOURCE_SHA,
          validationSha: head,
          reusedCollection: true
        },
        null,
        2
      )
    );
    return;
  }
  const requested = process.env.REUSE_RUN;
  const runs = requested
    ? [JSON.parse(gh(['api', `repos/${repo}/actions/runs/${requested}`]))]
    : JSON.parse(
        gh([
          'api',
          `repos/${repo}/actions/workflows/strategic-diagnostics.yml/runs?branch=${encodeURIComponent(process.env.BRANCH)}&status=completed&per_page=15`
        ])
      ).workflow_runs;
  for (const run of runs) {
    try {
      execFileSync('git', ['merge-base', '--is-ancestor', run.head_sha, head]);
      const changed = git(['diff', '--name-only', run.head_sha, head]).split('\n').filter(Boolean);
      if (!safeDiff(changed)) continue;
      const sourceWorkflow = git(['show', run.head_sha + ':.github/workflows/strategic-diagnostics.yml']);
      const currentWorkflow = git(['show', head + ':.github/workflows/strategic-diagnostics.yml']);
      if (!sameCollectionWorkflow(sourceWorkflow, currentWorkflow)) continue;
      const artifacts = JSON.parse(gh(['api', `repos/${repo}/actions/runs/${run.id}/artifacts`])).artifacts;
      const names = TYPES.map(
        type =>
          artifacts.find(a => !a.expired && a.name.startsWith('strategic-diagnostics-' + type + '-'))?.name
      );
      if (names.some(n => !n)) continue;
      for (let i = 0; i < TYPES.length; i++) {
        const dir = path.join(process.env.RUNNER_TEMP, 'strategic-reuse-' + run.id, TYPES[i]);
        gh(['run', 'download', String(run.id), '--repo', repo, '--name', names[i], '--dir', dir]);
        if (
          !validReport(JSON.parse(fs.readFileSync(reportFile(dir), 'utf8')), TYPES[i], config, run.head_sha)
        )
          throw Error('Source collection does not match requested profile/configuration');
      }
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `run=${run.id}\nsha=${run.head_sha}\n`);
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `Reusing unchanged battle collection from run ${run.id} (${run.head_sha}); forensic probes and acceptance run on ${head}.\n`
      );
      return;
    } catch (e) {
      console.warn('Cannot reuse run ' + run.id + ': ' + e.message.split('\n')[0]);
    }
  }
  if (requested) throw Error('Requested evidence run is not eligible for reuse');
  fs.appendFileSync(process.env.GITHUB_OUTPUT, 'run=\nsha=\n');
  console.log('No matching unchanged collection; execute the requested battles.');
}
module.exports = { safeDiff, validReport, sameCollectionWorkflow };
if (require.main === module) main();
