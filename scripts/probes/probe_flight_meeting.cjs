#!/usr/bin/env node
'use strict';
// #679 tempo probe: paired full-distance versus half-distance live US/GE meetings.
// Native perception, fire, damage, cover, movement and mission owners remain untouched.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const BASE = process.env.MINI_MEETING_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SEEDS = (process.env.FLIGHT_MEETING_SEEDS || 'mini-meeting-676-001,mini-meeting-676-002').split(',');
const SECONDS = Number(process.env.FLIGHT_MEETING_SECONDS || 210);
const DIR = 'reports/mini-flight-tempo';
fs.mkdirSync(DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });
  const results = [];
  try {
    for (const physics of ['hitscan', 'flight', 'flight-calibrated'])
      for (const variant of ['baseline', 'half'])
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
            ['media', 'font'].includes(route.request().resourceType()) ? route.abort() : route.continue()
          );
          const params = new URLSearchParams({
            combatLab: '1',
            balancedMeeting: '1',
            labPreset: 'A',
            labRange: '1',
            tacticalController: 'new',
            seed,
            pinSeed: '1',
            meetingStartHalf: variant === 'half' ? '1' : '0',
            projectileFlight: physics !== 'hitscan' ? '1' : '0',
            combatAccuracy: physics === 'flight-calibrated' ? '1' : '0',
            combatTempo: physics !== 'hitscan' ? '1' : '0'
          });
          await page.goto(BASE + '?' + params, { waitUntil: 'domcontentloaded', timeout: 120000 });
          await page.waitForFunction(
            () =>
              !!(window.__battle__ && window.BattleTacticalController && window.PhaseCCombatLab?.snapshot()),
            null,
            { timeout: 120000 }
          );
          const wallStart = Date.now();
          const data = await page.evaluate(
            ({ seconds, variant, physics }) => {
              const root = window,
                b = root.__battle__,
                sc = b.scene.metadata.battleScenario;
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
              for (const f of ['us', 'ge'])
                for (const s of b._roster[f]) start.set(s.id, { x: s.root.position.x, z: s.root.position.z });
              const shots = { us: 0, ge: 0 },
                supporting = { us: 0, ge: 0 },
                records = [];
              const telemetry = {
                firstContact: { us: null, ge: null },
                firstFire: { us: null, ge: null },
                firstHit: { us: null, ge: null },
                firstDeath: { us: null, ge: null },
                firstCoverOrder: { us: null, ge: null },
                firstCoverMovement: { us: null, ge: null },
                firstCheckin: { us: null, ge: null },
                resolvedRounds: { us: 0, ge: 0 },
                bodyHits: { us: 0, ge: 0 },
                actualSupportFire: { us: 0, ge: 0 },
                gaitSeconds: { us: {}, ge: {} },
                stoppedSeconds: { us: {}, ge: {} },
                actors: new Map(),
                coverCounts: new Map(),
                nearestInitialEnemiesM: null
              };
              function first(dict, faction, at) {
                if (dict[faction] == null) dict[faction] = +at.toFixed(2);
              }
              function actor(s) {
                const key = s.faction + ':' + s.id;
                if (!telemetry.actors.has(key))
                  telemetry.actors.set(key, {
                    id: s.id,
                    faction: s.faction,
                    role: s.role,
                    bornAt: +b.time.toFixed(2),
                    contactAt: null,
                    firstMovementAt: null,
                    coverOrderedAt: null,
                    coverMovingAt: null,
                    firstFireAt: null,
                    firstHitAt: null,
                    killedAt: null,
                    movingSeconds: 0,
                    stillContactSeconds: 0
                  });
                return telemetry.actors.get(key);
              }
              function distToNearestEnemy(s) {
                const enemy = s.faction === 'us' ? 'ge' : 'us';
                return Math.min(
                  ...b._roster[enemy].map(t =>
                    Math.hypot(t.root.position.x - s.root.position.x, t.root.position.z - s.root.position.z)
                  )
                );
              }
              telemetry.nearestInitialEnemiesM = {
                us: Math.min(...b._roster.us.map(distToNearestEnemy)),
                ge: Math.min(...b._roster.ge.map(distToNearestEnemy))
              };
              const oldShot = b.onShot;
              b.onShot = function (s, target, hit) {
                if (s && s.faction in telemetry.resolvedRounds) {
                  const f = s.faction,
                    p = actor(s);
                  telemetry.resolvedRounds[f]++;
                  first(telemetry.firstFire, f, b.time);
                  if (p.firstFireAt == null) p.firstFireAt = +b.time.toFixed(2);
                  if (hit) {
                    telemetry.bodyHits[f]++;
                    first(telemetry.firstHit, f, b.time);
                    if (p.firstHitAt == null) p.firstHitAt = +b.time.toFixed(2);
                  }
                }
                if (oldShot) return oldShot.apply(this, arguments);
              };
              function collectTempo(dt) {
                for (const faction of ['us', 'ge']) {
                  for (const s of b._roster[faction]) {
                    const p = actor(s);
                    if (s.dead) {
                      if (p.killedAt == null) {
                        p.killedAt = +b.time.toFixed(2);
                        first(telemetry.firstDeath, faction, b.time);
                      }
                      continue;
                    }
                    const contact = !!(s.target || s.squad?.inContact);
                    if (contact && p.contactAt == null) {
                      p.contactAt = +b.time.toFixed(2);
                      first(telemetry.firstContact, faction, b.time);
                    }
                    const goal = s._movementResolver?.goal;
                    const e = s.eng || {};
                    const cover = goal?.kind === 'cover-bound' || e.state === 'bound';
                    if (cover && p.coverOrderedAt == null) {
                      p.coverOrderedAt = +b.time.toFixed(2);
                      first(telemetry.firstCoverOrder, faction, b.time);
                    }
                    if (s.moving) {
                      const gait = s._locomotionGait || 'unset';
                      telemetry.gaitSeconds[faction][gait] = (telemetry.gaitSeconds[faction][gait] || 0) + dt;
                      p.movingSeconds += dt;
                      if (p.contactAt != null && p.firstMovementAt == null)
                        p.firstMovementAt = +b.time.toFixed(2);
                      if (cover && p.coverMovingAt == null) {
                        p.coverMovingAt = +b.time.toFixed(2);
                        first(telemetry.firstCoverMovement, faction, b.time);
                      }
                    } else if (contact) {
                      const reason = s._movementStopReason || e.state || 'unclassified';
                      telemetry.stoppedSeconds[faction][reason] =
                        (telemetry.stoppedSeconds[faction][reason] || 0) + dt;
                      p.stillContactSeconds += dt;
                    }
                  }
                  for (const sq of b.factions[faction].squads) {
                    const m = root.BattleTacticalCoveredManeuver?.summary?.(sq);
                    const before = telemetry.coverCounts.get(sq.id) || 0;
                    const current = m?.checkins || 0;
                    if (current > before) first(telemetry.firstCheckin, faction, b.time);
                    telemetry.coverCounts.set(sq.id, current);
                  }
                }
              }
              function quantile(values, p) {
                const a = values.filter(Number.isFinite).sort((x, y) => x - y);
                if (!a.length) return { n: 0, median: null, p90: null, mean: null };
                const at = i => +a[Math.min(a.length - 1, Math.max(0, i))].toFixed(2);
                return {
                  n: a.length,
                  median: at(Math.floor((a.length - 1) * 0.5)),
                  p90: at(Math.ceil((a.length - 1) * 0.9)),
                  mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2)
                };
              }
              function delay(p, a, z) {
                return p[a] != null && p[z] != null && p[z] >= p[a] ? p[z] - p[a] : NaN;
              }
              function summaryTempo() {
                const actors = [...telemetry.actors.values()];
                const perFaction = {};
                for (const f of ['us', 'ge']) {
                  const a = actors.filter(p => p.faction === f && p.contactAt != null);
                  perFaction[f] = {
                    soldiersContacted: a.length,
                    contactToMovementS: quantile(a.map(p => delay(p, 'contactAt', 'firstMovementAt'))),
                    contactToCoverOrderS: quantile(a.map(p => delay(p, 'contactAt', 'coverOrderedAt'))),
                    coverOrderToMovingS: quantile(a.map(p => delay(p, 'coverOrderedAt', 'coverMovingAt'))),
                    contactToFirstShotS: quantile(a.map(p => delay(p, 'contactAt', 'firstFireAt'))),
                    firstContactWithoutMovement10s: a.filter(
                      p =>
                        b.time - p.contactAt >= 10 &&
                        (p.firstMovementAt == null || p.firstMovementAt - p.contactAt > 10)
                    ).length,
                    firstContactWithoutCoverOrder10s: a.filter(
                      p =>
                        b.time - p.contactAt >= 10 &&
                        (p.coverOrderedAt == null || p.coverOrderedAt - p.contactAt > 10)
                    ).length
                  };
                }
                function roundMap(dict) {
                  return Object.fromEntries(Object.entries(dict).map(([k, v]) => [k, +v.toFixed(1)]));
                }
                return {
                  firstContact: telemetry.firstContact,
                  firstFire: telemetry.firstFire,
                  firstHit: telemetry.firstHit,
                  firstDeath: telemetry.firstDeath,
                  firstCoverOrder: telemetry.firstCoverOrder,
                  firstCoverMovement: telemetry.firstCoverMovement,
                  firstCheckin: telemetry.firstCheckin,
                  nearestInitialEnemiesM: telemetry.nearestInitialEnemiesM,
                  resolvedRounds: telemetry.resolvedRounds,
                  bodyHits: telemetry.bodyHits,
                  hitRates: Object.fromEntries(
                    ['us', 'ge'].map(f => [
                      f,
                      telemetry.resolvedRounds[f]
                        ? +((100 * telemetry.bodyHits[f]) / telemetry.resolvedRounds[f]).toFixed(2)
                        : 0
                    ])
                  ),
                  actualSupportFire: telemetry.actualSupportFire,
                  gaitSeconds: Object.fromEntries(
                    ['us', 'ge'].map(f => [f, roundMap(telemetry.gaitSeconds[f])])
                  ),
                  stoppedSeconds: Object.fromEntries(
                    ['us', 'ge'].map(f => [f, roundMap(telemetry.stoppedSeconds[f])])
                  ),
                  perFaction,
                  soldiers: actors
                };
              }
              const oldFire = b.onFire;
              b.onFire = function (s) {
                if (s && s.faction in shots) {
                  shots[s.faction]++;
                  const ownCover = root.BattleTacticalCoveredManeuver?.summary?.(s.squad);
                  if (
                    ownCover?.phase === 'moving' &&
                    !s.moving &&
                    s.squad.members.some(m => m !== s && m.moving)
                  )
                    telemetry.actualSupportFire[s.faction]++;
                  if (
                    s.squad?.members?.some(
                      m => m !== s && m.moving && root.BattleEngagement?.stateOf?.(m)?.boundOrder
                    )
                  )
                    supporting[s.faction]++;
                }
                if (oldFire) return oldFire.apply(this, arguments);
              };
              const sample = () => {
                const out = {
                  t: +b.time.toFixed(2),
                  shots: { ...shots },
                  supportShots: { ...supporting },
                  alive: { us: b.factions.us.alive, ge: b.factions.ge.alive },
                  moved5m: { us: 0, ge: 0 },
                  totalDisplacementM: { us: 0, ge: 0 },
                  contactSquads: { us: 0, ge: 0 },
                  maneuvers: { us: [], ge: [] },
                  controller: root.BattleTacticalController.summary(b),
                  grenade: root.BattleGrenades?.summary?.(b) || null,
                  reinforcements: root.BattleMiniMeetingReinforcements?.summary?.(b) || null,
                  cumulativeUnits: { us: b._roster.us.length, ge: b._roster.ge.length },
                  writerConflicts: root.BattleOrderProvenance?.conflicts?.(b)?.length || 0
                };
                for (const f of ['us', 'ge']) {
                  for (const s of b._roster[f]) {
                    let a = start.get(s.id);
                    if (!a) {
                      a = { x: s.root.position.x, z: s.root.position.z };
                      start.set(s.id, a);
                    }
                    const d = Math.hypot(s.root.position.x - a.x, s.root.position.z - a.z);
                    if (d >= 5) out.moved5m[f]++;
                    out.totalDisplacementM[f] += d;
                  }
                  for (const sq of b.factions[f].squads) {
                    if (sq.inContact) out.contactSquads[f]++;
                    const m = root.BattleTacticalCoveredManeuver?.summary?.(sq);
                    out.maneuvers[f].push({
                      id: sq.id,
                      phase: m?.phase || null,
                      completed: m?.completed || 0,
                      checkins: m?.checkins || 0,
                      failed: m?.failed || 0,
                      reason: m?.reason || null,
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
                try {
                  b.step(0.15);
                } finally {
                  b._trainerStepActive = false;
                }
                commandTime += 0.15;
                while (commandTime >= 0.45 - 1e-9 && !b.winner) {
                  commandTime -= 0.45;
                  root.BattleCommanderAI.update(b, sc, 0.45);
                }
                collectTempo(0.15);
                if (tick % 60 === 0 || b.winner) records.push(sample());
              }
              if (records[records.length - 1].t !== +b.time.toFixed(2)) records.push(sample());
              b.pause();
              const last = records[records.length - 1];
              return {
                variant,
                physics,
                seed: sc.seed,
                dimension: [sc.map.width, sc.map.depth],
                flight: root.BattleProjectileFlight?.summary?.(b) || null,
                spawnSeparationM: Math.abs(sc.spawnZones.ge.z - sc.spawnZones.us.z),
                groundDimension: [root.BattleSim.FIELD_W, root.BattleSim.FIELD_D],
                initialCover,
                initialSquads,
                initialSoldiers,
                spawnLanes: { us: sc.spawnZones.us.lanes, ge: sc.spawnZones.ge.lanes },
                meeting: b._sides?.meeting === true,
                preset: root.PhaseCCombatLab.snapshot()?.preset,
                controllerOn: root.BattleTacticalMarchProvider?.on === true,
                reinforcements: root.BattleMiniMeetingReinforcements?.summary?.(b) || null,
                totalUnits: { us: b._roster.us.length, ge: b._roster.ge.length },
                winner: b.winner || null,
                winReason: b.winReason || null,
                ...last,
                tempo: summaryTempo(),
                timeline: records,
                maxima: {
                  faults: Math.max(...records.map(r => r.controller.stats?.faults || 0)),
                  conflicts: Math.max(...records.map(r => r.writerConflicts)),
                  usCheckins: Math.max(
                    ...records.map(r => r.maneuvers.us.reduce((n, m) => n + m.checkins, 0))
                  ),
                  geCheckins: Math.max(
                    ...records.map(r => r.maneuvers.ge.reduce((n, m) => n + m.checkins, 0))
                  )
                }
              };
            },
            { seconds: SECONDS, variant, physics }
          );
          data.wallMs = Date.now() - wallStart;
          data.browserErrors = errors.filter(e => !/HTTP 404 loading [^\n]*\/Assets\/audio\//i.test(e));
          fs.writeFileSync(
            DIR + '/' + physics + '-' + variant + '-' + seed + '.json',
            JSON.stringify(data, null, 2)
          );
          results.push(data);
          console.log(
            'FLIGHT_MEETING',
            JSON.stringify({
              variant,
              physics,
              seed,
              t: data.t,
              flight: data.flight,
              wallMs: data.wallMs,
              separationM: data.spawnSeparationM,
              tempo: data.tempo,
              bounds: data.dimension,
              cover: data.initialCover,
              alive: data.alive,
              shots: data.shots,
              supportShots: data.supportShots,
              moved5m: data.moved5m,
              contactSquads: data.contactSquads,
              grenade: data.grenade,
              reinforcements: data.reinforcements,
              totalUnits: data.totalUnits,
              maxima: data.maxima,
              winner: data.winner,
              errors: data.browserErrors
            })
          );
          assert.equal(
            data.flight?.enabled,
            physics !== 'hitscan',
            'projectile flight A/B active only when requested'
          );
          assert.equal(
            data.spawnSeparationM,
            variant === 'half' ? 150 : 300,
            'halved initial separation on identical map seed'
          );
          assert.deepEqual(data.dimension, [480, 360], 'expanded meeting map');
          assert.deepEqual(data.groundDimension, data.dimension, 'rendered terrain matches scenario');
          assert.ok(data.initialCover.buildings >= 10, 'expanded urban/building clutter');
          assert.ok(data.initialCover.tacticalObstacles >= 60, 'native tactical cover density');
          assert.ok(data.initialCover.physicalFootprints >= 40, 'real nav/LOS/ballistic cover volumes');
          assert.deepEqual(data.initialSquads, { us: 2, ge: 2 }, 'balanced squads');
          assert.deepEqual(data.initialSoldiers, { us: 20, ge: 20 }, 'balanced soldiers');
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
          assert.ok(data.tempo.resolvedRounds.us + data.tempo.resolvedRounds.ge > 0, 'real shots resolved');
          if (physics !== 'hitscan') {
            assert.ok(data.flight.fired > 0, 'physical rounds launched');
            assert.ok(data.flight.resolved > 0, 'physical rounds traveled to a terminal event');
            assert.ok(data.flight.meanFlightSeconds > 0, 'positive simulated bullet time of flight');
          }
          assert.equal(data.maxima.conflicts, 0, 'competing movement writers');
          assert.equal(data.grenade?.friendlyWounded || 0, 0, 'no friendly grenade wounds in live meeting');
          assert.equal(
            data.grenade?.friendlyCasualties || 0,
            0,
            'no friendly grenade deaths in live meeting'
          );
          assert.deepEqual(data.browserErrors, [], 'unexpected browser faults');
          await page.close();
        }
    fs.writeFileSync(
      DIR + '/summary.json',
      JSON.stringify(
        results.map(r => ({
          variant: r.variant,
          physics: r.physics,
          flight: r.flight,
          wallMs: r.wallMs,
          seed: r.seed,
          t: r.t,
          separationM: r.spawnSeparationM,
          tempo: r.tempo,
          bounds: r.dimension,
          cover: r.initialCover,
          alive: r.alive,
          shots: r.shots,
          supporting: r.supportShots,
          moved: r.moved5m,
          grenades: r.grenade,
          reinforcements: r.reinforcements,
          totalUnits: r.totalUnits,
          maxima: r.maxima
        })),
        null,
        2
      )
    );
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
