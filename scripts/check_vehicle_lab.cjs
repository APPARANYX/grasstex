#!/usr/bin/env node
'use strict';
// Parse the shipped in-page Vehicle Lab script, verify referenced controls,
// and guard the integration paths that let the page and truck reach previews.
const fs=require('fs');
const vm=require('vm');
const assert=require('assert/strict');
const html=fs.readFileSync('labs/vehicle-animation-lab.html','utf8');
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(m=>m[1].trim()).filter(Boolean);
assert.equal(scripts.length,1,'Vehicle Lab should contain one in-page JS script');
new vm.Script(scripts[0],{filename:'labs/vehicle-animation-lab.html'});
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
for(const match of scripts[0].matchAll(/\$\('([^']+)'\)/g)){
  assert.ok(ids.has(match[1]),'Missing Vehicle Lab control #'+match[1]);
}
for(const name of ['FrontWheels','RearWheels','SeatAnchor_','ImportAnimationsAsync','ImportMeshAsync',
                   'vehicle-local-metres','saveLocal','exportJson','importJson']){
  assert.ok(html.includes(name),'Vehicle Lab missing '+name);
}
const truckClips=['Truck - Driving.fbx','Truck - Sitting 1.fbx','Truck - Sitting 2.fbx','Truck - Sitting 3.fbx'];
for(const file of truckClips){
  assert.ok(fs.statSync('Assets/animations/'+file).size>0,'Missing committed truck pose: '+file);
  assert.ok(/truck/i.test(file) && /\.fbx$/i.test(file),'Truck pose must be discoverable by the lab filename filter');
}
assert.ok(scripts[0].includes('function suggestSeatPoses('),'Driver and passenger pose suggestion missing');
// User-facing vehicle controls: a complete crew should be previewable without
// visiting four different seat forms, and back faces must be renderable.
for(const id of ['showCrew','doubleSided','materialCount','refreshOccupants','seatPose','seatOccupied']){
  assert.ok(ids.has(id),'Missing required vehicle lab control #'+id);
}
assert.ok(html.includes('id="doubleSided" type="checkbox" checked'),
  'Double-sided rendering must default on in the Vehicle Lab');
assert.ok(scripts[0].includes('material.backFaceCulling=enabled?false:original.backFaceCulling'),
  'Vehicle material backface toggle missing');
assert.ok(scripts[0].includes("material.twoSidedLighting=enabled?true:original.twoSidedLighting"),
  'Vehicle backface lighting toggle missing');
assert.ok(scripts[0].includes("$('showCrew').onclick=async()=>"),
  'One-click full crew handler missing');
assert.ok(scripts[0].includes("ensureSeats();\n    suggestSeatPoses();"),
  'Vehicle import must assign Truck driving/sitting poses to new seats');
// Axle editor UI, shader diagnostics and pivot runtime contract.
for(const id of ['axleSelect','axleX','axleY','axleZ','axleAxis','pickAxle',
  'resetAxle','showAxleMarkers','spinWheels','unlitVehicle','contrastGaps',
  'inspectSurface','surfaceReport']){
  assert.ok(ids.has(id),'Missing axle/material control #'+id);
}
for(const term of ['node.setParent(pivot)','function autoWheelCenter(',
  'function setAxleCenter(', 'function inspectTruckPick(',
  "state.axles[side]={center:autoCenter.slice(),autoCenter:autoCenter.slice(),axis:'x'}",
  'material.disableLighting=enabled?true:original.disableLighting',
  'material.unlit=enabled?true:original.unlit']){
  assert.ok(scripts[0].includes(term),'Missing axle/material logic: '+term);
}
assert.ok(!scripts[0].includes('state.wheelBase'),'Legacy node-origin rotation must not remain');

