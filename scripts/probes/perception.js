/* How men find the enemy. Every fresh acquisition (a man with no target who now has one): the angle
   between his facing and the enemy (bands: inside ±60°, ±60-100°, behind), the distance, and how the
   squad knew already (squad.contact: none, seen by the squad, relayed by a neighbour squad, heard).
   Plus per squad the first time it had any contact, and how that contact came in. A man spotting
   someone behind him at range means perception ignores facing. Observe only: reads state each step. */
(function (root) {
  var c, had;
  function bearingOff(s, t) {
    var p = s.root.position,
      q = t.root.position,
      diff = Math.atan2(q.x - p.x, q.z - p.z) - (s.root.rotation.y || 0);
    return (Math.abs(Math.atan2(Math.sin(diff), Math.cos(diff))) * 180) / Math.PI;
  }
  function source(sq) {
    var k = sq && sq.contact;
    if (!k) return 'none';
    return k.heard ? 'heard' : k.relayedFrom ? 'relayed' : 'seen';
  }
  function bump(o, k) {
    o[k] = (o[k] || 0) + 1;
  }
  (root.BattleProbes = root.BattleProbes || {})['perception'] = {
    every: 0,
    start: function () {
      c = { acquisitions: 0, byAngle: {}, behindByRange: {}, squadKnewBy: {}, firstContactBy: {} };
      had = new Map();
    },
    sample: function (sim) {
      var men = root.BattleModules.unitsFor(sim);
      for (var i = 0; i < men.length; i++) {
        var s = men[i];
        if (!s || s.dead || !s.root) continue;
        var t = s.target && !s.target.dead && s.target.root ? s.target : null,
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
          bump(c.squadKnewBy, source(s.squad));
        }
        var sq = s.squad;
        if (sq && sq.contact && !sq._probeFirstContact) {
          sq._probeFirstContact = true;
          bump(c.firstContactBy, source(sq));
        }
      }
    },
    report: function () {
      return c;
    }
  };
})(window);
