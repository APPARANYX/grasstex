#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const file = path.resolve(__dirname, '../../battle/battle_sim.html');
const html = fs.readFileSync(file, 'utf8');
const scripts = [];

for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (/\bsrc\s*=/.test(match[1])) continue;
  const body = match[2].trim();
  if (body) scripts.push(body);
}

assert.ok(scripts.length >= 2, 'battle_sim.html should contain inline bootstrap/runtime scripts');
scripts.forEach((body, index) => {
  assert.doesNotThrow(
    () => new vm.Script(body, { filename: `battle_sim.html:inline-${index + 1}` }),
    `inline script ${index + 1} must parse as JavaScript`
  );
});
assert.ok(!html.includes('\\n  function'), 'literal escaped newlines must not leak into inline JavaScript');

console.log(`PASS battle page inline JavaScript parses cleanly (${scripts.length} scripts)`);
