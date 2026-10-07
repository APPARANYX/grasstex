#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', '..', 'battle', 'modules', '35-ai-command-hierarchy.js'),
  'utf8'
);

assert.match(
  source,
  /function decorate\(\) \{\s*var observer = ui\.observer;\s*if \(observer\) observer\.disconnect\(\);/,
  'owned graph mutations disconnect the hierarchy observer'
);
assert.match(
  source,
  /finally \{\s*if \(observer && ui\.nodes\) observer\.observe\(ui\.nodes, \{ childList: true, subtree: true \}\);\s*\}/,
  'the observer is restored after the owned refresh'
);

console.log('PASS command hierarchy refresh does not observe its own mutations');
