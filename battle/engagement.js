/* Individual engagement pipeline for the ww2fps AI lab.

   Before this file the per-soldier combat behavior was spread over four modules that each wrapped
   SquadAI.updateSoldier and each wrote soldier.destination / prone / tacticalCrouch on the same
   tick. The last writer won, so a soldier's visible behavior was "walk to a formation slot while
   pointing a rifle": nobody ever owned the decision to stop, get down and fight.

   This module owns combat STATE, stance and fire control. It decides whether a soldier is
   advancing, orienting, bounding, engaging, pinned, assaulting or alert. It does not own the
   physical destination: combat movement requests go to BattleMovementResolver, which coalesces
   them and alone writes soldier.destination; squad movement remains owned by the squad-command path.

   Sequence a soldier now runs on contact:
     advance -> orient (halt, turn, weapon up) -> react
              -> bound (crouch-run/crawl to cover) -> engage (committed stance, aimed fire)
              -> pinned (prone while suppressed) / assault (short rush) / alert (lost contact)

   Nothing here touches Babylon, so the whole pipeline runs in the headless harness under
   tools/ai-sim-harness. */
(function (root) {
  'use strict';

  /* Seconds between acquiring a target and being allowed to shoot at it. This is recognition and
     weapon handling, not aiming accuracy - the aim cone below is a separate gate. */
  var REACT = { sergeant: 0.55, rifleman: 0.7, gunner: 0.85, scout: 0.45 };
  var AIM_CONE = 0.22; // ~12.6 deg; wider than this and the body is still turning
  var AIM_SETTLE = 0.4; // after a stance change or a major retarget
  var MOVE_FIRE_FRACTION = 0.12; // above this fraction of top speed the weapon stays down
  var ALERT_HOLD = 4.5; // hold the threat sector this long after losing sight
  var ENGAGE_REVIEW = 7.0; // re-open the cover question this often while holding
  var STANCE_HOLD = 4.0,
    PRONE_HOLD = 5.5;
  var COVER_RANGE = 26,
    COVER_RANGE_UNDER_FIRE = 42,
    COVER_ARRIVED = 1.2;
  var GUNNER_SETUP = 1.4;
  /* A position is "in the open" when the best stance available there still leaves the soldier
     nearly fully exposed. */
  var OPEN_COVER = 0.92,
    USEFUL_COVER = 0.88;
  var PRONE_ROLES = { rifleman: 1, gunner: 1 };
  var BOUND_METERS = 6.5,
    BOUND_ARRIVED = 1.25,
    BOUND_BACK_ALLOW = 2;
  /* Command phases in which the squad is moving on the enemy (16-squad-plan-stability.js). */
  var ADVANCING = { approach: 1, assault: 1, capture: 1, 'clear-town': 1, flank: 1 };
  /* Suppressing a known position. Capped per squad so it reads as suppressing fire rather than
     everyone emptying magazines into a hedge, and fired in short bursts so the sound of a
     firefight has a rhythm. */
  var MAX_SUPPRESSORS = 2,
    SUPPRESS_BURST = 3,
    SUPPRESS_PAUSE = 2.6,
    SUPPRESS_HOLD = 1.5;
  /* A man whose squad already knows where the enemy is reacts faster than the man who found them:
     he is looking the right way before his own target resolves. */
  var PREWARNED_REACT = 0.55;

  function SA() {
    return root.SquadAI;
  }
  function combatThreat(unit) {
    var api = SA(),
      d = api && api.threatDisposition ? api.threatDisposition(unit) : null;
    return d ? !!d.combatThreat : !!(unit && !unit.dead);
  }
  function field() {
    return root.BattleObstacleField;
  }
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function dist(ax, az, bx, bz) {
    return Math.hypot(ax - bx, az - bz);
  }
  function posOf(s) {
    return s.root.position;
  }
  function telemetry(battle, type, data) {
    if (root.BattleTelemetry) root.BattleTelemetry.record(type, data, battle);
  }
  function roleOf(s) {
    var roles = SA() && SA().ROLES;
    return (roles && roles[s.role]) || { speed: 2.9, visionRange: 140 };
  }
  function jitter(s, scale) {
    return ((+s.id || 0) % 7) * scale;
  }

  function state(s) {
    if (!s.eng)
      s.eng = {
        state: 'advance',
        since: 0,
        until: 0,
        stance: 'stand',
        stanceUntil: 0,
        stanceTrail: [],
        fireReadyAt: 0,
        threatSector: null,
        cover: null,
        lastSeen: null,
        lastSeenAt: -999,
        contactAt: -999,
        reviewAt: 0,
        setUpSince: 0,
        boundOrder: false,
        boundWaitFrom: 0,
        suppressOrder: false,
        burstLeft: SUPPRESS_BURST,
        burstPauseUntil: 0,
        freezeStartedAt: null,
        freezeUntil: 0,
        freezeDuration: 0,
        freezeDose: null,
        freezeEndedAt: null,
        freezeExitReason: null,
        freezeBrokenSince: null,
        freezeSpentBrokenSince: null
      };
    return s.eng;
  }
  function threatSector(s, target) {
    if (!s || !target || !target.root) return null;
    var p = posOf(s),
      t = posOf(target),
      a = Math.atan2(t.z - p.z, t.x - p.x);
    return ((Math.round((a + Math.PI) / (Math.PI / 4)) % 8) + 8) % 8;
  }
  function sectorDistance(a, b) {
    if (a == null || b == null) return 8;
    var d = Math.abs(a - b) % 8;
    return Math.min(d, 8 - d);
  }
  function facingError(s, pt) {
    if (!pt) return Math.PI;
    var p = posOf(s),
      dx = pt.x - p.x,
      dz = pt.z - p.z;
    if (Math.abs(dx) + Math.abs(dz) < 1e-5) return 0;
    var diff = Math.atan2(dx, dz) - (s.root.rotation.y || 0);
    return Math.abs(Math.atan2(Math.sin(diff), Math.cos(diff)));
  }

  function squadContact(s, battle) {
    var api = SA();
    return api && api.squadContact ? api.squadContact(s.squad, battle) : null;
  }
  /* What the fight has done to a man (module 17, `BattleSoldierMind`): numbers only. Engagement decides
     what they cost him, so stance and movement keep their one owner. Absent or off, every one is neutral. */
  function mind() {
    return root.BattleSoldierMind;
  }
  /* What his own stats are worth (module 10, `BattleSoldierStats`): a multiplier around 1, exactly 1 for an
     average man and when the module is absent or that stat's lever is off. */
  function statScale(s, effect) {
    var St = root.BattleSoldierStats;
    return St ? St.scale(s, effect) : 1;
  }
  /* Recognition takes this many times as long (1 for a steady man or with the lever off). */
  function stretch(s) {
    var M = mind();
    return M ? M.reactScale(s) : 1;
  }
  function recognition(s) {
    return (REACT[s.role] || 0.7) * stretch(s) * statScale(s, 'recognition');
  }
  /* Until when what he just saw has him frozen: no aimed fire, and no march if he was only advancing. */
  function shockUntil(s) {
    var M = mind();
    return M ? M.shockUntil(s) : 0;
  }
  /* Tell the soldier condition what a lever did to a decision made here. It counts them for the benchmark
     (module 17 `noteReact`, `noteShock`); nothing reads the count back, so no decision depends on it. */
  function noteRecognition(s, secs) {
    var M = mind();
    if (M) M.noteReact(s, secs);
  }
  function noteShock(s, kind) {
    var M = mind();
    if (M) M.noteShock(s, kind);
  }
  /* Recognition time, shortened when the squad has already called the contact. */
  function reactTime(s, battle) {
    var base = ((REACT[s.role] || 0.7) + jitter(s, 0.06)) * stretch(s) * statScale(s, 'recognition'),
      contact = squadContact(s, battle),
      secs = contact && contact.seenBy !== s.id ? base * PREWARNED_REACT : base;
    noteRecognition(s, secs);
    return secs;
  }
  /* Good news for the man, told to the soldier condition (modules/08-soldier-events.js `cover`, `survived`):
     reaching cover while he is under fire, and a spell of fire on him that ended without a wound. A kind nobody reads
     is not queued, so with `?stressMem=relief` off this is a test and nothing more. */
  function relief(kind, s, battle, payload) {
    var E = root.BattleSoldierEvents;
    if (E && E.wanted(kind)) E.post(s, battle, kind, payload);
  }
  function fireSpell(s, battle) {
    var E = root.BattleSoldierEvents;
    if (!E || !E.wanted('survived')) return;
    var e = state(s),
      now = battle.time,
      wounds = (s.wounds && s.wounds.length) || 0;
    if (s.suppressedUntil > now) {
      if (!e.fireSince) {
        e.fireSince = now;
        e.fireWounds = wounds;
      }
      return;
    }
    if (!e.fireSince) return;
    var secs = now - e.fireSince;
    e.fireSince = 0;
    if (wounds === e.fireWounds) relief('survived', s, battle, { seconds: secs });
  }
  /* Where a man without his own target should be looking and shooting. */
  function knownThreat(s, battle) {
    var contact = squadContact(s, battle);
    if (contact) return { x: contact.x, z: contact.z };
    var e = state(s);
    return e.lastSeen || null;
  }

  /* ---- urgency ------------------------------------------------------------------------------ */

  /* The one writer of `_combatUrgentUntil`, until when a man moves with urgency (sprint pace, module 11).
     Engagement's assault rush and the urgent-cover drill (module 44, on the afterDrill slot) come through
     here. */
  function markUrgent(s, battle, seconds) {
    s._combatUrgentUntil = battle.time + seconds;
  }
  function clearUrgent(s) {
    s._combatUrgentUntil = 0;
  }

  /* ---- the gun ---------------------------------------------------------------------------------
     The emplaced-gun flag (`setUp`, `eng.setUpSince`) and the readiness floor (`eng.fireReadyAt`) are
     Engagement's. Other layers that interrupt the gun (a reload or stoppage, a sidearm draw, a
     released firing station) say so through these calls, never by writing the fields. */
  // The gun is not set up any more: the emplacing clock is kept, as a reload or a stoppage leaves it.
  function interruptGun(s) {
    s.setUp = false;
  }
  // The gun is taken off its mount: set-up and the emplacing clock both restart (a sidearm draw).
  function unemplaceGun(s) {
    s.setUp = false;
    state(s).setUpSince = 0;
  }
  /* ---- firing stations (module 20 claims and releases them) ---------------------------------------- */
  // A firing station was claimed: the cover and bound/suppress orders he held are dropped.
  function stationClaimed(s) {
    if (!s.eng) return;
    s.eng.cover = null;
    s.eng.boundOrder = false;
    s.eng.suppressOrder = false;
  }
  // A firing station was released: the look direction it set goes, and the gun is no longer set up.
  function stationLeft(s) {
    s._faceHint = null;
    s.setUp = false;
  }
  /* Player camera input uses Engagement's existing facing hint instead of creating a second writer. */
  function playerFace(s, point) {
    if (!s) return false;
    s._faceHint = point && isFinite(+point.x) && isFinite(+point.z) ? { x: +point.x, z: +point.z } : null;
    return true;
  }
  // No shot before `until` (sim seconds); never brings the floor forward.
  function delayFire(s, until) {
    var e = s.eng; // a man Engagement has not met yet has no floor to raise
    if (!e) return;
    e.fireReadyAt = Math.max(+e.fireReadyAt || 0, until);
  }

  /* Is the squad on the enemy's heels: shooting at him now (`inContact`, fire control, which blinks with every gap in
     a hedge) or had eyes on him within the time a man holds his sector after losing sight (ALERT_HOLD), by the
     squad's own picture (Perception's record, with its age). An advancing man moves crouched while it is true.
     Read raw, `inContact` stood a whole squad up and knelt it again on every blink; with the reaction to a shared
     contact that was half of the stance changes left once cover was fixed. `?contactStance=0` is the raw rule,
     for a paired A/B. */
  var CONTACT_STANCE = !(
    typeof location !== 'undefined' && /[?&]contactStance=0\b/.test(location.search || '')
  );
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
  function fireControlOf(s) {
    return (s && s.squad && s.squad.fireControl) || null;
  }
  function fireAuthorized(s, battle) {
    var f = fireControlOf(s);
    if (!f || f.state === 'open') return true;
    if (underFireNow(s, battle)) return true;
    return f.state === 'precision' && String(f.shooterId) === String(s.id);
  }
  function fireControlPreparing(s, battle) {
    var f = fireControlOf(s);
    if (!f || underFireNow(s, battle)) return false;
    if (f.state === 'hold') return true;
    if (f.state !== 'precision') return false;
    if (String(f.shooterId) !== String(s.id)) return true;
    /* The designated marksman may leave preparation only when he personally has the shot. A shared
       contact alone keeps him low and ready instead of sending him back toward his formation slot. */
    return !(combatThreat(s.target) && fireControlReady(s, battle));
  }

  var CRAWL_FIT = !(typeof location !== 'undefined' && /[?&]crawlFit=0\b/.test(location.search || ''));
  // How much of his running pace a crawl covers (module 11's gait table), 0.23 without it.
  function crawlPace() {
    var I = root.BattleSoldierIndividuality;
    return (I && I.crawlFactor) || 0.23;
  }

  function canCrawlTo(s, battle, d) {
    var crawl = crawlPace() * Math.max(0.6, s.speed || 1);
    return d <= crawl * (state(s).until - battle.time) && (s.moveSpeed || 0) <= 2 * crawl;
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
  var COVER_FIRE = !(typeof location !== 'undefined' && /[?&]coverFire=0\b/.test(location.search || ''));
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
    var c = s.squad && (SA().squadContact ? SA().squadContact(s.squad, battle) : s.squad.contact),
      cp = e && e.cover,
      p = posOf(s);
    return {
      x: +p.x || 0,
      z: +p.z || 0,
      contact: !!(s.squad && s.squad.inContact),
      contactId: c && c.unit && c.unit.id != null ? String(c.unit.id) : null,
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
  /* Prone is only useful where it is survivable and the soldier can still shoot: long shots,
     real suppression, or cover low enough that crouching leaves him showing. */
  function fightingStance(s, battle, distanceToTarget, coverValue) {
    var suppressed = s.suppressedUntil > battle.time;
    if (!PRONE_ROLES[s.role]) return 'crouch';
    if (suppressed) return 'prone';
    if (distanceToTarget > Math.max(70, SA().engageRange(s) * 0.55)) return 'prone';
    if (coverValue > USEFUL_COVER) return 'prone'; // no cover at all: go to ground
    return 'crouch';
  }

  /* ---- cover ------------------------------------------------------------------------------- */

  /* Cover is a set of physical stand slots, shared by engagement and survival routes. Claims
     last for the actual bound/occupancy, never a clock lease. This owner chooses/reserves cover;
     Movement Resolver remains the only writer of physical destinations. */
  var coverClaims = new WeakMap(),
    COVER_SPACING = 1.8,
    COVER_CELL = 2;
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

  /* ---- fire discipline --------------------------------------------------------------------- */

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
  var STATES = {
    advance: {
      meaning: 'Follow the squad order, upright only on a quiet march',
      enteredBy: 'initialisation, alert sector clear, station release',
      exits: 'target -> orient; authorised bound -> bound/assault; shared contact -> alert',
      rate: '0.15 s',
      next: [
        'orient',
        'bound',
        'assault',
        'alert',
        'pinned',
        'engage',
        'withdraw',
        'station',
        'cower',
        'flee',
        'freeze',
        'rage'
      ]
    },
    orient: {
      meaning: 'Halt and recognise the target before firing',
      enteredBy: 'contact acquisition or a changed threat sector',
      exits: 'target lost -> alert; until elapsed -> decide; urgent cover -> bound',
      rate: '0.15 s',
      next: ['alert', 'pinned', 'engage', 'bound', 'withdraw', 'station', 'cower', 'flee', 'freeze', 'rage']
    },
    bound: {
      meaning: 'Move to chosen cover within its travel window',
      enteredBy: 'cover decision, authorised fireteam bound, urgent-cover request',
      exits: 'arrival -> engage; missing/unreachable/overdue cover -> decide',
      rate: '0.15 s',
      next: ['bound', 'alert', 'pinned', 'engage', 'withdraw', 'station', 'cower', 'flee', 'freeze', 'rage']
    },
    engage: {
      meaning: 'Hold position and stance, aim and fire',
      enteredBy: 'decide, cover arrival, assault end',
      exits: 'target lost -> alert; suppression -> pinned; review -> decide; order -> bound/assault',
      rate: '0.15 s; cover review every ENGAGE_REVIEW + id jitter',
      next: [
        'engage',
        'orient',
        'bound',
        'assault',
        'alert',
        'pinned',
        'withdraw',
        'station',
        'cower',
        'flee',
        'freeze',
        'rage'
      ]
    },
    pinned: {
      meaning: 'Stay low and still under suppression',
      enteredBy: 'suppressed in the open during decide/engage',
      exits: 'suppression lifted -> decide/alert; changed sector -> orient; urgent cover -> bound',
      rate: '0.15 s',
      next: [
        'pinned',
        'orient',
        'alert',
        'engage',
        'bound',
        'withdraw',
        'station',
        'cower',
        'flee',
        'freeze',
        'rage'
      ]
    },
    assault: {
      meaning: 'Complete one authorised short rush',
      enteredBy: 'ordered bound without cover',
      exits: 'arrival/close target/deadline/unreachable -> engage; no goal/target -> alert',
      rate: '0.15 s',
      next: ['alert', 'engage', 'bound', 'pinned', 'withdraw', 'station', 'cower', 'flee', 'freeze', 'rage']
    },
    alert: {
      meaning: 'Hold and watch the last known threat sector',
      enteredBy: 'target lost, shared-contact request',
      exits: 'reacquired -> orient; order -> bound/assault; expired quiet sector -> advance',
      rate: '0.15 s; suppressor renews until by SUPPRESS_HOLD',
      next: [
        'orient',
        'bound',
        'assault',
        'advance',
        'alert',
        'engage',
        'pinned',
        'withdraw',
        'station',
        'cower',
        'flee',
        'freeze',
        'rage'
      ]
    },
    withdraw: {
      meaning: 'Yield combat movement to the squad retreat',
      enteredBy: 'squad retreat override',
      exits: 'retreat ends -> advance handler; station claim -> station',
      rate: '0.15 s',
      next: [
        'withdraw',
        'station',
        'orient',
        'bound',
        'assault',
        'alert',
        'engage',
        'pinned',
        'cower',
        'flee',
        'freeze',
        'rage'
      ]
    },
    cower: {
      meaning: 'Go to ground under fire and stay down: no aimed fire, no advance (rattled, ?stressAct=cower)',
      enteredBy: 'rattled and under fire',
      exits:
        'calm below rattled, or fire quiet for COWER_QUIET -> advance; broken -> flee/freeze/rage; squad retreat -> withdraw',
      rate: '0.15 s',
      next: ['advance', 'withdraw', 'station', 'flee', 'freeze', 'rage']
    },
    flee: {
      meaning:
        'Break for good: leave the weapons, run to the last safe point, wait there for a retreating squad, run home when one comes, an enemy gets near or the wait is over, and be issued a weapon at base (broken, ?stressAct=flee)',
      enteredBy: 'broken, where there is something to run from',
      exits:
        'issued a weapon at base -> advance (a man of a retreating squad again); nothing else, not even calm',
      rate: '0.15 s',
      next: ['advance']
    },
    freeze: {
      meaning: 'Break and stop: dazed, down where he is, no fire, no orders (broken, ?stressAct=freeze)',
      enteredBy: 'broken, under fire or with nowhere to go',
      exits:
        'bounded freezeUntil expires -> reassess into cower/flee/rage or advance; squad retreat -> withdraw',
      rate: '0.15 s',
      next: ['advance', 'withdraw', 'station', 'cower', 'flee', 'rage']
    },
    rage: {
      meaning:
        "Break and charge the nearest enemy, firing on the move, and strike at arm's length (broken, ?stressAct=rage)",
      enteredBy: 'broken, an enemy within RAGE_RANGE and a weapon to use',
      exits:
        'calm below broken for REACT_MIN, or no enemy within RAGE_REACH -> advance; squad retreat -> withdraw',
      rate: '0.15 s',
      next: ['advance', 'withdraw', 'station']
    },
    station: {
      meaning: 'Use the claimed building firing station',
      enteredBy: 'tactical-position override',
      exits: 'station release -> advance; squad retreat -> withdraw',
      rate: '0.15 s',
      next: [
        'station',
        'withdraw',
        'advance',
        'orient',
        'bound',
        'assault',
        'alert',
        'engage',
        'pinned',
        'cower',
        'flee',
        'freeze',
        'rage'
      ]
    }
  };
  /* External requests have explicit entry effects. They formerly bypassed enter(), so applying
     normal drill resets here would change the fight. Keep their clocks and incidental fields
     exactly as before; the transition record adds provenance without changing moveReason. */
  var REQUESTS = {
    'urgent-cover': { from: ['pinned', 'engage', 'orient'], next: 'bound', reason: 'suppressed cover move' },
    'shared-contact': { from: ['advance'], next: 'alert', reason: 'new shared threat' },
    'station-release': { from: ['station'], next: 'advance', reason: 'firing station released' }
  };
  function requestState(s, battle, request, seconds) {
    var rule = REQUESTS[request],
      e = state(s);
    if (!rule) throw new Error('Unknown Engagement state request: ' + request);
    if (rule.from.indexOf(e.state) < 0)
      throw new Error('Illegal Engagement request transition: ' + e.state + ' / ' + request);
    transition(s, battle, rule.next, seconds, rule.reason, request);
  }
  function transition(s, battle, next, seconds, why, entry) {
    var e = state(s),
      from = e.state;
    entry = entry || 'drill';
    if (!STATES[from] || !STATES[next] || STATES[from].next.indexOf(next) < 0)
      throw new Error('Illegal Engagement transition: ' + from + ' -> ' + next);
    if (from !== next || entry !== 'drill')
      e.transition = { from: from, to: next, at: battle.time, reason: why || next, entry: entry };
    if (entry !== 'drill') {
      e.state = next;
      if (entry === 'station-release') {
        e.cover = null;
        e.setUpSince = 0;
      } else {
        e.since = battle.time;
        e.until = battle.time + seconds;
      }
      return;
    }
    if (e.state !== next) {
      /* A gun that leaves its firing position has to be emplaced again before it counts as set up. */
      if (next !== 'engage' && next !== 'station') e.setUpSince = 0;
      e.state = next;
      e.since = battle.time;
      e.moveReason = why || next;
      if (next !== 'assault') e.assaultGoal = null;
      e.urgentBound = false;
      if (why)
        telemetry(battle, 'decision-engagement', {
          soldier: s.id,
          faction: s.faction,
          role: s.role,
          squad: s.squad && s.squad.id,
          state: next,
          why: why
        });
    }
    e.until = battle.time + (seconds || 0);
  }
  /* Engagement describes combat movement; the Movement Resolver decides whether it wins. */
  function move(s, battle, p, kind, ttl) {
    var reason = state(s).moveReason || state(s).state;
    if (root.BattleMovementResolver)
      return root.BattleMovementResolver.proposeCombat(s, p, battle, kind, ttl, {
        source: 'engagement',
        reason: reason
      });
    /* Isolated unit harness fallback: production loads the resolver before any AI tick. */
    s.destination = { x: p.x, z: p.z };
    if (root.BattleNavigation) root.BattleNavigation.invalidateNavCache(s);
    return null;
  }
  function holdPosition(s, battle) {
    var p = posOf(s);
    move(s, battle, { x: p.x, z: p.z }, 'hold');
  }
  function orderPoint(s) {
    if (s._fireteamDestination) return s._fireteamDestination;
    if (s.orderDestination) return s.orderDestination;
    return SA().formationSlot(s.squad, s, s.slotIndex);
  }
  function followOrders(s, battle, urgent) {
    /* Squad Leader already published this persistent order. Micro relinquishes combat authority;
       it must not republish the Squad Leader's point once per soldier tick. */
    if (root.BattleMovementResolver) return;
    var pt = orderPoint(s);
    SA().setDestination(s, pt, battle, !!urgent);
  }

  /* The contact used for a fire-control preparation is still Perception's truth. A man with his own
     target uses it; everyone else can prepare on the squad's first-hand contact. */
  function fireControlTarget(s, battle) {
    if (combatThreat(s.target)) return s.target;
    var c = SA().squadContact ? SA().squadContact(s.squad, battle) : null;
    return c && combatThreat(c.unit) ? c.unit : null;
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
    var e = state(s),
      target = fireControlTarget(s, battle),
      known = target ? posOf(target) : knownThreat(s, battle),
      p = posOf(s),
      goal = target ? crestPrepPoint(s, target, battle) : { x: p.x, z: p.z };
    /* HOLD/PRECISION fire control outranks a locomotion drill. Before this handoff an active
       bound kept its cover/state while preparation temporarily forced prone; a one-tick fire-control
       gap resumed the old bound, producing bound -> prep -> bound posture loops. End that displacement
       once, release its cover claim, and re-enter through alert after preparation instead of resuming it. */
    if (e.state === 'bound') {
      releaseCover(s, battle, 'engagement');
      e.cover = null;
      transition(s, battle, 'alert', ALERT_HOLD, 'fire-control preparation interrupted bound');
    } else if (e.state === 'assault') {
      transition(s, battle, 'alert', ALERT_HOLD, 'fire-control preparation interrupted assault');
    }
    s.state = 'engage';
    s.setUp = false;
    if (known) s._faceHint = { x: known.x, z: known.z };
    /* Bridge the short contact/fire-control blink that used to produce
       prone -> crouch/stand -> prone loops. ALERT_HOLD is already the lifetime of the same
       remembered threat sector, so the posture commitment expires with that tactical memory. */
    commitStance(s, battle, 'prone', ALERT_HOLD, 'fire-control-prep');
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
      Math.max(0, root.BattleLeases.until(sq, 'bound') - battle.time),
      'authorized fireteam bound'
    );
    e.assaultGoal = next;
    assault(s, battle);
    return true;
  }

  /* ---- what stress does to a man (module 17 numbers, `?stressAct=cower,flee,freeze,rage`) ---------------------------
     On by default (`?stressAct=0` disables all; a comma list enables exactly those named). A rattled man under fire goes to ground (`cower`). A broken man stops
     fighting the way he was and does one of three things: runs (`flee`: to cover away from the threat, or the rear),
     stops where he is (`freeze`) or charges the nearest enemy (`rage`). Which one is his temper (three fixed unit
     hashes of his faction and id, module 17 `view`) weighed against the situation: running needs something to run from,
     stopping fits being under fire, charging needs an enemy within RAGE_RANGE and a weapon. Deterministic, never the
     combat RNG (a charge's blow does draw it, as a shot does: that is resolution, not the choice). They are states
     here, declared in STATES with their transitions; module 17 still writes only `mind`, and the Squad Leader hears of
     them through the squad report (`reacting`), not by reading a man. A squad that is already retreating is not
     reacted for: the retreat order outranks every drill, as it does for a man in a firefight. */
  var ACT = (function () {
    var m = /[?&]stressAct=([^&#]*)/.exec((typeof location !== 'undefined' && location.search) || ''),
      v = m ? decodeURIComponent(m[1]).toLowerCase() : 'all',
      out = { cower: false, flee: false, freeze: false, rage: false, any: false };
    if (v === '1' || v === 'on' || v === 'all') v = 'cower,flee,freeze,rage';
    if (v && v !== '0' && v !== 'off')
      v.split(',').forEach(function (k) {
        if (k in out && k !== 'any') out[k] = true;
      });
    out.any = out.cower || out.flee || out.freeze || out.rage;
    return out;
  })();
  var ACTING = { cower: 1, flee: 1, freeze: 1, rage: 1 };
  /* Rage lock (on by default since 2026-10-02; `?rageLock=0` is the old charge): the charge measures the enemy the break
     measured. Off, the break
     reads the squad's trouble and the charge his own target first, so a man whose target is past RAGE_REACH while the
     squad's contact is inside RAGE_RANGE breaks into rage and gives it up on the same tick, every tick (and each break
     renews the guard). On, the charge goes for the nearer of the two, so it cannot end on the tick it began. */
  var RAGE_LOCK = !/[?&]rageLock=0(?:&|#|$)/.test((typeof location !== 'undefined' && location.search) || '');
  /* Charge guard (on by default since 2026-10-02; `?rageGuard=0` is the old guard): the berserk guard lasts the charge,
     from the break until he is within MELEE_RANGE of the man he charges, he dies or the rage ends. Off, it lasts RAGE_GUARD_SECONDS from the
     break, whether or not the charge does. */
  var RAGE_GUARD_CHARGE = !/[?&]rageGuard=0(?:&|#|$)/.test(
    (typeof location !== 'undefined' && location.search) || ''
  );
  /* Rage trance (on by default since 2026-10-02; `?rageTrance=0` is the old rage): rage is a trance, final like a flee. Calm does not end it: only his death, or nobody left within
     RAGE_REACH to charge, and his squad's retreat does not take him back. For the whole of it he takes RAGE_TRANCE_GUARD
     of every hit, runs RAGE_SPEED faster (a leg wound does not slow him) and shoots a RAGE_AIM group. The damage the
     guard held back is a debt: when the trance ends and he is still alive, it comes due at once (`BattleWounds.succumb`),
     and if it takes him to the wound model's collapse line he dies of his wounds. Off, rage ends REACT_MIN after he calms below broken, a retreat ends it, and he moves and shoots as anyone. */
  var RAGE_TRANCE = !/[?&]rageTrance=0(?:&|#|$)/.test(
    (typeof location !== 'undefined' && location.search) || ''
  );
  var ACT_TUNING = {
    COWER_QUIET: 3, // cower: he stays down until the fire on him has been quiet this long
    REACT_MIN: 4, // a break lasts at least this long: nobody snaps out of it in a tick
    FLEE_ARRIVED: 1.5, // he is at his refuge this near it
    FLEE_REPICK: 4, // seconds without headway that count as one try ...
    FLEE_TRIES: 2, // ... after this many a man who cannot reach his refuge waits where he is
    FLED_WAIT: 180, // at his refuge a fled man waits this long for a retreating squad, then goes home on his own
    FLED_ENEMY_NEAR: 80, // an enemy known this near him sends him home at once
    FLED_SAFE: 80, // a refuge is safe when no known enemy is this near it, else he goes to his squad's home
    FLED_HOME_RADIUS: 12, // he is at base this near his squad's home point: he is issued a weapon again
    FLEE_NO_THREAT: 0.3, // running from nothing in particular: how much his temper to flee counts
    FREEZE_NOT_UNDER_FIRE: 0.7, // stopping when nobody is shooting at him: how much his temper to freeze counts
    TROUBLE_AGE: 20, // a sighting this old still counts as where the trouble is
    RAGE_RANGE: 120, // an enemy this near can set him off (about a quarter of a minute at a run)
    RAGE_REACH: 160, // and he gives up the charge when none is within this
    MELEE_RANGE: 2.2,
    MELEE_PERIOD: 1.4, // seconds between blows
    MELEE_HIT: 0.6, // chance a blow lands (the combat RNG, as a shot's roll is)
    MELEE_ENERGY: 0.8, // of a rifle round's wound
    MELEE_POWER: 0.6, // and of its chance to drop him
    RAGE_GUARD_SECONDS: 5, // a man who goes berserk takes less from every hit for this long ...
    RAGE_GUARD_SCALE: 0.25, // ... a quarter of the damage, of the chance to drop him and of the bleed
    RAGE_TRANCE_GUARD: 0.125, // ?rageTrance=1: in the trance the guard is stronger, an eighth of every hit
    RAGE_SPEED: 1.4, // ?rageTrance=1: his gait speed in the trance, against the same gait out of it
    RAGE_AIM: 0.5 // ?rageTrance=1: his shot group in the trance (a broken man's is up to 1.8 wider, a moving man's 1.55)
  };
  /* Engagement states in which a man is not fighting the way he was (the squad report's `reacting`). */
  function reactionState(s) {
    var e = s && s.eng;
    return e && ACTING[e.state] === 1 ? e.state : null;
  }
  function reacting(s) {
    return !!reactionState(s);
  }
  function noteAct(s, kind, what, dt) {
    var M = mind();
    if (M) M.noteAct(s, kind, what, dt);
  }
  /* A hit has landed on `victim` (the wound model asks before it applies one): how much of it he takes. A man who has
     just gone berserk (`rage`, for RAGE_GUARD_SECONDS from the moment he broke, whether or not the charge lasts; with
     `?rageGuard=1` while he is in rage and has not yet reached MELEE_RANGE) takes RAGE_GUARD_SCALE of it; anyone else
     all of it. `damage` is the hit's hp, for the count of what the guard saved. */
  function guardOnHit(victim, battle, damage) {
    var e = victim && victim.eng;
    if (!e) return 1;
    var held = RAGE_TRANCE
      ? e.state === 'rage'
      : RAGE_GUARD_CHARGE
        ? e.state === 'rage' && !e.guardReached
        : e.guardUntil > battle.time;
    if (!held) return 1;
    var scale = RAGE_TRANCE ? ACT_TUNING.RAGE_TRANCE_GUARD : ACT_TUNING.RAGE_GUARD_SCALE,
      saved = damage * (1 - scale);
    if (RAGE_TRANCE) e.guardDebt = (e.guardDebt || 0) + saved; // the trance only defers it
    noteAct(victim, 'rage', 'guard', saved);
    return scale;
  }
  /* `?rageTrance=1`: is he in the trance? Module 11 (his pace), the shot model (his group) and the Movement Resolver
     (his charge outranks his squad's retreat) ask; nobody reads his state for it. */
  function entranced(s) {
    return RAGE_TRANCE && !!(s && !s.dead && s.eng && s.eng.state === 'rage');
  }
  /* The wound model tells Engagement of every casualty; a man in rage who put him down is counted. */
  function noteKill(by) {
    if (by && !by.dead && by.eng && by.eng.state === 'rage') noteAct(by, 'rage', 'kill');
  }
  /* The trance is over and he is alive: what the guard held back comes due (the wound model applies it). */
  function succumb(s, battle) {
    var e = state(s),
      debt = e.guardDebt || 0,
      W = root.BattleWounds;
    e.guardDebt = 0;
    if (!RAGE_TRANCE || s.dead) return;
    noteAct(s, 'rage', 'over', debt);
    if (debt > 0 && W && W.succumb && W.succumb(s, battle, debt)) noteAct(s, 'rage', 'succumbed');
  }
  function armed(s) {
    return !!(s.weapon && !s.outOfAmmo && (!root.BattleAmmunition || root.BattleAmmunition.available(s)));
  }
  /* Where the trouble is: the squad's picture, else what he saw within TROUBLE_AGE, else nobody. */
  function trouble(s, battle) {
    var contact = squadContact(s, battle),
      e = state(s);
    if (contact) return { x: contact.x, z: contact.z };
    if (combatThreat(s.target)) return { x: posOf(s.target).x, z: posOf(s.target).z };
    if (e.lastSeen && battle.time - e.lastSeenAt <= ACT_TUNING.TROUBLE_AGE)
      return { x: e.lastSeen.x, z: e.lastSeen.z };
    return null;
  }
  /* How a broken man breaks: the best of his enabled reactions by temper x situation, ties in the order flee, freeze,
     rage; null when none is enabled or none has any weight. */
  function chooseBreak(s, battle, v, skipFreeze) {
    var p = posOf(s),
      th = trouble(s, battle),
      d = th ? dist(p.x, p.z, th.x, th.z) : Infinity,
      w = {
        flee: ACT.flee ? v.temper.flee * (th ? 1 : ACT_TUNING.FLEE_NO_THREAT) : 0,
        freeze:
          ACT.freeze && !skipFreeze
            ? v.temper.freeze * (v.underFire ? 1 : ACT_TUNING.FREEZE_NOT_UNDER_FIRE)
            : 0,
        rage: ACT.rage && d <= ACT_TUNING.RAGE_RANGE && armed(s) ? v.temper.rage : 0
      },
      best = null,
      order = ['flee', 'freeze', 'rage'];
    for (var i = 0; i < order.length; i++)
      if (w[order[i]] > 0 && (!best || w[order[i]] > w[best])) best = order[i];
    return best;
  }
  function beginFreeze(s, battle, v) {
    var e = state(s),
      M = mind(),
      profile = M ? M.freezeProfile(s, battle.time) : null,
      duration = profile && isFinite(+profile.duration) ? +profile.duration : ACT_TUNING.REACT_MIN;
    duration = clamp(duration, ACT_TUNING.REACT_MIN, 60);
    e.freezeStartedAt = battle.time;
    e.freezeDuration = duration;
    e.freezeUntil = battle.time + duration;
    e.freezeDose = profile;
    e.freezeEndedAt = null;
    e.freezeExitReason = null;
    e.freezeBrokenSince = v ? v.since : null;
    telemetry(battle, 'decision-freeze-start', {
      faction: s.faction,
      soldier: s.id,
      squad: s.squad ? s.squad.id : null,
      duration: duration,
      until: e.freezeUntil,
      dose: profile
    });
  }
  function finishFreeze(s, battle, why) {
    var e = state(s);
    if (e.freezeStartedAt == null || e.freezeEndedAt != null) return;
    e.freezeEndedAt = battle.time;
    e.freezeExitReason = why || 'ended';
    e.freezeSpentBrokenSince = e.freezeBrokenSince;
    telemetry(battle, 'decision-freeze-end', {
      faction: s.faction,
      soldier: s.id,
      squad: s.squad ? s.squad.id : null,
      startedAt: e.freezeStartedAt,
      endedAt: e.freezeEndedAt,
      duration: e.freezeDuration,
      reason: e.freezeExitReason
    });
  }
  /* Where a man who has broken for good runs first: the last place his squad stood out of contact with nobody known
     near (the Squad Leader's `safePoint`), unless the trouble is known to be near it, then its home. Chosen once. */
  function pickRefuge(s, battle) {
    var e = state(s),
      p = posOf(s),
      sq = s.squad,
      th = trouble(s, battle),
      safe = sq && sq.safePoint,
      home = e.fledHome || (sq && sq.home) || { x: p.x, z: p.z },
      pt = safe && !(th && dist(safe.x, safe.z, th.x, th.z) < ACT_TUNING.FLED_SAFE) ? safe : home;
    e.cover = null;
    e.refuge = { x: pt.x, z: pt.z };
    e.refugeBest = dist(p.x, p.z, e.refuge.x, e.refuge.z);
    e.refugeAt = battle.time;
  }
  function cower(s, battle) {
    s.state = 'engage';
    s.setUp = false;
    holdPosition(s, battle);
    commitStance(s, battle, PRONE_ROLES[s.role] ? 'prone' : 'crouch', PRONE_HOLD);
  }
  function freeze(s, battle) {
    /* A frozen man is out of the fight for this spell. Perception may have handed him a target earlier
       in the same AI tick, but he neither tracks it nor contributes a facing hint while dazed. Keeping
       either one made the stationary movement integrator turn the whole reaction pose toward enemies. */
    s.state = 'engage';
    s.setUp = false;
    if (SA().clearTarget) SA().clearTarget(s);
    s._faceHint = null;
    holdPosition(s, battle);
    commitStance(s, battle, 'crouch', 1.0);
  }
  /* Run to `goal`. True when he is there (within `radius`). Making no headway for FLEE_REPICK seconds counts a try; with
     `stayWhenStuck` he stays where he is after FLEE_TRIES (a man does not run off the map), else he keeps trying. */
  function runTo(s, battle, goal, radius, stayWhenStuck) {
    var e = state(s),
      p = posOf(s),
      d = dist(p.x, p.z, goal.x, goal.z);
    if (d <= radius) return true;
    if (d < e.refugeBest - 0.5) {
      e.refugeBest = d;
      e.refugeAt = battle.time;
    } else if (battle.time - e.refugeAt >= ACT_TUNING.FLEE_REPICK) {
      e.refugeAt = battle.time;
      if (stayWhenStuck && (e.refugeTries = (e.refugeTries || 0) + 1) > ACT_TUNING.FLEE_TRIES) return true;
    }
    markUrgent(s, battle, 0.5);
    commitStance(s, battle, s.suppressedUntil > battle.time ? 'crouch' : 'stand', 0.5);
    move(s, battle, goal, 'flee');
    return false;
  }
  /* He broke for good (`flee`): he leaves his weapons where he stands, tells the soldier condition (stress never
     drains below FLED_FLOOR) and runs. The Squad Leader hears of him through the squad report (`fled`) and lets him go
     from the roster; he stays on his own until a retreating squad picks him up or he reaches base. */
  function beginFled(s, battle) {
    var e = state(s),
      sq = s.squad,
      W = root.BattleWeapons;
    e.fledPhase = 'run';
    e.fledAt = battle.time;
    e.fledHome = sq && sq.home ? { x: sq.home.x, z: sq.home.z } : { x: posOf(s).x, z: posOf(s).z };
    e.refuge = null;
    e.refugeHere = false;
    e.refugeTries = 0;
    if (W && W.abandon) W.abandon(s);
    relief('fled', s, battle, {});
    telemetry(battle, 'decision-fled', {
      faction: s.faction,
      soldier: s.id,
      squad: sq ? sq.id : null,
      weaponLeft: !s.weapon
    });
  }
  function goHome(s, battle, why) {
    var e = state(s),
      p = posOf(s);
    e.fledPhase = 'home';
    e.fledAt = battle.time;
    e.refugeHere = false;
    e.refuge = null;
    e.refugeBest = dist(p.x, p.z, e.fledHome.x, e.fledHome.z);
    e.refugeAt = battle.time;
    noteAct(s, 'flee', why);
  }
  /* Called by the General when a retreating squad takes him in (status flows up, intent down): his wait is over and he
     goes home with them. Only a man waiting at his refuge can be picked up. */
  function releaseFled(s, battle, why) {
    var e = s && s.eng;
    if (!e || e.fledPhase !== 'wait') return false;
    goHome(s, battle, why || 'pickup');
    return true;
  }
  function fledPhase(s) {
    return (s && s.eng && s.eng.fledPhase) || null;
  }
  /* A man who has fled is on his own and outranks even his squad's retreat: he runs to his refuge, waits there for
     FLED_WAIT seconds for a retreating squad to take him in, and goes home when one does, when an enemy gets near him or
     when the wait is over. At base he is issued a weapon again and rejoins the fight only through reconstitution. */
  function fledTick(s, battle) {
    var e = state(s),
      p = posOf(s),
      now = battle.time,
      T = ACT_TUNING,
      dt = clamp(now - (e.fledTickAt || now), 0, 0.5);
    e.fledTickAt = now;
    noteAct(s, 'flee', 'time', dt);
    s.state = 'retreat';
    s.setUp = false;
    if (e.state !== 'flee') transition(s, battle, 'flee', 0, 'fled');
    if (e.fledPhase === 'run') {
      if (!e.refuge) pickRefuge(s, battle);
      if (!runTo(s, battle, e.refuge, T.FLEE_ARRIVED, true)) return;
      e.fledPhase = 'wait';
      e.fledAt = now;
      e.refugeHere = true;
      noteAct(s, 'flee', 'wait');
    }
    if (e.fledPhase === 'wait') {
      var th = trouble(s, battle);
      if (th && dist(p.x, p.z, th.x, th.z) <= T.FLED_ENEMY_NEAR) goHome(s, battle, 'enemy');
      else if (now - e.fledAt >= T.FLED_WAIT) goHome(s, battle, 'timeout');
      else {
        noteAct(s, 'flee', 'waiting', dt);
        move(s, battle, { x: p.x, z: p.z }, 'flee'); // a hold that beats his squad of one's order home
        commitStance(s, battle, PRONE_ROLES[s.role] && s.suppressedUntil > now ? 'prone' : 'crouch', 1.0);
        return;
      }
    }
    if (!runTo(s, battle, e.fledHome, T.FLED_HOME_RADIUS, false)) return;
    /* At base: a new weapon, and he is a man of a retreating squad again, recovering. */
    if (SA().rearm) SA().rearm(s, battle.scene, battle);
    noteAct(s, 'flee', 'rearmed');
    telemetry(battle, 'decision-fled-rearmed', {
      faction: s.faction,
      soldier: s.id,
      squad: s.squad ? s.squad.id : null,
      armed: !!s.weapon
    });
    e.fledPhase = null;
    e.fledHome = null;
    composed(s, battle, 'flee');
  }
  /* A blow at arm's length: a pseudo-shot through the wound model (a chest hit, less than a rifle round's energy). */
  function strike(s, battle, target) {
    var e = state(s),
      W = root.BattleWounds;
    if (battle.time < (e.strikeAt || 0) || !W || !combatThreat(target)) return;
    e.strikeAt = battle.time + ACT_TUNING.MELEE_PERIOD;
    noteAct(s, 'rage', 'strike');
    var roll = typeof battle.random === 'function' ? battle.random() : Math.random();
    if (roll >= ACT_TUNING.MELEE_HIT) return;
    noteAct(s, 'rage', 'hit');
    W.wound(s, target, battle, {
      zone: 'chest',
      energy: ACT_TUNING.MELEE_ENERGY,
      power: ACT_TUNING.MELEE_POWER
    });
  }
  /* Rounds on the move: the usual gates but the one about speed (the shot group is already wider for a man who moves). */
  function fireOnTheMove(s, battle) {
    if (!combatThreat(s.target) || s.reloading || battle.time < state(s).fireReadyAt) return false;
    if (facingError(s, posOf(s.target)) > AIM_CONE * 2) return false;
    var d = dist(posOf(s).x, posOf(s).z, posOf(s.target).x, posOf(s.target).z);
    if (d > SA().engageRange(s)) return false;
    SA().tryFire(s, battle);
    return true;
  }
  function rage(s, battle) {
    var p = posOf(s),
      th = trouble(s, battle),
      tg = combatThreat(s.target) ? s.target : null,
      goal = tg ? posOf(tg) : th,
      d = goal ? dist(p.x, p.z, goal.x, goal.z) : Infinity;
    if (RAGE_LOCK && th) {
      var dTrouble = dist(p.x, p.z, th.x, th.z);
      if (dTrouble < d) {
        goal = th;
        d = dTrouble;
      }
    }
    var dTarget = tg ? dist(p.x, p.z, posOf(tg).x, posOf(tg).z) : Infinity;
    s.state = 'engage';
    s.setUp = false;
    if (d > ACT_TUNING.RAGE_REACH) return false; // nobody to charge: it is over
    if (d <= ACT_TUNING.MELEE_RANGE) state(s).guardReached = true; // at arm's length: the charge's guard is over
    commitStance(s, battle, 'stand', 0.5);
    markUrgent(s, battle, 0.5);
    if (d > ACT_TUNING.MELEE_RANGE * 0.8) move(s, battle, { x: goal.x, z: goal.z }, 'rage-charge');
    else holdPosition(s, battle);
    if (tg) {
      fireOnTheMove(s, battle);
      if (dTarget <= ACT_TUNING.MELEE_RANGE) strike(s, battle, tg);
    }
    return true;
  }
  function composed(s, battle, from) {
    var e = state(s);
    e.cover = null;
    e.refuge = null;
    e.refugeHere = false;
    transition(s, battle, 'advance', 0, from + ' over');
  }
  /* Called each soldier tick when any reaction is on, after the squad-retreat check. True: the tick was his reaction's. */
  function reaction(s, battle) {
    var M = mind(),
      now = battle.time,
      v = M ? M.view(s, now) : null;
    if (!v) return false;
    var e = state(s),
      cur = ACTING[e.state] === 1 ? e.state : null,
      want = cur,
      spentThisBreak = e.freezeSpentBrokenSince != null && e.freezeSpentBrokenSince === v.since;

    /* Freeze is a bounded spell even if the man remains in the broken band. It does not end early
       merely because stress decays; when its one-time timer expires, reassess what he does next. */
    if (cur === 'freeze') {
      if (!(e.freezeUntil > 0)) e.freezeUntil = (e.reactSince || now) + ACT_TUNING.REACT_MIN;
      if (now >= e.freezeUntil) {
        var next = null;
        if (v.band >= 3) {
          next = chooseBreak(s, battle, v, true);
          if (!next && v.underFire && ACT.cower) next = 'cower';
        } else if (v.band >= 2 && v.underFire && ACT.cower) next = 'cower';
        var reason =
          v.band >= 3
            ? 'duration-expired-broken:' + (next || 'advance')
            : 'duration-expired-' + (v.band >= 2 ? 'rattled' : 'composed') + ':' + (next || 'advance');
        finishFreeze(s, battle, reason);
        want = next;
      }
    } else if (v.band >= 3) {
      if (!cur || cur === 'cower')
        want = chooseBreak(s, battle, v, spentThisBreak) || (cur === 'cower' ? 'cower' : null);
    } else if (cur === 'cower') {
      if (v.underFire) e.fearAt = now;
      if (v.band < 2 || now - e.fearAt >= ACT_TUNING.COWER_QUIET) want = null;
    } else if (cur) {
      /* A trance (`?rageTrance=1`) does not end on calm: only rage() ends it. */
      if (!(RAGE_TRANCE && cur === 'rage') && now - e.reactSince >= ACT_TUNING.REACT_MIN) want = null;
    } else if (v.band >= 2 && v.underFire && ACT.cower) want = 'cower';

    if (want !== cur) {
      if (!want) {
        composed(s, battle, cur);
        return false;
      }
      /* A man leaving a firing station is released from it first: a held station would pull him back. */
      var T = root.BattleTacticalPositions;
      if (T && T.current(s)) T.release(s, battle, 'broken');
      transition(s, battle, want, 0, want === 'cower' ? 'rattled under fire' : 'broke: ' + want);
      e.reactSince = now;
      e.fearAt = now;
      e.actAt = now;
      e.refuge = null;
      e.refugeHere = false;
      e.refugeTries = 0;
      e.boundOrder = false;
      e.suppressOrder = false;
      e.cover = null;
      if (want === 'rage') {
        e.guardUntil = now + ACT_TUNING.RAGE_GUARD_SECONDS;
        e.guardReached = false;
        e.guardDebt = 0;
      }
      if (want === 'flee') beginFled(s, battle);
      if (want === 'freeze') beginFreeze(s, battle, v);
      noteAct(s, want, 'start');
    }
    if (!want) return false;
    var dt = clamp(now - (e.actAt || now), 0, 0.5);
    e.actAt = now;
    noteAct(s, want, 'time', dt);
    if (want === 'cower') cower(s, battle);
    else if (want === 'freeze') freeze(s, battle);
    else if (want === 'flee') fledTick(s, battle);
    else if (!rage(s, battle)) {
      composed(s, battle, 'rage');
      succumb(s, battle);
      return false;
    }
    return true;
  }

  /* ---- per-soldier update ------------------------------------------------------------------ */

  /* Declared extension point: drills layered on the state machine attach here (see squad-ai.js
     extensionPoints) instead of replacing updateSoldier. */
  var EXT = root.BattleExtensionPoints
    ? root.BattleExtensionPoints({ afterDrill: ['combat-urgency'] })
    : { attach: function () {}, run: function () {}, order: {} };
  function updateSoldier(s, battle) {
    var result = runDrill(s, battle);
    /* Combat-urgency/shared-contact drills must not re-arm the facing layer after freeze() deliberately
       cleared it. Other reactions keep their existing extension behavior. */
    if (s && battle && !s.dead && reactionState(s) !== 'freeze') EXT.run('afterDrill', s, battle);
    return result;
  }
  function runDrill(s, battle) {
    var e = state(s),
      role = roleOf(s),
      now = battle.time;
    currentCover(s, battle);
    fireSpell(s, battle);

    if (s.target) {
      e.contactAt = e.state === 'advance' || e.state === 'alert' ? now : e.contactAt;
      e.lastSeen = { x: posOf(s.target).x, z: posOf(s.target).z };
      e.lastSeenAt = now;
      var sector = threatSector(s, s.target);
      if (e.threatSector != null && sectorDistance(e.threatSector, sector) > 1) {
        /* A threat from a materially different direction is a fresh problem: re-orient. */
        e.fireReadyAt = Math.max(e.fireReadyAt, now + AIM_SETTLE * statScale(s, 'settle'));
        if (e.state === 'engage' || e.state === 'pinned') {
          var secs = recognition(s);
          noteRecognition(s, secs);
          transition(s, battle, 'orient', secs, 'new threat sector');
        }
      }
      e.threatSector = sector;
    }

    /* Squad withdrawal and claimed building stations outrank every individual drill. Both go
       through transition() so the state is honest: the squad counters and the operator readout read it,
       and a man coming off a retreat re-decides instead of resuming a stale firefight state. */
    if (e.fledPhase) return fledTick(s, battle);
    if (entranced(s) && reaction(s, battle)) return; // the trance outranks his squad's retreat, as a flee does
    if (s.squad && s.squad.state === 'retreat') {
      if (reactionState(s) === 'freeze') finishFreeze(s, battle, 'squad-retreat');
      transition(s, battle, 'withdraw', 0, 'squad withdrawing');
      return withdraw(s, battle);
    }
    if (ACT.any && reaction(s, battle)) return;
    if (root.BattleTacticalPositions && root.BattleTacticalPositions.update(s, battle)) {
      transition(s, battle, 'station', 0, 'firing station');
      return station(s, battle);
    }
    /* A first contact is not automatically a trigger pull. While the Squad Leader is holding fire,
       everyone not specifically chosen for a precision shot gets low, faces the contact and creeps
       only far enough to establish a prone line over a crest. */
    if (fireControlPreparing(s, battle)) return prepareFireControl(s, battle);

    switch (e.state) {
      case 'orient':
        return orient(s, battle);
      case 'bound':
        return bound(s, battle);
      case 'engage':
        return engage(s, battle);
      case 'pinned':
        return pinned(s, battle);
      case 'assault':
        return assault(s, battle);
      case 'alert':
        return alert(s, battle);
      default:
        return advance(s, battle);
    }
  }

  function advance(s, battle) {
    var e = state(s);
    s.state = 'advance';
    s.setUp = false;
    if (orderedBound(s, battle)) return;
    if (s.target) {
      transition(s, battle, 'orient', reactTime(s, battle), 'contact');
      return orient(s, battle);
    }
    /* Frozen by what he just saw (a friend down beside him, the leader falling): still and down on one
       knee for the moment it lasts. The hold is renewed each tick and lapses with the shock. */
    if (battle.time < shockUntil(s)) {
      noteShock(s, 'advance');
      var here = posOf(s);
      move(s, battle, { x: here.x, z: here.z }, 'hold', 0.25);
      commitStance(s, battle, 'crouch', Math.max(0.5, shockUntil(s) - battle.time));
      return;
    }
    /* Upright only on a quiet march: under fire, or while the squad is on the enemy's heels, he moves
       crouched rather than standing for the beat between two contacts. */
    var low = s.suppressedUntil > battle.time || squadOnHeels(s, battle);
    if (!holdStance(s, battle)) commitStance(s, battle, low ? 'crouch' : 'stand', 1.0);
    followOrders(s, battle, false);
  }

  /* Recognize, stop, face the threat, weapon up. No shooting during this window - this is the
     beat that was missing and that made the old behavior read as "aiming while strolling". */
  function orient(s, battle) {
    var e = state(s);
    s.state = 'engage';
    if (!s.target) {
      transition(s, battle, 'alert', ALERT_HOLD, 'target lost');
      return alert(s, battle);
    }
    holdPosition(s, battle);
    commitStanceRespectHold(
      s,
      battle,
      seeingStance(s, battle, 'crouch'),
      Math.max(0.8, e.until - battle.time),
      'orient'
    );
    e.fireReadyAt = Math.max(e.fireReadyAt, e.since + recognition(s));
    if (battle.time >= e.until) decide(s, battle, 'oriented');
  }

  /* The one place that answers "so what do I do about this enemy?". */
  function decide(s, battle, why) {
    var e = state(s),
      F = field(),
      p = posOf(s),
      target = s.target;
    if (!target) {
      transition(s, battle, 'alert', ALERT_HOLD, 'no target');
      return;
    }
    var d = dist(p.x, p.z, posOf(target).x, posOf(target).z),
      role = roleOf(s);
    var here = F ? F.coverPotentialAt(battle.obstacles, p.x, p.z) : 1;
    var suppressed = s.suppressedUntil > battle.time;

    if (suppressed && here > OPEN_COVER && PRONE_ROLES[s.role]) {
      transition(s, battle, 'pinned', 0, 'pinned in the open');
      return pinned(s, battle);
    }
    if (here <= USEFUL_COVER) {
      transition(s, battle, 'engage', 0, why + ': cover here');
      return engage(s, battle);
    }

    /* A man whose squad is advancing and who is not under fire takes cover ahead of him or beside
       him, not behind (backward-orders probe: "oriented: moving to cover" was the Micro producer
       that walked men back behind their fireteam's line). Under fire any cover is survival. */
    var fwd = !suppressed && ADVANCING[(s.squad && s.squad.commandPhase) || ''] ? boundForward(s) : null;
    var cover = findCover(s, battle, {
      maxRange: suppressed ? COVER_RANGE_UNDER_FIRE : COVER_RANGE,
      evade: suppressed,
      notBehind: fwd ? { axis: fwd, allow: BOUND_BACK_ALLOW } : null
    });
    if (cover) {
      e.cover = cover;
      transition(
        s,
        battle,
        'bound',
        Math.max(3, cover.distance / Math.max(0.6, s.speed * 0.6) + 2.5),
        why + ': moving to cover'
      );
      telemetry(battle, 'decision-cover', {
        soldier: s.id,
        faction: s.faction,
        role: s.role,
        squad: s.squad && s.squad.id,
        distance: +cover.distance.toFixed(1),
        quality: +cover.quality.toFixed(2),
        coverType: cover.type,
        suppressed: suppressed
      });
      return bound(s, battle);
    }
    /* Nothing to hide behind. Closing the distance is only sane with an order to do it; otherwise
       go to ground and shoot from where he is. */
    transition(s, battle, 'engage', 0, why + ': fight from the open');
    return engage(s, battle);
  }

  function bound(s, battle) {
    var e = state(s),
      cover = e.cover;
    s.state = 'engage';
    s.setUp = false;
    if (!cover) {
      decide(s, battle, 'bound without cover');
      return;
    }
    /* Structured recovery consumed here: repeated no-progress against this cover flags it
       unreachable, so abandon the bound and re-decide (alternate cover or fight from here)
       instead of cycling the same destination forever. */
    if (root.BattleMovementProgress && root.BattleMovementProgress.takeUnreachable(s)) {
      root.BattleMovementProgress.noteFailure(s, battle, cover, 'bound-unreachable');
      decide(s, battle, 'bound unreachable');
      return;
    }
    if (
      cover &&
      root.BattleMovementProgress &&
      !root.BattleMovementProgress.candidateAllowed(s, battle, cover)
    ) {
      decide(s, battle, 'cover suppressed');
      return;
    }
    var p = posOf(s),
      d = dist(p.x, p.z, cover.x, cover.z);
    if (d <= (cover.slotId ? 0.35 : COVER_ARRIVED)) {
      if (root.BattleMovementProgress) root.BattleMovementProgress.clearFailuresNear(s, battle, cover);
      if (s.suppressedUntil > battle.time) relief('cover', s, battle, { seconds: battle.time - e.since });
      holdPosition(s, battle);
      e.stanceUntil = 0; // the run's crouch ends here; engage picks the stance he fights in
      transition(s, battle, 'engage', 0, 'reached cover');
      return engage(s, battle);
    }
    /* A bound is a dash with its own window (enter: distance over speed plus slack). One that
       overruns it without arriving is not getting there - blocked short of the slot by another
       body, a push, or a stronger order in the resolver - and movement progress cannot see it
       inside its 3 m near band. Treat it as the unreachable case above: mark this cover failed for
       a while and re-decide from where he stands (a live battle held men in `bound` for minutes). */
    if (battle.time >= e.until) {
      if (root.BattleMovementProgress)
        root.BattleMovementProgress.noteFailure(s, battle, cover, 'bound-overran');
      decide(s, battle, 'bound overran');
      return;
    }
    var suppressed = s.suppressedUntil > battle.time,
      /* An urgent cover move (module 44's drill) is a crouched run, never a crawl. A crawl is only for cover he
         crawl to inside this bound's window, and only from a standing start: the window is sized for a run, a
         crawl covers 0.23 of it, and the old `d < 14` sent men to ground at a run (the dive and slide) for
         cover that took 20 s to crawl to in a 10 s window ('bound overran'). `?crawlFit=0` is the old rule. */
      crawl =
        suppressed &&
        PRONE_ROLES[s.role] &&
        !e.urgentBound &&
        (CRAWL_FIT ? canCrawlTo(s, battle, d) : d < 14);
    commitStance(s, battle, crawl ? 'crawl' : 'crouch', Math.max(1, e.until - battle.time));
    move(s, battle, { x: cover.x, z: cover.z }, 'cover-bound');
  }

  function engage(s, battle) {
    var e = state(s),
      p = posOf(s);
    s.state = 'engage';
    if (orderedBound(s, battle)) return;
    if (!s.target) {
      transition(s, battle, 'alert', ALERT_HOLD, 'target lost');
      return alert(s, battle);
    }
    var suppressed = s.suppressedUntil > battle.time,
      F = field(),
      here = F ? F.coverPotentialAt(battle.obstacles, p.x, p.z) : 1;
    if (suppressed && here > OPEN_COVER && PRONE_ROLES[s.role]) {
      transition(s, battle, 'pinned', 0, 'pinned');
      return pinned(s, battle);
    }

    var d = dist(p.x, p.z, posOf(s.target).x, posOf(s.target).z);
    holdPosition(s, battle);
    if (!holdStance(s, battle))
      commitStance(s, battle, seeingStance(s, battle, fightingStance(s, battle, d, here)));
    if (SA().isMachineGun(s)) {
      if (!e.setUpSince) e.setUpSince = battle.time;
      s.setUp = battle.time - e.setUpSince > GUNNER_SETUP * statScale(s, 'setup');
    } else s.setUp = false;
    tryFire(s, battle);
    if (battle.time >= (e.reviewAt || 0)) {
      e.reviewAt = battle.time + ENGAGE_REVIEW + jitter(s, 0.3);
      if (here > OPEN_COVER) decide(s, battle, 'review');
    }
  }

  /* Suppressed in the open: flat, still, and only shooting in the gaps between bursts. */
  function pinned(s, battle) {
    var e = state(s);
    s.state = 'pinned';
    s.setUp = false;
    holdPosition(s, battle);
    commitStance(s, battle, PRONE_ROLES[s.role] ? 'prone' : 'crouch', PRONE_HOLD);
    if (s.suppressedUntil - battle.time < 0.4) tryFire(s, battle);
    if (s.suppressedUntil <= battle.time) {
      if (!s.target) {
        transition(s, battle, 'alert', ALERT_HOLD, 'suppression lifted, no target');
        return alert(s, battle);
      }
      decide(s, battle, 'suppression lifted');
    }
  }

  function assault(s, battle) {
    var e = state(s);
    s.state = 'assault';
    s.setUp = false;
    /* A committed rush is locomotion, not aim: losing sight for a beat must not cancel it.
       Aim tracking (target/lastSeen) may flicker, but the assaultGoal stands until arrival,
       the window lapses, or recovery reports it unreachable. Only a rush that never had a
       live target/goal falls back to alert. */
    if (!combatThreat(s.target) && !e.assaultGoal) {
      transition(s, battle, 'alert', ALERT_HOLD, 'target lost before rush');
      return alert(s, battle);
    }
    if (root.BattleMovementProgress && root.BattleMovementProgress.takeUnreachable(s)) {
      if (e.assaultGoal)
        root.BattleMovementProgress.noteFailure(s, battle, e.assaultGoal, 'assault-unreachable');
      transition(s, battle, 'engage', 0, 'assault unreachable');
      return engage(s, battle);
    }
    var p = posOf(s),
      hasTarget = combatThreat(s.target),
      t = hasTarget ? posOf(s.target) : null,
      d = t ? dist(p.x, p.z, t.x, t.z) : Infinity;
    commitStance(s, battle, 'crouch', Math.max(1, e.until - battle.time));
    if (!e.assaultGoal) {
      if (!t) {
        transition(s, battle, 'alert', ALERT_HOLD, 'assault target unavailable');
        return alert(s, battle);
      }
      e.assaultGoal = { x: p.x + (t.x - p.x) * 0.55, z: p.z + (t.z - p.z) * 0.55 };
    }
    var arrived = Math.hypot(p.x - e.assaultGoal.x, p.z - e.assaultGoal.z) <= BOUND_ARRIVED;
    if (arrived || d < 12 || battle.time >= e.until) {
      transition(s, battle, 'engage', 0, 'assault complete');
      return engage(s, battle);
    }
    markUrgent(s, battle, 0.5);
    move(s, battle, e.assaultGoal, 'assault-rush');
    if (hasTarget) tryFire(s, battle);
  }

  /* Contact broken. Hold the sector briefly rather than instantly resuming the march, which is
     what produced the old "walk, aim, walk, aim" cycle. */
  function alert(s, battle) {
    var e = state(s);
    s.state = 'alert';
    s.setUp = false;
    if (orderedBound(s, battle)) return;
    if (s.target) {
      transition(s, battle, 'orient', reactTime(s, battle) * 0.6, 're-acquired');
      return orient(s, battle);
    }
    holdPosition(s, battle);
    /* The squad's shared contact outranks this man's own last sighting: somebody else may have
       eyes on right now. */
    var aim = knownThreat(s, battle);
    /* Holding the sector he looks at where the enemy was: low, but not so low a wall hides it from him. */
    if (!holdStance(s, battle))
      commitStance(s, battle, seeingStance(s, battle, 'crouch', aim && { root: { position: aim } }), 2.0);
    s._faceHint = aim && facingError(s, aim) > AIM_CONE ? aim : null;
    if (e.suppressOrder && aim) {
      /* A designated suppressor holds the firing line for as long as the contact is current,
         rather than wandering off mid-burst when the alert timer lapses. */
      e.until = Math.max(e.until, battle.time + SUPPRESS_HOLD);
      s.state = 'suppress';
      suppress(s, battle, aim);
    }
    if (battle.time >= e.until) {
      e.cover = null;
      e.threatSector = null;
      s._faceHint = null;
      e.suppressOrder = false;
      transition(s, battle, 'advance', 0, 'sector clear');
    }
  }

  function withdraw(s, battle) {
    var e = state(s);
    s.state = 'retreat';
    s.setUp = false;
    e.cover = null;
    /* Retreat posture follows the broader "under fire" window, then lets the stance lease decay.
       A suppression timer ending for one tick is no longer permission to stand and immediately kneel again. */
    var underFire = underFireNow(s, battle);
    commitStanceRespectHold(
      s,
      battle,
      underFire ? 'crouch' : 'stand',
      underFire ? 1.0 : 0.5,
      underFire ? 'withdraw:under-fire' : 'withdraw:clear'
    );
    followOrders(s, battle, true);
    if (s.target && dist(posOf(s).x, posOf(s).z, posOf(s.target).x, posOf(s.target).z) < 35)
      tryFire(s, battle);
  }

  /* A window is a firing port (`station.port`, built by Navigation from the opening's own metadata; the
     Tactical Positions manager owns the assignment and the bounded pose). Here he posts up on it:
     the stance the sill fits, facing out through the aperture, and each tick the aperture is asked
     whether his eye and his bore really pass through it. When they do not, the pose is corrected inside
     the port's bounds (forward to the wall, along the sill, a stance the port lists) and the post is
     kept. Target loss, a target outside the sector and a closed line never release it: only the manager
     does that. */
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

  /* ---- per-squad update ------------------------------------------------------------------- */

  /* Who puts fire on the last known position. Preference order: the machine gun first (it is the
     suppressive weapon and it is already static), then whoever was doing it last tick so the job
     does not hop around the squad, then by slot. Men who can see a target of their own, men who
     are moving, pinned, withdrawing or holding a firing station are all excluded - and during a
     bound the movers never double as the base of fire. */
  function assignSuppressors(sq, battle, members, known) {
    var contact = known !== undefined ? known : SA().squadContact ? SA().squadContact(sq, battle) : null,
      i,
      s,
      chosen = 0;
    for (i = 0; i < members.length; i++) {
      s = members[i];
      if (!s.dead && !s.isPlayer) state(s).suppressOrder = false;
    }
    if (contact) {
      var bounding = root.BattleLeases.holds(sq, 'bound', battle.time),
        candidates = [];
      var point = { x: contact.x, z: contact.z },
        api = SA();
      for (i = 0; i < members.length; i++) {
        s = members[i];
        if (
          s.dead ||
          s.isPlayer ||
          s.target ||
          (root.BattleTacticalPositions && root.BattleTacticalPositions.current(s)) ||
          (root.BattleAmmunition && !root.BattleAmmunition.available(s))
        )
          continue;
        if (s.suppressedUntil > battle.time) continue;
        var es = state(s);
        if (
          es.state === 'bound' ||
          es.state === 'pinned' ||
          es.state === 'withdraw' ||
          es.state === 'assault' ||
          ACTING[es.state] === 1
        )
          continue;
        if (bounding && es.boundOrder) continue;
        /* No job for a man who cannot reach it - he keeps advancing instead of standing still. */
        if (api.canSuppress && !api.canSuppress(s, point, battle)) continue;
        candidates.push(s);
      }
      candidates.sort(function (a, b) {
        var ga = SA().isMachineGun(a) ? 0 : 1,
          gb = SA().isMachineGun(b) ? 0 : 1;
        if (ga !== gb) return ga - gb;
        var sa = state(a).suppressOrder ? 0 : 1,
          sb = state(b).suppressOrder ? 0 : 1;
        if (sa !== sb) return sa - sb;
        return (+a.slotIndex || 0) - (+b.slotIndex || 0);
      });
      for (i = 0; i < candidates.length && chosen < MAX_SUPPRESSORS; i++) {
        state(candidates[i]).suppressOrder = true;
        chosen++;
      }
    }
    if (chosen !== (sq.suppressorCount || 0) && (chosen || sq.suppressorCount))
      telemetry(battle, 'decision-suppress', {
        faction: sq.faction,
        squad: sq.id,
        suppressors: chosen,
        contactAge: contact ? +(battle.time - contact.at).toFixed(1) : null
      });
    sq.suppressorCount = chosen;
    return chosen;
  }

  /* Squad contact report. Micro state flows up: who can see the enemy, who is pinned, who is
     actually putting rounds out (the base of fire). The Squad Leader (16-squad-plan-stability.js) reads
     this report to decide fire and movement; Engagement only executes a bound it is ordered to. */
  function updateSquad(sq, battle) {
    if (!sq || !battle) return null;
    var members = sq.members || [],
      contact = 0,
      effective = 0,
      pinnedCount = 0,
      underFireCount = 0,
      fireSupport = [],
      i,
      s;
    /* Suppression is assigned off the shared contact, not off current visibility, so it keeps
       working in the gap where nobody can see anyone - which is exactly when a squad used to fall
       silent. Assigning before the counting below means a suppressor counts toward this tick's
       base of fire rather than the previous one's. */
    var known = SA().squadContact ? SA().squadContact(sq, battle) : null,
      controlled = !!(sq.fireControl && sq.fireControl.state !== 'open'),
      preparingContact = !!(
        controlled &&
        known &&
        known.unit &&
        combatThreat(known.unit) &&
        !known.heard &&
        !known.relayedFrom
      );
    /* A hold/precision order is silent preparation. Clear old suppressor jobs while it is active;
       otherwise a stale suppressOrder would make the squad look like a base of fire before permission. */
    var suppressing = assignSuppressors(sq, battle, members, controlled ? null : known),
      broken = [],
      fled = [];
    for (i = 0; i < members.length; i++) {
      s = members[i];
      if (s.dead) continue;
      /* A possessed soldier can contribute contact/under-fire facts upward, but squad Micro must not
         write or interpret his Engagement state while the human owns him. */
      if (s.isPlayer) {
        if (s.target) contact++;
        if (underFireNow(s, battle)) underFireCount++;
        continue;
      }
      var e = state(s);
      if (ACTING[e.state] === 1) broken.push(s);
      if (e.fledPhase === 'run' || e.fledPhase === 'wait') fled.push(s); // for the Squad Leader to let go from the roster
      if (s.target) contact++;
      if (underFireNow(s, battle)) underFireCount++;
      if (e.state === 'pinned' || s.suppressedUntil > battle.time) pinnedCount++;
      /* A man putting rounds on the known position IS the base of fire - that is the entire point
         of him doing it. Counting only men with a visible target meant a squad whose line of sight
         kept blinking could never satisfy the bound requirement and simply stopped advancing. */ else if (
        !s.reloading &&
        !s.clearingStoppage &&
        (!root.BattleAmmunition || root.BattleAmmunition.available(s))
      ) {
        var position = root.BattleTacticalPositions && root.BattleTacticalPositions.current(s);
        if (
          e.state === 'engage' ||
          (e.state === 'station' && position && position.occupiedAt != null) ||
          e.suppressOrder
        ) {
          effective++;
          fireSupport.push(s);
        }
      }
    }
    sq.contactCount = contact;
    sq.pinnedCount = pinnedCount;
    sq.effectiveCount = effective;
    var wasInContact = !!sq.inContact;
    /* Contact means a current target, a real suppressor, or somebody presently taking fire. Bare
       remembered knowledge still does not count. Fire-control preparation is the other deliberate exception:
       going prone behind a crest can make every current target blink out for a tick, and that must not cancel
       the Squad Leader's live hold/precision/reposition order. Recent first-hand contact keeps that preparation
       alive; heard/relayed word alone cannot freeze a squad in place. Incoming fire must keep contact live so
       the Squad Leader can escalate HOLD FIRE to OPEN FIRE instead of clearing the command before reading it. */
    sq.inContact = contact > 0 || suppressing > 0 || underFireCount > 0 || preparingContact;
    var started = sq.inContact && !wasInContact;
    if (started) {
      sq.contactSince = battle.time;
      telemetry(battle, 'decision-contact', {
        faction: sq.faction,
        squad: sq.id,
        phase: sq.commandPhase || '',
        contacts: contact
      });
    }
    if (!sq.inContact) sq.contactSince = null;
    return {
      contactStarted: started,
      effective: effective,
      pinned: pinnedCount,
      underFire: underFireCount,
      fireSupport: fireSupport,
      reacting: broken,
      fled: fled
    };
  }
  /* The Squad Leader's bound order, stored as Micro state and consumed once by orderedBound(). */
  function orderBound(movers) {
    for (var i = 0; i < movers.length; i++) {
      if (movers[i].isPlayer) continue;
      var e = state(movers[i]);
      e.boundOrder = true;
      e.suppressOrder = false;
    }
  }
  function clearBoundOrders(sq) {
    var a = (sq && sq.members) || [],
      M = mind();
    for (var i = 0; i < a.length; i++)
      if (!a[i].dead && !a[i].isPlayer) {
        if (M && state(a[i]).boundWaitFrom) M.noteLapse(a[i]); // he was still waiting: that bound never began
        state(a[i]).boundOrder = false;
        state(a[i]).boundWaitFrom = 0; // a wait belongs to the order it was made for
      }
  }

  function resetSoldier(s) {
    s.eng = null;
    s._faceHint = null;
    s.prone = false;
    s.crawling = false;
    s.tacticalCrouch = false;
    s.setUp = false;
  }
  function resetSquad(sq) {
    sq.inContact = false;
    sq.contactSince = null;
    sq.contactCount = 0;
    sq.contact = null;
    sq.suppressorCount = 0;
  }

  root.BattleCoverPositions = {
    warm: function (battle) {
      var c = coverRegistry(battle);
      if (!c.slots) buildCoverSlots(c);
      return c.slotCount;
    },
    candidates: coverCandidates,
    reserve: reserveCover,
    release: releaseCover,
    current: currentCover,
    snapshot: coverSnapshot,
    spacing: COVER_SPACING
  };

  root.BattleEngagement = {
    states: STATES,
    stateRequests: REQUESTS,
    requestState: requestState,
    extend: EXT.attach,
    extensionOrder: EXT.order,
    updateSoldier: updateSoldier,
    updateSquad: updateSquad,
    orderBound: orderBound,
    clearBoundOrders: clearBoundOrders,
    reacting: reacting,
    reactionState: reactionState,
    fledPhase: fledPhase,
    releaseFled: releaseFled,
    guardOnHit: guardOnHit,
    entranced: entranced,
    noteKill: noteKill,
    decide: decide,
    suppress: suppress,
    assignSuppressors: assignSuppressors,
    reactTime: reactTime,
    knownThreat: knownThreat,
    findCover: findCover,
    threatSector: threatSector,
    sectorDistance: sectorDistance,
    facingError: facingError,
    fireAllowed: fireAllowed,
    fireAuthorized: fireAuthorized,
    underFireNow: underFireNow,
    fireControlReady: fireControlReady,
    fireControlObservation: fireControlObservation,
    firingLineClear: firingLineClear,
    crestPrepPoint: crestPrepPoint,
    commitStance: commitStance,
    requestStance: requestStance,
    markUrgent: markUrgent,
    clearUrgent: clearUrgent,
    interruptGun: interruptGun,
    stationClaimed: stationClaimed,
    stationLeft: stationLeft,
    playerFace: playerFace,
    unemplaceGun: unemplaceGun,
    delayFire: delayFire,
    applyStance: applyStance,
    resetSoldier: resetSoldier,
    resetSquad: resetSquad,
    stateOf: state,
    tuning: {
      REACT: REACT,
      AIM_CONE: AIM_CONE,
      ALERT_HOLD: ALERT_HOLD,
      COVER_RANGE: COVER_RANGE,
      BOUND_METERS: BOUND_METERS,
      USEFUL_COVER: USEFUL_COVER,
      OPEN_COVER: OPEN_COVER,
      MAX_SUPPRESSORS: MAX_SUPPRESSORS,
      SUPPRESS_BURST: SUPPRESS_BURST,
      SUPPRESS_PAUSE: SUPPRESS_PAUSE,
      PREWARNED_REACT: PREWARNED_REACT,
      STANCE_HOLD: STANCE_HOLD,
      PRONE_HOLD: PRONE_HOLD,
      AIM_SETTLE: AIM_SETTLE,
      COVER_FIRE: COVER_FIRE,
      CRAWL_FIT: CRAWL_FIT,
      CONTACT_STANCE: CONTACT_STANCE,
      ACT: ACT,
      RAGE_LOCK: RAGE_LOCK,
      RAGE_GUARD_CHARGE: RAGE_GUARD_CHARGE,
      RAGE_TRANCE: RAGE_TRANCE,
      ACT_TUNING: ACT_TUNING
    }
  };
  if (typeof console !== 'undefined')
    console.log('[ENGAGE] state/fire owner loaded; combat locomotion proposed to the Movement Resolver');
})(typeof window !== 'undefined' ? window : globalThis);
