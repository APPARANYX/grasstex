#!/usr/bin/env node
'use strict';
// Controlled audio graph pressure on the mini-target page. This deliberately
// pauses simulation/rendering; it is not evidence of natural tactical behavior.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const base = process.env.TARGET_AUDIO_URL;
assert.ok(base, 'TARGET_AUDIO_URL required');
const out = process.env.TARGET_AUDIO_OUT || 'reports/target-audio-pressure';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist'
    ]
  });
  let failures = 0;
  try {
    // 3d-automation restores Howler's per-frame pos()/orientation() writes; it is
    // the informational old-path control and is recorded, not gated.
    const cases = [
      ['3d', 60],
      ['3d', 100],
      ['3d-automation', 100],
      ['flat', 60],
      ['flat', 100]
    ];
    for (const [variant, count] of cases) {
      const spatial = variant === 'flat' ? 'flat' : '3d',
        automation = variant === '3d-automation';
      const name = `${variant}-${count}`,
        errors = [];
      const page = await browser.newPage({ ignoreHTTPSErrors: true });
      page.on('pageerror', e => errors.push(String(e)));
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
          labMove: 'autonomous',
          stressAct: 0,
          audioBackend: 'howler',
          audioSpatial: spatial,
          ...(automation ? { audioSpatialWrite: 'automation' } : {}),
          acoustics: 'off',
          audioDiag: 1
        }).forEach(([k, v]) => url.searchParams.set(k, v));
        await page.goto(url.href, { waitUntil: 'load', timeout: 180000 });
        await page.waitForFunction(
          () => window.SKILLS_LAB && window.BattleSkillsLab && window.__battleAudioDiagnostics__,
          null,
          { timeout: 120000 }
        );
        await page.click('#skillPlay');
        await page.evaluate(count => {
          __battle__.pause();
          const scene = __battle__.scene;
          scene.getEngine().stopRenderLoop();
          const cam = scene.activeCamera.globalPosition || scene.activeCamera.position;
          const files = BATTLE_AUDIO_MANIFEST.categories['weapon.m1-garand'].fire;
          const base = window.BATTLE_AUDIO_BASE || 'audio/';
          const voices = Array.from({ length: count }, (_, i) => {
            const file = base + files[i % files.length];
            const sound = new BattleAudioBackend.Sound(
              'pressure-' + i,
              BattleAudioFormat.url(file),
              scene,
              null,
              {
                spatialSound: true,
                volume: 0.004,
                refDistance: 1,
                maxDistance: 100,
                rolloffFactor: 1,
                distanceModel: 'linear'
              }
            );
            sound.setPosition({ x: cam.x + 10, y: cam.y, z: cam.z });
            return sound;
          });
          window.__pressure = { voices, samples: [], timer: null, started: null };
        }, count);
        await page.waitForFunction(() => __pressure.voices.every(s => s.isReady()), null, {
          timeout: 90000
        });
        await page.evaluate(() => {
          __pressure.initialModels = __pressure.voices
            .flatMap(s => s._entry.howl._sounds.map(instance => instance._panner?.panningModel))
            .filter(Boolean);
          __pressure.started = performance.now();
          // Rendering stays stopped, but the listener and voices still move every
          // tick, as they do in play; a static listener hid per-frame automation cost.
          const scene = __battle__.scene,
            cam = scene.activeCamera,
            home = (cam.globalPosition || cam.position).clone();
          let tick = 0;
          __pressure.timer = setInterval(() => {
            tick++;
            cam.position.x = home.x + Math.sin(tick * 0.02) * 2;
            if (cam.computeWorldMatrix) cam.computeWorldMatrix(true);
            __pressure.voices.forEach((s, i) =>
              s.setPosition({ x: home.x + 10 + Math.sin(tick * 0.05 + i), y: home.y, z: home.z })
            );
            scene.onBeforeRenderObservable.notifyObservers(scene);
            __pressure.voices.forEach(s => {
              if (!s.isPlaying) s.play();
            });
            const playing = __pressure.voices.filter(s => s._id != null && s._entry.howl.playing(s._id));
            const nodes = playing.map(s => s._entry.howl._soundById(s._id)?._panner).filter(Boolean);
            const panners = nodes.length;
            const hrtf = nodes.filter(node => node.panningModel === 'HRTF').length;
            __pressure.samples.push({ realMs: performance.now(), playing: playing.length, panners, hrtf });
          }, 20);
        });
        await page.waitForTimeout(65000);
        report = await page.evaluate(() => {
          clearInterval(__pressure.timer);
          const result = {
            audio: __battleAudioDiagnostics__(),
            samples: __pressure.samples,
            initialModels: __pressure.initialModels,
            started: __pressure.started
          };
          __pressure.voices.forEach(s => s.dispose());
          return result;
        });
        report.test = {
          name,
          spatial,
          requestedVoices: count,
          errors,
          kind: 'controlled-audio-only-no-rendering',
          spatialWrite: report.audio.backend.spatialWrite,
          informational: automation,
          durationSeconds: 65
        };
        fs.writeFileSync(`${out}/${name}.json`, JSON.stringify(report, null, 2));
        if (automation) {
          const trace = report.audio.continuity.filter(x => x.realMs >= report.started + 5000);
          console.log(
            JSON.stringify({
              name,
              informational: true,
              minClockRatio: Math.min(...trace.map(x => x.clockProgressRatio ?? 1)),
              backend: report.audio.backend.spatialWrite
            })
          );
          continue;
        }
        assert.equal(errors.length, 0);
        assert.equal(report.audio.backend.spatialMode, spatial);
        assert.equal(report.audio.backend.loadErrors + report.audio.backend.playErrors, 0);
        assert.ok(
          report.initialModels.every(model => model === 'equalpower'),
          'unintended initial HRTF panner'
        );
        const active = report.samples.filter(x => x.realMs >= report.started + 5000);
        assert.ok(
          active.every(x => x.hrtf === 0),
          'unintended active HRTF panner'
        );
        const mean = active.reduce((n, x) => n + x.playing, 0) / active.length;
        assert.ok(mean >= count * 0.85, `insufficient load: mean ${mean}/${count}`);
        assert.ok(Math.max(...active.map(x => x.playing)) >= count, 'must reach requested concurrency');
        if (spatial === 'flat')
          assert.ok(
            active.every(x => x.panners === 0),
            'flat path allocated a panner'
          );
        else
          assert.ok(
            active.some(x => x.panners >= count),
            '3d control must allocate requested panners'
          );
        const trace = report.audio.continuity.filter(x => x.realMs >= report.started + 5000);
        let since = null,
          slowMs = 0;
        for (const row of trace) {
          if (row.clockSlow) {
            if (since === null) since = row.realMs;
            slowMs = Math.max(slowMs, row.realMs - since);
          } else since = null;
        }
        assert.ok(slowMs < 2000, `sustained clock slowdown ${slowMs}ms`);
        assert.ok(
          trace.some(x => x.output.rms > 0.00005),
          'no master signal'
        );
        console.log(
          JSON.stringify({
            name,
            meanActive: mean,
            slowMs,
            minClockRatio: Math.min(...trace.map(x => x.clockProgressRatio ?? 1))
          })
        );
      } catch (error) {
        failures++;
        console.error(name, String(error));
        fs.writeFileSync(
          `${out}/${name}-failure.json`,
          JSON.stringify({ error: String(error.stack), errors, report }, null, 2)
        );
      } finally {
        await page.close();
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
