# Benchmark run #311 · 100 seeds from `phase-0e-final100` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=0&commandMovement=1&commandRelay=0`
- work/phase-0e-regroup-adoption-grace @ 7f74416 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37216074067) · build v29-dev

## Verdict

**WEAK: 100 of 100 pairs changed (median first part 0.15 s); 4 of 32 counters under p 0.05 (about 1.6 by chance); casualties -3.2% (p 0.0857)**

- Under 0.05 only: movementResolver.changes 170135 to 164930 (-3.1%, p 0.0066); recon.contacts 38 to 21 (-44.7%, p 0.0166); squadPerformance.meanMovement 9934.799999999994 to 9928.999999999993 (-0.1%, p 0.0183); recon.reportsDelivered 234 to 144 (-38.5%, p 0.0237).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.179 (gate 1.25)
- the 100 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 631 | 611 | -0.2 | 87 | 35 | 52 | 0.0857 |
| `usKills` | 266 | 248 | -0.18 | 72 | 38 | 34 | 0.7239 |
| `geKills` | 365 | 363 | -0.02 | 76 | 33 | 43 | 0.3019 |
| `fire.total` | 6539 | 6350 | -1.89 | 96 | 41 | 55 | 0.1843 |
| `fire.hits` | 1210 | 1149 | -0.61 | 92 | 37 | 55 | 0.0758 |
| `retreatSamples` | 1113 | 1195 | 0.82 | 67 | 35 | 32 | 0.8072 |
| `movementResolver.changes` | 170135 | 164930 | -52.05 | 100 | 36 | 64 | 0.0066 |
| `movementStalls.length` | 5 | 5 | 0 | 5 | 3 | 2 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 2 | 0.01 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 41 | 53 | 0.12 | 44 | 27 | 17 | 0.1742 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 16 | 24 | 0.08 | 26 | 15 | 11 | 0.5572 |
| `stallOutcomes.wakes` | 7 | 6 | -0.01 | 6 | 3 | 3 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 6 | 9 | 0.03 | 7 | 4 | 3 | 1 |
| `timeline.stalledSamples` | 121 | 152 | 0.31 | 7 | 4 | 3 | 1 |
| `recon.orders` | 1398 | 1366 | -0.32 | 77 | 34 | 43 | 0.362 |
| `recon.contacts` | 38 | 21 | -0.17 | 40 | 12 | 28 | 0.0166 |
| `recon.noContact` | 1297 | 1281 | -0.16 | 70 | 32 | 38 | 0.5504 |
| `recon.timeouts` | 12 | 18 | 0.06 | 21 | 13 | 8 | 0.3833 |
| `recon.cancelled` | 39 | 27 | -0.12 | 45 | 16 | 29 | 0.0725 |
| `recon.reportsDelivered` | 234 | 144 | -0.9 | 39 | 12 | 27 | 0.0237 |
| `recon.retriggerBlocked` | 1291 | 1287 | -0.04 | 68 | 36 | 32 | 0.7163 |
| `squadPerformance.meanOverall` | 8971.900000000001 | 8991.099999999997 | 0.192 | 97 | 57 | 40 | 0.1038 |
| `squadPerformance.p10Overall` | 8568.7 | 8592.899999999998 | 0.242 | 99 | 53 | 46 | 0.5467 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8303.399999999998 | 8269.2 | -0.342 | 98 | 41 | 57 | 0.1293 |
| `squadPerformance.meanMovement` | 9934.799999999994 | 9928.999999999993 | -0.058 | 80 | 29 | 51 | 0.0183 |
| `squadPerformance.meanControl` | 9819.599999999997 | 9822.399999999998 | 0.028 | 84 | 42 | 42 | 1 |
| `squadPerformance.meanCohesion` | 9367.699999999997 | 9481.700000000003 | 1.14 | 99 | 56 | 43 | 0.2276 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-final100-0001 0.15 s (timeline) · phase-0e-final100-0002 0.15 s (timeline) · phase-0e-final100-0003 0.15 s (timeline) · phase-0e-final100-0004 0.15 s (timeline) · phase-0e-final100-0005 0.15 s (timeline) · phase-0e-final100-0006 0.15 s (timeline) · phase-0e-final100-0007 0.15 s (timeline) · phase-0e-final100-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=311&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-0e-regroup-adoption-grace/ai_flow_live.html?bench=311&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=311`); it opens the seed that parts earliest, and the dropdowns choose another.

