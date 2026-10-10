/* Interactive Damage Range probe.
 * Boots ?damageRange=1 on the real battle page, verifies the stationary 10-man role lineup and
 * selected-target camera, fires shipping onFire/onShot events, and proves UV wounds accumulate per
 * soldier without falling back to quads. Captures a wounded lineup and an explicit death.
 *
 * Env: DR_URL, DR_SEED, DR_OUT.
 */
const path=require('node:path'),fs=require('node:fs');

function loadPlaywright(){
  try{return require('playwright');}catch(_){
    const {execSync}=require('node:child_process');
    return require(path.join(execSync('npm root -g').toString().trim(),'playwright'));
  }
}
const URL_=process.env.DR_URL||'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SEED=process.env.DR_SEED||'damage-range-probe';
const OUT=path.resolve(process.env.DR_OUT||'closeups/damage-range');
/* Private audio is tested in the audio pipeline, not in this public-browser visual QA.
 * Fulfill soundtrack requests with decodable PCM silence rather than false 404 pageerrors. */
function silentWav(){
  const samples=2205,b=Buffer.alloc(44+samples*2);
  b.write('RIFF',0);b.writeUInt32LE(b.length-8,4);b.write('WAVE',8);b.write('fmt ',12);
  b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);
  b.writeUInt32LE(22050,24);b.writeUInt32LE(44100,28);
  b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);
  b.writeUInt32LE(samples*2,40);
  return b;
}
const silentAudio=silentWav();
const navigationTrace=[];
const browserEvents=[];
let diagnosticLogs=[];
let diagnosticErrors=[];
let diagnosticPage=null;

