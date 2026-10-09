'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../../battle/modules/00-fixed-step-clock.js'), 'utf8');
const root = {
  BattleSim: {
    AI_TICK: 0.15,
    start(scene) {
      const sim = makeSim();
      sim._renderObserver = scene.onBeforeRenderObservable.add(() => sim.step(0.15));
      return sim;
    }
  }
};
new Function('window', 'globalThis', source)(root, root);
const Clock = root.BattleFixedStepClock;
assert.equal(Clock.stepSeconds, 0.15);

function makeSim() {
  const sim = {
    paused: false,
    winner: null,
    timeScale: 1,
    time: 0,
    steps: 0,
    smoothDts: [],
    commands: 0,
    commandDebt: 0,
    events: [],
    _frame(dt) {
      assert.ok(dt > 0 && dt <= 0.25, 'legacy frame dt stays within the original 0.25s cap: ' + dt);
      this.smoothDts.push(dt);
      this.time += dt;
      this.events.push('f');
    },
    step(dt) {
      assert.equal(dt, 0.15);
      this.steps++;
      this.time += dt;
      this.events.push('s');
    },
    _liveCommanderTick(dt) {
      this.commandDebt += dt;
      while (this.commandDebt + 1e-9 >= 0.45) {
        this.commandDebt -= 0.45;
        this.commands++;
        this.events.push('c');
      }
    },
    restart() {
      this.time = 0;
      this.steps = 0;
      this.smoothDts = [];
      this.commands = 0;
      this.commandDebt = 0;
      this.events = [];
    }
  };
  return sim;
}

function replay(speed, fps, wallSeconds) {
  const sim = makeSim();
  sim.timeScale = speed;
  const clock = Clock.create(sim);
  const frames = Math.round(wallSeconds * fps);
  for (let i = 0; i < frames; i++) clock.advance(wallSeconds / frames);
  return { sim, clock };
}

const targetSimSeconds = 18;
const standard = replay(1, 60, targetSimSeconds);
assert.equal(standard.sim.steps, 120);
assert.equal(standard.sim.commands, 40);
for (const speed of [1, 4, 8]) {
  for (const fps of [20, 30, 60, 120]) {
    const run = replay(speed, fps, targetSimSeconds / speed);
    assert.equal(run.sim.steps, standard.sim.steps, speed + 'x @ ' + fps + 'fps: simulation ticks');
    assert.equal(run.sim.commands, standard.sim.commands, speed + 'x @ ' + fps + 'fps: command ticks');
    assert.deepEqual(run.sim.events, standard.sim.events, speed + 'x @ ' + fps + 'fps: call order');
    assert.ok(run.clock.stats.pendingSeconds < 1e-7, 'no hidden time debt');
  }
}

const stalled = makeSim();
stalled.timeScale = 8;
const slowClock = Clock.create(stalled);
assert.equal(slowClock.advance(3), Clock.maxStepsPerFrame, 'bounded work during a long frame');
assert.ok(slowClock.stats.pendingSeconds > 20, 'all excess simulation time retained');
for (let i = 0; i < 30; i++) slowClock.advance(1e-12);
assert.equal(stalled.steps, 160, 'all 24 seconds eventually simulated');
assert.ok(slowClock.stats.pendingSeconds < 1e-7);
assert.equal(stalled.commands, 53, 'commander ticks recover without being dropped');

const paused = makeSim();
const pauseClock = Clock.create(paused);
pauseClock.advance(0.1);
paused.paused = true;
pauseClock.advance(10);
assert.equal(paused.steps, 0);
paused.paused = false;
pauseClock.advance(0.05);
assert.equal(paused.steps, 1, 'a pause does not consume elapsed time');
pauseClock.reset();
assert.equal(pauseClock.stats.pendingSeconds, 0);

const switched = makeSim();
const switchClock = Clock.create(switched);
switchClock.advance(0.075);
switched.timeScale = 4;
switchClock.advance(0.01875);
assert.equal(switched.steps, 1, 'speed switch preserves fractional simulation time');

function drive(sim, clock, speed, fps, wallSeconds) {
  sim.timeScale = speed;
  const frames = Math.round(wallSeconds * fps);
  for (let i = 0; i < frames; i++) clock.frame(wallSeconds / frames);
}

/* Real-time playback keeps the original per-frame variable step. */
const smooth = makeSim();
const smoothClock = Clock.create(smooth);
drive(smooth, smoothClock, 1, 60, 2);
assert.equal(smooth.steps, 0, '1x never uses the 0.15s fixed step');
assert.equal(smooth.smoothDts.length, 120, '1x advances the sim every rendered frame');
assert.ok(
  smooth.smoothDts.every(dt => Math.abs(dt - 1 / 60) < 1e-9),
  '1x frame dt is the frame time, not 0.15s'
);
assert.equal(smooth.commands, 4, 'commander still ticks every 0.45 simulated seconds at 1x');
assert.equal(smoothClock.stats.smoothFrames, 120);
assert.equal(smoothClock.stats.pendingSeconds, 0);

const slowMo = makeSim();
drive(slowMo, Clock.create(slowMo), 0.5, 60, 2);
assert.equal(slowMo.steps, 0, 'slow motion is also per-frame');
assert.ok(Math.abs(slowMo.time - 1) < 1e-9, 'slow motion advances scaled time');

