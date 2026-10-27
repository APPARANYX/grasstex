/* #680: read-only timing of first-person contact, actual fire and actual cover travel.
   Reference: docs/reference/WWII_SMALL_UNIT_CONTACT_EVIDENCE.md.
   No extra authority, target writer, movement writer, or invented historical percentages. */
(function (root) {
  'use strict';
  var ON =
      !!root.BATTLE_PREVIEW &&
      /[?&]firstContactProbe=1(?:&|#|$)/.test((root.location && root.location.search) || ''),
    WINDOW = 12,
    ARRIVAL_WINDOW = 60,
    sessions = new WeakMap();
  if (!root.BattleModules) return;
  function pt(p) {
    return p && Number.isFinite(+p.x) && Number.isFinite(+p.z) ? { x: +p.x, z: +p.z } : null;
  }
  function dist(a, b) {
    return a && b ? Math.hypot(a.x - b.x, a.z - b.z) : Infinity;
  }
  function session(b) {
    var s = sessions.get(b);
    if (!s) sessions.set(b, (s = { time: null, records: new Map(), ticks: 0 }));
    return s;
  }
  function stamp(t) {
    return +t.toFixed(3);
  }
  function mark(r, key, t) {
    if (r.handoffs[key] == null) r.handoffs[key] = stamp(t);
  }
  function blocker(r, t, source, why) {
    if (!why) return;
    var key = source + ':' + why;
    if (key === r._lastBlocker) return;
    r._lastBlocker = key;
    if (r.blockers.length < 24) r.blockers.push({ at: stamp(t), source: source, reason: why });
  }
  function distribution(values) {
    var a = values.filter(Number.isFinite).sort(function (x, y) {
      return x - y;
    });
    return a.length
      ? {
          n: a.length,
          median: stamp(a[Math.floor((a.length - 1) / 2)]),
          p90: stamp(a[Math.ceil((a.length - 1) * 0.9)])
        }
      : { n: 0, median: null, p90: null };
  }
  function cue(s, b) {
    var E = root.BattleEngagement,
      A = root.SquadAI,
      incoming = !!(E && E.underFireNow && E.underFireNow(s, b)),
      target =
        s.target && (!A || !A.threatDisposition || A.threatDisposition(s.target).combatThreat)
          ? s.target
          : null,
      report = A && A.soldierContact && A.soldierContact(s, b);
    if (incoming) return { kind: 'incoming-fire', target: target, report: report };
    if (target) return { kind: 'visual-threat', target: target, report: report };
    if (
      report &&
      Number.isFinite(+report.at) &&
      b.time - report.at <= 2.5 &&
      Number.isFinite(+report.x) &&
      Number.isFinite(+report.z)
    )
      return {
        kind: report.source === 'heard' ? 'sound-only' : 'reported-sector',
        target: null,
        report: report
      };
    return null;
  }
  function observe(b) {
    if (!ON) return;
    var state = session(b),
      t = +b.time || 0;
    if (state.time != null && t < state.time - 0.01) {
      sessions.delete(b);
      state = session(b);
    }
    state.time = t;
    state.ticks++;
    var units = root.BattleModules.unitsFor(b) || [],
      TC = root.BattleTacticalController,
      actions = (TC && TC.summary && TC.summary(b).live) || [];
    function ownedBound(man) {
      var matching = actions.filter(function (a) {
        return (
          a.capability === 'combat.bound' &&
          String(a.actorId) === String(man.id) &&
          String(a.squad) === String(man.squad.id)
        );
      });
      /* TC.summary().live has no faction. Never ascribe a colliding enemy ID. */
      var actors = units.filter(function (u) {
        return u && u.squad && String(u.id) === String(man.id) && String(u.squad.id) === String(man.squad.id);
      });
      return actors.length === 1 && matching.length === 1 ? matching[0] : null;
    }
    for (var i = 0; i < units.length; i++) {
      var s = units[i];
      if (!s || s.isPlayer || !s.root || !s.squad) continue;
      var k = s.faction + ':' + s.id,
        r = state.records.get(k),
        p = pt(s.root.position),
        e = s.eng || {},
        goal = s._movementResolver && s._movementResolver.goal,
        kind = goal && goal.kind;
      if (!r && !s.dead) {
        var evidence = cue(s, b);
        if (evidence) {
          r = {
            id: String(s.id),
            faction: s.faction,
            role: s.role || null,
            cue: evidence.kind,
            at: +t.toFixed(3),
            contactSource: (evidence.report && evidence.report.source) || null,
            reportAge:
              evidence.report && Number.isFinite(+evidence.report.at)
                ? +(t - evidence.report.at).toFixed(3)
                : null,
            reportedDistance:
              evidence.report && p && pt(evidence.report) ? +dist(p, pt(evidence.report)).toFixed(2) : null,
            initialState: e.state || null,
            initialExposure:
              root.BattleObstacleField && root.BattleObstacleField.coverPotentialAt && p
                ? root.BattleObstacleField.coverPotentialAt(b.obstacles, p.x, p.z)
                : null,
            distance:
              evidence.target && p
                ? +dist(p, pt(evidence.target.root && evidence.target.root.position)).toFixed(2)
                : null,
            firstLow: null,
            firstHold: null,
            firstShot: null,
            movingAtShot: null,
            firstMotion: null,
            firstCoverOrder: null,
            firstCoverMotion: null,
            coverArrival: null,
            coverCause: null,
            coverArrivalEvidence: null,
            coverOrigin: null,
            handoffs: {
              request: null,
              accepted: null,
              adopted: null,
              selected: null,
              physicalStart: null,
              arrived: null
            },
            blockers: [],
            _lastBlocker: null,
            firstCoverSearch: null,
            firstOwnerAction: null,
            initialLow: !!(s.prone || s.tacticalCrouch || s.crouching),
            initialMoving: !!s.moving,
            initialOrder: kind || null,
            cuePosition: p,
            coverPoint: null
          };
          state.records.set(k, r);
        }
      }
      if (!r || t - r.at > ARRIVAL_WINDOW) continue;
      var early = t - r.at <= WINDOW,
        bound = ownedBound(s),
        resolver = s._movementResolver || {},
        combat = resolver.combat,
        last = resolver.last,
        progress = s._movementProgress,
        result =
          root.BattleExecutionOutcome && root.BattleExecutionOutcome.man
            ? root.BattleExecutionOutcome.man(s, b)
            : null;
      if (
        r.firstCoverSearch == null &&
        Number.isFinite(+e._urgentCoverSearchAt) &&
        +e._urgentCoverSearchAt > t
      )
        r.firstCoverSearch = stamp(t);
      if (early && r.firstLow == null && !r.initialLow && (s.prone || s.tacticalCrouch || s.crouching))
        r.firstLow = +t.toFixed(3);
      if (
        early &&
        r.firstHold == null &&
        (e.state === 'orient' || kind === 'hold' || kind === 'contact-reaction')
      )
        r.firstHold = +t.toFixed(3);
      var A = root.BattleAmmunition,
        shot = A && A.shotEvidence && A.shotEvidence(s, b);
      if (early && r.firstShot == null && shot && Number.isFinite(+shot.at) && +shot.at >= r.at - 0.001) {
        r.firstShot = +(+shot.at).toFixed(3);
        r.movingAtShot = !!s.moving;
      }
      if (early && r.firstMotion == null && s.moving && dist(r.cuePosition, p) > 0.35)
        r.firstMotion = +t.toFixed(3);
      if (
        early &&
        r.firstCoverOrder == null &&
        (bound || e._urgentCover || (kind === 'cover-bound' && e.state === 'bound'))
      ) {
        r.firstCoverOrder = stamp(t);
        r.coverCause = e._urgentCoverCause || (bound ? 'controller-bound' : 'authorized-bound');
        r.coverPoint = pt(e.cover) || pt(goal && goal.point) || pt(s.destination);
        r.coverOrigin = p;
        mark(r, 'request', t);
      }
      if (r.firstCoverOrder == null) {
        if (early && r.cue === 'reported-sector' && !s.target)
          blocker(r, t, 'policy', 'sector-alone-is-not-personal-cover-authority');
        continue;
      }
      if (bound) {
        r.firstOwnerAction = r.firstOwnerAction || bound.actionId;
        if (r.firstOwnerAction === bound.actionId) {
          if (bound.stage !== 'cancelled') mark(r, 'accepted', t);
          if (['adopted', 'executing', 'arrived'].indexOf(bound.stage) >= 0) mark(r, 'adopted', t);
          if (bound.stage === 'cancelled' || bound.stage === 'published')
            blocker(r, t, 'controller', bound.stage + ':' + bound.reason);
          if (bound.stage === 'arrived' && r.coverArrival == null) {
            r.coverArrival = stamp(t);
            r.coverArrivalEvidence = 'engagement:bound-checkin';
            mark(r, 'arrived', t);
          }
        }
      } else if (e._urgentCover) {
        if (combat && combat.kind === 'cover-bound' && combat.owner === 'engagement') {
          mark(r, 'accepted', t);
          mark(r, 'adopted', t); // survival authority is local, not a received Meso envelope
        } else blocker(r, t, 'resolver', 'urgent-proposal-not-current');
      }
      if (last && last.kind === 'cover-bound' && last.owner === 'engagement') mark(r, 'selected', t);
      else if (r.handoffs.accepted != null && r.handoffs.selected == null)
        blocker(r, t, 'resolver', last ? 'outranked:' + last.kind : 'no-selected-goal');
      if (
        r.firstCoverMotion == null &&
        r.handoffs.selected != null &&
        s.moving &&
        dist(r.coverOrigin, p) > 0.35
      ) {
        r.firstCoverMotion = stamp(t);
        mark(r, 'physicalStart', t);
      }
      if (progress && progress.stuck)
        blocker(r, t, 'navigation', progress.terminal ? 'terminal-no-progress' : 'no-progress');
      if (result && result.state === 'held') blocker(r, t, 'command', 'held:' + result.by);
      else if (result && result.state === 'pending') blocker(r, t, 'command', 'pending:' + result.why);
      if (s._movementStopReason && r.firstCoverMotion == null)
        blocker(r, t, 'execution', s._movementStopReason);
      if (
        r.coverArrival == null &&
        r.firstCoverMotion != null &&
        r.coverPoint &&
        p &&
        dist(p, r.coverPoint) <= 1.3 &&
        !s.moving
      ) {
        r.coverArrival = stamp(t);
        r.coverArrivalEvidence = 'physical-proximity';
        mark(r, 'arrived', t);
      }
      if (
        r.coverArrival == null &&
        Number.isFinite(+e._urgentCoverArrivedAt) &&
        e._urgentCoverArrivedAt >= r.firstCoverOrder
      ) {
        r.coverArrival = stamp(+e._urgentCoverArrivedAt);
        r.coverArrivalEvidence = 'engagement:urgent-arrival';
        mark(r, 'arrived', +e._urgentCoverArrivedAt);
      }
      if (r.coverArrival == null && !bound && !e._urgentCover && r.handoffs.accepted != null)
        blocker(r, t, 'engagement', 'order-ended:' + (e.state || 'unknown'));
    }
  }
  function summary(b) {
    if (!ON) return { enabled: false };
    var data = Array.from(session(b).records.values()),
      types = {},
      response = {
        seen: data.length,
        low: 0,
        hold: 0,
        shots: 0,
        movingShots: 0,
        physicalMoves: 0,
        protectiveOrders: 0,
        protectiveMoves: 0,
        protectiveArrivals: 0,
        incomingCoverOrders: 0,
        acceptedCoverOrders: 0,
        adoptedCoverOrders: 0,
        selectedCoverOrders: 0,
        notSelected: 0,
        lateArrivals: 0
      };
    for (var i = 0; i < data.length; i++) {
      var r = data[i];
      types[r.cue] = (types[r.cue] || 0) + 1;
      if (r.firstLow != null) response.low++;
      if (r.firstHold != null) response.hold++;
      if (r.firstShot != null) response.shots++;
      if (r.movingAtShot) response.movingShots++;
      if (r.firstMotion != null) response.physicalMoves++;
      if (r.firstCoverOrder != null) response.protectiveOrders++;
      if (r.firstCoverMotion != null) response.protectiveMoves++;
      if (r.coverArrival != null) response.protectiveArrivals++;
      if (r.coverCause === 'incoming-fire') response.incomingCoverOrders++;
      if (r.handoffs.accepted != null) response.acceptedCoverOrders++;
      if (r.handoffs.adopted != null) response.adoptedCoverOrders++;
      if (r.handoffs.selected != null) response.selectedCoverOrders++;
      if (r.handoffs.accepted != null && r.handoffs.selected == null) response.notSelected++;
      if (r.coverArrival != null && r.coverArrival - r.at > WINDOW) response.lateArrivals++;
    }
    var blockers = {},
      timings = {};
    data.forEach(function (r) {
      r.blockers.forEach(function (v) {
        var key = v.source + ':' + v.reason;
        blockers[key] = (blockers[key] || 0) + 1;
      });
    });
    [
      ['cueToRequest', null, 'request'],
      ['requestToAccepted', 'request', 'accepted'],
      ['acceptedToAdopted', 'accepted', 'adopted'],
      ['adoptedToResolver', 'adopted', 'selected'],
      ['resolverToMotion', 'selected', 'physicalStart'],
      ['motionToArrival', 'physicalStart', 'arrived'],
      ['cueToArrival', null, 'arrived']
    ].forEach(function (row) {
      timings[row[0]] = distribution(
        data.map(function (r) {
          var from = row[1] ? r.handoffs[row[1]] : r.at,
            to = r.handoffs[row[2]];
          return from == null || to == null ? NaN : to - from;
        })
      );
    });
    return {
      enabled: true,
      windowSeconds: WINDOW,
      arrivalWindowSeconds: ARRIVAL_WINDOW,
      blockerCounts: blockers,
      timings: timings,
      cueTypes: types,
      response: response,
      soldiers: data.map(function (r) {
        var out = Object.assign({}, r);
        delete out.cuePosition;
        delete out.coverPoint;
        delete out.coverOrigin;
        delete out._lastBlocker;
        return out;
      })
    };
  }
  root.BattleFirstContactObserver = { enabled: ON, summary: summary };
  root.BattleModules.registerSystem('first-contact-observer', {
    version: '1-read-only',
    onBattleStart: function (b) {
      sessions.delete(b);
    },
    onBattleRestart: function (b) {
      sessions.delete(b);
    },
    onSimulationStep: observe
  });
})(typeof window !== 'undefined' ? window : globalThis);
