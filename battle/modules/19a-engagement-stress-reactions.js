/* Engagement stress-reactions sub-module (extracted from battle/engagement.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.

   What stress does to a man (module 17 numbers, `?stressAct=cower,flee,freeze,rage`): a
   rattled man under fire goes to ground (cower); a broken man runs (flee: to a refuge away
   from the trouble, then home), stops where he is (freeze) or charges the nearest enemy
   (rage, striking at arm's length). This module owns the whole reaction machine: the state
   predicates and bookkeeping (reactionState, reacting, noteAct), the hit guard (guardOnHit),
   the rage trance (entranced) and death bookkeeping (noteKill, succumb), the break choice
   (trouble, chooseBreak and its three outcomes beginFreeze/finishFreeze, beginFled through
   goHome/releaseFled/fledPhase/fledTick, rage with strike and fireOnTheMove), and the dispatch
   itself (reaction, composed).

   Wiring is the reverse of the 15m -> 16 pattern (same as the cover module): every module file
   loads AFTER engagement.js in both chains (the page appends the discovered modules after the
   core scripts; the harness loads them after the runtime block), so engagement.js cannot call
   this factory at its own load time. Instead engagement.js publishes the ctx below
   (_engagementStressCtx: its closure utilities plus the ACT, ACTING, ACT_TUNING, AIM_CONE,
   PRONE and RAGE constants, which stay there - its export's tuning reads them) plus an attach
   sink (_engagementStressAttach), and this file calls the factory with that ctx at ITS load
   time and installs the returned functions back into the parent. Until then the parent's
   delegating closures fail loudly, so a chain that loads engagement.js without this module
   says so on the first reaction instead of silently fielding men who cannot break. */
(function (root) {
  'use strict';
  if (root._engagementStressReactions) return;

  /* Factory: the module calls it itself at load time with engagement.js's ctx (see above). */
  root._engagementStressReactions = function (ctx) {
    var root = ctx.root,
      SA = ctx.SA,
      state = ctx.state,
      mind = ctx.mind,
      dist = ctx.dist,
      posOf = ctx.posOf,
      clamp = ctx.clamp,
      telemetry = ctx.telemetry,
      combatThreat = ctx.combatThreat,
      commitStance = ctx.commitStance,
      facingError = ctx.facingError,
      holdPosition = ctx.holdPosition,
      markUrgent = ctx.markUrgent,
      move = ctx.move,
      relief = ctx.relief,
      squadContact = ctx.squadContact,
      transition = ctx.transition,
      ACT = ctx.ACT,
      ACTING = ctx.ACTING,
      ACT_TUNING = ctx.ACT_TUNING,
      AIM_CONE = ctx.AIM_CONE,
      PRONE_HOLD = ctx.PRONE_HOLD,
      PRONE_ROLES = ctx.PRONE_ROLES,
      RAGE_GUARD_CHARGE = ctx.RAGE_GUARD_CHARGE,
      RAGE_LOCK = ctx.RAGE_LOCK,
      RAGE_TRANCE = ctx.RAGE_TRANCE;

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
      /* Per-soldier offset so multiple fleeing soldiers from the same squad don't converge on
       the exact same point and orbit it (personal-space pushes them apart but they push back
       toward the shared refuge). A deterministic ring offset hashed from s.id spreads each
       fleer ~2-4m apart around the refuge, like a mini rally formation. */
      var off = fleeOffset(s);
      e.cover = null;
      e.refuge = { x: pt.x + off.x, z: pt.z + off.z };
      e.refugeBest = dist(p.x, p.z, e.refuge.x, e.refuge.z);
      e.refugeAt = battle.time;
    }
    /* Deterministic per-soldier flee offset. Hashes s.id into a ring position so each fleer
     gets a distinct slot ~2-4m from the refuge center. Same soldier always gets the same
     offset (deterministic). */
    function fleeOffset(s) {
      var h = 2166136261 >>> 0,
        str = String(s.id) + '|flee';
      for (var i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      h ^= h >>> 16;
      h = Math.imul(h, 0x85ebca6b);
      h ^= h >>> 13;
      var angle = ((h >>> 0) / 4294967295) * Math.PI * 2,
        radius = 2 + (((h >>> 8) % 128) / 128) * 2; /* 2-4m ring */
      return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
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
      /* Out of the fight, out of the count: the General's force accounting (elimination and the
       time-limit force score, BattleCommanderDoctrine.forceUnits) no longer sees him until a
       retreating squad takes him back in (releaseFled restores him). */
      s.countsForElimination = false;
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
      /* Taken back onto a fighting roster: he counts toward his side's force again. */
      s.countsForElimination = true;
      return true;
    }
    /* Reconstitution is the other legal hand-back into the fighting force. By then the fled
       phase has ended at base, so pickup's releaseFled guard deliberately cannot serve it.
       Engagement still owns the force-count mark it wrote at the break; Macro only reports
       that a successful roster merge happened. */
    function restoreFledForceCount(s, battle, why) {
      if (!s || s.dead || s.countsForElimination !== false) return false;
      s.countsForElimination = true;
      telemetry(battle, 'decision-fled-force-restored', {
        faction: s.faction,
        soldier: s.id,
        squad: s.squad ? s.squad.id : null,
        reason: why || 'reconstitution'
      });
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
    return {
      reactionState: reactionState,
      reacting: reacting,
      reaction: reaction,
      guardOnHit: guardOnHit,
      entranced: entranced,
      noteKill: noteKill,
      finishFreeze: finishFreeze,
      fledPhase: fledPhase,
      fledTick: fledTick,
      releaseFled: releaseFled,
      restoreFledForceCount: restoreFledForceCount
    };
  };

  /* Install into the parent now; engagement.js must already be loaded. */
  if (!root._engagementStressCtx || !root._engagementStressAttach)
    throw new Error(
      '[stress-reactions] engagement.js must load before battle/modules/19a-engagement-stress-reactions.js'
    );
  root._engagementStressAttach(root._engagementStressReactions(root._engagementStressCtx()));
})(typeof window !== 'undefined' ? window : globalThis);
