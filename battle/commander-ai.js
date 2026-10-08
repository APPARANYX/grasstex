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
  root.GTLog('[COMMAND] objective commander module loaded');
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
    root.GTLog('[COMMAND] objective victory ' + winner + ' reason=' + reason);
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
      lastAdoptionHold: null,
      stallRecovery: {
        episode: null,
        completed: 0,
        mainEffort: null,
        history: [],
        progress: {},
        passes: 0,
        wakes: {},
        lastReviewAt: null
      },
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
          groupsFormed: rows.reduce(function (n, r) {
            return n + (+r.groupsFormed || 0);
          }, 0),
          groupsDissolved: rows.reduce(function (n, r) {
            return n + (+r.groupsDissolved || 0);
          }, 0),
          merges: rows.reduce(function (n, r) {
            return n + (+r.merges || 0);
          }, 0),
          promotions: rows.reduce(function (n, r) {
            return n + (+r.promotions || 0);
          }, 0),
          pool: {
            us: ur
              ? {
                  survivors: +(ur.pool && ur.pool.survivors) || 0,
                  squads: (ur.pool && ur.pool.squads) || [],
                  ready: !!(ur.pool && ur.pool.ready),
                  blockedByDistance: !!(ur.pool && ur.pool.blockedByDistance),
                  poolMax: RECON_POOL_MAX,
                  minimumStrength: +ur.minimumStrength || RECON_MIN_STRENGTH,
                  targetStrength: +ur.strength || RECON_STRENGTH
                }
              : null,
            ge: gr
              ? {
                  survivors: +(gr.pool && gr.pool.survivors) || 0,
                  squads: (gr.pool && gr.pool.squads) || [],
                  ready: !!(gr.pool && gr.pool.ready),
                  blockedByDistance: !!(gr.pool && gr.pool.blockedByDistance),
                  poolMax: RECON_POOL_MAX,
                  minimumStrength: +gr.minimumStrength || RECON_MIN_STRENGTH,
                  targetStrength: +gr.strength || RECON_STRENGTH
                }
              : null
          },
          active: rows.reduce(function (a, r) {
            return a.concat(r.active || []);
          }, []),
          ended: rows.reduce(function (a, r) {
            return a.concat(r.ended || []);
          }, [])
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
    /* An advisory (engineer-made) request the General released no longer binds the squad. */
    if (r && r.advisory && sq._garrisonReleased) r = null;
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
  /* ---- strategic stall and recovery (battle/modules/22a-commander-strategic-recovery.js) ---- */

  /* The strategic-recovery machine moved verbatim to the sub-module: the stall detector
     (strategicStallInfo, stallRecoveryState, stallEligible, stalledEfforts and the progress
     trackers), the effort pickers (chooseMainEffort, forcedCandidate, objectiveReachable,
     reachableAttackMap, usefulDefender, missionDistance), the recovery stage machine
     (runReconcileStage, runReleaseStage, runMainEffortStage, runResetStage, runStrategicRecovery,
     recordRecoveryStage, recordStallOutcome) and the mission issuing it drives (selectMission,
     reconsiderMission, wakeReason). This file keeps the macro gate, the generals' state, the
     mission lifecycle (MISSION_STATES, transitionMission, acceptMission, finishMission,
     issueMission, missionState, catalogKey, defenseRequest, missionObservation,
     recordMacroWake, reserveDue) and the COMMAND_TICK / STRATEGIC_STALL_* constants - the
     machine above is what consumes them. Wiring is the reversed install used by the cover,
     stress and fire/stance splits: the ctx below (_commanderRecoveryCtx) carries the closure
     utilities, the lifecycle functions the recovery re-tasks through and those constants; the
     attach sink (_commanderRecoveryAttach) takes the implementation back, and until the module
     loads the delegating closures throw - a commander-ai.js chain without the module says so
     on the first strategic tick instead of silently never recovering a stalled front. */
  var recoveryApi = null;
  root._commanderRecoveryAttach = function (api) {
    if (!api || typeof api.runStrategicRecovery !== 'function' || typeof api.reconsiderMission !== 'function')
      return false;
    recoveryApi = api;
    return true;
  };
  root._commanderRecoveryCtx = function () {
    return {
      root: root,
      D: D,
      telemetry: telemetry,
      COMMAND_TICK: COMMAND_TICK,
      STRATEGIC_STALL_STAGES: STRATEGIC_STALL_STAGES,
      STRATEGIC_STALL_RECOVERY: STRATEGIC_STALL_RECOVERY,
      STRATEGIC_STALL_REPLAN: STRATEGIC_STALL_REPLAN,
      generalFor: generalFor,
      missionState: missionState,
      catalogKey: catalogKey,
      defenseRequest: defenseRequest,
      finishMission: finishMission,
      issueMission: issueMission,
      recordMacroWake: recordMacroWake,
      reserveDue: reserveDue
    };
  };
  function recoveryImpl() {
    if (!recoveryApi)
      throw new Error(
        '[COMMANDER] strategic recovery missing: battle/modules/22a-commander-strategic-recovery.js must load after commander-ai.js'
      );
    return recoveryApi;
  }
  /* Delegating closures with the pre-split names and signatures. */
  function runStrategicRecovery(sim, faction, squads, town) {
    return recoveryImpl().runStrategicRecovery(sim, faction, squads, town);
  }
  function reconsiderMission(sim, sq, town, reason, stalled, forcedObjective) {
    return recoveryImpl().reconsiderMission(sim, sq, town, reason, stalled, forcedObjective);
  }
  function wakeReason(sim, sq) {
    return recoveryImpl().wakeReason(sim, sq);
  }
  /* ---- reconstitution (battle/modules/22-commander-reconstitution.js) ----------------------- */

  /* The subsystem moved verbatim to the sub-module. commander-ai.js loads before every module
     in both chains (it sits in the page's core-adjacent extras, before the discovered
     modules; the harness checks load it by hand), so - like engagement.js's cover system,
     unlike 15m handing a factory to 16 - this file cannot call the factory at load time. It
     publishes the ctx the moved bodies consume (its closure utilities, the mission-lifecycle
     functions the re-tasking goes through, and the RECON_* / FLED_PICKUP_RANGE constants,
     which stay here: the export reads them) and an attach sink, and the sub-module installs
     the implementation back into this file at its own load time. Until then reconstitute and
     pickUpFled resolve through reconImpl(), which throws: a commander-ai.js chain without the
     sub-module has no survivor pool and must say so, not silently leave retreated squads
     scattered at their spawn line for good. */
  var RECON_STRENGTH = 10, // establishment / preferred full rebuilt rifle squad
    RECON_MIN_STRENGTH = 6, // minimum combined survivors that may become one rebuilt squad
    RECON_POOL_MAX = root.SquadAI.REMNANT_EXTRACTION_MAX, // shared SquadAI survivor-remnant boundary
    RECON_MAX_CENTER_TRAVEL = 300, // do not bind remnants whose neutral rendezvous is already too far away
    RECON_FORWARD_DETOUR = 1.15, // each source may spend at most 15% extra travel to move the meeting point frontward
    RECON_FORWARD_MAX = 180, // absolute cap on the frontward slide after the neutral rendezvous is found
    RALLY_RADIUS = 20,
    FLED_PICKUP_RANGE = 50; // a retreating squad this near a fled man waiting for one takes him in
  var reconApi = null;
  root._commanderReconstitutionAttach = function (api) {
    if (!api || typeof api.reconstitute !== 'function' || typeof api.pickUpFled !== 'function') return false;
    reconApi = api;
    return true;
  };
  root._commanderReconstitutionCtx = function () {
    return {
      root: root,
      D: D,
      telemetry: telemetry,
      generalFor: generalFor,
      missionState: missionState,
      issueMission: issueMission,
      finishMission: finishMission,
      recordMacroWake: recordMacroWake,
      RECON_STRENGTH: RECON_STRENGTH,
      RECON_MIN_STRENGTH: RECON_MIN_STRENGTH,
      RECON_POOL_MAX: RECON_POOL_MAX,
      RECON_MAX_CENTER_TRAVEL: RECON_MAX_CENTER_TRAVEL,
      RECON_FORWARD_DETOUR: RECON_FORWARD_DETOUR,
      RECON_FORWARD_MAX: RECON_FORWARD_MAX,
      RALLY_RADIUS: RALLY_RADIUS,
      FLED_PICKUP_RANGE: FLED_PICKUP_RANGE
    };
  };
  function reconImpl() {
    if (!reconApi)
      throw new Error(
        '[COMMANDER] reconstitution missing: battle/modules/22-commander-reconstitution.js must load after commander-ai.js'
      );
    return reconApi;
  }
  /* Delegating closures with the pre-split names and signatures: the commander tick and the
     BattleCommanderAI export below keep calling exactly these. */
  function reconstitute(sim, faction) {
    return reconImpl().reconstitute(sim, faction);
  }
  function pickUpFled(sim, faction) {
    return reconImpl().pickUpFled(sim, faction);
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
    var genomeStatus = D.genomeOff && D.genomeOff() ? 'stashed' : 'active',
      doctrineStatus = D.actionDoctrineEnabled ? 'on' : 'off';
    root.GTLog(
      `[COMMAND] objectives active · Genome ${genomeStatus} · doctrine actions ${doctrineStatus} · build ${root.BATTLE_BUILD || 'dev'}`
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
    reconstitutionMinimumStrength: RECON_MIN_STRENGTH,
    reconstitutionPoolMax: RECON_POOL_MAX,
    reconstitutionMaxCenterTravel: RECON_MAX_CENTER_TRAVEL,
    reconstitutionForwardDetour: RECON_FORWARD_DETOUR,
    reconstitutionForwardMax: RECON_FORWARD_MAX,
    fledPickupRange: FLED_PICKUP_RANGE,
    policyFor: policy,
    genomeFor: genome,
    doctrineFor: doctrine,
    chooseObjective: D.chooseObjective,
    buildContext: D.buildContext
  };
})(typeof window !== 'undefined' ? window : globalThis);
