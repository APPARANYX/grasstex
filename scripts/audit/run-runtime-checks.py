#!/usr/bin/env python3
"""Execute existing checks without suppressing failures; save per-check logs and timings."""
import os, subprocess, time, json, platform
from pathlib import Path
out=Path('docs/audits/2026-10-20-grasstex/runtime-verification/artifacts')
out.mkdir(parents=True,exist_ok=True)
rows=[]
jobs=[(['node',str(p)],{}) for p in sorted(Path('tools/ai-sim-harness').glob('*-check.js'))]
jobs += [(['node','tools/ai-sim-harness/run.js'],{'HARNESS_SEED':str(s)}) for s in [12345,1,2,3,5,8,13,21]]
for i,(cmd,env) in enumerate(jobs):
    start=time.monotonic(); name=Path(cmd[-1]).stem+('-'+env['HARNESS_SEED'] if env else '')
    try:
        r=subprocess.run(cmd,env={**os.environ,**env},capture_output=True,text=True,timeout=180)
        code=r.returncode; log=r.stdout+r.stderr
    except subprocess.TimeoutExpired as e:
        code=124; log=str(e)
    (out/(name+'.log')).write_text(log)
    rows.append(dict(command=cmd,environment=env,exitCode=code,seconds=round(time.monotonic()-start,4),log=name+'.log'))
    (out/'checks.json').write_text(json.dumps(rows,indent=2)+'\n')
    print(f'{i+1}/{len(jobs)} {name}: {code}',flush=True)
