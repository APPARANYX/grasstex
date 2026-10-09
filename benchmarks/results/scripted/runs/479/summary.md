# Benchmark run #479 · 60 seeds from `exec361p` (meeting), windows `contact+600`

- **OFF** flags: `reconBudget=0` · **ON** flags: `none`
- claude/recon-derived-timeout @ 268e090 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37873302240) · build v29-dev

## Verdict

**MOVED: 56 of 60 pairs changed (median first part 350.55 s); 3 of 34 counters under p 0.05 (about 1.7 by chance), 2 under 0.0015; casualties +0.6% (p 1)**

- Clears the Bonferroni line (p < 0.0015): recon.timeouts 77 to 20 (-74.0%, p 0); recon.noContact 1078 to 1141 (+5.8%, p 0.0002).
- Under 0.05 only: squadPerformance.meanCohesion 5350.499999999998 to 5334.499999999999 (-0.3%, p 0.0294).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **4** · runtime errors off 0 / on 0 · wall time on/off x1 (gate 1.25)
- the 44 changed records first part at simulated second: min 29.1, p10 29.1, median 350.55, p90 529.05, max 567

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3051 | 3068 | 0.2833 | 29 | 14 | 15 | 1 |
| `usKills` | 1361 | 1393 | 0.5333 | 26 | 15 | 11 | 0.5572 |
| `geKills` | 1690 | 1675 | -0.25 | 27 | 16 | 11 | 0.4421 |
| `fire.total` | 20180 | 20586 | 6.7667 | 30 | 15 | 15 | 1 |
| `fire.hits` | 7104 | 7187 | 1.3833 | 28 | 16 | 12 | 0.5716 |
| `retreatSamples` | 91047 | 90354 | -11.55 | 30 | 15 | 15 | 1 |
| `movementResolver.changes` | 195299 | 194197 | -18.3667 | 39 | 15 | 24 | 0.1996 |
| `movementStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 297 | 299 | 0.0333 | 25 | 15 | 10 | 0.4244 |
| `loopAlerts.length` | 250 | 236 | -0.2333 | 25 | 11 | 14 | 0.69 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 227 | 205 | -0.3667 | 19 | 7 | 12 | 0.3593 |
| `stallOutcomes.wakes` | 12 | 10 | -0.0333 | 4 | 2 | 2 | 1 |
| `stallOutcomes.repeats` | 3 | 2 | -0.0167 | 3 | 1 | 2 | 1 |
| `timeline.stalledOnsets` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 110 | 110 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 110 | 110 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1921 | 1954 | 0.55 | 29 | 14 | 15 | 1 |
| `recon.contacts` | 106 | 123 | 0.2833 | 19 | 14 | 5 | 0.0636 |
| `recon.noContact` | 1078 | 1141 | 1.05 | 31 | 26 | 5 | 0.0002 |
| `recon.timeouts` | 77 | 20 | -0.95 | 38 | 1 | 37 | 0 |
| `recon.cancelled` | 573 | 572 | -0.0167 | 23 | 11 | 12 | 1 |
| `recon.reportsDelivered` | 522 | 571 | 0.8167 | 17 | 12 | 5 | 0.1435 |
| `recon.retriggerBlocked` | 1461 | 1484 | 0.3833 | 30 | 14 | 16 | 0.8555 |
| `squadPerformance.meanOverall` | 4888.199999999998 | 4893.999999999999 | 0.0967 | 31 | 18 | 13 | 0.4731 |
| `squadPerformance.p10Overall` | 4508.3 | 4506.999999999999 | -0.0217 | 19 | 10 | 9 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3909 | 3929.4999999999995 | 0.3417 | 27 | 16 | 11 | 0.4421 |
| `squadPerformance.meanMovement` | 5937.9 | 5941.8 | 0.065 | 25 | 17 | 8 | 0.1078 |
| `squadPerformance.meanControl` | 5765.900000000002 | 5769.900000000001 | 0.0667 | 29 | 15 | 14 | 1 |
| `squadPerformance.meanCohesion` | 5350.499999999998 | 5334.499999999999 | -0.2667 | 31 | 9 | 22 | 0.0294 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

exec361p-0001 29.1 s (timeline) · exec361p-0017 29.1 s (timeline) · exec361p-0021 29.1 s (timeline) · exec361p-0031 29.1 s (timeline) · exec361p-0037 29.1 s (timeline) · exec361p-0041 29.1 s (timeline) · exec361p-0056 29.1 s (timeline) · exec361p-0014 167.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=479&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=479`); it opens the seed that parts earliest, and the dropdowns choose another.

