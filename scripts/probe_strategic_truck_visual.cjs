'use strict';
/* Real Chromium opt-in 5km truck visual smoke. Exercises BOTH faction meshes and
   near-camera seated rider import without mutating the authoritative transport. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execSync}=require('node:child_process');
function playwright(){try{return require('playwright');}catch(_){return require(path.join(execSync('npm root -g').toString().trim(),'playwright'));}}
const base=process.env.STRATEGIC_QA_URL||'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const out=path.resolve(process.env.STRATEGIC_TRUCK_QA_OUT||'closeups/strategic-truck-ci');
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const {chromium}=playwright(),browser=await chromium.launch({args:[
    '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
    '--enable-webgl','--ignore-gpu-blocklist','--ignore-certificate-errors','--no-sandbox'
  ]});
  const page=await browser.newPage({ignoreHTTPSErrors:true,viewport:{width:1360,height:820}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.stack||e).slice(0,1400)));
  const wav=Buffer.alloc(44+4410),n=2205;
  wav.write('RIFF',0);wav.writeUInt32LE(36+n*2,4);wav.write('WAVE',8);
  wav.write('fmt ',12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
  wav.writeUInt32LE(22050,24);wav.writeUInt32LE(44100,28);wav.writeUInt16LE(2,32);
  wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(n*2,40);
  await page.route(/\/Assets\/audio\/.*\.mp3(?:\?.*)?$/,route=>route.fulfill({status:200,contentType:'audio/wav',body:wav}));
  const url=base+(base.includes('?')?'&':'?')+
    'strategicInterception=1&motorTransport=1&truckShowcase=1&seed=strategic-truck-qa-0001&log=0';
  const began=Date.now();
  try{
    await page.goto(url,{waitUntil:'load',timeout:180000});
    await page.waitForFunction(()=>!!(window.__battle__&&window.__scenario__&&window.BattleTransportVehicleVisual),null,{timeout:180000});
    const baseline=await page.evaluate(()=>{
      const b=window.__battle__;
      return {us:b.factions.us.squads.length,ge:b.factions.ge.squads.length,
        profile:window.__scenario__.profile,
        usSoldiers:b._roster.us.length,geSoldiers:b._roster.ge.length};
    });
    assert.equal(baseline.profile,'strategic');
    assert.equal(baseline.us,5);assert.equal(baseline.ge,5);
    await page.evaluate(()=>window.__battle__.resume());
    await page.waitForFunction(()=>{
      const a=window.BattleTransportVehicleVisual.summary(window.__battle__);
      return a.some(t=>t.faction==='us'&&t.meshReady) &&
        a.some(t=>t.faction==='ge'&&t.meshReady);
    },null,{timeout:120000});
    const both=await page.evaluate(()=>{
      const b=window.__battle__,api=window.BattleTransportVehicleVisual;
      return {summary:api.summary(b),time:b.time,
        rootNames:b.scene.transformNodes.filter(x=>x.name.startsWith('strategicTruck-')).map(x=>x.name),
        usAlive:b.factions.us.alive,geAlive:b.factions.ge.alive};
    });
    assert.ok(both.summary.some(t=>t.faction==='us'&&t.meshReady&&t.model==='german_transport.fbx'));
    assert.ok(both.summary.some(t=>t.faction==='ge'&&t.meshReady&&t.model==='german_transport.fbx'));
    assert.equal(both.usAlive,baseline.usSoldiers);
    assert.equal(both.geAlive,baseline.geSoldiers);
    const nearby=await page.evaluate(()=>{
      const b=window.__battle__,c=b.scene.activeCamera;
      const node=b.scene.transformNodes.find(n=>n.name.startsWith('strategicTruck-us-showcase/us'));
      if(!node)throw Error('US showcase truck transform missing');
      c.position.set(node.position.x+15,node.position.y+13,node.position.z+19);
      c.setTarget(new BABYLON.Vector3(node.position.x,node.position.y+2,node.position.z));
      return {x:node.position.x,z:node.position.z};
    });
    await page.waitForFunction(()=>{
      const s=window.BattleTransportVehicleVisual.summary(window.__battle__);
      return s.some(t=>t.faction==='us'&&t.renderedRiders>=1);
    },null,{timeout:120000});
    await page.waitForTimeout(800);
    const final=await page.evaluate(()=>{
      const b=window.__battle__,a=window.BattleTransportVehicleVisual.summary(b);
      const truck=b.scene.transformNodes.find(n=>n.name==='strategicTruck-us-showcase/us');
      if(!truck)throw Error('US showcase truck disappeared during crew rendering');
      const origin=truck.getAbsolutePosition();
      const passengerNodes=b.scene.transformNodes.filter(n=>n.name.startsWith('truckPassenger-showcase/us-'));
      const passengerOffsets=passengerNodes.map(node=>{
        const pos=node.getAbsolutePosition();
        return Math.hypot(pos.x-origin.x,pos.y-origin.y,pos.z-origin.z);
      });
      return {trucks:a,passengerOffsets,vertices:b.scene.getTotalVertices(),
        meshes:b.scene.meshes.length,renderFps:b.scene.getEngine().getFps()};
    });
    await page.screenshot({path:path.join(out,'us-truck-seated-crew.png')});
    assert.ok(final.trucks.find(t=>t.faction==='us').renderedRiders>=1);
    assert.ok(final.passengerOffsets.length>=1,'Imported seated soldier transforms must exist');
    assert.ok(final.passengerOffsets.every(d=>d<8),
      'Every seated rider must be within 8m of the truck, not thousands of metres away: '+
      JSON.stringify(final.passengerOffsets));
    // Repeat the seated-rider proof for GE, not just the shared truck mesh.
    await page.evaluate(()=>{
      const b=window.__battle__,c=b.scene.activeCamera;
      const node=b.scene.transformNodes.find(n=>n.name==='strategicTruck-ge-showcase/ge');
      if(!node)throw Error('German showcase truck transform missing');
      c.position.set(node.position.x+15,node.position.y+13,node.position.z+19);
      c.setTarget(new BABYLON.Vector3(node.position.x,node.position.y+2,node.position.z));
    });
    await page.waitForFunction(()=>{
      const s=window.BattleTransportVehicleVisual.summary(window.__battle__);
      return s.some(t=>t.faction==='ge'&&t.renderedRiders>=1);
    },null,{timeout:120000});
    const germanCrew=await page.evaluate(()=>{
      const b=window.__battle__,scene=b.scene;
      const truck=scene.transformNodes.find(n=>n.name==='strategicTruck-ge-showcase/ge');
      const origin=truck.getAbsolutePosition();
      const offsets=scene.transformNodes
        .filter(n=>n.name.startsWith('truckPassenger-showcase/ge-'))
        .map(n=>{const p=n.getAbsolutePosition();
          return Math.hypot(p.x-origin.x,p.y-origin.y,p.z-origin.z);});
      return {offsets,summary:window.BattleTransportVehicleVisual.summary(b)
        .filter(t=>t.faction==='ge')};
    });
    assert.ok(germanCrew.offsets.length>=1,'German crew must load its own soldier FBX');
    assert.ok(germanCrew.offsets.every(d=>d<8),
      'German riders must be seated inside the shared truck: '+JSON.stringify(germanCrew.offsets));
    await page.screenshot({path:path.join(out,'ge-truck-seated-crew.png')});
    assert.deepEqual(errors,[],'uncaught Chromium errors');
    const report={baseline,both,nearby,final,germanCrew,elapsedMs:Date.now()-began,errors};
    fs.writeFileSync(path.join(out,'truck-visual-report.json'),JSON.stringify(report,null,2)+'\n');
    console.log('STRATEGIC TRUCK CHROMIUM PASS '+JSON.stringify({elapsedMs:report.elapsedMs,nearby,summary:final.trucks}));
  }catch(e){
    try{await page.screenshot({path:path.join(out,'truck-visual-failure.png')});}catch(_){}
    const details=await page.evaluate(()=>{
      const b=window.__battle__;
      const st=b&&window.BattleTransportVehicleVisual;
      return {sceneReady:!!b,visualApi:!!st,
        summary:b&&st?st.summary(b):null};
    }).catch(x=>({error:String(x)}));
    fs.writeFileSync(path.join(out,'truck-visual-failure.json'),
      JSON.stringify({error:String(e.stack||e),pageErrors:errors,details},null,2));
    throw e;
  }finally{await browser.close();}
})().catch(err=>{console.error('STRATEGIC TRUCK CHROMIUM FAIL',err&&err.stack||err);process.exitCode=1;});
