const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const rate=(n,d)=>d>0?(+n||0)/d:0;
const round=(v,n=1)=>Number.isFinite(v)?+v.toFixed(n):null;
const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;
const quantile=(xs,q)=>{
  if(!xs.length)return 0;
  const a=[...xs].sort((x,y)=>x-y),p=(a.length-1)*q,lo=Math.floor(p),hi=Math.ceil(p);
  return lo===hi?a[lo]:a[lo]+(a[hi]-a[lo])*(p-lo);
};
const dominant=(m={})=>Object.entries(m).sort((a,b)=>b[1]-a[1]||String(a[0]).localeCompare(String(b[0])))[0]?.[0]||'maneuver';
const weightedMean=(pairs)=>{
  let n=0,d=0;
  for(const [v,w] of pairs)if(Number.isFinite(v)&&w>0){n+=v*w;d+=w;}
  return d?n/d:null;
};

export function scoreSquadPerformance(raw={}){
  const samples=Math.max(1,+raw.samples||0);
  const role=dominant(raw.roleSamples);
  const assignedRate=rate(raw.assignedSamples,samples);
  const targetlessRate=rate(raw.targetlessSamples,samples);
  const overCohesionRate=rate(raw.overCohesionSamples,samples);
  const regroupRate=rate(raw.regroupSamples,samples);
  const retreatRate=rate(raw.retreatSamples,samples);
  const supportHoldRate=rate(raw.supportHoldSamples,samples);
  const objectivePresenceRate=rate((+raw.insideObjectiveSamples||0)+(+raw.friendlyOwnedTargetSamples||0),samples);
  const progress=+raw.objectiveProgressMeters||0,regression=+raw.objectiveRegressionMeters||0,travel=+raw.travelMeters||0;
  const movementWork=progress+regression;
  const regressionShare=movementWork>1?regression/movementWork:0;
  const netObjectiveProgress=progress-regression;
  const loops=+raw.loopAlerts||0,conflicts=+raw.writerConflicts||0,targetSwitches=+raw.targetSwitches||0;
  const routeStalls=+raw.routeStalls||0,movementStalls=+raw.movementStalls||0,longRegroups=+raw.longRegroups||0;
  const maneuver=!['reserve','garrison','support'].includes(role);

  let mission;
  if(role==='reserve'||role==='garrison'){
    mission=clamp(100-targetlessRate*50-Math.min(24,targetSwitches*6)-Math.min(18,loops*6));
  }else if(role==='support'){
    mission=clamp(70+supportHoldRate*25+Math.min(5,objectivePresenceRate*10)-targetlessRate*45-Math.min(20,targetSwitches*5));
  }else{
    const progressQuality=movementWork>1?clamp((netObjectiveProgress/movementWork+1)*50):50;
    mission=clamp(35+assignedRate*30+objectivePresenceRate*15+progressQuality*.20-targetlessRate*45-Math.min(18,targetSwitches*3));
  }

  let movement=100;
  if(maneuver&&travel>3){
    movement-=regressionShare*50;
    if(netObjectiveProgress< -3)movement-=Math.min(20,Math.abs(netObjectiveProgress)/Math.max(1,travel)*30);
  }
  movement-=Math.min(30,routeStalls*12);
  movement-=Math.min(30,movementStalls*8);
  movement=clamp(movement);

  const control=clamp(100-targetlessRate*40-Math.min(36,loops*9)-Math.min(36,conflicts*12)-Math.min(24,targetSwitches*3));
  const cohesion=clamp(100-overCohesionRate*65-Math.min(25,longRegroups*10)-Math.min(15,regroupRate*15));

  const combatRaw=raw.combat||{},direct=+combatRaw.direct||0,hits=+combatRaw.hits||0,suppressive=+combatRaw.suppressive||0,suppressedTargets=+combatRaw.suppressedTargets||0;
  const contactSamples=+raw.inContactSamples||0;
  let combat=null;
  if(contactSamples>0||direct>0||suppressive>0){
    if(direct>0){
      combat=65+rate(hits,direct)*25;
      if(suppressive>0)combat+=Math.min(10,rate(suppressedTargets,suppressive)*2);
    }else if(suppressive>0)combat=78+Math.min(12,rate(suppressedTargets,suppressive)*2);
    else combat=55;
    combat=clamp(combat);
  }

  const aliveStart=+raw.aliveStart||0,aliveEnd=Math.max(0,+raw.aliveEnd||0);
  const preservation=aliveStart>0?clamp(rate(aliveEnd,aliveStart)*100):null;
  const overall=weightedMean([
    [mission,.30],[movement,.20],[control,.20],[cohesion,.15],[combat,.10],[preservation,.05]
  ]);

  return {
    faction:raw.faction||null,
    squad:raw.squad!=null?String(raw.squad):null,
    role,
    overall:round(overall),
    mission:round(mission),
    movement:round(movement),
    control:round(control),
    cohesion:round(cohesion),
    combat:round(combat),
    preservation:round(preservation),
    metrics:{
      samples:+raw.samples||0,
      assignedRate:round(assignedRate,3),
      targetlessRate:round(targetlessRate,3),
      overCohesionRate:round(overCohesionRate,3),
      regroupRate:round(regroupRate,3),
      retreatRate:round(retreatRate,3),
      supportHoldRate:round(supportHoldRate,3),
      inContactSamples:contactSamples,
      travelMeters:round(travel,2),
      objectiveProgressMeters:round(progress,2),
      objectiveRegressionMeters:round(regression,2),
      netObjectiveProgressMeters:round(netObjectiveProgress,2),
      targetSwitches,
      phaseSwitches:+raw.phaseSwitches||0,
      movementResolverChanges:+raw.movementResolverChanges||0,
      routeStalls,
      movementStalls,
      targetlessStalls:+raw.targetlessStalls||0,
      longRegroups,
      loopAlerts:loops,
      writerConflicts:conflicts,
      aliveStart,
      aliveEnd,
      shots:+combatRaw.total||0,
      directShots:direct,
      hits,
      suppressiveShots:suppressive,
      suppressedTargets,
      roleSamples:raw.roleSamples||{},
      phaseSamples:raw.phaseSamples||{}
    }
  };
}

