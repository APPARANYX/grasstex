# Benchmark run #1382 · scripted scenario `controller-runtime-20261025` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- claude/project-thread-a5sq10 @ 51ccafd · [run](https://github.com/APPARANYX/grasstex/actions/runs/40250697463) · build v29-dev

## Verdict

**one battle per arm, 1 of 1 records changed, first part at 1.05 s, casualties 46 to 0: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **1** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.085 (gate 1.25)
- the 1 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 46 | 0 | -46 | 1 | 0 | 1 | 1 |
| `usKills` | 33 | 0 | -33 | 1 | 0 | 1 | 1 |
| `geKills` | 13 | 0 | -13 | 1 | 0 | 1 | 1 |
| `fire.total` | 215 | 0 | -215 | 1 | 0 | 1 | 1 |
| `fire.hits` | 98 | 0 | -98 | 1 | 0 | 1 | 1 |
| `retreatSamples` | 1129 | 0 | -1129 | 1 | 0 | 1 | 1 |
| `movementResolver.changes` | 2796 | 635 | -2161 | 1 | 0 | 1 | 1 |
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
| `vacantObjectiveStalls.length` | 3 | 0 | -3 | 1 | 0 | 1 | 1 |
| `loopAlerts.length` | 5 | 2 | -3 | 1 | 0 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 4 | 0 | -4 | 1 | 0 | 1 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 33 | 3 | -30 | 1 | 0 | 1 | 1 |
| `recon.contacts` | 1 | 0 | -1 | 1 | 0 | 1 | 1 |
| `recon.noContact` | 19 | 0 | -19 | 1 | 0 | 1 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 12 | 3 | -9 | 1 | 0 | 1 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 26 | 0 | -26 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 82.5 | 83.5 | 1 | 1 | 1 | 0 | 1 |
| `squadPerformance.p10Overall` | 79 | 78.1 | -0.9 | 1 | 0 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 64.9 | 80.1 | 15.2 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMovement` | 99.9 | 99.5 | -0.4 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanControl` | 94.7 | 87.7 | -7 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanCohesion` | 90.8 | 73.3 | -17.5 | 1 | 0 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

controller-runtime-20261025 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1382&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1382`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

