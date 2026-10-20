# Benchmark run #1055 · 3 seeds from `audit-strategic-config-20261020` (meeting), windows `0+600`

- **OFF** flags: `none` · **ON** flags: `none`
- main @ 5a713d3 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39515924703) · build v29-dev

## Verdict

**INERT: all 3 pairs identical in every field**


## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x0.997 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 114 | 114 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 55 | 55 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 59 | 59 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 639 | 639 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 265 | 265 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 2448 | 2448 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 3181 | 3181 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 30 | 30 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 30 | 30 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 10593 | 10593 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 30 | 30 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 10593 | 10593 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 49 | 49 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 23 | 23 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 256.4 | 256.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 223.3 | 223.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 216.29999999999998 | 216.29999999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 286.70000000000005 | 286.70000000000005 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 289.6 | 289.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 288.1 | 288.1 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

audit-strategic-config-20261020-0001 (identical) · audit-strategic-config-20261020-0002 (identical) · audit-strategic-config-20261020-0003 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1055&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1055`); it opens the seed that parts earliest, and the dropdowns choose another.

