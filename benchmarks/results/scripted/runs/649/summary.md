# Benchmark run #649 · scripted scenario `live-mv5apwx1-djrk` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `effectiveFire=0` · **ON** flags: `effectiveFire=1`
- work/299-c3-effective-fire-voice @ 5c2e528 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38264720310) · build v29-dev

## Verdict

**one battle per arm, 9 of 9 records changed, first part at 155.1 s, casualties 227 to 279: sizes, not findings**

- The pairs are checkpoints of one battle, so the sign tests in the table are not independent: read the sizes and where the arms part, not the p values.

## Paired comparison (off against on)

- **9** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.918 (gate 1.25)
- the 9 changed records first part at simulated second: min 155.1, p10 155.1, median 155.1, p90 155.1, max 155.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 227 | 279 | 5.7778 | 9 | 6 | 3 | 0.5078 |
| `usKills` | 172 | 147 | -2.7778 | 9 | 1 | 8 | 0.0391 |
| `geKills` | 55 | 132 | 8.5556 | 7 | 7 | 0 | 0.0156 |
| `fire.total` | 211 | 346 | 15 | 9 | 6 | 3 | 0.5078 |
| `fire.hits` | 92 | 111 | 2.1111 | 9 | 5 | 4 | 1 |
| `retreatSamples` | 2193 | 2965 | 85.7778 | 9 | 7 | 2 | 0.1797 |
| `movementResolver.changes` | 15715 | 15352 | -40.3333 | 9 | 5 | 4 | 1 |
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
| `vacantObjectiveStalls.length` | 6 | 4 | -0.2222 | 3 | 1 | 2 | 1 |
| `loopAlerts.length` | 3 | 1 | -0.2222 | 2 | 0 | 2 | 0.5 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 203 | 199 | -0.4444 | 6 | 2 | 4 | 0.6875 |
| `recon.contacts` | 48 | 53 | 0.5556 | 5 | 4 | 1 | 0.375 |
| `recon.noContact` | 99 | 98 | -0.1111 | 6 | 3 | 3 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 51 | 45 | -0.6667 | 6 | 1 | 5 | 0.2188 |
| `recon.reportsDelivered` | 259 | 251 | -0.8889 | 7 | 4 | 3 | 1 |
| `recon.retriggerBlocked` | 124 | 120 | -0.4444 | 5 | 2 | 3 | 1 |
| `squadPerformance.meanOverall` | 779 | 782.8 | 0.4222 | 8 | 4 | 4 | 1 |
| `squadPerformance.p10Overall` | 722.7000000000002 | 721.0000000000001 | -0.1889 | 4 | 1 | 3 | 0.625 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 646.4 | 612.5000000000001 | -3.7667 | 9 | 1 | 8 | 0.0391 |
| `squadPerformance.meanMovement` | 891.9000000000001 | 897.5999999999999 | 0.6333 | 7 | 3 | 4 | 1 |
| `squadPerformance.meanControl` | 896.9 | 898.4 | 0.1667 | 7 | 5 | 2 | 0.4531 |
| `squadPerformance.meanCohesion` | 780 | 839.4 | 6.6 | 9 | 9 | 0 | 0.0039 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

live-mv5apwx1-djrk 155.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=649&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/299-c3-effective-fire-voice/ai_flow_live.html?bench=649&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=649`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

