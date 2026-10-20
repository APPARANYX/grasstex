# 100-battle headless benchmark

- Commit: `f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9`
- Build: `v460`
- Policy: stashed-defaults, revision 0
- Completed: **5/5** in **22.12s** (27.1× real-time, 13.56 battles/min)
- Results: US **0** (0.0%), GER **2** (40.0%), draw/none **3** (60.0%)
- Time-limit battles: **5/5**; captures avg **0.4** of **4** objectives; no-capture **3**
- Objectives nobody ever owned: **18** (90.0%) · never even contested **17** · distinct objectives assigned per side US **2.45**, GER **2.45**
- No objective progress: longest **120s** · mean per battle **114s**
- First contact avg **0s** · first fire **0s** · first objective progress **110.1s** · first capture **113.8s**
- Health: **81/100 overall** · strategic 100 · movement 99.9 · cohesion 89.4 · combat 100 · objective 15.8
- Squad performance: mean **92.9/100** · median **92.3** · p10 **90.9** · below 60 **0/50** · mission 85.3 · movement 100 · control 99.8 · cohesion 87.4 · combat null · preservation 100
- Stalls: vacant objective **0** · route **0** · soldier movement **0** · targetless command **0** · long regroup **0**
- Coordination: writer conflicts **0** (0 strategic) · loop alerts **0** · idle-under-orders 0.4% · over-cohesion 19.4%
- Combat: **0** discharges · **0** direct · **0** hits (0.0%) · **0** trigger-time LOS blocks · **0** held over a crest
- Stress (5 battles, 59925 man-seconds): steady **100.0%** · shaken **0.0%** · rattled **0.0%** · broken **0.0%** · battles reaching shaken/rattled/broken **0/0/0** · men by peak band 500/0/0/0 · shocks **0** · hesitations **0**
- Men whose squad is in contact (0 man-seconds): steady **0.0%** · shaken **0.0%** · rattled **0.0%** · broken **0.0%**
- Squads at mean stress ≥ 0.333: **0** of 50 squad-battles, **0** squad-seconds, 0 entries, in **0/5** battles · with 3+ living men: **0** squad-battles, **0** squad-seconds, 0 entries, in **0/5** battles · peak squad mean 0.017
- Soldier levers, decisions changed (by band steady/shaken/rattled/broken): react **0** [0/0/0/0] · aim **0** [0/0/0/0] · hesitate **0** [0/0/0/0], 0 lapsed · shock **0** blocked [0/0/0/0] (fire 0, suppress 0, bound 0, advance 0)
- Stress memory (lasting,floor,relief): held 0 man-seconds · floors 0 men (highest 0) · relief kill 0 (0) · objective 13 (0) · cover 0 (0) · survived 0 (0)
- Per battle (p50 / p90 / max): shaken-or-worse man-time 0% / 0% / 0% · squad-seconds over 0 / 0 / 0 · shocks 0 / 0 / 0
- Runtime: **0 probable JS/runtime errors** · **676 asset/CORS noise** · 4 warnings

## Most problematic runs

| Seed | Winner | Health | Captures | Never owned | Spread us/ge | Route stalls | Move stalls | Targetless | Vacant | Regroup | Conflicts | Loops | Max no-progress |
|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `runtime-audit-meeting-0001` | draw | 78.4 | 0/5 | 5 | 2.78/1.96 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 117.6s |
| `runtime-audit-meeting-0004` | draw | 78.5 | 0/4 | 4 | 2.78/2.78 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 120s |
| `runtime-audit-meeting-0002` | draw | 78.3 | 0/3 | 3 | 2.78/2.78 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 120s |
| `runtime-audit-meeting-0005` | ge | 84.7 | 1/4 | 3 | 1.96/2.69 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 105s |
| `runtime-audit-meeting-0003` | ge | 85.1 | 1/4 | 3 | 1.96/2.02 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 107.6s |

## Lowest squad performance

| Seed | Squad | Role | Overall | Mission | Movement | Control | Cohesion | Combat | Preservation |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| `runtime-audit-meeting-0003` | us/us-4 | center | 89.1 | 79.5 | 100 | 100 | 75.8 | - | 100 |
| `runtime-audit-meeting-0005` | us/us-0 | left | 90.6 | 84.4 | 100 | 100 | 74.8 | - | 100 |
| `runtime-audit-meeting-0005` | ge/ge-0 | left | 90.7 | 81.4 | 100 | 97 | 85.4 | - | 100 |
| `runtime-audit-meeting-0004` | us/us-3 | center | 90.8 | 84.4 | 100 | 100 | 76.1 | - | 100 |
| `runtime-audit-meeting-0003` | ge/ge-0 | left | 90.9 | 81.4 | 100 | 97 | 86.7 | - | 100 |
| `runtime-audit-meeting-0002` | us/us-0 | left | 90.9 | 84.4 | 100 | 100 | 76.8 | - | 100 |
| `runtime-audit-meeting-0004` | ge/ge-4 | center | 91.2 | 79.5 | 100 | 100 | 88.1 | - | 100 |
| `runtime-audit-meeting-0005` | ge/ge-4 | center | 91.2 | 79.5 | 100 | 100 | 88.1 | - | 100 |

## Diagnostic score note

Health and squad-performance scores are transparent triage aids, not pass/fail gates. Squad performance is role-aware: maneuver squads are judged on mission progress without penalizing support/reserve/garrison squads for holding still; combat is omitted when a squad had no combat opportunity. Raw measurements remain authoritative.
