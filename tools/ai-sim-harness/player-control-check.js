#!/usr/bin/env node
'use strict';
/* Xbox battle-player control contract: isPlayer is the possession authority boundary. It gates the
   whole soldier Micro path, survives squad-plan/indoor routing churn, gives the player a true free-fire
   crosshair ray, and returns the soldier cleanly to AI only when possession ends. */
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),H=require('./harness');
function load(r,p){new Function('window','globalThis','console',fs.readFileSync(path.join(H.REPO,p),'utf8'))(r,r,{log(){},warn(){}});}
const cameraSource=fs.readFileSync(path.join(H.REPO,'battle/camera-controls.js'),'utf8');
new Function(cameraSource);
assert.match(cameraSource,/padPressedOnce\(pad,9\)/,'Menu\/Start must enter or switch player mode');
assert.match(cameraSource,/buttonValue\(pad,7\)/,'RT must feed player fire');
assert.match(cameraSource,/buttonValue\(pad,10\)/,'L3 must feed player run');
assert.match(cameraSource,/playerYaw\+=lx\*PLAYER_LOOK_RATE\*dt/,'RS right must turn the player camera right');
assert.doesNotMatch(cameraSource,/playerYaw-=lx\*PLAYER_LOOK_RATE\*dt/,'player horizontal look must not be reversed');
assert.doesNotMatch(cameraSource,/if\(!pad\)return;/,'free-camera keyboard movement must not require a connected gamepad');
assert.match(cameraSource,/var f=\(keys\.has\('w'\)\?1:0\)[\s\S]*?if\(pad\)\{\s*var axes=pad\.axes/,'keyboard fly input must be evaluated outside the optional gamepad branch');
assert.match(cameraSource,/heightAt\(cam\.position\.x,cam\.position\.z\)/,'player camera must clamp against terrain');
assert.match(cameraSource,/SquadAI\.playerFireRay/,'RT must use free-fire player ray authority');
const microSource=fs.readFileSync(path.join(H.REPO,'battle/squad-ai.js'),'utf8');
const hardpointSource=fs.readFileSync(path.join(H.REPO,'battle/modules/20-building-hardpoints.js'),'utf8');
assert.match(microSource,/if \(soldier && soldier\.isPlayer\)/,'isPlayer must gate the whole soldier Micro update');
assert.match(hardpointSource,/s\.isPlayer/,'building hardpoints must exclude player-controlled soldiers');
const r=H.bootstrap({modules:false});
r.BattleModules={registerSystem(){},unitsFor:b=>(b._roster.us||[]).concat(b._roster.ge||[])};
load(r,'battle/movement-resolver.js');
load(r,'battle/modules/11-soldier-individuality.js');
load(r,'battle/modules/14-z-ballistic-raycast.js');
load(r,'battle/modules/46-ammunition-stoppages.js');

const b=H.makeBattle(r);b._movementRoot=r;
const us=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:100},composition:['rifleman','rifleman']});
const ge=H.addSquad(r,b,{id:'ge-0',faction:'ge',x:0,z:25,objective:{x:0,z:-100},facing:Math.PI,composition:['rifleman','rifleman']});
const s=us.members[0],ahead=ge.members[0],behind=ge.members[1],M=r.BattleMovementResolver;
ahead.root.position.x=0;ahead.root.position.z=25;
behind.root.position.x=0;behind.root.position.z=-25;
s.root.position.x=0;s.root.position.z=0;s.root.rotation.y=0;s.destination={x:0,z:0};s.orderDestination={x:0,z:0};
s.isPlayer=true;

r.SquadAI.playerAim(s,behind);
assert.strictEqual(s.target,behind,'playerAim must keep target ownership inside SquadAI');
us.commandPhase='hold';
M.proposePlayer(s,{x:0,z:18},b,.6,{speedScale:1,pace:'run'});
assert.equal(M.playerActive(s,b),true,'isPlayer must be the active possession authority');
assert.equal(M.playerIntent(s,b).pace,'run','player run pace must survive resolution');
assert.equal(r.BattleSoldierIndividuality.desiredGait(s,b),'run','squad hold phase must not force a possessed soldier to walk');
r.SquadAI.updateSoldier(s,b);
assert.strictEqual(s.target,behind,'possessed soldier must not let Perception overwrite the player target');
assert.equal(s._movementResolver.goal.kind,'player','player movement must win resolution');

/* Plan/signature churn plus an expired input lease must not hand the man back to Micro. */
us.commandPhase='defend';b.time+=1;s.target=behind;
r.SquadAI.updateSoldier(s,b);
assert.strictEqual(s.target,behind,'expired player lease must not re-enable Perception while isPlayer is true');
assert.equal(s._movementResolver.goal.kind,'player','resolver must synthesize a player hold instead of falling into AI routing');

r.BattleSoldierIndividuality.phenotype(s);
M.proposePlayer(s,{x:0,z:18},b,.6,{speedScale:1,pace:'run'});
s.root.position.x=0;s.root.position.z=0;s.moveSpeed=0;s.destination={x:0,z:18};s.speed=s.runSpeed;
for(let i=0;i<12;i++)H.stepMovement(b,s,.15);
const runDistance=s.root.position.z;
M.proposePlayer(s,{x:0,z:18},b,.6,{speedScale:1,pace:'walk'});
assert.equal(r.BattleSoldierIndividuality.desiredGait(s,b),'walk','player walk pace must remain walk even while squad state changes');
s.root.position.x=0;s.root.position.z=0;s.moveSpeed=0;s.destination={x:0,z:18};s.speed=s.walkSpeed;
for(let i=0;i<12;i++)H.stepMovement(b,s,.15);
const walkDistance=s.root.position.z;
assert.ok(runDistance>walkDistance+1,'player run pace must produce materially more travel than walking');

us.fireControl={state:'hold'};
r.SquadAI.playerAim(s,ahead);s.fireCooldown=0;s.moving=false;s.moveSpeed=0;
assert.equal(r.BattleEngagement.fireAuthorized(s,b),false,'squad HOLD FIRE must still gate AI engagement fire');
r.BattleAmmunition.initialize(s,b);
r.SquadAI.clearTarget(s);s.fireCooldown=0;
const ammoBefore=s.weapon.ammo,firedBefore=b.events.fired;
assert.equal(r.SquadAI.playerFireRay(s,{x:80,y:1,z:0},b),true,'RT must fire without any AI target lock');
assert.equal(s.weapon.ammo,ammoBefore-1,'free-fire must spend shipping ammunition');
assert.ok(b.events.fired>firedBefore,'free-fire must emit the normal onFire presentation event');

r.BattleEngagement.commitStance(s,b,'crouch',.45,'player');
assert.equal(s.tacticalCrouch,true);assert.equal(s.prone,false);
r.BattleEngagement.commitStance(s,b,'prone',.45,'player');
assert.equal(s.prone,true);assert.equal(s.tacticalCrouch,false);
r.BattleEngagement.commitStance(s,b,'stand',.45,'player');
assert.equal(s.prone,false);assert.equal(s.tacticalCrouch,false);

s.isPlayer=false;M.clearPlayer(s);r.SquadAI.clearTarget(s);us.commandPhase='assault';r.SquadAI.updateSoldier(s,b);
assert.strictEqual(s.target,ahead,'after isPlayer clears, normal Perception must resume and reacquire the enemy in front');

b.time+=1;
assert.equal(M.playerActive(s,b),false,'cleared isPlayer must return authority to AI');
console.log('PASS: isPlayer gates Micro/indoor routing, RT free-fires through shipping ballistics, and release returns AI control');
