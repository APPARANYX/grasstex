/* Hierarchical tactical coordinator for the Battle Sim / ww2fps AI lab.

   M3C Macro / General. This file owns one thing per squad: the mission brief (`_macroMission`),
   plus the commander tick, victory conditions and lifecycle wiring.

     commander-doctrine.js  what is worth doing, with what force  (genome, objective scores)
     commander-routes.js    who goes where                        (roles, approach routes)
     commander-ai.js        which mission each squad holds        (event-driven wakes, victory)
     modules/16-squad-...   how the Squad Leader executes that mission (legs, phase, regroup)
     engagement.js          how a soldier fights                  (contact drills)

   The General is event-driven: it issues a brief, then sleeps until the mission completes, becomes
   invalid, a reserve is due, a strategic stall occurs or the Squad Leader escalates. It never writes a
   phase, route leg, squad objective point or soldier destination. */
(function (root) {
  'use strict';
  /* The build id belongs to the page, not to a runtime: stamping one here overwrote it. */
  console.log('[COMMAND] Genome v2 commander loaded');
  if (!root.BattleSim || !root.SquadAI || !root.BattleCommanderDoctrine || !root.BattleCommanderRoutes) {
    console.warn('[COMMAND] doctrine/route modules missing; hierarchical AI disabled');
    return;
  }

  var D = root.BattleCommanderDoctrine,
    R = root.BattleCommanderRoutes;
  var oldStart = root.BattleSim.start;
  var COMMAND_TICK = 0.45,
    OBJECTIVE_HOLD_WIN = 35,
    STRATEGIC_STALL_REPLAN = 120,
    STRATEGIC_STALL_RECOVERY = {
      reconcile: 120,
      release: 180,
      mainEffort: 240,
      reset: 300,
      progressWindow: 60,
      progressDistance: 6,
      mainEffortFraction: 0.6,
      mainEffortMin: 2
    };
  var STRATEGIC_STALL_STAGES = [
    { level: 1, name: 'reconcile', at: STRATEGIC_STALL_RECOVERY.reconcile },
    { level: 2, name: 'release', at: STRATEGIC_STALL_RECOVERY.release },
    { level: 3, name: 'main-effort', at: STRATEGIC_STALL_RECOVERY.mainEffort },
    { level: 4, name: 'reset', at: STRATEGIC_STALL_RECOVERY.reset }
  ];

  var enemyFaction = D.enemyFaction;
  var policy = D.policyFor,
    doctrine = D.doctrineFor,
    genome = D.genomeFor;

  function telemetry(sim, type, data) {
    if (root.BattleTelemetry) root.BattleTelemetry.record(type, data, sim);
  }
  function declare(sim, winner, reason) {
    if (sim.winner) return;
    sim.winner = winner;
    sim.winReason = reason;
    telemetry(sim, 'objective-victory', { winner: winner, reason: reason });
    console.log('[COMMAND] objective victory ' + winner + ' reason=' + reason);
    if (sim.onWinner) sim.onWinner(winner, sim);
  }
  function macroEnabled(sim) {
    return !sim || sim.macroCommandEnabled !== false;
  }
  function setMacroEnabled(sim, enabled) {
    if (!sim) return false;
    var next = enabled !== false,
      prev = macroEnabled(sim);
    sim.macroCommandEnabled = next;
    if (prev !== next)
      telemetry(sim, 'decision-macro-command', { enabled: next, time: +(+sim.time || 0).toFixed(2) });
    return next;
  }

  /* General owns this brief; Squad Leader owns its execution. Compatibility fields are projections:
     targetObjective / commandRole belong to General, objective / phase / routeIndex to Squad Leader.
     No periodic doctrine evaluation, local pause or route waypoint is a new mission. */
  function point(p) {
    return p ? { x: +p.x || 0, z: +p.z || 0 } : null;
  }
  function newGeneralState(faction) {
    return {
      faction: faction,
      wakeCount: 0,
      strategicWrites: 0,
      decisionsUnchanged: 0,
      wakeReasons: {},
      lastWake: null,
      recentWakes: [],
      lastStall: null,
      stallRecovery: { episode: null, completed: 0, mainEffort: null, history: [], progress: {} },
      reconstitution: null
    };
  }
  /* Two per-battle General singletons. They share code, never state. BattleCommanderAI is only the
     scheduler/facade; each General gets its own state and only own-side reported hostile intel. */
  function generals(sim) {
    return sim._generals || (sim._generals = { us: newGeneralState('us'), ge: newGeneralState('ge') });
  }
  function generalFor(sim, faction) {
    var all = generals(sim);
    return all[faction] || (all[faction] = newGeneralState(faction));
  }
  /* Aggregate compatibility/diagnostic view. Decisions never read these cross-side totals. */
  function missionState(sim) {
    var st =
        sim._macroMissionState ||
        (sim._macroMissionState = {
          mode: 'event-driven',
          wakeCount: 0,
          strategicWrites: 0,
          decisionsUnchanged: 0,
          wakeReasons: {},
          lastWake: null,
          recentWakes: [],
          stallByFaction: { us: null, ge: null },
          stallOutcomes: { wakes: 0, repeats: 0, switches: 0, other: 0 }
        }),
      g = generals(sim);
    st.generals = g;
    st.stallRecovery = { us: g.us.stallRecovery, ge: g.ge.stallRecovery };
    /* Compatibility/diagnostic roll-up only. Runtime reconstitution decisions use the faction-local
       General state above; this aggregate never feeds either General. */
    var ur = g.us.reconstitution,
      gr = g.ge.reconstitution,
      rows = [ur, gr].filter(Boolean);
    st.reconstitution = rows.length
      ? {
          groupsFormed: rows.reduce(function (n, r) { return n + (+r.groupsFormed || 0); }, 0),
          groupsDissolved: rows.reduce(function (n, r) { return n + (+r.groupsDissolved || 0); }, 0),
          merges: rows.reduce(function (n, r) { return n + (+r.merges || 0); }, 0),
          promotions: rows.reduce(function (n, r) { return n + (+r.promotions || 0); }, 0),
          active: rows.reduce(function (a, r) { return a.concat(r.active || []); }, []),
          ended: rows.reduce(function (a, r) { return a.concat(r.ended || []); }, [])
        }
      : null;
    return st;
  }
  function catalogKey(sim) {
    return (sim._objectives || [])
      .map(function (o) {
        return String(o.id);
      })
      .sort()
      .join('|');
  }
  function defenseRequest(sim, sq) {
    var r = sq._preparedDefenseRequest,
      source = 'prepared-defense';
    if (!r) {
      r = sq._captureZoneDefenseRequest;
      source = 'objective-security';
    }
    if (
      !r ||
      !r.objectiveId ||
      !r.point ||
      !root.BattleObjectiveSystem ||
      !root.BattleObjectiveSystem.get(sim, r.objectiveId)
    )
      return null;
    return {
      request: r,
      source: source,
      key: [source, r.objectiveId, +r.point.x || 0, +r.point.z || 0].join('|')
    };
  }
  function missionObservation(sim, sq, m) {
    var obj =
        m.objectiveId && root.BattleObjectiveSystem && root.BattleObjectiveSystem.get(sim, m.objectiveId),
      st = (obj && D.objectiveStatus(sim, obj)) || {};
    return {
      version: m.version,
      owner: st.owner || 'neutral',
      vacant: !!st.vacantOwner,
      catalog: catalogKey(sim)
    };
  }
  /* Brief lifecycle. Macro is the sole writer, including acceptance requested by the Squad
     Leader. Evaluated on event-driven wakes inside the 0.45 s commander tick; assembly acceptance
     is requested from the 0.15 s squad tick. Terminal records never reopen: issue creates a new
     brief. Re-accepting an executing assembly brief deliberately refreshes acceptedAt. */
  var MISSION_STATES = {
    issued: {
      meaning: 'The General has published a new brief',
      enteredBy: 'Macro issueMission only',
      exits: 'Squad Leader acceptance, completion, invalidation, failure or replacement',
      rate: 'event-driven; commander 0.45 s, assembly 0.15 s',
      next: ['executing', 'completed', 'invalid', 'failed', 'superseded']
    },
    executing: {
      meaning: 'The Squad Leader has accepted the brief',
      enteredBy: 'Squad Leader acceptance request to Macro',
      exits: 'completion, invalidation, failure or replacement; assembly may re-accept',
      rate: 'event-driven; commander 0.45 s, assembly 0.15 s',
      next: ['executing', 'completed', 'invalid', 'failed', 'superseded']
    },
    completed: {
      meaning: 'Objective fulfilled, reserve committed or reconstitution finished',
      enteredBy: 'Macro mission wake or reconstitution',
      exits: 'none; the next issue creates a different brief',
      rate: 'terminal',
      next: []
    },
    invalid: {
      meaning: 'The objective no longer exists',
      enteredBy: 'Macro mission-invalid wake',
      exits: 'none; the next issue creates a different brief',
      rate: 'terminal',
      next: []
    },
    failed: {
      meaning: 'Squad retreated, was destroyed or lost its reconstitution group',
      enteredBy: 'Macro retreat/destruction/group lifecycle',
      exits: 'none; the next issue creates a different brief',
      rate: 'terminal',
      next: []
    },
    superseded: {
      meaning: 'A changed brief replaced this one',
      enteredBy: 'Macro issueMission',
      exits: 'none; the next issue creates a different brief',
      rate: 'terminal',
      next: []
    }
  };
  function transitionMission(sim, sq, next, reason, assembly) {
    var m = sq._macroMission;
    if (!m) return;
    var from = m.status,
      rule = MISSION_STATES[from];
    if (!MISSION_STATES[next]) throw new Error('Unknown Macro mission state: ' + next);
    if (rule && !rule.next.length) return;
    if (from == null ? next !== 'issued' : !rule || rule.next.indexOf(next) < 0)
      throw new Error('Illegal Macro mission transition: ' + from + ' -> ' + next);
    m.status = next;
    m.transition = { from: from || null, to: next, at: +sim.time || 0, reason: reason };
    if (next === 'issued') {
      m.issuedAt = +sim.time || 0;
      m.acceptedAt = null;
    } else if (next === 'executing') {
      m.acceptedAt = sim.time;
      telemetry(sim, 'decision-mission-accepted', {
        faction: sq.faction,
        squad: sq.id,
        version: m.version,
        intent: m.intent,
        action: m.action,
        objectiveId: assembly ? null : m.objectiveId
      });
    } else {
      m.endedAt = +sim.time || 0;
      m.endReason = reason;
      sq._lastMacroMission = m;
      telemetry(sim, 'decision-mission-end', {
        faction: sq.faction,
        squad: sq.id,
        version: m.version,
        status: next,
        reason: reason,
        objectiveId: m.objectiveId
      });
    }
  }
  function acceptMission(sim, sq, assembly) {
    var m = sq._macroMission;
    if (!m || (m.status !== 'issued' && !(assembly && m.status === 'executing'))) return;
    transitionMission(
      sim,
      sq,
      'executing',
      assembly ? 'assembly accepted' : 'Squad Leader accepted',
      assembly
    );
  }
  function finishMission(sim, sq, status, reason) {
    transitionMission(sim, sq, status, reason);
  }
  function briefKey(spec) {
    return JSON.stringify([
      spec.intent,
      spec.action,
      spec.objectiveId,
      spec.point,
      spec.role,
      spec.route,
      spec.requestKey,
      spec.plannedObjectiveId
    ]);
  }
  function issueMission(sim, sq, spec, reason) {
    var old = sq._macroMission,
      key = briefKey(spec),
      stats = missionState(sim),
      general = generalFor(sim, sq.faction);
    if (old && old.key === key && (old.status === 'issued' || old.status === 'executing')) {
      stats.decisionsUnchanged++;
      general.decisionsUnchanged++;
      sq._macroMissionObservation = missionObservation(sim, sq, old);
      return old;
    }
    finishMission(sim, sq, 'superseded', reason);
    var m = {
      version: (old ? old.version : 0) + 1,
      owner: 'force-command',
      intent: spec.intent,
      action: spec.action,
      objectiveId: spec.objectiveId || null,
      point: point(spec.point),
      route: (spec.route || []).map(point),
      role: spec.role,
      requestKey: spec.requestKey || null,
      plannedObjectiveId: spec.plannedObjectiveId || null,
      reason: reason,
      key: key
    };
    sq._macroMission = m;
    transitionMission(sim, sq, 'issued', reason);
    sq._macroMissionObservation = missionObservation(sim, sq, m);
    sq.targetObjective = m.objectiveId;
    sq.commandRole = m.role;
    stats.strategicWrites++;
    general.strategicWrites++;
    telemetry(sim, 'decision-mission-issued', {
      faction: sq.faction,
      squad: sq.id,
      version: m.version,
      intent: m.intent,
      objectiveId: m.objectiveId,
      reason: reason
    });
    return m;
  }
  function recordMacroWake(sim, sq, reason) {
    var stats = missionState(sim),
      general = generalFor(sim, sq.faction),
      event = {
        faction: sq.faction,
        squad: sq.id,
        reason: reason,
        target: (sq._macroMission && sq._macroMission.objectiveId) || null,
        time: +(+sim.time || 0).toFixed(2)
      };
    stats.wakeCount++;
    stats.wakeReasons[reason] = (stats.wakeReasons[reason] || 0) + 1;
    stats.lastWake = event;
    stats.recentWakes.push(event);
    if (stats.recentWakes.length > 60) stats.recentWakes.shift();
    general.wakeCount++;
    general.wakeReasons[reason] = (general.wakeReasons[reason] || 0) + 1;
    general.lastWake = event;
    general.recentWakes.push(event);
    if (general.recentWakes.length > 40) general.recentWakes.shift();
    telemetry(sim, 'decision-macro-replan', event);
  }
  function reserveDue(sim, sq) {
    var cfg = policy(sim, sq.faction),
      doc = doctrine(sim, sq.faction),
      counts = (sim.objectiveControl && sim.objectiveControl.counts) || {};
    return (
      sim.time > 45 * (1 - doc.riskTolerance) ||
      (counts[enemyFaction(sq.faction)] || 0) > (counts[sq.faction] || 0) ||
      D.nearestEnemyToSquad(sim, sq).distance < cfg.contactDistance * 1.5
    );
  }
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
    var health = root.BattleAICoordinationHealth && root.BattleAICoordinationHealth.summary(sim),
      lastProgress = health && health.lastObjectiveProgressAt && health.lastObjectiveProgressAt[sq.faction],
      now = +sim.time || 0;
    if (lastProgress && now - lastProgress > 180 && !sq.inContact) return false;
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

  /* Reconstitution. Retreated squads that are home and out of contact (`_assembly` `at-base`,
     16-squad-plan-stability.js) are a side's pool of survivors; no group is planned for a squad still on
     its way home. Whenever the pool holds a full squad's worth, the General groups the fewest squads that
     reach it (squads are never split) and briefs each to a rally point at the centre of their home
     points. When every grouped squad is there out of contact the General merges them into one squad
     under one leader and re-tasks it (`squad-reconstituted`). A group that falls below full strength
     before merging is dissolved and its squads return to the pool. State lives in
     missionState(sim).reconstitution. */
  var RECON_STRENGTH = 10, // one full rifle squad (SquadAI.COMPOSITION)
    RALLY_RADIUS = 20,
    RALLY_FORWARD = 30,
    FLED_PICKUP_RANGE = 50; // a retreating squad this near a fled man waiting for one takes him in
  function reconState(sim, faction) {
    var general = generalFor(sim, faction);
    return (
      general.reconstitution ||
      (general.reconstitution = {
        faction: faction,
        strength: RECON_STRENGTH,
        serial: 0,
        groupsFormed: 0,
        groupsDissolved: 0,
        merges: 0,
        promotions: 0,
        active: [],
        ended: []
      })
    );
  }
  function squadById(sim, faction, id) {
    var a = sim.factions[faction].squads;
    for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    return null;
  }
  function endGroup(st, g, status, reason, t) {
    g.status = status;
    g.endReason = reason;
    g.endedAt = t;
    st.active.splice(st.active.indexOf(g), 1);
    st.ended.push(g);
    if (st.ended.length > 20) st.ended.shift();
  }
  function strongestFirst(sim, faction) {
    var order = sim.factions[faction].squads;
    return function (a, b) {
      return D.aliveMembers(b).length - D.aliveMembers(a).length || order.indexOf(a) - order.indexOf(b);
    };
  }
  /* The rally point is where the re-formed squad starts its next approach: on the spawn line, RALLY_FORWARD
     ahead of it, straight back from the objective the General expects to send it to, and inside the
     side's lanes. With no objective to plan for it is the centre of the grouped squads' home points. */
  function rallyPoint(sim, faction, squads, plan) {
    var x = 0,
      z = 0;
    for (var i = 0; i < squads.length; i++) {
      x += +squads[i].home.x || 0;
      z += +squads[i].home.z || 0;
    }
    x /= squads.length;
    z /= squads.length;
    if (!plan) return { x: x, z: z };
    var homes = sim.factions[faction].squads.map(function (sq) {
        return +sq.home.x || 0;
      }),
      toward = plan.point.z >= z ? 1 : -1;
    return {
      x: Math.max(Math.min.apply(null, homes), Math.min(Math.max.apply(null, homes), plan.point.x)),
      z: z + toward * RALLY_FORWARD
    };
  }
  function formGroup(sim, faction, squads) {
    /* The strongest grouped squad stands in for the re-formed squad: all of them are at base. */
    var st = reconState(sim, faction),
      plan = D.chooseObjective(sim, squads[0], false) || D.chooseObjective(sim, squads[0], true),
      rally = rallyPoint(sim, faction, squads, plan);
    var g = {
      id: faction + '-reconstitution-' + ++st.serial,
      faction: faction,
      squads: squads.map(function (sq) {
        return sq.id;
      }),
      rally: rally,
      objectiveId: plan ? plan.instance.id : null,
      survivors: squads.reduce(function (n, sq) {
        return n + D.aliveMembers(sq).length;
      }, 0),
      formedAt: +sim.time || 0,
      status: 'assembling'
    };
    st.active.push(g);
    st.groupsFormed++;
    squads.forEach(function (sq) {
      finishMission(sim, sq, 'failed', 'squad-retreat');
      recordMacroWake(sim, sq, 'reconstitute-group');
      sq._reconGroup = g.id;
      issueMission(
        sim,
        sq,
        {
          intent: 'reconstitute',
          action: 'assemble',
          objectiveId: null,
          point: g.rally,
          role: sq.commandRole || 'center',
          route: [],
          plannedObjectiveId: g.objectiveId
        },
        'reconstitute-group'
      );
    });
    telemetry(sim, 'decision-reconstitute-group', {
      faction: faction,
      group: g.id,
      squads: g.squads,
      survivors: g.survivors,
      rally: g.rally,
      objectiveId: g.objectiveId
    });
    return g;
  }
  function dissolveGroup(sim, g, squads, reason) {
    squads.forEach(function (sq) {
      sq._reconGroup = null;
      finishMission(sim, sq, 'failed', reason);
    });
    var st = reconState(sim, g.faction);
    st.groupsDissolved++;
    endGroup(st, g, 'dissolved', reason, +sim.time || 0);
    telemetry(sim, 'decision-reconstitute-dissolved', { faction: g.faction, group: g.id, reason: reason });
  }
  function mergeGroup(sim, g, squads) {
    var st = reconState(sim, g.faction),
      t = +sim.time || 0,
      order = squads.slice().sort(strongestFirst(sim, g.faction)),
      /* The most senior surviving leader takes command (a sergeant outranks a rifleman who stepped up
         in combat), the stronger squad first among equals; `order` is strongest first and sort is stable. */
      led = order
        .filter(function (sq) {
          return !!root.SquadAI.leaderOf(sq);
        })
        .sort(function (a, b) {
          return (
            root.SquadAI.seniority(root.SquadAI.leaderOf(a)) -
            root.SquadAI.seniority(root.SquadAI.leaderOf(b))
          );
        }),
      survivor = led[0] || order[0],
      men = [];
    [survivor]
      .concat(
        order.filter(function (sq) {
          return sq !== survivor;
        })
      )
      .forEach(function (sq) {
        D.aliveMembers(sq).forEach(function (s) {
          men.push(s);
        });
      });
    var leader = root.SquadAI.leaderOf(survivor),
      promoted = !leader;
    if (promoted) leader = root.SquadAI.mostSenior(men);
    men.forEach(function (s) {
      if (root.BattleTacticalPositions) root.BattleTacticalPositions.release(s, sim, 'reconstituted');
    });
    /* The Squad Leader re-forms the squad on the group's rally point: slots, plan state, leader, anchor. */
    root.BattleSquadStability.reform(survivor, men, leader, g.rally, RECON_STRENGTH);
    survivor._reconGroup = null;
    survivor.reconstitutedFrom = g.squads.slice();
    finishMission(sim, survivor, 'completed', 'reconstituted');
    order.forEach(function (sq) {
      if (sq === survivor) return;
      /* An absorbed squad reads like a destroyed one: no living men, full strength missing. */
      sq.establishment = RECON_STRENGTH;
      root.BattleSquadStability.disband(sq);
      sq.disbanded = true;
      sq.mergedInto = survivor.id;
      sq._reconGroup = null;
      finishMission(sim, sq, 'completed', 'merged');
    });
    st.merges++;
    if (promoted) st.promotions++;
    g.survivor = survivor.id;
    g.size = men.length;
    g.leader = leader.id;
    g.promoted = promoted;
    endGroup(st, g, 'merged', 'reconstituted', t);
    telemetry(sim, 'decision-squad-merge', {
      faction: g.faction,
      group: g.id,
      survivor: survivor.id,
      absorbed: g.squads.filter(function (id) {
        return id !== survivor.id;
      }),
      size: men.length,
      leader: leader.id
    });
    if (promoted)
      telemetry(sim, 'decision-leader-promoted', {
        faction: g.faction,
        squad: survivor.id,
        soldier: leader.id,
        role: leader.role
      });
  }
  function atRally(sq, g) {
    var a = sq._assembly,
      p = D.avgPos(sq);
    return !!(
      a &&
      a.phase === 'to-rally' &&
      !sq.inContact &&
      D.dist(p.x, p.z, g.rally.x, g.rally.z) <= RALLY_RADIUS
    );
  }
  /* Pool first, then advance groups: a squad merged this tick still reads `retreat` until its Squad Leader
     recomputes its status, so it must not be pooled in the same pass. */
  function reconstitute(sim, faction) {
    var st = reconState(sim, faction),
      groups = st.active.slice(),
      pool = sim.factions[faction].squads
        .filter(function (sq) {
          return (
            !sq.disbanded &&
            sq.state === 'retreat' &&
            !sq._reconGroup &&
            !sq.inContact &&
            sq._assembly &&
            sq._assembly.phase === 'at-base' &&
            D.aliveMembers(sq).length &&
            /* A squad that already holds a full squad's men has nothing to reconstitute: grouped alone it would be
               "merged" with itself and re-tasked on every command tick. Group morale keeps it in `retreat` until its
               men are calm, so it rests at base and the Squad Leader rallies it (a merged squad whose men are still
               shaken, which stress that lasts makes common). */
            D.aliveMembers(sq).length < RECON_STRENGTH
          );
        })
        .sort(strongestFirst(sim, faction)),
      total = pool.reduce(function (n, sq) {
        return n + D.aliveMembers(sq).length;
      }, 0);
    /* Strongest first reaches full strength with the fewest squads. */
    while (total >= RECON_STRENGTH) {
      var take = [],
        n = 0;
      while (n < RECON_STRENGTH) {
        var next = pool.shift();
        take.push(next);
        n += D.aliveMembers(next).length;
      }
      total -= n;
      formGroup(sim, faction, take);
    }
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i],
        squads = g.squads
          .map(function (id) {
            return squadById(sim, faction, id);
          })
          .filter(function (sq) {
            return sq && !sq.disbanded && D.aliveMembers(sq).length;
          }),
        survivors = squads.reduce(function (n, sq) {
          return n + D.aliveMembers(sq).length;
        }, 0);
      if (survivors < RECON_STRENGTH) dissolveGroup(sim, g, squads, 'below-strength');
      /* A member that rallied (?morale=1) is no longer retreating, so it will never reach the rally point as a
         retreating squad: the group cannot finish. Without a rally a member's state leaves `retreat` only through
         a merge, which ends the group first. */
      else if (
        squads.some(function (sq) {
          return sq.state !== 'retreat';
        })
      )
        dissolveGroup(sim, g, squads, 'squad-rallied');
      else if (
        squads.every(function (sq) {
          return atRally(sq, g);
        })
      )
        mergeGroup(sim, g, squads);
    }
  }

  /* A fled man (a squad of one, `fledId`: Engagement `flee`) waits at his refuge for a retreating squad. When one that is
     out of contact stands within FLED_PICKUP_RANGE of him, the General has it take him in (the Squad Leader rewrites
     its roster, `absorb`) and tells Engagement his wait is over: he goes home with them and is issued a weapon at base. */
  function pickUpFled(sim, faction) {
    var squads = sim.factions[faction].squads,
      E = root.BattleEngagement,
      S = root.BattleSquadStability;
    if (!E || !S || !E.releaseFled) return;
    for (var i = 0; i < squads.length; i++) {
      var lone = squads[i],
        man = lone.fledId != null && !lone.disbanded && lone.members && lone.members[0];
      if (!man || man.dead || E.fledPhase(man) !== 'wait') continue;
      var p = man.root.position,
        best = null,
        bestD = FLED_PICKUP_RANGE;
      for (var j = 0; j < squads.length; j++) {
        var sq = squads[j];
        if (sq === lone || sq.fledId != null || sq.disbanded || sq.state !== 'retreat' || sq.inContact) continue;
        if (!D.aliveMembers(sq).length) continue;
        var a = D.avgPos(sq),
          d = D.dist(p.x, p.z, a.x, a.z);
        if (d <= bestD) {
          best = sq;
          bestD = d;
        }
      }
      if (best && S.absorb(best, lone, sim) && E.releaseFled(man, sim, 'pickup'))
        telemetry(sim, 'decision-fled-pickup', {
          faction: faction,
          soldier: man.id,
          squad: best.id,
          distance: +bestD.toFixed(1)
        });
    }
  }

  function updateFactionCommander(sim, town, faction) {
    var general = generalFor(sim, faction),
      squads = sim.factions[faction].squads,
      woke = false,
      reasons = {};
    reconstitute(sim, faction);
    pickUpFled(sim, faction);
    if (runStrategicRecovery(sim, faction, squads, town)) {
      woke = true;
      reasons['@' + faction] = 'strategic-recovery';
    }
    for (var i = 0; i < squads.length; i++) {
      var sq = squads[i],
        reason = wakeReason(sim, sq);
      if (!reason) continue;
      woke = true;
      reasons[sq.id] = reason;
      reconsiderMission(sim, sq, town, reason, null);
    }
    general.lastTickAt = +sim.time || 0;
    return { wake: woke, reasons: reasons };
  }
  function updateCommander(sim, town, dt) {
    dt = dt || COMMAND_TICK;
    var macro = macroEnabled(sim),
      macroWake = false,
      wakeReasons = {};
    if (macro) R.ensureAssignments(sim, town);
    if (root.BattleObjectiveSystem) root.BattleObjectiveSystem.tick(sim, dt);
    if (macro)
      ['us', 'ge'].forEach(function (f) {
        var result = updateFactionCommander(sim, town, f);
        if (result.wake) macroWake = true;
        Object.keys(result.reasons).forEach(function (key) {
          wakeReasons[f + ':' + key] = result.reasons[key];
        });
      });
    if (root.BattleModules)
      root.BattleModules.runHook('onCommanderTick', sim, {
        town: town,
        dt: dt,
        macroCommandEnabled: macro,
        macroCommandWake: macroWake,
        macroWakeReasons: wakeReasons
      });
    var snapshotSeconds = policy(sim, 'us').decisionSnapshotSeconds || 5;
    if (!sim._nextDecisionSnapshot || sim.time >= sim._nextDecisionSnapshot) {
      sim._nextDecisionSnapshot = sim.time + snapshotSeconds;
      var counts = (sim.objectiveControl && sim.objectiveControl.counts) || {};
      telemetry(sim, 'decision-snapshot', {
        scenarioId: (town && town.id) || null,
        seed: (town && town.seed) || null,
        macroCommandEnabled: macro,
        macroMissionState: missionState(sim),
        usAlive: D.forceUnits(sim, 'us').length,
        geAlive: D.forceUnits(sim, 'ge').length,
        usObjectives: counts.us || 0,
        geObjectives: counts.ge || 0,
        squads: {
          us: sim.factions.us.squads.map(function (q) {
            return q.commandPhase;
          }),
          ge: sim.factions.ge.squads.map(function (q) {
            return q.commandPhase;
          })
        },
        contact: {
          us: sim.factions.us.squads.filter(function (q) {
            return q.inContact;
          }).length,
          ge: sim.factions.ge.squads.filter(function (q) {
            return q.inContact;
          }).length
        }
      });
    }
    if (sim.objectiveHold && sim.objectiveHold.us >= OBJECTIVE_HOLD_WIN)
      declare(sim, 'us', 'held all objectives');
    else if (sim.objectiveHold && sim.objectiveHold.ge >= OBJECTIVE_HOLD_WIN)
      declare(sim, 'ge', 'held all objectives');
  }

  function installVictory(sim) {
    var stockCheck = sim._checkWinner.bind(sim);
    sim._checkWinner = function () {
      if (this.winner) return;
      var usUnits = D.forceUnits(this, 'us'),
        geUnits = D.forceUnits(this, 'ge');
      if (usUnits.length <= 0 || geUnits.length <= 0) {
        this.winner =
          usUnits.length === geUnits.length ? 'draw' : usUnits.length > geUnits.length ? 'us' : 'ge';
        if (this.onWinner) this.onWinner(this.winner, this);
        return;
      }
      if (this.time >= this.timeLimit) {
        var u = D.objectiveValueScore(this, 'us') * 12 + D.forceScore(this, 'us'),
          g = D.objectiveValueScore(this, 'ge') * 12 + D.forceScore(this, 'ge');
        declare(this, u === g ? 'draw' : u > g ? 'us' : 'ge', 'time limit objective score');
        return;
      }
      if (this.time < this.timeLimit && this.factions.us.alive <= 0 && this.factions.ge.alive <= 0)
        stockCheck();
    };
  }

  root.BattleSim.start = function (scene, opts) {
    var sim = oldStart(scene, opts),
      town =
        (scene.metadata && scene.metadata.battleScenario) || (scene.metadata && scene.metadata.battleTown);
    if (!town) {
      console.warn('[COMMAND] no scenario metadata; hierarchical infantry AI disabled');
      return sim;
    }
    if (root.BattleObjectiveSystem)
      root.BattleObjectiveSystem.attach(sim, root.BattleObjectiveSystem.definitionsFromTown(town), {
        town: town
      });
    R.initForce(sim, 'us', town);
    R.initForce(sim, 'ge', town);
    sim.macroCommandEnabled = !(opts && opts.macroCommandEnabled === false);
    sim.objectives = sim._objectives || [];
    sim._commandAccum = 0;
    sim._nextDecisionSnapshot = 0;
    sim._objectiveRecovery = { us: { count: 0, last: null }, ge: { count: 0, last: null } };
    sim._macroMissionState = null;
    sim._generals = { us: newGeneralState('us'), ge: newGeneralState('ge') };
    missionState(sim);
    var adapted = {};
    if (root.BattleAIPolicy) {
      ['us', 'ge'].forEach(function (f) {
        adapted[f] = root.BattleAIPolicy.adaptedForScenario(town);
      });
      telemetry(sim, 'decision-scenario-recall', {
        scenarioId: town.id,
        seed: town.seed,
        sources: adapted.us.sources,
        fingerprint: town.fingerprint
      });
    }
    if (root.BattleModules) root.BattleModules.runHook('onBattleStart', sim, { town: town });
    installVictory(sim);

    var stockRestart = sim.restart.bind(sim);
    sim.restart = function () {
      var macroCommandEnabled = sim.macroCommandEnabled !== false;
      stockRestart();
      town =
        (scene.metadata && scene.metadata.battleScenario) ||
        (scene.metadata && scene.metadata.battleTown) ||
        town;
      if (root.BattleObjectiveSystem)
        root.BattleObjectiveSystem.reset(sim, root.BattleObjectiveSystem.definitionsFromTown(town), {
          town: town
        });
      R.initForce(sim, 'us', town);
      R.initForce(sim, 'ge', town);
      sim.macroCommandEnabled = macroCommandEnabled;
      sim._commandAccum = 0;
      sim._nextDecisionSnapshot = 0;
      sim._objectiveRecovery = { us: { count: 0, last: null }, ge: { count: 0, last: null } };
      sim._macroMissionState = null;
      sim._generals = { us: newGeneralState('us'), ge: newGeneralState('ge') };
      missionState(sim);
      if (root.BattleModules) root.BattleModules.runHook('onBattleRestart', sim, { town: town });
    };
    scene.onBeforeRenderObservable.add(function () {
      if (sim.paused || sim.winner || sim._trainerStepActive) return;
      var dt = Math.min(0.25, Math.max(0, (scene.getEngine().getDeltaTime() / 1000) * sim.timeScale));
      sim._commandAccum += dt;
      while (sim._commandAccum >= COMMAND_TICK && !sim.winner) {
        sim._commandAccum -= COMMAND_TICK;
        updateCommander(sim, town, COMMAND_TICK);
      }
    });
    console.log(
      '[COMMAND] Genome v2 doctrine + modular objectives active · build ' + (root.BATTLE_BUILD || 'dev')
    );
    return sim;
  };

  root.BattleCommanderAI = {
    missionStates: MISSION_STATES,
    transitionMission: transitionMission,
    acceptMission: acceptMission,
    update: updateCommander,
    assignSquad: R.assignSquad,
    ensureAssignments: R.ensureAssignments,
    isMacroEnabled: macroEnabled,
    setMacroEnabled: setMacroEnabled,
    commandTick: COMMAND_TICK,
    objectiveHoldWin: OBJECTIVE_HOLD_WIN,
    strategicStallReplan: STRATEGIC_STALL_REPLAN,
    strategicStallRecovery: STRATEGIC_STALL_RECOVERY,
    missionState: missionState,
    generalFor: generalFor,
    generals: generals,
    updateFaction: updateFactionCommander,
    reconstitute: reconstitute,
    reconstitutionStrength: RECON_STRENGTH,
    fledPickupRange: FLED_PICKUP_RANGE,
    policyFor: policy,
    genomeFor: genome,
    doctrineFor: doctrine,
    chooseObjective: D.chooseObjective,
    buildContext: D.buildContext
  };
})(typeof window !== 'undefined' ? window : globalThis);
