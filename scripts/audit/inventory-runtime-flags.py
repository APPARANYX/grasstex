#!/usr/bin/env python3
"""Conservative query-read candidate inventory; does not infer defaults from names."""
import re,json
from pathlib import Path
out=Path('docs/audits/2026-10-20-grasstex/runtime-verification/artifacts')
files=list(Path('battle').rglob('*.js'))+[Path(p) for p in ['battle/battle_sim.html','battle_sim.php','battle_sim_local.php','preview.php']]
rows={}
patterns=[r'\.get\(\s*[\'\"]([A-Za-z][A-Za-z0-9_]*)[\'\"]',r'\$_GET\[\s*[\'\"]([A-Za-z][A-Za-z0-9_]*)[\'\"]',r'\[\?&\]\)([A-Za-z][A-Za-z0-9_]*)=',r'\[\?&\]([A-Za-z][A-Za-z0-9_]*)=',r'(?:flagOff|flagOn|queryFlag|boolFlag)\(\s*[\'\"]([A-Za-z][A-Za-z0-9_]*)[\'\"]']
preview=Path('preview.php').read_text(); allow=re.search(r'foreach \(array\((.*?)\) as \$k\)',preview[preview.index('/* Game flags'):],re.S).group(1)
passed=set(re.findall(r"'([^']+)'",allow))
for p in files:
 for n,line in enumerate(p.read_text().splitlines(),1):
  for pattern in patterns:
   for name in re.findall(pattern,line):
    row=rows.setdefault(name,dict(name=name,previewForwarded=name in passed,classification='query-read candidate; manual semantics verification required',default='unresolved',production='unresolved',preview='unresolved',references=[]))
    ref=dict(file=str(p),line=n,text=line.strip()[:350])
    if ref not in row['references']:row['references'].append(ref)
for name in passed:
 rows.setdefault(name,dict(name=name,previewForwarded=True,classification='preview-only candidate',default='unresolved',production='unresolved',preview='unresolved',references=[]))
tests={str(p):p.read_text() for p in Path('tools/ai-sim-harness').glob('*-check.js')}
for name,row in rows.items():
 row['testMentions']=[p for p,text in tests.items() if re.search(r'(?<![A-Za-z0-9_])'+re.escape(name)+r'(?![A-Za-z0-9_])',text)]
 row['testMentionCaveat']='Source mention only, not a coverage assertion'
 if name in ['strategicInterception','motorTransport','aerialRecon','interception','truckCollision']:
  row.update(default='baseline source: off; current-main source: on with prerequisites',production='deployed state unverified',preview='deployed state unverified; baseline requested flags dropped unless allowlisted',classification='strategic gate executed in 64-case matrix')
(out/'query-read-inventory.json').write_text(json.dumps(sorted(rows.values(),key=lambda x:x['name']),indent=2)+'\n')
print(len(rows),'query candidates; semantic completeness not asserted')
