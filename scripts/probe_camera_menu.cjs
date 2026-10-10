/* Real-page #456 R2 browser QA for desktop/player menu, tabs and audio mix.
 * This test runs against a checked-out branch PHP loader, not deployed main.
 * Private audio is replaced only here with decodable PCM silence. */
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
const OUT = path.resolve(process.env.CAMERA_MENU_OUT || 'closeups/camera-menu-ci');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
      '--enable-webgl', '--ignore-gpu-blocklist', '--ignore-certificate-errors', '--no-sandbox']
  });
  const errors = [], notes = [];
  try {
    const page = await browser.newPage({ignoreHTTPSErrors: true, viewport: {width: 1100, height: 780}});
    page.on('pageerror', e => errors.push(String(e && e.stack || e).slice(0, 500)));
    page.on('crash', () => errors.push('page crashed'));
    page.on('console', m => {if (m.type() === 'warning') notes.push(m.text().slice(0, 200));});
    const silence = silentWav();
    await page.route('**/*', route => {
      const req = route.request();
      if (req.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(req.url()))
        return route.fulfill({json: {}});
      if (/\/Assets\/audio\/.*\.(?:mp3|wav|ogg)(?:[?#]|$)/i.test(req.url()))
        return route.fulfill({status: 200, body: silence, contentType: 'audio/wav'});
      return route.continue();
    });
    const destination = URL_ + (URL_.includes('?') ? '&' : '?') + 'seed=camera-menu-qa';
    await page.goto(destination, {waitUntil: 'load', timeout: 300000});
    await page.waitForFunction(() => window.__battle__ && window.BattleDesktopCamera?.current, null,
      {timeout: 300000, polling: 100});
    // R3 real-page loader acceptance: the lightweight canonicalizer must
    // install before the FBX backend on the checked-out PHP module graph.
    const rigIntegration = await page.evaluate(() => {
      const rig = window.BattleFbxRigCanon, backend = window.BattleFbxSoldier;
      return {
        rigInstalled: !!rig,
        backendInstalled: !!backend,
        mixed: rig?.canon('mixamorig:Spine1', 'mixamo'),
        legacy: rig?.canon('Spine02', 'legacy'),
        head: rig?.canon('HeadTop_End'),
        upperFinger: rig?.isUpper('lefthandindex1'),
        lowerFoot: rig?.isUpper('leftfoot')
      };
    });
    assert.deepEqual(rigIntegration, {
      rigInstalled: true, backendInstalled: true, mixed: 'spine1',
      legacy: 'spine0', head: 'headend', upperFinger: true, lowerFoot: false
    }, 'FBX backend lost its rig-naming dependency on the shipping loader');
    // R3 presentational owners must install from the real PHP loader and
    // expose the exact live, tunable objects through the existing diagnostics.
    const lodIntegration = await page.evaluate(() => ({
      meshOwner: !!window.BattleFbxMeshLod,
      renderOwner: !!window.BattleFbxRenderLod,
      mesh: window.BattleFbxSoldier?.meshLod?.far,
      anim: window.BattleFbxSoldier?.lod?.near,
      culled: window.BattleFbxSoldier?.cull?.radius
    }));
    assert.deepEqual(lodIntegration, {
      meshOwner: true, renderOwner: true, mesh: 45, anim: 35, culled: 3
    }, 'real FBX battle lost presentation LOD or culling API after extraction');
    const woundOwnership = await page.evaluate(() => ({
      owner: !!window.BattleFbxSurfaceDamage,
      resolution: window.BattleFbxSoldier?.surfaceDamageResolution,
      anchor: typeof window.BattleFbxSoldier?.skinAnchor,
      sample: typeof window.BattleFbxSoldier?.skinSample,
      paint: typeof window.BattleFbxSoldier?.paintSurfaceWound,
      clear: typeof window.BattleFbxSoldier?.clearSurfaceDamage
    }));
    assert.deepEqual(woundOwnership, {
      owner: true, resolution: 512, anchor: 'function', sample: 'function',
      paint: 'function', clear: 'function'
    }, 'real FBX backend lost its skinned wound and UV surface presentation contract');
    // R3 actual checked-out battle: calibration must feed loaded FBX model grips,
    // attached weapon world matrices, and prepared mesh muzzles on both factions.
    const fbIntegration = await page.evaluate(() => {
      const c = window.BattleFbxWeaponCalibration;
      const sim = window.__battle__;
      const status = window.BattleFbxSoldier?.status(sim.scene);
      const perFaction = ['us', 'ge'].map(faction => {
        const soldiers = sim._roster?.[faction] || [];
        const man = soldiers.find(s => s._fbx?.lib?.grips && s.weapon?.mesh &&
          s.weapon?.muzzleLocal?.length === 3);
        if (!man) return {faction, found: false};
        const weapon = man.weapon, fx = man._fbx, key = weapon.model || weapon.kind;
        const grip = fx.lib.grips[key] || fx.lib.grips[weapon.kind] || fx.lib.grips.rifle;
        const matrix = weapon.mesh.getWorldMatrix();
        const local = BABYLON.Vector3.FromArray(weapon.muzzleLocal);
        const muzzle = BABYLON.Vector3.TransformCoordinates(local, matrix);
        const valid = values => values.length > 0 && values.every(Number.isFinite);
        return {
          faction, found: true,
          model: fx.lib.file, weapon: key,
          gripFinite: !!grip && valid(Array.from(grip.m)),
          weaponFinite: valid(Array.from(matrix.m)),
          muzzleFinite: valid(muzzle.asArray()),
          gripPresent: !!c?.pointsFor(fx.lib.file, key),
          socketOffset: BABYLON.Vector3.Distance(muzzle, man.root.position)
        };
      });
      return {
        installed: !!c, ready: !!status?.ready, models: Object.keys(status?.sockets || {}).length,
        garand: c?.pointsFor('us-paratrooper.fbx', 'm1-garand.fbx')?.grip,
        mg42: c?.pointsFor('ge-gunner.fbx', 'mg42-bipod.fbx')?.grip,
        m1919: c?.pointsFor('us-gunner.fbx', 'm1919a6-bipod.fbx')?.grip,
        perFaction
      };
    });
    assert.equal(fbIntegration.installed, true, 'weapon calibration module missing in PHP graph');
    assert.equal(fbIntegration.ready, true, 'FBX models were not fully loaded');
    assert.ok(fbIntegration.models >= 2, 'missing loaded faction models');
    assert.deepEqual(fbIntegration.garand, [-0.011, -0.046, -0.076]);
    assert.deepEqual(fbIntegration.mg42, [0.0196, -0.066, -0.094]);
    assert.deepEqual(fbIntegration.m1919, [0.0196, -0.104, 0.0049]);
    for (const sample of fbIntegration.perFaction) {
      assert.ok(sample.found, 'no armed imported ' + sample.faction + ' soldier: ' + JSON.stringify(fbIntegration));
      assert.ok(sample.gripFinite && sample.weaponFinite && sample.muzzleFinite &&
        sample.gripPresent && Number.isFinite(sample.socketOffset) && sample.socketOffset > 0,
        'invalid live FBX weapon grip/muzzle for ' + sample.faction + ': ' + JSON.stringify(sample));
    }
    // Free-fly keyboard movement is independent of gamepad; route through the
    // scene frame observable, not a one-off synthetic API.
    let flyDistance = 0;
    let flySnapshot = null;
    // Scene construction can precede the first reliable render on slow CI/WebGL.
    // Exercise real keydown/keyup over several bounded frames instead of assuming
    // the first 380 ms window always contains a rendered movement tick.
    for (let attempt = 0; attempt < 8 && flyDistance <= 0.05; attempt++) {
      await page.evaluate(() => {
        const canvas = window.__battle__.scene.getEngine().getRenderingCanvas();
        canvas.tabIndex = 0;
        canvas.focus();
      });
      const before = await page.evaluate(() => BattleDesktopCamera.current.camera.position.asArray());
      await page.keyboard.down('w');
      await page.waitForTimeout(450);
      await page.keyboard.up('w');
      flySnapshot = await page.evaluate(() => ({
        position: BattleDesktopCamera.current.camera.position.asArray(),
        activeElement: document.activeElement?.tagName,
        fps: window.__battle__.scene.getEngine().getFps(),
        loadingDone: document.getElementById('loading')?.classList.contains('done') ?? null
      }));
      flyDistance = Math.hypot(...before.map((n, i) => n - flySnapshot.position[i]));
      if (flyDistance <= 0.05) await page.waitForTimeout(250);
    }
    assert.ok(flyDistance > 0.05, 'W free-fly keyboard movement did not move the camera: ' + JSON.stringify(flySnapshot));
    // Menu steals focus and should never leak WASD motion into free-flight.
    await page.keyboard.press('o');
    await page.waitForFunction(() => {
      const p = document.getElementById('battlePlayerSettings');
      return p && getComputedStyle(p).display === 'flex';
    }, null, {timeout: 30000});
    for (const id of [
      'bpmTabPlayer', 'bpmTabAudio', 'bpmFaction', 'bpmSquad', 'bpmSoldier',
      'bpmHaptics', 'bpmMaster', 'bpmWeapons', 'bpmVoices', 'bpmEffects',
      'bpmResetAudio', 'bpmApply', 'bpmClose'
    ]) assert.equal(await page.locator('#' + id).count(), 1, 'missing control ' + id);
    assert.equal(await page.locator('#bpmTabPlayer').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('#bpmPlayerPane').isVisible(), true);
    await page.screenshot({path: path.join(OUT, 'player-settings.png')});
    await page.locator('#bpmTabAudio').click();
    assert.equal(await page.locator('#bpmAudioPane').isVisible(), true);
    assert.equal(await page.locator('#bpmPlayerPane').isVisible(), false);
    await page.locator('#bpmMaster').evaluate(el => {
      el.value = '115'; el.dispatchEvent(new Event('input', {bubbles: true}));
    });
    const mix = await page.evaluate(() => window.BattleAudioMix && BattleAudioMix.get());
    assert.ok(mix && mix.master === 115, 'master audio slider did not set the live mix');
    assert.equal(await page.locator('#bpmMasterValue').textContent(), '115%');
    await page.locator('#bpmResetAudio').click();
    assert.equal(await page.locator('#bpmMasterValue').textContent(), '100%');
    await page.screenshot({path: path.join(OUT, 'audio-settings.png')});
    await page.locator('#bpmTabPlayer').click();
    assert.equal(await page.locator('#bpmPlayerPane').isVisible(), true);
    await page.locator('#bpmHaptics').uncheck();
    await page.locator('#bpmClose').click();
    assert.equal(await page.locator('#battlePlayerSettings').isVisible(), false, 'Back should close menu');
    await page.keyboard.press('o');
    assert.equal(await page.locator('#battlePlayerSettings').isVisible(), true, 'O should reopen menu');
    assert.equal(await page.locator('#bpmHaptics').isChecked(), false, 'haptics preference lost on reopen');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#battlePlayerSettings').isVisible(), false, 'Escape should close menu');
    // P enters a real, living roster soldier; V returns to the free camera.
    await page.evaluate(() => {
      const canvas = BattleDesktopCamera.current.camera.getEngine().getRenderingCanvas();
      canvas.focus();
    });
    await page.keyboard.press('p');
    await page.waitForFunction(() => {
      const b = window.__battle__;
      return b && b._roster && (b._roster.us || []).some(s => s.isPlayer);
    }, null, { timeout: 15000 });
    const first = await page.evaluate(() => {
      const b = window.__battle__, man = b._roster.us.find(s => s.isPlayer);
      return { id: man.id, faction: man.faction, camera: b.scene.activeCamera.name };
    });
    assert.equal(first.faction, 'us', 'first player should use default US faction');
    assert.equal(first.camera, 'playerCam', 'possessing a soldier must activate player camera');

    // Switch to an actual German squad through the shipping menu. The prior
    // US soldier must immediately lose every player lease before GE acquires it.
    await page.keyboard.press('o');
    await page.waitForFunction(() => {
      const p = document.getElementById('battlePlayerSettings');
      return p && getComputedStyle(p).display === 'flex';
    });
    const menuPause = await page.evaluate(() => ({
      paused: __battle__.paused,
      winner: __battle__.winner
    }));
    if (!menuPause.winner) assert.equal(menuPause.paused, true, 'opening menu owns game pause');
    await page.locator('#bpmFaction').selectOption('ge');
    assert.equal(await page.locator('#bpmApply').isEnabled(), true, 'requires living German squad');
    await page.locator('#bpmSquad').selectOption('0');
    await page.locator('#bpmSoldier').selectOption('0');
    await page.locator('#bpmApply').click();
    await page.waitForFunction(() => {
      const b = __battle__;
      return b._roster.ge.some(s => s.isPlayer) && !b._roster.us.some(s => s.isPlayer) &&
        b.scene.activeCamera.name === 'playerCam';
    }, null, { timeout: 15000 });
    const switched = await page.evaluate(() => ({
      usLeases: __battle__._roster.us.filter(s => s.isPlayer).length,
      geLeases: __battle__._roster.ge.filter(s => s.isPlayer).length,
      paused: __battle__.paused,
      winner: __battle__.winner
    }));
    assert.deepEqual([switched.usLeases, switched.geLeases], [0, 1], 'possession transfer must be exclusive');
    if (!switched.winner) assert.equal(switched.paused, false, 'closing owned menu resumes battle');

    // A battle paused before opening settings must NOT be resumed on close:
    // only a pause owned by the menu may be released.
    await page.evaluate(() => __battle__.pause());
    await page.keyboard.press('o');
    await page.waitForFunction(() => getComputedStyle(document.getElementById('battlePlayerSettings')).display === 'flex');
    assert.equal(await page.evaluate(() => __battle__.paused), true);
    await page.locator('#bpmClose').click();
    assert.equal(await page.evaluate(() => __battle__.paused), true, 'external pause must survive menu close');
    await page.evaluate(() => __battle__.resume());

    await page.keyboard.press('v');
    await page.waitForFunction(() => {
      const b = window.__battle__;
      return b && b._roster && !(b._roster.us || []).some(s => s.isPlayer) &&
        !(b._roster.ge || []).some(s => s.isPlayer) && b.scene.activeCamera.name === 'cam';
    }, null, { timeout: 15000 });
    // Some headless Chromium environments deny real pointer lock despite a
    // genuine click. Try the real API first; only if unavailable inject a
    // document-level test double that exercises shipping change/exit handlers.
    await page.locator('#renderCanvas').click({force: true, position: {x: 250, y: 210}});
    await page.waitForTimeout(350);
    const realPointerLock = await page.evaluate(() =>
      document.pointerLockElement === document.getElementById('renderCanvas')
    );
    if (!realPointerLock) {
      await page.evaluate(() => {
        const original = Object.getOwnPropertyDescriptor(document, 'pointerLockElement');
        const originalExit = document.exitPointerLock;
        const canvas = document.getElementById('renderCanvas');
        let held = null;
        Object.defineProperty(document, 'pointerLockElement', {
          configurable: true, get: () => held
        });
        document.exitPointerLock = function () {
          held = null;
          document.dispatchEvent(new Event('pointerlockchange'));
        };
        window.__qaPointer = {
          synthetic: true,
          lock() {
            held = canvas;
            document.dispatchEvent(new Event('pointerlockchange'));
          },
          restore() {
            if (original) Object.defineProperty(document, 'pointerLockElement', original);
            else delete document.pointerLockElement;
            document.exitPointerLock = originalExit;
          }
        };
        window.__qaPointer.lock();
      });
    }
    assert.equal(await page.evaluate(() =>
      document.pointerLockElement === document.getElementById('renderCanvas')
    ), true, 'pointer-lock test setup failed');
    await page.keyboard.press('o');
    await page.waitForFunction(() =>
      getComputedStyle(document.getElementById('battlePlayerSettings')).display === 'flex'
    );
    assert.equal(await page.evaluate(() => document.pointerLockElement), null,
      'opening settings must release pointer lock');
    await page.keyboard.press('Escape');
    if (realPointerLock) {
      await page.locator('#renderCanvas').click({force: true, position: {x: 250, y: 210}});
      await page.waitForFunction(
        () => document.pointerLockElement === document.getElementById('renderCanvas'),
        null, {timeout: 10000}
      );
    } else {
      await page.evaluate(() => window.__qaPointer.lock());
    }

    // Recreate on the same page and the SAME scene. Assert observer count stays
    // constant; previous camera, pointer lock and DOM controls are disposed;
    // repeated stop on an old controller cannot interfere with the replacement.
    const lifecycle = await page.evaluate(() => {
      const scene = __battle__.scene;
      const old = BattleDesktopCamera.current;
      const oldCam = old.camera;
      const observable = scene.onBeforeRenderObservable;
      const beforeObservers = observable.observers.slice();
      const observersBefore = beforeObservers.length;
      const removes = [];
      const originalRemove = observable.remove;
      observable.remove = function (observer) {
        const result = originalRemove.call(this, observer);
        removes.push({ name: observer?.callback?.name, result, stillListed: this.observers.includes(observer) });
        return result;
      };
      const previousSettings = document.getElementById('battlePlayerSettings');
      const replacement = BattleDesktopCamera.create({
        scene, canvas: document.getElementById('renderCanvas'),
        engine: scene.getEngine(), battleSim: __battle__,
        scenario: { center: {x: 0, z: 0} }
      });
      observable.remove = originalRemove;
      const afterObservers = observable.observers.slice();
      const observersAfter = afterObservers.length;
      const removedObservers = beforeObservers.filter(o => !afterObservers.includes(o))
        .map(o => o.callback?.name || '(anonymous)');
      const addedObservers = afterObservers.filter(o => !beforeObservers.includes(o))
        .map(o => o.callback?.name || '(anonymous)');
      const framesBefore = beforeObservers.filter(o => o.callback?.name === 'stepDesktopFrame');
      const framesAfter = afterObservers.filter(o => o.callback?.name === 'stepDesktopFrame');
      const staleFrameRetained = framesBefore.some(o => afterObservers.includes(o));
      window.__qaPreviousFrameObserver = framesBefore[0];
      const uiAfter = [
        'battlePlayerSettings','battlePlayerReticle','battlePlayerHud',
        'battlePlayerBoreDot','battlePlayerDamage','battlePlayerGrenadePreview',
        'battlePlayerMenuStyles','battlePlayerFeedbackStyles'
      ].filter(id => document.getElementById(id));
      old.stop();
      return {
        observersBefore, observersAfter, removes, removedObservers, addedObservers,
        framesBefore: framesBefore.length, framesAfter: framesAfter.length, staleFrameRetained,
        oldDisposed: oldCam.isDisposed(),
        oldSettingsDetached: !previousSettings || !previousSettings.isConnected,
        uiAfter, replacementCurrent: BattleDesktopCamera.current === replacement,
        replacementAlive: !replacement.camera.isDisposed(),
        lockReleased: document.pointerLockElement === null
      };
    });
    assert.equal(lifecycle.framesBefore, 1, 'initial scene should own one desktop frame observer');
    assert.ok(lifecycle.removes.some(r => r.name === 'stepDesktopFrame' && r.result === true),
      'Babylon did not accept removal of the prior controller observer: ' + JSON.stringify(lifecycle));
    /* Babylon Observable.remove() returns true while marking an observer for
       deferred unregistration; the old reference can remain in observers until
       the next notification/render. Wait for actual removal, not immediate list length. */
    await page.waitForFunction(() =>
      !__battle__.scene.onBeforeRenderObservable.observers.includes(window.__qaPreviousFrameObserver),
      null, {timeout: 10000}
    );
    const finalObserverState = await page.evaluate(() => {
      const current = __battle__.scene.onBeforeRenderObservable.observers;
      const frames = current.filter(o => o.callback?.name === 'stepDesktopFrame');
      delete window.__qaPreviousFrameObserver;
      return { frames: frames.length, total: current.length };
    });
    assert.equal(finalObserverState.frames, 1,
      'old frame observer remained registered after a rendered frame: ' +
      JSON.stringify({lifecycle, finalObserverState}));
    assert.equal(lifecycle.oldDisposed, true, 'previous desktop camera must be disposed');
    assert.equal(lifecycle.oldSettingsDetached, true, 'old menu must be removed');
    assert.deepEqual(lifecycle.uiAfter, [], 'transient old HUD/menu nodes survived recreation');
    assert.equal(lifecycle.replacementCurrent, true);
    assert.equal(lifecycle.replacementAlive, true, 'old.stop must not dispose new camera');
    assert.equal(lifecycle.lockReleased, true, 'recreation must release old pointer lock');
    if (!realPointerLock) await page.evaluate(() => window.__qaPointer.restore());
    await page.keyboard.press('o');
    await page.waitForFunction(() => {
      const p = document.getElementById('battlePlayerSettings');
      return p && getComputedStyle(p).display === 'flex';
    });
    assert.equal(await page.locator('#battlePlayerSettings').count(), 1,
      'only replacement may create settings UI');
    await page.keyboard.press('Escape');
    // A synthetic Gamepad API device drives the SHIPPING scene-frame handler,
    // including the 650 ms Menu gesture. This is controller-event coverage,
    // not a physical Xbox hardware or mobile Safari certification.
    await page.evaluate(() => {
      const pad = {
        id: 'QA Xbox controller', index: 0, connected: true, mapping: 'standard',
        axes: [0, 0, 0, 0],
        buttons: Array.from({length: 17}, () => ({pressed: false, value: 0}))
      };
      window.__qaGamepad = pad;
      Object.defineProperty(navigator, 'getGamepads', {
        configurable: true, value: () => [pad]
      });
      const event = new Event('gamepadconnected');
      Object.defineProperty(event, 'gamepad', {value: pad});
      window.dispatchEvent(event);
    });
    await page.waitForTimeout(350);
    // CI WebGL can skip render iterations; drive the shipping frame callback
    // at every edge rather than relying on a 200 ms browser render window.
    const tickDesktopFrame = async () => {
      await page.evaluate(() => {
        const frames = __battle__.scene.onBeforeRenderObservable.observers
          .filter(o => o.callback?.name === 'stepDesktopFrame' && o._willBeUnregistered !== true);
        if (frames.length !== 1) throw new Error('expected one desktop frame: ' + frames.length);
        frames[0].callback();
      });
    };
    await tickDesktopFrame();
    const pressMenu = async (pressed) => {
      await page.evaluate(down => {
        const button = __qaGamepad.buttons[9];
        button.pressed = down;
        button.value = down ? 1 : 0;
      }, pressed);
    };
    // Tap enters player mode; it must not accidentally open settings.
    await pressMenu(true);
    await tickDesktopFrame();
    await page.waitForTimeout(240);
    await pressMenu(false);
    await tickDesktopFrame();
    await page.waitForFunction(() => (__battle__._roster.us.concat(__battle__._roster.ge).find(s => s.isPlayer) || null) != null,
      null, {timeout: 15000});
    assert.equal(await page.locator('#battlePlayerSettings').isVisible(), false,
      'short Menu tap unexpectedly opened settings');
    const firstGamepadPlayer = await page.evaluate(() => (__battle__._roster.us.concat(__battle__._roster.ge).find(s => s.isPlayer) || null)?.id);
    // Hold opens once, before release, without firing a second tap on release.
    await pressMenu(true);
    await tickDesktopFrame();
    await page.waitForTimeout(800);
    await tickDesktopFrame();
    await page.waitForFunction(() => {
      const p = document.getElementById('battlePlayerSettings');
      return p && getComputedStyle(p).display === 'flex';
    }, null, {timeout: 15000});
    const heldPlayer = await page.evaluate(() => (__battle__._roster.us.concat(__battle__._roster.ge).find(s => s.isPlayer) || null)?.id);
    await pressMenu(false);
    await tickDesktopFrame();
    await page.waitForTimeout(230);
    assert.equal(await page.locator('#battlePlayerSettings').isVisible(), true,
      'hold release must not also close menu as a tap');
    assert.equal(await page.evaluate(() => (__battle__._roster.us.concat(__battle__._roster.ge).find(s => s.isPlayer) || null)?.id),
      heldPlayer, 'hold release must not switch soldier');
    // A subsequent short press intentionally closes an open menu.
    await pressMenu(true);
    await tickDesktopFrame();
    await page.waitForTimeout(230);
    await pressMenu(false);
    await tickDesktopFrame();
    await page.waitForFunction(() => {
      const p = document.getElementById('battlePlayerSettings');
      return p && getComputedStyle(p).display === 'none';
    }, null, {timeout: 15000});
    assert.equal(await page.evaluate(() => (__battle__._roster.us.concat(__battle__._roster.ge).find(s => s.isPlayer) || null)?.id),
      heldPlayer, 'menu-close tap must retain possession');
    await page.keyboard.press('v');
    await page.waitForFunction(() => (__battle__._roster.us.concat(__battle__._roster.ge).find(s => s.isPlayer) || null) == null,
      null, {timeout: 15000});
    await page.evaluate(() => {
      delete window.__qaGamepad;
      delete navigator.getGamepads;
    });
    const gesture = { firstGamepadPlayer, heldPlayer, holdMs: 650 };
    const state = await page.evaluate(() => ({
      build: window.BATTLE_BUILD_DEPLOYED || null,
      camera: window.BattleDesktopCamera?.current?.camera?.name || null,
      playerTab: document.getElementById('bpmTabPlayer').getAttribute('aria-selected'),
      menuHidden: getComputedStyle(document.getElementById('battlePlayerSettings')).display === 'none'
    }));
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify({state, errors, notes: notes.slice(-20)}, null, 2));
    assert.equal(errors.length, 0, 'page errors: ' + errors.slice(0, 5).join(' | '));
    console.log('PASS #456 R2 controller Menu tap/hold, presentation and camera disposal (' + (realPointerLock ? 'real pointer lock' : 'synthetic pointer lock') + ') ' + JSON.stringify({state,lifecycle,finalObserverState,gesture}));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error('CAMERA MENU PROBE FAIL', e && e.stack || e); process.exit(1); });
