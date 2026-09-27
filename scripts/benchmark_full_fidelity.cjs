/* Full-fidelity browser benchmark: the real page with real FBX soldiers, weapons, clips and Babylon
 * rendering, no procedural fallback. It complements the headless benchmark (run_battle_benchmark.mjs,
 * which isolates the AI on the procedural rig) and never replaces it.
 *
 * What it does:
 *   1. loads the page with startup and pose timing on (window.BATTLE_PERF_TIMINGS, ?perfTimings=1);
 *   2. fails if the FBX library failed or any soldier is on the procedural rig (no soldier._fbx,
 *      i.e. soldier.rig is still the procedural rig object; FBX soldiers have rig===null);
 *   3. records the startup phases (BattleLoading) and per-file asset timings (BattleAssetTimings);
 *   4. fast-forwards FF_WARMUP sim seconds at a fixed 0.15 s step without rendering, so the armies
 *      are in contact (aim, fire and reload layers active), then runs the normal render loop for
 *      FF_SECONDS of wall time at FF_TIMESCALE and records per frame: frame interval, CPU time in the
 *      frame, scene render time, sim step time, active meshes, draw calls and GPU frame time where
 *      EXT_disjoint_timer_query is available; plus the pose timings (BattlePoseTimings);
 *   5. writes <FF_OUT>/full-fidelity.json and full-fidelity.md.
 * It blocks telemetry, learning and policy writes, so it is safe against production and previews.
 *
 *   node scripts/benchmark_full_fidelity.cjs                        # local server (see AGENTS.md)
 *   FF_URL='https://test.ivandpopov.com/grasstex/preview.php?ref=<branch>' node scripts/benchmark_full_fidelity.cjs
 *
 * Env:
 *   FF_URL        page URL (default http://127.0.0.1:8765/grasstex/battle_sim_local.php)
 *   FF_SEED       battle seed (default full-fidelity)
 *   FF_SECONDS    wall seconds of rendered battle to measure (default 60)
 *   FF_WARMUP     sim seconds to fast-forward before measuring (default 90; 0 = measure from the start)
 *   FF_TIMESCALE  battle speed while measuring (default 4, the page's default)
 *   FF_VIEWPORT   WIDTHxHEIGHT (default 1280x720)
 *   FF_GPU=1      launch Chromium with its own GPU settings instead of SwiftShader software WebGL
 *   FF_CHROME     Chromium/Chrome executable
 *   FF_ISOLATE=0  don't serve the page cross-origin isolated (then performance.now() is clamped to 100 us)
 *   FF_OUT        output dir (default $TMPDIR/full-fidelity)
 * The page's default overview camera is used (what a player sees on load). Exits non-zero on page
 * errors, a failed FBX load, any procedural soldier, or if the battle never advances.
 * Software rendering (SwiftShader) numbers are a CPU-only baseline, not a device result. */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {
    const { execSync } = require('node:child_process');
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}

const URL_ = process.env.FF_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SEED = process.env.FF_SEED || 'full-fidelity';
const SECONDS = Math.max(5, Number(process.env.FF_SECONDS || 60));
const WARMUP = Math.max(0, Number(process.env.FF_WARMUP ?? 90));
const TIMESCALE = Math.max(.1, Number(process.env.FF_TIMESCALE || 4));
const [VW, VH] = (process.env.FF_VIEWPORT || '1280x720').split('x').map(Number);
const GPU = process.env.FF_GPU === '1';
const ISOLATE = process.env.FF_ISOLATE !== '0';
const OUT = path.resolve(process.env.FF_OUT || path.join(os.tmpdir(), 'full-fidelity'));

