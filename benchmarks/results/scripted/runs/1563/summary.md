# Benchmark run #1563 · 60 seeds from `c13ic` (ge-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerAssault=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c13i-057c1f7c @ 057c1f7 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41257906685) · build v29-dev

## Verdict

**WEAK: 59 of 60 pairs changed (median first part 222 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties -5.5% (p 0.4011)**

- Under 0.05 only: fire.total 61609 to 58774 (-4.6%, p 0.0402).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x0.921 (gate 1.25)
- the 56 changed records first part at simulated second: min 131.1, p10 149.1, median 222, p90 326.1, max 507

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2406 | 2273 | -2.2167 | 51 | 22 | 29 | 0.4011 |
| `usKills` | 1031 | 902 | -2.15 | 53 | 20 | 33 | 0.0984 |
| `geKills` | 1375 | 1371 | -0.0667 | 50 | 24 | 26 | 0.8877 |
| `fire.total` | 61609 | 58774 | -47.25 | 54 | 19 | 35 | 0.0402 |
| `fire.hits` | 5278 | 5005 | -4.55 | 54 | 25 | 29 | 0.6835 |
| `retreatSamples` | 141931 | 141028 | -15.05 | 55 | 27 | 28 | 1 |
| `movementResolver.changes` | 189497 | 186133 | -56.0667 | 55 | 24 | 31 | 0.4188 |
| `grenades.throws` | 54 | 45 | -0.15 | 21 | 8 | 13 | 0.3833 |
| `grenades.bursts` | 54 | 45 | -0.15 | 21 | 8 | 13 | 0.3833 |
| `grenades.wounded` | 48 | 40 | -0.1333 | 11 | 5 | 6 | 1 |
| `grenades.casualties` | 12 | 11 | -0.0167 | 5 | 3 | 2 | 1 |
| `grenades.suppressed` | 104 | 105 | 0.0167 | 16 | 8 | 8 | 1 |
| `grenades.friendlyWounded` | 8 | 4 | -0.0667 | 5 | 3 | 2 | 1 |
| `grenades.friendlyCasualties` | 5 | 2 | -0.05 | 3 | 1 | 2 | 1 |
| `grenades.aborted` | 12 | 2 | -0.1667 | 11 | 2 | 9 | 0.0654 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 86 | 80 | -0.1 | 37 | 18 | 19 | 1 |
| `loopAlerts.length` | 919 | 925 | 0.1 | 12 | 6 | 6 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 260 | 230 | -0.5 | 48 | 20 | 28 | 0.3123 |
| `stallOutcomes.wakes` | 8 | 6 | -0.0333 | 7 | 3 | 4 | 1 |
| `stallOutcomes.repeats` | 3 | 0 | -0.05 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2804 | 2810 | 0.1 | 53 | 25 | 28 | 0.7838 |
| `recon.contacts` | 661 | 637 | -0.4 | 49 | 27 | 22 | 0.5682 |
| `recon.noContact` | 623 | 637 | 0.2333 | 41 | 22 | 19 | 0.7552 |
| `recon.timeouts` | 37 | 39 | 0.0333 | 11 | 7 | 4 | 0.5488 |
| `recon.cancelled` | 1451 | 1449 | -0.0333 | 51 | 22 | 29 | 0.4011 |
| `recon.reportsDelivered` | 2627 | 2670 | 0.7167 | 52 | 32 | 20 | 0.1263 |
| `recon.retriggerBlocked` | 775 | 783 | 0.1333 | 36 | 17 | 19 | 0.8679 |
| `squadPerformance.meanOverall` | 4884.2 | 4880.900000000001 | -0.055 | 54 | 27 | 27 | 1 |
| `squadPerformance.p10Overall` | 4519.2 | 4506.200000000001 | -0.2167 | 26 | 9 | 17 | 0.1686 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3850.7000000000007 | 3844.199999999999 | -0.1083 | 55 | 27 | 28 | 1 |
| `squadPerformance.meanMovement` | 5991.099999999999 | 5990.9 | -0.0033 | 27 | 14 | 13 | 1 |
| `squadPerformance.meanControl` | 5710.4 | 5701.299999999997 | -0.1517 | 51 | 26 | 25 | 1 |
| `squadPerformance.meanCohesion` | 5516.200000000001 | 5525 | 0.1467 | 53 | 29 | 24 | 0.5831 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c13ic-0043 131.1 s (timeline) · c13ic-0059 131.1 s (timeline) · c13ic-0001 141 s (timeline) · c13ic-0045 141 s (timeline) · c13ic-0057 148.05 s (timeline) · c13ic-0007 149.1 s (timeline) · c13ic-0006 162 s (timeline) · c13ic-0041 163.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1563&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c13i-057c1f7c/ai_flow_live.html?bench=1563&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1563`); it opens the seed that parts earliest, and the dropdowns choose another.

