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
      return { ok: null, detail: 'leaderless ' + (t - l.since).toFixed(1) + ' s' };
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
    FOLLOW_LAG = 2;
  /* 3b: group morale. Behind ?morale=1. Replaces the flat 60% casualty retreat with a
     squad-level break/rally model driven by the squad.mind roll-up (module 17). The break
     threshold is breakBase for calm men (the flat 60% rule) and moves down by breakSlope per
     unit of mean stress, never below breakMin. A retreating squad rallies only once its men
     are calm (mean stress < rallyStress) and it is not too depleted. */
  var MORALE_ON = typeof location !== 'undefined' && /[?&]morale=1\b/.test(location.search || '');
  var MORALE_TUNING = {
    breakBase: 0.6,
    breakSlope: 0.3,
    breakMin: 0.25,
    rallyStress: 0.15,
    rallyCasualty: 0.5
  };
  /* The casualty fraction at which a squad under this mean stress breaks (the flat 60% rule at zero). */
  function moraleBreakAt(stress) {
    return Math.max(MORALE_TUNING.breakMin, MORALE_TUNING.breakBase - MORALE_TUNING.breakSlope * stress);
  }
  /* 3c: course of action on contact. Behind ?coa=1. The Squad Leader (the one COA owner) scores the
     declared COAs against declared inputs on every tick the squad is in contact and keeps the winner as
     sq.coa, so a squad whose casualties, stress or leader change inside a contact changes its COA inside it,
     and a contact that blinks is not a new decision. Scoring is deterministic: weighted sum, no RNG; ties
     break by COA name order, so the choice is a pure function of squad state at that tick. There is no
     margin or latch: a margin was measured (Part B of the 3b/3c work) and, because casualties never heal and
     stress only falls, it latched squads in defend (fewer bounds, more battles still open at 600 s). The
     COA gates bounding through fireAndMovement: defend holds (no bounds), assault bounds if the phase
     allows. COAs only restrict, never expand. */
  var COA_ON = typeof location !== 'undefined' && /[?&]coa=1\b/.test(location.search || '');
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
      return (sq.mind && sq.mind.mean) || 0;
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
    var m = alive(sq),
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
    var living = alive(sq),
      arrived = 0;
    if (!living.length) return true;
    for (var i = 0; i < living.length; i++) {
      var s = living[i];
      if (s.orderDestination && dist(s.root.position, s.orderDestination) <= ORDER_ARRIVAL_RADIUS) arrived++;
    }
    return arrived / living.length >= ORDER_COHESION;
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
  /* The legacy SquadAI issueOrders() both advanced the Squad Leader's anchor AND published an individual
   formation point for every soldier every squad tick. M3C keeps the useful anchor cadence here and
   deletes that redundant individual producer entirely: only committed fireteam slots publish Meso
   locomotion. */
  function advanceSquadAnchor(sq, battle) {
    var anchor = sq.orderAnchor || publishAnchor(sq, sq.rally),
      x = anchor.x,
      z = anchor.z,
      goal = sq.state === 'retreat' ? root.SquadAI.retreatGoal(sq) : sq.objective || sq.home,
      goalChanged = !sq._orderGoal || dist(goal, sq._orderGoal) > 3;
    var form = root.SquadAI.formationFor(sq),
      formChanged = form !== sq.formation,
      phase = sq.commandPhase || '',
      hold = ['regroup', 'support-hold', 'hold', 'reserve', 'defend', 'corner-check'].indexOf(phase) >= 0,
      force = false;
    if (goalChanged) {
      sq._orderGoal = copy(goal);
      force = true;
    }
    if (formChanged) {
      sq.formation = form;
      force = true;
    }
    var bounding = L.holds(sq, 'bound', battle.time),
      held = !!sq.inContact && !bounding,
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
    } else if (sq.state === 'retreat' && len > 2) {
      x += (dx / len) * Math.min(ORDER_STRIDE, len);
      z += (dz / len) * Math.min(ORDER_STRIDE, len);
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
      if (!cur || urgent || cur.signature !== sig)
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
        if (
          !urgent &&
          previous &&
          dist(previous, next) <= ORDER_PUBLISH_EPS &&
          s._fireteamPublishKey === publishKey
        ) {
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
  }
  /* Fire and movement. Engagement reports the squad's contact and base of fire; the Squad Leader decides
   whether the phase allows an assault and, every BOUND_CYCLE seconds, sends one fireteam forward
   for BOUND_DURATION while at least two men keep shooting. */
  function fireAndMovement(sq, battle) {
    var E = root.BattleEngagement;
    if (!E || !sq || !battle) return;
    var r = E.updateSquad(sq, battle);
    if (!r) return;
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
      return;
    }
    if (COA_ON) updateCOA(sq);
    sq._assaultAuthorized = !!ASSAULT_PHASES[sq.commandPhase || ''];
    /* 3c: the COA gates bounding. Defend holds position (no bounds); assault bounds only if the
       phase also allows. The flag-off path never sets sq.coa, so this is a no-op there. */
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
     the rotation to reach a team that can go is a missed bound. */
    var first = sq._boundTurn == null ? 0 : sq._boundTurn + 1,
      turn,
      team,
      movers,
      holding;
    for (var k = 0; k < BOUND_TEAMS.length; k++) {
      turn = first + k;
      team = BOUND_TEAMS[turn % BOUND_TEAMS.length];
      movers = [];
      for (i = 0; i < members.length; i++) {
        s = members[i];
        if (s.dead || s.suppressedUntil > battle.time || s.reloading || s.clearingStoppage || s.outOfAmmo)
          continue;
        if (
          root.SquadAI.isMachineGun(s) ||
          (root.BattleTacticalPositions && root.BattleTacticalPositions.current(s))
        )
          continue; // positional tasks hold the base of fire
        if (s._fireteamKey && s._fireteamKey !== team) continue;
        movers.push(s);
      }
      holding = r.fireSupport.filter(function (man) {
        return movers.indexOf(man) < 0;
      }).length;
      if (movers.length && holding >= 2) break;
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
      E.orderBound(movers);
      telemetry(battle, 'decision-bound', {
        faction: sq.faction,
        squad: sq.id,
        team: team,
        movers: movers.length,
        holding: holding
      });
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
      var stress = (sq.mind && sq.mind.mean) || 0;
      if (sq.state === 'retreat') {
        /* Rally: a retreating squad reforms only once calm and not too depleted; otherwise
           it stays retreating. Casualties do not heal, so a squad broken at high loss keeps
           falling back. */
        if (stress < MORALE_TUNING.rallyStress && casualtyFrac < MORALE_TUNING.rallyCasualty)
          sq.state = anyEngaged ? 'engaged' : 'advance';
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
    fireAndMovement(sq, battle);
  }
  /* Succession. When the squad leader is killed nobody commands for SUCCESSION_DELAY seconds (the
     `succession` lease: the squad runs on its leaderless cohesion and corner rules and the accuracy
     penalty applies); then the most senior survivor takes command (SquadAI.mostSenior), takes the
     leader's slot and the penalty ends. A squad with a leader holds no lease. */
  function updateSuccession(sq, battle) {
    var t = battle.time,
      held = L.get(sq, 'succession'),
      men = alive(sq);
    if (root.SquadAI.leaderOf(sq) || !men.length) {
      if (held) L.end(sq, 'succession', t, men.length ? 'leader present' : 'squad destroyed');
      return;
    }
    if (!held) {
      L.grant(
        sq,
        'succession',
        'squad-leader',
        t,
        t + SUCCESSION_DELAY,
        'squad leader killed',
        'successor takes command'
      );
      return;
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
    sq.aliveCount = 0;
    sq.leaderId = null;
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
        L.clear(q);
        q._boundTurn = null;
        q._assaultAuthorized = false;
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
    version: '1.5-m3c-mission-execution',
    onBattleStart: start,
    beforeBattleRestart: reset,
    onBattleRestart: start,
    onCommanderTick: commanderTick
  });
  root.BattleSquadStability = {
    version: '1.7-m3c-squad-leader-fire-and-movement',
    planSeconds: { assault: ASSAULT_LEASE, defense: DEFENSE_LEASE },
    teamOrderSeconds: TEAM_LEASE,
    boundCycle: BOUND_CYCLE,
    boundDuration: BOUND_DURATION,
    tuning: { morale: MORALE_TUNING, coa: COA_TUNING },
    moraleOn: function () { return MORALE_ON; },
    coaOn: function () { return COA_ON; },
    coas: function () { return Object.keys(COAS); },
    /* Read-only views of the two decisions, for the checks and the probes (nothing in the runtime calls them). */
    moraleBreakAt: moraleBreakAt,
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