function stats(values) {
  const a = values.filter(v => typeof v === 'number' && isFinite(v)).sort((x, y) => x - y);
  if (!a.length) return null;
  const q = p => +a[Math.min(a.length - 1, Math.floor(p * (a.length - 1) + .5))].toFixed(3);
  return { n: a.length, mean: +(a.reduce((s, v) => s + v, 0) / a.length).toFixed(3), p50: q(.5), p95: q(.95), p99: q(.99), max: +a[a.length - 1].toFixed(3) };
}
const r1 = v => v == null ? '—' : (+v).toFixed(1);
const r2 = v => v == null ? '—' : (+v).toFixed(2);
const pct = v => v == null ? '—' : (100 * v).toFixed(1) + '%';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const fail = [];
  const { chromium } = loadPlaywright();
  const args = ['--ignore-certificate-errors', '--no-sandbox', '--enable-webgl', '--ignore-gpu-blocklist'];
  if (!GPU) args.push('--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader');
  const browser = await chromium.launch({ args, executablePath: process.env.FF_CHROME || undefined });
  const wall0 = Date.now();
  try {
    const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: VW, height: VH } });
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e && e.stack || e).slice(0, 400)));
    await page.addInitScript(seed => {
      window.BATTLE_PERF_TIMINGS = true;
      // Presentation draws Math.random (idle variants, FX); seed it so repeated runs pose the same men.
      let h = 1779033703 ^ seed.length;
      for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
      let a = h >>> 0;
      Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }, 'full-fidelity:' + SEED);
    await page.route('**/*', async route => {
      const req = route.request();
      if (req.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(req.url())) return route.fulfill({ json: {} });
      // Cross-origin isolation (COOP + COEP credentialless on the page itself) lifts Chrome's
      // performance.now() clamp from 100 us to 5 us, which per-soldier pose timing needs.
      if (ISOLATE && req.isNavigationRequest() && req.resourceType() === 'document') {
        const res = await route.fetch({ maxRedirects: 0 }).catch(() => null);
        if (!res || res.status() >= 300 && res.status() < 400) return route.continue();
        return route.fulfill({ response: res, headers: { ...res.headers(), 'cross-origin-opener-policy': 'same-origin', 'cross-origin-embedder-policy': 'credentialless' } });
      }
      return route.continue();
    });
    const url = URL_ + (URL_.includes('?') ? '&' : '?') + 'seed=' + encodeURIComponent(SEED) + '&perfTimings=1';
    await page.goto(url, { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction(() => window.__battle__ && window.BattleLoading && BattleLoading.timings && BattleLoading.timings().finishedAt != null,
      null, { timeout: 300000, polling: 250 });
    const loadWallS = (Date.now() - wall0) / 1000;

    const boot = await page.evaluate(() => {
      const b = window.__battle__, all = [...b._roster.us, ...b._roster.ge];
      const F = window.BattleFbxSoldier, status = F ? F.status(b.scene) : null, engine = b.scene.getEngine();
      let gl = null; try { gl = engine.getGlInfo(); } catch (_) {}
      return {
        build: window.BATTLE_BUILD_DEPLOYED || window.BATTLE_BUILD || null, preview: window.BATTLE_PREVIEW || null, href: location.href,
        soldiers: all.length, fbx: all.filter(s => s._fbx && s.rig === null).length,
        procedural: all.filter(s => !s._fbx || s.rig !== null).map(s => s.id).slice(0, 20),
        fbxStatus: status && { ready: status.ready, enabled: status.enabled, error: status.error, active: status.active, clips: status.clips, bones: status.bones },
        renderer: gl, timerQuery: !!(engine.getCaps && engine.getCaps().timerQuery), hardwareScaling: engine.getHardwareScalingLevel(),
        canvas: { width: engine.getRenderWidth(), height: engine.getRenderHeight() },
        crossOriginIsolated: !!window.crossOriginIsolated,
        poseTimingOn: !!(window.BattlePoseTimings && BattlePoseTimings.enabled()), assetTimingOn: !!(window.BattleAssetTimings && BattleAssetTimings.enabled),
      };
    });
    if (!boot.fbxStatus || !boot.fbxStatus.ready) fail.push('FBX library not ready: ' + JSON.stringify(boot.fbxStatus));
    if (boot.fbx !== boot.soldiers || boot.procedural.length) fail.push(`${boot.soldiers - boot.fbx} of ${boot.soldiers} soldiers on the procedural rig (ids ${boot.procedural.join(',')})`);
    if (!boot.poseTimingOn || !boot.assetTimingOn) fail.push('instrumentation not enabled (page predates BattlePoseTimings/BattleAssetTimings?)');
    const startup = await page.evaluate(() => window.BattleAssetTimings ? BattleAssetTimings.snapshot() : null);

    // Start the battle, fast-forward to contact without rendering, then hand back to the render loop.
    await page.getByText('Start battle').first().click().catch(() => {});
    const warm = await page.evaluate(async ({ warmup }) => {
      const b = window.__battle__, engine = b.scene.getEngine(), C = window.BattleCommanderAI, tick = (C && C.commandTick) || .45;
      const scenario = b.scene.metadata && b.scene.metadata.battleScenario, t0 = performance.now();
      engine.stopRenderLoop(); b.paused = false; b.timeScale = 1;
      let accum = 0;
      for (let t = 0; t < warmup && !b.winner; t += .15) {
        b.step(.15); accum += .15;
        while (C && accum + 1e-9 >= tick && !b.winner) { accum -= tick; C.update(b, scenario, tick); }
        if ((t / .15) % 40 === 39) await new Promise(r => setTimeout(r, 0));
      }
      return { simTime: b.time, wallMs: performance.now() - t0, winner: b.winner || null };
    }, { warmup: WARMUP });

    await page.evaluate(({ timeScale }) => {
      const b = window.__battle__, scene = b.scene, engine = scene.getEngine();
      const rec = window.__ff = { frames: [], begin: null, lastBegin: null, sim: 0, simTime0: b.time };
      const si = new BABYLON.SceneInstrumentation(scene);
      si.captureFrameTime = true; si.captureRenderTime = true; si.captureActiveMeshesEvaluationTime = true;
      let ei = null; try { ei = new BABYLON.EngineInstrumentation(engine); ei.captureGPUFrameTime = true; } catch (_) { ei = null; }
      rec.si = si; rec.ei = ei;
      const origFrame = b._frame;
      b._frame = function () { const t = performance.now(); try { return origFrame.apply(this, arguments); } finally { rec.sim += performance.now() - t; } };
      engine.onBeginFrameObservable.add(() => { const t = performance.now(); rec.interval = rec.lastBegin == null ? null : t - rec.lastBegin; rec.lastBegin = rec.begin = t; rec.sim = 0; });
      scene.onBeforeRenderObservable.add(() => { rec.renderStart = performance.now(); }, undefined, true);
      scene.onAfterRenderObservable.add(() => { rec.renderEnd = performance.now(); });
      engine.onEndFrameObservable.add(() => {
        if (!rec.on) return;
        const gpu = ei && ei.gpuFrameTimeCounter ? ei.gpuFrameTimeCounter.current : 0;
        rec.frames.push({
          interval: rec.interval, cpu: performance.now() - rec.begin, scene: rec.renderEnd - rec.renderStart, sim: rec.sim,
          render: si.renderTimeCounter.current, activeMeshesEval: si.activeMeshesEvaluationTimeCounter.current,
          activeMeshes: scene.getActiveMeshes().length, drawCalls: si.drawCallsCounter ? si.drawCallsCounter.current : null,
          gpu: gpu > 0 ? gpu / 1e6 : null,
        });
      });
      window.BattlePoseTimings.reset();
      b.timeScale = timeScale; b.paused = false; rec.on = true; rec.wall0 = performance.now();
      engine.runRenderLoop(window.__battleRenderLoop__ || (() => scene.render()));
    }, { timeScale: TIMESCALE });

    await page.waitForTimeout(SECONDS * 1000);

    const run = await page.evaluate(() => {
      const b = window.__battle__, rec = window.__ff; rec.on = false;
      const all = [...b._roster.us, ...b._roster.ge];
      return {
        frames: rec.frames.slice(1), wallMs: performance.now() - rec.wall0, simAdvanced: b.time - rec.simTime0, simTime: b.time,
        alive: { us: b.factions.us.alive, ge: b.factions.ge.alive }, winner: b.winner || null,
        stillFbx: all.every(s => s._fbx && s.rig === null), pose: window.BattlePoseTimings.snapshot(),
      };
    });
    if (!run.stillFbx) fail.push('a soldier left the FBX backend during the run');
    if (!(run.simAdvanced > 0)) fail.push('battle did not advance while measuring');
    if (run.frames.length < 3) fail.push(`only ${run.frames.length} frames rendered in ${SECONDS} s`);
    if (pageErrors.length) fail.push(...pageErrors.slice(0, 5).map(e => 'pageerror: ' + e));

    const col = k => run.frames.map(f => f[k]);
    const interval = stats(col('interval'));
    const software = !GPU || /swiftshader|llvmpipe|software/i.test(JSON.stringify(boot.renderer || ''));
    const result = {
      kind: 'full-fidelity-browser-benchmark', version: 1, when: new Date().toISOString(),
      url: URL_, seed: SEED, seconds: SECONDS, warmup: WARMUP, timeScale: TIMESCALE, viewport: { width: VW, height: VH },
      rendererClass: software ? 'software (SwiftShader) - CPU-only baseline, not a device result' : 'hardware GPU',
      boot, loadWallS: +loadWallS.toFixed(1), startup, warm,
      frames: {
        count: run.frames.length, wallMs: Math.round(run.wallMs), simAdvanced: +run.simAdvanced.toFixed(2),
        fps: interval ? { mean: +(1000 / interval.mean).toFixed(2), median: +(1000 / interval.p50).toFixed(2), p95Low: +(1000 / interval.p95).toFixed(2), p99Low: +(1000 / interval.p99).toFixed(2) } : null,
        intervalMs: interval, cpuMs: stats(col('cpu')), sceneRenderMs: stats(col('scene')), renderMs: stats(col('render')),
        simMs: stats(col('sim')), activeMeshesEvalMs: stats(col('activeMeshesEval')),
        activeMeshes: stats(col('activeMeshes')), drawCalls: stats(col('drawCalls')), gpuMs: stats(col('gpu')),
        gpuTiming: boot.timerQuery ? (stats(col('gpu')) ? 'measured' : 'timer query present, no samples') : 'unsupported (no EXT_disjoint_timer_query)',
      },
      pose: run.pose, end: { simTime: run.simTime, alive: run.alive, winner: run.winner },
      fail, ok: !fail.length,
    };
    fs.writeFileSync(path.join(OUT, 'full-fidelity.json'), JSON.stringify({ ...result, frameSamples: run.frames }, null, 2));
    fs.writeFileSync(path.join(OUT, 'full-fidelity.md'), markdown(result));
    console.log(markdown(result));
    console.log('OUT ' + OUT);
    console.log(fail.length ? 'FAIL\n- ' + fail.join('\n- ') : 'OK');
    if (fail.length) process.exitCode = 1;
  } finally { await Promise.race([browser.close(), new Promise(r => setTimeout(r, 5000))]); }
})().catch(e => { console.error('FULL-FIDELITY FAIL', e && e.stack || e); process.exit(1); });

