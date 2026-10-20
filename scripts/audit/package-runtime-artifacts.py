#!/usr/bin/env python3
"""Losslessly compress large audit artifacts and save sizes/SHA-256 for reuse."""
import gzip,hashlib,json
from pathlib import Path
root=Path('docs/audits/2026-10-20-grasstex/runtime-verification/artifacts')
for p in sorted(root.rglob('*')):
 if p.is_file() and p.name not in ['campaign-summary.json','artifact-index.json'] and ((p.suffix in ['.json','.csv','.log','.cpuprofile'] and p.stat().st_size>500_000) or (p.suffix in ['.log','.md'] and any(line.rstrip(' \t')!=line for line in p.read_text().splitlines()))):
  target=Path(str(p)+'.gz')
  with p.open('rb') as source,gzip.GzipFile(str(target),'wb',mtime=0) as dest:dest.write(source.read())
  p.unlink()
rows=[]
for p in sorted(root.rglob('*')):
 if p.is_file() and p.name!='artifact-index.json':rows.append(dict(path=str(p.relative_to(root)),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
(root/'artifact-index.json').write_text(json.dumps(rows,indent=2)+'\n');print(len(rows),'artifacts',sum(x['bytes']for x in rows),'bytes')
