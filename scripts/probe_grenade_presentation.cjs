/* Imported grenade/throw presentation probe. Uses the shipping grenade core, seeded RNG,
 * ballistics and soldier backend in a minimal flat scene (no battle AI or local A/B arm). The unpushed-tree
 * URL is allowed by working-rules.md; set GRENADE_FX_URL to a preview runtime root after push.
 * Writes close-ups and summary.json to GRENADE_FX_OUT (default /tmp/grenade-presentation).
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE = (process.env.GRENADE_FX_URL || 'http://127.0.0.1:8765/grasstex/').replace(/\/?$/, '/');
const OUT = process.env.GRENADE_FX_OUT || '/tmp/grenade-presentation';
const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0}canvas{width:1200px;height:900px}</style><canvas id="c" width="1200" height="900"></canvas>
<script src="https://cdn.jsdelivr.net/npm/babylonjs@9.27.1/babylon.js"></script>
<script>window.BATTLE_SOLDIER_ASSET_BASE='../Assets/';</script>
<script src="core-runtime.js"></script><script src="module-registry.js"></script><script src="soldier.js"></script>
<script src="weapons.js"></script><script src="squad-ai.js"></script><script src="scenario-generator.js"></script>
<script src="modules/14-z-ballistic-raycast.js"></script><script src="modules/23-grenades.js"></script>
<script src="modules/53-fbx-clip-table.js"></script><script src="modules/53-fbx-soldier-backend.js"></script>
<script src="modules/24-grenade-fx.js"></script>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });
  const failures = [],
    errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    page.on('pageerror', e => errors.push(String(e)));
    await page.route(BASE + 'battle/grenade-presentation-probe.html*', r =>
      r.fulfill({ contentType: 'text/html', body: html })
    );
    await page.goto(BASE + 'battle/grenade-presentation-probe.html?grenades=1', { waitUntil: 'load' });
    await page.evaluate(async () => {
      const B = BABYLON,
        engine = new B.Engine(document.getElementById('c'), false, { preserveDrawingBuffer: true });
      const scene = new B.Scene(engine);
      scene.clearColor = new B.Color4(0.19, 0.22, 0.22, 1);
      const camera = new B.ArcRotateCamera('camera', Math.PI / 2, 1.3, 4.2, new B.Vector3(0, 0.9, 0), scene);
      new B.HemisphericLight('sky', new B.Vector3(0, 1, 0), scene).intensity = 1.1;
      const sun = new B.DirectionalLight('sun', new B.Vector3(-0.4, -1, 0.8), scene);
      sun.intensity = 2;
      const ground = B.MeshBuilder.CreateGround('ground', { width: 20, height: 20 }, scene);
      const mat = new B.StandardMaterial('groundMat', scene);
      mat.diffuseColor = new B.Color3(0.23, 0.27, 0.16);
      ground.material = mat;
      await BattleSoldierModel.preload(scene);
      const units = ['us', 'ge'].map((f, i) => {
        const s = BattleSoldierModel.createSoldier(scene, f, 'rifleman');
        s.id = i + 1;
        s.root.position.x = i ? 0.62 : -0.62;
        s.weapon = BattleWeapons.issue(BattleWeapons.attachWeapon(scene, s.weaponSocket, 'rifle'), f);
        return s;
      });
      scene.metadata = { battleScenario: { seed: 'grenade-presentation' } };
      const battle = {
        scene,
        time: 0,
        heightAt: () => 0,
        obstacles: [],
        _roster: { us: [units[0]], ge: [units[1]] }
      };
      BattleModules.runHook('onBattleStart', battle, {});
      window.__probe = { scene, engine, camera, units, battle };
      engine.runRenderLoop(() => scene.render());
    });
    await page.waitForFunction(() => BattleGrenadeFx.status(__probe.battle).ready, null, { timeout: 60000 });
    const imported = await page.evaluate(() => {
      const { scene, units } = __probe;
      return {
        backend: units.map(s => s.animationBinding.backend),
        clipDurations: ['throw', 'throwCrouch', 'throwProne'].map(k => units[0]._fbx.lib.clips[k].duration),
        props: BattleGrenadeFx.files
      };
    });
    const releaseSamples = await page.evaluate(() => {
      const { scene, units } = __probe,
        s = units[0],
        out = [];
      for (const stance of ['stand', 'crouch', 'prone']) {
        s.crouching = stance === 'crouch';
        s.prone = stance === 'prone';
        s._fbx.throwing = null;
        for (let i = 0; i < 60; i++) BattleSoldierModel.animateWalk(s, 1 / 60, 0);
        BattleSoldierModel.triggerAnimation(s, BattleSoldierModel.TAGS.throw, {
          stance,
          decidedAt: 0,
          releaseAt: 0.9
        });
        s._fbx.throwing.rate = 1;
        const duration = s._fbx.lib.clips[s._fbx.throwing.key].duration,
          samples = [];
        let previous;
        for (let i = 0; i < duration * 30 * 0.9; i++) {
          BattleSoldierModel.animateWalk(s, 1 / 30, 0);
          scene.render();
          const p = BABYLON.Vector3.TransformCoordinates(
            s._fbx.lib.palms.righthand,
            s._fbx.hand.getWorldMatrix()
          );
          if (previous)
            samples.push({
              at: (i + 1) / 30,
              speed: BABYLON.Vector3.Distance(p, previous) * 30,
              x: p.x - s.root.position.x,
              y: p.y,
              z: p.z - s.root.position.z
            });
          previous = p;
        }
        out.push({ stance, duration, fastest: samples.sort((a, b) => b.speed - a.speed).slice(0, 6) });
      }
      return out;
    });
    const poses = [];
    for (const stance of ['stand', 'crouch', 'prone']) {
      const result = await page.evaluate(stance => {
        const { scene, units, battle } = __probe;
        battle.time = 0;
        BattleModules.runHook('onBattleRestart', battle, {});
        for (const s of units) {
          s.crouching = stance === 'crouch';
          s.tacticalCrouch = stance === 'crouch';
          s.prone = stance === 'prone';
          s.isPlayer = true;
          s._fbx.throwing = null;
          for (let i = 0; i < 60; i++) BattleSoldierModel.animateWalk(s, 1 / 60, 0);
          const plan = BattleGrenades.playerThrow(s, battle, { x: s.root.position.x, z: 20 });
          if (!plan) throw new Error('Real grenade core did not commit ' + stance + ' ' + s.faction);
        }
        for (let i = 0; i < 45; i++) {
          battle.time += 1 / 60;
          units.forEach(s => BattleSoldierModel.animateWalk(s, 1 / 60, 0));
          BattleModules.runHook('onSimulationStep', battle, { dt: 1 / 60 });
          scene.render();
        }
        const handError = units.map(s => {
          const node = scene.transformNodes.find(n => n.name === 'handGrenade-' + s.id);
          const palm = BABYLON.Vector3.TransformCoordinates(
            s._fbx.lib.palms.righthand,
            s._fbx.hand.getWorldMatrix()
          );
          return node ? BABYLON.Vector3.Distance(node.position, palm) : null;
        });
        return {
          stance,
          status: BattleGrenadeFx.status(battle),
          handError,
          clips: units.map(s => s._fbx.lower.entries.at(-1).clip.key)
        };
      }, stance);
      poses.push(result);
      await page.screenshot({ path: path.join(OUT, stance + '-windup.png') });
      if (result.status.held !== 2 || result.handError.some(v => v == null || v > 0.001))
        failures.push(stance + ': grenade is not on the hand');
      const expected = stance === 'prone' ? 'throwProne' : stance === 'crouch' ? 'throwCrouch' : 'throw';
      if (result.clips.some(k => k !== expected)) failures.push(stance + ': wrong throw clip');
    }
    const lifecycle = await page.evaluate(() => {
      const { scene, battle, units } = __probe;
      for (let i = 0; i < 9; i++) {
        battle.time += 1 / 60;
        units.forEach(s => BattleSoldierModel.animateWalk(s, 1 / 60, 0));
      }
      scene.render();
      const palms = units.map(s =>
        BABYLON.Vector3.TransformCoordinates(s._fbx.lib.palms.righthand, s._fbx.hand.computeWorldMatrix(true))
      );
      battle.time = 0.9;
      BattleModules.runHook('onSimulationStep', battle, { dt: 1 / 60 });
      scene.render();
      const flights = BattleGrenades.projectiles(battle);
      const immutable =
        Object.isFrozen(flights) && flights.every(g => Object.isFrozen(g) && Object.isFrozen(g.from));
      const originGaps = flights.map(g =>
        BABYLON.Vector3.Distance(palms[g.by - 1], new BABYLON.Vector3(g.from.x, g.from.y, g.from.z))
      );
      const released = BattleGrenadeFx.status(battle);
      const mesh = scene.meshes.find(m => /grenadeProjectile-1-/.test(m.name) && m.getTotalVertices());
      const lit = !!mesh && !mesh.material.unlit && !mesh.material.disableLighting;
      battle.time = Math.max(...flights.map(g => g.detonateAt));
      BattleModules.runHook('onSimulationStep', battle, { dt: 1 / 60 });
      scene.render();
      const burst = BattleGrenadeFx.status(battle);
      __probe.camera.setTarget(new BABYLON.Vector3(flights[0].to.x, flights[0].to.y + 0.4, flights[0].to.z));
      __probe.camera.radius = 4;
      return { released, lit, immutable, originGaps, burst };
    });
    await page.screenshot({ path: path.join(OUT, 'burst-flash.png') });
    await page.evaluate(() => {
      __probe.battle.time += 0.5;
      __probe.scene.render();
    });
    await page.screenshot({ path: path.join(OUT, 'burst-dust.png') });
    lifecycle.restarted = await page.evaluate(() => {
      const { battle, scene } = __probe;
      BattleModules.runHook('beforeBattleRestart', battle, {});
      BattleModules.runHook('onBattleRestart', battle, {});
      scene.render();
      return BattleGrenadeFx.status(battle);
    });
    if (lifecycle.released.held || lifecycle.released.live !== 2 || !lifecycle.lit || !lifecycle.immutable)
      failures.push('release did not replace hand prop with a lit imported projectile');
    if (lifecycle.burst.live || lifecycle.burst.bursts !== 2)
      failures.push('burst did not remove projectile and present blast');
    if (lifecycle.restarted.held || lifecycle.restarted.live || lifecycle.restarted.bursts)
      failures.push('restart leaked grenade presentation');
    const disabled = [];
    for (const flag of ['grenades=0', 'grenades=1-off']) {
      await page.goto(BASE + 'battle/grenade-presentation-probe.html?' + flag, { waitUntil: 'load' });
      const result = await page.evaluate(() => ({
        core: BattleGrenades.on(),
        fx: BattleGrenadeFx.on(),
        registered: !!BattleModules.getSystem('grenade-fx')
      }));
      disabled.push({ flag, ...result });
      if (result.core || result.fx || result.registered)
        failures.push(flag + ': grenade presentation activated');
    }
    if (errors.length) failures.push(...errors);
    const summary = { url: BASE, imported, releaseSamples, poses, lifecycle, disabled, failures };
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));
    if (failures.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
