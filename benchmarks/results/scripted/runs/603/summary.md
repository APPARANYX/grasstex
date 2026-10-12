# Benchmark run #603 · scripted scenario `12345` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/299-phase-c-unique-fire-support-acceptance @ 601f3d9 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38203723050) · build v29-dev

## Verdict

**one battle per arm, 8 of 8 records changed, first part at 239.1 s, casualties 181 to 175: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **8** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.014 (gate 1.25)
- the 7 changed records first part at simulated second: min 239.1, p10 239.1, median 239.1, p90 239.1, max 239.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 181 | 175 | -0.75 | 5 | 1 | 4 | 0.375 |
| `usKills` | 136 | 143 | 0.875 | 6 | 4 | 2 | 0.6875 |
| `geKills` | 45 | 32 | -1.625 | 5 | 0 | 5 | 0.0625 |
| `fire.total` | 289 | 191 | -12.25 | 5 | 1 | 4 | 0.375 |
| `fire.hits` | 85 | 84 | -0.125 | 6 | 3 | 3 | 1 |
| `retreatSamples` | 1582 | 1543 | -4.875 | 6 | 2 | 4 | 0.6875 |
| `movementResolver.changes` | 14197 | 14013 | -23 | 7 | 3 | 4 | 1 |
| `grenades.throws` | 0 | 4 | 0.5 | 1 | 1 | 0 | 1 |
| `grenades.bursts` | 0 | 4 | 0.5 | 1 | 1 | 0 | 1 |
| `grenades.wounded` | 0 | 1 | 0.125 | 1 | 1 | 0 | 1 |
| `grenades.casualties` | 0 | 1 | 0.125 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 0 | 8 | 1 | 1 | 1 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 0 | -0.25 | 2 | 0 | 2 | 0.5 |
| `loopAlerts.length` | 5 | 0 | -0.625 | 2 | 0 | 2 | 0.5 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 30 | 29 | -0.125 | 2 | 1 | 1 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 219 | 182 | -4.625 | 8 | 0 | 8 | 0.0078 |
| `recon.contacts` | 16 | 4 | -1.5 | 6 | 0 | 6 | 0.0313 |
| `recon.noContact` | 124 | 114 | -1.25 | 4 | 0 | 4 | 0.125 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 71 | 62 | -1.125 | 6 | 0 | 6 | 0.0313 |
| `recon.reportsDelivered` | 70 | 10 | -7.5 | 6 | 0 | 6 | 0.0313 |
| `recon.retriggerBlocked` | 142 | 141 | -0.125 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanOverall` | 702.2 | 704.5 | 0.2875 | 4 | 4 | 0 | 0.125 |
| `squadPerformance.p10Overall` | 636.4000000000001 | 636.3000000000001 | -0.0125 | 1 | 0 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 587.7 | 591.0999999999999 | 0.425 | 3 | 3 | 0 | 0.25 |
| `squadPerformance.meanMovement` | 797.1999999999999 | 797.7 | 0.0625 | 6 | 5 | 1 | 0.2188 |
| `squadPerformance.meanControl` | 795.3000000000001 | 797.8000000000001 | 0.3125 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanCohesion` | 714.8000000000001 | 711.2 | -0.45 | 6 | 3 | 3 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

12345 239.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=603&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/299-phase-c-unique-fire-support-acceptance/ai_flow_live.html?bench=603&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=603`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

