/* Phase D1+D2: Street segment graph + building cell graph.
   D1: builds street segments from scenario roads with ownership/observation.
   D2: builds building cells from scenario buildings with control status.
   Both are behavior-neutral, read-only construction. Write battle._streetGraph
   and battle._buildingGraph (owned by this module). */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleStreetGraph) return;

  var A = root.SquadAI;

  function dist(a, b) {
    return a && b ? Math.hypot((+a.x || 0) - (+b.x || 0), (+a.z || 0) - (+b.z || 0)) : Infinity;
  }

  /* D1: Build street segments from scenario roads. */
  function buildStreetGraph(sim) {
    if (!sim) return null;
    var scenario = sim.scene && sim.scene.metadata && (sim.scene.metadata.battleScenario || sim.scene.metadata.battleTown);
    if (!scenario || !scenario.roads) return { segments: [], intersections: [] };
    var now = +sim.time || 0;
    var segments = [];
    var intersections = [];

    for (var i = 0; i < scenario.roads.length; i++) {
      var road = scenario.roads[i];
      var start = { x: road.ax, z: road.az };
      var end = { x: road.bx, z: road.bz };
      var mid = { x: (road.ax + road.bx) / 2, z: (road.az + road.bz) / 2 };
      var width = road.width || 8;

      /* Classify: check which factions have soldiers near the segment midpoint */
      var usNear = false, geNear = false;
      ['us', 'ge'].forEach(function (f) {
        var squads = sim.factions && sim.factions[f] && sim.factions[f].squads || [];
        for (var si = 0; si < squads.length; si++) {
          var members = A.aliveMembers(squads[si]);
          for (var mi = 0; mi < members.length; mi++) {
            var p = members[mi].root.position;
            if (dist(p, mid) < 60) { f === 'us' ? (usNear = true) : (geNear = true); }
          }
        }
      });

      var ownership = 'unknown';
      if (usNear && geNear) ownership = 'contested';
      else if (usNear) ownership = 'us';
      else if (geNear) ownership = 'ge';

      segments.push({
        id: road.id || ('street-' + i),
        start: start,
        end: end,
        width: width,
        ownership: ownership,
        cleared: ownership === 'us' || ownership === 'ge',
        observationAge: usNear || geNear ? 0 : -1,
        observedAt: usNear || geNear ? now : null
      });

      /* Record intersections (start and end points) */
      intersections.push({ x: start.x, z: start.z, segments: [segments.length - 1] });
      intersections.push({ x: end.x, z: end.z, segments: [segments.length - 1] });
    }

    /* Merge nearby intersections */
    var merged = [];
    for (var ii = 0; ii < intersections.length; ii++) {
      var found = false;
      for (var mi2 = 0; mi2 < merged.length; mi2++) {
        if (dist(intersections[ii], merged[mi2]) < 5) {
          merged[mi2].segments = merged[mi2].segments.concat(intersections[ii].segments);
          found = true;
          break;
        }
      }
      if (!found) merged.push(intersections[ii]);
    }

    return { segments: segments, intersections: merged, time: now };
  }

  /* D2: Build building cell graph from scenario buildings. */
  function buildBuildingGraph(sim) {
    if (!sim) return null;
    var scenario = sim.scene && sim.scene.metadata && (sim.scene.metadata.battleScenario || sim.scene.metadata.battleTown);
    if (!scenario || !scenario.buildings) return { buildings: [] };
    var now = +sim.time || 0;
    var buildings = [];

    for (var i = 0; i < scenario.buildings.length; i++) {
      var b = scenario.buildings[i];
      var pos = { x: b.x, z: b.z };

      /* Check occupancy */
      var usIn = 0, geIn = 0;
      ['us', 'ge'].forEach(function (f) {
        var squads = sim.factions && sim.factions[f] && sim.factions[f].squads || [];
        for (var si = 0; si < squads.length; si++) {
          var members = A.aliveMembers(squads[si]);
          for (var mi = 0; mi < members.length; mi++) {
            var p = members[mi].root.position;
            if (Math.abs(p.x - b.x) < (b.width || 20) && Math.abs(p.z - b.z) < (b.depth || 20)) {
              f === 'us' ? usIn++ : geIn++;
            }
          }
        }
      });

      var control = 'unknown';
      if (usIn > 0 && geIn > 0) control = 'contested';
      else if (usIn > 0) control = 'us';
      else if (geIn > 0) control = 'ge';

      /* Simplified cell model: ground floor + upper floor */
      var cells = [
        { id: 'g', layer: 0, control: control, occupied: usIn + geIn > 0 },
        { id: '1', layer: 1, control: 'unknown', occupied: false }
      ];

      buildings.push({
        id: b.id || ('bldg-' + i),
        x: b.x, z: b.z,
        width: b.width || 20,
        depth: b.depth || 20,
        control: control,
        cells: cells,
        controlled: control === 'us' || control === 'ge',
        observationAge: usIn + geIn > 0 ? 0 : -1,
        observedAt: usIn + geIn > 0 ? now : null
      });
    }

    return { buildings: buildings, time: now };
  }

  function rebuild(sim) {
    if (!sim) return;
    sim._streetGraph = buildStreetGraph(sim);
    sim._buildingGraph = buildBuildingGraph(sim);
  }

  root.BattleStreetGraph = {
    version: '1.0-d1d2',
    buildStreetGraph: buildStreetGraph,
    buildBuildingGraph: buildBuildingGraph,
    rebuild: rebuild
  };

  if (root.BattleModules) {
    root.BattleModules.registerSystem('street-graph', {
      version: '1.0-d1d2',
      onBattleStart: rebuild,
      onCommanderTick: rebuild,
      onBattleRestart: function (sim) { sim._streetGraph = null; sim._buildingGraph = null; rebuild(sim); }
    });
  }
  console.log('[TACTICS] D1+D2: Street + building graph loaded (read-only construction)');
})(typeof window !== 'undefined' ? window : globalThis);
