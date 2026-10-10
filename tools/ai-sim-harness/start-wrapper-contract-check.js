#!/usr/bin/env node
'use strict';

/* #456 B2. The start-wrapper chain is a temporary, explicit ABI until the
   registration owner migrates its callers together. Guard against a module
   silently discarding previously installed wrappers or changing load order. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '../..');
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');
const owners = [
  '00-fixed-step-clock',
  '12-soldier-animation-events',
  '98-damage-range',
  '99-session-diagnostics-export'
];
const files = owners.map(name => 'battle/modules/' + name + '.js');
const php = read('battle_sim.php');
assert.match(php, /sort\(\$found, SORT_STRING\)/, 'PHP-discovered modules load sorted');
assert.match(php, /foreach\s*\(\$moduleFiles as \$file\)/, 'module scripts precede operator controls');
assert.match(php, /array\('ai-trainer\.js','battle-control\.js'\)/, 'battle-control installed last');
assert.deepEqual([...owners].sort(), owners, 'wrapper files have a stable module-order suffix');
for (const file of files) {
  const source = read(file);
  assert.match(source, /oldStart\s*=\s*root\.BattleSim\.start/, file + ' captures previous start');
  assert.match(source, /root\.BattleSim\.start\s*=\s*function/, file + ' installs wrapper');
  assert.match(source, /oldStart(?:\(scene, opts\)|\.apply\(this, arguments\))/, file + ' forwards to predecessor');
}
assert.match(
  read('battle/modules/98-damage-range.js'),
  /q\.get\('damageRange'\)\s*!==\s*'1'/,
  'visual test-range start override only installed with explicit opt-in'
);
assert.match(
  read('battle/battle-control.js'),
  /var sim = oldStart\(scene, opts\)/,
  'operator final wrapper must preserve previous initialization'
);
console.log('PASS #456 B2 documented BattleSim.start wrapper ownership, ordering and opt-in');
