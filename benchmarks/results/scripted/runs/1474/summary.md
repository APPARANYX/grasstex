# Benchmark run #1474 · 60 seeds from `pr698-rl` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&releasedOrder=0` · **ON** flags: `strategicInterception=0`
- claude/project-thread-jxet0c @ 58bef7c · [run](https://github.com/APPARANYX/grasstex/actions/runs/41189661477) · build v29-dev

## Verdict

**WEAK: 60 of 60 pairs changed (median first part 0.15 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties -1.2% (p 1)**

- Under 0.05 only: recon.reportsDelivered 1240 to 1053 (-15.1%, p 0.0357).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.018 (gate 1.25)
- the 60 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2295 | 2268 | -0.45 | 47 | 23 | 24 | 1 |
| `usKills` | 1008 | 953 | -0.9167 | 45 | 21 | 24 | 0.766 |
| `geKills` | 1287 | 1315 | 0.4667 | 45 | 24 | 21 | 0.766 |
| `fire.total` | 35625 | 35742 | 1.95 | 47 | 26 | 21 | 0.5601 |
| `fire.hits` | 5042 | 4986 | -0.9333 | 45 | 26 | 19 | 0.3713 |
| `retreatSamples` | 105295 | 105470 | 2.9167 | 47 | 23 | 24 | 1 |
| `movementResolver.changes` | 149998 | 147312 | -44.7667 | 53 | 26 | 27 | 1 |
| `grenades.throws` | 54 | 53 | -0.0167 | 14 | 8 | 6 | 0.7905 |
| `grenades.bursts` | 54 | 53 | -0.0167 | 14 | 8 | 6 | 0.7905 |
| `grenades.wounded` | 53 | 50 | -0.05 | 9 | 5 | 4 | 1 |
| `grenades.casualties` | 19 | 23 | 0.0667 | 6 | 3 | 3 | 1 |
| `grenades.suppressed` | 124 | 138 | 0.2333 | 11 | 8 | 3 | 0.2266 |
| `grenades.friendlyWounded` | 2 | 2 | 0 | 3 | 1 | 2 | 1 |
| `grenades.friendlyCasualties` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `grenades.aborted` | 5 | 6 | 0.0167 | 8 | 5 | 3 | 0.7266 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 87 | 71 | -0.2667 | 33 | 14 | 19 | 0.4869 |
| `loopAlerts.length` | 615 | 603 | -0.2 | 41 | 22 | 19 | 0.7552 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 191 | 178 | -0.2167 | 44 | 20 | 24 | 0.6516 |
| `stallOutcomes.wakes` | 8 | 16 | 0.1333 | 13 | 8 | 5 | 0.5811 |
| `stallOutcomes.repeats` | 1 | 3 | 0.0333 | 4 | 3 | 1 | 0.625 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1630 | 1576 | -0.9 | 43 | 16 | 27 | 0.1263 |
| `recon.contacts` | 274 | 239 | -0.5833 | 37 | 13 | 24 | 0.0989 |
| `recon.noContact` | 733 | 713 | -0.3333 | 39 | 16 | 23 | 0.3368 |
| `recon.timeouts` | 59 | 68 | 0.15 | 25 | 14 | 11 | 0.69 |
| `recon.cancelled` | 508 | 496 | -0.2 | 43 | 17 | 26 | 0.2221 |
| `recon.reportsDelivered` | 1240 | 1053 | -3.1167 | 45 | 15 | 30 | 0.0357 |
| `recon.retriggerBlocked` | 687 | 679 | -0.1333 | 42 | 19 | 23 | 0.644 |
| `squadPerformance.meanOverall` | 4971.3 | 4977.1 | 0.0967 | 47 | 27 | 20 | 0.3817 |
| `squadPerformance.p10Overall` | 4603 | 4592.499999999999 | -0.175 | 26 | 10 | 16 | 0.3269 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4107.699999999998 | 4097.5999999999985 | -0.1683 | 46 | 23 | 23 | 1 |
| `squadPerformance.meanMovement` | 5992.5 | 5992.9 | 0.0067 | 23 | 14 | 9 | 0.4049 |
| `squadPerformance.meanControl` | 5738.200000000001 | 5755.5 | 0.2883 | 47 | 27 | 20 | 0.3817 |
| `squadPerformance.meanCohesion` | 5364.9000000000015 | 5373.6 | 0.145 | 48 | 26 | 22 | 0.6655 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr698-rl-0001 0.15 s (timeline) · pr698-rl-0002 0.15 s (timeline) · pr698-rl-0003 0.15 s (timeline) · pr698-rl-0004 0.15 s (timeline) · pr698-rl-0005 0.15 s (timeline) · pr698-rl-0006 0.15 s (timeline) · pr698-rl-0007 0.15 s (timeline) · pr698-rl-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1474&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1474`); it opens the seed that parts earliest, and the dropdowns choose another.

