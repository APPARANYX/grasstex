/* Commander reconstitution sub-module (extracted from battle/commander-ai.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.

   This is the General's survivor pool: retreated squads that are home and out of contact
   (_assembly at-base, 16-squad-plan-stability.js) are grouped fewest-at-a-time once the pool
   holds a full squad's worth, briefed to a rally point, merged into one re-tasked squad when
   every member is there out of contact, and dissolved back into the pool if they fall below
   strength or a member rallies first (reconState, formGroup, dissolveGroup, mergeGroup,
   reconstitute). It also owns the fled man's pickup: a retreating squad out of contact within
   FLED_PICKUP_RANGE absorbs a lone fled man waiting at his refuge (pickUpFled). Group state
   lives in missionState(sim).reconstitution on the side's General context.

   Wiring is the same reversed install as 19-engagement-cover-positions: commander-ai.js loads
   before every module in both chains (it is in the page's core-adjacent extras, before the
   discovered modules; the harness checks load it by hand), so it publishes the ctx below
   (_commanderReconstitutionCtx: its closure utilities, the mission-lifecycle functions the
   re-tasking goes through, and the RECON_* / FLED_PICKUP_RANGE constants, which stay in the
   parent - the BattleCommanderAI export reads them) plus an attach sink
   (_commanderReconstitutionAttach), and this file calls the factory with that ctx at ITS load
   time and installs the returned functions back into the parent. Until then the parent's
   delegating closures fail loudly, so a commander-ai chain without this module says so on the
   first commander tick instead of silently never reconstituting. */