// Execute the pure calibration math from the shipped in-page script with a minimal
// Vector3 substitute. The wheel geometry world position must remain invariant
// as the axle center changes. The other axle must not be affected.
const script=scripts[0];
const a0=script.indexOf('function setAxleCenter(side,center){');
const a1=script.indexOf('async function importBinary(',a0);
assert.ok(a0>=0&&a1>a0,'Cannot isolate axle pivot calibration function');
class V {
  constructor(x,y,z){this.x=x;this.y=y;this.z=z;}
  subtract(v){return new V(this.x-v.x,this.y-v.y,this.z-v.z);}
  subtractInPlace(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
  copyFrom(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
}
const vec=a=>new V(...a);
const front={position:new V(1,1,1)};
const rear={position:new V(3,1,1)};
const pivotFront={position:new V(0,1,2)};
const pivotRear={position:new V(0,2,4)};
const state={
  axles:{front:{center:[0,1,2]},rear:{center:[0,2,4]}},
  axleRig:{
    front:{pivot:pivotFront,roots:[front]},
    rear:{pivot:pivotRear,roots:[rear]}
  }
};
const world=(node,pivot)=>[node.position.x+pivot.position.x,
  node.position.y+pivot.position.y,node.position.z+pivot.position.z];
const beforeFront=world(front,pivotFront),beforeRear=world(rear,pivotRear);
let resets=0,markers=0;
const setAxleCenter=new Function('state','vec','resetWheelRotation','updateAxleMarkers',
  script.slice(a0,a1)+'\nreturn setAxleCenter;')(
  state,vec,()=>{resets++;},()=>{markers++;}
);
assert.equal(setAxleCenter('front',[.2,1.6,1.9]),true);
assert.deepEqual(world(front,pivotFront).map(v=>+v.toFixed(6)),beforeFront);
assert.deepEqual(world(rear,pivotRear),beforeRear);
assert.deepEqual(state.axles.front.center,[.2,1.6,1.9]);
assert.equal(setAxleCenter('front',[Infinity,0,0]),false);
assert.equal(setAxleCenter('front',[1,2]),false);
assert.equal(resets,1);assert.equal(markers,1);

// Old seat-only sidecars are accepted; v2 validates saved axle centers/axes.
const v0=script.indexOf('function validConfig(value){');
const v1=script.indexOf('function applyConfig(value){',v0);
assert.ok(v0>=0&&v1>v0,'Cannot isolate JSON calibration validator');
const validConfig=new Function('localSeat',
  script.slice(v0,v1)+'\nreturn validConfig;')(
  (name,role,x,y,z,yaw,occupied,clip)=>({name,role,position:[x,y,z],yaw,occupied,clip})
);
const seat={name:'Driver',role:'driver',position:[0,1,2],yaw:0,
  occupied:true,clip:'Truck - Driving.fbx'};
assert.deepEqual(validConfig({version:1,seats:[seat]}).axles,{});
const v2={version:2,units:'vehicle-local-metres',seats:[seat],
  axles:{front:{center:[0,1,2],axis:'x'},rear:{center:[0,1,4],axis:'z'}}};
assert.equal(validConfig(v2).axles.rear.axis,'z');
assert.throws(()=>validConfig({...v2,axles:{front:{center:[NaN,1,2],axis:'x'}}}),/Invalid front axle/);
assert.throws(()=>validConfig({...v2,axles:{rear:{center:[0,1,4],axis:'y'}}}),/Invalid rear axle axis/);
assert.throws(()=>validConfig({...v2,units:'pixels'}),/Unexpected coordinate units/);
console.log('Axle pivot math + v1/v2 JSON validation PASS');

const inventory=fs.readFileSync('labs/asset-list.php','utf8');
assert.match(inventory,/'vehicles'\s*=>\s*'vehicles'/,'Asset inventory must expose vehicle directory');
const deploy=fs.readFileSync('scripts/prepare_incremental_deploy.py','utf8');
assert.ok(deploy.includes('"labs/vehicle-animation-lab.html"'),'Lab must be included in production deploy');
for(const path of ['("Assets/vehicles", "*.fbx")','("Assets/vehicles", "*.glb")']){
  assert.ok(deploy.includes(path),'Production deploy missing '+path);
}
const preview=fs.readFileSync('.github/workflows/deploy-50webs-preview.yml','utf8');
assert.ok(preview.includes('labs/vehicle-animation-lab.html'),'Branch preview missing vehicle page');
// Current previews use a git-diff asset overlay rather than the old list-copy command.
assert.ok(preview.includes('scripts/prepare_preview_asset_overlay.py'),
  'Branch preview must stage changed assets via the overlay generator');
assert.ok(preview.includes('cp .preview/asset-overlay.htaccess .preview/Assets/.htaccess'),
  'Branch preview must install the production fallback rewrite');
const assetOverlay=fs.readFileSync('scripts/prepare_preview_asset_overlay.py','utf8');
assert.ok(assetOverlay.includes('"vehicles": {".fbx", ".glb"}'),
  'Branch preview asset overlay must include vehicle FBX/GLB files');
assert.ok(assetOverlay.includes('soldiers|animations|weapons|vehicles|effects|terrain'),
  'Branch preview fallback must serve unchanged vehicle models from production');
console.log('Vehicle lab static validation: script syntax, control IDs, hierarchy names, seat persistence, animation import, and deployment paths PASS');
