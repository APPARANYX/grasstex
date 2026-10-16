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
    PER_FACTION = 2,
    SEAT_TOLERANCE = 0.2,
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
  function safe(sim, a, b) {
    var N = root.BattleNavigation,
      map = sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario,
      width = map && map.map && map.map.width,
      depth = map && map.map && map.map.depth;
    if (!a || !b || !N || typeof N.movementClear !== 'function') return false;
    if (width && (Math.abs(b.x) >= width / 2 - 4 || Math.abs(a.x) >= width / 2 - 4)) return false;
    if (depth && (Math.abs(b.z) >= depth / 2 - 4 || Math.abs(a.z) >= depth / 2 - 4)) return false;
    try {
      return !!N.movementClear(a, b);
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
    var across = { x: -heading.z, z: heading.x },
      lateral = i % 2 ? 0.8 : -0.8,
      longitudinal = (Math.floor(i / 2) - (Math.ceil(n / 2) - 1) * 0.5) * 1.35;
    return {
      x: center.x + across.x * lateral + heading.x * longitudinal,
      z: center.z + across.z * lateral + heading.z * longitudinal
    };
  }
  function heading(a, b) {
    var dx = b.x - a.x,
      dz = b.z - a.z,
      len = Math.hypot(dx, dz) || 1;
    return { x: dx / len, z: dz / len };
  }
  /* Cut exactly the final 180 m of a REAL road path: passengers approach
     within walking reach and never drive across the defended objective. */
  function plan(town, origin, mission) {
    var goal = position(mission.point),
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
    if (total < MIN_TRIP + DISEMBARK_METRES) return null;
    var travel = total - DISEMBARK_METRES,
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
          origin: originPoint
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
    s._movementStopReason = 'transport-dismounted';
    s.moveSpeed = 0;
    s.moving = false;
    s.destination = position(s.root.position);
    s.orderDestination = position(s.root.position);
    if (root.BattleNavigation && root.BattleNavigation.invalidateNavPath)
      root.BattleNavigation.invalidateNavPath(s);
    if (root.BattleMovementResolver && root.BattleMovementResolver.release)
      root.BattleMovementResolver.release(s, 'strategic-transport');
  }
  function finish(sim, sq, why) {
    var t = sq._transport;
    if (!t || (t.phase !== 'boarding' && t.phase !== 'embarked')) return;
    t.phase = why === 'arrival' ? 'dismounted' : 'aborted';
    t.endedAt = +sim.time || 0;
    t.endReason = why;
    alive(sq).forEach(function (s) {
      clearPassenger(s, sim);
    });
    log(sim, sq, t.phase, { why: why, meters: +t.travelled.toFixed(2) });
  }
  function considerMission(sim, sq, mission) {
    if (
      !enabled(sim) ||
      !sq ||
      !mission ||
      mission.owner !== 'force-command' ||
      mission.intent !== 'capture' ||
      mission.status !== 'issued' ||
      sq.state === 'retreat' ||
      sq.inContact ||
      sq.isPlayer ||
      sq._preparedDefenseRequest ||
      sq._transportUsed
    )
      return false;
    if (sq._transport && (sq._transport.phase === 'embarked' || sq._transport.phase === 'boarding'))
      finish(sim, sq, 'new-general-mission');
    var home = position(sq.baseHome || sq.home),
      center = middle(sq),
      members = alive(sq),
      town = sim.scene && sim.scene.metadata && sim.scene.metadata.battleScenario;
    if (
      !center ||
      !home ||
      members.length < 3 ||
      dist(center, home) > 95 ||
      members.some(function (s) {
        return s.isPlayer || s.suppressedUntil > sim.time || dist(position(s.root.position), center) > 32;
      })
    )
      return false;
    var ledger = sim._strategicTransport || (sim._strategicTransport = { us: 0, ge: 0 });
    if ((ledger[sq.faction] || 0) >= PER_FACTION) return false;
    var route = plan(town, center, mission);
    if (!route || !route.path.length) return false;
    var previous = center;
    for (var i = 0; i < route.path.length; i++) {
      if (!safe(sim, previous, route.path[i].point)) return false;
      previous = route.path[i].point;
    }
    ledger[sq.faction]++;
    sq._transportUsed = true;
    sq._transport = {
      owner: 'squad-leader',
      grantedBy: 'force-command',
      missionVersion: mission.version,
      phase: 'boarding',
      requestedAt: +sim.time || 0,
      boardingCenter: center,
      initialPassengerCount: members.length,
      position: position(center),
      initialPosition: position(center),
      heading: heading(center, route.path[0].point),
      path: route.path,
      leg: 0,
      travelled: 0,
      total: route.pathMetres,
      estimatedDriveSeconds: route.estimatedDriveSeconds,
      dismountPoint: route.destination,
      goal: route.goal
    };
    log(sim, sq, 'granted', {
      missionVersion: mission.version,
      routeMetres: +route.pathMetres.toFixed(1),
      eta: +route.estimatedDriveSeconds.toFixed(1)
    });
    return true;
  }
  function advancePassenger(sim, s, point, dt) {
    var from = position(s.root.position),
      d = dist(from, point),
      step = Math.min(d, BOARD_SPEED * dt),
      p =
        d > EPS
          ? { x: from.x + ((point.x - from.x) * step) / d, z: from.z + ((point.z - from.z) * step) / d }
          : from;
    if (!safe(sim, from, p)) return false;
    s.root.position.x = p.x;
    s.root.position.z = p.z;
    s.root.position.y = sim.heightAt(p.x, p.z);
    s._movementStopReason = 'transport-boarding';
    s.moveSpeed = 0;
    s.moving = false;
    return true;
  }
  function board(sim, sq, dt) {
    var t = sq._transport,
      members = alive(sq),
      allReady = true;
    if (sim.time - t.requestedAt > BOARD_TIMEOUT) {
      finish(sim, sq, 'boarding-timeout');
      return;
    }
    for (var i = 0; i < members.length; i++) {
      var seat = memberSeat(i, members.length, t.boardingCenter, t.heading);
      if (!advancePassenger(sim, members[i], seat, dt)) {
        finish(sim, sq, 'boarding-blocked');
        return;
      }
      if (dist(position(members[i].root.position), seat) > SEAT_TOLERANCE) allReady = false;
    }
    if (allReady) {
      t.phase = 'embarked';
      t.embarkedAt = +sim.time || 0;
      log(sim, sq, 'embarked', { passengers: members.length });
    }
  }
  function drive(sim, sq, dt) {
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
      if (!safe(sim, from, next)) {
        finish(sim, sq, 'road-blocked');
        return;
      }
      var seats = members.map(function (s, i) {
        return { s: s, next: memberSeat(i, members.length, next, newHeading) };
      });
      for (var j = 0; j < seats.length; j++) {
        if (!safe(sim, position(seats[j].s.root.position), seats[j].next)) {
          finish(sim, sq, 'passenger-path-blocked');
          return;
        }
      }
      seats.forEach(function (seat) {
        seat.s.root.position.x = seat.next.x;
        seat.s.root.position.z = seat.next.z;
        seat.s.root.position.y = sim.heightAt(seat.next.x, seat.next.z);
        seat.s._movementStopReason = 'embarked-passenger';
        seat.s.moveSpeed = 0;
        seat.s.moving = false;
      });
      t.heading = newHeading;
      t.position = next;
      t.travelled += amount;
      remaining -= elapsed;
      if (d - amount <= 0.02) t.leg++;
    }
    if (t.leg >= t.path.length) finish(sim, sq, 'arrival');
  }
  function step(sim, dt) {
    if (!enabled(sim) || !(dt > 0)) return;
    ['us', 'ge'].forEach(function (faction) {
      var force = sim.factions && sim.factions[faction];
      (force ? force.squads : []).forEach(function (sq) {
        var t = sq._transport;
        if (!t || (t.phase !== 'boarding' && t.phase !== 'embarked')) return;
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
        if (t.phase === 'boarding') {
          if (m.status === 'executing') board(sim, sq, dt);
          else if (sim.time - t.requestedAt > BOARD_TIMEOUT) finish(sim, sq, 'mission-not-accepted');
        } else drive(sim, sq, dt);
      });
    });
  }
  function reset(sim) {
    sim._strategicTransport = { us: 0, ge: 0 };
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
    isPassenger: function (s) {
      var t = s && s.squad && s.squad._transport;
      return !!(t && (t.phase === 'boarding' || t.phase === 'embarked'));
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
              travelled: +t.travelled.toFixed(1),
              total: +t.total.toFixed(1),
              reason: t.endReason || null
            };
          });
      });
    },
    tuning: {
      roadSpeed: SPEED_ROAD,
      joinSpeed: SPEED_JOIN,
      dismountMetres: DISEMBARK_METRES,
      minimumTrip: MIN_TRIP,
      vehiclesPerFaction: PER_FACTION
    }
  };
  if (typeof root.GTLog === 'function') root.GTLog('[STRATEGIC] opt-in abstract motor transport ready');
})(typeof window !== 'undefined' ? window : globalThis);
