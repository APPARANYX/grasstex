#!/usr/bin/env python3
"""Summarize preserved measurements without interpreting tactical scores as failures."""
import json,statistics,collections,gzip
from pathlib import Path
root=Path('docs/audits/2026-10-20-grasstex/runtime-verification'); out=root/'artifacts'
def read(p,default=None):
 p=Path(p)
 if not p.exists() and Path(str(p)+'.gz').exists():p=Path(str(p)+'.gz')
 return json.loads(gzip.open(p,'rt').read() if p.suffix=='.gz' else p.read_text()) if p.exists() else default
def quantile(a,q):
 a=sorted(a);pos=(len(a)-1)*q;lo=int(pos);hi=min(lo+1,len(a)-1);return a[lo]+(a[hi]-a[lo])*(pos-lo)
def stats(a):return dict(n=len(a),mean=statistics.mean(a),p50=quantile(a,.5),p95=quantile(a,.95),p99=quantile(a,.99),max=max(a)) if a else None
campaigns=[]
for file in sorted(out.glob('*/battle-benchmark.json*')):
 d=read(file); b=d['battles'];s=d['summary'];campaigns.append(dict(name=file.parent.name,battles=len(b),seeds=[x['seed'] for x in b],simulatedSeconds=sum(x['simulatedSeconds'] for x in b),runtimeErrors=s['runtimeErrors'],assetLoadNoise=s['assetLoadNoise'],outcomes=dict(collections.Counter(x['winner'] for x in b)),captures=[x['captures']for x in b],movementAlerts=sum(len(x['movementStalls'])for x in b),routeAlerts=sum(len(x['routeStalls'])for x in b),loopAlerts=sum(len(x['loopAlerts'])for x in b),writerConflicts=sum(x['writerConflicts']for x in b),journeys=sum(len(x.get('motorTransport',{}).get('journeys',[]))for x in b),source=str(file.relative_to(root))))
runs=read(out/'profiles/runs.json',[]);profiles=[]
for name in dict.fromkeys(x['configuration']['name'] for x in runs):
 rr=[x for x in runs if x['configuration']['name']==name];plain=[x for x in rr if x['mode']=='plain'];wrapped=[x for x in rr if x['mode']=='wrapped'];cdp=[x for x in rr if x['mode']=='cdp'];a=statistics.median(x['wallMs']for x in plain);b=statistics.median(x['wallMs']for x in wrapped)
 hot=collections.defaultdict(list)
 for x in wrapped:
  for row in x['profile']['rows']:hot[row['label']].append(row)
 hot=[dict(label=k,totalMs=statistics.median(x['totalMs']for x in v),calls=statistics.median(x['calls']for x in v),avgUs=statistics.median(x['avgUs']for x in v),maxMs=max(x['maxMs']for x in v),wallPct=statistics.median(x['wallPct']for x in v))for k,v in hot.items()]
 hot.sort(key=lambda r:-r['totalMs'])
 cpu=[];memory=[]
 for x in plain:
  before={m['name']:m['value']for m in x['metricsBefore']};after={m['name']:m['value']for m in x['metricsAfter']};cpu.append(1000*(after['TaskDuration']-before['TaskDuration']));memory.append({'before':before.get('JSHeapUsedSize'),'after':after.get('JSHeapUsedSize')})
 sampled=[]
 for kind in ['simulation','render']:
  p=read(out/'profiles'/f'{name}-{kind}.cpuprofile')
  if not p:continue
  nodes={n['id']:n['callFrame']for n in p['nodes']};counts=collections.Counter();times=collections.Counter()
  for i,node in enumerate(p.get('samples',[])):
   f=nodes[node];key=(f['functionName'],f['url'],f['lineNumber']+1);counts[key]+=1;times[key]+=(p.get('timeDeltas')or[0]*len(p.get('samples',[])))[i]
  total=sum(times.values());sampled.append({'kind':kind,'sampledMs':total/1000,'top':[dict(function=k[0],url=k[1],line=k[2],samples=counts[k],selfMs=v/1000,pct=v/total*100)for k,v in times.most_common(30)]})
 profiles.append(dict(name=name,runs=len(rr),roster=plain[0]['state']['roster'],requested=plain[0]['configuration'],plainMedianMs=a,wrappedMedianMs=b,wrapperOverheadPct=100*(b/a-1),cdpMs=cdp[0]['wallMs']if cdp else None,mainTaskMedianMs=statistics.median(cpu),plainTickMs=stats([t for x in plain for t in x['ticks']]),heap=memory,observers=[x['observers']for x in rr],coarseReplayEqual=all(x['state']==plain[0]['state']for x in rr),terminalStable=all(x['terminalBefore']==x['terminalAfter']for x in rr),hotpaths=hot,samples=sampled))
checks=read(out/'checks.json',[]);static=read(out/'static-checks.json',[]);native=read(out/'native-interception/native-interception-evidence.json',[])+read(out/'interception-followup/native-interception-evidence.json',[])
summary=dict(baseline='f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9',campaigns=campaigns,benchmarkBattles=sum(x['battles']for x in campaigns),benchmarkSimulatedSeconds=sum(x['simulatedSeconds']for x in campaigns),profiles=profiles,profileBattles=len(runs),nativeInterceptionBattles=len(native),fixedStepBattleExecutions=sum(x['battles']for x in campaigns)+len(runs)+len(native),nativeInterceptionDispatches=sum(len(x['interceptions'])for x in native),nativePhysicallyEarly=sum(sum(bool(i['physicallyEarly'])for i in x['interceptions'])for x in native),harnessRuns=len(checks),harnessFailures=[x for x in checks if x['exitCode']],staticChecks=len(static),staticFailures=[x for x in static if x['exitCode']],queryCandidates=len(read(out/'query-read-inventory.json',[])),flagGateRows=len(read(out/'strategic-flag-matrix.json',[])))
(out/'campaign-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k not in ['profiles','campaigns']},indent=2))
