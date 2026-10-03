/* M3C meso-level squad-command owner.
   The General's mission brief (`_macroMission`) says what the squad must achieve; this module is
   the Squad Leader layer that executes it. It is the only runtime writer of the squad's commandPhase,
   objective point, route legs and routeIndex, and it owns:

     - mission execution: route legs, corner pauses, objective phase, doctrine holds,
     - one tactical command lease (`_engagementPlan`),
     - one cohesion/regroup state,
     - one set of committed fireteam slots,
     - fire and movement: whether the squad may assault and which fireteam bounds.

   It never selects an objective. When a doctrine hold/support/regroup commitment ends it escalates to
   the General through `_macroMissionRequest`.

   It does NOT choose soldier cover, stance, physical paths or soldier.destination. Those are micro
   responsibilities. Contact may change micro combat behaviour without silently rewriting the meso
   formation plan. */
(function (root) {
  'use strict';
  if (!root.BattleModules || !root.SquadAI || root.BattleSquadStability) return;
  var L = root.BattleLeases;
  /* The Squad Leader's lease kinds. Priority orders them when several are live (what is holding the
     squad most); timer kinds are pure clocks that prune() may end once expired; progress tests are
     read-only answers to "is this hold getting anywhere?" for diagnostics and the AI Graph. */
  function num(v) {
    return isFinite(+v) ? Math.round(+v) : null;
  }
  L.define('succession', {
    priority: 95,
    progress: function (sq, l, t) {
      var intent = l && l.data && l.data.intent,
        action = intent && intent.lastAction;
      return {
        ok: null,
        detail:
          'leaderless ' +
          (t - l.since).toFixed(1) +
          ' s' +
          (action ? '; ' + action : intent && intent.phase ? '; inherited ' + intent.phase : '')
      };
    }
  });
  L.define('retreat-anchor', {
    priority: 92,
    progress: function (sq, l, t) {
      var d = l && l.data,
        best = d && isFinite(+d.bestDistance) ? +d.bestDistance : null,
        now = d && isFinite(+d.distance) ? +d.distance : null,
        quiet = d && isFinite(+d.lastProgressAt) ? Math.max(0, t - d.lastProgressAt) : null;
      return {
        ok: now == null || best == null ? null : now <= best + 0.5,
        detail:
          'retreat anchor ' +
          (now == null ? '?' : now.toFixed(1)) +
          ' m away; no-progress ' +
          (quiet == null ? '?' : quiet.toFixed(1)) +
          ' s'
      };
    }
  });
  L.define('regroup', {
    priority: 90,
    progress: function (sq, l) {
      var now = sq._cohesionAssessment && sq._cohesionAssessment.coreSpread,
        start = l.data && l.data.startSpread;
      if (!isFinite(+now) || !isFinite(+start)) return null;
      return { ok: +now < +start, detail: 'core spread ' + num(start) + ' → ' + num(now) + ' m' };
    }
  });
  L.define('tactical-plan', {
    priority: 70,
    progress: function (sq) {
      var p = sq._engagementPlan;
      return p ? { ok: p.status === 'active' ? true : null, detail: p.phase + ' plan ' + p.status } : null;
    }
  });
  L.define('bound', {
    priority: 60,
    timer: true,
    progress: function (sq, l) {
      return { ok: null, detail: 'fireteam ' + ((l.data && l.data.team) || '?') + ' moving' };
    }
  });
  /* Scouts Forward is one Squad Leader-owned command commitment. It deliberately is not a timer
     lease: the owner ends it with an explicit reason (contact, observation complete, timeout,
     command invalidation), so expiry can never silently leave the main body held. */
  L.define('recon', {
    priority: 68,
    progress: function (sq, l, t) {
      var task = sq && sq._reconTask,
        moved = task ? reconDistance(task) : 0;
      return {
        ok: task ? true : null,
        detail:
          'scouts ' +
          ((task && task.scoutIds && task.scoutIds.length) || 0) +
          '; ' +
          moved.toFixed(1) +
          ' m; ' +
          Math.max(0, t - l.since).toFixed(1) +
          ' s'
      };
    }
  });
  L.define('corner-hold', { priority: 30, timer: true });
  L.define('regroup-cooldown', { priority: 20, timer: true });
  L.define('bound-cycle', { priority: 15, timer: true });
  L.define('regroup-bypass', { priority: 10, timer: true });

  var ASSAULT_LEASE = 26,
    DEFENSE_LEASE = 38,
    QUIET_CLOSE = 9,
    TEAM_LEASE = 12;
  var REGROUP_ENTER = 1.35,
    REGROUP_RELEASE = 0.78,
    REGROUP_MIN = 2.4,
    REENTRY = 4;
  var STRAGGLER_BYPASS = 2.8,
    URBAN_ARRIVAL_COHESION = 0.5;
  var BOUND_CYCLE = 9.0,
    BOUND_DURATION = 3.6,
    BOUND_TEAMS = ['alpha', 'bravo', 'charlie'],
    ASSAULT_PHASES = { assault: 1, capture: 1, 'clear-town': 1 };
  var ASSEMBLY_HOME_RADIUS = 20,
    SUCCESSION_DELAY = 6;
  var ORDER_STRIDE = 13,
    ORDER_ARRIVAL_RADIUS = 8,
    ORDER_COHESION = 0.55,
    ORDER_PUBLISH_EPS = 0.05,
    FOLLOW_LAG = 2,
    /* Retreat anchor stability: keep one useful Meso endpoint while the men are making progress.
       The lease slides on progress; arrival, a materially changed retreat goal, a blocked/unsafe
       endpoint, or measured no-progress may replace it. Movement Resolver still legalizes each man's
       physical destination. */
    RETREAT_ANCHOR_LEASE = 6,
    RETREAT_ANCHOR_ARRIVE = 5,
    RETREAT_PROGRESS_EPS = 0.75,
    RETREAT_GOAL_EPS = 6,
    RETREAT_NO_PROGRESS = 6,
    RETREAT_BLOCKED_MIN = 2,
    RETREAT_DANGER_MARGIN = 5,
    RETREAT_RECOVERY_STRIDE = 0.5;

  /* Scouts Forward is on by default after PR #196's deterministic checks and 36-pair full-battle
     benchmark (run 37117876560); ?scoutsForward=0/off/false is the stable legacy arm. The slice
     depends on the per-man belief and tactical-callout channels: without them there is no legitimate
     way for the leader/main body to learn what a scout saw. */
  function parseScoutsForward(search) {
    return !/[?&]scoutsForward=(?:0|off|false)(?:&|#|$)/i.test(search || '');
  }
  var SCOUTS_FORWARD_ON = parseScoutsForward(
    typeof location !== 'undefined' ? location.search || '' : ''
  );
  var RECON_TUNING = {
    lookAhead: 46,
    objectiveApproach: 78,
    minGoalDistance: 20,
    advance: 28,
    pastScreen: 7,
    arrive: 4.5,
    observe: 2.2,
    timeout: 18,
    reportWatch: 5,
    /* Maximum grace for the main body to close the deliberate scout lead after a no-contact
       release. The existing regroup-bypass lease ends early as soon as the scouts are back inside
       the normal release band; this is a ceiling, not a blind hold timer. */
    rejoin: 9,
    pictureAge: 8,
    pictureConfidence: 0.45,
    terrainSamples: 12,
    eye: 1.55
  };
  var RECON_PHASES = { approach: 1, assault: 1, flank: 1 };

  /* Leaderless intent continuation is deliberately opt-in while this slice is being proved.
     During the existing six-second succession lease there is no substitute Squad Leader: Meso command
     evolution freezes and the men may only finish already-published movement, keep valid local cover/
     buddy behavior, react through Engagement, retreat for survival, and report/request help upward.
     The new leader resumes ordinary ownership after succession. */
  function parseLeaderlessIntent(search) {
    search = search || '';
    if (/[?&]leaderlessIntent=(?:0|off|false)(?:&|#|$)/i.test(search)) return false;
    return /[?&]leaderlessIntent=(?:1|on|true)(?:&|#|$)/i.test(search);
  }
  var LEADERLESS_INTENT_ON = parseLeaderlessIntent(
    typeof location !== 'undefined' ? location.search || '' : ''
  );
  var LEADERLESS_TUNING = {
    successionSeconds: SUCCESSION_DELAY
  };
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
        helpRequests: 0,
        seconds: 0,
        actions: {},
        recent: []
      })
    );
  }
  function leaderlessTelemetry(battle) {
    var st = battle && battle._leaderlessIntentStats;
    if (!LEADERLESS_INTENT_ON || !st) return null;
    return JSON.parse(JSON.stringify(st));
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
        actionCounts: {},
        helpRequested: false
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
  function requestLeaderlessHelp(sq, battle, why) {
    var intent = sq && sq._leaderlessIntent,
      m = sq && sq._macroMission;
    if (!intent || intent.helpRequested || !m) return false;
    var existing = sq._macroMissionRequest;
    if (existing && existing.missionVersion === m.version) return false;
    sq._macroMissionRequest = {
      missionVersion: m.version,
      reason: 'leaderless-help',
      why: why || 'leaderless contact',
      at: battle.time
    };
    intent.helpRequested = true;
    var st = leaderlessStats(battle);
    if (st) st.helpRequests++;
    telemetry(battle, 'decision-captain-request', {
      faction: sq.faction,
      squad: sq.id,
      version: m.version,
      reason: 'leaderless-help',
      why: why || 'leaderless contact'
    });
    return true;
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

  /* Buddy pairs are a Squad Leader / fireteam execution aid, not a command layer. They are on by
     default after standard benchmark #272; ?buddyPairs=0/off/false is the legacy control. Pair state
     is owned here. Runtime readers are this module's fire-and-movement selector only; diagnostics and
     probes read snapshots. A pair never writes a destination and never calls the Movement Resolver. */
  function parseBuddyPairs(search) {
    return !/[?&]buddyPairs=(?:0|off|false)(?:&|$)/i.test(search || '');
  }
  var BUDDY_PAIRS_ON = parseBuddyPairs(typeof location !== 'undefined' ? location.search : '');
  var BUDDY_TUNING = {
    maxSeparation: 16,
    reformSeparation: 10,
    maxRouteGap: 8,
    reformRouteGap: 5,
    reformDelay: 1.5
  };
  /* 3b: group morale. On by default (owner decision, 2026-10-01); ?morale=0 is the flat 60% rule. Replaces the flat 60% casualty retreat with a
     squad-level break/rally model driven by the squad.mind roll-up (module 17). The break
     threshold is breakBase for calm men (the flat 60% rule) and moves down by breakSlope per
     unit of mean stress, never below breakMin. A retreating squad rallies once its men are calm
     (mean stress < rallyStress) and it sits rallyGap of a casualty fraction below where it would
     break at that stress, so a squad that broke early on stress can come back, one the flat rule
     breaks (60%) never can, and none can break again on the next tick. */
  var MORALE_ON = !(typeof location !== 'undefined' && /[?&]morale=0\b/.test(location.search || ''));
  var MORALE_TUNING = {
    breakBase: 0.6,
    breakSlope: 0.3,
    breakMin: 0.25,
    rallyStress: 0.15,
    rallyGap: 0.05
  };
  /* A squad's mean stress as the Squad Leader reads it, group morale and the COA alike: through the soldier condition's
     own accessor, so `?mind=0`, `?mind=observe` and a lever list without `morale` read calm men (the flat 60% rule);
     without the module (the harness checks that script a roll-up) it is the roll-up itself. */
  function squadStress(sq) {
    var M = root.BattleSoldierMind;
    if (M && M.squadStress) return M.squadStress(sq);
    return (sq && sq.mind && sq.mind.mean) || 0;
  }
  /* The casualty fraction at which a squad under this mean stress breaks (the flat 60% rule at zero). */
  function moraleBreakAt(stress) {
    return Math.max(MORALE_TUNING.breakMin, MORALE_TUNING.breakBase - MORALE_TUNING.breakSlope * stress);
  }
  /* Whether a retreating squad rallies. The ceiling on casualties is not a number of its own: it is the break
     threshold at the present stress less rallyGap, which is what makes break and rally a hysteresis by
     construction (casualtyFrac < breakAt - gap means the break test on the same inputs is false). */
  function moraleRallies(casualtyFrac, stress) {
    return stress < MORALE_TUNING.rallyStress && casualtyFrac < moraleBreakAt(stress) - MORALE_TUNING.rallyGap;
  }
  /* 3c: course of action on contact. On by default; ?coa=0/off is the legacy no-COA control. The Squad Leader (the one COA owner) scores the
     declared COAs against declared inputs on every tick the squad is in contact and keeps the winner as
     sq.coa, so a squad whose casualties, stress or leader change inside a contact changes its COA inside it,
     and a contact that blinks is not a new decision. Scoring is deterministic: weighted sum, no RNG; ties
     break by COA name order, so the choice is a pure function of squad state at that tick. There is no
     margin or latch: a margin was measured (Part B of the 3b/3c work) and, because casualties never heal and
     stress only falls, it latched squads in defend (fewer bounds, more battles still open at 600 s). The
     COA gates bounding through fireAndMovement: defend holds (no bounds), assault bounds if the phase
     allows. COAs only restrict, never expand. */
  var COA_ON = !(typeof location !== 'undefined' && /[?&]coa=(?:0|off|false)\b/.test(location.search || ''));
  var COAS = {
    assault: { label: 'assault', bounds: true },
    defend: { label: 'defend', bounds: false }
  };
  var COA_INPUTS = {
    casualtyFrac: function (sq) {
      var living = 0, m = sq.members || [];
      for (var i = 0; i < m.length; i++) if (m[i] && !m[i].dead) living++;
      return 1 - living / root.SquadAI.establishment(sq);
    },
    stress: function (sq) {
      return squadStress(sq);
    },
    leaderDown: function (sq) {
      return root.SquadAI.leaderOf(sq) ? 0 : 1;
    }
  };
  var COA_WEIGHTS = {
    assault: { base: 1.0, casualtyFrac: -2.0, stress: -1.0, leaderDown: -1.5 },
    defend: { base: 0.0, casualtyFrac: 0.5, stress: 0.5, leaderDown: 0.5 }
  };
  var COA_TUNING = { weights: COA_WEIGHTS };
  /* The declared inputs, read off a squad once; the scores and the choice are then pure functions of
     that record (the same arithmetic in the same order as before, so the probes and checks can score
     recorded inputs with the shipping tables instead of a copy). */
  function coaInputsOf(sq) {
    var out = {};
    for (var k in COA_INPUTS) out[k] = COA_INPUTS[k](sq);
    return out;
  }
  function coaScore(coa, inputs) {
    var w = COA_WEIGHTS[coa], s = w.base || 0, v;
    for (var k in COA_INPUTS) {
      v = w[k] || 0;
      if (v) s += v * inputs[k];
    }
    return s;
  }
  function decideCOA(inputs) {
    var names = Object.keys(COAS).sort(), best = names[0], bestScore = -Infinity, s;
    for (var i = 0; i < names.length; i++) {
      s = coaScore(names[i], inputs);
      if (s > bestScore + 1e-9) { bestScore = s; best = names[i]; }
    }
    return best;
  }
  /* The COA the squad holds after this tick: the better score on its inputs now. Called each tick the squad is
     in contact, never out of it. */
  function updateCOA(sq) {
    return (sq.coa = decideCOA(coaInputsOf(sq)));
  }

  /* Fire discipline. A sighting is a request to the Squad Leader, not permission to shoot.
     ?fireControl=0 is the old immediate-fire control for paired A/B work. The state is squad-owned:
       hold      everybody prepares prone and stays silent;
       precision one designated marksman may fire, the rest stay prepared;
       open      ordinary Engagement fire/suppression is allowed.
     Incoming fire always escalates to open and an individual under fire may return it immediately. */
  var FIRE_CONTROL_ON = !(
    typeof location !== 'undefined' && /[?&]fireControl=(?:0|off|false)\b/.test(location.search || '')
  );
  var FIRE_CONTROL_TUNING = {
    prepMin: 1.2,
    readyFraction: 0.7,
    minReady: 3,
    longRange: 140,
    closeRange: 85,
    minStrength: 0.55,
    minMarksmanship: 0.42,
    precisionMarksmanship: 0.62,
    maxHold: 6,
    crestStep: 0.75,
    crestMax: 6,
    returnFireWindow: 3
  };
  function mkm(s) {
    var St = root.BattleSoldierStats;
    return St && St.of ? +St.of(s).mkm || 0 : 0.5;
  }
  function firstHandContact(sq, battle) {
    var c = root.SquadAI.squadContact ? root.SquadAI.squadContact(sq, battle) : sq.contact,
      d = c && c.unit && root.SquadAI.threatDisposition ? root.SquadAI.threatDisposition(c.unit) : null,
      own = root.SquadAI.hasFirstHandMemory
        ? root.SquadAI.hasFirstHandMemory(c, battle)
        : !!(c && !c.heard && !c.relayedFrom);
    /* Relayed word alone still cannot create fire permission. If this squad saw the SAME enemy itself
       within contact memory, however, a newer callout may refine the position without tearing down
       and rebuilding the existing HOLD/PRECISION episode. */
    return c && c.unit && (!d || d.combatThreat) && own ? c : null;
  }
  function fireControlRange(sq, c) {
    var p = average(sq);
    return p && c ? dist(p, c) : Infinity;
  }
  function precisionShooter(men, target, battle) {
    var best = null,
      bestScore = -Infinity;
    for (var i = 0; i < men.length; i++) {
      var s = men[i],
        sp = s && s.root && s.root.position,
        tp = target && target.root && target.root.position,
        shotRange = sp && tp ? dist(sp, tp) : Infinity;
      /* Range is shooter-specific. Using the squad-average contact distance here rejects a man who
         has actually crept into range at the crest, which is exactly the man this selection needs. */
      if (!s.weapon || root.SquadAI.isMachineGun(s) || root.SquadAI.engageRange(s) < shotRange) continue;
      var roleBonus = s.role === 'sniper' ? 0.2 : s.role === 'scout' ? 0.12 : s.role === 'rifleman' ? 0.03 : 0,
        score = mkm(s) + roleBonus;
      if (
        score > bestScore + 1e-9 ||
        (Math.abs(score - bestScore) <= 1e-9 && best && String(s.id) < String(best.id))
      ) {
        best = s;
        bestScore = score;
      }
    }
    return best;
  }
  function fireControlTelemetry(sq, battle, fc) {
    telemetry(battle, 'decision-fire-control', {
      faction: sq.faction,
      squad: sq.id,
      state: fc.state,
      reason: fc.reason,
      target: fc.targetId,
      shooter: fc.shooterId,
      range: isFinite(fc.range) ? +fc.range.toFixed(1) : null,
      strength: +fc.strength.toFixed(2),
      marksmanship: +fc.marksmanship.toFixed(2),
      ready: fc.ready,
      requiredReady: fc.requiredReady,
      living: fc.living,
      visualLine: fc.visualLine,
      ballisticLine: fc.ballisticLine,
      terrainCrestBlocked: fc.terrainCrestBlocked,
      proneReady: fc.proneReady
    });
  }
  function fireControlTrailEntry(battle, state, reason, fc) {
    return {
      at: battle.time,
      state: state,
      reason: reason || null,
      targetId: fc && fc.targetId != null ? fc.targetId : null,
      shooterId: fc && fc.shooterId != null ? fc.shooterId : null,
      ready: fc ? +fc.ready || 0 : 0,
      requiredReady: fc ? +fc.requiredReady || 0 : 0,
      living: fc ? +fc.living || 0 : 0
    };
  }
  function pushFireControlTrail(sq, battle, state, reason, fc) {
    var trail = sq._fireControlTrail || (sq._fireControlTrail = []),
      prev = trail.length ? trail[trail.length - 1] : null;
    if (!prev || prev.state !== state || prev.reason !== reason) {
      trail.push(fireControlTrailEntry(battle, state, reason, fc));
      if (trail.length > 8) trail.splice(0, trail.length - 8);
    }
    return trail;
  }
  function fireControlCounts(men, battle, E) {
    var out = {
        ready: 0,
        visualLine: 0,
        ballisticLine: 0,
        terrainCrestBlocked: 0,
        proneReady: 0
      },
      i;
    for (i = 0; i < men.length; i++) {
      var o =
          E && E.fireControlObservation
            ? E.fireControlObservation(men[i], battle)
            : { ready: false },
        ready = E && E.fireControlReady ? E.fireControlReady(men[i], battle) : !!o.ready;
      /* The leader's decision keeps the existing readiness API as its authority. The richer
         observation is diagnostics only, so tests/tools (and any future readiness policy) can
         override fireControlReady without being bypassed by instrumentation. */
      if (ready) out.ready++;
      if (o.visualLine) out.visualLine++;
      if (o.ballisticLine) out.ballisticLine++;
      if (o.terrainCrestBlocked) out.terrainCrestBlocked++;
      if (o.proneReady) out.proneReady++;
    }
    return out;
  }
  function setFireControl(sq, battle, prev, state, reason, data) {
    data = data || {};
    var fc = {
      state: state,
      since: battle.time,
      startedAt: prev && isFinite(+prev.startedAt) ? +prev.startedAt : battle.time,
      targetId: data.targetId == null ? (prev && prev.targetId) : data.targetId,
      shooterId: data.shooterId == null ? null : data.shooterId,
      reason: reason,
      range: isFinite(+data.range) ? +data.range : prev && isFinite(+prev.range) ? +prev.range : Infinity,
      strength: isFinite(+data.strength) ? +data.strength : prev ? +prev.strength || 0 : 0,
      marksmanship: isFinite(+data.marksmanship) ? +data.marksmanship : prev ? +prev.marksmanship || 0 : 0,
      ready: data.ready == null ? (prev ? +prev.ready || 0 : 0) : +data.ready || 0,
      requiredReady:
        data.requiredReady == null ? (prev ? +prev.requiredReady || 0 : 0) : +data.requiredReady || 0,
      living: data.living == null ? (prev ? +prev.living || 0 : 0) : +data.living || 0,
      visualLine: data.visualLine == null ? (prev ? +prev.visualLine || 0 : 0) : +data.visualLine || 0,
      ballisticLine:
        data.ballisticLine == null ? (prev ? +prev.ballisticLine || 0 : 0) : +data.ballisticLine || 0,
      terrainCrestBlocked:
        data.terrainCrestBlocked == null
          ? prev
            ? +prev.terrainCrestBlocked || 0
            : 0
          : +data.terrainCrestBlocked || 0,
      proneReady: data.proneReady == null ? (prev ? +prev.proneReady || 0 : 0) : +data.proneReady || 0
    };
    sq.fireControl = fc;
    fc.trail = pushFireControlTrail(sq, battle, state, reason, fc).slice();
    fireControlTelemetry(sq, battle, fc);
    return fc;
  }
  function clearFireControl(sq, battle, reason) {
    if (sq.fireControl) {
      pushFireControlTrail(sq, battle, 'clear', reason || 'contact clear', sq.fireControl);
      telemetry(battle, 'decision-fire-control', {
        faction: sq.faction,
        squad: sq.id,
        state: 'clear',
        reason: reason || 'contact clear',
        trail: (sq._fireControlTrail || []).slice()
      });
    }
    sq.fireControl = null;
  }
  function updateFireControl(sq, battle, report) {
    if (!FIRE_CONTROL_ON || !sq || !battle) return null;
    var c = firstHandContact(sq, battle),
      fc = sq.fireControl;
    if (!c) return fc || null; // heard/relayed word never creates permission to fire.
    if (fc && fc.state === 'open') return fc;
    if (!fc || (fc.targetId != null && String(fc.targetId) !== String(c.unit.id))) {
      fc = setFireControl(sq, battle, null, 'hold', 'first visual contact', { targetId: c.unit.id });
    }
    if ((report && report.underFire) > 0) {
      return setFireControl(sq, battle, fc, 'open', 'enemy fire received', { targetId: c.unit.id });
    }
    var men = commanded(sq),
      living = men.length,
      sum = 0,
      E = root.BattleEngagement,
      counts = fireControlCounts(men, battle, E),
      i;
    for (i = 0; i < living; i++) sum += mkm(men[i]);
    var strength = living / Math.max(1, root.SquadAI.establishment(sq)),
      meanMkm = living ? sum / living : 0,
      range = fireControlRange(sq, c),
      needed = Math.min(
        living,
        Math.max(FIRE_CONTROL_TUNING.minReady, Math.ceil(living * FIRE_CONTROL_TUNING.readyFraction))
      ),
      elapsed = battle.time - fc.startedAt,
      ready = counts.ready;
    fc.range = range;
    fc.strength = strength;
    fc.marksmanship = meanMkm;
    fc.ready = ready;
    fc.requiredReady = needed;
    fc.living = living;
    fc.visualLine = counts.visualLine;
    fc.ballisticLine = counts.ballisticLine;
    fc.terrainCrestBlocked = counts.terrainCrestBlocked;
    fc.proneReady = counts.proneReady;
    fc.targetId = c.unit.id;
    fc.trail = (sq._fireControlTrail || []).slice();

    if (!leaderAlive(sq)) return fc; // succession or return fire, never an invisible leader decision.
    if (fc.state === 'precision') return fc;

    if (range >= FIRE_CONTROL_TUNING.longRange && elapsed >= FIRE_CONTROL_TUNING.prepMin) {
      var shot = precisionShooter(men, c.unit, battle);
      if (
        shot &&
        mkm(shot) >= FIRE_CONTROL_TUNING.precisionMarksmanship &&
        E &&
        E.fireControlReady &&
        E.fireControlReady(shot, battle)
      )
        return setFireControl(sq, battle, fc, 'precision', 'long-range marksman', {
          targetId: c.unit.id,
          shooterId: shot.id,
          range: range,
          strength: strength,
          marksmanship: meanMkm,
          ready: ready,
          living: living
        });
    }

    var prepared = ready >= needed && elapsed >= FIRE_CONTROL_TUNING.prepMin,
      willing =
        range <= FIRE_CONTROL_TUNING.closeRange ||
        (strength >= FIRE_CONTROL_TUNING.minStrength && meanMkm >= FIRE_CONTROL_TUNING.minMarksmanship);
    if (prepared && willing)
      return setFireControl(sq, battle, fc, 'open', 'squad prepared', {
        targetId: c.unit.id,
        range: range,
        strength: strength,
        marksmanship: meanMkm,
        ready: ready,
        living: living
      });

    /* A prone ambush posture is preferred, not a suicide pact with terrain. If the entire squad has
       spent the preparation window with zero usable firing lines, the Squad Leader keeps HOLD FIRE but
       releases the forced-prone drill so Engagement may seek fighting cover / a better local position.
       Permission still stays closed; normal trigger and suppression paths remain gated. */
    if (elapsed >= FIRE_CONTROL_TUNING.maxHold && ready === 0 && fc.state !== 'reposition')
      return setFireControl(sq, battle, fc, 'reposition', 'no viable prone firing line', {
        targetId: c.unit.id,
        range: range,
        strength: strength,
        marksmanship: meanMkm,
        ready: ready,
        living: living
      });
    /* Do not deadlock forever on one awkward crest. After a deliberate hold, two usable rifles are
       enough for the leader to accept the engagement even if the 70% preparation target was impossible. */
    if (elapsed >= FIRE_CONTROL_TUNING.maxHold && ready >= Math.min(2, living))
      return setFireControl(sq, battle, fc, 'open', 'leader accepted partial firing line', {
        targetId: c.unit.id,
        range: range,
        strength: strength,
        marksmanship: meanMkm,
        ready: ready,
        living: living
      });
    return fc;
  }
  var TACTICAL = {
    assault: 1,
    flank: 1,
    capture: 1,
    defend: 1,
    hold: 1,
    'support-hold': 1,
    'clear-town': 1
  };
  var DEFENSIVE = { capture: 1, defend: 1, hold: 1, 'support-hold': 1 };
  var EMERGENCY = { retreat: 1, regroup: 1 };

  function point(p) {
    return p && isFinite(+p.x) && isFinite(+p.z) ? { x: +p.x, z: +p.z } : null;
  }
  function copy(p) {
    return p ? { x: +p.x || 0, z: +p.z || 0 } : null;
  }
  function dist(a, b) {
    return a && b ? Math.hypot((+a.x || 0) - (+b.x || 0), (+a.z || 0) - (+b.z || 0)) : Infinity;
  }
  function telemetry(sim, type, data) {
    if (root.BattleTelemetry) root.BattleTelemetry.record(type, data, sim);
  }
  function leaseSeconds(phase) {
    return DEFENSIVE[phase] ? DEFENSE_LEASE : ASSAULT_LEASE;
  }
  function signature(sq) {
    var p = (sq && sq.objective) || {};
    return [
      String((sq && sq.commandPhase) || ''),
      String((sq && sq.targetObjective) || ''),
      Math.round((+p.x || 0) / 4),
      Math.round((+p.z || 0) / 4)
    ].join('|');
  }
  function leaderAlive(sq) {
    return !!root.SquadAI.leaderOf(sq);
  }
  function alive(sq) {
    return ((sq && sq.members) || []).filter(function (s) {
      return s && !s.dead && s.root && s.root.position;
    });
  }
  /* The men this squad commands: the living, bar one who has fled (Engagement `fledPhase`). A fled man is on his own
     until he is at base, running to his refuge, waiting or going home, so where he is says nothing about whether the
     squad is scattered, and a squad that took him in and rallied must not regroup, or wait to advance, on his account
     (the regroup order outranks his flee: he was pulled back every ~10 s and never got home). */
  function commanded(sq) {
    var E = root.BattleEngagement;
    return alive(sq).filter(function (s) {
      return !(E && E.fledPhase && E.fledPhase(s));
    });
  }
  function average(sq) {
    var a = alive(sq),
      x = 0,
      z = 0;
    if (!a.length) return null;
    for (var i = 0; i < a.length; i++) {
      x += +a[i].root.position.x || 0;
      z += +a[i].root.position.z || 0;
    }
    return { x: x / a.length, z: z / a.length };
  }
  function median(a) {
    if (!a.length) return 0;
    var b = a.slice().sort(function (x, y) {
        return x - y;
      }),
      m = Math.floor(b.length / 2);
    return b.length % 2 ? b[m] : (b[m - 1] + b[m]) * 0.5;
  }
  function cfg(sim, sq) {
    try {
      return root.BattleCommanderDoctrine.policyFor(sim, sq.faction) || {};
    } catch (_) {
      return {};
    }
  }
  /* Command-phase machine. The Squad Leader owns every live entry. Mission execution and cohesion
     evaluate on the 0.45 s commander tick; initial placement enters through initialPhase before it.
     These are execution phases, not the squad's advance/engaged/retreat combat status. Retreat stays
     in sq.state and suspends execution without assigning a new commandPhase.

     A replacement brief can select any mission phase, and cohesion can interrupt any of them.
     Thus every declared phase can reach every other one: the guards are the mission/route/lease
     facts in executeMission and updateCohesion, not the previous phase. A phase alone cannot tell
     whether a new mission has arrived. The data records that full adjacency explicitly rather than
     inventing restrictions on the existing execution logic. Same-phase calls change nothing. */
  var PHASE_NAMES = [
    'approach',
    'reserve',
    'hold',
    'support-hold',
    'corner-check',
    'assault',
    'capture',
    'defend',
    'flank',
    'clear-town',
    'regroup'
  ];
  function phaseDefinition(meaning, enteredBy, exits) {
    return {
      meaning: meaning,
      enteredBy: enteredBy,
      exits: exits,
      rate: '0.45 s commander tick; setup may enter before the first tick',
      next: PHASE_NAMES.slice()
    };
  }
  var PHASE_STATES = {
    approach: phaseDefinition(
      'Follow the approach route',
      'mission execution or route setup',
      'route/area progress, new brief or regroup'
    ),
    reserve: phaseDefinition(
      'Hold the reserve route endpoint',
      'reserve brief, role or route setup',
      'reserve commitment/new brief or regroup'
    ),
    hold: phaseDefinition(
      'Hold the mission endpoint or accepted hold point',
      'hold brief or doctrine hold/regroup action',
      'doctrine review/new brief or regroup'
    ),
    'support-hold': phaseDefinition(
      'Hold while supporting the assault',
      'support delay or doctrine support action',
      'assault commitment, support delay expiry, new brief or regroup'
    ),
    'corner-check': phaseDefinition(
      'Pause after an urban route leg',
      'mission execution at an urban corner',
      'corner-hold lease expiry, new brief or regroup'
    ),
    assault: phaseDefinition(
      'Approach the assigned objective',
      'mission execution outside the commit radius',
      'capture/defend radius reached, new brief or regroup'
    ),
    capture: phaseDefinition(
      'Commit inside the capture area',
      'capture brief inside its commit radius',
      'leaving the commit radius, objective completion/new brief or regroup'
    ),
    defend: phaseDefinition(
      'Defend the assigned objective',
      'defend brief inside its radius or with a defense request; garrison setup',
      'leaving the radius without a request, changed control/new brief or regroup'
    ),
    flank: phaseDefinition(
      'Complete the flank approach leg',
      'flank action at the approach-axis endpoint',
      'route progress, new brief or regroup'
    ),
    'clear-town': phaseDefinition(
      'Execute an approach route inside the town',
      'mission execution inside the town area',
      'leaving the area, route progress, new brief or regroup'
    ),
    regroup: phaseDefinition(
      'Re-form on the committed rally point',
      'Squad Leader cohesion assessment',
      'cohesion restored after REGROUP_MIN, contact, retreat, new mission or no survivors'
    )
  };
  function transitionPhase(sim, sq, next, why, entry) {
    if (!sq || sq.commandPhase === next) return;
    var from = sq.commandPhase || null;
    entry = entry || 'mission';
    if (!PHASE_STATES[next] || (PHASE_STATES[from] && PHASE_STATES[from].next.indexOf(next) < 0))
      throw new Error('Illegal Squad Leader phase transition: ' + from + ' -> ' + next);
    if (['mission', 'setup', 'regroup'].indexOf(entry) < 0)
      throw new Error('Unknown Squad Leader phase entry: ' + entry);
    sq.commandPhase = next;
    sq._commandPhaseTransition = {
      from: from,
      to: next,
      at: sim && isFinite(+sim.time) ? +sim.time : null,
      reason: why || '',
      entry: entry
    };
    if (entry === 'mission')
      telemetry(sim, 'decision-phase', { faction: sq.faction, squad: sq.id, phase: next, why: why || '' });
  }
  /* Setup and regroup were silent phase writes; preserve their existing distinct telemetry. */
  function initialPhase(sq, phase) {
    transitionPhase(null, sq, phase, 'initial placement', 'setup');
  }
  function setPhase(sim, sq, next, why) {
    transitionPhase(sim, sq, next, why);
  }
  function commandForward(sq) {
    var a = sq.orderAnchor || sq.rally || { x: 0, z: 0 },
      g = sq.objective || sq.home || a,
      dx = (+g.x || 0) - (+a.x || 0),
      dz = (+g.z || 0) - (+a.z || 0),
      l = Math.hypot(dx, dz);
    if (l < 0.1) {
      /* A regroup points sq.objective at its own anchor, so the objective axis collapses; the regroup
         keeps the direction the squad was marching when it opened. `_formationForward` is only set
         by SquadAI.formationSlot (men with no order destination), so it is usually absent. */
      var rg = L.get(sq, 'regroup'),
        f = (rg && rg.data && rg.data.forward) || sq._formationForward,
        fl = f ? Math.hypot(+f.x || 0, +f.z || 0) : 0;
      if (fl > 1e-6) return { x: (+f.x || 0) / fl, z: (+f.z || 0) / fl };
    }
    return { x: dx / (l || 1), z: dz / (l || 1) };
  }
  /* The forward line: where the forward majority of a group of men actually is along the advance
     axis, not their average. Each man is projected on the axis; the front-most half (rounded up) is
     the forward group, and any man within COVER_BAND behind the rearmost of them joins it, since men
     taking different cover along one line stand a few metres apart in depth. The line sits at the
     group's mean, so stragglers behind cannot drag it back and one man out front cannot pull it all
     the way forward: two men up front, one just behind them and two far back put it between the
     front pair and the middle man, two thirds of the way to the front. {at: distance along the axis
     (position . axis), point: the group's mean position, men, of}. */
  var COVER_BAND = 5;
  function forwardMajority(men, axis) {
    var rows = [],
      i;
    for (i = 0; i < men.length; i++) {
      var p = men[i].root.position,
        x = +p.x || 0,
        z = +p.z || 0;
      rows.push({ at: x * axis.x + z * axis.z, x: x, z: z, id: +men[i].id || 0 });
    }
    if (!rows.length) return null;
    rows.sort(function (a, b) {
      return b.at - a.at || a.id - b.id;
    });
    var k = Math.ceil(rows.length / 2),
      floor = rows[k - 1].at - COVER_BAND;
    while (k < rows.length && rows[k].at >= floor) k++;
    var at = 0,
      mx = 0,
      mz = 0;
    for (i = 0; i < k; i++) {
      at += rows[i].at;
      mx += rows[i].x;
      mz += rows[i].z;
    }
    return { at: at / k, point: { x: mx / k, z: mz / k }, men: k, of: rows.length };
  }
  /* Published each command tick for the squad and each fireteam (sq._forwardLine); cleared in retreat,
     where backward is the order. The regroup rally point is the squad's forward-majority point. */
  function publishForwardLine(sq, battle) {
    var men = alive(sq);
    if (sq.state === 'retreat' || !men.length) {
      sq._forwardLine = null;
      return;
    }
    var axis = commandForward(sq),
      line = forwardMajority(men, axis);
    if (!line) {
      sq._forwardLine = null;
      return;
    }
    var groups = {},
      i;
    for (i = 0; i < men.length; i++) {
      var key = men[i]._fireteamKey || teamKeyFor(men[i]);
      (groups[key] = groups[key] || []).push(men[i]);
    }
    line.axis = { x: axis.x, z: axis.z };
    line.band = COVER_BAND;
    line.t = battle ? battle.time : 0;
    line.teams = {};
    Object.keys(groups)
      .sort()
      .forEach(function (key) {
        line.teams[key] = forwardMajority(groups[key], axis);
      });
    sq._forwardLine = line;
  }
  function publishStats(battle) {
    return (
      battle._squadCommandPublishStats ||
      (battle._squadCommandPublishStats = { intentChecks: 0, intentPublishes: 0, intentCoalesced: 0 })
    );
  }

  function tasksFor(phase) {
    if (phase === 'defend' || phase === 'hold')
      return { command: 'control', alpha: 'hold-left', bravo: 'hold-right', charlie: 'local-reserve' };
    if (phase === 'flank')
      return { command: 'control', alpha: 'support-by-fire', bravo: 'flank', charlie: 'follow-assault' };
    if (phase === 'capture' || phase === 'clear-town')
      return { command: 'control', alpha: 'support-by-fire', bravo: 'clear/maneuver', charlie: 'secure' };
    if (phase === 'support-hold')
      return { command: 'control', alpha: 'support-by-fire', bravo: 'support-by-fire', charlie: 'security' };
    return { command: 'control', alpha: 'support-by-fire', bravo: 'maneuver', charlie: 'assault/reserve' };
  }
  function teamKeyFor(s) {
    var i = +s.slotIndex || 0;
    if (i <= 1) return 'command';
    if (i === 2 || i === 4 || i === 5) return 'alpha';
    if (i === 3 || i === 6 || i === 7) return 'bravo';
    /* A re-formed squad can carry more than ten men: the extras are dealt round the three fireteams. */
    if (i >= 10) return ['alpha', 'bravo', 'charlie'][(i - 10) % 3];
    return 'charlie';
  }
  function syncTasks(sq, plan) {
    var tasks = (plan && plan.tasks) || null,
      a = (sq && sq.members) || [];
    for (var i = 0; i < a.length; i++) {
      var s = a[i],
        key = s._fireteamKey || teamKeyFor(s);
      s._engagementTask = tasks && key ? tasks[key] || null : null;
      s._engagementPlanSerial = plan ? plan.serial : null;
    }
    sq._engagementTasks = tasks ? JSON.parse(JSON.stringify(tasks)) : null;
  }
  function planSnapshot(p) {
    return p
      ? {
          serial: p.serial,
          status: p.status,
          phase: p.phase,
          targetObjective: p.targetObjective,
          objective: copy(p.objective),
          createdAt: p.createdAt,
          activatedAt: p.activatedAt,
          lastContactAt: p.lastContactAt,
          tasks: p.tasks
        }
      : null;
  }
  function closePlan(sim, sq, reason) {
    var p = sq && sq._engagementPlan;
    if (!p) return false;
    sq._lastEngagementPlan = planSnapshot(p);
    sq._lastEngagementPlan.closedAt = sim.time;
    sq._lastEngagementPlan.closeReason = reason || 'closed';
    L.end(sq, 'tactical-plan', sim.time, reason || 'closed');
    sq._engagementPlan = null;
    sq._stablePlan = null;
    syncTasks(sq, null);
    return true;
  }
  function stagePlan(sim, sq) {
    var phase = String(sq.commandPhase || '');
    if (!TACTICAL[phase] || sq.state === 'retreat' || EMERGENCY[phase]) return null;
    var serial = (+sq._engagementPlanSerial || 0) + 1,
      p = {
        serial: serial,
        status: sq.inContact ? 'active' : 'staged',
        phase: phase,
        targetObjective: sq.targetObjective || null,
        objective: copy(sq.objective),
        missionVersion: missionVersion(sq),
        signature: signature(sq),
        createdAt: sim.time,
        activatedAt: sq.inContact ? sim.time : null,
        lastContactAt: sq.inContact ? sim.time : null,
        tasks: tasksFor(phase)
      };
    /* A staged plan lapses on the clock; contact holds it open; once contact stops it closes after
       QUIET_CLOSE quiet seconds. */
    L.grant(
      sq,
      'tactical-plan',
      'squad-leader',
      sim.time,
      sim.time + leaseSeconds(phase),
      phase + ' plan #' + serial,
      'lease expiry, intent replaced, retreat, or ' + QUIET_CLOSE + ' s without contact',
      { quietSince: null }
    );
    sq._engagementPlanSerial = serial;
    sq._engagementPlan = p;
    sq._stablePlan = p;
    syncTasks(sq, p);
    telemetry(sim, 'decision-plan-commit', {
      faction: sq.faction,
      squad: sq.id,
      serial: serial,
      phase: phase,
      targetObjective: p.targetObjective,
      seconds: leaseSeconds(phase)
    });
    return p;
  }
  function missionVersion(sq) {
    return sq && sq._macroMission ? +sq._macroMission.version || 0 : 0;
  }
  /* A doctrine hold/support/regroup is a bounded commitment, not a new objective. When the Squad Leader's
   plan for it ends (lease or contact closes) the Squad Leader reports back once instead of the General
   re-evaluating doctrine on a timer. */
  var REVIEW_ACTIONS = { hold: 1, support: 1, regroup: 1 };
  function requestReview(sim, sq, why) {
    var m = sq && sq._macroMission;
    if (!m || !REVIEW_ACTIONS[m.action]) return;
    var r = sq._macroMissionRequest;
    if (r && r.missionVersion === m.version) return;
    sq._macroMissionRequest = {
      missionVersion: m.version,
      reason: 'doctrine-review',
      why: why,
      at: sim.time
    };
    telemetry(sim, 'decision-captain-request', {
      faction: sq.faction,
      squad: sq.id,
      version: m.version,
      reason: 'doctrine-review',
      why: why
    });
  }
  function updatePlan(sim, sq) {
    var p = sq._engagementPlan,
      phase = String(sq.commandPhase || ''),
      sig = signature(sq);
    /* Preserve the last valid parent tactical plan during succession. Contact remains a Micro fact,
       but there is nobody present to stage, replace, close or renew a Meso plan. */
    if (leaderlessActive(sq) && sq.state !== 'retreat') {
      if (p) sq._stablePlan = p;
      return;
    }
    if (sq.state === 'retreat' || phase === 'retreat') {
      closePlan(sim, sq, 'retreat');
      sq._planDormantSignature = null;
      return;
    }
    if (sq._planDormantSignature && sq._planDormantSignature !== sig) sq._planDormantSignature = null;
    var lease = p && L.get(sq, 'tactical-plan');
    if (p) {
      if (sq.inContact) {
        sq._planDormantSignature = null;
        if (p.status !== 'active' && p.activatedAt == null) p.activatedAt = sim.time;
        p.status = 'active';
        p.lastContactAt = sim.time;
        lease.data.quietSince = null;
        lease.until = Infinity;
        lease.reason = p.phase + ' plan #' + p.serial + ' in contact';
        L.extend(sq, 'regroup-bypass', 'squad-leader', sim.time, sim.time + 1.25, 'firefight in progress');
      } else if (p.status === 'active' || p.status === 'quiet') {
        if (lease.data.quietSince == null) {
          lease.data.quietSince = sim.time;
          lease.until = sim.time + QUIET_CLOSE;
          lease.reason = p.phase + ' plan #' + p.serial + ' going quiet';
        }
        p.status = 'quiet';
        if (sim.time - lease.data.quietSince >= QUIET_CLOSE) {
          sq._planDormantSignature = p.signature;
          closePlan(sim, sq, 'contact clear');
          requestReview(sim, sq, 'contact clear');
          p = null;
        } else
          L.extend(sq, 'regroup-bypass', 'squad-leader', sim.time, sim.time + 1.25, 'firefight going quiet');
      }
      if (p && p.status === 'staged' && sig !== p.signature) {
        closePlan(sim, sq, 'intent replaced');
        p = null;
      }
      if (p && p.status === 'staged' && !L.holds(sq, 'tactical-plan', sim.time)) {
        closePlan(sim, sq, 'lease expired');
        requestReview(sim, sq, 'lease expired');
        p = null;
      }
    }
    if (
      !sq._engagementPlan &&
      TACTICAL[phase] &&
      !EMERGENCY[phase] &&
      (sq.inContact || sq._planDormantSignature !== sig)
    )
      stagePlan(sim, sq);
    else if (sq._engagementPlan) {
      sq._stablePlan = sq._engagementPlan;
      syncTasks(sq, sq._engagementPlan);
    }
  }

  /* Cohesion is directional. A lagging man may be temporarily excluded so nine men do not march
   backwards to fetch one casualty-delayed rifleman. A man who ran AHEAD is never an ignorable
   straggler: he expands the core, forcing the Squad Leader to restore cohesion instead of allowing two
   scouts to sprint into the next fight alone. Lateral outliers are also non-trimmable. */
  function cohesionAssessment(sq, limit) {
    var m = commanded(sq),
      n = m.length;
    if (!n)
      return {
        center: copy(sq.rally) || { x: 0, z: 0 },
        rawSpread: 0,
        coreSpread: 0,
        stragglers: [],
        outrunners: [],
        members: [],
        dispersed: false,
        allowed: 0
      };
    var xs = [],
      zs = [],
      i;
    for (i = 0; i < n; i++) {
      xs.push(+m[i].root.position.x || 0);
      zs.push(+m[i].root.position.z || 0);
    }
    var med = { x: median(xs), z: median(zs) },
      allowed = n >= 9 ? 2 : n >= 5 ? 1 : 0,
      far = [],
      lagging = [],
      blocking = [],
      f = commandForward(sq);
    for (i = 0; i < n; i++) {
      var p = m[i].root.position,
        d = dist(p, med);
      if (d <= limit) continue;
      var along = ((+p.x || 0) - med.x) * f.x + ((+p.z || 0) - med.z) * f.z,
        row = { s: m[i], d: d, along: along };
      far.push(row);
      if (along < -Math.max(2, limit * 0.1)) lagging.push(row);
      else blocking.push(row);
    }
    lagging.sort(function (a, b) {
      return b.d - a.d;
    });
    var trim = lagging.slice(0, Math.min(allowed, lagging.length)),
      ids = {};
    for (i = 0; i < trim.length; i++) ids[String(trim[i].s.id)] = 1;
    var core = m.filter(function (s) {
        return !ids[String(s.id)];
      }),
      cx = 0,
      cz = 0;
    for (i = 0; i < core.length; i++) {
      cx += +core[i].root.position.x || 0;
      cz += +core[i].root.position.z || 0;
    }
    var center = { x: cx / Math.max(1, core.length), z: cz / Math.max(1, core.length) },
      coreSpread = 0;
    for (i = 0; i < core.length; i++) coreSpread = Math.max(coreSpread, dist(core[i].root.position, center));
    var all = {
        x:
          xs.reduce(function (a, b) {
            return a + b;
          }, 0) / n,
        z:
          zs.reduce(function (a, b) {
            return a + b;
          }, 0) / n
      },
      raw = 0;
    for (i = 0; i < n; i++) raw = Math.max(raw, dist(m[i].root.position, all));
    return {
      center: center,
      rawSpread: raw,
      coreSpread: coreSpread,
      stragglers: trim.map(function (x) {
        return String(x.s.id);
      }),
      outrunners: blocking.map(function (x) {
        return String(x.s.id);
      }),
      members: trim.map(function (x) {
        return x.s;
      }),
      dispersed: blocking.length > 0 || lagging.length > allowed || coreSpread > limit,
      allowed: allowed
    };
  }
  function cohesionState(sq) {
    return (
      sq._regroupHysteresis ||
      (sq._regroupHysteresis = {
        overSince: null,
        lastForward: null,
        entries: 0,
        exits: 0,
        timeouts: 0,
        contactExits: 0,
        suppressed: 0,
        stragglerSuppressions: 0,
        regroupRequests: 0,
        byEnd: {},
        recoveries: 0
      })
    );
  }
  function markCatchup(ca, t) {
    for (var i = 0; i < ca.members.length; i++) {
      if (root.BattleMovementResolver) root.BattleMovementResolver.releaseCommit(ca.members[i]);
    }
  }
  function endRegroup(sim, sq, reason) {
    if (!L.end(sq, 'regroup', sim.time, reason)) return false;
    var st = cohesionState(sq);
    st.exits++;
    st.overSince = null;
    st.byEnd = st.byEnd || {};
    st.byEnd[reason] = (st.byEnd[reason] || 0) + 1;
    (sq.members || []).forEach(function (s) {
      s._regroupUnstick = null;
    });
    L.end(sq, 'corner-hold', sim.time, 'regroup released');
    L.grant(sq, 'regroup-cooldown', 'squad-leader', sim.time, sim.time + REENTRY, reason);
    return true;
  }
  function updateCohesion(sim, sq) {
    if (!sq) return;
    var current = L.get(sq, 'regroup'),
      interrupted =
        sq.state === 'retreat'
          ? 'retreat'
          : !alive(sq).length
            ? 'no survivors'
            : current && current.data.missionVersion !== missionVersion(sq)
              ? 'new mission'
              : null;
    if (interrupted) {
      endRegroup(sim, sq, interrupted);
      return;
    }
    var c = cfg(sim, sq),
      limit = +(leaderAlive(sq) ? c.cohesionRadius : c.captainlessCohesion) || 34,
      release = limit * REGROUP_RELEASE,
      st = cohesionState(sq),
      t = sim.time,
      ca = cohesionAssessment(sq, limit);
    sq._cohesionAssessment = {
      rawSpread: +ca.rawSpread.toFixed(3),
      coreSpread: +ca.coreSpread.toFixed(3),
      stragglers: ca.stragglers.slice(),
      outrunners: ca.outrunners.slice(),
      allowed: ca.allowed,
      dispersed: ca.dispersed
    };
    /* No absent leader may invent a new regroup. An already-issued regroup remains a parent intent
       whose release conditions can still complete; immediate contact may still break it below. */
    if (leaderlessActive(sq) && !current) {
      st.overSince = null;
      return;
    }
    /* Recon deliberately makes one or two men outrunners while the main body holds. That separation
       is owned by the live recon lease, not evidence that squad cohesion failed. Starting a regroup
       here would create two Squad Leader command commitments fighting over the same men. Keep the
       full assessment for diagnostics, but do not let intentional recon geometry open a regroup. */
    if (L.get(sq, 'recon')) {
      st.overSince = null;
      if (current) endRegroup(sim, sq, 'recon supersedes regroup');
      return;
    }
    /* A just-completed no-contact recon leaves one or two men intentionally forward.
       The existing regroup-bypass lease owns that short reintegration window. End it as soon as
       the scouts are back inside the ordinary release radius from the non-scout main body so a
       genuine later cohesion failure is never masked for the full ceiling. */
    var rejoin = L.get(sq, 'regroup-bypass');
    if (rejoin && rejoin.reason === 'recon rejoin') {
      var ids = (rejoin.data && rejoin.data.scoutIds) || [],
        idSet = {},
        body = [],
        scouts = [];
      for (var ri = 0; ri < ids.length; ri++) idSet[String(ids[ri])] = 1;
      var living = commanded(sq);
      for (ri = 0; ri < living.length; ri++) {
        if (idSet[String(living[ri].id)]) scouts.push(living[ri]);
        else body.push(living[ri]);
      }
      var bodyCenter = averageMembers(body),
        rejoined = !scouts.length || !bodyCenter;
      if (bodyCenter && scouts.length) {
        rejoined = true;
        for (ri = 0; ri < scouts.length; ri++)
          if (dist(scouts[ri].root.position, bodyCenter) > release) {
            rejoined = false;
            break;
          }
      }
      if (
        rejoined ||
        (rejoin.data && rejoin.data.missionVersion !== missionVersion(sq)) ||
        sq.state === 'retreat'
      )
        L.end(sq, 'regroup-bypass', t, rejoined ? 'scouts rejoined' : 'rejoin invalidated');
    }
    var p = sq._engagementPlan,
      combatPlan = p && (p.status === 'active' || p.status === 'quiet');
    if (sq.inContact || combatPlan) {
      st.overSince = null;
      if (endRegroup(sim, sq, 'contact')) {
        st.contactExits++;
      }
      L.extend(sq, 'regroup-bypass', 'squad-leader', t, t + 1.25, 'firefight in progress');
      return;
    }
    /* Release hands the squad straight back to mission execution in the same Squad Leader tick. */
    var regroup = L.get(sq, 'regroup');
    if (regroup) {
      var age = t - regroup.since;
      if (age >= REGROUP_MIN && ca.coreSpread <= release) {
        endRegroup(sim, sq, 'cohesion restored');
        return;
      }
      /* Progress belongs to movement; only the leader authorizes the regroup escape. */
      alive(sq).forEach(function (s) {
        var progress = s._movementProgress;
        if (
          progress &&
          progress.stuck &&
          progress.kind === 'regroup' &&
          !s.reloading &&
          !s.clearingStoppage &&
          !(s.suppressedUntil > t) &&
          !s._regroupUnstick
        ) {
          s._regroupUnstick = { since: regroup.since };
          st.recoveries = (st.recoveries || 0) + 1;
        }
      });
      transitionPhase(sim, sq, 'regroup', 'regroup lease active', 'regroup');
      sq.objective = copy(regroup.data.anchor || ca.center);
      return;
    }
    /* The Squad Leader, not the General, decides a squad is too scattered to keep executing. */
    var requested = !sq.inContact && !L.holds(sq, 'regroup-bypass', t) && ca.rawSpread > limit;
    if (!requested) {
      st.overSince = null;
      return;
    }
    st.regroupRequests++;
    if (!ca.dispersed && ca.stragglers.length) {
      markCatchup(ca, t);
      st.stragglerSuppressions++;
      st.suppressed++;
      L.grant(sq, 'regroup-bypass', 'squad-leader', t, t + STRAGGLER_BYPASS, 'stragglers catching up');
      return;
    }
    if (!ca.dispersed) {
      st.suppressed++;
      return;
    }
    if (st.overSince == null) st.overSince = t;
    if (L.holds(sq, 'regroup-cooldown', t) || t - st.overSince < REGROUP_ENTER) {
      st.suppressed++;
      return;
    }
    /* Re-form on the forward majority, not the average: the men behind come up to where most of the
       squad already is, instead of the leading men being pulled back to the middle. */
    var marching = commandForward(sq),
      fwd = forwardMajority(alive(sq), marching),
      anchor = copy(fwd ? fwd.point : ca.center);
    L.grant(
      sq,
      'regroup',
      'squad-leader',
      t,
      Infinity,
      'squad dispersed',
      'core spread back inside ' +
        Math.round(release) +
        ' m after ' +
        REGROUP_MIN +
        ' s, contact, retreat, new mission or no survivors',
      {
        anchor: anchor,
        missionVersion: missionVersion(sq),
        startSpread: ca.coreSpread,
        forward: Math.hypot(marching.x, marching.z) > 1e-6 ? marching : null
      }
    );
    st.entries++;
    sq._regroupRecovery = {
      serial: (+sq._regroupRecoverySerial || 0) + 1,
      startedAt: t,
      anchor: copy(anchor)
    };
    sq._regroupRecoverySerial = sq._regroupRecovery.serial;
    sq.objective = copy(anchor);
    /* The rally point is where the squad re-forms: move the Squad Leader's order anchor there so the
       fireteam slots (and so every man's movement order) are built around it. The anchor is frozen
       during a regroup; left where it was it had usually run ahead with the leading men, and the
       squad re-formed around that instead - or ran out the 18 s regroup lease walking to it. */
    publishAnchor(sq, anchor);
    transitionPhase(sim, sq, 'regroup', 'squad dispersed', 'regroup');
    telemetry(sim, 'decision-regroup-commit', {
      faction: sq.faction,
      squad: sq.id,
      serial: sq._regroupRecovery.serial,
      anchor: copy(anchor)
    });
  }

  function aliveTeam(sq, key) {
    return (sq.members || [])
      .filter(function (s) {
        return !s.dead && teamKeyFor(s) === key;
      })
      .sort(function (a, b) {
        return (+a.slotIndex || 0) - (+b.slotIndex || 0);
      });
  }

  function buddyStats(battle) {
    if (!BUDDY_PAIRS_ON || !battle) return null;
    return (
      battle._buddyPairStats ||
      (battle._buddyPairStats = {
        pairsFormed: 0,
        pairsRetired: 0,
        pairActivations: 0,
        cooperationActivations: 0,
        coverMoves: 0,
        breaks: 0,
        reforms: 0,
        separated: 0,
        blocked: 0,
        suppressed: 0,
        incompatible: 0,
        routeDiverged: 0,
        byBreakReason: {}
      })
    );
  }
  function buddyIncReason(stats, reason) {
    if (!stats) return;
    reason = String(reason || 'unknown');
    stats.byBreakReason[reason] = (stats.byBreakReason[reason] || 0) + 1;
  }
  function buddyHistory(sq, row) {
    var h = sq._buddyPairHistory || (sq._buddyPairHistory = []);
    h.push(row);
    if (h.length > 48) h.splice(0, h.length - 48);
  }
  function buddyBrokenState(state) {
    return (
      state === 'separated' ||
      state === 'blocked' ||
      state === 'suppressed' ||
      state === 'incompatible' ||
      state === 'route-diverged'
    );
  }
  function buddyTransition(sq, pair, battle, state, reason) {
    var t = battle.time,
      previous = pair.state || 'ready',
      stats = buddyStats(battle);
    if (previous === state && pair.reason === reason) return;
    if (buddyBrokenState(state) && !buddyBrokenState(previous)) {
      stats.breaks++;
      if (state === 'separated') stats.separated++;
      else if (state === 'blocked') stats.blocked++;
      else if (state === 'suppressed') stats.suppressed++;
      else if (state === 'route-diverged') stats.routeDiverged++;
      else stats.incompatible++;
      buddyIncReason(stats, reason);
      pair.lastBreakReason = reason;
      pair.lastBreakAt = t;
    } else if (!buddyBrokenState(state) && buddyBrokenState(previous)) {
      stats.reforms++;
      pair.lastReformReason = reason || 'conditions-cleared';
      pair.lastReformAt = t;
    }
    buddyHistory(sq, {
      at: +t.toFixed(2),
      pair: pair.id,
      team: pair.team,
      a: pair.aId,
      b: pair.bId,
      from: previous,
      to: state,
      reason: reason || null
    });
    if (buddyBrokenState(state)) {
      pair.movingId = null;
      pair.coveringId = null;
      pair.recoverSince = null;
    }
    pair.state = state;
    pair.reason = reason || null;
    pair.since = t;
    pair.lastChangeAt = t;
  }
  function buddyMember(sq, id) {
    var m = (sq && sq.members) || [];
    for (var i = 0; i < m.length; i++) if (m[i] && String(m[i].id) === String(id)) return m[i];
    return null;
  }
  function buddyTaskKey(sq, key, a, b) {
    return [
      key,
      (a && a._engagementTask) || '',
      (b && b._engagementTask) || '',
      (a && a._engagementPlanSerial) || 0,
      (b && b._engagementPlanSerial) || 0
    ].join('|');
  }
  function buddyPairId(key, a, b) {
    var ai = String(a.id),
      bi = String(b.id);
    return key + ':' + (ai < bi ? ai + '-' + bi : bi + '-' + ai);
  }
  function buddyRetireReason(sq, pair) {
    var a = buddyMember(sq, pair.aId),
      b = buddyMember(sq, pair.bId);
    if (!a || !b || a.dead || b.dead) return 'casualty';
    if (teamKeyFor(a) !== pair.team || teamKeyFor(b) !== pair.team) return 'fireteam-changed';
    return 'roster-changed';
  }
  function syncBuddyPairs(sq, battle) {
    if (!BUDDY_PAIRS_ON || !sq || !battle) return null;
    var old = sq._buddyPairs || {},
      next = {},
      unpaired = [],
      stats = buddyStats(battle);
    ['command', 'alpha', 'bravo', 'charlie'].forEach(function (key) {
      var men = aliveTeam(sq, key);
      for (var i = 0; i + 1 < men.length; i += 2) {
        var a = men[i],
          b = men[i + 1],
          id = buddyPairId(key, a, b),
          task = buddyTaskKey(sq, key, a, b),
          pair = old[id];
        if (!pair) {
          pair = {
            id: id,
            team: key,
            aId: a.id,
            bId: b.id,
            formedAt: battle.time,
            generation: 1,
            taskKey: task,
            state: 'ready',
            reason: 'formed',
            since: battle.time,
            lastChangeAt: battle.time,
            nextMoverId: a.id,
            movingId: null,
            coveringId: null,
            separation: 0,
            routeGap: 0,
            activations: 0,
            coverMoves: 0
          };
          stats.pairsFormed++;
          buddyHistory(sq, {
            at: +battle.time.toFixed(2),
            pair: id,
            team: key,
            a: a.id,
            b: b.id,
            from: null,
            to: 'ready',
            reason: 'formed'
          });
        } else if (pair.taskKey !== task) {
          /* A task/version update is context, not automatically a broken relationship. The old code
             broke and reformed the pair twice in the same tick for every plan refresh, producing
             tens of thousands of diagnostic transitions without a real incompatibility. Actual
             incompatible tasks are detected below (e.g. a tactical-position assignment). */
          pair.previousTaskKey = pair.taskKey;
          pair.taskKey = task;
          pair.generation = (+pair.generation || 1) + 1;
          pair.lastTaskChangeAt = battle.time;
          pair.movingId = null;
          pair.coveringId = null;
        }
        next[id] = pair;
      }
      if (men.length % 2) unpaired.push(men[men.length - 1].id);
    });
    Object.keys(old).forEach(function (id) {
      if (next[id]) return;
      var pair = old[id],
        why = buddyRetireReason(sq, pair);
      stats.pairsRetired++;
      stats.breaks++;
      buddyIncReason(stats, why);
      buddyHistory(sq, {
        at: +battle.time.toFixed(2),
        pair: pair.id,
        team: pair.team,
        a: pair.aId,
        b: pair.bId,
        from: pair.state || 'ready',
        to: 'retired',
        reason: why
      });
    });
    sq._buddyPairs = next;
    sq._buddyUnpaired = unpaired;
    return next;
  }
  function buddyIncompatible(s, battle) {
    if (!s || s.dead) return 'casualty';
    if ((+s.suppressedUntil || 0) > battle.time) return 'suppressed';
    var state = s.eng && s.eng.state;
    if (state === 'freeze' || state === 'flee' || state === 'rage' || state === 'cower')
      return 'engagement-' + state;
    if (root.BattleTacticalPositions && root.BattleTacticalPositions.current && root.BattleTacticalPositions.current(s))
      return 'positional-task';
    return null;
  }
  function buddyStillBroken(pair, separation, routeGap) {
    if (pair.state === 'separated' && separation != null && separation > BUDDY_TUNING.reformSeparation) return true;
    if (pair.state === 'route-diverged' && routeGap != null && routeGap > BUDDY_TUNING.reformRouteGap) return true;
    return false;
  }
  function buddyRecover(sq, pair, battle) {
    if (!buddyBrokenState(pair.state)) {
      pair.recoverSince = null;
      buddyTransition(sq, pair, battle, 'ready', 'conditions-clear');
      return;
    }
    if (pair.recoverSince == null) {
      pair.recoverSince = battle.time;
      return;
    }
    if (battle.time - pair.recoverSince < BUDDY_TUNING.reformDelay) return;
    pair.recoverSince = null;
    buddyTransition(sq, pair, battle, 'ready', 'conditions-stable');
  }
  function updateBuddyPairState(sq, pair, battle) {
    var a = buddyMember(sq, pair.aId),
      b = buddyMember(sq, pair.bId),
      ai = buddyIncompatible(a, battle),
      bi = buddyIncompatible(b, battle);
    if (ai === 'suppressed' || bi === 'suppressed') {
      buddyTransition(sq, pair, battle, 'suppressed', ai === 'suppressed' ? 'a-suppressed' : 'b-suppressed');
      return;
    }
    if (ai || bi) {
      buddyTransition(sq, pair, battle, 'incompatible', ai || bi);
      return;
    }
    var pa = a && a.root && a.root.position,
      pb = b && b.root && b.root.position;
    pair.separation = pa && pb ? +dist(pa, pb).toFixed(2) : null;
    if (pair.separation != null && pair.separation > BUDDY_TUNING.maxSeparation) {
      buddyTransition(sq, pair, battle, 'separated', 'physical-separation');
      return;
    }
    var da = point(a && a._fireteamDestination),
      db = point(b && b._fireteamDestination);
    pair.routeGap = da && db ? +dist(da, db).toFixed(2) : null;
    if (pair.routeGap != null && pair.routeGap > BUDDY_TUNING.maxRouteGap) {
      buddyTransition(sq, pair, battle, 'route-diverged', 'fireteam-routes-diverged');
      return;
    }
    if (buddyStillBroken(pair, pair.separation, pair.routeGap)) {
      pair.recoverSince = null;
      return;
    }
    var aw = String((a && a._movementStopReason) || ''),
      bw = String((b && b._movementStopReason) || '');
    if (aw === 'path-blocked' || aw === 'step-blocked' || bw === 'path-blocked' || bw === 'step-blocked') {
      buddyTransition(sq, pair, battle, 'blocked', aw || bw);
      return;
    }
    var bound = L.get(sq, 'bound');
    if (
      bound &&
      L.holds(sq, 'bound', battle.time) &&
      bound.data &&
      bound.data.team === pair.team &&
      pair.movingId != null &&
      pair.coveringId != null
    ) {
      buddyTransition(sq, pair, battle, 'cover-move', 'authorized-bound');
      return;
    }
    pair.movingId = null;
    pair.coveringId = null;
    buddyRecover(sq, pair, battle);
  }
  function updateBuddyPairs(sq, battle) {
    var pairs = syncBuddyPairs(sq, battle);
    if (!pairs) return null;
    Object.keys(pairs).sort().forEach(function (id) {
      updateBuddyPairState(sq, pairs[id], battle);
    });
    return pairs;
  }
  function buddyBoundPreview(sq, team, movers, fireSupport, battle) {
    if (!BUDDY_PAIRS_ON || !sq._buddyPairs || !movers.length)
      return { movers: movers, cooperation: [] };
    var selected = movers.slice(),
      cooperation = [];
    Object.keys(sq._buddyPairs)
      .sort()
      .forEach(function (id) {
        var pair = sq._buddyPairs[id];
        if (!pair || pair.team !== team || pair.state !== 'ready') return;
        var a = buddyMember(sq, pair.aId),
          b = buddyMember(sq, pair.bId);
        if (movers.indexOf(a) < 0 || movers.indexOf(b) < 0) return;
        var mover = String(pair.nextMoverId) === String(b.id) ? b : a,
          cover = mover === a ? b : a;
        if (fireSupport.indexOf(cover) < 0 && fireSupport.indexOf(mover) >= 0) {
          var swap = mover;
          mover = cover;
          cover = swap;
        }
        /* Cooperation is opportunistic. If the designated cover man is not already part of Engagement's
           base of fire, leave the original fireteam bound untouched instead of parking both men. */
        if (fireSupport.indexOf(cover) < 0) return;
        selected = selected.filter(function (s) {
          return s !== cover;
        });
        cooperation.push({ pair: pair, mover: mover, cover: cover });
      });
    return { movers: selected, cooperation: cooperation };
  }
  function commitBuddyCooperation(sq, preview, battle) {
    if (!BUDDY_PAIRS_ON || !preview || !preview.cooperation.length) return;
    var stats = buddyStats(battle);
    preview.cooperation.forEach(function (c) {
      var pair = c.pair;
      pair.movingId = c.mover.id;
      pair.coveringId = c.cover.id;
      pair.nextMoverId = c.cover.id;
      pair.activations = (+pair.activations || 0) + 1;
      pair.coverMoves = (+pair.coverMoves || 0) + 1;
      stats.pairActivations++;
      stats.cooperationActivations++;
      stats.coverMoves++;
      buddyTransition(sq, pair, battle, 'cover-move', 'authorized-bound');
      telemetry(battle, 'decision-buddy-cover-move', {
        faction: sq.faction,
        squad: sq.id,
        team: pair.team,
        pair: pair.id,
        mover: c.mover.id,
        cover: c.cover.id
      });
    });
  }
  function buddySnapshot(sq) {
    if (!BUDDY_PAIRS_ON || !sq || !sq._buddyPairs) return null;
    return {
      owner: 'squad-leader',
      readers: ['squad-leader/fire-and-movement', 'diagnostics', 'probes'],
      pairs: Object.keys(sq._buddyPairs)
        .sort()
        .map(function (id) {
          var p = sq._buddyPairs[id];
          return {
            id: p.id,
            team: p.team,
            a: p.aId,
            b: p.bId,
            generation: p.generation,
            taskKey: p.taskKey,
            previousTaskKey: p.previousTaskKey || null,
            lastTaskChangeAt: p.lastTaskChangeAt == null ? null : p.lastTaskChangeAt,
            state: p.state,
            reason: p.reason,
            formedAt: p.formedAt,
            since: p.since,
            lastChangeAt: p.lastChangeAt,
            lastBreakReason: p.lastBreakReason || null,
            lastBreakAt: p.lastBreakAt == null ? null : p.lastBreakAt,
            lastReformReason: p.lastReformReason || null,
            lastReformAt: p.lastReformAt == null ? null : p.lastReformAt,
            recoverSince: p.recoverSince == null ? null : p.recoverSince,
            separation: p.separation,
            routeGap: p.routeGap,
            moving: p.movingId,
            covering: p.coveringId,
            nextMover: p.nextMoverId,
            activations: p.activations || 0,
            coverMoves: p.coverMoves || 0
          };
        }),
      unpaired: (sq._buddyUnpaired || []).slice(),
      history: (sq._buddyPairHistory || []).slice(-24)
    };
  }
  function buddyTelemetry(sim) {
    if (!BUDDY_PAIRS_ON || !sim) return null;
    var stats = Object.assign({}, buddyStats(sim)),
      live = 0,
      byState = {};
    ['us', 'ge'].forEach(function (f) {
      var squads = (sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
      squads.forEach(function (sq) {
        Object.keys(sq._buddyPairs || {}).forEach(function (id) {
          var p = sq._buddyPairs[id];
          live++;
          byState[p.state || 'unknown'] = (byState[p.state || 'unknown'] || 0) + 1;
        });
      });
    });
    stats.livePairs = live;
    stats.byState = byState;
    stats.byBreakReason = Object.assign({}, stats.byBreakReason || {});
    return stats;
  }
  /* Each fireteam holds its own ground: [lateral, forward] metres from the order anchor in the squad's
   frame. Team anchors used to be the average of the men's individual formation slots, but those
   alternate sides by slotIndex while fireteam membership is also dealt by slotIndex, so every team
   averaged to the middle (alpha and bravo 1.2 m apart in line) and the teams walked through each
   other: three quarters of formation-on-formation body contacts were between different teams. */
  var TEAM_OFFSETS = {
    line: { command: [0, -3], alpha: [-8, 0], bravo: [8, 0], charlie: [0, -9] },
    wedge: { command: [0, -2], alpha: [-7, 2], bravo: [7, 2], charlie: [0, -9] },
    column: { command: [0, 0], alpha: [0, 7], bravo: [0, -6], charlie: [0, -12] }
  };
  function teamFrame(sq) {
    var a = sq.orderAnchor || sq.rally || { x: 0, z: 0 },
      g = sq.state === 'retreat' ? root.SquadAI.retreatGoal(sq) : sq.objective || sq.home || a,
      dx = (+g.x || 0) - (+a.x || 0),
      dz = (+g.z || 0) - (+a.z || 0),
      l = Math.hypot(dx, dz);
    return l < 0.1 ? commandForward(sq) : { x: dx / l, z: dz / l };
  }
  function desiredAnchor(sq, key, formation) {
    var a = sq.orderAnchor || sq.rally;
    if (!a) return null;
    var form = TEAM_OFFSETS[formation || sq.formation || root.SquadAI.formationFor(sq)] || TEAM_OFFSETS.wedge,
      o = form[key] || [0, 0],
      f = teamFrame(sq),
      r = { x: -f.z, z: f.x };
    return { x: a.x + r.x * o[0] + f.x * o[1], z: a.z + r.z * o[0] + f.z * o[1] };
  }
  function averageMembers(m) {
    var x = 0,
      z = 0,
      n = 0;
    for (var i = 0; i < m.length; i++)
      if (m[i].root) {
        x += +m[i].root.position.x || 0;
        z += +m[i].root.position.z || 0;
        n++;
      }
    return n ? { x: x / n, z: z / n } : null;
  }
  function forward(sq) {
    return commandForward(sq);
  }
  function teamSlot(sq, key, s, index, count, a, frame) {
    var f = frame || forward(sq),
      r = { x: -f.z, z: f.x },
      lat = 0,
      fw = 0;
    if (count === 2) {
      lat = index ? -1.45 : 1.45;
      fw = index ? -0.45 : 0.45;
    } else if (count >= 3) {
      if (index === 0) fw = 1.15;
      else if (index === 1) {
        lat = -1.7;
        fw = -0.85;
      } else {
        lat = 1.7;
        fw = -0.85;
      }
    }
    if (key === 'command' && root.SquadAI.isLeader(s)) {
      lat = 0;
      fw = 0.5;
    }
    return { x: a.x + r.x * lat + f.x * fw, z: a.z + r.z * lat + f.z * fw };
  }
  /* Men start on their fireteam slots. They used to appear scattered up to 4 m around the lane point
   with no regard for their team, so the first order sent them across each other's teams to reach
   their slots: about half of all cross-team body crossings happened in the first minute. This runs
   once when a squad enters the battle, after Force Command has given it its objective, so the first
   order is the ground each man already stands on. What is left of the spawn scatter (a tenth) keeps
   the men from standing on exact geometric points. A defending garrison is module 21's to place: it
   hands out prepared posts nearest-first by where each man stands, so moving him first would only
   reshuffle that (in the defend battles it doubled the defenders' first-minute crossings). */
  var SPAWN_SCATTER_KEPT = 0.1;
  /* Before its first brief (Force Command's first tick, 0.45 s in) a squad's objective is its own
     home, so its axis collapses and every fireteam slot falls on the anchor. Until the brief turns it,
     the squad faces the battle: the scenario centre (where spawn pointed it), else the enemy's side. */
  function spawnForward(sim, sq, home) {
    var sc =
        sim.scene &&
        sim.scene.metadata &&
        (sim.scene.metadata.battleScenario || sim.scene.metadata.battleTown),
      c = (sc && sc.center) || { x: home.x, z: 0 },
      dx = (+c.x || 0) - home.x,
      dz = (+c.z || 0) - home.z,
      l = Math.hypot(dx, dz);
    if (l > 1) return { x: dx / l, z: dz / l };
    return { x: 0, z: sq.faction === 'ge' ? -1 : 1 };
  }
  function placeAtSlots(sim, sq) {
    var home = sq.orderAnchor || sq.rally || sq.home,
      DW = root.BattleDefenseWorks;
    if (!home || !sim || (DW && DW.garrisons && DW.garrisons(sim, sq))) return;
    var f = forward(sq);
    if (Math.hypot(f.x, f.z) < 0.5) f = sq._formationForward = spawnForward(sim, sq, home);
    /* The formation the Squad Leader adopts on his first tick (advanceSquadAnchor), not the
       squad's default from createSquad: a wedge laid out and marched as a line moves every team. */
    var form = root.SquadAI.formationFor(sq);
    ['command', 'alpha', 'bravo', 'charlie'].forEach(function (key) {
      var m = aliveTeam(sq, key),
        a = desiredAnchor(sq, key, form);
      if (!a) return;
      for (var i = 0; i < m.length; i++) {
        var s = m[i],
          p = s.root && s.root.position;
        if (!p) continue;
        var slot = teamSlot(sq, key, s, i, m.length, a, f),
          x = slot.x + (p.x - home.x) * SPAWN_SCATTER_KEPT,
          z = slot.z + (p.z - home.z) * SPAWN_SCATTER_KEPT,
          N = root.BattleNavigation;
        /* A slot across a hedge or wall from the lane point is not his ground: keep the old spawn. */
        if (N && N.movementClear && !N.movementClear({ x: home.x, z: home.z }, { x: x, z: z })) continue;
        p.x = x;
        p.z = z;
        p.y = sim.heightAt ? sim.heightAt(x, z) : p.y;
        s.root.rotation.y = Math.atan2(f.x, f.z);
        s.destination = { x: x, z: z };
        if (root.BattleNavigation) root.BattleNavigation.invalidateNavCache(s);
      }
    });
  }
  function placeForce(sim) {
    if (!sim || +sim.time > 0) return;
    ['us', 'ge'].forEach(function (f) {
      var a = (sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
      for (var i = 0; i < a.length; i++) placeAtSlots(sim, a[i]);
    });
  }
  function start(sim) {
    reset(sim);
    placeForce(sim);
  }

  /* A defensive post belongs to the Squad Leader's command intent, not to a contact serial. Once a man has
   settled into his post, target acquisition/loss must not throw him back into formation and then
   recreate the same post a second later. It is released only when the defensive command signature
   materially changes. */
  function holdPost(s, key) {
    var p = s._defensePost;
    if (p && p.commandKey === key) return p;
    if (!s.orderDestination || dist(s.root.position, s.orderDestination) > 2.6) return null;
    s._defensePost = { x: s.root.position.x, z: s.root.position.z, commandKey: key };
    return s._defensePost;
  }
  /* Fireteam commitment is a meso command signature. Its anchor AND formation frame are committed:
   live command-ray jitter must not rotate individual slots underneath a still-valid Squad Leader order.
   Engagement-plan serials are micro/contact state and deliberately do not belong here. */
  function fireteamSignature(sq) {
    var p = sq.objective || {};
    return [
      sq.commandPhase || '',
      sq.targetObjective || '',
      Math.round((+p.x || 0) / 4),
      Math.round((+p.z || 0) / 4),
      (sq._regroupRecovery && sq._regroupRecovery.serial) || 0
    ].join('|');
  }
  function orderCanAdvance(sq) {
    var living = commanded(sq),
      arrived = 0;
    if (!living.length) return true;
    for (var i = 0; i < living.length; i++) {
      var s = living[i];
      if (s.orderDestination && dist(s.root.position, s.orderDestination) <= ORDER_ARRIVAL_RADIUS) arrived++;
    }
    return arrived / living.length >= ORDER_COHESION;
  }
  function retreatCenter(sq) {
    return averageMembers(commanded(sq)) || average(sq) || copy(sq.orderAnchor || sq.rally || sq.home);
  }
  function retreatBlocked(sq) {
    var men = commanded(sq),
      blocked = 0;
    for (var i = 0; i < men.length; i++) {
      var why = String(men[i]._movementStopReason || '');
      if (why === 'path-blocked' || why === 'step-blocked') blocked++;
    }
    return blocked >= Math.max(RETREAT_BLOCKED_MIN, Math.ceil(men.length * 0.5));
  }
  function retreatUnsafe(sq, battle, anchor, center) {
    var c = root.SquadAI.squadContact ? root.SquadAI.squadContact(sq, battle) : sq.contact;
    if (!c || !anchor || !center) return false;
    var da = dist(c, anchor),
      dc = dist(c, center);
    /* Only invalidate when the leased retreat endpoint is materially closer to the known threat
       than the men are now. Ordinary contact ahead does not churn a rearward anchor. */
    return da + RETREAT_DANGER_MARGIN < dc;
  }
  function retreatPoint(base, goal, scale) {
    base = copy(base);
    goal = copy(goal);
    if (!base || !goal) return base || goal;
    var dx = goal.x - base.x,
      dz = goal.z - base.z,
      len = Math.hypot(dx, dz);
    if (len <= 2) return goal;
    var step = Math.min(ORDER_STRIDE * (scale == null ? 1 : scale), len);
    return { x: base.x + (dx / len) * step, z: base.z + (dz / len) * step };
  }
  function grantRetreatAnchor(sq, battle, base, goal, reason, scale) {
    var t = battle.time,
      center = retreatCenter(sq) || base,
      next = retreatPoint(base, goal, scale),
      d = center && next ? dist(center, next) : Infinity;
    publishAnchor(sq, next);
    sq._orderGoal = copy(goal);
    sq._orderVersion = (+sq._orderVersion || 0) + 1;
    L.grant(
      sq,
      'retreat-anchor',
      'squad-leader',
      t,
      t + RETREAT_ANCHOR_LEASE,
      reason || 'retreat endpoint',
      'arrival, retreat goal change, blocked/unsafe route, no-progress timeout or retreat end',
      {
        anchor: copy(next),
        goal: copy(goal),
        bestDistance: d,
        distance: d,
        lastProgressAt: t,
        grantedAt: t,
        reason: reason || 'retreat endpoint'
      }
    );
    telemetry(battle, 'decision-retreat-anchor', {
      faction: sq.faction,
      squad: sq.id,
      reason: reason || 'retreat endpoint',
      anchor: copy(next),
      goal: copy(goal),
      distance: isFinite(d) ? +d.toFixed(2) : null
    });
    return next;
  }
  function stableRetreatAnchor(sq, battle) {
    var t = battle.time,
      goal = root.SquadAI.retreatGoal(sq),
      center = retreatCenter(sq) || sq.orderAnchor || sq.rally || goal,
      held = L.get(sq, 'retreat-anchor');
    if (!held)
      return grantRetreatAnchor(sq, battle, sq.orderAnchor || sq.rally || center, goal, 'retreat start', 1);

    var d = held.data || (held.data = {}),
      anchor = d.anchor || sq.orderAnchor || sq.rally,
      distance = center && anchor ? dist(center, anchor) : Infinity,
      goalChanged = !d.goal || dist(goal, d.goal) > RETREAT_GOAL_EPS,
      blocked = retreatBlocked(sq),
      unsafe = retreatUnsafe(sq, battle, anchor, center),
      recovering =
        d.reason === 'route blocked' || d.reason === 'anchor unsafe' || d.reason === 'no retreat progress';
    d.distance = distance;

    if (goalChanged) {
      L.end(sq, 'retreat-anchor', t, 'retreat goal moved');
      return grantRetreatAnchor(sq, battle, center, goal, 'retreat goal moved', 1);
    }
    /* A blocked/unsafe observation gets one recovery rebase, then that recovery itself receives the
       normal lease/no-progress window. Persistent stop flags must not recreate the endpoint every tick. */
    if ((unsafe || blocked) && !recovering) {
      L.end(sq, 'retreat-anchor', t, unsafe ? 'anchor unsafe' : 'route blocked');
      return grantRetreatAnchor(
        sq,
        battle,
        center,
        goal,
        unsafe ? 'anchor unsafe' : 'route blocked',
        RETREAT_RECOVERY_STRIDE
      );
    }
    if (distance <= RETREAT_ANCHOR_ARRIVE) {
      /* At the final retreat point there is nowhere else to publish. Keep the same stable endpoint. */
      if (anchor && goal && dist(anchor, goal) <= 2) {
        d.bestDistance = Math.min(isFinite(+d.bestDistance) ? +d.bestDistance : distance, distance);
        d.lastProgressAt = t;
        L.extend(sq, 'retreat-anchor', 'squad-leader', t, t + RETREAT_ANCHOR_LEASE, 'final retreat point');
        return anchor;
      }
      L.end(sq, 'retreat-anchor', t, 'anchor reached');
      return grantRetreatAnchor(sq, battle, anchor || center, goal, 'anchor reached', 1);
    }
    if (!isFinite(+d.bestDistance) || distance < +d.bestDistance - RETREAT_PROGRESS_EPS) {
      d.bestDistance = distance;
      d.lastProgressAt = t;
      L.extend(sq, 'retreat-anchor', 'squad-leader', t, t + RETREAT_ANCHOR_LEASE, 'retreat progress');
      return anchor;
    }
    var progressAt = isFinite(+d.lastProgressAt) ? +d.lastProgressAt : t;
    if (t - progressAt >= RETREAT_NO_PROGRESS || !L.holds(sq, 'retreat-anchor', t)) {
      L.end(sq, 'retreat-anchor', t, 'no retreat progress');
      return grantRetreatAnchor(sq, battle, center, goal, 'no retreat progress', RETREAT_RECOVERY_STRIDE);
    }
    return anchor;
  }
  /* The one publisher of the squad's anchor. `orderAnchor` is where the fireteam slots are laid; `rally` is
     the same point for the readers that only know a rally point (the doctrine's empty-squad fallback, the
     resolver's last resort, the exports). Every move of either goes through here: the per-step advance
     below, the regroup commit (updateCohesion), the General's reconstitution merge and the garrison setup,
     which call it as BattleSquadStability.publishAnchor. Nothing else assigns the pair
     (state-ownership-check.js holds this to the function), so the two cannot disagree and a move is never
     labelled by whichever path happened to write it: the advance (the squadCommand slot) and the regroup
     (this module's commander hook) used to assign it separately, and the provenance log read one owner
     reached by two paths as squad-orders, squad-stability, squad-orders: a writer-ping-pong. Both fields
     are replaced with fresh copies, so a held reference never moves under its holder. */
  function publishAnchor(sq, point) {
    sq.orderAnchor = { x: point.x, z: point.z };
    sq.rally = { x: point.x, z: point.z };
    return sq.orderAnchor;
  }

  /* ---- Scouts Forward -----------------------------------------------------------------------
     The leader decides from terrain he can legitimately inspect plus his OWN personal threat picture.
     No enemy roster, hidden unit position or aggregate squad.contact is consulted here. */
  function reconStats(battle) {
    if (!SCOUTS_FORWARD_ON || !battle) return null;
    var st = battle._scoutsForwardStats;
    if (!st || (st.lastTime != null && battle.time < st.lastTime)) {
      st = battle._scoutsForwardStats = {
        lastTime: battle.time,
        orders: 0,
        orderedByReason: {},
        scoutsSelected: 0,
        contacts: 0,
        noContact: 0,
        timeouts: 0,
        cancelled: 0,
        endedBy: {},
        reportsDelivered: 0,
        reportedEpisodes: 0,
        waitSeconds: 0,
        scoutMetres: 0,
        retriggerBlocked: 0,
        recent: []
      };
    }
    st.lastTime = battle.time;
    return st;
  }
  function reconInc(map, key) {
    map[key] = (map[key] || 0) + 1;
  }
  function reconDistance(task) {
    var total = 0,
      d = (task && task.distanceById) || {};
    Object.keys(d).forEach(function (id) {
      total += +d[id] || 0;
    });
    return total;
  }
  function reconTelemetry(battle) {
    var st = battle && battle._scoutsForwardStats;
    if (!SCOUTS_FORWARD_ON || !st) return null;
    var out = {
      orders: st.orders,
      orderedByReason: Object.assign({}, st.orderedByReason),
      scoutsSelected: st.scoutsSelected,
      contacts: st.contacts,
      noContact: st.noContact,
      timeouts: st.timeouts,
      cancelled: st.cancelled,
      endedBy: Object.assign({}, st.endedBy),
      reportsDelivered: st.reportsDelivered,
      reportedEpisodes: st.reportedEpisodes,
      waitSeconds: +st.waitSeconds.toFixed(1),
      scoutMetres: +st.scoutMetres.toFixed(1),
      retriggerBlocked: st.retriggerBlocked,
      recent: st.recent.slice(-24)
    };
    var active = 0;
    ['us', 'ge'].forEach(function (side) {
      var squads = (battle.factions && battle.factions[side] && battle.factions[side].squads) || [];
      for (var i = 0; i < squads.length; i++) if (L.get(squads[i], 'recon')) active++;
    });
    out.active = active;
    return out;
  }
  function leaderPictureAdequate(sq, battle) {
    var A = root.SquadAI,
      leader = A.leaderOf(sq),
      c = leader && A.soldierContact ? A.soldierContact(leader, battle) : null;
    if (!c || c.source === 'heard') return false;
    return (
      battle.time - (+c.at || 0) <= RECON_TUNING.pictureAge &&
      (+c.confidence || 0) >= RECON_TUNING.pictureConfidence
    );
  }
  function reconScreen(battle, from, to) {
    if (!battle || !from || !to) return null;
    var dx = to.x - from.x,
      dz = to.z - from.z,
      len = Math.hypot(dx, dz);
    if (!(len > 1)) return null;
    var heightAt = battle.heightAt || function () { return 0; },
      ay = heightAt(from.x, from.z) + RECON_TUNING.eye,
      by = heightAt(to.x, to.z) + RECON_TUNING.eye,
      i;
    /* A crest is visible as a loss of ground line; finding that loss is terrain observation, not a
       query about who may be hiding beyond it. */
    for (i = 1; i < RECON_TUNING.terrainSamples; i++) {
      var t = i / RECON_TUNING.terrainSamples,
        x = from.x + dx * t,
        z = from.z + dz * t,
        lineY = ay + (by - ay) * t;
      if (heightAt(x, z) > lineY - 0.12)
        return { reason: 'crest', distance: len * t };
    }
    var a = { x: from.x, z: from.z, y: ay },
      b = { x: to.x, z: to.z, y: by },
      F = root.BattleObstacleField,
      N = root.BattleNavigation;
    if (F && F.sightBlocked && F.sightBlocked(battle.obstacles, a, b))
      return { reason: 'visual-screen', distance: null };
    if (N && N.lineOfSightBlocked && N.lineOfSightBlocked(from, to, ay, by))
      return { reason: 'visual-screen', distance: null };
    return null;
  }
  function reconSignature(sq, goal) {
    return [
      missionVersion(sq),
      +sq.routeIndex || 0,
      Math.round((+goal.x || 0) / 12),
      Math.round((+goal.z || 0) / 12)
    ].join('|');
  }
  function reconCandidate(sq, battle, goal) {
    if (!SCOUTS_FORWARD_ON || !sq || !battle || !goal || !RECON_PHASES[sq.commandPhase || '']) return null;
    var A = root.SquadAI,
      C = root.BattleCallouts;
    if (
      sq.state === 'retreat' ||
      sq.inContact ||
      sq.clearContact ||
      !A.leaderOf(sq) ||
      (A.soldierBeliefsOn && !A.soldierBeliefsOn()) ||
      !C ||
      !C.enabled ||
      !C.enabled() ||
      leaderPictureAdequate(sq, battle)
    )
      return null;
    var from = average(sq);
    if (!from) return null;
    var dx = goal.x - from.x,
      dz = goal.z - from.z,
      d = Math.hypot(dx, dz);
    if (d < RECON_TUNING.minGoalDistance) return null;
    var ux = dx / d,
      uz = dz / d,
      look = Math.min(RECON_TUNING.lookAhead, d - 3),
      far = { x: from.x + ux * look, z: from.z + uz * look },
      screen = reconScreen(battle, from, far);
    if (!screen && d > RECON_TUNING.objectiveApproach) return null;
    var reason = screen ? screen.reason : 'unknown-approach',
      advance =
        screen && screen.distance != null
          ? Math.max(16, Math.min(RECON_TUNING.advance, screen.distance + RECON_TUNING.pastScreen))
          : Math.min(RECON_TUNING.advance, d - 4),
      sig = reconSignature(sq, goal),
      last = sq._reconLast;
    if (last && last.signature === sig) {
      if (!last.retriggerNoted) {
        last.retriggerNoted = true;
        var stats = reconStats(battle);
        if (stats) stats.retriggerBlocked++;
        telemetry(battle, 'decision-recon-retrigger-blocked', {
          faction: sq.faction,
          squad: sq.id,
          signature: sig,
          previousEnd: last.reason
        });
      }
      return null;
    }
    if (!(advance >= 12)) return null;
    return {
      signature: sig,
      reason: reason,
      from: from,
      goal: copy(goal),
      point: { x: from.x + ux * advance, z: from.z + uz * advance },
      axis: { x: ux, z: uz },
      goalDistance: d
    };
  }
  function reconEligible(man, sq, battle) {
    return !!(
      man &&
      !man.dead &&
      man !== root.SquadAI.leaderOf(sq) &&
      !root.SquadAI.isMachineGun(man) &&
      (+man.suppressedUntil || 0) <= battle.time
    );
  }
  function selectReconScouts(sq, battle) {
    var men = commanded(sq)
        .filter(function (man) {
          return reconEligible(man, sq, battle);
        })
        .sort(function (a, b) {
          return (+a.slotIndex || 0) - (+b.slotIndex || 0) || String(a.id).localeCompare(String(b.id));
        }),
      living = commanded(sq).length;
    if (living < 4 || !men.length) return [];
    var scouts = men.filter(function (man) {
        return man.role === 'scout';
      }),
      pairs = sq._buddyPairs || {},
      pairIds = Object.keys(pairs).sort(),
      i;
    /* If a live buddy pair contains a scout, send that pair together. This preserves local ownership
       without requiring four men merely because the two doctrinal scouts sit in different teams. */
    for (i = 0; i < scouts.length; i++) {
      for (var pi = 0; pi < pairIds.length; pi++) {
        var p = pairs[pairIds[pi]],
          has = String(p.aId) === String(scouts[i].id) || String(p.bId) === String(scouts[i].id);
        if (!has) continue;
        var buddy = buddyMember(sq, String(p.aId) === String(scouts[i].id) ? p.bId : p.aId);
        if (reconEligible(buddy, sq, battle))
          return [scouts[i], buddy].sort(function (a, b) {
            return (+a.slotIndex || 0) - (+b.slotIndex || 0);
          });
      }
    }
    var cap = Math.min(2, Math.max(1, living - 3)),
      out = scouts.slice(0, cap);
    for (i = 0; out.length < cap && i < men.length; i++) if (out.indexOf(men[i]) < 0) out.push(men[i]);
    return out;
  }
  function syncReconTasks(sq) {
    var task = sq && sq._reconTask,
      picked = {};
    if (task) for (var i = 0; i < task.scoutIds.length; i++) picked[String(task.scoutIds[i])] = 1;
    var m = (sq && sq.members) || [];
    for (i = 0; i < m.length; i++)
      if (task) m[i]._engagementTask = picked[String(m[i].id)] ? 'recon' : 'recon-hold';
  }
  function startRecon(sq, battle, candidate) {
    if (!candidate || L.get(sq, 'recon')) return false;
    var scouts = selectReconScouts(sq, battle);
    if (!scouts.length || scouts.length >= commanded(sq).length) return false;
    var selected = {},
      hold = {},
      starts = {},
      lasts = {},
      moved = {},
      dest = {},
      right = { x: -candidate.axis.z, z: candidate.axis.x },
      members = commanded(sq),
      i;
    for (i = 0; i < scouts.length; i++) selected[String(scouts[i].id)] = 1;
    for (i = 0; i < members.length; i++) {
      var man = members[i],
        pos = man.root.position,
        id = String(man.id);
      starts[id] = { x: pos.x, z: pos.z };
      lasts[id] = { x: pos.x, z: pos.z };
      moved[id] = 0;
      if (!selected[id]) hold[id] = { x: pos.x, z: pos.z };
    }
    for (i = 0; i < scouts.length; i++) {
      var lateral = scouts.length === 1 ? 0 : i === 0 ? 1.7 : -1.7;
      dest[String(scouts[i].id)] = {
        x: candidate.point.x + right.x * lateral,
        z: candidate.point.z + right.z * lateral
      };
    }
    var task = (sq._reconTask = {
      signature: candidate.signature,
      reason: candidate.reason,
      startedAt: battle.time,
      until: battle.time + RECON_TUNING.timeout,
      phase: sq.commandPhase || '',
      missionVersion: missionVersion(sq),
      point: copy(candidate.point),
      goal: copy(candidate.goal),
      scoutIds: scouts.map(function (man) {
        return man.id;
      }),
      destinations: dest,
      holdPoints: hold,
      startPositions: starts,
      lastPositions: lasts,
      distanceById: moved,
      arrivedAt: null,
      updatedAt: null
    });
    L.grant(
      sq,
      'recon',
      'squad-leader',
      battle.time,
      task.until,
      candidate.reason + ' before commitment',
      'contact, event, observation complete, timeout, mission/phase change or battle end',
      { signature: task.signature, scouts: task.scoutIds.slice(), point: copy(task.point) }
    );
    syncReconTasks(sq);
    var st = reconStats(battle);
    if (st) {
      st.orders++;
      st.scoutsSelected += scouts.length;
      reconInc(st.orderedByReason, candidate.reason);
      st.recent.push({
        at: +battle.time.toFixed(2),
        squad: sq.faction + ':' + sq.id,
        reason: candidate.reason,
        scouts: task.scoutIds.slice(),
        point: copy(task.point)
      });
      if (st.recent.length > 24) st.recent.shift();
    }
    telemetry(battle, 'decision-recon-order', {
      faction: sq.faction,
      squad: sq.id,
      phase: task.phase,
      reason: task.reason,
      signature: task.signature,
      scouts: task.scoutIds.slice(),
      point: copy(task.point),
      goalDistance: +candidate.goalDistance.toFixed(1)
    });
    return true;
  }
  function updateReconDistance(sq, task) {
    for (var i = 0; i < task.scoutIds.length; i++) {
      var man = buddyMember(sq, task.scoutIds[i]);
      if (!man || man.dead || !man.root) continue;
      var id = String(man.id),
        pos = man.root.position,
        prior = task.lastPositions[id];
      if (prior) task.distanceById[id] = (+task.distanceById[id] || 0) + dist(prior, pos);
      task.lastPositions[id] = { x: pos.x, z: pos.z };
    }
  }
  function scoutDirectContact(sq, task, battle) {
    var A = root.SquadAI;
    for (var i = 0; i < task.scoutIds.length; i++) {
      var man = buddyMember(sq, task.scoutIds[i]);
      if (!man || man.dead) continue;
      var c = A.soldierContact(man, battle);
      if (c && c.source === 'seen' && +c.at >= task.startedAt - 1e-6) return { man: man, contact: c };
    }
    return null;
  }
  function startReconReportWatch(sq, task, battle) {
    sq._reconReportMonitor = {
      startedAt: task.startedAt,
      endedAt: battle.time,
      until: battle.time + RECON_TUNING.reportWatch,
      scoutIds: task.scoutIds.map(String),
      recipients: {},
      countedEpisode: false
    };
  }
  function updateReconReportWatch(sq, battle) {
    var mon = sq && sq._reconReportMonitor;
    if (!mon || !battle) return;
    var A = root.SquadAI,
      st = reconStats(battle),
      members = sq.members || [];
    if (A.beliefSnapshot)
      for (var i = 0; i < members.length; i++) {
        var man = members[i],
          id = man && String(man.id);
        if (!man || man.dead || mon.scoutIds.indexOf(id) >= 0 || mon.recipients[id]) continue;
        var snap = A.beliefSnapshot(man, battle),
          beliefs = (snap && snap.beliefs) || [];
        for (var bi = 0; bi < beliefs.length; bi++) {
          var belief = beliefs[bi];
          if (
            belief.source === 'told' &&
            mon.scoutIds.indexOf(String(belief.sourceSoldierId)) >= 0 &&
            +belief.observedAt >= mon.startedAt - 1e-6
          ) {
            mon.recipients[id] = 1;
            if (st) {
              st.reportsDelivered++;
              if (!mon.countedEpisode) {
                mon.countedEpisode = true;
                st.reportedEpisodes++;
              }
            }
            telemetry(battle, 'decision-recon-report-delivered', {
              faction: sq.faction,
              squad: sq.id,
              recipient: man.id,
              sourceScout: belief.sourceSoldierId,
              delay: +(battle.time - mon.endedAt).toFixed(2)
            });
            break;
          }
        }
      }
    if (battle.time >= mon.until) sq._reconReportMonitor = null;
  }
  function endRecon(sq, battle, reason) {
    var task = sq && sq._reconTask;
    if (!task) return null;
    updateReconDistance(sq, task);
    var metres = reconDistance(task),
      seconds = Math.max(0, battle.time - task.startedAt),
      lease = L.end(sq, 'recon', battle.time, reason);
    sq._reconTask = null;
    sq._reconLast = {
      signature: task.signature,
      endedAt: battle.time,
      reason: reason,
      point: copy(task.point),
      startedAt: task.startedAt,
      scoutIds: task.scoutIds.slice(),
      retriggerNoted: false
    };
    if (reason === 'scout-contact') startReconReportWatch(sq, task, battle);
    /* Only a no-contact release hands the main body a deliberate scout lead to absorb. Contact,
       retreat, leader/phase/mission invalidation and battle end already transition into their own
       owners and must not leave a recon-derived bypass behind. */
    if (reason === 'observed-no-contact' || reason === 'timeout')
      L.grant(
        sq,
        'regroup-bypass',
        'squad-leader',
        battle.time,
        battle.time + RECON_TUNING.rejoin,
        'recon rejoin',
        'scouts back inside cohesion release band, contact, retreat, mission change or expiry',
        { scoutIds: task.scoutIds.slice(), missionVersion: task.missionVersion }
      );
    syncTasks(sq, sq._engagementPlan);
    var st = reconStats(battle);
    if (st) {
      reconInc(st.endedBy, reason);
      st.waitSeconds += seconds;
      st.scoutMetres += metres;
      if (reason === 'scout-contact') st.contacts++;
      else if (reason === 'observed-no-contact') st.noContact++;
      else if (reason === 'timeout') st.timeouts++;
      else st.cancelled++;
      st.recent.push({
        at: +battle.time.toFixed(2),
        squad: sq.faction + ':' + sq.id,
        end: reason,
        seconds: +seconds.toFixed(1),
        metres: +metres.toFixed(1),
        scouts: task.scoutIds.slice()
      });
      if (st.recent.length > 24) st.recent.shift();
    }
    telemetry(battle, 'decision-recon-end', {
      faction: sq.faction,
      squad: sq.id,
      reason: reason,
      signature: task.signature,
      scouts: task.scoutIds.slice(),
      seconds: +seconds.toFixed(2),
      scoutMetres: +metres.toFixed(1)
    });
    return lease;
  }
  function updateRecon(sq, battle, report) {
    updateReconReportWatch(sq, battle);
    var task = sq && sq._reconTask;
    if (!task || !battle || task.updatedAt === battle.time) return task || null;
    task.updatedAt = battle.time;
    updateReconDistance(sq, task);
    if (battle.winner) return endRecon(sq, battle, 'battle-end');
    if (sq.state === 'retreat') return endRecon(sq, battle, 'retreat');
    if (!leaderAlive(sq)) return endRecon(sq, battle, 'leader-loss');
    if (task.missionVersion !== missionVersion(sq)) return endRecon(sq, battle, 'mission-change');
    if ((sq.commandPhase || '') !== task.phase) return endRecon(sq, battle, 'phase-change');
    if (report && report.underFire > 0) return endRecon(sq, battle, 'under-fire');
    var seen = scoutDirectContact(sq, task, battle);
    if (seen) return endRecon(sq, battle, 'scout-contact');
    if (report && (report.contactStarted || (+sq.contactCount || 0) > 0))
      return endRecon(sq, battle, 'contact');
    if (battle.time >= task.until) return endRecon(sq, battle, 'timeout');
    var aliveScouts = 0,
      arrived = 0;
    for (var i = 0; i < task.scoutIds.length; i++) {
      var man = buddyMember(sq, task.scoutIds[i]),
        target = task.destinations[String(task.scoutIds[i])];
      if (!man || man.dead || !target) continue;
      aliveScouts++;
      if (dist(man.root.position, target) <= RECON_TUNING.arrive) arrived++;
    }
    if (!aliveScouts) return endRecon(sq, battle, 'scouts-unavailable');
    if (arrived === aliveScouts) {
      if (task.arrivedAt == null) task.arrivedAt = battle.time;
      if (battle.time - task.arrivedAt >= RECON_TUNING.observe)
        return endRecon(sq, battle, 'observed-no-contact');
    } else task.arrivedAt = null;
    return task;
  }
  function publishReconOrders(sq, battle) {
    var task = sq && sq._reconTask;
    if (!task) return false;
    var selected = {};
    for (var i = 0; i < task.scoutIds.length; i++) selected[String(task.scoutIds[i])] = 1;
    var members = commanded(sq),
      stats = publishStats(battle);
    for (i = 0; i < members.length; i++) {
      var man = members[i],
        id = String(man.id),
        next = selected[id] ? task.destinations[id] : task.holdPoints[id];
      if (!next) continue;
      man._fireteamKey = man._fireteamKey || teamKeyFor(man);
      man._engagementTask = selected[id] ? 'recon' : 'recon-hold';
      var key = 'recon|' + task.signature + '|' + id,
        previous = point(man._fireteamDestination);
      stats.intentChecks++;
      if (previous && dist(previous, next) <= ORDER_PUBLISH_EPS && man._fireteamPublishKey === key) {
        stats.intentCoalesced++;
        continue;
      }
      man._fireteamDestination = copy(next);
      man._fireteamPublishKey = key;
      stats.intentPublishes++;
      if (root.BattleMovementResolver)
        root.BattleMovementResolver.proposeOrder(man, man._fireteamDestination, battle, false);
      else man.orderDestination = copy(man._fireteamDestination);
    }
    if (BUDDY_PAIRS_ON) updateBuddyPairs(sq, battle);
    return true;
  }

  /* The legacy SquadAI issueOrders() both advanced the Squad Leader's anchor AND published an individual
   formation point for every soldier every squad tick. M3C keeps the useful anchor cadence here and
   deletes that redundant individual producer entirely: only committed fireteam slots publish Meso
   locomotion. */
  /* Clearing the last contact (`?alertAdvance=0` is the old hold). Once a squad has seen the enemy its alerted men
     hold their sector until the engagement is won, lost or the contact is gone, and the anchor is held while the
     squad is in contact. Nothing moved them on when the enemy simply dropped out of sight: a hold-fire preparation
     on a contact nobody could see, or a suppressor firing on a remembered position, kept them in their cover for as
     long as the picture lasted. When nobody in the squad has seen anyone or been shot at for CLEAR_AFTER seconds
     and the squad still holds its own (first-hand) picture of the enemy, the Squad Leader orders it to move up on
     the last place the enemy was seen (`sq.clearContact`): the anchor advances on that point instead of the
     objective, and Engagement lets an alerted man who is not suppressing follow his order, crouched and watching
     it. Fire control is opened (a hold-fire order still waiting, or none) and stays open while the order stands,
     so the man who finds the enemy again shoots instead of the squad going prone for a new volley. The order ends
     when anyone sees an enemy or is shot at (the fight resumes), when the squad has reached the point (cleared),
     after CLEAR_MAX seconds, in a holding phase, in retreat or when the battle is over; a newer first-hand
     sighting moves the point. */
  var ALERT_ADVANCE = !(typeof location !== 'undefined' && /[?&]alertAdvance=(?:0|off|false)\b/.test(location.search || ''));
  var CLEAR_AFTER = 6;
  var CLEAR_MAX = 90;
  var CLEAR_ARRIVED = 4;
  var CLEAR_HOLD_PHASES = { regroup: 1, 'support-hold': 1, hold: 1, reserve: 1, defend: 1, 'corner-check': 1 };
  function endClearContact(sq, battle, why) {
    if (sq.clearContact && why !== 'sighting' && why !== 'under fire') sq._clearedSeen = sq.clearContact.seen;
    if (sq.clearContact)
      telemetry(battle, 'decision-clear-contact-end', {
        faction: sq.faction,
        squad: sq.id,
        reason: why,
        seconds: battle.time - sq.clearContact.since
      });
    sq.clearContact = null;
  }
  function updateClearContact(sq, battle, r) {
    if (!ALERT_ADVANCE) return;
    var A = root.SquadAI,
      c = A.squadContact ? A.squadContact(sq, battle) : null,
      own = !!(c && (A.hasFirstHandMemory ? A.hasFirstHandMemory(c, battle) : !c.heard && !c.relayedFrom)),
      cc = sq.clearContact,
      why =
        sq.contactCount > 0
          ? 'sighting'
          : r.underFire > 0
            ? 'under fire'
            : sq.state === 'retreat'
              ? 'retreat'
              : battle.winner
                ? 'battle over'
                : CLEAR_HOLD_PHASES[sq.commandPhase || '']
                  ? 'holding phase'
                  : null;
    if (why) {
      sq._quietSince = null;
      endClearContact(sq, battle, why);
      return;
    }
    if (cc) {
      if (own) {
        cc.x = c.x;
        cc.z = c.z;
        cc.seen = c.at;
      }
      var a = sq.orderAnchor;
      if (a && dist(a, cc) <= CLEAR_ARRIVED && orderCanAdvance(sq)) endClearContact(sq, battle, 'cleared');
      else if (battle.time - cc.since >= CLEAR_MAX) endClearContact(sq, battle, 'timeout');
      if (!sq.clearContact) sq._quietSince = null;
      return;
    }
    /* A picture the squad has already cleared, timed out on or left for a holding task is not ordered again. */
    if (!own || (sq._clearedSeen != null && c.at <= sq._clearedSeen)) {
      sq._quietSince = null;
      return;
    }
    if (sq._quietSince == null) sq._quietSince = battle.time;
    if (battle.time - sq._quietSince < CLEAR_AFTER) return;
    sq.clearContact = { x: c.x, z: c.z, seen: c.at, since: battle.time };
    telemetry(battle, 'decision-clear-contact', {
      faction: sq.faction,
      squad: sq.id,
      phase: sq.commandPhase || '',
      point: { x: c.x, z: c.z }
    });
    var fc = sq.fireControl;
    if (FIRE_CONTROL_ON && !(fc && fc.state === 'open'))
      setFireControl(sq, battle, fc || null, 'open', 'contact quiet: clearing', {
        targetId: fc ? fc.targetId : c.unit && c.unit.id
      });
  }
  function advanceSquadAnchor(sq, battle) {
    var anchor = sq.orderAnchor || publishAnchor(sq, sq.rally);
    if (sq.state === 'retreat') {
      stableRetreatAnchor(sq, battle);
      if (leaderlessActive(sq)) noteLeaderlessAction(sq, battle, 'retreat', 'survival retreat continues');
      return;
    }
    if (leaderlessActive(sq)) return;
    if (L.get(sq, 'retreat-anchor')) L.end(sq, 'retreat-anchor', battle.time, 'retreat ended');
    /* The main-body anchor is the hold line during recon. Scouts receive individual fireteam-order
       intents below; the squad itself does not creep after them. */
    if (L.get(sq, 'recon')) return;
    var x = anchor.x,
      z = anchor.z,
      mission = sq.objective || sq.home,
      goalChanged = !sq._orderGoal || dist(mission, sq._orderGoal) > 3,
      /* Clearing heads for the last contact; its point moves with what is heard, so it never forces a stride. */
      goal = sq.clearContact || mission;
    var form = root.SquadAI.formationFor(sq),
      formChanged = form !== sq.formation,
      phase = sq.commandPhase || '',
      hold = ['regroup', 'support-hold', 'hold', 'reserve', 'defend', 'corner-check'].indexOf(phase) >= 0,
      force = false;
    if (goalChanged) {
      sq._orderGoal = copy(mission);
      force = true;
    }
    if (formChanged) {
      sq.formation = form;
      force = true;
    }
    /* The first stride of a clearing order is taken at once, so the men in cover get a point ahead to move up
       to; after that the anchor advances as they arrive, as on any march. */
    if (sq.clearContact && sq._clearStride !== sq.clearContact.since) {
      sq._clearStride = sq.clearContact.since;
      force = true;
    }
    var bounding = L.holds(sq, 'bound', battle.time),
      clearing = !!sq.clearContact,
      held = !!sq.inContact && !bounding && !clearing,
      dx = goal.x - x,
      dz = goal.z - z,
      len = Math.hypot(dx, dz),
      mayAdvance = !hold && !held && (sq.state === 'advance' || sq.state === 'engaged');
    if ((force || orderCanAdvance(sq)) && mayAdvance && len > 2) {
      var stride = bounding
        ? ORDER_STRIDE * 0.5
        : sq.state === 'engaged'
          ? ORDER_STRIDE * 0.62
          : ORDER_STRIDE;
      x += (dx / len) * Math.min(stride, len);
      z += (dz / len) * Math.min(stride, len);
      sq._orderVersion = (+sq._orderVersion || 0) + 1;
    }
    publishAnchor(sq, { x: x, z: z });
  }
  /* A fireteam's slots are laid round its anchor, and the squad anchor only advances once enough men
     have arrived on their orders. Men who rush on (cover bounds, assault rushes) leave it behind, so
     the next renewal, or a teammate falling, dealt their slots back behind them: the largest producer
     in the `backward-orders` probe. While the squad advances the team's anchor never trails the team's
     forward line (the same forward-majority point `_forwardLine` publishes, taken from the men now,
     since the published line is a tick old and cleared in retreat) by more than FOLLOW_LAG: it is
     carried forward along the advance axis to where the team actually is. */
  function followTeamForward(sq, men, cur) {
    var axis = commandForward(sq),
      t = forwardMajority(men, axis);
    if (!t) return;
    var lag = t.at - (cur.anchor.x * axis.x + cur.anchor.z * axis.z);
    if (lag <= FOLLOW_LAG) return;
    cur.anchor = { x: cur.anchor.x + axis.x * lag, z: cur.anchor.z + axis.z * lag };
  }
  function updateFireteams(sq, battle) {
    sq._fireteamOrders = sq._fireteamOrders || {};
    if (leaderlessActive(sq) && sq.state !== 'retreat') {
      if (BUDDY_PAIRS_ON) updateBuddyPairs(sq, battle);
      return;
    }
    if (sq._reconTask && L.get(sq, 'recon')) {
      publishReconOrders(sq, battle);
      return;
    }
    var defensive = !!DEFENSIVE[sq.commandPhase],
      defenseKey = signature(sq),
      regroup = sq.commandPhase === 'regroup' && sq.state !== 'retreat',
      stats = publishStats(battle);
    ['command', 'alpha', 'bravo', 'charlie'].forEach(function (key) {
      var m = aliveTeam(sq, key);
      if (!m.length) return;
      var desired = desiredAnchor(sq, key);
      if (!desired) return;
      var live = averageMembers(m),
        sig = fireteamSignature(sq),
        cur = sq._fireteamOrders[key],
        urgent = sq.state === 'retreat';
      if (!cur || cur.signature !== sig || (urgent && dist(cur.anchor, desired) > ORDER_PUBLISH_EPS))
        cur = sq._fireteamOrders[key] = {
          anchor: copy(desired),
          origin: copy(live),
          forward: forward(sq),
          signature: sig,
          until: battle.time + (urgent ? 0 : TEAM_LEASE),
          blocked: false
        };
      else if (regroup) cur.until = battle.time + TEAM_LEASE;
      else if (battle.time >= cur.until || dist(cur.anchor, desired) > 20) {
        var arrived = live && dist(live, cur.anchor) <= 4.5;
        if (arrived)
          cur = sq._fireteamOrders[key] = {
            anchor: copy(desired),
            origin: copy(live),
            forward: forward(sq),
            signature: sig,
            until: battle.time + TEAM_LEASE,
            blocked: false
          };
        else cur.until = battle.time + TEAM_LEASE;
      }
      if (!defensive && !regroup && !urgent) followTeamForward(sq, m, cur);
      for (var i = 0; i < m.length; i++) {
        var s = m[i],
          d = teamSlot(sq, key, s, i, m.length, cur.anchor, cur.forward),
          prepared = defensive && s._preparedDefensePost,
          post = prepared ? null : defensive ? holdPost(s, defenseKey) : null,
          next = prepared ? copy(prepared) : post ? { x: post.x, z: post.z } : d,
          kind = prepared ? 'prepared' : post ? 'defense-post' : 'formation',
          publishKey = sig + '|' + key + '|' + kind,
          previous = point(s._fireteamDestination);
        s._fireteamKey = key;
        if (!defensive) s._defensePost = null;
        stats.intentChecks++;
        if (previous && dist(previous, next) <= ORDER_PUBLISH_EPS && s._fireteamPublishKey === publishKey) {
          stats.intentCoalesced++;
          continue;
        }
        s._fireteamDestination = copy(next);
        s._fireteamPublishKey = publishKey;
        stats.intentPublishes++;
        if (root.BattleMovementResolver)
          root.BattleMovementResolver.proposeOrder(s, s._fireteamDestination, battle, urgent);
        else s.orderDestination = copy(s._fireteamDestination);
      }
    });
    if (BUDDY_PAIRS_ON) updateBuddyPairs(sq, battle);
  }
  /* Stress in local execution (`?slStress=pick,hold,review`, all three on by default; `0`/`off` is none, `1`/`all` is all
     three, a list exactly those named). The Squad Leader reads its men's stress through the soldier condition's `lead` lever and changes only its own
     decisions: `pick` sends the calmest fireteam that can bound instead of the next in rotation (a tie keeps the rotation);
     `hold` skips a bound cycle when every team that could go is at the shaken band; `review` asks the General for a new
     task (the existing doctrine-review request, on a hold/support/regroup brief) once the squad's mean has stayed at or
     over reviewAt for reviewAfter seconds of contact with reviewMin or more living men. Deterministic, no RNG. */
  var SL_STRESS_PARTS = ['pick', 'hold', 'review'];
  function parseSlStress(search) {
    var m = /[?&]slStress=([^&#]*)/.exec(search || ''),
      out = {},
      v = m ? decodeURIComponent(m[1]).toLowerCase() : 'all';
    if (v === '' || v === '1' || v === 'on' || v === 'all') SL_STRESS_PARTS.forEach(function (k) { out[k] = true; });
    else if (v && v !== '0' && v !== 'off')
      v.split(',').forEach(function (k) {
        if (SL_STRESS_PARTS.indexOf(k) >= 0) out[k] = true;
      });
    return out;
  }
  var SL_STRESS = parseSlStress(typeof location !== 'undefined' ? location.search : '');
  var LEAD_TUNING = { holdAt: 0.3, reviewAt: 1 / 3, reviewAfter: 10, reviewMin: 3 };
  function teamStress(men) {
    var M = root.BattleSoldierMind;
    return M && M.teamStress ? M.teamStress(men) : 0;
  }
  function leadStress(sq) {
    var M = root.BattleSoldierMind;
    return M && M.leadStress ? M.leadStress(sq) : 0;
  }
  /* review: the squad has stayed shaken in contact long enough that its brief is worth a second look. */
  function stressReview(sq, battle) {
    if (!SL_STRESS.review) return;
    var living = 0,
      m = sq.members || [];
    for (var i = 0; i < m.length; i++) if (m[i] && !m[i].dead) living++;
    if (living < LEAD_TUNING.reviewMin || leadStress(sq) < LEAD_TUNING.reviewAt) {
      sq._slStressSince = null;
      return;
    }
    if (sq._slStressSince == null) sq._slStressSince = battle.time;
    else if (battle.time - sq._slStressSince >= LEAD_TUNING.reviewAfter) requestReview(battle, sq, 'squad stress');
  }
  /* Fire and movement. Engagement reports the squad's contact and base of fire; the Squad Leader decides
   whether the phase allows an assault and, every BOUND_CYCLE seconds, sends one fireteam forward
   for BOUND_DURATION while at least two men keep shooting. */
  function fireAndMovement(sq, battle) {
    var E = root.BattleEngagement;
    if (!E || !sq || !battle) return;
    var r = E.updateSquad(sq, battle);
    if (!r) return;
    if (r.fled && r.fled.length && sq.fledId == null) detachFled(sq, battle, r.fled);
    updateRecon(sq, battle, r);
    if (leaderlessActive(sq) && sq.state !== 'retreat') {
      var inheritedBound = L.get(sq, 'bound');
      if (!L.holds(sq, 'bound', battle.time)) E.clearBoundOrders(sq);
      if (r.contactStarted || r.underFire > 0) {
        noteLeaderlessAction(
          sq,
          battle,
          'immediate-contact',
          r.underFire > 0 ? 'under fire' : 'contact acquired'
        );
        requestLeaderlessHelp(sq, battle, r.underFire > 0 ? 'leaderless under fire' : 'leaderless contact');
      } else if (inheritedBound && L.holds(sq, 'bound', battle.time))
        noteLeaderlessAction(sq, battle, 'finish-committed-move', 'inherited bound remains live');
      else if (sq.inContact)
        noteLeaderlessAction(sq, battle, 'hold-and-fight', 'existing contact under inherited intent');
      else noteLeaderlessAction(sq, battle, 'hold-intent', 'no new Meso command during succession');
      return;
    }
    updateClearContact(sq, battle, r);
    var members = sq.members || [],
      i,
      s;
    var t = battle.time;
    /* A bound order that was not taken up inside its window is stale, not pending. */
    if (!L.holds(sq, 'bound', t)) E.clearBoundOrders(sq);
    if (r.contactStarted) {
      L.end(sq, 'bound', t, 'contact started');
      L.grant(sq, 'bound-cycle', 'squad-leader', t, t + BOUND_CYCLE, 'contact started', 'cycle expiry');
    }
    if (!sq.inContact) {
      L.end(sq, 'bound', t, 'contact broken');
      sq._assaultAuthorized = false;
      if (SL_STRESS.review) sq._slStressSince = null;
      /* A squad clearing the last contact is still in that engagement: its open fire order stands, so the man
         who finds the enemy again fires instead of the squad going to ground for a new volley. */
      if (FIRE_CONTROL_ON && !sq.clearContact) clearFireControl(sq, battle, 'contact broken');
      return;
    }
    stressReview(sq, battle);
    var fireControl = FIRE_CONTROL_ON ? updateFireControl(sq, battle, r) : null;
    /* Hold/precision fire control is a preparation, not a bound. The Squad Leader keeps the squad
       stationary until it opens the engagement; a designated long-range shooter is the one exception. */
    if (fireControl && fireControl.state !== 'open') {
      sq._assaultAuthorized = false;
      return;
    }
    if (COA_ON) updateCOA(sq);
    sq._assaultAuthorized = !!ASSAULT_PHASES[sq.commandPhase || ''];
    /* 3c: the COA gates bounding. Defend holds position (no bounds); assault bounds only if the
       phase also allows. The explicit `?coa=0` control never sets sq.coa, so this is a no-op there. */
    if (COA_ON && sq.coa && COAS[sq.coa] && !COAS[sq.coa].bounds) sq._assaultAuthorized = false;
    /* A bound needs a base of fire: somebody has to be shooting while somebody else moves. */
    if (
      !sq._assaultAuthorized ||
      L.holds(sq, 'bound-cycle', t) ||
      L.holds(sq, 'bound', t) ||
      r.effective < 2 ||
      r.pinned >= r.effective
    )
      return;
    /* Rotate teams, but skip a team whose departure would strip the base of fire: waiting a tick for
     the rotation to reach a team that can go is a missed bound. With `?slStress=pick` or `hold` every team
     that can go is a candidate, in rotation order. */
    var first = sq._boundTurn == null ? 0 : sq._boundTurn + 1,
      lead = SL_STRESS.pick || SL_STRESS.hold,
      candidates = [],
      turn,
      team,
      movers,
      holding,
      buddy;
    for (var k = 0; k < BOUND_TEAMS.length; k++) {
      turn = first + k;
      team = BOUND_TEAMS[turn % BOUND_TEAMS.length];
      movers = [];
      for (i = 0; i < members.length; i++) {
        s = members[i];
        if (s.dead || s.suppressedUntil > battle.time || s.reloading || s.clearingStoppage || s.outOfAmmo)
          continue;
        // Down, on the run or charging (Engagement's report): not his to bound.
        if (r.reacting && r.reacting.indexOf(s) >= 0) continue;
        if (
          root.SquadAI.isMachineGun(s) ||
          (root.BattleTacticalPositions && root.BattleTacticalPositions.current(s))
        )
          continue; // positional tasks hold the base of fire
        if (s._fireteamKey && s._fireteamKey !== team) continue;
        movers.push(s);
      }
      buddy = buddyBoundPreview(sq, team, movers, r.fireSupport, battle);
      movers = buddy.movers;
      holding = r.fireSupport.filter(function (man) {
        return movers.indexOf(man) < 0;
      }).length;
      if (movers.length && holding >= 2) {
        if (!lead) break;
        candidates.push({ turn: turn, team: team, movers: movers, holding: holding, stress: teamStress(movers), buddy: buddy });
      }
    }
    var pickedBy = null,
      rotation = null,
      c;
    if (lead && candidates.length) {
      rotation = candidates[0];
      c = rotation;
      if (SL_STRESS.pick)
        for (k = 1; k < candidates.length; k++) if (candidates[k].stress < c.stress) c = candidates[k];
      if (c !== rotation) pickedBy = 'calmest';
      if (
        SL_STRESS.hold &&
        candidates.every(function (x) {
          return x.stress >= LEAD_TUNING.holdAt;
        })
      ) {
        L.grant(sq, 'bound-cycle', 'squad-leader', t, t + BOUND_CYCLE, 'bound held: every team shaken', 'cycle expiry');
        telemetry(battle, 'decision-bound-held', {
          faction: sq.faction,
          squad: sq.id,
          teams: candidates.length,
          stress: +c.stress.toFixed(3)
        });
        return;
      }
      turn = c.turn;
      team = c.team;
      movers = c.movers;
      holding = c.holding;
      buddy = c.buddy;
    }
    if (!(movers.length && holding >= 2)) turn = first;
    sq._boundTurn = turn;
    if (movers.length && holding >= 2) {
      L.grant(
        sq,
        'bound',
        'squad-leader',
        t,
        t + BOUND_DURATION,
        'fireteam ' + team + ' bounds',
        'window expiry or contact broken',
        {
          team: team
        }
      );
      L.grant(
        sq,
        'bound-cycle',
        'squad-leader',
        t,
        t + BOUND_CYCLE,
        'after bound by ' + team,
        'cycle expiry'
      );
      commitBuddyCooperation(sq, buddy, battle);
      E.orderBound(movers);
      var info = {
        faction: sq.faction,
        squad: sq.id,
        team: team,
        movers: movers.length,
        holding: holding
      };
      if (lead) {
        info.stress = +c.stress.toFixed(3);
        info.rotation = rotation.team;
        info.reason = pickedBy || 'rotation';
      }
      telemetry(battle, 'decision-bound', info);
    }
  }
  function updateSquadState(sq, battle) {
    var living = 0,
      anyEngaged = false;
    for (var i = 0; i < sq.members.length; i++) {
      var s = sq.members[i];
      if (!s.dead) living++;
      if (s.target) anyEngaged = true;
    }
    sq.aliveCount = living;
    var casualtyFrac = 1 - living / root.SquadAI.establishment(sq);
    if (MORALE_ON) {
      var stress = squadStress(sq);
      if (sq.state === 'retreat') {
        /* Rally: a retreating squad reforms once calm and clear of its break threshold. Casualties do
           not heal, so a squad the flat rule broke (60%) keeps falling back until a merge restores it. */
        if (moraleRallies(casualtyFrac, stress)) sq.state = anyEngaged ? 'engaged' : 'advance';
      } else {
        /* Break: stress lowers the casualty threshold. At zero stress this is exactly the
           flat 60% rule. */
        if (casualtyFrac >= moraleBreakAt(stress)) sq.state = 'retreat';
        else sq.state = anyEngaged ? 'engaged' : 'advance';
      }
    } else if (casualtyFrac >= 0.6) sq.state = 'retreat';
    else sq.state = anyEngaged ? 'engaged' : 'advance';
    if (battle) updateSuccession(sq, battle);
    if (battle) updateAssembly(sq, battle);
    noteSafePoint(sq, battle);
    fireAndMovement(sq, battle);
  }
  /* Succession. When the squad leader is killed nobody commands for SUCCESSION_DELAY seconds (the
     `succession` lease: the squad runs on its leaderless cohesion and corner rules and the accuracy
     penalty applies); then the most senior survivor takes command (SquadAI.mostSenior), takes the
     leader's slot and the penalty ends. A squad with a leader holds no lease. */
  function updateSuccession(sq, battle) {
    var t = battle.time,
      held = L.get(sq, 'succession'),
      men = alive(sq),
      present = root.SquadAI.leaderOf(sq);
    if (present || !men.length) {
      if (held) L.end(sq, 'succession', t, men.length ? 'leader present' : 'squad destroyed');
      if (LEADERLESS_INTENT_ON && sq._leaderlessIntent)
        endLeaderlessIntent(sq, battle, men.length ? 'leader present' : 'squad destroyed', present || null);
      return;
    }
    if (!held) {
      var data = null;
      if (LEADERLESS_INTENT_ON) data = { intent: captureLeaderlessIntent(sq, battle) };
      L.grant(
        sq,
        'succession',
        'squad-leader',
        t,
        t + SUCCESSION_DELAY,
        'squad leader killed',
        'successor takes command',
        data
      );
      return;
    }
    if (LEADERLESS_INTENT_ON && !sq._leaderlessIntent) {
      sq._leaderlessIntent = (held.data && held.data.intent) || captureLeaderlessIntent(sq, battle);
      held.data = held.data || {};
      held.data.intent = sq._leaderlessIntent;
    }
    if (L.holds(sq, 'succession', t)) return;
    var next = root.SquadAI.mostSenior(men);
    sq.leaderId = next.id;
    next.slotIndex = 0;
    next.slotRole = null;
    next._fireteamKey = null;
    sq.captainAlive = true;
    sq.accuracyMultiplier = 1;
    L.end(sq, 'succession', t, 'successor took command');
    if (LEADERLESS_INTENT_ON) endLeaderlessIntent(sq, battle, 'successor took command', next);
    telemetry(battle, 'decision-leader-succession', {
      faction: sq.faction,
      squad: sq.id,
      soldier: next.id,
      role: next.role,
      leaderlessSeconds: +(t - held.since).toFixed(2)
    });
  }
  /* The Squad Leader's word on who commands and where each man stands. Other layers report the event
     and this layer rewrites its own state: a leader killed (`leaderDown`, called from killSoldier), a
     reconstitution merge (`reform` for the squad that survives, `disband` for one absorbed) and the
     General's acknowledgement that it read a request (`acknowledgeRequest`). */
  function leaderDown(sq) {
    sq.captainAlive = false;
    sq.accuracyMultiplier = 0.8;
  }
  /* Slot 0 is the leader, 1 the squad's gun, 2-3 its scouts; every other man - a second gunner, a third
     scout, a former leader - takes a rifleman slot from 4 up (`slotRole`, SquadAI.formationSlot). */
  function assignSlots(men, leader) {
    var gun = false,
      scouts = 0,
      next = 4;
    leader.slotIndex = 0;
    leader.slotRole = null;
    for (var i = 0; i < men.length; i++) {
      var s = men[i];
      if (s === leader) continue;
      s.slotRole = null;
      if (s.role === 'gunner' && !gun) {
        gun = true;
        s.slotIndex = 1;
      } else if (s.role === 'scout' && scouts < 2) s.slotIndex = 2 + scouts++;
      else {
        s.slotIndex = next++;
        if (s.role !== 'rifleman') s.slotRole = 'rifleman';
      }
    }
  }
  /* A reconstitution merge: `men` (already members of `survivor`) form one squad under `leader`, anchored
     on the group's rally point, with no plan, post, task or fireteam carried over from their old squads. */
  function reform(survivor, men, leader, rally, establishment) {
    assignSlots(men, leader);
    men.forEach(function (s) {
      s.squad = survivor;
      s._fireteamKey = null;
      s._defensePost = null;
      s._engagementTask = null;
      s._engagementPlanSerial = null;
    });
    survivor.members = men;
    survivor.leaderId = leader.id;
    survivor.establishment = establishment;
    survivor.aliveCount = men.length;
    survivor.captainAlive = true;
    survivor.accuracyMultiplier = 1; // the leader-death penalty (killSoldier) ends with a leader
    publishAnchor(survivor, rally);
  }
  // A squad absorbed by a merge reads like a destroyed one: nobody living and nobody in command.
  function disband(sq) {
    sq.members = [];
    sq.aliveCount = 0;
    sq.leaderId = null;
  }
  /* The last place the squad stood out of contact with nobody known near it: where a man who breaks and runs goes first
     (Engagement `flee` reads `squad.safePoint`; `squad.rally` is the moving anchor, which is at the front). */
  function noteSafePoint(sq, battle) {
    if (!battle || sq.state === 'retreat' || sq.inContact) return;
    if (root.SquadAI.squadContact ? root.SquadAI.squadContact(sq, battle) : sq.contact) return;
    var p = average(sq);
    if (p) sq.safePoint = { x: p.x, z: p.z };
  }
  /* Men who have broken for good (Engagement's report, `fled`) leave the squad and are not coming back to it: each
     becomes a squad of one, retreating, a full squad's strength missing, on the squad's home. A leader who runs leaves
     the squad leaderless (succession). The General may take a lone man into a retreating squad, or reconstitution
     groups him at base. */
  function detachFled(sq, battle, men) {
    var list = battle.factions && battle.factions[sq.faction] && battle.factions[sq.faction].squads;
    if (!list) return;
    men
      .filter(function (s) {
        return s.squad === sq && !s.dead;
      })
      .sort(function (a, b) {
        return a.id - b.id;
      })
      .forEach(function (s) {
        var wasLeader = root.SquadAI.leaderOf(sq) === s;
        sq.members = sq.members.filter(function (m) {
          return m !== s;
        });
        if (wasLeader) leaderDown(sq);
        var lone = root.SquadAI.createSquad(sq.id + '-fled-' + s.id, sq.faction, copy(sq.home), sq.objective);
        lone.members.push(s);
        lone.leaderId = s.id;
        lone.establishment = root.SquadAI.COMPOSITION.length;
        lone.fledId = s.id;
        lone.fledFrom = sq.id;
        lone.state = 'retreat';
        lone.route = [];
        lone.routeIndex = 0;
        lone._battleSim = battle;
        initialPhase(lone, 'approach');
        assignSlots([s], s);
        s.squad = lone;
        s._fireteamKey = null;
        s._defensePost = null;
        s._engagementTask = null;
        s._engagementPlanSerial = null;
        list.push(lone);
        telemetry(battle, 'decision-fled-detach', {
          faction: sq.faction,
          squad: sq.id,
          lone: lone.id,
          soldier: s.id,
          role: s.role,
          leader: wasLeader
        });
      });
  }
  /* A retreating squad takes in a lone fled man (the General decides, this layer rewrites its own roster): he joins the
     squad's roster on the next rifleman slot and his own squad of one is gone, like a squad absorbed by a merge. */
  function absorb(survivor, lone, battle) {
    var s = lone && lone.members && lone.members[0];
    if (!s || s.dead || !survivor || survivor === lone) return false;
    var slot = 3;
    survivor.members.forEach(function (m) {
      if (m.slotIndex > slot) slot = m.slotIndex;
    });
    s.squad = survivor;
    s.slotIndex = slot + 1;
    s.slotRole = 'rifleman';
    s._fireteamKey = null;
    survivor.members.push(s);
    lone.establishment = root.SquadAI.COMPOSITION.length;
    disband(lone);
    lone.disbanded = true;
    lone.mergedInto = survivor.id;
    telemetry(battle, 'decision-fled-absorbed', {
      faction: survivor.faction,
      squad: survivor.id,
      lone: lone.id,
      soldier: s.id
    });
    return true;
  }
  // A man's regroup-unstick record ends (stepMovement: he recovered, the lease ended or he died).
  function endUnstick(s) {
    s._regroupUnstick = null;
  }
  // The General has re-selected a brief: the request that woke it is answered.
  function acknowledgeRequest(sq) {
    sq._macroMissionRequest = null;
  }
  /* Retreat and reconstitution march. A retreating squad heads home (`to-base`); once home and out of
     contact it is `at-base`, the only state in which the General will group it. A `reconstitute` brief
     then sends it to the rally point (`to-rally`), where the General merges it. If the brief ends without
     a merge (the group dissolved) the squad is `at-base` again and walks home. `_assembly` is created on
     retreat and dropped when the squad stops retreating. SquadAI.retreatGoal() reads it. */
  function updateAssembly(sq, battle) {
    if (sq.state !== 'retreat') {
      sq._assembly = null;
      return;
    }
    var t = battle.time,
      m = sq._macroMission,
      briefed = !!(m && m.intent === 'reconstitute' && (m.status === 'issued' || m.status === 'executing')),
      a = sq._assembly || (sq._assembly = { phase: 'to-base', since: t, missionVersion: null });
    if (a.phase === 'to-rally' && !(briefed && m.version === a.missionVersion)) {
      a.phase = 'at-base';
      a.since = t;
      a.missionVersion = null;
    }
    if (a.phase === 'to-base' && !sq.inContact) {
      var p = average(sq);
      if (p && dist(p, sq.home) <= ASSEMBLY_HOME_RADIUS) {
        a.phase = 'at-base';
        a.since = t;
        telemetry(battle, 'decision-assembly-home', { faction: sq.faction, squad: sq.id });
      }
    }
    if (a.phase !== 'at-base' || !briefed) return;
    a.phase = 'to-rally';
    a.since = t;
    a.missionVersion = m.version;
    if (!root.BattleCommanderAI || !root.BattleCommanderAI.acceptMission)
      throw new Error('Squad Leader cannot accept a brief without its Macro lifecycle owner');
    root.BattleCommanderAI.acceptMission(battle, sq, true);
    telemetry(battle, 'decision-assembly-rally', {
      faction: sq.faction,
      squad: sq.id,
      version: m.version,
      rally: copy(m.point)
    });
  }
  /* The Squad Leader is SquadAI's squadCommand owner: status, fire and movement, anchor, fireteam slots. */
  root.SquadAI.extend('squadCommand', 'squad-leader', function (sq, battle) {
    updateSquadState(sq, battle);
    if (!battle) return;
    advanceSquadAnchor(sq, battle);
    updateFireteams(sq, battle);
    publishForwardLine(sq, battle);
  });

  function inTown(town, p) {
    return !!(town && town.center && p && dist(p, town.center) < (+town.radius || 250));
  }
  function missionLegs(m) {
    var legs = (m.route || []).map(copy);
    if (m.point) legs.push(copy(m.point));
    return legs;
  }
  function assaultCommitted(sim, sq) {
    var a = sim.factions[sq.faction].squads;
    for (var i = 0; i < a.length; i++)
      if (a[i] !== sq && ((+a[i].routeIndex || 0) >= 2 || a[i].state === 'engaged')) return true;
    return false;
  }
  function objectivePhase(sim, sq, m, c, pos) {
    var obj = root.BattleObjectiveSystem && root.BattleObjectiveSystem.get(sim, m.objectiveId),
      radius = +(obj && obj.def && obj.def.radius) || 30,
      inside = dist(pos, m.point) <= radius * (+c.captureCommitRatio || 0.82);
    if (m.intent === 'defend') return m.requestKey || inside ? 'defend' : 'assault';
    return inside ? 'capture' : 'assault';
  }
  /* Squad Leader execution of the General's brief: the only runtime writer of phase, legs and the squad
   objective point. Without a brief (Macro OFF) the Squad Leader walks the assigned approach route. */
  function executeMission(sim, sq, town) {
    if (!sim || !sq) return;
    /* Which lease, if any, is holding this squad's mission execution this tick (diagnostics). */
    sq._missionHold = null;
    if (sq.state === 'retreat' || !alive(sq).length) return;
    if (leaderlessActive(sq)) {
      sq._missionHold = 'succession';
      return;
    }
    if (L.get(sq, 'regroup')) {
      sq._missionHold = 'regroup';
      return;
    }
    var m = sq._macroMission || null,
      ex = sq._missionExecution,
      t = sim.time,
      c = cfg(sim, sq),
      pos = average(sq);
    if (!ex || ex.mission !== m) {
      ex = sq._missionExecution = { mission: m, acceptedAt: t, holdPoint: copy(pos) };
      if (m) {
        sq.route = missionLegs(m);
        sq.routeIndex = 0;
        L.end(sq, 'corner-hold', t, 'new mission');
      }
      if (m && m.status === 'issued') {
        if (!root.BattleCommanderAI || !root.BattleCommanderAI.acceptMission)
          throw new Error('Squad Leader cannot accept a brief without its Macro lifecycle owner');
        root.BattleCommanderAI.acceptMission(sim, sq, false);
      }
    }
    /* A firefight under this brief is a commitment: contact never advances legs or rewrites phase. */
    var plan = sq._engagementPlan;
    if (plan && (plan.status === 'active' || plan.status === 'quiet')) {
      if (plan.missionVersion === missionVersion(sq)) {
        sq._missionHold = 'tactical-plan';
        return;
      }
      closePlan(sim, sq, 'mission superseded');
    }
    var legs = sq.route || [];
    if (!legs.length) return;
    var last = legs.length - 1,
      idx = Math.max(0, Math.min(last, +sq.routeIndex || 0)),
      wp = legs[idx];
    /* A live recon task is itself the mission hold. It never advances a route leg or silently changes
       command phase while the scouts are out. A superseding macro brief invalidates it immediately. */
    if (L.get(sq, 'recon')) {
      if (!sq._reconTask || sq._reconTask.missionVersion !== missionVersion(sq))
        endRecon(sq, sim, 'mission-change');
      if (L.get(sq, 'recon')) {
        sq._missionHold = 'recon';
        sq.objective = copy(wp);
        return;
      }
    }
    if ((m && m.intent === 'reserve') || (!m && sq.commandRole === 'reserve')) {
      setPhase(sim, sq, 'reserve', 'holding reserve');
      sq.objective = copy(legs[last]);
      return;
    }
    if (m && m.intent === 'hold') {
      setPhase(sim, sq, 'hold', 'mission hold');
      sq.objective = copy(legs[last]);
      return;
    }
    if (
      sq.commandRole === 'support' &&
      idx >= 1 &&
      t < (+c.supportDelay || 0) &&
      !assaultCommitted(sim, sq)
    ) {
      setPhase(sim, sq, 'support-hold', 'waiting for assault');
      sq.objective = copy(legs[Math.min(1, last)]);
      return;
    }
    if (L.holds(sq, 'corner-hold', t)) {
      sq._missionHold = 'corner-hold';
      sq.objective = copy(wp);
      return;
    }
    var recon = reconCandidate(sq, sim, wp);
    if (recon && startRecon(sq, sim, recon)) {
      sq._missionHold = 'recon';
      sq.objective = copy(wp);
      return;
    }
    var axisEnd = m ? (m.route || []).length - 1 : last,
      limit = +(leaderAlive(sq) ? c.cohesionRadius : c.captainlessCohesion) || 34,
      urban = inTown(town, wp);
    var arrival =
      idx === axisEnd
        ? Math.max(+c.finalRouteRadius || 14, 32)
        : urban
          ? Math.max(+c.routeArrivalRadius || 8, limit * URBAN_ARRIVAL_COHESION)
          : +c.routeArrivalRadius || 8;
    if (idx < last && dist(pos, wp) < arrival) {
      var from = idx;
      sq.routeIndex = idx = idx + 1;
      wp = legs[idx];
      telemetry(sim, 'decision-route', {
        faction: sq.faction,
        squad: sq.id,
        from: from,
        to: idx,
        x: wp.x,
        z: wp.z
      });
      if (urban) {
        L.grant(
          sq,
          'corner-hold',
          'squad-leader',
          t,
          t + (+c.cornerHold || 0) + (leaderAlive(sq) ? 0 : +c.cornerNoCaptainExtra || 0),
          'urban corner after route leg ' + from,
          'expiry, new mission or regroup release'
        );
        setPhase(sim, sq, 'corner-check', 'route ' + from);
        sq.objective = copy(wp);
        return;
      }
    }
    if (m && m.objectiveId && idx === last) {
      if (m.action === 'hold' || m.action === 'regroup') {
        setPhase(sim, sq, 'hold', 'doctrine ' + m.action);
        sq.objective = copy(ex.holdPoint || pos);
        return;
      }
      if (m.action === 'support') {
        setPhase(sim, sq, 'support-hold', 'doctrine support');
        sq.objective = copy(ex.holdPoint || pos);
        return;
      }
      setPhase(sim, sq, objectivePhase(sim, sq, m, c, pos), 'mission ' + m.objectiveId);
      sq.objective = copy(wp);
      return;
    }
    /* No separate distance-based contact phase: a firefight is Engagement's inContact, which the
       plan lease and fire-and-movement already follow (2026-09-24 Macro-off benchmark: removing
       it left 29 of 30 battles identical). */
    if (m && m.action === 'flank' && idx === axisEnd) setPhase(sim, sq, 'flank', 'doctrine flank');
    else if (inTown(town, pos)) setPhase(sim, sq, 'clear-town', 'inside objective area');
    else setPhase(sim, sq, 'approach', 'route advance');
    sq.objective = copy(wp);
  }

  function summary(sim) {
    var out = {
      plans: 0,
      active: 0,
      quiet: 0,
      regroups: 0,
      fireteams: 0,
      leases: {},
      missionHeldBy: {},
      orderPublishing: Object.assign(
        {},
        sim._squadCommandPublishStats || { intentChecks: 0, intentPublishes: 0, intentCoalesced: 0 }
      )
    };
    ['us', 'ge'].forEach(function (f) {
      var a = (sim && sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
      for (var i = 0; i < a.length; i++) {
        var q = a[i],
          p = q._engagementPlan;
        if (p) {
          out.plans++;
          if (p.status === 'active') out.active++;
          if (p.status === 'quiet') out.quiet++;
        }
        if (L.get(q, 'regroup')) out.regroups++;
        out.fireteams += Object.keys(q._fireteamOrders || {}).length;
        L.active(q, sim.time).forEach(function (l) {
          out.leases[l.kind] = (out.leases[l.kind] || 0) + 1;
        });
        if (q._missionHold) out.missionHeldBy[q._missionHold] = (out.missionHeldBy[q._missionHold] || 0) + 1;
      }
    });
    sim._squadCommandSummary = out;
    sim._engagementPlanSummary = { live: out.plans, active: out.active, quiet: out.quiet };
    sim._regroupHysteresisSummary = {
      active: out.regroups,
      enterGrace: REGROUP_ENTER,
      exitRatio: REGROUP_RELEASE
    };
    return out;
  }
  function reset(sim) {
    sim._squadCommandPublishStats = { intentChecks: 0, intentPublishes: 0, intentCoalesced: 0 };
    if (BUDDY_PAIRS_ON) sim._buddyPairStats = null;
    sim._scoutsForwardStats = null;
    sim._leaderlessIntentStats = null;
    ['us', 'ge'].forEach(function (f) {
      var a = (sim && sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
      for (var i = 0; i < a.length; i++) {
        var q = a[i];
        q._engagementPlan = null;
        q._stablePlan = null;
        q._engagementPlanSerial = 0;
        q._planDormantSignature = null;
        q._missionExecution = null;
        q._macroMissionRequest = null;
        q._regroupHysteresis = null;
        q._regroupRecovery = null;
        q._regroupRecoverySerial = 0;
        q._fireteamOrders = {};
        q._reconTask = null;
        q._reconLast = null;
        q._reconReportMonitor = null;
        q._leaderlessIntent = null;
        if (BUDDY_PAIRS_ON) {
          q._buddyPairs = {};
          q._buddyUnpaired = [];
          q._buddyPairHistory = [];
        }
        L.clear(q);
        q._boundTurn = null;
        q._assaultAuthorized = false;
        q.fireControl = null;
        (q.members || []).forEach(function (s) {
          s._regroupUnstick = null;
          s._fireteamDestination = null;
          s._fireteamPublishKey = null;
          s._fireteamKey = null;
          s._defensePost = null;
          s._engagementTask = null;
        });
      }
    });
    summary(sim);
  }
  function commanderTick(sim, payload) {
    var town = (payload && payload.town) || null;
    ['us', 'ge'].forEach(function (f) {
      var a = (sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
      for (var i = 0; i < a.length; i++) {
        var q = a[i];
        updateCohesion(sim, q);
        executeMission(sim, q, town);
        updatePlan(sim, q);
        L.prune(q, sim.time);
      }
    });
    summary(sim);
  }

  root.BattleModules.registerSystem('squad-command', {
    version: '1.7-m3c-leaderless-intent',
    onBattleStart: start,
    beforeBattleRestart: reset,
    onBattleRestart: start,
    onCommanderTick: commanderTick
  });
  root.BattleSquadStability = {
    version: '1.9-m3c-leaderless-intent',
    planSeconds: { assault: ASSAULT_LEASE, defense: DEFENSE_LEASE },
    teamOrderSeconds: TEAM_LEASE,
    boundCycle: BOUND_CYCLE,
    boundDuration: BOUND_DURATION,
    tuning: {
      morale: MORALE_TUNING,
      buddyPairs: BUDDY_TUNING,
      coa: COA_TUNING,
      fireControl: FIRE_CONTROL_TUNING,
      lead: LEAD_TUNING,
      retreatAnchor: {
        lease: RETREAT_ANCHOR_LEASE,
        arrive: RETREAT_ANCHOR_ARRIVE,
        progressEps: RETREAT_PROGRESS_EPS,
        goalEps: RETREAT_GOAL_EPS,
        noProgress: RETREAT_NO_PROGRESS,
        recoveryStride: RETREAT_RECOVERY_STRIDE
      },
      scoutsForward: RECON_TUNING,
      leaderlessIntent: LEADERLESS_TUNING
    },
    leaderlessIntentOn: function () { return LEADERLESS_INTENT_ON; },
    parseLeaderlessIntent: parseLeaderlessIntent,
    leaderlessActive: leaderlessActive,
    leaderlessTelemetry: leaderlessTelemetry,
    scoutsForwardOn: function () { return SCOUTS_FORWARD_ON; },
    parseScoutsForward: parseScoutsForward,
    reconCandidate: reconCandidate,
    selectReconScouts: selectReconScouts,
    startRecon: startRecon,
    updateRecon: updateRecon,
    endRecon: endRecon,
    reconTelemetry: reconTelemetry,
    slStress: function () { return Object.assign({}, SL_STRESS); },
    parseSlStress: parseSlStress,
    buddyPairsOn: function () { return BUDDY_PAIRS_ON; },
    parseBuddyPairs: parseBuddyPairs,
    updateBuddyPairs: updateBuddyPairs,
    buddyFor: function (s) {
      var sq = s && s.squad, pairs = sq && sq._buddyPairs;
      if (!BUDDY_PAIRS_ON || !pairs || !s) return null;
      var ids = Object.keys(pairs);
      for (var i = 0; i < ids.length; i++) {
        var p = pairs[ids[i]];
        if (String(p.aId) === String(s.id) || String(p.bId) === String(s.id))
          return {
            pair: p.id,
            buddy: String(p.aId) === String(s.id) ? p.bId : p.aId,
            team: p.team,
            state: p.state,
            reason: p.reason,
            since: p.since,
            separation: p.separation,
            routeGap: p.routeGap,
            moving: p.movingId,
            covering: p.coveringId
          };
      }
      return null;
    },
    buddySnapshot: buddySnapshot,
    buddyTelemetry: buddyTelemetry,
    moraleOn: function () { return MORALE_ON; },
    fireControlOn: function () { return FIRE_CONTROL_ON; },
    alertAdvanceOn: function () { return ALERT_ADVANCE; },
    fireControl: function (sq) { return sq && sq.fireControl ? Object.assign({}, sq.fireControl) : null; },
    updateFireControl: updateFireControl,
    advanceSquadAnchor: advanceSquadAnchor,
    updateFireteams: updateFireteams,
    updateCohesion: updateCohesion,
    coaOn: function () { return COA_ON; },
    coas: function () { return Object.keys(COAS); },
    /* Read-only views of the two decisions, for the checks and the probes (nothing in the runtime calls them). */
    moraleBreakAt: moraleBreakAt,
    moraleRallies: moraleRallies,
    coaInputs: coaInputsOf,
    coaDecide: function (inputs) {
      var scores = {};
      Object.keys(COAS).forEach(function (n) {
        scores[n] = coaScore(n, inputs);
      });
      return { winner: decideCOA(inputs), scores: scores };
    },
    boundPhases: function () { return Object.keys(ASSAULT_PHASES); },
    fireAndMovement: fireAndMovement,
    states: PHASE_STATES,
    transitionPhase: transitionPhase,
    initialPhase: initialPhase,
    publishAnchor: publishAnchor,
    leaderDown: leaderDown,
    reform: reform,
    disband: disband,
    detachFled: detachFled,
    absorb: absorb,
    acknowledgeRequest: acknowledgeRequest,
    endUnstick: endUnstick,
    teamKeyFor: teamKeyFor,
    placeAtSlots: placeAtSlots,
    executeMission: executeMission
  };
  root.BattleEngagementPlans = {
    version: '1.5-m3c-mission-execution',
    current: function (sq) {
      return planSnapshot(sq && sq._engagementPlan);
    },
    summary: function (sim) {
      return sim && sim._engagementPlanSummary
        ? JSON.parse(JSON.stringify(sim._engagementPlanSummary))
        : null;
    }
  };
  root.BattleRegroupHysteresis = {
    version: '1.5-m3c-mission-execution',
    enterGrace: REGROUP_ENTER,
    exitRatio: REGROUP_RELEASE,
    minRegroup: REGROUP_MIN,
    reentryCooldown: REENTRY,
    assessment: cohesionAssessment,
    summary: function (sim) {
      return sim && sim._regroupHysteresisSummary
        ? JSON.parse(JSON.stringify(sim._regroupHysteresisSummary))
        : null;
    }
  };
  console.log('[M3C] meso squad-command owner: stable Squad Leader plan + coalesced fireteam publishing');
})(typeof window !== 'undefined' ? window : globalThis);
