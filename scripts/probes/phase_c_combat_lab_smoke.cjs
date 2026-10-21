'use strict';
/* Hosted preview smoke: real browser, real native BattleSim. No acceptance bypass or synthetic behavior. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

(async () => {
  const base = process.env.PHASE_C_LAB_URL ||
    'https://test.ivandpopov.com/grasstex/preview/phase-c-native-combat-lab/battle_sim.php';
  const out = 'reports/phase-c-lab';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });
  const errors = [];
  const failedRequests = [];
  const recentConsole = [];
  const results = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
    page.setDefaultTimeout(180000);
    page.on('pageerror', e => errors.push(e.message));
    page.on('requestfailed', request => {
      if (failedRequests.length < 50) failedRequests.push({ url: request.url(), error: request.failure() });
    });
    page.on('console', message => {
      if (recentConsole.length >= 80) recentConsole.shift();
      recentConsole.push(message.type() + ': ' + message.text().slice(0, 400));
    });
    page.on('console', message => {
      if (message.type() === 'error' && !/texture|audio|failed to load resource|fbx/i.test(message.text()))
        errors.push(message.text());
    });
    // Paired preset/range checks establish actual weapon and perception scaling.
    for (const [preset, rangeScale] of [['C', 0.5], ['F', 0.25], ['E', 1]]) {
      const mode = preset === 'E' ? 'autonomous' : 'purposeful';
      const params = new URLSearchParams({
        combatLab: '1', labPreset: preset, labRange: String(rangeScale),
        labMove: mode, defender: 'ge',
        seed: 'phase-c-natural-20261012-0015', localPlan: '1', localAmbush: '1',
        localManeuver: '1', coveredBounds: '1', fireCoverCycle: '1', squadReturnFire: '1'
      });
      // 50webs occasionally refuses a connection between consecutive preview page loads.
      // Retry only navigation-level transport failures, never a simulation assertion.
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          await page.goto(base + '?' + params.toString(), {
            waitUntil: 'domcontentloaded', timeout: 180000
          });
          break;
        } catch (error) {
          if (attempt === 4 || !/ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET|ERR_EMPTY_RESPONSE|ERR_TIMED_OUT/.test(String(error))) throw error;
          await new Promise(resolve => setTimeout(resolve, attempt * 1600));
        }
      }
      try {
        await page.waitForFunction(() =>
          !!(window.__battle__ && window.PhaseCCombatLab &&
            document.getElementById('phaseCLab') &&
            window.BattleDesktopCamera.current &&
            window.__battle__._roster.us.length === 20 &&
            window.__battle__._roster.ge.length === 20), null, { timeout: 75000 });
      } catch (e) {
        const boot = await page.evaluate(() => ({
          href: location.href, title: document.title,
          preview: window.BATTLE_PREVIEW || null,
          earlyFlag: window.PHASE_C_COMBAT_LAB || null,
          nativeWidth: window.BattleSim && BattleSim.FIELD_W,
          nativeDepth: window.BattleSim && BattleSim.FIELD_D,
          lab: !!window.PhaseCCombatLab, labPanel: !!document.getElementById('phaseCLab'),
          camera: window.BattleDesktopCamera && BattleDesktopCamera.current &&
            BattleDesktopCamera.current.camera && BattleDesktopCamera.current.camera.name,
          battle: window.__battle__ ? {
            time: window.__battle__.time,
            us: window.__battle__._roster.us.length,
            ge: window.__battle__._roster.ge.length
          } : null,
          loadError: document.getElementById('loadError') && document.getElementById('loadError').textContent,
          debug: document.getElementById('debugConsole') &&
            document.getElementById('debugConsole').textContent.slice(-10000),
          body: document.body && document.body.innerText.slice(0, 1500)
        }));
        const diag = { error: String(e), preset, boot, errors, failedRequests, recentConsole };
        fs.writeFileSync(out + '/failed-bootstrap-' + preset + '.json', JSON.stringify(diag, null, 2));
        try { await page.screenshot({ path: out + '/failed-bootstrap-' + preset + '.png' }); } catch (_) {}
        console.error('PHASE_C_LAB_BOOT_DIAG ' + JSON.stringify(diag));
        throw e;
      }
      // The battlefield is the default view: the controls must begin
      // collapsed and remain accessible on desktop and iPhone-sized screens.
      assert.equal(await page.locator('#phaseCLab').isHidden(), true,
        'lab drawer is default closed so it cannot obstruct the battlefield');
      assert.equal(await page.locator('#phaseCLabToggle').isVisible(), true,
        'collapsed lab has a visible controls launcher');
      assert.equal(await page.locator('#phaseCLabToggle').getAttribute('aria-expanded'), 'false');
      await page.locator('#phaseCLabToggle').click();
      assert.equal(await page.locator('#phaseCLab').isVisible(), true, 'launcher opens the real lab controls');
      assert.equal(await page.locator('#phaseCLabToggle').getAttribute('aria-expanded'), 'true');
      await page.locator('#labClose').click();
      assert.equal(await page.locator('#phaseCLab').isHidden(), true, 'close returns to the unobstructed field');
      if (preset === 'C') {
        await page.setViewportSize({ width: 390, height: 844 });
        assert.equal(await page.locator('#phaseCLabToggle').isVisible(), true,
          'mobile controls launcher remains visible');
        await page.screenshot({ path: out + '/mobile-lab-closed.png' });
        await page.locator('#phaseCLabToggle').click();
        const mobileDrawer = await page.locator('#phaseCLab').boundingBox();
        assert.ok(mobileDrawer && mobileDrawer.height <= 844 * 0.75,
          'mobile drawer must leave battlefield visible rather than covering the full screen');
        assert.ok(mobileDrawer.y >= 0 && mobileDrawer.y + mobileDrawer.height <= 844,
          'open mobile drawer stays inside the visual viewport');
        assert.equal(await page.locator('#labPlay').isVisible(), true,
          'the Play control remains available within the opened drawer');
        await page.screenshot({ path: out + '/mobile-lab-open.png' });
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#phaseCLab').isHidden(), true,
          'mobile drawer closes on Escape');
        await page.setViewportSize({ width: 1440, height: 900 });
      }
      const initial = await page.evaluate(() => {
        const b = window.__battle__, lab = window.PhaseCCombatLab;
        return { preset: lab.preset, fieldW: BattleSim.FIELD_W, fieldD: BattleSim.FIELD_D,
          us: b._roster.us.length, ge: b._roster.ge.length, paused: b.paused,
          camera: b.scene.activeCamera.name, preview: !!window.BATTLE_PREVIEW,
          seed: b.scene.metadata.battleScenario.seed,
          metadataSize: b.scene.metadata.battleScenario.map,
          rangeScale: lab.rangeScale,
          movementPace: lab.movementPace,
          movementSelected: document.querySelector('#labMove').value,
          rangeSelected: document.querySelector('#labRange').value,
          weapon: (() => {
            const soldier = b._roster.us[0];
            const reference = BattleWeapons.profileStats(soldier.weapon.kind, soldier.faction);
            return { kind: soldier.weapon.kind, actualRange: soldier.weapon.stats.range,
              baseRange: reference.range, actualFalloff: soldier.weapon.stats.falloffStart,
              baseFalloff: reference.falloffStart,
              actualAutoWithin: soldier.weapon.stats.autoWithin || 0,
              baseAutoWithin: reference.autoWithin || 0 };
          })(),
          vision: (() => {
            const soldier = b._roster.us[0], target = b._roster.ge[0];
            const actual = SquadAI.detectionRange(SquadAI.ROLES[soldier.role], target);
            const ref = SquadAI.ROLES[soldier.role].visionRange;
            return { actual, ref };
          })()
        };
      });
      assert.equal(initial.preset, preset, 'correct early native intervention');
      assert.equal(initial.movementPace, mode, 'early native gait gate');
      assert.equal(initial.movementSelected, mode, 'movement control is synchronized');
      assert.equal(initial.rangeScale, rangeScale, 'lab reads range scale before spawn');
      assert.equal(initial.rangeSelected, String(rangeScale), 'range dropdown remains in sync');
      assert.ok(Math.abs(initial.weapon.actualRange - initial.weapon.baseRange * rangeScale) < 1e-6,
        'issued native weapon range scales without mutating shared profile');
      assert.ok(Math.abs(initial.weapon.actualFalloff - initial.weapon.baseFalloff * rangeScale) < 1e-6,
        'weapon accuracy falloff starts at scaled range');
      if (initial.weapon.baseAutoWithin > 0)
        assert.ok(Math.abs(initial.weapon.actualAutoWithin - initial.weapon.baseAutoWithin * rangeScale) < 1e-6,
          'auto selector follows scaled engagement distance');
      assert.ok(initial.vision.actual > 0 && initial.vision.actual <= initial.vision.ref * 1.25 * rangeScale,
        'native visual detection respects range scale');
      assert.equal(initial.fieldW, 280, 'compact native geometry width');
      assert.equal(initial.fieldD, 240, 'compact native geometry depth');
      assert.equal(initial.metadataSize.width, 280);
      assert.equal(initial.metadataSize.depth, 240);
      assert.equal(initial.us, 20);
      assert.equal(initial.ge, 20);
      assert.equal(initial.paused, true);
      assert.match(initial.camera, /phase-c-overhead/);
      assert.equal(initial.preview, true);
      assert.equal(initial.seed, 'phase-c-natural-20261012-0015');
      const report = await page.evaluate(() => window.PhaseCCombatLab.snapshot());
      assert.equal(report.rangeScale, rangeScale, 'export preserves experimental range multiplier');
      assert.equal(report.movementPace, mode, 'export carries native gait A/B provenance');
      assert.equal(report.soldiers[0].weaponRange, initial.weapon.actualRange,
        'export includes actual scaled weapon reach');
      assert.equal(report.victoryRules.objectiveHold, false,
        'the lab export must record that objective-hold victory is disabled');
      assert.equal(report.victoryRules.elimination, true, 'elimination victory remains enabled');
      assert.ok(report.objectiveControl && typeof report.objectiveControl.us === 'number',
        'objective ownership continues to be tracked');
      const holdGate = await page.evaluate(() => {
        const b = window.__battle__;
        const objective = window.BattleObjectiveSystem;
        const previousTick = objective.tick;
        const savedHold = Object.assign({}, b.objectiveHold);
        const town = b.scene.metadata.battleScenario;
        const result = { disabled: window.PhaseCCombatLab.disableObjectiveVictory,
          limit: BattleCommanderAI.objectiveHoldWin, checks: [] };
        try {
          // Test the *real* Commander victory path with capture ticking held fixed.
          // The artificial timer values exist only in this smoke run; production
          // win logic and the battle's objective owner remain unchanged.
          objective.tick = () => b.objectiveControl;
          for (const side of ['us', 'ge']) {
            b.objectiveHold.us = side === 'us' ? result.limit + 60 : 0;
            b.objectiveHold.ge = side === 'ge' ? result.limit + 60 : 0;
            BattleCommanderAI.update(b, town, BattleCommanderAI.commandTick);
            result.checks.push({ side, winner: b.winner,
              hold: b.objectiveHold[side],
              ownership: b.objectiveControl.total });
          }
        } finally {
          objective.tick = previousTick;
          b.objectiveHold.us = savedHold.us;
          b.objectiveHold.ge = savedHold.ge;
        }
        return result;
      });
      assert.equal(holdGate.disabled, true, 'objective victory gate is installed in the preview');
      for (const check of holdGate.checks) {
        assert.ok(check.hold > holdGate.limit, 'test must exceed real objective hold win threshold');
        assert.equal(check.winner, null, 'holding every objective cannot finish the lab');
        assert.ok(check.ownership > 0, 'real objective model stays attached and visible');
      }
      const preCheck = await page.evaluate(() => {
        const b = window.__battle__, lab = window.PhaseCCombatLab;
        const ge = b._roster.ge[0], us = b._roster.us[0];
        const start = { x: ge.root.position.x, z: ge.root.position.z };
        const blocked = lab.blockShot(ge, b, 'smoke');
        const immortalGE = lab.preventWound(us, ge, b, { zone: 'chest' });
        const immortalUS = lab.preventWound(ge, us, b, { zone: 'chest' });
        b.resume();
        for (let i = 0; i < 8; i++) b.step(0.15);
        b.pause();
        const end = { x: ge.root.position.x, z: ge.root.position.z };
        return { blocked, immortalGE, immortalUS, start, end,
          shots: lab.snapshot().counts.shots, time: b.time };
      });
      assert.equal(preCheck.blocked, preset === 'C' || preset === 'F');
      assert.equal(preCheck.immortalGE, preset === 'F' || preset === 'E');
      assert.equal(preCheck.immortalUS, preset === 'E');
      if (preset === 'F') assert.deepEqual(preCheck.end, preCheck.start, 'German physically stationary');
      if (preset === 'C' || preset === 'F')
        assert.equal(preCheck.shots.ge, 0, 'no native German shot callback');
      if (preset === 'E') {
        // Read-only forensic sampling of REAL AI decisions in the small native battle.
        // Do not inject movement orders, bypass squad support, or rewrite stance.
        const causal = await page.evaluate(() => {
          const b = window.__battle__, out = {
            preset: window.PhaseCCombatLab.preset,
            totals: {}, byState: {}, byGoal: {}, reasons: {}, stillByState: {}, stillByGoal: {},
            samples: [], movingTicks: 0, crawlingTicks: 0,
            boundTicks: 0, boundSprintTicks: 0, boundCrouchRunTicks: 0,
            sprintTicks: 0, autonomousTicks: 0, autonomyReasons: {}, slowContactTransit: 0, time: 0
          };
          const add = (dst, label) => { dst[label] = (dst[label] || 0) + 1; };
          b.resume();
          for (let i = 0; i < 340 && !b.winner; i++) {
            b.step(0.15);
            for (const s of b._roster.us.concat(b._roster.ge)) {
              if (s.dead) continue;
              const state = s.eng && s.eng.state || 'none',
                goal = s._movementResolver && s._movementResolver.goal,
                kind = goal && goal.kind || 'none',
                gait = s._locomotionGait || 'unset',
                stance = s.prone ? (s.crawling ? 'crawl' : 'prone') : s.tacticalCrouch ? 'crouch' : 'stand',
                d = s.destination && Math.hypot(s.destination.x - s.root.position.x,
                  s.destination.z - s.root.position.z) || 0,
                bucket = s.moving ? 'moving' : 'stopped';
              add(out.totals, bucket + ':' + stance + ':' + gait);
              const autonomy = s._bodyAutonomyIntent;
              if (autonomy && s.moving) {
                out.autonomousTicks++;
                add(out.autonomyReasons, autonomy.reason + ':' + gait);
                if (['open-contact-transit', 'cautious-contact-transit'].includes(autonomy.reason) &&
                    !['run', 'sprint', 'crouchRun'].includes(gait))
                  out.slowContactTransit++;
              }
              if (s.moving) {
                out.movingTicks++;
                add(out.byState, state + ':' + gait);
                add(out.byGoal, kind + ':' + gait);
                if (gait === 'sprint') out.sprintTicks++;
                if (s.crawling) out.crawlingTicks++;
                if (state === 'bound') {
                  out.boundTicks++;
                  if (gait === 'sprint') out.boundSprintTicks++;
                  if (gait === 'crouchRun') out.boundCrouchRunTicks++;
                }
              } else {
                add(out.stillByState, state + ':' + stance);
                add(out.stillByGoal, kind + ':' + stance);
                if (d > 0.5) add(out.reasons, s._movementStopReason + ':' + stance + ':' + kind);
              }
              if (out.samples.length < 35 &&
                  ((s.crawling && s.moving) ||
                   (s.prone && !s.crawling && d > 0.5) ||
                   (state === 'bound' && s.moving))) {
                out.samples.push({
                  t: +b.time.toFixed(2), soldier: s.id, side: s.faction,
                  state, gait, stance, goal: kind, d: +d.toFixed(2),
                  speed: s.moveSpeed, suppressed: s.suppressedUntil > b.time,
                  fireControl: s.squad && s.squad.fireControl && s.squad.fireControl.state,
                  reason: s.eng && s.eng.transition && s.eng.transition.reason,
                  movementStop: s._movementStopReason,
                  posture: s.eng && s.eng.stanceTrail && s.eng.stanceTrail.length &&
                    s.eng.stanceTrail[s.eng.stanceTrail.length-1].reason
                });
              }
            }
          }
          b.pause();
          out.time = b.time;
          out.winner = b.winner;
          return out;
        });
        fs.writeFileSync(out + '/movement-causality.json', JSON.stringify(causal, null, 2));
        console.log('PHASE_C_MOVEMENT_CAUSALITY ' + JSON.stringify(causal));
        assert.ok(causal.boundTicks > 0, 'real contact produced native cover-bound movement');
        if (mode === 'autonomous') {
          assert.ok(causal.autonomousTicks > 0,
            'winning native movement orders must activate joint soldier stance/gait policy');
          assert.equal(causal.slowContactTransit, 0,
            'active open/cautious contact transit cannot move at a walk');
        }
        assert.ok(causal.boundSprintTicks > 0,
          'a true Engagement cover bound, not rage, must reach the sprint gait');
        assert.ok(causal.boundCrouchRunTicks > 0,
          'short/unsafe cover bounds must retain their lower-profile crouch-run alternative');
        assert.equal(causal.boundSprintTicks, causal.byGoal['cover-bound:sprint'] || 0,
          'sprinting bound ticks must be actual cover movement intents');
      }
      const ui = await page.locator('#labStatus').textContent();
      assert.match(ui, /US squads/i);
      await page.screenshot({ path: out + '/native-' + preset + '.png', fullPage: false });
      results.push({ ...initial, ...preCheck, uiPresent: true });
    }
    assert.deepEqual(errors, [], 'no browser page or console errors');
    fs.writeFileSync(out + '/smoke-result.json', JSON.stringify({ results, errors }, null, 2));
    console.log('PASS native compact lab three-preset browser smoke: ' + JSON.stringify(results));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
