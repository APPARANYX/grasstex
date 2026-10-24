# Benchmark run #1303 · 100 seeds from `point-20261024-b` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&suppressPoint=0` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1`
- work/suppressor-lock-20261024 @ 754b42f · [run](https://github.com/APPARANYX/grasstex/actions/runs/40106174854) · build v29-dev

## Verdict

**WEAK: 97 of 100 pairs changed (median first part 150.525 s); 2 of 42 counters under p 0.05 (about 2.1 by chance); casualties -2.5% (p 0.6609)**

- Under 0.05 only: fire.total 34482 to 38982 (+13.1%, p 0.0314); retreatSamples 190469 to 200357 (+5.2%, p 0.0422).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x1.011 (gate 1.25)
- the 88 changed records first part at simulated second: min 88.05, p10 104.1, median 150.525, p90 195, max 279

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4471 | 4357 | -1.14 | 83 | 39 | 44 | 0.6609 |
| `usKills` | 2220 | 2193 | -0.27 | 84 | 40 | 44 | 0.7436 |
| `geKills` | 2251 | 2164 | -0.87 | 84 | 42 | 42 | 1 |
| `fire.total` | 34482 | 38982 | 45 | 87 | 54 | 33 | 0.0314 |
| `fire.hits` | 8205 | 8155 | -0.5 | 86 | 44 | 42 | 0.9142 |
| `retreatSamples` | 190469 | 200357 | 98.88 | 88 | 54 | 34 | 0.0422 |
| `movementResolver.changes` | 227289 | 227698 | 4.09 | 88 | 47 | 41 | 0.5943 |
| `grenades.throws` | 9 | 10 | 0.01 | 7 | 3 | 4 | 1 |
| `grenades.bursts` | 9 | 10 | 0.01 | 7 | 3 | 4 | 1 |
| `grenades.wounded` | 6 | 3 | -0.03 | 4 | 1 | 3 | 0.625 |
| `grenades.casualties` | 3 | 1 | -0.02 | 2 | 0 | 2 | 0.5 |
| `grenades.suppressed` | 10 | 16 | 0.06 | 6 | 4 | 2 | 0.6875 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 240 | 225 | -0.15 | 65 | 30 | 35 | 0.6201 |
| `loopAlerts.length` | 619 | 640 | 0.21 | 80 | 44 | 36 | 0.434 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 348 | 364 | 0.16 | 72 | 37 | 35 | 0.9063 |
| `stallOutcomes.wakes` | 4 | 5 | 0.01 | 8 | 4 | 4 | 1 |
| `stallOutcomes.repeats` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1976 | 1912 | -0.64 | 84 | 34 | 50 | 0.1011 |
| `recon.contacts` | 180 | 182 | 0.02 | 66 | 32 | 34 | 0.9022 |
| `recon.noContact` | 1139 | 1089 | -0.5 | 75 | 29 | 46 | 0.0639 |
| `recon.timeouts` | 118 | 97 | -0.21 | 60 | 25 | 35 | 0.2451 |
| `recon.cancelled` | 411 | 435 | 0.24 | 74 | 38 | 36 | 0.9076 |
| `recon.reportsDelivered` | 698 | 755 | 0.57 | 76 | 41 | 35 | 0.5666 |
| `recon.retriggerBlocked` | 1213 | 1139 | -0.74 | 76 | 35 | 41 | 0.5666 |
| `squadPerformance.meanOverall` | 8406.3 | 8383.199999999999 | -0.231 | 83 | 39 | 44 | 0.6609 |
| `squadPerformance.p10Overall` | 7719.600000000001 | 7678.400000000004 | -0.412 | 45 | 17 | 28 | 0.1352 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7072.8 | 6974.699999999998 | -0.981 | 88 | 38 | 50 | 0.2408 |
| `squadPerformance.meanMovement` | 9987.19999999999 | 9986.89999999999 | -0.003 | 41 | 19 | 22 | 0.7552 |
| `squadPerformance.meanControl` | 9692.9 | 9698.4 | 0.055 | 84 | 41 | 43 | 0.9132 |
| `squadPerformance.meanCohesion` | 9029.7 | 9089.200000000004 | 0.595 | 88 | 52 | 36 | 0.1093 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

point-20261024-b-0064 88.05 s (stress) · point-20261024-b-0007 95.1 s (timeline) · point-20261024-b-0003 97.05 s (timeline) · point-20261024-b-0009 100.05 s (stress) · point-20261024-b-0054 100.05 s (timeline) · point-20261024-b-0085 100.05 s (timeline) · point-20261024-b-0013 104.1 s (timeline) · point-20261024-b-0049 104.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1303&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/suppressor-lock-20261024/ai_flow_live.html?bench=1303&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1303`); it opens the seed that parts earliest, and the dropdowns choose another.

