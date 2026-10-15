/* Commander force allocation and approach routes.

   Split out of commander-ai.js: who is left/right/centre/support/reserve, and the waypoint chain
   each of those roles walks to reach the settlement. Doctrine decides the mix; this file only turns
   that mix into geometry, so a new scenario generator can supply its own routes without the phase
   machine changing. */
(function (root) {
  'use strict';
  var D = function () {
    return root.BattleCommanderDoctrine;
  };

  function rolePlan(sim, faction, index, count) {
    var doc = D().doctrineFor(sim, faction),
      reserveCount = Math.round(count * doc.reserveFraction);
    if (reserveCount > 0 && index >= count - reserveCount) return 'reserve';
    var cycle =
      doc.flankPreference > 0.66
        ? ['left', 'right', 'center', 'left', 'right']
        : doc.flankPreference < 0.25
          ? ['center', 'support', 'center', 'left', 'right']
          : ['left', 'center', 'support', 'center', 'right'];
    return cycle[index % cycle.length];
  }
  /* Road-graph routing for widely separated 5 km bases. This is an ordinary
     approach plan, not an interception prediction or privileged enemy position. */
  function strategicRouteFor(sq, role, town) {
    var home = sq.home,
      nodes = Object.create(null),
      edges = Object.create(null);
    town.objectives.forEach(function (o) {
      nodes[o.id] = o;
      edges[o.id] = [];
    });
    (town.roads || []).forEach(function (r) {
      var a = nodes[r.fromObjectiveId],
        b = nodes[r.toObjectiveId];
      if (!a || !b) return;
      var cost = Math.hypot(a.x - b.x, a.z - b.z);
      edges[a.id].push({ id: b.id, cost: cost });
      edges[b.id].push({ id: a.id, cost: cost });
    });
    var start = nodes[sq.homeBaseObjectiveId];
    if (!start) return [{ x: home.x, z: home.z }];
    if (role === 'reserve') return [{ x: home.x, z: home.z }];
    var wanted = town.objectives.filter(function (o) {
      return !o.baseFaction && (sq.faction === 'us' ? o.z <= 0 : o.z >= 0);
    });
    if (!wanted.length) return [{ x: home.x, z: home.z }];
    wanted.sort(function (a, b) {
      function score(o) {
        var flank = role === 'left' ? Math.max(0, o.x) : role === 'right' ? Math.max(0, -o.x) : 0;
        var center = role === 'center' ? Math.abs(o.x) * 0.3 : 0;
        return Math.hypot(o.x - home.x, o.z - home.z) + flank * 0.6 + center;
      }
      return score(a) - score(b) || a.id.localeCompare(b.id);
    });
    var goal = wanted[0].id,
      distances = Object.create(null),
      parent = Object.create(null),
      seen = Object.create(null);
    distances[start.id] = 0;
    for (;;) {
      var current = null;
      Object.keys(distances).forEach(function (id) {
        if (!seen[id] && (current === null || distances[id] < distances[current])) current = id;
      });
      if (current === null || current === goal) break;
      seen[current] = true;
      edges[current].forEach(function (edge) {
        var cost = distances[current] + edge.cost;
        if (distances[edge.id] == null || cost < distances[edge.id]) {
          distances[edge.id] = cost;
          parent[edge.id] = current;
        }
      });
    }
    if (distances[goal] == null) return [{ x: home.x, z: home.z }];
    var ids = [goal];
    while (ids[0] !== start.id) {
      var previous = parent[ids[0]];
      if (!previous) return [{ x: home.x, z: home.z }];
      ids.unshift(previous);
    }
    return ids.map(function (id) {
      return { x: nodes[id].x, z: nodes[id].z };
    });
  }

  function routeFor(sq, role, town, index) {
    if (town && town.profile === 'strategic') return strategicRouteFor(sq, role, town);
    var source =
      town &&
      town.routes &&
      town.routes[sq.faction] &&
      (town.routes[sq.faction][role] || town.routes[sq.faction].center);
    if (source && source.length)
      return source.map(function (p) {
        return { x: p.x, z: p.z };
      });
    var c = (town && town.center) || { x: 0, z: 0 },
      r = (town && town.radius) || 250,
      home = sq.home,
      dir = sq.faction === 'us' ? 1 : -1,
      side = role === 'left' ? -1 : role === 'right' ? 1 : 0;
    if (role === 'reserve')
      return [
        { x: home.x, z: home.z },
        { x: c.x + side * r * 0.52, z: c.z - dir * r * 0.82 }
      ];
    var flankScale = role === 'support' ? 0.18 : 0.56;
    return [
      { x: home.x, z: home.z },
      { x: c.x + side * r * flankScale, z: c.z - dir * r * 0.76 },
      { x: c.x + side * r * (role === 'support' ? 0.12 : 0.42), z: c.z - dir * r * 0.34 },
      { x: c.x, z: c.z }
    ];
  }
  function assignSquad(sim, sq, town, index) {
    var count = sim.factions[sq.faction].squads.length || 5,
      role = rolePlan(sim, sq.faction, index, count),
      route = routeFor(sq, role, town, index);
    sq._battleSim = sim;
    sq.commandRole = role;
    sq.route = route;
    sq.routeIndex = 0;
    var phase = role === 'reserve' ? 'reserve' : 'approach';
    /* The Squad Leader owns commandPhase; route assignment only states where the squad starts. */
    if (root.BattleSquadStability) root.BattleSquadStability.initialPhase(sq, phase);
    else sq.commandPhase = phase;
    if (root.BattleLeases)
      root.BattleLeases.end(sq, 'corner-hold', +(sim && sim.time) || 0, 'route assigned');
    sq.lastCommandTime = 0;
    sq.objective = route[0];
    sq.targetObjective = null;
    /* Cleared at setup before any doctrine rule is decided; selectMission in commander-ai.js is
       the runtime writer that populates it once Force Command picks a rule for the brief. */
    sq._lastDoctrineRule = null;
    if (root.BattleTelemetry)
      root.BattleTelemetry.record(
        'decision-assign',
        {
          faction: sq.faction,
          squad: sq.id,
          role: role,
          routePoints: route.length,
          policyRevision: root.BattleAIPolicy ? root.BattleAIPolicy.revision : 0,
          genomeVersion: 2
        },
        sim
      );
  }
  function ensureAssignments(sim, town) {
    ['us', 'ge'].forEach(function (f) {
      var squads = sim.factions[f].squads;
      for (var i = 0; i < squads.length; i++) if (!squads[i].route) assignSquad(sim, squads[i], town, i);
    });
  }
  function initForce(sim, faction, town) {
    var squads = sim.factions[faction].squads;
    for (var i = 0; i < squads.length; i++) assignSquad(sim, squads[i], town, i);
  }

  root.BattleCommanderRoutes = {
    rolePlan: rolePlan,
    routeFor: routeFor,
    assignSquad: assignSquad,
    ensureAssignments: ensureAssignments,
    initForce: initForce
  };
  root.GTLog('[COMMAND] force allocation + approach routes loaded');
})(typeof window !== 'undefined' ? window : globalThis);
