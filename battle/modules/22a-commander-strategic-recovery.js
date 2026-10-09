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

   Recovery validity and lifecycle (the strategic-freeze fix): the wake ledger
   (recordWakeOutcome/adoptionPending) records what each strategic wake actually produced - a
   materially new brief, or the deduped old one (an ineffective decision) - and a later stage
   holds while a brief the previous stage published is still inside the adoption window and
   unaccepted, instead of superseding an in-flight adoption. Exhausting the one-shot ladder no
   longer ends strategic review: runReviewPass re-runs the reset population every
   STRATEGIC_STALL_REPLAN of continued stall (deterministic, the General's own replan clock),
   a strategic reset that re-derives the carried brief varies the approach axis instead of
   deduping into a no-op, and legitimate static defense (useful defenders, measurable-progress
   pulses) stays out of the population entirely.

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
        state.passes = 0;
        state.wakes = {};
        state.lastReviewAt = null;
      }
      /* State bags written before these fields existed (and the fixtures of some harness checks)
       still get the review lifecycle, never a silent undefined. */
      if (state.passes == null) state.passes = 0;
      if (!state.wakes) state.wakes = {};
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
            if (isFinite(step) && step < 60)
              rec.travelSinceExecution = (+rec.travelSinceExecution || 0) + step;
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
    /* Outcome of the last strategic-family wake per squad, kept in the recovery state: the brief
     the wake produced (or the one issueMission's dedup left in place - the same object reference).
     This is the machine's own validity signal, read by the stage machine before it escalates:
     a wake whose re-decision deduped produced nothing new (an ineffective recovery decision), and
     a brief still `issued` after the adoption window is a propagation/adoption miss, never
     evidence the plan itself was adopted and failed. It stays inside the General's state; the
     behavior-neutral chain observer in module 40 classifies the same wakes independently. */
    function recordWakeOutcome(sim, sq, reason, previous, m) {
      if (!sq || String(reason || '').indexOf('strategic-') !== 0) return;
      var recovery = stallRecoveryState(sim, sq.faction);
      recovery.wakes[String(sq.id)] = {
        squad: sq,
        reason: reason,
        version: m ? m.version : null,
        issued: !!m && m !== previous,
        at: +sim.time || 0
      };
    }
    /* A brief the previous stage published moments ago and the Squad Leader has not accepted yet:
     the next stage must not march over it. Holds the stage (it stays pending - the stall age only
     grows) until the brief is accepted or the adoption window elapses; after that the ladder
     proceeds and the wake ledger/observer record the miss. Bounded by one window per stage. */
    function adoptionPending(sim, recovery) {
      var now = +sim.time || 0,
        ids = Object.keys(recovery.wakes);
      for (var i = 0; i < ids.length; i++) {
        var entry = recovery.wakes[ids[i]],
          sq = entry && entry.squad,
          m = sq && sq._macroMission;
        if (!m || m.version !== entry.version) continue;
        if (m.status !== 'issued') continue;
        var age = now - (+entry.at || 0);
        if (age < STRATEGIC_STALL_RECOVERY.progressWindow) return { squad: sq.id, age: +age.toFixed(1) };
      }
      return null;
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
        lastProgress =
          summary && summary.lastObjectiveProgressAt && summary.lastObjectiveProgressAt[sq.faction],
        now = +sim.time || 0;
      if (lastProgress != null && isFinite(+lastProgress) && now - lastProgress > 180 && !sq.inContact)
        return false;
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
        return ids.length
          ? { id: ids[0], instance: choices[ids[0]], votes: votes[ids[0]], active: active }
          : null;
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
          /* Reconsiderations ATTEMPTED by this stage, including ones deduped into the same brief; `issued` (review
             passes) counts the materially new briefs. Neither says a squad moved. */
          affected: (detail && detail.affected) || 0,
          mainEffort: (detail && detail.mainEffort) || null,
          time: +(+sim.time || 0).toFixed(2)
        };
      /* A stage or review pass can attach its own counters (a review pass carries its number and
       how many of its wakes issued a materially new brief vs deduped into ineffective ones). */
      if (detail)
        Object.keys(detail).forEach(function (key) {
          if (event[key] === undefined) event[key] = detail[key];
        });
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
      /* The rebuilt squad is still retreating until its men rally (rally recovery, module 15k).
         Waking the General now would issue the fresh brief into a retreating squad that the guard
         below kills one tick later. The completed/reconstituted mission is terminal and survives
         the wait untouched, so the same wake fires on its own once the squad is back under command. */
      if (
        living &&
        sq.state !== 'retreat' &&
        m &&
        m.status === 'completed' &&
        m.endReason === 'reconstituted'
      )
        return 'squad-reconstituted';
      if (sq.state === 'retreat' || !living) {
        var assembling = sq.state === 'retreat' && sq._reconGroup && m && m.intent === 'reconstitute';
        if (m && !assembling)
          finishMission(sim, sq, 'failed', sq.state === 'retreat' ? 'squad-retreat' : 'squad-destroyed');
        return null;
      }
      if (!m) return 'initial-mission';
      if (m.status === 'failed' || m.status === 'invalid' || m.status === 'completed')
        return 'mission-resume';
      /* A defense request is new information only when it changes the task: a squad already defending that
       objective keeps its brief while pressure comes and goes; releasing a request-bound brief is reassessed. */
      var request = defenseRequest(sim, sq);
      if (
        request ? !(m.intent === 'defend' && m.objectiveId === request.request.objectiveId) : !!m.requestKey
      )
        return 'request-changed';
      var escalation = sq._macroMissionRequest;
      if (escalation && escalation.missionVersion === m.version)
        return escalation.reason || 'captain-request';
      if (m.intent === 'reserve') return reserveDue(sim, sq) ? 'reserve-commit' : null;
      if (!m.objectiveId)
        return catalogKey(sim) !== (sq._macroMissionObservation || {}).catalog
          ? 'objective-opportunity'
          : null;
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
        chosen =
          D.chooseObjective(sim, sq, false, stalled, allowed) ||
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
      var spec = {
        intent: intent,
        action: action,
        objectiveId: chosen.instance.id,
        point: chosen.point,
        role: role,
        route: axis
      };
      /* A strategic reset that keeps the squad on the objective its failing brief already names
       must not re-derive that same brief: issueMission's dedup would leave the failing plan
       exactly in place (the no-new-brief lock, where the recovery exhausts itself on wakes that
       changed nothing). Keep the objective - with every other effort stalled it may still be the
       strategically correct one - but vary the approach: route the same effort through its flank
       point, a materially new plan Command Reception can accept and the Squad Leader executes as
       fresh legs. The rule is stable, not cumulative: the flank point is a deterministic function
       of squad and objective, so a squad that has not moved re-derives the identical key and the
       next reset dedups into a recorded ineffective wake instead of churning; only a changed
       world (the squad moved, the objective state flipped, another effort opened) produces a new
       brief. Resets that switch objectives are untouched. */
      if (
        reason === 'strategic-reset' &&
        !axis.length &&
        old &&
        old.objectiveId === chosen.instance.id &&
        (old.status === 'issued' || old.status === 'executing')
      ) {
        var flank = D.flankPoint(sq, chosen, town);
        if (flank && isFinite(+flank.x) && isFinite(+flank.z))
          spec.route = [{ x: +flank.x || 0, z: +flank.z || 0 }];
      }
      return issueMission(sim, sq, spec, reason);
    }
    function reconsiderMission(sim, sq, town, reason, stalled, forcedObjective) {
      var before = sq._macroMission && sq._macroMission.objectiveId,
        previous = sq._macroMission;
      /* The Squad Leader reports that most of its men are physically blocked on this brief. The General
       answers through the same re-selection every other wake uses, with the brief's objective carrying
       the stalled-effort cost so a better-placed objective can win; if none does, the brief dedups and
       the wake is recorded as ineffective like any other. Not a timer, and it fires once per brief. */
      if (reason === 'execution-blocked' && !stalled && before) {
        stalled = {};
        stalled[before] = true;
      }
      recordMacroWake(sim, sq, reason);
      if (reason === 'mission-complete') finishMission(sim, sq, 'completed', reason);
      else if (reason === 'mission-invalid') finishMission(sim, sq, 'invalid', reason);
      selectMission(sim, sq, town, reason, stalled || null, forcedObjective || null);
      root.BattleSquadStability.acknowledgeRequest(sq);
      recordWakeOutcome(sim, sq, reason, previous, sq._macroMission);
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
            sq.commandRole !== 'reserve' && !(m && m.intent === 'reserve') && !sq.targetObjective,
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
    /* A review pass is the General re-running the full reconsider (the reset population) once the
     one-shot ladder is exhausted and the no-progress condition that opened it still holds. The
     ladder is keyed to the episode (the last objective progress); a stalled side by definition
     makes none, so without these passes a front that recovered nothing would never be reviewed
     again - the strategic freeze. The cadence is the General's own replan clock
     (STRATEGIC_STALL_REPLAN), never a new timer. Legitimate static defense stays put: the reset
     population excludes useful defenders and squads making measurable mission progress, and a
     review that re-derives the identical brief is deduped into a recorded ineffective wake, so a
     static world produces no churn - only when something changed (position, objective state, a
     different flank point) does the re-decision issue a materially new brief. */
    function runReviewPass(sim, faction, squads, town, info) {
      var recovery = stallRecoveryState(sim, faction),
        since = recovery.lastReviewAt,
        started = +sim.time || 0,
        stalled = stalledEfforts(sim, squads),
        affected = runResetStage(sim, faction, squads, town, stalled),
        issued = 0,
        ineffective = 0,
        live = {};
      Object.keys(recovery.wakes).forEach(function (id) {
        var entry = recovery.wakes[id];
        if (!entry || !entry.squad || !D.aliveMembers(entry.squad).length) {
          delete recovery.wakes[id];
          return;
        }
        live[id] = true;
        if (since == null || +entry.at > +since) {
          if (entry.issued) issued++;
          else ineffective++;
        }
      });
      Object.keys(recovery.wakes).forEach(function (id) {
        if (!live[id]) delete recovery.wakes[id];
      });
      recovery.passes++;
      recovery.lastReviewAt = started;
      recordRecoveryStage(
        sim,
        faction,
        {
          name: 'review',
          level: STRATEGIC_STALL_STAGES[STRATEGIC_STALL_STAGES.length - 1].level,
          at: STRATEGIC_STALL_RECOVERY.reset + STRATEGIC_STALL_REPLAN * recovery.passes
        },
        info,
        { affected: affected, pass: recovery.passes, issued: issued, ineffective: ineffective }
      );
      return true;
    }
    /* Experimental squad-local recovery. The strategic ladder's episode is faction-wide;
       friendly progress can correctly reset it even while another accepted capture brief
       has not moved. Track that capture's *physical* pulses by mission version independently,
       and review it on the existing 120 s replan cadence. Off by default until paired battles
       establish useful outcomes and no garrison/contact churn (?localMissionWake=1). */
    var LOCAL_MISSION_WAKE_ON = /[?&]localMissionWake=(?:1|on|true)(?:&|#|$)/i.test(
      typeof location !== 'undefined' ? location.search || '' : ''
    );
    function reviewLocalCaptureStalls(sim, faction, squads, town, info) {
      if (!LOCAL_MISSION_WAKE_ON || info.age >= STRATEGIC_STALL_REPLAN) return 0;
      var general = generalFor(sim, faction),
        records = general.localMissionReview || (general.localMissionReview = {}),
        now = +sim.time || 0,
        live = {},
        count = 0;
      for (var i = 0; i < squads.length; i++) {
        var sq = squads[i],
          m = sq && sq._macroMission,
          members = sq && D.aliveMembers(sq),
          id = sq && String(sq.id);
        if (!sq || !members.length || sq.state === 'retreat' || !m ||
            m.intent !== 'capture' || m.status !== 'executing' || !m.point) continue;
        live[id] = true;
        var p = D.avgPos(sq),
          distance = missionDistance(sim, sq, m, p),
          rec = records[id];
        if (!p || !isFinite(distance)) continue;
        if (!rec || rec.version !== m.version) {
          rec = records[id] = {
            version: m.version, position: { x: p.x, z: p.z },
            distance: distance, motion: 0, lastPhysicalAt: now, lastWakeAt: null
          };
          continue;
        }
        var step = D.dist(p.x, p.z, rec.position.x, rec.position.z);
        rec.position = { x: p.x, z: p.z };
        if (isFinite(step) && step < 60) rec.motion += step;
        if (rec.motion >= STRATEGIC_STALL_RECOVERY.progressDistance ||
            rec.distance - distance >= STRATEGIC_STALL_RECOVERY.progressDistance) {
          rec.motion = 0;
          rec.distance = distance;
          rec.lastPhysicalAt = now;
        }
        /* A firefight, active recon, prepared hold, or near-objective capture is not
           evidence of a blocked attack. Leave those to their existing lifecycle owners. */
        if (sq.inContact || sq._reconTask || sq._preparedDefenseRequest ||
            sq._captureZoneDefenseRequest || distance <= 30) {
          rec.lastPhysicalAt = now;
          continue;
        }
        if (now - rec.lastPhysicalAt < STRATEGIC_STALL_REPLAN ||
            now - (+m.issuedAt || 0) < STRATEGIC_STALL_REPLAN ||
            (rec.lastWakeAt != null && now - rec.lastWakeAt < STRATEGIC_STALL_REPLAN))
          continue;
        rec.lastWakeAt = now;
        telemetry(sim, 'decision-local-mission-stall', {
          faction: faction, squad: sq.id, missionVersion: m.version,
          objectiveId: m.objectiveId, distance: +distance.toFixed(1),
          noPhysicalProgressSeconds: +(now - rec.lastPhysicalAt).toFixed(1)
        });
        var stalled = {};
        if (m.objectiveId) stalled[m.objectiveId] = true;
        reconsiderMission(sim, sq, town, 'strategic-local-stall', stalled);
        count++;
      }
      Object.keys(records).forEach(function (id) {
        if (!live[id]) delete records[id];
      });
      return count;
    }

    function runStrategicRecovery(sim, faction, squads, town) {
      var info = strategicStallInfo(sim, faction),
        recovery = trackMissionProgress(sim, faction, squads),
        crossed = [],
        stalled = stalledEfforts(sim, squads),
        detail = null,
        ran = 0,
        general = generalFor(sim, faction),
        i;
      for (i = 0; i < STRATEGIC_STALL_STAGES.length; i++)
        if (STRATEGIC_STALL_STAGES[i].level > recovery.completed && info.age >= STRATEGIC_STALL_STAGES[i].at)
          crossed.push(STRATEGIC_STALL_STAGES[i]);
      for (i = 0; i < crossed.length; i++) {
        var stage = crossed[i];
        /* Before a stage escalates over the previous stage's work: a brief that stage published
         inside the adoption window and Command Reception has not accepted yet is an in-flight
         adoption, not a failed plan - re-tasking now just supersedes the brief before it could
         propagate. Hold the stage pending (the loop breaks with `completed` unchanged, so it
         re-crosses on the next tick) until the brief is accepted or the window elapses; after
         that the ladder proceeds and the wake ledger records the propagation miss. */
        if (stage.level >= 2) {
          var pending = adoptionPending(sim, recovery);
          if (pending) {
            general.lastAdoptionHold = {
              stage: stage.name,
              squad: pending.squad,
              briefAge: pending.age,
              at: +(+sim.time || 0).toFixed(2)
            };
            break;
          }
        }
        if (stage.name === 'reconcile')
          detail = { affected: runReconcileStage(sim, faction, squads, town, stalled) };
        else if (stage.name === 'release')
          detail = { affected: runReleaseStage(sim, faction, squads, town, stalled, info) };
        else if (stage.name === 'main-effort')
          detail = runMainEffortStage(sim, faction, squads, town, stalled);
        else {
          detail = { affected: runResetStage(sim, faction, squads, town, stalled) };
          recovery.lastReviewAt = +sim.time || 0;
        }
        recordRecoveryStage(sim, faction, stage, info, detail);
        ran++;
      }
      /* Review passes (see runReviewPass): only when no ladder stage ran or was held this tick, so
       a pass never stacks on top of a stage in the same commander tick. */
      var reviewed =
        !crossed.length &&
        recovery.completed >= STRATEGIC_STALL_STAGES[STRATEGIC_STALL_STAGES.length - 1].level &&
        info.age >= STRATEGIC_STALL_RECOVERY.reset + STRATEGIC_STALL_REPLAN * (recovery.passes + 1) &&
        runReviewPass(sim, faction, squads, town, info);
      /* A local CAPTURE review is independent of healthy sibling squads' faction clock.
         It uses the same General cadence and mission issuer; no soldier movement writer. */
      var localReviews = reviewLocalCaptureStalls(sim, faction, squads, town, info);
      /* A stage held for in-flight adoption did nothing this tick. */
      return ran > 0 || reviewed || localReviews > 0;
    }

    /* Did a strategic-stall wake change the effort? `repeats` re-picked the stalled objective. */
    function recordStallOutcome(sim, faction, before, m) {
      var st = missionState(sim),
        out = st.stallOutcomes || (st.stallOutcomes = { wakes: 0, repeats: 0, switches: 0, other: 0 }),
        general = generalFor(sim, faction),
        own =
          general.stallOutcomes || (general.stallOutcomes = { wakes: 0, repeats: 0, switches: 0, other: 0 }),
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
    throw new Error(
      '[strategic-recovery] commander-ai.js must load before battle/modules/22a-commander-strategic-recovery.js'
    );
  root._commanderRecoveryAttach(root._commanderStrategicRecovery(root._commanderRecoveryCtx()));
})(typeof window !== 'undefined' ? window : globalThis);
