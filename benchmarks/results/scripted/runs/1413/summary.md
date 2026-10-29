# Benchmark run #1413 · 60 seeds from `pr683-gate-20261029` (us-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0`
- work/pin/pr683-f845a2d6 @ f845a2d · [run](https://github.com/APPARANYX/grasstex/actions/runs/40907034868) · build v29-dev

## Verdict

**INERT: all 54 pairs identical in every field**


## Paired comparison (off against on)

- **54** pairs (unpaired: off 0, on 0) · identical in every field: **54** · runtime errors off 0 / on 0 · wall time on/off x0.999 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1323 | 1323 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 674 | 674 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 649 | 649 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 6510 | 6510 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2542 | 2542 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 9020 | 9020 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 72700 | 72700 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 26 | 26 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 21 | 21 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 75 | 75 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 124 | 124 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 51 | 51 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 755 | 755 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 98 | 98 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 472 | 472 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 135 | 135 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 461 | 461 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 453 | 453 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4703.3 | 4703.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4155.199999999999 | 4155.199999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4209.3 | 4209.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5386.399999999999 | 5386.399999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5309.600000000001 | 5309.600000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4778.6 | 4778.6 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr683-gate-20261029-0001 (identical) · pr683-gate-20261029-0002 (identical) · pr683-gate-20261029-0003 (identical) · pr683-gate-20261029-0004 (identical) · pr683-gate-20261029-0005 (identical) · pr683-gate-20261029-0006 (identical) · pr683-gate-20261029-0007 (identical) · pr683-gate-20261029-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1413&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pr683-f845a2d6/ai_flow_live.html?bench=1413&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1413`); it opens the seed that parts earliest, and the dropdowns choose another.

