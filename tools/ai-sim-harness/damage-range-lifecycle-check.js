#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname, '../../battle/modules/', name), 'utf8');
function observable() {
  const callbacks = new Set();
  return {
    callbacks,
    add(fn) {
      callbacks.add(fn);
      return fn;
    },
    remove(fn) {
      callbacks.delete(fn);
    },
    emit() {
      for (const f of [...callbacks]) f();
    }
  };
}
function target() {
  const events = new Map();
  return {
    events,
    addEventListener(type, fn) {
      if (!events.has(type)) events.set(type, new Set());
      events.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      events.get(type).delete(fn);
    },
    emit(type, data) {
      for (const fn of [...(events.get(type) || [])]) fn(data);
    },
    setPointerCapture() {},
    releasePointerCapture(id) {
      this.released = id;
    }
  };
}
const scheduled = new Map(),
  cancelled = [];
let id = 0;
const root = {
  console,
  Set,
  setTimeout(fn) {
    scheduled.set(++id, fn);
    return id;
  },
  clearTimeout(i) {
    cancelled.push(i);
  },
  setInterval(fn) {
    scheduled.set(++id, fn);
    return id;
  },
  clearInterval(i) {
    cancelled.push(i);
  },
  navigator: { getGamepads: () => [] },
  GTLog() {}
};
vm.createContext(root);
vm.runInContext(read('97z-damage-range-lifetime.js'), root);
const scene = {
  onDisposeObservable: observable(),
  onBeforeRenderObservable: observable(),
  isDisposed: false
};
const life = root.BattleDamageRangeLifetime.create(scene),
  canvas = target();
let calls = 0;
const order = [];
life.listen(canvas, 'test', () => calls++);
const stale = [...canvas.events.get('test')][0];
life.observe(scene.onBeforeRenderObservable, () => calls++);
const timeout = life.timeout(() => calls++, 10),
  interval = life.interval(() => calls++, 10);
life.own(() => order.push(1));
life.own(() => order.push(2));
canvas.emit('test', {});
scene.onBeforeRenderObservable.emit();
assert.equal(calls, 2);
scene.onDisposeObservable.emit();
life.dispose();
assert.deepEqual(order, [2, 1]);
assert.equal(canvas.events.get('test').size, 0);
assert.equal(scene.onBeforeRenderObservable.callbacks.size, 0);
assert.equal(scene.onDisposeObservable.callbacks.size, 0);
stale({});
scheduled.get(timeout)();
scheduled.get(interval)();
assert.equal(calls, 2, 'already-queued callbacks become inert');
assert.ok(cancelled.includes(timeout) && cancelled.includes(interval));
assert.equal(
  life.timeout(() => {}, 1),
  null
);
assert.equal(
  life.interval(() => {}, 1),
  null
);
life.own(() => order.push(3));
assert.deepEqual(order, [2, 1, 3], 'late ownership is immediately released');
class V {
  constructor(x = 0, y = 0, z = 0) {
    Object.assign(this, { x, y, z });
  }
  copyFrom(v) {
    Object.assign(this, v);
  }
  set(x, y, z) {
    Object.assign(this, { x, y, z });
  }
}
class Camera {
  constructor(name, ...args) {
    this.name = name;
    this.rotation = new V();
    this.position = new V();
    this.inputs = { clear() {} };
    if (name === 'damageRangeCam') {
      [this.alpha, this.beta, this.radius, this.target] = args;
    } else this.position = args[0];
  }
  attachControl() {
    this.attached = true;
  }
  detachControl() {
    this.attached = false;
  }
  setTarget() {
    this.rotation.x = -0.02;
    this.rotation.y = 0.03;
  }
  dispose() {
    this.disposed = true;
  }
}
root.BABYLON = { Vector3: V, ArcRotateCamera: Camera, UniversalCamera: Camera };
root.document = { getElementById: () => ({ style: {} }) };
vm.runInContext(read('97z-damage-range-view.js'), root);
const source = read('98-damage-range.js'),
  a = source.indexOf('  function shapedAxis'),
  b = source.indexOf('  function setup', a);
