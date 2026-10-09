/* Squad Leader retreat-anchor + anchor-publisher sub-module (extracted from 16-squad-plan-stability.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.
   The parent file calls the factory with its closure utilities and re-attaches the returned
   functions as closure variables, so all callers (advanceSquadAnchor, updateCohesion, reform,
   the public API export BattleSquadStability.publishAnchor) see the same functions as before.
   The RETREAT_* / ORDER_STRIDE tuning constants stay in 16 (they are exported in
   BattleSquadStability.tuning.retreatAnchor) and are passed into the factory via ctx.
   publishAnchor remains the one writer of the squad's orderAnchor/rally pair
   (state-ownership-check.js holds both fields to this function, now in this file). */
(function (root) {
  'use strict';
  if (root._squadLeaderRetreatAnchor) return;

  /* Factory: called by 16-squad-plan-stability.js after its shared utilities are defined.
     ctx provides the closure utilities and tuning the retreat-anchor functions need. */
  root._squadLeaderRetreatAnchor = function (ctx) {
    var root = ctx.root,
      L = ctx.root.BattleLeases,
      telemetry = ctx.telemetry,
      dist = ctx.dist,
      copy = ctx.copy,
      commanded = ctx.commanded,
      average = ctx.average,
      averageMembers = ctx.averageMembers,
      ORDER_STRIDE = ctx.ORDER_STRIDE,
      RETREAT_ANCHOR_LEASE = ctx.RETREAT_ANCHOR_LEASE,
      RETREAT_ANCHOR_ARRIVE = ctx.RETREAT_ANCHOR_ARRIVE,
      RETREAT_PROGRESS_EPS = ctx.RETREAT_PROGRESS_EPS,
      RETREAT_GOAL_EPS = ctx.RETREAT_GOAL_EPS,
      RETREAT_NO_PROGRESS = ctx.RETREAT_NO_PROGRESS,
      RETREAT_BLOCKED_MIN = ctx.RETREAT_BLOCKED_MIN,
      RETREAT_DANGER_MARGIN = ctx.RETREAT_DANGER_MARGIN,
      RETREAT_RECOVERY_STRIDE = ctx.RETREAT_RECOVERY_STRIDE;
    function retreatCenter(sq) {
      return averageMembers(commanded(sq)) || average(sq) || copy(sq.orderAnchor || sq.rally || sq.home);
    }
    function retreatBlocked(sq) {
      var men = commanded(sq),
        blocked = 0;
      for (var i = 0; i < men.length; i++) {
        var why = String(men[i]._movementStopReason || '');
        if (why === 'path-blocked' || why === 'step-blocked') blocked++;
      }
      return blocked >= Math.max(RETREAT_BLOCKED_MIN, Math.ceil(men.length * 0.5));
    }
    function retreatUnsafe(sq, battle, anchor, center) {
      var c = root.SquadAI.squadContact ? root.SquadAI.squadContact(sq, battle) : sq.contact;
      if (!c || !anchor || !center) return false;
      var da = dist(c, anchor),
        dc = dist(c, center);
      /* Only invalidate when the leased retreat endpoint is materially closer to the known threat
       than the men are now. Ordinary contact ahead does not churn a rearward anchor. */
      return da + RETREAT_DANGER_MARGIN < dc;
    }
    /* The anchor is where the fireteam slots are laid, so a man who has reached his own slot stands a slot
     offset away from it (6.5 m for a lone rifleman), outside RETREAT_ANCHOR_ARRIVE although the order is
     carried out. When every commanded man reports he arrived, the squad has reached the anchor; waiting
     on the centre alone left a squad of one 22 m short of the rally until the battle ended.
     ?retreatArrival=0 is the old centre-only test. */
    var RETREAT_ARRIVAL_ON = !/[?&]retreatArrival=(?:0|off|false)(?:&|#|$)/i.test(
      typeof location !== 'undefined' ? location.search || '' : ''
    );
    function retreatSettled(sq, distance) {
      if (!RETREAT_ARRIVAL_ON || !(distance <= 2 * RETREAT_ANCHOR_ARRIVE)) return false;
      var men = commanded(sq);
      if (!men.length) return false;
      for (var i = 0; i < men.length; i++)
        if (String(men[i]._movementStopReason || '') !== 'arrived') return false;
      return true;
    }
    function retreatPoint(base, goal, scale) {
      base = copy(base);
      goal = copy(goal);
      if (!base || !goal) return base || goal;
      var dx = goal.x - base.x,
        dz = goal.z - base.z,
        len = Math.hypot(dx, dz);
      if (len <= 2) return goal;
      var step = Math.min(ORDER_STRIDE * (scale == null ? 1 : scale), len);
      return { x: base.x + (dx / len) * step, z: base.z + (dz / len) * step };
    }
    function grantRetreatAnchor(sq, battle, base, goal, reason, scale) {
      var t = battle.time,
        center = retreatCenter(sq) || base,
        next = retreatPoint(base, goal, scale),
        d = center && next ? dist(center, next) : Infinity;
      publishAnchor(sq, next);
      sq._orderGoal = copy(goal);
      sq._orderVersion = (+sq._orderVersion || 0) + 1;
      L.grant(
        sq,
        'retreat-anchor',
        'squad-leader',
        t,
        t + RETREAT_ANCHOR_LEASE,
        reason || 'retreat endpoint',
        'arrival, retreat goal change, blocked/unsafe route, no-progress timeout or retreat end',
        {
          anchor: copy(next),
          goal: copy(goal),
          bestDistance: d,
          distance: d,
          lastProgressAt: t,
          grantedAt: t,
          reason: reason || 'retreat endpoint'
        }
      );
      telemetry(battle, 'decision-retreat-anchor', {
        faction: sq.faction,
        squad: sq.id,
        reason: reason || 'retreat endpoint',
        anchor: copy(next),
        goal: copy(goal),
        distance: isFinite(d) ? +d.toFixed(2) : null
      });
      return next;
    }
    function stableRetreatAnchor(sq, battle) {
      var t = battle.time,
        goal = root.SquadAI.retreatGoal(sq),
        center = retreatCenter(sq) || sq.orderAnchor || sq.rally || goal,
        held = L.get(sq, 'retreat-anchor');
      if (!held)
        return grantRetreatAnchor(sq, battle, sq.orderAnchor || sq.rally || center, goal, 'retreat start', 1);

      var d = held.data || (held.data = {}),
        anchor = d.anchor || sq.orderAnchor || sq.rally,
        distance = center && anchor ? dist(center, anchor) : Infinity,
        goalChanged = !d.goal || dist(goal, d.goal) > RETREAT_GOAL_EPS,
        blocked = retreatBlocked(sq),
        unsafe = retreatUnsafe(sq, battle, anchor, center),
        recovering =
          d.reason === 'route blocked' || d.reason === 'anchor unsafe' || d.reason === 'no retreat progress';
      d.distance = distance;

      if (goalChanged) {
        L.end(sq, 'retreat-anchor', t, 'retreat goal moved');
        return grantRetreatAnchor(sq, battle, center, goal, 'retreat goal moved', 1);
      }
      /* A blocked/unsafe observation gets one recovery rebase, then that recovery itself receives the
       normal lease/no-progress window. Persistent stop flags must not recreate the endpoint every tick. */
      if ((unsafe || blocked) && !recovering) {
        L.end(sq, 'retreat-anchor', t, unsafe ? 'anchor unsafe' : 'route blocked');
        return grantRetreatAnchor(
          sq,
          battle,
          center,
          goal,
          unsafe ? 'anchor unsafe' : 'route blocked',
          RETREAT_RECOVERY_STRIDE
        );
      }
      if (distance <= RETREAT_ANCHOR_ARRIVE || retreatSettled(sq, distance)) {
        /* At the final retreat point there is nowhere else to publish. Keep the same stable endpoint. */
        if (anchor && goal && dist(anchor, goal) <= 2) {
          d.bestDistance = Math.min(isFinite(+d.bestDistance) ? +d.bestDistance : distance, distance);
          d.lastProgressAt = t;
          L.extend(sq, 'retreat-anchor', 'squad-leader', t, t + RETREAT_ANCHOR_LEASE, 'final retreat point');
          return anchor;
        }
        L.end(sq, 'retreat-anchor', t, 'anchor reached');
        return grantRetreatAnchor(sq, battle, anchor || center, goal, 'anchor reached', 1);
      }
      if (!isFinite(+d.bestDistance) || distance < +d.bestDistance - RETREAT_PROGRESS_EPS) {
        d.bestDistance = distance;
        d.lastProgressAt = t;
        L.extend(sq, 'retreat-anchor', 'squad-leader', t, t + RETREAT_ANCHOR_LEASE, 'retreat progress');
        return anchor;
      }
      var progressAt = isFinite(+d.lastProgressAt) ? +d.lastProgressAt : t;
      if (t - progressAt >= RETREAT_NO_PROGRESS || !L.holds(sq, 'retreat-anchor', t)) {
        L.end(sq, 'retreat-anchor', t, 'no retreat progress');
        return grantRetreatAnchor(sq, battle, center, goal, 'no retreat progress', RETREAT_RECOVERY_STRIDE);
      }
      return anchor;
    }
    /* The one publisher of the squad's anchor. `orderAnchor` is where the fireteam slots are laid; `rally` is
     the same point for the readers that only know a rally point (the doctrine's empty-squad fallback, the
     resolver's last resort, the exports). Every move of either goes through here: the per-step advance
     below, the regroup commit (updateCohesion), the General's reconstitution merge and the garrison setup,
     which call it as BattleSquadStability.publishAnchor. Nothing else assigns the pair
     (state-ownership-check.js holds this to the function), so the two cannot disagree and a move is never
     labelled by whichever path happened to write it: the advance (the squadCommand slot) and the regroup
     (this module's commander hook) used to assign it separately, and the provenance log read one owner
     reached by two paths as squad-orders, squad-stability, squad-orders: a writer-ping-pong. Both fields
     are replaced with fresh copies, so a held reference never moves under its holder. */
    function publishAnchor(sq, point) {
      sq.orderAnchor = { x: point.x, z: point.z };
      sq.rally = { x: point.x, z: point.z };
      return sq.orderAnchor;
    }

    return {
      retreatCenter: retreatCenter,
      retreatBlocked: retreatBlocked,
      retreatUnsafe: retreatUnsafe,
      retreatPoint: retreatPoint,
      grantRetreatAnchor: grantRetreatAnchor,
      stableRetreatAnchor: stableRetreatAnchor,
      publishAnchor: publishAnchor
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
