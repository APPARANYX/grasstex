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
  const failedRequests = [];
  const recentConsole = [];
  const results = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
    page.setDefaultTimeout(180000);
    page.on('pageerror', e => errors.push(e.message));
    page.on('requestfailed', request => {
      if (failedRequests.length < 50) failedRequests.push({ url: request.url(), error: request.failure() });
    });
    page.on('console', message => {
      if (recentConsole.length >= 80) recentConsole.shift();
      recentConsole.push(message.type() + ': ' + message.text().slice(0, 400));
    });
    page.on('console', message => {
      if (message.type() === 'error' && !/texture|audio|failed to load resource|fbx/i.test(message.text()))
        errors.push(message.text());
    });
    // Paired preset/range checks establish actual weapon and perception scaling.
    for (const [preset, rangeScale] of [['C', 0.5], ['F', 0.25], ['E', 1]]) {
      const params = new URLSearchParams({
        combatLab: '1', labPreset: preset, labRange: String(rangeScale), defender: 'ge',
        seed: 'phase-c-natural-20261012-0015', localPlan: '1', localAmbush: '1',
        localManeuver: '1', coveredBounds: '1', fireCoverCycle: '1', squadReturnFire: '1'
      });
      await page.goto(base + '?' + params.toString(), { waitUntil: 'domcontentloaded', timeout: 180000 });
      try {
        await page.waitForFunction(() =>
          !!(window.__battle__ && window.PhaseCCombatLab &&
            document.getElementById('phaseCLab') &&
            window.BattleDesktopCamera.current &&
            window.__battle__._roster.us.length === 20 &&
            window.__battle__._roster.ge.length === 10), null, { timeout: 75000 });
      } catch (e) {
        const boot = await page.evaluate(() => ({
          href: location.href, title: document.title,
          preview: window.BATTLE_PREVIEW || null,
          earlyFlag: window.PHASE_C_COMBAT_LAB || null,
          nativeWidth: window.BattleSim && BattleSim.FIELD_W,
          nativeDepth: window.BattleSim && BattleSim.FIELD_D,
          lab: !!window.PhaseCCombatLab, labPanel: !!document.getElementById('phaseCLab'),
          camera: window.BattleDesktopCamera && BattleDesktopCamera.current &&
            BattleDesktopCamera.current.camera && BattleDesktopCamera.current.camera.name,
          battle: window.__battle__ ? {
            time: window.__battle__.time,
            us: window.__battle__._roster.us.length,
            ge: window.__battle__._roster.ge.length
          } : null,
          loadError: document.getElementById('loadError') && document.getElementById('loadError').textContent,
          debug: document.getElementById('debugConsole') &&
            document.getElementById('debugConsole').textContent.slice(-10000),
          body: document.body && document.body.innerText.slice(0, 1500)
        }));
        const diag = { error: String(e), preset, boot, errors, failedRequests, recentConsole };
        fs.writeFileSync(out + '/failed-bootstrap-' + preset + '.json', JSON.stringify(diag, null, 2));
        try { await page.screenshot({ path: out + '/failed-bootstrap-' + preset + '.png' }); } catch (_) {}
        console.error('PHASE_C_LAB_BOOT_DIAG ' + JSON.stringify(diag));
        throw e;
      }
      const initial = await page.evaluate(() => {
        const b = window.__battle__, lab = window.PhaseCCombatLab;
        return { preset: lab.preset, fieldW: BattleSim.FIELD_W, fieldD: BattleSim.FIELD_D,
          us: b._roster.us.length, ge: b._roster.ge.length, paused: b.paused,
          camera: b.scene.activeCamera.name, preview: !!window.BATTLE_PREVIEW,
          seed: b.scene.metadata.battleScenario.seed,
          metadataSize: b.scene.metadata.battleScenario.map,
          rangeScale: lab.rangeScale,
          rangeSelected: document.querySelector('#labRange').value,
          weapon: (() => {
            const soldier = b._roster.us[0];
            const reference = BattleWeapons.profileStats(soldier.weapon.kind, soldier.faction);
            return { kind: soldier.weapon.kind, actualRange: soldier.weapon.stats.range,
              baseRange: reference.range, actualFalloff: soldier.weapon.stats.falloffStart,
              baseFalloff: reference.falloffStart,
              actualAutoWithin: soldier.weapon.stats.autoWithin || 0,
              baseAutoWithin: reference.autoWithin || 0 };
          })(),
          vision: (() => {
            const soldier = b._roster.us[0], target = b._roster.ge[0];
            const actual = SquadAI.detectionRange(SquadAI.ROLES[soldier.role], target);
            const ref = SquadAI.ROLES[soldier.role].visionRange;
            return { actual, ref };
          })()
        };
      });
      assert.equal(initial.preset, preset, 'correct early native intervention');
      assert.equal(initial.rangeScale, rangeScale, 'lab reads range scale before spawn');
      assert.equal(initial.rangeSelected, String(rangeScale), 'range dropdown remains in sync');
      assert.ok(Math.abs(initial.weapon.actualRange - initial.weapon.baseRange * rangeScale) < 1e-6,
        'issued native weapon range scales without mutating shared profile');
      assert.ok(Math.abs(initial.weapon.actualFalloff - initial.weapon.baseFalloff * rangeScale) < 1e-6,
        'weapon accuracy falloff starts at scaled range');
      if (initial.weapon.baseAutoWithin > 0)
        assert.ok(Math.abs(initial.weapon.actualAutoWithin - initial.weapon.baseAutoWithin * rangeScale) < 1e-6,
          'auto selector follows scaled engagement distance');
      assert.ok(initial.vision.actual > 0 && initial.vision.actual <= initial.vision.ref * 1.25 * rangeScale,
        'native visual detection respects range scale');
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
      const report = await page.evaluate(() => window.PhaseCCombatLab.snapshot());
      assert.equal(report.rangeScale, rangeScale, 'export preserves experimental range multiplier');
      assert.equal(report.soldiers[0].weaponRange, initial.weapon.actualRange,
        'export includes actual scaled weapon reach');
      const preCheck = await page.evaluate(() => {
        const b = window.__battle__, lab = window.PhaseCCombatLab;
        const ge = b._roster.ge[0], us = b._roster.us[0];
        const start = { x: ge.root.position.x, z: ge.root.position.z };
        const blocked = lab.blockShot(ge, b, 'smoke');
        const immortalGE = lab.preventWound(us, ge, b, { zone: 'chest' });
        const immortalUS = lab.preventWound(ge, us, b, { zone: 'chest' });
        b.resume();
        for (let i = 0; i < 8; i++) b.step(0.15);
        b.pause();
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
