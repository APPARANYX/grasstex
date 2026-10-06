# Benchmark run #350 · 200 seeds from `rev317-ab` (meeting), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `none`
- bench/pre-317-7623b51e @ 7623b51 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37546970899) · build v29-dev

## Verdict

**INERT: all 200 pairs identical in every field**


## Paired comparison (off against on)

- **200** pairs (unpaired: off 0, on 0) · identical in every field: **200** · runtime errors off 0 / on 0 · wall time on/off x0.997 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4214 | 4214 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1901 | 1901 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 2313 | 2313 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 31535 | 31535 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 10396 | 10396 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 21689 | 21689 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 419196 | 419196 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 33 | 33 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 34 | 34 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 217 | 217 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 662 | 662 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 38 | 38 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 60 | 60 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 1830 | 1830 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 4843 | 4843 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 131 | 131 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 2723 | 2723 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 211 | 211 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 1735 | 1735 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 766 | 766 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 4418 | 4418 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 16959.19999999999 | 16959.19999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 15342.099999999991 | 15342.099999999991 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 14583.3 | 14583.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 19282.30000000001 | 19282.30000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 19626.600000000002 | 19626.600000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 17162.69999999999 | 17162.69999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

rev317-ab-0001 (identical) · rev317-ab-0002 (identical) · rev317-ab-0003 (identical) · rev317-ab-0004 (identical) · rev317-ab-0005 (identical) · rev317-ab-0006 (identical) · rev317-ab-0007 (identical) · rev317-ab-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=350&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=350`); it opens the seed that parts earliest, and the dropdowns choose another.

