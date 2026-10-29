#!/usr/bin/env node
'use strict';
/*
 * Run the staged native Audio History Lab sequentially in ONE Chromium tab.
 * Use the same seed/scenario for 8, 16, 32, and 64 far-voice budgets.
 * Only acoustic/audio metadata is exported; never recordings or licensed clips.
 *
 * AUDIO_LAB_URL='https://test.example/grasstex/preview/ref-<12sha>/battle/audio_lab.html'
 * AUDIO_LAB_REPORT_DIR=./audio-matrix node scripts/probes/probe_audio_lab_matrix.cjs
 *
 * Optional AUDIO_LAB_VOICES=8,16,32,64 AUDIO_LAB_REPEATS=2
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const base = process.env.AUDIO_LAB_URL;
if (!base || !/^https?:\/\//i.test(base))
  throw new Error('Set AUDIO_LAB_URL to the already staged preview/battle/audio_lab.html URL');
const out = path.resolve(process.env.AUDIO_LAB_REPORT_DIR || 'audio-lab-matrix');
const sizes = (process.env.AUDIO_LAB_VOICES || '8,16,32,64')
  .split(',').map(Number).filter(n => Number.isInteger(n) && n >= 4 && n <= 64);
const repeats = Math.max(1, Math.min(4, Math.floor(+process.env.AUDIO_LAB_REPEATS || 1)));
const timeoutMs = Math.max(75000, Number(process.env.AUDIO_LAB_TIMEOUT_MS) || 180000);
if (!sizes.length) throw new Error('AUDIO_LAB_VOICES requires at least one integer in [4, 64]');
const presets = {
  ac24: { farVoices: 32, acousticSlots: 24 },
  ac48: { farVoices: 32, acousticSlots: 48 },
  ac96: { farVoices: 32, acousticSlots: 96 },
  ac192: { farVoices: 32, acousticSlots: 192 },
  q128s2: { farVoices: 32, acousticSlots: 96, speed: 4, audioQueue: 128, audioStarts: 2 },
  q256s2: { farVoices: 32, acousticSlots: 96, speed: 4, audioQueue: 256, audioStarts: 2 },
  q256s4: { farVoices: 32, acousticSlots: 96, speed: 4, audioQueue: 256, audioStarts: 4 }
};
const caseNames = process.env.AUDIO_LAB_CASES
  ? process.env.AUDIO_LAB_CASES.split(',').map(x => x.trim())
  : [];
if (caseNames.some(name => !Object.hasOwn(presets, name)))
  throw new Error('AUDIO_LAB_CASES must use known presets: ' + Object.keys(presets).join(','));
fs.mkdirSync(out, { recursive: true });

function urlFor(variant) {
  const u = new URL(base);
  const config = { log: '0', tacticalController: 'new', squads: '5',
    occlusion: 'mixed', duration: '60', speed: '1', farVoices: '32',
    audioQueues: 'single', acousticPriority: '1', acousticHoldMs: '0',
    ...variant };
  Object.entries(config).forEach(([key, value]) => u.searchParams.set(key, String(value)));
  return u.toString();
}
function summarize(report, errors, run) {
  const far = Object.entries(report.voicePools || {}).filter(([name]) => name.endsWith(':far'));
  const total = key => far.reduce((sum, [, data]) => sum + (data[key] || 0), 0);
  const ps = report.propagation?.stats || {};
  const ac = report.acoustics?.stats || {};
  const samples = report.timeline || [];
  const hidden = samples.filter(x => x.pageVisibility !== 'visible').length;
  const maxPendingGap = Math.max(0, ...samples.map(x => x.schedulerSinceDrainMs || 0));
  const maxFrameGap = Math.max(0, ...samples.map(x => x.schedulerMaxDrainGapMs || 0));
  const maxLateness = Math.max(0, ...samples.map(x => x.schedulerMaxDueLatenessMs || 0));
  return {
    run, farVoices: report.poolPolicy?.farVoices, status: report.status,
    acousticSlots: report.acoustics?.limits?.maxActive,
    acousticDefault: report.acoustics?.limits?.defaultMaxActive,
    audioQueue: report.propagation?.limits?.maxQueue,
    audioStarts: report.propagation?.limits?.maxPerFrame, speed: report.speed,
    maxAcousticActive: report.summary?.maxAcousticActive || 0,
    acousticTickCount: ac.acousticTicks || 0,
    acousticTickTotalMs: ac.acousticTickTotalMs || 0,
    acousticTickMaxMs: ac.acousticTickMaxMs || 0,
    trackedIdleSamples: ac.trackedIdleOnTick || 0,
    shots: report.summary?.simulatedShots || 0,
    primaryStarts: ps.startedPrimary || 0,
    primaryLosses: (ps.evictedPrimary || 0) + (ps.rejectedPrimary || 0),
    echoLosses: (ps.evictedEcho || 0) + (ps.rejectedEcho || 0),
    poolStarts: report.summary?.playRequests || 0,
    poolBusy: report.summary?.droppedBusy || 0,
    farStarts: total('started'), farBusy: total('droppedBusy'),
    acousticPrepared: ac.prepared || 0, acousticBypasses: ac.skippedCapacity || 0,
    acousticReplacements: ac.replacedCapacity || 0,
    peakVoices: report.summary?.maxActiveVoices || 0,
    maxPeak: report.summary?.maxPeak || 0, maxRms: report.summary?.maxRms || 0,
    quietUnderFire: report.summary?.samplesQuietUnderFire || 0,
    longTasks: report.summary?.longTasks || 0,
    maxFrameGapMs: maxFrameGap, maxPendingGapMs: maxPendingGap,
    maxLateSoundMs: maxLateness, hiddenSamples: hidden,
    sampleCount: samples.length, runtimeErrors: errors,
    validForeground: report.status === 'completed' && hidden === 0,
    warnings: [
      hidden ? 'Tab was not visible for all samples' : null,
      maxPendingGap > 500 ? 'Scheduler stalled while queue pending' : null,
      maxLateness > 500 ? 'Scheduled sound started more than 500ms late' : null,
      errors.length ? 'Browser runtime errors' : null
    ].filter(Boolean)
  };
}
function table(rows) {
  const head = ['Slots', 'Queue', 'Starts/frame', 'Speed', 'Far voices',
    'Pool starts', 'Far busy', 'Primary loss', 'Acoustics bypass',
    'Acoustic CPU ms', 'Peak voices', 'Quiet/fire', 'RAF gap ms', 'Valid'];
  const keys = ['acousticSlots', 'audioQueue', 'audioStarts', 'speed', 'farVoices',
    'poolStarts', 'farBusy', 'primaryLosses', 'acousticBypasses',
    'acousticTickTotalMs', 'peakVoices', 'quietUnderFire',
    'maxFrameGapMs', 'validForeground'];
  return [
    '| ' + head.join(' | ') + ' |',
    '| ' + head.map(() => '---:').join(' | ') + ' |',
    ...rows.map(r => '| ' + keys.map(k => String(r[k] ?? '—')).join(' | ') + ' |')
  ].join('\n');
}
(async () => {
  const browser = await chromium.launch({ headless: true, args: [
    '--autoplay-policy=no-user-gesture-required',
    '--use-gl=angle', '--use-angle=swiftshader',
    '--enable-webgl', '--ignore-certificate-errors'
  ] });
  const rows = [];
  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: true,
      viewport: { width: 1100, height: 740 } });
    // Exactly one page: no concurrent hidden-tab audio or competition for RAF.
    const page = await context.newPage();
    for (let repeat = 1; repeat <= repeats; repeat++) {
      for (const test of (caseNames.length
        ? caseNames.map(name => ({ name, variant: presets[name] }))
        : sizes.map(voices => ({ name: 'far' + voices, variant: { farVoices: voices } })))) {
        const run = 'r' + repeat + '-' + test.name;
        const voices = test.variant.farVoices;
        const runtimeErrors = [];
        const onPageError = e => runtimeErrors.push(String(e.stack || e));
        const onConsole = msg => {
          if (msg.type() === 'error') runtimeErrors.push(msg.text().slice(0, 700));
        };
        page.on('pageerror', onPageError);
        page.on('console', onConsole);
        try {
          const url = urlFor(test.variant);
          console.log('Running', run, url);
          const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
          if (!response || !response.ok()) throw new Error('Audio Lab returned HTTP ' +
            (response?.status() || 'no response') + '; stage that preview SHA first');
          await page.waitForFunction(() => window.__audioLab?.done === true,
            null, { timeout: timeoutMs });
          const report = await page.evaluate(() => window.__audioLab.final);
          const line = summarize(report, runtimeErrors, run);
          fs.writeFileSync(path.join(out, run + '.json'), JSON.stringify(report, null, 2) + '\n');
          rows.push(line);
          console.log(JSON.stringify(line));
        } catch (err) {
          rows.push({ run, farVoices: voices, status: 'error', validForeground: false,
            warnings: [String(err.message || err)], runtimeErrors });
          console.error('Failed', run, String(err.stack || err));
        } finally {
          page.off('pageerror', onPageError);
          page.off('console', onConsole);
          // Navigation on the next iteration also tears down old scene/audio nodes.
        }
      }
    }
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(out, 'matrix.json'), JSON.stringify(rows, null, 2) + '\n');
    const md = '# Grasstex native 50v50 distant polyphony A/B\n\n' +
      'Matched 50v50 audio experiments. Each trial runs alone in the same headless Chromium tab. ' +
      'Headless visibility must be checked, not assumed.\n\n' +
      table(rows) + '\n\n' +
      rows.map(r => '**' + r.run + '**: ' +
        ((r.warnings || []).join('; ') || 'no warnings')).join('\n\n') + '\n';
    fs.writeFileSync(path.join(out, 'matrix.md'), md);
    console.log('\n' + md);
    console.log('Wrote', out);
  }
  if (rows.some(r => r.status !== 'completed' || !r.validForeground || (r.runtimeErrors || []).length))
    process.exitCode = 1;
})().catch(err => { console.error(err.stack || err); process.exitCode = 1; });
