# Benchmark run #1219 · scripted scenario `firing-position-parity-20261021` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `none`
- work/squad-firing-positions-20261021 @ 038b49b · [run](https://github.com/APPARANYX/grasstex/actions/runs/39698646598) · build v29-dev

## Verdict

**INERT: all 6 pairs identical in every field**


## Paired comparison (off against on)

- **6** pairs (unpaired: off 0, on 0) · identical in every field: **6** · runtime errors off 0 / on 0 · wall time on/off x1.024 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 121 | 121 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 106 | 106 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 106 | 106 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 52 | 52 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 766 | 766 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 4276 | 4276 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 62 | 62 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 21 | 21 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 48 | 48 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 536.2 | 536.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 478.4 | 478.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 449.2 | 449.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 594.3 | 594.3 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 594 | 594 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 565.2 | 565.2 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

firing-position-parity-20261021 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1219&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/squad-firing-positions-20261021/ai_flow_live.html?bench=1219&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1219`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

