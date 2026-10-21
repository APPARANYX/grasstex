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
  const out = 'reports/contact-cover-first';
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
      'seed=phase-c-natural-20261012-0002&log=0&localPlan=1&localResources=1&localAmbush=1&localManeuver=1&coveredBounds=1&reactiveFireManeuver=1'
    ))
      url.searchParams.set(k, v);
    if (process.env.CONTACT_COVER_SEED) url.searchParams.set('seed', process.env.CONTACT_COVER_SEED);
    await page.goto(url.href, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => window.__battle__ && window.BattleAISquadAdapter, null, {
      timeout: 180000
    });
    await page.addScriptTag({
      path: require('node:path').resolve('scripts/lib/benchmark-contact-cover.cjs')
    });
    const report = await page.evaluate(
      async ({ expected, stopOnProof }) => {
        const b = __battle__;
        if (BATTLE_PREVIEW.sha !== expected || !BattleReactiveFireManeuver.on)
          throw Error('SHA/flag mismatch');
        b.scene.getEngine().stopRenderLoop(window.__battleRenderLoop__);
        const observer = BattleBenchmarkContactCover.create(window, b),
          fire = b.onFire;
        b.onFire = function (s) {
          observer.shot(s);
          return fire.apply(this, arguments);
        };
        b.paused = false;
        b.timeScale = 1;
        b.timeLimit = 600;
        let acc = 0;
        try {
          for (let i = 0; i < 4000 && !b.winner; i++) {
            b._trainerStepActive = true;
            try {
              b.step(0.15);
            } finally {
              b._trainerStepActive = false;
            }
            acc += 0.15;
            while (acc >= 0.45 - 1e-9 && !b.winner) {
              acc -= 0.45;
              BattleCommanderAI.update(b, window.__scenario__, 0.45);
            }
            observer.sample();
            if (
              stopOnProof &&
              observer.snapshot().rows.some(row => row.orientedAt != null && row.firstShotAt != null)
            )
              break;
            if (i % 100 === 0) await new Promise(r => setTimeout(r, 0));
          }
        } finally {
          b.paused = true;
          b.onFire = fire;
        }
        return { sha: expected, url: location.href, time: b.time, winner: b.winner, ...observer.snapshot() };
      },
      { expected: head, stopOnProof: process.env.CONTACT_COVER_STOP_ON_PROOF === '1' }
    );
    const proof = report.rows.find(row => row.orientedAt != null && row.firstShotAt != null);
    if (proof) {
      await page.evaluate(row => {
        const b = __battle__,
          s = b._roster[row.faction].find(man => man.id === row.id),
          cam = b.scene.activeCamera;
        if (!s || !cam) return;
        if (window.BattleTacticalMap) BattleTacticalMap.setOpen(false);
        const p = s.root.position,
          c = new BABYLON.Vector3(p.x, p.y + 1, p.z),
          eye = new BABYLON.Vector3(p.x + 9, p.y + 7, p.z + 9);
        cam.setTarget(c);
        if (cam.setPosition) cam.setPosition(eye);
        else cam.position.copyFrom(eye);
        b.scene.render();
      }, proof);
    }
    assert.ok(report.time > 0, 'simulation clock advanced');
    report.errors = errors;
    fs.writeFileSync(`${out}/natural.json`, JSON.stringify(report, null, 2));
    await page.screenshot({ path: `${out}/natural.png` });
    console.log('CONTACT_COVER_RESULT', JSON.stringify(report));
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
