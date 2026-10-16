/* Read-only focused 5 km postmortem. Run with scripts/run_probe.cjs on a seed
   nominated by the existing benchmark's ranked diagnostic evidence.
   Samples all squads at 2 s resolution; no writes to simulation state, no RNG. */
(function (root) {
  'use strict';
  var rows, sightings, last, baseSamples;
  function p(v) {
    return v && Number.isFinite(+v.x) && Number.isFinite(+v.z)
      ? [+(+v.x).toFixed(1), +(+v.z).toFixed(1)]
      : null;
  }
  function d(a, b) {
    return a && b ? +Math.hypot(a.x - b.x, a.z - b.z).toFixed(1) : null;
  }
  function center(sq) {
    var alive = (sq.members || []).filter(function (s) { return !s.dead && s.root; });
    if (!alive.length) return null;
    return {
      x: alive.reduce(function (x, s) { return x + s.root.position.x; }, 0) / alive.length,
      z: alive.reduce(function (z, s) { return z + s.root.position.z; }, 0) / alive.length
    };
  }
  function capture(sim, sq) {
    var at = center(sq), home = sq.baseHome || sq.home, macro = sq._macroMission || {},
      goal = root.SquadAI && root.SquadAI.retreatGoal ? root.SquadAI.retreatGoal(sq) : null,
      alive = (sq.members || []).filter(function (s) { return !s.dead; }).length,
      next = sq.route && sq.route[sq.routeIndex || 0],
      side = sim._sides || {};
    return {
      t: +sim.time.toFixed(2),
      faction: sq.faction,
      squad: String(sq.id),
      alive: alive,
      position: p(at),
      state: sq.state || null,
      phase: sq.commandPhase || null,
      intent: macro.intent || null,
      missionVersion: macro.version == null ? null : macro.version,
      missionStatus: macro.status || null,
      objectiveId: macro.objectiveId || sq.targetObjective || null,
      preparedGarrison: !!sq._preparedDefenseRequest,
      temporarySecurity: !!sq._captureZoneDefenseRequest,
      homeBaseId: sq.homeBaseId || null,
      centerToBaseM: d(at, home),
      centerToTacticalHomeM: d(at, sq.home),
      retreatGoalToBaseM: d(goal, home),
      retreatGoal: p(goal),
      routeLeg: p(next),
      routeIndex: sq.routeIndex || 0,
      routeLength: sq.route ? sq.route.length : 0,
      anchor: p(sq.orderAnchor),
      orderGoal: p(sq._orderGoal),
      assembly: sq._assembly && sq._assembly.phase || null,
      isPreparedAttacker: !!(side.attacker && side.attacker === sq.faction),
      movementStops: (sq.members || []).filter(function (s) {
        return !s.dead && /blocked/.test(String(s._movementStopReason || ''));
      }).length
    };
  }
  (root.BattleProbes = root.BattleProbes || {})['strategic-mission-trace'] = {
    every: 2,
    start: function () {
      rows = [];
      sightings = [];
      last = Object.create(null);
      baseSamples = Object.create(null);
    },
    sample: function (sim) {
      ['us', 'ge'].forEach(function (faction) {
        ((sim.factions[faction] && sim.factions[faction].squads) || []).forEach(function (sq) {
          var x = capture(sim, sq), prior = last[x.squad],
            remnant = x.alive <= 4 && x.alive > 0,
            wrongBase =
              x.state === 'retreat' && !!x.homeBaseId && !remnant &&
              x.assembly === 'to-base' && x.retreatGoalToBaseM != null &&
              x.retreatGoalToBaseM > 12,
            attackerGarrison =
              x.isPreparedAttacker && x.preparedGarrison && x.t >= 45;
          if (wrongBase || attackerGarrison) {
            var code = wrongBase ? 'strategic-retreat-not-heading-to-base' : 'attacker-prepared-garrison';
            var key = code + '/' + x.squad;
            if (!sightings.some(function (s) { return s.key === key; })) {
              sightings.push({ key: key, code: code, firstSeen: x.t, squad: x.squad, evidence: x });
            }
          }
          if (x.state === 'retreat' && x.centerToBaseM != null) {
            var b = baseSamples[x.squad] || (baseSamples[x.squad] = {
              faction: x.faction, squad: x.squad, firstAt: x.t, initialBaseM: x.centerToBaseM
            });
            b.lastAt = x.t;
            b.lastBaseM = x.centerToBaseM;
            b.bestBaseM = Math.min(b.bestBaseM == null ? Infinity : b.bestBaseM, x.centerToBaseM);
            b.atBase = b.atBase || x.assembly === 'at-base';
          }
          if (!prior || prior.phase !== x.phase || prior.state !== x.state ||
              prior.intent !== x.intent || prior.missionVersion !== x.missionVersion ||
              prior.assembly !== x.assembly) {
            sightings.push({
              code: 'transition', t: x.t, squad: x.squad, phase: x.phase,
              state: x.state, intent: x.intent, version: x.missionVersion, assembly: x.assembly
            });
          }
          rows.push(x);
          last[x.squad] = x;
        });
      });
    },
    report: function () {
      return {
        schema: 'grasstex-strategic-forensic-v1',
        resolutionSeconds: 2,
        squadSamples: rows,
        retreatTracking: Object.values(baseSamples),
        transitionsAndAlerts: sightings,
        invariantViolations: sightings.filter(function (s) {
          return s.code !== 'transition';
        })
      };
    }
  };
})(window);
