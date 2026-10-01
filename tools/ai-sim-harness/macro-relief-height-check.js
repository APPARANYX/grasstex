#!/usr/bin/env node
'use strict';
/* Macro relief must expose the exact triangle surface the renderer draws. If LOS re-evaluates the
   smooth hill formula between mesh vertices, a visible crest can sit above a supposedly clear ray. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../../battle/modules/46-macro-relief.js'),'utf8');
function hashSeed(s){s=String(s==null?'default':s);let h=(1779033703^s.length)>>>0;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=(h<<13|h>>>19)>>>0;}h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return(h^h>>>16)>>>0;}
const scenario={id:'mesh-test',seed:'mesh-test',terrain:{roughness:.4}},cols=9,rows=7,x0=-600,z0=450,dx=150,dz=150;
const positions=[];
for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)positions.push(x0+i*dx,0,z0-j*dz);
const ground={
  pos:positions,
  getVerticesData(){return this.pos;},
  updateVerticesData(kind,data){if(kind==='position')this.pos=data;},
  getIndices(){return[];},
  refreshBoundingInfo(){}
};
const root={
  BattleScenarioGenerator:{current:()=>scenario,hashSeed},
  BattleSim:{
    heightAt:()=>0,
    buildTerrain:()=>ground,
    applyScenarioTerrain:()=>ground,
    start:()=>({_roster:{us:[],ge:[]}})
  },
  BABYLON:{
    VertexBuffer:{PositionKind:'position',NormalKind:'normal'},
    VertexData:{ComputeNormals(){}}
  }
};
new Function('window','globalThis','console','BABYLON',src)(root,root,{log(){},warn(){}},root.BABYLON);
root.BattleSim.buildTerrain({});
function meshAt(x,z){
  const fc=(x-x0)/dx,i=Math.floor(fc),u=fc-i,fr=(z0-z)/dz,j=Math.floor(fr),v=fr-j,k=i+j*cols,h=ground.pos;
  const C=h[k*3+1],B=h[(k+1)*3+1],D=h[(k+cols)*3+1],A=h[(k+cols+1)*3+1];
  return u>=v?C+u*(B-C)+v*(A-B):C+v*(D-C)+u*(A-D);
}
for(const [x,z] of [[-517,367],[-331,128],[-74,-88],[211,244],[487,-311]]){
  const got=root.BattleSim.heightAt(x,z),want=meshAt(x,z);
  assert.ok(Math.abs(got-want)<1e-5,`${x},${z}: runtime ${got}, rendered ${want}`);
}
assert.equal(root.BattleMacroRelief.version,'1.1-mesh-authoritative');
console.log('PASS macro relief LOS/ballistics height samples the rendered terrain triangles');
