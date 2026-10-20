const fs=require('node:fs'),cp=require('node:child_process');
const {loadSource}=require('../../tools/ai-sim-harness/module-loader');
const rows=[];
for(const ref of ['f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9','fa99ec8f15acf0f76d83e7f5a4317191ab5a61e5'])for(const search of ['', '?strategicInterception=0&motorTransport=0&aerialRecon=0&interception=0&truckCollision=0','?strategicInterception=1&motorTransport=1&aerialRecon=1&interception=1&truckCollision=1']){
const hooks={},root={GTLog(){},location:{search},BattleModules:{registerSystem:(id,h)=>hooks[id]=h}};
for(const file of ['58-strategic-abstract-transport','59-strategic-aerial-recon','59b-strategic-interception'])loadSource(root,cp.execFileSync('git',['show',ref+':battle/modules/'+file+'.js'],{encoding:'utf8'}));
const sim={time:0,obstacles:[],factions:{us:{squads:[]},ge:{squads:[]}},scene:{metadata:{battleScenario:{profile:'strategic',spawnZones:{us:{bases:[{id:'a',objectiveId:'a',x:0,z:0}]},ge:{bases:[{id:'b',objectiveId:'b',x:0,z:1000}]}},roads:[{fromObjectiveId:'a',toObjectiveId:'b',ax:0,az:0,bx:0,bz:1000}]}}}};
hooks['strategic-abstract-transport'].onBattleStart(sim);
rows.push({ref,search,fixtureProfile:'strategic',fleet:root.BattleSquadTransport.fleetSummary(sim).length,recon:root.BattleAerialRecon.status(sim,'us').enabled,interception:root.BattleStrategicInterception.enabled(sim),colliders:sim.obstacles.__dynamicFootprints.length});
}
fs.writeFileSync('docs/audits/2026-10-20-grasstex/runtime-verification/artifacts/default-drift.json',JSON.stringify(rows,null,2));console.log(rows);
