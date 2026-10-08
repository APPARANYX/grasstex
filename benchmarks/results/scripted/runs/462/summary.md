# Benchmark run #462 · scripted scenario `scripted-scout-0003` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `none`
- work/benchmark-diagnostic-evidence @ 7316aac · [run](https://github.com/APPARANYX/grasstex/actions/runs/37850255616) · build v29-dev

## Verdict

**INERT: all 8 pairs identical in every field**


## Paired comparison (off against on)

- **8** pairs (unpaired: off 0, on 0) · identical in every field: **8** · runtime errors off 0 / on 0 · wall time on/off x0.98 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 309 | 309 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 147 | 147 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 162 | 162 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 367 | 367 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 137 | 137 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 2903 | 2903 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 20262 | 20262 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 193 | 193 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 112 | 112 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 61 | 61 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 72 | 72 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 149 | 149 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 688.3000000000001 | 688.3000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 647.4000000000001 | 647.4000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 535.9 | 535.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 798.4 | 798.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 796.5 | 796.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 734 | 734 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

scripted-scout-0003 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=462&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/benchmark-diagnostic-evidence/ai_flow_live.html?bench=462&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=462`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

