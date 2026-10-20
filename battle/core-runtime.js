/* Shared runtime foundation: math helpers + gated logging.

   Loaded before every battle script (battle_sim.html, both PHP deploy paths and the
   ai-sim-harness bootstrap), so any file can alias these at load time through its IIFE
   root param: `var clamp=root.GTMath.clamp, dist=root.GTMath.dist;`
   Each alias keeps its old local name, so call sites and public exports stay untouched. */
(function (root) {
  'use strict';

  var GTMath = {
    /* clamp(v,a,b): bound v to [a,b]. All 18 former local copies were semantically identical. */
    clamp: function (v, a, b) {
      return Math.max(a, Math.min(b, v));
    },
    /* dist(a,b): defensive object form - missing/null ends give Infinity, partial coords read as 0. */
    dist: function (a, b) {
      return a && b ? Math.hypot((+a.x || 0) - (+b.x || 0), (+a.z || 0) - (+b.z || 0)) : Infinity;
    },
    /* distStrict(a,b): plain object form - no null guard, partial coords give NaN (crash/NaN propagates). */
    distStrict: function (a, b) {
      return Math.hypot(a.x - b.x, a.z - b.z);
    },
    /* dist4(ax,az,bx,bz): scalar-coordinate form. */
    dist4: function (ax, az, bx, bz) {
      return Math.hypot(ax - bx, az - bz);
    }
  };
  root.GTMath = GTMath;

  /* Presentation eligibility shared by producers and both playback schedulers.
     Read the current Micro reaction; never change a soldier or draw combat RNG. */
  root.BattleVoiceEligibility = {
    allows: function (s, event) {
      if (!s || s.dead || !s.root || (typeof s.root.isDisposed === 'function' && s.root.isDisposed()))
        return false;
      var e = s.eng || {},
        reaction = e.state,
        distress =
          /^(?:dazed|breaking|cowering|berserk|wounded|down|pain|medic|takingFire|pinned|lastMan|needHelp)$/;
      if (s.incapacitated || reaction === 'freeze' || reaction === 'flee' || e.fledPhase)
        return distress.test(event);
      if (reaction === 'cower' || reaction === 'rage') return distress.test(event);
      if (
        s.squad &&
        s.squad.state === 'retreat' &&
        /^(?:engage|takeTheShot|pushNow|teamMove|baseOfFire|movingCover|coverSet|scoutsForward|assault|advance|flankOrder|captureOrder|clearHouse|takeWindow)$/.test(
          event
        )
      )
        return false;
      return true;
    }
  };

  /* Versioned strategic activation belongs to the pinned JS runtime. PHP only forwards
     controls; it must not reinterpret historical gameplay defaults/dependencies. */
  var strategicDefaults = Object.freeze({
    strategicInterception: true,
    frontLines: true,
    motorTransport: true,
    truckAccess: true,
    truckCollision: true,
    truckVisual: true,
    aerialRecon: true,
    interception: true,
    reinforcements: true,
    reinforcementSortie: true
  });
  var strategicFeatures = {
    transport: { flags: ['motorTransport'] },
    recon: { flags: ['strategicInterception', 'aerialRecon'], excludeCombatLab: true },
    interception: {
      flags: ['strategicInterception', 'motorTransport', 'aerialRecon', 'interception'],
      excludeCombatLab: true
    },
    truckVisual: { flags: ['strategicInterception', 'motorTransport', 'truckVisual'] },
    truckCollision: { flags: ['motorTransport', 'truckCollision'] }
  };
  var strategicPatterns = Object.create(null);
  Object.keys(strategicDefaults).forEach(function (name) {
    strategicPatterns[name] = new RegExp('(?:^|[?&])' + name + '=0(?:&|$)');
  });
  Object.keys(strategicFeatures).forEach(function (name) {
    Object.freeze(strategicFeatures[name].flags);
    Object.freeze(strategicFeatures[name]);
  });
  Object.freeze(strategicFeatures);
  function strategicFlag(name) {
    if (!Object.prototype.hasOwnProperty.call(strategicDefaults, name))
      throw new Error('Unknown strategic flag: ' + name);
    return (
      strategicDefaults[name] && !strategicPatterns[name].test((root.location && root.location.search) || '')
    );
  }
  function strategicEnabled(sim, name) {
    var rule = strategicFeatures[name];
    if (!rule) throw new Error('Unknown strategic feature: ' + name);
    var town = sim && sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario;
    if (!town || town.profile !== 'strategic' || (rule.excludeCombatLab && root.PHASE_C_COMBAT_LAB))
      return false;
    for (var i = 0; i < rule.flags.length; i++) if (!strategicFlag(rule.flags[i])) return false;
    return true;
  }
  root.BattleStrategicConfig = Object.freeze({
    version: 1,
    defaults: strategicDefaults,
    features: strategicFeatures,
    flag: strategicFlag,
    enabled: strategicEnabled,
    snapshot: function (sim) {
      var flags = {},
        features = {};
      Object.keys(strategicDefaults).forEach(function (name) {
        flags[name] = strategicFlag(name);
      });
      Object.keys(strategicFeatures).forEach(function (name) {
        features[name] = strategicEnabled(sim, name);
      });
      return { version: 1, flags: flags, features: features };
    }
  });

  /* Gated logging, repo flag convention (steerLeg/fxPrewarm/callouts): on by default,
     `?log=0` silences every GTLog site at once. Bound at load to whichever console this
     context was given (page console, or the harness/check stub). */
  var LOG_ON = !(typeof location !== 'undefined' && /[?&]log=0\b/.test(location.search || ''));
  root.GTLog = LOG_ON ? console.log.bind(console) : function () {};
})(typeof window !== 'undefined' ? window : globalThis);
