# Benchmark run #1409 · 60 seeds from `pr683-gate-20261029` (meeting), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0`
- work/pin/main-b913a742 @ b913a74 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40906989545) · build v29-dev

## Verdict

**INERT: all 60 pairs identical in every field**


## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **60** · runtime errors off 0 / on 0 · wall time on/off x1.003 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1614 | 1614 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 765 | 765 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 849 | 849 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 7413 | 7413 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 3123 | 3123 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 8013 | 8013 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 123774 | 123774 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 164 | 164 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 94 | 94 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1213 | 1213 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 51 | 51 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 843 | 843 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 297 | 297 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 214 | 214 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 991 | 991 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 5157.699999999999 | 5157.699999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4607.7 | 4607.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4531.999999999999 | 4531.999999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5941.600000000001 | 5941.600000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5823.7 | 5823.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5343.4000000000015 | 5343.4000000000015 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr683-gate-20261029-0001 (identical) · pr683-gate-20261029-0002 (identical) · pr683-gate-20261029-0003 (identical) · pr683-gate-20261029-0004 (identical) · pr683-gate-20261029-0005 (identical) · pr683-gate-20261029-0006 (identical) · pr683-gate-20261029-0007 (identical) · pr683-gate-20261029-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1409&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-main-b913a742/ai_flow_live.html?bench=1409&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1409`); it opens the seed that parts earliest, and the dropdowns choose another.

