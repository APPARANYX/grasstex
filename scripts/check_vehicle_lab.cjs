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
  assert.match(file,/Truck.*\\.fbx$/,'Truck pose must be discoverable by the lab filename filter');
}
assert.match(scripts[0],/function suggestSeatPoses\\(/,'Driver and passenger pose suggestion missing');
const inventory=fs.readFileSync('labs/asset-list.php','utf8');
assert.match(inventory,/'vehicles'\s*=>\s*'vehicles'/,'Asset inventory must expose vehicle directory');
const deploy=fs.readFileSync('scripts/prepare_incremental_deploy.py','utf8');
assert.ok(deploy.includes('"labs/vehicle-animation-lab.html"'),'Lab must be included in production deploy');
for(const path of ['("Assets/vehicles", "*.fbx")','("Assets/vehicles", "*.glb")']){
  assert.ok(deploy.includes(path),'Production deploy missing '+path);
}
const preview=fs.readFileSync('.github/workflows/deploy-50webs-preview.yml','utf8');
assert.ok(preview.includes('labs/vehicle-animation-lab.html'),'Branch preview missing vehicle page');
assert.ok(preview.includes('soldiers animations weapons vehicles'),'Branch preview missing vehicle FBX models');
console.log('Vehicle lab static validation: script syntax, control IDs, hierarchy names, seat persistence, animation import, and deployment paths PASS');
