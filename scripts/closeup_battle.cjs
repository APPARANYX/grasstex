/* In-battle close-up camera: runs a live battle until a soldier matches CLOSEUP_TARGET, pauses the
 * sim and photographs him from several angles. Use it for anything you need to see on a body in a
 * real fight (wound and blood decals, death poses, weapon holds, stance) instead of writing a
 * throwaway probe each time. It steps the sim in fixed 0.15 s ticks (no render loop, like
 * run_m3c_replay.cjs), so it is fast even on a software renderer; it only reads state and moves the
 * camera, and it blocks telemetry/learning/policy writes so it is safe against production.
 *
 * Point it at any page that serves the battle:
 *   local       http://127.0.0.1:8765/grasstex/battle_sim_local.php (default; see AGENTS.md)
 *   production  https://test.ivandpopov.com/grasstex/battle_sim.php
 *   any branch  https://test.ivandpopov.com/grasstex/preview.php?ref=<branch or PR#>
 * Live pages load the hosted textures and FBX soldiers; locally the ground is red and soldiers may
 * be the procedural rig.
 *
 *   CLOSEUP_URL=... CLOSEUP_TARGET=wounded node scripts/closeup_battle.cjs
 *
 * Env:
 *   CLOSEUP_URL     page URL (default local)
 *   CLOSEUP_SEED    battle seed (default closeup)
 *   CLOSEUP_TARGET  casualty (first man down), wounded (alive with a wound or lost hp), stressed (alive and
 *                   rattled or worse, soldier condition), any,
 *                   role:<us|ge>/<role> (e.g. role:ge/gunner), id:<n>. Default casualty.
 *   CLOSEUP_COUNT   how many matching soldiers to photograph (default 1)
 *   CLOSEUP_AFTER   sim seconds to keep running after the first match, e.g. to let a death clip
 *                   finish or blood spread (default 1.5)
 *   CLOSEUP_VIEWS   comma list of front,back,left,right,top,wide (default front,left,back,top)
 *   CLOSEUP_DIST    camera distance in m (default 2.4)
 *   CLOSEUP_WAIT    give up after this many sim seconds (default 240)
 *   CLOSEUP_OUT     output dir (default $TMPDIR/closeup); writes <view>-<id>.png + summary.json
 *   CLOSEUP_UI=1    keep the HUD in the shots (hidden by default)
 *   CLOSEUP_OVERLAY comma list of World Debug layers to switch on before the photos (e.g. composure:
 *                   a ring over every shaken, rattled or broken man, a cross on a frozen one)
 * Exits non-zero if the page throws, never builds a battle, or no soldier matches in time.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {
    const { execSync } = require('node:child_process');
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
}

const URL_ = process.env.CLOSEUP_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SEED = process.env.CLOSEUP_SEED || 'closeup';
const TARGET = process.env.CLOSEUP_TARGET || 'casualty';
const COUNT = Math.max(1, Number(process.env.CLOSEUP_COUNT || 1));
const AFTER = Number(process.env.CLOSEUP_AFTER || 1.5);
const VIEWS = (process.env.CLOSEUP_VIEWS || 'front,left,back,top').split(',').map(v => v.trim()).filter(Boolean);
const DIST = Number(process.env.CLOSEUP_DIST || 2.4);
const WAIT = Number(process.env.CLOSEUP_WAIT || 240);
const OUT = path.resolve(process.env.CLOSEUP_OUT || path.join(os.tmpdir(), 'closeup'));
const SHOW_UI = process.env.CLOSEUP_UI === '1';
const OVERLAY = (process.env.CLOSEUP_OVERLAY || '').split(',').map(v => v.trim()).filter(Boolean);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const fail = [];
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({
    // --ignore-certificate-errors: sandboxes that proxy the CDN with their own CA.
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-webgl',
      '--ignore-gpu-blocklist', '--ignore-certificate-errors', '--no-sandbox'] });
  try {
    const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e && e.stack || e).slice(0, 400)));
    // Presentation draws Math.random (death clip choice, FX variants); seed it so the same seed
    // gives the same photo and branch/main close-ups can be compared. Combat has its own seeded RNG.
    await page.addInitScript(seed => {
      let h = 1779033703 ^ seed.length;
      for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
      let a = h >>> 0;
      Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }, 'closeup:' + SEED);
    // A harness run is not a real battle: never send telemetry, learning or policy writes.
    await page.route('**/*', route => {
      const req = route.request();
      if (req.method() === 'POST' || /battle_(policy|learning|log|metrics)[^/]*\.php/.test(req.url())) return route.fulfill({ json: {} });
      return route.continue();
    });
    // Wall time per phase, so a slow run says where it went (download, FBX parse, sim or render).
    const timings = {}; let lastMark = Date.now();
    const mark = name => { const now = Date.now(); timings[name] = +((now - lastMark) / 1000).toFixed(1); lastMark = now; };
    const url = URL_ + (URL_.includes('?') ? '&' : '?') + 'seed=' + encodeURIComponent(SEED);
    await page.goto(url, { waitUntil: 'load', timeout: 180000 });
    mark('pageLoad');
    const finalUrl = page.url();
    await page.waitForFunction(() => window.__battle__, null, { timeout: 180000 });
    mark('battleBuilt');
    const info = await page.evaluate(() => ({ build: window.BATTLE_BUILD_DEPLOYED || null, preview: window.BATTLE_PREVIEW || null }));
    // Let imported soldiers bind before the fight starts (the backend logs when it is done).
    await page.waitForFunction(() => {
      const r = window.__battle__ && window.__battle__._roster;
      return r && [...r.us, ...r.ge].some(s => s._fbx) || (window.BattleFbxSoldier && window.BattleFbxSoldier.failed);
    }, null, { timeout: 60000 }).catch(() => {});
    mark('soldiersBound');
    await page.getByText('Start battle').first().click().catch(() => {});
    // Fast-forward like scripts/run_m3c_replay.cjs: no render loop, fixed 0.15 s steps with the
    // commander ticked alongside; frames are rendered only for the photos.
    await page.evaluate(() => {
      const b = window.__battle__;
      b.scene.getEngine().stopRenderLoop();
      b.paused = false; b.timeScale = 1; window.__closeupAccum = 0;
    });
    const advance = seconds => page.evaluate(seconds => {
      const b = window.__battle__, C = window.BattleCommanderAI, tick = (C && C.commandTick) || .45;
      const scenario = b.scene.metadata && b.scene.metadata.battleScenario;
      for (let t = 0; t < seconds && !b.winner; t += .15) {
        b.step(.15);
        window.__closeupAccum += .15;
        while (C && window.__closeupAccum + 1e-9 >= tick && !b.winner) { window.__closeupAccum -= tick; C.update(b, scenario, tick); }
      }
      return b.time;
    }, seconds);
    const pick = () => page.evaluate(({ target, count }) => {
      const b = window.__battle__, all = [...b._roster.us, ...b._roster.ge];
      const down = s => s.dead || s.alive === false || s.hp <= 0 || !!s.casualty;
      let test;
      if (target === 'casualty') test = down;
      else if (target === 'wounded') test = s => !down(s) && ((s.wounds && s.wounds.length) || s.hp < s.maxHp);
      else if (target === 'stressed') test = s => !down(s) && !!s.mind && s.mind.band >= 2;
      else if (target === 'any') test = s => !down(s);
      else if (target.startsWith('role:')) { const [f, r] = target.slice(5).split('/'); test = s => s.faction === f && s.role === r && !down(s); }
      else if (target.startsWith('id:')) test = s => s.id === +target.slice(3);
      else return { err: 'unknown CLOSEUP_TARGET ' + target };
      return { time: b.time, winner: b.winner, ids: all.filter(test).slice(0, count).map(s => s.id) };
    }, { target: TARGET, count: COUNT });

    mark('start');
    let found = null;
    for (;;) {
      const r = await pick();
      if (r.err) { fail.push(r.err); break; }
      if (r.ids.length) { found = r; break; }
      if (r.time > WAIT || r.winner) { fail.push(`no soldier matched ${TARGET} by sim ${r.time.toFixed(1)} s`); break; }
      await advance(3);
    }
    mark('simToMatch');
    const shots = [];
    if (found) {
      if (AFTER > 0) await advance(AFTER);
      // Burst rounds after the first are presented on wall-clock timers (BattleSim.presentAfter,
      // up to ~1 s); fast-forwarding outruns them, so let them land before photographing.
      await page.waitForTimeout(1500);
      // Clips run on sim time (soldier.js passes the step's dt to the backend), so the fast-forward
      // already played the fall; frames only apply the pose. A few settle the per-frame blends (the
      // support hand letting go). Each frame costs ~1.6 s without a GPU, so render no more than that.
      const frameMs = await page.evaluate(() => {
        const b = window.__battle__, t0 = performance.now(); b.pause();
        for (let i = 0; i < 6; i++) b.scene.render();
        return (performance.now() - t0) / 6;
      });
      timings.frameMs = Math.round(frameMs);
      if (OVERLAY.length) {
        const on = await page.evaluate(names => {
          const W = window.BattleWorldDebug;
          if (!W) return null;
          names.forEach(n => W.set(n, true));
          window.__battle__.scene.render();
          return names.filter(n => W.settings[n]);
        }, OVERLAY);
        if (!on || on.length !== OVERLAY.length) fail.push('World Debug layers not enabled: ' + OVERLAY.join(','));
      }
      if (!SHOW_UI) await page.addStyleTag({ content: '*{visibility:hidden !important} canvas{visibility:visible !important}' });
      for (const id of found.ids) {
        for (const view of VIEWS) {
          const state = await page.evaluate(({ id, view, dist }) => {
            const b = window.__battle__, s = [...b._roster.us, ...b._roster.ge].find(x => x.id === id);
            const cam = b.scene.activeCamera;
            if (!s || !cam) return { err: 'soldier or camera missing' };
            // Skinned FBX bounds are the bind pose, not the animated body, so centre on the soldier:
            // low for a man who is down or prone, chest height otherwise.
            const low = s.dead || s.hp <= 0 || s.prone || s.crawling;
            const p = s.root.position, c = new BABYLON.Vector3(p.x, p.y + (low ? .3 : 1.0), p.z), h = low ? .4 : 1.7;
            const yaw = s.root.rotation.y || 0, fx = Math.sin(yaw), fz = Math.cos(yaw);
            const d = view === 'wide' ? dist * 3 : dist;
            const dir = { front: [fx, fz], back: [-fx, -fz], left: [-fz, fx], right: [fz, -fx], wide: [fx, fz] }[view];
            const eye = view === 'top' ? new BABYLON.Vector3(c.x + fx * .01, c.y + dist * 1.3, c.z + fz * .01)
              : new BABYLON.Vector3(c.x + dir[0] * d, c.y + h * .35 + d * .25, c.z + dir[1] * d);
            if (cam.setPosition && typeof cam.alpha === 'number') { cam.setTarget(c); cam.setPosition(eye); }
            else { cam.position.copyFrom(eye); cam.setTarget(c); }
            if ('minZ' in cam) cam.minZ = .05;
            return { id: s.id, faction: s.faction, role: s.role, hp: s.hp, maxHp: s.maxHp, alive: !s.dead && s.alive !== false && s.hp > 0,
              casualty: s.casualty || null, wounds: s.wounds || [], fbx: !!s._fbx,
              weapon: s.weapon && (s.weapon.model || s.weapon.kind), time: +b.time.toFixed(2) };
          }, { id, view, dist: DIST });
          if (state.err) { fail.push(`id ${id} ${view}: ${state.err}`); continue; }
          await page.evaluate(() => { const sc = window.__battle__.scene; sc.render(); });
          const file = `${view}-${id}.png`;
          await page.screenshot({ path: path.join(OUT, file), timeout: 120000 });
          shots.push({ file, view, ...state });
        }
      }
    }
    if (pageErrors.length) fail.push(...pageErrors.slice(0, 5).map(e => 'pageerror: ' + e));
    mark('photos');
    const net = await page.evaluate(() => performance.getEntriesByType('resource').reduce((a, e) => {
      a.files++; a.mb += (e.transferSize || e.encodedBodySize || 0) / 1048576; return a; }, { files: 0, mb: 0 }));
    timings.downloadedMB = +net.mb.toFixed(1); timings.resources = net.files;
    const summary = { url: finalUrl, seed: SEED, target: TARGET, ...info, timings, found, shots, fail, ok: !fail.length };
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log('OUT ' + OUT + '  (' + finalUrl + ', build ' + info.build + ')');
    for (const s of shots) console.log(`SHOT ${s.file} ${s.faction}/${s.role} id=${s.id} hp=${s.hp}/${s.maxHp} alive=${s.alive} ` +
      `casualty=${s.casualty ? JSON.stringify(s.casualty) : '-'} wounds=${s.wounds.map(w => w.zone).join('+') || '-'} t=${s.time}`);
    console.log('TIMINGS ' + JSON.stringify(timings) + (found ? `  (sim ${found.time.toFixed(0)} s to the match)` : ''));
    console.log(fail.length ? 'FAIL\n- ' + fail.join('\n- ') : 'OK: close-ups captured for review');
    if (fail.length) process.exitCode = 1;
  } finally { await Promise.race([browser.close(), new Promise(r => setTimeout(r, 5000))]); }
})().catch(e => { console.error('CLOSEUP FAIL', e && e.message || e); process.exit(1); });
