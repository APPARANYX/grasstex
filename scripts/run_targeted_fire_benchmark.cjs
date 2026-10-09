#!/usr/bin/env node
/* Seed-swept, per-unit fire-control benchmark. Uses the shipping fixed-step
   run_probe.cjs harness, never a simplified battle or mocked decision path.
   Start local PHP preview with PHP_CLI_SERVER_WORKERS=4 (see docs/agents/testing.md).
   Example:
     TARGET_SEEDS=20 TARGET_CONTROL=1 node scripts/run_targeted_fire_benchmark.cjs

   TARGET_SEEDS, TARGET_SEED_PREFIX, TARGET_TYPES (meeting,us-defend,ge-defend),
   TARGET_SECONDS, TARGET_URL, TARGET_SIDE, TARGET_ROLE, TARGET_IDS, TARGET_SQUADS,
   TARGET_WATCH (command,gates,setup,stress,fire,los), TARGET_CONTROL, TARGET_OUT.
   All selected units are monitored, but non-selected actors remain in the simulation. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const types = String(process.env.TARGET_TYPES || 'meeting,us-defend,ge-defend').split(',').map(s => s.trim()).filter(Boolean);
const known = new Set(['meeting', 'us-defend', 'ge-defend']);
if (!types.length || types.some(t => !known.has(t))) throw Error('TARGET_TYPES must be meeting,us-defend,ge-defend');
const seeds = Number.parseInt(process.env.TARGET_SEEDS || '20', 10);
if (!Number.isInteger(seeds) || seeds < 1 || seeds > 500) throw Error('TARGET_SEEDS must be 1..500');
const prefix = process.env.TARGET_SEED_PREFIX || 'targeted-mg42';
const outDir = path.resolve(process.env.TARGET_OUT || 'reports/targeted-fire');
fs.mkdirSync(outDir, { recursive: true });
const raw = path.join(outDir, 'raw.json');
const summaryPath = path.join(outDir, 'summary.json');
const mdPath = path.join(outDir, 'summary.md');
const url = new URL(process.env.TARGET_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php');
for (const [key, envName, fallback] of [
  ['probeSide','TARGET_SIDE','ge'],
  ['probeRole','TARGET_ROLE','gunner,sergeant,rifleman'],
  ['probeIds','TARGET_IDS',''],
  ['probeSquads','TARGET_SQUADS',''],
  ['probeWatch','TARGET_WATCH','command,gates,setup,stress,fire,los']
]) {
  const value = process.env[envName] === undefined ? fallback : process.env[envName];
  if (value) url.searchParams.set(key, value);
}
const battles = types.flatMap(type => Array.from({ length: seeds }, (_, i) =>
  type + ':' + prefix + '-' + type + '-' + String(i + 1).padStart(4, '0')));
const env = {
  ...process.env,
  PROBE: 'targeted-fire-control',
  PROBE_BATTLES: battles.join(','),
  PROBE_SECONDS: String(process.env.TARGET_SECONDS || '600'),
  PROBE_URL: url.toString(),
  PROBE_CONTROL: String(process.env.TARGET_CONTROL === undefined ? '1' : process.env.TARGET_CONTROL),
  PROBE_OUTPUT: raw
};
console.error('Targeted fire benchmark: ' + battles.length + ' seeds, ' + types.join('/') +
  ', side=' + (url.searchParams.get('probeSide') || 'ge') +
  ', roles=' + (url.searchParams.get('probeRole') || 'gunner') +
  ', instrumented control=' + env.PROBE_CONTROL);
const child = spawnSync(process.execPath, [path.join(__dirname, 'run_probe.cjs')], {
  cwd: path.resolve(__dirname, '..'),
  env,
  stdio: ['inherit', 'ignore', 'inherit'],
  timeout: 0
});
if (child.error) throw child.error;
if (!fs.existsSync(raw)) {
  process.exitCode = child.status || 1;
  throw Error('Probe did not write ' + raw);
}
const report = JSON.parse(fs.readFileSync(raw, 'utf8'));
function bump(o, k, n) { o[k] = (o[k] || 0) + (n == null ? 1 : n); }
function collect(records) {
  const o = { battles: 0, units: 0, rounds: 0, pulls: 0,
    targetSeconds: 0, noTargetSeconds: 0, setupSeconds: 0,
    silenceEpisodes5s: 0, silentTargetSeconds5s: 0,
    LOSRejected: 0, crestRejected: 0, areaRejected: 0, setupTransitions: 0, cowerTransitions: 0,
    gates: {}, fireOrders: {}, states: {}, profiles: {}, errors: [], expectedAudio404s: 0, parityFailures: [] };
  for (const b of records) {
    o.battles++;
    if (b.sameBattle === false) o.parityFailures.push(b.seed);
    if (b.errors && b.errors.length) o.errors.push({ seed: b.seed, errors: b.errors });
    o.expectedAudio404s += b.assetErrors?.count || 0;
    const probe = b.reports && b.reports['targeted-fire-control'];
    for (const d of Object.values((probe && probe.units) || {})) {
      o.units++; o.rounds += d.rounds; o.pulls += d.pulls;
      o.targetSeconds += d.targetSamples * .15;
      o.noTargetSeconds += d.noTargetSamples * .15;
      o.setupSeconds += d.setupSamples * .15;
      o.setupTransitions += d.setupTransitions;
      o.cowerTransitions += d.cowerTransitions;
      o.LOSRejected += d.LOSRejected;
      o.crestRejected += d.crestRejected;
      o.areaRejected += d.areaRejected;
      bump(o.profiles, d.profile || 'unknown', d.rounds);
      for (const [k,v] of Object.entries(d.gates || {})) bump(o.gates,k,v);
      for (const [k,v] of Object.entries(d.fireOrders || {})) bump(o.fireOrders,k,v);
      for (const [k,v] of Object.entries(d.engagements || {})) bump(o.states,k,v);
      for (const ep of d.episodes || []) if (ep.seconds >= 5) {
        o.silenceEpisodes5s++; o.silentTargetSeconds5s += ep.seconds;
      }
    }
  }
  for (const k of ['targetSeconds','noTargetSeconds','setupSeconds','silentTargetSeconds5s'])
    o[k] = +o[k].toFixed(2);
  return o;
}
const groups = {};
for (const type of types) {
  const rows = report.battles.filter(b => b.type === type);
  groups[type] = { all: collect(rows), byRole: {}, bySide: {} };
  for (const side of ['us', 'ge']) {
    const projected = rows.map(b => ({
      ...b,
      reports: { 'targeted-fire-control': { units: Object.fromEntries(
        Object.entries(b.reports?.['targeted-fire-control']?.units || {})
          .filter(([, unit]) => unit.faction === side)
      ) } }
    }));
    groups[type].bySide[side] = collect(projected);
  }
  const roles = new Set();
  for (const b of rows)
    for (const unit of Object.values(b.reports?.['targeted-fire-control']?.units || {}))
      roles.add(unit.role);
  for (const role of roles) {
    const projected = rows.map(b => ({
      ...b,
      reports: { 'targeted-fire-control': { units: Object.fromEntries(
        Object.entries(b.reports?.['targeted-fire-control']?.units || {})
          .filter(([, unit]) => unit.role === role)
      ) } }
    }));
    groups[type].byRole[role] = collect(projected);
  }
}
const summary = { schema: 'grasstex-targeted-fire-benchmark-v1', createdAt: new Date().toISOString(),
  config: { types, seedsPerType: seeds, seconds: +env.PROBE_SECONDS, url: url.toString(),
    control: env.PROBE_CONTROL === '1' },
  total: collect(report.battles), groups };
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n');
const lines = [
  '# Targeted Fire-Control Benchmark',
  '',
  'Full shipping battles with selected unit/decision observations; not a reduced simulation.',
  '',
  '| Scenario | Battles | Rounds | Target-seconds | 5s silent episodes | LOS / crest trigger rejects | Control mismatches |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: |'
];
for (const type of types) {
  const n = groups[type].all;
  lines.push('| ' + type + ' | ' + n.battles + ' | ' + n.rounds + ' | ' + n.targetSeconds +
    ' | ' + n.silenceEpisodes5s + ' | ' + n.LOSRejected + ' / ' + n.crestRejected +
    ' | ' + n.parityFailures.length + ' |');
}
lines.push('', '## By faction: machine gunners', '',
  '| Scenario | Faction | Gunner rounds | Target-seconds | Morale flee (samples) | Squad retreat (samples) | Stale withdraw (samples) | Crest rejects |',
  '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |');
for (const type of types) {
  for (const side of ['us', 'ge']) {
    const x = groups[type].bySide[side];
    lines.push('| ' + type + ' | ' + side + ' | ' + x.rounds + ' | ' + x.targetSeconds +
      ' | ' + (x.gates['stress:flee'] || 0) + ' | ' + (x.gates['squad-retreat'] || 0) +
      ' | ' + (x.gates['withdraw:stale'] || 0) + ' | ' + x.crestRejected + ' |');
  }
}
lines.push('', 'The blocker taxonomy is a post-step observation; a stale withdraw label is not proof the squad is operational without independent command/release evidence.');
lines.push('', '## First observed blocker samples by scenario');
for (const type of types) {
  lines.push('', '**' + type + '**: ' + Object.entries(groups[type].all.gates)
    .sort((a,b) => b[1] - a[1]).slice(0,12).map(([k,v]) => k + '=' + v).join(', '));
}
lines.push('', '## Interpretation',
  'Blocker samples are post-step classifications, **not actual counts of function invocations**.',
  'onFire rounds and trigger-path LOS/crest rejection counters are actual runtime events.',
  'A 5-second held-target/no-shot episode is a diagnostic symptom, **not automatically a bug**.',
  'Known missing local audio MP3 404s are reported separately (not runtime failures).',
  'Each seed is also run without this probe when TARGET_CONTROL=1; any end-state difference invalidates causal claims.',
  '', 'Expected local audio 404s: **' + summary.total.expectedAudio404s + '**; non-asset runtime-error seeds: **' + summary.total.errors.length + '**.',
  '', 'See raw.json for exact per-unit episodes, state/order transitions and battle fingerprints.');
fs.writeFileSync(mdPath, lines.join('\n') + '\n');
console.error(lines.join('\n'));
console.error('Reports: ' + summaryPath + ' / ' + mdPath + ' / ' + raw);
if (child.status) process.exitCode = child.status;
if (summary.total.parityFailures.length || summary.total.errors.length) process.exitCode = 1;
