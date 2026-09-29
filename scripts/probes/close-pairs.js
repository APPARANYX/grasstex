/* Where do personal-space corrections come from? (PRs #42 and #46)
   Every step, every pair of living men closer than CLOSE m is a close pair. Each new pair (an
   onset) is classified once: same squad / other squad / enemy, same or different fireteam, the
   resolver kinds each man was last moving to (`_movementResolver.last.kind`, e.g.
   formation+formation), who was moving, and whether the squad changed formation or facing in the
   last AFTER_CHANGE s. A pair still closer than CLOSE after PERSIST s counts as persistent.
   `afterChange.share` vs `afterChange.timeShare` is the "~7x higher after a formation change" test.
   Observe only. */
(function (root) {
  var CLOSE = 0.9,
    PERSIST = 1,
    AFTER_CHANGE = 6,
    TURN = Math.PI / 6;
  var c, live, last, squads;
  function inc(map, k) {
    map[k] = (map[k] || 0) + 1;
  }
  function kindOf(s) {
    var r = s._movementResolver && s._movementResolver.last;
    return (r && r.kind) || 'none';
  }
  function heading(sq) {
    var o = sq._fireteamOrders || {};
    for (var k in o) if (o[k] && o[k].forward) return Math.atan2(o[k].forward.x, o[k].forward.z);
    return null;
  }
  /* Two men of different fireteams on formation slots meet. Are their slots themselves closer than
     CLOSE (an allocation problem), or are they crossing on the way (slots >= CLOSE apart, but in the
     opposite lateral order to where the men now stand: the frame or the team assignment turned under
     them)? Also when in the battle, since the first minute is the deployment. */
  function crossClass(a, b, t) {
    var da = a._fireteamDestination,
      db = b._fireteamDestination,
      o = a.squad && a.squad._fireteamOrders && a.squad._fireteamOrders[a._fireteamKey],
      f = o && o.forward;
    var when = t < 10 ? 'first10s' : t < 60 ? 'to60s' : 'later';
    if (!da || !db || !f) return when + ' | no-slot';
    var gap = Math.hypot(da.x - db.x, da.z - db.z),
      pa = a.root.position,
      pb = b.root.position,
      lat = function (p) {
        return p.x * -f.z + p.z * f.x;
      },
      swapped = (lat(pa) - lat(pb)) * (lat(da) - lat(db)) < 0;
    var far = function (m, d) {
      return Math.hypot(m.root.position.x - d.x, m.root.position.z - d.z) > 3 ? 'off-slot' : 'on-slot';
    };
    return (
      when + ' | ' + (a.squad.formation || '?') + ' | slots ' + (gap < CLOSE ? 'collide' : gap < 4 ? '<4 m' : gap < 12 ? '4-12 m' : '>=12 m') + ' | ' +
      (swapped ? 'lateral order swapped' : 'same order') + ' | ' + [far(a, da), far(b, db)].sort().join('+')
    );
  }
  function trackSquads(sim) {
    var t = sim.time;
    ['us', 'ge'].forEach(function (f) {
      (sim.factions[f].squads || []).forEach(function (sq) {
        var st = squads[sq.id] || (squads[sq.id] = { form: sq.formation, head: heading(sq), changedAt: -1e9 }),
          h = heading(sq);
        var turned = h != null && st.head != null && Math.abs(Math.atan2(Math.sin(h - st.head), Math.cos(h - st.head))) > TURN;
        if (sq.formation !== st.form || turned) {
          st.changedAt = t;
          st.form = sq.formation;
          st.head = h;
          c.formationOrFacingChanges++;
        } else if (st.head == null) st.head = h;
        c.squadSamples++;
        if (t - st.changedAt < AFTER_CHANGE) c.squadSamplesAfterChange++;
      });
    });
  }
  (root.BattleProbes = root.BattleProbes || {})['close-pairs'] = {
    every: 0,
    start: function () {
      c = { onsets: 0, persistent: 0, maxPersistentAtOnce: 0, relation: {}, fireteams: {}, kinds: {}, moving: {}, persistentKinds: {}, onsetsAfterChange: 0, formationOrFacingChanges: 0, squadSamples: 0, squadSamplesAfterChange: 0, firstMinute: 0, crossTeamFormation: {} };
      live = {};
      last = {};
      squads = {};
    },
    sample: function (sim) {
      trackSquads(sim);
      var men = (sim._roster.us || []).concat(sim._roster.ge || []).filter(function (s) {
          return !s.dead && s.root;
        }),
        t = sim.time,
        now = {},
        moved = {};
      men.forEach(function (s) {
        var p = s.root.position,
          q = last[s.id];
        moved[s.id] = !!q && Math.hypot(p.x - q.x, p.z - q.z) > 0.02;
        last[s.id] = { x: p.x, z: p.z };
      });
      for (var i = 0; i < men.length; i++)
        for (var j = i + 1; j < men.length; j++) {
          var a = men[i],
            b = men[j],
            pa = a.root.position,
            pb = b.root.position;
          if (Math.abs(pa.x - pb.x) > CLOSE || Math.abs(pa.z - pb.z) > CLOSE || Math.hypot(pa.x - pb.x, pa.z - pb.z) > CLOSE) continue;
          var key = a.id < b.id ? a.id + '|' + b.id : b.id + '|' + a.id;
          now[key] = live[key] || { since: t, counted: false, kinds: [kindOf(a), kindOf(b)].sort().join('+') };
          if (live[key]) continue;
          c.onsets++;
          if (t < 60) c.firstMinute++;
          var rel = a.faction !== b.faction ? 'enemy' : a.squad === b.squad ? 'same-squad' : 'other-squad';
          inc(c.relation, rel);
          if (rel === 'same-squad') inc(c.fireteams, a._fireteamKey === b._fireteamKey ? 'same-fireteam' : 'different-fireteam');
          inc(c.kinds, now[key].kinds);
          if (rel === 'same-squad' && a._fireteamKey !== b._fireteamKey && now[key].kinds === 'formation+formation')
            inc(c.crossTeamFormation, crossClass(a, b, t));
          inc(c.moving, moved[a.id] && moved[b.id] ? 'both' : moved[a.id] || moved[b.id] ? 'one' : 'neither');
          var st = a.squad && squads[a.squad.id];
          if (rel === 'same-squad' && st && t - st.changedAt < AFTER_CHANGE) c.onsetsAfterChange++;
        }
      var persistingNow = 0;
      for (var k in now)
        if (t - now[k].since >= PERSIST) {
          persistingNow++;
          if (!now[k].counted) {
            now[k].counted = true;
            c.persistent++;
            inc(c.persistentKinds, now[k].kinds);
          }
        }
      c.maxPersistentAtOnce = Math.max(c.maxPersistentAtOnce, persistingNow);
      live = now;
    },
    report: function (sim) {
      var ss = sim._personalSpaceStats || {},
        sameSquad = c.relation['same-squad'] || 0;
      return Object.assign({}, c, {
        afterChange: {
          share: sameSquad ? +(c.onsetsAfterChange / sameSquad).toFixed(3) : 0,
          timeShare: c.squadSamples ? +(c.squadSamplesAfterChange / c.squadSamples).toFixed(3) : 0
        },
        personalSpace: { pairCorrections: ss.pairCorrections || 0, destinationConflicts: ss.destinationConflicts || 0 }
      });
    }
  };
})(window);
