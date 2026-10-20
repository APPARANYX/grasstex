# 100-battle headless benchmark

- Commit: `f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9`
- Build: `v460`
- Policy: stashed-defaults, revision 0
- Completed: **5/5** in **37.57s** (24× real-time, 7.98 battles/min)
- Results: US **0** (0.0%), GER **0** (0.0%), draw/none **5** (100.0%)
- Time-limit battles: **5/5**; captures avg **6** of **12** objectives; no-capture **0**
- Objectives nobody ever owned: **30** (50.0%) · never even contested **30** · distinct objectives assigned per side US **2.96**, GER **2.96**
- No objective progress: longest **122.4s** · mean per battle **120.9s**
- First contact avg **0s** · first fire **0s** · first objective progress **2.5s** · first capture **10.1s**
- Health: **90.5/100 overall** · strategic 100 · movement 99.8 · cohesion 99.8 · combat 100 · objective 53.1
- Squad performance: mean **94.3/100** · median **93.9** · p10 **93.8** · below 60 **0/50** · mission 85.1 · movement 99.9 · control 97 · cohesion 99.7 · combat null · preservation 100
- Stalls: vacant objective **0** · route **0** · soldier movement **0** · targetless command **0** · long regroup **0**
- Coordination: writer conflicts **0** (0 strategic) · loop alerts **0** · idle-under-orders 0.5% · over-cohesion 0.4%
- Combat: **0** discharges · **0** direct · **0** hits (0.0%) · **0** trigger-time LOS blocks · **0** held over a crest
- Stress (5 battles, 89925 man-seconds): steady **100.0%** · shaken **0.0%** · rattled **0.0%** · broken **0.0%** · battles reaching shaken/rattled/broken **0/0/0** · men by peak band 500/0/0/0 · shocks **0** · hesitations **0**
- Men whose squad is in contact (0 man-seconds): steady **0.0%** · shaken **0.0%** · rattled **0.0%** · broken **0.0%**
- Squads at mean stress ≥ 0.333: **0** of 50 squad-battles, **0** squad-seconds, 0 entries, in **0/5** battles · with 3+ living men: **0** squad-battles, **0** squad-seconds, 0 entries, in **0/5** battles · peak squad mean 0
- Soldier levers, decisions changed (by band steady/shaken/rattled/broken): react **0** [0/0/0/0] · aim **0** [0/0/0/0] · hesitate **0** [0/0/0/0], 0 lapsed · shock **0** blocked [0/0/0/0] (fire 0, suppress 0, bound 0, advance 0)
- Stress memory (lasting,floor,relief): held 0 man-seconds · floors 0 men (highest 0) · relief kill 0 (0) · objective 500 (0) · cover 0 (0) · survived 0 (0)
- Per battle (p50 / p90 / max): shaken-or-worse man-time 0% / 0% / 0% · squad-seconds over 0 / 0 / 0 · shocks 0 / 0 / 0
- Runtime: **0 probable JS/runtime errors** · **676 asset/CORS noise** · 4 warnings

## Most problematic runs

| Seed | Winner | Health | Captures | Never owned | Spread us/ge | Route stalls | Move stalls | Targetless | Vacant | Regroup | Conflicts | Loops | Max no-progress |
|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `runtime-audit-strategic-0004` | draw | 90.4 | 6/12 | 6 | 2.96/2.96 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 122.4s |
| `runtime-audit-strategic-0001` | draw | 90.5 | 6/12 | 6 | 2.96/2.96 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 122.4s |
| `runtime-audit-strategic-0005` | draw | 90.5 | 6/12 | 6 | 2.96/2.96 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 122.4s |
| `runtime-audit-strategic-0003` | draw | 90.6 | 6/12 | 6 | 2.96/2.96 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 120s |
| `runtime-audit-strategic-0002` | draw | 90.6 | 6/12 | 6 | 2.96/2.96 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 117.5s |

## Lowest squad performance

| Seed | Squad | Role | Overall | Mission | Movement | Control | Cohesion | Combat | Preservation |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| `runtime-audit-strategic-0004` | ge/ge-4 | center | 92.8 | 83.6 | 100 | 97 | 93.8 | - | 100 |
| `runtime-audit-strategic-0002` | us/us-4 | center | 92.8 | 83.6 | 100 | 97 | 93.8 | - | 100 |
| `runtime-audit-strategic-0003` | ge/ge-3 | center | 93.7 | 83.5 | 99.6 | 97 | 100 | - | 100 |
| `runtime-audit-strategic-0002` | us/us-0 | left | 93.7 | 83.6 | 100 | 97 | 99.1 | - | 100 |
| `runtime-audit-strategic-0001` | ge/ge-1 | center | 93.8 | 83.5 | 99.7 | 97 | 100 | - | 100 |
| `runtime-audit-strategic-0002` | ge/ge-1 | center | 93.8 | 83.5 | 99.7 | 97 | 100 | - | 100 |
| `runtime-audit-strategic-0003` | ge/ge-1 | center | 93.8 | 83.5 | 99.8 | 97 | 100 | - | 100 |
| `runtime-audit-strategic-0004` | ge/ge-1 | center | 93.8 | 83.5 | 99.8 | 97 | 100 | - | 100 |

## Diagnostic score note

Health and squad-performance scores are transparent triage aids, not pass/fail gates. Squad performance is role-aware: maneuver squads are judged on mission progress without penalizing support/reserve/garrison squads for holding still; combat is omitted when a squad had no combat opportunity. Raw measurements remain authoritative.
