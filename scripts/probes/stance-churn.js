/* Stance churn and firing mid-change (AGENTS.md open issue "Stance churn and firing mid-change").
   Measure before fixing. Engagement owns stance (`commitStance`), but `44-combat-urgency.js`, the
   reload hook in `12-soldier-animation-events.js` and `stepMovement` (`crouching`) also write it.
   Per man, the stance he actually shows (prone / crawl / crouch / stand, from `prone`, `crawling`,
   `crouching`) is sampled every step. Reported:
   - changes per man-minute, attributed to the writer of the flag that flipped (a property setter
     on `prone`, `tacticalCrouch` and `crouching` that reads the calling file from the stack, only
     when the value changes), plus flips of each flag per writer;
   - A->B->A bounces in under 1 s (the pattern `run.js` asserts against, but there on one man in a
     30 s duel, reading Engagement's committed `eng.stance`, without module 44 or the reload hook:
     that is why it never sees these);
   - trigger pulls within AIM_SETTLE of a shown stance change (firing mid-change), by writer;
   - prone episodes shorter than PRONE_HOLD, by who stood him up;
   - Engagement's own committed changes (`eng.stance`) for comparison.
   Observe only: the setters store and return the same values; `onFire` is chained. */
(function (root) {
  var FLAGS = ['prone', 'tacticalCrouch', 'crouching'],
    FILE = /\/(battle\/(?:modules\/)?[\w.-]+\.js)/g,
    /* setCrouch/setProne and 45's visual wrapper around them: report who called them. */
    WRAPPERS = { 'battle/soldier.js': 1, 'battle/modules/45-stance-transition-crawl.js': 1 },
    c,
    men;
  function writer() {
    var st = String(new Error().stack || ''),
      m;
    FILE.lastIndex = 0;
    while ((m = FILE.exec(st))) if (!WRAPPERS[m[1]]) return m[1].replace(/^battle\//, '');
    return 'unknown';
  }
  function watch(s) {
    if (s.__stanceProbe) return;
    var box = {},
      rec = (s.__stanceProbe = { last: {} });
    FLAGS.forEach(function (k) {
      box[k] = s[k];
      Object.defineProperty(s, k, {
        configurable: true,
        enumerable: true,
        get: function () {
          return box[k];
        },
        set: function (v) {
          if (!!v !== !!box[k]) {
            var w = writer();
            rec.last[k] = w;
            rec.lastWriter = w;
            var f = (c.flagFlips[k] = c.flagFlips[k] || {});
            f[w] = (f[w] || 0) + 1;
          }
          box[k] = v;
        }
      });
    });
  }
  function shown(s) {
    return s.prone ? (s.crawling ? 'crawl' : 'prone') : s.crouching ? 'crouch' : 'stand';
  }
  function bump(map, k) {
    map[k] = (map[k] || 0) + 1;
  }
  (root.BattleProbes = root.BattleProbes || {})['stance-churn'] = {
    every: 0,
    start: function (sim) {
      /* engagement.js AIM_SETTLE / PRONE_HOLD; `tuning` does not export them today. */
      var T = (root.BattleEngagement && root.BattleEngagement.tuning) || {};
      c = {
        AIM_SETTLE: T.AIM_SETTLE || 0.4, PRONE_HOLD: T.PRONE_HOLD || 5.5,
        manSeconds: 0, changes: 0, byWriter: {}, byTransition: {}, flagFlips: {},
        bounces: 0, bouncesByWriter: {}, pulls: 0, pullsMidChange: 0, midChangeByWriter: {},
        proneEpisodes: 0, shortProne: 0, shortProneEndedBy: {}, committedChanges: 0, examples: []
      };
      men = new Map();
      var last = sim.time;
      c._lastT = last;
      var old = sim.onFire;
      sim.onFire = function (s, delay) {
        if (old) old.apply(sim, arguments);
        if (delay || !s) return;
        c.pulls++;
        var m = men.get(s);
        if (m && m.changes.length) {
          var ch = m.changes[m.changes.length - 1];
          if (sim.time - ch.t < c.AIM_SETTLE) {
            c.pullsMidChange++;
            bump(c.midChangeByWriter, ch.writer);
          }
        }
      };
    },
    sample: function (sim) {
      var dt = Math.max(0, sim.time - c._lastT);
      c._lastT = sim.time;
      var units = root.BattleModules.unitsFor(sim);
      for (var i = 0; i < units.length; i++) {
        var s = units[i];
        if (!s || s.dead || !s.root) continue;
        watch(s);
        c.manSeconds += dt;
        var now = shown(s),
          m = men.get(s),
          committed = s.eng && s.eng.stance;
        if (!m) {
          men.set(s, { stance: now, committed: committed, changes: [], proneAt: now === 'prone' || now === 'crawl' ? sim.time : null });
          continue;
        }
        if (committed !== m.committed) {
          if (m.committed != null) c.committedChanges++;
          m.committed = committed;
        }
        if (now === m.stance) continue;
        var w = s.__stanceProbe.lastWriter || 'unknown',
          down = function (x) { return x === 'prone' || x === 'crawl'; };
        c.changes++;
        bump(c.byWriter, w);
        bump(c.byTransition, m.stance + '->' + now);
        m.changes.push({ t: sim.time, from: m.stance, to: now, writer: w });
        if (m.changes.length > 3) m.changes.shift();
        var n = m.changes.length;
        if (n >= 2) {
          var a = m.changes[n - 2], b = m.changes[n - 1];
          if (a.from === b.to && b.t - a.t < 1) {
            c.bounces++;
            bump(c.bouncesByWriter, a.writer + ' then ' + b.writer);
            if (c.examples.length < 20)
              c.examples.push({ t: +sim.time.toFixed(2), soldier: s.id, role: s.role, eng: (s.eng && s.eng.state) || null,
                bounce: a.from + '->' + a.to + '->' + b.to, writers: [a.writer, b.writer], seconds: +(b.t - a.t).toFixed(2) });
          }
        }
        if (!down(m.stance) && down(now)) m.proneAt = sim.time;
        else if (down(m.stance) && !down(now) && m.proneAt != null) {
          c.proneEpisodes++;
          if (sim.time - m.proneAt < c.PRONE_HOLD) {
            c.shortProne++;
            bump(c.shortProneEndedBy, w);
          }
          m.proneAt = null;
        }
        m.stance = now;
      }
    },
    report: function () {
      var mm = c.manSeconds / 60;
      return {
        manMinutes: +mm.toFixed(1),
        changes: c.changes,
        changesPerManMinute: mm ? +(c.changes / mm).toFixed(2) : 0,
        committedChangesPerManMinute: mm ? +(c.committedChanges / mm).toFixed(2) : 0,
        byWriter: c.byWriter,
        byTransition: c.byTransition,
        flagFlips: c.flagFlips,
        bouncesUnder1s: c.bounces,
        bouncesByWriter: c.bouncesByWriter,
        triggerPulls: c.pulls,
        pullsWithinAimSettle: c.pullsMidChange,
        midChangeByWriter: c.midChangeByWriter,
        proneEpisodes: c.proneEpisodes,
        proneShorterThanHold: c.shortProne,
        shortProneEndedBy: c.shortProneEndedBy,
        examples: c.examples
      };
    }
  };
})(window);
