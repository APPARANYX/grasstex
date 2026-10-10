#!/usr/bin/env node
'use strict';

/* R2 touch camera has a single owner across gamepad event/poll wake, stop and restarts. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../../battle/camera-controls.js'), 'utf8');
function part(open, close) {
  const start = src.indexOf(open),
    end = src.indexOf(close, start);
  assert.ok(start >= 0 && end > start, 'missing controller boundary ' + open);
  return src.slice(start, end);
}
const source =
  part('  function createTouchOrbit(', '  function shapedAxis(') +
  part('  function createAdaptive(', '  global.BattleDesktopCamera =');
const events = {};
const actions = [];
let active = null;
let desktopCalls = 0;
const global = {
  GTLog() {},
  addEventListener(type, handler) {
    (events[type] || (events[type] = new Set())).add(handler);
    actions.push('listen:' + type);
  },
  removeEventListener(type, handler) {
    assert.ok(events[type]?.delete(handler), 'unexpected listener cleanup');
    actions.push('unlisten:' + type);
  }
};
const document = {
  getElementById() {
    return { textContent: '' };
  }
};
const BABYLON = {
  ArcRotateCamera: function (name, alpha, beta, radius, target, scene) {
    this.name = name;
    this.position = { clone: () => ({ x: 1, y: 2, z: 3 }) };
    this.attachControl = () => actions.push('attach-touch');
    this.detachControl = () => actions.push('detach-touch');
    this.dispose = () => {
      if (this.disposed) throw new Error('touch disposed twice');
      this.disposed = true;
      actions.push('dispose-touch');
    };
    scene.activeCamera = this;
  }
};
const cameraPose = () => ({ position: { x: 0, y: 3, z: 0 }, target: { x: 0, y: 0, z: 0 } });
const createDesktopFly = (scene, canvas, target, engine, battleSim, pose) => {
  desktopCalls++;
  const camera = { name: 'desktop', disposed: false };
  scene.activeCamera = camera;
  let stopped = false;
  return {
    camera,
    desktop: true,
    hint: 'desktop',
    stop() {
      if (stopped) return;
      stopped = true;
      camera.disposed = true;
      actions.push('stop-desktop');
    }
  };
};
const controller = new Function(
  'BABYLON',
  'global',
  'document',
  'queryParams',
  'activeGamepad',
  'desktopPointer',
  'hasGamepadAPI',
  'createDesktopFly',
  'cameraPose',
  'TOUCH_HINT',
  'PAD_WAKE_HINT',
  source + '\nreturn {createAdaptive, createTouchOrbit};'
)(
  BABYLON,
  global,
  document,
  () => ({ get: () => null }),
  () => active,
  () => false,
  () => true,
  createDesktopFly,
  cameraPose,
  'touch',
  'wake'
);
function makeScene() {
  const observers = new Set();
  return {
    observers,
    onBeforeRenderObservable: {
      add(callback) {
        const observer = { callback };
        observers.add(observer);
        actions.push('add-observer');
        return observer;
      },
      remove(observer) {
        assert.ok(observers.delete(observer), 'unexpected observer removal');
        actions.push('remove-observer');
      }
    }
  };
}
function makeOptions(scene) {
  return { scene, canvas: {}, engine: {}, battleSim: {} };
}
function emit(type, gamepad) {
  for (const listener of [...(events[type] || [])]) listener({ gamepad });
}
const target = { x: 1, y: 2, z: 3 };
const scene = makeScene();
let state = controller.createAdaptive(makeOptions(scene), target);
const oldTouch = state.camera;
assert.equal(state.desktop, false);
assert.equal(scene.observers.size, 1);
assert.equal(events.gamepadconnected.size, 1);
emit('gamepadconnected', { id: 'stale', connected: false });
assert.equal(state.desktop, false, 'disconnected event cannot wake touch mode');
assert.equal(oldTouch.disposed, undefined);
emit('gamepadconnected', { id: 'event-first', connected: true });
assert.equal(state.desktop, true, 'event-first WebKit wake must succeed before Gamepad API sees pad');
assert.equal(oldTouch.disposed, true);
assert.equal(desktopCalls, 1);
assert.equal(scene.observers.size, 0);
assert.equal(events.gamepadconnected.size, 0, 'wake listener is one-shot');
state.stop();
state.stop();
assert.equal(state.camera.disposed, true);
assert.equal(actions.filter(x => x === 'dispose-touch').length, 1);
assert.equal(actions.filter(x => x === 'stop-desktop').length, 1);

const pollScene = makeScene();
active = null;
state = controller.createAdaptive(makeOptions(pollScene), target);
assert.equal(state.desktop, false);
assert.equal(pollScene.observers.size, 1);
active = { id: 'poll-only', connected: true };
[...pollScene.observers][0].callback();
assert.equal(state.desktop, true, 'poll-only iOS visibility should wake touch mode');
assert.equal(pollScene.observers.size, 0);
assert.equal(events.gamepadconnected.size, 0);
state.stop();
state.stop();
assert.equal(actions.filter(x => x === 'dispose-touch').length, 2);
assert.equal(actions.filter(x => x === 'stop-desktop').length, 2);

active = null;
const shutdownScene = makeScene();
state = controller.createAdaptive(makeOptions(shutdownScene), target);
state.stop();
state.stop();
assert.equal(shutdownScene.observers.size, 0);
assert.equal(events.gamepadconnected.size, 0);
const count = desktopCalls;
emit('gamepadconnected', { id: 'late', connected: true });
assert.equal(desktopCalls, count, 'stopped controller cannot be resurrected');
assert.equal(actions.filter(x => x === 'dispose-touch').length, 3);
assert.match(
  src,
  /menuHoldState\.down = false;[\s\S]{0,90}menuHoldState\.long = false;[\s\S]{0,90}menuHoldState\.since = 0;/
);
console.log(
  'PASS #456 R2 touch owner event-first/poll wake, stale-pad denial, listener/observer release, idempotent stop'
);
