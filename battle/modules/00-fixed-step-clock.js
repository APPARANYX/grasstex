/* Keep live 1x / 4x / 8x battles on the same 0.15s timeline as replay.
   Slow frames accumulate debt instead of discarding simulation seconds.
   ?fixedClock=0 opts out for a controlled live A/B; benchmarks calling sim.step()
   explicitly retain their established fixed-step behavior. */
(function (root) {
  'use strict';
  if (!root.BattleSim || root.BattleFixedStepClock) return;

  var STEP = root.BattleSim.AI_TICK || 0.15;
  var MAX_STEPS_PER_FRAME = 12;
  var EPS = 1e-9;

  function create(sim) {
    var debt = 0;
    var stats = {
      stepSeconds: STEP,
      stepLimit: MAX_STEPS_PER_FRAME,
      pendingSeconds: 0,
      lastSteps: 0,
      backloggedFrames: 0,
      totalSteps: 0
    };

    function reset() {
      debt = 0;
      stats.pendingSeconds = 0;
      stats.lastSteps = 0;
      stats.backloggedFrames = 0;
      stats.totalSteps = 0;
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

    return { advance: advance, reset: reset, stats: stats };
  }

  var oldStart = root.BattleSim.start;
  root.BattleSim.start = function (scene, opts) {
    var sim = oldStart(scene, opts);
    if (typeof location !== 'undefined' && /[?&]fixedClock=0(?:&|$)/.test(location.search || '')) {
      return sim;
    }

    var clock = create(sim);
    var oldObserver = sim._renderObserver;
    if (oldObserver) scene.onBeforeRenderObservable.remove(oldObserver);
    sim._fixedClockInstalled = true;
    sim._fixedClock = clock;
    sim._renderObserver = scene.onBeforeRenderObservable.add(function () {
      clock.advance(scene.getEngine().getDeltaTime() / 1000);
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
    create: create
  };
})(typeof window !== 'undefined' ? window : globalThis);
