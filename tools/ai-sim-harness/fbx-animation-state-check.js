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
// Exercise live state selection and real mixer clocks, including overlapping hit/suppression.
vm.runInNewContext(fs.readFileSync(path.join(dir, '52-fbx-clip-mixer.js'), 'utf8'), ctx);
const mixer = ctx.window.BattleFbxClipMixer.create(30);
const realClips = Object.fromEntries(
  require('../../scripts/lib/clip-pack-sources.cjs')
    .readHeader()
    .header.clips.map(c => [c.key, { key: c.key, duration: c.duration, loop: c.loop, speed: 2 }])
);
for (let i = 0; i < 8; i++) {
  realClips['run' + i].speed = 4;
  realClips['sprint' + i].speed = 6;
}
const live = factory.create({ ...deps, ...mixer, IDLE_VARIANTS: ['idleFidget'] });
function man() {
  return {
    root: { position: { x: 0, y: 0, z: 0 }, rotation: { y: 0 } },
    weapon: { kind: 'rifle' },
    isPlayer: true,
    _locomotionGait: 'walk',
    _fbx: {
      lib: { clips: realClips },
      lower: { entries: [] },
      upper: { entries: [] },
      vx: 0,
      vz: 0,
      yawRate: 0,
      sector: 0,
      stance: 'stand',
      fireShot: 0,
      fireSeen: 0,
      fireHold: 0,
      reloadShot: 0,
      reloadSeen: 0,
      overlay: 0,
      aim: 0,
      moving: false
    }
  };
}
function step(s, speed = 0, count = 1) {
  for (let i = 0; i < count; i++) {
    s.root.position.z += speed * 0.05;
    live.update(s, {}, 0.05);
  }
}
{
  const s = man(),
    f = s._fbx;
  step(s);
  step(s, 3, 30);
  assert.equal(f.family, 'walk');
  s._locomotionGait = 'run';
  step(s, 3);
  assert.equal(f.family, 'run', 'run input escapes walking hysteresis without a stance toggle');
  assert.equal(mixer.topEntry(f.lower).clip.key, 'run0');
  s.crouching = true;
  s._locomotionGait = 'crouchSprint';
  step(s, 3, 10);
  assert.equal(f.family, 'crouchRun');
  s.crouching = false;
  s._locomotionGait = 'run';
  step(s, 3, 10);
  assert.equal(f.family, 'run', 'standing again retains the same running family');
  s._locomotionGait = 'walk';
  step(s, 3);
  assert.equal(f.family, 'walk', 'release run selects walk at the same measured speed');
  s.isPlayer = false;
  step(s, 6, 30);
  assert.equal(f.family, 'sprint', 'AI still selects its family from measured motion');
}
/* Real imported rifle Run/Sprint clips differ by only 0.05 m/s. A live bound
 * must break the retained Run family once physically fast, rather than
 * displaying Rifle Run at 1.5x throughout an authoritative sprint. */
{
  const s = man(),
    f = s._fbx;
  s.isPlayer = false;
  f.lib = { clips: { ...realClips, sprint0: { ...realClips.sprint0, speed: 4.15 } } };
  s._locomotionGait = 'run';
  step(s, 4.2, 20);
  f.family = 'run'; // the common pre-bound animation, intentionally sticky
  s._locomotionGait = 'sprint';
  step(s, 6.2, 12);
  assert.ok(f.speed > 5.2, 'physical sprint is well above the authored clip cadence');
  assert.equal(f.family, 'sprint', 'AI sprint uses Sprint clip despite similar Run natural speed');
  assert.equal(mixer.topEntry(f.lower).clip.key, 'sprint0');
  step(s, 0.8, 24);
  assert.notEqual(f.family, 'sprint', 'near-station slowdown does not play slow-motion Sprint');
  s.crouching = true;
  s._locomotionGait = 'crouchRun';
  step(s, 3, 12);
  assert.ok(['crouch', 'crouchRun'].includes(f.family), 'AI sprint correction does not select upright FBX during crouch movement');
}
{
  const s = man(),
    f = s._fbx;
  step(s);
  assert.equal(mixer.topEntry(f.lower).clip.key, 'idleFidget');
  s.playerAimPoint = { x: 0, y: 1.5, z: 30 };
  step(s);
  assert.equal(mixer.topEntry(f.lower).clip.key, 'aim', 'stationary aimed legs use the planted aim pose');
  live.play(tags.fire, {}, s);
  step(s, 0, 6);
  assert.equal(mixer.topEntry(f.lower).clip.key, 'aim');
  assert.equal(mixer.topEntry(f.upper).clip.key, 'fire');
  assert.equal(f.lower.entries.length, 1, 'random idle legs fade out while firing');
  s.playerAimPoint = null;
  step(s, 0, 30);
  assert.equal(mixer.topEntry(f.lower).clip.key, 'idleFidget', 'relaxed idle returns after shooting');
}
for (const stance of ['stand', 'crouch', 'prone']) {
  const s = man(),
    f = s._fbx;
  s.crouching = stance === 'crouch';
  s.prone = stance === 'prone';
  f.stance = stance;
  step(s);
  s.suppressedUntil = 10;
  live.play(tags.hit, {}, s);
  step(s);
  assert.ok(f.hitHold <= 0.450001, stance + ' hit completes within 450ms');
  assert.equal(f.flinchHold, 0, 'the same hit cannot also queue a suppression reaction');
  assert.equal(f.aimWanted, false, 'aim correction yields during recoil');
  step(s, 0, 11);
  assert.equal(f.hitHold, 0);
  assert.equal(f.overlayTarget, 0, 'hit overlay releases rather than holding the last head pose');
}
{
  const s = man(),
    f = s._fbx;
  step(s);
  // Force the presentation-only random flinch choice.
  vm.runInNewContext('Math.random = () => 0', ctx);
  s.suppressedUntil = 10;
  step(s);
  assert.equal(f.flinchKey, 'hit', 'suppression uses a short recoil rather than shielding/looking around');
  assert.ok(f.flinchHold <= 0.350001);
  step(s, 0, 9);
  assert.equal(f.flinchHold, 0);
  assert.equal(f.overlayTarget, 0);
}
// A final burst round may still be scheduled when ammunition requests reload.
for (const delay of [0, 0.3]) {
  const s = man(),
    f = s._fbx;
  step(s);
  live.play(tags.fire, { delay: 0 }, s);
  if (delay) live.play(tags.fire, { delay }, s);
  s.reloading = true;
  live.play(tags.reload, { duration: 2.5 }, s);
  const wait = 0.5 + delay;
  step(s, 0, Math.round(wait / 0.05) - 1);
  assert.notEqual(
    mixer.topEntry(f.upper).clip.key,
    'reload',
    'reload must wait past the final muzzle offset'
  );
  assert.equal(f.reloadSeen, 0, 'pending reload does not restart the fire clip');
  live.update(s, {}, 0);
  assert.notEqual(mixer.topEntry(f.upper).clip.key, 'reload', 'paused animation cannot consume the delay');
  step(s);
  assert.equal(mixer.topEntry(f.upper).clip.key, 'reload');
  assert.equal(f.reloadSeen, 1);
  assert.ok(
    Math.abs(mixer.topEntry(f.upper).rate - realClips.reload.duration / 2.5) < 1e-6,
    'delayed presentation preserves the full authoritative reload duration'
  );
  assert.equal(s.reloading, true, 'presentation never edits ammunition state');
  s.reloading = false;
  step(s, 0, 30);
  assert.equal(f.overlayTarget, 0, 'reload pose yields when gameplay completes');
}
{
  const s = man(),
    f = s._fbx;
  step(s);
  s.reloading = true;
  live.play(tags.reload, { duration: 2.5 }, s);
  step(s);
  assert.equal(mixer.topEntry(f.upper).clip.key, 'reload', 'no recent shot needs no artificial wait');
}
console.log(
  'PASS #456 R3 animation state tag triggers, burst and reload timing, stance-specific throw, death clip, deterministic layer clocks, possessed gait selection, planted firing legs, brief hit/suppression recoil, final-shot reload delay and module ownership'
);
