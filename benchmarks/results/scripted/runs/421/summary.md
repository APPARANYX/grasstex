# Benchmark run #421 · 60 seeds from `control` (us-defend), windows `every120`

- **OFF** flags: `fireLineContact=0` · **ON** flags: `none`
- claude/project-thread-uuv1hd @ 3bd3143 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37778719661) · build v29-dev

## Verdict

**MOVED: 254 of 276 pairs changed (median first part 177 s); 8 of 34 counters under p 0.05 (about 1.7 by chance), 6 under 0.0015; casualties +13.6% (p 0)**

- Clears the Bonferroni line (p < 0.0015): casualties 6135 to 6970 (+13.6%, p 0); usKills 2793 to 3382 (+21.1%, p 0); movementResolver.changes 454576 to 499481 (+9.9%, p 0); stallOutcomes.wakes 90 to 19 (-78.9%, p 0); fire.hits 4979 to 5728 (+15.0%, p 0.0009); loopAlerts.length 154 to 225 (+46.1%, p 0.001).
- Under 0.05 only: recon.contacts 697 to 801 (+14.9%, p 0.0077); vacantObjectiveStalls.length 38 to 59 (+55.3%, p 0.03).

## Paired comparison (off against on)

- **276** pairs (unpaired: off 0, on 0) · identical in every field: **22** · runtime errors off 0 / on 0 · wall time on/off x0.987 (gate 1.25)
- the 209 changed records first part at simulated second: min 119.1, p10 141, median 177, p90 229.05, max 535.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 6135 | 6970 | 3.0254 | 195 | 132 | 63 | 0 |
| `usKills` | 2793 | 3382 | 2.1341 | 190 | 125 | 65 | 0 |
| `geKills` | 3342 | 3588 | 0.8913 | 187 | 107 | 80 | 0.057 |
| `fire.total` | 14958 | 16881 | 6.9674 | 198 | 109 | 89 | 0.1768 |
| `fire.hits` | 4979 | 5728 | 2.7138 | 195 | 121 | 74 | 0.0009 |
| `retreatSamples` | 78707 | 87404 | 31.5109 | 190 | 107 | 83 | 0.0949 |
| `movementResolver.changes` | 454576 | 499481 | 162.6993 | 209 | 173 | 36 | 0 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 38 | 59 | 0.0761 | 55 | 36 | 19 | 0.03 |
| `loopAlerts.length` | 154 | 225 | 0.2572 | 109 | 72 | 37 | 0.001 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 513 | 570 | 0.2065 | 122 | 55 | 67 | 0.3193 |
| `stallOutcomes.wakes` | 90 | 19 | -0.2572 | 64 | 7 | 57 | 0 |
| `stallOutcomes.repeats` | 10 | 4 | -0.0217 | 11 | 4 | 7 | 0.5488 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 11985 | 12381 | 1.4348 | 185 | 95 | 90 | 0.7688 |
| `recon.contacts` | 697 | 801 | 0.3768 | 145 | 89 | 56 | 0.0077 |
| `recon.noContact` | 4837 | 4892 | 0.1993 | 117 | 51 | 66 | 0.1953 |
| `recon.timeouts` | 4038 | 4065 | 0.0978 | 157 | 81 | 76 | 0.7497 |
| `recon.cancelled` | 2027 | 2200 | 0.6268 | 173 | 99 | 74 | 0.0677 |
| `recon.reportsDelivered` | 2985 | 3517 | 1.9275 | 160 | 91 | 69 | 0.0966 |
| `recon.retriggerBlocked` | 4932 | 4973 | 0.1486 | 159 | 76 | 83 | 0.6343 |
| `squadPerformance.meanOverall` | 24405.700000000004 | 24371.099999999988 | -0.1254 | 200 | 94 | 106 | 0.4368 |
| `squadPerformance.p10Overall` | 22690.19999999996 | 22654.399999999976 | -0.1297 | 159 | 80 | 79 | 1 |
| `squadPerformance.lowScoreSquads` | 1 | 0 | -0.0036 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanMission` | 21699.599999999988 | 21731.999999999978 | 0.1174 | 192 | 100 | 92 | 0.6135 |
| `squadPerformance.meanMovement` | 27432.100000000017 | 27429.9 | -0.008 | 169 | 82 | 87 | 0.7584 |
| `squadPerformance.meanControl` | 27444.499999999993 | 27426.199999999986 | -0.0663 | 173 | 82 | 91 | 0.5432 |
| `squadPerformance.meanCohesion` | 23263.89999999999 | 23055.1 | -0.7565 | 202 | 92 | 110 | 0.2316 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0014 119.1 s (timeline) · control-0016 126 s (timeline) · control-0020 138 s (timeline) · control-0041 140.1 s (timeline) · control-0024 141 s (timeline) · control-0053 141 s (timeline) · control-0004 142.05 s (timeline) · control-0044 142.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=421&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=421`); it opens the seed that parts earliest, and the dropdowns choose another.

