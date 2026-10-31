# Benchmark run #1452 · 60 seeds from `ambush-20261031b` (meeting), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerAmbush=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- claude/project-thread-9nqzwp @ 261df62 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41183858420) · build v29-dev

## Verdict

**QUIET: 47 of 60 pairs changed (median first part 225 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -4.9% (p 0.3105)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **13** · runtime errors off 0 / on 0 · wall time on/off x0.998 (gate 1.25)
- the 42 changed records first part at simulated second: min 161.1, p10 183, median 225, p90 273, max 312

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 952 | 905 | -0.7833 | 35 | 14 | 21 | 0.3105 |
| `usKills` | 402 | 377 | -0.4167 | 36 | 16 | 20 | 0.6177 |
| `geKills` | 550 | 528 | -0.3667 | 29 | 13 | 16 | 0.7111 |
| `fire.total` | 23420 | 23148 | -4.5333 | 41 | 20 | 21 | 1 |
| `fire.hits` | 2197 | 2077 | -2 | 39 | 17 | 22 | 0.5224 |
| `retreatSamples` | 5368 | 5391 | 0.3833 | 34 | 17 | 17 | 1 |
| `movementResolver.changes` | 166871 | 166588 | -4.7167 | 42 | 19 | 23 | 0.644 |
| `grenades.throws` | 13 | 10 | -0.05 | 6 | 2 | 4 | 0.6875 |
| `grenades.bursts` | 13 | 9 | -0.0667 | 6 | 2 | 4 | 0.6875 |
| `grenades.wounded` | 9 | 6 | -0.05 | 2 | 1 | 1 | 1 |
| `grenades.casualties` | 3 | 1 | -0.0333 | 1 | 0 | 1 | 1 |
| `grenades.suppressed` | 21 | 14 | -0.1167 | 3 | 1 | 2 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 4 | 1 | -0.05 | 2 | 0 | 2 | 0.5 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 15 | 16 | 0.0167 | 3 | 2 | 1 | 1 |
| `loopAlerts.length` | 656 | 670 | 0.2333 | 34 | 19 | 15 | 0.6076 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 135 | 151 | 0.2667 | 22 | 16 | 6 | 0.0525 |
| `stallOutcomes.wakes` | 22 | 23 | 0.0167 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 4 | 3 | -0.0167 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1094 | 1099 | 0.0833 | 18 | 13 | 5 | 0.0963 |
| `recon.contacts` | 85 | 87 | 0.0333 | 14 | 8 | 6 | 0.7905 |
| `recon.noContact` | 513 | 510 | -0.05 | 3 | 1 | 2 | 1 |
| `recon.timeouts` | 14 | 13 | -0.0167 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 471 | 476 | 0.0833 | 16 | 10 | 6 | 0.4545 |
| `recon.reportsDelivered` | 395 | 380 | -0.25 | 12 | 7 | 5 | 0.7744 |
| `recon.retriggerBlocked` | 879 | 883 | 0.0667 | 19 | 12 | 7 | 0.3593 |
| `squadPerformance.meanOverall` | 5074.599999999999 | 5077.599999999999 | 0.05 | 37 | 13 | 24 | 0.0989 |
| `squadPerformance.p10Overall` | 4634.499999999998 | 4644.2 | 0.1617 | 33 | 14 | 19 | 0.4869 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4332.200000000001 | 4311.9 | -0.3383 | 35 | 16 | 19 | 0.7359 |
| `squadPerformance.meanMovement` | 5916.800000000002 | 5919.3 | 0.0417 | 31 | 16 | 15 | 1 |
| `squadPerformance.meanControl` | 5528.900000000002 | 5534.6 | 0.095 | 36 | 16 | 20 | 0.6177 |
| `squadPerformance.meanCohesion` | 5384.3 | 5405.700000000001 | 0.3567 | 37 | 23 | 14 | 0.1877 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

ambush-20261031b-0050 161.1 s (timeline) · ambush-20261031b-0030 169.05 s (timeline) · ambush-20261031b-0024 176.1 s (timeline) · ambush-20261031b-0032 176.1 s (timeline) · ambush-20261031b-0011 183 s (timeline) · ambush-20261031b-0051 183 s (timeline) · ambush-20261031b-0028 185.1 s (timeline) · ambush-20261031b-0012 193.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1452&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1452`); it opens the seed that parts earliest, and the dropdowns choose another.

