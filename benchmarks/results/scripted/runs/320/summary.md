# Benchmark run #320 · 100 seeds from `phase-0e-relay` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=0&commandMovement=0&commandRelay=1`
- main @ 3664fb7 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37262765528) · build v29-dev

## Verdict

**INERT: all 100 pairs identical in every field**


## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **100** · runtime errors off 0 / on 0 · wall time on/off x0.967 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 596 | 596 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 248 | 248 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 348 | 348 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 6938 | 6938 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 1198 | 1198 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1244 | 1244 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 170503 | 170503 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 45 | 45 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 189 | 189 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1372 | 1372 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1277 | 1277 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 35 | 35 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 177 | 177 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1285 | 1285 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 8978.499999999998 | 8978.499999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 8562.3 | 8562.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8254.699999999999 | 8254.699999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 9946.000000000004 | 9946.000000000004 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 9826.300000000003 | 9826.300000000003 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 9452.3 | 9452.3 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-relay-0001 (identical) · phase-0e-relay-0002 (identical) · phase-0e-relay-0003 (identical) · phase-0e-relay-0004 (identical) · phase-0e-relay-0005 (identical) · phase-0e-relay-0006 (identical) · phase-0e-relay-0007 (identical) · phase-0e-relay-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=320&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=320`); it opens the seed that parts earliest, and the dropdowns choose another.

