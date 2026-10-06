# Benchmark run #335 · 20 seeds from `defend-scout-usdefend` (us-defend), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ 4e01e42 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37395321732) · build v29-dev

## Verdict

**INERT: all 20 pairs identical in every field**


## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **20** · runtime errors off 0 / on 0 · wall time on/off x0.915 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 41 | 41 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 373 | 373 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 102 | 102 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 103 | 103 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 12444 | 12444 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 371 | 371 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 59 | 59 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 308 | 308 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 342 | 342 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 1883.2 | 1883.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 1783.7 | 1783.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1832.4000000000003 | 1832.4000000000003 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 1990.3 | 1990.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 1993.3000000000002 | 1993.3000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 1910.7 | 1910.7 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

defend-scout-usdefend-0001 (identical) · defend-scout-usdefend-0002 (identical) · defend-scout-usdefend-0003 (identical) · defend-scout-usdefend-0004 (identical) · defend-scout-usdefend-0005 (identical) · defend-scout-usdefend-0006 (identical) · defend-scout-usdefend-0007 (identical) · defend-scout-usdefend-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=335&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=335`); it opens the seed that parts earliest, and the dropdowns choose another.

