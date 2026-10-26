#!/usr/bin/env node
'use strict';
// Native-simulation microdrills. Observe, never fabricate perception, shots,
// movement requests, suppression receipts, station claims or bound arrivals.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE = process.env.SKILLS_LAB_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php';
const SIM_SECONDS = Number(process.env.SKILLS_DRILL_SECONDS || 75);
const SEED = process.env.SKILLS_DRILL_SEED || 'skills-drills-20261026-0001';
const CASES = [
  { distance: 35, arm: 'legacy', retreat: false },
  { distance: 35, arm: 'new', retreat: false },
  { distance: 70, arm: 'legacy', retreat: false },
  { distance: 70, arm: 'new', retreat: false },
  { distance: 120, arm: 'legacy', retreat: false },
  { distance: 120, arm: 'new', retreat: false },
  { distance: 70, arm: 'new', retreat: true }
];
if (!Number.isFinite(SIM_SECONDS) || SIM_SECONDS < 20 || SIM_SECONDS > 240)
  throw new Error('SKILLS_DRILL_SECONDS must be 20..240 seconds');
const dir = 'reports/skills-lab-drills';
fs.mkdirSync(dir, { recursive: true });

function classifyErrors(errors) {
  const privateAudio = /HTTP 404 loading ['"]?\/grasstex\/Assets\/audio\//i;
  return errors.filter(e => !privateAudio.test(e));
}
function summarizeSamples(samples) {
  const last = samples[samples.length - 1];
  const mover = new Map(), reasons = Object.create(null), st = new Map();
  let displacementM = 0, movingSamples = 0, engagingSamples = 0, boundSamples = 0;
  let controllerSamples = 0, contactSamples = 0, stationClaims = 0;
  let maxConflicts = 0, supporterShootingWhileBoundMoving = 0, maxCompleted = 0, maxAborted = 0;
  let maxStarts = 0, shots = 0, hits = 0, maxTargetDriftM = 0;
  samples.forEach(item => {
    const d = item.lab;
    shots = Math.max(shots, d.shots || 0);
    hits = Math.max(hits, d.hits || 0);
    maxConflicts = Math.max(maxConflicts, d.writerConflicts || 0);
    controllerSamples += d.squads.filter(s => s.id.startsWith('us:') && s.controller === 'new').length;
    contactSamples += d.squads.filter(s => s.id.startsWith('us:') && s.contact).length;
    movingSamples += d.units.filter(s => s.moving).length;
    boundSamples += d.units.filter(s => s.state === 'bound').length;
    engagingSamples += d.units.filter(s => s.target).length;
    stationClaims += item.stationClaims;
    supporterShootingWhileBoundMoving += item.coveredShots;
    item.maneuvers.forEach(z => {
      maxCompleted = Math.max(maxCompleted, z.completed || 0);
      maxAborted = Math.max(maxAborted, z.failed || 0);
      maxStarts = Math.max(maxStarts, (z.history || []).filter(e => e.phase === 'support').length);
      if (z.reason) reasons[z.reason] = (reasons[z.reason] || 0) + 1;
    });
    d.units.forEach(s => {
      if (!Number.isFinite(s.x) || !Number.isFinite(s.z)) return;
      const k = String(s.id), prior = mover.get(k);
      if (prior) displacementM += Math.hypot(s.x-prior.x,s.z-prior.z);
      mover.set(k,{x:s.x,z:s.z});
    });
    item.targets.forEach(s => {
      const k = String(s.id), prior = st.get(k);
      if (prior) maxTargetDriftM = Math.max(maxTargetDriftM,Math.hypot(s.x-prior.x,s.z-prior.z));
      st.set(k,{x:s.x,z:s.z});
    });
  });
  return {
    arm: last.lab.controller, distanceM: last.lab.rangeDistanceM,
    seed: last.lab.seed, simulatedSeconds: last.lab.time,
    usShots: shots, hits, targetDeaths: last.lab.targetDeaths,
    movementMetersCumulative: +displacementM.toFixed(1),
    moveSamples: movingSamples, targetAcquisitionsSampled: engagingSamples,
    personalBoundSamples: boundSamples,
    controllerOwnedSquadSamples: controllerSamples, squadContactSamples: contactSamples,
    stationClaimSamples: stationClaims, supportingShotsDuringBoundMotion: supporterShootingWhileBoundMoving,
    startedCoveredWindows: maxStarts, completedCoveredWindows: maxCompleted, abortedCoveredWindows: maxAborted,
    maxOrderConflictsSnapshot: maxConflicts,
    controllerFaults: last.lab.controllerState && last.lab.controllerState.stats
      ? last.lab.controllerState.stats.faults : null,
    controllerFaultExamples: last.lab.controllerState && last.lab.controllerState.stats
      ? last.lab.controllerState.stats.faultExamples || [] : [],
    maxTargetDriftM: +maxTargetDriftM.toFixed(3),
    mainRefusalReasons: Object.entries(reasons).sort((a,b)=>b[1]-a[1]).slice(0,8),
    events: last.lab.events.slice(-30)
  };
}

(async () => {
  const browser = await chromium.launch({
    headless: true, args: ['--disable-dev-shm-usage','--use-gl=swiftshader','--enable-webgl',
      '--ignore-gpu-blocklist']
  });
  const results = [];
  try {
    for (const c of CASES) {
      const page = await browser.newPage({viewport:{width:1280,height:900},ignoreHTTPSErrors:true});
      page.setDefaultTimeout(120000);
      const errors = [];
      page.on('pageerror',e=>errors.push(String(e)));
      const params = new URLSearchParams({
        skillsLab:'1', seed:SEED, pinSeed:'1', labDistance:String(c.distance),
        labRange:'1', tacticalController:c.arm, strategicInterception:'0'
      });
      await page.goto(BASE+'?'+params,{waitUntil:'domcontentloaded',timeout:120000});
      await page.waitForFunction(() => window.BattleSkillsLab?.snapshot()?.targetCount === 10,
        null,{timeout:120000});
      const first = await page.evaluate(() => BattleSkillsLab.snapshot());
      assert.equal(first.controller,c.arm,'matched requested controller flag');
      assert.equal(first.rangeDistanceM,c.distance,'matched native starting distance');
      assert.equal(first.targetDeaths,0,'targets begin inert');
      const captured = await page.evaluate(({seconds,retreat}) => {
        const sim = window.__battle__, lab = window.BattleSkillsLab, samples = [];
        let coveredShots = 0;
        const priorFire = sim.onFire;
        sim.onFire = function (s) {
          if (s && s.faction === 'us' && s.squad && s.squad.members.some(man =>
            man !== s && man.moving && man.eng && man.eng.state === 'bound'))
            coveredShots++;
          if (priorFire) return priorFire.apply(this, arguments);
        };
        if (retreat) lab.stageRetreat();
        function sample() {
          const d = lab.snapshot(), positions=window.BattleTacticalPositions;
          const station = window.BattleTacticalStationSkill;
          const maneuver = window.BattleTacticalCoveredManeuver;
          return {
            lab: d, coveredShots,
            stationClaims: sim._roster.us.filter(s=>positions?.current?.(s)).length,
            stationSummary: sim.factions.us.squads.map(s=>({
              id: s.id, value: station?.summary?.(s)||null
            })),
            maneuvers: sim.factions.us.squads.map(s=>maneuver?.summary?.(s)).filter(Boolean),
            targets: sim._roster.ge.map(s=>({
              id:s.id,x:+s.root.position.x.toFixed(3),z:+s.root.position.z.toFixed(3)
            }))
          };
        }
        samples.push(sample());
        const tickInterval=30; // 4.5 simulated seconds, real fixed 0.15s ticks.
        for(let n=0;n<Math.ceil(seconds/(tickInterval*0.15)) && !sim.winner;n++){
          lab.advance(tickInterval);
          samples.push(sample());
        }
        return samples;
      },{seconds:SIM_SECONDS,retreat:c.retreat});
      const summary=summarizeSamples(captured);
      summary.premise=c.retreat?'native-casualty-stage':'none';
      summary.browserErrors=errors.length;
      summary.unexpectedBrowserErrors=classifyErrors(errors);
      assert.equal(summary.targetDeaths,0,'inert native target mortality');
      if (c.arm === 'new') {
        assert.equal(summary.controllerFaults, 0,
          'replacement controller must have zero swallowed runtime exceptions: ' +
          JSON.stringify(summary.controllerFaultExamples));
      }
      assert.equal(summary.maxTargetDriftM,0,'range targets are physically stationary');
      assert.ok(summary.simulatedSeconds>=SIM_SECONDS-0.2,'full timed native drill completed');
      if(c.arm==='new')assert.ok(summary.controllerOwnedSquadSamples>0,
        'new controller must actually take ownership');
      else assert.equal(summary.controllerOwnedSquadSamples,0,
        'legacy comparison must not enable replacement controller');
      assert.deepEqual(summary.unexpectedBrowserErrors,[],
        'unexpected native browser failure');
      results.push(summary);
      console.log('SKILLS_LAB_DRILL',JSON.stringify(summary));
      fs.writeFileSync(dir+'/'+c.distance+'m-'+c.arm+(c.retreat?'-casualty':'')+'.json',
        JSON.stringify({summary,samples:captured},null,2));
      await page.close();
    }
    const pass = {
      seed:SEED, actualRuntime:'native-BattleSim-no-injected-fire-or-move',seconds:SIM_SECONDS,
      cases:results.length, results,
      findings:{
        fireCases:results.filter(r=>r.premise==='none' && r.usShots>0).length,
        missingFire:results.filter(r=>r.premise==='none' && !r.usShots).map(r=>r.distanceM+'m-'+r.arm),
        anyControllerBounds:results.some(r=>r.arm==='new' && r.startedCoveredWindows>0),
        anyRealSupportDuringMove:results.some(r=>r.arm==='new' && r.supportingShotsDuringBoundMotion>0),
        anyControllerCompletion:results.some(r=>r.arm==='new' && r.completedCoveredWindows>0),
        anyWriterConflicts:results.some(r=>r.arm==='new' && r.maxOrderConflictsSnapshot>0)
      }
    };
    fs.writeFileSync(dir+'/summary.json',JSON.stringify(pass,null,2));
    console.log('SKILLS_LAB_DRILL_SUMMARY',JSON.stringify(pass.findings));
    // These are diagnostic measurements, not acceptance claims. Skill-specific
    // completion and supporting fire are scored separately from runtime health.
    if(process.env.SKILLS_DRILL_REQUIRE_TACTICS==='1'){
      assert.equal(pass.findings.missingFire.length,0,'fire skill must shoot standing targets');
      assert.equal(pass.findings.anyWriterConflicts,false,'locomotion owner conflicts forbidden');
      assert.equal(pass.findings.anyRealSupportDuringMove,true,'real covering fire during physical bound');
      assert.equal(pass.findings.anyControllerCompletion,true,'native controlled bound must complete');
    }
  } finally {
    await browser.close();
  }
})().catch(e=>{ console.error(e);process.exitCode=1; });
