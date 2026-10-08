# Benchmark run #398 · 60 seeds from `relayfresh` (meeting), windows `every120`

- **OFF** flags: `squadRelay=0` · **ON** flags: `none`
- claude/squad-relay @ 768c593 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37766523117) · build v29-dev

## Verdict

**MOVED: 283 of 290 pairs changed (median first part 57 s); 7 of 34 counters under p 0.05 (about 1.7 by chance), 1 under 0.0015; casualties +1.0% (p 1)**

- Clears the Bonferroni line (p < 0.0015): regroups.entries 546 to 437 (-20.0%, p 0.0005).
- Under 0.05 only: squadPerformance.meanOverall 25133 to 25223.20000000002 (+0.4%, p 0.0017); retreatSamples 102858 to 89124 (-13.4%, p 0.0066); stallOutcomes.wakes 79 to 107 (+35.4%, p 0.0105); squadPerformance.meanMission 20807.300000000003 to 21078.799999999996 (+1.3%, p 0.0105); usKills 3569 to 3961 (+11.0%, p 0.0213); recon.noContact 4468 to 4572 (+2.3%, p 0.0215).
- Unpaired records: off 1, on 5 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **290** pairs (unpaired: off 1, on 5) · identical in every field: **7** · runtime errors off 0 / on 0 · wall time on/off x0.995 (gate 1.25)
- the 255 changed records first part at simulated second: min 22.05, p10 23.1, median 57, p90 230.1, max 410.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 8018 | 8098 | 0.2759 | 183 | 92 | 91 | 1 |
| `usKills` | 3569 | 3961 | 1.3517 | 182 | 107 | 75 | 0.0213 |
| `geKills` | 4449 | 4137 | -1.0759 | 187 | 83 | 104 | 0.1434 |
| `fire.total` | 19410 | 20355 | 3.2586 | 198 | 100 | 98 | 0.9434 |
| `fire.hits` | 6895 | 7009 | 0.3931 | 192 | 99 | 93 | 0.7183 |
| `retreatSamples` | 102858 | 89124 | -47.3586 | 197 | 79 | 118 | 0.0066 |
| `movementResolver.changes` | 622991 | 631654 | 29.8724 | 231 | 127 | 104 | 0.1476 |
| `movementStalls.length` | 12 | 13 | 0.0034 | 4 | 2 | 2 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 282 | 258 | -0.0828 | 111 | 53 | 58 | 0.7044 |
| `loopAlerts.length` | 224 | 223 | -0.0034 | 127 | 63 | 64 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 546 | 437 | -0.3759 | 128 | 44 | 84 | 0.0005 |
| `stallOutcomes.wakes` | 79 | 107 | 0.0966 | 56 | 38 | 18 | 0.0105 |
| `stallOutcomes.repeats` | 32 | 47 | 0.0517 | 38 | 23 | 15 | 0.2559 |
| `timeline.stalledOnsets` | 12 | 13 | 0.0034 | 4 | 2 | 2 | 1 |
| `timeline.stalledSamples` | 521 | 612 | 0.3138 | 8 | 3 | 5 | 0.7266 |
| `timeline.stalledOnsetsRepeated` | 37 | 50 | 0.0448 | 5 | 4 | 1 | 0.375 |
| `timeline.stalledSamplesRepeated` | 1527 | 2061 | 1.8414 | 9 | 4 | 5 | 1 |
| `recon.orders` | 6569 | 6666 | 0.3345 | 167 | 85 | 82 | 0.8771 |
| `recon.contacts` | 274 | 282 | 0.0276 | 104 | 56 | 48 | 0.4926 |
| `recon.noContact` | 4468 | 4572 | 0.3586 | 149 | 89 | 60 | 0.0215 |
| `recon.timeouts` | 171 | 154 | -0.0586 | 95 | 44 | 51 | 0.5384 |
| `recon.cancelled` | 1488 | 1481 | -0.0241 | 152 | 70 | 82 | 0.3723 |
| `recon.reportsDelivered` | 1261 | 1401 | 0.4828 | 129 | 70 | 59 | 0.3787 |
| `recon.retriggerBlocked` | 5077 | 5175 | 0.3379 | 162 | 89 | 73 | 0.2385 |
| `squadPerformance.meanOverall` | 25133 | 25223.20000000002 | 0.311 | 217 | 132 | 85 | 0.0017 |
| `squadPerformance.p10Overall` | 23643.199999999975 | 23722.09999999997 | 0.2721 | 177 | 101 | 76 | 0.0709 |
| `squadPerformance.lowScoreSquads` | 1 | 0 | -0.0034 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanMission` | 20807.300000000003 | 21078.799999999996 | 0.9362 | 199 | 118 | 81 | 0.0105 |
| `squadPerformance.meanMovement` | 28663.800000000007 | 28644.100000000006 | -0.0679 | 177 | 84 | 93 | 0.5478 |
| `squadPerformance.meanControl` | 28705.59999999999 | 28687.29999999998 | -0.0631 | 187 | 81 | 106 | 0.079 |
| `squadPerformance.meanCohesion` | 25671.900000000005 | 25638.399999999994 | -0.1155 | 221 | 104 | 117 | 0.4196 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

relayfresh-0052 22.05 s (timeline) · relayfresh-0060 22.05 s (timeline) · relayfresh-0004 23.1 s (timeline) · relayfresh-0009 23.1 s (timeline) · relayfresh-0014 23.1 s (timeline) · relayfresh-0024 23.1 s (timeline) · relayfresh-0025 23.1 s (timeline) · relayfresh-0032 23.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=398&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=398`); it opens the seed that parts earliest, and the dropdowns choose another.

