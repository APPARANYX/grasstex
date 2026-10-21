'use strict';
// One immutable hosted natural battle plus lifecycle QA. Paired/multi-seed
// outcome comparisons belong exclusively to the GitHub standard benchmark.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { requestPreview } = require('./preview_request.cjs');
const head = process.env.AI_SKILLS_SHA;
assert.match(head || '', /^[a-f0-9]{40}$/);
(async () => {
  const out = 'reports/ai-skills-squad';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.AI_SKILLS_CHROMIUM,
    proxy: process.env.AI_SKILLS_PROXY ? { server: process.env.AI_SKILLS_PROXY } : undefined,
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox'
    ]
  });
  try {
    const page = await browser.newPage({ ignoreHTTPSErrors: true });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    const wav = Buffer.alloc(46);
    wav.write('RIFF');
    wav.writeUInt32LE(38, 4);
    wav.write('WAVEfmt ', 8);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(22050, 24);
    wav.writeUInt32LE(44100, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write('data', 36);
    wav.writeUInt32LE(2, 40);
    await page.route(/\/Assets\/audio\/.*\.mp3(?:\?.*)?$/, r =>
      r.fulfill({ status: 200, contentType: 'audio/wav', body: wav })
    );
    const launcher =
      'https://test.ivandpopov.com/grasstex/preview.php?ref=' + encodeURIComponent(process.env.AI_SKILLS_REF);
    const response = await requestPreview(page.context(), launcher);
    assert.equal(response.status(), 302);
    const url = new URL(response.headers().location, launcher);
    assert.ok(url.pathname.includes('ref-' + head.slice(0, 12)));
    for (const [k, v] of new URLSearchParams(
      'aiSkills=squad&seed=phase-c-natural-20261012-0002&log=0&localPlan=1&localResources=1&localAmbush=1&localManeuver=1&coveredBounds=1&strategicInterception=1&frontLines=1&motorTransport=1&truckAccess=1&truckCollision=1&truckVisual=1&aerialRecon=1&interception=1&reinforcements=1&reinforcementSortie=1'
    ))
      url.searchParams.set(k, v);
    await page.goto(url.href, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => window.__battle__ && window.BattleAISquadAdapter, null, {
      timeout: 180000
    });
    const report = await page.evaluate(async expected => {
      const R = window,
        b = R.__battle__,
        api = R.BattleAISkills,
        check = (x, m) => {
          if (!x) throw Error(m);
        };
      check(R.BATTLE_PREVIEW.sha === expected, 'immutable preview SHA');
      check(api.config().mode === 'pilot' && api.config().pilot.squad === '*', 'explicit squad profile');
      const activation = R.BattleStrategicConfig.snapshot(b);
      check(
        Object.values(activation.flags).every(Boolean) && Object.values(activation.features).every(Boolean),
        'full ON strategic features'
      );
      check(R.__scenario__.map.width === 5000, '5km map');
      check(
        R.BattleSquadStability.localPlan.on &&
          R.BattleSquadStability.localPlan.resourcesOn &&
          R.BattleSquadStability.tacticalPostures.on &&
          R.BattleSquadStability.tacticalPostures.maneuverOn &&
          R.BattleCoverPositions.coveredBoundsOn(),
        'native owner dependencies'
      );
      b.paused = true;
      const settle = async () => {
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        await new Promise(r => setTimeout(r, 0));
      };
      await settle();
      const observers = () =>
        b.scene.onBeforeRenderObservable.observers.filter(o => !o._willBeUnregistered).length;
      // A cold FBX library installs the existing LOD render observer only
      // when its first imported body is created. Complete that normal
      // initialization before comparing restart retention.
      await R.BattleSoldierModel.preload(b.scene);
      await b.scene.whenReadyAsync();
      // The first full restart can retire one existing transient FBX/LOD observer
      // after deferred Babylon disposal. Verify that the steady-state observer
      // baseline is reached after two complete restarts, not during first boot.
      const warmupObservers = [];
      for (let i = 0; i < 3; i++) {
        b.restart({ operator: false });
        b.paused = true;
        await settle();
        warmupObservers.push(observers());
      }
      check(
        warmupObservers[2] === warmupObservers[1] &&
          warmupObservers.every(n => n <= warmupObservers[0]),
        'restart observer warmup failed to settle: ' + JSON.stringify(warmupObservers)
      );
      const baseline = observers(),
        cycles = [];
      for (let i = 0; i < 3; i++) {
        const gen = api.diagnostics(b).generation,
          old = b.factions.us.squads[0];
        b.restart({ operator: false });
        b.paused = true;
        await settle();
        check(api.diagnostics(b).generation === gen + 1, 'one generation per restart');
        check(api.diagnostics(b).squad === null, 'no retained squad episodes');
        check(api.snapshot(b, old) === null, 'old squad reference rejected');
        check(
          observers() === baseline,
          'persistent observer count: baseline=' + baseline + ', current=' + observers() + ', cycle=' + i
        );
        cycles.push({ generation: gen + 1, observers: observers() });
      }
      b.scene.getEngine().stopRenderLoop(R.__battleRenderLoop__);
      const scenario = R.__scenario__,
        events = [];
      let serial = 0,
        acc = 0;
      b.paused = false;
      b.timeScale = 1;
      b.timeLimit = 600;
      const started = performance.now();
      for (let step = 0; step < 4000 && !b.winner; step++) {
        b._trainerStepActive = true;
        try {
          b.step(0.15);
        } finally {
          b._trainerStepActive = false;
        }
        acc += 0.15;
        while (acc >= 0.45 - 1e-9 && !b.winner) {
          acc -= 0.45;
          R.BattleCommanderAI.update(b, scenario, 0.45);
        }
        for (const event of R.BattleAISquadAdapter.eventsSince(b, serial)) {
          check(event.serial === serial + 1, 'source journal contiguous');
          serial = event.serial;
          events.push(event);
        }
        if (step % 200 === 0) await new Promise(r => setTimeout(r, 0));
      }
      b.paused = true;
      const diagnostics = api.diagnostics(b),
        complete = events.filter(e => e.kind === 'arrived');
      for (const e of complete) {
        const prior = events.filter(
          p =>
            p.generation === e.generation &&
            p.faction === e.faction &&
            p.squad === e.squad &&
            p.planSerial === e.planSerial &&
            p.missionVersion === e.missionVersion &&
            p.postureSerial === e.postureSerial &&
            p.at <= e.at
        );
        check(
          prior.some(p => p.kind === 'prepared') && prior.some(p => p.kind === 'supported'),
          'same identity full causal chain'
        );
      }
      const result = {
        head: expected,
        seed: scenario.seed,
        seconds: b.time,
        fixedDt: 0.15,
        commanderDt: 0.45,
        wallSeconds: (performance.now() - started) / 1000,
        cycles,
        warmupObservers,
        activation,
        diagnostics,
        events,
        naturalAccepted: complete.length > 0
      };
      api.configure({ mode: 'legacy' });
      b._trainerStepActive = true;
      try {
        b.step(0.15);
      } finally {
        b._trainerStepActive = false;
      }
      check(api.config().mode === 'legacy', 'rollback');
      return result;
    }, head);
    fs.writeFileSync(out + '/result.json', JSON.stringify({ ...report, errors }, null, 2));
    assert.deepEqual(errors, [], 'browser runtime errors');
    // Acceptance is reported, never manufactured or confused with a QA pass.
    console.log(
      JSON.stringify({
        head,
        seconds: report.seconds,
        counts: report.diagnostics.squad?.counts,
        naturalAccepted: report.naturalAccepted,
        errors
      })
    );
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
