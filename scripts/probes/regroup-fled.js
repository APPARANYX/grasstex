/* Who regroups when men flee (`?stressAct=flee`)? Observe only: reads leases, rosters and Engagement's `fledPhase`,
   writes nothing, draws no random number.

   Every `regroup` lease start (the Squad Leader's dispersal commit) is one row, with:
     - whose it is: a one-man squad of a fled man (`fledId`), or an ordinary squad;
     - how many men it has, its state and command phase, whether it is in contact, and the spread that started it;
     - how long ago it lost a man to flight (a man of this squad became a lone squad: `detachFled`) and how long ago it
       took one in (`absorb`: a lone man's squad folded into it), and how many men on its roster are in a fled phase now;
   and the totals by those causes, so the extra regroups under `?stressAct=flee` can be named. Run it with and without the
   flag on one seed and compare `starts`, `byOwner` and `byCause`. */
(function (root) {
  var seen, starts, lastLoss, lastTake, lostCount, took, prevSquad, leaseSince;
  function men(sq) {
    return (sq.members || []).filter(function (s) {
      return !s.dead && s.root;
    });
  }
  function bump(o, k) {
    o[k] = (o[k] || 0) + 1;
  }
  function start() {
    seen = {};
    starts = [];
    lastLoss = {};
    lastTake = {};
    lostCount = {};
    took = {};
    prevSquad = {};
    leaseSince = {};
  }
  function sample(sim) {
    var L = root.BattleLeases,
      t = sim.time,
      all = [];
    ['us', 'ge'].forEach(function (f) {
      ((sim.factions[f] && sim.factions[f].squads) || []).forEach(function (sq) {
        all.push(sq);
      });
    });
    var byId = {};
    all.forEach(function (sq) {
      byId[sq.id] = sq;
    });
    // roster moves: a man whose squad changed
    all.forEach(function (sq) {
      men(sq).forEach(function (s) {
        var was = prevSquad[s.id];
        if (was && was !== sq.id) {
          var from = byId[was],
            to = sq;
          if (to.fledId != null && from && from.fledId == null) {
            lastLoss[from.id] = t;
            bump(lostCount, from.id);
          } else if (from && from.fledId != null && to.fledId == null) {
            lastTake[to.id] = t;
            bump(took, to.id);
          }
        }
        prevSquad[s.id] = sq.id;
      });
    });
    all.forEach(function (sq) {
      var lease = L.get(sq, 'regroup');
      if (!lease || leaseSince[sq.id] === lease.since) return;
      leaseSince[sq.id] = lease.since;
      var living = men(sq),
        fledOn = living.filter(function (s) {
          return s.eng && s.eng.fledPhase;
        }).length,
        sinceLoss = lastLoss[sq.id] == null ? null : +(t - lastLoss[sq.id]).toFixed(1),
        sinceTake = lastTake[sq.id] == null ? null : +(t - lastTake[sq.id]).toFixed(1);
      starts.push({
        t: +t.toFixed(1),
        squad: sq.id,
        lone: sq.fledId != null,
        living: living.length,
        state: sq.state,
        phase: sq.commandPhase,
        inContact: !!sq.inContact,
        startSpread: lease.data && lease.data.startSpread != null ? +lease.data.startSpread.toFixed(1) : null,
        fledOnRoster: fledOn,
        lost: lostCount[sq.id] || 0,
        took: took[sq.id] || 0,
        sinceLoss: sinceLoss,
        sinceTake: sinceTake
      });
    });
  }
  function report(sim) {
    var byOwner = { lone: 0, ordinary: 0 },
      byCause = {},
      byLiving = {},
      byPhase = {};
    starts.forEach(function (r) {
      byOwner[r.lone ? 'lone' : 'ordinary']++;
      if (r.lone) return;
      var c = 'none of these';
      if (r.fledOnRoster > 0) c = 'a man in a fled phase is on the roster';
      else if (r.sinceTake != null && r.sinceTake <= 30) c = 'took a fled man in within 30 s';
      else if (r.sinceLoss != null && r.sinceLoss <= 30) c = 'lost a man to flight within 30 s';
      else if (r.lost > 0 || r.took > 0) c = 'has lost or taken a fled man earlier';
      bump(byCause, c);
      bump(byLiving, String(r.living));
      bump(byPhase, r.phase + (r.inContact ? ' (contact)' : ''));
    });
    var spreads = starts
      .filter(function (r) {
        return !r.lone && r.startSpread != null;
      })
      .map(function (r) {
        return r.startSpread;
      })
      .sort(function (a, b) {
        return a - b;
      });
    return {
      time: +sim.time.toFixed(1),
      starts: starts.length,
      byOwner: byOwner,
      byCause: byCause,
      ordinaryByLiving: byLiving,
      ordinaryByPhase: byPhase,
      ordinarySpread: spreads.length
        ? { median: spreads[spreads.length >> 1], p90: spreads[Math.floor(spreads.length * 0.9)], max: spreads[spreads.length - 1] }
        : null,
      examples: starts.slice(0, 30)
    };
  }
  (root.BattleProbes = root.BattleProbes || {})['regroup-fled'] = { every: 0, start: start, sample: sample, report: report };
})(window);
