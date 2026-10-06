/* Phase E1: Sectorized security. After capturing an objective, the Squad
   Leader assigns 8-directional sectors to fireteams. Sectors with known
   enemy activity get priority. Gaps are identified. Behavioral, behind
   ?sectorSecurity=1 (default OFF). Extends 15h fireteam publishing. */
(function (root) {
  'use strict';
  if (!root.BattleModules || !root.SquadAI || root.BattleSectorSecurity) return;

  var A = root.SquadAI;
  var SECTORS = ['N','NE','E','SE','S','SW','W','NW'];

  function flagOn() {
    return /[?&]sectorSecurity=1\b/.test(typeof location !== 'undefined' ? location.search : '');
  }

  function dist(a, b) {
    return a && b ? Math.hypot((+a.x || 0) - (+b.x || 0), (+a.z || 0) - (+b.z || 0)) : Infinity;
  }

  function sectorFor(from, to) {
    if (!from || !to) return 'N';
    var dx = to.x - from.x, dz = to.z - from.z;
    if (Math.hypot(dx, dz) < 1) return 'N';
    var angle = Math.atan2(dx, -dz);
    if (angle < 0) angle += Math.PI * 2;
    return SECTORS[Math.round(angle / (Math.PI / 4)) % 8];
  }

  /* Assign security sectors to fireteams after objective capture */
  function assignSectors(sim, sq) {
    if (!flagOn()) return null;
    var m = sq._macroMission;
    if (!m || !m.objectiveId) return null;
    var OS = root.BattleObjectiveSystem;
    var obj = OS && OS.get(sim, m.objectiveId);
    if (!obj) return null;
    var st = OS.status(obj, sim);
    if (!st || st.owner !== sq.faction) return null;

    /* Squad is at a captured objective: assign sectors */
    var pos = A.avgPos ? A.avgPos(sq) : null;
    if (!pos) return null;

    /* Get threat sectors from TacticalSituation */
    var TS = root.BattleTacticalSituation;
    var ts = TS && TS.summary(sim) && TS.summary(sim).tacticalSituation;
    var fac = ts && ts[sq.faction];
    var threatSectors = fac && fac.threatSectors || {};

    /* Assign each fireteam to a sector, prioritizing threatened sectors */
    var teams = ['alpha', 'bravo', 'charlie'];
    var assignments = {};
    var threatened = SECTORS.filter(function (s) { return threatSectors[s] && threatSectors[s].count > 0; });
    var unthreatened = SECTORS.filter(function (s) { return !threatSectors[s] || threatSectors[s].count === 0; });
    var pool = threatened.concat(unthreatened);
    for (var i = 0; i < teams.length && i < pool.length; i++) {
      assignments[teams[i]] = pool[i];
    }

    /* Identify gaps (sectors with no team assigned) */
    var assigned = {};
    for (var t in assignments) assigned[assignments[t]] = true;
    var gaps = SECTORS.filter(function (s) { return !assigned[s]; });

    sq._securitySectors = {
      assignments: assignments,
      gaps: gaps,
      threatened: threatened,
      assignedAt: +sim.time || 0
    };
    return sq._securitySectors;
  }

  root.BattleSectorSecurity = {
    version: '1.0-e1',
    assignSectors: assignSectors,
    flagOn: flagOn
  };

  if (root.BattleModules) {
    root.BattleModules.registerSystem('sector-security', {
      version: '1.0-e1',
      onCommanderTick: function (sim) {
        if (!flagOn()) return;
        ['us', 'ge'].forEach(function (f) {
          var squads = sim.factions && sim.factions[f] && sim.factions[f].squads || [];
          for (var i = 0; i < squads.length; i++) assignSectors(sim, squads[i]);
        });
      }
    });
  }
  console.log('[TACTICS] E1: Sectorized security loaded (?sectorSecurity=1 to enable)');
})(typeof window !== 'undefined' ? window : globalThis);