(function (root) {
  'use strict';
  if (root._commanderReconstitutionPositions) return;

  /* Factory: the module calls it itself at load time with commander-ai.js's ctx (see above). */
  root._commanderReconstitutionPositions = function (ctx) {
    var root = ctx.root,
      D = ctx.D,
      telemetry = ctx.telemetry,
      generalFor = ctx.generalFor,
      missionState = ctx.missionState,
      issueMission = ctx.issueMission,
      finishMission = ctx.finishMission,
      recordMacroWake = ctx.recordMacroWake,
      RECON_STRENGTH = ctx.RECON_STRENGTH,
      RALLY_RADIUS = ctx.RALLY_RADIUS,
      RALLY_FORWARD = ctx.RALLY_FORWARD,
      FLED_PICKUP_RANGE = ctx.FLED_PICKUP_RANGE;
  /* Reconstitution. Retreated squads that are home and out of contact (`_assembly` `at-base`,
     16-squad-plan-stability.js) are a side's pool of survivors; no group is planned for a squad still on
     its way home. Whenever the pool holds a full squad's worth, the General groups the fewest squads that
     reach it (squads are never split) and briefs each to a rally point at the centre of their home
     points. When every grouped squad is there out of contact the General merges them into one squad
     under one leader and re-tasks it (`squad-reconstituted`). A group that falls below full strength
     before merging is dissolved and its squads return to the pool. State lives in
     missionState(sim).reconstitution. */
  function reconState(sim, faction) {
    var general = generalFor(sim, faction);
    return (
      general.reconstitution ||
      (general.reconstitution = {
        faction: faction,
        strength: RECON_STRENGTH,
        serial: 0,
        groupsFormed: 0,
        groupsDissolved: 0,
        merges: 0,
        promotions: 0,
        active: [],
        ended: []
      })
    );
  }
  function squadById(sim, faction, id) {
    var a = sim.factions[faction].squads;
    for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    return null;
  }
  function endGroup(st, g, status, reason, t) {
    g.status = status;
    g.endReason = reason;
    g.endedAt = t;
    st.active.splice(st.active.indexOf(g), 1);
    st.ended.push(g);
    if (st.ended.length > 20) st.ended.shift();
  }
  function strongestFirst(sim, faction) {
    var order = sim.factions[faction].squads;
    return function (a, b) {
      return D.aliveMembers(b).length - D.aliveMembers(a).length || order.indexOf(a) - order.indexOf(b);
    };
  }
  /* The rally point is where the re-formed squad starts its next approach: on the spawn line, RALLY_FORWARD
     ahead of it, straight back from the objective the General expects to send it to, and inside the
     side's lanes. With no objective to plan for it is the centre of the grouped squads' home points. */
  function rallyPoint(sim, faction, squads, plan) {
    var x = 0,
      z = 0;
    for (var i = 0; i < squads.length; i++) {
      x += +squads[i].home.x || 0;
      z += +squads[i].home.z || 0;
    }
    x /= squads.length;
    z /= squads.length;
    if (!plan) return { x: x, z: z };
    var homes = sim.factions[faction].squads.map(function (sq) {
        return +sq.home.x || 0;
      }),
      toward = plan.point.z >= z ? 1 : -1;
    return {
      x: Math.max(Math.min.apply(null, homes), Math.min(Math.max.apply(null, homes), plan.point.x)),
      z: z + toward * RALLY_FORWARD
    };
  }
  function formGroup(sim, faction, squads) {
    /* The strongest grouped squad stands in for the re-formed squad: all of them are at base. */
    var st = reconState(sim, faction),
      plan = D.chooseObjective(sim, squads[0], false) || D.chooseObjective(sim, squads[0], true),
      rally = rallyPoint(sim, faction, squads, plan);
    var g = {
      id: faction + '-reconstitution-' + ++st.serial,
      faction: faction,
      squads: squads.map(function (sq) {
        return sq.id;
      }),
      rally: rally,
      objectiveId: plan ? plan.instance.id : null,
      survivors: squads.reduce(function (n, sq) {
        return n + D.aliveMembers(sq).length;
      }, 0),
      formedAt: +sim.time || 0,
      status: 'assembling'
    };
    st.active.push(g);
    st.groupsFormed++;
    squads.forEach(function (sq) {
      finishMission(sim, sq, 'failed', 'squad-retreat');
      recordMacroWake(sim, sq, 'reconstitute-group');
      sq._reconGroup = g.id;
      issueMission(
        sim,
        sq,
        {
          intent: 'reconstitute',
          action: 'assemble',
          objectiveId: null,
          point: g.rally,
          role: sq.commandRole || 'center',
          route: [],
          plannedObjectiveId: g.objectiveId
        },
        'reconstitute-group'
      );
    });
    telemetry(sim, 'decision-reconstitute-group', {
      faction: faction,
      group: g.id,
      squads: g.squads,
      survivors: g.survivors,
      rally: g.rally,
      objectiveId: g.objectiveId
    });
    return g;
  }
  function dissolveGroup(sim, g, squads, reason) {
    squads.forEach(function (sq) {
      sq._reconGroup = null;
      finishMission(sim, sq, 'failed', reason);
    });
    var st = reconState(sim, g.faction);
    st.groupsDissolved++;
    endGroup(st, g, 'dissolved', reason, +sim.time || 0);
    telemetry(sim, 'decision-reconstitute-dissolved', { faction: g.faction, group: g.id, reason: reason });
  }
  function mergeGroup(sim, g, squads) {
    var st = reconState(sim, g.faction),
      t = +sim.time || 0,
      order = squads.slice().sort(strongestFirst(sim, g.faction)),
      /* The most senior surviving leader takes command (a sergeant outranks a rifleman who stepped up
         in combat), the stronger squad first among equals; `order` is strongest first and sort is stable. */
      led = order
        .filter(function (sq) {
          return !!root.SquadAI.leaderOf(sq);
        })
        .sort(function (a, b) {
          return (
            root.SquadAI.seniority(root.SquadAI.leaderOf(a)) -
            root.SquadAI.seniority(root.SquadAI.leaderOf(b))
          );
        }),
      survivor = led[0] || order[0],
      men = [];
    [survivor]
      .concat(
        order.filter(function (sq) {
          return sq !== survivor;
        })
      )
      .forEach(function (sq) {
        D.aliveMembers(sq).forEach(function (s) {
          men.push(s);
        });
      });
    var leader = root.SquadAI.leaderOf(survivor),
      promoted = !leader;
    if (promoted) leader = root.SquadAI.mostSenior(men);
    men.forEach(function (s) {
      if (root.BattleTacticalPositions) root.BattleTacticalPositions.release(s, sim, 'reconstituted');
    });
    /* The Squad Leader re-forms the squad on the group's rally point: slots, plan state, leader, anchor. */
    root.BattleSquadStability.reform(survivor, men, leader, g.rally, RECON_STRENGTH);
    survivor._reconGroup = null;
    survivor.reconstitutedFrom = g.squads.slice();
    finishMission(sim, survivor, 'completed', 'reconstituted');
    order.forEach(function (sq) {
      if (sq === survivor) return;
      /* An absorbed squad reads like a destroyed one: no living men, full strength missing. */
      sq.establishment = RECON_STRENGTH;
      root.BattleSquadStability.disband(sq);
      sq.disbanded = true;
      sq.mergedInto = survivor.id;
      sq._reconGroup = null;
      finishMission(sim, sq, 'completed', 'merged');
    });
    st.merges++;
    if (promoted) st.promotions++;
    g.survivor = survivor.id;
    g.size = men.length;
    g.leader = leader.id;
    g.promoted = promoted;
    endGroup(st, g, 'merged', 'reconstituted', t);
    telemetry(sim, 'decision-squad-merge', {
      faction: g.faction,
      group: g.id,
      survivor: survivor.id,
      absorbed: g.squads.filter(function (id) {
        return id !== survivor.id;
      }),
      size: men.length,
      leader: leader.id
    });
    if (promoted)
      telemetry(sim, 'decision-leader-promoted', {
        faction: g.faction,
        squad: survivor.id,
        soldier: leader.id,
        role: leader.role
      });
  }
  function atRally(sq, g) {
    var a = sq._assembly,
      p = D.avgPos(sq);
    return !!(
      a &&
      a.phase === 'to-rally' &&
      !sq.inContact &&
      D.dist(p.x, p.z, g.rally.x, g.rally.z) <= RALLY_RADIUS
    );
  }
  /* Pool first, then advance groups: a squad merged this tick still reads `retreat` until its Squad Leader
     recomputes its status, so it must not be pooled in the same pass. */
  function reconstitute(sim, faction) {
    var st = reconState(sim, faction),
      groups = st.active.slice(),
      pool = sim.factions[faction].squads
        .filter(function (sq) {
          return (
            !sq.disbanded &&
            sq.state === 'retreat' &&
            !sq._reconGroup &&
            !sq.inContact &&
            sq._assembly &&
            sq._assembly.phase === 'at-base' &&
            D.aliveMembers(sq).length &&
            /* A squad that already holds a full squad's men has nothing to reconstitute: grouped alone it would be
               "merged" with itself and re-tasked on every command tick. Group morale keeps it in `retreat` until its
               men are calm, so it rests at base and the Squad Leader rallies it (a merged squad whose men are still
               shaken, which stress that lasts makes common). */
            D.aliveMembers(sq).length < RECON_STRENGTH
          );
        })
        .sort(strongestFirst(sim, faction)),
      total = pool.reduce(function (n, sq) {
        return n + D.aliveMembers(sq).length;
      }, 0);
    /* Strongest first reaches full strength with the fewest squads. */
    while (total >= RECON_STRENGTH) {
      var take = [],
        n = 0;
      while (n < RECON_STRENGTH) {
        var next = pool.shift();
        take.push(next);
        n += D.aliveMembers(next).length;
      }
      total -= n;
      formGroup(sim, faction, take);
    }
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i],
        squads = g.squads
          .map(function (id) {
            return squadById(sim, faction, id);
          })
          .filter(function (sq) {
            return sq && !sq.disbanded && D.aliveMembers(sq).length;
          }),
        survivors = squads.reduce(function (n, sq) {
          return n + D.aliveMembers(sq).length;
        }, 0);
      if (survivors < RECON_STRENGTH) dissolveGroup(sim, g, squads, 'below-strength');
      /* A member that rallied (?morale=1) is no longer retreating, so it will never reach the rally point as a
         retreating squad: the group cannot finish. Without a rally a member's state leaves `retreat` only through
         a merge, which ends the group first. */
      else if (
        squads.some(function (sq) {
          return sq.state !== 'retreat';
        })
      )
        dissolveGroup(sim, g, squads, 'squad-rallied');
      else if (
        squads.every(function (sq) {
          return atRally(sq, g);
        })
      )
        mergeGroup(sim, g, squads);
    }
  }

  /* A fled man (a squad of one, `fledId`: Engagement `flee`) waits at his refuge for a retreating squad. When one that is
     out of contact stands within FLED_PICKUP_RANGE of him, the General has it take him in (the Squad Leader rewrites
     its roster, `absorb`) and tells Engagement his wait is over: he goes home with them and is issued a weapon at base. */
  function pickUpFled(sim, faction) {
    var squads = sim.factions[faction].squads,
      E = root.BattleEngagement,
      S = root.BattleSquadStability;
    if (!E || !S || !E.releaseFled) return;
    for (var i = 0; i < squads.length; i++) {
      var lone = squads[i],
        man = lone.fledId != null && !lone.disbanded && lone.members && lone.members[0];
      if (!man || man.dead || E.fledPhase(man) !== 'wait') continue;
      var p = man.root.position,
        best = null,
        bestD = FLED_PICKUP_RANGE;
      for (var j = 0; j < squads.length; j++) {
        var sq = squads[j];
        if (sq === lone || sq.fledId != null || sq.disbanded || sq.state !== 'retreat' || sq.inContact) continue;
        if (!D.aliveMembers(sq).length) continue;
        var a = D.avgPos(sq),
          d = D.dist(p.x, p.z, a.x, a.z);
        if (d <= bestD) {
          best = sq;
          bestD = d;
        }
      }
      if (best && S.absorb(best, lone, sim) && E.releaseFled(man, sim, 'pickup'))
        telemetry(sim, 'decision-fled-pickup', {
          faction: faction,
          soldier: man.id,
          squad: best.id,
          distance: +bestD.toFixed(1)
        });
    }
  }
    return {
      reconState: reconState,
      squadById: squadById,
      endGroup: endGroup,
      strongestFirst: strongestFirst,
      rallyPoint: rallyPoint,
      formGroup: formGroup,
      dissolveGroup: dissolveGroup,
      mergeGroup: mergeGroup,
      atRally: atRally,
      reconstitute: reconstitute,
      pickUpFled: pickUpFled
    };
  };

  /* Install into the parent now; commander-ai.js must already be loaded. */
  if (!root._commanderReconstitutionCtx || !root._commanderReconstitutionAttach)
    throw new Error('[commander-reconstitution] commander-ai.js must load before battle/modules/22-commander-reconstitution.js');
  root._commanderReconstitutionAttach(root._commanderReconstitutionPositions(root._commanderReconstitutionCtx()));
})(typeof window !== 'undefined' ? window : globalThis);
