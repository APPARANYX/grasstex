# Benchmark run #1044 · 3 seeds from `audit-clock-lifecycle-20261020` (meeting), windows `0+600`

- **OFF** flags: `none` · **ON** flags: `none`
- work/clock-lifecycle-20261020 @ c98f7e0 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39486998775) · build v29-dev

## Verdict

**INERT: all 3 pairs identical in every field**


## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x0.984 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 74 | 74 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 38 | 38 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 36 | 36 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 348 | 348 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 132 | 132 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1910 | 1910 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 3477 | 3477 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 44 | 44 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 62 | 62 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 23 | 23 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 30 | 30 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 256.8 | 256.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 224.7 | 224.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 221.10000000000002 | 221.10000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 288.9 | 288.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 275.29999999999995 | 275.29999999999995 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 290.1 | 290.1 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

audit-clock-lifecycle-20261020-0001 (identical) · audit-clock-lifecycle-20261020-0002 (identical) · audit-clock-lifecycle-20261020-0003 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1044&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/clock-lifecycle-20261020/ai_flow_live.html?bench=1044&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1044`); it opens the seed that parts earliest, and the dropdowns choose another.

