#!/usr/bin/env node
'use strict';
/* Live Babylon-9 compatibility smoke: one local listener, a synthetic spatial source,
   AudioV2 filter hookup, same-page restart and disabled-quality baseline.
   Run against the branch preview (not the localhost shader fallback).
   AUDIO_PREVIEW_URL defaults to preview.php?ref=work/lightweight-listener-acoustics.
   The probe makes its own buffer; licensed audio clips are not needed. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE = process.env.AUDIO_PREVIEW_URL ||
  'https://test.ivandpopov.com/grasstex/preview.php?ref=work%2Flightweight-listener-acoustics';

async function initialize(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => window.__battle__ && window.BattleListenerAcoustics,
    null, { timeout: 120000 });
  await page.getByText('Start battle').first().click({ timeout: 4000 }).catch(() => {});
  await page.evaluate(() => window.__battle__.pause());
}
async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=angle',
      '--use-angle=swiftshader', '--enable-webgl', '--ignore-certificate-errors']
  });
  try {
    const page = await browser.newPage({
      ignoreHTTPSErrors: true, viewport: { width: 900, height: 650 }
    });
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(String(err)));
    await initialize(page);
    const result = await page.evaluate(async () => {
      const a = window.BattleListenerAcoustics;
      const scene = window.__battle__.scene;
      const engine = window.BABYLON.Engine.audioEngine;
      if (!engine || !engine.audioContext) {
        return { ok: false, reason: 'Babylon Web Audio context unavailable' };
      }
      const ctx = engine.audioContext;
      if (ctx.state === 'suspended') await ctx.resume();
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.23), ctx.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++)
        samples[i] = Math.sin(i * 2 * Math.PI * 240 / ctx.sampleRate) *
          (1 - i / samples.length) * 0.14;
      const snd = new window.BABYLON.Sound('acoustic-browser-probe', buffer, scene,
        null, { spatialSound: true, autoplay: false, volume: 0.18 });
      const cam = scene.activeCamera;
      const c = cam.globalPosition || cam.position;
      const src = { x: c.x + 14, y: c.y, z: c.z + 3 };
      snd.setPosition(new window.BABYLON.Vector3(src.x, src.y, src.z));
      const accepted = a.prepare(snd, src, 'gun', 0.18, scene);
      const filtered = !!snd._battleAcousticFilter;
      const gain = snd.getSoundGain && snd.getSoundGain();
      snd.play();
      const original = snd._battleAcousticFilter;
      a.reset();
      a.prepare(snd, src, 'gun', 0.18, scene);
      const reused = snd._battleAcousticFilter === original;
      const snapshot = {
        ok: true,
        quality: a.quality, accepted, filtered, reused,
        hasGain: !!gain, isAudioV2: !!snd._soundV2,
        active: a.active, sampled: a.stats.sampled,
        graphNode: snd._battleAcousticFilter?.type || null
      };
      snd.stop();
      a.reset();
      snd.dispose();
      return snapshot;
    });
    console.log('Standard acoustic graph:', JSON.stringify(result));
    assert.equal(result.ok, true, result.reason || 'could not construct acoustic sound');
    assert.equal(result.quality, 'standard');
    assert.equal(result.accepted, true);
    assert.equal(result.hasGain, true);
    assert.equal(result.isAudioV2, true);
    assert.equal(result.filtered, true, 'real Babylon AudioV2 graph did not connect its lowpass');
    assert.equal(result.reused, true, 'filter was duplicated on restart');

    const staged = new URL(page.url());
    staged.searchParams.set('acoustics', 'off');
    staged.searchParams.set('seed', 'acoustic-probe-off');
    const off = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 480, height: 760 } });
    await off.goto(staged.href, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await off.waitForFunction(() => window.__battle__ && window.BattleListenerAcoustics,
      null, { timeout: 120000 });
    const disabled = await off.evaluate(() => {
      const a = window.BattleListenerAcoustics, b = window.__battle__;
      return { quality: a.quality, accepted: a.prepare({ setVolume() {} },
        { x: 0, y: 0, z: 0 }, 'gun', 0.18, b.scene), active: a.active };
    });
    console.log('Quality-off mobile viewport:', JSON.stringify(disabled));
    assert.deepEqual(disabled, { quality: 'off', accepted: false, active: 0 });
    if (pageErrors.length) throw new Error('Page JavaScript errors: ' + pageErrors.join('; '));
    await page.close();
    await off.close();
    console.log('PASS: real Babylon AudioV2 filtering, restart reuse, and dry/off mode');
  } finally {
    await browser.close();
  }
}
run().catch(err => { console.error('AUDIO PREVIEW PROBE FAILED:', err?.stack || err); process.exit(1); });
