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
      // Model the actual BattleSim observer and the separate Commander observer.
      sim._renderObserver = scene.onBeforeRenderObservable.add(() =>
        sim._frame(Math.min(0.25, scene.getEngine().getDeltaTime() / 1000 * sim.timeScale))
      );
      scene.onBeforeRenderObservable.add(() => {
        if (!sim._fixedClockInstalled && !sim.paused && !sim.winner && !sim._trainerStepActive)
          sim._liveCommanderTick(Math.min(0.25, scene.getEngine().getDeltaTime() / 1000 * sim.timeScale));
      });
      return sim;
    }
  }
};
const fakeLocation = { search: '' };
new Function('window', 'globalThis', 'location', source)(root, root, fakeLocation);
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

/* Explicit benchmark frame drives still use the deterministic clock at all speeds. */
for (const speed of [1, 4, 8]) {
  const replaySim = makeSim();
  replaySim.timeScale = speed;
  const clock = Clock.create(replaySim);
  for (let i = 0; i < 60; i++) clock.frame((18 / speed) / 60);
  assert.equal(replaySim.steps, 120, speed + 'x: explicit frame() uses benchmark steps');
  assert.equal(replaySim.smoothDts.length, 0, speed + 'x: no variable step in benchmark clock');
  assert.deepEqual(replaySim.events, standard.sim.events, speed + 'x: fixed call order');
}

/* Preserve the shipping legacy observer and its commander hook at ALL live speeds.
   In particular the clock must remain dormant at 4x/8x even on slow frames. */
function makeScene() {
  const observers = [];
  const engine = { getDeltaTime: () => 150 };
  return {
    observers, engine,
    onBeforeRenderObservable: {
      add(fn) { observers.push(fn); return fn; },
      remove(fn) {
        const i = observers.indexOf(fn);
        if (i >= 0) observers.splice(i, 1);
      }
    },
    getEngine() { return engine; },
    render() { observers.slice().forEach(fn => fn()); }
  };
}
function liveSample(search) {
  fakeLocation.search = search;
  const scene = makeScene();
  const sim = root.BattleSim.start(scene);
  for (const speed of [1, 4, 8]) {
    sim.timeScale = speed;
    scene.engine.getDeltaTime = () => 150;
    scene.render(); // all speeds clamp to the legacy 0.25 sim-second frame
  }
  return {sim, scene};
}

const live = liveSample('');
const legacy = liveSample('?fixedClock=0');
assert.equal(live.scene.observers.length, 2, 'the core and commander original observers are left intact');
assert.equal(live.sim._fixedClockInstalled, undefined, 'no fixed render observer in ordinary live play');
assert.ok(live.sim._fixedClock, 'benchmark clock remains available without being installed');
assert.equal(live.sim.steps, 0, 'default live never drives fixed steps');
assert.deepEqual(live.sim.smoothDts, [0.15, 0.25, 0.25], '1x/4x/8x use legacy frame deltas');
assert.deepEqual(live.sim.smoothDts, legacy.sim.smoothDts, 'default and ?fixedClock=0 match exactly');
assert.deepEqual(live.sim.events, legacy.sim.events, 'default and old live observer order match exactly');
assert.equal(live.sim.commands, legacy.sim.commands, 'default and old commander cadence match');
assert.equal(live.sim._fixedClock.stats.totalSteps, 0, 'dormant clock consumed no live cycles');

const forced = liveSample('?fixedClock=all');
assert.equal(forced.sim._fixedClockInstalled, true, 'explicit parity mode replaces live observer');
assert.equal(forced.scene.observers.length, 2, 'forced mode has one fixed and one inert commander hook');
assert.equal(forced.sim.smoothDts.length, 0, 'forced mode never runs variable steps');
assert.equal(forced.sim.steps, 1 + 4 + 8, 'forced mode uses 0.15s ticks at 1x/4x/8x');
assert.equal(forced.sim._fixedClock.stats.totalSteps, 13);
forced.sim.restart();
assert.equal(forced.sim._fixedClock.stats.pendingSeconds, 0, 'forced restart resets debt');
assert.equal(forced.sim._fixedClock.stats.totalSteps, 0, 'forced restart resets counters');
fakeLocation.search = '';

console.log(
  'Fixed-step clock: explicit 0.15s parity across 1x/4x/8x and 20/30/60/120fps, retained debt and commander order, legacy live observers at every speed, and opt-in fixed parity PASS'
);
