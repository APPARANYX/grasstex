/* Casualty context: for each man lost, how recently he was holding a target the trigger-time gate refused (a sighting he
   could not fire on), whether the man who hit him was that target, and the victim's squad phase. Answers whether extra
   casualties follow a squad leaving the contact hold. Observe only: reads public state, draws no RNG, writes nothing. */
(function (root) {
  var info, rows;
  function units(sim) {
    try {
      return root.BattleModules.unitsFor(sim) || [];
    } catch (_) {
      return [];
    }
  }
  (root.BattleProbes = root.BattleProbes || {})['casualty-context'] = {
    every: 0.5,
    start: function () {
      info = new Map();
      rows = [];
    },
    sample: function (sim) {
      var G = root.BattleDirectFireLOSGate,
        now = +sim.time || 0;
      units(sim).forEach(function (s) {
        var id = String(s.faction) + ':' + String(s.id),
          i = info.get(id);
        if (!i) info.set(id, (i = { blockedAt: -1e9, target: null, done: false }));
        if (i.done) return;
        if (s.dead) {
          i.done = true;
          var by = s._lastHitBy,
            sq = s.squad;
          rows.push({
            t: +now.toFixed(1),
            faction: s.faction,
            phase: (sq && sq.commandPhase) || null,
            sinceBlocked: +(now - i.blockedAt).toFixed(1),
            killerIsTarget: !!(by && i.target && by === i.target),
            hadTarget: !!i.target,
            killerKnown: !!by
          });
          return;
        }
        if (s.target) {
          i.target = s.target;
          if (G && G.blockReason && G.blockReason(s, sim)) i.blockedAt = now;
        } else if (now - i.blockedAt > 30) i.target = null;
      });
    },
    report: function () {
      return { deaths: rows };
    }
  };
})(window);
