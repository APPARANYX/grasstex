/* Who is a stranded man, and could a neighbour have told him? For every living man whose newest movement envelope is
   `unreachable` (sampled every 5 s) it records, at the start of each episode and over all man-seconds:
   - whether a living squadmate stood within voice range (45 m), or within sight range (90 m) with clear line of sight,
     and whether that neighbour was himself reachable (he holds the order he would relay);
   - whether the man stood still (speed < 0.35) or moved, and whether a still man still held an older adopted envelope.
   Observe only: reads the reception state directly (no settle), draws no RNG, writes nothing. */
(function (root) {
  var VOICE = 45,
    VISUAL = 90,
    open,
    ep,
    ms;
  function zero() {
    return {
      n: 0,
      voice: 0,
      voiceReach: 0,
      sight: 0,
      sightReach: 0,
      anyNear: 0,
      still: 0,
      stillHeld: 0,
      moving: 0,
      nearestSum: 0
    };
  }
  function near(sim, sq, s, st, f) {
    var best = null,
      voice = false,
      voiceReach = false,
      sight = false,
      sightReach = false,
      S = root.SquadAI;
    (sq.members || []).forEach(function (m) {
      if (m === s || m.dead || !m.root) return;
      var d = Math.hypot(m.root.position.x - s.root.position.x, m.root.position.z - s.root.position.z),
        by = st && st.bySoldier[String(m.id)],
        r = by && by['movement|soldier:' + m.id],
        reach = !(r && r.unreachable);
      if (best == null || d < best) best = d;
      if (d <= VOICE) {
        voice = true;
        if (reach) voiceReach = true;
      } else if (d <= VISUAL) {
        var los = false;
        try {
          los = !!(S && S.hasLineOfSight && S.hasLineOfSight(m, s, sim.heightAt, sim.obstacles));
        } catch (_) {}
        if (los) {
          sight = true;
          if (reach) sightReach = true;
        }
      }
    });
    return { best: best, voice: voice, voiceReach: voiceReach, sight: sight, sightReach: sightReach };
  }
  function add(b, n, still, held, moving) {
    b.n++;
    if (n.voice) b.voice++;
    if (n.voiceReach) b.voiceReach++;
    if (n.voice || n.sight) b.sight++;
    if (n.voiceReach || n.sightReach) b.sightReach++;
    if (n.best != null && n.best <= VISUAL) b.anyNear++;
    if (still) {
      b.still++;
      if (held) b.stillHeld++;
    } else if (moving) b.moving++;
    if (n.best != null) b.nearestSum += n.best;
  }
  (root.BattleProbes = root.BattleProbes || {})['stranded-men'] = {
    every: 5,
    start: function () {
      open = {};
      ep = zero();
      ms = zero();
    },
    sample: function (sim) {
      var st = sim._commandReception,
        seen = {};
      ['us', 'ge'].forEach(function (f) {
        ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
          (sq.members || []).forEach(function (s) {
            if (s.dead || s.isPlayer || !s.root) return;
            var by = st && st.bySoldier[String(s.id)],
              rec = by && by['movement|soldier:' + s.id],
              key = f + ':' + s.id;
            if (!(rec && rec.unreachable)) return;
            seen[key] = 1;
            var n = near(sim, sq, s, st, f),
              moving = (+s.moveSpeed || 0) >= 0.35,
              held = !!(s._fireteamAdoptedEnvelope && s._fireteamAdoptedEnvelope !== rec.envelopeId);
            add(ms, n, !moving, held, moving);
            if (!open[key]) {
              open[key] = sim.time;
              add(ep, n, !moving, held, moving);
            }
          });
        });
      });
      Object.keys(open).forEach(function (k) {
        if (!seen[k]) delete open[k];
      });
    },
    report: function () {
      return { episodes: ep, samples: ms };
    }
  };
})(window);
