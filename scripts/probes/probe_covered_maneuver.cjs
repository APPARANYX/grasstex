'use strict';
/* Phase C: read real battle cover slots and Navigation/Perception physical routes.
   Diagnostic stage: locate a genuine on-map covered bound before sampling action. */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });
  const dir = 'closeups/tactical-observation';
  fs.mkdirSync(dir, { recursive: true });
  const evidence = { fixture: 'real preview map; actual cover slots and Navigation/Perception route sampling' };
  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1440, height: 960 }
    });
    const res = await context.request.get(process.env.TACTICAL_PREVIEW, {
      maxRedirects: 0,
      timeout: 180000
    });
    assert.equal(res.status(), 302);
    const url = new URL(res.headers().location, process.env.TACTICAL_PREVIEW);
    assert.ok(url.pathname.includes('ref-' + process.env.TACTICAL_SHA.slice(0, 12)));
    url.searchParams.set('seed', 'phase-c-covered-move');
    url.searchParams.set('localPlan', '1');
    url.searchParams.set('localAmbush', '1');
    url.searchParams.set('localManeuver', '1');
    url.searchParams.set('coveredBounds', '1');
    const page = await context.newPage(),
      errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(url.href, { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction(
      () => window.__battle__?.factions && window.BattleSquadStability?.tacticalPostures?.maneuverOn,
      null,
      { timeout: 180000 }
    );
    await page.locator('#startBtn').click();
    evidence.fixtureScan = await page.evaluate(() => {
      const b = __battle__;
      b.pause();
      b.restart();
      b.pause();
      b._trainerStepActive = true;
      const A = SquadAI,
        C = BattleCoverPositions,
        N = BattleNavigation,
        q = b.factions.us.squads.find(q => A.leaderOf(q)),
        s = q.members.find(s => !s.dead && !s.isPlayer),
        p0 = s.root.position.clone(),
        slots = C.snapshot(b).filter(slot => slot.status === 'free'),
        failures = {},
        max = Math.min(slots.length, 1500),
        scan = { tested: 0, found: 0, candidateCount: 0, slots: slots.length, byType: {} };
      let picked = null;
      for (const slot of slots)
        scan.byType[slot.type] = (scan.byType[slot.type] || 0) + 1;
      outer: for (let i = 0; i < max; i++) {
        const slot = slots[i];
        if (!Number.isFinite(slot.normalX) || !Number.isFinite(slot.normalZ)) continue;
        for (const rear of [3, 5, 7]) {
          const start = {
            x: slot.x + slot.normalX * rear,
            z: slot.z + slot.normalZ * rear
          };
          if (!N.movementClear(start, start) || !N.movementClear(start, slot)) continue;
          s.root.position.set(start.x, b.heightAt(start.x, start.z), start.z);
          for (const range of [30, 50, 70]) {
            const threat = {
              x: slot.x - slot.normalX * range,
              z: slot.z - slot.normalZ * range,
              at: b.time,
              confidence: 0.9
            };
            if (!N.movementClear(threat, threat)) continue;
            const candidates = C.candidates(s, b, { root: { position: threat } }, 14);
            scan.tested++;
            scan.candidateCount += candidates.length;
            const candidate = candidates.find(c => c.slotId === slot.id);
            if (!candidate) {
              failures['no-matching-slot'] = (failures['no-matching-slot'] || 0) + 1;
              continue;
            }
            const route = C.boundRoute(s, b, candidate, [threat]);
            if (!route.eligible) {
              failures[route.reason] = (failures[route.reason] || 0) + 1;
              continue;
            }
            picked = { start, threat, slot, candidate, route, index: i, rear, range };
            scan.found++;
            break outer;
          }
        }
      }
      s.root.position.copyFrom(p0);
      if (picked) {
        s.root.position.set(
          picked.start.x,
          b.heightAt(picked.start.x, picked.start.z),
          picked.start.z
        );
        const cam = b.scene.activeCamera;
        const center = new BABYLON.Vector3(
          picked.slot.x,
          b.heightAt(picked.slot.x, picked.slot.z) + 1,
          picked.slot.z
        );
        cam.setTarget(center);
        const eye = new BABYLON.Vector3(
          picked.slot.x + picked.slot.normalX * 20 - picked.slot.normalZ * 14,
          b.heightAt(picked.slot.x, picked.slot.z) + 17,
          picked.slot.z + picked.slot.normalZ * 20 + picked.slot.normalX * 14
        );
        if (typeof cam.setPosition === 'function') cam.setPosition(eye);
        else cam.position.copyFrom(eye);
      }
      return {
        source: BATTLE_BUILD,
        navigationVersion: N.version,
        time: b.time,
        squadId: q.id,
        moverId: s.id,
        scan,
        failures,
        picked
      };
    });
    console.log('COVERED_MANEUVER_FIXTURE_SCAN', JSON.stringify(evidence.fixtureScan));
    assert.ok(evidence.fixtureScan.picked, 'real map must provide a physical covered-route fixture');
    await page.waitForTimeout(180);
    await page.screenshot({ path: `${dir}/covered-bound-fixture.png` });
    evidence.errors = errors;
    assert.deepEqual(errors, []);
    console.log('PASS real-preview covered route selection', JSON.stringify(evidence));
  } finally {
    fs.writeFileSync(`${dir}/covered-bound-report.json`, JSON.stringify(evidence, null, 2));
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
