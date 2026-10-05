# Benchmark run #328 · scripted scenario `scripted-scout-0003` (meeting), windows `contact+60,every60`

- **OFF** flags: `commandPosture=0&commandMovement=0&commandRelay=0` · **ON** flags: `commandPosture=1&commandMovement=0&commandRelay=0`
- main @ fa78be6 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37298183845) · build v29-dev

## Verdict

**one battle per arm, 9 of 9 records changed, first part at 61.05 s, casualties 205 to 291: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **9** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1 (gate 1.25)
- the 9 changed records first part at simulated second: min 61.05, p10 61.05, median 61.05, p90 61.05, max 61.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 205 | 291 | 9.5556 | 9 | 8 | 1 | 0.0391 |
| `usKills` | 55 | 151 | 10.6667 | 8 | 7 | 1 | 0.0703 |
| `geKills` | 150 | 140 | -1.1111 | 7 | 2 | 5 | 0.4531 |
| `fire.total` | 432 | 580 | 16.4444 | 9 | 6 | 3 | 0.5078 |
| `fire.hits` | 57 | 107 | 5.5556 | 9 | 6 | 3 | 0.5078 |
| `retreatSamples` | 977 | 1931 | 106 | 8 | 6 | 2 | 0.2891 |
| `movementResolver.changes` | 24769 | 24021 | -83.1111 | 9 | 3 | 6 | 0.5078 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 40 | 10 | -3.3333 | 7 | 0 | 7 | 0.0156 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 6 | 4 | -0.2222 | 2 | 0 | 2 | 0.5 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 111 | 70 | -4.5556 | 8 | 0 | 8 | 0.0078 |
| `recon.contacts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 94 | 70 | -2.6667 | 8 | 0 | 8 | 0.0078 |
| `recon.timeouts` | 1 | 0 | -0.1111 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 15 | 0 | -1.6667 | 6 | 0 | 6 | 0.0313 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 90 | 70 | -2.2222 | 8 | 0 | 8 | 0.0078 |
| `squadPerformance.meanOverall` | 773.5 | 756.2 | -1.9222 | 8 | 2 | 6 | 0.2891 |
| `squadPerformance.p10Overall` | 698.8 | 686.8000000000001 | -1.3333 | 8 | 3 | 5 | 0.7266 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 652.3 | 613 | -4.3667 | 8 | 1 | 7 | 0.0703 |
| `squadPerformance.meanMovement` | 839.9999999999999 | 815.0000000000001 | -2.7778 | 8 | 0 | 8 | 0.0078 |
| `squadPerformance.meanControl` | 870.3000000000001 | 893.8 | 2.6111 | 8 | 8 | 0 | 0.0078 |
| `squadPerformance.meanCohesion` | 858.1999999999999 | 839.9000000000001 | -2.0333 | 7 | 2 | 5 | 0.4531 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

scripted-scout-0003 61.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=328&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=328`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

