'use strict';
/* Chromium validation of actual squad actors sitting in the 5km transport.
   Test injects a synthetic embarked transport PRESENTATION snapshot while the
   simulation is paused; this is a visual identity test, not a simulated route. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {execSync}=require('node:child_process');
function playwright(){
  try{return require('playwright');}
  catch(_){return require(path.join(execSync('npm root -g').toString().trim(),'playwright'));}
}
const base=process.env.STRATEGIC_QA_URL||'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const out=path.resolve(process.env.STRATEGIC_TRUCK_QA_OUT||'closeups/strategic-truck-ci');
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const {chromium}=playwright();
  const browser=await chromium.launch({args:[
    '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
    '--enable-webgl','--ignore-gpu-blocklist','--ignore-certificate-errors','--no-sandbox'
  ]});
  const page=await browser.newPage({ignoreHTTPSErrors:true,viewport:{width:1360,height:820}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.stack||e).slice(0,1600)));
  const wav=Buffer.alloc(44+4410),n=2205;
  wav.write('RIFF',0);wav.writeUInt32LE(36+n*2,4);wav.write('WAVE',8);
  wav.write('fmt ',12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
  wav.writeUInt32LE(22050,24);wav.writeUInt32LE(44100,28);wav.writeUInt16LE(2,32);
  wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(n*2,40);
  await page.route(/\/Assets\/audio\/.*\.mp3(?:\?.*)?$/,route=>
    route.fulfill({status:200,contentType:'audio/wav',body:wav}));
  const url=base+(base.includes('?')?'&':'?')+
    'strategicInterception=1&motorTransport=1&truckShowcase=1&seed=strategic-truck-live-crew-qa-0001&log=0';
  const began=Date.now();
  try{
    await page.goto(url,{waitUntil:'load',timeout:180000});
    await page.waitForFunction(()=>
      !!(window.__battle__&&window.__scenario__&&window.BattleTransportVehicleVisual&&
        window.BattleFbxSoldier?.status(window.__battle__.scene).ready),
      null,{timeout:180000});
    const initial=await page.evaluate(()=>{
      const b=window.__battle__;
      return {profile:window.__scenario__.profile,
        us:b.factions.us.squads.length,ge:b.factions.ge.squads.length,
        soldiers:b._roster.us.length+b._roster.ge.length,
        skeletons:b.scene.skeletons.length};
    });
    assert.equal(initial.profile,'strategic');assert.equal(initial.us,5);assert.equal(initial.ge,5);
    await page.evaluate(()=>window.__battle__.resume());
    await page.waitForFunction(()=>{
      const s=window.BattleTransportVehicleVisual.summary(window.__battle__);
      return s.filter(x=>x.showcase&&x.meshReady).length===2;
    },null,{timeout:120000});
    const showcases=await page.evaluate(()=>
      window.BattleTransportVehicleVisual.summary(window.__battle__).filter(x=>x.showcase));
    assert.ok(showcases.every(x=>x.renderedRiders===0&&x.seats===0),
      'The parked showcase must NOT borrow active soldiers from a combat squad');
    await page.waitForFunction(()=>{
      const b=window.__battle__,model=window.BattleFbxSoldier;
      return !!model.vehiclePoseClip(b.factions.us.squads[0].members[0],'Truck - Driving.fbx') &&
        !!model.vehiclePoseClip(b.factions.ge.squads[0].members[0],'Truck - Sitting 1.fbx');
    },null,{timeout:160000});

    const setup=await page.evaluate(()=>{
      const b=window.__battle__;
      b.pause();
      const transportSystem=window.BattleModules.getSystem('strategic-truck-visual');
      if(!transportSystem)throw Error('Truck system not registered');
      window.__truckQa={squads:{},soldiers:{},roots:{},system:transportSystem};
      for(const faction of ['us','ge']){
        const squad=b.factions[faction].squads.find(s=>!s._transport&&s.members.length>0);
        if(!squad)throw Error('No available '+faction+' squad for isolated passenger test');
        window.__truckQa.squads[faction]=squad;
        window.__truckQa.soldiers[faction]=squad.members.slice(0,10);
        window.__truckQa.roots[faction]=squad.members.map(s=>s.root.position.clone());
        const p=squad.members[0].root.position;
        squad._transport={phase:'embarked',position:{x:p.x,z:p.z},
          heading:{x:0,z:faction==='us'?1:-1}};
      }
      const scene=b.scene;
      window.__truckQaBefore={skeletons:scene.skeletons.length,
        meshes:scene.meshes.length,groups:scene.animationGroups.length};
      transportSystem.onSimulationStep(b,{dt:0});
      return {skeletons:scene.skeletons.length,models:['us','ge'].map(f=>
        window.__truckQa.soldiers[f].map(s=>s._fbx?.lib?.file||null))};
    });
    // No additional soldier FBX model parse occurs at boarding.
    await page.waitForFunction(()=>{
      const qa=window.__truckQa,b=window.__battle__;
      qa.system.onSimulationStep(b,{dt:0});
      const summaries=window.BattleTransportVehicleVisual.summary(b);
      return ['us','ge'].every(f=>{
        const sq=qa.squads[f],t=summaries.find(t=>t.squad===sq.id&&t.faction===f&&!t.showcase);
        return !!(t&&t.meshReady&&t.renderedRiders===qa.soldiers[f].length);
      });
    },null,{timeout:120000});

    const report=await page.evaluate(()=>{
      const b=window.__battle__,qa=window.__truckQa;
      const all=window.BattleTransportVehicleVisual.summary(b);
      const per={};
      for(const faction of ['us','ge']){
        const sq=qa.squads[faction],soldiers=qa.soldiers[faction];
        const truck=b.scene.transformNodes.find(n=>
          n.name==='strategicTruck-'+faction+'-'+sq.id);
        if(!truck)throw Error('Missing '+faction+' truck root');
        const p=truck.getAbsolutePosition();
        per[faction]={
          squadId:sq.id,
          riders:soldiers.map((soldier,index)=>{
            const presentation=window.BattleTransportVehicleVisual.seatForSoldier(soldier);
            const anchor=soldier._fbx?.holder?.parent;
            const anchorPos=anchor&&anchor.getAbsolutePosition();
            return {id:soldier.id,role:soldier.role,
              model:soldier._fbx?.lib?.file||null,
              seat:presentation?.seatIndex??null,
              clip:presentation?.animation||null,
              sameObject:qa.soldiers[faction][index]===soldier,
              inAnchor:anchor?.name==='truckSeat-'+sq.id+'-'+index,
              dist:anchorPos?Math.hypot(p.x-anchorPos.x,p.y-anchorPos.y,p.z-anchorPos.z):null,
              rootUnchanged:soldier.root.position.equals(qa.roots[faction][index])
            };
          })
        };
      }
      return {per,showcases:all.filter(x=>x.showcase),
        skeletonsBefore:qaBefore().skeletons,skeletonsAfter:b.scene.skeletons.length,
        animationGroupsBefore:qaBefore().groups,animationGroupsAfter:b.scene.animationGroups.length,
        meshesBefore:qaBefore().meshes,meshesAfter:b.scene.meshes.length,
        fps:b.scene.getEngine().getFps()};
      function qaBefore(){return qaBeforeData();}
      function qaBeforeData(){return window.__truckQaBefore;}
    });
    for(const faction of ['us','ge']){
      const riders=report.per[faction].riders;
      assert.equal(riders.length,setup.models[faction==='us'?0:1].length);
      assert.ok(riders.every(r=>r.sameObject&&r.inAnchor&&r.rootUnchanged),
        faction+' soldier models must be ORIGINAL actors with untouched sim roots');
      assert.ok(riders.every(r=>r.dist!==null&&r.dist<8),
        faction+' squad seated within truck geometry');
      assert.ok(riders.every((r,i)=>r.model===setup.models[faction==='us'?0:1][i]),
        faction+' original role-specific models preserved');
      assert.ok(riders.every((r,i)=>r.seat===i&&r.clip?.startsWith('Truck - ')),
        faction+' real seat assignment with one Truck animation each');
      await page.evaluate((side)=>{
        const b=window.__battle__,sq=window.__truckQa.squads[side];
        const node=b.scene.transformNodes.find(n=>n.name==='strategicTruck-'+side+'-'+sq.id);
        const cam=b.scene.activeCamera;
        cam.position.set(node.position.x+14,node.position.y+12,node.position.z+17);
        cam.setTarget(new BABYLON.Vector3(node.position.x,node.position.y+2,node.position.z));
      },faction);
      await page.waitForTimeout(800);
      await page.screenshot({path:path.join(out,faction+'-actual-squad-seated.png')});
    }
    assert.equal(report.skeletonsAfter,report.skeletonsBefore,
      'No new skinned soldier models can be created at boarding');
    assert.equal(report.animationGroupsAfter,report.animationGroupsBefore,
      'No one-by-one Babylon Truck animation import at boarding');
    // Dismount and verify normal FBX rig hierarchy restored immediately.
    const dismount=await page.evaluate(()=>{
      const b=window.__battle__,qa=window.__truckQa,results={};
      for(const faction of ['us','ge'])qa.squads[faction]._transport.phase='dismounted';
      qa.system.onSimulationStep(b,{dt:0});
      for(const faction of ['us','ge']){
        results[faction]=qa.soldiers[faction].map(s=>({
          seat:!!s._vehiclePresentation,fxSeat:!!s._fbx?!!s._fbx._vehicleSeat:false,
          parentBack:s._fbx?.holder?.parent===s.poseRoot,
          socketBack:s._fbx?.socket?.parent===s.root
        }));
        qa.squads[faction]._transport=null;
      }
      qa.system.onSimulationStep(b,{dt:0});
      return results;
    });
    for(const faction of ['us','ge'])
      assert.ok(dismount[faction].every(x=>!x.seat&&!x.fxSeat&&x.parentBack&&x.socketBack),
        faction+' dismount restores original FBX root and weapon hierarchy');
    // Re-embark the very same live actors, then restart WHILE OCCUPIED.
    // Old truck-seat parents must be restored in beforeBattleRestart, before
    // BattleSim disposes the old soldier roots. Otherwise their detached
    // weapon sockets remain parented to a truck and form orphan gun piles.
    const restartCleanup=await page.evaluate(()=>{
      const b=window.__battle__,qa=window.__truckQa;
      for(const faction of ['us','ge']){
        const squad=qa.squads[faction],p=squad.members[0].root.position;
        squad._transport={phase:'embarked',position:{x:p.x,z:p.z},
          heading:{x:0,z:faction==='us'?1:-1}};
      }
      qa.system.onSimulationStep(b,{dt:0});
      const previous=['us','ge'].flatMap(f=>qa.soldiers[f]);
      if(!previous.every(s=>s._vehiclePresentation && s._fbx?._vehicleSeat))
        throw Error('Could not re-embark real squads for occupied restart QA');
      const old=previous.map(s=>({soldier:s,fx:s._fbx,
        held:s.weapon?.mesh||null,weaponSocket:s.weaponSocket,
        poseRoot:s.poseRoot}));
      b.restart();
      return {
        oldActors:old.length,
        allSeatsCleared:old.every(x=>!x.soldier._vehiclePresentation&&!x.fx._vehicleSeat),
        allSocketsDisposed:old.every(x=>x.weaponSocket.isDisposed()),
        allHoldersDisposed:old.every(x=>x.fx.holder.isDisposed()),
        oldWeaponsDisposed:old.every(x=>!x.held||x.held.isDisposed()),
        currentRoster:b._roster.us.length+b._roster.ge.length,
        oldActorRootsDisposed:old.every(x=>x.soldier.root.isDisposed()),
        ghostWeaponMeshNames:b.scene.meshes.filter(m=>m.name.startsWith('weapon.')&&
          old.some(x=>x.held===m)).map(m=>m.name)
      };
    });
    assert.equal(restartCleanup.oldActors,20);
    assert.ok(restartCleanup.allSeatsCleared&&restartCleanup.allSocketsDisposed&&
      restartCleanup.allHoldersDisposed&&restartCleanup.oldWeaponsDisposed&&
      restartCleanup.oldActorRootsDisposed,
      'Occupied restart must clean old actor FBX holders and all rifle sockets: '+
        JSON.stringify(restartCleanup));
    assert.deepEqual(restartCleanup.ghostWeaponMeshNames,[],
      'No detached rifle meshes may survive occupied restart');
    assert.equal(restartCleanup.currentRoster,initial.soldiers);

    // End, try P (possession must not resume a terminal session), then
    // restart and end again using the *other* End battle control. Both
    // routes must show the complete diagnostic export choices.
    const postBattle=[];
    for(const selector of ['#restartBtn','#endBattleBtn','#restartBtn']){
      await page.locator(selector).click();
      await page.waitForFunction(()=>{
        const b=window.__battle__,banner=document.getElementById('banner');
        return b.manualEnded&&b.paused&&banner.style.display==='flex';
      });
      const state=await page.evaluate(()=>{
        const b=window.__battle__,ids=['bannerExportCompactDiagnostics','bannerExportDiagnostics'];
        return {ended:b.manualEnded,paused:b.paused,
          buttons:ids.map(id=>!!document.getElementById(id)),
          bannerVisible:document.getElementById('banner').style.display==='flex'};
      });
      assert.ok(state.bannerVisible && state.buttons.every(Boolean),
        'Each end route must show both diagnostic export actions: '+JSON.stringify(state));
      await page.keyboard.press('p');
      const stillEnded=await page.evaluate(()=>{
        const b=window.__battle__;
        return b.manualEnded&&b.paused&&document.getElementById('banner').style.display==='flex';
      });
      assert.ok(stillEnded,'P must not resume after battle is ended');
      postBattle.push({selector, ...state,pGuarded:stillEnded});
      await page.locator('#bannerRestart').click();
      await page.waitForFunction(()=>{
        const b=window.__battle__;
        return !b.manualEnded&&!b.winner&&document.getElementById('banner').style.display==='none';
      });
    }
    assert.deepEqual(errors,[],'Browser JavaScript errors');
    const data={initial,setup,report,dismount,restartCleanup,postBattle,
      elapsedMs:Date.now()-began,errors};
    fs.writeFileSync(path.join(out,'truck-visual-report.json'),JSON.stringify(data,null,2)+'\n');
    console.log('STRATEGIC TRUCK CHROMIUM PASS '+JSON.stringify({
      elapsedMs:data.elapsedMs,
      usModels:report.per.us.riders.map(x=>x.model),
      geModels:report.per.ge.riders.map(x=>x.model),
      skeletonIncrease:report.skeletonsAfter-report.skeletonsBefore,
      animationGroupIncrease:report.animationGroupsAfter-report.animationGroupsBefore,
      dismountRestored:true,orphanWeapons:restartCleanup.ghostWeaponMeshNames.length,
      postBattleEndCycles:postBattle.length,pGuarded:true
    }));
  }catch(e){
    try{await page.screenshot({path:path.join(out,'truck-visual-failure.png')});}catch(_){}
    const details=await page.evaluate(()=>{
      const b=window.__battle__,a=window.BattleTransportVehicleVisual;
      return {sceneReady:!!b,summary:b&&a?a.summary(b):null,
        modelReady:b&&window.BattleFbxSoldier?.status(b.scene)};
    }).catch(x=>({error:String(x)}));
    fs.writeFileSync(path.join(out,'truck-visual-failure.json'),JSON.stringify({
      error:String(e.stack||e),errors,details
    },null,2));
    throw e;
  }finally{await browser.close();}
})().catch(err=>{console.error('STRATEGIC TRUCK CHROMIUM FAIL',err&&err.stack||err);process.exitCode=1;});
