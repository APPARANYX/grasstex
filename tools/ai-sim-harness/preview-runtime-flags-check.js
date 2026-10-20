#!/usr/bin/env node
'use strict';
/* Exercise the PHP forwarding contract against the shipping strategic owners.
   A forwarded query is insufficient unless fleet/recon/interception actually activate. */
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { loadModule } = require('./module-loader');
const repo = path.resolve(__dirname, '../..');
const names = ['strategicInterception', 'motorTransport', 'aerialRecon', 'interception', 'truckCollision'];
const inputs = Array.from({ length: 32 }, (_, mask) =>
  Object.fromEntries(names.map((name, bit) => [name, mask & (1 << bit) ? '1' : '0']))
);
const queries = JSON.parse(
  execFileSync(
    'php',
    [
      '-r',
      'require $argv[1]; $out=array(); foreach(json_decode($argv[2],true) as $q) $out[]=http_build_query(grasstex_preview_options($q)); echo json_encode($out);',
      path.join(repo, 'runtime-contract.php'),
      JSON.stringify(inputs)
    ],
    { encoding: 'utf8' }
  )
);
for (const profile of ['strategic', 'legacy'])
  queries.forEach((query, index) => {
    const hooks = {};
    const root = {
      location: { search: '?' + query },
      GTLog() {},
      BattleModules: {
        registerSystem: (id, api) => {
          hooks[id] = api;
        }
      }
    };
    loadModule(root, 'battle/core-runtime.js');
    for (const name of [
      '58-strategic-abstract-transport',
      '59-strategic-aerial-recon',
      '59b-strategic-interception'
    ])
      loadModule(root, 'battle/modules/' + name + '.js');
    const sim = {
      time: 0,
      obstacles: [],
      factions: { us: { squads: [] }, ge: { squads: [] } },
      scene: {
        metadata: {
          battleScenario: {
            profile,
            spawnZones: {
              us: { bases: [{ id: 'a', objectiveId: 'a', x: 0, z: 0 }] },
              ge: { bases: [{ id: 'b', objectiveId: 'b', x: 0, z: 1000 }] }
            },
            roads: [{ fromObjectiveId: 'a', toObjectiveId: 'b', ax: 0, az: 0, bx: 0, bz: 1000 }]
          }
        }
      }
    };
    hooks['strategic-abstract-transport'].onBattleStart(sim);
    const flags = inputs[index],
      active = profile === 'strategic';
    const expectedFleet = active && flags.motorTransport === '1' ? 4 : 0;
    assert.equal(
      root.BattleSquadTransport.fleetSummary(sim).length,
      expectedFleet,
      'real fleet from forwarded flags'
    );
    assert.equal(
      root.BattleAerialRecon.status(sim, 'us').enabled,
      active && flags.strategicInterception === '1' && flags.aerialRecon === '1',
      'real recon gate from forwarded flags'
    );
    assert.equal(
      root.BattleStrategicInterception.enabled(sim),
      active && names.slice(0, 4).every(name => flags[name] === '1'),
      'real interception prerequisites from forwarded flags'
    );
    assert.equal(
      sim.obstacles.__dynamicFootprints.length,
      flags.truckCollision === '1' ? expectedFleet : 0,
      'real colliders from forwarded flags'
    );
  });
console.log('PASS 64 composed PHP-forwarding / strategic-runtime activation cases');
