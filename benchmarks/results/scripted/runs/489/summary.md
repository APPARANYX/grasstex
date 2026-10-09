# Benchmark run #489 · scripted scenario `hill-0002` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `none`
- work/issue361-pinned-main-hill @ 22509a5 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37881034791) · build v29-dev

## Verdict

**INERT: all 9 pairs identical in every field**


## Paired comparison (off against on)

- **9** pairs (unpaired: off 0, on 0) · identical in every field: **9** · runtime errors off 0 / on 0 · wall time on/off x0.965 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 330 | 330 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 125 | 125 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 205 | 205 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 332 | 332 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 123 | 123 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 2791 | 2791 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 16329 | 16329 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 156 | 156 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 63 | 63 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 60 | 60 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 104 | 104 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 91 | 91 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 774.9 | 774.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 719.1000000000001 | 719.1000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 610.9 | 610.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 897.6 | 897.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 899.5 | 899.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 808.3 | 808.3 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

hill-0002 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=489&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/issue361-pinned-main-hill/ai_flow_live.html?bench=489&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=489`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

