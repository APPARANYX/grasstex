#!/usr/bin/env node
'use strict';
/* Focused station skill contract: independent selection, one native owner claim,
   zero direct station or movement writes, cancellation/restart isolation. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const src = fs.readFileSync(require('node:path').join(__dirname, '../../battle/modules/13f-tactical-station-skill.js'), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }
function fixture() {
  const members = [1,2,3,4].map(id => ({id, hp:100, root:{position:{x:id,z:0}}, squad:null}));
  const sq={id:'us-0', commandPhase:'defend', members};
  members.forEach(s => s.squad=sq);
  const sim={time:1};
  const current=new Map(), receipts=new Map(), requests=[], cancelled=[];
  const post={id:'native-001'};
  const owner={
    revision:()=>0, current:s=>current.get(s)||null, canAssign:s=>s.hp>0,
    candidates:()=>[post]
  };
  const root={
    BattleNavigation:{version:1}, BattleTacticalPositions:owner,
    BattleTacticalRoute:{knownThreat:()=>({x:10,z:90})},
    SquadAI:{isMachineGun:s=>s.id===1},
    BattleTacticalMarchProvider:{releaseMan:(ctx,s)=>cancelled.push('march-'+s.id)},
    BattleTacticalContactSkills:{release:(ctx,s)=>cancelled.push('contact-'+s.id)},
    BattleTacticalCoveredManeuver:{wants:()=>false}
  };
  vm.runInNewContext(src,{window:root});
  const ctx={
    sim,squad:sq,token:{battleId:1,generation:1,controllerEpoch:1,missionVersion:1,rosterRevision:1},
    stage:id=>receipts.get(id)||{stage:'assigned'},
    request:(capability,id,params)=>{
      requests.push({capability,id,params});
      const s=members.find(s=>String(s.id)===id);
      current.set(s,{station:params.stationId});
      const actionId='claim-'+requests.length;
      receipts.set(actionId,{stage:'assigned'});
      return {ok:true,actionId};
    },
    finish:id=>cancelled.push('finish-'+id)
  };
  return {root,ctx,requests,owner,members,current,receipts,cancelled};
}
test('one canonical typed station claim, machine gun priority',()=>{
  const w=fixture(); w.root.BattleTacticalStationSkill.update(w.ctx);
  assert.equal(w.requests.length,1);
  assert.equal(w.requests[0].capability,'station.claim');
  assert.equal(w.requests[0].id,'1');
  assert.equal(w.requests[0].params.stationId,'native-001');
  assert.ok(w.cancelled.includes('contact-1')&&w.cancelled.includes('march-1'));
});
test('active native claims do not duplicate and up to three are selected',()=>{
  const w=fixture();
  for(let i=0;i<9;i++)w.root.BattleTacticalStationSkill.update(w.ctx);
  assert.equal(w.requests.length,3);
  assert.equal(w.current.size,3);
});
test('no policy action without perceived threat or eligible candidates',()=>{
  const w=fixture(); w.root.BattleTacticalRoute.knownThreat=()=>null;
  w.root.BattleTacticalStationSkill.update(w.ctx);assert.equal(w.requests.length,0);
  const z=fixture();z.owner.candidates=()=>[];
  z.root.BattleTacticalStationSkill.update(z.ctx);assert.equal(z.requests.length,0);
  assert.equal(z.root.BattleTacticalStationSkill.summary(z.ctx.squad).reason,'no-lawful-available-station');
});
test('mission generation changes clear skill-local action state',()=>{
  const w=fixture(); w.root.BattleTacticalStationSkill.update(w.ctx);
  const before=w.root.BattleTacticalStationSkill.summary(w.ctx.squad);
  assert.equal(before.liveActionIds.length,1);
  w.ctx.token.missionVersion++;
  const changed=w.root.BattleTacticalStationSkill.summary(w.ctx.squad);
  assert.equal(changed.liveActionIds.length,1);
  w.root.BattleTacticalStationSkill.update(w.ctx);
  assert.equal(w.requests.length,2);
});
test('new skill does not write canonical station/movement fields',()=>{
  assert.doesNotMatch(src,/\.destination\s*=|\.commandPhase\s*=|\.weapon\s*=|\.station\s*=|\.position\s*=/);
});
console.log(passed+' tactical station skill checks passed');
