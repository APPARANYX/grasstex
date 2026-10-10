/* Real-page check that live 1x/4x/8x retain the pre-clock observer behavior,
 * and the explicit fixed-clock opt-in still uses 0.15 s steps.
 *
 * Frames run on a VIRTUAL wall clock (engine.getDeltaTime is pinned and the before-render
 * observers are notified directly), so the result does not depend on how fast software WebGL
 * renders. Per arm it reports the share of frames in which a moving soldier's position changes
 * and the median of each soldier's largest per-frame jump.
 *
 * Requires Playwright and the local battle PHP server:
 *   node scripts/check_realtime_smoothness.cjs
 * Env: CHECK_URL, CHECK_SEED, CHECK_FPS (60), CHECK_SECONDS (10), CHECK_CHROME (executable path)
 * Exits non-zero if the default live path differs from ?fixedClock=0 at 1x/4x/8x,
 * or if the explicit parity clock stops running fixed steps. */
'use strict';

const path = require('node:path');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (e) {
    const { execSync } = require('node:child_process');
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}

const URL_ = process.env.CHECK_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SEED = process.env.CHECK_SEED || 'realtime-smoothness';
const FPS = Math.max(10, Number(process.env.CHECK_FPS || 60));
const SECONDS = Math.max(2, Number(process.env.CHECK_SECONDS || 10));
const STEP = 0.15;
const ARMS = [
  { id: '1x default', query: '', speed: 1 },
  { id: '1x ?fixedClock=all', query: '&fixedClock=all', speed: 1 },
  { id: '1x ?fixedClock=0', query: '&fixedClock=0', speed: 1 },
  { id: '4x default', query: '', speed: 4 },
  { id: '4x ?fixedClock=0', query: '&fixedClock=0', speed: 4 },
  { id: '4x ?fixedClock=all', query: '&fixedClock=all', speed: 4 },
  { id: '8x default', query: '', speed: 8 },
  { id: '8x ?fixedClock=0', query: '&fixedClock=0', speed: 8 }
];

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHECK_CHROME || undefined,
    args: [
      '--no-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-certificate-errors'
    ]
  });
  const context = await browser.newContext({
    viewport: { width: 640, height: 360 },
    ignoreHTTPSErrors: true
  });
  await context.route('**/*', r =>
    ['media', 'font'].includes(r.request().resourceType()) ? r.abort() : r.continue()
  );
  const results = [];
  try {
    for (const arm of ARMS) {
      const page = await context.newPage();
      const url = URL_ + (URL_.includes('?') ? '&' : '?') + 'seed=' + encodeURIComponent(SEED) + arm.query;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 });
      await page.waitForFunction(() => !!(window.__battle__ && window.BattleCommanderAI), null, {
        timeout: 180000
      });
      await page
        .getByText('Start battle')
        .first()
        .click()
        .catch(() => {});
      const run = await page.evaluate(
        ({ speed, fps, seconds }) => {
          const b = window.__battle__;
          const scene = b.scene;
          const engine = scene.getEngine();
          const C = window.BattleCommanderAI;
          const tick = (C && C.commandTick) || 0.45;
          const scenario = scene.metadata && scene.metadata.battleScenario;
          engine.stopRenderLoop();
          // Fast-forward to movement/contact on the fixed step, without rendering.
          b.paused = false;
          let acc = 0;
          for (let t = 0; t < 40; t += 0.15) {
            b.step(0.15);
            acc += 0.15;
            while (C && acc + 1e-9 >= tick) {
              acc -= tick;
              C.update(b, scenario, tick);
            }
          }
          engine.getDeltaTime = () => 1000 / fps;
          b.timeScale = speed;
          if (b._fixedClock) b._fixedClock.reset();
          const men = [...b._roster.us, ...b._roster.ge].filter(s => !s.dead);
          let prev = men.map(s => [s.root.position.x, s.root.position.z]);
          const changed = men.map(() => 0);
          const maxJump = men.map(() => 0);
          const frames = Math.round(seconds * fps);
          const sim0 = b.time;
          for (let f = 0; f < frames && !b.winner; f++) {
            scene.onBeforeRenderObservable.notifyObservers(scene);
            for (let i = 0; i < men.length; i++) {
              const p = men[i].root.position;
              const d = Math.hypot(p.x - prev[i][0], p.z - prev[i][1]);
              if (d > 1e-9) {
                changed[i]++;
                if (d > maxJump[i]) maxJump[i] = d;
              }
              prev[i] = [p.x, p.z];
            }
          }
          const movers = changed.map((c, i) => i).filter(i => changed[i] >= 5);
          const share = movers.length
            ? movers.reduce((s, i) => s + changed[i] / frames, 0) / movers.length
            : 0;
          const jumps = movers.map(i => maxJump[i]).sort((x, y) => x - y);
          const clock = b._fixedClock;
          return {
            frames,
            simAdvanced: b.time - sim0,
            movers: movers.length,
            motionShare: share,
            medianMaxJumpM: jumps.length ? jumps[jumps.length >> 1] : null,
            fixedSteps: clock ? clock.stats.totalSteps : null,
            fixedClockInstalled: !!b._fixedClockInstalled
          };
        },
        { speed: arm.speed, fps: FPS, seconds: SECONDS }
      );
      results.push({ arm: arm.id, speed: arm.speed, ...run });
      await page.close();
    }
  } finally {
    await browser.close();
  }

  const by = id => results.find(r => r.arm === id);
  const smooth = by('1x default');
  const fixed = by('1x ?fixedClock=all');
  const fail = [];
  if (!smooth.movers) fail.push('no soldier moved; the battle did not advance');
  if (smooth.fixedSteps !== 0 || smooth.fixedClockInstalled)
    fail.push('default 1x unexpectedly installed or advanced the fixed clock');
  if (!(smooth.motionShare > 3 * fixed.motionShare))
    fail.push('default 1x is not clearly smoother than the forced fixed step');
  for (const speed of [1, 4, 8]) {
    const live = by(speed + 'x default');
    const old = by(speed + 'x ?fixedClock=0');
    if (!live.movers) fail.push(speed + 'x: no live movement');
    if (live.fixedSteps !== 0 || live.fixedClockInstalled)
      fail.push(speed + 'x: default live enabled benchmark-only fixed steps');
    if (Math.abs(live.motionShare - old.motionShare) > 0.02)
      fail.push(speed + 'x: default live movement differs from the original observer');
    if (Math.abs(live.simAdvanced - old.simAdvanced) > 0.01)
      fail.push(speed + 'x: default live sim time differs from original observer');
  }
  for (const speed of [1, 4]) {
    const forced = by(speed + 'x ?fixedClock=all');
    if (!forced.fixedClockInstalled || !(forced.fixedSteps > 0))
      fail.push(speed + 'x: explicit benchmark observer did not run fixed steps');
    if (Math.abs(forced.fixedSteps - forced.simAdvanced / STEP) > 1.5)
      fail.push(speed + 'x: fixed step count differs from simulated time');
  }

  console.log(JSON.stringify({ fps: FPS, seconds: SECONDS, results, fail }, null, 2));
  process.exit(fail.length ? 1 : 0);
})().catch(e => {
  console.error('check_realtime_smoothness FAILED', e);
  process.exit(1);
});
