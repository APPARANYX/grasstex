#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const { loadModule, loadSource, quietConsole } = require('./module-loader');
const a = { location: { search: '?root=1' } },
  b = {};
loadSource(a, 'window.same = window === globalThis; window.count = (window.count || 0) + 1;');
assert.equal(a.same, true);
assert.equal(a.count, 1);
assert.equal(b.count, undefined, 'no world leaked into another root');
loadSource(b, 'window.count = (window.count || 0) + 1;');
assert.equal(b.count, 1);
const before = global.location;
try {
  global.location = { search: '?host=1' };
  loadSource(a, 'window.search = location.search;');
  assert.equal(a.search, '?host=1', 'omitted binding preserves global fallback, not root.location');
  loadSource(a, 'window.search = location && location.search;', { location: undefined });
  assert.equal(a.search, undefined, 'explicit undefined shadows host location');
  loadSource(a, 'window.search = location.search;', { location: a.location });
  assert.equal(a.search, '?root=1');
} finally {
  if (before === undefined) delete global.location;
  else global.location = before;
}
let calls = 0;
const stub = {};
loadSource(a, 'console.warn("fixture");window.stub = BABYLON;', {
  console: {
    warn() {
      calls++;
    }
  },
  BABYLON: stub
});
assert.equal(calls, 1);
assert.equal(a.stub, stub, 'explicit stub identity retained');
loadSource(a, 'var scratch = [];window.allocate = () => scratch;');
const first = a.allocate();
loadSource(a, 'var scratch = [];window.allocate = () => scratch;');
assert.notEqual(a.allocate(), first, 'each evaluation has fresh lexical scratch');
loadModule(b, 'battle/core-runtime.js', { console: quietConsole });
assert.equal(b.GTMath.clamp(5, 0, 3), 3, 'real source loaded, not a test implementation');
assert.throws(() => loadModule(b, 'battle/no-such-module.js'), /ENOENT/);
assert.throws(() => loadSource(b, 'throw new Error("fixture");', {}, 'named-fixture.js'), /fixture/);
try {
  loadSource(b, 'throw new Error("trace");', {}, 'named-fixture.js');
} catch (e) {
  assert.match(e.stack, /named-fixture\.js/);
}
console.log(
  'PASS #456 R1 explicit bindings, host/undefined location, aliases, stub identity, fresh lexical scope, actual module loading and visible errors'
);
