/* Why does an attacking squad stand still with no contact? For each squad on a capture brief without a defense request,
   keeps a 5 s history of its state; when the squad has stayed within 20 m for 180 s and is not in contact, dumps the history
   from 40 s before the idle episode began. Observe only: reads public state, draws no RNG, writes nothing. */
(function (root) {
  var hist, eps, dumps;
  function centre(sq) {
    var m = (sq.members || []).filter(function (s) {
      return !s.dead && s.root;
    });
    if (!m.length) return null;
    var c = m.reduce(
      function (a, s) {
        return { x: a.x + s.root.position.x, z: a.z + s.root.position.z };
      },
      { x: 0, z: 0 }
    );
    return { x: c.x / m.length, z: c.z / m.length, n: m.length };
  }
  function row(sim, sq, c) {
    var m = sq._macroMission,
      moving = 0,
      holders = {};
    sq.members.forEach(function (s) {
      if (s.dead) return;
      if ((+s.moveSpeed || 0) > 0.35) moving++;
      var l = (s._movementResolver && s._movementResolver.last) || {},
        k = (s.eng && s.eng.state) + '/' + (l.kind || '-') + '/' + (l.owner || '-');
      holders[k] = (holders[k] || 0) + 1;
    });
    return {
      t: +sim.time.toFixed(0),
      n: c.n,
      x: Math.round(c.x),
      z: Math.round(c.z),
      state: sq.state,
      phase: sq.commandPhase,
      contact: !!sq.inContact,
      contactCount: sq.contactCount,
      coa: sq.coa || null,
      fc: sq.fireControl ? sq.fireControl.state : null,
      plan: sq._engagementPlan ? sq._engagementPlan.status : null,
      mission: m ? [m.version, m.status, m.intent, m.action].join('/') : null,
      leases: Object.keys((sq._leases && sq._leases.live) || sq._leases || {}),
      clearing: !!sq.clearContact,
      recon: sq._reconTask ? 'active' : sq._reconLast ? sq._reconLast.reason : null,
      hold: sq._missionHold || null,
      assaultAuth: !!sq._assaultAuthorized,
      moving: moving,
      men: holders
    };
  }
  (root.BattleProbes = root.BattleProbes || {})['idle-attacker-trace'] = {
    every: 5,
    start: function () {
      hist = {};
      eps = {};
      dumps = [];
    },
    sample: function (sim) {
      ['us', 'ge'].forEach(function (f) {
        ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
          var id = String(sq.id),
            c = centre(sq);
          if (!c || sq.state === 'retreat') {
            delete eps[id];
            return;
          }
          var h = (hist[id] = hist[id] || []);
          h.push(row(sim, sq, c));
          if (h.length > 100) h.shift();
          var ep = eps[id];
          if (ep && Math.hypot(c.x - ep.x, c.z - ep.z) > 20) ep = eps[id] = null;
          if (!ep) ep = eps[id] = { x: c.x, z: c.z, start: sim.time, dumped: false };
          var m = sq._macroMission;
          if (
            !ep.dumped &&
            sim.time - ep.start >= 180 &&
            !sq.inContact &&
            m &&
            m.intent === 'capture' &&
            !(sq._preparedDefenseRequest || sq._captureZoneDefenseRequest)
          ) {
            ep.dumped = true;
            dumps.push({
              squad: id,
              faction: f,
              idleSince: +ep.start.toFixed(0),
              at: +sim.time.toFixed(0),
              history: h.filter(function (r) {
                return r.t >= ep.start - 40;
              })
            });
          }
        });
      });
    },
    report: function () {
      return { dumps: dumps };
    }
  };
})(window);
