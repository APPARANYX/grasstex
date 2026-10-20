/* Squad Leader fire-control sub-module (extracted from 16-squad-plan-stability.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.
   The parent file calls the factory with its closure utilities and re-attaches the returned
   functions as closure variables, so all callers (formation, fire-and-movement, the public
   API export) see the same functions as before. */
(function (root) {
  'use strict';
  if (root._squadLeaderFireControl) return;

  /* Factory: called by 16-squad-plan-stability.js after its shared utilities are defined.
     ctx provides the closure utilities the fire-control functions need. */
  root._squadLeaderFireControl = function (ctx) {
    var root = ctx.root,
      telemetry = ctx.telemetry,
      dist = ctx.dist,
      average = ctx.average,
      commanded = ctx.commanded,
      leaderAlive = ctx.leaderAlive,
      FIRE_CONTROL_ON = ctx.FIRE_CONTROL_ON,
      FIRETEAM_SPLIT_ON = ctx.FIRETEAM_SPLIT_ON,
      FIRE_CONTROL_TUNING = ctx.FIRE_CONTROL_TUNING;

    function mkm(s) {
      var St = root.BattleSoldierStats;
      return St && St.of ? +St.of(s).mkm || 0 : 0.5;
    }
    function firstHandContact(sq, battle) {
      var c = root.SquadAI.squadContact ? root.SquadAI.squadContact(sq, battle) : sq.contact,
        d = c && c.unit && root.SquadAI.threatDisposition ? root.SquadAI.threatDisposition(c.unit) : null,
        own = root.SquadAI.hasFirstHandMemory
          ? root.SquadAI.hasFirstHandMemory(c, battle)
          : !!(c && !c.heard && !c.relayedFrom);
      return c && c.unit && (!d || d.combatThreat) && own ? c : null;
    }
    function supportAuthorityContact(sq, battle) {
      var c = root.SquadAI.squadContact ? root.SquadAI.squadContact(sq, battle) : sq.contact,
        windowSeconds = FIRE_CONTROL_TUNING.returnFireWindow,
        direct = !!(c && c.seenBy != null && !c.heard && !c.relayedFrom),
        incoming = !!(c && c.fireRevealed && c.precision === 'fire-origin' && !c.relayedFrom);
      if (
        c &&
        isFinite(+c.x) &&
        isFinite(+c.z) &&
        isFinite(+c.at) &&
        battle.time >= +c.at &&
        battle.time - +c.at <= windowSeconds &&
        (direct || incoming)
      )
        return {
          x: +c.x,
          z: +c.z,
          at: +c.at,
          source: incoming ? 'incoming' : 'seen',
          targetId: c.unit && c.unit.id != null ? String(c.unit.id) : null
        };
      /* An incoming bullet's observed firing origin is a first-hand personal
         belief, even when the squad's single shared contact now holds a relay.
         Select only this soldier's actual sight/fire-origin record; a heard
         shot or a told coordinate never becomes fire authority. */
      var men = commanded(sq),
        personalAuthority = null;
      if (root.SquadAI.soldierContact)
        for (var j = 0; j < men.length; j++) {
          var soldier = men[j],
            r = soldier && !soldier.dead && root.SquadAI.soldierContact(soldier, battle),
            ownSight = !!(r && r.source === 'seen' && String(r.seenBy) === String(soldier.id)),
            ownFireOrigin = !!(r && r.source === 'incoming' && r.precision === 'fire-origin');
          if (
            !r ||
            (!ownSight && !ownFireOrigin) ||
            !isFinite(+r.x) ||
            !isFinite(+r.z) ||
            !isFinite(+r.at) ||
            !isFinite(+r.confidence) ||
            +r.confidence < 0.5 ||
            battle.time < +r.at ||
            battle.time - +r.at > windowSeconds
          )
            continue;
          if (!personalAuthority || +r.at > personalAuthority.at)
            personalAuthority = {
              x: +r.x,
              z: +r.z,
              at: +r.at,
              source: ownSight ? 'seen' : 'incoming',
              targetId: r.knownUnitId == null ? null : String(r.knownUnitId)
            };
        }
      if (personalAuthority) return personalAuthority;
      /* The legacy one-contact slot can prefer a newer relayed sighting over an
         independent, still-fresh first-hand soldier belief. Consult the OWN
         squad's multi-contact map rather than promoting the relayed coordinate
         into fire authority. No live enemy transform or hearsay may enter here. */
      var reports = root.SquadAI.squadContactsMap ? root.SquadAI.squadContactsMap(sq, battle) : null;
      if (!Array.isArray(reports) || reports.length > 32) return null;
      for (var i = 0; i < reports.length; i++) {
        var r = reports[i];
        if (
          !r ||
          r.source !== 'seen' ||
          r.sourceSoldier == null ||
          !isFinite(+r.x) ||
          !isFinite(+r.z) ||
          !isFinite(+r.at) ||
          !isFinite(+r.confidence) ||
          +r.confidence < 0.5 ||
          battle.time < +r.at ||
          battle.time - +r.at > windowSeconds
        )
          continue;
        return {
          x: +r.x,
          z: +r.z,
          at: +r.at,
          source: 'seen',
          targetId: r.targetId == null ? null : String(r.targetId)
        };
      }
      return null;
    }
    /* A prepared line may face several independently reported firing origins.
       The freshest first-hand position is not necessarily shootable from the
       real posts. Try the OWN squad's other fresh, first-hand records before
       abandoning its base of fire. Never substitute hearsay, stale coordinates
       or an enemy actor's current transform. */
    function supportAuthorityOptions(sq, battle) {
      var options = [],
        latest = supportAuthorityContact(sq, battle),
        windowSeconds = FIRE_CONTROL_TUNING.returnFireWindow,
        roster = commanded(sq);
      function add(r) {
        if (!r || !isFinite(+r.x) || !isFinite(+r.z) || !isFinite(+r.at)) return;
        if (battle.time < +r.at || battle.time - +r.at > windowSeconds) return;
        if (
          options.some(function (p) {
            return Math.hypot(p.x - +r.x, p.z - +r.z) < 1;
          })
        )
          return;
        options.push({ x: +r.x, z: +r.z, at: +r.at, source: r.source });
      }
      add(latest);
      if (root.SquadAI.soldierContact)
        roster.forEach(function (s) {
          if (!s || s.dead || s.isPlayer) return;
          var r = root.SquadAI.soldierContact(s, battle),
            sight = r && r.source === 'seen' && String(r.seenBy) === String(s.id),
            incoming = r && r.source === 'incoming' && r.precision === 'fire-origin';
          if (!r || (!sight && !incoming) || !isFinite(+r.confidence) || +r.confidence < 0.5) return;
          add({ x: r.x, z: r.z, at: r.at, source: sight ? 'seen' : 'incoming' });
        });
      var map = root.SquadAI.squadContactsMap && root.SquadAI.squadContactsMap(sq, battle);
      if (Array.isArray(map) && map.length <= 32)
        map.forEach(function (r) {
          if (
            r &&
            r.source === 'seen' &&
            r.sourceSoldier != null &&
            roster.some(function (s) {
              return s && !s.dead && String(s.id) === String(r.sourceSoldier);
            }) &&
            isFinite(+r.confidence) &&
            +r.confidence >= 0.5
          )
            add({ x: r.x, z: r.z, at: r.at, source: 'seen' });
        });
      return options.slice(0, 32);
    }
    function supportCandidates(sq, battle, point, prior, posture) {
      if (!point) return [];
      var E = root.BattleEngagement,
        A = root.BattleAmmunition,
        T = root.BattleTacticalPositions,
        previous = Array.isArray(prior) ? prior.map(String) : [],
        men = commanded(sq).filter(function (s) {
          if (
            !s ||
            s.dead ||
            s.hp <= 0 ||
            s.incapacitated ||
            s.isPlayer ||
            !s.weapon ||
            !s.weapon.stats ||
            s.weapon.jammed ||
            s.target ||
            s.moving ||
            s.crawling ||
            s.reloading ||
            s.clearingStoppage ||
            s.outOfAmmo ||
            s.suppressedUntil > battle.time ||
            (A && !A.available(s)) ||
            (T && T.current && T.current(s))
          )
            return false;
          var es = E && E.stateOf ? E.stateOf(s) : null;
          if (
            es &&
            (es.state === 'bound' ||
              es.state === 'pinned' ||
              es.state === 'withdraw' ||
              es.state === 'assault' ||
              (E.reacting && E.reacting(s)))
          )
            return false;
          /* Concealment holds the man crouched behind a crest. A genuinely
             held, prepared fireteam member can RISE to a standing firing
             ray on contact; do not discard him because today's low stance
             is intentionally masked. The prospective ray remains the
             shipping physical/ballistic test, not assumed fire capability. */
          if (root.SquadAI.canSuppress && root.SquadAI.canSuppress(s, point, battle, true)) return true;
          if (!posture || posture.readyAt == null || !Array.isArray(posture.heldActorIds)) return false;
          if (posture.heldActorIds.indexOf(String(s.id)) < 0) return false;
          return !!(root.SquadAI.canSuppressStanding && root.SquadAI.canSuppressStanding(s, point, battle));
        });
      men.sort(function (a, b) {
        var pa = previous.indexOf(String(a.id)) >= 0 ? 0 : 1,
          pb = previous.indexOf(String(b.id)) >= 0 ? 0 : 1;
        if (pa !== pb) return pa - pb;
        var ga = root.SquadAI.isMachineGun(a) ? 0 : 1,
          gb = root.SquadAI.isMachineGun(b) ? 0 : 1;
        if (ga !== gb) return ga - gb;
        return (+a.slotIndex || 0) - (+b.slotIndex || 0);
      });
      return men.slice(0, 2);
    }
    function areaSupport(sq, battle, report, posture, prev) {
      if (!posture || posture.readyAt == null || !report) return null;
      var authority = supportAuthorityContact(sq, battle);
      /* A directly observed threat can establish a lawful base of fire
         BEFORE the first enemy volley. Being shot at isn't the sole way to
         start support; heard/relayed contacts alone still have no authority. */
      if (!(report.underFire > 0) && !authority) return null;
      var oldPoint = prev && prev.supportPoint,
        options = supportAuthorityOptions(sq, battle),
        point =
          oldPoint && isFinite(+oldPoint.x) && isFinite(+oldPoint.z)
            ? { x: +oldPoint.x, z: +oldPoint.z }
            : authority && { x: authority.x, z: authority.z },
        men = supportCandidates(sq, battle, point, prev && prev.supporterIds, posture),
        chosen = authority;
      options.forEach(function (option) {
        if (men.length >= 2) return;
        var capable = supportCandidates(sq, battle, option, prev && prev.supporterIds, posture);
        if (capable.length > men.length) {
          men = capable;
          point = { x: option.x, z: option.z };
          chosen = option;
        }
      });
      /* One lawful gunner may establish a base of fire while a second man
         recovers from suppression or finds a lane. This is NOT maneuver
         authorization: supportReady plus the tactical posture still require
         two distinct capable shooters before any covered bound is issued. */
      if (!men.length || !point) return null;
      return {
        point: point,
        ids: men.map(function (s) {
          return String(s.id);
        }),
        source: chosen ? chosen.source : prev && prev.supportSource,
        at: chosen ? chosen.at : prev && prev.supportAt
      };
    }
    function sameAreaSupport(fc, support) {
      var oldIds = (fc && fc.supporterIds) || [],
        ids = (support && support.ids) || [],
        old = fc && fc.supportPoint,
        point = support && support.point;
      return (
        oldIds.length === ids.length &&
        oldIds.every(function (id, i) {
          return String(id) === String(ids[i]);
        }) &&
        ((!old && !point) ||
          (old && point && Math.abs(+old.x - +point.x) < 1e-6 && Math.abs(+old.z - +point.z) < 1e-6))
      );
    }

    function fireControlRange(sq, c) {
      var p = average(sq);
      return p && c ? dist(p, c) : Infinity;
    }
    function precisionShooter(men, target, battle) {
      var best = null,
        bestScore = -Infinity;
      for (var i = 0; i < men.length; i++) {
        var s = men[i],
          sp = s && s.root && s.root.position,
          tp = target && target.root && target.root.position,
          shotRange = sp && tp ? dist(sp, tp) : Infinity;
        if (!s.weapon || root.SquadAI.isMachineGun(s) || root.SquadAI.engageRange(s) < shotRange) continue;
        var roleBonus =
            s.role === 'sniper' ? 0.2 : s.role === 'scout' ? 0.12 : s.role === 'rifleman' ? 0.03 : 0,
          score = mkm(s) + roleBonus;
        if (
          score > bestScore + 1e-9 ||
          (Math.abs(score - bestScore) <= 1e-9 && best && String(s.id) < String(best.id))
        ) {
          best = s;
          bestScore = score;
        }
      }
      return best;
    }
    function fireControlTelemetry(sq, battle, fc) {
      telemetry(battle, 'decision-fire-control', {
        faction: sq.faction,
        squad: sq.id,
        state: fc.state,
        reason: fc.reason,
        target: fc.targetId,
        shooter: fc.shooterId,
        range: isFinite(fc.range) ? +fc.range.toFixed(1) : null,
        strength: +fc.strength.toFixed(2),
        marksmanship: +fc.marksmanship.toFixed(2),
        ready: fc.ready,
        requiredReady: fc.requiredReady,
        living: fc.living,
        visualLine: fc.visualLine,
        ballisticLine: fc.ballisticLine,
        terrainCrestBlocked: fc.terrainCrestBlocked,
        proneReady: fc.proneReady
      });
    }
    function fireControlTrailEntry(battle, state, reason, fc) {
      return {
        at: battle.time,
        state: state,
        reason: reason || null,
        targetId: fc && fc.targetId != null ? fc.targetId : null,
        shooterId: fc && fc.shooterId != null ? fc.shooterId : null,
        ready: fc ? +fc.ready || 0 : 0,
        requiredReady: fc ? +fc.requiredReady || 0 : 0,
        living: fc ? +fc.living || 0 : 0
      };
    }
    function pushFireControlTrail(sq, battle, state, reason, fc) {
      var trail = sq._fireControlTrail || (sq._fireControlTrail = []),
        prev = trail.length ? trail[trail.length - 1] : null;
      if (!prev || prev.state !== state || prev.reason !== reason) {
        trail.push(fireControlTrailEntry(battle, state, reason, fc));
        if (trail.length > 8) trail.splice(0, trail.length - 8);
      }
      return trail;
    }
    function fireControlCounts(men, battle, E) {
      var out = {
          ready: 0,
          visualLine: 0,
          ballisticLine: 0,
          terrainCrestBlocked: 0,
          proneReady: 0
        },
        i;
      for (i = 0; i < men.length; i++) {
        var o = E && E.fireControlObservation ? E.fireControlObservation(men[i], battle) : { ready: false },
          ready = E && E.fireControlReady ? E.fireControlReady(men[i], battle) : !!o.ready;
        if (ready) out.ready++;
        if (o.visualLine) out.visualLine++;
        if (o.ballisticLine) out.ballisticLine++;
        if (o.terrainCrestBlocked) out.terrainCrestBlocked++;
        if (o.proneReady) out.proneReady++;
      }
      return out;
    }
    function setFireControl(sq, battle, prev, state, reason, data) {
      data = data || {};
      var fc = {
        state: state,
        since: battle.time,
        startedAt: prev && isFinite(+prev.startedAt) ? +prev.startedAt : battle.time,
        targetId: data.targetId == null ? prev && prev.targetId : data.targetId,
        shooterId: data.shooterId == null ? null : data.shooterId,
        reason: reason,
        range: isFinite(+data.range) ? +data.range : prev && isFinite(+prev.range) ? +prev.range : Infinity,
        strength: isFinite(+data.strength) ? +data.strength : prev ? +prev.strength || 0 : 0,
        marksmanship: isFinite(+data.marksmanship) ? +data.marksmanship : prev ? +prev.marksmanship || 0 : 0,
        ready: data.ready == null ? (prev ? +prev.ready || 0 : 0) : +data.ready || 0,
        requiredReady:
          data.requiredReady == null ? (prev ? +prev.requiredReady || 0 : 0) : +data.requiredReady || 0,
        living: data.living == null ? (prev ? +prev.living || 0 : 0) : +data.living || 0,
        visualLine: data.visualLine == null ? (prev ? +prev.visualLine || 0 : 0) : +data.visualLine || 0,
        ballisticLine:
          data.ballisticLine == null ? (prev ? +prev.ballisticLine || 0 : 0) : +data.ballisticLine || 0,
        terrainCrestBlocked:
          data.terrainCrestBlocked == null
            ? prev
              ? +prev.terrainCrestBlocked || 0
              : 0
            : +data.terrainCrestBlocked || 0,
        proneReady: data.proneReady == null ? (prev ? +prev.proneReady || 0 : 0) : +data.proneReady || 0,
        supportPoint:
          data.areaSupport && data.areaSupport.point
            ? { x: +data.areaSupport.point.x, z: +data.areaSupport.point.z }
            : null,
        supporterIds:
          data.areaSupport && Array.isArray(data.areaSupport.ids)
            ? data.areaSupport.ids.slice(0, 2).map(String)
            : [],
        supportSource: data.areaSupport ? data.areaSupport.source || null : null,
        supportAt: data.areaSupport && isFinite(+data.areaSupport.at) ? +data.areaSupport.at : null
      };
      sq.fireControl = fc;
      var CR = root.BattleCommandReception,
        envelope =
          CR && CR.publish
            ? CR.publish(sq, battle, 'posture-fire', commanded(sq), {
                scope: 'squad',
                action: 'fire-control-' + state,
                signature:
                  String(state) +
                  '|' +
                  String(fc.targetId == null ? '' : fc.targetId) +
                  '|' +
                  String(fc.shooterId == null ? '' : fc.shooterId) +
                  '|' +
                  fc.supporterIds.join(',') +
                  '|' +
                  (fc.supportPoint
                    ? (+fc.supportPoint.x).toFixed(2) + ',' + (+fc.supportPoint.z).toFixed(2)
                    : ''),
                reason: reason || null,
                spatial: false,
                reference: 'none',
                data: {
                  state: state,
                  targetId: fc.targetId == null ? null : String(fc.targetId),
                  shooterId: fc.shooterId == null ? null : String(fc.shooterId),
                  supportPoint: fc.supportPoint ? { x: +fc.supportPoint.x, z: +fc.supportPoint.z } : null,
                  supporterIds: fc.supporterIds.slice(),
                  supportSource: fc.supportSource,
                  supportAt: fc.supportAt
                }
              })
            : null;
      void envelope;
      fc.trail = pushFireControlTrail(sq, battle, state, reason, fc).slice();
      fireControlTelemetry(sq, battle, fc);
      return fc;
    }
    function clearFireControl(sq, battle, reason) {
      if (sq.fireControl) {
        var previous = sq.fireControl,
          CR = root.BattleCommandReception;
        pushFireControlTrail(sq, battle, 'clear', reason || 'contact clear', previous);
        telemetry(battle, 'decision-fire-control', {
          faction: sq.faction,
          squad: sq.id,
          state: 'clear',
          reason: reason || 'contact clear',
          trail: (sq._fireControlTrail || []).slice()
        });
        if (CR && CR.publish)
          CR.publish(sq, battle, 'posture-fire', commanded(sq), {
            scope: 'squad',
            action: 'fire-control-clear',
            signature:
              'clear|' +
              String(previous.targetId == null ? '' : previous.targetId) +
              '|' +
              String(previous.shooterId == null ? '' : previous.shooterId),
            reason: reason || 'contact clear',
            spatial: false,
            reference: 'none',
            data: {
              state: 'clear',
              targetId: previous.targetId == null ? null : String(previous.targetId),
              shooterId: previous.shooterId == null ? null : String(previous.shooterId)
            }
          });
      }
      sq.fireControl = null;
    }
    function updateFireControl(sq, battle, report) {
      if (!FIRE_CONTROL_ON || !sq || !battle) return null;
      var fc = sq.fireControl;
      var postures = ctx.tacticalPostures && ctx.tacticalPostures(),
        posture = postures && postures.current(battle, sq);
      var preparedPosture = !!(
        posture &&
        posture.readyAt != null &&
        (posture.mode === 'ambush' ||
          (posture.mode === 'hold' &&
            posture.stage === 'pressure-hold' &&
            posture.orders &&
            posture.orders.length >= 3))
      );
      if (posture && (posture.mode === 'ambush' || preparedPosture)) {
        var contact = firstHandContact(sq, battle),
          ambushCounts = fireControlCounts(commanded(sq), battle, root.BattleEngagement),
          /* A fully prepared line with fresh, first-hand fire authority
             may send ONE genuinely shootable supporter before a second
             rifleman finishes his setup. Incoming fire remains autonomous;
             hearsay never opens fire. This changes fire permission, NOT
             the independent two-effective-supporter maneuver gate. */
          authority = posture.readyAt != null ? supportAuthorityContact(sq, battle) : null,
          open =
            (report && report.underFire > 0) ||
            (posture.readyAt != null && ((contact && ambushCounts.ready >= 2) || !!authority)),
          desired = open ? 'open' : 'hold',
          support = desired === 'open' ? areaSupport(sq, battle, report, posture, fc) : null;
        if (
          fc &&
          fc.state === desired &&
          fc.reason === 'coordinated masked ambush' &&
          sameAreaSupport(fc, support)
        )
          return fc;
        return setFireControl(sq, battle, fc, desired, 'coordinated masked ambush', {
          targetId: contact && contact.unit.id,
          ready: ambushCounts.ready,
          requiredReady: 2,
          living: posture.members.length,
          areaSupport: support
        });
      }
      if (fc && fc.state === 'reposition' && battle.time - fc.since >= FIRE_CONTROL_TUNING.repositionTimeout)
        return setFireControl(sq, battle, fc, 'open', 'reposition timed out: resume maneuver fire');
      var c = firstHandContact(sq, battle);
      if (!c) return fc || null;
      if (fc && fc.state === 'open') return fc;
      if (!fc || (fc.targetId != null && String(fc.targetId) !== String(c.unit.id))) {
        fc = setFireControl(sq, battle, null, 'hold', 'first visual contact', { targetId: c.unit.id });
      }
      if ((report && report.underFire) > 0) {
        return setFireControl(sq, battle, fc, 'open', 'enemy fire received', { targetId: c.unit.id });
      }
      var men = commanded(sq),
        living = men.length,
        sum = 0,
        E = root.BattleEngagement,
        counts = fireControlCounts(men, battle, E),
        i;
      for (i = 0; i < living; i++) sum += mkm(men[i]);
      var strength = living / Math.max(1, root.SquadAI.establishment(sq)),
        meanMkm = living ? sum / living : 0,
        range = fireControlRange(sq, c),
        needed = Math.min(
          living,
          Math.max(FIRE_CONTROL_TUNING.minReady, Math.ceil(living * FIRE_CONTROL_TUNING.readyFraction))
        ),
        elapsed = battle.time - fc.startedAt,
        ready = counts.ready;
      fc.range = range;
      fc.strength = strength;
      fc.marksmanship = meanMkm;
      fc.ready = ready;
      fc.requiredReady = needed;
      fc.living = living;
      fc.visualLine = counts.visualLine;
      fc.ballisticLine = counts.ballisticLine;
      fc.terrainCrestBlocked = counts.terrainCrestBlocked;
      fc.proneReady = counts.proneReady;
      fc.targetId = c.unit.id;
      fc.trail = (sq._fireControlTrail || []).slice();

      if (!leaderAlive(sq)) return fc;
      if (fc.state === 'precision') return fc;

      if (range >= FIRE_CONTROL_TUNING.longRange && elapsed >= FIRE_CONTROL_TUNING.prepMin) {
        var shot = precisionShooter(men, c.unit, battle);
        if (
          shot &&
          mkm(shot) >= FIRE_CONTROL_TUNING.precisionMarksmanship &&
          E &&
          E.fireControlReady &&
          E.fireControlReady(shot, battle)
        )
          return setFireControl(sq, battle, fc, 'precision', 'long-range marksman', {
            targetId: c.unit.id,
            shooterId: shot.id,
            range: range,
            strength: strength,
            marksmanship: meanMkm,
            ready: ready,
            living: living
          });
      }

      var prepared = ready >= needed && elapsed >= FIRE_CONTROL_TUNING.prepMin,
        willing =
          range <= FIRE_CONTROL_TUNING.closeRange ||
          (strength >= FIRE_CONTROL_TUNING.minStrength && meanMkm >= FIRE_CONTROL_TUNING.minMarksmanship);
      if (prepared && willing)
        return setFireControl(sq, battle, fc, 'open', 'squad prepared', {
          targetId: c.unit.id,
          range: range,
          strength: strength,
          marksmanship: meanMkm,
          ready: ready,
          living: living
        });

      if (elapsed >= FIRE_CONTROL_TUNING.maxHold && ready === 0 && fc.state !== 'reposition')
        return setFireControl(sq, battle, fc, 'reposition', 'no viable prone firing line', {
          targetId: c.unit.id,
          range: range,
          strength: strength,
          marksmanship: meanMkm,
          ready: ready,
          living: living
        });
      if (elapsed >= FIRE_CONTROL_TUNING.maxHold && ready > 0)
        return setFireControl(sq, battle, fc, 'open', 'leader accepted partial firing line', {
          targetId: c.unit.id,
          range: range,
          strength: strength,
          marksmanship: meanMkm,
          ready: ready,
          living: living
        });
      return fc;
    }

    return {
      mkm: mkm,
      firstHandContact: firstHandContact,
      supportAuthorityContact: supportAuthorityContact,
      areaSupport: areaSupport,
      fireControlRange: fireControlRange,
      precisionShooter: precisionShooter,
      fireControlTelemetry: fireControlTelemetry,
      fireControlTrailEntry: fireControlTrailEntry,
      pushFireControlTrail: pushFireControlTrail,
      fireControlCounts: fireControlCounts,
      setFireControl: setFireControl,
      clearFireControl: clearFireControl,
      updateFireControl: updateFireControl,
      FIRE_CONTROL_ON: FIRE_CONTROL_ON,
      FIRETEAM_SPLIT_ON: FIRETEAM_SPLIT_ON,
      FIRE_CONTROL_TUNING: FIRE_CONTROL_TUNING
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
