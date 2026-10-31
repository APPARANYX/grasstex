# Benchmark run #1454 · 60 seeds from `ambush-20261031b` (ge-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerAmbush=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- claude/project-thread-9nqzwp @ 261df62 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41183863819) · build v29-dev

## Verdict

**WEAK: 33 of 53 pairs changed (median first part 181.05 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties -2.4% (p 0.8238)**

- Under 0.05 only: regroups.entries 263 to 278 (+5.7%, p 0.0225).

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **20** · runtime errors off 0 / on 0 · wall time on/off x0.998 (gate 1.25)
- the 23 changed records first part at simulated second: min 104.1, p10 136.05, median 181.05, p90 240, max 286.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 719 | 702 | -0.3208 | 20 | 9 | 11 | 0.8238 |
| `usKills` | 258 | 248 | -0.1887 | 19 | 8 | 11 | 0.6476 |
| `geKills` | 461 | 454 | -0.1321 | 19 | 7 | 12 | 0.3593 |
| `fire.total` | 16885 | 16906 | 0.3962 | 23 | 12 | 11 | 1 |
| `fire.hits` | 1519 | 1563 | 0.8302 | 22 | 14 | 8 | 0.2863 |
| `retreatSamples` | 5244 | 5170 | -1.3962 | 19 | 10 | 9 | 1 |
| `movementResolver.changes` | 92356 | 92081 | -5.1887 | 23 | 12 | 11 | 1 |
| `grenades.throws` | 12 | 22 | 0.1887 | 4 | 4 | 0 | 0.125 |
| `grenades.bursts` | 10 | 18 | 0.1509 | 4 | 4 | 0 | 0.125 |
| `grenades.wounded` | 7 | 16 | 0.1698 | 4 | 4 | 0 | 0.125 |
| `grenades.casualties` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 14 | 34 | 0.3774 | 3 | 3 | 0 | 0.25 |
| `grenades.friendlyWounded` | 1 | 4 | 0.0566 | 2 | 2 | 0 | 0.5 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 3 | 5 | 0.0377 | 1 | 1 | 0 | 1 |
| `movementStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 2 | 0.0377 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 403 | 411 | 0.1509 | 20 | 11 | 9 | 0.8238 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 263 | 278 | 0.283 | 13 | 11 | 2 | 0.0225 |
| `stallOutcomes.wakes` | 49 | 49 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 49 | 49 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 49 | 49 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1281 | 1260 | -0.3962 | 18 | 7 | 11 | 0.4807 |
| `recon.contacts` | 209 | 193 | -0.3019 | 18 | 7 | 11 | 0.4807 |
| `recon.noContact` | 333 | 329 | -0.0755 | 2 | 0 | 2 | 0.5 |
| `recon.timeouts` | 25 | 27 | 0.0377 | 1 | 1 | 0 | 1 |
| `recon.cancelled` | 659 | 657 | -0.0377 | 17 | 9 | 8 | 1 |
| `recon.reportsDelivered` | 1003 | 923 | -1.5094 | 15 | 8 | 7 | 1 |
| `recon.retriggerBlocked` | 435 | 436 | 0.0189 | 6 | 4 | 2 | 0.6875 |
| `squadPerformance.meanOverall` | 4602.199999999999 | 4601.8 | -0.0075 | 23 | 12 | 11 | 1 |
| `squadPerformance.p10Overall` | 4164.499999999999 | 4166.499999999999 | 0.0377 | 15 | 7 | 8 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4141.999999999999 | 4149.7 | 0.1453 | 20 | 10 | 10 | 1 |
| `squadPerformance.meanMovement` | 5265.6 | 5265.599999999999 | 0 | 16 | 8 | 8 | 1 |
| `squadPerformance.meanControl` | 5036.300000000001 | 5032 | -0.0811 | 22 | 10 | 12 | 0.8318 |
| `squadPerformance.meanCohesion` | 4574.599999999999 | 4554.2 | -0.3849 | 17 | 10 | 7 | 0.6291 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

ambush-20261031b-0054 104.1 s (timeline) · ambush-20261031b-0043 116.1 s (timeline) · ambush-20261031b-0003 136.05 s (timeline) · ambush-20261031b-0034 140.1 s (timeline) · ambush-20261031b-0026 142.05 s (timeline) · ambush-20261031b-0039 146.1 s (timeline) · ambush-20261031b-0056 146.1 s (timeline) · ambush-20261031b-0015 159 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1454&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1454`); it opens the seed that parts earliest, and the dropdowns choose another.

