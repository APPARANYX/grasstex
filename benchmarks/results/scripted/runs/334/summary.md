# Benchmark run #334 · 100 seeds from `defend-scout-bounds-fix` (meeting), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ 4e01e42 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37395319389) · build v29-dev

## Verdict

**INERT: all 100 pairs identical in every field**


## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **100** · runtime errors off 0 / on 0 · wall time on/off x0.999 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 648 | 648 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 272 | 272 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 376 | 376 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 5935 | 5935 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 1236 | 1236 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1322 | 1322 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 171230 | 171230 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 62 | 62 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 31 | 31 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 200 | 200 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1623 | 1623 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1109 | 1109 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 44 | 44 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 435 | 435 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 111 | 111 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1532 | 1532 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 8972.099999999997 | 8972.099999999997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 8545.599999999999 | 8545.599999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 8286.499999999998 | 8286.499999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 9914.799999999994 | 9914.799999999994 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 9807.799999999997 | 9807.799999999997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 9320.2 | 9320.2 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

defend-scout-bounds-fix-0001 (identical) · defend-scout-bounds-fix-0002 (identical) · defend-scout-bounds-fix-0003 (identical) · defend-scout-bounds-fix-0004 (identical) · defend-scout-bounds-fix-0005 (identical) · defend-scout-bounds-fix-0006 (identical) · defend-scout-bounds-fix-0007 (identical) · defend-scout-bounds-fix-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=334&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=334`); it opens the seed that parts earliest, and the dropdowns choose another.

