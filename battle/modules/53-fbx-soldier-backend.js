/* Imported FBX soldier backend.
   Soldiers render as the rigged FBX character (Assets/soldiers) driven by the shared Mixamo rifle
   clips (Assets/animations). Both are read with Babylon's FBX loader, the same import path as the
   FBX Motion Lab. Clip channels bind to canonical bone names. Models whose imported rest pose
   differs from the source animation rig are retargeted once per model at page load; matching rigs
   reuse the converted clip data directly.

   Conversion (convertClip) runs offline into the prepared clip pack, and at load only for a clip
   the pack lacks (see "prepared clips" below): each clip keeps only channels for bones
   the model has (the loader's `__fbx_inheritScale` helper nodes duplicate their parent and are
   dropped), is resampled at 30 fps, and looping clips have their horizontal hips travel removed so
   navigation stays the sole owner of world position. The removed travel becomes the clip's natural
   ground speed, which sets playback rate so feet do not skate.

   Gameplay still owns *why* (stance, movement, target, reload, fire, death arrive as the usual
   soldier fields and animation tags). This backend owns *how*: a lower layer plays the stance and
   locomotion clip for the whole body, and an upper overlay (spine, arms, head) plays aim, fire or
   reload on top. Both cross-fade. Clip clocks advance on simulation time in update(); poses are
   written once per rendered frame, so a paused or headless sim pays nothing for them.

   In the game every soldier wears his FBX model on a bare body (BattleSoldierModel.createBody), and
   the page waits for the assets or reports a load failure. The procedural rig in soldier.js is only
   the body used while imported animation is disabled (trainer and headless benchmark matches). */
