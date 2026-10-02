#!/usr/bin/env node
'use strict';

const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),H=require('./harness');

function load(root,file){
  new Function('window','globalThis','console',fs.readFileSync(path.join(H.REPO,file),'utf8'))(root,root,{log(){},warn(){}});
}
function fixture(){
  const systems={},root={
    BattleModules:{registerSystem(id,s){systems[id]=s;}},
    BattleTelemetry:{record(){}}
  };
  load(root,'battle/modules/43-squad-forward-progress.js');
  const members=[
    {id:1,dead:false,root:{position:{x:0,y:0,z:0}}},
    {id:2,dead:false,root:{position:{x:0,y:0,z:0}}}
  ];
  const sq={id:'us-0',faction:'us',state:'engaged',commandPhase:'assault',objective:{x:0,z:100},routeIndex:0,members};
  const sim={time:0,factions:{us:{squads:[sq]},ge:{squads:[]}},_objectives:[]};
  const system=systems['squad-forward-progress'];
  assert.ok(system,'forward progress system registered');
  system.onBattleStart(sim);
  return{root,system,sim,sq,members};
}
function tick(ctx,t){
  ctx.sim.time=t;
  ctx.system.onCommanderTick(ctx.sim);
}
let n=0;
function test(name,fn){fn();n++;console.log('PASS '+name);}

test('a stable-roster out-and-back still raises low-forward-progress',()=>{
  const c=fixture();
  for(let i=0;i<=30;i++){
    const x=i<=15?i:(30-i);
    for(const m of c.members)m.root.position.x=x;
    tick(c,i*.5);
  }
  const s=c.root.BattleSquadForwardProgress.summary(c.sim);
  assert.ok(s.totalAlerts>=1,'real low-net travel must still alert');
  const a=s.alerts[0];
  assert.equal(a.rosterKey,'1,2');
  assert.ok(Number.isFinite(a.startAt)&&Number.isFinite(a.endAt)&&a.endAt>a.startAt,'alert exposes its exact tracked interval');
  assert.deepEqual(Object.keys(a.startPoint).sort(),['x','z']);
  assert.deepEqual(Object.keys(a.endPoint).sort(),['x','z']);
  assert.deepEqual(a.goal,{x:0,z:100});
});

test('a living-roster change resets the centroid odometer instead of manufacturing travel',()=>{
  const c=fixture();
  c.members[0].root.position.x=0;
  c.members[1].root.position.x=30;
  for(let i=0;i<=24;i++)tick(c,i*.5); // 12 s stationary with centroid x=15

  c.members[1].dead=true;               // surviving body never moved; centroid jumps x=15 -> x=0
  for(let i=25;i<=30;i++)tick(c,i*.5);

  const s=c.root.BattleSquadForwardProgress.summary(c.sim);
  assert.equal(s.totalAlerts,0,'a changed measurement population cannot count as squad travel');
  assert.equal(s.trackResets.roster,1,'the roster discontinuity restarts exactly one progress track');
});

console.log(n+' forward-progress checks passed.');
