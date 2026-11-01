/* Does the squad relay help one side more than the other? Per faction: the movement envelopes delivered through a relay
   (hops 2) and left unreachable, counted once per man and envelope, the unreachable man-samples (5 s each), and the
   living men at the end. Observe only: reads the reception state directly (no settle), draws no RNG, writes nothing. */
(function (root) {
  var seen, out;
  function side() {
    return { relayed: 0, unreachableEnvelopes: 0, unreachableSamples: 0, alive: 0 };
  }
  (root.BattleProbes = root.BattleProbes || {})['relay-side'] = {
    every: 5,
    start: function () {
      seen = {};
      out = { us: side(), ge: side() };
    },
    sample: function (sim) {
      var st = sim._commandReception;
      ['us', 'ge'].forEach(function (f) {
        ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
          (sq.members || []).forEach(function (s) {
            if (s.dead || s.isPlayer) return;
            var by = st && st.bySoldier[String(s.id)];
            if (!by) return;
            Object.keys(by).forEach(function (k) {
              var r = by[k],
                key = s.id + '|' + k + '|' + r.envelopeId;
              if (!r || /^movement\|/.test(k) === false) return;
              if (r.unreachable && k === 'movement|soldier:' + s.id) out[f].unreachableSamples++;
              if (seen[key]) return;
              seen[key] = 1;
              if (r.unreachable) out[f].unreachableEnvelopes++;
              else if (r.hops > 1) out[f].relayed++;
            });
          });
        });
      });
    },
    report: function (sim) {
      ['us', 'ge'].forEach(function (f) {
        var n = 0;
        ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
          (sq.members || []).forEach(function (s) {
            if (!s.dead) n++;
          });
        });
        out[f].alive = n;
      });
      return out;
    }
  };
})(window);
