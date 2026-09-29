/* Cover bounds that never arrive (the "Matrix dodge": a man circling a cover slot for minutes).
   Every Engagement `bound` episode per man: how long it lasted, how it ended (arrived = reached
   cover and went to `engage`; rebound = sent to another cover point; other = any other next state;
   open = still bounding at the end), and
   his distance to the cover point when it ended. Reports counts by duration band, the longest
   episodes, and how many open or long ones were stuck within 3 m of their cover (inside the
   movement-progress `FAR` band, where no-progress is never flagged). Observe only. */
(function (root) {
  var c, men;
  function band(sec) {
    return sec < 5 ? '<5s' : sec < 15 ? '5-15s' : sec < 30 ? '15-30s' : sec < 60 ? '30-60s' : '60s+';
  }
  function coverDist(s, e) {
    var p = s.root && s.root.position,
      cv = e && e.cover;
    return p && cv ? Math.hypot(p.x - cv.x, p.z - cv.z) : null;
  }
  function close(s, rec, sim, how) {
    var sec = sim.time - rec.since;
    c.episodes++;
    c.byBand[band(sec)] = (c.byBand[band(sec)] || 0) + 1;
    c.byEnd[how] = (c.byEnd[how] || 0) + 1;
    if (sec >= 30 && rec.lastD != null && rec.lastD <= 3) c.longNearCover++;
    c.longest.push({
      soldier: s.id,
      faction: s.faction,
      seconds: +sec.toFixed(1),
      end: how,
      coverM: rec.lastD == null ? null : +rec.lastD.toFixed(2),
      reason: rec.reason
    });
    c.longest.sort(function (a, b) {
      return b.seconds - a.seconds;
    });
    if (c.longest.length > 10) c.longest.length = 10;
  }
  (root.BattleProbes = root.BattleProbes || {})['bound-episodes'] = {
    every: 0.3,
    start: function () {
      c = { episodes: 0, byBand: {}, byEnd: {}, longNearCover: 0, longest: [] };
      men = new Map();
    },
    sample: function (sim) {
      var all = root.BattleModules.unitsFor(sim);
      for (var i = 0; i < all.length; i++) {
        var s = all[i],
          e = s && s.eng,
          rec = men.get(s),
          bounding = !!(s && !s.dead && e && e.state === 'bound');
        var cv = bounding && e.cover ? e.cover.x + ',' + e.cover.z : null;
        /* Re-deciding into a new bound keeps Engagement's `since`; a new cover point is a new episode. */
        if (bounding && rec && rec.cover !== cv) {
          close(s, rec, sim, 'rebound');
          men.delete(s);
          rec = null;
        }
        if (bounding && !rec)
          men.set(s, (rec = { since: sim.time, reason: e.moveReason || null, lastD: null, cover: cv }));
        if (bounding) rec.lastD = coverDist(s, e);
        else if (rec) {
          close(
            s,
            rec,
            sim,
            s.dead ? 'dead' : e && e.state === 'engage' ? 'arrived' : 'other:' + ((e && e.state) || '?')
          );
          men.delete(s);
        }
      }
    },
    report: function (sim) {
      men.forEach(function (rec, s) {
        close(s, rec, sim, 'open');
      });
      return c;
    }
  };
})(window);
