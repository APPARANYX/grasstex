/* Isolated runtime campaign: existing shipping hotpath profiler plus CDP samples.
   Mirrors profile_battle_hotpaths.mjs fixed-step benchmark, never loaded by production. */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const out='docs/audits/2026-10-20-grasstex/runtime-verification/artifacts/profiles';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--ignore-certificate-errors']});
 const loadOnly=process.argv.includes('--load-only');
 const results=loadOnly?JSON.parse(fs.readFileSync(path.join(out,'runs.json'))):[], lifecycle=loadOnly?JSON.parse(fs.readFileSync(path.join(out,'lifecycle.json'))):[];
 const configurations=[{name:'meeting',q:'',seconds:120},{name:'strategic',q:'strategicInterception=1&motorTransport=1&aerialRecon=1&interception=1&truckCollision=1',seconds:180},{name:'stress',q:'soldiers=200',seconds:120},{name:'load200',q:'',seconds:120,extraSquads:5}];
 try{for(const cfg of (loadOnly?configurations.filter(c=>c.name==='load200'):configurations)){
  const page=await browser.newPage({ignoreHTTPSErrors:true,viewport:{width:960,height:540}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e.stack||e)));
  // Reject persistent-state writes; baseline telemetry is disabled below as in standard benchmark.
  await page.route('**/*',r=>r.request().method()==='POST'?r.abort():r.continue());
  await page.goto('http://127.0.0.1:8876/grasstex/battle_sim_local.php?'+cfg.q+'&seed=runtime-profile&pinSeed=1',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__battle__&&window.BattleCommanderAI,null,{timeout:120000});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
  await page.evaluate(n=>{for(let i=0;i<n;i++)for(const f of ['us','ge'])window.__battle__.spawnUnit(f,'infantry-squad');},cfg.extraSquads||0);
  await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
  await page.evaluate(()=>window.__battle__.resume());await page.waitForTimeout(5000);
  const renderProfile=(await cdp.send('Profiler.stop')).profile;
  fs.writeFileSync(path.join(out,cfg.name+'-render.cpuprofile'),JSON.stringify(renderProfile));
  const render=await page.evaluate(()=>({time:window.__battle__.time,observers:window.__battle__.scene.onBeforeRenderObservable.observers.length,heap:performance.memory?.usedJSHeapSize}));
  await page.evaluate(()=>{const r=window,s=r.__battle__;s.scene.getEngine().stopRenderLoop(r.__battleRenderLoop__);s.pause();const t=r.BattleTelemetry;if(t){t.record=t.start=t.ensure=()=>{};t.end=t.flush=t.checkpoint=async()=>true;}r.BattleSoldierModel?.setImportedEnabled?.(s.scene,false);s.trainingMode=true;});
  for(const mode of ['plain','wrapped','plain','wrapped','plain','wrapped','cdp']){
   if(mode==='wrapped') await page.addScriptTag({path:path.resolve('scripts/battle-hotpath-profiler.cjs')});
   if(mode==='cdp')await cdp.send('Profiler.start');
   const before=(await cdp.send('Performance.getMetrics')).metrics;
   const r=await page.evaluate(({seconds,mode,extraSquads})=>{
    const w=window,s=w.__battle__,p=w.BattleHotpathProfiler;
    (s._controlRawRestart||s.restart.bind(s))();
    Object.assign(s,{manualEnded:false,winner:null,winReason:null,paused:false,timeScale:1,timeLimit:seconds});
    for(let i=0;i<(extraSquads||0);i++)for(const f of ['us','ge'])s.spawnUnit(f,'infantry-squad');
    if(mode==='wrapped')p.reset();
    const ticks=[],mem=[],snapshots=[];let acc=0,n=0,next=30;
    const start=performance.now(),command=+w.BattleCommanderAI.commandTick||.45;
    while(!s.winner&&s.time<seconds+.5&&n<Math.ceil((seconds+2)/.15)){
     const st=performance.now();s._trainerStepActive=true;try{(s.step||s._frame).call(s,.15);}finally{s._trainerStepActive=false;}
     acc+=.15;while(acc+1e-9>=command&&!s.winner){acc-=command;w.BattleCommanderAI.update(s,w.__scenario__||s.scene.metadata.battleScenario,command);}
     ticks.push(performance.now()-st);n++;
     if(s.time>=next){mem.push({time:s.time,heap:performance.memory?.usedJSHeapSize});snapshots.push({time:s.time,transport:w.BattleSquadTransport?.summary(s),recon:['us','ge'].map(f=>w.BattleAerialRecon?.status(s,f)),interception:w.BattleStrategicInterception?.summary(s)});next+=30;}
    }
    const wallMs=performance.now()-start,profile=mode==='wrapped'?p.snapshot(150):null;
    const state={time:s.time,winner:s.winner,alive:[s.factions.us.alive,s.factions.ge.alive],soldiers:s.soldiers?.length,roster:[s._roster.us.length,s._roster.ge.length],profile:s.scene.metadata.battleScenario.profile,fleet:w.BattleSquadTransport?.fleetSummary(s),recon:['us','ge'].map(f=>w.BattleAerialRecon?.status(s,f)),interception:w.BattleStrategicInterception?.enabled(s),colliders:s.obstacles.__dynamicFootprints?.length||0,positions:['us','ge'].flatMap(f=>s._roster[f].map(a=>({id:a.id,faction:f,dead:a.dead,position:{x:a.root.position.x,z:a.root.position.z},destination:a.destination}))),interceptionSummary:w.BattleStrategicInterception?.summary(s)};
    const terminalBefore=s.time;s._trainerStepActive=true;try{(s.step||s._frame).call(s,.15);}finally{s._trainerStepActive=false;}
    const terminalAfter=s.time;
    if(mode==='wrapped'){p.restore();delete w.BattleHotpathProfiler;}
    return {mode,wallMs,n,ticks,mem,snapshots,state,terminalBefore,terminalAfter,profile,observers:s.scene.onBeforeRenderObservable.observers.length};
   },{seconds:cfg.seconds,mode,extraSquads:cfg.extraSquads||0});
   const after=(await cdp.send('Performance.getMetrics')).metrics;
   if(mode==='cdp'){const prof=(await cdp.send('Profiler.stop')).profile;fs.writeFileSync(path.join(out,cfg.name+'-simulation.cpuprofile'),JSON.stringify(prof));}
   results.push({configuration:cfg,render,...r,metricsBefore:before,metricsAfter:after,errors:[...errors]});
   fs.writeFileSync(path.join(out,'runs.json'),JSON.stringify(results,null,2));console.log(cfg.name,mode,r.wallMs,r.state.time);
  }
  const life=await page.evaluate(()=>{const s=window.__battle__,old=s._roster.us[0];s.restart();s.paused=false;s.step(.15);s.endBattle('runtime-audit');const before=s.time,resumed=s.resume();s.step(.15);const after=s.time;const oldCurrent=s._roster.us[0];s.restart();return{before,after,resumed,manualEndedAfterReset:s.manualEnded,winnerAfterReset:s.winner,firstActorReplaced:s._roster.us[0]!==oldCurrent,earlierActorRetained:s._roster.us.includes(old),roster:s._roster.us.length+s._roster.ge.length,observers:s.scene.onBeforeRenderObservable.observers.length};});
  lifecycle.push({configuration:cfg.name,...life});fs.writeFileSync(path.join(out,'lifecycle.json'),JSON.stringify(lifecycle,null,2));
  console.log('BROWSER',await browser.version());await page.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
