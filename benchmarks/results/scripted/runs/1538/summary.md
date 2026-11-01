# Benchmark run #1538 · 60 seeds from `c13i` (meeting), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerAssault=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c13i-6e32c30a @ 6e32c30 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41256727429) · build v29-dev

## Verdict

**QUIET: 58 of 60 pairs changed (median first part 251.1 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.8% (p 0.7838)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **2** · runtime errors off 0 / on 0 · wall time on/off x0.987 (gate 1.25)
- the 57 changed records first part at simulated second: min 181.05, p10 196.05, median 251.1, p90 327, max 401.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2419 | 2400 | -0.3167 | 53 | 25 | 28 | 0.7838 |
| `usKills` | 1002 | 1038 | 0.6 | 53 | 22 | 31 | 0.2717 |
| `geKills` | 1417 | 1362 | -0.9167 | 54 | 26 | 28 | 0.8919 |
| `fire.total` | 63622 | 64792 | 19.5 | 57 | 31 | 26 | 0.5966 |
| `fire.hits` | 5351 | 5169 | -3.0333 | 54 | 25 | 29 | 0.6835 |
| `retreatSamples` | 119576 | 116919 | -44.2833 | 57 | 25 | 32 | 0.427 |
| `movementResolver.changes` | 280372 | 280264 | -1.8 | 57 | 31 | 26 | 0.5966 |
| `grenades.throws` | 40 | 46 | 0.1 | 22 | 13 | 9 | 0.5235 |
| `grenades.bursts` | 39 | 44 | 0.0833 | 22 | 13 | 9 | 0.5235 |
| `grenades.wounded` | 42 | 39 | -0.05 | 8 | 3 | 5 | 0.7266 |
| `grenades.casualties` | 18 | 15 | -0.05 | 6 | 2 | 4 | 0.6875 |
| `grenades.suppressed` | 79 | 65 | -0.2333 | 12 | 5 | 7 | 0.7744 |
| `grenades.friendlyWounded` | 3 | 3 | 0 | 2 | 1 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 4 | 8 | 0.0667 | 7 | 4 | 3 | 1 |
| `movementStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 278 | 287 | 0.15 | 47 | 23 | 24 | 1 |
| `loopAlerts.length` | 1004 | 989 | -0.25 | 30 | 13 | 17 | 0.5847 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 358 | 302 | -0.9333 | 50 | 18 | 32 | 0.0649 |
| `stallOutcomes.wakes` | 8 | 5 | -0.05 | 8 | 3 | 5 | 0.7266 |
| `stallOutcomes.repeats` | 4 | 2 | -0.0333 | 5 | 2 | 3 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1701 | 1716 | 0.25 | 54 | 27 | 27 | 1 |
| `recon.contacts` | 98 | 105 | 0.1167 | 34 | 18 | 16 | 0.8642 |
| `recon.noContact` | 862 | 877 | 0.25 | 46 | 25 | 21 | 0.6587 |
| `recon.timeouts` | 10 | 6 | -0.0667 | 8 | 2 | 6 | 0.2891 |
| `recon.cancelled` | 658 | 666 | 0.1333 | 48 | 24 | 24 | 1 |
| `recon.reportsDelivered` | 476 | 510 | 0.5667 | 33 | 16 | 17 | 1 |
| `recon.retriggerBlocked` | 1316 | 1338 | 0.3667 | 49 | 24 | 25 | 1 |
| `squadPerformance.meanOverall` | 4781.700000000001 | 4798.599999999999 | 0.2817 | 55 | 30 | 25 | 0.5901 |
| `squadPerformance.p10Overall` | 4470.899999999999 | 4488.799999999999 | 0.2983 | 25 | 17 | 8 | 0.1078 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3602.7000000000007 | 3639.9 | 0.62 | 56 | 30 | 26 | 0.6889 |
| `squadPerformance.meanMovement` | 5979 | 5977.9000000000015 | -0.0183 | 39 | 13 | 26 | 0.0533 |
| `squadPerformance.meanControl` | 5592.700000000002 | 5593.700000000001 | 0.0167 | 56 | 29 | 27 | 0.8939 |
| `squadPerformance.meanCohesion` | 5557.9000000000015 | 5558.9 | 0.0167 | 55 | 29 | 26 | 0.7877 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c13i-0046 181.05 s (timeline) · c13i-0021 188.1 s (timeline) · c13i-0015 190.05 s (timeline) · c13i-0055 191.1 s (timeline) · c13i-0009 192 s (timeline) · c13i-0040 196.05 s (timeline) · c13i-0018 201 s (timeline) · c13i-0044 205.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1538&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c13i-6e32c30a/ai_flow_live.html?bench=1538&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1538`); it opens the seed that parts earliest, and the dropdowns choose another.

