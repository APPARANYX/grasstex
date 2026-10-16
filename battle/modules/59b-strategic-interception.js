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
    return !!(
      town &&
      town.profile === 'strategic' &&
      !root.PHASE_C_COMBAT_LAB &&
      /(?:^|[?&])strategicInterception=1(?:&|$)/.test(search) &&
      /(?:^|[?&])motorTransport=1(?:&|$)/.test(search) &&
      /(?:^|[?&])aerialRecon=1(?:&|$)/.test(search) &&
      /(?:^|[?&])interception=1(?:&|$)/.test(search)
    );
  }
  function d(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
  function objective(town, id) {
    return (
      (town.objectives || []).find(function (o) {
        return o.id === id;
      }) || null
    );
  }
  function shortest(town, startId, targetId) {
    var graph = {},
      pending = {},
      next = {},
      marked = {};
    (town.objectives || []).forEach(function (o) {
      graph[o.id] = [];
    });
    (town.roads || []).forEach(function (r) {
      var a = objective(town, r.fromObjectiveId),
        b = objective(town, r.toObjectiveId);
      if (!a || !b) return;
      var cost = d(a, b);
      if (!(cost > 0)) return;
      graph[a.id].push({ id: b.id, cost: cost });
      graph[b.id].push({ id: a.id, cost: cost });
    });
    if (!graph[startId] || !graph[targetId]) return null;
    pending[startId] = 0;
    for (;;) {
      var at = Object.keys(pending)
        .filter(function (id) {
          return !marked[id];
        })
        .sort(function (a, b) {
          return pending[a] - pending[b] || a.localeCompare(b);
        })[0];
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
    var ids = [targetId],
      guard = Object.keys(graph).length;
    while (ids[0] !== startId && guard-- > 0) {
      if (!next[ids[0]]) return null;
      ids.unshift(next[ids[0]]);
    }
    return ids[0] === startId
      ? {
          metres: pending[targetId],
          points: ids.map(function (id) {
            var o = objective(town, id);
            return { x: o.x, z: o.z };
          })
        }
      : null;
  }
  function roadSightings(town, contact, faction) {
    if (
      !(contact.confidence >= MIN_CONFIDENCE) ||
      !(contact.speedMps >= 0.8) ||
      !(contact.validUntil >= contact.observedAt) ||
      !isFinite(contact.headingRadians)
    )
      return [];
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
        // Try graduated road positions. A near point may be physically too
        // late for our truck while a farther watch point on the SAME shared
        // corridor remains feasible, especially before a downstream fork.
        var leads = [320, 550, Math.min(remaining * 0.77, remaining - 80)],
          used = {};
        leads.forEach(function (raw) {
          var lead = Math.min(remaining - 80, raw);
          var key = Math.round(lead / 20);
          if (lead < 200 || used[key]) return;
          used[key] = true;
          var fraction = dir > 0 ? t + lead / len : t - lead / len;
          var point = { x: a.x + (b.x - a.x) * fraction, z: a.z + (b.z - a.z) * fraction };
          var enemyFast = Math.max(0.8, contact.speedMps + (contact.speedUncertaintyMps || 0));
          var eta = Math.max(0, lead - (contact.positionUncertaintyM || 40)) / enemyFast;
          candidates.push({
            contact: contact,
            roadId: road.id,
            point: point,
            anchorIds: [a.id, b.id],
            likelyObjectiveId: node.id,
            alignment: dot,
            offRoad: off,
            enemyETA: eta,
            leadMetres: lead
          });
        });
      }
      return candidates;
    }, []);
  }
  function quoteFor(sim, faction, track, diag) {
    var town = sim.scene.metadata.battleScenario,
      transport = root.BattleSquadTransport,
      fleet = transport && transport.fleetSummary && transport.fleetSummary(sim);
    if (!fleet || !transport.quoteMission) { diag.noFleet++; return null; }
    var best = null;
    ((sim.factions[faction] && sim.factions[faction].squads) || []).forEach(function (sq) {
      if (
        !sq ||
        sq.state === 'retreat' ||
        sq.inContact ||
        sq.isPlayer ||
        sq._transportUsed ||
        sq._preparedDefenseRequest
      ) { diag.unavailableSquads++; return; }
      diag.eligibleSquadEvaluations++;
      fleet
        .filter(function (v) {
          return v.faction === faction && v.phase === 'parked';
        })
        .forEach(function (v) {
          var base = (town.spawnZones[faction].bases || [])[v.baseIndex];
          if (!base) return;
          track.anchorIds.forEach(function (anchorId) {
            var path = shortest(town, base.objectiveId, anchorId);
            if (!path) { diag.noRoadGraphPath++; return; }
            diag.pathEvaluations++;
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
            if (!quote || quote.vehicle.id !== v.id) { diag.failedTransportQuotes++; return; }
            diag.viableTransportQuotes++;
            var friendlyETA =
              quote.boardSeconds +
              quote.route.estimatedDriveSeconds +
              quote.dismountSeconds +
              quote.setupSeconds +
              SETUP_MARGIN +
              EXTRA_UNCERTAINTY;
            var margin = track.enemyETA - friendlyETA;
            diag.bestMarginSeconds = Math.max(diag.bestMarginSeconds, margin);
            if (!(margin > 20)) { diag.arrivalTooLate++; return; }
            var score =
              margin * 0.3 + track.alignment * 55 + track.contact.confidence * 35 - track.offRoad * 0.25;
            var selection = {
              squad: sq,
              spec: mission,
              vehicleId: v.id,
              objectiveId: track.likelyObjectiveId,
              roadId: track.roadId,
              contactId: track.contact.squadId,
              observedAt: track.contact.observedAt,
              expiresAt: Math.min(
                track.contact.observedAt + 720,
                sim.time + Math.max(180, track.enemyETA + 80)
              ),
              enemyETA: track.enemyETA,
              friendlyETA: friendlyETA,
              margin: margin,
              score: score,
              confidence: track.contact.confidence,
              leadMetres: track.leadMetres
            };
            if (
              !best ||
              selection.score > best.score + 0.001 ||
              (Math.abs(selection.score - best.score) < 0.001 &&
                String(sq.id).localeCompare(String(best.squad.id)) < 0)
            )
              best = selection;
          });
        });
    });
    return best;
  }
  function choose(sim, faction, ev) {
    var town = sim.scene.metadata.battleScenario;
    if (!ev || ev.faction !== faction || sim.time > ev.validUntil) return null;
    var best = null,
      evaluated = 0,
      diagnostic = {
        noFleet: 0, unavailableSquads: 0, eligibleSquadEvaluations: 0,
        noRoadGraphPath: 0, pathEvaluations: 0, failedTransportQuotes: 0,
        viableTransportQuotes: 0, arrivalTooLate: 0,
        bestMarginSeconds: -Infinity
      };
    ev.contacts.forEach(function (contact) {
      roadSightings(town, contact, faction).forEach(function (track) {
        evaluated++;
        var proposal = quoteFor(sim, faction, track, diagnostic);
        if (proposal && (!best || proposal.score > best.score)) best = proposal;
      });
    });
    diagnostic.bestMarginSeconds = isFinite(diagnostic.bestMarginSeconds)
      ? +diagnostic.bestMarginSeconds.toFixed(1) : null;
    return { best: best, evaluated: evaluated, contacts: ev.contacts.length, diagnostic: diagnostic };
  }
  function state(sim) {
    return (
      sim._strategicInterception ||
      (sim._strategicInterception = {
        us: { lastEventAt: null, last: null },
        ge: { lastEventAt: null, last: null }
      })
    );
  }
  /* Pair actual squads by their assigned starting base. A single squad at a
     base must never be held back for a hypothetical second truck. The first
     available squad takes normal objective orders; the second has a clear
     follow-on screen task once that actual objective is secured. */
  function baseKey(sq, town) {
    if (!sq || !town || !town.spawnZones || !town.spawnZones[sq.faction]) return null;
    if (sq.homeBaseObjectiveId) return String(sq.homeBaseObjectiveId);
    var home = sq.baseHome || sq.home;
    if (!home) return null;
    var matches = (town.spawnZones[sq.faction].bases || []).slice().sort(function (a, b) {
      return d(home, a) - d(home, b);
    });
    return matches.length && d(home, matches[0]) <= 100 ? matches[0].objectiveId : null;
  }
  function pairs(sim, faction) {
    var town = sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario;
    if (!town) return [];
    var byBase = {};
    ((sim.factions[faction] && sim.factions[faction].squads) || []).forEach(function (sq) {
      var key = baseKey(sq, town);
      if (!key || sq.state === 'retreat' || sq.isPlayer ||
        sq._preparedDefenseRequest || !(sq.members || []).some(function (m) { return m && !m.dead; }))
        return;
      (byBase[key] || (byBase[key] = [])).push(sq);
    });
    return Object.keys(byBase).sort().filter(function (key) {
      return byBase[key].length >= 2;
    }).map(function (key) {
      return { baseId: key, lead: byBase[key][0], screen: byBase[key][1] };
    });
  }
  function pairFor(sim, sq) {
    return pairs(sim, sq.faction).find(function (pair) { return pair.screen === sq; }) || null;
  }
  function reserveSquad(sim, sq) {
    return !!(enabled(sim) && sq && pairFor(sim, sq));
  }
  function reservePending(sim, faction) {
    return enabled(sim) && pairs(sim, faction).some(function (pair) {
      var m = pair.screen._macroMission;
      return m && m.intent === 'reserve' && m.interceptReserve;
    });
  }
  function screeningPoint(town, objectiveId, faction) {
    var obj = objective(town, objectiveId);
    if (!obj) return null;
    var sign = faction === 'us' ? 1 : -1;
    var options = (town.roads || []).reduce(function (out, road) {
      var id = road.fromObjectiveId === objectiveId ? road.toObjectiveId :
        road.toObjectiveId === objectiveId ? road.fromObjectiveId : null;
      if (!id) return out;
      var other = objective(town, id);
      if (!other || (other.z - obj.z) * sign < 100) return out;
      var length = d(obj, other);
      if (length < 240) return out;
      var travel = Math.min(340, Math.max(215, length * 0.36));
      return out.concat([{
        objective: obj,
        roadId: road.id || String(objectiveId) + ':' + id,
        point: { x: obj.x + (other.x - obj.x) * travel / length,
          z: obj.z + (other.z - obj.z) * travel / length },
        forwardM: travel,
        length: length
      }]);
    }, []);
    return options.sort(function (a, b) {
      return b.forwardM - a.forwardM || String(a.roadId).localeCompare(String(b.roadId));
    })[0] || null;
  }
  function screenOpportunity(sim, faction, pair) {
    var lead = pair.lead, screen = pair.screen,
      mission = lead && (lead._macroMission && lead._macroMission.intent === 'capture'
        ? lead._macroMission : lead._lastMacroMission),
      town = sim.scene.metadata.battleScenario;
    if (!mission || !mission.objectiveId || !screen ||
      !(screen._macroMission && screen._macroMission.intent === 'reserve' &&
        screen._macroMission.interceptReserve) ||
      lead.inContact || screen.inContact || screen._transportUsed) return null;
    var obj = objective(town, mission.objectiveId);
    if (!obj || obj.baseFaction) return null;
    var status = sim.objectiveControl && sim.objectiveControl.sectors &&
      sim.objectiveControl.sectors[obj.id];
    // Public ownership plus no known fresh report is the operational gate.
    // Lack of a report does NOT assert that the enemy is absent.
    if (!status || status.owner !== faction) return null;
    var picture = root.BattleTacticalSituation && root.BattleTacticalSituation.compute(sim, faction);
    if (!picture) return null;
    var danger = picture.contacts.some(function (c) {
      return c && c.age <= 12 && isFinite(c.x) && isFinite(c.z) &&
        d(c, obj) < 180;
    });
    if (danger) return null;
    var leadPos = lead.members.filter(function (m) {
      return m && !m.dead && m.root && m.root.position;
    });
    if (!leadPos.length) return null;
    var center = { x: leadPos.reduce(function (v, m) { return v + m.root.position.x; }, 0) / leadPos.length,
      z: leadPos.reduce(function (v, m) { return v + m.root.position.z; }, 0) / leadPos.length };
    if (d(center, obj) > (+obj.radius || 55) + 40) return null;
    var post = screeningPoint(town, obj.id, faction);
    if (!post) return null;
    if (picture.contacts.some(function (c) {
      return c && c.age <= 12 && isFinite(c.x) && isFinite(c.z) &&
        d(c, post.point) < 160;
    })) return null;
    var route = root.BattleCommanderRoutes && root.BattleCommanderRoutes.missionRouteFor
      ? root.BattleCommanderRoutes.missionRouteFor(screen, town, obj.id, screen.baseHome || screen.home)
      : [];
    route = route.concat([{ x: obj.x, z: obj.z }]);
    var spec = {
      owner: 'force-command', intent: 'screen', action: 'screen', status: 'issued',
      objectiveId: null, point: post.point, route: route, role: 'recon',
      screen: { leadSquadId: lead.id, securedObjectiveId: obj.id, roadId: post.roadId,
        forwardM: +post.forwardM.toFixed(1), orderedAt: sim.time }
    };
    var transport = root.BattleSquadTransport;
    var quote = transport && transport.quoteMission && transport.quoteMission(sim, screen, spec);
    return quote ? { spec: spec, squad: screen, quote: quote, lead: lead } : null;
  }
  function maybeScreen(sim, faction, issue) {
    if (!enabled(sim) || typeof issue !== 'function') return null;
    var stateForFaction = state(sim)[faction];
    for (var pair of pairs(sim, faction)) {
      var opportunity = screenOpportunity(sim, faction, pair);
      if (!opportunity) continue;
      var m = issue(opportunity.squad, opportunity.spec, 'forward-screen-uncontested');
      var t = opportunity.squad._transport;
      if (!m || m.intent !== 'screen' || !t || t.vehicleId !== opportunity.quote.vehicle.id) {
        event(sim, 'screen-grant-failed', { faction: faction, squad: pair.screen.id });
        continue;
      }
      stateForFaction.screen = {
        squadId: pair.screen.id, leadSquadId: pair.lead.id,
        objectiveId: opportunity.spec.screen.securedObjectiveId,
        vehicleId: t.vehicleId, roadId: opportunity.spec.screen.roadId,
        orderAt: sim.time, post: opportunity.spec.point,
        reportCount: 0, atPost: null, observations: {}
      };
      event(sim, 'screen-ordered', { faction: faction, ...stateForFaction.screen });
      return stateForFaction.screen;
    }
    return null;
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
    var choice = choose(sim, faction, observation),
      selected = choice && choice.best;
    if (!selected) {
      st.last = {
        at: sim.time,
        result: 'declined',
        contacts: choice ? choice.contacts : 0,
        corridors: choice ? choice.evaluated : 0,
        rejectionEvidence: choice && choice.diagnostic
      };
      event(sim, 'declined', { faction: faction, ...st.last });
      return null;
    }
    selected.spec.action = 'intercept';
    selected.spec.role = selected.squad.commandRole || 'maneuver';
    selected.spec.intercept = {
      source: 'aerial',
      contactId: selected.contactId,
      roadId: selected.roadId,
      likelyObjectiveId: selected.objectiveId,
      observedAt: selected.observedAt,
      expiresAt: selected.expiresAt,
      enemyETA: +selected.enemyETA.toFixed(1),
      friendlyETA: +selected.friendlyETA.toFixed(1),
      margin: +selected.margin.toFixed(1),
      confidence: selected.confidence,
      vehicleId: selected.vehicleId
    };
    var m = issue(selected.squad, selected.spec, 'aerial-intercept-feasible');
    var success =
      m &&
      m.intent === 'intercept' &&
      selected.squad._transport &&
      selected.squad._transport.vehicleId === selected.vehicleId;
    st.last = {
      at: sim.time,
      result: success ? 'dispatched' : 'grant-failed',
      squadId: selected.squad.id,
      roadId: selected.roadId,
      contactId: selected.contactId,
      vehicleId: selected.vehicleId,
      margin: +selected.margin.toFixed(1),
      missionVersion: m && m.version
    };
    event(sim, st.last.result, { faction: faction, ...st.last });
    return success ? st.last : null;
  }
  function reset(sim) {
    sim._strategicInterception = null;
  }
  root.BattleModules.registerSystem('strategic-interception', {
    version: '0.1-general-corridor',
    onBattleStart: reset,
    onBattleRestart: reset
  });
  root.BattleStrategicInterception = {
    enabled: enabled,
    reserveSquad: reserveSquad,
    reservePending: reservePending,
    pairs: pairs,
    screenOpportunity: screenOpportunity,
    maybeScreen: maybeScreen,
    choose: choose,
    maybeIssue: maybeIssue,
    summary: function (sim) {
      return state(sim);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
