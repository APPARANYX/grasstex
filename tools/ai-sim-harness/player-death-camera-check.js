#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../battle/camera-controls.js'), 'utf8');
const helpers = source.slice(
  source.indexOf('    function deathSubject('),
  source.indexOf('    function stepPlayer(')
);
class V {
  constructor(x = 0, y = 0, z = 0) {
    Object.assign(this, { x, y, z });
  }
  clone() {
    return new V(this.x, this.y, this.z);
  }
  add(v) {
    return new V(this.x + v.x, this.y + v.y, this.z + v.z);
  }
  scale(n) {
    return new V(this.x * n, this.y * n, this.z * n);
  }
  copyFrom(v) {
    Object.assign(this, v);
  }
  static Lerp(a, b, t) {
    return a.scale(1 - t).add(b.scale(t));
  }
}
function soldier(id, faction, dead = false) {
  return {
    id,
    faction,
    dead,
    root: { position: new V(id * 10, 0, 0), rotation: { y: 0 }, isDisposed: () => false },
    isPlayer: false
  };
}
function fixture({ killer = true, empty = false } = {}) {
  const victim = soldier(1, 'us', true),
    enemy = soldier(2, 'ge'),
    next = soldier(3, 'us');
  victim.isPlayer = true;
  victim._lastHitBy = enemy;
  victim.casualty = { by: killer ? 2 : null };
  if (!killer) victim._lastHitBy = null;
  const b = { _roster: { us: [victim, ...(empty ? [] : [next])], ge: [enemy] }, heightAt: () => 0 };
  const cam = {
    position: new V(8, 1.62, -3),
    target: new V(8, 1.62, 47),
    fov: 0.58,
    getTarget() {
      return this.target;
    },
    setTarget(v) {
      this.target = v;
    }
  };
  const actions = [];
  const api = new Function(
    'BABYLON',
    'b',
    'victim',
    'next',
    'cam',
    'actions',
    `
    var player=victim, playerBattle=b, deathSequence=null, deathSkip=null, playerYaw=0,
      playerFaction='us', mouseFire=true, mouseAim=true, keys=new Set(['w']),
      scene={}, PLAYER_DISTANCE=3, PLAYER_CAMERA_CLEARANCE=0.5;
    function clamp(x,a,z){return Math.max(a,Math.min(z,x));}
    function ensurePlayerCamera(){return cam;}
    function liveBattle(){return b;}
    function clearPlayerLease(s){s.isPlayer=false;actions.push('release');}
    function clearGrenadeReady(){actions.push('grenade-clear');}
    function hidePlayerPresentation(){actions.push('hide');}
    function showDeathSkip(){actions.push('skip-show');}
    function playerSoldierEligible(b,s){return !!s && !s.dead && b._roster.us.includes(s);}
    function pickPlayerSoldier(){return b._roster.us.find(s=>!s.dead)||null;}
    function possessSoldier(s){if(!playerSoldierEligible(b,s))return false;player=s;s.isPlayer=true;deathSequence=null;actions.push('possess:'+s.id);return true;}
    function possessRandom(){return possessSoldier(pickPlayerSoldier());}
    function leavePlayer(reason){deathSequence=null;player=null;actions.push('leave:'+reason);}
    ${helpers.replace(/    function showDeathSkip\(\) \{[\s\S]*?(?=    function beginDeathSequence)/, '')}
    return {step:dt=>stepDeathSequence(b,dt),skip:skipDeathSequence,
      state:()=>({player, tour:deathSequence,cam,keys,mouseFire,mouseAim})};
  `
  )({ Vector3: V }, b, victim, next, cam, actions);
  return { api, b, victim, enemy, next, cam, actions };
}
let f = fixture();
f.api.step(0);
assert.equal(f.api.state().tour.phase, 'body');
assert.equal(f.victim.isPlayer, false);
assert.equal(f.next.isPlayer, false);
assert.equal(f.api.state().mouseFire, false);
const initial = f.cam.position.clone();
f.api.step(0);
assert.deepEqual(f.cam.position, initial, 'beginning must preserve the current camera position');
for (let i = 0; i < 32; i++) f.api.step(0.1);
assert.equal(f.api.state().tour.phase, 'killer');
assert.equal(f.api.state().tour.subject, f.enemy, 'killer comes from recorded casualty');
for (let i = 0; i < 22; i++) f.api.step(0.1);
assert.equal(f.api.state().tour.phase, 'next');
assert.equal(f.next.isPlayer, false, 'flight cannot reserve or control a living soldier');
for (let i = 0; i < 20; i++) f.api.step(0.1);
assert.equal(f.api.state().player, f.next);
assert.equal(f.next.isPlayer, true);
assert.equal(f.api.state().tour, null);
assert.ok([f.cam.position.x, f.cam.position.y, f.cam.position.z].every(Number.isFinite));
f = fixture();
f.api.step(0.01);
f.api.skip();
assert.equal(f.api.state().player, f.next, 'skip is the original immediate living-soldier handoff');
f = fixture({ killer: false });
f.api.step(3.2);
assert.equal(f.api.state().tour.phase, 'next', 'unknown killer skips only the killer shot');
f.next.dead = true;
const replacement = soldier(4, 'us');
f.b._roster.us.push(replacement);
f.api.step(0.1);
assert.equal(f.api.state().tour.subject, replacement, 'retarget if destination dies during flight');
assert.equal(replacement.isPlayer, false);
f = fixture({ empty: true });
f.api.step(3.2);
f.api.step(2.2);
assert.equal(f.api.state().player, null, 'no surviving faction exits cleanly after the tour');
f = fixture();
f.api.step(3.2);
f.enemy.root.isDisposed = () => true;
f.api.step(0.1);
assert.equal(f.api.state().tour.phase, 'next', 'disposed killer cannot strand the camera');
f = fixture();
f.victim._fbx = { death: 'deathSide', lower: { entries: [{ t: 3, clip: { duration: 4.5 } }] } };
f.api.step(3.2);
assert.equal(f.api.state().tour.phase, 'body', 'wait for the death animation to finish');
f.victim._fbx.lower.entries[0].t = 4.5;
f.api.step(0.1);
assert.equal(f.api.state().tour.phase, 'killer');
f = fixture();
f.b.winner = 'ge';
f.victim._fbx = { death: 'deathSide', lower: { entries: [{ t: 0, clip: { duration: 4.5 } }] } };
f.api.step(3.2);
assert.equal(f.api.state().tour.phase, 'killer', 'a frozen final death clip cannot strand a finished battle');
assert.match(source, /deathSequence && pad && padPressedOnce\(pad, 0\)/, 'controller A skips');
assert.match(source, /deathSequence && \(key === ' ' \|\| key === 'enter'\)/, 'Space and Enter skip');
console.log(
  'PASS death orbit, killer tour, arrival-only possession, skip, missing killer, dead destination, disposal and no survivors'
);
