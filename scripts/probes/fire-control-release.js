/* Fire-control release counters (?precisionRelease=1, ?holdKeepClock=1). Observe only: sums the counters the Squad
   Leader keeps on each squad, so the on arm proves the flag was live and the off arm shows how often the situation
   arises at all.
     holdTicks, precisionTicks     Squad Leader ticks the squad's bounds were blocked by HOLD / PRECISION
     precisionPastWindow           of those, PRECISION ticks older than the HOLD window (what precisionRelease frees)
     released                      ticks actually released (nonzero only with the flag on)
     retargetKept, retargetRestarted   target changes during preparation that kept / restarted the HOLD clock */
(function (root) {
  'use strict';
  (root.BattleProbes = root.BattleProbes || {})['fire-control-release'] = {
    every: 0,
    start: function () {},
    sample: function () {},
    report: function (sim) {
      var out = {
        holdTicks: 0,
        precisionTicks: 0,
        precisionPastWindow: 0,
        released: 0,
        retargetKept: 0,
        retargetRestarted: 0
      };
      ['us', 'ge'].forEach(function (side) {
        ((sim.factions && sim.factions[side] && sim.factions[side].squads) || []).forEach(function (sq) {
          var b = sq._fcBlock,
            r = sq._fcRetarget;
          if (b) {
            out.holdTicks += b.hold;
            out.precisionTicks += b.precision;
            out.precisionPastWindow += b.precisionPastWindow;
            out.released += b.released;
          }
          if (r) {
            out.retargetKept += r.kept;
            out.retargetRestarted += r.restarted;
          }
        });
      });
      return out;
    }
  };
})(window);
