/* Opt-in strategic abstract transport. Macro grants a road journey; this squad-level
   task owns boarding, a single carrier position and dismount. Individual infantry
   navigation and fire resume only after the carrier releases the passengers. */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleSquadTransport) return;

  var SPEED_ROAD = 12,
    SPEED_JOIN = 3.8,
    BOARD_SPEED = 2.5,
    DISEMBARK_METRES = 180,
    MIN_TRIP = 650,
    JOIN_MAX = 65,
    BOARD_TIMEOUT = 35,
    VEHICLES_PER_BASE = 2,
    SEAT_TOLERANCE = 0.2,
    BOARD_STAGGER = 0.8,
    TURNOUT_METRES = 11,
    SCREEN_STANDOFF = 25,
    NEARBY_TRUCK_METRES = 200,
    EPS = 0.00001;
  function position(p) {
    return p && isFinite(+p.x) && isFinite(+p.z) ? { x: +p.x, z: +p.z } : null;
  }
  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
  function alive(sq) {
    return (sq.members || []).filter(function (s) {
      return !s.dead && s.root && s.root.position;
    });
  }
  function middle(sq) {
    var members = alive(sq),
      x = 0,
      z = 0;
    if (!members.length) return null;
    members.forEach(function (s) {
      x += +s.root.position.x;
      z += +s.root.position.z;
    });
    return { x: x / members.length, z: z / members.length };
  }
  function safe(sim, a, b, vehicleId) {
    var N = root.BattleNavigation,
      map = sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario,
      width = map && map.map && map.map.width,
      depth = map && map.map && map.map.depth;
    if (!a || !b || !N || typeof N.movementClear !== 'function') return false;
    if (width && (Math.abs(b.x) >= width / 2 - 4 || Math.abs(a.x) >= width / 2 - 4)) return false;
    if (depth && (Math.abs(b.z) >= depth / 2 - 4 || Math.abs(a.z) >= depth / 2 - 4)) return false;
    try {
      return !!N.movementClear(a, b, vehicleId ? { ignoreDynamicId: vehicleId } : undefined);
    } catch (_) {
      return false;
    }
  }
  function toRoad(p, road) {
    var dx = road.bx - road.ax,
      dz = road.bz - road.az,
      den = dx * dx + dz * dz;
    if (den < 1) return Infinity;
    var t = Math.max(0, Math.min(1, ((p.x - road.ax) * dx + (p.z - road.az) * dz) / den));
    return Math.hypot(p.x - road.ax - dx * t, p.z - road.az - dz * t);
  }
  /* Both endpoints must belong to the SAME road edge, avoiding invented
     diagonal shortcuts across intersections and parallel corridors. */
  function sameRoad(town, a, b) {
    return (town.roads || []).some(function (r) {
      var tol = Math.max(3, (+r.width || 12) * 0.45);
      return toRoad(a, r) <= tol && toRoad(b, r) <= tol;
    });
  }
  function memberSeat(i, n, center, heading) {
    if (accessOn()) {
      var front = i === 0 || i === n - 1,
        x = i === 0 ? -0.45 : i === n - 1 ? 0.4 : i <= 4 ? 0.8 : -0.8,
        z = front ? 0.7 : -0.35 - ((i - 1) % 4) * 0.73;
      return accessPoint({ position: center, heading: heading }, { x: x, z: z });
    }
    var across = { x: -heading.z, z: heading.x },
      lateral = i % 2 ? 0.8 : -0.8,
      longitudinal = (Math.floor(i / 2) - (Math.ceil(n / 2) - 1) * 0.5) * 1.35;
    return {
      x: center.x + across.x * lateral + heading.x * longitudinal,
      z: center.z + across.z * lateral + heading.z * longitudinal
    };
  }
  function accessOn() {
    return /(?:^|[?&])truckAccess=1(?:&|$)/.test((root.location && root.location.search) || '');
  }
  function accessPoint(t, p) {
    return {
      x: t.position.x + t.heading.z * p.x + t.heading.x * p.z,
      z: t.position.z - t.heading.x * p.x + t.heading.z * p.z
    };
  }
  function accessLocal(t, p) {
    var x = p.x - t.position.x,
      z = p.z - t.position.z;
    return { x: x * t.heading.z - z * t.heading.x, z: x * t.heading.x + z * t.heading.z };
  }
  function accessDoor(rank) {
    return rank === 0 ? { x: -1.85, z: 0.7 } : rank === 1 ? { x: 1.85, z: 0.7 } : { x: 0, z: -3.7 };
  }
  // Visibility graph around the 6.2m body. Walk around its footprint, never through it.
  function bodyClear(a, b) {
    var lo = 0,
      hi = 1,
      axes = [
        ['x', 1.6],
        ['z', 3.25]
      ];
    for (var k = 0; k < axes.length; k++) {
      var key = axes[k][0],
        half = axes[k][1],
        d = b[key] - a[key];
      if (Math.abs(d) < EPS) {
        if (Math.abs(a[key]) >= half) return true;
        continue;
      }
      var u = (-half - a[key]) / d,
        v = (half - a[key]) / d;
      lo = Math.max(lo, Math.min(u, v));
      hi = Math.min(hi, Math.max(u, v));
      if (lo >= hi - EPS) return true;
    }
    return hi <= EPS || lo >= 1 - EPS;
  }
  function accessWaypoint(sim, t, from, target) {
    var a = accessLocal(t, from),
      b = accessLocal(t, target);
    if (Math.abs(a.x) < 1.6 && Math.abs(a.z) < 3.25) {
      // A pre-existing spawn inside a parked truck first walks out to its nearest side.
      return accessPoint(t, { x: a.x < 0 ? -1.85 : 1.85, z: a.z });
    }
    var nodes = [
        a,
        b,
        { x: -1.85, z: -3.7 },
        { x: 1.85, z: -3.7 },
        { x: -1.85, z: 3.7 },
        { x: 1.85, z: 3.7 }
      ],
      costs = [0, Infinity, Infinity, Infinity, Infinity, Infinity],
      prev = [],
      done = [];
    for (var step = 0; step < nodes.length; step++) {
      var u = -1;
      for (var i = 0; i < nodes.length; i++) if (!done[i] && (u < 0 || costs[i] < costs[u])) u = i;
      if (u < 0 || !isFinite(costs[u]) || u === 1) break;
      done[u] = true;
      for (var j = 0; j < nodes.length; j++) {
        if (done[j] || !bodyClear(nodes[u], nodes[j])) continue;
        if (!safe(sim, accessPoint(t, nodes[u]), accessPoint(t, nodes[j]))) continue;
        var cost = costs[u] + dist(nodes[u], nodes[j]);
        if (cost < costs[j] - EPS) {
          costs[j] = cost;
          prev[j] = u;
        }
      }
    }
    if (!isFinite(costs[1])) return null;
    var next = 1;
    while (prev[next] !== 0 && prev[next] != null) next = prev[next];
    return accessPoint(t, nodes[next]);
  }
  function heading(a, b) {
    var dx = b.x - a.x,
      dz = b.z - a.z,
      len = Math.hypot(dx, dz) || 1;
    return { x: dx / len, z: dz / len };
  }
  /* Cut exactly the final 180 m of a REAL road path: passengers approach
     within walking reach and never drive across the defended objective. */
  function plan(town, origin, mission, minimumTrip) {
    var standoff =
        mission.intent === 'screen'
          ? Math.min(
              60,
              Math.max(15, +((mission.screen && mission.screen.standoffMetres) || SCREEN_STANDOFF))
            )
          : DISEMBARK_METRES,
      goal = position(mission.point),
      points = [position(origin)].concat((mission.route || []).map(position)).concat([goal]),
      legs = [],
      i;
    if (
      !goal ||
      points.some(function (p) {
        return !p;
      })
    )
      return null;
    for (i = 1; i < points.length; i++) {
      var a = points[i - 1],
        b = points[i],
        length = dist(a, b);
      if (length <= 1) continue;
      var road = sameRoad(town, a, b);
      /* A short join from a spawn parking bay onto the road is permissible.
         No mid-route offroad shortcuts, and never accelerate free infantry. */
      if (!road && (legs.length > 0 || length > JOIN_MAX)) return null;
      legs.push({ a: a, b: b, length: length, speed: road ? SPEED_ROAD : SPEED_JOIN });
    }
    var total = legs.reduce(function (n, leg) {
      return n + leg.length;
    }, 0);
    if (total < (minimumTrip == null ? MIN_TRIP : minimumTrip) + standoff) return null;
    var travel = total - standoff,
      used = 0,
      path = [],
      originPoint = points[0];
    for (i = 0; i < legs.length; i++) {
      var leg = legs[i],
        remaining = travel - used;
      if (remaining <= EPS) break;
      if (remaining < leg.length - EPS) {
        var t = remaining / leg.length;
        path.push({
          point: { x: leg.a.x + (leg.b.x - leg.a.x) * t, z: leg.a.z + (leg.b.z - leg.a.z) * t },
          speed: leg.speed
        });
        used = travel;
        break;
      }
      path.push({ point: position(leg.b), speed: leg.speed });
      used += leg.length;
    }
    return path.length
      ? {
          path: path,
          destination: path[path.length - 1].point,
          goal: goal,
          pathMetres: travel,
          totalRoadMetres: total,
          estimatedDriveSeconds: legs.reduce(function (sec, leg, index) {
            var before = legs.slice(0, index).reduce(function (d, q) {
              return d + q.length;
            }, 0);
            return sec + Math.max(0, Math.min(leg.length, travel - before)) / leg.speed;
          }, 0),
          origin: originPoint,
          standoffMetres: standoff
        }
      : null;
  }
  function enabled(sim) {
    var scenario = sim && sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario,
      params = root.location && root.location.search;
    return !!(
      scenario &&
      scenario.profile === 'strategic' &&
      /(?:^|[?&])motorTransport=1(?:&|$)/.test(params || '')
    );
  }
  /* Vehicles belong to bases and exist at battle initialization, not at
     mission grant. The parking bays are future garage doors: replacing the
     location provider must not change mission or passenger ownership. */
  function initializeFleet(sim) {
    var town = sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario,
      fleet = { version: 1, vehicles: [] };
    if (sim.obstacles) sim.obstacles.__dynamicFootprints = [];
    if (!enabled(sim) || !town || !town.spawnZones) {
      sim._strategicTransportFleet = fleet;
      return fleet;
    }
    ['us', 'ge'].forEach(function (faction) {
      var bases = (town.spawnZones[faction] && town.spawnZones[faction].bases) || [];
      bases.forEach(function (base, baseIndex) {
        var road = (town.roads || []).find(function (r) {
          return r.fromObjectiveId === base.objectiveId || r.toObjectiveId === base.objectiveId;
        });
        if (!road) return;
        var start = road.fromObjectiveId === base.objectiveId,
          dx = start ? road.bx - road.ax : road.ax - road.bx,
          dz = start ? road.bz - road.az : road.az - road.bz,
          length = Math.hypot(dx, dz);
        if (length < 1) return;
        var h = { x: dx / length, z: dz / length },
          lateral = { x: -h.z, z: h.x };
        for (var slot = 0; slot < VEHICLES_PER_BASE; slot++) {
          // Parking is deliberately outside the public carriageway; no
          // traffic blocker, AI occluder or garage object is conjured here.
          var along = slot === 0 ? 12 : 24,
            side = slot === 0 ? 1 : -1,
            join = { x: +base.x + h.x * along, z: +base.z + h.z * along },
            parking = { x: join.x + lateral.x * side * 12, z: join.z + lateral.z * side * 12 };
          fleet.vehicles.push({
            id: faction + '-base-' + baseIndex + '-truck-' + slot,
            faction: faction,
            baseId: base.id,
            baseIndex: baseIndex,
            slot: slot,
            parking: parking,
            join: join,
            position: position(parking),
            heading: h,
            phase: 'parked',
            squadId: null
          });
        }
      });
    });
    sim._strategicTransportFleet = fleet;
    // Live, simulation-owned volumes; renderer readiness never controls collision.
    // Keep the tiny dynamic set separate from the terrain's static spatial index.
    if (
      sim.obstacles &&
      /(?:^|[?&])truckCollision=1(?:&|$)/.test((root.location && root.location.search) || '')
    ) {
      sim.obstacles.__dynamicFootprints = fleet.vehicles.map(function (v) {
        var fp = {
          id: v.id,
          type: 'truck',
          shape: 'obb',
          hx: 1.25,
          hz: 3.1,
          height: 2.8,
          impactMaterial: 'metal'
        };
        Object.defineProperties(fp, {
          x: {
            enumerable: true,
            get: function () {
              return v.position.x;
            }
          },
          z: {
            enumerable: true,
            get: function () {
              return v.position.z;
            }
          },
          y: {
            enumerable: true,
            get: function () {
              return sim.heightAt(v.position.x, v.position.z);
            }
          },
          ux: {
            enumerable: true,
            get: function () {
              return v.heading.z;
            }
          },
          uz: {
            enumerable: true,
            get: function () {
              return -v.heading.x;
            }
          },
          vx: {
            enumerable: true,
            get: function () {
              return v.heading.x;
            }
          },
          vz: {
            enumerable: true,
            get: function () {
              return v.heading.z;
            }
          }
        });
        return fp;
      });
    }
    return fleet;
  }
  function vehicleFor(sim, id) {
    var fleet = sim._strategicTransportFleet;
    return (
      fleet &&
      fleet.vehicles.find(function (v) {
        return v.id === id;
      })
    );
  }
  function nearestRoadEntry(town, where) {
    var result = null;
    (town.roads || []).forEach(function (road) {
      var dx = road.bx - road.ax,
        dz = road.bz - road.az,
        length2 = dx * dx + dz * dz;
      if (length2 < 1) return;
      var t = Math.max(0, Math.min(1, ((where.x - road.ax) * dx + (where.z - road.az) * dz) / length2)),
        point = { x: road.ax + dx * t, z: road.az + dz * t },
        distance = dist(where, point);
      if (!result || distance < result.distance) result = { point: point, distance: distance };
    });
    return result && result.distance <= 32 ? result.point : null;
  }
  /* A brief that names its road into the objective (front lines, approachRoadId) is re-planned
     through that road's far end; otherwise the shortest road, as before. */
  function briefRoute(town, sq, mission, goalId, from, planner) {
    var via = root.BattleCommanderRoutes.missionRouteVia,
      road =
        mission.approachRoadId &&
        (town.roads || []).find(function (r) {
          return r.id === mission.approachRoadId;
        }),
      entryId = road && (road.fromObjectiveId === goalId ? road.toObjectiveId : road.fromObjectiveId),
      routed = entryId && via ? via(sq, town, goalId, from, entryId) : null;
    return routed || planner(sq, town, goalId, from);
  }
  /* ?truckOnRoad=0 restores re-planning a stopped truck through its road's entry even when it
     already stands on that road into the goal: a truck that had dropped its squad 180 m short
     drove back to the base end of the road and down again to the same spot. */
  function onRoadOn() {
    return !/(?:^|[?&])truckOnRoad=0(?:&|$)/.test((root.location && root.location.search) || '');
  }
  function parkingRoute(sim, town, sq, vehicle, mission) {
    var goalId = mission.objectiveId || (mission.screen && mission.screen.securedObjectiveId),
      roadStart = vehicle.phase === 'parked' ? vehicle.join : vehicle.position,
      planner = root.BattleCommanderRoutes && root.BattleCommanderRoutes.missionRouteFor,
      supplied =
        vehicle.phase === 'parked' ? [vehicle.join].concat(mission.route || []) : mission.route || [],
      lines = root.BattleFrontLines,
      // A stopped truck already on a road into the goal drives on down it from where it stands.
      here =
        vehicle.phase === 'stopped' && goalId && onRoadOn() && lines && lines.alreadyOn
          ? lines.alreadyOn(sim, sq, goalId, vehicle.position)
          : null,
      // The General may have briefed from the base before a truck was
      // assigned. Re-plan from the CURRENT truck/road join to prevent an
      // immediate 180-degree turn back toward that stale base waypoint.
      regenerated = here
        ? null
        : goalId && planner
          ? briefRoute(town, sq, mission, goalId, roadStart, planner)
          : null,
      stops =
        regenerated && regenerated.length
          ? vehicle.phase === 'parked'
            ? [vehicle.join].concat(regenerated)
            : regenerated
          : here
            ? here.route
            : supplied;
    // A screen continues beyond the secured objective; that objective is
    // still a mandatory road junction even when missionRouteFor omits its end.
    if (mission.screen && goalId) {
      var secured = (town.objectives || []).find(function (o) {
        return o.id === goalId;
      });
      if (secured && (!stops.length || dist(stops[stops.length - 1], secured) > EPS))
        stops = stops.concat([position(secured)]);
    }
    if (vehicle.phase === 'stopped') {
      var entry = nearestRoadEntry(town, vehicle.position);
      if (!entry) return null;
      if (!stops.length || dist(stops[0], entry) > 3) stops = [entry].concat(stops);
    }
    return plan(
      town,
      vehicle.position,
      {
        intent: mission.intent,
        screen: mission.screen,
        point: mission.point,
        route: stops
      },
      vehicle.phase === 'stopped' ? 120 : MIN_TRIP
    );
  }
  /* ?truckSpacing=0 restores parking on a turnout another truck of the side already holds (two
     trucks briefed down the same road stopped in one spot and read as one truck "cloned"). */
  function spacingOn() {
    return !/(?:^|[?&])truckSpacing=0(?:&|$)/.test((root.location && root.location.search) || '');
  }
  /* A turnout holds one truck: one of the side's own trucks already stands there, or is driving
     to it. Own side only; where enemy trucks stop is not the crew's to know. */
  function turnoutTaken(sim, vehicle, point) {
    if (!spacingOn()) return false;
    var fleet = sim._strategicTransportFleet;
    return ((fleet && fleet.vehicles) || []).some(function (v) {
      if (v === vehicle || v.faction !== vehicle.faction) return false;
      var sq =
          v.squadId &&
          sim.factions &&
          sim.factions[v.faction] &&
          (sim.factions[v.faction].squads || []).find(function (s) {
            return s.id === v.squadId;
          }),
        t = sq && sq._transport && sq._transport.vehicleId === v.id ? sq._transport : null,
        at =
          t && (t.phase === 'boarding' || t.phase === 'embarked') && t.dismountPoint
            ? t.dismountPoint
            : v.position;
      return !!at && dist(at, point) < TURNOUT_METRES;
    });
  }
  function pullOff(sim, town, route, vehicle) {
    // Preserve the public road until the last waypoint, then park on a
    // physically clear shoulder; no silent roadside teleport or traffic stop.
    var path = route.path,
      end = path[path.length - 1].point,
      previous = path.length > 1 ? path[path.length - 2].point : vehicle.position,
      dx = end.x - previous.x,
      dz = end.z - previous.z,
      length = Math.hypot(dx, dz);
    if (length < 1) return null;
    var side = { x: -dz / length, z: dx / length },
      back = { x: -dx / length, z: -dz / length };
    // A taken turnout: the next one back down the same road, while the last leg is long enough.
    for (var k = 0; k * TURNOUT_METRES < length - 1; k++) {
      var last = { x: end.x + back.x * TURNOUT_METRES * k, z: end.z + back.z * TURNOUT_METRES * k };
      for (var direction of [vehicle.faction === 'us' ? 1 : -1, vehicle.faction === 'us' ? -1 : 1]) {
        var shoulder = {
          x: last.x + side.x * TURNOUT_METRES * direction,
          z: last.z + side.z * TURNOUT_METRES * direction
        };
        if (!safe(sim, last, shoulder, vehicle.id) || turnoutTaken(sim, vehicle, shoulder)) continue;
        if (k) path[path.length - 1] = { point: last, speed: path[path.length - 1].speed };
        return turnInto(route, path, last, shoulder, TURNOUT_METRES * k);
      }
      if (!spacingOn()) break;
    }
    return null;
  }
  function turnInto(route, path, last, shoulder, shortened) {
    path.push({ point: shoulder, speed: SPEED_JOIN });
    route.destination = shoulder;
    route.pathMetres += TURNOUT_METRES - shortened;
    route.estimatedDriveSeconds +=
      TURNOUT_METRES / SPEED_JOIN - shortened / (path[path.length - 2].speed || SPEED_JOIN);
    route.roadExit = last;
    return route;
  }
  function log(sim, sq, type, detail) {
    if (root.BattleTelemetry && root.BattleTelemetry.record)
      root.BattleTelemetry.record(
        'strategic-transport-' + type,
        {
          faction: sq.faction,
          squad: sq.id,
          at: +(+sim.time || 0).toFixed(2),
          detail: detail || null
        },
        sim
      );
  }
  function clearPassenger(s, sim) {
    if (root.BattleSim && root.BattleSim.moveTransportPassenger)
      root.BattleSim.moveTransportPassenger(sim, s, position(s.root.position), 'transport-dismounted');
    if (root.BattleMovementResolver && root.BattleMovementResolver.restoreAfterTransport)
      root.BattleMovementResolver.restoreAfterTransport(s);
  }
  /* ?truckStaysPut=0 restores sending a reused truck back to its base bay when the squad's trip
     ends before it moves (it vanished from the road and reappeared at base). */
  function staysPutOn() {
    return !/(?:^|[?&])truckStaysPut=0(?:&|$)/.test((root.location && root.location.search) || '');
  }
  function finish(sim, sq, why) {
    var t = sq._transport;
    if (!t || (t.phase !== 'boarding' && t.phase !== 'embarked')) return;
    if (t.access && t.boardedCount > 0) {
      t.phase = 'disembarking';
      t.endReason = why;
      t.disembarkStartedAt = +sim.time || 0;
      t.exitOrder = t.boardingOrder.filter(function (id) {
        return t.boardedIds.indexOf(id) >= 0;
      });
      t.exitCursor = 0;
      t.exitedIds = [];
      var truck = vehicleFor(sim, t.vehicleId);
      if (truck) truck.phase = 'disembarking';
      log(sim, sq, 'disembarking', { why: why, vehicleId: t.vehicleId });
      return;
    }
    completeFinish(sim, sq, why);
  }
  function completeFinish(sim, sq, why) {
    var t = sq._transport;
    t.phase = why === 'arrival' ? 'dismounted' : 'aborted';
    t.endedAt = +sim.time || 0;
    t.endReason = why;
    alive(sq).forEach(function (s) {
      clearPassenger(s, sim);
    });
    var vehicle = vehicleFor(sim, t.vehicleId);
    if (vehicle) {
      // A cancelled order while still in its bay frees the SAME parked truck.
      // Once driven away, it remains physically stopped at its real location.
      // A truck reused where it stood stays there; only a base truck goes back to its bay.
      var unused = t.travelled <= EPS && t.embarkedAt == null && !(t.reusedTruck && staysPutOn());
      vehicle.phase = unused ? 'parked' : 'stopped';
      vehicle.squadId = null;
      vehicle.position = unused ? position(vehicle.parking) : position(t.position);
      vehicle.heading = t.heading;
    }
    log(sim, sq, t.phase, { why: why, meters: +t.travelled.toFixed(2), vehicleId: t.vehicleId });
  }
  /* Pure, side-effect-free transport admission/ETA used by Macro before
     publication. Same real parked vehicle, same road/obstacle checks as grant. */
  function quoteMission(sim, sq, mission) {
    if (
      !enabled(sim) ||
      !sq ||
      !mission ||
      mission.owner !== 'force-command' ||
      (mission.intent !== 'capture' && mission.intent !== 'intercept' && mission.intent !== 'screen') ||
      (mission.status && mission.status !== 'issued' && mission.status !== 'executing') ||
      sq.state === 'retreat' ||
      sq.inContact ||
      sq.isPlayer ||
      sq._preparedDefenseRequest ||
      (sq._transport && (sq._transport.phase === 'embarked' || sq._transport.phase === 'boarding'))
    )
      return null;
    var home = position(sq.baseHome || sq.home),
      center = middle(sq),
      members = alive(sq),
      town = sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario;
    if (
      !center ||
      !town ||
      members.length < 3 ||
      members.some(function (s) {
        return s.isPlayer || s.suppressedUntil > sim.time || dist(position(s.root.position), center) > 32;
      })
    )
      return null;
    var fleet = sim._strategicTransportFleet,
      previousVehicleId = sq._transport && sq._transport.vehicleId,
      candidates = (fleet ? fleet.vehicles : [])
        .filter(function (v) {
          if (
            v.faction !== sq.faction ||
            v.squadId ||
            (v.phase !== 'parked' && v.phase !== 'stopped') ||
            dist(center, v.position) > NEARBY_TRUCK_METRES
          )
            return false;
          if (v.phase === 'parked') {
            var base = ((town.spawnZones[v.faction] && town.spawnZones[v.faction].bases) || [])[v.baseIndex];
            return base && dist(center, base) <= 95;
          }
          return true;
        })
        .sort(function (a, b) {
          var preferredA = a.id === previousVehicleId ? 0 : 1,
            preferredB = b.id === previousVehicleId ? 0 : 1;
          return (
            preferredA - preferredB ||
            dist(center, a.position) - dist(center, b.position) ||
            a.id.localeCompare(b.id)
          );
        });
    for (var c = 0; c < candidates.length; c++) {
      var vehicle = candidates[c],
        trial = parkingRoute(sim, town, sq, vehicle, mission);
      if (!trial || !trial.path.length) continue;
      trial = pullOff(sim, town, trial, vehicle);
      if (!trial) continue;
      var previous = vehicle.position,
        passable = safe(sim, center, vehicle.position, vehicle.id);
      for (var i = 0; passable && i < trial.path.length; i++) {
        passable = safe(sim, previous, trial.path[i].point, vehicle.id);
        previous = trial.path[i].point;
      }
      if (passable)
        return {
          vehicle: vehicle,
          route: trial,
          boardSeconds: Math.max(
            10,
            dist(center, vehicle.position) / BOARD_SPEED + 8 + Math.max(0, members.length - 1) * BOARD_STAGGER
          ),
          dismountSeconds: trial.standoffMetres / 2 + (accessOn() ? 45 : 0),
          setupSeconds: 25
        };
    }
    return null;
  }
  function considerMission(sim, sq, mission) {
    if (!sq || !mission || (mission.status !== 'issued' && mission.status !== 'executing')) return false;
    // A newly discovered truck may serve an accepted foot mission. An ended
    // ride on this same brief is not a new opportunity to repeat that ride.
    if (sq._transport && sq._transport.missionVersion === mission.version) return false;
    var quote = quoteMission(sim, sq, mission);
    if (!quote) return false;
    var vehicle = quote.vehicle,
      route = quote.route,
      members = alive(sq);
    var ledger = sim._strategicTransport || (sim._strategicTransport = { us: 0, ge: 0 });
    ledger[sq.faction]++;
    var reusedTruck = vehicle.phase === 'stopped';
    vehicle.phase = 'assigned';
    vehicle.squadId = sq.id;
    sq._transportUsed = true;
    sq._transport = {
      owner: 'squad-leader',
      grantedBy: 'force-command',
      missionVersion: mission.version,
      phase: 'boarding',
      requestedAt: +sim.time || 0,
      vehicleId: vehicle.id,
      baseId: vehicle.baseId,
      boardingCenter: position(vehicle.position),
      initialPassengerCount: members.length,
      boardingOrder: members.map(function (member) {
        return member.id;
      }),
      access: accessOn(),
      seatIds: members.map(function (member) {
        return member.id;
      }),
      boardedCount: 0,
      boardedIds: [],
      nextBoardAt: +sim.time || 0,
      // A 200m pickup takes longer than the old base-only 35s boarding cap.
      // Preserve that 35s cap for unaccepted orders; give accepted teams
      // enough physical approach + serial-seat time to finish boarding.
      boardTimeoutSeconds: Math.max(BOARD_TIMEOUT, Math.ceil(quote.boardSeconds + 15)),
      position: position(vehicle.position),
      initialPosition: position(vehicle.position),
      // No snap-turn when first passenger touches the stopped truck.
      heading: { x: vehicle.heading.x, z: vehicle.heading.z },
      path: route.path,
      leg: 0,
      travelled: 0,
      total: route.pathMetres,
      estimatedDriveSeconds: route.estimatedDriveSeconds,
      dismountPoint: route.destination,
      standoffMetres: route.standoffMetres,
      goal: route.goal,
      reusedTruck: reusedTruck
    };
    if (sq._transport.access && members.length > 1)
      sq._transport.boardingOrder = [members[0].id, members[members.length - 1].id].concat(
        members.slice(1, -1).map(function (s) {
          return s.id;
        })
      );
    members.forEach(function (s) {
      if (root.BattleNavigation && root.BattleNavigation.invalidateNavPath)
        root.BattleNavigation.invalidateNavPath(s);
    });
    log(sim, sq, 'granted', {
      missionVersion: mission.version,
      vehicleId: vehicle.id,
      baseId: vehicle.baseId,
      routeMetres: +route.pathMetres.toFixed(1),
      standoffMetres: route.standoffMetres,
      reusedTruck: reusedTruck,
      eta: +route.estimatedDriveSeconds.toFixed(1)
    });
    return true;
  }
  function advancePassenger(sim, s, point, dt, reason) {
    var from = position(s.root.position),
      d = dist(from, point),
      step = Math.min(d, BOARD_SPEED * dt),
      p =
        d > EPS
          ? { x: from.x + ((point.x - from.x) * step) / d, z: from.z + ((point.z - from.z) * step) / d }
          : from;
    if (!safe(sim, from, p)) return false;
    // Boarding is upright locomotion, not a prone/crawl animation at road speed.
    // Engagement is the sole stance writer; it owns the transition before movement.
    if (
      root.BattleEngagement &&
      root.BattleEngagement.commitStance &&
      (s.prone || s.crawling || s.crouching || s.tacticalCrouch)
    ) {
      root.BattleEngagement.commitStance(s, sim, 'stand', 0.6, 'transport-boarding');
    }
    return !!(
      root.BattleSim &&
      root.BattleSim.moveTransportPassenger &&
      root.BattleSim.moveTransportPassenger(sim, s, p, reason || 'transport-boarding', dt > 0 ? step / dt : 0)
    );
  }
  function boardAccess(sim, sq, dt) {
    var t = sq._transport,
      members = alive(sq),
      ids = t.boardingOrder,
      ready = [],
      tailWaiting = 0;
    for (var i = 0; i < ids.length; i++) {
      if (t.boardedIds.indexOf(ids[i]) >= 0) continue;
      var s = members.find(function (s) {
        return s.id === ids[i];
      });
      if (!s) {
        finish(sim, sq, 'boarding-roster-changed');
        return;
      }
      var local = accessDoor(i);
      if (i >= 2) local.z -= tailWaiting++ * 1.15;
      var target = accessPoint(t, local),
        next = accessWaypoint(sim, t, position(s.root.position), target);
      if (!next || !advancePassenger(sim, s, next, dt)) {
        finish(sim, sq, 'boarding-blocked');
        return;
      }
      if ((i < 2 || tailWaiting === 1) && dist(position(s.root.position), target) <= SEAT_TOLERANCE)
        ready.push({ s: s, rank: i });
    }
    // Ready occupants never wait for someone still approaching another entrance.
    // One admission per physical tick; the rear queue alone is FIFO.
    if (ready.length) {
      var passenger = ready[0].s,
        rank = ready[0].rank;
      var index = t.seatIds.indexOf(passenger.id),
        seat = memberSeat(index, t.seatIds.length, t.position, t.heading);
      if (!safe(sim, seat, seat, t.vehicleId)) {
        finish(sim, sq, 'seat-blocked');
        return;
      }
      root.BattleSim.moveTransportPassenger(sim, passenger, seat, 'embarked-passenger');
      t.boardedIds.push(passenger.id);
      t.boardedCount++;
      log(sim, sq, 'seat-occupied', {
        vehicleId: t.vehicleId,
        soldierId: passenger.id,
        seatIndex: index,
        entry: rank < 2 ? (rank === 0 ? 'driver-door' : 'passenger-door') : 'tailgate'
      });
    }
    if (t.boardedCount >= ids.length) {
      t.phase = 'embarked';
      t.embarkedAt = +sim.time || 0;
      log(sim, sq, 'embarked', { passengers: ids.length, vehicleId: t.vehicleId });
    }
  }
  function exitSpaceFree(sim, door, passenger) {
    var width = (root.BattleNavigationPhysicality && root.BattleNavigationPhysicality.bodyWidth) || 0.9;
    return ['us', 'ge'].every(function (f) {
      return ((sim._roster && sim._roster[f]) || []).every(function (other) {
        if (other === passenger || other.dead || !other.root) return true;
        var ride = other.squad && other.squad._transport;
        if (
          ride &&
          (ride.phase === 'embarked' ||
            (ride.phase === 'disembarking' && ride.exitedIds.indexOf(other.id) < 0) ||
            (ride.phase === 'boarding' && ride.boardedIds && ride.boardedIds.indexOf(other.id) >= 0))
        )
          return true;
        return dist(position(other.root.position), door) >= width;
      });
    });
  }
  function disembark(sim, sq, dt) {
    var t = sq._transport,
      members = alive(sq),
      allStaged = true;
    // Exited men continue walking while the next occupied seat waits only for a free exit.
    members.forEach(function (s) {
      if (t.exitedIds.indexOf(s.id) < 0) return;
      var index = t.exitOrder.indexOf(s.id),
        target = accessPoint(t, { x: (index % 2 ? 1 : -1) * 1.15, z: -5.5 - Math.floor(index / 2) * 1.15 });
      if (dist(position(s.root.position), target) > SEAT_TOLERANCE) {
        var next = accessWaypoint(sim, t, position(s.root.position), target);
        if (next) advancePassenger(sim, s, next, dt, 'transport-disembarking');
      }
      if (dist(position(s.root.position), target) > SEAT_TOLERANCE) allStaged = false;
    });
    if (t.exitCursor >= t.exitOrder.length) {
      if (allStaged) completeFinish(sim, sq, t.endReason);
      return;
    }
    var id = t.exitOrder[t.exitCursor],
      rank = t.boardingOrder.indexOf(id),
      s = members.find(function (s) {
        return s.id === id;
      });
    if (!s) {
      t.exitCursor++;
      return;
    }
    if (t.exitedIds.indexOf(id) < 0) {
      var door = accessPoint(t, accessDoor(rank));
      if (!safe(sim, door, door) || !exitSpaceFree(sim, door, s)) {
        if (!t.exitBlockedAt) {
          t.exitBlockedAt = sim.time;
          log(sim, sq, 'exit-blocked', { soldierId: id, vehicleId: t.vehicleId });
        }
        return;
      }
      root.BattleSim.moveTransportPassenger(sim, s, door, 'transport-disembarking');
      t.exitedIds.push(id);
      t.exitCursor++;
      log(sim, sq, 'seat-vacated', {
        soldierId: id,
        vehicleId: t.vehicleId,
        exit: rank < 2 ? (rank === 0 ? 'driver-door' : 'passenger-door') : 'tailgate'
      });
      return;
    }
  }
  function board(sim, sq, dt) {
    var t = sq._transport,
      members = alive(sq),
      seats = t.boardingOrder;
    if (sim.time - t.requestedAt > (t.boardTimeoutSeconds || BOARD_TIMEOUT)) {
      finish(sim, sq, 'boarding-timeout');
      return;
    }
    if (t.access) {
      boardAccess(sim, sq, dt);
      return;
    }
    // Real actors can approach together, but driver then seats 1..9 enter
    // individually. The renderer may show each seat as it is occupied.
    for (var i = 0; i < members.length; i++) {
      var index = seats.indexOf(members[i].id);
      if (index < 0) {
        finish(sim, sq, 'boarding-roster-changed');
        return;
      }
      if (index < t.boardedCount) continue;
      var target = memberSeat(index, seats.length, t.boardingCenter, t.heading);
      if (!advancePassenger(sim, members[i], target, dt)) {
        finish(sim, sq, 'boarding-blocked');
        return;
      }
    }
    if (t.boardedCount < seats.length && sim.time + EPS >= t.nextBoardAt) {
      var nextId = seats[t.boardedCount],
        passenger = members.find(function (m) {
          return m.id === nextId;
        });
      if (!passenger) {
        finish(sim, sq, 'boarding-roster-changed');
        return;
      }
      var seat = memberSeat(t.boardedCount, seats.length, t.boardingCenter, t.heading);
      if (dist(position(passenger.root.position), seat) <= SEAT_TOLERANCE) {
        t.boardedCount++;
        t.nextBoardAt = sim.time + BOARD_STAGGER;
        log(sim, sq, 'seat-occupied', {
          vehicleId: t.vehicleId,
          soldierId: passenger.id,
          seatIndex: t.boardedCount - 1
        });
      }
    }
    if (t.boardedCount >= seats.length) {
      t.phase = 'embarked';
      t.embarkedAt = +sim.time || 0;
      log(sim, sq, 'embarked', { passengers: seats.length, vehicleId: t.vehicleId });
    }
  }
  /* Truck handling (?truckPhysics=0 restores the old constant-speed, snap-turning carrier). The
     truck is a body with a heading that steers toward a point a little way down its path, so it
     turns into corners instead of snapping, speeds up and brakes, slows for bends, and holds its
     lane with the small corrections of a driver. Everything follows from the truck itself:
     - length: the 6.2 m the visual scales the model to (59 TRUCK_LENGTH); wheelbase 0.6 of it;
     - steering: front wheels lock at 35 degrees, so the tightest turn is wheelbase / tan(35);
     - grip: a loaded truck on a dirt road holds about 0.25 g sideways and brakes at 0.3 g;
     - power: it takes about twelve seconds to reach its road speed from a standstill;
     - lane: the driver's corrections stay inside a tenth of the road width, a smooth function of
       the truck's id and the distance it has driven, so seeded battles replay exactly.
     Still the one carrier owner: the same path, safety checks and passenger moves as before; a
     step the steering would make onto unsafe ground falls back to the exact path step. */
  var TRUCK_BODY_LENGTH = 6.2,
    TRUCK_WHEELBASE = TRUCK_BODY_LENGTH * 0.6,
    TRUCK_TURN_RADIUS = TRUCK_WHEELBASE / Math.tan((35 * Math.PI) / 180),
    GRAVITY = 9.81,
    TRUCK_LATERAL = 0.25 * GRAVITY,
    TRUCK_BRAKE = 0.3 * GRAVITY,
    TRUCK_ACCEL = SPEED_ROAD / 12,
    TRUCK_STEP = 0.05;
  function physicsOn() {
    return !/(?:^|[?&])truckPhysics=0(?:&|$)/.test((root.location && root.location.search) || '');
  }
  function legStart(t, i) {
    return i > 0 ? t.path[i - 1].point : t.initialPosition || t.path[0].point;
  }
  function seed(id) {
    var h = 0;
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100003;
    return h / 100003;
  }
  // The driver's drift across his lane, in metres: smooth in the distance driven.
  function laneDrift(t, width) {
    var s = t.travelled,
      k = seed(String(t.vehicleId || ''));
    return (width / 10) * (0.6 * Math.sin(s / 41 + k * 6.283) + 0.4 * Math.sin(s / 17 + k * 19.7));
  }
  function bend(a, b, c) {
    var u = heading(a, b),
      v = heading(b, c);
    return Math.acos(Math.max(-1, Math.min(1, u.x * v.x + u.z * v.z)));
  }
  // Fastest the truck may go now so it can still brake for every bend and the stop ahead.
  /* The truck steers `ahead` metres down the path, so it starts each bend that much before the
     bend's point: it must be down to the bend's speed by then. */
  function speedLimit(t, from, ahead) {
    var limit = t.path[t.leg].speed,
      along = dist(from, t.path[t.leg].point);
    for (var j = t.leg; j < t.path.length && along < 400; j++) {
      var here = t.path[j].point,
        corner;
      if (j === t.path.length - 1) corner = 0;
      else {
        var angle = bend(legStart(t, j), here, t.path[j + 1].point);
        // A bend of angle a taken on the tightest circle: v^2 = lateral grip * radius / sin(a/2).
        corner =
          angle < 0.05
            ? t.path[j + 1].speed
            : Math.sqrt((TRUCK_LATERAL * TRUCK_TURN_RADIUS) / Math.max(Math.sin(angle / 2), 0.05));
        corner = Math.min(corner, t.path[j].speed, t.path[j + 1].speed);
      }
      var room = j === t.path.length - 1 ? along : Math.max(0, along - ahead);
      limit = Math.min(limit, Math.sqrt(corner * corner + 2 * TRUCK_BRAKE * room));
      if (j + 1 < t.path.length) along += dist(here, t.path[j + 1].point);
    }
    return limit;
  }
  /* ?truckReach=0 restores steering for a point `ahead` metres down the path. At a hairpin or a
     turnout beside the truck that point could sit inside the circle of the truck's tightest
     turn, which it can never drive onto, so it circled ("donuts") until the point moved on. The
     driver now steers for where the path leaves a circle round the truck at least two turning
     radii across (any point that far off is outside both of the truck's turning circles), and
     counts a waypoint short of the stop as passed once it lies inside that circle. */
  function reachOn() {
    return !/(?:^|[?&])truckReach=0(?:&|$)/.test((root.location && root.location.search) || '');
  }
  // The point the driver steers for: a little way down the path from where the truck is.
  function aimPoint(t, from, ahead) {
    var i = t.leg,
      a = legStart(t, i),
      b = t.path[i].point,
      len = dist(a, b) || 1,
      u = Math.max(
        0,
        Math.min(1, ((from.x - a.x) * (b.x - a.x) + (from.z - a.z) * (b.z - a.z)) / (len * len))
      ),
      p = { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u },
      left = ahead;
    if (reachOn())
      for (;;) {
        var end = t.path[i].point,
          dir = heading(p, end);
        if (dist(from, end) >= ahead || i === t.path.length - 1) {
          // Where this leg leaves the circle of `ahead` round the truck (or its end).
          var bx = dir.x * (p.x - from.x) + dir.z * (p.z - from.z),
            c = Math.pow(dist(p, from), 2) - ahead * ahead,
            s = c >= 0 ? 0 : -bx + Math.sqrt(Math.max(0, bx * bx - c));
          return {
            point: dist(from, end) >= ahead ? { x: p.x + dir.x * s, z: p.z + dir.z * s } : end,
            dir: dir,
            leg: i
          };
        }
        p = end;
        i++;
      }
    for (;;) {
      var to = t.path[i].point,
        d = dist(p, to);
      if (d >= left || i === t.path.length - 1) {
        var h = heading(p, to),
          q = d >= left ? { x: p.x + h.x * left, z: p.z + h.z * left } : to;
        return { point: q, dir: h, leg: i };
      }
      left -= d;
      p = to;
      i++;
    }
  }
  function moveCarrier(sim, sq, t, members, next, newHeading, amount) {
    if (!safe(sim, t.position, next, t.vehicleId)) return 'road-blocked';
    var seats = members.map(function (s, i) {
      return { s: s, next: memberSeat(i, members.length, next, newHeading) };
    });
    for (var j = 0; j < seats.length; j++)
      if (!safe(sim, position(seats[j].s.root.position), seats[j].next, t.vehicleId))
        return 'passenger-path-blocked';
    seats.forEach(function (seat) {
      root.BattleSim.moveTransportPassenger(sim, seat.s, seat.next, 'embarked-passenger');
    });
    t.heading = newHeading;
    t.position = next;
    var vehicle = vehicleFor(sim, t.vehicleId);
    if (vehicle) {
      vehicle.position = position(next);
      vehicle.heading = newHeading;
      vehicle.phase = 'moving';
    }
    t.travelled += amount;
    return null;
  }
  function driveHandled(sim, sq, dt) {
    var t = sq._transport,
      members = alive(sq),
      town = sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario,
      width = (town && town.roads && town.roads[0] && +town.roads[0].width) || 0; /* lanes share one width */
    if (!members.length || sq.inContact) {
      finish(sim, sq, 'contact-or-no-passengers');
      return;
    }
    if (t.speed == null) t.speed = 0;
    for (var left = dt; left > EPS && t.leg < t.path.length; left -= TRUCK_STEP) {
      var h = Math.min(TRUCK_STEP, left),
        from = t.position;
      // Past the end of this leg (or on its end point): the next one.
      while (t.leg < t.path.length) {
        var a = legStart(t, t.leg),
          b = t.path[t.leg].point,
          l2 = Math.pow(dist(a, b), 2) || 1,
          u = ((from.x - a.x) * (b.x - a.x) + (from.z - a.z) * (b.z - a.z)) / l2;
        // Steering for a point `ahead` down the path, a waypoint short of the stop is passed once
        // it lies within that reach; the truck could orbit one it can never drive over exactly.
        var reach =
          reachOn() && t.leg < t.path.length - 1
            ? Math.max(2 * TRUCK_TURN_RADIUS, t.speed * 1.5)
            : Math.max(0.6, t.speed * h * 2);
        if (u < 1 && dist(from, b) > reach) break;
        t.leg++;
      }
      if (t.leg >= t.path.length) break;
      var ahead = Math.max(reachOn() ? 2 * TRUCK_TURN_RADIUS : TRUCK_TURN_RADIUS, t.speed * 1.5),
        target = speedLimit(t, from, ahead),
        speed =
          t.speed < target
            ? Math.min(target, t.speed + TRUCK_ACCEL * h)
            : Math.max(target, t.speed - TRUCK_BRAKE * h);
      // Never stall short of the stop: the last metres at a crawl.
      speed = Math.max(speed, Math.min(1, dist(from, t.path[t.path.length - 1].point)));
      var aim = aimPoint(t, from, ahead),
        onRoad = t.path[aim.leg].speed >= SPEED_ROAD - EPS && t.path.length - 1 > aim.leg,
        drift = onRoad ? laneDrift(t, width) : 0,
        goal = { x: aim.point.x - aim.dir.z * drift, z: aim.point.z + aim.dir.x * drift },
        want = heading(from, goal),
        have = t.heading || want,
        turn = Math.atan2(have.x * want.z - have.z * want.x, have.x * want.x + have.z * want.z),
        most = (speed / TRUCK_TURN_RADIUS) * h,
        yaw = Math.max(-most, Math.min(most, turn)),
        c = Math.cos(yaw),
        sn = Math.sin(yaw),
        dir = { x: have.x * c - have.z * sn, z: have.x * sn + have.z * c },
        amount = speed * h,
        next = { x: from.x + dir.x * amount, z: from.z + dir.z * amount };
      var blocked = moveCarrier(sim, sq, t, members, next, dir, amount);
      if (blocked) {
        // Steering would leave safe ground here: take the exact path step instead.
        var exact = heading(from, t.path[t.leg].point),
          step = Math.min(amount, dist(from, t.path[t.leg].point));
        blocked = moveCarrier(
          sim,
          sq,
          t,
          members,
          { x: from.x + exact.x * step, z: from.z + exact.z * step },
          exact,
          step
        );
        if (blocked) {
          finish(sim, sq, blocked);
          return;
        }
      }
      t.speed = speed;
    }
    if (t.leg >= t.path.length) finish(sim, sq, 'arrival');
  }
  function drive(sim, sq, dt) {
    if (physicsOn()) return driveHandled(sim, sq, dt);
    var t = sq._transport,
      members = alive(sq),
      remaining = dt;
    if (!members.length || sq.inContact) {
      finish(sim, sq, 'contact-or-no-passengers');
      return;
    }
    while (remaining > EPS && t.leg < t.path.length) {
      var to = t.path[t.leg],
        from = t.position,
        d = dist(from, to.point);
      if (d <= EPS) {
        t.leg++;
        continue;
      }
      var elapsed = Math.min(remaining, d / to.speed),
        dx = (to.point.x - from.x) / d,
        dz = (to.point.z - from.z) / d,
        amount = to.speed * elapsed,
        next = { x: from.x + dx * amount, z: from.z + dz * amount },
        newHeading = { x: dx, z: dz };
      if (!safe(sim, from, next, t.vehicleId)) {
        finish(sim, sq, 'road-blocked');
        return;
      }
      var seats = members.map(function (s, i) {
        return { s: s, next: memberSeat(i, members.length, next, newHeading) };
      });
      for (var j = 0; j < seats.length; j++) {
        if (!safe(sim, position(seats[j].s.root.position), seats[j].next, t.vehicleId)) {
          finish(sim, sq, 'passenger-path-blocked');
          return;
        }
      }
      seats.forEach(function (seat) {
        root.BattleSim.moveTransportPassenger(sim, seat.s, seat.next, 'embarked-passenger');
      });
      t.heading = newHeading;
      t.position = next;
      var vehicle = vehicleFor(sim, t.vehicleId);
      if (vehicle) {
        vehicle.position = position(next);
        vehicle.heading = newHeading;
        vehicle.phase = 'moving';
      }
      t.travelled += amount;
      remaining -= elapsed;
      if (d - amount <= 0.02) t.leg++;
    }
    if (t.leg >= t.path.length) finish(sim, sq, 'arrival');
  }
  function crewEyesOn() {
    return !/(?:^|[?&])crewEyes=0(?:&|$)/.test((root.location && root.location.search) || '');
  }
  function step(sim, dt) {
    if (!enabled(sim) || !(dt > 0)) return;
    ['us', 'ge'].forEach(function (faction) {
      var force = sim.factions && sim.factions[faction];
      (force ? force.squads : []).forEach(function (sq) {
        var t = sq._transport;
        if (!t) return;
        if (t.phase === 'disembarking') {
          disembark(sim, sq, dt);
          return;
        }
        if (t.phase !== 'boarding' && t.phase !== 'embarked') return;
        var m = sq._macroMission;
        if (
          !m ||
          m.version !== t.missionVersion ||
          sq.state === 'retreat' ||
          alive(sq).length !== t.initialPassengerCount ||
          alive(sq).some(function (s) {
            return s.isPlayer;
          })
        ) {
          finish(sim, sq, 'mission-changed-or-retreat');
          return;
        }
        if (sq.inContact) {
          finish(sim, sq, 'contact');
          return;
        }
        /* A man on board who has an enemy in his own sight (squad-ai perceive runs for passengers)
           stops the truck: the squad dismounts and fights on foot. Nobody else's knowledge counts.
           `?crewEyes=0` keeps the previous blind passengers. */
        if (
          crewEyesOn() &&
          alive(sq).some(function (s) {
            return !!s.target;
          })
        ) {
          finish(sim, sq, 'crew-sighting');
          return;
        }
        if (t.phase === 'boarding') {
          if (m.status === 'executing') board(sim, sq, dt);
          else if (sim.time - t.requestedAt > BOARD_TIMEOUT) finish(sim, sq, 'mission-not-accepted');
        } else drive(sim, sq, dt);
      });
    });
  }
  function reset(sim) {
    sim._strategicTransport = { us: 0, ge: 0 };
    initializeFleet(sim);
    ['us', 'ge'].forEach(function (f) {
      var force = sim.factions && sim.factions[f];
      (force ? force.squads : []).forEach(function (sq) {
        sq._transport = null;
        sq._transportUsed = false;
      });
    });
  }
  root.BattleModules.registerSystem('strategic-abstract-transport', {
    version: '0.1-isolated',
    onBattleStart: reset,
    onBattleRestart: reset,
    onSimulationStep: function (sim, p) {
      step(sim, p && +p.dt);
    }
  });
  root.BattleSquadTransport = {
    version: '0.1-isolated',
    considerMission: considerMission,
    quoteMission: quoteMission,
    isPassenger: function (s) {
      var t = s && s.squad && s.squad._transport;
      return !!(t && (t.phase === 'boarding' || t.phase === 'embarked' || t.phase === 'disembarking'));
    },
    step: step,
    finish: finish,
    summary: function (sim) {
      return ['us', 'ge'].flatMap(function (f) {
        var force = sim.factions && sim.factions[f];
        return (force ? force.squads : [])
          .filter(function (sq) {
            return !!sq._transport;
          })
          .map(function (sq) {
            var t = sq._transport;
            return {
              faction: f,
              squad: sq.id,
              phase: t.phase,
              owner: t.owner,
              missionVersion: t.missionVersion,
              vehicleId: t.vehicleId,
              baseId: t.baseId,
              travelled: +t.travelled.toFixed(1),
              boardedCount: t.boardedCount,
              standoffMetres: t.standoffMetres,
              total: +t.total.toFixed(1),
              requestedAt: +t.requestedAt.toFixed(2),
              embarkedAt: t.embarkedAt == null ? null : +t.embarkedAt.toFixed(2),
              endedAt: t.endedAt == null ? null : +t.endedAt.toFixed(2),
              expectedDriveSeconds: +t.estimatedDriveSeconds.toFixed(2),
              actualDriveSeconds:
                t.embarkedAt == null
                  ? null
                  : +Math.max(0, (t.endedAt == null ? sim.time : t.endedAt) - t.embarkedAt).toFixed(2),
              reason: t.endReason || null
            };
          });
      });
    },
    fleetSummary: function (sim) {
      var fleet = sim && sim._strategicTransportFleet;
      return fleet
        ? fleet.vehicles.map(function (v) {
            return {
              id: v.id,
              faction: v.faction,
              baseId: v.baseId,
              baseIndex: v.baseIndex,
              slot: v.slot,
              position: position(v.position),
              parking: position(v.parking),
              heading: { x: v.heading.x, z: v.heading.z },
              phase: v.phase,
              squadId: v.squadId
            };
          })
        : [];
    },
    tuning: {
      vehiclesPerBase: VEHICLES_PER_BASE,
      roadSpeed: SPEED_ROAD,
      joinSpeed: SPEED_JOIN,
      dismountMetres: DISEMBARK_METRES,
      screenDismountMetres: SCREEN_STANDOFF,
      turnoutMetres: TURNOUT_METRES,
      turnRadius: TRUCK_TURN_RADIUS,
      boardingStaggerSeconds: BOARD_STAGGER,
      minimumTrip: MIN_TRIP,
      vehiclesPerFaction: VEHICLES_PER_BASE * 3
    }
  };
  if (typeof root.GTLog === 'function') root.GTLog('[STRATEGIC] opt-in abstract motor transport ready');
})(typeof window !== 'undefined' ? window : globalThis);
