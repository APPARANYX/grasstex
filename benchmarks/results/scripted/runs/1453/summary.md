# Benchmark run #1453 · 60 seeds from `ambush-20261031b` (us-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerAmbush=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- claude/project-thread-9nqzwp @ 261df62 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41183861062) · build v29-dev

## Verdict

**QUIET: 35 of 53 pairs changed (median first part 189.525 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -5.1% (p 0.1435)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **18** · runtime errors off 0 / on 0 · wall time on/off x1.002 (gate 1.25)
- the 22 changed records first part at simulated second: min 111, p10 134.1, median 189.525, p90 252, max 283.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 681 | 646 | -0.6604 | 17 | 5 | 12 | 0.1435 |
| `usKills` | 354 | 328 | -0.4906 | 18 | 5 | 13 | 0.0963 |
| `geKills` | 327 | 318 | -0.1698 | 10 | 4 | 6 | 0.7539 |
| `fire.total` | 19083 | 19108 | 0.4717 | 20 | 8 | 12 | 0.5034 |
| `fire.hits` | 1429 | 1442 | 0.2453 | 17 | 8 | 9 | 1 |
| `retreatSamples` | 5159 | 4858 | -5.6792 | 16 | 4 | 12 | 0.0768 |
| `movementResolver.changes` | 94089 | 93971 | -2.2264 | 21 | 9 | 12 | 0.6636 |
| `grenades.throws` | 2 | 2 | 0 | 2 | 1 | 1 | 1 |
| `grenades.bursts` | 2 | 2 | 0 | 2 | 1 | 1 | 1 |
| `grenades.wounded` | 3 | 0 | -0.0566 | 1 | 0 | 1 | 1 |
| `grenades.casualties` | 2 | 0 | -0.0377 | 1 | 0 | 1 | 1 |
| `grenades.suppressed` | 3 | 0 | -0.0566 | 1 | 0 | 1 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 2 | 0.0377 | 1 | 1 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 435 | 428 | -0.1321 | 18 | 7 | 11 | 0.4807 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 103 | 100 | -0.0566 | 7 | 2 | 5 | 0.4531 |
| `stallOutcomes.wakes` | 49 | 49 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1135 | 1127 | -0.1509 | 15 | 6 | 9 | 0.6072 |
| `recon.contacts` | 180 | 184 | 0.0755 | 11 | 7 | 4 | 0.5488 |
| `recon.noContact` | 372 | 373 | 0.0189 | 4 | 3 | 1 | 0.625 |
| `recon.timeouts` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 512 | 498 | -0.2642 | 14 | 4 | 10 | 0.1796 |
| `recon.reportsDelivered` | 873 | 905 | 0.6038 | 12 | 8 | 4 | 0.3877 |
| `recon.retriggerBlocked` | 412 | 413 | 0.0189 | 11 | 6 | 5 | 1 |
| `squadPerformance.meanOverall` | 4579.2 | 4590.4000000000015 | 0.2113 | 19 | 13 | 6 | 0.1671 |
| `squadPerformance.p10Overall` | 4126.0999999999985 | 4143.799999999999 | 0.334 | 17 | 12 | 5 | 0.1435 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4006.3999999999996 | 4042.3999999999996 | 0.6792 | 19 | 14 | 5 | 0.0636 |
| `squadPerformance.meanMovement` | 5269.700000000001 | 5270.100000000001 | 0.0075 | 11 | 9 | 2 | 0.0654 |
| `squadPerformance.meanControl` | 5037 | 5035.100000000001 | -0.0358 | 16 | 9 | 7 | 0.8036 |
| `squadPerformance.meanCohesion` | 4712.7 | 4688.200000000001 | -0.4623 | 19 | 7 | 12 | 0.3593 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

ambush-20261031b-0037 111 s (timeline) · ambush-20261031b-0032 133.05 s (timeline) · ambush-20261031b-0006 134.1 s (timeline) · ambush-20261031b-0040 134.1 s (timeline) · ambush-20261031b-0017 142.05 s (timeline) · ambush-20261031b-0024 148.05 s (timeline) · ambush-20261031b-0029 149.1 s (timeline) · ambush-20261031b-0060 165 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1453&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1453`); it opens the seed that parts earliest, and the dropdowns choose another.

