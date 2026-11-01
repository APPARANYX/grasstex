# Benchmark run #1548 · 60 seeds from `c13ictl` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0`
- work/pin/c13i-e761ef42 @ e761ef4 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41257028858) · build v29-dev

## Verdict

**INERT: all 60 pairs identical in every field**


## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **60** · runtime errors off 0 / on 0 · wall time on/off x1.021 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2104 | 2104 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 976 | 976 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1128 | 1128 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 31339 | 31339 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 4535 | 4535 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 110730 | 110730 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 150522 | 150522 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 60 | 60 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 60 | 60 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 62 | 62 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 24 | 24 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 155 | 155 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 101 | 101 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 569 | 569 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 202 | 202 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1440 | 1440 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 210 | 210 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 636 | 636 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 44 | 44 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 455 | 455 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 896 | 896 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 616 | 616 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 5000.200000000002 | 5000.200000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4651.3 | 4651.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4111.4 | 4111.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5993.899999999998 | 5993.899999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5777.1 | 5777.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5455.6 | 5455.6 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c13ictl-0001 (identical) · c13ictl-0002 (identical) · c13ictl-0003 (identical) · c13ictl-0004 (identical) · c13ictl-0005 (identical) · c13ictl-0006 (identical) · c13ictl-0007 (identical) · c13ictl-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1548&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c13i-e761ef42/ai_flow_live.html?bench=1548&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1548`); it opens the seed that parts earliest, and the dropdowns choose another.

