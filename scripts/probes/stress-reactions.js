/* Stress reactions on real battles (`?stressAct=cower,flee,freeze,rage`): what each one looks like once it runs.
   Observe only: reads Engagement's state and the man's position and writes nothing, draws no random number.

   Per reaction (cower, flee, freeze, rage), every episode of a man in that Engagement state:
     - how many, how many men, how long (mean, p50, p90), and how each ended: the reason Engagement recorded for the
       transition out (`eng.transition.reason`), a death, or the end of the battle;
     - re-entries: the same man in the same reaction again within 5 s of leaving it (a flicker, not a second break);
     - the band and stress he left it at, and whether his squad was in contact when it ended.
   flee: the distance to the trouble when it began and when it ended, whether he reached his refuge (`eng.refugeHere`)
   and after how long. rage: the distance to the nearest enemy when it began and the nearest he came, whether a blow
   was struck or landed (module 17's own counters), whether he fell during it, and the enemy killed in it.
   Sampled every step (0.15 s) so no episode is missed. */
(function (root) {
  'use strict';
  var KINDS = ['cower', 'flee', 'freeze', 'rage'],
    ACTING = { cower: 1, flee: 1, freeze: 1, rage: 1 },
    track,
    done,
    last,
    examples;
  function round(x, k) {
    var p = Math.pow(10, k == null ? 1 : k);
    return Math.round((+x || 0) * p) / p;
  }
  function quant(a, q) {
    if (!a.length) return null;
    var s = a.slice().sort(function (x, y) {
      return x - y;
    });
    return round(s[Math.min(s.length - 1, Math.floor(q * (s.length - 1) + 0.5))]);
  }
  function bump(o, k) {
    o[k] = (o[k] || 0) + 1;
  }
  function nearestEnemy(sim, s) {
    var best = Infinity,
      men = root.BattleModules.unitsFor(sim),
      p = s.root.position;
    for (var i = 0; i < men.length; i++) {
      var o = men[i];
      if (!o || o.dead || !o.root || o.faction === s.faction) continue;
      var d = Math.hypot(o.root.position.x - p.x, o.root.position.z - p.z);
      if (d < best) best = d;
    }
    return best;
  }
  function open(sim, s, kind, now) {
    var m = s.mind || {},
      e = s.eng,
      p = s.root.position;
    return {
      kind: kind,
      at: now,
      soldier: s.id,
      faction: s.faction,
      band: m.band,
      stress: m.stress,
      start: { x: p.x, z: p.z },
      enemyAtStart: nearestEnemy(sim, s),
      nearest: nearestEnemy(sim, s),
      strikes0: (m.acts && m.acts.rage && m.acts.rage.strikes) || 0,
      hits0: (m.acts && m.acts.rage && m.acts.rage.hits) || 0,
      refugeAt: null,
      reachedAt: null,
      squad: s.squad && s.squad.id,
      reason: e && e.transition ? e.transition.reason : null
    };
  }
  function close(sim, s, ep, now, how) {
    var m = s.mind || {},
      p = s.root.position,
      e = s.eng,
      secs = now - ep.at,
      row = done[ep.kind],
      reason = how || (e && e.transition && e.transition.at >= ep.at ? e.transition.reason : 'unknown');
    if (examples.length < 400)
      examples.push({
        soldier: ep.soldier,
        faction: ep.faction,
        squad: ep.squad,
        kind: ep.kind,
        from: round(ep.at),
        to: round(now),
        endedBy: reason,
        start: [round(ep.start.x), round(ep.start.z)],
        end: [round(p.x), round(p.z)],
        bandAtEnd: m.band
      });
    row.n++;
    row.men[ep.soldier + ':' + ep.faction] = true;
    row.secs.push(secs);
    bump(row.endedBy, reason);
    row.bandAtEnd[m.band == null ? '?' : m.band] = (row.bandAtEnd[m.band == null ? '?' : m.band] || 0) + 1;
    if (s.squad && s.squad.inContact) row.endedInContact++;
    var key = ep.soldier + ':' + ep.faction + ':' + ep.kind,
      prev = last[key];
    if (prev != null && ep.at - prev <= 5) row.reentries++;
    last[key] = now;
    if (ep.kind === 'flee') {
      row.moved.push(Math.hypot(p.x - ep.start.x, p.z - ep.start.z));
      if (ep.reachedAt != null) {
        row.reached++;
        row.toRefuge.push(ep.reachedAt - ep.at);
      }
      var d1 = nearestEnemy(sim, s);
      row.enemyGain.push(d1 - ep.enemyAtStart);
    }
    if (ep.kind === 'rage') {
      var a = (m.acts && m.acts.rage) || {};
      row.enemyAtStart.push(ep.enemyAtStart);
      row.nearest.push(ep.nearest);
      if (ep.nearest <= 2.2 + 0.5) row.reachedMelee++;
      row.strikes += (a.strikes || 0) - ep.strikes0;
      row.hits += (a.hits || 0) - ep.hits0;
      if (how === 'died') row.fell++;
    }
  }
  function blank() {
    return {
      n: 0,
      men: {},
      secs: [],
      endedBy: {},
      bandAtEnd: {},
      endedInContact: 0,
      reentries: 0,
      moved: [],
      reached: 0,
      toRefuge: [],
      enemyGain: [],
      enemyAtStart: [],
      nearest: [],
      reachedMelee: 0,
      strikes: 0,
      hits: 0,
      fell: 0
    };
  }
  (root.BattleProbes = root.BattleProbes || {})['stress-reactions'] = {
    every: 0,
    start: function () {
      track = new Map();
      last = {};
      examples = [];
      done = {};
      KINDS.forEach(function (k) {
        done[k] = blank();
      });
    },
    sample: function (sim) {
      var men = root.BattleModules.unitsFor(sim),
        now = +sim.time || 0;
      for (var i = 0; i < men.length; i++) {
        var s = men[i];
        if (!s || !s.root) continue;
        var st = s.eng && s.eng.state,
          ep = track.get(s);
        if (s.dead) {
          if (ep) {
            close(sim, s, ep, now, 'died');
            track.delete(s);
          }
          continue;
        }
        if (ACTING[st]) {
          if (ep && ep.kind !== st) {
            close(sim, s, ep, now);
            ep = null;
          }
          if (!ep) track.set(s, (ep = open(sim, s, st, now)));
          if (st === 'rage') ep.nearest = Math.min(ep.nearest, nearestEnemy(sim, s));
          if (st === 'flee' && ep.reachedAt == null && s.eng.refugeHere) ep.reachedAt = now;
        } else if (ep) {
          close(sim, s, ep, now);
          track.delete(s);
        }
      }
    },
    report: function (sim) {
      var out = { reactions: {}, examples: examples },
        now = +sim.time || 0;
      track.forEach(function (ep, s) {
        close(sim, s, ep, now, 'end of battle');
      });
      KINDS.forEach(function (k) {
        var r = done[k],
          o = {
            episodes: r.n,
            men: Object.keys(r.men).length,
            seconds: {
              mean: round(
                r.secs.reduce(function (a, b) {
                  return a + b;
                }, 0) / (r.n || 1)
              ),
              p50: quant(r.secs, 0.5),
              p90: quant(r.secs, 0.9),
              total: round(
                r.secs.reduce(function (a, b) {
                  return a + b;
                }, 0)
              )
            },
            endedBy: r.endedBy,
            bandAtEnd: r.bandAtEnd,
            endedInContact: r.endedInContact,
            reentriesWithin5s: r.reentries
          };
        if (k === 'flee')
          o.flee = {
            reachedRefuge: r.reached,
            secondsToRefuge: { p50: quant(r.toRefuge, 0.5), p90: quant(r.toRefuge, 0.9) },
            metresMoved: { p50: quant(r.moved, 0.5), p90: quant(r.moved, 0.9) },
            nearestEnemyGain: { p50: quant(r.enemyGain, 0.5), p90: quant(r.enemyGain, 0.9) }
          };
        if (k === 'rage')
          o.rage = {
            enemyAtStart: { p50: quant(r.enemyAtStart, 0.5), p90: quant(r.enemyAtStart, 0.9) },
            nearestApproach: { p50: quant(r.nearest, 0.5), p90: quant(r.nearest, 0.9) },
            reachedMeleeRange: r.reachedMelee,
            blowsStruck: r.strikes,
            blowsLanded: r.hits,
            fellDuring: r.fell
          };
        out.reactions[k] = o;
      });
      return out;
    }
  };
})(window);
