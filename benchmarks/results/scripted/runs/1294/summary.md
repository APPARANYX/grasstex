# Benchmark run #1294 · 100 seeds from `first-20261024-u` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&firstSupporter=1`
- work/first-supporter-20261024 @ 32455eb · [run](https://github.com/APPARANYX/grasstex/actions/runs/40061904956) · build v29-dev

## Verdict

**WEAK: 95 of 100 pairs changed (median first part 210 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.6% (p 0.3317)**

- Under 0.05 only: recon.cancelled 451 to 501 (+11.1%, p 0.04).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **5** · runtime errors off 0 / on 0 · wall time on/off x1.002 (gate 1.25)
- the 63 changed records first part at simulated second: min 111, p10 141, median 210, p90 416.1, max 586.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4619 | 4590 | -0.29 | 52 | 22 | 30 | 0.3317 |
| `usKills` | 2125 | 2078 | -0.47 | 49 | 18 | 31 | 0.0854 |
| `geKills` | 2494 | 2512 | 0.18 | 49 | 25 | 24 | 1 |
| `fire.total` | 21890 | 21251 | -6.39 | 53 | 19 | 34 | 0.0534 |
| `fire.hits` | 8426 | 8312 | -1.14 | 52 | 19 | 33 | 0.0704 |
| `retreatSamples` | 157170 | 154856 | -23.14 | 53 | 22 | 31 | 0.2717 |
| `movementResolver.changes` | 226048 | 229152 | 31.04 | 60 | 32 | 28 | 0.6989 |
| `grenades.throws` | 27 | 33 | 0.06 | 6 | 4 | 2 | 0.6875 |
| `grenades.bursts` | 27 | 33 | 0.06 | 6 | 4 | 2 | 0.6875 |
| `grenades.wounded` | 6 | 10 | 0.04 | 3 | 2 | 1 | 1 |
| `grenades.casualties` | 3 | 4 | 0.01 | 3 | 2 | 1 | 1 |
| `grenades.suppressed` | 11 | 32 | 0.21 | 5 | 4 | 1 | 0.375 |
| `grenades.friendlyWounded` | 2 | 3 | 0.01 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 1 | 0.01 | 1 | 1 | 0 | 1 |
| `grenades.aborted` | 1 | 3 | 0.02 | 2 | 2 | 0 | 0.5 |
| `movementStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 239 | 251 | 0.12 | 35 | 19 | 16 | 0.7359 |
| `loopAlerts.length` | 554 | 562 | 0.08 | 49 | 25 | 24 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 388 | 403 | 0.15 | 42 | 21 | 21 | 1 |
| `stallOutcomes.wakes` | 6 | 8 | 0.02 | 4 | 3 | 1 | 0.625 |
| `stallOutcomes.repeats` | 3 | 0 | -0.03 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1961 | 2041 | 0.8 | 50 | 28 | 22 | 0.4799 |
| `recon.contacts` | 171 | 188 | 0.17 | 32 | 19 | 13 | 0.3771 |
| `recon.noContact` | 1106 | 1119 | 0.13 | 45 | 24 | 21 | 0.766 |
| `recon.timeouts` | 110 | 102 | -0.08 | 28 | 12 | 16 | 0.5716 |
| `recon.cancelled` | 451 | 501 | 0.5 | 47 | 31 | 16 | 0.04 |
| `recon.reportsDelivered` | 689 | 760 | 0.71 | 37 | 22 | 15 | 0.324 |
| `recon.retriggerBlocked` | 1181 | 1214 | 0.33 | 44 | 23 | 21 | 0.8804 |
| `squadPerformance.meanOverall` | 8476.600000000004 | 8478.900000000007 | 0.023 | 54 | 31 | 23 | 0.3409 |
| `squadPerformance.p10Overall` | 7733.199999999999 | 7724.499999999999 | -0.087 | 27 | 14 | 13 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7339.5999999999985 | 7352.100000000001 | 0.125 | 52 | 31 | 21 | 0.2116 |
| `squadPerformance.meanMovement` | 9985.599999999993 | 9984.699999999992 | -0.009 | 27 | 10 | 17 | 0.2478 |
| `squadPerformance.meanControl` | 9672.299999999997 | 9669.500000000004 | -0.028 | 54 | 25 | 29 | 0.6835 |
| `squadPerformance.meanCohesion` | 8966.999999999995 | 8956.399999999998 | -0.106 | 55 | 25 | 30 | 0.5901 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

first-20261024-u-0006 111 s (timeline) · first-20261024-u-0056 111 s (timeline) · first-20261024-u-0068 115.05 s (timeline) · first-20261024-u-0047 124.05 s (timeline) · first-20261024-u-0046 128.1 s (timeline) · first-20261024-u-0078 135 s (timeline) · first-20261024-u-0082 141 s (timeline) · first-20261024-u-0084 143.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1294&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/first-supporter-20261024/ai_flow_live.html?bench=1294&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1294`); it opens the seed that parts earliest, and the dropdowns choose another.

