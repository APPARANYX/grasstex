#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const REPO = path.resolve(__dirname, '..', '..');

function runModule(rel, invalidate) {
  const ready = [];
  const sounds = [];
  const errors = [];
  const ctx = {
    console: {
      log() {},
      warn() {},
      error(...args) {
        errors.push(args.join(' '));
      }
    },
    performance: { now: () => 5000 },
    location: { search: '' },
    BATTLE_AUDIO_BASE: '/audio/',
    BATTLE_AUDIO_MANIFEST: {
      callouts: { us: { events: { engage: ['voices/us/test.mp3'] } } },
      rules: {
        voice: {
          dropBeyondDistance: 120,
          perSquadCooldownSeconds: 2.5,
          variation: {
            profiles: [{ id: 'neutral', semitones: 0, suffix: '', weight: 1 }]
          }
        }
      },
      runtime: { voiceMaxDistance: 95 }
    },
    BattleAudioFormat: { url: u => u }
  };

  class Sound {
    constructor(name, url, scene, onReady) {
      this.name = name;
      this.url = url;
      this.scene = scene;
      this.played = 0;
      this.isPlaying = false;
      this.attached = null;
      this.onEndedObservable = {
        addOnce: fn => {
          this.onEnded = fn;
        }
      };
      sounds.push(this);
      ready.push(onReady);
    }
    attachToMesh(mesh) {
      this.attached = mesh;
    }
    detachFromMesh() {
      this.attached = null;
    }
    setPosition(p) {
      this.position = p;
    }
    play() {
      this.played++;
      this.isPlaying = true;
    }
  }

  ctx.BABYLON = { Sound };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(REPO, 'battle/core-runtime.js'), 'utf8'), ctx, {
    filename: 'battle/core-runtime.js'
  });
  vm.runInContext(fs.readFileSync(path.join(REPO, rel), 'utf8'), ctx, { filename: rel });

  const mesh = {
    position: { x: 0, y: 0, z: 0 },
    getScene() {
      return {};
    }
  };
  const soldier = {
    id: 7,
    faction: 'us',
    role: 'rifleman',
    root: mesh,
    squad: { id: 'us-0' }
  };
  const handle = ctx.BattleVoiceScheduler.enqueue(soldier, 'engage', null, { priority: 'tactical' });
  assert.ok(handle && handle.accepted, rel + ': request accepted');
  assert.equal(handle.started, false, rel + ': waits for sound readiness');
  assert.equal(ready.length, 1, rel + ': one sound load requested');

  if (invalidate) {
    invalidate(soldier);
    ready[0]();
    assert.equal(handle.started, false, rel + ': obsolete queued order must not start');
    assert.equal(handle.ended, true, rel + ': cancelled handle is completed');
    assert.equal(sounds[0].played, 0, rel + ': no obsolete Sound.play');
    return;
  }
  ready[0]();

  assert.equal(handle.started, true, rel + ': playback handle starts after ready');
  assert.equal(sounds[0].played, 1, rel + ': Babylon Sound.play called');
  assert.equal(sounds[0].attached, mesh, rel + ': sound follows the soldier mesh');
  if (rel.includes('11-voice-variation')) {
    ctx.performance.now = () => 6000;
    const overlapped = ctx.BattleVoiceScheduler.enqueue(soldier, 'engage', null, { priority: 'tactical' });
    assert.ok(overlapped && overlapped.ended, 'same cached sound cannot restart while playing');
    assert.equal(overlapped.started, false);
    assert.equal(sounds[0].played, 1, 'overlapping speaker does not cut the original voice');
    sounds[0].isPlaying = false;
    sounds[0].onEnded();
    assert.equal(handle.ended, true, 'physical end frees the active voice slot');
    ctx.performance.now = () => 7000;
    const resumed = ctx.BattleVoiceScheduler.enqueue(soldier, 'engage', null, { priority: 'tactical' });
    assert.ok(resumed && resumed.started, 'speaker can reuse the clip after actual completion');
    assert.equal(sounds[0].played, 2);
    assert.equal(ctx.BattleVoiceScheduler.summary().active, 1);
    // A missing Babylon end event must not silence all subsequent voices.
    sounds[0].isPlaying = false;
    ctx.performance.now = () => 8000;
    const repaired = ctx.BattleVoiceScheduler.enqueue(soldier, 'engage', null, { priority: 'tactical' });
    assert.ok(repaired && repaired.started, 'stale playback bookkeeping is repaired on the next request');
    assert.equal(sounds[0].played, 3);
    assert.equal(ctx.BattleVoiceScheduler.summary().staleRecovered, 1);
    assert.equal(resumed.ended, true, 'orphaned prior playback handle completed once');
    assert.equal(ctx.BattleVoiceScheduler.summary().active, 1);
  }
  assert.deepEqual(errors, [], rel + ': playback does not fall into the error handler');
}

runModule('battle/modules/09-voice-runtime.js');
runModule('battle/modules/11-voice-variation.js');

for (const rel of ['battle/modules/09-voice-runtime.js', 'battle/modules/11-voice-variation.js']) {
  for (const invalidate of [
    s => {
      s.eng = { state: 'freeze' };
    },
    s => {
      s.eng = { state: 'flee' };
    },
    s => {
      s.dead = true;
    },
    s => {
      s.root.isDisposed = () => true;
    },
    s => {
      s.squad = { id: 'replacement' };
    },
    s => {
      s.squad.state = 'retreat';
    }
  ])
    runModule(rel, invalidate);
}
const ctx = { console, window: null };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(REPO, 'battle/core-runtime.js'), 'utf8'), ctx);
const man = { root: {}, eng: { state: 'freeze' }, squad: { state: 'advance' } };
for (const state of ['freeze', 'flee', 'cower']) {
  man.eng.state = state;
  for (const ev of ['engage', 'contactFront', 'enemyAtWindow', 'takingCommand', 'teamMove'])
    assert.equal(ctx.BattleVoiceEligibility.allows(man, ev), false, state + '/' + ev);
  assert.equal(ctx.BattleVoiceEligibility.allows(man, state === 'freeze' ? 'dazed' : 'takingFire'), true);
}
man.eng.state = 'withdraw';
man.squad.state = 'retreat';
assert.equal(ctx.BattleVoiceEligibility.allows(man, 'fallBackByTeams'), true);
assert.equal(ctx.BattleVoiceEligibility.allows(man, 'takingFire'), true);
assert.equal(ctx.BattleVoiceEligibility.allows(man, 'engage'), false);
man.eng.state = 'advance';
man.squad.state = 'advance';
assert.equal(
  ctx.BattleVoiceEligibility.allows(man, 'engage'),
  true,
  'recovered/new battle soldier may speak'
);
console.log('voice-playback-check: PASS');
