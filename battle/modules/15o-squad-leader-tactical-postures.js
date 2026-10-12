/* One opt-in Squad Leader posture policy. No destinations, fire permissions,
   stance, strategic intent or Navigation geometry are written here. Existing
   personal-command, fire-control and Engagement owners execute this evidence. */
(function (root) {
  'use strict';
  if (root._squadLeaderTacticalPostures) return;
  root._squadLeaderTacticalPostures = function (ctx) {
    var A = root.SquadAI,
      L = root.BattleLeases,
      query = (root.location && root.location.search) || '',
      on = !!(
        ctx.localPlan &&
        ctx.localPlan.on &&
        ctx.FIRE_CONTROL_ON &&
        /[?&]localAmbush=(?:1|on|true)(?:&|#|$)/i.test(query)
      ),
      maneuverOn =
        on &&
        /[?&]localManeuver=(?:1|on|true)(?:&|#|$)/i.test(query) &&
        /[?&]coveredBounds=(?:1|on|true)(?:&|#|$)/i.test(query),
      states = new WeakMap(),
      cooldown = new WeakMap(),
      counters = new WeakMap(),
      tuning = {
        minimumHold: 4,
        preparationBudget: 12,
        observationBudget: 12,
        pressureEnter: 0.25,
        pressureExit: 0.1,
        pressureDwell: 3,
        maneuverWindow: 14,
        minSupport: 2,
        readAge: 0.5
      };
    function point(p) {
      return p && Number.isFinite(p.x) && Number.isFinite(p.z) ? { x: p.x, z: p.z } : null;
    }
    function epoch(s) {
      return +(s.eng && s.eng.possessionEpoch) || 0;
    }
    function men(sq) {
      /* An occupied weapon emplacement or separate positional commitment
         belongs to its own owner. Exclude that soldier rather than vetoing
         the entire remainder of a squad; never issue a posture order to him.
         If a station is adopted or released, member identity validation below
         revokes the old posture before anything can act on stale membership. */
      var a = ctx.commanded(sq).filter(function (s) {
        return !(root.BattleTacticalPositions && root.BattleTacticalPositions.current(s));
      });
      return a.length >= 3 &&
        a.length <= 32 &&
        a.every(function (s) {
          return s.root && point(s.root.position) && !s.incapacitated && !s.isPlayer && s.hp > 0;
        })
        ? a
        : null;
    }
    function threats(b, sq) {
      var reports = A.squadContactsMap(sq, b),
        out = [];
      if (!Array.isArray(reports) || reports.length > 32) return out;
      reports.forEach(function (r) {
        if (
          point(r) &&
          Number.isFinite(r.at) &&
          b.time >= r.at &&
          b.time - r.at <= 10 &&
          Number.isFinite(r.confidence) &&
          r.confidence >= 0.5
        )
          out.push({ x: r.x, z: r.z, at: r.at, confidence: r.confidence });
      });
      return out.length <= 3 ? out : [];
    }
    /* This is a read-only preflight. Actual move eligibility, reservations,
       route selection and firing remain with native Engagement and Movement.
       Never treat visibility masking as ballistic protection; reuse the
       physicality-aware 0.75 m covered bound sampler for every candidate. */
    /* Engagement reports an identity-based base of fire. Duplicate entries,
       stale roster members and non-firing men cannot manufacture two rifles. */
    function supportingCount(a, movers, support, now) {
      if (!Array.isArray(support) || support.length > 32) return 0;
      var seen = [];
      return support.filter(function (s) {
        if (!s || seen.indexOf(s) >= 0) return false;
        seen.push(s);
        return (
          a.indexOf(s) >= 0 &&
          (!movers || movers.indexOf(s) < 0) &&
          !s.dead &&
          !s.reloading &&
          !s.outOfAmmo &&
          !(s.suppressedUntil > now) &&
          !s.moving
        );
      }).length;
    }
    /* Read-only proof of the SAME three adopted, stationary riflemen. A large
       squad may have additional men still finding cover; that cannot reset a
       genuine held fireteam or count a rotating set of arrivals as a 4s hold. */
    function settledActors(b, st, a, reports) {
      var C = root.BattleCoverPositions,
        O = root.BattleExecutionOutcome;
      return st.orders
        .filter(function (o) {
          var s = a.find(function (man) {
            return String(man.id) === o.soldierId;
          });
          if (!s || s._fireteamPublishKey !== o.key || s.moving || !O || !O.man) return false;
          var body = point(s.root && s.root.position),
            last = s._movementResolver && s._movementResolver.last,
            intent = last && point(last.intentPoint),
            CR = root.BattleCommandReception,
            receivedMovement =
              CR && CR.movementEnabled && CR.movementEnabled(),
            outcome = receivedMovement && O && O.man ? O.man(s, b) : null,
            completed = receivedMovement
              ? !!(
                  outcome &&
                  outcome.current &&
                  outcome.state === 'completed' &&
                  outcome.publishKey === o.key
                )
              : !!(body && Math.hypot(body.x - o.point.x, body.z - o.point.z) <= 0.5);
          /* With personal command reception enabled, Command Reception +
             Movement Execution own the definition of an adopted formation
             order completing (including the Resolver's 1.8 m arrival
             tolerance). Reuse that canonical outcome rather than maintaining
             a second, stricter production rule. When movement reception is
             explicitly disabled, preserve the legacy direct-publish 0.5 m
             behavior exactly. In both modes the posture still independently
             requires the exact publish key, Squad Stability ownership, the
             original ambush intent, a stationary body and concealment at the
             man's REAL position before any dwell can accrue. */
          return !!(
            body &&
            completed &&
            last &&
            last.owner === 'squad-stability' &&
            last.kind === 'formation' &&
            intent &&
            Math.hypot(intent.x - o.point.x, intent.z - o.point.z) <= 0.05 &&
            C &&
            C.maskedPost(b, body, reports)
          );
        })
        .map(function (o) {
          return o.soldierId;
        });
    }
    function heldCore(b, st, a, reports) {
      var settled = settledActors(b, st, a, reports);
      return !!(
        st.readyAt != null &&
        st.heldActorIds &&
        st.heldActorIds.length >= 3 &&
        st.heldActorIds.every(function (id) {
          return settled.indexOf(id) >= 0;
        })
      );
    }
    function coveredTeam(b, sq, movers, report) {
      var C = root.BattleCoverPositions,
        a = men(sq),
        rs = threats(b, sq),
        support = report && report.fireSupport,
        N = root.BattleNavigation;
      if (
        !maneuverOn ||
        !a ||
        !movers ||
        !movers.length ||
        !C ||
        !C.coveredBoundsOn ||
        !C.coveredBoundsOn() ||
        !C.boundRoute ||
        !C.candidates ||
        !N ||
        N.scenario !==
          (b.scene && b.scene.metadata && (b.scene.metadata.battleScenario || b.scene.metadata.battleTown)) ||
        !rs.length ||
        supportingCount(a, movers, support, b.time) < tuning.minSupport
      )
        return false;
      for (var i = 0; i < movers.length; i++) {
        var s = movers[i];
        if (a.indexOf(s) < 0 || s.moving || s.reloading || s.suppressedUntil > b.time || s.dead) return false;
        var possible = C.candidates(s, b, { root: { position: rs[0] } }, C.boundTuning().maxDistance);
        if (!Array.isArray(possible) || possible.length > 256) return false;
        var eligible = possible.slice(0, 48).some(function (p) {
          var here = s.root.position,
            target = point(p);
          return !!(
            target &&
            Math.hypot(target.x - here.x, target.z - here.z) > 1 &&
            C.boundRoute(s, b, target, rs).eligible
          );
        });
        if (!eligible) return false;
      }
      return true;
    }
    function valid(b, sq, st) {
      var a = men(sq),
        fullRoster = ctx.commanded(sq),
        m = sq._macroMission,
        ex = sq._missionExecution,
        nav = root.BattleNavigation;
      return !!(
        st &&
        a &&
        Number.isFinite(b.time) &&
        b.time >= st.at &&
        b.time - st.at <= tuning.readAge &&
        m === st.mission &&
        m.version === st.version &&
        ex === st.execution &&
        ex.mission === m &&
        m.status === 'executing' &&
        +sq.routeIndex === st.leg &&
        point((sq.route || [])[st.leg]) &&
        sq.route[st.leg].x === st.target.x &&
        sq.route[st.leg].z === st.target.z &&
        sq.route === st.route &&
        b.scene === st.scene &&
        nav &&
        nav.scenario === st.scenario &&
        nav.version === st.navigationVersion &&
        A.leaderOf(sq) === st.leader &&
        st.leader &&
        !st.leader.dead &&
        !ctx.leaderlessActive(sq) &&
        sq.state !== 'retreat' &&
        !L.get(sq, 'regroup') &&
        !L.get(sq, 'recon') &&
        !(ctx.localPlan.structureOrdersOn && ctx.localPlan.currentStructureOrders(b, sq)) &&
        fullRoster.length === st.members.length &&
        fullRoster.every(function (s, i) {
          return s === st.members[i] && epoch(s) === st.epochs[i];
        }) &&
        /* A non-participant may occupy/release his separately owned station.
           The actual ambush actors must remain eligible and uncommitted. */
        st.orders.every(function (o) {
          return a.some(function (s) {
            return String(s.id) === o.soldierId;
          });
        })
      );
    }
    function current(b, sq) {
      if (!on) return null;
      var st = states.get(sq);
      return valid(b, sq, st) ? st : null;
    }
    function invalidReason(b, sq, st) {
      var a = men(sq),
        fullRoster = ctx.commanded(sq),
        m = sq._macroMission,
        ex = sq._missionExecution,
        nav = root.BattleNavigation,
        p = (sq.route || [])[+sq.routeIndex];
      if (!a) return 'too-few-uncommitted-riflemen';
      if (fullRoster.length !== st.members.length || fullRoster.some(function (s, i) {
        return s !== st.members[i] || epoch(s) !== st.epochs[i];
      })) return 'squad-roster-or-possession';
      if (st.orders.some(function (o) {
        return !a.some(function (s) {
          return String(s.id) === o.soldierId;
        });
      })) return 'ambush-actor-reassigned';
      if (m !== st.mission || !m || m.version !== st.version || m.status !== 'executing')
        return 'mission-changed';
      if (ex !== st.execution || !ex || ex.mission !== m) return 'execution-changed';
      if (sq.route !== st.route || +sq.routeIndex !== st.leg || !p ||
          p.x !== st.target.x || p.z !== st.target.z) return 'route-changed';
      if (b.scene !== st.scene || !nav || nav.scenario !== st.scenario ||
          nav.version !== st.navigationVersion) return 'navigation-changed';
      if (A.leaderOf(sq) !== st.leader || !st.leader || st.leader.dead ||
          ctx.leaderlessActive(sq)) return 'leader-changed';
      if (sq.state === 'retreat' || L.get(sq, 'regroup') || L.get(sq, 'recon'))
        return 'override-lease';
      if (ctx.localPlan.structureOrdersOn && ctx.localPlan.currentStructureOrders(b, sq))
        return 'structure-override';
      return 'stale-time-or-authority';
    }
    function end(b, sq, why) {
      var st = states.get(sq);
      if (st) {
        var counts = st.stats;
        if (!counts.releaseReasons) counts.releaseReasons = {};
        counts.releaseReasons[why] = (counts.releaseReasons[why] || 0) + 1;
        ctx.telemetry(b, 'decision-tactical-posture', {
          squad: sq.id,
          faction: sq.faction,
          mode: 'released',
          reason: why,
          serial: st.serial
        });
        cooldown.set(sq, { mission: st.mission, until: b.time + 8 });
      }
      states.delete(sq);
      return null;
    }
    function update(b, sq, report) {
      if (!on || !b || !sq) return null;
      var st = states.get(sq),
        a = men(sq),
        m = sq._macroMission,
        ex = sq._missionExecution,
        C = root.BattleCoverPositions,
        nav = root.BattleNavigation,
        task = sq._localTask,
        pressure = task && task.inputs ? task.inputs.pressure : 1,
        rs = threats(b, sq),
        now = b.time;
      if (st && !valid(b, sq, st)) return end(b, sq, invalidReason(b, sq, st));
      if (
        !a ||
        !m ||
        !ex ||
        ex.mission !== m ||
        m.status !== 'executing' ||
        !A.leaderOf(sq) ||
        A.leaderOf(sq).dead ||
        ctx.leaderlessActive(sq) ||
        sq.state === 'retreat' ||
        L.get(sq, 'recon') ||
        L.get(sq, 'regroup') ||
        !nav ||
        !b.scene ||
        !b.scene.metadata ||
        nav.scenario !== (b.scene.metadata.battleScenario || b.scene.metadata.battleTown) ||
        !C ||
        !point((sq.route || [])[+sq.routeIndex]) ||
        (task && task.inputs.execution && task.inputs.execution.kind === 'structure-handoff') ||
        !rs.length ||
        !Number.isFinite(pressure) ||
        (ctx.localPlan.structureOrdersOn && ctx.localPlan.currentStructureOrders(b, sq))
      )
        return end(b, sq, 'unknown evidence/override');
      if (
        st &&
        st.mode === 'ambush' &&
        (pressure >= tuning.pressureEnter || (report && report.underFire > 0))
      ) {
        /* An already-held masked line may transition to ONE covered-maneuver
           posture, never a second command stream. Without real support and a
           fully covered route, stay put and let Engagement fight defensively. */
        var possible =
          maneuverOn &&
          !(task && task.emergency) &&
          heldCore(b, st, a, rs) &&
          sq.inContact &&
          report &&
          Array.isArray(report.fireSupport) &&
          a.some(function (s) {
            return coveredTeam(b, sq, [s], report);
          });
        st.mode = possible ? 'maneuver' : 'hold';
        st.stage = possible ? 'supporting-fire' : 'pressure-hold';
        st.pressureAt = now;
        st.orders = [];
        if (possible) {
          st.maneuverUntil = now + tuning.maneuverWindow;
          st.lastSupportAt = now;
          st.stats.coveredManeuvers = (st.stats.coveredManeuvers || 0) + 1;
        } else st.stats.pressureHolds++;
        ctx.telemetry(b, 'decision-tactical-posture', {
          squad: sq.id,
          faction: sq.faction,
          mode: st.mode,
          reason: st.stage,
          serial: st.serial
        });
      }
      if (st && st.mode === 'maneuver') {
        st.at = now;
        /* The ordinary commander tick calls the posture before the next
           Engagement report. Do not throw away an active covered maneuver
           in that read-only gap; the subsequent fire-and-movement tick must
           refresh actual support within a bounded observation window. */
        if (report && Array.isArray(report.fireSupport))
          st.lastSupportAt =
            supportingCount(a, null, report.fireSupport, now) >= tuning.minSupport ? now : -Infinity;
        if (
          !sq.inContact ||
          (task && task.emergency) ||
          !maneuverOn ||
          now >= st.maneuverUntil ||
          !isFinite(st.lastSupportAt) ||
          now - st.lastSupportAt > 0.65
        ) {
          st.mode = 'hold';
          st.stage = task && task.emergency ? 'emergency-hold' : 'maneuver-closed';
          st.pressureAt = now;
        } else {
          st.stage = L.holds(sq, 'bound', now) ? 'covered-bound' : 'supporting-fire';
          return st;
        }
      }
      if (st && st.mode === 'hold') {
        st.at = now;
        if (pressure > tuning.pressureExit) st.pressureAt = now;
        return now - st.pressureAt >= tuning.pressureDwell ? end(b, sq, 'pressure subsided') : st;
      }
      if (!st) {
        var cd = cooldown.get(sq);
        if (
          sq.inContact ||
          (sq._engagementPlan && ['active', 'quiet'].indexOf(sq._engagementPlan.status) >= 0) ||
          a.some(function (s) {
            return !!s.target;
          }) ||
          pressure > tuning.pressureExit ||
          (cd && cd.mission === m && now < cd.until)
        )
          return null;
        var orders = [];
        for (var i = 0; i < a.length; i++) {
          var s = a[i],
            here = point(s.root.position),
            candidate = null,
            options = [here].concat(C.candidates(s, b, { root: { position: rs[0] } }, 6).slice(0, 16));
          for (var j = 0; j < options.length; j++) {
            var p = point(options[j]);
            if (
              !p ||
              orders.some(function (o) {
                return Math.hypot(o.point.x - p.x, o.point.z - p.z) < 1.5;
              })
            )
              continue;
            if (C.maskedPost(b, p, rs) && C.maskedApproach(s, b, p, rs)) {
              candidate = p;
              break;
            }
          }
          /* Do not place this soldier at an exposed default slot. A masked
             fireteam is useful even when another eligible squad member has
             no concealed post; that man remains under his existing orders. */
          if (candidate)
            orders.push({ soldierId: String(s.id), point: candidate, watchPoint: point(rs[0]) });
        }
        if (orders.length < 3) return null; // Never publish an understrength ambush element.
        var counts = counters.get(sq) || {
          ambushes: 0,
          pressureHolds: 0,
          coordinatedContacts: 0,
          coveredManeuvers: 0,
          rejectedUnsafeBounds: 0,
          releaseReasons: {}
        };
        counters.set(sq, counts);
        counts.ambushes++;
        st = {
          mode: 'ambush',
          stage: 'assemble',
          serial: counts.ambushes,
          at: now,
          since: now,
          mission: m,
          version: m.version,
          execution: ex,
          leg: +sq.routeIndex,
          route: sq.route,
          target: point(sq.route[+sq.routeIndex]),
          scene: b.scene,
          scenario: nav.scenario,
          navigationVersion: nav.version,
          leader: A.leaderOf(sq),
          /* Preserve the complete commanded roster to detect casualties
             and possession, not temporary station claims by bystanders. */
          members: ctx.commanded(sq).slice(),
          epochs: ctx.commanded(sq).map(epoch),
          orders: orders,
          threats: rs,
          heldSince: null,
          heldActorIds: [],
          readyAt: null,
          stats: counts
        };
        st.orders.forEach(function (o) {
          o.key = 'tactical-posture|' + st.serial + '|' + o.soldierId;
        });
        states.set(sq, st);
        ctx.telemetry(b, 'decision-tactical-posture', {
          squad: sq.id,
          faction: sq.faction,
          mode: st.mode,
          reason: st.stage,
          serial: st.serial
        });
      }
      st.at = now;
      st.threats = rs;
      if (
        !st.orders.every(function (o) {
          return C.maskedPost(b, o.point, rs);
        })
      )
        return end(b, sq, 'firing station lost masking/ray');
      var settled = settledActors(b, st, a, rs),
        coreHeld =
          st.heldActorIds.length >= 3 &&
          st.heldActorIds.every(function (id) {
            return settled.indexOf(id) >= 0;
          });
      if (!coreHeld && st.readyAt != null)
        return end(b, sq, 'prepared fireteam left firing line');
      if (!coreHeld) {
        /* Select three genuinely adopted masked posts ONCE, then measure the
           continuous hold by their stable IDs; newcomers cannot borrow dwell
           from one another. Other men keep trying their ordinary commands. */
        st.heldActorIds = settled.slice(0, 3);
        st.heldSince = st.heldActorIds.length >= 3 ? now : null;
        st.stage = st.heldSince == null ? 'assemble' : 'hold';
        if (st.heldSince == null && now - st.since > tuning.preparationBudget)
          return end(b, sq, 'preparation timed out');
      } else if (st.readyAt == null && now - st.heldSince >= tuning.minimumHold) {
        st.stage = 'ready';
        st.readyAt = now;
      }
      if (
        st.readyAt != null &&
        (sq.inContact ||
          a.some(function (s) {
            return !!s.target;
          }))
      ) {
        if (st.stage !== 'contact') {
          st.stats.coordinatedContacts++;
          st.stage = 'contact';
        }
      } else if (st.stage === 'contact') return end(b, sq, 'contact ended');
      if (st.stage === 'ready' && now - st.readyAt > tuning.observationBudget)
        return end(b, sq, 'no firsthand contact');
      return st;
    }
    function soldierOrder(s, b) {
      var st = s && s.squad && current(b, s.squad);
      if (!st || st.mode !== 'ambush') return null;
      var o = st.orders.find(function (o) {
        return o.soldierId === String(s.id);
      });
      return o && s._fireteamPublishKey === o.key ? Object.assign({ stage: st.stage }, o) : null;
    }
    return {
      on: on,
      maneuverOn: maneuverOn,
      tuning: tuning,
      coveredTeam: coveredTeam,
      update: update,
      current: current,
      soldierOrder: soldierOrder,
      summary: function (sim) {
        if (!on) return null;
        var total = {
          ambushes: 0,
          pressureHolds: 0,
          coordinatedContacts: 0,
          coveredManeuvers: 0,
          rejectedUnsafeBounds: 0,
          active: 0,
          releaseReasons: {}
        };
        ['us', 'ge'].forEach(function (f) {
          ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
            var c = counters.get(sq);
            if (c)
              Object.keys(c).forEach(function (k) {
                if (k === 'releaseReasons') {
                  Object.keys(c[k]).forEach(function (why) {
                    total.releaseReasons[why] = (total.releaseReasons[why] || 0) + c[k][why];
                  });
                } else total[k] += c[k];
              });
            if (current(sim, sq)) total.active++;
          });
        });
        return total;
      },
      reset: function (sq) {
        states.delete(sq);
        cooldown.delete(sq);
        counters.delete(sq);
      }
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
