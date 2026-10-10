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

const specified = String(process.env.CAUSAL_BATTLES || '')
  .split(',')
  .map(x => x.trim())
  .filter(Boolean);
for (const name of specified) {
  const pos = name.indexOf(':');
  if (pos < 1 || !['meeting', 'us-defend', 'ge-defend'].includes(name.slice(0, pos)) || !name.slice(pos + 1))
    throw Error('Invalid CAUSAL_BATTLES item: ' + name);
}
if (new Set(specified).size !== specified.length) throw Error('Duplicate CAUSAL_BATTLES seed');
const types = specified.length
  ? [...new Set(specified.map(x => x.slice(0, x.indexOf(':'))))]
  : String(process.env.CAUSAL_TYPES || 'meeting,us-defend,ge-defend')
      .split(',')
      .map(x => x.trim())
      .filter(Boolean);
if (!types.length || types.some(x => !['meeting', 'us-defend', 'ge-defend'].includes(x)))
  throw Error('CAUSAL_TYPES must be meeting,us-defend,ge-defend');
const seeds = +(process.env.CAUSAL_SEEDS || 20);
if (!Number.isInteger(seeds) || seeds < 1 || seeds > 500) throw Error('CAUSAL_SEEDS must be 1..500');
const seconds = +(process.env.CAUSAL_SECONDS || 600);
if (!Number.isFinite(seconds) || seconds < 12) throw Error('CAUSAL_SECONDS must be >=12');
const prefix = process.env.CAUSAL_PREFIX || 'causal-inaction';
const out = path.resolve(process.env.CAUSAL_OUT || 'reports/causal-inaction');
fs.mkdirSync(out, { recursive: true });
const raw = path.join(out, 'raw.json');
const url = new URL(process.env.CAUSAL_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php');
/* Query flags drive the actual battle under test. Never let a user-supplied
   gameplay query replace benchmark seed, defender or observer selectors. */
const causalQuery = String(process.env.CAUSAL_QUERY || '').replace(/^\?/, '');
for (const [key, value] of new URLSearchParams(causalQuery)) {
  if (
    !/^[A-Za-z][A-Za-z0-9]*$/.test(key) ||
    ['seed', 'defender', 'probeSide', 'probeRole', 'probeIds', 'probeSquads'].includes(key)
  )
    throw Error('CAUSAL_QUERY has a reserved/invalid key: ' + key);
  url.searchParams.set(key, value);
}
for (const [name, key] of [
  ['CAUSAL_SIDE', 'probeSide'],
  ['CAUSAL_ROLE', 'probeRole'],
  ['CAUSAL_IDS', 'probeIds'],
  ['CAUSAL_SQUADS', 'probeSquads']
])
  if (process.env[name]) url.searchParams.set(key, process.env[name]);
const battles = specified.length
  ? specified
  : types.flatMap(type =>
      Array.from(
        { length: seeds },
        (_, i) => type + ':' + prefix + '-' + type + '-' + String(i + 1).padStart(4, '0')
      )
    );
const expectedByScenario = {};
for (const type of types) expectedByScenario[type] = 0;
for (const pair of battles) expectedByScenario[pair.slice(0, pair.indexOf(':'))]++;
const env = {
  ...process.env,
  PROBE: [
    'causal-inaction',
    ...(process.env.CAUSAL_GEOMETRY === '1' ? ['crest-geometry'] : []),
    ...(process.env.CAUSAL_LIFECYCLE === '1' ? ['command-lifecycle'] : []),
    ...(process.env.CAUSAL_NAVTRACE === '1' ? ['route-361'] : [])
  ].join(','),
  PROBE_BATTLES: battles.join(','),
  PROBE_SECONDS: String(seconds),
  PROBE_URL: url.toString(),
  PROBE_CONTROL: process.env.CAUSAL_CONTROL || '1',
  PROBE_OUTPUT: raw
};
const ran = spawnSync(process.execPath, [path.join(__dirname, 'run_probe.cjs')], {
  cwd: path.resolve(__dirname, '..'),
  env,
  stdio: ['inherit', 'ignore', 'inherit']
});
if (ran.error) throw ran.error;
if (!fs.existsSync(raw)) throw Error('Probe did not write ' + raw);
const record = JSON.parse(fs.readFileSync(raw, 'utf8'));
const summary = {
  schema: 'grasstex-causal-inaction-summary-v1',
  config: {
    types,
    seedsPerType: specified.length ? null : seeds,
    exactSeeds: specified.length ? specified : null,
    seconds,
    prefix,
    url: url.toString(),
    query: causalQuery,
    control: env.PROBE_CONTROL === '1'
  },
  expectedBattles: battles.length,
  completedBattles: record.battles.length,
  valid: true,
  failures: [],
  byScenario: {},
  reasons: {},
  confidence: {},
  kinds: {},
  episodes: [],
  episodesOmitted: 0,
  directDenialsOmitted: 0,
  directDecisionReasons: {},
  coverDecisions: [],
  coverDecisionsOmitted: 0,
  coverDecisionCounts: {},
  coverRejectCounts: {},
  coverLaneOutcomes: [],
  lifecycle: [],
  navigationRegressions: []
};
function bump(obj, key, n = 1) {
  obj[key] = (obj[key] || 0) + n;
}
for (const type of types) summary.byScenario[type] = { battles: 0, episodes: 0, reasons: {}, confidence: {} };
for (const b of record.battles) {
  const group = summary.byScenario[b.type];
  if (!group) {
    summary.failures.push(b.seed + ': unknown scenario');
    continue;
  }
  group.battles++;
  if (env.PROBE_CONTROL === '1' && b.sameBattle !== true)
    summary.failures.push(b.seed + ': probe/control mismatch');
  if ((b.errors || []).length) summary.failures.push(b.seed + ': runtime errors');
  const r = b.reports && b.reports['causal-inaction'];
  if (!r || r.schema !== 'grasstex-causal-inaction-v1') {
    summary.failures.push(b.seed + ': missing causal probe');
    continue;
  }
  if (process.env.CAUSAL_LIFECYCLE === '1') {
    const lifecycle = b.reports && b.reports['command-lifecycle'];
    if (!lifecycle || !Array.isArray(lifecycle.transitions) || !Array.isArray(lifecycle.checkpoints)) {
      summary.failures.push(b.seed + ': missing command-lifecycle probe');
    } else {
      const selected = String(process.env.CAUSAL_SQUADS || '').split(',').filter(Boolean);
      const choose = sq => !selected.length || selected.includes(String(sq.id));
      const one = snap => ({
        t: +(+snap.time).toFixed(2),
        squads: (snap.squads || []).filter(choose).map(q => ({
          id: q.id, faction: q.faction, living: q.living, phase: q.phase,
          mission: q.mission ? { version: q.mission.version, intent: q.mission.intent, status: q.mission.status } : null,
          objective: q.objective, anchor: q.anchor, centroid: q.centroid,
          displacement: +(+q.displacement).toFixed(2), recon: !!q.recon,
          men: q.men.map(m => ({
            id: m.id, travel: +(+m.travel).toFixed(2),
            adopted: !!m.adopted, receipt: m.receipt && m.receipt.phase || null,
            resolver: m.resolver && m.resolver.owner || null,
            stop: m.stopReason, speed: m.speed
          }))
        }))
      });
      summary.lifecycle.push({
        type: b.type, seed: b.seed,
        checkpoints: lifecycle.checkpoints.map(one),
        final: one(lifecycle.final),
        transitions: lifecycle.transitions.filter(t => !selected.length || selected.includes(String(t.id)))
          .map(t => ({ t: +(+t.time).toFixed(2), id: t.id, faction: t.faction,
            missionVersion: t.version, intent: t.intent, status: t.status, phase: t.phase,
            recon: t.recon || null, mainBodyCentroid: t.mainBodyCentroid }))
      });
    }
  }
  /* A green observer/fingerprint control is not enough: the original real GE-4
     CAPTURE battle passed that control while its two lead movers oscillated in
     exactly the same 0.77m two-point loop for almost 300 seconds. This opt-in
     exact-seed sentinel fails on the old gameplay and passes only on physical
     progress toward the actual mission objective. Other seeds stay exploratory. */
  if (process.env.CAUSAL_NAVTRACE === '1' && b.type === 'meeting' && b.seed === 'hill-0008') {
    const trace = b.reports && b.reports['route-361'];
    const frames = (trace && trace.samples || []).filter(x => x.t >= 126 && x.t <= 129.05);
    const men = [92, 98].map(id => {
      const entries = frames.map(x => (x.members || []).find(m => +m.id === id)).filter(Boolean);
      const first = entries[0], last = entries[entries.length - 1];
      return {
        id,
        samples: entries.length,
        netMeters: first && last && first.position && last.position
          ? +Math.hypot(last.position.x - first.position.x, last.position.z - first.position.z).toFixed(2)
          : null,
        closedGoalMeters: first && last && first.goalDistance != null && last.goalDistance != null
          ? +(first.goalDistance - last.goalDistance).toFixed(2)
          : null
      };
    });
    const pass = men.every(m => m.samples >= 12 && m.netMeters >= 2 && m.closedGoalMeters >= 2);
    summary.navigationRegressions.push({
      type: b.type, seed: b.seed, squad: 'ge-4',
      interval: '126-129s', men, pass
    });
    if (!pass) summary.failures.push(b.seed + ': #361 GE-4 net physical progress regression');
  }
  summary.episodesOmitted += r.episodesOmitted || 0;
  summary.directDenialsOmitted += r.directDenialsOmitted || 0;
  summary.coverDecisionsOmitted += r.coverDecisionsOmitted || 0;
  for (const [k, n] of Object.entries(r.coverDecisionCounts || {})) bump(summary.coverDecisionCounts, k, n);
  for (const [k, n] of Object.entries(r.coverRejectCounts || {})) bump(summary.coverRejectCounts, k, n);
  for (const decision of r.coverDecisions || [])
    summary.coverDecisions.push({ type: b.type, seed: b.seed, ...decision });
  for (const outcome of r.coverLaneOutcomes || [])
    summary.coverLaneOutcomes.push({ type: b.type, seed: b.seed, ...outcome });
  for (const e of r.episodes) {
    group.episodes++;
    bump(group.reasons, e.code);
    bump(group.confidence, e.confidence);
    bump(summary.reasons, e.code);
    bump(summary.confidence, e.confidence);
    bump(summary.kinds, e.kind);
    for (const [reason, n] of Object.entries(e.evidence?.directFireDenials || {}))
      bump(summary.directDecisionReasons, reason, n);
    summary.episodes.push({ type: b.type, seed: b.seed, ...e });
  }
}
for (const type of types)
  if (summary.byScenario[type].battles !== expectedByScenario[type])
    summary.failures.push(
      type + ': expected ' + expectedByScenario[type] + ', got ' + summary.byScenario[type].battles
    );
summary.valid = !summary.failures.length && summary.completedBattles === summary.expectedBattles;
const order = { verified: 0, likely: 1, unknown: 2 };
summary.episodes.sort(
  (a, b) => order[a.confidence] - order[b.confidence] || b.seconds - a.seconds || a.seed.localeCompare(b.seed)
);
fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
const md = [
  '# Causal Inaction Benchmark',
  '',
  'Full shipping battles; each seed replayed without observer unless CAUSAL_CONTROL=0.',
  'Probe validity: **' +
    (summary.valid ? 'PASS' : 'INVALID / PARTIAL') +
    '**; ' +
    summary.completedBattles +
    '/' +
    summary.expectedBattles +
    ' battles.',
  '',
  '| Scenario | Battles | Episodes | Verified evidence | Likely correlation | Unknown |',
  '| --- | ---: | ---: | ---: | ---: | ---: |'
];
for (const type of types) {
  const n = summary.byScenario[type];
  md.push(
    '| ' +
      type +
      ' | ' +
      n.battles +
      ' | ' +
      n.episodes +
      ' | ' +
      (n.confidence.verified || 0) +
      ' | ' +
      (n.confidence.likely || 0) +
      ' | ' +
      (n.confidence.unknown || 0) +
      ' |'
  );
}
md.push('', '## Observed evidence codes', '');
for (const [reason, n] of Object.entries(summary.reasons).sort((a, b) => b[1] - a[1]))
  md.push('- ' + reason + ': ' + n);
md.push('', '## Actual cover and firing-lane decision gates (direct evidence)', '');
for (const [name, n] of Object.entries(summary.coverDecisionCounts).sort((a, b) => b[1] - a[1]))
  md.push('- ' + name + ': ' + n);
md.push('', '### Observed slot rejection counts (not necessarily exclusive)', '');
for (const [name, n] of Object.entries(summary.coverRejectCounts).sort((a, b) => b[1] - a[1]))
  md.push('- ' + name + ': ' + n);
const arrived = summary.coverLaneOutcomes.filter(x => x.arrivedAt != null).length;
const fired = summary.coverLaneOutcomes.filter(x => x.firedAt != null).length;
md.push(
  '',
  '### Selected firing-lane physical outcomes',
  '',
  '- Selected: ' +
    summary.coverLaneOutcomes.length +
    ', physically arrived: ' +
    arrived +
    ', later fired: ' +
    fired +
    '. Firing after selection does not prove LOS to the original target.'
);
const nearFatal = summary.coverLaneOutcomes.filter(x => x.status === 'killed-at-firing-position').length;
const farFatal = summary.coverLaneOutcomes.filter(x => x.status === 'killed-before-arrival').length;
md.push('- Fatal flank outcomes: ' + nearFatal + ' killed within 0.6m of the destination, ' +
  farFatal + ' killed farther away; an unobserved living arrival is not a pathfinding failure.');
for (const e of summary.coverLaneOutcomes.filter(x => x.observedDeadAt != null).slice(0,20))
  md.push('- ' + e.actor + ': ' + e.status + ' @ observed t=' + e.observedDeadAt +
    's, nearest ' + (+e.nearestMeters).toFixed(2) + 'm, last owner ' +
    String(e.lastMovementOwner) + ', last movement stop ' + String(e.lastStop));
if (summary.coverDecisionsOmitted)
  md.push(
    '- Warning: ' +
      summary.coverDecisionsOmitted +
      ' planner decisions omitted from per-battle detail. Aggregated counts remain complete.'
  );
md.push('', '## Direct Engagement decision denials within reported episodes', '');
for (const [reason, n] of Object.entries(summary.directDecisionReasons).sort((a, b) => b[1] - a[1]))
  md.push('- ' + reason + ': ' + n);
md.push('', '## Top forensic episodes (full records in summary.json/raw.json)', '');
for (const e of summary.episodes.slice(0, 30)) {
  const decisions = Object.entries(e.evidence?.directFireDenials || {})
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => k + '=' + n)
    .join(', ');
  const blocker =
    e.kind === 'movement-inaction' ? e.evidence?.order?.heldBy || e.evidence?.stopReason || '' : '';
  md.push(
    '- **' +
      e.seed +
      '** ' +
      e.actor +
      ' @ ' +
      e.observedAt +
      ' s: ' +
      e.kind +
      ' / ' +
      e.code +
      ' (' +
      e.confidence +
      '; ' +
      e.scope +
      '), ' +
      e.seconds +
      ' s.' +
      (decisions ? ' Direct denial gates: ' + decisions + '.' : '') +
      (blocker ? ' Movement blocker: ' + blocker + '.' : '') +
      ' ' +
      e.interpretation
  );
}
if (!summary.episodes.length) md.push('No qualifying episodes were observed.');
for (const check of summary.navigationRegressions) {
  md.push(
    '',
    '## #361 GE-4 real physical progression sentinel',
    '',
    '- ' + check.type + ':' + check.seed + ' ' + check.squad + ' @ ' + check.interval +
      ': **' + (check.pass ? 'PASS' : 'FAIL') + '**, requiring >=2m net motion AND >=2m objective closure per lead actor.'
  );
  for (const m of check.men)
    md.push('- Soldier ' + m.id + ': ' + m.samples + ' samples, ' +
      m.netMeters + 'm net, ' + m.closedGoalMeters + 'm closer to mission objective.');
}
if (process.env.CAUSAL_LIFECYCLE === '1') {
  md.push('', '## Read-only mission / recon / physical movement chain', '');
  for (const trace of summary.lifecycle) {
    md.push('### ' + trace.type + ':' + trace.seed);
    for (const frame of [...trace.checkpoints, trace.final]) {
      for (const sq of frame.squads) {
        const travel = sq.men.reduce((v, m) => v + m.travel, 0);
        const owners = [...new Set(sq.men.map(m => m.resolver || 'none'))].join('/');
        md.push('- t=' + frame.t + ' ' + sq.faction + ':' + sq.id +
          ' phase=' + sq.phase + ' mission=' +
          (sq.mission ? sq.mission.intent + '/v' + sq.mission.version + '/' + sq.mission.status : 'none') +
          ' living=' + sq.living + ' centroidDisplacement=' + sq.displacement.toFixed(1) +
          'm livingMenTravel=' + travel.toFixed(1) + 'm reconActive=' + sq.recon +
          ' resolverOwners=' + owners);
      }
    }
    for (const t of trace.transitions.filter(t => t.recon).slice(-25))
      md.push('- recon active @' + t.t + ' ' + t.faction + ':' + t.id +
        ' mission v' + t.missionVersion + ' ' + t.intent + ' phase=' + t.phase);
    md.push('- Transition records: ' + trace.transitions.length +
      ' (full order/recon transitions and physical coordinates in summary.json).');
  }
}
if (summary.episodesOmitted)
  md.push(
    '',
    '**Warning:** ' +
      summary.episodesOmitted +
      ' episodes omitted due to the per-battle cap. Narrow CAUSAL_* filters or replay seeds.'
  );
