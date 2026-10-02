#!/usr/bin/env node
'use strict';
/* Xbox battle-player control contract: a short player lease outranks normal AI movement, suspends
   Perception/Engagement for only that soldier, preserves SquadAI as target owner, and carries the
   requested run multiplier into the shipping movement integrator. */
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),H=require('./harness');
function load(r,p){new Function('window','globalThis','console',fs.readFileSync(path.join(H.REPO,p),'utf8'))(r,r,{log(){},warn(){}});}
const cameraSource=fs.readFileSync(path.join(H.REPO,'battle/camera-controls.js'),'utf8');
new Function(cameraSource);
assert.match(cameraSource,/padPressedOnce\(pad,9\)/,'Menu\/Start must enter or switch player mode');
assert.match(cameraSource,/buttonValue\(pad,7\)/,'RT must feed player fire');
assert.match(cameraSource,/buttonValue\(pad,10\)/,'L3 must feed player run');
const r=H.bootstrap({modules:false});
r.BattleModules={registerSystem(){},unitsFor:b=>(b._roster.us||[]).concat(b._roster.ge||[])};
load(r,'battle/movement-resolver.js');

const b=H.makeBattle(r);b._movementRoot=r;
const us=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:100},composition:['rifleman','rifleman']});
const ge=H.addSquad(r,b,{id:'ge-0',faction:'ge',x:0,z:25,objective:{x:0,z:-100},facing:Math.PI,composition:['rifleman','rifleman']});
const s=us.members[0],ahead=ge.members[0],behind=ge.members[1],M=r.BattleMovementResolver;
ahead.root.position.x=0;ahead.root.position.z=25;
behind.root.position.x=0;behind.root.position.z=-25;
s.root.position.x=0;s.root.position.z=0;s.root.rotation.y=0;s.destination={x:0,z:0};s.orderDestination={x:0,z:0};

r.SquadAI.playerAim(s,behind);
assert.strictEqual(s.target,behind,'playerAim must keep target ownership inside SquadAI');
M.proposePlayer(s,{x:0,z:18},b,.6,{speedScale:1.65});
assert.equal(M.playerActive(s,b),true,'fresh player lease must be active');
r.SquadAI.updateSoldier(s,b);
assert.strictEqual(s.target,behind,'possessed soldier must not let Perception overwrite the player target');
assert.equal(s._movementResolver.goal.kind,'player','player movement must win resolution');
assert.equal(s._movementResolver.goal.speedScale,1.65,'run multiplier must survive resolution');

s.root.position.x=0;s.root.position.z=0;s.moveSpeed=0;s.destination={x:0,z:18};
for(let i=0;i<12;i++)H.stepMovement(b,s,.15);
const runDistance=s.root.position.z;
s.root.position.x=0;s.root.position.z=0;s.moveSpeed=0;s.destination={x:0,z:18};s._movementResolver.goal.speedScale=1;
for(let i=0;i<12;i++)H.stepMovement(b,s,.15);
const walkDistance=s.root.position.z;
assert.ok(runDistance>walkDistance+1,'player run scale must produce materially more travel than walking');

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
console.log('PASS: player lease owns one soldier, supports run/stance, and cleanly returns him to AI');
