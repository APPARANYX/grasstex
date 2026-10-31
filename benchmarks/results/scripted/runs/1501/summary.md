# Benchmark run #1501 · 60 seeds from `c699` (ge-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&controllerClear=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/pin/c699-0760b932 @ 0760b93 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41232548107) · build v29-dev

## Verdict

**QUIET: 45 of 50 pairs changed (median first part 174.075 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -1.4% (p 0.4869)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **50** pairs (unpaired: off 0, on 0) · identical in every field: **5** · runtime errors off 0 / on 0 · wall time on/off x1.003 (gate 1.25)
- the 40 changed records first part at simulated second: min 114, p10 122.1, median 174.075, p90 214.05, max 261

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 696 | 686 | -0.2 | 33 | 14 | 19 | 0.4869 |
| `usKills` | 244 | 226 | -0.36 | 27 | 9 | 18 | 0.1221 |
| `geKills` | 452 | 460 | 0.16 | 33 | 18 | 15 | 0.7283 |
| `fire.total` | 16227 | 16853 | 12.52 | 38 | 22 | 16 | 0.4177 |
| `fire.hits` | 1526 | 1588 | 1.24 | 35 | 16 | 19 | 0.7359 |
| `retreatSamples` | 4542 | 5146 | 12.08 | 33 | 22 | 11 | 0.0801 |
| `movementResolver.changes` | 96048 | 96986 | 18.76 | 40 | 22 | 18 | 0.6358 |
| `grenades.throws` | 25 | 21 | -0.08 | 4 | 1 | 3 | 0.625 |
| `grenades.bursts` | 20 | 20 | 0 | 5 | 2 | 3 | 1 |
| `grenades.wounded` | 24 | 28 | 0.08 | 4 | 3 | 1 | 0.625 |
| `grenades.casualties` | 8 | 10 | 0.04 | 4 | 3 | 1 | 0.625 |
| `grenades.suppressed` | 85 | 57 | -0.56 | 4 | 2 | 2 | 1 |
| `grenades.friendlyWounded` | 1 | 0 | -0.02 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 4 | 1 | -0.06 | 4 | 1 | 3 | 0.625 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 3 | 0.04 | 2 | 2 | 0 | 0.5 |
| `loopAlerts.length` | 384 | 372 | -0.24 | 31 | 14 | 17 | 0.7201 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 69 | 66 | -0.06 | 19 | 8 | 11 | 0.6476 |
| `stallOutcomes.wakes` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1178 | 1200 | 0.44 | 33 | 17 | 16 | 1 |
| `recon.contacts` | 177 | 169 | -0.16 | 29 | 9 | 20 | 0.0614 |
| `recon.noContact` | 349 | 345 | -0.08 | 10 | 3 | 7 | 0.3438 |
| `recon.timeouts` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 595 | 631 | 0.72 | 34 | 21 | 13 | 0.2295 |
| `recon.reportsDelivered` | 825 | 777 | -0.96 | 32 | 13 | 19 | 0.3771 |
| `recon.retriggerBlocked` | 453 | 444 | -0.18 | 13 | 4 | 9 | 0.2668 |
| `squadPerformance.meanOverall` | 4355.699999999999 | 4348.9 | -0.136 | 38 | 18 | 20 | 0.8714 |
| `squadPerformance.p10Overall` | 3916.9000000000005 | 3913 | -0.078 | 34 | 15 | 19 | 0.6076 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3960.7999999999993 | 3947.5 | -0.266 | 36 | 20 | 16 | 0.6177 |
| `squadPerformance.meanMovement` | 4979.2 | 4981.5 | 0.046 | 27 | 15 | 12 | 0.7011 |
| `squadPerformance.meanControl` | 4750.500000000001 | 4766.299999999999 | 0.316 | 34 | 20 | 14 | 0.3915 |
| `squadPerformance.meanCohesion` | 4308.599999999999 | 4314.1 | 0.11 | 38 | 20 | 18 | 0.8714 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c699-0042 114 s (timeline) · c699-0045 115.05 s (timeline) · c699-0009 117 s (timeline) · c699-0025 122.1 s (timeline) · c699-0041 123 s (timeline) · c699-0046 123 s (timeline) · c699-0035 126 s (timeline) · c699-0037 128.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1501&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c699-0760b932/ai_flow_live.html?bench=1501&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1501`); it opens the seed that parts earliest, and the dropdowns choose another.