(async()=>{
  const {chromium}=loadPlaywright();fs.mkdirSync(OUT,{recursive:true});
  const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--ignore-certificate-errors','--no-sandbox']});
  const page=await browser.newPage({ignoreHTTPSErrors:true,viewport:{width:1280,height:760}});
  diagnosticPage=page;
  page.on('crash',()=>browserEvents.push('page crashed'));
  page.on('close',()=>browserEvents.push('page closed'));
  page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigationTrace.push(frame.url());});
  const errors=[],logs=[];
  diagnosticLogs=logs;
  diagnosticErrors=errors;
  page.on('pageerror',e=>errors.push(String(e&&e.stack||e).slice(0,500)));
  page.on('console',m=>logs.push('['+m.type()+'] '+m.text()));
  await page.route('**/*',route=>{
    const req=route.request();
    if(req.method()==='POST'||/battle_(policy|learning|log|metrics)[^/]*\.php/.test(req.url()))return route.fulfill({json:{}});
    if(/\/Assets\/audio\/.*\.(?:mp3|wav|ogg)(?:[?#]|$)/i.test(req.url()))return route.fulfill({status:200,body:silentAudio,contentType:'audio/wav'});
    return route.continue();
  });
  const q='seed='+encodeURIComponent(SEED)+'&damageRange=1&rangeExit=1&rangeTarget=0&rangeZone=chest';
  await page.goto(URL_+(URL_.includes('?')?'&':'?')+q,{waitUntil:'load',timeout:300000});
  await page.waitForFunction(()=>window.__battle__&&window.BattleDamageRange&&BattleDamageRange.ready,null,{timeout:300000,polling:100});

  const snap=()=>page.evaluate(()=> {
    const R=BattleDamageRange,b=__battle__,s=R.state();
    return Object.assign({},s,{
      build:window.BATTLE_BUILD,
      targetDead:R.targets[s.target]&&R.targets[s.target].dead,
      roots:R.targets.map(t=>({id:t.id,x:+t.root.position.x.toFixed(3),y:+t.root.position.y.toFixed(3),z:+t.root.position.z.toFixed(3)})),
      body:(b._impactFx&&b._impactFx.body||[]).map(e=>({uv:!!e.uv,exit:!!e.exit,soldier:e.soldier&&e.soldier.id,resolution:e.resolution||null})),
      maps:(b._impactFx&&b._impactFx.surfaceMaps||[]).map(e=>e.soldier&&e.soldier.id)
    });
  });

  const fail=[],initial=await snap();
  if(initial.targets.length!==10)fail.push('expected 10 role targets, got '+initial.targets.length);
  const required=['US rifleman','GER rifleman','US sergeant','GER sergeant','US scout','GER scout','US gunner','GER gunner','US engineer','GER engineer'];
  required.forEach(x=>{if(!initial.targets.includes(x))fail.push('missing '+x);});
  if(initial.camera!=='damageRangeCam')fail.push('range camera not active');
  if(initial.enabledSoldiers!==11)fail.push('expected 10 targets + 1 shooter enabled, got '+initial.enabledSoldiers);

  await page.waitForTimeout(1200);
  const stable=await snap();
  for(let i=0;i<initial.roots.length;i++){
    const a=initial.roots[i],b=stable.roots[i];
    if(!b||Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)>.002)fail.push('target root moved while AI should be frozen: '+a.id);
  }

  // Do not return fire() to Playwright: the shot includes the full Babylon victim/scene graph.
  // Serializing that graph over DevTools can invalidate the execution context.
  // An orbit-camera shot is the negative control for an FPS-only crash/navigation.
  console.log('STAGE: initial orbit shot');
  await page.evaluate(()=>{BattleDamageRange.fire();});
  await page.waitForTimeout(400);
  const orbitShot=await snap();
  if(orbitShot.wounds<2)fail.push('orbit shot did not produce UV entry and exit wounds');
  await page.evaluate(()=>BattleDamageRange.clear());

  // FPS aim should activate the first-person camera + reticle and still land a reticle-centered body hit.
  console.log('STAGE: FPS activation and fire');
  const fpsCheck=await page.evaluate(()=>{
    BattleDamageRange.setFps(true);
    const ret=document.getElementById('rangeReticle');
    return {state:BattleDamageRange.state(),reticle:ret&&getComputedStyle(ret).display};
  });
  if(fpsCheck.state.camera!=='damageRangeFpsCam'||!fpsCheck.state.fps)fail.push('FPS aim camera did not activate');
  if(fpsCheck.reticle==='none'||!fpsCheck.reticle)fail.push('FPS aim reticle is not visible');
  await page.evaluate(()=>{BattleDamageRange.fire();});
  await page.waitForTimeout(700);
  const fpsHit=await snap();
  if(fpsHit.wounds<2||fpsHit.uvWounds<2)fail.push('FPS reticle-centered shot did not create UV entry + exit wounds');
  await page.evaluate(()=>{BattleDamageRange.clear();BattleDamageRange.setFps(false);});
  await page.waitForTimeout(200);
  const orbitAgain=await snap();
  if(orbitAgain.camera!=='damageRangeCam'||orbitAgain.fps)fail.push('leaving FPS aim did not restore orbit camera');

  // Keyboard actions use the same dispatcher as the gamepad, but focused form inputs
  // must not trigger global range shortcuts. Restore original target/zone/exit afterward.
  await page.keyboard.press('4');
  if((await snap()).zone!=='arm')fail.push('keyboard 4 did not select arm');
  await page.keyboard.press('ArrowRight');
  if((await snap()).target!==1)fail.push('keyboard ArrowRight did not advance target');
  await page.keyboard.press('ArrowLeft');
  if((await snap()).target!==0)fail.push('keyboard ArrowLeft did not restore target');
  await page.keyboard.press('e');
  if((await snap()).exit)fail.push('keyboard E did not disable through-shot');
  await page.locator('#rangeTarget').focus();
  await page.keyboard.press('e');
  if((await snap()).exit)fail.push('keyboard shortcut ran with select focused');
  await page.evaluate(()=>document.activeElement&&document.activeElement.blur());
  await page.keyboard.press('e');
  if(!(await snap()).exit)fail.push('keyboard E did not restore through-shot');
  await page.keyboard.press('f');
  if(!(await snap()).fps)fail.push('keyboard F did not enable FPS');
  await page.keyboard.press('f');
  if((await snap()).fps)fail.push('keyboard F did not restore orbit mode');
  await page.keyboard.press('2');
  if((await snap()).zone!=='chest')fail.push('keyboard 2 did not restore chest');
  await page.keyboard.press('Space');
  await page.waitForTimeout(250);
  if((await snap()).wounds<2)fail.push('keyboard Space did not fire through-shot');
  await page.keyboard.press('c');
  if((await snap()).wounds!==0)fail.push('keyboard C did not clear wounds');

  // Keyboard testing manipulates cameras, target and presentation state. Reload
  // before the independent UV-wound accumulation experiment so it has the same
  // clean baseline as the original probe, rather than carrying test history.
  await page.reload({waitUntil:'load',timeout:300000});
  await page.waitForFunction(()=>window.__battle__&&window.BattleDamageRange&&BattleDamageRange.ready,null,{timeout:300000,polling:100});
  const afterKeyboard=await snap();
  if(afterKeyboard.target!==0||afterKeyboard.zone!=='chest'||!afterKeyboard.exit||afterKeyboard.wounds!==0)
    fail.push('keyboard test reload did not restore original clean range baseline');

  // One through-shot should paint entry + exit into one private map, no fallback.
  await page.evaluate(()=>{BattleDamageRange.fire();});
  await page.waitForTimeout(1100);
  const first=await snap();
  if(first.wounds<2)fail.push('first through-shot did not create entry + exit wound events');
  if(first.surfaceMaps!==1)fail.push('first target should own one private map, got '+first.surfaceMaps);
  if(first.body.some(x=>!x.uv))fail.push('first target used a non-UV fallback wound');
  if(first.body.some(x=>x.resolution!==512))fail.push('UV wound did not report 512 map');

  // Repeat on the same man: marks accumulate, renderer/map count must stay one.
  await page.evaluate(()=>{BattleDamageRange.fire();BattleDamageRange.fire();});
  await page.waitForTimeout(900);
  const accumulated=await snap();
  if(accumulated.surfaceMaps!==1)fail.push('repeated wounds allocated another map for the same soldier');
  if(accumulated.body.some(x=>!x.uv))fail.push('repeated wound fell back from UV paint');

  // A second soldier gets a second private map.
  await page.evaluate(()=>{BattleDamageRange.choose(1);BattleDamageRange.setZone('head');BattleDamageRange.fire();});
  await page.waitForTimeout(900);
  const second=await snap();
  if(second.surfaceMaps!==2)fail.push('second wounded soldier should raise map count to two, got '+second.surfaceMaps);
  if(second.body.some(x=>!x.uv))fail.push('second soldier used a non-UV wound');
  await page.screenshot({path:path.join(OUT,'wounded-lineup.png')});

  // Clear must wipe all persistent UV maps/wound bookkeeping without moving the lineup.
  await page.evaluate(()=>BattleDamageRange.clear());
  await page.waitForTimeout(250);
  const cleared=await snap();
  if(cleared.wounds!==0||cleared.surfaceMaps!==0)fail.push('clear did not wipe wound events/maps');

  // Explicit death is separate from Fire so we can inspect accumulation first.
  await page.evaluate(()=>{BattleDamageRange.choose(2);BattleDamageRange.fire();BattleDamageRange.kill();});
  await page.waitForTimeout(1200);
  const death=await snap();
  if(!death.targetDead)fail.push('Kill did not put selected target into death state');
  await page.screenshot({path:path.join(OUT,'death.png')});

  // Reset intentionally reloads the range page. Wait for the navigation and fresh startup;
  // evaluating old window globals during this reload would produce a false QA failure.
  const resetNavigation=page.waitForNavigation({waitUntil:'load',timeout:300000});
  await page.locator('#rangeReset').click();
  await resetNavigation;
  await page.waitForFunction(()=>window.__battle__&&window.BattleDamageRange&&BattleDamageRange.ready,null,{timeout:300000,polling:100});
  const reset=await snap();
  if(reset.targets.length!==10||reset.wounds!==0||reset.surfaceMaps!==0)fail.push('Reset reload did not restore clean range state');

  if(errors.length)fail.push('page errors: '+errors.slice(0,4).join(' | '));
  const summary={url:URL_,seed:SEED,initial,stable,first,accumulated,second,cleared,death,reset,navigationTrace,errors,logs:logs.slice(-120),ok:fail.length===0,fail};
  fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(summary,null,2));
  console.log('INITIAL '+JSON.stringify({targets:initial.targets,camera:initial.camera,enabled:initial.enabledSoldiers,baseY:initial.baseY}));
  console.log('FIRST '+JSON.stringify({wounds:first.wounds,uv:first.uvWounds,maps:first.surfaceMaps}));
  console.log('ACCUM '+JSON.stringify({wounds:accumulated.wounds,uv:accumulated.uvWounds,maps:accumulated.surfaceMaps}));
  console.log('SECOND '+JSON.stringify({wounds:second.wounds,uv:second.uvWounds,maps:second.surfaceMaps}));
  console.log('RESET '+JSON.stringify({wounds:reset.wounds,maps:reset.surfaceMaps,navigations:navigationTrace.length}));
  console.log(fail.length?'FAIL '+fail.join('; '):'OK damage range: stationary 10-man lineup, UV-only wound accumulation, per-soldier maps, clear + death');
  await browser.close();
  process.exit(fail.length?1:0);
})().catch(e=>{console.error('DAMAGE RANGE PROBE FAIL',e&&e.stack||e,'navigations',navigationTrace,'browserEvents',browserEvents,'url',diagnosticPage&&!diagnosticPage.isClosed()?diagnosticPage.url():'closed','pageErrors',diagnosticErrors.slice(-8),'consoleTail',diagnosticLogs.slice(-50));process.exit(1);});
