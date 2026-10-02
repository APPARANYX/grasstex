#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),H=require('./harness');
function load(r,p){new Function('window','globalThis','console',fs.readFileSync(path.join(H.REPO,p),'utf8'))(r,r,{log(){},warn(){}});}
function fixture(){
  const r=H.bootstrap({modules:false}),systems={};
  r.BattleModules={registerSystem(id,s){systems[id]=s;},unitsFor:b=>b._roster.us.concat(b._roster.ge)};
  load(r,'battle/modules/43-squad-forward-progress.js');
  const b=H.makeBattle(r),q=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:0,z:100},
    composition:['rifleman','rifleman','rifleman','rifleman']});
  q.state='engaged';q.commandPhase='assault';q.objective={x:0,z:100};
  const S=systems['squad-forward-progress'];S.onBattleStart(b);
  return{r,b,q,S};
}
function tick(S,b,t){b.time=t;S.onCommanderTick(b);}
function summary(r,b){return r.BattleSquadForwardProgress.summary(b);}
let failed=0;
function test(name,fn){try{H.resetIds();fn();console.log('PASS: '+name);}catch(e){failed++;console.error('FAIL: '+name+'\n'+e.stack);}}

test('a death cannot manufacture squad travel by moving the centroid',()=>{
  const{r,b,q,S}=fixture(),m=q.members;
  for(const s of m){s.root.position.x=0;s.root.position.z=0;}
  m[3].root.position.x=60; // centroid starts 15 m sideways from the objective axis
  tick(S,b,0);
  m[3].dead=true; // no survivor moved; the living centroid jumps 15 m anyway
  tick(S,b,.45);
  for(let t=.9;t<=16.2;t+=.45)tick(S,b,+t.toFixed(2));
  const out=summary(r,b);
  assert.equal(out.compositionResets,1);
  assert.equal(out.totalAlerts,0,'roster discontinuity is not physical low-forward-progress travel');
});

test('a stable cohort that really travels without objective progress still alerts',()=>{
  const{r,b,q,S}=fixture(),m=q.members;
  for(const s of m){s.root.position.x=0;s.root.position.z=0;}
  tick(S,b,0);
  for(let i=1;i<=36;i++){
    const x=i%2?6:0;
    for(const s of m)s.root.position.x=x;
    tick(S,b,+(i*.45).toFixed(2));
  }
  const out=summary(r,b);
  assert.equal(out.compositionResets,0);
  assert.ok(out.totalAlerts>=1,'real lateral travel with negligible objective progress remains diagnosable');
  assert.equal(out.alerts[0].kind,'low-forward-progress');
});

test('same-size roster replacement also rebases the centroid cohort',()=>{
  const{r,b,q,S}=fixture(),m=q.members;
  for(const s of m){s.root.position.x=0;s.root.position.z=0;}
  m[3].root.position.x=50;
  tick(S,b,0);
  const gone=m[3];gone.dead=true;
  const replacement={...m[0],id:999,dead:false,root:{position:{x:0,y:0,z:0},rotation:{x:0,y:0,z:0}}};
  q.members=q.members.filter(s=>s!==gone);q.members.push(replacement);
  b._roster.us.push(replacement);
  tick(S,b,.45);
  assert.equal(summary(r,b).compositionResets,1,'cohort identity, not merely living count, defines centroid continuity');
});

if(failed)process.exitCode=1;
