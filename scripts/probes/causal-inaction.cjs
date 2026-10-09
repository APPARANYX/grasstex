/* Causal inaction observer: shipping battle only, no writes to gameplay state.
 * An actual onFire callback and trigger-path reject counter are direct evidence.
 * Fire-control "why" inferred from snapshots is NEVER marked verified.
 * Movement outcomes come from the existing read-only BattleExecutionOutcome join.
 * URL filters: probeSide, probeRole, probeIds, probeSquads. */
(function (root) {
  'use strict';
  var params = new URLSearchParams((root.location && root.location.search) || '');
  function csv(k) {
    return String(params.get(k) || '')
      .split(',')
      .map(function (x) {
        return x.trim();
      })
      .filter(Boolean);
  }
  var options = {
    side: params.get('probeSide') || 'all',
    roles: csv('probeRole'),
    ids: csv('probeIds'),
    squads: csv('probeSquads')
  };
  var MAX_EPISODES = 160,
    MAX_HISTORY = 10,
    MAX_DENIALS = 160,
    MAX_COVER = 320,
    FIRE_SILENCE = 5,
    MOVE_STILL = 12;
  var data, units, originalFire;
  function round(n) {
    return +Number(n || 0).toFixed(2);
  }
  function bump(o, k) {
    o[k] = (o[k] || 0) + 1;
  }
  function chosen(s) {
    return !!(
      s &&
      s.root &&
      s.squad &&
      (options.side === 'all' || options.side === s.faction) &&
      (!options.roles.length ||
        options.roles.indexOf('all') >= 0 ||
        options.roles.indexOf(String(s.role)) >= 0) &&
      (!options.ids.length || options.ids.indexOf(String(s.id)) >= 0) &&
      (!options.squads.length || options.squads.indexOf(String(s.squad.id)) >= 0)
    );
  }
  function key(s) {
    return String(s.faction) + ':' + String(s.id);
  }
  function unit(s) {
    var k = key(s),
      d = units.get(k);
    if (!d) {
      d = {
        lastShot: -Infinity,
        fire: null,
        move: null,
        history: [],
        denials: [],
        coverEvents: [],
        coverLane: null
      };
      units.set(k, d);
    }
    return d;
  }
  function position(v) {
    return v && isFinite(+v.x) && isFinite(+v.z) ? { x: round(v.x), z: round(v.z) } : null;
  }
  function range(a, b) {
    return a && b ? Math.hypot(+a.x - +b.x, +a.z - +b.z) : Infinity;
  }
  function motionOutcome(s, sim) {
    var O = root.BattleExecutionOutcome;
    return O && O.man ? O.man(s, sim) : null;
  }
  function sampleRow(s, o, sim) {
    var resolver = s._movementResolver && s._movementResolver.last;
    return {
      t: round(sim.time),
      pos: position(s.root.position),
      dest: position(s.destination),
      target: s.target && !s.target.dead ? String(s.target.id) : null,
      engagement: (s.eng && s.eng.state) || null,
      phase: s.squad.commandPhase || null,
      missionVersion: (s.squad._macroMission && s.squad._macroMission.version) || null,
      envelope: (o && o.envelopeId) || null,
      outcome: (o && o.state) || null,
      current: o ? !!o.current : null,
      resolver: resolver
        ? { owner: resolver.owner || null, kind: resolver.kind || null, reason: resolver.reason || null }
        : null,
      stop: s._movementStopReason || null,
      speed: round(s.moveSpeed),
      losRejects: +s._losBlockedFire || 0,
      crestRejects: +s._crestBlockedFire || 0,
      terrainRejects: +s._terrainBlockedSuppressiveFire || 0
    };
  }
  function emit(kind, s, since, now, result, evidence, history) {
    bump(data.counts, kind);
    bump(data.reasons, result.code);
    bump(data.confidence, result.confidence);
    if (data.episodes.length >= MAX_EPISODES) {
      data.episodesOmitted++;
      return;
    }
    data.episodes.push({
      kind: kind,
      actor: key(s),
      soldier: String(s.id),
      squad: String(s.squad.id),
      role: s.role,
      start: round(since),
      observedAt: round(now),
      seconds: round(now - since),
      code: result.code,
      confidence: result.confidence,
      scope: result.scope,
      interpretation: result.interpretation,
      evidence: evidence,
      history: history.slice(-MAX_HISTORY)
    });
  }
  function fireClassification(s, sim, f, d) {
    var rejects = {
      los: Math.max(0, (+s._losBlockedFire || 0) - f.los),
      crest: Math.max(0, (+s._crestBlockedFire || 0) - f.crest),
      terrain: Math.max(0, (+s._terrainBlockedSuppressiveFire || 0) - f.terrain)
    };
    var recs = sim._commandReception && sim._commandReception.adoptedBySoldier,
      rec = recs && recs[String(s.id)] && recs[String(s.id)]['posture-fire|squad'],
      order = (rec && rec.data && rec.data.state) || null,
      state = (s.eng && s.eng.state) || null;
    var denials = {};
    d.denials.forEach(function (e) {
      if (e.t >= f.since && e.t <= sim.time && e.target === f.target) bump(denials, e.code);
    });
    var evidence = {
      target: f.target,
      fireOrder: order,
      engagement: state,
      triggerRejectDeltas: rejects,
      directFireDenials: denials,
      roundsFired: 0,
      coverDecisions: d.coverEvents
        .filter(function (e) {
          return e.t >= f.since && e.t <= sim.time;
        })
        .slice(-5)
    };
    if (Object.keys(denials).length && (rejects.crest || rejects.los || rejects.terrain))
      return {
        evidence: evidence,
        result: {
          code: 'multiple-observed-fire-blockers',
          confidence: 'verified',
          scope: 'decision-and-shot-attempt',
          interpretation:
            'Both a real Engagement denial and a trigger-path rejection occurred; neither proves the entire silent interval.'
        }
      };
    if (Object.keys(denials).length)
      return {
        evidence: evidence,
        result: {
          code: 'engagement-decision-denied',
          confidence: 'verified',
          scope: 'decision-gate',
          interpretation:
            'The Engagement fire-permission gate actually refused firing for the recorded reasons.'
        }
      };
    if (rejects.crest || rejects.los || rejects.terrain)
      return {
        evidence: evidence,
        result: {
          code: 'observed-trigger-rejection',
          confidence: 'verified',
          scope: 'shot-attempt',
          interpretation:
            'A real trigger-path rejection occurred during silence; this does not prove it explains the entire interval.'
        }
      };
    if (
      order === 'hold' ||
      order === 'reposition' ||
      order === 'suppress' ||
      (order === 'precision' && !(rec && rec.data && String(rec.data.shooterId) === String(s.id)))
    )
      return {
        evidence: evidence,
        result: {
          code: 'restrictive-fire-order',
          confidence: 'likely',
          scope: 'state-correlation',
          interpretation: 'A restrictive order was observed, but no firing decision gate was directly traced.'
        }
      };
    if (state === 'cower' || state === 'freeze' || state === 'flee' || state === 'pinned')
      return {
        evidence: evidence,
        result: {
          code: 'stress-or-pinned',
          confidence: 'likely',
          scope: 'state-correlation',
          interpretation: 'A combat inhibition state was observed; the decisive firing gate was not recorded.'
        }
      };
    return {
      evidence: evidence,
      result: {
        code: 'unexplained-fire-silence',
        confidence: 'unknown',
        scope: 'not-traced',
        interpretation: 'Target was present and no round fired; current observations cannot prove why.'
      }
    };
  }
  function movementClassification(o) {
    if (o.current === false && o.envelopeId)
      return {
        code: 'stale-order-version',
        confidence: 'verified',
        scope: 'order-version',
        interpretation:
          'The adopted/received movement envelope is from a different mission version; investigate order publication and replacement.'
      };
    if (o.state === 'held')
      return {
        code: 'resolver-hold',
        confidence: 'verified',
        scope: 'arbitration',
        interpretation:
          'Movement Resolver chose a different authority. This may be a justified hold, not a defect.'
      };
    if (o.state === 'blocked')
      return {
        code: 'physical-execution-blocked',
        confidence: 'verified',
        scope: 'movement-execution',
        interpretation: 'Movement Execution recorded a blocked order; check its stop/recovery evidence.'
      };
    if (o.state === 'pending')
      return {
        code: o.why === 'undeliverable' ? 'order-undeliverable' : 'order-not-adopted',
        confidence: 'verified',
        scope: 'command-reception',
        interpretation:
          'The order is pending in Command Reception; this does not prove the delay is abnormal.'
      };
    if (o.state === 'adopted')
      return {
        code: 'adopted-not-applied',
        confidence: 'verified',
        scope: 'order-handoff',
        interpretation: 'The order was adopted but not yet applied to Movement Resolver.'
      };
    return {
      code: 'unexplained-movement-stall',
      confidence: 'unknown',
      scope: 'not-traced',
      interpretation:
        'The soldier failed to move toward the assigned goal; no authoritative blocker was identified.'
    };
  }
  function recordFire(s, sim, d) {
    var t = s.target && !s.target.dead && s.target.root ? String(s.target.id) : null;
    if (s.dead || !t) {
      d.fire = null;
      return;
    }
    if (!d.fire || d.fire.target !== t || d.lastShot >= d.fire.since) {
      d.fire = {
        since: sim.time,
        target: t,
        los: +s._losBlockedFire || 0,
        crest: +s._crestBlockedFire || 0,
        terrain: +s._terrainBlockedSuppressiveFire || 0,
        reported: false
      };
    }
    var f = d.fire;
    if (!f.reported && sim.time - f.since >= FIRE_SILENCE) {
      var c = fireClassification(s, sim, f, d);
      emit('fire-silence', s, f.since, sim.time, c.result, c.evidence, d.history);
      f.reported = true;
    }
  }
  function recordMovement(s, sim, d, o) {
    var here = position(s.root.position),
      dest = position(s.destination);
    if (
      s.dead ||
      !o ||
      o.state === 'none' ||
      !here ||
      !dest ||
      range(here, dest) < 8 ||
      o.state === 'completed'
    ) {
      d.move = null;
      return;
    }
    var signature =
      String(o.envelopeId || '') +
      '|' +
      String(o.missionVersion || '') +
      '|' +
      round(dest.x) +
      ',' +
      round(dest.z);
    var m = d.move;
    if (!m || m.signature !== signature || range(m.anchor, here) >= 1.5) {
      m = { since: sim.time, anchor: here, signature: signature, reported: false };
      d.move = m;
    }
    if (!m.reported && sim.time - m.since >= MOVE_STILL && (+s.moveSpeed || 0) < 0.35) {
      var result = movementClassification(o);
      emit(
        'movement-inaction',
        s,
        m.since,
        sim.time,
        result,
        {
          order: {
            envelopeId: o.envelopeId || null,
            missionVersion: o.missionVersion || null,
            current: !!o.current,
            state: o.state,
            why: o.why || null,
            heldBy: o.by || null,
            terminal: !!o.terminal,
            progressing: !!o.progressing
          },
          displacementMeters: round(range(m.anchor, here)),
          distanceToDestinationMeters: round(range(here, dest)),
          stopReason: s._movementStopReason || null,
          resolver: (d.history[d.history.length - 1] && d.history[d.history.length - 1].resolver) || null,
          coverDecisions: d.coverEvents
            .filter(function (e) {
              return e.t >= m.since && e.t <= sim.time;
            })
            .slice(-5)
        },
        d.history
      );
      m.reported = true;
    }
  }
  (root.BattleProbes = root.BattleProbes || {})['causal-inaction'] = {
    every: 1,
    start: function (sim) {
      data = {
        schema: 'grasstex-causal-inaction-v1',
        config: options,
        counts: {},
        reasons: {},
        confidence: {},
        episodes: [],
        episodesOmitted: 0,
        directDenialsOmitted: 0,
        coverDecisions: [],
        coverDecisionsOmitted: 0,
        coverDecisionCounts: {},
        coverRejectCounts: {},
        coverLaneOutcomes: [],
        roundsObserved: 0,
        actorsObserved: 0
      };
      units = new Map();
      /* Called only from the real Engagement rejection sites, never by sampling a gate. */
      root.BattleCausalInaction = {
        denied: function (s, battle, code) {
          if (!chosen(s) || !battle) return;
          var d = unit(s),
            now = +battle.time || 0;
          d.denials.push({
            t: now,
            code: code,
            target: s.target && !s.target.dead ? String(s.target.id) : null
          });
          while (d.denials.length && d.denials[0].t < now - 10) d.denials.shift();
          if (d.denials.length > MAX_DENIALS) {
            d.denials.shift();
            data.directDenialsOmitted++;
          }
        },
        /* Invoked at the actual slot-ranking branch. Counts are witnesses to
           gate execution, not retrospective guesses that a gate caused all
           inactivity. The collector owns only bounded diagnostic storage. */
        coverDecision: function (s, battle, stage, code, counts, goal) {
          if (!chosen(s) || !battle) return;
          var d = unit(s),
            now = round(battle.time),
            rejected = {},
            event = {
              t: now,
              actor: key(s),
              target: (s.target && String(s.target.id)) || null,
              stage: String(stage),
              code: String(code),
              rejected: rejected
            };
          Object.keys(counts || {}).forEach(function (name) {
            var n = +counts[name] || 0;
            if (n > 0) {
              rejected[name] = n;
              bump(data.coverRejectCounts, String(stage) + ':' + name, n);
            }
          });
          if (goal && isFinite(+goal.x) && isFinite(+goal.z)) event.goal = position(goal);
          bump(data.coverDecisionCounts, event.stage + ':' + event.code);
          d.coverEvents.push(event);
          if (d.coverEvents.length > 12) d.coverEvents.shift();
          if (data.coverDecisions.length < MAX_COVER) data.coverDecisions.push(event);
          else data.coverDecisionsOmitted++;
          if (event.stage === 'firing-lane' && event.code === 'selected' && event.goal) {
            d.coverLane = {
              actor: key(s),
              start: now,
              goal: event.goal,
              status: 'selected',
              arrivedAt: null,
              firedAt: null,
              startPosition: position(s.root.position),
              samples: [],
              lastPosition: position(s.root.position),
              statusReason: null
            };
            if (data.coverLaneOutcomes.length < MAX_COVER) data.coverLaneOutcomes.push(d.coverLane);
          }
        }
      };
      originalFire = sim.onFire;
      sim.onFire = function (s) {
        var result = originalFire && originalFire.apply(this, arguments);
        if (chosen(s)) {
          unit(s).lastShot = sim.time;
          data.roundsObserved++;
          var lane = unit(s).coverLane;
          if (lane && lane.firedAt == null && sim.time >= lane.start) lane.firedAt = round(sim.time);
        }
        return result;
      };
    },
    sample: function (sim) {
      var all = root.BattleModules.unitsFor(sim),
        selected = 0;
      for (var i = 0; i < all.length; i++) {
        var s = all[i];
        if (!chosen(s)) continue;
        var traceUnit = unit(s), trace = traceUnit.coverLane;
        if (trace && trace.samples.length < 90) {
          var resolver = s._movementResolver && s._movementResolver.last;
          var entry = {
            t: round(sim.time), pos: position(s.root.position),
            dest: position(s.destination),
            orderDestination: position(s.orderDestination),
            state: s.eng && s.eng.state || null,
            squadPhase: s.squad && s.squad.commandPhase || null,
            alive: !s.dead, hp: +s.hp || 0,
            currentCover: s.eng && s.eng.cover && { x: round(s.eng.cover.x), z: round(s.eng.cover.z), type:s.eng.cover.type } || null,
            stop: s._movementStopReason || null,
            resolver: resolver ? {owner: resolver.owner||null,kind:resolver.kind||null,reason:resolver.reason||null} : null
          };
          trace.samples.push(entry);
          trace.lastPosition = entry.pos;
          if (s.dead) trace.statusReason = 'actor-dead';
        }
        if (s.dead) continue;
        selected++;
        var d = unit(s),
          o = motionOutcome(s, sim);
        if (
          d.coverLane &&
          d.coverLane.arrivedAt == null &&
          d.coverLane.goal &&
          range(position(s.root.position), d.coverLane.goal) <= 0.6
        ) {
          d.coverLane.arrivedAt = round(sim.time);
          d.coverLane.status = 'physically-arrived';
        }
        d.history.push(sampleRow(s, o, sim));
        if (d.history.length > MAX_HISTORY) d.history.shift();
        recordFire(s, sim, d);
        recordMovement(s, sim, d, o);
      }
      data.actorsObserved = Math.max(data.actorsObserved, selected);
    },
    report: function (sim) {
      if (sim && sim.factions) data.finalSurvivors = {
        us: sim.factions.us && sim.factions.us.alive,
        ge: sim.factions.ge && sim.factions.ge.alive
      };
      return data;
    }
  };
})(window);
