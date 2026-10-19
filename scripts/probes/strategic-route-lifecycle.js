/* Read-only replay of strategic road/transport handoffs and capture ping-pong.
   Run one seed through run_probe.cjs; no orders, transforms or RNG are written. */
(function (root) {
  'use strict';
  var rows, captures, owners, last, next;
  function point(p) {
    return p ? [+p.x.toFixed(1), +p.z.toFixed(1)] : null;
  }
  function living(sq) {
    return (sq.members || []).filter(function (s) {
      return !s.dead && s.root;
    });
  }
  function center(sq) {
    var men = living(sq);
    return men.length
      ? {
          x:
            men.reduce(function (n, s) {
              return n + s.root.position.x;
            }, 0) / men.length,
          z:
            men.reduce(function (n, s) {
              return n + s.root.position.z;
            }, 0) / men.length
        }
      : null;
  }
  function row(sim, sq) {
    var p = center(sq),
      m = sq._macroMission || {},
      tr = sq._transport;
    if (!p) return null;
    var fleet = (root.BattleSquadTransport && root.BattleSquadTransport.fleetSummary(sim)) || [];
    return {
      t: +sim.time.toFixed(2),
      squad: sq.id,
      state: sq.state,
      phase: sq.commandPhase,
      contact: !!sq.inContact,
      alive: living(sq).length,
      position: point(p),
      mission: {
        version: m.version,
        intent: m.intent,
        reason: m.reason,
        objective: m.objectiveId,
        point: point(m.point)
      },
      route: (sq.route || []).map(point),
      routeIndex: sq.routeIndex,
      transport: tr
        ? {
            phase: tr.phase,
            reason: tr.endReason,
            missionVersion: tr.missionVersion,
            vehicle: tr.vehicleId,
            leg: tr.leg,
            position: point(tr.position),
            travelled: tr.travelled
          }
        : null,
      nearbyTrucks: fleet
        .filter(function (v) {
          return v.faction === sq.faction && Math.hypot(p.x - v.position.x, p.z - v.position.z) < 210;
        })
        .map(function (v) {
          return { id: v.id, phase: v.phase, squad: v.squadId, position: point(v.position) };
        })
    };
  }
  function presence(sim, obj) {
    var out = [];
    ['us', 'ge'].forEach(function (f) {
      ((sim._roster || {})[f] || []).forEach(function (s) {
        if (
          s.dead ||
          !s.root ||
          Math.hypot(s.root.position.x - obj.def.x, s.root.position.z - obj.def.z) >
            (+obj.def.radius || 20) * 1.5
        )
          return;
        out.push({
          id: s.id,
          faction: f,
          squad: s.squad && s.squad.id,
          state: s.eng && s.eng.state,
          squadState: s.squad && s.squad.state,
          intent: s.squad && s.squad._macroMission && s.squad._macroMission.intent,
          targetObjective: s.squad && s.squad.targetObjective,
          position: point(s.root.position),
          destination: point(s.destination)
        });
      });
    });
    return out;
  }
  (root.BattleProbes = root.BattleProbes || {})['strategic-route-lifecycle'] = {
    every: 0.5,
    start: function () {
      rows = [];
      captures = [];
      owners = {};
      last = {};
      next = {};
    },
    sample: function (sim) {
      (sim._objectives || []).forEach(function (obj) {
        var owner = obj.state.owner,
          old = owners[obj.id];
        if (old !== undefined && old !== owner)
          captures.push({
            t: +sim.time.toFixed(2),
            objective: obj.id,
            from: old,
            owner: owner,
            weights: Object.assign({}, obj.state.weights),
            presence: presence(sim, obj)
          });
        owners[obj.id] = owner;
      });
      ['us', 'ge'].forEach(function (f) {
        ((sim.factions[f] || {}).squads || []).forEach(function (sq) {
          if (!/^ge-inf-|^us-4$/.test(sq.id) || !living(sq).length) return;
          var m = sq._macroMission || {},
            tr = sq._transport || {},
            signature = [m.version, sq.routeIndex, sq.state, tr.phase, tr.endReason].join('|');
          if (signature !== last[sq.id] || sim.time >= (next[sq.id] || 0)) {
            rows.push(row(sim, sq));
            last[sq.id] = signature;
            next[sq.id] = sim.time + 5;
          }
        });
      });
    },
    report: function () {
      return { rows: rows, captures: captures };
    }
  };
})(window);
