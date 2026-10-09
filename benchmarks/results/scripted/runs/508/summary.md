# Benchmark run #508 · scripted scenario `hill-0023` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `movementSubsteps=3`
- work/experimental-movement-substeps @ 0320e46 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37958627564) · build v29-dev

## Verdict

**one battle per arm, 8 of 8 records changed, first part at 5.1 s, casualties 159 to 214: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **8** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.162 (gate 1.25)
- the 8 changed records first part at simulated second: min 5.1, p10 5.1, median 5.1, p90 5.1, max 5.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 159 | 214 | 6.875 | 8 | 8 | 0 | 0.0078 |
| `usKills` | 134 | 103 | -3.875 | 8 | 2 | 6 | 0.2891 |
| `geKills` | 25 | 111 | 10.75 | 8 | 8 | 0 | 0.0078 |
| `fire.total` | 338 | 370 | 4 | 8 | 6 | 2 | 0.2891 |
| `fire.hits` | 79 | 118 | 4.875 | 8 | 6 | 2 | 0.2891 |
| `retreatSamples` | 987 | 1417 | 53.75 | 8 | 7 | 1 | 0.0703 |
| `movementResolver.changes` | 14959 | 14145 | -101.75 | 8 | 2 | 6 | 0.2891 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 4 | 0.5 | 2 | 2 | 0 | 0.5 |
| `loopAlerts.length` | 2 | 1 | -0.125 | 3 | 1 | 2 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 0 | 6 | 0.75 | 4 | 4 | 0 | 0.125 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 146 | 164 | 2.25 | 8 | 6 | 2 | 0.2891 |
| `recon.contacts` | 7 | 17 | 1.25 | 7 | 7 | 0 | 0.0156 |
| `recon.noContact` | 63 | 67 | 0.5 | 4 | 4 | 0 | 0.125 |
| `recon.timeouts` | 48 | 58 | 1.25 | 4 | 4 | 0 | 0.125 |
| `recon.cancelled` | 24 | 18 | -0.75 | 5 | 0 | 5 | 0.0625 |
| `recon.reportsDelivered` | 27 | 76 | 6.125 | 7 | 7 | 0 | 0.0156 |
| `recon.retriggerBlocked` | 79 | 89 | 1.25 | 6 | 6 | 0 | 0.0313 |
| `squadPerformance.meanOverall` | 714.5 | 708.3000000000001 | -0.775 | 8 | 3 | 5 | 0.7266 |
| `squadPerformance.p10Overall` | 648.5 | 651.3 | 0.35 | 6 | 4 | 2 | 0.6875 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 640.1999999999999 | 613.1999999999999 | -3.375 | 8 | 1 | 7 | 0.0703 |
| `squadPerformance.meanMovement` | 781.7 | 790.5 | 1.1 | 8 | 4 | 4 | 1 |
| `squadPerformance.meanControl` | 798.3000000000001 | 799 | 0.0875 | 4 | 2 | 2 | 1 |
| `squadPerformance.meanCohesion` | 700.4 | 702.3000000000001 | 0.2375 | 8 | 5 | 3 | 0.7266 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

hill-0023 5.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=508&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/experimental-movement-substeps/ai_flow_live.html?bench=508&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=508`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

