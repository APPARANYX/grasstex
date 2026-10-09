# Benchmark run #517 · scripted scenario `grenade-409-20261009` (meeting), windows `0+600`

- **OFF** flags: `grenades=0` · **ON** flags: `grenades=1`
- work/issue409-grenade-vertical-slice @ ae59d0a · [run](https://github.com/APPARANYX/grasstex/actions/runs/37988044295) · build v29-dev

## Verdict

**one battle per arm, 1 of 1 records changed, first part at 196.05 s, casualties 49 to 49: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **1** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.97 (gate 1.25)
- the 1 changed records first part at simulated second: min 196.05, p10 196.05, median 196.05, p90 196.05, max 196.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 49 | 49 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 34 | 34 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 267 | 267 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 101 | 101 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1135 | 1135 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 2635 | 2635 | 0 | 0 | 0 | 0 | 1 |
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
| `vacantObjectiveStalls.length` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 33 | 33 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 21 | 21 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 82 | 82 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 74 | 74 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 67 | 67 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 99.7 | 99.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 96.8 | 96.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 89.7 | 89.7 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

grenade-409-20261009 196.05 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=517&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/issue409-grenade-vertical-slice/ai_flow_live.html?bench=517&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=517`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

