/* What does a strategic-stall wake do? (PR #47, AGENTS.md open issue "Strategic-stall wakes")
   Reads each new `strategic-stall` wake from the General's wake log (`_macroMissionState.recentWakes`)
   and the brief it produced. Per wake: the stalled objective, the new one, whether it was a repeat,
   and for a repeat the question the open issue asks: was there no other objective left (every other
   one already held by the side), or was an alternative there but farther (`nearestOtherM` vs
   `stalledM`, squad centre to objective)? Also totals the General's own `stallOutcomes`. Observe only. */
(function (root) {
  var seen, wakes;
  function centre(sq) {
    var m = (sq.members || []).filter(function (s) { return !s.dead && s.root; });
    if (!m.length) return null;
    return m.reduce(function (a, s) { return { x: a.x + s.root.position.x / m.length, z: a.z + s.root.position.z / m.length }; }, { x: 0, z: 0 });
  }
  function point(o) {
    var d = (o && o.def) || {};
    return { x: +d.x || 0, z: +d.z || 0 };
  }
  (root.BattleProbes = root.BattleProbes || {})['stall-wakes'] = {
    every: 0.45,
    start: function () {
      seen = 0;
      wakes = [];
    },
    sample: function (sim) {
      var st = sim._macroMissionState;
      if (!st || st.wakeCount === seen) return;
      var fresh = st.recentWakes.slice(-Math.min(st.recentWakes.length, st.wakeCount - seen));
      seen = st.wakeCount;
      fresh.forEach(function (w) {
        if (w.reason !== 'strategic-stall') return;
        var sq = null;
        ['us', 'ge'].forEach(function (f) {
          (sim.factions[f].squads || []).forEach(function (q) { if (q.id === w.squad) sq = q; });
        });
        var m = sq && sq._macroMission,
          after = (m && m.objectiveId) || null,
          c = sq && centre(sq),
          O = root.BattleObjectiveSystem,
          others = (sim._objectives || []).filter(function (o) {
            var s = O.status(sim, o.id) || {};
            return o.id !== w.target && s.owner !== w.faction;
          }),
          stalled = w.target && O.get(sim, w.target),
          dist = function (o) { return c ? +Math.hypot(point(o).x - c.x, point(o).z - c.z).toFixed(0) : null; };
        var near = others.map(dist).filter(function (v) { return v != null; }).sort(function (a, b) { return a - b; });
        wakes.push({
          t: w.time, faction: w.faction, squad: w.squad, stalled: w.target, after: after,
          intent: m && m.intent, repeat: !!after && after === w.target,
          othersNotHeld: others.length, stalledM: stalled ? dist(stalled) : null, nearestOtherM: near.length ? near[0] : null
        });
      });
    },
    report: function (sim) {
      var rep = wakes.filter(function (w) { return w.repeat; });
      return {
        stallOutcomes: (sim._macroMissionState && sim._macroMissionState.stallOutcomes) || null,
        wakes: wakes.length,
        repeats: rep.length,
        repeatsWithNoOtherObjective: rep.filter(function (w) { return !w.othersNotHeld; }).length,
        repeatsWithAnAlternative: rep.filter(function (w) { return w.othersNotHeld > 0; }).length,
        list: wakes
      };
    }
  };
})(window);
