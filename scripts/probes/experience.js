/* What a man in these battles actually goes through: the evidence a stress/composure model has to be
   calibrated against (tactics outline, "Soldier: perception and engagement executor"). Nothing here
   is guessed: it counts, per man and per battle, the things that would move him.
   - incoming: aimed rounds that had him as their target (sim.onShot: default and ballistic shot paths),
     by range band, and how many hit; man-seconds with a round aimed at him in the last 3 s;
   - suppression: seconds `suppressedUntil` held, the episodes (a rise past the previous end) and their
     length;
   - wounds that did not drop him (`wounds` grew, still up);
   - witnessed casualties: for every man who goes down, how many living men stood within 12 m and 25 m,
     in his squad and in others, and whether he was his squad's leader;
   - leadership: man-seconds within 12 m / 25 m of his squad leader, further, or with no leader alive;
   - isolation: man-seconds with no living squadmate within 15 m / 30 m;
   - cover: man-seconds in useful cover (coverPotentialAt <= 0.88);
   - what a whole man-minute looks like (per-man exposure percentiles), so a model can be tuned to the
     spread the battle really has, not the mean.
   Observe only: chains sim.onShot (presentation callback), reads state each step, keeps its own
   bookkeeping outside the sim. Never draws from battle.random. */
(function (root) {
  var INCOMING_WINDOW = 3,
    COVER_USEFUL = 0.88,
    COVER_EVERY = 0.6;
  var c, men, alive, lastT, lastCoverAt;
  function bump(o, k, n) {
    o[k] = (o[k] || 0) + (n == null ? 1 : n);
  }
  function pct(a, p) {
    if (!a.length) return null;
    var s = a.slice().sort(function (x, y) {
      return x - y;
    });
    return +s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))].toFixed(3);
  }
  function summarize(a) {
    var sum = 0;
    for (var i = 0; i < a.length; i++) sum += a[i];
    return {
      n: a.length,
      mean: a.length ? +(sum / a.length).toFixed(3) : null,
      p50: pct(a, 50),
      p90: pct(a, 90),
      p99: pct(a, 99),
      max: a.length ? +Math.max.apply(null, a).toFixed(3) : null
    };
  }
  function rangeBand(d) {
    return d < 50 ? '<50m' : d < 120 ? '50-120m' : d < 250 ? '120-250m' : '250m+';
  }
  function rec(s) {
    var r = men.get(s);
    if (!r) {
      r = {
        seconds: 0,
        suppressed: 0,
        suppEpisodes: 0,
        suppOn: false,
        suppStart: 0,
        lastSuppEnd: -1,
        incoming: 0,
        incomingHits: 0,
        lastIncoming: -99,
        underFire: 0,
        wounds: 0,
        woundsSeen: 0,
        witnessed12: 0,
        witnessed25: 0,
        witnessedSquad: 0,
        nearLeader12: 0,
        nearLeader25: 0,
        farFromLeader: 0,
        noLeader: 0,
        alone15: 0,
        alone30: 0,
        cover: 0,
        coverSamples: 0
      };
      men.set(s, r);
    }
    return r;
  }
  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
  (root.BattleProbes = root.BattleProbes || {})['experience'] = {
    every: 0,
    start: function (sim) {
      c = {
        incomingByRange: {},
        incomingHitsByRange: {},
        suppLengths: [],
        casualties: 0,
        leaderCasualties: 0,
        casualtyTimes: [],
        witnessedByCasualty12: [],
        witnessedByCasualty25: [],
        witnessedSquadByCasualty: []
      };
      men = new Map();
      alive = new Map();
      lastT = sim.time;
      lastCoverAt = -99;
      var old = sim.onShot;
      sim.onShot = function (shooter, target, hit, d) {
        if (old) old.apply(sim, arguments);
        if (!target || !target.root) return;
        var r = rec(target),
          band = rangeBand(+d || 0);
        r.incoming++;
        r.lastIncoming = sim.time;
        bump(c.incomingByRange, band);
        if (hit) {
          r.incomingHits++;
          bump(c.incomingHitsByRange, band);
        }
      };
    },
    sample: function (sim) {
      var dt = Math.max(0, sim.time - lastT);
      lastT = sim.time;
      if (!(dt > 0)) return;
      var SA = root.SquadAI,
        F = root.BattleObstacleField,
        all = root.BattleModules.unitsFor(sim),
        coverNow = sim.time - lastCoverAt >= COVER_EVERY,
        i,
        j;
      if (coverNow) lastCoverAt = sim.time;
      /* Casualties first: a man who was up last sample and is down now. */
      for (i = 0; i < all.length; i++) {
        var s = all[i];
        if (!s || !s.root) continue;
        var was = alive.get(s);
        if (was === undefined) {
          alive.set(s, !s.dead);
          continue;
        }
        if (was && s.dead) {
          alive.set(s, false);
          c.casualties++;
          c.casualtyTimes.push(+sim.time.toFixed(1));
          var wasLeader = false,
            near12 = 0,
            near25 = 0,
            nearSquad = 0,
            p = s.root.position;
          if (s.squad && s.squad.leaderId != null) wasLeader = s.squad.leaderId === s.id;
          else wasLeader = s.role === 'sergeant';
          if (wasLeader) c.leaderCasualties++;
          for (j = 0; j < all.length; j++) {
            var o = all[j];
            if (!o || o === s || o.dead || !o.root || o.faction !== s.faction) continue;
            var d = dist(p, o.root.position);
            if (d <= 25) {
              near25++;
              rec(o).witnessed25++;
              if (d <= 12) {
                near12++;
                rec(o).witnessed12++;
              }
              if (o.squad === s.squad) {
                nearSquad++;
                rec(o).witnessedSquad++;
              }
            }
          }
          c.witnessedByCasualty12.push(near12);
          c.witnessedByCasualty25.push(near25);
          c.witnessedSquadByCasualty.push(nearSquad);
        }
      }
      for (i = 0; i < all.length; i++) {
        var m = all[i];
        if (!m || m.dead || !m.root) continue;
        var r = rec(m),
          pos = m.root.position;
        r.seconds += dt;
        /* Suppression spells. */
        var on = (+m.suppressedUntil || 0) > sim.time;
        if (on) {
          r.suppressed += dt;
          if (!r.suppOn) {
            r.suppOn = true;
            r.suppStart = sim.time;
            if (sim.time > r.lastSuppEnd + 0.3) r.suppEpisodes++;
          }
          r.lastSuppEnd = sim.time;
        } else if (r.suppOn) {
          r.suppOn = false;
          c.suppLengths.push(+(r.lastSuppEnd - r.suppStart + dt).toFixed(2));
        }
        if (sim.time - r.lastIncoming <= INCOMING_WINDOW) r.underFire += dt;
        var w = (m.wounds && m.wounds.length) || 0;
        if (w > r.woundsSeen) {
          r.wounds += w - r.woundsSeen;
          r.woundsSeen = w;
        }
        /* Leadership and company. */
        var sq = m.squad,
          leader = sq && SA.leaderOf ? SA.leaderOf(sq) : null;
        if (!leader) r.noLeader += dt;
        else if (leader === m) r.nearLeader12 += dt;
        else {
          var dl = dist(pos, leader.root.position);
          if (dl <= 12) r.nearLeader12 += dt;
          else if (dl <= 25) r.nearLeader25 += dt;
          else r.farFromLeader += dt;
        }
        var nearest = Infinity;
        if (sq && sq.members)
          for (j = 0; j < sq.members.length; j++) {
            var f = sq.members[j];
            if (!f || f === m || f.dead || !f.root) continue;
            var df = dist(pos, f.root.position);
            if (df < nearest) nearest = df;
          }
        if (nearest > 15) r.alone15 += dt;
        if (nearest > 30) r.alone30 += dt;
        if (coverNow && F) {
          r.coverSamples++;
          if (F.coverPotentialAt(sim.obstacles, pos.x, pos.z) <= COVER_USEFUL) r.cover++;
        }
      }
    },
    report: function () {
      var totalSeconds = 0,
        sum = {
          suppressed: 0,
          underFire: 0,
          nearLeader12: 0,
          nearLeader25: 0,
          farFromLeader: 0,
          noLeader: 0,
          alone15: 0,
          alone30: 0,
          incoming: 0,
          incomingHits: 0,
          wounds: 0,
          suppEpisodes: 0,
          cover: 0,
          coverSamples: 0
        },
        perMinute = {
          incoming: [],
          suppressedShare: [],
          underFireShare: [],
          suppEpisodes: [],
          witnessed25: [],
          witnessed12: [],
          witnessedSquad: []
        };
      men.forEach(function (r) {
        if (r.seconds < 20) return;
        totalSeconds += r.seconds;
        Object.keys(sum).forEach(function (k) {
          sum[k] += r[k];
        });
        var min = r.seconds / 60;
        perMinute.incoming.push(r.incoming / min);
        perMinute.suppressedShare.push(r.suppressed / r.seconds);
        perMinute.underFireShare.push(r.underFire / r.seconds);
        perMinute.suppEpisodes.push(r.suppEpisodes / min);
        perMinute.witnessed25.push(r.witnessed25 / min);
        perMinute.witnessed12.push(r.witnessed12 / min);
        perMinute.witnessedSquad.push(r.witnessedSquad / min);
      });
      function share(k) {
        return totalSeconds ? +(sum[k] / totalSeconds).toFixed(4) : null;
      }
      var out = {
        manMinutes: +(totalSeconds / 60).toFixed(1),
        share: {
          suppressed: share('suppressed'),
          underFire3s: share('underFire'),
          nearLeader12: share('nearLeader12'),
          nearLeader25: share('nearLeader25'),
          farFromLeader: share('farFromLeader'),
          noLeader: share('noLeader'),
          alone15: share('alone15'),
          alone30: share('alone30'),
          inUsefulCover: sum.coverSamples ? +(sum.cover / sum.coverSamples).toFixed(4) : null
        },
        incoming: {
          rounds: sum.incoming,
          hits: sum.incomingHits,
          byRange: c.incomingByRange,
          hitsByRange: c.incomingHitsByRange,
          perManMinute: summarize(perMinute.incoming)
        },
        suppression: {
          episodes: sum.suppEpisodes,
          episodeLength: summarize(c.suppLengths),
          episodesPerManMinute: summarize(perMinute.suppEpisodes),
          shareOfTimePerMan: summarize(perMinute.suppressedShare)
        },
        underFireSharePerMan: summarize(perMinute.underFireShare),
        woundsThatDidNotDrop: sum.wounds,
        casualties: {
          total: c.casualties,
          leaders: c.leaderCasualties,
          firstAt: c.casualtyTimes.length ? c.casualtyTimes[0] : null,
          medianAt: pct(c.casualtyTimes, 50),
          livingFriendsWithin12m: summarize(c.witnessedByCasualty12),
          livingFriendsWithin25m: summarize(c.witnessedByCasualty25),
          livingSquadmatesWithin25m: summarize(c.witnessedSquadByCasualty)
        },
        witnessedPerManMinute: {
          within12m: summarize(perMinute.witnessed12),
          within25m: summarize(perMinute.witnessed25),
          squadmatesWithin25m: summarize(perMinute.witnessedSquad)
        }
      };
      return out;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
