/* Exact, seed-paired neutral-refactor proof. No averages can hide a changed battle.
 * node scripts/compare_battle_fingerprints.cjs before.json after.json
 * node scripts/compare_battle_fingerprints.cjs --benchmark before.json after.json
 * Probe inputs must use state-fingerprint; --benchmark accepts the merged GitHub standard report.
 * Wall-clock cost is reported separately because timing the host CPU is not deterministic. */
'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const BENCHMARK_FIELDS = [
  'scenarioId',
  'fingerprint',
  'winner',
  'winReason',
  'simulatedSeconds',
  'steps',
  'timeoutReached',
  'usAlive',
  'geAlive',
  'usForceValue',
  'geForceValue',
  'usKills',
  'geKills',
  'usObjectives',
  'geObjectives',
  'captures',
  'neutralizations',
  'capturesByFaction',
  'firstContactSeconds',
  'firstFireSeconds',
  'firstObjectiveProgressSeconds',
  'firstCaptureSeconds',
  'objectiveCount',
  'objectivesEverOwned',
  'objectivesNeverOwned',
  'objectivesNeverContested',
  'fire',
  'finalObjectives'
];
function difference(a, b, at = '') {
  if (Object.is(a, b)) return null;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return { at, before: a, after: b };
  if (Array.isArray(a) !== Array.isArray(b)) return { at, before: a, after: b };
  for (const key of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
    if (!Object.hasOwn(a, key) || !Object.hasOwn(b, key))
      return { at: `${at}.${key}`, before: a[key], after: b[key] };
    const d = difference(a[key], b[key], `${at}.${key}`);
    if (d) return d;
  }
  return null;
}
function withoutTransitionDiagnostics(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(withoutTransitionDiagnostics);
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === 'transition' || key === '_commandPhaseTransition') continue;
    out[key] = withoutTransitionDiagnostics(item);
  }
  return out;
}
function index(report) {
  assert.ok(Array.isArray(report.battles) && report.battles.length, 'report has no battles');
  const out = new Map();
  for (const battle of report.battles) {
    assert.ok(battle.seed, 'battle has no seed');
    const key = `${battle.type || battle.battleType || ''}:${battle.seed}`;
    assert.ok(!out.has(key), `duplicate battle ${key}`);
    assert.ok(!battle.errors?.length && battle.sameBattle !== false, `failed probe/control: ${key}`);
    out.set(key, battle);
  }
  assert.ok(!report.runtimeErrors?.length, 'report contains runtime errors');
  assert.equal(report.summary?.runtimeErrors || 0, 0, 'report runtime error count');
  return out;
}
function compare(before, after, benchmark = false) {
  const a = index(before),
    b = index(after);
  assert.deepEqual([...a.keys()].sort(), [...b.keys()].sort(), 'battle seeds/types differ');
  if (!benchmark) {
    assert.equal(before.step, after.step, 'probe fixed steps differ');
    assert.equal(before.seconds, after.seconds, 'probe time limits differ');
    assert.equal(
      new URL(before.url).searchParams.get('mind'),
      new URL(after.url).searchParams.get('mind'),
      'mind modes differ'
    );
  }
  const changes = [];
  let oldWall = 0,
    newWall = 0;
  for (const [key, old] of a) {
    const next = b.get(key);
    let left, right;
    if (benchmark) {
      left = {};
      right = {};
      for (const field of BENCHMARK_FIELDS) {
        assert.ok(Object.hasOwn(old, field) && Object.hasOwn(next, field), `missing ${field}: ${key}`);
        left[field] = old[field];
        right[field] = next[field];
      }
    } else {
      left = withoutTransitionDiagnostics(old.reports?.['state-fingerprint']);
      right = withoutTransitionDiagnostics(next.reports?.['state-fingerprint']);
      assert.ok(
        left?.state && right?.state && left.events && right.events,
        `missing state-fingerprint probe: ${key}`
      );
      assert.equal(old.steps, next.steps, `step count differs: ${key}`);
    }
    const delta = difference(left, right);
    if (delta) changes.push({ key, ...delta });
    oldWall += old.wallSeconds || 0;
    newWall += next.wallSeconds || 0;
  }
  return {
    compared: a.size,
    identical: a.size - changes.length,
    changes,
    wallSeconds: {
      before: +oldWall.toFixed(3),
      after: +newWall.toFixed(3),
      ratio: oldWall ? +(newWall / oldWall).toFixed(3) : null
    }
  };
}
if (require.main === module) {
  try {
    const args = process.argv.slice(2),
      benchmark = args[0] === '--benchmark';
    if (benchmark) args.shift();
    assert.equal(
      args.length,
      2,
      'usage: compare_battle_fingerprints.cjs [--benchmark] before.json after.json'
    );
    const result = compare(...args.map(file => JSON.parse(fs.readFileSync(file, 'utf8'))), benchmark);
    console.log(JSON.stringify(result, null, 2));
    if (result.changes.length) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { compare, difference };
