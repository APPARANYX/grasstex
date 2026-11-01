/* Soldier condition on real battles (module 17, `BattleSoldierMind`): is the stress model calibrated?
   The model is meant to leave most men steady and take a few hot spots to shaken or rattled, so the
   numbers that matter are where the man-seconds went and who reached which band, not the mean.
   Reported per battle:
   - band shares of man-time (steady / shaken / rattled / broken), overall, per faction and per role;
   - how many men ever reached each band (peak), and how long a man who got there stayed;
   - what added the stress (suppression, wound, friend down, leader down, leaderless, isolated,
     contagion, aimed rounds) and its share of the total;
   - shocks (freezes) and their spacing, bound hesitations;
   - stress percentiles across living men sampled once a second, the same band shares for men whose squad
     is in contact (the share that decides how a fight looks), and the ten most-stressed men with the
     sources that put them there.
   With the levers on it also shows the cost: reaction scale and aim sigma across the sampled men.
   Observe only: reads soldier.mind and the module's own summary; writes nothing, draws no RNG. */
(function (root) {
  var c, last;
  function pct(a, p) {
    if (!a.length) return null;
    var s = a.slice().sort(function (x, y) {
      return x - y;
    });
    return +s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))].toFixed(3);
  }
  function bump(o, k, n) {
    o[k] = (o[k] || 0) + (n == null ? 1 : n);
  }
  var BANDS = ['steady', 'shaken', 'rattled', 'broken'];
  (root.BattleProbes = root.BattleProbes || {})['mind'] = {
    every: 1,
    start: function (sim) {
      c = {
        stress: [],
        react: [],
        aim: [],
        samples: 0,
        band: { steady: 0, shaken: 0, rattled: 0, broken: 0 },
        contact: { steady: 0, shaken: 0, rattled: 0, broken: 0 },
        contactSamples: 0
      };
      last = sim.time;
    },
    sample: function (sim) {
      var M = root.BattleSoldierMind,
        men = root.BattleModules.unitsFor(sim);
      if (!M) return;
      for (var i = 0; i < men.length; i++) {
        var s = men[i];
        if (!s || s.dead || !s.mind) continue;
        c.samples++;
        c.stress.push(s.mind.stress);
        c.react.push(M.reactScale(s));
        c.aim.push(M.aimSigma(s));
        c.band[M.band(s)]++;
        if (s.squad && s.squad.inContact) {
          c.contactSamples++;
          c.contact[M.band(s)]++;
        }
      }
    },
    report: function (sim) {
      var M = root.BattleSoldierMind;
      if (!M) return { error: 'BattleSoldierMind is not loaded' };
      var men = root.BattleModules.unitsFor(sim),
        byRole = {},
        byFaction = {},
        shocksBySpacing = [],
        top = [];
      men.forEach(function (s) {
        if (!s || !s.mind) return;
        var m = s.mind,
          snap = M.snapshot(s);
        [
          [byRole, s.role],
          [byFaction, s.faction]
        ].forEach(function (pair) {
          var o = (pair[0][pair[1]] = pair[0][pair[1]] || { men: 0, seconds: [0, 0, 0, 0], peakRattled: 0 });
          o.men++;
          for (var b = 0; b < 4; b++) o.seconds[b] += m.time[b];
          if (m.peak >= M.tuning.UP[1]) o.peakRattled++;
        });
        top.push({
          id: s.id,
          faction: s.faction,
          role: s.role,
          dead: !!s.dead,
          snap: snap,
          gained: Object.keys(m.gained).reduce(function (o, k) {
            if (m.gained[k] > 0.005) o[k] = +m.gained[k].toFixed(3);
            return o;
          }, {})
        });
      });
      function share(o) {
        var t = o.seconds[0] + o.seconds[1] + o.seconds[2] + o.seconds[3];
        return {
          men: o.men,
          steady: t ? +(o.seconds[0] / t).toFixed(4) : null,
          shaken: t ? +(o.seconds[1] / t).toFixed(4) : null,
          rattled: t ? +(o.seconds[2] / t).toFixed(4) : null,
          broken: t ? +(o.seconds[3] / t).toFixed(4) : null,
          reachedRattled: o.peakRattled
        };
      }
      top.sort(function (a, b) {
        return b.snap.peak - a.snap.peak;
      });
      var sum = M.summary(sim),
        gainedTotal = Object.keys(sum.gained).reduce(function (a, k) {
          return a + sum.gained[k];
        }, 0),
        gainedShare = {};
      Object.keys(sum.gained).forEach(function (k) {
        gainedShare[k] = gainedTotal ? +(sum.gained[k] / gainedTotal).toFixed(3) : 0;
      });
      return {
        mode: sum.mode,
        men: sum.men,
        manSeconds: sum.manSeconds,
        bandShare: sum.bandShare,
        peakBand: sum.peakBand,
        byFaction: Object.keys(byFaction).reduce(function (o, k) {
          o[k] = share(byFaction[k]);
          return o;
        }, {}),
        byRole: Object.keys(byRole).reduce(function (o, k) {
          o[k] = share(byRole[k]);
          return o;
        }, {}),
        sources: { stressAdded: sum.gained, share: gainedShare },
        shocks: sum.shocks,
        hesitations: sum.hesitations,
        casualtiesSeen: sum.casualtiesSeen,
        livingStress: {
          samples: c.samples,
          p50: pct(c.stress, 50),
          p90: pct(c.stress, 90),
          p99: pct(c.stress, 99),
          reactScaleP99: pct(c.react, 99),
          aimSigmaP99: pct(c.aim, 99),
          sampledBandShare: BANDS.reduce(function (o, k) {
            o[k] = c.samples ? +(c.band[k] / c.samples).toFixed(4) : null;
            return o;
          }, {}),
          /* The share that matters for how a fight looks: men whose squad is in contact. */
          inContactSamples: c.contactSamples,
          inContactBandShare: BANDS.reduce(function (o, k) {
            o[k] = c.contactSamples ? +(c.contact[k] / c.contactSamples).toFixed(4) : null;
            return o;
          }, {})
        },
        mostStressed: top.slice(0, 10)
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
