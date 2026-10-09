# Benchmark run #481 · 60 seeds from `exec361p` (ge-defend), windows `contact+600`

- **OFF** flags: `reconBudget=0` · **ON** flags: `none`
- claude/recon-derived-timeout @ 268e090 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37873307511) · build v29-dev

## Verdict

**MOVED: 53 of 53 pairs changed (median first part 33 s); 3 of 34 counters under p 0.05 (about 1.7 by chance), 3 under 0.0015; casualties +0.7% (p 0.7754)**

- Clears the Bonferroni line (p < 0.0015): recon.timeouts 485 to 130 (-73.2%, p 0); recon.noContact 549 to 612 (+11.5%, p 0.0008); recon.orders 1764 to 1491 (-15.5%, p 0.0012).

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.99 (gate 1.25)
- the 53 changed records first part at simulated second: min 29.1, p10 30, median 33, p90 39.15, max 54.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2447 | 2465 | 0.3396 | 49 | 26 | 23 | 0.7754 |
| `usKills` | 967 | 977 | 0.1887 | 49 | 24 | 25 | 1 |
| `geKills` | 1480 | 1488 | 0.1509 | 51 | 28 | 23 | 0.5758 |
| `fire.total` | 17237 | 17402 | 3.1132 | 53 | 26 | 27 | 1 |
| `fire.hits` | 5804 | 5903 | 1.8679 | 51 | 26 | 25 | 1 |
| `retreatSamples` | 94958 | 96109 | 21.717 | 53 | 30 | 23 | 0.4101 |
| `movementResolver.changes` | 131504 | 134005 | 47.1887 | 53 | 32 | 21 | 0.169 |
| `movementStalls.length` | 0 | 3 | 0.0566 | 2 | 2 | 0 | 0.5 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 36 | 49 | 0.2453 | 30 | 19 | 11 | 0.2005 |
| `loopAlerts.length` | 158 | 196 | 0.717 | 46 | 28 | 18 | 0.1839 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 182 | 178 | -0.0755 | 41 | 19 | 22 | 0.7552 |
| `stallOutcomes.wakes` | 10 | 10 | 0 | 12 | 7 | 5 | 0.7744 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 1 | 0.0189 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 3 | 0.0566 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 1 | 0.0189 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 3 | 0.0566 | 1 | 1 | 0 | 1 |
| `recon.orders` | 1764 | 1491 | -5.1509 | 52 | 14 | 38 | 0.0012 |
| `recon.contacts` | 304 | 245 | -1.1132 | 46 | 24 | 22 | 0.883 |
| `recon.noContact` | 549 | 612 | 1.1887 | 45 | 34 | 11 | 0.0008 |
| `recon.timeouts` | 485 | 130 | -6.6981 | 51 | 0 | 51 | 0 |
| `recon.cancelled` | 399 | 474 | 1.4151 | 46 | 28 | 18 | 0.1839 |
| `recon.reportsDelivered` | 1013 | 1013 | 0 | 51 | 24 | 27 | 0.7798 |
| `recon.retriggerBlocked` | 606 | 600 | -0.1132 | 45 | 19 | 26 | 0.3713 |
| `squadPerformance.meanOverall` | 4389.099999999999 | 4385.200000000001 | -0.0736 | 52 | 25 | 27 | 0.8899 |
| `squadPerformance.p10Overall` | 3970.4999999999995 | 3978.6999999999994 | 0.1547 | 33 | 17 | 16 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3576.3000000000006 | 3579.100000000001 | 0.0528 | 53 | 26 | 27 | 1 |
| `squadPerformance.meanMovement` | 5269.700000000001 | 5268.999999999999 | -0.0132 | 40 | 21 | 19 | 0.8746 |
| `squadPerformance.meanControl` | 5189.4 | 5168.200000000001 | -0.4 | 52 | 20 | 32 | 0.1263 |
| `squadPerformance.meanCohesion` | 4755.7 | 4728.600000000001 | -0.5113 | 53 | 24 | 29 | 0.5831 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

exec361p-0017 29.1 s (timeline) · exec361p-0021 29.1 s (timeline) · exec361p-0041 29.1 s (timeline) · exec361p-0056 29.1 s (timeline) · exec361p-0014 30 s (timeline) · exec361p-0025 30 s (timeline) · exec361p-0040 30 s (stress) · exec361p-0035 30.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=481&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=481`); it opens the seed that parts earliest, and the dropdowns choose another.

