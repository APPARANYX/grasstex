/* Close-up screenshots of the damage FX in the real page: wound and exit-wound decals on
   soldiers, blood on the ground (splash, exit spray), and bullet holes (masonry, wood, dirt, metal).

   Boots battle_sim_local.php in headless Chromium, starts the battle and steps the sim at a fixed
   0.15 s (fast, rendering only when screenshotting) until enough hits have landed, then pauses and,
   for each requested decal kind, puts the camera in front of the newest one along its surface
   normal and saves <kind>.png. Also writes summary.json (wound stats by zone, decal counts by kind,
   rounds that went through a body) and fails on any page error.

   Serve the repo first (see AGENTS.md, Browser smoke):
     mkdir -p /tmp/www && ln -sfn "$PWD" /tmp/www/grasstex && php -S 127.0.0.1:8765 -t /tmp/www &
   Then:
     node scripts/closeup_damage_fx.cjs
   Env:
     CLOSEUP_OUT       output directory (default closeups/)
     CLOSEUP_SEED      scenario seed (default smoke)
     CLOSEUP_SHOTS     comma list of kinds (default wound,exit,pool,spray,masonry,wood,dirt,metal)
     CLOSEUP_SIM       max simulated seconds before giving up waiting for hits (default 480)
     CLOSEUP_BODY      stop once this many wound decals exist (default 6)
     CLOSEUP_DIST      camera distance in metres from a body decal (default 0.9; world decals 1.6x)
     CLOSEUP_FBX_WAIT  seconds to wait for the FBX soldiers before starting (default 180; 0 = don't);
                       without them the wounds land on the procedural box rig
     CLOSEUP_URL       page URL (default the local server above; preview.php?ref= links work)
   Point CLOSEUP_URL at a live preview to see real textures and FBX soldiers:
     CLOSEUP_URL='https://test.ivandpopov.com/grasstex/preview.php?ref=<branch>' node scripts/closeup_damage_fx.cjs
   For a particular soldier (who, from which side, after how long) use scripts/closeup_battle.cjs;
   this one is for the decals themselves, on bodies, walls and ground.
   Software WebGL is slow: a run takes 5-10 minutes. A failed boot is retried once. Locally hosted
   textures 404, so the ground renders red; that is expected. */
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (e) {}
  return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}

const env = process.env;
const url = env.CLOSEUP_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const seed = env.CLOSEUP_SEED || 'smoke';
const out = path.resolve(env.CLOSEUP_OUT || 'closeups');
const shots = (env.CLOSEUP_SHOTS || 'wound,exit,pool,spray,masonry,wood,dirt,metal').split(',').map(s => s.trim()).filter(Boolean);
const maxSim = +(env.CLOSEUP_SIM || 480);
const wantBody = +(env.CLOSEUP_BODY || 6);
const dist = +(env.CLOSEUP_DIST || 0.9);
const fbxWait = +(env.CLOSEUP_FBX_WAIT == null ? 180 : env.CLOSEUP_FBX_WAIT);

/* A boot that fails (usually Babylon not arriving from the CDN) is retried; only the errors of the
   page that booted count against the run. */
