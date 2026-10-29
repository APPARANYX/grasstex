# Benchmark run #1412 · 60 seeds from `pr683-gate-20261029` (us-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0`
- work/pin/main-b913a742 @ b913a74 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40907020313) · build v29-dev

## Verdict

**INERT: all 54 pairs identical in every field**


## Paired comparison (off against on)

- **54** pairs (unpaired: off 0, on 0) · identical in every field: **54** · runtime errors off 0 / on 0 · wall time on/off x0.983 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1355 | 1355 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 666 | 666 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 689 | 689 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 6790 | 6790 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2616 | 2616 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 8561 | 8561 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 72530 | 72530 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 26 | 26 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 113 | 113 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 49 | 49 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 771 | 771 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 101 | 101 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 473 | 473 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 153 | 153 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 524 | 524 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 458 | 458 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4709.200000000001 | 4709.200000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4150.199999999999 | 4150.199999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4223.299999999999 | 4223.299999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5384.8 | 5384.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5314.000000000001 | 5314.000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4776.5999999999985 | 4776.5999999999985 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr683-gate-20261029-0001 (identical) · pr683-gate-20261029-0002 (identical) · pr683-gate-20261029-0003 (identical) · pr683-gate-20261029-0004 (identical) · pr683-gate-20261029-0005 (identical) · pr683-gate-20261029-0006 (identical) · pr683-gate-20261029-0007 (identical) · pr683-gate-20261029-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1412&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-main-b913a742/ai_flow_live.html?bench=1412&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1412`); it opens the seed that parts earliest, and the dropdowns choose another.

