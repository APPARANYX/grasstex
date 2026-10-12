# Benchmark run #647 · scripted scenario `live-mv5apwx1-djrk` (us-defend), windows `contact+60,every60`

- **OFF** flags: `effectiveFire=0` · **ON** flags: `effectiveFire=1`
- work/299-c3-effective-fire-voice @ 5c2e528 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38264568056) · build v29-dev

## Verdict

**one battle per arm, 8 of 8 records changed, first part at 166.05 s, casualties 324 to 332: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **8** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.938 (gate 1.25)
- the 8 changed records first part at simulated second: min 166.05, p10 166.05, median 166.05, p90 166.05, max 166.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 324 | 332 | 1 | 7 | 4 | 3 | 1 |
| `usKills` | 115 | 124 | 1.125 | 7 | 4 | 3 | 1 |
| `geKills` | 209 | 208 | -0.125 | 7 | 3 | 4 | 1 |
| `fire.total` | 496 | 502 | 0.75 | 7 | 3 | 4 | 1 |
| `fire.hits` | 125 | 144 | 2.375 | 8 | 4 | 4 | 1 |
| `retreatSamples` | 1536 | 2017 | 60.125 | 8 | 6 | 2 | 0.2891 |
| `movementResolver.changes` | 15745 | 15316 | -53.625 | 8 | 3 | 5 | 0.7266 |
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
| `vacantObjectiveStalls.length` | 3 | 4 | 0.125 | 4 | 2 | 2 | 1 |
| `loopAlerts.length` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 21 | 35 | 1.75 | 6 | 6 | 0 | 0.0313 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 146 | 149 | 0.375 | 7 | 4 | 3 | 1 |
| `recon.contacts` | 18 | 22 | 0.5 | 5 | 4 | 1 | 0.375 |
| `recon.noContact` | 86 | 96 | 1.25 | 4 | 4 | 0 | 0.125 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 39 | 25 | -1.75 | 7 | 0 | 7 | 0.0156 |
| `recon.reportsDelivered` | 85 | 134 | 6.125 | 6 | 5 | 1 | 0.2188 |
| `recon.retriggerBlocked` | 105 | 110 | 0.625 | 6 | 3 | 3 | 1 |
| `squadPerformance.meanOverall` | 710.1999999999999 | 697.0999999999999 | -1.6375 | 8 | 2 | 6 | 0.2891 |
| `squadPerformance.p10Overall` | 648.7 | 650.6 | 0.2375 | 6 | 4 | 2 | 0.6875 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 613.9 | 594.1999999999999 | -2.4625 | 8 | 2 | 6 | 0.2891 |
| `squadPerformance.meanMovement` | 797.7 | 796.3 | -0.175 | 4 | 2 | 2 | 1 |
| `squadPerformance.meanControl` | 797.9 | 798.5 | 0.075 | 4 | 2 | 2 | 1 |
| `squadPerformance.meanCohesion` | 714.5 | 677.7 | -4.6 | 8 | 1 | 7 | 0.0703 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

live-mv5apwx1-djrk 166.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=647&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/299-c3-effective-fire-voice/ai_flow_live.html?bench=647&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=647`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

