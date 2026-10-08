/* Squad idleness census: when does a squad stand still, under which mission, and what did each layer say?
   A squad is "idle" while its centroid stays within IDLE_RADIUS of the point where the episode began.
   Per idle episode of a living, non-retreating squad the probe records snapshots at the checkpoints
   (60/120/180/240/300/420 s into the episode): the General's brief (intent, action, status, version, age, wakes),
   the Squad Leader phase, the faction's strategic stall clock and recovery stage, whether the squad is in contact
   or has a defense request, and, for the observer only, the distance to the nearest living enemy. The enemy
   distance never feeds the game. Observe only: reads public squad/mission state, draws no RNG, writes nothing. */
(function (root) {
  var IDLE_RADIUS = 20,
    CHECKPOINTS = [60, 120, 180, 240, 300, 420],
    state,
    seenWakes,
    shotLog;
  function centre(sq) {
    var m = (sq.members || []).filter(function (s) {
      return !s.dead && s.root;
    });
    if (!m.length) return null;
    var c = m.reduce(
      function (a, s) {
        return { x: a.x + s.root.position.x, z: a.z + s.root.position.z };
      },
      { x: 0, z: 0 }
    );
    return { x: c.x / m.length, z: c.z / m.length, n: m.length };
  }
  function nearestEnemy(sim, sq, c) {
    var other = sq.faction === 'us' ? 'ge' : 'us',
      best = Infinity;
    ((sim.factions[other] && sim.factions[other].squads) || []).forEach(function (q) {
      (q.members || []).forEach(function (s) {
        if (s.dead || !s.root) return;
        var d = Math.hypot(s.root.position.x - c.x, s.root.position.z - c.z);
        if (d < best) best = d;
      });
    });
    return isFinite(best) ? +best.toFixed(0) : null;
  }
  function objState(sim, id) {
    var O = root.BattleObjectiveSystem,
      s = id && O && O.status ? O.status(sim, id) : null;
    return s ? { owner: s.owner || 'neutral', active: s.active || null, phase: s.phase || null } : null;
  }
  /* What the men themselves hold: current targets, suppress jobs, pinned/suppressed, Engagement states. */
  function menPicture(sim, sq) {
    var out = { targets: 0, suppress: 0, pinned: 0, states: {} };
    (sq.members || []).forEach(function (s) {
      if (s.dead) return;
      if (s.target) out.targets++;
      if (s.eng && s.eng.suppressOrder) out.suppress++;
      if ((+s.suppressedUntil || 0) > sim.time) out.pinned++;
      if (s.target && s.target.root) {
        (out.holders = out.holders || []).push(holder(sim, s));
      }
      var st = (s.eng && s.eng.state) || 'none';
      out.states[st] = (out.states[st] || 0) + 1;
    });
    return out;
  }
  /* The first fire condition that fails for a man holding a target, in fire-gates order. */
  function holder(sim, s) {
    var t = s.target,
      p = s.root.position,
      q = t.root.position,
      d = Math.hypot(p.x - q.x, p.z - q.z),
      role = root.SquadAI.ROLES[s.role] || {},
      w = s.weapon || {},
      why = 'clear',
      G = root.BattleDirectFireLOSGate,
      range = root.SquadAI.engageRange ? root.SquadAI.engageRange(s) : role.engageRange;
    if (s.reloading || w.jammed) why = 'reloading';
    else if (w.ammo <= 0 && w.reserveAmmo <= 0) why = 'dry';
    else if (s.crawling) why = 'crawling';
    else if (d > range) why = 'engageRange';
    else if (w.stats && d > w.stats.range) why = 'weaponRange';
    else if (G && G.blocked(s, sim)) why = (G.blockReason && G.blockReason(s, sim)) || 'los';
    return {
      role: s.role,
      d: +d.toFixed(0),
      range: range,
      wRange: w.stats && w.stats.range,
      why: why,
      st: (s.eng && s.eng.state) || null,
      tdead: !!t.dead,
      tsq: t.squad && t.squad.id,
      dy: +(q.y - p.y).toFixed(1)
    };
  }
  function shotsSince(sq, t0) {
    var n = 0,
      log = shotLog[String(sq.id)] || [];
    for (var i = log.length - 1; i >= 0 && log[i] >= t0; i--) n++;
    return n;
  }
  function snapshot(sim, sq, c, ep, cp) {
    var m = sq._macroMission,
      health = sim._coordinationHealth,
      side = health && health.sides && health.sides[sq.faction],
      gen = sim._generals && sim._generals[sq.faction],
      rec = gen && gen.stallRecovery;
    return {
      t: +sim.time.toFixed(0),
      idleFor: cp,
      squad: sq.id,
      faction: sq.faction,
      alive: c.n,
      x: +c.x.toFixed(0),
      z: +c.z.toFixed(0),
      phase: sq.commandPhase || null,
      state: sq.state || null,
      contact: !!sq.inContact,
      mission: m
        ? {
            v: m.version,
            intent: m.intent,
            action: m.action,
            status: m.status,
            obj: m.objectiveId,
            ageS: +(sim.time - (m.issuedAt || 0)).toFixed(0),
            reason: m.reason,
            requestKey: m.requestKey || null,
            objState: objState(sim, m.objectiveId)
          }
        : null,
      versionsDuringEpisode: ep.versions.length,
      men: menPicture(sim, sq),
      fc: sq.fireControl
        ? { state: sq.fireControl.state, reason: sq.fireControl.reason, since: sq.fireControl.since }
        : null,
      plan: sq._engagementPlan
        ? {
            status: sq._engagementPlan.status,
            kind: sq._engagementPlan.kind || sq._engagementPlan.type,
            since: sq._engagementPlan.since
          }
        : null,
      hold: sq._missionHold || null,
      bounds: {
        coa: sq.coa || null,
        assaultAuth: !!sq._assaultAuthorized,
        effective: sq.effectiveCount,
        pinned: sq.pinnedCount,
        contactCount: sq.contactCount,
        suppressors: sq.suppressorCount,
        boundCycle: !!(sq._leases && sq._leases['bound-cycle']),
        quietSince: sq._quietSince
      },
      clearing: !!sq.clearContact,
      leases:
        root.BattleLeases && root.BattleLeases.names
          ? root.BattleLeases.names(sq)
          : Object.keys(sq._leases || {}),
      shotsEpisode: shotsSince(sq, ep.start),
      shots60: shotsSince(sq, sim.time - 60),
      defReq: !!(sq._preparedDefenseRequest || sq._captureZoneDefenseRequest),
      recon: sq._reconTask ? 'active' : sq._reconLast ? sq._reconLast.reason : null,
      factionStallS: side ? side.objectiveStallSeconds : null,
      recoveryStage: rec ? rec.completed : null,
      reviewPasses: rec ? rec.passes : null,
      enemyM: nearestEnemy(sim, sq, c)
    };
  }
  (root.BattleProbes = root.BattleProbes || {})['squad-idle'] = {
    every: 2.5,
    start: function (sim) {
      state = { eps: {}, done: [], snaps: [], wakes: [] };
      seenWakes = 0;
      shotLog = {};
      var old = sim.onFire;
      sim.onFire = function (s) {
        if (old) old.apply(sim, arguments);
        if (s && s.squad) (shotLog[String(s.squad.id)] = shotLog[String(s.squad.id)] || []).push(sim.time);
      };
    },
    sample: function (sim) {
      /* Every strategic-family wake and what state the squad it re-briefed was in at that moment. */
      var ws = sim._macroMissionState;
      if (ws && ws.wakeCount !== seenWakes) {
        var fresh = ws.recentWakes.slice(-Math.min(ws.recentWakes.length, ws.wakeCount - seenWakes));
        seenWakes = ws.wakeCount;
        fresh.forEach(function (w) {
          if (String(w.reason).indexOf('strategic-') !== 0) return;
          var sq = null;
          ['us', 'ge'].forEach(function (f) {
            ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (q) {
              if (q.id === w.squad) sq = q;
            });
          });
          if (!sq) return;
          state.wakes.push({
            t: w.time,
            reason: w.reason,
            faction: w.faction,
            squad: w.squad,
            contact: !!sq.inContact,
            shots30: shotsSince(sq, sim.time - 30),
            targets: menPicture(sim, sq).targets,
            phase: sq.commandPhase || null,
            requested: !!(sq._preparedDefenseRequest || sq._captureZoneDefenseRequest),
            intent: sq._macroMission && sq._macroMission.intent
          });
        });
      }
      ['us', 'ge'].forEach(function (f) {
        ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
          var id = String(sq.id),
            c = centre(sq),
            ep = state.eps[id],
            live = c && sq.state !== 'retreat';
          if (!live) {
            if (ep) {
              ep.end = sim.time;
              ep.endedBy = c ? 'retreat' : 'dead';
              state.done.push(ep);
              delete state.eps[id];
            }
            return;
          }
          if (ep && Math.hypot(c.x - ep.x, c.z - ep.z) > IDLE_RADIUS) {
            ep.end = sim.time;
            ep.endedBy = 'moved';
            state.done.push(ep);
            ep = null;
          }
          if (!ep) {
            ep = state.eps[id] = {
              squad: id,
              faction: f,
              start: sim.time,
              x: c.x,
              z: c.z,
              next: 0,
              versions: []
            };
          }
          var m = sq._macroMission;
          if (m && ep.versions.indexOf(m.version) < 0) ep.versions.push(m.version);
          var idle = sim.time - ep.start;
          while (ep.next < CHECKPOINTS.length && idle >= CHECKPOINTS[ep.next]) {
            state.snaps.push(snapshot(sim, sq, c, ep, CHECKPOINTS[ep.next]));
            ep.next++;
          }
        });
      });
    },
    report: function (sim) {
      var open = Object.keys(state.eps).map(function (id) {
        var e = state.eps[id];
        return {
          squad: id,
          faction: e.faction,
          start: +e.start.toFixed(0),
          end: null,
          endedBy: 'battle-end'
        };
      });
      var eps = state.done
        .concat(
          Object.keys(state.eps).map(function (id) {
            var e = state.eps[id];
            return Object.assign({}, e, { end: sim.time, endedBy: 'battle-end' });
          })
        )
        .filter(function (e) {
          return e.end - e.start >= 120;
        })
        .map(function (e) {
          return {
            squad: e.squad,
            faction: e.faction,
            from: +e.start.toFixed(0),
            to: +e.end.toFixed(0),
            durationS: +(e.end - e.start).toFixed(0),
            endedBy: e.endedBy,
            versions: e.versions.length
          };
        });
      return {
        idleRadius: IDLE_RADIUS,
        episodes: eps,
        openCount: open.length,
        snaps: state.snaps,
        wakes: state.wakes
      };
    }
  };
})(window);
