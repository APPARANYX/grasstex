/* Proves a playing voice line tracks its soldier instead of staying where it started.
   09-voice-runtime.js / 11-voice-variation.js attach the cached Sound to the soldier's root
   TransformNode for the length of the clip (see their playAt()); before that fix the Sound only
   got a one-time setPosition() snapshot and stayed put while the soldier walked on.

   Forces a known voice line on a living soldier, nudges his root position mid-playback (the sim
   is paused, so nothing else moves him) and checks the Sound's own reported spatial position
   followed. Also checks it detaches (stops tracking) once the clip ends.

   Serve the repo first (see scripts/smoke_battle_page.cjs), then:
     node scripts/probe_voice_follow.cjs
   Env: VOICEFOLLOW_URL, VOICEFOLLOW_EVENT (default manDown), VOICEFOLLOW_CHROME (executablePath). */
const path = require('node:path');
const { execSync } = require('node:child_process');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}

const url = process.env.VOICEFOLLOW_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const event = process.env.VOICEFOLLOW_EVENT || 'manDown';
const chromePath = process.env.VOICEFOLLOW_CHROME || '/Volumes/Expanse/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

(async () => {
  const { chromium } = loadPlaywright();
  const launchArgs = { args: ['--ignore-certificate-errors', '--use-gl=angle', '--use-angle=swiftshader'] };
  let browser;
  try { browser = await chromium.launch({ ...launchArgs, executablePath: chromePath }); }
  catch (e) { console.log('falling back to bundled Chromium: ' + e.message); browser = await chromium.launch(launchArgs); }
  try {
    const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 800, height: 600 } });
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await page.goto(url + (url.includes('?') ? '&' : '?') + 'seed=voicefollow', { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__battle__ && window.BattleVoiceScheduler, null, { timeout: 90000 });
    await page.getByText('Start battle').first().click().catch(() => {});
    await page.waitForFunction(() => {
      const b = window.__battle__;
      return b && b.rosterOf('us').some(s => s && !s.dead && s.root);
    }, null, { timeout: 30000 });
    // Pause the sim so only our own position writes move the soldier during the clip.
    await page.evaluate(() => window.__battle__.pause());

    const setup = await page.evaluate((eventType) => new Promise((resolve) => {
      const b = window.__battle__;
      const s = b.rosterOf('us').find(x => x && !x.dead && x.root);
      if (!s) return resolve({ ok: false, reason: 'no living US soldier' });
      // enqueue()'s distance-from-camera drop only applies when a camera is passed; passing null
      // skips it so this probe doesn't depend on where the default camera happens to be, or on
      // soldier.root.position being world space (it can sit under a formation/parent transform).
      const handle = window.BattleVoiceScheduler.enqueue(s, eventType, null, {});
      if (!handle || handle.accepted === false) return resolve({ ok: false, reason: 'enqueue rejected: ' + JSON.stringify(handle) });
      window.__voiceFollowProbe = { soldier: s, handle };
      // The Sound is created async (fetch + decode); poll until it actually starts.
      const t0 = performance.now();
      (function poll() {
        if (handle.started) return resolve({ ok: true, file: handle.file });
        if (handle.ended) return resolve({ ok: false, reason: 'ended before starting (file missing?)' });
        if (performance.now() - t0 > 15000) return resolve({ ok: false, reason: 'timed out waiting for playback to start' });
        setTimeout(poll, 50);
      })();
    }), event);
    if (!setup.ok) throw new Error('setup: ' + setup.reason);
    console.log('playing ' + setup.file);

    function soundPosition() {
      return page.evaluate(() => {
        const { soldier, handle } = window.__voiceFollowProbe;
        const scene = soldier.root.getScene();
        const track = scene.mainSoundTrack;
        const snd = (track && track.soundCollection || []).find(x => x.name === 'voice-' + handle.file);
        if (!snd) return null;
        soldier.root.computeWorldMatrix(true);
        const attached = !!snd._connectedTransformNode;
        const p = snd._position || (snd._connectedTransformNode && snd._connectedTransformNode.absolutePosition);
        const root = soldier.root.absolutePosition;
        return { attached, x: p ? p.x : null, y: p ? p.y : null, z: p ? p.z : null, root: { x: root.x, y: root.y, z: root.z } };
      });
    }

    const at0 = await soundPosition();
    if (!at0) throw new Error('Sound instance not found in scene.mainSoundTrack');
    if (!at0.attached) throw new Error('Sound never attached to the soldier root (attachToMesh did not run)');

    // Move the soldier well clear of where the clip started and let a couple of render frames
    // pass so Babylon's per-frame attach update has a chance to run.
    await page.evaluate(() => {
      const p = window.__voiceFollowProbe.soldier.root.position;
      p.set(p.x + 37, p.y, p.z - 19);
    });
    for (let i = 0; i < 6; i++) await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));
    const at1 = await soundPosition();

    const moved = Math.hypot(at1.x - at0.x, at1.z - at0.z);
    const followedRoot = Math.hypot(at1.x - at1.root.x, at1.z - at1.root.z);
    console.log(`before: sound=(${at0.x?.toFixed(2)},${at0.z?.toFixed(2)}) root=(${at0.root.x},${at0.root.z})`);
    console.log(`after:  sound=(${at1.x?.toFixed(2)},${at1.z?.toFixed(2)}) root=(${at1.root.x},${at1.root.z})  moved ${moved.toFixed(2)}m, sound-to-root gap ${followedRoot.toFixed(3)}m`);
    if (!(moved > 30)) throw new Error('sound position did not follow the soldier (moved only ' + moved.toFixed(2) + 'm, expected ~40m)');
    if (!(followedRoot < 0.5)) throw new Error('sound position lags the root by ' + followedRoot.toFixed(2) + 'm');

    // Let the clip run out and confirm it detaches (no longer tracking a possibly-disposed root).
    await page.waitForFunction(() => window.__voiceFollowProbe.handle.ended, null, { timeout: 20000 });
    const afterEnd = await soundPosition();
    if (afterEnd && afterEnd.attached) throw new Error('Sound stayed attached after the clip ended');

    if (pageErrors.length) throw new Error('page errors:\n  ' + pageErrors.join('\n  '));
    console.log('PASS: voice emitter followed the soldier and detached on completion');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error('VOICE-FOLLOW PROBE FAIL: ' + (e && e.message || e)); process.exit(1); });
