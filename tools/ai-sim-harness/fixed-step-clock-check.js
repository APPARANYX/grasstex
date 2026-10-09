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
    commands: 0,
    commandDebt: 0,
    events: [],
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
observers[0]();
assert.equal(attached.steps, 1);
attached.restart();
assert.equal(attached._fixedClock.stats.pendingSeconds, 0, 'restart clears accumulated time');
assert.equal(attached._fixedClock.stats.totalSteps, 0);

console.log(
  'Fixed-step clock: 1x/4x/8x parity across 20/30/60/120fps, ordered commander ticks, catch-up, pause, restart, and speed switching PASS'
);
