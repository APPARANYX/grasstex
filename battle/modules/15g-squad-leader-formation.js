/* Squad Leader formation sub-module (extracted from 16-squad-plan-stability.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.
   The advance geometry (commandForward, forwardMajority, publishForwardLine), the fireteam
   slot layout (TEAM_OFFSETS, teamFrame, desiredAnchor, forward, teamSlot), the spawn
   placement (spawnForward, placeAtSlots, placeForce, SPAWN_SCATTER_KEPT) and the team
   follow-forward correction (followTeamForward) are here. The parent file calls the factory
   with its closure utilities and re-attaches the returned functions as closure variables,
   so all callers (cohesion, the anchor advance, fireteam publishing, the public API export)
   see the same functions as before. The FOLLOW_LAG constant stays in 16 (exported tuning
   lives in BattleSquadStability) and is passed into the factory via ctx. */
(function (root) {
  'use strict';
  if (root._squadLeaderFormation) return;

  /* Factory: called by 16-squad-plan-stability.js after its shared utilities and the
     buddy-pairs re-attach (aliveTeam) are in scope. teamKeyFor and alive are hoisted
     function declarations in the parent closure. */
  root._squadLeaderFormation = function (ctx) {
    var root = ctx.root,
      L = ctx.root.BattleLeases,
      alive = ctx.alive,
      teamKeyFor = ctx.teamKeyFor,
      aliveTeam = ctx.aliveTeam,
      FOLLOW_LAG = ctx.FOLLOW_LAG;
  function commandForward(sq) {
    var a = sq.orderAnchor || sq.rally || { x: 0, z: 0 },
      g = sq.objective || sq.home || a,
      dx = (+g.x || 0) - (+a.x || 0),
      dz = (+g.z || 0) - (+a.z || 0),
      l = Math.hypot(dx, dz);
    if (l < 0.1) {
      /* A regroup points sq.objective at its own anchor, so the objective axis collapses; the regroup
         keeps the direction the squad was marching when it opened. `_formationForward` is only set
         by SquadAI.formationSlot (men with no order destination), so it is usually absent. */
      var rg = L.get(sq, 'regroup'),
        f =
          (rg && rg.data && rg.data.forward) ||
          (sq._forwardLine && sq._forwardLine.axis) ||
          sq._formationForward,
        fl = f ? Math.hypot(+f.x || 0, +f.z || 0) : 0;
      if (fl > 1e-6) return { x: (+f.x || 0) / fl, z: (+f.z || 0) / fl };
    }
    return { x: dx / (l || 1), z: dz / (l || 1) };
  }
  /* The forward line: where the forward majority of a group of men actually is along the advance
     axis, not their average. Each man is projected on the axis; the front-most half (rounded up) is
     the forward group, and any man within COVER_BAND behind the rearmost of them joins it, since men
     taking different cover along one line stand a few metres apart in depth. The line sits at the
     group's mean, so stragglers behind cannot drag it back and one man out front cannot pull it all
     the way forward: two men up front, one just behind them and two far back put it between the
     front pair and the middle man, two thirds of the way to the front. {at: distance along the axis
     (position . axis), point: the group's mean position, men, of}. */
  var COVER_BAND = 5;
  function forwardMajority(men, axis) {
    var rows = [],
      i;
    for (i = 0; i < men.length; i++) {
      var p = men[i].root.position,
        x = +p.x || 0,
        z = +p.z || 0;
      rows.push({ at: x * axis.x + z * axis.z, x: x, z: z, id: +men[i].id || 0 });
    }
    if (!rows.length) return null;
    rows.sort(function (a, b) {
      return b.at - a.at || a.id - b.id;
    });
    var k = Math.ceil(rows.length / 2),
      floor = rows[k - 1].at - COVER_BAND;
    while (k < rows.length && rows[k].at >= floor) k++;
    var at = 0,
      mx = 0,
      mz = 0;
    for (i = 0; i < k; i++) {
      at += rows[i].at;
      mx += rows[i].x;
      mz += rows[i].z;
    }
    return { at: at / k, point: { x: mx / k, z: mz / k }, men: k, of: rows.length };
  }
  /* Published each command tick for the squad and each fireteam (sq._forwardLine); cleared in retreat,
     where backward is the order. The regroup rally point is the squad's forward-majority point. */
  function publishForwardLine(sq, battle) {
    var men = alive(sq);
    if (sq.state === 'retreat' || !men.length) {
      sq._forwardLine = null;
      return;
    }
    var axis = commandForward(sq),
      line = forwardMajority(men, axis);
    if (!line) {
      sq._forwardLine = null;
      return;
    }
    var groups = {},
      i;
    for (i = 0; i < men.length; i++) {
      var key = men[i]._fireteamKey || teamKeyFor(men[i]);
      (groups[key] = groups[key] || []).push(men[i]);
    }
    line.axis = { x: axis.x, z: axis.z };
    line.band = COVER_BAND;
    line.t = battle ? battle.time : 0;
    line.teams = {};
    Object.keys(groups)
      .sort()
      .forEach(function (key) {
        line.teams[key] = forwardMajority(groups[key], axis);
      });
    sq._forwardLine = line;
  }

  /* Each fireteam holds its own ground: [lateral, forward] metres from the order anchor in the squad's
   frame. Team anchors used to be the average of the men's individual formation slots, but those
   alternate sides by slotIndex while fireteam membership is also dealt by slotIndex, so every team
   averaged to the middle (alpha and bravo 1.2 m apart in line) and the teams walked through each
   other: three quarters of formation-on-formation body contacts were between different teams. */
  var TEAM_OFFSETS = {
    line: { command: [0, -3], alpha: [-8, 0], bravo: [8, 0], charlie: [0, -9] },
    wedge: { command: [0, -2], alpha: [-7, 2], bravo: [7, 2], charlie: [0, -9] },
    column: { command: [0, 0], alpha: [0, 7], bravo: [0, -6], charlie: [0, -12] }
  };
  function teamFrame(sq) {
    var a = sq.orderAnchor || sq.rally || { x: 0, z: 0 },
      g = sq.state === 'retreat' ? root.SquadAI.retreatGoal(sq) : sq.objective || sq.home || a,
      dx = (+g.x || 0) - (+a.x || 0),
      dz = (+g.z || 0) - (+a.z || 0),
      l = Math.hypot(dx, dz);
    return l < 0.1 ? commandForward(sq) : { x: dx / l, z: dz / l };
  }
  function desiredAnchor(sq, key, formation) {
    var a = sq.orderAnchor || sq.rally;
    if (!a) return null;
    if (root.SquadAI.isReconstitutionMarch && root.SquadAI.isReconstitutionMarch(sq))
      return { x: a.x, z: a.z };
    var form = TEAM_OFFSETS[formation || sq.formation || root.SquadAI.formationFor(sq)] || TEAM_OFFSETS.wedge,
      o = form[key] || [0, 0],
      f = teamFrame(sq),
      r = { x: -f.z, z: f.x };
    return { x: a.x + r.x * o[0] + f.x * o[1], z: a.z + r.z * o[0] + f.z * o[1] };
  }

  function forward(sq) {
    return commandForward(sq);
  }
  function teamSlot(sq, key, s, index, count, a, frame) {
    var f = frame || forward(sq),
      r = { x: -f.z, z: f.x },
      lat = 0,
      fw = 0;
    if (count === 2) {
      lat = index ? -1.45 : 1.45;
      fw = index ? -0.45 : 0.45;
    } else if (count >= 3) {
      if (index === 0) fw = 1.15;
      else if (index === 1) {
        lat = -1.7;
        fw = -0.85;
      } else {
        lat = 1.7;
        fw = -0.85;
      }
    }
    if (key === 'command' && root.SquadAI.isLeader(s)) {
      lat = 0;
      fw = 0.5;
    }
    return { x: a.x + r.x * lat + f.x * fw, z: a.z + r.z * lat + f.z * fw };
  }
  /* Men start on their fireteam slots. They used to appear scattered up to 4 m around the lane point
   with no regard for their team, so the first order sent them across each other's teams to reach
   their slots: about half of all cross-team body crossings happened in the first minute. This runs
   once when a squad enters the battle, after Force Command has given it its objective, so the first
   order is the ground each man already stands on. What is left of the spawn scatter (a tenth) keeps
   the men from standing on exact geometric points. A defending garrison is module 21's to place: it
   hands out prepared posts nearest-first by where each man stands, so moving him first would only
   reshuffle that (in the defend battles it doubled the defenders' first-minute crossings). */
  var SPAWN_SCATTER_KEPT = 0.1;
  /* Before its first brief (Force Command's first tick, 0.45 s in) a squad's objective is its own
     home, so its axis collapses and every fireteam slot falls on the anchor. Until the brief turns it,
     the squad faces the battle: the scenario centre (where spawn pointed it), else the enemy's side. */
  function spawnForward(sim, sq, home) {
    var sc =
        sim.scene &&
        sim.scene.metadata &&
        (sim.scene.metadata.battleScenario || sim.scene.metadata.battleTown),
      c = (sc && sc.center) || { x: home.x, z: 0 },
      dx = (+c.x || 0) - home.x,
      dz = (+c.z || 0) - home.z,
      l = Math.hypot(dx, dz);
    if (l > 1) return { x: dx / l, z: dz / l };
    return { x: 0, z: sq.faction === 'ge' ? -1 : 1 };
  }
  function placeAtSlots(sim, sq) {
    var home = sq.orderAnchor || sq.rally || sq.home,
      DW = root.BattleDefenseWorks;
    if (!home || !sim || (DW && DW.garrisons && DW.garrisons(sim, sq))) return;
    var f = forward(sq);
    if (Math.hypot(f.x, f.z) < 0.5) f = sq._formationForward = spawnForward(sim, sq, home);
    /* The formation the Squad Leader adopts on his first tick (advanceSquadAnchor), not the
       squad's default from createSquad: a wedge laid out and marched as a line moves every team. */
    var form = root.SquadAI.formationFor(sq);
    ['command', 'alpha', 'bravo', 'charlie'].forEach(function (key) {
      var m = aliveTeam(sq, key),
        a = desiredAnchor(sq, key, form);
      if (!a) return;
      for (var i = 0; i < m.length; i++) {
        var s = m[i],
          p = s.root && s.root.position;
        if (!p) continue;
        var slot = teamSlot(sq, key, s, i, m.length, a, f),
          x = slot.x + (p.x - home.x) * SPAWN_SCATTER_KEPT,
          z = slot.z + (p.z - home.z) * SPAWN_SCATTER_KEPT,
          N = root.BattleNavigation;
        /* A slot across a hedge or wall from the lane point is not his ground: keep the old spawn. */
        if (N && N.movementClear && !N.movementClear({ x: home.x, z: home.z }, { x: x, z: z })) continue;
        p.x = x;
        p.z = z;
        p.y = sim.heightAt ? sim.heightAt(x, z) : p.y;
        s.root.rotation.y = Math.atan2(f.x, f.z);
        s.destination = { x: x, z: z };
        if (root.BattleNavigation) root.BattleNavigation.invalidateNavCache(s);
      }
    });
  }
  function placeForce(sim) {
    if (!sim || +sim.time > 0) return;
    ['us', 'ge'].forEach(function (f) {
      var a = (sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
      for (var i = 0; i < a.length; i++) placeAtSlots(sim, a[i]);
    });
  }

  /* A fireteam's slots are laid round its anchor, and the squad anchor only advances once enough men
     have arrived on their orders. Men who rush on (cover bounds, assault rushes) leave it behind, so
     the next renewal, or a teammate falling, dealt their slots back behind them: the largest producer
     in the `backward-orders` probe. While the squad advances the team's anchor never trails the team's
     forward line (the same forward-majority point `_forwardLine` publishes, taken from the men now,
     since the published line is a tick old and cleared in retreat) by more than FOLLOW_LAG: it is
     carried forward along the advance axis to where the team actually is. */
  function followTeamForward(sq, key, men, cur) {
    /* Use the same frame as desiredAnchor(). commandForward may legitimately lag a turn while
       _formationForward is held; mixing the two frames lets a longitudinal correction consume the
       lateral separation that desiredAnchor just prescribed. */
    var axis = teamFrame(sq),
      right = { x: -axis.z, z: axis.x },
      desired = desiredAnchor(sq, key),
      t = forwardMajority(men, axis);
    if (!t) return;
    /* Follow is longitudinal only. If the squad frame turns while a team's lease is still live, first
       restore that team's prescribed lateral lane in the CURRENT frame; otherwise alpha/bravo can
       converge even though TEAM_OFFSETS still says they are 16 m apart. The combat-handoff dwell made
       that latent stale-frame collapse visible in mixed fight/move transitions. */
    if (desired) {
      var lateral = (desired.x - cur.anchor.x) * right.x + (desired.z - cur.anchor.z) * right.z;
      cur.anchor = { x: cur.anchor.x + right.x * lateral, z: cur.anchor.z + right.z * lateral };
    }
    var lag = t.at - (cur.anchor.x * axis.x + cur.anchor.z * axis.z);
    if (lag <= FOLLOW_LAG) return;
    cur.anchor = { x: cur.anchor.x + axis.x * lag, z: cur.anchor.z + axis.z * lag };
  }

    return {
      commandForward: commandForward,
      forwardMajority: forwardMajority,
      publishForwardLine: publishForwardLine,
      teamFrame: teamFrame,
      desiredAnchor: desiredAnchor,
      forward: forward,
      teamSlot: teamSlot,
      spawnForward: spawnForward,
      placeAtSlots: placeAtSlots,
      placeForce: placeForce,
      followTeamForward: followTeamForward
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
