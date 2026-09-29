#!/usr/bin/env node
'use strict';
/* Impact FX: material bursts, decal sheets (world decals thin-instanced per sheet cell, wound decals
   parented to the bone that was hit), budgets, expiry and restart cleanup, and that none of it
   touches the combat RNG. Babylon is stubbed down to what the module calls. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const repo=path.resolve(__dirname,'../..'),hooks={};
class Vector3{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}copyFrom(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}}
class Quaternion{constructor(x=0,y=0,z=0,w=1){Object.assign(this,{x,y,z,w});}}
class Color3{constructor(r,g,b){Object.assign(this,{r,g,b});}static Black(){return new Color3(0,0,0);}}
class Color4 extends Color3{constructor(r,g,b,a){super(r,g,b);this.a=a;}}
class Resource{constructor(name){this.name=name;}dispose(){this.disposed=true;}isDisposed(){return!!this.disposed;}}
class ParticleSystem extends Resource{dispose(disposeTexture=true){super.dispose();if(disposeTexture)this.particleTexture.dispose();}start(){this.started=true;}}
class Mesh extends Resource{
  constructor(name){super(name);this.enabled=true;this.position=new Vector3();this.scaling=new Vector3(1,1,1);this.parent=null;this.instances=0;}
  setEnabled(v){this.enabled=v;}thinInstanceSetBuffer(kind,buf,stride){this.instances=buf?buf.length/stride:0;this.buffer=buf;}
  setParent(node){this.parent=node;}
}
class VertexData{applyToMesh(mesh){mesh.uvs=this.uvs;mesh.vertices=this.positions;}}
class Matrix{static FromArray(a){const m=new Matrix();m.m=a;return m;}decompose(s,q,p){s.x=Math.hypot(this.m[0],this.m[1],this.m[2]);s.y=Math.hypot(this.m[4],this.m[5],this.m[6]);s.z=1;p.x=this.m[12];p.y=this.m[13];p.z=this.m[14];}}
const B={Vector3,Quaternion,Color3,Color4,ParticleSystem,VertexData,Mesh,Matrix,StandardMaterial:Resource,
  Texture:class extends Resource{constructor(url){super(url);this.url=url;}},
  RawTexture:{CreateRGBATexture(){return new Resource('particle texture');}}};
B.Texture.BILINEAR_SAMPLINGMODE=2;
const r={console:{log(){},warn(){}},BABYLON:B,BattleModules:{registerSystem(id,h){hooks[id]=h;}},BattleSim:{start(){}}};r.window=r;vm.createContext(r);
function load(file){vm.runInContext(fs.readFileSync(path.join(repo,file),'utf8'),r,{filename:file});}
load('battle/modules/15-bullet-impact-fx.js');
const fx=r.BattleImpactFx,observable=()=>({add(){return{};},addOnce(){},remove(){}});
const sim={time:0,scene:{metadata:{},onBeforeRenderObservable:observable(),onDisposeObservable:observable()},heightAt:(x,z)=>x*.03+z*.02,random(){throw Error('Effects consumed the battle RNG');}};
let callbacks=0;sim.onShot=()=>callbacks++;fx.install(sim);fx.install(sim);
function shot(surface,blocker){return{mode:'raycast',surface,blocker,stoppedBy:'environment',impact:{x:2,y:1,z:3},normal:{x:-1,y:0,z:0},direction:{x:1,y:0,z:0}};}
function cells(){return Object.values(sim._impactFx.cells);}
function instances(sheet,row){return cells().filter(c=>c.sheet===sheet&&(row==null||c.row===row)).reduce((a,c)=>a+c.mesh.instances,0);}
const SH=fx.sheets;

sim.onShot(null,null,false,10,shot('dirt','ground'));
sim.onShot(null,null,false,10,shot('cement','wall'));
sim.onShot(null,null,false,10,shot('steel','obstacle'));
sim.onShot(null,null,false,10,shot('hedge','obstacle'));
sim.onShot(null,null,false,10,shot('tree','obstacle'));
assert.equal(callbacks,5,'shot callbacks chain exactly once');
fx.tick(sim);
assert.deepEqual(Array.from(sim._impactFx.bursts,b=>b.system.name),['impact-dirt','impact-cement','impact-metal','impact-vegetation','impact-vegetation']);
assert.equal(instances('holes',SH.holes.rows.dirt),1,'ground strike leaves a dirt hole');
assert.equal(instances('holes',SH.holes.rows.masonry),1,'wall strike leaves a masonry hole');
assert.equal(instances('holes',SH.holes.rows.metal),1,'metal strike leaves a dent');
assert.equal(instances('holes',SH.holes.rows.wood),1,'a tree takes a splintered hole, a hedge none');
assert.equal(sim._impactFx.decals.length,4);
console.log('PASS impact materials and hole kinds per surface; hedges leave no hole');

/* Decals sit on the surface: ground ones on the terrain under the strike, wall ones on the wall
   face (half the wall's thickness out from the navigation centre line), both facing out. */
