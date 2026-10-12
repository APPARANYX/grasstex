'use strict';
/* Phase C field acceptance. No pose, mission, fire-control, contact, support,
   route, squad or cover mutation: all AI inputs and choices are shipping
   BattleSim owners running full regenerated seeded scenarios. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

(async () => {
  const type = process.env.C_FIELD_TYPE || 'meeting';
  const count = Math.max(1, Number(process.env.C_FIELD_COUNT || 3));
  const limit = Math.max(30, Number(process.env.C_FIELD_SECONDS || 210));
  const prefix = process.env.C_FIELD_PREFIX || 'phase-c-field';
  const base = process.env.C_FIELD_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
  const flags = 'localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1';
  const dir = 'reports/phase-c-field';
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
  });
  const results = [];
  try {
    for (const arm of ['off', 'on']) {
      const query = new URLSearchParams(type === 'meeting' ? '' : 'defender=' + (type === 'us-defend' ? 'us' : 'ge'));
      if (arm === 'on') for (const [k, v] of new URLSearchParams(flags)) query.set(k, v);
      query.set('seed', prefix + '-bootstrap');
      const page = await browser.newPage({ ignoreHTTPSErrors: true });
      page.setDefaultTimeout(120000);
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      page.on('console', m => {
        if (m.type() === 'error' && !/texture|audio|\.png|\.mp3|failed to load resource/i.test(m.text())) errors.push(m.text());
      });
      await page.route('**/*', route =>
        ['media', 'font'].includes(route.request().resourceType()) ? route.abort() : route.continue()
      );
      await page.goto(base + '?' + query.toString(), { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForFunction(() => !!(
        window.__battle__ && window.BattleSquadStability && window.BattleTownObjectives &&
        window.BattleCommanderAI && window.BattleAIPolicy
      ), null, { timeout: 120000 });
      const observed = await page.evaluate(async ({ count, limit, prefix, arm }) => {
        const root = window;
        const b = root.__battle__;
        const engine = b.scene?.getEngine?.();
        if (engine && root.__battleRenderLoop__) engine.stopRenderLoop(root.__battleRenderLoop__);
        b.pause();
        const originalSeed = b.scene?.metadata?.battleScenario?.seed || b.scene?.metadata?.battleTown?.seed;
        const rawRestart = b._controlRawRestart || b.restart.bind(b);
        const genome = root.BattleAIPolicy.get();
        const saved = {
          onFire: b.onFire, onUpdate: b.onUpdate, onWinner: b.onWinner,
          onShot: b.onShot, onSuppressiveShot: b.onSuppressiveShot, onCallout: b.onCallout,
          timeLimit: b.timeLimit, timeScale: b.timeScale
        };
        const out = [];
        let active = null;
        b.onUpdate = b.onWinner = b.onShot = b.onSuppressiveShot = b.onCallout = () => {};
        b.onFire = s => {
          if (!active) return;
          active.shots++;
          if (!s?.squad || !root.BattleLeases?.holds?.(s.squad, 'bound', b.time)) return;
          const movers = (s.squad.members || []).filter(m => m !== s && !m.dead &&
            m.moving && root.BattleEngagement?.stateOf?.(m)?.boundOrder);
          if (movers.length) active.supportFireDuringMove++;
        };
        try {
          for (let index = 0; index < count; index++) {
            const seed = prefix + '-' + String(index + 1).padStart(4, '0');
            const scenario = root.BattleTownObjectives.regenerate(
              b.scene, b.heightAt, seed, { benchmark: true, benchmarkIndex: index }, b
            );
            root.BattleAIPolicy.setMatchPolicies(b, genome, genome);
            b.trainingMode = true;
            root.BattleSoldierModel?.setImportedEnabled?.(b.scene, false);
            rawRestart();
            b.manualEnded = false; b.winner = null; b.winReason = null;
            b.paused = false; b.timeScale = 1; b.timeLimit = limit;
            active = {
              arm, type: new URLSearchParams(root.location.search).get('defender') || 'meeting',
              seed, scenarioFingerprint: scenario?.fingerprint || null,
              ambush: 0, prepared: 0, maneuvers: 0, bounds: 0,
              coveredArrivals: 0, movedMetres: 0, supportFireDuringMove: 0,
              shots: 0, livingContactSamples: 0, reportSamples: 0, quietReportSamples: 0,
              precontactCleanSamples: 0, pressureSamples: 0, reportedPressureEvents: 0,
              modeEvents: [], rejectionSamples: {}, contactChangeEvents: 0,
              squadSamples: 0, engagementOutcomes: {}, suppressedEpisodes: 0
            };
            const last = new Map();
            let commanderAccumulator = 0;
            const wallStart = performance.now();
            for (let tick = 0; tick < Math.ceil(limit / 0.15) && !b.winner; tick++) {
              b._trainerStepActive = true;
              try { b.step(0.15); } finally { b._trainerStepActive = false; }
              commanderAccumulator += 0.15;
              while (commanderAccumulator >= 0.45 - 1e-9 && !b.winner) {
                commanderAccumulator -= 0.45;
                root.BattleCommanderAI.update(b, scenario, 0.45);
              }
              if (tick % 3 !== 0) continue;
              for (const faction of ['us', 'ge']) {
                for (const sq of b.factions?.[faction]?.squads || []) {
                  const key = faction + ':' + sq.id;
                  const prev = last.get(key) || { mode: 'none', bound: false, contact: false, lastM: {} };
                  active.squadSamples++;
                  const current = root.BattleSquadStability?.tacticalPostures?.current?.(b, sq);
                  const mode = current?.mode || 'none';
                  const task = sq._localTask;
                  const pressure = +task?.inputs?.pressure || 0;
                  const reports = root.SquadAI?.squadContactsMap?.(sq, b) || [];
                  const fresh = Array.isArray(reports) && reports.some(r =>
                    Number.isFinite(r?.at) && b.time >= r.at && b.time - r.at <= 10 &&
                    Number.isFinite(r?.confidence) && r.confidence >= 0.5);
                  if (fresh) active.reportSamples++;
                  if (!sq.inContact && fresh) active.quietReportSamples++;
                  if (!sq.inContact && fresh && !sq.members?.some(s => s?.target) && pressure <= 0.1)
                    active.precontactCleanSamples++;
                  if (sq.inContact) active.livingContactSamples++;
                  if (pressure >= 0.25) active.pressureSamples++;
                  if (sq.inContact && pressure >= 0.25 && !prev.pressure) active.reportedPressureEvents++;
                  if (sq.inContact !== prev.contact && prev.contact) active.contactChangeEvents++;
                  if (mode !== prev.mode) {
                    if (mode === 'ambush') active.ambush++;
                    if (mode === 'maneuver') active.maneuvers++;
                    if (active.modeEvents.length < 100) active.modeEvents.push({
                      t: +b.time.toFixed(2), squad: key, mode, stage: current?.stage || null,
                      prior: prev.mode, contact: !!sq.inContact, pressure,
                      mission: sq._macroMission?.status || null
                    });
                  }
                  if (current?.readyAt != null && !prev.prepared) active.prepared++;
                  const bound = !!root.BattleLeases?.holds?.(sq, 'bound', b.time);
                  if (bound && !prev.bound) {
                    active.bounds++;
                    prev.lastM = {};
                  }
                  if (bound) {
                    for (const s of sq.members || []) {
                      const e = root.BattleEngagement?.stateOf?.(s);
                      if (!e?.boundOrder || !s?.root?.position) continue;
                      const p = s.root.position;
                      const v = prev.lastM[s.id] || (prev.lastM[s.id] = {
                        x: p.x, z: p.z, arrived: false
                      });
                      const displacement = Math.hypot(p.x - v.x, p.z - v.z);
                      active.movedMetres = Math.max(active.movedMetres, displacement);
                      if (!v.arrived && displacement > 0.75 && e.cover &&
                        Math.hypot(p.x - e.cover.x, p.z - e.cover.z) < 0.45) {
                        active.coveredArrivals++;
                        v.arrived = true;
                      }
                    }
                  }
                  if (mode === 'none' && fresh && !sq.inContact) {
                    const reason = sq._macroMission?.status !== 'executing'
                      ? 'no-executing-mission'
                      : !sq._missionExecution ? 'no-execution'
                      : sq._engagementPlan && ['active', 'quiet'].includes(sq._engagementPlan.status)
                        ? 'prior-engagement-plan'
                        : sq.members?.some(s => s?.target) ? 'personal-target'
                        : pressure > 0.1 ? 'precontact-pressure'
                        : 'unresolved-quiet-eligibility';
                    active.rejectionSamples[reason] = (active.rejectionSamples[reason] || 0) + 1;
                  }
                  prev.mode = mode; prev.prepared = current?.readyAt != null;
                  prev.bound = bound; prev.contact = !!sq.inContact;
                  prev.pressure = sq.inContact && pressure >= 0.25;
                  last.set(key, prev);
                }
              }
            }
            active.seconds = +b.time.toFixed(2);
            active.wallSeconds = +((performance.now() - wallStart) / 1000).toFixed(3);
            active.winner = b.winner || 'none';
            active.kills = { us: b.factions?.us?.kills || 0, ge: b.factions?.ge?.kills || 0 };
            active.postures = root.BattleSquadStability?.localPlanTelemetry?.(b)?.postures || null;
            active.coveredBounds = root.BattleEngagement?.coveredBoundTelemetry?.(b) || null;
            active.writerConflicts = root.BattleOrderProvenance?.conflicts?.(b)?.length || 0;
            out.push(JSON.parse(JSON.stringify(active)));
            active = null;
          }
        } finally {
          root.BattleAIPolicy.clearMatchPolicies(b);
          b.trainingMode = false;
          root.BattleSoldierModel?.setImportedEnabled?.(b.scene, true);
          if (originalSeed) root.BattleTownObjectives.regenerate(
            b.scene, b.heightAt, originalSeed, { restoredAfterBenchmark: true }, b
          );
          rawRestart();
          b.onFire = saved.onFire; b.onUpdate = saved.onUpdate; b.onWinner = saved.onWinner;
          b.onShot = saved.onShot; b.onSuppressiveShot = saved.onSuppressiveShot;
          b.onCallout = saved.onCallout;
          b.timeLimit = saved.timeLimit; b.timeScale = saved.timeScale;
          b.pause();
        }
        return out;
      }, { count, limit, prefix, arm });
      results.push(...observed);
      await page.close();
      assert.deepEqual(errors, [], 'browser runtime errors during natural battle');
    }
    assert.equal(results.length, 2 * count);
    const summary = {
      type, commit: process.env.C_FIELD_SHA || 'local', count, limit,
      arms: Object.fromEntries(['off', 'on'].map(arm => {
        const a = results.filter(x => x.arm === arm);
        const sum = key => a.reduce((n, x) => n + (Number(x[key]) || 0), 0);
        return [arm, {
          ambush: sum('ambush'), prepared: sum('prepared'),
          maneuvers: sum('maneuvers'), bounds: sum('bounds'),
          coveredArrivals: sum('coveredArrivals'),
          supportFireDuringMove: sum('supportFireDuringMove'),
          quietReportSamples: sum('quietReportSamples'),
          precontactCleanSamples: sum('precontactCleanSamples'),
          pressureSamples: sum('pressureSamples'), reports: sum('reportSamples'),
          shots: sum('shots'), writerConflicts: sum('writerConflicts'),
          wallSeconds: +a.reduce((n, x) => n + x.wallSeconds, 0).toFixed(2)
        }];
      })),
      results
    };
    fs.writeFileSync(dir + '/' + type + '.json', JSON.stringify(summary, null, 2));
    console.log('PHASE_C_NATURAL_FIELD ' + JSON.stringify({
      type, count, off: summary.arms.off, on: summary.arms.on
    }));
    assert.equal(summary.arms.off.ambush + summary.arms.off.maneuvers, 0, 'OFF arm remains inert');
    assert.equal(summary.arms.on.writerConflicts, 0, 'new tactical behavior cannot create writer conflicts');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
