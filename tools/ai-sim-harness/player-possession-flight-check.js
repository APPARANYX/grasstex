#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../battle/camera-controls.js'), 'utf8');
const pose = source.slice(
  source.indexOf('    function positionPlayerCamera('),
  source.indexOf('    function aimPoint(')
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
  set(x, y, z) {
    Object.assign(this, { x, y, z });
  }
  copyFrom(v) {
    Object.assign(this, v);
  }
  static Lerp(a, b, t) {
    return a.scale(1 - t).add(b.scale(t));
  }
}
const man = { root: { position: new V(0, 0, 0) } };
const cam = {
  position: new V(),
  fov: 0.58,
  setTarget(v) {
    this.target = v;
  }
};
const from = new V(-100, 12, -5.6);
const flight = { from, lookFrom: new V(-100, 12, 44.4), fovFrom: 0.58, elapsed: 0, duration: 2, lift: 8 };
const api = new Function(
  'BABYLON',
  'player',
  'cam',
  'flight',
  `
 var playerYaw=0, playerPitch=0, possessionFlight=flight,
   PLAYER_DISTANCE=5.6,PLAYER_AIM_DISTANCE=3,PLAYER_CAMERA_CLEARANCE=0.45,
   battleSim={heightAt:()=>0}, delta=0,engine={getDeltaTime:()=>delta};
 function clamp(x,a,b){return Math.max(a,Math.min(x,b));}
 function cameraDirection(){return new BABYLON.Vector3(0,0,1);}
 function ensurePlayerCamera(){return cam;}
 ${pose}
 return {step:ms=>{delta=ms;positionPlayerCamera(false);return cam.position.clone();},
   active:()=>!!possessionFlight};
`
)({ Vector3: V }, man, cam, flight);
assert.deepEqual(api.step(0), from, 'flight starts exactly at the currently rendered camera');
let previous = api.step(1),
  startSpeed = Math.abs(previous.x - from.x);
api.step(998);
const mid = api.step(1);
const afterMid = api.step(1),
  peakSpeed = Math.abs(afterMid.x - mid.x);
api.step(998);
const beforeEnd = cam.position.clone(),
  end = api.step(1),
  endSpeed = Math.abs(end.x - beforeEnd.x);
assert.ok(startSpeed < peakSpeed / 100, 'flight accelerates gently from rest');
assert.ok(endSpeed < peakSpeed / 100, 'flight decelerates gently into possession');
assert.ok(
  Math.hypot(end.x - 0.72, end.y - 1.62, end.z + 5.6) < 1e-10,
  'arrival matches the normal shoulder pose'
);
assert.deepEqual(cam.target, new V(0.72, 1.62, 44.4));
assert.equal(cam.fov, 0.78);
api.step(1); // Cross a possible sub-ulp remainder in the accumulated clock.
assert.equal(api.active(), false, 'arrival releases the camera transition');
man.root.position.x = 2;
const following = api.step(16);
assert.ok(
  Math.hypot(following.x - 2.72, following.y - 1.62, following.z + 5.6) < 1e-10,
  'normal live following resumes after arrival'
);
assert.match(
  source,
  /if \(possessionFlight\) \{\s*positionPlayerCamera\(false\);\s*return;/,
  'player fire/movement must wait for the camera arrival'
);
const enter = source.slice(
  source.indexOf('    function possessSoldier('),
  source.indexOf('    function setPlayerStance(')
);
assert.match(
  enter,
  /sourceCam = scene.activeCamera \|\| camera/,
  'manual transfers capture the currently visible camera'
);
assert.match(enter, /if \(distance > 0.05\)/, 'death-tour arrival must not replay another flight');
console.log(
  'PASS possession flight continuity, smooth acceleration/deceleration, exact arrival pose, live following and control guards'
);
