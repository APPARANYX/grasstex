'use strict';
// Single-seed lifecycle/read-only probe. Outcome A/B runs use the standard benchmark.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const head = process.env.AI_SKILLS_SHA;
if (!/^[a-f0-9]{40}$/.test(head || '')) throw new Error('AI_SKILLS_SHA must identify the immutable head');
const output = 'reports/ai-skills-shadow';
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ args: [
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'
  ] });
  try {
    const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    // Private audio is intentionally absent from the public repo; use a valid silent WAV.
    const wav = Buffer.alloc(46);
    wav.write('RIFF'); wav.writeUInt32LE(38, 4); wav.write('WAVEfmt ', 8);
    wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(22050, 24); wav.writeUInt32LE(44100, 28);
    wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(2, 40);
    await page.route(/\/Assets\/audio\/.*\.mp3(?:\?.*)?$/, route =>
      route.fulfill({ status: 200, contentType: 'audio/wav', body: wav }));
    const launcher = 'https://test.ivandpopov.com/grasstex/preview.php?ref=' + head;
    await page.goto(launcher, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForURL(/\/preview\/ref-[a-f0-9]+\/battle_sim\.php/, { timeout: 180000 });
    // The launcher's deployed forwarding list may predate this PR; use the immutable staged page.
    const url = new URL(page.url());
    for (const [name, value] of new URLSearchParams(
      'aiSkills=shadow&seed=ai-skills-v1-602&log=0&strategicInterception=1&frontLines=1&motorTransport=1&truckAccess=1&truckCollision=1&truckVisual=1&aerialRecon=1&interception=1&reinforcements=1&reinforcementSortie=1'
    )) url.searchParams.set(name, value);
    errors.length = 0;
    await page.goto(url.href, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => window.__battle__ && window.BattleAISkills, null, { timeout: 180000 });
    const report = await page.evaluate(expectedHead => {
      const root = window, b = root.__battle__, api = root.BattleAISkills;
      const check = (ok, why) => { if (!ok) throw new Error(why); };
      check(root.BATTLE_REF === expectedHead, 'Preview head mismatch: ' + root.BATTLE_REF);
      check(api.config().mode === 'shadow', 'Shadow flag did not reach runtime');
      const activation = root.BattleStrategicConfig.snapshot(b);
      check(root.__scenario__.map.width === 5000, 'Expected 5km map');
      const observerCount = () => b.scene.onBeforeRenderObservable.observers.length;
      const baselineObservers = observerCount();
      const system = root.BattleModules.getSystem('ai-skills-shadow');
      check(!!system, 'No canonical skill lifecycle');
      const cycles = [];
      for (let cycle = 0; cycle < 3; cycle++) {
        const prior = api.diagnostics(b).generation;
        b.restart({ operator: false });
        check(api.diagnostics(b).generation === prior + 1, 'Generation did not advance once');
        check(api.diagnostics(b).receipts.length === 0, 'Restart leaked decisions');
        check(observerCount() === baselineObservers, 'Restart leaked observers');
        b.paused = false;
        b._trainerStepActive = true;
        try {
          for (let step = 0; step < 60; step++) {
            b.step(0.15);
            if (step % 3 === 2) root.BattleCommanderAI.update(b, root.__scenario__, 0.45);
          }
        } finally { b._trainerStepActive = false; b.paused = true; }
        const diagnostics = api.diagnostics(b);
        check(diagnostics.prepared > 0 && diagnostics.receipts.length > 0, 'Shadow was not scheduled');
        const actor = b._roster.us.find(s => !s.dead);
        const receptionBefore = JSON.stringify(b._commandReception);
        const beliefsBefore = JSON.stringify(actor._beliefs, (key, value) => key === 'unit' ? undefined : value);
        let rngReads = 0;
        const rng = b.random;
        b.random = () => { rngReads++; throw new Error('Observer used battle RNG'); };
        try {
          for (let read = 0; read < 10; read++) {
            const snap = api.snapshot(b, actor);
            check(Object.isFrozen(snap), 'Mutable snapshot');
            api.select(snap, snap, api.config()); api.diagnostics(b);
          }
        } finally { b.random = rng; }
        check(rngReads === 0, 'Observer consumed RNG');
        check(JSON.stringify(b._commandReception) === receptionBefore, 'Read advanced command adoption');
        check(JSON.stringify(actor._beliefs, (key, value) => key === 'unit' ? undefined : value) === beliefsBefore,
          'Read changed belief lifecycle');
        cycles.push({ generation: diagnostics.generation, at: b.time, prepared: diagnostics.prepared,
          receipts: diagnostics.receipts.length, chosen: diagnostics.receipts.filter(r => r.chosen).length });
      }
      api.configure({ mode: 'shadow', observer: false, skills: { 'soldier.observe-threat': { enabled: true } } });
      b.paused = false; b.step(0.15); b.paused = true;
      system.onCommanderTick(b);
      check(api.diagnostics(b).prepared > 0 && api.diagnostics(b).receipts.length === 0, 'Observer-off scheduling');
      api.configure({ mode: 'legacy' });
      system.onCommanderTick(b);
      check(api.diagnostics(b).prepared === 0 && api.diagnostics(b).receipts.length === 0, 'Legacy no-op failed');
      const faults = root.BattleModules.hookFailures();
      check(!Object.keys(faults).some(key => key.startsWith('ai-skills-shadow.')), 'Skill hook fault');
      return { head: expectedHead, runtimeRef: root.BATTLE_REF, seed: 'ai-skills-v1-602',
        activation, step: 0.15, commanderTick: 0.45, baselineObservers, cycles, faults };
    }, head);
    assert.deepEqual(errors, [], 'Uncaught browser errors');
    await page.screenshot({ path: output + '/runtime.png' });
    fs.writeFileSync(output + '/result.json', JSON.stringify({ ...report, url: url.href, errors }, null, 2));
    console.log('PASS immutable-head full-ON 5km shadow, 3 restarts, neutral reads, observer and legacy rollback');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
