# Benchmark run #357 · 24 seeds from `audit-after` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `none`
- bench/only354 @ d415dcc · [run](https://github.com/APPARANYX/grasstex/actions/runs/37709823938) · build v29-dev

## Verdict

**INERT: all 177 pairs identical in every field**


## Paired comparison (off against on)

- **177** pairs (unpaired: off 0, on 0) · identical in every field: **177** · runtime errors off 0 / on 0 · wall time on/off x0.969 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5888 | 5888 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 2784 | 2784 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 3104 | 3104 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 8165 | 8165 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2866 | 2866 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 35231 | 35231 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 436476 | 436476 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 89 | 89 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 109 | 109 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 291 | 291 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 65 | 65 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 35 | 35 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 52 | 52 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 1877 | 1877 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 4376 | 4376 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 215 | 215 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 2849 | 2849 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 159 | 159 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 1074 | 1074 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 1248 | 1248 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 3383 | 3383 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 15181.700000000008 | 15181.700000000008 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 14114.500000000015 | 14114.500000000015 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 12353.500000000002 | 12353.500000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 17353.300000000007 | 17353.300000000007 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 17594.49999999999 | 17594.49999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 15375.199999999995 | 15375.199999999995 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

audit-after-0001 (identical) · audit-after-0002 (identical) · audit-after-0003 (identical) · audit-after-0004 (identical) · audit-after-0005 (identical) · audit-after-0006 (identical) · audit-after-0007 (identical) · audit-after-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=357&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=357`); it opens the seed that parts earliest, and the dropdowns choose another.

