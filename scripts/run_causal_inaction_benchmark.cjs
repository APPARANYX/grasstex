#!/usr/bin/env node
/* Run bounded inaction forensics against REAL shipping battle seeds.
 * Replays each seed probe-free by default; sameBattle=false invalidates evidence.
 * Usage: CAUSAL_SEEDS=20 CAUSAL_SECONDS=600 node scripts/run_causal_inaction_benchmark.cjs
 * Optional: CAUSAL_TYPES, CAUSAL_SIDE, CAUSAL_ROLE, CAUSAL_IDS, CAUSAL_SQUADS,
 * CAUSAL_PREFIX, CAUSAL_CONTROL, CAUSAL_URL, CAUSAL_OUT. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const types = String(process.env.CAUSAL_TYPES || 'meeting,us-defend,ge-defend')
  .split(',').map(x => x.trim()).filter(Boolean);
if (!types.length || types.some(x => !['meeting','us-defend','ge-defend'].includes(x)))
  throw Error('CAUSAL_TYPES must be meeting,us-defend,ge-defend');
const seeds = +(process.env.CAUSAL_SEEDS || 20);
if (!Number.isInteger(seeds) || seeds < 1 || seeds > 500)
  throw Error('CAUSAL_SEEDS must be 1..500');
const seconds = +(process.env.CAUSAL_SECONDS || 600);
if (!Number.isFinite(seconds) || seconds < 12)
  throw Error('CAUSAL_SECONDS must be >=12');
const prefix = process.env.CAUSAL_PREFIX || 'causal-inaction';
const out = path.resolve(process.env.CAUSAL_OUT || 'reports/causal-inaction');
fs.mkdirSync(out, { recursive: true });
const raw = path.join(out, 'raw.json');
const url = new URL(process.env.CAUSAL_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php');
for (const [name, key] of [
  ['CAUSAL_SIDE','probeSide'], ['CAUSAL_ROLE','probeRole'], ['CAUSAL_IDS','probeIds'],
  ['CAUSAL_SQUADS','probeSquads']
]) if (process.env[name]) url.searchParams.set(key, process.env[name]);
const battles = types.flatMap(type => Array.from({ length: seeds }, (_, i) =>
  type + ':' + prefix + '-' + type + '-' + String(i + 1).padStart(4, '0')));
const env = { ...process.env, PROBE: 'causal-inaction', PROBE_BATTLES: battles.join(','),
  PROBE_SECONDS: String(seconds), PROBE_URL: url.toString(),
  PROBE_CONTROL: process.env.CAUSAL_CONTROL || '1', PROBE_OUTPUT: raw };
const ran = spawnSync(process.execPath, [path.join(__dirname,'run_probe.cjs')], {
  cwd: path.resolve(__dirname, '..'), env, stdio: ['inherit','ignore','inherit']
});
if (ran.error) throw ran.error;
if (!fs.existsSync(raw)) throw Error('Probe did not write ' + raw);
const record = JSON.parse(fs.readFileSync(raw,'utf8'));
const summary = { schema: 'grasstex-causal-inaction-summary-v1',
  config: { types, seedsPerType: seeds, seconds, prefix, url: url.toString(), control: env.PROBE_CONTROL === '1' },
  expectedBattles: battles.length, completedBattles: record.battles.length,
  valid: true, failures: [], byScenario: {}, reasons: {}, confidence: {}, kinds: {},
  episodes: [], episodesOmitted: 0 };
function bump(obj, key, n=1) { obj[key] = (obj[key] || 0) + n; }
for (const type of types) summary.byScenario[type] = { battles: 0, episodes: 0, reasons: {}, confidence: {} };
for (const b of record.battles) {
  const group = summary.byScenario[b.type];
  if (!group) { summary.failures.push(b.seed + ': unknown scenario'); continue; }
  group.battles++;
  if (env.PROBE_CONTROL === '1' && b.sameBattle !== true) summary.failures.push(b.seed + ': probe/control mismatch');
  if ((b.errors || []).length) summary.failures.push(b.seed + ': runtime errors');
  const r = b.reports && b.reports['causal-inaction'];
  if (!r || r.schema !== 'grasstex-causal-inaction-v1')
    { summary.failures.push(b.seed + ': missing causal probe'); continue; }
  summary.episodesOmitted += r.episodesOmitted || 0;
  for (const e of r.episodes) {
    group.episodes++;
    bump(group.reasons, e.code);
    bump(group.confidence, e.confidence);
    bump(summary.reasons, e.code);
    bump(summary.confidence, e.confidence);
    bump(summary.kinds, e.kind);
    summary.episodes.push({ type: b.type, seed: b.seed, ...e });
  }
}
for (const type of types)
  if (summary.byScenario[type].battles !== seeds)
    summary.failures.push(type + ': expected ' + seeds + ', got ' + summary.byScenario[type].battles);
summary.valid = !summary.failures.length && summary.completedBattles === summary.expectedBattles;
const order = { verified: 0, likely: 1, unknown: 2 };
summary.episodes.sort((a,b) =>
  order[a.confidence] - order[b.confidence] ||
  b.seconds - a.seconds || a.seed.localeCompare(b.seed));
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
const md = [
  '# Causal Inaction Benchmark', '',
  'Full shipping battles; each seed replayed without observer unless CAUSAL_CONTROL=0.',
  'Probe validity: **' + (summary.valid ? 'PASS' : 'INVALID / PARTIAL') + '**; ' +
    summary.completedBattles + '/' + summary.expectedBattles + ' battles.',
  '',
  '| Scenario | Battles | Episodes | Verified evidence | Likely correlation | Unknown |',
  '| --- | ---: | ---: | ---: | ---: | ---: |'
];
for (const type of types) {
  const n=summary.byScenario[type];
  md.push('| '+type+' | '+n.battles+' | '+n.episodes+' | '+
    (n.confidence.verified||0)+' | '+(n.confidence.likely||0)+' | '+(n.confidence.unknown||0)+' |');
}
md.push('', '## Observed evidence codes', '');
for (const [reason,n] of Object.entries(summary.reasons).sort((a,b)=>b[1]-a[1]))
  md.push('- '+reason+': '+n);
md.push('', '## Top forensic episodes (full records in summary.json/raw.json)', '');
for (const e of summary.episodes.slice(0,30))
  md.push('- **'+e.seed+'** '+e.actor+' @ '+e.observedAt+' s: '+e.kind+
    ' / '+e.code+' ('+e.confidence+'; '+e.scope+'), '+e.seconds+' s. '+e.interpretation);
if (!summary.episodes.length) md.push('No qualifying episodes were observed.');
if (summary.episodesOmitted) md.push('', '**Warning:** '+summary.episodesOmitted+
  ' episodes omitted due to the per-battle cap. Narrow CAUSAL_* filters or replay seeds.');
if (summary.failures.length) md.push('', '## Invalidating failures', '', ...summary.failures.map(s=>'- '+s));
md.push('', '### Evidence interpretation', '',
  '- Verified means a named authoritative record or real trigger rejection was observed; it does NOT automatically prove the whole inaction interval was caused by that event.',
  '- Likely is a state correlation, NOT a decision-gate invocation or confirmed root cause.',
  '- Unknown explicitly means evidence is insufficient; instrument the responsible decision boundary before changing behavior.',
  '- A held order may be lawful; 12 seconds stationary is a diagnostic candidate, not necessarily a bug.',
  '- Probe/control mismatch or runtime errors invalidates the seed. Outputs still retained for debugging.');
fs.writeFileSync(path.join(out,'summary.md'),md.join('\n')+'\n');
console.error(md.join('\n'));
if (!summary.valid || ran.status) process.exitCode = 1;
