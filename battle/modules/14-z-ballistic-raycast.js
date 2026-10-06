/* Direct-fire ballistics: every trigger pull launches a dispersed ray.
   Hits are no longer Bernoulli accuracy rolls.  Weapon combat grouping, stance, movement,
   suppression and range control the angular shot group; the first opposing soldier intersected
   by the ray takes damage. Terrain/buildings/cover can stop a stray round before it reaches a body. */
(function (root) {
  'use strict';
  if (!root.SquadAI || root.BattleBallistics) return;

  var S = root.SquadAI;
  var EPS = 0.08,
    FIRE_LINE_BODY = 0.5, // a fire line that reaches this close to the body centre reaches the body
    GROUND_STEPS = groundSteps(),
    REFINE_STEPS = 9,
    GROUP90 = 4.291932052578694;

  /* ?groundSteps=<n>, 12 to 96 (default 48; 24 is the sampling before): how many samples groundStop takes
     along a round's line, read once at load. A round is tested over the weapon's whole range, so 24 samples of
     a 450 m rifle are 18.75 m apart and a rise narrower than that can sit between two of them; 48 stop it (at
     about 3% of a battle's wall time). ground-stop-check.js holds both sides. */
  function groundSteps() {
    var m = typeof location !== 'undefined' && /[?&]groundSteps=(\d+)\b/.exec(location.search || ''),
      n = m ? +m[1] : 48;
    return n >= 12 && n <= 96 ? n : 48;
  }

  var clamp=root.GTMath.clamp;
  function rand(b) {
    return b && b.random ? b.random() : Math.random();
  }
  function gaussian(b) {
    var u = Math.max(1e-7, rand(b)),
      v = rand(b);
    return clamp(Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v), -2.8, 2.8);
  }
  function norm(v) {
    var l = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / l, y: v.y / l, z: v.z / l };
  }
  function pointAt(o, d, t) {
    return { x: o.x + d.x * t, y: o.y + d.y * t, z: o.z + d.z * t };
  }
  function stance(s) {
    return S.stanceOf ? S.stanceOf(s) : s.prone ? 'prone' : s.crouching ? 'crouch' : 'stand';
  }
  function eyeHeight(s) {
    return S.eyeHeight ? S.eyeHeight(s) : s.prone ? 0.42 : s.crouching ? 1.05 : 1.55;
  }
  /* Gameplay cannot depend on a skinned weapon mesh: animation LOD and headless benchmarks do not
     have the same presentation state. Use one semantic muzzle for the trigger gate and the round,
     projected forward on the firing axis from the calibrated stance eye/bore line. Shoulder-fired
     bores stay near the eye line; moving them lower changed the established combat grouping. Tracers read shot.origin,
     so the visible line starts where the simulated round did. */
  var MUZZLE_HEIGHT = { stand: 1.55, crouch: 1.05, prone: 0.42 },
    MUZZLE_FORWARD = { rifle: 0.78, carbine: 0.68, smg: 0.62, lmg: 0.82, pistol: 0.45 };
  function muzzleOrigin(shooter, target, battle) {
    var p = shooter.root.position,
      st = stance(shooter),
      h = MUZZLE_HEIGHT[st] == null ? MUZZLE_HEIGHT.stand : MUZZLE_HEIGHT[st],
      kind = (shooter.weapon && shooter.weapon.kind) || 'rifle',
      forward = MUZZLE_FORWARD[kind] == null ? MUZZLE_FORWARD.rifle : MUZZLE_FORWARD[kind],
      tp = target && target.root && target.root.position,
      dx = tp ? tp.x - p.x : 0,
      dz = tp ? tp.z - p.z : 0,
      flat = Math.hypot(dx, dz),
      yaw = (shooter.root.rotation && +shooter.root.rotation.y) || 0,
      fx = flat > 1e-6 ? dx / flat : Math.sin(yaw),
      fz = flat > 1e-6 ? dz / flat : Math.cos(yaw);
    return { x: p.x + fx * forward, y: battle.heightAt(p.x, p.z) + h, z: p.z + fz * forward };
  }
  function bodyShape(s, battle) {
    var p = s.root.position,
      st = stance(s),
      ground = battle.heightAt(p.x, p.z),
      yaw = (s.root.rotation && +s.root.rotation.y) || 0;
    if (st === 'prone')
      return { cx: p.x, cy: ground + 0.27, cz: p.z, rx: 0.31, ry: 0.23, rz: 0.76, yaw: yaw };
    if (st === 'crouch') return { cx: p.x, cy: ground + 0.57, cz: p.z, rx: 0.34, ry: 0.54, rz: 0.34, yaw: 0 };
    return { cx: p.x, cy: ground + 0.88, cz: p.z, rx: 0.31, ry: 0.84, rz: 0.31, yaw: 0 };
  }
  function rayEllipsoid(o, d, e, span) {
    var dx = o.x - e.cx,
      dy = o.y - e.cy,
      dz = o.z - e.cz,
      c = Math.cos(e.yaw || 0),
      s = Math.sin(e.yaw || 0);
    var ox = dx * c - dz * s,
      oz = dx * s + dz * c,
      rx = d.x * c - d.z * s,
      rz = d.x * s + d.z * c;
    var ax = rx / e.rx,
      ay = d.y / e.ry,
      az = rz / e.rz,
      bx = ox / e.rx,
      by = dy / e.ry,
      bz = oz / e.rz;
    var A = ax * ax + ay * ay + az * az,
      B = 2 * (ax * bx + ay * by + az * bz),
      C = bx * bx + by * by + bz * bz - 1,
      disc = B * B - 4 * A * C;
    if (disc < 0 || A < 1e-9) return null;
    var q = Math.sqrt(disc),
      t1 = (-B - q) / (2 * A),
      t2 = (-B + q) / (2 * A),
      t = t1 > EPS ? t1 : t2 > EPS ? t2 : null;
    /* span: also where the ray leaves the body (the exit wound of a round that goes through). */
    if (span) return t == null ? null : { t: t, out: Math.max(t, t2) };
    return t;
  }
  function targetCenter(target, battle) {
    var e = bodyShape(target, battle);
    return { x: e.cx, y: e.cy, z: e.cz };
  }

  /* combatSigmaAt100 is one-axis Gaussian sigma in metres at 100 m.  This is deliberately a
     SHOOTER+WEAPON combat grouping, not mechanical test-bench MOA.  With two independent Gaussian
     axes, a 90% circular group diameter is ~4.292 * sigma * distance.  Weapons without the newer
     metadata retain the old accuracy-derived fallback so extension modules remain compatible. */
  function dispersionSigma(shooter, stats, d, battle, round) {
    var legacy = 0.28 + (1 - clamp(+stats.accuracy || 0.5, 0.05, 0.98)) * 1.7;
    var sigmaAt100 = isFinite(+stats.combatSigmaAt100) ? Math.max(0.01, +stats.combatSigmaAt100) : legacy;
    var sigma = sigmaAt100 / 100;
    var mult = (shooter.squad && +shooter.squad.accuracyMultiplier) || 1;
    sigma /= clamp(mult, 0.45, 1.35);
    if (shooter.prone) sigma *= 0.74;
    else if (shooter.crouching) sigma *= 0.88;
    if (shooter.moving) sigma *= 1.55;
    if (shooter.suppressedUntil > battle.time) sigma *= 1.65;
    if (root.SquadAI.isMachineGun(shooter) && shooter.setUp) sigma *= 0.72;
    /* A wounded man shoots worse (the wound model sets it: an arm hit most of all). */
    if (shooter.woundSigma > 1) sigma *= shooter.woundSigma;
    /* A frightened man shoots wider too (soldier condition, module 17). */
    if (root.BattleSoldierMind) sigma *= root.BattleSoldierMind.aimSigma(shooter);
    /* ... and a better marksman shoots tighter (module 10: x0.6 at marksmanship 1, x1.4 at 0). */
    if (root.BattleSoldierStats) sigma *= root.BattleSoldierStats.scale(shooter, 'group');
    /* ... and a man in a berserk trance (Engagement, `?rageTrance=1`) shoots tighter than his fear and pace allow. */
    if (root.BattleEngagement && root.BattleEngagement.entranced && root.BattleEngagement.entranced(shooter))
      sigma *= root.BattleEngagement.tuning.ACT_TUNING.RAGE_AIM;
    /* Muzzle climb: each later round of a burst lands wider; a bipod on the ground holds half of it. */
    if (round > 0 && stats.burstClimb > 0)
      sigma *= 1 + round * stats.burstClimb * (shooter.setUp || shooter.prone ? 0.5 : 1);
    if (d > stats.falloffStart) {
      var f = (d - stats.falloffStart) / Math.max(1, stats.range - stats.falloffStart);
      var extra = isFinite(+stats.rangeDispersion) ? Math.max(0, +stats.rangeDispersion) : 0.9;
      sigma *= 1 + clamp(f, 0, 1) * extra;
    }
    return sigma;
  }
  function groupDiameter90(shooter, stats, d, battle) {
    return GROUP90 * dispersionSigma(shooter, stats, d, battle) * d;
  }
  function shotDirection(shooter, target, stats, battle, round) {
    var origin = muzzleOrigin(shooter, target, battle),
      aim = targetCenter(target, battle);
    var base = norm({ x: aim.x - origin.x, y: aim.y - origin.y, z: aim.z - origin.z }),
      flat = Math.hypot(base.x, base.z) || 1;
    var right = { x: base.z / flat, y: 0, z: -base.x / flat };
    var up = norm({ x: -right.z * base.y, y: right.z * base.x - right.x * base.z, z: right.x * base.y });
    var distance = Math.hypot(aim.x - origin.x, aim.y - origin.y, aim.z - origin.z),
      sigma = dispersionSigma(shooter, stats, distance, battle, round);
    /* One call per round: the soldier condition counts the rounds a frightened man's wider group touched. */
    if (root.BattleSoldierMind) root.BattleSoldierMind.noteAim(shooter);
    var gx = gaussian(battle) * sigma,
      gy = gaussian(battle) * sigma;
    return {
      origin: origin,
      dir: norm({
        x: base.x + right.x * gx + up.x * gy,
        y: base.y + up.y * gy,
        z: base.z + right.z * gx + up.z * gy
      }),
      aim: aim,
      sigma: sigma,
      distance: distance
    };
  }
  function ballisticObstacles(obstacles) {
    if (!obstacles || !obstacles.length || !obstacles.__physicalFootprints || !obstacles.__physicalFootprints.length)
      return obstacles;
    var version = obstacles.__physicalVersion || 0,
      footprints = obstacles.__physicalFootprints,
      cached = obstacles.__ballisticObstacles;
    if (cached && cached.version === version && cached.count === obstacles.length && cached.footprints === footprints)
      return cached.list;
    var byId = Object.create(null),
      seen = Object.create(null),
      out = [],
      i,
      k;
    for (i = 0; i < footprints.length; i++) {
      var fp = footprints[i];
      if (fp && fp.id != null) byId[String(fp.id)] = fp;
    }
    for (i = 0; i < obstacles.length; i++) {
      var ob = obstacles[i],
        id = ob && ob.physicalId != null ? String(ob.physicalId) : '',
        physical = id && byId[id];
      if (!physical || physical === ob) {
        out.push(ob);
        continue;
      }
      if (seen[id]) continue;
      seen[id] = true;
      var exact = {};
      for (k in physical) if (Object.prototype.hasOwnProperty.call(physical, k)) exact[k] = physical[k];
      exact.type = ob.type || exact.type;
      exact.y = isFinite(+exact.y) ? +exact.y : isFinite(+ob.y) ? +ob.y : 0;
      exact.height = isFinite(+exact.height) ? +exact.height : isFinite(+ob.height) ? +ob.height : 1.6;
      exact.cover = ob.cover;
      exact.impactMaterial = ob.impactMaterial;
      exact.materialType = ob.materialType;
      exact.physicalId = id;
      out.push(exact);
    }
    out.__physicalVersion = version;
    obstacles.__ballisticObstacles = {
      version: version,
      count: obstacles.length,
      footprints: footprints,
      list: out
    };
    return out;
  }
  function segmentBlocked(o, d, t, battle) {
    var p = pointAt(o, d, t),
      F = root.BattleObstacleField;
    try {
      if (F) {
        var obs = ballisticObstacles(battle.obstacles),
          ob = (F.sightBlocker || F.sightBlocked).call(F, obs, o, p);
        if (ob) return { obstacle: ob };
      }
    } catch (_) {}
    try {
      if (root.BattleNavigation && root.BattleNavigation.lineOfSightBlocked) {
        var wall = root.BattleNavigation.lineOfSightBlocked({ x: o.x, z: o.z }, { x: p.x, z: p.z }, o.y, p.y);
        if (wall) return { wall: wall };
      }
    } catch (_) {}
    return false;
  }
  function obstacleStop(o, d, maxT, battle) {
    if (!segmentBlocked(o, d, maxT, battle)) return { travel: maxT };
    var lo = EPS,
      hi = maxT;
    for (var i = 0; i < REFINE_STEPS; i++) {
      var mid = (lo + hi) * 0.5;
      if (segmentBlocked(o, d, mid, battle)) hi = mid;
      else lo = mid;
    }
    var block = segmentBlocked(o, d, hi, battle) || {};
    block.travel = hi;
    return block;
  }
  function groundStop(o, d, maxT, battle) {
    var prev = EPS;
    for (var i = 1; i <= GROUND_STEPS; i++) {
      var t = (maxT * i) / GROUND_STEPS,
        p = pointAt(o, d, t),
        gy = battle.heightAt(p.x, p.z) + EPS;
      if (p.y <= gy) {
        var lo = prev,
          hi = t;
        for (var j = 0; j < REFINE_STEPS; j++) {
          var mid = (lo + hi) * 0.5,
            q = pointAt(o, d, mid);
          if (q.y <= battle.heightAt(q.x, q.z) + EPS) hi = mid;
          else lo = mid;
        }
        return hi;
      }
      prev = t;
    }
    return maxT;
  }
  function environmentStop(o, d, maxT, battle) {
    var ob = obstacleStop(o, d, maxT, battle),
      ground = groundStop(o, d, maxT, battle);
    return ground < ob.travel ? { travel: ground, ground: true } : ob;
  }
  function obbNormal(ob, p) {
    var ux = isFinite(+ob.ux) ? +ob.ux : 1,
      uz = isFinite(+ob.uz) ? +ob.uz : 0,
      ul = Math.hypot(ux, uz) || 1;
    ux /= ul;
    uz /= ul;
    var vx = isFinite(+ob.vx) ? +ob.vx : -uz,
      vz = isFinite(+ob.vz) ? +ob.vz : ux,
      vl = Math.hypot(vx, vz) || 1;
    vx /= vl;
    vz /= vl;
    var dx = p.x - (+ob.x || 0),
      dz = p.z - (+ob.z || 0),
      u = dx * ux + dz * uz,
      v = dx * vx + dz * vz,
      hx = Math.max(0.01, +ob.hx || 0.5),
      hz = Math.max(0.01, +ob.hz || 0.5);
    if (Math.abs(Math.abs(u) - hx) <= Math.abs(Math.abs(v) - hz))
      return { x: (u < 0 ? -1 : 1) * ux, y: 0, z: (u < 0 ? -1 : 1) * uz };
    return { x: (v < 0 ? -1 : 1) * vx, y: 0, z: (v < 0 ? -1 : 1) * vz };
  }
  function impactSurface(stop, p, d, battle) {
    var ob = stop.obstacle,
      w = stop.wall,
      n = { x: -d.x, y: -d.y, z: -d.z },
      surface = 'cement';
    if (stop.ground) {
      surface = 'dirt';
      n = norm({
        x: battle.heightAt(p.x - 0.2, p.z) - battle.heightAt(p.x + 0.2, p.z),
        y: 0.4,
        z: battle.heightAt(p.x, p.z - 0.2) - battle.heightAt(p.x, p.z + 0.2)
      });
    } else if (w && w.a && w.b) {
      n = norm({ x: w.b.z - w.a.z, y: 0, z: w.a.x - w.b.x });
    } else if (ob) {
      surface = ob.impactMaterial || ob.materialType || ob.type || 'cement';
      if (ob.shape === 'obb') n = obbNormal(ob, p);
      else if (isFinite(ob.x) && isFinite(ob.z)) n = norm({ x: p.x - ob.x, y: 0.15, z: p.z - ob.z });
    }
    if (n.x * d.x + n.y * d.y + n.z * d.z > 0) n = { x: -n.x, y: -n.y, z: -n.z };
    return { surface: surface, normal: n };
  }
  function firstEnemyHit(shooter, o, d, maxT, battle, skip) {
    var enemies = battle.rosterOf ? battle.rosterOf(shooter.faction === 'us' ? 'ge' : 'us') : [],
      best = null,
      bestSpan = null;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || e.dead || !e.root || (skip && skip.indexOf(e) >= 0)) continue;
      var span = rayEllipsoid(o, d, bodyShape(e, battle), true);
      if (span && span.t <= maxT && (!bestSpan || span.t < bestSpan.t)) {
        best = e;
        bestSpan = span;
      }
    }
    return best ? { soldier: best, t: bestSpan.t, out: bestSpan.out, shape: bodyShape(best, battle) } : null;
  }

  /* Over-penetration. A full-power rifle or MG round (.30-06, 7.92 mm) often goes clean through a
     man, through a limb nearly always; pistol-calibre rounds seldom do. A round that exits keeps
     part of its energy (less after bone and a torso than after a limb), leaves the body deflected,
     having yawed in tissue, and flies on: it can strike a second man behind the first, with a wound
     scaled by what it has left. `penetration` on the weapon (0..1) is how readily its round exits;
     without it, from the cartridge power. */
  var THROUGH = { head: 0.75, chest: 0.7, abdomen: 0.75, arm: 0.95, leg: 0.85 },
    RETAIN = { head: 0.5, chest: 0.45, abdomen: 0.55, arm: 0.75, leg: 0.6 },
    DEFLECT = 0.12,
    MAX_BODIES = 3,
    MIN_ENERGY = 0.15;
  function penetration(stats) {
    if (isFinite(+stats.penetration)) return clamp(+stats.penetration, 0, 1);
    var power = isFinite(+stats.power) ? +stats.power : 1;
    return power >= 0.9 ? 1 : clamp(power * 0.45, 0, 1);
  }
  function deflect(d, battle) {
    var flat = Math.hypot(d.x, d.z) || 1,
      right = { x: d.z / flat, y: 0, z: -d.x / flat },
      gx = gaussian(battle) * DEFLECT,
      gy = gaussian(battle) * DEFLECT;
    return norm({ x: d.x + right.x * gx, y: d.y + gy, z: d.z + right.z * gx });
  }
  /* Which part of the man the round struck, from where it met his body volume. Standing and
     crouched, by height (legs below the belt, head the top ~13%) and by how far off his centre line
     it passed (arms at the edge of the torso); prone, by distance along the body from the feet. */
  function hitZone(shape, p, d, stanceName) {
    var dx = p.x - shape.cx,
      dz = p.z - shape.cz;
    if (stanceName === 'prone') {
      var c = Math.cos(shape.yaw || 0),
        s = Math.sin(shape.yaw || 0),
        side = Math.abs(dx * c - dz * s) / shape.rx,
        along = (dx * s + dz * c) / shape.rz;
      if (along > 0.74) return 'head';
      if (along > 0.2 && side > 0.78) return 'arm';
      if (along > 0.3) return 'chest';
      if (along > -0.05) return 'abdomen';
      return 'leg';
    }
    var h = (p.y - (shape.cy - shape.ry)) / (2 * shape.ry),
      flat = Math.hypot(d.x, d.z) || 1,
      lateral = Math.abs(dx * d.z - dz * d.x) / flat / shape.rx,
      crouch = stanceName === 'crouch';
    if (h > (crouch ? 0.82 : 0.87)) return 'head';
    if (h > (crouch ? 0.4 : 0.5) && lateral > 0.72) return 'arm';
    if (h > (crouch ? 0.56 : 0.62)) return 'chest';
    if (h > (crouch ? 0.4 : 0.5)) return 'abdomen';
    return 'leg';
  }
  function wound(shooter, victim, battle, hit) {
    return S.applyHit(shooter, victim, battle, hit);
  }
  function blockerOf(environment) {
    return environment.ground
      ? 'ground'
      : environment.wall
        ? 'wall'
        : environment.obstacle
          ? 'obstacle'
          : null;
  }
  /* One round from the muzzle: through each body it passes (passes[], at most MAX_BODIES) to where
     it stops, in a body, the environment, or at the end of its range. */
  function resolveRay(shooter, target, battle, round, delay) {
    if (!shooter || !target || target.dead || !shooter.weapon) return null;
    var stats = shooter.weapon.stats,
      sp = shooter.root.position,
      tp = target.root.position,
      d2 = S.dist2 ? S.dist2(sp.x, sp.z, tp.x, tp.z) : Math.hypot(sp.x - tp.x, sp.z - tp.z);
    if (d2 > stats.range) return null;
    var shot = shotDirection(shooter, target, stats, battle, round || 0),
      power = isFinite(+stats.power) ? +stats.power : 1,
      pen = penetration(stats),
      o = shot.origin,
      dir = shot.dir,
      left = stats.range,
      travelled = 0,
      energy = 1,
      passes = [],
      skip = [],
      end = null;
    if (stats.suppressive) root.SquadAI.pin(target, battle, root.SquadAI.SUPPRESSION_TIME);
    while (!end) {
      var environment = environmentStop(o, dir, left, battle),
        body = firstEnemyHit(shooter, o, dir, Math.min(environment.travel, left), battle, skip);
      if (!body) {
        var at = pointAt(o, dir, environment.travel),
          surface = impactSurface(environment, at, dir, battle);
        end = {
          impact: at,
          travel: travelled + environment.travel,
          stoppedBy: environment.travel < left - 0.1 ? 'environment' : 'range',
          blocker: blockerOf(environment),
          surface: surface.surface,
          normal: surface.normal,
          direction: dir
        };
        break;
      }
      var victim = body.soldier,
        entry = pointAt(o, dir, body.t),
        exit = pointAt(o, dir, body.out),
        zone = hitZone(body.shape, entry, dir, stance(victim)),
        pass = {
          victim: victim,
          zone: zone,
          entry: entry,
          exit: null,
          direction: dir,
          energy: energy,
          wound: wound(shooter, victim, battle, {
            zone: zone,
            point: entry,
            direction: dir,
            distance: travelled + body.t,
            round: round || 0,
            energy: energy,
            power: power * energy,
            body: passes.length
          })
        };
      passes.push(pass);
      skip.push(victim);
      /* Does it come out the far side? */
      var through = pen * THROUGH[zone] * energy;
      if (passes.length >= MAX_BODIES || !(rand(battle) < through)) {
        end = {
          impact: entry,
          travel: travelled + body.t,
          stoppedBy: 'soldier',
          blocker: 'soldier',
          direction: dir
        };
        break;
      }
      pass.exit = exit;
      energy *= RETAIN[zone];
      travelled += body.out;
      left = (left - body.out) * RETAIN[zone];
      o = exit;
      dir = deflect(dir, battle);
      pass.exitDirection = dir;
      if (energy < MIN_ENERGY || left < 1) {
        end = { impact: exit, travel: travelled, stoppedBy: 'spent', blocker: null, direction: dir };
        break;
      }
    }
    var first = passes[0] || null,
      hit = !!first;
    /* The shot as the first thing it struck (what every consumer reads), plus the full path. */
    var meta = {
      mode: 'raycast',
      origin: shot.origin,
      aim: shot.aim,
      impact: first ? first.entry : end.impact,
      victim: first ? first.victim : null,
      intendedTarget: target,
      dispersionRad: shot.sigma,
      travel: first ? pointDistance(shot.origin, first.entry) : end.travel,
      stoppedBy: first ? 'soldier' : end.stoppedBy,
      blocker: first ? 'soldier' : end.blocker,
      surface: first ? 'blood' : end.surface,
      normal: first ? { x: -shot.dir.x, y: -shot.dir.y, z: -shot.dir.z } : end.normal,
      direction: shot.dir,
      zone: first ? first.zone : null,
      wound: first ? first.wound : null,
      passes: passes,
      /* Where the round finally went after the last body it left (null if it stopped in one). */
      final: first && end.stoppedBy !== 'soldier' ? end : null,
      round: round || 0,
      delay: delay || 0
    };
    battle.onShot && battle.onShot(shooter, target, hit, d2, meta);
    shooter._lastBallisticShot = meta;
    return hit;
  }
  /* Player free-fire is a crosshair ray, not an AI target decision. Start at the same semantic
     muzzle as ordinary fire, aim through the camera-selected world point, add the same weapon/shooter
     dispersion, then trace the full weapon range through terrain, structures and opposing bodies. */
  function playerShotDirection(shooter, aimPoint, stats, battle, round) {
    if (!aimPoint || !isFinite(+aimPoint.x) || !isFinite(+aimPoint.y) || !isFinite(+aimPoint.z)) return null;
    var proxy = { root: { position: { x: +aimPoint.x, y: +aimPoint.y, z: +aimPoint.z } } },
      origin = muzzleOrigin(shooter, proxy, battle),
      aim = { x: +aimPoint.x, y: +aimPoint.y, z: +aimPoint.z },
      base = norm({ x: aim.x - origin.x, y: aim.y - origin.y, z: aim.z - origin.z }),
      flat = Math.hypot(base.x, base.z) || 1,
      right = { x: base.z / flat, y: 0, z: -base.x / flat },
      up = norm({ x: -right.z * base.y, y: right.z * base.x - right.x * base.z, z: right.x * base.y }),
      distance = Math.hypot(aim.x - origin.x, aim.y - origin.y, aim.z - origin.z),
      sigma = dispersionSigma(shooter, stats, Math.min(stats.range, Math.max(1, distance)), battle, round || 0),
      gx = gaussian(battle) * sigma,
      gy = gaussian(battle) * sigma;
    return {
      origin: origin,
      dir: norm({
        x: base.x + right.x * gx + up.x * gy,
        y: base.y + up.y * gy,
        z: base.z + right.z * gx + up.z * gy
      }),
      aim: aim,
      sigma: sigma,
      distance: distance
    };
  }
  function resolvePlayerRay(shooter, aimPoint, battle, round, delay) {
    if (!shooter || !shooter.weapon || !battle) return null;
    var stats = shooter.weapon.stats,
      shot = playerShotDirection(shooter, aimPoint, stats, battle, round || 0);
    if (!shot) return null;
    var power = isFinite(+stats.power) ? +stats.power : 1,
      pen = penetration(stats),
      o = shot.origin,
      dir = shot.dir,
      left = stats.range,
      travelled = 0,
      energy = 1,
      passes = [],
      skip = [],
      end = null;
    while (!end) {
      var environment = environmentStop(o, dir, left, battle),
        body = firstEnemyHit(shooter, o, dir, Math.min(environment.travel, left), battle, skip);
      if (!body) {
        var at = pointAt(o, dir, environment.travel),
          surface = impactSurface(environment, at, dir, battle);
        end = {
          impact: at,
          travel: travelled + environment.travel,
          stoppedBy: environment.travel < left - 0.1 ? 'environment' : 'range',
          blocker: blockerOf(environment),
          surface: surface.surface,
          normal: surface.normal,
          direction: dir
        };
        break;
      }
      var victim = body.soldier,
        entry = pointAt(o, dir, body.t),
        exit = pointAt(o, dir, body.out),
        zone = hitZone(body.shape, entry, dir, stance(victim)),
        pass = {
          victim: victim,
          zone: zone,
          entry: entry,
          exit: null,
          direction: dir,
          energy: energy,
          wound: wound(shooter, victim, battle, {
            zone: zone,
            point: entry,
            direction: dir,
            distance: travelled + body.t,
            round: round || 0,
            energy: energy,
            power: power * energy,
            body: passes.length
          })
        };
      passes.push(pass);
      skip.push(victim);
      var through = pen * THROUGH[zone] * energy;
      if (passes.length >= MAX_BODIES || !(rand(battle) < through)) {
        end = {
          impact: entry,
          travel: travelled + body.t,
          stoppedBy: 'soldier',
          blocker: 'soldier',
          direction: dir
        };
        break;
      }
      pass.exit = exit;
      energy *= RETAIN[zone];
      travelled += body.out;
      left = (left - body.out) * RETAIN[zone];
      o = exit;
      dir = deflect(dir, battle);
      pass.exitDirection = dir;
      if (energy < MIN_ENERGY || left < 1) {
        end = { impact: exit, travel: travelled, stoppedBy: 'spent', blocker: null, direction: dir };
        break;
      }
    }
    var first = passes[0] || null,
      hit = !!first,
      meta = {
        mode: 'raycast',
        origin: shot.origin,
        aim: shot.aim,
        impact: first ? first.entry : end.impact,
        victim: first ? first.victim : null,
        intendedTarget: null,
        playerRay: true,
        dispersionRad: shot.sigma,
        travel: first ? pointDistance(shot.origin, first.entry) : end.travel,
        stoppedBy: first ? 'soldier' : end.stoppedBy,
        blocker: first ? 'soldier' : end.blocker,
        surface: first ? 'blood' : end.surface,
        normal: first ? { x: -shot.dir.x, y: -shot.dir.y, z: -shot.dir.z } : end.normal,
        direction: shot.dir,
        zone: first ? first.zone : null,
        wound: first ? first.wound : null,
        passes: passes,
        final: first && end.stoppedBy !== 'soldier' ? end : null,
        round: round || 0,
        delay: delay || 0
      };
    battle.onShot && battle.onShot(shooter, first ? first.victim : null, hit, meta.travel, meta);
    shooter._lastBallisticShot = meta;
    return meta;
  }

  /* One authoritative terrain test for every trigger path. The sight system may still see a head
     over a crest; this asks whether the actual muzzle-to-aim line intersects the ground first. */
  function groundLineBlocked(o, aim, battle, clearance) {
    if (!o || !aim || !battle || !battle.heightAt) return false;
    var span = Math.hypot(aim.x - o.x, aim.y - o.y, aim.z - o.z);
    clearance = clearance == null ? FIRE_LINE_BODY : Math.max(0, +clearance || 0);
    if (!(span > clearance)) return false;
    var d = { x: (aim.x - o.x) / span, y: (aim.y - o.y) / span, z: (aim.z - o.z) / span };
    return groundStop(o, d, span, battle) < span - clearance;
  }
  /* The line the round will fly before dispersion: from the same simulation muzzle used by the
     shot to the target's body centre. */
  function fireLineBlocked(shooter, target, battle) {
    if (!shooter || !target || !shooter.root || !target.root || !battle || !battle.heightAt) return false;
    var o = muzzleOrigin(shooter, target, battle),
      aim = targetCenter(target, battle),
      span = Math.hypot(aim.x - o.x, aim.y - o.y, aim.z - o.z);
    /* Terrain crest check (existing): does the ground take the round before it reaches the body? */
    if (groundLineBlocked(o, aim, battle, FIRE_LINE_BODY)) return true;
    /* Obstacle/wall check (new): does a wall, building, or hedge prism intersect the bullet line?
       The eye-to-eye LOS check in the fire gate clears a target whose head is visible over a low
       wall, but the bullet flies muzzle-to-body-centre (geometrically lower). A wall shorter than
       eye height (~1.55m) but tall enough to block the bullet line was invisible to the gate,
       so soldiers mag-dumped into barriers. This reuses the same obstacleStop the round itself
       uses in resolveRay, so the gate and the ballistics agree. */
    if (span > FIRE_LINE_BODY) {
      var d = { x: (aim.x - o.x) / span, y: (aim.y - o.y) / span, z: (aim.z - o.z) / span };
      var obs = obstacleStop(o, d, span, battle);
      if (obs.travel < span - FIRE_LINE_BODY) return true;
    }
    return false;
  }
  /* Suppressive fire aims at a point rather than a body, but it must obey the same terrain geometry.
     Use the same semantic muzzle and groundStop scan as aimed fire so a rifle cannot draw a tracer
     through a hill simply because it is firing at a remembered position. */
  function pointLineBlocked(shooter, point, battle, aimHeight) {
    if (!shooter || !shooter.root || !point || !battle || !battle.heightAt) return false;
    var proxy = { root: { position: { x: point.x, z: point.z } } },
      o = muzzleOrigin(shooter, proxy, battle),
      aim = { x: point.x, y: battle.heightAt(point.x, point.z) + (+aimHeight || 0), z: point.z };
    return groundLineBlocked(o, aim, battle, 0.08);
  }
  function pointDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }
  /* SquadAI fireGate slot, after the ammunition gate and before trigger-time LOS: a round is only
     launched at a live target inside the weapon's range, and a weapon still cycling does not count. */
  function inRange(shooter, battle) {
    if (!shooter || !battle || !shooter.target || shooter.target.dead || shooter.fireCooldown > 0)
      return false;
    var stats = shooter.weapon && shooter.weapon.stats;
    if (!stats) return false;
    var p = shooter.root.position,
      t = shooter.target.root.position,
      d = S.dist2 ? S.dist2(p.x, p.z, t.x, t.z) : Math.hypot(p.x - t.x, p.z - t.z);
    return d <= stats.range;
  }

  if (typeof S.extend === 'function') {
    S.extend('fireGate', 'ballistics', inRange);
    S.extend('shotModel', 'ballistics', resolveRay);
  }
  root.BattleBallistics = {
    version: '98-muzzle-physical-cover',
    resolve: resolveRay,
    resolvePlayerRay: resolvePlayerRay,
    dispersionSigma: dispersionSigma,
    groupDiameter90: groupDiameter90,
    bodyShape: bodyShape,
    hitZone: hitZone,
    penetration: penetration,
    THROUGH: THROUGH,
    RETAIN: RETAIN,
    rayEllipsoid: rayEllipsoid,
    muzzleOrigin: muzzleOrigin,
    ballisticObstacles: ballisticObstacles,
    fireLineBlocked: fireLineBlocked,
    pointLineBlocked: pointLineBlocked,
    groundSteps: function () {
      return GROUND_STEPS;
    }
  };
  if (typeof console !== 'undefined')
    console.log('[BALLISTICS] direct fire uses combat-calibrated dispersed raycasts');
})(typeof window !== 'undefined' ? window : globalThis);
