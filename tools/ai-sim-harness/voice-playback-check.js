#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const REPO = path.resolve(__dirname, '..', '..');

function runModule(rel) {
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
      callouts: { us: { events: { test: ['voices/us/test.mp3'] } } },
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
  const handle = ctx.BattleVoiceScheduler.enqueue(soldier, 'test', null, { priority: 'tactical' });
  assert.ok(handle && handle.accepted, rel + ': request accepted');
  assert.equal(handle.started, false, rel + ': waits for sound readiness');
  assert.equal(ready.length, 1, rel + ': one sound load requested');

  ready[0]();

  assert.equal(handle.started, true, rel + ': playback handle starts after ready');
  assert.equal(sounds[0].played, 1, rel + ': Babylon Sound.play called');
  assert.equal(sounds[0].attached, mesh, rel + ': sound follows the soldier mesh');
  assert.deepEqual(errors, [], rel + ': playback does not fall into the error handler');
}

runModule('battle/modules/09-voice-runtime.js');
runModule('battle/modules/11-voice-variation.js');

console.log('voice-playback-check: PASS');
