/* Soldier stats: six fixed traits per man, and the numbers the rest of the soldier layer reads from them.

     PHY  physical      strength and endurance      speed, and the weight of a heavy weapon
     MKM  marksmanship  accuracy and fire control   the width of his shot group
     FOR  fortitude     grip under suppression      how long a suppression or a shock holds him, and how
                                                    much of every stress gain he takes
     TAC  awareness     perception                  how fast he recognises a contact, how far he spots
     AGI  agility       speed and dexterity         how fast he settles his aim, finds cover and sprints
     TEC  technical     support skills              how often his gun jams and how fast he clears it,
                                                    how fast an engineer builds

   A man's stats are hash rolls of his faction and id: the mean of three hashes, so most men sit near 0.5 and
   a few are outliers. They do not depend on his role (a later slice deals roles and weapons from them) and they
   never draw from the combat RNG, so the same man is the same man in every battle and a battle with the
   module absent or `?stats=0` is the same battle as before it existed (soldier-stats-check.js).

   Owner: this module writes `soldier.stats` and `squad.stats`, nothing else. It supplies numbers; each layer
   that reads one decides what it costs, exactly as Engagement decides what a stressed man costs (module 17):
   Engagement keeps stance and reaction, the shot model keeps dispersion, the ammunition module keeps
   stoppages. It never writes a timer, a stance, a destination or another layer's state.

   Everything a stat is worth is in EFFECTS below: one declared table (which stat, which direction, how big,
   in what unit, who reads it), so the vocabulary is listable and the genome rewrite has one place to lift
   it from. `span` is the largest fractional swing, reached at a stat of 0 or 1; a man of stat 0.5 is exactly
   1, so nothing shifts on average. Signs are written as the effect a HIGH stat has: a negative span shortens.

   Levers, for paired benchmarks: `?stats=0` (module off: no state kept, every scale 1),
   `?stats=for,tac,...` (only those stats' effects, `squad` for the General's use of squad means),
   default all of them, including `deal`: each squad's roles and therefore weapons are assigned from
   its ten men's stats at spawn. `?stats=0` disables the module; a comma list enables exactly those named. */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleSoldierStats) return;

  var STATS = ['phy', 'mkm', 'for', 'tac', 'agi', 'tec'];
  var LEVERS = STATS.concat(['squad', 'deal']);
  var DEFAULT_LEVERS = LEVERS.slice();
  function parse(search) {
    var m = /[?&]stats=([^&#]*)/.exec(search || ''),
      out = { on: true, flag: 'default', levers: {} },
      i;
    var v = m ? decodeURIComponent(m[1]).toLowerCase() : '';
    if (!m || v === '1' || v === 'on' || v === 'all' || v === '') {
      for (i = 0; i < DEFAULT_LEVERS.length; i++) out.levers[DEFAULT_LEVERS[i]] = true;
    } else if (v === '0' || v === 'off' || v === 'false') {
      out.on = false;
      out.flag = 'off';
    } else {
      v.split(',').forEach(function (k) {
        if (k === 'all')
          DEFAULT_LEVERS.forEach(function (l) {
            out.levers[l] = true;
          });
        else if (LEVERS.indexOf(k) >= 0) out.levers[k] = true;
      });
      out.flag = v;
    }
    return out;
  }
  var MODE = parse(typeof location !== 'undefined' ? location.search : '');

  /* effect: { stat, span }. value(man) = 1 + (stat - 0.5) * 2 * span.
       hold         FOR  -0.4   x seconds a suppression or a wound's shock holds a man     SquadAI.suppress
       nerve        FOR  +0.24  x how little of every stress gain and shock he takes        17-soldier-mind
       recognition  TAC  -0.4   x seconds from acquiring a contact to being ready to shoot  engagement reactTime
       sight        TAC  +0.15  x how far he spots (his role's range)                       squad-ai findTarget
       group        MKM  -0.4   x his shot group (dispersion sigma)                         14-z dispersionSigma
       settle       AGI  -0.4   x seconds his aim settles after a stance change             engagement AIM_SETTLE
       coverSearch  AGI  -0.4   x seconds between his urgent-cover searches                 44-combat-urgency
       pace         AGI  +0.08  x sprint and crouch-run speed                               11-soldier-individuality
       fitness      PHY  +0.08  x every gait speed (the old hash `fitness`, now his PHY)    11-soldier-individuality
       setup        PHY  -0.3   x seconds to emplace a machine gun                          engagement GUNNER_SETUP
       stoppage     TEC  -0.4   x the chance a round jams                                   46-ammunition-stoppages
       clear        TEC  -0.4   x seconds to clear a stoppage                               46-ammunition-stoppages
       build        TEC  +0.4   x the rate an engineer builds a fortification               21-defender-engineers
     A stat of 1 in a span of 0.4 is 40% off or on; the mean of three hashes puts the typical man a third of
     the way there and one man in forty two thirds of it. Nothing here was tuned to an outcome. */
  var EFFECTS = {
    hold: { stat: 'for', span: -0.4 },
    nerve: { stat: 'for', span: 0.24 },
    recognition: { stat: 'tac', span: -0.4 },
    sight: { stat: 'tac', span: 0.15 },
    group: { stat: 'mkm', span: -0.4 },
    settle: { stat: 'agi', span: -0.4 },
    coverSearch: { stat: 'agi', span: -0.4 },
    pace: { stat: 'agi', span: 0.08 },
    fitness: { stat: 'phy', span: 0.08 },
    setup: { stat: 'phy', span: -0.3 },
    stoppage: { stat: 'tec', span: -0.4 },
    clear: { stat: 'tec', span: -0.4 },
    build: { stat: 'tec', span: 0.4 }
  };
  /* What the General reads of a squad (2e): composites of the squad's mean stats, each ranked against the
     side's other living squads. A squad needs MIN_MEN living to count: the mean of two men is noise. */
  var COMPOSITES = {
    pace: ['phy', 'agi'],
    grit: ['for'],
    support: ['tec', 'mkm'],
    eyes: ['tac']
  };
  var MIN_MEN = 3;

  function hash(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  /* Deterministic per man, never the combat RNG. FNV-1a alone leaves salts that differ in their last
     character correlated (0.024 between the three hashes of one stat, which fattens the mean of three), so
     the hash gets murmur3's finalizer (0.003). */
  function unit(s, salt) {
    var h = hash(String(s.faction) + '|' + String(s.id) + '|stat:' + salt);
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  }
  function rollOf(s, stat) {
    return (unit(s, stat + ':a') + unit(s, stat + ':b') + unit(s, stat + ':c')) / 3;
  }
  function fresh(s) {
    var out = {};
    for (var i = 0; i < STATS.length; i++) out[STATS[i]] = rollOf(s, STATS[i]);
    return out;
  }
  function of(s) {
    return s.stats || (s.stats = fresh(s));
  }
  function on(lever) {
    return MODE.on && !!MODE.levers[lever];
  }

  /* ---- what the rest of the soldier layer reads -------------------------------------------- */

  /* 1 for an average man, with the lever off, or for a name that is not an effect. */
  function scale(s, effect) {
    var e = EFFECTS[effect];
    if (!e || !s || !on(e.stat)) return 1;
    return 1 + (of(s)[e.stat] - 0.5) * 2 * e.span;
  }

  /* ---- squads ------------------------------------------------------------------------------ */

  /* The mean of each stat over the squad's living men, once per sim time. Status upward: the General reads
     it, nothing else writes it. A squad with no living man is rolled up over nobody (n 0). */
  function squadStats(sq, now) {
    if (!sq) return null;
    if (sq.stats && sq.stats.at === now) return sq.stats;
    var n = 0,
      mean = {},
      mates = sq.members || [],
      i,
      k;
    for (k = 0; k < STATS.length; k++) mean[STATS[k]] = 0;
    for (i = 0; i < mates.length; i++) {
      var o = mates[i];
      if (!o || o.dead) continue;
      var st = of(o);
      n++;
      for (k = 0; k < STATS.length; k++) mean[STATS[k]] += st[STATS[k]];
    }
    for (k = 0; k < STATS.length; k++) mean[STATS[k]] = n ? mean[STATS[k]] / n : 0;
    return (sq.stats = { at: now, n: n, mean: mean });
  }
  function composite(stats, name) {
    var parts = COMPOSITES[name],
      sum = 0;
    for (var i = 0; i < parts.length; i++) sum += stats.mean[parts[i]];
    return sum / parts.length;
  }
  /* Where the squad stands among its own side's living squads on each composite: 0 the lowest, 1 the highest,
     ties broken by squad id so the answer never depends on list order. A side with one squad counting, or a
     squad too thin to count, gets 0.5 (no pull either way). */
  var cache = { sim: null, time: -1, sides: {} };
  function profile(sim, sq) {
    var now = +sim.time || 0;
    if (!on('squad') || !sq) return null;
    if (cache.sim !== sim || cache.time !== now) cache = { sim: sim, time: now, sides: {} };
    var side = cache.sides[sq.faction];
    if (!side) {
      var squads = (sim.factions && sim.factions[sq.faction] && sim.factions[sq.faction].squads) || [],
        counted = [],
        i;
      side = cache.sides[sq.faction] = {};
      for (i = 0; i < squads.length; i++) {
        var q = squads[i],
          st = squadStats(q, now);
        if (st && st.n >= MIN_MEN) counted.push({ id: String(q.id), squad: q, stats: st });
      }
      Object.keys(COMPOSITES).forEach(function (name) {
        var order = counted.slice().sort(function (a, b) {
          var d = composite(a.stats, name) - composite(b.stats, name);
          return d || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
        });
        order.forEach(function (c, at) {
          var row = side[c.id] || (side[c.id] = {});
          row[name] = order.length > 1 ? at / (order.length - 1) : 0.5;
        });
      });
    }
    var row = side[String(sq.id)];
    if (row) return row;
    var neutral = {};
    Object.keys(COMPOSITES).forEach(function (name) {
      neutral[name] = 0.5;
    });
    return neutral;
  }

  /* ---- spawn (lever `deal`) ------------------------------------------------------------------ */

  /* Which of a squad's ten ids fills which slot. The ten ids are fixed (firstId .. firstId + n - 1, so the id
     counter, the combat RNG and every hash keyed on an id see the same set); only the slot each stands in is
     dealt, and the slot's role is what issues the weapon (SquadAI.loadoutFor). Greedy in command order, ties to
     the lowest id, so it is a pure function of the ids:
       sergeant  FOR + TAC   holds the squad together and sees what is coming
       gunner    PHY + TEC   carries and works the heavy gun
       scout     AGI + MKM   moves first and shoots at range with a lighter weapon
     the riflemen are whoever is left, in id order. Returns the id for each slot, or null when the lever is off. */
  var DEAL = { sergeant: ['for', 'tac'], gunner: ['phy', 'tec'], scout: ['agi', 'mkm'] };
  var DEAL_ORDER = ['sergeant', 'gunner', 'scout'];
  function deal(faction, firstId, roles) {
    if (!on('deal') || !roles || !roles.length) return null;
    var pool = [],
      out = new Array(roles.length),
      i,
      r;
    for (i = 0; i < roles.length; i++) {
      var man = { faction: faction, id: firstId + i };
      pool.push({ id: firstId + i, stats: fresh(man) });
    }
    for (r = 0; r < DEAL_ORDER.length; r++) {
      var keys = DEAL[DEAL_ORDER[r]];
      for (i = 0; i < roles.length; i++) {
        if (roles[i] !== DEAL_ORDER[r]) continue;
        var best = -1,
          bestScore = -Infinity;
        for (var p = 0; p < pool.length; p++) {
          var score = 0;
          for (var k = 0; k < keys.length; k++) score += pool[p].stats[keys[k]];
          if (
            score > bestScore + 1e-12 ||
            (Math.abs(score - bestScore) <= 1e-12 && pool[p].id < pool[best].id)
          ) {
            best = p;
            bestScore = score;
          }
        }
        out[i] = pool[best].id;
        pool.splice(best, 1);
      }
    }
    pool.sort(function (a, b) {
      return a.id - b.id;
    });
    for (i = 0; i < roles.length; i++) if (out[i] === undefined) out[i] = pool.shift().id;
    return out;
  }

  function reset(sim) {
    if (!MODE.on) return;
    var units = root.BattleModules.unitsFor ? root.BattleModules.unitsFor(sim) : [];
    for (var i = 0; i < units.length; i++) {
      if (units[i].stats) units[i].stats = null;
      if (units[i].squad && units[i].squad.stats) units[i].squad.stats = null;
    }
    cache = { sim: null, time: -1, sides: {} };
  }
  root.BattleModules.registerSystem('soldier-stats', {
    version: '1.0',
    onBattleStart: reset,
    onBattleRestart: reset
  });

  root.BattleSoldierStats = {
    version: '1.0',
    STATS: STATS,
    LEVERS: LEVERS,
    EFFECTS: EFFECTS,
    COMPOSITES: COMPOSITES,
    tuning: { MIN_MEN: MIN_MEN },
    mode: function () {
      return MODE;
    },
    configure: function (search) {
      MODE = parse(search);
      cache = { sim: null, time: -1, sides: {} };
      return MODE;
    },
    on: on,
    of: of,
    scale: scale,
    squad: squadStats,
    profile: profile,
    deal: deal,
    reset: reset
  };
  if (typeof console !== 'undefined')
    console.log('[STATS] soldier stats active (' + MODE.flag + '): phy mkm for tac agi tec, hash rolls');
})(typeof window !== 'undefined' ? window : globalThis);
