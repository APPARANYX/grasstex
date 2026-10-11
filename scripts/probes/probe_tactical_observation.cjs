'use strict';
/* #299 Phase A: real preview-page observer lifecycle and CPU/allocation evidence.
   No combat A/B here: paired controls belong to the standard Actions benchmark. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });
  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const entry = process.env.TACTICAL_PREVIEW;
    const res = await context.request.get(entry, { maxRedirects: 0, timeout: 180000 });
    assert.equal(res.status(), 302, (await res.text()).slice(-1500));
    const url = new URL(res.headers().location, entry);
    assert.ok(
      url.pathname.includes('ref-' + process.env.TACTICAL_SHA.slice(0, 12)),
      'preview is final PR head'
    );
    url.searchParams.set('seed', 'phase-a-observer');
    url.searchParams.set('tacticalSituation', '1');
    url.searchParams.set('urbanPicture', '1');
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(url.href, { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction(() => window.__battle__?.factions && window.BattleTacticalSituation, {
      timeout: 180000
    });
    await page.waitForTimeout(5000);
    const cdp = await context.newCDPSession(page);
    await page.evaluate(() => {
      __battle__.paused = true;
      for (let i = 0; i < 50; i++) {
        BattleTacticalSituation.sample(__battle__);
        if (window.BattleUrbanOperatingPicture) BattleUrbanOperatingPicture.sample(__battle__);
      }
    });
    await cdp.send('HeapProfiler.collectGarbage');
    await cdp.send('HeapProfiler.startSampling', {
      samplingInterval: 1024,
      includeObjectsCollectedByMajorGC: true,
      includeObjectsCollectedByMinorGC: true
    });
    const before = await cdp.send('Runtime.getHeapUsage');
    const evidence = await page.evaluate(() => {
      const b = __battle__,
        T = BattleTacticalSituation;
      b.paused = true;
      if (!T.enabled()) throw Error('query flag lost');
      const stable = JSON.stringify(T.compute(b, 'us')) === JSON.stringify(T.compute(b, 'us'));
      const loops = 1000,
        start = performance.now();
      let bytes = 0;
      for (let i = 0; i < loops; i++) {
        const out = T.sample(b);
        if (!i) bytes = JSON.stringify(out).length;
      }
      const totalMs = performance.now() - start;
      const sampled = T.summary(b);
      let urban = null;
      if (window.BattleUrbanOperatingPicture) {
        const U = BattleUrbanOperatingPicture;
        if (!U.enabled()) throw Error('urban query flag lost');
        const stable = JSON.stringify(U.compute(b, 'us')) === JSON.stringify(U.compute(b, 'us'));
        const startUrban = performance.now();
        for (let i = 0; i < 100; i++) U.sample(b);
        const out = U.summary(b).urbanOperatingPicture;
        urban = {
          stable,
          loops: 100,
          msPerSample: (performance.now() - startUrban) / 100,
          serializedBytes: JSON.stringify(out).length,
          buildings: out.us.buildings.length,
          streets: out.us.streets.length,
          visibilityProbes: out.us.sectorVisibility.length
        };
      }
      return {
        urban,
        enabled: T.enabled(),
        stable,
        loops,
        totalMs,
        msPerSample: totalMs / loops,
        serializedBytes: bytes,
        beforeContacts: sampled.tacticalSituation.us.contactCount,
        modules: performance.getEntriesByType('resource').filter(e => /battle\/modules\/.*\.js/.test(e.name))
          .length
      };
    });
    await cdp.send('HeapProfiler.collectGarbage');
    const after = await cdp.send('Runtime.getHeapUsage');
    evidence.collectedHeapDeltaBytes = after.usedSize - before.usedSize;
    const { profile } = await cdp.send('HeapProfiler.stopSampling');
    function allocated(n) {
      return n.selfSize + n.children.reduce((sum, c) => sum + allocated(c), 0);
    }
    evidence.sampledAllocationBytes = allocated(profile.head);
    evidence.restart = await page.evaluate(() => {
      const b = __battle__,
        T = BattleTacticalSituation;
      b.restart();
      const U = window.BattleUrbanOperatingPicture;
      const urbanCleared = !U || U.summary(b).urbanOperatingPicture === null;
      if (U) U.sample(b);
      const urbanReports = U
        ? U.summary(b).urbanOperatingPicture.us.buildings.reduce((n, c) => n + c.reportedThreats, 0)
        : 0;
      const cleared = T.summary(b).tacticalSituation === null;
      T.sample(b);
      return {
        urbanCleared,
        urbanReports,
        cleared,
        contacts: T.summary(b).tacticalSituation.us.contactCount
      };
    });
    evidence.errors = errors;
    fs.mkdirSync('closeups/tactical-observation', { recursive: true });
    fs.writeFileSync('closeups/tactical-observation/report.json', JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify(evidence));
    assert.equal(evidence.stable, true);
    if (evidence.urban) {
      assert.equal(evidence.urban.stable, true);
      assert.ok(evidence.urban.buildings > 0);
      assert.ok(evidence.urban.visibilityProbes > 0);
    }
    assert.equal(evidence.restart.urbanCleared, true);
    assert.equal(evidence.restart.urbanReports, 0);
    assert.equal(evidence.restart.cleared, true);
    assert.equal(evidence.restart.contacts, 0);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
