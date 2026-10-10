#!/usr/bin/env node
'use strict';
/* Browser WebGL verification of the shipped grenade area-density fog shader.
   Boots a tiny true Babylon scene on the branch preview (no battle/assets),
   tests a detonation footprint, shader compilation, fog alpha, and the off flag. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ENTRY = process.env.GRENADE_FOG_PREVIEW ||
  'https://test.ivandpopov.com/grasstex/preview.php?ref=claude/grenade-sounds-r27grv';
const HTML = `<!doctype html><html><head><meta charset="utf-8">
<style>body{margin:0;background:#222}canvas{width:640px;height:360px;display:block}</style>
</head><body><canvas id="c" width="640" height="360"></canvas>
<script src="https://cdn.jsdelivr.net/npm/babylonjs@9.27.1/babylon.js"></script>
<script>
window._systems = {};
window.BattleGrenades = { parseOn: () => true, on: () => true,
  projectiles: () => [], pendingOf: () => false };
window.BattleModules = { registerSystem: (name, spec) => window._systems[name] = spec,
  unitsFor: () => [] };
BABYLON.SceneLoader.IsPluginForExtensionAvailable = () => true;
BABYLON.LoadAssetContainerAsync = async () => ({ meshes: [], dispose() {} });
</script>
<script src="modules/24-grenade-fx.js"></script>
<script>
(async () => {
  const B=BABYLON, canvas=document.getElementById('c');
  const engine=new B.Engine(canvas,true,{preserveDrawingBuffer:true,antialias:false});
  engine.setSize(640,360);
  const scene=new B.Scene(engine);
  scene.clearColor = new B.Color4(0.52,0.59,0.65,1);
  const camera=new B.ArcRotateCamera('camera',-Math.PI/2,1.17,13,new B.Vector3(0,1.2,0),scene);
  scene.activeCamera=camera;
  new B.HemisphericLight('hemi',new B.Vector3(0,1,0),scene).intensity=1.15;
  const ground=B.MeshBuilder.CreateGround('ground',{width:45,height:45},scene);
  const gm=new B.StandardMaterial('earth',scene);
  gm.diffuseColor=new B.Color3(0.23,0.28,0.17);
  ground.material=gm;
  const backdrop=B.MeshBuilder.CreateBox('backdrop',{width:3.5,height:4,depth:0.5},scene);
  backdrop.position.set(0,2,-4.7);
  const bm=new B.StandardMaterial('backdropMat',scene);
  bm.diffuseColor=new B.Color3(0.12,0.19,0.24);
  backdrop.material=bm;
  const sim={time:0,scene,onGrenadeBurst(){}};
  window._systems['grenade-fx'].onBattleStart(sim);
  window._fogTest={engine,scene,camera,sim,canvas};
  scene.render();
  window._fogTest.sample=() => {
    scene.render();
    const out=new Uint8Array(4);
    engine._gl.readPixels(320,180,1,1,engine._gl.RGBA,engine._gl.UNSIGNED_BYTE,out);
    return Array.from(out);
  };
  window._fogReady=true;
})();
</script></body></html>`;

(async () => {
  const browser = await chromium.launch({
    headless:true,
    args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
      '--enable-webgl','--ignore-certificate-errors']
  });
  try {
    const context = await browser.newContext({ viewport: { width: 640, height: 360 },
      ignoreHTTPSErrors:true });
    const redirect = await context.request.get(ENTRY, { maxRedirects:0, timeout:90000 });
    assert.equal(redirect.status(),302,'preview staging redirects to a commit-pinned runtime');
    const destination=new URL(redirect.headers().location, ENTRY);
    const root=destination.href.slice(0,destination.href.lastIndexOf('/')+1);
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',err=>errors.push(err.stack||String(err)));
    page.on('console',msg=>{ if(msg.type()==='error') errors.push('console: '+msg.text()); });
    await page.route(root+'battle/grenade-fog-probe.html*',route=>route.fulfill({body:HTML,contentType:'text/html'}));
    await page.goto(root+'battle/grenade-fog-probe.html?grenades=1',{waitUntil:'load',timeout:90000});
    await page.waitForFunction(()=>window._fogReady,{timeout:45000});
    const result=await page.evaluate(async () => {
      const t=_fogTest, fx=BattleGrenadeFx;
      const before=t.sample();
      t.sim.onGrenadeBurst({id:123,to:{x:0,y:0,z:0},kind:'mk2'});
      const after=t.sample(), volumes=t.scene.meshes.filter(m=>m.name.startsWith('grenadeAreaFog'));
      const mat=volumes[0]?.material;
      const ready=mat?.getEffect()?.isReady()||false;
      const transparency=mat?.needAlphaBlending();
      const present=fx.status(t.sim);
      t.sim.time=3;
      const fade3=t.sample();
      t.sim.time=10;
      t.sample();
      const cleared=fx.status(t.sim);
      return {before,after,fade3,ready,transparency,present,cleared,
        volumeCount:volumes.length,vertexCount:volumes[0]?.getTotalVertices(),
        difference:Math.max(...after.slice(0,3).map((v,i)=>Math.abs(v-before[i])))};
    });
    console.log('GRENADE AREA FOG QA:',JSON.stringify(result));
    assert.equal(result.ready,true,'volume shader compiles in Babylon/WebGL');
    assert.equal(result.transparency,true,'volume uses transparent compositing');
    assert.equal(result.volumeCount,1,'one fog volume, no emitted particles');
    assert.equal(result.present.fogVolumes,1,'fog exists on detonation frame');
    assert.equal(result.cleared.fogVolumes,0,'10 simulated seconds clear the volume');
    assert.ok(result.difference>5,'actual framebuffer pixels changed inside fog');
    await page.goto(root+'battle/grenade-fog-probe.html?grenades=1&grenadeFog=off',{waitUntil:'load'});
    await page.waitForFunction(()=>window._fogReady,{timeout:45000});
    const disabled=await page.evaluate(()=>{
      _fogTest.sim.onGrenadeBurst({id:456,to:{x:0,y:0,z:0}});
      _fogTest.scene.render();
      return BattleGrenadeFx.status(_fogTest.sim);
    });
    assert.equal(disabled.fogVolumes,0,'mobile optional off disables only smoke');
    assert.deepEqual(errors,[],'no shader / page / FX errors');
    console.log('grenade-area-fog-browser: PASS');
  } finally {
    await browser.close();
  }
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
