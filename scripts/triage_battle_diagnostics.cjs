#!/usr/bin/env node
'use strict';

/* Read-only prioritization of diagnostic evidence already emitted by the browser
   benchmark. This does not change simulation logic or claim causal proof.
   node scripts/triage_battle_diagnostics.cjs reports/battle-benchmark.json reports
*/
const fs = require('node:fs');
const path = require('node:path');

function array(value) {
  return Array.isArray(value) ? value : [];
}
function n(value) {
  return Number.isFinite(+value) ? +value : 0;
}
function incident(kind, event) {
  const rawTime = event?.t ?? event?.at ?? event?.startedAt;
  return {
    kind,
    time: Number.isFinite(+rawTime) ? +(+rawTime).toFixed(2) : null,
    faction: event?.faction || event?.side || null,
    squad: event?.squad || event?.squadId || event?.actor || null,
    reason: event?.reason || event?.resolution || event?.kind || event?.type || null,
    detail: event?.objectiveId || event?.target || event?.field || null
  };
}
function triage(payload) {
  const battles = array(payload?.battles);
  const totals = {
    battles: battles.length,
    evidenceInvalid: 0,
    loops: 0,
    writers: 0,
    routes: 0,
    movement: 0,
    strategicWakes: 0
  };
  const ranked = [];
  for (const b of battles) {
    const evidence = b.diagnosticEvidence || {};
    const analysis = b.diagnosticAnalysis || {};
    const invalid =
      !b.timeline ||
      !Array.isArray(b.timeline.markers) ||
      !Array.isArray(evidence.loops) ||
      !Array.isArray(evidence.conflicts) ||
      analysis.integrity?.ok !== true;
    const loops = array(evidence.loops);
    const conflicts = array(evidence.conflicts);
    const routes = array(b.routeStalls);
    const movement = array(b.movementStalls);
    const wakes = array(b.timeline?.markers).filter(m => m?.kind === 'strategic-stall-wake');
    totals.evidenceInvalid += Number(invalid);
    totals.loops += loops.length;
    totals.writers += conflicts.length;
    totals.routes += routes.length;
    totals.movement += movement.length;
    totals.strategicWakes += wakes.length;
    const events = [
      ...loops.slice(0, 20).map(e => incident('loop-alert', e)),
      ...conflicts.slice(0, 20).map(e => incident('writer-conflict', e)),
      ...routes.slice(0, 20).map(e => incident('route-stall', e)),
      ...movement.slice(0, 20).map(e => incident('movement-stall', e)),
      ...wakes.slice(0, 20).map(e => incident('strategic-wake', e))
    ].sort((a, b) => (a.time ?? Infinity) - (b.time ?? Infinity));
    ranked.push({
      seed: String(b.seed || ''),
      battleType: String(b.battleType || 'unknown'),
      evidenceValid: !invalid,
      score: +(
        (invalid ? 1000 : 0) +
        conflicts.length * 100 +
        routes.length * 35 +
        movement.length * 15 +
        loops.length * 12 +
        wakes.length * 5 +
        Math.min(40, n(b.maxNoObjectiveProgressSeconds) / 30)
      ).toFixed(2),
      counts: {
        loops: loops.length,
        writers: conflicts.length,
        routes: routes.length,
        movement: movement.length,
        strategicWakes: wakes.length
      },
      evidence: events.slice(0, 35)
    });
  }
  ranked.sort((a, b) => b.score - a.score || a.seed.localeCompare(b.seed));
  return {
    schema: 'grasstex-benchmark-triage-v1',
    commit: payload?.summary?.commit || null,
    totals,
    top: ranked.slice(0, 20),
    note: 'Heuristic triage, not root-cause analysis. A defended position or legal road detour must not be presumed stalled.'
  };
}
function markdown(report) {
  const t = report.totals;
  const lines = [
    '# Automated benchmark diagnostics: investigation queue',
    '',
    '- Commit: ' + (report.commit || 'unknown'),
    '- Battles: **' + t.battles + '**, incomplete evidence: **' + t.evidenceInvalid + '**',
    '- Signals: loops **' + t.loops + '**, writer conflicts **' + t.writers +
      '**, route stalls **' + t.routes + '**, soldier stalls **' + t.movement +
      '**, strategic wakes **' + t.strategicWakes + '**',
    '- **Not a causal verdict.** An intentional garrison or a road-aligned detour can appear stalled.',
    '',
    '## Seeds to inspect first',
    '',
    '| Rank | Seed | Scenario | Evidence valid | Score | Loops | Writers | Routes | Movement | Wakes |',
    '|---:|---|---|---|---:|---:|---:|---:|---:|---:|'
  ];
  report.top.forEach((b, i) => {
    const c = b.counts;
    lines.push(
      '| ' + (i + 1) + ' | ' + b.seed + ' | ' + b.battleType + ' | ' +
        (b.evidenceValid ? 'yes' : '**NO**') + ' | ' + b.score + ' | ' +
        [c.loops, c.writers, c.routes, c.movement, c.strategicWakes].join(' | ') + ' |'
    );
  });
  for (const b of report.top.slice(0, 5)) {
    lines.push('', '### ' + b.seed + ' (' + b.battleType + ')', '',
      '| At | Signal | Squad | Details |', '|---:|---|---|---|');
    for (const e of b.evidence.slice(0, 12)) {
      const safe = x => String(x == null ? '-' : x).replaceAll('|', '/').replaceAll('\n', ' ');
      lines.push('| ' + safe(e.time == null ? '-' : e.time + 's') + ' | ' +
        safe(e.kind) + ' | ' + safe([e.faction, e.squad].filter(Boolean).join(':')) +
        ' | ' + safe([e.reason, e.detail].filter(Boolean).join(' / ')) + ' |');
    }
    if (!b.evidence.length) lines.push('| - | No monitored incident | - | Review original artifact |');
  }
  lines.push('', 'The accompanying battle-benchmark.json retains the original timeline, observer windows and incident evidence. Use a targeted per-soldier probe for unresolved causes.');
  return lines.join('\n') + '\n';
}

if (require.main === module) {
  try {
    const source = path.resolve(process.argv[2] || 'reports/battle-benchmark.json');
    const dest = path.resolve(process.argv[3] || path.dirname(source));
    const report = triage(JSON.parse(fs.readFileSync(source, 'utf8')));
    fs.mkdirSync(dest, { recursive: true });
    fs.writeFileSync(path.join(dest, 'diagnostic-triage.json'), JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(path.join(dest, 'diagnostic-triage.md'), markdown(report));
    console.log('DIAGNOSTIC_TRIAGE ' + report.totals.battles + ' battles, ' + report.totals.evidenceInvalid + ' invalid');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
module.exports = { triage, markdown };
