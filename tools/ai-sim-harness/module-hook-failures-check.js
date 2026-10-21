#!/usr/bin/env node
'use strict';
/* Module hook failures are recorded, not only console.error'd (audit HOOK-01, diagnostics half).

   runHook still logs, still continues past an optional hook that throws and still rethrows a required
   one; it now also counts the failure per 'system.hook' so an exported battle can say a hook failed.

     node tools/ai-sim-harness/module-hook-failures-check.js */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../../battle/module-registry.js'), 'utf8');
const root = { console: { log() {}, warn() {}, error() {} }, GTLog() {} };
root.window = root;
new Function('window', 'console', src)(root, root.console);
const M = root.BattleModules;
assert.equal(typeof M.hookFailures, 'function', 'BattleModules.hookFailures exists');
let after = 0;
M.registerSystem({
  id: 'a-optional',
  onTick() {
    throw new Error('overlay broke');
  }
});
M.registerSystem({
  id: 'b-required',
  requiredHooks: ['onBattleStart'],
  onBattleStart() {
    throw new Error('reset broke');
  },
  onTick() {
    after++;
  }
});
M.runHook('onTick', {}, {});
M.runHook('onTick', {}, {});
assert.equal(after, 2, 'an optional hook failure does not stop later systems');
assert.throws(() => M.runHook('onBattleStart', {}, {}), /reset broke/, 'a required hook still rethrows');
const f = M.hookFailures();
assert.equal(f['a-optional.onTick'].count, 2);
assert.equal(f['a-optional.onTick'].required, false);
assert.equal(f['a-optional.onTick'].last, 'overlay broke');
assert.equal(f['b-required.onBattleStart'].required, true);
console.log('PASS hook failures are counted per system.hook with semantics unchanged: ' + JSON.stringify(f));
