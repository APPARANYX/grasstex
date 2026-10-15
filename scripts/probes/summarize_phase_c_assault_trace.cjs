'use strict';
/* Read-only adjudicator for actual assault-phase arrived reserves.
   Input: native 0.15-second unmodified combat trace JSONs. Never invent
   a fire authorization, shot or covered route from component gate counts. */
const fs = require('node:fs');

function counts(items) {
  return items.reduce((a, x) => ((a[String(x)] = (a[String(x)] || 0) + 1), a), {});
}
function analyze(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const row = (d.results || []).find(x => x.arm === 'on');
  if (!row || !Array.isArray(row.tickTrace) || !row.tickTrace.length)
    throw Error('missing native ON per-tick trace: ' + file);
  const trace = row.tickTrace;
  const attempts = (row.readinessAttempts || []).filter(a => a.firstFullReserveAt != null);
  const arrivals = attempts.map(a => {
    const start = a.firstFullReserveAt,
      end = a.endAt || start + 12,
      samples = trace.filter(t => t.t >= start - 2 && t.t <= Math.min(end + 2, start + 14));
    const nearest = trace.reduce(
      (best, t) => !best || Math.abs(t.t - start) < Math.abs(best.t - start) ? t : best,
      null
    );
    const frame = t => {
      const soldiers = (t.members || []).filter(s => !s.dead);
      const effective = soldiers.filter(s => s.effectiveSupport).map(s => s.id);
      const ownSource = soldiers.filter(s => s.contact && !/told|relayed/i.test(s.contact.source || ''))
        .map(s => s.id);
      const decision = t.posture?.decision;
      return {
        t: t.t,
        phase: t.phase,
        coa: t.coa,
        inContact: t.inContact,
        prepared: t.posture?.readyAt != null,
        posture: t.posture ? [t.posture.mode, t.posture.stage] : null,
        reportCount: (t.contacts || []).length,
        soldierFirsthandIds: ownSource,
        fireControl: t.fireControl?.state || null,
        effectiveSupporterIds: effective,
        liveEffectiveSupportCount: effective.length,
        maneuverDecision: decision?.reason || null,
        coreReady: decision?.coreReady ?? null,
        decisionSupportCount: decision?.supportCount ?? null,
        boundLease: !!t.boundLease
      };
    };
    const serialized = samples.map(frame);
    return {
      operation: a.key || a.squad + '#' + a.serial,
      time: start,
      releasedAt: a.endAt ?? null,
      release: a.release?.reason || null,
      fullReserveContactSamples: a.fullReserveContactSamples,
      fullReservePreparedSamples: a.fullReservePreparedSamples,
      fullReserveAssaultSamples: a.fullReserveAssaultSamples,
      fullReserveTwoSupportSamples: a.fullReserveTwoReadyRiflesSamples,
      closestToArrival: nearest ? frame(nearest) : null,
      nearbyTickSummary: {
        samples: serialized.length,
        withContact: serialized.filter(t => t.inContact).length,
        withPreparation: serialized.filter(t => t.prepared).length,
        withFreshReports: serialized.filter(t => t.reportCount > 0).length,
        withLiveTwoSupport: serialized.filter(t => t.liveEffectiveSupportCount >= 2).length,
        withAuthorizedAssault: serialized.filter(t => t.phase === 'assault').length,
        withAllButRoute: serialized.filter(
          t => t.phase === 'assault' && t.inContact && t.prepared && t.liveEffectiveSupportCount >= 2
        ).length,
        fireControlStates: counts(serialized.map(t => t.fireControl || 'none')),
        decisions: counts(serialized.map(t => t.maneuverDecision || 'none')),
        postureStages: counts(serialized.map(t => (t.posture || []).join('/') || 'none'))
      },
      timeline: serialized.filter(
        (t, i) => i % 6 === 0 || Math.abs(t.t - start) <= 0.3
      )
    };
  });
  return {
    type: d.type,
    seed: row.seed,
    count: trace.length,
    from: trace[0].t,
    to: trace[trace.length - 1].t,
    operationEnabled: !!d.results?.length,
    arrivals
  };
}
if (require.main === module) {
  const paths = process.argv.slice(2);
  if (!paths.length) throw Error('usage: node summarize_phase_c_assault_trace.cjs trace*.json');
  const report = paths.map(analyze);
  for (const item of report)
    if (!item.arrivals.length) throw Error('no native physically arrived reserve: ' + item.type);
  fs.writeFileSync('reports/phase-c-assault-joined.json', JSON.stringify(report, null, 2));
  console.log('PHASE_C_ASSAULT_ARRIVAL_FORENSIC', JSON.stringify(
    report.map(r => ({
      type: r.type,
      seed: r.seed,
      arrivals: r.arrivals.map(a => ({
        operation: a.operation,
        time: a.time,
        release: a.release,
        near: a.closestToArrival,
        summary: a.nearbyTickSummary
      }))
    }))
  ));
}
module.exports = { analyze };
