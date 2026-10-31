# Benchmark run #1527 · 60 seeds from `nse-l` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&navStationExit=0` · **ON** flags: `strategicInterception=0`
- work/pin/nse-c4a65b24 @ c4a65b2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41243626078) · build v29-dev

## Verdict

**QUIET: 25 of 60 pairs changed (median first part 282 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **35** · runtime errors off 0 / on 0 · wall time on/off x1.029 (gate 1.25)
- the 11 changed records first part at simulated second: min 218.1, p10 238.05, median 282, p90 555, max 566.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2696 | 2696 | 0 | 4 | 2 | 2 | 1 |
| `usKills` | 1167 | 1156 | -0.1833 | 4 | 1 | 3 | 0.625 |
| `geKills` | 1529 | 1540 | 0.1833 | 3 | 2 | 1 | 1 |
| `fire.total` | 38701 | 38131 | -9.5 | 5 | 1 | 4 | 0.375 |
| `fire.hits` | 5937 | 5865 | -1.2 | 4 | 1 | 3 | 0.625 |
| `retreatSamples` | 97079 | 97002 | -1.2833 | 4 | 2 | 2 | 1 |
| `movementResolver.changes` | 215546 | 215897 | 5.85 | 6 | 2 | 4 | 0.6875 |
| `grenades.throws` | 18 | 13 | -0.0833 | 2 | 1 | 1 | 1 |
| `grenades.bursts` | 18 | 13 | -0.0833 | 2 | 1 | 1 | 1 |
| `grenades.wounded` | 28 | 13 | -0.25 | 2 | 1 | 1 | 1 |
| `grenades.casualties` | 11 | 4 | -0.1167 | 2 | 1 | 1 | 1 |
| `grenades.suppressed` | 47 | 33 | -0.2333 | 2 | 1 | 1 | 1 |
| `grenades.friendlyWounded` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 1 | 0 | -0.0167 | 1 | 0 | 1 | 1 |
| `grenades.aborted` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 289 | 290 | 0.0167 | 4 | 3 | 1 | 0.625 |
| `loopAlerts.length` | 610 | 615 | 0.0833 | 4 | 2 | 2 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 226 | 230 | 0.0667 | 3 | 3 | 0 | 0.25 |
| `stallOutcomes.wakes` | 10 | 9 | -0.0167 | 2 | 1 | 1 | 1 |
| `stallOutcomes.repeats` | 6 | 4 | -0.0333 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1900 | 1909 | 0.15 | 2 | 2 | 0 | 0.5 |
| `recon.contacts` | 108 | 111 | 0.05 | 3 | 3 | 0 | 0.25 |
| `recon.noContact` | 1175 | 1180 | 0.0833 | 4 | 3 | 1 | 0.625 |
| `recon.timeouts` | 22 | 20 | -0.0333 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 516 | 518 | 0.0333 | 3 | 2 | 1 | 1 |
| `recon.reportsDelivered` | 475 | 488 | 0.2167 | 3 | 3 | 0 | 0.25 |
| `recon.retriggerBlocked` | 1442 | 1448 | 0.1 | 4 | 3 | 1 | 0.625 |
| `squadPerformance.meanOverall` | 4809.299999999999 | 4808.5999999999985 | -0.0117 | 4 | 2 | 2 | 1 |
| `squadPerformance.p10Overall` | 4471.1 | 4471.800000000001 | 0.0117 | 3 | 2 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3801.099999999999 | 3802.599999999999 | 0.025 | 4 | 2 | 2 | 1 |
| `squadPerformance.meanMovement` | 5983.099999999999 | 5983.099999999999 | 0 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanControl` | 5617.799999999999 | 5614.299999999999 | -0.0583 | 4 | 1 | 3 | 0.625 |
| `squadPerformance.meanCohesion` | 5411.9000000000015 | 5408.800000000002 | -0.0517 | 4 | 1 | 3 | 0.625 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

nse-l-0055 218.1 s (timeline) · nse-l-0004 238.05 s (timeline) · nse-l-0059 241.05 s (timeline) · nse-l-0040 249 s (stress) · nse-l-0022 259.05 s (timeline) · nse-l-0041 282 s (stress) · nse-l-0028 294 s (timeline) · nse-l-0011 513 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1527&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-nse-c4a65b24/ai_flow_live.html?bench=1527&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1527`); it opens the seed that parts earliest, and the dropdowns choose another.

