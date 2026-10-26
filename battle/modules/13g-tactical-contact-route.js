/* Tactical contact route planner: read-only bounded cover graph + Dijkstra/A*-
   style shortest path. Plans multiple native cover stops, even backwards, before
   issuing a *single* Meso-approved bound. The resolver remains the only physical
   movement writer; cover slots are the same native obstacles used by Engagement.
   No invented enemy knowledge, cover, locomotion, or discharge receipts. */
(function (root) {
  'use strict';
  var MAX_HOP = 26,
    MIN_HOP = 1.1,
    SAMPLE = 2,
    MAX_EXPOSURE = 0.85,
    MAX_UNDER_FIRE_EXPOSURE = 0.5,
    MAX_NODES = 160,
    MAX_EXPANSIONS = 155,
    MAX_EDGE_QUERIES = 1700,
    /* Native exact path queries are expensive; cap them per squad plan. They
       model real ingress/egress from a sheltered slot, not invented cover. */
    MAX_PHYSICAL_DETOURS = 20,
    MAX_DETOUR_RATIO = 1.8,
    MAX_DETOUR = 110,
    GOAL_REACH = 24,
    failedPlans = new WeakMap();
  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
  function point(p) {
    return { x: +p.x, z: +p.z };
  }
  function threatVisible(sim, at, reports) {
    var A = root.SquadAI;
    if (!A || !A.hasLineOfSight || !sim.heightAt) return true;
    var h = sim.heightAt(at.x, at.z);
    for (var k = 0; k < reports.length; k++) {
      var p = reports[k];
      if (
        A.hasLineOfSight(
          { root: { position: { x: at.x, z: at.z, y: h + 1.0 } }, crouching: true },
          { root: { position: { x: p.x, z: p.z, y: sim.heightAt(p.x, p.z) + 1.6 } } },
          sim.heightAt,
          sim.obstacles
        )
      )
        return true;
    }
    return false;
  }
  /* A cover slot is a TACTICAL destination, not a route junction the man must
     cross in a straight line. The physical navigator plans the exit from the
     previous shelter, travel around its real volume, and entry behind the next.
     Only that native owner supplies transit points (B1 in A→B→B1→C). */
  function physicalLeg(sim, from, to, budget) {
    var N = root.BattleNavigation,
      straight = distance(from, to),
      path = null;
    if (!N || !N.movementClear) return { ok: false, reason: 'navigation-unavailable' };
    if (N.movementClear(from, to)) path = [point(to)];
    else {
      if (!N.findPath) return { ok: false, reason: 'no-native-ingress-egress' };
      if (budget && budget.left <= 0) return { ok: false, reason: 'nav-detour-budget' };
      if (budget) {
        budget.left--;
        budget.queries++;
      }
      path = N.findPath(from, to);
      if (!Array.isArray(path) || !path.length) return { ok: false, reason: 'no-complete-physical-detour' };
    }
    var cursor = point(from),
      total = 0,
      points = [cursor],
      maxTravel = MAX_HOP * MAX_DETOUR_RATIO;
    if (path.length > 96) return { ok: false, reason: 'overlong-physical-detour' };
    for (var i = 0; i < path.length; i++) {
      var p = path[i];
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.z))
        return { ok: false, reason: 'invalid-physical-detour' };
      p = point(p);
      var length = distance(cursor, p);
      if (!N.movementClear(cursor, p)) return { ok: false, reason: 'blocked-physical-segment' };
      total += length;
      if (total > maxTravel) return { ok: false, reason: 'overlong-physical-detour' };
      if (length > 0.01) points.push(p);
      cursor = p;
    }
    if (distance(cursor, to) > 0.35) return { ok: false, reason: 'incomplete-physical-detour' };
    /* The tactical hop still respects 26m between COVER POINTS, with a
       bounded additional physical detour around an obstacle. */
    if (straight > MAX_HOP || total < MIN_HOP) return { ok: false, reason: 'outside-contact-hop' };
    return { ok: true, distance: total, points: points, detour: points.length > 2 };
  }
  function edge(sim, from, to, reports, underFire, strict, budget) {
    var out = { eligible: false, reason: 'unknown', distance: distance(from, to), exposure: 1 };
    if (!reports || !reports.length) {
      out.reason = 'missing-reported-contact';
      return out;
    }
    if (!Number.isFinite(out.distance) || out.distance < MIN_HOP || out.distance > MAX_HOP) {
      out.reason = 'outside-contact-hop';
      return out;
    }
    var transit = physicalLeg(sim, from, to, budget);
    if (!transit.ok) {
      out.reason = transit.reason;
      return out;
    }
    var samples = 0,
      exposed = 0;
    /* Measure exposure ALONG the actual traversable route, including B1
       egress and C ingress, not through the solid obstacle between B and C. */
    for (var k = 1; k < transit.points.length; k++) {
      var a = transit.points[k - 1],
        b = transit.points[k],
        leg = distance(a, b),
        steps = Math.max(1, Math.ceil(leg / SAMPLE));
      for (var i = k === 1 ? 0 : 1; i <= steps; i++) {
        var t = i / steps,
          at = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
        samples++;
        if (threatVisible(sim, at, reports)) exposed++;
      }
    }
    out.distance = transit.distance;
    out.exposure = samples ? exposed / samples : 1;
    if (strict && out.exposure > (underFire ? MAX_UNDER_FIRE_EXPOSURE : MAX_EXPOSURE)) {
      out.reason = 'excessive-observed-exposure';
      return out;
    }
    out.eligible = true;
    out.detour = transit.detour;
    out.reason = transit.detour ? 'native-egress-ingress-detour' : 'traversable-real-cover-leg';
    return out;
  }
  function evaluate(s, sim, dest, reports, underFire) {
    if (!s || !s.root || !dest)
      return { eligible: false, reason: 'missing-actor-or-waypoint', distance: Infinity, exposure: 1 };
    /* A live movement request is validated independently, never throttled by
       the planning graph's performance budget. The actual physical mover will
       then revalidate and navigate its own B→B1→C sequence. */
    return edge(sim, s.root.position, dest, reports, underFire, true, null);
  }
  function crossTrack(p, start, goal) {
    var dx = goal.x - start.x,
      dz = goal.z - start.z,
      m = dx * dx + dz * dz;
    if (m < 1) return distance(p, start);
    var t = Math.max(0, Math.min(1, ((p.x - start.x) * dx + (p.z - start.z) * dz) / m));
    return Math.hypot(p.x - (start.x + t * dx), p.z - (start.z + t * dz));
  }
  function findRoute(s, sim, reports, goal, taken) {
    var C = root.BattleCoverPositions,
      N = root.BattleNavigation,
      start = s && s.root && s.root.position,
      threat = reports && reports[0],
      stats = {
        total: 0,
        progressing: 0,
        safe: 0,
        rejected: {},
        graphNodes: 0,
        evaluatedEdges: 0,
        nativePathQueries: 0,
        admittedDetours: 0,
        expanded: 0,
        planLength: 0,
        terminal: 'none'
      };
    if (!C || !start || !threat || !goal || !N || !N.movementClear) {
      stats.rejected['missing-world-or-contact'] = 1;
      return { point: null, waypoints: [], stats: stats };
    }
    var here = point(start),
      target = point(goal);
    var horizon = Math.min(450, Math.max(100, distance(here, target) + 65)),
      candidates =
        (C.routeCandidates
          ? C.routeCandidates(s, sim, threat, horizon)
          : C.candidates(s, sim, threat, horizon)) || [];
    /* Cover nodes come from real obstacle-backed slots. Never project imaginary
       virtual cover spots, and never reserve a future waypoint in advance. */
    var chosen = [],
      seen = new Set();
    candidates.forEach(function (p) {
      if (
        !p ||
        !Number.isFinite(p.x) ||
        !Number.isFinite(p.z) ||
        (p.slotId && seen.has(String(p.slotId))) ||
        (taken || []).some(function (q) {
          return distance(q, p) < 2;
        }) ||
        crossTrack(p, here, target) > MAX_DETOUR
      )
        return;
      if (p.slotId) seen.add(String(p.slotId));
      chosen.push(p);
    });
    stats.total = chosen.length;
    chosen.sort(function (a, b) {
      return (
        crossTrack(a, here, target) +
          0.12 * distance(a, here) -
          (crossTrack(b, here, target) + 0.12 * distance(b, here)) ||
        String(a.slotId).localeCompare(String(b.slotId))
      );
    });
    chosen.length = Math.min(chosen.length, MAX_NODES);
    var nodes = [{ x: here.x, z: here.z, slotId: 'start', quality: 0 }].concat(chosen);
    stats.graphNodes = nodes.length - 1;
    var d = Array(nodes.length).fill(Infinity),
      prev = Array(nodes.length).fill(-1),
      used = Array(nodes.length).fill(false),
      underFire =
        (+s.suppressedUntil || 0) > sim.time ||
        !!(
          root.BattleEngagement &&
          root.BattleEngagement.underFireNow &&
          root.BattleEngagement.underFireNow(s, sim)
        );
    d[0] = 0;
    var detourBudget = { left: MAX_PHYSICAL_DETOURS, queries: 0 };
    /* Positive edge costs permit detours/backtracking. A first edge must pass
       the same strict safety rule Engagement will enforce before adoption.
       Later edges are estimated using their own actual nav/LOS geometry and
       rechecked strictly at the physical checkpoint. */
    for (var iteration = 0; iteration < Math.min(nodes.length, MAX_EXPANSIONS); iteration++) {
      var from = -1;
      for (var j = 0; j < nodes.length; j++)
        if (!used[j] && Number.isFinite(d[j]) && (from < 0 || d[j] < d[from])) from = j;
      if (from < 0) break;
      used[from] = true;
      stats.expanded++;
      for (var k = 1; k < nodes.length; k++) {
        if (used[k] || k === from) continue;
        var leg = distance(nodes[from], nodes[k]);
        if (leg < MIN_HOP || leg > MAX_HOP) continue;
        if (++stats.evaluatedEdges > MAX_EDGE_QUERIES) break;
        var result = edge(sim, nodes[from], nodes[k], reports, underFire, from === 0, detourBudget);
        if (result.detour && result.eligible) stats.admittedDetours++;
        if (!result.eligible) {
          stats.rejected[result.reason] = (stats.rejected[result.reason] || 0) + 1;
          continue;
        }
        stats.safe++;
        /* Base travel cost plus real-threat exposure penalty. No positive-
           progress gate: farther/sideways cover is allowed when the *whole*
           route delivers the squad toward its mission. */
        var cost = leg * (1 + 2.6 * result.exposure) + Math.max(0, +nodes[k].quality || 0) * 5;
        if (d[from] + cost < d[k] - 0.0001) {
          d[k] = d[from] + cost;
          prev[k] = from;
        }
      }
      if (stats.evaluatedEdges >= MAX_EDGE_QUERIES) break;
    }
    stats.nativePathQueries = detourBudget.queries;
    var best = -1,
      rating = Infinity,
      complete = false,
      startToGoal = distance(here, target);
    for (var z = 1; z < nodes.length; z++) {
      if (!Number.isFinite(d[z])) continue;
      var remains = distance(nodes[z], target);
      /* Prefer routes that approach the mission, not short paths that merely
         shuffle two soldiers between their original cover positions. */
      var terminal = remains <= GOAL_REACH && N.movementClear(nodes[z], target);
      if (terminal) {
        var score = d[z] + remains * 0.5;
        if (!complete || score < rating) {
          complete = true;
          best = z;
          rating = score;
        }
      } else if (!complete && remains < startToGoal - 1) {
        var partialScore = remains * 4 + d[z] * 0.6;
        if (partialScore < rating) {
          best = z;
          rating = partialScore;
        }
      }
    }
    if (best < 0) {
      stats.rejected['no-connected-progress-route'] = 1;
      return { point: null, waypoints: [], stats: stats };
    }
    var indices = [],
      cursor = best;
    for (var guard = 0; cursor > 0 && guard < nodes.length; guard++) {
      indices.unshift(cursor);
      cursor = prev[cursor];
    }
    if (cursor !== 0 || !indices.length) {
      stats.rejected['invalid-path-chain'] = 1;
      return { point: null, waypoints: [], stats: stats };
    }
    var waypoints = indices.map(function (i) {
      return { x: nodes[i].x, z: nodes[i].z, slotId: String(nodes[i].slotId || '') };
    });
    stats.progressing = indices.length;
    stats.planLength = waypoints.length;
    stats.terminal = complete ? 'near-mission' : 'lookahead-frontier';
    return {
      point: point(waypoints[0]),
      waypoints: waypoints,
      score: +rating.toFixed(2),
      exposure: evaluate(s, sim, waypoints[0], reports, underFire).exposure,
      stats: stats
    };
  }
  function pick(s, sim, reports, goal, taken, retained) {
    var C = root.BattleCoverPositions,
      threat = reports && reports[0],
      current = retained && retained.waypoints && retained.waypoints[retained.cursor];
    if (current && C && C.candidates && threat) {
      var available = C.candidates(s, sim, threat, MAX_HOP).some(function (p) {
        return String(p.slotId) === String(current.slotId) && distance(p, current) < 0.05;
      });
      var underFire =
        (+s.suppressedUntil || 0) > sim.time ||
        !!(
          root.BattleEngagement &&
          root.BattleEngagement.underFireNow &&
          root.BattleEngagement.underFireNow(s, sim)
        );
      var safe = available && evaluate(s, sim, current, reports, underFire);
      if (safe && safe.eligible)
        return {
          point: point(current),
          waypoints: retained.waypoints,
          score: 0,
          exposure: safe.exposure,
          reused: true,
          stats: {
            total: retained.waypoints.length,
            progressing: retained.waypoints.length,
            safe: 1,
            rejected: {},
            graphNodes: retained.waypoints.length,
            evaluatedEdges: 1,
            planLength: retained.waypoints.length,
            terminal: 'retained-checkpoint'
          }
        };
    }
    /* A blocked graph is unchanged until geometry, contact, suppression, or
       squad position changes. Cache only negative results briefly; successful
       routes still undergo live candidate and execution-owner validation. */
    var N = root.BattleNavigation,
      A = root.SquadAI,
      pos = s && s.root && s.root.position,
      underFire =
        s &&
        ((+s.suppressedUntil || 0) > sim.time ||
          (root.BattleEngagement &&
            root.BattleEngagement.underFireNow &&
            root.BattleEngagement.underFireNow(s, sim))),
      key =
        pos &&
        goal &&
        [
          Math.round(pos.x),
          Math.round(pos.z),
          Math.round(goal.x),
          Math.round(goal.z),
          (reports || [])
            .map(function (p) {
              return Math.round(p.x) + ',' + Math.round(p.z);
            })
            .join(';'),
          !!underFire,
          N && N.version,
          (taken || []).length
        ].join('|'),
      prior = s && failedPlans.get(s);
    if (
      prior &&
      prior.battle === sim &&
      prior.key === key &&
      prior.until >= sim.time &&
      prior.movementClear === (N && N.movementClear) &&
      prior.lineOfSight === (A && A.hasLineOfSight)
    )
      return prior.result;
    var result = findRoute(s, sim, reports, goal, taken);
    if (s && !result.point && key)
      failedPlans.set(s, {
        battle: sim,
        key: key,
        until: sim.time + 2,
        movementClear: N && N.movementClear,
        lineOfSight: A && A.hasLineOfSight,
        result: result
      });
    else if (s) failedPlans.delete(s);
    return result;
  }
  /* Objective defense selects genuine sheltered positions facing a reported
     contact. The goal is the captured objective's protective sector, never the
     enemy. Movement Resolver supplies egress/ingress without a second writer. */
  function pickDefense(s, sim, reports, center, radius, team) {
    var C = root.BattleCoverPositions,
      pos = s && s.root && s.root.position,
      threat = reports && reports[0],
      stats = {
        total: 0,
        progressing: 0,
        safe: 0,
        rejected: {},
        graphNodes: 0,
        planLength: 0,
        terminal: 'defensive-hold'
      };
    if (!C || !C.candidates || !pos || !center || !threat)
      return { point: null, waypoints: [], stats: stats };
    var dx = threat.x - center.x,
      dz = threat.z - center.z,
      length = Math.hypot(dx, dz);
    if (length < 0.5) return { point: null, waypoints: [], stats: stats };
    var ux = dx / length,
      uz = dz / length,
      side = team === 'alpha' ? -1 : team === 'bravo' ? 1 : 0,
      ring = Math.min(22, Math.max(9, radius * 0.63)),
      desired = {
        x: center.x + (ux - uz * side * 0.6) * ring,
        z: center.z + (uz + ux * side * 0.6) * ring
      },
      limit = Math.min(30, Math.max(12, radius * 0.95)),
      underFire =
        (+s.suppressedUntil || 0) > sim.time ||
        !!(
          root.BattleEngagement &&
          root.BattleEngagement.underFireNow &&
          root.BattleEngagement.underFireNow(s, sim)
        ),
      candidates = C.candidates(s, sim, threat, MAX_HOP) || [],
      best = null,
      rating = Infinity;
    stats.total = candidates.length;
    /* Some defenders are still on the approach route when the objective
       changes hands. Advance them THROUGH real cover toward the defended point
       before trying to occupy the inside perimeter. A physical detour may
       temporarily move sideways, but its final cover must close on the goal. */
    if (distance(pos, center) > limit + 2) {
      var approach = pick(s, sim, reports, center, [], null),
        last = approach.waypoints && approach.waypoints[approach.waypoints.length - 1];
      if (!last || distance(last, center) >= distance(pos, center) - 3)
        return { point: null, waypoints: [], stats: approach.stats || stats };
      return approach;
    }
    candidates.forEach(function (candidate) {
      if (!candidate || !Number.isFinite(candidate.x) || !Number.isFinite(candidate.z)) return;
      /* No unbounded pursuit; even reachable cover beyond the protected
         perimeter is not a defensive destination. */
      if (
        distance(candidate, center) > limit ||
        distance(candidate, pos) < MIN_HOP ||
        distance(candidate, desired) > limit * 1.25
      )
        return;
      stats.progressing++;
      var route = evaluate(s, sim, candidate, reports, underFire);
      if (!route.eligible) {
        stats.rejected[route.reason] = (stats.rejected[route.reason] || 0) + 1;
        return;
      }
      stats.safe++;
      var score =
        distance(candidate, desired) * 2 +
        route.distance * 0.75 +
        route.exposure * 28 +
        Math.max(0, +candidate.quality || 0) * 5;
      if (score < rating) {
        best = candidate;
        rating = score;
      }
    });
    if (!best) return { point: null, waypoints: [], stats: stats };
    stats.planLength = 1;
    stats.terminal = 'objective-defense-post';
    return {
      point: point(best),
      waypoints: [{ x: best.x, z: best.z, slotId: String(best.slotId || '') }],
      score: rating,
      exposure: 0,
      stats: stats
    };
  }
  root.BattleTacticalContactRoute = {
    pick: pick,
    pickDefense: pickDefense,
    evaluate: evaluate,
    tuning: {
      maxHop: MAX_HOP,
      maxExposure: MAX_EXPOSURE,
      maxUnderFireExposure: MAX_UNDER_FIRE_EXPOSURE,
      graphNodes: MAX_NODES,
      graphEdgeBudget: MAX_EDGE_QUERIES,
      physicalDetourBudget: MAX_PHYSICAL_DETOURS
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
