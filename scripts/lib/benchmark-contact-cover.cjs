/* Read-only contact-cover lifecycle evidence, used by the benchmark and hosted probe. */
(function (root) {
  'use strict';
  function create(R, b) {
    const active = new Map(),
      lastArrival = new Map(),
      rows = [];
    const counts = {
      selected: 0,
      arrived: 0,
      orientedAfterArrival: 0,
      interrupted: 0,
      shotsBeforeArrival: 0
    };
    function shot(s) {
      if (active.has(s) && R.BattleEngagement.contactCoverFirstActive(s)) counts.shotsBeforeArrival++;
      const row = lastArrival.get(s);
      if (row && row.firstShotAt == null) row.firstShotAt = b.time;
    }
    function sample() {
      for (const f of ['us', 'ge'])
        for (const s of b._roster[f] || []) {
          const e = s.eng;
          if (!s.dead && R.BattleEngagement.contactCoverFirstActive(s) && !active.has(s)) {
            counts.selected++;
            active.set(s, {
              id: s.id,
              faction: f,
              squad: s.squad && s.squad.id,
              at: b.time,
              start: { x: s.root.position.x, z: s.root.position.z },
              goal: e.cover && { x: e.cover.x, z: e.cover.z },
              arrivedAt: null,
              orientedAt: null,
              firstShotAt: null
            });
          }
        }
      for (const [s, row] of active) {
        const e = s.eng,
          d = row.goal
            ? Math.hypot(s.root.position.x - row.goal.x, s.root.position.z - row.goal.z)
            : Infinity;
        if (!s.dead && d <= 0.45 && row.arrivedAt == null) row.arrivedAt = b.time;
        if (!R.BattleEngagement.contactCoverFirstActive(s) || s.dead) {
          row.end = b.time;
          row.metres = Math.hypot(s.root.position.x - row.start.x, s.root.position.z - row.start.z);
          row.reason = e && e.transition && e.transition.reason;
          if (!s.dead && row.arrivedAt != null && row.metres > 0.75) {
            counts.arrived++;
            lastArrival.set(s, row);
            if (e.state === 'orient' && row.reason === 'contact cover reached') {
              row.orientedAt = b.time;
              counts.orientedAfterArrival++;
            }
          } else counts.interrupted++;
          if (rows.length < 500) rows.push(row);
          active.delete(s);
        }
      }
    }
    function snapshot() {
      return {
        ...counts,
        active: active.size,
        rowsOmitted: counts.arrived + counts.interrupted - rows.length,
        rows: rows.map(r => ({ ...r, start: { ...r.start }, goal: r.goal && { ...r.goal } }))
      };
    }
    return { sample, shot, snapshot };
  }
  const api = { create };
  if (typeof module !== 'undefined') module.exports = api;
  else root.BattleBenchmarkContactCover = api;
})(typeof window !== 'undefined' ? window : globalThis);
