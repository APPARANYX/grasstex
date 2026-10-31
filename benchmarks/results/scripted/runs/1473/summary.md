# Benchmark run #1473 · 60 seeds from `pr698-ro` (us-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&releasedOrder=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- claude/project-thread-jxet0c @ 58bef7c · [run](https://github.com/APPARANYX/grasstex/actions/runs/41189610624) · build v29-dev

## Verdict

**WEAK: 60 of 60 pairs changed (median first part 0.15 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.3% (p 0.8919)**

- Under 0.05 only: movementResolver.changes 207546 to 194082 (-6.5%, p 0.0062).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.907 (gate 1.25)
- the 60 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2355 | 2349 | -0.1 | 54 | 26 | 28 | 0.8919 |
| `usKills` | 1073 | 1134 | 1.0167 | 52 | 29 | 23 | 0.4885 |
| `geKills` | 1282 | 1215 | -1.1167 | 53 | 23 | 30 | 0.4101 |
| `fire.total` | 63951 | 57601 | -105.8333 | 56 | 21 | 35 | 0.0814 |
| `fire.hits` | 5401 | 5391 | -0.1667 | 54 | 25 | 29 | 0.6835 |
| `retreatSamples` | 149425 | 137889 | -192.2667 | 56 | 24 | 32 | 0.3497 |
| `movementResolver.changes` | 207546 | 194082 | -224.4 | 60 | 19 | 41 | 0.0062 |
| `grenades.throws` | 54 | 54 | 0 | 28 | 14 | 14 | 1 |
| `grenades.bursts` | 54 | 54 | 0 | 28 | 14 | 14 | 1 |
| `grenades.wounded` | 21 | 22 | 0.0167 | 14 | 6 | 8 | 0.7905 |
| `grenades.casualties` | 11 | 9 | -0.0333 | 8 | 3 | 5 | 0.7266 |
| `grenades.suppressed` | 52 | 40 | -0.2 | 19 | 8 | 11 | 0.6476 |
| `grenades.friendlyWounded` | 1 | 5 | 0.0667 | 4 | 4 | 0 | 0.125 |
| `grenades.friendlyCasualties` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.aborted` | 9 | 13 | 0.0667 | 14 | 7 | 7 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 93 | 88 | -0.0833 | 43 | 19 | 24 | 0.5424 |
| `loopAlerts.length` | 906 | 895 | -0.1833 | 21 | 7 | 14 | 0.1892 |
| `writerConflicts` | 0 | 2 | 0.0333 | 1 | 1 | 0 | 1 |
| `regroups.entries` | 318 | 297 | -0.35 | 53 | 24 | 29 | 0.5831 |
| `stallOutcomes.wakes` | 8 | 13 | 0.0833 | 18 | 11 | 7 | 0.4807 |
| `stallOutcomes.repeats` | 1 | 4 | 0.05 | 3 | 2 | 1 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2656 | 2605 | -0.85 | 56 | 30 | 26 | 0.6889 |
| `recon.contacts` | 601 | 562 | -0.65 | 54 | 24 | 30 | 0.4966 |
| `recon.noContact` | 670 | 675 | 0.0833 | 44 | 21 | 23 | 0.8804 |
| `recon.timeouts` | 44 | 47 | 0.05 | 17 | 10 | 7 | 0.6291 |
| `recon.cancelled` | 1295 | 1274 | -0.35 | 51 | 27 | 24 | 0.7798 |
| `recon.reportsDelivered` | 2402 | 2305 | -1.6167 | 55 | 30 | 25 | 0.5901 |
| `recon.retriggerBlocked` | 777 | 772 | -0.0833 | 53 | 23 | 30 | 0.4101 |
| `squadPerformance.meanOverall` | 4876.6 | 4898.000000000002 | 0.3567 | 57 | 33 | 24 | 0.2892 |
| `squadPerformance.p10Overall` | 4534.099999999999 | 4531.499999999999 | -0.0433 | 21 | 9 | 12 | 0.6636 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3798.3 | 3865.899999999999 | 1.1267 | 56 | 33 | 23 | 0.2288 |
| `squadPerformance.meanMovement` | 5990.799999999998 | 5990.7 | -0.0017 | 28 | 13 | 15 | 0.8506 |
| `squadPerformance.meanControl` | 5732.699999999998 | 5727.499999999998 | -0.0867 | 55 | 25 | 30 | 0.5901 |
| `squadPerformance.meanCohesion` | 5540.9000000000015 | 5530.900000000002 | -0.1667 | 56 | 26 | 30 | 0.6889 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr698-ro-0001 0.15 s (timeline) · pr698-ro-0002 0.15 s (timeline) · pr698-ro-0003 0.15 s (timeline) · pr698-ro-0004 0.15 s (timeline) · pr698-ro-0005 0.15 s (timeline) · pr698-ro-0006 0.15 s (timeline) · pr698-ro-0007 0.15 s (timeline) · pr698-ro-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1473&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1473`); it opens the seed that parts earliest, and the dropdowns choose another.

