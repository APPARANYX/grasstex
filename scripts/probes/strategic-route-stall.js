/* Read-only 0.15s route-stall forensic for the strategic 5km benchmark.
 * Capture bounded pre/post incident frames, never all ticks for a full battle.
 * Mirrors BattleBenchmarkIntent.routeActive and route-stall's 20s/3m criterion.
 * An alert is a candidate: a road detour can increase waypoint distance legally.
 */
(function (root) {
  'use strict';
  var HISTORY = 120,
    FOLLOWUP = 40,
    LIMIT = 14;
  var state, events, counts, populations, active, omitted, tickCount;
  var query = new URLSearchParams((root.location && root.location.search) || '');
  var selected = String(query.get('probeSquads') || '')
    .split(',')
    .filter(Boolean);

  function point(p) {
    return p && isFinite(+p.x) && isFinite(+p.z) ? { x: +(+p.x).toFixed(3), z: +(+p.z).toFixed(3) } : null;
  }
  function distance(a, b) {
    return a && b ? Math.hypot(a.x - b.x, a.z - b.z) : Infinity;
  }
  function round(n) {
    return isFinite(+n) ? +(+n).toFixed(3) : null;
  }
  function living(sq) {
    return (sq.members || []).filter(function (m) {
      return m && !m.dead && m.root && m.root.position;
    });
  }
  function centre(men) {
    var p = { x: 0, z: 0 };
    for (var i = 0; i < men.length; i++) {
      p.x += men[i].root.position.x / men.length;
      p.z += men[i].root.position.z / men.length;
    }
    return p;
  }
  function routeActive(sq, p) {
    if (sq.state === 'retreat' || !p) return false;
    var r = sq.route || [],
      i = Math.max(0, Math.min(r.length - 1, +sq.routeIndex || 0)),
      wp = r[i];
    if (!wp || !isFinite(+wp.x) || !isFinite(+wp.z) || distance(sq.objective, wp) > 3) return false;
    if (sq.targetObjective) {
      // Distinct forensic population: accepted capture brief still executing a
      // nonterminal road leg. An assigned flag does not supersede that leg.
      var m = sq._macroMission,
        ex = sq._missionExecution;
      return !!(
        m &&
        m.intent === 'capture' &&
        m.status === 'executing' &&
        ex &&
        ex.mission === m &&
        i < r.length - 1
      );
    }
    return i < r.length - 1 || distance(p, wp) > 32;
  }
  function sampleRow(sim, sq, men, p, i, wp) {
    var t = sq._transport,
      m = sq._macroMission;
    return {
      at: round(sim.time),
      centroid: point(p),
      waypoint: point(wp),
      waypointDistance: round(distance(p, wp)),
      routeIndex: i,
      routeLength: (sq.route || []).length,
      objective: point(sq.objective),
      phase: sq.commandPhase || null,
      targetObjective: sq.targetObjective || null,
      anchor: point(sq.orderAnchor),
      orderGoal: point(sq._orderGoal),
      missionHold: sq._missionHold || null,
      contact: !!sq.inContact,
      mission: m
        ? {
            version: m.version,
            intent: m.intent,
            status: m.status,
            objectiveId: m.objectiveId || null,
            point: point(m.point)
          }
        : null,
      transport: t
        ? {
            phase: t.phase,
            vehicleId: t.vehicleId,
            reason: t.endReason || t.reason || t.abortReason || null,
            leg: t.leg,
            position: point(t.position),
            travelled: round(t.travelled),
            boardedCount: t.boardedCount,
            requestedAt: round(t.requestedAt),
            endedAt: t.endedAt == null ? null : round(t.endedAt),
            missionVersion: t.missionVersion
          }
        : null,
      men: men.map(function (s) {
        var r = s._movementResolver && s._movementResolver.last;
        var path = s._physicalPath;
        var O = root.BattleExecutionOutcome,
          outcome = O && O.man ? O.man(s, sim) : null;
        return {
          id: s.id,
          position: point(s.root.position),
          destination: point(s.destination),
          waypoint: point(s._movementWaypoint),
          orderDestination: point(s.orderDestination),
          fireteamDestination: point(s._fireteamDestination),
          adoptedEnvelope: s._fireteamAdoptedEnvelope || null,
          execution: outcome
            ? {
                current: !!outcome.current,
                state: outcome.state,
                why: outcome.why || null,
                envelopeId: outcome.envelopeId || null,
                missionVersion: outcome.missionVersion,
                terminal: !!outcome.terminal,
                progressing: !!outcome.progressing
              }
            : null,
          committedOrder:
            s._movementResolver && s._movementResolver.order
              ? {
                  point: point(s._movementResolver.order.point),
                  intentPoint: point(s._movementResolver.order.intentPoint)
                }
              : null,
          detour: point(s._fieldDetour),
          moving: !!s.moving,
          speed: round(s.moveSpeed),
          stop: s._movementStopReason || null,
          engagement: (s.eng && s.eng.state) || null,
          resolver: r
            ? {
                owner: r.owner || null,
                kind: r.kind || null,
                reason: r.reason || null,
                point: point(r.point)
              }
            : null,
          path: path
            ? {
                blocked: !!path.blocked,
                pointCount: (path.points || []).length,
                next: point((path.points || [])[0])
              }
            : null
        };
      })
    };
  }
  function observe(sim, sq, faction) {
    if (selected.length && selected.indexOf(String(sq.id)) < 0) return;
    var key = faction + ':' + sq.id,
      men = living(sq);
    var p = men.length ? centre(men) : null;
    var r = sq.route || [],
      i = Math.max(0, Math.min(r.length - 1, +sq.routeIndex || 0)),
      wp = r[i];
    // Capture the remaining 40 physical ticks even when the original mission changes.
    for (var f = active.length - 1; f >= 0; f--) {
      var follow = active[f];
      if (follow.key !== key) continue;
      follow.event.after.push(sampleRow(sim, sq, men, p, i, wp));
      if (--follow.remaining <= 0) active.splice(f, 1);
    }
    var phase = sq.commandPhase;
    if (
      !men.length ||
      !routeActive(sq, p) ||
      ['approach', 'assault', 'capture', 'clear-town', 'flank', 'contact', 'corner-check'].indexOf(phase) <
        0 ||
      sq.inContact
    ) {
      state.delete(key);
      return;
    }
    var gap = distance(p, wp),
      track = state.get(key);
    if (!track || track.index !== i || track.version !== (sq._macroMission && sq._macroMission.version)) {
      track = {
        index: i,
        version: sq._macroMission && sq._macroMission.version,
        best: gap,
        lastProgress: sim.time,
        reported: false,
        before: []
      };
      state.set(key, track);
    } else if (gap < track.best - 3) {
      track.best = gap;
      track.lastProgress = sim.time;
      track.reported = false;
    }
    track.before.push(sampleRow(sim, sq, men, p, i, wp));
    if (track.before.length > HISTORY) track.before.shift();
    if (track.reported || gap <= 12 || sim.time - track.lastProgress < 20) return;
    track.reported = true;
    counts[faction] = (counts[faction] || 0) + 1;
    var population = sq.targetObjective ? 'assigned-capture-road-leg' : 'legacy-route-candidate';
    populations[population] = (populations[population] || 0) + 1;
    if (
      events.filter(function (e) {
        return e.population === population;
      }).length >= LIMIT
    ) {
      omitted++;
      return;
    }
    var event = {
      faction: faction,
      squad: String(sq.id),
      at: round(sim.time),
      lastForwardProgressAt: round(track.lastProgress),
      routeIndex: i,
      distanceToWaypoint: round(gap),
      population: population,
      bestDistance: round(track.best),
      before: track.before.slice(),
      after: []
    };
    events.push(event);
    active.push({ key: key, event: event, remaining: FOLLOWUP });
  }
  (root.BattleProbes = root.BattleProbes || {})['strategic-route-stall'] = {
    every: 0, // Every simulation step; the probe runner's fixed step is 0.15s.
    start: function () {
      state = new Map();
      events = [];
      counts = {};
      populations = {};
      active = [];
      omitted = 0;
      tickCount = 0;
    },
    sample: function (sim) {
      tickCount++;
      ['us', 'ge'].forEach(function (faction) {
        var squads = (sim.factions && sim.factions[faction] && sim.factions[faction].squads) || [];
        squads.forEach(function (sq) {
          observe(sim, sq, faction);
        });
      });
    },
    report: function () {
      return {
        schema: 'strategic-route-stall-v1',
        interval: 0.15,
        sampledTicks: tickCount,
        historyLimit: HISTORY,
        followupLimit: FOLLOWUP,
        recorded: events.length,
        omitted: omitted,
        counts: counts,
        countsByPopulation: populations,
        events: events
      };
    }
  };
})(window);
