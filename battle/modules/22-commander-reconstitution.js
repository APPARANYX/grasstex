/* Commander reconstitution sub-module (extracted from battle/commander-ai.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.

   This is the General's survivor pool: retreated squads that are home and out of contact
   (_assembly at-base, 16-squad-plan-stability.js) are grouped fewest-at-a-time. A full 10-man
   rebuild is preferred when available, but two or more remnants totaling at least the viable
   minimum may rebuild understrength instead of waiting forever. They are briefed to a rally point,
   merged into one re-tasked squad when every member is there out of contact, and dissolved back
   into the pool if they fall below the viable minimum or a member rallies first (reconState,
   formGroup, dissolveGroup, mergeGroup, reconstitute). It also owns the fled man's pickup: a retreating squad out of contact within
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
      RECON_MIN_STRENGTH = ctx.RECON_MIN_STRENGTH,
      RECON_POOL_MAX = ctx.RECON_POOL_MAX,
      RECON_MAX_CENTER_TRAVEL = ctx.RECON_MAX_CENTER_TRAVEL,
      RECON_FORWARD_DETOUR = ctx.RECON_FORWARD_DETOUR,
      RECON_FORWARD_MAX = ctx.RECON_FORWARD_MAX,
      RALLY_RADIUS = ctx.RALLY_RADIUS,
      FLED_PICKUP_RANGE = ctx.FLED_PICKUP_RANGE;
    /* Reconstitution. Retreated squads that are home and out of contact (`_assembly` `at-base`,
     16-squad-plan-stability.js) are a side's pool of survivors; no group is planned for a squad still on
     its way home. A full 10-man rebuild is preferred; when the pool has only 6-9 men, two or more remnants
     may rebuild as a viable understrength squad rather than waiting indefinitely. Squads are never split.
     The General briefs each grouped remnant to a rally point at the centre of their home points. When every grouped squad is there out of contact the General merges them into one squad
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
          minimumStrength: RECON_MIN_STRENGTH,
          pool: { survivors: 0, squads: [], ready: false },
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
    function squadPoint(sq) {
      return D.avgPos(sq) || sq.home || { x: 0, z: 0 };
    }
    function centerPoint(squads) {
      var x = 0,
        z = 0;
      squads.forEach(function (sq) {
        var p = squadPoint(sq);
        x += +p.x || 0;
        z += +p.z || 0;
      });
      return { x: x / squads.length, z: z / squads.length };
    }
    function centerTravel(squads, center) {
      var max = 0,
        sum = 0;
      squads.forEach(function (sq) {
        var p = squadPoint(sq),
          d = D.dist(p.x, p.z, center.x, center.z);
        max = Math.max(max, d);
        sum += d;
      });
      return { max: max, sum: sum };
    }
    /* Build one geographically coherent survivor group. Start from each remnant in turn and add the
       nearest remnant to the moving centroid until six survivors are available. The winning candidate
       minimizes the longest source-to-centre march first, then total marching, then prefers the fuller
       squad. This keeps A+B together when C is stronger but hundreds of metres away. */
    function chooseGroup(pool) {
      var best = null;
      for (var i = 0; i < pool.length; i++) {
        var take = [pool[i]],
          left = pool.filter(function (_, j) {
            return j !== i;
          }),
          total = D.aliveMembers(pool[i]).length;
        while (total < RECON_MIN_STRENGTH && left.length) {
          var c = centerPoint(take);
          left.sort(function (a, b) {
            var ap = squadPoint(a),
              bp = squadPoint(b),
              ad = D.dist(ap.x, ap.z, c.x, c.z),
              bd = D.dist(bp.x, bp.z, c.x, c.z);
            return ad - bd || String(a.id).localeCompare(String(b.id));
          });
          var next = left.shift();
          take.push(next);
          total += D.aliveMembers(next).length;
        }
        if (take.length < 2 || total < RECON_MIN_STRENGTH || total > RECON_STRENGTH) continue;
        var center = centerPoint(take),
          travel = centerTravel(take, center);
        if (travel.max > RECON_MAX_CENTER_TRAVEL) continue;
        var score = [
          travel.max,
          travel.sum,
          RECON_STRENGTH - total,
          take
            .map(function (sq) {
              return sq.id;
            })
            .join('|')
        ];
        if (
          !best ||
          score[0] < best.score[0] - 1e-9 ||
          (Math.abs(score[0] - best.score[0]) < 1e-9 &&
            (score[1] < best.score[1] - 1e-9 ||
              (Math.abs(score[1] - best.score[1]) < 1e-9 &&
                (score[2] < best.score[2] ||
                  (score[2] === best.score[2] && score[3] < best.score[3])))))
        )
          best = { squads: take.slice(), survivors: total, center: center, travel: travel, score: score };
      }
      return best;
    }
    /* First find the neutral rendezvous from the squads' ACTUAL at-base positions. Then slide that
       point toward the General's next objective only as far as every source squad can afford. The
       allowed route is at most 15% longer than going straight to the neutral centre; for two squads
       this is the same small-hypotenuse detour budget as the Pythagorean construction. The binary
       search also handles three-plus squads and objectives that are not perpendicular to the source line. */
    function rallyGeometry(squads, plan) {
      var center = centerPoint(squads),
        travel = centerTravel(squads, center);
      if (!plan || !plan.point)
        return { point: center, center: center, forwardShift: 0, centerTravel: travel };
      var dx = (+plan.point.x || 0) - center.x,
        dz = (+plan.point.z || 0) - center.z,
        len = Math.hypot(dx, dz);
      if (len < 1e-6) return { point: center, center: center, forwardShift: 0, centerTravel: travel };
      var ux = dx / len,
        uz = dz / len,
        high = Math.min(RECON_FORWARD_MAX, len),
        low = 0;
      function allowed(shift) {
        var x = center.x + ux * shift,
          z = center.z + uz * shift;
        for (var i = 0; i < squads.length; i++) {
          var p = squadPoint(squads[i]),
            baseline = D.dist(p.x, p.z, center.x, center.z),
            budget = baseline * RECON_FORWARD_DETOUR;
          if (D.dist(p.x, p.z, x, z) > budget + 1e-6) return false;
        }
        return true;
      }
      for (var step = 0; step < 24; step++) {
        var mid = (low + high) / 2;
        if (allowed(mid)) low = mid;
        else high = mid;
      }
      return {
        point: { x: center.x + ux * low, z: center.z + uz * low },
        center: center,
        forwardShift: low,
        centerTravel: travel
      };
    }
    function rallyPoint(sim, faction, squads, plan) {
      return rallyGeometry(squads, plan).point;
    }
    function formGroup(sim, faction, squads) {
      /* All source squads are already at base. Geometry decides where they can realistically meet
         before the General re-tasks the rebuilt squad. */
      var st = reconState(sim, faction),
        plan = D.chooseObjective(sim, squads[0], false) || D.chooseObjective(sim, squads[0], true),
        geometry = rallyGeometry(squads, plan),
        rally = geometry.point;
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
        center: geometry.center,
        centerTravelMax: geometry.centerTravel.max,
        centerTravelSum: geometry.centerTravel.sum,
        forwardShift: geometry.forwardShift,
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
        center: g.center,
        centerTravelMax: +g.centerTravelMax.toFixed(1),
        forwardShift: +g.forwardShift.toFixed(1),
        objectiveId: g.objectiveId
      });
      return g;
    }
    function dissolveGroup(sim, g, squads, reason) {
      /* Clean every original member of the group, not only the still-living subset used by the
         viability calculation. A squad wiped while assembling must not retain _reconGroup or an
         executing reconstitution brief forever. */
      var all = [],
        seen = {};
      (squads || []).forEach(function (sq) {
        if (!sq || seen[sq.id]) return;
        seen[sq.id] = true;
        all.push(sq);
      });
      g.squads.forEach(function (id) {
        var sq = squadById(sim, g.faction, id);
        if (!sq || seen[sq.id]) return;
        seen[sq.id] = true;
        all.push(sq);
      });
      all.forEach(function (sq) {
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
      /* A man who reached base on his own stayed outside force accounting while he was a fled
       detachment. Successful reconstitution is his second legal return path (pickup is the
       first), so tell Engagement—the owner of countsForElimination—to restore him now that
       the roster rewrite has actually put him back in a full fighting squad. */
      men.forEach(function (s) {
        if (s.countsForElimination !== false) return;
        var E = root.BattleEngagement;
        if (!E || typeof E.restoreFledForceCount !== 'function')
          throw new Error(
            'Reconstitution cannot restore a fled man without Engagement force-count ownership'
          );
        E.restoreFledForceCount(s, sim, 'reconstitution');
      });
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
            var living = D.aliveMembers(sq).length;
            return (
              !sq.disbanded &&
              sq.state === 'retreat' &&
              !sq._reconGroup &&
              !sq.inContact &&
              sq._assembly &&
              sq._assembly.phase === 'at-base' &&
              living > 0 &&
              living <= RECON_POOL_MAX
            );
          }),
        total = pool.reduce(function (n, sq) {
          return n + D.aliveMembers(sq).length;
        }, 0),
        candidate = chooseGroup(pool);
      /* Five or more survivors remain a viable squad and use normal morale recovery. Only 1-4-man
         remnants enter this pool. ready means there is enough manpower AND a geographically coherent
         cluster whose neutral meeting point is within the assembly-distance budget. */
      st.pool = {
        survivors: total,
        squads: pool.map(function (sq) {
          var p = squadPoint(sq);
          return { id: sq.id, survivors: D.aliveMembers(sq).length, x: +p.x.toFixed(1), z: +p.z.toFixed(1) };
        }),
        ready: !!candidate,
        blockedByDistance: total >= RECON_MIN_STRENGTH && !candidate
      };
      while (candidate) {
        candidate.squads.forEach(function (sq) {
          var at = pool.indexOf(sq);
          if (at >= 0) pool.splice(at, 1);
        });
        total -= candidate.survivors;
        formGroup(sim, faction, candidate.squads);
        candidate = chooseGroup(pool);
      }
      st.pool = {
        survivors: total,
        squads: pool.map(function (sq) {
          var p = squadPoint(sq);
          return { id: sq.id, survivors: D.aliveMembers(sq).length, x: +p.x.toFixed(1), z: +p.z.toFixed(1) };
        }),
        ready: !!candidate,
        blockedByDistance: total >= RECON_MIN_STRENGTH && !candidate
      };
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
        if (survivors < RECON_MIN_STRENGTH) dissolveGroup(sim, g, squads, 'below-viable-strength');
        /* A member that rallied (?morale=1) is no longer retreating, so it will never reach the rally point as a
         retreating squad: the group cannot finish. Without a rally a member's state leaves `retreat` only through
         a merge, which ends the group first. */ else if (
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
          if (sq === lone || sq.fledId != null || sq.disbanded || sq.state !== 'retreat' || sq.inContact)
            continue;
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
      squadPoint: squadPoint,
      centerPoint: centerPoint,
      chooseGroup: chooseGroup,
      rallyGeometry: rallyGeometry,
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
    throw new Error(
      '[commander-reconstitution] commander-ai.js must load before battle/modules/22-commander-reconstitution.js'
    );
  root._commanderReconstitutionAttach(
    root._commanderReconstitutionPositions(root._commanderReconstitutionCtx())
  );
})(typeof window !== 'undefined' ? window : globalThis);
