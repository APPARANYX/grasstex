#!/usr/bin/env node
'use strict';
// Hosted, audible device diagnosis. Records metadata only; never exports audio.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const url = process.env.CHROME_AUDIO_URL;
if (!url || !/^https:\/\//.test(url)) throw Error('Provide the exact hosted CHROME_AUDIO_URL');
const out = path.resolve(process.env.CHROME_AUDIO_OUT || '.runtime/chrome-audio-deadlines');
fs.mkdirSync(out, { recursive: true });
const report = { url, startedAt: new Date().toISOString(), stages: [], samples: [], contexts: [], errors: [] };
const save = () => fs.writeFileSync(path.join(out, 'capture.json'), JSON.stringify(report, null, 2) + '\n');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_AUDIO_EXECUTABLE ||
      '/Volumes/Expanse/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: false,
    ignoreDefaultArgs: ['--mute-audio'],
    args: ['--autoplay-policy=no-user-gesture-required', '--disable-extensions', '--window-size=1000,700']
  });
  try {
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    const contexts = new Map();
    cdp.on('WebAudio.contextCreated', ({ context: c }) => {
      contexts.set(c.contextId, c);
      report.contexts.push({ event: 'created', at: Date.now(), ...c });
    });
    cdp.on('WebAudio.contextChanged', ({ context: c }) => {
      contexts.set(c.contextId, c);
      report.contexts.push({ event: 'changed', at: Date.now(), ...c });
    });
    cdp.on('WebAudio.contextWillBeDestroyed', ({ contextId }) => contexts.delete(contextId));
    await cdp.send('WebAudio.enable');
    page.on('pageerror', e => report.errors.push({ type: 'page', message: String(e) }));
    page.on('console', m => {
      if (m.type() === 'error') report.errors.push({ type: 'console', message: m.text().slice(0, 1000) });
    });
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    if (!response?.ok()) throw Error('Preview HTTP ' + response?.status());
    await page.waitForFunction(() => window.__battle__ && window.__battleAudioDiagnostics__, null, { timeout: 120000 });
    report.actualUrl = page.url();
    if (report.actualUrl !== url) throw Error('Preview redirected; exact URL was not preserved');
    report.userAgent = await page.evaluate(() => navigator.userAgent);
    await page.locator('#skillPlay').click();
    await page.waitForFunction(() => !window.__battle__.paused, null, { timeout: 15000 });
    const { windowId } = await cdp.send('Browser.getWindowForTarget');
    const begin = Date.now();
    let enlarged = false, fast = false;
    report.stages.push({ stage: 'small-window-1x', elapsedMs: 0 });
    console.log('CAPTURE STARTED: exact Mini Target URL; 45s small window, 30s fullscreen, then 4x.');
    while (Date.now() - begin < 150000) {
      const elapsedMs = Date.now() - begin;
      if (!enlarged && elapsedMs >= 45000) {
        await cdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'fullscreen' } });
        report.stages.push({ stage: 'fullscreen-1x', elapsedMs });
        enlarged = true;
        console.log('STAGE: fullscreen at 1x');
      }
      if (!fast && elapsedMs >= 75000) {
        await page.locator('#skillSpeed').click();
        const label = await page.locator('#skillSpeed').innerText();
        if (!/4/.test(label)) throw Error('Expected 4x after one speed click, got ' + label);
        report.stages.push({ stage: 'fullscreen-4x', elapsedMs, label });
        fast = true;
        console.log('STAGE: fullscreen at 4x');
      }
      const realtime = [];
      for (const [contextId, c] of contexts) {
        if (c.contextType !== 'realtime') continue;
        try {
          realtime.push({ contextId, ...(await cdp.send('WebAudio.getRealtimeData', { contextId })).realtimeData });
        } catch (e) {
          realtime.push({ contextId, error: String(e) });
        }
      }
      const game = await page.evaluate(() => {
        const full = window.__battleAudioDiagnostics__();
        const { outputHistory, weaponPools, ...audio } = full;
        const ctx = window.BattleAudioBackend?.engine()?.audioContext;
        const stats = ctx?.playbackStats;
        const playbackStats = {};
        if (stats) {
          for (const key of ['totalDuration', 'underrunDuration', 'underrunEvents',
            'averageLatency', 'minimumLatency', 'maximumLatency']) {
            try { playbackStats[key] = stats[key]; } catch (_) {}
          }
          try { Object.assign(playbackStats, stats.toJSON?.()); } catch (_) {}
        }
        let outputTimestamp = null;
        try { outputTimestamp = ctx?.getOutputTimestamp?.(); } catch (_) {}
        return { audio, contextTime: ctx?.currentTime, baseLatency: ctx?.baseLatency,
          outputLatency: ctx?.outputLatency, outputTimestamp, playbackStats,
          fps: window.__battle__?.scene?.getEngine()?.getFps(),
          size: [innerWidth, innerHeight, devicePixelRatio], visibility: document.visibilityState,
          speedLabel: document.getElementById('skillSpeed')?.textContent };
      });
      report.samples.push({ at: Date.now(), elapsedMs, realtime, ...game });
      save();
      await page.waitForTimeout(500);
      if (fast && game.audio.paused && game.audio.time >= 210) {
        report.stages.push({ stage: 'range-auto-paused', elapsedMs: Date.now() - begin });
        break;
      }
    }
    report.finalAudio = await page.evaluate(() => window.__battleAudioDiagnostics__());
    report.finishedAt = new Date().toISOString();
    save();
    const values = report.samples.flatMap(s => s.realtime).filter(s => Number.isFinite(s.renderCapacity));
    console.log('CAPTURE COMPLETE:', JSON.stringify({ samples: report.samples.length,
      realtimeSamples: values.length, maxRenderCapacity: Math.max(...values.map(x => x.renderCapacity)),
      output: path.join(out, 'capture.json') }));
    if (!values.length) throw Error('No Chrome realtime render-capacity measurements captured');
  } finally {
    save();
    await browser.close();
  }
})().catch(e => { report.failure = String(e.stack || e); save(); console.error(report.failure); process.exitCode = 1; });
