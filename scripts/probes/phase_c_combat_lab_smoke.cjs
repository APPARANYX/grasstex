'use strict';
/* Hosted preview smoke: real browser, real native BattleSim. No acceptance bypass or synthetic behavior. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

(async () => {
  const base = process.env.PHASE_C_LAB_URL ||
    'https://test.ivandpopov.com/grasstex/preview/phase-c-native-combat-lab/battle_sim.php';
  const out = 'reports/phase-c-lab';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });
  const errors = [];
  const results = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
    page.setDefaultTimeout(180000);
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', message => {
      if (message.type() === 'error' && !/texture|audio|failed to load resource|fbx/i.test(message.text()))
        errors.push(message.text());
    });
    for (const preset of ['C', 'F', 'E']) {
      const params = new URLSearchParams({
        combatLab: '1', labPreset: preset, defender: 'ge',
        seed: 'phase-c-natural-20261012-0015', localPlan: '1', localAmbush: '1',
        localManeuver: '1', coveredBounds: '1', fireCoverCycle: '1', squadReturnFire: '1'
      });
      await page.goto(base + '?' + params.toString(), { waitUntil: 'domcontentloaded', timeout: 180000 });
      await page.waitForFunction(() =>
        !!(window.__battle__ && window.PhaseCCombatLab &&
          document.getElementById('phaseCLab') &&
          window.BattleDesktopCamera.current &&
          window.__battle__._roster.us.length === 20 &&
          window.__battle__._roster.ge.length === 10), null, { timeout: 180000 });
      const initial = await page.evaluate(() => {
        const b = window.__battle__, lab = window.PhaseCCombatLab;
        return { preset: lab.preset, fieldW: BattleSim.FIELD_W, fieldD: BattleSim.FIELD_D,
          us: b._roster.us.length, ge: b._roster.ge.length, paused: b.paused,
          camera: b.scene.activeCamera.name, preview: !!window.BATTLE_PREVIEW,
          seed: b.scene.metadata.battleScenario.seed,
          metadataSize: b.scene.metadata.battleScenario.map };
      });
      assert.equal(initial.preset, preset, 'correct early native intervention');
      assert.equal(initial.fieldW, 280, 'compact native geometry width');
      assert.equal(initial.fieldD, 240, 'compact native geometry depth');
      assert.equal(initial.metadataSize.width, 280);
      assert.equal(initial.metadataSize.depth, 240);
      assert.equal(initial.us, 20);
      assert.equal(initial.ge, 10);
      assert.equal(initial.paused, true);
      assert.match(initial.camera, /phase-c-overhead/);
      assert.equal(initial.preview, true);
      assert.equal(initial.seed, 'phase-c-natural-20261012-0015');
      const preCheck = await page.evaluate(() => {
        const b = window.__battle__, lab = window.PhaseCCombatLab;
        const ge = b._roster.ge[0], us = b._roster.us[0];
        const start = { x: ge.root.position.x, z: ge.root.position.z };
        const blocked = lab.blockShot(ge, b, 'smoke');
        const immortalGE = lab.preventWound(us, ge, b, { zone: 'chest' });
        const immortalUS = lab.preventWound(ge, us, b, { zone: 'chest' });
        for (let i = 0; i < 8; i++) b.step(0.15);
        const end = { x: ge.root.position.x, z: ge.root.position.z };
        return { blocked, immortalGE, immortalUS, start, end,
          shots: lab.snapshot().counts.shots, time: b.time };
      });
      assert.equal(preCheck.blocked, preset === 'C' || preset === 'F');
      assert.equal(preCheck.immortalGE, preset === 'F' || preset === 'E');
      assert.equal(preCheck.immortalUS, preset === 'E');
      if (preset === 'F') assert.deepEqual(preCheck.end, preCheck.start, 'German physically stationary');
      if (preset === 'C' || preset === 'F')
        assert.equal(preCheck.shots.ge, 0, 'no native German shot callback');
      const ui = await page.locator('#labStatus').textContent();
      assert.match(ui, /US squads/i);
      await page.screenshot({ path: out + '/native-' + preset + '.png', fullPage: false });
      results.push({ ...initial, ...preCheck, uiPresent: true });
    }
    assert.deepEqual(errors, [], 'no browser page or console errors');
    fs.writeFileSync(out + '/smoke-result.json', JSON.stringify({ results, errors }, null, 2));
    console.log('PASS native compact lab three-preset browser smoke: ' + JSON.stringify(results));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
