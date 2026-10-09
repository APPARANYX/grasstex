/* Hosted battle-player grenade smoke test. Drives the real settings, RMB, G and LMB handlers
 * (G chooses the grenade, RMB shows the arc, LMB throws), then steps the shipping simulation to
 * inspect release/fuse/burst. The fixture relocates one
 * soldier to an open throwing lane; it never invokes playerThrow or writes grenade inventory.
 * GRENADE_PLAYER_URL selects a hosted preview; GRENADE_PLAYER_OUT keeps JSON/screenshots.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');

const URL_ =
  process.env.GRENADE_PLAYER_URL ||
  'https://test.ivandpopov.com/grasstex/preview/issue409-grenade-vertical-slice/battle_sim.php?seed=grenade-player-smoke';
const OUT = path.resolve(process.env.GRENADE_PLAYER_OUT || path.join(os.tmpdir(), 'grenade-player'));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--ignore-certificate-errors',
      '--no-sandbox'
    ]
  });
  const pageErrors = [],
    consoleErrors = [],
    failedRequests = [],
    summary = { requestedUrl: URL_, screenshots: [], pageErrors, consoleErrors, failedRequests };
  try {
    const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => pageErrors.push(String(e && e.stack ? e.stack : e)));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('response', response => {
      if (response.status() >= 400) failedRequests.push({ status: response.status(), url: response.url() });
    });
    // A probe is not a real match: prevent telemetry, learning and policy writes.
    await page.route('**/*', route => {
      const request = route.request();
      if (request.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(request.url()))
        return route.fulfill({ json: {} });
      return route.continue();
    });
    const response = await page.goto(URL_, { waitUntil: 'load', timeout: 180000 });
    assert.ok(response && response.ok(), 'hosted preview page must load successfully');
    await page.waitForFunction(
      () => window.__battle__ && window.BattleGrenades && window.BattleDesktopCamera?.current,
      null,
      { timeout: 180000 }
    );
    await page.waitForFunction(() => document.getElementById('loading')?.classList.contains('done'), null, {
      timeout: 180000
    });
    summary.finalUrl = page.url();
    summary.fixture = await page.evaluate(() => {
      const b = __battle__;
      b.pause();
      b.scene.getEngine().stopRenderLoop();
      b._trainerStepActive = true; // scene.render must not advance the fixed clock between probe steps.
      b.setTimeScale(1);
      b.paused = false; // The normal preview intentionally reports a paused battle as unavailable.
      const s = b.factions.us.squads[0].members[0];
      let lane;
      for (const x of [-850, -700, -550, 550, 700, 850]) {
        for (const z of [-400, -250, 250, 400]) {
          s.root.position.set(x, b.heightAt(x, z), z);
          s.root.rotation.y = 0;
          const preview = BattleGrenades.preview(s, b, { x, z: z + 30 });
          if (preview?.legal) {
            lane = { x, z, to: preview.to };
            break;
          }
        }
        if (lane) break;
      }
      if (!lane) throw new Error('No open lane found for the controlled player throw');
      window.__grenadePlayerProbe = { soldier: s, initialCount: BattleGrenades.count(s) };
      b.pause();
      return {
        soldier: s.id,
        faction: s.faction,
        lane,
        count: BattleGrenades.count(s),
        imported: !!s._fbx,
        enabled: BattleGrenades.on(),
        build: window.BATTLE_BUILD_DEPLOYED || null,
        preview: window.BATTLE_PREVIEW || null
      };
    });
    assert.equal(summary.fixture.enabled, true, 'grenades must be on by default in the staged runtime');
    assert.ok(summary.fixture.count > 0);

    // Deploy through the shipping settings UI; the fixture selected the first live US soldier.
    await page.keyboard.press('o');
    await page.locator('#bpmFaction').selectOption('us');
    await page.locator('#bpmSquad').selectOption('0');
    await page.locator('#bpmSoldier').selectOption('0');
    await page.locator('#bpmApply').click();
    await page.evaluate(() => {
      const { soldier } = __grenadePlayerProbe;
      if (!soldier.isPlayer) throw new Error('DEPLOY did not enter actual player possession');
      __battle__.paused = false;
      __battle__.scene.render();
      window.__grenadeInputLog = [];
      document.addEventListener(
        'mousedown',
        event => {
          __grenadeInputLog.push({ type: event.type, button: event.button, target: event.target.id });
        },
        true
      );
    });
    await page.mouse.move(760, 420);
    await page.mouse.down({ button: 'right' });
    // Chromium over CDP delivers pointerdown/contextmenu but not the compatibility mousedown (the
    // Babylon canvas cancels pointerdown). Deliver that one event to the shipping canvas handler.
    const deliver = button =>
      page.evaluate(button => {
        const delivered = __grenadeInputLog.some(e => e.type === 'mousedown' && e.button === button);
        if (!delivered)
          document
            .getElementById('renderCanvas')
            .dispatchEvent(new MouseEvent('mousedown', { button, bubbles: true, cancelable: true }));
        return !delivered;
      }, button);
    summary.syntheticMouseDown = { right: await deliver(2) };
    await page.evaluate(() => __battle__.scene.render());
    const overlay = () =>
      page.evaluate(() => {
        const svg = document.getElementById('battlePlayerGrenadePreview'),
          path = svg?.querySelector('path'),
          landing = svg?.querySelector('circle'),
          label = svg?.querySelector('text');
        return {
          camera: __battle__.scene.activeCamera.name,
          visible: !!svg && getComputedStyle(svg).display !== 'none',
          arc: path?.getAttribute('d'),
          color: path?.getAttribute('stroke'),
          landingVisible: !!landing && getComputedStyle(landing).display !== 'none',
          label: label?.textContent,
          hud: document.getElementById('battlePlayerGrenades')?.textContent,
          hint: document.getElementById('cameraHint')?.textContent,
          inputLog: __grenadeInputLog,
          mouseTarget: document.elementFromPoint(760, 420)?.id,
          pointerLock: document.pointerLockElement?.id
        };
      });
    summary.aimWithRifle = await overlay();
    assert.equal(summary.aimWithRifle.camera, 'playerCam');
    assert.equal(summary.aimWithRifle.visible, false, 'aiming with the rifle must not draw a grenade arc');
    assert.match(summary.aimWithRifle.hud, /G \/ RB SELECT/);

    // G chooses the grenade; only then does aim mode show the arc.
    await page.keyboard.press('g');
    await page.evaluate(() => __battle__.scene.render());
    summary.aim = await overlay();
    await screenshot(page, summary, 'aim-preview');
    assert.equal(summary.aim.visible, true, 'a chosen grenade must show the shipping arc in aim mode');
    assert.match(summary.aim.hud, /SELECTED/);
    assert.match(summary.aim.arc, /M.*L/, 'the projected arc must contain visible segments');
    assert.equal(summary.aim.color, '#f5d789', 'the selected lane must have a legal throw');
    assert.equal(summary.aim.landingVisible, true);
    assert.match(summary.aim.label, /m.*grenade/);

    // Fire is the throw. Hold it down: one press must make exactly one throw.
    await page.mouse.down({ button: 'left' });
    summary.syntheticMouseDown.left = await deliver(0);
    await page.evaluate(() => __battle__.scene.render());
    summary.windup = await page.evaluate(() => {
      const b = __battle__,
        s = __grenadePlayerProbe.soldier,
        plan = BattleGrenades.pendingOf(s, b);
      return {
        pending: !!plan,
        releaseAt: plan?.releaseAt,
        at: b.time,
        count: BattleGrenades.count(s),
        throws: BattleGrenades.summary(b).throws,
        hud: document.getElementById('battlePlayerGrenades')?.textContent
      };
    });
    assert.equal(summary.windup.pending, true, 'fire must enter the real grenade commitment owner');
    assert.equal(summary.windup.count, summary.fixture.count, 'windup must retain carried inventory');
    assert.equal(summary.windup.throws, 0);
    assert.match(summary.windup.hud, /THROWING/);
    await screenshot(page, summary, 'windup');

    await advance(page, summary.windup.releaseAt + 0.01);
    await page.evaluate(() => __battle__.scene.render());
    summary.release = await page.evaluate(() => {
      const b = __battle__,
        s = __grenadePlayerProbe.soldier,
        g = BattleGrenades.projectiles(b).find(g => g.by === s.id);
      return {
        at: b.time,
        count: BattleGrenades.count(s),
        pending: !!BattleGrenades.pendingOf(s, b),
        throws: BattleGrenades.summary(b).throws,
        live: !!g,
        releasedAt: g?.releasedAt,
        detonateAt: g?.detonateAt,
        position: g && BattleGrenades.position(g, b.time),
        hud: document.getElementById('battlePlayerGrenades')?.textContent
      };
    });
    assert.equal(summary.release.count, summary.fixture.count - 1, 'release consumes exactly one grenade');
    assert.equal(summary.release.pending, false);
    assert.equal(summary.release.throws, 1, 'a held fire button cannot release another grenade');
    assert.equal(summary.release.live, true);
    assert.match(summary.release.hud, /FUSE \d+\.\d s/);
    await screenshot(page, summary, 'flight-fuse');

    await advance(page, summary.release.detonateAt + 0.01);
    summary.burst = await page.evaluate(() => {
      const b = __battle__,
        s = __grenadePlayerProbe.soldier;
      return {
        at: b.time,
        count: BattleGrenades.count(s),
        stats: BattleGrenades.summary(b),
        live: BattleGrenades.projectiles(b).filter(g => g.by === s.id).length,
        hud: document.getElementById('battlePlayerGrenades')?.textContent
      };
    });
    assert.equal(summary.burst.stats.throws, 1);
    assert.equal(summary.burst.stats.bursts, 1);
    assert.equal(summary.burst.count, summary.fixture.count - 1);
    assert.equal(summary.burst.live, 0);
    await screenshot(page, summary, 'post-burst');
    await page.mouse.up({ button: 'left' });
    await page.mouse.up({ button: 'right' });
    await page.keyboard.press('v');
    assert.equal(await page.evaluate(() => __grenadePlayerProbe.soldier.isPlayer), false);
    assert.deepEqual(pageErrors, [], 'hosted player flow must not throw browser runtime errors');
    assert.ok(
      !consoleErrors.some(message => /\[MODULE\].*failed/.test(message)),
      'simulation hooks must not fail'
    );
    summary.pass = true;
    console.log('PASS hosted player grenade UI: real DEPLOY, G chooses, RMB shows the arc, LMB throws once, count/fuse and burst');
  } catch (error) {
    summary.pass = false;
    summary.failure = String(error && error.stack ? error.stack : error);
    console.error(summary.failure);
    process.exitCode = 1;
  } finally {
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));
    await browser.close();
  }
})();

async function advance(page, until) {
  await page.evaluate(until => {
    const b = __battle__;
    while (b.time < until && !b.winner) b.step(0.15);
    if (b.winner) throw new Error('The controlled player smoke fixture ended before the grenade burst');
    b.scene.render();
  }, until);
}
async function screenshot(page, summary, label) {
  const file = path.join(OUT, label + '.png');
  await page.screenshot({ path: file });
  summary.screenshots.push(file);
}
