# Benchmark run #507 · scripted scenario `hill-0023` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `movementSubsteps=2`
- work/experimental-movement-substeps @ 0320e46 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37958622074) · build v29-dev

## Verdict

**one battle per arm, 8 of 8 records changed, first part at 5.1 s, casualties 159 to 160: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **8** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.104 (gate 1.25)
- the 8 changed records first part at simulated second: min 5.1, p10 5.1, median 5.1, p90 5.1, max 5.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 159 | 160 | 0.125 | 7 | 4 | 3 | 1 |
| `usKills` | 134 | 110 | -3 | 8 | 2 | 6 | 0.2891 |
| `geKills` | 25 | 50 | 3.125 | 7 | 6 | 1 | 0.125 |
| `fire.total` | 338 | 285 | -6.625 | 8 | 3 | 5 | 0.7266 |
| `fire.hits` | 79 | 77 | -0.25 | 6 | 3 | 3 | 1 |
| `retreatSamples` | 987 | 927 | -7.5 | 7 | 3 | 4 | 1 |
| `movementResolver.changes` | 14959 | 15426 | 58.375 | 8 | 4 | 4 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 3 | 0.375 | 2 | 2 | 0 | 0.5 |
| `loopAlerts.length` | 2 | 3 | 0.125 | 4 | 2 | 2 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 0 | 7 | 0.875 | 4 | 4 | 0 | 0.125 |
| `stallOutcomes.wakes` | 0 | 6 | 0.75 | 3 | 3 | 0 | 0.25 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 146 | 194 | 6 | 8 | 6 | 2 | 0.2891 |
| `recon.contacts` | 7 | 0 | -0.875 | 5 | 0 | 5 | 0.0625 |
| `recon.noContact` | 63 | 68 | 0.625 | 4 | 4 | 0 | 0.125 |
| `recon.timeouts` | 48 | 89 | 5.125 | 4 | 4 | 0 | 0.125 |
| `recon.cancelled` | 24 | 34 | 1.25 | 6 | 5 | 1 | 0.2188 |
| `recon.reportsDelivered` | 27 | 0 | -3.375 | 5 | 0 | 5 | 0.0625 |
| `recon.retriggerBlocked` | 79 | 96 | 2.125 | 6 | 6 | 0 | 0.0313 |
| `squadPerformance.meanOverall` | 714.5 | 702.9 | -1.45 | 8 | 3 | 5 | 0.7266 |
| `squadPerformance.p10Overall` | 648.5 | 650 | 0.1875 | 5 | 2 | 3 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 640.1999999999999 | 634.3000000000001 | -0.7375 | 8 | 2 | 6 | 0.2891 |
| `squadPerformance.meanMovement` | 781.7 | 782.0999999999999 | 0.05 | 7 | 2 | 5 | 0.4531 |
| `squadPerformance.meanControl` | 798.3000000000001 | 797.4 | -0.1125 | 4 | 2 | 2 | 1 |
| `squadPerformance.meanCohesion` | 700.4 | 644 | -7.05 | 8 | 0 | 8 | 0.0078 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

hill-0023 5.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=507&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/experimental-movement-substeps/ai_flow_live.html?bench=507&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=507`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

