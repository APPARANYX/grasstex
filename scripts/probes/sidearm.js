/* Sidearm switching (module 47): draws and returns by reason, rounds fired and stoppages by weapon
   kind (the ammunition module's `byWeapon`, so `pistol` is the sidearm), and how many men end the
   battle with the sidearm in hand. Observe only: reads what the sim already keeps. */
(function (root) {
  (root.BattleProbes = root.BattleProbes || {})['sidearm'] = {
    every: 0,
    start: function () {},
    sample: function () {},
    report: function (sim) {
      var men = root.BattleModules.unitsFor(sim),
        inHand = 0,
        carrying = 0;
      for (var i = 0; i < men.length; i++) {
        if (!men[i] || !men[i].secondary) continue;
        carrying++;
        if (men[i]._sidearmSince != null) inHand++;
      }
      var a = sim._ammunitionStats && sim._ammunitionStats.byWeapon;
      return {
        loaded: !!root.BattleSidearm,
        sidearm: sim._sidearm || { draws: 0, returns: 0 },
        carrying: carrying,
        inHandAtEnd: inHand,
        pistol: a && a.pistol,
        lmg: a && a.lmg,
        smg: a && a.smg
      };
    }
  };
})(window);
