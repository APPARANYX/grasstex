#!/usr/bin/env node
'use strict';

/* The standard benchmark reuses one browser page for several seeds in a shard. That is safe only if
   each seed enters the shipping restart lifecycle with the previous battle still intact: restart
   hooks own releasing the old roster and module state. A benchmark-only teardown once zeroed the
   roster/factions/obstacles before rawRestart(); seed 1 reproduced, seeds 2+ in the worker did not.
   Keep this contract static and cheap; the paired benchmark is the runtime proof. */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '..', '..', 'scripts', 'run_battle_benchmark.mjs');
const source = fs.readFileSync(file, 'utf8');

assert.match(
  source,
  /const scenario = root\.BattleTownObjectives\.regenerate\([\s\S]{0,500}?rawRestart\(\);/,
  'each seed must regenerate its scenario and then enter the shipping restart path'
);

assert.doesNotMatch(
  source,
  /sim\._roster\s*=\s*\{\s*us\s*:\s*\[\]/,
  'the benchmark must not erase the old roster before restart hooks can release it'
);
assert.doesNotMatch(
  source,
  /sim\.factions\s*=\s*\{\s*us\s*:/,
  'the benchmark must not replace factions between seeds; BattleSim.restart owns that'
);
assert.doesNotMatch(
  source,
  /sim\.obstacles\s*=\s*\[\]/,
  'the benchmark must not erase scenario obstacles between seeds before restart'
);

const finish = /function finishBattle\(\)\s*\{([\s\S]*?)\n\s*\}/.exec(source);
assert.ok(finish, 'benchmark should have a non-destructive between-seed finish step');
assert.doesNotMatch(
  finish[1],
  /_roster|factions|obstacles|objectives|releaseCurrent|\.dispose\s*\(/,
  'between-seed finish may pause/presentation-clean only; simulation teardown belongs to restart'
);

const calloutFile = path.join(__dirname, '..', '..', 'battle', 'modules', '09-tactical-callouts.js');
const calloutSource = fs.readFileSync(calloutFile, 'utf8');
assert.match(
  calloutSource,
  /registerSystem\('tactical-callouts',[\s\S]{0,300}?onBattleStart:\s*reset,[\s\S]{0,100}?onBattleRestart:\s*reset/,
  'tactical callouts must participate in the shipping battle lifecycle'
);
assert.match(
  calloutSource,
  /resetPerceptionBattleState\(battle\)/,
  'the lifecycle hook must ask the Perception owner to clear battle-scoped memory'
);

console.log('PASS benchmark preserves shipping restart lifecycle between seeds');
