# Benchmark run #485 · scripted scenario `cenge-0007` (ge-defend), windows `every60`

- **OFF** flags: `retreatArrival=0` · **ON** flags: `none`
- work/retreat398-900-validation @ 000ff98 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37873896530) · build v29-dev

## Verdict

**INERT: all 15 pairs identical in every field**


## Paired comparison (off against on)

- **15** pairs (unpaired: off 0, on 0) · identical in every field: **15** · runtime errors off 0 / on 0 · wall time on/off x0.866 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 450 | 450 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 214 | 214 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 236 | 236 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 519 | 519 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 120 | 120 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 4443 | 4443 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 34774 | 34774 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 34 | 34 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 262 | 262 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 48 | 48 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 107 | 107 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 50 | 50 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 50 | 50 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 287 | 287 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 106 | 106 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 1311.5 | 1311.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 1229.6999999999998 | 1229.6999999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1070.8000000000002 | 1070.8000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 1485.7 | 1485.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 1497.7 | 1497.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 1337.3 | 1337.3 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

cenge-0007 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=485&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/retreat398-900-validation/ai_flow_live.html?bench=485&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=485`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

