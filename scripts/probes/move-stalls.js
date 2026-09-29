/* The standard benchmark's "soldier movement" stall, with the reason he stopped. Same criterion as
   run_battle_benchmark.mjs: a man with no target, not in a combat Engagement state, in a phase that
   may advance, >= 8 m from his destination, who has not moved 1.5 m in 12 s and is below 0.35 m/s.
   Per stall: stepMovement's `_movementStopReason` at the moment it is reported (step-blocked,
   path-blocked, prone-hold, speed-settling, arrived...), and the destination kind that owned it.
   Observe only. */
(function (root) {
  var COMBAT = {
      orient: 1,
      bound: 1,
      engage: 1,
      pinned: 1,
      assault: 1,
      station: 1,
      withdraw: 1,
      suppress: 1
    },
    ADVANCE = { approach: 1, assault: 1, capture: 1, 'clear-town': 1, flank: 1 },
    c,
    track;
  function bump(o, k) {
    o[k] = (o[k] || 0) + 1;
  }
  (root.BattleProbes = root.BattleProbes || {})['move-stalls'] = {
    every: 0.5,
    start: function () {
      c = { stalls: 0, byStopReason: {}, byKind: {}, examples: [] };
      track = new Map();
    },
    sample: function (sim) {
      var men = root.BattleModules.unitsFor(sim),
        now = sim.time;
      for (var i = 0; i < men.length; i++) {
        var s = men[i];
        if (
          !s ||
          s.dead ||
          !s.root ||
          !s.destination ||
          s.target ||
          !ADVANCE[(s.squad && s.squad.commandPhase) || '']
        )
          continue;
        if (COMBAT[(s.eng && s.eng.state) || '']) continue;
        var p = s.root.position,
          d = Math.hypot(p.x - s.destination.x, p.z - s.destination.z),
          prior = track.get(s);
        if (d < 8) {
          track.delete(s);
          continue;
        }
        if (!prior) {
          track.set(s, { x: p.x, z: p.z, at: now, reported: false });
          continue;
        }
        if (Math.hypot(p.x - prior.x, p.z - prior.z) >= 1.5) {
          prior.x = p.x;
          prior.z = p.z;
          prior.at = now;
          prior.reported = false;
        } else if (!prior.reported && now - prior.at >= 12 && (+s.moveSpeed || 0) < 0.35) {
          prior.reported = true;
          c.stalls++;
          var why = s._movementStopReason || 'none',
            last = (s._movementResolver && s._movementResolver.last) || {};
          bump(c.byStopReason, why);
          bump(c.byKind, (last.owner || '?') + '/' + (last.kind || '?'));
          if (c.examples.length < 8)
            c.examples.push({
              t: +now.toFixed(1),
              soldier: s.id,
              squad: s.squad && s.squad.id,
              stop: why,
              dest: +d.toFixed(1),
              kind: last.kind || null
            });
        }
      }
    },
    report: function () {
      return c;
    }
  };
})(window);
