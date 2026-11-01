#!/usr/bin/env node
'use strict';
/* scripts/merge_probe_pack.cjs: pairs battles by type and seed, treats a missing counter as 0, flattens nested probe
   reports, and tests each metric with an exact two-sided sign test. */
const assert = require('node:assert/strict'),
  M = require('../../scripts/merge_probe_pack.cjs');

assert.equal(M.binomP(0, 0), 1);
assert.ok(Math.abs(M.binomP(10, 10) - 2 / 1024) < 1e-12, 'ten ups of ten is 2/1024');
assert.equal(M.binomP(10, 5), 1);

const flat = {};
M.flatten(
  '',
  { playtest: { us: { rounds: 4, ok: true }, examples: { x: 9 } }, probe: { list: [1, 2] } },
  flat
);
assert.deepEqual(flat, { 'playtest.us.rounds': 4, 'playtest.us.ok': 1 }, 'arrays are skipped');

function arm(base, extra) {
  const m = new Map();
  for (let i = 0; i < 12; i++)
    m.set('meeting:s' + i, {
      type: 'meeting',
      seed: 's' + i,
      simSeconds: 600,
      errors: [],
      reports: {
        playtest: Object.assign({ us: { rounds: base + i } }, extra && i < 12 ? { ge: { pins: 3 } } : {})
      }
    });
  m.set('meeting:only-off', { type: 'meeting', seed: 'only-off', simSeconds: 600, errors: [], reports: {} });
  return m;
}
const onArm = arm(110, true);
onArm.delete('meeting:only-off');
const r = M.compare(arm(100, false), onArm);
assert.equal(r.pairs, 12);
assert.equal(r.unpaired.off, 1);
const rounds = r.metrics.find(m => m.metric === 'playtest.us.rounds'),
  pins = r.metrics.find(m => m.metric === 'playtest.ge.pins');
assert.equal(rounds.up, 12);
assert.ok(rounds.p < 0.01);
assert.equal(pins.off, 0, 'a counter missing in the off arm is 0');
assert.equal(pins.on, 36);
assert.ok(M.markdown(r).includes('playtest.ge.pins') || M.markdown(r).includes('ge.pins'));
console.log('PASS probe pack merge pairs, flattens and tests arms');
