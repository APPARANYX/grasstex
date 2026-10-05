# Benchmark run #322 · 100 seeds from `phase-0f-broadcast` (meeting), windows `contact+120`

- **OFF** flags: `squadBroadcast=0` · **ON** flags: `squadBroadcast=1`
- main @ 9da5788 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37263251091) · build v29-dev

## Verdict

**QUIET: 60 of 100 pairs changed (median first part 200.1 s); 0 of 32 counters under p 0.05 (about 1.6 by chance); casualties -0.5% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **40** · runtime errors off 0 / on 0 · wall time on/off x0.99 (gate 1.25)
- the 11 changed records first part at simulated second: min 129, p10 181.05, median 200.1, p90 220.05, max 232.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 752 | 748 | -0.04 | 9 | 5 | 4 | 1 |
| `usKills` | 322 | 315 | -0.07 | 4 | 1 | 3 | 0.625 |
| `geKills` | 430 | 433 | 0.03 | 7 | 4 | 3 | 1 |
| `fire.total` | 7611 | 7628 | 0.17 | 8 | 4 | 4 | 1 |
| `fire.hits` | 1468 | 1453 | -0.15 | 7 | 2 | 5 | 0.4531 |
| `retreatSamples` | 1539 | 1530 | -0.09 | 4 | 1 | 3 | 0.625 |
| `movementResolver.changes` | 173531 | 173614 | 0.83 | 9 | 6 | 3 | 0.5078 |
| `movementStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 48 | 52 | 0.04 | 3 | 3 | 0 | 0.25 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 86 | 86 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1409 | 1408 | -0.01 | 1 | 0 | 1 | 1 |
| `recon.contacts` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1300 | 1300 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 51 | 50 | -0.01 | 1 | 0 | 1 | 1 |
| `recon.reportsDelivered` | 170 | 170 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1310 | 1310 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 8968.099999999999 | 8968.799999999997 | 0.007 | 4 | 2 | 2 | 1 |
| `squadPerformance.p10Overall` | 8545.000000000004 | 8549.600000000004 | 0.046 | 4 | 2 | 2 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8253.999999999996 | 8256.699999999999 | 0.027 | 4 | 4 | 0 | 0.125 |
| `squadPerformance.meanMovement` | 9922.4 | 9923 | 0.006 | 5 | 3 | 2 | 1 |
| `squadPerformance.meanControl` | 9834.900000000001 | 9832.8 | -0.021 | 4 | 0 | 4 | 0.125 |
| `squadPerformance.meanCohesion` | 9404.000000000002 | 9406.100000000002 | 0.021 | 6 | 2 | 4 | 0.6875 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0f-broadcast-0099 129 s (timeline) · phase-0f-broadcast-0020 181.05 s (timeline) · phase-0f-broadcast-0007 182.1 s (timeline) · phase-0f-broadcast-0064 187.05 s (timeline) · phase-0f-broadcast-0094 198 s (timeline) · phase-0f-broadcast-0015 200.1 s (timeline) · phase-0f-broadcast-0098 204 s (stress) · phase-0f-broadcast-0054 213 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=322&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=322`); it opens the seed that parts earliest, and the dropdowns choose another.

