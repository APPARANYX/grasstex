/* Soldier condition: what the fight does to a man, kept as state the rest of the soldier layer can read.

   The tactics outline gives the soldier a narrow job (perceive, choose a target, fire, take cover, move
   under orders) and says he reports his readiness upward. What was missing between perceiving and
   deciding is the man himself: nothing about a comrade dying beside him, a wound, the leader going down
   or a minute of being shot at changed how he reacted, shot or moved. This module is that state, `stress`
   (0 calm .. 1 broken), plus the four bands it is read in.

   What moves it (measured on standard battles by scripts/probes/experience.js, not guessed: 88% of aimed
   rounds arrive from 250 m or more, so range-weighted rounds barely register; what a man actually lives
   through is suppression spells, wounds, and friends falling near him, leaders often among them):
     + suppression while `suppressedUntil` holds, a wound, a friend down (by distance, line of sight and
       whether he was in the man's squad), the leader down (the whole squad hears), aimed rounds (by
       range), no leader, no one near, and the fear of a squadmate who is worse off than he is;
     - time (it decays), faster with the leader within 12 m, in useful cover and among steady men,
       and much slower while under fire.

   Owner: this module writes `soldier.mind` and `squad.mind`, nothing else. It never writes stance,
   destination, target or any timer another layer owns; Engagement and the shot model *read* the
   modifiers below and decide what to do with them, so one owner per responsibility still holds.
   It runs on SquadAI's declared `beforeSoldier` slot (inside the fixed 0.15 s AI tick) and drains its
   kinds from the man's event queue (modules/08-soldier-events.js: a friend down, a wound, a suppression,
   the fire aimed at him, in that priority order); it draws nothing from the combat RNG (a man's nerve is a hash of his faction and id), so a
   battle with the module observing is the same battle as one without it (soldier-mind-check.js).

   Levers, for paired benchmarks: `?mind=0` (module off), `?mind=observe` (state kept, nothing reads it),
   `?mind=react,aim,hesitate,shock` (only those), default all. */
