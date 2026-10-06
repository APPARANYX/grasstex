/* Phase C1: Squad Leader local planner. Consumes Force Intent +
   TacticalSituation and produces a local task (approach, support,
   route-transition, structure-control, objective-security, recover,
   handoff). Behavioral, behind ?localPlan=1 (default OFF).
   Writes sq._localTask (owned by this module). Does NOT write
   commandPhase, objective, orderAnchor. */
(function (root) {
  'use strict';
  if (!root.BattleModules || !root.SquadAI || root.BattleSquadLeaderLocalPlan) return;

  var L = root.BattleLeases;
  var A = root.SquadAI;

  function flagOn(search) {
    return /[?&]localPlan=1\b/.test(search || (typeof location !== 'undefined' ? location.search : ''));
  }

  function dist(a, b) {
    return a && b ? Math.hypot((+a.x || 0) - (+b.x || 0), (+a.z || 0) - (+b.z || 0)) : Infinity;
  }

  function avgPos(sq) {
    var m = A.aliveMembers(sq), n = m.length;
    if (!n) return null;
    var x = 0, z = 0;
    for (var i = 0; i < n; i++) { x += m[i].root.position.x; z += m[i].root.position.z; }
    return { x: x / n, z: z / n };
  }

  /* Select a local task based on the macro mission + tactical situation. */
  function selectLocalTask(sim, sq) {
    var m = sq._macroMission;
    if (!m) return { kind: 'hold', reason: 'no-mission' };

    var pos = avgPos(sq);
    var goal = m.point;
    var d = dist(pos, goal);
    var TS = root.BattleTacticalSituation;
    var ts = TS && TS.summary(sim) && TS.summary(sim).tacticalSituation;
    var fac = ts && ts[sq.faction];
    var inContact = !!sq.inContact;
    var leaderless = sq.state === 'retreat' || !A.leaderOf(sq) || (sq._successionLease && L.holds(sq, 'succession', sim.time));

    /* C2: graceful degradation — leaderless squads hold, don't invent tasks */
    if (leaderless) return { kind: 'hold', reason: 'leaderless', preserve: true };

    /* If in contact and not at objective: fight from current position */
    if (inContact && d > 40) return { kind: 'support', reason: 'in-contact-overwatch' };

    /* If at objective and defending: secure */
    if (m.intent === 'defend' && d < 40) return { kind: 'objective-security', reason: 'defending-objective' };

    /* If at objective and capturing: structure-control if urban, else secure */
    if (m.intent === 'capture' && d < 30) {
      var scenario = sim.scene && sim.scene.metadata && (sim.scene.metadata.battleScenario || sim.scene.metadata.battleTown);
      var urban = scenario && scenario.center && dist(pos, scenario.center) < (scenario.radius || 250);
      return { kind: urban ? 'structure-control' : 'objective-security', reason: 'at-objective' };
    }

    /* If retreating/reconstituting: recover */
    if (m.intent === 'reconstitute' || sq.state === 'retreat') return { kind: 'recover', reason: 'reconstitution' };

    /* If reserve: hold */
    if (m.intent === 'reserve') return { kind: 'hold', reason: 'reserve' };

    /* Default: approach the objective */
    if (d > 40) return { kind: 'approach', reason: 'advancing-to-objective', goal: goal };

    /* Close to objective but not yet there: route-transition */
    return { kind: 'route-transition', reason: 'final-approach', leg: sq.routeIndex || 0 };
  }

  function updateLocalTask(sim, sq) {
    if (!flagOn()) return;
    var task = selectLocalTask(sim, sq);
    task.updatedAt = +sim.time || 0;
    task.missionVersion = sq._macroMission ? sq._macroMission.version : 0;
    sq._localTask = task;
  }

  root.BattleSquadLeaderLocalPlan = {
    version: '1.0-c1',
    selectLocalTask: selectLocalTask,
    updateLocalTask: updateLocalTask,
    flagOn: flagOn
  };

  if (root.BattleModules) {
    root.BattleModules.registerSystem('squad-leader-local-plan', {
      version: '1.0-c1',
      onCommanderTick: function (sim) {
        if (!flagOn()) return;
        ['us', 'ge'].forEach(function (f) {
          var squads = sim.factions && sim.factions[f] && sim.factions[f].squads || [];
          for (var i = 0; i < squads.length; i++) updateLocalTask(sim, squads[i]);
        });
      }
    });
  }
  console.log('[TACTICS] C1: Squad Leader local planner loaded (?localPlan=1 to enable)');
})(typeof window !== 'undefined' ? window : globalThis);
