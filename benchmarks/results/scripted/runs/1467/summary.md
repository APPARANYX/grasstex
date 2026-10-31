# Benchmark run #1467 · 60 seeds from `pr698-rl` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&releasedOrder=0` · **ON** flags: `strategicInterception=0`
- claude/project-thread-jxet0c @ 58bef7c · [run](https://github.com/APPARANYX/grasstex/actions/runs/41189530087) · build v29-dev

## Verdict

**WEAK: 60 of 60 pairs changed (median first part 0.15 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.5% (p 0.435)**

- Under 0.05 only: squadPerformance.meanControl 5593 to 5640.600000000004 (+0.9%, p 0.0479).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.993 (gate 1.25)
- the 60 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2719 | 2705 | -0.2333 | 59 | 33 | 26 | 0.435 |
| `usKills` | 1249 | 1275 | 0.4333 | 59 | 31 | 28 | 0.7948 |
| `geKills` | 1470 | 1430 | -0.6667 | 60 | 24 | 36 | 0.155 |
| `fire.total` | 39986 | 40227 | 4.0167 | 60 | 33 | 27 | 0.519 |
| `fire.hits` | 5972 | 6365 | 6.55 | 58 | 35 | 23 | 0.148 |
| `retreatSamples` | 102065 | 105182 | 51.95 | 60 | 36 | 24 | 0.155 |
| `movementResolver.changes` | 211514 | 207532 | -66.3667 | 60 | 28 | 32 | 0.6989 |
| `grenades.throws` | 31 | 38 | 0.1167 | 21 | 11 | 10 | 1 |
| `grenades.bursts` | 31 | 38 | 0.1167 | 21 | 11 | 10 | 1 |
| `grenades.wounded` | 20 | 29 | 0.15 | 11 | 7 | 4 | 0.5488 |
| `grenades.casualties` | 11 | 10 | -0.0167 | 7 | 3 | 4 | 1 |
| `grenades.suppressed` | 46 | 77 | 0.5167 | 14 | 8 | 6 | 0.7905 |
| `grenades.friendlyWounded` | 0 | 4 | 0.0667 | 3 | 3 | 0 | 0.25 |
| `grenades.friendlyCasualties` | 0 | 2 | 0.0333 | 1 | 1 | 0 | 1 |
| `grenades.aborted` | 6 | 3 | -0.05 | 6 | 2 | 4 | 0.6875 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 300 | 272 | -0.4667 | 52 | 24 | 28 | 0.6778 |
| `loopAlerts.length` | 676 | 641 | -0.5833 | 55 | 22 | 33 | 0.177 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 261 | 227 | -0.5667 | 54 | 23 | 31 | 0.3409 |
| `stallOutcomes.wakes` | 11 | 12 | 0.0167 | 20 | 10 | 10 | 1 |
| `stallOutcomes.repeats` | 4 | 4 | 0 | 8 | 4 | 4 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1760 | 1734 | -0.4333 | 55 | 26 | 29 | 0.7877 |
| `recon.contacts` | 96 | 85 | -0.1833 | 46 | 21 | 25 | 0.6587 |
| `recon.noContact` | 1118 | 1102 | -0.2667 | 50 | 21 | 29 | 0.3222 |
| `recon.timeouts` | 14 | 15 | 0.0167 | 21 | 10 | 11 | 1 |
| `recon.cancelled` | 470 | 467 | -0.05 | 53 | 29 | 24 | 0.5831 |
| `recon.reportsDelivered` | 396 | 409 | 0.2167 | 48 | 26 | 22 | 0.6655 |
| `recon.retriggerBlocked` | 1374 | 1332 | -0.7 | 55 | 23 | 32 | 0.2806 |
| `squadPerformance.meanOverall` | 4795.200000000002 | 4805.7 | 0.175 | 60 | 35 | 25 | 0.2451 |
| `squadPerformance.p10Overall` | 4478.9 | 4476.7 | -0.0367 | 33 | 16 | 17 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3770.599999999999 | 3737.1999999999994 | -0.5567 | 60 | 27 | 33 | 0.519 |
| `squadPerformance.meanMovement` | 5984.099999999999 | 5983.300000000002 | -0.0133 | 37 | 15 | 22 | 0.324 |
| `squadPerformance.meanControl` | 5593 | 5640.600000000004 | 0.7933 | 58 | 37 | 21 | 0.0479 |
| `squadPerformance.meanCohesion` | 5412.599999999999 | 5457.299999999998 | 0.745 | 60 | 36 | 24 | 0.155 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr698-rl-0001 0.15 s (timeline) · pr698-rl-0002 0.15 s (timeline) · pr698-rl-0003 0.15 s (timeline) · pr698-rl-0004 0.15 s (timeline) · pr698-rl-0005 0.15 s (timeline) · pr698-rl-0006 0.15 s (timeline) · pr698-rl-0007 0.15 s (timeline) · pr698-rl-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1467&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1467`); it opens the seed that parts earliest, and the dropdowns choose another.