const byKind=k=>sim._impactFx.decals.filter(d=>d.kind===k)[0].matrix;
const dirt=byKind('dirt');assert.ok(Math.abs(dirt[13]-sim.heightAt(dirt[12],dirt[14]))<.03,'ground decal sits on the sloped terrain');
assert.ok(dirt[9]>.99,'ground decal faces up the terrain normal');
const masonry=byKind('masonry');assert.ok(Math.abs(masonry[12]-(2-.165-.012))<1e-6,'wall decal is on the wall face');
assert.ok(Math.abs(masonry[8]+1)<1e-6,'wall decal faces the shooter');
console.log('PASS decals follow terrain and sit on the wall face');

/* Cells address the sheet by grid position, independent of the image resolution. */
const uv=fx.cellUV('holes',2,3);assert.deepEqual([uv.u0,uv.u1,uv.v0,uv.v1],[.75,1,.25,.5]);
assert.ok(cells().every(c=>/effects\/decals\/(blood|bullet-holes)\.png$/.test(c.mesh.material.diffuseTexture.url)));
console.log('PASS sheet cells are grid-addressed and load from Assets/effects/decals');

/* A body hit: a wound decal on the bone that was hit and a splash under him. A round that went
   through (shot.passes[i].exit) adds an exit wound on the far side and a spray along its path, and
   strikes the next man and then whatever stopped it (shot.final). */
const bone=(x,y)=>({getAbsolutePosition:()=>new Vector3(x,y,0),computeWorldMatrix(){},isDisposed:()=>false});
const head=bone(5,1.6),chest=bone(5,1.3),chest2=bone(7,1.3);
const victim={root:{position:{x:5,y:0,z:0}},rig:{head,chest}},behind={root:{position:{x:7,y:0,z:0}},rig:{chest:chest2}};
const X={x:1,y:0,z:0};
function pass(v,zone,x,exit){return{victim:v,zone,entry:{x:x-.3,y:1.35,z:0},exit:exit?{x:x+.3,y:1.35,z:0}:null,direction:X,exitDirection:exit?X:undefined};}
function bodyShot(passes,final){return{mode:'raycast',stoppedBy:'soldier',surface:'blood',victim:passes[0].victim,zone:passes[0].zone,impact:passes[0].entry,normal:{x:-1,y:0,z:0},direction:X,delay:0,passes,final:final||null};}
fx.clear(sim);
sim.onShot(null,victim,true,10,bodyShot([pass(victim,'chest',5,false)]));fx.tick(sim);
assert.equal(sim._impactFx.body.length,1);assert.equal(sim._impactFx.body[0].mesh.parent,chest,'wound rides the chest bone');
assert.ok(sim._impactFx.body[0].mesh.position.x<5,'entry wound is on the side facing the shooter');
assert.equal(instances('blood',SH.blood.rows.pool),1,'splash under the hit');
assert.equal(instances('blood',SH.blood.rows.spray),0,'a round that stopped in him throws no exit spray');
fx.clear(sim);
const wallEnd={impact:{x:9,y:1.3,z:0},stoppedBy:'environment',blocker:'wall',surface:'cement',normal:{x:-1,y:0,z:0},direction:X};
sim.onShot(null,victim,true,10,bodyShot([pass(victim,'chest',5,true),pass(behind,'chest',7,false)]));
sim.onShot(null,victim,true,10,bodyShot([pass(victim,'head',5,true)],wallEnd));fx.tick(sim);
const exits=sim._impactFx.body.filter(b=>b.exit);
assert.equal(exits.length,2,'an exit wound for each round that came out');
assert.ok(exits.every(b=>b.mesh.position.x>5),'exit wounds are on the far side');
assert.ok(sim._impactFx.body.some(b=>b.mesh.parent===chest2),'the man behind is wounded too');
assert.equal(instances('blood',SH.blood.rows.spray),2,'exit sprays');
assert.ok(sim._impactFx.decals.filter(d=>d.kind==='spray').every(d=>d.matrix[12]>5),'sprays land beyond the exit');
assert.equal(instances('holes',SH.holes.rows.masonry),1,'the spent round holes the wall behind');
for(let i=0;i<10;i++)sim.onShot(null,victim,true,10,bodyShot([pass(victim,'chest',5,true)]));
assert.equal(sim._impactFx.body.filter(b=>b.soldier===victim).length,6,'wound decals per soldier are capped');
console.log('PASS entry and exit wounds ride the hit bone; the next man; splash, exit spray and the final strike');
/* FBX path: wound centre is the actual skin anchor, not a zone-radius guess, and it moves when
   the skinned vertex moves without becoming a child of a bone. */
