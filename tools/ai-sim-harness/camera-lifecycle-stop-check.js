#!/usr/bin/env node
'use strict';

/* #456 R2: an idempotent stop is essential to same-page restart isolation.
   Listener ownership, menu timers, camera observers and transient UI must
   not survive when a new controller is created. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../battle/camera-controls.js'), 'utf8');
function region(start, end) {
  const a = source.indexOf(start);
  assert.ok(a > 0, 'missing ' + start);
  const b = source.indexOf(end, a + start.length);
  assert.ok(b > a, 'missing ' + end);
  return source.slice(a, b);
}
const listenSource = region('    function listen(', '    function guarded()');
const stopSource = region('    function stopDesktop() {', '    bindDesktopEvents();');
const registration = region('    function bindDesktopEvents() {', '    function stepFreeFly(');
assert.equal((registration.match(/listen\(/g) || []).length, 12, 'all 12 global/canvas listeners tracked');
assert.ok(!registration.includes('.addEventListener('), 'no unowned listeners in bindDesktopEvents');
assert.match(source, /frameObserver = scene\.onBeforeRenderObservable\.add\(stepDesktopFrame\)/);
assert.match(source, /stop: stopDesktop/, 'desktop returns stop method');
assert.match(source, /state\.stop = stopAdaptive/, 'adaptive wrapper must forward stop');
assert.match(source, /activeStop = next\.stop/, 'gamepad wake must switch to the active teardown');
assert.match(source, /previous && previous\.stop\) previous\.stop\(\)/, 'create must stop prior session');
const actions = [];
function element(id) {
  return {
    id,
    isConnected: true,
    parentNode: {
      removeChild(node) {
        actions.push('remove:' + node.id);
        node.isConnected = false;
      }
    }
  };
}
const nodes = {};
for (const id of [
  'battlePlayerSettings',
  'battlePlayerReticle',
  'battlePlayerBoreDot',
  'battlePlayerHud',
  'battlePlayerDamage',
  'battlePlayerGrenadePreview',
  'battlePlayerMenuStyles',
  'battlePlayerFeedbackStyles'
]) nodes[id] = element(id);
const canvas = { tag: 'canvas' };
const document = {
  pointerLockElement: canvas,
  exitPointerLock() {
    actions.push('exitPointerLock');
    this.pointerLockElement = null;
  },
  getElementById(id) {
    return nodes[id] || null;
  }
};
const camera = {
  dispose() {
    actions.push('dispose:camera');
  }
};
const playerCam = {
  dispose() {
    actions.push('dispose:playerCam');
  }
};
const scene = {
  activeCamera: playerCam,
  onBeforeRenderObservable: {
    remove(observer) {
      actions.push('removeObserver:' + observer.id);
    }
  }
};
const target = {
  addEventListener(type, listener, options) {
    actions.push('add:' + type + ':' + !!options);
  },
  removeEventListener(type, listener, options) {
    actions.push('unlisten:' + type + ':' + !!options);
  }
};
const fixture = {
  actions,
  nodes,
  canvas,
  document,
  scene,
  camera,
  playerCam,
  target
};
const make = new Function(
  'fixture',
  `
  var canvas = fixture.canvas,
    document = fixture.document,
    scene = fixture.scene,
    camera = fixture.camera,
    playerCam = fixture.playerCam,
    reticle = fixture.nodes.battlePlayerReticle,
    playerBoreDot = fixture.nodes.battlePlayerBoreDot,
    playerHud = fixture.nodes.battlePlayerHud,
    playerDamage = fixture.nodes.battlePlayerDamage,
    grenadeOverlay = fixture.nodes.battlePlayerGrenadePreview,
    settingsMenu = fixture.nodes.battlePlayerSettings,
    listeners = [],
    frameObserver = { id: 'desktop-frame' },
    stopped = false,
    menuOpen = true,
    menuPadTimer = 99,
    player = { id: 'soldier' },
    mouseAim = true,
    mouseFire = true,
    grenadeKeyDown = true,
    keys = new Set(['w']);
  function closePlayerMenu() { fixture.actions.push('closeMenu'); menuOpen = false; }
  function leavePlayer() { fixture.actions.push('leavePlayer'); player = null; }
  function clearGrenadeReady() { fixture.actions.push('clearGrenade'); }
  function clearInterval(id) { fixture.actions.push('clearInterval:' + id); }
  ` +
    listenSource +
    stopSource +
    `return {
      listen: listen,
      stop: stopDesktop,
      state: function () {
        return { stopped: stopped, listenerCount: listeners.length, observer: frameObserver, menuPadTimer: menuPadTimer };
      }
    };`
)(fixture);
make.listen(target, 'mousemove', function () {});
make.listen(target, 'wheel', function () {}, { passive: false });
assert.equal(make.state().listenerCount, 2);
make.stop();
assert.equal(make.state().stopped, true);
assert.equal(make.state().listenerCount, 0);
assert.equal(make.state().observer, null);
assert.equal(make.state().menuPadTimer, null);
assert.equal(scene.activeCamera, null);
assert.equal(document.pointerLockElement, null);
assert.deepEqual(actions.slice(2, 4), ['unlisten:mousemove:false', 'unlisten:wheel:true']);
for (const id of Object.keys(nodes)) {
  assert.equal(nodes[id].isConnected, false, id + ' survived');
}
for (const event of [
  'removeObserver:desktop-frame',
  'closeMenu',
  'clearInterval:99',
  'leavePlayer',
  'exitPointerLock',
  'dispose:playerCam',
  'dispose:camera'
]) assert.ok(actions.includes(event), 'missing cleanup ' + event);
const count = actions.length;
make.stop();
assert.equal(actions.length, count, 'stop twice must not release resources twice');
console.log('PASS #456 R2 tracked desktop listeners, observer, pause/timer, pointer lock, camera/HUD cleanup and idempotent stop');
