# Benchmark run #353 · 200 seeds from `rev317-ab` (meeting), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ 87f61bf · [run](https://github.com/APPARANYX/grasstex/actions/runs/37557130069) · build v29-dev

## Verdict

**INERT: all 200 pairs identical in every field**


## Paired comparison (off against on)

- **200** pairs (unpaired: off 0, on 0) · identical in every field: **200** · runtime errors off 0 / on 0 · wall time on/off x0.98 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4072 | 4072 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1844 | 1844 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 2228 | 2228 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 30933 | 30933 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 10071 | 10071 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 21617 | 21617 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 416408 | 416408 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 35 | 35 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 49 | 49 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 205 | 205 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 680 | 680 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 41 | 41 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 62 | 62 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 1852 | 1852 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 4864 | 4864 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 128 | 128 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 2727 | 2727 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 208 | 208 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 1760 | 1760 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 723 | 723 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 4432 | 4432 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 17096.39999999999 | 17096.39999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 15506.699999999993 | 15506.699999999993 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 14739.000000000005 | 14739.000000000005 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 19733.5 | 19733.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 19632.799999999992 | 19632.799999999992 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 17171.699999999997 | 17171.699999999997 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

rev317-ab-0001 (identical) · rev317-ab-0002 (identical) · rev317-ab-0003 (identical) · rev317-ab-0004 (identical) · rev317-ab-0005 (identical) · rev317-ab-0006 (identical) · rev317-ab-0007 (identical) · rev317-ab-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=353&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=353`); it opens the seed that parts earliest, and the dropdowns choose another.

