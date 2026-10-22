/* Opt-in, read-only reactive fire-and-maneuver policy.
   The Squad Leader remains the sole bound lease writer and native Engagement
   chooses cover and fires; Movement Resolver alone moves the soldiers.
   This is NOT a deliberate ambush and never creates contact or firing receipts. */
(function (root) {
  'use strict';
  var query = (root.location && root.location.search) || '';
  var on =
    /[?&]reactiveFireManeuver=(?:1|on|true)(?:&|#|$)/i.test(query) &&
    /[?&]localPlan=(?:1|on|true)(?:&|#|$)/i.test(query) &&
    /[?&]coveredBounds=(?:1|on|true)(?:&|#|$)/i.test(query);
  /* A firing-position lease outlives its mover's own bound window by this much: adoption waits for
     his next update and the receipt for the leader's next tick. */
  var RECEIPT_SLACK = 1;
  function canTask(sq, inputs) {
    return taskReason(sq, inputs) === 'eligible';
  }
  function taskReason(sq, inputs) {
    if (!on) return 'disabled';
    if (!sq || sq.state === 'retreat') return 'retreat';
    if (['assault', 'capture', 'clear-town'].indexOf(sq.commandPhase) < 0) return 'mission-phase';
    if (!sq._macroMission || sq._macroMission.status !== 'executing') return 'mission-authority';
    if (!inputs || !inputs.contact || !(inputs.confidence >= 0.5)) return 'credible-contact';
    if (inputs.dispersed) return 'cohesion';
    if (!Number.isFinite(inputs.pressure) || inputs.pressure >= 0.75) return 'pressure';
    if (!(inputs.supporting >= 2)) return 'support-capability';
    var resources = inputs.resources;
    if (resources && (resources.status === 'over-budget' || !resources.moverIds.length))
      return 'moving-element';
    return 'eligible';
  }
  /* Engagement supplies this list; validate recent DISTINCT real shots and
     current live firing ability. Being armed or merely facing the enemy is not
     proof that suppression has started. */
  function supporters(battle, sq, report, movers) {
    var A = root.SquadAI,
      E = root.BattleEngagement,
      list = report && report.fireSupport;
    if (!on || !battle || !sq || !A || !A.shotReceipt || !E || !E.supportReady || !Array.isArray(list))
      return [];
    return list.filter(function (s, i) {
      var shot = s && A.shotReceipt(s, battle);
      return (
        s &&
        list.indexOf(s) === i &&
        sq.members.indexOf(s) >= 0 &&
        (!movers || movers.indexOf(s) < 0) &&
        !s.dead &&
        !s.isPlayer &&
        E.supportReady(s, battle) &&
        shot &&
        Number.isFinite(shot.at) &&
        battle.time >= shot.at &&
        battle.time - shot.at <= 5
      );
    });
  }
  /* A base of fire is not a whole-squad position acknowledgement. Read each
     current body: everyone capable must finish individual cover ingress or
     settle prone before a team leaves. Never command posture/movement here. */
  function defensiveReadiness(battle, sq, committedMovers) {
    var E = root.BattleEngagement,
      F = root.BattleObstacleField,
      C = root.BattleCoverPositions,
      members = (sq && sq.members) || [],
      pending = [],
      count = 0;
    members.forEach(function (s) {
      if (!s || s.dead || s.hp <= 0 || s.incapacitated) return;
      // During adoption, peers on THIS already-authorized lease may be moving.
      if (committedMovers && committedMovers.indexOf(s) >= 0) return;
      count++;
      var e = s.eng,
        p = s.root && s.root.position,
        reason = null;
      if (!e || ['orient', 'engage', 'alert', 'pinned', 'station'].indexOf(e.state) < 0)
        reason = 'positioning';
      else if (s.moving || s.crawling) reason = 'moving';
      else if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.z) || !E || !F) reason = 'unknown-position';
      else if (!s.prone) {
        // Native arrival has a positional tolerance. A live occupied slot is
        // still cover when the broad field sample just outside it is weaker.
        var occupied = C && C.occupied && C.occupied(s, battle);
        if (!occupied && !(F.coverPotentialAt(battle.obstacles, p.x, p.z) <= E.tuning.USEFUL_COVER))
          reason = 'exposed';
      }
      if (reason) pending.push({ id: s.id, reason: reason });
    });
    return {
      ready: count > 0 && !pending.length,
      members: count,
      settled: count - pending.length,
      pending: pending
    };
  }
  function firingTaskReason(sq, inputs) {
    if (!on) return 'disabled';
    if (!sq || sq.state === 'retreat') return 'retreat';
    if (['setup', 'regroup', 'reserve'].indexOf(sq.commandPhase) >= 0) return 'mission-phase';
    if (!sq._macroMission || sq._macroMission.status !== 'executing') return 'mission-authority';
    if (!inputs || !inputs.contact || !(inputs.confidence >= 0.5)) return 'credible-contact';
    if (inputs.dispersed) return 'cohesion';
    if (!Number.isFinite(inputs.pressure) || inputs.pressure >= 0.75) return 'pressure';
    if (inputs.resources && inputs.resources.status === 'over-budget') return 'moving-element';
    return 'eligible';
  }
  function firingThreat(s, battle) {
    var c = root.SquadAI.soldierContact(s, battle);
    if (
      !c ||
      c.source === 'heard' ||
      !Number.isFinite(c.x) ||
      !Number.isFinite(c.z) ||
      !Number.isFinite(c.at) ||
      battle.time < c.at ||
      battle.time - c.at > 10 ||
      !(c.confidence >= 0.5)
    )
      return null;
    return { root: { position: { x: c.x, y: battle.heightAt(c.x, c.z), z: c.z } } };
  }
  function firingLineAt(s, battle, point) {
    var target = firingThreat(s, battle),
      E = root.BattleEngagement;
    if (
      !target ||
      Math.hypot(point.x - target.root.position.x, point.z - target.root.position.z) >
        root.SquadAI.engageRange(s)
    )
      return false;
    return ['prone', 'crouch', 'stand'].some(function (stance) {
      return E.firingLineClear(s, target, point, stance, battle);
    });
  }
  /* Read-only local firing-line setup, not an objective advance. Meso commits
     one non-shooter at a time; native Engagement reselects/reserves this slot. */
  function firingPositionPlan(battle, sq, report) {
    var task = sq && sq._localTask,
      C = root.BattleCoverPositions,
      E = root.BattleEngagement,
      result = { pending: false, reason: 'not-ready', soldier: null, point: null };
    if (
      !task ||
      ['support', 'maneuver'].indexOf(task.kind) < 0 ||
      firingTaskReason(sq, task.inputs) !== 'eligible' ||
      !defensiveReadiness(battle, sq).ready ||
      supporters(battle, sq, report, []).length < 2 ||
      !C ||
      !C.coveredBoundsOn()
    )
      return result;
    var men = sq.members || [];
    for (var i = 0; i < men.length; i++) {
      var s = men[i];
      if (
        !s ||
        s.dead ||
        s.hp <= 0 ||
        s.incapacitated ||
        s.isPlayer ||
        root.SquadAI.isMachineGun(s) ||
        s.moving ||
        s.crawling ||
        s.reloading ||
        s.clearingStoppage ||
        s.outOfAmmo ||
        !s.weapon ||
        s.suppressedUntil > battle.time ||
        E.reacting(s) ||
        (root.BattleTacticalPositions && root.BattleTacticalPositions.current(s)) ||
        (task.inputs.resources && task.inputs.resources.moverIds.indexOf(String(s.id)) < 0) ||
        !firingThreat(s, battle) ||
        firingLineAt(s, battle, s.root.position)
      )
        continue;
      result.pending = true;
      if (supporters(battle, sq, report, [s]).length < 2) continue;
      var threats = C.boundThreats(s, battle),
        target = firingThreat(s, battle);
      if (!threats.length) continue;
      var candidates = C.candidates(s, battle, target, C.boundTuning().maxDistance);
      if (!Array.isArray(candidates) || candidates.length > 256) continue;
      for (var j = 0; j < Math.min(48, candidates.length); j++) {
        var p = candidates[j];
        if (!firingLineAt(s, battle, p) || !C.boundRoute(s, battle, p, threats, 'reactive').eligible)
          continue;
        if (!result.point || p.distance < result.point.distance) {
          result.soldier = s;
          result.point = {
            x: p.x,
            z: p.z,
            slotId: p.slotId,
            distance: p.distance,
            window: E.boundWindow(s, p.distance) + RECEIPT_SLACK
          };
        }
      }
    }
    result.reason = result.point
      ? 'firing-position'
      : result.pending
        ? 'no-safe-firing-position'
        : 'lines-ready';
    return result;
  }
  /* The executor's receipt for a leased firing-position move; a casualty also ends it. Any
     other abandonment is left to the lease window. Read-only: the Squad Leader ends the lease. */
  function firingPositionReceipt(battle, sq, lease) {
    var data = lease && lease.data;
    if (!data || !data.firingPosition) return null;
    var id = data.moverIds && data.moverIds[0],
      man = (sq.members || []).filter(function (s) {
        return String(s.id) === id;
      })[0];
    if (!man || man.dead || man.hp <= 0 || man.incapacitated)
      return { outcome: 'failed', reason: 'casualty', at: battle.time, soldier: man ? man.id : id };
    var receipt = root.BattleEngagement.positionReceipt(man);
    if (!receipt || receipt.at < lease.since || (data.point && receipt.slotId !== data.point.slotId))
      return null;
    receipt.soldier = man.id;
    return receipt;
  }
  /* Which step of contact, cover, support, firing positions, advance a squad is in, from the
     same gates the Squad Leader consults. Derived for diagnostics; never an authority or a gate. */
  function squadStage(battle, sq, report) {
    var L = root.BattleLeases,
      task = sq && sq._localTask;
    report = report || { fireSupport: (sq && sq.members) || [] };
    if (!on || !sq || !sq.inContact) return { stage: 'no-contact', reason: on ? 'no-contact' : 'disabled' };
    if (!task) return { stage: 'gated', reason: 'no-local-task' };
    var gate = firingTaskReason(sq, task.inputs);
    if (gate !== 'eligible' || ['support', 'maneuver'].indexOf(task.kind) < 0)
      return { stage: 'gated', reason: (gate === 'eligible' ? 'task' : gate) + ':' + task.kind };
    // The man walking to his slot is, by definition, not settled: the step comes first.
    var lease = L.get(sq, 'bound');
    if (lease && lease.data && lease.data.firingPosition && L.holds(sq, 'bound', battle.time))
      return { stage: 'positions', reason: 'assigned' };
    var readiness = defensiveReadiness(battle, sq);
    if (!readiness.ready)
      return { stage: 'cover', reason: 'squad-not-settled', pending: readiness.pending.length };
    if (supporters(battle, sq, report, []).length < 2)
      return { stage: 'support', reason: 'no-effective-support' };
    var plan = firingPositionPlan(battle, sq, report);
    if (plan.soldier) return { stage: 'positions', reason: 'assignable' };
    if (L.holds(sq, 'bound', battle.time)) return { stage: 'advance', reason: 'bound-active' };
    return { stage: 'advance', reason: plan.pending ? 'no-safe-firing-position' : 'ready' };
  }
  function canBoundTeam(battle, sq, movers, report) {
    return assessTeam(battle, sq, movers, report).eligible;
  }
  function assessTeam(battle, sq, movers, report) {
    var C = root.BattleCoverPositions,
      N = root.BattleNavigation;
    if (
      !on ||
      !N ||
      N.scenario !==
        (battle.scene &&
          battle.scene.metadata &&
          (battle.scene.metadata.battleScenario || battle.scene.metadata.battleTown)) ||
      !C ||
      !C.coveredBoundsOn ||
      !C.coveredBoundsOn() ||
      !C.boundThreats ||
      !C.boundRoute ||
      !C.candidates ||
      !Array.isArray(movers) ||
      !movers.length ||
      supporters(battle, sq, report, movers).length < 2
    )
      return { eligible: false, reason: 'no-independent-support-or-geometry' };
    if (!defensiveReadiness(battle, sq).ready) return { eligible: false, reason: 'squad-not-settled' };
    var reason = 'no-usable-cover';
    var eligible = movers.every(function (s) {
      if (
        !s ||
        sq.members.indexOf(s) < 0 ||
        s.dead ||
        s.isPlayer ||
        s.moving ||
        s.suppressedUntil > battle.time ||
        s.reloading ||
        s.clearingStoppage ||
        s.outOfAmmo
      ) {
        reason = 'mover-unavailable';
        return false;
      }
      var threats = C.boundThreats(s, battle);
      if (!threats.length) {
        reason = 'unknown-contact';
        return false;
      }
      var possibilities = C.candidates(
        s,
        battle,
        { root: { position: threats[0] } },
        C.boundTuning().maxDistance
      );
      return (
        Array.isArray(possibilities) &&
        possibilities.length <= 256 &&
        possibilities.slice(0, 48).some(function (p) {
          var route = C.boundRoute(s, battle, p, threats, 'reactive');
          reason = route.reason;
          return route.eligible;
        })
      );
    });
    return { eligible: eligible, reason: eligible ? 'covered-team' : reason };
  }
  function adoptionAllowed(s, battle, lease) {
    var sq = s.squad,
      task = sq && sq._localTask,
      data = lease && lease.data;
    if (
      !data ||
      !data.reactiveFireManeuver ||
      !Array.isArray(data.moverIds) ||
      battle.time < lease.since ||
      battle.time >= lease.until ||
      !task ||
      (data.firingPosition ? ['support', 'maneuver'].indexOf(task.kind) < 0 : task.kind !== 'maneuver') ||
      task.missionVersion !== data.missionVersion ||
      task.serial !== data.localTaskSerial ||
      !sq._macroMission ||
      sq._macroMission.version !== data.missionVersion ||
      (data.firingPosition ? firingTaskReason(sq, task.inputs) !== 'eligible' : !canTask(sq, task.inputs))
    )
      return false;
    var movers = sq.members.filter(function (man) {
      return data.moverIds.indexOf(String(man.id)) >= 0;
    });
    return (
      movers.indexOf(s) >= 0 &&
      defensiveReadiness(battle, sq, movers).ready &&
      supporters(battle, sq, { fireSupport: sq.members }, movers).length >= 2
    );
  }
  root.BattleReactiveFireManeuver = Object.freeze({
    on: on,
    canTask: canTask,
    taskReason: taskReason,
    supporters: supporters,
    defensiveReadiness: defensiveReadiness,
    firingPositionPlan: firingPositionPlan,
    firingPositionReceipt: firingPositionReceipt,
    squadStage: squadStage,
    firingTaskReason: firingTaskReason,
    firingLineAt: firingLineAt,
    canBoundTeam: canBoundTeam,
    assessTeam: assessTeam,
    adoptionAllowed: adoptionAllowed
  });
})(typeof window !== 'undefined' ? window : globalThis);
