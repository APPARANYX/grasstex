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
function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 1;
}
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
    // the informational old-path control and is recorded, not gated. On CI runners
    // the old path at 100 voices read a median clock of 0.85 to 1.00 (10-29, 4 runs),
    // so clock speed alone cannot separate it on a fast runner; the spatial
    // automation count below does, on any runner.
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
      // Count automation events scheduled on listener and panner position/orientation
      // params: the cost mechanism itself, independent of how fast the runner is.
      await page.addInitScript(() => {
        const params = new WeakSet(),
          names = ['positionX', 'positionY', 'positionZ', 'orientationX', 'orientationY', 'orientationZ'];
        window.__spatialAutomation = { params, calls: 0, track: [] };
        const create = BaseAudioContext.prototype.createPanner;
        BaseAudioContext.prototype.createPanner = function () {
          const node = create.apply(this, arguments);
          names.forEach(n => node[n] && params.add(node[n]));
          return node;
        };
        [
          'setValueAtTime',
          'setTargetAtTime',
          'linearRampToValueAtTime',
          'exponentialRampToValueAtTime',
          'setValueCurveAtTime'
        ].forEach(method => {
          const original = AudioParam.prototype[method];
          AudioParam.prototype[method] = function () {
            if (params.has(this)) window.__spatialAutomation.calls++;
            return original.apply(this, arguments);
          };
        });
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
          const listener = Howler.ctx && Howler.ctx.listener;
          if (listener)
            ['positionX', 'positionY', 'positionZ', 'forwardX', 'forwardY', 'forwardZ', 'upX', 'upY', 'upZ']
              .filter(n => listener[n])
              .forEach(n => __spatialAutomation.params.add(listener[n]));
          __pressure.automationAtStart = __spatialAutomation.calls;
          // Rendering stays stopped, but the listener and voices still move every
          // tick, as they do in play; a static listener hid per-frame automation cost.
          const scene = __battle__.scene,
            cam = scene.activeCamera,
            home = (cam.globalPosition || cam.position).clone();
          let tick = 0;
          __pressure.timer = setInterval(() => {
            tick++;
            __pressure.ticks = tick;
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
            started: __pressure.started,
            spatialAutomationPerSecond:
              (__spatialAutomation.calls - __pressure.automationAtStart) /
              ((performance.now() - __pressure.started) / 1000),
            spatialAutomationPerTick:
              (__spatialAutomation.calls - __pressure.automationAtStart) / Math.max(1, __pressure.ticks || 0),
            ticks: __pressure.ticks || 0
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
        // Spatial automation events per voice per position tick. Local 10-29: direct ~0.08
        // (one-off setup per play), old per-frame path ~3.1; per tick, so a starved
        // runner that ticks less often does not blur the two.
        assert.ok(report.ticks >= 100, `only ${report.ticks} position ticks`);
        const automationPerVoice = report.spatialAutomationPerTick / count;
        if (automation)
          // Negative control: the counter must see the old path, or the gate below is blind.
          assert.ok(
            automationPerVoice >= 1.5,
            `old-path control shows ${automationPerVoice.toFixed(2)} automation events per voice per tick`
          );
        else if (spatial === '3d')
          assert.ok(
            automationPerVoice <= 0.5,
            `${automationPerVoice.toFixed(2)} spatial automation events per voice per tick`
          );
        if (automation) {
          const trace = report.audio.continuity.filter(x => x.realMs >= report.started + 5000);
          console.log(
            JSON.stringify({
              name,
              informational: true,
              minClockRatio: Math.min(...trace.map(x => x.clockProgressRatio ?? 1)),
              medianClockRatio: median(trace.map(x => x.clockProgressRatio ?? 1)),
              spatialAutomationPerTick: report.spatialAutomationPerTick,
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
        // The fix held a median of 1.000 on every CI run; the old path drifts below
        // real time long before any 2 s stretch under 0.8.
        const medianClock = median(trace.map(x => x.clockProgressRatio ?? 1));
        assert.ok(medianClock >= 0.98, `audio clock median ${medianClock.toFixed(3)} below 0.98 real-time`);
        assert.ok(
          trace.some(x => x.output.rms > 0.00005),
          'no master signal'
        );
        console.log(
          JSON.stringify({
            name,
            meanActive: mean,
            slowMs,
            medianClockRatio: medianClock,
            spatialAutomationPerTick: report.spatialAutomationPerTick,
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
