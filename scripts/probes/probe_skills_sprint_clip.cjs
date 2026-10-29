#!/usr/bin/env node
'use strict';
/*
 * Observe the real native 120 m Skills Lab, without changing a single order,
 * stance, velocity, clip or animation clock. Connect each actual AI gait to
 * the lower-body FBX clip selected on the SAME fixed simulation step.
 *
 * NODE_ENV=... node scripts/probes/probe_skills_sprint_clip.cjs
 * SPRINT_LAB_URL defaults to the CI localhost battle_sim_local.php.
 * SPRINT_MODES=autonomous,purposeful; SPRINT_SECONDS=210; SPRINT_SEED=skills-range-0001
 *
 * Unlike the older generic probe_gait_clips.cjs, this uses the battle's
 * native fixed Commander/Meso clock (identical to BattleSkillsLab.advance).
 * The top lower-body mixer entry is the selected FBX; w is its blend weight.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

const BASE = process.env.SPRINT_LAB_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const MODES = (process.env.SPRINT_MODES || 'autonomous,purposeful').split(',').map(s => s.trim()).filter(Boolean);
const SEED = process.env.SPRINT_SEED || 'skills-range-0001';
const SECONDS = Number(process.env.SPRINT_SECONDS || 210);
const OUT = process.env.SPRINT_OUT || 'reports/sprint-clip-audit';
assert.ok(SECONDS >= 20 && SECONDS <= 240, 'SPRINT_SECONDS must be 20..240');
assert.ok(MODES.length && MODES.every(m => ['autonomous', 'purposeful', 'baseline'].includes(m)),
  'SPRINT_MODES must contain supported movement arms');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    args: ['--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-webgl',
      '--ignore-gpu-blocklist', '--no-sandbox']
  });
  const summaries = [];
  try {
    for (const mode of MODES) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 820 }, ignoreHTTPSErrors: true });
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      const params = new URLSearchParams({
        skillsLab: '1', combatLab: '1', tacticalController: 'new', labDistance: '120',
        labCover: 'mixed', labRange: '1', seed: SEED, pinSeed: '1', labDuration: String(SECONDS),
        labMove: mode, stressAct: '0', strategicInterception: '0'
      });
      const url = BASE + (BASE.includes('?') ? '&' : '?') + params;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 150000 });
        await page.waitForFunction(() => {
          const b = window.__battle__, l = window.BattleSkillsLab;
          return !!(b && l && l.snapshot() && l.snapshot().targetCount === 10);
        }, null, { timeout: 150000 });
        await page.waitForFunction(() => {
          const b = window.__battle__, us = b && b._roster && b._roster.us;
          return !!(us && us.length && us.every(s =>
            s._fbx && s._fbx.lib && s._fbx.lib.clips && s._fbx.lib.clips.sprint0));
        }, null, { timeout: 150000 });

        const initial = await page.evaluate(({ maxSeconds }) => {
          const sim = window.__battle__, lab = window.BattleSkillsLab;
          const roster = sim._roster.us;
          if (!sim._fixedClock) throw new Error('Native fixed clock absent; cannot verify command/tactical parity');
          const clips = roster.map(s => {
            const f = s._fbx;
            return {
              id: s.id, role: s.role, weapon: s.weapon && s.weapon.kind,
              model: f.file || f.model || f.lib.file || null,
              naturalSpeed: Object.fromEntries(['walk0', 'run0', 'sprint0', 'crouchRun0']
                .filter(key => f.lib.clips[key]).map(key => [key, +f.lib.clips[key].speed.toFixed(3)]))
            };
          });
          window.__sprintClipAudit = {
            maxSeconds, tick: 0.15, ticks: 0, firstVisual: null, episodes: [],
            lastGait: {}, examples: [], totals: {}, byGait: {}, byFamily: {},
            sprint: { ticks: 0, withFbx: 0, noFbx: 0, familySprint: 0,
              clipSprint: 0, visibleSprint: 0, fastTicks: 0, fastNonSprintClip: 0 },
            clips, captures: 0
          };
          sim.pause();
          return { start: +sim.time.toFixed(3), roster: clips, lab: {
            controller: lab.snapshot().controller,
            movementPace: lab.snapshot().movementPace,
            rangeDistanceM: lab.snapshot().rangeDistanceM,
            coverLayout: lab.snapshot().coverLayout,
            seed: lab.snapshot().seed
          }};
        }, { maxSeconds: SECONDS });
        assert.equal(initial.lab.controller, 'new');
        assert.equal(initial.lab.movementPace, mode);
        assert.equal(initial.lab.rangeDistanceM, 120);
        assert.equal(initial.lab.coverLayout, 'mixed');
        assert.ok(initial.roster.length > 0);

        let captured = false;
        let last = null;
        for (let batch = 0; batch < Math.ceil(SECONDS / 0.15 / 60) + 3; batch++) {
          last = await page.evaluate(({ stopOnVisual }) => {
            const b = window.__battle__, a = window.__sprintClipAudit;
            const increment = (o, k) => { o[k] = (o[k] || 0) + 1; };
            let visual = null;
            const previous = b.time;
            b.pause();
            b.setTimeScale(1);
            b.resume();
            for (let i = 0; i < 60 && b.time + 0.00001 < a.maxSeconds && !b.winner; i++) {
              const before = b.time;
              b._fixedClock.advance(a.tick);
              if (b.time < before + 0.05) break;
              a.ticks++;
              for (const s of b._roster.us) {
                if (s.dead) continue;
                const gait = s._locomotionGait || 'unset';
                const fx = s._fbx;
                const top = fx && fx.lower && fx.lower.entries[fx.lower.entries.length - 1];
                const family = fx ? (fx.family || 'none') : 'no-fbx';
                if (a.lastGait[s.id] !== gait) {
                  if (gait === 'sprint' && a.episodes.length < 120) {
                    a.episodes.push({
                      t: +b.time.toFixed(2), soldier: s.id, role: s.role,
                      state: s.eng && s.eng.state, stance: s.prone ? 'prone' : s.crouching ? 'crouch' : 'stand',
                      goal: s._movementResolver && s._movementResolver.goal && s._movementResolver.goal.kind,
                      reason: s.eng && s.eng.moveReason
                    });
                  }
                  a.lastGait[s.id] = gait;
                }
                if (!s.moving) continue;
                increment(a.totals, gait);
                increment(a.byGait, gait + ':' + family);
                if (gait !== 'sprint') continue;
                a.sprint.ticks++;
                if (!fx || !top) { a.sprint.noFbx++; continue; }
                a.sprint.withFbx++;
                increment(a.byFamily, family);
                const expected = fx.lib.clips['sprint' + fx.sector];
                const clipSprint = !!(expected && top.clip === expected);
                if (family === 'sprint') a.sprint.familySprint++;
                if (clipSprint) a.sprint.clipSprint++;
                if (clipSprint && top.w >= 0.6) a.sprint.visibleSprint++;
                const fast = fx.speed >= 5.2;
                if (fast) {
                  a.sprint.fastTicks++;
                  if (!clipSprint && fx.weaponKind !== 'pistol') a.sprint.fastNonSprintClip++;
                }
                const sample = {
                  t: +b.time.toFixed(2), soldier: s.id, role: s.role,
                  gait, state: s.eng && s.eng.state,
                  stance: s.prone ? 'prone' : s.crouching ? 'crouch' : 'stand',
                  goal: s._movementResolver && s._movementResolver.goal && s._movementResolver.goal.kind,
                  family, sector: fx.sector, topClip: top.clip && top.clip.key,
                  topWeight: +top.w.toFixed(2), topRate: +top.rate.toFixed(2),
                  animationSpeed: +fx.speed.toFixed(2),
                  commandedGroundSpeed: +(s._locomotionGroundSpeed || 0).toFixed(2),
                  worldMoveSpeed: +(s.moveSpeed || 0).toFixed(2),
                  clipSprint, weaponKind: fx.weaponKind,
                  x: +s.root.position.x.toFixed(2), z: +s.root.position.z.toFixed(2)
                };
                if (a.examples.length < 100 && (a.examples.length < 25 || fast || !clipSprint))
                  a.examples.push(sample);
                if (stopOnVisual && !a.firstVisual && clipSprint && top.w >= 0.6 &&
                    fx.speed >= 4.5 && (s.eng && s.eng.state === 'bound')) {
                  a.firstVisual = sample;
                  const camera = b.scene.activeCamera;
                  if (camera && typeof camera.setTarget === 'function') {
                    camera.setTarget(new BABYLON.Vector3(s.root.position.x, s.root.position.y + 1.1, s.root.position.z));
                    if ('radius' in camera) camera.radius = 15;
                    if ('beta' in camera) camera.beta = 1.15;
                  }
                  visual = sample;
                  break;
                }
              }
              if (visual) break;
            }
            b.pause();
            return { time: +b.time.toFixed(2), delta: +(b.time - previous).toFixed(2),
              visual, ticks: a.ticks, done: !!(b.winner || b.time + 0.001 >= a.maxSeconds),
              sprintTicks: a.sprint.ticks };
          }, { stopOnVisual: !captured });
          if (last.visual && !captured) {
            await page.evaluate(() => window.__battle__.scene.render());
            await page.screenshot({ path: OUT + '/' + mode + '-first-actual-bound-sprint.png' });
            captured = true;
            console.log('SPRINT_FRAME ' + mode + ' ' + JSON.stringify(last.visual));
          }
          if (last.done) break;
          if (last.delta <= 0) throw new Error(mode + ' simulation clock stopped at ' + last.time);
        }
        const result = await page.evaluate(() => {
          const a = window.__sprintClipAudit, lab = window.BattleSkillsLab.snapshot();
          return {
            mode: lab.movementPace, time: +window.__battle__.time.toFixed(2),
            tickSeconds: a.tick, elapsedTicks: a.ticks,
            sampleMeaning: 'one moving US soldier per 0.15 simulated seconds; not distinct sprints',
            sprint: a.sprint, allMovingGaits: a.totals, gaitToClipFamilies: a.byGait,
            sprintClipFamilies: a.byFamily, sprintEpisodes: a.episodes,
            sprintSamples: a.examples, firstVisibleBoundSprint: a.firstVisual,
            models: a.clips, physicalGait: lab.gaitTelemetry,
            countUS: window.__battle__._roster.us.length,
            browserErrors: null
          };
        });
        result.browserErrors = errors;
        result.screenshotCaptured = captured;
        fs.writeFileSync(OUT + '/' + mode + '.json', JSON.stringify(result, null, 2));
        assert.ok(result.time >= SECONDS - 0.5, 'full timed tactical lab not reached');
        assert.ok(result.elapsedTicks >= 100, 'insufficient native observations');
        assert.equal(result.countUS, initial.roster.length, 'US roster changed unexpectedly');
        summaries.push({
          mode, simulationSeconds: result.time,
          ...result.sprint,
          screenshot: captured ? mode + '-first-actual-bound-sprint.png' : null,
          clipFamilies: result.sprintClipFamilies, sprintEpisodes: result.sprintEpisodes.length,
          physicalSprint: result.physicalGait?.byGait?.sprint || null,
          firstVisibleBoundSprint: result.firstVisibleBoundSprint,
          browserErrors: errors.length
        });
        console.log('SPRINT_CLIP_RESULT ' + JSON.stringify(summaries[summaries.length - 1]));
      } finally {
        await page.close();
      }
    }
    fs.writeFileSync(OUT + '/summary.json', JSON.stringify({
      sha: process.env.GITHUB_SHA || null, seed: SEED, seconds: SECONDS, summaries
    }, null, 2));
    console.log('PASS read-only native Skills Lab sprint-to-FBX observation ' + SEED);
  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error('SPRINT_CLIP_PROBE_FAILED ' + (err && err.stack || err));
  process.exitCode = 1;
});
