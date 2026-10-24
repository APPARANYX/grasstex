# Benchmark run #1298 · 100 seeds from `first-20261024-g` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&firstSupporter=1`
- work/first-supporter-20261024 @ 32455eb · [run](https://github.com/APPARANYX/grasstex/actions/runs/40061906799) · build v29-dev

## Verdict

**WEAK: 94 of 100 pairs changed (median first part 210 s); 3 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.1% (p 0.8013)**

- Under 0.05 only: recon.contacts 178 to 211 (+18.5%, p 0.0019); recon.reportsDelivered 733 to 877 (+19.6%, p 0.0026); squadPerformance.p10Overall 7842.100000000003 to 7832.900000000006 (-0.1%, p 0.0436).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **6** · runtime errors off 0 / on 0 · wall time on/off x0.976 (gate 1.25)
- the 71 changed records first part at simulated second: min 97.05, p10 134.1, median 210, p90 353.1, max 553.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4256 | 4260 | 0.04 | 63 | 30 | 33 | 0.8013 |
| `usKills` | 2033 | 2027 | -0.06 | 61 | 28 | 33 | 0.6089 |
| `geKills` | 2223 | 2233 | 0.1 | 60 | 29 | 31 | 0.8974 |
| `fire.total` | 20427 | 19796 | -6.31 | 69 | 26 | 43 | 0.0533 |
| `fire.hits` | 7724 | 7672 | -0.52 | 64 | 31 | 33 | 0.9007 |
| `retreatSamples` | 137422 | 135702 | -17.2 | 69 | 33 | 36 | 0.8099 |
| `movementResolver.changes` | 208277 | 208023 | -2.54 | 70 | 35 | 35 | 1 |
| `grenades.throws` | 9 | 9 | 0 | 4 | 2 | 2 | 1 |
| `grenades.bursts` | 9 | 9 | 0 | 4 | 2 | 2 | 1 |
| `grenades.wounded` | 8 | 6 | -0.02 | 2 | 0 | 2 | 0.5 |
| `grenades.casualties` | 4 | 3 | -0.01 | 1 | 0 | 1 | 1 |
| `grenades.suppressed` | 13 | 12 | -0.01 | 3 | 1 | 2 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 176 | 194 | 0.18 | 47 | 28 | 19 | 0.243 |
| `loopAlerts.length` | 449 | 423 | -0.26 | 59 | 27 | 32 | 0.6029 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 366 | 334 | -0.32 | 52 | 23 | 29 | 0.4885 |
| `stallOutcomes.wakes` | 3 | 2 | -0.01 | 3 | 1 | 2 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1904 | 1923 | 0.19 | 60 | 34 | 26 | 0.3663 |
| `recon.contacts` | 178 | 211 | 0.33 | 43 | 32 | 11 | 0.0019 |
| `recon.noContact` | 1108 | 1095 | -0.13 | 54 | 26 | 28 | 0.8919 |
| `recon.timeouts` | 97 | 89 | -0.08 | 26 | 11 | 15 | 0.5572 |
| `recon.cancelled` | 414 | 411 | -0.03 | 52 | 25 | 27 | 0.8899 |
| `recon.reportsDelivered` | 733 | 877 | 1.44 | 50 | 36 | 14 | 0.0026 |
| `recon.retriggerBlocked` | 1142 | 1132 | -0.1 | 52 | 25 | 27 | 0.8899 |
| `squadPerformance.meanOverall` | 8580.599999999999 | 8594.899999999998 | 0.143 | 65 | 34 | 31 | 0.8043 |
| `squadPerformance.p10Overall` | 7842.100000000003 | 7832.900000000006 | -0.092 | 42 | 14 | 28 | 0.0436 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7566.4999999999945 | 7610.899999999994 | 0.444 | 63 | 34 | 29 | 0.6147 |
| `squadPerformance.meanMovement` | 9989.099999999991 | 9988.79999999999 | -0.003 | 26 | 14 | 12 | 0.845 |
| `squadPerformance.meanControl` | 9720.9 | 9725.199999999999 | 0.043 | 62 | 34 | 28 | 0.5258 |
| `squadPerformance.meanCohesion` | 8827.300000000003 | 8820.200000000006 | -0.071 | 67 | 33 | 34 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

first-20261024-g-0039 97.05 s (timeline) · first-20261024-g-0022 116.1 s (timeline) · first-20261024-g-0073 119.1 s (timeline) · first-20261024-g-0037 122.1 s (timeline) · first-20261024-g-0033 123 s (timeline) · first-20261024-g-0049 126 s (timeline) · first-20261024-g-0017 129 s (timeline) · first-20261024-g-0006 134.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1298&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/first-supporter-20261024/ai_flow_live.html?bench=1298&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1298`); it opens the seed that parts earliest, and the dropdowns choose another.

