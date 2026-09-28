/* How men find the enemy. Every fresh acquisition (a man with no target who now has one): the angle
   between his facing and the enemy (bands: inside ±60°, ±60-100°, behind), the distance, and how the
   squad knew already (squad.contact: none, seen by the squad, relayed by a neighbour squad, heard).
   Plus per squad the first time it had any contact, and how that contact came in. A man spotting
   someone behind him at range means perception ignores facing.
   Mid-fight re-acquisitions (AGENTS.md "Perception follow-ups": count them before tuning
   HEAR_RANGE/RELAY_RANGE): a squad that has had contact, then none at all (SquadAI.squadContact
   null, i.e. past CONTACT_MEMORY) for at least REACQUIRE_GAP s, and now has one again: how it came
   back (seen, relayed, heard) and how long it was blind. Also acquisitions by a man standing still
   whose squad knew of nobody (`stillUnaware`: the sector-scan case), by angle band.
   Observe only: reads state each step, keeps its own bookkeeping outside the sim. */
(function (root) {
  var REACQUIRE_GAP = 5;
  var c, had, squads;
  function bearingOff(s, t) {
    var p = s.root.position,
      q = t.root.position,
      diff = Math.atan2(q.x - p.x, q.z - p.z) - (s.root.rotation.y || 0);
    return (Math.abs(Math.atan2(Math.sin(diff), Math.cos(diff))) * 180) / Math.PI;
  }
  function source(k) {
    if (!k) return 'none';
    return k.heard ? 'heard' : k.relayedFrom ? 'relayed' : 'seen';
  }
  function bump(o, k) {
    o[k] = (o[k] || 0) + 1;
  }
  function gapBand(g) {
    return g < 15 ? '5-15s' : g < 30 ? '15-30s' : g < 60 ? '30-60s' : '60s+';
  }
  (root.BattleProbes = root.BattleProbes || {})['perception'] = {
    every: 0,
    start: function () {
      c = {
        acquisitions: 0,
        byAngle: {},
        behindByRange: {},
        squadKnewBy: {},
        firstContactBy: {},
        stillUnaware: { acquisitions: 0, byAngle: {} },
        reacquisitions: { count: 0, by: {}, byGap: {}, bySide: {} }
      };
      had = new Map();
      squads = new Map();
    },
    sample: function (sim) {
      var men = root.BattleModules.unitsFor(sim),
        SA = root.SquadAI,
        seen = new Set();
      for (var i = 0; i < men.length; i++) {
        var s = men[i];
        if (!s || s.dead || !s.root) continue;
        var sq = s.squad,
          t = s.target && !s.target.dead && s.target.root ? s.target : null,
          before = had.get(s);
        had.set(s, t);
        if (t && !before) {
          var a = bearingOff(s, t),
            q = t.root.position,
            d = Math.hypot(q.x - s.root.position.x, q.z - s.root.position.z),
            band = a <= 60 ? 'front' : a <= 100 ? 'side' : 'behind';
          c.acquisitions++;
          bump(c.byAngle, band);
          if (band === 'behind') bump(c.behindByRange, d < 10 ? '<10' : d < 50 ? '10-50' : d < 150 ? '50-150' : '150+');
          bump(c.squadKnewBy, source(sq && sq.contact));
          /* The squad's state as of the previous step: this man's own sighting already filled it. */
          var st = sq && squads.get(sq);
          if (!s.moving && st && !st.known) {
            c.stillUnaware.acquisitions++;
            bump(c.stillUnaware.byAngle, band);
          }
        }
        if (sq && !seen.has(sq)) seen.add(sq);
      }
      seen.forEach(function (sq) {
        var k = SA.squadContact ? SA.squadContact(sq, sim) : sq.contact,
          rec = squads.get(sq);
        if (!rec) squads.set(sq, (rec = { ever: false, known: false, lostAt: null }));
        if (k) {
          if (!rec.ever) bump(c.firstContactBy, source(k));
          else if (!rec.known && rec.lostAt != null && sim.time - rec.lostAt >= REACQUIRE_GAP) {
            c.reacquisitions.count++;
            bump(c.reacquisitions.by, source(k));
            bump(c.reacquisitions.byGap, gapBand(sim.time - rec.lostAt));
            bump(c.reacquisitions.bySide, sq.faction + ':' + source(k));
          }
          rec.ever = true;
          rec.known = true;
        } else if (rec.known) {
          rec.known = false;
          rec.lostAt = sim.time;
        }
      });
    },
    report: function () {
      return c;
    }
  };
})(window);
