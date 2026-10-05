# Benchmark run #321 · 100 seeds from `phase-0e-posture` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=1&commandMovement=0&commandRelay=0`
- main @ 9da5788 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37263249157) · build v29-dev

## Verdict

**WEAK: 100 of 100 pairs changed (median first part 85.05 s); 1 of 32 counters under p 0.05 (about 1.6 by chance); casualties +12.3% (p 0.2604)**

- Under 0.05 only: recon.noContact 1259 to 1242 (-1.4%, p 0.0161).
- Wall time on/off x1.361 is over the 1.25 gate.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.361 (gate 1.25)
- the 100 changed records first part at simulated second: min 42, p10 55.05, median 85.05, p90 123, max 148.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 608 | 683 | 0.75 | 79 | 45 | 34 | 0.2604 |
| `usKills` | 289 | 319 | 0.3 | 64 | 37 | 27 | 0.2604 |
| `geKills` | 319 | 364 | 0.45 | 63 | 33 | 30 | 0.8013 |
| `fire.total` | 5733 | 6837 | 11.04 | 91 | 55 | 36 | 0.0586 |
| `fire.hits` | 1191 | 1300 | 1.09 | 84 | 47 | 37 | 0.3261 |
| `retreatSamples` | 1272 | 1708 | 4.36 | 59 | 34 | 25 | 0.2976 |
| `movementResolver.changes` | 170375 | 169856 | -5.19 | 100 | 55 | 45 | 0.3682 |
| `movementStalls.length` | 15 | 8 | -0.07 | 5 | 1 | 4 | 0.375 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 2 | 0 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 46 | 51 | 0.05 | 44 | 22 | 22 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 18 | 16 | -0.02 | 13 | 5 | 8 | 0.5811 |
| `stallOutcomes.wakes` | 4 | 4 | 0 | 2 | 1 | 1 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 24 | 19 | -0.05 | 4 | 1 | 3 | 0.625 |
| `timeline.stalledSamples` | 298 | 279 | -0.19 | 6 | 3 | 3 | 1 |
| `recon.orders` | 1351 | 1346 | -0.05 | 36 | 17 | 19 | 0.8679 |
| `recon.contacts` | 21 | 31 | 0.1 | 23 | 16 | 7 | 0.0931 |
| `recon.noContact` | 1259 | 1242 | -0.17 | 30 | 8 | 22 | 0.0161 |
| `recon.timeouts` | 11 | 14 | 0.03 | 3 | 3 | 0 | 0.25 |
| `recon.cancelled` | 46 | 42 | -0.04 | 30 | 14 | 16 | 0.8555 |
| `recon.reportsDelivered` | 117 | 201 | 0.84 | 22 | 16 | 6 | 0.0525 |
| `recon.retriggerBlocked` | 1254 | 1248 | -0.06 | 29 | 12 | 17 | 0.4583 |
| `squadPerformance.meanOverall` | 8991.300000000001 | 8979.400000000001 | -0.119 | 100 | 44 | 56 | 0.2713 |
| `squadPerformance.p10Overall` | 8582.800000000001 | 8597.499999999998 | 0.147 | 97 | 52 | 45 | 0.5426 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8316.100000000002 | 8273.800000000001 | -0.423 | 81 | 36 | 45 | 0.3742 |
| `squadPerformance.meanMovement` | 9929.499999999998 | 9923.499999999998 | -0.06 | 70 | 35 | 35 | 1 |
| `squadPerformance.meanControl` | 9831.500000000004 | 9827.899999999998 | -0.036 | 67 | 35 | 32 | 0.8072 |
| `squadPerformance.meanCohesion` | 9432.499999999996 | 9445.199999999997 | 0.127 | 95 | 50 | 45 | 0.6817 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-posture-0025 42 s (timeline) · phase-0e-posture-0010 45 s (timeline) · phase-0e-posture-0058 45 s (timeline) · phase-0e-posture-0051 47.1 s (timeline) · phase-0e-posture-0048 49.05 s (timeline) · phase-0e-posture-0015 51 s (timeline) · phase-0e-posture-0057 51 s (timeline) · phase-0e-posture-0008 52.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=321&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=321`); it opens the seed that parts earliest, and the dropdowns choose another.

