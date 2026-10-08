# Benchmark run #403 · 60 seeds from `control` (ge-defend), windows `every120`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ be66725 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37772734516) · build v29-dev

## Verdict

**INERT: all 276 pairs identical in every field**


## Paired comparison (off against on)

- **276** pairs (unpaired: off 0, on 0) · identical in every field: **276** · runtime errors off 0 / on 0 · wall time on/off x0.97 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5336 | 5336 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 2359 | 2359 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 2977 | 2977 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 13127 | 13127 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 4589 | 4589 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 74750 | 74750 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 405355 | 405355 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 133 | 133 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 332 | 332 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 134 | 134 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 44 | 44 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 157 | 157 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 11448 | 11448 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 764 | 764 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 4466 | 4466 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 4108 | 4108 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 1751 | 1751 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 3580 | 3580 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 4795 | 4795 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 24458 | 24458 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 22835.59999999998 | 22835.59999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21951.59999999996 | 21951.59999999996 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 27398.499999999993 | 27398.499999999993 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 27454.499999999978 | 27454.499999999978 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 23037.199999999993 | 23037.199999999993 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0001 (identical) · control-0002 (identical) · control-0003 (identical) · control-0004 (identical) · control-0005 (identical) · control-0006 (identical) · control-0007 (identical) · control-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=403&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=403`); it opens the seed that parts earliest, and the dropdowns choose another.

