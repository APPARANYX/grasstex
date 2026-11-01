/* How many men sit in an `unreachable` movement record, and for how long. Every 5 s counts the living men whose
   newest movement envelope is unreachable (beyond voice and sight of the sender and any relay). Reports man-seconds,
   the number of separate episodes, the longest episode and the number of squads that ever had one. Observe only:
   reads the reception state directly (no settle), draws no RNG, writes nothing. */
(function (root) {
  var open, episodes, manSeconds, longest, squads;
  (root.BattleProbes = root.BattleProbes || {})['unreachable-men'] = {
    every: 5,
    start: function () {
      open = {};
      episodes = 0;
      manSeconds = 0;
      longest = 0;
      squads = {};
    },
    sample: function (sim) {
      var st = sim._commandReception,
        now = +sim.time || 0,
        seen = {};
      ['us', 'ge'].forEach(function (f) {
        ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
          (sq.members || []).forEach(function (s) {
            if (s.dead || s.isPlayer) return;
            var by = st && st.bySoldier[String(s.id)],
              rec = by && by['movement|soldier:' + s.id],
              key = f + ':' + s.id;
            if (!(rec && rec.unreachable)) return;
            seen[key] = 1;
            manSeconds += 5;
            squads[f + ':' + sq.id] = 1;
            if (!open[key]) {
              open[key] = now;
              episodes++;
            }
            longest = Math.max(longest, now - open[key]);
          });
        });
      });
      Object.keys(open).forEach(function (k) {
        if (!seen[k]) delete open[k];
      });
    },
    report: function () {
      return {
        manSeconds: manSeconds,
        episodes: episodes,
        longest: +longest.toFixed(0),
        squads: Object.keys(squads).length
      };
    }
  };
})(window);