(function(root){
'use strict';
if(typeof BABYLON==='undefined'||!root.BattleSoldierModel||!root.BattleFbxClips||root.BattleFbxSoldier)return;

var M=root.BattleSoldierModel,TAGS=M.TAGS,Q=BABYLON.Quaternion,V3=BABYLON.Vector3,MX=BABYLON.Matrix;
var BACKEND='fbx-skeletal-v1',FPS=30;
/* Models per faction and role; `default` covers the roles with no model of their own (riflemen,
   and any role whose model is not made yet). `?soldiers=rifleman` shows the earlier riflemen. */
var MODEL_SETS={
  paratrooper:{
    us:{default:'us-paratrooper.fbx',sergeant:'us-captain.fbx',scout:'us-scout.fbx',
        engineer:'us-engineer.fbx',gunner:'us-gunner.fbx'},
    ge:{default:'ge-paratrooper.fbx',sergeant:'ge-captain.fbx',scout:'ge-scout.fbx',
        engineer:'ge-engineer.fbx',gunner:'ge-gunner.fbx'}
  },
  rifleman:{us:{default:'us-rifleman-rigged.fbx'},ge:{default:'ge-rifleman-rigged.fbx'}}
};
var MODEL_SET=(typeof location!=='undefined'&&/[?&]soldiers=rifleman\b/.test(location.search||''))?'rifleman':'paratrooper';
var MODELS=MODEL_SETS[MODEL_SET];
/* Faction weapons (Assets/weapons, prepared by tools/prepare-weapon-model.py) replace the box
   weapons. The model is the one whose numbers the soldier fires with: BattleWeapons.PROFILES
   names it per side and kind (`model`, the FBX basename), so what he carries and how it shoots
   cannot disagree. The prepared layout puts the butt plate WEAPON_BUTT metres behind the grip
   origin (pistols: the back of the frame, PISTOL_BUTT), barrel along +Z, so the hand calibration holds. */
var WEAPON_BUTT=.40,PISTOL_BUTT=.06;
function weaponProfiles(){return (root.BattleWeapons&&root.BattleWeapons.PROFILES)||{};}
function weaponFiles(f,kind){var p=weaponProfiles()[f],m=p&&p[kind]&&p[kind].model;return m?[m+'.fbx']:[];}
/* Machine guns also come with the bipod deployed; that copy replaces the folded one while the gunner
   is settled prone. Same layout (grip, fore-end, muzzle), only the legs differ. */
var WEAPON_BIPOD={'m1919a6.fbx':'m1919a6-bipod.fbx','mg42.fbx':'mg42-bipod.fbx'};

/* key -> [clip file, loops(, 'turn')]: the clip table lives in 53-fbx-clip-table.js, shared with
   the Motion Lab so it can list exactly the clips the game plays. */
var CLIPS=root.BattleFbxClips.clips;
var IDLE_VARIANTS=['idle','idleLook','idleTwoHand','idleFidget'],FLINCH_RATE=1.6;
var DEATH_POOLS={
  front:['deathFront','deathBackHeadKnees','deathBackOneKnee','deathChestKnees'],
  back:['deathBack','deathHitGround','deathHeadKnees','deathFrontHeadKnees'],
  side:['deathSide','deathChestKnees'],crouch:['deathCrouch','deathCrouched'],prone:['deathProne'],running:['deathRunning']
};

/* Right-hand grip point in each weapon mesh's local space (metres), as in soldier.js GRIPS. */
var GRIP={rifle:[0,-.055,-.12],carbine:[0,-.055,-.09],smg:[0,-.055,-.09],lmg:[0,-.07,-.02],pistol:[.02,-.07,0]};
/* Weapon reference points in local metres after prepareWeapon (barrel +Z). `trigger` is the
   centre of the visible trigger/guard, measured from the prepared mesh's side profile. The
   right palm sits behind it at `grip`, over the stock wrist or pistol grip, not on the trigger
   itself; `fore` records the support hand's fore-end range. */
var WEAPON_POINTS={
  'm1-garand.fbx':{trigger:[0,-.08,-.03],grip:[0,-.065,-.06],fore:[0,-.025,.06,.42]},
  'kar98k.fbx':{trigger:[0,-.08,-.035],grip:[0,-.05,-.06],fore:[0,-.01,.06,.45]},
  'mg42.fbx':{trigger:[0,-.08,-.025],grip:[0,-.10,-.09],fore:[0,-.01,.15,.45]},
  'm1919a6.fbx':{trigger:[0,-.10,.10],grip:[0,-.14,.05],fore:[0,-.05,.20,.60]},
  'm1-carbine.fbx':{trigger:[0,-.075,-.07],grip:[0,-.055,-.10],fore:[0,-.015,.06,.26]},
  'fg42.fbx':{trigger:[0,-.10,-.055],grip:[0,-.095,-.12],fore:[0,-.025,.08,.30]},
  'thompson.fbx':{trigger:[0,-.08,.01],grip:[0,-.10,-.06],fore:[0,-.015,.13,.34]},
  'mp40.fbx':{trigger:[0,-.075,-.055],grip:[0,-.10,-.125],fore:[0,-.035,.06,.17]},
  /* Pistol frame sits deeper into the sergeant's right palm: back, toward body centre, lower. */
  'm1911a1.fbx':{trigger:[0,-.07,.04],grip:[.035,0,.015],fore:null},
  'p38.fbx':{trigger:[0,-.07,.03],grip:[.035,-.005,.01],fore:null},
  rifle:{grip:GRIP.rifle,fore:[0,-.05,.05,.35]},carbine:{grip:GRIP.carbine,fore:[0,-.05,.04,.28]},smg:{grip:GRIP.smg,fore:[0,-.05,.04,.28]},
  lmg:{grip:GRIP.lmg,fore:[0,-.075,.15,.45]},pistol:{grip:GRIP.pistol,fore:null}
};
/* Per-model grip overrides for measured exceptions. Every model first uses its own hand-web
   anchors with the weapon's physical grip point. An override wins only when a posed lineup
   shows that a particular model/weapon pair needs a different contact point. */
var WEAPON_MODEL_POINTS={
  /* The GE scout's 0.342 m aiming web spacing exceeds the generic MP40 fore-end limit.
     Its barrel jacket continues here, so put the left hand on that reachable surface. */
  'ge-scout.fbx':{'mp40.fbx':{trigger:[0,-.075,-.055],grip:[0,-.10,-.125],fore:[0,-.035,.06,.23]}}
};
/* Runtime sidecar overlays (Assets/soldiers/<model>.json, written by the Motion Lab):
   SIDE_MODEL_POINTS[model][weapon] wins over WEAPON_MODEL_POINTS, SIDE_CONTACTS[model]
   wins over SOLDIER_CONTACTS, SIDE_ARM[model][weapon] carries the lab's left-arm dial
   degrees {shoulder,elbow,wrist} for that pair (pistol support cup), SIDE_LEFT_GRIP
   carries its right-hand-local support target, and
   SIDE_WRISTR[model][weapon] the right-wrist dial (straight stocks, finger on trigger). */
var SIDE_MODEL_POINTS={},SIDE_CONTACTS={},SIDE_ARM={},SIDE_WRISTR={},SIDE_LEFT_GRIP={};
function isSideTriplet(a){
  return Array.isArray(a)&&a.length===3&&a.every(function(n){return typeof n==='number'&&isFinite(n);});
}
function applySidecarData(file,data){
  if(!file||!data)return;
  if(data.contacts&&(isSideTriplet(data.contacts.right)||data.contacts.right===null||
      isSideTriplet(data.contacts.left)||data.contacts.left===null)){
    SIDE_CONTACTS[file]={right:data.contacts.right||null,left:data.contacts.left||null};
  }
  var weapons=data.weapons||{};
  Object.keys(weapons).forEach(function(w){
    var slot=weapons[w]||{};
    if(!isSideTriplet(slot.grip)&&!(slot.grip===null))return;
    var fore=null;
    if(isSideTriplet(slot.foreNear)&&isSideTriplet(slot.foreFar)){
      // Backend fore shares x/y: [x,y,zNear,zFar]. The lab warns when near/far x/y differ.
      fore=[slot.foreNear[0],slot.foreNear[1],slot.foreNear[2],slot.foreFar[2]];
    }
    var base=WEAPON_POINTS[w]||WEAPON_POINTS.rifle;
    (SIDE_MODEL_POINTS[file]||(SIDE_MODEL_POINTS[file]={}))[w]={
      trigger:(base&&base.trigger)||[0,0,0],
      grip:slot.grip?slot.grip.slice():(base&&base.grip?base.grip.slice():[0,0,0]),
      fore:fore
    };
    /* Right-wrist dial for straight stocks: rotate the firing hand so the finger meets
       the trigger. Stored only when non-zero; applied with the same yaw/pitch/roll
       order as the lab preview, ahead of the hand chains. */
    if(isSideTriplet(slot.wristR)&&slot.wristR.some(function(n){return Math.abs(n)>1e-9;})){
      (SIDE_WRISTR[file]||(SIDE_WRISTR[file]={}))[w]=slot.wristR.slice();
    }
    if(isSideTriplet(slot.leftGripR)){
      (SIDE_LEFT_GRIP[file]||(SIDE_LEFT_GRIP[file]={}))[w]=slot.leftGripR.slice();
    }
    var arm=slot.armDeg;
    if(arm&&(isSideTriplet(arm.shoulder)||isSideTriplet(arm.elbow)||isSideTriplet(arm.wrist))){
      var nz=function(a){return isSideTriplet(a)&&a.some(function(n){return Math.abs(n)>1e-9;});};
      if(nz(arm.shoulder)||nz(arm.elbow)||nz(arm.wrist)){
        (SIDE_ARM[file]||(SIDE_ARM[file]={}))[w]={
          shoulder:arm.shoulder?arm.shoulder.slice():[0,0,0],
          elbow:arm.elbow?arm.elbow.slice():[0,0,0],
          wrist:arm.wrist?arm.wrist.slice():[0,0,0]
        };
      }
    }
  });
}
function loadSidecars(base,files){
  if(typeof fetch==='undefined')return Promise.resolve();
  return Promise.all((files||[]).map(function(file){
    var t0=ASSET.on?perfNow():0;
    return fetch(base+'soldiers/'+encodeURIComponent(file)+'.json',{cache:'no-store'}).then(function(res){
      if(!res.ok)return;
      return res.json().then(function(data){applySidecarData(file,data);}).catch(function(){});
    }).catch(function(){}).then(function(){assetAdd('model',file,'sidecar',perfNow()-t0);});
  })).then(function(){});
}
function pointsFor(file,kind){
  var s=file&&SIDE_MODEL_POINTS[file];
  if(s&&s[kind])return s[kind];
  var m=file&&WEAPON_MODEL_POINTS[file];
  if(m&&m[kind])return m[kind];
  return WEAPON_POINTS[kind];
}
function armDegFor(modelFile,weaponFile){
  var m=modelFile&&SIDE_ARM[modelFile];
  return(m&&weaponFile&&m[weaponFile])||null;
}
function wristRFor(modelFile,weaponFile){
  var m=modelFile&&SIDE_WRISTR[modelFile];
  return(m&&weaponFile&&m[weaponFile])||null;
}
function leftGripFor(modelFile,weaponFile){
  var m=modelFile&&SIDE_LEFT_GRIP[modelFile];
  return(m&&weaponFile&&m[weaponFile])||null;
}
/* Measured per-model hand contacts, in hand-bone local import units: the same space
   palmAnchors() derives. Generated by the Motion Lab workbench (labs/fbx-animation-lab.html
   section 4, "Copy backend snippet"); an entry here wins over the derived web / centroid
   anchors for that model file. Empty until a lineup proves a model needs stored contacts. */
var SOLDIER_CONTACTS={
};
var SMOOTH_NORMALS=!(typeof location!=='undefined'&&/[?&]smooth=0\b/.test(location.search||''));

/* ---- performance instrumentation (observe only) --------------------------------------------
   Timers for the runtime/animation audit (AGENTS.md, open issues). They read performance.now()
   and fields this backend already keeps; they never write soldier or simulation state and never
   draw a random number. Two switches, both read once at install:
     startup timing (BattleAssetTimings): on by default, a few hundred clock reads per page load;
       `?perfTimings=0` or window.BATTLE_PERF_TIMINGS=false turns it off.
     pose timing (BattlePoseTimings): off by default and then measures nothing; `?perfTimings=1`,
       window.BATTLE_PERF_TIMINGS=true or BattlePoseTimings.enable() turns it on. */
var PERF_FLAG=(function(){
  var m=typeof location!=='undefined'&&/[?&]perfTimings=([01])\b/.exec(location.search||'');if(m)return m[1]==='1';
  var g=root.BATTLE_PERF_TIMINGS;return g==null?null:!!g;
})();
function perfNow(){return root.performance&&root.performance.now?root.performance.now():Date.now();}
function perfStats(arr,n){
  n=Math.min(n,arr.length);if(!n)return{n:0,mean:null,p50:null,p95:null,p99:null,max:null};
  var a=Array.prototype.slice.call(arr,0,n).sort(function(x,y){return x-y;}),sum=0;for(var i=0;i<n;i++)sum+=a[i];
  var q=function(p){return+a[Math.min(n-1,Math.floor(p*(n-1)+.5))].toFixed(4);};
  return{n:n,mean:+(sum/n).toFixed(4),p50:q(.5),p95:q(.95),p99:q(.99),max:+a[n-1].toFixed(4)};
}
function perfRound(v,d){return v==null?null:+(+v).toFixed(d==null?2:d);}

/* Startup: per FBX file download (Resource Timing), Babylon parse/import (the FBX plugin parses and
   builds synchronously inside loadAssetContainerAsync, so timing that call is its CPU time), the
   queue wait between them, then this backend's own work per file: model prepare (materials,
   normals, palm anchors), weapon prepare, clip conversion (canonicalise, filter, 30 Hz resample,
   root travel/turn removal), retarget per model, grip solve, sidecar fetch; and per soldier bind. */
var ASSET={on:PERF_FLAG!==false,files:{},parse:{},marks:{},binds:{count:0,ms:0,bodyMs:0,max:0,first:null,last:null}};
if(ASSET.on&&root.performance&&root.performance.setResourceTimingBufferSize){try{root.performance.setResourceTimingBufferSize(4000);}catch(_){}}
function assetMark(name){if(ASSET.on&&ASSET.marks[name]==null)ASSET.marks[name]=perfNow();}
function assetEntry(kind,file){var k=kind+':'+file;return ASSET.files[k]||(ASSET.files[k]={kind:kind,file:file});}
function assetAdd(kind,file,field,ms){if(!ASSET.on)return;var e=assetEntry(kind,file);e[field]=(e[field]||0)+ms;}
function assetBaseName(s){s=String(s||'');try{s=decodeURIComponent(s);}catch(_){}s=s.split('?')[0];return s.slice(s.lastIndexOf('/')+1);}
function assetResource(url){
  try{var list=root.performance.getEntriesByName(new URL(url,document.baseURI).href);return list.length?list[list.length-1]:null;}catch(_){return null;}
}
function wrapFbxParse(){
  var L=BABYLON.FBXFileLoader,p=L&&L.prototype;if(!ASSET.on||!p||!p.loadAssetContainerAsync||p._battleTimed)return;
  var orig=p.loadAssetContainerAsync;p._battleTimed=true;
  p.loadAssetContainerAsync=function(scene,data,rootUrl,onProgress,fileName){
    var t0=perfNow();
    try{return orig.apply(this,arguments);}
    finally{ASSET.parse[assetBaseName(String(rootUrl||'')+(typeof fileName==='string'?fileName:''))]={at:t0,ms:perfNow()-t0,bytes:data&&data.byteLength||null};}
  };
}
function assetLoaded(kind,file,url,t0){
  var t1=perfNow(),e=assetEntry(kind,file),parse=ASSET.parse[assetBaseName(url)],res=assetResource(url);
  e.requestAt=t0;e.loadedAt=t1;e.loadMs=t1-t0;
  if(res){
    /* stall: queued in the browser (connection limit) before the request went out; transfer: request to last byte. */
    e.download=res.responseEnd-res.startTime;e.bytes=res.encodedBodySize||res.transferSize||null;
    if(res.requestStart>0){e.stall=res.requestStart-res.startTime;e.transfer=res.responseEnd-res.requestStart;}
  }
  if(parse){e.parse=parse.ms;if(!e.bytes)e.bytes=parse.bytes;if(res)e.wait=Math.max(0,parse.at-res.responseEnd);}
  e.downloadSource=res?'resource-timing':'derived';
  if(e.download==null)e.download=Math.max(0,e.loadMs-(e.parse||0));
}
var ASSET_WORK=['parse','prepare','convert','retarget','grips'];
function assetSnapshot(){
  var files=Object.keys(ASSET.files).map(function(k){return ASSET.files[k];}),totals={files:files.length,bytes:0},byKind={};
  var fields=['download','stall','transfer','wait','parse','prepare','normals','palms','convert','dispose','retarget','grips','sidecar'];
  fields.forEach(function(f){totals[f]=0;});
  var rows=files.map(function(e){
    var row={kind:e.kind,file:e.file,bytes:e.bytes||null,downloadSource:e.downloadSource||null};
    fields.forEach(function(f){if(e[f]!=null){row[f]=perfRound(e[f]);totals[f]+=e[f];}});
    row.workMs=perfRound(ASSET_WORK.reduce(function(s,f){return s+(e[f]||0);},0));
    row.totalMs=perfRound((e.download||0)+(e.wait||0)+row.workMs);
    if(e.requestAt!=null)row.requestAt=perfRound(e.requestAt,1);if(e.loadedAt!=null)row.loadedAt=perfRound(e.loadedAt,1);
    totals.bytes+=e.bytes||0;
    var k=byKind[e.kind]||(byKind[e.kind]={files:0,bytes:0});k.files++;k.bytes+=e.bytes||0;
    fields.concat(['workMs']).forEach(function(f){if(row[f]!=null)k[f]=perfRound((k[f]||0)+row[f]);});
    return row;
  });
  fields.forEach(function(f){totals[f]=perfRound(totals[f]);});
  var L=root.BattleLoading,marks={};Object.keys(ASSET.marks).forEach(function(k){marks[k]=perfRound(ASSET.marks[k],1);});
  var b=ASSET.binds;
  return{
    enabled:ASSET.on,clock:'performance.now() ms since navigation start',
    page:L&&L.timings?L.timings():null,
    library:{marks:marks,wallMs:ASSET.marks.ready!=null&&ASSET.marks.start!=null?perfRound(ASSET.marks.ready-ASSET.marks.start):null,
      loaderScriptMs:perfRound(ASSET.loaderScriptMs),bindClipsMs:perfRound(ASSET.bindClipsMs)},
    binds:{count:b.count,totalMs:perfRound(b.ms),bodyMs:perfRound(b.bodyMs),meanMs:b.count?perfRound(b.ms/b.count,3):null,maxMs:perfRound(b.max,3),firstAt:perfRound(b.first,1),lastAt:perfRound(b.last,1)},
    totals:totals,byKind:byKind,
    slowest:rows.slice().sort(function(a,c){return c.totalMs-a.totalMs;}).slice(0,10),
    files:rows
  };
}

/* Pose: applyPose per soldier per rendered frame, split into its layers, plus how often each
   expensive layer's inputs actually changed since that layer last ran (exactly, and at the clip's
   own 30 Hz sample rate). Only while POSE.on; the render hook reads the flag once per frame. */
var POSE_LAYERS=['setup','base','overlay','dials','weapon','aim','support'],POSE_RING=1<<16,POSE_SOLDIER_RING=1<<19;
var POSE={on:false,gen:0,holdSupport:0,seen:0},POSE_BIT={};POSE_LAYERS.forEach(function(k,i){POSE_BIT[k]=1<<i;});
function poseCounter(){return{recomputed:0,changed:0,changedAtClipRate:0,layerInputsChanged:0};}
function poseReset(){
  POSE.gen++;POSE.frames=0;POSE.samples=0;POSE.startedAt=perfNow();
  POSE.frameMs=new Float64Array(POSE_RING);POSE.framePosed=new Uint16Array(POSE_RING);POSE.soldierMs=new Float32Array(POSE_SOLDIER_RING);
  POSE.layerMs={};POSE.layerRuns={};POSE.layerFrame={};POSE.layerCur={};
  POSE_LAYERS.forEach(function(k){POSE.layerMs[k]=0;POSE.layerRuns[k]=0;POSE.layerFrame[k]=new Float32Array(POSE_RING);POSE.layerCur[k]=0;});
  POSE.inputs={base:poseCounter(),aim:poseCounter(),weapon:poseCounter(),support:poseCounter()};
  POSE.dead=0;POSE.offscreen=0;POSE.frustumKnown=0;POSE.dist=[0,0,0,0];POSE.lod={posed:0,static:0,offscreen:0,interval:0,shadowKept:0,culled:0};
}
/* A layer may be timed in more than one segment of one applyPose; `runs` counts soldier-frames. */
function poseLayer(k,ms){POSE.layerMs[k]+=ms;POSE.layerCur[k]+=ms;if(!(POSE.seen&POSE_BIT[k])){POSE.seen|=POSE_BIT[k];POSE.layerRuns[k]++;}}
var poseClipSeq=0,poseStrSeq={};
function poseMix(h,v){return(Math.imul(h,31)+(v|0))|0;}
function poseStr(s){s=String(s);return poseStrSeq[s]||(poseStrSeq[s]=Object.keys(poseStrSeq).length+1);}
/* The base pose: every clip entry that contributes (clip, time, weight) plus the overlay weight.
   `rate` quantises clip time to the clip's 30 Hz frames and weights to 1/32. */
function poseClipSig(fx,rate){
  var h=17,layers=fx.overlay>.001?[fx.lower,fx.upper]:[fx.lower];
  for(var l=0;l<layers.length;l++){var es=layers[l].entries;h=poseMix(h,es.length);
    for(var i=0;i<es.length;i++){var e=es[i],c=e.clip;h=poseMix(h,c._perfId||(c._perfId=++poseClipSeq));
      h=poseMix(h,rate?Math.floor(e.t*FPS):Math.round(e.t*1e4));h=poseMix(h,rate?Math.round(e.w*32):Math.round(e.w*1e4));}}
  return poseMix(h,rate?Math.round(fx.overlay*32):Math.round(fx.overlay*1e4));
}
function poseRootSig(fx){
  var h=3,r=fx.root,p=r.position,pr=fx.holder.parent;
  h=poseMix(h,Math.round(p.x*1e3));h=poseMix(h,Math.round(p.y*1e3));h=poseMix(h,Math.round(p.z*1e3));h=poseMix(h,Math.round((r.rotation.y||0)*1e4));
  if(pr){h=poseMix(h,Math.round(pr.position.x*1e3));h=poseMix(h,Math.round(pr.position.y*1e3));h=poseMix(h,Math.round(pr.position.z*1e3));
    h=poseMix(h,Math.round(pr.rotation.x*1e4));h=poseMix(h,Math.round(pr.rotation.z*1e4));}
  return h;
}
function poseWeaponSig(fx){
  var h=poseMix(5,poseStr(fx.weaponModel||fx.weaponKind));
  return poseMix(poseMix(poseMix(poseMix(h,fx.bipod?1:0),fx.supportReleased?1:0),fx.death?1:0),fx.transition?1:0);
}
function poseCount(c,prev,key,sig,sigQ,layerSig){
  var p=prev[key];c.recomputed++;
  if(!p||p[0]!==sig)c.changed++;
  if(!p||p[1]!==sigQ)c.changedAtClipRate++;
  if(!p||p[2]!==layerSig)c.layerInputsChanged++;
  if(p){p[0]=sig;p[1]=sigQ;p[2]=layerSig;}else prev[key]=[sig,sigQ,layerSig];
}
/* Called after applyPose with what ran. Aim and support read the base pose (the hand chains), so
   their inputs are the base pose plus their own: aim weight, target and the root transform (aim is
   solved in world space); weapon and hold-release flags; the pistol cup's release weight. */
function poseInputs(fx,ran){
  var prev=fx._perfPrev;if(!prev||prev.gen!==POSE.gen)prev=fx._perfPrev={gen:POSE.gen};
  var clip=poseClipSig(fx,false),clipQ=poseClipSig(fx,true),I=POSE.inputs;
  poseCount(I.base,prev,'base',clip,clipQ,0);
  if(!ran.weapon)return;
  var w=poseWeaponSig(fx);
  poseCount(I.weapon,prev,'weapon',poseMix(clip,w),poseMix(clipQ,w),w);
  if(ran.aim){
    var a=poseRootSig(fx),t=fx.aimAt;a=poseMix(a,Math.round(fx.aim*1e4));
    if(t){a=poseMix(a,Math.round(t.x*100));a=poseMix(a,Math.round((t.y||0)*100));a=poseMix(a,Math.round(t.z*100));}
    poseCount(I.aim,prev,'aim',poseMix(clip,a),poseMix(clipQ,a),a);
  }
  if(ran.support){
    var s=poseMix(poseMix(w,Math.round((fx.cupW==null?1:fx.cupW)*1e3)),fx.cupClipKey?poseStr(fx.cupClipKey):0);
    if(ran.aim)s=poseMix(s,Math.round(fx.aim*1e4));
    poseCount(I.support,prev,'support',poseMix(clip,s),poseMix(clipQ,s),s);
  }
}
var poseEye=new V3();
function poseSoldier(fx,ms,scene){
  POSE.soldierMs[POSE.samples++%POSE_SOLDIER_RING]=ms;
  if(fx.death)POSE.dead++;
  var cam=scene.activeCamera,p=fx.root.position;
  if(cam){
    cam.globalPosition?poseEye.copyFrom(cam.globalPosition):poseEye.copyFrom(cam.position);
    var d=Math.sqrt((poseEye.x-p.x)*(poseEye.x-p.x)+(poseEye.y-p.y)*(poseEye.y-p.y)+(poseEye.z-p.z)*(poseEye.z-p.z));
    POSE.dist[d<25?0:(d<60?1:(d<150?2:3))]++;
  }
  var planes=scene.frustumPlanes;
  if(planes&&planes.length){
    POSE.frustumKnown++;
    for(var i=0;i<planes.length;i++){var pl=planes[i];if(pl.normal.x*p.x+pl.normal.y*(p.y+.9)+pl.normal.z*p.z+pl.d< -1.2){POSE.offscreen++;break;}}
  }
}
function poseFrame(ms,posed){
  var i=POSE.frames%POSE_RING;POSE.frameMs[i]=ms;POSE.framePosed[i]=posed;
  for(var k=0;k<POSE_LAYERS.length;k++){var L=POSE_LAYERS[k];POSE.layerFrame[L][i]=POSE.layerCur[L];POSE.layerCur[L]=0;}
  POSE.frames++;
}
function poseTimerResolution(){
  var min=Infinity,last=perfNow();for(var i=0;i<20000&&min>1e-6;i++){var t=perfNow();if(t>last){min=Math.min(min,t-last);last=t;}}
  return isFinite(min)?perfRound(min*1000,3):null;
}
function poseSnapshot(){
  if(!POSE.frameMs)return{enabled:POSE.on,frames:0};
  var frames=Math.min(POSE.frames,POSE_RING),samples=Math.min(POSE.samples,POSE_SOLDIER_RING),total=0,posedSum=0,layers={},inputs={};
  for(var i=0;i<frames;i++)posedSum+=POSE.framePosed[i];
  POSE_LAYERS.forEach(function(k){total+=POSE.layerMs[k];});
  POSE_LAYERS.forEach(function(k){
    var ms=POSE.layerMs[k],runs=POSE.layerRuns[k],pf=perfStats(POSE.layerFrame[k],frames);
    layers[k]={totalMs:perfRound(ms),runs:runs,usPerRun:runs?perfRound(ms*1000/runs,2):null,
      usPerSoldierFrame:POSE.samples?perfRound(ms*1000/POSE.samples,2):null,share:total?perfRound(ms/total,4):null,msPerFrame:{mean:pf.mean,p95:pf.p95}};
  });
  Object.keys(POSE.inputs).forEach(function(k){
    var c=POSE.inputs[k],r=c.recomputed||0;
    inputs[k]={recomputed:r,changed:c.changed,unchangedShare:r?perfRound(1-c.changed/r,4):null,
      changedAtClipRate:c.changedAtClipRate,unchangedShareAtClipRate:r?perfRound(1-c.changedAtClipRate/r,4):null,
      layerInputsChanged:c.layerInputsChanged,layerInputsUnchangedShare:r?perfRound(1-c.layerInputsChanged/r,4):null};
  });
  var perSoldier=perfStats(POSE.soldierMs,samples);
  ['mean','p50','p95','p99','max'].forEach(function(k){if(perSoldier[k]!=null)perSoldier[k]=perfRound(perSoldier[k]*1000,2);});
  var n=POSE.samples||1;
  var L=POSE.lod,lt=L.posed+L.static+L.offscreen+L.interval;
  return{enabled:POSE.on,frames:POSE.frames,soldierFrames:POSE.samples,
    lod:{enabled:LOD.on,near:LOD.near,mid:LOD.mid,midHz:LOD.midHz,farHz:LOD.farHz,offscreen:LOD.offscreen,
      posedShare:lt?perfRound(L.posed/lt,4):null,shadowKept:L.shadowKept,culled:L.culled,cull:CULL.on,heldStatic:L.static,heldOffscreen:L.offscreen,heldInterval:L.interval,posed:L.posed},wallMs:perfRound(perfNow()-POSE.startedAt,0),
    timerResolutionUs:POSE.resolutionUs,
    posedPerFrame:{mean:frames?perfRound(posedSum/frames,2):null,stats:perfStats(POSE.framePosed,frames)},
    frameMs:perfStats(POSE.frameMs,frames),perSoldierUs:perSoldier,layers:layers,inputs:inputs,
    posed:{deadShare:perfRound(POSE.dead/n,4),offscreenShare:POSE.frustumKnown?perfRound(POSE.offscreen/POSE.frustumKnown,4):null,
      cameraDistance:{under25m:perfRound(POSE.dist[0]/n,4),m25to60:perfRound(POSE.dist[1]/n,4),m60to150:perfRound(POSE.dist[2]/n,4),over150m:perfRound(POSE.dist[3]/n,4)}}};
}
function poseEnable(on){
  on=on!==false;if(on&&!POSE.on){poseReset();POSE.resolutionUs=poseTimerResolution();}POSE.on=on;return POSE.on;
}
if(PERF_FLAG===true)poseEnable(true);

/* Rigs differ in bone naming: the clips use Mixamo names ("mixamorig:Spine/Spine1/Spine2"), the
   older characters use "Spine02/Spine01/Spine" for the same three bones, and Mixamo's leaf bones
   spell out "HeadTop_End". Every rig is read through canon(): names are lowercased, the prefix and
   punctuation dropped, and the spine chain mapped to spine0/1/2 by the scheme the rig uses, so
   binding, retargeting, the palm anchors and the weapon chain all work across both. */
var SPINE_MAP={mixamo:{spine:'spine0',spine1:'spine1',spine2:'spine2'},legacy:{spine02:'spine0',spine01:'spine1',spine:'spine2'}};
var CANON_ALIAS={headtopend:'headend',headend:'headend',lefttoeend:'lefttoeend',righttoeend:'righttoeend'};
function rigScheme(names){
  for(var i=0;i<names.length;i++){var n=String(names[i]).toLowerCase();if(n.indexOf('spine02')>=0)return'legacy';}
  return'mixamo';
}
function canon(name,scheme){
  var n=String(name||'').toLowerCase().replace(/^mixamorig[:_]?/,'').replace(/[^a-z0-9]/g,'');
  var spine=SPINE_MAP[scheme||'mixamo'];
  if(spine&&spine[n])return spine[n];
  return CANON_ALIAS[n]||n;
}
var BONE={hips:'hips',spine0:'spine0',spine2:'spine2',neck:'neck',head:'head',
  leftHand:'lefthand',rightHand:'righthand',leftFoot:'leftfoot',rightFoot:'rightfoot'};
var UPPER_CANON={spine0:1,spine1:1,spine2:1,neck:1,head:1,headend:1,headfront:1,
  leftshoulder:1,leftarm:1,leftforearm:1,lefthand:1,rightshoulder:1,rightarm:1,rightforearm:1,righthand:1};
function isUpper(canonName){
  /* Fingers ride with the hand they belong to. */
  return!!UPPER_CANON[canonName]||/^(left|right)hand(thumb|index|middle|ring|pinky)/.test(canonName);
}
var scenes=typeof WeakMap!=='undefined'?new WeakMap():null;
function sceneState(scene){
  var st=scenes?scenes.get(scene):scene._battleFbxSoldier;
  if(!st){st={enabled:true,libs:{},clips:null,bones:null,loading:null,ready:false,active:[],error:null};if(scenes)scenes.set(scene,st);else scene._battleFbxSoldier=st;}
  return st;
}
/* Soldier assets can live beside a branch preview's runtime; everything else is shared. */
function assetBase(){return String(root.BATTLE_SOLDIER_ASSET_BASE||root.BATTLE_ASSET_BASE||'../Assets/').replace(/\/?$/,'/');}

var loaderPromise=null;
function ensureLoader(){
  if(BABYLON.FBXFileLoader)return Promise.resolve();
  if(loaderPromise)return loaderPromise;
  if(typeof document==='undefined')return Promise.reject(new Error('FBX loader needs a document'));
  /* The loader bundle must match the engine build exactly. */
  loaderPromise=new Promise(function(ok,fail){
    var tag=document.createElement('script');tag.async=true;
    tag.src='https://cdn.jsdelivr.net/npm/babylonjs-loaders@'+BABYLON.Engine.Version+'/babylonjs.loaders.min.js';
    tag.onload=function(){if(BABYLON.FBXFileLoader)ok();else fail(new Error('loader bundle has no FBX loader'));};
    tag.onerror=function(){fail(new Error('FBX loader script failed to load'));};
    document.head.appendChild(tag);
  });
  return loaderPromise;
}
function loadContainer(scene,url,kind,file){
  var p=BABYLON.LoadAssetContainerAsync(url,scene,{pluginExtension:'.fbx'});if(!ASSET.on||!kind)return p;
  var t0=perfNow();return p.then(function(c){assetLoaded(kind,file,url,t0);return c;});
}

/* ---- import + conversion ------------------------------------------------------------------ */

/* Hand anchors are fixed in their hand bone's space. The right grip lands in the web between
   thumb and index bases. The left fore-end rests at the palm side of the index finger's second
   knuckle, forward of the wrist: use the second index joint blended a little toward the web.
   This is a stable virtual socket even when the fingers animate. Rigs without those joints
   fall back to the centroid of hand-skinned vertices. */
function palmAnchors(meshes,nodes,scheme){
  var out={};
  [BONE.rightHand,BONE.leftHand].forEach(function(name){
    var sum=new V3(),count=0,node=nodes[name],web=null;
    var thumb=node&&nodes[name+'thumb1'],index=node&&nodes[name+'index1'],index2=node&&nodes[name+'index2'];
    if(node&&thumb&&index){
      /* Fresh vectors only (V3.Lerp): getAbsolutePosition may hand back internal state,
         so never chain mutating arithmetic onto it. */
      var webMid=V3.Lerp(thumb.getAbsolutePosition(),index.getAbsolutePosition(),.5);
      if(name===BONE.leftHand&&index2){
        webMid=V3.Lerp(webMid,index2.getAbsolutePosition(),.8);
        out[name+'Source']='index-pip';
      }else out[name+'Source']='web';
      web=V3.TransformCoordinates(webMid,node.getWorldMatrix().clone().invert());
    }
    meshes.forEach(function(mesh){
      var sk=mesh.skeleton;if(!sk||!node)return;
      var handBones={};for(var b=0;b<sk.bones.length;b++){var boneName=canon(sk.bones[b].name,scheme);if(boneName===name||new RegExp('^'+name+'(thumb|index|middle|ring|pinky)').test(boneName))handBones[b]=1;}if(!Object.keys(handBones).length)return;
      var VB=BABYLON.VertexBuffer,pos=mesh.getVerticesData(VB.PositionKind),ix=[mesh.getVerticesData(VB.MatricesIndicesKind),mesh.getVerticesData(VB.MatricesIndicesExtraKind)],
          wt=[mesh.getVerticesData(VB.MatricesWeightsKind),mesh.getVerticesData(VB.MatricesWeightsExtraKind)],world=mesh.getWorldMatrix(),p=new V3();
      for(var v=0;v<pos.length/3;v++){
        var w=0;for(var set=0;set<2;set++){if(!ix[set]||!wt[set])continue;for(var j=0;j<4;j++)if(handBones[ix[set][v*4+j]])w+=wt[set][v*4+j];}
        if(w<.5)continue;V3.TransformCoordinatesFromFloatsToRef(pos[v*3],pos[v*3+1],pos[v*3+2],world,p);sum.addInPlace(p);count++;
      }
    });
    var centroid=count&&node?V3.TransformCoordinates(sum.scale(1/count),node.getWorldMatrix().clone().invert()):V3.Zero();
    out[name]=web||centroid;
    if(!web)out[name+'Source']='centroid';
    out[name+'Centroid']=centroid;
    out[name+'Vertices']=count;
  });
  return out;
}
function prepareModel(container){
  var top=container.transformNodes.filter(function(n){return!n.parent;})[0];
  var skeleton=container.skeletons[0];
  if(!top||!skeleton)throw new Error('model FBX has no skinned skeleton');
  var meshes=container.meshes.filter(function(m){return m.getTotalVertices()>0;}),lo=Infinity,hi=-Infinity;
  top.computeWorldMatrix(true);
  top.getDescendants(false).forEach(function(n){if(n.computeWorldMatrix)n.computeWorldMatrix(true);});
  meshes.forEach(function(m){var b=m.getBoundingInfo().boundingBox;lo=Math.min(lo,b.minimumWorld.y);hi=Math.max(hi,b.maximumWorld.y);});
  if(!(hi>lo))throw new Error('model FBX has no measurable height');
  var all=top.getDescendants(false),scheme=rigScheme(all.map(function(n){return n.name;})),nodes={};
  all.forEach(function(n){nodes[canon(n.name,scheme)]=n;});
  container.materials.forEach(function(m){
    if(m.specularColor)m.specularColor.set(.06,.06,.06);
    /* The atlas is hundreds of small islands; keep it crisp at glancing angles. */
    if(m.diffuseTexture)m.diffuseTexture.anisotropicFilteringLevel=8;
    /* The auto-rig's weights fold the thin smock over itself at the shoulders and back once the
       soldier is posed, turning those triangles away from the camera. Culled, they read as holes;
       draw both sides, lit from whichever side faces the viewer. */
    m.backFaceCulling=false;if('twoSidedLighting' in m)m.twoSidedLighting=true;
    /* Imported soldier materials never change after preparation. Freeze shader/material dirty
       checks once the import-time adjustments above are complete. */
    if(m.freeze)m.freeze();
  });
  var tn=ASSET.on?perfNow():0;
  if(SMOOTH_NORMALS)meshes.forEach(smoothNormals);
  var tp=ASSET.on?perfNow():0,palms=palmAnchors(meshes,nodes,scheme);
  if(ASSET.on&&container._battleFile){assetAdd('model',container._battleFile,'normals',tp-tn);assetAdd('model',container._battleFile,'palms',perfNow()-tp);}
  var scale=(M.BODY&&M.BODY.heightM||1.7)/(hi-lo);
  if(!nodes.hips)throw new Error('model FBX has no hips bone');
  return{container:container,top:top,nodes:nodes,height:hi-lo,scale:scale,
    scheme:scheme,hipsHeight:(nodes.hips.getAbsolutePosition().y-lo)*scale,palms:palms,grips:null,clips:null};
}

/* Optional look (on by default, `?smooth=0` turns it off): the models ship flat-shaded, so the
   low-poly body reads as facets. Each corner instead averages the normals of the faces that meet at
   its position (welded across UV seams) and point within 60 degrees of its own face. The limit
   matters: the smock hem, straps and cuffs are thin shells whose two sides share positions, and
   averaging across them flips the normal and shades those faces black. */
function smoothNormals(mesh){
  var pos=mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind),idx=mesh.getIndices();if(!pos||!idx)return;
  var n=pos.length/3,key={},group=new Int32Array(n),count=0,i,j;
  for(i=0;i<n;i++){var k=pos[i*3].toFixed(4)+','+pos[i*3+1].toFixed(4)+','+pos[i*3+2].toFixed(4);if(key[k]==null)key[k]=count++;group[i]=key[k];}
  var tris=idx.length/3,face=new Float64Array(tris*3),own=new Float64Array(n*3),members=[];
  for(i=0;i<count;i++)members.push([]);
  for(var t=0;t<tris;t++){
    var a=idx[t*3]*3,b=idx[t*3+1]*3,c=idx[t*3+2]*3,ux=pos[b]-pos[a],uy=pos[b+1]-pos[a+1],uz=pos[b+2]-pos[a+2],vx=pos[c]-pos[a],vy=pos[c+1]-pos[a+1],vz=pos[c+2]-pos[a+2];
    /* Area-weighted face normal (cross product length is twice the area). */
    face[t*3]=uy*vz-uz*vy;face[t*3+1]=uz*vx-ux*vz;face[t*3+2]=ux*vy-uy*vx;
    for(j=0;j<3;j++){var v=idx[t*3+j];own[v*3]+=face[t*3];own[v*3+1]+=face[t*3+1];own[v*3+2]+=face[t*3+2];members[group[v]].push(t);}
  }
  var old=mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind),out=new Float32Array(n*3),agree=0,cos=Math.cos(Math.PI/3);
  for(i=0;i<n;i++){
    var ox=own[i*3],oy=own[i*3+1],oz=own[i*3+2],ol=Math.sqrt(ox*ox+oy*oy+oz*oz)||1,x=0,y=0,z=0,list=members[group[i]];
    for(j=0;j<list.length;j++){
      var f=list[j]*3,fx=face[f],fy=face[f+1],fz=face[f+2],fl=Math.sqrt(fx*fx+fy*fy+fz*fz)||1;
      if((fx*ox+fy*oy+fz*oz)/(fl*ol)>=cos){x+=fx;y+=fy;z+=fz;}
    }
    var l=Math.sqrt(x*x+y*y+z*z);if(!l){x=ox;y=oy;z=oz;l=ol;}
    out[i*3]=x/l;out[i*3+1]=y/l;out[i*3+2]=z/l;
    if(old)agree+=(out[i*3]*old[i*3]+out[i*3+1]*old[i*3+1]+out[i*3+2]*old[i*3+2])>0?1:-1;
  }
  /* Keep the outward sense the file's own normals have overall (the loader mirrors handedness). */
  if(agree<0)for(i=0;i<out.length;i++)out[i]=-out[i];
  mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind,out,false);
}
/* The clips' own skeleton: bone names (helper nodes excluded) and their rest local transforms.
   Every clip file carries the same one, so it is read once from the first clip loaded. */
