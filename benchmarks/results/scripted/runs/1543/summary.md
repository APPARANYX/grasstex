# Benchmark run #1543 · 60 seeds from `c13ictl` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0`
- work/pin/c13i-6e32c30a @ 6e32c30 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41256908112) · build v29-dev

## Verdict

**INERT: all 60 pairs identical in every field**


## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **60** · runtime errors off 0 / on 0 · wall time on/off x1.006 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2684 | 2684 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1200 | 1200 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1484 | 1484 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 38579 | 38579 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 5962 | 5962 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 104891 | 104891 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 207255 | 207255 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 37 | 37 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 37 | 37 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 52 | 52 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 97 | 97 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 288 | 288 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 663 | 663 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 201 | 201 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1684 | 1684 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 102 | 102 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1073 | 1073 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 423 | 423 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 486 | 486 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1306 | 1306 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4813.099999999999 | 4813.099999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4482.299999999999 | 4482.299999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3755.9000000000005 | 3755.9000000000005 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5985.700000000003 | 5985.700000000003 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5642.1 | 5642.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5455.9 | 5455.9 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

c13ictl-0001 (identical) · c13ictl-0002 (identical) · c13ictl-0003 (identical) · c13ictl-0004 (identical) · c13ictl-0005 (identical) · c13ictl-0006 (identical) · c13ictl-0007 (identical) · c13ictl-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1543&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-c13i-6e32c30a/ai_flow_live.html?bench=1543&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1543`); it opens the seed that parts earliest, and the dropdowns choose another.

