#!/usr/bin/env node
'use strict';
/* The voice that reads the battle (modules 47 and 48: contextual voice and voice observations) is presentation:
   the same battle, run with both modules speaking every line the audio manifest has and run without them, must be
   identical (every man's position, health and death, and the number of combat-RNG draws). It must also actually
   speak: the new lines of the manifest (PR #170) are heard on a real fight, and nothing throws. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  H = require('./harness');
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));

function load(root, rel) {
  const code = fs.readFileSync(path.join(H.REPO, rel), 'utf8');
  new Function('window', 'globalThis', 'console', code + '\n//# sourceURL=' + rel)(root, root, console);
}
function battle(voice) {
  H.resetIds();
  const root = H.bootstrap(),
    b = H.makeBattle(root, { seed: 4242 });
  b.scene = { metadata: { battleScenario: { seed: 'voice-observations' } }, activeCamera: null };
  const sq = [
    H.addSquad(root, b, {
      id: 'us-0',
      faction: 'us',
      x: -12,
      z: -60,
      objective: { x: -12, z: 60 },
      facing: 0,
      seed: 11
    }),
    H.addSquad(root, b, {
      id: 'us-1',
      faction: 'us',
      x: 14,
      z: -62,
      objective: { x: 14, z: 60 },
      facing: 0,
      seed: 12
    }),
    H.addSquad(root, b, {
      id: 'ge-0',
      faction: 'ge',
      x: -10,
      z: 60,
      objective: { x: -10, z: -60 },
      facing: Math.PI,
      seed: 13
    }),
    H.addSquad(root, b, {
      id: 'ge-1',
      faction: 'ge',
      x: 12,
      z: 62,
      objective: { x: 12, z: -60 },
      facing: Math.PI,
      seed: 14
    })
  ];
  const ticks = [],
    spoken = {};
  if (voice) {
    root.BATTLE_AUDIO_MANIFEST = JSON.parse(
      fs.readFileSync(path.join(H.REPO, 'Assets/audio/manifest.json'), 'utf8')
    );
    root.BattleModules = Object.assign({}, root.BattleModules, {
      registerSystem(id, spec) {
        if (spec.onBattleStart) spec.onBattleStart(b);
        if (spec.onSimulationStep) ticks.push(spec.onSimulationStep);
      }
    });
    load(root, 'battle/modules/47-contextual-voice-behavior.js');
    load(root, 'battle/modules/48-voice-observations.js');
    assert.ok(root.BattleVoiceObservations, 'module 48 loaded');
    b.onCallout = function (s, type) {
      spoken[type] = (spoken[type] || 0) + 1;
    };
  }
  let draws = 0;
  const random = b.random;
  b.random = function () {
    draws++;
    return random.call(this);
  };
  H.run(root, b, 150, () => ticks.forEach(fn => fn(b)));
  const men = sq.reduce((a, q) => a.concat(q.members), []);
  return {
    state: men.map(s => [s.id, +s.root.position.x.toFixed(4), +s.root.position.z.toFixed(4), s.hp, !!s.dead]),
    draws,
    spoken,
    obs: b._voiceObs
  };
}
const quiet = battle(false),
  talking = battle(true);
assert.equal(talking.draws, quiet.draws, 'the voice must not draw from the combat RNG');
assert.deepEqual(talking.state, quiet.state, 'the battle must be identical with and without the voice');
const manifest = JSON.parse(fs.readFileSync(path.join(H.REPO, 'Assets/audio/manifest.json'), 'utf8')),
  scripted = new Set(manifest.callouts.us.generation.map(g => g.event)),
  before = new Set([
    'contact',
    'advance',
    'engage',
    'retreat',
    'reload',
    'ammoLow',
    'killConfirm',
    'manDown'
  ]),
  newHeard = Object.keys(talking.spoken).filter(e => scripted.has(e) && !before.has(e));
assert.ok(talking.obs && Object.keys(talking.obs.squads).length >= 4, 'module 48 sampled every squad');
assert.ok(newHeard.length >= 3, 'new lines are spoken on a real fight: ' + JSON.stringify(talking.spoken));
for (const e of Object.keys(talking.spoken))
  for (const side of ['us', 'ge'])
    assert.ok((manifest.callouts[side].events[e] || []).length, e + ' has recorded ' + side + ' lines');
console.log(
  'PASS the voice reads the battle and leaves it unchanged; lines spoken: ' + JSON.stringify(talking.spoken)
);
