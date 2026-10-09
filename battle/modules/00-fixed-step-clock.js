/* Keep live 4x / 8x battles on the same 0.15s timeline as replay.
   Slow frames accumulate debt instead of discarding simulation seconds.
   Real-time (<=1x) playback keeps the original per-frame variable step: movement
   is written every rendered frame, so it looks smooth instead of stair-stepping at
   0.15s. ?fixedClock=all forces the fixed step at every speed (parity diagnostics),
   ?fixedClock=0 opts out entirely for a controlled live A/B; benchmarks calling
   sim.step() or clock.advance() explicitly retain their established fixed-step behavior. */
(function (root) {
  'use strict';
  if (!root.BattleSim || root.BattleFixedStepClock) return;

  var STEP = root.BattleSim.AI_TICK || 0.15;
  var MAX_STEPS_PER_FRAME = 12;
  var REALTIME_SCALE = 1;
  var MAX_FRAME_DT = 0.25;
  var EPS = 1e-9;

  function create(sim, options) {
    var debt = 0;
    var stats = {
      stepSeconds: STEP,
      stepLimit: MAX_STEPS_PER_FRAME,
      pendingSeconds: 0,
      lastSteps: 0,
      backloggedFrames: 0,
      totalSteps: 0,
      smoothFrames: 0
    };
    var clock = {
      advance: advance,
      frame: frame,
      reset: reset,
      stats: stats,
      /* true: run the fixed step even at <=1x (timescale parity diagnostics). */
      fixedAtRealtime: !!(options && options.fixedAtRealtime)
    };

    function reset() {
      debt = 0;
      stats.pendingSeconds = 0;
      stats.lastSteps = 0;
      stats.backloggedFrames = 0;
      stats.totalSteps = 0;
      stats.smoothFrames = 0;
    }

    function advance(wallSeconds) {
      stats.lastSteps = 0;
      if (sim.paused || sim.winner || sim._trainerStepActive) return 0;
      var elapsed = +wallSeconds;
      var scale = +sim.timeScale;
      if (!isFinite(elapsed) || elapsed <= 0 || !isFinite(scale) || scale <= 0) return 0;

      debt += elapsed * scale;
      var steps = 0;
      while (debt + EPS >= STEP && steps < MAX_STEPS_PER_FRAME && !sim.winner) {
        debt -= STEP;
        sim.step(STEP);
        steps++;
        if (!sim.winner && typeof sim._liveCommanderTick === 'function') {
          sim._liveCommanderTick(STEP);
        }
      }
      if (sim.winner) debt = 0;
      debt = Math.max(0, debt);
      stats.lastSteps = steps;
      stats.totalSteps += steps;
      stats.pendingSeconds = debt;
      if (debt + EPS >= STEP) stats.backloggedFrames++;
      return steps;
    }

    /* Live render-frame entry. <=1x advances the sim by this frame's own scaled
       delta (the original observer pair: sim._frame, then the commander tick).
       Faster speeds, and any backlog still left from a faster speed, go through the
       fixed step so no simulation seconds are dropped when the player changes speed;
       the sub-step remainder is folded into the first smooth frame. */
    function frame(wallSeconds) {
      var scale = +sim.timeScale;
      var smooth =
        !clock.fixedAtRealtime &&
        isFinite(scale) &&
        scale > 0 &&
        scale <= REALTIME_SCALE + EPS &&
        debt + EPS < STEP &&
        typeof sim._frame === 'function';
      if (!smooth) return advance(wallSeconds);

      stats.lastSteps = 0;
      if (sim.paused || sim.winner || sim._trainerStepActive) return 0;
      var elapsed = +wallSeconds;
      if (!isFinite(elapsed) || elapsed <= 0) return 0;

      var dt = Math.min(MAX_FRAME_DT, debt + elapsed * scale);
      debt = 0;
      stats.pendingSeconds = 0;
      sim._frame(dt);
      if (!sim.winner && typeof sim._liveCommanderTick === 'function') {
        sim._liveCommanderTick(dt);
      }
      stats.smoothFrames++;
      return 0;
    }

    return clock;
  }

  var oldStart = root.BattleSim.start;
  root.BattleSim.start = function (scene, opts) {
    var sim = oldStart(scene, opts);
    var search = (typeof location !== 'undefined' && location.search) || '';
    if (/[?&]fixedClock=0(?:&|$)/.test(search)) return sim;

    var clock = create(sim, { fixedAtRealtime: /[?&]fixedClock=all(?:&|$)/.test(search) });
    var oldObserver = sim._renderObserver;
    if (oldObserver) scene.onBeforeRenderObservable.remove(oldObserver);
    sim._fixedClockInstalled = true;
    sim._fixedClock = clock;
    sim._renderObserver = scene.onBeforeRenderObservable.add(function () {
      clock.frame(scene.getEngine().getDeltaTime() / 1000);
    });

    var oldRestart = sim.restart;
    sim.restart = function () {
      clock.reset();
      return oldRestart.apply(this, arguments);
    };
    return sim;
  };

  root.BattleFixedStepClock = {
    stepSeconds: STEP,
    maxStepsPerFrame: MAX_STEPS_PER_FRAME,
    realtimeScale: REALTIME_SCALE,
    create: create
  };
})(typeof window !== 'undefined' ? window : globalThis);