/* A long frame is capped like the original observer (no catch-up at 1x). */
const hitch = makeSim();
const hitchClock = Clock.create(hitch);
hitch.timeScale = 1;
hitchClock.frame(1);
assert.deepEqual(hitch.smoothDts, [0.25], 'a 1s hitch at 1x is capped to the legacy 0.25s');

/* Faster speeds stay on the fixed step, frame() and advance() agree exactly. */
for (const speed of [4, 8]) {
  const fast = makeSim();
  const fastClock = Clock.create(fast);
  drive(fast, fastClock, speed, 60, targetSimSeconds / speed);
  assert.equal(fast.steps, standard.sim.steps, speed + 'x frame(): simulation ticks');
  assert.equal(fast.smoothDts.length, 0, speed + 'x never uses per-frame stepping');
  assert.deepEqual(fast.events, standard.sim.events, speed + 'x frame(): call order');
}

/* Diagnostics can force the fixed step at 1x (timescale parity benchmark). */
const forced = makeSim();
const forcedClock = Clock.create(forced, { fixedAtRealtime: true });
drive(forced, forcedClock, 1, 60, targetSimSeconds);
assert.equal(forced.smoothDts.length, 0);
assert.deepEqual(forced.events, standard.sim.events, 'fixedAtRealtime reproduces the 1x fixed timeline');

/* Dropping from 8x to 1x drains the backlog first, then goes smooth with no time lost. */
const down = makeSim();
const downClock = Clock.create(down);
down.timeScale = 8;
downClock.frame(1); // 8 sim-seconds in one frame: 12 steps now, the rest left as debt
assert.equal(down.steps, Clock.maxStepsPerFrame);
const owed = downClock.stats.pendingSeconds;
assert.ok(owed > 5, 'backlog retained');
down.timeScale = 1;
let guard = 0;
while (downClock.stats.pendingSeconds >= Clock.stepSeconds - 1e-9 && guard++ < 1000) downClock.frame(1 / 60);
assert.equal(down.smoothDts.length, 0, 'backlog is drained on the fixed step, not smoothed over');
assert.ok(downClock.stats.pendingSeconds < Clock.stepSeconds);
const remainder = downClock.stats.pendingSeconds;
const timeBefore = down.time;
downClock.frame(1 / 60);
assert.equal(down.smoothDts.length, 1);
assert.ok(
  Math.abs(down.smoothDts[0] - (remainder + 1 / 60)) < 1e-9,
  'sub-step remainder is folded into the first smooth frame'
);
assert.equal(downClock.stats.pendingSeconds, 0);
assert.ok(Math.abs(down.time - timeBefore - down.smoothDts[0]) < 1e-9);

/* 1x -> 4x keeps working and pause/winner/trainer guards apply to smooth frames too. */
const up = makeSim();
const upClock = Clock.create(up);
drive(up, upClock, 1, 60, 1);
const smoothFramesAt1x = up.smoothDts.length;
drive(up, upClock, 4, 60, 3);
assert.equal(up.smoothDts.length, smoothFramesAt1x, 'no per-frame stepping after switching to 4x');
assert.ok(up.steps >= 79 && up.steps <= 80, '3s at 4x is ~12 sim-seconds of fixed steps: ' + up.steps);

const guarded = makeSim();
const guardedClock = Clock.create(guarded);
guarded.paused = true;
guardedClock.frame(1 / 60);
guarded.paused = false;
guarded.winner = 'us';
guardedClock.frame(1 / 60);
guarded.winner = null;
guarded._trainerStepActive = true;
guardedClock.frame(1 / 60);
assert.equal(guarded.smoothDts.length + guarded.steps, 0, 'paused/winner/trainer frames do nothing');

const observers = [];
const scene = {
  onBeforeRenderObservable: {
    add(fn) {
      observers.push(fn);
      return fn;
    },
    remove(fn) {
      const i = observers.indexOf(fn);
      if (i >= 0) observers.splice(i, 1);
    }
  },
  getEngine() {
    return { getDeltaTime: () => 150 };
  }
};
const attached = root.BattleSim.start(scene);
assert.equal(observers.length, 1, 'old variable-step render observer removed');
assert.equal(attached._fixedClockInstalled, true);
assert.equal(attached._fixedClock.fixedAtRealtime, false, 'live 1x is smooth by default');
observers[0]();
assert.equal(attached.steps, 0, 'live 1x does not use the fixed step');
assert.deepEqual(attached.smoothDts, [0.15], 'live 1x advances by the frame delta');
attached.timeScale = 4;
observers[0]();
assert.equal(attached.steps, 4, '600ms of simulated time at 4x is four fixed steps');
attached.restart();
assert.equal(attached._fixedClock.stats.pendingSeconds, 0, 'restart clears accumulated time');
assert.equal(attached._fixedClock.stats.totalSteps, 0);
assert.equal(attached._fixedClock.stats.smoothFrames, 0);

console.log(
  'Fixed-step clock: 1x/4x/8x parity across 20/30/60/120fps, smooth per-frame 1x live path, ordered commander ticks, catch-up, pause, restart, and speed switching PASS'
);
