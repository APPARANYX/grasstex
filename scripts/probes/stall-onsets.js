/* Stall onsets by squad state: which men the timeline recorder (module 97) would count as stalled, and what their
   squad was doing when it happened. A man qualifies like the recorder's: alive, a destination, no target, his squad's
   phase an advancing one, an Engagement state that is not a combat one; he is stalled once he has moved less than
   1.5 m for 12 s with speed under 0.35 and the destination 8 m or more away. Per onset the probe records the squad's
   state (retreating or not), phase, contact, mission intent, the man's Engagement state and the Movement Resolver's
   last owner. Observe only: reads public state, draws no RNG, writes nothing. */
(function (root) {
  var COMBAT = { orient: 1, bound: 1, engage: 1, pinned: 1, assault: 1, station: 1 },
    ADVANCE = { approach: 1, assault: 1, capture: 1, 'clear-town': 1, flank: 1 },
    prior,
    onsets;
  function units(sim) {
    try {
      return root.BattleModules.unitsFor(sim) || [];
    } catch (_) {
      return [];
    }
  }
  function engState(s) {
    return (s.eng && s.eng.state) || 'unknown';
  }
  (root.BattleProbes = root.BattleProbes || {})['stall-onsets'] = {
    every: 1,
    start: function () {
      prior = new Map();
      onsets = [];
    },
    sample: function (sim) {
      var now = +sim.time || 0;
      units(sim).forEach(function (s) {
        if (!s || s.dead) return;
        var id = String(s.faction) + ':' + String(s.id),
          sq = s.squad,
          phase = (sq && sq.commandPhase) || '',
          es = engState(s),
          p0 = prior.get(id);
        if (!(s.root && s.destination && !s.target && ADVANCE[phase] && !COMBAT[es])) {
          prior.delete(id);
          return;
        }
        var p = s.root.position,
          d = Math.hypot(p.x - s.destination.x, p.z - s.destination.z);
        if (d < 8) {
          prior.delete(id);
          return;
        }
        if (!p0) {
          prior.set(id, { x: p.x, z: p.z, at: now, stalled: false });
          return;
        }
        if (Math.hypot(p.x - p0.x, p.z - p0.z) >= 1.5) {
          p0.x = p.x;
          p0.z = p.z;
          p0.at = now;
          p0.stalled = false;
          return;
        }
        var was = p0.stalled;
        p0.stalled = now - p0.at >= 12 && (+s.moveSpeed || 0) < 0.35;
        if (p0.stalled && !was) {
          var m = sq && sq._macroMission,
            O = root.BattleObjectiveSystem,
            st = m && m.objectiveId && O && O.status ? O.status(sim, m.objectiveId) : null;
          onsets.push({
            t: +now.toFixed(0),
            faction: s.faction,
            squad: sq && sq.id,
            sqState: (sq && sq.state) || null,
            phase: phase,
            contact: !!(sq && sq.inContact),
            intent: (m && m.intent) || null,
            eng: es,
            distToDest: +d.toFixed(0),
            objective: (m && m.objectiveId) || null,
            objOwner: st ? st.owner || 'neutral' : null,
            objPhase: st ? st.phase || null : null,
            distToMissionPoint:
              m && m.point ? +Math.hypot(p.x - m.point.x, p.z - m.point.z).toFixed(0) : null,
            alive: sq
              ? sq.members.filter(function (x) {
                  return !x.dead;
                }).length
              : null
          });
        }
      });
    },
    report: function () {
      return { onsets: onsets };
    }
  };
})(window);