async function boot(browser, errors) {
  errors.length = 0;
  const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(url + (url.includes('?') ? '&' : '?') + 'seed=' + encodeURIComponent(seed), {
    waitUntil: 'load',
    timeout: 120000
  });
  const ok = await page
    .waitForFunction(() => window.__battle__, null, { timeout: 300000 })
    .then(() => true, () => false);
  if (ok) return page;
  console.log('boot failed; page errors: ' + (errors.join(' | ') || 'none'));
  await page.close();
  return null;
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({
    /* The sandbox proxy re-signs HTTPS: without this Babylon never loads from the CDN. */
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--ignore-certificate-errors']
  });
  const errors = [];
  try {
    let page = await boot(browser, errors);
    if (!page) {
      console.log('page did not boot in 5 min; retrying once');
      page = await boot(browser, errors);
    }
    if (!page) throw new Error('battle never constructed');
    if (fbxWait > 0) {
      const fbx = await page
        .waitForFunction(() => window.__battle__._roster.us.some(s => s._fbx), null, { timeout: fbxWait * 1000 })
        .then(() => true, () => false);
      console.log(fbx ? 'FBX soldiers loaded' : 'FBX soldiers did not load in ' + fbxWait + ' s; using the procedural rig');
    }
    await page.getByText('Start battle').first().click().catch(() => {});

    /* Step the sim without rendering until enough hits have landed. */
    for (;;) {
      const s = await page.evaluate(() => {
        const b = window.__battle__;
        b.paused = false;
        for (let i = 0; i < 100 && !b.winner; i++) b._frame(0.15);
        const fx = b._impactFx || { decals: [], body: [] };
        return { t: b.time, winner: b.winner, decals: fx.decals.length, body: fx.body.length };
      });
      console.log('sim ' + s.t.toFixed(0) + ' s: ' + s.body + ' wound decals, ' + s.decals + ' world decals');
      if (s.body >= wantBody || s.t >= maxSim || s.winner) break;
    }
    /* Let delayed burst presentation (BattleSim.presentAfter) land. */
    await page.waitForTimeout(1500);

    const summary = await page.evaluate(() => {
      const b = window.__battle__,
        fx = b._impactFx || { decals: [], body: [] },
        kinds = {};
      fx.decals.forEach(d => (kinds[d.kind] = (kinds[d.kind] || 0) + 1));
      return {
        simSeconds: b.time,
        alive: { us: b.factions.us.alive, ge: b.factions.ge.alive },
        wounds: window.BattleWounds ? window.BattleWounds.summary(b) : null,
        worldDecals: kinds,
        woundDecals: fx.body.filter(e => !e.exit).length,
        exitWoundDecals: fx.body.filter(e => e.exit).length,
        fbxSoldiers: b._roster.us.some(s => s._fbx)
      };
    });
    await page.evaluate(() => {
      window.__battle__.paused = true;
      /* Hide the HUD panel so it does not cover the subject. */
      document.querySelectorAll('div').forEach(d => {
        if (/AI LAB/.test(d.textContent) && d.children.length > 5) d.style.display = 'none';
      });
    });

    summary.shots = {};
    for (const kind of shots) {
      const where = await page.evaluate(
        ({ kind, dist }) => {
          const b = window.__battle__,
            fx = b._impactFx,
            cam = b.scene.activeCamera;
          let p, n, far;
          if (kind === 'wound' || kind === 'exit') {
            /* The newest on a man still up: on the dead the decal has turned with the fall and its
               normal often points into the ground. */
            const pool = fx.body.filter(x => !!x.exit === (kind === 'exit') && !x.mesh.isDisposed()),
              e = pool.filter(x => x.soldier && !x.soldier.dead).slice(-1)[0] || pool.slice(-1)[0];
            if (!e) return null;
            const m = e.mesh.getWorldMatrix().m;
            p = e.mesh.getAbsolutePosition();
            n = { x: m[8], y: m[9], z: m[10] };
            far = dist;
          } else {
            const e = fx.decals.filter(d => d.kind === kind).slice(-1)[0];
            if (!e) return null;
            p = { x: e.matrix[12], y: e.matrix[13], z: e.matrix[14] };
            n = { x: e.matrix[8], y: e.matrix[9], z: e.matrix[10] };
            far = dist * 1.6;
          }
          const l = Math.hypot(n.x, n.y, n.z) || 1,
            P = new BABYLON.Vector3(p.x, p.y, p.z);
          /* Along the normal, lifted a little so a ground decal is seen from above at an angle. */
          const cx = p.x + (n.x / l) * far + 0.25 * far,
            cz = p.z + (n.z / l) * far;
          /* Never below the ground (a fallen man's decal can face down). */
          cam.position = new BABYLON.Vector3(cx, Math.max(p.y + (n.y / l) * far + 0.3 * far, b.heightAt(cx, cz) + 0.35), cz);
          cam.minZ = 0.02;
          if (cam.setTarget) cam.setTarget(P);
          return { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2) };
        },
        { kind, dist }
      );
      if (!where) {
        console.log('no ' + kind + ' decal to shoot');
        summary.shots[kind] = null;
        continue;
      }
      await page.waitForTimeout(1500);
      const file = path.join(out, kind + '.png');
      await page.screenshot({ path: file });
      summary.shots[kind] = { at: where, file: path.relative(process.cwd(), file) };
      console.log('shot ' + kind + ' -> ' + path.relative(process.cwd(), file));
    }
    summary.pageErrors = errors;
    fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify({ wounds: summary.wounds && summary.wounds.byZone, worldDecals: summary.worldDecals }));
    if (errors.length) {
      console.error('page errors:\n  ' + errors.join('\n  '));
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error('CLOSEUP FAIL', e.message);
  process.exit(1);
});
