# 100-battle headless benchmark

- Commit: `f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9`
- Build: `v460`
- Policy: stashed-defaults, revision 0
- Completed: **5/5** in **34.21s** (26.3× real-time, 8.77 battles/min)
- Results: US **0** (0.0%), GER **0** (0.0%), draw/none **5** (100.0%)
- Time-limit battles: **5/5**; captures avg **6** of **12** objectives; no-capture **0**
- Objectives nobody ever owned: **30** (50.0%) · never even contested **25** · distinct objectives assigned per side US **2.96**, GER **2.96**
- No objective progress: longest **152.4s** · mean per battle **149.4s**
- First contact avg **0s** · first fire **0s** · first objective progress **2.5s** · first capture **10.1s**
- Health: **78.6/100 overall** · strategic 100 · movement 47.4 · cohesion 99 · combat 100 · objective 46.8
- Squad performance: mean **92.5/100** · median **93.8** · p10 **87.2** · below 60 **0/50** · mission 85.2 · movement 92.4 · control 97 · cohesion 98.8 · combat null · preservation 100
- Stalls: vacant objective **0** · route **0** · soldier movement **54** · targetless command **0** · long regroup **0**
- Coordination: writer conflicts **0** (0 strategic) · loop alerts **0** · idle-under-orders 87.7% · over-cohesion 1.8%
- Combat: **0** discharges · **0** direct · **0** hits (0.0%) · **0** trigger-time LOS blocks · **0** held over a crest
- Stress (5 battles, 29977 man-seconds): steady **100.0%** · shaken **0.0%** · rattled **0.0%** · broken **0.0%** · battles reaching shaken/rattled/broken **0/0/0** · men by peak band 500/0/0/0 · shocks **0** · hesitations **0**
- Men whose squad is in contact (0 man-seconds): steady **0.0%** · shaken **0.0%** · rattled **0.0%** · broken **0.0%**
- Squads at mean stress ≥ 0.333: **0** of 50 squad-battles, **0** squad-seconds, 0 entries, in **0/5** battles · with 3+ living men: **0** squad-battles, **0** squad-seconds, 0 entries, in **0/5** battles · peak squad mean 0
- Soldier levers, decisions changed (by band steady/shaken/rattled/broken): react **0** [0/0/0/0] · aim **0** [0/0/0/0] · hesitate **0** [0/0/0/0], 0 lapsed · shock **0** blocked [0/0/0/0] (fire 0, suppress 0, bound 0, advance 0)
- Stress memory (lasting,floor,relief): held 0 man-seconds · floors 0 men (highest 0) · relief kill 0 (0) · objective 500 (0) · cover 0 (0) · survived 0 (0)
- Per battle (p50 / p90 / max): shaken-or-worse man-time 0% / 0% / 0% · squad-seconds over 0 / 0 / 0 · shocks 0 / 0 / 0
- Runtime: **0 probable JS/runtime errors** · **676 asset/CORS noise** · 4 warnings

## Most problematic runs

| Seed | Winner | Health | Captures | Never owned | Spread us/ge | Route stalls | Move stalls | Targetless | Vacant | Regroup | Conflicts | Loops | Max no-progress |
|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `runtime-audit-motor-0001` | draw | 75.9 | 6/12 | 6 | 2.96/2.96 | 0 | 18 | 0 | 0 | 0 | 0 | 0 | 152.4s |
| `runtime-audit-motor-0003` | draw | 76 | 6/12 | 6 | 2.96/2.96 | 0 | 18 | 0 | 0 | 0 | 0 | 0 | 152.4s |
| `runtime-audit-motor-0005` | draw | 78.8 | 6/12 | 6 | 2.96/2.96 | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 144.9s |
| `runtime-audit-motor-0002` | draw | 80 | 6/12 | 6 | 2.96/2.96 | 0 | 7 | 0 | 0 | 0 | 0 | 0 | 147.5s |
| `runtime-audit-motor-0004` | draw | 82.5 | 6/12 | 6 | 2.96/2.96 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 150s |

## Lowest squad performance

| Seed | Squad | Role | Overall | Mission | Movement | Control | Cohesion | Combat | Preservation |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| `runtime-audit-motor-0001` | ge/ge-1 | center | 87.2 | 83.6 | 69.9 | 97 | 100 | - | 100 |
| `runtime-audit-motor-0003` | ge/ge-1 | center | 87.2 | 83.6 | 69.9 | 97 | 100 | - | 100 |
| `runtime-audit-motor-0001` | us/us-0 | left | 87.2 | 83.6 | 70 | 97 | 100 | - | 100 |
| `runtime-audit-motor-0002` | us/us-0 | left | 87.2 | 83.6 | 70 | 97 | 100 | - | 100 |
| `runtime-audit-motor-0003` | us/us-0 | left | 87.2 | 83.6 | 70 | 97 | 100 | - | 100 |
| `runtime-audit-motor-0005` | us/us-0 | left | 87.2 | 83.6 | 70 | 97 | 100 | - | 100 |
| `runtime-audit-motor-0001` | ge/ge-4 | center | 89.9 | 83.6 | 84 | 97 | 97.3 | - | 100 |
| `runtime-audit-motor-0003` | ge/ge-2 | support | 90.2 | 91.4 | 76 | 97 | 94.7 | - | 100 |

## Diagnostic score note

Health and squad-performance scores are transparent triage aids, not pass/fail gates. Squad performance is role-aware: maneuver squads are judged on mission progress without penalizing support/reserve/garrison squads for holding still; combat is omitted when a squad had no combat opportunity. Raw measurements remain authoritative.
