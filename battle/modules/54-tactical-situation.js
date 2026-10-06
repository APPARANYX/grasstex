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

  function summary(sim) {
    return sim && sim._tacticalSituation ? JSON.parse(JSON.stringify(sim._tacticalSituation)) : null;
  }

  root.BattleTacticalSituation = {
    version: '1.0-a1',
    compute: compute,
    sample: sample,
    summary: summary,
    sectors: SECTORS
  };

  if (root.BattleModules) {
    root.BattleModules.registerSystem('tactical-situation', {
      version: '1.0-a1',
      onBattleStart: function (sim) { sim._tacticalSituation = null; sample(sim); },
      onCommanderTick: function (sim) { sample(sim); },
      onBattleRestart: function (sim) { sim._tacticalSituation = null; sample(sim); }
    });
  }
  console.log('[TACTICAL] A1: TacticalSituation instrumentation active (read-only)');
})(typeof window !== 'undefined' ? window : globalThis);