fx.clear(sim);
let skinX=5,skinSamples=0;
r.BattleFbxSoldier={
  skinAnchor(v,p){return{victim:v,hit:{x:p.x,y:p.y,z:p.z}};},
  skinSample(a,p,n){skinSamples++;p.x=skinX;p.y=1.31;p.z=.04;n.x=-1;n.y=0;n.z=0;return true;},
  boneNode(){throw Error('skin anchor should win over the bone fallback');}
};
sim.onShot(null,victim,true,10,bodyShot([pass(victim,'chest',5,false)]));fx.tick(sim);
const skinned=sim._impactFx.body[0];
assert.ok(skinned.skin,'FBX wound stores a skin anchor');
assert.equal(skinned.mesh.parent,null,'skinned wound is not bone-parented');
assert.ok(Math.abs(skinned.mesh.position.x-(skinX-.012))<1e-6,'wound sits just outside the sampled skin');
skinX=5.18;fx.refreshBody(sim);
assert.ok(Math.abs(skinned.mesh.position.x-(skinX-.012))<1e-6,'wound follows the same skin vertex after deformation');
assert.ok(skinSamples>=2,'skin anchor is resampled after creation');
delete r.BattleFbxSoldier;
console.log('PASS FBX skinned-quad fallback locks to and follows the sampled surface');

/* Preferred FBX path: a body hit paints the soldier mesh's private UV map and creates no wound
   quad. Multiple marks reuse one renderer, and restart clears that map without disposing the body. */
fx.clear(sim);
const uvMesh=new Mesh('fbx-body'),uvRenderer={clears:0,clear(){this.clears++;}},painted=[];
r.BattleFbxSoldier={
  skinAnchor(v,p){return{victim:v,mesh:uvMesh,hit:{x:p.x,y:p.y,z:p.z}};},
  paintSurfaceWound(anchor,stamp,out,size,roll){
    painted.push({anchor,stamp,out,size,roll});
    return{mesh:uvMesh,renderer:uvRenderer,position:new Vector3(5,1.31,.04),normal:new Vector3(-1,0,0),resolution:512};
  },
  boneNode(){throw Error('UV paint should win over every quad/bone fallback');}
};
sim.onShot(null,victim,true,10,bodyShot([pass(victim,'chest',5,false)]));fx.tick(sim);
let uvWound=sim._impactFx.body[0];
assert.equal(painted.length,1,'body hit paints once into UV space');
assert.equal(uvWound.uv,true,'wound event records UV mode');
assert.equal(uvWound.mesh,uvMesh,'UV wound belongs to the actual soldier mesh');
assert.equal(uvWound.renderer,uvRenderer,'UV wound records the private map');
assert.equal(uvWound.resolution,512,'UV map resolution is reported');
assert.equal(sim._impactFx.surfaceMaps.length,1,'private map is tracked once for cleanup');
sim.onShot(null,victim,true,10,bodyShot([pass(victim,'chest',5,true)]));fx.tick(sim);
assert.equal(painted.length,3,'entry plus exit accumulate into the same soldier map');
assert.equal(sim._impactFx.surfaceMaps.length,1,'repeated wounds reuse one tracked renderer');
fx.clear(sim);
assert.equal(uvRenderer.clears,1,'restart/clear wipes persistent UV paint');
assert.ok(!uvMesh.disposed,'clearing damage never disposes the soldier body mesh');
delete r.BattleFbxSoldier;
console.log('PASS FBX body wounds accumulate in one private UV map and clear without body disposal');


