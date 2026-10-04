/* Headless harness for the battle AI.

   obstacle-field.js, squad-ai.js, engagement.js and the squad-level modules are all deliberately
   free of Babylon, so the real decision code can be exercised in node. Only two things are
   reimplemented here:

     - a minimal BABYLON stub, just enough for weapons.js to hand over the real weapon stats
       instead of the harness inventing its own numbers;
     - a movement integrator that mirrors stepMovement() in battle-sim.js (speed ramp, crouch and
       crawl speed factors, turn rates, prone cannot walk). If that function changes, change this.

   Everything else - perception, engagement states, stances, fire gating, squad orders - is the
   shipping code. */
'use strict';
const fs=require('fs');
const path=require('path');
const REPO=path.resolve(__dirname,'..','..');

function stubBabylon(root){
  function Color3(r,g,b){this.r=r;this.g=g;this.b=b;}
  Color3.Black=function(){return new Color3(0,0,0);};
  function mesh(){
    return{
      position:{x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;}},
      rotation:{x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;}},
      scaling:{x:1,y:1,z:1,set(){}},
      material:null,isPickable:true,parent:null,
      bakeCurrentTransformIntoVertices(){return this;},
      getTotalVertices(){return 8;},
      setVerticesData(){return this;},
      dispose(){}
    };
  }
  root.BABYLON={
    Color3:Color3,
    VertexBuffer:{ColorKind:'color',PositionKind:'position',NormalKind:'normal'},
    MeshBuilder:{CreateBox:mesh,CreateCylinder:mesh,CreateSphere:mesh,CreateLines:mesh,CreateGround:mesh},
    Mesh:{MergeMeshes(){return mesh();}},
    StandardMaterial:function(){this.specularColor=null;this.ambientColor=null;this.getScene=function(){return null;};this.dispose=function(){};},
    getScene(){return null;}
  };
}

function load(root,rel){
  const code=fs.readFileSync(path.join(REPO,rel),'utf8');
  /* A module sees the global `location` (some checks set one before bootstrapping) unless the bootstrap was given {search}. */
  if(root.location)new Function('window','globalThis','console','BABYLON','location',code+'\n//# sourceURL='+rel)(root,root,console,root.BABYLON,root.location);
  else new Function('window','globalThis','console','BABYLON',code+'\n//# sourceURL='+rel)(root,root,console,root.BABYLON);
}
function seededRandom(seed){
  let a=seed>>>0;
  return function(){
    a=(a+0x6D2B79F5)|0;
    let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return((t^t>>>14)>>>0)/4294967296;
  };
}
function withSeededRandom(seed,fn){const real=Math.random;Math.random=seededRandom(seed);try{return fn();}finally{Math.random=real;}}

function bootstrap(opts){
  opts=opts||{};
  const root={};root.window=root;stubBabylon(root);
  /* {search:'?morale=0'} gives every module a `location` with that query, as the page has; absent, there is none (every flag at its default). */
  if(opts.search!=null)root.location={search:opts.search};
  load(root,'battle/weapons.js');load(root,'battle/obstacle-field.js');load(root,'battle/squad-ai.js');load(root,'battle/engagement.js');
  if(opts.modules!==false){
    root.BattleModules={registerSystem(){},registerUnitType(){},registerObjectiveType(){},runHook(){},unitsFor(){return[];}};
    /* Soldier stats (module 10) are opt-in here: {stats:true}. Absent, every reader gets 1 and the checks keep testing the flat constants. */
    if(opts.stats)load(root,'battle/modules/10-soldier-stats.js');
    /* One squad-command owner replaces the old stability/plan/command-lock/regroup stack. */
    load(root,'battle/modules/16-squad-plan-stability.js');
    /* The wound model owns what a hit does (hit zone, incapacitation, bleeding). */
    load(root,'battle/modules/14-wound-model.js');
    /* Soldier condition: stress from fire, wounds and casualties, read by Engagement and the shot model. */
    load(root,'battle/modules/08-soldier-events.js');
    load(root,'battle/modules/17-soldier-mind.js');
    /* Behavior-neutral command receipt/adoption telemetry; later phases may gate on it. */
    load(root,'battle/modules/18-command-reception.js');
    /* Tactical callouts (`?callouts=1`): inert unless the flag is on. */
    load(root,'battle/modules/09-tactical-callouts.js');
  }
  return root;
}

