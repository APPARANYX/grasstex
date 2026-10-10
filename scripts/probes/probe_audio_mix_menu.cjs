#!/usr/bin/env node
'use strict';
/* Browser QA for Start-hold Player/Audio tabs and the live louder audio mix.
   AUDIO_MENU_PREVIEW_URL can point to a hosted preview.php?ref=branch URL.
   Uses a synthetic clip, never downloads/re-uploads licensed audio. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const BASE = process.env.AUDIO_MENU_PREVIEW_URL ||
  'https://test.ivandpopov.com/grasstex/battle_sim.php?seed=audio-mix-menu-qa';

(async function () {
  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=angle',
      '--use-angle=swiftshader', '--enable-webgl', '--ignore-certificate-errors']
  });
  try {
    const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1080, height: 740 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 90000 });
    try {
      await page.waitForFunction(() => window.__battle__ && window.BattleAudioMix &&
        window.BattleDesktopCamera?.current?.openPlayerSettings, null, { timeout: 75000 });
    } catch (err) {
      const diagnostics = await page.evaluate(() => ({
        url: location.href,
        title: document.title,
        battle: !!window.__battle__,
        mixer: !!window.BattleAudioMix,
        camera: !!window.BattleDesktopCamera,
        cameraMode: window.BattleDesktopCamera?.current?.mode || null,
        hasMenu: !!window.BattleDesktopCamera?.current?.openPlayerSettings,
        loadedScripts: Array.from(document.scripts).map(s => s.src).filter(s => /camera-controls|00a-audio-mix|battle-sim/.test(s)),
        body: (document.body?.innerText || '').slice(0, 900),
        loading: (document.querySelector('#loading')?.innerText || '').slice(0, 350)
      }));
      console.error('PREVIEW BOOT DIAGNOSTICS:', JSON.stringify(diagnostics));
      console.error('PAGE ERRORS:', errors.slice(0, 8));
      throw err;
    }

    await page.evaluate(() => {
      window.__mixTestPad = {
        id: 'Audio Menu QA Pad', mapping: 'standard', connected: true, index: 0,
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }))
      };
      Object.defineProperty(navigator, 'getGamepads', {
        configurable: true, value: () => [window.__mixTestPad]
      });
      window.BattleDesktopCamera.current.openPlayerSettings();
    });
    await page.waitForSelector('#battlePlayerSettings', { state: 'visible' });
    await page.waitForTimeout(140);
    const player = await page.evaluate(() => ({
      player: document.querySelector('#bpmPlayerPane').style.display,
      audio: document.querySelector('#bpmAudioPane').style.display,
      master: window.BattleAudioMix.get().master
    }));
    assert.equal(player.player, 'block', 'Start-hold still opens Player tab first');
    assert.equal(player.audio, 'none', 'Audio tab starts hidden');

    async function press(button) {
      await page.evaluate(n => {
        window.__mixTestPad.buttons[n].pressed = true;
        window.__mixTestPad.buttons[n].value = 1;
      }, button);
      await page.waitForTimeout(200);
      await page.evaluate(n => {
        window.__mixTestPad.buttons[n].pressed = false;
        window.__mixTestPad.buttons[n].value = 0;
      }, button);
      await page.waitForTimeout(200);
    }

    await press(5); // RB
    const tab = await page.evaluate(() => ({
      audio: document.querySelector('#bpmAudioPane').style.display,
      player: document.querySelector('#bpmPlayerPane').style.display,
      selected: document.querySelector('#bpmTabAudio').getAttribute('aria-selected')
    }));
    assert.deepEqual(tab, { audio: 'block', player: 'none', selected: 'true' }, 'RB opens Audio tab');
    await press(13); // D-pad down chooses Gunfire
    await press(15); // D-pad right, +5
    assert.equal(await page.locator('#bpmWeapons').inputValue(), '105', 'D-pad changes focused gunfire fader');
    await press(0); // A resets focused slider
    assert.equal(await page.locator('#bpmWeapons').inputValue(), '100', 'A resets focused fader');
    await page.locator('#bpmMaster').evaluate(el => {
      el.value = '135';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const values = await page.evaluate(() => ({
      storage: JSON.parse(localStorage.getItem('grasstex.audioMix.v1')),
      gain: window.BattleAudioMix.gain('weapon', 0.10),
      before: 0.10
    }));
    assert.equal(values.storage.master, 135, 'touch/mouse slider persisted');
    assert.ok(values.gain > values.before, 'stronger runtime weapon gain');
    await press(4); // LB returns to Player
    assert.equal(await page.locator('#bpmPlayerPane').evaluate(el => el.style.display), 'block', 'LB returns to Player');
    await press(1); // B closes
    assert.equal(await page.locator('#battlePlayerSettings').evaluate(el => el.style.display), 'none', 'B closes settings');

    const output = await page.evaluate(async () => {
      const ae = BABYLON.Engine.audioEngine, ctx = ae?.audioContext;
      if (!ctx) return { audioContext: false };
      if (ctx.state === 'suspended') await ctx.resume();
      const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const s = new BABYLON.Sound('audio-mix-test', buffer, __battle__.scene, null, {
        volume: 0.1, autoplay: false, spatialSound: true
      });
      s.setPosition(__battle__.scene.activeCamera.position);
      s.play();
      BattleAudioMix.ensureLimiter(__battle__.scene);
      const t0 = performance.now();
      while (BattleAudioMix.stats.routed === 0 && performance.now() - t0 < 8000) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      s.stop(); s.dispose();
      return { audioContext: true, routed: BattleAudioMix.stats.routed,
        unavailable: BattleAudioMix.stats.unavailable };
    });
    console.log('Menu and output graph:', JSON.stringify({ tab, values, output }));
    assert.equal(output.audioContext, true, 'Babylon AudioV2 context present');
    assert.equal(output.routed, 1, 'one output compressor added to main SoundTrack');
    assert.deepEqual(errors, [], 'no browser JS errors');
    console.log('PASS: Start menu LB/RB, D-pad, persistence, gain and output compressor');
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error('AUDIO-MENU PREVIEW FAIL:', e?.stack || e);
  process.exit(1);
});
