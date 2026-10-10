#!/usr/bin/env node
'use strict';

/* #456 R3: the deployed prepared animation pack must match the converter's
   real owners after the #470 lexical rig extraction (not a stale backend path). */
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { expected, readHeader, sha256, converterText } = require('../../scripts/lib/clip-pack-sources.cjs');

const root = path.resolve(__dirname, '../..');
const rig = fs.readFileSync(path.join(root, 'battle/modules/52-fbx-rig-canon.js'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'battle/modules/53-fbx-soldier-backend.js'), 'utf8');
assert.match(rig, /function rigScheme\(/);
assert.match(rig, /function canon\(/);
assert.doesNotMatch(backend, /function rigScheme\(/);
const checksumSource = converterText(rig + '\n' + backend);
const want = expected(root);
const { header } = readHeader();
assert.equal(sha256(checksumSource), want.converter, 'real owners must determine converter fingerprint');
assert.equal(want.converter, header.converter, 'prepared clip converter fingerprint stale');
assert.equal(want.babylon, header.babylon, 'Babylon FBX loader pin changed');
assert.equal(JSON.stringify(want.clips), JSON.stringify(Object.fromEntries(header.clips.map(clip => [clip.key, clip.spec]))), 'prepared clip table changed');
for (const [file, hash] of Object.entries(want.sources))
  assert.equal(header.sources[file], hash, 'packed animation source changed: ' + file);
assert.ok(header.clips.length > 30 && Object.keys(want.sources).length > 15, 'unexpected empty prepared clip pack');
assert.throws(() => converterText(rig.replace('function canon(', 'function movedCanon(') + '\n' + backend), /function canon not found/, 'missing canonicalizer must fail fingerprint extraction');
assert.notEqual(
  sha256(converterText(rig.replace('function canon(', 'function canon(/* moved */') + '\n' + backend)),
  want.converter,
  'a changed rig converter must make the prepared pack stale'
);
console.log('PASS #456 R3 prepared clip hashes cover rig canon + backend converter, every FBX source and pinned Babylon version');
