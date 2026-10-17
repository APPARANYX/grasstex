#!/usr/bin/env node
'use strict';
/* Hosted strategic preview acceptance (read-only). Loads the published branch preview with the
   strategic flags and checks: the served build is the expected commit, the truck FBX is fetched
   with HTTP 200 and all 12 parked trucks have ready meshes, the field is 5 km, the 5 km Shift/RB
   fast-flight speed is 420, the fullscreen tactical map opens, the Request Air Recon control
   exists, and each faction map shows only its own General's air report.
   PREVIEW_URL (battle_sim.php of the preview), PREVIEW_SHA (expected full or short SHA). */
const assert = require('node:assert/strict');
const path = require('node:path');
const { execSync } = require('node:child_process');
function playwright() {
  try {
    return require('playwright');
  } catch (_) {
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}
const url = process.env.PREVIEW_URL;
const sha = (process.env.PREVIEW_SHA || '').slice(0, 7);
const flags = 'strategicInterception=1&motorTransport=1&aerialRecon=1&interception=1';
(async () => {
  assert.ok(url && sha, 'PREVIEW_URL and PREVIEW_SHA are required');
  const browser = await playwright().chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });
  const errors = [],
    fbx = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('pageerror', e => errors.push(String(e).slice(0, 400)));
    page.on('response', r => {
      if (/\/Assets\/vehicles\/[^?]*\.fbx/i.test(r.url())) fbx.push({ url: r.url(), status: r.status() });
    });
    await page.route('**/*', route =>
      route.request().method() === 'POST' ? route.fulfill({ json: {} }) : route.continue()
    );
    const response = await page.goto(url + '?' + flags + '&seed=hosted-preview-qa', {
      waitUntil: 'load',
      timeout: 300000
    });
    const html = await response.text();
    assert.ok(html.includes('preview-' + sha), 'served page is not build ' + sha);
    const camera = await (await page.request.get(new URL('battle/camera-controls.js', url).href)).text();
    assert.match(
      camera,
      /FIELD_W >= 5000 \? 420 : 175/,
      'served camera code lacks the 420 fast-flight speed'
    );
    await page.waitForFunction(
      () =>
        window.__battle__?.factions &&
        window.BattleTransportVehicleVisual &&
        window.BattleTacticalMap &&
        window.BattleAerialRecon,
      null,
      { timeout: 240000 }
    );
    await page.waitForFunction(
      () => {
        const s = window.BattleTransportVehicleVisual.summary(window.__battle__);
        return s.length === 12 && s.every(v => v.meshReady);
      },
      null,
      { timeout: 240000 }
    );
    const world = await page.evaluate(() => ({
      fieldW: window.BattleSim.FIELD_W,
      fieldD: window.BattleSim.FIELD_D,
      profile: window.__battle__.scene.metadata.battleScenario.profile,
      fleet: window.BattleSquadTransport.fleetSummary(window.__battle__).length,
      perBase: ['us', 'ge'].map(f =>
        [0, 1, 2].map(
          i =>
            window.BattleSquadTransport.fleetSummary(window.__battle__).filter(v =>
              v.id.startsWith(f + '-base-' + i + '-')
            ).length
        )
      ),
      minimap: !!document.getElementById('strategicMapPanel'),
      reconButton: !!document.getElementById('battleRequestAirRecon')
    }));
    assert.equal(world.profile, 'strategic');
    assert.equal(world.fieldW, 5000, '5 km field width');
    assert.equal(world.fleet, 12, 'twelve starting trucks');
    assert.deepEqual(world.perBase, [
      [2, 2, 2],
      [2, 2, 2]
    ]);
    assert.equal(world.minimap, false, 'old always-visible minimap removed');
    assert.ok(world.reconButton, 'Request Air Recon control present');
    assert.ok(fbx.length && fbx.every(f => f.status === 200), 'truck FBX fetch: ' + JSON.stringify(fbx));
    await page.locator('#startBtn').click();
    await page.waitForFunction(() => window.__battle__.time >= 8, null, { timeout: 120000 });
    await page.keyboard.press('m');
    await page.waitForFunction(() => window.BattleTacticalMap.isOpen(), null, { timeout: 10000 });
    const side = page.locator('select[aria-label="Friendly intelligence perspective"]');
    await side.selectOption('us');
    await page.waitForFunction(() => !document.getElementById('battleRequestAirRecon').disabled, null, {
      timeout: 20000
    });
    await page.locator('#battleRequestAirRecon').click();
    const intel = await page.evaluate(() => {
      const b = window.__battle__,
        A = window.BattleAerialRecon,
        us = A.forGeneral(b, 'us'),
        ge = A.forGeneral(b, 'ge');
      return {
        time: b.time,
        usUsed: A.status(b, 'us').used,
        usContacts: us ? us.contacts.length : 0,
        usContactFactions: us ? [...new Set(us.contacts.map(c => String(c.squadId).split('-')[0]))] : [],
        geUsed: A.status(b, 'ge').used,
        geContacts: ge ? ge.contacts.length : 0,
        usFixes: document.querySelectorAll('#battleTacticalMap .gtm-air-fix').length,
        button: document.getElementById('battleRequestAirRecon').textContent
      };
    });
    await side.selectOption('ge');
    await page.waitForTimeout(500);
    intel.geFixesOnGeMap = await page.evaluate(
      () => document.querySelectorAll('#battleTacticalMap .gtm-air-fix').length
    );
    assert.ok(
      intel.usUsed && intel.usContacts > 0 && intel.usFixes > 0,
      'US sortie produced plotted reports'
    );
    assert.deepEqual(intel.usContactFactions, ['ge'], 'US report holds only German contacts');
    if (!intel.geUsed) assert.equal(intel.geFixesOnGeMap, 0, 'US air report leaked onto the German map');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => window.BattleTacticalMap.isOpen()), false, 'map closes');
    const result = { sha, world, fbx, intel, errors };
    console.log('hosted-strategic-preview PASS ' + JSON.stringify(result));
    assert.deepEqual(errors, [], 'page logged a JavaScript error');
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
