#!/usr/bin/env node
'use strict';
// One live meeting after the native lab preflight; no staged casualties or tactical writes.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });
  try {
    const page = await browser.newPage({ ignoreHTTPSErrors: true });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    const flags = {
      combatLab: '1',
      balancedMeeting: '1',
      labPreset: 'A',
      labRange: '1',
      tacticalController: 'new',
      seed: 'mini-meeting-676-001',
      pinSeed: '1',
      meetingStartHalf: '1',
      projectileFlight: '1',
      firstContactResponse: '0',
      combatAccuracy: '0',
      combatTempo: '1'
    };
    await page.goto(
      (process.env.MINI_MEETING_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php') +
        '?' +
        new URLSearchParams(flags),
      { waitUntil: 'domcontentloaded', timeout: 120000 }
    );
    await page.waitForFunction(() => window.__battle__ && window.PhaseCCombatLab?.snapshot(), null, {
      timeout: 120000
    });
    await page.addScriptTag({ path: 'scripts/probes/covered-maneuver-observer.js' });
    const data = await page.evaluate(() => {
      const b = __battle__,
        sc = b.scene.metadata.battleScenario;
      b.scene.getEngine().stopRenderLoop(window.__battleRenderLoop__);
      b.pause();
      const trace = installCoveredManeuverObserver(b),
        shots = { us: 0, ge: 0 },
        support = { us: 0, ge: 0 },
        killedMoving = [];
      const seenDead = new Set(),
        samples = [];
      let awaitingManSeconds = 0,
        commandTime = 0;
      const fire = b.onFire;
      b.onFire = function (s) {
        if (s) {
          shots[s.faction]++;
          if (s.squad.members.some(m => m !== s && m.moving && m.eng?.state === 'bound'))
            support[s.faction]++;
        }
        if (fire) return fire.apply(this, arguments);
      };
      b.paused = false;
      for (let i = 0; i < 1400 && !b.winner; i++) {
        const before = new Map(b._roster.us.concat(b._roster.ge).map(s => [s, !!s.moving]));
        b._trainerStepActive = true;
        try {
          b.step(0.15);
        } finally {
          b._trainerStepActive = false;
        }
        commandTime += 0.15;
        while (commandTime >= 0.45 - 1e-9 && !b.winner) {
          commandTime -= 0.45;
          BattleCommanderAI.update(b, sc, 0.45);
        }
        for (const s of before.keys()) {
          if (s.dead && !seenDead.has(s)) {
            seenDead.add(s);
            if (before.get(s)) killedMoving.push({ at: b.time, id: s.id, faction: s.faction });
          }
        }
        for (const a of BattleTacticalController.summary(b).live || [])
          if (a.capability === 'combat.bound' && a.stage === 'published') awaitingManSeconds += 0.15;
        if (i % 30 === 0)
          samples.push({
            at: b.time,
            alive: { us: b.factions.us.alive, ge: b.factions.ge.alive },
            maneuvers: ['us', 'ge'].flatMap(f =>
              b.factions[f].squads.map(s => ({ squad: s.id, ...BattleTacticalCoveredManeuver.summary(s) }))
            )
          });
      }
      b.pause();
      return {
        trace,
        shots,
        support,
        killedMoving,
        awaitingManSeconds,
        time: b.time,
        winner: b.winner,
        meeting: b._sides?.meeting,
        contactResponse: !!BattleCombatUrgency.firstContactResponseOn,
        controller: BattleTacticalController.summary(b),
        conflicts: BattleOrderProvenance.conflicts(b),
        grenades: BattleGrenades.summary(b),
        samples
      };
    });
    const out = 'reports/covered-meeting';
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(out + '/meeting.json', JSON.stringify({ flags, errors, ...data }, null, 2));
    assert.equal(data.meeting, true);
    assert.equal(data.contactResponse, false);
    assert.equal(data.controller.stats.faults, 0);
    assert.ok(data.shots.us > 0 && data.shots.ge > 0, 'both live factions fire');
    console.log(
      'COVERED_MEETING',
      JSON.stringify({
        shots: data.shots,
        support: data.support,
        time: data.time,
        attempts: data.trace.attempts.length,
        accepted: data.trace.attempts.filter(a => a.accepted).length,
        arrived: data.trace.attempts.filter(a => a.end?.arrived).length,
        killedMoving: data.killedMoving.length,
        conflicts: data.conflicts.length,
        grenades: data.grenades
      })
    );
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
