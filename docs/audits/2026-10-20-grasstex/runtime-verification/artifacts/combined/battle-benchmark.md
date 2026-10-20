# 100-battle headless benchmark

- Commit: `f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9`
- Build: `v460`
- Policy: stashed-defaults, revision 0
- Completed: **5/5** in **104.09s** (28.8× real-time, 2.88 battles/min)
- Results: US **3** (60.0%), GER **2** (40.0%), draw/none **0** (0.0%)
- Time-limit battles: **5/5**; captures avg **12** of **12** objectives; no-capture **0**
- Objectives nobody ever owned: **0** (0.0%) · never even contested **0** · distinct objectives assigned per side US **2.48**, GER **2.55**
- No objective progress: longest **272.4s** · mean per battle **208.9s**
- First contact avg **0s** · first fire **0s** · first objective progress **2.5s** · first capture **10.1s**
- Health: **88.4/100 overall** · strategic 74.9 · movement 99.8 · cohesion 85 · combat 100 · objective 82.1
- Squad performance: mean **83.9/100** · median **81.4** · p10 **80.7** · below 60 **0/50** · mission 65 · movement 99.8 · control 88.1 · cohesion 89.2 · combat null · preservation 100
- Stalls: vacant objective **2** · route **0** · soldier movement **0** · targetless command **0** · long regroup **5**
- Coordination: writer conflicts **0** (0 strategic) · loop alerts **58** · idle-under-orders 0.7% · over-cohesion 14.5%
- Combat: **0** discharges · **0** direct · **0** hits (0.0%) · **0** trigger-time LOS blocks · **0** held over a crest
- Stress (5 battles, 298404 man-seconds): steady **100.0%** · shaken **0.0%** · rattled **0.0%** · broken **0.0%** · battles reaching shaken/rattled/broken **0/0/0** · men by peak band 500/0/0/0 · shocks **0** · hesitations **0**
- Men whose squad is in contact (0 man-seconds): steady **0.0%** · shaken **0.0%** · rattled **0.0%** · broken **0.0%**
- Squads at mean stress ≥ 0.333: **0** of 50 squad-battles, **0** squad-seconds, 0 entries, in **0/5** battles · with 3+ living men: **0** squad-battles, **0** squad-seconds, 0 entries, in **0/5** battles · peak squad mean 0.031
- Soldier levers, decisions changed (by band steady/shaken/rattled/broken): react **0** [0/0/0/0] · aim **0** [0/0/0/0] · hesitate **0** [0/0/0/0], 0 lapsed · shock **0** blocked [0/0/0/0] (fire 0, suppress 0, bound 0, advance 0)
- Stress memory (lasting,floor,relief): held 0 man-seconds · floors 0 men (highest 0) · relief kill 0 (0) · objective 752 (0) · cover 0 (0) · survived 0 (0)
- Per battle (p50 / p90 / max): shaken-or-worse man-time 0% / 0% / 0% · squad-seconds over 0 / 0 / 0 · shocks 0 / 0 / 0
- Runtime: **0 probable JS/runtime errors** · **676 asset/CORS noise** · 4 warnings

## Most problematic runs

| Seed | Winner | Health | Captures | Never owned | Spread us/ge | Route stalls | Move stalls | Targetless | Vacant | Regroup | Conflicts | Loops | Max no-progress |
|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `runtime-audit-combined-0004` | ge | 86.8 | 12/12 | 0 | 2.41/2.53 | 0 | 0 | 0 | 0 | 2 | 0 | 14 | 214.9s |
| `runtime-audit-combined-0003` | us | 87.3 | 12/12 | 0 | 2.46/2.51 | 0 | 0 | 0 | 0 | 2 | 0 | 13 | 210s |
| `runtime-audit-combined-0001` | ge | 88.9 | 12/12 | 0 | 2.53/2.57 | 0 | 0 | 0 | 0 | 1 | 0 | 12 | 272.4s |
| `runtime-audit-combined-0005` | us | 88.5 | 12/12 | 0 | 2.46/2.57 | 0 | 0 | 0 | 1 | 0 | 0 | 11 | 212.4s |
| `runtime-audit-combined-0002` | us | 90.3 | 12/12 | 0 | 2.53/2.56 | 0 | 0 | 0 | 1 | 0 | 0 | 8 | 135s |

## Lowest squad performance

| Seed | Squad | Role | Overall | Mission | Movement | Control | Cohesion | Combat | Preservation |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| `runtime-audit-combined-0004` | ge/ge-2 | center | 74.5 | 76.3 | 99.4 | 55 | 55 | - | 100 |
| `runtime-audit-combined-0003` | ge/ge-2 | center | 76.9 | 76.4 | 99.7 | 55 | 69 | - | 100 |
| `runtime-audit-combined-0003` | us/us-4 | recon | 78.2 | 44.8 | 100 | 99.8 | 80 | - | 100 |
| `runtime-audit-combined-0004` | us/us-4 | recon | 79.9 | 44.8 | 100 | 99.8 | 90.2 | - | 100 |
| `runtime-audit-combined-0001` | us/us-2 | center | 80.6 | 76.3 | 99.6 | 55 | 91.7 | - | 100 |
| `runtime-audit-combined-0002` | ge/ge-4 | recon | 80.7 | 44.1 | 100 | 99.2 | 97.3 | - | 100 |
| `runtime-audit-combined-0005` | ge/ge-2 | center | 80.9 | 76.2 | 99.3 | 55 | 93.9 | - | 100 |
| `runtime-audit-combined-0004` | us/us-3 | recon | 80.9 | 44.4 | 100 | 99.5 | 97.1 | - | 100 |

## Diagnostic score note

Health and squad-performance scores are transparent triage aids, not pass/fail gates. Squad performance is role-aware: maneuver squads are judged on mission progress without penalizing support/reserve/garrison squads for holding still; combat is omitted when a squad had no combat opportunity. Raw measurements remain authoritative.
