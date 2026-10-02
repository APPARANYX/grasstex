/* Squad + soldier AI for the battle sim.

   This file owns perception (who can see whom), the shot resolution, squad formations/orders and
   the squad state machine. The individual combat decision - stop, take cover, go prone, shoot,
   bound forward - lives in engagement.js, which this file delegates to. Keeping the two apart is
   what stops half a dozen modules from each writing soldier.destination on the same tick. */
(function (root) {
  'use strict';

  var ROLES = {
    sergeant: { speed: 3.0, visionRange: 150, hp: 110 },
    rifleman: { speed: 2.9, visionRange: 140, hp: 100 },
    gunner: { speed: 2.2, visionRange: 150, hp: 100 },
    scout: { speed: 3.8, visionRange: 175, hp: 90 }
  };
  /* What a man is issued, kept apart from what he does (ROLES). A loadout names the weapon kind of
     each slot; `BattleWeapons.issue` turns the kind into the side's own weapon (profile, magSize,
     carried). Squad leaders carry a submachine gun (US Thompson, GE MP40), not a pistol: a sidearm
     left the leader out of every fight past 25 m. `loadoutFor` is the only place a role picks a
     weapon, so a per-man variation (sniper, sidearm) is a new loadout, not a new code path. */
  var LOADOUTS = {
    sergeant: { primary: 'smg', secondary: 'pistol' },
    rifleman: { primary: 'rifle' },
    gunner: { primary: 'lmg', secondary: 'pistol' },
    scout: { primary: 'carbine' },
    engineer: { primary: 'rifle' }
  };
  /* A light machine gun is emplaced, fires from a base of fire and takes the suppression job first:
     what the man carries decides it, not his role. */
  function isMachineGun(soldier) {
    return !!(soldier && soldier.weapon && soldier.weapon.kind === 'lmg');
  }
  function loadoutFor(role, faction) {
    var l = LOADOUTS[role] || LOADOUTS.rifleman;
    return { primary: l.primary, secondary: l.secondary || null };
  }
  /* Build a man's weapons from his loadout: the primary he carries out, and a sidearm holstered
     (hidden, ready for `BattleWeapons.equip`). Both are the side's own weapon for the kind. */
  function dealLoadout(scene, socket, role, faction) {
    var l = loadoutFor(role, faction),
      W = root.BattleWeapons,
      out = { weapon: W.attachWeapon(scene, socket, l.primary), secondary: null };
    if (l.secondary) {
      out.secondary = W.attachWeapon(scene, socket, l.secondary);
      W.holster(out.secondary);
    }
    return out;
  }
  /* A man who left his weapons behind is issued the loadout of his role again (the same deal as at spawn): a fled man
     at base. Returns false for one who still carries a weapon. Presentation draws what he now holds. */
  function rearm(soldier, scene, battle) {
    var W = root.BattleWeapons;
    if (!soldier || soldier.dead || soldier.weapon || !W) return false;
    var deal = dealLoadout(scene, soldier.weaponSocket || null, soldier.role, soldier.faction);
    if (W.issue) {
      W.issue(deal.weapon, soldier.faction);
      if (deal.secondary) W.issue(deal.secondary, soldier.faction);
    }
    if (!W.arm(soldier, deal.weapon, deal.secondary)) return false;
    if (root.BattleAmmunition && root.BattleAmmunition.initialize) root.BattleAmmunition.initialize(soldier, battle);
    return true;
  }
  var COMPOSITION = [
    'sergeant',
    'gunner',
    'scout',
    'scout',
    'rifleman',
    'rifleman',
    'rifleman',
    'rifleman',
    'rifleman',
    'rifleman'
  ];

  var RETREAT_CASUALTY_FRAC = 0.6,
    GUNNER_SETUP_TIME = 1.4,
    SUPPRESSION_TIME = 1.3,
    LOS_SAMPLES = 8;
  /* Fallback movement only (no Movement Resolver): hold a destination briefly before re-pathing. */
  var DESTINATION_COMMIT = 1.35;
  var EYE_HEIGHT = 1.55,
    EYE_HEIGHT_CROUCH = 1.05,
    EYE_HEIGHT_PRONE = 0.42;
  /* Perception cadence. Staggering the sweeps keeps a 100-man field cheap and stops a whole
     squad from acquiring the same target on the same frame. */
  var SCAN_INTERVAL = 0.3,
    TRACK_MARGIN = 1.15;
  /* How much of a man each stance leaves visible. A low, still silhouette should matter without
     making prone infantry magically disappear: the shipping curve is the midpoint between the old
     72/45% values and the proposed 50/25% ambush curve. Movement gives some of the concealment back.
     ?stanceVis=0 restores the pre-2026-10-01 values for paired A/B work. */
  var STANCE_VIS_ON = !(typeof location !== 'undefined' && /[?&]stanceVis=0\b/.test(location.search || ''));
  var VISIBILITY = STANCE_VIS_ON
      ? { stand: 1, crouch: 0.6, prone: 0.35 }
      : { stand: 1, crouch: 0.72, prone: 0.45 },
    MOVING_VISIBILITY_BONUS = STANCE_VIS_ON ? 0.18 : 0.22;
  /* View cone. A man spots at full range inside FOCUS_HALF of where he is looking, at a fraction of
     it in his peripheral vision (more if the enemy is moving, which is what catches the eye), and
     behind him only a man right on top of him. He looks where his body faces, or, when his squad
     knows where the enemy is and that is within HEAD_TURN of his body, that way. Tracking a man he
     already has is not cone-limited: he is looking at him. */
  var FOCUS_HALF = Math.PI / 3, // 60 deg: a 120 deg cone
    PERIPHERAL_HALF = (100 * Math.PI) / 180,
    PERIPHERAL_RANGE = 0.35,
    PERIPHERAL_MOVING = 0.55,
    BEHIND_RANGE = 10,
    HEAD_TURN = (70 * Math.PI) / 180;
  /* Word of the enemy that does not come through a man's own eyes. Gunfire: an enemy trigger pull
     within HEAR_RANGE of a squad that knows of nobody tells it roughly where the shooter is (the
     error grows with distance: HEAR_ERROR of the range). Relay: a squad whose men can see the enemy
     passes it to a friendly squad within RELAY_RANGE that cannot. Only first-hand sightings are
     relayed, and a relayed contact keeps the sighting's age, so word never outlives the sighting. */
  var HEAR_RANGE = 120,
    HEAR_MEMORY = 1.5,
    HEAR_ERROR = 0.08,
    RELAY_RANGE = 50;
  /* `?perception=0`: the perception before PR #55, for A/B benchmarks only (the scout-balance
     question: the FG 42 and the view cones shipped together). No view cone, no sector scan, nothing
     heard or relayed: a man sees every enemy in range and line of sight, whichever way he faces. */
  var PERCEPTION_ON = !(typeof location !== 'undefined' && /[?&]perception=0\b/.test(location.search || ''));
  /* How long a squad keeps acting on a last-known enemy position after nobody can see him. */
  var CONTACT_MEMORY = 12;
  /* Suppressing fire lands in a cone, not on a point: the further out, the looser the group. */
  var AREA_SPREAD_MIN = 3,
    AREA_SPREAD_PER_M = 0.05,
    AREA_SPREAD_MAX = 12,
    AREA_FIRE_RATE = 1.55,
    AREA_AIM_HEIGHT = 0.85;

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }
  function dist2(ax, az, bx, bz) {
    var dx = ax - bx,
      dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }
  function rand(battle) {
    return battle && battle.random ? battle.random() : Math.random();
  }
  function field() {
    return root.BattleObstacleField;
  }
  function stanceOf(s) {
    return s.prone ? 'prone' : s.crouching || s.tacticalCrouch ? 'crouch' : 'stand';
  }
  function eyeHeight(s) {
    return s.prone ? EYE_HEIGHT_PRONE : s.crouching ? EYE_HEIGHT_CROUCH : EYE_HEIGHT;
  }

  /* Legacy height-blind circle test, kept as the fallback for callers that run without the
     obstacle field (old saved scenarios, unit tests, trimmed deployments). */
  function segmentHitsObstacle(ax, az, bx, bz, ob) {
    var dx = bx - ax,
      dz = bz - az,
      len2 = dx * dx + dz * dz;
    var t = len2 > 1e-6 ? ((ob.x - ax) * dx + (ob.z - az) * dz) / len2 : 0;
    t = clamp(t, 0, 1);
    var px = ax + dx * t,
      pz = az + dz * t,
      ddx = px - ob.x,
      ddz = pz - ob.z;
    return ddx * ddx + ddz * ddz <= ob.radius * ob.radius;
  }
  function obstacleBlocks(ax, az, bx, bz, obstacles) {
    if (!obstacles) return false;
    for (var i = 0; i < obstacles.length; i++)
      if (segmentHitsObstacle(ax, az, bx, bz, obstacles[i])) return true;
    return false;
  }

  function coverMultiplierAt(x, z, obstacles, stance) {
    var F = field();
    if (F) return F.coverAt(obstacles, x, z, stance || 'stand');
    if (!obstacles) return 1;
    var best = 1;
    for (var i = 0; i < obstacles.length; i++) {
      var ob = obstacles[i],
        dx = x - ob.x,
        dz = z - ob.z,
        r = ob.radius + 1.4;
      if (dx * dx + dz * dz <= r * r && ob.cover < best) best = ob.cover;
    }
    return best;
  }
  function coverPotentialAt(x, z, obstacles) {
    var F = field();
    return F ? F.coverPotentialAt(obstacles, x, z) : coverMultiplierAt(x, z, obstacles, 'prone');
  }

  function hasLineOfSight(a, b, heightAt, obstacles) {
    var ax = a.root.position.x,
      az = a.root.position.z,
      ay = heightAt(ax, az) + eyeHeight(a);
    var bx = b.root.position.x,
      bz = b.root.position.z,
      by = heightAt(bx, bz) + eyeHeight(b);
    var F = field();
    if (F) {
      if (F.sightBlocked(obstacles, { x: ax, z: az, y: ay }, { x: bx, z: bz, y: by })) return false;
    } else if (obstacleBlocks(ax, az, bx, bz, obstacles)) return false;
    if (
      root.BattleNavigation &&
      root.BattleNavigation.lineOfSightBlocked({ x: ax, z: az }, { x: bx, z: bz }, ay, by)
    )
      return false;
    for (var i = 1; i < LOS_SAMPLES; i++) {
      var t = i / LOS_SAMPLES,
        x = ax + (bx - ax) * t,
        z = az + (bz - az) * t;
      var lineY = ay + (by - ay) * t,
        groundY = heightAt(x, z);
      if (groundY > lineY - 0.15) return false;
    }
    return true;
  }

  /* Effective spotting range against one particular man in one particular stance. */
  function detectionRange(observerRole, target) {
    var mult = VISIBILITY[stanceOf(target)] || 1;
    if (target.moving) mult += MOVING_VISIBILITY_BONUS;
    return observerRole.visionRange * clamp(mult, 0.3, 1.25);
  }
  /* Range first, sight second: sorting the in-range enemies by distance and stopping at the first
     visible one turns a full O(enemies) sight sweep into one or two sight tests, which matters now
     that sight tests consult a few thousand obstacles. */
  var scanBuffer = [];
  function angleBetween(a, b) {
    var diff = a - b;
    return Math.abs(Math.atan2(Math.sin(diff), Math.cos(diff)));
  }
  /* A man holding still with no known threat scans his sector: his head sweeps SCAN_SWEEP either side
     of where his body faces and back every SCAN_PERIOD seconds, each man on his own phase so a
     line of them covers the arc between them. The sweep stays inside FOCUS_HALF, so his front is
     always in focus and the scan only widens what he sees (full range out to ±100°); a 70° sweep
     looked away from the enemy straight ahead (run.js seeds 6 and 23 lost their first target). A
     man on the move looks where he is going. The clock is sim time and his id, never the combat RNG. */
  var SCAN_SWEEP = (40 * Math.PI) / 180,
    SCAN_PERIOD = 8;
  function scanOffset(soldier, battle) {
    var u = ((battle.time || 0) / SCAN_PERIOD + (((+soldier.id || 0) * 0.618) % 1)) % 1,
      tri = u < 0.5 ? 4 * u - 1 : 3 - 4 * u;
    return SCAN_SWEEP * tri;
  }
  /* Where the man is looking: his body's facing, or the squad's known threat if a head turn reaches it;
     with no known threat and standing still, his scan across the sector. */
  function reactionState(soldier) {
    var E = root.BattleEngagement;
    return E && E.reactionState ? E.reactionState(soldier) : null;
  }
  /* Perception-owned, read-only disposition. "Visible non-threat" is deliberately different from
     invisible/dead: a dazed, fleeing or explicitly non-combatant person still exists in the scene and
     can be seen, but must not become a combat target, shared threat, suppression victim or tactical
     threat reference. This is the soldier contract today and the civilian hook later. */
  function disposition(kind, visible, combatThreat, reason) {
    var d = { kind: kind, visible: visible, combatThreat: combatThreat, reason: reason };
    return typeof Object.freeze === 'function' ? Object.freeze(d) : d;
  }
  var THREAT_ACTIVE = disposition('active-threat', true, true, 'combatant'),
    THREAT_RAGE = disposition('active-threat', true, true, 'rage'),
    THREAT_FREEZE = disposition('visible-non-threat', true, false, 'freeze'),
    THREAT_FLEE = disposition('visible-non-threat', true, false, 'flee'),
    THREAT_DECLARED_NONCOMBATANT = disposition('visible-non-threat', true, false, 'declared-non-threat'),
    THREAT_DEAD = disposition('inactive', false, false, 'dead'),
    THREAT_MISSING = disposition('inactive', false, false, 'missing');
  function threatDisposition(unit) {
    if (!unit) return THREAT_MISSING;
    if (unit.dead) return THREAT_DEAD;
    if (unit.combatThreat === false || unit.combatant === false) return THREAT_DECLARED_NONCOMBATANT;
    var r = reactionState(unit);
    if (r === 'freeze') return THREAT_FREEZE;
    if (r === 'flee') return THREAT_FLEE;
    return r === 'rage' ? THREAT_RAGE : THREAT_ACTIVE;
  }
  function lookYaw(soldier, battle) {
    var body = soldier.root.rotation.y || 0;
    if (reactionState(soldier) === 'freeze') return body;
    var c = battle && squadContact(soldier.squad, battle),
      p = soldier.root.position;
    if (!c) return battle && !soldier.moving ? body + scanOffset(soldier, battle) : body;
    var toThreat = Math.atan2(c.x - p.x, c.z - p.z);
    return angleBetween(toThreat, body) <= HEAD_TURN ? toThreat : body;
  }
  /* The share of his spotting range a man has in that direction (1 in his focus). */
  function viewReach(off, target) {
    if (off <= FOCUS_HALF) return 1;
    if (off <= PERIPHERAL_HALF) return target.moving ? PERIPHERAL_MOVING : PERIPHERAL_RANGE;
    return 0;
  }
  /* His awareness (module 10, BattleSoldierStats) stretches or shortens how far he spots: 1 for an average
     man, and when the module is absent or that lever is off. */
  function sightScale(soldier) {
    var stats = root.BattleSoldierStats;
    return stats ? stats.scale(soldier, 'sight') : 1;
  }
  function findTarget(soldier, enemies, heightAt, obstacles, battle) {
    var role = ROLES[soldier.role],
      p = soldier.root.position,
      look = lookYaw(soldier, battle),
      sight = sightScale(soldier),
      i;
    scanBuffer.length = 0;
    for (i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!threatDisposition(e).combatThreat) continue;
      var ex = e.root.position.x,
        ez = e.root.position.z,
        d = dist2(p.x, p.z, ex, ez);
      if (d > detectionRange(role, e) * sight) continue;
      if (PERCEPTION_ON && d > BEHIND_RANGE) {
        var reach = viewReach(angleBetween(Math.atan2(ex - p.x, ez - p.z), look), e);
        if (!reach || d > detectionRange(role, e) * reach * sight) continue;
      }
      scanBuffer.push({ unit: e, d: d });
    }
    scanBuffer.sort(function (a, b) {
      return a.d - b.d;
    });
    for (i = 0; i < scanBuffer.length; i++)
      if (hasLineOfSight(soldier, scanBuffer[i].unit, heightAt, obstacles)) return scanBuffer[i].unit;
    return null;
  }
  /* Eyes already on a man stay on him past the point where he could have been spotted cold. */
  function stillTracking(soldier, heightAt, obstacles) {
    var t = soldier.target;
    if (!threatDisposition(t).combatThreat) return false;
    var role = ROLES[soldier.role],
      p = soldier.root.position;
    if (dist2(p.x, p.z, t.root.position.x, t.root.position.z) > role.visionRange * TRACK_MARGIN * sightScale(soldier))
      return false;
    return hasLineOfSight(soldier, t, heightAt, obstacles);
  }

  /* Shared contact.
     Men used to acquire targets entirely on their own, so a squad had no collective idea where the
     enemy was: the moment a man lost line of sight he held his own last-seen point and everyone
     else carried on as if nothing had happened. One record per squad, written by whoever can
     currently see the enemy, gives the other nine a direction to face, a position to put fire on,
     and a reason to be already looking the right way when their own turn comes. */
  /* The record is the NEAREST enemy the squad currently knows about, not whichever man happened to
     write last. A scout's eyes reach 175 m and routinely mark someone a rifleman cannot even shoot
     at, so last-writer-wins pointed the whole squad at the furthest contact. Fresh news still
     always gets in: an entry older than CONTACT_REFRESH is replaced regardless of distance. */
  var CONTACT_REFRESH = 2;
  function shareContact(soldier, battle) {
    var sq = soldier.squad,
      t = soldier.target;
    if (!sq || !threatDisposition(t).combatThreat) return null;
    var p = t.root.position,
      anchor = sq.orderAnchor || sq.rally || p,
      held = sq.contact;
    /* Heard or relayed word gives way to the squad's own eyes. */
    if (
      held &&
      threatDisposition(held.unit).combatThreat &&
      !held.heard &&
      !held.relayedFrom &&
      battle.time - held.at <= CONTACT_REFRESH &&
      held.unit !== t &&
      dist2(anchor.x, anchor.z, held.x, held.z) <= dist2(anchor.x, anchor.z, p.x, p.z)
    )
      return held;
    sq.contact = { unit: t, x: p.x, z: p.z, at: battle.time, seenBy: soldier.id, stance: stanceOf(t) };
    return sq.contact;
  }
  /* A trigger pull is heard: one report per pull, kept HEAR_MEMORY seconds. */
  function reportGunfire(shooter, battle) {
    var list = battle._gunfire || (battle._gunfire = []),
      p = shooter.root.position;
    list.push({ x: p.x, z: p.z, faction: shooter.faction, unit: shooter, at: battle.time });
  }
  function squadCentre(sq, battle) {
    if (sq._centreAt === battle.time) return sq._centre;
    var x = 0,
      z = 0,
      n = 0;
    for (var i = 0; i < sq.members.length; i++) {
      var s = sq.members[i];
      if (s.dead) continue;
      x += s.root.position.x;
      z += s.root.position.z;
      n++;
    }
    sq._centreAt = battle.time;
    sq._centre = n ? { x: x / n, z: z / n } : null;
    return sq._centre;
  }
  function firstHand(c, battle) {
    return !!(
      c &&
      threatDisposition(c.unit).combatThreat &&
      !c.heard &&
      !c.relayedFrom &&
      battle.time - c.at <= CONTACT_REFRESH
    );
  }
  /* What a squad learns without its own eyes: word from a neighbour squad within RELAY_RANGE that
     can see the enemy, else enemy gunfire within HEAR_RANGE. Once per squad per tick, and only
     while it has no current sighting of its own; neither ever replaces one. */
  function squadSenses(sq, battle) {
    if (!PERCEPTION_ON || !sq || sq._sensedAt === battle.time) return;
    sq._sensedAt = battle.time;
    var held = squadContact(sq, battle);
    if (firstHand(held, battle)) return;
    var here = squadCentre(sq, battle);
    if (!here) return;
    var side = battle.factions && battle.factions[sq.faction],
      squads = (side && side.squads) || [],
      best = null,
      bestD = RELAY_RANGE,
      i;
    for (i = 0; i < squads.length; i++) {
      var o = squads[i];
      if (o === sq || o.disbanded || !firstHand(o.contact, battle)) continue;
      var there = squadCentre(o, battle),
        d = there ? dist2(here.x, here.z, there.x, there.z) : Infinity;
      if (d <= bestD) {
        bestD = d;
        best = o;
      }
    }
    if (best && (!held || held.heard || best.contact.at > held.at)) {
      var c = best.contact;
      sq.contact = { unit: c.unit, x: c.x, z: c.z, at: c.at, seenBy: null, stance: c.stance, relayedFrom: best.id };
      return;
    }
    if (held && !held.heard) return;
    var shots = battle._gunfire;
    if (!shots || !shots.length) return;
    if (battle._gunfirePrunedAt !== battle.time) {
      battle._gunfirePrunedAt = battle.time;
      var keep = 0;
      for (i = 0; i < shots.length; i++) if (battle.time - shots[i].at <= HEAR_MEMORY) shots[keep++] = shots[i];
      shots.length = keep;
    }
    var heard = null,
      heardD = HEAR_RANGE;
    for (i = 0; i < shots.length; i++) {
      var s = shots[i];
      if (s.faction === sq.faction || !threatDisposition(s.unit).combatThreat) continue;
      var ds = dist2(here.x, here.z, s.x, s.z);
      if (ds <= heardD) {
        heardD = ds;
        heard = s;
      }
    }
    if (!heard || (held && held.at >= heard.at)) return;
    /* Deterministic, not the combat RNG: the error's direction comes from who fired and when. */
    var k = (((+heard.unit.id || 0) * 73856093) ^ Math.floor(heard.at * 7)) >>> 0,
      ang = ((k % 360) * Math.PI) / 180,
      err = heardD * HEAR_ERROR * (0.5 + ((k >>> 9) % 50) / 100);
    sq.contact = {
      unit: heard.unit,
      x: heard.x + Math.sin(ang) * err,
      z: heard.z + Math.cos(ang) * err,
      at: heard.at,
      seenBy: null,
      stance: stanceOf(heard.unit),
      heard: true
    };
  }
  function squadContact(squad, battle) {
    var c = squad && squad.contact;
    if (!c) return null;
    /* Intel expires. Dropping the one man the squad had eyes on decays it faster - the reason for
       the record is gone - but it does NOT erase it: there are usually nine more enemies right
       there, and wiping the squad's whole picture because it scored a hit left it blind at exactly
       the moment it was winning. Any new sighting overwrites the record anyway. */
    /* A living person who ceases to be a combat threat remains visible in the world, but the squad's
       threat contact is no longer about him. Dead contacts keep the old short decay so nearby enemies
       are not erased from the squad picture by one kill. */
    if (c.unit && threatDisposition(c.unit).kind === 'visible-non-threat') {
      squad.contact = null;
      return null;
    }
    var limit = c.unit && c.unit.dead ? CONTACT_MEMORY / 3 : CONTACT_MEMORY;
    if (battle.time - c.at > limit) {
      squad.contact = null;
      return null;
    }
    return c;
  }

  /* Suppressing fire at a POSITION rather than at a man.
     Deliberately deals no damage: the shooter has no line of sight to a body, so a round that
     would have hit is stopped by whatever is hiding him. What it does do is pin whoever is there,
     which is the whole tactical point - it is what makes a bound survivable and what stops a
     squad falling silent the instant line of sight breaks. No damage also means it can never be
     used to farm kills through cover. */
  /* Can this man put rounds on that spot at all - in range, and with something other than a hill
     in the way? Asked during suppression assignment as well as at the trigger, because a man who
     cannot reach the position should be left to get on with the advance rather than stood in the
     open pointing at something 180 m away. The scout's eyes routinely mark contacts further out
     than a rifle will carry, so this is the common case, not the edge case. */
  function canSuppress(shooter, point, battle) {
    if (!point || !shooter || shooter.dead || !shooter.weapon) return false;
    var stats = shooter.weapon.stats,
      p = shooter.root.position,
      d = dist2(p.x, p.z, point.x, point.z);
    if (d > stats.range * 0.95) return false;
    var eyeY = battle.heightAt(p.x, p.z) + eyeHeight(shooter),
      aimY = battle.heightAt(point.x, point.z) + AREA_AIM_HEIGHT,
      F = field();
    /* The obstacle field lets him shoot at the cover a man is behind without letting him shoot
       through a hill. */
    if (
      F &&
      F.sightBlocked(battle.obstacles, { x: p.x, z: p.z, y: eyeY }, { x: point.x, z: point.z, y: aimY })
    )
      return false;
    if (
      root.BattleNavigation &&
      root.BattleNavigation.lineOfSightBlocked({ x: p.x, z: p.z }, { x: point.x, z: point.z }, eyeY, aimY)
    )
      return false;
    /* Ballistics owns terrain intersection. Suppressive fire used to stop at obstacles and walls
       but never sampled the ground, so rifles could visibly fire through a hill at a remembered contact. */
    var B = root.BattleBallistics;
    if (B && typeof B.pointLineBlocked === 'function' && B.pointLineBlocked(shooter, point, battle, AREA_AIM_HEIGHT)) {
      shooter._terrainBlockedSuppressiveFire = (shooter._terrainBlockedSuppressiveFire || 0) + 1;
      return false;
    }
    return true;
  }
  /* Owned command leases. A lease is a commitment that holds a squad's intent for a while: one
     table per squad (sq._leases) says which commitments are live, who owns each, why it was taken,
     when it lapses and what releases it early, so no hold is an anonymous `...Until` field.
     `until` is an absolute sim time (Infinity while a condition, not the clock, holds it);
     holds() is `t < until`, the same test every migrated timer used.
     Each kind is declared once by its owner (define): its priority (which hold matters most when
     several are live), whether it is a pure timer (nothing reads it once expired, so prune() may end
     it), and an optional read-only progress test answering "is this hold getting anywhere?". */
  var LEASE_LOG = 8,
    LEASE_KINDS = {};
  function leaseTable(sq) {
    if (!sq._leases) sq._leases = { live: {}, ended: [] };
    return sq._leases;
  }
  var Leases = {
    define: function (kind, spec) {
      LEASE_KINDS[kind] = { priority: +spec.priority || 0, timer: !!spec.timer, progress: spec.progress || null, label: spec.label || kind };
    },
    kinds: function () {
      return LEASE_KINDS;
    },
    grant: function (sq, kind, owner, since, until, reason, release, data) {
      var l = { kind: kind, owner: owner, since: since, until: until, reason: reason || kind, release: release || 'expiry' };
      if (data) l.data = data;
      leaseTable(sq).live[kind] = l;
      return l;
    },
    /* Push an existing lease's expiry out (never in); grants it if absent. */
    extend: function (sq, kind, owner, since, until, reason, release) {
      var l = sq && sq._leases && sq._leases.live[kind];
      if (!l) return Leases.grant(sq, kind, owner, since, until, reason, release);
      if (until > l.until) {
        l.until = until;
        if (reason) l.reason = reason;
      }
      return l;
    },
    get: function (sq, kind) {
      return (sq && sq._leases && sq._leases.live[kind]) || null;
    },
    holds: function (sq, kind, t) {
      var l = sq && sq._leases && sq._leases.live[kind];
      return !!l && t < l.until;
    },
    until: function (sq, kind) {
      var l = sq && sq._leases && sq._leases.live[kind];
      return l ? l.until : 0;
    },
    end: function (sq, kind, t, why) {
      var table = sq && sq._leases,
        l = table && table.live[kind];
      if (!l) return null;
      delete table.live[kind];
      l.endedAt = t;
      l.endReason = why || 'released';
      table.ended.push(l);
      if (table.ended.length > LEASE_LOG) table.ended.shift();
      return l;
    },
    clear: function (sq) {
      if (sq) sq._leases = { live: {}, ended: [] };
    },
    /* End pure-timer leases whose time has run out, logged as 'expired' at their expiry time.
       Leases whose expired record still means something (a used objective-security window, a
       succession that is due, a regroup released by its own age test) are never pruned. */
    prune: function (sq, t) {
      var live = sq && sq._leases && sq._leases.live;
      if (!live) return 0;
      var n = 0;
      Object.keys(live).forEach(function (kind) {
        var def = LEASE_KINDS[kind],
          l = live[kind];
        if (def && def.timer && t >= l.until) {
          Leases.end(sq, kind, l.until, 'expired');
          n++;
        }
      });
      return n;
    },
    /* Live leases at time t, highest priority first, for diagnostics and the operator view. */
    active: function (sq, t) {
      var live = (sq && sq._leases && sq._leases.live) || {},
        out = [];
      Object.keys(live).forEach(function (kind) {
        var l = live[kind],
          def = LEASE_KINDS[kind] || {},
          progress = null;
        if (!(t < l.until)) return;
        if (def.progress) {
          try {
            progress = def.progress(sq, l, t);
          } catch (_) {
            progress = null;
          }
        }
        out.push({
          kind: l.kind,
          owner: l.owner,
          priority: def.priority || 0,
          reason: l.reason,
          release: l.release,
          since: l.since,
          remaining: isFinite(l.until) ? +(l.until - t).toFixed(2) : null,
          progress: progress
        });
      });
      out.sort(function (a, b) {
        return b.priority - a.priority || (a.kind < b.kind ? -1 : 1);
      });
      return out;
    },
    /* The live lease that matters most right now, or null. */
    top: function (sq, t) {
      return Leases.active(sq, t)[0] || null;
    }
  };

  /* Declared extension points. A module attaches to a named slot instead of replacing a SquadAI
     function, and the owner fixes the order each slot runs in, so the pipeline reads here rather
     than from whichever file happened to load last. */
  function extensionPoints(order) {
    var slots = {};
    Object.keys(order).forEach(function (stage) {
      slots[stage] = [];
    });
    return {
      order: order,
      attach: function (stage, id, fn) {
        var ids = order[stage],
          at = ids ? ids.indexOf(id) : -1;
        if (at < 0) throw new Error('Extension ' + id + ' is not declared for ' + stage);
        slots[stage][at] = fn;
      },
      /* Gates: any extension returning false vetoes the action. */
      pass: function (stage, a, b, c) {
        var fns = slots[stage];
        for (var i = 0; i < fns.length; i++) if (fns[i] && fns[i](a, b, c) === false) return false;
        return true;
      },
      run: function (stage, a, b, c) {
        var fns = slots[stage];
        for (var i = 0; i < fns.length; i++) if (fns[i]) fns[i](a, b, c);
      },
      /* Replaceable models: the first attached extension decides; otherwise the owner's default. */
      first: function (stage, fallback) {
        var fns = slots[stage];
        for (var i = 0; i < fns.length; i++) if (fns[i]) return fns[i];
        return fallback;
      }
    };
  }
  var EXT = extensionPoints({
    fireGate: ['ammunition', 'ballistics', 'direct-fire-los'], // before an aimed shot: weapon ready, target in range, trigger-time LOS
    shotModel: ['ballistics'], // where an aimed round goes (default: resolveFire accuracy roll)
    woundModel: ['wounds'], // what a round that struck a man does to him (default: flat hp damage)
    areaFireGate: ['ammunition'], // before a suppressive shot
    roundGate: ['ammunition'], // before each further round of an automatic burst: still loaded, not stopped
    afterShot: ['ammunition'], // a round left the weapon: ammo, heat, stoppages
    squadCommand: ['squad-leader'], // the squad's command owner; without one a squad only reports status
    beforeSoldier: ['soldier-mind', 'sidearm', 'weapon-cycle'], // each soldier AI tick, before perception
    afterSoldier: ['weapon-cycle'], // after engagement and movement resolution
    aimedAt: ['soldier-events'] // a trigger pull had this man as its target: (victim, battle, {from, rounds, d})
  });

  /* One trigger pull. Semi-automatic and bolt-action weapons fire one round; an automatic weapon
     fires a burst at its cyclic rate. The AI ticks every 0.15 s, far slower than an MG42 cycles
     (0.05 s a round), so the whole burst is resolved on this tick and each round carries its
     offset in seconds for presentation to play it at the cyclic rate. */
  /* An automatic fires bursts; one with a selector (`autoWithin`, the FG 42) only inside that
     distance, and single aimed rounds beyond it. */
  function automatic(stats, d) {
    return stats.cyclic > 0 && !!stats.burst && !(stats.autoWithin > 0 && d > stats.autoWithin);
  }
  function burstLength(stats, battle, d) {
    if (!automatic(stats, d)) return 1;
    var lo = Math.max(1, stats.burst[0] | 0),
      hi = Math.max(lo, stats.burst[1] | 0);
    return lo + Math.floor(rand(battle) * (hi - lo + 1));
  }
  /* Seconds until the next trigger pull: the burst itself plus the pause to re-lay the gun, or the
     aimed rate of a semi-automatic weapon. */
  function triggerCooldown(stats, rounds, battle, factor, d) {
    var jitter = 0.85 + rand(battle) * 0.3;
    if (automatic(stats, d))
      return rounds / stats.cyclic + (stats.burstPause || 0.8) * factor * jitter;
    return (1 / stats.rof) * factor * jitter;
  }
  /* Fires the rounds of one trigger pull through fire(round, delay); stops early if the weapon
     runs dry or stops, or fire() returns false. Returns the rounds that left the weapon. */
  function discharge(shooter, battle, rounds, fire) {
    var stats = shooter.weapon.stats,
      fired = 0;
    for (var i = 0; i < rounds; i++) {
      if (i && !EXT.pass('roundGate', shooter, battle)) break;
      var delay = stats.cyclic > 0 ? i / stats.cyclic : 0;
      if (fire(i, delay) === false) break;
      if (!fired) reportGunfire(shooter, battle);
      fired++;
      battle.onFire && battle.onFire(shooter, delay);
      EXT.run('afterShot', shooter, battle);
    }
    return fired;
  }

  /* The one writer of `suppressedUntil`, until when a man is pinned by fire (Engagement's `pinned` state and
     the mind read it). Everything that pins a man comes through here: area fire on his position, a
     suppressive round passing him (14-z) and a wound that did not drop him (14-wound-model). `seconds` is
     the hold for an average man; a hold only ever extends. (Not BattleEngagement.suppress, which is a
     soldier firing suppressive bursts.) */
  function pin(target, battle, seconds) {
    /* His fortitude decides how long it holds him (BattleSoldierStats, 1 for an average man or with it off). */
    var stats = root.BattleSoldierStats;
    if (stats) seconds *= stats.scale(target, 'hold');
    target.suppressedUntil = Math.max(target.suppressedUntil || 0, battle.time + seconds);
    // The queue carries what this writer computed (the hold after the fortitude scale), never a recomputation.
    if (root.BattleSoldierEvents)
      root.BattleSoldierEvents.post(target, battle, 'suppressed', {
        until: target.suppressedUntil,
        seconds: seconds
      });
  }

  function areaFire(shooter, point, battle) {
    if (!EXT.pass('areaFireGate', shooter, battle, point)) return 0;
    if (shooter.fireCooldown > 0 || !canSuppress(shooter, point, battle)) return 0;
    var stats = shooter.weapon.stats,
      p = shooter.root.position,
      d = dist2(p.x, p.z, point.x, point.z);
    var spread = clamp(AREA_SPREAD_MIN + d * AREA_SPREAD_PER_M, AREA_SPREAD_MIN, AREA_SPREAD_MAX);
    var enemies = battle.rosterOf(shooter.faction === 'us' ? 'ge' : 'us'),
      hold = SUPPRESSION_TIME * (stats.suppressive ? 1.25 : 0.85),
      hit = 0;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!threatDisposition(e).combatThreat) continue;
      if (dist2(e.root.position.x, e.root.position.z, point.x, point.z) > spread) continue;
      pin(e, battle, hold);
      hit++;
    }
    var rounds = discharge(shooter, battle, burstLength(stats, battle, d), function () {});
    shooter.fireCooldown = triggerCooldown(stats, rounds, battle, AREA_FIRE_RATE, d);
    battle.onSuppressiveShot && battle.onSuppressiveShot(shooter, point, hit, rounds);
    return hit;
  }

  function resolveFire(shooter, target, battle) {
    var stats = shooter.weapon.stats,
      d = dist2(
        shooter.root.position.x,
        shooter.root.position.z,
        target.root.position.x,
        target.root.position.z
      );
    if (d > stats.range) return null;
    var falloff =
      d <= stats.falloffStart
        ? 1
        : Math.max(0.15, 1 - (d - stats.falloffStart) / Math.max(1, stats.range - stats.falloffStart));
    var acc = stats.accuracy * falloff * (shooter.squad.accuracyMultiplier || 1);
    if (target.prone) acc *= 0.34;
    else if (target.crouching) acc *= 0.6;
    if (target.suppressedUntil > battle.time) acc *= 0.55;
    if (isMachineGun(shooter) && shooter.setUp) acc *= 1.25;
    if (shooter.prone) acc *= 1.12;
    if (shooter.moving) acc *= 0.82;
    var targetPosition = root.BattleTacticalPositions && root.BattleTacticalPositions.current(target);
    if (targetPosition && targetPosition.occupiedAt != null) acc *= 0.46;
    /* Cover pays off in proportion to how much of the target's silhouette it actually hides. */
    acc *= coverMultiplierAt(
      target.root.position.x,
      target.root.position.z,
      battle.obstacles,
      stanceOf(target)
    );
    acc = clamp(acc, 0.02, 0.95);
    var hit = rand(battle) < acc;
    if (stats.suppressive) pin(target, battle, SUPPRESSION_TIME);
    if (hit) applyHit(shooter, target, battle, null);
    battle.onShot && battle.onShot(shooter, target, hit, d);
    return hit;
  }

  /* A round struck a man. hit carries where, when the shot model knows ({zone, point, direction,
     shape, round, delay}); the wound model decides what it does. Without one, flat damage. */
  function flatDamage(shooter, victim, battle) {
    victim.hp -= shooter.weapon.stats.damage * (0.85 + rand(battle) * 0.3);
    if (victim.hp <= 0) battle.killSoldier(victim, shooter);
    return null;
  }
  function applyHit(shooter, victim, battle, hit) {
    if (!victim || victim.dead) return null;
    return EXT.first('woundModel', flatDamage)(shooter, victim, battle, hit);
  }

  function createSquad(id, faction, homePoint, objective) {
    return {
      id: id,
      faction: faction,
      members: [],
      state: 'advance',
      home: homePoint,
      objective: objective,
      rally: { x: homePoint.x, z: homePoint.z },
      orderAnchor: { x: homePoint.x, z: homePoint.z },
      formation: 'wedge',
      accuracyMultiplier: 1,
      captainAlive: true,
      inContact: false,
      contactCount: 0,
      contactSince: null,
      contact: null,
      suppressorCount: 0,
      _orderGoal: { x: homePoint.x, z: homePoint.z },
      _orderVersion: 0
    };
  }
  /* Command belongs to one man, not to a weapon role. `leaderId` names him once a squad has been
     re-formed; until then the squad is led by its living `sergeant` role, as it was spawned. */
  function leaderOf(squad) {
    var a = (squad && squad.members) || [],
      i;
    if (squad && squad.leaderId != null) {
      for (i = 0; i < a.length; i++) if (a[i] && a[i].id === squad.leaderId && !a[i].dead) return a[i];
      return null;
    }
    for (i = 0; i < a.length; i++) if (a[i] && !a[i].dead && a[i].role === 'sergeant') return a[i];
    return null;
  }
  /* Seniority when command has to pass to someone else: a sergeant (a former squad leader), then a
     rifleman, then a scout; the gunner stays on the gun unless nobody else is left. Ties go to the lowest
     soldier id, so a replay promotes the same man. Used by succession (16-squad-plan-stability.js) and
     reconstitution (commander-ai.js). */
  var SENIORITY = { sergeant: 0, rifleman: 1, scout: 2, gunner: 9 };
  function seniority(soldier) {
    return soldier.role in SENIORITY ? SENIORITY[soldier.role] : 3;
  }
  function mostSenior(men) {
    var best = null;
    for (var i = 0; i < men.length; i++) {
      var s = men[i];
      if (!s || s.dead) continue;
      if (!best || seniority(s) < seniority(best) || (seniority(s) === seniority(best) && s.id < best.id))
        best = s;
    }
    return best;
  }
  function isLeader(soldier) {
    return !!(soldier && soldier.squad && leaderOf(soldier.squad) === soldier);
  }
  /* Casualties are measured against the squad's full strength, not its member list: a re-formed squad
     carries only its living men. */
  function establishment(squad) {
    return +squad.establishment || squad.members.length;
  }
  /* Where a retreating squad walks: home, or the rally point of the reconstitution brief once its
     Squad Leader has brought it home safely (`_assembly`, 16-squad-plan-stability.js). */
  function retreatGoal(squad) {
    var a = squad._assembly,
      m = squad._macroMission;
    return a && a.phase === 'to-rally' && m && m.version === a.missionVersion && m.point
      ? m.point
      : squad.home;
  }
  function formationDirection(squad) {
    var anchor = squad.orderAnchor || squad.rally,
      goal = squad.state === 'retreat' ? retreatGoal(squad) : squad.objective || squad.home,
      dx = goal.x - anchor.x,
      dz = goal.z - anchor.z,
      len = Math.hypot(dx, dz);
    if (len < 0.1 && squad._formationForward) {
      return squad._formationForward;
    }
    var forward = { x: dx / (len || 1), z: dz / (len || 1) };
    squad._formationForward = forward;
    return forward;
  }
  function formationFor(squad) {
    var phase = squad.commandPhase || '';
    if (
      squad.state === 'retreat' ||
      phase === 'corner-check' ||
      phase === 'clear-town' ||
      phase === 'regroup'
    )
      return 'column';
    if (squad.state === 'engaged' || ['assault', 'capture', 'defend'].indexOf(phase) >= 0)
      return 'line';
    var anchor = squad.orderAnchor || squad.rally,
      goal = squad.objective || squad.home;
    return dist2(anchor.x, anchor.z, goal.x, goal.z) < 68 ? 'line' : 'wedge';
  }
  function slotJitter(soldier, axis) {
    var n = (soldier.slotIndex * 37 + String(soldier.id).length * 19 + (axis ? 11 : 3)) % 17;
    return (n - 8) * 0.22;
  }
  function formationSlot(squad, soldier, slotIndex) {
    var f = formationDirection(squad),
      fx = f.x,
      fz = f.z,
      rx = -fz,
      rz = fx,
      anchor = squad.orderAnchor || squad.rally,
      form = squad.formation || formationFor(squad),
      role = isLeader(soldier)
        ? 'sergeant'
        : soldier.slotRole || (soldier.role === 'sergeant' ? 'rifleman' : soldier.role),
      side = slotIndex % 2 === 0 ? 1 : -1,
      lateral = slotJitter(soldier, 0),
      depth = slotJitter(soldier, 1),
      forward = 0;
    if (form === 'column') {
      if (role === 'sergeant') {
        forward = -1;
        lateral = 0;
      } else if (role === 'scout') {
        forward = 5 + (slotIndex % 2) * 3;
        lateral = side * 2.4 + lateral;
      } else if (role === 'gunner') {
        forward = -5;
        lateral = 1.5 + lateral;
      } else {
        forward = -3 - (slotIndex - 4) * 2.7;
        lateral = side * (1.8 + (slotIndex % 3) * 0.8) + lateral;
      }
    } else if (form === 'line') {
      if (role === 'sergeant') {
        forward = -7;
        lateral = 0;
      } else if (role === 'gunner') {
        forward = -9;
        lateral = 2 + lateral;
      } else if (role === 'scout') {
        forward = 2;
        lateral = side * 14 + lateral;
      } else {
        var lane = slotIndex - 6;
        forward = -2 - (Math.abs(lane) % 2) * 2 + depth;
        lateral = lane * 5.3 + lateral;
      }
    } else {
      if (role === 'sergeant') {
        forward = -4;
        lateral = 0;
      } else if (role === 'gunner') {
        forward = -10;
        lateral = 1.5 + lateral;
      } else if (role === 'scout') {
        forward = 9;
        lateral = side * 10 + lateral;
      } else {
        var rank = Math.floor((slotIndex - 4) / 2),
          wing = slotIndex % 2 === 0 ? 1 : -1;
        forward = 1 - rank * 4 + depth;
        lateral = wing * (4 + rank * 4.3) + lateral;
      }
    }
    return { x: anchor.x + fx * forward + rx * lateral, z: anchor.z + fz * forward + rz * lateral };
  }

  function createSoldier(opts) {
    var role = ROLES[opts.role];
    /* Each side carries its own weapon for the kind (Garand or Kar98k, M1919A6 or MG42...). */
    if (opts.weapon && root.BattleWeapons && root.BattleWeapons.issue)
      root.BattleWeapons.issue(opts.weapon, opts.faction);
    if (opts.secondary && root.BattleWeapons && root.BattleWeapons.issue)
      root.BattleWeapons.issue(opts.secondary, opts.faction);
    var soldier = Object.assign({}, opts.model, {
      id: opts.id,
      faction: opts.faction,
      role: opts.role,
      squad: opts.squad,
      slotIndex: opts.slotIndex,
      weapon: opts.weapon,
      secondary: opts.secondary || null,
      hp: role.hp,
      maxHp: role.hp,
      state: 'advance',
      target: null,
      destination: { x: opts.model.root.position.x, z: opts.model.root.position.z },
      orderDestination: null,
      _destinationCommitUntil: 0,
      _scanAt: 0,
      fireCooldown: Math.random() * 0.5,
      moving: false,
      prone: false,
      crawling: false,
      tacticalCrouch: false,
      suppressedUntil: 0,
      setUp: false,
      setUpSince: 0,
      speed: role.speed,
      moveSpeed: 0,
      voiceCooldown: Math.random() * 2,
      lastSquadState: 'advance'
    });
    /* Derived, never stored: the stance he shows is the one Engagement committed (`prone`, `tacticalCrouch`).
       It used to be a copy that stepMovement refreshed each frame, so after every AI tick it was a frame
       behind and the pose read a man raised from prone to crouch as standing. Read-only on purpose: a write
       is a second owner of stance and throws. (Defined here, not in the literal above: Object.assign would
       copy the getter's value once as a plain field.) */
    Object.defineProperty(soldier, 'crouching', {
      enumerable: true,
      configurable: true,
      get: function () {
        return !this.prone && !!this.tacticalCrouch;
      }
    });
    return soldier;
  }

  /* Perception owns soldier.target. Other layers that need to end tracking route through this
     accessor instead of writing the field directly. */
  function clearTarget(soldier) {
    if (!soldier) return false;
    soldier.target = null;
    return true;
  }
  /* Player input may point the possessed soldier at a live combat threat, but target ownership
     remains here in Perception/SquadAI rather than creating a second writer in the camera layer. */
  function playerAim(soldier, target) {
    if (!soldier || soldier.dead) return false;
    /* A human player may aim at any living enemy. AI threat-disposition rules (freeze/flee/etc.) are
       Micro decisions and must not decide whether the player's reticle is allowed to select someone. */
    if (!target || target.dead || target.faction === soldier.faction) return clearTarget(soldier);
    soldier.target = target;
    return true;
  }
  /* Legacy target-based player fire remains for callers that supply a target. */
  function playerFire(soldier, battle) {
    if (!soldier || soldier.dead) return false;
    return tryFire(soldier, battle);
  }
  /* Real player trigger: no target lock and no Engagement authorization. The arbitrary crosshair ray
     goes through the shipping ammunition and ballistics owners, so reloads, jams, impacts, wounds,
     penetration, terrain and buildings remain authoritative. */
  function playerFireRay(soldier, aimPoint, battle) {
    if (!soldier || soldier.dead || !soldier.isPlayer || !soldier.weapon || !aimPoint || !battle) return false;
    if (soldier.fireCooldown > 0) return false;
    var A = root.BattleAmmunition;
    if (A && A.available && !A.available(soldier)) {
      if ((+soldier.weapon.ammo || 0) <= 0 && (+soldier.weapon.reserveAmmo || 0) > 0 && A.startReload)
        A.startReload(soldier, battle);
      return false;
    }
    var B = root.BattleBallistics;
    if (!B || typeof B.resolvePlayerRay !== 'function') return false;
    var stats = soldier.weapon.stats,
      p = soldier.root.position,
      d = Math.hypot((+aimPoint.x || 0) - p.x, (+aimPoint.z || 0) - p.z),
      rounds = discharge(soldier, battle, burstLength(stats, battle, d), function (round, delay) {
        return B.resolvePlayerRay(soldier, aimPoint, battle, round, delay) ? undefined : false;
      });
    if (!rounds) return false;
    soldier.fireCooldown = triggerCooldown(stats, rounds, battle, 1, d);
    return true;
  }

  function setDestination(soldier, next, battle, urgent) {
    if (!next) return;
    if (root.BattleMovementResolver)
      return root.BattleMovementResolver.proposeOrder(soldier, next, battle, urgent);
    soldier.orderDestination = { x: next.x, z: next.z };
    var current = soldier.destination,
      atCurrent =
        current && dist2(soldier.root.position.x, soldier.root.position.z, current.x, current.z) < 1.8,
      changed = !current || dist2(current.x, current.z, next.x, next.z) > 2.4;
    if (urgent || atCurrent || (changed && battle.time >= (soldier._destinationCommitUntil || 0))) {
      soldier.destination = { x: next.x, z: next.z };
      soldier._destinationCommitUntil = battle.time + DESTINATION_COMMIT + (soldier.slotIndex % 3) * 0.22;
    }
  }
  /* Squad status only: alive count, retreat/engaged/advance state and the Engagement contact report.
     Orders, fire and movement belong to the squad's command owner (the Squad Leader in
     16-squad-plan-stability.js), which attaches to the squadCommand slot and runs instead. */
  function squadStatus(squad, battle) {
    var alive = 0,
      anyEngaged = false;
    for (var i = 0; i < squad.members.length; i++) {
      if (!squad.members[i].dead) alive++;
      if (threatDisposition(squad.members[i].target).combatThreat) anyEngaged = true;
    }
    squad.aliveCount = alive;
    if (1 - alive / establishment(squad) >= RETREAT_CASUALTY_FRAC) squad.state = 'retreat';
    else squad.state = anyEngaged ? 'engaged' : 'advance';
    if (battle && root.BattleEngagement) root.BattleEngagement.updateSquad(squad, battle);
  }
  function updateSquad(squad, battle) {
    return EXT.first('squadCommand', squadStatus)(squad, battle);
  }

  /* Voice never draws from the combat RNG: whether a callout plays depends on the voice modules and
     the audio manifest, so a random draw here made the same seed simulate a different battle with and
     without voice audio. The 4-9 s cooldown jitter is deterministic per soldier and callout instead. */
  function callout(soldier, battle, type) {
    if (!battle.onCallout || battle.time < (soldier.voiceCooldown || 0)) return;
    var n = (soldier._calloutCount = (soldier._calloutCount || 0) + 1);
    soldier.voiceCooldown = battle.time + 4 + (((+soldier.id || 0) * 37 + n * 11) % 50) / 10;
    battle.onCallout(soldier, type);
  }

  /* Perception only. What the soldier does about what he sees is engagement.js's job. */
  function perceive(soldier, battle) {
    var heightAt = battle.heightAt,
      obstacles = battle.obstacles,
      role = ROLES[soldier.role];
    /* Frozen means dazed, not secretly scanning under the full-body clip. Clear both target and facing
       input here, before the ordinary tracking/acquisition path can refresh squad contact. */
    if (reactionState(soldier) === 'freeze') {
      clearTarget(soldier);
      return role;
    }
    var had = soldier.target;
    if (had && !stillTracking(soldier, heightAt, obstacles)) soldier.target = null;
    if (!soldier.target && battle.time >= (soldier._scanAt || 0)) {
      soldier._scanAt = battle.time + SCAN_INTERVAL + ((+soldier.id || 0) % 5) * 0.04;
      soldier.target = findTarget(
        soldier,
        battle.rosterOf(soldier.faction === 'us' ? 'ge' : 'us'),
        heightAt,
        obstacles,
        battle
      );
    }
    if (soldier.target) shareContact(soldier, battle);
    squadSenses(soldier.squad, battle);
    if (!had && soldier.target) callout(soldier, battle, 'contact');
    if (soldier.lastSquadState !== soldier.squad.state) {
      if (isLeader(soldier))
        callout(
          soldier,
          battle,
          soldier.squad.state === 'retreat'
            ? 'retreat'
            : soldier.squad.state === 'advance'
              ? 'advance'
              : 'engage'
        );
      soldier.lastSquadState = soldier.squad.state;
    }
    return role;
  }

  function updateSoldier(soldier, battle) {
    var resolver = root.BattleMovementResolver;
    /* isPlayer gates the entire soldier Micro branch. Do not run soldier-mind/sidearm before hooks,
       Perception, Engagement, or after hooks while possessed; only resolve the player's physical move. */
    if (soldier && soldier.isPlayer) {
      if (!soldier.dead && resolver) resolver.resolve(soldier, battle);
      return;
    }
    EXT.run('beforeSoldier', soldier, battle);
    if (!soldier.dead) {
      var role = perceive(soldier, battle);
      if (root.BattleEngagement) root.BattleEngagement.updateSoldier(soldier, battle);
      else fallbackBehavior(soldier, battle, role);
      if (resolver) resolver.resolve(soldier, battle);
    }
    EXT.run('afterSoldier', soldier, battle);
  }

  /* Minimal stand-in used only when engagement.js failed to load, so a broken deployment still
     produces soldiers that shoot instead of soldiers that stand still. */
  function fallbackBehavior(soldier, battle, role) {
    if (soldier.squad.state === 'retreat') {
      if (root.BattleTacticalPositions) root.BattleTacticalPositions.release(soldier, battle, 'retreat');
      soldier.prone = false;
      soldier.state = 'retreat';
      setDestination(
        soldier,
        soldier.orderDestination || formationSlot(soldier.squad, soldier, soldier.slotIndex),
        battle,
        true
      );
      if (
        soldier.target &&
        dist2(
          soldier.root.position.x,
          soldier.root.position.z,
          soldier.target.root.position.x,
          soldier.target.root.position.z
        ) < 35
      )
        tryFire(soldier, battle);
      soldier.setUp = false;
      return;
    }
    if (threatDisposition(soldier.target).combatThreat) {
      soldier.state = 'engage';
      var p = soldier.root.position,
        t = soldier.target.root.position,
        d = dist2(p.x, p.z, t.x, t.z);
      soldier.destination = { x: p.x, z: p.z };
      soldier.tacticalCrouch = true;
      soldier.prone =
        (soldier.role === 'rifleman' || soldier.role === 'gunner') &&
        (d > 80 || soldier.suppressedUntil > battle.time);
      if (isMachineGun(soldier)) {
        if (!soldier.setUpSince) soldier.setUpSince = battle.time;
        soldier.setUp = battle.time - soldier.setUpSince > GUNNER_SETUP_TIME;
      }
      if (d <= engageRange(soldier)) tryFire(soldier, battle);
      return;
    }
    soldier.prone = false;
    soldier.tacticalCrouch = false;
    soldier.state = 'advance';
    soldier.setUp = false;
    soldier.setUpSince = 0;
    setDestination(
      soldier,
      soldier.orderDestination || formationSlot(soldier.squad, soldier, soldier.slotIndex),
      battle,
      false
    );
  }

  function shot(shooter, target, battle, round, delay) {
    return EXT.first('shotModel', resolveFire)(shooter, target, battle, round || 0, delay || 0);
  }
  /* How far a man opens aimed fire: as far as the weapon he carries reaches (a US scout's M1 Carbine
     and a German scout's FG 42 share the role, not the range). A role may still cap it where its
     job is not the firefight (`engageRange`, the defending engineer). */
  function engageRange(soldier) {
    var role = ROLES[soldier.role] || {},
      range = soldier.weapon && soldier.weapon.stats && soldier.weapon.stats.range,
      cap = role.engageRange;
    if (!(range > 0)) return cap;
    return cap > 0 ? Math.min(cap, range) : range;
  }
  function tryFire(soldier, battle) {
    if (!soldier.weapon) return false; // no weapon, no shot (he left it behind)
    if (!EXT.pass('fireGate', soldier, battle)) return false;
    if (soldier.fireCooldown > 0) return false;
    var stats = soldier.weapon.stats,
      target = soldier.target,
      playerTarget = !!(soldier.isPlayer && target && !target.dead && target.faction !== soldier.faction);
    /* AI obeys threat disposition; a possessed player may intentionally shoot any living enemy. */
    if (!playerTarget && !threatDisposition(target).combatThreat) {
      clearTarget(soldier);
      return false;
    }
    var p = soldier.root.position,
      d = dist2(p.x, p.z, target.root.position.x, target.root.position.z);
    /* The burst stays on the man it was laid on; once he is down the gunner lets go. */
    var rounds = discharge(soldier, battle, burstLength(stats, battle, d), function (round, delay) {
      if (!(soldier.isPlayer && target && !target.dead) && !threatDisposition(target).combatThreat) return false;
      shot(soldier, target, battle, round, delay);
    });
    soldier.fireCooldown = triggerCooldown(stats, rounds, battle, 1, d);
    /* The man on the receiving end is told after the burst, so nothing here can change what the burst did. */
    if (rounds > 0) EXT.run('aimedAt', target, battle, { from: soldier, rounds: rounds, d: d });
    return true;
  }

  root.BattleExtensionPoints = extensionPoints;
  root.BattleLeases = Leases;
  root.SquadAI = {
    extend: EXT.attach,
    extensionOrder: EXT.order,
    ROLES: ROLES,
    LOADOUTS: LOADOUTS,
    loadoutFor: loadoutFor,
    dealLoadout: dealLoadout,
    rearm: rearm,
    isMachineGun: isMachineGun,
    COMPOSITION: COMPOSITION,
    createSquad: createSquad,
    createSoldier: createSoldier,
    updateSquad: updateSquad,
    updateSoldier: updateSoldier,
    perceive: perceive,
    formationSlot: formationSlot,
    leaderOf: leaderOf,
    seniority: seniority,
    mostSenior: mostSenior,
    isLeader: isLeader,
    establishment: establishment,
    retreatGoal: retreatGoal,
    formationFor: formationFor,
    setDestination: setDestination,
    clearTarget: clearTarget,
    playerAim: playerAim,
    playerFire: playerFire,
    playerFireRay: playerFireRay,
    hasLineOfSight: hasLineOfSight,
    detectionRange: detectionRange,
    findTarget: findTarget,
    threatDisposition: threatDisposition,
    lookYaw: lookYaw,
    squadSenses: squadSenses,
    PERCEPTION: {
      FOCUS_HALF: FOCUS_HALF,
      PERIPHERAL_HALF: PERIPHERAL_HALF,
      PERIPHERAL_RANGE: PERIPHERAL_RANGE,
      PERIPHERAL_MOVING: PERIPHERAL_MOVING,
      BEHIND_RANGE: BEHIND_RANGE,
      HEAD_TURN: HEAD_TURN,
      SCAN_SWEEP: SCAN_SWEEP,
      SCAN_PERIOD: SCAN_PERIOD,
      HEAR_RANGE: HEAR_RANGE,
      HEAR_MEMORY: HEAR_MEMORY,
      RELAY_RANGE: RELAY_RANGE,
      STANCE_VIS_ON: STANCE_VIS_ON,
      VISIBILITY: VISIBILITY,
      MOVING_VISIBILITY_BONUS: MOVING_VISIBILITY_BONUS
    },
    engageRange: engageRange,
    tryFire: tryFire,
    resolveFire: shot,
    applyHit: applyHit,
    areaFire: areaFire,
    pin: pin,
    SUPPRESSION_TIME: SUPPRESSION_TIME,
    canSuppress: canSuppress,
    shareContact: shareContact,
    squadContact: squadContact,
    CONTACT_MEMORY: CONTACT_MEMORY,
    CONTACT_REFRESH: CONTACT_REFRESH,
    coverMultiplierAt: coverMultiplierAt,
    coverPotentialAt: coverPotentialAt,
    stanceOf: stanceOf,
    eyeHeight: eyeHeight,
    dist2: dist2
  };
})(typeof window !== 'undefined' ? window : globalThis);
