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
  /* ?reconCorridors=0 restores the General's own road projection. */
  function reportCorridorsOn() {
    return !/(?:^|[?&])reconCorridors=0(?:&|$)/.test((root.location && root.location.search) || '');
  }
  /* Corridors come with the report: the air branch (or the screen's report,
     through the same analysis) projects the track onto the public roads.
     The General reads them as delivered. */
  function corridorTracks(town, contact, faction) {
    if (!reportCorridorsOn()) return roadSightings(town, contact, faction);
    var list = contact.corridors;
    if (!list && root.BattleAerialRecon && root.BattleAerialRecon.corridorsFor)
      list = root.BattleAerialRecon.corridorsFor(town, contact, faction);
    if (!list || !(contact.confidence >= MIN_CONFIDENCE)) return [];
    return list.map(function (c) {
      return {
        contact: contact,
        roadId: c.roadId,
        point: c.point,
        anchorIds: c.anchorIds,
        likelyObjectiveId: c.likelyObjectiveId,
        alignment: c.alignment * (c.likelihood == null ? 1 : c.likelihood),
        offRoad: c.offRoadM || 0,
        enemyETA: c.enemyEtaSeconds,
        enemyLatest: c.enemyLatestSeconds,
        leadMetres: c.leadMetres,
        hop: c.hop || 0
      };
    });
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
  /* A forward screen that has dismounted (or was cut short) is a real team
     with its own stopped truck nearby; it may be re-briefed by a report. */
  function reusableScreen(sq) {
    var m = sq._macroMission,
      t = sq._transport;
    return !!(
      m &&
      m.intent === 'screen' &&
      (m.status === 'issued' || m.status === 'executing') &&
      t &&
      (t.phase === 'dismounted' || t.phase === 'aborted')
    );
  }
  /* A report from a sortie a line change earned (front lines): a squad that has finished its
     ride and stands on ground it holds (defending, holding, or done) with its truck stopped
     beside it may answer it. A squad still driving to or fighting for an objective may not. */
  function reusableAfterLine(sq, track) {
    var m = sq._macroMission,
      t = sq._transport,
      ev = track && track.report;
    return !!(
      ev &&
      ev.sortie > 1 &&
      m &&
      (m.intent === 'defend' || m.intent === 'hold' || m.status === 'completed') &&
      t &&
      (t.phase === 'dismounted' || t.phase === 'aborted')
    );
  }
  /* The public road node nearest the squad, for routing a truck it re-boards. */
  function nearestNode(town, sq) {
    var men = (sq.members || []).filter(function (m) {
      return m && !m.dead && m.root && m.root.position;
    });
    if (!men.length) return null;
    var c = {
        x:
          men.reduce(function (v, m) {
            return v + m.root.position.x;
          }, 0) / men.length,
        z:
          men.reduce(function (v, m) {
            return v + m.root.position.z;
          }, 0) / men.length
      },
      best = null;
    (town.objectives || []).forEach(function (o) {
      var on = (town.roads || []).some(function (r) {
        return r.fromObjectiveId === o.id || r.toObjectiveId === o.id;
      });
      if (on && (!best || d(c, o) < d(c, best))) best = o;
    });
    return best ? best.id : null;
  }
  /* ?contestedPost=0 drops the check below. A post is contested when the
     same report puts another hostile formation on that ground before the
     squad would be set up: stationary there, or a corridor of its own that
     reaches it first. Radius: the truck's dismount distance plus the fix's
     position uncertainty, the ground the squad must cross on foot. */
  function contestedPostOn() {
    return !/(?:^|[?&])contestedPost=0(?:&|$)/.test((root.location && root.location.search) || '');
  }
  function contestedBy(track, friendlyETA, age) {
    var transport = root.BattleSquadTransport,
      dismount = (transport && transport.tuning && transport.tuning.dismountMetres) || 180,
      contacts = (track.report && track.report.contacts) || [];
    for (var i = 0; i < contacts.length; i++) {
      var c = contacts[i];
      if (!c || c === track.contact) continue;
      var radius = dismount + (c.positionUncertaintyM || 40);
      if (d(c, track.point) <= radius) return c.squadId;
      var list = c.corridors || [];
      for (var k = 0; k < list.length; k++)
        if (d(list[k].point, track.point) <= radius && list[k].enemyEtaSeconds - age <= friendlyETA)
          return c.squadId;
    }
    return null;
  }
  function quoteFor(sim, faction, track, diag) {
    var town = sim.scene.metadata.battleScenario,
      transport = root.BattleSquadTransport,
      fleet = transport && transport.fleetSummary && transport.fleetSummary(sim);
    if (!fleet || !transport.quoteMission) {
      diag.noFleet++;
      return null;
    }
    var best = null,
      reportFed = reportCorridorsOn(),
      // The report ages while it waits for the General; its arrival estimate
      // counts from the observation, not from this decision.
      age = reportFed ? Math.max(0, (+sim.time || 0) - (+track.contact.observedAt || 0)) : 0;
    ((sim.factions[faction] && sim.factions[faction].squads) || []).forEach(function (sq) {
      if (
        !sq ||
        sq.state === 'retreat' ||
        sq.inContact ||
        sq.isPlayer ||
        (sq._transportUsed && !(reportFed && (reusableScreen(sq) || reusableAfterLine(sq, track)))) ||
        sq._preparedDefenseRequest
      ) {
        diag.unavailableSquads++;
        return;
      }
      diag.eligibleSquadEvaluations++;
      /* Report-fed: one quote per squad and anchor. The transport owner picks
         the real truck (parked at this squad's base, or its own stopped truck
         within reach); iterating every depot vehicle only counted mismatches. */
      (reportFed
        ? [null]
        : fleet.filter(function (v) {
            return v.faction === faction && v.phase === 'parked';
          })
      ).forEach(function (v) {
        var base = v ? (town.spawnZones[faction].bases || [])[v.baseIndex] : null;
        if (v && !base) return;
        track.anchorIds.forEach(function (anchorId) {
          var startId = base ? base.objectiveId : nearestNode(town, sq);
          var path = startId && shortest(town, startId, anchorId);
          if (!path) {
            diag.noRoadGraphPath++;
            return;
          }
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
          if (!quote || (v && quote.vehicle.id !== v.id)) {
            diag.failedTransportQuotes++;
            return;
          }
          diag.viableTransportQuotes++;
          var friendlyETA =
            quote.boardSeconds +
            quote.route.estimatedDriveSeconds +
            quote.dismountSeconds +
            quote.setupSeconds +
            SETUP_MARGIN +
            EXTRA_UNCERTAINTY;
          var margin = track.enemyETA - age - friendlyETA;
          diag.bestMarginSeconds = Math.max(diag.bestMarginSeconds, margin);
          if (!(margin > 20)) {
            diag.arrivalTooLate++;
            return;
          }
          /* Report-fed: margin beyond the setup and uncertainty allowance buys
             nothing, and a later watch point is a less certain forecast, so the
             earliest feasible corridor wins. */
          if (reportFed && contestedPostOn() && contestedBy(track, friendlyETA, age)) {
            diag.contestedPost = (diag.contestedPost || 0) + 1;
            return;
          }
          var score = reportFed
            ? Math.min(margin, SETUP_MARGIN + EXTRA_UNCERTAINTY) * 0.3 -
              (track.enemyETA - age) * 0.3 +
              track.alignment * 55 +
              track.contact.confidence * 35 -
              track.offRoad * 0.25
            : margin * 0.3 + track.alignment * 55 + track.contact.confidence * 35 - track.offRoad * 0.25;
          var selection = {
            squad: sq,
            spec: mission,
            vehicleId: quote.vehicle.id,
            objectiveId: track.likelyObjectiveId,
            roadId: track.roadId,
            contactId: track.contact.squadId,
            observedAt: track.contact.observedAt,
            /* Report-fed: hold the post until the column's slowest plausible
               arrival, not its earliest; an early expiry abandons the ambush
               just before the column arrives. */
            expiresAt: Math.min(
              track.contact.observedAt + 720,
              sim.time +
                Math.max(
                  180,
                  (reportFed && track.enemyLatest != null ? track.enemyLatest : track.enemyETA) - age + 80
                )
            ),
            enemyETA: track.enemyETA - age,
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
        noFleet: 0,
        unavailableSquads: 0,
        eligibleSquadEvaluations: 0,
        noRoadGraphPath: 0,
        pathEvaluations: 0,
        failedTransportQuotes: 0,
        viableTransportQuotes: 0,
        arrivalTooLate: 0,
        bestMarginSeconds: -Infinity
      };
    ev.contacts.forEach(function (contact) {
      corridorTracks(town, contact, faction).forEach(function (track) {
        track.report = ev;
        evaluated++;
        var proposal = quoteFor(sim, faction, track, diagnostic);
        if (proposal && (!best || proposal.score > best.score)) best = proposal;
      });
    });
    diagnostic.bestMarginSeconds = isFinite(diagnostic.bestMarginSeconds)
      ? +diagnostic.bestMarginSeconds.toFixed(1)
      : null;
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
      if (
        !key ||
        sq.state === 'retreat' ||
        sq.isPlayer ||
        sq._preparedDefenseRequest ||
        !(sq.members || []).some(function (m) {
          return m && !m.dead;
        })
      )
        return;
      (byBase[key] || (byBase[key] = [])).push(sq);
    });
    return Object.keys(byBase)
      .sort()
      .filter(function (key) {
        return byBase[key].length >= 2;
      })
      .map(function (key) {
        return { baseId: key, lead: byBase[key][0], screen: byBase[key][1] };
      });
  }
  function pairFor(sim, sq) {
    return (
      pairs(sim, sq.faction).find(function (pair) {
        return pair.screen === sq;
      }) || null
    );
  }
  function reserveSquad(sim, sq) {
    return !!(enabled(sim) && sq && pairFor(sim, sq));
  }
  function reservePending(sim, faction) {
    return (
      enabled(sim) &&
      sim.time < 600 &&
      pairs(sim, faction).some(function (pair) {
        var m = pair.screen._macroMission;
        return m && m.intent === 'reserve' && m.interceptReserve;
      })
    );
  }
  function screeningPoint(town, objectiveId, faction) {
    var obj = objective(town, objectiveId);
    if (!obj) return null;
    var sign = faction === 'us' ? 1 : -1;
    var options = (town.roads || []).reduce(function (out, road) {
      var id =
        road.fromObjectiveId === objectiveId
          ? road.toObjectiveId
          : road.toObjectiveId === objectiveId
            ? road.fromObjectiveId
            : null;
      if (!id) return out;
      var other = objective(town, id);
      if (!other || (other.z - obj.z) * sign < 100) return out;
      var length = d(obj, other);
      if (length < 240) return out;
      var travel = Math.min(340, Math.max(215, length * 0.36));
      return out.concat([
        {
          objective: obj,
          roadId: road.id || String(objectiveId) + ':' + id,
          point: {
            x: obj.x + ((other.x - obj.x) * travel) / length,
            z: obj.z + ((other.z - obj.z) * travel) / length
          },
          forwardM: travel,
          length: length
        }
      ]);
    }, []);
    return (
      options.sort(function (a, b) {
        return b.forwardM - a.forwardM || String(a.roadId).localeCompare(String(b.roadId));
      })[0] || null
    );
  }
  var SCREEN_LAUNCH_DELAY = 35;
  function screenOpportunity(sim, faction, pair) {
    var lead = pair.lead,
      screen = pair.screen,
      mission =
        lead &&
        (lead._macroMission && lead._macroMission.intent === 'capture'
          ? lead._macroMission
          : lead._lastMacroMission),
      town = sim.scene.metadata.battleScenario;
    if (
      !mission ||
      !mission.objectiveId ||
      !screen ||
      !(
        screen._macroMission &&
        screen._macroMission.intent === 'reserve' &&
        screen._macroMission.interceptReserve
      ) ||
      lead.inContact ||
      screen.inContact ||
      screen._transportUsed ||
      !(mission.observations && isFinite(mission.observations.at)) ||
      sim.time - mission.observations.at < SCREEN_LAUNCH_DELAY
    )
      return null;
    var obj = objective(town, mission.objectiveId);
    if (!obj || obj.baseFaction) return null;
    var status = sim.objectiveControl && sim.objectiveControl.sectors && sim.objectiveControl.sectors[obj.id];
    // Do NOT wait until the lead captures the objective. The real second
    // truck rolls after a short General-issued delay while the first truck
    // approaches. A known hostile-held objective is not a safe bypass.
    // No reports is uncertainty, not a claim that the road is empty.
    if (status && status.owner && status.owner !== 'neutral' && status.owner !== faction) return null;
    var picture = root.BattleTacticalSituation && root.BattleTacticalSituation.compute(sim, faction);
    if (!picture) return null;
    var danger = picture.contacts.some(function (c) {
      return c && c.age <= 12 && isFinite(c.x) && isFinite(c.z) && d(c, obj) < 180;
    });
    if (danger) return null;
    var leadPos = lead.members.filter(function (m) {
      return m && !m.dead && m.root && m.root.position;
    });
    if (!leadPos.length) return null;
    var center = {
      x:
        leadPos.reduce(function (v, m) {
          return v + m.root.position.x;
        }, 0) / leadPos.length,
      z:
        leadPos.reduce(function (v, m) {
          return v + m.root.position.z;
        }, 0) / leadPos.length
    };
    // Lead must have an active approach, not necessarily already be on point.
    if (mission.status !== 'issued' && mission.status !== 'executing') return null;
    var post = screeningPoint(town, obj.id, faction);
    if (!post) return null;
    if (
      picture.contacts.some(function (c) {
        return c && c.age <= 12 && isFinite(c.x) && isFinite(c.z) && d(c, post.point) < 160;
      })
    )
      return null;
    var route =
      root.BattleCommanderRoutes && root.BattleCommanderRoutes.missionRouteFor
        ? root.BattleCommanderRoutes.missionRouteFor(screen, town, obj.id, screen.baseHome || screen.home)
        : [];
    route = route.concat([{ x: obj.x, z: obj.z }]);
    var spec = {
      owner: 'force-command',
      intent: 'screen',
      action: 'screen',
      status: 'issued',
      objectiveId: null,
      point: post.point,
      route: route,
      role: 'recon',
      screen: {
        leadSquadId: lead.id,
        securedObjectiveId: obj.id,
        roadId: post.roadId,
        forwardM: +post.forwardM.toFixed(1),
        standoffMetres: 25,
        launchedBeforeCapture: !status || status.owner !== faction,
        orderedAt: sim.time
      }
    };
    var transport = root.BattleSquadTransport;
    var quote = transport && transport.quoteMission && transport.quoteMission(sim, screen, spec);
    return quote ? { spec: spec, squad: screen, quote: quote, lead: lead } : null;
  }
  function supportOpportunity(sim, faction, pair) {
    var lead = pair.lead,
      screen = pair.screen,
      mission = lead && lead._macroMission,
      town = sim.scene.metadata.battleScenario;
    if (
      !lead ||
      !screen ||
      !mission ||
      mission.intent !== 'capture' ||
      !mission.objectiveId ||
      !(
        screen._macroMission &&
        screen._macroMission.intent === 'reserve' &&
        screen._macroMission.interceptReserve
      ) ||
      screen.inContact ||
      screen._transportUsed
    )
      return null;
    var obj = objective(town, mission.objectiveId);
    if (!obj || obj.baseFaction) return null;
    var men = lead.members.filter(function (m) {
      return m && !m.dead && m.root && m.root.position;
    });
    if (!men.length) return null;
    var pos = {
      x:
        men.reduce(function (v, m) {
          return v + m.root.position.x;
        }, 0) / men.length,
      z:
        men.reduce(function (v, m) {
          return v + m.root.position.z;
        }, 0) / men.length
    };
    if (d(pos, obj) > 250) return null;
    var picture = root.BattleTacticalSituation && root.BattleTacticalSituation.compute(sim, faction);
    if (!picture) return null;
    var reports = picture.contacts.filter(function (c) {
      return c && c.age <= 12 && isFinite(c.x) && isFinite(c.z) && d(c, obj) <= 200;
    });
    if (!lead.inContact && !reports.length) return null;
    var route =
      root.BattleCommanderRoutes && root.BattleCommanderRoutes.missionRouteFor
        ? root.BattleCommanderRoutes.missionRouteFor(screen, town, obj.id, screen.baseHome || screen.home)
        : [];
    var spec = {
      owner: 'force-command',
      intent: 'capture',
      action: 'assault',
      status: 'issued',
      objectiveId: obj.id,
      point: { x: obj.x, z: obj.z },
      role: 'support',
      route: route
    };
    var transport = root.BattleSquadTransport;
    var quote = transport && transport.quoteMission && transport.quoteMission(sim, screen, spec);
    return quote
      ? {
          spec: spec,
          squad: screen,
          lead: lead,
          quote: quote,
          reportCount: reports.length,
          leadInContact: !!lead.inContact
        }
      : null;
  }
  function maybeScreen(sim, faction, issue) {
    if (!enabled(sim) || typeof issue !== 'function') return null;
    var stateForFaction = state(sim)[faction];
    for (var pair of pairs(sim, faction)) {
      // Existing frontline resistance changes the second truck's purpose:
      // assist the real lead squad, never overrun it into an alleged ambush.
      var support = supportOpportunity(sim, faction, pair);
      if (support) {
        var reinforcement = issue(support.squad, support.spec, 'second-truck-support-contested'),
          carrier = support.squad._transport;
        if (
          reinforcement &&
          reinforcement.intent === 'capture' &&
          carrier &&
          carrier.vehicleId === support.quote.vehicle.id
        ) {
          var supportRecord = {
            at: sim.time,
            leadSquadId: pair.lead.id,
            supportSquadId: pair.screen.id,
            objectiveId: support.spec.objectiveId,
            vehicleId: carrier.vehicleId,
            reportedContacts: support.reportCount,
            leadInContact: support.leadInContact
          };
          (stateForFaction.supports || (stateForFaction.supports = [])).push(supportRecord);
          event(sim, 'second-truck-reinforcement', { faction: faction, ...supportRecord });
          return supportRecord;
        }
      }
      var opportunity = screenOpportunity(sim, faction, pair);
      if (!opportunity) continue;
      var m = issue(opportunity.squad, opportunity.spec, 'forward-screen-uncontested');
      var t = opportunity.squad._transport;
      if (!m || m.intent !== 'screen' || !t || t.vehicleId !== opportunity.quote.vehicle.id) {
        event(sim, 'screen-grant-failed', { faction: faction, squad: pair.screen.id });
        continue;
      }
      stateForFaction.screens = stateForFaction.screens || {};
      stateForFaction.screens[pair.screen.id] = {
        squadId: pair.screen.id,
        leadSquadId: pair.lead.id,
        objectiveId: opportunity.spec.screen.securedObjectiveId,
        vehicleId: t.vehicleId,
        roadId: opportunity.spec.screen.roadId,
        orderAt: sim.time,
        post: opportunity.spec.point,
        reportCount: 0,
        atPost: null,
        observations: {}
      };
      stateForFaction.screen = stateForFaction.screens[pair.screen.id]; // last dispatch for UI
      event(sim, 'screen-ordered', { faction: faction, ...stateForFaction.screen });
      return stateForFaction.screen;
    }
    return null;
  }
  function screeningSquad(sim, faction, st) {
    return (
      st &&
      (sim.factions[faction].squads || []).find(function (sq) {
        return sq.id === st.squadId && sq._macroMission && sq._macroMission.intent === 'screen';
      })
    );
  }
  /* Upward ground reports only: BattleTacticalSituation reads stored
     individual Soldier beliefs. No enemy actor access, no refreshed LOS,
     no synthetic position, and no shared intelligence across factions. */
  function maybeScreenReport(sim, faction, issue) {
    if (!enabled(sim) || typeof issue !== 'function' || !root.BattleTacticalSituation) return null;
    var records = Object.values(state(sim)[faction].screens || {});
    for (var i = 0; i < records.length; i++) {
      var issued = screenReportOne(sim, faction, issue, records[i]);
      if (issued) return issued;
    }
    return null;
  }
  function screenReportOne(sim, faction, issue, st) {
    var sq = screeningSquad(sim, faction, st),
      onPost = sq && sq._missionExecution && sq._missionExecution.screenOnPostAt;
    if (!st || !sq || !onPost) return null;
    if (st.atPost == null) {
      st.atPost = onPost;
      event(sim, 'screen-established', { faction: faction, squad: sq.id, at: onPost, roadId: st.roadId });
    }
    var picture = root.BattleTacticalSituation.compute(sim, faction);
    if (!picture) return null;
    var rows = picture.contacts.filter(function (c) {
      return (
        c &&
        c.squad === sq.id &&
        c.provenance === 'member-belief' &&
        c.source === 'seen' &&
        isFinite(c.at) &&
        c.at >= onPost &&
        sim.time - c.at <= 6 &&
        isFinite(c.x) &&
        isFinite(c.z) &&
        c.targetId != null &&
        c.confidence >= 0.5
      );
    });
    var tracks = [];
    rows.forEach(function (c) {
      var id = String(c.targetId),
        prior = st.observations[id];
      if (!prior) {
        st.observations[id] = { x: c.x, z: c.z, at: c.at };
        st.reportCount++;
        event(sim, 'screen-contact-relayed', {
          faction: faction,
          squad: sq.id,
          targetId: id,
          at: c.at,
          x: +c.x.toFixed(1),
          z: +c.z.toFixed(1),
          source: 'firsthand-soldier-belief'
        });
        return;
      }
      var elapsed = c.at - prior.at,
        travelled = d(c, prior);
      if (elapsed < 3) return;
      // Two actual firsthand reports are required to infer velocity.
      st.observations[id] = { x: c.x, z: c.z, at: c.at };
      if (elapsed > 16 || travelled < 5) return;
      var speed = travelled / elapsed;
      if (speed < 0.8 || speed > 14) return;
      tracks.push({
        squadId: id,
        source: 'forward-screen',
        observerSquadId: sq.id,
        observedAt: c.at,
        validUntil: c.at + 30,
        x: Math.round(c.x / 20) * 20,
        z: Math.round(c.z / 20) * 20,
        headingRadians: (Math.round((Math.atan2(c.x - prior.x, c.z - prior.z) * 6) / Math.PI) * Math.PI) / 6,
        speedMps: Math.round(speed * 2) / 2,
        positionUncertaintyM: 35,
        speedUncertaintyMps: 0.8,
        confidence: Math.min(0.85, c.confidence)
      });
    });
    if (!tracks.length) return null;
    var town = sim.scene.metadata.battleScenario,
      men = (sq.members || []).filter(function (m) {
        return m && !m.dead && m.root && m.root.position;
      });
    if (!men.length || sq.inContact) return null;
    var pos = {
      x:
        men.reduce(function (v, m) {
          return v + m.root.position.x;
        }, 0) / men.length,
      z:
        men.reduce(function (v, m) {
          return v + m.root.position.z;
        }, 0) / men.length
    };
    var winner = null,
      evaluated = 0;
    tracks.forEach(function (track) {
      corridorTracks(town, track, faction).forEach(function (road) {
        evaluated++;
        var metres = d(pos, road.point);
        if (metres > 420) return; // Existing screen post may already be the best ambush point.
        // On foot from a REAL observation post: slow conservative pace,
        // setup interval, and additional uncertainty. No second truck spawn.
        var friendlyETA = metres / 1.35 + 35 + 25,
          margin = road.enemyETA - friendlyETA;
        if (margin <= 25) return;
        var result = {
          point: road.point,
          track: track,
          road: road,
          friendlyETA: friendlyETA,
          margin: margin,
          score: margin - metres * 0.03 + road.alignment * 25
        };
        if (!winner || result.score > winner.score) winner = result;
      });
    });
    event(sim, 'screen-recon-assessed', {
      faction: faction,
      squad: sq.id,
      targetTracks: tracks.length,
      corridors: evaluated,
      result: winner ? 'feasible' : 'declined'
    });
    if (!winner) return null;
    var spec = {
      owner: 'force-command',
      intent: 'intercept',
      action: 'intercept',
      role: 'recon',
      point: winner.point,
      route: [],
      objectiveId: null,
      intercept: {
        source: 'forward-screen',
        mode: 'foot',
        contactId: winner.track.squadId,
        observerSquadId: sq.id,
        roadId: winner.road.roadId,
        likelyObjectiveId: winner.road.likelyObjectiveId,
        observedAt: winner.track.observedAt,
        expiresAt: sim.time + Math.max(100, winner.road.enemyETA + 40),
        enemyETA: +winner.road.enemyETA.toFixed(1),
        friendlyETA: +winner.friendlyETA.toFixed(1),
        margin: +winner.margin.toFixed(1),
        confidence: winner.track.confidence
      }
    };
    var m = issue(sq, spec, 'forward-screen-report-intercept');
    if (!m || m.intent !== 'intercept') return null;
    st.intercept = {
      at: sim.time,
      contactId: winner.track.squadId,
      roadId: winner.road.roadId,
      margin: +winner.margin.toFixed(1),
      missionVersion: m.version
    };
    event(sim, 'forward-screen-intercept-ordered', { faction: faction, squad: sq.id, ...st.intercept });
    return st.intercept;
  }
  function event(sim, kind, data) {
    if (root.BattleTelemetry && root.BattleTelemetry.record)
      root.BattleTelemetry.record('strategic-interception-' + kind, data, sim);
  }
  function maybeIssue(sim, faction, issue) {
    if (!enabled(sim) || !root.BattleAerialRecon || typeof issue !== 'function') return null;
    // Purpose-first: do not steal the designated second truck before it
    // establishes a ground screen for the lead squad's secured objective.
    if (reservePending(sim, faction)) return null;
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
    supportOpportunity: supportOpportunity,
    maybeScreen: maybeScreen,
    maybeScreenReport: maybeScreenReport,
    choose: choose,
    maybeIssue: maybeIssue,
    summary: function (sim) {
      return state(sim);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
