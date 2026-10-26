# Benchmark run #1390 · scripted scenario `controller-contact-20261026` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/tactical-contact-20261026 @ 0c13fab · [run](https://github.com/APPARANYX/grasstex/actions/runs/40256652993) · build v29-dev

## Verdict

**one battle per arm, 1 of 1 records changed, first part at 1.05 s, casualties 54 to 40: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **1** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.78 (gate 1.25)
- the 1 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 54 | 40 | -14 | 1 | 0 | 1 | 1 |
| `usKills` | 18 | 16 | -2 | 1 | 0 | 1 | 1 |
| `geKills` | 36 | 24 | -12 | 1 | 0 | 1 | 1 |
| `fire.total` | 274 | 180 | -94 | 1 | 0 | 1 | 1 |
| `fire.hits` | 133 | 87 | -46 | 1 | 0 | 1 | 1 |
| `retreatSamples` | 1869 | 643 | -1226 | 1 | 0 | 1 | 1 |
| `movementResolver.changes` | 3305 | 913 | -2392 | 1 | 0 | 1 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 11 | 4 | -7 | 1 | 0 | 1 | 1 |
| `loopAlerts.length` | 5 | 2 | -3 | 1 | 0 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 4 | 0 | -4 | 1 | 0 | 1 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 19 | 1 | -18 | 1 | 0 | 1 | 1 |
| `recon.contacts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 14 | 0 | -14 | 1 | 0 | 1 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 5 | 1 | -4 | 1 | 0 | 1 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 16 | 0 | -16 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 80.1 | 82 | 1.9 | 1 | 1 | 0 | 1 |
| `squadPerformance.p10Overall` | 74 | 75 | 1 | 1 | 1 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 62.9 | 68.2 | 5.3 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMovement` | 99.9 | 99.8 | -0.1 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanControl` | 96.4 | 96.6 | 0.2 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanCohesion` | 87 | 81 | -6 | 1 | 0 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

controller-contact-20261026 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1390&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/tactical-contact-20261026/ai_flow_live.html?bench=1390&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1390`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

