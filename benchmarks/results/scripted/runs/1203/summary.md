# Benchmark run #1203 · 100 seeds from `reactive-mechanism-20261021` (meeting), windows `0+600`

- **OFF** flags: `localPlan=1&localResources=1&localAmbush=1&localManeuver=1&coveredBounds=1` · **ON** flags: `localPlan=1&localResources=1&localAmbush=1&localManeuver=1&coveredBounds=1&reactiveFireManeuver=1`
- work/reactive-fire-maneuver-20261021 @ 9d2da7e · [run](https://github.com/APPARANYX/grasstex/actions/runs/39685434082) · build v29-dev

## Verdict

**WEAK: 100 of 100 pairs changed (median first part 382.05 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.1% (p 0.3075)**

- Under 0.05 only: squadPerformance.meanMission 7172.000000000001 to 7231.4 (+0.8%, p 0.0072).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.008 (gate 1.25)
- the 27 changed records first part at simulated second: min 242.1, p10 287.1, median 382.05, p90 574.05, max 588

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3294 | 3291 | -0.03 | 24 | 15 | 9 | 0.3075 |
| `usKills` | 1634 | 1612 | -0.22 | 20 | 12 | 8 | 0.5034 |
| `geKills` | 1660 | 1679 | 0.19 | 22 | 12 | 10 | 0.8318 |
| `fire.total` | 15357 | 15259 | -0.98 | 23 | 14 | 9 | 0.4049 |
| `fire.hits` | 6999 | 6795 | -2.04 | 23 | 11 | 12 | 1 |
| `retreatSamples` | 85695 | 84072 | -16.23 | 23 | 7 | 16 | 0.0931 |
| `movementResolver.changes` | 125497 | 126820 | 13.23 | 27 | 18 | 9 | 0.1221 |
| `grenades.throws` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 97 | 95 | -0.02 | 2 | 0 | 2 | 0.5 |
| `routeStalls.length` | 145 | 146 | 0.01 | 3 | 2 | 1 | 1 |
| `targetlessStalls.length` | 14 | 11 | -0.03 | 5 | 1 | 4 | 0.375 |
| `vacantObjectiveStalls.length` | 347 | 342 | -0.05 | 11 | 4 | 7 | 0.5488 |
| `loopAlerts.length` | 982 | 988 | 0.06 | 19 | 10 | 9 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 165 | 176 | 0.11 | 13 | 8 | 5 | 0.5811 |
| `stallOutcomes.wakes` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 116 | 116 | 0 | 4 | 2 | 2 | 1 |
| `timeline.stalledSamples` | 14884 | 14875 | -0.09 | 5 | 2 | 3 | 1 |
| `timeline.stalledOnsetsRepeated` | 116 | 116 | 0 | 4 | 2 | 2 | 1 |
| `timeline.stalledSamplesRepeated` | 14884 | 14875 | -0.09 | 5 | 2 | 3 | 1 |
| `recon.orders` | 1803 | 1811 | 0.08 | 17 | 10 | 7 | 0.6291 |
| `recon.contacts` | 130 | 123 | -0.07 | 10 | 4 | 6 | 0.7539 |
| `recon.noContact` | 377 | 381 | 0.04 | 11 | 5 | 6 | 1 |
| `recon.timeouts` | 544 | 542 | -0.02 | 10 | 4 | 6 | 0.7539 |
| `recon.cancelled` | 647 | 658 | 0.11 | 13 | 9 | 4 | 0.2668 |
| `recon.reportsDelivered` | 608 | 577 | -0.31 | 9 | 4 | 5 | 1 |
| `recon.retriggerBlocked` | 938 | 947 | 0.09 | 14 | 9 | 5 | 0.424 |
| `squadPerformance.meanOverall` | 8560.5 | 8575.900000000001 | 0.154 | 24 | 15 | 9 | 0.3075 |
| `squadPerformance.p10Overall` | 7499.5 | 7504.300000000001 | 0.048 | 14 | 7 | 7 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7172.000000000001 | 7231.4 | 0.594 | 21 | 17 | 4 | 0.0072 |
| `squadPerformance.meanMovement` | 9760.300000000001 | 9756.1 | -0.042 | 19 | 7 | 12 | 0.3593 |
| `squadPerformance.meanControl` | 9500.899999999996 | 9484.599999999997 | -0.163 | 23 | 10 | 13 | 0.6776 |
| `squadPerformance.meanCohesion` | 9677.4 | 9667 | -0.104 | 20 | 6 | 14 | 0.1153 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

reactive-mechanism-20261021-0002 242.1 s (timeline) · reactive-mechanism-20261021-0059 245.1 s (timeline) · reactive-mechanism-20261021-0092 287.1 s (timeline) · reactive-mechanism-20261021-0058 294 s (timeline) · reactive-mechanism-20261021-0009 296.1 s (timeline) · reactive-mechanism-20261021-0088 309 s (timeline) · reactive-mechanism-20261021-0046 315.15 s (timeline) · reactive-mechanism-20261021-0087 316.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1203&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/reactive-fire-maneuver-20261021/ai_flow_live.html?bench=1203&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1203`); it opens the seed that parts earliest, and the dropdowns choose another.

