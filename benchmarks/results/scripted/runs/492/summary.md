# Benchmark run #492 · 20 seeds from `hedge418a` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `coverPeek=1`
- work/hedge-firing-lane-review @ 31e4ea3 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37885635418) · build v29-dev

## Verdict

**INERT: all 144 pairs identical in every field**


## Paired comparison (off against on)

- **144** pairs (unpaired: off 0, on 0) · identical in every field: **144** · runtime errors off 0 / on 0 · wall time on/off x0.97 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4221 | 4221 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 2059 | 2059 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 2162 | 2162 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 5361 | 5361 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2042 | 2042 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 36874 | 36874 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 274905 | 274905 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 72 | 72 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 321 | 321 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3195 | 3195 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 368 | 368 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1267 | 1267 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 789 | 789 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 700 | 700 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 2180 | 2180 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1340 | 1340 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 12459.300000000005 | 12459.300000000005 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 11524.500000000018 | 11524.500000000018 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 10334.1 | 10334.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 14169.599999999999 | 14169.599999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 14252.899999999994 | 14252.899999999994 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 12696.900000000003 | 12696.900000000003 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hedge418a-0001 (identical) · hedge418a-0002 (identical) · hedge418a-0003 (identical) · hedge418a-0004 (identical) · hedge418a-0005 (identical) · hedge418a-0006 (identical) · hedge418a-0007 (identical) · hedge418a-0009 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=492&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/hedge-firing-lane-review/ai_flow_live.html?bench=492&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=492`); it opens the seed that parts earliest, and the dropdowns choose another.