function sourceRig(container){
  var real=container.transformNodes.filter(function(n){return n.name!=='__fbx_root__'&&n.name.indexOf('__fbx')<0;});
  var scheme=rigScheme(real.map(function(n){return n.name;})),bones=[],rest={};
  real.forEach(function(n){
    var name=canon(n.name,scheme);bones.push(name);
    rest[name]={q:(n.rotationQuaternion||Q.FromEulerVector(n.rotation)).clone(),p:n.position.clone()};
  });
  return{bones:bones,rest:rest,scheme:scheme};
}
function convertClip(container,key,spec,bones){
  var group=container.animationGroups[0];if(!group)throw new Error('no animation in '+spec[0]);
  var index={};bones.forEach(function(name,i){index[name]=i;});
  var scheme=rigScheme(container.transformNodes.map(function(n){return n.name;}));
  var channels=new Array(bones.length),frames=0,duration=0,loop=!!spec[1];
  group.targetedAnimations.forEach(function(ta){
    var i=ta.target?index[canon(ta.target.name,scheme)]:null,a=ta.animation;if(i==null||!a)return;
    var prop=a.targetProperty;if(prop!=='rotationQuaternion'&&prop!=='position')return;
    var afps=a.framePerSecond||FPS,span=(group.to-group.from)/afps;
    if(!frames){frames=Math.max(2,Math.round(span*FPS)+1);duration=(frames-1)/FPS;}
    var size=prop==='position'?3:4,data=new Float32Array(frames*size);
    for(var k=0;k<frames;k++){
      var v=a.evaluate(group.from+Math.min(span,k/FPS)*afps),o=k*size;
      data[o]=v.x;data[o+1]=v.y;data[o+2]=v.z;
      if(size===4){
        data[o+3]=v.w;
        /* Keep neighbouring samples in one hemisphere so per-frame nlerp never takes the long way. */
        if(k&&data[o]*data[o-4]+data[o+1]*data[o-3]+data[o+2]*data[o-2]+data[o+3]*data[o-1]<0)for(var j=0;j<4;j++)data[o+j]=-data[o+j];
      }
    }
    var ch=channels[i]||(channels[i]={rot:null,pos:null});
    if(prop==='position')ch.pos=data;else ch.rot=data;
  });
  if(!frames)throw new Error('no usable channels in '+spec[0]);
  /* Hips travel is horizontal in the armature's Z-up space (forward is -Y). Its net displacement
     is the clip's natural ground speed (kept in the clip's own units until a model scales it).
     Looping clips are made in place by removing the linear drift, which keeps sway and bob but
     ends each cycle where it began. */
  var hips=channels[index.hips],travel=0;
  if(hips&&hips.pos){
    var p=hips.pos,last=(frames-1)*3,dx=p[last]-p[0],dy=p[last+1]-p[1];
    travel=Math.sqrt(dx*dx+dy*dy)/Math.max(1e-3,duration);
    if(loop)for(var f=0;f<frames;f++){var u=f/(frames-1);p[f*3]-=dx*u;p[f*3+1]-=dy*u;}
  }
  /* Turn clips rotate the hips about the vertical by ~90 degrees; the soldier's root already turns
     in the sim, so that yaw is removed (linearly, like travel) and kept as the clip's turn rate. */
  var turnRate=0;
  if(spec[2]==='turn'&&hips&&hips.rot){
    /* Heading = where the hips faced at frame 0 (armature -Y, forward), carried through each frame. */
    var r=hips.rot,last4=(frames-1)*4,q=new Q(),R=new Q(),out=new Q(),face=new V3(),vf=new V3();
    q.set(r[0],r[1],r[2],r[3]);Q.InverseToRef(q,R);new V3(0,-1,0).rotateByQuaternionToRef(R,vf);
    var yawOf=function(quat){vf.rotateByQuaternionToRef(quat,face);return Math.atan2(face.x,-face.y);};
    var at=function(o){q.set(r[o],r[o+1],r[o+2],r[o+3]);return q;};
    var y0=yawOf(at(0)),dyaw=Math.atan2(Math.sin(yawOf(at(last4))-y0),Math.cos(yawOf(at(last4))-y0));turnRate=Math.abs(dyaw)/Math.max(1e-3,duration);
    /* Remove the yaw about the armature's vertical (+Z). The multiplication order that actually
       cancels it is picked on the last frame, so no quaternion convention is assumed. */
    var undo=function(o,u,first){Q.RotationAxisToRef(Z_UP,-dyaw*u,R);at(o);if(first)R.multiplyToRef(q,out);else q.multiplyToRef(R,out);return out;};
    var err=function(first){var y=yawOf(undo(last4,1,first));return Math.abs(Math.atan2(Math.sin(y-y0),Math.cos(y-y0)));};
    var first=err(true)<=err(false);
    for(var t4=0;t4<frames;t4++){var o=t4*4;undo(o,t4/(frames-1),first);r[o]=out.x;r[o+1]=out.y;r[o+2]=out.z;r[o+3]=out.w;}
  }
  return{key:key,file:spec[0],loop:loop,frames:frames,duration:duration,travel:travel,speed:0,turnRate:turnRate,channels:channels};
}

/* ---- prepared clips ----------------------------------------------------------------------- */
/* Assets/animations/prepared-clips.bin holds every CLIPS entry already through sourceRig and
   convertClip, so a page load reads one file instead of parsing ~90 clip FBX. It is written by
   scripts/build_clip_pack.cjs, which runs these same functions in a browser; CI
   (scripts/check_clip_pack.cjs) fails when a clip FBX, CLIPS or the conversion code changes
   without it. The runtime takes each clip whose spec still matches CLIPS; a missing or changed
   one, or every clip if the format differs, loads from its FBX as before. `?clipPack=0` loads
   every clip from FBX. Layout: 'GCP1', uint32 header length, the JSON header padded to 4 bytes,
   then the Float32 channel data the header indexes ([bone, rot offset, pos offset], -1 = none). */
var CLIP_PACK_FILE='prepared-clips.bin',CLIP_PACK_FORMAT=1;
var CLIP_PACK_ON=!(typeof location!=='undefined'&&/[?&]clipPack=0\b/.test(location.search||''));
function encodeClipPack(src,clips,extra){
  var rest={},total=0,list=[];
  src.bones.forEach(function(b){var r=src.rest[b];rest[b]={q:[r.q.x,r.q.y,r.q.z,r.q.w],p:[r.p.x,r.p.y,r.p.z]};});
  clips.forEach(function(c){c.channels.forEach(function(ch){if(ch)total+=(ch.rot?ch.rot.length:0)+(ch.pos?ch.pos.length:0);});});
  var data=new Float32Array(total),at=0,put=function(a){if(!a)return-1;data.set(a,at);at+=a.length;return at-a.length;};
  clips.forEach(function(c){
    var channels=[];c.channels.forEach(function(ch,i){if(ch)channels.push([i,put(ch.rot),put(ch.pos)]);});
    list.push({key:c.key,spec:CLIPS[c.key],loop:c.loop,frames:c.frames,duration:c.duration,travel:c.travel,turnRate:c.turnRate,channels:channels});
  });
  var head={format:CLIP_PACK_FORMAT,fps:FPS,src:{scheme:src.scheme,bones:src.bones,rest:rest},clips:list};
  Object.keys(extra||{}).forEach(function(k){head[k]=extra[k];});
  var json=new TextEncoder().encode(JSON.stringify(head)),pad=(4-json.length%4)%4,out=new Uint8Array(8+json.length+pad+data.byteLength);
  out.set([71,67,80,49]);new DataView(out.buffer).setUint32(4,json.length+pad,true);out.set(json,8);out.fill(32,8+json.length,8+json.length+pad);
  out.set(new Uint8Array(data.buffer),8+json.length+pad);
  return out;
}
function decodeClipPack(buf){
  var bytes=new Uint8Array(buf),len=buf.byteLength>=8?new DataView(buf).getUint32(4,true):0;
  if(!len||String.fromCharCode(bytes[0],bytes[1],bytes[2],bytes[3])!=='GCP1'||len%4)throw new Error('not a clip pack');
  var head=JSON.parse(new TextDecoder().decode(bytes.subarray(8,8+len)));
  if(head.format!==CLIP_PACK_FORMAT||head.fps!==FPS)throw new Error('clip pack format '+head.format+' at '+head.fps+' fps, runtime wants '+CLIP_PACK_FORMAT+' at '+FPS);
  var data=new Float32Array(buf,8+len,(buf.byteLength-8-len)>>2),rest={},clips={};
  Object.keys(head.src.rest).forEach(function(b){var r=head.src.rest[b];rest[b]={q:new Q(r.q[0],r.q[1],r.q[2],r.q[3]),p:new V3(r.p[0],r.p[1],r.p[2])};});
  head.clips.forEach(function(c){
    var channels=new Array(head.src.bones.length);
    c.channels.forEach(function(e){channels[e[0]]={rot:e[1]<0?null:data.subarray(e[1],e[1]+c.frames*4),pos:e[2]<0?null:data.subarray(e[2],e[2]+c.frames*3)};});
    clips[c.key]={spec:c.spec,clip:{key:c.key,file:c.spec[0],loop:c.loop,frames:c.frames,duration:c.duration,travel:c.travel,speed:0,turnRate:c.turnRate,channels:channels}};
  });
  return{src:{bones:head.src.bones,rest:rest,scheme:head.src.scheme},clips:clips,sources:head.sources||null};
}
function fetchClipPack(base){
  if(!CLIP_PACK_ON||typeof fetch!=='function')return Promise.resolve(null);
  /* no-cache revalidates: an unchanged pack costs one 304, a regenerated one is never served stale. */
  var url=base+'animations/'+CLIP_PACK_FILE,t0=perfNow();
  return fetch(url,{cache:'no-cache'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.arrayBuffer();}).then(function(buf){
    if(ASSET.on)assetLoaded('pack',CLIP_PACK_FILE,url,t0);
    var t1=perfNow(),pack=decodeClipPack(buf);assetAdd('pack',CLIP_PACK_FILE,'convert',perfNow()-t1);
    if(ASSET.on&&!assetEntry('pack',CLIP_PACK_FILE).bytes)assetEntry('pack',CLIP_PACK_FILE).bytes=buf.byteLength;
    return pack;
  }).catch(function(error){console.warn('[ANIM] prepared clips unavailable, clips load from FBX:',error&&error.message||error);return null;});
}
/* Load and convert clip FBX files ({file: [keys]}); resolves to the converted clips. */
function loadClipFiles(scene,st,base,byFile,progress){
  return Promise.all(Object.keys(byFile).map(function(file){
    return loadContainer(scene,base+'animations/'+encodeURIComponent(file)+'.fbx','clip',file+'.fbx').then(function(c){
      var t0=ASSET.on?perfNow():0,t1=0;
      try{if(!st.src){st.src=sourceRig(c);st.bones=st.src.bones;}var out=byFile[file].map(function(key){return convertClip(c,key,CLIPS[key],st.bones);});t1=ASSET.on?perfNow():0;return out;}
      finally{if(ASSET.on&&!t1)t1=perfNow();c.dispose();if(ASSET.on){assetAdd('clip',file+'.fbx','convert',t1-t0);assetAdd('clip',file+'.fbx','dispose',perfNow()-t1);}
        if(progress)progress();}
    });
  })).then(function(groups){return[].concat.apply([],groups);});
}
function clipsByFile(keys){var byFile={};keys.forEach(function(key){(byFile[CLIPS[key][0]]||(byFile[CLIPS[key][0]]=[])).push(key);});return byFile;}
/* For scripts/build_clip_pack.cjs: every CLIPS entry converted from its FBX, encoded as a pack.
   Runs on its own state, so a live battle's library is untouched. */
function buildClipPack(scene,extra){
  var st={src:null,bones:null};
  return ensureLoader().then(function(){return loadClipFiles(scene,st,assetBase(),clipsByFile(Object.keys(CLIPS)));})
    .then(function(list){var order={};Object.keys(CLIPS).forEach(function(k,i){order[k]=i;});list.sort(function(a,b){return order[a.key]-order[b.key];});
      return encodeClipPack(st.src,list,extra);});
}

/* Clips are authored on one skeleton; a model may share its bone names and hierarchy but not its
   rest orientations or units (the paratroopers differ by up to ~180 degrees per bone and use
   metres, not centimetres). Retarget each clip onto the model once: for every bone, the clip's
   rotation away from its own rest pose is taken in world (armature) space, reapplied to the model's
   rest pose, and turned back into a local rotation under the model's already-retargeted parent.
   The hips position is rescaled by the ratio of the two rest hip heights. Models whose rest pose
   already matches keep the clips as they are. */
var rtA=new MX(),rtB=new MX(),rtC=new MX(),rtQ=new Q(),Z_UP=new V3(0,0,1);
function quatMatrix(x,y,z,w,out){rtQ.set(x,y,z,w);rtQ.toRotationMatrix(out);return out;}
/* The same retarget in quaternions on plain arrays, ~5x cheaper than the matrix loop below and
   equal to it within float32 rounding (Babylon's row-vector M(a)×M(b) is the product b⊗a, a
   transpose is a conjugate): Ws = Ws_parent⊗q, Wt = Ws⊗K with K = conj(S0)⊗T0 fixed per bone,
   local = conj(Wt_parent)⊗Wt; a bone the model does not animate follows its rest pose.
   `?fastRetarget=0` runs the matrix loop instead (scripts/probe_retarget.cjs compares them). */
