/* Phase I1-I3: Mortars, artillery, and air as delayed effects.
   I1: Fires Controller with effect cards (suppress, obscure, interdict, protect)
   I2: Recon/spotting feeds observed results back
   I3: Bounded air support (sortie availability, weather, AD risk, delay, decay)
   All behavioral, behind ?fires=1 (default OFF). */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleFires) return;

  var SR = function () { return root.BattleSupportRequest; };

  function flagOn() {
    return /[?&]fires=1\b/.test(typeof location !== 'undefined' ? location.search : '');
  }

  /* I1: Effect cards */
  var EFFECTS = {
    suppress: { duration: 30, radius: 40, damage: 0, suppressPower: 0.8 },
    obscure: { duration: 60, radius: 50, damage: 0, suppressPower: 0 },
    interdict: { duration: 45, radius: 60, damage: 15, suppressPower: 0.5 },
    protect: { duration: 30, radius: 35, damage: 0, suppressPower: 0 }
  };

  /* I3: Air support bounds */
  var AIR_BOUNDS = {
    sortieAvailability: 0.3,   // 30% chance a sortie is available when requested
    weatherThreshold: 0.5,     // below this visibility, no air support
    adRiskMax: 0.4,            // above this AD risk, deny air
    requestDelay: 30,          // seconds from request to effect
    observationDecay: 120      // seconds before spotting data goes stale
  };

  var activeMissions = {};
  var nextMissionId = 1;

  /* I1: Request a fire mission */
  function requestFire(sim, sq, effect, point, assetType) {
    var sr = SR();
    if (!sr) return null;
    var req = sr.create({
      requester: sq.id,
      requesterSquad: sq.id,
      assetType: assetType || 'mortar',
      priority: 'priority',
      effect: effect,
      point: point,
      time: +sim.time || 0
    });
    return req;
  }

  /* I1: Execute a fire mission (after approval) */
  function executeFire(sim, requestId) {
    var sr = SR();
    if (!sr) return false;
    var req = sr.get(requestId);
    if (!req || req.status !== 'approved') return false;
    var effect = EFFECTS[req.effect];
    if (!effect) return false;

    sr.launch(requestId, sim.time);

    var mission = {
      id: 'fire-' + (nextMissionId++),
      requestId: requestId,
      effect: req.effect,
      point: req.point,
      assetType: req.assetType,
      startedAt: +sim.time || 0,
      expiresAt: (+sim.time || 0) + effect.duration,
      radius: effect.radius,
      damage: effect.damage,
      suppressPower: effect.suppressPower,
      resultConfidence: 'observed',
      observed: false
    };
    activeMissions[mission.id] = mission;

    /* I2: Recon/spotting — the requesting squad observes the result */
    mission.observed = true;
    mission.observedAt = +sim.time || 0;

    /* Complete the request after the effect starts */
    sr.complete(requestId, sim.time, 'observed');

    return mission;
  }

  /* I3: Request air support with bounds checking */
  function requestAir(sim, sq, effect, point) {
    var visibility = 0.8; // placeholder: would come from weather system
    var adRisk = 0.1;     // placeholder: would come from AD assessment

    if (Math.random() > AIR_BOUNDS.sortieAvailability) return { denied: true, reason: 'no-sortie' };
    if (visibility < AIR_BOUNDS.weatherThreshold) return { denied: true, reason: 'weather' };
    if (adRisk > AIR_BOUNDS.adRiskMax) return { denied: true, reason: 'ad-risk' };

    var req = requestFire(sim, sq, effect || 'interdict', point, 'air');
    if (!req) return null;

    /* Air support has a delay */
    req.airDelay = AIR_BOUNDS.requestDelay;
    req.adRisk = adRisk;
    return { request: req, delay: AIR_BOUNDS.requestDelay };
  }

  /* I1: Tick — expire completed missions */
  function tick(sim) {
    if (!flagOn()) return;
    var now = +sim.time || 0;
    Object.keys(activeMissions).forEach(function (id) {
      var m = activeMissions[id];
      if (now > m.expiresAt) delete activeMissions[id];
    });
  }

  /* I2: Get observed results for a location (recon/spotting feedback) */
  function observedAt(sim, point) {
    var results = [];
    var now = +sim.time || 0;
    Object.keys(activeMissions).forEach(function (id) {
      var m = activeMissions[id];
      if (!m.observed) return;
      if (now - m.observedAt > AIR_BOUNDS.observationDecay) return;
      if (m.point && Math.hypot(m.point.x - point.x, m.point.z - point.z) < m.radius + 20) {
        results.push({ effect: m.effect, observedAt: m.observedAt, confidence: m.resultConfidence });
      }
    });
    return results;
  }

  function listMissions() { return Object.keys(activeMissions).map(function (k) { return activeMissions[k]; }); }

  root.BattleFires = {
    version: '1.0-i1i2i3',
    EFFECTS: EFFECTS,
    AIR_BOUNDS: AIR_BOUNDS,
    requestFire: requestFire,
    executeFire: executeFire,
    requestAir: requestAir,
    observedAt: observedAt,
    listMissions: listMissions,
    flagOn: flagOn
  };

  if (root.BattleModules) {
    root.BattleModules.registerSystem('fires', {
      version: '1.0-i1i2i3',
      onCommanderTick: tick,
      onBattleStart: function () { activeMissions = {}; nextMissionId = 1; },
      onBattleRestart: function () { activeMissions = {}; nextMissionId = 1; }
    });
  }
  console.log('[TACTICS] I1-I3: Fires Controller + recon + air loaded (?fires=1 to enable)');
})(typeof window !== 'undefined' ? window : globalThis);
