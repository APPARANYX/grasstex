#!/usr/bin/env python3
"""Join executed query reads and interception snapshots; retain scope distinctions."""
import json,gzip
from pathlib import Path
out=Path('docs/audits/2026-10-20-grasstex/runtime-verification/artifacts')
def read(path):
 path=Path(path)
 if not path.exists():path=Path(str(path)+'.gz')
 return json.loads(gzip.open(path,'rt').read() if path.suffix=='.gz' else path.read_text())
inv=read(out/'query-read-inventory.json');p=read(out/'flag-predicate-executions.json');l=read(out/'loader-range-flag-executions.json')
php={'requestedSeed':'seed','requestedDefender':'defender','autonomousMovement':'autonomousMovement','smartIndoorIngress':'smartIndoorIngress','labRequested':'combatLab','allDevModules':'devModules','graphUiRequested':'editor','deviceBenchRequested':'bench','damageRangeRequested':'damageRange','pinRequested':'pin','requestedRef':'ref'}
coverage=[]
for item in inv:
 name=item['name'];evidence=[]
 for i,r in enumerate(p['rows']):
  if r['name']==name:evidence.append(dict(artifact='flag-predicate-executions.json',section='rows',index=i,scope=r['scope'],absent=r['cases'][0]['output']))
 for i,r in enumerate(p['initializers']):
  cases=[c for c in r['cases'] if c['name']==name and not c.get('error') and not c.get('unexecuted')]
  if cases:evidence.append(dict(artifact='flag-predicate-executions.json',section='initializers',index=i,scope=r['scope'],absent=next((c.get('output')for c in cases if c['query']==''),None)))
 for i,r in enumerate(p['helpers']):
  if r['name']==name:evidence.append(dict(artifact='flag-predicate-executions.json',section='helpers',index=i,scope=r['scope'],absent=r['cases'][0].get('output')))
 for field,key in php.items():
  if key==name:evidence.append(dict(artifact='loader-range-flag-executions.json',section='phpCases',field=field,scope='unchanged PHP loader fragment',absent=l['phpCases'][0]['effective'][field]))
 for section,rows in [('rangeReader',l['rangeReader']['cases']),('extraReadCases',l['extraReadCases'])]:
  matches=[r for r in rows if r['name']==name]
  if matches:evidence.append(dict(artifact='loader-range-flag-executions.json',section=section,scope='original JS read expression in explicit dependency fixture',absent=next((r['effective']for r in matches if r['query']in['','?']),None)))
 coverage.append(dict(name=name,classification='not a URL flag: Map lookup' if name=='infantry' else 'preview-only candidate, no runtime reader found' if name=='grass' else 'executed isolated read' if evidence else 'unresolved',evidence=evidence,modules=sorted(set(r['file']for r in item['references'])),testMentions=item['testMentions'],deployedEffective='unverified',note='Read result is not full-module activation; dependencies/caller inversion still apply.'))
result=dict(candidateCount=len(inv),withExecutedReads=sum(bool(r['evidence'])for r in coverage),excludedNonQuery=['infantry'],unresolved=[r['name']for r in coverage if not r['evidence']and r['name']!='infantry'],rows=coverage)
(out/'flag-read-coverage.json').write_text(json.dumps(result,indent=2)+'\n')
native=read(out/'interception-followup/native-interception-evidence.json');base=read(out/'native-interception/native-interception-evidence.json');comparisons=[]
for r in native:
 original=next((x for x in base if x['seed']==r['seed'] and x['enabled']==r['enabled']),None)
 if original:
  fields=['seconds','fleetStart','fleetEnd','general','interceptions','shots','forwardScreen'];comparisons.append(dict(seed=r['seed'],fieldsCompared=fields,allEqual=all(r.get(k)==original.get(k)for k in fields),unequal=[k for k in fields if r.get(k)!=original.get(k)]))
(out/'interception-followup-summary.json').write_text(json.dumps(dict(battles=len(native),simulatedSeconds=sum(x['seconds']for x in native),dispatches=sum(len(x['interceptions'])for x in native),decisionSnapshots=sum(len(x['availabilityAudit'])for x in native),repeatedSeedCounters=comparisons,classification='Observed decisions; no forced squads, enemies or outcomes. Retasking or allocation changes not attempted.'),indent=2)+'\n')
print('Executed reads',result['withExecutedReads'],'of',len(inv),'candidates; excluded infantry; unresolved',result['unresolved']);print('Native follow-up',len(native),'battles; repeated counters',comparisons)
