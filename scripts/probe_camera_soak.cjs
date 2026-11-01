/* #456 R2: bounded real-page Chromium possession/restart/heap soak.
 * Emulated desktop browser, NOT actual Xbox hardware or iOS Safari.
 * Measures collected JS heap; does not claim GPU/mobile FPS parity. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (_) {
    const { execSync } = require('node:child_process');
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}

function silentWav() {
  const samples = 2205,
    b = Buffer.alloc(44 + samples * 2);
  b.write('RIFF', 0);
  b.writeUInt32LE(b.length - 8, 4);
  b.write('WAVE', 8);
  b.write('fmt ', 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(22050, 24);
  b.writeUInt32LE(44100, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(samples * 2, 40);
  return b;
}

const URL_ = process.env.CAMERA_SOAK_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const OUT = path.resolve(process.env.CAMERA_SOAK_OUT || 'closeups/camera-soak-ci');
const CYCLES = 8;
const DWELL_MS = 12000;
const MAX_HEAP_GROWTH_BYTES = 96 * 1024 * 1024;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--ignore-certificate-errors',
      '--no-sandbox'
    ]
  });
  const errors = [],
    samples = [],
    restarts = [];
  try {
    const page = await browser.newPage({
      ignoreHTTPSErrors: true,
      viewport: { width: 1100, height: 780 }
    });
    page.on('pageerror', e => errors.push(String((e && e.stack) || e).slice(0, 500)));
    page.on('crash', () => errors.push('page crashed'));
    const silence = silentWav();
    await page.route('**/*', route => {
      const req = route.request();
      if (req.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(req.url()))
        return route.fulfill({ json: {} });
      if (/\/Assets\/audio\/.*\.(?:mp3|wav|ogg)(?:[?#]|$)/i.test(req.url()))
        return route.fulfill({ status: 200, body: silence, contentType: 'audio/wav' });
      return route.continue();
    });
    const url = URL_ + (URL_.includes('?') ? '&' : '?') + 'seed=camera-soak-qa';
    await page.goto(url, { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction(
      () => window.__battle__?.scene && window.BattleDesktopCamera?.current?.desktop,
      null,
      { timeout: 300000 }
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('HeapProfiler.enable');

    async function sample(label) {
      await cdp.send('HeapProfiler.collectGarbage');
      const heap = await cdp.send('Runtime.getHeapUsage');
      const data = await page.evaluate(() => {
        const b = __battle__,
          scene = b.scene,
          current = BattleDesktopCamera.current,
          roster = b._roster.us.concat(b._roster.ge);
        return {
          time: b.time,
          paused: b.paused,
          winner: b.winner || null,
          fps: scene.getEngine().getFps(),
          camera: scene.activeCamera?.name,
          cameraAlive: current?.camera?.isDisposed() === false,
          frameObservers: scene.onBeforeRenderObservable.observers.filter(
            o => o.callback?.name === 'stepDesktopFrame'
          ).length,
          allObservers: scene.onBeforeRenderObservable.observers.length,
          playerLeases: roster.filter(s => s.isPlayer).length,
          living: roster.filter(s => !s.dead).length,
          meshes: scene.meshes.length,
          skeletons: scene.skeletons.length,
          menuNodes: document.querySelectorAll('#battlePlayerSettings').length,
          skipNodes: document.querySelectorAll('#battleDeathSkip').length
        };
      });
      const row = { label, wallMs: Date.now(), collectedHeapBytes: heap.usedSize, ...data };
      samples.push(row);
      fs.writeFileSync(path.join(OUT, 'camera-soak.json'), JSON.stringify({ samples, restarts, errors }, null, 2));
      assert.equal(row.cameraAlive, true, label + ': camera disposed');
      assert.equal(row.frameObservers, 1, label + ': wrong camera render observer count');
      assert.equal(row.playerLeases, 1, label + ': missing/duplicate possessed soldier');
      assert.equal(row.camera, 'playerCam', label + ': player camera lost');
      assert.equal(row.menuNodes <= 1, true, label + ': duplicate settings menu');
      assert.equal(row.skipNodes <= 1, true, label + ': duplicate Skip button');
      assert.ok(Number.isFinite(row.fps) && row.fps > 0, label + ': no rendered FPS samples');
      return row;
    }

    await page.keyboard.press('p');
    await page.waitForFunction(
      () =>
        __battle__._roster.us.concat(__battle__._roster.ge).filter(s => s.isPlayer).length === 1 &&
        __battle__.scene.activeCamera?.name === 'playerCam',
      null,
      { timeout: 15000 }
    );
    await page.waitForTimeout(4000);
    const baseline = await sample('warm-player');

    for (let i = 0; i < CYCLES; i++) {
      await page.waitForTimeout(DWELL_MS);
      const replaced = await page.evaluate(() => {
        const b = __battle__,
          oldRoster = b._roster.us.concat(b._roster.ge),
          oldPlayer = oldRoster.find(s => s.isPlayer);
        if (!oldPlayer) throw new Error('expected player before restart');
        const oldRoot = oldPlayer.root;
        b.restart();
        const newRoster = b._roster.us.concat(b._roster.ge);
        return {
          sameBattle: b === __battle__,
          disposedOldRoot: oldRoot.isDisposed(),
          staleSoldierAbsent: !newRoster.includes(oldPlayer),
          replacedAll: newRoster.every(s => !oldRoster.includes(s)),
          newRosterLength: newRoster.length
        };
      });
      restarts.push({ cycle: i + 1, ...replaced });
      assert.equal(replaced.sameBattle, true, 'restart replaced BattleSim identity');
      assert.equal(replaced.disposedOldRoot, true, 'restart left old player mesh alive');
      assert.equal(replaced.staleSoldierAbsent, true, 'old player still appears in roster');
      assert.equal(replaced.replacedAll, true, 'restart reused old soldier object');
      assert.ok(replaced.newRosterLength > 0, 'restart yielded empty battle');
      await page.waitForFunction(
        () =>
          __battle__.scene.activeCamera?.name === 'cam' &&
          !__battle__._roster.us.concat(__battle__._roster.ge).some(s => s.isPlayer),
        null,
        { timeout: 20000 }
      );
      await page.keyboard.press('p');
      await page.waitForFunction(
        () =>
          __battle__._roster.us.concat(__battle__._roster.ge).filter(s => s.isPlayer).length === 1 &&
          __battle__.scene.activeCamera?.name === 'playerCam',
        null,
        { timeout: 15000 }
      );
      await page.waitForTimeout(150);
      await sample('restarted-' + (i + 1));
    }

    const final = samples[samples.length - 1],
      growth = final.collectedHeapBytes - baseline.collectedHeapBytes,
      peak = Math.max(...samples.map(s => s.collectedHeapBytes)),
      totalWallSeconds = (final.wallMs - baseline.wallMs) / 1000,
      report = { cycles: CYCLES, dwellMs: DWELL_MS, totalWallSeconds, growth, peak, samples, restarts, errors };
    fs.writeFileSync(path.join(OUT, 'camera-soak.json'), JSON.stringify(report, null, 2));
    assert.equal(errors.length, 0, 'browser errors: ' + errors.slice(0, 3).join(' | '));
    assert.ok(
      growth < MAX_HEAP_GROWTH_BYTES,
      'collected JS heap increased ' + (growth / 1048576).toFixed(1) + ' MiB in bounded camera soak'
    );
    assert.ok(
      final.allObservers <= baseline.allObservers + 4,
      'unbounded scene-observer growth (' + baseline.allObservers + ' -> ' + final.allObservers + ')'
    );
    console.log(
      'PASS #456 R2 rendered camera soak: ' +
        CYCLES +
        ' full live same-page restarts, ' +
        totalWallSeconds.toFixed(1) +
        's wall, collected JS heap delta ' +
        (growth / 1048576).toFixed(1) +
        ' MiB; FPS/mesh/observer samples in camera-soak.json'
    );
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error('CAMERA R2 SOAK FAIL', (e && e.stack) || e);
  process.exit(1);
});
