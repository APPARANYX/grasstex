#!/usr/bin/env node
'use strict';
/* Real-crew contract: transport selects the squad's existing role-specific
   FBX soldier identity, binds one presentation seat and never imports a
   replacement rig for each passenger. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const modulePath='battle/modules/59-strategic-truck-visual.js';
const code=fs.readFileSync(modulePath,'utf8');
const backend=fs.readFileSync('battle/modules/53-fbx-soldier-backend.js','utf8');
const render=fs.readFileSync('battle/modules/52-fbx-render-lod.js','utf8');
const seatJson=JSON.parse(fs.readFileSync('docs/reference/german_transport-seats.json','utf8'));
const systems={};
const models={
  us:{default:'us-paratrooper.fbx',gunner:'us-gunner.fbx',scout:'us-scout.fbx'},
  ge:{default:'ge-paratrooper.fbx',engineer:'ge-engineer.fbx',sergeant:'ge-captain.fbx'}
};
const window={
  location:{search:'?strategicInterception=1&motorTransport=1'},
  BattleModules:{registerSystem:(id,spec)=>{systems[id]=spec;}},
  BattleFbxSoldier:{models},
  BattleFbxClipMixer:{create:()=>({sampleLayer:()=>1})},
  GTLog:()=>{}
};
vm.runInNewContext(code,{window,console,Set,Map,WeakMap,Math,Array,Promise,isFinite},
  {filename:modulePath});
const api=window.BattleTransportVehicleVisual;
assert.ok(api);
assert.ok(systems['strategic-truck-visual']);
assert.equal(api.vehicleForFaction('us'),'german_transport.fbx');
assert.equal(api.vehicleForFaction('ge'),'german_transport.fbx');
assert.equal(api.vehicleForFaction('fr'),null);
assert.equal(api.soldierModelForFaction('us'),'us-paratrooper.fbx');
assert.equal(api.soldierModelForFaction('ge'),'ge-paratrooper.fbx');
assert.equal(api.soldierModelForFaction('fr'),null);
const scout={id:10,_fbx:{lib:{file:'us-scout.fbx'}}};
const gunner={id:11,_fbx:{lib:{file:'us-gunner.fbx'}}};
assert.equal(api.modelForSoldier(scout),'us-scout.fbx');
assert.equal(api.modelForSoldier(gunner),'us-gunner.fbx');
assert.equal(api.modelForSoldier({}),null);
const actualSeat={vehicleId:'squad/10',seatIndex:2,seatName:'Right 2',
  animation:'Truck - Sitting 2.fbx',originalModel:'us-gunner.fbx',phase:'embarked'};
gunner._vehiclePresentation=actualSeat;
assert.deepEqual(JSON.parse(JSON.stringify(api.seatForSoldier(gunner))),
  {vehicleId:'squad/10',seatIndex:2,seatName:'Right 2',
   animation:'Truck - Sitting 2.fbx',model:'us-gunner.fbx',phase:'embarked'});
assert.equal(api.seatForSoldier(scout),null);
assert.equal(seatJson.version,1);
assert.equal(seatJson.vehicle,'german_transport.fbx');
assert.deepEqual(JSON.parse(JSON.stringify(api.seats())),seatJson.seats);
assert.equal(api.seats().length,10);
assert.deepEqual([...new Set(api.seats().map(s=>s.clip))].sort(),
  ['Truck - Driving.fbx','Truck - Sitting 1.fbx',
   'Truck - Sitting 2.fbx','Truck - Sitting 3.fbx'].sort());
assert.equal(api.assignmentCount({members:[scout,gunner]}),2);
assert.equal(api.assignmentCount({members:[{id:1,dead:true},gunner]}),1);
const sim={scene:{metadata:{battleScenario:{profile:'strategic'}}},factions:{us:{squads:[]},ge:{squads:[]}}};
assert.ok(api.enabled(sim));
const before=JSON.stringify(sim);
systems['strategic-truck-visual'].onSimulationStep(sim,{dt:1});
assert.equal(JSON.stringify(sim),before,'Missing Babylon graphics must not mutate the simulation');
assert.ok(!code.includes('ImportMeshAsync(\'\', \'file:\', file, scene, undefined, \'.fbx\')') ||
  code.match(/ImportMeshAsync/g).length===1,'Only the shared truck source may be imported');
assert.ok(!code.includes('ImportAnimationsAsync'),
  'Never import Truck clips separately for each seated soldier');
assert.ok(!code.includes('function loadRider'),
  'No mannequin or one-at-a-time per-passenger asset loader');
assert.ok(code.includes('fx._vehicleSeat = presentation'),
  'Actual FBX soldier must own its seat assignment');
assert.ok(code.includes('soldier._vehiclePresentation = presentation'),
  'Live soldier must expose the vehicle seat, animation and identity');
assert.ok(code.includes('delete fx._vehicleSeat'),
  'Dismount must restore on-foot pose authority');
assert.ok(code.includes('restoreTransform(fx.holder'),
  'Original rig must be reparented back after dismount');
assert.ok(code.includes('seatIndex: member.index'), 'Seat association must be explicit');
assert.ok(code.includes('if (entry.showcase || entry.phase !=='),
  'Showcase must not borrow active combat actors');
assert.ok(backend.includes('prepareVehicleClips: prepareVehicleClips'));
assert.ok(backend.includes('vehiclePoseClip: function (soldier, seatFile)'));
assert.ok(backend.includes('retargetClips(targetLib, clipRigs[key]'),
  'Pose clips must be retargeted to existing models using source rest frames');
assert.ok(render.includes('fx._vehicleSeat.applyPose(fx)'),
  'On-foot animation should not overwrite seated pose');
for(const search of ['', '?strategicInterception=1','?motorTransport=1',
  '?strategicInterception=1&motorTransport=1&truckVisual=0']){
  window.location.search=search;
  assert.equal(api.enabled(sim),false);
}
sim.scene.metadata.battleScenario.profile='default';
window.location.search='?strategicInterception=1&motorTransport=1';
assert.equal(api.enabled(sim),false);
assert.ok(!/\.root\.position\.(x|y|z)\s*=/.test(code),'Visuals must not own movement');
for(const name of ['german_transport.fbx','Truck - Driving.fbx',
  'Truck - Sitting 1.fbx','Truck - Sitting 2.fbx','Truck - Sitting 3.fbx']){
  const dir=name.startsWith('Truck')?'Assets/animations':'Assets/vehicles';
  assert.ok(fs.statSync(dir+'/'+name).size>0,'Missing scene asset '+name);
}
console.log('PASS 5km live truck crew: unchanged actor identities, original role models, per-seat presentation, shared clip prewarm, restore on dismount and simulation flag isolation');
