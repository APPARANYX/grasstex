#!/usr/bin/env node
'use strict';
/* Light trucks for phones (59-strategic-truck-visual.js, ?truckLite=0 restores full clones):
   the switch, the phone texture cap and the draw distance. Presentation only. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm');
const modulePath = 'battle/modules/59-strategic-truck-visual.js';
const code = fs.readFileSync(modulePath, 'utf8');
function load(search, coarse) {
  const window = {
    location: { search: '?strategicInterception=1&motorTransport=1' + search },
    matchMedia: q => ({ matches: !!coarse && /pointer:\s*coarse/.test(q) }),
    BattleModules: { registerSystem() {} },
    GTLog: () => {}
  };
  vm.runInNewContext(
    code,
    { window, console, Set, Map, WeakMap, Math, Array, Promise, isFinite },
    { filename: modulePath }
  );
  return window.BattleTransportVehicleVisual.lite;
}
const desk = load(''),
  phone = load('', true);
assert.equal(desk.on(), true, 'light trucks are the default');
assert.equal(load('&truckLite=0').on(), false, '?truckLite=0 restores full clones');
assert.equal(desk.textureCap(), 0, 'desktop keeps full textures');
assert.equal(phone.textureCap(), 256, 'a phone caps truck textures');
assert.equal(load('&truckTex=512', true).textureCap(), 512, '?truckTex sets the cap');
assert.equal(load('&truckTex=2048', true).textureCap(), 0, '?truckTex=2048 keeps full size');
assert.equal(load('&truckLite=0', true).textureCap(), 0, '?truckLite=0 keeps full textures');
const scene = (height, fov, mode) => ({
  activeCamera: { fov, mode: mode || 0 },
  getEngine: () => ({ getRenderHeight: () => height })
});
const d = desk.drawDistance(scene(720, 0.8));
assert.ok(Math.abs(d - (6.2 * 720) / (2 * Math.tan(0.4) * 3)) < 1e-6, 'drawn while it covers 3 px');
assert.ok(desk.drawDistance(scene(1440, 0.8)) > d, 'a taller screen draws trucks farther');
assert.equal(desk.drawDistance(scene(720, 0.8, 1)), Infinity, 'an orthographic camera hides nothing');
assert.equal(desk.drawDistance({ activeCamera: null }), Infinity);
console.log('PASS light trucks: default on, ?truckLite=0, phone texture cap, draw distance');
