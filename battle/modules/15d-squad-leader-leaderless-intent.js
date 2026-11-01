/* Squad Leader leaderless-intent sub-module (extracted from 16-squad-plan-stability.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.
   The parent file calls the factory with its closure utilities and re-attaches the returned
   functions as closure variables, so all callers (plan lifecycle, anchor advance, fireteams,
   fire-and-movement, mission execution, succession, the public API export) see the same
   functions as before. parseLeaderlessIntent and the LEADERLESS_INTENT_ON / LEADERLESS_TUNING
   declarations stay in 16 (parsed at load time from location.search) and are passed into the
   factory via ctx. */
(function (root) {
  'use strict';
  if (root._squadLeaderLeaderlessIntent) return;

  /* Factory: called by 16-squad-plan-stability.js after its shared utilities are defined.
     ctx provides the closure utilities the leaderless-intent functions need. teamKeyFor
     and missionVersion are hoisted function declarations in the parent closure. */
  root._squadLeaderLeaderlessIntent = function (ctx) {
    var root = ctx.root,
      telemetry = ctx.telemetry,
      alive = ctx.alive,
      leaderAlive = ctx.leaderAlive,
      point = ctx.point,
      copy = ctx.copy,
      teamKeyFor = ctx.teamKeyFor,
      missionVersion = ctx.missionVersion,
      LEADERLESS_INTENT_ON = ctx.LEADERLESS_INTENT_ON;
    function leaderlessActive(sq) {
      return !!(LEADERLESS_INTENT_ON && sq && !leaderAlive(sq) && alive(sq).length);
    }
    /* Succession under the tactical controller (`?tacticalController=new`; `?controllerLeaderless=0`
       turns it off). The rule is the one above: while nobody commands the squad no new Meso command
       is started; what the dead leader already set (fire discipline, a clearing order, a mission leg)
       stands, the men fight through Engagement and a retreat is never held. This is the one test the
       controller's skills read, and the one place the episode's actions are noted, so the leaderless
       telemetry covers controlled squads as it does legacy ones. Read-only: it writes no order. */
    var SEARCH = typeof location !== 'undefined' ? location.search || '' : '',
      CONTROLLER_LEADERLESS =
        /[?&]tacticalController=new(?:&|#|$)/i.test(SEARCH) &&
        !/[?&]controllerLeaderless=(?:0|off|false)(?:&|#|$)/i.test(SEARCH);
    function controllerSuccession(sim, sq) {
      var TC = root.BattleTacticalController;
      return !!(
        CONTROLLER_LEADERLESS &&
        sim &&
        sq &&
        TC &&
        TC.controls(sim, sq) &&
        sq.state !== 'retreat' &&
        sq.commandPhase !== 'retreat' &&
        leaderlessActive(sq)
      );
    }
    /* Called once per fire-and-movement dispatch of a controlled squad. Same action names as legacy. */
    function noteControllerSuccession(sim, sq, report) {
      if (!controllerSuccession(sim, sq)) return null;
      var M = root.BattleTacticalCoveredManeuver,
        K = root.BattleTacticalAmbushSkill,
        cover = M && M.summary(sq),
        ambush = K && K.summary(sq),
        r = report || {},
        action =
          r.contactStarted || r.underFire > 0
            ? 'immediate-contact'
            : (cover && cover.pendingCover) || (ambush && ambush.phase !== 'idle')
              ? 'finish-committed-move'
              : sq.inContact
                ? 'hold-and-fight'
                : 'hold-intent',
        why =
          action === 'immediate-contact'
            ? r.underFire > 0
              ? 'under fire'
              : 'contact acquired'
            : action === 'finish-committed-move'
              ? 'inherited controller move remains live'
              : action === 'hold-and-fight'
                ? 'existing contact under inherited intent'
                : 'no new Meso command during succession';
      noteLeaderlessAction(sq, sim, action, why);
      return action;
    }
    function leaderlessStats(battle) {
      if (!LEADERLESS_INTENT_ON || !battle) return null;
      return (
        battle._leaderlessIntentStats ||
        (battle._leaderlessIntentStats = {
          episodes: 0,
          handbacks: 0,
          destroyed: 0,
          seconds: 0,
          actions: {},
          recent: []
        })
      );
    }
    function leaderlessTelemetry(battle) {
      var st = battle && battle._leaderlessIntentStats;
      if (!LEADERLESS_INTENT_ON || !st) return null;
      var out = JSON.parse(JSON.stringify(st)),
        active = 0,
        liveSeconds = 0;
      ['us', 'ge'].forEach(function (side) {
        var squads = (battle.factions && battle.factions[side] && battle.factions[side].squads) || [];
        for (var i = 0; i < squads.length; i++) {
          var intent = squads[i] && squads[i]._leaderlessIntent;
          if (!intent) continue;
          active++;
          liveSeconds += Math.max(0, battle.time - intent.startedAt);
        }
      });
      out.activeAtEnd = active;
      out.liveSeconds = +liveSeconds.toFixed(2);
      out.seconds = +(out.seconds + liveSeconds).toFixed(2);
      return out;
    }
    function inheritedMemberIntent(sq) {
      return alive(sq).map(function (man) {
        var e =
            root.BattleEngagement && root.BattleEngagement.stateOf
              ? root.BattleEngagement.stateOf(man)
              : man.eng || null,
          d = point(man._fireteamDestination) || point(man.orderDestination);
        return {
          id: String(man.id),
          team: man._fireteamKey || teamKeyFor(man) || null,
          task: man._engagementTask || null,
          destination: d ? copy(d) : null,
          bound: !!(e && e.boundOrder)
        };
      });
    }
    function captureLeaderlessIntent(sq, battle) {
      var p = sq._engagementPlan,
        m = sq._macroMission,
        intent = {
          startedAt: battle.time,
          missionVersion: missionVersion(sq),
          macroVersion: m && m.version != null ? m.version : null,
          phase: String(sq.commandPhase || ''),
          targetObjective: sq.targetObjective || null,
          routeIndex: +sq.routeIndex || 0,
          objective: copy(sq.objective),
          anchor: copy(sq.orderAnchor || sq.rally),
          orderVersion: +sq._orderVersion || 0,
          planSerial: p ? p.serial : null,
          planStatus: p ? p.status : null,
          fireControl: sq.fireControl ? sq.fireControl.state : null,
          members: inheritedMemberIntent(sq),
          lastAction: null,
          lastActionAt: null,
          actionCounts: {}
        };
      var local = ctx.localPlan && ctx.localPlan(),
        task = sq._localTask;
      if (local && local.degradationOn) {
        intent.localTask = task
          ? { kind: task.kind, serial: task.serial, missionVersion: task.missionVersion }
          : null;
        intent.localValidity = null;
      }
      sq._leaderlessIntent = intent;
      var st = leaderlessStats(battle);
      if (st) st.episodes++;
      telemetry(battle, 'decision-leaderless-inherit', {
        faction: sq.faction,
        squad: sq.id,
        missionVersion: intent.missionVersion,
        macroVersion: intent.macroVersion,
        phase: intent.phase,
        targetObjective: intent.targetObjective,
        routeIndex: intent.routeIndex,
        planSerial: intent.planSerial,
        members: intent.members.length
      });
      return intent;
    }
    function updateLeaderlessLocalTask(sq, battle, report) {
      var local = ctx.localPlan && ctx.localPlan(),
        intent = sq._leaderlessIntent;
      if (!intent || !local || !local.degradationOn) return null;
      var previous = intent.localValidity,
        validity =
          previous && previous.status === 'hold'
            ? Object.assign({}, previous, { at: +battle.time || 0 })
            : local.degradation(battle, sq, intent.localTask, report);
      intent.localValidity = validity;
      if (!previous || previous.status !== validity.status || previous.reason !== validity.reason)
        telemetry(
          battle,
          'decision-leaderless-local-validity',
          Object.assign({ faction: sq.faction, squad: sq.id }, validity)
        );
      return validity;
    }
    function noteLeaderlessAction(sq, battle, action, why) {
      var intent = sq && sq._leaderlessIntent;
      if (!intent || !battle) return;
      action = action || 'hold-intent';
      intent.actionCounts[action] = (intent.actionCounts[action] || 0) + 1;
      var st = leaderlessStats(battle);
      if (st) st.actions[action] = (st.actions[action] || 0) + 1;
      if (intent.lastAction === action) return;
      intent.lastAction = action;
      intent.lastActionAt = battle.time;
      telemetry(battle, 'decision-leaderless-local', {
        faction: sq.faction,
        squad: sq.id,
        action: action,
        why: why || action,
        inheritedPhase: intent.phase,
        missionVersion: intent.missionVersion
      });
    }
    function endLeaderlessIntent(sq, battle, reason, successor) {
      var intent = sq && sq._leaderlessIntent;
      if (!intent) return null;
      var seconds = Math.max(0, battle.time - intent.startedAt),
        st = leaderlessStats(battle),
        row = {
          at: +battle.time.toFixed(2),
          squad: sq.faction + ':' + sq.id,
          reason: reason || 'ended',
          successor: successor ? String(successor.id) : null,
          seconds: +seconds.toFixed(2),
          phase: intent.phase,
          missionVersion: intent.missionVersion,
          actions: Object.assign({}, intent.actionCounts)
        };
      if (st) {
        st.seconds += seconds;
        if (successor) st.handbacks++;
        else if (reason === 'squad destroyed') st.destroyed++;
        st.recent.push(row);
        if (st.recent.length > 24) st.recent.shift();
      }
      telemetry(battle, 'decision-leaderless-handback', {
        faction: sq.faction,
        squad: sq.id,
        reason: reason || 'ended',
        successor: successor ? successor.id : null,
        seconds: +seconds.toFixed(2),
        inheritedPhase: intent.phase,
        missionVersion: intent.missionVersion,
        actions: Object.assign({}, intent.actionCounts)
      });
      sq._leaderlessIntent = null;
      return row;
    }

    return {
      leaderlessActive: leaderlessActive,
      leaderlessStats: leaderlessStats,
      leaderlessTelemetry: leaderlessTelemetry,
      captureLeaderlessIntent: captureLeaderlessIntent,
      updateLeaderlessLocalTask: updateLeaderlessLocalTask,
      noteLeaderlessAction: noteLeaderlessAction,
      endLeaderlessIntent: endLeaderlessIntent,
      controllerSuccession: controllerSuccession,
      noteControllerSuccession: noteControllerSuccession
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
