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
        var roleBonus = s.role === 'sniper' ? 0.2 : s.role === 'scout' ? 0.12 : s.role === 'rifleman' ? 0.03 : 0,
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
        var o =
            E && E.fireControlObservation
              ? E.fireControlObservation(men[i], battle)
              : { ready: false },
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
        targetId: data.targetId == null ? (prev && prev.targetId) : data.targetId,
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
        proneReady: data.proneReady == null ? (prev ? +prev.proneReady || 0 : 0) : +data.proneReady || 0
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
                  String(fc.shooterId == null ? '' : fc.shooterId),
                reason: reason || null,
                spatial: false,
                reference: 'none',
                data: {
                  state: state,
                  targetId: fc.targetId == null ? null : String(fc.targetId),
                  shooterId: fc.shooterId == null ? null : String(fc.shooterId)
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
      var c = firstHandContact(sq, battle),
        fc = sq.fireControl;
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

      if (
        fc.state === 'reposition' &&
        battle.time - fc.since >= FIRE_CONTROL_TUNING.repositionTimeout
      )
        return setFireControl(sq, battle, fc, 'open', 'reposition timed out: resume maneuver fire', {
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
