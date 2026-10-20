# Benchmark run #1045 · 3 seeds from `audit-commander-lifecycle-20261020` (meeting), windows `0+600`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ f52de02 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39499258088) · build v29-dev

## Verdict

**INERT: all 3 pairs identical in every field**


## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x0.961 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 127 | 127 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 88 | 88 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 39 | 39 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 558 | 558 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 263 | 263 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1990 | 1990 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 3894 | 3894 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 67 | 67 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 28 | 28 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 35 | 35 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 260 | 260 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 222.9 | 222.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 222 | 222 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 292.7 | 292.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 286.4 | 286.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 288.4 | 288.4 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

audit-commander-lifecycle-20261020-0001 (identical) · audit-commander-lifecycle-20261020-0002 (identical) · audit-commander-lifecycle-20261020-0003 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1045&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1045`); it opens the seed that parts earliest, and the dropdowns choose another.

