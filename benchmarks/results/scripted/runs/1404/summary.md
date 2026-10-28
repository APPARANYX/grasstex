# Benchmark run #1404 · scripted scenario `controller-contact-20261028` (meeting), windows `contact+60,every60`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/slice23-b23fac3e @ b23fac3 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40761217306) · build v29-dev

## Verdict

**one battle per arm, 5 of 5 records changed, first part at 1.05 s, casualties 136 to 205: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.
- Unpaired records: off 3, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **5** pairs (unpaired: off 3, on 1) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.06 (gate 1.25)
- the 5 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 136 | 205 | 13.8 | 5 | 4 | 1 | 0.375 |
| `usKills` | 83 | 80 | -0.6 | 5 | 2 | 3 | 1 |
| `geKills` | 53 | 125 | 14.4 | 5 | 5 | 0 | 0.0625 |
| `fire.total` | 140 | 111 | -5.8 | 4 | 2 | 2 | 1 |
| `fire.hits` | 62 | 67 | 1 | 4 | 2 | 2 | 1 |
| `retreatSamples` | 777 | 1231 | 90.8 | 5 | 4 | 1 | 0.375 |
| `movementResolver.changes` | 10900 | 4332 | -1313.6 | 5 | 0 | 5 | 0.0625 |
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
| `vacantObjectiveStalls.length` | 0 | 3 | 0.6 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 2 | 7 | 1 | 3 | 2 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 19 | 0 | -3.8 | 5 | 0 | 5 | 0.0625 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 132 | 10 | -24.4 | 5 | 0 | 5 | 0.0625 |
| `recon.contacts` | 12 | 0 | -2.4 | 5 | 0 | 5 | 0.0625 |
| `recon.noContact` | 76 | 0 | -15.2 | 5 | 0 | 5 | 0.0625 |
| `recon.timeouts` | 1 | 0 | -0.2 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 40 | 10 | -6 | 5 | 0 | 5 | 0.0625 |
| `recon.reportsDelivered` | 66 | 0 | -13.2 | 5 | 0 | 5 | 0.0625 |
| `recon.retriggerBlocked` | 107 | 0 | -21.4 | 5 | 0 | 5 | 0.0625 |
| `squadPerformance.meanOverall` | 429.8 | 420.6 | -1.84 | 5 | 1 | 4 | 0.375 |
| `squadPerformance.p10Overall` | 394.9 | 396.4 | 0.3 | 2 | 1 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 358.29999999999995 | 333.20000000000005 | -5.02 | 5 | 0 | 5 | 0.0625 |
| `squadPerformance.meanMovement` | 493.7 | 499.59999999999997 | 1.18 | 4 | 3 | 1 | 0.625 |
| `squadPerformance.meanControl` | 498.00000000000006 | 494.8 | -0.64 | 5 | 3 | 2 | 1 |
| `squadPerformance.meanCohesion` | 412.3 | 397.79999999999995 | -2.9 | 5 | 2 | 3 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

controller-contact-20261028 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1404&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-slice23-b23fac3e/ai_flow_live.html?bench=1404&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1404`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

