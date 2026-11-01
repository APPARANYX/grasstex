# Benchmark run #1540 · 60 seeds from `c13i` (us-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerAssault=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c13i-6e32c30a @ 6e32c30 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41256761863) · build v29-dev

## Verdict

**WEAK: 57 of 60 pairs changed (median first part 207.525 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.9% (p 1)**

- Under 0.05 only: usKills 934 to 1012 (+8.4%, p 0.0226).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x0.92 (gate 1.25)
- the 48 changed records first part at simulated second: min 141, p10 170.1, median 207.525, p90 315, max 353.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2073 | 2091 | 0.3 | 47 | 24 | 23 | 1 |
| `usKills` | 934 | 1012 | 1.3 | 44 | 30 | 14 | 0.0226 |
| `geKills` | 1139 | 1079 | -1 | 47 | 21 | 26 | 0.5601 |
| `fire.total` | 63368 | 60232 | -52.2667 | 48 | 20 | 28 | 0.3123 |
| `fire.hits` | 4878 | 4962 | 1.4 | 48 | 24 | 24 | 1 |
| `retreatSamples` | 136482 | 139964 | 58.0333 | 48 | 29 | 19 | 0.1934 |
| `movementResolver.changes` | 181880 | 180045 | -30.5833 | 48 | 20 | 28 | 0.3123 |
| `grenades.throws` | 36 | 57 | 0.35 | 24 | 17 | 7 | 0.0639 |
| `grenades.bursts` | 36 | 57 | 0.35 | 24 | 17 | 7 | 0.0639 |
| `grenades.wounded` | 22 | 29 | 0.1167 | 13 | 9 | 4 | 0.2668 |
| `grenades.casualties` | 8 | 12 | 0.0667 | 9 | 6 | 3 | 0.5078 |
| `grenades.suppressed` | 52 | 68 | 0.2667 | 16 | 12 | 4 | 0.0768 |
| `grenades.friendlyWounded` | 3 | 1 | -0.0333 | 4 | 1 | 3 | 0.625 |
| `grenades.friendlyCasualties` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.aborted` | 11 | 5 | -0.1 | 7 | 3 | 4 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 95 | 70 | -0.4167 | 36 | 12 | 24 | 0.0652 |
| `loopAlerts.length` | 829 | 821 | -0.1333 | 10 | 3 | 7 | 0.3438 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 249 | 270 | 0.35 | 40 | 21 | 19 | 0.8746 |
| `stallOutcomes.wakes` | 2 | 3 | 0.0167 | 5 | 3 | 2 | 1 |
| `stallOutcomes.repeats` | 0 | 2 | 0.0333 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2394 | 2441 | 0.7833 | 45 | 24 | 21 | 0.766 |
| `recon.contacts` | 555 | 543 | -0.2 | 45 | 24 | 21 | 0.766 |
| `recon.noContact` | 642 | 686 | 0.7333 | 39 | 24 | 15 | 0.1996 |
| `recon.timeouts` | 24 | 35 | 0.1833 | 13 | 10 | 3 | 0.0923 |
| `recon.cancelled` | 1094 | 1094 | 0 | 44 | 19 | 25 | 0.4514 |
| `recon.reportsDelivered` | 2253 | 2132 | -2.0167 | 47 | 20 | 27 | 0.3817 |
| `recon.retriggerBlocked` | 702 | 711 | 0.15 | 42 | 22 | 20 | 0.8776 |
| `squadPerformance.meanOverall` | 4975.199999999997 | 4968.099999999998 | -0.1183 | 47 | 21 | 26 | 0.5601 |
| `squadPerformance.p10Overall` | 4644.2 | 4633.1 | -0.185 | 18 | 6 | 12 | 0.2379 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3990.8999999999987 | 3967.5999999999985 | -0.3883 | 48 | 22 | 26 | 0.6655 |
| `squadPerformance.meanMovement` | 5992.3 | 5992.3 | 0 | 25 | 12 | 13 | 1 |
| `squadPerformance.meanControl` | 5764.8 | 5780.899999999999 | 0.2683 | 47 | 25 | 22 | 0.7709 |
| `squadPerformance.meanCohesion` | 5553.099999999999 | 5570.3 | 0.2867 | 47 | 27 | 20 | 0.3817 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c13i-0059 141 s (timeline) · c13i-0030 152.1 s (timeline) · c13i-0052 153 s (timeline) · c13i-0049 155.1 s (timeline) · c13i-0024 170.1 s (timeline) · c13i-0040 172.05 s (timeline) · c13i-0013 175.05 s (timeline) · c13i-0036 175.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1540&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c13i-6e32c30a/ai_flow_live.html?bench=1540&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1540`); it opens the seed that parts earliest, and the dropdowns choose another.

