#!/usr/bin/env node
'use strict';
/* Exact-branch native browser smoke; no mocked controller or shot receipts. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

(async () => {
  const url = process.env.SKILLS_LAB_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
  const out = 'reports/skills-lab';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      ignoreHTTPSErrors: true
    });
    page.setDefaultTimeout(120000);
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(url + '?skillsLab=1&seed=skills-lab-ci-0001', {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });
    await page.waitForFunction(
      () =>
        !!(window.__battle__ && window.BattleSkillsLab && window.BattleSkillsLab.snapshot()?.targetCount > 0),
      null,
      { timeout: 120000 }
    );
    const initial = await page.evaluate(() => ({
      url: location.search,
      lab: BattleSkillsLab.snapshot(),
      targetMeshes: __battle__.scene.meshes.filter(m => m.metadata && m.metadata.skillsLabTarget).length,
      oldFlags: ['localPlan', 'localAmbush', 'localManeuver', 'coveredBounds'].filter(
        k => new URLSearchParams(location.search).get(k) === '1'
      )
    }));
    assert.match(
      initial.url,
      /tacticalController=new/,
      'Skills Lab must enable EXCLUSIVE new controller by default'
    );
    assert.equal(initial.oldFlags.length, 0, 'skills mode must not silently enable old Phase C flags');
    assert.equal(initial.lab.type, 'native-tactical-skills-lab');
    assert.equal(initial.lab.isolated, true);
    assert.equal(initial.lab.targetDeaths, 0);
    assert.equal(initial.lab.targetCount, 10);
    assert.equal(initial.lab.rangeDistanceM, 70, 'native pre-spawn gap should match the default lab range');
    assert.ok(
      initial.targetMeshes >= initial.lab.targetCount * 3,
      'sandbox standee meshes must actually render for native targets'
    );
    assert.ok(initial.lab.units.length >= 20, 'real squad actors must be present');
    await page.evaluate(() => BattleSkillsLab.advance(7));
    const advanced = await page.evaluate(() => BattleSkillsLab.snapshot());
    assert.ok(advanced.time > initial.lab.time, 'real native steps must advance');
    const commanderAt = await page.evaluate(() => __battle__._generals?.us?.lastTickAt || 0);
    assert.ok(commanderAt > 0,
      'stepped Skills Lab must tick the real Commander/Meso clock alongside the soldiers');
    assert.equal(advanced.targetDeaths, 0, 'inert targets cannot die');
    await page.screenshot({ path: out + '/range.png' });
    await page.evaluate(() => BattleSkillsLab.stageRetreat());
    const staged = await page.evaluate(() => BattleSkillsLab.snapshot());
    assert.ok(
      staged.events.some(e => e.kind === 'scripted premise'),
      'retreat staging must be explicitly recorded as synthetic premise'
    );
    await page.evaluate(() => BattleSkillsLab.reset());
    const reset = await page.evaluate(() => BattleSkillsLab.snapshot());
    assert.equal(reset.time, 0, 'native generation reset must reset the clock');
    assert.equal(reset.shots, 0, 'shot metrics reset without firing fake rounds');
    assert.equal(reset.targetCount, initial.lab.targetCount, 'same targets each replay');
    assert.equal(reset.seed, initial.lab.seed, 'identical range seed on replay');
    fs.writeFileSync(
      out + '/skills-lab.json',
      JSON.stringify(
        {
          initial,
          advanced,
          staged,
          reset,
          errors
        },
        null,
        2
      )
    );
    // CDN model assets may be unavailable in the public checkout; note but do not
    // suppress errors caused by the Skills Lab itself.
    console.log(
      'SKILLS_LAB_BROWSER_DIAGNOSTIC',
      JSON.stringify({ total: errors.length, first: errors.slice(0, 8) })
    );
    const privateAudio404 = /HTTP 404 loading ['"]?\/grasstex\/Assets\/audio\//i;
    const gameErrors = errors.filter(e => !privateAudio404.test(e));
    assert.deepEqual(gameErrors, [], 'no browser runtime errors outside known private audio 404s');

    console.log(
      'SKILLS_LAB_NATIVE_SMOKE',
      JSON.stringify({
        seed: reset.seed,
        preview: process.env.GITHUB_SHA || 'local',
        targetCount: reset.targetCount,
        rendered: initial.targetMeshes,
        nativeSteps: advanced.time,
        controller: initial.lab.controller,
        reset: reset.time,
        browserErrors: errors.length
      })
    );
    await page.close();
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
