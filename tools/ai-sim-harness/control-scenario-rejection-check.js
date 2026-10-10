#!/usr/bin/env node
'use strict';

/* #456 B1: the console-only API must never strand a rejected training/persist
   promise as unhandled, even when a caller intentionally ignores the result. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../../battle/battle-control.js'), 'utf8');
const errors = [];
const oldLog = console.error;
console.error = (...args) => errors.push(args.join(' '));

function api(trainer) {
  const root = {
    BattleSim: {
      start() {
        return {};
      }
    },
    BattleAITrainer: trainer,
    GTLog() {}
  };
  new Function('window', source)(root);
  return root.BattleControl;
}
(async function () {
  const unavailable = await api(null).runScenarios({});
  assert.deepEqual(unavailable, { ok: false, reason: 'trainer-unavailable' });

  const expected = new Error('persist refused');
  const rejected = await api({
    train() {
      return Promise.reject(expected);
    }
  }).runScenarios({});
  assert.equal(rejected.ok, false);
  assert.equal(rejected.reason, 'training-failed');
  assert.match(rejected.message, /persist refused/);
  assert.ok(
    errors.some(text => text.includes('persist refused')),
    'failure remains visible in console'
  );

  const thrown = await api({
    train() {
      throw expected;
    }
  }).runScenarios({});
  assert.equal(thrown.ok, false, 'synchronous trainer errors are also settled');

  let seen = null;
  const succeeded = await api({
    train(sim, opts) {
      seen = opts;
      return Promise.resolve('saved');
    }
  }).runScenarios({});
  assert.equal(succeeded, 'saved', 'success result passes through unchanged');
  assert.deepEqual([seen.candidates, seen.scenarios, seen.headless], [4, 3, true]);
  console.error = oldLog;
  console.log('PASS #456 B1 runScenarios settles rejected/throwing trainer, preserves success and options');
})().catch(error => {
  console.error = oldLog;
  console.error(error);
  process.exitCode = 1;
});
