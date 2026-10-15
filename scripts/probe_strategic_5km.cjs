'use strict';
/* Real Chromium/hosted PHP smoke for the opt-in 5 km terrain. No synthetic Babylon stubs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
function playwright() {
  try {
    return require('playwright');
  } catch (_) {
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}
const base = process.env.STRATEGIC_QA_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const out = path.resolve(process.env.STRATEGIC_QA_OUT || 'closeups/strategic-5km-ci');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { chromium } = playwright();
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
      '--enable-webgl', '--ignore-gpu-blocklist', '--ignore-certificate-errors', '--no-sandbox']
  });
  try {
    const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1360, height: 820 } });
    /* The public repository intentionally excludes private mastered audio. In
       standalone CI only, serve a valid silent PCM WAV on .mp3 asset requests.
       Preserve the strict zero-uncaught-errors assertion for all game code. */
    const audioSamples = 2205;
    const silentAudio = Buffer.alloc(44 + audioSamples * 2);
    silentAudio.write('RIFF', 0);
    silentAudio.writeUInt32LE(36 + audioSamples * 2, 4);
    silentAudio.write('WAVE', 8);
    silentAudio.write('fmt ', 12);
    silentAudio.writeUInt32LE(16, 16);
    silentAudio.writeUInt16LE(1, 20);
    silentAudio.writeUInt16LE(1, 22);
    silentAudio.writeUInt32LE(22050, 24);
    silentAudio.writeUInt32LE(44100, 28);
    silentAudio.writeUInt16LE(2, 32);
    silentAudio.writeUInt16LE(16, 34);
    silentAudio.write('data', 36);
    silentAudio.writeUInt32LE(audioSamples * 2, 40);
    let mockedPrivateAudio = 0;
    await page.route(/\/Assets\/audio\/.*\.mp3(?:\?.*)?$/, (route) => {
      mockedPrivateAudio++;
      return route.fulfill({ status: 200, contentType: 'audio/wav', body: silentAudio });
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e && e.stack || e).slice(0, 900)));
    const url = base + (base.includes('?') ? '&' : '?') +
      'strategicInterception=1&seed=strategic-chromium-0001&log=0';
    const start = Date.now();
    await page.goto(url, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!(window.__battle__ && window.__scenario__), null, { timeout: 180000 });
    const bootMs = Date.now() - start;
    const report = await page.evaluate(() => {
      const b = window.__battle__, s = window.__scenario__;
      const ground = b.scene.getMeshByName('battleField');
      const bounds = ground.getBoundingInfo().boundingBox;
      const factions = {};
      for (const f of ['us', 'ge']) {
        const squads = b.factions[f].squads;
        factions[f] = {
          squads: squads.length,
          soldiers: b._roster[f].length,
          bases: squads.map((sq) => sq.homeBaseId),
          homes: squads.map((sq) => ({ x: sq.home.x, z: sq.home.z }))
        };
      }
      return {
        profile: s.profile,
        map: s.map,
        objectives: s.objectives.length,
        roads: s.roads.length,
        buildings: s.buildings.length,
        terrainVertices: ground.getTotalVertices(),
        terrainBounds: { minX: bounds.minimum.x, maxX: bounds.maximum.x,
          minZ: bounds.minimum.z, maxZ: bounds.maximum.z },
        obstacles: b.obstacles.length,
        navScenario: !!(window.BattleNavigation && window.BattleNavigation.scenario === s),
        cameraMaxZ: b.scene.activeCamera.maxZ,
        timeLimit: b.timeLimit,
        factions,
        fps: b.scene.getEngine().getFps(),
        heap: performance.memory ? performance.memory.usedJSHeapSize : null
      };
    });
    report.bootMs = bootMs;
    report.audioFixture = 'silent PCM for private audio files omitted from public checkout';
    report.mockedPrivateAudio = mockedPrivateAudio;
    assert.equal(report.profile, 'strategic');
    assert.equal(report.map.width, 5000);
    assert.equal(report.map.depth, 5000);
    assert.equal(report.objectives, 12);
    assert.equal(report.roads, 21);
    assert.equal(report.timeLimit, 1800);
    assert.ok(report.buildings >= 8);
    assert.ok(report.terrainVertices >= 80000);
    assert.ok(report.navScenario, 'installed same scenario in physics and navigation');
    assert.ok(report.terrainBounds.minX <= -2499 && report.terrainBounds.maxX >= 2499);
    assert.ok(report.terrainBounds.minZ <= -2499 && report.terrainBounds.maxZ >= 2499);
    assert.ok(report.cameraMaxZ >= 9000);
    for (const f of ['us', 'ge']) {
      const side = report.factions[f];
      assert.equal(side.squads, 5);
      assert.equal(side.soldiers, 50);
      assert.equal(new Set(side.bases).size, 3, 'three distinct spawn locations');
      assert.ok(side.homes.every((p) => Math.abs(p.x) <= 2500 && Math.abs(p.z) <= 2500));
    }
    await page.screenshot({ path: path.join(out, 'strategic-overview.png') });
    await page.evaluate(() => window.__battle__.resume());
    await page.waitForTimeout(5000);
    report.simTimeAfterFiveSeconds = await page.evaluate(() => window.__battle__.time);
    report.fpsAfterFiveSeconds = await page.evaluate(() => window.__battle__.scene.getEngine().getFps());
    assert.ok(report.simTimeAfterFiveSeconds > 0, 'simulation advances under real Chromium');
    assert.deepEqual(errors, [], 'no uncaught page errors');
    fs.writeFileSync(path.join(out, 'strategic-report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log('STRATEGIC CHROMIUM PASS ' + JSON.stringify(report));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error('STRATEGIC CHROMIUM FAIL', e && e.stack || e);
  process.exit(1);
});
