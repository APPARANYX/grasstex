/* Native WW2 projectile flight, on by default; ?projectileFlight=0 restores hitscan.
   Same collision/wound owners as hitscan. No animated bullet meshes: each round
   is an immutable launch direction plus a small velocity/position record.
   The actual ray is swept over successive curved flight segments AFTER soldiers
   have moved; previous target position is never used for damage. */
(function (root) {
  'use strict';
  var q = (root.location && root.location.search) || '',
    enabled = !/[?&]projectileFlight=0(?:&|$)/.test(q),
    /* A round in flight carries its own weapon stats to the wound model; ?roundStats=0 reads the shooter's gun at impact. */
    roundStats = !/[?&]roundStats=0(?:&|$)/.test(q);
  if (!root.BattleModules || !root.BattleBallistics || !root.SquadAI) return;
  var B = root.BattleBallistics,
    S = root.SquadAI,
    G = 9.81,
    MAX_STEP = 0.032,
    MAX_BODIES = 3,
    MIN_SPEED_RATIO = 0.15,
    /* Exponential drag distance is a pragmatic calibrated approximation
       for gameplay, not an external-ballistics solver or an actual BC lookup. */
    PROFILES = {
      'm1-garand': { v0: 853, dragM: 1850, zeroM: 100 },
      kar98k: { v0: 760, dragM: 1720, zeroM: 100 },
      m1919a6: { v0: 853, dragM: 1850, zeroM: 100 },
      mg42: { v0: 755, dragM: 1710, zeroM: 100 },
      'm1-carbine': { v0: 607, dragM: 1060, zeroM: 100 },
      fg42: { v0: 760, dragM: 1720, zeroM: 100 },
      thompson: { v0: 285, dragM: 490, zeroM: 50 },
      mp40: { v0: 380, dragM: 620, zeroM: 75 },
      m1911a1: { v0: 253, dragM: 430, zeroM: 25 },
      p38: { v0: 350, dragM: 530, zeroM: 25 },
      rifle: { v0: 790, dragM: 1760, zeroM: 100 },
      lmg: { v0: 800, dragM: 1800, zeroM: 100 },
      carbine: { v0: 610, dragM: 1050, zeroM: 100 },
      smg: { v0: 340, dragM: 550, zeroM: 50 },
      pistol: { v0: 300, dragM: 490, zeroM: 25 }
    },
    battles = new WeakMap();
  function clamp(v, low, high) {
    return Math.max(low, Math.min(high, v));
  }
  function profile(shooter) {
    var weapon = shooter.weapon,
      stats = weapon && weapon.stats,
      k = (stats && stats.model) || (weapon && weapon.profile) || (weapon && weapon.kind) || 'rifle',
      p = PROFILES[k] || PROFILES[weapon && weapon.kind] || PROFILES.rifle;
    return {
      kind: k,
      v0: stats && +stats.muzzleVelocity > 0 ? +stats.muzzleVelocity : p.v0,
      dragM: stats && +stats.dragDistance > 0 ? +stats.dragDistance : p.dragM,
      zeroM: stats && +stats.zeroDistance >= 0 ? +stats.zeroDistance : p.zeroM
    };
  }
  function statsOf(sim) {
    var st = battles.get(sim);
    if (!st) {
      st = {
        rounds: [],
        fired: 0,
        resolved: 0,
        hits: 0,
        stoppedByCover: 0,
        passedThrough: 0,
        expired: 0,
        flightSeconds: 0,
        maxConcurrent: 0,
        trajectory: [],
        generation: sim._battleGeneration || 0
      };
      battles.set(sim, st);
    }
    return st;
  }
  function reset(sim) {
    battles.delete(sim);
  }
  function vec(a) {
    return { x: +a.x, y: +a.y, z: +a.z };
  }
  function addScaled(a, b, scale) {
    return { x: a.x + b.x * scale, y: a.y + b.y * scale, z: a.z + b.z * scale };
  }
  function norm(a) {
    var l = Math.hypot(a.x, a.y, a.z) || 1;
    return { x: a.x / l, y: a.y / l, z: a.z / l };
  }
  function speed(a) {
    return Math.hypot(a.x, a.y, a.z);
  }
  /* WWII sight settings and held elevation are not the same as a flat laser
     sight. AI estimates range with stable shooter-specific error; it does
     NOT predict where the target will move while the round is in flight.
     Player shots instead retain the weapon's physical mechanical zero,
     leaving long-range holdover to the human crosshair operator. */
  function sightRise(shooter, shot, p, player) {
    if (player) return (G * p.zeroM) / (2 * p.v0 * p.v0);
    var id = String(shooter.id),
      hash = 17;
    for (var i = 0; i < id.length; i++) hash = (Math.imul(hash, 31) + id.charCodeAt(i)) >>> 0;
    var error = ((hash % 23) - 11) * 0.01,
      estimated = clamp(Math.max(1, +shot.distance || p.zeroM) * (1 + error), 3, 1200),
      time = (p.dragM / p.v0) * Math.expm1(estimated / p.dragM);
    return clamp((G * time * time) / (2 * estimated), 0, 0.07);
  }
  function launch(shooter, target, sim, round, delay, shot, player) {
    if (!enabled) return null;
    if (!shot || !shooter || !shooter.weapon || !shooter.weapon.stats) return null;
    var st = statsOf(sim),
      wp = shooter.weapon.stats,
      p = profile(shooter),
      dir = vec(shot.dir),
      /* The bore holds over according to an imperfect AI range estimate,
         or retains the mechanical zero on a player free-fire ray. */
      rise = sightRise(shooter, shot, p, player),
      vdir = norm({ x: dir.x, y: dir.y + rise, z: dir.z }),
      origin = vec(shot.origin);
    var projectile = {
      shooter: shooter,
      target: target,
      player: !!player,
      weapon: wp,
      profile: p,
      origin: origin,
      pos: origin,
      vel: { x: vdir.x * p.v0, y: vdir.y * p.v0, z: vdir.z * p.v0 },
      aimed: vec(shot.aim),
      sigma: shot.sigma,
      remainingM: Math.max(0, +wp.range || 0),
      traveledM: 0,
      flightS: 0,
      time: +sim.time || 0,
      readyAt: (+sim.time || 0) + Math.max(0, +delay || 0),
      round: round || 0,
      skip: [],
      passes: [],
      first: null,
      firstVelocity: null,
      firstDistanceM: null,
      firstFlightS: null,
      active: true
    };
    st.rounds.push(projectile);
    st.fired++;
    st.maxConcurrent = Math.max(st.maxConcurrent, st.rounds.length);
    /* A pending launch is NOT a confirmed hit. The player HUD updates only
       when the actual later segment intersects an enemy body. */
    return player ? { pending: true, origin: origin, aim: shot.aim, flight: true } : null;
  }
  function notify(sim, st, p, collision, why) {
    var first = p.first,
      hit = !!first,
      impact = collision ? vec(collision.impact) : vec(p.pos),
      info = {
        mode: 'flight-raycast',
        origin: p.origin,
        aim: p.aimed,
        impact: first ? first.entry : impact,
        victim: first ? first.victim : null,
        intendedTarget: p.target,
        playerRay: p.player,
        dispersionRad: p.sigma,
        travel: first ? p.firstDistanceM : p.traveledM,
        flightSeconds: first ? p.firstFlightS : p.flightS,
        impactVelocity: first ? p.firstVelocity : speed(p.vel),
        muzzleVelocity: p.profile.v0,
        retainedEnergy: clamp(Math.pow((first ? p.firstVelocity : speed(p.vel)) / p.profile.v0, 2), 0, 1),
        stoppedBy: first ? 'soldier' : why,
        blocker: (collision && collision.blocker) || null,
        surface: first ? 'blood' : (collision && collision.surface) || 'dirt',
        normal: (collision && collision.normal) || null,
        direction: norm(p.vel),
        zone: first ? first.zone : null,
        wound: first ? first.wound : null,
        passes: p.passes,
        round: p.round,
        delay: 0
      };
    p.shooter._lastBallisticShot = info;
    if (sim.onShot) sim.onShot(p.shooter, p.target, hit, p.traveledM, info);
    st.resolved++;
    if (hit) st.hits++;
    if (why === 'environment') st.stoppedByCover++;
    if (why === 'range' || why === 'expired') st.expired++;
    st.flightSeconds += p.flightS;
    if (st.trajectory.length < 24)
      st.trajectory.push({
        from: p.shooter.faction,
        weapon: p.profile.kind,
        hit: hit,
        stoppedBy: why,
        distanceM: +p.traveledM.toFixed(1),
        flightS: +p.flightS.toFixed(3),
        velocity: +speed(p.vel).toFixed(1)
      });
    p.active = false;
  }
  /* Near-miss suppression is tied to the REAL passing trajectory and only
     extends to the first physical obstruction. A blocked ray cannot pin
     enemies behind a wall; a shooter likewise cannot suppress a man at the
     trigger before his bullet approaches. Each bullet pins each man once. */
  function nearPass(sim, p, to, travel) {
    if (!S.pin || !sim.rosterOf || !B.bodyShape || travel <= 0) return;
    var enemies = sim.rosterOf(p.shooter.faction === 'us' ? 'ge' : 'us') || [],
      start = p.pos,
      dx = to.x - start.x,
      dy = to.y - start.y,
      dz = to.z - start.z,
      length = Math.hypot(dx, dy, dz) || 1,
      length2 = length * length,
      allowed = Math.min(1, travel / length),
      radius = p.weapon.suppressive ? 2.25 : 0.85;
    if (!p.pinned) p.pinned = [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || e.dead || p.pinned.indexOf(e) >= 0) continue;
      var body = B.bodyShape(e, sim),
        u = clamp(
          ((body.cx - start.x) * dx + (body.cy - start.y) * dy + (body.cz - start.z) * dz) / length2,
          0,
          allowed
        ),
        px = start.x + u * dx - body.cx,
        py = start.y + u * dy - body.cy,
        pz = start.z + u * dz - body.cz,
        miss = Math.hypot(px, py, pz);
      if (miss > radius) continue;
      S.pin(e, sim, S.SUPPRESSION_TIME * (p.weapon.suppressive ? 1 : 0.35));
      p.pinned.push(e);
    }
  }
  function segment(sim, st, p, dt) {
    var v = speed(p.vel);
    if (!(v > 1) || p.remainingM <= 0) {
      notify(sim, st, p, null, 'range');
      return { used: dt };
    }
    var maxDt = Math.min(dt, MAX_STEP, p.remainingM / Math.max(1, v));
    /* Analytic exponential drag along traveled distance, with averaged
       velocity inside the micro-step. Gravity is integrated in the same
       simulated clock used by infantry, independent of browser FPS. */
    var drag = Math.exp((-v * maxDt) / p.profile.dragM),
      nextVel = {
        x: p.vel.x * drag,
        y: p.vel.y * drag - G * maxDt,
        z: p.vel.z * drag
      },
      meanVel = {
        x: (p.vel.x + nextVel.x) / 2,
        y: (p.vel.y + nextVel.y) / 2,
        z: (p.vel.z + nextVel.z) / 2
      },
      next = addScaled(p.pos, meanVel, maxDt),
      span = Math.hypot(next.x - p.pos.x, next.y - p.pos.y, next.z - p.pos.z),
      hit = B.flightCollision(p.shooter, p.pos, next, sim, p.skip),
      fraction = hit ? clamp(hit.distance / Math.max(span, 1e-6), 0, 1) : 1,
      used = maxDt * fraction;
    nearPass(sim, p, next, span * fraction);
    p.traveledM += span * fraction;
    p.remainingM -= span * fraction;
    p.flightS += used;
    p.vel = nextVel;
    if (!hit) {
      p.pos = next;
      if (p.remainingM <= 0.01) notify(sim, st, p, null, 'range');
      return { used: maxDt };
    }
    p.pos = vec(hit.impact);
    if (hit.kind === 'environment') {
      notify(sim, st, p, hit, 'environment');
      return { used: Math.max(used, 1e-5) };
    }
    var ratio = clamp(speed(p.vel) / p.profile.v0, 0, 1),
      energy = Math.pow(ratio, 2),
      zone = hit.zone,
      penetrationEnergy = energy,
      power = isFinite(+p.weapon.power) ? +p.weapon.power : 1,
      result = S.applyHit(p.shooter, hit.victim, sim, {
        zone: zone,
        point: hit.impact,
        direction: hit.direction,
        distance: p.traveledM,
        round: p.round,
        energy: energy,
        power: power * energy,
        body: p.passes.length,
        velocity: speed(p.vel),
        stats: roundStats ? p.weapon : null
      });
    p.passes.push({
      victim: hit.victim,
      zone: zone,
      entry: hit.impact,
      exit: null,
      direction: hit.direction,
      energy: energy,
      wound: result
    });
    if (!p.first) {
      p.first = p.passes[0];
      p.firstVelocity = speed(p.vel);
      p.firstDistanceM = p.traveledM;
      p.firstFlightS = p.flightS;
    }
    if (p.player && hit.victim.faction !== p.shooter.faction) {
      p.shooter._playerConfirmedHits = (p.shooter._playerConfirmedHits || 0) + 1;
      if (S.noteIncomingFire) S.noteIncomingFire(hit.victim, p.shooter, sim);
    }
    var chance = B.penetration(p.weapon) * B.THROUGH[zone] * penetrationEnergy;
    if (
      p.passes.length >= MAX_BODIES ||
      speed(p.vel) < p.profile.v0 * MIN_SPEED_RATIO ||
      sim.random() >= chance
    ) {
      notify(sim, st, p, hit, 'soldier');
      return { used: Math.max(used, 1e-5) };
    }
    /* Preserve over-penetration and same-frame follow-through; material
       retention reduces both speed and subsequent wound energy. */
    p.passes[p.passes.length - 1].exit = vec(hit.exit);
    p.skip.push(hit.victim);
    p.pos = addScaled(hit.exit, hit.direction, 0.08);
    p.vel = {
      x: p.vel.x * Math.sqrt(B.RETAIN[zone]),
      y: p.vel.y * Math.sqrt(B.RETAIN[zone]),
      z: p.vel.z * Math.sqrt(B.RETAIN[zone])
    };
    st.passedThrough++;
    if (p.remainingM <= 0) notify(sim, st, p, hit, 'range');
    return { used: Math.max(used, 1e-5) };
  }
  function step(sim) {
    if (!enabled || !sim) return;
    var st = statsOf(sim);
    if (!st.rounds.length) return;
    var next = [];
    for (var i = 0; i < st.rounds.length; i++) {
      var p = st.rounds[i],
        now = +sim.time || 0,
        start = Math.max(p.time, p.readyAt),
        remaining = Math.min(0.25, Math.max(0, now - start)),
        loops = 0;
      /* Each bullet advances once per simulation frame; pause and replay
         do not depend on wall-clock timers or GPU frame presentation. */
      p.time = now;
      while (remaining > 1e-7 && p.active && loops++ < 80) {
        var r = segment(sim, st, p, remaining);
        remaining -= Math.min(remaining, Math.max(r.used, 1e-5));
      }
      if (p.active) next.push(p);
    }
    st.rounds = next;
  }
  function summary(sim) {
    if (!enabled) return { enabled: false };
    var st = statsOf(sim);
    return {
      enabled: true,
      fired: st.fired,
      resolved: st.resolved,
      hits: st.hits,
      inFlight: st.rounds.length,
      peakConcurrent: st.maxConcurrent,
      environmentStops: st.stoppedByCover,
      passedThrough: st.passedThrough,
      expired: st.expired,
      meanFlightSeconds: st.resolved ? +(st.flightSeconds / st.resolved).toFixed(3) : 0,
      samples: st.trajectory.slice()
    };
  }
  root.BattleProjectileFlight = {
    version: '1-opt-in-physical-time',
    enabled: enabled,
    launch: launch,
    summary: summary,
    profile: profile,
    profiles: PROFILES,
    sightRise: sightRise
  };
  root.BattleModules.registerSystem('projectile-flight', {
    version: '1-opt-in',
    onBattleStart: reset,
    onBattleRestart: reset,
    onSimulationStep: step
  });
  if (typeof root.GTLog === 'function')
    root.GTLog('[BALLISTICS] swept projectile flight ' + (enabled ? 'enabled' : 'off (hitscan)'));
})(typeof window !== 'undefined' ? window : globalThis);
