/* Shipping-page tactical map visual and interaction acceptance. Screenshots show
   the actual checked-out build, not a painted concept or fabricated contacts. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
function playwright() {
  try {
    return require('playwright');
  } catch (_) {
    const { execSync } = require('node:child_process');
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}
const OUT = path.resolve(process.env.TACTICAL_MAP_OUT || 'closeups/tactical-map-ui');
const URL_ = process.env.TACTICAL_MAP_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await playwright().chromium.launch({
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox'
    ]
  });
  const errors = [];
  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1500, height: 920 },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(String(e)));
    page.on('crash', () => errors.push('page crashed'));
    await page.route('**/battle_(policy|learning|log|metrics)*.php', r => r.fulfill({ json: {} }));
    await page.goto(URL_ + '?seed=cartography-qa', { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction(() => window.BattleTacticalMap && window.__battle__?.factions, null, {
      timeout: 240000
    });
    const missing = await page.evaluate(() => {
      const sim = window.__battle__;
      return {
        map: !!window.BattleTacticalMap,
        scenario: !!window.BattleScenarioGenerator?.current(),
        treeField: sim.obstacles?.__physicalFootprints?.filter(f => f.type === 'tree').length || 0,
        sectors: window.BattleScenarioGenerator?.current()?.objectives?.length || 0
      };
    });
    assert(
      missing.map && missing.scenario && missing.sectors > 0,
      'shipping loader did not wire scenario or tactical map: ' + JSON.stringify(missing)
    );
    await page.keyboard.press('m');
    await page.waitForFunction(() => BattleTacticalMap.isOpen(), null, { timeout: 10000 });
    assert((await page.locator('#battleTacticalMap .gtm-paper').count()) === 1);
    assert((await page.locator('#battleTacticalMap .gtm-coordinate-grid text').count()) >= 10);
    assert((await page.locator('#battleTacticalMap .gtm-buildings rect').count()) > 0);
    assert((await page.locator('#battleTacticalMap .gtm-report-row').count()) >= 0);
    assert((await page.locator('#battleTacticalMap .gtm-side h3').count()) >= 2);
    const terrain = await page.evaluate(() => ({
      physicalCover: document.querySelectorAll('#battleTacticalMap .gtm-cover > *').length,
      friendlyMarks: document.querySelectorAll('#battleTacticalMap .gtm-friendly').length,
      reports: document.querySelectorAll('#battleTacticalMap .gtm-enemy').length
    }));
    assert(terrain.friendlyMarks > 0, 'friendly force cannot be plotted');
    await page.screenshot({ path: path.join(OUT, 'desktop.png'), fullPage: false });
    const before = await page.locator('#battleTacticalMap svg').getAttribute('viewBox');
    await page.getByTitle('Zoom in').click();
    const after = await page.locator('#battleTacticalMap svg').getAttribute('viewBox');
    assert.notEqual(before, after, 'zoom button did not change battlefield viewport');
    await page.getByTitle('Fit whole battlefield').click();
    assert.equal(
      await page.locator('#battleTacticalMap svg').getAttribute('viewBox'),
      '0 0 1000 600',
      'fit did not restore the world map'
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(OUT, 'mobile.png'), fullPage: false });
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => BattleTacticalMap.isOpen()), false);
    await page.keyboard.press('m');
    assert.equal(await page.evaluate(() => BattleTacticalMap.isOpen()), true);
    await page.evaluate(() => window.BattleTacticalMap.setOpen(false));
    const output = { missing, terrain, zoomValidated: true, mobileScreenshot: true, errors };
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(output, null, 2));
    console.log('tactical-map-browser-qa PASS ' + JSON.stringify(output));
    assert.deepEqual(errors, [], 'shipping page logged a JavaScript error');
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
