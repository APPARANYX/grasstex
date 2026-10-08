/* Objective-assignment and replan health, exported with AI diagnostics.

   This is deliberately observational. It records whether a side has made objective progress and
   whether its squads still carry role/target intent; Force Command remains responsible for the
   replan policy and reads two numbers from here: `objectiveStallSeconds` and `lastObjectiveProgressAt`
   (its strategic-stall wake, commander-ai.js). `replanDue` and `replanReasons` are diagnostics for
   readers of the export; nothing in the runtime consumes them.

   Since 2.1 it also carries `strategicChain` (see the block comment above its functions): per
   faction, the last time each link of the strategic chain moved (objective change and progress,
   brief issued, Squad Leader acceptance, local phase change, measurable movement toward the
   mission point, stall detection, stall wake, recovery stage) plus one outcome record per
   strategic-family wake and a census of squads whose executing mission has shown no point
   progress for longer than the follow window. Observation only: the commander reads none of it.

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
        return [
          id,
          s.owner || 'neutral',
          s.active || '',
          s.phase || '',
          Math.round((+s.progress || 0) * 10)
        ].join('|');
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
      /* Include 'approach' in the assaulting count to match 97-ai-timeline-recorder.js's
         ADVANCE set. A squad in 'approach' is advancing toward an objective and should
         count as assaulting for the objective-stalled check; without it, a faction where
         every squad is still in 'approach' reads as "not assaulting" and the stall is
         invisible. */
      assaulting =
        (phases.approach || 0) +
        (phases.assault || 0) +
        (phases.capture || 0) +
        (phases['clear-town'] || 0) +
        (phases.flank || 0),
      missingRoles = Math.max(0, active - assignedRole),
      missingTargets = Math.max(0, active - assignedTarget),
      reasons = [];
    if (missingRoles) reasons.push('missing-role');
    if (missingTargets) reasons.push('missing-target');
    if (assaulting > 0 && stalled >= replanAfter()) reasons.push('objective-stalled');
    /* A side whose squads are all defending, holding or regrouping reads as "not assaulting", yet the same stall clock
       can run and the General's recovery ladder can act on it (it wakes on the seconds, never on this flag). Naming it
       keeps `replanDue` from reading false while recovery is working. Diagnostics only: nothing consumes the flag. */ else if (
      stalled >= replanAfter() &&
      active > 0
    )
      reasons.push('objective-stalled-no-assault');
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
  /* Strategic-chain observer (behavior-neutral; PR item: GE strategic freeze / stale plans).
     Reconstructs, per faction, the chain a strategic-stall recovery depends on: objective
     change -> objective progress -> brief issued -> Squad Leader accepted -> local phase ->
     measurable movement toward the mission point -> stall detected -> recovery stage. For every
     strategic-family wake (reason 'strategic-*') it records what the wake actually changed: the
     brief before (this module's own previous snapshot), the brief after, whether a new brief was
     generated or issueMission's dedup left the old one in place, when the Squad Leader accepted,
     whether the local phase changed, and whether objective or point progress followed within the
     follow window (the General's own strategicStallReplan). It also keeps a per-faction census of
     squads holding an executing mission whose point has not got nearer for longer than that
     window - the stale-plan measurement (an empty objective alone is not evidence of a stale
     plan, so the census records owner and vacancy, never a verdict). Reads only public squad,
     mission and objective state plus this module's own clocks; writes only inside
     _coordinationHealth, so the full-diagnostics export (module 99) and the benchmark record's
     coordinationHealth carry it with no other change. */
  var CHAIN_WAKE_LIMIT = 80;
  function chainTuning() {
    var command = root.BattleCommanderAI || {},
      recovery = command.strategicStallRecovery || {};
    return {
      followWindow: +command.strategicStallReplan || 120,
      progressDistance: +recovery.progressDistance || 6
    };
  }
  function emptyChainFaction(t) {
    return {
      lastObjectiveChangeAt: t,
      lastObjectiveProgressAt: t,
      lastMissionChangeAt: null,
      lastMissionIssuedAt: null,
      lastMissionAcceptedAt: null,
      lastPhaseChangeAt: null,
      lastMissionPointProgressAt: null,
      lastStallDetectionAt: null,
      lastStallWakeAt: null,
      lastRecoveryStageAt: null,
      stalledMissionSquads: []
    };
  }
  function freshStrategicChain(t) {
    return {
      version: '1.0-strategic-chain',
      followWindow: chainTuning().followWindow,
      factions: { us: emptyChainFaction(t), ge: emptyChainFaction(t) },
      wakes: [],
      _wakeCountSeen: null,
      _stageSeen: { us: null, ge: null },
      _stallDueSeen: { us: null, ge: null },
      _squads: {}
    };
  }
  function squadCentroid(sq) {
    var members = (sq && sq.members) || [],
      x = 0,
      z = 0,
      n = 0;
    for (var i = 0; i < members.length; i++) {
      var s = members[i];
      if (!s || s.dead || !s.root || !s.root.position) continue;
      x += +s.root.position.x || 0;
      z += +s.root.position.z || 0;
      n++;
    }
    return n ? { x: x / n, z: z / n } : null;
  }
  function wakePicture(sim) {
    var counts = (sim && sim.objectiveControl && sim.objectiveControl.counts) || null,
      phases = {};
    ['us', 'ge'].forEach(function (f) {
      var squads = (sim && sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
      squads.forEach(function (sq) {
        if ((sq.aliveCount || 0) <= 0 || sq.state === 'retreat' || sq.disbanded) return;
        var p = sq.commandPhase || 'unknown';
        phases[p] = (phases[p] || 0) + 1;
      });
    });
    return { objectiveCounts: counts, squadPhases: phases };
  }
  function objectiveOwner(sim, id) {
    var all = (sim && sim.objectiveControl && sim.objectiveControl.objectives) || {},
      st = id != null ? all[id] || {} : {};
    return { owner: st.owner || 'neutral', vacant: !!st.vacantOwner };
  }
  function updateStrategicChain(sim, h, t) {
    if (!h.strategicChain) h.strategicChain = freshStrategicChain(t);
    var c = h.strategicChain,
      tune = chainTuning(),
      st = sim._macroMissionState || null;
    /* Mirror the module's own objective clocks (the chain's job is one place with every link;
       they are updated by sample() above, before this call, so they are already fresh). */
    ['us', 'ge'].forEach(function (faction) {
      var fcMirror = c.factions[faction];
      if (!fcMirror) return;
      fcMirror.lastObjectiveChangeAt = h.lastAnyObjectiveChangeAt;
      if (h.lastObjectiveProgressAt && isFinite(+h.lastObjectiveProgressAt[faction]))
        fcMirror.lastObjectiveProgressAt = +h.lastObjectiveProgressAt[faction];
    });
    /* 1. New strategic-family wakes from the General's own wake log (recentWakes is capped at
       60 and this sampler runs at least every 2 s, so slicing by the count diff is exact). */
    if (st && typeof st.wakeCount === 'number' && Array.isArray(st.recentWakes)) {
      if (c._wakeCountSeen == null) c._wakeCountSeen = st.wakeCount;
      if (st.wakeCount > c._wakeCountSeen) {
        var fresh = st.recentWakes.slice(-(st.wakeCount - c._wakeCountSeen));
        for (var i = 0; i < fresh.length; i++) {
          var w = fresh[i];
          if (String(w.reason || '').indexOf('strategic-') !== 0) continue;
          var fc0 = c.factions[w.faction];
          if (!fc0) continue;
          var gen = (st.generals && st.generals[w.faction]) || null,
            recovery = (gen && gen.stallRecovery) || null,
            history = (recovery && recovery.history) || [],
            pre = c._squads[String(w.squad)] || null,
            lastStage = history.length ? history[history.length - 1] : null;
          fc0.lastStallWakeAt = w.time != null ? +w.time : t;
          c.wakes.push({
            faction: w.faction,
            squad: w.squad,
            reason: w.reason,
            target: w.target || null,
            time: w.time != null ? +w.time : t,
            stallSeconds:
              h.sides && h.sides[w.faction] ? +h.sides[w.faction].objectiveStallSeconds || 0 : null,
            recoveryCompleted: recovery ? +recovery.completed || 0 : null,
            recoveryEpisode: recovery ? recovery.episode : null,
            stageBefore:
              lastStage && lastStage.time <= (w.time != null ? +w.time : t) ? lastStage.stage : null,
            picture: wakePicture(sim),
            missionBefore: pre
              ? {
                  version: pre.version,
                  status: pre.status,
                  objectiveId: pre.objectiveId,
                  phase: pre.phase
                }
              : null,
            missionAfter: null,
            briefNew: null,
            dedupSuppressed: null,
            acceptedAt: null,
            phaseChangedAt: null,
            objectiveProgressAt: null,
            pointProgressAt: null,
            supersededAt: null,
            closedAt: null,
            outcome: null
          });
        }
        if (c.wakes.length > CHAIN_WAKE_LIMIT) c.wakes.splice(0, c.wakes.length - CHAIN_WAKE_LIMIT);
        c._wakeCountSeen = st.wakeCount;
      }
    }
    /* 2. Per-squad diff -> faction chain clocks. The snapshot carries its own point-progress
          baseline so a new brief (version or point change) restarts the measurement, exactly as
          the recovery's own trackMissionProgress does. */
    var liveIds = {};
    ['us', 'ge'].forEach(function (faction) {
      var fc = c.factions[faction],
        squads = (sim.factions && sim.factions[faction] && sim.factions[faction].squads) || [];
      squads.forEach(function (sq) {
        var id = String(sq.id),
          m = sq._macroMission || null,
          point = m && m.point ? { x: +m.point.x || 0, z: +m.point.z || 0 } : null,
          centroid = squadCentroid(sq),
          d = centroid && point ? +Math.hypot(centroid.x - point.x, centroid.z - point.z).toFixed(1) : null,
          prev = c._squads[id],
          snap = {
            faction: faction,
            version: m ? m.version : null,
            status: m ? m.status : null,
            objectiveId: m ? m.objectiveId || null : null,
            phase: sq.commandPhase || null,
            acceptedAt: m && isFinite(+m.acceptedAt) ? +m.acceptedAt : null,
            point: point,
            best: null,
            checkpoint: null,
            lastPointProgressAt: null
          };
        liveIds[id] = 1;
        if (prev) {
          if (snap.version != null && prev.version != null && snap.version > prev.version) {
            fc.lastMissionChangeAt = t;
            fc.lastMissionIssuedAt = m && isFinite(+m.issuedAt) ? +m.issuedAt : t;
          }
          if (
            snap.status === 'executing' &&
            snap.acceptedAt != null &&
            (prev.acceptedAt == null || snap.acceptedAt > prev.acceptedAt)
          )
            fc.lastMissionAcceptedAt = snap.acceptedAt;
          if (snap.phase !== prev.phase) fc.lastPhaseChangeAt = t;
        }
        var newBrief = prev && snap.version != null && prev.version != null && snap.version > prev.version,
          pointChanged =
            prev && point && prev.point && (point.x !== prev.point.x || point.z !== prev.point.z);
        if (!prev || newBrief || pointChanged || d == null) {
          snap.best = d;
          snap.checkpoint = d;
        } else {
          snap.best = d != null && prev.best != null ? Math.min(d, prev.best) : d;
          snap.checkpoint = prev.checkpoint;
          snap.lastPointProgressAt = prev.lastPointProgressAt;
          if (
            snap.best != null &&
            snap.checkpoint != null &&
            snap.checkpoint - snap.best >= tune.progressDistance
          ) {
            snap.checkpoint = snap.best;
            snap.lastPointProgressAt = t;
            fc.lastMissionPointProgressAt = t;
          }
        }
        c._squads[id] = snap;
      });
    });
    Object.keys(c._squads).forEach(function (id) {
      if (!liveIds[id]) delete c._squads[id];
    });
    /* 3. Wake follow-ups: acceptance, local phase change, supersession, progress, then close. */
    for (var j = 0; j < c.wakes.length; j++) {
      var wk = c.wakes[j],
        snap2 = c._squads[String(wk.squad)];
      if (wk.closedAt != null) continue;
      if (wk.missionAfter == null && snap2) {
        wk.missionAfter = {
          version: snap2.version,
          status: snap2.status,
          objectiveId: snap2.objectiveId,
          phase: snap2.phase
        };
        wk.briefNew =
          wk.missionBefore && snap2.version != null && wk.missionBefore.version != null
            ? snap2.version > wk.missionBefore.version
            : null;
        wk.dedupSuppressed = wk.briefNew === false;
      }
      if (!snap2) continue;
      /* Follow-ups first, then the close: a supersession or a late acceptance seen on the
         closing sample itself still belongs to this wake's record. */
      if (
        wk.briefNew &&
        wk.missionAfter &&
        snap2.version != null &&
        snap2.version > wk.missionAfter.version &&
        wk.supersededAt == null
      )
        wk.supersededAt = t;
      if (
        wk.acceptedAt == null &&
        wk.missionAfter &&
        snap2.version === wk.missionAfter.version &&
        snap2.status === 'executing' &&
        snap2.acceptedAt != null &&
        snap2.acceptedAt >= wk.time
      )
        wk.acceptedAt = snap2.acceptedAt;
      if (
        wk.phaseChangedAt == null &&
        wk.acceptedAt != null &&
        wk.missionAfter &&
        snap2.phase !== wk.missionAfter.phase
      )
        wk.phaseChangedAt = t;
      if (
        wk.pointProgressAt == null &&
        snap2.lastPointProgressAt != null &&
        snap2.lastPointProgressAt > wk.time
      )
        wk.pointProgressAt = snap2.lastPointProgressAt;
      var own = h.lastObjectiveProgressAt && h.lastObjectiveProgressAt[wk.faction];
      if (wk.objectiveProgressAt == null && own != null && own > wk.time) wk.objectiveProgressAt = own;
      if (t > wk.time + tune.followWindow) {
        wk.closedAt = t;
        wk.outcome =
          wk.briefNew === false
            ? 'no-new-brief'
            : wk.acceptedAt == null && wk.supersededAt != null
              ? 'superseded-before-acceptance'
              : wk.acceptedAt == null
                ? 'not-accepted'
                : wk.objectiveProgressAt != null || wk.pointProgressAt != null
                  ? 'progressed'
                  : 'accepted-no-progress';
      }
    }
    /* 4. Stall-detection edges and recovery-stage moves, then the stalled-mission census. */
    if (st && st.generals) {
      ['us', 'ge'].forEach(function (f) {
        var fc = c.factions[f],
          gen = st.generals[f] || null,
          recovery = (gen && gen.stallRecovery) || null,
          history = (recovery && recovery.history) || [],
          key = history.length
            ? history[history.length - 1].time + '|' + history[history.length - 1].stage
            : '';
        if (c._stageSeen[f] == null) c._stageSeen[f] = key;
        else if (key !== c._stageSeen[f]) {
          c._stageSeen[f] = key;
          fc.lastRecoveryStageAt = t;
        }
        var due = !!(h.sides && h.sides[f] && h.sides[f].replanDue);
        if (c._stallDueSeen[f] == null) c._stallDueSeen[f] = due;
        else if (due && !c._stallDueSeen[f]) fc.lastStallDetectionAt = t;
        c._stallDueSeen[f] = due;
      });
    }
    ['us', 'ge'].forEach(function (faction) {
      var fc = c.factions[faction],
        squads = (sim.factions && sim.factions[faction] && sim.factions[faction].squads) || [],
        stalled = [];
      squads.forEach(function (sq) {
        if ((sq.aliveCount || 0) <= 0 || sq.state === 'retreat' || sq.disbanded) return;
        var snap3 = c._squads[String(sq.id)];
        if (!snap3 || snap3.status !== 'executing' || !snap3.point) return;
        var since =
          snap3.lastPointProgressAt != null
            ? t - snap3.lastPointProgressAt
            : snap3.acceptedAt != null
              ? t - snap3.acceptedAt
              : 0;
        if (since <= tune.followWindow) return;
        var owned = objectiveOwner(sim, snap3.objectiveId);
        stalled.push({
          squad: sq.id,
          objectiveId: snap3.objectiveId,
          objectiveOwner: owned.owner,
          objectiveVacant: owned.vacant,
          missionVersion: snap3.version,
          secondsSinceProgress: +since.toFixed(1)
        });
      });
      fc.stalledMissionSquads = stalled;
    });
  }

  function reset(sim) {
    if (!sim) return;
    var t = now(sim);
    sim._coordinationHealth = {
      version: '2.1-strategic-chain',
      sampledAt: t,
      lastSample: t,
      lastAnyObjectiveChangeAt: t,
      objectiveSignature: objectiveSignature(sim),
      lastObjectiveProgressAt: { us: t, ge: t },
      objectiveProgress: { us: progressSnapshot(sim, 'us'), ge: progressSnapshot(sim, 'ge') },
      replanAfter: replanAfter(),
      sides: { us: sideHealth(sim, 'us', t), ge: sideHealth(sim, 'ge', t) },
      strategicChain: freshStrategicChain(t)
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
    updateStrategicChain(sim, h, t);
  }
  root.BattleModules.registerSystem('ai-coordination-health', {
    version: '2.1-strategic-chain',
    onBattleStart: reset,
    onBattleRestart: reset,
    onCommanderTick: function (sim) {
      sample(sim);
    }
  });
  root.BattleAICoordinationHealth = {
    version: '2.1-strategic-chain',
    get replanAfter() {
      return replanAfter();
    },
    reset: reset,
    sample: sample,
    summary: function (sim) {
      return sim && sim._coordinationHealth ? JSON.parse(JSON.stringify(sim._coordinationHealth)) : null;
    }
  };
  root.GTLog('[AI-HEALTH] objective assignment and replan health active');
})(typeof window !== 'undefined' ? window : globalThis);
