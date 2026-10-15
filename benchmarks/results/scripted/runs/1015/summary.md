# Benchmark run #1015 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1`
- work/recon-ambush-causality-20261015 @ e481234 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38722505056) · build v29-dev

## Verdict

**MOVED: 21 of 21 pairs changed (median first part 162 s); 4 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties -7.2% (p 0.6476)**

- Clears the Bonferroni line (p < 0.0012): recon.cancelled 94 to 42 (-55.3%, p 0).
- Under 0.05 only: recon.orders 375 to 342 (-8.8%, p 0.0026); recon.retriggerBlocked 179 to 203 (+13.4%, p 0.0215); usKills 332 to 182 (-45.2%, p 0.0309).
- Unpaired records: off 4, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **21** pairs (unpaired: off 4, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.134 (gate 1.25)
- the 21 changed records first part at simulated second: min 83.1, p10 83.1, median 162, p90 166.05, max 166.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 713 | 662 | -2.4286 | 19 | 8 | 11 | 0.6476 |
| `usKills` | 332 | 182 | -7.1429 | 18 | 4 | 14 | 0.0309 |
| `geKills` | 381 | 480 | 4.7143 | 18 | 12 | 6 | 0.2379 |
| `fire.total` | 779 | 755 | -1.1429 | 18 | 8 | 10 | 0.8145 |
| `fire.hits` | 324 | 259 | -3.0952 | 17 | 6 | 11 | 0.3323 |
| `retreatSamples` | 4667 | 4192 | -22.619 | 21 | 9 | 12 | 0.6636 |
| `movementResolver.changes` | 38208 | 38516 | 14.6667 | 21 | 12 | 9 | 0.6636 |
| `grenades.throws` | 0 | 3 | 0.1429 | 1 | 1 | 0 | 1 |
| `grenades.bursts` | 0 | 3 | 0.1429 | 1 | 1 | 0 | 1 |
| `grenades.wounded` | 0 | 14 | 0.6667 | 1 | 1 | 0 | 1 |
| `grenades.casualties` | 0 | 5 | 0.2381 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 0 | 18 | 0.8571 | 1 | 1 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 5 | 12 | 0.3333 | 8 | 7 | 1 | 0.0703 |
| `loopAlerts.length` | 64 | 67 | 0.1429 | 15 | 8 | 7 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 26 | 70 | 2.0952 | 19 | 13 | 6 | 0.1671 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 375 | 342 | -1.5714 | 20 | 3 | 17 | 0.0026 |
| `recon.contacts` | 53 | 45 | -0.381 | 9 | 2 | 7 | 0.1797 |
| `recon.noContact` | 196 | 213 | 0.8095 | 13 | 7 | 6 | 1 |
| `recon.timeouts` | 17 | 24 | 0.3333 | 5 | 4 | 1 | 0.375 |
| `recon.cancelled` | 94 | 42 | -2.4762 | 17 | 0 | 17 | 0 |
| `recon.reportsDelivered` | 267 | 236 | -1.4762 | 16 | 6 | 10 | 0.4545 |
| `recon.retriggerBlocked` | 179 | 203 | 1.1429 | 10 | 9 | 1 | 0.0215 |
| `squadPerformance.meanOverall` | 1825.9 | 1836.6999999999998 | 0.5143 | 21 | 13 | 8 | 0.3833 |
| `squadPerformance.p10Overall` | 1662.7 | 1673.7999999999997 | 0.5286 | 15 | 8 | 7 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1554.5999999999997 | 1571 | 0.781 | 21 | 14 | 7 | 0.1892 |
| `squadPerformance.meanMovement` | 2089.6000000000004 | 2086.6 | -0.1429 | 16 | 7 | 9 | 0.8036 |
| `squadPerformance.meanControl` | 2070 | 2063.0000000000005 | -0.3333 | 21 | 9 | 12 | 0.6636 |
| `squadPerformance.meanCohesion` | 1799.8 | 1807.5000000000002 | 0.3667 | 21 | 9 | 12 | 0.6636 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0001 162 s (timeline) · phase-c-natural-20261012-0003 166.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1015&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/recon-ambush-causality-20261015/ai_flow_live.html?bench=1015&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1015`); it opens the seed that parts earliest, and the dropdowns choose another.

