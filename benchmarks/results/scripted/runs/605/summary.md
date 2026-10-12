# Benchmark run #605 · scripted scenario `12345` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- main @ da6ab4f · [run](https://github.com/APPARANYX/grasstex/actions/runs/38205029147) · build v29-dev

## Verdict

**one battle per arm, 8 of 8 records changed, first part at 184.05 s, casualties 293 to 292: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **8** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.996 (gate 1.25)
- the 8 changed records first part at simulated second: min 184.05, p10 184.05, median 184.05, p90 184.05, max 184.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 293 | 292 | -0.125 | 8 | 4 | 4 | 1 |
| `usKills` | 189 | 147 | -5.25 | 7 | 0 | 7 | 0.0156 |
| `geKills` | 104 | 145 | 5.125 | 8 | 7 | 1 | 0.0703 |
| `fire.total` | 236 | 221 | -1.875 | 6 | 2 | 4 | 0.6875 |
| `fire.hits` | 69 | 79 | 1.25 | 8 | 5 | 3 | 0.7266 |
| `retreatSamples` | 1212 | 1200 | -1.5 | 7 | 2 | 5 | 0.4531 |
| `movementResolver.changes` | 15233 | 16496 | 157.875 | 8 | 6 | 2 | 0.2891 |
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
| `vacantObjectiveStalls.length` | 2 | 4 | 0.25 | 5 | 4 | 1 | 0.375 |
| `loopAlerts.length` | 2 | 5 | 0.375 | 4 | 3 | 1 | 0.625 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 5 | 3 | -0.25 | 2 | 0 | 2 | 0.5 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 134 | 121 | -1.625 | 7 | 1 | 6 | 0.125 |
| `recon.contacts` | 25 | 19 | -0.75 | 7 | 1 | 6 | 0.125 |
| `recon.noContact` | 65 | 62 | -0.375 | 3 | 0 | 3 | 0.25 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 39 | 36 | -0.375 | 7 | 2 | 5 | 0.4531 |
| `recon.reportsDelivered` | 18 | 21 | 0.375 | 6 | 4 | 2 | 0.6875 |
| `recon.retriggerBlocked` | 72 | 72 | 0 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanOverall` | 719.4 | 721.1999999999999 | 0.225 | 7 | 5 | 2 | 0.4531 |
| `squadPerformance.p10Overall` | 650.2 | 647.4000000000001 | -0.35 | 3 | 1 | 2 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 639.5000000000001 | 642.5999999999999 | 0.3875 | 7 | 2 | 5 | 0.4531 |
| `squadPerformance.meanMovement` | 796.4000000000001 | 793.7 | -0.3375 | 7 | 3 | 4 | 1 |
| `squadPerformance.meanControl` | 797.4 | 795.3000000000001 | -0.2625 | 5 | 2 | 3 | 1 |
| `squadPerformance.meanCohesion` | 728.9 | 750.8000000000001 | 2.7375 | 7 | 6 | 1 | 0.125 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

12345 184.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=605&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=605`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

