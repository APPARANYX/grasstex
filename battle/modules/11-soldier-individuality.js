/* Deterministic individual soldier morphology + realistic infantry gait selection.
   Ground speeds are based on loaded WW2 infantry movement bands supplied for the lab:
   walk 1.1-1.4 m/s, run 3.5-4.5, sprint 5.5-6.7, crouch walk .7-1.0,
   crouch run 2.5-3.5, low crawl .15-.30 and high/fast crawl .5-.8.

   battle-sim's legacy integrator still applies .58 while crouched and .23 while crawling.  This
   module is the single speed owner and compensates for those factors so the resulting GROUND speed
   is the selected gait, rather than multiplying realistic gait speeds by legacy stance penalties.
   Variation is deterministic by soldier and clamped inside the supplied historical bands. */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleSoldierIndividuality) return;
  var SYSTEM = 'soldier-individuality';
  var CROUCH_FACTOR = 0.58,
    CRAWL_FACTOR = 0.23,
    RUN_DISTANCE = 7.5;
  var LIMITS = {
    walk: [1.1, 1.4],
    run: [3.5, 4.5],
    sprint: [5.5, 6.7],
    crouchWalk: [0.7, 1.0],
    crouchRun: [2.5, 3.5],
    proneNormal: [0.15, 0.3],
    proneFast: [0.5, 0.8]
  };
  /* Heavier weapon/load roles bias toward the low side of each band; scouts bias high. */
  var ROLE = {
    sergeant: {
      walk: 1.28,
      run: 4.0,
      sprint: 5.95,
      crouchWalk: 0.86,
      crouchRun: 2.95,
      proneNormal: 0.22,
      proneFast: 0.62
    },
    rifleman: {
      walk: 1.24,
      run: 3.9,
      sprint: 5.9,
      crouchWalk: 0.84,
      crouchRun: 2.9,
      proneNormal: 0.22,
      proneFast: 0.62
    },
    gunner: {
      walk: 1.15,
      run: 3.55,
      sprint: 5.5,
      crouchWalk: 0.75,
      crouchRun: 2.55,
      proneNormal: 0.18,
      proneFast: 0.52
    },
    scout: {
      walk: 1.35,
      run: 4.4,
      sprint: 6.5,
      crouchWalk: 0.95,
      crouchRun: 3.4,
      proneNormal: 0.28,
      proneFast: 0.75
    },
    engineer: {
      walk: 1.2,
      run: 3.75,
      sprint: 5.7,
      crouchWalk: 0.8,
      crouchRun: 2.75,
      proneNormal: 0.2,
      proneFast: 0.58
    }
  };
  var ANIM_FRAC = {
    walk: 0.52,
    run: 0.82,
    sprint: 1.0,
    crouchWalk: 0.46,
    crouchRun: 0.88,
    proneNormal: 0.34,
    proneFast: 0.86
  };

  var clamp = root.GTMath.clamp;
  function hash(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  /* Trait seeds use the role names the seeds were recorded with: the squad leader role was renamed
     captain -> sergeant, and re-rolling every leader's gait would make each existing seed a new battle. */
  var SEED_ROLE = { sergeant: 'captain' };
  function unitRand(s, salt) {
    var role = String((s && s.role) || '');
    var h = hash(
      String((s && s.faction) || '') +
        '|' +
        String((s && s.id) || 0) +
        '|' +
        (SEED_ROLE[role] || role) +
        '|' +
        salt
    );
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967295;
  }
  function gaitValue(base, factor, name) {
    var lim = LIMITS[name],
      v = (+base[name] || lim[0]) * factor;
    return +clamp(v, lim[0], lim[1]).toFixed(2);
  }
  function phenotype(s) {
    if (!s) return null;
    if (s.phenotype && s.phenotype.version === '68-gaits') return s.phenotype;
    var height = 0.94 + unitRand(s, 'height') * 0.12,
      width = 0.88 + unitRand(s, 'width') * 0.24,
      depth = 0.92 + unitRand(s, 'depth') * 0.18,
      fitness = 0.92 + unitRand(s, 'fitness') * 0.16;
    /* His physique (module 10) is his fitness when its lever is on: the same +-8% swing, a bell instead of a flat roll. */
    var St = root.BattleSoldierStats;
    if (St && St.on('phy')) fitness = St.scale(s, 'fitness');
    var buildPenalty = 1 - (width - 1) * 0.18,
      heightEffect = 1 + (height - 1) * 0.06,
      speedFactor = clamp(fitness * buildPenalty * heightEffect, 0.86, 1.14),
      base = ROLE[s.role] || ROLE.rifleman;
    /* His agility (module 10) quickens or slows the two fast gaits only; the bands still clamp them. */
    var pace = St ? St.scale(s, 'pace') : 1;
    var g = {};
    Object.keys(LIMITS).forEach(function (name) {
      g[name] = gaitValue(base, speedFactor * (name === 'sprint' || name === 'crouchRun' ? pace : 1), name);
    });
    var p = {
      version: '68-gaits',
      heightScale: +height.toFixed(3),
      widthScale: +width.toFixed(3),
      depthScale: +depth.toFixed(3),
      fitness: +fitness.toFixed(3),
      speedFactor: +speedFactor.toFixed(3),
      gaits: g,
      walkSpeed: g.walk,
      runSpeed: g.run,
      sprintSpeed: g.sprint,
      crouchWalkSpeed: g.crouchWalk,
      crouchRunSpeed: g.crouchRun,
      proneNormalSpeed: g.proneNormal,
      proneFastSpeed: g.proneFast
    };
    s.phenotype = p;
    s.walkSpeed = g.walk;
    s.runSpeed = g.run;
    s.sprintSpeed = g.sprint;
    s.crouchWalkSpeed = g.crouchWalk;
    s.crouchRunSpeed = g.crouchRun;
    s.proneNormalSpeed = g.proneNormal;
    s.proneFastSpeed = g.proneFast;
    s.speed = g.run;
    if (s.poseRoot && s.poseRoot.scaling && typeof s.poseRoot.scaling.set === 'function')
      s.poseRoot.scaling.set(p.widthScale, p.heightScale, p.depthScale);
    return p;
  }
  function distanceToDestination(s) {
    return !s || !s.root || !s.destination
      ? 0
      : Math.hypot(
          (+s.destination.x || 0) - (+s.root.position.x || 0),
          (+s.destination.z || 0) - (+s.root.position.z || 0)
        );
  }
  function desiredGait(s, sim) {
    if (!s || s.dead) return 'walk';
    var d = distanceToDestination(s),
      e = s.eng || {},
      phase = (s.squad && s.squad.commandPhase) || '',
      now = sim ? +sim.time || 0 : 0,
      R = root.BattleMovementResolver,
      player = R && R.playerIntent ? R.playerIntent(s, sim) : null;
    var urgent = now < (+s._combatUrgentUntil || 0) || s.state === 'retreat' || e.state === 'withdraw';
    if (s.prone) {
      if (!s.crawling) return 'proneNormal';
      if (player) return player.pace === 'run' ? 'proneFast' : 'proneNormal';
      return urgent || e.state === 'bound' || d > 4 ? 'proneFast' : 'proneNormal';
    }
    var crouched = !!(s.tacticalCrouch || s.crouching || (+s.suppressedUntil || 0) > now);
    if (crouched) {
      if (s.reloading || s.clearingStoppage) return 'crouchWalk';
      if (player) return player.pace === 'run' ? 'crouchRun' : 'crouchWalk';
      return urgent || e.state === 'bound' || (s.squad && s.squad.inContact && d > 4)
        ? 'crouchRun'
        : 'crouchWalk';
    }
    if (s.reloading || s.clearingStoppage) return 'walk';
    /* While possessed, the pad chooses pace. Squad hold/defend phases no longer throttle the player. */
    if (player) return player.pace === 'run' ? 'run' : 'walk';
    if (urgent || e.state === 'bound' || e.state === 'assault') return 'sprint';
    if (d < RUN_DISTANCE) return 'walk';
    if (phase === 'defend' || phase === 'hold' || phase === 'support-hold' || phase === 'reserve')
      return 'walk';
    return 'run';
  }
  function stanceFactor(s, sim) {
    var now = sim ? +sim.time || 0 : 0;
    if (s.prone && s.crawling) return CRAWL_FACTOR;
    if (!s.prone && (s.tacticalCrouch || s.crouching || (+s.suppressedUntil || 0) > now))
      return CROUCH_FACTOR;
    return 1;
  }
  function updateSpeeds(sim) {
    var units = root.BattleModules.unitsFor(sim);
    for (var i = 0; i < units.length; i++) {
      var s = units[i],
        p = phenotype(s);
      if (!p) continue;
      var gait = desiredGait(s, sim),
        ground = p.gaits[gait] || p.gaits.walk,
        factor = stanceFactor(s, sim);
      /* A leg or belly wound (BattleWounds) slows every gait, except in a berserk trance (Engagement, ?rageTrance=1), which is faster still. */ var E =
          root.BattleEngagement,
        trance = !!(E && E.entranced && E.entranced(s));
      ground *= trance ? E.tuning.ACT_TUNING.RAGE_SPEED : s.woundSpeed > 0 ? s.woundSpeed : 1;
      s._locomotionGait = gait;
      s._locomotionGroundSpeed = ground;
      s.speed = ground / Math.max(0.01, factor);
    }
  }
  function applyAll(sim) {
    var units = root.BattleModules.unitsFor(sim);
    for (var i = 0; i < units.length; i++) phenotype(units[i]);
    updateSpeeds(sim);
  }

  /* The current animation pack has walk/crouch-walk/crawl locomotion clips rather than seven
     separate clips.  Preserve those clips but pace their cycle differently by selected gait so a
     sprint does not LOOK like a fast translation of the same leisurely walk. */
  var model = root.BattleSoldierModel,
    oldAnimate = model && model.animateWalk;
  if (model && typeof oldAnimate === 'function' && !model._realisticGaitAnimation) {
    model._realisticGaitAnimation = true;
    model.animateWalk = function (s, dt, speedFrac) {
      if (s && s.moving && s._locomotionGait && ANIM_FRAC[s._locomotionGait] != null) {
        var expected =
          s.prone && s.crawling
            ? CRAWL_FACTOR
            : !s.prone && (s.tacticalCrouch || s.crouching)
              ? CROUCH_FACTOR
              : 1;
        var progress = clamp((+speedFrac || 0) / Math.max(0.01, expected), 0, 1);
        speedFrac = ANIM_FRAC[s._locomotionGait] * progress;
      }
      return oldAnimate.call(this, s, dt, speedFrac, arguments[3]);
    };
  }

  root.BattleModules.registerSystem(SYSTEM, {
    version: '68-realistic-gaits',
    onBattleStart: applyAll,
    onBattleRestart: applyAll,
    onSimulationStep: updateSpeeds
  });
  root.BattleSoldierIndividuality = {
    version: '68-realistic-gaits',
    roleSpeeds: ROLE,
    gaitLimits: LIMITS,
    crawlFactor: CRAWL_FACTOR,
    runDistance: RUN_DISTANCE,
    phenotype: phenotype,
    desiredGait: desiredGait
  };
  if (typeof console !== 'undefined')
    root.GTLog('[INFANTRY] realistic walk/run/sprint + crouch/crawl gait bands active');
})(typeof window !== 'undefined' ? window : globalThis);
