/* Compact AI battle timeline + focused battle observer.
   Observe-only: reads live state, stores one compact sample per simulated second, records semantic
   changes at exact sim.time, and preserves 0.5 s context only around trouble/flow episodes. It draws
   no RNG and writes no gameplay state. Movement stall detection intentionally matches
   scripts/probes/move-stalls.js. */
(function (root) {
  'use strict';

  var SAMPLE_SECONDS = 1,
    FOCUS_SECONDS = 0.5,
    FOCUS_PRE = 15,
    FOCUS_POST = 30,
    MAX_FOCUS_WINDOWS = 12,
    MAX_FOCUS_REASONS = 12,
    LOOP_EPISODE_SECONDS = 15;
  var COMBAT = {
    orient: 1,
    bound: 1,
    engage: 1,
    pinned: 1,
    assault: 1,
    station: 1,
    withdraw: 1,
    suppress: 1,
    cower: 1,
    flee: 1,
    freeze: 1,
    rage: 1
  };
  var ADVANCE = { approach: 1, assault: 1, capture: 1, 'clear-town': 1, flank: 1 };
  var store = new WeakMap();

  function rounded(v, n) {
    v = +v;
    return isFinite(v) ? +v.toFixed(n == null ? 1 : n) : null;
  }
  function point(v) {
    return v && isFinite(+v.x) && isFinite(+v.z) ? [rounded(v.x, 1), rounded(v.z, 1)] : null;
  }
  function bump(o, k, n) {
    k = String(k || 'unknown');
    o[k] = (o[k] || 0) + (n == null ? 1 : n);
  }
  function units(sim) {
    try {
      return root.BattleModules.unitsFor(sim) || [];
    } catch (_) {
      return [];
    }
  }
  function engState(s) {
    try {
      var e =
        root.BattleEngagement && root.BattleEngagement.stateOf
          ? root.BattleEngagement.stateOf(s)
          : s && s.eng;
      return (e && e.state) || (s && s.eng && s.eng.state) || 'unknown';
    } catch (_) {
      return (s && s.eng && s.eng.state) || 'unknown';
    }
  }
  function objectiveStatus(sim, id) {
    try {
      return root.BattleObjectiveSystem && root.BattleObjectiveSystem.status
        ? root.BattleObjectiveSystem.status(sim, id) || {}
        : {};
    } catch (_) {
      return {};
    }
  }
  function battleSeed(sim) {
    var m = sim && sim.scene && sim.scene.metadata,
      sc = m && (m.battleScenario || m.battleTown);
    return (sc && sc.seed) || (sim && sim.seed) || null;
  }
  function squadKey(side, id) {
    return String(side || '?') + ':' + String(id == null ? '?' : id);
  }
  function sideSquads(sim, f) {
    return (sim && sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
  }
  function fresh(sim) {
    return {
      sim: sim,
      nextSample: 0,
      nextFocusSample: 0,
      samples: [],
      markers: [],
      stall: new Map(),
      prevPhase: new Map(),
      prevBrief: new Map(),
      prevRetreat: new Map(),
      prevContact: new Map(),
      prevBound: new Map(),
      prevOwner: new Map(),
      firstContact: { us: false, ge: false },
      prevAlive: { us: null, ge: null },
      wakeCount: 0,
      mergeEnded: 0,
      lfpSeen: new Set(),
      loopSeen: new Set(),
      loopEpisodeAt: new Map(),
      focusBuffer: [],
      focusWindows: [],
      activeFocus: new Map(),
      focusDropped: 0,
      nextFocusId: 1
    };
  }
  function get(sim) {
    var s = store.get(sim);
    if (!s) {
      s = fresh(sim);
      store.set(sim, s);
    }
    return s;
  }
  function reset(sim) {
    if (sim) store.set(sim, fresh(sim));
  }
  function marker(st, t, kind, data) {
    var m = { t: rounded(t, 2), kind: kind };
    if (data)
      Object.keys(data).forEach(function (k) {
        if (data[k] !== undefined) m[k] = data[k];
      });
    st.markers.push(m);
    return m;
  }
  function briefSig(q) {
    var m = q && q._macroMission;
    if (!m) return 'none';
    return [
      m.status || 'none',
      m.intent || '',
      m.action || '',
      m.objectiveId || '',
      m.point && rounded(m.point.x, 1),
      m.point && rounded(m.point.z, 1)
    ].join('|');
  }
  function resolverData(s) {
    var last = (s && s._movementResolver && s._movementResolver.last) || {};
    return { owner: last.owner || null, kind: last.kind || null, reason: last.reason || null };
  }
  function soldierDetail(sim, st, s) {
    var p = s && s.root && s.root.position,
      d = s && s.destination,
      last = resolverData(s),
      phase = (s && s.squad && s.squad.commandPhase) || 'none',
      id = String((s && s.faction) || '?') + ':' + String(s && s.id),
      tr = st.stall.get(id),
      dist = p && d ? Math.hypot((+p.x || 0) - (+d.x || 0), (+p.z || 0) - (+d.z || 0)) : null;
    return {
      id: s && s.id,
      role: (s && s.role) || null,
      pos: point(p),
      dest: point(d),
      destM: dist == null ? null : rounded(dist, 1),
      moving: !!(s && s.moving),
      speed: rounded((s && s.moveSpeed) || 0, 2),
      phase: phase,
      engagement: engState(s),
      resolver: last,
      stop: (s && s._movementStopReason) || null,
      target: !!(s && s.target),
      suppressed: !!(s && (+s.suppressedUntil || 0) > (+sim.time || 0)),
      stalled: !!(tr && tr.stalled)
    };
  }
  function leaseInfo(q, kind, t) {
    try {
      var L = root.BattleLeases,
        l = L && L.get && L.get(q, kind);
      if (!l || !(L.holds ? L.holds(q, kind, t) : t < +l.until)) return null;
      return {
        owner: l.owner || null,
        reason: l.reason || null,
        since: rounded(l.since, 2),
        until: rounded(l.until, 2)
      };
    } catch (_) {
      return null;
    }
  }
  function squadFrame(sim, st, q, side) {
    if (!q) return null;
    var now = +sim.time || 0,
      key = squadKey(side, q.id),
      out = {
        side: side,
        squad: q.id,
        phase: q.commandPhase || 'none',
        state: q.state || null,
        brief: (q._macroMission && q._macroMission.status) || 'none',
        contact: !!q.inContact,
        hold: q._missionHold || null,
        regroup: leaseInfo(q, 'regroup', now),
        bound: leaseInfo(q, 'bound', now),
        alive: 0,
        advancing: 0,
        pinned: 0,
        stalled: 0,
        engagement: {},
        movementIntents: {},
        men: [],
        menOmitted: 0
      };
    units(sim).forEach(function (s) {
      if (
        !s ||
        s.dead ||
        String(s.faction) !== String(side) ||
        !s.squad ||
        String(s.squad.id) !== String(q.id)
      )
        return;
      out.alive++;
      var d = soldierDetail(sim, st, s);
      bump(out.engagement, d.engagement);
      bump(out.movementIntents, d.resolver.kind || 'none');
      if (ADVANCE[d.phase] && (d.moving || d.speed >= 0.35)) out.advancing++;
      if (d.engagement === 'pinned') out.pinned++;
      if (d.stalled) out.stalled++;
      var abnormal =
        d.stalled ||
        d.stop ||
        d.suppressed ||
        (!d.target && d.destM != null && d.destM > 8 && d.speed < 0.35 && ADVANCE[d.phase]) ||
        d.engagement === 'pinned' ||
        d.engagement === 'cower' ||
        d.engagement === 'flee' ||
        d.engagement === 'freeze' ||
        d.engagement === 'rage';
      if (abnormal) {
        if (out.men.length < 6) out.men.push(d);
        else out.menOmitted++;
      }
    });
    out.key = key;
    return out;
  }
  function allFocusFrame(sim, st) {
    var f = { t: rounded(sim.time, 2), squads: {} };
    ['us', 'ge'].forEach(function (side) {
      sideSquads(sim, side).forEach(function (q) {
        var x = squadFrame(sim, st, q, side);
        if (x) f.squads[x.key] = x;
      });
    });
    return f;
  }
  function onlySquadFrame(frame, key) {
    var q = frame && frame.squads && frame.squads[key];
    return q ? { t: frame.t, squad: q } : null;
  }
  function startFocus(st, t, side, squad, reason) {
    if (side == null || squad == null) return;
    var key = squadKey(side, squad),
      now = +t || 0,
      w = st.activeFocus.get(key);
    if (w) {
      w.through = Math.max(w.through, now + FOCUS_POST);
      if (reason && w.reasons.length < MAX_FOCUS_REASONS) w.reasons.push(reason);
      return;
    }
    if (st.focusWindows.length >= MAX_FOCUS_WINDOWS) {
      st.focusDropped++;
      return;
    }
    w = {
      id: st.nextFocusId++,
      side: side,
      squad: squad,
      start: rounded(Math.max(0, now - FOCUS_PRE), 2),
      triggerAt: rounded(now, 2),
      through: rounded(now + FOCUS_POST, 2),
      reasons: [],
      frames: []
    };
    if (reason) w.reasons.push(reason);
    st.focusBuffer.forEach(function (frame) {
      if (+frame.t >= now - FOCUS_PRE - 0.001) {
        var one = onlySquadFrame(frame, key);
        if (one) w.frames.push(one);
      }
    });
    st.focusWindows.push(w);
    st.activeFocus.set(key, w);
  }
  function observeEvent(sim, kind, data) {
    if (!sim || !kind) return null;
    var st = get(sim),
      src = data || {},
      t = src.t != null ? +src.t : +sim.time || 0,
      out = {};
    Object.keys(src).forEach(function (k) {
      if (k !== 't') out[k] = src[k];
    });
    var m = marker(st, t, kind, out),
      side = out.side != null ? out.side : out.faction,
      squad = out.squad != null ? out.squad : out.squadId;
    if (side != null && squad != null) {
      var reason = {};
      Object.keys(out).forEach(function (k) {
        reason[k] = out[k];
      });
      reason.kind = kind;
      reason.t = rounded(t, 2);
      startFocus(st, t, side, squad, reason);
    }
    return m;
  }
  function focusTick(sim, st) {
    var now = +sim.time || 0;
    if (now + 1e-9 < st.nextFocusSample) return;
    var frame = allFocusFrame(sim, st);
    st.focusBuffer.push(frame);
    while (st.focusBuffer.length && now - (+st.focusBuffer[0].t || 0) > FOCUS_PRE + 0.51)
      st.focusBuffer.shift();
    Array.from(st.activeFocus.entries()).forEach(function (pair) {
      var key = pair[0],
        w = pair[1],
        one = onlySquadFrame(frame, key);
      if (one) w.frames.push(one);
      if (now + 1e-9 >= w.through) {
        w.end = frame.t;
        st.activeFocus.delete(key);
      }
    });
    st.nextFocusSample = Math.floor(now / FOCUS_SECONDS + 1) * FOCUS_SECONDS;
  }
  function stallContext(sim, st, s) {
    var d = soldierDetail(sim, st, s),
      sq = s && s.squad;
    return {
      side: (s && s.faction) || null,
      squad: sq && sq.id,
      soldier: s && s.id,
      phase: d.phase,
      engagement: d.engagement,
      resolver: d.resolver,
      stop: d.stop,
      destM: d.destM,
      dest: d.dest,
      contact: !!(sq && sq.inContact),
      suppressed: d.suppressed
    };
  }
  function endStall(sim, st, s, id, prior, reason) {
    if (!prior || !prior.stalled) return;
    var data = s
      ? stallContext(sim, st, s)
      : { side: prior.side, squad: prior.squad, soldier: prior.soldier };
    data.duration = rounded((+sim.time || 0) - (+prior.stallAt || +prior.at || 0), 2);
    data.recovery = reason || 'state-change';
    marker(st, sim.time, 'stall-end', data);
    startFocus(st, sim.time, data.side, data.squad, {
      kind: 'stall-end',
      t: rounded(sim.time, 2),
      soldier: data.soldier,
      recovery: data.recovery,
      duration: data.duration
    });
  }
  function updateStalls(sim, st) {
    var now = +sim.time || 0,
      seen = new Set();
    units(sim).forEach(function (s) {
      if (!s || s.dead) return;
      var id = String(s.faction || '?') + ':' + String(s.id),
        phase = (s.squad && s.squad.commandPhase) || '',
        es = engState(s),
        prior = st.stall.get(id),
        qualifies = !!(s.root && s.destination && !s.target && ADVANCE[phase] && !COMBAT[es]);
      if (!qualifies) {
        endStall(
          sim,
          st,
          s,
          id,
          prior,
          s.target
            ? 'target-acquired'
            : COMBAT[es]
              ? 'combat-state'
              : !ADVANCE[phase]
                ? 'phase-change'
                : 'no-destination'
        );
        st.stall.delete(id);
        return;
      }
      var p = s.root.position,
        d = Math.hypot((+p.x || 0) - (+s.destination.x || 0), (+p.z || 0) - (+s.destination.z || 0));
      if (d < 8) {
        endStall(sim, st, s, id, prior, 'arrived');
        st.stall.delete(id);
        return;
      }
      seen.add(id);
      if (!prior) {
        st.stall.set(id, {
          x: +p.x || 0,
          z: +p.z || 0,
          at: now,
          stalled: false,
          side: s.faction,
          squad: s.squad && s.squad.id,
          soldier: s.id
        });
        return;
      }
      if (Math.hypot((+p.x || 0) - prior.x, (+p.z || 0) - prior.z) >= 1.5) {
        endStall(sim, st, s, id, prior, 'movement-resumed');
        prior.x = +p.x || 0;
        prior.z = +p.z || 0;
        prior.at = now;
        prior.stalled = false;
        prior.stallAt = null;
      } else {
        var was = prior.stalled;
        prior.stalled = now - prior.at >= 12 && (+s.moveSpeed || 0) < 0.35;
        if (prior.stalled && !was) {
          prior.stallAt = now;
          var data = stallContext(sim, st, s);
          marker(st, now, 'stall-start', data);
          startFocus(st, now, data.side, data.squad, {
            kind: 'stall-start',
            t: rounded(now, 2),
            soldier: data.soldier,
            stop: data.stop,
            resolver: data.resolver
          });
        }
      }
    });
    Array.from(st.stall.entries()).forEach(function (pair) {
      var id = pair[0],
        prior = pair[1];
      if (!seen.has(id)) {
        endStall(sim, st, null, id, prior, 'removed');
        st.stall.delete(id);
      }
    });
  }
  function scanLfp(sim, st) {
    var fp = sim && sim._squadForwardProgressSummary,
      alerts = (fp && fp.alerts) || [];
    alerts.forEach(function (a) {
      if (!a) return;
      var side = a.faction || null,
        squad = a.squad != null ? a.squad : a.squadId,
        at = a.at != null ? +a.at : +sim.time || 0,
        key = [side, squad, at, a.kind || 'low-forward-progress'].join('|');
      if (st.lfpSeen.has(key)) return;
      st.lfpSeen.add(key);
      var data = {
        side: side,
        squad: squad,
        window: a.window,
        startAt: a.startAt,
        endAt: a.endAt,
        travel: a.travel,
        net: a.net,
        efficiency: a.efficiency,
        goalKind: a.goalKind,
        routeChanges: a.routeChanges,
        spread: a.spread,
        contact: a.inContact
      };
      marker(st, at, 'low-forward-progress', data);
      startFocus(st, at, side, squad, {
        kind: 'low-forward-progress',
        t: rounded(at, 2),
        travel: a.travel,
        net: a.net,
        efficiency: a.efficiency,
        goalKind: a.goalKind
      });
    });
  }
  function scanLoopAlerts(sim, st) {
    var alerts = [];
    try {
      alerts =
        root.BattleAILoopWatch && root.BattleAILoopWatch.alerts
          ? root.BattleAILoopWatch.alerts(sim) || []
          : [];
    } catch (_) {}
    alerts.forEach(function (a) {
      if (!a) return;
      var at = a.at != null ? +a.at : +sim.time || 0,
        semanticKey = [
          a.kind || 'loop',
          a.faction || '?',
          a.squadId || '?',
          a.soldierId == null ? '' : a.soldierId
        ].join('|'),
        priorEpisodeAt = st.loopEpisodeAt.get(semanticKey),
        key = [semanticKey, rounded(at, 2)].join('|');
      /* Collapse same-actor/same-kind alerts inside one 15 s diagnostic episode, but key the
         observer occurrence by timestamp rather than Loop Watch's stable actor key. Otherwise a
         real recurrence after the episode window is suppressed forever by loopSeen. */
      if (priorEpisodeAt != null && at - priorEpisodeAt < LOOP_EPISODE_SECONDS) return;
      if (st.loopSeen.has(key)) return;
      st.loopSeen.add(key);
      st.loopEpisodeAt.set(semanticKey, at);
      observeEvent(sim, 'loop-alert', {
        t: at,
        diagnosticKind: a.kind || 'loop',
        severity: a.severity || null,
        side: a.faction || null,
        squad: a.squadId,
        soldier: a.soldierId,
        message: a.message || null,
        phases: a.phases || null,
        rules: a.rules || null,
        sources: a.sources || null,
        travel: a.travel,
        net: a.net,
        destinationChanges: a.destinationChanges,
        stanceChanges: a.stanceChanges,
        inContact: a.inContact
      });
    });
  }
  function scanMarkers(sim, st) {
    var now = +sim.time || 0;
    ['us', 'ge'].forEach(function (f) {
      var sideContact = false;
      sideSquads(sim, f).forEach(function (q) {
        if (!q) return;
        var key = squadKey(f, q.id),
          phase = q.commandPhase || 'none',
          prior = st.prevPhase.get(key);
        if (prior != null && prior !== phase) {
          marker(st, now, 'phase-change', { side: f, squad: q.id, from: prior, to: phase });
          if (phase === 'regroup') {
            marker(st, now, 'regroup-start', { side: f, squad: q.id, from: prior });
            startFocus(st, now, f, q.id, { kind: 'regroup-start', t: rounded(now, 2), from: prior });
          }
          if (prior === 'regroup') {
            marker(st, now, 'regroup-end', { side: f, squad: q.id, to: phase });
            startFocus(st, now, f, q.id, { kind: 'regroup-end', t: rounded(now, 2), to: phase });
          }
        }
        st.prevPhase.set(key, phase);
        var bs = briefSig(q),
          bp = st.prevBrief.get(key);
        if (bp != null && bp !== bs) {
          var m = q._macroMission || {};
          marker(st, now, 'brief-change', {
            side: f,
            squad: q.id,
            status: m.status || null,
            intent: m.intent || null,
            action: m.action || null,
            objective: m.objectiveId || null
          });
        }
        st.prevBrief.set(key, bs);
        var retreat = q.state === 'retreat' || phase === 'retreat',
          rp = st.prevRetreat.get(key);
        if (rp === false && retreat) marker(st, now, 'retreat', { side: f, squad: q.id });
        st.prevRetreat.set(key, retreat);
        var contact = !!q.inContact,
          cp = st.prevContact.get(key);
        if (cp != null && cp !== contact)
          marker(st, now, contact ? 'contact-start' : 'contact-end', { side: f, squad: q.id });
        st.prevContact.set(key, contact);
        if (contact) sideContact = true;
        var bound = leaseInfo(q, 'bound', now),
          bpv = st.prevBound.get(key);
        if (!bpv && bound)
          marker(st, now, 'bound-start', {
            side: f,
            squad: q.id,
            owner: bound.owner,
            reason: bound.reason,
            until: bound.until
          });
        if (bpv && !bound)
          marker(st, now, 'bound-end', {
            side: f,
            squad: q.id,
            duration: rounded(now - (+bpv.since || now), 2)
          });
        st.prevBound.set(key, bound);
      });
      if (sideContact && !st.firstContact[f]) {
        st.firstContact[f] = true;
        marker(st, now, 'first-contact', { side: f });
      }
      var alive = sim.factions && sim.factions[f] ? +sim.factions[f].alive || 0 : 0,
        pa = st.prevAlive[f];
      if (pa != null && pa > 0 && alive === 0) marker(st, now, 'wipeout', { side: f });
      st.prevAlive[f] = alive;
    });

    (sim._objectives || []).forEach(function (o) {
      var os = objectiveStatus(sim, o.id),
        owner = os.owner || 'neutral',
        prior = st.prevOwner.get(o.id);
      if (prior != null && prior !== owner) {
        if (owner === 'us' || owner === 'ge')
          marker(st, now, 'capture', { side: owner, objective: o.id, from: prior });
        else marker(st, now, 'neutralized', { objective: o.id, from: prior });
      }
      st.prevOwner.set(o.id, owner);
    });

    var ms = sim._macroMissionState;
    if (ms) {
      var count = +ms.wakeCount || 0;
      if (count > st.wakeCount && Array.isArray(ms.recentWakes)) {
        var n = Math.min(ms.recentWakes.length, count - st.wakeCount);
        ms.recentWakes.slice(-n).forEach(function (w) {
          if (w && w.reason === 'strategic-stall') {
            var wt = w.time != null ? w.time : now;
            marker(st, wt, 'strategic-stall-wake', {
              side: w.faction || null,
              squad: w.squad || null,
              objective: w.target || null
            });
            startFocus(st, wt, w.faction, w.squad, {
              kind: 'strategic-stall-wake',
              t: rounded(wt, 2),
              objective: w.target || null
            });
          }
        });
      }
      st.wakeCount = count;
      var r = ms.reconstitution;
      if (r && Array.isArray(r.ended) && r.ended.length > st.mergeEnded) {
        r.ended.slice(st.mergeEnded).forEach(function (g) {
          if (g && g.status === 'merged')
            marker(st, g.endedAt != null ? g.endedAt : now, 'merge', {
              side: g.faction || null,
              size: g.size || null,
              objective: g.objectiveId || null
            });
        });
        st.mergeEnded = r.ended.length;
      }
    }
    scanLfp(sim, st);
    scanLoopAlerts(sim, st);
  }
  function objectiveCounts(sim) {
    var held = { us: 0, ge: 0 },
      contested = 0;
    (sim._objectives || []).forEach(function (o) {
      var x = objectiveStatus(sim, o.id),
        owner = x.owner || 'neutral';
      if (owner === 'us' || owner === 'ge') held[owner]++;
      if ((+x.us || 0) > 0 && (+x.ge || 0) > 0) contested++;
    });
    return { held: held, contested: contested };
  }
  function sampleSide(sim, st, f) {
    var out = {
      alive: 0,
      kills: 0,
      held: 0,
      contested: 0,
      advancing: 0,
      contact: 0,
      pinned: 0,
      stalled: 0,
      phases: {},
      briefs: {},
      engagement: {},
      movementIntents: {}
    };
    var fac = (sim.factions && sim.factions[f]) || {};
    out.alive = +fac.alive || 0;
    out.kills = +fac.kills || 0;
    sideSquads(sim, f).forEach(function (q) {
      bump(out.phases, q.commandPhase || 'none');
      var m = q._macroMission;
      bump(out.briefs, (m && m.status) || 'none');
    });
    units(sim).forEach(function (s) {
      if (!s || s.dead || String(s.faction) !== f) return;
      var phase = (s.squad && s.squad.commandPhase) || '',
        es = engState(s),
        id = f + ':' + s.id,
        last = s._movementResolver && s._movementResolver.last;
      bump(out.engagement, es);
      bump(out.movementIntents, (last && last.kind) || 'none');
      if (ADVANCE[phase] && (s.moving || (+s.moveSpeed || 0) >= 0.35)) out.advancing++;
      if (s.squad && s.squad.inContact) out.contact++;
      if (es === 'pinned') out.pinned++;
      var tr = st.stall.get(id);
      if (tr && tr.stalled) out.stalled++;
    });
    return out;
  }
  function sample(sim, st) {
    var oc = objectiveCounts(sim),
      t = rounded(sim.time, 2),
      us = sampleSide(sim, st, 'us'),
      ge = sampleSide(sim, st, 'ge');
    us.held = oc.held.us;
    ge.held = oc.held.ge;
    us.contested = ge.contested = oc.contested;
    st.samples.push({ t: t, us: us, ge: ge });
  }
  function tick(sim) {
    if (!sim) return;
    var st = get(sim),
      now = +sim.time || 0;
    updateStalls(sim, st);
    scanMarkers(sim, st);
    focusTick(sim, st);
    if (now + 1e-9 >= st.nextSample) {
      sample(sim, st);
      st.nextSample = Math.floor(now / SAMPLE_SECONDS + 1) * SAMPLE_SECONDS;
    }
  }
  function focusSnapshot(st) {
    return {
      format: 'grasstex-battle-observer-v1',
      sampleSeconds: FOCUS_SECONDS,
      preSeconds: FOCUS_PRE,
      postSeconds: FOCUS_POST,
      dropped: st.focusDropped,
      windows: st.focusWindows.map(function (w) {
        return {
          id: w.id,
          side: w.side,
          squad: w.squad,
          start: w.start,
          triggerAt: w.triggerAt,
          through: w.through,
          end: w.end || null,
          reasons: w.reasons.slice(),
          frames: w.frames.slice()
        };
      })
    };
  }
  function snapshot(sim) {
    var st = get(sim),
      last = st.samples[st.samples.length - 1];
    if (!last || Math.abs((+last.t || 0) - (+sim.time || 0)) > 0.51) sample(sim, st);
    return {
      format: 'grasstex-ai-timeline-v1',
      sampleSeconds: SAMPLE_SECONDS,
      build: root.BATTLE_BUILD || root.BATTLE_BUILD_DEPLOYED || 'dev',
      ref: root.BATTLE_REF || null,
      seed: battleSeed(sim),
      battleTime: rounded(sim && sim.time, 2),
      winner: (sim && sim.winner) || null,
      samples: st.samples.slice(),
      markers: st.markers.slice(),
      observer: focusSnapshot(st)
    };
  }
  root.BattleAITimeline = {
    version: '1.2-observer',
    sampleSeconds: SAMPLE_SECONDS,
    snapshot: snapshot,
    observeEvent: observeEvent,
    reset: reset
  };
  root.BattleModules.registerSystem('ai-timeline-recorder', {
    version: '1.2-observer',
    onBattleStart: reset,
    onBattleRestart: reset,
    onSimulationStep: tick
  });
  root.GTLog('[DIAG] AI timeline + battle observer active: 1 s backbone, 0.5 s focused context');
})(typeof window !== 'undefined' ? window : globalThis);
