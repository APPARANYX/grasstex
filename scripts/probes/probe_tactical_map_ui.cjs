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
const OUT = path.resolve(process.env.TACTICAL_MAP_OUT || 'closeups/tactical-map-ui');
const URL_ = process.env.TACTICAL_MAP_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const strategic = process.env.TACTICAL_MAP_MODE === 'strategic';
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
    const silence = silentWav();
    await page.route('**/*', route => {
      const req = route.request();
      if (req.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(req.url()))
        return route.fulfill({ json: {} });
      if (/\/Assets\/audio\/.*\.(?:mp3|wav|ogg)(?:[?#]|$)/i.test(req.url()))
        return route.fulfill({ status: 200, body: silence, contentType: 'audio/wav' });
      return route.continue();
    });
    const flags = strategic ? '?strategicInterception=1&motorTransport=1&aerialRecon=1&interception=1' : '';
    await page.goto(URL_ + (flags || '?') + (flags ? '&' : '') + 'seed=cartography-qa', {
      waitUntil: 'load', timeout: 300000
    });
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
    if (strategic) {
      const checks = await page.evaluate(() => ({
        strategic: window.__battle__?.scene?.metadata?.battleScenario?.profile === 'strategic',
        removedMinimap: !document.getElementById('strategicMapPanel'),
        reconLoaded: !!window.BattleAerialRecon
      }));
      assert.ok(checks.strategic && checks.removedMinimap && checks.reconLoaded,
        'strategic world must load full map and aerial recon without legacy minimap');
    }
    await page.keyboard.press('m');
    await page.waitForFunction(() => BattleTacticalMap.isOpen(), null, { timeout: 10000 });
    assert((await page.locator('#battleTacticalMap .gtm-paper').count()) === 1);
    assert((await page.locator('#battleTacticalMap .gtm-coordinate-grid text').count()) >= 10);
    assert((await page.locator('#battleTacticalMap .gtm-buildings rect').count()) > 0);
    assert(
      (await page.locator('#battleTacticalMap .gtm-objective-row').count()) > 0,
      'scenario objective names must appear in the field-objective roster'
    );
    assert((await page.locator('#battleTacticalMap .gtm-side h3').count()) >= 2);
    const terrain = await page.evaluate(() => ({
      physicalCover: document.querySelectorAll('#battleTacticalMap .gtm-cover > *').length,
      friendlyMarks: document.querySelectorAll('#battleTacticalMap .gtm-friendly').length,
      reports: document.querySelectorAll('#battleTacticalMap .gtm-enemy').length
    }));
    assert(terrain.friendlyMarks > 0, 'friendly force cannot be plotted');
    if (strategic) {
      assert.equal(await page.locator('#battleRequestAirRecon').count(), 1,
        'player-visible General air recon action exists');
      assert.equal(await page.locator('#battleRequestAirRecon').isDisabled(), true,
        'paused battle cannot silently waste a sortie');
      await page.evaluate(() => document.getElementById('startBtn').click());
      await page.waitForFunction(() => window.__battle__?.time >= 8, null, { timeout: 35000 });
      await page.waitForFunction(() => !document.getElementById('battleRequestAirRecon').disabled, null,
        { timeout: 12000 });
      await page.locator('#battleRequestAirRecon').click();
      const data = await page.evaluate(() => {
        const sim = window.__battle__, A = window.BattleAerialRecon,
          faction = document.querySelector('select[aria-label="Friendly intelligence perspective"]').value;
        return {used: A.status(sim,faction).used, live: !!A.forGeneral(sim,faction),
          observed: A.status(sim,faction).observedAt,
          button: document.getElementById('battleRequestAirRecon').textContent,
          spots: document.querySelectorAll('#battleTacticalMap .gtm-air-fix').length};
      });
      assert.ok(data.used && data.live && data.observed < 40 &&
        data.button.includes('EXPENDED'), 'map order must spend one real early General sortie');
      const after = await page.evaluate(() => window.BattleAerialRecon.status(
        window.__battle__,document.querySelector('select[aria-label="Friendly intelligence perspective"]').value
      ).used);
      assert.equal(after,true,'cannot request a second flight');
      console.log('STRATEGIC AIR RECON UI',JSON.stringify(data));
    }
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