export function summarizeSquadPerformance(rows=[]){
  const valid=rows.filter(r=>Number.isFinite(+r?.overall));
  const values=valid.map(r=>+r.overall);
  const dim=name=>valid.map(r=>r[name]).filter(Number.isFinite).map(Number);
  const byRole={};
  for(const row of valid)(byRole[row.role]||(byRole[row.role]=[])).push(+row.overall);
  const roleSummary={};
  for(const [role,xs] of Object.entries(byRole))roleSummary[role]={squads:xs.length,mean:+mean(xs).toFixed(1),median:+quantile(xs,.5).toFixed(1),p10:+quantile(xs,.1).toFixed(1)};
  const worst=[...valid].sort((a,b)=>a.overall-b.overall||String(a.faction).localeCompare(String(b.faction))||String(a.squad).localeCompare(String(b.squad))).slice(0,8)
    .map(r=>({seed:r.seed||null,faction:r.faction,squad:r.squad,role:r.role,overall:r.overall,mission:r.mission,movement:r.movement,control:r.control,cohesion:r.cohesion,combat:r.combat,preservation:r.preservation}));
  const avg=name=>{const xs=dim(name);return xs.length?+mean(xs).toFixed(1):null;};
  return {
    squads:valid.length,
    meanOverall:values.length?+mean(values).toFixed(1):null,
    medianOverall:values.length?+quantile(values,.5).toFixed(1):null,
    p10Overall:values.length?+quantile(values,.1).toFixed(1):null,
    lowScoreSquads:valid.filter(r=>r.overall<60).length,
    meanMission:avg('mission'),
    meanMovement:avg('movement'),
    meanControl:avg('control'),
    meanCohesion:avg('cohesion'),
    meanCombat:avg('combat'),
    meanPreservation:avg('preservation'),
    byRole:roleSummary,
    worst
  };
}
