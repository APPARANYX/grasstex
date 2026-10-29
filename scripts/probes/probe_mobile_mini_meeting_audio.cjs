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
const backend = process.env.MOBILE_MINI_BACKEND || 'babylon';
const warmup = Math.max(0, Math.min(180, +process.env.MOBILE_MINI_WARMUP_SECONDS || 0));
const seconds = Math.max(12, Math.min(65, +process.env.MOBILE_MINI_SECONDS || 30));
fs.mkdirSync(out, { recursive: true });

const profiles = [
  {
    name: 'desktop-192',
    viewport: { width: 1366, height: 768 },
    isMobile: false,
    hasTouch: false,
    slots: 192
  },
  {
    name: 'mobile-portrait-192',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    slots: 192
  },
  {
    name: 'mobile-landscape-192',
    viewport: { width: 844, height: 390 },
    isMobile: true,
    hasTouch: true,
    slots: 192
  },
  {
    name: 'mobile-portrait-96',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    slots: 96
  }
];

function percentile(sorted, pct) {
  return sorted.length
    ? +sorted[Math.min(sorted.length - 1, Math.floor(pct * (sorted.length - 1)))].toFixed(2)
    : null;
}
// These per-model calibration overrides are optional in loadSidecars(); the
// shipping backend always applies built-in seats when a sidecar is absent.
function optionalCalibration(url) {
  try {
    return /\/Assets\/soldiers\/(?:us|ge)-(?:paratrooper|scout|gunner|engineer|captain)\.fbx\.json$/.test(
      new URL(url).pathname
    );
  } catch (_) {
    return false;
  }
}
function summary(result) {
  const frames = result.frames.filter(x => Number.isFinite(x.fps) && x.fps > 0);
  const fps = frames.map(x => x.fps).sort((a, b) => a - b);
  const audio = result.ending?.audio || {};
  const sched = result.ending?.scheduler || {};
  const listener = result.ending?.listener || {};
  const caps = result.ending?.listenerLimits || {};
  return {
    name: result.name,
    backend: result.backend,
    profile: result.profile,
    viewport: result.start.viewport,
    map: result.start.map,
    initialSoldiers: result.start.soldiers,
    seconds,
    fpsMedian: percentile(fps, 0.5),
    fpsP05: percentile(fps, 0.05),
    fpsMin: fps.length ? +fps[0].toFixed(2) : null,
    framesBelow20: fps.filter(x => x < 20).length,
    shots: result.ending?.shots || 0,
    extendedSeconds: result.extendedSeconds || 0,
    audibleStartShare: result.audibleStartShare ?? null,
    meterMaxRms: Math.max(0, ...(result.meterRows || []).map(x => x.audioWindow?.maxRms || 0)),
    simTime: result.ending?.time || 0,
    listenerActive: result.ending?.acousticActive || 0,
    listenerCap: caps.maxActive || null,
    acousticPrepared: listener.prepared || 0,
    acousticBypassed: listener.skippedCapacity || 0,
    acousticTickMs: listener.acousticTickTotalMs || 0,
    poolStarts: audio.playRequests || 0,
    poolBusyDrops: audio.droppedBusy || 0,
    schedulerStarts: sched.startedPrimary || 0,
    schedulerPrimaryLosses: (sched.evictedPrimary || 0) + (sched.rejectedPrimary || 0),
    schedulerMaxGapMs: sched.maxActiveDrainGapMs || 0,
    browserErrors: result.errors.length,
    missingAudio: result.missingAudio.length,
    httpErrors: result.httpErrors || [],
    optionalCalibrationMissing: result.optionalCalibrationMissing || [],
    hiddenSamples: result.frames.filter(x => x.visibility !== 'visible').length,
    audioState: result.ending?.audioContextState || null,
    voiceStarts: result.ending?.voice?.played || 0,
    combatEffects: result.ending?.combat?.played || {},
    grenadeEffects: result.ending?.grenades?.played || {},
    weaponFoley: result.ending?.foley?.played || {},
    tacticalCompressor: result.ending?.mix?.tacticalSafety || false,
    maxOutputRms: Math.max(0, ...result.frames.map(x => x.audioRms || 0)),
    audioOutputSamples: result.frames.filter(x => x.audioRms > 0.0005).length,
    heapPeakMb: Math.round(Math.max(0, ...frames.map(x => x.heapBytes || 0)) / 1048576),
    screenshot: result.screenshot,
    status: result.status
  };
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--disable-dev-shm-usage',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist'
    ]
  });
  const rows = [];
  try {
    for (const profile of profiles.filter(
      p => !process.env.MOBILE_MINI_PROFILE || p.name === process.env.MOBILE_MINI_PROFILE
    )) {
      const ctx = await browser.newContext({
        viewport: profile.viewport,
        isMobile: profile.isMobile,
        hasTouch: profile.hasTouch,
        deviceScaleFactor: profile.isMobile ? 2 : 1,
        ignoreHTTPSErrors: true
      });
      const page = await ctx.newPage();
      page.setDefaultTimeout(120000);
      const errors = [],
        missingAudio = [],
        httpErrors = [],
        optionalCalibrationMissing = [];
      page.on('response', r => {
        if (r.status() === 404 && optionalCalibration(r.url())) optionalCalibrationMissing.push(r.url());
        else if (r.status() >= 400)
          httpErrors.push({ status: r.status(), url: r.url(), type: r.request().resourceType() });
        if (r.url().includes('/Assets/audio/') && !r.ok()) missingAudio.push(r.status() + ' ' + r.url());
      });
      page.on('requestfailed', request => {
        if (request.url().includes('/Assets/audio/'))
          missingAudio.push('failed ' + request.url() + ' ' + (request.failure()?.errorText || ''));
      });
      page.on('pageerror', e => errors.push(String(e.stack || e)));
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const line = msg.text();
          if (/^Failed to load resource:.*404/.test(line) && optionalCalibration(msg.location().url)) return;
          if (/Assets\/audio\//i.test(line)) missingAudio.push(line.slice(0, 250));
          else errors.push(line.slice(0, 500));
        }
      });
      const u = new URL(base);
      const qs = {
        combatLab: '1',
        balancedMeeting: '1',
        labPreset: 'A',
        labRange: '1',
        tacticalController: 'new',
        seed: 'mobile-mini-audio-683',
        pinSeed: '1',
        acoustics: 'high',
        acousticSlots: String(profile.slots),
        acousticPriority: '1',
        audioQueues: 'single',
        audioBackend: backend,
        audioDiag: '1'
      };
      Object.entries(qs).forEach(([k, v]) => u.searchParams.set(k, v));
      const run = {
        name: profile.name,
        profile,
        backend,
        errors,
        missingAudio,
        httpErrors,
        optionalCalibrationMissing,
        frames: [],
        status: 'incomplete',
        screenshot: null,
        start: {},
        ending: {}
      };
      try {
        const response = await page.goto(u.toString(), {
          waitUntil: 'domcontentloaded',
          timeout: 120000
        });
        if (!response || !response.ok()) throw new Error('HTTP ' + response?.status());
        await page.waitForFunction(
          () => !!(window.__battle__ && window.BattleListenerAcoustics && window.__battleRenderLoop__),
          null,
          { timeout: 120000 }
        );
        run.start = await page.evaluate(() => {
          const b = window.__battle__,
            sc = b.scene.metadata?.battleScenario,
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
        if (warmup)
          await page.waitForFunction(
            () => (window.__battle__?._weaponAudio?.summary?.()?.playRequests || 0) > 0,
            null,
            { timeout: warmup * 1000 }
          );
        await page.evaluate(() => {
          const ae = window.BattleAudioBackend ? BattleAudioBackend.engine() : BABYLON.Engine.audioEngine,
            ctx = ae?.audioContext,
            master = ae?.masterGain;
          let analyser = null,
            probeGain = null;
          if (ctx && master && ctx.createAnalyser) {
            analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;
            probeGain = ctx.createGain();
            probeGain.gain.value = 0; // passive monitor; does not modify audible output
            master.connect(analyser);
            analyser.connect(probeGain);
            probeGain.connect(ctx.destination);
          }
          window.__mobileMiniStats = {
            startedMs: performance.now(),
            analyser,
            probeGain,
            data: [],
            timer: setInterval(() => {
              let audioRms = null;
              if (analyser) {
                const raw = new Float32Array(analyser.fftSize);
                analyser.getFloatTimeDomainData(raw);
                let sum = 0;
                for (const v of raw) sum += v * v;
                audioRms = Math.sqrt(sum / raw.length);
              }
              const b = window.__battle__,
                eng = b.scene.getEngine();
              window.__mobileMiniStats.data.push({
                fps: eng.getFps(),
                simTime: b.time,
                visibility: document.visibilityState,
                heapBytes: performance.memory?.usedJSHeapSize || 0,
                acousticActive: window.BattleListenerAcoustics?.active || 0,
                poolStarts: b._weaponAudio?.summary?.()?.playRequests || 0,
                audioRms
              });
            }, 1000)
          };
        });
        await page.waitForTimeout(seconds * 1000);
        // On a slow runner (~2 fps) a fixed window can hold one or two shots, too few
        // to judge output. Extend, up to 120 s, until the window holds MIN_STARTS starts.
        const MIN_STARTS = 5;
        run.extendedSeconds = 0;
        while (run.extendedSeconds < 120) {
          const starts = await page.evaluate(() => {
            const d = window.__mobileMiniStats.data;
            return d.length ? d[d.length - 1].poolStarts - d[0].poolStarts : 0;
          });
          if (starts >= MIN_STARTS) break;
          await page.waitForTimeout(1000);
          run.extendedSeconds++;
        }
        // The page's audioDiag meter measures every ~100 ms of rendered audio on the
        // audio thread; the once-a-second analyser read above covers ~43 ms of it.
        run.meterRows = await page.evaluate(() => {
          const from = window.__mobileMiniStats.startedMs,
            diag = window.__battleAudioDiagnostics__ && window.__battleAudioDiagnostics__();
          return ((diag && diag.outputHistory) || [])
            .filter(x => x.realMs >= from && !x.paused)
            .map(x => ({
              realMs: x.realMs,
              deltaWeaponStarts: x.deltaWeaponStarts,
              audioWindow: x.audioWindow
            }));
        });
        run.frames = await page.evaluate(() => {
          clearInterval(window.__mobileMiniStats.timer);
          const m = window.__mobileMiniStats;
          if (m.analyser) m.analyser.disconnect();
          if (m.probeGain) m.probeGain.disconnect();
          return m.data;
        });
        run.ending = await page.evaluate(() => {
          const b = window.__battle__,
            engine = b.scene.getEngine();
          const audioc = (
            window.BattleAudioBackend ? BattleAudioBackend.engine() : window.BABYLON.Engine.audioEngine
          )?.audioContext;
          const value = {
            time: b.time,
            shots: window.BattleAudioScheduler?.stats?.received || 0,
            backend: window.BattleAudioBackend?.summary?.(),
            audio: b._weaponAudio?.summary?.() || null,
            voice: window.BattleVoiceScheduler?.summary?.() || null,
            combat: b._combatAudio || null,
            grenades: b._grenadeAudio || null,
            foley: b._weaponFoley || null,
            mix: {
              tacticalSafety: !!window.BattleAudioMix?.tacticalSafety,
              settings: window.BattleAudioMix?.get?.(),
              stats: { ...window.BattleAudioMix?.stats }
            },
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
        if (!run.ending?.audio || !run.ending.audio.playRequests || !run.ending.scheduler?.startedPrimary)
          throw new Error('INVALID AUDIO STRESS: no real gunshot starts despite live battle');
        // Judge only seconds in which the gunshot pool started a sound; a start late
        // in a second may first be heard in the next one.
        const rows = run.meterRows,
          windowStarts = rows.reduce((n, x) => n + Math.max(0, x.deltaWeaponStarts || 0), 0),
          thin = rows.filter(
            x => !x.audioWindow || x.audioWindow.source !== 'worklet' || x.audioWindow.audioMs < 500
          );
        if (windowStarts < 5 || !rows.length || thin.length > rows.length * 0.1)
          throw new Error(
            `INSUFFICIENT SAMPLE: too few reads or starts to judge (${windowStarts} starts, ${thin.length} of ${rows.length} seconds under 500 ms measured)`
          );
        const startRows = rows.map((x, i) => i).filter(i => rows[i].deltaWeaponStarts > 0);
        const heard = startRows.filter(i =>
          [rows[i], rows[i + 1]].some(x => x && x.audioWindow.maxRms > 0.0005)
        ).length;
        run.audibleStartShare = heard / startRows.length;
        if (run.audibleStartShare < 0.5)
          throw new Error(
            `SILENT AUDIO: only ${heard} of ${startRows.length} seconds with gunshot starts had measurable output`
          );
        if (missingAudio.length)
          throw new Error('AUDIO ASSET FAILURE: ' + missingAudio.slice(0, 3).join('; '));
        if (backend === 'howler' && (run.ending.backend?.name !== 'howler' || !run.ending.backend?.started))
          throw new Error('No confirmed Howler playback');
        run.status = 'completed';
      } catch (e) {
        run.status = 'error: ' + String(e.message || e);
        console.error(profile.name + ': ' + run.status);
      } finally {
        fs.writeFileSync(path.join(out, profile.name + '.json'), JSON.stringify(run, null, 2) + '\n');
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
  if (rows.some(r => r.status !== 'completed' || r.browserErrors > 0)) process.exitCode = 1;
})().catch(err => {
  console.error(err.stack || err);
  process.exitCode = 1;
});
