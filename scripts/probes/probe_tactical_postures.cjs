'use strict';
/* Real preview terrain/LOS and native own AI after explicit scenario setup.
   No synthetic cover, enemy-transform tactical input or posed follow-up frames. */
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
    fixture: 'staged reported approach on actual preview terrain; autonomous US soldiers; stationary hostile',
    stages: [],
    shots: []
  };
  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1440, height: 960 }
    });
    const res = await requestPreview(context, process.env.TACTICAL_PREVIEW);
    assert.equal(res.status(), 302);
    const url = new URL(res.headers().location, process.env.TACTICAL_PREVIEW);
    assert.ok(url.pathname.includes('ref-' + process.env.TACTICAL_SHA.slice(0, 12)));
    url.searchParams.set('seed', 'phase-c-masked-ambush');
    url.searchParams.set('localPlan', '1');
    url.searchParams.set('localAmbush', '1');
    const page = await context.newPage(),
      errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(url.href, { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction(
      () => window.__battle__?.factions && window.BattleSquadStability?.tacticalPostures?.on,
      null,
      { timeout: 180000 }
    );
    await page.locator('#startBtn').click();
    evidence.setup = await page.evaluate(() => {
      const b = __battle__;
      b.pause();
      b.restart();
      b.pause();
      b._trainerStepActive = true;
      const A = SquadAI,
        N = BattleNavigation,
        P = BattleSquadStability.tacticalPostures,
        scene = b.scene.metadata.battleScenario || b.scene.metadata.battleTown,
        q = b.factions.us.squads.find(q => A.leaderOf(q)),
        hostile = b._roster.ge[0],
        reserve = b._roster.ge[1];
      // Locate actual low-masked/high-visible posts. This chooses fixture geometry,
      // never changes terrain/obstacles or grants AI a hidden enemy transform.
      let selected = null,
        attempts = 0;
      search: for (let z = -450; z <= 450; z += 45)
        for (let x = -850; x <= 850; x += 45)
          for (const theta of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
            const dx = Math.sin(theta),
              dz = Math.cos(theta),
              threat = { x: x + dx * 60, z: z + dz * 60, at: 0, confidence: 0.9 },
              posts = [];
            if (!N.movementClear(threat, threat)) continue;
            for (let rear = 0; rear <= 9; rear += 3)
              for (let side = -18; side <= 18; side += 3) {
                const p = { x: x - dz * side - dx * rear, z: z + dx * side - dz * rear };
                attempts++;
                if (
                  BattleCoverPositions.maskedPost(b, p, [threat]) &&
                  posts.every(o => Math.hypot(o.x - p.x, o.z - p.z) >= 2)
                )
                  posts.push(p);
                if (posts.length >= q.members.length) {
                  selected = { threat, posts, dx, dz };
                  break search;
                }
              }
          }
      if (!selected) throw Error('no real masked firing-line fixture found: ' + attempts);
      for (const s of b._roster.us.concat(b._roster.ge)) {
        BattleMovementResolver.resetSoldier(s);
        N.invalidateNavPath(s);
        s.destination = null;
        s.orderDestination = null;
        s._fireteamDestination = null;
        s.moving = false;
        s.moveSpeed = 0;
        if (s.squad !== q) {
          s.isPlayer = true;
          s.root.position.set(900 + s.id * 2, b.heightAt(900 + s.id * 2, 550), 550);
        }
      }
      q.members.forEach((s, i) => {
        const p = selected.posts[i];
        s.root.position.set(p.x, b.heightAt(p.x, p.z), p.z);
        s.root.rotation.y = Math.atan2(selected.dx, selected.dz);
        s.isPlayer = false;
      });
      hostile.root.position.set(
        selected.threat.x,
        b.heightAt(selected.threat.x, selected.threat.z),
        selected.threat.z
      );
      const opposition = hostile.squad;
      opposition.members = [hostile, reserve];
      opposition.originalCount = 2;
      reserve.squad = opposition;
      b._roster.us = q.members;
      b._roster.ge = opposition.members;
      b._moduleUnits = b._roster.us.concat(b._roster.ge);
      b.factions.us.squads = [q];
      b.factions.ge.squads = [opposition];
      b.factions.us.alive = q.members.length;
      b.factions.ge.alive = 2;
      BattleLeases.clear(q);
      BattleSquadStability.localPlan.reset(q);
      P.reset(q);
      q._missionExecution = null;
      q._engagementPlan = null;
      q.inContact = false;
      const average = q.members.reduce(
          (p, s) => ({
            x: p.x + s.root.position.x / q.members.length,
            z: p.z + s.root.position.z / q.members.length
          }),
          { x: 0, z: 0 }
        ),
        destination = { x: average.x + selected.dx * 100, z: average.z + selected.dz * 100 };
      _commanderRecoveryCtx().issueMission(
        b,
        q,
        {
          intent: 'capture',
          action: 'assault',
          role: 'assault',
          point: destination,
          route: [average, destination]
        },
        'staged masked ambush acceptance'
      );
      BattleCommanderAI.setMacroEnabled(b, false);
      BattleSquadStability.publishAnchor(q, average);
      BattleSquadStability.executeMission(b, q, scene);
      A.rememberReportedContact(A.leaderOf(q), b, {
        ...selected.threat,
        observedAt: b.time,
        sourceId: 'staged-friendly-witness',
        targetId: String(hostile.id),
        otherFaction: 'ge',
        reportId: 'staged-approach'
      });
      BattleSquadStability.localPlan.update(b, q);
      if (!P.update(b, q)) throw Error('native posture rejected real line');
      A.updateSquad(q, b);
      for (const s of b._moduleUnits) {
        if (!s.destination) A.setDestination(s, { x: s.root.position.x, z: s.root.position.z }, b, true);
        BattleMovementResolver.resolve(s, b);
      }
      b.timeLimit = 600;
      b.manualEnded = false;
      b.winner = null;
      b._postureProbe = { q, scene, selected, average, commandAccum: 0, ownShots: 0 };
      const fire = b.onFire;
      b.onFire = function (s) {
        if (s.squad === q) {
          b._postureProbe.ownShots++;
          const posture = P.current(b, q);
          b._postureProbe.lastShot = {
            at: b.time,
            shooterId: s.id,
            stage: posture && posture.stage,
            readyAt: posture && posture.readyAt,
            incoming: BattleEngagement.underFireNow(s, b),
            fireControl: q.fireControl && q.fireControl.state
          };
        }
        if (fire) fire.apply(this, arguments);
      };
      return {
        time: b.time,
        missionVersion: q._macroMission.version,
        routeIndex: q.routeIndex,
        leaderId: A.leaderOf(q).id,
        navigationVersion: N.version,
        source: BATTLE_BUILD,
        attempts,
        posts: selected.posts,
        reported: selected.threat
      };
    });
    const captured = new Set();
    let holdAt = null;
    let verifiedPreparedAt = null;
    for (let tick = 0; tick < 140; tick++) {
      const st = await page.evaluate(() => {
        const b = __battle__,
          p = b._postureProbe;
        b.paused = false;
        try {
          b.step(0.15);
          p.commandAccum += 0.15;
          if (p.commandAccum >= 0.45) {
            p.commandAccum -= 0.45;
            BattleCommanderAI.update(b, p.scene, 0.45);
          }
        } finally {
          b.paused = true;
        }
        const q = p.q,
          st = BattleSquadStability.tacticalPostures.current(b, q);
        return {
          time: b.time,
          mode: st?.mode,
          stage: st?.stage,
          heldSince: st?.heldSince,
          readyAt: st?.readyAt,
          ownShots: p.ownShots,
          lastShot: p.lastShot || null,
          fireControl: q.fireControl?.state,
          missionVersion: q._macroMission?.version,
          routeIndex: q.routeIndex,
          leaderId: SquadAI.leaderOf(q)?.id,
          men: q.members.map(s => ({
            id: s.id,
            position: { x: s.root.position.x, y: s.root.position.y, z: s.root.position.z },
            moving: s.moving,
            crouching: s.crouching,
            prone: s.prone,
            targetId: s.target?.id,
            engagement: s.eng?.state,
            key: s._fireteamPublishKey
          })),
          metrics: BattleSquadStability.localPlanTelemetry(b).postures
        };
      });
      if (st.stage === 'hold' && holdAt == null) holdAt = st.time;
      if (st.readyAt != null && st.heldSince != null && st.readyAt - st.heldSince >= 4 - 1e-6)
        verifiedPreparedAt = st.readyAt;
      if (st.lastShot && !evidence.shots.some(e => e.at === st.lastShot.at))
        evidence.shots.push(st.lastShot);
      evidence.last = st;
      /* A prepared posture can be released after contact ends. An autonomous
         rifleman's later shot has no CURRENT posture.readyAt, but is not a
         premature ambush volley: keep the verified readiness timestamp from
         the earlier per-tick snapshots, never manufacture it after a shot. */
      const shotAfterPreparation = !!(
        st.lastShot &&
        ((st.lastShot.readyAt != null && st.lastShot.at >= st.lastShot.readyAt) ||
          (verifiedPreparedAt != null && st.lastShot.at >= verifiedPreparedAt))
      );
      assert.ok(
        st.ownShots === 0 || shotAfterPreparation,
        'no premature round before real four-second ambush preparation'
      );
      const stages = [];
      if (st.stage === 'hold' && st.time >= 1) stages.push('masked-hold');
      // The native posture can enter 'contact' on the same tick it becomes
      // ready; readiness itself, while the guns remain silent, is the frame.
      if (st.readyAt != null && st.ownShots === 0) stages.push('prepared-line');
      if (st.ownShots > 0 && shotAfterPreparation) stages.push('first-contact-volley');
      for (const name of stages)
        if (!captured.has(name)) {
          await page.evaluate(
            ({ name, st }) => {
              const b = __battle__,
                p = b._postureProbe,
                a = p.average,
                cam = b.scene.activeCamera;
              cam.setTarget(new BABYLON.Vector3(a.x, b.heightAt(a.x, a.z) + 1, a.z));
              const eye = new BABYLON.Vector3(
                a.x - p.selected.dx * 18 + p.selected.dz * 15,
                b.heightAt(a.x, a.z) + 17,
                a.z - p.selected.dz * 18 - p.selected.dx * 15
              );
              // Some battle cameras are FreeCamera instances with no setPosition().
              if (typeof cam.setPosition === 'function') cam.setPosition(eye);
              else cam.position.copyFrom(eye);
              let panel = document.getElementById('postureEvidence');
              if (!panel) {
                panel = document.createElement('pre');
                panel.id = 'postureEvidence';
                Object.assign(panel.style, {
                  position: 'fixed',
                  right: '16px',
                  top: '16px',
                  color: 'white',
                  background: '#111d',
                  padding: '14px',
                  font: '16px monospace',
                  zIndex: 10000
                });
                document.body.appendChild(panel);
              }
              panel.textContent = [
                name,
                'Real terrain · autonomous US AI',
                `t=${st.time.toFixed(2)} · leader=${st.leaderId}`,
                `mode=${st.mode}/${st.stage} · fire=${st.fireControl}`,
                `shots=${st.ownShots} · route=${st.routeIndex}`,
                'Crouched masking + standing ray verified'
              ].join('\n');
            },
            { name, st }
          );
          await page.waitForTimeout(180);
          await page.screenshot({ path: `${dir}/ambush-${name}.png` });
          captured.add(name);
          evidence.stages.push({ name, ...st });
        }
      if (captured.size === 3) break;
    }
    evidence.errors = errors;
    assert.deepEqual(errors, []);
    assert.equal(captured.size, 3, 'all real gameplay stages captured');
    const volley = evidence.stages.find(s => s.name === 'first-contact-volley');
    assert.ok(volley.time - holdAt >= 4);
    assert.equal(volley.missionVersion, evidence.setup.missionVersion);
    assert.equal(volley.routeIndex, evidence.setup.routeIndex);
    assert.ok(
      volley.men.some(s => s.targetId != null),
      'personal contact, not report-only firing'
    );
    console.log('PASS actual-terrain coordinated ambush', JSON.stringify(evidence));
  } finally {
    fs.writeFileSync(`${dir}/ambush-report.json`, JSON.stringify(evidence, null, 2));
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
