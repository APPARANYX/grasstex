/* The man who has fled on real battles (`?stressAct=flee`): what became of each one. Observe only: reads Engagement's
   `fledPhase`, the man's squad, weapon and position and writes nothing, draws no random number.

   Per man who broke for good (every step, so nothing is missed), one row:
     - when and where he broke, his squad, his side, his role, the nearest enemy then;
     - each phase he went through and when (`run`, `wait`, `home`), how long each lasted, how far the refuge was;
     - how the wait ended: picked up (his squad changed to a retreating squad's), an enemy (the wait was short and he
       went home alone) or the clock (the full wait);
     - whether he reached base and was armed again, or died (in which phase, how far from the nearest enemy), or was
       still running, waiting or on his way home when the battle ended (and how far from base he was);
   and per side the totals of those, the seconds per phase, and a series every 30 simulated seconds of how many fled men
   were in each phase, alive on their own, and the lone squads (`fledId`) in the roster. */
(function (root) {
  'use strict';
  var recs, series, nextAt, WAIT;
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
  function bump(o, k, n) {
    o[k] = (o[k] || 0) + (n == null ? 1 : n);
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
  function pos(s) {
    return { x: s.root.position.x, z: s.root.position.z };
  }
  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
  function start() {
    recs = {};
    series = [];
    nextAt = 0;
    var T = root.BattleEngagement && root.BattleEngagement.tuning && root.BattleEngagement.tuning.ACT_TUNING;
    WAIT = (T && T.FLED_WAIT) || 180;
  }
  function open(sim, s, now) {
    var e = s.eng,
      sq = s.squad;
    return (recs[s.id] = {
      soldier: s.id,
      faction: s.faction,
      role: s.role,
      brokeAt: round(now, 2),
      from: pos(s),
      squad: sq && sq.id,
      home: sq && sq.home ? { x: sq.home.x, z: sq.home.z } : null,
      enemyAtBreak: round(nearestEnemy(sim, s)),
      weaponLeft: !s.weapon,
      hpAtBreak: round(s.maxHp ? s.hp / s.maxHp : 1, 2),
      woundsAtBreak: (s.wounds && s.wounds.length) || 0,
      bleedingAtBreak: s.bleedRate > 0,
      phases: [{ phase: e.fledPhase, at: round(now, 2) }],
      phase: e.fledPhase,
      refuge: null,
      refugeDist: null,
      pickedUpAt: null,
      pickedUpBy: null,
      rearmedAt: null,
      deadAt: null,
      diedIn: null,
      cause: null,
      zone: null,
      enemyAtDeath: null,
      last: pos(s),
      trail: [{ at: now, p: pos(s) }]
    });
  }
  function sample(sim) {
    var now = sim.time,
      men = root.BattleModules.unitsFor(sim),
      counts = { run: 0, wait: 0, home: 0, rearmed: 0, dead: 0 },
      lone = 0,
      i;
    for (i = 0; i < men.length; i++) {
      var s = men[i];
      if (!s || !s.root) continue;
      var e = s.eng,
        ph = (e && e.fledPhase) || null,
        r = recs[s.id];
      if (ph && !r) r = open(sim, s, now);
      if (!r) continue;
      if (s.dead) {
        if (r.deadAt == null) {
          r.deadAt = round(now, 2);
          r.diedIn = r.rearmedAt != null ? 'rearmed' : r.phase;
          r.enemyAtDeath = round(nearestEnemy(sim, s));
          r.cause = s.casualty ? s.casualty.cause : null;
          r.zone = s.casualty ? s.casualty.zone : null;
        }
        counts.dead++;
        continue;
      }
      if (ph !== r.phase) {
        r.phases.push({ phase: ph, at: round(now, 2) });
        if (r.phase === 'run' && ph === 'wait') {
          r.refuge = e.refuge ? { x: e.refuge.x, z: e.refuge.z } : pos(s);
          r.refugeDist = round(dist(r.from, pos(s)));
        }
        if (ph === null && r.rearmedAt == null) r.rearmedAt = round(now, 2);
        r.phase = ph;
      }
      var sq = s.squad;
      if (sq && sq.fledId == null && r.pickedUpAt == null && r.phase !== 'run') {
        r.pickedUpAt = round(now, 2);
        r.pickedUpBy = sq.id;
      }
      if (sq && sq.fledId != null) lone++;
      r.last = pos(s);
      if (ph) counts[ph]++;
      else if (r.rearmedAt != null) counts.rearmed++;
      if (!r.trail.length || now - r.trail[r.trail.length - 1].at >= 30) r.trail.push({ at: now, p: pos(s) });
    }
    if (now >= nextAt) {
      nextAt = now + 30;
      series.push({
        t: round(now, 0),
        run: counts.run,
        wait: counts.wait,
        home: counts.home,
        rearmedAlive: counts.rearmed,
        dead: counts.dead,
        loneSquads: lone
      });
    }
  }
  function report(sim) {
    var rows = Object.keys(recs).map(function (k) {
        return recs[k];
      }),
      by = {},
      examples = [];
    rows.forEach(function (r) {
      var f = by[r.faction] || (by[r.faction] = { causes: {}, wounded: 0, bleeding: 0, hp: [], diedAfter: [], broke: 0, reachedRefuge: 0, picked: 0, enemy: 0, clock: 0, rearmed: 0, died: {}, still: {}, secs: { run: [], wait: [], home: [] }, refugeDist: [], enemyAtBreak: [], enemyAtDeath: [] });
      f.broke++;
      if (r.woundsAtBreak > 0) f.wounded++;
      if (r.bleedingAtBreak) f.bleeding++;
      f.hp.push(r.hpAtBreak);
      if (r.deadAt != null) {
        bump(f.causes, r.cause || 'unknown');
        f.diedAfter.push(r.deadAt - r.brokeAt);
      }
      f.enemyAtBreak.push(r.enemyAtBreak);
      if (r.refugeDist != null) {
        f.reachedRefuge++;
        f.refugeDist.push(r.refugeDist);
      }
      for (var i = 0; i < r.phases.length; i++) {
        var p = r.phases[i],
          nx = r.phases[i + 1],
          endAt = nx ? nx.at : r.deadAt != null ? r.deadAt : sim.time;
        if (p.phase && f.secs[p.phase]) f.secs[p.phase].push(endAt - p.at);
      }
      var waitEnd = null;
      for (i = 0; i < r.phases.length; i++)
        if (r.phases[i].phase === 'wait' && r.phases[i + 1] && r.phases[i + 1].phase === 'home')
          waitEnd = r.phases[i + 1].at - r.phases[i].at;
      if (waitEnd != null) {
        if (r.pickedUpAt != null) f.picked++;
        else if (waitEnd >= WAIT - 1) f.clock++;
        else f.enemy++;
      }
      if (r.rearmedAt != null) f.rearmed++;
      if (r.deadAt != null) {
        bump(f.died, r.diedIn || 'run');
        f.enemyAtDeath.push(r.enemyAtDeath);
      } else if (r.rearmedAt == null) bump(f.still, r.phase || 'none');
      if (examples.length < 40)
        examples.push({
          soldier: r.soldier,
          faction: r.faction,
          role: r.role,
          squad: r.squad,
          brokeAt: r.brokeAt,
          hpAtBreak: r.hpAtBreak,
          woundsAtBreak: r.woundsAtBreak,
          bleedingAtBreak: r.bleedingAtBreak,
          cause: r.cause,
          zone: r.zone,
          enemyAtBreak: r.enemyAtBreak,
          refugeDist: r.refugeDist,
          phases: r.phases,
          pickedUpAt: r.pickedUpAt,
          pickedUpBy: r.pickedUpBy,
          rearmedAt: r.rearmedAt,
          deadAt: r.deadAt,
          diedIn: r.diedIn,
          enemyAtDeath: r.enemyAtDeath,
          endPos: r.last,
          home: r.home,
          distToHomeAtEnd: r.home ? round(dist(r.last, r.home)) : null
        });
    });
    var sides = {};
    Object.keys(by).forEach(function (k) {
      var f = by[k];
      sides[k] = {
        broke: f.broke,
        wasWoundedAtBreak: f.wounded,
        wasBleedingAtBreak: f.bleeding,
        hpAtBreak: { p50: quant(f.hp.map(function (x) { return x * 100; }), 0.5), p90: quant(f.hp.map(function (x) { return x * 100; }), 0.9) },
        deathCause: f.causes,
        secondsFromBreakToDeath: { p50: quant(f.diedAfter, 0.5), p90: quant(f.diedAfter, 0.9) },
        reachedRefuge: f.reachedRefuge,
        pickedUp: f.picked,
        homeBecauseEnemy: f.enemy,
        homeBecauseClock: f.clock,
        rearmed: f.rearmed,
        died: f.died,
        stillAtEnd: f.still,
        secondsPerPhase: {
          run: { n: f.secs.run.length, p50: quant(f.secs.run, 0.5), p90: quant(f.secs.run, 0.9) },
          wait: { n: f.secs.wait.length, p50: quant(f.secs.wait, 0.5), p90: quant(f.secs.wait, 0.9) },
          home: { n: f.secs.home.length, p50: quant(f.secs.home, 0.5), p90: quant(f.secs.home, 0.9) }
        },
        refugeDistance: { p50: quant(f.refugeDist, 0.5), p90: quant(f.refugeDist, 0.9) },
        nearestEnemyAtBreak: { p50: quant(f.enemyAtBreak, 0.5), p90: quant(f.enemyAtBreak, 0.9) },
        nearestEnemyAtDeath: { n: f.enemyAtDeath.length, p50: quant(f.enemyAtDeath, 0.5), p90: quant(f.enemyAtDeath, 0.9) }
      };
    });
    var squads = ['us', 'ge'].reduce(function (o, f) {
      var list = (sim.factions && sim.factions[f] && sim.factions[f].squads) || [];
      o[f] = {
        squads: list.length,
        lone: list.filter(function (q) {
          return q.fledId != null;
        }).length,
        loneLive: list.filter(function (q) {
          return q.fledId != null && !q.disbanded && q.members.some(function (m) {
            return !m.dead;
          });
        }).length
      };
      return o;
    }, {});
    return { time: round(sim.time, 1), waitSeconds: WAIT, men: rows.length, sides: sides, squads: squads, series: series, examples: examples };
  }
  (root.BattleProbes = root.BattleProbes || {})['fled-men'] = { every: 0, start: start, sample: sample, report: report };
})(window);
