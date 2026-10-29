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
          assert.equal(audio.diagnosticVersion, 4);
          assert.equal(audio.backend.name, 'howler');
          assert.equal(errors.length, 0, 'browser runtime errors');
          assert.equal(missingAudio.length, 0, 'missing audio files');
          assert.equal(audio.backend.loadErrors + audio.backend.playErrors, 0);
          assert.ok(audio.silenceMarkers.length > 0, 'marker must preserve its preceding trace');
          assert.ok(audio.continuity.length >= 100, 'must record sustained continuity');
          assert.ok(!audio.continuity.some(x => x.clockStalled && !x.paused), 'running audio clock stalled');
          let slowSince = null,
            maxSlowMs = 0;
          for (const row of audio.continuity) {
            if (!row.paused && row.clockSlow) {
              if (slowSince === null) slowSince = row.realMs;
              maxSlowMs = Math.max(maxSlowMs, row.realMs - slowSince);
            } else slowSince = null;
          }
          assert.ok(maxSlowMs < 2000, `audio clock below 80% real-time for ${maxSlowMs}ms`);
          // Each 1 s row carries every ~100 ms chunk of rendered audio measured on the
          // audio thread since the previous row (audioWindow). A second counts as audible
          // if any chunk reaches SIGNAL; a single shot fills only part of a second, so
          // there is no per-second coverage bar, but the share of busy seconds is gated.
          // A busy second also needs 2+ starts inside their own distance model's range:
          // the dry path's linear model is silent past maxDistance by design.
          const SIGNAL = 0.00005,
            AUDIBLE_SHARE = 0.85;
          assert.ok(
            history.every(row => row.audioWindow && Array.isArray(row.audioWindow.chunkRms)),
            'history row without an audio-thread meter window'
          );
          // The in-range split must account for every start, and its share must stay
          // near calibration (10-29, both arms: off 0.18-0.26, standard 0.54-0.55), so a
          // gain or position bug cannot drop starts out of the judged population.
          const b = audio.backend,
            judged = b.inRangeStarts + b.outOfRangeStarts + b.mutedStarts;
          assert.equal(judged, b.started, 'every start is in range, out of range or muted');
          const inRangeShare = b.inRangeStarts / Math.max(1, b.started);
          // Nothing in the lab mutes a start; muted starts are how a gain bug would hide.
          assert.ok(
            b.mutedStarts <= b.started * 0.005,
            `${b.mutedStarts} of ${b.started} starts were muted at start`
          );
          assert.ok(
            inRangeShare >= (acoustics === 'off' ? 0.15 : 0.45),
            `only ${(inRangeShare * 100).toFixed(0)}% of starts in range of the listener`
          );
          const isBusy = row => !row.paused && row.deltaWeaponStarts >= 2 && row.deltaInRangeStarts >= 2;
          const busy = history.filter(isBusy);
          const thin = busy.filter(
            row => !row.audioWindow || row.audioWindow.source !== 'worklet' || row.audioWindow.audioMs < 500
          );
          assert.ok(
            busy.length >= 20 && thin.length <= busy.length * 0.1,
            `too few reads or starts to judge: ${busy.length} seconds with 2+ in-range starts, ${thin.length} with under 500 ms measured`
          );
          const audible = row => row.audioWindow && row.audioWindow.maxRms >= SIGNAL;
          let silent = 0,
            silentMax = 0;
          for (const row of history) {
            silent = isBusy(row) && !audible(row) ? silent + 1 : 0;
            silentMax = Math.max(silentMax, silent);
          }
          const audibleShare = busy.filter(audible).length / busy.length;
          const coverage =
            busy.reduce(
              (n, row) =>
                n +
                row.audioWindow.chunkRms.filter(x => x >= SIGNAL).length /
                  Math.max(1, row.audioWindow.chunks),
              0
            ) / busy.length;
          report.probe.silence = {
            starts: { inRange: b.inRangeStarts, outOfRange: b.outOfRangeStarts, muted: b.mutedStarts },
            inRangeShare,
            busySeconds: busy.length,
            audibleShare,
            meanChunkCoverage: coverage,
            maxSilentRun: silentMax
          };
          assert.ok(silentMax < 3, 'sustained internal silence while gunshots start');
          assert.ok(
            audibleShare >= AUDIBLE_SHARE,
            `only ${(audibleShare * 100).toFixed(0)}% of seconds with 2+ in-range starts carried signal`
          );
          const live = audio.continuity.filter(x => !x.paused);
          const achievedSpeed =
            live.length > 1
              ? (live.at(-1).simTime - live[0].simTime) / ((live.at(-1).realMs - live[0].realMs) / 1000)
              : 0;
          report.probe.achievedSimSecondsPerWallSecond = achievedSpeed;
          report.probe.nominalSpeedAchieved =
            mode === 'transitions' ? null : achievedSpeed >= Number(mode) * 0.8;
          fs.writeFileSync(`${out}/${name}.json`, JSON.stringify(report, null, 2));
          console.log(
            JSON.stringify({
              name,
              achievedSpeed,
              nominalSpeedAchieved: report.probe.nominalSpeedAchieved,
              fullscreen,
              samples: audio.continuity.length,
              peakActive: audio.backend.peakActive,
              busyDrops: audio.weapon.droppedBusy,
              silence: report.probe.silence,
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
