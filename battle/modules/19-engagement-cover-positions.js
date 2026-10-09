/* Engagement cover-positions sub-module (extracted from battle/engagement.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.

   Cover is a set of physical stand slots shared by engagement and survival routes (module 52).
   This module owns the whole cover subsystem: the per-battle registry keyed on the obstacle
   snapshot (coverRegistry), the ring-of-stand-slots builder with the stand-off margin index
   (rawCoverSlots, marginIndex, buildCoverSlots), claim lifecycle (reserveCover, releaseCover,
   currentCover, dropCover, coverLive, coverAvailable, coverBodies) and the choice itself
   (coverCandidates, findCover). Engagement chooses/reserves cover; the Movement Resolver
   remains the only writer of physical destinations.

   Wiring is the reverse of the 15m -> 16 pattern: every module file loads AFTER engagement.js
   in both chains (the page appends the discovered modules after the core scripts; the harness
   loads them after the runtime block), so engagement.js cannot call this factory at its own
   load time. Instead engagement.js publishes the ctx below (_engagementCoverCtx: its closure
   utilities and the COVER_* constants, which stay there - its tuning export reads them) plus
   an attach sink (_engagementCoverAttach), and this file calls the factory with that ctx at
   ITS load time and installs the returned functions back into the parent. Until then the
   parent's delegating closures fail loudly, so a chain that loads engagement.js without this
   module says so on the first cover use instead of silently fielding soldiers in the open. */
