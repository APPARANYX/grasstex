#!/usr/bin/env node
'use strict';
// Visual-only regression for the 5km transport model: both faction render maps
// are the same real FBX truck, with faction-correct soldiers and exact seat JSON.
// It must never become a second movement/transport authority.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const path='battle/modules/59-strategic-truck-visual.js';
const code=fs.readFileSync(path,'utf8');
const source=JSON.parse(fs.readFileSync('docs/reference/german_transport-seats.json','utf8'));
const system={};
const win={
  location:{search:'?strategicInterception=1&motorTransport=1&truckVisual=1'},
  BattleModules:{registerSystem:(id,handlers)=>{system[id]=handlers;}},
  GTLog:()=>{}
};
const context={window:win,console,Set,Map,WeakMap,Math,Array,Promise,isFinite};
vm.runInNewContext(code,context,{filename:path});
const api=win.BattleTransportVehicleVisual;
assert.ok(api,'Truck visual must register a testable read-only API');
assert.ok(
  code.indexOf('var b = bounds(mesh);') >= 0 &&
    code.indexOf('var b = bounds(mesh);') < code.indexOf('attachImport(result, body);'),
  'Soldier FBX must be normalized before parenting: world-space offsets displace riders kilometres'
);
assert.ok(code.includes('if (!tracks[i] || !tracks[i].target) tracks.splice(i, 1);'),
  'Null animation targets must be rejected before Babylon starts a Truck pose');
assert.ok(system['strategic-truck-visual'],'Only a visual system may be registered');
assert.equal(api.vehicleForFaction('us'),'german_transport.fbx');
assert.equal(api.vehicleForFaction('ge'),'german_transport.fbx');
assert.equal(api.vehicleForFaction('fr'),null);
assert.equal(api.soldierModelForFaction('us'),'us-paratrooper.fbx');
assert.equal(api.soldierModelForFaction('ge'),'ge-paratrooper.fbx');
assert.equal(api.soldierModelForFaction('fr'),null);
assert.equal(source.version,1);
assert.equal(source.vehicle,'german_transport.fbx');
assert.equal(source.units,'vehicle-local-metres');
const seats=api.seats();
assert.equal(seats.length,10,'User supplied ten seats, not an invented vehicle capacity');
assert.deepEqual(JSON.parse(JSON.stringify(seats)),source.seats);
assert.equal(seats[0].role,'driver');
assert.equal(seats[0].clip,'Truck - Driving.fbx');
assert.equal(seats.filter(s=>s.role==='passenger').length,9);
assert.deepEqual([...new Set(seats.map(s=>s.clip))].sort(),
  ['Truck - Driving.fbx','Truck - Sitting 1.fbx','Truck - Sitting 2.fbx','Truck - Sitting 3.fbx'].sort());
const squads=[{members:Array.from({length:10},(_,i)=>({id:i,dead:false}))},
              {members:Array.from({length:5},(_,i)=>({id:i,dead:i===3}))}];
assert.equal(api.assignmentCount(squads[0]),10);
assert.equal(api.assignmentCount(squads[1]),4);
const sim={scene:{metadata:{battleScenario:{profile:'strategic'}}},
  heightAt:()=>0,factions:{us:{squads:squads.slice(0,1)},ge:{squads:squads.slice(1)}}};
assert.ok(api.enabled(sim),'5km motor transports allow visible truck');
const untouched=JSON.stringify(sim);
system['strategic-truck-visual'].onSimulationStep(sim,{dt:1});
assert.equal(JSON.stringify(sim),untouched,'visual system cannot modify sim with missing Babylon graphics backend');
for(const search of ['', '?strategicInterception=1','?motorTransport=1',
                     '?strategicInterception=1&motorTransport=1&truckVisual=0']){
  win.location.search=search;
  assert.equal(api.enabled(sim),false,'no visual side effects for disabled flag '+search);
}
win.location.search='?strategicInterception=1&motorTransport=1';
assert.ok(api.enabled(sim),'truckVisual=1 need not be explicitly specified');
sim.scene.metadata.battleScenario.profile='default';
assert.equal(api.enabled(sim),false,'legacy profile remains untouched');
assert.ok(!/\.root\.position\.(x|y|z)\s*=/.test(code),'visual module cannot mutate soldier positions');
for(const name of ['german_transport.fbx','Truck - Driving.fbx','Truck - Sitting 1.fbx',
                   'Truck - Sitting 2.fbx','Truck - Sitting 3.fbx']){
  const dir=/^Truck/.test(name)?'Assets/animations':'Assets/vehicles';
  assert.ok(fs.statSync(dir+'/'+name).size>0,'Missing visual asset '+name);
}
console.log('PASS 5km truck visual: exact 10-seat config, both factions shared truck, faction-correct soldier FBX, flag isolation and no movement mutation');