var FAST_RETARGET=!(typeof location!=='undefined'&&/[?&]fastRetarget=0\b/.test(location.search||''));
function hamilton(o,oi,a,ai,b,bi){
  var ax=a[ai],ay=a[ai+1],az=a[ai+2],aw=a[ai+3],bx=b[bi],by=b[bi+1],bz=b[bi+2],bw=b[bi+3];
  o[oi]=ax*bw+ay*bz-az*by+aw*bx;o[oi+1]=-ax*bz+ay*bw+az*bx+aw*by;o[oi+2]=ax*by-ay*bx+az*bw+aw*bz;o[oi+3]=-ax*bx-ay*by-az*bz+aw*bw;
}
function retargetRotations(frames,n,order,parent,K,rS,rT,src,dst){
  var Ws=new Float64Array(n*4),Wt=new Float64Array(n*4),L=new Float64Array(4),C=new Float64Array(4),j;
  for(var fr=0;fr<frames;fr++){
    var a=fr*4;
    for(var o=0;o<n;o++){
      var i=order[o],p=parent[i],i4=i*4,s=src[i],d=dst[i];
      if(s){if(p>=0)hamilton(Ws,i4,Ws,p*4,s,a);else for(j=0;j<4;j++)Ws[i4+j]=s[a+j];}
      else if(p>=0)hamilton(Ws,i4,Ws,p*4,rS,i4);else for(j=0;j<4;j++)Ws[i4+j]=rS[i4+j];
      if(!d){if(p>=0)hamilton(Wt,i4,Wt,p*4,rT,i4);else for(j=0;j<4;j++)Wt[i4+j]=rT[i4+j];continue;}
      hamilton(Wt,i4,Ws,i4,K,i4);
      if(p>=0){var p4=p*4;C[0]=-Wt[p4];C[1]=-Wt[p4+1];C[2]=-Wt[p4+2];C[3]=Wt[p4+3];hamilton(L,0,C,0,Wt,i4);}
      else for(j=0;j<4;j++)L[j]=Wt[i4+j];
      /* Keep neighbouring samples in one hemisphere, as convertClip does. */
      if(fr&&L[0]*d[a-4]+L[1]*d[a-3]+L[2]*d[a-2]+L[3]*d[a-1]<0)for(j=0;j<4;j++)L[j]=-L[j];
      d[a]=L[0];d[a+1]=L[1];d[a+2]=L[2];d[a+3]=L[3];
    }
  }
}
function retargetClips(lib,src,clips,bones){
  var n=bones.length,parent=new Int32Array(n),restS=[],restT=[],i;
  var nodes=bones.map(function(name){return lib.nodes[name]||null;});
  for(i=0;i<n;i++){
    var node=nodes[i],pn=node&&node.parent?bones.indexOf(canon(node.parent.name,lib.scheme)):-1;parent[i]=pn;
    restS[i]=src.rest[bones[i]].q;restT[i]=node?(node.rotationQuaternion||Q.FromEulerVector(node.rotation)):restS[i];
  }
  /* Parents before children. */
  var order=[],depth=function(k){var d=0;while(parent[k]>=0){k=parent[k];d++;}return d;};
  for(i=0;i<n;i++)order.push(i);order.sort(function(a,b){return depth(a)-depth(b);});
  var worst=0;for(i=0;i<n;i++)if(nodes[i])worst=Math.max(worst,1-Math.abs(Q.Dot(restS[i],restT[i])));
  var hipsS=src.rest.hips.p,hipsT=lib.nodes.hips.position,k=hipsT.length()/Math.max(1e-6,hipsS.length());
  lib.speedScale=lib.hipsHeight/Math.max(1e-6,hipsS.z);
  /* Quaternion form (the default): per bone, K = conj(S0)⊗T0 once per model. */
  var rS=new Float64Array(n*4),rT=new Float64Array(n*4),K=new Float64Array(n*4),S0q=new Float64Array(n*4),T0q=new Float64Array(n*4),cq=new Float64Array(4);
  for(i=0;i<n;i++){var qs=restS[i],qt=restT[i];rS[i*4]=qs.x;rS[i*4+1]=qs.y;rS[i*4+2]=qs.z;rS[i*4+3]=qs.w;rT[i*4]=qt.x;rT[i*4+1]=qt.y;rT[i*4+2]=qt.z;rT[i*4+3]=qt.w;}
  for(var oq=0;oq<n;oq++){
    var iq=order[oq],pq=parent[iq],i4=iq*4;
    if(pq>=0){hamilton(S0q,i4,S0q,pq*4,rS,i4);hamilton(T0q,i4,T0q,pq*4,rT,i4);}
    else for(var j4=0;j4<4;j4++){S0q[i4+j4]=rS[i4+j4];T0q[i4+j4]=rT[i4+j4];}
    cq[0]=-S0q[i4];cq[1]=-S0q[i4+1];cq[2]=-S0q[i4+2];cq[3]=S0q[i4+3];hamilton(K,i4,cq,0,T0q,i4);
  }
  var out={};
  Object.keys(clips).forEach(function(key){
    var clip=clips[key],copy={};for(var f in clip)copy[f]=clip[f];copy.speed=clip.travel*lib.speedScale;
    out[key]=copy;
    if(worst<1e-4&&Math.abs(k-1)<1e-3)return;
    var frames=clip.frames,chans=new Array(n),S0=[],T0=[],Ws=[],Wt=[];
    if(FAST_RETARGET){
      var srcRot=new Array(n),dstRot=new Array(n);
      for(i=0;i<n;i++){
        var ch0=clip.channels[i];srcRot[i]=ch0&&ch0.rot||null;dstRot[i]=null;
        if(!ch0||!nodes[i])continue;
        chans[i]={rot:ch0.rot?(dstRot[i]=new Float32Array(frames*4)):null,pos:null};
        if(ch0.pos){var pos0=new Float32Array(ch0.pos.length),rs0=src.rest[bones[i]].p,rt0=nodes[i].position;
          for(var j0=0;j0<frames;j0++){var b0=j0*3;pos0[b0]=rt0.x+(ch0.pos[b0]-rs0.x)*k;pos0[b0+1]=rt0.y+(ch0.pos[b0+1]-rs0.y)*k;pos0[b0+2]=rt0.z+(ch0.pos[b0+2]-rs0.z)*k;}
          chans[i].pos=pos0;}
      }
      retargetRotations(frames,n,order,parent,K,rS,rT,srcRot,dstRot);
      copy.channels=chans;return;
    }
    for(i=0;i<n;i++){S0[i]=new MX();T0[i]=new MX();Ws[i]=new MX();Wt[i]=new MX();}
    for(var o=0;o<n;o++){
      i=order[o];var ps=parent[i];
      quatMatrix(restS[i].x,restS[i].y,restS[i].z,restS[i].w,rtA);if(ps>=0)rtA.multiplyToRef(S0[ps],S0[i]);else S0[i].copyFrom(rtA);
      quatMatrix(restT[i].x,restT[i].y,restT[i].z,restT[i].w,rtA);if(ps>=0)rtA.multiplyToRef(T0[ps],T0[i]);else T0[i].copyFrom(rtA);
      var ch=clip.channels[i];
      if(ch&&nodes[i])chans[i]={rot:ch.rot?new Float32Array(frames*4):null,pos:null};
      if(ch&&ch.pos&&nodes[i]){
        var pos=new Float32Array(ch.pos.length),rs=src.rest[bones[i]].p,rt=nodes[i].position;
        for(var j=0;j<frames;j++){var b=j*3;pos[b]=rt.x+(ch.pos[b]-rs.x)*k;pos[b+1]=rt.y+(ch.pos[b+1]-rs.y)*k;pos[b+2]=rt.z+(ch.pos[b+2]-rs.z)*k;}
        chans[i].pos=pos;
      }
    }
    for(var fr=0;fr<frames;fr++){
      for(o=0;o<n;o++){
        i=order[o];var p=parent[i],c=clip.channels[i],q=c&&c.rot?c.rot:null,a=fr*4;
        if(q)quatMatrix(q[a],q[a+1],q[a+2],q[a+3],rtA);else quatMatrix(restS[i].x,restS[i].y,restS[i].z,restS[i].w,rtA);
        if(p>=0)rtA.multiplyToRef(Ws[p],Ws[i]);else Ws[i].copyFrom(rtA);
        if(!chans[i]||!chans[i].rot){
          quatMatrix(restT[i].x,restT[i].y,restT[i].z,restT[i].w,rtA);if(p>=0)rtA.multiplyToRef(Wt[p],Wt[i]);else Wt[i].copyFrom(rtA);continue;
        }
        /* delta = S0^-1 * Ws (world-space change), Wt = T0 * delta, local = Wt * parentWt^-1 */
        S0[i].transposeToRef(rtB);rtB.multiplyToRef(Ws[i],rtC);T0[i].multiplyToRef(rtC,Wt[i]);
        if(p>=0){Wt[p].transposeToRef(rtB);Wt[i].multiplyToRef(rtB,rtC);}else rtC.copyFrom(Wt[i]);
        Q.FromRotationMatrixToRef(rtC,rtQ);
        var r=chans[i].rot;
        if(fr&&rtQ.x*r[a-4]+rtQ.y*r[a-3]+rtQ.z*r[a-2]+rtQ.w*r[a-1]<0)rtQ.scaleInPlace(-1);
        r[a]=rtQ.x;r[a+1]=rtQ.y;r[a+2]=rtQ.z;r[a+3]=rtQ.w;
      }
    }
    copy.channels=chans;
  });
  /* In-place loops have no travel: use the stride speed. Root-motion loops keep their measured
     travel (the stride estimate is kept alongside for diagnostics). */
  Object.keys(out).forEach(function(key){
    var c=out[key];if(!c.loop)return;c.stride=strideSpeed(lib,c,bones);
    if(c.speed<.05&&c.stride>0)c.speed=c.stride;
  });
  lib.clips=out;lib.retargeted=!(worst<1e-4&&Math.abs(k-1)<1e-3);
  return out;
}

/* Natural ground speed of an in-place clip, read from its feet: while a foot is planted it slides
   backwards under the hips at the speed the body would travel. Forward kinematics runs from the
   hips to each foot on the model's own rest offsets; for every frame the lower foot (by at least a
   few centimetres) is the planted one, and the median of its horizontal speed relative to the hips
   is the stride speed, in metres per second. */
var skA=new MX(),skB=new MX(),skQ=new Q(),skP=new V3(),skOne=new V3(1,1,1);
function strideSpeed(lib,clip,bones){
  var hipsNode=lib.nodes.hips;if(!hipsNode)return 0;
  var index={};bones.forEach(function(b,i){index[b]=i;});
  var unit=lib.hipsHeight/Math.max(1e-6,Math.abs(hipsNode.position.z)||hipsNode.position.length());
  var feet=[BONE.leftFoot,BONE.rightFoot].map(function(name){var chain=[],node=lib.nodes[name];while(node&&node!==hipsNode){chain.unshift(node);node=node.parent;}return node?chain:null;});
  if(!feet[0]||!feet[1])return 0;
  function localOf(node,frame,out){
    var i=index[canon(node.name,lib.scheme)],ch=i!=null?clip.channels[i]:null,r=ch&&ch.rot,a=frame*4;
    if(r)skQ.set(r[a],r[a+1],r[a+2],r[a+3]);else skQ.copyFrom(node.rotationQuaternion||Q.FromEulerVector(node.rotation));
    MX.ComposeToRef(skOne,skQ,node.position,out);return out;
  }
  function footAt(chain,frame){
    /* Hips rotation only (its horizontal travel is what the stride is measured against). */
    localOf(hipsNode,frame,skB);skB.setTranslationFromFloats(0,0,0);
    for(var c=0;c<chain.length;c++){localOf(chain[c],frame,skA);skA.multiplyToRef(skB,skB);}
    return skB.getTranslation();
  }
  var speeds=[],prev=null,fps=FPS,gap=.03/unit;
  for(var f=0;f<clip.frames;f++){
    var l=footAt(feet[0],f),r=footAt(feet[1],f),planted=l.z<r.z-gap?0:(r.z<l.z-gap?1:-1),pos=planted===0?l:r;
    if(prev&&planted>=0&&planted===prev.planted)speeds.push(Math.sqrt((pos.x-prev.pos.x)*(pos.x-prev.pos.x)+(pos.y-prev.pos.y)*(pos.y-prev.pos.y))*fps*unit);
    prev={planted:planted,pos:pos};
  }
  if(!speeds.length)return 0;speeds.sort(function(a,b){return a-b;});
  return speeds[Math.floor(speeds.length/2)];
}

/* Solve each weapon from this model's posed hand webs. The physical grip point must land on
   the right web in both the rigid pose and the two-hand hold. */
function solveGrips(lib,aim,bones,kinds){
  var nodes=lib.nodes,saved=[];
  bones.forEach(function(name,i){
    var n=nodes[name],ch=aim.channels[i];if(!n||!ch)return;
    saved.push([n,n.position.clone(),n.rotationQuaternion?n.rotationQuaternion.clone():null]);
    if(ch.rot){if(!n.rotationQuaternion)n.rotationQuaternion=new Q();n.rotationQuaternion.set(ch.rot[0],ch.rot[1],ch.rot[2],ch.rot[3]);}
    if(ch.pos)n.position.set(ch.pos[0],ch.pos[1],ch.pos[2]);
  });
  lib.top.computeWorldMatrix(true);
  lib.top.getDescendants(false).forEach(function(n){if(n.computeWorldMatrix)n.computeWorldMatrix(true);});
  var hand=nodes[BONE.rightHand].getWorldMatrix().clone(),left=nodes[BONE.leftHand].getWorldMatrix();
  var rightPalm=V3.TransformCoordinates(lib.palms[BONE.rightHand],hand),leftPalm=V3.TransformCoordinates(lib.palms[BONE.leftHand],left);
  /* The rifle's aim pose defines a fixed right-hand socket: its barrel follows the support-hand
     line. A pistol keeps the model-forward axis because its free hand does not define its barrel. */
  var hands=leftPalm.subtract(rightPalm),z=kinds[0]==='pistol'?new V3(0,0,1):hands.clone(),up=V3.Up();if(z.lengthSquared()<1e-8)z.set(0,0,1);else z.normalize();
  var y=up.subtract(z.scale(V3.Dot(up,z)));if(y.lengthSquared()<1e-8)y=new V3(0,1,0);else y.normalize();var x=V3.Cross(y,z).normalize(),rotation=Q.RotationQuaternionFromAxis(x,y,z),basis=new MX(),inv=hand.clone().invert(),grips={};rotation.toRotationMatrix(basis);
  kinds.forEach(function(kind){
    var pts=pointsFor(lib.file,kind),g=pts.grip.slice();
    var offset=V3.TransformNormal(new V3(g[0],g[1],g[2]).scale(1/lib.scale),basis);
    var origin=rightPalm.subtract(offset),s=1/lib.scale;
    grips[kind]=MX.Compose(new V3(s,s,s),rotation,origin).multiply(inv);
  });
  saved.forEach(function(e){e[0].position.copyFrom(e[1]);if(e[2])e[0].rotationQuaternion.copyFrom(e[2]);});
  lib.top.getDescendants(false).forEach(function(n){if(n.computeWorldMatrix)n.computeWorldMatrix(true);});
  Object.keys(grips).forEach(function(k){lib.grips[k]=grips[k];});
  /* Diagnostic: how far the support hand sits from the barrel line in the calibration pose. */
  if(kinds[0]!=='pistol')lib.supportHand={along:+(V3.Dot(hands,z)*lib.scale).toFixed(3),off:+(hands.subtract(z.scale(V3.Dot(hands,z))).length()*lib.scale).toFixed(3)};
}

/* The model a soldier of this faction and role wears. */
function modelFor(st,faction,role){
  var set=MODELS[faction==='ge'?'ge':'us']||{};return st.libs[set[role]||set.default]||null;
}
function prepareWeapon(container,name,butt){
  var mesh=container.meshes.filter(function(m){return m.getTotalVertices()>0;})[0];if(!mesh)throw new Error('weapon FBX has no mesh');
  /* Bake the loader's root (handedness + units) into the vertices, then normalise units from the
     known butt position; Babylon flips the winding when the baked transform mirrors. */
  mesh.bakeCurrentTransformIntoVertices();mesh.parent=null;
  var pos=mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind),zmin=Infinity,zmax=-Infinity,i;
  for(i=2;i<pos.length;i+=3){zmin=Math.min(zmin,pos[i]);zmax=Math.max(zmax,pos[i]);}
  var k=-butt/zmin;if(isFinite(k)&&Math.abs(k-1)>1e-3)mesh.bakeTransformIntoVertices(MX.Scaling(k,k,k));
  /* Muzzle: the foremost geometry at barrel height (folded bipod legs can reach further forward). */
  pos=mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);zmax=-Infinity;
  for(i=0;i<pos.length;i+=3)if(pos[i+1]>-.04)zmax=Math.max(zmax,pos[i+2]);
  var ys=0,n=0;for(i=0;i<pos.length;i+=3)if(pos[i+1]>-.04&&pos[i+2]>zmax-.03){ys+=pos[i+1];n++;}
  var mat=mesh.material;if(mat){if(mat.specularColor)mat.specularColor.set(.08,.08,.08);if(mat.diffuseTexture)mat.diffuseTexture.anisotropicFilteringLevel=4;}
  mesh.isPickable=false;mesh.refreshBoundingInfo();
  return{name:name,mesh:mesh,muzzle:[0,n?ys/n:0,zmax]};
}
/* Per-file progress for the page's load bar (BattleLoading in battle_sim.html). Presentation only;
   absent in the trainer, benchmark and Motion Lab. */
function loadProgress(item,done,total,label){var L=root.BattleLoading;if(L&&L.progress)L.progress('soldiers',item,done,total,label);}
function loadWeapons(scene,st,base){
  st.weapons={};var files={};
  var P=weaponProfiles();Object.keys(P).forEach(function(f){Object.keys(P[f]).forEach(function(kind){weaponFiles(f,kind).forEach(function(file){
    files[file]=kind==='pistol'?PISTOL_BUTT:WEAPON_BUTT;if(WEAPON_BIPOD[file])files[WEAPON_BIPOD[file]]=WEAPON_BUTT;});});});
  var total=Object.keys(files).length,done=0;loadProgress('weapons',0,total,'weapons');
  return Promise.all(Object.keys(files).map(function(file){
    return loadContainer(scene,base+'weapons/'+file,'weapon',file).then(function(c){var t0=ASSET.on?perfNow():0;st.weapons[file]=prepareWeapon(c,file,files[file]);assetAdd('weapon',file,'prepare',perfNow()-t0);})
      .catch(function(e){console.warn('[ANIM] weapon model '+file+' unavailable; box weapon stays',e);})
      .then(function(){loadProgress('weapons',++done,total,'weapons');});
  }));
}
/* ---- Soldier mesh LOD (presentation only) ---------------------------------------------------
   A soldier is ~22k vertices with 6-7 bone weights each, and the GPU skins every one every frame:
   on an iPhone that was ~9 ms of a 37 ms frame (device benchmark, benchHide=soldiers). Beyond
   `meshLod.far` metres a soldier draws a simplified triangle list instead (meshoptimizer, ~`ratio`
   of the triangles). It indexes the model's own vertex buffer, so every vertex it keeps carries its
   own bone weights, UVs and normals, and clips, poses and the animation LOD are unchanged; the GPU
   only skins the vertices the list uses. One list per model, built once before binding and appended
   to the model's shared index buffer; each soldier's mesh gets a second sub-mesh over it and the
   render hook picks one by camera distance. The models ship unwelded (flat-shaded, ~2 vertices per
   triangle), so the simplifier sees them welded by position first; a welded corner takes the first
   vertex at that position. `?soldierLod=0` draws every soldier at full detail. Distances are
   presentation thresholds, tuned from close-ups (scripts/probe_soldier_mesh_lod.cjs). */
var MESH_LOD={on:!(typeof location!=='undefined'&&/[?&]soldierLod=0\b/.test(location.search||'')),far:45,band:3,ratio:.12,error:.08,
  lib:'https://cdn.jsdelivr.net/npm/meshoptimizer@0.22.0/meshopt_simplifier.js',models:{},failed:null},meshoptPromise=null;
