#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', '..', 'battle', 'modules', '47-contextual-voice-behavior.js'),
  'utf8'
);

assert.match(
  source,
  /var due = wallNow\(\) \+ Math\.max\(0, \+delayMs \|\| 0\);[\s\S]{0,260}?retryUntil: due \+ 1800/,
  'scheduled voice owns an immutable retry deadline'
);
assert.match(
  source,
  /now < p\.retryUntil[\s\S]{0,120}?p\.due = now \+ 750/,
  'retry cadence may move but the deadline does not'
);
assert.doesNotMatch(
  source,
  /now - p\.due < 1800/,
  'retry eligibility no longer depends on the moving due time'
);

console.log('PASS contextual voice retries have a fixed expiry');
