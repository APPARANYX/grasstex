# Benchmark run #372 · 60 seeds from `hill` (meeting), windows `every120`

- **OFF** flags: `fireLineContact=0` · **ON** flags: `none`
- claude/project-thread-uuv1hd @ 0166b50 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37715880818) · build v29-dev

## Verdict

**MOVED: 244 of 281 pairs changed (median first part 226.05 s); 7 of 32 counters under p 0.05 (about 1.6 by chance), 4 under 0.0016; casualties +8.3% (p 0)**

- Clears the Bonferroni line (p < 0.0016): casualties 7336 to 7942 (+8.3%, p 0); geKills 3858 to 4502 (+16.7%, p 0); movementResolver.changes 603522 to 633898 (+5.0%, p 0); fire.hits 6350 to 7035 (+10.8%, p 0.0003).
- Under 0.05 only: stallOutcomes.wakes 51 to 25 (-51.0%, p 0.0045); stallOutcomes.repeats 25 to 8 (-68.0%, p 0.0059); recon.timeouts 213 to 185 (-13.1%, p 0.0238).
- Unpaired records: off 2, on 2 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **281** pairs (unpaired: off 2, on 2) · identical in every field: **37** · runtime errors off 0 / on 0 · wall time on/off x1.042 (gate 1.25)
- the 183 changed records first part at simulated second: min 166.05, p10 183, median 226.05, p90 279, max 501

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 7336 | 7942 | 2.1566 | 167 | 117 | 50 | 0 |
| `usKills` | 3478 | 3440 | -0.1352 | 157 | 77 | 80 | 0.8732 |
| `geKills` | 3858 | 4502 | 2.2918 | 168 | 114 | 54 | 0 |
| `fire.total` | 18365 | 19718 | 4.8149 | 168 | 93 | 75 | 0.1895 |
| `fire.hits` | 6350 | 7035 | 2.4377 | 160 | 103 | 57 | 0.0003 |
| `retreatSamples` | 86784 | 91072 | 15.2598 | 171 | 98 | 73 | 0.0661 |
| `movementResolver.changes` | 603522 | 633898 | 108.0996 | 183 | 145 | 38 | 0 |
| `movementStalls.length` | 36 | 37 | 0.0036 | 10 | 4 | 6 | 0.7539 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 282 | 269 | -0.0463 | 104 | 50 | 54 | 0.7688 |
| `loopAlerts.length` | 214 | 246 | 0.1139 | 98 | 53 | 45 | 0.4797 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 543 | 581 | 0.1352 | 103 | 54 | 49 | 0.6937 |
| `stallOutcomes.wakes` | 51 | 25 | -0.0925 | 46 | 13 | 33 | 0.0045 |
| `stallOutcomes.repeats` | 25 | 8 | -0.0605 | 27 | 6 | 21 | 0.0059 |
| `timeline.stalledOnsets` | 132 | 125 | -0.0249 | 18 | 7 | 11 | 0.4807 |
| `timeline.stalledSamples` | 6730 | 6501 | -0.8149 | 19 | 7 | 12 | 0.3593 |
| `recon.orders` | 6335 | 6432 | 0.3452 | 134 | 74 | 60 | 0.2614 |
| `recon.contacts` | 234 | 266 | 0.1139 | 83 | 49 | 34 | 0.1239 |
| `recon.noContact` | 4316 | 4381 | 0.2313 | 110 | 65 | 45 | 0.0696 |
| `recon.timeouts` | 213 | 185 | -0.0996 | 79 | 29 | 50 | 0.0238 |
| `recon.cancelled` | 1392 | 1402 | 0.0356 | 122 | 64 | 58 | 0.651 |
| `recon.reportsDelivered` | 1138 | 1256 | 0.4199 | 82 | 46 | 36 | 0.3203 |
| `recon.retriggerBlocked` | 4902 | 4962 | 0.2135 | 122 | 63 | 59 | 0.7861 |
| `squadPerformance.meanOverall` | 24349.79999999999 | 24456.299999999996 | 0.379 | 169 | 86 | 83 | 0.8778 |
| `squadPerformance.p10Overall` | 22948.49999999998 | 23022.099999999984 | 0.2619 | 132 | 65 | 67 | 0.9307 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 20383.699999999993 | 20470.200000000008 | 0.3078 | 169 | 80 | 89 | 0.5384 |
| `squadPerformance.meanMovement` | 27658.799999999985 | 27788.799999999985 | 0.4626 | 159 | 92 | 67 | 0.0567 |
| `squadPerformance.meanControl` | 27700.2 | 27809.600000000017 | 0.3893 | 153 | 82 | 71 | 0.4189 |
| `squadPerformance.meanCohesion` | 24644.800000000017 | 24755.100000000006 | 0.3925 | 172 | 90 | 82 | 0.5936 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hill-0060 166.05 s (stress) · hill-0002 170.1 s (timeline) · hill-0055 177 s (timeline) · hill-0011 178.05 s (timeline) · hill-0024 178.05 s (timeline) · hill-0046 183 s (timeline) · hill-0040 185.1 s (timeline) · hill-0026 187.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=372&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=372`); it opens the seed that parts earliest, and the dropdowns choose another.

