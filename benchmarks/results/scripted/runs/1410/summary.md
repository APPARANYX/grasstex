# Benchmark run #1410 · 60 seeds from `pr683-gate-20261029` (ge-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0`
- work/pin/pr683-f845a2d6 @ f845a2d · [run](https://github.com/APPARANYX/grasstex/actions/runs/40907010062) · build v29-dev

## Verdict

**INERT: all 54 pairs identical in every field**


## Paired comparison (off against on)

- **54** pairs (unpaired: off 0, on 0) · identical in every field: **54** · runtime errors off 0 / on 0 · wall time on/off x0.975 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1295 | 1295 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 483 | 483 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 812 | 812 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 6165 | 6165 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2398 | 2398 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 7555 | 7555 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 67240 | 67240 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 90 | 90 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 72 | 72 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 827 | 827 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 78 | 78 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 483 | 483 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 198 | 198 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 373 | 373 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 482 | 482 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4762.200000000001 | 4762.200000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4296.999999999999 | 4296.999999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4369.200000000001 | 4369.200000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5382.600000000002 | 5382.600000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5322.300000000002 | 5322.300000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4771.6 | 4771.6 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr683-gate-20261029-0001 (identical) · pr683-gate-20261029-0002 (identical) · pr683-gate-20261029-0003 (identical) · pr683-gate-20261029-0004 (identical) · pr683-gate-20261029-0005 (identical) · pr683-gate-20261029-0006 (identical) · pr683-gate-20261029-0007 (identical) · pr683-gate-20261029-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1410&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pr683-f845a2d6/ai_flow_live.html?bench=1410&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1410`); it opens the seed that parts earliest, and the dropdowns choose another.

