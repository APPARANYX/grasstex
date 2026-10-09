# Benchmark run #490 · scripted scenario `hill-0008` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `none`
- work/issue361-pinned-main-hill @ 22509a5 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37881036834) · build v29-dev

## Verdict

**INERT: all 8 pairs identical in every field**


## Paired comparison (off against on)

- **8** pairs (unpaired: off 0, on 0) · identical in every field: **8** · runtime errors off 0 / on 0 · wall time on/off x1.052 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 163 | 163 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 99 | 99 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 64 | 64 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 209 | 209 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 75 | 75 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1253 | 1253 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 16472 | 16472 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 205 | 205 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 62 | 62 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 77 | 77 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 42 | 42 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 72 | 72 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 91 | 91 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 606.8000000000001 | 606.8000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 560.1999999999999 | 560.1999999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 526.5000000000001 | 526.5000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 684.5 | 684.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 697.4 | 697.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 584.3000000000001 | 584.3000000000001 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

hill-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=490&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/issue361-pinned-main-hill/ai_flow_live.html?bench=490&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=490`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

