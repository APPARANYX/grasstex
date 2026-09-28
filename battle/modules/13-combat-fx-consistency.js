/* Consistent visible feedback for every weapon discharge.
   Direct-fire ballistics now supply the actual ray impact point. Keep hit tracers visible and make
   miss tracers faint, while retaining the legacy fallback for older/non-ballistic shots. */
(function(root){
  'use strict';
  if(!root.BattleSim||typeof BABYLON==='undefined'||root.BattleCombatFxConsistency)return;
  var oldStart=root.BattleSim.start;

  function hash01(seed){
    var x=(seed|0)>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967295;
  }
  function muzzleWorld(soldier){
    if(!soldier||!soldier.weapon||!soldier.weapon.mesh||!soldier.weapon.muzzleLocal)return null;
    try{return BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.FromArray(soldier.weapon.muzzleLocal),soldier.weapon.mesh.getWorldMatrix());}catch(_){return null;}
  }
  /* Muzzle flash: an end-on flash sprite (Assets/effects/muzzle-flash, 13 variants) on a quad at
     the muzzle, perpendicular to the barrel (not a billboard), with a random variant and roll per
     shot. Two thinner quads along the barrel (vertical and horizontal) carry the same image, so the
     flash still reads from the side and from the high battle camera, where the end-on quad is seen
     edge-on. Sized per weapon; quads are pooled because machine guns fire faster than they fade. */
  var FLASH_COUNT=13,FLASH_SIZE={pistol:.16,smg:.22,carbine:.26,rifle:.30,lmg:.46},FLASH_MODEL_SIZE={'mg42.fbx':.52,'fg42.fbx':.34,'thompson.fbx':.22,'mp40.fbx':.20},FLASH_LIFE=.055,POOL=32;
  var flashState=typeof WeakMap!=='undefined'?new WeakMap():null,FZ=new BABYLON.Vector3(0,0,1);
  function flashAssets(scene){
    var st=flashState?flashState.get(scene):scene._battleMuzzleFlash;if(st)return st;
    st={materials:[],pool:[],next:0};if(flashState)flashState.set(scene,st);else scene._battleMuzzleFlash=st;
    var base=String(root.BATTLE_SOLDIER_ASSET_BASE||root.BATTLE_ASSET_BASE||'../Assets/').replace(/\/?$/,'/')+'effects/muzzle-flash/';
    for(var i=1;i<=FLASH_COUNT;i++){
      var tex=new BABYLON.Texture(base+(i<10?'0':'')+i+'.png',scene,false,true);tex.hasAlpha=true;
      var mat=new BABYLON.StandardMaterial('muzzleFlash'+i,scene);
      mat.diffuseColor=BABYLON.Color3.Black();mat.specularColor=BABYLON.Color3.Black();mat.emissiveTexture=tex;mat.opacityTexture=tex;
      mat.disableLighting=true;mat.backFaceCulling=false;mat.alphaMode=BABYLON.Engine.ALPHA_ADD;mat.freeze();st.materials.push(mat);
    }
    var template=BABYLON.MeshBuilder.CreatePlane('muzzleFlashQuad',{size:1},scene);template.setEnabled(false);
    for(i=0;i<POOL;i++){
      var root_=new BABYLON.TransformNode('muzzleFlash',scene),quads=[];
      /* 0: end-on (faces along the barrel); 1-2: along the barrel, vertical and horizontal. */
      for(var q=0;q<3;q++){var m=template.clone('muzzleFlashQuad'+q,root_);m.setEnabled(true);m.isPickable=false;quads.push(m);}
      quads[1].rotation.y=Math.PI/2;quads[1].position.z=.5;quads[1].scaling.set(1,.45,1);
      /* The horizontal one is the vertical one turned a quarter about the barrel axis. */
      quads[2].rotationQuaternion=BABYLON.Quaternion.RotationAxis(FZ,Math.PI/2).multiply(BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y,Math.PI/2));
      quads[2].position.z=.5;quads[2].scaling.set(1,.45,1);
      root_.rotationQuaternion=new BABYLON.Quaternion();root_.setEnabled(false);
      st.pool.push({node:root_,quads:quads,until:0});
    }
    scene.onBeforeRenderObservable.add(function(){
      var now=performance.now();for(var k=0;k<st.pool.length;k++){var f=st.pool[k];if(f.until&&now>f.until){f.until=0;f.node.setEnabled(false);}}
    });
    return st;
  }
  var fQ=new BABYLON.Quaternion(),fS=new BABYLON.Vector3(),fP=new BABYLON.Vector3(),fRoll=new BABYLON.Quaternion();
  function showFlash(scene,soldier){
    var w=soldier&&soldier.weapon;if(!scene||!w||!w.mesh||!w.muzzleLocal)return false;
    var st=flashAssets(scene),f=st.pool[st.next];st.next=(st.next+1)%st.pool.length;
    var world=w.mesh.getWorldMatrix();world.decompose(fS,fQ,fP);
    BABYLON.Vector3.TransformCoordinatesToRef(BABYLON.Vector3.FromArray(w.muzzleLocal),world,fP);
    BABYLON.Quaternion.RotationAxisToRef(FZ,Math.random()*Math.PI*2,fRoll);fQ.multiplyToRef(fRoll,f.node.rotationQuaternion);
    var size=(FLASH_MODEL_SIZE[w.model]||FLASH_SIZE[w.kind]||.3)*(.85+Math.random()*.3);
    f.node.position.copyFrom(fP);f.node.scaling.setAll(size);
    var mat=st.materials[Math.floor(Math.random()*st.materials.length)];for(var q=0;q<3;q++)f.quads[q].material=mat;
    f.node.setEnabled(true);f.until=performance.now()+FLASH_LIFE*1000;
    return true;
  }
  root.BattleMuzzleFlash={show:showFlash,sizes:FLASH_SIZE};
  function vec3(p){return p&&new BABYLON.Vector3(+p.x||0,+p.y||0,+p.z||0);}
  function legacyMissEndpoint(shooter,target,d,time){
    var tp=target.root.position,aim=new BABYLON.Vector3(tp.x,tp.y+1.15,tp.z),sid=+shooter.id||0,tid=+target.id||0,tick=Math.floor((+time||0)*1000),seed=(sid*73856093)^(tid*19349663)^tick;
    var a=hash01(seed)*Math.PI*2,spread=Math.min(3.2,.55+(+d||0)*.014),vertical=(hash01(seed^0x5bd1e995)-.5)*spread*.65;
    aim.x+=Math.cos(a)*spread;aim.z+=Math.sin(a)*spread;aim.y+=vertical;return aim;
  }
  /* Tracers: a shot's line shows for ~0.1 s. Each used to be a new LinesMesh created and disposed per
     shot (~20 a second at 4x speed on the device benchmark: GPU buffers, a mesh object and garbage
     every shot, and a likely source of frame hitches). They now come from a per-scene, per-style
     pool of updatable lines: a shot moves a free line's two points, shows it and hides it when its
     time is up. A style's pool grows to TRACER_MAX lines; past that the oldest showing line is reused
     (it would have faded within ~0.1 s anyway). Presentation only: no
     combat RNG, nothing the sim reads. `?tracerPool=0` creates and disposes per shot as before. */
  var TRACER_POOL=!(typeof location!=='undefined'&&/[?&]tracerPool=0\b/.test(location.search||''));
  var TRACER_MAX=48,tracerState=typeof WeakMap!=='undefined'?new WeakMap():null,tracerStats={created:0,reused:0};
  function tracerLine(scene,name,from,to,color,alpha,updatable,instance){
    var opts={points:[from,to],updatable:!!updatable},useVertexAlpha=alpha!=null&&typeof BABYLON.Color4==='function';
    if(instance)opts.instance=instance;
    if(useVertexAlpha&&!instance){opts.colors=[new BABYLON.Color4(color.r,color.g,color.b,alpha),new BABYLON.Color4(color.r,color.g,color.b,alpha)];opts.useVertexAlpha=true;}
    var l=BABYLON.MeshBuilder.CreateLines(name,opts,scene);
    if(!instance){l.color=new BABYLON.Color3(color.r,color.g,color.b);if(alpha!=null&&!useVertexAlpha)l.alpha=alpha;l.isPickable=false;}
    return l;
  }
  function showTracer(scene,name,from,to,color,alpha,lifetime,group){
    if(!scene||!from||!to)return;
    if(!TRACER_POOL){
      var once=tracerLine(scene,name,from,to,color,alpha,false,null);if(group!=null)once.renderingGroupId=group;tracerStats.created++;
      setTimeout(function(){try{once.dispose();}catch(_){}},lifetime);return;
    }
    var st=tracerState?tracerState.get(scene):scene._battleTracers;
    if(!st){st={};if(tracerState)tracerState.set(scene,st);else scene._battleTracers=st;}
    var pool=st[name]||(st[name]=[]),l=null;
    for(var i=0;i<pool.length;i++)if(!pool[i]._tracerOn&&!pool[i].isDisposed()){l=pool[i];break;}
    if(!l&&pool.length>=TRACER_MAX){for(i=0;i<pool.length;i++)if(!l||pool[i]._tracerAt<l._tracerAt)l=pool[i];tracerStats.stolen=(tracerStats.stolen||0)+1;}
    if(l){tracerLine(scene,name,from,to,color,alpha,true,l);tracerStats.reused++;}
    else{
      l=tracerLine(scene,name,from,to,color,alpha,true,null);if(group!=null)l.renderingGroupId=group;
      /* The two points move every use; skip culling rather than refresh its bounds each time. */
      l.alwaysSelectAsActiveMesh=true;l.doNotSyncBoundingInfo=true;pool.push(l);tracerStats.created++;
    }
    var gen=l._tracerGen=(l._tracerGen||0)+1;l._tracerOn=true;l._tracerAt=performance.now();l.setEnabled(true);
    setTimeout(function(){if(l._tracerGen!==gen)return;l._tracerOn=false;if(!l.isDisposed())l.setEnabled(false);},lifetime);
  }
  root.BattleTracers={on:TRACER_POOL,show:showTracer,stats:function(){return{pool:TRACER_POOL,created:tracerStats.created,reused:tracerStats.reused,stolen:tracerStats.stolen||0,max:TRACER_MAX};}};
  function tracer(scene,name,from,to,color,alpha,lifetime){showTracer(scene,name,from,to,color,alpha,lifetime,3);}
  /* Effects warm-up. The first shots of a battle used to build the muzzle-flash pool (99 meshes, 13
     textures) and compile the flash, tracer and decal shaders mid-frame: a 94 ms hitch on an iPhone
     (device benchmark worstFrames). They are built and compiled when the battle is set up instead.
     Presentation only, no combat RNG. `?fxPrewarm=0` leaves them lazy. */
  var FX_PREWARM=!(typeof location!=='undefined'&&/[?&]fxPrewarm=0\b/.test(location.search||''));
  function compileFor(mat,mesh){try{if(mat&&mesh&&mat.forceCompilation)mat.forceCompilation(mesh);}catch(_){}}
  function prewarm(scene){
    if(!FX_PREWARM||!scene||scene._battleFxPrewarmed)return;scene._battleFxPrewarmed=true;
    try{var st=flashAssets(scene),q=st.pool[0]&&st.pool[0].quads[0];if(q)st.materials.forEach(function(m){compileFor(m,q);});}catch(_){}
    if(!TRACER_POOL)return;
    var V=BABYLON.Vector3,a=new V(0,-1000,0),b=new V(0,-999,0),styles=[['tracer-hit',{r:1,g:.95,b:.7},.50,3],['tracer-miss',{r:1,g:1,b:1},.15,3],['tracer',{r:1,g:.95,b:.7},null,null]];
    styles.forEach(function(sy){
      for(var i=0;i<4;i++)showTracer(scene,sy[0],a,b,sy[1],sy[2],0,sy[3]);
      var pool=(tracerState?tracerState.get(scene):scene._battleTracers)||{};
      (pool[sy[0]]||[]).forEach(function(l){l._tracerGen++;l._tracerOn=false;l.setEnabled(false);compileFor(l.material,l);});
    });
    tracerStats.created=tracerStats.reused=0;
  }
  root.BattleTracers.prewarm=prewarm;
  function hitTracer(scene,from,to){tracer(scene,'tracer-hit',from,to,{r:1,g:.95,b:.7},.50,90);}
  function missTracer(scene,from,to){tracer(scene,'tracer-miss',from,to,{r:1,g:1,b:1},.15,135);}
  function install(sim){
    if(!sim||sim._combatFxConsistencyInstalled)return sim;sim._combatFxConsistencyInstalled=true;
    prewarm(sim.scene);
    var oldShot=sim.onShot;
    /* The muzzle flash itself is drawn by the core onFire through BattleMuzzleFlash.show. */
    sim.onShot=function(shooter,target,hit,d,shot){
      var from=muzzleWorld(shooter);
      /* Ballistic shots get their tracer here; the shot is marked so the core's legacy tracer
         skips it, but the event still travels down the chain (hit reactions listen there). */
      if(shot&&shot.mode==='raycast'&&shot.impact&&from){
        /* A later round of a burst flies when its muzzle flash shows, not when the tick resolved it. */
        /* To where the round really ended: past a man it went through, into whatever stopped it. */
        var impact=vec3(shot.final&&shot.final.impact||shot.impact),draw=function(){var f=muzzleWorld(shooter)||from;if(hit)hitTracer(sim.scene,f,impact);else missTracer(sim.scene,f,impact);};
        if(shot.delay>0&&sim.presentAfter)sim.presentAfter(shot.delay,draw);else draw();
        shot.tracerDrawn=true;if(oldShot)oldShot.apply(sim,arguments);return;
      }
      if(oldShot)oldShot.apply(sim,arguments);
      if(hit||!shooter||!target||!target.root||!from)return;
      missTracer(sim.scene,from,legacyMissEndpoint(shooter,target,d,sim.time));
    };
    return sim;
  }
  root.BattleSim.start=function(scene,opts){return install(oldStart(scene,opts));};
  root.BattleCombatFxConsistency={version:'72-balanced-tracer-opacity',install:install};
  if(typeof console!=='undefined')console.log('[FX] ballistic hit tracers use 50% vertex alpha; miss tracers use 15% vertex alpha');
})(typeof window!=='undefined'?window:globalThis);
