/* Measure final soldier destinations that land behind the squad's firing line while the squad
   advances. Uses Order Provenance's already-instrumented `destination` writes so the report can
   attribute each final destination to the proposal producer without changing movement behavior.
   A 4 m allowance permits an adjacent-cover/lateral step just behind the line. Observe only. */
(function (root) {
  'use strict';
  var ALLOWANCE = 4,
    seen,
    totals,
    byProducer,
    examples;

  function point(p) {
    return p && isFinite(+p.x) && isFinite(+p.z) ? { x: +p.x, z: +p.z } : null;
  }
  function advancePhase(sq) {
    var phase = String((sq && sq.commandPhase) || '');
    return ['approach', 'advance', 'assault', 'capture', 'clear-town', 'flank', 'contact', 'corner-check'].indexOf(phase) >= 0;
  }
  function exempt(sq) {
    var state = String((sq && sq.state) || ''),
      phase = String((sq && sq.commandPhase) || '');
    return state === 'retreat' || state === 'withdraw' || phase === 'retreat' || phase === 'withdraw';
  }
  function axis(sq) {
    var a = point(sq && (sq.orderAnchor || sq.rally)),
      g = point(sq && (sq.objective || sq.home));
    if (!a) return null;
    var dx = g ? g.x - a.x : 0,
      dz = g ? g.z - a.z : 0,
      l = Math.hypot(dx, dz);
    if (l < 0.1 && sq && sq._formationForward) {
      dx = +sq._formationForward.x || 0;
      dz = +sq._formationForward.z || 0;
      l = Math.hypot(dx, dz);
    }
    return l >= 0.1 ? { anchor: a, fx: dx / l, fz: dz / l } : null;
  }
  function bucket(name) {
    name = String(name || 'unknown');
    return byProducer[name] || (byProducer[name] = { writes: 0, backward: 0 });
  }
  function units(sim) {
    return root.BattleModules && root.BattleModules.unitsFor ? root.BattleModules.unitsFor(sim) :
      ((sim._roster && sim._roster.us) || []).concat((sim._roster && sim._roster.ge) || []);
  }

  (root.BattleProbes = root.BattleProbes || {})['backward-orders'] = {
    every: 0,
    start: function (sim) {
      seen = Object.create(null);
      totals = { writes: 0, backward: 0, advanceSamples: 0 };
      byProducer = Object.create(null);
      examples = [];
      if (root.BattleOrderProvenance) root.BattleOrderProvenance.instrument(sim);
    },
    sample: function (sim) {
      var P = root.BattleOrderProvenance;
      if (!P) return;
      P.instrument(sim);
      P.sample(sim);
      var a = units(sim);
      for (var i = 0; i < a.length; i++) {
        var s = a[i],
          sq = s && s.squad;
        if (!s || s.dead || !sq || !advancePhase(sq) || exempt(sq)) continue;
        var ax = axis(sq);
        if (!ax) continue;
        totals.advanceSamples++;
        var hist = P.history(s, 'destination', 32),
          key = String(s.id),
          last = seen[key] || 0;
        for (var j = 0; j < hist.length; j++) {
          var e = hist[j];
          if (!(+e.id > last)) continue;
          last = Math.max(last, +e.id || 0);
          var to = point(e.to);
          if (!to) continue;
          var producer = e.proposalOwner || e.owner || 'unknown',
            b = bucket(producer),
            along = (to.x - ax.anchor.x) * ax.fx + (to.z - ax.anchor.z) * ax.fz;
          totals.writes++;
          b.writes++;
          if (along < -ALLOWANCE) {
            totals.backward++;
            b.backward++;
            if (examples.length < 80)
              examples.push({
                t: +(+e.time || sim.time || 0).toFixed(2),
                faction: sq.faction || null,
                squad: sq.id == null ? null : String(sq.id),
                soldier: key,
                phase: sq.commandPhase || null,
                producer: producer,
                behindLineM: +(-along).toFixed(2),
                destination: to,
                anchor: ax.anchor
              });
          }
        }
        seen[key] = last;
      }
    },
    report: function () {
      var rows = Object.keys(byProducer).map(function (name) {
        var b = byProducer[name];
        return {
          producer: name,
          writes: b.writes,
          backward: b.backward,
          backwardRate: b.writes ? +(b.backward / b.writes).toFixed(4) : 0
        };
      }).sort(function (a, b) { return b.backward - a.backward || b.writes - a.writes; });
      return {
        allowanceM: ALLOWANCE,
        destinationWritesWhileAdvancing: totals.writes,
        backwardOrders: totals.backward,
        backwardRate: totals.writes ? +(totals.backward / totals.writes).toFixed(4) : 0,
        byProducer: rows,
        examples: examples
      };
    }
  };
})(window);
