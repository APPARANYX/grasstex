(function(global){
  'use strict';
  var FLY_SPEED=68,FLY_SPRINT=175,THROTTLE_MIN=.01,THROTTLE_PER_PIXEL=.00288,DELTA_UNIT_PX=[1,16,400];
  var FOLLOW_DEFAULT=10,FOLLOW_MIN=3,FOLLOW_MAX=90,FOLLOW_BETA=1.18,FOLLOW_HEIGHT=1.05,ORBIT_SPEED=.22;
  var LOOK_X=.0022,LOOK_Y=.0018,PITCH_LIMIT=Math.PI*.46,MAX_HEIGHT=420,GROUND_CLEARANCE=2;
  var PAD_DEADZONE=.16,PAD_LOOK_RATE=2.35,PAD_PRECISION=.28,PAD_THROTTLE_STEP=1.35;
  var KEY_HINT='Camera: click to look · WASD move · wheel speed · Q/E up/down · Shift sprint · Esc releases';
  var PAD_HINT='Xbox: LS move · RS look · LT/RT down/up · RB sprint · LB precision · D-pad speed · Y level';
  var TOUCH_HINT='Camera: drag to orbit · pinch/wheel to zoom';
  var PAD_WAKE_HINT='Xbox: move a stick or press a button to switch to fly controls';
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function desktopPointer(){return !!(global.matchMedia&&global.matchMedia('(pointer:fine)').matches);}
  function hasGamepadAPI(){return !!(global.navigator&&typeof global.navigator.getGamepads==='function');}
  function queryParams(){try{return new URLSearchParams(global.location&&global.location.search||'');}catch(_){return new URLSearchParams();}}
  function queryNumber(q,key,fallback,min,max){
    if(!q.has(key))return fallback;
    var n=+q.get(key);if(!isFinite(n))return fallback;
    return clamp(n,min,max);
  }
  function livingSoldiers(b){
    if(!b||!b._roster)return[];
    return (b._roster.us||[]).concat(b._roster.ge||[]).filter(function(s){return s&&s.root&&!s.dead;});
  }
  function busiestSoldier(all){
    var best=null,bestN=-1;
    all.forEach(function(s){
      var n=0,p=s.root.position;
      all.forEach(function(o){var d=o.root.position,dx=d.x-p.x,dz=d.z-p.z;if(dx*dx+dz*dz<3600)n++;});
      if(n>bestN){bestN=n;best=s;}
    });
    return best;
  }
  function nearestLiving(all,from){
    var best=null,bestD=Infinity;
    all.forEach(function(s){var p=s.root.position,dx=p.x-from.x,dz=p.z-from.z,d=dx*dx+dz*dz;if(d<bestD){bestD=d;best=s;}});
    return best;
  }
  function initialPosition(target,radius,alpha,beta){
    return new BABYLON.Vector3(
      target.x+radius*Math.cos(alpha)*Math.sin(beta),
      target.y+radius*Math.cos(beta),
      target.z+radius*Math.sin(alpha)*Math.sin(beta)
    );
  }
  function createTouchOrbit(scene,canvas,target){
    var camera=new BABYLON.ArcRotateCamera('cam',-Math.PI/2,1.02,720,target,scene);
    camera.lowerRadiusLimit=90;camera.upperRadiusLimit=1850;camera.lowerBetaLimit=.28;camera.upperBetaLimit=1.5;
    camera.wheelPrecision=3;camera.panningSensibility=120;camera.attachControl(canvas,true);
    var hint=TOUCH_HINT+(hasGamepadAPI()?' · '+PAD_WAKE_HINT:'');
    return {camera:camera,desktop:false,hint:hint};
  }
  function shapedAxis(v){
    v=isFinite(+v)?+v:0;var a=Math.abs(v);if(a<=PAD_DEADZONE)return 0;
    return Math.sign(v)*(a-PAD_DEADZONE)/(1-PAD_DEADZONE);
  }
  function buttonValue(pad,index){var b=pad&&pad.buttons&&pad.buttons[index];return b?Math.max(b.pressed?1:0,+b.value||0):0;}
  function activeGamepad(){
    if(!hasGamepadAPI())return null;
    var pads=global.navigator.getGamepads()||[],fallback=null;
    for(var i=0;i<pads.length;i++){var p=pads[i];if(!p||p.connected===false)continue;if(!fallback)fallback=p;if(p.mapping==='standard')return p;}
    return fallback;
  }
  function cameraPose(camera,fallbackTarget){
    var position=camera&&camera.position&&camera.position.clone?camera.position.clone():initialPosition(fallbackTarget,720,-Math.PI/2,1.02);
    var look=fallbackTarget&&fallbackTarget.clone?fallbackTarget.clone():new BABYLON.Vector3(fallbackTarget.x,fallbackTarget.y,fallbackTarget.z);
    if(camera){
      try{
        if(typeof camera.getTarget==='function'){
          var t=camera.getTarget();if(t)look=t.clone?t.clone():new BABYLON.Vector3(t.x,t.y,t.z);
        }else if(camera.target){
          look=camera.target.clone?camera.target.clone():new BABYLON.Vector3(camera.target.x,camera.target.y,camera.target.z);
        }
      }catch(_){}
    }
    return {position:position,target:look};
  }
  function createDesktopFly(scene,canvas,target,engine,battleSim,pose){
    var startPosition=pose&&pose.position?pose.position:initialPosition(target,720,-Math.PI/2,1.02);
    var lookTarget=pose&&pose.target?pose.target:target;
    var camera=new BABYLON.UniversalCamera('cam',startPosition,scene);
    camera.inputs.clear();camera.minZ=.25;camera.maxZ=2600;camera.setTarget(lookTarget);scene.activeCamera=camera;
    var yaw=camera.rotation.y,pitch=camera.rotation.x,active=false,throttle=1,keys=new Set(),padButtons={},padId=null;
    function guarded(){return active||document.activeElement===canvas;}
    function keyName(event){return event.key===' '?' ':event.key.toLowerCase();}
    function movementKey(key){return key==='w'||key==='a'||key==='s'||key==='d'||key==='q'||key==='e'||key==='shift';}
    function updateHint(pad){
      var el=document.getElementById('cameraHint');if(!el)return;
      el.textContent=KEY_HINT+(pad?' · '+PAD_HINT:'');
    }
    function padPressedOnce(pad,index){
      var down=buttonValue(pad,index)>.5,was=!!padButtons[index];padButtons[index]=down;return down&&!was;
    }
    canvas.addEventListener('click',function(){canvas.focus();if(document.pointerLockElement!==canvas)canvas.requestPointerLock&&canvas.requestPointerLock();});
    document.addEventListener('pointerlockchange',function(){active=document.pointerLockElement===canvas;if(!active)keys.clear();});
    document.addEventListener('mousemove',function(event){
      if(!active)return;
      /* Conventional FPS look: mouse right turns right; mouse down looks down. */
      yaw+=event.movementX*LOOK_X;pitch+=event.movementY*LOOK_Y;pitch=clamp(pitch,-PITCH_LIMIT,PITCH_LIMIT);
      camera.rotation.y=yaw;camera.rotation.x=pitch;
    });
    window.addEventListener('keydown',function(event){
      if(!guarded())return;
      var key=keyName(event);if(!movementKey(key))return;
      keys.add(key);event.preventDefault();
    },{passive:false});
    window.addEventListener('keyup',function(event){keys.delete(keyName(event));});
    window.addEventListener('blur',function(){keys.clear();});
    window.addEventListener('gamepadconnected',function(e){padId=e.gamepad&&e.gamepad.id||'gamepad';padButtons={};updateHint(e.gamepad);console.log('[CAMERA] gamepad connected: '+padId);});
    window.addEventListener('gamepaddisconnected',function(e){if(!e.gamepad||!padId||e.gamepad.id===padId){padId=null;padButtons={};updateHint(null);}console.log('[CAMERA] gamepad disconnected');});
    canvas.addEventListener('wheel',function(event){
      if(!guarded())return;
      event.preventDefault();
      var pixels=event.deltaY*(DELTA_UNIT_PX[event.deltaMode]||1);
      throttle=clamp(throttle*Math.exp(-pixels*THROTTLE_PER_PIXEL),THROTTLE_MIN,1);
    },{passive:false});
    scene.onBeforeRenderObservable.add(function(){
      var dt=Math.min(.05,engine.getDeltaTime()/1000),pad=activeGamepad();
      if(pad&&pad.id!==padId){padId=pad.id;padButtons={};updateHint(pad);console.log('[CAMERA] gamepad active: '+padId);}
      if(!pad&&padId){padId=null;padButtons={};updateHint(null);}

      var f=(keys.has('w')?1:0)-(keys.has('s')?1:0),r=(keys.has('d')?1:0)-(keys.has('a')?1:0),v=(keys.has('e')?1:0)-(keys.has('q')?1:0),padSprint=false,padPrecision=false;
      if(pad){
        var axes=pad.axes||[];
        r+=shapedAxis(axes[0]);f+=-shapedAxis(axes[1]);
        yaw+=shapedAxis(axes[2])*PAD_LOOK_RATE*dt;pitch+=shapedAxis(axes[3])*PAD_LOOK_RATE*dt;pitch=clamp(pitch,-PITCH_LIMIT,PITCH_LIMIT);
        camera.rotation.y=yaw;camera.rotation.x=pitch;
        v+=buttonValue(pad,7)-buttonValue(pad,6);
        padPrecision=buttonValue(pad,4)>.5;padSprint=buttonValue(pad,5)>.5;
        if(padPressedOnce(pad,12))throttle=clamp(throttle*PAD_THROTTLE_STEP,THROTTLE_MIN,1);
        if(padPressedOnce(pad,13))throttle=clamp(throttle/PAD_THROTTLE_STEP,THROTTLE_MIN,1);
        if(padPressedOnce(pad,3)){pitch=0;camera.rotation.x=0;}
        /* Refresh edge state for buttons whose single-press action is not queried above. */
        [0,1,2,4,5,6,7,8,9,10,11,14,15,16].forEach(function(i){padButtons[i]=buttonValue(pad,i)>.5;});
      }
      if(!f&&!r&&!v)return;
      var forward=camera.getForwardRay().direction.clone();forward.y=0;if(forward.lengthSquared()>1e-8)forward.normalize();
      var up=BABYLON.Axis.Y,right=scene.useRightHandedSystem?BABYLON.Vector3.Cross(forward,up):BABYLON.Vector3.Cross(up,forward);
      if(right.lengthSquared()>1e-8)right.normalize();
      var move=BABYLON.Vector3.Zero();if(f)move.addInPlace(forward.scale(f));if(r)move.addInPlace(right.scale(r));
      if(move.lengthSquared()>1)move.normalize();
      var speed=(keys.has('shift')||padSprint?FLY_SPRINT:FLY_SPEED)*throttle;if(padPrecision&&!padSprint)speed*=PAD_PRECISION;
      camera.position.addInPlace(move.scale(speed*dt));camera.position.y+=clamp(v,-1,1)*speed*.7*dt;
      var halfW=battleSim.FIELD_W/2-2,halfD=battleSim.FIELD_D/2-2;
      camera.position.x=clamp(camera.position.x,-halfW,halfW);camera.position.z=clamp(camera.position.z,-halfD,halfD);
      camera.position.y=clamp(camera.position.y,battleSim.heightAt(camera.position.x,camera.position.z)+GROUND_CLEARANCE,MAX_HEIGHT);
    });
    updateHint(activeGamepad());
    return {camera:camera,desktop:true,hint:KEY_HINT+(activeGamepad()?' · '+PAD_HINT:'')};
  }
  /* Normal-play presentation camera for visual testing. `?follow=1` follows the busiest living soldier from a close, persistent ArcRotate camera.
     `?orbit=1` implies follow and slowly circles him. The camera never writes simulation state;
     it only reads the roster/root transforms, and three sim seconds after the followed man dies it
     transfers to the nearest survivor. `followDist` and `orbitSpeed` are intentionally URL-driven so
     screenshots and visual QA are reproducible without touching benchmark-only camera code. */
  function createPersistentFollow(options,target,q){
    var scene=options.scene,canvas=options.canvas,engine=options.engine,
      orbit=q.get('orbit')==='1',
      distance=queryNumber(q,'followDist',FOLLOW_DEFAULT,FOLLOW_MIN,FOLLOW_MAX),
      orbitSpeed=queryNumber(q,'orbitSpeed',ORBIT_SPEED,-1.5,1.5),
      height=queryNumber(q,'followHeight',FOLLOW_HEIGHT,.2,3),
      beta=queryNumber(q,'followBeta',FOLLOW_BETA,.4,1.48),
      alpha=queryNumber(q,'followAlpha',-Math.PI/2,-Math.PI*4,Math.PI*4),
      cam=new BABYLON.ArcRotateCamera('followCam',alpha,beta,distance,target.clone?target.clone():target,scene);
    cam.minZ=.08;cam.maxZ=2600;cam.lowerRadiusLimit=FOLLOW_MIN;cam.upperRadiusLimit=FOLLOW_MAX;
    cam.lowerBetaLimit=.35;cam.upperBetaLimit=1.5;cam.wheelPrecision=18;cam.panningSensibility=0;
    cam.attachControl(canvas,true);scene.activeCamera=cam;
    var man=null,deadAt=null,lastWall=global.performance&&performance.now?performance.now():Date.now(),info={
      mode:'follow',distance:distance,orbit:orbit,orbitSpeed:orbitSpeed,height:height,
      current:null,followed:[],switches:0
    };
    var obs=scene.onBeforeRenderObservable.add(function persistentFollowCamera(){
      var wallNow=global.performance&&performance.now?performance.now():Date.now(),
        orbitDt=Math.min(2,Math.max(0,(wallNow-lastWall)/1000));lastWall=wallNow;
      var b=global.__battle__;if(!b||!b._roster)return;
      var roster=(b._roster.us||[]).concat(b._roster.ge||[]);
      if(man&&roster.indexOf(man)<0){man=null;deadAt=null;}
      var all=livingSoldiers(b);
      if(!man&&all.length){
        man=busiestSoldier(all);deadAt=null;
        if(man){
          info.current=man.id;if(info.followed.length<100)info.followed.push(man.id);
          /* First acquisition should open on the soldier, not spend a second flying in from the
             scenario centre. Later motion stays smoothed. */
          var first=man.root.position;
          cam.target.set(first.x,first.y+height,first.z);
        }
      }
      if(!man)return;
      if(man.dead){
        if(deadAt==null)deadAt=b.time;
        if(b.time-deadAt>=3&&all.length){
          var next=nearestLiving(all,man.root.position);
          if(next){man=next;deadAt=null;info.current=man.id;info.switches++;if(info.followed.length<100)info.followed.push(man.id);}
        }
      }else deadAt=null;
      if(!man.root)return;
      var t=man.root.position,rawDt=Math.max(0,engine.getDeltaTime()/1000),
        smoothDt=Math.min(.05,rawDt),k=1-Math.exp(-smoothDt*12);
      cam.target.x+=(t.x-cam.target.x)*k;
      cam.target.y+=(t.y+height-cam.target.y)*k;
      cam.target.z+=(t.z-cam.target.z)*k;
      /* Orbit is a real-time inspection speed, not a per-frame speed. Do not apply the follow
         smoothing clamp here or low-FPS devices/headless validation orbit in slow motion. */
      if(orbit)cam.alpha+=orbitSpeed*orbitDt;
      info.current=man.id;info.radius=cam.radius;info.alpha=cam.alpha;info.beta=cam.beta;
    });
    var hint=(orbit?'Follow orbit':'Follow camera')+': '+distance.toFixed(distance%1?1:0)+' m · drag to orbit · wheel zoom'+
      (orbit?' · auto '+orbitSpeed.toFixed(2)+' rad/s':'')+' · switches on death';
    return{
      camera:cam,desktop:false,hint:hint,mode:'follow',follow:info,
      stop:function(){scene.onBeforeRenderObservable.remove(obs);try{cam.detachControl(canvas);}catch(_){}}
    };
  }

  function createAdaptive(options,target){
    var scene=options.scene,canvas=options.canvas,engine=options.engine,battleSim=options.battleSim,
      q=queryParams(),followRequested=q.get('follow')==='1'||q.get('orbit')==='1';
    if(followRequested)return createPersistentFollow(options,target,q);
    var initialPad=activeGamepad();
    var initial=(desktopPointer()||initialPad)?createDesktopFly(scene,canvas,target,engine,battleSim):createTouchOrbit(scene,canvas,target);
    var state={camera:initial.camera,desktop:initial.desktop,hint:initial.hint};
    var wakeObserver=null;
    function setHint(text){var el=document.getElementById('cameraHint');if(el)el.textContent=text;}
    function switchToGamepad(pad,source){
      if(state.desktop)return;
      pad=pad||activeGamepad();if(!pad)return;
      var old=state.camera,pose=cameraPose(old,target);
      try{if(old&&old.detachControl)old.detachControl(canvas);}catch(_){}
      try{if(old&&old.dispose)old.dispose();}catch(_){}
      var next=createDesktopFly(scene,canvas,target,engine,battleSim,pose);
      state.camera=next.camera;state.desktop=true;state.hint=next.hint;setHint(next.hint);
      if(wakeObserver){scene.onBeforeRenderObservable.remove(wakeObserver);wakeObserver=null;}
      console.log('[CAMERA] gamepad wake switched touch orbit to fly ('+source+'): '+(pad.id||'gamepad'));
    }
    if(!state.desktop&&hasGamepadAPI()){
      global.addEventListener('gamepadconnected',function(e){switchToGamepad(e&&e.gamepad,'event');});
      /* iOS/WebKit can withhold a Bluetooth controller from getGamepads() until user input.
         Poll while touch-orbit is active so either a stick movement or button press that exposes
         the pad can hand control to the fly camera without a reload. */
      wakeObserver=scene.onBeforeRenderObservable.add(function(){var pad=activeGamepad();if(pad)switchToGamepad(pad,'poll');});
    }
    return state;
  }
  global.BattleDesktopCamera={
    current:null,
    create:function(options){
      var target=new BABYLON.Vector3(options.scenario.center.x,4,options.scenario.center.z);
      var result=createAdaptive(options,target);
      global.BattleDesktopCamera.current=result;
      if(result.mode==='follow'){
        console.log('[CAMERA] persistent follow active · distance='+result.follow.distance+'m · orbit='+(result.follow.orbit?'on':'off')+' · orbitSpeed='+result.follow.orbitSpeed);
      }else{
        console.log('[CAMERA] '+(result.desktop?'ww2fps Model Lab desktop/gamepad fly controls':'touch orbit controls; waiting for gamepad wake')+' active');
      }
      return result;
    }
  };
})(window);
