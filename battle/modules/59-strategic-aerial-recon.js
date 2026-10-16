/* One-shot faction-local aerial reconnaissance for the opt-in 5 km battlefield.
   Only an authorized request samples hostile actor truth. The resulting immutable
   snapshot is uncertain, expires, and cannot authorize targeting or firing. */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleAerialRecon) return;

  var MIN_REQUEST_AT = 120,
    INTERCEPTION_RECON_AT = 40,
    VALID_SECONDS = 45,
    MIN_GROUND_SPEED = 0.8,
    POSITION_GRID = 35,
    HEADING_STEP = Math.PI / 12;

  function enabled(sim) {
    var town = sim && sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario,
      search = (root.location && root.location.search) || '';
    return !!(
      town &&
      town.profile === 'strategic' &&
      !root.PHASE_C_COMBAT_LAB &&
      /(?:^|[?&])strategicInterception=1(?:&|$)/.test(search) &&
      /(?:^|[?&])aerialRecon=1(?:&|$)/.test(search)
    );
  }
  function validFaction(f) {
    return f === 'us' || f === 'ge';
  }
  function state(sim) {
    return (
      sim._strategicAerialRecon ||
      (sim._strategicAerialRecon = {
        us: { used: false, event: null },
        ge: { used: false, event: null }
      })
    );
  }
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    }
    return h >>> 0;
  }
  function uncertainty(seed, faction, id, axis) {
    return ((hash(seed + '|' + faction + '|' + id + '|' + axis) % 2001) / 1000 - 1) * 12;
  }
  function round(v, n) {
    var p = Math.pow(10, n || 0);
    return Math.round(v * p) / p;
  }
  function hidden(sq) {
    if (
      sq.hidden ||
      sq.isHidden ||
      sq.concealed ||
      sq._concealed ||
      sq._ambushTask ||
      sq._ambushPlan ||
      sq._preparedAmbush ||
      /ambush|conceal|hide/.test(String(sq.commandPhase || '').toLowerCase())
    )
      return true;
    var living = (sq.members || []).filter(function (s) {
      return s && !s.dead;
    });
    return living.some(function (s) {
      return s.hidden || s.isHidden || s.concealed || s._concealed || s._ambushTask || s._ambushPlan;
    });
  }
  function sampleSquad(sq, faction, seed, at) {
    if (!sq || hidden(sq)) return null;
    var men = (sq.members || []).filter(function (s) {
        return s && !s.dead && s.root && s.root.position;
      }),
      n = men.length,
      x = 0,
      z = 0,
      vx = 0,
      vz = 0,
      measured = 0,
      vehicle = sq._transport;
    if (n < 2) return null;
    for (var i = 0; i < n; i++) {
      var p = men[i].root.position;
      if (!isFinite(+p.x) || !isFinite(+p.z)) return null;
      x += +p.x;
      z += +p.z;
    }
    x /= n;
    z /= n;
    /* The opposing home territory, not all enemy actors throughout the field. */
    if ((faction === 'us' && z < 0) || (faction === 'ge' && z > 0)) return null;
    if (vehicle && vehicle.phase === 'embarked' && vehicle.heading) {
      var leg = vehicle.path && vehicle.path[vehicle.leg],
        speed = leg && +leg.speed;
      if (isFinite(speed) && speed > 0 && isFinite(+vehicle.heading.x) && isFinite(+vehicle.heading.z)) {
        vx = +vehicle.heading.x * speed;
        vz = +vehicle.heading.z * speed;
        measured = n;
      }
    } else {
      /* Snapshot instantaneous physical gait, never the intended destination or
         the hidden mission brief. Require agreement across moving soldiers. */
      for (var j = 0; j < n; j++) {
        var s = men[j],
          speedNow = +s.moveSpeed,
          yaw = s.root.rotation && +s.root.rotation.y;
        if (!s.moving || !isFinite(speedNow) || speedNow < MIN_GROUND_SPEED || !isFinite(yaw)) continue;
        vx += Math.sin(yaw) * speedNow;
        vz += Math.cos(yaw) * speedNow;
        measured++;
      }
      if (measured < Math.ceil(n * 0.6)) return null;
      vx /= measured;
      vz /= measured;
    }
    var speedMps = Math.hypot(vx, vz);
    if (speedMps < MIN_GROUND_SPEED) return null;
    var headingRadians = Math.atan2(vx, vz),
      confidence = round(Math.min(0.85, 0.55 + 0.3 * (measured / n)), 2),
      id = String(sq.id);
    return Object.freeze({
      squadId: id,
      source: 'aerial',
      observedAt: at,
      validUntil: at + VALID_SECONDS,
      x: Math.round((x + uncertainty(seed, faction, id, 'x')) / POSITION_GRID) * POSITION_GRID,
      z: Math.round((z + uncertainty(seed, faction, id, 'z')) / POSITION_GRID) * POSITION_GRID,
      headingRadians: round(Math.round(headingRadians / HEADING_STEP) * HEADING_STEP, 3),
      speedMps: round(Math.round(speedMps * 2) / 2, 1),
      positionUncertaintyM: 40,
      headingUncertaintyRadians: round(HEADING_STEP, 3),
      speedUncertaintyMps: 0.75,
      confidence: confidence
    });
  }
  function request(sim, faction) {
    if (!enabled(sim) || !validFaction(faction) || !sim.factions || !sim.factions[faction]) return null;
    /* With an explicit interception mission, reconnaissance must occur while
       an opponent is still outbound. This is a clock/doctrine decision by
       our General, not a hostile-motion trigger or privileged enemy lookup.
       Standalone aerialRecon retains its original 120s behavior. */
    var strategicEarly = /(?:^|[?&])interception=1(?:&|$)/.test(
      (root.location && root.location.search) || ''
    );
    var earliest = strategicEarly ? INTERCEPTION_RECON_AT : MIN_REQUEST_AT;
    if (!(sim.time >= earliest) || sim.macroCommandEnabled === false) return null;
    var own = state(sim)[faction];
    if (own.used) return null;
    /* Only the General's own active strategic briefs can trigger a sortie.
       This decision never inspects hostile actor state. */
    var ready = (sim.factions[faction].squads || []).some(function (sq) {
      var m = sq._macroMission;
      return sq.state !== 'retreat' && m && m.owner === 'force-command' && m.status === 'executing';
    });
    if (!ready) return null;
    own.used = true;
    var hostile = faction === 'us' ? 'ge' : 'us',
      town = sim.scene.metadata.battleScenario,
      seed = String(town.seed || 'default'),
      at = round(+sim.time, 2),
      contacts = ((sim.factions[hostile] && sim.factions[hostile].squads) || [])
        .map(function (sq) {
          return sampleSquad(sq, faction, seed, at);
        })
        .filter(Boolean)
        .sort(function (a, b) {
          return a.squadId.localeCompare(b.squadId);
        });
    own.event = Object.freeze({
      source: 'aerial',
      faction: faction,
      observedAt: at,
      validUntil: at + VALID_SECONDS,
      contacts: Object.freeze(contacts)
    });
    if (root.BattleTelemetry && root.BattleTelemetry.record)
      root.BattleTelemetry.record(
        'strategic-aerial-recon',
        { faction: faction, at: at, contacts: contacts.length, expiresAt: at + VALID_SECONDS },
        sim
      );
    return own.event;
  }
  function forGeneral(sim, faction) {
    if (!enabled(sim) || !validFaction(faction)) return null;
    var own = state(sim)[faction],
      ev = own.event;
    if (!ev || sim.time > ev.validUntil) return null;
    return ev;
  }
  function reset(sim) {
    sim._strategicAerialRecon = null;
  }
  root.BattleModules.registerSystem('strategic-aerial-recon', {
    version: '0.1-independent',
    onBattleStart: reset,
    onBattleRestart: reset,
    onCommanderTick: function (sim, p) {
      if (!p || !p.macroCommandEnabled || !enabled(sim)) return;
      request(sim, 'us');
      request(sim, 'ge');
    }
  });
  root.BattleAerialRecon = {
    version: '0.1-independent',
    request: request,
    forGeneral: forGeneral,
    tuning: Object.freeze({ earliestRequestSeconds: MIN_REQUEST_AT, interceptionRequestSeconds: INTERCEPTION_RECON_AT, validitySeconds: VALID_SECONDS })
  };
  if (typeof root.GTLog === 'function') root.GTLog('[STRATEGIC] one-shot aerial recon ready');
})(typeof window !== 'undefined' ? window : globalThis);
