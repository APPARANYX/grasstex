# Benchmark run #361 · 12 seeds from `command-audit361` (meeting), windows `every60`

- **OFF** flags: `none` · **ON** flags: `none`
- fix/defend-stalemate-understrength @ dccb3ba · [run](https://github.com/APPARANYX/grasstex/actions/runs/37710752568) · build v29-dev

## Verdict

**INERT: all 20 pairs identical in every field**


## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **20** · runtime errors off 0 / on 0 · wall time on/off x0.995 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 547 | 547 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 235 | 235 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 312 | 312 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 736 | 736 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 268 | 268 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 3756 | 3756 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 40210 | 40210 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 402 | 402 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 314 | 314 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 69 | 69 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 21 | 21 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 309 | 309 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 1755.3000000000002 | 1755.3000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 1665.5999999999997 | 1665.5999999999997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1436.8 | 1436.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 1985.2000000000003 | 1985.2000000000003 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 1991.2999999999997 | 1991.2999999999997 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 1804.1000000000001 | 1804.1000000000001 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

command-audit361-0004 (identical) · command-audit361-0005 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=361&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=361`); it opens the seed that parts earliest, and the dropdowns choose another.

