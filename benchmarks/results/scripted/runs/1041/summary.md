# Benchmark run #1041 · 3 seeds from `audit-read-model-20261020` (meeting), windows `0+600`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ b3beec1 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39478888748) · build v29-dev

## Verdict

**INERT: all 3 pairs identical in every field**


## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x1.01 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 91 | 91 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 64 | 64 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 335 | 335 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 143 | 143 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 3366 | 3366 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 4012 | 4012 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 28 | 28 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 6743 | 6743 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 6743 | 6743 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 48 | 48 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 26 | 26 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 253.10000000000002 | 253.10000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 222.9 | 222.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 205 | 205 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 290.8 | 290.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 285.9 | 285.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 290.5 | 290.5 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

audit-read-model-20261020-0001 (identical) · audit-read-model-20261020-0002 (identical) · audit-read-model-20261020-0003 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1041&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1041`); it opens the seed that parts earliest, and the dropdowns choose another.

