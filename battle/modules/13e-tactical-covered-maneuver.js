/* One directional covered-bound skill for the exclusive controller. It chooses a team and
   detached cover points; Meso leases the window, Engagement reserves and executes, Command
   Reception adopts, and the resolver alone moves. No fire permission or world-state writer. */
(function (root) {
  'use strict';
  /* ?noHopStall=0 restores the old rule: a refusal stands until the squad's basis changes, unreported, forever. */
  var STALL_ON = !/[?&]noHopStall=0(?:&|#|$)/i.test(
      typeof location !== 'undefined' ? location.search || '' : ''
    ),
    states = new WeakMap(),
    teams = ['alpha', 'bravo', 'charlie'],
    MAX_PARALLEL_MOVERS = 3;
  function men(sq) {
    return (sq.members || []).filter(function (s) {
      return s && !s.dead && !s.isPlayer;
    });
  }
  function key(ctx) {
    var t = ctx.token;
    return [t.battleId, t.generation, t.controllerEpoch, t.missionVersion, t.rosterRevision].join(':');
  }
  function state(ctx) {
    var st = states.get(ctx.squad),
      k = key(ctx);
    if (!st || st.key !== k) {
      st = {
        key: k,
        turn: 0,
        actions: new Map(),
        routes: new Map(),
        defensePosts: new Map(),
        checkins: 0,
        arrived: new Set(),
        interrupted: new Set(),
        window: null,
        phase: 'idle',
        history: [],
        completed: 0,
        failed: 0,
        windowsStarted: 0,
        windowsCompleted: 0,
        windowsPartiallyCompleted: 0,
        windowsAborted: 0,
        personalOrdersAccepted: 0,
        personalOrdersRejected: 0,
        personalOrdersInterrupted: 0,
        plannedNeverSubmitted: 0,
        supportRelocationsStarted: 0,
        supportRelocationsCheckedIn: 0,
        rejectedReplacementIds: new Set(),
        byDirection: {
          forward: { started: 0, completed: 0, aborted: 0 },
          back: { started: 0, completed: 0, aborted: 0 }
        }
      };
      states.set(ctx.squad, st);
    }
    return st;
  }
  function note(ctx, st, phase, reason) {
    st.phase = phase;
    st.reason = reason;
    st.history.push({
      at: ctx.sim.time,
      phase: phase,
      reason: reason,
      direction: st.direction,
      team: st.team,
      movers: (st.plan || []).map(function (p) {
        return { id: String(p.man.id), point: p.point };
      }),
      supporters: st.supporters || [],
      token: st.key,
      actions: Array.from(st.actions.values())
    });
    if (st.history.length > 16) st.history.shift();
  }
  /* A per-soldier owner-arrival receipt; never a synthetic whole-team arrival. */
  function checkpoint(ctx, st, p) {
    var id = String(p.man.id);
    if (st.arrived.has(id)) return;
    st.arrived.add(id);
    st.completed++;
    st.checkins++;
    if (st.supportRelocation) st.supportRelocationsCheckedIn++;
    st.lastMoverId = id;
    var route = st.routes.get(id);
    if (route) {
      var waypoint = route.waypoints[route.cursor];
      if (waypoint && Math.hypot(p.man.root.position.x - waypoint.x, p.man.root.position.z - waypoint.z) < 2)
        route.cursor++;
      else st.routes.delete(id);
    }
    /* A provisional covered hop toward the point is NOT a finished
       defensive deployment. Only a checked-in position inside the guarded
       perimeter may suppress new moves in the same threat sector. */
    if (st.defending && st.defenseSector != null && st.defenseCenter) {
      var distanceToPoint = Math.hypot(
        p.man.root.position.x - st.defenseCenter.x,
        p.man.root.position.z - st.defenseCenter.z
      );
      if (distanceToPoint <= st.defenseLimit && (!route || route.cursor >= route.waypoints.length))
        st.defensePosts.set(id, {
          x: p.man.root.position.x,
          z: p.man.root.position.z,
          sector: st.defenseSector
        });
      else st.defensePosts.delete(id);
    }
    var actionId = st.actions.get(id);
    if (actionId) ctx.finish(actionId, 'confirmed-physical-arrival:' + id);
    st.actions.delete(id);
    root.BattleSquadStability.controllerBound.resolveMover(ctx.squad, ctx.sim, p.man);
    note(ctx, st, 'checkin', 'squad-leader-confirmed-physical-arrival:' + id);
    st.phase = 'moving';
  }
  function interruptMan(ctx, st, p, reason) {
    var id = String(p.man.id);
    if (st.arrived.has(id) || st.interrupted.has(id)) return;
    st.interrupted.add(id);
    var actionId = st.actions.get(id);
    if (actionId) {
      st.personalOrdersInterrupted++;
      ctx.finish(actionId, reason);
    }
    st.actions.delete(id);
    root.BattleSquadStability.controllerBound.resolveMover(ctx.squad, ctx.sim, p.man);
    st.routes.delete(id);
    st.failed++;
    note(ctx, st, 'interrupted', reason + ':' + id);
    st.phase = 'moving';
  }
  function end(ctx, st, reason, success) {
    var ordered = new Set(st.actions.keys());
    if (st.window) {
      if (success && st.interrupted.size === 0) st.windowsCompleted++;
      else if (success) st.windowsPartiallyCompleted++;
      else st.windowsAborted++;
    }
    st.personalOrdersInterrupted += st.actions.size;
    st.actions.forEach(function (id) {
      ctx.finish(id, reason);
    });
    st.actions.clear();
    if (st.window) ctx.finish(st.window, reason);
    st.window = null;
    if (st.direction) st.byDirection[st.direction][success ? 'completed' : 'aborted']++;
    if (success) {
      st.lastTeam = st.team;
      st.turn = (st.turn + 1) % teams.length;
    } else {
      (st.plan || []).forEach(function (p) {
        var id = String(p.man.id);
        if (!st.arrived.has(id) && !st.interrupted.has(id)) {
          st.failed++;
          if (!ordered.has(id)) st.plannedNeverSubmitted++;
          st.routes.delete(id);
        }
      });
    }
    note(ctx, st, success ? 'completed' : 'aborted', reason);
    st.arrived.clear();
    st.interrupted.clear();
    st.rejectedReplacementIds.clear();
    st.supportRelocation = false;
  }
  function viable(s, sim) {
    var E = root.BattleEngagement,
      A = root.BattleAmmunition,
      P = root.BattleTacticalPositions;
    return (
      !s.incapacitated &&
      s.hp > 0 &&
      s.weapon &&
      !s.reloading &&
      !s.clearingStoppage &&
      !s.outOfAmmo &&
      !(s.suppressedUntil > sim.time) &&
      !E.reacting(s) &&
      !(s.eng && s.eng.urgentBound) &&
      !(P && P.current(s)) &&
      !(A && !A.available(s)) &&
      !s._survivalMovementKey &&
      !(root.BattleGrenades && root.BattleGrenades.pendingOf(s, sim))
    );
  }
  /* The flank and assault skill (13i) reuses this skill with a lateral axis: while it runs, it names the goal
     to hop toward and the one fireteam that moves; the rest of the squad is the base of fire. */
  function flank(sq) {
    var X = root.BattleTacticalFlankAssault;
    return X && X.on ? X.goal(sq) : null;
  }
  function flankBasis(sq) {
    var X = root.BattleTacticalFlankAssault;
    return X && X.on ? X.basis(sq) : null;
  }
  function reports(ctx) {
    var leader = root.SquadAI.leaderOf(ctx.squad);
    return leader ? root.BattleCoverPositions.boundThreats(leader, ctx.sim) : [];
  }
  function basis(ctx, rs) {
    return JSON.stringify([
      ctx.squad.state === 'retreat' || ctx.squad.commandPhase === 'retreat',
      ctx.squad.commandPhase,
      !!ctx.squad.inContact,
      root.BattleNavigation && root.BattleNavigation.version,
      flankBasis(ctx.squad),
      rs.map(function (r) {
        return [Math.round(r.x), Math.round(r.z)];
      }),
      men(ctx.squad).map(function (s) {
        /* A newly discharged covering weapon can unlock a previously refused
           support relocation even when every position and contact stays fixed.
           This is evidence-versioning, not an arbitrary release timer. */
        var A = root.BattleAmmunition,
          shot = A && A.shotEvidence && A.shotEvidence(s, ctx.sim);
        return [
          s.id,
          Math.round(s.root.position.x),
          Math.round(s.root.position.z),
          viable(s, ctx.sim),
          shot && Number.isFinite(+shot.at) ? +shot.at : null
        ];
      })
    ]);
  }
  /* Choose a capable individual, not an indivisible fireteam. The separate
     contact-route skill ranks real physical cover waypoints by exposure, cover
     quality and progress. Meso will independently validate the chosen actor. */
  function defenseBrief(ctx, rs) {
    var m = ctx.squad._macroMission,
      p = m && m.point,
      report = rs && rs[0];
    if (
      !m ||
      m.action !== 'defend' ||
      m.status !== 'executing' ||
      !p ||
      !Number.isFinite(p.x) ||
      !Number.isFinite(p.z) ||
      !report
    )
      return null;
    var obj =
      root.BattleObjectiveSystem &&
      root.BattleObjectiveSystem.get &&
      root.BattleObjectiveSystem.get(ctx.sim, m.objectiveId);
    return {
      center: { x: p.x, z: p.z },
      radius: +(obj && obj.def && obj.def.radius) || 30,
      sector: Math.round(Math.atan2(report.z - p.z, report.x - p.x) / (Math.PI / 4))
    };
  }
  /* Command and the MG are NOT normal fireteam movers. Once two advanced
     riflemen have actually discharged, reposition ONE rear support element
     through the same Meso lease and exact real-cover route, then restore it
     to the support pool on physical check-in. No forward fire = no relocation. */
  function supportRelocation(ctx, st, ready, goal, audit) {
    var A = root.SquadAI,
      E = root.BattleEngagement,
      C = root.BattleCoverPositions,
      R = root.BattleTacticalContactRoute,
      leader = A.leaderOf(ctx.squad);
    var relocation = (audit.relocation = { evaluated: [], selectedId: null });
    if (!goal || !R || !R.pick) {
      relocation.reason = 'no-mission-or-route-owner';
      return null;
    }
    var options = ready.filter(function (s) {
      return s === leader || A.isMachineGun(s);
    });
    if (!options.length) relocation.reason = 'no-ready-leader-or-machinegun';
    options.sort(function (a, b) {
      return (A.isMachineGun(a) ? 0 : 1) - (A.isMachineGun(b) ? 0 : 1);
    });
    for (var i = 0; i < options.length; i++) {
      var mover = options[i],
        here = mover.root.position,
        remaining = Math.hypot(here.x - goal.x, here.z - goal.z),
        entry = { id: String(mover.id), role: mover === leader ? 'leader' : 'machinegun' },
        front = ready.filter(function (s) {
          return (
            s !== leader &&
            !A.isMachineGun(s) &&
            Math.hypot(s.root.position.x - goal.x, s.root.position.z - goal.z) <= remaining - 24 &&
            Math.hypot(s.root.position.x - here.x, s.root.position.z - here.z) >= 20 &&
            E.supportDischarged(s, ctx.sim, ctx.sim.time - 3)
          );
        });
      relocation.evaluated.push(entry);
      entry.forwardFiringRifles = front.length;
      if (front.length < 2) {
        entry.reason = 'fewer-than-two-forward-firing-rifles';
        continue;
      }
      var anchor = {
        x: (front[0].root.position.x + front[1].root.position.x) / 2,
        z: (front[0].root.position.z + front[1].root.position.z) / 2
      };
      if (Math.hypot(anchor.x - here.x, anchor.z - here.z) < 35) {
        entry.reason = 'forward-anchor-not-far-enough';
        continue;
      }
      var reports = C.boundThreats(mover, ctx.sim);
      if (!reports.length) {
        entry.reason = 'no-personal-contact';
        continue;
      }
      var retained = st.routes.get(String(mover.id)),
        route = R.pick(
          mover,
          ctx.sim,
          reports,
          anchor,
          [],
          retained && retained.mission === ctx.squad._macroMission ? retained : null
        );
      if (
        !route.point ||
        !C.candidates(mover, ctx.sim, reports[0], R.tuning.maxHop).some(function (p) {
          return Math.hypot(p.x - route.point.x, p.z - route.point.z) < 0.01;
        })
      ) {
        entry.reason = !route.point ? 'no-safe-connected-cover-route' : 'execution-cover-candidate-missing';
        continue;
      }
      entry.reason = 'selected';
      relocation.selectedId = String(mover.id);
      audit.teams.push({
        team: 'alpha',
        moverId: String(mover.id),
        eligibleMovers: 1,
        eligibleSupporters: front.length,
        candidates: route.stats.total,
        directionalCandidates: route.stats.progressing,
        admittedRoutes: route.stats.safe,
        graphNodes: route.stats.graphNodes || 0,
        routeLength: route.stats.planLength || 0,
        terminal: route.stats.terminal || 'none',
        reused: !!route.reused,
        moverFailures: [],
        routeRejections: route.stats.rejected,
        result: 'support-element-relocation'
      });
      audit.result = 'forward-rifles-cover-single-support-relocation';
      return {
        team: 'alpha',
        index: 0,
        moverIds: [String(mover.id)],
        plan: [{ man: mover, point: route.point }],
        routes: [{ moverId: String(mover.id), waypoints: route.waypoints || [], reused: !!route.reused }],
        direction: 'forward',
        defending: false,
        defenseSector: null,
        supportRelocation: true
      };
    }
    if (!relocation.selectedId && !relocation.reason)
      relocation.reason = 'no-support-role-with-safe-covered-route';
    return null;
  }
  function choose(ctx, st, rs, excluded) {
    var Q = root.BattleSquadStability,
      C = root.BattleCoverPositions,
      A = root.SquadAI,
      R = root.BattleTacticalContactRoute,
      /* An ambush-held man stays on his masked post: his skill, not this one, holds him. */
      list = men(ctx.squad).filter(function (s) {
        return !(root.BattleTacticalAmbushSkill && root.BattleTacticalAmbushSkill.wants(s));
      }),
      back = ctx.squad.state === 'retreat' || ctx.squad.commandPhase === 'retreat',
      defense = !back && defenseBrief(ctx, rs),
      lateral = !back && !defense ? flank(ctx.squad) : null,
      goal = back
        ? A.retreatGoal(ctx.squad)
        : defense
          ? defense.center
          : lateral
            ? lateral.point
            : root.BattleTacticalMarchProvider.target(ctx.squad),
      leader = A.leaderOf(ctx.squad),
      audit = {
        at: ctx.sim.time,
        phase: ctx.squad.commandPhase,
        direction: back ? 'back' : defense ? 'defensive-position' : lateral ? lateral.phase : 'forward',
        flankTeam: lateral ? lateral.team : null,
        protectedObjective: defense ? defense.center : null,
        defenseRadius: defense ? defense.radius : null,
        contactReports: rs.length,
        goal: goal ? { x: goal.x, z: goal.z } : null,
        maxBoundDistance: R && R.tuning.maxHop,
        teams: [],
        result: null
      };
    st.diagnostic = audit;
    if (!R || !R.pick || !C || !goal || !leader || !rs.length || list.length < 3) {
      audit.result = !R
        ? 'contact-route-skill-missing'
        : !goal
          ? 'no-mission-goal'
          : !leader
            ? 'no-live-leader'
            : !rs.length
              ? 'no-qualified-reported-contact'
              : 'insufficient-roster';
      return null;
    }
    var ready = list.filter(function (s) {
      return viable(s, ctx.sim) && (!excluded || !excluded.has(String(s.id)));
    });
    /* Preserve one live support weapon outside the mover set. This may be a
       single MG or rifleman with genuine independent discharge evidence. */
    if (ready.length < 2) {
      audit.result = 'no-mover-and-supporter';
      return null;
    }
    /* Only the assault approach may shift its support echelon. Ordinary
       defense and retreat keep their separate owner-defined posture. */
    if (!back && !defense && !lateral && ctx.squad._macroMission.action === 'assault') {
      var shift = supportRelocation(ctx, st, ready, goal, audit);
      if (shift) return shift;
    }
    var choices = [];
    ready.forEach(function (s) {
      var retained = st.routes.get(String(s.id));
      /* A committed hop may finish, but later checkpoints belong to the goal that planned them.
         A flank or assault can change that goal without replacing the Macro mission. */
      var pending = !!(
        retained &&
        retained.cursor < retained.waypoints.length &&
        retained.mission === ctx.squad._macroMission &&
        retained.goalBasis === JSON.stringify(flankBasis(ctx.squad))
      );
      if (A.isMachineGun(s) || (st.lastMoverId === String(s.id) && ready.length > 2 && !pending)) return;
      var team = Q.teamKeyFor(s);
      if (defense) {
        /* A man the engineers placed at a prepared defence post holds it (and still supports from it):
           the defender owner and a covered hop must not both move him. */
        if (s._preparedDefensePost) return;
        var post = st.defensePosts.get(String(s.id));
        if (
          post &&
          !pending &&
          post.sector === defense.sector &&
          Math.hypot(post.x - s.root.position.x, post.z - s.root.position.z) < 4
        )
          return;
      }
      /* The Meso covered-window owner accepts alpha/bravo/charlie, not the
         command element. Never choose a route it cannot lease. */
      if (teams.indexOf(team) < 0) return;
      /* A flank drafts only its own team: every other man stays the base of fire. */
      if (lateral && team !== lateral.team) return;
      /* The owner validates the mover's own received sector, not merely the
         Squad Leader's reports. Do not plan an order he cannot adopt. */
      var personalReports = C.boundThreats(s, ctx.sim);
      if (!personalReports.length) {
        audit.teams.push({
          team: team,
          moverId: String(s.id),
          eligibleMovers: 1,
          eligibleSupporters: ready.length - 1,
          candidates: 0,
          directionalCandidates: 0,
          admittedRoutes: 0,
          graphNodes: 0,
          routeLength: 0,
          terminal: 'none',
          reused: false,
          moverFailures: [],
          routeRejections: {},
          result: 'no-personal-reported-contact'
        });
        return;
      }
      var result = defense
          ? R.pickDefense(s, ctx.sim, personalReports, goal, defense.radius, team, pending ? retained : null)
          : R.pick(s, ctx.sim, personalReports, goal, [], pending ? retained : null),
        record = {
          team: team,
          moverId: String(s.id),
          eligibleMovers: 1,
          eligibleSupporters: ready.length - 1,
          candidates: result.stats.total,
          directionalCandidates: result.stats.progressing,
          admittedRoutes: result.stats.safe,
          graphNodes: result.stats.graphNodes || 0,
          routeLength: result.stats.planLength || 0,
          terminal: result.stats.terminal || 'none',
          reused: !!result.reused,
          moverFailures: [],
          routeRejections: result.stats.rejected,
          result: result.point ? 'selected-candidate' : 'no-hop'
        };
      audit.teams.push(record);
      if (!result.point) return;
      /* The long-horizon planner must hand over a slot Engagement currently
         recognizes for this individual. Exact range and physical checks stay. */
      if (
        !C.candidates(s, ctx.sim, personalReports[0], R.tuning.maxHop).some(function (p) {
          return Math.hypot(p.x - result.point.x, p.z - result.point.z) < 0.01;
        })
      ) {
        record.result = 'execution-owner-cover-candidate-absent';
        return;
      }
      var obs = root.BattleEngagement.fireControlObservation(s, ctx.sim),
        effectiveHere = !!(obs && obs.inRange && obs.visualLine && obs.ballisticLine);
      /* Preserve effective shooters where possible; move men without a useful
         firing line first. When all can shoot, allow the next best cover hop. */
      choices.push({
        man: s,
        team: team,
        point: result.point,
        waypoints: result.waypoints || [],
        reused: !!result.reused,
        score: result.score + (effectiveHere ? 24 : 0) - (result.reused ? 60 : 0),
        exposure: result.exposure,
        effectiveHere: effectiveHere
      });
    });
    choices.sort(function (a, b) {
      return a.score - b.score || String(a.man.id).localeCompare(String(b.man.id));
    });
    /* Do not draft the sole active rifleman into the moving party! A genuine
       shot in the preceding few seconds is proof this actor has been firing,
       and the current effective line-of-fire makes him a precious supporter. */
    var Ammo = root.BattleAmmunition,
      firing = new Set(
        ready
          .filter(function (s) {
            var shot = Ammo && Ammo.shotEvidence && Ammo.shotEvidence(s, ctx.sim);
            return !!(shot && shot.at >= ctx.sim.time - 3 && shot.at <= ctx.sim.time);
          })
          .map(function (s) {
            return String(s.id);
          })
      );
    if (!choices.length) {
      audit.result = 'no-reachable-contact-cover';
      return null;
    }
    var selected = [],
      movingShooters = 0,
      keepShooters = Math.min(2, firing.size);
    /* One Meso lease, up to three independent personal movement orders.
       Preserve two live squadmates as potential covering shooters. */
    choices.forEach(function (candidate) {
      if (selected.length >= Math.min(MAX_PARALLEL_MOVERS, ready.length - 2)) return;
      var wasFiring = firing.has(String(candidate.man.id));
      if (wasFiring && firing.size - movingShooters <= keepShooters) return;
      if (
        selected.some(function (p) {
          return Math.hypot(candidate.point.x - p.point.x, candidate.point.z - p.point.z) < 4;
        })
      )
        return;
      selected.push(candidate);
      if (wasFiring) movingShooters++;
    });
    if (!selected.length) {
      audit.result = 'no-separated-cover-hops';
      return null;
    }
    audit.result = 'parallel-individual-cover-hops-selected';
    return {
      team: selected[0].team,
      index: teams.indexOf(selected[0].team),
      moverIds: selected.map(function (s) {
        return String(s.man.id);
      }),
      plan: selected.map(function (s) {
        return { man: s.man, point: s.point };
      }),
      routes: selected.map(function (s) {
        return { moverId: String(s.man.id), waypoints: s.waypoints, reused: s.reused };
      }),
      direction: back ? 'back' : 'forward',
      defending: !!defense,
      defenseSector: defense ? defense.sector : null
    };
  }
  /* Refill freed personal-movement slots under the same Meso authorization.
     Never stop a man already bound just because another arrived. */
  function replenish(ctx, st, rs) {
    var Q = root.BattleSquadStability,
      h = Q.controllerBound.current(ctx.squad, ctx.sim),
      active = st.plan.filter(function (p) {
        var id = String(p.man.id);
        return !st.arrived.has(id) && !st.interrupted.has(id);
      });
    if (!h || !h.armed || !h.moverIds || st.supportRelocation || active.length >= MAX_PARALLEL_MOVERS) return;
    var excluded = new Set(
      active
        .map(function (p) {
          return String(p.man.id);
        })
        .concat(Array.from(st.interrupted), Array.from(st.rejectedReplacementIds))
    );
    var choice = choose(ctx, st, rs, excluded);
    if (!choice) return;
    for (var i = 0; i < choice.plan.length && active.length < MAX_PARALLEL_MOVERS; i++) {
      var p = choice.plan[i],
        id = String(p.man.id);
      if (h.holders.indexOf(p.man) < 0) continue;
      if (
        active.some(function (other) {
          return Math.hypot(other.point.x - p.point.x, other.point.z - p.point.z) < 4;
        })
      )
        continue;
      if (!Q.controllerBound.enroll(ctx.squad, ctx.sim, p.man)) continue;
      root.BattleTacticalMarchProvider.releaseMan(ctx, p.man);
      root.BattleTacticalContactSkills.release(ctx, p.man);
      var result = ctx.request('combat.bound', id, { point: p.point });
      if (!result.ok) {
        Q.controllerBound.resolveMover(ctx.squad, ctx.sim, p.man);
        st.failed++;
        st.personalOrdersRejected++;
        st.rejectedReplacementIds.add(id);
        note(ctx, st, 'interrupted', 'replacement-order-refused:' + id + ':' + result.reason);
        st.phase = 'moving';
        continue;
      }
      st.actions.set(id, result.actionId);
      st.personalOrdersAccepted++;
      st.arrived.delete(id);
      var previousIndex = st.plan.findIndex(function (old) {
        return String(old.man.id) === id;
      });
      if (previousIndex >= 0) st.plan[previousIndex] = p;
      else st.plan.push(p);
      active.push(p);
      var route = choice.routes.find(function (r) {
        return r.moverId === id;
      });
      if (route && (!route.reused || !st.routes.has(id)))
        st.routes.set(id, {
          origin: { x: p.man.root.position.x, z: p.man.root.position.z },
          waypoints: route.waypoints,
          cursor: 0,
          mission: ctx.squad._macroMission,
          goalBasis: JSON.stringify(flankBasis(ctx.squad))
        });
      st.byDirection[st.direction].started++;
      note(ctx, st, 'moving', 'replacement-native-mover:' + id);
    }
  }
  function supports(ctx, st) {
    var E = root.BattleEngagement;
    return men(ctx.squad)
      .filter(function (s) {
        return (
          !st.plan.some(function (p) {
            return p.man === s;
          }) && E.supportDischarged(s, ctx.sim, st.startedAt - 3)
        );
      })
      .map(function (s) {
        return String(s.id);
      });
  }
  function update(ctx) {
    var st = state(ctx),
      Q = root.BattleSquadStability,
      C = root.BattleCoverPositions,
      rs = reports(ctx),
      b = basis(ctx, rs),
      a = men(ctx.squad),
      defense = defenseBrief(ctx, rs),
      back = ctx.squad.state === 'retreat' || ctx.squad.commandPhase === 'retreat',
      eligible =
        ctx.squad.inContact &&
        rs.length &&
        a.length >= 3 &&
        (back
          ? !root.SquadAI.isExtractionToHome(ctx.squad)
          : !!defense ||
            Q.boundPhases().indexOf(ctx.squad.commandPhase) >= 0 ||
            (ctx.squad.commandPhase === 'approach' &&
              ctx.squad._macroMission &&
              ctx.squad._macroMission.action === 'assault') ||
            !!flank(ctx.squad));
    if (st.window) {
      var stage = ctx.stage(st.window);
      if (!eligible || !stage || stage.stage === 'cancelled') {
        end(ctx, st, 'window-ended', false);
        st.blocked = b;
        return;
      }
      /* Confirm a genuine discharge only to START the bound. During motion,
         preserve that receipt and the live covering assignment instead of
         dropping visible supporters after the three-second shot evidence age. */
      if (st.phase === 'moving') {
        st.supporters = (st.confirmedSupporters || []).filter(function (id) {
          return men(ctx.squad).some(function (s) {
            return String(s.id) === id && !s.incapacitated && s.hp > 0 && s.weapon && !s.outOfAmmo;
          });
        });
      } else st.supporters = supports(ctx, st);
      if (st.phase === 'moving') {
        /* Every person advances/checks in independently. One blocked actor
           cannot cancel the other native movement orders or their covering
           shooters. No watch clock or periodic support-shot renewal. */
        st.plan.forEach(function (p) {
          var id = String(p.man.id);
          if (st.arrived.has(id) || st.interrupted.has(id)) return;
          var actionId = st.actions.get(id),
            personal = actionId && ctx.stage(actionId);
          if (!personal || personal.stage === 'cancelled') {
            interruptMan(ctx, st, p, 'native-personal-order-ended');
            return;
          }
          if (personal.stage === 'arrived') {
            checkpoint(ctx, st, p);
            return;
          }
          /* Detour and blockage detection remain with the native movement
             owner. A straight line from an en-route soldier is not a nav test. */
          if (!viable(p.man, ctx.sim)) {
            interruptMan(ctx, st, p, 'genuine-mover-interruption');
          }
        });
        var holders = men(ctx.squad).filter(function (s) {
          return (
            !st.plan.some(function (moving) {
              return moving.man === s && !st.arrived.has(String(s.id)) && !st.interrupted.has(String(s.id));
            }) &&
            s.hp > 0 &&
            !s.dead &&
            !s.incapacitated &&
            s.weapon &&
            !s.outOfAmmo
          );
        });
        if (holders.length < 2) {
          end(ctx, st, 'cover-team-incapable', false);
          st.blocked = b;
          return;
        }
        if (st.arrived.size + st.interrupted.size === st.plan.length) {
          /* The Meso cover lease and remaining supporter roles end only after
             every personal arrival/check-in or explicit interruption. */
          end(
            ctx,
            st,
            st.interrupted.size ? 'all-personal-moves-resolved' : 'all-physical-arrivals-checked-in',
            st.arrived.size > 0
          );
          st.blocked = null;
        } else replenish(ctx, st, rs);
        return;
      }
      if (st.supporters.length < (st.supportRelocation ? 2 : 1)) {
        st.reason = 'await-independent-support-discharge';
        return;
      }
      for (var i = 0; i < st.plan.length; i++) {
        var p = st.plan[i];
        if (
          !viable(p.man, ctx.sim) ||
          !root.BattleTacticalContactRoute.evaluate(
            p.man,
            ctx.sim,
            p.point,
            C.boundThreats(p.man, ctx.sim),
            root.BattleEngagement.underFireNow(p.man, ctx.sim)
          ).eligible
        ) {
          end(ctx, st, 'route-or-mover-revoked', false);
          st.blocked = b;
          return;
        }
        root.BattleTacticalContactSkills.release(ctx, p.man);
        var result = ctx.request('combat.bound', String(p.man.id), { point: p.point });
        if (!result.ok) {
          st.personalOrdersRejected++;
          interruptMan(ctx, st, p, 'bound-refused:' + result.reason);
          continue;
        }
        st.actions.set(String(p.man.id), result.actionId);
        st.personalOrdersAccepted++;
      }
      if (!st.actions.size) {
        end(ctx, st, 'all-personal-orders-refused', false);
        st.blocked = b;
        return;
      }
      st.confirmedSupporters = st.supporters.slice();
      note(ctx, st, 'moving', 'real-independent-support-discharge');
      return;
    }
    /* No new covered bound while nobody commands the squad (succession, 15d): the reason says so. */
    if (Q.controllerSuccession && Q.controllerSuccession(ctx.sim, ctx.squad)) {
      st.reason = 'succession';
      st.blocked = null;
      st.stall = null;
      return;
    }
    if (!eligible) {
      st.reason = back ? 'ordinary-retreat' : 'no-authorized-contact';
      st.blocked = null;
      st.stall = null;
      return;
    }
    /* A squad in contact with no hop in any team is a stall, not a settled answer. It is reported on the
       summary (the session export reads it) and searched again once per Squad Leader bound cycle, since a
       standing squad changes none of the basis it was refused on. After the Squad Leader's own review time
       (tuning.lead.reviewAfter) the stall is released: the search stops, the reason says so, and the Squad
       Leader asks the General for a new task where the mission allows one. */
    var tune = Q.tuning,
      cycle = Math.floor(ctx.sim.time / tune.boundCycle);
    /* A stall is one continuous no-hop contact, whatever goal it was refused toward. A flank or assault goal
       (13i) that differs from the one last searched is searched once afresh, even after the stall was
       released, but the stall keeps its clock, so the Squad Leader's review still comes after reviewAfter.
       With 13i off the goal is always the frontal one and nothing changes. */
    var goalKey = JSON.stringify(flankBasis(ctx.squad)),
      newGoal = !!(STALL_ON && st.stall && st.stall.goal !== goalKey);
    if (newGoal) {
      st.stall.goal = goalKey;
      st.blocked = null;
    }
    if (STALL_ON && st.stall && st.stall.released && !newGoal) {
      st.reason = 'stall-released:no-hop';
      return;
    }
    if (st.blocked === b && !(STALL_ON && st.stall && cycle !== st.stall.cycle)) return;
    var selected = choose(ctx, st, rs);
    if (!selected) {
      st.blocked = b;
      st.reason = 'no-directional-covered-team';
      if (STALL_ON) {
        if (!st.stall)
          st.stall = {
            since: ctx.sim.time,
            reason: st.reason,
            retries: 0,
            cycle: cycle,
            released: false,
            goal: goalKey
          };
        st.stall.retries++;
        st.stall.cycle = cycle;
        if (st.stall.released) st.reason = 'stall-released:no-hop';
        else if (ctx.sim.time - st.stall.since >= tune.lead.reviewAfter) {
          st.stall.released = true;
          st.stall.reason = 'no-hop-after-' + tune.lead.reviewAfter + 's';
          st.reason = 'stall-released:no-hop';
          Q.requestReview(ctx.sim, ctx.squad, st.reason);
        }
      }
      return;
    }
    st.stall = null;
    selected.plan.forEach(function (p) {
      root.BattleTacticalMarchProvider.releaseMan(ctx, p.man);
      root.BattleTacticalContactSkills.release(ctx, p.man);
    });
    /* Capability contract distinguishes one native personal mover (moverId)
       from a simultaneous group (moverIds requires 2–3 unique ids). Do not
       accidentally send a one-element moverIds array or suppress valid C/D hops. */
    var coverRequest = {
      direction: selected.direction,
      team: selected.team,
      coverTeam: null
    };
    if (selected.supportRelocation) coverRequest.supportRelocation = true;
    if (selected.moverIds.length === 1) coverRequest.moverId = selected.moverIds[0];
    else coverRequest.moverIds = selected.moverIds;
    var result = ctx.request('maneuver.cover', null, coverRequest);
    if (!result.ok) {
      st.blocked = b;
      st.reason = 'window-refused:' + result.reason;
      return;
    }
    /* This private plan never writes a destination. The native movement
       owner independently adopts and confirms every physical segment. */
    selected.routes.forEach(function (route) {
      var mover = selected.plan.find(function (p) {
        return String(p.man.id) === route.moverId;
      });
      var previous = st.routes.get(route.moverId);
      if (!route.reused || !previous)
        st.routes.set(route.moverId, {
          origin: { x: mover.man.root.position.x, z: mover.man.root.position.z },
          waypoints: route.waypoints,
          cursor: 0,
          mission: ctx.squad._macroMission,
          goalBasis: JSON.stringify(flankBasis(ctx.squad))
        });
    });
    st.arrived.clear();
    st.interrupted.clear();
    st.rejectedReplacementIds.clear();
    st.plan = selected.plan;
    st.supportRelocation = !!selected.supportRelocation;
    if (st.supportRelocation) st.supportRelocationsStarted++;
    st.defending = !!selected.defending;
    st.defenseSector = selected.defenseSector;
    st.defenseCenter = defense ? defense.center : null;
    st.defenseLimit = defense ? Math.min(30, Math.max(12, defense.radius * 0.95)) : null;
    st.team = selected.team;
    st.turn = selected.index;
    st.direction = selected.direction;
    st.byDirection[selected.direction].started += selected.plan.length;
    st.startedAt = ctx.sim.time;
    st.supporters = [];
    st.confirmedSupporters = [];
    st.window = result.actionId;
    st.windowsStarted++;
    note(ctx, st, 'support', 'await-independent-support-discharge');
  }
  function engagement(ctx) {
    var st = states.get(ctx.squad),
      s = ctx.facts;
    if (!st || st.key !== key(ctx) || !st.window) return false;
    if (root.BattleSquadStability.controllerBound.role(s, ctx.sim) === 'move') {
      if (st.actions.has(String(s.id))) return true;
      root.BattleTacticalContactSkills.engagement(ctx, 'watch');
      return true;
    }
    return false;
  }
  root.BattleTacticalCoveredManeuver = {
    update: update,
    engagement: engagement,
    telemetry: function (sim) {
      var TC = root.BattleTacticalController;
      if (!TC || !TC.summary(sim).new) return null;
      var api = root.BattleTacticalCoveredManeuver,
        rows = [];
      ['us', 'ge'].forEach(function (f) {
        ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
          var row = api.summary(sq);
          if (row) rows.push(Object.assign({ squad: f + ':' + sq.id }, row));
        });
      });
      return { squads: rows };
    },
    wants: function (s, sim) {
      var st = s && states.get(s.squad);
      return !!(st && st.window && root.BattleSquadStability.controllerBound.role(s, sim));
    },
    summary: function (sq) {
      var st = states.get(sq);
      return st
        ? {
            phase: st.phase,
            reason: st.reason,
            stall: st.stall
              ? { since: st.stall.since, reason: st.stall.reason, retries: st.stall.retries }
              : null,
            direction: st.direction,
            team: st.team,
            completed: st.completed,
            failed: st.failed, // legacy planned failures; not aborted physical hops
            windowsStarted: st.windowsStarted,
            windowsCompleted: st.windowsCompleted,
            windowsPartiallyCompleted: st.windowsPartiallyCompleted,
            windowsAborted: st.windowsAborted,
            personalOrdersAccepted: st.personalOrdersAccepted,
            personalOrdersRejected: st.personalOrdersRejected,
            personalOrdersInterrupted: st.personalOrdersInterrupted,
            plannedNeverSubmitted: st.plannedNeverSubmitted,
            checkins: st.checkins,
            movingCount:
              st.window && st.phase === 'moving' ? st.plan.length - st.arrived.size - st.interrupted.size : 0,
            supportRelocation: !!st.supportRelocation,
            supportRelocationsStarted: st.supportRelocationsStarted,
            supportRelocationsCheckedIn: st.supportRelocationsCheckedIn,
            pendingCover: !!st.window,
            arrivedIds: Array.from(st.arrived),
            interruptedIds: Array.from(st.interrupted),
            retainedRoutes: Array.from(st.routes.entries()).map(function (entry) {
              return {
                moverId: entry[0],
                cursor: entry[1].cursor,
                origin: entry[1].origin || null,
                active: !!(
                  entry[1].mission === sq._macroMission &&
                  sq._macroMission &&
                  (sq._macroMission.action === 'assault' ||
                    sq._macroMission.action === 'defend' ||
                    sq.state === 'retreat' ||
                    sq.commandPhase === 'retreat') &&
                  entry[1].cursor < entry[1].waypoints.length
                ),
                waypoints: entry[1].waypoints.map(function (p) {
                  return { x: p.x, z: p.z, slotId: p.slotId };
                })
              };
            }),
            byDirection: JSON.parse(JSON.stringify(st.byDirection)),
            supporters: (st.supporters || []).slice(),
            history: st.history.slice(),
            diagnostic: st.diagnostic ? JSON.parse(JSON.stringify(st.diagnostic)) : null
          }
        : null;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
