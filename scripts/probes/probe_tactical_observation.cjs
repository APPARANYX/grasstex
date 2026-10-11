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
    await page.locator('#startBtn').click();
    await page.waitForFunction(() => __battle__.time >= 6, null, { timeout: 120000 });
    const cdp = await context.newCDPSession(page);
    await page.evaluate(() => {
      __battle__.pause();
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
      b.pause();
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
    /* The viewer is not staged by preview.php. Serve this exact checkout HTML
       on the pinned preview origin; its runtime/source requests use that stage. */
    const exported = await page.evaluate(() => {
      const start = performance.now();
      const diagnostic = BattleDiagnosticsExport.snapshot('full', __battle__);
      const fullMs = performance.now() - start;
      const loops = 20,
        compactStart = performance.now();
      for (let i = 0; i < loops; i++) BattleDiagnosticsExport.compact(__battle__);
      return {
        diagnostic,
        cost: {
          fullMs,
          compactMsPerExport: (performance.now() - compactStart) / loops,
          fullSerializedBytes: JSON.stringify(diagnostic).length,
          historyFrames: diagnostic.timeline.observations.frames.length,
          time: __battle__.time
        }
      };
    });
    const diagnostic = exported.diagnostic;
    evidence.diagnostics = exported.cost;
    const missions = ['us', 'ge'].flatMap(side =>
      diagnostic.factions[side].squads.map(q => ({ side, mission: q.mission }))
    );
    if (missions.some(q => q.mission && q.mission.observations)) {
      for (const { side, mission } of missions) {
        assert.ok(mission.observations, 'every issued brief has evidence');
        assert.equal(mission.observations.faction, side);
        assert.equal(mission.observations.at, mission.issuedAt);
        assert.ok(mission.confidence >= 0 && mission.confidence <= 1);
      }
      await cdp.send('HeapProfiler.collectGarbage');
      await cdp.send('HeapProfiler.startSampling', {
        samplingInterval: 1024,
        includeObjectsCollectedByMajorGC: true,
        includeObjectsCollectedByMinorGC: true
      });
      const intentBefore = await cdp.send('Runtime.getHeapUsage');
      evidence.intent = await page.evaluate(() => {
        const b = __battle__,
          q = b.factions.us.squads[0],
          C = BattleCommanderAI;
        const frozen = JSON.stringify(q._macroMission),
          loops = 1000,
          start = performance.now();
        let out;
        for (let i = 0; i < loops; i++) out = C.intentEvidence(b, q, q._macroMission);
        return {
          loops,
          msPerSnapshot: (performance.now() - start) / loops,
          serializedBytes: JSON.stringify(out).length,
          frozen: JSON.stringify(q._macroMission) === frozen,
          factions: ['us', 'ge'].map(f => b.factions[f].squads.length)
        };
      });
      const intentProfile = await cdp.send('HeapProfiler.stopSampling');
      await cdp.send('HeapProfiler.collectGarbage');
      const intentAfter = await cdp.send('Runtime.getHeapUsage');
      evidence.intent.sampledAllocationBytes = allocated(intentProfile.profile.head);
      evidence.intent.collectedHeapDeltaBytes = intentAfter.usedSize - intentBefore.usedSize;
      assert.equal(evidence.intent.frozen, true);
    }
    if (await page.evaluate(() => !!window.BattleSquadStability?.observeRouteTransition)) {
      evidence.route = await page.evaluate(() => {
        const b = __battle__,
          q = b.factions.us.squads[0],
          L = BattleLeases,
          S = BattleSquadStability,
          members = q.members.filter(s => !s.dead),
          position = () =>
            members.reduce(
              (p, s) => ({
                x: p.x + s.root.position.x / members.length,
                z: p.z + s.root.position.z / members.length
              }),
              { x: 0, z: 0 }
            );
        const pos = position(),
          leg = +q.routeIndex || 0;
        const gameplay = () =>
          JSON.stringify({
            phase: q.commandPhase,
            route: q.route,
            index: q.routeIndex,
            mission: q._macroMission,
            objective: q.objective,
            members: members.map(s => [s.destination, s.prone, s.crawling, s.tacticalCrouch])
          });
        const before = gameplay();
        L.grant(
          q,
          'route-transition',
          'squad-leader',
          b.time,
          b.time + 120,
          'browser diagnostic fixture',
          'arrival',
          {
            from: leg - 1,
            leg,
            missionVersion: q._macroMission?.version || 0,
            target: { x: pos.x, z: pos.z + 100 },
            arrivalRadius: 8,
            startDistance: 100,
            distance: 100,
            bestDistance: 100,
            traveled: 0,
            lastPosition: pos,
            lastProgressAt: b.time,
            noProgressBudget: 120
          }
        );
        const loops = 1000,
          start = performance.now();
        for (let i = 0; i < loops; i++) S.observeRouteTransition(b, q);
        const msPerTick = (performance.now() - start) / loops,
          live = L.get(q, 'route-transition');
        if (!live) throw Error('route observer fixture ended before arrival');
        live.data.target = position();
        S.observeRouteTransition(b, q);
        const ended = q._leases.observedEnded.at(-1);
        if (ended.endReason !== 'arrived') throw Error('route arrival not recorded');
        if (gameplay() !== before) throw Error('route observer changed gameplay');
        return {
          fixture: 'diagnostic lease on paused real squad; no movement injection',
          loops,
          msPerTick,
          endReason: ended.endReason,
          gameplayUnchanged: true,
          nonemptyHistory: q._leases.observedEnded.length
        };
      });
    }
    if (diagnostic.observations) {
      assert.ok(diagnostic.timeline.observations.frames.length > 0, 'enabled history actually collected');
      const flow = await context.newPage();
      flow.on('pageerror', e => errors.push('flow: ' + String(e)));
      const flowUrl = new URL('ai_flow_live.html', url);
      flowUrl.searchParams.set('view', 'macro');
      await flow.route(flowUrl.href.split('?')[0] + '*', route =>
        route.fulfill({ body: fs.readFileSync('ai_flow_live.html', 'utf8'), contentType: 'text/html' })
      );
      await flow.goto(flowUrl.href, { waitUntil: 'load', timeout: 180000 });
      await flow.waitForFunction(() => window.__flowHashes?.commander, { timeout: 180000 });
      await flow.locator('#runtimeFileA').setInputFiles({
        name: 'phase-a-diagnostics.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(diagnostic))
      });
      await flow.waitForFunction(
        () =>
          !document.getElementById('timelinePanel').hidden &&
          +document.getElementById('timelineScrub').max >= 6
      );
      await flow.locator('#timelineScrub').evaluate(el => {
        el.value = el.max;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await flow.waitForFunction(() => document.querySelectorAll('.tacticalCard').length === 2);
      await flow.waitForTimeout(200);
      const text = await flow.locator('#tacticalPictureBody').innerText();
      assert.match(text, /A US/);
      assert.match(text, /A GE/);
      assert.match(text, /footprints/);
      assert.match(text, /structure control unknown/);
      assert.ok(
        text.includes(diagnostic.observations.urbanOperatingPicture.us.buildings.length + ' footprints')
      );
      fs.mkdirSync('closeups/tactical-observation', { recursive: true });
      await flow.screenshot({ path: 'closeups/tactical-observation/picture-desktop.png' });
      await flow.setViewportSize({ width: 390, height: 844 });
      await flow.screenshot({ path: 'closeups/tactical-observation/picture-mobile.png' });
      const fits = await flow.locator('#tacticalPicturePanel').evaluate(el => {
        const r = el.getBoundingClientRect();
        return r.x >= 0 && r.right <= innerWidth + 1;
      });
      assert.equal(fits, true, 'picture fits narrow viewer');
      const legacy = JSON.parse(JSON.stringify(diagnostic));
      delete legacy.observations;
      delete legacy.timeline.observations;
      await flow.locator('#runtimeFileA').setInputFiles({
        name: 'legacy.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(legacy))
      });
      await flow.waitForFunction(() =>
        document.getElementById('tacticalPictureBody').textContent.includes('no tactical observation')
      );
      evidence.viewer = { imported: true, legacyCompatible: true, narrowFits: fits, text };
      await flow.close();
    }
    evidence.restart = await page.evaluate(() => {
      const b = __battle__,
        T = BattleTacticalSituation;
      const priorBriefs = ['us', 'ge']
        .flatMap(f => b.factions[f].squads.map(q => q._macroMission))
        .filter(Boolean);
      b.restart();
      const historyCleared = !BattleAITimeline.snapshot(b).observations;
      const intentCleared = ['us', 'ge'].every(f =>
        b.factions[f].squads.every(
          q =>
            !priorBriefs.includes(q._macroMission) &&
            (!q._macroMission || !q._macroMission.observations || q._macroMission.observations.at <= b.time)
        )
      );
      const U = window.BattleUrbanOperatingPicture;
      const urbanCleared = !U || U.summary(b).urbanOperatingPicture === null;
      if (U) U.sample(b);
      const urbanReports = U
        ? U.summary(b).urbanOperatingPicture.us.buildings.reduce((n, c) => n + c.reportedThreats, 0)
        : 0;
      const cleared = T.summary(b).tacticalSituation === null;
      T.sample(b);
      return {
        routeCleared: ['us', 'ge'].every(f =>
          b.factions[f].squads.every(
            q => !q._leases?.live?.['route-transition'] && !q._leases?.observedEnded?.length
          )
        ),
        historyCleared,
        intentCleared,
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
    assert.equal(evidence.restart.routeCleared, true);
    assert.equal(evidence.restart.historyCleared, true);
    assert.equal(evidence.restart.intentCleared, true);
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
