# Benchmark run #1509 · 60 seeds from `c701` (ge-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerGunner=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c701-168cf070 @ 168cf07 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41237468350) · build v29-dev

## Verdict

**WEAK: 41 of 51 pairs changed (median first part 162 s); 4 of 42 counters under p 0.05 (about 2.1 by chance); casualties -2.5% (p 0.7011)**

- Under 0.05 only: recon.retriggerBlocked 466 to 448 (-3.9%, p 0.0044); recon.orders 1268 to 1241 (-2.1%, p 0.029); squadPerformance.meanMovement 5077.8 to 5076.4 (-0.0%, p 0.0347); usKills 327 to 285 (-12.8%, p 0.049).

## Paired comparison (off against on)

- **51** pairs (unpaired: off 0, on 0) · identical in every field: **10** · runtime errors off 0 / on 0 · wall time on/off x0.988 (gate 1.25)
- the 30 changed records first part at simulated second: min 112.05, p10 121.05, median 162, p90 224.1, max 273

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 765 | 746 | -0.3725 | 27 | 15 | 12 | 0.7011 |
| `usKills` | 327 | 285 | -0.8235 | 17 | 4 | 13 | 0.049 |
| `geKills` | 438 | 461 | 0.451 | 21 | 13 | 8 | 0.3833 |
| `fire.total` | 19049 | 20469 | 27.8431 | 31 | 21 | 10 | 0.0708 |
| `fire.hits` | 1704 | 1587 | -2.2941 | 28 | 11 | 17 | 0.3449 |
| `retreatSamples` | 5245 | 5018 | -4.451 | 25 | 13 | 12 | 1 |
| `movementResolver.changes` | 98204 | 97580 | -12.2353 | 30 | 12 | 18 | 0.3616 |
| `grenades.throws` | 17 | 17 | 0 | 2 | 1 | 1 | 1 |
| `grenades.bursts` | 16 | 15 | -0.0196 | 1 | 0 | 1 | 1 |
| `grenades.wounded` | 15 | 16 | 0.0196 | 1 | 1 | 0 | 1 |
| `grenades.casualties` | 6 | 7 | 0.0196 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 26 | 28 | 0.0392 | 1 | 1 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 3 | 0.0196 | 1 | 1 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 397 | 390 | -0.1373 | 22 | 8 | 14 | 0.2863 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 67 | 68 | 0.0196 | 10 | 6 | 4 | 0.7539 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1268 | 1241 | -0.5294 | 26 | 7 | 19 | 0.029 |
| `recon.contacts` | 202 | 195 | -0.1373 | 23 | 8 | 15 | 0.21 |
| `recon.noContact` | 326 | 328 | 0.0392 | 4 | 3 | 1 | 0.625 |
| `recon.timeouts` | 33 | 33 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 648 | 631 | -0.3333 | 24 | 8 | 16 | 0.1516 |
| `recon.reportsDelivered` | 1030 | 987 | -0.8431 | 25 | 11 | 14 | 0.69 |
| `recon.retriggerBlocked` | 466 | 448 | -0.3529 | 19 | 3 | 16 | 0.0044 |
| `squadPerformance.meanOverall` | 4425.9 | 4436.1 | 0.2 | 26 | 15 | 11 | 0.5572 |
| `squadPerformance.p10Overall` | 3993.600000000001 | 4009.3999999999996 | 0.3098 | 25 | 12 | 13 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3980.0000000000005 | 3976.900000000001 | -0.0608 | 28 | 13 | 15 | 0.8506 |
| `squadPerformance.meanMovement` | 5077.8 | 5076.4 | -0.0275 | 23 | 6 | 17 | 0.0347 |
| `squadPerformance.meanControl` | 4850.1 | 4855.9 | 0.1137 | 28 | 19 | 9 | 0.0872 |
| `squadPerformance.meanCohesion` | 4477.299999999999 | 4499.4 | 0.4333 | 27 | 17 | 10 | 0.2478 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c701-0032 112.05 s (timeline) · c701-0028 113.1 s (timeline) · c701-0059 121.05 s (timeline) · c701-0022 122.1 s (timeline) · c701-0035 126 s (timeline) · c701-0004 127.05 s (stress) · c701-0024 127.05 s (timeline) · c701-0009 132 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1509&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c701-168cf070/ai_flow_live.html?bench=1509&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1509`); it opens the seed that parts earliest, and the dropdowns choose another.

