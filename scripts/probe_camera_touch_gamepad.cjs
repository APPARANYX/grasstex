/* #456 R2: real-page coarse-pointer -> gamepad wake/stop and restart QA.
 * Gamepads and pointer-media are emulated, not native iOS/Xbox hardware. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
function loadPlaywright() {
  try { return require('playwright'); } catch (_) {
    const { execSync } = require('node:child_process');
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}
function silentWav() {
  const samples = 2205, b = Buffer.alloc(44 + samples * 2);
  b.write('RIFF', 0); b.writeUInt32LE(b.length - 8, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(22050, 24); b.writeUInt32LE(44100, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36);
  b.writeUInt32LE(samples * 2, 40);
  return b;
}
const URL_ = process.env.CAMERA_MENU_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const OUT = path.resolve(process.env.CAMERA_TOUCH_OUT || 'closeups/camera-touch-ci');
(async () => {
  fs.mkdirSync(OUT, {recursive: true});
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
      '--enable-webgl', '--ignore-gpu-blocklist', '--ignore-certificate-errors', '--no-sandbox']
  });
  const errors = [];
  const history = [];
  try {
    const page = await browser.newPage({ignoreHTTPSErrors: true, viewport: {width: 920, height: 740}});
    page.on('pageerror', e => errors.push(String(e && e.stack || e).slice(0, 600)));
    page.on('crash', () => errors.push('page crashed'));
    await page.addInitScript(() => {
      const original = window.matchMedia.bind(window);
      window.matchMedia = query => {
        if (query === '(pointer:fine)') {
          return {
            matches: false, media: query,
            addListener() {}, removeListener() {},
            addEventListener() {}, removeEventListener() {},
            dispatchEvent() { return true; }
          };
        }
        return original(query);
      };
      window.__qaPads = [];
      Object.defineProperty(navigator, 'getGamepads', {
        configurable: true,
        value: () => window.__qaPads
      });
      window.__qaMakePad = id => ({
        id, index: 0, connected: true, mapping: 'standard',
        axes: [0, 0, 0, 0],
        buttons: Array.from({length: 17}, () => ({pressed: false, value: 0}))
      });
      window.__qaDispatchPad = (name, pad) => {
        const ev = new Event(name);
        Object.defineProperty(ev, 'gamepad', {value: pad});
        window.dispatchEvent(ev);
      };
    });
    const silence = silentWav();
    await page.route('**/*', route => {
      const req = route.request();
      if (req.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(req.url()))
        return route.fulfill({json: {}});
      if (/\/Assets\/audio\/.*\.(?:mp3|wav|ogg)(?:[?#]|$)/i.test(req.url()))
        return route.fulfill({status: 200, body: silence, contentType: 'audio/wav'});
      return route.continue();
    });
    const destination = URL_ + (URL_.includes('?') ? '&' : '?') + 'seed=camera-touch-qa';
    await page.goto(destination, {waitUntil: 'load', timeout: 300000});
    await page.waitForFunction(() => window.__battle__?.scene && window.BattleDesktopCamera?.current,
      null, {timeout: 300000, polling: 100});
    assert.equal(await page.evaluate(() => BattleDesktopCamera.current.desktop), false,
      'coarse pointer must start with touch orbit and no active gamepad');

    // Explicitly disconnected devices cannot wake camera mode.
    const stale = await page.evaluate(() => {
      const original = BattleDesktopCamera.current;
      const stalePad = __qaMakePad('stale pad');
      stalePad.connected = false;
      __qaDispatchPad('gamepadconnected', stalePad);
      return {
        same: BattleDesktopCamera.current === original,
        disposed: original.camera.isDisposed()
      };
    });
    assert.deepEqual(stale, {same: true, disposed: false}, 'stale connected event woke touch camera');

    // WebKit can emit the event before getGamepads() exposes the new pad.
    const first = await page.evaluate(() => {
      const initial = BattleDesktopCamera.current;
      const old = initial.camera;
      const obs = __battle__.scene.onBeforeRenderObservable.observers.slice();
      const pad = __qaMakePad('first pad');
      __qaDispatchPad('gamepadconnected', pad);
      const current = BattleDesktopCamera.current;
      __qaPads = [pad]; // deliberately expose only after event delivery
      return {
        oldDisposed: old.isDisposed(), sameWrapper: current === initial,
        desktop: current.desktop, active: __battle__.scene.activeCamera === current.camera,
        oldWakeObservers: obs.filter(o => !__battle__.scene.onBeforeRenderObservable.observers.includes(o)).length
      };
    });
    assert.equal(first.oldDisposed, true, 'touch ArcRotate control must be disposed during wake');
    assert.equal(first.sameWrapper, true, 'adaptive camera wrapper must preserve identity');
    assert.equal(first.desktop, true, 'event-first wake did not switch to desktop');
    assert.equal(first.active, true, 'event-first wake did not activate new camera');

    await page.waitForFunction(() => {
      const obs = __battle__.scene.onBeforeRenderObservable.observers;
      return obs.filter(o => o.callback?.name === 'stepDesktopFrame').length === 1;
    }, null, {timeout: 15000});
    history.push({phase: 'event-first', ...first});

    // Disconnect while the Menu button is held; reconnecting without pressing
    // Menu must never synthesize a tap or accidentally possess a soldier.
    const disconnect = await page.evaluate(() => {
      const pad = __qaPads[0];
      pad.buttons[9].pressed = true;
      pad.buttons[9].value = 1;
      const frame = __battle__.scene.onBeforeRenderObservable.observers
        .find(o => o.callback?.name === 'stepDesktopFrame');
      frame.callback();
      pad.connected = false;
      __qaPads = [];
      __qaDispatchPad('gamepaddisconnected', pad);
      frame.callback();
      const fresh = __qaMakePad('second pad');
      __qaPads = [fresh];
      __qaDispatchPad('gamepadconnected', fresh);
      frame.callback();
      return {
        menuOpen: document.getElementById('battlePlayerSettings')?.style.display === 'flex',
        playerLeases: (__battle__._roster.us || []).concat(__battle__._roster.ge || [])
          .filter(s => s.isPlayer).length,
        desktop: BattleDesktopCamera.current.desktop,
        camera: BattleDesktopCamera.current.camera.name
      };
    });
    assert.equal(disconnect.menuOpen, false, 'reconnect caused a ghost Menu hold');
    assert.equal(disconnect.playerLeases, 0, 'held Menu leaked a phantom player tap');
    assert.equal(disconnect.desktop, true, 'disconnect unexpectedly destroyed desktop controls');
    history.push({phase: 'disconnect-and-reconnect', ...disconnect});

    // A same-page restart with a pad still connected remains desktop. Then
    // remove the pad and run repeated coarse-pointer touch restarts. Verify
    // old cameras are disposed and the wrapper's stop method is idempotent.
    const options = await page.evaluate(() => ({
      scenario: {center: {x: 0, z: 0}}
    }));
    for (let cycle = 0; cycle < 4; cycle++) {
      const snapshot = await page.evaluate(({cycle, options}) => {
        if (cycle !== 0) __qaPads = [];
        const scene = __battle__.scene;
        const old = BattleDesktopCamera.current;
        const oldCamera = old.camera;
        const countBefore = scene.onBeforeRenderObservable.observers.length;
        const next = BattleDesktopCamera.create({
          scene, engine: scene.getEngine(),
          canvas: document.getElementById('renderCanvas'),
          battleSim: __battle__, scenario: options.scenario
        });
        old.stop();
        return {
          cycle, oldDisposed: oldCamera.isDisposed(),
          newWrapper: old !== next,
          oldHasStop: typeof old.stop === 'function',
          nextDesktop: next.desktop,
          newDisposed: next.camera.isDisposed(),
          activeCamera: scene.activeCamera === next.camera,
          observerCountBefore: countBefore
        };
      }, {cycle, options});
      assert.equal(snapshot.oldDisposed, true, 'restart left previous camera allocated, cycle ' + cycle);
      assert.equal(snapshot.newDisposed, false, 'old.stop disposed the replacement, cycle ' + cycle);
      assert.equal(snapshot.activeCamera, true, 'wrong scene camera after restart, cycle ' + cycle);
      assert.equal(snapshot.nextDesktop, cycle === 0,
        'gamepad/coarse-pointer mode selection wrong on restart, cycle ' + cycle);
      history.push({phase: 'restart', ...snapshot});
      await page.waitForTimeout(180);
    }
    assert.equal(await page.evaluate(() => BattleDesktopCamera.current.desktop), false);
    // Poll-only path: no 'gamepadconnected' event, just Gamepad API visibility
    // while the touch-orbit render observer is attached.
    const poll = await page.evaluate(() => {
      const old = BattleDesktopCamera.current.camera;
      __qaPads = [__qaMakePad('poll-only pad')];
      return {oldDisposed: old.isDisposed()};
    });
    await page.waitForFunction(() => BattleDesktopCamera.current.desktop, null, {timeout: 20000});
    await page.waitForFunction(() => __battle__.scene.onBeforeRenderObservable.observers
      .filter(o => o.callback?.name === 'stepDesktopFrame').length === 1,
      null, {timeout: 15000});
    history.push({phase: 'poll-only', transitioned: true, ...poll});
    const result = await page.evaluate(() => ({
      desktop: BattleDesktopCamera.current.desktop,
      frameObservers: __battle__.scene.onBeforeRenderObservable.observers
        .filter(o => o.callback?.name === 'stepDesktopFrame').length,
      activeCamera: __battle__.scene.activeCamera === BattleDesktopCamera.current.camera
    }));
    assert.deepEqual(result, {desktop: true, frameObservers: 1, activeCamera: true});
    assert.deepEqual(errors, [], 'browser exceptions: ' + errors.slice(0, 4).join(' | '));
    fs.writeFileSync(path.join(OUT, 'touch-gamepad-lifecycle.json'),
      JSON.stringify({history, result, errors}, null, 2));
    await page.screenshot({path: path.join(OUT, 'touch-gamepad-lifecycle.png')});
    console.log('PASS #456 R2 coarse-pointer touch→gamepad event/poll wake, disconnect held Menu and four same-page restarts ' +
      JSON.stringify({history, result}));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error('TOUCH GAMEPAD PROBE FAIL', e && e.stack || e); process.exit(1); });
