#!/usr/bin/env node
'use strict';

/* #456 R4: exercise the real local PHP entry rather than grepping a pretend
   module list. Non-visual shipping observers and all simulation systems remain
   in both normal and QA pages; only eight strictly gated UI/QA modules differ. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const repo = path.join(__dirname, '../..');
const graph = [
  '30-ai-graph-editor.js',
  '31-ai-graph-logic.js',
  '33-ai-graph-usability.js',
  '34-ai-timing-map.js',
  '37-lease-panel.js',
  '38-ai-diagnostics-export.js'
];
const optional = graph.concat('97-device-benchmark.js', '98-damage-range.js');
const directory = path.join(repo, 'battle/modules');
const available = fs.readdirSync(directory).filter(f => f.endsWith('.js')).sort();
const remote = fs.readFileSync(path.join(repo, 'battle_sim.php'), 'utf8');
const local = fs.readFileSync(path.join(repo, 'battle_sim_local.php'), 'utf8');
for (const name of optional) {
  assert.ok(available.includes(name), 'optional module exists: ' + name);
  for (const source of [remote, local]) {
    assert.ok(source.includes("'" + name + "'"), 'remote and local loaders recognize: ' + name);
  }
}
function page(query) {
  const php = 'parse_str(' + JSON.stringify(query) +
    ', $_GET); $_SERVER["SCRIPT_NAME"] = "/grasstex/battle_sim_local.php"; include "battle_sim_local.php";';
  const html = execFileSync('php', ['-r', php], { cwd: repo, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  const out = [];
  const pattern = /<script src="[^"]*battle\/modules\/([a-z0-9.-]+\.js)\?[^"]*"><\/script>/gi;
  for (const m of html.matchAll(pattern)) out.push(m[1]);
  assert.ok(out.length > 70, 'real modular battle HTML produced module script tags');
  return out;
}
const normal = page('');
const selected = page('devModules=1');
assert.deepEqual(selected, available, 'full debug opt-in restores the exact normal module discovery order');
assert.deepEqual(normal, available.filter(f => !optional.includes(f)), 'production includes every nonoptional module');
assert.deepEqual(page('editor=ai'), normal.concat(graph).sort(), 'editor opt-in restores all six graph UI modules');
assert.deepEqual(page('bench=1'), normal.concat('97-device-benchmark.js').sort(), 'device benchmark remains opt-in');
assert.deepEqual(page('damageRange=1'), normal.concat('98-damage-range.js').sort(), 'damage range remains opt-in');
for (const nonoptional of [
  '32-ai-loop-watch.js',
  '36-order-provenance.js',
  '39-navigation-physicality-debug.js',
  '40-ai-coordination-health.js',
  '40-world-debug-overlay.js',
  '41-squad-status-overlay.js',
  '97-ai-timeline-recorder.js',
  '99-session-diagnostics-export.js'
]) assert.ok(normal.includes(nonoptional), 'never disable real combat/diagnostic dependency ' + nonoptional);
console.log('PASS #456 R4 real PHP default, graph, benchmark, range and full-debug profiles (' +
  normal.length + '/' + selected.length + ' modules)');
