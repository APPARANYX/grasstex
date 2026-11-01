/* Exclusive-controller flank and assault skill (`?tacticalController=new`; `?controllerAssault=0` turns it
   off). Legacy fire-and-movement (15j) bounded a fireteam straight at the objective and labelled the
   fireteams' flank tasks (16 tasksFor: alpha support-by-fire, bravo flank) without ever moving a team
   round the enemy. This skill is the Squad Leader's decision to do that: one fireteam (15h membership,
   BattleSquadStability.teamKeyFor) leaves the frontal axis while the rest of the squad fixes the enemy
   with fire, and once it has a crossing line of fire it assaults the reported position.

   It does not move anyone. It REUSES the covered-bound skill (13e, execute-covered-bound) with a
   lateral axis: while it is active, 13e takes its goal and its mover team from goal() and every hop
   still goes through Meso's covered window, real support discharge, the contact-route planner and
   personal adoption, exactly as a frontal hop does. The support team is simply not drafted, so the
   contact skills (13d) keep it firing. It writes no destination, stance, fire permission or squad or
   soldier field and adds no timer or RNG draw; its state lives in a WeakMap keyed by the squad.

   Relayed perception only: the enemy position is the Squad Leader's own bound-threat reports
   (BattleCoverPositions.boundThreats), detached coordinates, never a live enemy unit. Retreat, a
   retained Squad Leader skill, a mission change, lost contact, a depleted team or support, a covered
   route that does not exist, or the flank budget ends it with a reason; the frontal bound is then the
   squad's answer again. */
