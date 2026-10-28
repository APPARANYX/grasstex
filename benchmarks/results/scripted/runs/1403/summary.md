# Benchmark run #1403 · scripted scenario `controller-contact-20261028` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `tacticalController=new`
- work/pin/slice23-b23fac3e @ b23fac3 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40761216476) · build v29-dev

## Verdict

**one battle per arm, 2 of 2 records changed, first part at 1.05 s, casualties 20 to 17: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.
- Unpaired records: off 1, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **2** pairs (unpaired: off 1, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.162 (gate 1.25)
- the 2 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 20 | 17 | -1.5 | 2 | 1 | 1 | 1 |
| `usKills` | 11 | 2 | -4.5 | 2 | 0 | 2 | 0.5 |
| `geKills` | 9 | 15 | 3 | 1 | 1 | 0 | 1 |
| `fire.total` | 103 | 39 | -32 | 2 | 1 | 1 | 1 |
| `fire.hits` | 34 | 15 | -9.5 | 2 | 0 | 2 | 0.5 |
| `retreatSamples` | 234 | 19 | -107.5 | 2 | 0 | 2 | 0.5 |
| `movementResolver.changes` | 2110 | 875 | -617.5 | 2 | 0 | 2 | 0.5 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 1 | 0 | -0.5 | 1 | 0 | 1 | 1 |
| `targetlessStalls.length` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 4 | 2 | 2 | 2 | 0 | 0.5 |
| `stallOutcomes.repeats` | 0 | 4 | 2 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 33 | 0 | -16.5 | 2 | 0 | 2 | 0.5 |
| `recon.contacts` | 2 | 0 | -1 | 2 | 0 | 2 | 0.5 |
| `recon.noContact` | 6 | 0 | -3 | 2 | 0 | 2 | 0.5 |
| `recon.timeouts` | 11 | 0 | -5.5 | 2 | 0 | 2 | 0.5 |
| `recon.cancelled` | 13 | 0 | -6.5 | 2 | 0 | 2 | 0.5 |
| `recon.reportsDelivered` | 14 | 0 | -7 | 2 | 0 | 2 | 0.5 |
| `recon.retriggerBlocked` | 17 | 0 | -8.5 | 2 | 0 | 2 | 0.5 |
| `squadPerformance.meanOverall` | 169.6 | 179.1 | 4.75 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.p10Overall` | 146.89999999999998 | 159.3 | 6.2 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.lowScoreSquads` | 1 | 0 | -0.5 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanMission` | 138.4 | 167.2 | 14.4 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanMovement` | 190.60000000000002 | 199.7 | 4.55 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanControl` | 196.8 | 197.6 | 0.4 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanCohesion` | 178.89999999999998 | 147 | -15.95 | 2 | 0 | 2 | 0.5 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

controller-contact-20261028 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1403&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-slice23-b23fac3e/ai_flow_live.html?bench=1403&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1403`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

