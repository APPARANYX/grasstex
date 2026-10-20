'use strict';
/* #299 Phase A: real preview-page observer lifecycle and CPU/allocation evidence.
   No combat A/B here: paired controls belong to the standard Actions benchmark. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { requestPreview } = require('./preview_request.cjs');
(async () => {
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });
  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const entry = process.env.TACTICAL_PREVIEW;
    const res = await requestPreview(context, entry);
    assert.equal(res.status(), 302, (await res.text()).slice(-1500));
    const url = new URL(res.headers().location, entry);
    assert.ok(
      url.pathname.includes('ref-' + process.env.TACTICAL_SHA.slice(0, 12)),
      'preview is final PR head'
    );
    // These seeded urban/cover fixtures belong to the original 2 km scenario.
    url.searchParams.set('strategicInterception', '0');
    url.searchParams.set('seed', 'phase-a-observer');
    url.searchParams.set('tacticalSituation', '1');
    url.searchParams.set('urbanPicture', '1');
    url.searchParams.set('leaseConflicts', '1');
    url.searchParams.set('localPlan', '1');
    url.searchParams.set('localResources', '1');
    url.searchParams.set('localDegrade', '1');
    url.searchParams.set('localTasks', '1');
    for (const flag of [
      'localStructures',
      'localEntry',
      'localEntryGate',
      'localSurvey',
      'localWatch',
      'localContactResume',
      'localContinuity'
    ])
      url.searchParams.set(flag, '1');
    url.searchParams.set('coveredBounds', '1');
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(url.href, { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction(() => window.__battle__?.factions && window.BattleTacticalSituation, {
      timeout: 180000
    });
    await page.locator('#startBtn').click();
    await page.waitForFunction(() => __battle__.time >= 6, null, { timeout: 120000 });
    /* Capture the real live battle canvas as well as the tactical dashboard.
       This is contextual gameplay evidence, NOT a claim of building clearing. */
    fs.mkdirSync('closeups/tactical-observation', { recursive: true });
    await page.screenshot({ path: 'closeups/tactical-observation/battle-gameplay.png' });
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
    if (await page.evaluate(() => !!window.BattleSquadStability?.resolveLeaseConflicts)) {
      await cdp.send('HeapProfiler.collectGarbage');
      await cdp.send('HeapProfiler.startSampling', {
        samplingInterval: 1024,
        includeObjectsCollectedByMajorGC: true,
        includeObjectsCollectedByMinorGC: true
      });
      const conflictBefore = await cdp.send('Runtime.getHeapUsage');
      evidence.conflicts = await page.evaluate(() => {
        const b = __battle__,
          q = b.factions.us.squads[0],
          L = BattleLeases,
          S = BattleSquadStability,
          E = BattleEngagement;
        if (!S.leaseConflictsOn()) throw Error('conflict flag lost');
        const gameplay = () =>
          JSON.stringify([
            q._macroMission,
            q.commandPhase,
            q.route,
            q.routeIndex,
            q.objective,
            q.members.map(s => [s.destination, s.prone, s.crawling, s.tacticalCrouch])
          ]);
        const before = gameplay();
        L.grant(q, 'bound', 'squad-leader', b.time, b.time + 10, 'browser fixture');
        L.grant(q, 'regroup', 'squad-leader', b.time, b.time + 20, 'browser fixture', 'release', {
          missionVersion: q._macroMission?.version || 0
        });
        E.orderBound(q.members);
        const loops = 1000,
          start = performance.now();
        for (let i = 0; i < loops; i++) S.leaseConflictDecision(q, b.time);
        const msPerQuery = (performance.now() - start) / loops;
        S.resolveLeaseConflicts(b, q);
        if (L.get(q, 'bound') || q.members.some(s => !s.dead && !s.isPlayer && s.eng?.boundOrder))
          throw Error('conflicting bound was not cleaned up');
        if (gameplay() !== before) throw Error('resolution changed strategic/route/stance state');
        return {
          fixture: 'owner API lease/order fixture on paused real squad; no movement injection',
          loops,
          msPerQuery,
          winner: q._leases.conflicts.at(-1).winner,
          cleanup: true,
          nonemptyHistory: q._leases.conflicts.length
        };
      });
      const conflictProfile = await cdp.send('HeapProfiler.stopSampling');
      await cdp.send('HeapProfiler.collectGarbage');
      const conflictAfter = await cdp.send('Runtime.getHeapUsage');
      evidence.conflicts.sampledAllocationBytes = allocated(conflictProfile.profile.head);
      evidence.conflicts.collectedHeapDeltaBytes = conflictAfter.usedSize - conflictBefore.usedSize;
    }
    if (await page.evaluate(() => !!window.BattleSquadStability?.localPlan)) {
      await cdp.send('HeapProfiler.collectGarbage');
      await cdp.send('HeapProfiler.startSampling', {
        samplingInterval: 1024,
        includeObjectsCollectedByMajorGC: true,
        includeObjectsCollectedByMinorGC: true
      });
      const localBefore = await cdp.send('Runtime.getHeapUsage');
      evidence.localPlanning = await page.evaluate(() => {
        const b = __battle__,
          S = BattleSquadStability,
          P = S.localPlan,
          q = b.factions.us.squads.find(q => SquadAI.leaderOf(q)),
          E = BattleEngagement,
          L = BattleLeases;
        if (!S.localPlanOn() || !P.resourcesOn || !P.tasksOn || !q)
          throw Error('local policy flag/leader missing');
        const natural = S.localPlanTelemetry(b);
        const snapshot = () =>
          JSON.stringify([
            q._macroMission,
            q.commandPhase,
            q.route,
            q.routeIndex,
            q.members.map(s => [s.destination, s.prone, s.crawling, s.tacticalCrouch])
          ]);
        const before = snapshot(),
          loops = 1000,
          start = performance.now();
        for (let i = 0; i < loops; i++) P.update(b, q);
        const msPerUpdate = (performance.now() - start) / loops;
        const stable = JSON.stringify(P.update(b, q)) === JSON.stringify(P.update(b, q));
        const resourceReport = E.updateSquad(q, b),
          resourceStart = performance.now();
        for (let i = 0; i < loops; i++) P.read(b, q, resourceReport);
        const resourceMsPerRead = (performance.now() - resourceStart) / loops;
        const resource = P.read(b, q, resourceReport).resources;
        if (!resource || resource.supportingIds.length > P.tuning.resourceLimit)
          throw Error('bounded resource contract missing');
        const ready = q.members.find(s => P.moverEligible(s, q, b));
        if (ready) {
          const owned = ready.isPlayer;
          ready.isPlayer = true;
          if (P.moverEligible(ready, q, b) || P.supportMembers(b, q, { fireSupport: [ready] }).length)
            throw Error('possession became a tactical resource');
          ready.isPlayer = owned;
        }
        const members = q.members.filter(s => !s.dead);
        L.grant(q, 'bound', 'squad-leader', b.time, b.time + 10, 'local pressure fixture');
        E.orderBound(members);
        P.update(b, q, { underFire: members.length, fireSupport: members.slice(0, 2) });
        S.resolveLeaseConflicts(b, q);
        if (
          q._localTask.kind !== 'protect' ||
          L.get(q, 'bound') ||
          members.some(s => !s.isPlayer && s.eng?.boundOrder)
        )
          throw Error('situational protection did not reach Engagement cleanup');
        if (snapshot() !== before) throw Error('local policy changed strategic/route/stance state');
        return {
          natural,
          loops,
          msPerUpdate,
          resourceMsPerRead,
          resource,
          stable,
          cleanup: true,
          winner: q._localTask.kind,
          fixture: 'own-squad pressure report through policy and existing lease/Engagement owners',
          bytes: JSON.stringify(q._localTask).length
        };
      });
      const localProfile = await cdp.send('HeapProfiler.stopSampling');
      await cdp.send('HeapProfiler.collectGarbage');
      const localAfter = await cdp.send('Runtime.getHeapUsage');
      evidence.localPlanning.sampledAllocationBytes = allocated(localProfile.profile.head);
      evidence.localPlanning.collectedHeapDeltaBytes = localAfter.usedSize - localBefore.usedSize;
      assert.equal(evidence.localPlanning.stable, true);
      assert.ok(
        evidence.localPlanning.natural.transitions > 0,
        'real commander hook activated before fixture'
      );
    }
    await cdp.send('HeapProfiler.collectGarbage');
    await cdp.send('HeapProfiler.startSampling', {
      samplingInterval: 1024,
      includeObjectsCollectedByMajorGC: true,
      includeObjectsCollectedByMinorGC: true
    });
    const coveredBefore = await cdp.send('Runtime.getHeapUsage');
    evidence.coveredBounds = await page.evaluate(() => {
      const C = BattleCoverPositions,
        b = __battle__;
      if (!C.coveredBoundsOn()) throw Error('covered bounds flag lost');
      const obstacle = {
        id: 'probe-mask',
        physicalId: 'probe-mask',
        shape: 'obb',
        type: 'hedge',
        x: 10000,
        z: 10000,
        hx: 14,
        hz: 1,
        ux: 1,
        uz: 0,
        vx: 0,
        vz: 1,
        radius: 1,
        y: 0,
        height: 2,
        cover: 0.62
      };
      const fixture = { ...b, obstacles: [obstacle], heightAt: () => 0 },
        soldier = { root: { position: { x: 10000, z: 9996 } } },
        threats = [{ x: 10000, z: 10060, at: b.time, confidence: 0.9, source: 'reported' }],
        goal = { x: 10006, z: 9996 },
        exposed = { x: 10004, z: 10004 };
      const safe = C.boundRoute(soldier, fixture, goal, threats),
        unsafe = C.boundRoute(soldier, fixture, exposed, threats),
        stable = JSON.stringify(safe) === JSON.stringify(C.boundRoute(soldier, fixture, goal, threats));
      if (!safe.eligible || unsafe.eligible || !stable) throw Error('covered geometry causal fixture failed');
      const loops = 1000,
        start = performance.now();
      for (let i = 0; i < loops; i++) C.boundRoute(soldier, fixture, goal, threats);
      return {
        safe,
        unsafe,
        stable,
        loops,
        msPerRoute: (performance.now() - start) / loops,
        natural: BattleEngagement.coveredBoundTelemetry(b)
      };
    });
    const coveredProfile = await cdp.send('HeapProfiler.stopSampling');
    await cdp.send('HeapProfiler.collectGarbage');
    const coveredAfter = await cdp.send('Runtime.getHeapUsage');
    evidence.coveredBounds.sampledAllocationBytes = allocated(coveredProfile.profile.head);
    evidence.coveredBounds.collectedHeapDeltaBytes = coveredAfter.usedSize - coveredBefore.usedSize;
    await cdp.send('HeapProfiler.collectGarbage');
    await cdp.send('HeapProfiler.startSampling', {
      samplingInterval: 1024,
      includeObjectsCollectedByMajorGC: true,
      includeObjectsCollectedByMinorGC: true
    });
    const missionBefore = await cdp.send('Runtime.getHeapUsage');
    evidence.localMissionTasks = await page.evaluate(() => {
      const b = __battle__,
        S = BattleSquadStability,
        P = S.localPlan,
        L = BattleLeases;
      const q = b.factions.us.squads.find(
        q =>
          SquadAI.leaderOf(q) &&
          q._missionExecution?.mission === q._macroMission &&
          q._macroMission?.status === 'executing' &&
          q.route?.length
      );
      if (!P.tasksOn || !q) throw Error('local mission task flag/accepted execution missing');
      const wp = q.route[q.routeIndex],
        version = q._macroMission.version;
      const gameplay = JSON.stringify([
        q._macroMission,
        q.commandPhase,
        q.route,
        q.routeIndex,
        q.objective,
        q.orderAnchor
      ]);
      L.grant(
        q,
        'route-transition',
        'squad-leader',
        b.time,
        b.time + 120,
        'browser local task join',
        'progress',
        {
          missionVersion: version,
          leg: q.routeIndex,
          target: { x: wp.x, z: wp.z },
          distance: 50,
          traveled: 0,
          lastProgressAt: b.time
        }
      );
      const loops = 1000,
        start = performance.now();
      for (let i = 0; i < loops; i++) P.execution(b, q);
      const msPerExecution = (performance.now() - start) / loops,
        first = P.execution(b, q);
      if (first?.kind !== 'route-transition' || first.clearance !== 'not-assessed')
        throw Error('route owner not integrated');
      const stable = JSON.stringify(first) === JSON.stringify(P.execution(b, q));
      L.get(q, 'route-transition').data.missionVersion++;
      if (P.execution(b, q)) throw Error('stale parent execution accepted');
      L.end(q, 'route-transition', b.time, 'browser join complete');
      if (
        JSON.stringify([
          q._macroMission,
          q.commandPhase,
          q.route,
          q.routeIndex,
          q.objective,
          q.orderAnchor
        ]) !== gameplay
      )
        throw Error('execution join changed command authority');
      return {
        loops,
        msPerExecution,
        first,
        stable,
        staleRejected: true,
        fixture:
          'join on actual accepted real-page route; physical outcomes covered separately by shipping harness'
      };
    });
    const missionProfile = await cdp.send('HeapProfiler.stopSampling');
    await cdp.send('HeapProfiler.collectGarbage');
    const missionAfter = await cdp.send('Runtime.getHeapUsage');
    evidence.localMissionTasks.sampledAllocationBytes = allocated(missionProfile.profile.head);
    evidence.localMissionTasks.collectedHeapDeltaBytes = missionAfter.usedSize - missionBefore.usedSize;
    assert.equal(evidence.localMissionTasks.stable, true);
    evidence.interiorContinuity = await page.evaluate(() => {
      const actual = __battle__,
        S = BattleSquadStability,
        P = S.localPlan,
        N = BattleNavigation,
        L = BattleLeases;
      if (!P.continuityOn) throw Error('continuity query flag lost');
      const scene = actual.scene.metadata.battleScenario || actual.scene.metadata.battleTown;
      const door = N.doorPortals.find(p => {
        const b = scene.buildings.find(b => b.id === p.building);
        return b && b.w >= 4 && b.w <= 30 && b.d >= 4 && b.d <= 30 && N.movementClear(p.inside, b);
      });
      if (!door) throw Error('real Navigation footprint fixture missing');
      const house = scene.buildings.find(b => b.id === door.building);
      // Isolated contract fixture on real-page Navigation/terrain/LOS. These
      // poses are controlled inputs, never autonomous or screenshot evidence.
      const b = { ...actual, time: actual.time },
        q = {
          id: 'continuity-contract',
          faction: 'us',
          state: 'advance',
          routeIndex: 1,
          commandPhase: 'clear-town',
          members: [],
          contact: null,
          inContact: false,
          route: [{ ...door.outside }, { x: house.x, z: house.z }, { x: house.x, z: house.z + 80 }]
        };
      const m = (q._macroMission = {
        version: 1,
        status: 'executing',
        intent: 'capture',
        action: 'assault',
        route: q.route.slice(0, 2),
        point: q.route[2]
      });
      q._missionExecution = { mission: m, acceptedAt: b.time };
      for (let i = 0; i < 2; i++)
        q.members.push({
          id: 900000 + i,
          role: i ? 'rifleman' : 'sergeant',
          faction: 'us',
          squad: q,
          hp: 100,
          root: { position: i ? { x: house.x, z: house.z } : { ...door.outside }, rotation: { y: 0 } }
        });
      const leader = q.members[0],
        witness = q.members[1];
      L.grant(
        q,
        'route-transition',
        'squad-leader',
        b.time,
        b.time + 120,
        'browser contract',
        'arrival/contact',
        {
          leg: 1,
          missionVersion: 1,
          target: q.route[1],
          arrivalRadius: 8,
          distance: 20,
          bestDistance: 20,
          traveled: 0,
          lastPosition: { ...door.outside },
          noProgressBudget: 120
        }
      );
      P.update(b, q);
      b.time += 0.45;
      Object.assign(leader.root.position, door.inside);
      P.update(b, q);
      if (!q._localTask.inputs.execution.structure.entryEvidence.entryVerified)
        throw Error('portal entry fixture rejected');
      b.time += 0.45;
      P.update(b, q);
      q.inContact = true;
      q._engagementPlan = { missionVersion: 1, status: 'active' };
      for (let i = 0; i < 3; i++) {
        b.time += 0.45;
        P.update(b, q);
        S.executeMission(b, q, scene);
      }
      if (L.get(q, 'route-transition') || q.routeIndex !== 1)
        throw Error('contact did not yield route authority');
      q.inContact = false;
      q._engagementPlan.status = 'quiet';
      b.time += 0.45;
      P.update(b, q);
      S.executeMission(b, q, scene);
      if (L.get(q, 'route-transition')) throw Error('quiet plan was bypassed');
      q._engagementPlan = null;
      b.time += 0.45;
      P.update(b, q);
      S.executeMission(b, q, scene);
      b.time += 0.45;
      P.update(b, q);
      const structure = q._localTask.inputs.execution.structure;
      if (
        structure.entryEvidence.entryVerified ||
        !structure.presenceEvidence?.presenceVerified ||
        structure.survey.complete ||
        structure.watch.ready ||
        q.routeIndex !== 1
      )
        throw Error('presence fabricated crossing/security or failed fresh reassessment');
      const stable = JSON.stringify(P.update(b, q)) === JSON.stringify(P.update(b, q));
      witness.dead = true;
      if (P.entrySatisfied(b, q, q.route[1])) throw Error('lost witness query accepted');
      b.time += 0.45;
      P.update(b, q);
      if (q._localTask.inputs.execution.structure.presenceEvidence)
        throw Error('lost witness retained continuity');
      P.reset(q);
      return {
        fixture:
          'isolated controlled poses; shipping real-page Navigation/terrain/LOS and mission-owner APIs; not autonomous gameplay',
        buildingId: house.id,
        doorwayId: door.id,
        provenance: structure.presenceEvidence,
        freshSurveyRequired: true,
        freshWatchRequired: true,
        lostWitnessRejected: true,
        stable
      };
    });
    evidence.localDegradation = await page.evaluate(() => {
      const b = __battle__,
        S = BattleSquadStability,
        P = S.localPlan,
        E = BattleEngagement,
        L = BattleLeases;
      const q = b.factions.us.squads.find(
        q => q._macroMission && SquadAI.leaderOf(q) && q.members.filter(s => !s.dead).length > 4
      );
      if (!P.degradationOn || !q) throw Error('degradation flag/live leader missing');
      const members = q.members.filter(s => !s.dead),
        leader = SquadAI.leaderOf(q),
        report = {
          underFire: members.length,
          effective: members.length,
          fireSupport: [],
          fled: [],
          contactStarted: false
        };
      P.update(b, q, report);
      if (q._localTask.kind !== 'protect') throw Error('real protective local task missing');
      const task = JSON.stringify(q._localTask),
        original = E.updateSquad;
      leader.dead = true;
      S.leaderDown(q);
      E.updateSquad = () => report;
      try {
        SquadAI.updateSquad(q, b);
        if (q._leaderlessIntent?.localValidity?.status !== 'inherited')
          throw Error('valid protective task not inherited');
        const inherited = q._leaderlessIntent.localTask,
          loops = 1000,
          start = performance.now();
        for (let i = 0; i < loops; i++) P.degradation(b, q, inherited, report);
        const msPerValidation = (performance.now() - start) / loops;
        q._macroMission.version++;
        L.grant(q, 'bound', 'squad-leader', b.time, b.time + 10, 'superseded leaderless fixture');
        E.orderBound(members.filter(s => s !== leader));
        S.fireAndMovement(q, b);
        const validity = q._leaderlessIntent.localValidity;
        if (
          validity.status !== 'hold' ||
          validity.reason !== 'mission-replaced' ||
          L.get(q, 'bound') ||
          members.some(s => !s.dead && !s.isPlayer && s.eng?.boundOrder)
        )
          throw Error('leaderless invalid task did not withdraw pending orders');
        if (JSON.stringify(q._localTask) !== task)
          throw Error('absent leader invented or changed local task');
        return { loops, msPerValidation, validity, taskPreserved: true, cleanup: true };
      } finally {
        E.updateSquad = original;
      }
    });
    evidence.restart = await page.evaluate(() => {
      const b = __battle__,
        T = BattleTacticalSituation;
      const priorBriefs = ['us', 'ge']
        .flatMap(f => b.factions[f].squads.map(q => q._macroMission))
        .filter(Boolean);
      // Exercise actual same-page restart with a NONEMPTY Micro audit, not a zero-to-zero check.
      const q = b.factions.us.squads.find(q =>
          q.members.some(s => !s.dead && !s.isPlayer && !SquadAI.isMachineGun(s))
        ),
        s = q.members.find(s => !s.dead && !s.isPlayer && !SquadAI.isMachineGun(s));
      q._assaultAuthorized = true;
      BattleLeases.grant(q, 'bound', 'squad-leader', b.time, b.time + 10, 'covered restart fixture');
      BattleEngagement.stateOf(s).state = 'engage';
      BattleEngagement.orderBound([s]);
      BattleEngagement.updateSoldier(s, b);
      const coveredAttemptsBefore = BattleEngagement.coveredBoundTelemetry(b).attempts;
      if (!coveredAttemptsBefore) throw Error('restart fixture did not consume a real bound order');
      const leaderlessBefore = b.factions.us.squads.filter(q => q._leaderlessIntent?.localValidity).length;
      if (!leaderlessBefore) throw Error('restart needs nonempty local validity');
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
        coveredAttemptsBefore,
        leaderlessBefore,
        localValidityCleared: ['us', 'ge'].every(f => b.factions[f].squads.every(q => !q._leaderlessIntent)),
        coveredBoundsCleared: BattleEngagement.coveredBoundTelemetry(b).attempts === 0,
        localTasksCleared: ['us', 'ge'].every(f => b.factions[f].squads.every(q => !q._localTask)),
        conflictsCleared: ['us', 'ge'].every(f =>
          b.factions[f].squads.every(q => !q._leases?.conflicts?.length)
        ),
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
    assert.equal(evidence.restart.conflictsCleared, true);
    assert.equal(evidence.restart.coveredBoundsCleared, true);
    assert.equal(evidence.restart.localTasksCleared, true);
    assert.equal(evidence.restart.localValidityCleared, true);
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
