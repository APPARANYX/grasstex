# Benchmark run #1040 · scripted scenario `truck-riders-contact-20261020` (meeting), windows `contact+60,every60`

- **OFF** flags: `strategicInterception=1&crewEyes=0` · **ON** flags: `strategicInterception=1`
- work/truck-riders-contact-fix-20261020 @ 64799fe · [run](https://github.com/APPARANYX/grasstex/actions/runs/39443719889) · build v29-dev

## Verdict

**one battle per arm, 7 of 7 records changed, first part at 232.05 s, casualties 123 to 102: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **7** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.072 (gate 1.25)
- the 7 changed records first part at simulated second: min 232.05, p10 232.05, median 232.05, p90 232.05, max 232.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 123 | 102 | -3 | 7 | 3 | 4 | 1 |
| `usKills` | 32 | 5 | -3.8571 | 7 | 0 | 7 | 0.0156 |
| `geKills` | 91 | 97 | 0.8571 | 7 | 3 | 4 | 1 |
| `fire.total` | 118 | 102 | -2.2857 | 4 | 1 | 3 | 0.625 |
| `fire.hits` | 56 | 31 | -3.5714 | 3 | 1 | 2 | 1 |
| `retreatSamples` | 725 | 536 | -27 | 4 | 0 | 4 | 0.125 |
| `movementResolver.changes` | 4150 | 5377 | 175.2857 | 7 | 7 | 0 | 0.0156 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 6 | 0 | -0.8571 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 3 | 1 | -0.2857 | 2 | 0 | 2 | 0.5 |
| `targetlessStalls.length` | 1 | 0 | -0.1429 | 1 | 0 | 1 | 1 |
| `vacantObjectiveStalls.length` | 3 | 2 | -0.1429 | 3 | 1 | 2 | 1 |
| `loopAlerts.length` | 3 | 13 | 1.4286 | 4 | 3 | 1 | 0.625 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 24 | 19 | -0.7143 | 4 | 1 | 3 | 0.625 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 6 | 0 | -0.8571 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledSamples` | 33 | 0 | -4.7143 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledOnsetsRepeated` | 14 | 0 | -2 | 4 | 0 | 4 | 0.125 |
| `timeline.stalledSamplesRepeated` | 72 | 0 | -10.2857 | 4 | 0 | 4 | 0.125 |
| `recon.orders` | 64 | 76 | 1.7143 | 5 | 5 | 0 | 0.0625 |
| `recon.contacts` | 0 | 15 | 2.1429 | 5 | 5 | 0 | 0.0625 |
| `recon.noContact` | 14 | 0 | -2 | 5 | 0 | 5 | 0.0625 |
| `recon.timeouts` | 21 | 12 | -1.2857 | 5 | 0 | 5 | 0.0625 |
| `recon.cancelled` | 18 | 37 | 2.7143 | 6 | 6 | 0 | 0.0313 |
| `recon.reportsDelivered` | 0 | 35 | 5 | 5 | 5 | 0 | 0.0625 |
| `recon.retriggerBlocked` | 39 | 21 | -2.5714 | 5 | 0 | 5 | 0.0625 |
| `squadPerformance.meanOverall` | 607.6000000000001 | 626.3000000000001 | 2.6714 | 7 | 7 | 0 | 0.0156 |
| `squadPerformance.p10Overall` | 550 | 563.4 | 1.9143 | 7 | 5 | 2 | 0.4531 |
| `squadPerformance.lowScoreSquads` | 1 | 0 | -0.1429 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanMission` | 486.9 | 539.5 | 7.5143 | 7 | 7 | 0 | 0.0156 |
| `squadPerformance.meanMovement` | 676.9000000000001 | 674.2 | -0.3857 | 7 | 3 | 4 | 1 |
| `squadPerformance.meanControl` | 693.9999999999999 | 690.8 | -0.4571 | 5 | 2 | 3 | 1 |
| `squadPerformance.meanCohesion` | 639.2999999999998 | 658.5 | 2.7429 | 7 | 5 | 2 | 0.4531 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

truck-riders-contact-20261020 232.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1040&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/truck-riders-contact-fix-20261020/ai_flow_live.html?bench=1040&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1040`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

