#!/usr/bin/env node
'use strict';
/* Xbox battle-player control contract: a short player lease outranks normal AI movement, suspends
   Perception/Engagement for only that soldier, preserves SquadAI as target owner, gives the player
   independent trigger authority, and keeps player pace independent of squad fire/movement orders. */
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),H=require('./harness');
function load(r,p){new Function('window','globalThis','console',fs.readFileSync(path.join(H.REPO,p),'utf8'))(r,r,{log(){},warn(){}});}
const cameraSource=fs.readFileSync(path.join(H.REPO,'battle/camera-controls.js'),'utf8');
new Function(cameraSource);
assert.match(cameraSource,/padPressedOnce\(pad,9\)/,'Menu\/Start must enter or switch player mode');
assert.match(cameraSource,/buttonValue\(pad,7\)/,'RT must feed player fire');
assert.match(cameraSource,/buttonValue\(pad,10\)/,'L3 must feed player run');
assert.match(cameraSource,/playerYaw\+=lx\*PLAYER_LOOK_RATE\*dt/,'RS right must turn the player camera right');
assert.doesNotMatch(cameraSource,/playerYaw-=lx\*PLAYER_LOOK_RATE\*dt/,'player horizontal look must not be reversed');
assert.match(cameraSource,/heightAt\(cam\.position\.x,cam\.position\.z\)/,'player camera must clamp against terrain');
assert.match(cameraSource,/SquadAI\.playerFire/,'RT must use player trigger authority');
const r=H.bootstrap({modules:false});
r.BattleModules={registerSystem(){},unitsFor:b=>(b._roster.us||[]).concat(b._roster.ge||[])};
load(r,'battle/movement-resolver.js');
load(r,'battle/modules/11-soldier-individuality.js');

const b=H.makeBattle(r);b._movementRoot=r;
const us=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:100},composition:['rifleman','rifleman']});
const ge=H.addSquad(r,b,{id:'ge-0',faction:'ge',x:0,z:25,objective:{x:0,z:-100},facing:Math.PI,composition:['rifleman','rifleman']});
const s=us.members[0],ahead=ge.members[0],behind=ge.members[1],M=r.BattleMovementResolver;
ahead.root.position.x=0;ahead.root.position.z=25;
behind.root.position.x=0;behind.root.position.z=-25;
s.root.position.x=0;s.root.position.z=0;s.root.rotation.y=0;s.destination={x:0,z:0};s.orderDestination={x:0,z:0};

r.SquadAI.playerAim(s,behind);
assert.strictEqual(s.target,behind,'playerAim must keep target ownership inside SquadAI');
us.commandPhase='hold';
M.proposePlayer(s,{x:0,z:18},b,.6,{speedScale:1,pace:'run'});
assert.equal(M.playerActive(s,b),true,'fresh player lease must be active');
assert.equal(M.playerIntent(s,b).pace,'run','player run pace must survive resolution');
assert.equal(r.BattleSoldierIndividuality.desiredGait(s,b),'run','squad hold phase must not force a possessed soldier to walk');
r.SquadAI.updateSoldier(s,b);
assert.strictEqual(s.target,behind,'possessed soldier must not let Perception overwrite the player target');
assert.equal(s._movementResolver.goal.kind,'player','player movement must win resolution');

r.BattleSoldierIndividuality.phenotype(s);
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
assert.equal(r.SquadAI.playerFire(s,b),true,'player trigger must bypass squad HOLD FIRE while retaining core weapon gates');

r.BattleEngagement.commitStance(s,b,'crouch',.45,'player');
assert.equal(s.tacticalCrouch,true);assert.equal(s.prone,false);
r.BattleEngagement.commitStance(s,b,'prone',.45,'player');
assert.equal(s.prone,true);assert.equal(s.tacticalCrouch,false);
r.BattleEngagement.commitStance(s,b,'stand',.45,'player');
assert.equal(s.prone,false);assert.equal(s.tacticalCrouch,false);

M.clearPlayer(s);r.SquadAI.clearTarget(s);r.SquadAI.updateSoldier(s,b);
assert.strictEqual(s.target,ahead,'after release, normal Perception must resume and reacquire the enemy in front');

b.time+=1;
assert.equal(M.playerActive(s,b),false,'released/expired player lease must not remain active');
console.log('PASS: player owns look/pace/trigger/stance, camera stays above terrain, and release cleanly returns him to AI');
