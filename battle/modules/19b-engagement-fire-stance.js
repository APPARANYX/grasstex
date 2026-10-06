/* Engagement fire-and-stance sub-module (extracted from battle/engagement.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.

   This module owns the firefight's fire control and ground game: the per-soldier
   fire-permission layer (fireControlTuning, underFireNow, fireControlOf, fireAuthorized,
   fireControlPreparing - Squad fire control is Meso-owned state this file only reads), the
   stance engine (crawlPace, canCrawlTo, seesFrom, seeingStance, applyStance, stanceContext,
   commitStance, requestStance, commitStanceRespectHold, holdStance, inCover, crouchCover,
   fightingStance), fire permission and suppression (movingTooFast, fireAllowed, tryFire,
   suppress), fire-control targeting and observation (fireControlTarget, stanceProxy,
   firingLineClear, proneLineClear, crestPrepPoint, fireControlObservation, fireControlReady,
   prepareFireControl), the bound (squadForward, boundForward, orderedBound) and the fire
   position (PORT_ON, portTarget, portLines, portSolve, station, legacyStation).

   Wiring is the reverse of the 15m -> 16 pattern (same as the cover and stress modules):
   every module file loads AFTER engagement.js in both chains (the page appends the discovered
   modules after the core scripts; the harness loads them after the runtime block), so
   engagement.js cannot call this factory at its own load time. Instead engagement.js publishes
   the ctx below (_engagementFireStanceCtx: its closure utilities plus the constants its
   export's tuning reads - they stay there) and an attach sink (_engagementFireStanceAttach),
   and this file calls the factory with that ctx at ITS load time and installs the returned
   functions back into the parent. Until then the parent's delegating closures fail loudly, so
   a chain that loads engagement.js without this module says so on the first stance or fire
   decision instead of silently fielding men who neither kneel nor shoot. */
