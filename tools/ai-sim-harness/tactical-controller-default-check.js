#!/usr/bin/env node
/* Default switch: the battle page runs the guarded tactical controller unless it is told otherwise.
   The page's first script (battle/battle_sim.html, id tactical-controller-default) adds
   ?tacticalController=new to a URL that names no controller, before any module reads its query.
   ?tacticalController=legacy (or any other value) keeps legacy; ?controllerDefault=0 restores the old
   default (legacy unless asked). It must run before every other script on the page. */
'use strict';
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path');
const REPO = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(REPO, 'battle/battle_sim.html'), 'utf8');
const m = html.match(/<script id="tactical-controller-default">([\s\S]*?)<\/script>/);
assert.ok(m, 'battle_sim.html carries the tactical-controller-default script');
assert.equal(
  html.indexOf('<script'),
  m.index,
  'the default script is the first script on the page, ahead of every query read'
);

function run(search, hash) {
  const loc = { pathname: '/grasstex/battle_sim.php', search: search, hash: hash || '' },
    calls = [];
  const history = {
    state: { kept: true },
    replaceState(state, title, url) {
      calls.push({ state, url });
      const u = new URL(url, 'https://example.test');
      loc.search = u.search;
      loc.hash = u.hash;
    }
  };
  new Function('location', 'history', 'URLSearchParams', m[1])(loc, history, URLSearchParams);
  return { search: loc.search, hash: loc.hash, calls };
}
function read(search) {
  /* The same test every module uses on its own query. */
  return /[?&]tacticalController=new(?:&|#|$)/i.test(search);
}

// No controller named: the controller is on, other parameters and the hash kept, no reload.
let r = run('?seed=abc&defender=ge', '#x');
assert.equal(r.calls.length, 1);
assert.deepEqual(r.calls[0].state, { kept: true });
assert.ok(read(r.search), 'empty choice turns the controller on: ' + r.search);
assert.match(r.search, /seed=abc/);
assert.match(r.search, /defender=ge/);
assert.equal(r.hash, '#x');
r = run('');
assert.ok(read(r.search), 'bare page turns the controller on');

// Rollback: an explicit legacy choice stays legacy and the URL is untouched.
for (const q of [
  '?tacticalController=legacy',
  '?seed=a&tacticalController=legacy',
  '?tacticalController=0'
]) {
  r = run(q);
  assert.equal(r.calls.length, 0, q);
  assert.equal(r.search, q);
  assert.ok(!read(r.search), q + ' keeps legacy');
}
// Explicit controller: untouched.
r = run('?tacticalController=new&controllerAmbush=0');
assert.equal(r.calls.length, 0);
assert.ok(read(r.search));
// Off flag for the switch itself: the old default (legacy unless asked).
r = run('?controllerDefault=0&seed=a');
assert.equal(r.calls.length, 0);
assert.ok(!read(r.search), 'controllerDefault=0 keeps the old legacy default');
r = run('?controllerDefault=0&tacticalController=new');
assert.ok(read(r.search), 'controllerDefault=0 still honours an explicit controller');

console.log('tactical-controller-default-check: ok');
