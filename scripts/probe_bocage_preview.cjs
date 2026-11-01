/* Live bocage scale/occlusion probe.
 * Boots a real battle page, finds the tallest generated hedge runtime prism, verifies a standing
 * 1.55 m eye/muzzle line is blocked while a line above the top clears, points the camera at that
 * hedge and saves a screenshot plus JSON. Use a branch preview for real hosted terrain/assets.
 *
 *   BOCAGE_URL='https://test.ivandpopov.com/grasstex/preview.php?ref=<branch>' \
 *     BOCAGE_OUT=out/bocage node scripts/probe_bocage_preview.cjs
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{execSync}=require('node:child_process');
function playwright(){try{return require('playwright');}catch(_){return require(path.join(execSync('npm root -g').toString().trim(),'playwright'));}}
const URL_=process.env.BOCAGE_URL||'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SEED=process.env.BOCAGE_SEED||'bocage-preview';
const OUT=path.resolve(process.env.BOCAGE_OUT||'bocage-preview');
(async()=>{
  fs.mkdirSync(OUT,{recursive:true});
  const {chromium}=playwright(),browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--ignore-certificate-errors','--no-sandbox']});
  try{
    const page=await browser.newPage({ignoreHTTPSErrors:true,viewport:{width:1280,height:720}});
    const errors=[];page.on('pageerror',e=>errors.push(String(e&&e.stack||e).slice(0,500)));
    const url=URL_+(URL_.includes('?')?'&':'?')+'seed='+encodeURIComponent(SEED);
    await page.goto(url,{waitUntil:'load',timeout:180000});
    await page.waitForFunction(()=>window.__battle__&&window.BattleObstacleField&&window.BattleTerrainFeatures,null,{timeout:180000});
    const report=await page.evaluate(()=>{
      const b=window.__battle__,F=window.BattleObstacleField,T=window.BattleTerrainFeatures;
      const hedges=(b.obstacles||[]).filter(o=>o&&o.type==='hedge'&&o.shape==='obb'&&Number.isFinite(+o.visibleHeight));
      if(!hedges.length)throw new Error('no generated hedge runtime prisms');
      const heights=hedges.map(h=>+h.visibleHeight),tall=hedges.reduce((a,h)=>!a||+h.visibleHeight>+a.visibleHeight?h:a,null);
      const side=(+tall.hz||1.1)+2,base=+tall.y||0,eye=1.55,top=base+(+tall.height||+tall.visibleHeight);
      const a={x:+tall.x+(+tall.vx||0)*side,y:base+eye,z:+tall.z+(+tall.vz||1)*side};
      const c={x:+tall.x-(+tall.vx||0)*side,y:base+eye,z:+tall.z-(+tall.vz||1)*side};
      const highA={x:a.x,y:top+.35,z:a.z},highC={x:c.x,y:top+.35,z:c.z};
      const blocker=F.sightBlocker(b.obstacles,a,c),blocked=!!blocker,clearAbove=!F.sightBlocked(b.obstacles,highA,highC);
      const cam=b.scene.activeCamera;
      if(cam&&window.BABYLON){
        const V=window.BABYLON.Vector3,dist=10;
        const px=+tall.x+(+tall.vx||0)*dist,pz=+tall.z+(+tall.vz||1)*dist;
        if(cam.position&&cam.position.copyFrom)cam.position.copyFrom(new V(px,base+2.0,pz));
        if(cam.setTarget)cam.setTarget(new V(+tall.x,base+Math.min(2.2,+tall.visibleHeight*.55),+tall.z));
        if('fov' in cam)cam.fov=.75;
      }
      document.querySelectorAll('#hud,.hud,.controls,.debug-panel').forEach(e=>e.style.display='none');
      return{
        build:window.BATTLE_BUILD_DEPLOYED||null,
        count:hedges.length,minVisible:Math.min(...heights),maxVisible:Math.max(...heights),
        configuredMin:+T.hedgeHeightMin,configuredMax:+T.hedgeHeightMax,
        standingEyeM:eye,standingBlocked:blocked,blockerId:blocker&&blocker.id||null,
        lineAboveTopClear:clearAbove,
        tall:{id:tall.id,x:+tall.x,z:+tall.z,width:(+tall.hz||0)*2,visibleHeight:+tall.visibleHeight,combatHeight:+tall.height,terrainEnvelope:tall.terrainEnvelope||null}
      };
    });
    for(let i=0;i<4;i++){await page.evaluate(()=>window.__battle__.scene.render());await page.waitForTimeout(60);}
    await page.screenshot({path:path.join(OUT,'tall-bocage.png')});
    report.pageErrors=errors;fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
    if(errors.length)throw new Error(errors.join(' | '));
    if(!(report.minVisible>=2.8-1e-6&&report.maxVisible<=4.57+1e-6&&report.maxVisible>4.4))throw new Error('bocage height range failed');
    if(!report.standingBlocked)throw new Error('standing 1.55 m line was not blocked');
    if(!report.lineAboveTopClear)throw new Error('line above hedge top was unexpectedly blocked');
  }finally{await browser.close();}
})().catch(e=>{console.error('BOCAGE PREVIEW FAIL',e);process.exit(1);});
