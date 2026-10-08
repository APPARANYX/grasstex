# Benchmark run #402 · 60 seeds from `control` (us-defend), windows `every120`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ be66725 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37772730517) · build v29-dev

## Verdict

**INERT: all 276 pairs identical in every field**


## Paired comparison (off against on)

- **276** pairs (unpaired: off 0, on 0) · identical in every field: **276** · runtime errors off 0 / on 0 · wall time on/off x1.009 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 6135 | 6135 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 2793 | 2793 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 3342 | 3342 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 14958 | 14958 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 4979 | 4979 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 78707 | 78707 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 454576 | 454576 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 38 | 38 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 154 | 154 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 513 | 513 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 90 | 90 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 11985 | 11985 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 697 | 697 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 4837 | 4837 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 4038 | 4038 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 2027 | 2027 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 2985 | 2985 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 4932 | 4932 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 24405.700000000004 | 24405.700000000004 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 22690.19999999996 | 22690.19999999996 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21699.599999999988 | 21699.599999999988 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 27432.100000000017 | 27432.100000000017 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 27444.499999999993 | 27444.499999999993 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 23263.89999999999 | 23263.89999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0001 (identical) · control-0002 (identical) · control-0003 (identical) · control-0004 (identical) · control-0005 (identical) · control-0006 (identical) · control-0007 (identical) · control-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=402&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=402`); it opens the seed that parts earliest, and the dropdowns choose another.

