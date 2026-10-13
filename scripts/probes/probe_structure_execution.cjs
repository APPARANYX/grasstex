'use strict';
/* Staged scenario, autonomous own soldiers: poses are set only at scenario setup.
   Every subsequent own movement/facing/contact/route transition uses shipping owners.
   A stationary hostile is introduced as an explicit scenario event, never as AI knowledge. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { requestPreview } = require('./preview_request.cjs');
(async () => {
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });
  const dir = 'closeups/tactical-observation';
  fs.mkdirSync(dir, { recursive: true });
  const evidence = {
    fixture:
      'staged single ground-floor footprint on real terrain; autonomous own soldiers; stationary hostile scenario event; no multiroom clearance claim',
    stages: []
  };
  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1440, height: 960 }
    });
    const response = await requestPreview(context, process.env.TACTICAL_PREVIEW);
    assert.equal(response.status(), 302);
    const url = new URL(response.headers().location, process.env.TACTICAL_PREVIEW);
    assert.ok(
      url.pathname.includes('ref-' + process.env.TACTICAL_SHA.slice(0, 12)),
      'exact final-head preview'
    );
    url.searchParams.set('seed', 'phase-c-building-security');
    for (const flag of [
      'localPlan',
      'localTasks',
      'localStructures',
      'localEntry',
      'localEntryGate',
      'localSurvey',
      'localWatch',
      'localContactResume',
      'localContinuity',
      'localStructureOrders'
    ])
      url.searchParams.set(flag, '1');
    const page = await context.newPage();
    const errors = [],
      networkFailures = [];
    page.on('pageerror', e => errors.push(String(e)));
    /* Preserve the strict browser error gate and record the REQUEST origin
       of intermittent unhandled fetch errors during the staged door crossing.
       This observer never changes the game or simulates recovered responses. */
    page.on('requestfailed', request => {
      if (networkFailures.length < 64)
        networkFailures.push({
          url: request.url().split('?')[0],
          resource: request.resourceType(),
          method: request.method(),
          failure: request.failure()?.errorText || 'requestfailed'
        });
    });
    page.on('response', response => {
      if (response.status() >= 500 && networkFailures.length < 64)
        networkFailures.push({
          url: response.url().split('?')[0],
          resource: response.request().resourceType(),
          method: response.request().method(),
          status: response.status()
        });
    });
    await page.goto(url.href, { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction(
      () => window.__battle__?.factions && window.BattleSquadStability?.localPlan?.structureOrdersOn,
      null,
      { timeout: 180000 }
    );
    await page.locator('#startBtn').click();
    evidence.setup = await page.evaluate(() => {
      const b = __battle__,
        N = BattleNavigation,
        A = SquadAI;
      b.pause();
      b.restart(); // exact seeded zero-time start, independent of preview/render warmup
      b.pause();
      b._trainerStepActive = true;
      const scene = b.scene.metadata.battleScenario || b.scene.metadata.battleTown;
      const door = N.doorPortals.find(p => {
        const house = scene.buildings.find(h => h.id === p.building);
        return (
          house &&
          house.w >= 8 &&
          house.w <= 24 &&
          house.d >= 8 &&
          house.d <= 24 &&
          N.movementClear(p.inside, house)
        );
      });
      if (!door) throw Error('staged real doorway unavailable');
      const house = scene.buildings.find(h => h.id === door.building),
        q = b.factions.us.squads.find(q => A.leaderOf(q)),
        hostile = b._roster.ge.find(s => !s.dead),
        reserve = b._roster.ge.find(s => !s.dead && s !== hostile),
        reservePosition = reserve && { x: reserve.root.position.x, z: reserve.root.position.z };
      if (!q || !hostile || !reserve) throw Error('native scenario actors missing');
      const dx = door.inside.x - door.outside.x,
        dz = door.inside.z - door.outside.z,
        len = Math.hypot(dx, dz),
        rear = { x: door.outside.x - (dx / len) * 10, z: door.outside.z - (dz / len) * 10 };
      // Scenario setup only. No own position/rotation writer is used after this.
      for (const f of ['us', 'ge'])
        for (const s of b._roster[f]) {
          BattleMovementResolver.resetSoldier(s);
          BattleNavigation.invalidateNavPath(s);
          s.destination = null;
          s.orderDestination = null;
          s._fireteamDestination = null;
          s.moving = false;
          s.moveSpeed = 0;
          if (s.squad !== q) {
            s.root.position.set(
              house.x + 700 + s.id * 2,
              b.heightAt(house.x + 700 + s.id * 2, house.z + 700),
              house.z + 700
            );
            s.isPlayer = true; // stationary, nonparticipating scenario actors
          }
        }
      q.members.forEach((s, i) => {
        const x = rear.x - (dz / len) * ((i % 5) - 2) * 2.2 - (dx / len) * Math.floor(i / 5) * 2.2,
          z = rear.z + (dx / len) * ((i % 5) - 2) * 2.2 - (dz / len) * Math.floor(i / 5) * 2.2;
        s.root.position.set(x, b.heightAt(x, z), z);
        s.root.rotation.y = Math.atan2(dx, dz);
        s.isPlayer = false;
      });
      // Reduce the simulation roster to the declared staged scenario. Keep a
      // remote stationary reserve so killing the interior actor does not end
      // the battle before the real quiet-plan/reassessment lifecycle can run.
      const opposition = hostile.squad;
      opposition.members = [hostile, reserve];
      opposition.originalCount = 2;
      reserve.squad = opposition;
      reserve.root.position.set(
        reservePosition.x,
        b.heightAt(reservePosition.x, reservePosition.z),
        reservePosition.z
      );
      b._roster.us = q.members;
      b._roster.ge = opposition.members;
      b._moduleUnits = b._roster.us.concat(b._roster.ge);
      b.factions.us.squads = [q];
      b.factions.ge.squads = [opposition];
      b.factions.us.alive = q.members.filter(s => !s.dead).length;
      b.factions.ge.alive = 2;
      BattleSquadStability.localPlan.reset(q);
      BattleLeases.clear(q);
      q._missionExecution = null;
      q._engagementPlan = null;
      q.inContact = false;
      const average = q.members.reduce(
        (p, s) => ({
          x: p.x + s.root.position.x / q.members.length,
          z: p.z + s.root.position.z / q.members.length
        }),
        { x: 0, z: 0 }
      );
      _commanderRecoveryCtx().issueMission(
        b,
        q,
        {
          intent: 'capture',
          action: 'assault',
          role: 'assault',
          point: { x: rear.x - (dx / len) * 35, z: rear.z - (dz / len) * 35 },
          route: [average, { x: house.x, z: house.z }]
        },
        'staged structure-security acceptance'
      );
      BattleCommanderAI.setMacroEnabled(b, false); // freeze the General's issued scenario intent
      BattleSquadStability.publishAnchor(q, average);
      BattleSquadStability.executeMission(b, q, scene);
      SquadAI.updateSquad(q, b);
      for (const f of ['us', 'ge'])
        for (const s of b._roster[f]) {
          if (!s.destination)
            SquadAI.setDestination(s, { x: s.root.position.x, z: s.root.position.z }, b, true);
          BattleMovementResolver.resolve(s, b);
          if (!s.destination) throw Error('staged initial destination unavailable: ' + s.id);
        }
      b.timeLimit = 600;
      b.manualEnded = false;
      b.winner = null;
      b._structureProbe = { q, hostile, house, door, scene, commandAccum: 0, introduced: false, ownShots: 0 };
      const fire = b.onFire;
      b.onFire = function (s) {
        if (s.squad === q) b._structureProbe.ownShots++;
        if (fire) fire.apply(this, arguments);
      };
      return {
        buildingId: house.id,
        doorwayId: door.id,
        missionVersion: q._macroMission.version,
        navigationVersion: N.version,
        leaderId: A.leaderOf(q).id,
        members: q.members.map(s => s.id),
        time: b.time,
        source: BATTLE_BUILD
      };
    });
    async function capture(name, state) {
      await page.evaluate(
        ({ name, state }) => {
          const b = __battle__,
            h = b._structureProbe.house,
            camera = b.scene.activeCamera;
          const target = new BABYLON.Vector3(h.x, b.heightAt(h.x, h.z) + 0.8, h.z),
            eye = new BABYLON.Vector3(h.x + 19, b.heightAt(h.x, h.z) + 24, h.z - 24);
          camera.setTarget(target);
          if (camera.setPosition) camera.setPosition(eye);
          else camera.position.copyFrom(eye);
          let panel = document.getElementById('structureEvidence');
          if (!panel) {
            panel = document.createElement('pre');
            panel.id = 'structureEvidence';
            Object.assign(panel.style, {
              position: 'fixed',
              right: '16px',
              top: '16px',
              color: '#fff',
              background: '#111d',
              padding: '14px',
              font: '15px monospace',
              zIndex: 10000,
              whiteSpace: 'pre-wrap'
            });
            document.body.appendChild(panel);
          }
          panel.textContent = [
            name,
            'Staged scenario · autonomous US soldiers',
            `${state.buildingId} / ${state.doorwayId}`,
            `t=${state.time.toFixed(2)} · leader=${state.leaderId}`,
            `mission=${state.missionVersion} · route leg=${state.routeIndex}`,
            `shots=${state.ownShots} · contact=${state.inContact}`,
            `survey=${state.survey?.observedSectors || 0}/4 · watch=${!!state.watch?.ready}`,
            `presence=${state.presence?.provenance || 'physical entry pending'}`,
            'Ground-floor observation/security; clearance not asserted'
          ].join('\n');
        },
        { name, state }
      );
      await page.waitForTimeout(180);
      await page.screenshot({ path: `${dir}/structure-${name}.png` });
      evidence.stages.push({ name, ...state, screenshot: `structure-${name}.png` });
    }
    const captured = new Set();
    for (let batch = 0; batch < 600; batch++) {
      const state = await page.evaluate(() => {
        const b = __battle__,
          p = b._structureProbe,
          q = p.q;
        b.paused = false;
        try {
          b.step(0.15);
          p.commandAccum += 0.15;
          while (p.commandAccum + 1e-9 >= 0.45 && !b.winner) {
            p.commandAccum -= 0.45;
            BattleCommanderAI.update(b, p.scene, 0.45);
          }
        } finally {
          b.paused = true;
        }
        const st = q._localTask?.inputs.execution?.structure,
          mode = q._localTask?.inputs.structureExecution?.stage;
        if (st?.survey.complete && !p.introduced && q.routeIndex === 1) {
          // Explicit hostile-entry scenario event. Own AI must discover it via Perception.
          p.hostile.root.position.set(p.house.x, b.heightAt(p.house.x, p.house.z), p.house.z);
          BattleMovementResolver.resetSoldier(p.hostile);
          BattleMovementResolver.proposePlayer(p.hostile, p.hostile.root.position, b, 1);
          BattleMovementResolver.resolve(p.hostile, b);
          p.introduced = true;
          p.introducedAt = b.time;
        }
        return {
          time: b.time,
          buildingId: p.house.id,
          doorwayId: p.door.id,
          leaderId: SquadAI.leaderOf(q)?.id,
          missionVersion: q._macroMission?.version,
          navigationVersion: BattleNavigation.version,
          routeIndex: q.routeIndex,
          mode,
          inContact: q.inContact,
          engagementPlan: q._engagementPlan?.status,
          ownShots: p.ownShots,
          hostileIntroduced: p.introduced,
          hostileDead: p.hostile.dead || p.hostile.hp <= 0,
          entry: st?.entryEvidence,
          presence: st?.presenceEvidence,
          survey: st?.survey,
          watch: st?.watch,
          members: q.members.map(s => ({
            id: s.id,
            x: s.root.position.x,
            z: s.root.position.z,
            yaw: s.root.rotation.y,
            dead: s.dead,
            state: s.eng?.state,
            target: s.target?.id,
            order: s._fireteamPublishKey
          }))
        };
      });
      evidence.last = state;
      let name = null;
      if (state.mode === 'approach-door' && !captured.has('approach')) name = 'approach';
      else if (state.entry?.entryVerified && !captured.has('doorway-crossing')) name = 'doorway-crossing';
      else if (state.survey?.complete && !captured.has('interior-observation')) name = 'interior-observation';
      else if (state.inContact && state.ownShots > 0 && !captured.has('hostile-response'))
        name = 'hostile-response';
      else if (
        state.presence?.presenceVerified &&
        !state.inContact &&
        !captured.has('post-contact-reassessment')
      )
        name = 'post-contact-reassessment';
      else if (state.watch?.ready && !captured.has('security-posts')) name = 'security-posts';
      else if (state.routeIndex === 2 && !captured.has('mission-handback')) name = 'mission-handback';
      if (name) {
        captured.add(name);
        await capture(name, state);
      }
      if (captured.has('mission-handback')) break;
      if (batch % 60 === 0) console.log('structure stage', JSON.stringify(state));
    }
    evidence.runtime = await page.evaluate(() => BattleSquadStability.localPlan.summary(__battle__));
    evidence.errors = errors;
    evidence.networkFailures = networkFailures;
    if (errors.length) console.error('STRUCTURE_PAGE_ERRORS', JSON.stringify({ errors, networkFailures }));
    fs.writeFileSync(`${dir}/structure-report.json`, JSON.stringify(evidence, null, 2));
    for (const name of [
      'approach',
      'doorway-crossing',
      'interior-observation',
      'hostile-response',
      'post-contact-reassessment',
      'security-posts',
      'mission-handback'
    ])
      assert.ok(captured.has(name), `actual staged gameplay missing ${name}`);
    assert.equal(evidence.last.missionVersion, evidence.setup.missionVersion);
    assert.equal(evidence.last.leaderId, evidence.setup.leaderId);
    assert.ok(evidence.last.ownShots > 0);
    assert.equal(evidence.runtime.structures.physicalEntries, 1);
    assert.equal(
      evidence.runtime.structures.routeHandbacks,
      1,
      'actual owner handback is recorded on the accepting tick'
    );
    assert.deepEqual(errors, []);
    console.log('PASS staged autonomous building execution', JSON.stringify(evidence));
  } finally {
    fs.writeFileSync(`${dir}/structure-report.json`, JSON.stringify(evidence, null, 2));
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
