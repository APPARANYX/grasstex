/* Low-forward-progress episode probe.
   Module 43 (squad-forward-progress) remains the authority for deciding that an episode is LFP.
   This probe only observes those alerts and freezes the preceding movement/command context so the
   alert can be separated into route churn, resolver handoffs, contact/fire-state churn, local
   avoidance, or low-net movement under otherwise stable orders.

   For every module-43 alert the report carries:
   - the original 15 s travel/net/efficiency alert and a 0.5 s pre-alert timeline;
   - command phase, goal distance, contact provenance, under-fire/suppression, Engagement-state mix;
   - Movement Resolver owner/kind/reason samples and exact destination-change history;
   - order-provenance events from the squad and its men over the same window;
   - local-avoidance/stop-reason samples plus nearby obstacle context at alert time;
   - evidence tags that summarize what changed without claiming causality.
   Observe only: no setters, RNG draws, leases, destinations, or gameplay state are changed. */
(function (root) {
  'use strict';

  var KEEP_SECONDS = 20,
    MAX_EPISODES = 40,
    MAX_EVENTS = 48,
    MAX_OBSTACLES = 16,
    ADVANCE = { approach: 1, assault: 1, capture: 1, 'clear-town': 1, flank: 1, 'corner-check': 1, regroup: 1 },
    c,
    history,
    seen;

  function bump(o, k, n) {
    k = String(k == null || k === '' ? 'unknown' : k);
    o[k] = (o[k] || 0) + (n == null ? 1 : n);
  }
  function point(p) {
    return p && isFinite(+p.x) && isFinite(+p.z) ? { x: +p.x, z: +p.z } : null;
  }
  function dist(a, b) {
    return !a || !b ? Infinity : Math.hypot(a.x - b.x, a.z - b.z);
  }
  function pointSegmentDistance(p, a, b) {
    if (!p || !a || !b) return Infinity;
    var dx = b.x - a.x,
      dz = b.z - a.z,
      den = dx * dx + dz * dz;
    if (den < 1e-9) return dist(p, a);
    var t = ((p.x - a.x) * dx + (p.z - a.z) * dz) / den;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + dx * t), p.z - (a.z + dz * t));
  }
  function personalSpaceAdjusted(s) {
    var d = s && s._personalSpaceDestination,
      intent = d && point(d.intent),
      actual = d && point(d.point);
    return !!(intent && actual && dist(intent, actual) > 0.05);
  }
  function physicalDetour(s) {
    var from = s && s.root && point(s.root.position),
      goal = s && point(s.destination),
      path = s && s._physicalPath,
      pts = path && path.points,
      start = path && isFinite(+path.index) ? Math.max(0, +path.index) : 0;
    if (!from || !goal || !path || path.blocked || !Array.isArray(pts) || pts.length - start < 2 || dist(from, goal) < 4)
      return false;
    for (var i = start; i < pts.length; i++) {
      var q = point(pts[i]);
      if (q && pointSegmentDistance(q, from, goal) > 2) return true;
    }
    return false;
  }
  function directPathBlocked(s) {
    var N = root.BattleNavigation,
      from = s && s.root && point(s.root.position),
      goal = s && point(s.destination);
    if (!N || !N.movementClear || !from || !goal) return null;
    try {
      return !N.movementClear(from, goal);
    } catch (_) {
      return null;
    }
  }
  function sqKey(sq) {
    return String((sq && sq.faction) || '?') + ':' + String((sq && sq.id) || '?');
  }
  function rosterKey(sq) {
    var a=(sq&&sq.members)||[],ids=[];
    for(var i=0;i<a.length;i++){var s=a[i];if(!s||s.dead||!s.root)continue;ids.push(s.id==null?'#'+i:String(s.id));}
    ids.sort();return ids.join(',');
  }
  function centroid(sq) {
    var a = (sq && sq.members) || [],
      x = 0,
      z = 0,
      n = 0;
    for (var i = 0; i < a.length; i++) {
      var s = a[i],
        p = s && !s.dead && s.root && point(s.root.position);
      if (!p) continue;
      x += p.x;
      z += p.z;
      n++;
    }
    return n ? { x: x / n, z: z / n } : null;
  }
  function objectiveById(sim, id) {
    var a = (sim && sim._objectives) || [];
    for (var i = 0; i < a.length; i++) {
      var o = a[i];
      if (String(o && o.id) === String(id)) return point(o.def || o);
    }
    return null;
  }
  function measuredGoal(sim, sq) {
    var ph = String((sq && sq.commandPhase) || '');
    if (ph === 'regroup') {
      var L = root.BattleLeases,
        rg = L && L.get ? L.get(sq, 'regroup') : null,
        a = rg && rg.data && point(rg.data.anchor);
      return a ? { kind: 'rally', point: a } : null;
    }
    var g =
      objectiveById(sim, sq && sq.targetObjective) ||
      point(sq && sq._routeFinalObjective) ||
      point(sq && sq.objective);
    return g ? { kind: 'objective', point: g } : null;
  }
  function contactKind(sq, now) {
    var q = sq && sq.contact;
    if (!q) return { kind: 'none', age: null, target: null };
    var kind = q.heard ? 'heard' : q.relayedFrom ? 'relayed' : 'first-hand';
    return {
      kind: kind,
      age: isFinite(+q.at) ? +(now - q.at).toFixed(2) : null,
      target: q.unit && q.unit.id != null ? String(q.unit.id) : null,
      relayedFrom: q.relayedFrom == null ? null : String(q.relayedFrom)
    };
  }
  function underFire(s, sim) {
    var E = root.BattleEngagement;
    if (E && E.underFireNow) {
      try {
        return !!E.underFireNow(s, sim);
      } catch (_) {}
    }
    return !!(s && (+s.suppressedUntil || 0) > sim.time);
  }
  function resolverLast(s) {
    return (s && s._movementResolver && s._movementResolver.last) || null;
  }
  function snap(sim, sq) {
    var members = (sq.members || []).filter(function (s) {
        return s && !s.dead && s.root;
      }),
      states = {},
      resolverKinds = {},
      resolverOwners = {},
      resolverReasons = {},
      stops = {},
      stance = {},
      under = 0,
      suppressed = 0,
      localAvoidance = 0,
      navigationDetour = 0,
      navigationRequired = 0,
      navigationClearDirect = 0,
      moving = 0,
      speed = 0,
      destChanges = 0,
      p = centroid(sq),
      mg = measuredGoal(sim, sq),
      now = +sim.time || 0;

    for (var i = 0; i < members.length; i++) {
      var s = members[i],
        e = (s.eng && s.eng.state) || 'none',
        last = resolverLast(s),
        st = s._movementResolver;
      bump(states, e);
      bump(stance, s.prone ? (s.crawling ? 'crawl' : 'prone') : s.crouching ? 'crouch' : 'stand');
      if (last) {
        bump(resolverKinds, last.kind || 'none');
        bump(resolverOwners, last.owner || 'none');
        bump(resolverReasons, last.reason || last.kind || 'none');
      } else {
        bump(resolverKinds, 'none');
        bump(resolverOwners, 'none');
      }
      if (s._movementStopReason) bump(stops, s._movementStopReason);
      if (underFire(s, sim)) under++;
      if ((+s.suppressedUntil || 0) > now) suppressed++;
      if (
        (+s._movementYieldUntil || 0) > now ||
        (+s._separatedAt || -1e9) > now - 1 ||
        personalSpaceAdjusted(s)
      )
        localAvoidance++;
      if (physicalDetour(s)) {
        navigationDetour++;
        var blockedDirect = directPathBlocked(s);
        if (blockedDirect === true) navigationRequired++;
        else if (blockedDirect === false) navigationClearDirect++;
      }
      var v = +s.moveSpeed || 0;
      speed += v;
      if (v > 0.35) moving++;
      destChanges += (st && +st.changes) || 0;
    }

    return {
      t: +now.toFixed(2),
      phase: String(sq.commandPhase || ''),
      squadState: String(sq.state || ''),
      centroid: p ? [+p.x.toFixed(2), +p.z.toFixed(2)] : null,
      goalKind: mg && mg.kind,
      goalDistance: p && mg ? +dist(p, mg.point).toFixed(2) : null,
      routeIndex: isFinite(+sq.routeIndex) ? +sq.routeIndex : null,
      inContact: !!sq.inContact,
      contact: contactKind(sq, now),
      living: members.length,
      rosterKey: rosterKey(sq),
      underFire: under,
      suppressed: suppressed,
      moving: moving,
      avgSpeed: members.length ? +(speed / members.length).toFixed(2) : 0,
      localAvoidance: localAvoidance,
      navigationDetour: navigationDetour,
      navigationRequired: navigationRequired,
      navigationClearDirect: navigationClearDirect,
      destinationChanges: destChanges,
      states: states,
      stances: stance,
      resolverKinds: resolverKinds,
      resolverOwners: resolverOwners,
      resolverReasons: resolverReasons,
      stopReasons: stops
    };
  }
  function trim(a, now) {
    while (a.length && now - a[0].t > KEEP_SECONDS) a.shift();
  }
  function transitions(a, value) {
    var n = 0,
      prev;
    for (var i = 0; i < a.length; i++) {
      var v = value(a[i]);
      if (i && v !== prev) n++;
      prev = v;
    }
    return n;
  }
  function addCounts(to, from) {
    Object.keys(from || {}).forEach(function (k) {
      bump(to, k, from[k]);
    });
  }
  function movementEvents(sq, from, to) {
    var out = [],
      members = sq.members || [];
    for (var i = 0; i < members.length; i++) {
      var s = members[i],
        h = (s && s._movementResolver && s._movementResolver.history) || [];
      for (var j = 0; j < h.length; j++) {
        var e = h[j];
        if (+e.time < from || +e.time > to) continue;
        out.push({
          t: +(+e.time).toFixed(2),
          soldier: s.id,
          source: e.source || null,
          reason: e.reason || null,
          kind: e.kind || null,
          phase: e.commandPhase || null,
          engagement: e.engagementState || null,
          inContact: !!e.inContact,
          localAvoidance: !!e.localAvoidance,
          distanceDelta: isFinite(+e.destinationDistanceDelta) ? +(+e.destinationDistanceDelta).toFixed(2) : null,
          from: point(e.oldDestination),
          to: point(e.newDestination)
        });
      }
    }
    out.sort(function (a, b) {
      return a.t - b.t || String(a.soldier).localeCompare(String(b.soldier));
    });
    return out;
  }
  function ownerSwitches(events) {
    var by = {},
      n = 0;
    for (var i = 0; i < events.length; i++) {
      var e = events[i],
        k = String(e.soldier),
        p = by[k];
      if (p != null && p !== e.source) n++;
      by[k] = e.source;
    }
    return n;
  }
  function provenance(sim, sq, from, to) {
    var P = root.BattleOrderProvenance,
      all = P && P.events ? P.events(sim) : [],
      out = [];
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (
        +e.time >= from &&
        +e.time <= to &&
        String(e.faction) === String(sq.faction) &&
        String(e.squad) === String(sq.id)
      ) {
        out.push({
          t: +(+e.time).toFixed(2),
          target: e.targetKind,
          soldier: e.soldier,
          field: e.field,
          owner: e.owner,
          proposalOwner: e.proposalOwner,
          reason: e.reason || e.site || null,
          phase: e.phase || null,
          inContact: !!e.inContact
        });
      }
    }
    return out.slice(Math.max(0, out.length - MAX_EVENTS));
  }
  function obstacleContext(sim, p) {
    var F = root.BattleObstacleField;
    if (!F || !F.nearby || !p) return null;
    try {
      var a = F.nearby(sim.obstacles, p.x, p.z, 8) || [],
        byKind = {},
        physical = 0,
        rows = [];
      for (var i = 0; i < a.length; i++) {
        var o = a[i];
        bump(byKind, o.kind || o.type || 'unknown');
        if (o.physicalId != null) physical++;
        if (rows.length < MAX_OBSTACLES)
          rows.push({
            kind: o.kind || o.type || null,
            dx: isFinite(+o.x) ? +(+o.x - p.x).toFixed(1) : null,
            dz: isFinite(+o.z) ? +(+o.z - p.z).toFixed(1) : null,
            r: isFinite(+o.radius) ? +(+o.radius).toFixed(2) : null,
            physical: o.physicalId != null
          });
      }
      return { count: a.length, physical: physical, byKind: byKind, nearest: rows };
    } catch (_) {
      return null;
    }
  }
  function membersAt(sim, sq) {
    var now = sim.time;
    return (sq.members || [])
      .filter(function (s) {
        return s && !s.dead && s.root;
      })
      .map(function (s) {
        var p = point(s.root.position),
          d = point(s.destination),
          r = resolverLast(s);
        return {
          id: s.id,
          role: s.role || null,
          state: s.eng && s.eng.state,
          stance: s.prone ? (s.crawling ? 'crawl' : 'prone') : s.crouching ? 'crouch' : 'stand',
          pos: p ? [+p.x.toFixed(1), +p.z.toFixed(1)] : null,
          destination: d ? [+d.x.toFixed(1), +d.z.toFixed(1)] : null,
          destDistance: p && d ? +dist(p, d).toFixed(1) : null,
          speed: +(+s.moveSpeed || 0).toFixed(2),
          underFire: underFire(s, sim),
          suppressed: (+s.suppressedUntil || 0) > now,
          localAvoidance:
            (+s._movementYieldUntil || 0) > now ||
            (+s._separatedAt || -1e9) > now - 1 ||
            personalSpaceAdjusted(s),
          navigationDetour: physicalDetour(s),
          navigationDirectBlocked: physicalDetour(s) ? directPathBlocked(s) : null,
          stop: s._movementStopReason || null,
          resolver: r
            ? { owner: r.owner || null, kind: r.kind || null, reason: r.reason || null, tacticalReason: r.tacticalReason || null }
            : null
        };
      });
  }
  function signals(ep) {
    var a = ep.alert,
      s = ep.summary,
      out = [];
    if ((a.routeChanges || 0) >= 2) out.push('route-churn');
    if (s.destinationChanges >= 5) out.push('destination-churn');
    if (s.resolverOwnerSwitches >= 3) out.push('resolver-handoffs');
    if (s.contactTransitions >= 3) out.push('contact-churn');
    if (s.fireTransitions >= 3) out.push('fire-state-churn');
    if (s.localAvoidanceShare >= 0.25) out.push('local-avoidance-active');
    if (s.navigationDetourShare >= 0.25) out.push('navigation-detour');
    if (s.navigationRequiredShare >= 0.25) out.push('navigation-detour-required');
    if (s.navigationClearDirectShare >= 0.25) out.push('navigation-detour-clear-direct');
    if (s.rosterTransitions > 0) out.push('roster-change');
    if (s.progressGiveback >= 3) out.push('progress-giveback');
    if ((s.byKind['cover-bound'] || 0) > 0 && s.progressGiveback >= 3) out.push('tactical-cover-backtrack');
    if (a.goalKind === 'rally') out.push('regroup-window');
    if (s.formationShare >= 0.6) out.push('formation-dominated');
    if (s.combatShare >= 0.6) out.push('combat-intent-dominated');
    if (!out.length) out.push('low-net-with-stable-orders');
    return out;
  }
  function capture(sim, sq, a) {
    var k = sqKey(sq),
      all = history.get(k) || [],
      from = isFinite(+a.startAt) ? +a.startAt - 0.25 : a.at - (a.window || 15) - 0.75,
      to = isFinite(+a.endAt) ? +a.endAt + 0.25 : a.at + 0.25,
      snaps = all.filter(function (x) {
        return x.t >= from && x.t <= to;
      }),
      exactFrom = isFinite(+a.startAt) ? +a.startAt : from,
      exactTo = isFinite(+a.endAt) ? +a.endAt : to,
      trackSnaps = snaps.filter(function (x) {
        return x.t + 1e-6 >= exactFrom && x.t - 1e-6 <= exactTo && (!a.goalKind || x.goalKind === a.goalKind);
      }),
      moves = movementEvents(sq, exactFrom, exactTo),
      byOwner = {},
      byKind = {},
      byReason = {},
      stateSamples = {},
      stopSamples = {},
      localSamples = 0,
      detourSamples = 0,
      requiredDetourSamples = 0,
      clearDirectDetourSamples = 0,
      formationSamples = 0,
      combatSamples = 0,
      totalResolverSamples = 0;

    for (var i = 0; i < moves.length; i++) {
      bump(byOwner, moves[i].source);
      bump(byKind, moves[i].kind);
      bump(byReason, moves[i].reason);
    }
    for (i = 0; i < trackSnaps.length; i++) {
      addCounts(stateSamples, trackSnaps[i].states);
      addCounts(stopSamples, trackSnaps[i].stopReasons);
      if (trackSnaps[i].localAvoidance > 0) localSamples++;
      if (trackSnaps[i].navigationDetour > 0) detourSamples++;
      if (trackSnaps[i].navigationRequired > 0) requiredDetourSamples++;
      if (trackSnaps[i].navigationClearDirect > 0) clearDirectDetourSamples++;
      var kinds = trackSnaps[i].resolverKinds || {};
      Object.keys(kinds).forEach(function (kind) {
        var n = kinds[kind] || 0;
        totalResolverSamples += n;
        if (kind === 'formation') formationSamples += n;
        else if (kind !== 'none') combatSamples += n;
      });
    }

    var p = centroid(sq),
      distances = trackSnaps.map(function(x){return x.goalDistance;}).filter(function(x){return x!=null&&isFinite(+x);}),
      startDistance = distances.length ? +distances[0] : null,
      endDistance = distances.length ? +distances[distances.length-1] : null,
      bestDistance = distances.length ? Math.min.apply(Math,distances) : null,
      underFireSamples = trackSnaps.filter(function(x){return x.underFire>0;}).length,
      summary = {
        snapshots: trackSnaps.length,
        contextSnapshots: snaps.length,
        destinationChanges: moves.length,
        resolverOwnerSwitches: ownerSwitches(moves),
        rosterTransitions: transitions(trackSnaps,function(x){return x.rosterKey;}),
        progressGiveback: bestDistance==null||endDistance==null?0:+(endDistance-bestDistance).toFixed(2),
        bestProgress: startDistance==null||bestDistance==null?0:+(startDistance-bestDistance).toFixed(2),
        underFireShare: trackSnaps.length ? +(underFireSamples/trackSnaps.length).toFixed(3) : 0,
        contactTransitions: transitions(trackSnaps, function (x) {
          return x.inContact + ':' + (x.contact && x.contact.kind);
        }),
        fireTransitions: transitions(trackSnaps, function (x) {
          return x.underFire > 0;
        }),
        localAvoidanceShare: trackSnaps.length ? +(localSamples / trackSnaps.length).toFixed(3) : 0,
        navigationDetourShare: trackSnaps.length ? +(detourSamples / trackSnaps.length).toFixed(3) : 0,
        navigationRequiredShare: trackSnaps.length ? +(requiredDetourSamples / trackSnaps.length).toFixed(3) : 0,
        navigationClearDirectShare: trackSnaps.length ? +(clearDirectDetourSamples / trackSnaps.length).toFixed(3) : 0,
        formationShare: totalResolverSamples ? +(formationSamples / totalResolverSamples).toFixed(3) : 0,
        combatShare: totalResolverSamples ? +(combatSamples / totalResolverSamples).toFixed(3) : 0,
        byOwner: byOwner,
        byKind: byKind,
        byReason: byReason,
        stateSamples: stateSamples,
        stopReasonSamples: stopSamples
      },
      ep = {
        alert: JSON.parse(JSON.stringify(a)),
        summary: summary,
        signals: [],
        timeline: snaps,
        movementEvents: moves.slice(Math.max(0, moves.length - MAX_EVENTS)),
        provenance: provenance(sim, sq, from, to),
        members: membersAt(sim, sq),
        obstacles: obstacleContext(sim, p)
      };
    ep.signals = signals(ep);
    return ep;
  }
  function ingestAlerts(sim) {
    var fp = sim && sim._squadForwardProgress,
      alerts = (fp && fp.alerts) || [],
      P = root.BattleOrderProvenance;
    for (var i = 0; i < alerts.length; i++) {
      var a = alerts[i],
        sig = [a.faction, a.squad, a.at].join('|');
      if (seen[sig]) continue;
      seen[sig] = 1;
      var sq = P && P.findSquad ? P.findSquad(sim, a.faction, a.squad) : null;
      if (!sq) {
        var list = sim.factions && sim.factions[a.faction] && sim.factions[a.faction].squads;
        for (var j = 0; !sq && list && j < list.length; j++) if (String(list[j].id) === String(a.squad)) sq = list[j];
      }
      if (!sq) continue;
      var ep = capture(sim, sq, a);
      c.episodes.push(ep);
      if (c.episodes.length > MAX_EPISODES) c.episodes.shift();
      bump(c.byFaction, a.faction);
      bump(c.byPhase, (a.phases && a.phases.join('>')) || sq.commandPhase || 'unknown');
      bump(c.byGoalKind, a.goalKind || 'unknown');
      ep.signals.forEach(function (x) {
        bump(c.bySignal, x);
      });
    }
  }

  (root.BattleProbes = root.BattleProbes || {})['lfp'] = {
    every: 0.5,
    start: function (sim) {
      c = {
        detector: {
          source: 'BattleSquadForwardProgress/module-43',
          windowSeconds:
            (root.BattleSquadForwardProgress && root.BattleSquadForwardProgress.windowSeconds) || 15
        },
        episodes: [],
        byFaction: {},
        byPhase: {},
        byGoalKind: {},
        bySignal: {}
      };
      history = new Map();
      seen = Object.create(null);
      ingestAlerts(sim);
    },
    sample: function (sim) {
      var now = +sim.time || 0;
      ['us', 'ge'].forEach(function (f) {
        var a = (sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
        for (var i = 0; i < a.length; i++) {
          var sq = a[i],
            ph = String((sq && sq.commandPhase) || '');
          if (!sq || sq.state === 'retreat' || !ADVANCE[ph]) continue;
          var k = sqKey(sq),
            h = history.get(k);
          if (!h) history.set(k, (h = []));
          h.push(snap(sim, sq));
          trim(h, now);
        }
      });
      ingestAlerts(sim);
    },
    report: function (sim) {
      ingestAlerts(sim);
      var n = c.episodes.length,
        travel = 0,
        net = 0,
        eff = 0,
        dest = 0,
        handoffs = 0,
        contact = 0,
        fire = 0;
      for (var i = 0; i < n; i++) {
        var e = c.episodes[i];
        travel += +e.alert.travel || 0;
        net += +e.alert.net || 0;
        eff += +e.alert.efficiency || 0;
        dest += +e.summary.destinationChanges || 0;
        handoffs += +e.summary.resolverOwnerSwitches || 0;
        contact += +e.summary.contactTransitions || 0;
        fire += +e.summary.fireTransitions || 0;
      }
      var fp = sim && sim._squadForwardProgress;
      return {
        detector: c.detector,
        module43TotalAlerts: fp ? +fp.totalAlerts || 0 : null,
        module43TrackResets: fp && fp.trackResets ? JSON.parse(JSON.stringify(fp.trackResets)) : null,
        capturedEpisodes: n,
        mean: {
          travel: n ? +(travel / n).toFixed(2) : 0,
          net: n ? +(net / n).toFixed(2) : 0,
          efficiency: n ? +(eff / n).toFixed(3) : 0,
          destinationChanges: n ? +(dest / n).toFixed(2) : 0,
          resolverOwnerSwitches: n ? +(handoffs / n).toFixed(2) : 0,
          contactTransitions: n ? +(contact / n).toFixed(2) : 0,
          fireTransitions: n ? +(fire / n).toFixed(2) : 0
        },
        byFaction: c.byFaction,
        byPhase: c.byPhase,
        byGoalKind: c.byGoalKind,
        bySignal: c.bySignal,
        episodes: c.episodes
      };
    }
  };
})(window);
