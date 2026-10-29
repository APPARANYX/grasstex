# Benchmark run #1411 · 60 seeds from `pr683-gate-20261029` (meeting), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0`
- work/pin/pr683-f845a2d6 @ f845a2d · [run](https://github.com/APPARANYX/grasstex/actions/runs/40907017421) · build v29-dev

## Verdict

**INERT: all 60 pairs identical in every field**


## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **60** · runtime errors off 0 / on 0 · wall time on/off x1.005 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1549 | 1549 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 735 | 735 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 814 | 814 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 7049 | 7049 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 3023 | 3023 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 8327 | 8327 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 123258 | 123258 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 162 | 162 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 96 | 96 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1213 | 1213 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 55 | 55 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 834 | 834 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 304 | 304 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 220 | 220 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 991 | 991 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 5142.399999999997 | 5142.399999999997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4603.2 | 4603.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4493.600000000001 | 4493.600000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5939 | 5939 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5829.099999999999 | 5829.099999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5335.7 | 5335.7 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr683-gate-20261029-0001 (identical) · pr683-gate-20261029-0002 (identical) · pr683-gate-20261029-0003 (identical) · pr683-gate-20261029-0004 (identical) · pr683-gate-20261029-0005 (identical) · pr683-gate-20261029-0006 (identical) · pr683-gate-20261029-0007 (identical) · pr683-gate-20261029-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1411&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pr683-f845a2d6/ai_flow_live.html?bench=1411&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1411`); it opens the seed that parts earliest, and the dropdowns choose another.

