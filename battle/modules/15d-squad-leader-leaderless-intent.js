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
    return !!(
      LEADERLESS_INTENT_ON &&
      sq &&
      !leaderAlive(sq) &&
      alive(sq).length
    );
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
      noteLeaderlessAction: noteLeaderlessAction,
      endLeaderlessIntent: endLeaderlessIntent
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
