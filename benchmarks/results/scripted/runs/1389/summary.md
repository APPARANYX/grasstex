# Benchmark run #1389 · scripted scenario `controller-contact-20261026` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=1` · **ON** flags: `strategicInterception=1&tacticalController=new`
- work/tactical-contact-20261026 @ 0c13fab · [run](https://github.com/APPARANYX/grasstex/actions/runs/40256652971) · build v29-dev

## Verdict

**one battle per arm, 1 of 1 records changed, first part at 1.05 s, casualties 18 to 28: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **1** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.93 (gate 1.25)
- the 1 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 18 | 28 | 10 | 1 | 1 | 0 | 1 |
| `usKills` | 18 | 7 | -11 | 1 | 0 | 1 | 1 |
| `geKills` | 0 | 21 | 21 | 1 | 1 | 0 | 1 |
| `fire.total` | 120 | 110 | -10 | 1 | 0 | 1 | 1 |
| `fire.hits` | 47 | 60 | 13 | 1 | 1 | 0 | 1 |
| `retreatSamples` | 1260 | 546 | -714 | 1 | 0 | 1 | 1 |
| `movementResolver.changes` | 1012 | 644 | -368 | 1 | 0 | 1 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 3 | 0 | -3 | 1 | 0 | 1 | 1 |
| `targetlessStalls.length` | 0 | 3 | 3 | 1 | 1 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 4 | 3 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 16 | 11 | -5 | 1 | 0 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 9 | 0 | -9 | 1 | 0 | 1 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 10 | 0 | -10 | 1 | 0 | 1 | 1 |
| `recon.contacts` | 1 | 0 | -1 | 1 | 0 | 1 | 1 |
| `recon.noContact` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 5 | 0 | -5 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 4 | 0 | -4 | 1 | 0 | 1 | 1 |
| `recon.reportsDelivered` | 8 | 0 | -8 | 1 | 0 | 1 | 1 |
| `recon.retriggerBlocked` | 6 | 0 | -6 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 83.4 | 84.6 | 1.2 | 1 | 1 | 0 | 1 |
| `squadPerformance.p10Overall` | 74 | 74 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 67.3 | 69.1 | 1.8 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMovement` | 96.9 | 98.6 | 1.7 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanControl` | 97.9 | 91.2 | -6.7 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanCohesion` | 95.2 | 98.4 | 3.2 | 1 | 1 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

controller-contact-20261026 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1389&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/tactical-contact-20261026/ai_flow_live.html?bench=1389&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1389`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

