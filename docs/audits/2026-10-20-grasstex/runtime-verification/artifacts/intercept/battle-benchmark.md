# 100-battle headless benchmark

- Commit: `f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9`
- Build: `v460`
- Policy: stashed-defaults, revision 0
- Completed: **5/5** in **35.18s** (25.6× real-time, 8.53 battles/min)
- Results: US **0** (0.0%), GER **3** (60.0%), draw/none **2** (40.0%)
- Time-limit battles: **5/5**; captures avg **6.6** of **12** objectives; no-capture **0**
- Objectives nobody ever owned: **27** (45.0%) · never even contested **27** · distinct objectives assigned per side US **2.96**, GER **2.96**
- No objective progress: longest **117.5s** · mean per battle **111.5s**
- First contact avg **0s** · first fire **0s** · first objective progress **2.5s** · first capture **10.1s**
- Health: **82.6/100 overall** · strategic 100 · movement 56.6 · cohesion 99.2 · combat 100 · objective 57.2
- Squad performance: mean **88.3/100** · median **91.7** · p10 **81.7** · below 60 **0/50** · mission 69.4 · movement 96 · control 98 · cohesion 99 · combat null · preservation 100
- Stalls: vacant objective **0** · route **0** · soldier movement **26** · targetless command **0** · long regroup **0**
- Coordination: writer conflicts **0** (0 strategic) · loop alerts **0** · idle-under-orders 91.3% · over-cohesion 1.5%
- Combat: **0** discharges · **0** direct · **0** hits (0.0%) · **0** trigger-time LOS blocks · **0** held over a crest
- Stress (5 battles, 31497 man-seconds): steady **100.0%** · shaken **0.0%** · rattled **0.0%** · broken **0.0%** · battles reaching shaken/rattled/broken **0/0/0** · men by peak band 500/0/0/0 · shocks **0** · hesitations **0**
- Men whose squad is in contact (0 man-seconds): steady **0.0%** · shaken **0.0%** · rattled **0.0%** · broken **0.0%**
- Squads at mean stress ≥ 0.333: **0** of 50 squad-battles, **0** squad-seconds, 0 entries, in **0/5** battles · with 3+ living men: **0** squad-battles, **0** squad-seconds, 0 entries, in **0/5** battles · peak squad mean 0
- Soldier levers, decisions changed (by band steady/shaken/rattled/broken): react **0** [0/0/0/0] · aim **0** [0/0/0/0] · hesitate **0** [0/0/0/0], 0 lapsed · shock **0** blocked [0/0/0/0] (fire 0, suppress 0, bound 0, advance 0)
- Stress memory (lasting,floor,relief): held 0 man-seconds · floors 0 men (highest 0) · relief kill 0 (0) · objective 504 (0) · cover 0 (0) · survived 0 (0)
- Per battle (p50 / p90 / max): shaken-or-worse man-time 0% / 0% / 0% · squad-seconds over 0 / 0 / 0 · shocks 0 / 0 / 0
- Runtime: **0 probable JS/runtime errors** · **676 asset/CORS noise** · 4 warnings

## Most problematic runs

| Seed | Winner | Health | Captures | Never owned | Spread us/ge | Route stalls | Move stalls | Targetless | Vacant | Regroup | Conflicts | Loops | Max no-progress |
|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `runtime-audit-intercept-0003` | draw | 80.2 | 6/12 | 6 | 2.96/2.96 | 0 | 9 | 0 | 0 | 0 | 0 | 0 | 117.5s |
| `runtime-audit-intercept-0004` | draw | 83.4 | 6/12 | 6 | 2.96/2.96 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 117.5s |
| `runtime-audit-intercept-0001` | ge | 82.6 | 7/12 | 5 | 2.96/2.96 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 110s |
| `runtime-audit-intercept-0005` | ge | 82.7 | 7/12 | 5 | 2.96/2.96 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 107.6s |
| `runtime-audit-intercept-0002` | ge | 84.1 | 7/12 | 5 | 2.96/2.96 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 105s |

## Lowest squad performance

| Seed | Squad | Role | Overall | Mission | Movement | Control | Cohesion | Combat | Preservation |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| `runtime-audit-intercept-0001` | ge/ge-3 | recon | 81.7 | 45 | 100 | 100 | 100 | - | 100 |
| `runtime-audit-intercept-0002` | ge/ge-3 | recon | 81.7 | 45 | 100 | 100 | 100 | - | 100 |
| `runtime-audit-intercept-0003` | ge/ge-3 | recon | 81.7 | 45 | 100 | 100 | 100 | - | 100 |
| `runtime-audit-intercept-0004` | ge/ge-3 | recon | 81.7 | 45 | 100 | 100 | 100 | - | 100 |
| `runtime-audit-intercept-0005` | ge/ge-3 | recon | 81.7 | 45 | 100 | 100 | 100 | - | 100 |
| `runtime-audit-intercept-0001` | ge/ge-4 | recon | 81.7 | 45 | 100 | 100 | 100 | - | 100 |
| `runtime-audit-intercept-0002` | ge/ge-4 | recon | 81.7 | 45 | 100 | 100 | 100 | - | 100 |
| `runtime-audit-intercept-0003` | ge/ge-4 | recon | 81.7 | 45 | 100 | 100 | 100 | - | 100 |

## Diagnostic score note

Health and squad-performance scores are transparent triage aids, not pass/fail gates. Squad performance is role-aware: maneuver squads are judged on mission progress without penalizing support/reserve/garrison squads for holding still; combat is omitted when a squad had no combat opportunity. Raw measurements remain authoritative.
