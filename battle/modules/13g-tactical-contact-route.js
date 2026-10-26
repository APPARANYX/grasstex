/* New-controller contact-route planning skill. Deterministic read-only next-cover selection:
   choose the next physically reachable cover slot toward the mission, accepting limited
   exposure in short, supported movements instead of requiring flawless concealment.
   It never writes soldier position, orders, engagement or cover reservations.
   BattleEngagement + Meso retain acceptance, reservations and locomotion ownership. */
(function (root) {
  'use strict';
  var MAX_HOP = 26,
    MIN_HOP = 1.1,
    SAMPLE = 2,
    MAX_EXPOSURE = 0.85,
    MAX_UNDER_FIRE_EXPOSURE = 0.5;

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
  function threatVisible(s, sim, at, reports) {
    var A = root.SquadAI;
    if (!A || !A.hasLineOfSight || !sim.heightAt) return true; // unknown is not safe
    var h = sim.heightAt(at.x, at.z);
    for (var k = 0; k < reports.length; k++) {
      var p = reports[k];
      if (A.hasLineOfSight(
        { root: { position: { x: at.x, z: at.z, y: h + 1.0 } }, crouching: true },
        { root: { position: { x: p.x, z: p.z, y: sim.heightAt(p.x, p.z) + 1.6 } } },
        sim.heightAt, sim.obstacles
      )) return true;
    }
    return false;
  }
  function evaluate(s, sim, dest, reports, underFire) {
    var here = s && s.root && s.root.position,
      N = root.BattleNavigation,
      result = { eligible: false, reason: 'unknown', distance: Infinity, exposure: 1 };
    if (!here || !dest || !Array.isArray(reports) || !reports.length) {
      result.reason = 'missing-reported-contact';
      return result;
    }
    var d = distance(here, dest);
    result.distance = d;
    if (!Number.isFinite(d) || d < MIN_HOP || d > MAX_HOP) {
      result.reason = 'outside-contact-hop';
      return result;
    }
    if (!N || !N.movementClear || !N.movementClear(here, dest)) {
      result.reason = 'blocked-physical-segment';
      return result;
    }
    var steps = Math.max(2, Math.ceil(d / SAMPLE)),
      exposed = 0;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var at = { x: here.x + (dest.x - here.x) * t, z: here.z + (dest.z - here.z) * t };
      if (threatVisible(s, sim, at, reports)) exposed++;
    }
    result.exposure = exposed / (steps + 1);
    /* Risk is a ranking, not a dozen gates. Danger demands more cover; an
       ordinary contact can dash briefly with independently verified support. */
    if (result.exposure > (underFire ? MAX_UNDER_FIRE_EXPOSURE : MAX_EXPOSURE)) {
      result.reason = 'excessive-observed-exposure';
      return result;
    }
    result.reason = 'reachable-contact-cover';
    result.eligible = true;
    return result;
  }
  function pick(s, sim, reports, goal, taken) {
    var C = root.BattleCoverPositions,
      here = s && s.root && s.root.position,
      E = root.BattleEngagement,
      threat = reports && reports[0],
      stats = { total: 0, progressing: 0, safe: 0, rejected: {} };
    if (!C || !C.candidates || !here || !threat || !goal) return { point: null, stats: stats };
    var underFire = (+s.suppressedUntil || 0) > sim.time || !!(E && E.underFireNow && E.underFireNow(s, sim));
    var oldDist = distance(here, goal),
      candidates = C.candidates(s, sim, threat, MAX_HOP) || [],
      best = null,
      bestScore = Infinity;
    stats.total = candidates.length;
    for (var i = 0; i < Math.min(candidates.length, 96); i++) {
      var p = candidates[i];
      if ((taken || []).some(function (q) { return distance(q, p) < 2; })) continue;
      var gain = oldDist - distance(p, goal);
      /* A one-time lateral move to much better cover is allowed, but never a
         long backwards detour in an advance. The next turn replans from cover. */
      if (gain < 0.6 && !(gain > -3 && p.quality < 0.5)) {
        stats.rejected['no-forward-or-lateral-progress'] =
          (stats.rejected['no-forward-or-lateral-progress'] || 0) + 1;
        continue;
      }
      stats.progressing++;
      var safe = evaluate(s, sim, p, reports, underFire);
      if (!safe.eligible) {
        stats.rejected[safe.reason] = (stats.rejected[safe.reason] || 0) + 1;
        continue;
      }
      stats.safe++;
      /* Hazard dominates directness; retain meaningful progress and short legs. */
      var score = safe.exposure * 100 + p.quality * 28 + safe.distance * 0.25 -
        Math.max(-3, gain) * 0.55;
      if (score < bestScore || (score === bestScore && String(p.slotId) < String(best.slotId))) {
        best = p;
        bestScore = score;
      }
    }
    return {
      point: best ? { x: best.x, z: best.z } : null,
      stats: stats,
      score: best ? +bestScore.toFixed(2) : null,
      exposure: best ? evaluate(s, sim, best, reports, underFire).exposure : null
    };
  }
  root.BattleTacticalContactRoute = {
    pick: pick,
    evaluate: evaluate,
    tuning: { maxHop: MAX_HOP, maxExposure: MAX_EXPOSURE, maxUnderFireExposure: MAX_UNDER_FIRE_EXPOSURE }
  };
})(typeof window !== 'undefined' ? window : globalThis);
