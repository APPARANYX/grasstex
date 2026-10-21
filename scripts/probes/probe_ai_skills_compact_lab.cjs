'use strict';
/* Immutable-preview Phase C Compact Combat Lab: real AI Skills squad pilot,
   unmodified native engagement/cover/Navigation, and physical event provenance.
   The lab's range control scales BOTH weapon and visual spotting range.
   Preset A: normal lethal contact. Preset F: stationary/silent/invulnerable GE
   to isolate US line formation, never to claim ordinary battle acceptance. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { requestPreview } = require('./preview_request.cjs');

const sha = process.env.AI_SKILLS_SHA;
assert.match(sha || '', /^[a-f0-9]{40}$/);
const outDir = 'reports/ai-skills-compact-lab';
fs.mkdirSync(outDir, { recursive: true });
const runs = [
  { preset: 'A', range: 0.25 },
  { preset: 'A', range: 1 },
  { preset: 'F', range: 0.25 }
];

(async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.AI_SKILLS_CHROMIUM,
    proxy: process.env.AI_SKILLS_PROXY ? { server: process.env.AI_SKILLS_PROXY } : undefined,
    args: [
      '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
      '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'
    ]
  });
  const reports = [];
  try {
    const page = await browser.newPage({ ignoreHTTPSErrors: true });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
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
    assert.equal(response.status(), 302, 'preview must redirect to immutable checkout');
    const url = new URL(response.headers().location, launcher);
    assert.ok(url.pathname.includes('ref-' + sha.slice(0, 12)), 'preview SHA path');
    const base = new URL(url.href);
    for (const config of runs) {
      const params = new URLSearchParams(
        'combatLab=1&aiSkills=squad&seed=phase-c-natural-20261012-0015&defender=ge' +
        '&localPlan=1&localResources=1&localAmbush=1&localManeuver=1' +
        '&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1' +
        '&labMove=autonomous&labInterior=1&log=0'
      );
      params.set('labPreset', config.preset);
      params.set('labRange', String(config.range));
      const target = new URL(base.href);
      for (const [key, value] of params) target.searchParams.set(key, value);
      // Preview host intermittently refuses TCP between consecutive reloads.
      // Retry transport only; never forgive semantic assertions or tactical failure.
      for (let retry = 0; retry < 5; retry++) {
        try {
          await page.goto(target.href, { waitUntil: 'load', timeout: 180000 });
          break;
        } catch (error) {
          if (retry === 4 || !/ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET|ERR_EMPTY_RESPONSE|ERR_TIMED_OUT|ECONNRESET|ETIMEDOUT/.test(String(error)))
            throw error;
          console.warn('COMPACT_LAB_NAV_RETRY ' + (retry + 1) + ' ' + String(error).slice(0, 150));
          await new Promise(resolve => setTimeout(resolve, (retry + 1) * 1200));
        }
      }
      await page.waitForFunction(
        () => !!(window.__battle__ && window.BattleAISkills &&
          window.BattleAISquadAdapter && window.PhaseCCombatLab),
        null, { timeout: 180000 }
      );
      const result = await page.evaluate(async ({ expectedSha, preset, scale }) => {
        const R = window, b = R.__battle__, api = R.BattleAISkills,
          scenario = b.scene.metadata.battleScenario, lab = R.PhaseCCombatLab;
        function check(ok, label) { if (!ok) throw Error(label); }
        check(R.BATTLE_PREVIEW?.sha === expectedSha, 'immutable preview mismatch');
        check(R.PHASE_C_COMBAT_LAB === true, 'compact lab not enabled');
        check(R.BattleSim.FIELD_W === 280 && R.BattleSim.FIELD_D === 240, 'not compact 280x240 map');
        check(scenario.map.width === 280 && scenario.map.depth === 240, 'scenario map mismatch');
        check(b._roster.us.length === 20 && b._roster.ge.length === 20, 'lab roster mismatch');
        check(lab.preset === preset && lab.rangeScale === scale, 'lab preset/range mismatch');
        check(api.config().mode === 'pilot' && api.config().pilot.squad === '*',
          'squad pilot not activated');
        check(R.BattleSquadStability.tacticalPostures.on, 'native tactical posture owner off');
        check(R.BattleSquadStability.tacticalPostures.maneuverOn, 'native maneuver owner off');
        const s = b._roster.us[0], enemy = b._roster.ge[0],
          p = R.BattleWeapons.profileStats(s.weapon.kind, s.faction),
          spotted = R.SquadAI.detectionRange(R.SquadAI.ROLES[s.role], enemy);
        check(Math.abs(s.weapon.stats.range - p.range * scale) < 1e-6, 'weapon range not scaled');
        check(spotted > 0 && spotted <= R.SquadAI.ROLES[s.role].visionRange * 1.25 * scale,
          'native visual detection not range scaled');
        await R.BattleSoldierModel.preload(b.scene);
        await b.scene.whenReadyAsync();
        b.scene.getEngine().stopRenderLoop(R.__battleRenderLoop__);
        const volumes = b.obstacles || [], physical = volumes.__physicalFootprints || [];
        const types = {};
        for (const item of volumes) types[item.type || 'unknown'] = (types[item.type || 'unknown'] || 0) + 1;
        const obstacles = { tactical: volumes.length, physical: physical.length, types };
        b.paused = false;
        b.timeScale = 1;
        b.timeLimit = 600;
        let acc = 0, serial = 0;
        const events = [];
        for (let step = 0; step < 4000 && !b.winner; step++) {
          b._trainerStepActive = true;
          try { b.step(0.15); }
          finally { b._trainerStepActive = false; }
          acc += 0.15;
          while (acc >= 0.45 - 1e-9 && !b.winner) {
            acc -= 0.45;
            R.BattleCommanderAI.update(b, scenario, 0.45);
          }
          for (const event of R.BattleAISquadAdapter.eventsSince(b, serial)) {
            check(event.serial === serial + 1, 'non-contiguous native squad event journal');
            serial = event.serial;
            events.push(event);
          }
          if (step % 200 === 0) await new Promise(resolve => setTimeout(resolve, 0));
        }
        b.paused = true;
        const attempts = events.filter(e => e.kind === 'prepare').map(start => {
          const timeline = events.filter(e =>
            e.generation === start.generation &&
            e.faction === start.faction &&
            e.squad === start.squad &&
            e.planSerial === start.planSerial &&
            e.missionVersion === start.missionVersion &&
            e.at >= start.at
          );
          return {
            at: +start.at.toFixed(2),
            side: start.faction,
            squad: start.squad,
            lineIssued: timeline.some(e => e.postureSerial != null),
            ready: timeline.some(e => e.kind === 'prepared'),
            support: timeline.some(e => e.kind === 'supported'),
            arrived: timeline.some(e => e.kind === 'arrived'),
            trace: timeline.map(e => ({
              t: +e.at.toFixed(2), kind: e.kind, reason: e.reason,
              nativeReason: e.nativePreparation?.reason || null,
              posts: e.nativePreparation?.maskedPosts ?? null,
              stage: e.postureStage || null, serial: e.postureSerial ?? null
            }))
          };
        });
        const counts = {
          attempts: attempts.length,
          issued: attempts.filter(x => x.lineIssued).length,
          ready: attempts.filter(x => x.ready).length,
          support: attempts.filter(x => x.support).length,
          arrived: attempts.filter(x => x.arrived).length,
          failed: events.filter(x => x.kind === 'failed').length
        };
        check(api.diagnostics(b).generation >= 1, 'pilot diagnostics unavailable');
        for (const attempt of attempts)
          if (attempt.arrived) check(attempt.ready && attempt.support, 'unsupported physical arrival');
        return {
          sha: expectedSha, seed: scenario.seed, preset, scale,
          meaning: 'weapon and visual recognition range scale; not perception-only',
          time: +b.time.toFixed(2), winner: b.winner, map: scenario.map,
          squads: {
            us: b.factions.us.squads.length, ge: b.factions.ge.squads.length
          },
          obstacles, counts, attempts,
          shots: lab.snapshot().counts.shots
        };
      }, { expectedSha: sha, preset: config.preset, scale: config.range });
      result.pageErrors = errors.slice();
      reports.push(result);
      console.log('COMPACT_LAB_SQUAD ' + JSON.stringify(result));
      fs.writeFileSync(
        outDir + '/' + config.preset + '-' + String(config.range).replace('.', '-') + '.json',
        JSON.stringify(result, null, 2)
      );
      assert.deepEqual(errors, [], 'browser JS errors');
    }
    fs.writeFileSync(outDir + '/summary.json', JSON.stringify(reports, null, 2));
    console.log('PASS immutable-head compact squad pilot quarter/full-range comparisons');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
