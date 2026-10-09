# Benchmark run #491 · 20 seeds from `hedge418a` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `coverPeek=1`
- work/hedge-firing-lane-review @ 31e4ea3 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37885633209) · build v29-dev

## Verdict

**INERT: all 146 pairs identical in every field**


## Paired comparison (off against on)

- **146** pairs (unpaired: off 0, on 0) · identical in every field: **146** · runtime errors off 0 / on 0 · wall time on/off x0.988 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5180 | 5180 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 2552 | 2552 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 2628 | 2628 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 6856 | 6856 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2498 | 2498 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 30008 | 30008 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 380052 | 380052 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 89 | 89 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 78 | 78 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 325 | 325 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 28 | 28 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3484 | 3484 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 151 | 151 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 2334 | 2334 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 89 | 89 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 849 | 849 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 498 | 498 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 2868 | 2868 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 12483.500000000002 | 12483.500000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 11592.700000000008 | 11592.700000000008 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 10171.200000000006 | 10171.200000000006 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 14256.3 | 14256.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 14406.699999999995 | 14406.699999999995 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 12735.799999999994 | 12735.799999999994 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hedge418a-0001 (identical) · hedge418a-0002 (identical) · hedge418a-0003 (identical) · hedge418a-0004 (identical) · hedge418a-0005 (identical) · hedge418a-0006 (identical) · hedge418a-0007 (identical) · hedge418a-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=491&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/hedge-firing-lane-review/ai_flow_live.html?bench=491&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=491`); it opens the seed that parts earliest, and the dropdowns choose another.