function meshoptReady(){
  if(!MESH_LOD.on||typeof document==='undefined')return Promise.resolve(null);
  if(meshoptPromise)return meshoptPromise;
  meshoptPromise=new Promise(function(ok){
    var settled=false,done=function(v,why){if(settled)return;settled=true;if(why)MESH_LOD.failed=why;ok(v);};
    if(root.MeshoptSimplifier)return root.MeshoptSimplifier.ready.then(function(){done(root.MeshoptSimplifier);},function(){done(null,'meshoptimizer did not initialise');});
    var tag=document.createElement('script');tag.async=true;tag.src=MESH_LOD.lib;
    tag.onload=function(){var M=root.MeshoptSimplifier;if(!M)return done(null,'meshoptimizer script has no simplifier');M.ready.then(function(){done(M);},function(){done(null,'meshoptimizer did not initialise');});};
    tag.onerror=function(){done(null,'meshoptimizer failed to load');};
    document.head.appendChild(tag);
  });
  return meshoptPromise;
}
function buildMeshLod(lib,M){
  if(!M||!MESH_LOD.on)return;
  lib.container.meshes.forEach(function(m){
    var g=m.geometry;if(!g||g._fbxLod||!m.skeleton||!m.subMeshes||m.subMeshes.length!==1)return;
    var pos=m.getVerticesData(BABYLON.VertexBuffer.PositionKind),idx=m.getIndices();if(!pos||!idx||!idx.length)return;
    var n=pos.length/3,key={},rep=new Uint32Array(n),i;
    for(i=0;i<n;i++){var k=pos[i*3].toFixed(4)+','+pos[i*3+1].toFixed(4)+','+pos[i*3+2].toFixed(4);if(key[k]==null)key[k]=i;rep[i]=key[k];}
    var welded=new Uint32Array(idx.length);for(i=0;i<idx.length;i++)welded[i]=rep[idx[i]];
    var target=Math.max(3,Math.floor(idx.length*MESH_LOD.ratio/3)*3),res=M.simplify(welded,pos instanceof Float32Array?pos:new Float32Array(pos),3,target,MESH_LOD.error,['Sparse']),out=res[0];
    /* Sparse: the welded list uses ~a quarter of the buffer's vertices; without it the simplifier
       barely removes a triangle (10450 -> 10444 on a paratrooper). */
    if(!out||out.length<3||out.length>=idx.length*.8){MESH_LOD.skipped=(MESH_LOD.skipped||0)+1;return;}
    /* Welding gave each position its first vertex, whose UV is wrong on the far side of a texture
       seam. Give each kept triangle, per corner, the vertex at that position whose UV agrees best
       with the other two corners (the combination with the smallest UV spread). */
    var uv=m.getVerticesData(BABYLON.VertexBuffer.UVKind);
    if(uv){
      var at={};for(i=0;i<n;i++){var r=rep[i];(at[r]||(at[r]=[])).push(i);}
      var d2=function(a,b){var x=uv[a*2]-uv[b*2],y=uv[a*2+1]-uv[b*2+1];return x*x+y*y;};
      for(i=0;i<out.length;i+=3){
        var A=at[out[i]].slice(0,8),B=at[out[i+1]].slice(0,8),C=at[out[i+2]].slice(0,8),best=Infinity,ba=A[0],bb=B[0],bc=C[0];
        if(A.length*B.length*C.length===1)continue;
        for(var ai=0;ai<A.length;ai++)for(var bi=0;bi<B.length;bi++){var ab=d2(A[ai],B[bi]);if(ab>=best)continue;
          for(var ci=0;ci<C.length;ci++){var sc=ab+d2(B[bi],C[ci])+d2(C[ci],A[ai]);if(sc<best){best=sc;ba=A[ai];bb=B[bi];bc=C[ci];}}}
        out[i]=ba;out[i+1]=bb;out[i+2]=bc;
      }
    }
    var sub=m.subMeshes[0],all=new Uint32Array(idx.length+out.length);all.set(idx,0);all.set(out,idx.length);
    var sharers=(g.meshes||[m]).filter(function(x){return x.subMeshes&&x.subMeshes.length===1;});
    g.setIndices(all,n,true);
    /* setIndices rebuilds a global sub-mesh over the whole buffer on every mesh sharing the geometry
       (soldiers bound before the lists were built too); give each back its full-detail one. */
    sharers.forEach(function(x){x.subMeshes=[];new BABYLON.SubMesh(sub.materialIndex,sub.verticesStart,sub.verticesCount,0,idx.length,x);});
    var used=new Uint8Array(n),kept=0;for(i=0;i<out.length;i++)if(!used[out[i]]){used[out[i]]=1;kept++;}
    g._fbxLod={start:idx.length,count:out.length};
    MESH_LOD.models[lib.file||m.name]={triangles:idx.length/3,lodTriangles:out.length/3,vertices:n,lodVertices:kept,error:+res[1].toFixed(4)};
  });
}
/* Per soldier: the full and the far sub-mesh of each body mesh that has a far list. */
function meshLodBind(meshes){
  var out=[];
  meshes.forEach(function(m){
    var L=m.geometry&&m.geometry._fbxLod;if(!L||!m.subMeshes||m.subMeshes.length!==1)return;
    var full=m.subMeshes.slice(),far=new BABYLON.SubMesh(full[0].materialIndex,0,m.getTotalVertices(),L.start,L.count,m,undefined,true,false);
    out.push({mesh:m,full:full,far:[far]});
  });
  return out.length?out:null;
}
/* Called when meshoptimizer is ready, which may be after soldiers are bound: never holds the battle. */
function meshLodInstall(st,M){
  if(!M||!MESH_LOD.on)return;
  Object.keys(st.libs||{}).forEach(function(f){var t0=ASSET.on?perfNow():0;try{buildMeshLod(st.libs[f],M);}catch(e){MESH_LOD.failed=String(e&&e.message||e);}assetAdd('model',f,'meshLod',perfNow()-t0);});
  (st.active||[]).forEach(function(fx){if(!fx.meshLod&&!fx.holder.isDisposed()){fx._meshFar=undefined;fx.meshLod=meshLodBind(fx.meshes);}});
}
function meshLodApply(fx,far){
  if(fx._meshFar===far)return;fx._meshFar=far;
  for(var i=0;i<fx.meshLod.length;i++){var e=fx.meshLod[i];e.mesh.subMeshes=far?e.far:e.full;}
}

function loadLibrary(scene){
  var st=sceneState(scene);if(st.loading)return st.loading;
  var base=assetBase(),started=Date.now();assetMark('start');
  var meshopt=meshoptReady(); /* fetched alongside the models; the far lists are built once it and the models are in */
  var packWork=fetchClipPack(base); /* likewise: the prepared clips download while the models parse */
  var files={};Object.keys(MODELS).forEach(function(f){Object.keys(MODELS[f]).forEach(function(role){files[MODELS[f][role]]=1;});});
  var modelTotal=Object.keys(files).length,modelsDone=0;
  /* Sidecars (per-model Motion Lab calibrations) only need the file names: fetched from the start,
     applied before the grip solve that reads them. */
  var sideWork=loadSidecars(base,Object.keys(files)).then(function(){return null;});
  loadProgress('models',0,modelTotal,'models');
  st.loading=ensureLoader().then(function(){
    assetMark('loaderReady');if(ASSET.on)ASSET.loaderScriptMs=ASSET.marks.loaderReady-ASSET.marks.start;wrapFbxParse();
    return Promise.all(Object.keys(files).map(function(file){
      return loadContainer(scene,base+'soldiers/'+file,'model',file).then(function(c){
        var t0=ASSET.on?perfNow():0;c._battleFile=file;st.libs[file]=prepareModel(c);st.libs[file].file=file;assetAdd('model',file,'prepare',perfNow()-t0);
        loadProgress('models',++modelsDone,modelTotal,'models');});
    }).concat([loadWeapons(scene,st,base)]));
  }).then(function(){
    /* The sidecars (fetched since the start) and the clips must both be in before retarget/solve. */
    assetMark('modelsWeaponsDone');
    var clipWork=packWork.then(function(pack){
      /* Prepared clips whose spec still matches CLIPS; each other clip file loads once, however
         many keys use it. The pack's source rig names the bones either way. */
      var fromPack=[],missing=[];
      if(pack){st.src=pack.src;st.bones=pack.src.bones;}
      Object.keys(CLIPS).forEach(function(key){var p=pack&&pack.clips[key];if(p&&JSON.stringify(p.spec)===JSON.stringify(CLIPS[key]))fromPack.push(p.clip);else missing.push(key);});
      var byFile=clipsByFile(missing),files=Object.keys(byFile);
      st.clipPack={on:CLIP_PACK_ON,loaded:!!pack,fromPack:fromPack.length,fromFbx:missing.length,fbxFiles:files.length};
      if(pack&&missing.length)console.warn('[ANIM] prepared clips miss '+missing.length+' clip(s) ('+missing.slice(0,5).join(', ')+'); they load from FBX. Rebuild with scripts/build_clip_pack.cjs.');
      var done=0,total=files.length+(pack?1:0);if(pack)done=1;
      loadProgress('clips',done,total,'clips');
      return loadClipFiles(scene,st,base,byFile,function(){loadProgress('clips',++done,total,'clips');}).then(function(list){return fromPack.concat(list);});
    });
    return Promise.all([clipWork,sideWork]).then(function(parts){return parts[0];});
  }).then(function(list){
    /* Binding is one synchronous pass: let the load bar paint that it has started. */
    var L=root.BattleLoading;if(!L||!L.frame)return list;
    L.note('soldiers','binding clips to models…');return L.frame().then(function(){return list;});
  }).then(function(list){
    assetMark('bindClipsStart');
    st.clips={};list.forEach(function(clip){st.clips[clip.key]=clip;});
    Object.keys(st.libs).forEach(function(f){var t0=ASSET.on?perfNow():0;retargetClips(st.libs[f],st.src,st.clips,st.bones);assetAdd('model',f,'retarget',perfNow()-t0);});
    st.animated=[];st.upper=[];st.hips=st.bones.indexOf(BONE.hips);st.spineRoot=st.bones.indexOf(BONE.spine0);
    st.bones.forEach(function(name,i){
      if(list.some(function(c){return!!c.channels[i];}))st.animated.push(i);
      st.upper[i]=isUpper(name);
    });
    Object.keys(st.libs).forEach(function(f){
      var lib=st.libs[f];lib.grips={};
      var measured=SIDE_CONTACTS[f]||SOLDIER_CONTACTS[f];
      if(measured){
        if(measured.right)lib.palms[BONE.rightHand]=new V3(measured.right[0],measured.right[1],measured.right[2]);
        if(measured.left)lib.palms[BONE.leftHand]=new V3(measured.left[0],measured.left[1],measured.left[2]);
        lib.palms[BONE.rightHand+'Source']=measured.right?'stored':lib.palms[BONE.rightHand+'Source'];
        lib.palms[BONE.leftHand+'Source']=measured.left?'stored':lib.palms[BONE.leftHand+'Source'];
      }
      var pistols=['pistol'].concat(weaponFiles('us','pistol'),weaponFiles('ge','pistol')),tg=ASSET.on?perfNow():0;
      solveGrips(lib,lib.clips.aim,st.bones,Object.keys(WEAPON_POINTS).filter(function(k){return pistols.indexOf(k)<0;}));
      solveGrips(lib,lib.clips.pistolIdle,st.bones,pistols);
      assetAdd('model',f,'grips',perfNow()-tg);
      console.log('[ANIM] hand sockets '+f+': R='+lib.palms[BONE.rightHand+'Source']
        +' L='+lib.palms[BONE.leftHand+'Source']
        +' Rverts='+lib.palms[BONE.rightHand+'Vertices']+' Lverts='+lib.palms[BONE.leftHand+'Vertices']);
    });
    hookRender(scene,st);st.ready=true;
    assetMark('ready');if(ASSET.on)ASSET.bindClipsMs=ASSET.marks.ready-ASSET.marks.bindClipsStart;
    meshopt.then(function(M){meshLodInstall(st,M);});
    console.log('[ANIM] FBX soldiers ready: '+MODEL_SET+' '+Object.keys(st.libs).map(function(f){return f.replace('.fbx','')+(st.libs[f].retargeted?'*':'');}).join(' ')+', weapons '+Object.keys(st.weapons||{}).join(' ')+', '+list.length+' clips, '+st.animated.length+' animated bones, '+(Date.now()-started)+' ms'+(SMOOTH_NORMALS?', smoothed normals':''));
    return true;
  }).catch(function(error){
    st.error=error;console.error('[ANIM] FBX soldiers failed to load',error);return false;
  });
  return st.loading;
}

/* ---- binding a soldier -------------------------------------------------------------------- */

/* Bone matrices go to the GPU as shader uniforms, not a float texture per skeleton: on the iPhone
   the per-frame texture updates of ~20 re-posed soldiers stalled the GPU (landscape combat, 1x:
   frames in one refresh 77.6% -> 96.0%; close-ups match within rounding). Uniforms need
   4 x (bones + 1) vertex uniform vectors, and Babylon moves skinning to the CPU when they do not
   fit, so a device keeps bone textures unless it has that plus 128 to spare (66 bones: 396; most
   GPUs have 1024+, some older phones 256). `?boneTextures=1` always uses textures, `=0` always
   uniforms. Decided before a soldier first renders, so his shader is compiled for it. */
var BONE_MODE=(function(){var m=typeof location!=='undefined'&&/[?&]boneTextures=([01])\b/.exec(location.search||'');return m?(m[1]==='0'?'uniforms':'textures'):'auto';})();
var BONES={mode:BONE_MODE,maxVertexUniformVectors:null,uniforms:0,textures:0};
function boneUniforms(scene,k){
  var v=scene.getEngine().getCaps().maxVertexUniformVectors||0;BONES.maxVertexUniformVectors=v;
  var use=BONE_MODE==='uniforms'||(BONE_MODE==='auto'&&v>=4*(k.bones.length+1)+128);
  if(use)BONES.uniforms++;else BONES.textures++;return use;
}
/* Babylon's Mesh clone refreshes a skinned mesh's bounding box by skinning every vertex through its
   bones (~22k vertices, ~14 ms a soldier, nearly all of a bind). Nothing reads a soldier mesh's
   bounds: bind makes them always active and never re-syncs them, and the animation and mesh LODs
   use the soldier's own sphere. So while the model is cloned (synchronously), a clone that already
   has bounds keeps its geometry's bind-pose box. `?cloneBounds=1` clones as Babylon does. */
var CLONE_BOUNDS=typeof location!=='undefined'&&/[?&]cloneBounds=1\b/.test(location.search||'');
function cloneModel(lib){
  var clone=function(){return lib.container.instantiateModelsToScene(function(name){return name;},false,{doNotInstantiate:true});};
  if(CLONE_BOUNDS)return clone();
  var P=BABYLON.Mesh.prototype,own=Object.prototype.hasOwnProperty.call(P,'refreshBoundingInfo'),refresh=P.refreshBoundingInfo;
  P.refreshBoundingInfo=function(){return this.hasBoundingInfo?this:refresh.apply(this,arguments);};
  try{return clone();}finally{if(own)P.refreshBoundingInfo=refresh;else delete P.refreshBoundingInfo;}
}
function bind(soldier,scene,st,lib,faction){
  var inst=cloneModel(lib);
  var holder=new BABYLON.TransformNode('fbxSoldier',scene);holder.parent=soldier.poseRoot;holder.scaling.setAll(lib.scale);
  inst.rootNodes.forEach(function(n){n.parent=holder;});
  inst.animationGroups.forEach(function(g){g.stop();g.dispose();});
  var byName={},meshes=[];
  holder.getDescendants(false).forEach(function(n){
    byName[canon(n.name,lib.scheme)]=n;
    if(n.getTotalVertices&&n.getTotalVertices()>0){
      n.isPickable=false;
      n.alwaysSelectAsActiveMesh=true;
      /* These skinned body meshes are presentation-only: gameplay collision/LOS uses the
         authoritative obstacle/soldier data, and body picking is disabled. Because they are
         always active, synchronizing bounding info every frame cannot affect visibility either. */
      n.doNotSyncBoundingInfo=true;
      meshes.push(n);
    }
  });
  holder.onDisposeObservable.add(function(){inst.skeletons.forEach(function(k){k.dispose();});});
  /* Babylon's Skeleton.prepare copies every linked bone node into its bone each frame, which marks
     the bones dirty and rebuilds and re-uploads all bone matrices even when nothing moved. Our bone
     nodes only change when applyPose runs, so a soldier's skeletons prepare once per pose (poseSerial,
     bumped by the render hook) and otherwise keep the matrices of the pose on screen: the animation
     LOD's held soldiers (far, off-screen, static) cost no skeleton work. `lod.skeletons=false` or
     `?animLod=0` prepares every frame as before; `prepare(true)` (a forced prepare) always runs. */
  var fxRef={serial:1};
  inst.skeletons.forEach(function(k){
    if(boneUniforms(scene,k))k.useTextureToStoreBoneMatrices=false;
    k._fbxPrepared=0;
    k.prepare=function(force){
      if(!force&&LOD.on&&LOD.skeletons&&k._fbxPrepared===fxRef.serial)return;
      k._fbxPrepared=fxRef.serial;
      return BABYLON.Skeleton.prototype.prepare.apply(this,arguments);
    };
  });

  /* The weapon socket follows the hand but stays parented to the soldier root, so it inherits
     neither model scale nor handedness. */
  var socket=soldier.weaponSocket;socket.parent=soldier.root;if(!socket.rotationQuaternion)socket.rotationQuaternion=new Q();
  socket._fbxFaction=faction;

  /* Soldier root -> each hand. The render pass composes these chains itself (see handChain);
     the left chain exists so the support hold can read the left web each frame. */
  var hand=byName[BONE.rightHand],path=[];for(var n=hand;n;n=n.parent)path.unshift(n);
  var pathL=[];for(n=byName[BONE.leftHand];n;n=n.parent)pathL.unshift(n);
  var nodes=st.bones.map(function(name){var node=byName[name]||null;if(node&&!node.rotationQuaternion)node.rotationQuaternion=new Q();return node;});
  var fx={lib:lib,st:st,nodes:nodes,holder:holder,meshes:meshes,root:soldier.root,socket:socket,hand:hand,path:path,chain:path.map(function(){return new MX();}),spineAt:path.indexOf(byName[BONE.spine2]),
    pathL:pathL,chainL:pathL.map(function(){return new MX();}),spineAtL:pathL.indexOf(byName[BONE.spine2]),
    poseRef:fxRef,weaponModel:null,twoHand:0,yawRate:0,lastYaw:null,turning:false,weaponKind:'rifle',
    lower:{entries:[]},upper:{entries:[]},overlay:0,overlayTarget:0,stance:null,transition:null,sector:0,family:null,moving:false,
    vx:0,vz:0,speed:0,lastX:null,lastZ:null,aim:0,aimWanted:false,aimAt:null,spine:byName[BONE.spine2]||null,fireHold:0,fireShot:0,fireSeen:0,reloadShot:0,reloadSeen:0,reloadDuration:2.5,death:null};
  soldier._fbx=fx;
  soldier.animationBinding={backend:BACKEND,tags:TAGS,play:play,update:update};
  fx.meshLod=meshLodBind(meshes);
  st.active.push(fx);
  return fx;
}

/* ---- clip layers -------------------------------------------------------------------------- */

function setClip(layer,clip,rate,fade,restart,keepPhase){
  var entries=layer.entries,top=entries[entries.length-1];
  if(top&&top.clip===clip&&!restart){top.rate=rate;return top;}
  var t=0;if(keepPhase&&top&&top.clip.loop&&clip.loop)t=(top.t/top.clip.duration)*clip.duration;
  var entry={clip:clip,t:t,rate:rate,w:entries.length?0:1};
  entries.push(entry);layer.fade=Math.max(.01,fade);
  if(entries.length>4)entries.splice(0,entries.length-4);
  return entry;
}
function advanceLayer(layer,dt){
  var entries=layer.entries,n=entries.length;if(!n)return;
  for(var i=0;i<n;i++){var e=entries[i],d=e.clip.duration;e.t+=dt*e.rate;e.t=e.clip.loop?((e.t%d)+d)%d:Math.min(d,e.t);}
  var top=entries[n-1],rest=0;top.w=Math.min(1,top.w+dt/(layer.fade||.25));
  for(i=0;i<n-1;i++)rest+=entries[i].w;
  var scale=rest>0?(1-top.w)/rest:0;
  for(i=n-2;i>=0;i--){entries[i].w*=scale;if(entries[i].w<.002)entries.splice(i,1);}
  if(entries.length===1)top.w=1;
}
function topEntry(layer){return layer.entries[layer.entries.length-1]||null;}

/* ---- simulation-side state machine -------------------------------------------------------- */

