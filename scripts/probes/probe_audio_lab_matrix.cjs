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
fs.mkdirSync(out, { recursive: true });

function urlFor(voices) {
  const u = new URL(base);
  const config = { log: '0', tacticalController: 'new', squads: '5',
    occlusion: 'mixed', duration: '60', speed: '1', farVoices: String(voices),
    audioQueues: 'single', acousticPriority: '1', acousticHoldMs: '0' };
  Object.entries(config).forEach(([key, value]) => u.searchParams.set(key, value));
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
  const head = ['Voices', 'Shots', 'Pool starts', 'Far starts', 'Far busy', 'Primary loss',
    'Acoustic bypass', 'Peak voices', 'Quiet/fire', 'RAF gap ms', 'Hidden', 'Valid'];
  const keys = ['farVoices', 'shots', 'poolStarts', 'farStarts', 'farBusy', 'primaryLosses',
    'acousticBypasses', 'peakVoices', 'quietUnderFire', 'maxFrameGapMs',
    'hiddenSamples', 'validForeground'];
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
      for (const voices of sizes) {
        const run = 'r' + repeat + '-far' + voices;
        const runtimeErrors = [];
        const onPageError = e => runtimeErrors.push(String(e.stack || e));
        const onConsole = msg => {
          if (msg.type() === 'error') runtimeErrors.push(msg.text().slice(0, 700));
        };
        page.on('pageerror', onPageError);
        page.on('console', onConsole);
        try {
          const url = urlFor(voices);
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
      'Matched single-queue, priority acoustics, 60 simulated seconds, 1× speed. ' +
      'Each trial runs alone in the same headless Chromium tab. ' +
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
