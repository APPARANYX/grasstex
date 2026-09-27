/* Do bodies stack at firing stations? (PR #42, "window crowding")
   Every 0.5 s: for each firing station, who stands on it (within ON_STATION m of the station point)
   and who holds its reservation (BattleTacticalPositions). Counts occupied-station samples, samples
   with two or more men on one station, a non-holder on a held station (and in how many battles that
   happens: see `nonHolderOnHeld`), and men crossing a free station. Observe only. */
(function (root) {
  var ON_STATION = 0.6;
  var c;
  function men(sim) {
    return (sim._roster.us || []).concat(sim._roster.ge || []).filter(function (s) {
      return !s.dead && s.root;
    });
  }
  (root.BattleProbes = root.BattleProbes || {})['station-occupancy'] = {
    every: 0.5,
    start: function () {
      c = { samples: 0, occupied: 0, stacked: 0, holderOnStation: 0, nonHolderOnHeld: 0, onFreeStation: 0, stackedExamples: [], nonHolderExamples: [] };
    },
    sample: function (sim) {
      var N = root.BattleNavigation,
        P = root.BattleTacticalPositions,
        stations = (N && N.firingStations) || [];
      if (!stations.length || !P) return;
      c.samples++;
      var all = men(sim),
        holderOf = {};
      all.forEach(function (s) {
        var t = P.current(s);
        if (t && t.station) holderOf[t.station] = s;
      });
      stations.forEach(function (st) {
        var on = all.filter(function (s) {
          return Math.hypot(s.root.position.x - st.x, s.root.position.z - st.z) <= ON_STATION;
        });
        if (!on.length) return;
        c.occupied++;
        var holder = holderOf[st.id];
        if (on.length > 1) {
          c.stacked++;
          if (c.stackedExamples.length < 10) c.stackedExamples.push({ t: +sim.time.toFixed(1), station: st.id, men: on.map(function (s) { return s.id; }), holder: holder ? holder.id : null });
        }
        on.forEach(function (s) {
          if (holder === s) c.holderOnStation++;
          else if (holder) {
            c.nonHolderOnHeld++;
            if (c.nonHolderExamples.length < 10) c.nonHolderExamples.push({ t: +sim.time.toFixed(1), station: st.id, man: s.id, holder: holder.id });
          } else c.onFreeStation++;
        });
      });
    },
    report: function (sim) {
      var s = sim._tacticalPositionSummary || {};
      return Object.assign({}, c, { claimCollisionsPrevented: s.claimCollisionsPrevented || 0, reservedStationsSkipped: s.reservedStationsSkipped || 0 });
    }
  };
})(window);
