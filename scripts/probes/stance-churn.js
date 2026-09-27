/* Measure visible stance churn in full battles and attribute the writes that caused it.
   Tracks prone/crawl/crouch/stand changes per man-minute, rounds fired within Engagement's
   AIM_SETTLE (0.4 s) after a stance change, and completed prone spells shorter than PRONE_HOLD
   (5.5 s). Property setters only observe changed values and preserve them verbatim; run with
   PROBE_CONTROL=1 to prove the instrumented battle fingerprints the same as its control. */
(function (root) {
  'use strict';
  var AIM_SETTLE = 0.4,
    PRONE_HOLD = 5.5,
    state,
    pendingWriter,
    writeStats,
    transitions,
    shortProne,
    settleFire,
    manMinutes,
    lastSampleAt,
    examples;

  function key(s) {
    return String((s && s.faction) || '?') + ':' + String((s && s.id) || '?');
  }
  function units(sim) {
    return root.BattleModules && root.BattleModules.unitsFor ? root.BattleModules.unitsFor(sim) :
      ((sim._roster && sim._roster.us) || []).concat((sim._roster && sim._roster.ge) || []);
  }
  function stanceOf(s) {
    if (s.prone && s.crawling) return 'crawl';
    if (s.prone) return 'prone';
    if (s.crouching || s.tacticalCrouch) return 'crouch';
    return 'stand';
  }
  function writerFromStack(stack) {
    stack = String(stack || '');
    if (/44-combat-urgency\.js/.test(stack)) return 'combat-urgency';
    if (/12-soldier-animation-events\.js/.test(stack)) return 'reload-hook';
    if (/engagement\.js/.test(stack)) return 'engagement';
    if (/stepMovement|battle-sim\.js/.test(stack)) return 'stepMovement';
    var m = stack.match(/(?:battle\/|battle%2F)([^\s/:?]+\.js)/i);
    return m ? 'other:' + m[1] : 'other:unknown';
  }
  function writeBucket(writer) {
    writer = String(writer || 'unknown');
    return writeStats[writer] || (writeStats[writer] = { total: 0, prone: 0, crawling: 0, tacticalCrouch: 0, crouching: 0 });
  }
  function instrument(s) {
    if (!s || s.__stanceChurnProbe) return;
    try { Object.defineProperty(s, '__stanceChurnProbe', { value: true, configurable: true, enumerable: false }); }
    catch (_) { s.__stanceChurnProbe = true; }
    ['prone', 'crawling', 'tacticalCrouch', 'crouching'].forEach(function (field) {
      var desc;
      try { desc = Object.getOwnPropertyDescriptor(s, field); } catch (_) {}
      if (desc && desc.configurable === false) return;
      var value = s[field], enumerable = !desc || desc.enumerable !== false;
      try {
        Object.defineProperty(s, field, {
          enumerable: enumerable,
          configurable: true,
          get: function () { return value; },
          set: function (next) {
            if (next !== value) {
              var writer = writerFromStack((new Error()).stack), b = writeBucket(writer);
              b.total++; b[field]++;
              pendingWriter[key(s)] = writer;
            }
            value = next;
          }
        });
      } catch (_) {}
    });
    var k = key(s), st = stanceOf(s);
    if (!state[k]) state[k] = { stance: st, lastChangeAt: -999, proneSince: st === 'prone' || st === 'crawl' ? 0 : null };
  }
  function transitionBucket(writer) {
    writer = String(writer || 'unknown');
    return transitions[writer] || (transitions[writer] = { changes: 0 });
  }

  (root.BattleProbes = root.BattleProbes || {})['stance-churn'] = {
    every: 0,
    start: function (sim) {
      state = Object.create(null);
      pendingWriter = Object.create(null);
      writeStats = Object.create(null);
      transitions = Object.create(null);
      shortProne = 0;
      settleFire = 0;
      manMinutes = 0;
      lastSampleAt = +sim.time || 0;
      examples = [];
      units(sim).forEach(instrument);
      var oldFire = sim.onFire;
      sim.onFire = function (s) {
        if (typeof oldFire === 'function') oldFire.apply(this, arguments);
        if (!s) return;
        var st = state[key(s)], now = +sim.time || 0;
        if (st && now - st.lastChangeAt >= -1e-6 && now - st.lastChangeAt < AIM_SETTLE - 1e-6) {
          settleFire++;
          if (examples.length < 100) examples.push({ type: 'fire-before-settle', t: +now.toFixed(2), soldier: key(s), stance: st.stance, sinceChange: +(now - st.lastChangeAt).toFixed(3) });
        }
      };
    },
    sample: function (sim) {
      var now = +sim.time || 0,
        a = units(sim),
        alive = 0,
        dt = Math.max(0, now - lastSampleAt);
      for (var i = 0; i < a.length; i++) {
        var s = a[i];
        if (!s) continue;
        instrument(s);
        if (!s.dead) alive++;
        var k = key(s), st = state[k], next = stanceOf(s);
        if (!st) { state[k] = { stance: next, lastChangeAt: -999, proneSince: next === 'prone' || next === 'crawl' ? now : null }; continue; }
        if (next !== st.stance) {
          var writer = pendingWriter[k] || 'unknown',
            wasProne = st.stance === 'prone' || st.stance === 'crawl',
            isProne = next === 'prone' || next === 'crawl';
          transitionBucket(writer).changes++;
          if (wasProne && !isProne && st.proneSince != null) {
            var duration = now - st.proneSince;
            if (duration < PRONE_HOLD - 1e-6) {
              shortProne++;
              if (examples.length < 100) examples.push({ type: 'short-prone', t: +now.toFixed(2), soldier: k, seconds: +duration.toFixed(2), writer: writer });
            }
          }
          if (!wasProne && isProne) st.proneSince = now;
          else if (!isProne) st.proneSince = null;
          if (examples.length < 100) examples.push({ type: 'stance-change', t: +now.toFixed(2), soldier: k, from: st.stance, to: next, writer: writer });
          st.stance = next;
          st.lastChangeAt = now;
          pendingWriter[k] = null;
        }
      }
      manMinutes += alive * dt / 60;
      lastSampleAt = now;
    },
    report: function () {
      var totalChanges = Object.keys(transitions).reduce(function (n, w) { return n + transitions[w].changes; }, 0),
        byWriter = Object.keys(transitions).map(function (w) { return { writer: w, changes: transitions[w].changes }; }).sort(function (a, b) { return b.changes - a.changes; }),
        directWrites = Object.keys(writeStats).map(function (w) { return Object.assign({ writer: w }, writeStats[w]); }).sort(function (a, b) { return b.total - a.total; });
      return {
        aimSettleSeconds: AIM_SETTLE,
        proneHoldSeconds: PRONE_HOLD,
        manMinutes: +manMinutes.toFixed(2),
        stanceChanges: totalChanges,
        stanceChangesPerManMinute: manMinutes ? +(totalChanges / manMinutes).toFixed(3) : 0,
        roundsFiredBeforeAimSettle: settleFire,
        shortProneSpells: shortProne,
        changesByWriter: byWriter,
        directFieldWritesByWriter: directWrites,
        examples: examples
      };
    }
  };
})(window);
