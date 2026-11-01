'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadModule } = require('./module-loader');
const repo = path.resolve(__dirname, '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hotpath-contract-'));

function pythonBody(file) {
  const text = fs.readFileSync(path.join(repo, file), 'utf8');
  const match = text.match(/python3 - <<'PY'\n([\s\S]*?)\n          PY/);
  assert.ok(match, 'the shipping workflow contains the Python entry point');
  return match[1].replace(/^          /gm, '');
}
function python(source, extra = {}) {
  return spawnSync('python3', ['-c', source], {
    cwd: temp,
    env: { ...process.env, ...extra },
    encoding: 'utf8'
  });
}

try {
  fs.mkdirSync(path.join(temp, '.github'));
  const launch = pythonBody('.github/workflows/agent-benchmark-launcher.yml');
  function request(value) {
    fs.writeFileSync(path.join(temp, '.github/benchmark-request.json'), JSON.stringify(value));
    return python(
      'import json, subprocess\n' +
        'subprocess.run = lambda cmd, **kwargs: print("CAPTURE " + json.dumps(cmd))\n' +
        'exec(compile(' +
        JSON.stringify(launch) +
        ', "shipping-launcher", "exec"))',
      { REPO: 'APPARANYX/grasstex' }
    );
  }
  const query = 'strategicInterception=0&tacticalController=new&literal=$(touch SHOULD_NOT_EXIST)';
  const valid = {
    benchmark: 'hotpath',
    ref: 'work/controller-meso-wrap-20261101',
    battle_type: 'us-defend',
    seed: 'controller-natural-20261026-0002',
    sim_seconds: '600',
    query
  };
  const launched = request(valid);
  assert.equal(launched.status, 0, launched.stderr);
  const command = JSON.parse(
    launched.stdout
      .split('\n')
      .find(line => line.startsWith('CAPTURE '))
      .slice(8)
  );
  assert.deepEqual(command.slice(0, 5), ['gh', 'workflow', 'run', 'battle-hotpath-profile.yml', '--repo']);
  assert.equal(command.filter(value => value === 'query=' + query).length, 1);
  assert.equal(command[command.indexOf('--ref') + 1], valid.ref);
  assert.equal(fs.existsSync(path.join(temp, 'SHOULD_NOT_EXIST')), false, 'query is data, never shell code');
  const standard = request({ benchmark: 'standard', seed: 'unchanged-standard' });
  assert.equal(standard.status, 0, standard.stderr);
  assert.match(standard.stdout, /battle-benchmark-standard\.yml/);
  assert.match(standard.stdout, /"--ref", "main"/);
  for (const invalid of [
    { ...valid, ref: 'main;echo injected' },
    { ...valid, ref: '../main' },
    { ...valid, query_on: 'tacticalController=new' },
    { ...valid, battle_type: 'other' }
  ]) {
    const result = request(invalid);
    assert.notEqual(result.status, 0, 'invalid request must fail closed');
    assert.ok(!result.stdout.includes('CAPTURE '), 'invalid request must not dispatch');
  }
  console.log('PASS shipping launcher routes hotpath flags literally and rejects invalid dispatches');

  const resolve = pythonBody('.github/workflows/battle-hotpath-profile.yml');
  const envFile = path.join(temp, 'github-env');
  for (const [kind, expected] of [
    ['meeting', '?strategicInterception=0&tacticalController=new'],
    ['us-defend', '?defender=us&strategicInterception=0&tacticalController=new'],
    ['ge-defend', '?defender=ge&strategicInterception=0&tacticalController=new']
  ]) {
    fs.writeFileSync(envFile, '');
    const result = python(resolve, {
      BATTLE_PROFILE_TYPE: kind,
      PROFILE_QUERY: '?strategicInterception=0&tacticalController=new',
      GITHUB_ENV: envFile
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      fs.readFileSync(envFile, 'utf8'),
      'BATTLE_PROFILE_URL=http://127.0.0.1:8765/grasstex/battle_sim_local.php' + expected + '\n'
    );
  }
  for (const query of ['x=1\nINJECTED=1', 'x=1#tacticalController=new', 'defender=ge', 'seed=other']) {
    fs.writeFileSync(envFile, '');
    const result = python(resolve, {
      BATTLE_PROFILE_TYPE: 'meeting',
      PROFILE_QUERY: query,
      GITHUB_ENV: envFile
    });
    assert.notEqual(result.status, 0);
    assert.equal(fs.readFileSync(envFile, 'utf8'), '', 'invalid query cannot inject environment or scenario');
  }
  fs.writeFileSync(envFile, '');
  assert.equal(
    python(resolve, { BATTLE_PROFILE_TYPE: 'meeting', PROFILE_QUERY: '', GITHUB_ENV: envFile }).status,
    0
  );
  assert.equal(
    fs.readFileSync(envFile, 'utf8'),
    'BATTLE_PROFILE_URL=http://127.0.0.1:8765/grasstex/battle_sim_local.php\n',
    'an omitted query preserves the existing default profiling URL'
  );
  console.log('PASS profile URLs preserve scenario ownership and reject environment/fragment injection');

  const calls = [],
    payload = { unchanged: true },
    returned = {},
    failure = new Error('owner failure'),
    originals = [];
  let clock = 0;
  const root = { performance: { now: () => ++clock } };
  const targets = {
    BattleTacticalController: ['dispatch'],
    BattleTacticalContactSkills: ['update'],
    BattleTacticalCoveredManeuver: ['update', 'summary'],
    BattleTacticalFlankAssault: ['update'],
    BattleTacticalContactRoute: ['pick', 'pickDefense', 'evaluate'],
    BattleCoverPositions: ['boundThreats', 'candidates'],
    BattleGrenades: ['assaultAssessment']
  };
  for (const [name, methods] of Object.entries(targets)) {
    const owner = (root[name] = {});
    for (const method of methods) {
      const fn = function (value, fail) {
        assert.equal(this, owner);
        assert.equal(value, payload);
        calls.push(name + '.' + method);
        if (fail) throw failure;
        return returned;
      };
      owner[method] = fn;
      originals.push({ owner, method, fn });
    }
  }
  loadModule(root, 'scripts/battle-hotpath-profiler.cjs');
  const profiler = root.BattleHotpathProfiler;
  for (const { owner, method } of originals) {
    assert.equal(owner[method](payload), returned, 'owner result identity is preserved');
    assert.throws(
      () => owner[method](payload, true),
      error => error === failure
    );
  }
  assert.deepEqual(payload, { unchanged: true });
  assert.equal(calls.length, originals.length * 2, 'each call reaches its owner exactly once');
  assert.equal(profiler.snapshot().rows.length, originals.length);
  assert.ok(profiler.snapshot().rows.every(row => row.calls === 2 && row.totalMs > 0));
  profiler.reset();
  assert.equal(profiler.snapshot().rows.length, 0);
  profiler.restore();
  for (const { owner, method, fn } of originals) assert.equal(owner[method], fn);
  assert.equal(root.BattleTacticalController.dispatch(payload), returned);
  assert.equal(profiler.snapshot().rows.length, 0, 'restored owner calls no longer collect timings');
  console.log('PASS controller profiler preserves owner calls, results, exceptions and restoration');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
