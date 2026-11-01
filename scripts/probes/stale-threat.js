/* How much does a man act on an old sighting? Every 2 s, for each living man in Engagement's alert or suppress state with
   no live squad contact, the age of `lastSeen` (the fallback in `knownThreat`). Reports man-seconds by age band, how many
   of those men are designated suppressors (whose hold is renewed for as long as an aim point exists), the longest run of
   one man on a stale point, and the same man-seconds of alert/suppress with a live contact. Observe only: reads state,
   draws no RNG, writes nothing. */
(function (root) {
  var out, run, longest;
  (root.BattleProbes = root.BattleProbes || {})['stale-threat'] = {
    every: 2,
    start: function () {
      out = {
        live: 0,
        old_0_10: 0,
        old_10_30: 0,
        old_30_plus: 0,
        supStale10: 0,
        noSighting: 0,
        suppressLive: 0
      };
      run = {};
      longest = { s: 0, who: null };
    },
    sample: function (sim) {
      var SA = root.SquadAI;
      ['us', 'ge'].forEach(function (f) {
        ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
          (sq.members || []).forEach(function (s) {
            if (s.dead || !s.root || s.isPlayer || !s.eng) return;
            var e = s.eng;
            if (e.state !== 'alert' && e.state !== 'suppress') {
              delete run[s.id];
              return;
            }
            var c = null;
            try {
              c = SA && SA.soldierContact ? SA.soldierContact(s, sim) : null;
            } catch (_) {}
            if (c) {
              out.live += 2;
              if (e.suppressOrder) out.suppressLive += 2;
              delete run[s.id];
              return;
            }
            if (!e.lastSeen) {
              out.noSighting += 2;
              delete run[s.id];
              return;
            }
            var age = sim.time - (+e.lastSeenAt || 0);
            if (age <= 10) out.old_0_10 += 2;
            else if (age <= 30) out.old_10_30 += 2;
            else out.old_30_plus += 2;
            if (age > 10) {
              if (e.suppressOrder) out.supStale10 += 2;
              run[s.id] = (run[s.id] || 0) + 2;
              if (run[s.id] > longest.s)
                longest = { s: run[s.id], who: f + ':' + s.id + '@' + sim.time.toFixed(0) };
            } else delete run[s.id];
          });
        });
      });
    },
    report: function () {
      out.longestRun = longest;
      return out;
    }
  };
})(window);
