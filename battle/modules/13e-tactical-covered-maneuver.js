/* One directional covered-bound skill for the exclusive controller. It chooses a team and
   detached cover points; Meso leases the window, Engagement reserves and executes, Command
   Reception adopts, and the resolver alone moves. No fire permission or world-state writer. */
(function (root) {
  'use strict';
  var states = new WeakMap(),
    teams = ['alpha', 'bravo', 'charlie'];
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
  function end(ctx, st, reason, success) {
    st.actions.forEach(function (id) {
      ctx.finish(id, reason);
    });
    st.actions.clear();
    if (st.window) ctx.finish(st.window, reason);
    st.window = null;
    /* Supporters keep firing. Ending a bound must not clear every squadmate's contact role. */
    if (st.direction) st.byDirection[st.direction][success ? 'completed' : 'aborted']++;
    if (success) {
      st.completed++;
      st.lastTeam = st.team;
      st.lastMoverId = st.plan && st.plan[0] && String(st.plan[0].man.id);
      st.turn = (st.turn + 1) % teams.length;
    } else st.failed++;
    note(ctx, st, success ? 'completed' : 'aborted', reason);
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
        at: ctx.sim.time, phase: ctx.squad.commandPhase, direction: back ? 'back' : 'forward',
        contactReports: rs.length, goal: goal ? { x: goal.x, z: goal.z } : null,
        maxBoundDistance: R && R.tuning.maxHop, teams: [], result: null
      };
    st.diagnostic = audit;
    if (!R || !R.pick || !C || !goal || !leader || !rs.length || list.length < 3) {
      audit.result = !R ? 'contact-route-skill-missing' : !goal ? 'no-mission-goal' :
        !leader ? 'no-live-leader' : !rs.length ? 'no-qualified-reported-contact' : 'insufficient-roster';
      return null;
    }
    var ready = list.filter(function (s) { return viable(s, ctx.sim); });
    /* Preserve one live support weapon outside the mover set. This may be a
       single MG or rifleman with genuine independent discharge evidence. */
    if (ready.length < 2) { audit.result = 'no-mover-and-supporter'; return null; }
    var choices = [];
    ready.forEach(function (s) {
      if (A.isMachineGun(s) || (st.lastMoverId === String(s.id) && ready.length > 2)) return;
      var team = Q.teamKeyFor(s),
        result = R.pick(s, ctx.sim, rs, goal, []),
        record = {
          team: team, moverId: String(s.id),
          eligibleMovers: 1, eligibleSupporters: ready.length - 1,
          candidates: result.stats.total, directionalCandidates: result.stats.progressing,
          admittedRoutes: result.stats.safe, moverFailures: [],
          routeRejections: result.stats.rejected, result: result.point ? 'selected-candidate' : 'no-hop'
        };
      audit.teams.push(record);
      if (!result.point) return;
      choices.push({ man: s, team: team, point: result.point, score: result.score,
        exposure: result.exposure });
    });
    choices.sort(function (a, b) {
      return a.score - b.score || String(a.man.id).localeCompare(String(b.man.id));
    });
    if (!choices.length) { audit.result = 'no-reachable-contact-cover'; return null; }
    var selected = choices[0];
    audit.result = 'individual-cover-hop-selected';
    return {
      team: selected.team,
      index: teams.indexOf(selected.team),
      moverId: String(selected.man.id),
      plan: [{ man: selected.man, point: selected.point }],
      direction: back ? 'back' : 'forward'
    };
  }
  function supports(ctx, st) {
    var E = root.BattleEngagement,
      M = root.BattleAmmunition;
    return men(ctx.squad)
      .filter(function (s) {
        var shot = M && M.shotEvidence && M.shotEvidence(s, ctx.sim);
        return (
          !st.plan.some(function (p) {
            return p.man === s;
          }) &&
          !!(s && !s.dead && !s.incapacitated && s.hp > 0 && s.weapon && !s.outOfAmmo) &&
          E.supportReady(s, ctx.sim) &&
          shot &&
          shot.at >= st.startedAt &&
          ctx.sim.time >= shot.at &&
          ctx.sim.time - shot.at <= Q.boundDuration
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
          : Q.boundPhases().indexOf(ctx.squad.commandPhase) >= 0);
    if (st.window) {
      var stage = ctx.stage(st.window);
      if (!eligible || !stage || stage.stage === 'cancelled') {
        end(ctx, st, 'window-ended', false);
        st.blocked = b;
        return;
      }
      st.supporters = supports(ctx, st);
      if (st.phase === 'moving') {
        var stages = Array.from(st.actions.values()).map(function (id) {
          return ctx.stage(id);
        });
        var revoked = st.plan.some(function (p) {
          var d = Math.hypot(p.man.root.position.x - p.point.x, p.man.root.position.z - p.point.z);
          /* Reevaluate capability and actual physical obstruction, but never
             revoke a nearly completed hop because endpoint sampling changed. */
          return !viable(p.man, ctx.sim) ||
            (d > 2 && root.BattleNavigation &&
              !root.BattleNavigation.movementClear(p.man.root.position, p.point));
        });
        if (
          st.supporters.length < 1 ||
          revoked ||
          stages.some(function (s) {
            return !s || s.stage === 'cancelled';
          })
        ) {
          end(ctx, st, 'support-or-mover-interrupted', false);
          st.blocked = b;
          return;
        }
        if (
          stages.length === st.plan.length &&
          stages.every(function (s) {
            return s.stage === 'arrived';
          })
        ) {
          end(ctx, st, 'physical-team-arrival', true);
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
          !root.BattleTacticalContactRoute.evaluate(p.man, ctx.sim, p.point,
            C.boundThreats(p.man, ctx.sim), root.BattleEngagement.underFireNow(p.man, ctx.sim)).eligible
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
    root.BattleTacticalMarchProvider.releaseMan(ctx, selected.plan[0].man);
    root.BattleTacticalContactSkills.release(ctx, selected.plan[0].man);
    var result = ctx.request('maneuver.cover', null, {
      direction: selected.direction,
      team: selected.team,
      coverTeam: null,
      moverId: selected.moverId
    });
    if (!result.ok) {
      st.blocked = b;
      st.reason = 'window-refused:' + result.reason;
      return;
    }
    st.plan = selected.plan;
    st.team = selected.team;
    st.turn = selected.index;
    st.direction = selected.direction;
    st.byDirection[selected.direction].started++;
    st.startedAt = ctx.sim.time;
    st.supporters = [];
    st.window = result.actionId;
    note(ctx, st, 'support', 'await-two-independent-discharges');
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
            byDirection: JSON.parse(JSON.stringify(st.byDirection)),
            supporters: (st.supporters || []).slice(),
            history: st.history.slice(),
            diagnostic: st.diagnostic ? JSON.parse(JSON.stringify(st.diagnostic)) : null
          }
        : null;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
