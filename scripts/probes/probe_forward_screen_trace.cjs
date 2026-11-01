#!/usr/bin/env node
'use strict';
/* Read-only trace of forward-screen squads on a native 5 km battle (interception ON).
   Records each screen squad's transport phase, end reason, mission and contact state
   over time. No injected enemy, forced order or moved soldier.
   SCREEN_TRACE_URL (default local php -S), SCREEN_TRACE_SEED, SCREEN_TRACE_DEFENDER,
   SCREEN_TRACE_SECONDS (default 240), SCREEN_TRACE_OUT (JSON path), SCREEN_TRACE_EXTRA. */
const fs = require('node:fs'),
  path = require('node:path');
const { execSync } = require('node:child_process');
function playwright() {
  try {
    return require('playwright');
  } catch (_) {
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}
const base = process.env.SCREEN_TRACE_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const seed = process.env.SCREEN_TRACE_SEED || 'strategic-diag-001-meeting-0001';
const defender = process.env.SCREEN_TRACE_DEFENDER || '';
const limit = Number(process.env.SCREEN_TRACE_SECONDS || 240);
const out = process.env.SCREEN_TRACE_OUT || 'closeups/forward-screen-trace.json';
// Optional comparison squads (e.g. ordinary truck capture squads): SCREEN_TRACE_EXTRA=us-2,ge-2
const extra = (process.env.SCREEN_TRACE_EXTRA || '').split(',').filter(Boolean);
(async () => {
  const { chromium } = playwright(),
    browser = await chromium.launch({
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
    });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e.stack || e).slice(0, 600)));
    const url =
      base +
      '?strategicInterception=1&motorTransport=1&aerialRecon=1&interception=1' +
      (defender ? '&defender=' + defender : '') +
      '&seed=' +
      encodeURIComponent(seed) +
      '&log=0';
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForFunction(
      () => !!(window.__battle__ && window.BattleCommanderAI && window.BattleStrategicInterception),
      null,
      { timeout: 180000 }
    );
    const result = await page.evaluate(
      ({ limit, extra }) => {
        const root = window,
          sim = root.__battle__,
          scene = sim.scene,
          engine = scene.getEngine(),
          loop = root.__battleRenderLoop__;
        if (engine && loop) engine.stopRenderLoop(loop);
        sim.pause();
        root.BattleSoldierModel?.setImportedEnabled?.(scene, false);
        sim.trainingMode = true;
        sim.paused = false;
        sim.timeScale = 1;
        sim.timeLimit = limit;
        const telemetry = [],
          rec = root.BattleTelemetry && root.BattleTelemetry.record;
        if (rec)
          root.BattleTelemetry.record = function (type, data) {
            if (/strategic-transport|interception|screen|decision-macro|decision-strategic/.test(type))
              try {
                telemetry.push({ type, data: JSON.parse(JSON.stringify(data || null)) });
              } catch (_) {
                telemetry.push({ type, data: null });
              }
            return rec.apply(this, arguments);
          };
        const traces = {},
          dt = 0.15,
          tick = 0.45;
        let acc = 0,
          next = 0;
        const center = sq => {
          const a = (sq?.members || []).filter(m => m && !m.dead && m.root?.position);
          if (!a.length) return null;
          return {
            x: +(a.reduce((v, m) => v + m.root.position.x, 0) / a.length).toFixed(1),
            z: +(a.reduce((v, m) => v + m.root.position.z, 0) / a.length).toFixed(1)
          };
        };
        while (!sim.winner && sim.time < limit - 0.01) {
          sim._trainerStepActive = true;
          try {
            sim.step ? sim.step(dt) : sim._frame(dt);
          } finally {
            sim._trainerStepActive = false;
          }
          acc += dt;
          while (acc + 1e-9 >= tick && !sim.winner) {
            acc -= tick;
            root.BattleCommanderAI.update(sim, scene.metadata.battleScenario, tick);
          }
          if (sim.time + 1e-9 < next) continue;
          next += 1;
          const summary = root.BattleStrategicInterception.summary(sim);
          for (const f of ['us', 'ge'])
            for (const item of Object.values(summary[f]?.screens || {}).concat(
              extra.filter(id => id.startsWith(f + '-')).map(id => ({ squadId: id, atPost: null }))
            )) {
              const sq = (sim.factions[f].squads || []).find(s => s.id === item.squadId),
                t = sq?._transport,
                m = sq?._macroMission,
                x = sq?._missionExecution,
                key = f + ':' + item.squadId,
                row = {
                  t: +sim.time.toFixed(1),
                  state: sq?.state,
                  inContact: !!sq?.inContact,
                  alive: (sq?.members || []).filter(s => !s.dead).length,
                  center: center(sq),
                  intent: m?.intent || null,
                  missionStatus: m?.status || null,
                  missionVersion: m?.version ?? null,
                  point: m?.point ? { x: +(+m.point.x).toFixed(1), z: +(+m.point.z).toFixed(1) } : null,
                  transport: t
                    ? {
                        phase: t.phase,
                        endReason: t.endReason || null,
                        travelled: +(+t.travelled || 0).toFixed(1),
                        leg: t.leg,
                        legs: t.path?.length,
                        missionVersion: t.missionVersion ?? null
                      }
                    : null,
                  exec: x
                    ? {
                        status: x.status || null,
                        leg: x.leg ?? null,
                        screenOnPostAt: x.screenOnPostAt || null
                      }
                    : null,
                  atPost: item.atPost,
                  routeIndex: sq?.routeIndex ?? null,
                  routeLength: sq?.route?.length ?? null,
                  missionHold: sq?._missionHold || null,
                  commandPhase: sq?.commandPhase || null,
                  postDistance10:
                    m?.point && center(sq)
                      ? Math.round(Math.hypot(center(sq).x - m.point.x, center(sq).z - m.point.z) / 10) * 10
                      : null
                },
                list = traces[key] || (traces[key] = []),
                prev = list[list.length - 1],
                sig = JSON.stringify({ ...row, t: 0, center: 0 });
              if (!prev || prev.sig !== sig) list.push({ ...row, sig });
            }
        }
        for (const list of Object.values(traces)) for (const r of list) delete r.sig;
        return { seconds: +sim.time.toFixed(1), winner: sim.winner || null, traces, telemetry };
      },
      { limit, extra }
    );
    result.seed = seed;
    result.errors = errors;
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(result, null, 1));
    console.log(
      JSON.stringify({ seed, seconds: result.seconds, screens: Object.keys(result.traces), errors })
    );
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
