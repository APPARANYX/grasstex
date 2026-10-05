/* Squad Leader mission-execution sub-module (extracted from 16-squad-plan-stability.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.
   The Squad Leader's execution of the General's brief - the route legs (with urban corner
   pauses), the doctrine hold/support waits, the objective phase selection and the squad
   objective point - is here, together with its helpers (inTown, missionLegs,
   assaultCommitted, objectivePhase). The parent file calls the factory with its closure
   utilities and re-attaches the returned functions as closure variables, so the commander
   tick and the public API export see the same functions as before. 16 remains the phase
   machine's owner: executeMission changes phase only through setPhase (transitionPhase),
   which stays in 16 with state-ownership-check's commandPhase pin. The
   URBAN_ARRIVAL_COHESION constant stays in 16 and is passed into the factory via ctx. */
(function (root) {
  'use strict';
  if (root._squadLeaderMissionExecution) return;

  /* Factory: called by 16-squad-plan-stability.js after the scouts-forward and
     reconstitution re-attaches are in scope. missionVersion, setPhase and closePlan are
     hoisted function declarations in the parent closure. */
  root._squadLeaderMissionExecution = function (ctx) {
    var root = ctx.root,
      L = ctx.root.BattleLeases,
      telemetry = ctx.telemetry,
      dist = ctx.dist,
      copy = ctx.copy,
      alive = ctx.alive,
      average = ctx.average,
      cfg = ctx.cfg,
      leaderAlive = ctx.leaderAlive,
      leaderlessActive = ctx.leaderlessActive,
      missionVersion = ctx.missionVersion,
      setPhase = ctx.setPhase,
      closePlan = ctx.closePlan,
      reconCandidate = ctx.reconCandidate,
      startRecon = ctx.startRecon,
      endRecon = ctx.endRecon,
      URBAN_ARRIVAL_COHESION = ctx.URBAN_ARRIVAL_COHESION;
  function inTown(town, p) {
    return !!(town && town.center && p && dist(p, town.center) < (+town.radius || 250));
  }
  function missionLegs(m) {
    var legs = (m.route || []).map(copy);
    if (m.point) legs.push(copy(m.point));
    return legs;
  }
  function assaultCommitted(sim, sq) {
    var a = sim.factions[sq.faction].squads;
    for (var i = 0; i < a.length; i++)
      if (a[i] !== sq && ((+a[i].routeIndex || 0) >= 2 || a[i].state === 'engaged')) return true;
    return false;
  }
  function objectivePhase(sim, sq, m, c, pos) {
    var obj = root.BattleObjectiveSystem && root.BattleObjectiveSystem.get(sim, m.objectiveId),
      radius = +(obj && obj.def && obj.def.radius) || 30,
      inside = dist(pos, m.point) <= radius * (+c.captureCommitRatio || 0.82);
    if (m.intent === 'defend') return m.requestKey || inside ? 'defend' : 'assault';
    return inside ? 'capture' : 'assault';
  }
  /* Squad Leader execution of the General's brief: the only runtime writer of phase, legs and the squad
   objective point. Without a brief (Macro OFF) the Squad Leader walks the assigned approach route. */
  function executeMission(sim, sq, town) {
    if (!sim || !sq) return;
    /* Which lease, if any, is holding this squad's mission execution this tick (diagnostics). */
    sq._missionHold = null;
    if (sq.state === 'retreat' || !alive(sq).length) return;
    if (leaderlessActive(sq)) {
      sq._missionHold = 'succession';
      return;
    }
    if (L.get(sq, 'regroup')) {
      sq._missionHold = 'regroup';
      return;
    }
    var m = sq._macroMission || null,
      ex = sq._missionExecution,
      t = sim.time,
      c = cfg(sim, sq),
      pos = average(sq);
    if (!ex || ex.mission !== m) {
      ex = sq._missionExecution = { mission: m, acceptedAt: t, holdPoint: copy(pos) };
      if (m) {
        sq.route = missionLegs(m);
        sq.routeIndex = 0;
        L.end(sq, 'corner-hold', t, 'new mission');
      }
      if (m && m.status === 'issued') {
        if (!root.BattleCommanderAI || !root.BattleCommanderAI.acceptMission)
          throw new Error('Squad Leader cannot accept a brief without its Macro lifecycle owner');
        root.BattleCommanderAI.acceptMission(sim, sq, false);
      }
    }
    /* A firefight under this brief is a commitment: contact never advances legs or rewrites phase. */
    var plan = sq._engagementPlan;
    if (plan && (plan.status === 'active' || plan.status === 'quiet')) {
      if (plan.missionVersion === missionVersion(sq)) {
        sq._missionHold = 'tactical-plan';
        return;
      }
      closePlan(sim, sq, 'mission superseded');
    }
    var legs = sq.route || [];
    if (!legs.length) return;
    var last = legs.length - 1,
      idx = Math.max(0, Math.min(last, +sq.routeIndex || 0)),
      wp = legs[idx];
    /* A live recon task is itself the mission hold. It never advances a route leg or silently changes
       command phase while the scouts are out. A superseding macro brief invalidates it immediately.
       But if the squad has arrived at the objective (inside capture radius), end the recon —
       the scouts' job is done and the squad should transition to capture/defend. */
    if (L.get(sq, 'recon')) {
      if (!sq._reconTask || sq._reconTask.missionVersion !== missionVersion(sq))
        endRecon(sq, sim, 'mission-change');
      if (L.get(sq, 'recon') && idx === last) {
        var liveReconObj = m && m.objectiveId && root.BattleObjectiveSystem ? root.BattleObjectiveSystem.get(sim, m.objectiveId) : null,
          liveReconRadius = +(liveReconObj && liveReconObj.def && liveReconObj.def.radius) || 30;
        if (dist(pos, wp) < (+c.captureCommitRatio || 0.82) * liveReconRadius)
          endRecon(sq, sim, 'arrived at objective');
      }
      if (L.get(sq, 'recon')) {
        sq._missionHold = 'recon';
        sq.objective = copy(wp);
        return;
      }
    }
    if ((m && m.intent === 'reserve') || (!m && sq.commandRole === 'reserve')) {
      setPhase(sim, sq, 'reserve', 'holding reserve');
      sq.objective = copy(legs[last]);
      return;
    }
    if (m && m.intent === 'hold') {
      setPhase(sim, sq, 'hold', 'mission hold');
      sq.objective = copy(legs[last]);
      return;
    }
    if (
      sq.commandRole === 'support' &&
      idx >= 1 &&
      t < (+c.supportDelay || 0) &&
      !assaultCommitted(sim, sq)
    ) {
      setPhase(sim, sq, 'support-hold', 'waiting for assault');
      sq.objective = copy(legs[Math.min(1, last)]);
      return;
    }
    if (L.holds(sq, 'corner-hold', t)) {
      sq._missionHold = 'corner-hold';
      sq.objective = copy(wp);
      return;
    }
    var recon = reconCandidate(sq, sim, wp);
    /* Don't start a recon task when the squad is already at the objective (idx === last and
       inside the capture radius). The recon candidate looks at distance from the goal, but
       when the squad is ON the goal, recon should not fire — the squad should transition
       to capture/defend, not send scouts. This was masked when reconCandidate required
       callouts (C gate); removing that gate exposed it. */
    if (recon && idx === last) {
      var reconObj = m && m.objectiveId && root.BattleObjectiveSystem ? root.BattleObjectiveSystem.get(sim, m.objectiveId) : null,
        reconRadius = +(reconObj && reconObj.def && reconObj.def.radius) || 30;
      if (dist(pos, wp) < (+c.captureCommitRatio || 0.82) * reconRadius) recon = null;
    }
    if (recon && startRecon(sq, sim, recon)) {
      sq._missionHold = 'recon';
      sq.objective = copy(wp);
      return;
    }
    var axisEnd = m ? (m.route || []).length - 1 : last,
      limit = +(leaderAlive(sq) ? c.cohesionRadius : c.captainlessCohesion) || 34,
      urban = inTown(town, wp);
    var arrival =
      idx === axisEnd
        ? Math.max(+c.finalRouteRadius || 14, 32)
        : urban
          ? Math.max(+c.routeArrivalRadius || 8, limit * URBAN_ARRIVAL_COHESION)
          : +c.routeArrivalRadius || 8;
    if (idx < last && dist(pos, wp) < arrival) {
      var from = idx;
      sq.routeIndex = idx = idx + 1;
      wp = legs[idx];
      telemetry(sim, 'decision-route', {
        faction: sq.faction,
        squad: sq.id,
        from: from,
        to: idx,
        x: wp.x,
        z: wp.z
      });
      if (urban) {
        L.grant(
          sq,
          'corner-hold',
          'squad-leader',
          t,
          t + (+c.cornerHold || 0) + (leaderAlive(sq) ? 0 : +c.cornerNoCaptainExtra || 0),
          'urban corner after route leg ' + from,
          'expiry, new mission or regroup release'
        );
        setPhase(sim, sq, 'corner-check', 'route ' + from);
        sq.objective = copy(wp);
        return;
      }
    }
    if (m && m.objectiveId && idx === last) {
      if (m.action === 'hold' || m.action === 'regroup') {
        setPhase(sim, sq, 'hold', 'doctrine ' + m.action);
        sq.objective = copy(ex.holdPoint || pos);
        return;
      }
      if (m.action === 'support') {
        setPhase(sim, sq, 'support-hold', 'doctrine support');
        sq.objective = copy(ex.holdPoint || pos);
        return;
      }
      setPhase(sim, sq, objectivePhase(sim, sq, m, c, pos), 'mission ' + m.objectiveId);
      sq.objective = copy(wp);
      return;
    }
    /* No separate distance-based contact phase: a firefight is Engagement's inContact, which the
       plan lease and fire-and-movement already follow (2026-09-24 Macro-off benchmark: removing
       it left 29 of 30 battles identical). */
    if (m && m.action === 'flank' && idx === axisEnd) setPhase(sim, sq, 'flank', 'doctrine flank');
    else if (inTown(town, pos)) setPhase(sim, sq, 'clear-town', 'inside objective area');
    else setPhase(sim, sq, 'approach', 'route advance');
    sq.objective = copy(wp);
  }


    return {
      inTown: inTown,
      missionLegs: missionLegs,
      assaultCommitted: assaultCommitted,
      objectivePhase: objectivePhase,
      executeMission: executeMission
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
