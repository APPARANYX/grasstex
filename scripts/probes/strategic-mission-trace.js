/* Read-only strategic forensic evidence from a selected 5 km benchmark seed.
   Does not modify orders, simulator state, or randomness. */
(function (root) {
  'use strict';

  var snapshots;
  var transitions;
  var violations;
  var retreatHistory;
  var last;
  var flagged;

  function position(p) {
    if (!p || !Number.isFinite(+p.x) || !Number.isFinite(+p.z)) return null;
    return [+(+p.x).toFixed(1), +(+p.z).toFixed(1)];
  }

  function distance(a, b) {
    if (!a || !b) return null;
    return +Math.hypot(a.x - b.x, a.z - b.z).toFixed(1);
  }

  function center(sq) {
    var live = (sq.members || []).filter(function (s) {
      return !s.dead && s.root;
    });
    if (!live.length) return null;
    var x = 0;
    var z = 0;
    live.forEach(function (s) {
      x += s.root.position.x;
      z += s.root.position.z;
    });
    return { x: x / live.length, z: z / live.length };
  }

  function observe(sim, sq) {
    var place = center(sq);
    var base = sq.baseHome || sq.home;
    var mission = sq._macroMission || {};
    var goal = root.SquadAI.retreatGoal(sq);
    var side = sim._sides || {};
    var alive = (sq.members || []).filter(function (s) {
      return !s.dead;
    }).length;
    var blocked = (sq.members || []).filter(function (s) {
      return !s.dead && /blocked/.test(String(s._movementStopReason || ''));
    }).length;
    var next = sq.route && sq.route[sq.routeIndex || 0];

    return {
      t: +sim.time.toFixed(2),
      faction: sq.faction,
      squad: String(sq.id),
      alive: alive,
      position: position(place),
      state: sq.state || null,
      phase: sq.commandPhase || null,
      intent: mission.intent || null,
      missionVersion: mission.version == null ? null : mission.version,
      missionStatus: mission.status || null,
      objectiveId: mission.objectiveId || sq.targetObjective || null,
      preparedGarrison: !!sq._preparedDefenseRequest,
      temporarySecurity: !!sq._captureZoneDefenseRequest,
      homeBaseId: sq.homeBaseId || null,
      centerToBaseM: distance(place, base),
      centerToTacticalHomeM: distance(place, sq.home),
      retreatGoalToBaseM: distance(goal, base),
      retreatGoal: position(goal),
      routeLeg: position(next),
      routeIndex: sq.routeIndex || 0,
      routeLength: sq.route ? sq.route.length : 0,
      anchor: position(sq.orderAnchor),
      orderGoal: position(sq._orderGoal),
      assembly: (sq._assembly && sq._assembly.phase) || null,
      moraleRally: !!sq._moraleRallyPoint,
      isPreparedAttacker: !!(side.attacker && side.attacker === sq.faction),
      movementStops: blocked
    };
  }

  function collect(sim, sq) {
    var row = observe(sim, sq);
    var prior = last[row.squad];
    var extracting = row.alive > 0 && row.alive <= 4;
    var wrongRetreat = row.state === 'retreat' && !!row.homeBaseId;
    wrongRetreat = wrongRetreat && !extracting && !row.moraleRally;
    wrongRetreat = wrongRetreat && row.assembly === 'to-base';
    wrongRetreat = wrongRetreat && row.retreatGoalToBaseM != null;
    wrongRetreat = wrongRetreat && row.retreatGoalToBaseM > 12;
    var garrison = row.isPreparedAttacker && row.preparedGarrison && row.t >= 45;
    var code = wrongRetreat ? 'strategic-retreat-not-heading-to-base' : null;
    if (!code && garrison) code = 'attacker-prepared-garrison';

    if (code) {
      var key = code + '/' + row.squad;
      if (!flagged.has(key)) {
        flagged.add(key);
        violations.push({ code: code, firstSeen: row.t, squad: row.squad, evidence: row });
      }
    }

    if (row.state === 'retreat' && row.centerToBaseM != null) {
      var history = retreatHistory[row.squad];
      if (!history) {
        history = {
          faction: row.faction,
          squad: row.squad,
          firstAt: row.t,
          initialBaseM: row.centerToBaseM,
          bestBaseM: row.centerToBaseM
        };
        retreatHistory[row.squad] = history;
      }
      history.lastAt = row.t;
      history.lastBaseM = row.centerToBaseM;
      history.bestBaseM = Math.min(history.bestBaseM, row.centerToBaseM);
      history.atBase = !!history.atBase || row.assembly === 'at-base';
    }

    if (!prior || prior.phase !== row.phase || prior.state !== row.state || prior.intent !== row.intent) {
      transitions.push({
        t: row.t,
        squad: row.squad,
        state: row.state,
        phase: row.phase,
        intent: row.intent,
        version: row.missionVersion
      });
    }
    snapshots.push(row);
    last[row.squad] = row;
  }

  (root.BattleProbes = root.BattleProbes || {})['strategic-mission-trace'] = {
    every: 2,
    start: function () {
      snapshots = [];
      transitions = [];
      violations = [];
      retreatHistory = Object.create(null);
      last = Object.create(null);
      flagged = new Set();
    },
    sample: function (sim) {
      ['us', 'ge'].forEach(function (faction) {
        var force = sim.factions[faction];
        (force ? force.squads : []).forEach(function (sq) {
          collect(sim, sq);
        });
      });
    },
    report: function () {
      return {
        schema: 'grasstex-strategic-forensic-v1',
        resolutionSeconds: 2,
        squadSamples: snapshots,
        retreatTracking: Object.values(retreatHistory),
        transitions: transitions,
        invariantViolations: violations
      };
    }
  };
})(window);
