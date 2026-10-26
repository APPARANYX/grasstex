#!/usr/bin/env node
'use strict';
// Native mini-map meeting: balanced forces, lethal combat, no AI orders injected.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const BASE = process.env.MINI_MEETING_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SEEDS = (process.env.MINI_MEETING_SEEDS || 'mini-meeting-676-001,mini-meeting-676-002').split(',');
const SECONDS = Number(process.env.MINI_MEETING_SECONDS || 210);
const DIR = 'reports/mini-meeting';
fs.mkdirSync(DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, args: [
    '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'
  ] });
  const results = [];
  try {
    for (const seed of SEEDS) {
      const page = await browser.newPage({ ignoreHTTPSErrors: true });
      page.setDefaultTimeout(120000);
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('console', m => {
        if (m.type() === 'error' && !/texture|audio|\.png|\.mp3|failed to load resource/i.test(m.text()))
          errors.push(m.text());
      });
      await page.route('**/*', route =>
        ['media', 'font'].includes(route.request().resourceType()) ? route.abort() : route.continue());
      const params = new URLSearchParams({
        combatLab: '1', balancedMeeting: '1', labPreset: 'A', labRange: '1',
        tacticalController: 'new', seed, pinSeed: '1'
      });
      await page.goto(BASE + '?' + params, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForFunction(() => !!(window.__battle__ && window.BattleTacticalController &&
        window.PhaseCCombatLab?.snapshot()), null, { timeout: 120000 });
      const data = await page.evaluate(({ seconds }) => {
        const root = window, b = root.__battle__, sc = b.scene.metadata.battleScenario;
        const engine = b.scene?.getEngine?.();
        if (engine && root.__battleRenderLoop__) engine.stopRenderLoop(root.__battleRenderLoop__);
        b.pause();
        const footprints = b.obstacles?.__physicalFootprints || [];
        const initialCover = {
          buildings: sc.buildings?.length || 0,
          tacticalObstacles: b.obstacles?.length || 0,
          physicalFootprints: footprints.length,
          hedgeVolumes: footprints.filter(f => f.type === 'hedge').length,
          wallVolumes: footprints.filter(f => f.type === 'wall').length,
          trees: footprints.filter(f => f.type === 'tree').length
        };
        const initialSquads = { us: b.factions.us.squads.length, ge: b.factions.ge.squads.length };
        const initialSoldiers = { us: b._roster.us.length, ge: b._roster.ge.length };
        const start = new Map();
        for (const f of ['us', 'ge']) for (const s of b._roster[f])
          start.set(s.id, { x: s.root.position.x, z: s.root.position.z });
        const shots = { us: 0, ge: 0 }, supporting = { us: 0, ge: 0 }, records = [];
        const oldFire = b.onFire;
        b.onFire = function(s) {
          if (s && s.faction in shots) {
            shots[s.faction]++;
            if (s.squad?.members?.some(m => m !== s && m.moving &&
              root.BattleEngagement?.stateOf?.(m)?.boundOrder)) supporting[s.faction]++;
          }
          if (oldFire) return oldFire.apply(this, arguments);
        };
        const sample = () => {
          const out = { t: +b.time.toFixed(2), shots: { ...shots },
            supportShots: { ...supporting },
            alive: { us: b.factions.us.alive, ge: b.factions.ge.alive },
            moved5m: { us: 0, ge: 0 }, totalDisplacementM: { us: 0, ge: 0 },
            contactSquads: { us: 0, ge: 0 }, maneuvers: { us: [], ge: [] },
            controller: root.BattleTacticalController.summary(b),
            grenade: root.BattleGrenades?.summary?.(b) || null,
            reinforcements: root.BattleMiniMeetingReinforcements?.summary?.(b) || null,
            cumulativeUnits: { us: b._roster.us.length, ge: b._roster.ge.length },
            writerConflicts: root.BattleOrderProvenance?.conflicts?.(b)?.length || 0
          };
          for (const f of ['us','ge']) {
            for (const s of b._roster[f]) {
              let a = start.get(s.id);
              if (!a) { a = { x: s.root.position.x, z: s.root.position.z }; start.set(s.id, a); }
              const d = Math.hypot(s.root.position.x - a.x, s.root.position.z - a.z);
              if (d >= 5) out.moved5m[f]++;
              out.totalDisplacementM[f] += d;
            }
            for (const sq of b.factions[f].squads) {
              if (sq.inContact) out.contactSquads[f]++;
              const m = root.BattleTacticalCoveredManeuver?.summary?.(sq);
              out.maneuvers[f].push({ id: sq.id, phase: m?.phase || null,
                completed: m?.completed || 0, checkins: m?.checkins || 0,
                failed: m?.failed || 0, reason: m?.reason || null,
                retainedC: m?.retainedRoutes?.filter(r => r.cursor >= 2).length || 0
              });
            }
          }
          return out;
        };
        records.push(sample());
        b.paused = false;
        let commandTime = 0;
        for (let tick = 1; tick <= Math.ceil(seconds / 0.15) && !b.winner; tick++) {
          b._trainerStepActive = true;
          try { b.step(0.15); } finally { b._trainerStepActive = false; }
          commandTime += 0.15;
          while (commandTime >= 0.45 - 1e-9 && !b.winner) {
            commandTime -= 0.45;
            root.BattleCommanderAI.update(b, sc, 0.45);
          }
          if (tick % 60 === 0 || b.winner) records.push(sample());
        }
        if (records[records.length-1].t !== +b.time.toFixed(2)) records.push(sample());
        b.pause();
        const last = records[records.length-1];
        return { seed: sc.seed, dimension: [sc.map.width, sc.map.depth],
          groundDimension: [root.BattleSim.FIELD_W, root.BattleSim.FIELD_D], initialCover,
          initialSquads, initialSoldiers,
          spawnLanes: { us: sc.spawnZones.us.lanes, ge: sc.spawnZones.ge.lanes },
          meeting: b._sides?.meeting === true, preset: root.PhaseCCombatLab.snapshot()?.preset,
          controllerOn: root.BattleTacticalMarchProvider?.on === true,
          reinforcements: root.BattleMiniMeetingReinforcements?.summary?.(b) || null,
          totalUnits: { us: b._roster.us.length, ge: b._roster.ge.length },
          winner: b.winner || null, winReason: b.winReason || null,
          ...last, timeline: records,
          maxima: { faults: Math.max(...records.map(r => r.controller.stats?.faults || 0)),
            conflicts: Math.max(...records.map(r => r.writerConflicts)),
            usCheckins: Math.max(...records.map(r => r.maneuvers.us.reduce((n,m) => n + m.checkins, 0))),
            geCheckins: Math.max(...records.map(r => r.maneuvers.ge.reduce((n,m) => n + m.checkins, 0)))
          }
        };
      }, { seconds: SECONDS });
      data.browserErrors = errors.filter(e => !/HTTP 404 loading [^\n]*\/Assets\/audio\//i.test(e));
      fs.writeFileSync(DIR + '/' + seed + '.json', JSON.stringify(data, null, 2));
      results.push(data);
      console.log('MINI_MEETING', JSON.stringify({ seed, t: data.t, bounds: data.dimension,
        cover: data.initialCover, alive: data.alive,
        shots: data.shots, supportShots: data.supportShots, moved5m: data.moved5m,
        contactSquads: data.contactSquads, grenade: data.grenade,
        reinforcements: data.reinforcements, totalUnits: data.totalUnits,
        maxima: data.maxima, winner: data.winner, errors: data.browserErrors }));
      assert.deepEqual(data.dimension, [480,360], 'expanded meeting map');
      assert.deepEqual(data.groundDimension, data.dimension, 'rendered terrain matches scenario');
      assert.ok(data.initialCover.buildings >= 10, 'expanded urban/building clutter');
      assert.ok(data.initialCover.tacticalObstacles >= 60, 'native tactical cover density');
      assert.ok(data.initialCover.physicalFootprints >= 40, 'real nav/LOS/ballistic cover volumes');
      assert.deepEqual(data.initialSquads, { us:2, ge:2 }, 'balanced squads');
      assert.deepEqual(data.initialSoldiers, { us:20, ge:20 }, 'balanced soldiers');
      assert.equal(data.meeting, true, 'unprepared meeting engagement');
      assert.equal(data.preset, 'A', 'full lethal combat');
      assert.equal(data.controllerOn, true, 'replacement enabled');
      assert.ok(data.reinforcements?.enabled, 'finite meeting reinforcement owner active');
      assert.equal(data.reinforcements.error, null, 'native spawner remains functional');
      assert.ok(data.reinforcements.wavesCompleted <= 2, 'at most two waves');
      for (const wave of data.reinforcements.entries) {
        assert.equal(wave.squads.length, 2, 'one squad for each army');
        assert.equal(wave.squads[0].soldiers, 10);
        assert.equal(wave.squads[1].soldiers, 10);
      }
      assert.equal(data.totalUnits.us, data.totalUnits.ge, 'matched total reinforcements');
      if (!data.winner && data.t >= 166 && !data.reinforcements.blockedSince)
        assert.equal(data.reinforcements.wavesCompleted, 2, 'both reinforcements delivered');
      assert.equal(data.timeline[0].controller.new, 4, 'all four original squads owned on first sample');
      assert.equal(data.maxima.faults, 0, 'controller faults');
      assert.equal(data.maxima.conflicts, 0, 'competing movement writers');
      assert.deepEqual(data.browserErrors, [], 'unexpected browser faults');
      await page.close();
    }
    fs.writeFileSync(DIR + '/summary.json', JSON.stringify(results.map(r => ({
      seed:r.seed,t:r.t,bounds:r.dimension,cover:r.initialCover,alive:r.alive,shots:r.shots,
      supporting:r.supportShots,moved:r.moved5m,grenades:r.grenade,
      reinforcements:r.reinforcements,totalUnits:r.totalUnits,maxima:r.maxima
    })),null,2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
