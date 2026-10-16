/* Strategic interception: pure transport geometry, no gameplay mutation.
   Caller owns authority, navigation clearance and dismount handoff. */
(function (root) {
  'use strict';
  var ROAD_SPEED = 12,
    OFFROAD_SPEED = 3.2,
    MAX_OFFROAD_LEG = 180,
    ROAD_TOLERANCE = 12;

  function point(p) {
    return p && isFinite(+p.x) && isFinite(+p.z) ? { x: +p.x, z: +p.z } : null;
  }
  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
  function segmentDistance(p, a, b) {
    var dx = b.x - a.x,
      dz = b.z - a.z,
      den = dx * dx + dz * dz;
    if (den < 1) return Infinity;
    var t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / den));
    return distance(p, { x: a.x + t * dx, z: a.z + t * dz });
  }
  function publicRoads(scenario) {
    var nodes = {};
    (scenario.objectives || []).forEach(function (o) {
      nodes[String(o.id)] = point(o);
    });
    return (scenario.roads || [])
      .map(function (r) {
        var a = nodes[String(r.fromObjectiveId)] || point({ x: r.ax, z: r.az }),
          b = nodes[String(r.toObjectiveId)] || point({ x: r.bx, z: r.bz });
        return a && b && distance(a, b) > 1 ? { a: a, b: b } : null;
      })
      .filter(Boolean);
  }
  function onRoad(a, b, roads) {
    return roads.some(function (r) {
      return segmentDistance(a, r.a, r.b) <= ROAD_TOLERANCE && segmentDistance(b, r.a, r.b) <= ROAD_TOLERANCE;
    });
  }
  function failure(reason) {
    return { ok: false, reason: reason };
  }
  /* All waypoints are public road geometry plus short access/dismount legs.
     A real navigation clearance callback is mandatory: unknown is not clear. */
  function plan(scenario, points, opts) {
    opts = opts || {};
    if (!scenario || scenario.profile !== 'strategic') return failure('profile-required');
    if (!Array.isArray(points) || points.length < 2 || points.length > 80) return failure('invalid-route');
    if (typeof opts.clearance !== 'function') return failure('clearance-required');
    var nodes = points.map(point),
      roads = publicRoads(scenario);
    if (
      nodes.some(function (p) {
        return !p;
      })
    )
      return failure('invalid-waypoint');
    if (!roads.length) return failure('missing-roads');
    var legs = [],
      meters = 0,
      seconds = 0,
      roadMeters = 0;
    for (var i = 1; i < nodes.length; i++) {
      var a = nodes[i - 1],
        b = nodes[i],
        length = distance(a, b),
        road = onRoad(a, b, roads),
        speed = road ? ROAD_SPEED : OFFROAD_SPEED;
      if (length < 0.01) return failure('zero-length-leg');
      if (!road && length > MAX_OFFROAD_LEG) return failure('offroad-detour-too-long');
      if (!opts.clearance(a, b, road ? 'road' : 'offroad')) return failure('blocked');
      legs.push({ from: a, to: b, meters: length, road: road, speed: speed });
      meters += length;
      seconds += length / speed;
      if (road) roadMeters += length;
    }
    var dismount = opts.dismountSeconds == null ? 12 : +opts.dismountSeconds,
      setup = opts.setupSeconds == null ? 35 : +opts.setupSeconds,
      uncertainty = opts.uncertaintySeconds == null ? 30 : +opts.uncertaintySeconds;
    if (
      ![dismount, setup, uncertainty].every(function (n) {
        return isFinite(n) && n >= 0 && n <= 600;
      })
    )
      return failure('invalid-time-budget');
    return {
      ok: true,
      schema: 'grasstex-transport-route-v1',
      origin: nodes[0],
      dismountPoint: nodes[nodes.length - 1],
      legs: legs,
      meters: meters,
      roadMeters: roadMeters,
      travelSeconds: seconds,
      readySeconds: seconds + dismount + setup + uncertainty
    };
  }
  /* Pure common-carrier trajectory. Never sets soldier position, destination,
     stance, command phase or simulator time. The integration must atomically
     hand passengers back to Meso/Micro on dismount or abort. */
  function step(route, prior, dt, events) {
    if (!route || !route.ok) return failure('plan-required');
    if (!isFinite(+dt) || +dt < 0) return failure('invalid-time-step');
    var st = prior || {
        status: 'embarked',
        meters: 0,
        elapsedSeconds: 0,
        point: route.origin
      },
      cursor = +st.meters || 0,
      elapsed = +st.elapsedSeconds || 0,
      remaining = +dt;
    if (st.status !== 'embarked') return Object.assign({}, st);
    events = events || {};
    if (events.contact || events.blocked || events.cancelled)
      return {
        status: 'aborted',
        reason: events.contact ? 'contact' : events.blocked ? 'blocked' : 'cancelled',
        meters: cursor,
        elapsedSeconds: elapsed,
        point: point(st.point)
      };
    var traveled = 0;
    for (var i = 0; i < route.legs.length; i++) {
      var leg = route.legs[i],
        past = cursor - traveled;
      traveled += leg.meters;
      if (past >= leg.meters - 1e-8) continue;
      var available = leg.meters - Math.max(0, past),
        moved = Math.min(available, remaining * leg.speed);
      cursor += moved;
      elapsed += moved / leg.speed;
      remaining -= moved / leg.speed;
      if (remaining <= 1e-8) break;
    }
    cursor = Math.min(route.meters, cursor);
    var offset = 0,
      p = route.dismountPoint;
    for (var j = 0; j < route.legs.length; j++) {
      var section = route.legs[j];
      if (cursor <= offset + section.meters) {
        var t = Math.max(0, Math.min(1, (cursor - offset) / section.meters));
        p = {
          x: section.from.x + t * (section.to.x - section.from.x),
          z: section.from.z + t * (section.to.z - section.from.z)
        };
        break;
      }
      offset += section.meters;
    }
    return {
      status: cursor >= route.meters - 1e-8 ? 'dismounted' : 'embarked',
      meters: cursor,
      elapsedSeconds: elapsed,
      point: p
    };
  }
  root.BattleStrategicTransportCore = {
    version: 'transport-route-core-v1',
    roadSpeed: ROAD_SPEED,
    offroadSpeed: OFFROAD_SPEED,
    plan: plan,
    step: step
  };
})(typeof window !== 'undefined' ? window : globalThis);
