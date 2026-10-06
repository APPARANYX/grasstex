/* Commander strategic-recovery sub-module (extracted from battle/commander-ai.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.

   This module owns the General's strategic-recovery machine: the stall detector
   (strategicStallInfo, stallRecoveryState, stallEligible, activeSquads, stalledEfforts and the
   progress trackers trackMissionProgress, makingMissionProgress, recentlyExecutingMission),
   the effort pickers (usefulDefender, objectiveReachable, reachableAttackMap, chooseMainEffort,
   forcedCandidate, missionDistance), the recovery stage machine (recordRecoveryStage,
   runReconcileStage, staleHoldOrSupport, runReleaseStage, runMainEffortStage, runResetStage,
   runStrategicRecovery, recordStallOutcome) and the mission issuing it drives (selectMission,
   reconsiderMission, wakeReason). A stalled front is detected, its stale holds and supports are
   released, a main effort is chosen and missions are re-issued - in stages, on the General's
   own clocks (STRATEGIC_STALL_RECOVERY), never tick by tick.

   Wiring is the reverse of the 15m -> 16 pattern (same as the cover, stress and fire/stance
   splits): commander-ai.js loads before every module in both chains, so it cannot call this
   factory at its own load time. Instead it publishes the ctx below (_commanderRecoveryCtx:
   its closure utilities, the doctrine handle D, the mission-lifecycle functions the recovery
   re-tasks through - missionState, catalogKey, defenseRequest, finishMission, issueMission,
   recordMacroWake, reserveDue - and the COMMAND_TICK / STRATEGIC_STALL_* constants, which
   stay there) and an attach sink (_commanderRecoveryAttach), and this file calls the factory
   with that ctx at ITS load time and installs the returned functions back into the parent.
   Until then the parent's delegating closures fail loudly, so a commander-ai.js chain without
   this module says so on the first strategic tick instead of silently never recovering a
   stalled front. */