function play(tag,data,soldier){
  var fx=soldier&&soldier._fbx;if(!fx)return;
  /* Every round of one trigger pull arrives on the same AI tick; a round after the first (delay>0)
     marks the pull as a burst, whatever the weapon kind (the FG 42 bursts only inside autoWithin). */
  if(tag===TAGS.fire){fx.fireShot++;fx.fireBurst=+(data&&data.delay)>0;}
  else if(tag===TAGS.hit)fx.hitShot=(fx.hitShot||0)+1;
  else if(tag===TAGS.reload){fx.reloadShot++;fx.reloadDuration=+(data&&data.duration)||(soldier.weapon&&soldier.weapon.stats&&soldier.weapon.stats.reloadTime)||2.5;}
}
function clamp(v,a,b){return v<a?a:(v>b?b:v);}
function sectorOf(fx,angle){
  /* Eight-way sector with a little stickiness so a diagonal path does not flicker between clips. */
  var step=Math.PI/4,current=fx.sector,diff=Math.atan2(Math.sin(angle-current*step),Math.cos(angle-current*step));
  if(Math.abs(diff)<step*.5+.14)return current;
  return((Math.round(angle/step)%8)+8)%8;
}
function familyOf(fx,clips,speed,families){
  var best=null,bestCost=Infinity;
  families.forEach(function(f){
    var natural=clips[f+'0'].speed||1,cost=Math.abs(Math.log(Math.max(.05,speed)/natural));
    if(f===fx.family)cost-=.18;
    if(cost<bestCost){bestCost=cost;best=f;}
  });
  return best;
}
function update(soldier,state,dt){
  var fx=soldier._fbx;if(!fx)return false;
  var clips=fx.lib.clips;dt=Math.max(0,+dt||0);
  if(soldier.weapon&&soldier.weapon.kind){fx.weaponKind=soldier.weapon.kind;fx.weaponModel=soldier.weapon.model||null;fx.weapon=soldier.weapon;}

  /* Ground velocity from what navigation actually did this step, in the soldier's own frame. */
  var p=soldier.root.position;
  if(fx.lastX==null||dt<=0){fx.lastX=p.x;fx.lastZ=p.z;}
  var vx=dt>0?(p.x-fx.lastX)/dt:0,vz=dt>0?(p.z-fx.lastZ)/dt:0;fx.lastX=p.x;fx.lastZ=p.z;
  if(vx*vx+vz*vz>225){vx=fx.vx;vz=fx.vz;} /* respawn/teleport: not motion, keep the last estimate */
  var k=1-Math.exp(-dt*9);fx.vx+=(vx-fx.vx)*k;fx.vz+=(vz-fx.vz)*k;fx.speed=Math.sqrt(fx.vx*fx.vx+fx.vz*fx.vz);

  if(soldier.dead){
    fx.bipod=false;
    if(!fx.death){
      /* Pick from the pool for how he fell; a soldier cut down at a run carries his momentum. */
      var pool=fx.stance==='prone'?'prone':(fx.stance==='crouch'?'crouch':(fx.speed>2.4&&fx.moving&&Math.abs(fx.heading||0)<.8?'running':(soldier.deathVariant==='front'||soldier.deathVariant==='back'?soldier.deathVariant:'side')));
      var keys=DEATH_POOLS[pool].filter(function(k){return!!clips[k];}),v=keys[Math.floor(Math.random()*keys.length)]||'deathSide';
      fx.death=v;setClip(fx.lower,clips[v],1,.18,true,false);
    }
    fx.overlayTarget=0;fx.aimWanted=false;fx.supportReleased=true;advance(fx,dt);return true;
  }
  fx.death=null;

  var stance=soldier.prone?'prone':(soldier.crouching?'crouch':'stand');
  if(fx.stance==null)fx.stance=stance;
  if(stance!==fx.stance){
    /* Crouch<->prone clips carry the body through the ground change (from standing too). The
       stand<->crouch clips only play from a standstill; on the move the change is a blend, so the
       legs keep walking. */
    var still=!fx.moving,from=fx.stance;
    fx.transition=stance==='prone'?'crouchToProne':(from==='prone'?'proneToCrouch':(still&&from==='stand'?'standToCrouch':(still&&stance==='stand'?'crouchToStand':null)));
    var TR_RATE={crouchToProne:1.35,proneToCrouch:1.35,standToCrouch:1.8,crouchToStand:1.5};
    if(fx.transition&&clips[fx.transition])setClip(fx.lower,clips[fx.transition],TR_RATE[fx.transition],.2,true,false);else fx.transition=null;
    fx.stance=stance;
  }
  if(fx.transition){
    var tr=topEntry(fx.lower),quick=fx.transition==='standToCrouch'||fx.transition==='crouchToStand';
    /* A soldier who sets off mid stand/crouch change drops the clip and walks. */
    if(tr&&tr.clip.key===fx.transition&&tr.t<tr.clip.duration-.3*tr.rate&&!(quick&&fx.speed>.5)){fx.overlayTarget=0;fx.aimWanted=false;fx.bipod=false;fx.supportReleased=true;advance(fx,dt);return true;}
    fx.transition=null;
  }

  fx.bipod=stance==='prone';
  var speed=fx.speed,moving=stance==='prone'?(fx.moving?speed>.1:speed>.22):(fx.moving?speed>.18:speed>.35);fx.moving=moving;
  var yaw=soldier.root.rotation.y||0,sin=Math.sin(yaw),cos=Math.cos(yaw);
  var forward=fx.vx*sin+fx.vz*cos,right=fx.vx*cos-fx.vz*sin,angle=Math.atan2(right,forward);
  fx.heading=angle;
  /* Turning on the spot: yaw rate of the root this step, smoothed, with hysteresis. */
  if(fx.lastYaw==null)fx.lastYaw=yaw;
  var dyaw=Math.atan2(Math.sin(yaw-fx.lastYaw),Math.cos(yaw-fx.lastYaw));fx.lastYaw=yaw;
  fx.yawRate+=((dt>0?dyaw/dt:0)-fx.yawRate)*k;
  var turning=!moving&&Math.abs(fx.yawRate)>(fx.turning?.35:.6);fx.turning=turning;
  var pistol=fx.weaponKind==='pistol',clip,rate=1;
  if(turning){
    /* Positive yaw turns toward +X, i.e. to the soldier's right. */
    var side=fx.yawRate>0?'Right':'Left',key=stance==='prone'?'proneTurn'+side:(stance==='crouch'?'crouchTurn'+side:'turn'+side);
    clip=clips[key];rate=clamp(Math.abs(fx.yawRate)/Math.max(.2,clip.turnRate||1.5),.5,2);fx.family=null;
  }
  else if(!moving){
    var idleKey=stance==='prone'?'proneIdle':(stance==='crouch'?(pistol?'pistolKneel':'crouchIdle'):(pistol?'pistolIdle':null));
    if(!idleKey){
      /* A standing rifleman at rest picks an idle variant when he stops, and keeps it. */
      if(!fx.idleKey){var pool=IDLE_VARIANTS.filter(function(k2){return!!clips[k2];});fx.idleKey=pool[Math.floor(Math.random()*pool.length)];}
      idleKey=fx.idleKey;
    }
    clip=clips[idleKey];fx.family=null;
  }
  if(moving)fx.idleKey=null;
  if(turning||!moving){}
  else if(stance==='prone'){clip=clips[Math.abs(angle)<1.9?'proneForward':'proneBackward'];rate=clamp(speed/(clip.speed||.3),.6,2.2);}
  else{
    var families=stance==='crouch'?['crouch','crouchRun']:(pistol?['pistolWalk','pistolRun']:['walk','run','sprint']);
    var family=familyOf(fx,clips,speed,families);fx.family=family;
    fx.sector=sectorOf(fx,angle);clip=clips[family+fx.sector];rate=clamp(speed/(clip.speed||1.5),.55,1.8);
  }
  setClip(fx.lower,clip,rate,.25,false,true);

  var over=null,orate=1,restart=false;
  fx.fireHold=Math.max(0,fx.fireHold-dt);fx.hitHold=Math.max(0,(fx.hitHold||0)-dt);
  if(fx.fireShot!==fx.fireSeen){fx.fireSeen=fx.fireShot;fx.fireHold=.9;restart=!fx.fireBurst&&!pistol;}
  if(fx.reloadShot!==fx.reloadSeen){fx.reloadSeen=fx.reloadShot;restart=true;}
  var hitKey=stance==='prone'?'hitProne':(stance==='crouch'?'hitCrouch':(pistol?'pistolHit':(fx.speed>2.4?'hitRun':'hit')));
  var HIT_RATE={hit:1,hitCrouch:1.6,hitProne:1.2,hitRun:1,pistolHit:2.2};
  if((fx.hitShot||0)!==(fx.hitSeen||0)){fx.hitSeen=fx.hitShot;fx.hitKey=hitKey;fx.hitHold=clips[hitKey].duration/HIT_RATE[hitKey];restart=true;}
  /* Suppressive fire landing close extends suppressedUntil; a fresh extension may be a flinch (at
     most one per soldier every ~10 s, not every time, never over firing or reloading). */
  fx.flinchCool=Math.max(0,(fx.flinchCool||0)-dt);fx.flinchHold=Math.max(0,(fx.flinchHold||0)-dt);
  var supp=+soldier.suppressedUntil||0;
  if(supp>(fx.lastSupp||0)+.05&&fx.lastSupp!=null&&fx.flinchCool<=0&&stance!=='prone'&&!soldier.reloading&&fx.fireHold<=0){
    fx.flinchCool=10;
    if(Math.random()<.6){fx.flinchKey=stance==='crouch'?'flinchCrouch':'flinch';fx.flinchHold=clips[fx.flinchKey].duration/FLINCH_RATE;restart=true;}
  }
  fx.lastSupp=supp;
  if(fx.hitHold>0){over=fx.hitKey;orate=HIT_RATE[over];}
  else if(fx.flinchHold>0&&fx.fireHold<=0&&!soldier.reloading){over=fx.flinchKey;orate=FLINCH_RATE;}
  else if(soldier.reloading){
    over=stance==='prone'?'reloadProne':(stance==='crouch'?'reloadCrouch':'reload');
    orate=clips[over].duration/Math.max(.5,fx.reloadDuration);
  }else if(fx.fireHold>0){
    var auto=!!fx.fireBurst;
    if(pistol&&stance!=='prone'){over=stance==='crouch'?'pistolKneel':'pistolIdle';restart=false;}
    else{over=stance==='prone'?(auto?'fireAutoProne':'fireProne'):(auto?'fireAuto':(stance==='crouch'?'fireCrouch':'fire'));orate=auto?1:1.3;}
  }else if(soldier.target&&stance!=='prone'){over=pistol?(stance==='crouch'?'pistolKneel':'pistolIdle'):(stance==='crouch'?'crouchAim':'aim');restart=false;}
  else restart=false;
  if(over){setClip(fx.upper,clips[over],orate,.16,restart,false);fx.overlayTarget=1;}else fx.overlayTarget=0;
  fx.supportReleased=!!(soldier.reloading||fx.hitHold>0||fx.flinchHold>0);
  /* The pistol cup times a hit or flinch release from that clip's own motion (cupEnvelope). */
  if(fx.hitHold>0){fx.cupClipKey=fx.hitKey;fx.cupClipT=clips[fx.hitKey].duration-fx.hitHold*HIT_RATE[fx.hitKey];}
  else if(over&&over===fx.flinchKey){fx.cupClipKey=over;fx.cupClipT=clips[over].duration-fx.flinchHold*FLINCH_RATE;}
  else fx.cupClipKey=null;
  var t=soldier.target&&soldier.target.root&&soldier.target.root.position;
  fx.aimWanted=!soldier.reloading&&(!!t||fx.fireHold>0);fx.aimAt=t||null;
  advance(fx,dt);
  return true;
}
function advance(fx,dt){
  advanceLayer(fx.lower,dt);advanceLayer(fx.upper,dt);
  var step=dt/.22;fx.overlay=fx.overlay<fx.overlayTarget?Math.min(fx.overlayTarget,fx.overlay+step):Math.max(fx.overlayTarget,fx.overlay-step);
  fx.aim=fx.aimWanted?Math.min(1,fx.aim+dt/.3):Math.max(0,fx.aim-dt/.3);
}

/* ---- render-side pose writing ------------------------------------------------------------- */

var qa=new Q(),qb=new Q(),qc=new Q(),qd=new Q(),hipsLower=new Q(),pa=new V3(),pb=new V3(),socketWorld=new MX(),rootInv=new MX(),sScale=new V3(),sRot=new Q(),sPos=new V3(),ONE=new V3(1,1,1);
function sampleLayer(layer,bone,q,pos){
  var entries=layer.entries,total=0,hasPos=false;q.set(0,0,0,0);pos.set(0,0,0);
  for(var i=0;i<entries.length;i++){
    var e=entries[i],ch=e.clip.channels[bone];if(!ch||e.w<=0)continue;
    var f=e.t*FPS,last=e.clip.frames-1,i0=Math.min(last,Math.floor(f)),i1=Math.min(last,i0+1),u=Math.min(1,Math.max(0,f-i0)),w=e.w;
    if(ch.rot){
      var r=ch.rot,a=i0*4,b=i1*4,x=r[a]+(r[b]-r[a])*u,y=r[a+1]+(r[b+1]-r[a+1])*u,z=r[a+2]+(r[b+2]-r[a+2])*u,ww=r[a+3]+(r[b+3]-r[a+3])*u;
      if(total>0&&x*q.x+y*q.y+z*q.z+ww*q.w<0)w=-w;
      q.x+=x*w;q.y+=y*w;q.z+=z*w;q.w+=ww*w;
    }
    if(ch.pos){var s=ch.pos,c=i0*3,d=i1*3,wp=Math.abs(w);pos.x+=(s[c]+(s[d]-s[c])*u)*wp;pos.y+=(s[c+1]+(s[d+1]-s[c+1])*u)*wp;pos.z+=(s[c+2]+(s[d+2]-s[c+2])*u)*wp;hasPos=true;}
    total+=Math.abs(e.w);
  }
  if(total<=0)return 0;
  q.normalize();if(hasPos)pos.scaleInPlace(1/total);
  return hasPos?2:1;
}
function showBipod(fx){
  var w=fx.weapon;if(!w||!w.bipodMesh||w.bipodMesh.isDisposed())return;
  if(w.bipodMesh.isEnabled()!==!!fx.bipod){w.bipodMesh.setEnabled(!!fx.bipod);w.mesh.setEnabled(!fx.bipod);}
}
/* Sidecar left-arm dials: degree offsets added onto the animated wrist/elbow/shoulder
   (same nodes + yaw/pitch/roll order as the Motion Lab preview), rotations only. Applied
   inside the pose loop right after the clip pose is written, so every frame starts from
   the clean clip pose and the offsets never accumulate. `w` fades them with the cup (the
   pose loop passes 1 for the wrist, which stays on). */
var dialQ=new Q();
function dialQuat(deg,w){
  var d=deg||[0,0,0],k=(w==null?1:w)*Math.PI/180;
  Q.RotationYawPitchRollToRef((+d[1]||0)*k,(+d[0]||0)*k,(+d[2]||0)*k,dialQ);
  return dialQ;
}
/* Pistol support cup, the same rule as the Motion Lab (labSolveCup): an analytic two-bone
   solve. The elbow bends until the forearm-plus-hand span reaches the right-hand-local target
   (law of cosines, in the plane the clip bends the arm in), then the shoulder swings it on; the
   wrist keeps its clip + dial pose. Solved from each frame's clean pose, so the result is a
   continuous function of the clip: no search, no cached correction, no filter. Near full arm
   length the span eases off (soft IK) instead of locking the elbow straight.
   Release is a weight (fx.cupW) that fades the cup and the shoulder/elbow dials; the wrist dial
   stays on. A hit or flinch sets its own timing from the clip (cupEnvelope): the cup lets go
   `lag` after the clip first pulls the hands apart faster than speedOn and comes back `lag`
   after it last does, done by the clip's end; a clip that never pulls them apart keeps the cup.
   Reload, stance transitions and death let go over releaseSec and return over recaptureSec. A
   clip hand more than reachFull from the target lets go over a 10 cm fade, eased so it takes
   at least reachOutSec. */
