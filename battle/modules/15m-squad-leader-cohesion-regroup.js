/* Squad Leader cohesion-regroup sub-module (extracted from 16-squad-plan-stability.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.
   This is the Squad Leader's dispersion state machine: the core/outlier hysteresis
   (cohesionState), the straggler catch-up release (markCatchup), the regroup lease
   lifecycle (endRegroup) and the commander-tick cohesion review (updateCohesion) that
   commits, holds and releases a regroup. The geometry analyzer cohesionAssessment stays
   in the parent file: it is a hoisted declaration there, the reconstitution factory ctx
   (15k) consumes it at factory time and the parent exports it as
   BattleRegroupHysteresis.assessment. The parent calls this factory after the
   retreat-anchor and formation re-attaches are in scope (updateCohesion publishes the
   rally anchor through publishAnchor and scores men along commandForward/forwardMajority)
   and re-attaches the returned functions as closure variables, so commanderTick and the
   public API export see the same functions as before. The regroup constants stay in 16
   (load-time location.search parsing neighbourhood) and are passed in via ctx; the lease
   manager comes off ctx.root.BattleLeases (the 15k pattern). */
(function (root) {
  'use strict';
  if (root._squadLeaderCohesionRegroup) return;

  /* Factory: called by 16-squad-plan-stability.js after the 15g formation re-attach. */
  root._squadLeaderCohesionRegroup = function (ctx) {
    var root = ctx.root,
      L = ctx.root.BattleLeases,
      telemetry = ctx.telemetry,
      dist = ctx.dist,
      copy = ctx.copy,
      commanded = ctx.commanded,
      alive = ctx.alive,
      leaderAlive = ctx.leaderAlive,
      cfg = ctx.cfg,
      missionVersion = ctx.missionVersion,
      averageMembers = ctx.averageMembers,
      cohesionAssessment = ctx.cohesionAssessment,
      leaderlessActive = ctx.leaderlessActive,
      commandForward = ctx.commandForward,
      forwardMajority = ctx.forwardMajority,
      publishAnchor = ctx.publishAnchor,
      transitionPhase = ctx.transitionPhase,
      REGROUP_ENTER = ctx.REGROUP_ENTER,
      REGROUP_RELEASE = ctx.REGROUP_RELEASE,
      REGROUP_MIN = ctx.REGROUP_MIN,
      REGROUP_ESCALATION_SECS = ctx.REGROUP_ESCALATION_SECS,
      REENTRY = ctx.REENTRY,
      STRAGGLER_BYPASS = ctx.STRAGGLER_BYPASS;
  function cohesionState(sq) {
    return (
      sq._regroupHysteresis ||
      (sq._regroupHysteresis = {
        overSince: null,
        lastForward: null,
        entries: 0,
        exits: 0,
        timeouts: 0,
        contactExits: 0,
        suppressed: 0,
        stragglerSuppressions: 0,
        regroupRequests: 0,
        byEnd: {},
        recoveries: 0
      })
    );
  }
  function markCatchup(ca, t) {
    for (var i = 0; i < ca.members.length; i++) {
      if (root.BattleMovementResolver) root.BattleMovementResolver.releaseCommit(ca.members[i]);
    }
  }
  function endRegroup(sim, sq, reason) {
    var lease = L.get(sq, 'regroup');
    if (!lease || !L.end(sq, 'regroup', sim.time, reason)) return false;
    var st = cohesionState(sq);
    st.exits++;
    st.overSince = null;
    st.byEnd = st.byEnd || {};
    st.byEnd[reason] = (st.byEnd[reason] || 0) + 1;
    (sq.members || []).forEach(function (s) {
      s._regroupUnstick = null;
    });
    L.end(sq, 'corner-hold', sim.time, 'regroup released');
    L.grant(sq, 'regroup-cooldown', 'squad-leader', sim.time, sim.time + REENTRY, reason);
    /* Phase and lease are one authority handoff. If regroup ends while mission execution is
       temporarily suspended (for example during leader succession), the stale regroup phase
       must not keep overriding valid Micro movement after the lease is gone. Resume the phase
       that regroup interrupted; the next mission tick may immediately select a newer one. */
    if (sq.commandPhase === 'regroup') {
      var resume = lease.data && lease.data.resumePhase;
      if (!resume || resume === 'regroup') resume = 'approach';
      transitionPhase(sim, sq, resume, 'regroup released: ' + reason, 'regroup');
    }
    return true;
  }
  function updateCohesion(sim, sq) {
    if (!sq) return;
    var current = L.get(sq, 'regroup'),
      interrupted =
        sq.state === 'retreat'
          ? 'retreat'
          : !alive(sq).length
            ? 'no survivors'
            : current && current.data.missionVersion !== missionVersion(sq)
              ? 'new mission'
              : null;
    if (interrupted) {
      endRegroup(sim, sq, interrupted);
      return;
    }
    var c = cfg(sim, sq),
      limit = +(leaderAlive(sq) ? c.cohesionRadius : c.captainlessCohesion) || 34,
      /* Tactical dispersion is not marching formation. Outside open-ground advance,
         give independently positioned men a larger operating area; the existing
         core/outlier assessment still detects genuinely separated squads. */
      tactical = sq.commandPhase === 'assault' || sq.commandPhase === 'capture' ||
        sq.commandPhase === 'clear-town' || sq.commandPhase === 'defend' ||
        sq.commandPhase === 'hold' || sq.commandPhase === 'support-hold',
      operatingLimit = tactical ? limit * 1.5 : limit,
      release = operatingLimit * REGROUP_RELEASE,
      st = cohesionState(sq),
      t = sim.time,
      ca = cohesionAssessment(sq, operatingLimit);
    sq._cohesionAssessment = {
      rawSpread: +ca.rawSpread.toFixed(3),
      coreSpread: +ca.coreSpread.toFixed(3),
      stragglers: ca.stragglers.slice(),
      outrunners: ca.outrunners.slice(),
      allowed: ca.allowed,
      operatingRadius: +operatingLimit.toFixed(3),
      dispersed: ca.dispersed
    };
    /* No absent leader may invent a new regroup. An already-issued regroup remains a parent intent
       whose release conditions can still complete; immediate contact may still break it below. */
    if (leaderlessActive(sq) && !current) {
      st.overSince = null;
      return;
    }
    /* Recon deliberately makes one or two men outrunners while the main body holds. That separation
       is owned by the live recon lease, not evidence that squad cohesion failed. Starting a regroup
       here would create two Squad Leader command commitments fighting over the same men. Keep the
       full assessment for diagnostics, but do not let intentional recon geometry open a regroup. */
    if (L.get(sq, 'recon')) {
      st.overSince = null;
      if (current) endRegroup(sim, sq, 'recon supersedes regroup');
      return;
    }
    /* A just-completed no-contact recon leaves one or two men intentionally forward.
       The existing regroup-bypass lease owns that short reintegration window. End it as soon as
       the scouts are back inside the ordinary release radius from the non-scout main body so a
       genuine later cohesion failure is never masked for the full ceiling. */
    var rejoin = L.get(sq, 'regroup-bypass');
    if (rejoin && rejoin.reason === 'recon rejoin') {
      var ids = (rejoin.data && rejoin.data.scoutIds) || [],
        idSet = {},
        body = [],
        scouts = [];
      for (var ri = 0; ri < ids.length; ri++) idSet[String(ids[ri])] = 1;
      var living = commanded(sq);
      for (ri = 0; ri < living.length; ri++) {
        if (idSet[String(living[ri].id)]) scouts.push(living[ri]);
        else body.push(living[ri]);
      }
      var bodyCenter = averageMembers(body),
        rejoined = !scouts.length || !bodyCenter;
      if (bodyCenter && scouts.length) {
        rejoined = true;
        for (ri = 0; ri < scouts.length; ri++)
          if (dist(scouts[ri].root.position, bodyCenter) > release) {
            rejoined = false;
            break;
          }
      }
      if (
        rejoined ||
        (rejoin.data && rejoin.data.missionVersion !== missionVersion(sq)) ||
        sq.state === 'retreat'
      )
        L.end(sq, 'regroup-bypass', t, rejoined ? 'scouts rejoined' : 'rejoin invalidated');
    }
    var p = sq._engagementPlan,
      combatPlan = p && (p.status === 'active' || p.status === 'quiet');
    if (sq.inContact || combatPlan) {
      st.overSince = null;
      if (endRegroup(sim, sq, 'contact')) {
        st.contactExits++;
      }
      L.extend(sq, 'regroup-bypass', 'squad-leader', t, t + 1.25, 'firefight in progress');
      return;
    }
    /* Release hands the squad straight back to mission execution in the same Squad Leader tick. */
    var regroup = L.get(sq, 'regroup');
    if (regroup) {
      var age = t - regroup.since;
      /* Regroup is an area objective, not a request to reconstruct fireteam slots.
         Count living commanded men inside the rally circle; a bounded minority of
         stragglers may catch up without holding the entire squad indefinitely. */
      var rallyAnchor = regroup.data.anchor || ca.center,
        rallyMen = commanded(sq),
        rallyInside = rallyMen.filter(function (man) {
          return dist(man.root.position, rallyAnchor) <= release;
        }).length,
        rallyRequired = Math.max(1, rallyMen.length - ca.allowed);
      /* A squad that has cohered elsewhere must not remain trapped by a stale
         rally point (e.g. a new tactical position reached while regrouping).
         Retain the original core-spread escape alongside rally-area quorum. */
      if (age >= REGROUP_MIN && (rallyInside >= rallyRequired || ca.coreSpread <= release)) {
        endRegroup(sim, sq, 'cohesion restored');
        return;
      }
      /* Escalation: if one or more men are genuinely stuck (their movement progress
         reports them stuck on a regroup-kind goal) and the rally quorum has not been
         met for REGROUP_ESCALATION_SECS, the cohered majority is being held indefinitely
         on the stuck man's account. Release the squad back to mission execution with a
         regroup-bypass lease so rawSpread > operatingLimit does not immediately re-enter
         regroup. The stuck men rejoin under STRAGGLER_BYPASS. Gated on actual stuck men
         (not just time) so a stationary squad in a test fixture or a slowly-converging
         squad is not escalated. */
      if (age >= REGROUP_ESCALATION_SECS && rallyInside < rallyRequired) {
        var hasStuckMan = alive(sq).some(function (man) {
          var p = man._movementProgress;
          return p && p.stuck && p.kind === 'regroup';
        });
        if (hasStuckMan) {
          st.escalations = (st.escalations || 0) + 1;
          L.extend(sq, 'regroup-bypass', 'squad-leader', t, t + STRAGGLER_BYPASS, 'regroup escalation: stuck straggler');
          endRegroup(sim, sq, 'regroup escalation: stuck straggler');
          return;
        }
      }
      /* Progress belongs to movement; only the leader authorizes the regroup escape. */
      alive(sq).forEach(function (s) {
        var progress = s._movementProgress;
        if (
          progress &&
          progress.stuck &&
          progress.kind === 'regroup' &&
          !s.reloading &&
          !s.clearingStoppage &&
          !(s.suppressedUntil > t) &&
          !s._regroupUnstick
        ) {
          s._regroupUnstick = { since: regroup.since };
          st.recoveries = (st.recoveries || 0) + 1;
        }
      });
      transitionPhase(sim, sq, 'regroup', 'regroup lease active', 'regroup');
      sq.objective = copy(regroup.data.anchor || ca.center);
      return;
    }
    /* The Squad Leader, not the General, decides a squad is too scattered to keep executing. */
    var requested = !sq.inContact && !L.holds(sq, 'regroup-bypass', t) && ca.rawSpread > operatingLimit;
    if (!requested) {
      st.overSince = null;
      return;
    }
    st.regroupRequests++;
    if (!ca.dispersed && ca.stragglers.length) {
      markCatchup(ca, t);
      st.stragglerSuppressions++;
      st.suppressed++;
      L.grant(sq, 'regroup-bypass', 'squad-leader', t, t + STRAGGLER_BYPASS, 'stragglers catching up');
      return;
    }
    if (!ca.dispersed) {
      st.suppressed++;
      return;
    }
    if (st.overSince == null) st.overSince = t;
    if (L.holds(sq, 'regroup-cooldown', t) || t - st.overSince < REGROUP_ENTER) {
      st.suppressed++;
      return;
    }
    /* Re-form on the forward majority, not the average: the men behind come up to where most of the
       squad already is, instead of the leading men being pulled back to the middle. */
    var marching = commandForward(sq),
      fwd = forwardMajority(alive(sq), marching),
      anchor = copy(fwd ? fwd.point : ca.center);
    L.grant(
      sq,
      'regroup',
      'squad-leader',
      t,
      Infinity,
      'squad dispersed',
      'core spread back inside ' +
        Math.round(release) +
        ' m after ' +
        REGROUP_MIN +
        ' s, contact, retreat, new mission or no survivors',
      {
        anchor: anchor,
        missionVersion: missionVersion(sq),
        resumePhase: sq.commandPhase && sq.commandPhase !== 'regroup' ? sq.commandPhase : 'approach',
        startSpread: ca.coreSpread,
        forward: Math.hypot(marching.x, marching.z) > 1e-6 ? marching : null
      }
    );
    st.entries++;
    sq._regroupRecovery = {
      serial: (+sq._regroupRecoverySerial || 0) + 1,
      startedAt: t,
      anchor: copy(anchor)
    };
    sq._regroupRecoverySerial = sq._regroupRecovery.serial;
    sq.objective = copy(anchor);
    /* The rally point is where the squad re-forms: move the Squad Leader's order anchor there so the
       fireteam slots (and so every man's movement order) are built around it. The anchor is frozen
       during a regroup; left where it was it had usually run ahead with the leading men, and the
       squad re-formed around that instead - or ran out the 18 s regroup lease walking to it. */
    publishAnchor(sq, anchor);
    transitionPhase(sim, sq, 'regroup', 'squad dispersed', 'regroup');
    telemetry(sim, 'decision-regroup-commit', {
      faction: sq.faction,
      squad: sq.id,
      serial: sq._regroupRecovery.serial,
      anchor: copy(anchor)
    });
  }

    return {
      cohesionState: cohesionState,
      markCatchup: markCatchup,
      endRegroup: endRegroup,
      updateCohesion: updateCohesion
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);