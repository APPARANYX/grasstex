'use strict';
/* One natural preview replay plus a named contact fixture. No A/B workload here: paired evidence
   belongs to the standard benchmark. Shipping perception/command/fire/geometry owners stay intact. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { requestPreview } = require('./preview_request.cjs');
(async () => {
  const dir = 'closeups/tactical-contact';
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });
  const errors = [],
    failed = [];
  let evidence = {};
  try {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 960 } });
    let url;
    if (process.env.TACTICAL_DIRECT_PREVIEW) {
      url = new URL(process.env.TACTICAL_DIRECT_PREVIEW);
      const meta = await ctx.request.get(new URL('preview.json', url).href);
      assert.equal(meta.status(), 200);
      assert.equal(
        (await meta.json()).sha,
        process.env.TACTICAL_SHA,
        'preview loader/runtime must share the exact head'
      );
    } else {
      const res = await requestPreview(ctx, process.env.TACTICAL_PREVIEW);
      assert.equal(res.status(), 302, (await res.text()).slice(-1000));
      url = new URL(res.headers().location, process.env.TACTICAL_PREVIEW);
      assert.ok(url.pathname.includes('ref-' + process.env.TACTICAL_SHA.slice(0, 12)));
    }
    evidence.source = { sha: process.env.TACTICAL_SHA, url: url.href, loader: 'branch preview' };
    url.searchParams.set('tacticalController', 'new');
    url.searchParams.set('seed', 'controller-contact-20261026');
    url.searchParams.set('pinSeed', '1');
    url.searchParams.set('strategicInterception', '0');
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(String(e.stack || e)));
    page.on('requestfailed', r => failed.push({ url: r.url(), error: r.failure()?.errorText }));
    await page.goto(url.href, { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction(() => window.__battle__ && window.BattleTacticalContactSkills, null, {
      timeout: 180000
    });
    await page.locator('#startBtn').click();
    await page.waitForFunction(() => __battle__.factions.us.squads.length > 0, null, { timeout: 120000 });
    evidence.natural = await page.evaluate(() => {
      const b = __battle__,
        TC = BattleTacticalController;
      b.pause();
      const initial = TC.summary(b),
        started = b.time;
      let shots = 0;
      const fire = b.onFire;
      b.onFire = function (...args) {
        shots++;
        return fire?.apply(this, args);
      };
      b._trainerStepActive = true;
      try {
        for (let i = 0; i < 800 && !b.winner; i++) {
          b.paused = false;
          b.step(0.15);
          b._liveCommanderTick?.(0.15);
          b.paused = true;
        }
      } finally {
        b._trainerStepActive = false;
        b.onFire = fire;
        b.pause();
      }
      const census = BattleTacticalMarchProvider.summary(b),
        summary = TC.summary(b);
      const conflicts = [];
      const held = new Set();
      for (const a of summary.live || []) {
        if (a.actorId === null || a.capability === 'combat.march') continue;
        const key = a.squad + ':' + a.actorId;
        if (held.has(key)) conflicts.push(key);
        held.add(key);
      }
      return {
        seed: 'controller-contact-20261026',
        step: 0.15,
        seconds: b.time - started,
        shots,
        initial,
        summary,
        census,
        conflicts
      };
    });
    assert.ok(evidence.natural.initial.new > 0, 'flag is active');
    assert.equal(evidence.natural.summary.stats.faults, 0);
    assert.equal(evidence.natural.summary.pending, 0);
    assert.deepEqual(evidence.natural.conflicts, []);
    await page.screenshot({ path: dir + '/natural.png' });
    evidence.fixture = await page.evaluate(() => {
      const b = __battle__,
        E = BattleEngagement,
        A = SquadAI,
        TC = BattleTacticalController;
      b.restart();
      b.pause();
      b.time = 20;
      const q = b.factions.ge.squads[0],
        rifle = q.members.find(s => s.role === 'rifleman'),
        target = b.factions.us.squads[0].members[2];
      q.state = 'advance';
      q.commandPhase = 'assault';
      const activation = TC.requestMode(b, q, 'new', 'march');
      if (!activation.ok) throw Error('staged guarded activation refused: ' + activation.reason);
      let lane = null;
      for (const z of [-400, -300, -200, 0, 200, 300, 400]) {
        for (const x of [-700, -400, 0, 400, 700]) {
          rifle.root.position.set(x, b.heightAt(x, z), z);
          target.root.position.set(x, b.heightAt(x, z + 100), z + 100);
          rifle.prone = false;
          rifle.crouching = false;
          rifle.tacticalCrouch = false;
          if (
            BattleNavigation.movementClear(rifle.root.position, rifle.root.position) &&
            A.hasLineOfSight(rifle, target, b.heightAt, b.obstacles) &&
            !BattleDirectFireLOSGate.blockReason(Object.assign(rifle, { target }), b)
          ) {
            lane = { x, z };
            break;
          }
        }
        if (lane) break;
      }
      if (!lane) throw Error('fixture needs a real clear 100m firing lane');
      q.members.forEach((s, i) => {
        s.root.position.set(lane.x + (i - 3) * 0.8, b.heightAt(lane.x + (i - 3) * 0.8, lane.z), lane.z);
        s.root.rotation.y = 0;
        s.moving = false;
        s.moveSpeed = 0;
        s.suppressedUntil = 0;
      });
      const samples = [];
      let shots = 0;
      const fire = b.onFire;
      b.onFire = function (s, ...args) {
        if (s.squad === q) shots++;
        return fire?.call(this, s, ...args);
      };
      try {
        for (let i = 0; i < 80; i++) {
          b.time = 20 + i * 0.15;
          q.members.forEach(s => {
            s.target = target;
            s.moving = false;
            s.moveSpeed = 0;
            A.rememberSeen(s, target, b, true, 'staged-contact');
            A.tickFireCooldown(s, 0.15);
          });
          q.contact = {
            unit: target,
            x: target.root.position.x,
            z: target.root.position.z,
            at: b.time,
            firstHandAt: b.time,
            seenBy: rifle.id,
            stance: 'stand'
          };
          BattleSquadStability.fireAndMovement(q, b);
          TC.dispatch(b, q, 'squadCommand');
          q.members.forEach(s => {
            E.updateSoldier(s, b);
            BattleMovementResolver.resolve(s, b);
          });
          if (i % 10 === 0)
            samples.push({
              at: b.time,
              fire: q.fireControl?.state,
              contact: BattleTacticalContactSkills.summary(q)
            });
        }
      } finally {
        b.onFire = fire;
      }
      const before = TC.summary(b),
        owned = (before.live || []).filter(a => a.squad === q.id).length;
      q.state = 'retreat';
      q.commandPhase = 'retreat';
      TC.dispatch(b, q, 'fireAndMovement', { underFire: 1 });
      TC.dispatch(b, q, 'squadCommand');
      const after = TC.summary(b),
        retreatActions = (after.live || []).filter(a => a.squad === q.id).length;
      const screen = { shots, lane, samples, before, owned, retreatActions, fireAfterRetreat: q.fireControl };
      b.restart();
      b.pause();
      screen.restart = TC.summary(b);
      return screen;
    });
    assert.ok(evidence.fixture.samples.some(s => s.fire === 'hold'));
    assert.ok(evidence.fixture.samples.some(s => s.fire === 'open'));
    assert.ok(evidence.fixture.shots > 0, 'real owner discharge');
    assert.equal(evidence.fixture.before.stats.faults, 0);
    assert.equal(evidence.fixture.retreatActions, 0);
    assert.equal(evidence.fixture.fireAfterRetreat, null);
    assert.equal(evidence.fixture.restart.actions, 0);
    assert.equal(evidence.fixture.restart.pending, 0);
    await page.screenshot({ path: dir + '/contact.png' });
    assert.deepEqual(errors, []);
    console.log('TACTICAL_CONTACT_ACCEPTANCE', JSON.stringify(evidence));
  } finally {
    fs.writeFileSync(dir + '/evidence.json', JSON.stringify({ ...evidence, errors, failed }, null, 2));
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
