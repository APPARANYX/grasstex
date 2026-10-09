/* Read-only exact-seed regression observer for issue #437.
 * Detect an interim retreat waypoint reporting "arrived" while the real retreat
 * objective is distant. Sample the ACTUAL shipping actors and paths, never write
 * orders, destinations, or other gameplay state. */
(function (root) {
  'use strict';
  var selected = null;
  var samples = [];
  var transitions = [];
  var previous = null;
  var lastSample = -1e9;
  var lastPosition = null;
  var stuckSince = null;
  var totals = { samples: 0, arrivedFar: 0, zeroProgressFar: 0, routeBlocked: 0 };
  function round(x) {
    return Number.isFinite(+x) ? +(+x).toFixed(3) : null;
  }
  function point(p) {
    return p && Number.isFinite(+p.x) && Number.isFinite(+p.z)
      ? { x: round(p.x), z: round(p.z) }
      : null;
  }
  function dist(a, b) {
    return a && b ? round(Math.hypot(a.x - b.x, a.z - b.z)) : null;
  }
  function gather(sim) {
    var sq = sim.factions && sim.factions.us && (sim.factions.us.squads || []).find(function (s) {
      return s.id === 'us-0';
    });
    var unit = (sim._roster && sim._roster.us || []).find(function (s) {
      return +s.id === 6;
    });
    if (!sq || !unit) return { time: round(sim.time), missingSquad: !sq, missingUnit: !unit };
    var here = point(unit.root && unit.root.position);
    var assembly = point(sq._orderGoal || sq.home);
    var physical = unit._physicalPath;
    var resolver = unit._movementResolver;
    var route = physical
      ? {
          blocked: !!physical.blocked,
          index: physical.index || 0,
          replanAt: round(physical.replanAt),
          finalGoal: point({ x: physical.finalGoalX, z: physical.finalGoalZ }),
          standGoal: point(physical.standGoal),
          length: (physical.points || []).length,
          points: (physical.points || []).slice(0, 4).map(point)
        }
      : null;
    var out = {
      time: round(sim.time),
      winner: sim.winner || null,
      squad: sq.id,
      living: (sq.members || []).filter(function (s) { return !s.dead; }).length,
      state: sq.state,
      phase: sq.commandPhase,
      assemblyMode: sq.assemblyMode || null,
      squadHome: point(sq.home),
      squadRally: point(sq.rally),
      orderAnchor: point(sq.orderAnchor),
      orderGoal: point(sq._orderGoal),
      retreatTarget: point(root.SquadAI && root.SquadAI.retreatGoal && root.SquadAI.retreatGoal(sq)),
      squadVersion: sq._orderVersion,
      actor: unit.id,
      dead: !!unit.dead,
      here: here,
      destination: point(unit.destination),
      waypoint: point(unit._movementWaypoint),
      orderDestination: point(unit.orderDestination),
      fireteamDestination: point(unit._fireteamDestination),
      actualAnchor: assembly,
      actualAnchorDistance: dist(here, assembly),
      squadAnchorDistance: dist(here, point(sq.orderAnchor)),
      rallyDistance: dist(here, point(sq.rally)),
      physicalDestinationDistance: dist(here, point(unit.destination)),
      waypointDistance: dist(here, point(unit._movementWaypoint)),
      stop: unit._movementStopReason || null,
      moving: !!unit.moving,
      speed: round(unit.moveSpeed),
      navigation: route,
      resolverLast: resolver && resolver.last
        ? {
            owner: resolver.last.owner,
            kind: resolver.last.kind,
            reason: resolver.last.reason,
            point: point(resolver.last.point),
            intentPoint: point(resolver.last.intentPoint)
          }
        : null,
      movementGoal: resolver && resolver.goal
        ? { kind: resolver.goal.kind, point: point(resolver.goal.point) }
        : null
    };
    out.arrivedFar = !out.dead && out.stop === 'arrived' && out.actualAnchorDistance != null
      && out.actualAnchorDistance > 25 && out.physicalDestinationDistance != null
      && out.physicalDestinationDistance < 0.5;
    return out;
  }
  root.BattleProbes = root.BattleProbes || {};
  root.BattleProbes['route-437'] = {
    every: 0.45,
    start: function () {
      selected = null;
      samples = [];
      transitions = [];
      previous = null;
      lastSample = -1e9;
      lastPosition = null;
      stuckSince = null;
      totals = { samples: 0, arrivedFar: 0, zeroProgressFar: 0, routeBlocked: 0 };
    },
    sample: function (sim) {
      var data = gather(sim);
      if (!data.here || data.time < 520) return;
      totals.samples++;
      if (data.arrivedFar) totals.arrivedFar++;
      if (data.navigation && data.navigation.blocked) totals.routeBlocked++;
      if (lastPosition && dist(lastPosition, data.here) >= 1.5) {
        lastPosition = data.here;
        stuckSince = data.time;
      } else if (!lastPosition) {
        lastPosition = data.here;
        stuckSince = data.time;
      }
      data.stillSeconds = round(data.time - stuckSince);
      if (data.actualAnchorDistance > 25 && data.stillSeconds >= 12) totals.zeroProgressFar++;
      var signature = [data.state, data.phase, data.stop, data.navigation && data.navigation.blocked,
        data.resolverLast && data.resolverLast.kind, data.arrivedFar].join('|');
      var changed = signature !== previous;
      if (changed && transitions.length < 150) transitions.push(data);
      previous = signature;
      if ((changed || data.arrivedFar || data.stillSeconds >= 12 || data.time - lastSample >= 3)
        && samples.length < 500) {
        samples.push(data);
        lastSample = data.time;
      }
      selected = data;
    },
    report: function () {
      return { schema: 'route-437-v1', totals: totals, last: selected, samples: samples, transitions: transitions };
    }
  };
})(window);
