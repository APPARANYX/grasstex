#!/usr/bin/env node
'use strict';
/* Noninteractive browser capture of the real Grasstex 10v10 audio history lab.
   Writes metadata only; no licensed audio or voice assets are exported. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const URL_TO_RUN = process.env.AUDIO_LAB_URL ||
  'https://test.ivandpopov.com/grasstex/battle/audio_lab.html?log=0&tacticalController=new&squads=5&occlusion=mixed';
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
    const runtimeErrors = [];
    page.on('pageerror', err => runtimeErrors.push(String(err.stack || err)));
    page.on('console', msg => {
      if (msg.type() === 'error') runtimeErrors.push(msg.text().slice(0, 700));
    });
    const response = await page.goto(URL_TO_RUN, { waitUntil: 'domcontentloaded', timeout: 90000 });
    if (!response || !response.ok()) throw Error('Lab page HTTP ' + (response ? response.status() : 'no response'));
    await page.waitForFunction(() => window.__audioLab && window.__audioLab.done === true, null, { timeout: TIMEOUT });
    const report = await page.evaluate(() => window.__audioLab.final);
    report.browser = { userAgent: await page.evaluate(() => navigator.userAgent), pageErrors: runtimeErrors };
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
    console.log('Scheduler primary evictions:', report.summary.schedulerPrimaryEvictions,
      '| far skips:', report.summary.schedulerFarSkipped, '| far throttles:', report.summary.schedulerFarThrottled);
    console.log('Peak active:', report.summary.maxActiveVoices, '| max queue:', report.summary.maxQueue,
      '| long tasks:', report.summary.longTasks, '| context:', report.summary.endingContext);
    console.log('Wrote', OUT);
    if (report.status !== 'completed') throw Error('Audio lab did not complete: ' + JSON.stringify(report.errors));
    if (report.summary.simulatedShots <= 0 || report.summary.playRequests <= 0)
      throw Error('No verified simulated shots / audio playback starts');
    if (report.summary.endingContext !== 'running') throw Error('AudioContext not running at completion');
    if (runtimeErrors.length) throw Error('Browser errors: ' + runtimeErrors.slice(0, 3).join('; '));
  } finally {
    await browser.close();
  }
})().catch(err => { console.error('AUDIO LAB CAPTURE FAILED:', err.stack || err); process.exitCode = 1; });
