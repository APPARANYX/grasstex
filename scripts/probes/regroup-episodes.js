/* Why do regroups end the way they do? (468581f "Re-form regrouping squads on the rally point")
   Follows every `regroup` lease from grant to end. At the start: the rally point, the core spread and
   how far the Squad Leader's order anchor is from the rally point. At the end: the end reason
   (cohesion restored / maximum regroup time / contact), duration, and for the living men their
   distance to the rally point, how far their destination is from it, and whether they were moving.
   The 18 s timeouts were men walking to an order anchor 105-160 m from the rally point. Observe only. */
(function (root) {
  var MOVING = 0.05;
  var eps, open, last;
  function d(a, b) {
    return a && b ? Math.hypot(a.x - b.x, a.z - b.z) : null;
  }
  function stats(xs) {
    xs = xs.filter(function (v) { return v != null && isFinite(v); }).sort(function (a, b) { return a - b; });
    if (!xs.length) return null;
    return { median: +xs[xs.length >> 1].toFixed(1), max: +xs[xs.length - 1].toFixed(1) };
  }
  function men(sq) {
    return (sq.members || []).filter(function (s) { return !s.dead && s.root; });
  }
  (root.BattleProbes = root.BattleProbes || {})['regroup-episodes'] = {
    every: 0.15,
    start: function () {
      eps = [];
      open = {};
      last = {};
    },
    sample: function (sim) {
      var L = root.BattleLeases,
        t = sim.time;
      ['us', 'ge'].forEach(function (f) {
        (sim.factions[f].squads || []).forEach(function (sq) {
          var lease = L.get(sq, 'regroup'),
            ep = open[sq.id],
            moving = {};
          men(sq).forEach(function (s) {
            var p = s.root.position,
              q = last[s.id];
            moving[s.id] = !!q && Math.hypot(p.x - q.x, p.z - q.z) > MOVING;
            last[s.id] = { x: p.x, z: p.z };
          });
          if (lease && (!ep || ep.since !== lease.since)) {
            var rally = lease.data && lease.data.anchor;
            open[sq.id] = ep = {
              squad: sq.id, since: lease.since, rally: rally,
              startSpread: lease.data && lease.data.startSpread != null ? +lease.data.startSpread.toFixed(1) : null,
              orderAnchorFromRally: d(sq.orderAnchor, rally) == null ? null : +d(sq.orderAnchor, rally).toFixed(1)
            };
          }
          if (ep && !lease) {
            var ended = ((sq._leases && sq._leases.ended) || []).filter(function (l) { return l.kind === 'regroup' && l.since === ep.since; }).pop(),
              living = men(sq);
            ep.end = ended ? ended.endReason : 'lease vanished';
            ep.duration = +((ended ? ended.endedAt : t) - ep.since).toFixed(2);
            ep.since = +ep.since.toFixed(2);
                        ep.orderAnchorFromRallyAtEnd = d(sq.orderAnchor, ep.rally) == null ? null : +d(sq.orderAnchor, ep.rally).toFixed(1);
            ep.menFromRally = stats(living.map(function (s) { return d(s.root.position, ep.rally); }));
            ep.destinationsFromRally = stats(living.map(function (s) { return d(s.destination, ep.rally); }));
            ep.moving = living.filter(function (s) { return moving[s.id]; }).length;
            ep.living = living.length;
            delete ep.rally;
            eps.push(ep);
            delete open[sq.id];
          }
        });
      });
    },
    report: function () {
      var by = {};
      eps.forEach(function (e) { by[e.end] = (by[e.end] || 0) + 1; });
      var timedOut = eps.filter(function (e) { return e.end === 'maximum regroup time'; });
      return {
        episodes: eps.length,
        byEnd: by,
        stillOpen: Object.keys(open).length,
        timedOut: {
          count: timedOut.length,
          orderAnchorFromRally: stats(timedOut.map(function (e) { return e.orderAnchorFromRallyAtEnd; })),
          destinationsFromRallyMedian: stats(timedOut.map(function (e) { return e.destinationsFromRally && e.destinationsFromRally.median; }))
        },
        list: eps
      };
    }
  };
})(window);
