#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),H=require('./harness');
function load(root,rel){
  const code=fs.readFileSync(path.join(H.REPO,rel),'utf8');
  new Function('window','globalThis','console','BABYLON',code+'\n//# sourceURL='+rel)(root,root,{log(){},warn(){}},root.BABYLON);
}
function root(){const r=H.bootstrap({modules:false});load(r,'battle/modules/14-z-ballistic-raycast.js');return r;}
function man(x,z,faction){
  return{faction:faction||'us',hp:100,root:{position:{x:x,y:0,z:z},rotation:{y:0}},weapon:null};
}
function weapon(kind){
  return{kind:kind||'rifle',stats:{range:120,falloffStart:120,combatSigmaAt100:.000001,damage:10,power:1}};
}
function approx(a,b,eps,msg){assert.ok(Math.abs(a-b)<=eps,(msg||'values differ')+': '+a+' vs '+b);}

{
  const r=root(),B=r.BattleBallistics,b=H.makeBattle(r,{seed:4}),s=man(0,0,'us'),t=man(0,30,'ge');
  s.weapon=weapon('rifle');b._roster.ge.push(t);b.factions.ge.alive=1;
  let o=B.muzzleOrigin(s,t,b);
  approx(o.y,1.42,1e-9,'standing bore height');approx(o.z,.78,1e-9,'rifle bore starts ahead of the body root');
  s.crouching=true;o=B.muzzleOrigin(s,t,b);approx(o.y,.93,1e-9,'crouched bore height');
  s.crouching=false;s.prone=true;o=B.muzzleOrigin(s,t,b);approx(o.y,.31,1e-9,'prone bore height');
  s.prone=false;
  let meta=null;b.random=()=>.5;b.onShot=(a,target,hit,d,m)=>meta=m;
  B.resolve(s,t,b);
  const expected=B.muzzleOrigin(s,t,b);
  approx(meta.origin.x,expected.x,1e-9);approx(meta.origin.y,expected.y,1e-9);approx(meta.origin.z,expected.z,1e-9);
  assert.equal(B.fireLineBlocked(s,t,b),false,'flat-ground muzzle line reaches the body');
  console.log('PASS round origin and crest gate share the deterministic simulation muzzle');
}

function logField(x,z){
  const tactical={x,z,y:0,height:.62,radius:2.1,cover:.60,type:'log',physicalId:'log-1'};
  const exact={id:'log-1',type:'log',shape:'obb',x,z,hx:2.5,hz:.275,ux:1,uz:0,vx:0,vz:1};
  const obstacles=[tactical];obstacles.__physicalFootprints=[exact];obstacles.__physicalVersion=4;return obstacles;
}
function resolveLine(r,s,t,obstacles,enemies){
  const b=H.makeBattle(r,{seed:7,obstacles});b.random=()=>.5;b._roster.ge.push(...(enemies||[]));b.factions.ge.alive=(enemies||[]).length;
  let meta=null;b.onShot=(a,target,hit,d,m)=>meta=m;r.BattleBallistics.resolve(s,t,b);return meta;
}
{
  const r=root(),s=man(0,1,'us'),t=man(30,1,'ge');s.weapon=weapon('rifle');
  const obstacles=logField(15,0),exact=r.BattleBallistics.ballisticObstacles(obstacles);
  assert.equal(exact.length,1);assert.equal(exact[0].shape,'obb','ballistics resolves the linked physical footprint');
  const shot=resolveLine(r,s,t,obstacles,[t]);
  assert.equal(shot.victim,t,'a ray inside the tactical cover circle but outside the rendered log footprint flies on');
  console.log('PASS tactical cover radius no longer catches a round that misses the physical log');
}
{
  const r=root(),s=man(15,-10,'us'),t=man(15,10,'ge');s.weapon=weapon('rifle');s.prone=true;t.prone=true;
  const shot=resolveLine(r,s,t,logField(15,0),[]);
  assert.equal(shot.stoppedBy,'environment');assert.equal(shot.surface,'log');
  assert.ok(shot.impact.z>-0.34&&shot.impact.z<-0.22,'impact is on the 0.275 m physical log face, not the 2.1 m tactical circle: '+shot.impact.z);
  assert.ok(shot.normal.z<-.9,'OBB impact normal faces back toward the shooter');
  console.log('PASS scatter-cover impact and decal normal land on the physical face');
}
{
  const r=root(),s=man(15,-10,'us'),t=man(15,10,'ge');s.weapon=weapon('rifle');
  const tactical=[{x:15,z:0,y:0,height:.62,radius:2.1,cover:.60,type:'log'}];
  const shot=resolveLine(r,s,t,tactical,[]);
  assert.ok(shot.impact.z<-1.5,'legacy/no-footprint obstacles retain their old cylinder collision');
  console.log('PASS compatibility fallback remains for obstacles without physical geometry');
}
console.log('4 ballistics geometry checks passed');
