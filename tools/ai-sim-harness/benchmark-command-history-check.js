#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const { create } = require('../../scripts/lib/benchmark-command-history.cjs');
const sim = {
  time: 0,
  _commandReception: { serial: 0, recent: [] },
  factions: {
    us: { squads: [{ id: 'a', _macroMission: { version: 1, status: 'issued' } }] },
    ge: { squads: [] }
  },
  get random() {
    throw new Error('Evidence must not consult RNG');
  },
  get _roster() {
    throw new Error('Evidence must not inspect actor transforms or targets');
  }
};
const authority = () =>
  JSON.stringify({ time: sim.time, reception: sim._commandReception, factions: sim.factions });
const original = authority();
const trace = create();
trace.sample(sim);
assert.equal(authority(), original, 'collector leaves source state unchanged');
for (let serial = 1; serial <= 6; serial++) {
  sim.time = serial * 0.15;
  sim._commandReception.serial = serial;
  sim._commandReception.recent.push({
    id: 'cmd-' + serial,
    issuedAt: sim.time,
    data: { missionVersion: 1 },
    recipients: ['0', '1']
  });
  sim._commandReception.recent = sim._commandReception.recent.slice(-2); // exercise repeated owner-log rollover
  trace.sample(sim);
}
const before = trace.snapshot();
assert.equal(before.commands.length, 6);
assert.equal(before.coverage.contiguousPublications, 6);
assert.equal(before.coverage.complete, true);
sim._commandReception.recent[0].data.missionVersion = 99;
assert.equal(trace.snapshot().commands[4].data.missionVersion, 1, 'past publications are detached');
before.commands[0].recipients.push('mutated');
assert.deepEqual(
  trace.snapshot().commands[0].recipients,
  ['0', '1'],
  'export does not expose collector state'
);
sim.factions.us.squads[0]._macroMission.status = 'executing';
sim.time += 0.15;
trace.sample(sim);
assert.deepEqual(
  trace.snapshot().missions.map(row => row.mission.status),
  ['issued', 'executing']
);
sim.factions.us.squads = [];
sim.time += 0.15;
trace.sample(sim);
assert.equal(trace.snapshot().missions.at(-1).removed, 'us:a');
// A dropped source entry is a blocker, never a truncated "complete" result.
const missing = create();
const gap = { time: 0, _commandReception: { serial: 3, recent: [{ id: 'cmd-2' }, { id: 'cmd-3' }] } };
assert.throws(() => missing.sample(gap), /dropped publications/);
assert.throws(() => create().sample({ time: 1 }), /start at zero/);
assert.throws(() => create().snapshot(), /not sampled/);
const rewind = create();
rewind.sample({ time: 0 });
rewind.sample({ time: 1 });
assert.throws(() => rewind.sample({ time: 0 }), /clock rewind/);
const reset = create(),
  state = { time: 0, _commandReception: { serial: 0, recent: [] } };
reset.sample(state);
state._commandReception = { serial: 0, recent: [] };
assert.throws(() => reset.sample(state), /reset during collection/);
const bounded = create({ maxEntries: 1 }),
  boundedState = { time: 0, _commandReception: { serial: 1, recent: [{ id: 'cmd-1' }] } };
bounded.sample(boundedState);
boundedState.time = 1;
boundedState._commandReception.serial = 2;
boundedState._commandReception.recent.push({ id: 'cmd-2' });
assert.throws(() => bounded.sample(boundedState), /budget exceeded/);
assert.throws(() => bounded.snapshot(), /budget exceeded/, 'partial evidence cannot claim completeness');
assert.throws(
  () =>
    create({ maxChars: 1 }).sample({
      time: 0,
      factions: {
        us: { squads: [{ id: 'a', _macroMission: { version: 1 } }] }
      }
    }),
  /budget exceeded/
);
assert.throws(() => create({ maxEntries: 0 }), /Invalid/);
// Exercise the shipping launcher's embedded Python without dispatching any workflow.
const fs = require('node:fs'),
  path = require('node:path');
const { spawnSync } = require('node:child_process');
const launcher = fs.readFileSync(
  path.join(__dirname, '../../.github/workflows/agent-benchmark-launcher.yml'),
  'utf8'
);
const embedded = /python3 - <<'PY'\n([\s\S]*?)\n[ \t]*PY(?:\n|$)/.exec(launcher);
assert.ok(embedded, 'canonical benchmark launcher Python exists');
const python = `
import json, os, sys, tempfile, textwrap
from pathlib import Path
from unittest.mock import patch
script = textwrap.dedent(json.load(sys.stdin)['script'])
previous = os.getcwd()
for value, expected in [(True, 'true'), (False, 'false'), ('true', 'true'), ('false', 'false'), ('yes', None), (1, None)]:
    with tempfile.TemporaryDirectory() as directory:
        os.chdir(directory)
        Path('.github').mkdir()
        Path('.github/benchmark-request.json').write_text(json.dumps({'benchmark': 'standard', 'ref': 'work/test', 'command_history': value}))
        with patch.dict(os.environ, {'REPO': 'APPARANYX/grasstex'}), patch('subprocess.run') as dispatch:
            try:
                exec(compile(script, 'agent-benchmark-launcher', 'exec'), {})
            except SystemExit:
                assert expected is None
                dispatch.assert_not_called()
            else:
                assert expected is not None
                assert 'command_history=' + expected in dispatch.call_args.args[0]
        os.chdir(previous)
print('PASS launcher forwards canonical boolean command-history input and rejects malformed controls')
`;
const launchTest = spawnSync('python3', ['-c', python], {
  input: JSON.stringify({ script: embedded[1] }),
  encoding: 'utf8'
});
assert.equal(launchTest.status, 0, launchTest.stdout + launchTest.stderr);
console.log(
  'PASS benchmark command history: read neutrality, contiguous publication proof, rollover, detached exports, Macro transitions, reset/rewind denial and explicit budgets'
);
