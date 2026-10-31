# Benchmark run #1457 · 60 seeds from `cfr-20261031-g` (ge-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&contactFireResume=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/benchmark-launch/contactfire-resume-20261031 @ 2d2f546 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41184282816) · build v29-dev

## Verdict

**WEAK: 60 of 60 pairs changed (median first part 165 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties -7.0% (p 0.0984)**

- Under 0.05 only: movementResolver.changes 164497 to 159983 (-2.7%, p 0.0222).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.001 (gate 1.25)
- the 57 changed records first part at simulated second: min 124.05, p10 132, median 165, p90 219, max 252

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1948 | 1811 | -2.2833 | 53 | 20 | 33 | 0.0984 |
| `usKills` | 789 | 708 | -1.35 | 54 | 23 | 31 | 0.3409 |
| `geKills` | 1159 | 1103 | -0.9333 | 50 | 24 | 26 | 0.8877 |
| `fire.total` | 43153 | 43362 | 3.4833 | 57 | 26 | 31 | 0.5966 |
| `fire.hits` | 4336 | 4078 | -4.3 | 56 | 23 | 33 | 0.2288 |
| `retreatSamples` | 117781 | 112776 | -83.4167 | 57 | 25 | 32 | 0.427 |
| `movementResolver.changes` | 164497 | 159983 | -75.2333 | 56 | 19 | 37 | 0.0222 |
| `grenades.throws` | 71 | 50 | -0.35 | 27 | 8 | 19 | 0.0522 |
| `grenades.bursts` | 71 | 50 | -0.35 | 27 | 8 | 19 | 0.0522 |
| `grenades.wounded` | 66 | 58 | -0.1333 | 15 | 5 | 10 | 0.3018 |
| `grenades.casualties` | 16 | 14 | -0.0333 | 11 | 4 | 7 | 0.5488 |
| `grenades.suppressed` | 204 | 151 | -0.8833 | 21 | 6 | 15 | 0.0784 |
| `grenades.friendlyWounded` | 4 | 7 | 0.05 | 8 | 6 | 2 | 0.2891 |
| `grenades.friendlyCasualties` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `grenades.aborted` | 9 | 13 | 0.0667 | 11 | 7 | 4 | 0.5488 |
| `movementStalls.length` | 2 | 1 | -0.0167 | 2 | 1 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 84 | 69 | -0.25 | 30 | 14 | 16 | 0.8555 |
| `loopAlerts.length` | 891 | 893 | 0.0333 | 22 | 11 | 11 | 1 |
| `writerConflicts` | 15 | 4 | -0.1833 | 4 | 1 | 3 | 0.625 |
| `regroups.entries` | 419 | 494 | 1.25 | 49 | 28 | 21 | 0.3916 |
| `stallOutcomes.wakes` | 110 | 108 | -0.0333 | 18 | 8 | 10 | 0.8145 |
| `stallOutcomes.repeats` | 16 | 16 | 0 | 4 | 2 | 2 | 1 |
| `timeline.stalledOnsets` | 2 | 1 | -0.0167 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamples` | 6 | 18 | 0.2 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 2 | 1 | -0.0167 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 6 | 18 | 0.2 | 2 | 1 | 1 | 1 |
| `recon.orders` | 2383 | 2501 | 1.9667 | 54 | 27 | 27 | 1 |
| `recon.contacts` | 484 | 584 | 1.6667 | 51 | 31 | 20 | 0.1608 |
| `recon.noContact` | 552 | 570 | 0.3 | 49 | 26 | 23 | 0.7754 |
| `recon.timeouts` | 43 | 50 | 0.1167 | 25 | 14 | 11 | 0.69 |
| `recon.cancelled` | 1281 | 1263 | -0.3 | 51 | 21 | 30 | 0.2624 |
| `recon.reportsDelivered` | 2108 | 2385 | 4.6167 | 55 | 35 | 20 | 0.0581 |
| `recon.retriggerBlocked` | 706 | 684 | -0.3667 | 52 | 24 | 28 | 0.6778 |
| `squadPerformance.meanOverall` | 4942.799999999999 | 4955.700000000002 | 0.215 | 56 | 34 | 22 | 0.1409 |
| `squadPerformance.p10Overall` | 4540.0999999999985 | 4530.7 | -0.1567 | 34 | 16 | 18 | 0.8642 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4010.999999999999 | 4009.6 | -0.0233 | 57 | 29 | 28 | 1 |
| `squadPerformance.meanMovement` | 5988.699999999997 | 5988.8 | 0.0017 | 34 | 16 | 18 | 0.8642 |
| `squadPerformance.meanControl` | 5649.8 | 5648.4000000000015 | -0.0233 | 57 | 30 | 27 | 0.7914 |
| `squadPerformance.meanCohesion` | 5508.299999999998 | 5520.400000000001 | 0.2017 | 57 | 32 | 25 | 0.427 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

cfr-20261031-g-0020 124.05 s (timeline) · cfr-20261031-g-0021 127.05 s (timeline) · cfr-20261031-g-0036 129 s (timeline) · cfr-20261031-g-0015 131.1 s (timeline) · cfr-20261031-g-0053 131.1 s (timeline) · cfr-20261031-g-0006 132 s (timeline) · cfr-20261031-g-0057 132 s (timeline) · cfr-20261031-g-0060 133.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1457&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/benchmark-launch-contactfire-resume-20261031/ai_flow_live.html?bench=1457&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1457`); it opens the seed that parts earliest, and the dropdowns choose another.