(function (root) {
  'use strict';
  if (!root.SquadAI || !root.BattleModules || !root.BattleSoldierEvents || root.BattleSoldierMind) return;

  var LEVERS = ['react', 'aim', 'hesitate', 'shock', 'morale'];
  function parse(search) {
    var m = /[?&]mind=([^&#]*)/.exec(search || ''),
      out = { on: true, flag: 'default', levers: {} },
      i;
    var v = m ? decodeURIComponent(m[1]).toLowerCase() : '';
    if (!m || v === '1' || v === 'on' || v === 'all' || v === '') {
      for (i = 0; i < LEVERS.length; i++) out.levers[LEVERS[i]] = true;
    } else if (v === '0' || v === 'off' || v === 'false') {
      out.on = false;
      out.flag = 'off';
    } else if (v !== 'observe') {
      v.split(',').forEach(function (k) {
        if (LEVERS.indexOf(k) >= 0) out.levers[k] = true;
      });
      out.flag = v;
    } else out.flag = 'observe';
    return out;
  }
  var MODE = parse(typeof location !== 'undefined' ? location.search : '');

  /* Gains are stress added (0..1 scale); rates are per second. */
  var TAU = 22, // seconds for stress to fall to 1/e with nothing helping
    SUPPRESSED_RATE = 0.05, // while his suppression window holds: a 1.6 s spell is +0.08
    INCOMING_ROUND = 0.02, // per aimed round, times how near the shooter is
    INCOMING_FAR = 300, // aimed rounds from this far or further do not register
    INCOMING_CAP = 0.08, // one AI tick's aimed rounds never add more than this
    WOUNDED = 0.3, // per wound that did not drop him
    FRIEND_DOWN = 0.16, // a friend down within CASUALTY_RANGE, scaled by how close
    SQUADMATE_DOWN = 1.3, // ... and more if he was in the man's own squad
    LEADER_DOWN = 0.2, // the squad's leader went down within LEADER_HEARD
    LEADERLESS_RATE = 0.01, // while the squad has no leader alive
    ISOLATED_RATE = 0.008, // while no squadmate is within ISOLATED_RANGE
    CONTAGION = 0.03; // per second, times how much worse off a neighbour within CONTAGION_RANGE is
  var CASUALTY_RANGE = 30,
    CLOSE_CASUALTY = 8, // no sight test inside this: he heard and saw it
    LEADER_HEARD = 60,
    SHOCK_RANGE = 10,
    LEADER_CALM_RANGE = 12,
    CONTAGION_RANGE = 8,
    ISOLATED_RANGE = 30,
    STEADY_NEIGHBOUR_RANGE = 8;
  /* Calming multiplies TAU (smaller = faster). */
  var LEADER_CALM = 0.65,
    COVER_CALM = 0.8,
    COMPANY_CALM = 0.05, // per steady neighbour, up to 3
    UNDER_FIRE_SLOW = 2.5,
    UNDER_FIRE_WINDOW = 3,
    COVER_USEFUL = 0.88,
    COVER_EVERY = 0.6;
  /* Bands with hysteresis: a man enters a band at UP and leaves it below DOWN. */
  var BANDS = ['steady', 'shaken', 'rattled', 'broken'],
    UP = [0.3, 0.55, 0.8],
    DOWN = [0.24, 0.47, 0.72];
  /* What each lever costs a man. */
  var REACT_GAIN = 0.6, // recognition takes up to 1.6x as long
    AIM_GAIN = 0.8, // shot group up to 1.8x as wide
    HESITATE_FROM = 0.35,
    HESITATE_GAIN = 2.2, // seconds a bound order waits per unit of stress above HESITATE_FROM ...
    MAX_HESITATION = 2, // ... never more than this: the order lives for BOUND_DURATION (3.6 s)
    SHOCK_BASE = 0.35,
    SHOCK_PER_GAIN = 2,
    SHOCK_MAX = 1,
    SHOCK_MIN_GAIN = 0.1,
    SHOCK_REFRACTORY = 3,
    MAX_DT = 0.5;

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }
  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
  function hash(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  /* Deterministic per man, never the combat RNG. */
  function unit(s, salt) {
    var h = hash(String(s.faction) + '|' + String(s.id) + '|' + salt);
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967295;
  }
  /* A man's nerve divides every stress gain. It is his fortitude when the stats module has it on (module 10:
     the same +-12% swing the hash gave, now a stat other layers read too); a sergeant is steadier still. */
  function nerveOf(s) {
    var stats = root.BattleSoldierStats,
      rank = s.role === 'sergeant' ? 1.15 : 1;
    if (stats && stats.on('for')) return stats.scale(s, 'nerve') * rank;
    return (1 + (unit(s, 'nerve') - 0.5) * 0.24) * rank;
  }

  function fresh(s) {
    return {
      v: 1,
      stress: 0,
      pub: 0,
      band: 0,
      bandSince: 0,
      peak: 0,
      at: -1,
      nerve: nerveOf(s),
      wounds: 0,
      pinnedUntil: 0,
      incoming: 0,
      incomingRounds: 0,
      lastIncomingAt: -99,
      shockUntil: 0,
      shocks: 0,
      coverAt: -99,
      inCover: false,
      time: [0, 0, 0, 0],
      gained: {
        suppression: 0,
        incoming: 0,
        wound: 0,
        friendDown: 0,
        leaderDown: 0,
        leaderless: 0,
        isolated: 0,
        contagion: 0
      },
      hesitations: 0
    };
  }
  function of(s) {
    return s.mind || (s.mind = fresh(s));
  }
  /* ---- what happened to other people --------------------------------------------------------- */

  function wasLeader(s) {
    var q = s.squad;
    return !!q && (q.leaderId != null ? q.leaderId === s.id : s.role === 'sergeant');
  }
  function shock(m, now, gain) {
    if (now < m.shockUntil + SHOCK_REFRACTORY) return;
    var d = (SHOCK_BASE + SHOCK_PER_GAIN * gain) / m.nerve;
    m.shockUntil = now + clamp(d, 0, SHOCK_MAX);
    m.shocks++;
  }
  /* A friend went down: what it does to a man who is where he can see or hear it. */
  function witness(s, m, c, battle, now) {
    if (c.faction !== s.faction || c.unit === s) return 0;
    var p = s.root.position,
      d = dist(c, p),
      sameSquad = s.squad && c.squad === s.squad.id,
      gain = 0,
      leader = false;
    if (c.leader && sameSquad && d <= LEADER_HEARD) {
      gain = LEADER_DOWN;
      leader = true;
    } else if (d <= CASUALTY_RANGE) {
      gain = FRIEND_DOWN * clamp(1 - (d - 4) / 26, 0.15, 1) * (sameSquad ? SQUADMATE_DOWN : 1);
      if (d > CLOSE_CASUALTY && !root.SquadAI.hasLineOfSight(s, c.unit, battle.heightAt, battle.obstacles))
        return 0;
    } else return 0;
    gain /= m.nerve;
    if (gain >= SHOCK_MIN_GAIN && d <= (leader ? CASUALTY_RANGE : SHOCK_RANGE)) shock(m, now, gain);
    if (leader) m.gained.leaderDown += gain;
    else m.gained.friendDown += gain;
    return gain;
  }

  /* ---- the tick ------------------------------------------------------------------------------ */

  function inCover(s, m, battle, now) {
    if (now - m.coverAt >= COVER_EVERY) {
      var F = root.BattleObstacleField,
        p = s.root.position;
      m.coverAt = now;
      m.inCover = !!F && F.coverPotentialAt(battle.obstacles, p.x, p.z) <= COVER_USEFUL;
    }
    return m.inCover;
  }
  function tick(s, battle) {
    if (!MODE.on || !s || s.dead || !s.root || !s.squad) return;
    var m = of(s),
      now = +battle.time || 0,
      sq = s.squad,
      p = s.root.position,
      E = root.BattleSoldierEvents;
    E.announceCasualties(battle, now);
    var dt = m.at < 0 ? 0 : clamp(now - m.at, 0, MAX_DT),
      gain = 0,
      g,
      i;
    m.at = now;
    m.pub = m.stress;

    /* What happened around him and to him since he last looked, in the queue's fixed priority order:
       a friend down, a wound, a suppression, then the fire on him. */
    var woundsTaken = 0;
    E.drain(s, 'soldier-mind', function (kind, d, at) {
      if (kind === 'casualty') gain += witness(s, m, d, battle, now);
      else if (kind === 'wound') woundsTaken += d.count;
      else if (kind === 'suppressed') m.pinnedUntil = Math.max(m.pinnedUntil, d.until);
      else if (kind === 'aimed') {
        var near = clamp(1 - d.d / INCOMING_FAR, 0, 1);
        m.lastIncomingAt = at;
        m.incomingRounds += d.rounds;
        m.incoming = Math.min(INCOMING_CAP, m.incoming + INCOMING_ROUND * near * near * d.rounds);
      }
    });
    if (woundsTaken > 0) {
      g = (WOUNDED * woundsTaken) / m.nerve;
      m.gained.wound += g;
      gain += g;
      m.wounds += woundsTaken;
    }
    var suppressed = m.pinnedUntil > now;
    if (suppressed) {
      g = (SUPPRESSED_RATE * dt) / m.nerve;
      m.gained.suppression += g;
      gain += g;
    }
    if (m.incoming > 0) {
      g = m.incoming / m.nerve;
      m.gained.incoming += g;
      gain += g;
      m.incoming = 0;
    }

    /* Who is around him: the leader, the nearest friend, and how his neighbours are holding up. */
    var leader = root.SquadAI.leaderOf(sq),
      nearest = Infinity,
      worst = 0,
      steady = 0,
      mates = sq.members || [];
    for (i = 0; i < mates.length; i++) {
      var o = mates[i];
      if (!o || o === s || o.dead || !o.root) continue;
      var d = dist(o.root.position, p);
      if (d < nearest) nearest = d;
      if (d <= CONTAGION_RANGE) {
        var os = o.mind ? o.mind.pub : 0;
        if (os - m.stress > worst) worst = os - m.stress;
      }
      if (d <= STEADY_NEIGHBOUR_RANGE && o.mind && o.mind.band === 0) steady++;
    }
    if (!leader) {
      g = LEADERLESS_RATE * dt;
      m.gained.leaderless += g;
      gain += g;
    }
    if (nearest > ISOLATED_RANGE) {
      g = ISOLATED_RATE * dt;
      m.gained.isolated += g;
      gain += g;
    }
    if (worst > 0) {
      g = CONTAGION * worst * dt;
      m.gained.contagion += g;
      gain += g;
    }

    /* Recovery: slower under fire, faster with the leader near, in cover and among steady men. */
    var tau = TAU,
      underFire = suppressed || now - m.lastIncomingAt <= UNDER_FIRE_WINDOW;
    if (leader && leader !== s && dist(leader.root.position, p) <= LEADER_CALM_RANGE) tau *= LEADER_CALM;
    if (inCover(s, m, battle, now)) tau *= COVER_CALM;
    tau *= 1 - COMPANY_CALM * Math.min(3, steady);
    if (underFire) tau *= UNDER_FIRE_SLOW;
    m.stress = clamp(m.stress * Math.exp(-dt / tau) + gain, 0, 1);
    if (m.stress > m.peak) m.peak = m.stress;

    var band = m.band;
    while (band < 3 && m.stress >= UP[band]) band++;
    while (band > 0 && m.stress < DOWN[band - 1]) band--;
    if (band !== m.band) {
      m.band = band;
      m.bandSince = now;
    }
    m.time[band] += dt;
    aggregate(sq, now);
  }
  /* Squad status upward, once per AI time: read from the last tick, one tick behind the men who have
     not yet ticked. Nothing reads it yet but the diagnostics export (Slice 2 is the Squad Leader). */
  function aggregate(sq, now) {
    if (sq._mindAt === now) return;
    sq._mindAt = now;
    var n = 0,
      sum = 0,
      max = 0,
      bands = [0, 0, 0, 0],
      mates = sq.members || [];
    for (var i = 0; i < mates.length; i++) {
      var o = mates[i];
      if (!o || o.dead || !o.mind) continue;
      n++;
      sum += o.mind.stress;
      if (o.mind.stress > max) max = o.mind.stress;
      bands[o.mind.band]++;
    }
    sq.mind = {
      at: now,
      n: n,
      mean: n ? sum / n : 0,
      max: max,
      shaken: bands[1],
      rattled: bands[2],
      broken: bands[3]
    };
  }
  /* A squad with no living man ticks nobody, so `aggregate` never ran for it again: its roll-up kept the
     last picture of men who are gone (n above 0, a mean and a max that nobody holds any more), whether
     the squad was wiped out or absorbed by a merge. The Squad Leader reads that roll-up next, so a squad
     left with no one is rolled up once more, over nobody (n 0, stamped with that time), and stays so. */
  function anyLiving(sq) {
    var mates = sq.members || [];
    for (var i = 0; i < mates.length; i++) if (mates[i] && !mates[i].dead) return true;
    return false;
  }
  function settle(sim, now) {
    var sides = ['us', 'ge'];
    for (var f = 0; f < sides.length; f++) {
      var squads = (sim.factions && sim.factions[sides[f]] && sim.factions[sides[f]].squads) || [];
      for (var i = 0; i < squads.length; i++) {
        var sq = squads[i];
        if (sq && sq.mind && sq.mind.n > 0 && !anyLiving(sq)) aggregate(sq, now);
      }
    }
  }
  /* ---- what the rest of the soldier layer reads ---------------------------------------------- */

  function on(lever) {
    return MODE.on && !!MODE.levers[lever];
  }
  function stressOf(s) {
    return s && s.mind ? s.mind.stress : 0;
  }
  /* Recognition takes this many times as long (Engagement.reactTime). */
  function reactScale(s) {
    return on('react') ? 1 + REACT_GAIN * Math.pow(stressOf(s), 1.5) : 1;
  }
  /* His shot group is this many times as wide (the shot model's dispersion). */
  function aimSigma(s) {
    return on('aim') ? 1 + AIM_GAIN * Math.pow(stressOf(s), 1.5) : 1;
  }
  /* Seconds an ordered bound waits before he moves (Engagement.orderedBound). */
  function hesitation(s) {
    return on('hesitate') ? clamp(HESITATE_GAIN * (stressOf(s) - HESITATE_FROM), 0, MAX_HESITATION) : 0;
  }
  /* Until when he is frozen by what he just saw: no aimed fire, halts if advancing (Engagement). */
  function shockUntil(s) {
    return on('shock') && s && s.mind ? s.mind.shockUntil : 0;
  }
  /* The squad's mean stress as the Squad Leader reads it for group morale (module 16): calm men unless the `morale`
     lever is on, so `?mind=0`, `?mind=observe` and a lever list without `morale` leave the flat 60% retreat alone. */
  function squadStress(sq) {
    return on('morale') && sq && sq.mind ? sq.mind.mean || 0 : 0;
  }
  function bandName(s) {
    return BANDS[s && s.mind ? s.mind.band : 0];
  }

  function snapshot(s) {
    var m = s && s.mind;
    if (!m) return null;
    var r = function (n) {
      return +n.toFixed(3);
    };
    return {
      stress: r(m.stress),
      band: BANDS[m.band],
      peak: r(m.peak),
      nerve: r(m.nerve),
      shocks: m.shocks,
      hesitations: m.hesitations,
      incomingRounds: m.incomingRounds,
      shockUntil: r(m.shockUntil),
      seconds: {
        steady: r(m.time[0]),
        shaken: r(m.time[1]),
        rattled: r(m.time[2]),
        broken: r(m.time[3])
      }
    };
  }
  /* One battle's totals, for the export and the benchmark: where the man-seconds went, per faction, and
     what every source of stress added. */
  function summary(sim) {
    var out = {
      mode: MODE.flag,
      levers: Object.keys(MODE.levers),
      manSeconds: 0,
      bandShare: { steady: 0, shaken: 0, rattled: 0, broken: 0 },
      peakBand: { steady: 0, shaken: 0, rattled: 0, broken: 0 },
      shocks: 0,
      hesitations: 0,
      casualtiesSeen: sim && sim._soldierEvents ? sim._soldierEvents.casualties : 0,
      gained: {},
      men: 0
    };
    var units = root.BattleModules.unitsFor(sim);
    for (var i = 0; i < units.length; i++) {
      var m = units[i] && units[i].mind;
      if (!m) continue;
      out.men++;
      for (var b = 0; b < 4; b++) {
        out.bandShare[BANDS[b]] += m.time[b];
        out.manSeconds += m.time[b];
      }
      var pk = 0;
      while (pk < 3 && m.peak >= UP[pk]) pk++;
      out.peakBand[BANDS[pk]]++;
      out.shocks += m.shocks;
      out.hesitations += m.hesitations;
      Object.keys(m.gained).forEach(function (k) {
        out.gained[k] = (out.gained[k] || 0) + m.gained[k];
      });
    }
    Object.keys(out.bandShare).forEach(function (k) {
      out.bandShare[k] = out.manSeconds ? +(out.bandShare[k] / out.manSeconds).toFixed(4) : 0;
    });
    Object.keys(out.gained).forEach(function (k) {
      out.gained[k] = +out.gained[k].toFixed(2);
    });
    out.manSeconds = +out.manSeconds.toFixed(1);
    return out;
  }
  function reset(sim) {
    sim._mindSummary = null;
    var units = root.BattleModules.unitsFor(sim);
    for (var i = 0; i < units.length; i++) {
      units[i].mind = null;
      if (units[i].squad) units[i].squad.mind = null;
    }
  }

  function subscribe() {
    root.BattleSoldierEvents.subscribe('soldier-mind', ['casualty', 'wound', 'suppressed', 'aimed']);
  }
  if (MODE.on) subscribe();
  root.SquadAI.extend('beforeSoldier', 'soldier-mind', tick);
  root.BattleModules.registerSystem('soldier-mind', {
    version: '1.0',
    onBattleStart: reset,
    onBattleRestart: reset,
    /* The export and the benchmark read a summary off the sim; refresh it a few times a minute. */
    onSimulationStep: function (sim) {
      if (!MODE.on) return;
      var t = +sim.time || 0;
      settle(sim, t);
      if (t - (sim._mindSummaryAt || 0) >= 5) {
        sim._mindSummaryAt = t;
        sim._mindSummary = summary(sim);
      }
    }
  });
  root.BattleSoldierMind = {
    version: '1.0',
    BANDS: BANDS,
    LEVERS: LEVERS,
    tuning: {
      TAU: TAU,
      SUPPRESSED_RATE: SUPPRESSED_RATE,
      INCOMING_ROUND: INCOMING_ROUND,
      INCOMING_FAR: INCOMING_FAR,
      WOUNDED: WOUNDED,
      FRIEND_DOWN: FRIEND_DOWN,
      LEADER_DOWN: LEADER_DOWN,
      CONTAGION: CONTAGION,
      UP: UP,
      DOWN: DOWN,
      REACT_GAIN: REACT_GAIN,
      AIM_GAIN: AIM_GAIN,
      MAX_HESITATION: MAX_HESITATION,
      SHOCK_MAX: SHOCK_MAX,
      SHOCK_REFRACTORY: SHOCK_REFRACTORY
    },
    mode: function () {
      return MODE;
    },
    configure: function (search) {
      MODE = parse(search);
      if (MODE.on) subscribe();
      return MODE;
    },
    of: of,
    tick: tick,
    settle: function (sim) {
      if (MODE.on && sim) settle(sim, +sim.time || 0);
    },
    stress: stressOf,
    band: bandName,
    reactScale: reactScale,
    aimSigma: aimSigma,
    hesitation: hesitation,
    shockUntil: shockUntil,
    squadStress: squadStress,
    noteHesitation: function (s) {
      if (s && s.mind) s.mind.hesitations++;
    },
    snapshot: snapshot,
    summary: summary,
    reset: reset
  };
  if (typeof console !== 'undefined')
    console.log(
      '[MIND] soldier condition active (' + MODE.flag + '): stress from fire, wounds, casualties, leadership'
    );
})(typeof window !== 'undefined' ? window : globalThis);