const input = new Function(
  "var ZONES=['head','chest','abdomen','arm','leg'];" +
    source.slice(a, b) +
    'return {shapedAxis,buttonValue,rangePadCommands};'
)();
function makeView() {
  const scene = {
      onDisposeObservable: observable(),
      activeCamera: new Camera('original'),
      isDisposed: false
    },
    life = root.BattleDamageRangeLifetime.create(scene),
    canvas = target();
  let fps = false;
  const soldier = { root: { position: new V(3, 40, 0) } };
  const actions = [];
  const view = root.BattleDamageRangeView.create({
    scene,
    canvas,
    life,
    targets: [soldier],
    shooter: soldier,
    baseY: 40,
    rowZ: 0,
    shooterZ: -8,
    center: { x: 3 },
    rangeIndex: 0,
    distance: 5.4,
    selected: () => soldier,
    zone: () => 'chest',
    zonePoint: () => ({ x: 3, y: 41.34, z: 0 }),
    clamp: (v, a, b) => Math.max(a, Math.min(v, b)),
    ...input,
    isFps: () => fps,
    setFpsState: on => (fps = on),
    updateUi() {},
    applyRangeAction: a => actions.push(a)
  });
  return { scene, life, canvas, view, actions };
}
const A = makeView(),
  B = makeView();
A.view.setFps(true);
assert.equal(A.scene.activeCamera, A.view.fpsCamera);
const event = (pointerId, x, y) => ({ pointerId, clientX: x, clientY: y, preventDefault() {} });
A.canvas.emit('pointerdown', event(7, 10, 20));
A.canvas.emit('pointermove', event(8, 110, 120));
assert.equal(A.view.fpsCamera.rotation.y, 0.03);
A.canvas.emit('pointermove', event(7, 110, 120));
assert.ok(Math.abs(A.view.fpsCamera.rotation.y - 0.35) < 1e-12);
assert.ok(Math.abs(A.view.fpsCamera.rotation.x - 0.25) < 1e-12);
A.canvas.emit('pointermove', event(7, 110, 10000));
assert.equal(A.view.fpsCamera.rotation.x, 1.32);
A.canvas.emit('pointercancel', event(7, 0, 0));
A.canvas.emit('pointermove', event(7, 210, 11000));
assert.equal(A.view.fpsCamera.rotation.y, 0.35);
assert.equal(A.canvas.released, 7);
A.canvas.emit('wheel', { deltaY: 10000, preventDefault() {} });
assert.equal(A.view.fpsCamera.fov, 1.12);
A.canvas.emit('wheel', { deltaY: -10000, preventDefault() {} });
assert.equal(A.view.fpsCamera.fov, 0.52);
A.canvas.emit('pointerdown', event(9, 0, 0));
A.view.setFps(false);
A.view.setFps(true);
A.canvas.emit('pointermove', event(9, 100, 100));
assert.equal(A.view.fpsCamera.rotation.y, 0.03, 'mode handoff releases old drag');
function pad(...pressed) {
  return {
    id: 'xbox',
    mapping: 'standard',
    connected: true,
    axes: [0, 0, 1, 1],
    buttons: Array.from({ length: 17 }, (_, i) => ({
      pressed: pressed.includes(i),
      value: pressed.includes(i) ? 1 : 0
    }))
  };
}
root.navigator.getGamepads = () => [pad(0, 7, 6)];
A.view.stepGamepad(0.05);
assert.deepEqual(A.actions, ['fire', 'fire']);
assert.ok(Math.abs(A.view.fpsCamera.fov - 0.62) < 1e-12);
A.view.stepGamepad(0.05);
assert.equal(A.actions.length, 2, 'held RT/A do not repeat');
root.navigator.getGamepads = () => [];
A.view.stepGamepad(0.05);
root.navigator.getGamepads = () => [pad(7)];
A.view.stepGamepad(0.05);
assert.equal(A.actions.length, 3, 'disconnect releases edge state');
assert.equal(B.view.camera.alpha, -Math.PI / 2, 'view scratch is per session');
A.life.dispose();
assert.ok(A.view.camera.disposed && A.view.fpsCamera.disposed);
assert.equal(A.scene.activeCamera.name, 'original');
assert.equal(A.canvas.events.get('pointerdown').size, 0);
B.life.dispose();
console.log(
  'PASS #456 R5 queued-work cancellation, idempotent teardown, private camera state, pointer leases, angle/FOV clamps and Xbox edge lifecycle'
);
