#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');

const ctx = { console: { log() {}, warn() {}, error() {} } };
ctx.globalThis = ctx;
vm.createContext(ctx);

const utilSource = fs.readFileSync(path.join(__dirname, '../../battle/modules/52-screen-space-lod.js'), 'utf8');
vm.runInContext(utilSource, ctx, { filename: '52-screen-space-lod.js' });

const L = ctx.BattleScreenSpaceLod;
assert(L, 'screen-space LOD utility exported');

const refY = 1 / Math.tan(0.8 / 2);
function close(actual, expected, msg) {
  assert(Math.abs(actual - expected) < 1e-9, msg + ': ' + actual + ' vs ' + expected);
}

close(L.scaleFromMetrics(1080, refY), 1, '1080p/default FOV preserves existing tuning');
close(L.scaleFromMetrics(720, refY), 2 / 3, 'smaller vertical resolution brings LOD inward');
close(L.scaleFromMetrics(2160, refY), 2, 'larger vertical resolution pushes LOD outward');
assert(L.scaleFromMetrics(1080, refY * 1.25) > 1, 'narrower FOV keeps detail farther out');
assert(L.scaleFromMetrics(1080, refY * 0.75) < 1, 'wider FOV sheds detail sooner');

const scene = {
  activeCamera: {
    getProjectionMatrix() {
      return { m: [0, 0, 0, 0, 0, refY] };
    }
  },
  getEngine() {
    return { getRenderHeight() { return 540; } };
  }
};
close(L.scale(scene), 0.5, 'scene scale reads current render height and projection');
close(L.distance(100, scene), 50, 'reference metres scale to current screen space');

const backend = fs.readFileSync(path.join(__dirname, '../../battle/modules/53-fbx-soldier-backend.js'), 'utf8');
assert(/BattleScreenSpaceLod/.test(backend), 'FBX soldier backend consumes shared screen-space LOD');
assert(/MESH_LOD\.far\*screenScale/.test(backend), 'mesh LOD threshold scales with screen space');
assert(/LOD\.near\*screenScale/.test(backend), 'full-rate animation threshold scales with screen space');
assert(/LOD\.mid\*screenScale/.test(backend), 'far animation cadence threshold scales with screen space');

console.log('screen-space-lod-check: PASS');
