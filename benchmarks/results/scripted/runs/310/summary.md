# Benchmark run #310 · scripted scenario `phase-0e-final100-0029` (meeting), windows `contact+120`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=0&commandMovement=1&commandRelay=0`
- work/phase-0e-regroup-adoption-grace @ 7f74416 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37215957216) · build v29-dev

## Verdict

**one battle per arm, 1 of 1 records changed, first part at 0.15 s, casualties 24 to 15: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **1** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.195 (gate 1.25)
- the 1 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 24 | 15 | -9 | 1 | 0 | 1 | 1 |
| `usKills` | 3 | 5 | 2 | 1 | 1 | 0 | 1 |
| `geKills` | 21 | 10 | -11 | 1 | 0 | 1 | 1 |
| `fire.total` | 311 | 127 | -184 | 1 | 0 | 1 | 1 |
| `fire.hits` | 36 | 25 | -11 | 1 | 0 | 1 | 1 |
| `retreatSamples` | 42 | 45 | 3 | 1 | 1 | 0 | 1 |
| `movementResolver.changes` | 1762 | 1747 | -15 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 0 | 1 | 1 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 3 | 0 | -3 | 1 | 0 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 0 | 2 | 2 | 1 | 1 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 1 | 1 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 22 | 22 | 1 | 1 | 0 | 1 |
| `recon.orders` | 13 | 12 | -1 | 1 | 0 | 1 | 1 |
| `recon.contacts` | 1 | 0 | -1 | 1 | 0 | 1 | 1 |
| `recon.noContact` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 1 | 1 | 1 | 1 | 0 | 1 |
| `recon.cancelled` | 1 | 0 | -1 | 1 | 0 | 1 | 1 |
| `recon.reportsDelivered` | 8 | 0 | -8 | 1 | 0 | 1 | 1 |
| `recon.retriggerBlocked` | 11 | 12 | 1 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanOverall` | 87.6 | 86.2 | -1.4 | 1 | 0 | 1 | 1 |
| `squadPerformance.p10Overall` | 79.8 | 76.8 | -3 | 1 | 0 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 82.4 | 75 | -7.4 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanMovement` | 95.2 | 97.5 | 2.3 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanControl` | 95.5 | 99.3 | 3.8 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanCohesion` | 93.6 | 89.5 | -4.1 | 1 | 0 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

phase-0e-final100-0029 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=310&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-0e-regroup-adoption-grace/ai_flow_live.html?bench=310&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=310`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

