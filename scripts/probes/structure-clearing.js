/* Does the structure-security chain (?localPlan + the nine local flags) run? Reads the local plan's own
   summary (task choices and structure counters: physical entries, survey completions, stable watches,
   security holds, route handbacks) at the end of the battle. Observe only. */
(function (root) {
  (root.BattleProbes = root.BattleProbes || {})['structure-clearing'] = {
    every: 0,
    start: function () {},
    sample: function () {},
    report: function (sim) {
      var P = root.BattleSquadStability && root.BattleSquadStability.localPlan;
      return {
        controller: /[?&]tacticalController=new/.test(root.location.search),
        summary: P && P.summary ? P.summary(sim) : null
      };
    }
  };
})(window);
