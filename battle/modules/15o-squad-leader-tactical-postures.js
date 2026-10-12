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
        readAge: 0.5
      };
    function point(p) {
      return p && Number.isFinite(p.x) && Number.isFinite(p.z) ? { x: p.x, z: p.z } : null;
    }
    function epoch(s) {
      return +(s.eng && s.eng.possessionEpoch) || 0;
    }
    function men(sq) {
      var a = ctx.commanded(sq);
      return a.length >= 3 &&
        a.length <= 32 &&
        a.every(function (s) {
          return (
            s.root &&
            point(s.root.position) &&
            !s.incapacitated &&
            !s.isPlayer &&
            s.hp > 0 &&
            !(root.BattleTacticalPositions && root.BattleTacticalPositions.current(s))
          );
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
    function valid(b, sq, st) {
      var a = men(sq),
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
        a.length === st.members.length &&
        a.every(function (s, i) {
          return s === st.members[i] && epoch(s) === st.epochs[i];
        })
      );
    }
    function current(b, sq) {
      if (!on) return null;
      var st = states.get(sq);
      return valid(b, sq, st) ? st : null;
    }
    function end(b, sq, why) {
      var st = states.get(sq);
      if (st) {
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
      if (st && !valid(b, sq, st)) return end(b, sq, 'identity/authority lost');
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
      if (st && (pressure >= tuning.pressureEnter || (report && report.underFire > 0))) {
        if (st.mode !== 'hold') {
          st.mode = 'hold';
          st.stage = 'pressure-hold';
          st.pressureAt = now;
          // No new exposed displacement. Native Engagement owns emergency cover/fire.
          st.orders = [];
          st.stats.pressureHolds++;
          ctx.telemetry(b, 'decision-tactical-posture', {
            squad: sq.id,
            faction: sq.faction,
            mode: st.mode,
            reason: st.stage,
            serial: st.serial
          });
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
          if (!candidate) return null; // Do not put the remainder at unsafe default slots.
          orders.push({ soldierId: String(s.id), point: candidate, watchPoint: point(rs[0]) });
        }
        var counts = counters.get(sq) || { ambushes: 0, pressureHolds: 0, coordinatedContacts: 0 };
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
          members: a.slice(),
          epochs: a.map(epoch),
          orders: orders,
          threats: rs,
          heldSince: null,
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
      var settled = st.orders.every(function (o, i) {
        var s = a[i],
          p = s.root.position;
        return (
          s._fireteamPublishKey === o.key && !s.moving && Math.hypot(p.x - o.point.x, p.z - o.point.z) <= 0.5
        );
      });
      if (!settled && st.stage !== 'contact') {
        st.heldSince = null;
        st.stage = 'assemble';
        if (now - st.since > tuning.preparationBudget) return end(b, sq, 'preparation timed out');
      } else if (st.stage === 'assemble' || st.stage === 'hold') {
        if (st.heldSince == null) st.heldSince = now;
        st.stage = 'hold';
        if (now - st.heldSince >= tuning.minimumHold) {
          st.stage = 'ready';
          st.readyAt = now;
        }
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
      tuning: tuning,
      update: update,
      current: current,
      soldierOrder: soldierOrder,
      summary: function (sim) {
        if (!on) return null;
        var total = { ambushes: 0, pressureHolds: 0, coordinatedContacts: 0, active: 0 };
        ['us', 'ge'].forEach(function (f) {
          ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
            var c = counters.get(sq);
            if (c)
              Object.keys(c).forEach(function (k) {
                total[k] += c[k];
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
