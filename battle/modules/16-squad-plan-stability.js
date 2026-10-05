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
  L.define('rally-recovery', {
    priority: 88,
    progress: function (sq, lease, t) {
      var d = (lease && lease.data) || {};
      return {
        ok: d.stableSince == null ? null : true,
        detail: 'post-retreat reform ' + Math.max(0, t - lease.since).toFixed(1) + ' s'
      };
    }
  });

  var ASSAULT_LEASE = 26,
    DEFENSE_LEASE = 38,
    QUIET_CLOSE = 9,
    TEAM_LEASE = 12;
  var REGROUP_ENTER = 1.35,
    REGROUP_RELEASE = 0.78,
    REGROUP_MIN = 2.4,
    /* If a regroup has been active this long without the rally quorum being met (a stuck
       straggler behind a wall keeps rallyInside below rallyRequired), release the squad
       back to mission execution rather than holding it indefinitely. The squad leaves
       with a regroup-stuck lease-bypass so the cohered majority is not immediately
       yanked back into a new regroup by the rawSpread > operatingLimit gate. */
    REGROUP_ESCALATION_SECS = 7.2,
    REENTRY = 4;
  var STRAGGLER_BYPASS = 2.8,
    URBAN_ARRIVAL_COHESION = 0.5;
  var BOUND_CYCLE = 9.0,
    BOUND_DURATION = 3.6,
    BOUND_TEAMS = ['alpha', 'bravo', 'charlie'],
    ASSAULT_PHASES = { assault: 1, capture: 1, 'clear-town': 1 };
  var ASSEMBLY_HOME_RADIUS = 20,
    SUCCESSION_DELAY = 6;
  function parseRallyRecovery(search) {
    return !/[?&]rallyRecovery=(?:0|off|false)(?:&|#|$)/i.test(search || '');
  }
  var RALLY_RECOVERY_ON = parseRallyRecovery(typeof location !== 'undefined' ? location.search || '' : ''),
    RALLY_RECOVERY_DWELL = 4,
    RALLY_RECOVERY_ARRIVE = 5;
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
  var RECON_PHASES = { approach: 1, assault: 1, flank: 1, defend: 1 };

  /* Leaderless intent continuation is on by default after PR #197's deterministic checks and
     full-battle paired benchmark (run 37121639099); ?leaderlessIntent=0/off/false is the stable legacy
     arm. During the existing six-second succession lease there is no substitute Squad Leader: Meso
     command evolution freezes and the men may only finish already-published movement, keep valid local
     cover/buddy behavior, react through Engagement, retreat for survival, and report through existing
     Perception/Callouts channels. The new leader resumes ordinary ownership after succession. */
  function parseLeaderlessIntent(search) {
    return !/[?&]leaderlessIntent=(?:0|off|false)(?:&|#|$)/i.test(search || '');
  }
  var LEADERLESS_INTENT_ON = parseLeaderlessIntent(
    typeof location !== 'undefined' ? location.search || '' : ''
  );
  var LEADERLESS_TUNING = {
    successionSeconds: SUCCESSION_DELAY
  };

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

  /* Fire discipline. A sighting is a request to the Squad Leader, not permission to shoot.
     ?fireControl=0 is the old immediate-fire control for paired A/B work. The state is squad-owned:
       hold      everybody prepares prone and stays silent;
       precision one designated marksman may fire, the rest stay prepared;
       open      ordinary Engagement fire/suppression is allowed.
     Incoming fire always escalates to open and an individual under fire may return it immediately. */
  var FIRE_CONTROL_ON = !(
    typeof location !== 'undefined' && /[?&]fireControl=(?:0|off|false)\b/.test(location.search || '')
  );
  /* Phase 0G3: fireteam split on multi-contact. When on, a squad with active contacts in 2+
     threat sectors (via squadContactsMap) suppresses bounding and holds position to deal with
     both threats before continuing the advance. Default off; the off arm is unchanged
     single-contact fire-and-movement. */
  var FIRETEAM_SPLIT_ON = !!(typeof location !== 'undefined' && location.search && /[?&]fireteamSplit=1\b/.test(location.search));
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
  /* Fire-control functions are extracted to 15a-squad-leader-fire-control.js.
     The factory is called after the shared utilities (telemetry, dist, average,
     commanded, leaderAlive) are defined below. The returned functions are attached
     as closure variables so all callers see the same functions as before. */
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
  /* Fire-control factory: extract the fire-control functions from the extracted sub-module
     (15a-squad-leader-fire-control.js) with the shared utilities as closure deps. */
  var _fc = root._squadLeaderFireControl
    ? root._squadLeaderFireControl({
        root: root,
        telemetry: telemetry,
        dist: dist,
        average: average,
        commanded: commanded,
        leaderAlive: leaderAlive,
        FIRE_CONTROL_ON: FIRE_CONTROL_ON,
        FIRETEAM_SPLIT_ON: FIRETEAM_SPLIT_ON,
        FIRE_CONTROL_TUNING: FIRE_CONTROL_TUNING
      })
    : null;
  var mkm = _fc ? _fc.mkm : function () { return 0.5; },
    firstHandContact = _fc ? _fc.firstHandContact : function () { return null; },
    fireControlRange = _fc ? _fc.fireControlRange : function () { return Infinity; },
    precisionShooter = _fc ? _fc.precisionShooter : function () { return null; },
    fireControlTelemetry = _fc ? _fc.fireControlTelemetry : function () {},
    fireControlTrailEntry = _fc ? _fc.fireControlTrailEntry : function () { return {}; },
    pushFireControlTrail = _fc ? _fc.pushFireControlTrail : function () { return []; },
    fireControlCounts = _fc ? _fc.fireControlCounts : function () { return { ready: 0 }; },
    setFireControl = _fc ? _fc.setFireControl : function () { return null; },
    clearFireControl = _fc ? _fc.clearFireControl : function () {},
    updateFireControl = _fc ? _fc.updateFireControl : function () { return null; };
  /* Leaderless-intent functions are extracted to 15d-squad-leader-leaderless-intent.js.
     The factory is called after the shared utilities and the LEADERLESS_INTENT_ON flag are
     in scope; teamKeyFor and missionVersion are hoisted function declarations, so passing
     them here is safe. The returned functions are attached as closure variables so all
     callers see the same functions as before. */
  var _ll = root._squadLeaderLeaderlessIntent
    ? root._squadLeaderLeaderlessIntent({
        root: root,
        telemetry: telemetry,
        alive: alive,
        leaderAlive: leaderAlive,
        point: point,
        copy: copy,
        teamKeyFor: teamKeyFor,
        missionVersion: missionVersion,
        LEADERLESS_INTENT_ON: LEADERLESS_INTENT_ON
      })
    : null;
  var leaderlessActive = _ll ? _ll.leaderlessActive : function () { return false; },
    leaderlessStats = _ll ? _ll.leaderlessStats : function () { return null; },
    leaderlessTelemetry = _ll ? _ll.leaderlessTelemetry : function () { return null; },
    captureLeaderlessIntent = _ll ? _ll.captureLeaderlessIntent : function () { return null; },
    noteLeaderlessAction = _ll ? _ll.noteLeaderlessAction : function () {},
    endLeaderlessIntent = _ll ? _ll.endLeaderlessIntent : function () { return null; };
  /* Morale + COA functions are extracted to 15e-squad-leader-morale-coa.js.
     The factory is called after the flags and the declared tables are in scope.
     The returned functions are attached as closure variables so all callers
     (updateSquadState, fireAndMovement, recoverFromRetreat, the public API
     export) see the same functions as before. */
  var _mc = root._squadLeaderMoraleCoa
    ? root._squadLeaderMoraleCoa({
        root: root,
        MORALE_TUNING: MORALE_TUNING,
        COAS: COAS,
        COA_INPUTS: COA_INPUTS,
        COA_WEIGHTS: COA_WEIGHTS
      })
    : null;
  var squadStress = _mc ? _mc.squadStress : function () { return 0; },
    moraleBreakAt = _mc ? _mc.moraleBreakAt : function () { return 0.6; },
    moraleRallies = _mc ? _mc.moraleRallies : function () { return false; },
    coaInputsOf = _mc ? _mc.coaInputsOf : function () { return {}; },
    coaScore = _mc ? _mc.coaScore : function () { return 0; },
    decideCOA = _mc ? _mc.decideCOA : function () { return 'assault'; },
    updateCOA = _mc ? _mc.updateCOA : function () { return null; };
  /* Retreat-anchor + publishAnchor functions are extracted to
     15f-squad-leader-retreat-anchor.js. The factory is called after the shared utilities
     and the RETREAT_* tuning are in scope (averageMembers is a hoisted function
     declaration). The returned functions are attached as closure variables so all callers
     (advanceSquadAnchor, updateCohesion, reform, the public API export) see the same
     functions as before. publishAnchor is still the one writer of orderAnchor/rally;
     state-ownership-check.js now holds the pair to this sub-module's file. */
  var _ra = root._squadLeaderRetreatAnchor
    ? root._squadLeaderRetreatAnchor({
        root: root,
        telemetry: telemetry,
        dist: dist,
        copy: copy,
        commanded: commanded,
        average: average,
        averageMembers: averageMembers,
        ORDER_STRIDE: ORDER_STRIDE,
        RETREAT_ANCHOR_LEASE: RETREAT_ANCHOR_LEASE,
        RETREAT_ANCHOR_ARRIVE: RETREAT_ANCHOR_ARRIVE,
        RETREAT_PROGRESS_EPS: RETREAT_PROGRESS_EPS,
        RETREAT_GOAL_EPS: RETREAT_GOAL_EPS,
        RETREAT_NO_PROGRESS: RETREAT_NO_PROGRESS,
        RETREAT_BLOCKED_MIN: RETREAT_BLOCKED_MIN,
        RETREAT_DANGER_MARGIN: RETREAT_DANGER_MARGIN,
        RETREAT_RECOVERY_STRIDE: RETREAT_RECOVERY_STRIDE
      })
    : null;
  var retreatCenter = _ra ? _ra.retreatCenter : function () { return null; },
    retreatBlocked = _ra ? _ra.retreatBlocked : function () { return false; },
    retreatUnsafe = _ra ? _ra.retreatUnsafe : function () { return false; },
    retreatPoint = _ra ? _ra.retreatPoint : function () { return null; },
    grantRetreatAnchor = _ra ? _ra.grantRetreatAnchor : function () { return null; },
    stableRetreatAnchor = _ra ? _ra.stableRetreatAnchor : function () { return null; },
    /* No-write fallback: the pair is published only by the owner function in 15f
       (state-ownership-check.js holds orderAnchor/rally to that file). The sub-module is
       always loaded before 16 (PHP glob sort and every harness load chain), so this arm
       is a load-order safety net, never a publisher. */
    publishAnchor = _ra ? _ra.publishAnchor : function () { return null; };
  /* Reconstitution functions are extracted to 15k-squad-leader-reconstitution.js.
     The factory is called after the leaderless, morale/COA and retreat-anchor re-attaches
     (recoverFromRetreat reads the morale functions, reform publishes through publishAnchor)
     and BEFORE the fire-and-movement one, whose ctx consumes detachFled. The returned
     functions are attached as closure variables so updateSquadState, fireAndMovement and
     the public API export see the same functions as before. */
  var _rk = root._squadLeaderReconstitution
    ? root._squadLeaderReconstitution({
        root: root,
        telemetry: telemetry,
        copy: copy,
        dist: dist,
        alive: alive,
        average: average,
        cfg: cfg,
        cohesionAssessment: cohesionAssessment,
        initialPhase: initialPhase,
        publishAnchor: publishAnchor,
        moraleRallies: moraleRallies,
        moraleBreakAt: moraleBreakAt,
        captureLeaderlessIntent: captureLeaderlessIntent,
        endLeaderlessIntent: endLeaderlessIntent,
        LEADERLESS_INTENT_ON: LEADERLESS_INTENT_ON,
        SUCCESSION_DELAY: SUCCESSION_DELAY,
        MORALE_TUNING: MORALE_TUNING,
        RALLY_RECOVERY_ON: RALLY_RECOVERY_ON,
        RALLY_RECOVERY_DWELL: RALLY_RECOVERY_DWELL,
        RALLY_RECOVERY_ARRIVE: RALLY_RECOVERY_ARRIVE,
        ASSEMBLY_HOME_RADIUS: ASSEMBLY_HOME_RADIUS
      })
    : null;
  var updateSuccession = _rk ? _rk.updateSuccession : function () {},
    leaderDown = _rk ? _rk.leaderDown : function () {},
    assignSlots = _rk ? _rk.assignSlots : function () {},
    reform = _rk ? _rk.reform : function () {},
    disband = _rk ? _rk.disband : function () {},
    noteSafePoint = _rk ? _rk.noteSafePoint : function () {},
    detachFled = _rk ? _rk.detachFled : function () {},
    absorb = _rk ? _rk.absorb : function () { return false; },
    endUnstick = _rk ? _rk.endUnstick : function () {},
    acknowledgeRequest = _rk ? _rk.acknowledgeRequest : function () {},
    endRallyRecovery = _rk ? _rk.endRallyRecovery : function () {},
    recoverFromRetreat = _rk ? _rk.recoverFromRetreat : function () { return false; },
    updateAssembly = _rk ? _rk.updateAssembly : function () {};
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
  function publishStats(battle) {
    return (
      battle._squadCommandPublishStats ||
      (battle._squadCommandPublishStats = { intentChecks: 0, intentPublishes: 0, intentCoalesced: 0 })
    );
  }

  /* Phase 0C: Meso still computes each fireteam slot, but an opted-in soldier does not receive a
     replacement slot until Command Reception says that exact personal envelope was adopted.
     Command Reception remains information-only; this Squad Leader module is still the only writer
     of _fireteamDestination and Movement Resolver remains the only physical endpoint arbiter. */
  function movementAdoptionOn() {
    var CR = root.BattleCommandReception;
    return !!(CR && CR.movementEnabled && CR.movementEnabled());
  }
  function movementScope(s) {
    return 'soldier:' + String(s && s.id);
  }
  function movementExecutionCurrent(s, battle) {
    var CR = root.BattleCommandReception;
    return !movementAdoptionOn() || CR.executionCurrent(s, battle, 'movement', movementScope(s), s._fireteamAdoptedEnvelope);
  }
  function movementSignature(publishKey, next) {
    return (
      String(publishKey || 'movement') +
      '|' +
      Math.round((+next.x || 0) / ORDER_PUBLISH_EPS) +
      '|' +
      Math.round((+next.z || 0) / ORDER_PUBLISH_EPS)
    );
  }
  function publishPersonalMovement(sq, battle, s, next, publishKey, urgent, kind, reason, stats, options) {
    var CR = root.BattleCommandReception,
      opt = options || {};
    if (!(CR && CR.movementEnabled && CR.movementEnabled())) {
      s._fireteamDestination = copy(next);
      s._fireteamPublishKey = publishKey;
      stats.intentPublishes++;
      if (root.BattleMovementResolver)
        root.BattleMovementResolver.proposeOrder(s, s._fireteamDestination, battle, !!urgent);
      else s.orderDestination = copy(s._fireteamDestination);
      return true;
    }

    var scope = movementScope(s),
      slot = 'movement|' + scope,
      view = CR.snapshot && CR.snapshot(s, battle),
      pending = view && view.records && view.records[slot],
      adopted = CR.adopted && CR.adopted(s, battle, 'movement', scope),
      samePending =
        pending &&
        pending.phase !== 'adopted' &&
        pending.data &&
        String(pending.data.publishKey || '') === String(publishKey || '');

    /* Freeze one replacement while this man is still processing it. Fireteam geometry may keep
       sliding with the formation every Meso tick; that must not continuously replace the pending
       envelope and make adoption impossible. A genuinely different publish key may supersede it. */
    if (!samePending) {
      CR.publish(sq, battle, 'movement', [s], {
        scope: scope,
        action: kind || 'formation',
        signature: movementSignature(publishKey, next),
        reason: reason || 'fireteam order',
        spatial: opt.reference === 'none' ? false : true,
        reference: opt.reference || 'point',
        point: next,
        data: {
          publishKey: String(publishKey || ''),
          urgent: !!urgent,
          kind: kind || 'formation',
          adoptHere: !!opt.adoptHere
        }
      });
      adopted = CR.adopted && CR.adopted(s, battle, 'movement', scope);
    }
    if (!adopted || !adopted.point || !adopted.data) return false;

    /* A non-spatial HOLD means stop when the order reaches the man, not return to the coordinate
       where he happened to be when the leader spoke. This matters only for commands that explicitly
       opt in (currently recon main-body holds); fixed spatial orders still execute their published point. */
    var appliedPoint = adopted.data.adoptHere ? point(s.root && s.root.position) : adopted.point,
      adoptedKey = String(adopted.data.publishKey || ''),
      previous = point(s._fireteamDestination);
    if (!appliedPoint) return false;
    if (
      s._fireteamAdoptedEnvelope === adopted.envelopeId &&
      previous &&
      dist(previous, appliedPoint) <= ORDER_PUBLISH_EPS &&
      s._fireteamPublishKey === adoptedKey
    )
      return false;

    if (adopted.data.adoptHere) s._fireteamDestination = copy(appliedPoint);
    else s._fireteamDestination = copy(adopted.point);
    s._fireteamPublishKey = adoptedKey;
    s._fireteamAdoptedEnvelope = adopted.envelopeId;
    stats.intentPublishes++;
    if (root.BattleMovementResolver)
      root.BattleMovementResolver.proposeOrder(
        s,
        s._fireteamDestination,
        battle,
        !!adopted.data.urgent
      );
    else s.orderDestination = copy(s._fireteamDestination);
    return true;
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
      /* Scale the trim allowance with squad size so a merged 4-man squad is not paralyzed
         by one stuck straggler. Cap at 2 (the original ceiling) so large squads do not
         over-trim and produce a degenerate small core. */
      allowed = Math.max(0, Math.min(2, Math.floor(n / 4))),
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
      /* Tactical dispersion is not marching formation. Outside open-ground advance,
         give independently positioned men a larger operating area; the existing
         core/outlier assessment still detects genuinely separated squads. */
      tactical = sq.commandPhase === 'assault' || sq.commandPhase === 'capture' ||
        sq.commandPhase === 'clear-town' || sq.commandPhase === 'defend' ||
        sq.commandPhase === 'hold' || sq.commandPhase === 'support-hold',
      operatingLimit = tactical ? limit * 1.5 : limit,
      release = operatingLimit * REGROUP_RELEASE,
      st = cohesionState(sq),
      t = sim.time,
      ca = cohesionAssessment(sq, operatingLimit);
    sq._cohesionAssessment = {
      rawSpread: +ca.rawSpread.toFixed(3),
      coreSpread: +ca.coreSpread.toFixed(3),
      stragglers: ca.stragglers.slice(),
      outrunners: ca.outrunners.slice(),
      allowed: ca.allowed,
      operatingRadius: +operatingLimit.toFixed(3),
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
      /* Regroup is an area objective, not a request to reconstruct fireteam slots.
         Count living commanded men inside the rally circle; a bounded minority of
         stragglers may catch up without holding the entire squad indefinitely. */
      var rallyAnchor = regroup.data.anchor || ca.center,
        rallyMen = commanded(sq),
        rallyInside = rallyMen.filter(function (man) {
          return dist(man.root.position, rallyAnchor) <= release;
        }).length,
        rallyRequired = Math.max(1, rallyMen.length - ca.allowed);
      /* A squad that has cohered elsewhere must not remain trapped by a stale
         rally point (e.g. a new tactical position reached while regrouping).
         Retain the original core-spread escape alongside rally-area quorum. */
      if (age >= REGROUP_MIN && (rallyInside >= rallyRequired || ca.coreSpread <= release)) {
        endRegroup(sim, sq, 'cohesion restored');
        return;
      }
      /* Escalation: if one or more men are genuinely stuck (their movement progress
         reports them stuck on a regroup-kind goal) and the rally quorum has not been
         met for REGROUP_ESCALATION_SECS, the cohered majority is being held indefinitely
         on the stuck man's account. Release the squad back to mission execution with a
         regroup-bypass lease so rawSpread > operatingLimit does not immediately re-enter
         regroup. The stuck men rejoin under STRAGGLER_BYPASS. Gated on actual stuck men
         (not just time) so a stationary squad in a test fixture or a slowly-converging
         squad is not escalated. */
      if (age >= REGROUP_ESCALATION_SECS && rallyInside < rallyRequired) {
        var hasStuckMan = alive(sq).some(function (man) {
          var p = man._movementProgress;
          return p && p.stuck && p.kind === 'regroup';
        });
        if (hasStuckMan) {
          st.escalations = (st.escalations || 0) + 1;
          L.extend(sq, 'regroup-bypass', 'squad-leader', t, t + STRAGGLER_BYPASS, 'regroup escalation: stuck straggler');
          endRegroup(sim, sq, 'regroup escalation: stuck straggler');
          return;
        }
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
    var requested = !sq.inContact && !L.holds(sq, 'regroup-bypass', t) && ca.rawSpread > operatingLimit;
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

  /* Buddy-pairs functions are extracted to 15b-squad-leader-buddy-pairs.js.
     The factory is called after teamKeyFor, point, dist, telemetry, and the
     BUDDY_PAIRS_ON/BUDDY_TUNING declarations are in scope. */
  var _bp = root._squadLeaderBuddyPairs
    ? root._squadLeaderBuddyPairs({
        root: root,
        telemetry: telemetry,
        dist: dist,
        point: point,
        teamKeyFor: teamKeyFor,
        BUDDY_PAIRS_ON: BUDDY_PAIRS_ON,
        BUDDY_TUNING: BUDDY_TUNING
      })
    : null;
  var aliveTeam = _bp ? _bp.aliveTeam : function () { return []; },
    buddyStats = _bp ? _bp.buddyStats : function () { return null; },
    buddyIncReason = _bp ? _bp.buddyIncReason : function () {},
    buddyHistory = _bp ? _bp.buddyHistory : function () {},
    buddyBrokenState = _bp ? _bp.buddyBrokenState : function () { return false; },
    buddyTransition = _bp ? _bp.buddyTransition : function () {},
    buddyMember = _bp ? _bp.buddyMember : function () { return null; },
    buddyTaskKey = _bp ? _bp.buddyTaskKey : function () { return ''; },
    buddyPairId = _bp ? _bp.buddyPairId : function () { return ''; },
    buddyRetireReason = _bp ? _bp.buddyRetireReason : function () { return 'roster-changed'; },
    syncBuddyPairs = _bp ? _bp.syncBuddyPairs : function () { return null; },
    buddyIncompatible = _bp ? _bp.buddyIncompatible : function () { return null; },
    buddyStillBroken = _bp ? _bp.buddyStillBroken : function () { return false; },
    buddyRecover = _bp ? _bp.buddyRecover : function () {},
    updateBuddyPairState = _bp ? _bp.updateBuddyPairState : function () {},
    updateBuddyPairs = _bp ? _bp.updateBuddyPairs : function () { return null; },
    buddyBoundPreview = _bp ? _bp.buddyBoundPreview : function () { return { movers: [], cooperation: [] }; },
    commitBuddyCooperation = _bp ? _bp.commitBuddyCooperation : function () {},
    buddySnapshot = _bp ? _bp.buddySnapshot : function () { return null; },
    buddyTelemetry = _bp ? _bp.buddyTelemetry : function () { return null; };
  /* Formation + forward-line functions are extracted to 15g-squad-leader-formation.js.
     The factory is called right after the buddy-pairs re-attach so aliveTeam (spawn
     placement) is in scope. The returned functions are attached as closure variables so
     all callers (cohesion, the anchor advance, fireteam publishing, the public API
     export) see the same functions as before. */
  var _fm = root._squadLeaderFormation
    ? root._squadLeaderFormation({
        root: root,
        alive: alive,
        teamKeyFor: teamKeyFor,
        aliveTeam: aliveTeam,
        FOLLOW_LAG: FOLLOW_LAG
      })
    : null;
  var commandForward = _fm ? _fm.commandForward : function () { return { x: 0, z: 0 }; },
    forwardMajority = _fm ? _fm.forwardMajority : function () { return null; },
    publishForwardLine = _fm ? _fm.publishForwardLine : function () {},
    teamFrame = _fm ? _fm.teamFrame : function () { return { x: 0, z: 0 }; },
    desiredAnchor = _fm ? _fm.desiredAnchor : function () { return null; },
    forward = _fm ? _fm.forward : function () { return { x: 0, z: 0 }; },
    teamSlot = _fm ? _fm.teamSlot : function () { return null; },
    spawnForward = _fm ? _fm.spawnForward : function () { return { x: 0, z: 0 }; },
    placeAtSlots = _fm ? _fm.placeAtSlots : function () {},
    placeForce = _fm ? _fm.placeForce : function () {},
    followTeamForward = _fm ? _fm.followTeamForward : function () {};
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
  function start(sim) {
    reset(sim);
    placeForce(sim);
  }

  function orderCanAdvance(sq, battle) {
    var living = commanded(sq),
      arrived = 0;
    if (!living.length) return true;
    for (var i = 0; i < living.length; i++) {
      var s = living[i];
      /* Arrival acknowledges the latest issued movement, not a previous destination
         that the man still holds while hearing its replacement. Otherwise the same
         old arrival advances another stride on every command tick during reception. */
      if (!movementExecutionCurrent(s, battle)) continue;
      if (s.orderDestination && dist(s.root.position, s.orderDestination) <= ORDER_ARRIVAL_RADIUS) arrived++;
    }
    return arrived / living.length >= ORDER_COHESION;
  }

  /* Scouts-forward functions are extracted to 15c-squad-leader-scouts-forward.js.
     The factory is called after the tactical-plan and buddy-pairs functions are in scope. */
  var _sf = root._squadLeaderScoutsForward
    ? root._squadLeaderScoutsForward({
        root: root,
        telemetry: telemetry,
        dist: dist,
        point: point,
        copy: copy,
        commanded: commanded,
        average: average,
        leaderAlive: leaderAlive,
        teamKeyFor: teamKeyFor,
        publishPersonalMovement: publishPersonalMovement,
        movementExecutionCurrent: movementExecutionCurrent,
        publishStats: publishStats,
        ORDER_PUBLISH_EPS: ORDER_PUBLISH_EPS,
        syncTasks: syncTasks,
        missionVersion: missionVersion,
        buddyMember: buddyMember,
        updateBuddyPairs: updateBuddyPairs,
        BUDDY_PAIRS_ON: BUDDY_PAIRS_ON,
        SCOUTS_FORWARD_ON: SCOUTS_FORWARD_ON,
        RECON_TUNING: RECON_TUNING,
        RECON_PHASES: RECON_PHASES
      })
    : null;
  var reconStats = _sf ? _sf.reconStats : function () { return null; },
    reconInc = _sf ? _sf.reconInc : function () {},
    reconDistance = _sf ? _sf.reconDistance : function () { return 0; },
    reconTelemetry = _sf ? _sf.reconTelemetry : function () { return null; },
    leaderPictureAdequate = _sf ? _sf.leaderPictureAdequate : function () { return false; },
    reconScreen = _sf ? _sf.reconScreen : function () { return null; },
    reconSignature = _sf ? _sf.reconSignature : function () { return ''; },
    reconCandidate = _sf ? _sf.reconCandidate : function () { return null; },
    reconEligible = _sf ? _sf.reconEligible : function () { return false; },
    selectReconScouts = _sf ? _sf.selectReconScouts : function () { return null; },
    syncReconTasks = _sf ? _sf.syncReconTasks : function () {},
    startRecon = _sf ? _sf.startRecon : function () {},
    updateReconDistance = _sf ? _sf.updateReconDistance : function () {},
    scoutDirectContact = _sf ? _sf.scoutDirectContact : function () {},
    startReconReportWatch = _sf ? _sf.startReconReportWatch : function () {},
    updateReconReportWatch = _sf ? _sf.updateReconReportWatch : function () {},
    endRecon = _sf ? _sf.endRecon : function () {},
    updateRecon = _sf ? _sf.updateRecon : function () {},
    publishReconOrders = _sf ? _sf.publishReconOrders : function () { return false; };
  /* Fireteam publishing functions are extracted to 15h-squad-leader-fireteams.js.
     The factory is called right after the scouts-forward re-attach (publishReconOrders)
     so every dependency is in scope. The returned functions are attached as closure
     variables so the squadCommand slot and the public API export see the same functions
     as before. */
  var _ft = root._squadLeaderFireteams
    ? root._squadLeaderFireteams({
        root: root,
        point: point,
        dist: dist,
        copy: copy,
        aliveTeam: aliveTeam,
        averageMembers: averageMembers,
        signature: signature,
        cfg: cfg,
        publishStats: publishStats,
        publishPersonalMovement: publishPersonalMovement,
        movementExecutionCurrent: movementExecutionCurrent,
        DEFENSIVE: DEFENSIVE,
        REGROUP_RELEASE: REGROUP_RELEASE,
        TEAM_LEASE: TEAM_LEASE,
        ORDER_PUBLISH_EPS: ORDER_PUBLISH_EPS,
        BUDDY_PAIRS_ON: BUDDY_PAIRS_ON,
        updateBuddyPairs: updateBuddyPairs,
        publishReconOrders: publishReconOrders,
        leaderlessActive: leaderlessActive,
        desiredAnchor: desiredAnchor,
        teamSlot: teamSlot,
        forward: forward,
        followTeamForward: followTeamForward
      })
    : null;
  var holdPost = _ft ? _ft.holdPost : function () { return null; },
    fireteamSignature = _ft ? _ft.fireteamSignature : function () { return ''; },
    updateFireteams = _ft ? _ft.updateFireteams : function () {};

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
  /* Clear-contact functions are extracted to 15i-squad-leader-clear-contact.js.
     The factory is called after the flags, constants and the fire-control re-attach are
     in scope. The returned functions are attached as closure variables so the anchor
     advance and the fire-and-movement selector see the same functions as before. */
  var _cc = root._squadLeaderClearContact
    ? root._squadLeaderClearContact({
        root: root,
        telemetry: telemetry,
        dist: dist,
        orderCanAdvance: orderCanAdvance,
        setFireControl: setFireControl,
        ALERT_ADVANCE: ALERT_ADVANCE,
        CLEAR_AFTER: CLEAR_AFTER,
        CLEAR_MAX: CLEAR_MAX,
        CLEAR_ARRIVED: CLEAR_ARRIVED,
        CLEAR_HOLD_PHASES: CLEAR_HOLD_PHASES,
        FIRE_CONTROL_ON: FIRE_CONTROL_ON
      })
    : null;
  var endClearContact = _cc ? _cc.endClearContact : function () {},
    updateClearContact = _cc ? _cc.updateClearContact : function () {};
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
    if ((force || orderCanAdvance(sq, battle)) && mayAdvance && len > 2) {
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
  /* Fire-and-movement functions are extracted to 15j-squad-leader-fire-and-movement.js.
     The factory is called after the clear-contact re-attach so every dependency is in
     scope. The returned functions are attached as closure variables so updateSquadState
     and the public API export see the same functions as before. */
  var _fa = root._squadLeaderFireAndMovement
    ? root._squadLeaderFireAndMovement({
        root: root,
        telemetry: telemetry,
        detachFled: detachFled,
        updateRecon: updateRecon,
        leaderlessActive: leaderlessActive,
        noteLeaderlessAction: noteLeaderlessAction,
        updateClearContact: updateClearContact,
        updateCOA: updateCOA,
        updateFireControl: updateFireControl,
        clearFireControl: clearFireControl,
        buddyBoundPreview: buddyBoundPreview,
        commitBuddyCooperation: commitBuddyCooperation,
        requestReview: requestReview,
        SL_STRESS: SL_STRESS,
        LEAD_TUNING: LEAD_TUNING,
        COAS: COAS,
        BOUND_CYCLE: BOUND_CYCLE,
        BOUND_DURATION: BOUND_DURATION,
        BOUND_TEAMS: BOUND_TEAMS,
        ASSAULT_PHASES: ASSAULT_PHASES,
        FIRETEAM_SPLIT_ON: FIRETEAM_SPLIT_ON,
        FIRE_CONTROL_ON: FIRE_CONTROL_ON,
        COA_ON: COA_ON
      })
    : null;
  var teamStress = _fa ? _fa.teamStress : function () { return 0; },
    leadStress = _fa ? _fa.leadStress : function () { return 0; },
    stressReview = _fa ? _fa.stressReview : function () {},
    fireAndMovement = _fa ? _fa.fireAndMovement : function () {};
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
        /* Psychological recovery is not physical recovery. Keep retreat authority until the men stop
           at a local rally point and reform, then hand the old mission back to ordinary command. */
        if ((battle ? recoverFromRetreat(sq, battle, casualtyFrac, stress) : moraleRallies(casualtyFrac, stress)))
          sq.state = anyEngaged ? 'engaged' : 'advance';
      } else {
        if (battle) endRallyRecovery(sq, battle, 'not retreating');
        if (casualtyFrac >= moraleBreakAt(stress)) sq.state = 'retreat';
        else sq.state = anyEngaged ? 'engaged' : 'advance';
      }
    } else if (casualtyFrac >= 0.6) sq.state = 'retreat';
    else {
      if (battle) endRallyRecovery(sq, battle, 'morale disabled');
      sq.state = anyEngaged ? 'engaged' : 'advance';
    }
    if (battle) updateSuccession(sq, battle);
    if (battle) updateAssembly(sq, battle);
    noteSafePoint(sq, battle);
    fireAndMovement(sq, battle);
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
       command phase while the scouts are out. A superseding macro brief invalidates it immediately.
       But if the squad has arrived at the objective (inside capture radius), end the recon —
       the scouts' job is done and the squad should transition to capture/defend. */
    if (L.get(sq, 'recon')) {
      if (!sq._reconTask || sq._reconTask.missionVersion !== missionVersion(sq))
        endRecon(sq, sim, 'mission-change');
      if (L.get(sq, 'recon') && idx === last) {
        var liveReconObj = m && m.objectiveId && root.BattleObjectiveSystem ? root.BattleObjectiveSystem.get(sim, m.objectiveId) : null,
          liveReconRadius = +(liveReconObj && liveReconObj.def && liveReconObj.def.radius) || 30;
        if (dist(pos, wp) < (+c.captureCommitRatio || 0.82) * liveReconRadius)
          endRecon(sq, sim, 'arrived at objective');
      }
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
    /* Don't start a recon task when the squad is already at the objective (idx === last and
       inside the capture radius). The recon candidate looks at distance from the goal, but
       when the squad is ON the goal, recon should not fire — the squad should transition
       to capture/defend, not send scouts. This was masked when reconCandidate required
       callouts (C gate); removing that gate exposed it. */
    if (recon && idx === last) {
      var reconObj = m && m.objectiveId && root.BattleObjectiveSystem ? root.BattleObjectiveSystem.get(sim, m.objectiveId) : null,
        reconRadius = +(reconObj && reconObj.def && reconObj.def.radius) || 30;
      if (dist(pos, wp) < (+c.captureCommitRatio || 0.82) * reconRadius) recon = null;
    }
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
          s._fireteamAdoptedEnvelope = null;
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
    rallyRecoveryOn: function () { return RALLY_RECOVERY_ON; },
    parseRallyRecovery: parseRallyRecovery,
    rallyRecoveryTuning: { dwell: RALLY_RECOVERY_DWELL, arrive: RALLY_RECOVERY_ARRIVE },
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
