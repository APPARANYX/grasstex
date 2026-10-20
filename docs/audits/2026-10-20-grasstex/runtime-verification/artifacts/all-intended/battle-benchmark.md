# 100-battle headless benchmark

- Commit: `f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9`
- Build: `v460`
- Policy: stashed-defaults, revision 0
- Completed: **5/5** in **90.55s** (33.1× real-time, 3.31 battles/min)
- Results: US **2** (40.0%), GER **3** (60.0%), draw/none **0** (0.0%)
- Time-limit battles: **5/5**; captures avg **2** of **9** objectives; no-capture **0**
- Objectives nobody ever owned: **0** (0.0%) · never even contested **9** · distinct objectives assigned per side US **1.2**, GER **1.24**
- No objective progress: longest **259.9s** · mean per battle **194s**
- First contact avg **232.5s** · first fire **249.3s** · first objective progress **2.5s** · first capture **294.1s**
- Health: **74.6/100 overall** · strategic 76.6 · movement 46.8 · cohesion 98.1 · combat 99.6 · objective 52.1
- Squad performance: mean **86.8/100** · median **86.6** · p10 **74** · below 60 **0/69** · mission 75.5 · movement 94.3 · control 93.6 · cohesion 97.7 · combat 72.3 · preservation 74.5
- Stalls: vacant objective **18** · route **9** · soldier movement **31** · targetless command **3** · long regroup **0**
- Coordination: writer conflicts **0** (0 strategic) · loop alerts **48** · idle-under-orders 82.8% · over-cohesion 3.4%
- Combat: **540** discharges · **281** direct · **211** hits (75.1%) · **0** trigger-time LOS blocks · **4** held over a crest
- Stress (5 battles, 154363.4 man-seconds): steady **97.8%** · shaken **0.9%** · rattled **0.4%** · broken **0.8%** · battles reaching shaken/rattled/broken **5/5/5** · men by peak band 495/28/22/45 · shocks **134** · hesitations **0**
- Men whose squad is in contact (5572.6 man-seconds): steady **82.5%** · shaken **9.1%** · rattled **3.3%** · broken **5.1%**
- Squads at mean stress ≥ 0.333: **22** of 69 squad-battles, **1556.6** squad-seconds, 24 entries, in **5/5** battles · with 3+ living men: **12** squad-battles, **260.9** squad-seconds, 12 entries, in **5/5** battles · peak squad mean 1
- Soldier levers, decisions changed (by band steady/shaken/rattled/broken): react **130** of 320 (40.6%) [102/25/3/0] · aim **152** of 281 (54.1%) [86/38/6/22] · hesitate **0** of 5 (0.0%) [0/0/0/0], 0 lapsed · shock **245** blocked [111/104/25/5] (fire 23, suppress 0, bound 0, advance 222)
- Stress memory (lasting,floor,relief): held 5137.9 man-seconds · floors 56 men (highest 0.909) · relief kill 111 (4.48) · objective 83 (1.82) · cover 0 (0) · survived 77 (3.9)
- Stress reactions: cower 24 (52.6 s) · flee 10 (1420.8 s) · freeze 15 (104.8 s) · rage 7 (38.8 s) · charge blows 7 struck, 4 landed · hits taken under the berserk guard 51 (1590.5 hp saved)  · kills in rage 12 · trances survived 4, 3 succumbed (871.5 hp due)
- Per battle (p50 / p90 / max): shaken-or-worse man-time 2.62% / 3.46% / 3.49% · squad-seconds over 443.8 / 491.92 / 499.8 · shocks 31 / 38.2 / 39
- Runtime: **0 probable JS/runtime errors** · **676 asset/CORS noise** · 4 warnings

## Most problematic runs

| Seed | Winner | Health | Captures | Never owned | Spread us/ge | Route stalls | Move stalls | Targetless | Vacant | Regroup | Conflicts | Loops | Max no-progress |
|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `runtime-audit-all-intended-0005` | ge | 75 | 2/9 | 0 | 1.19/1.27 | 2 | 0 | 1 | 4 | 0 | 0 | 25 | 160s |
| `runtime-audit-all-intended-0002` | us | 69.5 | 2/9 | 0 | 1.4/1.03 | 3 | 11 | 2 | 5 | 0 | 0 | 0 | 145s |
| `runtime-audit-all-intended-0003` | us | 78.3 | 2/9 | 0 | 1.3/1.13 | 1 | 0 | 0 | 4 | 0 | 0 | 12 | 147.5s |
| `runtime-audit-all-intended-0004` | ge | 77.9 | 3/9 | 0 | 1.13/1.5 | 1 | 0 | 0 | 3 | 0 | 0 | 7 | 259.9s |
| `runtime-audit-all-intended-0001` | ge | 72.5 | 1/9 | 0 | 1/1.26 | 2 | 20 | 0 | 2 | 0 | 0 | 4 | 257.5s |

## Lowest squad performance

| Seed | Squad | Role | Overall | Mission | Movement | Control | Cohesion | Combat | Preservation |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| `runtime-audit-all-intended-0002` | ge/ge-4 | recon | 70.9 | 29.7 | 88 | 86.4 | 100 | - | 100 |
| `runtime-audit-all-intended-0001` | ge/ge-3 | recon | 72.3 | 45 | 58 | 100 | 100 | - | 100 |
| `runtime-audit-all-intended-0001` | us/us-3 | recon | 72.3 | 45 | 58 | 100 | 100 | - | 100 |
| `runtime-audit-all-intended-0002` | ge/ge-1-fled-64 | maneuver | 74 | 45 | 100 | 100 | 100 | 55 | 0 |
| `runtime-audit-all-intended-0004` | ge/ge-1-fled-68 | maneuver | 74 | 45 | 100 | 100 | 100 | 55 | 0 |
| `runtime-audit-all-intended-0003` | ge/ge-2-fled-71 | maneuver | 74 | 45 | 100 | 100 | 100 | 55 | 0 |
| `runtime-audit-all-intended-0003` | ge/ge-2-fled-76 | maneuver | 74 | 45 | 100 | 100 | 100 | 55 | 0 |
| `runtime-audit-all-intended-0003` | ge/ge-2-fled-77 | maneuver | 74 | 45 | 100 | 100 | 100 | 55 | 0 |

## Diagnostic score note

Health and squad-performance scores are transparent triage aids, not pass/fail gates. Squad performance is role-aware: maneuver squads are judged on mission progress without penalizing support/reserve/garrison squads for holding still; combat is omitted when a squad had no combat opportunity. Raw measurements remain authoritative.
