/* One directional covered-bound skill for the exclusive controller. It chooses a team and
   detached cover points; Meso leases the window, Engagement reserves and executes, Command
   Reception adopts, and the resolver alone moves. No fire permission or world-state writer. */
(function (root) {
  'use strict';
  var states = new WeakMap(),
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
        checkins: 0,
        arrived: new Set(),
        interrupted: new Set(),
        window: null,
        phase: 'idle',
        history: [],
        completed: 0,
        failed: 0,
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
    st.lastMoverId = id;
    var route = st.routes.get(id);
    if (route) {
      var waypoint = route.waypoints[route.cursor];
      if (waypoint && Math.hypot(p.man.root.position.x - waypoint.x, p.man.root.position.z - waypoint.z) < 2)
        route.cursor++;
      else st.routes.delete(id);
    }
    var actionId = st.actions.get(id);
    if (actionId) ctx.finish(actionId, 'confirmed-physical-arrival:' + id);
    st.actions.delete(id);
    note(ctx, st, 'checkin', 'squad-leader-confirmed-physical-arrival:' + id);
    st.phase = 'moving';
  }
  function interruptMan(ctx, st, p, reason) {
    var id = String(p.man.id);
    if (st.arrived.has(id) || st.interrupted.has(id)) return;
    st.interrupted.add(id);
    var actionId = st.actions.get(id);
    if (actionId) ctx.finish(actionId, reason);
    st.actions.delete(id);
    st.routes.delete(id);
    st.failed++;
    note(ctx, st, 'interrupted', reason + ':' + id);
    st.phase = 'moving';
  }
  function end(ctx, st, reason, success) {
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
          st.routes.delete(id);
        }
      });
    }
    note(ctx, st, success ? 'completed' : 'aborted', reason);
    st.arrived.clear();
    st.interrupted.clear();
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
  function reports(ctx) {
    var leader = root.SquadAI.leaderOf(ctx.squad);
    return leader ? root.BattleCoverPositions.boundThreats(leader, ctx.sim) : [];
  }
  function basis(ctx, rs) {
    return JSON.stringify([
      ctx.squad.state === 'retreat' || ctx.squad.commandPhase === 'retreat',
      ctx.squad.commandPhase,
      root.BattleNavigation && root.BattleNavigation.version,
      rs.map(function (r) {
        return [Math.round(r.x), Math.round(r.z)];
      }),
      men(ctx.squad).map(function (s) {
        return [s.id, Math.round(s.root.position.x), Math.round(s.root.position.z), viable(s, ctx.sim)];
      })
    ]);
  }
  /* Choose a capable individual, not an indivisible fireteam. The separate
     contact-route skill ranks real physical cover waypoints by exposure, cover
     quality and progress. Meso will independently validate the chosen actor. */
  function choose(ctx, st, rs) {
    var Q = root.BattleSquadStability,
      C = root.BattleCoverPositions,
      A = root.SquadAI,
      R = root.BattleTacticalContactRoute,
      list = men(ctx.squad),
      back = ctx.squad.state === 'retreat' || ctx.squad.commandPhase === 'retreat',
      goal = back ? A.retreatGoal(ctx.squad) : root.BattleTacticalMarchProvider.target(ctx.squad),
      leader = A.leaderOf(ctx.squad),
      audit = {
        at: ctx.sim.time,
        phase: ctx.squad.commandPhase,
        direction: back ? 'back' : 'forward',
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
      return viable(s, ctx.sim);
    });
    /* Preserve one live support weapon outside the mover set. This may be a
       single MG or rifleman with genuine independent discharge evidence. */
    if (ready.length < 2) {
      audit.result = 'no-mover-and-supporter';
      return null;
    }
    var choices = [];
    ready.forEach(function (s) {
      if (A.isMachineGun(s) || (st.lastMoverId === String(s.id) && ready.length > 2)) return;
      var team = Q.teamKeyFor(s);
      /* The Meso covered-window owner accepts alpha/bravo/charlie, not the
         command element. Never choose a route it cannot lease. */
      if (teams.indexOf(team) < 0) return;
      var result = R.pick(s, ctx.sim, rs, goal, [], st.routes.get(String(s.id))),
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
        score: result.score + (effectiveHere ? 24 : 0),
        exposure: result.exposure,
        effectiveHere: effectiveHere
      });
    });
    choices.sort(function (a, b) {
      return a.score - b.score || String(a.man.id).localeCompare(String(b.man.id));
    });
    if (!choices.length) {
      audit.result = 'no-reachable-contact-cover';
      return null;
    }
    var selected = [];
    /* One Meso lease, up to three independent personal movement orders.
       Preserve two live squadmates as potential covering shooters. */
    choices.forEach(function (candidate) {
      if (selected.length >= Math.min(MAX_PARALLEL_MOVERS, ready.length - 2)) return;
      if (
        selected.some(function (p) {
          return Math.hypot(candidate.point.x - p.point.x, candidate.point.z - p.point.z) < 4;
        })
      )
        return;
      selected.push(candidate);
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
      direction: back ? 'back' : 'forward'
    };
  }
  function supports(ctx, st) {
    var E = root.BattleEngagement;
    return men(ctx.squad)
      .filter(function (s) {
        return (
          !st.plan.some(function (p) {
            return p.man === s;
          }) && E.supportDischarged(s, ctx.sim, st.startedAt)
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
      back = ctx.squad.state === 'retreat' || ctx.squad.commandPhase === 'retreat',
      eligible =
        ctx.squad.inContact &&
        rs.length &&
        a.length >= 3 &&
        (back
          ? !root.SquadAI.isExtractionToHome(ctx.squad)
          : Q.boundPhases().indexOf(ctx.squad.commandPhase) >= 0 ||
            (ctx.squad.commandPhase === 'approach' &&
              ctx.squad._macroMission &&
              ctx.squad._macroMission.action === 'assault'));
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
            return (
              String(s.id) === id &&
              !s.incapacitated &&
              s.hp > 0 &&
              s.weapon &&
              !s.outOfAmmo
            );
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
          var gap = Math.hypot(p.man.root.position.x - p.point.x, p.man.root.position.z - p.point.z);
          if (
            !viable(p.man, ctx.sim) ||
            (gap > 2 &&
              root.BattleNavigation &&
              !root.BattleNavigation.movementClear(p.man.root.position, p.point))
          ) {
            interruptMan(ctx, st, p, 'genuine-mover-or-geometry-interruption');
          }
        });
        var holders = men(ctx.squad).filter(function (s) {
          return (
            !st.plan.some(function (moving) {
              return moving.man === s;
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
        }
        return;
      }
      if (st.supporters.length < 1) {
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
          end(ctx, st, 'bound-refused:' + result.reason, false);
          st.blocked = b;
          return;
        }
        st.actions.set(String(p.man.id), result.actionId);
      }
      st.confirmedSupporters = st.supporters.slice();
      note(ctx, st, 'moving', 'real-independent-support-discharge');
      return;
    }
    if (!eligible) {
      st.reason = back ? 'ordinary-retreat' : 'no-authorized-contact';
      st.blocked = null;
      return;
    }
    if (st.blocked === b) return;
    var selected = choose(ctx, st, rs);
    if (!selected) {
      st.blocked = b;
      st.reason = 'no-directional-covered-team';
      return;
    }
    selected.plan.forEach(function (p) {
      root.BattleTacticalMarchProvider.releaseMan(ctx, p.man);
      root.BattleTacticalContactSkills.release(ctx, p.man);
    });
    var result = ctx.request('maneuver.cover', null, {
      direction: selected.direction,
      team: selected.team,
      coverTeam: null,
      moverIds: selected.moverIds
    });
    if (!result.ok) {
      st.blocked = b;
      st.reason = 'window-refused:' + result.reason;
      return;
    }
    /* This private plan never writes a destination. The native movement
       owner independently adopts and confirms every physical segment. */
    selected.routes.forEach(function (route) {
      var previous = st.routes.get(route.moverId);
      if (!route.reused || !previous)
        st.routes.set(route.moverId, {
          waypoints: route.waypoints,
          cursor: 0,
          mission: ctx.squad._macroMission
        });
    });
    st.arrived.clear();
    st.interrupted.clear();
    st.plan = selected.plan;
    st.team = selected.team;
    st.turn = selected.index;
    st.direction = selected.direction;
    st.byDirection[selected.direction].started += selected.plan.length;
    st.startedAt = ctx.sim.time;
    st.supporters = [];
    st.confirmedSupporters = [];
    st.window = result.actionId;
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
            direction: st.direction,
            team: st.team,
            completed: st.completed,
            failed: st.failed,
            checkins: st.checkins,
            movingCount:
              st.window && st.phase === 'moving' ? st.plan.length - st.arrived.size - st.interrupted.size : 0,
            pendingCover: !!st.window,
            arrivedIds: Array.from(st.arrived),
            interruptedIds: Array.from(st.interrupted),
            retainedRoutes: Array.from(st.routes.entries()).map(function (entry) {
              return {
                moverId: entry[0],
                cursor: entry[1].cursor,
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
