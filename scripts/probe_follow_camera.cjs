/* Persistent normal-play follow/orbit camera probe.
 * Verifies the URL-driven visual-QA camera in battle/camera-controls.js, separate from the device
 * benchmark's temporary benchCam=follow camera.
 *
 *   node scripts/probe_follow_camera.cjs
 * Env:
 *   PFC_URL    battle page / branch preview
 *   PFC_SEED   scenario seed (default follow-camera-probe)
 *   PFC_DIST   requested follow distance metres (default 10)
 *   PFC_SPEED  orbit speed rad/s for the orbit arm (default 0.65)
 *   PFC_OUT    screenshot/output directory (default closeups/follow-camera)
 */
const path=require('node:path'),fs=require('node:fs');

function loadPlaywright(){
  try{return require('playwright');}catch(_){
    const {execSync}=require('node:child_process');
    return require(path.join(execSync('npm root -g').toString().trim(),'playwright'));
  }
}

const URL_=process.env.PFC_URL||'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SEED=process.env.PFC_SEED||'follow-camera-probe';
const DIST=Number(process.env.PFC_DIST||10);
const SPEED=Number(process.env.PFC_SPEED||.65);
const OUT=path.resolve(process.env.PFC_OUT||'closeups/follow-camera');

function angleDelta(a,b){let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;}

(async()=>{
  const {chromium}=loadPlaywright();
  fs.mkdirSync(OUT,{recursive:true});
  const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--ignore-certificate-errors','--no-sandbox']});
  const errors=[],bad=[];
  // page.evaluate serializes this function body independently, so keep it as source text there.
  const snapSource=`()=>{const b=window.__battle__,ctl=window.BattleDesktopCamera.current,cam=b.scene.activeCamera,
    info=ctl&&ctl.follow,all=[...b._roster.us,...b._roster.ge],man=all.find(s=>s.id===info.current),p=man&&man.root.position,
    t=cam.target||cam.getTarget(),eye=cam.globalPosition||cam.position,h=info.height||1.05;
    return{camera:cam.name,mode:ctl.mode,current:info.current,orbit:info.orbit,orbitSpeed:info.orbitSpeed,
      radius:+cam.radius.toFixed(3),alpha:+cam.alpha.toFixed(6),targetError:p?+Math.hypot(t.x-p.x,t.y-(p.y+h),t.z-p.z).toFixed(3):null,
      alive:man?!man.dead:false,eyeDist:+Math.hypot(eye.x-t.x,eye.y-t.y,eye.z-t.z).toFixed(3)};}`;

  async function arm(params,label,waitMs){
    const page=await browser.newPage({ignoreHTTPSErrors:true,viewport:{width:960,height:640}});
    page.on('pageerror',e=>errors.push(label+': '+String(e)));
    await page.route('**/*',route=>{
      const req=route.request();
      if(req.method()==='POST'||/battle_(policy|learning|log|metrics)[^/]*\.php/.test(req.url()))return route.fulfill({json:{}});
      return route.continue();
    });
    const q=new URLSearchParams(Object.assign({seed:SEED,followDist:String(DIST)},params));
    await page.goto(URL_+(URL_.includes('?')?'&':'?')+q.toString(),{waitUntil:'load',timeout:300000});
    try{
      await page.waitForFunction(()=>window.__battle__&&window.BattleDesktopCamera&&BattleDesktopCamera.current&&
        BattleDesktopCamera.current.mode==='follow'&&BattleDesktopCamera.current.follow.current!=null,null,{timeout:45000,polling:100});
    }catch(e){
      const state=await page.evaluate(()=>({
        href:location.href,ready:document.readyState,
        hasBattle:!!window.__battle__,
        battleTime:window.__battle__&&window.__battle__.time,
        activeCamera:window.__battle__&&window.__battle__.scene&&window.__battle__.scene.activeCamera&&window.__battle__.scene.activeCamera.name,
        camera:window.BattleDesktopCamera&&window.BattleDesktopCamera.current?{
          mode:BattleDesktopCamera.current.mode,
          name:BattleDesktopCamera.current.camera&&BattleDesktopCamera.current.camera.name,
          follow:BattleDesktopCamera.current.follow||null
        }:null,
        hint:(document.getElementById('cameraHint')||{}).textContent||'',
        debug:(document.getElementById('debugConsole')||{}).textContent?.slice(-5000)||''
      })).catch(()=>({evaluateFailed:true}));
      console.error(label+' wait state '+JSON.stringify(state));
      if(errors.length)console.error(label+' page errors '+errors.join(' | '));
      throw e;
    }
    await page.evaluate(()=>{const b=document.getElementById('startBtn');if(b&&!b.hidden)b.click();});
    await page.waitForTimeout(900);
    const before=await page.evaluate(eval(snapSource));
    await page.waitForTimeout(waitMs);
    const after=await page.evaluate(eval(snapSource));
    await page.screenshot({path:path.join(OUT,label+'.png')});
    await page.close();
    return{before,after};
  }

  // orbit=1 intentionally omits follow=1: orbit must imply persistent follow mode.
  const orbit=await arm({orbit:'1',orbitSpeed:String(SPEED)},'orbit',1800);
  const fixed=await arm({follow:'1'},'follow',1300);
  await browser.close();

  const orbitDelta=Math.abs(angleDelta(orbit.before.alpha,orbit.after.alpha));
  const fixedDelta=Math.abs(angleDelta(fixed.before.alpha,fixed.after.alpha));
  const expected=Math.abs(SPEED)*1.8;

  for(const [name,s] of [['orbit-before',orbit.before],['orbit-after',orbit.after],['follow-before',fixed.before],['follow-after',fixed.after]]){
    console.log(name+' '+JSON.stringify(s));
    if(s.camera!=='followCam'||s.mode!=='follow')bad.push(name+' did not use followCam');
    if(Math.abs(s.radius-DIST)>.25||Math.abs(s.eyeDist-DIST)>.25)bad.push(name+' did not hold '+DIST+' m');
    if(s.current==null||!s.alive)bad.push(name+' did not track a living soldier');
    if(s.targetError==null||s.targetError>2)bad.push(name+' target lagged soldier by '+s.targetError+' m');
  }
  if(!orbit.before.orbit||!orbit.after.orbit)bad.push('orbit=1 did not enable orbit/follow mode');
  if(Math.abs(orbitDelta-expected)>.35)bad.push('orbit angle delta '+orbitDelta.toFixed(2)+' differs from expected ~'+expected.toFixed(2));
  if(fixed.before.orbit||fixed.after.orbit)bad.push('follow=1 unexpectedly enabled auto orbit');
  if(fixedDelta>.03)bad.push('fixed follow bearing drifted '+fixedDelta.toFixed(3)+' rad without input');
  if(errors.length)bad.push('page errors: '+errors.slice(0,4).join(' | '));

  const result={distance:DIST,orbitSpeed:SPEED,orbitDelta:+orbitDelta.toFixed(3),fixedDelta:+fixedDelta.toFixed(3),orbit,fixed,errors};
  fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(result,null,2));
  console.log(bad.length?'FAIL '+bad.join('; '):'OK persistent follow/orbit camera: '+DIST+' m, orbit delta '+orbitDelta.toFixed(2)+' rad, fixed delta '+fixedDelta.toFixed(3)+' rad');
  process.exit(bad.length?1:0);
})().catch(e=>{console.error('FOLLOW CAMERA PROBE FAIL',e&&e.stack||e);process.exit(1);});
