/* Real imported models: compare live pose/IK output against the frozen pre-extraction owner.
   The baseline is read from Git, never copied into runtime. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
let playwright;
try {
  playwright = require('playwright');
} catch (_) {
  playwright = require(
    path.join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'playwright')
  );
}
const { chromium } = playwright;
const ref = '3fbf7dfda4c31eafe32baeacfb6e83d24c1f78ae';
const original = execFileSync('git', ['show', ref + ':battle/modules/53-fbx-soldier-backend.js'], {
  encoding: 'utf8'
});
const body = original.slice(
  original.indexOf('  /* ---- render-side pose writing'),
  original.indexOf('  /* R3: render cadence')
);
const names = [
  'Q',
  'V3',
  'MX',
  'BONE',
  'FPS',
  'POSE',
  'perfNow',
  'poseLayer',
  'poseInputs',
  'sampleLayer',
  'armDegFor',
  'leftGripFor',
  'wristRFor',
  'pointsFor',
  'WEAPON_POINTS'
];
const baseline =
  '(function(deps){var ' +
  names.map(n => n + '=deps.' + n).join(',') +
  ',LOD={get on(){return deps.lodOn();}};' +
  body +
  ';return {applyPose:applyPose};})';
const url = process.env.POSE_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const out = process.env.POSE_OUT || 'closeups/render-pose-ci';
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']
  });
  try {
    const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1100, height: 780 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.addInitScript(() => {
      let owner;
      Object.defineProperty(window, 'BattleFbxRenderPose', {
        configurable: true,
        get: () => owner,
        set(v) {
          const create = v.create;
          v.create = function (deps) {
            window.__poseDeps = deps;
            const p = create(deps);
            window.__poseOwner = p;
            return p;
          };
          owner = v;
        }
      });
    });
    const wav = Buffer.alloc(44 + 4410);
    wav.write('RIFF');
    wav.writeUInt32LE(wav.length - 8, 4);
    wav.write('WAVE', 8);
    wav.write('fmt ', 12);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(22050, 24);
    wav.writeUInt32LE(44100, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write('data', 36);
    wav.writeUInt32LE(4410, 40);
    await page.route('**/*', route => {
      const r = route.request();
      if (r.method() === 'POST') return route.fulfill({ json: {} });
      if (/\/Assets\/audio\/.*\.(mp3|wav|ogg)([?#]|$)/i.test(r.url()))
        return route.fulfill({ body: wav, contentType: 'audio/wav' });
      return route.continue();
    });
    await page.goto(
      url +
        (url.includes('?') ? '&' : '?') +
        'seed=render-pose-acceptance&strategicInterception=0&motorTransport=0',
      { waitUntil: 'load', timeout: 300000 }
    );
    await page.waitForFunction(
      () => window.__battle__ && window.__poseOwner && BattleFbxSoldier.status(__battle__.scene).ready,
      null,
      { timeout: 300000 }
    );
    await page.locator('#startBtn').click();
    await page.waitForFunction(() => __battle__._roster?.us?.some(s => s._fbx), null, { timeout: 60000 });
    const result = await page.evaluate(baseline => {
      const sim = __battle__;
      sim.pause();
      const deps = __poseDeps;
      deps.POSE.on = false;
      const previous = (0, eval)(baseline)(deps),
        current = __poseOwner;
      const roster = [...sim._roster.us, ...sim._roster.ge];
      const models = new Map();
      for (const s of roster) if (s._fbx) models.set(s._fbx.lib.file, s);
      let cases = 0,
        worst = 0;
      const coverage = {};
      const scalar = [
        'cupRamp',
        'cupW',
        'cupReach',
        'cupMode',
        'leftGripErrorCm',
        'twoHand',
        'supportErrorCm',
        'supportHandM',
        'supportNearM',
        'supportFarM',
        'supportReason'
      ];
      for (const [file, s] of models) {
        const fx = s._fbx;
        coverage[file] = 0;
        const saved = fx.nodes.map(n => n && [n.position.clone(), n.rotationQuaternion.clone()]);
        const restore = () => {
          fx.nodes.forEach((n, i) => {
            if (n) {
              n.position.copyFrom(saved[i][0]);
              n.rotationQuaternion.copyFrom(saved[i][1]);
            }
          });
          scalar.forEach(k => delete fx[k]);
          fx.cupRamp = 0.7;
          fx.cupW = 0.65;
          fx.cupReach = 0.8;
        };
        const snapshot = () => ({
          nodes: fx.nodes.map(n => n && [...n.position.asArray(), ...n.rotationQuaternion.asArray()]),
          socket: [
            ...fx.socket.position.asArray(),
            ...fx.socket.rotationQuaternion.asArray(),
            ...fx.socket.scaling.asArray()
          ],
          state: scalar.map(k => fx[k] ?? null)
        });
        const originalKind = fx.weaponKind,
          originalModel = fx.weaponModel;
        for (const kind of ['rifle', 'pistol'])
          for (const [key, clip] of Object.entries(fx.lib.clips))
            for (const phase of [0, 0.37, 0.83]) {
              fx.weaponKind = kind;
              fx.weaponModel =
                kind === 'pistol' ? (s.faction === 'ge' ? 'p38.fbx' : 'm1911a1.fbx') : originalModel;
              fx.lower = { entries: [{ clip, t: clip.duration * phase, rate: 1, w: 1 }] };
              fx.upper = { entries: [{ clip: fx.lib.clips.aim, t: phase, rate: 1, w: 1 }] };
              fx.overlay = phase;
              fx.aim = phase;
              fx.aimAt = { x: fx.root.position.x + 8, y: fx.root.position.y + 1, z: fx.root.position.z + 4 };
              fx.death = key.startsWith('death') ? key : null;
              fx.transition = /To/.test(key) ? key : null;
              fx.supportReleased = /reload|hit|flinch/i.test(key);
              fx.throwing = /^throw/.test(key)
                ? { stance: key === 'throwProne' ? 'prone' : key === 'throwCrouch' ? 'crouch' : 'stand' }
                : null;
              fx.cupClipKey = /hit|flinch/i.test(key) ? key : null;
              fx.cupClipT = phase * clip.duration;
              fx._poseDt = 1 / 30;
              restore();
              previous.applyPose(fx);
              const a = snapshot();
              restore();
              current.applyPose(fx);
              const b = snapshot();
              const compare = (a, b) => {
                if (typeof a === 'number') {
                  if (!Number.isFinite(a) || !Number.isFinite(b))
                    throw Error('nonfinite ' + file + '/' + key);
                  worst = Math.max(worst, Math.abs(a - b));
                } else if (Array.isArray(a)) {
                  if (!Array.isArray(b) || a.length !== b.length) throw Error('shape mismatch');
                  a.forEach((v, i) => compare(v, b[i]));
                } else if (a !== b) throw Error('state mismatch ' + file + '/' + key + ': ' + a + ' vs ' + b);
              };
              compare(a.nodes, b.nodes);
              compare(a.socket, b.socket);
              compare(a.state, b.state);
              if (
                kind === 'pistol' &&
                !fx.throwing &&
                deps.leftGripFor(fx.lib.file, fx.weaponModel) &&
                fx.cupMode === 'off'
              )
                throw Error('pistol cup was not exercised');
              cases++;
              coverage[file]++;
            }
        fx.weaponKind = originalKind;
        fx.weaponModel = originalModel;
      }
      return { models: models.size, cases, worst, coverage };
    }, baseline);
    assert.equal(result.models, 10);
    assert.equal(result.cases, 7080);
    assert.equal(result.worst, 0);
    assert.deepEqual(errors, []);
    const visual = await page.evaluate(async baseline => {
      const sim = __battle__,
        scene = sim.scene,
        engine = scene.getEngine();
      sim.pause();
      engine.stopRenderLoop();
      const previous = (0, eval)(baseline)(__poseDeps),
        current = __poseOwner;
      const men = [...sim._roster.us, ...sim._roster.ge].filter(s => s._fbx);
      const oldNotify = scene.onBeforeRenderObservable.notifyObservers;
      scene.onBeforeRenderObservable.notifyObservers = () => true;
      const frames = [],
        images = {};
      const width = engine.getRenderWidth(),
        height = engine.getRenderHeight();
      const diff = (a, b) => {
        let n = 0;
        for (let i = 0; i < a.length; i += 4)
          if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++;
        return n;
      };
      const shot = async () => {
        scene.render();
        scene.render();
        const pixels = new Uint8Array(await engine.readPixels(0, 0, width, height));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d'),
          im = ctx.createImageData(width, height);
        for (let y = 0; y < height; y++)
          im.data.set(pixels.subarray(y * width * 4, (y + 1) * width * 4), (height - y - 1) * width * 4);
        ctx.putImageData(im, 0, 0);
        return { pixels, png: canvas.toDataURL('image/png').split(',')[1] };
      };
      try {
        for (const faction of ['us', 'ge'])
          for (const key of ['aim', 'reload', 'crouchAim', 'proneIdle', 'pistolIdle']) {
            const s = men.find(
              s => s.faction === faction && s.role === (key === 'pistolIdle' ? 'sergeant' : 'rifleman')
            );
            if (!s) throw Error('missing visual soldier');
            const fx = s._fbx,
              clip = fx.lib.clips[key];
            men.forEach(m => {
              const on = m === s;
              m._fbx.meshes.forEach(mesh => mesh.setEnabled(on));
              if (m.weapon?.mesh) m.weapon.mesh.setEnabled(on);
              if (m.weapon?.bipodMesh) m.weapon.bipodMesh.setEnabled(false);
            });
            if (key === 'pistolIdle') {
              const pistol = BattleWeapons.attachWeapon(scene, fx.socket, 'pistol');
              s.weapon.mesh.setEnabled(false);
              fx.weapon = pistol;
              fx.weaponKind = 'pistol';
              fx.weaponModel = pistol.model;
              if (!/m1911a1|p38/.test(pistol.model || '')) throw Error('actual sidearm mesh missing');
              if (faction === 'us' && !__poseDeps.leftGripFor(fx.lib.file, pistol.model))
                throw Error('calibrated M1911 cup missing');
            } else {
              fx.weapon = s.weapon;
              fx.weaponKind = s.weapon.kind;
              fx.weaponModel = s.weapon.model;
            }
            const p = s.root.position,
              yaw = s.root.rotation.y || 0;
            scene.activeCamera.position.set(
              p.x + Math.sin(yaw) * 2.6 - Math.cos(yaw) * 1.2,
              p.y + 1.6,
              p.z + Math.cos(yaw) * 2.6 + Math.sin(yaw) * 1.2
            );
            scene.activeCamera.setTarget(
              new BABYLON.Vector3(p.x, p.y + (key === 'proneIdle' ? 0.2 : 0.8), p.z)
            );
            fx.lower = { entries: [{ clip, t: clip.duration * 0.37, rate: 1, w: 1 }] };
            fx.upper = { entries: [] };
            fx.overlay = 0;
            fx.aim = 0;
            fx.throwing = null;
            fx.death = null;
            fx.transition = null;
            fx.supportReleased = key === 'reload';
            fx.cupClipKey = null;
            const saved = fx.nodes.map(n => n && [n.position.clone(), n.rotationQuaternion.clone()]);
            const restore = () => {
              fx.nodes.forEach((n, i) => {
                if (n) {
                  n.position.copyFrom(saved[i][0]);
                  n.rotationQuaternion.copyFrom(saved[i][1]);
                }
              });
              fx.cupRamp = fx.cupW = fx.cupReach = 1;
            };
            const render = async owner => {
              restore();
              owner.applyPose(fx);
              fx.poseRef.serial++;
              return shot();
            };
            const a = await render(previous),
              ctl = await render(previous),
              b = await render(current),
              back = await render(previous);
            const name = faction + '-' + key;
            images[name + '-before.png'] = a.png;
            images[name + '-after.png'] = b.png;
            const positiveX = s.root.position.x;
            s.root.position.x += 1;
            fx.poseRef.serial++;
            const positive = await shot();
            s.root.position.x = positiveX;
            if (key === 'pistolIdle' && faction === 'us' && fx.cupMode === 'off')
              throw Error('visual pistol cup not exercised');
            frames.push({
              name,
              weapon: fx.weaponModel,
              cupMode: fx.cupMode,
              control: diff(a.pixels, ctl.pixels),
              changed: diff(a.pixels, b.pixels),
              back: diff(a.pixels, back.pixels),
              positive: diff(a.pixels, positive.pixels)
            });
          }
      } finally {
        scene.onBeforeRenderObservable.notifyObservers = oldNotify;
      }
      return { frames, images };
    }, baseline);
    for (const frame of visual.frames) {
      assert.equal(frame.control, 0, frame.name + ' unstable control');
      assert.equal(frame.changed, 0, frame.name + ' pixel change');
      assert.equal(frame.back, 0);
      assert.ok(frame.positive > 0, frame.name + ' invisible positive control');
    }
    for (const [name, png] of Object.entries(visual.images))
      fs.writeFileSync(path.join(out, name), Buffer.from(png, 'base64'));
    result.visual = visual.frames;
    // Repeated real pose workload (five minutes at 60 pose frames/s), alternating
    // old/new on one runner. Warm caches first; keep timing advisory, output parity is the gate.
    const workload = await page.evaluate(baseline => {
      const old = (0, eval)(baseline)(__poseDeps),
        current = __poseOwner;
      const sim = __battle__;
      sim.restart();
      sim.pause();
      sim.scene.getEngine().stopRenderLoop();
      const men = [
        ...new Map(
          [...sim._roster.us, ...sim._roster.ge].filter(s => s._fbx).map(s => [s._fbx.lib.file, s])
        ).values()
      ];
      const run = (owner, frames) => {
        const start = performance.now();
        for (let frame = 0; frame < frames; frame++)
          for (const s of men) {
            const fx = s._fbx,
              clip = fx.lib.clips.walk0;
            fx.lower = { entries: [{ clip, t: (frame / 60) % clip.duration, rate: 1, w: 1 }] };
            fx.throwing = null;
            fx.death = null;
            fx.transition = null;
            fx.supportReleased = false;
            owner.applyPose(fx);
          }
        return performance.now() - start;
      };
      run(old, 100);
      run(current, 100);
      const oldMs = [],
        newMs = [];
      for (let round = 0; round < 6; round++) {
        if (round % 2) {
          newMs.push(run(current, 3000));
          oldMs.push(run(old, 3000));
        } else {
          oldMs.push(run(old, 3000));
          newMs.push(run(current, 3000));
        }
      }
      const median = a => [...a].sort((a, b) => a - b)[Math.floor(a.length / 2)];
      return {
        poseFrames: 18000,
        soldiers: men.length,
        oldMs,
        newMs,
        medianRatio: median(newMs) / median(oldMs)
      };
    }, baseline);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('HeapProfiler.collectGarbage');
    const heapBefore = await cdp.send('Runtime.getHeapUsage');
    const restartCounts = [];
    for (let restart = 0; restart < 4; restart++) {
      await page.evaluate(() => {
        __battle__.restart();
        __battle__.pause();
      });
      await page.waitForFunction(
        () => __battle__._roster.us.length > 0 && __battle__._roster.us.every(s => s._fbx),
        null,
        { timeout: 60000 }
      );
      restartCounts.push(
        await page.evaluate(() => {
          const sim = __battle__,
            scene = sim.scene,
            engine = scene.getEngine();
          for (let i = 0; i < 30; i++) scene.render();
          return {
            meshes: scene.meshes.length,
            skeletons: scene.skeletons.length,
            observers: scene.onBeforeRenderObservable.observers.length,
            soldiers: [...sim._roster.us, ...sim._roster.ge].filter(s => s._fbx).length
          };
        })
      );
      await cdp.send('HeapProfiler.collectGarbage');
    }
    const heapAfter = await cdp.send('Runtime.getHeapUsage');
    assert.deepEqual(restartCounts[3], restartCounts[1], 'scene allocations stabilized across restarts');
    assert.ok(
      heapAfter.usedSize - heapBefore.usedSize < 32 * 1024 * 1024,
      'retained heap grew by more than 32 MiB'
    );
    result.workload = workload;
    result.restartCounts = restartCounts;
    result.heap = {
      before: heapBefore.usedSize,
      after: heapAfter.usedSize,
      delta: heapAfter.usedSize - heapBefore.usedSize
    };
    assert.deepEqual(errors, []);
    /* The test stopped the Babylon render loop above. A final Playwright page
       screenshot can wait forever for a compositor frame after the repeated
       pose/GC workload, despite all pixel-parity assertions passing. The
       pixel-readback pairs were already rendered, compared and written as
       20 before/after PNGs; keep those as authoritative screenshot evidence. */
    fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(result, null, 2));
    console.log('PASS actual FBX pose/IK baseline parity', result);
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
