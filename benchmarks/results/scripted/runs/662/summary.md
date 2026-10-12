# Benchmark run #662 · scripted scenario `live-mv5apwx1-djrk` (meeting), windows `contact+60,every60`

- **OFF** flags: `effectiveFire=0` · **ON** flags: `effectiveFire=1`
- work/299-c3-effective-fire-voice @ 75489f0 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38265718487) · build v29-dev

## Verdict

**one battle per arm, 6 of 6 records changed, first part at 245.1 s, casualties 244 to 253: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.
- Unpaired records: off 0, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **6** pairs (unpaired: off 0, on 1) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.995 (gate 1.25)
- the 6 changed records first part at simulated second: min 245.1, p10 245.1, median 245.1, p90 245.1, max 245.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 244 | 253 | 1.5 | 6 | 3 | 3 | 1 |
| `usKills` | 143 | 150 | 1.1667 | 6 | 3 | 3 | 1 |
| `geKills` | 101 | 103 | 0.3333 | 6 | 4 | 2 | 0.6875 |
| `fire.total` | 232 | 251 | 3.1667 | 5 | 2 | 3 | 1 |
| `fire.hits` | 110 | 113 | 0.5 | 5 | 2 | 3 | 1 |
| `retreatSamples` | 755 | 931 | 29.3333 | 5 | 4 | 1 | 0.375 |
| `movementResolver.changes` | 17261 | 20093 | 472 | 6 | 6 | 0 | 0.0313 |
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
| `vacantObjectiveStalls.length` | 2 | 4 | 0.3333 | 3 | 2 | 1 | 1 |
| `loopAlerts.length` | 3 | 16 | 2.1667 | 3 | 3 | 0 | 0.25 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 165 | 153 | -2 | 5 | 0 | 5 | 0.0625 |
| `recon.contacts` | 6 | 7 | 0.1667 | 1 | 1 | 0 | 1 |
| `recon.noContact` | 103 | 99 | -0.6667 | 3 | 0 | 3 | 0.25 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 52 | 43 | -1.5 | 4 | 0 | 4 | 0.125 |
| `recon.reportsDelivered` | 0 | 2 | 0.3333 | 1 | 1 | 0 | 1 |
| `recon.retriggerBlocked` | 126 | 116 | -1.6667 | 5 | 1 | 4 | 0.375 |
| `squadPerformance.meanOverall` | 534.0000000000001 | 516.9 | -2.85 | 6 | 1 | 5 | 0.2188 |
| `squadPerformance.p10Overall` | 487.20000000000005 | 482.1 | -0.85 | 3 | 1 | 2 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 458.5 | 420.9 | -6.2667 | 5 | 0 | 5 | 0.0625 |
| `squadPerformance.meanMovement` | 594 | 594.2 | 0.0333 | 5 | 4 | 1 | 0.375 |
| `squadPerformance.meanControl` | 596.1 | 592.9 | -0.5333 | 4 | 1 | 3 | 0.625 |
| `squadPerformance.meanCohesion` | 554.1 | 539.3 | -2.4667 | 5 | 2 | 3 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

live-mv5apwx1-djrk 245.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=662&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/299-c3-effective-fire-voice/ai_flow_live.html?bench=662&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=662`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