(function (root) {
  'use strict';
  if (root._commanderStrategicRecovery) return;

  /* Factory: the module calls it itself at load time with commander-ai.js's ctx (see above). */
  root._commanderStrategicRecovery = function (ctx) {
    var root = ctx.root,
      D = ctx.D,
      telemetry = ctx.telemetry,
      COMMAND_TICK = ctx.COMMAND_TICK,
      STRATEGIC_STALL_STAGES = ctx.STRATEGIC_STALL_STAGES,
      STRATEGIC_STALL_RECOVERY = ctx.STRATEGIC_STALL_RECOVERY,
      STRATEGIC_STALL_REPLAN = ctx.STRATEGIC_STALL_REPLAN,
      generalFor = ctx.generalFor,
      missionState = ctx.missionState,
      catalogKey = ctx.catalogKey,
      defenseRequest = ctx.defenseRequest,
      finishMission = ctx.finishMission,
      issueMission = ctx.issueMission,
      recordMacroWake = ctx.recordMacroWake,
      reserveDue = ctx.reserveDue;

  function strategicStallInfo(sim, faction) {
    var health = sim._coordinationHealth,
      side = health && health.sides && health.sides[faction];
    var last = health && health.lastObjectiveProgressAt && health.lastObjectiveProgressAt[faction];
    return {
      age: (side && +side.objectiveStallSeconds) || 0,
      lastProgressAt: isFinite(+last) ? +last : 0
    };
  }
  function stallRecoveryState(sim, faction) {
    var state = generalFor(sim, faction).stallRecovery,
      info = strategicStallInfo(sim, faction),
      episode = String(info.lastProgressAt);
    if (state.episode !== episode) {
      state.episode = episode;
      state.completed = 0;
      state.mainEffort = null;
      state.progress = {};
    }
    return state;
  }
  /* A faction-wide stall is only evidence against a capture brief that has had the whole first
     recovery window to work. Later recovery stages do not make this eligibility progressively wider:
     they have their own explicit scope below. */
  function stallEligible(sim, m) {
    return !!(
      m &&
      m.intent === 'capture' &&
      (+sim.time || 0) - (+m.issuedAt || 0) >= STRATEGIC_STALL_REPLAN - COMMAND_TICK / 2
    );
  }
  function activeSquads(squads) {
    return (squads || []).filter(function (sq) {
      return sq && sq.state !== 'retreat' && D.aliveMembers(sq).length > 0;
    });
  }
  /* The objectives the side's stalled capture briefs are attacking: the efforts a recovery wake
     should be willing to close before opening new frontage. */
  function stalledEfforts(sim, squads) {
    var ids = {};
    for (var i = 0; i < squads.length; i++) {
      var sq = squads[i],
        m = sq._macroMission;
      if (sq.state !== 'retreat' && D.aliveMembers(sq).length && stallEligible(sim, m) && m.objectiveId)
        ids[m.objectiveId] = true;
    }
    return ids;
  }
  function missionDistance(sim, sq, m, p) {
    if (!m || !m.point) return Infinity;
    p = p || D.avgPos(sq);
    return p ? D.dist(p.x, p.z, m.point.x, m.point.z) : Infinity;
  }
  /* Macro only observes this. It never writes movement: a 6 m improvement toward the same mission
     point is a measurable-progress pulse used only by the 300 s reset gate. */
  function trackMissionProgress(sim, faction, squads) {
    var recovery = stallRecoveryState(sim, faction),
      live = {},
      now = +sim.time || 0;
    for (var i = 0; i < squads.length; i++) {
      var sq = squads[i],
        m = sq._macroMission;
      if (!sq || sq.state === 'retreat' || !D.aliveMembers(sq).length || !m || !m.point) continue;
      var id = String(sq.id),
        p = D.avgPos(sq),
        d = missionDistance(sim, sq, m, p),
        rec = recovery.progress[id];
      live[id] = 1;
      if (!rec || rec.version !== m.version || !isFinite(rec.checkpoint)) {
        recovery.progress[id] = {
          version: m.version,
          checkpoint: d,
          bestDistance: d,
          lastProgressAt: null,
          lastPosition: p ? { x: +p.x || 0, z: +p.z || 0 } : null,
          travelSinceExecution: 0,
          lastExecutionAt: null
        };
        continue;
      }
      /* The first recovery stage must distinguish "no objective-zone progress yet" from
         "the squad is not executing." Track centroid travel separately from strict progress
         toward the brief. This physical-execution pulse is used only by the 120 s reconcile;
         later recovery stages still catch circling or other movement that never advances the mission. */
      if (p) {
        if (rec.lastPosition) {
          var step = D.dist(rec.lastPosition.x, rec.lastPosition.z, p.x, p.z);
          if (isFinite(step) && step < 60) rec.travelSinceExecution = (+rec.travelSinceExecution || 0) + step;
        }
        rec.lastPosition = { x: +p.x || 0, z: +p.z || 0 };
        if ((+rec.travelSinceExecution || 0) >= STRATEGIC_STALL_RECOVERY.progressDistance) {
          rec.travelSinceExecution = 0;
          rec.lastExecutionAt = now;
        }
      }
      if (d < rec.bestDistance) rec.bestDistance = d;
      if (rec.checkpoint - rec.bestDistance >= STRATEGIC_STALL_RECOVERY.progressDistance) {
        rec.checkpoint = rec.bestDistance;
        rec.lastProgressAt = now;
      }
    }
    Object.keys(recovery.progress).forEach(function (id) {
      if (!live[id]) delete recovery.progress[id];
    });
    return recovery;
  }
  function makingMissionProgress(sim, faction, sq) {
    var recovery = stallRecoveryState(sim, faction),
      rec = recovery.progress[String(sq.id)];
    return !!(
      rec &&
      rec.lastProgressAt != null &&
      (+sim.time || 0) - rec.lastProgressAt <= STRATEGIC_STALL_RECOVERY.progressWindow
    );
  }
  function recentlyExecutingMission(sim, faction, sq) {
    var recovery = stallRecoveryState(sim, faction),
      rec = recovery.progress[String(sq.id)];
    return !!(
      rec &&
      rec.lastExecutionAt != null &&
      (+sim.time || 0) - rec.lastExecutionAt <= STRATEGIC_STALL_RECOVERY.progressWindow
    );
  }
  function usefulDefender(sim, sq) {
    var m = sq && sq._macroMission;
    if (!m || m.intent !== 'defend' || !m.objectiveId) return false;
    var obj = root.BattleObjectiveSystem && root.BattleObjectiveSystem.get(sim, m.objectiveId),
      st = obj && D.objectiveStatus(sim, obj);
    if (!(st && st.owner === sq.faction)) return false;
    /* A defender that has had no objective progress for 180s and is not in contact is no
       longer "useful" — it is frozen. Let the strategic-stall recovery stages see it so
       the General can re-task it. This breaks the two-defenders-on-opposite-sides-of-a-hill
       stalemate where neither side ever makes contact and both sit for the entire battle. */
    var health = root.BattleAICoordinationHealth,
      summary = health && typeof health.summary === 'function' ? health.summary(sim) : null,
      lastProgress = summary && summary.lastObjectiveProgressAt && summary.lastObjectiveProgressAt[sq.faction],
      now = +sim.time || 0;
    if (lastProgress && isFinite(+lastProgress) && now - lastProgress > 180 && !sq.inContact) return false;
    return true;
  }
  function objectiveReachable(sim, sq, obj) {
    var N = root.BattleNavigation,
      men = D.aliveMembers(sq),
      start = D.avgPos(sq),
      end = obj && D.objectivePoint(obj, sim, sq);
    if (!start || !end || !men.length) return false;
    if (!N || !N.planIngressPath) return true;
    try {
      var path = N.planIngressPath(sim, men[0], start, end);
      return !!(path && path.length);
    } catch (_) {
      return true;
    }
  }
  function reachableAttackMap(sim, sq, preferContested) {
    var map = {},
      list = sim._objectives || [];
    for (var i = 0; i < list.length; i++) {
      var obj = list[i],
        st = D.objectiveStatus(sim, obj) || {},
        owner = st.owner || 'neutral';
      if (owner === sq.faction) continue;
      if (preferContested && owner !== 'neutral' && !st.active) continue;
      if (objectiveReachable(sim, sq, obj)) map[String(obj.id)] = true;
    }
    return map;
  }
  function chooseMainEffort(sim, squads, stalled) {
    var active = activeSquads(squads).filter(function (sq) {
        var m = sq._macroMission;
        return !usefulDefender(sim, sq) && !(m && m.intent === 'reserve') && sq.commandRole !== 'reserve';
      }),
      votes = {},
      choices = {},
      i;
    function vote(preferContested) {
      votes = {};
      choices = {};
      for (i = 0; i < active.length; i++) {
        var sq = active[i],
          allowed = reachableAttackMap(sim, sq, preferContested),
          chosen = D.chooseObjective(sim, sq, false, stalled, allowed);
        if (!chosen) continue;
        var id = String(chosen.instance.id);
        votes[id] = (votes[id] || 0) + 1;
        choices[id] = chosen.instance;
      }
      var ids = Object.keys(votes).sort(function (a, b) {
        return votes[b] - votes[a] || a.localeCompare(b);
      });
      return ids.length ? { id: ids[0], instance: choices[ids[0]], votes: votes[ids[0]], active: active } : null;
    }
    return vote(true) || vote(false);
  }
  function forcedCandidate(sim, sq, obj) {
    if (!obj) return null;
    return {
      instance: obj,
      point: D.objectivePoint(obj, sim, sq),
      status: D.objectiveStatus(sim, obj) || {}
    };
  }
  function recordRecoveryStage(sim, faction, stage, info, detail) {
    var recovery = stallRecoveryState(sim, faction),
      event = {
        faction: faction,
        stage: stage.name,
        level: stage.level,
        threshold: stage.at,
        stallSeconds: +info.age.toFixed(1),
        episode: recovery.episode,
        affected: (detail && detail.affected) || 0,
        mainEffort: (detail && detail.mainEffort) || null,
        time: +(+sim.time || 0).toFixed(2)
      };
    recovery.completed = stage.level;
    if (event.mainEffort) recovery.mainEffort = event.mainEffort;
    recovery.history.push(event);
    if (recovery.history.length > 24) recovery.history.shift();
    generalFor(sim, faction).lastStall = event;
    missionState(sim).lastStall = event;
    telemetry(sim, 'decision-strategic-recovery', event);
    return event;
  }
  function wakeReason(sim, sq) {
    var m = sq._macroMission,
      living = D.aliveMembers(sq).length;
    if (living && m && m.status === 'completed' && m.endReason === 'reconstituted')
      return 'squad-reconstituted';
    if (sq.state === 'retreat' || !living) {
      var assembling = sq.state === 'retreat' && sq._reconGroup && m && m.intent === 'reconstitute';
      if (m && !assembling)
        finishMission(sim, sq, 'failed', sq.state === 'retreat' ? 'squad-retreat' : 'squad-destroyed');
      return null;
    }
    if (!m) return 'initial-mission';
    if (m.status === 'failed' || m.status === 'invalid' || m.status === 'completed') return 'mission-resume';
    /* A defense request is new information only when it changes the task: a squad already defending that
       objective keeps its brief while pressure comes and goes; releasing a request-bound brief is reassessed. */
    var request = defenseRequest(sim, sq);
    if (request ? !(m.intent === 'defend' && m.objectiveId === request.request.objectiveId) : !!m.requestKey)
      return 'request-changed';
    var escalation = sq._macroMissionRequest;
    if (escalation && escalation.missionVersion === m.version) return escalation.reason || 'captain-request';
    if (m.intent === 'reserve') return reserveDue(sim, sq) ? 'reserve-commit' : null;
    if (!m.objectiveId)
      return catalogKey(sim) !== (sq._macroMissionObservation || {}).catalog ? 'objective-opportunity' : null;
    var obj = root.BattleObjectiveSystem && root.BattleObjectiveSystem.get(sim, m.objectiveId);
    if (!obj) return 'mission-invalid';
    var st = D.objectiveStatus(sim, obj) || {},
      obs = sq._macroMissionObservation || {};
    if (m.intent === 'capture' && st.owner === sq.faction) return 'mission-complete';
    if (m.intent === 'defend' && st.owner !== obs.owner) return 'objective-control-changed';
    if (m.intent === 'capture' && !!st.vacantOwner !== obs.vacant && st.vacantOwner)
      return 'objective-vacated';
    return null;
  }
  function selectMission(sim, sq, town, reason, stalled, forcedObjective) {
    var request = defenseRequest(sim, sq),
      old = sq._macroMission,
      role = sq.commandRole || 'center';
    if (request)
      return issueMission(
        sim,
        sq,
        {
          intent: 'defend',
          action: 'defend',
          objectiveId: request.request.objectiveId,
          point: request.request.point,
          role: request.source === 'prepared-defense' ? 'garrison' : role,
          route: [],
          requestKey: request.key
        },
        reason
      );
    if (reason === 'reserve-commit') {
      role = 'center';
      finishMission(sim, sq, 'completed', reason);
      telemetry(sim, 'decision-reserve-commit', {
        faction: sq.faction,
        squad: sq.id,
        time: +(+sim.time || 0).toFixed(1),
        objectives: (sim.objectiveControl && sim.objectiveControl.counts) || {}
      });
    }
    if (role === 'reserve')
      return issueMission(
        sim,
        sq,
        {
          intent: 'reserve',
          action: 'hold',
          objectiveId: null,
          point: (sq.route || []).slice(-1)[0] || sq.home || sq.rally,
          role: role,
          route: []
        },
        reason
      );
    /* A reconstitution brief names the objective its rally point was chosen for (`plannedObjectiveId`,
       never `targetObjective`: a retreating squad must not be counted at an objective). */
    var previous = (old && (old.objectiveId || old.plannedObjectiveId)) || sq.targetObjective,
      assigned = previous && root.BattleObjectiveSystem && root.BattleObjectiveSystem.get(sim, previous),
      chosen = forcedObjective ? forcedCandidate(sim, sq, forcedObjective) : null;
    if (assigned && !forcedObjective && !stalled && reason !== 'mission-complete') {
      var status = D.objectiveStatus(sim, assigned) || {};
      if (status.owner !== sq.faction)
        chosen = { instance: assigned, point: D.objectivePoint(assigned, sim, sq), status: status };
    }
    /* Pass an `allowed` reachability map to chooseObjective for capture briefs, the same gate
       chooseMainEffort uses. Without this, a squad can be briefed to capture an objective it has
       no nav path to (walled off by buildings or terrain), and the brief persists until the 120s
       strategic-stall timer fires. Defend briefs (wantOwned=true) are not gated: a squad should
       still defend an owned objective even if the ingress path is questionable. Falls back to the
       unconstrained capture search if the reachable pool is empty, so a navigation module outage
       does not paralyze Force Command. */
    if (!chosen) {
      var allowed = reachableAttackMap(sim, sq, false);
      chosen = D.chooseObjective(sim, sq, false, stalled, allowed) ||
               D.chooseObjective(sim, sq, false, stalled) ||
               D.chooseObjective(sim, sq, true, stalled);
    }
    if (!chosen)
      return issueMission(
        sim,
        sq,
        { intent: 'hold', action: 'hold', objectiveId: null, point: D.avgPos(sq), role: role, route: [] },
        reason
      );
    var intent = chosen.status && chosen.status.owner === sq.faction ? 'defend' : 'capture';
    /* When the General is re-tasking a stale defender (strategic-stall-release or
       strategic-reset), force capture intent even on an owned objective. The squad was
       defending too long with no contact — it needs to move, not re-defend the same
       point. Without this, selectMission re-issues the same defend brief (same briefKey),
       issueMission dedup returns the old brief unchanged, and the squad never moves. */
    if ((reason === 'strategic-stall-release' || reason === 'strategic-reset') && intent === 'defend')
      intent = 'capture';
    /* Doctrine is decided once per brief, when it is issued - never re-evaluated per tick. The brief goes
       straight for the objective: walking the old approach route first cost captures (12-seed replay
       3.2 vs 3.8/battle) and on main a shadow writer had already abandoned it within the first minute. */
    var p = D.avgPos(sq),
      enemy = D.nearestEnemyToSquad(sim, sq),
      context = D.buildContext(sim, sq, chosen, enemy, p),
      rule = D.ruleFor(sim, sq.faction, context);
    /* selectMission is the one runtime writer of _lastDoctrineRule: it stamps the rule Force
       Command just decided for this brief. loop-watch (decisionSig), order-provenance and the
       session diagnostics export all read it; without this write they always see null and the
       loop detector's rule-churn signal is blind. commander-routes.js only clears it at setup. */
    sq._lastDoctrineRule = rule ? rule.id : null;
    var action = (rule && rule.action) || 'assault',
      axis = [];
    if (reason === 'strategic-stall-release' && action === 'hold') action = 'assault';
    var vacant = root.BattleVacantObjectiveAssault;
    if (
      vacant &&
      vacant.isVacantEnemyObjective(sim, sq, chosen.instance) &&
      enemy.distance >= vacant.immediateThreat
    )
      action = 'assault';
    if (action === 'defend' && forcedObjective) action = 'assault';
    else if (action === 'defend') {
      var defend = D.chooseObjective(sim, sq, true);
      if (defend) {
        chosen = defend;
        intent = 'defend';
      }
    }
    if (action === 'flank') axis.push(D.flankPoint(sq, chosen, town));
    if (rule)
      telemetry(sim, 'decision-doctrine', {
        faction: sq.faction,
        squad: sq.id,
        rule: rule.id,
        action: action,
        conditions: rule.when,
        objective: chosen.instance.id,
        localRatio: +context.localRatio.toFixed(2)
      });
    if (intent === 'defend') action = 'defend';
    return issueMission(
      sim,
      sq,
      {
        intent: intent,
        action: action,
        objectiveId: chosen.instance.id,
        point: chosen.point,
        role: role,
        route: axis
      },
      reason
    );
  }
  function reconsiderMission(sim, sq, town, reason, stalled, forcedObjective) {
    var before = sq._macroMission && sq._macroMission.objectiveId;
    recordMacroWake(sim, sq, reason);
    if (reason === 'mission-complete') finishMission(sim, sq, 'completed', reason);
    else if (reason === 'mission-invalid') finishMission(sim, sq, 'invalid', reason);
    selectMission(sim, sq, town, reason, stalled || null, forcedObjective || null);
    root.BattleSquadStability.acknowledgeRequest(sq);
    if (reason === 'strategic-stall') recordStallOutcome(sim, sq.faction, before, sq._macroMission);
  }
  function runReconcileStage(sim, faction, squads, town, stalled) {
    var affected = 0;
    for (var i = 0; i < squads.length; i++) {
      var sq = squads[i],
        living = D.aliveMembers(sq).length,
        m = sq._macroMission;
      if (!living || sq.state === 'retreat') continue;
      /* Objective-control stall is faction-wide. A squad that is still making
         measurable progress on its existing capture brief is not itself stalled;
         leave that valid brief alone instead of turning slower command adoption
         into a Macro replan/order-churn pulse. */
      if (
        stallEligible(sim, m) &&
        !makingMissionProgress(sim, faction, sq) &&
        !recentlyExecutingMission(sim, faction, sq)
      ) {
        reconsiderMission(sim, sq, town, 'strategic-stall', stalled);
        affected++;
        continue;
      }
      var repaired = false;
      if (m && !sq.commandRole && m.role) {
        sq.commandRole = m.role;
        repaired = true;
      }
      if (m && m.objectiveId && !sq.targetObjective) {
        sq.targetObjective = m.objectiveId;
        repaired = true;
      }
      if (repaired) {
        recordMacroWake(sim, sq, 'strategic-stall-reconcile');
        affected++;
      }
      if (
        (!m || (!m.objectiveId && m.intent !== 'reserve')) &&
        sq.commandRole !== 'reserve' &&
        !sq.targetObjective
      ) {
        reconsiderMission(sim, sq, town, 'strategic-stall-reconcile', stalled);
        affected++;
      }
    }
    return affected;
  }
  function staleHoldOrSupport(sim, sq) {
    var m = sq && sq._macroMission;
    if (!m || m.intent === 'defend' || m.intent === 'reserve') return false;
    return m.action === 'hold' || m.role === 'support' || sq.commandRole === 'support';
  }
  function runReleaseStage(sim, faction, squads, town, stalled, info) {
    var affected = 0;
    for (var i = 0; i < squads.length; i++) {
      var sq = squads[i],
        m = sq._macroMission;
      if (!D.aliveMembers(sq).length || sq.state === 'retreat' || usefulDefender(sim, sq)) continue;
      var targetless =
          sq.commandRole !== 'reserve' &&
          !(m && m.intent === 'reserve') &&
          !sq.targetObjective,
        stale = staleHoldOrSupport(sim, sq);
      if (!targetless && !stale) continue;
      if (stale && (sq.commandRole === 'support' || (m && m.role === 'support'))) sq.commandRole = 'center';
      reconsiderMission(sim, sq, town, 'strategic-stall-release', stalled);
      affected++;
    }
    return affected;
  }
  function runMainEffortStage(sim, faction, squads, town, stalled) {
    var plan = chooseMainEffort(sim, squads, stalled);
    if (!plan || !plan.instance) return { affected: 0, mainEffort: null };
    var objective = plan.instance,
      reachable = plan.active.filter(function (sq) {
        return objectiveReachable(sim, sq, objective);
      });
    reachable.sort(function (a, b) {
      var at = String(a.targetObjective || '') === String(objective.id) ? 0 : 1,
        bt = String(b.targetObjective || '') === String(objective.id) ? 0 : 1,
        ap = D.avgPos(a),
        bp = D.avgPos(b),
        p = D.objectivePoint(objective, sim, a),
        q = D.objectivePoint(objective, sim, b),
        ad = ap && p ? D.dist(ap.x, ap.z, p.x, p.z) : Infinity,
        bd = bp && q ? D.dist(bp.x, bp.z, q.x, q.z) : Infinity;
      return at - bt || ad - bd || String(a.id).localeCompare(String(b.id));
    });
    var wanted = Math.max(
        1,
        Math.max(
          Math.min(STRATEGIC_STALL_RECOVERY.mainEffortMin, reachable.length),
          Math.ceil(plan.active.length * STRATEGIC_STALL_RECOVERY.mainEffortFraction)
        )
      ),
      count = Math.min(reachable.length, wanted),
      affected = 0;
    for (var i = 0; i < count; i++) {
      reconsiderMission(sim, reachable[i], town, 'strategic-main-effort', stalled, objective);
      affected++;
    }
    return { affected: affected, mainEffort: String(objective.id) };
  }
  function runResetStage(sim, faction, squads, town, stalled) {
    var affected = 0,
      resetStalled = Object.assign({}, stalled || {}),
      candidates = [];
    for (var i = 0; i < squads.length; i++) {
      var sq = squads[i],
        m = sq._macroMission;
      if (!D.aliveMembers(sq).length || sq.state === 'retreat') continue;
      if (usefulDefender(sim, sq) || makingMissionProgress(sim, faction, sq)) continue;
      if (m && (m.intent === 'reserve' || m.intent === 'reconstitute')) continue;
      candidates.push(sq);
      if (m && m.objectiveId) resetStalled[m.objectiveId] = true;
    }
    for (i = 0; i < candidates.length; i++) {
      reconsiderMission(sim, candidates[i], town, 'strategic-reset', resetStalled);
      affected++;
    }
    return affected;
  }
  function runStrategicRecovery(sim, faction, squads, town) {
    var info = strategicStallInfo(sim, faction),
      recovery = trackMissionProgress(sim, faction, squads),
      crossed = [],
      stalled = stalledEfforts(sim, squads),
      detail = null;
    for (var i = 0; i < STRATEGIC_STALL_STAGES.length; i++)
      if (STRATEGIC_STALL_STAGES[i].level > recovery.completed && info.age >= STRATEGIC_STALL_STAGES[i].at)
        crossed.push(STRATEGIC_STALL_STAGES[i]);
    for (i = 0; i < crossed.length; i++) {
      var stage = crossed[i];
      if (stage.name === 'reconcile')
        detail = { affected: runReconcileStage(sim, faction, squads, town, stalled) };
      else if (stage.name === 'release')
        detail = { affected: runReleaseStage(sim, faction, squads, town, stalled, info) };
      else if (stage.name === 'main-effort')
        detail = runMainEffortStage(sim, faction, squads, town, stalled);
      else detail = { affected: runResetStage(sim, faction, squads, town, stalled) };
      recordRecoveryStage(sim, faction, stage, info, detail);
    }
    return crossed.length > 0;
  }

  /* Did a strategic-stall wake change the effort? `repeats` re-picked the stalled objective. */
  function recordStallOutcome(sim, faction, before, m) {
    var st = missionState(sim),
      out = st.stallOutcomes || (st.stallOutcomes = { wakes: 0, repeats: 0, switches: 0, other: 0 }),
      general = generalFor(sim, faction),
      own =
        general.stallOutcomes ||
        (general.stallOutcomes = { wakes: 0, repeats: 0, switches: 0, other: 0 }),
      after = m && m.objectiveId;
    [out, own].forEach(function (row) {
      row.wakes++;
      if (after && after === before) row.repeats++;
      else if (after && m.intent === 'capture') row.switches++;
      else row.other++;
    });
  }
    return {
      runStrategicRecovery: runStrategicRecovery,
      reconsiderMission: reconsiderMission,
      wakeReason: wakeReason
    };
  };

  /* Install into the parent now; commander-ai.js must already be loaded. */
  if (!root._commanderRecoveryCtx || !root._commanderRecoveryAttach)
    throw new Error('[strategic-recovery] commander-ai.js must load before battle/modules/22a-commander-strategic-recovery.js');
  root._commanderRecoveryAttach(root._commanderStrategicRecovery(root._commanderRecoveryCtx()));
})(typeof window !== 'undefined' ? window : globalThis);
