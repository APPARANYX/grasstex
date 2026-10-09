/* Opt-in carried fragmentation grenades (#409).
   Engagement/player commits once; this owner releases and bursts on the simulation clock.
   Only death cancels a commitment. Scatter uses its own seeded stream. Wounds, suppression
   and physical occlusion stay with their existing owners. Presentation reads frozen flights. */
(function (root) {
  'use strict';
  if (!root.SquadAI || !root.BattleModules || root.BattleGrenades) return;
  function parseOn(search) {
    return /[?&]grenades=1(?:&|#|$)/.test(search || '');
  }
  var ON = parseOn(typeof location !== 'undefined' ? location.search : '');
  var TUNING = Object.freeze({
    RANGE: 30,
    CONF_MIN: 0.5,
    CONTACT_FRESH: 6,
    DECISION_EVERY: 1.5,
    WINDUP: 0.9,
    COOLDOWN: 18,
    SCATTER: 3.5,
    FLIGHT_MIN: 0.7,
    FLIGHT_PER_M: 1 / 18,
    FLIGHT_MAX: 2.4,
    FUSE: 3.6, // seconds after landing
    FRIEND_CLEAR: 13, // includes blast radius + scatter, and the thrower
    BLAST_RADIUS: 9,
    SUPPRESS_RADIUS: 16,
    PIN_MIN: 1.6,
    PIN_MAX: 4.2,
    SEVERITY: 55,
    POWER: 0.85,
    BURST_Y: 0.5,
    VICTIM_Y: 0.9,
    LOADOUT_MAX: 3,
    ARC_STEPS: 24,
    ARC_MIN: 1.3,
    ARC_MAX: 7,
    ARC_PER_M: 0.24,
    REST_Y: 0.12,
    SETTLE_TIME: 0.35
  });
  /* Semantic palm offsets measured at the authored release frames; the renderer never feeds
     animated bone positions back into simulation. x is right, z forward, metres. */
  var RELEASE_ORIGIN = Object.freeze({
    stand: Object.freeze({ x: 0.22, y: 1.7, z: 0.02 }),
    crouch: Object.freeze({ x: 0.32, y: 1.2, z: 0.45 }),
    prone: Object.freeze({ x: 0.16, y: 0.75, z: 0.27 })
  });
  var clamp = root.GTMath.clamp;
  function dist(a, b) {
    return Math.hypot(b.x - a.x, b.z - a.z);
  }
  function units(battle) {
    return root.BattleModules.unitsFor(battle);
  }
  function record(battle, type, data) {
    if (root.BattleTelemetry) root.BattleTelemetry.record(type, data, battle);
  }
  function seedOf(battle) {
    var sc = battle.scene && battle.scene.metadata && battle.scene.metadata.battleScenario;
    return sc && sc.seed != null ? sc.seed : 'battle-default';
  }
  function freshStats() {
    return {
      throws: 0,
      bursts: 0,
      byFaction: { us: 0, ge: 0 },
      wounded: 0,
      casualties: 0,
      friendlyWounded: 0,
      friendlyCasualties: 0,
      suppressed: 0,
      aborted: 0
    };
  }
  function state(battle) {
    if (!battle._grenades)
      battle._grenades = {
        rng: root.BattleScenarioGenerator.rngFor(seedOf(battle), 'grenades'),
        pending: [],
        reviewAt: new WeakMap(),
        live: [],
        seq: 0,
        stats: freshStats()
      };
    return battle._grenades;
  }
  function issued(s) {
    var l = root.SquadAI.loadoutFor(s.role, s.faction);
    return clamp(+l.grenades || 0, 0, TUNING.LOADOUT_MAX);
  }
  function count(s) {
    return ON && s ? (s.grenades == null ? issued(s) : s.grenades) : 0;
  }
  function cooldownLeft(s, battle) {
    return ON && s && battle ? Math.max(0, (+s._grenadeNextAt || 0) - battle.time) : 0;
  }
  function pendingOf(s, battle) {
    var st = ON && battle && battle._grenades;
    if (!st) return null;
    for (var i = 0; i < st.pending.length; i++) if (st.pending[i].s === s) return st.pending[i];
    return null;
  }
  function projectiles(battle) {
    return Object.freeze(ON && battle && battle._grenades ? battle._grenades.live.slice() : []);
  }
  function reset(battle) {
    battle._grenades = null;
    state(battle);
    units(battle).forEach(function (s) {
      s.grenades = issued(s);
      s._grenadeNextAt = 0;
    });
  }
  function lineBlocked(battle, a, b) {
    return root.BattleBallistics.environmentLineBlocked(a, b, battle);
  }
  function hand(s, battle, stance) {
    var p = s.root.position;
    stance = stance || (s.prone ? 'prone' : s.tacticalCrouch || s.crouching ? 'crouch' : 'stand');
    var offset = RELEASE_ORIGIN[stance],
      yaw = s.root.rotation.y || 0,
      c = Math.cos(yaw),
      sn = Math.sin(yaw);
    return {
      x: p.x + c * offset.x + sn * offset.z,
      y: battle.heightAt(p.x, p.z) + offset.y,
      z: p.z - sn * offset.x + c * offset.z
    };
  }
  function flightTime(d) {
    return clamp(TUNING.FLIGHT_MIN + d * TUNING.FLIGHT_PER_M, TUNING.FLIGHT_MIN, TUNING.FLIGHT_MAX);
  }
  function arcPoint(from, to, u) {
    var h = clamp(dist(from, to) * TUNING.ARC_PER_M, TUNING.ARC_MIN, TUNING.ARC_MAX);
    return {
      x: from.x + (to.x - from.x) * u,
      y: from.y + (to.y - from.y) * u + 4 * h * u * (1 - u),
      z: from.z + (to.z - from.z) * u
    };
  }
  /* Resolve the flight once. Scatter may strike cover even when the intended arc clears it:
     stop at that physical impact and settle vertically, never teleport through it. */
  function flightFor(from, to, battle) {
    var duration = flightTime(dist(from, to)),
      points = [{ x: from.x, y: from.y, z: from.z, at: 0 }],
      previous = from,
      blocked = false;
    for (var i = 1; i <= TUNING.ARC_STEPS; i++) {
      var u = i / TUNING.ARC_STEPS,
        p = arcPoint(from, to, u);
      if (lineBlocked(battle, previous, p)) {
        blocked = true;
        var lo = (i - 1) / TUNING.ARC_STEPS,
          hi = u;
        for (var j = 0; j < 10; j++) {
          var mid = (lo + hi) / 2,
            q = arcPoint(from, to, mid);
          if (lineBlocked(battle, previous, q)) hi = mid;
          else lo = mid;
        }
        // Stay just outside the impact face before gravity settles the object.
        p = arcPoint(from, to, Math.max((i - 1) / TUNING.ARC_STEPS, lo - 0.001));
        p.at = duration * lo;
        points.push(p);
        to = { x: p.x, y: battle.heightAt(p.x, p.z) + TUNING.REST_Y, z: p.z };
        if (lineBlocked(battle, p, to)) {
          var settleLow = 0,
            settleHigh = 1,
            ground = to;
          for (var k = 0; k < 12; k++) {
            var fraction = (settleLow + settleHigh) / 2,
              rest = { x: p.x, y: p.y + (ground.y - p.y) * fraction, z: p.z };
            if (lineBlocked(battle, p, rest)) settleHigh = fraction;
            else settleLow = fraction;
          }
          to = { x: p.x, y: p.y + (ground.y - p.y) * Math.max(0, settleLow - 0.001), z: p.z };
        }
        duration = p.at + TUNING.SETTLE_TIME;
        points.push({ x: to.x, y: to.y, z: to.z, at: duration });
        break;
      }
      p.at = duration * u;
      points.push(p);
      previous = p;
    }
    return { from: from, to: to, flight: duration, points: points, blocked: blocked };
  }
  function available(s, battle) {
    if (!ON || !s || !battle || s.dead || !s.root || battle.paused || battle.winner) return false;
    if (count(s) <= 0 || cooldownLeft(s, battle) > 0 || s.reloading || s.crawling || !s.weapon) return false;
    if (pendingOf(s, battle)) return false;
    var live = (battle._grenades && battle._grenades.live) || [];
    for (var i = 0; i < live.length; i++) if (live[i].by === s.id) return false;
    return true;
  }
  function preview(s, battle, aim) {
    if (!ON || !s || !s.root || !battle || !aim || !isFinite(aim.x) || !isFinite(aim.z)) return null;
    var from = hand(s, battle),
      p = s.root.position,
      d = dist(p, aim);
    if (!(d > 0.1)) return null;
    var scale = Math.min(1, TUNING.RANGE / d),
      to = { x: p.x + (aim.x - p.x) * scale, z: p.z + (aim.z - p.z) * scale };
    to.y = battle.heightAt(to.x, to.z) + TUNING.REST_Y;
    var path = flightFor(from, to, battle);
    path.legal = available(s, battle) && !path.blocked;
    path.reason = path.blocked
      ? 'Throw blocked'
      : count(s) <= 0
        ? 'No grenades'
        : cooldownLeft(s, battle) > 0
          ? 'Grenade cooldown'
          : path.legal
            ? ''
            : 'Throw unavailable';
    return path;
  }
  function commit(s, battle, aim, source) {
    var plan = Object.freeze({
      s: s,
      aim: Object.freeze({ x: aim.x, z: aim.z }),
      source: source,
      decidedAt: battle.time,
      releaseAt: battle.time + TUNING.WINDUP,
      stance: s.prone ? 'prone' : s.tacticalCrouch || s.crouching ? 'crouch' : 'stand'
    });
    state(battle).pending.push(plan);
    record(battle, 'decision-grenade', {
      soldier: s.id,
      faction: s.faction,
      squad: s.squad && s.squad.id,
      aim: plan.aim,
      source: source,
      releaseAt: plan.releaseAt,
      carried: count(s)
    });
    if (root.BattleSoldierModel && root.BattleSoldierModel.triggerAnimation)
      root.BattleSoldierModel.triggerAnimation(s, root.BattleSoldierModel.TAGS.throw, {
        decidedAt: plan.decidedAt,
        releaseAt: plan.releaseAt,
        stance: plan.stance
      });
    return plan;
  }
  function playerThrow(s, battle, aim) {
    if (!s || !s.isPlayer || !available(s, battle)) return null;
    var path = preview(s, battle, aim);
    return path && path.legal ? commit(s, battle, path.to, 'player') : null;
  }
  function aimFor(s, battle) {
    /* Remembered positions come from personal knowledge, never a hidden unit's live transform. */
    var c = root.SquadAI.soldierContact(s, battle);
    if (!c || (+c.confidence || 0) < TUNING.CONF_MIN || battle.time - (+c.at || 0) > TUNING.CONTACT_FRESH)
      return null;
    var aim = { x: +c.x, z: +c.z };
    return isFinite(aim.x) && isFinite(aim.z) && dist(s.root.position, aim) <= TUNING.RANGE ? aim : null;
  }
  function friendClear(s, battle, aim) {
    var all = units(battle);
    for (var i = 0; i < all.length; i++) {
      var f = all[i];
      if (!f.dead && f.faction === s.faction && f.root && dist(f.root.position, aim) < TUNING.FRIEND_CLEAR)
        return false;
    }
    return true;
  }
  function consider(s, battle) {
    if (!available(s, battle) || s.isPlayer) return null;
    if (root.BattleEngagement && !root.BattleEngagement.fireAuthorized(s, battle)) return null;
    var aim = aimFor(s, battle);
    if (!aim || root.SquadAI.canSuppress(s, aim, battle) || !friendClear(s, battle, aim)) return null;
    var path = preview(s, battle, aim);
    return path && path.legal ? commit(s, battle, aim, 'contact') : null;
  }
  function reviewDue(s, battle) {
    if (!ON || !s || !battle) return false;
    var times = state(battle).reviewAt;
    if (battle.time < (times.get(s) || 0)) return false;
    times.set(s, battle.time + TUNING.DECISION_EVERY);
    return true;
  }
  function freezeFlight(g) {
    Object.freeze(g.from);
    Object.freeze(g.to);
    g.points.forEach(Object.freeze);
    Object.freeze(g.points);
    return Object.freeze(g);
  }
  function release(plan, battle) {
    var st = state(battle),
      s = plan.s;
    if (s.dead && !(s.casualty && s.casualty.at > plan.releaseAt)) {
      st.stats.aborted++;
      return;
    }
    var radius = Math.sqrt(st.rng()) * TUNING.SCATTER,
      angle = st.rng() * Math.PI * 2,
      to = { x: plan.aim.x + radius * Math.cos(angle), z: plan.aim.z + radius * Math.sin(angle) };
    to.y = battle.heightAt(to.x, to.z) + TUNING.REST_Y;
    var path = flightFor(hand(s, battle, plan.stance), to, battle),
      g = freezeFlight({
        id: ++st.seq,
        by: s.id,
        byFaction: s.faction,
        byRef: s,
        from: path.from,
        to: path.to,
        points: path.points,
        releasedAt: plan.releaseAt,
        flight: path.flight,
        detonateAt: plan.releaseAt + path.flight + TUNING.FUSE,
        severity: TUNING.SEVERITY,
        power: TUNING.POWER
      });
    s.grenades = count(s) - 1;
    s._grenadeNextAt = plan.releaseAt + TUNING.COOLDOWN;
    st.live.push(g);
    st.stats.throws++;
    st.stats.byFaction[s.faction]++;
    record(battle, 'grenade-release', {
      grenade: g.id,
      by: s.id,
      faction: s.faction,
      releasedAt: g.releasedAt,
      detonateAt: g.detonateAt,
      to: g.to,
      carried: count(s)
    });
    if (battle.onGrenade) battle.onGrenade(g, s);
  }
  function position(g, time) {
    var t = Math.max(0, time - g.releasedAt),
      points = g.points;
    for (var i = 1; i < points.length; i++) {
      var a = points[i - 1],
        b = points[i];
      if (t <= b.at) {
        var u = clamp((t - a.at) / Math.max(0.00001, b.at - a.at), 0, 1);
        return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u };
      }
    }
    return { x: g.to.x, y: g.to.y, z: g.to.z };
  }
  function burst(g, battle) {
    var st = state(battle),
      origin = { x: g.to.x, y: g.to.y + TUNING.BURST_Y, z: g.to.z },
      all = units(battle),
      wounded = [],
      suppressed = 0;
    st.stats.bursts++;
    for (var i = 0; i < all.length; i++) {
      var v = all[i];
      if (!v || v.dead || !v.root) continue;
      var p = v.root.position,
        d = dist(origin, p);
      if (d > TUNING.SUPPRESS_RADIUS) continue;
      root.SquadAI.pin(
        v,
        battle,
        TUNING.PIN_MIN + (TUNING.PIN_MAX - TUNING.PIN_MIN) * (1 - d / TUNING.SUPPRESS_RADIUS)
      );
      suppressed++;
      if (
        d >= TUNING.BLAST_RADIUS ||
        lineBlocked(battle, origin, { x: p.x, y: battle.heightAt(p.x, p.z) + TUNING.VICTIM_Y, z: p.z })
      )
        continue;
      var before = v.hp;
      root.BattleWounds.wound(g.byRef, v, battle, {
        energy: Math.pow(1 - d / TUNING.BLAST_RADIUS, 1.35),
        severity: g.severity,
        power: g.power,
        blast: { x: g.to.x, z: g.to.z, d: d }
      });
      wounded.push({ id: v.id, faction: v.faction, d: d, hp: Math.max(0, before - v.hp), dead: !!v.dead });
      if (v.faction === g.byFaction) {
        st.stats.friendlyWounded++;
      }
    }
    st.stats.wounded += wounded.length;
    st.stats.suppressed += suppressed;
    record(battle, 'grenade-burst', {
      grenade: g.id,
      by: g.by,
      faction: g.byFaction,
      at: g.detonateAt,
      x: g.to.x,
      z: g.to.z,
      wounded: wounded,
      suppressed: suppressed
    });
    if (battle.onGrenadeBurst) battle.onGrenadeBurst(g, { wounded: wounded, suppressed: suppressed });
  }
  function step(battle) {
    var st = battle && battle._grenades;
    if (!st || battle.paused || battle.winner) return;
    /* In insertion order, so simultaneous commitments consume the own stream predictably. */
    for (var i = 0; i < st.pending.length; ) {
      var plan = st.pending[i];
      if (plan.s.dead || battle.time >= plan.releaseAt) {
        st.pending.splice(i, 1);
        release(plan, battle);
      } else i++;
    }
    for (var j = 0; j < st.live.length; ) {
      if (battle.time >= st.live[j].detonateAt) burst(st.live.splice(j, 1)[0], battle);
      else j++;
    }
  }
  function summary(battle) {
    var st = ON && battle && battle._grenades;
    var stats = JSON.parse(JSON.stringify(st ? st.stats : freshStats()));
    if (st && root.BattleWounds) {
      var wounds = root.BattleWounds.summary(battle);
      stats.casualties = wounds.grenadeCasualties || 0;
      stats.friendlyCasualties = wounds.grenadeFriendlyCasualties || 0;
    }
    return stats;
  }
  root.BattleGrenades = {
    on: function () {
      return ON;
    },
    parseOn: parseOn,
    TUNING: TUNING,
    RELEASE_ORIGIN: RELEASE_ORIGIN,
    count: count,
    cooldownLeft: cooldownLeft,
    pendingOf: pendingOf,
    projectiles: projectiles,
    playerThrow: playerThrow,
    consider: consider,
    reviewDue: reviewDue,
    preview: preview,
    position: position,
    summary: summary
  };
  if (ON) {
    root.SquadAI.extend('fireGate', 'grenades', function (s, battle) {
      return !pendingOf(s, battle);
    });
    root.BattleModules.registerSystem('grenades', {
      version: '1.0',
      onBattleStart: reset,
      onBattleRestart: reset,
      onSimulationStep: step
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
