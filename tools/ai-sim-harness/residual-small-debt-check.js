#!/usr/bin/env node
'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const H=require('./harness');
const W=require('./wire-map');

let n=0;
function test(name,fn){fn();n++;console.log('PASS '+name);}
function load(root,p){
  new Function('window','globalThis','console',fs.readFileSync(path.join(H.REPO,p),'utf8'))(
    root,root,{log(){},warn(){}}
  );
}

test('fireCooldown has one direct runtime writer and the owner API preserves clock semantics',()=>{
  const map=W.collect(H.REPO);
  assert.deepEqual(map.soldier.fireCooldown,['squad-ai.js']);

  const r=H.bootstrap({modules:false}),s={fireCooldown:.4};
  assert.equal(r.SquadAI.setFireCooldown(s,-2),0);
  assert.equal(s.fireCooldown,0);
  assert.equal(r.SquadAI.extendFireCooldown(s,.7),.7);
  assert.equal(r.SquadAI.extendFireCooldown(s,.2),.7,'extend never shortens an interruption');
  assert.equal(r.SquadAI.tickFireCooldown(s,.25),.45);
  assert.equal(r.SquadAI.tickFireCooldown(s,9),0);
});

test('combat posture visual passes a static presentation aim point without touching soldier.target',()=>{
  let call=null;
  const r={
    BattleSoldierModel:{
      animateWalk(...args){call=args;return 'posed';}
    },
    BattleEngagement:{
      stateOf(s){return s.eng;}
    }
  };
  load(r,'battle/modules/52-combat-posture-visual.js');

  const s={
    dead:false,isPlayer:false,target:null,reloading:false,clearingStoppage:false,
    eng:{state:'alert',lastSeen:{x:12,z:-8}},
    root:{position:{x:1,y:2.25,z:3}}
  };
  const before=s.target;
  const out=r.BattleSoldierModel.animateWalk(s,.016,0,{marker:'kept'});
  assert.equal(out,'posed');
  assert.equal(s.target,before,'presentation never borrows the gameplay target field');
  assert.equal(call[0],s);
  assert.deepEqual(call[3],{marker:'kept',aimPoint:{x:12,y:2.25,z:-8}});

  const real={root:{position:{x:4,y:0,z:5}}};
  s.target=real;call=null;
  r.BattleSoldierModel.animateWalk(s,.016,0);
  assert.equal(s.target,real,'a real gameplay target is untouched');
  assert.equal(call[3],undefined,'a real target needs no visual-memory input');

  s.target=null;s.isPlayer=true;call=null;
  r.BattleSoldierModel.animateWalk(s,.016,0);
  assert.equal(call[3],undefined,'possessed soldiers are never aimed from AI last-seen memory');
});

test('presentation aim survives the gait wrapper and reaches both animation backends explicitly',()=>{
  const individual=fs.readFileSync(path.join(H.REPO,'battle/modules/11-soldier-individuality.js'),'utf8');
  const soldier=fs.readFileSync(path.join(H.REPO,'battle/soldier.js'),'utf8');
  const fbx=fs.readFileSync(path.join(H.REPO,'battle/modules/53-fbx-soldier-backend.js'),'utf8');
  const posture=fs.readFileSync(path.join(H.REPO,'battle/modules/52-combat-posture-visual.js'),'utf8');

  assert.match(individual,/oldAnimate\.call\(this,s,dt,speedFrac,arguments\[3\]\)/);
  assert.match(soldier,/function animateWalk\(soldier,dt,speedFrac,presentation\)/);
  assert.match(soldier,/aimPoint:aimPoint/);
  assert.match(fbx,/visualAt=state&&state\.aimPoint\|\|null/);
  assert.match(fbx,/if\(!t&&visualAt\)t=visualAt/);
  assert.doesNotMatch(posture,/s\.target\s*=/,'presentation module must not write target');
});

test('wire-map target debt shrank: posture visual is no longer a soldier.target writer',()=>{
  const map=W.collect(H.REPO);
  assert.ok(map.soldier.target.includes('squad-ai.js'));
  assert.ok(map.soldier.target.includes('battle-sim.js'));
  assert.ok(!map.soldier.target.includes('modules/52-combat-posture-visual.js'));
});

console.log(n+' residual small-debt cleanup checks passed');
