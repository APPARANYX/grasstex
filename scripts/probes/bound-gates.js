/* Why does no squad leader order a bound? For every squad in contact, each sample, the FIRST gate that stands between
   the squad and a fireteam bound, in the order fireAndMovement (15j) applies them. Observe only; reads the flags
   the Squad Leader itself leaves on the squad (`_assaultAuthorized`, `effectiveCount`, `pinnedCount`, `fireControl`)
   and the bound / bound-cycle leases. A squad that is not authorised is split by its local-plan task kind, whether that
   task allows bounds, and its course of action. `bounded` counts samples where a bound lease is live (a bound was ordered). */
(function (root) {
  var c;
  function gate(sq, t) {
    var L = root.BattleLeases,
      fc = sq.fireControl && sq.fireControl.state;
    if (sq.state === 'retreat') return 'retreat';
    if (L.holds(sq, 'bound', t)) return 'bounded';
    if (fc === 'hold' || fc === 'precision') return 'fire-control-' + fc;
    if (!sq._assaultAuthorized) {
      var task = sq._localTask;
      return (
        'not-authorized:' +
        (sq.commandPhase || 'none') +
        (task ? ':task-' + task.kind + (task.boundsAllowed ? '+bounds' : '-bounds') : ':no-task') +
        (sq.coa ? ':coa-' + sq.coa : '')
      );
    }
    if (L.holds(sq, 'bound-cycle', t)) return 'bound-cycle';
    if ((sq.effectiveCount || 0) < 2) return 'effective<2';
    if ((sq.pinnedCount || 0) >= (sq.effectiveCount || 0)) return 'pinned>=effective';
    return 'open';
  }
  (root.BattleProbes = root.BattleProbes || {})['bound-gates'] = {
    every: 0.3,
    start: function () {
      c = { squadSamples: 0, byGate: {} };
    },
    sample: function (sim) {
      var units = root.BattleModules.unitsFor(sim),
        seen = {};
      for (var i = 0; i < units.length; i++) {
        var sq = units[i] && !units[i].dead && units[i].squad;
        if (!sq || seen[sq.id] || !sq.inContact) continue;
        seen[sq.id] = 1;
        var g = gate(sq, sim.time);
        c.squadSamples++;
        c.byGate[g] = (c.byGate[g] || 0) + 1;
      }
    },
    report: function () {
      return c;
    }
  };
})(window);
