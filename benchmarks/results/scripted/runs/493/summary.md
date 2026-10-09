# Benchmark run #493 · 20 seeds from `hedge418a` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `coverPeek=1`
- work/hedge-firing-lane-review @ 31e4ea3 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37885637776) · build v29-dev

## Verdict

**INERT: all 141 pairs identical in every field**


## Paired comparison (off against on)

- **141** pairs (unpaired: off 0, on 0) · identical in every field: **141** · runtime errors off 0 / on 0 · wall time on/off x1.009 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4147 | 4147 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1488 | 1488 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 2659 | 2659 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 5629 | 5629 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 1851 | 1851 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 33199 | 33199 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 250403 | 250403 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 65 | 65 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 260 | 260 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3276 | 3276 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 480 | 480 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1276 | 1276 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 723 | 723 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 730 | 730 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 2064 | 2064 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1371 | 1371 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 12284.599999999999 | 12284.599999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 11323.700000000012 | 11323.700000000012 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 10284.600000000006 | 10284.600000000006 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 13878.299999999994 | 13878.299999999994 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 13952.700000000003 | 13952.700000000003 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 12559.299999999997 | 12559.299999999997 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hedge418a-0001 (identical) · hedge418a-0002 (identical) · hedge418a-0003 (identical) · hedge418a-0004 (identical) · hedge418a-0005 (identical) · hedge418a-0006 (identical) · hedge418a-0007 (identical) · hedge418a-0009 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=493&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/hedge-firing-lane-review/ai_flow_live.html?bench=493&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=493`); it opens the seed that parts earliest, and the dropdowns choose another.