function markdown(r) {
  const L = [], f = r.frames, p = r.pose || {}, s = r.startup || {};
  L.push(`# Full-fidelity benchmark: ${r.seed}`, '');
  L.push(`- Page: ${r.boot.href}`, `- Build: ${r.boot.build}`, `- Renderer: ${r.rendererClass}${r.boot.renderer ? ` (${r.boot.renderer.renderer})` : ''}`);
  L.push(`- Soldiers: ${r.boot.soldiers}, FBX ${r.boot.fbx}; viewport ${r.viewport.width}x${r.viewport.height}; warm-up ${r.warm.simTime.toFixed(1)} sim s; measured ${(f.wallMs / 1000).toFixed(1)} s wall, ${f.simAdvanced} sim s at ${r.timeScale}x`);
  L.push(`- Result: ${r.ok ? 'OK' : 'FAIL: ' + r.fail.join('; ')}`, '');
  L.push('## Frames', '', '| metric | mean | median | p95 | p99 | max |', '| --- | --- | --- | --- | --- | --- |');
  const row = (name, st) => st && L.push(`| ${name} | ${r2(st.mean)} | ${r2(st.p50)} | ${r2(st.p95)} | ${r2(st.p99)} | ${r2(st.max)} |`);
  row('frame interval (ms)', f.intervalMs); row('CPU in frame (ms)', f.cpuMs); row('scene.render (ms)', f.sceneRenderMs);
  row('Babylon render time (ms)', f.renderMs); row('sim step (ms)', f.simMs); row('pose, all soldiers (ms)', p.frameMs);
  row('active meshes', f.activeMeshes); row('draw calls', f.drawCalls); row('GPU frame (ms)', f.gpuMs);
  if (f.fps) L.push('', `FPS: mean ${f.fps.mean}, median ${f.fps.median}, p95-low ${f.fps.p95Low}, p99-low ${f.fps.p99Low} over ${f.count} frames. GPU timing: ${f.gpuTiming}.`);
  if (p.frames) {
    L.push('', '## Pose (applyPose)', '', `${p.frames} frames, ${r2(p.posedPerFrame.mean)} soldiers posed per frame; per soldier ${r1(p.perSoldierUs.mean)} µs mean, ${r1(p.perSoldierUs.p95)} µs p95 (timer resolution ~${p.timerResolutionUs} µs).`,
      `Posed soldiers: ${pct(p.posed.deadShare)} dead, ${pct(p.posed.offscreenShare)} outside the view frustum; camera distance <25 m ${pct(p.posed.cameraDistance.under25m)}, 25-60 m ${pct(p.posed.cameraDistance.m25to60)}, 60-150 m ${pct(p.posed.cameraDistance.m60to150)}, >150 m ${pct(p.posed.cameraDistance.over150m)}.`, '',
      '| layer | share | µs per soldier-frame | µs per run | ms per frame (mean / p95) |', '| --- | --- | --- | --- | --- |');
    for (const [k, v] of Object.entries(p.layers)) L.push(`| ${k} | ${pct(v.share)} | ${r2(v.usPerSoldierFrame)} | ${r2(v.usPerRun)} | ${r2(v.msPerFrame.mean)} / ${r2(v.msPerFrame.p95)} |`);
    L.push('', '| inputs | recomputed | unchanged (exact) | unchanged at 30 Hz clip rate | layer-only inputs unchanged |', '| --- | --- | --- | --- | --- |');
    for (const [k, v] of Object.entries(p.inputs)) L.push(`| ${k} | ${v.recomputed} | ${pct(v.unchangedShare)} | ${pct(v.unchangedShareAtClipRate)} | ${pct(v.layerInputsUnchangedShare)} |`);
  }
  if (s.totals) {
    L.push('', '## Startup', '');
    if (s.page) {
      L.push('| phase | ms |', '| --- | --- |');
      for (const ph of s.page.phases) L.push(`| ${ph.label} | ${r1(ph.ms)} |`);
      L.push(`| loading finished at | ${r1(s.page.finishedAt)} |`, '');
    }
    const t = s.totals;
    L.push(`FBX library: ${r1(s.library.wallMs)} ms wall (loader script ${r1(s.library.loaderScriptMs)} ms, binding clips to models ${r1(s.library.bindClipsMs)} ms); ${t.files} files, ${(t.bytes / 1048576).toFixed(1)} MiB; ${s.binds.count} soldier binds ${r1(s.binds.totalMs)} ms.`, '',
      'Summed per-file time (ms). Files load in parallel, so sums exceed wall time. Stall is time queued in the browser before the request went out (connection limit); queue wait is time between the last byte and the start of the parse (the main thread busy parsing other files).', '',
      '| download (stall / transfer) | queue wait | Babylon parse | prepare (normals / palms) | clip convert | clip dispose | retarget | grip solve | sidecar |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
      `| ${r1(t.download)} (${r1(t.stall)} / ${r1(t.transfer)}) | ${r1(t.wait)} | ${r1(t.parse)} | ${r1(t.prepare)} (${r1(t.normals)} / ${r1(t.palms)}) | ${r1(t.convert)} | ${r1(t.dispose)} | ${r1(t.retarget)} | ${r1(t.grips)} | ${r1(t.sidecar)} |`, '');
    L.push('| kind | files | MiB | download | parse | prepare | convert | retarget | grips |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const [k, v] of Object.entries(s.byKind)) L.push(`| ${k} | ${v.files} | ${(v.bytes / 1048576).toFixed(1)} | ${r1(v.download)} | ${r1(v.parse)} | ${r1(v.prepare)} | ${r1(v.convert)} | ${r1(v.retarget)} | ${r1(v.grips)} |`);
    L.push('', 'Slowest files (download + wait + CPU work):', '', '| file | kind | KiB | total | download | wait | parse | work |', '| --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const x of s.slowest) L.push(`| ${x.file} | ${x.kind} | ${x.bytes ? Math.round(x.bytes / 1024) : '—'} | ${r1(x.totalMs)} | ${r1(x.download)} | ${r1(x.wait)} | ${r1(x.parse)} | ${r1(x.workMs)} |`);
  }
  return L.join('\n') + '\n';
}
