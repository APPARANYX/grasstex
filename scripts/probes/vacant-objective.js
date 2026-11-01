/* Vacant-objective stalls, classified. Same trigger as the benchmark's `vacantObjectiveStalls` (a squad whose target
   objective is enemy-owned and vacant, further than 1.08 x its radius, out of contact, that has not closed 2 m on it
   for 15 s), with what the squad was doing when it fired: phase and state, plan and leases, mission, recon, how many
   men move, how long since its last contact ended, and the distance to the objective. Observe only: reads public
   state, draws no RNG, writes nothing. */
(function (root) {
  var track, contactEnd, wasContact, events;
  function status(sim, obj) {
    try {
      return root.BattleObjectiveSystem.status(sim, obj.id) || obj.state || {};
    } catch (_) {
      return obj.state || {};
    }
  }
  function centre(sq) {
    var m = (sq.members || []).filter(function (s) {
      return !s.dead && s.root;
    });
    if (!m.length) return null;
    var c = m.reduce(
      function (a, s) {
        return { x: a.x + s.root.position.x, z: a.z + s.root.position.z };
      },
      { x: 0, z: 0 }
    );
    return { x: c.x / m.length, z: c.z / m.length, n: m.length };
  }
  (root.BattleProbes = root.BattleProbes || {})['vacant-objective'] = {
    every: 1,
    start: function () {
      track = {};
      contactEnd = {};
      wasContact = {};
      events = [];
    },
    sample: function (sim) {
      var now = +sim.time || 0;
      ['us', 'ge'].forEach(function (f) {
        ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
          var key = f + ':' + sq.id,
            c = centre(sq);
          if (wasContact[key] && !sq.inContact) contactEnd[key] = now;
          wasContact[key] = !!sq.inContact;
          var obj = sq.targetObjective && root.BattleObjectiveSystem.get(sim, sq.targetObjective);
          if (!c || !obj) {
            delete track[key];
            return;
          }
          var st = status(sim, obj),
            d0 = obj.def || obj,
            radius = +(d0.radius || st.radius || 20),
            enemyOwned = st.owner && st.owner !== 'neutral' && st.owner !== f,
            presence = +(st[st.owner] || (st.weights && st.weights[st.owner]) || 0),
            vacant = st.vacantOwner === true || (enemyOwned && presence <= 0),
            d = Math.hypot(c.x - (+d0.x || 0), c.z - (+d0.z || 0));
          if (!(enemyOwned && vacant && d > radius * 1.08 && !sq.inContact)) {
            delete track[key];
            return;
          }
          var t = track[key];
          if (!t || t.objective !== sq.targetObjective) {
            track[key] = { objective: sq.targetObjective, best: d, last: now, reported: false };
            return;
          }
          if (d < t.best - 2) {
            t.best = d;
            t.last = now;
          }
          if (!t.reported && now - t.last >= 15) {
            t.reported = true;
            var moving = 0,
              holders = {};
            sq.members.forEach(function (s) {
              if (s.dead) return;
              if ((+s.moveSpeed || 0) > 0.35) moving++;
              var l = (s._movementResolver && s._movementResolver.last) || {},
                k = (s.eng && s.eng.state) + '/' + (l.kind || '-') + '/' + (l.owner || '-');
              holders[k] = (holders[k] || 0) + 1;
            });
            var m = sq._macroMission;
            events.push({
              t: +now.toFixed(0),
              faction: f,
              squad: sq.id,
              objective: sq.targetObjective,
              distance: +d.toFixed(0),
              phase: sq.commandPhase,
              state: sq.state,
              n: c.n,
              plan: sq._engagementPlan ? sq._engagementPlan.status : null,
              leases: Object.keys((sq._leases && sq._leases.live) || sq._leases || {}),
              mission: m ? [m.version, m.status, m.intent, m.action].join('/') : null,
              recon: sq._reconTask ? 'active' : sq._reconLast ? sq._reconLast.reason : null,
              moving: moving,
              sinceContactEnd: contactEnd[key] == null ? null : +(now - contactEnd[key]).toFixed(0),
              men: holders
            });
          }
        });
      });
    },
    report: function () {
      return { events: events };
    }
  };
})(window);
