/* The first minute of a squad's march, per squad (AGENTS.md open issue "Personal-space corrections":
   about half of cross-team crossings happened in the first minute). For each squad: its command phase
   at 3 s, how far its formation frame turned between the first published fireteam order and the one
   in force at 3 s (`turn`, degrees: a formation laid out in one frame and marched in another walks
   through itself), and body-contact onsets (<0.9 m) between its own men in the first 60 s, with the
   share between different fireteams (`cross`). Written while spawning men on their fireteam slots
   (16 `placeAtSlots`): it showed the collapsed pre-brief axis (every slot on the anchor) and that
   garrisoned defenders got worse when placed before module 21 handed out their posts.
   Observe only: its bookkeeping lives outside the sim. */
(function (root) {
  var P = {},
    rows,
    prev;
  function fw(q) {
    var o = q._fireteamOrders && (q._fireteamOrders.alpha || q._fireteamOrders.command);
    return o && o.forward;
  }
  P.every = 0;
  P.start = function () {
    rows = {};
    prev = {};
  };
  P.sample = function (sim) {
    if (sim.time > 60) return;
    ['us', 'ge'].forEach(function (f) {
      sim.factions[f].squads.forEach(function (q) {
        var r = (rows[q.id] = rows[q.id] || { phase: null, f0: null, f1: null, onsets: 0, cross: 0 }),
          v = fw(q);
        if (v && !r.f0 && Math.hypot(v.x, v.z) > 0.5) r.f0 = [v.x, v.z];
        if (sim.time > 3 && !r.f1 && v) {
          r.f1 = [v.x, v.z];
          r.phase = q.commandPhase;
        }
        var m = q.members.filter(function (s) {
          return !s.dead;
        });
        for (var i = 0; i < m.length; i++)
          for (var j = i + 1; j < m.length; j++) {
            var a = m[i].root.position,
              b = m[j].root.position,
              k = q.id + ':' + m[i].id + ':' + m[j].id,
              c = Math.hypot(a.x - b.x, a.z - b.z) < 0.9;
            if (c && !prev[k]) {
              r.onsets++;
              if (m[i]._fireteamKey !== m[j]._fireteamKey) r.cross++;
            }
            prev[k] = c;
          }
      });
    });
  };
  P.report = function () {
    var out = {};
    for (var id in rows) {
      var r = rows[id],
        t =
          r.f0 && r.f1
            ? Math.round(
                (Math.acos(Math.max(-1, Math.min(1, r.f0[0] * r.f1[0] + r.f0[1] * r.f1[1]))) * 180) / Math.PI
              )
            : null;
      out[id] = { phase: r.phase, turn: t, onsets: r.onsets, cross: r.cross };
    }
    return out;
  };
  (root.BattleProbes = root.BattleProbes || {})['spawn-slots'] = P;
})(window);
