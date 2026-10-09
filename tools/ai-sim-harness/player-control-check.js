#!/usr/bin/env node
'use strict';
/* Keyboard/Xbox battle-player control contract: isPlayer is the possession authority boundary. It gates the
   whole soldier Micro path, survives squad-plan/indoor routing churn, gives the player a true free-fire
   crosshair ray, and returns the soldier cleanly to AI only when possession ends. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');
function load(r, p) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, p), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}
const cameraSource = fs.readFileSync(path.join(H.REPO, 'battle/camera-controls.js'), 'utf8');
new Function(cameraSource);
/* Menu/Start gesture contract: a short press retains switching; a hold opens settings
   once, without also triggering a short press on release. */
assert.match(cameraSource, /menuHoldGesture\(menuHoldState,[\s\S]*buttonValue\(pad, 9\)/);
assert.match(cameraSource, /if \(menuGesture === 'hold'\)[\s\S]*?togglePlayerMenu\(\)/);
assert.match(cameraSource, /if \(menuGesture === 'tap'\)[\s\S]*?possessRandom\(\)/);
assert.match(cameraSource, /if \(menuOpen\)[\s\S]*?stepPlayerMenuPad\(pad\)/);
assert.match(cameraSource, /if \(key === 'o'[\s\S]*?togglePlayerMenu\(\)/, 'keyboard O also opens settings');
assert.match(cameraSource, /fillMenuSquads\(player && player\.squad, player\)/);
assert.match(cameraSource, /fillMenuSoldiers\(soldier\)/);
assert.match(
  cameraSource,
  /b\.factions\[faction\]\.squads\.indexOf\(sq\)/,
  'selected squad is revalidated against the live faction'
);
assert.match(
  cameraSource,
  /soldier\.dead[\s\S]{0,100}!soldier\.root/,
  'soldier selection rejects casualties'
);
assert.match(cameraSource, /if \(menuOpen\) closePlayerMenu\(\)/, 'player release cleans up the menu');
assert.match(cameraSource, /!b\.paused[\s\S]{0,100}typeof b\.pause/, 'settings pause only an active battle');
assert.match(
  cameraSource,
  /b === liveBattle\(\)[\s\S]{0,170}typeof b\.resume/,
  'settings resume only a pause owned by this menu'
);

const vm = require('node:vm');
const win = { GTMath: { clamp: (value, min, max) => Math.min(max, Math.max(min, value)) } };
vm.runInNewContext(cameraSource, { window: win });
const G = win.BattleDesktopCamera.menuHoldGesture;
assert.equal(win.BattleDesktopCamera.menuHoldMs, 650);
const st = { down: false, since: 0, long: false };
assert.equal(G(st, true, 0), null, 'press starts the timer, not a switch');
assert.equal(G(st, true, 649), null, 'below threshold cannot open settings');
assert.equal(G(st, false, 649), 'tap', 'short release switches');
assert.equal(G(st, false, 650), null, 'releasing twice cannot switch twice');
assert.equal(G(st, true, 1000), null);
assert.equal(G(st, true, 1650), 'hold', 'long press opens settings');
assert.equal(G(st, true, 1800), null, 'held button must not retrigger menu');
assert.equal(G(st, false, 1801), null, 'release after hold cannot also switch soldier');
assert.equal(G(st, true, 2000), null);
assert.equal(G(st, false, 2025), 'tap', 'subsequent taps work after a hold');

assert.match(cameraSource, /buttonValue\(pad,\s*7\)/, 'RT must feed player fire');
assert.match(cameraSource, /buttonValue\(pad,\s*10\)/, 'L3 must feed player run');
assert.match(
  cameraSource,
  /playerYaw\s*\+=\s*lx\s*\*\s*PLAYER_LOOK_RATE\s*\*\s*dt/,
  'RS right must turn the player camera right'
);
assert.doesNotMatch(
  cameraSource,
  /playerYaw-=lx\*PLAYER_LOOK_RATE\*dt/,
  'player horizontal look must not be reversed'
);
assert.doesNotMatch(
  cameraSource,
  /if\(!pad&&padId\)[\s\S]{0,220}if\(!pad\)return;/,
  'free-camera keyboard movement must not return when no gamepad is connected'
);
assert.match(
  cameraSource,
  /var f = \(keys\.has\('w'\) \? 1 : 0\)[\s\S]*?if \(pad\) \{\s*var axes = pad\.axes \|\| \[\]/,
  'keyboard fly input must be evaluated outside the optional gamepad branch'
);
assert.match(
  cameraSource,
  /if \(key === 'p'\)[\s\S]*?possessRandom\(\)/,
  'P must enter or switch keyboard player mode'
);
assert.match(
  cameraSource,
  /playerMovementKey\(key\)[\s\S]*?keys\.add\(key\)/,
  'WASD/Shift must feed keyboard player movement'
);
assert.match(
  cameraSource,
  /mx = \(keys\.has\('d'\)[\s\S]*?my = \(keys\.has\('w'\)/,
  'keyboard player movement must join the same movement vector as the left stick'
);
assert.match(
  cameraSource,
  /playerYaw\s*\+=\s*event\.movementX\s*\*\s*LOOK_X/,
  'mouse movement must turn the possessed player'
);
assert.match(cameraSource, /event\.button === 0\) mouseFire = true/, 'left mouse must feed player fire');
assert.match(cameraSource, /event\.button === 2\) mouseAim = true/, 'right mouse must feed player aim');
assert.match(cameraSource, /key === 'c'[\s\S]*?togglePlayerCrouch/, 'C must toggle crouch/stand');
assert.match(cameraSource, /key === 'z'[\s\S]*?togglePlayerProne/, 'Z must toggle prone/stand');
assert.match(cameraSource, /key === 'v'[\s\S]*?leavePlayer/, 'V must exit player mode');
assert.doesNotMatch(
  cameraSource,
  /leavePlayer\('controller disconnected'\)/,
  'controller disconnect must fall back to keyboard player control instead of ending possession'
);
assert.match(
  cameraSource,
  /heightAt\(cam\.position\.x, cam\.position\.z\)/,
  'player camera must clamp against terrain'
);
const farMatch = cameraSource.match(/CAMERA_FAR = (\d+(?:\.\d+)?)/);
assert.ok(farMatch, 'camera far plane must have one shared constant');
assert.match(
  cameraSource,
  /playerCam\.maxZ = CAMERA_FAR/,
  'player camera must use the shared world far plane so the sky dome is not clipped'
);

/* Camera center, muzzle impact, and confirmed enemy contact are three separate signals. */
const squadSource = fs.readFileSync(path.join(H.REPO, 'battle/squad-ai.js'), 'utf8');
const ballisticsSource = fs.readFileSync(
  path.join(H.REPO, 'battle/modules/14-z-ballistic-raycast.js'),
  'utf8'
);
assert.match(cameraSource, /bpr-line bpr-top/, 'crosshair is built from four slim independent strokes');
assert.match(cameraSource, /bpr-top\{width:1px;height:5px/, 'reticle lines have 1-pixel thickness');
assert.match(cameraSource, /id="battlePlayerHitMarker"/, 'confirmed hits flash on center reticle');
assert.match(cameraSource, /_playerConfirmedHits/, 'hit flash tracks the shooter hit counter');
assert.match(
  squadSource,
  /shot && shot\.victim && shot\.victim\.faction !== soldier\.faction/,
  'only authoritative opposite-faction bullet hits increment marker counter'
);
assert.match(
  squadSource,
  /B\.resolvePlayerRay\(soldier, aimPoint, battle, round, delay\)/,
  'enemy hit signal is read from authoritative discharged rounds'
);
assert.match(cameraSource, /B\.previewPlayerRay\(player, point, b\)/, 'floating dot uses bore preview');
assert.match(cameraSource, /shotImpact = shot\.impact/, 'fired rounds briefly show their actual impact');
assert.match(cameraSource, /BABYLON\.Vector3\.Project\(/, 'muzzle point is screen projected, not centered');
assert.match(cameraSource, /playerBoreDot\.style\.display = 'none'/, 'offscreen markers must hide');
assert.match(
  ballisticsSource,
  /function previewPlayerRay[\s\S]*?environmentStop\([\s\S]*?firstEnemyHit\(/,
  'muzzle preview shares live obstruction and opposing-body collision'
);
assert.match(
  cameraSource,
  /playerYaw \+= lx \* PLAYER_LOOK_RATE \* dt \* \(aiming \? PLAYER_ADS_SENSITIVITY : 1\)/,
  'right-stick horizontal turn slows only while zoom aiming'
);
assert.match(
  cameraSource,
  /playerPitch \+ ly \* 1\.55 \* dt \* \(aiming \? PLAYER_ADS_SENSITIVITY : 1\)/,
  'right-stick vertical turn slows while zoom aiming'
);
assert.match(
  cameraSource,
  /event\.movementX \* LOOK_X \* sensitivity/,
  'mouse horizontal aim adopts zoom sensitivity'
);
assert.match(
  cameraSource,
  /event\.movementY \* LOOK_Y \* sensitivity/,
  'mouse vertical aim adopts zoom sensitivity'
);
assert.match(
  cameraSource,
  /PLAYER_ADS_SENSITIVITY = 0\.18/,
  'aiming uses half of the previous ADS multiplier (18%)'
);

/* The secondary muzzle dot is a hollow, screen-projected ring with frame-time
   bounded easing. It must never teleport on a slow frame or bleed across possession. */
assert.match(
  cameraSource,
  /battlePlayerBoreDot\{[^']*width:4px;height:4px/,
  'bore ring is reduced to a 4 px outer diameter'
);
assert.match(cameraSource, /border:1px solid #e7f1e2;background:transparent/, 'dot has no fill');
assert.match(cameraSource, /smoothBoreDot\(boreScreenPos, target, elapsed\)/, 'screen position is eased');
assert.match(cameraSource, /boreScreenPos = null;/, 'easing resets on exit and reassignment');
const smooth = win.BattleDesktopCamera.smoothBoreDot;
assert.equal(smooth(null, { x: 10, y: 20 }, 16).x, 10, 'first visible ring starts at the target');
const start = { x: 0, y: 0 },
  target = { x: 100, y: -100 };
const one16 = smooth(start, target, 16),
  two16 = smooth(one16, target, 16),
  one32 = smooth(start, target, 32),
  hitch = smooth(start, target, 240),
  capped = smooth(start, target, 50);
assert.ok(one16.x > 0 && one16.x < 100, 'regular frame must ease rather than snap');
assert.ok(one16.y < 0 && one16.y > -100, 'Y axis must ease symmetrically');
assert.ok(Math.abs(two16.x - one32.x) < 1e-9, 'ordinary-frame easing is frame-rate invariant');
assert.ok(Math.abs(hitch.x - capped.x) < 1e-9, 'slow frame time must be capped');
assert.ok(hitch.x > 0 && hitch.x < 50, 'low-FPS hitch must not snap to target');
assert.equal(smooth(start, target, 0).x, 0, 'zero elapsed time cannot move the ring');

/* Player feedback must be wired to shipping soldier/weapon state and be optional on unsupported devices. */
assert.match(cameraSource, /ensurePlayerFeedback\(\)/, 'possession installs player HUD');
assert.match(cameraSource, /player\.maxHp/, 'HUD reads real health');
assert.match(cameraSource, /player\.bleedRate/, 'HUD reads real wound bleeding');
assert.match(
  cameraSource,
  /playerStamina = Math\.max\(0, playerStamina - SPRINT_DRAIN \* dt\)/,
  'running drains the player sprint budget'
);
assert.match(
  cameraSource,
  /playerExhausted && playerStamina >= STAMINA_RESTART/,
  'exhaustion needs recovery before sprinting again'
);
assert.match(
  cameraSource,
  /b\.paused \|\| b\.winner \? false : sprintAllowed/,
  'paused battles must not change stamina'
);
assert.match(
  cameraSource,
  /SquadAI\.playerFireRay\(player, point, b\)\)\s*\{[\s\S]{0,650}playerRumble/,
  'shooting haptic only follows accepted authoritative firing'
);
assert.match(
  cameraSource,
  /wounds > lastWoundCount[\s\S]{0,450}playerRumble/,
  'hit haptic follows new wounds, not continuing bleed loss'
);
assert.match(cameraSource, /player\._lastHitBy/, 'hurt direction uses real shooter position');
assert.match(
  cameraSource,
  /Math\.atan2\(damageOrigin\.x - here\.x, damageOrigin\.z - here\.z\) - playerYaw/,
  'hurt direction rotates with camera heading'
);
assert.match(
  cameraSource,
  /typeof global\.navigator\.vibrate === 'function'/,
  'phone haptics are capability checked'
);
assert.match(
  cameraSource,
  /actuator\.playEffect\('dual-rumble'/,
  'controller rumble is attempted when available'
);

const skySource = fs.readFileSync(path.join(H.REPO, 'battle/battle-sim.js'), 'utf8');
const skyMatch = skySource.match(
  /function buildSky\(scene\)\s*\{\s*var radius\s*=\s*(\d+(?:\.\d+)?),\s*offset\s*=\s*(\d*\.?\d+)/
);
assert.ok(skyMatch, 'battle sky radius/offset contract must remain measurable');
const cameraFar = +farMatch[1],
  skyRadius = +skyMatch[1],
  skyOffset = +skyMatch[2];
const farthestSkySurface = skyRadius * (1 + Math.sin(Math.PI * skyOffset));
assert.ok(
  cameraFar > farthestSkySurface + 100,
  'camera far plane must clear the vertically offset sky dome with margin'
);
assert.match(cameraSource, /SquadAI\.playerFireRay/, 'RT must use free-fire player ray authority');
/* No aim assist: nothing in the camera picks an enemy near the reticle for the possessed man. */
assert.doesNotMatch(
  cameraSource,
  /aimedEnemy|PLAYER_TARGET_DOT|SquadAI\.playerFire\(/,
  'player aim must not lock onto an enemy near the crosshair'
);
assert.match(
  cameraSource,
  /SquadAI\.playerAim\(player, aiming \|\| firing \? weaponAim : null\)/,
  'player visual aim follows the constrained physical muzzle direction'
);
assert.match(
  cameraSource,
  /B\.playerBoreAimPoint\(player, point, b\)/,
  'FBX visual aim must agree with the authoritative bore preview and shot'
);
assert.match(
  cameraSource,
  /BattleEngagement\.playerFace\(player, aiming \|\| firing \? point : null\)/,
  'Engagement receives the raw view bearing to rotate the soldier into alignment'
);
const moveSource = fs.readFileSync(path.join(H.REPO, 'battle/battle-sim.js'), 'utf8');
assert.match(
  moveSource,
  /steered=!recovery&&!playerDirect&&steerAroundObstacles/,
  'possessed movement must not be steered off tactical circles (window posts)'
);
const postureSource = fs.readFileSync(
  path.join(H.REPO, 'battle/modules/52-combat-posture-visual.js'),
  'utf8'
);
assert.match(postureSource, /!s\.isPlayer/, 'the last-known-threat aim posture must not aim a possessed man');
const backendSource = fs.readFileSync(path.join(H.REPO, 'battle/modules/53-fbx-soldier-backend.js'), 'utf8');
assert.match(
  backendSource,
  /playerAt = \(soldier\.isPlayer && soldier\.playerAimPoint\) \|\| null/,
  'the FBX aim layer must follow the player crosshair'
);
const microSource = fs.readFileSync(path.join(H.REPO, 'battle/squad-ai.js'), 'utf8');
const hardpointSource = fs.readFileSync(
  path.join(H.REPO, 'battle/modules/20-building-hardpoints.js'),
  'utf8'
);
assert.match(
  microSource,
  /if \(soldier && soldier\.isPlayer\)/,
  'isPlayer must gate the whole soldier Micro update'
);
assert.match(hardpointSource, /s\.isPlayer/, 'building hardpoints must exclude player-controlled soldiers');
const r = H.bootstrap({ modules: false });
r.BattleModules = { registerSystem() {}, unitsFor: b => (b._roster.us || []).concat(b._roster.ge || []) };
load(r, 'battle/movement-resolver.js');
load(r, 'battle/modules/11-soldier-individuality.js');
load(r, 'battle/modules/14-z-ballistic-raycast.js');
load(r, 'battle/modules/46-ammunition-stoppages.js');

const b = H.makeBattle(r);
b._movementRoot = r;
const us = H.addSquad(r, b, {
  id: 'us-0',
  faction: 'us',
  x: 0,
  z: 0,
  objective: { x: 0, z: 100 },
  composition: ['rifleman', 'rifleman']
});
const ge = H.addSquad(r, b, {
  id: 'ge-0',
  faction: 'ge',
  x: 0,
  z: 25,
  objective: { x: 0, z: -100 },
  facing: Math.PI,
  composition: ['rifleman', 'rifleman']
});
const s = us.members[0],
  ahead = ge.members[0],
  behind = ge.members[1],
  M = r.BattleMovementResolver;
ahead.root.position.x = 0;
ahead.root.position.z = 25;
behind.root.position.x = 0;
behind.root.position.z = -25;
s.root.position.x = 0;
s.root.position.z = 0;
s.root.rotation.y = 0;
s.destination = { x: 0, z: 0 };
s.orderDestination = { x: 0, z: 0 };
s.isPlayer = true;

r.SquadAI.playerAim(s, { x: 0, y: 1.5, z: -80 });
assert.equal(s.target, null, 'player aim is a crosshair point, never a lock on an enemy');
assert.deepEqual(
  s.playerAimPoint,
  { x: 0, y: 1.5, z: -80 },
  'player aim point must be kept for presentation'
);
us.commandPhase = 'hold';
M.proposePlayer(s, { x: 0, z: 18 }, b, 0.6, { speedScale: 1, pace: 'run' });
assert.equal(M.playerActive(s, b), true, 'isPlayer must be the active possession authority');
assert.equal(M.playerIntent(s, b).pace, 'run', 'player run pace must survive resolution');
assert.equal(
  r.BattleSoldierIndividuality.desiredGait(s, b),
  'run',
  'squad hold phase must not force a possessed soldier to walk'
);
r.SquadAI.updateSoldier(s, b);
assert.equal(s.target, null, 'possessed soldier must not acquire an AI target (enemy 25 m ahead in view)');
assert.equal(s._movementResolver.goal.kind, 'player', 'player movement must win resolution');

/* Plan/signature churn plus an expired input lease must not hand the man back to Micro. */
us.commandPhase = 'defend';
b.time += 1;
r.SquadAI.updateSoldier(s, b);
assert.equal(s.target, null, 'expired player lease must not re-enable Perception while isPlayer is true');
assert.equal(
  s._movementResolver.goal.kind,
  'player',
  'resolver must synthesize a player hold instead of falling into AI routing'
);

r.BattleSoldierIndividuality.phenotype(s);
M.proposePlayer(s, { x: 0, z: 18 }, b, 0.6, { speedScale: 1, pace: 'run' });
s.root.position.x = 0;
s.root.position.z = 0;
s.moveSpeed = 0;
s.destination = { x: 0, z: 18 };
s.speed = s.runSpeed;
for (let i = 0; i < 12; i++) H.stepMovement(b, s, 0.15);
const runDistance = s.root.position.z;
M.proposePlayer(s, { x: 0, z: 18 }, b, 0.6, { speedScale: 1, pace: 'walk' });
assert.equal(
  r.BattleSoldierIndividuality.desiredGait(s, b),
  'walk',
  'player walk pace must remain walk even while squad state changes'
);
s.root.position.x = 0;
s.root.position.z = 0;
s.moveSpeed = 0;
s.destination = { x: 0, z: 18 };
s.speed = s.walkSpeed;
for (let i = 0; i < 12; i++) H.stepMovement(b, s, 0.15);
const walkDistance = s.root.position.z;
assert.ok(runDistance > walkDistance + 1, 'player run pace must produce materially more travel than walking');

/* Indoors: the navigation planner would route a point past a wall out through the door. The player's input
   goes straight; a man under AI orders still follows the planner (the control). */
const door = { x: 20, z: 0 },
  navStub = {
    movementClear: () => true,
    nextWaypoint: () => door,
    invalidateNavPath() {},
    invalidateNavCache() {}
  };
r.BattleNavigation = navStub;
M.proposePlayer(s, { x: 0, z: 6 }, b, 0.6, { speedScale: 1, pace: 'walk' });
r.SquadAI.updateSoldier(s, b);
assert.deepEqual(
  s.destination,
  { x: 0, z: 6 },
  'player destination must be his input point, not a legalized or routed one'
);
s.root.position.x = 0;
s.root.position.z = 0;
s.moveSpeed = 0;
for (let i = 0; i < 8; i++) H.stepMovement(b, s, 0.15);
assert.ok(
  Math.abs(s.root.position.x) < 1e-6 && s.root.position.z > 0.5,
  "possessed soldier must go where he is steered, not toward the planner's exit"
);
const ai = us.members[1];
ai.root.position.x = 0;
ai.root.position.z = 0;
ai.moveSpeed = 0;
ai.destination = { x: 0, z: 6 };
ai._movementResolver = { goal: { kind: 'formation' } };
for (let i = 0; i < 8; i++) H.stepMovement(b, ai, 0.15);
assert.ok(ai.root.position.x > 0.5, 'control: an AI soldier still follows the navigation planner');
delete r.BattleNavigation;
s.root.position.x = 0;
s.root.position.z = 0;
us.fireControl = { state: 'hold' };
r.SquadAI.playerAim(s, { x: 0, y: 1.5, z: 25 });
s.target = ahead;
s.fireCooldown = 0;
s.moving = false;
s.moveSpeed = 0;
assert.equal(
  r.BattleEngagement.fireAuthorized(s, b),
  false,
  'squad HOLD FIRE must still gate AI engagement fire'
);
r.BattleAmmunition.initialize(s, b);
r.SquadAI.clearTarget(s);
s.fireCooldown = 0;
const ammoBefore = s.weapon.ammo,
  firedBefore = b.events.fired;
assert.equal(
  r.SquadAI.playerFireRay(s, { x: 80, y: 1, z: 0 }, b),
  true,
  'RT must fire without any AI target lock'
);
assert.equal(s.weapon.ammo, ammoBefore - 1, 'free-fire must spend shipping ammunition');
assert.ok(b.events.fired > firedBefore, 'free-fire must emit the normal onFire presentation event');

/* A player-ray survivor hit is a real incoming shot, not an all-faction reveal.
   Stub only the authoritative ballistic hit result; playerFireRay still owns
   ammunition and disclosure, and must never conjure a target on a miss. */
const actualRay = r.BattleBallistics.resolvePlayerRay;
ge.contact = null;
ahead.dead = false;
r.BattleBallistics.resolvePlayerRay = () => ({ victim: ahead });
s.fireCooldown = 0;
assert.equal(r.SquadAI.playerFireRay(s, { x: 0, y: 1.5, z: 25 }, b), true);
assert.ok(
  ge.contact && ge.contact.fireRevealed,
  'surviving enemy victim squad learns actual player-ray origin'
);
assert.equal(ge.contact.precision, 'fire-origin');
assert.equal(ge.contact.x, s.root.position.x);
assert.equal(ge.contact.z, s.root.position.z);
const recordedRayOrigin = { x: ge.contact.x, z: ge.contact.z };
s.root.position.x += 7;
assert.deepEqual(
  { x: ge.contact.x, z: ge.contact.z },
  recordedRayOrigin,
  'the enemy remembers the shot-time origin, not the live shooter location'
);
s.root.position.x -= 7;
ge.contact = null;
r.BattleBallistics.resolvePlayerRay = () => ({ victim: null, stoppedBy: 'terrain' });
s.fireCooldown = 0;
assert.equal(r.SquadAI.playerFireRay(s, { x: 80, y: 1, z: 0 }, b), true);
assert.equal(ge.contact, null, 'player-ray miss creates no precise targeted shot report');
r.BattleBallistics.resolvePlayerRay = actualRay;
s.fireCooldown = 0;

/* The trigger obeys the simulation lifecycle: a paused or finished battle takes no player shots. */
for (const [label, set, clear] of [
  ['paused', () => (b.paused = true), () => (b.paused = false)],
  ['ended', () => (b.winner = 'us'), () => (b.winner = null)]
]) {
  s.fireCooldown = 0;
  const ammoHeld = s.weapon.ammo;
  set();
  assert.equal(
    r.SquadAI.playerFireRay(s, { x: 80, y: 1, z: 0 }, b),
    false,
    label + ' battle: RT must not fire'
  );
  assert.equal(s.weapon.ammo, ammoHeld, label + ' battle: no ammunition spent');
  clear();
}
s.fireCooldown = 0;

r.BattleEngagement.commitStance(s, b, 'crouch', 0.45, 'player');
assert.equal(s.tacticalCrouch, true);
assert.equal(s.prone, false);
r.BattleEngagement.commitStance(s, b, 'prone', 0.45, 'player');
assert.equal(s.prone, true);
assert.equal(s.tacticalCrouch, false);
r.BattleEngagement.commitStance(s, b, 'stand', 0.45, 'player');
assert.equal(s.prone, false);
assert.equal(s.tacticalCrouch, false);

s.isPlayer = false;
M.clearPlayer(s);
r.SquadAI.playerAim(s, null);
assert.equal(s.playerAimPoint, null, 'release must drop the player aim point');
us.commandPhase = 'assault';
r.SquadAI.updateSoldier(s, b);
assert.strictEqual(
  s.target,
  ahead,
  'after isPlayer clears, normal Perception must resume and reacquire the enemy in front'
);

b.time += 1;
assert.equal(M.playerActive(s, b), false, 'cleared isPlayer must return authority to AI');
console.log(
  'PASS: isPlayer gates Micro/indoor routing, no aim assist, input goes straight indoors, RT free-fires through shipping ballistics, and release returns AI control'
);
