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
      RECON_LEDGER_ON = ctx.RECON_LEDGER_ON !== false,
      ROUTE_TRANSITION_ON = ctx.ROUTE_TRANSITION_ON !== false,
      URBAN_ARRIVAL_COHESION = ctx.URBAN_ARRIVAL_COHESION;
    function entryGate(sim, sq, target) {
      var local = ctx.localPlan && ctx.localPlan();
      return !!(local && local.entryRequired && local.entryRequired(sim, sq, target));
    }
    function entryAccepted(sim, sq, target) {
      var local = ctx.localPlan && ctx.localPlan();
      return !!(local && local.entrySatisfied && local.entrySatisfied(sim, sq, target));
    }
    function contactResumeOn() {
      var local = ctx.localPlan && ctx.localPlan();
      return !!(local && local.contactResumeOn);
    }
    /* ?transportHandoff=0 restores the old route index after a truck dismount. */
    function transportHandoffOn() {
      return !/(?:^|[?&])transportHandoff=0(?:&|$)/.test((root.location && root.location.search) || '');
    }
    /* The carrier moved the squad past road legs while infantry command was suspended.
       Resume this brief at the reached road segment after either arrival or an interrupted
       ride. Distance to the final objective cannot tell which corners were passed on a
       winding road; project onto the ordered route and keep its next corner. */
    function adoptTransportArrival(sim, sq, m, ex, legs) {
      var tr = sq._transport;
      if (!transportHandoffOn() || !m || !tr || ex.transportHandoff) return;
      if (
        (tr.phase !== 'dismounted' && tr.phase !== 'aborted') ||
        tr.missionVersion !== m.version ||
        !(tr.travelled > 0 || (tr.access && tr.boardedCount > 0))
      )
        return;
      var pos = average(sq),
        last = legs.length - 1,
        from = Math.max(0, +sq.routeIndex || 0),
        idx = from,
        origin =
          (m.observations && m.observations.squad && m.observations.squad.position) ||
          tr.initialPosition ||
          sq.baseHome ||
          sq.home,
        nearest = Infinity;
      if (!pos || !legs.length || !origin) return;
      for (var i = from; i <= last; i++) {
        var a = i ? legs[i - 1] : origin,
          b = legs[i],
          dx = b.x - a.x,
          dz = b.z - a.z,
          length2 = dx * dx + dz * dz;
        if (!(length2 > 0)) continue;
        var u = Math.max(0, Math.min(1, ((pos.x - a.x) * dx + (pos.z - a.z) * dz) / length2)),
          off = Math.hypot(pos.x - a.x - u * dx, pos.z - a.z - u * dz);
        if (off < nearest - 0.01) {
          nearest = off;
          idx = i;
        }
      }
      ex.transportHandoff = true;
      if (ctx.resumeTransportFormation) ctx.resumeTransportFormation(sq, pos);
      // A carrier routed on another corridor does not prove these legs passed.
      if (nearest > (+cfg(sim, sq).cohesionRadius || 34)) return;
      if (idx === from) return;
      sq.routeIndex = idx;
      telemetry(sim, 'decision-route-transport-handoff', {
        faction: sq.faction,
        squad: sq.id,
        missionVersion: m.version,
        from: from,
        to: idx,
        endReason: tr.endReason,
        vehicleId: tr.vehicleId || null
      });
    }
    function inTown(town, p) {
      /* The strategic scenario's 2.4 km radius bounds the entire open-country
         region, not an urban settlement. Urban corner pauses, clearance phase,
         and loose corner-arrival thresholds must not apply to road marches. */
      if (town && town.profile === 'strategic') return false;
      return !!(town && town.center && p && dist(p, town.center) < (+town.radius || 250));
    }
    function missionLegs(m) {
      var legs = (m.route || []).map(copy);
      if (m.point) legs.push(copy(m.point));
      return legs;
    }
    function routeArrival(idx, axisEnd, town, wp, c, limit) {
      return idx === axisEnd
        ? Math.max(+c.finalRouteRadius || 14, 32)
        : inTown(town, wp)
          ? Math.max(+c.routeArrivalRadius || 8, limit * URBAN_ARRIVAL_COHESION)
          : +c.routeArrivalRadius || 8;
    }
    function observeRouteTransition(sim, sq) {
      if (!ROUTE_TRANSITION_ON) return;
      var l = L.get(sq, 'route-transition');
      if (!l) return;
      var d = l.data,
        t = +sim.time || 0,
        m = sq._macroMission,
        pos = average(sq),
        request = sq._macroMissionRequest,
        why = null;
      if (
        missionVersion(sq) !== d.missionVersion ||
        (sq._missionExecution && sq._missionExecution.mission !== m)
      )
        why = m && m.reason === 'execution-blocked' ? 'blocked' : 'superseded';
      else if (sq.state === 'retreat') why = 'retreat';
      else if (!alive(sq).length) why = 'destroyed';
      else if (sq.inContact) why = 'contact';
      else if (
        request &&
        request.missionVersion === d.missionVersion &&
        request.reason === 'execution-blocked'
      )
        why = 'blocked';
      else if (+sq.routeIndex !== d.leg) why = +sq.routeIndex > d.leg ? 'arrived' : 'superseded';
      else if (d.leg === (sq.route || []).length - 1 && m && m.objectiveId) {
        if (sq.commandPhase === 'capture') why = 'capture-committed';
        else if (sq.commandPhase === 'defend') why = 'defense-committed';
        else if (sq.commandPhase === 'hold' || sq.commandPhase === 'support-hold') why = 'doctrine-hold';
      }
      var expired = t >= l.until;
      if (pos) {
        d.traveled += dist(pos, d.lastPosition);
        d.lastPosition = copy(pos);
        d.distance = dist(pos, d.target);
        if (!expired && d.distance < d.bestDistance) {
          d.bestDistance = d.distance;
          d.lastProgressAt = t;
          l.until = t + d.noProgressBudget;
        }
        if (
          !why &&
          d.distance < d.arrivalRadius &&
          (!entryGate(sim, sq, d.target) || entryAccepted(sim, sq, d.target))
        )
          why = 'arrived';
      }
      if (!why && expired) why = 'stalled';
      d.pausedBy = sq._missionHold || null;
      if (why) {
        /* A firefight correctly ends the old route lease. For a gated
           Navigation building leg, retain *only* the mission/leg/map identity
           so this same owner can issue a fresh lease after Engagement goes
           quiet. Never retain entry, survey or watch proof across combat. */
        if (
          why === 'contact' &&
          contactResumeOn() &&
          sq._missionExecution &&
          sq._missionExecution.mission === m &&
          +sq.routeIndex === d.leg &&
          entryGate(sim, sq, d.target)
        ) {
          sq._missionExecution.contactRouteResume = {
            missionVersion: d.missionVersion,
            leg: d.leg,
            target: copy(d.target),
            navigationVersion: root.BattleNavigation.version,
            interruptedAt: t
          };
        }
        var ended = L.end(sq, 'route-transition', t, why);
        telemetry(sim, 'decision-route-transition-end', {
          faction: sq.faction,
          squad: sq.id,
          missionVersion: d.missionVersion,
          leg: d.leg,
          reason: why,
          elapsed: t - ended.since,
          distanceMoved: d.traveled,
          distanceRemaining: d.distance
        });
      }
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
    /* Controller policy supplies a selected phase/point; only this owner publishes mission state.
       Acceptance and transport adoption still run before controller dispatch in executeMission. */
    function publishControllerMission(sim, sq, version, p) {
      var TC = root.BattleTacticalController;
      if (
        !sq ||
        !TC ||
        !TC.controls(sim, sq) ||
        missionVersion(sq) !== version ||
        sq.state === 'retreat' ||
        L.get(sq, 'regroup') ||
        leaderlessActive(sq) ||
        !p ||
        !Number.isInteger(p.leg) ||
        p.leg < 0 ||
        p.leg >= (sq.route || []).length ||
        !p.point ||
        !isFinite(p.point.x) ||
        !isFinite(p.point.z)
      )
        return false;
      setPhase(
        sim,
        sq,
        p.phase,
        'controller mission ' + ((sq._macroMission && sq._macroMission.intent) || 'route')
      );
      sq.routeIndex = p.leg;
      sq.objective = copy(p.point);
      return true;
    }
    /* For a defending squad at its objective, figure out which direction to scout.
     Looks toward the map center (where the enemy spawn is) or toward any known
     enemy contacts. Returns a normalized {x, z} direction vector, or null if
     no direction can be determined. */
    function defendScoutDirection(sim, sq, pos) {
      /* First choice: toward the last known enemy contact, if any. */
      var A = root.SquadAI,
        c = A && A.squadContact ? A.squadContact(sq, sim) : null;
      if (c && isFinite(+c.x) && isFinite(+c.z)) {
        var dx = c.x - pos.x,
          dz = c.z - pos.z,
          d = Math.hypot(dx, dz);
        if (d > 1) return { x: dx / d, z: dz / d };
      }
      /* Fallback: toward the map center (enemy spawn direction). */
      var town =
          sim &&
          sim.scene &&
          sim.scene.metadata &&
          (sim.scene.metadata.battleScenario || sim.scene.metadata.battleTown),
        center = town && town.center ? town.center : { x: 0, z: 0 };
      dx = center.x - pos.x;
      dz = center.z - pos.z;
      d = Math.hypot(dx, dz);
      if (d > 1) return { x: dx / d, z: dz / d };
      return null;
    }
    /* Squad Leader execution of the General's brief: the only runtime writer of phase, legs and the squad
   objective point. Without a brief (Macro OFF) the Squad Leader walks the assigned approach route. */
    function executeMission(sim, sq, town) {
      if (!sim || !sq) return;
      observeRouteTransition(sim, sq);
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
      /* Macro acceptance above and transport-arrival adoption stay here; route progression, phase,
         recon and hold decisions belong to a replacement controller when one owns the squad. */
      var TC = root.BattleTacticalController;
      if (TC && TC.controls(sim, sq)) {
        adoptTransportArrival(sim, sq, m, ex, sq.route || []);
        /* Not a mission hold: the replacement executes the brief. Loop Watch keeps judging its progress,
           and the controller counts these dispatches in its summary. */
        TC.dispatch(sim, sq, 'executeMission');
        return;
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
      adoptTransportArrival(sim, sq, m, ex, legs);
      var postures = root.BattleSquadStability && root.BattleSquadStability.tacticalPostures,
        posture = postures && postures.current(sim, sq);
      if (posture && posture.mode === 'ambush') {
        sq._missionHold = 'masked-ambush';
        return;
      }
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
        if (L.get(sq, 'recon') && idx === last && !(sq._reconTask && sq._reconTask.defenderOrigin)) {
          var liveReconObj =
              m && m.objectiveId && root.BattleObjectiveSystem
                ? root.BattleObjectiveSystem.get(sim, m.objectiveId)
                : null,
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
      if (m && m.intent === 'screen' && idx === last) {
        /* The second truck's Squad Leader establishes an observation screen
           beyond the publicly secured objective. No invented enemy contact,
           firing order or passive teleport: ordinary infantry movement owns
           the last physical metres after dismount. */
        if (dist(pos, wp) <= 38) {
          if (!ex.screenOnPostAt) {
            ex.screenOnPostAt = t;
            if (root.BattleTelemetry && root.BattleTelemetry.record)
              root.BattleTelemetry.record(
                'strategic-forward-screen-on-post',
                {
                  faction: sq.faction,
                  squad: sq.id,
                  missionVersion: m.version,
                  securedObjectiveId: m.screen && m.screen.securedObjectiveId,
                  roadId: m.screen && m.screen.roadId,
                  at: +t.toFixed(2),
                  position: copy(pos)
                },
                sim
              );
          }
          setPhase(sim, sq, 'hold', 'forward observation established');
        } else setPhase(sim, sq, 'approach', 'moving past secured objective');
        sq.objective = copy(wp);
        return;
      }
      if (m && m.intent === 'intercept' && idx === last) {
        // Reach the ACTUAL corridor with the usual movement/Engagement owners.
        // The General cannot grant sighting, suppression, or first shots.
        var onPost = dist(pos, wp) <= 38;
        if (onPost) {
          if (!ex.interceptOnPostAt) {
            ex.interceptOnPostAt = t;
            if (root.BattleTelemetry && root.BattleTelemetry.record)
              root.BattleTelemetry.record(
                'strategic-interception-on-post',
                {
                  faction: sq.faction,
                  squad: sq.id,
                  missionVersion: m.version,
                  vehicleId: m.intercept && m.intercept.vehicleId,
                  at: +t.toFixed(2),
                  position: copy(pos),
                  roadId: m.intercept && m.intercept.roadId
                },
                sim
              );
          }
          setPhase(sim, sq, 'hold', 'intercept corridor reached');
        } else setPhase(sim, sq, 'approach', 'intercept corridor approach');
        sq.objective = copy(wp);
        return;
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
      var recon = m && m.intent === 'screen' ? null : reconCandidate(sq, sim, wp);
      /* Don't start a recon task when the squad is already at the objective (idx === last and
       inside the capture radius). The recon candidate looks at distance from the goal, but
       when the squad is ON the goal, recon should not fire — the squad should transition
       to capture/defend, not send scouts. This was masked when reconCandidate required
       callouts (C gate); removing that gate exposed it. */
      if (recon && idx === last) {
        var reconObj =
            m && m.objectiveId && root.BattleObjectiveSystem
              ? root.BattleObjectiveSystem.get(sim, m.objectiveId)
              : null,
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
      /* Contact may end the original structure route lease while the General's
         brief and route index remain unchanged. Reissue through THIS Mission
         Execution owner only after the existing Engagement plan is closed.
         This grants no automatic doorway/clearance credit: local evidence must
         be gathered again on the new lease and can legitimately fail closed. */
      var pending = ex && ex.contactRouteResume;
      if (pending && contactResumeOn()) {
        var N = root.BattleNavigation,
          stale =
            !m ||
            m.status !== 'executing' ||
            pending.missionVersion !== missionVersion(sq) ||
            pending.leg !== idx ||
            !pending.target ||
            pending.target.x !== wp.x ||
            pending.target.z !== wp.z ||
            !N ||
            pending.navigationVersion !== N.version ||
            !isFinite(pending.interruptedAt) ||
            t < pending.interruptedAt ||
            !entryGate(sim, sq, wp);
        if (stale || L.get(sq, 'route-transition')) ex.contactRouteResume = null;
        else if (!sq.inContact && !L.get(sq, 'regroup') && !L.get(sq, 'recon')) {
          var budget = (root.BattleCommanderAI && +root.BattleCommanderAI.strategicStallReplan) || Infinity,
            remaining = dist(pos, wp);
          L.grant(
            sq,
            'route-transition',
            'squad-leader',
            t,
            t + budget,
            'resuming structure leg ' + idx + ' after contact',
            'arrival, contact, blocked, superseded, retreat or no progress',
            {
              from: idx - 1,
              leg: idx,
              missionVersion: missionVersion(sq),
              target: copy(wp),
              arrivalRadius: routeArrival(idx, axisEnd, town, wp, c, limit),
              startDistance: remaining,
              distance: remaining,
              bestDistance: remaining,
              traveled: 0,
              lastPosition: copy(pos),
              lastProgressAt: t,
              noProgressBudget: budget
            }
          );
          telemetry(sim, 'decision-route-transition-resume', {
            faction: sq.faction,
            squad: sq.id,
            missionVersion: missionVersion(sq),
            leg: idx,
            interruptedAt: pending.interruptedAt
          });
          ex.contactRouteResume = null;
        }
      }
      var arrival = routeArrival(idx, axisEnd, town, wp, c, limit);
      if (idx < last && dist(pos, wp) < arrival && (!entryGate(sim, sq, wp) || entryAccepted(sim, sq, wp))) {
        var local = ctx.localPlan && ctx.localPlan();
        if (local && local.noteStructureHandback) local.noteStructureHandback(sim, sq, wp);
        var from = idx;
        sq.routeIndex = idx = idx + 1;
        wp = legs[idx];
        if (ROUTE_TRANSITION_ON) {
          var budget = (root.BattleCommanderAI && +root.BattleCommanderAI.strategicStallReplan) || Infinity,
            remaining = dist(pos, wp);
          L.grant(
            sq,
            'route-transition',
            'squad-leader',
            t,
            t + budget,
            'leg ' + from + ' -> ' + idx,
            'arrival, contact, blocked, superseded, retreat or no progress',
            {
              from: from,
              leg: idx,
              missionVersion: missionVersion(sq),
              target: copy(wp),
              arrivalRadius: routeArrival(idx, axisEnd, town, wp, c, limit),
              startDistance: remaining,
              distance: remaining,
              bestDistance: remaining,
              traveled: 0,
              lastPosition: copy(pos),
              lastProgressAt: t,
              noProgressBudget: budget
            }
          );
        }
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
        /* Defending squads at their objective: try scouting toward the enemy before
         settling into defend phase. The recon system looks for crests and visual
         screens between the squad and its goal — for a defender, the "goal" is
         the objective they're already on, so we point recon toward the enemy's
         likely approach direction instead. This is what breaks the two-defenders-
         on-opposite-sides-of-a-hill stalemate: scouts go over the crest and
         acquire the enemy, triggering contact. */
        if (m.intent === 'defend' && !sq.inContact && !L.get(sq, 'recon')) {
          /* #393: anchor the scouting decision on the owned objective waypoint, not the whole-squad
             centroid — scouts walking out move the centroid and must not manufacture a new strategic
             task. The control arm (?reconLedger=0) restores the centroid-derived base. */
          var reconBase = RECON_LEDGER_ON ? wp : pos,
            enemyDir = defendScoutDirection(sim, sq, reconBase);
          if (enemyDir) {
            /* Match the 110 m objective-approach gate so defender recon can use the full
             80 m crest look-ahead while scouts physically advance up to 50 m. */
            var scoutGoal = {
                x: reconBase.x + enemyDir.x * 110,
                z: reconBase.z + enemyDir.z * 110
              },
              defendRecon = reconCandidate(sq, sim, scoutGoal, reconBase);
            if (defendRecon) defendRecon.defenderOrigin = true;
            if (defendRecon && startRecon(sq, sim, defendRecon)) {
              sq._missionHold = 'recon';
              sq.objective = copy(wp);
              return;
            }
          }
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
      controllerMission: { publish: publishControllerMission, objectivePhase: objectivePhase },
      executeMission: executeMission,
      observeRouteTransition: observeRouteTransition
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
