/* ?retreatTeams=1 on real battles: does a holding team ever hold, and what does it cost.
   Observe only (reads squad and soldier state; writes nothing, draws no random number).

   Per battle: holds started (sq.retreatHolds), seconds a team was holding, retreating squad-seconds and how
   many of those were in contact, holder men seen dying while their team held, and men who held and lived.
   Sampled every 0.15 s (each AI tick). */
(function (root) {
  'use strict';
  var seen, out;
  function holders(sq) {
    var h = sq._retreatHold;
    return h
      ? (sq.members || []).filter(function (m) {
          return m && m._fireteamKey === h.team;
        })
      : [];
  }
  (root.BattleProbes = root.BattleProbes || {})['retreat-holds'] = {
    every: 0,
    start: function () {
      seen = new Map();
      out = {
        holds: 0,
        holdSeconds: 0,
        retreatSquadSeconds: 0,
        retreatContactSeconds: 0,
        holderDeaths: 0,
        holderManSeconds: 0
      };
    },
    sample: function (sim) {
      var dt = sim.dt || 0.15;
      ['us', 'ge'].forEach(function (side) {
        ((sim.factions && sim.factions[side] && sim.factions[side].squads) || []).forEach(function (sq) {
          if (sq.state !== 'retreat') return;
          out.retreatSquadSeconds += dt;
          if (sq.inContact) out.retreatContactSeconds += dt;
          var prev = seen.get(sq) || { men: null };
          var men = holders(sq);
          if (men.length) {
            out.holdSeconds += dt;
            out.holderManSeconds += dt * men.length;
            if (prev.alive)
              prev.alive.forEach(function (m) {
                if (m.dead) out.holderDeaths++;
              });
          }
          prev.alive = men.filter(function (m) {
            return !m.dead;
          });
          seen.set(sq, prev);
        });
      });
    },
    report: function (sim) {
      var n = 0;
      ['us', 'ge'].forEach(function (side) {
        ((sim.factions && sim.factions[side] && sim.factions[side].squads) || []).forEach(function (sq) {
          n += sq.retreatHolds || 0;
        });
      });
      out.holds = n;
      Object.keys(out).forEach(function (k) {
        out[k] = Math.round(out[k] * 100) / 100;
      });
      return out;
    }
  };
})(window);
