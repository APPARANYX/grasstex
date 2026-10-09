# Benchmark run #510 · scripted scenario `hill-0002` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `movementSubsteps=3`
- work/experimental-movement-substeps @ 0320e46 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37958643569) · build v29-dev

## Verdict

**one battle per arm, 7 of 7 records changed, first part at 5.1 s, casualties 224 to 141: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.
- Unpaired records: off 1, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **7** pairs (unpaired: off 1, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.196 (gate 1.25)
- the 7 changed records first part at simulated second: min 5.1, p10 5.1, median 5.1, p90 5.1, max 5.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 224 | 141 | -11.8571 | 7 | 1 | 6 | 0.125 |
| `usKills` | 75 | 25 | -7.1429 | 7 | 2 | 5 | 0.4531 |
| `geKills` | 149 | 116 | -4.7143 | 7 | 0 | 7 | 0.0156 |
| `fire.total` | 283 | 166 | -16.7143 | 6 | 3 | 3 | 1 |
| `fire.hits` | 112 | 66 | -6.5714 | 6 | 3 | 3 | 1 |
| `retreatSamples` | 1961 | 2161 | 28.5714 | 7 | 5 | 2 | 0.4531 |
| `movementResolver.changes` | 13142 | 14923 | 254.4286 | 7 | 7 | 0 | 0.0156 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 0 | -0.1429 | 1 | 0 | 1 | 1 |
| `loopAlerts.length` | 2 | 1 | -0.1429 | 1 | 0 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 41 | 46 | 0.7143 | 7 | 4 | 3 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 215 | 190 | -3.5714 | 7 | 1 | 6 | 0.125 |
| `recon.contacts` | 22 | 11 | -1.5714 | 7 | 1 | 6 | 0.125 |
| `recon.noContact` | 65 | 74 | 1.2857 | 2 | 2 | 0 | 0.5 |
| `recon.timeouts` | 73 | 69 | -0.5714 | 4 | 0 | 4 | 0.125 |
| `recon.cancelled` | 50 | 29 | -3 | 7 | 0 | 7 | 0.0156 |
| `recon.reportsDelivered` | 70 | 84 | 2 | 7 | 6 | 1 | 0.125 |
| `recon.retriggerBlocked` | 60 | 80 | 2.8571 | 6 | 6 | 0 | 0.0313 |
| `squadPerformance.meanOverall` | 601.3000000000001 | 601.9999999999999 | 0.1 | 6 | 3 | 3 | 1 |
| `squadPerformance.p10Overall` | 563.8 | 569.1 | 0.7571 | 3 | 2 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 504 | 493.4 | -1.5143 | 7 | 3 | 4 | 1 |
| `squadPerformance.meanMovement` | 695.7 | 697 | 0.1857 | 6 | 4 | 2 | 0.6875 |
| `squadPerformance.meanControl` | 697.5 | 698 | 0.0714 | 6 | 3 | 3 | 1 |
| `squadPerformance.meanCohesion` | 574.9 | 590.4 | 2.2143 | 7 | 5 | 2 | 0.4531 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

hill-0002 5.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=510&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/experimental-movement-substeps/ai_flow_live.html?bench=510&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=510`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

