/* Isolated diagnostics: execute shipping APIs with explicit fixture services.
   No production source changes. Synthetic fault results are not battle incidents. */
const fs=require('node:fs'), assert=require('node:assert/strict');
const {loadModule}=require('../../tools/ai-sim-harness/module-loader');
const out='docs/audits/2026-10-20-grasstex/runtime-verification/artifacts/';
const names=['strategicInterception','motorTransport','aerialRecon','interception','truckCollision'];
const rows=[];
for(const profile of ['strategic','legacy']) for(let mask=0;mask<32;mask++){
 const flags=Object.fromEntries(names.map((n,i)=>[n,!!(mask&(1<<i))]));
 const search='?'+names.map(n=>n+'='+(flags[n]?1:0)).join('&');
 const hooks={},root={location:{search},GTLog(){},BattleModules:{registerSystem:(id,h)=>hooks[id]=h}};
 for(const file of ['58-strategic-abstract-transport','59-strategic-aerial-recon','59b-strategic-interception']) loadModule(root,'battle/modules/'+file+'.js');
 const bases={us:{bases:[{id:'a',objectiveId:'a',x:0,z:0}]},ge:{bases:[{id:'b',objectiveId:'b',x:0,z:1000}]}};
 const sim={time:0,obstacles:[],scene:{metadata:{battleScenario:{profile,spawnZones:bases,roads:[{fromObjectiveId:'a',toObjectiveId:'b',ax:0,az:0,bx:0,bz:1000}]}}},factions:{us:{squads:[]},ge:{squads:[]}}};
 hooks['strategic-abstract-transport'].onBattleStart(sim);
 const effective={fleet:root.BattleSquadTransport.fleetSummary(sim).length,recon:root.BattleAerialRecon.status(sim,'us').enabled,interception:root.BattleStrategicInterception.enabled(sim),colliders:(sim.obstacles.__dynamicFootprints||[]).length};
 assert.equal(effective.fleet,profile==='strategic'&&flags.motorTransport?4:0);
 assert.equal(effective.recon,profile==='strategic'&&flags.strategicInterception&&flags.aerialRecon);
 assert.equal(effective.interception,profile==='strategic'&&names.slice(0,4).every(n=>flags[n]));
 assert.equal(effective.colliders,flags.truckCollision?effective.fleet:0);
 rows.push({profile,search,flags,effective});
}
fs.writeFileSync(out+'strategic-flag-matrix.json',JSON.stringify(rows,null,2));
const root={SquadAI:{extend(){}},GTLog(){},location:{search:''}};
loadModule(root,'battle/core-runtime.js');
loadModule(root,'battle/modules/14-z-ballistic-raycast.js');
const ray=[{x:0,y:2,z:0},{x:10,y:2,z:0},{obstacles:[],heightAt:()=>0}];
root.BattleObstacleField={sightBlocker:()=>true};
const normalBlocked=root.BattleBallistics.environmentLineBlocked(...ray);
let throws=0;
root.BattleObstacleField.sightBlocker=()=>{throws++;throw Error('injected obstacle failure')};
root.BattleNavigation={lineOfSightBlocked:()=>{throws++;throw Error('injected navigation failure')}};
const faultsBlocked=root.BattleBallistics.environmentLineBlocked(...ray);
assert.equal(normalBlocked,true); assert.equal(faultsBlocked,false); assert.equal(throws,2);
const errors=[],lifecycleRoot={GTLog(){}};
loadModule(lifecycleRoot,'battle/module-registry.js',{console:{error:(...a)=>errors.push(String(a[0]))}});
let continued=false;
lifecycleRoot.BattleModules.registerSystem('a-failing',{onBattleRestart(){throw Error('injected restart failure')}});
lifecycleRoot.BattleModules.registerSystem('z-next',{onBattleRestart(){continued=true}});
let propagated=false;try{lifecycleRoot.BattleModules.runHook('onBattleRestart',{},{});}catch(e){propagated=true;}
assert.equal(continued,true);assert.equal(propagated,false);assert.equal(errors.length,1);
fs.writeFileSync(out+'fault-injection.json',JSON.stringify({ballistics:{normalBlocked,faultsBlocked,throws,source:'battle/modules/14-z-ballistic-raycast.js:271'},lifecycle:{continued,propagated,errors,source:'battle/module-registry.js:131'}},null,2));
console.log('64 strategic/legacy combinations passed; fail-open ballistics and continue-after-hook-failure reproduced under injected faults.');
