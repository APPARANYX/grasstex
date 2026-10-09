#!/usr/bin/env node
'use strict';
/* Legacy generated live-* URLs should not pin the next browser refresh forever.
   Explicitly named and intentionally pinned live seeds still replay bit-for-bit. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const repo = path.resolve(__dirname, '../..'),
  src = fs.readFileSync(path.join(repo, 'battle/scenario-generator.js'), 'utf8'),
  page = fs.readFileSync(path.join(repo, 'battle/battle_sim.html'), 'utf8'),
  root = { GTLog() {} };
new Function('window', 'globalThis', 'URLSearchParams', src)(root, root, URLSearchParams);
const choose = root.BattleScenarioGenerator.initialLoadSeed;
let calls = 0;
const fresh = () => 'live-fresh-' + ++calls;
function expect(request, server, chosen, requested, cleaned) {
  const r = choose(request, server, fresh);
  assert.equal(r.seed, chosen);
  assert.equal(r.requested, requested);
  assert.equal(r.removeAutoSeed, cleaned);
}
expect('', '', 'live-fresh-1', '', false);
expect('', '', 'live-fresh-2', '', false);
expect('?seed=live-mu8p91no-4c64u', 'live-mu8p91no-4c64u', 'live-fresh-3', '', true);
expect('?seed=live-mu8p91no-4c64u&defender=ge', 'live-mu8p91no-4c64u', 'live-fresh-4', '', true);
expect(
  '?seed=historical-battle-42',
  'historical-battle-42',
  'historical-battle-42',
  'historical-battle-42',
  false
);
expect(
  '?seed=live-mu8p91no-4c64u&pinSeed=1',
  'live-mu8p91no-4c64u',
  'live-mu8p91no-4c64u',
  'live-mu8p91no-4c64u',
  false
);
assert.equal(calls, 4, 'explicit seeds must not consume auto-seed entropy');
assert.match(
  page,
  /cleanUrl\.searchParams\.delete\('seed'\)/,
  'old live seeds must be removed from address bar on boot'
);
assert.match(
  page,
  /history\.replaceState\(null,'',cleanUrl\.pathname\+cleanUrl\.search\+cleanUrl\.hash\)/,
  'cleanup preserves unrelated query flags, without adding a new seed'
);
assert.doesNotMatch(
  page,
  /searchParams\.set\(['"]seed['"]/,
  'no code path should inject a generated live seed back into the URL'
);
console.log(
  'PASS generated live seed links clear on load; refresh randomizes; named and pinned links replay'
);
