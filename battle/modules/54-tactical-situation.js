/* Phase A1: TacticalSituation — behavior-neutral, read-only instrumentation.
   Per faction per commander tick, captures: force posture, contact picture,
   threat sectors, objective pressure, available reserves. Consumes existing
   state; writes only sim._tacticalSituation (owned by this module). */
(function (root) {
  'use strict';
  if (!root.BattleModules || !root.SquadAI || root.BattleTacticalSituation) return;

  var SECTORS = ['N','NE','E','SE','S','SW','W','NW'];

  function sectorFor(from, to) {
    if (!from || !to) return 'N';
    var dx = to.x - from.x, dz = to.z - from.z;
    if (Math.hypot(dx, dz) < 1) return 'N';
    var angle = Math.atan2(dx, -dz); // 0 = north
    if (angle < 0) angle += Math.PI * 2;
    var idx = Math.round(angle / (Math.PI / 4)) % 8;
    return SECTORS[idx];
  }

  function factionPosture(sq) {
    var m = sq._macroMission;
    if (!m) return 'unassigned';
    if (m.intent === 'defend') return 'defending';
    if (m.intent === 'reserve') return 'reserve';
    if (m.intent === 'capture') return 'attacking';
    if (m.intent === 'reconstitute') return 'recovering';
    if (sq.state === 'retreat') return 'retreating';
    return 'attacking';
  }

  function compute(sim, faction) {
    if (!sim || !sim.factions || !sim.factions[faction]) return null;
    var squads = sim.factions[faction].squads || [];
    var now = +sim.time || 0;
    var A = root.SquadAI;

    // Force posture
    var postures = { attacking: 0, defending: 0, reserve: 0, retreating: 0, recovering: 0, unassigned: 0 };
    var aliveSquads = 0;
    for (var i = 0; i < squads.length; i++) {
      var sq = squads[i];
      if (!A.aliveMembers(sq).length) continue;
      aliveSquads++;
      postures[factionPosture(sq)] = (postures[factionPosture(sq)] || 0) + 1;
    }
    var forcePosture = 'stalled';
    if (postures.attacking > 0 && postures.defending === 0) forcePosture = 'attacking';
    else if (postures.defending > 0 && postures.attacking === 0) forcePosture = 'defending';
    else if (postures.attacking > 0 && postures.defending > 0) forcePosture = 'mixed';
    else if (postures.retreating > aliveSquads / 2) forcePosture = 'retreating';
    else if (postures.reserve === aliveSquads) forcePosture = 'reserve';

    // Contact picture
    var contacts = [];
    for (i = 0; i < squads.length; i++) {
      sq = squads[i];
      var c = A.squadContact(sq, sim);
      if (c) contacts.push({ squad: sq.id, x: c.x, z: c.z, at: c.at, age: now - c.at, source: c.source || 'seen' });
      var cm = A.squadContactsMap(sq, sim);
      if (cm) for (var k in cm) contacts.push({ squad: sq.id, x: cm[k].x, z: cm[k].z, at: cm[k].at, age: now - cm[k].at, source: cm[k].source, sector: cm[k].sector });
    }

    // Threat sectors (8-directional from faction centroid)
    var centroid = { x: 0, z: 0 }, n = 0;
    for (i = 0; i < squads.length; i++) {
      var members = A.aliveMembers(squads[i]);
      for (var mi = 0; mi < members.length; mi++) {
        centroid.x += members[mi].root.position.x;
        centroid.z += members[mi].root.position.z;
        n++;
      }
    }
    if (n > 0) { centroid.x /= n; centroid.z /= n; }
    var threatSectors = {};
    SECTORS.forEach(function (s) { threatSectors[s] = { count: 0, freshest: 0 }; });
    for (i = 0; i < contacts.length; i++) {
      var sec = sectorFor(centroid, contacts[i]);
      if (!threatSectors[sec]) continue;
      threatSectors[sec].count++;
      var age = contacts[i].age;
      if (age < 30) threatSectors[sec].freshest = Math.max(threatSectors[sec].freshest, 1 - age / 30);
    }

    // Objective pressure
    var objectives = sim._objectives || [];
    var objPressure = [];
    var OS = root.BattleObjectiveSystem;
    for (i = 0; i < objectives.length; i++) {
      var obj = objectives[i];
      var st = OS && OS.status ? OS.status(obj, sim) : (sim.objectiveControl && sim.objectiveControl.sectors ? sim.objectiveControl.sectors[obj.id] : null);
      if (!st) continue;
      var active = st.active || st.phase === 'capturing' || st.phase === 'decaying';
      if (active || st.owner !== faction) {
        objPressure.push({ id: obj.id, owner: st.owner, phase: st.phase, active: !!active, contested: st.owner === 'neutral' && active });
      }
    }

    // Available reserves
    var reserves = 0;
    for (i = 0; i < squads.length; i++) {
      sq = squads[i];
      var m = sq._macroMission;
      if (m && m.intent === 'reserve' && A.aliveMembers(sq).length > 0 && sq.state !== 'retreat') reserves++;
    }

    return {
      faction: faction,
      time: now,
      forcePosture: forcePosture,
      postureBreakdown: postures,
      aliveSquads: aliveSquads,
      contacts: contacts.slice(0, 30),
      contactCount: contacts.length,
      threatSectors: threatSectors,
      objectivePressure: objPressure,
      availableReserves: reserves
    };
  }

  function sample(sim) {
    if (!sim) return null;
    var rec = sim._tacticalSituation || (sim._tacticalSituation = {});
    rec.us = compute(sim, 'us');
    rec.ge = compute(sim, 'ge');
    rec.time = +sim.time || 0;
    return rec;
  }

  /* A2: UrbanOperatingPicture — building cells, street segments, sector visibility.
     Reads from BattleNavigation (roads/buildings), BattleObstacleField, soldier positions.
     Writes only sim._urbanOperatingPicture (owned by this module). */
  function computeUrban(sim, faction) {
    if (!sim || !sim.factions || !sim.factions[faction]) return null;
    var squads = sim.factions[faction].squads || [];
    var now = +sim.time || 0;
    var A = root.SquadAI;

    // Building cells: which buildings are occupied, by whom, observation age
    var buildings = [];
    var scenario = sim.scene && sim.scene.metadata && (sim.scene.metadata.battleScenario || sim.scene.metadata.battleTown);
    if (scenario && scenario.buildings) {
      for (var bi = 0; bi < scenario.buildings.length; bi++) {
        var b = scenario.buildings[bi];
        var occupants = { us: 0, ge: 0 };
        for (var si = 0; si < squads.length; si++) {
          var members = A.aliveMembers(squads[si]);
          for (var mi = 0; mi < members.length; mi++) {
            var p = members[mi].root.position;
            if (Math.abs(p.x - b.x) < (b.width || 20) && Math.abs(p.z - b.z) < (b.depth || 20))
              occupants[faction]++;
          }
        }
        // Check enemy proximity
        var enemyF = faction === 'us' ? 'ge' : 'us';
        var enemySquads = sim.factions[enemyF] && sim.factions[enemyF].squads || [];
        for (si = 0; si < enemySquads.length; si++) {
          var eMembers = A.aliveMembers(enemySquads[si]);
          for (mi = 0; mi < eMembers.length; mi++) {
            var ep = eMembers[mi].root.position;
            if (Math.abs(ep.x - b.x) < (b.width || 20) && Math.abs(ep.z - b.z) < (b.depth || 20))
              occupants[enemyF]++;
          }
        }
        buildings.push({
          id: b.id || ('b-' + bi),
          x: b.x, z: b.z,
          occupied: occupants.us > 0 || occupants.ge > 0,
          us: occupants.us, ge: occupants.ge,
          contested: occupants.us > 0 && occupants.ge > 0,
          observationAge: occupants.us > 0 || occupants.ge > 0 ? 0 : -1
        });
      }
    }

    // Street segments: from scenario roads, classify as cleared/contested/unknown
    var streets = [];
    if (scenario && scenario.roads) {
      for (var ri = 0; ri < scenario.roads.length; ri++) {
        var road = scenario.roads[ri];
        var midX = (road.ax + road.bx) / 2, midZ = (road.az + road.bz) / 2;
        var usNear = false, geNear = false;
        for (si = 0; si < squads.length; si++) {
          members = A.aliveMembers(squads[si]);
          for (mi = 0; mi < members.length; mi++) {
            p = members[mi].root.position;
            if (Math.hypot(p.x - midX, p.z - midZ) < 60) usNear = true;
          }
        }
        enemySquads = sim.factions[enemyF] && sim.factions[enemyF].squads || [];
        for (si = 0; si < enemySquads.length; si++) {
          eMembers = A.aliveMembers(enemySquads[si]);
          for (mi = 0; mi < eMembers.length; mi++) {
            ep = eMembers[mi].root.position;
            if (Math.hypot(ep.x - midX, ep.z - midZ) < 60) geNear = true;
          }
        }
        streets.push({
          id: road.id || ('r-' + ri),
          start: { x: road.ax, z: road.az },
          end: { x: road.bx, z: road.bz },
          status: usNear && geNear ? 'contested' : usNear ? 'cleared' : geNear ? 'enemy' : 'unknown'
        });
      }
    }

    // Sector visibility: rough estimate of how much of the map this faction can observe
    var visibleSectors = 0;
    var totalSectors = 0;
    var sectorGrid = {};
    for (si = 0; si < squads.length; si++) {
      members = A.aliveMembers(squads[si]);
      for (mi = 0; mi < members.length; mi++) {
        p = members[mi].root.position;
        var gx = Math.floor(p.x / 100), gz = Math.floor(p.z / 100);
        var key = gx + ':' + gz;
        sectorGrid[key] = true;
      }
    }
    totalSectors = 20 * 12; // 2000x1200 map at 100m grid
    visibleSectors = Object.keys(sectorGrid).length;

    return {
      faction: faction,
      time: now,
      buildings: buildings,
      streets: streets,
      visibleSectorCount: visibleSectors,
      totalSectorCount: totalSectors,
      visibilityFraction: totalSectors > 0 ? visibleSectors / totalSectors : 0
    };
  }

  function sampleUrban(sim) {
    if (!sim) return null;
    var rec = sim._urbanOperatingPicture || (sim._urbanOperatingPicture = {});
    rec.us = computeUrban(sim, 'us');
    rec.ge = computeUrban(sim, 'ge');
    rec.time = +sim.time || 0;
    return rec;
  }

  function summary(sim) {
    var ts = sim && sim._tacticalSituation ? JSON.parse(JSON.stringify(sim._tacticalSituation)) : null;
    var uop = sim && sim._urbanOperatingPicture ? JSON.parse(JSON.stringify(sim._urbanOperatingPicture)) : null;
    return { tacticalSituation: ts, urbanOperatingPicture: uop };
  }

  root.BattleTacticalSituation = {
    version: '1.1-a2',
    compute: compute,
    computeUrban: computeUrban,
    sample: sample,
    sampleUrban: sampleUrban,
    summary: summary,
    sectors: SECTORS
  };

  if (root.BattleModules) {
    root.BattleModules.registerSystem('tactical-situation', {
      version: '1.1-a2',
      onBattleStart: function (sim) { sim._tacticalSituation = null; sim._urbanOperatingPicture = null; sample(sim); sampleUrban(sim); },
      onCommanderTick: function (sim) { sample(sim); sampleUrban(sim); },
      onBattleRestart: function (sim) { sim._tacticalSituation = null; sim._urbanOperatingPicture = null; sample(sim); sampleUrban(sim); }
    });
  }
  console.log('[TACTICAL] A1+A2: TacticalSituation + UrbanOperatingPicture instrumentation active (read-only)');
})(typeof window !== 'undefined' ? window : globalThis);
