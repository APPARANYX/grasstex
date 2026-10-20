#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const { loadModule } = require('./module-loader');
const root = {};
loadModule(root, 'battle/core-runtime.js');
const C = root.BattleStrategicConfig;
const names = [
  'strategicInterception',
  'frontLines',
  'motorTransport',
  'truckAccess',
  'truckCollision',
  'truckVisual',
  'aerialRecon',
  'interception',
  'reinforcements',
  'reinforcementSortie'
];
assert.deepEqual(Object.keys(C.defaults), names);
assert.equal(C.version, 1);
const sim = profile => ({ scene: { metadata: { battleScenario: { profile } } } });
let cases = 0;
for (let mask = 0; mask < 1024; mask++) {
  const flags = Object.fromEntries(names.map((n, i) => [n, !!(mask & (1 << i))]));
  root.location = { search: '?' + names.map(n => n + '=' + (flags[n] ? '1' : '0')).join('&') };
  for (const lab of [false, true])
    for (const profile of ['legacy', 'strategic']) {
      root.PHASE_C_COMBAT_LAB = lab;
      const s = sim(profile),
        active = profile === 'strategic';
      const expected = {
        transport: active && flags.motorTransport,
        recon: active && !lab && flags.strategicInterception && flags.aerialRecon,
        interception:
          active &&
          !lab &&
          flags.strategicInterception &&
          flags.motorTransport &&
          flags.aerialRecon &&
          flags.interception,
        truckVisual: active && flags.strategicInterception && flags.motorTransport && flags.truckVisual,
        truckCollision: active && flags.motorTransport && flags.truckCollision
      };
      const snapshot = C.snapshot(s);
      assert.deepEqual(snapshot.flags, flags);
      assert.deepEqual(snapshot.features, expected);
      for (const [name, value] of Object.entries(expected)) assert.equal(C.enabled(s, name), value);
      cases++;
    }
}
delete root.location;
root.PHASE_C_COMBAT_LAB = false;
assert.ok(Object.values(C.snapshot(sim('strategic')).features).every(Boolean), 'omission ships on');
for (const search of [
  '?motorTransport=off',
  '?motorTransport=false',
  '?motorTransport=00',
  '?motorTransport=0x',
  '?xmotorTransport=0'
]) {
  root.location = { search };
  assert.equal(C.flag('motorTransport'), true, 'preserve exact numeric-zero control: ' + search);
}
for (const search of [
  'motorTransport=0',
  '?motorTransport=0',
  '?motorTransport=1&motorTransport=0',
  '?x=1&motorTransport=0&x=2'
]) {
  root.location = { search };
  assert.equal(C.flag('motorTransport'), false, 'legacy boundaries: ' + search);
}
assert.throws(() => C.flag('typo'), /Unknown strategic flag/);
assert.throws(() => C.enabled(sim('strategic'), 'typo'), /Unknown strategic feature/);
assert.throws(() => {
  C.defaults.motorTransport = false;
}, TypeError);
assert.throws(() => C.features.interception.flags.push('typo'), TypeError);
assert.equal(C.enabled(null, 'transport'), false);
console.log(
  'PASS strategic configuration single owner: ' +
    cases +
    ' flag/profile/lab combinations, omission, exact zero/duplicate/dynamic-query semantics and immutable declaration'
);
