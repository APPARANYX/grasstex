#!/usr/bin/env node
'use strict';
/* Noninteractive browser capture of the real Grasstex 10v10 audio history lab.
   Writes metadata only; no licensed audio or voice assets are exported. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const URL_TO_RUN = process.env.AUDIO_LAB_URL ||
  'https://test.ivandpopov.com/grasstex/battle/audio_lab.html?log=0&tacticalController=new&fullMix=1&squads=5&occlusion=mixed';
const OUT = process.env.AUDIO_LAB_REPORT ||
  path.resolve(process.cwd(), 'audio-lab-report.json');
const TIMEOUT = Math.max(15000, Number(process.env.AUDIO_LAB_TIMEOUT_MS) || 240000);

(async function () {
  const browser = await chromium.launch({ headless: true, args: [
    '--autoplay-policy=no-user-gesture-required',
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl',
    '--ignore-certificate-errors'
  ] });
  try {
    const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1100, height: 740 } });
    const runtimeErrors = [], missingAudio = [], audioResponses = [];
    page.on('response', response => {
      const u = response.url();
      if (u.includes('/Assets/audio/') && /\.(mp3|caf|ogg)(\?|$)/i.test(u)) {
        audioResponses.push({ status: response.status(), url: u });
        if (!response.ok()) missingAudio.push(response.status() + ' ' + u);
      }
    });
    page.on('requestfailed', request => {
      if (request.url().includes('/Assets/audio/'))
        missingAudio.push('failed ' + request.url() + ' ' + (request.failure()?.errorText || ''));
    });
    page.on('pageerror', err => runtimeErrors.push(String(err.stack || err)));
    page.on('console', msg => {
      if (msg.type() === 'error') runtimeErrors.push(msg.text().slice(0, 700));
    });
    const response = await page.goto(URL_TO_RUN, { waitUntil: 'domcontentloaded', timeout: 90000 });
    if (!response || !response.ok()) throw Error('Lab page HTTP ' + (response ? response.status() : 'no response'));
    await page.waitForFunction(() => window.__audioLab && window.__audioLab.done === true, null, { timeout: TIMEOUT });
    const report = await page.evaluate(() => window.__audioLab.final);
    report.browser = { userAgent: await page.evaluate(() => navigator.userAgent),
      pageErrors: runtimeErrors, missingAudio: missingAudio.slice(0, 80),
      audioResponses: audioResponses.length,
      decodedResponses: audioResponses.filter(x => x.status >= 200 && x.status < 300).length };
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
    console.log('Audio lab:', report.status, '| URL:', URL_TO_RUN);
    console.log('Shots:', report.summary.simulatedShots, '| started:', report.summary.playRequests,
      '| dropped busy:', report.summary.droppedBusy, '| not ready:', report.summary.droppedNotReady);
    const topBusy = Object.entries(report.voicePools || {})
      .sort((a, b) => b[1].droppedBusy - a[1].droppedBusy)
      .slice(0, 8)
      .map(([key, x]) => ({ key, cap: x.capacity, starts: x.started, busyDrops: x.droppedBusy }));
    console.log('Most saturated near/far pools:', topBusy);
    console.log('Scheduler lane mode:', report.propagation && report.propagation.limits && report.propagation.limits.mode,
      '| near/far lanes:', report.propagation && report.propagation.lanes,
      '| priority acoustics:', report.acousticPriority,
      '| acoustic replacements:', report.acoustics && report.acoustics.stats && report.acoustics.stats.replacedCapacity);
    console.log('Scheduler primary evictions:', report.summary.schedulerPrimaryEvictions,
      '| far skips:', report.summary.schedulerFarSkipped, '| far throttles:', report.summary.schedulerFarThrottled);
    console.log('Peak active:', report.summary.maxActiveVoices, '| max queue:', report.summary.maxQueue,
      '| long tasks:', report.summary.longTasks, '| context:', report.summary.endingContext);
    console.log('Wrote', OUT);
    if (report.status !== 'completed') throw Error('Audio lab did not complete: ' + JSON.stringify(report.errors));
    if (report.summary.simulatedShots <= 0 || report.summary.playRequests <= 0)
      throw Error('No verified simulated shots / audio playback starts');
    if (report.summary.endingContext !== 'running') throw Error('AudioContext not running at completion');
    if (!report.summary.audibleOutputSamples)
      throw Error('SILENT AUDIO: no measurable master signal during gunfire (running context is not proof)');
    if (missingAudio.length)
      throw Error('Failed audio file requests: ' + missingAudio.slice(0, 3).join('; '));
    if (new URL(URL_TO_RUN).searchParams.get('fullMix') === '1') {
      const o = report.ownerAudio || {}, e = o.eventInputs || {};
      if (!report.audioMix?.tacticalSafety)
        throw Error('Full mix is not using the battle tactical compressor');
      if (!e.fireEvents || !e.combatEvents || !e.grenadeEvents || !e.voiceAccepted || !e.foleyEvents)
        throw Error('Missing full-mix event coverage: ' + JSON.stringify(e));
      if (!(o.grenades?.played?.explosion > 0) ||
          !(o.combat?.played?.impacts > 0) ||
          !(o.voice?.played > 0) ||
          !(Object.values(o.foley?.played || {}).reduce((a, b) => a + b, 0) > 0))
        throw Error('Full-mix owner sound playback not confirmed: ' + JSON.stringify(o));
    }
    if (runtimeErrors.length) throw Error('Browser errors: ' + runtimeErrors.slice(0, 3).join('; '));
  } finally {
    await browser.close();
  }
})().catch(err => { console.error('AUDIO LAB CAPTURE FAILED:', err.stack || err); process.exitCode = 1; });
