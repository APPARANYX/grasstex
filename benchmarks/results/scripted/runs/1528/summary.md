# Benchmark run #1528 · 60 seeds from `nse-c` (us-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&navStationExit=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/nse-c4a65b24 @ c4a65b2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41243686066) · build v29-dev

## Verdict

**WEAK: 34 of 60 pairs changed (median first part 261.6 s); 2 of 42 counters under p 0.05 (about 2.1 by chance); casualties +1.3% (p 0.7744)**

- Under 0.05 only: recon.cancelled 1214 to 1162 (-4.3%, p 0.0117); recon.orders 2694 to 2632 (-2.3%, p 0.0386).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **26** · runtime errors off 0 / on 0 · wall time on/off x1.013 (gate 1.25)
- the 16 changed records first part at simulated second: min 162, p10 190.05, median 261.6, p90 411.15, max 441

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2154 | 2182 | 0.4667 | 12 | 7 | 5 | 0.7744 |
| `usKills` | 986 | 1022 | 0.6 | 12 | 7 | 5 | 0.7744 |
| `geKills` | 1168 | 1160 | -0.1333 | 11 | 4 | 7 | 0.5488 |
| `fire.total` | 62084 | 61769 | -5.25 | 12 | 4 | 8 | 0.3877 |
| `fire.hits` | 4903 | 4970 | 1.1167 | 12 | 8 | 4 | 0.3877 |
| `retreatSamples` | 145664 | 148850 | 53.1 | 11 | 9 | 2 | 0.0654 |
| `movementResolver.changes` | 200114 | 199598 | -8.6 | 14 | 6 | 8 | 0.7905 |
| `grenades.throws` | 41 | 43 | 0.0333 | 4 | 2 | 2 | 1 |
| `grenades.bursts` | 40 | 43 | 0.05 | 3 | 2 | 1 | 1 |
| `grenades.wounded` | 27 | 28 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.casualties` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 82 | 95 | 0.2167 | 1 | 1 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 9 | 8 | -0.0167 | 3 | 1 | 2 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 94 | 90 | -0.0667 | 6 | 3 | 3 | 1 |
| `loopAlerts.length` | 877 | 878 | 0.0167 | 3 | 2 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 269 | 256 | -0.2167 | 7 | 3 | 4 | 1 |
| `stallOutcomes.wakes` | 8 | 6 | -0.0333 | 1 | 0 | 1 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2694 | 2632 | -1.0333 | 12 | 2 | 10 | 0.0386 |
| `recon.contacts` | 677 | 657 | -0.3333 | 12 | 6 | 6 | 1 |
| `recon.noContact` | 693 | 710 | 0.2833 | 9 | 5 | 4 | 1 |
| `recon.timeouts` | 38 | 39 | 0.0167 | 3 | 2 | 1 | 1 |
| `recon.cancelled` | 1214 | 1162 | -0.8667 | 11 | 1 | 10 | 0.0117 |
| `recon.reportsDelivered` | 2717 | 2675 | -0.7 | 11 | 5 | 6 | 1 |
| `recon.retriggerBlocked` | 789 | 782 | -0.1167 | 10 | 4 | 6 | 0.7539 |
| `squadPerformance.meanOverall` | 4896.0999999999985 | 4891.000000000001 | -0.085 | 10 | 3 | 7 | 0.3438 |
| `squadPerformance.p10Overall` | 4554.3 | 4554.8 | 0.0083 | 5 | 3 | 2 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3816.7000000000003 | 3809.6000000000004 | -0.1183 | 11 | 5 | 6 | 1 |
| `squadPerformance.meanMovement` | 5990.400000000002 | 5990.500000000001 | 0.0017 | 5 | 3 | 2 | 1 |
| `squadPerformance.meanControl` | 5755.5 | 5756.6 | 0.0183 | 9 | 5 | 4 | 1 |
| `squadPerformance.meanCohesion` | 5556.4 | 5560.9 | 0.075 | 11 | 6 | 5 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

nse-c-0019 162 s (stress) · nse-c-0015 190.05 s (timeline) · nse-c-0027 200.1 s (timeline) · nse-c-0051 203.1 s (timeline) · nse-c-0045 212.1 s (timeline) · nse-c-0002 228 s (timeline) · nse-c-0022 251.1 s (timeline) · nse-c-0006 257.1 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1528&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-nse-c4a65b24/ai_flow_live.html?bench=1528&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1528`); it opens the seed that parts earliest, and the dropdowns choose another.