var CUP={reachFull:.20,reachNone:.30,soft:.03,releaseSec:.25,recaptureSec:.30,reachOutSec:.15,reachInSec:.30,speedOn:.75,lag:.06};
function cupSmooth(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
function cupEase(cur,goal,dt,outSec,inSec){return goal<cur?Math.max(goal,cur-dt/outSec):Math.min(goal,cur+dt/inSec);}
function cupDt(fx){
  /* With animation LOD a soldier may be posed every few frames: ease over the time since his last pose. */
  if(LOD.on&&fx._poseDt>0)return Math.max(1/240,Math.min(.25,fx._poseDt));
  var engine=fx.holder.getScene().getEngine();return Math.max(1/240,Math.min(.05,(engine.getDeltaTime()/1000)||1/60));
}
function cupChainWorld(node){var up=[];for(var n=node;n;n=n.parent)up.push(n);for(var k=up.length-1;k>=0;k--)up[k].computeWorldMatrix(true);}
/* Once per model and clip: pose the library skeleton at every clip frame and record how fast
   contact B moves in the right hand's frame (metres per second). */
function cupEnvelope(fx,key){
  var lib=fx.lib,cache=lib.cupEnv||(lib.cupEnv={});if(Object.prototype.hasOwnProperty.call(cache,key))return cache[key];
  var clip=lib.clips[key],bones=fx.st.bones,nodes=lib.nodes,anchor=lib.palms&&lib.palms[BONE.leftHand];
  var L=nodes[BONE.leftHand],R=nodes[BONE.rightHand];if(!clip||!bones||!anchor||!L||!R)return cache[key]=null;
  var saved=[];
  bones.forEach(function(name,i){var n=nodes[name];if(n&&clip.channels[i])saved.push([n,n.position.clone(),n.rotationQuaternion?n.rotationQuaternion.clone():null,clip.channels[i]]);});
  var rel=[],inv=new MX();
  for(var f=0;f<clip.frames;f++){
    saved.forEach(function(e){
      var n=e[0],ch=e[3];
      if(ch.rot){if(!n.rotationQuaternion)n.rotationQuaternion=new Q();n.rotationQuaternion.set(ch.rot[f*4],ch.rot[f*4+1],ch.rot[f*4+2],ch.rot[f*4+3]);}
      if(ch.pos)n.position.set(ch.pos[f*3],ch.pos[f*3+1],ch.pos[f*3+2]);
    });
    cupChainWorld(L);cupChainWorld(R);R.getWorldMatrix().invertToRef(inv);
    var scale=V3.TransformNormal(V3.Right(),R.getWorldMatrix()).length()*lib.scale;
    rel.push(V3.TransformCoordinates(V3.TransformCoordinates(anchor,L.getWorldMatrix()),inv).scale(scale));
  }
  saved.forEach(function(e){e[0].position.copyFrom(e[1]);if(e[2])e[0].rotationQuaternion.copyFrom(e[2]);});
  cupChainWorld(L);cupChainWorld(R);
  var onset=-1,settle=-1;
  for(var i=1;i<rel.length;i++)if(V3.Distance(rel[i],rel[i-1])*FPS>CUP.speedOn){if(onset<0)onset=i;settle=i;}
  return cache[key]={duration:(rel.length-1)/FPS,onset:onset<0?null:onset/FPS,settle:settle<0?null:settle/FPS};
}
function cupEnvelopeWeight(env,t){
  if(!env||env.onset===null)return 1;
  var off=env.onset+CUP.lag,back=Math.min(env.settle+CUP.lag,env.duration-CUP.recaptureSec),release=1-cupSmooth((t-off)/CUP.releaseSec);
  return t<back?release:Math.max(release,cupSmooth((t-back)/CUP.recaptureSec));
}
function cupReleaseWeight(fx){
  var dt=cupDt(fx),held=fx.cupClipKey?cupEnvelopeWeight(cupEnvelope(fx,fx.cupClipKey),fx.cupClipT):1;
  var ramp=!!(fx.death||fx.transition||(fx.supportReleased&&!fx.cupClipKey));
  fx.cupRamp=cupEase(fx.cupRamp==null?1:fx.cupRamp,ramp?0:1,dt,CUP.releaseSec,CUP.recaptureSec);
  /* Eased at twice the ramp rates, only so a clip restarting mid-release cannot jump. */
  return fx.cupW=cupEase(fx.cupW==null?1:fx.cupW,Math.min(cupSmooth(fx.cupRamp),held),dt,CUP.releaseSec/2,CUP.recaptureSec/2);
}
var cupTurnQ=new Q(),cupTurnM=new MX(),cupRotM=new MX(),cupInvM=new MX();
/* Turn `joint` so world direction `from` moves toward `to` by `w`. Both are carried into the
   parent's space first, so mirrored or non-uniformly scaled parents still land the direction. */
function cupTurn(joint,from,to,w){
  if(w<=0||from.lengthSquared()<1e-12||to.lengthSquared()<1e-12)return;
  var f=from,t=to;
  if(joint.parent){joint.parent.getWorldMatrix().invertToRef(cupInvM);f=V3.TransformNormal(from,cupInvM);t=V3.TransformNormal(to,cupInvM);}
  Q.FromUnitVectorsToRef(f.normalizeToNew(),t.normalizeToNew(),cupTurnQ);
  if(w<1)Q.SlerpToRef(Q.Identity(),cupTurnQ,w,cupTurnQ);
  if(!joint.rotationQuaternion)joint.rotationQuaternion=Q.FromEulerVector(joint.rotation);
  cupTurnQ.toRotationMatrix(cupTurnM);joint.rotationQuaternion.toRotationMatrix(cupRotM);
  Q.FromRotationMatrixToRef(cupRotM.multiply(cupTurnM),joint.rotationQuaternion);joint.rotationQuaternion.normalize();
}
function applyPistolCup(fx,targetLocal,release){
  var palms=fx.lib.palms,right=fx.path[fx.path.length-1],left=fx.pathL[fx.pathL.length-1];
  var anchor=palms&&palms[BONE.leftHand];if(!targetLocal||!anchor||!right||!left)return null;
  var fore=left.parent,arm=fore&&fore.parent;if(!arm)return null;
  var up=[];for(var n=arm.parent;n;n=n.parent)up.push(n);for(var k=up.length-1;k>=0;k--)up[k].computeWorldMatrix(true);
  function endpoint(){arm.computeWorldMatrix(true);fore.computeWorldMatrix(true);left.computeWorldMatrix(true);return V3.TransformCoordinates(anchor,left.getWorldMatrix());}
  right.computeWorldMatrix(true);
  var target=V3.TransformCoordinates(new V3(targetLocal[0],targetLocal[1],targetLocal[2]),right.getWorldMatrix());
  var B=endpoint(),startError=V3.Distance(B,target);
  var reach=fx.cupReach=cupEase(fx.cupReach==null?1:fx.cupReach,cupSmooth((CUP.reachNone-startError)/(CUP.reachNone-CUP.reachFull)),cupDt(fx),CUP.reachOutSec,CUP.reachInSec),w=release*reach;
  if(w>0){
    var S=arm.getAbsolutePosition().clone(),E=fore.getAbsolutePosition().clone(),upper=E.subtract(S),lower=B.subtract(E),a=upper.length(),b=lower.length();
    if(a>1e-6&&b>1e-6){
      var knee=a+b-CUP.soft,d=V3.Distance(S,target);if(d>knee)d=a+b-CUP.soft*Math.exp(-(d-knee)/CUP.soft);d=Math.max(Math.abs(a-b)+1e-4,d);
      var cosE=Math.max(-1,Math.min(1,(a*a+b*b-d*d)/(2*a*b))),u=upper.scale(-1/a),side=lower.subtract(u.scale(V3.Dot(lower,u)));
      if(side.lengthSquared()>1e-10){side.normalize();cupTurn(fore,lower,u.scale(cosE).add(side.scale(Math.sqrt(1-cosE*cosE))),w);B=endpoint();}
      cupTurn(arm,B.subtract(S),target.subtract(S),w);
    }
  }
  var finalError=V3.Distance(endpoint(),target);
  fx.cupMode=release<1?(release>0?'releasing':'released'):(reach<1?'out-of-reach':'tracking');
  return{error:finalError,guarded:reach<1,released:release<1,weight:w};
}
var poseGot=[],poseRan={weapon:false,aim:false,support:false};
function applyPose(fx){
  var on=POSE.on,t=on?perfNow():0,t1=0;POSE.seen=0;
  showBipod(fx);
  var st=fx.st,nodes=fx.nodes,animated=st.animated,overlay=fx.overlay>.001&&fx.upper.entries.length;
  var dialKey=fx.weaponModel||fx.weaponKind;
  /* Arm dials are the pistol support cup only (same rule as the Motion Lab preview):
     stray dial values stored on a long-gun slot stay inert here too. */
  var dialPistol=dialKey==='pistol'||/m1911a1|p38/i.test(dialKey||'');
  var dials=dialPistol?armDegFor(fx.lib.file,dialKey):null;
  var leftGrip=dialPistol?leftGripFor(fx.lib.file,dialKey):null;
  if(on){t1=perfNow();poseLayer('setup',t1-t);t=t1;}
  var cupW=dials||leftGrip?cupReleaseWeight(fx):1;
  if(on){t1=perfNow();if(dials||leftGrip)poseLayer('support',t1-t);t=t1;}
  var wrDial=wristRFor(fx.lib.file,dialKey),wrNode=null;
  if(wrDial){
    var ri=st.bones?st.bones.indexOf(BONE.rightHand):-1;
    wrNode=(ri>=0&&nodes[ri])||null;
  }
  var wristNode=null,elbowNode=null,shoulderNode=null;
  if(dials){
    var li=st.bones?st.bones.indexOf(BONE.leftHand):-1;
    wristNode=(li>=0&&nodes[li])||null;
    elbowNode=wristNode&&wristNode.parent;
    shoulderNode=elbowNode&&elbowNode.parent;
    // Fall back to canon bone names when the parent chain is unavailable.
    if(!elbowNode||!shoulderNode){
      var ei=st.bones?st.bones.indexOf('leftforearm'):-1,si=st.bones?st.bones.indexOf('leftarm'):-1;
      if(!elbowNode&&ei>=0)elbowNode=nodes[ei]||null;
      if(!shoulderNode&&si>=0)shoulderNode=nodes[si]||null;
    }
  }
  if(on){t1=perfNow();poseLayer('setup',t1-t);t=t1;}
  /* Base pass: the lower (stance/locomotion) layer for every animated bone. */
  var n,i,node,got=poseGot;
  for(n=0;n<animated.length;n++){
    i=animated[n];node=nodes[i];got[n]=0;if(!node)continue;
    var g=sampleLayer(fx.lower,i,qa,pa);got[n]=g;if(!g)continue;
    if(i===st.hips)hipsLower.copyFrom(qa);
    node.rotationQuaternion.copyFrom(qa);
    if(g===2)node.position.copyFrom(pa);
  }
  if(on){t1=perfNow();poseLayer('base',t1-t);t=t1;}
  /* Overlay pass: aim, fire or reload on the upper body, blended over the base by fx.overlay. */
  if(overlay){
    for(n=0;n<animated.length;n++){
      i=animated[n];node=nodes[i];if(!node||!st.upper[i])continue;
      var up=sampleLayer(fx.upper,i,qb,pb);if(!up)continue;
      /* The overlay's torso keeps the orientation it has in its own clip, re-expressed under the
         hips the legs are playing. Copying the spine's hips-local rotation instead would inherit
         the locomotion hips' twist and lean, and the rifle would stop pointing at the target. */
      if(i===st.spineRoot&&sampleLayer(fx.upper,st.hips,qc,pb)){qc.multiplyToRef(qb,qd);Q.InverseToRef(hipsLower,qc);qc.multiplyToRef(qd,qb);}
      if(!got[n]){node.rotationQuaternion.copyFrom(qb);got[n]=1;}
      else{qa.copyFrom(node.rotationQuaternion);if(Q.Dot(qa,qb)<0)qb.scaleInPlace(-1);Q.SlerpToRef(qa,qb,fx.overlay,qa);node.rotationQuaternion.copyFrom(qa);}
    }
    if(on){t1=perfNow();poseLayer('overlay',t1-t);t=t1;}
  }
  /* Sidecar dials on the clean clip pose: the pistol cup's left-arm offsets and the right-wrist
     dial for straight stocks (same yaw/pitch/roll order as the lab's R wrist dial, applied ahead
     of the hand chains so the grip anchor, and the finger, rides in the corrected hand; ungated
     by weapon, as the lab previews it). */
  if(dials||(wrDial&&wrNode)){
    for(n=0;n<animated.length;n++){
      if(!got[n])continue;node=nodes[animated[n]];
      if(dials){
        var dd=null;
        if(node===wristNode)dd=dials.wrist;
        else if(node===elbowNode)dd=dials.elbow;
        else if(node===shoulderNode)dd=dials.shoulder;
        if(dd&&(dd[0]||dd[1]||dd[2]))node.rotationQuaternion.multiplyInPlace(dialQuat(dd,node===wristNode?1:cupW));
      }
      if(wrNode&&node===wrNode&&wrDial)node.rotationQuaternion.multiplyInPlace(dialQuat(wrDial));
    }
    if(on){t1=perfNow();poseLayer('dials',t1-t);t=t1;}
  }
  var ran=poseRan;ran.weapon=ran.aim=ran.support=false;
  /* Weapon follows the hands: the rigid right-web socket is the base; the support hold then
     swings long guns so the fore-end line passes through the left web (pistols have no fore
     line and keep the rigid hold). Socket world is expressed under the soldier root. */
  var key=fx.weaponModel&&fx.lib.grips&&fx.lib.grips[fx.weaponModel]?fx.weaponModel:fx.weaponKind;
  var grip=fx.lib.grips&&(fx.lib.grips[key]||fx.lib.grips.rifle),points=pointsFor(fx.lib.file,key)||WEAPON_POINTS.rifle;
  if(!grip||!fx.hand){if(on)poseInputs(fx,ran);return;}
  ran.weapon=true;
  fx.leftGripErrorCm=null;POSE.holdSupport=0;
  handChain(fx.path,fx.chain,0);if(fx.chainL.length)handChain(fx.pathL,fx.chainL,0);holdWeapon(fx,grip,points);
  if(on){t1=perfNow();poseLayer('weapon',t1-t-POSE.holdSupport);poseLayer('support',POSE.holdSupport);POSE.holdSupport=0;t=t1;}
  ran.support=fx.supportReason!=='one-hand'&&fx.supportReason!=='released';
  if(fx.aim>.01&&fx.spineAt>0){
    ran.aim=true;
    if(aimSpine(fx)){handChain(fx.path,fx.chain,fx.spineAt);if(fx.chainL.length&&fx.spineAtL>0)handChain(fx.pathL,fx.chainL,fx.spineAtL);holdWeapon(fx,grip,points);}
    if(on){t1=perfNow();poseLayer('aim',t1-t-POSE.holdSupport);if(POSE.holdSupport)poseLayer('support',POSE.holdSupport);POSE.holdSupport=0;t=t1;}
  }
  var leftSnap=leftGrip?applyPistolCup(fx,leftGrip,cupW):null;
  if(leftSnap){
    fx.leftGripErrorCm=leftSnap.error*100;
    if(fx.chainL.length)handChain(fx.pathL,fx.chainL,fx.spineAtL>0?fx.spineAtL:0);
  }else{fx.cupMode=leftGrip?'unavailable':'off';}
  if(leftGrip){ran.support=true;if(on){t1=perfNow();poseLayer('support',t1-t);t=t1;}}
  /* Body-shape and role scaling must not stretch the rifle: keep it at world scale 1. */
  socketWorld.decompose(sScale,sRot,sPos);MX.ComposeToRef(ONE,sRot,sPos,socketWorld);
  fx.chain[0].invertToRef(rootInv);socketWorld.multiplyToRef(rootInv,socketWorld);
  socketWorld.decompose(sScale,fx.socket.rotationQuaternion,fx.socket.position);fx.socket.scaling.copyFrom(sScale);
  if(on){poseLayer('weapon',perfNow()-t);poseInputs(fx,ran);}
}
/* Two-hand hold. The right web and left web are the two attachment points. Pick the point within
   the weapon's fore-end range whose distance from the grip equals the posed hand spacing, then
   map that grip-to-fore vector exactly onto the hand-to-hand vector. The rigid right-hand pose
   supplies only the roll around this axis. Released-hand actions keep the rigid pose. */
var hR=new V3(),hL=new V3(),hV=new V3(),hA=new V3(),hUp=new V3(),hX=new V3(),hY=new V3(),hDir=new V3(),hG=new V3(),hFore=new V3(),hS=new V3(),hP=new V3(),hQ=new Q(),hQw=new Q(),hQl=new Q(),hLa=new V3(),hLy=new V3(),hLx=new V3();
function holdWeapon(fx,grip,points){
  grip.multiplyToRef(fx.chain[fx.chain.length-1],socketWorld);
  if(POSE.on){var t=perfNow();supportHold(fx,points);POSE.holdSupport+=perfNow()-t;}else supportHold(fx,points);
}
function supportHold(fx,points){
  var palms=fx.lib.palms,f=points&&points.fore,g=points&&points.grip;fx.twoHand=0;fx.supportErrorCm=null;
  fx.supportHandM=fx.supportNearM=fx.supportFarM=null;
  /* Pistols are a one-hand hold, as in the Motion Lab: fore points a sidecar pistol slot may still
     carry (copied from a long gun) would swing the barrel onto the left hand. */
  if(fx.weaponKind==='pistol'||!f||!g||!palms||!fx.chainL.length){fx.supportReason='one-hand';return;}
  if(fx.death||fx.transition||fx.supportReleased){fx.supportReason='released';return;}
  V3.TransformCoordinatesToRef(palms[BONE.rightHand],fx.chain[fx.chain.length-1],hR);
  V3.TransformCoordinatesToRef(palms[BONE.leftHand],fx.chainL[fx.chainL.length-1],hL);
  hL.subtractToRef(hR,hV);var dist=hV.length();if(dist<1e-4){fx.supportReason='coincident';return;}hV.scaleInPlace(1/dist);
  socketWorld.decompose(hS,hQ,hP);
  /* Both attachment points can be met only when the posed hand spacing reaches the fore-end. */
  var dy=(f[1]-g[1])*hS.y,dx=(f[0]-g[0])*hS.x,
      nearZ=(f[2]-g[2])*hS.z,farZ=(f[3]-g[2])*hS.z,
      near=Math.sqrt(dx*dx+dy*dy+nearZ*nearZ),far=Math.sqrt(dx*dx+dy*dy+farZ*farZ);
  fx.supportHandM=dist;fx.supportNearM=near;fx.supportFarM=far;
  if(dist<near||dist>far){fx.supportReason='out-of-reach';return;}
  var reach=Math.sqrt(dist*dist-dy*dy-dx*dx),z=g[2]+reach/hS.z;
  hLa.set(dx,dy,reach);hLa.scaleInPlace(1/dist);
  hLa.rotateByQuaternionToRef(hQ,hDir);
  if(V3.Dot(hDir,hV)<.4){fx.supportReason='off-axis';return;}
  /* World frame: forward along the hands, up from the rigid hold. Local frame: the same built on
     the weapon's grip->fore line. Rotation = world frame * local frame^-1. */
  V3.Up().rotateByQuaternionToRef(hQ,hUp);
  hUp.subtractToRef(hV.scale(V3.Dot(hUp,hV)),hY);hY.normalize();V3.CrossToRef(hY,hV,hX);
  hLy.set(0,1,0).subtractInPlace(hLa.scale(hLa.y));hLy.normalize();V3.CrossToRef(hLy,hLa,hLx);
  Q.RotationQuaternionFromAxisToRef(hX,hY,hV,hQw);Q.RotationQuaternionFromAxisToRef(hLx,hLy,hLa,hQl);
  hQl.conjugateInPlace();hQw.multiplyToRef(hQl,hQw);
  /* Grip point onto the right web. */
  hG.set(g[0]*hS.x,g[1]*hS.y,g[2]*hS.z).rotateByQuaternionToRef(hQw,hA);hR.subtractToRef(hA,hA);
  MX.ComposeToRef(hS,hQw,hA,socketWorld);fx.twoHand=1;fx.supportReason='attached';
  hFore.set(f[0],f[1],z);V3.TransformCoordinatesToRef(hFore,socketWorld,hG);
  fx.supportErrorCm=V3.Distance(hG,hL)*100;
}
/* Clips hold the rifle a little differently (crouched and prone aim sit low or wide), so while a
   soldier aims, the upper spine turns the barrel onto the target, by at most ~40 degrees. The
   rotation is applied about the spine's own origin and re-expressed in its parent's local space,
   which also absorbs the model's scale and handedness conversion. */
var aimDir=new V3(),aimWant=new V3(),aimAxis=new V3(),aimOrigin=new V3(),aimRot=new MX(),aimA=new MX(),aimB=new MX(),aimLocal=new MX(),aimPos=new V3(),aimScale=new V3(),aimQ=new Q();
function aimSpine(fx){
  var weapon=socketWorld;V3.TransformNormalToRef(V3.Forward(),weapon,aimDir);aimDir.normalize();
  var muzzle=weapon.getTranslation();
  if(fx.aimAt){aimWant.set(fx.aimAt.x-muzzle.x,(fx.aimAt.y||0)+1.2-muzzle.y,fx.aimAt.z-muzzle.z);}
  else{V3.TransformNormalToRef(V3.Forward(),fx.chain[0],aimWant);aimWant.y=0;}
  if(aimWant.lengthSquared()<1e-6)return false;aimWant.normalize();
  var dot=Math.max(-1,Math.min(1,V3.Dot(aimDir,aimWant))),angle=Math.min(.7,Math.acos(dot))*fx.aim;if(angle<.004)return false;
  V3.CrossToRef(aimDir,aimWant,aimAxis);if(aimAxis.lengthSquared()<1e-8)return false;aimAxis.normalize();
  MX.RotationAxisToRef(aimAxis,angle,aimRot);
  var spine=fx.spine,parent=fx.chain[fx.spineAt-1];fx.chain[fx.spineAt].getTranslationToRef(aimOrigin);
  /* C = parentWorld * T(-o) * R * T(o) * parentWorld^-1 ; local' = local * C */
  MX.TranslationToRef(-aimOrigin.x,-aimOrigin.y,-aimOrigin.z,aimA);parent.multiplyToRef(aimA,aimB);aimB.multiplyToRef(aimRot,aimA);
  MX.TranslationToRef(aimOrigin.x,aimOrigin.y,aimOrigin.z,aimB);aimA.multiplyToRef(aimB,aimA);parent.invertToRef(aimB);aimA.multiplyToRef(aimB,aimA);
  MX.ComposeToRef(spine.scaling,spine.rotationQuaternion,spine.position,aimLocal);aimLocal.multiplyToRef(aimA,aimLocal);
  aimLocal.decompose(aimScale,aimQ,aimPos);spine.rotationQuaternion.copyFrom(aimQ);
  return true;
}
/* World matrices from the soldier root down to a hand, composed straight from each node's TRS.
   Babylon's computeWorldMatrix(true) per node cost ~10x more; the chain has no pivots, billboards
   or parent-less jumps, so plain composition is exact. */
var chainLocal=new MX(),chainQ=new Q();
function handChain(path,chain,from){
  for(var i=from;i<path.length;i++){
    var n=path[i],q=n.rotationQuaternion;
    if(!q){Q.RotationYawPitchRollToRef(n.rotation.y,n.rotation.x,n.rotation.z,chainQ);q=chainQ;}
    MX.ComposeToRef(n.scaling,q,n.position,chainLocal);
    if(i)chainLocal.multiplyToRef(chain[i-1],chain[i]);else chain[i].copyFrom(chainLocal);
  }
}
/* ---- animation detail by distance (presentation only) ---------------------------------------
   applyPose is most of a soldier's per-frame cost, and at the default overview camera every man is
   hundreds of metres away. The render hook therefore re-poses each soldier on a schedule and
   otherwise leaves the last pose on the bones (it rides the soldier root, which the sim still moves
   every frame):
     - near the camera (< near m): every frame;
     - medium (< mid m): about midHz; beyond: about farHz, each soldier on his own phase so the
       far group does not pose on the same frame;
     - outside the view frustum: not re-posed until he is back in view. A soldier whose meshes cast
       shadows (in any shadow generator's caster list) counts as in view while his shadow could be:
       he is held only when both his body and the ground his shadow falls on are outside the view;
     - static (clip state, weapon and hold unchanged since his last pose, not aiming; e.g. a
       finished death clip or a paused sim): posed once, then held.
   A soldier is always posed the first time. Clip clocks stay on simulation time in update(); this
   only decides how often the result is written. Distances are presentation thresholds, tuned from
   close-ups, never gameplay. `?animLod=0` poses every soldier every frame (the previous behaviour). */
/* `clock` (ms) defaults to performance.now(); the full-fidelity benchmark's cadence mode swaps in a
   virtual frame clock so a slow software renderer is scheduled as a 60 FPS device would be. */
var LOD={on:!(typeof location!=='undefined'&&/[?&]animLod=0\b/.test(location.search||'')),near:35,mid:100,midHz:30,farHz:10,offscreen:true,radius:1.6,clock:null,skeletons:true};
/* `?farHz=<n>` re-poses soldiers beyond `mid` at n Hz instead of 10 (a device test knob). */
(function(){var m=typeof location!=='undefined'&&/[?&]farHz=([0-9.]+)/.exec(location.search||'');if(m&&+m[1]>0)LOD.farHz=+m[1];})();
/* Off-screen culling of soldier meshes. Bind makes each soldier's skinned meshes always active (their
   bounds are the bind pose and never re-synced), so Babylon never culls them and the GPU skinned all
   100 every frame, wherever the camera looked (device benchmark, follow camera: 100 of ~145 draws with
   ~8% of soldiers in view). The render hook disables a soldier's meshes while a sphere of `radius` m
   around him (wider than the animation LOD's, so a lying or falling body stays whole) is outside the
   view and no shadow of his could be in it, and enables them again before the frame that brings him
   back. Weapons and wound decals are culled by Babylon as before. Presentation only. `?soldierCull=0`
   draws every soldier every frame (the previous behaviour). */
var CULL={on:!(typeof location!=='undefined'&&/[?&]soldierCull=0\b/.test(location.search||'')),radius:3};
var lodVP=new MX(),lodPlanes=[0,1,2,3,4,5].map(function(){return new BABYLON.Plane(0,0,0,0);}),lodEye=new V3(),lodSeq=0;
function lodCamera(scene){
  var cam=scene.activeCamera;if(!cam)return false;
  /* The camera as it is now: the scene's own planes are last frame's and lag a camera jump. */
  cam.getViewMatrix().multiplyToRef(cam.getProjectionMatrix(),lodVP);BABYLON.Frustum.GetPlanesToRef(lodVP,lodPlanes);
  lodEye.copyFrom(cam.globalPosition||cam.position);return true;
}
/* Shadow-casting lights this frame: every enabled light with a shadow generator. A soldier casts if
   one of his meshes is in a generator's render list (or the generator selects casters with a
   predicate, which we cannot see into, so every soldier counts). Caster sets are rebuilt only when a
   render list changes length. */
var lodShadowMaps=[],lodShadowDir=new V3(),LOD_SHADOW_HEIGHT=2,LOD_SHADOW_MAX=40;
function lodShadows(scene){
  lodShadowMaps.length=0;
  var lights=scene.lights||[];
  for(var i=0;i<lights.length;i++){
    var light=lights[i];if(!light.isEnabled()||!light.getShadowGenerators)continue;
    var gens=light.getShadowGenerators();if(!gens||!gens.size)continue;
    gens.forEach(function(g){
      var sm=g&&g.getShadowMap&&g.getShadowMap();if(!sm)return;
      var list=sm.renderList||[];
      if(!sm._lodCasters||sm._lodCastersFrom!==list||sm._lodCastersLen!==list.length){sm._lodCasters=new Set(list);sm._lodCastersFrom=list;sm._lodCastersLen=list.length;}
      lodShadowMaps.push({light:light,map:sm,all:!!sm.renderListPredicate});
    });
  }
  return lodShadowMaps.length>0;
}
function lodCasts(fx,entry){
  if(entry.all)return true;
  for(var i=0;i<fx.meshes.length;i++)if(entry.map._lodCasters.has(fx.meshes[i]))return true;
  return false;
}
function lodSphereOut(x,y,z,r){
  for(var i=0;i<6;i++){var pl=lodPlanes[i];if(pl.normal.x*x+pl.normal.y*y+pl.normal.z*z+pl.d< -r)return true;}
  return false;
}
/* Could this soldier's shadow from this light be in view? The shadow of a body LOD_SHADOW_HEIGHT m
   tall falls along the light's horizontal direction; test a sphere around that ground strip. A
   grazing light (very long shadows) always counts as in view. */
function lodShadowInView(fx,entry){
  var light=entry.light,p=fx.root.position;
  var directional=light.getTypeID?light.getTypeID()===BABYLON.Light.LIGHTTYPEID_DIRECTIONALLIGHT:!!light.direction;
  if(directional)lodShadowDir.copyFrom(light.direction); /* point and spot lights: from the light through his head */
  else{var lp=light.getAbsolutePosition?light.getAbsolutePosition():light.position;if(!lp)return true;lodShadowDir.set(p.x-lp.x,p.y+LOD_SHADOW_HEIGHT-lp.y,p.z-lp.z);}
  var len=lodShadowDir.length();if(!(len>1e-6))return true;
  var dx=lodShadowDir.x/len,dy=lodShadowDir.y/len,dz=lodShadowDir.z/len;if(dy>-.05)return true;
  var k=(LOD_SHADOW_HEIGHT/2)/-dy,half=Math.sqrt(dx*dx+dz*dz)*k;if(half>LOD_SHADOW_MAX)return true;
  return!lodSphereOut(p.x+dx*k,p.y,p.z+dz*k,half+LOD.radius);
}
/* Is this soldier's body (a sphere of r m around his waist) out of view with no shadow of his in view? */
function lodOut(fx,shadows,r){
  var p=fx.root.position;if(!lodSphereOut(p.x,p.y+.9,p.z,r))return false;
  if(shadows)for(var i=0;i<lodShadowMaps.length;i++){var e=lodShadowMaps[i];if(lodCasts(fx,e)&&lodShadowInView(fx,e))return false;}
  return true;
}
function cullApply(fx,out){
  if(!!fx._culled===out)return;fx._culled=out;
  for(var i=0;i<fx.meshes.length;i++)fx.meshes[i].setEnabled(!out);
}
function lodSig(fx){
  if(fx.aim>.01)return null; /* the aim twist follows a moving world target */
  var h=poseMix(poseClipSig(fx,false),poseWeaponSig(fx));
  h=poseMix(h,Math.round((fx.cupW==null?1:fx.cupW)*1e3));h=poseMix(h,Math.round((fx.cupRamp==null?1:fx.cupRamp)*1e3));
  return poseMix(h,Math.round((fx.cupReach==null?1:fx.cupReach)*1e3));
}
/* Why this soldier is not re-posed this frame, or null to pose him. */
function lodHold(fx,now,cam,shadows){
  /* Signature of the inputs this pose would use, taken before posing: a pose that still moved an
     eased value (the pistol cup) leaves a different signature for the next frame, so it re-poses. */
  var sig=fx._lodNext=lodSig(fx);if(fx._lodAt==null)return null;
  if(sig!==null&&sig===fx._lodSig)return'static';
  if(!cam)return null;
  var p=fx.root.position,x=p.x,y=p.y+.9,z=p.z;
  fx._lodShadowKept=false;
  if(LOD.offscreen&&lodSphereOut(x,y,z,LOD.radius)){
    var kept=false;
    if(shadows)for(var i=0;i<lodShadowMaps.length&&!kept;i++){var e=lodShadowMaps[i];if(lodCasts(fx,e)&&lodShadowInView(fx,e))kept=true;}
    if(!kept)return'offscreen';
    fx._lodShadowKept=true; /* body out of view, shadow maybe in view: schedule by distance */
  }
  var dx=lodEye.x-x,dy=lodEye.y-y,dz=lodEye.z-z,d=Math.sqrt(dx*dx+dy*dy+dz*dz);
  if(d<LOD.near){fx._lodEvery=0;return null;}
  var every=fx._lodEvery=1000/(d<LOD.mid?LOD.midHz:LOD.farHz);
  return now-fx._lodAt>=every?null:'interval';
}
function lodPosed(fx,now){
  /* Each soldier keeps his own phase: first poses are spread over a far interval (golden-ratio
     phase per soldier), and later stamps advance by whole intervals, so soldiers that all came due
     at once (after a pause, a hidden tab or a fast-forward) do not stay in lockstep. */
  var every=fx._lodEvery||0;
  if(fx._lodAt==null)fx._lodAt=now-((lodSeq++*.618034)%1)*(1000/LOD.farHz);
  else if(every>0&&now-fx._lodAt<every*8)fx._lodAt+=every*Math.floor((now-fx._lodAt)/every);
  else if(every>0)fx._lodAt=now-((lodSeq++*.618034)%1)*every;
  else fx._lodAt=now;
  fx._lodSig=fx._lodNext;
}

function hookRender(scene,st){
  if(st.hooked)return;st.hooked=true;
  scene.onBeforeRenderObservable.add(function(){
    var list=st.active,on=POSE.on,t0=on?perfNow():0,posed=0,lod=LOD.on,cull=CULL.on,now=lod?(LOD.clock?LOD.clock():perfNow()):0,cam=(lod||cull)&&lodCamera(scene),shadows=cam&&(cull||LOD.offscreen)&&lodShadows(scene);
    var ac=scene.activeCamera,eye=ac&&(ac.globalPosition||ac.position),mf=MESH_LOD.far,mb=MESH_LOD.band;
    for(var i=list.length-1;i>=0;i--){
      var fx=list[i];
      if(fx.holder.isDisposed()){list.splice(i,1);continue;}
      if(!fx.root.isEnabled())continue;
      cullApply(fx,!!(cull&&cam&&lodOut(fx,shadows,CULL.radius)));
      if(on&&fx._culled)POSE.lod.culled++;
      /* Mesh LOD: full detail within `far` (with a `band` of hysteresis), the simplified list beyond. */
      if(fx.meshLod){
        if(!MESH_LOD.on||!eye)meshLodApply(fx,false);
        else{var mp=fx.root.position,mx=eye.x-mp.x,my=eye.y-mp.y-.9,mz=eye.z-mp.z,md=Math.sqrt(mx*mx+my*my+mz*mz);meshLodApply(fx,fx._meshFar?md>mf-mb:md>mf+mb);}
      }
      if(lod){
        var hold=fx._lodHold=lodHold(fx,now,cam,shadows);
        if(on&&fx._lodShadowKept)POSE.lod.shadowKept++;
        if(hold){if(on)POSE.lod[hold]++;continue;}
        fx._poseDt=fx._lodAt==null?null:(now-fx._lodAt)/1000;
      }
      if(on){var a=perfNow();applyPose(fx);poseSoldier(fx,perfNow()-a,scene);posed++;POSE.lod.posed++;}
      else applyPose(fx);
      fx.poseRef.serial++; /* the bones moved: his skeletons prepare once this frame */
      if(lod)lodPosed(fx,now);
    }
    if(on)poseFrame(perfNow()-t0,posed);
  });
}

/* ---- BattleSoldierModel integration ------------------------------------------------------- */

var Weapons=root.BattleWeapons,oldAttach=Weapons&&Weapons.attachWeapon;
/* Weapons are GPU instances of one hidden source mesh per weapon model and scene, so every soldier's
   rifle of one model draws in one call (a clone per soldier was ~50 draw calls a frame on the device
   benchmark). Nothing edits a weapon apart from its model: callers read its world matrix (muzzle,
   flash, grip) and toggle it for the bipod swap, both of which instances support. The source stays
   enabled but invisible: Babylon renders instances through it. `?weaponInstances=0` clones as before. */
var WEAPON_INSTANCES=!(typeof location!=='undefined'&&/[?&]weaponInstances=0\b/.test(location.search||''));
function weaponMesh(scene,model,name,socket){
  var m;
  if(WEAPON_INSTANCES){
    var src=model._instanceSource;
    if(!src||src.isDisposed()||src.getScene()!==scene){
      src=model._instanceSource=model.mesh.clone('weapon-source.'+model.name,null);
      src.isVisible=false;src.isPickable=false;src.position.set(0,0,0);src.alwaysSelectAsActiveMesh=false;
    }
    m=src.createInstance(name);m.parent=socket;
  }else m=model.mesh.clone(name,socket);
  m.position.set(0,0,0);m.isPickable=false;return m;
}
if(oldAttach)Weapons.attachWeapon=function(scene,socket,kind){
  var weapon=oldAttach.apply(this,arguments),faction=socket&&socket._fbxFaction,st=faction&&sceneState(scene);
  var files=faction?weaponFiles(faction,kind):[],file=null,model=null;
  if(files.length&&st.weapons){var turn=st.weaponTurn||(st.weaponTurn={}),n=turn[faction+kind]||0;turn[faction+kind]=n+1;file=files[n%files.length];model=st.weapons[file];}
  if(model){
    var mesh=weaponMesh(scene,model,'weapon.'+faction,socket);
    weapon.mesh.dispose();weapon.mesh=mesh;weapon.muzzleLocal=model.muzzle.slice();weapon.model=model.name;
    var bipod=WEAPON_BIPOD[file]&&st.weapons[WEAPON_BIPOD[file]];
    if(bipod){weapon.bipodMesh=weaponMesh(scene,bipod,'weapon.'+faction+'.bipod',socket);weapon.bipodMesh.setEnabled(false);}
  }
  return weapon;
};
var oldCreate=M.createSoldier,oldPreload=M.preload,oldSetEnabled=M.setImportedEnabled;
/* With the library loaded, a soldier is a bare body (no procedural meshes) wearing his FBX model;
   a failed bind is a bug and throws. With imported animation disabled (trainer, headless
   benchmark) he keeps the procedural rig. */
M.createSoldier=function(scene,faction,role,parent){
  var st=sceneState(scene),lib=st.ready&&st.enabled&&modelFor(st,faction,role);
  if(!lib||!M.createBody)return oldCreate.apply(this,arguments);
  var t0=ASSET.on?perfNow():0,soldier=M.createBody(scene,faction,role,parent),tb=ASSET.on?perfNow():0;
  bind(soldier,scene,st,lib,faction==='ge'?'ge':'us');
  if(ASSET.on){var t1=perfNow(),b=ASSET.binds;b.count++;b.ms+=t1-tb;b.bodyMs+=tb-t0;b.max=Math.max(b.max,t1-tb);if(b.first==null)b.first=t0;b.last=t1;}
  return soldier;
};
/* Normal gameplay waits for its soldiers however long the assets take; a failed load rejects, so
   the page reports it (BattleLoading.fail) instead of swapping in procedural soldiers. */
M.preload=function(scene){
  var before=oldPreload?Promise.resolve(oldPreload.apply(this,arguments)):Promise.resolve(true);
  return before.then(function(){return loadLibrary(scene);}).then(function(ok){
    if(!ok){var e=sceneState(scene).error;throw e instanceof Error?e:new Error('FBX soldiers failed to load: '+(e||'unknown'));}
    return true;
  });
};
M.setImportedEnabled=function(scene,enabled){
  if(oldSetEnabled)oldSetEnabled.apply(this,arguments);
  if(scene)sceneState(scene).enabled=!!enabled;
};

root.BattleFbxSoldier={
  version:'1.3',backend:BACKEND,clips:CLIPS,models:MODELS,modelSet:MODEL_SET,
  load:loadLibrary,
  /* Read-only: the soldier's bone node by canonical name ('head', 'spine2', 'leftupleg'...), for
     presentation that rides the body (wound decals). Null on the procedural rig. */
  boneNode:function(soldier,name){var fx=soldier&&soldier._fbx,i=fx&&fx.st&&fx.st.bones?fx.st.bones.indexOf(name):-1;return i>=0&&fx.nodes[i]||null;},
  sidecars:function(){return{contacts:Object.keys(SIDE_CONTACTS),points:Object.keys(SIDE_MODEL_POINTS),arms:Object.keys(SIDE_ARM),wrists:Object.keys(SIDE_WRISTR),leftGrips:Object.keys(SIDE_LEFT_GRIP)};},
  status:function(scene){var st=sceneState(scene),sockets={};Object.keys(st.libs||{}).forEach(function(f){var lib=st.libs[f],p=lib.palms||{};sockets[f]={right:p[BONE.rightHand+'Source']||null,left:p[BONE.leftHand+'Source']||null,aimHandSpacingM:lib.supportHand&&lib.supportHand.along||0,sidecar:!!SIDE_CONTACTS[f],sideWeapons:SIDE_MODEL_POINTS[f]?Object.keys(SIDE_MODEL_POINTS[f]):[],sideArms:SIDE_ARM[f]?Object.keys(SIDE_ARM[f]):[],sideWrists:SIDE_WRISTR[f]?Object.keys(SIDE_WRISTR[f]):[],sideLeftGrips:SIDE_LEFT_GRIP[f]?Object.keys(SIDE_LEFT_GRIP[f]):[]};});return{ready:st.ready,enabled:st.enabled,error:st.error?String(st.error.message||st.error):null,active:st.active.length,clips:st.clips?Object.keys(st.clips).length:0,bones:st.bones?st.bones.length:0,sockets:sockets,sidecars:Object.keys(SIDE_CONTACTS)};},
  clip:function(scene,key){var st=sceneState(scene);return st.clips&&st.clips[key]||null;},
  /* Read-only: a model's retargeted clip ('us-paratrooper.fbx', 'aim'), and its solved grips. */
  modelClip:function(scene,file,key){var lib=sceneState(scene).libs[file];return lib&&lib.clips&&lib.clips[key]||null;},
  grips:function(scene,file){var lib=sceneState(scene).libs[file];return lib&&lib.grips||null;},
  /* Read-only: how bone matrices reach the GPU (mode, the device's vertex uniform vectors, and how
     many skeletons use uniforms vs textures). */
  bones:function(){return{mode:BONES.mode,maxVertexUniformVectors:BONES.maxVertexUniformVectors,uniforms:BONES.uniforms,textures:BONES.textures};},
  /* Prepared clips: format/file, what this load took from the pack (`state`), the builder
     scripts/build_clip_pack.cjs calls, and the decoder its checks use. */
  clipPack:{format:CLIP_PACK_FORMAT,file:CLIP_PACK_FILE,build:buildClipPack,decode:decodeClipPack,
    state:function(scene){return sceneState(scene).clipPack||null;},
    /* Read-only: a hash per clip of its metadata and every sample's bits, for the converted clips
       and each model's retargeted ones (scripts/probe_clip_pack.cjs compares pack vs FBX loads). */
    digest:function(scene){
      var st=sceneState(scene);if(!st.ready)return null;
      var hash=function(c){
        var h=0x811c9dc5,mix=function(v){h=Math.imul(h^v,16777619)>>>0;},num=function(x){var f=new Float64Array([x]),u=new Uint32Array(f.buffer);mix(u[0]);mix(u[1]);};
        [c.frames,c.duration,c.travel,c.turnRate,c.speed,c.stride==null?-1:c.stride,c.loop?1:0].forEach(num);
        c.channels.forEach(function(ch,i){if(!ch)return;mix(i);[ch.rot,ch.pos].forEach(function(a,k){mix(a?a.length+k:k-9);if(a){var u=new Uint32Array(a.buffer,a.byteOffset,a.length);for(var j=0;j<u.length;j++)mix(u[j]);}});});
        return h.toString(16);
      };
      var out={bones:st.bones.join(','),clips:{},models:{}};
      Object.keys(st.clips).forEach(function(k){out.clips[k]=hash(st.clips[k]);});
      Object.keys(st.libs).forEach(function(f){var m=out.models[f]={};Object.keys(st.libs[f].clips||{}).forEach(function(k){m[k]=hash(st.libs[f].clips[k]);});});
      return out;
    }},
  /* Per-model clip timing: natural speed (m/s), stride estimate, duration, loop. */
  speeds:function(scene,file){var st=sceneState(scene),lib=st.libs[file]||st.libs[Object.keys(st.libs)[0]],out={};if(!lib||!lib.clips)return out;
    Object.keys(lib.clips).forEach(function(k){var c=lib.clips[k];out[k]={turnRate:+(c.turnRate||0).toFixed(2),speed:+(c.speed||0).toFixed(2),stride:c.stride!=null?+c.stride.toFixed(2):null,travel:+((c.travel||0)*lib.speedScale).toFixed(2),duration:+c.duration.toFixed(2),loop:c.loop};});return out;}
};
/* Read-only diagnostics for the runtime/animation audit (see the instrumentation block above). */
root.BattleAssetTimings={enabled:ASSET.on,snapshot:assetSnapshot};
/* Animation LOD thresholds, live-tunable for visual checks (BattleFbxSoldier.lod.farHz=5, .on=false...). */
root.BattleFbxSoldier.lod=LOD;
/* Off-screen soldier culling, live-tunable (`.on`, `.radius` m); `lodState(s).culled` per soldier. */
root.BattleFbxSoldier.cull=CULL;
/* Soldier mesh LOD: live-tunable (`.far` metres, `.on`); `.models` lists each model's full and far
   triangle and vertex counts, `.failed` why it is off if meshoptimizer never loaded. */
root.BattleFbxSoldier.meshLod=MESH_LOD;
root.BattleFbxSoldier.meshLodState=function(soldier){var fx=soldier&&soldier._fbx;return fx?{far:!!fx._meshFar,meshes:fx.meshLod?fx.meshLod.length:0}:null;};
/* Read-only: this soldier's last LOD decision (null = posed), and whether his shadow kept him scheduled. */
root.BattleFbxSoldier.lodState=function(soldier){var fx=soldier&&soldier._fbx;return fx?{hold:fx._lodHold||null,shadowKept:!!fx._lodShadowKept,culled:!!fx._culled,lastPoseAt:fx._lodAt==null?null:fx._lodAt}:null;};
root.BattlePoseTimings={enable:poseEnable,disable:function(){POSE.on=false;return false;},reset:function(){if(POSE.on)poseReset();},
  enabled:function(){return POSE.on;},snapshot:poseSnapshot,layers:POSE_LAYERS.slice()};
console.log('[ANIM] FBX soldier backend installed (models + clips load with the battle)');
})(typeof window!=='undefined'?window:globalThis);
