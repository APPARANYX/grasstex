#!/usr/bin/env python3
"""Batch existing production-browser benchmark; preserve exact configurations and failures."""
import subprocess,os,json,time,sys
from pathlib import Path
out=Path('docs/audits/2026-10-20-grasstex/runtime-verification/artifacts')
base='http://127.0.0.1:8876/grasstex/battle_sim_local.php'
configs=[('us-defend','defender=us',5,120),('ge-defend','defender=ge',5,120),('strategic','strategicInterception=1',5,180),('motor','strategicInterception=1&motorTransport=1',5,180),('recon','strategicInterception=1&aerialRecon=1',5,180),('intercept','strategicInterception=1&motorTransport=1&aerialRecon=1&interception=1',5,180),('combined','strategicInterception=1&motorTransport=1&aerialRecon=1&interception=1&truckCollision=1',5,600),('endurance','soldiers=200',1,600)]
configs += [('all-intended','strategicInterception=1&motorTransport=1&aerialRecon=1&interception=1&truckCollision=1&truckAccess=1&frontLines=1&reinforcements=1&reinforcementSortie=1',5,600)]
if len(sys.argv)>1: configs=[c for c in configs if c[0] in sys.argv[1:]]
else: configs=[c for c in configs if c[0]!='all-intended']
rows=[]
for name,q,count,seconds in configs:
    env={**os.environ,'BATTLE_BENCHMARK_URL':base+'?'+q,'BATTLE_BENCHMARK_COUNT':str(count),'BATTLE_BENCHMARK_FIRST':'0','BATTLE_BENCHMARK_SEED':'runtime-audit-'+name,'BATTLE_BENCHMARK_TIME_LIMIT':str(seconds),'BATTLE_BENCHMARK_SOURCE_SHA':'f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9','BATTLE_BENCHMARK_POLICY_URL':'http://127.0.0.1:8876/unavailable','BATTLE_BENCHMARK_OUTPUT':str(out/name)}
    start=time.monotonic()
    with (out/(name+'.log')).open('w') as log:
        try: code=subprocess.run(['node','scripts/run_battle_benchmark.mjs'],env=env,stdout=log,stderr=subprocess.STDOUT,timeout=1800).returncode
        except subprocess.TimeoutExpired: code=124
    rows.append(dict(name=name,query=q,count=count,seconds=seconds,exitCode=code,wallSeconds=time.monotonic()-start,environment={k:v for k,v in env.items() if k.startswith('BATTLE_')}))
    (out/('batches-'+('-'.join(sys.argv[1:]) if len(sys.argv)>1 else 'core')+'.json')).write_text(json.dumps(rows,indent=2)+'\n')
    print(name,code,flush=True)
