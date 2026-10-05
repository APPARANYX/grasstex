# Benchmark run #312 · 100 seeds from `phase-0e-final100` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=0&commandMovement=1&commandRelay=0`
- work/phase-0e-regroup-adoption-grace @ 6c62eeb · [run](https://github.com/APPARANYX/grasstex/actions/runs/37246400565) · build v29-dev

## Verdict

**MOVED: 100 of 100 pairs changed (median first part 0.15 s); 3 of 32 counters under p 0.05 (about 1.6 by chance), 1 under 0.0016; casualties -11.6% (p 0.2354)**

- Clears the Bonferroni line (p < 0.0016): recon.contacts 38 to 16 (-57.9%, p 0.0013).
- Under 0.05 only: recon.reportsDelivered 234 to 109 (-53.4%, p 0.0029); movementResolver.changes 170135 to 162086 (-4.7%, p 0.0066).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.176 (gate 1.25)
- the 100 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 631 | 558 | -0.73 | 86 | 37 | 49 | 0.2354 |
| `usKills` | 266 | 236 | -0.3 | 72 | 31 | 41 | 0.2888 |
| `geKills` | 365 | 322 | -0.43 | 81 | 34 | 47 | 0.1821 |
| `fire.total` | 6539 | 5834 | -7.05 | 92 | 42 | 50 | 0.4657 |
| `fire.hits` | 1210 | 1093 | -1.17 | 93 | 41 | 52 | 0.2997 |
| `retreatSamples` | 1113 | 922 | -1.91 | 62 | 29 | 33 | 0.7035 |
| `movementResolver.changes` | 170135 | 162086 | -80.49 | 100 | 36 | 64 | 0.0066 |
| `movementStalls.length` | 5 | 2 | -0.03 | 3 | 1 | 2 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 41 | 57 | 0.16 | 41 | 26 | 15 | 0.1173 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 16 | 19 | 0.03 | 23 | 13 | 10 | 0.6776 |
| `stallOutcomes.wakes` | 7 | 6 | -0.01 | 5 | 2 | 3 | 1 |
| `stallOutcomes.repeats` | 0 | 1 | 0.01 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 6 | 4 | -0.02 | 4 | 2 | 2 | 1 |
| `timeline.stalledSamples` | 121 | 168 | 0.47 | 6 | 4 | 2 | 0.6875 |
| `recon.orders` | 1398 | 1366 | -0.32 | 70 | 27 | 43 | 0.0722 |
| `recon.contacts` | 38 | 16 | -0.22 | 33 | 7 | 26 | 0.0013 |
| `recon.noContact` | 1297 | 1277 | -0.2 | 72 | 34 | 38 | 0.7239 |
| `recon.timeouts` | 12 | 13 | 0.01 | 13 | 7 | 6 | 1 |
| `recon.cancelled` | 39 | 37 | -0.02 | 43 | 20 | 23 | 0.7608 |
| `recon.reportsDelivered` | 234 | 109 | -1.25 | 34 | 8 | 26 | 0.0029 |
| `recon.retriggerBlocked` | 1291 | 1269 | -0.22 | 75 | 35 | 40 | 0.6445 |
| `squadPerformance.meanOverall` | 8971.900000000001 | 9009.299999999997 | 0.374 | 98 | 56 | 42 | 0.1888 |
| `squadPerformance.p10Overall` | 8568.7 | 8631.500000000005 | 0.628 | 97 | 49 | 48 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8303.399999999998 | 8316.600000000004 | 0.132 | 95 | 45 | 50 | 0.6817 |
| `squadPerformance.meanMovement` | 9934.799999999994 | 9942.8 | 0.08 | 77 | 40 | 37 | 0.8199 |
| `squadPerformance.meanControl` | 9819.599999999997 | 9814.800000000001 | -0.048 | 85 | 39 | 46 | 0.5154 |
| `squadPerformance.meanCohesion` | 9367.699999999997 | 9444.599999999999 | 0.769 | 100 | 54 | 46 | 0.4841 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-final100-0001 0.15 s (timeline) · phase-0e-final100-0002 0.15 s (timeline) · phase-0e-final100-0003 0.15 s (timeline) · phase-0e-final100-0004 0.15 s (timeline) · phase-0e-final100-0005 0.15 s (timeline) · phase-0e-final100-0006 0.15 s (timeline) · phase-0e-final100-0007 0.15 s (timeline) · phase-0e-final100-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=312&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-0e-regroup-adoption-grace/ai_flow_live.html?bench=312&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=312`); it opens the seed that parts earliest, and the dropdowns choose another.

