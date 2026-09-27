/* What the rounds do (damage-realism branch): per battle, rounds fired by weapon, body hits by zone
   and what came of them (wounded, dropped, killed, bled out: BattleWounds.summary), and for rounds
   that struck a body how many went through, struck a second man, or flew on past the last one
   (shot.passes / shot.final from 14-z-ballistic-raycast). Real formations, so `secondBody` here is
   the in-game rate; the harness packs men tighter. Observe only: it chains sim.onShot (presentation
   callback, never the combat RNG) and reads summaries. */
(function (root) {
  var c;
  (root.BattleProbes = root.BattleProbes || {})['damage'] = {
    every: 0,
    start: function (sim) {
      c = { bodyHits: 0, through: 0, secondBody: 0, flewOn: 0, byZone: {}, residualEnergy: [] };
      var old = sim.onShot;
      sim.onShot = function (shooter, target, hit, d, shot) {
        if (old) old.apply(sim, arguments);
        var passes = shot && shot.passes;
        if (!passes || !passes.length) return;
        var z = (c.byZone[passes[0].zone] = c.byZone[passes[0].zone] || { hits: 0, through: 0 });
        c.bodyHits++;
        z.hits++;
        if (passes[0].exit) {
          c.through++;
          z.through++;
        }
        if (passes.length > 1) {
          c.secondBody++;
          if (c.residualEnergy.length < 200) c.residualEnergy.push(+passes[1].energy.toFixed(2));
        }
        if (shot.final) c.flewOn++;
      };
    },
    sample: function () {},
    report: function (sim) {
      var ammo = root.BattleAmmunition ? root.BattleAmmunition.summary(sim) : null,
        rounds = {};
      if (ammo)
        Object.keys(ammo.byWeapon).forEach(function (k) {
          rounds[k] = ammo.byWeapon[k].shots;
        });
      var pct = function (a, b) {
        return b ? +((100 * a) / b).toFixed(1) : null;
      };
      return {
        roundsByWeapon: rounds,
        wounds: root.BattleWounds ? root.BattleWounds.summary(sim) : null,
        bodyHits: c.bodyHits,
        throughPct: pct(c.through, c.bodyHits),
        secondBodyPct: pct(c.secondBody, c.bodyHits),
        flewOnPct: pct(c.flewOn, c.bodyHits),
        byZone: c.byZone,
        residualEnergy: c.residualEnergy
      };
    }
  };
})(window);
