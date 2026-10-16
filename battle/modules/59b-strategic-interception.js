/* Strategic Interception V1: General-only, report-derived corridor opportunities.
   Never reads hostile units, visibility or actor transforms. The only hostile
   input is BattleAerialRecon.forGeneral(), a bounded/uncertain immutable DTO.
   Navigation, boarding, movement, deployment and fire retain their owners. */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleStrategicInterception) return;
  var MIN_CONFIDENCE = 0.55,
    ROAD_PROXIMITY = 110,
    ALIGNMENT = 0.58,
    SETUP_MARGIN = 35,
    EXTRA_UNCERTAINTY = 30;

  function enabled(sim) {
    var town = sim && sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario;
    var search = (root.location && root.location.search) || '';
    return !!(town && town.profile === 'strategic' && !root.PHASE_C_COMBAT_LAB &&
      /(?:^|[?&])strategicInterception=1(?:&|$)/.test(search) &&
      /(?:^|[?&])motorTransport=1(?:&|$)/.test(search) &&
      /(?:^|[?&])aerialRecon=1(?:&|$)/.test(search) &&
      /(?:^|[?&])interception=1(?:&|$)/.test(search));
  }
  function d(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
  function objective(town, id) {
    return (town.objectives || []).find(function (o) { return o.id === id; }) || null;
  }
  function shortest(town, startId, targetId) {
    var graph = {}, pending = {}, next = {}, marked = {};
    (town.objectives || []).forEach(function (o) { graph[o.id] = []; });
    (town.roads || []).forEach(function (r) {
      var a = objective(town, r.fromObjectiveId), b = objective(town, r.toObjectiveId);
      if (!a || !b) return;
      var cost = d(a, b);
      if (!(cost > 0)) return;
      graph[a.id].push({ id: b.id, cost: cost });
      graph[b.id].push({ id: a.id, cost: cost });
    });
    if (!graph[startId] || !graph[targetId]) return null;
    pending[startId] = 0;
    for (;;) {
      var at = Object.keys(pending).filter(function (id) { return !marked[id]; })
        .sort(function (a, b) { return pending[a] - pending[b] || a.localeCompare(b); })[0];
      if (!at) break;
      if (at === targetId) break;
      marked[at] = true;
      graph[at].forEach(function (e) {
        if (pending[e.id] == null || pending[at] + e.cost < pending[e.id] - 0.01) {
          pending[e.id] = pending[at] + e.cost;
          next[e.id] = at;
        }
      });
    }
    if (pending[targetId] == null) return null;
    var ids = [targetId], guard = Object.keys(graph).length;
    while (ids[0] !== startId && guard-- > 0) {
      if (!next[ids[0]]) return null;
      ids.unshift(next[ids[0]]);
    }
    return ids[0] === startId
      ? { metres: pending[targetId], points: ids.map(function (id) {
          var o = objective(town, id);
          return { x: o.x, z: o.z };
        }) }
      : null;
  }
  function roadSightings(town, contact, faction) {
    if (!(contact.confidence >= MIN_CONFIDENCE) ||
        !(contact.speedMps >= 0.8) ||
        !(contact.validUntil >= contact.observedAt) ||
        !isFinite(contact.headingRadians)) return [];
    var p = { x: contact.x, z: contact.z },
      h = { x: Math.sin(contact.headingRadians), z: Math.cos(contact.headingRadians) },
      hostile = faction === 'us' ? 'ge' : 'us';
    return (town.roads || []).reduce(function (candidates, road) {
      var a = objective(town, road.fromObjectiveId),
        b = objective(town, road.toObjectiveId);
      if (!a || !b) return candidates;
      var len = d(a, b);
      if (!(len > 300)) return candidates;
      var vx = (b.x - a.x) / len,
        vz = (b.z - a.z) / len,
        t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.z - a.z) * vz) / len)),
        foot = { x: a.x + vx * len * t, z: a.z + vz * len * t },
        off = d(p, foot),
        alignment = vx * h.x + vz * h.z;
      if (off > ROAD_PROXIMITY + (contact.positionUncertaintyM || 0)) return candidates;
      for (var dir = -1; dir <= 1; dir += 2) {
        var dot = alignment * dir,
          node = dir > 0 ? b : a,
          anchor = dir > 0 ? a : b,
          remaining = dir > 0 ? len * (1 - t) : len * t;
        if (dot < ALIGNMENT || remaining < 300) continue;
        // Do not claim that a hostile squad intends to capture its own base.
        if (node.baseFaction === hostile) continue;
        // Aim well ahead of the reported enemy, before the next graph fork.
        var lead = Math.min(remaining * 0.77, Math.max(320, contact.speedMps * 185));
        if (remaining - lead < 80) lead = remaining - 80;
        if (lead < 200) continue;
        var fraction = dir > 0 ? t + lead / len : t - lead / len;
        var point = { x: a.x + (b.x - a.x) * fraction, z: a.z + (b.z - a.z) * fraction };
        var enemyFast = Math.max(0.8, contact.speedMps + (contact.speedUncertaintyMps || 0));
        var eta = Math.max(0, lead - (contact.positionUncertaintyM || 40)) / enemyFast;
        candidates.push({
          contact: contact,
          roadId: road.id,
          point: point,
          anchorId: anchor.id,
          likelyObjectiveId: node.id,
          alignment: dot,
          offRoad: off,
          enemyETA: eta,
          leadMetres: lead
        });
      }
      return candidates;
    }, []);
  }
  function quoteFor(sim, faction, track) {
    var town = sim.scene.metadata.battleScenario,
      transport = root.BattleSquadTransport,
      fleet = transport && transport.fleetSummary && transport.fleetSummary(sim);
    if (!fleet || !transport.quoteMission) return null;
    var best = null;
    ((sim.factions[faction] && sim.factions[faction].squads) || []).forEach(function (sq) {
      if (!sq || sq.state === 'retreat' || sq.inContact || sq.isPlayer ||
          sq._transportUsed || sq._preparedDefenseRequest) return;
      fleet.filter(function (v) {
        return v.faction === faction && v.phase === 'parked';
      }).forEach(function (v) {
        var base = (town.spawnZones[faction].bases || [])[v.baseIndex];
        if (!base) return;
        var path = shortest(town, base.objectiveId, track.anchorId);
        if (!path) return;
        // Base road point, then complete public graph edges to the watched edge.
        var route = path.points;
        var mission = {
          owner: 'force-command',
          status: 'issued',
          intent: 'intercept',
          point: track.point,
          route: route
        };
        var quote = transport.quoteMission(sim, sq, mission);
        if (!quote || quote.vehicle.id !== v.id) return;
        var friendlyETA = quote.boardSeconds + quote.route.estimatedDriveSeconds +
          quote.dismountSeconds + quote.setupSeconds + SETUP_MARGIN + EXTRA_UNCERTAINTY;
        var margin = track.enemyETA - friendlyETA;
        if (!(margin > 20)) return;
        var score = margin * 0.3 + track.alignment * 55 +
          track.contact.confidence * 35 - track.offRoad * 0.25;
        var selection = {
          squad: sq,
          spec: mission,
          vehicleId: v.id,
          objectiveId: track.likelyObjectiveId,
          roadId: track.roadId,
          contactId: track.contact.squadId,
          observedAt: track.contact.observedAt,
          expiresAt: Math.min(track.contact.observedAt + 720,
            sim.time + Math.max(180, track.enemyETA + 80)),
          enemyETA: track.enemyETA,
          friendlyETA: friendlyETA,
          margin: margin,
          score: score,
          confidence: track.contact.confidence,
          leadMetres: track.leadMetres
        };
        if (!best || selection.score > best.score + 0.001 ||
          (Math.abs(selection.score - best.score) < 0.001 &&
            String(sq.id).localeCompare(String(best.squad.id)) < 0)) best = selection;
      });
    });
    return best;
  }
  function choose(sim, faction, ev) {
    var town = sim.scene.metadata.battleScenario;
    if (!ev || ev.faction !== faction || sim.time > ev.validUntil) return null;
    var best = null, evaluated = 0;
    ev.contacts.forEach(function (contact) {
      roadSightings(town, contact, faction).forEach(function (track) {
        evaluated++;
        var proposal = quoteFor(sim, faction, track);
        if (proposal && (!best || proposal.score > best.score)) best = proposal;
      });
    });
    return { best: best, evaluated: evaluated, contacts: ev.contacts.length };
  }
  function state(sim) {
    return sim._strategicInterception || (sim._strategicInterception = {
      us: { lastEventAt: null, last: null },
      ge: { lastEventAt: null, last: null }
    });
  }
  function event(sim, kind, data) {
    if (root.BattleTelemetry && root.BattleTelemetry.record)
      root.BattleTelemetry.record('strategic-interception-' + kind, data, sim);
  }
  function maybeIssue(sim, faction, issue) {
    if (!enabled(sim) || !root.BattleAerialRecon || typeof issue !== 'function') return null;
    var observation = root.BattleAerialRecon.forGeneral(sim, faction);
    if (!observation) return null;
    var st = state(sim)[faction];
    if (st.lastEventAt === observation.observedAt) return null;
    st.lastEventAt = observation.observedAt;
    var choice = choose(sim, faction, observation), selected = choice && choice.best;
    if (!selected) {
      st.last = { at: sim.time, result: 'declined', contacts: choice ? choice.contacts : 0,
        corridors: choice ? choice.evaluated : 0 };
      event(sim, 'declined', { faction: faction, ...st.last });
      return null;
    }
    selected.spec.role = selected.squad.commandRole || 'maneuver';
    selected.spec.intercept = {
      source: 'aerial', contactId: selected.contactId,
      roadId: selected.roadId, likelyObjectiveId: selected.objectiveId,
      observedAt: selected.observedAt, expiresAt: selected.expiresAt,
      enemyETA: +selected.enemyETA.toFixed(1),
      friendlyETA: +selected.friendlyETA.toFixed(1),
      margin: +selected.margin.toFixed(1),
      confidence: selected.confidence,
      vehicleId: selected.vehicleId
    };
    var m = issue(selected.squad, selected.spec, 'aerial-intercept-feasible');
    var success = m && m.intent === 'intercept' &&
      selected.squad._transport && selected.squad._transport.vehicleId === selected.vehicleId;
    st.last = {
      at: sim.time, result: success ? 'dispatched' : 'grant-failed',
      squadId: selected.squad.id, roadId: selected.roadId,
      contactId: selected.contactId, vehicleId: selected.vehicleId,
      margin: +selected.margin.toFixed(1), missionVersion: m && m.version
    };
    event(sim, st.last.result, { faction: faction, ...st.last });
    return success ? st.last : null;
  }
  function reset(sim) { sim._strategicInterception = null; }
  root.BattleModules.registerSystem('strategic-interception', {
    version: '0.1-general-corridor',
    onBattleStart: reset,
    onBattleRestart: reset
  });
  root.BattleStrategicInterception = {
    enabled: enabled, choose: choose, maybeIssue: maybeIssue,
    summary: function (sim) { return state(sim); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
