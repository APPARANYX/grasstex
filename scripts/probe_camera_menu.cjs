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
    // Free-fly keyboard movement is independent of gamepad; route through the
    // scene frame observable, not a one-off synthetic API.
    await page.evaluate(() => {
      const canvas = window.BattleDesktopCamera.current.camera.getEngine().getRenderingCanvas();
      canvas.tabIndex = 0;
      canvas.focus();
    });
    const flyStart = await page.evaluate(() => BattleDesktopCamera.current.camera.position.asArray());
    await page.keyboard.down('w');
    await page.waitForTimeout(380);
    await page.keyboard.up('w');
    const flyEnd = await page.evaluate(() => BattleDesktopCamera.current.camera.position.asArray());
    assert.ok(Math.hypot(...flyStart.map((n, i) => n - flyEnd[i])) > 0.05,
      'W free-fly keyboard movement did not move the camera');
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
    await page.keyboard.press('v');
    await page.waitForFunction(() => {
      const b = window.__battle__;
      return b && b._roster && !(b._roster.us || []).some(s => s.isPlayer);
    }, null, { timeout: 15000 });
    const state = await page.evaluate(() => ({
      build: window.BATTLE_BUILD_DEPLOYED || null,
      camera: window.BattleDesktopCamera?.current?.camera?.name || null,
      playerTab: document.getElementById('bpmTabPlayer').getAttribute('aria-selected'),
      menuHidden: getComputedStyle(document.getElementById('battlePlayerSettings')).display === 'none'
    }));
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify({state, errors, notes: notes.slice(-20)}, null, 2));
    assert.equal(errors.length, 0, 'page errors: ' + errors.slice(0, 5).join(' | '));
    console.log('PASS #456 R2 player menu: open/close, tab switching, native fields, haptics and live audio mix ' + JSON.stringify(state));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error('CAMERA MENU PROBE FAIL', e && e.stack || e); process.exit(1); });
