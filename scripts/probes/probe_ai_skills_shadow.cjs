'use strict';
// Single-seed lifecycle/read-only probe. Outcome A/B runs use the standard benchmark.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { requestPreview } = require('./preview_request.cjs');
const head = process.env.AI_SKILLS_SHA;
if (!/^[a-f0-9]{40}$/.test(head || '')) throw new Error('AI_SKILLS_SHA must identify the immutable head');
const pilotRequested = process.env.AI_SKILLS_PILOT === '1';
const output = pilotRequested ? 'reports/ai-skills-pilot' : 'reports/ai-skills-shadow';
(async () => {
  fs.mkdirSync(output, { recursive: true });
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
    const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    // Private audio is intentionally absent from the public repo; use a valid silent WAV.
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
    await page.route(/\/Assets\/audio\/.*\.mp3(?:\?.*)?$/, route =>
      route.fulfill({ status: 200, contentType: 'audio/wav', body: wav })
    );
    const launcher =
      'https://test.ivandpopov.com/grasstex/preview.php?ref=' +
      encodeURIComponent(process.env.AI_SKILLS_REF || 'work/issue-602-ai-skills-shadow');
    const response = await requestPreview(page.context(), launcher);
    assert.equal(response.status(), 302, 'Launcher must resolve a staged preview');
    const url = new URL(response.headers().location, launcher);
    assert.ok(url.pathname.includes('ref-' + head.slice(0, 12)), 'Staged URL must match immutable head');
    // Use the staged page directly; the deployed launcher may predate this PR's forwarding list.
    for (const [name, value] of new URLSearchParams(
      'aiSkills=shadow&seed=ai-skills-v1-602&log=0&strategicInterception=1&frontLines=1&motorTransport=1&truckAccess=1&truckCollision=1&truckVisual=1&aerialRecon=1&interception=1&reinforcements=1&reinforcementSortie=1'
    ))
      url.searchParams.set(name, value);
    errors.length = 0;
    await page.goto(url.href, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => window.__battle__ && window.BattleAISkills, null, { timeout: 180000 });
    const report = await page.evaluate(
      async ({ expectedHead, pilotRequested }) => {
        const root = window,
          b = root.__battle__,
          api = root.BattleAISkills;
        const check = (ok, why) => {
          if (!ok) throw new Error(why);
        };
        check(
          root.BATTLE_PREVIEW && root.BATTLE_PREVIEW.sha === expectedHead,
          'Preview metadata head mismatch: ' + JSON.stringify(root.BATTLE_PREVIEW)
        );
        check(api.config().mode === 'shadow', 'Shadow flag did not reach runtime');
        const activation = root.BattleStrategicConfig.snapshot(b);
        check(
          Object.values(activation.flags).every(Boolean) && Object.values(activation.features).every(Boolean),
          'Full-ON strategic configuration did not reach the owners'
        );
        check(root.__scenario__.map.width === 5000, 'Expected 5km map');
        // Babylon defers removing disposed-mesh observers until render/timer cleanup.
        // Pause simulation and flush that queue before comparing persistent observer counts.
        const settleObservers = async () => {
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          await new Promise(resolve => setTimeout(resolve, 0));
        };
        b.paused = true;
        await settleObservers();
        const observerCount = () =>
          b.scene.onBeforeRenderObservable.observers.filter(o => !o._willBeUnregistered).length;
        // Scene bootstrap may own one transient FBX/LOD observer that is
        // disposed only on the first complete battle restart.
        const bootObservers = observerCount();
        let baselineObservers = bootObservers;
        const system = root.BattleModules.getSystem('ai-skills-shadow');
        check(!!system, 'No canonical skill lifecycle');
        const cycles = [];
        for (let cycle = 0; cycle < 3; cycle++) {
          const prior = api.diagnostics(b).generation;
          const retainedActor = b._roster.us[0],
            retainedSnapshot = api.snapshot(b, retainedActor);
          b.restart({ operator: false });
          check(api.diagnostics(b).generation === prior + 1, 'Generation did not advance once');
          check(api.diagnostics(b).receipts.length === 0, 'Restart leaked decisions');
          check(api.snapshot(b, retainedActor) === null, 'Old roster actor received fresh facts');
          const replacementSnapshot = api.snapshot(b, b._roster.us[0]);
          check(
            api.select(retainedSnapshot, replacementSnapshot, api.config()).chosen === null,
            'Old-generation facts survived roster replacement'
          );
          b.paused = true;
          await settleObservers();
          if (cycle === 0) {
            check(
              observerCount() <= bootObservers,
              'First restart unexpectedly added a persistent observer'
            );
            baselineObservers = observerCount();
          }
          check(
            observerCount() === baselineObservers,
            'Persistent observer count changed: baseline=' +
              baselineObservers +
              ', current=' +
              observerCount() +
              ', cycle=' +
              cycle
          );
          b.paused = false;
          b._trainerStepActive = true;
          try {
            for (let step = 0; step < 60; step++) {
              b.step(0.15);
              if (step % 3 === 2) root.BattleCommanderAI.update(b, root.__scenario__, 0.45);
            }
          } finally {
            b._trainerStepActive = false;
            b.paused = true;
          }
          const diagnostics = api.diagnostics(b);
          check(diagnostics.prepared > 0 && diagnostics.receipts.length > 0, 'Shadow was not scheduled');
          const actor = b._roster.us.find(s => !s.dead);
          const receptionBefore = JSON.stringify(b._commandReception);
          const beliefsBefore = JSON.stringify(actor._beliefs, (key, value) =>
            key === 'unit' ? undefined : value
          );
          let rngReads = 0;
          const rng = b.random;
          b.random = () => {
            rngReads++;
            throw new Error('Observer used battle RNG');
          };
          try {
            for (let read = 0; read < 10; read++) {
              const snap = api.snapshot(b, actor);
              check(Object.isFrozen(snap), 'Mutable snapshot');
              api.select(snap, snap, api.config());
              api.diagnostics(b);
            }
          } finally {
            b.random = rng;
          }
          check(rngReads === 0, 'Observer consumed RNG');
          check(JSON.stringify(b._commandReception) === receptionBefore, 'Read advanced command adoption');
          check(
            JSON.stringify(actor._beliefs, (key, value) => (key === 'unit' ? undefined : value)) ===
              beliefsBefore,
            'Read changed belief lifecycle'
          );
          cycles.push({
            generation: diagnostics.generation,
            at: b.time,
            prepared: diagnostics.prepared,
            retainedActorDenied: true,
            observers: observerCount(),
            receipts: diagnostics.receipts.length,
            chosen: diagnostics.receipts.filter(r => r.chosen).length
          });
        }
        // Prove the selector evaluates legitimate natural contact, not only pre-contact guard denials.
        let naturalSelection = null;
        b.paused = false;
        b._trainerStepActive = true;
        try {
          for (let step = 0; step < 4000 && !b.winner && !naturalSelection; step++) {
            b.step(0.15);
            if (step % 3 === 2) {
              root.BattleCommanderAI.update(b, root.__scenario__, 0.45);
              const d = api.diagnostics(b),
                selected = d.receipts.find(r => r.chosen);
              if (selected) naturalSelection = { at: b.time, evaluated: d.evaluated, receipt: selected };
            }
          }
        } finally {
          b._trainerStepActive = false;
          b.paused = true;
        }
        check(
          naturalSelection && naturalSelection.evaluated > 0,
          'No natural threat selection within 600 simulated seconds'
        );
        api.configure({
          mode: 'shadow',
          observer: false,
          skills: { 'soldier.observe-threat': { enabled: true } }
        });
        b.paused = false;
        b.step(0.15);
        b.paused = true;
        system.onCommanderTick(b);
        check(
          api.diagnostics(b).prepared > 0 && api.diagnostics(b).receipts.length === 0,
          'Observer-off scheduling'
        );
        api.configure({ mode: 'legacy' });
        system.onCommanderTick(b);
        check(
          api.diagnostics(b).prepared === 0 && api.diagnostics(b).receipts.length === 0,
          'Legacy no-op failed'
        );
        let pilot = null;
        if (pilotRequested) {
          const candidates = new Set(),
            attempts = [],
            blockers = {},
            eligibleFacts = [];
          let target = null,
            completed = null;
          b.restart({ operator: false });
          b.paused = false;
          b._trainerStepActive = true;
          try {
            for (let step = 0; step < 4000 && !b.winner && !completed; step++) {
              b.step(0.15);
              if (step % 3 !== 2) continue;
              root.BattleCommanderAI.update(b, root.__scenario__, 0.45);
              if (target) {
                const d = api.diagnostics(b).execution;
                const terminal =
                  d &&
                  d.receipts
                    .filter(
                      r => r.action === 'plan' && ['succeeded', 'failed', 'cancelled'].includes(r.lifecycle)
                    )
                    .pop();
                if (terminal) {
                  attempts.push({ ...terminal, receipts: d.receipts });
                  if (terminal.lifecycle === 'succeeded') completed = attempts[attempts.length - 1];
                  target = null;
                }
              }
              if (!target && !completed) {
                const actor = b._roster.us.find(a => {
                  const key =
                    a.id + ':' + (a.squad && a.squad._macroMission && a.squad._macroMission.version);
                  const snap = api.snapshot(b, a);
                  if (
                    snap &&
                    snap.facts.some(f => f.confidence >= 0.25) &&
                    Object.values(snap.guards).every(Boolean)
                  ) {
                    const e = a.eng || {},
                      q = a.squad || {},
                      L = root.BattleLeases;
                    const why =
                      [
                        a.dead && 'dead',
                        a.reloading && 'reload',
                        q.inContact && 'contact',
                        q.clearContact && 'clear-contact',
                        q.state !== 'advance' && 'squad-' + q.state,
                        e.state !== 'advance' && 'eng-' + e.state,
                        e.stance !== 'stand' && 'stance-' + e.stance,
                        b.time < e.stanceUntil && 'stance-hold',
                        e.boundOrder && 'bound-order',
                        e.suppressOrder && 'suppress-order',
                        root.BattleEngagement.underFireNow(a, b) && 'incoming',
                        root.BattleSquadTransport.isPassenger(a) && 'passenger',
                        ...Object.keys(L.kinds())
                          .filter(k => !L.kinds()[k].diagnostic && L.holds(q, k, b.time))
                          .map(k => 'lease-' + k)
                      ]
                        .filter(Boolean)
                        .join(',') || 'available';
                    blockers[why] = (blockers[why] || 0) + 1;
                    if (eligibleFacts.length < 10) eligibleFacts.push({ at: b.time, entity: a.id, why });
                  }
                  if (candidates.has(key) || root.BattleAISkillRuntime.blocker(b, a)) return false;
                  return (
                    snap &&
                    Object.values(snap.guards).every(Boolean) &&
                    snap.facts.some(f => f.confidence >= 0.25)
                  );
                });
                if (actor) {
                  target = { entity: String(actor.id), faction: actor.faction };
                  candidates.add(actor.id + ':' + actor.squad._macroMission.version);
                  api.configure({
                    mode: 'pilot',
                    pilot: target,
                    skills: { 'soldier.crouch-on-warning': { enabled: true } }
                  });
                  system.onCommanderTick(b);
                }
              }
            }
          } finally {
            b._trainerStepActive = false;
            b.paused = true;
          }
          check(
            completed,
            'No naturally eligible scoped pilot completed in 600s: ' +
              JSON.stringify({ attempts, blockers, eligibleFacts })
          );
          check(
            completed.receipts.filter(r => r.action === 'crouch' && r.lifecycle === 'succeeded').length === 1,
            'Pilot did not issue exactly one accepted Engagement request'
          );
          api.configure({ mode: 'legacy' });
          system.onCommanderTick(b);
          check(
            !api.diagnostics(b).execution || api.diagnostics(b).execution.active === 0,
            'Pilot rollback retained actions'
          );
          const restartGenerations = [];
          for (let i = 0; i < 3; i++) {
            const actor = b._roster.us[0],
              before = api.diagnostics(b).generation;
            b.restart({ operator: false });
            b.paused = true;
            await settleObservers();
            check(api.diagnostics(b).generation === before + 1, 'Pilot restart generation');
            check(api.snapshot(b, actor) === null, 'Pilot retained stale actor');
            check(observerCount() === baselineObservers, 'Pilot restart observer leak');
            check(!api.diagnostics(b).execution, 'Pilot restart retained a scheduler');
            restartGenerations.push(api.diagnostics(b).generation);
          }
          pilot = { completed, attempts, restartGenerations, rollback: true };
        }
        const faults = root.BattleModules.hookFailures();
        check(!Object.keys(faults).some(key => key.startsWith('ai-skills-shadow.')), 'Skill hook fault');
        return {
          head: expectedHead,
          runtimeRef: root.BATTLE_REF,
          seed: 'ai-skills-v1-602',
          preview: root.BATTLE_PREVIEW,
          activation,
          step: 0.15,
          commanderTick: 0.45,
          bootObservers,
          baselineObservers,
          cycles,
          naturalSelection,
          pilot,
          faults
        };
      },
      { expectedHead: head, pilotRequested }
    );
    assert.deepEqual(errors, [], 'Uncaught browser errors');
    await page.screenshot({ path: output + '/runtime.png' });
    fs.writeFileSync(output + '/result.json', JSON.stringify({ ...report, url: url.href, errors }, null, 2));
    console.log(
      'PASS immutable-head full-ON 5km shadow, restarts, neutral reads, observer and legacy rollback' +
        (pilotRequested ? ', natural scoped pilot and three further restarts' : '')
    );
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
