# Benchmark run #477 · scripted scenario `hill-0002` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ 6bea24e · [run](https://github.com/APPARANYX/grasstex/actions/runs/37872061596) · build v29-dev

## Verdict

**INERT: all 8 pairs identical in every field**


## Paired comparison (off against on)

- **8** pairs (unpaired: off 0, on 0) · identical in every field: **8** · runtime errors off 0 / on 0 · wall time on/off x0.983 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 337 | 337 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 173 | 173 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 164 | 164 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 432 | 432 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 150 | 150 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 2467 | 2467 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 20207 | 20207 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 194 | 194 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 121 | 121 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 62 | 62 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 32 | 32 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 154 | 154 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 684.6 | 684.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 624.7 | 624.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 528.7 | 528.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 794.8 | 794.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 796.2 | 796.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 743.5999999999999 | 743.5999999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

hill-0002 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=477&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=477`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

