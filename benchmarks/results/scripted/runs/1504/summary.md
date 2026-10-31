# Benchmark run #1504 · 60 seeds from `ncs-c` (us-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&navCornerStand=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/ncs-7e1ed1e1 @ 7e1ed1e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41233997349) · build v29-dev

## Verdict

**QUIET: 7 of 60 pairs changed (median first part 252 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **53** · runtime errors off 0 / on 0 · wall time on/off x0.974 (gate 1.25)
- the 3 changed records first part at simulated second: min 243, p10 243, median 252, p90 386.1, max 386.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2123 | 2122 | -0.0167 | 2 | 1 | 1 | 1 |
| `usKills` | 963 | 950 | -0.2167 | 3 | 0 | 3 | 0.25 |
| `geKills` | 1160 | 1172 | 0.2 | 3 | 2 | 1 | 1 |
| `fire.total` | 54520 | 54936 | 6.9333 | 3 | 2 | 1 | 1 |
| `fire.hits` | 4947 | 4964 | 0.2833 | 3 | 1 | 2 | 1 |
| `retreatSamples` | 129113 | 129286 | 2.8833 | 3 | 2 | 1 | 1 |
| `movementResolver.changes` | 175555 | 176854 | 21.65 | 3 | 2 | 1 | 1 |
| `grenades.throws` | 69 | 70 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.bursts` | 69 | 70 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.wounded` | 36 | 36 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 77 | 76 | -0.0167 | 1 | 0 | 1 | 1 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 103 | 99 | -0.0667 | 2 | 0 | 2 | 0.5 |
| `loopAlerts.length` | 784 | 785 | 0.0167 | 1 | 1 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 216 | 221 | 0.0833 | 3 | 3 | 0 | 0.25 |
| `stallOutcomes.wakes` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2397 | 2399 | 0.0333 | 3 | 2 | 1 | 1 |
| `recon.contacts` | 524 | 514 | -0.1667 | 3 | 1 | 2 | 1 |
| `recon.noContact` | 606 | 609 | 0.05 | 2 | 2 | 0 | 0.5 |
| `recon.timeouts` | 42 | 45 | 0.05 | 1 | 1 | 0 | 1 |
| `recon.cancelled` | 1134 | 1139 | 0.0833 | 1 | 1 | 0 | 1 |
| `recon.reportsDelivered` | 2023 | 2038 | 0.25 | 3 | 2 | 1 | 1 |
| `recon.retriggerBlocked` | 678 | 682 | 0.0667 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanOverall` | 5006.4 | 5005.299999999999 | -0.0183 | 2 | 0 | 2 | 0.5 |
| `squadPerformance.p10Overall` | 4680.900000000001 | 4680.900000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4025 | 4020.6 | -0.0733 | 2 | 0 | 2 | 0.5 |
| `squadPerformance.meanMovement` | 5992.3 | 5992.3 | 0 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanControl` | 5768.800000000001 | 5768.3 | -0.0083 | 2 | 0 | 2 | 0.5 |
| `squadPerformance.meanCohesion` | 5614.499999999999 | 5617.299999999999 | 0.0467 | 3 | 2 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

ncs-c-0004 243 s (stress) · ncs-c-0031 252 s (timeline) · ncs-c-0060 386.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1504&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-ncs-7e1ed1e1/ai_flow_live.html?bench=1504&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1504`); it opens the seed that parts earliest, and the dropdowns choose another.

