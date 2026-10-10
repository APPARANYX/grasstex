#!/usr/bin/env node
'use strict';
/* A detonation creates one camera-integrated spatial density field immediately,
   not a center-point emitter or an animated swarm of dust sprites. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '../../battle/modules/24-grenade-fx.js'), 'utf8');
const make = (search = '') => {
  const calls = { spheres: [], planes: [], disposed: 0, burstOwner: 0 }, shaders = {}, observers = [];
  let hooks = null;
  class Vec {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { Object.assign(this, { x, y, z }); }
    setAll(x) { this.set(x, x, x); }
    clone() { return new Vec(this.x, this.y, this.z); }
  }
  class Holder {
    constructor(name) { this.name = name; this.position = new Vec(); }
    dispose() { calls.disposed++; }
  }
  class Material {
    constructor(name) { this.name = name; }
    setVector3(k, v) { this[k] = v; }
    setFloat(k, v) { this[k] = v; }
    dispose() { calls.disposed++; }
  }
  class Texture {
    getContext() { return { createRadialGradient() { return { addColorStop() {} }; }, fillRect() {} }; }
    update() {}
    dispose() { calls.disposed++; }
  }
  const B = {
    Axis: { Z: new Vec(0, 0, 1) },
    Quaternion: { RotationAxis: () => ({}) },
    Vector3: Vec,
    Color3: class Color { constructor(r,g,b) { Object.assign(this,{r,g,b}); } static Black() { return {}; } },
    Engine: { ALPHA_ADD: 2, ALPHA_COMBINE: 1 },
    Mesh: { BILLBOARDMODE_ALL: 7 },
    ShaderMaterial: Material,
    StandardMaterial: Material,
    DynamicTexture: Texture,
    TransformNode: Holder,
    PointLight: class Light { constructor() { this.diffuse = null; } setEnabled() {} dispose() { calls.disposed++; } },
    Effect: { ShadersStore: shaders },
    MeshBuilder: {
      CreateSphere(name, opts) {
        const m = { name, opts, position: new Vec(), scaling: new Vec(),
          setEnabled() {}, dispose() { calls.disposed++; } };
        calls.spheres.push(m);
        return m;
      },
      CreatePlane(name) {
        const m = { name, position: new Vec(), scaling: new Vec(),
          setEnabled() {}, dispose() { calls.disposed++; } };
        calls.planes.push(m);
        return m;
      }
    },
    SceneLoader: { IsPluginForExtensionAvailable: () => true },
    LoadAssetContainerAsync: async () => ({ meshes: [], dispose() {} })
  };
  const root = {
    BattleModules: { registerSystem(name, spec) { hooks = spec; }, unitsFor: () => [] },
    BattleGrenades: { parseOn: () => true, on: () => true, projectiles: () => [] },
    BATTLE_ASSET_BASE: '/somewhere/',
    GTLog() {}
  };
  new Function('window', 'globalThis', 'location', 'BABYLON', SRC)(root, root, { search }, B);
  const scene = {
    activeCamera: { position: new Vec(0, 2, 10) },
    onBeforeRenderObservable: { add(fn) { observers.push(fn); } },
    onDisposeObservable: { add() {} }
  };
  const battle = {
    time: 10, scene, onGrenadeBurst() { calls.burstOwner++; }
  };
  hooks.onBattleStart(battle, {});
  return { root, calls, shaders, observers, hooks, battle,
    burst(i, x = 0) { battle.onGrenadeBurst({ id: i, to: { x, y: 0, z: 0 } }); },
    render(t) { battle.time = t; observers.forEach(fn => fn()); }
  };
};
let a = make();
assert.equal(a.root.BattleGrenadeFx.fogEnabled(), true);
assert.equal(a.root.BattleGrenadeFx.FOG_RADIUS, 5.5);
assert.equal(a.root.BattleGrenadeFx.FOG_LIFETIME, 10);
a.burst(1);
assert.equal(a.calls.burstOwner, 1, 'prior grenade burst hook preserved');
assert.equal(a.calls.spheres.length, 1, 'one 3D volume created immediately');
assert.equal(a.calls.planes.length, 1, 'only the brief flash is a billboard');
assert.equal(a.root.BattleGrenadeFx.status(a.battle).fogVolumes, 1);
assert.equal(a.calls.spheres[0].opts.diameter, 2);
assert.equal(a.calls.spheres[0].scaling.x, 5.5, 'full smoke footprint on the detonation frame');
assert.match(a.shaders.grenadeAreaFogFragmentShader, /exp\(-0\.33 \* density \* lengthInFog\)/,
  'Beer-Lambert density integrated along the viewing ray');
assert.doesNotMatch(a.shaders.grenadeAreaFogFragmentShader, /for\s*\(/, 'no per-pixel ray march');
assert.doesNotMatch(SRC, /grenadeBurstPuff|for \(var i = 0; i < 13; i\+\+\)/,
  'old center-emitted dust puffs removed');
a.render(13);
assert.equal(a.root.BattleGrenadeFx.status(a.battle).fogVolumes, 1, 'smoke lingers in area');
a.render(20);
assert.equal(a.root.BattleGrenadeFx.status(a.battle).bursts, 0, 'fog fades and expires');
a.burst(2);
a.hooks.beforeBattleRestart(a.battle);
assert.equal(a.root.BattleGrenadeFx.status(a.battle).fogVolumes, 0, 'restart clears smoke');
for (let i = 0; i < 11; i++) a.burst(100 + i);
assert.equal(a.root.BattleGrenadeFx.status(a.battle).fogVolumes, 8,
  'mobile budget caps concurrent area volumes');
const off = make('?grenadeFog=off');
off.burst(1);
assert.equal(off.calls.spheres.length, 0, 'fog-only quality switch');
assert.equal(off.calls.planes.length, 1, 'flash remains without fog');
assert.equal(off.root.BattleGrenadeFx.status(off.battle).fogVolumes, 0);
console.log('grenade-fog-check: PASS (area density, immediate footprint, lifecycle, cap, no emitter)');
