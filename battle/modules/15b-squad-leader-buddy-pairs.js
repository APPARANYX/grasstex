/* Squad Leader buddy-pairs sub-module (extracted from 16-squad-plan-stability.js).
   Behavior-neutral extraction: every function body moved verbatim from the parent file.
   The parent file calls the factory with its closure utilities and re-attaches the returned
   functions as closure variables, so all callers (fire-and-movement selector, diagnostics,
   probes, the public API export) see the same functions as before. parseBuddyPairs and the
   BUDDY_PAIRS_ON / BUDDY_TUNING declarations stay in 16 (parsed at load time from
   location.search) and are passed into the factory via ctx. */
(function (root) {
  'use strict';
  if (root._squadLeaderBuddyPairs) return;

  /* Factory: called by 16-squad-plan-stability.js after its shared utilities are defined.
     ctx provides the closure utilities the buddy-pairs functions need. */
  root._squadLeaderBuddyPairs = function (ctx) {
    var root = ctx.root,
      telemetry = ctx.telemetry,
      dist = ctx.dist,
      point = ctx.point,
      L = ctx.root.BattleLeases,
      teamKeyFor = ctx.teamKeyFor,
      BUDDY_PAIRS_ON = ctx.BUDDY_PAIRS_ON,
      BUDDY_TUNING = ctx.BUDDY_TUNING;

    function aliveTeam(sq, key) {
      return (sq.members || [])
        .filter(function (s) {
          return !s.dead && teamKeyFor(s) === key;
        })
        .sort(function (a, b) {
          return (+a.slotIndex || 0) - (+b.slotIndex || 0);
        });
    }

    function buddyStats(battle) {
      if (!BUDDY_PAIRS_ON || !battle) return null;
      return (
        battle._buddyPairStats ||
        (battle._buddyPairStats = {
          pairsFormed: 0,
          pairsRetired: 0,
          pairActivations: 0,
          cooperationActivations: 0,
          coverMoves: 0,
          breaks: 0,
          reforms: 0,
          separated: 0,
          blocked: 0,
          suppressed: 0,
          incompatible: 0,
          routeDiverged: 0,
          byBreakReason: {}
        })
      );
    }
    function buddyIncReason(stats, reason) {
      if (!stats) return;
      reason = String(reason || 'unknown');
      stats.byBreakReason[reason] = (stats.byBreakReason[reason] || 0) + 1;
    }
    function buddyHistory(sq, row) {
      var h = sq._buddyPairHistory || (sq._buddyPairHistory = []);
      h.push(row);
      if (h.length > 48) h.splice(0, h.length - 48);
    }
    function buddyBrokenState(state) {
      return (
        state === 'separated' ||
        state === 'blocked' ||
        state === 'suppressed' ||
        state === 'incompatible' ||
        state === 'route-diverged'
      );
    }
    function buddyTransition(sq, pair, battle, state, reason) {
      var t = battle.time,
        previous = pair.state || 'ready',
        stats = buddyStats(battle);
      if (previous === state && pair.reason === reason) return;
      if (buddyBrokenState(state) && !buddyBrokenState(previous)) {
        stats.breaks++;
        if (state === 'separated') stats.separated++;
        else if (state === 'blocked') stats.blocked++;
        else if (state === 'suppressed') stats.suppressed++;
        else if (state === 'route-diverged') stats.routeDiverged++;
        else stats.incompatible++;
        buddyIncReason(stats, reason);
        pair.lastBreakReason = reason;
        pair.lastBreakAt = t;
      } else if (!buddyBrokenState(state) && buddyBrokenState(previous)) {
        stats.reforms++;
        pair.lastReformReason = reason || 'conditions-cleared';
        pair.lastReformAt = t;
      }
      buddyHistory(sq, {
        at: +t.toFixed(2),
        pair: pair.id,
        team: pair.team,
        a: pair.aId,
        b: pair.bId,
        from: previous,
        to: state,
        reason: reason || null
      });
      if (buddyBrokenState(state)) {
        pair.movingId = null;
        pair.coveringId = null;
        pair.recoverSince = null;
      }
      pair.state = state;
      pair.reason = reason || null;
      pair.since = t;
      pair.lastChangeAt = t;
    }
    function buddyMember(sq, id) {
      var m = (sq && sq.members) || [];
      for (var i = 0; i < m.length; i++) if (m[i] && String(m[i].id) === String(id)) return m[i];
      return null;
    }
    function buddyTaskKey(sq, key, a, b) {
      return [
        key,
        (a && a._engagementTask) || '',
        (b && b._engagementTask) || '',
        (a && a._engagementPlanSerial) || 0,
        (b && b._engagementPlanSerial) || 0
      ].join('|');
    }
    function buddyPairId(key, a, b) {
      var ai = String(a.id),
        bi = String(b.id);
      return key + ':' + (ai < bi ? ai + '-' + bi : bi + '-' + ai);
    }
    function buddyRetireReason(sq, pair) {
      var a = buddyMember(sq, pair.aId),
        b = buddyMember(sq, pair.bId);
      if (!a || !b || a.dead || b.dead) return 'casualty';
      if (teamKeyFor(a) !== pair.team || teamKeyFor(b) !== pair.team) return 'fireteam-changed';
      return 'roster-changed';
    }
    function syncBuddyPairs(sq, battle) {
      if (!BUDDY_PAIRS_ON || !sq || !battle) return null;
      var old = sq._buddyPairs || {},
        next = {},
        unpaired = [],
        stats = buddyStats(battle);
      ['command', 'alpha', 'bravo', 'charlie'].forEach(function (key) {
        var men = aliveTeam(sq, key);
        for (var i = 0; i + 1 < men.length; i += 2) {
          var a = men[i],
            b = men[i + 1],
            id = buddyPairId(key, a, b),
            task = buddyTaskKey(sq, key, a, b),
            pair = old[id];
          if (!pair) {
            pair = {
              id: id,
              team: key,
              aId: a.id,
              bId: b.id,
              formedAt: battle.time,
              generation: 1,
              taskKey: task,
              state: 'ready',
              reason: 'formed',
              since: battle.time,
              lastChangeAt: battle.time,
              nextMoverId: a.id,
              movingId: null,
              coveringId: null,
              separation: 0,
              routeGap: 0,
              activations: 0,
              coverMoves: 0
            };
            stats.pairsFormed++;
            buddyHistory(sq, {
              at: +battle.time.toFixed(2),
              pair: id,
              team: key,
              a: a.id,
              b: b.id,
              from: null,
              to: 'ready',
              reason: 'formed'
            });
          } else if (pair.taskKey !== task) {
            /* A task/version update is context, not automatically a broken relationship. The old code
               broke and reformed the pair twice in the same tick for every plan refresh, producing
               tens of thousands of diagnostic transitions without a real incompatibility. Actual
               incompatible tasks are detected below (e.g. a tactical-position assignment). */
            pair.previousTaskKey = pair.taskKey;
            pair.taskKey = task;
            pair.generation = (+pair.generation || 1) + 1;
            pair.lastTaskChangeAt = battle.time;
            pair.movingId = null;
            pair.coveringId = null;
          }
          next[id] = pair;
        }
        if (men.length % 2) unpaired.push(men[men.length - 1].id);
      });
      Object.keys(old).forEach(function (id) {
        if (next[id]) return;
        var pair = old[id],
          why = buddyRetireReason(sq, pair);
        stats.pairsRetired++;
        stats.breaks++;
        buddyIncReason(stats, why);
        buddyHistory(sq, {
          at: +battle.time.toFixed(2),
          pair: pair.id,
          team: pair.team,
          a: pair.aId,
          b: pair.bId,
          from: pair.state || 'ready',
          to: 'retired',
          reason: why
        });
      });
      sq._buddyPairs = next;
      sq._buddyUnpaired = unpaired;
      return next;
    }
    function buddyIncompatible(s, battle) {
      if (!s || s.dead) return 'casualty';
      if ((+s.suppressedUntil || 0) > battle.time) return 'suppressed';
      var state = s.eng && s.eng.state;
      if (state === 'freeze' || state === 'flee' || state === 'rage' || state === 'cower')
        return 'engagement-' + state;
      if (root.BattleTacticalPositions && root.BattleTacticalPositions.current && root.BattleTacticalPositions.current(s))
        return 'positional-task';
      return null;
    }
    function buddyStillBroken(pair, separation, routeGap) {
      if (pair.state === 'separated' && separation != null && separation > BUDDY_TUNING.reformSeparation) return true;
      if (pair.state === 'route-diverged' && routeGap != null && routeGap > BUDDY_TUNING.reformRouteGap) return true;
      return false;
    }
    function buddyRecover(sq, pair, battle) {
      if (!buddyBrokenState(pair.state)) {
        pair.recoverSince = null;
        buddyTransition(sq, pair, battle, 'ready', 'conditions-clear');
        return;
      }
      if (pair.recoverSince == null) {
        pair.recoverSince = battle.time;
        return;
      }
      if (battle.time - pair.recoverSince < BUDDY_TUNING.reformDelay) return;
      pair.recoverSince = null;
      buddyTransition(sq, pair, battle, 'ready', 'conditions-stable');
    }
    function updateBuddyPairState(sq, pair, battle) {
      var a = buddyMember(sq, pair.aId),
        b = buddyMember(sq, pair.bId),
        ai = buddyIncompatible(a, battle),
        bi = buddyIncompatible(b, battle);
      if (ai === 'suppressed' || bi === 'suppressed') {
        buddyTransition(sq, pair, battle, 'suppressed', ai === 'suppressed' ? 'a-suppressed' : 'b-suppressed');
        return;
      }
      if (ai || bi) {
        buddyTransition(sq, pair, battle, 'incompatible', ai || bi);
        return;
      }
      var pa = a && a.root && a.root.position,
        pb = b && b.root && b.root.position;
      pair.separation = pa && pb ? +dist(pa, pb).toFixed(2) : null;
      if (pair.separation != null && pair.separation > BUDDY_TUNING.maxSeparation) {
        buddyTransition(sq, pair, battle, 'separated', 'physical-separation');
        return;
      }
      var da = point(a && a._fireteamDestination),
        db = point(b && b._fireteamDestination);
      pair.routeGap = da && db ? +dist(da, db).toFixed(2) : null;
      if (pair.routeGap != null && pair.routeGap > BUDDY_TUNING.maxRouteGap) {
        buddyTransition(sq, pair, battle, 'route-diverged', 'fireteam-routes-diverged');
        return;
      }
      if (buddyStillBroken(pair, pair.separation, pair.routeGap)) {
        pair.recoverSince = null;
        return;
      }
      var aw = String((a && a._movementStopReason) || ''),
        bw = String((b && b._movementStopReason) || '');
      if (aw === 'path-blocked' || aw === 'step-blocked' || bw === 'path-blocked' || bw === 'step-blocked') {
        buddyTransition(sq, pair, battle, 'blocked', aw || bw);
        return;
      }
      var bound = L.get(sq, 'bound');
      if (
        bound &&
        L.holds(sq, 'bound', battle.time) &&
        bound.data &&
        bound.data.team === pair.team &&
        pair.movingId != null &&
        pair.coveringId != null
      ) {
        buddyTransition(sq, pair, battle, 'cover-move', 'authorized-bound');
        return;
      }
      pair.movingId = null;
      pair.coveringId = null;
      buddyRecover(sq, pair, battle);
    }
    function updateBuddyPairs(sq, battle) {
      var pairs = syncBuddyPairs(sq, battle);
      if (!pairs) return null;
      Object.keys(pairs).sort().forEach(function (id) {
        updateBuddyPairState(sq, pairs[id], battle);
      });
      return pairs;
    }
    function buddyBoundPreview(sq, team, movers, fireSupport, battle) {
      if (!BUDDY_PAIRS_ON || !sq._buddyPairs || !movers.length)
        return { movers: movers, cooperation: [] };
      var selected = movers.slice(),
        cooperation = [];
      Object.keys(sq._buddyPairs)
        .sort()
        .forEach(function (id) {
          var pair = sq._buddyPairs[id];
          if (!pair || pair.team !== team || pair.state !== 'ready') return;
          var a = buddyMember(sq, pair.aId),
            b = buddyMember(sq, pair.bId);
          if (movers.indexOf(a) < 0 || movers.indexOf(b) < 0) return;
          var mover = String(pair.nextMoverId) === String(b.id) ? b : a,
            cover = mover === a ? b : a;
          if (fireSupport.indexOf(cover) < 0 && fireSupport.indexOf(mover) >= 0) {
            var swap = mover;
            mover = cover;
            cover = swap;
          }
          /* Cooperation is opportunistic. If the designated cover man is not already part of Engagement's
             base of fire, leave the original fireteam bound untouched instead of parking both men. */
          if (fireSupport.indexOf(cover) < 0) return;
          selected = selected.filter(function (s) {
            return s !== cover;
          });
          cooperation.push({ pair: pair, mover: mover, cover: cover });
        });
      return { movers: selected, cooperation: cooperation };
    }
    function commitBuddyCooperation(sq, preview, battle) {
      if (!BUDDY_PAIRS_ON || !preview || !preview.cooperation.length) return;
      var stats = buddyStats(battle);
      preview.cooperation.forEach(function (c) {
        var pair = c.pair;
        pair.movingId = c.mover.id;
        pair.coveringId = c.cover.id;
        pair.nextMoverId = c.cover.id;
        pair.activations = (+pair.activations || 0) + 1;
        pair.coverMoves = (+pair.coverMoves || 0) + 1;
        stats.pairActivations++;
        stats.cooperationActivations++;
        stats.coverMoves++;
        buddyTransition(sq, pair, battle, 'cover-move', 'authorized-bound');
        telemetry(battle, 'decision-buddy-cover-move', {
          faction: sq.faction,
          squad: sq.id,
          team: pair.team,
          pair: pair.id,
          mover: c.mover.id,
          cover: c.cover.id
        });
      });
    }
    function buddySnapshot(sq) {
      if (!BUDDY_PAIRS_ON || !sq || !sq._buddyPairs) return null;
      return {
        owner: 'squad-leader',
        readers: ['squad-leader/fire-and-movement', 'diagnostics', 'probes'],
        pairs: Object.keys(sq._buddyPairs)
          .sort()
          .map(function (id) {
            var p = sq._buddyPairs[id];
            return {
              id: p.id,
              team: p.team,
              a: p.aId,
              b: p.bId,
              generation: p.generation,
              taskKey: p.taskKey,
              previousTaskKey: p.previousTaskKey || null,
              lastTaskChangeAt: p.lastTaskChangeAt == null ? null : p.lastTaskChangeAt,
              state: p.state,
              reason: p.reason,
              formedAt: p.formedAt,
              since: p.since,
              lastChangeAt: p.lastChangeAt,
              lastBreakReason: p.lastBreakReason || null,
              lastBreakAt: p.lastBreakAt == null ? null : p.lastBreakAt,
              lastReformReason: p.lastReformReason || null,
              lastReformAt: p.lastReformAt == null ? null : p.lastReformAt,
              recoverSince: p.recoverSince == null ? null : p.recoverSince,
              separation: p.separation,
              routeGap: p.routeGap,
              moving: p.movingId,
              covering: p.coveringId,
              nextMover: p.nextMoverId,
              activations: p.activations || 0,
              coverMoves: p.coverMoves || 0
            };
          }),
        unpaired: (sq._buddyUnpaired || []).slice(),
        history: (sq._buddyPairHistory || []).slice(-24)
      };
    }
    function buddyTelemetry(sim) {
      if (!BUDDY_PAIRS_ON || !sim) return null;
      var stats = Object.assign({}, buddyStats(sim)),
        live = 0,
        byState = {};
      ['us', 'ge'].forEach(function (f) {
        var squads = (sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
        squads.forEach(function (sq) {
          Object.keys(sq._buddyPairs || {}).forEach(function (id) {
            var p = sq._buddyPairs[id];
            live++;
            byState[p.state || 'unknown'] = (byState[p.state || 'unknown'] || 0) + 1;
          });
        });
      });
      stats.livePairs = live;
      stats.byState = byState;
      stats.byBreakReason = Object.assign({}, stats.byBreakReason || {});
      return stats;
    }

    return {
      aliveTeam: aliveTeam,
      buddyStats: buddyStats,
      buddyIncReason: buddyIncReason,
      buddyHistory: buddyHistory,
      buddyBrokenState: buddyBrokenState,
      buddyTransition: buddyTransition,
      buddyMember: buddyMember,
      buddyTaskKey: buddyTaskKey,
      buddyPairId: buddyPairId,
      buddyRetireReason: buddyRetireReason,
      syncBuddyPairs: syncBuddyPairs,
      buddyIncompatible: buddyIncompatible,
      buddyStillBroken: buddyStillBroken,
      buddyRecover: buddyRecover,
      updateBuddyPairState: updateBuddyPairState,
      updateBuddyPairs: updateBuddyPairs,
      buddyBoundPreview: buddyBoundPreview,
      commitBuddyCooperation: commitBuddyCooperation,
      buddySnapshot: buddySnapshot,
      buddyTelemetry: buddyTelemetry,
      BUDDY_PAIRS_ON: BUDDY_PAIRS_ON,
      BUDDY_TUNING: BUDDY_TUNING
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
