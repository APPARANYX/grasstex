# Benchmark run #324 · 100 seeds from `phase-0e-combined` (meeting), windows `contact+120`

- **OFF** flags: `commandMovement=0&commandRelay=0` · **ON** flags: `none`
- main @ 9da5788 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37265090661) · build v29-dev

## Verdict

**INERT: all 100 pairs identical in every field**


## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **100** · runtime errors off 0 / on 0 · wall time on/off x0.97 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 601 | 601 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 282 | 282 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 319 | 319 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 5993 | 5993 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 1165 | 1165 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1258 | 1258 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 171048 | 171048 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 43 | 43 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 677 | 677 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1344 | 1344 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 33 | 33 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1254 | 1254 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 37 | 37 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 170 | 170 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1249 | 1249 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 8978.5 | 8978.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 8531.099999999999 | 8531.099999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8270.6 | 8270.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 9929.799999999994 | 9929.799999999994 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 9836.000000000002 | 9836.000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 9445.599999999999 | 9445.599999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0e-combined-0001 (identical) · phase-0e-combined-0002 (identical) · phase-0e-combined-0003 (identical) · phase-0e-combined-0004 (identical) · phase-0e-combined-0005 (identical) · phase-0e-combined-0006 (identical) · phase-0e-combined-0007 (identical) · phase-0e-combined-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=324&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=324`); it opens the seed that parts earliest, and the dropdowns choose another.