if (summary.directDenialsOmitted)
  md.push(
    '',
    '**Warning:** ' +
      summary.directDenialsOmitted +
      ' direct firing denial events dropped from rolling actor buffers; results may be incomplete.'
  );
if (summary.failures.length)
  md.push('', '## Invalidating failures', '', ...summary.failures.map(s => '- ' + s));
md.push(
  '',
  '### Evidence interpretation',
  '',
  '- Verified cover rejections mean the shipping planner actually took those branches; different candidates can fail different gates in one search.',
  '- A selected flank destination does not prove physical travel; physically arrived and post-selection fire are observed separately.',
  '- Verified means a named authoritative record or real trigger rejection was observed; it does NOT automatically prove the whole inaction interval was caused by that event.',
  '- Likely is a state correlation, NOT a decision-gate invocation or confirmed root cause.',
  '- Unknown explicitly means evidence is insufficient; instrument the responsible decision boundary before changing behavior.',
  '- A held order may be lawful; 12 seconds stationary is a diagnostic candidate, not necessarily a bug.',
  '- Probe/control mismatch or runtime errors invalidates the seed. Outputs still retained for debugging.'
);
fs.writeFileSync(path.join(out, 'summary.md'), md.join('\n') + '\n');
console.error(md.join('\n'));
if (!summary.valid || ran.status) process.exitCode = 1;
