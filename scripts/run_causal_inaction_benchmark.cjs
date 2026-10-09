#!/usr/bin/env node
/* Run bounded inaction forensics against REAL shipping battle seeds.
 * Replays each seed probe-free by default; sameBattle=false invalidates evidence.
 * Usage: CAUSAL_SEEDS=20 CAUSAL_SECONDS=600 node scripts/run_causal_inaction_benchmark.cjs
 * Optional: CAUSAL_TYPES, CAUSAL_SIDE, CAUSAL_ROLE, CAUSAL_IDS, CAUSAL_SQUADS,
 * CAUSAL_PREFIX, CAUSAL_BATTLES (exact type:seed CSV), CAUSAL_CONTROL, CAUSAL_URL, CAUSAL_OUT. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const specified = String(process.env.CAUSAL_BATTLES || '').split(',')
  .map(x => x.trim()).filter(Boolean);
for (const name of specified) {
  const pos = name.indexOf(':');
  if (pos < 1 || !['meeting', 'us-defend', 'ge-defend'].includes(name.slice(0, pos)) ||
      !name.slice(pos + 1)) throw Error('Invalid CAUSAL_BATTLES item: ' + name);
}
if (new Set(specified).size !== specified.length) throw Error('Duplicate CAUSAL_BATTLES seed');
const types = specified.length
  ? [...new Set(specified.map(x => x.slice(0, x.indexOf(':'))))]
  : String(process.env.CAUSAL_TYPES || 'meeting,us-defend,ge-defend')
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
const battles = specified.length ? specified :
  types.flatMap(type => Array.from({ length: seeds }, (_, i) =>
    type + ':' + prefix + '-' + type + '-' + String(i + 1).padStart(4, '0')));
const expectedByScenario = {};
for (const type of types) expectedByScenario[type] = 0;
for (const pair of battles) expectedByScenario[pair.slice(0, pair.indexOf(':'))]++;
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
  config: { types, seedsPerType: specified.length ? null : seeds,
    exactSeeds: specified.length ? specified : null,
    seconds, prefix, url: url.toString(), control: env.PROBE_CONTROL === '1' },
  expectedBattles: battles.length, completedBattles: record.battles.length,
  valid: true, failures: [], byScenario: {}, reasons: {}, confidence: {}, kinds: {},
  episodes: [], episodesOmitted: 0, directDenialsOmitted: 0, directDecisionReasons: {},
  coverDecisions: [], coverDecisionsOmitted: 0, coverDecisionCounts: {},
  coverRejectCounts: {}, coverLaneOutcomes: [] };
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
  summary.directDenialsOmitted += r.directDenialsOmitted || 0;
  summary.coverDecisionsOmitted += r.coverDecisionsOmitted || 0;
  for (const [k,n] of Object.entries(r.coverDecisionCounts || {})) bump(summary.coverDecisionCounts,k,n);
  for (const [k,n] of Object.entries(r.coverRejectCounts || {})) bump(summary.coverRejectCounts,k,n);
  for (const decision of r.coverDecisions || [])
    summary.coverDecisions.push({type:b.type,seed:b.seed,...decision});
  for (const outcome of r.coverLaneOutcomes || [])
    summary.coverLaneOutcomes.push({type:b.type,seed:b.seed,...outcome});
  for (const e of r.episodes) {
    group.episodes++;
    bump(group.reasons, e.code);
    bump(group.confidence, e.confidence);
    bump(summary.reasons, e.code);
    bump(summary.confidence, e.confidence);
    bump(summary.kinds, e.kind);
    for (const [reason,n] of Object.entries(e.evidence?.directFireDenials || {}))
      bump(summary.directDecisionReasons, reason, n);
    summary.episodes.push({ type: b.type, seed: b.seed, ...e });
  }
}
for (const type of types)
  if (summary.byScenario[type].battles !== expectedByScenario[type])
    summary.failures.push(type + ': expected ' + expectedByScenario[type] + ', got ' + summary.byScenario[type].battles);
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
md.push('', '## Actual cover and firing-lane decision gates (direct evidence)', '');
for (const [name,n] of Object.entries(summary.coverDecisionCounts).sort((a,b)=>b[1]-a[1]))
  md.push('- ' + name + ': ' + n);
md.push('', '### Observed slot rejection counts (not necessarily exclusive)', '');
for (const [name,n] of Object.entries(summary.coverRejectCounts).sort((a,b)=>b[1]-a[1]))
  md.push('- ' + name + ': ' + n);
const arrived = summary.coverLaneOutcomes.filter(x=>x.arrivedAt!=null).length;
const fired = summary.coverLaneOutcomes.filter(x=>x.firedAt!=null).length;
md.push('', '### Selected firing-lane physical outcomes', '',
  '- Selected: ' + summary.coverLaneOutcomes.length + ', physically arrived: ' + arrived +
  ', later fired: ' + fired + '. Firing after selection does not prove LOS to the original target.');
if (summary.coverDecisionsOmitted) md.push(
  '- Warning: ' + summary.coverDecisionsOmitted +
  ' planner decisions omitted from per-battle detail. Aggregated counts remain complete.'
);
md.push('', '## Direct Engagement decision denials within reported episodes', '');
for (const [reason,n] of Object.entries(summary.directDecisionReasons).sort((a,b)=>b[1]-a[1]))
  md.push('- '+reason+': '+n);
md.push('', '## Top forensic episodes (full records in summary.json/raw.json)', '');
for (const e of summary.episodes.slice(0,30)) {
  const decisions = Object.entries(e.evidence?.directFireDenials || {})
    .sort((a,b)=>b[1]-a[1]).map(([k,n])=>k+'='+n).join(', ');
  const blocker = e.kind === 'movement-inaction'
    ? (e.evidence?.order?.heldBy || e.evidence?.stopReason || '') : '';
  md.push('- **'+e.seed+'** '+e.actor+' @ '+e.observedAt+' s: '+e.kind+
    ' / '+e.code+' ('+e.confidence+'; '+e.scope+'), '+e.seconds+' s.'+
    (decisions ? ' Direct denial gates: '+decisions+'.' : '')+
    (blocker ? ' Movement blocker: '+blocker+'.' : '')+' '+e.interpretation);
}
if (!summary.episodes.length) md.push('No qualifying episodes were observed.');
if (summary.episodesOmitted) md.push('', '**Warning:** '+summary.episodesOmitted+
  ' episodes omitted due to the per-battle cap. Narrow CAUSAL_* filters or replay seeds.');
if (summary.directDenialsOmitted) md.push('', '**Warning:** ' + summary.directDenialsOmitted +
  ' direct firing denial events dropped from rolling actor buffers; results may be incomplete.');
if (summary.failures.length) md.push('', '## Invalidating failures', '', ...summary.failures.map(s=>'- '+s));
md.push('', '### Evidence interpretation', '',
  '- Verified cover rejections mean the shipping planner actually took those branches; different candidates can fail different gates in one search.',
  '- A selected flank destination does not prove physical travel; physically arrived and post-selection fire are observed separately.',
  '- Verified means a named authoritative record or real trigger rejection was observed; it does NOT automatically prove the whole inaction interval was caused by that event.',
  '- Likely is a state correlation, NOT a decision-gate invocation or confirmed root cause.',
  '- Unknown explicitly means evidence is insufficient; instrument the responsible decision boundary before changing behavior.',
  '- A held order may be lawful; 12 seconds stationary is a diagnostic candidate, not necessarily a bug.',
  '- Probe/control mismatch or runtime errors invalidates the seed. Outputs still retained for debugging.');
fs.writeFileSync(path.join(out,'summary.md'),md.join('\n')+'\n');
console.error(md.join('\n'));
if (!summary.valid || ran.status) process.exitCode = 1;