function vec(x,y,z){return{x:x,y:y,z:z,set(a,b,c){this.x=a;this.y=b;this.z=c;}};}
function makeBattle(root,opts){
  opts=opts||{};let seed=opts.seed||12345;
  const battle={
    time:0,obstacles:opts.obstacles||[],heightAt:opts.heightAt||function(){return 0;},_movementRoot:root,
    _roster:{us:[],ge:[]},factions:{us:{alive:0,kills:0,squads:[]},ge:{alive:0,kills:0,squads:[]}},
    events:{fired:0,hits:0,kills:0,suppressiveShots:0,suppressed:0,callouts:[]},
    rosterOf(f){return this._roster[f];},random(){seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;},
    killSoldier(s,killer){if(s.dead)return;s.dead=true;s.hp=0;s.target=null;this.factions[s.faction].alive--;if(killer)this.factions[killer.faction].kills++;this.events.kills++;},
    onFire(){battle.events.fired++;},onShot(shooter,target,hit){if(hit)battle.events.hits++;},onSuppressiveShot(shooter,point,count){battle.events.suppressiveShots++;battle.events.suppressed+=count||0;},onCallout(s,type){battle.events.callouts.push(type);}
  };
  return battle;
}

let nextId=0;
function resetIds(){nextId=0;}
function addSquad(root,battle,opts){
  const SquadAI=root.SquadAI;
  const squad=SquadAI.createSquad(opts.id,opts.faction,{x:opts.x,z:opts.z},{x:opts.objective.x,z:opts.objective.z});
  const composition=opts.composition||SquadAI.COMPOSITION;
  withSeededRandom((opts.seed||7331)+composition.length,function(){
    composition.forEach(function(role,slot){
      const jx=opts.x+((slot%5)-2)*2.5,jz=opts.z+(Math.floor(slot/5)-1)*2.5;
      const model={root:{position:vec(jx,battle.heightAt(jx,jz),jz),rotation:{x:0,y:opts.facing==null?0:opts.facing,z:0}}};
      const deal=SquadAI.dealLoadout(null,{},role,opts.faction);
      const soldier=SquadAI.createSoldier({id:nextId++,faction:opts.faction,role:role,squad:squad,slotIndex:slot,model:model,weapon:deal.weapon,secondary:deal.secondary});
      SquadAI.setFireCooldown(soldier,0);squad.members.push(soldier);battle._roster[opts.faction].push(soldier);battle.factions[opts.faction].alive++;
    });
  });
  battle.factions[opts.faction].squads.push(squad);return squad;
}

// Keep execution identical to battle-sim.js; tests can supply navigation via battle._movementRoot.
const movementSource=fs.readFileSync(path.join(REPO,'battle/battle-sim.js'),'utf8');
const movementBody=movementSource.slice(movementSource.indexOf('  function stepMovement('),movementSource.indexOf('  BattleSim.prototype._frame='));
const movementFactory=new Function('root','BattleSoldierModel','steerAroundObstacles','NAV_REPLAN_HOLD','STEER_LEG',movementBody+';return stepMovement;');
const movementModel={animateWalk(){}};
const defaultMovementRoot={}, movementCache=new WeakMap();
function stepMovement(battle,s,dt){
  const root=battle._movementRoot||defaultMovementRoot;
  if(!movementCache.has(root))movementCache.set(root,movementFactory(root,movementModel,()=>null,1.5,true));
  movementCache.get(root)(battle,s,dt);
}

const AI_TICK=.15;
function run(root,battle,seconds,onTick){
  const SquadAI=root.SquadAI;let elapsed=0;
  while(elapsed<seconds){
    battle.time+=AI_TICK;elapsed+=AI_TICK;
    ['us','ge'].forEach(function(f){battle._roster[f].forEach(function(s){stepMovement(battle,s,AI_TICK);});});
    ['us','ge'].forEach(function(f){battle.factions[f].squads.forEach(function(sq){SquadAI.updateSquad(sq,battle);});});
    ['us','ge'].forEach(function(f){battle._roster[f].forEach(function(s){SquadAI.updateSoldier(s,battle);});});
    if(onTick)onTick(battle);
  }
}
module.exports={bootstrap,makeBattle,addSquad,run,stepMovement,vec,resetIds,seededRandom,withSeededRandom,AI_TICK,REPO};
