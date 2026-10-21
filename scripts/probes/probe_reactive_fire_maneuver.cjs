'use strict';
// One immutable hosted natural battle plus lifecycle QA. Paired/multi-seed
// outcome comparisons belong exclusively to the GitHub standard benchmark.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { requestPreview } = require('./preview_request.cjs');
const head = process.env.AI_SKILLS_SHA;
assert.match(head || '', /^[a-f0-9]{40}$/);
(async () => {
  const out = 'reports/reactive-fire-maneuver';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.AI_SKILLS_CHROMIUM,
    proxy: process.env.AI_SKILLS_PROXY ? { server: process.env.AI_SKILLS_PROXY } : undefined,
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox'
    ]
  });
  try {
    const page = await browser.newPage({ ignoreHTTPSErrors: true });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    const wav = Buffer.alloc(46);
    wav.write('RIFF');
    wav.writeUInt32LE(38, 4);
    wav.write('WAVEfmt ', 8);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(22050, 24);
    wav.writeUInt32LE(44100, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write('data', 36);
    wav.writeUInt32LE(2, 40);
    await page.route(/\/Assets\/audio\/.*\.mp3(?:\?.*)?$/, r =>
      r.fulfill({ status: 200, contentType: 'audio/wav', body: wav })
    );
    const launcher =
      'https://test.ivandpopov.com/grasstex/preview.php?ref=' + encodeURIComponent(process.env.AI_SKILLS_REF);
    const response = await requestPreview(page.context(), launcher);
    assert.equal(response.status(), 302);
    const url = new URL(response.headers().location, launcher);
    assert.ok(url.pathname.includes('ref-' + head.slice(0, 12)));
    for (const [k, v] of new URLSearchParams(
      'seed=phase-c-natural-20261012-0002&log=0&localPlan=1&localResources=1&localAmbush=1&localManeuver=1&coveredBounds=1&reactiveFireManeuver=1'
    ))
      url.searchParams.set(k, v);
    await page.goto(url.href, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => window.__battle__ && window.BattleAISquadAdapter, null, {
      timeout: 180000
    });
    const report = await page.evaluate(async expected => {
      const b = __battle__,
        E = BattleEngagement,
        S = BattleSquadStability,
        R = BattleReactiveFireManeuver;
      if (BATTLE_PREVIEW.sha !== expected || !R.on) throw Error('preview SHA or activation mismatch');
      b.paused = true;
      b.timeScale = 1;
      b.timeLimit = 600;
      const scenario = window.__scenario__;
      const evidence = {
        sha: expected,
        url: location.href,
        seed: b.seed,
        authorized: 0,
        adopted: 0,
        completed: 0,
        supportShotsDuringMovement: 0,
        successiveSquads: 0,
        denials: {},
        holds: {},
        bounds: [],
        runtimeErrors: []
      };
      const active = new Map(),
        leases = new WeakSet(),
        completed = new Map();
      let commandAcc = 0;
      const original = b.onFire;
      b.onFire = function (s) {
        for (const [man, row] of active)
          if (man.squad === s.squad && man !== s && man.moving && E.stateOf(man).state === 'bound') {
            row.supportShots++;
            evidence.supportShotsDuringMovement++;
            break;
          }
        return original.apply(this, arguments);
      };
      const observe = () => {
        for (const f of ['us', 'ge'])
          for (const q of b.factions[f].squads) {
            const lease = BattleLeases.get(q, 'bound');
            if (lease && lease.data && lease.data.reactiveFireManeuver && !leases.has(lease)) {
              leases.add(lease);
              evidence.authorized++;
            }
            for (const man of q.members) {
              const e = E.stateOf(man);
              if (
                e.state === 'bound' &&
                e.moveReason === 'authorized fireteam bound: cover' &&
                !active.has(man)
              ) {
                evidence.adopted++;
                active.set(man, {
                  id: man.id,
                  squad: q.id,
                  team: man._fireteamKey,
                  leaseAt: lease && lease.since,
                  at: b.time,
                  start: { x: man.root.position.x, z: man.root.position.z },
                  goal: e.cover && { x: e.cover.x, z: e.cover.z },
                  supportShots: 0
                });
              }
            }
          }
        for (const [man, row] of active) {
          const e = E.stateOf(man),
            d = row.goal && Math.hypot(man.root.position.x - row.goal.x, man.root.position.z - row.goal.z);
          if (d < 0.45 || man.dead || e.state !== 'bound') {
            row.end = b.time;
            row.metres = Math.hypot(man.root.position.x - row.start.x, man.root.position.z - row.start.z);
            row.arrived = d < 0.45 && row.metres > 0.75;
            row.reason = man.dead ? 'casualty' : e.state;
            if (row.arrived) {
              evidence.completed++;
              if (!completed.has(row.squad)) completed.set(row.squad, new Set());
              completed.get(row.squad).add(row.leaseAt);
            }
            if (evidence.bounds.length < 500) evidence.bounds.push(row);
            active.delete(man);
          }
        }
      };
      try {
        for (let i = 0; i < 4000 && !b.winner; i++) {
          b._trainerStepActive = true;
          try {
            b.step(0.15);
          } finally {
            b._trainerStepActive = false;
          }
          commandAcc += 0.15;
          while (commandAcc >= 0.45 - 1e-9 && !b.winner) {
            commandAcc -= 0.45;
            BattleCommanderAI.update(b, scenario, 0.45);
          }
          observe();
          if (i % 10 === 0) {
            for (const f of ['us', 'ge'])
              for (const q of b.factions[f].squads) {
                const report = { fireSupport: q.members.filter(s => E.supportReady(s, b)) },
                  task = q._localTask;
                // Report is the native Micro report; only read policy/route decisions.
                let why = !q.inContact
                  ? 'no-contact'
                  : !task
                    ? 'no-local-task'
                    : !R.canTask(q, task.inputs)
                      ? 'task:' + task.kind
                      : R.supporters(b, q, report, []).length < 2
                        ? 'no-effective-support'
                        : 'eligible';
                evidence.denials[why] = (evidence.denials[why] || 0) + 1;
                if (why === 'eligible')
                  for (const team of ['alpha', 'bravo', 'charlie']) {
                    const movers = q.members.filter(
                      s => s._fireteamKey === team && !SquadAI.isMachineGun(s) && !s.dead
                    );
                    const gate = R.assessTeam(b, q, movers, report);
                    evidence.holds[gate.reason] = (evidence.holds[gate.reason] || 0) + 1;
                  }
              }
          }
          if (i % 100 === 0) await new Promise(resolve => setTimeout(resolve, 0));
        }
      } finally {
        b.paused = true;
        b.onFire = original;
      }
      evidence.time = b.time;
      evidence.winner = b.winner;
      evidence.successiveSquads = [...completed.values()].filter(n => n.size > 1).length;
      return evidence;
    }, head);
    report.errors = errors;
    fs.writeFileSync(`${out}/natural.json`, JSON.stringify(report, null, 2));
    await page.screenshot({ path: `${out}/natural.png` });
    console.log('REACTIVE_NATURAL_RESULT', JSON.stringify(report));
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
