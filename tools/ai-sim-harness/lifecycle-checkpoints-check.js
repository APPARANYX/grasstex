#!/usr/bin/env node
'use strict';
/* #361: optional shipping battle command windows must cover recon release at
   t=450..720 without altering the deterministic synthetic audit's six samples. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../scripts/probes/command-lifecycle.js'), 'utf8');
function run(search) {
  const root = {
    location: { search },
    BattleProbes: {},
    BattleSquadStability: {
      reconTelemetry() {
        return {};
      }
    },
    BattleMovementResolver: {
      summary() {
        return {};
      }
    }
  };
  new Function('window', 'URLSearchParams', source)(root, URLSearchParams);
  const sim = {
    time: 0,
    factions: { us: { squads: [] }, ge: { squads: [] } },
    _roster: { us: [], ge: [] }
  };
  const observer = root.BattleProbes['command-lifecycle'];
  observer.start(sim);
  for (let t = 1; t <= 900; t++) {
    sim.time = t;
    observer.sample(sim);
  }
  return observer.report(sim).checkpoints.map(x => x.checkpoint);
}
assert.deepEqual(
  run(''),
  [0, 120, 180, 240, 300, 420],
  'legacy seven/nine-variant synthetic fixture must retain exact timeline'
);
assert.deepEqual(
  run('?probeLifecycleCheckpoints=720,150,450,180,150,480,510,600,900'),
  [0, 150, 180, 450, 480, 510, 600, 720, 900],
  'real-battle query adds deduplicated sorted post-recon checkpoints'
);
console.log('PASS #361 lifecycle checkpoint parity and 450–900s event coverage');
