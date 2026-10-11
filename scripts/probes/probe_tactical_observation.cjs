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
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(url.href, { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction(() => window.__battle__?.factions && window.BattleTacticalSituation, {
      timeout: 180000
    });
    await page.waitForTimeout(5000);
    const cdp = await context.newCDPSession(page);
    await cdp.send('HeapProfiler.collectGarbage');
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
      b.restart();
      const cleared = T.summary(b).tacticalSituation === null;
      T.sample(b);
      const fresh = T.summary(b);
      return {
        enabled: T.enabled(),
        stable,
        loops,
        totalMs,
        msPerSample: totalMs / loops,
        serializedBytes: bytes,
        beforeContacts: sampled.tacticalSituation.us.contactCount,
        restartCleared: cleared,
        restartContacts: fresh.tacticalSituation.us.contactCount,
        modules: performance.getEntriesByType('resource').filter(e => /battle\/modules\/.*\.js/.test(e.name))
          .length
      };
    });
    await cdp.send('HeapProfiler.collectGarbage');
    const after = await cdp.send('Runtime.getHeapUsage');
    evidence.collectedHeapDeltaBytes = after.usedSize - before.usedSize;
    evidence.errors = errors;
    fs.mkdirSync('closeups/tactical-observation', { recursive: true });
    fs.writeFileSync('closeups/tactical-observation/report.json', JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify(evidence));
    assert.equal(evidence.stable, true);
    assert.equal(evidence.restartCleared, true);
    assert.equal(evidence.restartContacts, 0);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