(function (root) {
  'use strict';
  if (root._engagementCoverPositions) return;

  /* Factory: the module calls it itself at load time with engagement.js's ctx (see above). */
  root._engagementCoverPositions = function (ctx) {
    var root = ctx.root,
      dist = ctx.dist,
      posOf = ctx.posOf,
      field = ctx.field,
      state = ctx.state,
      SA = ctx.SA,
      seesFrom = ctx.seesFrom,
      USEFUL_COVER = ctx.USEFUL_COVER,
      COVER_RANGE = ctx.COVER_RANGE,
      COVER_FIRE = ctx.COVER_FIRE,
      COVER_SPACING = ctx.COVER_SPACING,
      COVER_CELL = ctx.COVER_CELL;
    var coverClaims = new WeakMap();
  function coverKey(p) {
    return Math.floor(p.x / COVER_CELL) + ',' + Math.floor(p.z / COVER_CELL);
  }
  function coverRegistry(battle) {
    var obs = battle.obstacles || [],
      N = root.BattleNavigation,
      c = coverClaims.get(battle),
      version = (obs.__physicalVersion || 0) + '|' + obs.length + '|' + ((N && N.version) || 0);
    if (
      !c ||
      c.source !== obs ||
      c.version !== version ||
      c.roster !== battle._roster ||
      battle.time < c.lastTime
    ) {
      c = {
        battle: battle,
        source: obs,
        version: version,
        roster: battle._roster,
        lastTime: battle.time,
        shapes: new Map(),
        shapeIds: new Map(),
        slots: null,
        bySoldier: new Map(),
        claims: new Map(),
        bodies: new Map(),
        bodyTime: null
      };
      var physical = obs.__physicalFootprints || [];
      for (var i = 0; i < physical.length; i++)
        if (physical[i].id != null) c.shapes.set(String(physical[i].id), physical[i]);
      for (i = 0; i < obs.length; i++) {
        var fp = c.shapes.get(String(obs[i].physicalId)) || obs[i];
        if (!c.shapeIds.has(fp)) c.shapeIds.set(fp, 'cover:' + i);
      }
      coverClaims.set(battle, c);
    }
    c.lastTime = battle.time;
    return c;
  }
  function dropCover(c, e) {
    if (!e) return;
    if (c.bySoldier.get(e.soldier) === e) c.bySoldier.delete(e.soldier);
    var list = c.claims.get(coverKey(e.slot));
    if (list) {
      var i = list.indexOf(e);
      if (i >= 0) list.splice(i, 1);
    }
  }
  function coverLive(e, battle) {
    var s = e.soldier,
      q = s.squad || {},
      eng = s.eng,
      p = s.root && s.root.position;
    if (
      s.dead ||
      s.incapacitated ||
      battle.winner ||
      !p ||
      q.state === 'retreat' ||
      q.commandPhase === 'retreat' ||
      q.commandPhase === 'regroup' ||
      (root.BattleTacticalPositions && root.BattleTacticalPositions.current(s))
    )
      return false;
    if (e.createdAt === battle.time) return true; // selection is committed by its caller in this tick
    var near = dist(p.x, p.z, e.slot.x, e.slot.z) <= COVER_SPACING;
    if (e.kind === 'route') return !!(s._tacticalRoute && s._tacticalRoute.coverSlotId === e.slot.id) || near;
    return !!(
      eng &&
      eng.cover &&
      eng.cover.slotId === e.slot.id &&
      (eng.state === 'bound' || (near && ['engage', 'pinned', 'orient', 'alert'].indexOf(eng.state) >= 0))
    );
  }
  function currentCover(s, battle) {
    var c = coverRegistry(battle),
      e = c.bySoldier.get(s);
    if (e && !coverLive(e, battle)) {
      dropCover(c, e);
      return null;
    }
    return e || null;
  }
  function releaseCover(s, battle, kind) {
    var c = coverRegistry(battle),
      e = c.bySoldier.get(s);
    if (e && (!kind || e.kind === kind)) dropCover(c, e);
  }
  function slotPad() {
    var P = root.BattleNavigationPhysicality;
    return Math.max(0.9, ((P && P.routeMargin) || 1.15) + 0.05);
  }
  function coverEligible(F, ob) {
    return F.obstacleHeight(ob) >= 0.5 && (ob.cover == null ? 1 : +ob.cover) <= USEFUL_COVER;
  }
  function rawCoverSlots(c, ob, fp) {
    var slots = [],
      pad = slotPad(),
      id = c.shapeIds.get(fp);
    function add(x, z, nx, nz) {
      var slot = {
        id: id + ':' + slots.length,
        x: x,
        z: z,
        normalX: nx,
        normalZ: nz,
        obstacle: ob,
        shape: fp,
        type: ob.type || 'cover'
      };
      slots.push(slot);
    }
    if (fp.shape === 'obb') {
      var ux = isFinite(+fp.ux) ? +fp.ux : 1,
        uz = +fp.uz || 0,
        l = Math.hypot(ux, uz) || 1;
      ux /= l;
      uz /= l;
      var vx = isFinite(+fp.vx) ? +fp.vx : -uz,
        vz = isFinite(+fp.vz) ? +fp.vz : ux,
        vl = Math.hypot(vx, vz) || 1;
      vx /= vl;
      vz /= vl;
      var hx = +fp.hx || 0.5,
        hz = +fp.hz || 0.5;
      function face(half, nx, nz, tx, tz, depth) {
        var n = Math.max(1, Math.floor((half * 2) / COVER_SPACING));
        for (var i = 0; i < n; i++) {
          var along = ((i + 0.5) * half * 2) / n - half;
          add(fp.x + nx * (depth + pad) + tx * along, fp.z + nz * (depth + pad) + tz * along, nx, nz);
        }
      }
      face(hx, vx, vz, ux, uz, hz);
      face(hx, -vx, -vz, ux, uz, hz);
      face(hz, ux, uz, vx, vz, hx);
      face(hz, -ux, -uz, vx, vz, hx);
    } else {
      var radius = (+fp.radius || 1) + pad,
        count = Math.max(4, Math.floor((Math.PI * 2 * radius) / COVER_SPACING));
      for (var i = 0; i < count; i++) {
        var a = (i * Math.PI * 2) / count;
        add(fp.x + Math.cos(a) * radius, fp.z + Math.sin(a) * radius, Math.cos(a), Math.sin(a));
      }
    }
    return slots;
  }
  /* Every obstacle rings itself with slots, so neighbouring pieces of cover produce slots that
     sit on top of each other. Build them all once per map version in obstacle order, drop the
     unusable ones, then walk from the newest back and delete any older slot within claim spacing
     of one already kept: no two surviving slots overlap, so every slot shown can be taken. */
  /* Distance from a point to an obstacle's ground footprint (0 inside). */
  function footprintGap(fp, x, z) {
    if (fp.shape === 'obb') {
      var ux = isFinite(+fp.ux) ? +fp.ux : 1,
        uz = +fp.uz || 0,
        l = Math.hypot(ux, uz) || 1;
      ux /= l;
      uz /= l;
      var vx = isFinite(+fp.vx) ? +fp.vx : -uz,
        vz = isFinite(+fp.vz) ? +fp.vz : ux,
        vl = Math.hypot(vx, vz) || 1;
      vx /= vl;
      vz /= vl;
      var dx = x - fp.x,
        dz = z - fp.z,
        a = Math.abs(dx * ux + dz * uz) - (+fp.hx || 0.5),
        b = Math.abs(dx * vx + dz * vz) - (+fp.hz || 0.5);
      return Math.hypot(Math.max(a, 0), Math.max(b, 0));
    }
    return Math.max(0, dist(x, z, fp.x, fp.z) - (+fp.radius || 1));
  }
  /* Every standing obstacle keeps a stand-off margin that no slot may enter. Defence works
     (sandbags, log walls, trenches) are chains of cover circles that are not physical footprints,
     so neither the collision line nor the planner's stand check sees them; without this, one
     circle's ring of slots landed on top of its neighbours. */
  function marginIndex(F, c, pad) {
    var cell = 4,
      grid = new Map(),
      seen = new Set();
    for (var i = 0; i < c.source.length; i++) {
      var ob = c.source[i];
      if (F.obstacleHeight(ob) < 0.5) continue;
      var fp = c.shapes.get(String(ob.physicalId)) || ob,
        ext = (fp.shape === 'obb' ? Math.hypot(+fp.hx || 0.5, +fp.hz || 0.5) : +fp.radius || 1) + pad;
      if (seen.has(fp)) continue;
      seen.add(fp);
      for (var cx = Math.floor((fp.x - ext) / cell); cx <= Math.floor((fp.x + ext) / cell); cx++)
        for (var cz = Math.floor((fp.z - ext) / cell); cz <= Math.floor((fp.z + ext) / cell); cz++) {
          var k = cx + ',' + cz,
            list = grid.get(k);
          if (!list) grid.set(k, (list = []));
          list.push(fp);
        }
    }
    return function (x, z) {
      var list = grid.get(Math.floor(x / cell) + ',' + Math.floor(z / cell));
      if (list)
        for (var j = 0; j < list.length; j++) if (footprintGap(list[j], x, z) < pad - 0.01) return false;
      return true;
    };
  }
  function buildCoverSlots(c) {
    var F = field(),
      N = root.BattleNavigation,
      P = root.BattleNavigationPhysicality,
      all = [],
      seen = new Set();
    c.slots = new Map();
    var outsideMargins = F
      ? marginIndex(F, c, slotPad())
      : function () {
          return true;
        };
    /* A slot must be somewhere a body can stand: the planner's stand envelope (route margin
       around every shape, not just this one) must accept it unchanged, or the planner would
       quietly move the soldier off it. */
    function standable(slot) {
      if (N && !N.movementClear(slot, slot)) return false;
      if (!P || !P.resolveStandGoal) return true;
      var stand = P.resolveStandGoal(c.battle, null, slot);
      return !!stand && dist(stand.x, stand.z, slot.x, slot.z) < 0.01;
    }
    for (var i = 0; i < c.source.length; i++) {
      var ob = c.source[i],
        fp = c.shapes.get(String(ob.physicalId)) || ob;
      if (seen.has(fp)) continue;
      seen.add(fp);
      c.slots.set(fp, []);
      if (!F || !coverEligible(F, ob)) continue;
      var raw = rawCoverSlots(c, ob, fp);
      for (var j = 0; j < raw.length; j++) {
        var slot = raw[j];
        if (!outsideMargins(slot.x, slot.z) || !standable(slot)) continue;
        if (F.coverPotentialAt(c.source, slot.x, slot.z) > USEFUL_COVER) continue;
        all.push(slot);
      }
    }
    var grid = new Map(),
      kept = [];
    function cell(x, z) {
      return Math.floor(x / COVER_SPACING) + ',' + Math.floor(z / COVER_SPACING);
    }
    for (i = all.length - 1; i >= 0; i--) {
      var slot = all[i],
        cx = Math.floor(slot.x / COVER_SPACING),
        cz = Math.floor(slot.z / COVER_SPACING),
        clash = false;
      for (var x = -1; x <= 1 && !clash; x++)
        for (var z = -1; z <= 1 && !clash; z++) {
          var list = grid.get(cx + x + ',' + (cz + z));
          if (list)
            for (var k = 0; k < list.length; k++)
              if (dist(list[k].x, list[k].z, slot.x, slot.z) < COVER_SPACING - 0.001) {
                clash = true;
                break;
              }
        }
      if (clash) continue;
      var key = cell(slot.x, slot.z),
        bucket = grid.get(key);
      if (!bucket) grid.set(key, (bucket = []));
      bucket.push(slot);
      kept.push(slot);
    }
    for (i = kept.length - 1; i >= 0; i--) c.slots.get(kept[i].shape).push(kept[i]);
    c.slotCount = kept.length;
    c.slotsPruned = all.length - kept.length;
  }
  function coverSlots(c, ob) {
    if (!c.slots) buildCoverSlots(c);
    return c.slots.get(c.shapes.get(String(ob.physicalId)) || ob) || [];
  }
  function coverBodies(c, battle) {
    if (c.bodyTime === battle.time) return;
    c.bodyTime = battle.time;
    c.bodies.clear();
    var roster = battle._roster || {};
    ['us', 'ge'].forEach(function (f) {
      (roster[f] || []).forEach(function (s) {
        if (s.dead || !s.root) return;
        [s.root.position, s.destination].forEach(function (p) {
          if (!p) return;
          var k = coverKey(p),
            list = c.bodies.get(k);
          if (!list) c.bodies.set(k, (list = []));
          list.push({ soldier: s, point: { x: p.x, z: p.z } });
        });
      });
    });
  }
  function coverAvailable(c, slot, s, battle) {
    coverBodies(c, battle);
    var cx = Math.floor(slot.x / COVER_CELL),
      cz = Math.floor(slot.z / COVER_CELL);
    for (var x = -1; x <= 1; x++)
      for (var z = -1; z <= 1; z++) {
        var key = cx + x + ',' + (cz + z),
          list = c.claims.get(key) || [];
        for (var i = list.length - 1; i >= 0; i--) {
          var e = list[i];
          if (!coverLive(e, battle)) {
            dropCover(c, e);
            continue;
          }
          if (e.soldier !== s && dist(e.slot.x, e.slot.z, slot.x, slot.z) < COVER_SPACING - 0.001)
            return false;
        }
        var bodies = c.bodies.get(key) || [];
        for (i = 0; i < bodies.length; i++) {
          var body = bodies[i];
          if (
            body.soldier !== s &&
            !body.soldier.dead &&
            dist(body.point.x, body.point.z, slot.x, slot.z) < 0.9
          )
            return false;
        }
      }
    var N = root.BattleNavigation;
    return !N || N.movementClear(slot, slot);
  }
  function reserveCover(s, battle, slot, kind) {
    var c = coverRegistry(battle);
    if (!slot || !coverAvailable(c, slot, s, battle)) return null;
    var prev = c.bySoldier.get(s);
    if (prev && prev.slot === slot && prev.kind === kind) return prev;
    dropCover(c, prev);
    var e = { slot: slot, soldier: s, kind: kind || 'engagement', createdAt: battle.time };
    c.bySoldier.set(s, e);
    var k = coverKey(slot),
      list = c.claims.get(k);
    if (!list) c.claims.set(k, (list = []));
    list.push(e);
    return e;
  }
  function coverCandidates(s, battle, threat, maxRange) {
    var F = field();
    if (!F || !threat) return [];
    var c = coverRegistry(battle),
      p = posOf(s),
      t = threat.root ? posOf(threat) : threat;
    var obs = F.nearby(battle.obstacles, p.x, p.z, maxRange),
      out = [],
      seen = new Set(),
      P = root.BattleNavigationPhysicality;
    for (var i = 0; i < obs.length; i++) {
      var slots = coverSlots(c, obs[i]);
      if (!slots.length || seen.has(slots)) continue;
      seen.add(slots);
      for (var j = 0; j < slots.length; j++) {
        var slot = slots[j],
          dx = t.x - slot.x,
          dz = t.z - slot.z;
        if (dx * slot.normalX + dz * slot.normalZ >= 0 || dist(p.x, p.z, slot.x, slot.z) > maxRange) continue;
        // The sheltering physical volume must actually lie between this slot and the threat.
        if (P && P.shapeHit && !P.shapeHit(slot, t, slot.shape, 0)) continue;
        if (!coverAvailable(c, slot, s, battle)) continue;
        var quality = F.coverPotentialAt(battle.obstacles, slot.x, slot.z);
        if (quality > USEFUL_COVER) continue;
        out.push({
          x: slot.x,
          z: slot.z,
          slotId: slot.id,
          slot: slot,
          quality: quality,
          distance: dist(p.x, p.z, slot.x, slot.z),
          obstacle: slot.obstacle,
          type: slot.type
        });
      }
    }
    return out;
  }
  function coverSnapshot(battle) {
    var c = coverRegistry(battle),
      F = field(),
      out = [],
      seen = new Set();
    for (var i = 0; i < c.source.length; i++) {
      var slots = coverSlots(c, c.source[i]);
      if (!slots.length || seen.has(slots)) continue;
      seen.add(slots);
      for (var j = 0; j < slots.length; j++) {
        var slot = slots[j];
        var e = null,
          list = c.claims.get(coverKey(slot)) || [];
        for (var k = 0; k < list.length; k++)
          if (list[k].slot === slot && coverLive(list[k], battle)) {
            e = list[k];
            break;
          }
        var occupied = e && dist(posOf(e.soldier).x, posOf(e.soldier).z, slot.x, slot.z) <= 0.45;
        out.push({
          id: slot.id,
          x: slot.x,
          z: slot.z,
          normalX: slot.normalX,
          normalZ: slot.normalZ,
          type: slot.type,
          status: e ? (occupied ? 'occupied' : 'reserved') : 'free',
          soldierId: e ? e.soldier.id : null,
          faction: e ? e.soldier.faction : null
        });
      }
    }
    return out;
  }
  function reachable(from, to) {
    var N = root.BattleNavigation;
    if (!N) return true;
    if (!N.movementClear(to, to)) return false;
    if (N.movementClear(from, to)) return true;
    var path = N.findPath(from, to);
    return !!(
      path &&
      path.length &&
      dist(path[path.length - 1].x, path[path.length - 1].z, to.x, to.z) <= 0.35
    );
  }
  /* The rear side of tall bocage is safe but blind. If no protective firing cover
     has a line, use an end-face *stand slot* around the obstacle as a short lateral
     firing-lane bound. It is an ordinary Engagement cover-bound proposal: Movement
     Resolver/navigation still own the actual route, and the slot is reserved as
     existing cover slots are. Do not pick through a hedge or move farther than a
     normal cover bound. */
  function findFiringLane(s, battle, opts) {
    opts = opts || {};
    var F = field(),
      t = s.target;
    if (!F || !t || !t.root) return null;
    var p = posOf(s),
      maxRange = opts.maxRange || COVER_RANGE,
      nearby = F.nearby(battle.obstacles, p.x, p.z, maxRange),
      c = coverRegistry(battle),
      best = null,
      bestScore = -Infinity,
      seen = new Set(),
      leads = SA().isLeader(s);
    for (var i = 0; i < nearby.length; i++) {
      var slots = coverSlots(c, nearby[i]);
      if (!slots.length || seen.has(slots)) continue;
      seen.add(slots);
      for (var j = 0; j < slots.length; j++) {
        var slot = slots[j],
          shape = slot.shape;
        if (!shape || shape.shape !== 'obb') continue;
        /* Long-face slots are behind the obstacle and stay blind; only an end
           face has a chance to see around a continuous long hedgerow. */
        var ux = +shape.ux || 1,
          uz = +shape.uz || 0,
          axisLen = Math.hypot(ux, uz) || 1,
          endFace = Math.abs((slot.normalX * ux + slot.normalZ * uz) / axisLen) > 0.85;
        if (!endFace) continue;
        var d = dist(p.x, p.z, slot.x, slot.z);
        if (d < 1.5 || d > maxRange) continue;
        if (!coverAvailable(c, slot, s, battle)) continue;
        if (root.BattleMovementProgress && !root.BattleMovementProgress.candidateAllowed(s, battle, slot))
          continue;
        if (root.BattleAssaultForwardGuard && !root.BattleAssaultForwardGuard.allowCover(s, battle, slot))
          continue;
        var anchor = s.orderDestination || (s.squad && s.squad.orderAnchor);
        if (leads && anchor && dist(slot.x, slot.z, anchor.x, anchor.z) > 18) continue;
        var back = opts.notBehind;
        if (back && (slot.x - p.x) * back.axis.x + (slot.z - p.z) * back.axis.z < -back.allow)
          continue;
        if (!seesFrom(slot, 'stand', t, battle) || !reachable(p, slot)) continue;
        var score = -d - F.coverPotentialAt(battle.obstacles, slot.x, slot.z) * 4;
        if (score > bestScore) {
          bestScore = score;
          best = {
            x: slot.x, z: slot.z, slot: slot, slotId: slot.id,
            distance: d, quality: F.coverPotentialAt(battle.obstacles, slot.x, slot.z),
            obstacle: slot.obstacle, type: 'firing-lane'
          };
        }
      }
    }
    if (best && !reserveCover(s, battle, best.slot, 'engagement')) return null;
    return best;
  }
  function findCover(s, battle, opts) {
    opts = opts || {};
    var target = opts.threat || s.target;
    if (!target) return null;
    var p = posOf(s),
      forward = opts.forward || null,
      candidates = coverCandidates(s, battle, target, opts.maxRange || COVER_RANGE),
      best = null,
      bestScore = -Infinity,
      leads = SA().isLeader(s);
    for (var i = 0; i < candidates.length; i++) {
      var pt = candidates[i],
        moveD = pt.distance;
      if (root.BattleAssaultForwardGuard && !root.BattleAssaultForwardGuard.allowCover(s, battle, pt))
        continue;
      if (root.BattleMovementProgress && !root.BattleMovementProgress.candidateAllowed(s, battle, pt))
        continue;
      var anchor = s.orderDestination || (s.squad && s.squad.orderAnchor);
      if (leads && anchor && dist(pt.x, pt.z, anchor.x, anchor.z) > 18) continue;
      if (dist(pt.x, pt.z, posOf(target).x, posOf(target).z) < (opts.minEnemyDistance || 12)) continue;
      var back = opts.notBehind;
      if (back && (pt.x - p.x) * back.axis.x + (pt.z - p.z) * back.axis.z < -back.allow) continue;
      var score = (1 - pt.quality) * 40 - moveD;
      if (forward) score += ((pt.x - p.x) * forward.x + (pt.z - p.z) * forward.z) * 0.9;
      if (score <= bestScore) continue;
      // Cover to fight from keeps a line to the threat (standing is the highest he can rise); evading takes any.
      if (COVER_FIRE && !opts.evade && !seesFrom(pt, 'stand', target, battle)) continue;
      if (!reachable(p, pt)) continue;
      bestScore = score;
      best = pt;
    }
    var incumbent = state(s).state === 'bound' && state(s).cover,
      claim = currentCover(s, battle);
    if (
      best &&
      incumbent &&
      claim &&
      !opts.forward &&
      incumbent.quality <= USEFUL_COVER &&
      (!root.BattleMovementProgress || root.BattleMovementProgress.candidateAllowed(s, battle, incumbent))
    ) {
      var incumbentScore = (1 - incumbent.quality) * 40 - dist(p.x, p.z, incumbent.x, incumbent.z);
      if (bestScore < incumbentScore + 4) return incumbent;
    }
    if (best && !reserveCover(s, battle, best.slot, 'engagement')) return null;
    return best;
  }
  function warm(battle) {
    var c = coverRegistry(battle);
    if (!c.slots) buildCoverSlots(c);
    return c.slotCount;
  }

    return {
      coverRegistry: coverRegistry,
      buildCoverSlots: buildCoverSlots,
      currentCover: currentCover,
      releaseCover: releaseCover,
      reserveCover: reserveCover,
      coverCandidates: coverCandidates,
      coverSnapshot: coverSnapshot,
      findCover: findCover,
      findFiringLane: findFiringLane,
      warm: warm
    };
  };

  /* Install into the parent now; engagement.js must already be loaded. */
  if (!root._engagementCoverCtx || !root._engagementCoverAttach)
    throw new Error('[cover-positions] engagement.js must load before battle/modules/19-engagement-cover-positions.js');
  root._engagementCoverAttach(root._engagementCoverPositions(root._engagementCoverCtx()));
})(typeof window !== 'undefined' ? window : globalThis);
