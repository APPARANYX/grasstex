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

/* A body hit: a wound decal on the bone that was hit, a splash under him and, for a full-power
   round through the torso, an exit spray on the ground behind him. */
const head={getAbsolutePosition:()=>new Vector3(5,1.6,0),computeWorldMatrix(){},isDisposed:()=>false};
const chest={getAbsolutePosition:()=>new Vector3(5,1.3,0),computeWorldMatrix(){},isDisposed:()=>false};
const victim={root:{position:{x:5,y:0,z:0}},rig:{head,chest}};
const rifleman={weapon:{stats:{power:1}}},pistol={weapon:{stats:{power:.5}}};
function bodyShot(zone,shooter){return{mode:'raycast',stoppedBy:'soldier',surface:'blood',victim,zone,impact:{x:4.7,y:1.35,z:0},normal:{x:-1,y:0,z:0},direction:{x:1,y:0,z:0},delay:0,_shooter:shooter};}
fx.clear(sim);
sim.onShot(rifleman,victim,true,10,bodyShot('chest',rifleman));fx.tick(sim);
assert.equal(sim._impactFx.body.length,1);assert.equal(sim._impactFx.body[0].mesh.parent,chest,'wound rides the chest bone');
assert.ok(sim._impactFx.body[0].mesh.position.x<5,'wound decal is on the side facing the shooter');
assert.equal(instances('blood',SH.blood.rows.pool),1,'splash under the hit');
assert.equal(instances('blood',SH.blood.rows.spray),1,'a rifle round through the chest leaves an exit spray');
const spray=byKind('spray');assert.ok(spray[12]>4.7,'exit spray lands behind him');
sim.onShot(pistol,victim,true,10,bodyShot('head',pistol));fx.tick(sim);
assert.equal(sim._impactFx.body[1].mesh.parent,head,'a head hit rides the head');
assert.equal(instances('blood',SH.blood.rows.spray),1,'a pistol round does not throw an exit spray');
for(let i=0;i<10;i++)sim.onShot(rifleman,victim,true,10,bodyShot('chest',rifleman));
assert.equal(sim._impactFx.body.length,6,'wound decals per soldier are capped');
console.log('PASS wound decals ride the hit bone; ground splash and exit spray');

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
const liveBurst=sim._impactFx.bursts[0].system,liveBody=sim._impactFx.body[0].mesh;
hooks['bullet-impact-fx'].beforeBattleRestart(sim);
assert.ok(liveBurst.disposed&&liveBody.disposed);
assert.equal(sim._impactFx.bursts.length+sim._impactFx.decals.length+sim._impactFx.body.length,0);
assert.equal(cells().reduce((a,c)=>a+c.mesh.instances,0),0,'restart clears every thin instance');
console.log('PASS resource budgets, expiry, floor slabs, suppression strikes and restart cleanup');

// The ballistic result supplies the actual victim and blocking material; FX never guess from
// the intended target. Zero angular dispersion makes these geometry checks deterministic.
r.SquadAI={stanceOf:()=> 'stand',eyeHeight:()=>1.55};
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
