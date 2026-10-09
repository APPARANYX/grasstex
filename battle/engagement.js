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

  /* ?retreatPosture=0 restores the old behavior: a retreat's end does not clear a man's withdraw state
     or void a posture order adopted before it ended. */
  var RETREAT_POSTURE_ON = !(
    typeof location !== 'undefined' &&
    /[?&]retreatPosture=(?:0|off|false)(?:&|#|$)/i.test(location.search || '')
  );
  /* Seconds between acquiring a target and being allowed to shoot at it. This is recognition and
     weapon handling, not aiming accuracy - the aim cone below is a separate gate. */
  var REACT = { sergeant: 0.55, rifleman: 0.7, gunner: 0.85, scout: 0.45 };
  var AIM_CONE = 0.22; // ~12.6 deg; wider than this and the body is still turning
  var AIM_SETTLE = 0.4; // after a stance change or a major retarget
  var MOVE_FIRE_FRACTION = 0.12; // above this fraction of top speed the weapon stays down
  var ALERT_HOLD = 4.5; // hold the threat sector this long after losing sight
  var ENGAGE_REVIEW = 7.0; // re-open the cover question this often while holding
  var NO_LINE_GRACE = 6.0; // a held target the man cannot fire on this long is observed, not engaged
  /* On by default; `?fireLineContact=0` is the old rule (every held target is contact, however long it has been unshootable). */
  var FIRE_LINE_CONTACT = !(
    typeof location !== 'undefined' && /[?&]fireLineContact=0\b/.test(location.search || '')
  );
  var STANCE_HOLD = 4.0,
    PRONE_HOLD = 5.5,
    LOW_GAP_HOLD = 2.0;
  var COVER_RANGE = 26,
    COVER_RANGE_UNDER_FIRE = 42,
    COVER_ARRIVED = 1.2;
  var GUNNER_SETUP = 1.4;
  /* A position is "in the open" when the best stance available there still leaves the soldier
     nearly fully exposed. */
  var OPEN_COVER = 0.92,
    USEFUL_COVER = 0.88;
  var PRONE_ROLES = { rifleman: 1, gunner: 1 };
  var BOUND_METERS = 22,
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
  var clamp = root.GTMath.clamp;
  var dist = root.GTMath.dist4;
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
        advanceLowUntil: 0,
        withdrawLowUntil: 0,
        withdrawPoint: null,
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

  /* Engagement consumes the man's Perception-owned picture. With the beliefs flag off,
     soldierContact deliberately returns the legacy squad.contact, preserving the control arm. */
  function squadContact(s, battle) {
    var api = SA();
    if (api && api.soldierContact) return api.soldierContact(s, battle);
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
  /* Recognition time is shortened only when this man already has prior information about the contact. */
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
  /* Is the squad's fight still live? This is deliberately aggregate/Meso information, not the
     personal contact view used below for a man's aim and fire-control decisions. */
  /* Fire control, stance and the firefight's ground game moved verbatim to
     battle/modules/19b-engagement-fire-stance.js: the per-soldier fire-permission layer
     (fireControlOf/fireAuthorized/fireControlPreparing, underFireNow), the stance engine
     (seesFrom/seeingStance/applyStance/commitStance/requestStance/holdStance, crawlPace and
     canCrawlTo), fire permission and suppression (movingTooFast/fireAllowed/tryFire/suppress),
     fire-control targeting and observation (fireControlTarget/firingLineClear/proneLineClear/
     crestPrepPoint/fireControlObservation/fireControlReady/prepareFireControl), the bound
     (squadForward/boundForward/orderedBound) and the fire position (PORT_ON/portTarget/
     portLines/portSolve/station/legacyStation). This file keeps the machine they serve: STATES,
     REQUESTS, transition, move and the drill, plus every constant its export's tuning reads.
     The wiring is the same reversed install as the cover and stress modules: the ctx below
     (_engagementFireStanceCtx) carries the closure utilities and those kept constants, the
     attach sink (_engagementFireStanceAttach) takes the implementation back, and until the
     module loads the delegating closures throw - a chain without the module says so on the
     first stance or fire decision instead of fielding men who neither kneel nor shoot. */
  var fireStanceApi = null;
  root._engagementFireStanceAttach = function (api) {
    if (!api || typeof api.fireAllowed !== 'function' || typeof api.commitStance !== 'function') return false;
    fireStanceApi = api;
    return true;
  };
  root._engagementFireStanceCtx = function () {
    return {
      root: root,
      SA: SA,
      state: state,
      mind: mind,
      dist: dist,
      posOf: posOf,
      field: field,
      jitter: jitter,
      statScale: statScale,
      combatThreat: combatThreat,
      facingError: facingError,
      squadContact: squadContact,
      knownThreat: knownThreat,
      noteShock: noteShock,
      shockUntil: shockUntil,
      transition: transition,
      move: move,
      holdPosition: holdPosition,
      findCover: findCover,
      assault: assault,
      bound: bound,
      AIM_CONE: AIM_CONE,
      AIM_SETTLE: AIM_SETTLE,
      ALERT_HOLD: ALERT_HOLD,
      ALERT_LATCH: ALERT_LATCH,
      BOUND_ARRIVED: BOUND_ARRIVED,
      BOUND_BACK_ALLOW: BOUND_BACK_ALLOW,
      BOUND_METERS: BOUND_METERS,
      CONTACT_STANCE: CONTACT_STANCE,
      COVER_FIRE: COVER_FIRE,
      COVER_RANGE_UNDER_FIRE: COVER_RANGE_UNDER_FIRE,
      COVER_STANCE: COVER_STANCE,
      GUNNER_SETUP: GUNNER_SETUP,
      MOVE_FIRE_FRACTION: MOVE_FIRE_FRACTION,
      PRONE_HOLD: PRONE_HOLD,
      PRONE_ROLES: PRONE_ROLES,
      STANCE_HOLD: STANCE_HOLD,
      SUPPRESS_BURST: SUPPRESS_BURST,
      SUPPRESS_PAUSE: SUPPRESS_PAUSE,
      USEFUL_COVER: USEFUL_COVER
    };
  };
  function fireStanceImpl() {
    if (!fireStanceApi)
      throw new Error(
        '[ENGAGE] fire/stance system missing: battle/modules/19b-engagement-fire-stance.js must load after engagement.js'
      );
    return fireStanceApi;
  }
  /* Delegating closures with the pre-split names and signatures. */
  function engagementLive(s, battle) {
    return fireStanceImpl().engagementLive(s, battle);
  }
  function squadOnHeels(s, battle) {
    return fireStanceImpl().squadOnHeels(s, battle);
  }
  function underFireNow(s, battle) {
    return fireStanceImpl().underFireNow(s, battle);
  }
  function fireAuthorized(s, battle) {
    return fireStanceImpl().fireAuthorized(s, battle);
  }
  function fireControlPreparing(s, battle) {
    return fireStanceImpl().fireControlPreparing(s, battle);
  }
  function canCrawlTo(s, battle, d) {
    return fireStanceImpl().canCrawlTo(s, battle, d);
  }
  function seesFrom(pt, stance, target, battle) {
    return fireStanceImpl().seesFrom(pt, stance, target, battle);
  }
  function seeingStance(s, battle, want, at) {
    return fireStanceImpl().seeingStance(s, battle, want, at);
  }
  function applyStance(s, stance) {
    return fireStanceImpl().applyStance(s, stance);
  }
  function commitStance(s, battle, stance, seconds, reason) {
    return fireStanceImpl().commitStance(s, battle, stance, seconds, reason);
  }
  function requestStance(s, battle, stance, seconds) {
    return fireStanceImpl().requestStance(s, battle, stance, seconds);
  }
  function commitStanceRespectHold(s, battle, stance, seconds, reason) {
    return fireStanceImpl().commitStanceRespectHold(s, battle, stance, seconds, reason);
  }
  function holdStance(s, battle) {
    return fireStanceImpl().holdStance(s, battle);
  }
  function inCover(s, battle) {
    return fireStanceImpl().inCover(s, battle);
  }
  function fightingStance(s, battle, distanceToTarget, coverValue) {
    return fireStanceImpl().fightingStance(s, battle, distanceToTarget, coverValue);
  }
  function fireAllowed(s, battle) {
    return fireStanceImpl().fireAllowed(s, battle);
  }
  function tryFire(s, battle) {
    return fireStanceImpl().tryFire(s, battle);
  }
  function suppress(s, battle, point) {
    return fireStanceImpl().suppress(s, battle, point);
  }
  function firingLineClear(target, pt, stance, battle) {
    return fireStanceImpl().firingLineClear(target, pt, stance, battle);
  }
  function crestPrepPoint(s, target, battle) {
    return fireStanceImpl().crestPrepPoint(s, target, battle);
  }
  function fireControlObservation(s, battle) {
    return fireStanceImpl().fireControlObservation(s, battle);
  }
  function fireControlReady(s, battle) {
    return fireStanceImpl().fireControlReady(s, battle);
  }
  function prepareFireControl(s, battle) {
    return fireStanceImpl().prepareFireControl(s, battle);
  }
  function boundForward(s) {
    return fireStanceImpl().boundForward(s);
  }
  function orderedBound(s, battle) {
    return fireStanceImpl().orderedBound(s, battle);
  }
  function station(s, battle) {
    return fireStanceImpl().station(s, battle);
  }
  var ALERT_LATCH = !(typeof location !== 'undefined' && /[?&]alertHold=0\b/.test(location.search || ''));
  function parseCombatHandoff(search) {
    return !/[?&]combatHandoff=(?:0|off|false)(?:&|#|$)/i.test(search || '');
  }
  var COMBAT_HANDOFF_ON = parseCombatHandoff(typeof location !== 'undefined' ? location.search || '' : ''),
    COMBAT_HANDOFF_QUIET = 2.5;
  var CRAWL_FIT = !(typeof location !== 'undefined' && /[?&]crawlFit=0\b/.test(location.search || ''));
  // How much of his running pace a crawl covers (module 11's gait table), 0.23 without it.
  var COVER_FIRE = !(typeof location !== 'undefined' && /[?&]coverFire=0\b/.test(location.search || ''));
  /* Opt-in bounded end-of-cover sightline recovery; default stays legacy until paired battles. */
  var COVER_PEEK = !!(
    typeof location !== 'undefined' && /[?&]coverPeek=(?:1|on|true)(?:&|#|$)/i.test(location.search || '')
  );

  var COVER_STANCE = !(typeof location !== 'undefined' && /[?&]coverStance=0\b/.test(location.search || ''));
  /* ---- cover (battle/modules/19-engagement-cover-positions.js) ------------------------------ */

  /* Cover is a set of physical stand slots, shared by engagement and survival routes. Claims
     last for the actual bound/occupancy, never a clock lease. This owner chooses/reserves cover;
     Movement Resolver remains the only writer of physical destinations.

     The cover subsystem moved verbatim to the sub-module. Every module file loads AFTER this
     file in both chains (the page appends the discovered modules after the core scripts; the
     harness loads them after the runtime block), so - unlike 15m handing a factory to 16 - this
     file cannot call the factory at load time. It publishes the ctx the moved bodies consume
     (its closure utilities plus the COVER_* constants, which stay here: tuning reads them and
     the export reads spacing) and an attach sink, and the sub-module installs the
     implementation back into this file at its own load time. Until then every cover name
     resolves through coverImpl(), which throws: a chain that loads engagement.js without the
     cover module has no cover system and must say so, not silently field soldiers in the open. */
  var COVER_SPACING = 1.8,
    COVER_CELL = 2,
    coverApi = null;
  root._engagementCoverAttach = function (api) {
    if (!api || typeof api.findCover !== 'function' || typeof api.reserveCover !== 'function') return false;
    coverApi = api;
    return true;
  };
  root._engagementCoverCtx = function () {
    return {
      root: root,
      dist: dist,
      posOf: posOf,
      field: field,
      state: state,
      SA: SA,
      seesFrom: seesFrom,
      USEFUL_COVER: USEFUL_COVER,
      COVER_RANGE: COVER_RANGE,
      COVER_FIRE: COVER_FIRE,
      COVER_SPACING: COVER_SPACING,
      COVER_CELL: COVER_CELL
    };
  };
  function coverImpl() {
    if (!coverApi)
      throw new Error(
        '[ENGAGE] cover system missing: battle/modules/19-engagement-cover-positions.js must load after engagement.js'
      );
    return coverApi;
  }
  /* Delegating closures with the pre-split names and signatures: every internal call site and
     both export objects below keep calling exactly these. */
  function findCover(s, battle, opts) {
    return coverImpl().findCover(s, battle, opts);
  }
  function currentCover(s, battle) {
    return coverImpl().currentCover(s, battle);
  }
  function releaseCover(s, battle, kind) {
    return coverImpl().releaseCover(s, battle, kind);
  }
  function reserveCover(s, battle, slot, kind) {
    return coverImpl().reserveCover(s, battle, slot, kind);
  }
  function coverCandidates(s, battle, threat, maxRange) {
    return coverImpl().coverCandidates(s, battle, threat, maxRange);
  }
  function coverSnapshot(battle) {
    return coverImpl().coverSnapshot(battle);
  }
  function warmCover(battle) {
    return coverImpl().warm(battle);
  }

  /* ---- fire discipline --------------------------------------------------------------------- */

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
      meaning:
        'Withdraw under squad retreat authority or make a local break-contact move to the squad anchor',
      enteredBy: 'squad retreat override; no-cover out-of-range break contact',
      exits: 'squad retreat ends/local threat clears or closes -> advance/orient; station claim -> station',
      rate: '0.15 s',
      next: [
        'withdraw',
        'advance',
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
      if (next !== 'withdraw') e.withdrawPoint = null;
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

  /* Fire-control preparation uses the live unit only when this man personally has it. If his
     direct sight just blinked (for example after HOLD FIRE puts him prone), a recent *seen* belief
     may stand in as a position-only proxy at the recorded last-known point. Told/heard beliefs never
     become a target object, so no hidden live position leaks through the readiness calculation. */

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
  /* Stress reactions moved verbatim to battle/modules/19a-engagement-stress-reactions.js (the
     ACT, ACTING, RAGE and ACT_TUNING block above stays here: the export's tuning reads it). This
     file publishes the ctx the moved bodies consume plus an attach sink, and the module calls
     its own factory at ITS load time and installs the ten names back into this file - the same
     reversed wiring as the cover module, because every module file loads after this one in both
     chains. Until then the delegating closures below throw: a chain that loads engagement.js
     without the stress module says so on the first reaction instead of silently fielding men
     who cannot break. */
  var stressApi = null;
  root._engagementStressAttach = function (api) {
    if (!api || typeof api.reaction !== 'function' || typeof api.guardOnHit !== 'function') return false;
    stressApi = api;
    return true;
  };
  root._engagementStressCtx = function () {
    return {
      root: root,
      SA: SA,
      state: state,
      mind: mind,
      dist: dist,
      posOf: posOf,
      clamp: clamp,
      telemetry: telemetry,
      combatThreat: combatThreat,
      commitStance: commitStance,
      facingError: facingError,
      holdPosition: holdPosition,
      markUrgent: markUrgent,
      move: move,
      relief: relief,
      squadContact: squadContact,
      transition: transition,
      ACT: ACT,
      ACTING: ACTING,
      ACT_TUNING: ACT_TUNING,
      AIM_CONE: AIM_CONE,
      PRONE_HOLD: PRONE_HOLD,
      PRONE_ROLES: PRONE_ROLES,
      RAGE_GUARD_CHARGE: RAGE_GUARD_CHARGE,
      RAGE_LOCK: RAGE_LOCK,
      RAGE_TRANCE: RAGE_TRANCE
    };
  };
  function stressImpl() {
    if (!stressApi)
      throw new Error(
        '[ENGAGE] stress reactions missing: battle/modules/19a-engagement-stress-reactions.js must load after engagement.js'
      );
    return stressApi;
  }
  /* Delegating closures with the pre-split names and signatures: every internal call site and
     the export object below keep calling exactly these. */
  function reactionState(s) {
    return stressImpl().reactionState(s);
  }
  function reacting(s) {
    return stressImpl().reacting(s);
  }
  function reaction(s, battle) {
    return stressImpl().reaction(s, battle);
  }
  function guardOnHit(victim, battle, damage) {
    return stressImpl().guardOnHit(victim, battle, damage);
  }
  function entranced(s) {
    return stressImpl().entranced(s);
  }
  function noteKill(by) {
    stressImpl().noteKill(by);
  }
  function finishFreeze(s, battle, why) {
    stressImpl().finishFreeze(s, battle, why);
  }
  function fledPhase(s) {
    return stressImpl().fledPhase(s);
  }
  function fledTick(s, battle) {
    return stressImpl().fledTick(s, battle);
  }
  function releaseFled(s, battle, why) {
    return stressImpl().releaseFled(s, battle, why);
  }
  function restoreFledForceCount(s, battle, why) {
    return stressImpl().restoreFledForceCount(s, battle, why);
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
    if (ALERT_LATCH) {
      var liveFight = engagementLive(s, battle);
      if (liveFight) {
        e.handoffQuietSince = null;
        if (s.target) e.engaged = true;
      } else if (e.engaged && COMBAT_HANDOFF_ON) {
        if (e.handoffQuietSince == null) e.handoffQuietSince = now;
        if (now - e.handoffQuietSince >= COMBAT_HANDOFF_QUIET) {
          e.engaged = false;
          e.handoffQuietSince = null;
          telemetry(battle, 'decision-combat-handoff', {
            faction: s.faction,
            squad: s.squad && s.squad.id,
            soldier: s.id,
            quietSeconds: COMBAT_HANDOFF_QUIET
          });
        }
      } else {
        e.engaged = false;
        e.handoffQuietSince = null;
      }
    }

    /* If the continuous-quiet handoff just released an expired alert, do not execute one final
       alert tick and renew a low-posture hold. The release tick is the hand-back to ordinary advance. */
    if (ALERT_LATCH && COMBAT_HANDOFF_ON && !e.engaged && e.state === 'alert' && now >= e.until) {
      e.cover = null;
      e.threatSector = null;
      e.suppressOrder = false;
      s._faceHint = null;
      transition(s, battle, 'advance', 0, 'sector clear: combat handoff');
    }

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
      e.withdrawPoint = null;
      transition(s, battle, 'withdraw', 0, 'squad withdrawing');
      return withdraw(s, battle);
    }
    /* The retreat set this state, so the retreat's end clears it here, ahead of fire control. A
       leaderless or out-of-earshot man never hears a replacement order, and a held-over HOLD from
       before the retreat would otherwise keep him in prepareFireControl, never reaching the
       'retreat ended' exit in withdraw(). A posture order adopted before the end is void. */
    if (RETREAT_POSTURE_ON && e.state === 'withdraw' && !e.withdrawPoint) {
      e.retreatEndedAt = battle.time;
      transition(s, battle, 'advance', 0, 'retreat ended');
    }
    if (ACT.any && reaction(s, battle)) return;
    if (root.BattleTacticalPositions && root.BattleTacticalPositions.update(s, battle)) {
      transition(s, battle, 'station', 0, 'firing station');
      return station(s, battle);
    }
    /* A first contact is not automatically a trigger pull. While the Squad Leader is holding fire,
       everyone not specifically chosen for a precision shot gets low, faces the contact and creeps
       only far enough to establish a prone line over a crest. */
    /* HOLD/PRECISION blocks new bounds at the Squad Leader, but a displacement already in motion
       is a commitment: finish it under HOLD FIRE instead of flipping bound -> prone prep -> bound
       whenever the shared contact blinks. Fire permission remains closed throughout. */
    if (fireControlPreparing(s, battle) && e.state !== 'bound' && e.state !== 'assault')
      return prepareFireControl(s, battle);

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
      case 'withdraw':
        return withdraw(s, battle);
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
    if (ALERT_LATCH && e.engaged) {
      transition(s, battle, 'alert', ALERT_HOLD, 'engagement continues');
      return alert(s, battle);
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
    /* Upright only on a quiet march. Contact can blink for one perception/commander tick (especially
       when a spoken callout refreshes the squad picture), so remember the last low-posture reason for the
       same ALERT_HOLD window used by the threat sector. Standing therefore means genuinely quiet, not
       merely "no contact on this one tick". ?contactStance=0 deliberately keeps the old raw control. */
    var lowNow = s.suppressedUntil > battle.time || squadOnHeels(s, battle);
    if (CONTACT_STANCE && lowNow)
      e.advanceLowUntil = Math.max(+e.advanceLowUntil || 0, battle.time + LOW_GAP_HOLD);
    var low = lowNow || (CONTACT_STANCE && battle.time < (+e.advanceLowUntil || 0));
    if (!holdStance(s, battle))
      commitStance(
        s,
        battle,
        low ? 'crouch' : 'stand',
        1.0,
        low ? (lowNow ? 'advance:contact-low' : 'advance:contact-hold') : 'advance:quiet'
      );
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
      /* LOS gate: if the man is at useful cover but can't actually see his target (e.g. prone
         behind a hedgerow that blocks his eye line), don't accept the cover — fall through to
         findCover() which already filters candidates by standing LOS. Without this gate a man
         who goes prone behind a hedge stays there indefinitely: engage()'s review only fires
         when he's in the open, and this "cover here" branch would bounce him back to engage()
         at the same blind spot every time. */
      var hasLine =
        !target || !target.root || SA().hasLineOfSight(s, target, battle.heightAt, battle.obstacles);
      if (hasLine) {
        transition(s, battle, 'engage', 0, why + ': cover here');
        return engage(s, battle);
      }
      /* else: at cover but blind — fall through to findCover() to relocate. */
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
    /* A tall hedge may shield every sheltered slot from its threat. When held behind
       that cover without a line, search reachable edge slots before abandoning the
       fire-fight or pretending to shoot through the hedge. */
    var laneAllowed = !cover && COVER_PEEK && !suppressed && target && target.root,
      laneBlocked = laneAllowed && !SA().hasLineOfSight(s, target, battle.heightAt, battle.obstacles);
    /* Experimental fire-and-movement rule: an exposed hedge-end bound only
       begins while the observed target is suppressed long enough for a flank.
       This is NOT active on PR420 and requires explicit ?coverPeekSupport=1. */
    var needSupport = typeof location !== 'undefined' &&
      /[?&]coverPeekSupport=1(?:&|#|$)/.test(location.search || '');
    var safeWindow = !needSupport || (target && target.suppressedUntil > battle.time + 7);
    if (laneBlocked && safeWindow) {
      cover = coverImpl().findFiringLane(s, battle, {
        maxRange: COVER_RANGE,
        notBehind: fwd ? { axis: fwd, allow: BOUND_BACK_ALLOW } : null
      });
    } else if (!cover && root.BattleCausalInaction && root.BattleCausalInaction.coverDecision) {
      /* This event is a direct top-level Engagement skip reason. It does not
         re-evaluate LOS, request movement or alter a cover reservation. */
      root.BattleCausalInaction.coverDecision(s, battle, 'firing-lane-gate',
        !COVER_PEEK ? 'flag-disabled' : suppressed ? 'suppressed' :
        !target || !target.root ? 'no-live-target' :
        laneBlocked && !safeWindow ? 'target-not-suppressed' : 'line-already-open');
    }
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
       go to ground and shoot from where he is - UNLESS the target is out of effective range and
       the squad is not assaulting. In that case, standing in the open to fire at a target he can
       barely hit is suicide; withdraw toward the squad anchor to break contact instead. This
       saves lone riflemen pinned by snipers/MGs at long range who would otherwise stand and die. */
    var sq = s.squad,
      assaulting = sq && ADVANCING[sq.commandPhase],
      effectiveRange = SA().engageRange(s),
      outOfRange = d > effectiveRange * 1.2,
      anchor = sq && (sq.orderAnchor || sq.rally);
    if (!suppressed && outOfRange && !assaulting && anchor) {
      e.withdrawPoint = { x: +anchor.x, z: +anchor.z };
      transition(s, battle, 'withdraw', 0, why + ': break contact (no cover, out of range)');
      return withdraw(s, battle);
    }
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
    /* A man who sees a head he cannot hit (fireLineLive) is observing, not fighting: he proposes no hold,
       so the Squad Leader's published order (the anchor's advance, a clearing move) takes him up to a
       position with a line instead of pinning him behind the crest for the rest of the battle. */
    var fighting = fireLineLive(s, e, battle);
    if (fighting) holdPosition(s, battle);
    if (!holdStance(s, battle))
      commitStance(
        s,
        battle,
        fighting ? seeingStance(s, battle, fightingStance(s, battle, d, here)) : 'crouch',
        undefined,
        fighting ? undefined : 'engage:observing'
      );
    if (SA().isMachineGun(s)) {
      if (!e.setUpSince) e.setUpSince = battle.time;
      s.setUp = battle.time - e.setUpSince > GUNNER_SETUP * statScale(s, 'setup');
    } else s.setUp = false;
    tryFire(s, battle);
    if (battle.time >= (e.reviewAt || 0)) {
      e.reviewAt = battle.time + ENGAGE_REVIEW + jitter(s, 0.3);
      /* Also re-decide when the man has no LOS to his target — a man behind a hedgerow who
         can't see his enemy should reposition, not lie there indefinitely. The "cover here"
         branch in decide() now checks LOS too, so this review will relocate him via findCover(). */
      var noLine =
        s.target && s.target.root && !SA().hasLineOfSight(s, s.target, battle.heightAt, battle.obstacles);
      if (here > OPEN_COVER || noLine) decide(s, battle, noLine ? 'no firing line' : 'review');
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
    /* Clearing (the Squad Leader's `clearContact`, module 16): once his sector hold is over, a man
       who is not suppressing follows the squad up on the last aggregate contact point. That order is
       Meso intent; his ordinary aim/threat decisions still come from his personal belief view. */
    var clearing = !!(
      s.squad &&
      s.squad.clearContact &&
      ALERT_LATCH &&
      e.engaged &&
      !e.suppressOrder &&
      battle.time >= e.until
    );
    if (clearing) s.state = 'clear';
    else holdPosition(s, battle);
    /* His freshest personal contact/belief outranks his older Engagement last-seen point; the
       deliberate clearing order is the one exception because it is a Squad Leader destination. */
    var aim = clearing ? s.squad.clearContact : knownThreat(s, battle);
    /* Hold the sector low; clearing moves crouched, otherwise open-ground riflemen go prone. */
    var watch = !clearing && COVER_STANCE && PRONE_ROLES[s.role] && !inCover(s, battle) ? 'prone' : 'crouch';
    if (!holdStance(s, battle))
      commitStance(s, battle, seeingStance(s, battle, watch, aim && { root: { position: aim } }), 2.0);
    s._faceHint = aim && facingError(s, aim) > AIM_CONE ? aim : null;
    /* Phase 0G1: secondary threat orientation. If the man has a secondary threat (a belief in
       a different 20m sector from the primary) and the primary is either being suppressed,
       behind cover, or out of effective range, orient toward the secondary instead. The man
       does not switch targets — s.target stays on the primary — but he faces the secondary
       so he can react if it enters LOS. This is the difference between a man who only watches
       one direction and a man who knows about threats from two. */
    if (root.SquadAI && root.SquadAI.secondaryThreatOn && root.SquadAI.secondaryThreatOn()) {
      var c = squadContact(s, battle);
      if (c && c.secondary) {
        var sec = c.secondary,
          primaryHandled =
            e.suppressOrder /* suppressing the primary */ ||
            (aim && facingError(s, aim) <= AIM_CONE) /* primary is in his aim cone */ ||
            !aim; /* no primary aim point */
        if (primaryHandled) {
          s._faceHint = { x: sec.x, z: sec.z };
          e.threatSector = sec.sector;
        }
      }
    }
    if (e.suppressOrder && aim) {
      /* A designated suppressor holds the firing line for as long as the contact is current,
         rather than wandering off mid-burst when the alert timer lapses. */
      e.until = Math.max(e.until, battle.time + SUPPRESS_HOLD);
      s.state = 'suppress';
      suppress(s, battle, aim);
    }
    if (battle.time >= e.until && !(ALERT_LATCH && e.engaged)) {
      e.cover = null;
      e.threatSector = null;
      s._faceHint = null;
      e.suppressOrder = false;
      transition(s, battle, 'advance', 0, 'sector clear');
    }
  }

  function withdraw(s, battle) {
    var e = state(s),
      squadRetreat = !!(s.squad && s.squad.state === 'retreat'),
      localPoint = !squadRetreat && e.withdrawPoint;
    /* A squad retreat owns persistent movement at Meso. A local break-contact withdrawal is
       different: Engagement chose it, so Engagement must publish that temporary combat movement
       through the resolver instead of yielding to a squad order that does not exist. */
    if (!squadRetreat && !localPoint) {
      transition(s, battle, 'advance', 0, 'retreat ended');
      return advance(s, battle);
    }
    s.state = 'retreat';
    s.setUp = false;
    e.cover = null;
    /* Retreat posture follows the broader "under fire" window and remembers the last incoming-fire
       evidence for ALERT_HOLD. Bursts separated by a short lull no longer produce stand/crouch bobbing:
       the man only stands after a real quiet interval. */
    var underFire = underFireNow(s, battle);
    if (underFire) e.withdrawLowUntil = Math.max(+e.withdrawLowUntil || 0, battle.time + LOW_GAP_HOLD);
    var withdrawLow = underFire || battle.time < (+e.withdrawLowUntil || 0);
    commitStanceRespectHold(
      s,
      battle,
      withdrawLow ? 'crouch' : 'stand',
      withdrawLow ? 1.0 : 0.5,
      withdrawLow ? 'withdraw:under-fire' : 'withdraw:clear'
    );
    if (localPoint) {
      var p = posOf(s),
        target = combatThreat(s.target) ? s.target : null,
        targetDistance = target ? dist(p.x, p.z, posOf(target).x, posOf(target).z) : Infinity,
        assaulting = s.squad && ADVANCING[s.squad.commandPhase];
      if (!target || assaulting) {
        transition(
          s,
          battle,
          'advance',
          0,
          target ? 'break contact superseded by squad advance' : 'break contact clear'
        );
        return advance(s, battle);
      }
      if (targetDistance <= SA().engageRange(s) * 1.1) {
        transition(
          s,
          battle,
          'orient',
          reactTime(s, battle) * 0.6,
          'break contact complete: target in range'
        );
        return orient(s, battle);
      }
      if (dist(p.x, p.z, localPoint.x, localPoint.z) > 1.8) move(s, battle, localPoint, 'withdraw');
      else holdPosition(s, battle);
    } else followOrders(s, battle, true);
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

  /* ---- per-squad update ------------------------------------------------------------------- */

  /* Who puts fire on the last known position. Preference order: the machine gun first (it is the
     suppressive weapon and it is already static), then whoever was doing it last tick so the job
     does not hop around the squad, then by slot. Men who can see a target of their own, men who
     are moving, pinned, withdrawing or holding a firing station are all excluded - and during a
     bound the movers never double as the base of fire. */
  function assignSuppressors(sq, battle, members, known) {
    var api = SA(),
      personal = !!(api.soldierBeliefsOn && api.soldierBeliefsOn() && api.soldierContact),
      contact = known !== undefined ? known : api.squadContact ? api.squadContact(sq, battle) : null,
      disabled = known === null,
      i,
      s,
      chosen = 0,
      priorSuppressors = [];
    for (i = 0; i < members.length; i++) {
      s = members[i];
      if (!s.dead && !s.isPlayer) {
        if (state(s).suppressOrder) priorSuppressors.push(s);
        state(s).suppressOrder = false;
      }
    }
    if (!disabled && (personal || contact)) {
      var bounding = root.BattleLeases.holds(sq, 'bound', battle.time),
        candidates = [];
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
          (es.state === 'withdraw' && sq.state === 'retreat') ||
          es.state === 'assault' ||
          ACTING[es.state] === 1
        )
          continue;
        if (bounding && es.boundOrder) continue;
        var own = personal ? api.soldierContact(s, battle) : contact;
        if (!own || !isFinite(+own.x) || !isFinite(+own.z)) continue;
        /* A callout or gunshot is enough to orient and prepare a man, not enough to make him
           autonomously hose down a sector. Personal-mode automatic suppression requires his own
           recent visual memory; explicit area-fire / fire-control orders remain separate authority. */
        if (personal && (own.source !== 'seen' || !isFinite(+own.at) || battle.time - +own.at > ALERT_HOLD))
          continue;
        var point = { x: +own.x, z: +own.z };
        /* No job for a man who cannot reach what HE believes - he keeps advancing instead of
           inheriting another man's invisible suppressive sector. */
        if (api.canSuppress && !api.canSuppress(s, point, battle)) continue;
        candidates.push(s);
      }
      candidates.sort(function (a, b) {
        var ga = SA().isMachineGun(a) ? 0 : 1,
          gb = SA().isMachineGun(b) ? 0 : 1;
        if (ga !== gb) return ga - gb;
        var sa = priorSuppressors.indexOf(a) >= 0 ? 0 : 1,
          sb = priorSuppressors.indexOf(b) >= 0 ? 0 : 1;
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

  /* Whether a man's held target is a firefight or only something he can see. Perception owns who was
     seen; Engagement owns whether that is contact the Squad Leader must fight or fight around. A target
     whose sight line clears but whose round would meet the crest or an obstacle first (the trigger-time
     gate's own verdict, one definition) produces no fire, no hits and no cover to take, so counting it as
     contact held the squad's plan lease open, its anchor in place and its course of action at "defend"
     for as long as both sides could see each other's heads. Contact stays live for NO_LINE_GRACE after
     the line closes (a stance change or a step behind a bush must not flap it) and again the moment
     the line opens; incoming fire and suppressors count as contact on their own, below. */
  function fireLineLive(s, e, battle) {
    var G = root.BattleDirectFireLOSGate;
    if (!FIRE_LINE_CONTACT || !G || !G.blockReason || !G.blockReason(s, battle)) {
      e.noLineSince = null;
      return true;
    }
    if (e.noLineSince == null) e.noLineSince = battle.time;
    return battle.time - e.noLineSince < NO_LINE_GRACE;
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
        (SA().hasFirstHandMemory
          ? SA().hasFirstHandMemory(known, battle)
          : !known.heard && !known.relayedFrom)
      );
    /* A hold/precision order is silent preparation. Clear old suppressor jobs while it is active;
       otherwise a stale suppressOrder would make the squad look like a base of fire before permission. */
    var suppressing = assignSuppressors(sq, battle, members, controlled ? null : undefined),
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
      if (s.target && fireLineLive(s, e, battle)) contact++;
      else if (!s.target) e.noLineSince = null;
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
    warm: warmCover,
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
    restoreFledForceCount: restoreFledForceCount,
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
    parseCombatHandoff: parseCombatHandoff,
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
      LOW_GAP_HOLD: LOW_GAP_HOLD,
      AIM_SETTLE: AIM_SETTLE,
      COVER_FIRE: COVER_FIRE,
      CRAWL_FIT: CRAWL_FIT,
      CONTACT_STANCE: CONTACT_STANCE,
      COVER_STANCE: COVER_STANCE,
      ALERT_LATCH: ALERT_LATCH,
      COMBAT_HANDOFF_ON: COMBAT_HANDOFF_ON,
      COMBAT_HANDOFF_QUIET: COMBAT_HANDOFF_QUIET,
      ACT: ACT,
      RAGE_LOCK: RAGE_LOCK,
      RAGE_GUARD_CHARGE: RAGE_GUARD_CHARGE,
      RAGE_TRANCE: RAGE_TRANCE,
      ACT_TUNING: ACT_TUNING
    }
  };
  if (typeof console !== 'undefined')
    root.GTLog('[ENGAGE] state/fire owner loaded; combat locomotion proposed to the Movement Resolver');
})(typeof window !== 'undefined' ? window : globalThis);
