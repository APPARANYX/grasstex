/* Observe the whole command chain without advancing command receipt or adding gameplay state.
   Run one seed through scripts/run_probe.cjs with PROBE=command-lifecycle and PROBE_SECONDS=421.
   Coordinates are diagnostic truth only; this probe never feeds them back into AI decisions. */
(function (root) {
  'use strict';
  /* The seven-variant synthetic fixture intentionally keeps its established checkpoints.
     Real-battle probes may request denser post-recon windows by query string. */
  var checkpointParam =
      root.location && root.location.search
        ? new URLSearchParams(root.location.search).get('probeLifecycleCheckpoints')
        : null,
    requested = checkpointParam
      ? checkpointParam
          .split(',')
          .map(Number)
          .filter(function (n) {
            return isFinite(n) && n > 0 && n <= 1800;
          })
      : [],
    checkpoints = requested.length
      ? [0].concat(
          requested
            .filter(function (n, i) {
              return requested.indexOf(n) === i;
            })
            .sort(function (a, b) {
              return a - b;
            })
        )
      : [0, 120, 180, 240, 300, 420],
    next,
    frames,
    positions,
    travel,
    last,
    transitions;
  function point(p) {
    return p && { x: +p.x, z: +p.z };
  }
  function distance(a, b) {
    return a && b ? Math.hypot(a.x - b.x, a.z - b.z) : 0;
  }
  function copy(v) {
    return v == null ? null : JSON.parse(JSON.stringify(v));
  }
  function squads(sim) {
    return ['us', 'ge'].reduce(function (a, side) {
      return a.concat((sim.factions && sim.factions[side] && sim.factions[side].squads) || []);
    }, []);
  }
  function men(sim) {
    return ['us', 'ge'].reduce(function (a, side) {
      return a.concat((sim._roster && sim._roster[side]) || []);
    }, []);
  }
  function snapshot(sim, requested) {
    var receipt = sim._commandReception || {},
      out = { checkpoint: requested, time: sim.time, squads: [] };
    squads(sim).forEach(function (sq) {
      var members = (sq.members || []).filter(function (s) {
          return !s.dead;
        }),
        centroid = members.length
          ? members.reduce(
              function (p, s) {
                p.x += s.root.position.x / members.length;
                p.z += s.root.position.z / members.length;
                return p;
              },
              { x: 0, z: 0 }
            )
          : null,
        key = sq.faction + ':' + sq.id,
        initial = positions[key],
        m = sq._macroMission;
      if (!initial && centroid) initial = positions[key] = point(centroid);
      var row = {
        id: sq.id,
        faction: sq.faction,
        living: members.length,
        state: sq.state,
        phase: sq.commandPhase,
        role: sq.commandRole,
        centroid: centroid,
        displacement: distance(initial, centroid),
        mission: copy(m),
        objective: point(sq.objective),
        route: (sq.route || []).map(point),
        routeIndex: sq.routeIndex || 0,
        orderGoal: point(sq._orderGoal),
        anchor: point(sq.orderAnchor),
        contact: sq.contact
          ? { at: sq.contact.at, x: sq.contact.x, z: sq.contact.z, confidence: sq.contact.confidence }
          : null,
        combat: copy(sq._engagementReport),
        recon: copy(sq._reconTask),
        leases: copy(sq._leases),
        preparedDefenseRequest: copy(sq._preparedDefenseRequest),
        captureZoneDefenseRequest: copy(sq._captureZoneDefenseRequest),
        missionHold: sq._missionHold || null,
        execution: sq._missionExecution
          ? {
              acceptedAt: sq._missionExecution.acceptedAt,
              version: sq._missionExecution.mission && sq._missionExecution.mission.version,
              holdPoint: point(sq._missionExecution.holdPoint)
            }
          : null,
        men: []
      };
      members.forEach(function (s) {
        var id = String(s.id),
          st = s._movementResolver || {},
          slot = 'movement|soldier:' + id,
          pending = receipt.bySoldier && receipt.bySoldier[id] && receipt.bySoldier[id][slot],
          adopted =
            receipt.adoptedBySoldier && receipt.adoptedBySoldier[id] && receipt.adoptedBySoldier[id][slot],
          first = positions['man:' + id];
        row.men.push({
          id: s.id,
          role: s.role,
          position: point(s.root.position),
          displacement: distance(first, s.root.position),
          travel: travel[id] || 0,
          destination: point(s.destination),
          order: point(s.orderDestination),
          adoptedPoint: point(s._fireteamDestination),
          appliedEnvelope: s._fireteamAdoptedEnvelope || null,
          receipt: pending
            ? {
                envelopeId: pending.envelopeId,
                phase: pending.phase,
                action: pending.action,
                issuedAt: pending.issuedAt,
                receivedAt: pending.receivedAt,
                adoptedAt: pending.adoptedAt,
                point: point(pending.point)
              }
            : null,
          adopted: adopted
            ? { envelopeId: adopted.envelopeId, action: adopted.action, point: point(adopted.point) }
            : null,
          resolver: st.last
            ? {
                owner: st.last.owner,
                kind: st.last.kind,
                point: point(st.last.point),
                reason: st.last.reason
              }
            : null,
          proposal: st.order
            ? { owner: st.order.owner, kind: st.order.kind, point: point(st.order.point) }
            : null,
          engagement: s.eng && s.eng.state,
          stopReason: s._movementStopReason || null,
          tacticalReason: s._movementTacticalReason || null,
          speed: s.speed || 0
        });
      });
      out.squads.push(row);
    });
    out.health = copy(sim._coordinationHealth);
    out.generals = ['us', 'ge'].reduce(function (a, side) {
      var g = sim._generals && sim._generals[side];
      var rec = g && g.stallRecovery;
      a[side] = g
        ? {
            recovery: rec
              ? {
                  episode: rec.episode,
                  completed: rec.completed,
                  mainEffort: rec.mainEffort,
                  history: copy(rec.history),
                  progress: copy(rec.progress),
                  passes: rec.passes,
                  lastReviewAt: rec.lastReviewAt,
                  wakes: Object.keys(rec.wakes || {}).map(function (id) {
                    var wake = rec.wakes[id];
                    return {
                      id: id,
                      reason: wake.reason,
                      version: wake.version,
                      issued: wake.issued,
                      at: wake.at,
                      currentVersion:
                        wake.squad && wake.squad._macroMission && wake.squad._macroMission.version
                    };
                  })
                }
              : null,
            macroCommand: {
              wakeCount: g.wakeCount,
              wakeReasons: copy(g.wakeReasons),
              strategicWrites: g.strategicWrites,
              decisionsUnchanged: g.decisionsUnchanged,
              recentWakes: copy(g.recentWakes)
            }
          }
        : null;
      return a;
    }, {});
    return out;
  }
  (root.BattleProbes = root.BattleProbes || {})['command-lifecycle'] = {
    every: 0,
    start: function (sim) {
      next = 1;
      frames = [];
      positions = {};
      travel = {};
      last = {};
      transitions = [];
      men(sim).forEach(function (s) {
        positions['man:' + s.id] = point(s.root.position);
        last[s.id] = point(s.root.position);
      });
      frames.push(snapshot(sim, 0));
    },
    sample: function (sim) {
      men(sim).forEach(function (s) {
        var id = String(s.id),
          p = point(s.root.position);
        travel[id] = (travel[id] || 0) + distance(last[id], p);
        last[id] = p;
      });
      squads(sim).forEach(function (sq) {
        var key = sq.faction + ':' + sq.id,
          m = sq._macroMission,
          task = sq._reconTask,
          signature = [
            m && m.version,
            m && m.status,
            sq.commandPhase,
            task ? task.signature + '@' + task.startedAt : ''
          ].join('|');
        if (last[key] !== signature) {
          var live = (sq.members || []).filter(function (s) {
              return !s.dead;
            }),
            body = task
              ? live.filter(function (s) {
                  return task.scoutIds.indexOf(s.id) < 0;
                })
              : live;
          function average(men) {
            return men.length
              ? men.reduce(
                  function (p, s) {
                    p.x += s.root.position.x / men.length;
                    p.z += s.root.position.z / men.length;
                    return p;
                  },
                  { x: 0, z: 0 }
                )
              : null;
          }
          transitions.push({
            time: sim.time,
            faction: sq.faction,
            id: sq.id,
            version: m && m.version,
            intent: m && m.intent,
            status: m && m.status,
            phase: sq.commandPhase,
            recon: task && task.signature,
            reconStartedAt: task && task.startedAt,
            reconGoal: task && point(task.goal),
            reconPoint: task && point(task.point),
            centroid: average(live),
            mainBodyCentroid: average(body)
          });
          last[key] = signature;
        }
      });
      while (next < checkpoints.length && sim.time + 1e-9 >= checkpoints[next]) {
        frames.push(snapshot(sim, checkpoints[next++]));
      }
    },
    report: function (sim) {
      return {
        checkpoints: frames,
        transitions: transitions,
        final: snapshot(sim, sim.time),
        recon: root.BattleSquadStability.reconTelemetry(sim),
        resolver: root.BattleMovementResolver.summary(sim)
      };
    }
  };
})(window);
