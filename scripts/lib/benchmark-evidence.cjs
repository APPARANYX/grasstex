'use strict';

/* Observe-only interpretation of benchmark evidence. Never called from the sim step.
 * The timeline is cumulative, even when a benchmark record is one scripted window.
 */
function assessEvidence(b) {
  const tl = b.timeline || {};
  const win = b.window || null;
  const lo = win ? Number(win.openedAt) : -Infinity;
  const hi = win ? Number(win.closedAt) : Infinity;
  const markers = (tl.markers || []).filter(m => m && Number.isFinite(Number(m.t)));
  const inside = m => +m.t > lo + 1e-9 && +m.t <= hi + 1e-9;
  const events = markers.filter(inside);
  const incidentKinds = {};
  for (const m of events) incidentKinds[m.kind || 'unknown'] = (incidentKinds[m.kind || 'unknown'] || 0) + 1;
  const active = new Map();
  const incidents = [];
  // Pair each stall termination with its onset, including one that began before a window.
  function key(m) {
    const d = m;
    return [d.side || d.faction || '', d.squad || d.squadId || '', d.soldier || d.soldierId || d.id || ''].join(':');
  }
  for (const m of markers) {
    if (m.kind === 'stall-start') active.set(key(m), m);
    else if (m.kind === 'stall-end') {
      const onset = active.get(key(m));
      if (inside(m)) {
        const duration = onset ? Math.max(0, +m.t - +onset.t) : Number(m.duration);
        incidents.push({
          kind: 'movement-stall', actor: key(m),
          startedAt: onset ? +onset.t : null, endedAt: +m.t,
          durationSeconds: Number.isFinite(duration) ? +duration.toFixed(2) : null,
          resolution: m.reason || 'unknown', outcome: 'ended',
          onset: onset || null, end: m || null
        });
      }
      active.delete(key(m));
    }
  }
  for (const [actor, onset] of active) {
    if (inside(onset) || (win && +onset.t <= hi && +onset.t <= lo)) {
      if (+onset.t > hi) continue;
      incidents.push({
        kind: 'movement-stall', actor, startedAt: +onset.t, endedAt: null,
        durationSeconds: null, resolution: null, outcome: 'censored', onset: onset || null
      });
    }
  }
  // The timeline records brief changes, phases, and stalls, but not a definitive
  // order acknowledgement. This is chronology, never proof that an order was accepted.
  const commandEpisodes = [];
  const bySquad = new Map();
  const squadKey = m => [m.side || m.faction || '', m.squad || m.squadId || ''].join(':');
  for (const m of markers) {
    const actor = squadKey(m);
    if (m.kind === 'brief-change') {
      const previous = bySquad.get(actor);
      if (previous && previous.outcome === 'unresolved') previous.outcome = 'superseded';
      const ep = {
        actor, issuedAt: +m.t, brief: m,
        phaseTransitions: [], stallOnsets: [], progressSignals: [],
        outcome: 'unresolved', acceptance: 'not-observed',
        movementOwnership: 'not-attributed'
      };
      commandEpisodes.push(ep);
      bySquad.set(actor, ep);
    } else {
      const ep = bySquad.get(actor);
      if (!ep) continue;
      if (m.kind === 'phase-change') ep.phaseTransitions.push(m);
      if (m.kind === 'stall-start') ep.stallOnsets.push(m);
      // A low-forward-progress diagnostic is a negative observation,
      // not proof of progress or recovery.
      if (m.kind === 'low-forward-progress') ep.progressSignals.push(m);
    }
  }
  const scopedCommands = commandEpisodes.filter(ep =>
    ep.issuedAt <= hi + 1e-9 && (!win || ep.issuedAt > lo + 1e-9 ||
      ep.phaseTransitions.some(inside) || ep.stallOnsets.some(inside)));
  const wakeEpisodes = events.filter(m => m.kind === 'strategic-stall-wake').map(w => {
    const actor = squadKey(w);
    const later = markers.filter(m => +m.t > +w.t && +m.t <= Math.min(+w.t + 120, hi) &&
      (m.side || m.faction || '') === (w.side || w.faction || '') &&
      (!w.squad || squadKey(m) === actor));
    const nextBrief = later.find(m => m.kind === 'brief-change');
    const nextPhase = later.find(m => m.kind === 'phase-change');
    return {
      at: +w.t, actor, objective: w.objective || null,
      nextBriefAt: nextBrief ? +nextBrief.t : null,
      nextPhaseAt: nextPhase ? +nextPhase.t : null,
      outcome: 'unverified',
      reason: 'Order acceptance and sustained mission progress require independent evidence'
    };
  });
  const conflicts = b.diagnosticEvidence?.conflicts || b.writerConflictDetails || [];
  const loops = b.diagnosticEvidence?.loops || b.loopAlerts || [];
  const discrepancies = [];
  if (conflicts.length !== (b.writerConflicts || 0)) discrepancies.push('writer-conflict-count');
  // Legacy benchmark records may contain truncated loopAlerts.
  if (b.diagnosticEvidence && loops.length !== (b.diagnosticEvidence.loops || []).length) discrepancies.push('loop-count');
  if (win && (lo > hi || !Number.isFinite(lo) || !Number.isFinite(hi))) discrepancies.push('invalid-window');
  return {
    schema: 'grasstex-benchmark-analysis-v1',
    window: win ? { openedAt: lo, closedAt: hi } : null,
    incidentKinds, movementStallEpisodes: incidents,
    commandEpisodes: scopedCommands, strategicWakeEpisodes: wakeEpisodes,
    movementStallCompleted: incidents.filter(x => x.outcome === 'ended').length,
    movementStallCensored: incidents.filter(x => x.outcome === 'censored').length,
    integrity: { ok: discrepancies.length === 0, discrepancies },
    interpretation: 'An ended stall is not proof of successful recovery; use end reason and subsequent progress.'
  };
}
module.exports = { assessEvidence };
