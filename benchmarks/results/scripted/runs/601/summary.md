# Benchmark run #601 · scripted scenario `12345` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/299-phase-c-unique-fire-support-acceptance @ 601f3d9 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38203713148) · build v29-dev

## Verdict

**one battle per arm, 7 of 7 records changed, first part at 282 s, casualties 313 to 355: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **7** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.008 (gate 1.25)
- the 6 changed records first part at simulated second: min 282, p10 282, median 282, p90 282, max 282

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 313 | 355 | 6 | 5 | 5 | 0 | 0.0625 |
| `usKills` | 160 | 174 | 2 | 5 | 5 | 0 | 0.0625 |
| `geKills` | 153 | 181 | 4 | 4 | 4 | 0 | 0.125 |
| `fire.total` | 361 | 312 | -7 | 4 | 1 | 3 | 0.625 |
| `fire.hits` | 120 | 116 | -0.5714 | 3 | 2 | 1 | 1 |
| `retreatSamples` | 1409 | 1344 | -9.2857 | 5 | 1 | 4 | 0.375 |
| `movementResolver.changes` | 19625 | 19439 | -26.5714 | 6 | 1 | 5 | 0.2188 |
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
| `vacantObjectiveStalls.length` | 7 | 5 | -0.2857 | 4 | 2 | 2 | 1 |
| `loopAlerts.length` | 11 | 5 | -0.8571 | 3 | 0 | 3 | 0.25 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 24 | 25 | 0.1429 | 1 | 1 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 204 | 186 | -2.5714 | 5 | 1 | 4 | 0.375 |
| `recon.contacts` | 6 | 4 | -0.2857 | 4 | 1 | 3 | 0.625 |
| `recon.noContact` | 146 | 137 | -1.2857 | 4 | 0 | 4 | 0.125 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 48 | 42 | -0.8571 | 4 | 2 | 2 | 1 |
| `recon.reportsDelivered` | 21 | 16 | -0.7143 | 4 | 1 | 3 | 0.625 |
| `recon.retriggerBlocked` | 186 | 167 | -2.7143 | 4 | 0 | 4 | 0.125 |
| `squadPerformance.meanOverall` | 605.5999999999999 | 608.6 | 0.4286 | 6 | 4 | 2 | 0.6875 |
| `squadPerformance.p10Overall` | 553.9000000000001 | 555.7 | 0.2571 | 2 | 1 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 506.29999999999995 | 508.9 | 0.3714 | 6 | 2 | 4 | 0.6875 |
| `squadPerformance.meanMovement` | 687.9 | 690.6999999999999 | 0.4 | 5 | 3 | 2 | 1 |
| `squadPerformance.meanControl` | 691.1999999999999 | 694.1 | 0.4143 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanCohesion` | 609.4 | 610.6999999999999 | 0.1857 | 6 | 4 | 2 | 0.6875 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

12345 282 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=601&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/299-phase-c-unique-fire-support-acceptance/ai_flow_live.html?bench=601&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=601`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

