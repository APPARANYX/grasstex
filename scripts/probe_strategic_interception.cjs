#!/usr/bin/env node
'use strict';
/* Read-only native 5 km intercept trace. No injected enemy, forced orders,
   moved soldiers, planted events or synthetic hits: fixed-clock game execution. */
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const { execSync } = require('node:child_process');
function playwright() {
  try {
    return require('playwright');
  } catch (_) {
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}
const base = process.env.STRATEGIC_INTERCEPT_QA_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const dir = path.resolve(process.env.STRATEGIC_INTERCEPT_QA_OUT || 'closeups/strategic-interception-ci');
const limit = Number(process.env.STRATEGIC_INTERCEPT_QA_SECONDS || 900);
const seeds = [
  { seed: 'strategic-diag-001-meeting-0001', type: 'meeting' },
  { seed: 'strategic-diag-001-ge-defend-0001', type: 'ge-defend' },
  { seed: 'strategic-diag-001-us-defend-0005', type: 'us-defend' }
].slice(0, Math.max(1, Math.min(3, +process.env.STRATEGIC_INTERCEPT_QA_CASES || 3)));
(async () => {
  fs.mkdirSync(dir, { recursive: true });
  const { chromium } = playwright(),
    browser = await chromium.launch({
      args: [
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--no-sandbox'
      ]
    });
  const results = [];
  try {
    for (const spec of seeds)
      for (const enabled of [false, true]) {
        const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
        const jsErrors = [];
        page.on('pageerror', e => jsErrors.push(String(e.stack || e).slice(0, 900)));
        const url =
          base +
          (base.includes('?') ? '&' : '?') +
          'strategicInterception=1&motorTransport=1&aerialRecon=1' +
          (enabled ? '&interception=1' : '') +
          (spec.type === 'meeting' ? '' : '&defender=' + spec.type.split('-')[0]) +
          '&seed=' +
          encodeURIComponent(spec.seed) +
          '&log=0';
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 });
        await page.waitForFunction(
          () =>
            !!(
              window.__battle__ &&
              window.BattleCommanderAI &&
              window.BattleStrategicInterception &&
              window.BattleAerialRecon &&
              window.BattleSquadTransport
            ),
          null,
          { timeout: 180000 }
        );
        const record = await page.evaluate(
          async ({ limit, enabled }) => {
            const root = window,
              sim = root.__battle__,
              scene = sim.scene,
              engine = scene.getEngine(),
              renderLoop = root.__battleRenderLoop__;
            if (engine && renderLoop) engine.stopRenderLoop(renderLoop);
            sim.pause();
            // This mirrors the native benchmark fixed-clock loop. Disabling only
            // optional visual FBX is a renderer choice, not an AI state change.
            root.BattleSoldierModel?.setImportedEnabled?.(scene, false);
            sim.trainingMode = true;
            sim.paused = false;
            sim.timeScale = 1;
            sim.timeLimit = limit;
            const fleetStart = root.BattleSquadTransport.fleetSummary(sim);
            const reserveAudit = {},
              stats = { us: null, ge: null },
              observed = {},
              shots = { total: 0, byFaction: {} },
              before = sim.onShot,
              fireBefore = sim.onFire;
            sim.onFire = function (s) {
              shots.total++;
              const f = s?.faction || s?.squad?.faction;
              if (f) shots.byFaction[f] = (shots.byFaction[f] || 0) + 1;
              if (typeof fireBefore === 'function') fireBefore.apply(this, arguments);
            };
            const dt = 0.15,
              commandTick = +0.45;
            let commandAccum = 0,
              steps = 0,
              nextSample = 0;
            function center(sq) {
              const a = (sq?.members || []).filter(m => m && !m.dead && m.root?.position);
              if (!a.length) return null;
              return {
                x: a.reduce((v, m) => v + m.root.position.x, 0) / a.length,
                z: a.reduce((v, m) => v + m.root.position.z, 0) / a.length
              };
            }
            while (!sim.winner && sim.time < limit - 0.01) {
              sim._trainerStepActive = true;
              try {
                sim.step ? sim.step(dt) : sim._frame(dt);
              } finally {
                sim._trainerStepActive = false;
              }
              commandAccum += dt;
              while (commandAccum + 1e-9 >= commandTick && !sim.winner) {
                commandAccum -= commandTick;
                root.BattleCommanderAI.update(sim, scene.metadata.battleScenario, commandTick);
              }
              steps++;
              // Inspect the early real mission allocation regardless of
              // whether aerial interception was deferred to ground screening.
              if (!reserveAudit.at && sim.time >= 40.05) {
                reserveAudit.at = +sim.time.toFixed(2);
                for (const side of ['us', 'ge']) {
                  reserveAudit[side] = (sim.factions[side]?.squads || []).map(sq => {
                    const p = center(sq),
                      home = sq.baseHome || sq.home;
                    return {
                      id: sq.id,
                      role: sq.commandRole,
                      phase: sq.commandPhase,
                      state: sq.state,
                      macro: sq._macroMission?.intent || null,
                      macroReason: sq._macroMission?.reason || null,
                      macroStatus: sq._macroMission?.status || null,
                      interceptReserve: !!sq._macroMission?.interceptReserve,
                      selectedByPlanner: root.BattleStrategicInterception.reserveSquad(sim, sq),
                      used: !!sq._transportUsed,
                      currentVehicle: sq._transport?.phase || null,
                      preparedDefense: !!sq._preparedDefenseRequest,
                      contact: !!sq.inContact,
                      metersFromHome: p && home ? +Math.hypot(p.x - home.x, p.z - home.z).toFixed(1) : null,
                      fleetParked: root.BattleSquadTransport.fleetSummary(sim).filter(
                        v => v.faction === side && v.phase === 'parked'
                      ).length
                    };
                  });
                }
              }
              if (sim.time + 1e-9 < nextSample) continue;
              nextSample += 0.75;
              const data = root.BattleStrategicInterception.summary(sim);
              for (const f of ['us', 'ge']) {
                const state = data[f],
                  last = state && state.last;
                if (!last || last.result !== 'dispatched') continue;
                const sq = (sim.factions[f]?.squads || []).find(s => s.id === last.squadId);
                const m = sq?._macroMission;
                if (!sq || !m || m.intent !== 'intercept') continue;
                const id = f + ':' + last.squadId + ':' + m.version,
                  proof =
                    observed[id] ||
                    (observed[id] = {
                      faction: f,
                      squadId: last.squadId,
                      vehicleId: last.vehicleId,
                      roadId: last.roadId,
                      contactId: last.contactId,
                      margin: last.margin,
                      missionVersion: m.version,
                      issuedAt: last.at,
                      claimed: false,
                      embarkedAt: null,
                      dismountedAt: null,
                      onPostAt: null,
                      enemyFirstAt: null,
                      enemyNearestM: Infinity,
                      travelMetres: 0,
                      setupPosition: null
                    });
                const t = sq._transport;
                if (t && t.vehicleId === proof.vehicleId) {
                  proof.claimed = true;
                  proof.travelMetres = Math.max(proof.travelMetres, t.travelled || 0);
                  if (t.embarkedAt != null) proof.embarkedAt = t.embarkedAt;
                  if (t.endedAt != null) proof.dismountedAt = t.endedAt;
                }
                if (sq._missionExecution?.interceptOnPostAt && !proof.onPostAt) {
                  proof.onPostAt = sq._missionExecution.interceptOnPostAt;
                  proof.setupPosition = center(sq);
                }
                const hostile = f === 'us' ? 'ge' : 'us';
                const enemy = (sim.factions[hostile]?.squads || []).find(s => s.id === proof.contactId);
                const ep = center(enemy),
                  pt = m.point;
                if (ep && pt) {
                  const distance = Math.hypot(ep.x - pt.x, ep.z - pt.z);
                  proof.enemyNearestM = Math.min(proof.enemyNearestM, distance);
                  if (distance <= 80 && proof.enemyFirstAt == null) proof.enemyFirstAt = +sim.time.toFixed(2);
                }
              }
            }
            sim.pause();
            sim.onShot = before;
            sim.onFire = fireBefore;
            for (const p of Object.values(observed)) {
              if (!isFinite(p.enemyNearestM)) p.enemyNearestM = null;
              else p.enemyNearestM = +p.enemyNearestM.toFixed(1);
              p.physicallyEarly = p.onPostAt != null && p.enemyFirstAt != null && p.onPostAt < p.enemyFirstAt;
              p.onPostBeforeContact = p.onPostAt != null;
            }
            return {
              seed: scene.metadata.battleScenario.seed,
              enabled,
              steps,
              seconds: +sim.time.toFixed(1),
              winner: sim.winner || null,
              fleetStart: fleetStart.length,
              fleetEnd: root.BattleSquadTransport.fleetSummary(sim).length,
              aerial: Object.fromEntries(
                ['us', 'ge'].map(f => {
                  const r = sim._strategicAerialRecon?.[f];
                  return [f, { used: !!r?.used, contacts: r?.event?.contacts?.length || 0 }];
                })
              ),
              general: Object.fromEntries(['us', 'ge'].map(f => [f, (stats[f] = dataSnapshot(f))])),
              reserveAudit,
              forwardScreen: Object.fromEntries(
                ['us', 'ge'].map(f => {
                  const state = root.BattleStrategicInterception.summary(sim)[f];
                  return [
                    f,
                    {
                      screens: Object.values(state.screens || {}).map(item => {
                        const sq = (sim.factions[f].squads || []).find(s => s.id === item.squadId),
                          t = sq?._transport;
                        return {
                          squadId: item.squadId,
                          leadSquadId: item.leadSquadId,
                          objectiveId: item.objectiveId,
                          roadId: item.roadId,
                          vehicleId: item.vehicleId,
                          orderAt: item.orderAt,
                          atPost: item.atPost,
                          reportCount: item.reportCount,
                          intercept: item.intercept || null,
                          travelled: t?.travelled || 0,
                          phase: t?.phase || null,
                          actualPostTime: sq?._missionExecution?.screenOnPostAt || null
                        };
                      }),
                      supports: state.supports || []
                    }
                  ];
                })
              ),
              interceptions: Object.values(observed),
              shots
            };
            function dataSnapshot(f) {
              const x = root.BattleStrategicInterception.summary(sim)[f];
              return x && x.last ? { ...x.last } : null;
            }
          },
          { limit, enabled }
        );
        assert.equal(record.fleetStart, 12, '12 physical initial base trucks');
        assert.equal(record.fleetEnd, 12, 'never create an extra truck mid-battle');
        assert.ok(record.seconds >= 120, 'recon clock reached');
        assert.deepEqual(jsErrors, [], 'no native Chromium JS exception');
        if (!enabled) {
          assert.equal(record.interceptions.length, 0, 'flag-off cannot dispatch interception');
          assert.ok(!record.general.us && !record.general.ge, 'flag-off leaves planner idle');
          assert.ok(
            Object.values(record.forwardScreen).every(f => !f.screens.length && !f.supports.length),
            'flag-off must not issue forward screens or second-truck reinforcement'
          );
        }
        results.push(record);
        console.log(
          'INTERCEPT_NATIVE',
          JSON.stringify({
            seed: record.seed,
            on: enabled,
            general: record.general,
            interceptions: record.interceptions.length,
            physicallyEarly: record.interceptions.filter(x => x.physicallyEarly).length,
            forwardScreens: Object.values(record.forwardScreen).reduce((n, f) => n + f.screens.length, 0),
            forwardPosts: Object.values(record.forwardScreen).reduce(
              (n, f) => n + f.screens.filter(x => x.atPost != null).length,
              0
            ),
            groundReports: Object.values(record.forwardScreen).reduce(
              (n, f) => n + f.screens.reduce((k, x) => k + x.reportCount, 0),
              0
            ),
            secondTruckSupport: Object.values(record.forwardScreen).reduce(
              (n, f) => n + f.supports.length,
              0
            ),
            shots: record.shots.total,
            seconds: record.seconds,
            reserveAudit: enabled ? record.reserveAudit : null
          })
        );
        await page.close();
      }
    fs.writeFileSync(
      path.join(dir, 'native-interception-evidence.json'),
      JSON.stringify(results, null, 2) + '\n'
    );
    console.log(
      'STRATEGIC INTERCEPTION NATIVE QA RECORDED',
      JSON.stringify({
        cases: results.length,
        dispatches: results.reduce((s, r) => s + r.interceptions.length, 0),
        physicalEarly: results.reduce((s, r) => s + r.interceptions.filter(x => x.physicallyEarly).length, 0)
      })
    );
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error('STRATEGIC INTERCEPTION NATIVE QA FAILED', e.stack || e);
  process.exitCode = 1;
});
