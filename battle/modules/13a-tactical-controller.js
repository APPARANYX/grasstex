/* Tactical controller (#602 runtime foundation). One controller owns each squad's ordinary tactical
   policy: legacy (default) or a registered replacement provider. Shadow has no effect authority.
   The six policy entry points ask `dispatch`/`controls`; legacy mode answers false and the existing
   code runs unchanged. A replacement only takes over after it supplies every policy, every
   execution adapter named by the capability contract and every lifecycle adapter; otherwise the
   switch is rejected with a specific reason and the current controller keeps the squad. A switch,
   a mission or roster change, an emergency interrupt and a battle restart cancel the old actions
   and release their resources exactly once; cleanup an owner has not confirmed is retried on the
   next dispatch and blocks the next switch. No provider is registered at runtime and the contract
   module is not loaded by the battle page, so live activation stays rejected until the owner
   services are extracted. State lives in WeakMaps: no field is added to soldiers or squads. This
   module draws no RNG, starts no timer and writes no movement. */
(function (root) {
  'use strict';
  var POINTS = [
      'squadCommand',
      'commanderTick',
      'fireAndMovement',
      'executeMission',
      'engagement',
      'stationSelection'
    ],
    LIFECYCLE = ['cancel', 'release', 'stage'],
    MODES = ['legacy', 'shadow', 'new'],
    providers = Object.create(null),
    battles = new WeakMap(),
    nextBattle = 1;

  function contract() {
    return root.BattleTacticalCapabilityContract || null;
  }
  function battleState(sim) {
    var b = battles.get(sim);
    if (!b) {
      b = {
        id: 'battle-' + nextBattle++,
        generation: 0,
        squads: new WeakMap(),
        stats: {
          switches: 0,
          dispatches: {},
          rejected: {},
          staleRequests: 0,
          unconfirmed: 0,
          restartDropped: 0,
          interruptsUnconfirmed: 0,
          releaseRefused: 0,
          faults: 0,
          faultExamples: []
        }
      };
      battles.set(sim, b);
    }
    return b;
  }
  function record(sim, sq, create) {
    var b = sim && battles.get(sim),
      rec = b && sq ? b.squads.get(sq) : null;
    if (!rec && create && sim && sq) {
      b = battleState(sim);
      rec = {
        mode: 'legacy',
        provider: null,
        epoch: 0,
        nextAction: 1,
        actions: [],
        pending: [],
        rosterKey: null,
        rosterRevision: 0,
        handledRosterRevision: 0,
        refused: null,
        rosterAt: null,
        missionVersion: null,
        cancelling: false,
        accepting: 0
      };
      b.squads.set(sq, rec);
    }
    return rec || null;
  }
  function note(sim, reason) {
    var s = battleState(sim).stats;
    s.rejected[reason] = (s.rejected[reason] || 0) + 1;
    return { ok: false, reason: reason };
  }
  function members(sq) {
    return (sq && sq.members) || [];
  }
  function missionVersion(sq) {
    var m = sq && sq._macroMission;
    return m && Number.isSafeInteger(m.version) && m.version >= 0 ? m.version : 0;
  }
  /* The roster revision is derived from who is alive and attached; detachment and death change it.
     Dispatch reads it once per sim time (Engagement dispatches per man); a request recomputes it. */
  function rosterRevision(sq, rec, at) {
    if (at != null && rec.rosterAt === at) return rec.rosterRevision;
    rec.rosterAt = at == null ? null : at;
    var ids = [],
      a = members(sq);
    for (var i = 0; i < a.length; i++) if (a[i] && !a[i].dead) ids.push(String(a[i].id));
    var key = ids.join(',');
    if (rec.rosterKey !== key) {
      if (rec.rosterKey !== null) rec.rosterRevision++;
      rec.rosterKey = key;
    }
    return rec.rosterRevision;
  }
  function token(sim, sq, rec, at) {
    var b = battleState(sim);
    return {
      battleId: b.id,
      generation: b.generation,
      faction: sq.faction,
      squadId: String(sq.id),
      missionVersion: missionVersion(sq),
      rosterRevision: rosterRevision(sq, rec, at),
      controllerEpoch: rec.epoch,
      mode: rec.mode
    };
  }
  /* Only this squad's own men are actors. A foreign actor id is absent here and fails `invalid-actor`. */
  function liveContext(sim, sq, rec) {
    var ctx = token(sim, sq, rec),
      a = members(sq);
    ctx.now = +sim.time || 0;
    ctx.actors = [];
    for (var i = 0; i < a.length; i++)
      if (a[i])
        ctx.actors.push({
          id: String(a[i].id),
          dead: !!a[i].dead,
          player: !!a[i].isPlayer,
          transportLocked: !!(sq._transport && sq._transport.phase === 'embarked')
        });
    return ctx;
  }

  function registerProvider(spec) {
    if (!spec || typeof spec.id !== 'string' || !/^[a-z0-9][a-z0-9._-]*$/i.test(spec.id))
      return { ok: false, reason: 'invalid-provider' };
    if (providers[spec.id]) return { ok: false, reason: 'duplicate-provider' };
    providers[spec.id] = {
      id: spec.id,
      policies: Object.assign({}, spec.policies),
      adapters: Object.assign({}, spec.adapters),
      lifecycle: Object.assign({}, spec.lifecycle)
    };
    return { ok: true, reason: 'registered' };
  }
  function unregisterProvider(id) {
    return delete providers[id];
  }
  /* The first missing piece, as a specific reason, or null when the provider can own a squad. */
  function incomplete(p) {
    var C = contract();
    if (!C) return 'contract-unavailable';
    if (!p) return 'unknown-provider';
    var i,
      caps = Object.keys(C.capabilities);
    for (i = 0; i < POINTS.length; i++)
      if (typeof p.policies[POINTS[i]] !== 'function') return 'missing-policy:' + POINTS[i];
    for (i = 0; i < caps.length; i++)
      if (typeof p.adapters[caps[i]] !== 'function') return 'missing-adapter:' + caps[i];
    for (i = 0; i < LIFECYCLE.length; i++)
      if (typeof p.lifecycle[LIFECYCLE[i]] !== 'function') return 'missing-lifecycle:' + LIFECYCLE[i];
    return null;
  }

  function call(sim, fn, a, b) {
    try {
      return fn(a, b) === true;
    } catch (e) {
      var st = battleState(sim).stats;
      st.faults++;
      if (st.faultExamples.length < 5)
        st.faultExamples.push({
          at: +(sim && sim.time) || 0,
          message: String((e && e.message) || e).slice(0, 240),
          stack: String((e && e.stack) || '').slice(0, 900)
        });
      return false;
    }
  }
  /* Resources are released once: a second interrupt, a retry or a reentrant cancel finds `released`. */
  function releaseOnce(sim, action, reason) {
    if (action.released) return true;
    if (!call(sim, action.provider.lifecycle.release, action.request, reason)) return false;
    action.released = true;
    return true;
  }
  /* Lifecycle callbacks go to the provider that issued the action, whoever owns the squad now. */
  function settle(sim, action, reason) {
    if (!action.cancelled)
      action.cancelled = call(sim, action.provider.lifecycle.cancel, action.request, reason);
    return action.cancelled && releaseOnce(sim, action, reason);
  }
  /* Handoff matrix. Legacy tactical-policy work a replacement must not inherit is ended through its
     owners: recon, the engagement plan, a regroup (its owner restores the interrupted phase, counts
     the exit and grants the re-entry cooldown), the bound/route leases, bound orders, suppressor jobs
     and automatic stations. retreat-anchor, rally-recovery and succession are retained lifecycle
     obligations and stay. Existing owner APIs only. */
  var POLICY_LEASES = ['bound', 'bound-cycle', 'regroup-bypass', 'route-transition', 'corner-hold'];
  function releaseLegacy(sim, sq, reason) {
    var L = root.BattleLeases,
      E = root.BattleEngagement,
      P = root.BattleTacticalPositions,
      Q = root.BattleSquadStability,
      t = +sim.time || 0,
      a = members(sq);
    if (Q) {
      if (Q.endRecon) Q.endRecon(sq, sim, reason);
      if (Q.closePlan) Q.closePlan(sim, sq, reason);
      if (Q.endRegroup) Q.endRegroup(sim, sq, reason);
      /* Fire-control, posture and local task are tactical decisions, not retained survival services. */
      if (Q.clearFireControl) Q.clearFireControl(sq, sim, reason);
      if (Q.tacticalPostures && Q.tacticalPostures.end) Q.tacticalPostures.end(sim, sq, reason);
      if (Q.localPlan && Q.localPlan.reset) Q.localPlan.reset(sq);
    }
    if (L) for (var k = 0; k < POLICY_LEASES.length; k++) L.end(sq, POLICY_LEASES[k], t, reason);
    if (E) {
      E.clearBoundOrders(sq);
      if (E.assignSuppressors) E.assignSuppressors(sq, sim, a, null);
    }
    if (P) for (var i = 0; i < a.length; i++) if (a[i] && P.current(a[i])) P.release(a[i], sim, reason);
    return holdouts(sq);
  }
  /* Legacy authority still held after release, read without changing anything, each with the
     object that holds it. An owner refusing release must not silently pass authority to a second
     controller. */
  function holdouts(sq) {
    var L = root.BattleLeases,
      P = root.BattleTacticalPositions,
      a = members(sq),
      out = [],
      held;
    if (L && L.get) {
      var leases = POLICY_LEASES.concat(['regroup', 'recon', 'tactical-plan']);
      for (var j = 0; j < leases.length; j++)
        if ((held = L.get(sq, leases[j]))) out.push({ key: 'lease:' + leases[j], ref: held });
    }
    if (P)
      for (var n = 0; n < a.length; n++)
        if (a[n] && (held = P.current(a[n]))) out.push({ key: 'station:' + a[n].id, ref: held });
    if (sq.fireControl) out.push({ key: 'fireControl', ref: sq.fireControl });
    if (sq._localTask) out.push({ key: 'localTask', ref: sq._localTask });
    return out;
  }
  /* After a refused release a repeated request skips cleanup while the very objects that refused
     are still held, so retries never keep disrupting a squad legacy still commands. A mission or
     roster change since the refusal, or a holdout replaced by a new one, earns one more release. */
  function stillRefused(sq, rec) {
    var r = rec.refused;
    if (!r) return false;
    if (r.missionVersion === missionVersion(sq) && r.rosterRevision === rosterRevision(sq, rec)) {
      var now = holdouts(sq);
      for (var i = 0; i < r.items.length; i++)
        for (var k = 0; k < now.length; k++) if (now[k].ref === r.items[i].ref) return true;
    }
    rec.refused = null;
    return false;
  }
  /* Cancel every live action of the current provider. Reentrant calls (an adapter that cancels,
     interrupts or restarts again) return without touching the list a second time. */
  function cancelAll(sim, sq, rec, reason, filter) {
    if (rec.cancelling) return { ok: false, reason: 'cancelling', unconfirmed: rec.pending.length };
    rec.cancelling = true;
    try {
      var list = rec.actions.concat(rec.pending);
      rec.actions = [];
      rec.pending = [];
      for (var i = 0; i < list.length; i++) {
        var action = list[i];
        if (filter && !filter(action)) {
          (action.cancelReason ? rec.pending : rec.actions).push(action);
          continue;
        }
        action.cancelReason = action.cancelReason || reason;
        if (!settle(sim, action, action.cancelReason)) {
          rec.pending.push(action);
          battleState(sim).stats.unconfirmed++;
        }
      }
    } finally {
      rec.cancelling = false;
    }
    return {
      ok: rec.pending.length === 0,
      reason: rec.pending.length ? 'cleanup-pending' : 'cancelled',
      unconfirmed: rec.pending.length
    };
  }
  function retryCleanup(sim, rec) {
    if (!rec.pending.length || rec.cancelling) return;
    rec.cancelling = true;
    try {
      var list = rec.pending;
      rec.pending = [];
      for (var i = 0; i < list.length; i++)
        if (!settle(sim, list[i], list[i].cancelReason)) rec.pending.push(list[i]);
    } finally {
      rec.cancelling = false;
    }
  }

  function requestMode(sim, sq, mode, providerId) {
    if (!sim || !sq || !sq.faction || sq.id == null) return { ok: false, reason: 'invalid-squad' };
    if (MODES.indexOf(mode) < 0) return note(sim, 'unknown-mode');
    var rec = record(sim, sq, true);
    if (rec.cancelling) return note(sim, 'cancelling');
    /* An owner adapter cannot switch controllers while it is accepting this squad's action. */
    if (rec.accepting) return note(sim, 'accepting');
    var p = mode === 'new' ? providers[providerId] : null;
    if (mode === 'new') {
      var missing = incomplete(p);
      if (missing) return note(sim, missing);
    }
    if (rec.mode === mode && rec.provider === p) return { ok: true, reason: 'unchanged', epoch: rec.epoch };
    /* Cancellation runs before the switch. Unconfirmed cleanup keeps the current controller. */
    if (rec.mode === 'new') {
      var done = cancelAll(sim, sq, rec, 'controller-switched');
      if (!done.ok) return note(sim, done.reason);
    } else if (mode === 'new') {
      if (stillRefused(sq, rec)) return note(sim, 'cleanup-pending');
      var left = releaseLegacy(sim, sq, 'controller-switched');
      if (left.length) {
        rec.refused = {
          items: left,
          missionVersion: missionVersion(sq),
          rosterRevision: rosterRevision(sq, rec)
        };
        battleState(sim).stats.releaseRefused++;
        return note(sim, 'cleanup-pending');
      }
    }
    rec.mode = mode;
    rec.provider = p;
    rec.epoch++;
    rec.missionVersion = missionVersion(sq);
    rec.handledRosterRevision = rosterRevision(sq, rec);
    battleState(sim).stats.switches++;
    return { ok: true, reason: 'switched', epoch: rec.epoch };
  }
  function mode(sim, sq) {
    var rec = record(sim, sq, false);
    return rec ? rec.mode : 'legacy';
  }
  /* True only when a replacement owns this squad's ordinary tactical policy. */
  function controls(sim, sq) {
    var rec = record(sim, sq, false);
    return !!(rec && rec.mode === 'new');
  }

  function issue(sim, sq, rec, snapshot, point, capability, actorId, params) {
    var C = contract();
    if (rec.cancelling) return note(sim, 'cancelling');
    var req = Object.assign({}, snapshot, {
      actionId: point + '-' + rec.nextAction,
      actorId: actorId == null ? null : String(actorId),
      capability: capability,
      params: params || {}
    });
    var valid = C.validateRequest(req, liveContext(sim, sq, rec));
    if (!valid.ok) {
      if (/^stale-|^wrong-/.test(valid.reason)) battleState(sim).stats.staleRequests++;
      return note(sim, valid.reason);
    }
    /* An action whose cancellation is unconfirmed still holds its resources at the owner. */
    var held = rec.actions.concat(rec.pending);
    for (var i = 0; i < held.length; i++) {
      var clash = C.resourceConflicts(valid.request, held[i].request);
      if (!clash.ok) return note(sim, clash.reason);
    }
    rec.nextAction++;
    /* Registered under its issuing provider before the owner sees it, so a synchronous completion or
       cancellation inside the adapter finds it; a rejection removes it again (nothing to release). */
    var action = {
      request: valid.request,
      provider: rec.provider,
      cancelled: false,
      released: false,
      cancelReason: null
    };
    rec.actions.push(action);
    rec.accepting++;
    var accepted;
    try {
      accepted = call(sim, action.provider.adapters[capability], valid.request, sim);
    } finally {
      rec.accepting--;
    }
    if (!accepted) {
      var at = rec.actions.indexOf(action);
      if (at >= 0) rec.actions.splice(at, 1);
      return note(sim, 'owner-rejected');
    }
    return { ok: true, reason: 'owner-accepted', actionId: valid.request.actionId };
  }
  /* Completion is honoured only from a context of the controller epoch and battle generation that
     issued the action; an older policy context cannot finish a newer controller's work. */
  function finish(sim, sq, rec, snapshot, actionId, reason) {
    var b = battleState(sim);
    if (
      b.squads.get(sq) !== rec ||
      rec.mode !== 'new' ||
      b.generation !== snapshot.generation ||
      rec.epoch !== snapshot.controllerEpoch ||
      missionVersion(sq) !== snapshot.missionVersion ||
      rosterRevision(sq, rec) !== snapshot.rosterRevision
    ) {
      b.stats.staleRequests++;
      return false;
    }
    for (var i = 0; i < rec.actions.length; i++) {
      var action = rec.actions[i];
      if (action.request.actionId !== actionId || action.request.controllerEpoch !== snapshot.controllerEpoch)
        continue;
      rec.actions.splice(i, 1);
      action.cancelled = true;
      if (!releaseOnce(sim, action, reason || 'completed')) {
        action.cancelReason = reason || 'completed';
        rec.pending.push(action);
      }
      return true;
    }
    return false;
  }
  /* A firing station is a claim on a building window owned by module 20; a death or detachment
     elsewhere in the squad is no reason to drop a living man's claim and make him re-route. The
     station action survives a roster change while its man is alive and attached (?stationKeep=0
     cancels it with the rest, as before) and is re-stamped with the new roster revision so the
     contract's same-squad token comparison still holds for later requests. */
  var STATION_KEEP = !(typeof location !== 'undefined' && /[?&]stationKeep=0\b/.test(location.search || ''));
  function keepStationAcrossRoster(sq, revision) {
    if (!STATION_KEEP) return null;
    var a = members(sq);
    return function (action) {
      var id = action.request.actorId;
      if (action.request.capability !== 'station.claim' || action.cancelReason) return true;
      for (var i = 0; i < a.length; i++)
        if (a[i] && !a[i].dead && String(a[i].id) === id) {
          action.request = Object.freeze(Object.assign({}, action.request, { rosterRevision: revision }));
          return false;
        }
      return true;
    };
  }
  /* Run the provider's policy for this entry point. Returns false (legacy runs) unless a
     replacement owns the squad. A provider fault never reactivates legacy for the same tick. */
  function dispatch(sim, sq, point, facts) {
    var rec = record(sim, sq, false);
    if (!rec || rec.mode !== 'new') return false;
    if (POINTS.indexOf(point) < 0) throw new Error('Unknown tactical entry point: ' + point);
    var at = +sim.time || 0,
      stats = battleState(sim).stats;
    stats.dispatches[point] = (stats.dispatches[point] || 0) + 1;
    retryCleanup(sim, rec);
    var mission = missionVersion(sq),
      before = rec.handledRosterRevision;
    if (rec.missionVersion !== mission) {
      cancelAll(sim, sq, rec, 'mission-superseded');
      rec.missionVersion = mission;
    }
    var observedRoster = rosterRevision(sq, rec, at);
    if (observedRoster !== before)
      cancelAll(sim, sq, rec, 'roster-changed', keepStationAcrossRoster(sq, observedRoster));
    rec.handledRosterRevision = observedRoster;
    var snapshot = token(sim, sq, rec, at),
      ctx = {
        point: point,
        sim: sim,
        squad: sq,
        facts: facts || null,
        token: Object.freeze(Object.assign({}, snapshot)),
        request: function (capability, actorId, params) {
          return issue(sim, sq, rec, snapshot, point, capability, actorId, params);
        },
        finish: function (actionId, reason) {
          return finish(sim, sq, rec, snapshot, actionId, reason);
        },
        /* The owner-reported stage of one of this squad's live actions (the same read as summary().live). */
        stage: function (actionId) {
          return liveStage(rec, actionId);
        }
      };
    call(sim, rec.provider.policies[point], ctx);
    return true;
  }
  /* Emergency survival (module 44) interrupts one man's actions with a reason. Releasing is once only. */
  function interrupt(sim, sq, actorId, reason) {
    var rec = record(sim, sq, false);
    if (!rec || rec.mode !== 'new') return { ok: true, reason: 'not-controlled', unconfirmed: 0 };
    var id = actorId == null ? null : String(actorId),
      out = cancelAll(sim, sq, rec, reason || 'interrupted', function (action) {
        return id === null || action.request.actorId === id;
      });
    /* Emergency survival still proceeds; the unconfirmed resources stay pending and are counted. */
    if (!out.ok) battleState(sim).stats.interruptsUnconfirmed++;
    return out;
  }
  /* The restart barrier. battle-sim.js calls this before any beforeBattleRestart hook clears legacy
     squad state, so providers cancel against the squads and owners they acted on. Cleanup still
     unconfirmed here cannot be retried (the squads are disposed): it is counted in
     `stats.restartDropped` and logged as an accepted loss. */
  function beforeRestart(sim) {
    var b = sim && battles.get(sim);
    if (!b) return { cancelled: 0, unconfirmed: 0 };
    var out = { cancelled: 0, unconfirmed: 0 };
    ['us', 'ge'].forEach(function (f) {
      var a = (sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
      for (var i = 0; i < a.length; i++) {
        var rec = b.squads.get(a[i]);
        if (!rec || rec.mode !== 'new') continue;
        var n = rec.actions.length + rec.pending.length,
          done = cancelAll(sim, a[i], rec, 'battle-restart');
        out.cancelled += n - done.unconfirmed;
        out.unconfirmed += done.unconfirmed;
      }
    });
    if (out.unconfirmed) {
      b.stats.restartDropped += out.unconfirmed;
      if (root.GTLog)
        root.GTLog('[TACTICAL] restart dropped ' + out.unconfirmed + ' unconfirmed controller cleanup(s)');
    }
    b.generation++;
    b.squads = new WeakMap();
    return out;
  }
  function stageOf(action) {
    try {
      return action.provider.lifecycle.stage(action.request);
    } catch (e) {
      return { stage: 'unknown', reason: 'stage-fault' };
    }
  }
  function liveStage(rec, actionId) {
    for (var i = 0; i < rec.actions.length; i++)
      if (rec.actions[i].request.actionId === actionId) return stageOf(rec.actions[i]) || null;
    return null;
  }
  /* Every live or cleanup-pending action with the stage its owner reports, so a stall names the action,
     the stage it stopped at and why. A report that throws reads as `unknown: stage-fault`, never hides
     the action; reading the summary changes nothing. */
  function liveActions(sq, rec, out) {
    var list = rec.actions.concat(rec.pending);
    for (var i = 0; i < list.length; i++) {
      var action = list[i],
        req = action.request,
        st = stageOf(action);
      (out.live = out.live || []).push({
        squad: sq.id,
        actionId: req.actionId,
        capability: req.capability,
        actorId: req.actorId,
        provider: action.provider.id,
        cleanupPending: rec.pending.indexOf(action) >= 0,
        stage: (st && st.stage) || 'unknown',
        reason: (st && st.reason) || null,
        since: st && Number.isFinite(st.at) ? st.at : null
      });
    }
  }
  function summary(sim) {
    var b = sim && battles.get(sim),
      out = { legacy: 0, shadow: 0, new: 0, actions: 0, pending: 0 };
    ['us', 'ge'].forEach(function (f) {
      var a = (sim && sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
      for (var i = 0; i < a.length; i++) {
        var rec = b && b.squads.get(a[i]);
        out[rec ? rec.mode : 'legacy']++;
        if (rec) {
          out.actions += rec.actions.length;
          out.pending += rec.pending.length;
          liveActions(a[i], rec, out);
          if (rec.refused)
            (out.refused = out.refused || []).push({
              squad: a[i].id,
              holdouts: rec.refused.items.map(function (h) {
                return h.key;
              })
            });
        }
      }
    });
    if (b) {
      out.battleId = b.id;
      out.generation = b.generation;
      out.stats = JSON.parse(JSON.stringify(b.stats));
    }
    return out;
  }

  root.BattleTacticalController = {
    version: '1.0-guarded-dispatch',
    points: POINTS.slice(),
    lifecycle: LIFECYCLE.slice(),
    registerProvider: registerProvider,
    unregisterProvider: unregisterProvider,
    requestMode: requestMode,
    mode: mode,
    controls: controls,
    dispatch: dispatch,
    interrupt: interrupt,
    beforeRestart: beforeRestart,
    summary: summary
  };
})(typeof window !== 'undefined' ? window : globalThis);
