# Benchmark run #1408 · scripted scenario `controller-contact-20261028` (meeting), windows `contact+60,every60`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/slice23-091153aa @ 091153a · [run](https://github.com/APPARANYX/grasstex/actions/runs/40762575801) · build v29-dev

## Verdict

**one battle per arm, 6 of 6 records changed, first part at 1.05 s, casualties 172 to 225: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.
- Unpaired records: off 2, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **6** pairs (unpaired: off 2, on 1) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.161 (gate 1.25)
- the 6 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 172 | 225 | 8.8333 | 6 | 5 | 1 | 0.2188 |
| `usKills` | 103 | 125 | 3.6667 | 6 | 5 | 1 | 0.2188 |
| `geKills` | 69 | 100 | 5.1667 | 5 | 5 | 0 | 0.0625 |
| `fire.total` | 146 | 188 | 7 | 5 | 2 | 3 | 1 |
| `fire.hits` | 64 | 79 | 2.5 | 5 | 2 | 3 | 1 |
| `retreatSamples` | 1017 | 1975 | 159.6667 | 6 | 6 | 0 | 0.0313 |
| `movementResolver.changes` | 13413 | 5835 | -1263 | 6 | 0 | 6 | 0.0313 |
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
| `vacantObjectiveStalls.length` | 0 | 4 | 0.6667 | 2 | 2 | 0 | 0.5 |
| `loopAlerts.length` | 2 | 11 | 1.5 | 3 | 2 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 23 | 0 | -3.8333 | 6 | 0 | 6 | 0.0313 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 162 | 12 | -25 | 6 | 0 | 6 | 0.0313 |
| `recon.contacts` | 16 | 0 | -2.6667 | 6 | 0 | 6 | 0.0313 |
| `recon.noContact` | 93 | 0 | -15.5 | 6 | 0 | 6 | 0.0313 |
| `recon.timeouts` | 1 | 0 | -0.1667 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 48 | 12 | -6 | 6 | 0 | 6 | 0.0313 |
| `recon.reportsDelivered` | 84 | 0 | -14 | 6 | 0 | 6 | 0.0313 |
| `recon.retriggerBlocked` | 131 | 0 | -21.8333 | 6 | 0 | 6 | 0.0313 |
| `squadPerformance.meanOverall` | 515.5 | 506 | -1.5833 | 5 | 1 | 4 | 0.375 |
| `squadPerformance.p10Overall` | 475.5 | 474.4 | -0.1833 | 3 | 1 | 2 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 427.29999999999995 | 389.5 | -6.3 | 6 | 0 | 6 | 0.0313 |
| `squadPerformance.meanMovement` | 592.1 | 599.8 | 1.2833 | 4 | 4 | 0 | 0.125 |
| `squadPerformance.meanControl` | 597.6 | 592.9000000000001 | -0.7833 | 6 | 4 | 2 | 0.6875 |
| `squadPerformance.meanCohesion` | 495.40000000000003 | 503.19999999999993 | 1.3 | 6 | 3 | 3 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

controller-contact-20261028 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1408&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-slice23-091153aa/ai_flow_live.html?bench=1408&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1408`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