(function (root) {
  'use strict';
  var SEARCH = typeof location !== 'undefined' ? location.search || '' : '',
    ON =
      /[?&]tacticalController=new(?:&|#|$)/i.test(SEARCH) &&
      !/[?&]controllerAssault=(?:0|off|false)(?:&|#|$)/i.test(SEARCH),
    states = new WeakMap(),
    /* Doctrine geometry, not tuning to a result:
       flankAngle  the flank point sits this far round the enemy from the squad's frontal axis, at the
                   range the squad already holds (an oblique, not an encirclement);
       crossAngle  the angle at the enemy between the support line and the team that counts as a
                   crossing line of fire, the point of the manoeuvre;
       closeRange  a team this near the reported position has closed the assault: the frontal skill and
                   the contact drills take over;
       minimumTeam / minimumSupport  two men move, two men shoot (the same base of fire 15j asked for);
       pace        covered progress of a team including the waits for support discharge, which turns the
                   flank's own length into its budget. */
    tuning = {
      flankAngle: Math.PI / 3,
      crossAngle: Math.PI / 4,
      closeRange: 8,
      maximumRange: 160,
      minimumTeam: 2,
      minimumSupport: 2,
      pace: 0.6,
      minimumBudget: 20
    },
    /* 16 tasksFor('flank'): bravo is the flanking team; charlie follows when bravo cannot go. */
    TEAMS = ['bravo', 'charlie'];
  function point(p) {
    return p && Number.isFinite(+p.x) && Number.isFinite(+p.z) ? { x: +p.x, z: +p.z } : null;
  }
  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
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
        phase: 'idle',
        team: null,
        side: 0,
        flankPoint: null,
        contact: null,
        since: 0,
        stallMark: 0,
        budget: 0,
        until: 0,
        reason: null,
        started: 0,
        flanked: 0,
        assaults: 0,
        closed: 0,
        releases: {},
        history: []
      };
      states.set(ctx.squad, st);
    }
    return st;
  }
  function note(sim, st, phase, reason) {
    st.phase = phase;
    st.reason = reason;
    st.history.push({
      at: sim.time,
      phase: phase,
      reason: reason,
      team: st.team,
      side: st.side,
      flankPoint: st.flankPoint,
      contact: st.contact
    });
    if (st.history.length > 12) st.history.shift();
  }
  function men(sq) {
    return (sq.members || []).filter(function (s) {
      return s && !s.dead && !s.isPlayer;
    });
  }
  function able(s) {
    return !!(s && !s.dead && !s.incapacitated && s.hp > 0 && s.weapon && !s.outOfAmmo && s.root);
  }
  function centroid(list) {
    var x = 0,
      z = 0;
    list.forEach(function (s) {
      x += +s.root.position.x;
      z += +s.root.position.z;
    });
    return list.length ? { x: x / list.length, z: z / list.length } : null;
  }
  /* The flanking team (15h membership) and the base of fire left behind. The machine gun is never a mover:
     it is part of the base of fire wherever its team is. */
  function split(sq, team) {
    var Q = root.BattleSquadStability,
      A = root.SquadAI,
      list = men(sq).filter(able),
      movers = list.filter(function (s) {
        return Q.teamKeyFor(s) === team && !A.isMachineGun(s);
      });
    return {
      movers: movers,
      support: list.filter(function (s) {
        return movers.indexOf(s) < 0;
      })
    };
  }
  function pickTeam(sq) {
    for (var i = 0; i < TEAMS.length; i++) {
      var g = split(sq, TEAMS[i]);
      if (g.movers.length >= tuning.minimumTeam && g.support.length >= tuning.minimumSupport)
        return { team: TEAMS[i], movers: g.movers, support: g.support };
    }
    return null;
  }
  function reports(sq, sim) {
    var A = root.SquadAI,
      C = root.BattleCoverPositions,
      leader = A && A.leaderOf(sq);
    return leader && C && C.boundThreats ? C.boundThreats(leader, sim) : [];
  }
  function retained(sq, sim) {
    var Q = root.BattleSquadStability;
    return (
      sq.state === 'retreat' ||
      sq.commandPhase === 'retreat' ||
      !!(Q && ((Q.retainedSkill && Q.retainedSkill(sq, sim)) || (Q.defensivePhase && Q.defensivePhase(sq))))
    );
  }
  /* An attack: the brief is an assault or a flank, and the squad is still closing on it. Capture, clearing a
     town and defence are inside the objective, where the frontal skill keeps its own rules. */
  function attacking(sq) {
    var m = sq._macroMission;
    return !!(
      m &&
      m.status === 'executing' &&
      (m.action === 'assault' || m.action === 'flank') &&
      (sq.commandPhase === 'approach' || sq.commandPhase === 'assault' || sq.commandPhase === 'flank')
    );
  }
  function stallOf(sq) {
    var M = root.BattleTacticalCoveredManeuver,
      row = M && M.summary(sq);
    return (row && row.stall) || null;
  }
  /* A no-hop stall the covered-bound skill reported since this phase began (a frontal stall from before the
     flank is not the flank's: only a new stall, or a further refused search, counts). */
  function stalled(sq, st) {
    var s = stallOf(sq);
    return !!(s && (s.since >= st.since || s.retries > st.stallMark));
  }
  function mark(sq, st, now) {
    var s = stallOf(sq);
    st.since = now;
    st.stallMark = s ? s.retries : 0;
  }
  /* The flank point: round the reported enemy by flankAngle on the team's own side of the frontal axis, at
     the range the squad holds now. A team already on the axis goes to the right (bravo's formation side). */
  function flankGeometry(sq, contact, team) {
    var all = men(sq).filter(able),
      here = centroid(all),
      teamAt = centroid(team.movers);
    if (!here || !teamAt) return null;
    var range = dist(here, contact);
    var R = root.BattleTacticalContactRoute,
      hop = (R && R.tuning && R.tuning.maxHop) || 26;
    /* Within one covered hop the assault goes straight in; beyond effective range there is nothing to fix. */
    if (range <= hop) return { reason: 'contact-within-one-hop' };
    if (range > tuning.maximumRange) return { reason: 'contact-beyond-assault-range' };
    var bx = (here.x - contact.x) / range,
      bz = (here.z - contact.z) / range,
      cross = bx * (teamAt.z - contact.z) - bz * (teamAt.x - contact.x),
      side = cross > 0.5 ? 1 : cross < -0.5 ? -1 : 1,
      a = side * tuning.flankAngle,
      c = Math.cos(a),
      s = Math.sin(a);
    return {
      side: side,
      range: range,
      point: { x: contact.x + (bx * c - bz * s) * range, z: contact.z + (bx * s + bz * c) * range }
    };
  }
  /* The angle at the enemy between the base of fire and the flanking team. */
  function crossing(contact, support, movers) {
    var s = centroid(support),
      m = centroid(movers);
    if (!s || !m) return 0;
    var ax = s.x - contact.x,
      az = s.z - contact.z,
      bx = m.x - contact.x,
      bz = m.z - contact.z,
      l = Math.hypot(ax, az) * Math.hypot(bx, bz);
    return l > 1e-6 ? Math.acos(Math.max(-1, Math.min(1, (ax * bx + az * bz) / l))) : 0;
  }
  function end(sim, st, why) {
    st.releases[why] = (st.releases[why] || 0) + 1;
    note(sim, st, 'idle', why);
    st.team = null;
    st.flankPoint = null;
    st.contact = null;
    /* The covered-bound skill searches again once per Squad Leader bound cycle; so does the flank. */
    var Q = root.BattleSquadStability;
    st.until = sim.time + ((Q && Q.tuning && Q.tuning.boundCycle) || 7);
  }
  function update(ctx) {
    if (!ON) return;
    var sq = ctx.squad,
      sim = ctx.sim,
      st = state(ctx),
      now = sim.time;
    if (st.phase === 'idle') {
      if (now < st.until || !sq.inContact || retained(sq, sim) || !attacking(sq)) return;
      var rs = reports(sq, sim),
        contact = rs.length && point(rs[0]);
      if (!contact) return;
      var team = pickTeam(sq);
      if (!team) {
        st.reason = 'no-team-and-base-of-fire';
        st.until = now + ((root.BattleSquadStability.tuning || {}).boundCycle || 7);
        return;
      }
      var g = flankGeometry(sq, contact, team);
      if (!g || !g.point) {
        st.reason = (g && g.reason) || 'no-geometry';
        st.until = now + ((root.BattleSquadStability.tuning || {}).boundCycle || 7);
        return;
      }
      st.team = team.team;
      st.side = g.side;
      st.flankPoint = g.point;
      st.contact = contact;
      mark(sq, st, now);
      st.budget = Math.max(tuning.minimumBudget, dist(centroid(team.movers), g.point) / tuning.pace);
      st.started++;
      note(sim, st, 'flank', 'fix-and-flank:' + team.team);
      return;
    }
    if (retained(sq, sim)) return end(sim, st, 'retained-skill');
    if (!attacking(sq)) return end(sim, st, 'mission-changed');
    if (!sq.inContact)
      return end(sim, st, st.phase === 'assault' ? 'assault-contact-ended' : 'contact-ended');
    var g2 = split(sq, st.team);
    if (g2.movers.length < tuning.minimumTeam) return end(sim, st, 'team-depleted');
    if (g2.support.length < tuning.minimumSupport) return end(sim, st, 'base-of-fire-lost');
    var rs2 = reports(sq, sim),
      fresh = rs2.length && point(rs2[0]);
    if (fresh) st.contact = fresh; // the latest relayed report, never a live enemy
    /* The covered-bound skill found no covered hop for the team toward this goal: there is no flank route. */
    if (stalled(sq, st))
      return end(sim, st, st.phase === 'assault' ? 'no-covered-assault-route' : 'no-covered-flank-route');
    if (st.phase === 'flank') {
      if (
        crossing(st.contact, g2.support, g2.movers) >= tuning.crossAngle ||
        dist(centroid(g2.movers), st.flankPoint) <= tuning.closeRange
      ) {
        st.flanked++;
        st.assaults++;
        mark(sq, st, now);
        st.budget = Math.max(tuning.minimumBudget, dist(centroid(g2.movers), st.contact) / tuning.pace);
        return note(sim, st, 'assault', 'crossing-fire:' + st.team);
      }
      if (now - st.since > st.budget) return end(sim, st, 'flank-budget');
      return;
    }
    if (dist(centroid(g2.movers), st.contact) <= tuning.closeRange) {
      st.closed++;
      return end(sim, st, 'assault-closed');
    }
    if (now - st.since > st.budget) return end(sim, st, 'assault-budget');
  }
  /* What the covered-bound skill asks while it chooses movers: the goal it hops toward and the only team it
     may draft. null when no flank or assault is running, and then 13e is exactly the frontal skill. */
  function goal(sq) {
    var st = ON && sq && states.get(sq);
    if (!st || st.phase === 'idle' || !st.team) return null;
    return {
      phase: st.phase,
      team: st.team,
      point: st.phase === 'flank' ? st.flankPoint : st.contact
    };
  }
  root.BattleTacticalFlankAssault = {
    on: ON,
    tuning: tuning,
    update: update,
    goal: goal,
    /* For 13e's refusal memory: a new phase or goal is a new basis. */
    basis: function (sq) {
      var g = goal(sq);
      return g ? [g.phase, g.team, Math.round(g.point.x), Math.round(g.point.z)] : null;
    },
    summary: function (sq) {
      var st = states.get(sq);
      return (
        st && {
          phase: st.phase,
          reason: st.reason,
          team: st.team,
          side: st.side,
          flankPoint: st.flankPoint,
          contact: st.contact,
          since: st.since,
          budget: st.budget,
          started: st.started,
          flanked: st.flanked,
          assaults: st.assaults,
          closed: st.closed,
          releases: Object.assign({}, st.releases),
          history: st.history.slice()
        }
      );
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
