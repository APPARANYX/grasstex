/* Objective-assignment and replan health, exported with AI diagnostics.

   This is deliberately observational. It records whether a side has made objective progress and
   whether its squads still carry role/target intent; Force Command remains responsible for the
   replan policy and reads two numbers from here: `objectiveStallSeconds` and `lastObjectiveProgressAt`
   (its strategic-stall wake, commander-ai.js). `replanDue` and `replanReasons` are diagnostics for
   readers of the export; nothing in the runtime consumes them.

   One progress clock per faction. A stall is "due" for a replan at the moment that side's General
   wakes on it, so the threshold is the General's own BattleCommanderAI.strategicStallReplan (120 s).
   Enemy progress never resets the friendly clock. This module
   used to carry a second constant, 12 s, that flagged `objective-stalled` ten times earlier than
   anything acted on it, so the export said a replan was due for 108 s in which the General did nothing.
   With no General loaded nobody replans, so no stall is ever due.
*/
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleAICoordinationHealth) return;

  var SAMPLE_SECONDS = 2;
  function replanAfter() {
    var command = root.BattleCommanderAI,
      seconds = command ? +command.strategicStallReplan : 0;
    return seconds > 0 ? seconds : Infinity;
  }
  function now(sim) {
    return sim && isFinite(+sim.time) ? +sim.time : 0;
  }
  function objectiveSignature(sim) {
    var all = (sim && sim.objectiveControl && sim.objectiveControl.objectives) || {};
    return Object.keys(all)
      .sort()
      .map(function (id) {
        var s = all[id] || {};
        return [id, s.owner || 'neutral', s.active || '', s.phase || '', Math.round((+s.progress || 0) * 10)].join('|');
      })
      .join(';');
  }
  /* Each General gets its own progress clock. Only positive progress by this faction advances its clock:
     an opponent moving/capturing elsewhere cannot make this side look strategically unstalled. */
  function progressSnapshot(sim, faction) {
    var all = (sim && sim.objectiveControl && sim.objectiveControl.objectives) || {},
      out = {};
    Object.keys(all).forEach(function (id) {
      var st = all[id] || {};
      out[id] = {
        owned: st.owner === faction,
        active: st.active === faction,
        progress: st.active === faction ? +st.progress || 0 : 0
      };
    });
    return out;
  }
  function madeProgress(before, after) {
    var ids = Object.keys(after || {});
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i],
        a = after[id] || {},
        b = (before && before[id]) || {};
      if (a.owned && !b.owned) return true;
      if (a.active && +a.progress > (+b.progress || 0) + 0.05) return true;
    }
    return false;
  }
  function sideHealth(sim, faction, lastProgress) {
    var squads = (sim && sim.factions && sim.factions[faction] && sim.factions[faction].squads) || [],
      roles = {},
      targets = {},
      phases = {},
      assignedRole = 0,
      assignedTarget = 0,
      active = 0;
    squads.forEach(function (sq) {
      if ((sq.aliveCount || 0) <= 0 || sq.state === 'retreat' || sq.disbanded) return;
      active++;
      var role = sq.commandRole || 'unassigned',
        target = sq.targetObjective || 'unassigned',
        phase = sq.commandPhase || 'unknown';
      roles[role] = (roles[role] || 0) + 1;
      targets[target] = (targets[target] || 0) + 1;
      phases[phase] = (phases[phase] || 0) + 1;
      if (role !== 'unassigned') assignedRole++;
      if (target !== 'unassigned') assignedTarget++;
    });
    var stalled = Math.max(0, now(sim) - lastProgress),
      assaulting =
        (phases.assault || 0) + (phases.capture || 0) + (phases['clear-town'] || 0) + (phases.flank || 0),
      missingRoles = Math.max(0, active - assignedRole),
      missingTargets = Math.max(0, active - assignedTarget),
      reasons = [];
    if (missingRoles) reasons.push('missing-role');
    if (missingTargets) reasons.push('missing-target');
    if (assaulting > 0 && stalled >= replanAfter()) reasons.push('objective-stalled');
    return {
      activeSquads: active,
      assignedRoles: assignedRole,
      assignedTargets: assignedTarget,
      unassignedRoles: missingRoles,
      unassignedTargets: missingTargets,
      assignmentMissing: missingRoles > 0 || missingTargets > 0,
      roles: roles,
      targets: targets,
      phases: phases,
      objectiveStallSeconds: +stalled.toFixed(1),
      replanReasons: reasons,
      replanDue: active > 0 && reasons.length > 0
    };
  }
  function reset(sim) {
    if (!sim) return;
    var t = now(sim);
    sim._coordinationHealth = {
      version: '2.0-faction-progress',
      sampledAt: t,
      lastSample: t,
      lastAnyObjectiveChangeAt: t,
      objectiveSignature: objectiveSignature(sim),
      lastObjectiveProgressAt: { us: t, ge: t },
      objectiveProgress: { us: progressSnapshot(sim, 'us'), ge: progressSnapshot(sim, 'ge') },
      replanAfter: replanAfter(),
      sides: { us: sideHealth(sim, 'us', t), ge: sideHealth(sim, 'ge', t) }
    };
  }
  /* Not gated on trainingMode. Force Command reads `objectiveStallSeconds` and `lastObjectiveProgressAt`
   from this sampler, so skipping it under training/benchmark runs did not disable a diagnostic - it
   froze one the commander reads at its t=0 value (objectiveStallSeconds permanently 0, so the
   strategic-stall wake never came) for the whole battle, and made the benchmark exercise different
   recovery logic from live play. */
  function sample(sim) {
    if (!sim || sim.winner) return;
    var h = sim._coordinationHealth;
    if (!h) {
      reset(sim);
      return;
    }
    var t = now(sim);
    /* A restart rewinds sim.time, which would otherwise leave lastSample in the future and stop
     this sampler for the whole of the next battle. */
    if (t < h.lastSample) {
      reset(sim);
      return;
    }
    if (t - h.lastSample < SAMPLE_SECONDS) return;
    h.lastSample = t;
    var sig = objectiveSignature(sim);
    if (sig !== h.objectiveSignature) {
      h.objectiveSignature = sig;
      h.lastAnyObjectiveChangeAt = t;
    }
    ['us', 'ge'].forEach(function (faction) {
      var next = progressSnapshot(sim, faction),
        prev = h.objectiveProgress && h.objectiveProgress[faction];
      if (madeProgress(prev, next)) h.lastObjectiveProgressAt[faction] = t;
      h.objectiveProgress[faction] = next;
    });
    h.sampledAt = t;
    h.sides = {
      us: sideHealth(sim, 'us', h.lastObjectiveProgressAt.us),
      ge: sideHealth(sim, 'ge', h.lastObjectiveProgressAt.ge)
    };
  }
  root.BattleModules.registerSystem('ai-coordination-health', {
    version: '2.0-faction-progress',
    onBattleStart: reset,
    onBattleRestart: reset,
    onCommanderTick: function (sim) {
      sample(sim);
    }
  });
  root.BattleAICoordinationHealth = {
    version: '2.0-faction-progress',
    get replanAfter() {
      return replanAfter();
    },
    reset: reset,
    sample: sample,
    summary: function (sim) {
      return sim && sim._coordinationHealth ? JSON.parse(JSON.stringify(sim._coordinationHealth)) : null;
    }
  };
  console.log('[AI-HEALTH] objective assignment and replan health active');
})(typeof window !== 'undefined' ? window : globalThis);
