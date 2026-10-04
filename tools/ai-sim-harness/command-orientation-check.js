#!/usr/bin/env node
'use strict';
/* Phase 0D1: reference-sensitive command orientation.

   Simple non-spatial orders do not pay an orient step. Directional, point and object-referenced
   orders do, with deterministic bounded costs. This is receipt/adoption timing only: Command
   Reception still does not turn bodies or own stance/movement. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const H=require('./harness');
const log=console.log;console.log=(...a)=>(typeof a[0]==='string'&&a[0][0]==='['?undefined:log(...a));
let n=0;function test(name,fn){fn();n++;console.log('PASS '+name);}

function world(search){
  H.resetIds();
  const r=H.bootstrap({search:search||'?commandReception=1&stressAct=0'});
  const b=H.makeBattle(r,{seed:71});
  const us=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:120},facing:0});
  const ge=H.addSquad(r,b,{id:'ge-0',faction:'ge',x:0,z:180,objective:{x:0,z:0},facing:Math.PI});
  us.state='advance';us.commandPhase='approach';us.orderAnchor={x:0,z:0};us.rally={x:0,z:0};us.objective={x:0,z:120};
  return{r,b,us,ge,C:r.BattleCommandReception,Q:r.BattleSquadStability};
}
function one(reference,meta){
  const w=world(),s=w.us.members[4];
  w.b.time=10;
  w.C.publish(w.us,w.b,'test',[s],Object.assign({
    scope:'one',action:'test-'+reference,signature:'stable',reference:reference
  },meta||{}));
  return w.C.snapshot(s,w.b).records['test|one'];
}

test('simple, direction, point and object references have distinct deterministic orient/locate costs',()=>{
  const none=one('none'),direction=one('direction'),point=one('point',{point:{x:12,z:20}}),object=one('object');
  assert.equal(none.orientationSeconds,0);
  assert.equal(none.needsOrientation,false);
  assert.equal(none.adoptedAt,none.processedAt,'simple order adopts as soon as it is processed');

  assert.equal(direction.needsOrientation,true);
  assert.equal(point.needsOrientation,true);
  assert.equal(object.needsOrientation,true);
  assert.ok(direction.orientationSeconds>0);
  assert.ok(direction.orientationSeconds<point.orientationSeconds,
    direction.orientationSeconds+' < '+point.orientationSeconds);
  assert.ok(point.orientationSeconds<object.orientationSeconds,
    point.orientationSeconds+' < '+object.orientationSeconds);
});

test('the same reference and soldier produces the same timing without combat RNG',()=>{
  function run(){
    const w=world(),s=w.us.members[5];let draws=0,real=w.b.random;
    w.b.random=function(){draws++;return real.call(this);};
    w.b.time=3;
    w.C.publish(w.us,w.b,'test',[s],{
      scope:'dir',action:'shift-left',signature:'left',reference:'direction'
    });
    return{draws,rec:w.C.snapshot(s,w.b).records['test|dir']};
  }
  const a=run(),b=run();
  assert.equal(a.draws,0);
  assert.deepEqual(a,b);
});

test('referenced orders expose an orienting phase only between processing and adoption',()=>{
  const w=world(),s=w.us.members[6];
  w.b.time=8;
  w.C.publish(w.us,w.b,'test',[s],{
    scope:'building',action:'get-in-that-building',signature:'house-a',reference:'object'
  });
  let r=w.C.snapshot(s,w.b).records['test|building'];
  assert.ok(r.adoptedAt>r.processedAt);
  w.b.time=r.processedAt+Math.min(.01,(r.adoptedAt-r.processedAt)/2);
  r=w.C.snapshot(s,w.b).records['test|building'];
  assert.equal(r.phase,'orienting');
  w.b.time=r.adoptedAt+.001;
  assert.equal(w.C.snapshot(s,w.b).records['test|building'].phase,'adopted');
});

test('legacy spatial metadata still means a point reference for compatibility',()=>{
  const w=world(),s=w.us.members[4];
  w.C.publish(w.us,w.b,'test',[s],{
    scope:'legacy',action:'move',signature:'legacy',spatial:true,point:{x:4,z:9}
  });
  const r=w.C.snapshot(s,w.b).records['test|legacy'];
  assert.equal(r.reference,'point');
  assert.equal(r.needsOrientation,true);
});

test('shipping Meso publishers classify posture as simple and movement as a point reference',()=>{
  const w=world(),man=w.us.members[4];
  w.Q.updateFireteams(w.us,w.b);
  const moveKeys=Object.keys(w.C.snapshot(man,w.b).records).filter(k=>k.startsWith('movement|'));
  assert.ok(moveKeys.length>0);
  assert.ok(moveKeys.some(k=>w.C.snapshot(man,w.b).records[k].reference==='point'));

  const foe=w.ge.members[0];
  w.us.contact={unit:foe,x:foe.root.position.x,z:foe.root.position.z,at:w.b.time,seenBy:w.us.members[0].id,stance:'stand'};
  w.Q.updateFireControl(w.us,w.b,{underFire:0});
  const posture=w.C.snapshot(man,w.b).records['posture-fire|squad'];
  assert.ok(posture);
  assert.equal(posture.reference,'none');
  assert.equal(posture.orientationSeconds,0);
});

test('Command Reception still owns timing only, not physical orientation or command execution',()=>{
  const src=fs.readFileSync(path.join(H.REPO,'battle/modules/18-command-reception.js'),'utf8');
  assert.doesNotMatch(src,/\.rotation\s*=/);
  assert.doesNotMatch(src,/\.(?:destination|orderDestination|_fireteamDestination|target|prone|crawling|tacticalCrouch)\s*=/);
  assert.doesNotMatch(src,/\b(?:Math\.random|battle\.random)\s*\(/);
});

console.log(n+' command-orientation checks passed');
