# Benchmark run #349 · 200 seeds from `post-317` (meeting), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ ff7588a · [run](https://github.com/APPARANYX/grasstex/actions/runs/37545995844) · build v29-dev

## Verdict

**INERT: all 200 pairs identical in every field**


## Paired comparison (off against on)

- **200** pairs (unpaired: off 0, on 0) · identical in every field: **200** · runtime errors off 0 / on 0 · wall time on/off x0.997 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4021 | 4021 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1729 | 1729 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 2292 | 2292 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 30790 | 30790 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 9957 | 9957 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 22295 | 22295 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 421552 | 421552 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 41 | 41 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 218 | 218 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 656 | 656 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 31 | 31 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 46 | 46 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 1668 | 1668 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 4912 | 4912 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 132 | 132 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 2745 | 2745 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 218 | 218 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 1784 | 1784 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 783 | 783 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 4485 | 4485 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 16905.900000000005 | 16905.900000000005 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 15202.500000000004 | 15202.500000000004 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 14471.500000000004 | 14471.500000000004 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 19069.999999999993 | 19069.999999999993 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 19647 | 19647 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 17213.9 | 17213.9 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

post-317-0001 (identical) · post-317-0002 (identical) · post-317-0003 (identical) · post-317-0004 (identical) · post-317-0005 (identical) · post-317-0006 (identical) · post-317-0007 (identical) · post-317-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=349&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=349`); it opens the seed that parts earliest, and the dropdowns choose another.

