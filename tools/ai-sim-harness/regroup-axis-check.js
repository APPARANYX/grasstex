#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),H=require('./harness');
function load(r,p){new Function('window','globalThis','console',fs.readFileSync(path.join(H.REPO,p),'utf8'))(r,r,{log(){},warn(){}});}
function root(){
  const r=H.bootstrap({modules:false}),systems={};
  r.BattleModules={registerSystem(id,s){systems[id]=s;},getSystem(id){return systems[id];},unitsFor:b=>(b._roster.us||[]).concat(b._roster.ge||[])};
  r.BattleCommanderDoctrine={policyFor(){return{cohesionRadius:34,captainlessCohesion:26,routeArrivalRadius:8,captureCommitRatio:.82};}};
  load(r,'battle/modules/16-squad-plan-stability.js');
  return r;
}

const r=root(),b=H.makeBattle(r),q=H.addSquad(r,b,{id:'us-0',faction:'us',x:0,z:0,objective:{x:100,z:0}});
q.commandPhase='regroup';
q.orderAnchor={x:0,z:0};q.rally={x:0,z:0};
/* A regroup overwrites objective with its own anchor. The directional cohesion test must therefore
   use the formation's remembered forward axis, not interpret the zero-length objective vector as
   "every distant man is an outrunner". */
q.objective={x:0,z:0};q._formationForward={x:1,z:0};
for(let i=0;i<q.members.length;i++){q.members[i].root.position.x=(i-4)*.6;q.members[i].root.position.z=(i%2)*.5;}
const behind=q.members[8],ahead=q.members[9];
behind.root.position.x=-75;ahead.root.position.x=75;
const a=r.BattleRegroupHysteresis.assessment(q,34),behindId=String(behind.id),aheadId=String(ahead.id);
assert.ok(a.stragglers.includes(behindId),'man behind the regroup anchor must be scored as a lagger/straggler');
assert.ok(!a.outrunners.includes(behindId),'man behind the regroup anchor must never be scored as an outrunner');
assert.ok(a.outrunners.includes(aheadId),'man genuinely ahead of the remembered formation axis remains an outrunner');
assert.equal(a.dispersed,true,'a genuine forward outrunner still blocks cohesion');
console.log('PASS regroup anchor uses _formationForward: behind man is a straggler, never an outrunner');
