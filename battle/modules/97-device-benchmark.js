/* In-page device benchmark: `?bench=1` on any device (phone, laptop, desktop), no tooling needed.
   It is the full-fidelity benchmark (scripts/benchmark_full_fidelity.cjs) run by the page itself:
   waits for the load to finish, fast-forwards `benchWarmup` sim seconds without rendering (so the
   armies are in contact), then plays the battle at the page's speed with the normal render loop for
   `benchSeconds` and shows FPS, frame time, CPU per frame, render, sim step, pose time, draw calls,
   GPU time (where the browser exposes a timer query) and the load breakdown, with Copy / Download
   buttons for the JSON. Nothing is uploaded anywhere.

   Flags: bench=1, benchSeconds=60, benchWarmup=60, benchCam=overview|close (close: 90 m from the
   biggest group of living soldiers), benchAuto=1 (start without the tap; for scripts). Combine with
   animLod=0 for the before/after of the animation LOD. The result is also window.__deviceBench.

   Without ?bench=1 this module does nothing. With it, it observes only: it reads clocks and counters,
   never draws a random number, and drives the sim only as the page itself does (the warm-up steps
   it at the fixed 0.15 s step the replay tools use, with the General ticked alongside). */
(function(root){
'use strict';
if(typeof document==='undefined'||typeof location==='undefined'||root.BattleDeviceBenchmark)return;
var q=new URLSearchParams(location.search||'');
if(q.get('bench')!=='1'){root.BattleDeviceBenchmark={active:false};return;}
var SECONDS=Math.max(5,+q.get('benchSeconds')||60),WARMUP=Math.max(0,q.get('benchWarmup')==null?60:+q.get('benchWarmup')||0),
    CAM=q.get('benchCam')==='close'?'close':'overview',AUTO=q.get('benchAuto')==='1';

var panel=null,body=null,state='loading',result=null;
function el(tag,css,text){var e=document.createElement(tag);if(css)e.style.cssText=css;if(text!=null)e.textContent=text;return e;}
function ensurePanel(){
  if(panel)return;
  panel=el('div','position:fixed;right:max(10px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top));z-index:90;width:min(420px,calc(100vw - 20px));max-height:calc(100vh - 20px);overflow:auto;padding:12px 14px;border:1px solid rgba(255,255,255,.2);border-radius:10px;background:rgba(14,17,12,.94);color:#eceee2;font:12px/1.4 -apple-system,Segoe UI,Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.4)');
  panel.id='deviceBenchmark';
  panel.appendChild(el('div','font-weight:700;font-size:13px;margin-bottom:6px','Device benchmark'));
  body=el('div');panel.appendChild(body);document.body.appendChild(panel);
}
function say(html){ensurePanel();body.innerHTML=html;}
function esc(s){return String(s==null?'—':s).replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
function f(v,d){return v==null||!isFinite(v)?'—':(+v).toFixed(d==null?1:d);}
function stats(values){
  var a=values.filter(function(v){return typeof v==='number'&&isFinite(v);}).sort(function(x,y){return x-y;});if(!a.length)return null;
  var qn=function(p){return a[Math.min(a.length-1,Math.floor(p*(a.length-1)+.5))];},sum=0;a.forEach(function(v){sum+=v;});
  return{n:a.length,mean:sum/a.length,p50:qn(.5),p95:qn(.95),p99:qn(.99),max:a[a.length-1]};
}
function round(o){return JSON.parse(JSON.stringify(o,function(k,v){return typeof v==='number'?+v.toFixed(3):v;}));}
function device(engine){
  var gl=engine._gl,info={};
  try{var ext=gl&&gl.getExtension('WEBGL_debug_renderer_info');info.renderer=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):(engine.getGlInfo&&engine.getGlInfo().renderer);info.vendor=ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL):(engine.getGlInfo&&engine.getGlInfo().vendor);}catch(_){}
  info.webgl=engine.webGLVersion;info.userAgent=navigator.userAgent;info.platform=navigator.platform||null;
  info.cores=navigator.hardwareConcurrency||null;info.memoryGB=navigator.deviceMemory||null;
  info.devicePixelRatio=root.devicePixelRatio||1;info.hardwareScaling=engine.getHardwareScalingLevel();
  info.canvas={width:engine.getRenderWidth(),height:engine.getRenderHeight()};
  info.screen={width:screen.width,height:screen.height};
  info.timerQuery=!!(engine.getCaps&&engine.getCaps().timerQuery);
  return info;
}
/* What the active meshes are, by kind (names from terrain-features, the scenario and the FBX
   backend). Draw calls are estimated per mesh as its sub-mesh count (thin instances draw once). */
var KINDS=[
  ['soldiers',function(m){return!!m.skeleton;}],
  ['weapons',function(m,n){return/^weapon\./.test(n);}],
  ['building walls & floors',function(m,n,p){return/^(wall|floor|roof|door|window)-/.test(n)||/^building/.test(p);}],
  ['hedges',function(m,n){return/hedge/i.test(n);}],
  ['terrain, roads & sky',function(m,n){return/^(battleField|battleSkyDome|scenario-road)/.test(n);}],
  ['objectives',function(m,n){return/^objective-/.test(n);}],
  ['decals & effects',function(m,n){return/decal|impact|blood|muzzle|flash|tracer|spray|hole|smoke|dust/i.test(n);}],
  ['cover & scatter',function(m,n){return/log|rock|tree|stub|crate|sandbag|wire|roadblock|scatter|trunk|bush|fence|cart/i.test(n);}]
];
function meshCensus(scene,acc){
  var act=scene.getActiveMeshes();acc.samples++;
  for(var i=0;i<act.length;i++){
    var m=act.data[i],n=String(m.name||''),p=m.parent&&m.parent.name?String(m.parent.name):'',kind='other';
    for(var k=0;k<KINDS.length;k++)if(KINDS[k][1](m,n,p)){kind=KINDS[k][0];break;}
    var c=acc.kinds[kind]||(acc.kinds[kind]={meshes:0,draws:0}),d=m.subMeshes&&m.subMeshes.length?m.subMeshes.length:1;
    c.meshes++;c.draws+=d;
    if(kind==='other'){var raw=n.replace(/[0-9]+/g,'#');acc.other[raw]=(acc.other[raw]||0)+1;}
  }
}
function closeCamera(b){
  var cam=b.scene.activeCamera,all=b._roster.us.concat(b._roster.ge).filter(function(s){return!s.dead;});if(!cam||!all.length)return;
  /* Centre on the living soldier with the most living soldiers within 60 m. */
  var best=null,bestN=-1;all.forEach(function(s){var n=0,p=s.root.position;all.forEach(function(o){var d=o.root.position;if((d.x-p.x)*(d.x-p.x)+(d.z-p.z)*(d.z-p.z)<3600)n++;});if(n>bestN){bestN=n;best=s;}});
  var p=best.root.position;if(cam.setTarget)cam.setTarget(new BABYLON.Vector3(p.x,p.y+1,p.z));if('radius' in cam)cam.radius=90;
}

function run(){
  var b=root.__battle__,scene=b.scene,engine=scene.getEngine(),C=root.BattleCommanderAI,tick=(C&&C.commandTick)||.45;
  var scenario=scene.metadata&&scene.metadata.battleScenario,startBtn=document.getElementById('startBtn');
  state='warmup';
  if(startBtn&&!startBtn.hidden)startBtn.click();
  engine.stopRenderLoop();b.paused=false;
  var speed=b.timeScale||4,accum=0,t=0,warm0=performance.now();
  function warm(){
    var slice=performance.now();
    while(t<WARMUP&&!b.winner&&performance.now()-slice<40){
      b.step(.15);accum+=.15;t+=.15;
      while(C&&accum+1e-9>=tick&&!b.winner){accum-=tick;C.update(b,scenario,tick);}
    }
    say('Warming up: fast-forwarding the battle to contact… '+Math.round(100*t/Math.max(.001,WARMUP))+'%');
    if(t<WARMUP&&!b.winner)return setTimeout(warm,0);
    measure(performance.now()-warm0);
  }
  warm();
  function measure(warmMs){
    state='measuring';
    if(CAM==='close')closeCamera(b);
    var census={samples:0,kinds:{},other:{}},frames=[],rec={on:true,begin:0,last:null,interval:null,sim:0,scene:0,skel:0,skelN:0,hooksBefore:0,hooksAfter:0,hidden:0},si=new BABYLON.SceneInstrumentation(scene),ei=null;
    si.captureRenderTime=true;si.captureActiveMeshesEvaluationTime=true;si.captureCameraRenderTime=true;si.captureAnimationsTime=true;
    try{ei=new BABYLON.EngineInstrumentation(engine);ei.captureGPUFrameTime=true;}catch(_){ei=null;}
    var orig=b._frame;b._frame=function(){var t0=performance.now();try{return orig.apply(this,arguments);}finally{rec.sim+=performance.now()-t0;}};
    /* The whole scene.render (Babylon's animation and camera-update steps run before the first hook). */
    var origRender=scene.render;scene.render=function(){var t0=performance.now();try{return origRender.apply(this,arguments);}finally{rec.scene+=performance.now()-t0;}};
    /* Skeleton.prepare copies every linked bone node into its bone and rebuilds the bone matrices; it
       runs inside Babylon's active-mesh evaluation, so it is reported as part of that step. */
    var SP=BABYLON.Skeleton&&BABYLON.Skeleton.prototype,origPrepare=SP&&SP.prepare;
    if(origPrepare)SP.prepare=function(){var t0=performance.now();try{return origPrepare.apply(this,arguments);}finally{rec.skel+=performance.now()-t0;rec.skelN++;}};
    /* Every before/after-render hook, timed under a name taken from its code. */
    var hooks={},wrapped=[];
    function hookName(fn,i,phase){
      var src=String(fn);
      if(/_frame\(/.test(src))return'sim step';
      if(/lodCamera|applyPose/.test(src))return'FBX pose (LOD + applyPose)';
      if(/cameraKeys/.test(src))return'camera keys';
      return phase+' #'+i+': '+src.replace(/\s+/g,' ').replace(/^function\s*\([^)]*\)\s*\{/,'').slice(0,70);
    }
    function wrapHooks(obs,phase,field){
      obs.observers.forEach(function(o,i){
        if(!o||typeof o.callback!=='function')return;
        var fn=o.callback,name=hookName(fn,i,phase),h=hooks[name]||(hooks[name]={phase:phase,ms:0});
        o.callback=function(){var t0=performance.now();try{return fn.apply(this,arguments);}finally{var d=performance.now()-t0;h.ms+=d;rec[field]+=d;}};
        wrapped.push([o,fn]);
      });
    }
    wrapHooks(scene.onBeforeRenderObservable,'before','hooksBefore');wrapHooks(scene.onAfterRenderObservable,'after','hooksAfter');
    var o1=engine.onBeginFrameObservable.add(function(){var n=performance.now();rec.interval=rec.last==null?null:n-rec.last;rec.last=rec.begin=n;rec.sim=rec.scene=rec.skel=rec.skelN=rec.hooksBefore=rec.hooksAfter=0;}),
        o4=engine.onEndFrameObservable.add(function(){
          if(!rec.on)return;if(document.hidden)rec.hidden++;
          if(frames.length%15===0)meshCensus(scene,census);
          var g=ei&&ei.gpuFrameTimeCounter?ei.gpuFrameTimeCounter.current:0;
          var cam=si.cameraRenderTimeCounter.current,am=si.activeMeshesEvaluationTimeCounter.current,draw=si.renderTimeCounter.current,anim=si.animationsTimeCounter.current;
          frames.push({interval:rec.interval,cpu:performance.now()-rec.begin,scene:rec.scene,sim:rec.sim,render:draw,
            hooksBefore:rec.hooksBefore,hooksAfter:rec.hooksAfter,animations:anim,camera:cam,activeEval:am,skeletons:rec.skel,skeletonCount:rec.skelN,
            cameraOther:Math.max(0,cam-am-draw),unattributed:rec.scene-rec.hooksBefore-rec.hooksAfter-anim-cam,
            meshes:scene.getActiveMeshes().length,draws:si.drawCallsCounter?si.drawCallsCounter.current:null,gpu:g>0?g/1e6:null});
        });

    if(root.BattlePoseTimings){root.BattlePoseTimings.enable();root.BattlePoseTimings.reset();}
    var sim0=b.time,wall0=performance.now();b.timeScale=speed;b.paused=false;
    engine.runRenderLoop(root.__battleRenderLoop__||function(){scene.render();});
    var timer=setInterval(function(){
      var left=SECONDS-(performance.now()-wall0)/1000;
      say('Measuring: '+Math.max(0,Math.ceil(left))+' s left · '+frames.length+' frames. Keep this tab in front.');
      if(left>0)return;
      clearInterval(timer);rec.on=false;
      engine.onBeginFrameObservable.remove(o1);engine.onEndFrameObservable.remove(o4);
      wrapped.forEach(function(w){w[0].callback=w[1];});scene.render=origRender;if(origPrepare)SP.prepare=origPrepare;
      b._frame=orig;si.dispose();if(ei)ei.dispose();
      finish(frames.slice(1),{census:census,hooks:hooks,warmMs:warmMs,warmSim:t,sim0:sim0,wallMs:performance.now()-wall0,simAdvanced:b.time-sim0,hiddenFrames:rec.hidden});
    },500);
  }
  function finish(frames,run){
    var col=function(k){return frames.map(function(x){return x[k];});},iv=stats(col('interval'));
    var pose=root.BattlePoseTimings?root.BattlePoseTimings.snapshot():null,asset=root.BattleAssetTimings?root.BattleAssetTimings.snapshot():null;
    var roster=b._roster.us.concat(b._roster.ge),fbx=roster.filter(function(s){return s._fbx&&s.rig===null;}).length;
    result=round({
      kind:'device-benchmark',version:3,when:new Date().toISOString(),page:location.href,build:root.BATTLE_BUILD||null,
      device:device(engine),camera:CAM,animLod:!(root.BattleFbxSoldier&&root.BattleFbxSoldier.lod&&root.BattleFbxSoldier.lod.on===false),
      soldiers:{total:roster.length,fbx:fbx,alive:b.factions.us.alive+b.factions.ge.alive},
      run:{seconds:SECONDS,warmupSim:run.warmSim,warmupWallMs:run.warmMs,wallMs:run.wallMs,simAdvanced:run.simAdvanced,timeScale:speed,frames:frames.length,hiddenFrames:run.hiddenFrames},
      fps:iv?{mean:1000/iv.mean,median:1000/iv.p50,low5:1000/iv.p95,low1:1000/iv.p99}:null,
      frameMs:iv,cpuMs:stats(col('cpu')),sceneMs:stats(col('scene')),renderMs:stats(col('render')),simMs:stats(col('sim')),
      activeMeshes:stats(col('meshes')),drawCalls:stats(col('draws')),gpuMs:stats(col('gpu')),
      meshKinds:(function(c){var n=Math.max(1,c.samples),tot=0,out=[];Object.keys(c.kinds).forEach(function(k){tot+=c.kinds[k].draws;});
        Object.keys(c.kinds).forEach(function(k){out.push({kind:k,meshes:c.kinds[k].meshes/n,draws:c.kinds[k].draws/n,share:tot?c.kinds[k].draws/tot:null});});
        out.sort(function(a,b){return b.draws-a.draws;});
        return{samples:c.samples,kinds:out,otherNames:Object.keys(c.other).sort(function(a,b){return c.other[b]-c.other[a];}).slice(0,8).map(function(k){return{name:k,meshes:c.other[k]/n};})};})(run.census),
      /* Where scene.render's time goes, per frame. camera = Babylon's camera pass, which holds the
         active-mesh evaluation (culling, world matrices, skeleton prepare) and the draw. */
      breakdown:{sceneRender:stats(col('scene')),hooksBefore:stats(col('hooksBefore')),animations:stats(col('animations')),
        cameraPass:stats(col('camera')),activeMeshEval:stats(col('activeEval')),skeletonPrepare:stats(col('skeletons')),skeletonsPerFrame:stats(col('skeletonCount')),
        draw:stats(col('render')),cameraOther:stats(col('cameraOther')),hooksAfter:stats(col('hooksAfter')),unattributed:stats(col('unattributed')),
        hooks:Object.keys(run.hooks).map(function(k){return{name:k,phase:run.hooks[k].phase,msPerFrame:frames.length?run.hooks[k].ms/frames.length:null};})
          .sort(function(a,c){return c.msPerFrame-a.msPerFrame;})},
      pose:pose&&{frameMs:pose.frameMs,perSoldierUs:pose.perSoldierUs,posedPerFrame:pose.posedPerFrame&&pose.posedPerFrame.mean,lod:pose.lod,
        layers:pose.layers,posed:pose.posed,timerResolutionUs:pose.timerResolutionUs},
      startup:asset&&{page:asset.page,library:asset.library,totals:asset.totals,binds:asset.binds,slowest:asset.slowest.slice(0,5)}
    });
    root.__deviceBench=result;state='done';show(result);
  }
}
function row(label,st,unit){return st?'<tr><td>'+esc(label)+'</td><td>'+f(st.p50)+'</td><td>'+f(st.p95)+'</td><td>'+f(st.p99)+'</td><td>'+esc(unit==null?'ms':unit)+'</td></tr>':'';}
function show(r){
  var d=r.device,p=r.pose||{},s=r.startup||{},soldiers=s.page&&s.page.phases.filter(function(x){return x.id==='soldiers';})[0];
  var warn=[];if(r.soldiers.fbx!==r.soldiers.total)warn.push(r.soldiers.total-r.soldiers.fbx+' soldiers on the procedural rig: not a full-fidelity run');
  if(r.run.hiddenFrames)warn.push('the tab was hidden for '+r.run.hiddenFrames+' frames');
  var h='<div style="color:#b9c49a">'+esc(d.renderer)+'<br>'+esc(d.canvas.width+'×'+d.canvas.height)+' canvas · DPR '+f(d.devicePixelRatio,2)+' · '+esc(d.cores)+' cores · build '+esc(r.build)+' · LOD '+(r.animLod?'on':'off')+' · camera '+esc(r.camera)+'</div>';
  if(warn.length)h+='<div style="color:#f1b4b4;margin-top:6px">'+warn.map(esc).join('<br>')+'</div>';
  h+='<div style="font-size:20px;font-weight:700;margin:8px 0 2px">'+f(r.fps&&r.fps.median)+' FPS <span style="font-size:12px;font-weight:400">median · mean '+f(r.fps&&r.fps.mean)+' · 5% low '+f(r.fps&&r.fps.low5)+' · 1% low '+f(r.fps&&r.fps.low1)+'</span></div>';
  h+='<div>'+r.run.frames+' frames in '+f(r.run.wallMs/1000,0)+' s, '+f(r.soldiers.alive,0)+' of '+r.soldiers.total+' soldiers alive</div>';
  h+='<table style="width:100%;border-collapse:collapse;margin-top:8px;font-variant-numeric:tabular-nums"><tr style="color:#9aa088"><td></td><td>median</td><td>p95</td><td>p99</td><td></td></tr>'+
    row('Frame time',r.frameMs)+row('CPU in frame',r.cpuMs)+row('Scene render',r.sceneMs)+row('Babylon render',r.renderMs)+row('Sim step',r.simMs)+
    row('Pose (all soldiers)',p.frameMs)+row('GPU frame',r.gpuMs)+row('Draw calls',r.drawCalls,'')+row('Active meshes',r.activeMeshes,'')+'</table>';
  var B=r.breakdown;
  if(B){
    var mean=function(st){return st?st.mean:null;};
    h+='<div style="margin-top:8px;font-weight:700">Where scene.render goes (mean ms per frame)</div><table style="width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums">'+
      [['scene.render total',B.sceneRender],['before-render hooks',B.hooksBefore],['Babylon animations',B.animations],['camera pass',B.cameraPass],
       ['· active-mesh evaluation',B.activeMeshEval],['·· skeleton prepare ('+f(mean(B.skeletonsPerFrame),0)+'/frame)',B.skeletonPrepare],['· draw',B.draw],['· rest of camera pass',B.cameraOther],
       ['after-render hooks',B.hooksAfter],['unattributed',B.unattributed]]
      .map(function(x){return'<tr><td>'+esc(x[0])+'</td><td style="text-align:right">'+f(mean(x[1]),2)+'</td></tr>';}).join('')+'</table>';
    h+='<div style="margin-top:6px;font-weight:700">Hooks (mean ms per frame)</div><table style="width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums">'+
      B.hooks.slice(0,8).map(function(x){return'<tr><td style="word-break:break-all">'+esc(x.name)+'</td><td style="text-align:right">'+f(x.msPerFrame,2)+'</td></tr>';}).join('')+'</table>';
  }
  if(r.meshKinds&&r.meshKinds.kinds.length)h+='<div style="margin-top:8px;font-weight:700">Draw calls by kind (mean per frame)</div><table style="width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums">'+
    r.meshKinds.kinds.map(function(x){return'<tr><td>'+esc(x.kind)+'</td><td style="text-align:right">'+f(x.draws,0)+'</td><td style="text-align:right;color:#9aa088">'+f(100*(x.share||0),0)+'%</td></tr>';}).join('')+'</table>';
  if(p.lod)h+='<div style="margin-top:6px">Soldiers posed per frame: '+f(p.posedPerFrame,1)+' ('+f(100*(p.lod.posedShare||0),0)+'%)</div>';
  if(!r.gpuMs)h+='<div style="color:#9aa088">GPU timing not available in this browser.</div>';
  if(s.page)h+='<div style="margin-top:6px">Load: '+f(s.page.finishedAt/1000)+' s total, soldiers '+f(soldiers&&soldiers.ms/1000)+' s (FBX parse '+f(s.totals.parse/1000)+' s, retarget '+f(s.totals.retarget/1000)+' s, '+f(s.totals.bytes/1048576,0)+' MiB)</div>';
  h+='<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button id="benchCopy">Copy results</button><button id="benchSave">Download JSON</button><button id="benchClose">Close</button></div>'+
    '<div style="color:#9aa088;margin-top:6px">Send the copied results back to compare runs. Nothing is uploaded.</div>';
  say(h);
  var btn='padding:6px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.25);background:#2b3223;color:#eceee2;font:inherit';
  ['benchCopy','benchSave','benchClose'].forEach(function(id){document.getElementById(id).style.cssText=btn;});
  var text=JSON.stringify(r);
  document.getElementById('benchCopy').onclick=function(){var ok=function(){document.getElementById('benchCopy').textContent='Copied';};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(ok,fallback);else fallback();
    function fallback(){var t=el('textarea','position:fixed;left:-9999px');t.value=text;document.body.appendChild(t);t.select();try{document.execCommand('copy');ok();}catch(_){}t.remove();}};
  document.getElementById('benchSave').onclick=function(){var a=el('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));a.download='device-benchmark-'+(r.build||'build')+'.json';document.body.appendChild(a);a.click();a.remove();};
  document.getElementById('benchClose').onclick=function(){panel.remove();panel=null;};
}
function ready(){
  var L=root.BattleLoading;
  return root.__battle__&&(!L||!L.timings||L.timings().finishedAt!=null);
}
function wait(){
  if(!document.body)return setTimeout(wait,100);
  if(!ready()){if(state==='loading')say('Loading the battle… the benchmark starts when it is ready.');return setTimeout(wait,250);}
  state='ready';
  if(AUTO)return run();
  say('Ready. It fast-forwards '+WARMUP+' s of battle, then measures '+SECONDS+' s with the normal renderer. Keep the screen on and this tab in front.<div style="margin-top:10px"><button id="benchStart" style="padding:8px 14px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:#556b2f;color:#fff;font:600 13px Arial">Start benchmark</button></div>');
  document.getElementById('benchStart').onclick=function(){run();};
}
root.BattleDeviceBenchmark={active:true,state:function(){return state;},result:function(){return result;}};
wait();
})(typeof window!=='undefined'?window:globalThis);
