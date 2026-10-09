# Benchmark run #494 · 20 seeds from `hedge418a` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `coverPeek=1`
- work/hedge-firing-lane-review @ 7d1dec1 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37886408040) · build v29-dev

## Verdict

**INERT: all 146 pairs identical in every field**


## Paired comparison (off against on)

- **146** pairs (unpaired: off 0, on 0) · identical in every field: **146** · runtime errors off 0 / on 0 · wall time on/off x0.967 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5218 | 5218 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 2579 | 2579 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 2639 | 2639 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 6994 | 6994 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2524 | 2524 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 30531 | 30531 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 380190 | 380190 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 91 | 91 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 75 | 75 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 324 | 324 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 28 | 28 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3467 | 3467 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 151 | 151 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 2330 | 2330 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 85 | 85 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 843 | 843 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 498 | 498 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 2863 | 2863 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 12566.9 | 12566.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 11673.100000000008 | 11673.100000000008 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 10229.600000000008 | 10229.600000000008 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 14353.899999999998 | 14353.899999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 14508.399999999996 | 14508.399999999996 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 12828.699999999993 | 12828.699999999993 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hedge418a-0001 (identical) · hedge418a-0002 (identical) · hedge418a-0003 (identical) · hedge418a-0004 (identical) · hedge418a-0005 (identical) · hedge418a-0006 (identical) · hedge418a-0007 (identical) · hedge418a-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=494&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/hedge-firing-lane-review/ai_flow_live.html?bench=494&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=494`); it opens the seed that parts earliest, and the dropdowns choose another.