(function (root) {
  'use strict';
  if (root._engagementFireStance) return;

  /* Factory: the module calls it itself at load time with engagement.js's ctx (see above). */
  root._engagementFireStance = function (ctx) {
    var root = ctx.root,
      SA = ctx.SA,
      state = ctx.state,
      mind = ctx.mind,
      dist = ctx.dist,
      posOf = ctx.posOf,
      field = ctx.field,
      jitter = ctx.jitter,
      statScale = ctx.statScale,
      combatThreat = ctx.combatThreat,
      facingError = ctx.facingError,
      squadContact = ctx.squadContact,
      knownThreat = ctx.knownThreat,
      noteShock = ctx.noteShock,
      shockUntil = ctx.shockUntil,
      transition = ctx.transition,
      move = ctx.move,
      holdPosition = ctx.holdPosition,
      findCover = ctx.findCover,
      assault = ctx.assault,
      bound = ctx.bound,
      AIM_CONE = ctx.AIM_CONE,
      AIM_SETTLE = ctx.AIM_SETTLE,
      ALERT_HOLD = ctx.ALERT_HOLD,
      ALERT_LATCH = ctx.ALERT_LATCH,
      BOUND_ARRIVED = ctx.BOUND_ARRIVED,
      BOUND_BACK_ALLOW = ctx.BOUND_BACK_ALLOW,
      BOUND_METERS = ctx.BOUND_METERS,
      CONTACT_STANCE = ctx.CONTACT_STANCE,
      COVER_FIRE = ctx.COVER_FIRE,
      COVER_RANGE_UNDER_FIRE = ctx.COVER_RANGE_UNDER_FIRE,
      COVER_STANCE = ctx.COVER_STANCE,
      GUNNER_SETUP = ctx.GUNNER_SETUP,
      MOVE_FIRE_FRACTION = ctx.MOVE_FIRE_FRACTION,
      PRONE_HOLD = ctx.PRONE_HOLD,
      PRONE_ROLES = ctx.PRONE_ROLES,
      STANCE_HOLD = ctx.STANCE_HOLD,
      SUPPRESS_BURST = ctx.SUPPRESS_BURST,
      SUPPRESS_PAUSE = ctx.SUPPRESS_PAUSE,
      USEFUL_COVER = ctx.USEFUL_COVER;

  function engagementLive(s, battle) {
    var q = s.squad;
    if (!q || battle.winner || q.state === 'retreat') return false;
    if (q.inContact || q.clearContact) return true; // clearing the last contact is still the engagement
    var api = SA(),
      c = api && api.squadContact ? api.squadContact(q, battle) : q.contact;
    return !!(c && api && api.hasFirstHandMemory && api.hasFirstHandMemory(c, battle));
  }
  /* Once alerted, stay in the fight until the squad-level engagement is won/lost. This keeps a
     temporary personal LOS gap from turning alert -> march -> alert. ?alertHold=0 is the old rule. */
  function squadOnHeels(s, battle) {
    var q = s.squad;
    if (!q) return false;
    if (q.inContact) return true;
    var known = CONTACT_STANCE && squadContact(s, battle);
    return !!known && battle.time - known.at <= ALERT_HOLD;
  }

  /* Squad fire control is Meso-owned state. Engagement only reads the order and answers whether one
     man is presently allowed/ready to shoot. A man already taking fire may return it immediately;
     the Squad Leader will open the rest of the squad on its next tick. */
  function fireControlTuning() {
    var Q = root.BattleSquadStability,
      t = Q && Q.tuning && Q.tuning.fireControl;
    return t || { returnFireWindow: 3, crestStep: 0.75, crestMax: 6 };
  }
  function underFireNow(s, battle) {
    if (!s || !battle) return false;
    if ((+s.suppressedUntil || 0) > battle.time) return true;
    var M = mind();
    return !!(M && M.recentIncoming(s, battle.time, fireControlTuning().returnFireWindow));
  }
  function fireControlOf(s, battle) {
    var CR = root.BattleCommandReception;
    if (CR && CR.postureEnabled && CR.postureEnabled()) {
      var rec = CR.adopted && CR.adopted(s, battle, 'posture-fire', 'squad'),
        data = rec && rec.data;
      if (!data || data.state === 'clear') return null;
      return {
        state: data.state || null,
        targetId: data.targetId == null ? null : data.targetId,
        shooterId: data.shooterId == null ? null : data.shooterId,
        commandVersion: rec.version,
        commandEnvelopeId: rec.envelopeId
      };
    }
    return (s && s.squad && s.squad.fireControl) || null;
  }
  function fireAuthorized(s, battle) {
    var f = fireControlOf(s, battle);
    if (!f || f.state === 'open') return true;
    if (underFireNow(s, battle)) return true;
    return f.state === 'precision' && String(f.shooterId) === String(s.id);
  }
  function fireControlPreparing(s, battle) {
    var f = fireControlOf(s, battle);
    if (!f || underFireNow(s, battle)) return false;
    if (f.state === 'hold') return true;
    if (f.state !== 'precision') return false;
    if (String(f.shooterId) !== String(s.id)) return true;
    /* The designated marksman may leave preparation only when he personally has the shot. A shared
       contact alone keeps him low and ready instead of sending him back toward his formation slot. */
    return !(combatThreat(s.target) && fireControlReady(s, battle));
  }

  function crawlPace() {
    var I = root.BattleSoldierIndividuality;
    return (I && I.crawlFactor) || 0.23;
  }

  function canCrawlTo(s, battle, d) {
    /* Use the actual crawl ground speed from module 11's gait table, not 0.23 × s.speed.
       The old formula over-estimated crawl speed by ~1.85× because s.speed is the
       compensated crouch-run pace (5.0), not the raw crawl pace. Reading the gait
       value directly gives the real crawl ground speed (~0.62 m/s for proneFast). */
    var I = root.BattleSoldierIndividuality,
      phen = I && I.phenotype ? I.phenotype(s) : null,
      crawlGround = phen && phen.gaits ? +(phen.gaits.proneFast || phen.gaits.proneNormal || 0.6) : 0.6,
      remaining = state(s).until - battle.time;
    return d <= crawlGround * remaining && (s.moveSpeed || 0) <= 2 * crawlGround;
  }

  /* ---- sight from a place and a stance --------------------------------------------------------- */

  /* Cover and stance are for fighting from, unless he is evading fire. `coverCandidates` keeps only slots whose
     shelter lies between the slot and the threat, so every one of them hides him from it; a slot that hides him
     at every stance is a place to wait, not to fight (bound-motion probe: of the bounds that ended in "target
     lost", 140 of 149 reached a slot from which he could not see where he had last seen the man, and the
     hedges are 3 to 6 m). He ran there, lost the target, held the sector and marched on, and the next contact
     sent him again: the stand -> crouch -> prone -> stand loop. So a slot must give him a line to the threat
     from some stance, and the stance he takes must not blind him to the man he is shooting at. Under fire he
     takes any cover and any stance that saves him. `?coverFire=0` is the old choice, for a paired A/B. */
  var STANCE_ORDER = ['prone', 'crouch', 'stand'];
  // Would a man at `pt` in `stance` see `target`? (Perception's own test: heights, hedges, ground.)
  function seesFrom(pt, stance, target, battle) {
    return SA().hasLineOfSight(
      { root: { position: pt }, prone: stance === 'prone', crouching: stance === 'crouch' },
      target,
      battle.heightAt,
      battle.obstacles
    );
  }
  /* The lowest stance at or above `want` from which he still sees `at` (his target, else where the enemy was last
     seen), so a man who wants to be low behind a wall rises far enough to look over it. Under fire, or with no one
     to look at, `want` stands. */
  function seeingStance(s, battle, want, at) {
    var target = at || s.target;
    if (!COVER_FIRE || !combatThreat(target) || want === 'stand' || s.suppressedUntil > battle.time)
      return want;
    var here = posOf(s);
    for (var i = STANCE_ORDER.indexOf(want); i < STANCE_ORDER.length; i++)
      if (seesFrom(here, STANCE_ORDER[i], target, battle)) return STANCE_ORDER[i];
    return want; // he sees him from no stance: nothing to lose by staying low
  }

  /* ---- stance ------------------------------------------------------------------------------- */

  function applyStance(s, stance) {
    if (stance === 'prone') {
      s.prone = true;
      s.tacticalCrouch = false;
    } else if (stance === 'crawl') {
      s.prone = true;
      s.crawling = true;
      s.tacticalCrouch = false;
      return;
    } else if (stance === 'crouch') {
      s.prone = false;
      s.tacticalCrouch = true;
    } else {
      s.prone = false;
      s.tacticalCrouch = false;
    }
    s.crawling = false;
  }
  function stanceContext(s, battle, e) {
    var c = s.squad ? squadContact(s, battle) : null,
      cp = e && e.cover,
      p = posOf(s);
    return {
      x: +p.x || 0,
      z: +p.z || 0,
      contact: !!(s.squad && s.squad.inContact),
      contactId:
        c && c.knownUnitId != null
          ? String(c.knownUnitId)
          : c && c.unit && c.unit.id != null
            ? String(c.unit.id)
            : null,
      cover: cp
        ? cp.slotId != null
          ? String(cp.slotId)
          : Math.round((+cp.x || 0) * 2) / 2 + ',' + Math.round((+cp.z || 0) * 2) / 2
        : null
    };
  }
  function commitStance(s, battle, stance, seconds, reason) {
    var e = state(s);
    if (e.stance !== stance) {
      var from = e.stance,
        ctx = stanceContext(s, battle, e),
        trail = e.stanceTrail || (e.stanceTrail = []);
      e.fireReadyAt = Math.max(e.fireReadyAt, battle.time + AIM_SETTLE * statScale(s, 'settle'));
      e.stance = stance;
      trail.push({
        at: battle.time,
        from: from,
        to: stance,
        reason: String(reason || ('state:' + (e.state || 'unknown'))),
        state: e.state || null,
        x: ctx.x,
        z: ctx.z,
        contact: ctx.contact,
        contactId: ctx.contactId,
        cover: ctx.cover
      });
      if (trail.length > 24) trail.splice(0, trail.length - 24);
    }
    e.stanceUntil =
      battle.time + (seconds == null ? (stance === 'prone' ? PRONE_HOLD : STANCE_HOLD) : seconds);
    applyStance(s, stance);
  }
  /* Another layer asking for a stance (a reload, a drill). Engagement is the only owner of
     stance, so a request goes through the same commitment: it may only take a man lower
     (stand -> crouch -> prone/crawl), never stand up a man Engagement put down, and it restarts
     no hold on a stance he already has. */
  var STANCE_HEIGHT = { prone: 0, crawl: 0, crouch: 1, stand: 2 };
  function requestStance(s, battle, stance, seconds) {
    var e = state(s);
    if (STANCE_HEIGHT[stance] >= STANCE_HEIGHT[e.stance]) return false;
    commitStance(s, battle, stance, seconds, 'request:' + stance);
    return true;
  }
  /* A committed stance is a short lease, not merely a visual suggestion. A new drill may always
     take the man lower, but it may not raise him until the current hold expires. This is the
     arbitration point for fire-control preparation vs orient/advance, reload vs firing station,
     and suppression vs withdrawal; all still have one stance writer. */
  function commitStanceRespectHold(s, battle, stance, seconds, reason) {
    var e = state(s),
      cur = STANCE_HEIGHT[e.stance],
      next = STANCE_HEIGHT[stance];
    if (battle.time < e.stanceUntil && next > cur) {
      applyStance(s, e.stance);
      return false;
    }
    commitStance(s, battle, stance, seconds, reason);
    return true;
  }
  function holdStance(s, battle) {
    var e = state(s);
    if (battle.time < e.stanceUntil) {
      applyStance(s, e.stance);
      return true;
    }
    return false;
  }
  /* Fighting posture by cover: prone is primarily the posture of a man in the open; behind useful
     cover he crouches unless incoming fire and low cover make prone the safer choice.
     ?coverStance=0 retains the previous long-shot/suppression rule everywhere. */
  function inCover(s, battle) {
    var F = field(),
      p = posOf(s);
    return !!F && F.coverPotentialAt(battle.obstacles, p.x, p.z) <= USEFUL_COVER;
  }
  function crouchCover(s, battle) {
    var F = field(),
      p = posOf(s);
    return F && F.coverAt ? F.coverAt(battle.obstacles, p.x, p.z, 'crouch') : 1;
  }
  function fightingStance(s, battle, distanceToTarget, coverValue) {
    var suppressed = s.suppressedUntil > battle.time;
    if (!PRONE_ROLES[s.role]) return 'crouch';
    if (COVER_STANCE && coverValue <= USEFUL_COVER)
      return suppressed && crouchCover(s, battle) > USEFUL_COVER ? 'prone' : 'crouch';
    if (suppressed) return 'prone';
    if (distanceToTarget > Math.max(70, SA().engageRange(s) * 0.55)) return 'prone';
    if (coverValue > USEFUL_COVER) return 'prone'; // no cover at all: go to ground
    return 'crouch';
  }

  function movingTooFast(s) {
    return !!(s.moving && (s.moveSpeed || 0) > Math.max(0.16, (s.speed || 1) * MOVE_FIRE_FRACTION));
  }
  function fireAllowed(s, battle) {
    var e = state(s);
    if (!combatThreat(s.target) || s.reloading) return false;
    if (battle.time < e.fireReadyAt) return false;
    if (movingTooFast(s) || s.crawling) return false;
    if (facingError(s, posOf(s.target)) > AIM_CONE) return false;
    if (SA().isMachineGun(s) && !s.setUp && e.state === 'engage') return false; // the gun gets emplaced first
    if (!fireAuthorized(s, battle)) return false; // Squad Leader has not given this man permission yet.
    /* Last, so that when it stops him it was the only thing that did (the same answer in any order). */
    if (battle.time < shockUntil(s)) {
      noteShock(s, 'fire');
      return false;
    }
    return true;
  }
  function tryFire(s, battle) {
    if (!fireAllowed(s, battle)) return false;
    var d = dist(posOf(s).x, posOf(s).z, posOf(s.target).x, posOf(s.target).z);
    if (d > SA().engageRange(s)) return false;
    SA().tryFire(s, battle);
    return true;
  }

  /* Rounds into a known position. Facing and settling still gate it, so a man turns onto the
     sector before he fires into it. */
  function suppress(s, battle, point) {
    var e = state(s);
    if (!point || s.reloading || movingTooFast(s) || s.crawling) return false;
    if (!fireAuthorized(s, battle)) return false;
    if (battle.time < e.burstPauseUntil || battle.time < e.fireReadyAt) return false;
    if (facingError(s, point) > AIM_CONE) return false;
    if (battle.time < shockUntil(s)) {
      noteShock(s, 'suppress'); // everything but the area-fire gate allowed it: the freeze stopped this burst
      return false;
    }
    if (!SA().areaFire(s, point, battle)) return false;
    e.burstLeft = (e.burstLeft || SUPPRESS_BURST) - 1;
    if (e.burstLeft <= 0) {
      e.burstLeft = SUPPRESS_BURST;
      e.burstPauseUntil = battle.time + SUPPRESS_PAUSE + jitter(s, 0.2);
    }
    return true;
  }

  /* ---- transitions ------------------------------------------------------------------------- */

  /* All states evaluate on the fixed 0.15 s soldier tick; deadlines below remain sim time.
     Withdrawal and an occupied station override any drill. `decide` is a synchronous branch,
     not a stored state; the public decide API can select alert/pinned/engage/bound from any state.
     A released withdrawal/station still runs advance's handler until the
     next actual transition (the legacy state record deliberately remains readable meanwhile). */
  function fireControlTarget(s, battle) {
    if (combatThreat(s.target)) return s.target;
    var c = squadContact(s, battle);
    if (c && combatThreat(c.unit)) return c.unit;
    if (
      c &&
      (c.source === 'seen' || c.source === 'incoming' || c.precision === 'fire-origin') &&
      c.knownUnitId != null &&
      isFinite(+c.x) &&
      isFinite(+c.z)
    ) {
      return {
        id: String(c.knownUnitId),
        combatThreat: true,
        _recordedFireControlPoint: true,
        root: {
          position: { x: +c.x, y: battle.heightAt(+c.x, +c.z), z: +c.z },
          rotation: { y: 0 }
        },
        prone: c.stance === 'prone',
        crouching: c.stance === 'crouch',
        tacticalCrouch: c.stance === 'crouch'
      };
    }
    return null;
  }
  function stanceProxy(s, pt, stance, battle) {
    return {
      root: {
        position: { x: pt.x, y: battle.heightAt(pt.x, pt.z), z: pt.z },
        rotation: { y: (s.root.rotation && +s.root.rotation.y) || 0 }
      },
      prone: stance === 'prone',
      crouching: stance === 'crouch',
      tacticalCrouch: stance === 'crouch',
      weapon: s.weapon,
      role: s.role,
      squad: s.squad
    };
  }
  function firingLineClear(s, target, pt, stance, battle) {
    if (!s || !combatThreat(target) || !pt) return false;
    var proxy = stanceProxy(s, pt, stance, battle);
    if (!SA().hasLineOfSight(proxy, target, battle.heightAt, battle.obstacles)) return false;
    var B = root.BattleBallistics;
    return !(B && B.fireLineBlocked && B.fireLineBlocked(proxy, target, battle));
  }
  function proneLineClear(s, target, pt, battle) {
    return firingLineClear(s, target, pt, 'prone', battle);
  }
  /* A crest preparation is deliberately local. Sample only a few metres toward the observed man;
     the Movement Resolver still owns the legal physical step. This is not a new pathfinder. */
  function crestPrepPoint(s, target, battle) {
    var p = posOf(s);
    if (!combatThreat(target) || proneLineClear(s, target, p, battle)) return { x: p.x, z: p.z };
    var tp = posOf(target),
      dx = tp.x - p.x,
      dz = tp.z - p.z,
      len = Math.hypot(dx, dz),
      T = fireControlTuning(),
      step = Math.max(0.25, +T.crestStep || 0.75),
      max = Math.max(step, +T.crestMax || 6);
    if (len < 0.1) return { x: p.x, z: p.z };
    dx /= len;
    dz /= len;
    for (var d = step; d <= max + 1e-9; d += step) {
      var q = { x: p.x + dx * d, z: p.z + dz * d };
      if (proneLineClear(s, target, q, battle)) return q;
    }
    return { x: p.x, z: p.z };
  }
  function fireControlObservation(s, battle) {
    var out = {
      ready: false,
      visualLine: false,
      ballisticLine: false,
      terrainCrestBlocked: false,
      proneVisualLine: false,
      proneBallisticLine: false,
      proneReady: false,
      inRange: false,
      eligible: false,
      targetId: null
    };
    if (!s || s.dead || !battle) return out;
    var target = fireControlTarget(s, battle);
    if (!target) return out;
    out.targetId = target.id == null ? null : String(target.id);
    var p = posOf(s),
      tp = posOf(target),
      stance = s.prone ? 'prone' : s.tacticalCrouch || s.crouching ? 'crouch' : 'stand',
      proxy = stanceProxy(s, p, stance, battle),
      proneProxy = stanceProxy(s, p, 'prone', battle),
      B = root.BattleBallistics,
      basic = !!(
        s.weapon &&
        !s.reloading &&
        !s.clearingStoppage &&
        !s.outOfAmmo &&
        !s.crawling &&
        !(s.moving && (s.moveSpeed || 0) > 0.16)
      );
    out.eligible = basic;
    out.inRange = dist(p.x, p.z, tp.x, tp.z) <= SA().engageRange(s);
    out.visualLine = !!SA().hasLineOfSight(proxy, target, battle.heightAt, battle.obstacles);
    out.ballisticLine = !(B && B.fireLineBlocked && B.fireLineBlocked(proxy, target, battle));
    out.terrainCrestBlocked = out.visualLine && !out.ballisticLine;
    out.proneVisualLine = !!SA().hasLineOfSight(proneProxy, target, battle.heightAt, battle.obstacles);
    out.proneBallisticLine = !(B && B.fireLineBlocked && B.fireLineBlocked(proneProxy, target, battle));
    out.proneReady = basic && out.inRange && out.proneVisualLine && out.proneBallisticLine;
    out.ready = basic && out.inRange && out.visualLine && out.ballisticLine;
    return out;
  }
  function fireControlReady(s, battle) {
    return fireControlObservation(s, battle).ready;
  }
  function prepareFireControl(s, battle) {
    var target = fireControlTarget(s, battle),
      known = target ? posOf(target) : knownThreat(s, battle),
      p = posOf(s),
      goal = target ? crestPrepPoint(s, target, battle) : { x: p.x, z: p.z };
    s.state = 'engage';
    s.setUp = false;
    if (known) s._faceHint = { x: known.x, z: known.z };
    /* Bridge the short contact/fire-control blink that used to produce
       prone -> crouch/stand -> prone loops. ALERT_HOLD is already the lifetime of the same
       remembered threat sector, so the posture commitment expires with that tactical memory. */
    if (ALERT_LATCH) state(s).engaged = true;
    var low =
      COVER_STANCE && inCover(s, battle)
        ? seeingStance(s, battle, 'crouch', target || (known && { root: { position: known } }))
        : 'prone';
    if (low !== 'prone') goal = { x: p.x, z: p.z };
    commitStance(s, battle, low, ALERT_HOLD, 'fire-control-prep');
    if (dist(p.x, p.z, goal.x, goal.z) > 0.3) move(s, battle, goal, 'contact-reaction', 0.8);
    else holdPosition(s, battle);
  }
  function squadForward(s) {
    var sq = s.squad;
    if (!sq) return null;
    var goal = sq.objective || sq.home,
      anchor = sq.orderAnchor || sq.rally;
    if (!goal || !anchor) return null;
    var dx = goal.x - anchor.x,
      dz = goal.z - anchor.z,
      len = Math.hypot(dx, dz);
    return len > 0.1 ? { x: dx / len, z: dz / len } : null;
  }
  /* The squad's advance axis for a bound: the one its forward line is measured on (the Squad Leader
     publishes it; it keeps its direction when the anchor sits on the objective), else anchor to goal. */
  function boundForward(s) {
    var fl = s.squad && s.squad._forwardLine,
      a = fl && fl.axis;
    if (a && Math.hypot(a.x, a.z) > 0.5) return { x: a.x, z: a.z };
    return squadForward(s);
  }

  /* One Squad Leader permission produces one displacement. Cover and a no-cover rush use the same
     engagement lifecycle, so target flicker cannot create a second, invisible movement drill. */
  function orderedBound(s, battle) {
    var e = state(s),
      sq = s.squad;
    if (!e.boundOrder || !sq || !sq._assaultAuthorized || !root.BattleLeases.holds(sq, 'bound', battle.time))
      return false;
    if (
      SA().isMachineGun(s) ||
      s.reloading ||
      s.clearingStoppage ||
      s.outOfAmmo ||
      s.suppressedUntil > battle.time
    )
      return false;
    /* A man who has been through it takes a moment before he goes. The order stands meanwhile: the wait
       is capped under the Squad Leader's bound window, so he still moves, later and raggedly, which is
       how a shaken fireteam bounds. A man frozen by what he just saw does not start one at all. */
    if (battle.time < shockUntil(s)) {
      noteShock(s, 'bound');
      return false;
    }
    var M = mind(),
      wait = M ? M.hesitation(s) : 0;
    if (wait > 0) {
      if (!e.boundWaitFrom) {
        e.boundWaitFrom = battle.time;
        M.noteHesitation(s);
      }
      if (battle.time - e.boundWaitFrom < wait) return false;
    }
    if (M) M.noteBound(s, e.boundWaitFrom ? battle.time - e.boundWaitFrom : 0);
    e.boundWaitFrom = 0;
    e.boundOrder = false;
    var threat = s.target,
      known = knownThreat(s, battle);
    if (!threat && known) threat = { root: { position: known } };
    /* A bound is a move forward: its cover may sit a little to the side or behind (BOUND_BACK_ALLOW)
       but never walk him back behind where he is. 44's forward guard only covers the `assault`
       phase, and bounds are also ordered in `capture` and `clear-town` (backward-orders probe: most
       backward authorized bounds). With no cover ahead he rushes toward the objective instead. */
    var fwd = boundForward(s),
      cover = findCover(s, battle, {
        maxRange: COVER_RANGE_UNDER_FIRE,
        forward: fwd,
        evade: s.suppressedUntil > battle.time,
        notBehind: fwd ? { axis: fwd, allow: BOUND_BACK_ALLOW } : null,
        threat: threat
      });
    if (cover) {
      e.cover = cover;
      transition(
        s,
        battle,
        'bound',
        Math.max(3, cover.distance / Math.max(0.6, s.speed * 0.6) + 2),
        'authorized fireteam bound: cover'
      );
      bound(s, battle);
      return true;
    }
    var p = posOf(s),
      goal = sq.objective || sq.home,
      dx = goal && goal.x - p.x,
      dz = goal && goal.z - p.z,
      len = Math.hypot(dx, dz);
    if (!isFinite(len) || len <= BOUND_ARRIVED) return false;
    var step = Math.min(BOUND_METERS, len),
      next = { x: p.x + (dx / len) * step, z: p.z + (dz / len) * step };
    if (root.BattleMovementProgress && !root.BattleMovementProgress.candidateAllowed(s, battle, next))
      return false;
    transition(
      s,
      battle,
      'assault',
      Math.max(3, step / Math.max(0.6, s.speed * 0.6) + 2),
      'authorized fireteam bound'
    );
    e.assaultGoal = next;
    assault(s, battle);
    return true;
  }
  var PORT_ON = !(typeof location !== 'undefined' && /[?&]windowPort=0\b/.test(location.search || ''));
  function portTarget(s, battle) {
    var tp = posOf(s.target);
    return { x: tp.x, y: battle.heightAt(tp.x, tp.z) + SA().eyeHeight(s.target) - 0.2, z: tp.z };
  }
  function portLines(s, battle, st, t) {
    var N = root.BattleNavigation,
      p = posOf(s),
      floor = battle.heightAt(st.windowX, st.windowZ),
      to = portTarget(s, battle),
      eyeY = battle.heightAt(p.x, p.z) + SA().eyeHeight(s),
      eye = N.aperture(st, { x: p.x, y: eyeY, z: p.z }, to, floor),
      B = root.BattleBallistics,
      m = B && B.muzzleOrigin ? B.muzzleOrigin(s, s.target, battle) : { x: p.x, y: eyeY, z: p.z },
      dx = m.x - p.x,
      dz = m.z - p.z,
      l = Math.hypot(dx, dz) || 1,
      stock = { x: m.x - (dx / l) * 0.5, y: m.y, z: m.z - (dz / l) * 0.5 },
      /* the butt is behind the muzzle on the same line, so the bore is judged from the stock to the target */
      muzzle = N.aperture(st, stock, to, floor);
    return { eye: eye, muzzle: muzzle, eyeAt: { x: p.x, y: eyeY, z: p.z }, muzzleAt: m, to: to };
  }
  function portSolve(s, battle, t, st, lines) {
    var port = st.port,
      cur = t.pose || { lat: 0, fwd: 0, stance: port.stance },
      req = null;
    var bad = !lines.eye.ok ? lines.eye : lines.muzzle.ok ? null : lines.muzzle;
    if (!bad) return false;
    if (bad.reason === 'sill' && cur.stance !== 'stand' && port.stances.indexOf('stand') >= 0)
      req = { stance: 'stand' };
    else if (bad.reason === 'lintel' && cur.stance !== 'crouch' && port.stances.indexOf('crouch') >= 0)
      req = { stance: 'crouch' };
    else if (bad.reason === 'jamb') {
      var over = Math.abs(bad.u) - (port.halfWidth - 0.08) + 0.05,
        side = bad.u > 0 ? 1 : -1;
      // closer to the wall first (it widens the sector), then along the sill toward the side the line crosses
      if (cur.fwd < port.maxForward) req = { fwd: port.maxForward };
      else req = { lat: cur.lat + side * Math.max(0.05, over) };
    }
    return req ? root.BattleTacticalPositions.adjustPose(s, battle, req) : false;
  }
  function station(s, battle) {
    var e = state(s),
      P = root.BattleTacticalPositions,
      t = P.current(s),
      st = t.position,
      port = PORT_ON && st.port;
    s.state = 'hardpoint';
    if (!port) return legacyStation(s, battle, e, t, st);
    var N = root.BattleNavigation,
      anchor = P.anchor(s) || st,
      p = posOf(s),
      d = dist(p.x, p.z, anchor.x, anchor.z),
      pose = t.pose,
      out = { x: st.windowX + st.normalX * 20, z: st.windowZ + st.normalZ * 20 },
      tp = combatThreat(s.target) ? posOf(s.target) : null,
      face =
        tp && N.inSector(st, tp)
          ? tp
          : t.threatSector && N.inSector(st, t.threatSector)
            ? t.threatSector
            : out;
    s._faceHint = face;
    commitStanceRespectHold(s, battle, (pose && pose.stance) || port.stance, 2.0, 'station');
    move(s, battle, { x: anchor.x, z: anchor.z }, 'firing-station');
    if (d > 0.35) {
      s.setUp = false;
      return;
    }
    if (SA().isMachineGun(s)) {
      if (!e.setUpSince) e.setUpSince = battle.time;
      s.setUp = battle.time - e.setUpSince > GUNNER_SETUP * statScale(s, 'setup');
    }
    if (!tp || !N.inSector(st, tp)) {
      // Holding the sector: no target (or none inside the aperture's reach) is not a reason to leave.
      P.noteAperture(s, battle, {
        stance: (pose && pose.stance) || port.stance,
        target: null,
        state: 'holding'
      });
      return;
    }
    var lines = portLines(s, battle, st, t),
      moved = false;
    if (!(lines.eye.ok && lines.muzzle.ok)) moved = portSolve(s, battle, t, st, lines);
    P.noteAperture(s, battle, {
      stance: (pose && pose.stance) || port.stance,
      target: s.target.id,
      state: lines.eye.ok && lines.muzzle.ok ? 'firing' : moved ? 'adjusting' : 'blocked',
      eye: { ok: lines.eye.ok, reason: lines.eye.reason },
      muzzle: { ok: lines.muzzle.ok, reason: lines.muzzle.reason },
      eyeAt: lines.eyeAt,
      muzzleAt: lines.muzzleAt,
      to: lines.to
    });
    if (lines.eye.ok && lines.muzzle.ok) tryFire(s, battle);
  }
  function legacyStation(s, battle, e, t, st) {
    s._faceHint = t.threatSector;
    var p = posOf(s),
      d = dist(p.x, p.z, st.x, st.z);
    commitStanceRespectHold(s, battle, 'crouch', 2.0, 'station');
    // Keep the station intent even when occupied; a short-lived hold proposal cannot return him
    // to formation when engagement updates are staggered.
    move(s, battle, { x: st.x, z: st.z }, 'firing-station');
    if (d <= 0.35) {
      if (SA().isMachineGun(s)) {
        if (!e.setUpSince) e.setUpSince = battle.time;
        s.setUp = battle.time - e.setUpSince > GUNNER_SETUP * statScale(s, 'setup');
      }
      if (s.target) {
        var tp = posOf(s.target),
          dx = tp.x - st.windowX,
          dz = tp.z - st.windowZ,
          len = Math.hypot(dx, dz) || 1;
        if ((dx * st.normalX + dz * st.normalZ) / len >= 0.25) tryFire(s, battle);
      }
    } else s.setUp = false;
  }
    return {
      engagementLive: engagementLive,
      squadOnHeels: squadOnHeels,
      underFireNow: underFireNow,
      fireAuthorized: fireAuthorized,
      fireControlPreparing: fireControlPreparing,
      canCrawlTo: canCrawlTo,
      seesFrom: seesFrom,
      seeingStance: seeingStance,
      applyStance: applyStance,
      commitStance: commitStance,
      requestStance: requestStance,
      commitStanceRespectHold: commitStanceRespectHold,
      holdStance: holdStance,
      inCover: inCover,
      fightingStance: fightingStance,
      fireAllowed: fireAllowed,
      tryFire: tryFire,
      suppress: suppress,
      firingLineClear: firingLineClear,
      crestPrepPoint: crestPrepPoint,
      fireControlObservation: fireControlObservation,
      fireControlReady: fireControlReady,
      prepareFireControl: prepareFireControl,
      boundForward: boundForward,
      orderedBound: orderedBound,
      station: station
    };
  };

  /* Install into the parent now; engagement.js must already be loaded. */
  if (!root._engagementFireStanceCtx || !root._engagementFireStanceAttach)
    throw new Error('[fire-stance] engagement.js must load before battle/modules/19b-engagement-fire-stance.js');
  root._engagementFireStanceAttach(root._engagementFireStance(root._engagementFireStanceCtx()));
})(typeof window !== 'undefined' ? window : globalThis);
