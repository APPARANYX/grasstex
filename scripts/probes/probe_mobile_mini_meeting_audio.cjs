#!/usr/bin/env node
'use strict';
/*
 * Expanded Mini Map live-render/audio pressure at mobile-sized Chromium viewports.
 * Unlike probe_mini_meeting, this does NOT stop Babylon rendering, fast-forward
 * simulation ticks, or block media; it measures actual wall-clock frame/audio
 * work against a staged PR with real private weapon audio where available.
 * Chromium mobile emulation is not an actual low-end phone GPU.
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const base = process.env.MOBILE_MINI_URL;
if (!base || !/^https?:\/\//.test(base))
  throw new Error('Provide staged MOBILE_MINI_URL pointing at battle_sim.php');
const out = path.resolve(process.env.MOBILE_MINI_OUT || 'reports/mobile-mini-audio');
const seconds = Math.max(12, Math.min(65, +process.env.MOBILE_MINI_SECONDS || 30));
fs.mkdirSync(out, { recursive: true });

const profiles = [
  { name: 'desktop-192', viewport: { width: 1366, height: 768 },
    isMobile: false, hasTouch: false, slots: 192 },
  { name: 'mobile-portrait-192', viewport: { width: 390, height: 844 },
    isMobile: true, hasTouch: true, slots: 192 },
  { name: 'mobile-landscape-192', viewport: { width: 844, height: 390 },
    isMobile: true, hasTouch: true, slots: 192 },
  { name: 'mobile-portrait-96', viewport: { width: 390, height: 844 },
    isMobile: true, hasTouch: true, slots: 96 }
];

function percentile(sorted, pct) {
  return sorted.length ? +sorted[Math.min(sorted.length - 1,
    Math.floor(pct * (sorted.length - 1)))].toFixed(2) : null;
}
function summary(result) {
  const frames = result.frames.filter(x => Number.isFinite(x.fps) && x.fps > 0);
  const fps = frames.map(x => x.fps).sort((a, b) => a - b);
  const audio = result.ending?.audio || {};
  const sched = result.ending?.scheduler || {};
  const listener = result.ending?.listener || {};
  const caps = result.ending?.listenerLimits || {};
  return {
    name: result.name, profile: result.profile, viewport: result.start.viewport,
    map: result.start.map, initialSoldiers: result.start.soldiers,
    seconds, fpsMedian: percentile(fps, 0.5), fpsP05: percentile(fps, 0.05),
    fpsMin: fps.length ? +fps[0].toFixed(2) : null,
    framesBelow20: fps.filter(x => x < 20).length,
    shots: result.ending?.shots || 0, simTime: result.ending?.time || 0,
    listenerActive: result.ending?.acousticActive || 0,
    listenerCap: caps.maxActive || null,
    acousticPrepared: listener.prepared || 0,
    acousticBypassed: listener.skippedCapacity || 0,
    acousticTickMs: listener.acousticTickTotalMs || 0,
    poolStarts: audio.playRequests || 0, poolBusyDrops: audio.droppedBusy || 0,
    schedulerStarts: sched.startedPrimary || 0,
    schedulerPrimaryLosses: (sched.evictedPrimary || 0) + (sched.rejectedPrimary || 0),
    schedulerMaxGapMs: sched.maxActiveDrainGapMs || 0,
    browserErrors: result.errors.length, missingAudio: result.missingAudio.length,
    hiddenSamples: result.frames.filter(x => x.visibility !== 'visible').length,
    audioState: result.ending?.audioContextState || null,
    heapPeakMb: Math.round(Math.max(0, ...frames.map(x => x.heapBytes || 0)) / 1048576),
    screenshot: result.screenshot,
    status: result.status
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: [
    '--autoplay-policy=no-user-gesture-required',
    '--disable-dev-shm-usage',
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl',
    '--ignore-gpu-blocklist'
  ] });
  const rows = [];
  try {
    for (const profile of profiles) {
      const ctx = await browser.newContext({
        viewport: profile.viewport, isMobile: profile.isMobile,
        hasTouch: profile.hasTouch, deviceScaleFactor: profile.isMobile ? 2 : 1,
        ignoreHTTPSErrors: true
      });
      const page = await ctx.newPage();
      page.setDefaultTimeout(120000);
      const errors = [], missingAudio = [];
      page.on('pageerror', e => errors.push(String(e.stack || e)));
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const line = msg.text();
          if (/Assets\/audio\//i.test(line)) missingAudio.push(line.slice(0, 250));
          else errors.push(line.slice(0, 500));
        }
      });
      const u = new URL(base);
      const qs = {
        combatLab: '1', balancedMeeting: '1', labPreset: 'A',
        labRange: '1', tacticalController: 'new',
        seed: 'mobile-mini-audio-683', pinSeed: '1',
        acoustics: 'high', acousticSlots: String(profile.slots),
        acousticPriority: '1', audioQueues: 'single'
      };
      Object.entries(qs).forEach(([k, v]) => u.searchParams.set(k, v));
      const run = { name: profile.name, profile, errors, missingAudio,
        frames: [], status: 'incomplete', screenshot: null, start: {}, ending: {} };
      try {
        const response = await page.goto(u.toString(), {
          waitUntil: 'domcontentloaded', timeout: 120000
        });
        if (!response || !response.ok()) throw new Error('HTTP ' + response?.status());
        await page.waitForFunction(() => !!(window.__battle__ &&
          window.BattleListenerAcoustics && window.__battleRenderLoop__),
          null, { timeout: 120000 });
        run.start = await page.evaluate(() => {
          const b = window.__battle__, sc = b.scene.metadata?.battleScenario,
            canvas = document.getElementById('renderCanvas');
          const bounds = canvas?.getBoundingClientRect();
          return {
            map: [sc.map.width, sc.map.depth],
            soldiers: [b._roster.us.length, b._roster.ge.length],
            viewport: [innerWidth, innerHeight],
            outerWidth: document.documentElement.scrollWidth,
            canvas: bounds ? [bounds.width, bounds.height] : null,
            webGL: !!b.scene.getEngine()._gl
          };
        });
        // Mobile Mini Map hides toolbar controls. Dispatch their registered
        // handlers programmatically, while retaining real rendered frames/audio.
        // Headless Chromium is launched with explicit autoplay permission.
        await page.evaluate(() => {
          const speed = document.querySelector('#controls button[data-speed="4"]');
          const start = document.querySelector('#startBtn');
          if (!speed || !start) throw new Error('Mini Map speed/start controls missing');
          speed.click();
          start.click();
        });
        await page.waitForFunction(() => !window.__battle__.paused, null, { timeout: 15000 });
        await page.evaluate(() => {
          window.__mobileMiniStats = {
            data: [], timer: setInterval(() => {
              const b = window.__battle__, eng = b.scene.getEngine();
              window.__mobileMiniStats.data.push({
                fps: eng.getFps(), simTime: b.time,
                visibility: document.visibilityState,
                heapBytes: performance.memory?.usedJSHeapSize || 0,
                acousticActive: window.BattleListenerAcoustics?.active || 0
              });
            }, 1000)
          };
        });
        await page.waitForTimeout(seconds * 1000);
        run.frames = await page.evaluate(() => {
          clearInterval(window.__mobileMiniStats.timer);
          return window.__mobileMiniStats.data;
        });
        run.ending = await page.evaluate(() => {
          const b = window.__battle__, engine = b.scene.getEngine();
          const audioc = window.BABYLON.Engine.audioEngine?.audioContext;
          const value = {
            time: b.time, shots: (window.BattleAudioScheduler?.stats?.received || 0),
            audio: b._weaponAudio?.summary?.() || null,
            scheduler: { ...window.BattleAudioScheduler?.stats },
            listener: { ...window.BattleListenerAcoustics?.stats },
            listenerLimits: {
              maxActive: window.BattleListenerAcoustics?.maxActive,
              defaultMaxActive: window.BattleListenerAcoustics?.defaultMaxActive
            },
            acousticActive: window.BattleListenerAcoustics?.active || 0,
            audioContextState: audioc?.state || 'missing',
            engineFps: engine.getFps()
          };
          b.pause();
          return value;
        });
        run.screenshot = profile.name + '.png';
        await page.screenshot({ path: path.join(out, run.screenshot), fullPage: false });
        if (run.start.map.join(',') !== '480,360') throw new Error('wrong Mini Map dimensions');
        if (run.start.soldiers.join(',') !== '20,20') throw new Error('wrong initial 20v20 units');
        if (!run.start.webGL) throw new Error('WebGL unavailable');
        if (run.frames.length < Math.floor(seconds * 0.7)) throw new Error('frame sampling stalled');
        if (run.frames.some(x => x.visibility !== 'visible')) throw new Error('tab went hidden');
        run.status = 'completed';
      } catch (e) {
        run.status = 'error: ' + String(e.message || e);
        console.error(profile.name + ': ' + run.status);
      } finally {
        fs.writeFileSync(path.join(out, profile.name + '.json'),
          JSON.stringify(run, null, 2) + '\n');
        const short = summary(run);
        console.log('MOBILE_MINI', JSON.stringify(short));
        rows.push(short);
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(out, 'matrix.json'), JSON.stringify(rows, null, 2) + '\n');
  console.log('MOBILE_MINI_SUMMARY', JSON.stringify(rows));
  if (rows.some(r => r.status !== 'completed' || r.browserErrors > 0))
    process.exitCode = 1;
})().catch(err => { console.error(err.stack || err); process.exitCode = 1; });
