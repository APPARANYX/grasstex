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
const fs = require('node:fs');
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
    const target = new URL(url);
    for (const [key, value] of new URLSearchParams(flags)) target.searchParams.set(key, value);
    target.searchParams.set('seed', process.env.PREVIEW_SEED || 'hosted-preview-qa');
    target.searchParams.set('pinSeed', '1');
    const response = await page.goto(target.href, {
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
    console.log('hosted-strategic-preview: battle ready');
    await page
      .waitForFunction(
        () => {
          const s = window.BattleTransportVehicleVisual.summary(window.__battle__);
          return s.length === 12 && s.every(v => v.meshReady);
        },
        null,
        { timeout: 240000 }
      )
      .catch(async error => {
        console.error(
          'truck readiness',
          JSON.stringify(
            await page.evaluate(() => ({
              time: window.__battle__.time,
              fleet: BattleSquadTransport.fleetSummary(window.__battle__),
              visuals: BattleTransportVehicleVisual.summary(window.__battle__)
            }))
          ),
          JSON.stringify({ fbx, errors })
        );
        throw error;
      });
    console.log('hosted-strategic-preview: twelve truck meshes ready');
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
    let transportDebug = null;
    if (process.env.PREVIEW_TRANSPORT_QA === '1') {
      await page.evaluate(() => {
        window.__battle__.timeScale = 4;
      });
      await page.waitForFunction(
        () =>
          window.__battle__.time >= 60 &&
          BattleSquadTransport.summary(window.__battle__).some(t => t.phase === 'embarked'),
        null,
        { timeout: 120000 }
      );
      transportDebug = await page.evaluate(() => {
        const b = window.__battle__;
        b.pause();
        const passengers = [...b._roster.us, ...b._roster.ge].filter(
          s => !s.dead && BattleSquadTransport.isPassenger(s)
        );
        const staleCaches = passengers.filter(s => s._physicalPath || s._navCache).map(s => s.id);
        for (const setting of ['paths', 'waypoints', 'destinations']) BattleWorldDebug.set(setting, true);
        BattleWorldDebug.refresh();
        let longestEdge = 0;
        for (const name of ['wd-dyn-path-us', 'wd-dyn-path-ge']) {
          const mesh = b.scene.getMeshByName(name);
          if (!mesh) continue;
          const p = mesh.getVerticesData('position'),
            indices = mesh.getIndices();
          for (let i = 0; i < indices.length; i += 2) {
            const a = indices[i] * 3,
              c = indices[i + 1] * 3;
            longestEdge = Math.max(longestEdge, Math.hypot(p[a] - p[c], p[a + 2] - p[c + 2]));
          }
        }
        const trip = BattleSquadTransport.summary(b).find(t => t.phase === 'embarked');
        const truck = BattleSquadTransport.fleetSummary(b).find(v => v.id === trip.vehicleId);
        const p = truck.position,
          y = b.heightAt(p.x, p.z);
        b.scene.activeCamera.position.set(p.x + 24, y + 18, p.z - 28);
        b.scene.activeCamera.setTarget(new BABYLON.Vector3(p.x, y + 1, p.z));
        return { time: b.time, passengers: passengers.length, staleCaches, longestEdge, vehicle: truck.id };
      });
      assert.ok(transportDebug.passengers >= 5, 'check actual live passengers');
      assert.deepEqual(transportDebug.staleCaches, [], 'boarding must release suspended infantry caches');
      assert.ok(
        transportDebug.longestEdge <= 150,
        'rolling infantry routes cannot stretch back from moving trucks'
      );
      const out = path.resolve(process.env.PREVIEW_OUT || 'closeups/strategic-transport-native');
      fs.mkdirSync(out, { recursive: true });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(out, 'embarked-debug.png') });
      fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(transportDebug, null, 2));
    }
    const result = { sha, world, fbx, intel, transportDebug, errors };
    console.log('hosted-strategic-preview PASS ' + JSON.stringify(result));
    assert.deepEqual(errors, [], 'page logged a JavaScript error');
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
