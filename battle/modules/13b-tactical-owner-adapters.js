/* Owner adapters for the tactical controller (13a). One adapter per capability of the #656 contract:
   a thin bridge from an already validated request to the existing owner call, plus a read-only stage
   projection from that owner's own state and the owner's cancel and release. Adapters decide nothing:
   the provider chooses the man, the point, the station and the stance. They add no squad or soldier
   field, timer, lease or movement writer; per-action handles live in a WeakMap keyed by the frozen
   request the controller hands to both the adapter and the lifecycle callbacks.

   Movement (movement.move, movement.hold) is not bridged yet: its owner entry is private to module 16
   (Meso personal publication) and comes in its own change. Until then `missing` lists both, and a
   provider built on these adapters stays rejected by the controller (`missing-adapter:movement.move`). */
(function (root) {
  'use strict';
  var handles = new WeakMap();

  function now(sim) {
    return +(sim && sim.time) || 0;
  }
  function squadOf(sim, req) {
    var f = sim && sim.factions && sim.factions[req.faction],
      list = (f && f.squads) || [];
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === req.squadId) return list[i];
    return null;
  }
  function manOf(sq, req) {
    var a = (sq && sq.members) || [];
    for (var i = 0; i < a.length; i++) if (a[i] && String(a[i].id) === req.actorId) return a[i];
    return null;
  }
  function keep(req, sim, h) {
    h.sim = sim;
    h.capability = req.capability;
    h.stage = 'accepted';
    h.reason = 'owner-accepted';
    h.at = now(sim);
    handles.set(req, h);
    return true;
  }
  function mark(h, stage, reason) {
    if (h.stage === stage && h.reason === reason) return;
    h.stage = stage;
    h.reason = reason;
    h.at = now(h.sim);
  }
  function mission(sq, req) {
    var m = sq && sq._macroMission;
    return m && m.version === req.missionVersion ? m : null;
  }
  function ride(sq, req) {
    var t = sq && sq._transport;
    return t && t.missionVersion === req.missionVersion ? t : null;
  }

  function rideEnded(h) {
    var t = h.squad._transport;
    return t !== h.ride || ['boarding', 'embarked', 'disembarking'].indexOf(t.phase) < 0;
  }

  var CAPS = {
    /* Engagement is the one stance writer; its request only lowers, for the owner's own hold time. */
    'posture.lower': {
      request: function (req, sim) {
        var E = root.BattleEngagement,
          sq = squadOf(sim, req),
          s = manOf(sq, req),
          T = E && E.tuning;
        if (!s || !E || !E.requestStance || !T) return false;
        var hold = req.params.stance === 'crouch' ? T.STANCE_HOLD : T.PRONE_HOLD;
        if (!E.requestStance(s, sim, req.params.stance, hold)) return false;
        return keep(req, sim, { man: s, stance: req.params.stance });
      },
      stage: function (h) {
        var e = h.man.eng;
        if (h.man.dead) mark(h, 'cancelled', 'actor-dead');
        else if (e && e.stance === h.stance) mark(h, 'committed', 'committed');
      },
      cancel: function () {
        return true;
      },
      release: function () {
        return true;
      }
    },
    /* Module 20 owns reservation, ingress and release; the claim names the canonical station by id. */
    'station.claim': {
      request: function (req, sim) {
        var P = root.BattleTacticalPositions,
          sq = squadOf(sim, req),
          s = manOf(sq, req);
        if (!s || !P || !P.claim || !P.current || P.current(s)) return false;
        var task = P.claim(s, sim, { id: req.params.stationId }, req.params.threat);
        if (!task || P.current(s) !== task) return false;
        return keep(req, sim, { man: s, task: task });
      },
      stage: function (h) {
        var P = root.BattleTacticalPositions;
        if (!P || P.current(h.man) !== h.task)
          mark(h, 'cancelled', h.task.releaseReason ? 'owner:' + h.task.releaseReason : 'cancelled');
        else if (h.task.occupiedAt != null) mark(h, 'occupied', 'occupied');
        else mark(h, 'assigned', 'assigned');
      },
      cancel: function (h, reason) {
        var P = root.BattleTacticalPositions;
        if (P && P.current(h.man) === h.task) P.release(h.man, h.sim, 'controller:' + reason);
        return !P || P.current(h.man) !== h.task;
      },
      release: function (h) {
        var P = root.BattleTacticalPositions;
        return !P || P.current(h.man) !== h.task;
      }
    },
    /* The Commander owns mission status; acceptance is a transition it makes or refuses. */
    'mission.accept': {
      request: function (req, sim) {
        var C = root.BattleCommanderAI,
          sq = squadOf(sim, req),
          m = mission(sq, req);
        if (!m || !C || !C.acceptMission) return false;
        if (m.status !== 'executing') C.acceptMission(sim, sq);
        if (m.status !== 'executing') return false;
        return keep(req, sim, { squad: sq });
      },
      stage: function (h, req) {
        var m = mission(h.squad, req);
        if (!m) mark(h, 'cancelled', 'mission-superseded');
        else if (m.status === 'executing') mark(h, 'executing', 'executing');
      },
      cancel: function () {
        return true;
      },
      release: function () {
        return true;
      }
    },
    /* Module 58 owns the journey: quote, seats, boarding, travel and dismount. */
    'transport.consider': {
      request: function (req, sim) {
        var T = root.BattleSquadTransport,
          sq = squadOf(sim, req),
          m = mission(sq, req);
        if (!m || !T || !T.considerMission || !T.considerMission(sim, sq, m)) return false;
        /* A ride the owner started for another brief is not this action's: end it, never leave it untracked. */
        if (!ride(sq, req)) {
          if (T.finish) T.finish(sim, sq, 'controller:untracked');
          return false;
        }
        return keep(req, sim, { squad: sq, ride: sq._transport });
      },
      stage: function (h) {
        var t = h.squad._transport;
        if (t !== h.ride) mark(h, 'cancelled', 'owner:' + (h.ride.endReason || 'ended'));
        else if (t.phase === 'embarked') mark(h, 'embarked', 'embarked');
        else if (t.phase === 'boarding') mark(h, 'boarding', 'boarding');
        else mark(h, 'cancelled', 'owner:' + (t.endReason || t.phase));
      },
      cancel: function (h, reason) {
        var T = root.BattleSquadTransport,
          t = h.squad._transport;
        if (T && T.finish && t === h.ride) T.finish(h.sim, h.squad, 'controller:' + reason);
        return true;
      },
      /* Released once the owner no longer carries or seats the squad for this ride. */
      release: rideEnded
    },
    'transport.cancel': {
      request: function (req, sim) {
        var T = root.BattleSquadTransport,
          sq = squadOf(sim, req),
          t = ride(sq, req);
        if (!t || !T || !T.finish || (t.phase !== 'boarding' && t.phase !== 'embarked')) return false;
        T.finish(sim, sq, 'controller:cancel');
        return keep(req, sim, { squad: sq, ride: t });
      },
      stage: function (h) {
        if (rideEnded(h)) mark(h, 'released', 'released');
      },
      cancel: function () {
        return true;
      },
      /* A dismounting squad still holds its team, locomotion and weapons; release waits for the end. */
      release: rideEnded
    }
  };
  var MISSING = ['movement.move', 'movement.hold'];

  function request(req, sim) {
    var c = CAPS[req.capability];
    if (!c || handles.has(req)) return false;
    if (!c.request(req, sim)) return false;
    c.stage(handles.get(req), req);
    return true;
  }
  /* The owner's view of how far an action got: the contract stage, why it stands there and since when. */
  function stage(req) {
    var h = handles.get(req);
    if (!h) return null;
    if (h.stage !== 'cancelled' && h.stage !== 'released') CAPS[h.capability].stage(h, req);
    return { stage: h.stage, reason: h.reason, at: h.at };
  }
  function lifecycle(kind) {
    return function (req, reason) {
      var h = handles.get(req);
      if (!h) return true;
      var ok = CAPS[h.capability][kind](h, reason) === true;
      if (ok && kind === 'cancel' && h.stage !== 'released') mark(h, 'cancelled', reason);
      return ok;
    };
  }
  var adapters = {};
  Object.keys(CAPS).forEach(function (cap) {
    adapters[cap] = request;
  });

  root.BattleTacticalOwnerAdapters = {
    version: '1.0-owner-bridges',
    adapters: adapters,
    missing: MISSING.slice(),
    stage: stage,
    lifecycle: { cancel: lifecycle('cancel'), release: lifecycle('release'), stage: stage }
  };
})(typeof window !== 'undefined' ? window : globalThis);
