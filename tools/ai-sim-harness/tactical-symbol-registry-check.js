#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');

function read(rel) {
  return fs.readFileSync(path.join(__dirname, '../../', rel), 'utf8');
}

const ctx = {
  console: { log() {}, warn() {}, error() {} }
};
ctx.globalThis = ctx;
vm.createContext(ctx);

vm.runInContext(read('battle/core-runtime.js'), ctx, { filename: 'battle/core-runtime.js' });
vm.runInContext(read('battle/module-registry.js'), ctx, { filename: 'module-registry.js' });
vm.runInContext(read('battle/modules/40-tactical-symbol-catalog.js'), ctx, { filename: '40-tactical-symbol-catalog.js' });

const M = ctx.BattleModules;
const T = ctx.BattleTacticalSymbols;

assert(M && T, 'module registry and tactical catalog load');
assert.strictEqual(typeof M.registerTacticalSymbol, 'function');
assert.strictEqual(typeof M.getTacticalSymbol, 'function');
assert.strictEqual(typeof M.listTacticalSymbols, 'function');
assert.strictEqual(typeof M.registerTacticalOverlayProvider, 'function');
assert.strictEqual(typeof M.listTacticalOverlayProviders, 'function');

const ids = M.listTacticalSymbols().map(s => s.id);
['infantry', 'airborne-infantry', 'machine-gun', 'mortar', 'engineer', 'sniper', 'armor', 'artillery', 'aircraft']
  .forEach(id => assert(ids.includes(id), 'starter symbol registered: ' + id));

assert.strictEqual(T.resolveId({}), 'infantry', 'unspecified squad falls back to infantry');
assert.strictEqual(T.resolveId({ tacticalSymbol: 'mortar' }), 'mortar', 'explicit display symbol wins');
assert.strictEqual(T.resolveId({ symbolType: 'sniper' }), 'sniper', 'symbolType alias resolves');

M.registerUnitType('mortar-team', {
  label: '81 mm mortar team',
  tacticalSymbol: 'mortar',
  spawn() {}
});
assert.strictEqual(
  T.resolveId({ unitType: 'mortar-team' }),
  'mortar',
  'unit type can bind to a display symbol without renderer changes'
);

M.registerTacticalSymbol('rocket-artillery', {
  label: 'Rocket artillery',
  frame: { tag: 'rect', attrs: { x: -27, y: -16, width: 54, height: 32 } },
  primitives: [{ tag: 'text', attrs: { x: 0, y: 5 }, text: 'RKT' }]
});
assert.strictEqual(T.resolveId({ tacticalSymbol: 'rocket-artillery' }), 'rocket-artillery');
assert.strictEqual(T.get('rocket-artillery').label, 'Rocket artillery');

M.registerTacticalOverlayProvider('vehicle-formations', {
  entities() { return []; },
  view(v) { return v; }
});
assert.strictEqual(M.listTacticalOverlayProviders().length, 1);
assert.strictEqual(M.getTacticalOverlayProvider('vehicle-formations').id, 'vehicle-formations');

assert.throws(
  () => M.registerTacticalSymbol('mortar', {}),
  /already registered/,
  'duplicate symbol IDs are rejected'
);

const infantry = T.get('infantry');
assert.strictEqual(infantry.verifiedHistorical, true);
assert(/FM 21-30/.test(infantry.historicalBasis), 'verified marks carry provenance');
assert.strictEqual(T.get('sniper').verifiedHistorical, false, 'placeholder marks are explicitly not claimed historical');

console.log('tactical-symbol-registry-check: PASS');