/* Budgets, expiry, restart. */
const texture=sim._impactFx.texture;
for(let i=0;i<500;i++)fx.impact(sim,shot('cement','wall'));
fx.tick(sim);
assert.equal(sim._impactFx.bursts.length,fx.maxBursts);assert.equal(sim._impactFx.decals.length,fx.maxDecals);
assert.equal(cells().reduce((a,c)=>a+c.mesh.instances,0),fx.maxDecals,'thin instances match the live decals');
assert.ok(!texture.disposed,'eviction preserves shared particle texture');
sim.time=fx.decalLife+1;fx.tick(sim);assert.equal(sim._impactFx.bursts.length,0);assert.equal(sim._impactFx.decals.length,0,'old decals expire');
assert.equal(cells().reduce((a,c)=>a+c.mesh.instances,0),0);
sim.scene.metadata.battleScenario={buildings:[{x:2,z:3,w:10,d:10,rot:.4}]};
fx.impact(sim,shot('dirt','ground'));
assert.ok(sim._impactFx.decals[0].matrix[13]>=sim.heightAt(2,3)+.08,'indoor strikes sit on the floor slab');
sim.onSuppressiveShot(null,{x:30,z:30},1,6);
assert.ok(sim._impactFx.decals.length>1,'suppressive bursts kick up dirt strikes');
/* Restart cleanup owns its own body fixture; do not depend on a wound leaked by an earlier test. */
sim.onShot(null,victim,true,10,bodyShot([pass(victim,'chest',5,false)]));fx.tick(sim);
const liveBurst=sim._impactFx.bursts[0].system,liveBody=sim._impactFx.body[0].mesh;
hooks['bullet-impact-fx'].beforeBattleRestart(sim);
assert.ok(liveBurst.disposed&&liveBody.disposed);
assert.equal(sim._impactFx.bursts.length+sim._impactFx.decals.length+sim._impactFx.body.length,0);
assert.equal(cells().reduce((a,c)=>a+c.mesh.instances,0),0,'restart clears every thin instance');
console.log('PASS resource budgets, expiry, floor slabs, suppression strikes and restart cleanup');

// The ballistic result supplies the actual victim and blocking material; FX never guess from
// the intended target. Zero angular dispersion makes these geometry checks deterministic.
r.SquadAI={stanceOf:()=> 'stand',eyeHeight:()=>1.55,isMachineGun:s=>!!(s&&s.weapon&&s.weapon.kind==='lmg')};
load('battle/obstacle-field.js');load('battle/modules/14-z-ballistic-raycast.js');
function unit(x){return{root:{position:{x,y:0,z:0},rotation:{y:0}},hp:100,faction:'ge'};}
const shooter=unit(0);shooter.faction='us';shooter.weapon={stats:{range:90,accuracy:.98,falloffStart:90,damage:10}};
function resolve(obstacles,enemies,ground=()=>0){
  let result;const target=unit(30),battle={time:1,obstacles,heightAt:ground,random:()=>.25,rosterOf:()=>enemies,onShot(a,b,hit,d,meta){result=meta;},killSoldier(s){s.dead=true;}};
  r.BattleBallistics.resolve(shooter,target,battle);return result;
}
const nearer=unit(10),body=resolve([], [nearer]);assert.equal(body.victim,nearer);assert.equal(body.surface,'blood');assert.equal(body.stoppedBy,'soldier');
for(const type of ['hedge','rock','steel']){
  const hit=resolve([{x:15,z:0,y:0,height:3,radius:1,type}],[]);
  assert.equal(hit.stoppedBy,'environment');assert.equal(hit.surface,type);assert.ok(Number.isFinite(hit.normal.x));
}
const ground=resolve([],[],x=>x>40?3:0);assert.equal(ground.surface,'dirt');assert.equal(ground.stoppedBy,'environment');
shooter.weapon.stats.range=40;const miss=resolve([],[]);assert.equal(miss.stoppedBy,'range');shooter.weapon.stats.range=90;
r.BattleNavigation={lineOfSightBlocked(a,b){return b.x>=20?{a:{x:20,z:-5},b:{x:20,z:5}}:null;}};
const wall=resolve([],[]);assert.equal(wall.surface,'cement');assert.equal(wall.stoppedBy,'environment');assert.ok(wall.normal.x<0);
console.log('PASS ballistic body, ground, wall, vegetation and metal impact metadata; range misses');
