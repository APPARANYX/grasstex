/* Does a regroup still know which way is forward? (AGENTS.md open issue "Regroups".) A regroup
   sets sq.objective to its own anchor, which is also the order anchor, so `16` `commandForward`
   has no objective axis and falls back to `_formationForward` (set by SquadAI `formationSlot`, which
   runs only for men with no orderDestination). With neither, the axis is zero: no man can be a
   trimmable straggler, so a regroup cannot release on cohesion and runs to its clock. Per Squad
   Leader tick in a regroup: whether the axis collapsed, and how many men the assessment scored as
   outrunners while standing behind the anchor on the squad's march direction (its last good axis).
   Observe only. */
(function (root) {
  var c, lastAxis;
  function axis(sq) {
    var a = sq.orderAnchor || sq.rally, g = sq.objective || sq.home;
    if (!a || !g) return null;
    var dx = g.x - a.x, dz = g.z - a.z, l = Math.hypot(dx, dz);
    return l < 0.1 ? null : { x: dx / l, z: dz / l };
  }
  (root.BattleProbes = root.BattleProbes || {})['regroup-axis'] = {
    every: 0.45,
    start: function () {
      lastAxis = new Map();
      c = { regroupSamples: 0, collapsed: 0, collapsedNoFormationFrame: 0, outrunnersBehind: 0, samplesWithOutrunnerBehind: 0, squads: {} };
    },
    sample: function (sim) {
      var A = root.BattleRegroupHysteresis && root.BattleRegroupHysteresis.assessment;
      ['us', 'ge'].forEach(function (f) {
        (sim.factions[f].squads || []).forEach(function (sq) {
          var inRegroup = root.BattleLeases && root.BattleLeases.get(sq, 'regroup');
          if (!inRegroup) {
            var ax = axis(sq);
            if (ax) lastAxis.set(sq, ax);
            return;
          }
          c.regroupSamples++;
          var s = (c.squads[sq.id] = c.squads[sq.id] || { samples: 0, collapsed: 0, outrunnersBehind: 0 });
          s.samples++;
          if (!axis(sq)) {
            c.collapsed++;
            s.collapsed++;
            if (!sq._formationForward) c.collapsedNoFormationFrame++;
          }
          var f0 = lastAxis.get(sq), a = sq.orderAnchor;
          if (!A || !f0 || !a) return;
          var lim = (sq._cohesionAssessment && sq._cohesionAssessment.limit) || 34,
            ca = A(sq, lim), n = 0;
          (sq.members || []).forEach(function (m) {
            if (m.dead || ca.outrunners.indexOf(String(m.id)) < 0) return;
            var p = m.root.position;
            if ((p.x - a.x) * f0.x + (p.z - a.z) * f0.z < -2) n++;
          });
          if (n) c.samplesWithOutrunnerBehind++;
          c.outrunnersBehind += n;
          s.outrunnersBehind += n;
        });
      });
    },
    report: function (sim) {
      var ended = [];
      ['us', 'ge'].forEach(function (f) {
        (sim.factions[f].squads || []).forEach(function (sq) {
          ((sq._leases && sq._leases.ended) || []).forEach(function (l) {
            if (l.kind === 'regroup') ended.push(l.endReason);
          });
        });
      });
      var byEnd = {};
      ended.forEach(function (r) { byEnd[r] = (byEnd[r] || 0) + 1; });
      c.regroupEnds = byEnd;
      return c;
    }
  };
})(window);
