/* Observe-only: captures every Loop Watch alert with the context needed to classify it
   (stance trail and Engagement/resolver writers for the implicated men). */
(function (root) {
  'use strict';
  var seen, out;
  function find(sim, a) {
    var qs = (sim.factions && sim.factions[a.faction] && sim.factions[a.faction].squads) || [];
    for (var i = 0; i < qs.length; i++)
      if (String(qs[i].id) === String(a.squadId))
        for (var m = qs[i].members || [], j = 0; j < m.length; j++)
          if (String(m[j].id) === String(a.soldierId)) return m[j];
    return null;
  }
  function ingest(sim) {
    var al = (sim._aiLoopWatch && sim._aiLoopWatch.alerts) || [];
    for (var i = 0; i < al.length; i++) {
      var a = al[i],
        k = a.key + '|' + a.at;
      if (seen[k]) continue;
      seen[k] = 1;
      var s = a.soldierId != null ? find(sim, a) : null;
      out.push({
        alert: JSON.parse(JSON.stringify(a)),
        stanceTrail:
          s && s.eng && s.eng.stanceTrail ? JSON.parse(JSON.stringify(s.eng.stanceTrail.slice(-8))) : null,
        engState: s && s.eng && s.eng.state,
        mindBand: s && s.mind && s.mind.band
      });
    }
  }
  (root.BattleProbes = root.BattleProbes || {})['loop-alerts'] = {
    every: 0.3,
    start: function (sim) {
      seen = Object.create(null);
      out = [];
      ingest(sim);
    },
    sample: ingest,
    report: function (sim) {
      ingest(sim);
      return { count: out.length, alerts: out };
    }
  };
})(window);
