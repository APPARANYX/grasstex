/* How a battle ended, for A/B arms of a behaviour change (the GitHub benchmark is the arbiter; this is the
   quick local look): winner, the living and kills per side, objectives held per side, time. Observe only. */
(function (root) {
  (root.BattleProbes = root.BattleProbes || {}).outcome = {
    every: 0,
    start: function () {},
    sample: function () {},
    report: function (sim) {
      var f = sim.factions,
        ctl = sim.objectiveControl || {},
        held = { us: 0, ge: 0, neutral: 0 };
      Object.keys(ctl).forEach(function (id) {
        var c = ctl[id],
          side = c && (c.owner || c.controller || c.side || c);
        if (side === 'us' || side === 'ge') held[side]++;
        else held.neutral++;
      });
      return {
        winner: sim.winner || null,
        time: +(+sim.time).toFixed(0),
        aliveUs: f.us.alive,
        aliveGe: f.ge.alive,
        killsUs: f.us.kills,
        killsGe: f.ge.kills,
        held: held
      };
    }
  };
})(window);
