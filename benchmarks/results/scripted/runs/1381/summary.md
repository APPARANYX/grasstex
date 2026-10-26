# Benchmark run #1381 · scripted scenario `controller-runtime-20261025` (meeting), windows `0+600`

- **OFF** flags: `none` · **ON** flags: `tacticalController=new`
- claude/project-thread-a5sq10 @ 51ccafd · [run](https://github.com/APPARANYX/grasstex/actions/runs/40250693849) · build v29-dev

## Verdict

**one battle per arm, 1 of 1 records changed, first part at 1.05 s, casualties 41 to 0: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **1** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.225 (gate 1.25)
- the 1 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 41 | 0 | -41 | 1 | 0 | 1 | 1 |
| `usKills` | 13 | 0 | -13 | 1 | 0 | 1 | 1 |
| `geKills` | 28 | 0 | -28 | 1 | 0 | 1 | 1 |
| `fire.total` | 116 | 0 | -116 | 1 | 0 | 1 | 1 |
| `fire.hits` | 70 | 0 | -70 | 1 | 0 | 1 | 1 |
| `retreatSamples` | 981 | 0 | -981 | 1 | 0 | 1 | 1 |
| `movementResolver.changes` | 1769 | 2718 | 949 | 1 | 1 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 1 | 0 | -1 | 1 | 0 | 1 | 1 |
| `targetlessStalls.length` | 0 | 1 | 1 | 1 | 1 | 0 | 1 |
| `vacantObjectiveStalls.length` | 3 | 0 | -3 | 1 | 0 | 1 | 1 |
| `loopAlerts.length` | 8 | 0 | -8 | 1 | 0 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 5 | 0 | -5 | 1 | 0 | 1 | 1 |
| `stallOutcomes.wakes` | 0 | 3 | 3 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 3 | 3 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 30 | 0 | -30 | 1 | 0 | 1 | 1 |
| `recon.contacts` | 4 | 0 | -4 | 1 | 0 | 1 | 1 |
| `recon.noContact` | 8 | 0 | -8 | 1 | 0 | 1 | 1 |
| `recon.timeouts` | 6 | 0 | -6 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 11 | 0 | -11 | 1 | 0 | 1 | 1 |
| `recon.reportsDelivered` | 18 | 0 | -18 | 1 | 0 | 1 | 1 |
| `recon.retriggerBlocked` | 16 | 0 | -16 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 86.6 | 92.1 | 5.5 | 1 | 1 | 0 | 1 |
| `squadPerformance.p10Overall` | 74.7 | 88.5 | 13.8 | 1 | 1 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 74.2 | 85.8 | 11.6 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMovement` | 98.9 | 99.8 | 0.9 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanControl` | 97 | 97.2 | 0.2 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanCohesion` | 95.9 | 100 | 4.1 | 1 | 1 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

controller-runtime-20261025 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1381&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1381`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

