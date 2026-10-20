# Benchmark run #1051 · 3 seeds from `audit-operator-restart-20261020` (meeting), windows `0+600`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ e8286d9 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39513882268) · build v29-dev

## Verdict

**INERT: all 3 pairs identical in every field**


## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x1.008 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 123 | 123 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 83 | 83 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 40 | 40 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 582 | 582 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 283 | 283 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 4017 | 4017 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 3966 | 3966 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 4505 | 4505 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 4505 | 4505 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 57 | 57 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 37 | 37 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 251.8 | 251.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 223.5 | 223.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 199 | 199 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 291.40000000000003 | 291.40000000000003 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 291.1 | 291.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 292 | 292 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

audit-operator-restart-20261020-0001 (identical) · audit-operator-restart-20261020-0002 (identical) · audit-operator-restart-20261020-0003 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1051&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1051`); it opens the seed that parts earliest, and the dropdowns choose another.

