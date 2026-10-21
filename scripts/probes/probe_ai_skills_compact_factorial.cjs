'use strict';
/* Bounded Phase C Combat Lab factorial. One Chromium process, one immutable preview
   checkout, fresh URL/page navigation per condition, real 20v20 native squads.
   Every trial uses real LOS, Navigation, movement and AI skill event journal.
   The Combat Lab's 1/4 setting scales BOTH weapon and sight range. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { requestPreview } = require('./preview_request.cjs');
const head = process.env.AI_SKILLS_SHA;
const seed = process.env.AI_COMPACT_SEED || 'phase-c-natural-20261012-0015';
const defender = process.env.AI_COMPACT_DEFENDER || '';
const runSeconds = Number(process.env.AI_COMPACT_SECONDS || 240);
assert.match(head || '', /^[a-f0-9]{40}$/);
assert.ok(['', 'us', 'ge'].includes(defender), 'invalid defender');
assert.ok([120, 240, 600].includes(runSeconds), 'bounded replay duration');
const out = 'reports/ai-skills-compact-factorial/' + seed;
fs.mkdirSync(out, { recursive: true });
const cases = [];
for (const density of [1, 10])
  for (const radius of [6, 20, 50])
    for (const candidates of [16, 32])
      for (const prepBudget of [12, 24])
        cases.push({ density, radius, candidates, prepBudget });
assert.equal(cases.length, 24, 'exact complete factorial');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.AI_SKILLS_CHROMIUM,
    proxy: process.env.AI_SKILLS_PROXY ? { server: process.env.AI_SKILLS_PROXY } : undefined,
    args: [
      '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
      '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'
    ]
  });
  const results = [];
  try {
    const page = await browser.newPage({ ignoreHTTPSErrors: true });
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
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
    const ref = process.env.AI_SKILLS_REF;
    assert.ok(ref, 'immutable preview ref required');
    const launcher = 'https://test.ivandpopov.com/grasstex/preview.php?ref=' + encodeURIComponent(ref);
    const response = await requestPreview(page.context(), launcher);
    assert.equal(response.status(), 302, 'immutable checkout must redirect');
    const immutable = new URL(response.headers().location, launcher);
    assert.ok(immutable.pathname.includes('ref-' + head.slice(0, 12)), 'unexpected preview SHA');

    for (let i = 0; i < cases.length; i++) {
      const cfg = cases[i], url = new URL(immutable.href);
      const params = new URLSearchParams({
        combatLab: '1', aiSkills: 'squad', labPreset: 'A', labRange: '0.25',
        labMove: 'autonomous', labInterior: '1', log: '0', seed,
        localPlan: '1', localResources: '1', localAmbush: '1', localManeuver: '1',
        coveredBounds: '1', fireCoverCycle: '1', squadReturnFire: '1',
        labCover: String(cfg.density), labPostRange: String(cfg.radius),
        labCandidates: String(cfg.candidates), labPrepBudget: String(cfg.prepBudget)
      });
      if (defender) params.set('defender', defender);
      for (const [key, value] of params) url.searchParams.set(key, value);
      const start = Date.now();
      // Single warm browser/context and checkout. Each setting gets a FULL PAGE
      // reload so the original source module factories and world RNG reseed cleanly.
      await page.goto(url.href, { waitUntil: 'load', timeout: 180000 });
      await page.waitForFunction(
        () => !!(window.__battle__ && window.BattleAISkills &&
          window.BattleAISquadAdapter && window.PhaseCCombatLab),
        null, { timeout: 180000 }
      );
      const result = await page.evaluate(async ({ expected, expectedSeed, expectedDefender, cfg, seconds }) => {
        const R = window, b = R.__battle__, api = R.BattleAISkills,
          scenario = b.scene.metadata.battleScenario, lab = R.PhaseCCombatLab;
        const check = (v, why) => { if (!v) throw Error(why); };
        check(R.BATTLE_PREVIEW && R.BATTLE_PREVIEW.sha === expected, 'not immutable checkout');
        check(R.PHASE_C_COMBAT_LAB && R.BattleSim.FIELD_W === 280 &&
          R.BattleSim.FIELD_D === 240, 'not compact 280x240 combat lab');
        check(scenario.seed === expectedSeed && scenario.map.width === 280 &&
          scenario.map.depth === 240, 'scenario geometry or seed changed');
        check(b._roster.us.length === 20 && b._roster.ge.length === 20,
          'UNBALANCED ACTUAL ROSTERS');
        check(b.factions.us.squads.length === 2 && b.factions.ge.squads.length === 2,
          'expected two full squads each');
        check(lab.preset === 'A' && lab.rangeScale === 0.25,
          'quarter weapon/sight control or normal combat disabled');
        check(api.config().mode === 'pilot' && api.config().pilot.squad === '*',
          'real squad pilot not active');
        check(R.BattleSquadStability.tacticalPostures.on &&
          R.BattleSquadStability.tacticalPostures.maneuverOn &&
          R.BattleSquadStability.tacticalPostures.tuning.preparationBudget === cfg.prepBudget,
          'native posture authority or prep budget missing');
        const q = new URLSearchParams(R.location.search);
        check(+q.get('labCover') === cfg.density && +q.get('labPostRange') === cfg.radius &&
          +q.get('labCandidates') === cfg.candidates &&
          +q.get('labPrepBudget') === cfg.prepBudget, 'URL settings lost at reload');
        const soldier = b._roster.us[0], victim = b._roster.ge[0],
          profile = R.BattleWeapons.profileStats(soldier.weapon.kind, soldier.faction),
          visual = R.SquadAI.detectionRange(R.SquadAI.ROLES[soldier.role], victim);
        check(Math.abs(soldier.weapon.stats.range - profile.range * 0.25) < 1e-6,
          'real weapon range was not quartered');
        check(visual > 0 && visual <= R.SquadAI.ROLES[soldier.role].visionRange * 0.3125,
          'real perception range not quartered');
        await R.BattleSoldierModel.preload(b.scene);
        await b.scene.whenReadyAsync();
        b.scene.getEngine().stopRenderLoop(R.__battleRenderLoop__);
        const obs = b.obstacles || [], geometry = { tactical: obs.length,
          physical: (obs.__physicalFootprints || []).length,
          rock: obs.filter(o => o.type === 'rock').length,
          log: obs.filter(o => o.type === 'log').length,
          wall: obs.filter(o => o.type === 'wall').length };
        // No state writes except the same clock/Commander drive used by the
        // existing immutable natural replay. No force contact, spawn or posture.
        b.paused = false;
        b.timeScale = 1;
        b.timeLimit = seconds;
        let serial = 0, acc = 0;
        const events = [];
        const start = performance.now();
        for (let step = 0; step < Math.ceil(seconds / 0.15) && !b.winner; step++) {
          b._trainerStepActive = true;
          try { b.step(0.15); }
          finally { b._trainerStepActive = false; }
          acc += 0.15;
          while (acc >= 0.45 - 1e-9 && !b.winner) {
            acc -= 0.45;
            R.BattleCommanderAI.update(b, scenario, 0.45);
          }
          for (const e of R.BattleAISquadAdapter.eventsSince(b, serial)) {
            check(e.serial === serial + 1, 'lost squad source event');
            serial = e.serial;
            events.push(e);
          }
          if (step % 100 === 0) await new Promise(resolve => setTimeout(resolve, 0));
        }
        b.paused = true;
        const attempts = events.filter(e => e.kind === 'prepare').map(first => {
          const trace = events.filter(e =>
            e.generation === first.generation &&
            e.faction === first.faction &&
            e.squad === first.squad &&
            e.planSerial === first.planSerial &&
            e.missionVersion === first.missionVersion &&
            e.at >= first.at
          );
          const seen = kind => trace.some(e => e.kind === kind);
          return {
            side: first.faction, squad: first.squad, started: +first.at.toFixed(2),
            line: trace.some(e => e.postureSerial != null), ready: seen('prepared'),
            support: seen('supported'), arrival: seen('arrived'),
            nativeReasons: [...new Set(trace.map(e => e.nativePreparation?.reason).filter(Boolean))],
            nativeMaskedPostMax: Math.max(0, ...trace.map(e => e.nativePreparation?.maskedPosts || 0)),
            terminal: trace[trace.length - 1]?.reason || null
          };
        });
        const counts = {
          attempts: attempts.length, lines: attempts.filter(a => a.line).length,
          prepared: attempts.filter(a => a.ready).length,
          supported: attempts.filter(a => a.support).length,
          arrivals: attempts.filter(a => a.arrival).length,
          failures: events.filter(e => e.kind === 'failed').length,
          maxPartialPosts: Math.max(0, ...attempts.map(a => a.nativeMaskedPostMax))
        };
        for (const a of attempts)
          if (a.arrival) check(a.ready && a.support, 'arrival without authorized causal chain');
        const labResults = lab.snapshot();
        return { sha: expected, seed: expectedSeed, defender: expectedDefender,
          cfg, seconds: +b.time.toFixed(2), durationMs: Math.round(performance.now() - start),
          winner: b.winner, usStart: 20, geStart: 20, usAlive: b.factions.us.alive,
          geAlive: b.factions.ge.alive, usSquads: b.factions.us.squads.length,
          geSquads: b.factions.ge.squads.length, geometry, counts, attempts,
          shots: labResults.counts?.shots || null,
          scale: lab.rangeScale, preset: lab.preset
        };
      }, { expected: head, expectedSeed: seed, expectedDefender: defender, cfg, seconds: runSeconds });
      result.wallMs = Date.now() - start;
      result.errors = pageErrors.splice(0);
      assert.deepEqual(result.errors, [], 'browser runtime errors on ' + JSON.stringify(cfg));
      results.push(result);
      fs.appendFileSync(out + '/runs.jsonl', JSON.stringify(result) + '\n');
      console.log('COMPACT_FACTORIAL ' + JSON.stringify({
        seed, index: i + 1, total: cases.length, cfg, time: result.seconds,
        counts: result.counts, geometry: result.geometry, deaths: {
          us: 20 - result.usAlive, ge: 20 - result.geAlive
        }, wallMs: result.wallMs
      }));
    }
    assert.equal(results.length, cases.length, 'incomplete factorial');
    // Deterministic individual results stay in runs.jsonl for direct ranking or reruns.
    const ranking = results.map(r => ({
      cfg: r.cfg, attempts: r.counts.attempts, lines: r.counts.lines,
      prepared: r.counts.prepared, supported: r.counts.supported,
      arrivals: r.counts.arrivals, maxPosts: r.counts.maxPartialPosts,
      deathsUS: 20 - r.usAlive, deathsGE: 20 - r.geAlive,
      simulated: r.seconds, wallMs: r.wallMs
    })).sort((a, b) =>
      b.arrivals - a.arrivals || b.supported - a.supported ||
      b.prepared - a.prepared || b.lines - a.lines ||
      b.maxPosts - a.maxPosts || b.attempts - a.attempts
    );
    const report = { head, seed, defender, map: '280x240m',
      preset: 'A', scale: 0.25, teams: { us: 20, ge: 20 },
      cases: results.length, factorial: { density: [1, 10], radius: [6, 20, 50],
        candidates: [16, 32], prepBudget: [12, 24] }, ranking };
    fs.writeFileSync(out + '/summary.json', JSON.stringify(report, null, 2));
    console.log('PASS_COMPACT_FACTORIAL ' + JSON.stringify(report));
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
