#!/usr/bin/env node
'use strict';

/* #456 R3: event-to-animation state machine remains authoritative and deterministic. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const dir = path.join(__dirname, '../../battle/modules');
const file = '52-fbx-animation-state.js';
const code = fs.readFileSync(path.join(dir, file), 'utf8');
const backend = fs.readFileSync(path.join(dir, '53-fbx-soldier-backend.js'), 'utf8');
assert.ok(file < '53-fbx-soldier-backend.js');
assert.match(backend, /!root\.BattleFbxAnimationState\s*\|\|/);
assert.match(backend, /root\.BattleFbxAnimationState\.create/);
assert.match(backend, /play = ANIM_STATE\.play/);
assert.match(backend, /update = ANIM_STATE\.update/);
assert.doesNotMatch(backend, /function update\(soldier, state, dt\)/);
assert.match(code, /function reactionWeapon\(/);
assert.match(code, /function updateReactionLower\(/);
assert.match(code, /function advance\(/);

const ctx = { window: { GTMath: { clamp: (v, a, b) => Math.min(Math.max(v, a), b) } } };
vm.runInNewContext(code, ctx, { filename: file });
const factory = ctx.window.BattleFbxAnimationState;
assert.equal(typeof factory.create, 'function');
vm.runInNewContext(code, ctx, { filename: file });
assert.equal(ctx.window.BattleFbxAnimationState, factory, 'idempotent install');
const transitions = [];
const clock = [];
const tags = { fire: 'fire', hit: 'hit', reload: 'reload', throw: 'throw' };
const deps = {
  Q: class Quat {},
  TAGS: tags,
  THROW_RELEASE: { throw: 0.5, throwCrouch: 0.4, throwProne: 0.6 },
  REACTION_ANIM: {
    fade: 0.2,
    holds: ['reactionFreezeStanding'],
    dropSide: 0,
    dropBack: 0,
    dropLift: 0,
    dropYaw: 0
  },
  DEATH_POOLS: {
    side: ['deathSide'],
    prone: ['deathSide'],
    crouch: ['deathSide'],
    running: ['deathSide'],
    front: ['deathSide'],
    back: ['deathSide']
  },
  IDLE_VARIANTS: ['idle'],
  FLINCH_RATE: 1.3,
  setClip: (layer, clip, rate, fade, restart, phase) => {
    transitions.push({ layer, clip, rate, fade, restart, phase });
  },
  advanceLayer: (layer, dt) => clock.push([layer, dt]),
  topEntry: () => null
};
const owner = factory.create(deps);
assert.equal(typeof owner.play, 'function');
assert.equal(typeof owner.update, 'function');
assert.equal(typeof owner.advance, 'function');
assert.equal(owner.update({ _fbx: null }, {}, 0.1), false, 'unbound soldier has no animation updates');
const fx = {
  lib: {
    clips: {
      throw: { duration: 1 },
      throwCrouch: { duration: 1 },
      throwProne: { duration: 1 },
      deathSide: { duration: 1 }
    }
  },
  fireShot: 0,
  hitShot: 0,
  reloadShot: 0,
  lower: {},
  upper: {},
  overlay: 0,
  overlayTarget: 1,
  aim: 0,
  aimWanted: true,
  vx: 0,
  vz: 0,
  lastX: null,
  lastZ: null,
  stance: 'stand',
  moving: false
};
const soldier = {
  _fbx: fx,
  root: { position: { x: 2, y: 0, z: 3 }, rotation: { y: 0 } },
  dead: true,
  weapon: { kind: 'rifle', stats: { reloadTime: 3.4 } }
};
owner.play(tags.fire, { delay: 0 }, soldier);
assert.equal(fx.fireShot, 1);
assert.equal(fx.fireBurst, false);
owner.play(tags.fire, { delay: 0.1 }, soldier);
assert.equal(fx.fireShot, 2);
assert.equal(fx.fireBurst, true);
owner.play(tags.hit, {}, soldier);
assert.equal(fx.hitShot, 1);
owner.play(tags.reload, {}, soldier);
assert.equal(fx.reloadDuration, 3.4, 'fallback to weapon reload time');
owner.play(tags.reload, { duration: 1.25 }, soldier);
assert.equal(fx.reloadDuration, 1.25);
assert.equal(fx.reloadShot, 2);
soldier.crouching = true;
owner.play(tags.throw, { decidedAt: 10, releaseAt: 11 }, soldier);
assert.equal(fx.throwing.key, 'throwCrouch');
assert.equal(fx.throwing.stance, 'crouch');
assert.ok(Math.abs(fx.throwing.rate - 0.4) < 1e-9);
assert.equal(fx.throwing.started, false);
owner.play(tags.throw, { decidedAt: 10, releaseAt: 11.6 }, soldier);
assert.ok(
  Math.abs(fx.throwing.rate - 0.25) < 1e-9,
  'slower 1.6s native windup respects authored release frame'
);
fx.throwing = null;
assert.equal(owner.update(soldier, {}, 0.1), true, 'dead soldier gets authored death clip');
assert.equal(fx.death, 'deathSide');
assert.equal(transitions.length, 1);
assert.equal(transitions[0].clip, fx.lib.clips.deathSide);
assert.equal(fx.overlayTarget, 0);
assert.equal(fx.aimWanted, false);
assert.equal(fx.supportReleased, true);
assert.equal(fx.speed, 0);
assert.equal(clock.length, 2, 'both lower and upper clip layers advance once');
assert.equal(clock[0][1], 0.1);
assert.equal(fx.aim, 0);
fx.overlayTarget = 1;
fx.aimWanted = true;
owner.advance(fx, 0.11);
assert.ok(Math.abs(fx.overlay - 0.5) < 1e-9);
assert.ok(Math.abs(fx.aim - 0.11 / 0.3) < 1e-9);
assert.equal(clock.length, 4);
console.log(
  'PASS #456 R3 animation state tag triggers, burst and reload timing, stance-specific throw, death clip, deterministic layer clocks, overlay/aim blending and module ownership'
);
