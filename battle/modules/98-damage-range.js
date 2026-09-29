/* Damage Range: opt-in visual QA lineup for the real soldier/damage pipeline.
   ?damageRange=1 turns the normal battle into a presentation-only firing range:
   - one real US rifleman is the shooter;
   - one US + one GE soldier for every infantry role stand in a fixed lineup;
   - the normal AI/movement step is disabled, but render-time animation/particles keep running;
   - Fire goes through the shipping onFire/onShot wrappers, so muzzle flash/audio, tracer,
     combat.hit, blood bursts, ground spray and UV-painted entry/exit wounds are the real systems.
   No gameplay damage is synthesized by Fire; Kill is explicit so wound accumulation can be viewed
   without the target dropping after one random combat result.

   URL controls: damageRange=1, rangeTarget=0..9, rangeZone=head|chest|abdomen|arm|leg,
   rangeExit=0|1, rangeAuto=0|1, rangeInterval=seconds, rangeOrbit=0|1, rangeDist=metres. */
(function(root){
  'use strict';
  if(!root.BattleSim||!root.BattleModules||typeof BABYLON==='undefined'||typeof document==='undefined')return;
  var q=new URLSearchParams((root.location&&root.location.search)||'');
  if(q.get('damageRange')!=='1'){root.BattleDamageRange={active:false};return;}
  var oldStart=root.BattleSim.start,ROLES=['rifleman','sergeant','scout','gunner','engineer'],
    ZONES=['head','chest','abdomen','arm','leg'],
    api={active:true,ready:false,version:'1.0-lineup'};
  root.BattleDamageRange=api;

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function num(name,fallback,a,b){var v=+q.get(name);return isFinite(v)?clamp(v,a,b):fallback;}
  function label(s){return(s.faction==='us'?'US':'GER')+' '+s.role;}
  function pickRole(sim,faction,role,skip){
    var a=(sim._roster[faction]||[]).filter(function(s){return s&&s.role===role&&s!==skip;});
    return a[0]||null;
  }
  function setEnabled(s,on){
    if(!s||!s.root)return;
    try{s.root.setEnabled(!!on);}catch(_){}
  }
  function neutral(s){
    if(!s)return;
    s.destination=null;s.target=null;s._faceHint=null;s.moveSpeed=0;s.moving=false;
    s.reloading=false;s.reloadUntil=0;s.crawling=false;s.prone=false;s.crouching=false;
    try{if(root.BattleSoldierModel.setProne)root.BattleSoldierModel.setProne(s,false);}catch(_){}
    try{if(root.BattleSoldierModel.setCrouch)root.BattleSoldierModel.setCrouch(s,false);}catch(_){}
  }
  function setup(sim){
    var scene=sim.scene,canvas=scene.getEngine().getRenderingCanvas(),scenario=scene.metadata&&scene.metadata.battleScenario||{},
      center=scenario.center||{x:0,z:0},field=scene.getMeshByName&&scene.getMeshByName('battleField'),maxY=-Infinity;
    try{if(field&&field.computeWorldMatrix)field.computeWorldMatrix(true);if(field&&field.getBoundingInfo)maxY=field.getBoundingInfo().boundingBox.maximumWorld.y;}catch(_){}
    var baseY=Math.ceil(Math.max(isFinite(maxY)?maxY+7:35,sim.heightAt(center.x,center.z)+7)),
      rowZ=center.z+0.4,backZ=center.z+3.1,shooterZ=center.z-8.4,span=17.1;

    var shooter=pickRole(sim,'us','rifleman',null);
    var targets=[];
    ROLES.forEach(function(role){
      var us=pickRole(sim,'us',role,role==='rifleman'?shooter:null),ge=pickRole(sim,'ge',role,null);
      if(us)targets.push(us);if(ge)targets.push(ge);
    });
    if(!shooter||targets.length<2){console.error('[RANGE] lineup unavailable');return sim;}

    var keep=targets.concat([shooter]),all=(sim._roster.us||[]).concat(sim._roster.ge||[]);
    all.forEach(function(s){setEnabled(s,keep.indexOf(s)>=0);neutral(s);});
    targets.forEach(function(s,i){
      var x=center.x-span/2+(targets.length===1?span/2:i*span/(targets.length-1));
      s.root.position.set(x,baseY,rowZ);s.root.rotation.y=Math.PI;setEnabled(s,true);
      if(s.root.computeWorldMatrix)s.root.computeWorldMatrix(true);
    });
    shooter.root.position.set(center.x,baseY,shooterZ);shooter.root.rotation.y=0;setEnabled(shooter,true);
    if(shooter.root.computeWorldMatrix)shooter.root.computeWorldMatrix(true);

    /* Give blood pools and spray the raised deck as ground instead of the battlefield far below. */
    var oldHeight=sim.heightAt;
    sim.heightAt=function(x,z){
      if(Math.abs(x-center.x)<=12.5&&z>=center.z-9.5&&z<=center.z+3.5)return baseY;
      return oldHeight(x,z);
    };

    var floor=BABYLON.MeshBuilder.CreateBox('damageRangeFloor',{width:25,depth:14,height:.24},scene);
    floor.position.set(center.x,baseY-.12,center.z-2.9);
    var floorMat=new BABYLON.StandardMaterial('damageRangeFloorMat',scene);
    floorMat.diffuseColor=new BABYLON.Color3(.20,.21,.18);floorMat.specularColor=BABYLON.Color3.Black();floor.material=floorMat;
    var back=BABYLON.MeshBuilder.CreateBox('damageRangeBackstop',{width:23,height:3.4,depth:.28},scene);
    back.position.set(center.x,baseY+1.7,backZ);
    var backMat=new BABYLON.StandardMaterial('damageRangeBackstopMat',scene);
    backMat.diffuseColor=new BABYLON.Color3(.26,.25,.23);backMat.specularColor=BABYLON.Color3.Black();back.material=backMat;

    var rangeIndex=clamp(Math.floor(num('rangeTarget',0,0,targets.length-1)),0,targets.length-1),
      zone=ZONES.indexOf(q.get('rangeZone'))>=0?q.get('rangeZone'):'chest',
      exit=q.get('rangeExit')!=='0',auto=q.get('rangeAuto')==='1',
      orbit=q.get('rangeOrbit')==='1',interval=num('rangeInterval',1.25,.35,8),
      distance=num('rangeDist',5.4,2.5,14),serial=0,autoTimer=null;

    /* A dedicated selected-target orbit camera is more useful here than following the busiest squad. */
    var previous=scene.activeCamera;
    try{if(previous&&previous.detachControl)previous.detachControl(canvas);}catch(_){}
    var cam=new BABYLON.ArcRotateCamera('damageRangeCam',-Math.PI/2,1.14,distance,
      new BABYLON.Vector3(targets[rangeIndex].root.position.x,baseY+1.05,rowZ),scene);
    cam.minZ=.04;cam.maxZ=500;cam.lowerRadiusLimit=2.5;cam.upperRadiusLimit=18;
    cam.lowerBetaLimit=.35;cam.upperBetaLimit=1.48;cam.wheelPrecision=18;cam.panningSensibility=0;
    cam.attachControl(canvas,true);scene.activeCamera=cam;

    function selected(){return targets[rangeIndex];}
    function alignShooter(){
      var t=selected();if(!t)return;
      shooter.root.position.x=t.root.position.x;shooter.root.position.y=baseY;shooter.root.position.z=shooterZ;
      shooter.root.rotation.y=0;shooter.target=t;shooter._faceHint=t.root.position;
      if(shooter.root.computeWorldMatrix)shooter.root.computeWorldMatrix(true);
    }
    alignShooter();

    function zonePoint(t,z){
      var y={head:1.70,chest:1.34,abdomen:1.06,arm:1.33,leg:.69}[z]||1.34,
        side=(serial&1)?1:-1,xoff=z==='arm'?.28*side:z==='leg'?.13*side:0;
      return{x:t.root.position.x+xoff,y:t.root.position.y+y,z:t.root.position.z};
    }
    function makeShot(t){
      var p=zonePoint(t,zone),dir={x:0,y:0,z:1},entry={x:p.x,y:p.y,z:p.z-.22},
        leave=exit?{x:p.x,y:p.y,z:p.z+.22}:null,pass={
          victim:t,zone:zone,entry:entry,exit:leave,direction:dir,exitDirection:leave?dir:undefined
        };
      return{
        mode:'raycast',stoppedBy:'soldier',surface:'blood',victim:t,zone:zone,
        impact:entry,normal:{x:0,y:0,z:-1},direction:dir,delay:0,passes:[pass],
        final:leave?{
          stoppedBy:'environment',surface:'cement',blocker:'wall',
          impact:{x:p.x,y:p.y,z:backZ-.14},normal:{x:0,y:0,z:-1}
        }:null
      };
    }
    function status(){
      var st=sim._impactFx||{},body=st.body||[],uv=body.filter(function(e){return e.uv;}).length,
        maps=(st.surfaceMaps||[]).length,t=selected();
      return{
        ready:true,target:rangeIndex,label:label(t),zone:zone,exit:exit,auto:auto,orbit:orbit,
        camera:scene.activeCamera&&scene.activeCamera.name,targets:targets.map(label),
        wounds:body.length,uvWounds:uv,surfaceMaps:maps,shooter:label(shooter),baseY:baseY,
        enabledSoldiers:all.filter(function(s){return s.root&&s.root.isEnabled&&s.root.isEnabled();}).length
      };
    }
    function updateUi(){
      if(!api.panel)return;
      var t=selected(),sel=api.panel.querySelector('#rangeTarget'),zs=api.panel.querySelector('#rangeZone');
      if(sel)sel.value=String(rangeIndex);if(zs)zs.value=zone;
      var ex=api.panel.querySelector('#rangeExit');if(ex)ex.checked=exit;
      var au=api.panel.querySelector('#rangeAuto');if(au)au.checked=auto;
      var or=api.panel.querySelector('#rangeOrbit');if(or)or.checked=orbit;
      var read=api.panel.querySelector('#rangeReadout'),st=status();
      if(read)read.textContent=st.label+' · '+st.zone+(st.exit?' · through-shot':' · stopped')+
        ' · wounds '+st.wounds+' (UV '+st.uvWounds+') · maps '+st.surfaceMaps;
    }
    function choose(i){
      rangeIndex=(i+targets.length)%targets.length;alignShooter();
      cam.target.set(selected().root.position.x,selected().root.position.y+1.05,selected().root.position.z);
      updateUi();return selected();
    }
    function setZone(z){if(ZONES.indexOf(z)>=0)zone=z;updateUi();}
    function fire(){
      var t=selected();if(!t)return null;serial++;alignShooter();
      if(shooter.weapon){
        var cap=shooter.weapon.magSize||(shooter.weapon.stats&&shooter.weapon.stats.magazine)||8;
        shooter.weapon.ammo=cap;
      }
      try{if(sim.onFire)sim.onFire(shooter,0);}catch(e){console.warn('[RANGE] onFire',e);}
      var shot=makeShot(t),d=Math.hypot(t.root.position.x-shooter.root.position.x,t.root.position.z-shooter.root.position.z);
      try{if(sim.onShot)sim.onShot(shooter,t,true,d,shot);}catch(e){console.error('[RANGE] onShot failed',e);}
      if(shooter.weapon)shooter.weapon.ammo=shooter.weapon.magSize||(shooter.weapon.stats&&shooter.weapon.stats.magazine)||8;
      setTimeout(updateUi,80);return shot;
    }
    function burst3(){fire();setTimeout(fire,170);setTimeout(fire,340);}
    function kill(){
      var t=selected();if(t&&!t.dead)sim.killSoldier(t,shooter);updateUi();
    }
    function clear(){
      if(root.BattleImpactFx&&root.BattleImpactFx.clear)root.BattleImpactFx.clear(sim);
      updateUi();
    }
    function setAuto(on){
      auto=!!on;if(autoTimer){clearInterval(autoTimer);autoTimer=null;}
      if(auto)autoTimer=setInterval(function(){
        fire();var zi=(ZONES.indexOf(zone)+1)%ZONES.length;zone=ZONES[zi];
        if(zi===0)choose(rangeIndex+1);else updateUi();
      },interval*1000);
      updateUi();
    }

    /* Keep particles, hit/death animation and decal expiry alive without ever stepping combat AI. */
    sim.paused=false;sim.winner=null;sim._damageRangeActive=true;
    sim.pause=function(){this.paused=false;};sim.resume=function(){this.paused=false;};
    sim._frame=function(){};
    var last=performance.now();
    scene.onBeforeRenderObservable.add(function damageRangePresentation(){
      var now=performance.now(),dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;sim.time+=dt;
      keep.forEach(function(s){
        try{root.BattleSoldierModel.animateWalk(s,dt,0);}catch(_){}
      });
      if(root.BattleImpactFx&&root.BattleImpactFx.tick)root.BattleImpactFx.tick(sim);
      var t=selected();
      if(t&&t.root){
        cam.target.set(t.root.position.x,t.root.position.y+1.05,t.root.position.z);
        if(orbit)cam.alpha+=dt*.32;
      }
    });

    function makePanel(){
      var style=document.createElement('style');style.textContent=
        '#damageRangePanel{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147483000;'+
        'font:13px/1.25 system-ui,-apple-system,sans-serif;background:rgba(18,18,18,.88);color:#fff;padding:10px 12px;'+
        'border:1px solid rgba(255,255,255,.2);border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.35);max-width:94vw}'+
        '#damageRangePanel .rangeRow{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:7px}'+
        '#damageRangePanel button,#damageRangePanel select{font:inherit;padding:6px 9px}'+
        '#damageRangePanel button.rangeFire{font-weight:700;padding-left:18px;padding-right:18px}'+
        '#damageRangePanel label{display:flex;gap:4px;align-items:center}#damageRangePanel small{opacity:.7}'+
        '#damageRangePanel h2{font-size:14px;margin:0;letter-spacing:.03em}#rangeReadout{opacity:.82;margin-left:8px}';
      document.head.appendChild(style);
      var p=document.createElement('div');p.id='damageRangePanel';p.innerHTML=
        '<h2>DAMAGE RANGE <span id="rangeReadout"></span></h2>'+
        '<div class="rangeRow"><button id="rangePrev">◀</button><select id="rangeTarget"></select><button id="rangeNext">▶</button>'+
        '<select id="rangeZone"><option>head</option><option>chest</option><option>abdomen</option><option>arm</option><option>leg</option></select>'+
        '<label><input id="rangeExit" type="checkbox"> exit</label><label><input id="rangeOrbit" type="checkbox"> orbit</label>'+
        '<label><input id="rangeAuto" type="checkbox"> auto</label></div>'+
        '<div class="rangeRow"><button class="rangeFire" id="rangeFire">FIRE</button><button id="rangeBurst">3-shot</button>'+
        '<button id="rangeKill">Kill</button><button id="rangeClear">Clear blood</button><button id="rangeReset">Reset range</button></div>'+
        '<div class="rangeRow"><small>Space fire · ←/→ target · 1–5 zone · E exit · O orbit · A auto · C clear</small></div>';
      document.body.appendChild(p);api.panel=p;
      var ts=p.querySelector('#rangeTarget');targets.forEach(function(s,i){var o=document.createElement('option');o.value=i;o.textContent=(i+1)+'. '+label(s);ts.appendChild(o);});
      p.querySelector('#rangePrev').onclick=function(){choose(rangeIndex-1);};
      p.querySelector('#rangeNext').onclick=function(){choose(rangeIndex+1);};
      ts.onchange=function(){choose(+ts.value||0);};
      p.querySelector('#rangeZone').onchange=function(){setZone(this.value);};
      p.querySelector('#rangeExit').onchange=function(){exit=this.checked;updateUi();};
      p.querySelector('#rangeOrbit').onchange=function(){orbit=this.checked;updateUi();};
      p.querySelector('#rangeAuto').onchange=function(){setAuto(this.checked);};
      p.querySelector('#rangeFire').onclick=fire;p.querySelector('#rangeBurst').onclick=burst3;
      p.querySelector('#rangeKill').onclick=kill;p.querySelector('#rangeClear').onclick=clear;
      p.querySelector('#rangeReset').onclick=function(){location.reload();};
      window.addEventListener('keydown',function(e){
        var tag=document.activeElement&&document.activeElement.tagName;if(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA')return;
        if(e.code==='Space'){e.preventDefault();fire();}
        else if(e.code==='ArrowLeft'){e.preventDefault();choose(rangeIndex-1);}
        else if(e.code==='ArrowRight'){e.preventDefault();choose(rangeIndex+1);}
        else if(/^Digit[1-5]$/.test(e.code))setZone(ZONES[+e.code.slice(5)-1]);
        else if(e.key.toLowerCase()==='e'){exit=!exit;updateUi();}
        else if(e.key.toLowerCase()==='o'){orbit=!orbit;updateUi();}
        else if(e.key.toLowerCase()==='a')setAuto(!auto);
        else if(e.key.toLowerCase()==='c')clear();
      });
      updateUi();
    }
    makePanel();

    /* Leave the normal page objects in the DOM for loader/start code, but make the range the UI. */
    ['hud','hudToggle','animationLab','animationLabToggle','banner'].forEach(function(id){var e=document.getElementById(id);if(e)e.style.display='none';});
    var start=document.getElementById('startBtn');if(start)start.hidden=true;
    document.title='WW2FPS Damage Range · '+(root.BATTLE_BUILD||'dev');

    api.ready=true;api.sim=sim;api.targets=targets;api.shooter=shooter;api.camera=cam;
    api.state=status;api.fire=fire;api.burst3=burst3;api.kill=kill;api.clear=clear;api.choose=choose;
    api.setZone=setZone;api.setAuto=setAuto;
    updateUi();if(auto)setAuto(true);
    console.log('[RANGE] ready: '+targets.map(label).join(', ')+' · deckY='+baseY);
    return sim;
  }

  root.BattleSim.start=function(scene,opts){return setup(oldStart(scene,opts));};
  root.BattleModules.registerSystem('damage-range',{version:'1.0-lineup'});
})(typeof window!=='undefined'?window:globalThis);
