/* Soldier close-ups: any faction, role, weapon, pose, moment and camera angle, as the game draws it.
 *
 * The lineup (fbx-soldier-lineup.cjs) is the fixed regression set; this is the one to reach for when
 * a change needs pictures of one hold ("the GE sergeant's P38 in walk-aim at 0.4 s, side and hands").
 * For what a fight does to a body (wounds, a death fall, stance under fire) use closeup_battle.cjs.
 * It opens the battle page, builds its own one-soldier scene next to the battle (the in-page Motion
 * Lab's recipe: BattleSoldierModel.createSoldier + BattleWeapons.attachWeapon, so the real FBX
 * backend, clip table, default grips and any served sidecar), and steps each pose at a fixed 30 Hz to
 * each requested time with Math.random seeded (the backend draws death and idle variants from it),
 * so the same env always gives the same frames. Writes one PNG per
 * soldier x pose x time x framing x view, plus summary.json with the backend's hold state per shot.
 *
 * Run (serve the repo first, see AGENTS.md "Browser smoke"):
 *   CLOSEUP_SOLDIERS=us/sergeant,ge/sergeant CLOSEUP_POSES=aim,walk-aim \
 *   NODE_PATH=$(npm root -g) node scripts/closeup.cjs
 * Env:
 *   CLOSEUP_SOLDIERS  faction/role[/weapon-file], comma-separated (default us/rifleman). Role is a
 *                     SquadAI role (rifleman, sergeant, scout, gunner, engineer); weapon-file picks
 *                     a dealt variant, e.g. us/scout/thompson.fbx
 *   CLOSEUP_POSES     Motion Lab poses: idle aim fire reload walk walk-aim strafe run sprint crouch
 *                     crouch-aim crouch-walk prone prone-aim prone-crawl stand>prone prone>stand
 *                     stand>crouch death.front death.back death.side (default aim)
 *   CLOSEUP_TIMES     seconds into the pose, comma-separated (default 1.5)
 *   CLOSEUP_VIEWS     front, side (or right, as closeup_battle.cjs calls it), back, left,
 *                     three-quarter, top (default front,side)
 *   CLOSEUP_FRAMING   body, hands, weapon (default body,hands)
 *   CLOSEUP_SIDECAR   a <model>.fbx.json served for every soldier model (sidecars are server-owned,
 *                     never committed); without it the page's defaults are used
 *   CLOSEUP_OUT       output dir (default $TMPDIR/closeups)
 *   CLOSEUP_URL       battle page (default http://127.0.0.1:8765/grasstex/battle_sim_local.php)
 *   CLOSEUP_SIZE      image WxH (default 900x900)
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const list = v => String(v).split(',').map(s => s.trim()).filter(Boolean);
const URL = process.env.CLOSEUP_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SOLDIERS = list(process.env.CLOSEUP_SOLDIERS || 'us/rifleman').map(s => {
  const [faction, role, weapon] = s.split('/');
  return { faction, role, weapon: weapon || null };
});
const POSES = list(process.env.CLOSEUP_POSES || 'aim');
const TIMES = list(process.env.CLOSEUP_TIMES || '1.5').map(Number);
const VIEWS = list(process.env.CLOSEUP_VIEWS || 'front,side');
const FRAMING = list(process.env.CLOSEUP_FRAMING || 'body,hands');
const OUT = path.resolve(process.env.CLOSEUP_OUT || path.join(os.tmpdir(), 'closeups'));
const [W, H] = String(process.env.CLOSEUP_SIZE || '900x900').split('x').map(Number);
const ALPHA = { front: -Math.PI / 2, side: 0, right: 0, back: Math.PI / 2, left: Math.PI, 'three-quarter': -Math.PI / 4, top: -Math.PI / 2 };
const slug = s => String(s).replace(/\.fbx$/i, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

(async () => {
  for (const v of VIEWS) if (!(v in ALPHA)) throw new Error(`unknown view ${v}; use ${Object.keys(ALPHA).join(', ')}`);
  for (const f of FRAMING) if (!['body', 'hands', 'weapon'].includes(f)) throw new Error(`unknown framing ${f}; use body, hands, weapon`);
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, ignoreHTTPSErrors: true });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.stack || e).slice(0, 400)));
  // Presentation draws Math.random (death clip in its pool, idle variant); seed it as
  // closeup_battle.cjs does so a pose renders the same frames every run.
  await page.addInitScript(seed => {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }, 'closeup');
  if (process.env.CLOSEUP_SIDECAR) {
    const body = fs.readFileSync(process.env.CLOSEUP_SIDECAR, 'utf8');
    await page.route('**/Assets/soldiers/*.fbx.json', r => r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
  await page.goto(URL + (URL.includes('?') ? '&' : '?') + 'seed=closeup', { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!(window.__battle__ && window.BattleSoldierModel && window.BattleWeapons && window.SquadAI), null, { timeout: 180000 });
  const poses = await page.evaluate(() => [...document.querySelectorAll('#animationLabPose option')].map(o => o.value));
  for (const p of POSES) if (!poses.includes(p)) throw new Error(`unknown pose ${p}; use ${poses.join(' ')}`);

  await page.evaluate(async ({ W, H }) => {
    const sim = window.__battle__;
    sim.pause && sim.pause();
    const canvas = document.createElement('canvas');
    canvas.id = 'closeupCanvas';
    canvas.width = W; canvas.height = H;
    canvas.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:2147483647`;
    document.body.appendChild(canvas);
    const engine = new BABYLON.Engine(canvas, true, { stencil: false, preserveDrawingBuffer: true, audioEngine: false });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(.12, .15, .11, 1);
    const camera = new BABYLON.ArcRotateCamera('closeupCamera', -Math.PI / 2, 1.2, 2.8, new BABYLON.Vector3(0, .9, 0), scene);
    camera.minZ = .02;
    const hemi = new BABYLON.HemisphericLight('closeupHemi', new BABYLON.Vector3(.25, 1, .1), scene); hemi.intensity = .95;
    const sun = new BABYLON.DirectionalLight('closeupSun', new BABYLON.Vector3(-.4, -1, .25), scene); sun.intensity = .55;
    const floor = BABYLON.MeshBuilder.CreateGround('closeupFloor', { width: 5, height: 5 }, scene), mat = new BABYLON.StandardMaterial('closeupFloorMat', scene);
    mat.diffuseColor = new BABYLON.Color3(.21, .25, .17); mat.specularColor = BABYLON.Color3.Black(); floor.material = mat;
    if (BattleSoldierModel.preload) await BattleSoldierModel.preload(scene);
    window.__closeup = { engine, scene, camera };
  }, { W, H });
  // preload gives up after 25 s (the battle never waits on assets); a close-up of the fallback rig is useless.
  await page.waitForFunction(() => { const st = window.BattleFbxSoldier && BattleFbxSoldier.status(window.__closeup.scene); return !!(st && (st.ready || st.error)); }, null, { timeout: 240000 }).catch(() => {});
  const ready = await page.evaluate(() => {
    const st = window.BattleFbxSoldier && BattleFbxSoldier.status(window.__closeup.scene);
    return { fbx: !!(st && st.ready && st.enabled), sidecars: st ? st.sidecars : [], error: st && st.error };
  });
  if (!ready.fbx) throw new Error('FBX backend not ready, shots would show the procedural rig: ' + ready.error);

  const shots = [];
  for (const who of SOLDIERS) for (const pose of POSES) for (const t of TIMES) {
    const state = await page.evaluate(({ who, pose, t }) => {
      const { scene } = window.__closeup, M = BattleSoldierModel, FPS = 30;
      const kind = SquadAI.ROLES[who.role] && SquadAI.ROLES[who.role].weapon;
      if (!kind) return { error: 'unknown role ' + who.role };
      if (window.__closeup.soldier) window.__closeup.soldier.root.dispose();
      const s = M.createSoldier(scene, who.faction, who.role, null);
      window.__closeup.soldier = s;
      s.root.position.set(0, 0, 0); s.root.rotation.y = Math.PI;
      // Weapon variants are dealt round-robin per scene: deal until the requested file comes up.
      for (let i = 0; i < 6; i++) {
        if (s.weapon) { s.weapon.mesh.dispose(); if (s.weapon.bipodMesh) s.weapon.bipodMesh.dispose(); }
        s.weapon = BattleWeapons.attachWeapon(scene, s.weaponSocket, kind);
        if (!who.weapon || s.weapon.model === who.weapon) break;
      }
      if (who.weapon && s.weapon.model !== who.weapon) return { error: `${who.faction}/${who.role} is never dealt ${who.weapon} (got ${s.weapon.model})` };
      // The in-page Motion Lab's makePreview/step, parameterised by soldier.
      const from = pose.indexOf('>') > 0 ? pose.split('>')[0] : pose;
      Object.assign(s, { speed: 1, moveSpeed: 0, target: null, crouching: false, prone: false, crawling: false, reloading: false, dead: false });
      if (/aim|fire/.test(pose)) s.target = { root: { position: new BABYLON.Vector3(0, 0, -20) } };
      if (/^crouch/.test(from)) s.crouching = true;
      if (/^prone/.test(from)) { s.prone = true; s.crawling = pose === 'prone-crawl'; }
      if (pose === 'reload') { s.reloading = true; M.triggerAnimation(s, M.TAGS.reload, { duration: 2.6 }); }
      if (pose === 'fire') M.triggerAnimation(s, M.TAGS.fire, {});
      if (pose.indexOf('death.') === 0) { s.dead = true; s.deathVariant = pose.slice(6); s.deathSide = 1; s.deathTag = pose; M.triggerAnimation(s, pose, {}); }
      if (s._fbx) s._fbx.idleKey = 'idle';
      const MOTION = { walk: [1.5, 0], 'walk-aim': [1.5, 0], strafe: [1.4, Math.PI / 2], run: [3.9, 0], sprint: [5.3, 0], 'crouch-walk': [1.4, 0], 'prone-crawl': [.45, 0] };
      let clock = 0, vx = 0, vz = 0, switched = false;
      for (let f = 0; f < Math.round(t * FPS); f++) {
        const dt = 1 / FPS, motion = MOTION[pose];
        clock += dt;
        if (pose === 'fire' && clock > 1.1) { clock = 0; M.triggerAnimation(s, M.TAGS.fire, {}); }
        if (pose.indexOf('>') > 0 && clock > .7 && !switched) { switched = true; const to = pose.split('>')[1]; M.setProne(s, to === 'prone'); M.setCrouch(s, to === 'crouch'); }
        if (motion) { const h = s.root.rotation.y + motion[1]; vx += Math.sin(h) * motion[0] * dt; vz += Math.cos(h) * motion[0] * dt; s.root.position.x = vx; s.root.position.z = vz; }
        M.animateWalk(s, dt, motion ? Math.min(1, motion[0] / 5.3) : 0);
        s.root.position.x = 0; s.root.position.z = 0;
      }
      scene.render();
      const fx = s._fbx, lower = fx && fx.lower.entries[fx.lower.entries.length - 1], upper = fx && fx.overlay > .5 && fx.upper.entries[fx.upper.entries.length - 1];
      return {
        rig: fx ? 'fbx' : 'procedural', model: fx && fx.file || null, weapon: s.weapon && s.weapon.model || null,
        clip: lower ? lower.clip.file : null, upperClip: upper ? upper.clip.file : null,
        twoHand: fx ? fx.twoHand || 0 : null, supportErrorCm: fx ? fx.supportErrorCm : null, supportReason: fx ? fx.supportReason || null : null
      };
    }, { who, pose, t });
    const base = { soldier: `${who.faction}/${who.role}${who.weapon ? '/' + who.weapon : ''}`, pose, time: t };
    if (state.error) { shots.push({ ...base, error: state.error }); continue; }
    for (const framing of FRAMING) for (const view of VIEWS) {
      await page.evaluate(({ framing, view, alpha }) => {
        const { scene, camera, soldier } = window.__closeup, V = BABYLON.Vector3;
        const nodes = soldier.root.getDescendants(false);
        const hand = side => nodes.find(n => new RegExp('^' + side + '\\s*hand$', 'i').test(String(n.name).replace(/^.*[:|]/, '')));
        let target = new V(0, soldier.prone ? .3 : soldier.crouching ? .7 : .95, 0), radius = soldier.prone ? 2.2 : 2.6;
        if (framing === 'hands') {
          const r = hand('right'), l = hand('left');
          const pts = [r, l].filter(Boolean).map(n => n.getAbsolutePosition());
          if (!pts.length) { soldier.weaponSocket.computeWorldMatrix(true); pts.push(soldier.weaponSocket.getAbsolutePosition()); }
          target = pts.reduce((a, p) => a.add(p), V.Zero()).scale(1 / pts.length); radius = .75;
        } else if (framing === 'weapon' && soldier.weapon && soldier.weapon.mesh) {
          const m = soldier.weapon.mesh; m.computeWorldMatrix(true); m.refreshBoundingInfo(true);
          const box = m.getBoundingInfo().boundingBox; target = box.centerWorld.clone();
          radius = Math.max(.5, box.maximumWorld.subtract(box.minimumWorld).length() * 1.1);
        }
        camera.setTarget(target); camera.radius = radius; camera.alpha = alpha; camera.beta = view === 'top' ? .35 : 1.2;
        scene.render();
      }, { framing, view, alpha: ALPHA[view] });
      const file = `${slug(who.faction)}-${slug(who.role)}-${slug(state.weapon || 'none')}-${slug(pose)}-${t.toFixed(2)}s-${framing}-${view}.png`;
      await page.locator('#closeupCanvas').screenshot({ path: path.join(OUT, file) });
      shots.push({ ...base, file, framing, view, ...state });
    }
  }
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify({ url: URL, sidecar: process.env.CLOSEUP_SIDECAR || null, fbx: ready, shots, errors }, null, 1));
  console.log(`OUT ${OUT}`);
  for (const s of shots) console.log(s.error ? `FAIL ${s.soldier} ${s.pose}: ${s.error}`
    : `SHOT ${s.file} clip=${s.clip}${s.upperClip ? '+' + s.upperClip : ''} twoHand=${s.twoHand} supportErrorCm=${s.supportErrorCm}`);
  errors.forEach(e => console.log('PAGE ERROR ' + e));
  await browser.close();
  if (errors.length || shots.some(s => s.error)) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
