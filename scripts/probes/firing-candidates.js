/* Why the firing-position planner finds no slot (PR #628: slotAudit shows "no-candidates" 793 times in 100
   battles, "candidates" once). For every squad sample where the planner's own read-only plan reports
   `no-safe-firing-position`, each man the planner would consider (settled, no line, a fresh seen/told threat)
   is walked through the same filters as BattleCoverPositions.coverCandidates, using the public cover
   snapshot: how many slots exist within the 12 m bound reach, how many of those face the threat, how many
   have useful cover, and how many are free. Also the threat's distance and the man's own exposure.
   Observe only: nothing here writes sim state. */
(function (root) {
  var c;
  function bucket(map, key) {
    map[key] = (map[key] || 0) + 1;
  }
  function band(v, edges) {
    for (var i = 0; i < edges.length; i++) if (v <= edges[i]) return '<=' + edges[i];
    return '>' + edges[edges.length - 1];
  }
  (root.BattleProbes = root.BattleProbes || {})['firing-candidates'] = {
    every: 0.6,
    start: function () {
      c = {
        samples: 0,
        men: 0,
        threatDist: {},
        nearestSlot: {},
        slotsWithin12: {},
        funnel: { within12: 0, facing: 0, useful: 0, free: 0, men0: 0 },
        failedAt: {},
        ownExposure: {},
        threatSource: {},
        // The fallback in question: any nearby terrain point with a prone line, no cover slot needed.
        prone: { men: 0, helped: 0, byNearest: {}, pointsPerMan: {}, rejected: {}, helpedBySource: {} }
      };
    },
    sample: function (sim) {
      var R = root.BattleReactiveFireManeuver,
        C = root.BattleCoverPositions,
        F = root.BattleObstacleField,
        E = root.BattleEngagement;
      if (!R || !C || !F || !R.firingPositionPlan) return;
      var units = root.BattleModules.unitsFor(sim),
        squads = new Set();
      units.forEach(function (s) {
        if (s && s.squad && !s.dead) squads.add(s.squad);
      });
      var maxD = C.boundTuning().maxDistance,
        slots = null;
      squads.forEach(function (sq) {
        var task = sq._localTask;
        if (!task || !R.defensiveReadiness(sim, sq).ready) return;
        var plan = R.firingPositionPlan(sim, sq, { fireSupport: sq.members });
        if (plan.reason !== 'no-safe-firing-position') return;
        c.samples++;
        if (!slots) slots = C.snapshot ? C.snapshot(sim) : [];
        sq.members.forEach(function (s) {
          if (!s || s.dead || s.isPlayer || s.moving || !s.weapon) return;
          var ct = root.SquadAI.soldierContact(s, sim);
          if (!ct || ct.source === 'heard' || !(sim.time - ct.at <= 10) || !(ct.confidence >= 0.5)) return;
          var p = s.root.position;
          if (R.firingLineAt(s, sim, p)) return;
          c.men++;
          bucket(c.threatSource, ct.source);
          var td = Math.hypot(ct.x - p.x, ct.z - p.z);
          bucket(c.threatDist, band(td, [30, 60, 100, 200, 400]));
          var near = Infinity,
            w = 0,
            fac = 0,
            use = 0,
            free = 0;
          slots.forEach(function (sl) {
            var d = Math.hypot(sl.x - p.x, sl.z - p.z);
            if (d < near) near = d;
            if (d > maxD) return;
            w++;
            if ((ct.x - sl.x) * sl.normalX + (ct.z - sl.z) * sl.normalZ >= 0) return;
            fac++;
            if (F.coverPotentialAt(sim.obstacles, sl.x, sl.z) > 0.88) return;
            use++;
            if (sl.status === 'free' || sl.soldierId === s.id) free++;
          });
          bucket(c.nearestSlot, isFinite(near) ? band(near, [3, 6, 12, 25, 50]) : 'none');
          bucket(c.slotsWithin12, band(w, [0, 2, 5, 10]));
          c.funnel.within12 += w ? 1 : 0;
          c.funnel.facing += fac ? 1 : 0;
          c.funnel.useful += use ? 1 : 0;
          c.funnel.free += free ? 1 : 0;
          if (!w) bucket(c.failedAt, 'no slot within 12 m');
          else if (!fac) bucket(c.failedAt, 'none faces the threat');
          else if (!use) bucket(c.failedAt, 'none has useful cover');
          else if (!free) bucket(c.failedAt, 'all claimed');
          else bucket(c.failedAt, 'free slot exists (shapeHit or later gate)');
          bucket(c.ownExposure, band(F.coverPotentialAt(sim.obstacles, p.x, p.z), [0.5, 0.88, 1]));
          // Deterministic ring sample: 8 bearings (16 beyond 6 m) at 2..12 m, plus the line toward the threat.
          var threats = C.boundThreats(s, sim),
            tgt = { root: { position: { x: ct.x, y: sim.heightAt(ct.x, ct.z), z: ct.z } } },
            range = root.SquadAI.engageRange(s),
            N = root.BattleNavigation,
            found = 0,
            nearest = Infinity;
          c.prone.men++;
          for (var r = 2; r <= maxD + 1e-9; r += 2) {
            var n = r > 6 ? 16 : 8;
            for (var k = 0; k < n; k++) {
              var a = (k / n) * Math.PI * 2,
                q = { x: p.x + Math.cos(a) * r, z: p.z + Math.sin(a) * r, distance: r };
              if (Math.hypot(ct.x - q.x, ct.z - q.z) > range) continue;
              if (N && N.movementClear && !N.movementClear(q, q)) {
                bucket(c.prone.rejected, 'illegal-point');
                continue;
              }
              if (!E.firingLineClear(s, tgt, q, 'prone', sim)) {
                bucket(c.prone.rejected, 'no-prone-line');
                continue;
              }
              var route = C.boundRoute(s, sim, q, threats, 'firing');
              if (!route.eligible) {
                bucket(c.prone.rejected, 'route:' + route.reason);
                continue;
              }
              found++;
              if (r < nearest) nearest = r;
            }
          }
          bucket(c.prone.pointsPerMan, band(found, [0, 2, 5, 10, 20]));
          if (found) {
            c.prone.helped++;
            bucket(c.prone.byNearest, band(nearest, [2, 4, 6, 8, 12]));
            bucket(c.prone.helpedBySource, ct.source);
          }
        });
      });
    },
    report: function () {
      return c;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
