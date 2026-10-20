'use strict';
/* C3 staged shipping-owner contract on the real preview. No natural-battle
   activation claim: isolated actors/target placement and sound-ready callbacks
   are explicit fixture seams; Engagement, range/LOS and schedulers stay native. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { requestPreview } = require('./preview_request.cjs');
(async () => {
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });
  const dir = 'closeups/tactical-observation';
  fs.mkdirSync(dir, { recursive: true });
  try {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1440, height: 960 }
    });
    const res = await requestPreview(context, process.env.TACTICAL_PREVIEW);
    assert.equal(res.status(), 302);
    const url = new URL(res.headers().location, process.env.TACTICAL_PREVIEW);
    assert.ok(url.pathname.includes('ref-' + process.env.TACTICAL_SHA.slice(0, 12)));
    // These seeded urban/cover fixtures belong to the original 2 km scenario.
    url.searchParams.set('strategicInterception', '0');
    url.searchParams.set('seed', 'live-mv5apwx1-djrk');
    url.searchParams.set('pinSeed', '1');
    url.searchParams.set('commandPosture', '0');
    const page = await context.newPage(),
      errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(url.href, { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction(() => window.__battle__ && BattleEngagement.supportReady, null, {
      timeout: 180000
    });
    const evidence = await page.evaluate(() => {
      const b = __battle__,
        E = BattleEngagement,
        A = SquadAI;
      b.pause();
      b.restart();
      b.pause();
      b.time = 20;
      const q = b.factions.ge.squads[0],
        leader = q.members.find(s => s.role === 'sergeant'),
        rifle = q.members.find(s => s.role === 'rifleman'),
        target = b.factions.us.squads[0].members[2];
      q.state = 'advance';
      q.commandPhase = 'assault';
      q.fireControl = null;
      let found = false;
      for (const z of [-400, -300, -200, 0, 200, 300, 400]) {
        for (const x of [-700, -400, 0, 400, 700]) {
          leader.root.position.set(x, b.heightAt(x, z), z);
          rifle.root.position.copyFrom(leader.root.position);
          target.root.position.set(x, b.heightAt(x, z + 151), z + 151);
          leader.root.rotation.y = rifle.root.rotation.y = 0;
          leader.prone = rifle.prone = false;
          leader.crouching = rifle.crouching = false;
          if (
            BattleNavigation.movementClear(leader.root.position, leader.root.position) &&
            A.hasLineOfSight(rifle, target, b.heightAt, b.obstacles) &&
            !BattleDirectFireLOSGate.blockReason(Object.assign(rifle, { target }), b)
          ) {
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) throw Error('fixture needs a real clear 151m firing lane');
      for (const s of [leader, rifle]) {
        s.target = target;
        s.moving = false;
        s.moveSpeed = 0;
        s.crawling = false;
        s.suppressedUntil = 0;
        s.fireCooldown = 0;
        const e = E.stateOf(s);
        e.state = 'engage';
        e.fireReadyAt = 0;
        e.stanceUntil = 100;
        e.reviewAt = 100;
      }
      const range = {
        mp40: A.engageRange(leader),
        kar98k: A.engageRange(rifle),
        garand: A.engageRange(b.factions.us.squads[0].members.find(s => s.role === 'rifleman'))
      };
      const ready = { mp40: E.supportReady(leader, b), kar98k: E.supportReady(rifle, b) };
      E.updateSoldier(leader, b);
      const held = !!(leader._movementResolver?.combat?.kind === 'hold');
      let shots = 0;
      const onFire = b.onFire;
      b.onFire = s => {
        if (s === rifle) shots++;
      };
      E.updateSoldier(rifle, b);
      b.onFire = onFire;
      // Sound-ready seam proves the actual shipping scheduler rechecks state.
      const NativeSound = BABYLON.Sound,
        readyCallbacks = [];
      let played = 0;
      BABYLON.Sound = class {
        constructor(name, url, scene, ready) {
          readyCallbacks.push(ready);
          this.onEndedObservable = { addOnce() {} };
        }
        attachToMesh() {}
        detachFromMesh() {}
        setPosition() {}
        setVolume() {}
        play() {
          played++;
        }
      };
      const ev = BATTLE_AUDIO_MANIFEST.callouts.ge.events;
      const oldFiles = ev.engage;
      ev.engage = ['voices/ge/c3-queued-order-fixture.mp3'];
      const handle = BattleVoiceScheduler.enqueue(leader, 'engage', null);
      if (!handle) throw Error('fresh staged leader order was not accepted');
      leader.eng.state = 'freeze';
      readyCallbacks.forEach(fn => fn());
      const voice = {
        accepted: handle.accepted,
        started: handle.started,
        ended: handle.ended,
        played,
        dazedAllowed: BattleVoiceEligibility.allows(leader, 'dazed'),
        contactAllowed: BattleVoiceEligibility.allows(leader, 'contactFront')
      };
      ev.engage = oldFiles;
      BABYLON.Sound = NativeSound;
      b.restart();
      b.pause();
      const recovered = b.factions.ge.squads[0].members.find(s => s.role === 'sergeant');
      return {
        range,
        ready,
        held,
        shots,
        voice,
        restartAllows: BattleVoiceEligibility.allows(recovered, 'engage'),
        fixture: 'real Navigation/terrain firing lane; staged target/Engagement and sound readiness'
      };
    });
    assert.deepEqual(evidence.range, { mp40: 150, kar98k: 450, garand: 450 });
    assert.deepEqual(evidence.ready, { mp40: false, kar98k: true });
    assert.equal(evidence.held, false);
    assert.ok(evidence.shots > 0);
    assert.equal(evidence.voice.started, false);
    assert.equal(evidence.voice.played, 0);
    assert.equal(evidence.voice.contactAllowed, false);
    assert.equal(evidence.voice.dazedAllowed, true);
    assert.equal(evidence.restartAllows, true);
    await page.screenshot({ path: dir + '/c3-effective-fire.png' });
    fs.writeFileSync(dir + '/c3-effective-fire.json', JSON.stringify({ ...evidence, errors }, null, 2));
    assert.deepEqual(errors, []);
    console.log('C3_BROWSER_ACCEPTANCE', JSON.stringify(evidence));
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
