/* #680: read-only timing of first-person contact, actual fire and actual cover travel.
   Reference: docs/reference/WWII_SMALL_UNIT_CONTACT_EVIDENCE.md.
   No extra authority, target writer, movement writer, or invented historical percentages. */
(function (root) {
  'use strict';
  var ON = !!root.BATTLE_PREVIEW &&
    /[?&]firstContactProbe=1(?:&|#|$)/.test((root.location && root.location.search) || ''),
    WINDOW = 12,
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
  function cue(s, b) {
    var E = root.BattleEngagement, A = root.SquadAI,
      incoming = !!(E && E.underFireNow && E.underFireNow(s, b)),
      target = s.target && (!A || !A.threatDisposition || A.threatDisposition(s.target).combatThreat)
        ? s.target : null,
      report = A && A.soldierContact && A.soldierContact(s, b);
    if (incoming) return { kind: 'incoming-fire', target: target, report: report };
    if (target) return { kind: 'visual-threat', target: target, report: report };
    if (report && Number.isFinite(+report.at) && b.time - report.at <= 2.5 &&
        report.source !== 'heard' && Number.isFinite(+report.x) && Number.isFinite(+report.z))
      return { kind: 'reported-sector', target: null, report: report };
    return null;
  }
  function observe(b) {
    if (!ON) return;
    var state = session(b), t = +b.time || 0;
    if (state.time != null && t < state.time - 0.01) {
      sessions.delete(b);
      state = session(b);
    }
    state.time = t;
    state.ticks++;
    var units = root.BattleModules.unitsFor(b) || [];
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
            id: String(s.id), faction: s.faction, role: s.role || null,
            cue: evidence.kind, at: +t.toFixed(3),
            contactSource: evidence.report && evidence.report.source || null,
            reportAge: evidence.report && Number.isFinite(+evidence.report.at)
              ? +(t - evidence.report.at).toFixed(3) : null,
            distance: evidence.target && p
              ? +dist(p, pt(evidence.target.root && evidence.target.root.position)).toFixed(2) : null,
            firstLow: null, firstHold: null, firstShot: null,
            movingAtShot: null, firstMotion: null, firstCoverOrder: null,
            firstCoverMotion: null, coverArrival: null, coverCause: null,
            initialLow: !!(s.prone || s.tacticalCrouch || s.crouching),
            initialMoving: !!s.moving, initialOrder: kind || null,
            cuePosition: p, coverPoint: null
          };
          state.records.set(k, r);
        }
      }
      if (!r || t - r.at > WINDOW) continue;
      if (r.firstLow == null && !r.initialLow && (s.prone || s.tacticalCrouch || s.crouching))
        r.firstLow = +t.toFixed(3);
      if (r.firstHold == null && (e.state === 'orient' || kind === 'hold' || kind === 'contact-reaction'))
        r.firstHold = +t.toFixed(3);
      var A = root.BattleAmmunition,
        shot = A && A.shotEvidence && A.shotEvidence(s, b);
      if (r.firstShot == null && shot && Number.isFinite(+shot.at) && +shot.at >= r.at - 0.001) {
        r.firstShot = +(+shot.at).toFixed(3);
        r.movingAtShot = !!s.moving;
      }
      if (r.firstMotion == null && s.moving && dist(r.cuePosition, p) > 0.35)
        r.firstMotion = +t.toFixed(3);
      if (r.firstCoverOrder == null && (e._urgentCover || (kind === 'cover-bound' && e.state === 'bound'))) {
        r.firstCoverOrder = +t.toFixed(3);
        r.coverCause = e._urgentCoverCause || 'authorized-bound';
        r.coverPoint = pt(e.cover) || pt(goal && goal.point) || pt(s.destination);
      }
      if (r.firstCoverOrder != null && r.firstCoverMotion == null &&
          s.moving && (+s.moveSpeed || 0) > 0.2)
        r.firstCoverMotion = +t.toFixed(3);
      if (r.firstCoverOrder != null && r.coverArrival == null &&
          ((Number.isFinite(+e._urgentCoverArrivedAt) &&
            e._urgentCoverArrivedAt >= r.firstCoverOrder) ||
            (r.coverPoint && dist(p, r.coverPoint) <= 1.3 && !s.moving)))
        r.coverArrival = +t.toFixed(3);
    }
  }
  function summary(b) {
    if (!ON) return { enabled: false };
    var data = Array.from(session(b).records.values()), types = {},
      response = { seen: data.length, low: 0, hold: 0, shots: 0, movingShots: 0,
        physicalMoves: 0, protectiveOrders: 0, protectiveMoves: 0, protectiveArrivals: 0,
        incomingCoverOrders: 0 };
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
    }
    return { enabled: true, windowSeconds: WINDOW, cueTypes: types, response: response,
      soldiers: data.map(function (r) {
        var out = Object.assign({}, r);
        delete out.cuePosition;
        delete out.coverPoint;
        return out;
      }) };
  }
  root.BattleFirstContactObserver = { enabled: ON, summary: summary };
  root.BattleModules.registerSystem('first-contact-observer', {
    version: '1-read-only',
    onBattleStart: function (b) { sessions.delete(b); },
    onBattleRestart: function (b) { sessions.delete(b); },
    onSimulationStep: observe
  });
})(typeof window !== 'undefined' ? window : globalThis);
