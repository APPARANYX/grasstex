# Benchmark run #504 · scripted scenario `live-mv0z6zy9-4lhnw` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `none`
- work/crest431-exposed-shot-fix @ 4617844 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37958420982) · build v29-dev

## Verdict

**INERT: all 6 pairs identical in every field**


## Paired comparison (off against on)

- **6** pairs (unpaired: off 0, on 0) · identical in every field: **6** · runtime errors off 0 / on 0 · wall time on/off x0.951 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 245 | 245 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 138 | 138 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 107 | 107 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 246 | 246 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 95 | 95 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 592 | 592 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 16466 | 16466 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 147 | 147 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 93 | 93 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 41 | 41 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 40 | 40 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 119 | 119 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 524.3 | 524.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 468.9 | 468.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 459.69999999999993 | 459.69999999999993 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 573.4000000000001 | 573.4000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 589.1 | 589.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 523.3000000000001 | 523.3000000000001 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

live-mv0z6zy9-4lhnw (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=504&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/crest431-exposed-shot-fix/ai_flow_live.html?bench=504&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=504`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

