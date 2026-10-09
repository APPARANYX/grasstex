# Benchmark run #505 · scripted scenario `hill-0008` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `movementSubsteps=2`
- work/experimental-movement-substeps @ 0320e46 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37958607848) · build v29-dev

## Verdict

**one battle per arm, 7 of 7 records changed, first part at 9 s, casualties 161 to 112: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.
- Unpaired records: off 1, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **7** pairs (unpaired: off 1, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.946 (gate 1.25)
- the 7 changed records first part at simulated second: min 9, p10 9, median 9, p90 9, max 9

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 161 | 112 | -7 | 7 | 2 | 5 | 0.4531 |
| `usKills` | 97 | 87 | -1.4286 | 6 | 2 | 4 | 0.6875 |
| `geKills` | 64 | 25 | -5.5714 | 6 | 0 | 6 | 0.0313 |
| `fire.total` | 209 | 232 | 3.2857 | 6 | 1 | 5 | 0.2188 |
| `fire.hits` | 75 | 71 | -0.5714 | 7 | 3 | 4 | 1 |
| `retreatSamples` | 1253 | 1262 | 1.2857 | 6 | 3 | 3 | 1 |
| `movementResolver.changes` | 15385 | 13782 | -229 | 7 | 1 | 6 | 0.125 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 0 | -0.1429 | 1 | 0 | 1 | 1 |
| `loopAlerts.length` | 2 | 3 | 0.1429 | 3 | 1 | 2 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 12 | 15 | 0.4286 | 5 | 4 | 1 | 0.375 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 192 | 178 | -2 | 6 | 2 | 4 | 0.6875 |
| `recon.contacts` | 15 | 15 | 0 | 4 | 2 | 2 | 1 |
| `recon.noContact` | 56 | 43 | -1.8571 | 6 | 0 | 6 | 0.0313 |
| `recon.timeouts` | 71 | 66 | -0.7143 | 4 | 1 | 3 | 0.625 |
| `recon.cancelled` | 41 | 45 | 0.5714 | 4 | 3 | 1 | 0.625 |
| `recon.reportsDelivered` | 72 | 61 | -1.5714 | 6 | 2 | 4 | 0.6875 |
| `recon.retriggerBlocked` | 82 | 71 | -1.5714 | 6 | 0 | 6 | 0.0313 |
| `squadPerformance.meanOverall` | 606.8000000000001 | 605.4 | -0.2 | 7 | 4 | 3 | 1 |
| `squadPerformance.p10Overall` | 560.1999999999999 | 558.6999999999999 | -0.2143 | 7 | 3 | 4 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 526.5000000000001 | 512.5 | -2 | 7 | 4 | 3 | 1 |
| `squadPerformance.meanMovement` | 684.5 | 683.6 | -0.1286 | 7 | 4 | 3 | 1 |
| `squadPerformance.meanControl` | 697.4 | 697.2 | -0.0286 | 6 | 3 | 3 | 1 |
| `squadPerformance.meanCohesion` | 584.3000000000001 | 591.4 | 1.0143 | 7 | 3 | 4 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

hill-0008 9 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=505&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/experimental-movement-substeps/ai_flow_live.html?bench=505&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=505`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

