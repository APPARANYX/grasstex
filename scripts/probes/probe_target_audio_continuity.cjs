#!/usr/bin/env node
'use strict';
// Real rendered mini-target drill; playback remains on the production owners.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const base = process.env.TARGET_AUDIO_URL;
assert.ok(base, 'TARGET_AUDIO_URL must point at the exact-head mini-target preview');
const seconds = Math.max(70, Math.min(120, Number(process.env.TARGET_AUDIO_SECONDS) || 75));
const out = process.env.TARGET_AUDIO_OUT || 'reports/target-audio';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--disable-dev-shm-usage',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist'
    ]
  });
  let failures = 0;
  try {
    for (const acoustics of ['off', 'standard']) {
      for (const mode of ['1', '2', '4', 'transitions']) {
        const name = `${acoustics}-${mode}`;
        const page = await browser.newPage({
          viewport: { width: 1440, height: 1000 },
          ignoreHTTPSErrors: true
        });
        const errors = [],
          missingAudio = [],
          sourceChecks = [];
        page.on('pageerror', e => errors.push(String(e)));
        page.on('response', response => {
          const pathname = new URL(response.url()).pathname;
          if (pathname.includes('/Assets/audio/') && response.status() >= 400)
            missingAudio.push({ url: response.url(), status: response.status() });
          for (const file of [
            'battle/skills-lab.js',
            'battle/modules/00-audio-backend.js',
            'battle/acoustics.js'
          ]) {
            if (decodeURI(pathname).endsWith('/' + file))
              sourceChecks.push(
                response.text().then(body => ({ file, matches: body === fs.readFileSync(file, 'utf8') }))
              );
          }
        });
        let report;
        try {
          const url = new URL(base);
          Object.entries({
            skillsLab: 1,
            combatLab: 1,
            tacticalController: 'new',
            labDistance: 120,
            labCover: 'mixed',
            seed: 'skills-range-0001',
            pinSeed: 1,
            labRange: 1,
            labDuration: 600,
            labMove: 'autonomous',
            stressAct: 0,
            audioBackend: 'howler',
            audioMix: 'main',
            audioDiag: 1,
            acoustics
          }).forEach(([k, v]) => url.searchParams.set(k, v));
          await page.goto(url.href, { waitUntil: 'load', timeout: 180000 });
          await page.waitForFunction(
            () =>
              window.SKILLS_LAB &&
              window.BattleSkillsLab &&
              window.__battle__ &&
              window.__battleAudioDiagnostics__,
            null,
            { timeout: 120000 }
          );
          for (const check of await Promise.all(sourceChecks))
            assert.ok(check.matches, `stale preview source: ${check.file}`);
          assert.ok(sourceChecks.length >= 3, 'must verify served runtime source');
          await page.evaluate(
            speed => __battle__.setTimeScale(speed),
            mode === 'transitions' ? 1 : Number(mode)
          );
          await page.click('#skillPlay');
          await page.waitForFunction(() => __battleAudioDiagnostics__().backend.started > 0, null, {
            timeout: 90000
          });
          // A real gesture exercises the fullscreen entry path. Headless support is recorded.
          await page.evaluate(() => {
            const button = document.createElement('button');
            button.id = 'audioProbeFullscreen';
            button.textContent = 'Fullscreen';
            button.style = 'position:fixed;top:0;left:0;z-index:999999';
            button.onclick = () => document.documentElement.requestFullscreen().catch(() => {});
            document.body.appendChild(button);
          });
          await page.click('#audioProbeFullscreen');
          const fullscreen = await page.evaluate(() => !!document.fullscreenElement);
          const start = Date.now();
          let stage = 0;
          while ((Date.now() - start) / 1000 < seconds) {
            const elapsed = (Date.now() - start) / 1000;
            const next = elapsed >= 30 ? 2 : elapsed >= 15 ? 1 : 0;
            if (mode === 'transitions' && next !== stage) {
              stage = next;
              await page.evaluate(speed => __battle__.setTimeScale(speed), stage === 1 ? 2 : 4);
              if (stage === 1)
                await page.evaluate(() => document.fullscreenElement && document.exitFullscreen());
              else await page.click('#audioProbeFullscreen');
            }
            await page.waitForTimeout(1000);
          }
          await page.click('#skillAudioSilence');
          report = await page.evaluate(() => BattleSkillsLab.snapshot());
          report.probe = { mode, acoustics, seconds, fullscreen, errors, missingAudio };
          fs.writeFileSync(`${out}/${name}.json`, JSON.stringify(report, null, 2));
          const audio = report.audio,
            history = audio.outputHistory;
          assert.equal(audio.diagnosticVersion, 2);
          assert.equal(audio.backend.name, 'howler');
          assert.equal(errors.length, 0, 'browser runtime errors');
          assert.equal(missingAudio.length, 0, 'missing audio files');
          assert.equal(audio.backend.loadErrors + audio.backend.playErrors, 0);
          assert.ok(audio.silenceMarkers.length > 0, 'marker must preserve its preceding trace');
          assert.ok(audio.continuity.length >= 100, 'must record sustained continuity');
          assert.ok(!audio.continuity.some(x => x.clockStalled && !x.paused), 'running audio clock stalled');
          let silent = 0,
            silentMax = 0;
          for (const row of history) {
            silent = !row.paused && row.deltaWeaponStarts >= 2 && row.output.rms < 0.00005 ? silent + 1 : 0;
            silentMax = Math.max(silentMax, silent);
          }
          assert.ok(silentMax < 3, 'sustained internal silence while gunshots start');
          assert.ok(
            history.some(x => x.deltaWeaponStarts > 0 && x.output.rms > 0.00005),
            'must produce audio'
          );
          console.log(
            JSON.stringify({
              name,
              fullscreen,
              samples: audio.continuity.length,
              peakActive: audio.backend.peakActive,
              busyDrops: audio.weapon.droppedBusy,
              scheduler: audio.scheduler
            })
          );
        } catch (error) {
          failures++;
          fs.writeFileSync(
            `${out}/${name}-failure.json`,
            JSON.stringify({ error: String(error.stack), errors, missingAudio, report }, null, 2)
          );
          console.error(name, String(error));
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
  if (failures) process.exitCode = 1;
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
