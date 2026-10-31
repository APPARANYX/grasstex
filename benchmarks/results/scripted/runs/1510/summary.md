# Benchmark run #1510 · 60 seeds from `c701` (us-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerGunner=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c701-168cf070 @ 168cf07 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41237530152) · build v29-dev

## Verdict

**WEAK: 40 of 51 pairs changed (median first part 189 s); 2 of 42 counters under p 0.05 (about 2.1 by chance); casualties +1.2% (p 0.8601)**

- Under 0.05 only: fire.total 20821 to 22507 (+8.1%, p 0.006); recon.orders 1199 to 1222 (+1.9%, p 0.0428).

## Paired comparison (off against on)

- **51** pairs (unpaired: off 0, on 0) · identical in every field: **11** · runtime errors off 0 / on 0 · wall time on/off x1.016 (gate 1.25)
- the 35 changed records first part at simulated second: min 120, p10 141, median 189, p90 254.1, max 300

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 760 | 769 | 0.1765 | 32 | 17 | 15 | 0.8601 |
| `usKills` | 354 | 349 | -0.098 | 24 | 11 | 13 | 0.8388 |
| `geKills` | 406 | 420 | 0.2745 | 28 | 16 | 12 | 0.5716 |
| `fire.total` | 20821 | 22507 | 33.0588 | 35 | 26 | 9 | 0.006 |
| `fire.hits` | 1801 | 1708 | -1.8235 | 34 | 12 | 22 | 0.1214 |
| `retreatSamples` | 5946 | 6027 | 1.5882 | 31 | 17 | 14 | 0.7201 |
| `movementResolver.changes` | 104630 | 104244 | -7.5686 | 35 | 15 | 20 | 0.4996 |
| `grenades.throws` | 24 | 25 | 0.0196 | 1 | 1 | 0 | 1 |
| `grenades.bursts` | 24 | 25 | 0.0196 | 1 | 1 | 0 | 1 |
| `grenades.wounded` | 40 | 40 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 12 | 11 | -0.0196 | 1 | 0 | 1 | 1 |
| `grenades.suppressed` | 124 | 123 | -0.0196 | 1 | 0 | 1 | 1 |
| `grenades.friendlyWounded` | 3 | 2 | -0.0196 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 1 | 0 | -0.0196 | 1 | 0 | 1 | 1 |
| `grenades.aborted` | 4 | 6 | 0.0392 | 1 | 1 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 2 | 0.0196 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 515 | 490 | -0.4902 | 29 | 12 | 17 | 0.4583 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 66 | 57 | -0.1765 | 12 | 3 | 9 | 0.146 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1199 | 1222 | 0.451 | 30 | 21 | 9 | 0.0428 |
| `recon.contacts` | 185 | 184 | -0.0196 | 25 | 17 | 8 | 0.1078 |
| `recon.noContact` | 451 | 449 | -0.0392 | 8 | 3 | 5 | 0.7266 |
| `recon.timeouts` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 500 | 524 | 0.4706 | 24 | 13 | 11 | 0.8388 |
| `recon.reportsDelivered` | 764 | 776 | 0.2353 | 25 | 16 | 9 | 0.2295 |
| `recon.retriggerBlocked` | 457 | 466 | 0.1765 | 20 | 14 | 6 | 0.1153 |
| `squadPerformance.meanOverall` | 4381 | 4383.2 | 0.0431 | 34 | 21 | 13 | 0.2295 |
| `squadPerformance.p10Overall` | 3939.0000000000005 | 3957.3999999999996 | 0.3608 | 26 | 14 | 12 | 0.845 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3871.1 | 3863.1 | -0.1569 | 31 | 17 | 14 | 0.7201 |
| `squadPerformance.meanMovement` | 5071.299999999999 | 5071.900000000001 | 0.0118 | 28 | 15 | 13 | 0.8506 |
| `squadPerformance.meanControl` | 4811.799999999998 | 4829.9 | 0.3549 | 29 | 18 | 11 | 0.2649 |
| `squadPerformance.meanCohesion` | 4494.400000000001 | 4504.4000000000015 | 0.1961 | 34 | 20 | 14 | 0.3915 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c701-0051 120 s (timeline) · c701-0003 130.05 s (stress) · c701-0033 140.1 s (stress) · c701-0058 141 s (stress) · c701-0006 145.05 s (timeline) · c701-0001 150 s (timeline) · c701-0019 155.1 s (timeline) · c701-0042 158.1 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1510&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c701-168cf070/ai_flow_live.html?bench=1510&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1510`); it opens the seed that parts earliest, and the dropdowns choose another.

