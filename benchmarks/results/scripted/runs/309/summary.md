# Benchmark run #309 · 100 seeds from `phase-0e-final100` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=0&commandMovement=1&commandRelay=0`
- work/phase-0e-regroup-adoption-grace @ be88c37 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37215255873) · build v29-dev

## Verdict

**WEAK: 100 of 100 pairs changed (median first part 0.15 s); 6 of 32 counters under p 0.05 (about 1.6 by chance); casualties -3.8% (p 0.1606)**

- Under 0.05 only: movementResolver.changes 170161 to 165640 (-2.7%, p 0.0035); recon.contacts 38 to 19 (-50.0%, p 0.0076); recon.reportsDelivered 234 to 127 (-45.7%, p 0.0076); squadPerformance.meanMovement 9934.799999999994 to 9928.099999999993 (-0.1%, p 0.0097); loopAlerts.length 41 to 95 (+131.7%, p 0.0186); recon.cancelled 39 to 25 (-35.9%, p 0.0315).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.167 (gate 1.25)
- the 100 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 631 | 607 | -0.24 | 86 | 36 | 50 | 0.1606 |
| `usKills` | 266 | 237 | -0.29 | 75 | 38 | 37 | 1 |
| `geKills` | 365 | 370 | 0.05 | 75 | 35 | 40 | 0.6445 |
| `fire.total` | 6539 | 6312 | -2.27 | 96 | 40 | 56 | 0.1253 |
| `fire.hits` | 1210 | 1150 | -0.6 | 93 | 38 | 55 | 0.0966 |
| `retreatSamples` | 1113 | 1034 | -0.79 | 66 | 32 | 34 | 0.9022 |
| `movementResolver.changes` | 170161 | 165640 | -45.21 | 100 | 35 | 65 | 0.0035 |
| `movementStalls.length` | 5 | 6 | 0.01 | 5 | 3 | 2 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 2 | 0.01 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 41 | 95 | 0.54 | 47 | 32 | 15 | 0.0186 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 16 | 25 | 0.09 | 26 | 15 | 11 | 0.5572 |
| `stallOutcomes.wakes` | 7 | 6 | -0.01 | 6 | 3 | 3 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 6 | 10 | 0.04 | 7 | 4 | 3 | 1 |
| `timeline.stalledSamples` | 121 | 150 | 0.29 | 7 | 4 | 3 | 1 |
| `recon.orders` | 1398 | 1363 | -0.35 | 76 | 33 | 43 | 0.3019 |
| `recon.contacts` | 38 | 19 | -0.19 | 37 | 10 | 27 | 0.0076 |
| `recon.noContact` | 1297 | 1283 | -0.14 | 72 | 33 | 39 | 0.556 |
| `recon.timeouts` | 12 | 16 | 0.04 | 19 | 11 | 8 | 0.6476 |
| `recon.cancelled` | 39 | 25 | -0.14 | 43 | 14 | 29 | 0.0315 |
| `recon.reportsDelivered` | 234 | 127 | -1.07 | 37 | 10 | 27 | 0.0076 |
| `recon.retriggerBlocked` | 1291 | 1287 | -0.04 | 70 | 37 | 33 | 0.7202 |
| `squadPerformance.meanOverall` | 8971.900000000001 | 8993.499999999996 | 0.216 | 97 | 57 | 40 | 0.1038 |
| `squadPerformance.p10Overall` | 8568.7 | 8597.599999999997 | 0.289 | 99 | 54 | 45 | 0.4215 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8303.499999999998 | 8292.7 | -0.108 | 98 | 44 | 54 | 0.3634 |
| `squadPerformance.meanMovement` | 9934.799999999994 | 9928.099999999993 | -0.067 | 80 | 28 | 52 | 0.0097 |
| `squadPerformance.meanControl` | 9819.599999999997 | 9800.199999999997 | -0.194 | 83 | 39 | 44 | 0.6609 |
| `squadPerformance.meanCohesion` | 9367.699999999997 | 9470.900000000001 | 1.032 | 99 | 56 | 43 | 0.2276 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-final100-0001 0.15 s (timeline) · phase-0e-final100-0002 0.15 s (timeline) · phase-0e-final100-0003 0.15 s (timeline) · phase-0e-final100-0004 0.15 s (timeline) · phase-0e-final100-0005 0.15 s (timeline) · phase-0e-final100-0006 0.15 s (timeline) · phase-0e-final100-0007 0.15 s (timeline) · phase-0e-final100-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=309&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-0e-regroup-adoption-grace/ai_flow_live.html?bench=309&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=309`); it opens the seed that parts earliest, and the dropdowns choose another.

