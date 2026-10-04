# Benchmark run #289 · 100 seeds from `phase-0e` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=1&commandMovement=1&commandRelay=1`
- main @ 0ed6585 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37194471773) · build v29-dev

## Verdict

**MOVED: 100 of 100 pairs changed (median first part 0.15 s); 15 of 32 counters under p 0.05 (about 1.6 by chance), 9 under 0.0016; casualties -25.1% (p 0.0037)**

- Clears the Bonferroni line (p < 0.0016): movementResolver.changes 180969 to 156324 (-13.6%, p 0); loopAlerts.length 47 to 794 (+1589.4%, p 0); regroups.entries 476 to 1830 (+284.5%, p 0); squadPerformance.meanOverall 8954.000000000002 to 8627.9 (-3.6%, p 0); squadPerformance.p10Overall 8612.5 to 8036.700000000001 (-6.7%, p 0); squadPerformance.meanMovement 9948.699999999999 to 9858.399999999996 (-0.9%, p 0); squadPerformance.meanControl 9735.199999999995 to 9107.699999999997 (-6.4%, p 0); squadPerformance.meanCohesion 9512.200000000004 to 8366.100000000002 (-12.0%, p 0); recon.timeouts 16 to 44 (+175.0%, p 0.0003).
- Under 0.05 only: casualties 553 to 414 (-25.1%, p 0.0037); stallOutcomes.wakes 537 to 596 (+11.0%, p 0.0192); geKills 335 to 232 (-30.7%, p 0.0238); fire.hits 1027 to 820 (-20.2%, p 0.0263); fire.total 5687 to 4780 (-15.9%, p 0.0298); usKills 218 to 182 (-16.5%, p 0.0474).
- Wall time on/off x1.803 is over the 1.25 gate.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.803 (gate 1.25)
- the 100 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 553 | 414 | -1.39 | 88 | 30 | 58 | 0.0037 |
| `usKills` | 218 | 182 | -0.36 | 74 | 28 | 46 | 0.0474 |
| `geKills` | 335 | 232 | -1.03 | 79 | 29 | 50 | 0.0238 |
| `fire.total` | 5687 | 4780 | -9.07 | 94 | 36 | 58 | 0.0298 |
| `fire.hits` | 1027 | 820 | -2.07 | 90 | 34 | 56 | 0.0263 |
| `retreatSamples` | 733 | 805 | 0.72 | 61 | 30 | 31 | 1 |
| `movementResolver.changes` | 180969 | 156324 | -246.45 | 100 | 10 | 90 | 0 |
| `movementStalls.length` | 17 | 18 | 0.01 | 15 | 9 | 6 | 0.6072 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 4 | 0.03 | 5 | 4 | 1 | 0.375 |
| `loopAlerts.length` | 47 | 794 | 7.47 | 98 | 98 | 0 | 0 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 476 | 1830 | 13.54 | 100 | 100 | 0 | 0 |
| `stallOutcomes.wakes` | 537 | 596 | 0.59 | 27 | 20 | 7 | 0.0192 |
| `stallOutcomes.repeats` | 91 | 88 | -0.03 | 9 | 3 | 6 | 0.5078 |
| `timeline.stalledOnsets` | 19 | 20 | 0.01 | 16 | 9 | 7 | 0.8036 |
| `timeline.stalledSamples` | 160 | 288 | 1.28 | 17 | 10 | 7 | 0.6291 |
| `recon.orders` | 1471 | 1495 | 0.24 | 81 | 45 | 36 | 0.3742 |
| `recon.contacts` | 34 | 27 | -0.07 | 44 | 21 | 23 | 0.8804 |
| `recon.noContact` | 1363 | 1370 | 0.07 | 79 | 41 | 38 | 0.8221 |
| `recon.timeouts` | 16 | 44 | 0.28 | 30 | 25 | 5 | 0.0003 |
| `recon.cancelled` | 38 | 33 | -0.05 | 42 | 20 | 22 | 0.8776 |
| `recon.reportsDelivered` | 217 | 148 | -0.69 | 43 | 19 | 24 | 0.5424 |
| `recon.retriggerBlocked` | 1366 | 1396 | 0.3 | 76 | 44 | 32 | 0.2067 |
| `squadPerformance.meanOverall` | 8954.000000000002 | 8627.9 | -3.261 | 98 | 0 | 98 | 0 |
| `squadPerformance.p10Overall` | 8612.5 | 8036.700000000001 | -5.758 | 100 | 6 | 94 | 0 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8204.3 | 8159.799999999999 | -0.445 | 99 | 40 | 59 | 0.0699 |
| `squadPerformance.meanMovement` | 9948.699999999999 | 9858.399999999996 | -0.903 | 94 | 12 | 82 | 0 |
| `squadPerformance.meanControl` | 9735.199999999995 | 9107.699999999997 | -6.275 | 100 | 0 | 100 | 0 |
| `squadPerformance.meanCohesion` | 9512.200000000004 | 8366.100000000002 | -11.461 | 100 | 6 | 94 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-0001 0.15 s (timeline) · phase-0e-0002 0.15 s (timeline) · phase-0e-0003 0.15 s (timeline) · phase-0e-0004 0.15 s (timeline) · phase-0e-0005 0.15 s (timeline) · phase-0e-0006 0.15 s (timeline) · phase-0e-0007 0.15 s (timeline) · phase-0e-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=289&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=289`); it opens the seed that parts earliest, and the dropdowns choose another.

