# Benchmark run #1050 · 3 seeds from `audit-terrain-restart-20261020` (meeting), windows `0+600`

- **OFF** flags: `none` · **ON** flags: `none`
- work/terrain-restart-owner-20261020 @ 74c3da3 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39512482782) · build v29-dev

## Verdict

**INERT: all 3 pairs identical in every field**


## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x1.013 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 100 | 100 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 38 | 38 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 62 | 62 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 526 | 526 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 206 | 206 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 1847 | 1847 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 4244 | 4244 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 21 | 21 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 39 | 39 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 13 | 13 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 64 | 64 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 21 | 21 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 23 | 23 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 36 | 36 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 260.8 | 260.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 225.5 | 225.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 228 | 228 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 288.1 | 288.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 277.2 | 277.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 292.5 | 292.5 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

audit-terrain-restart-20261020-0001 (identical) · audit-terrain-restart-20261020-0002 (identical) · audit-terrain-restart-20261020-0003 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1050&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/terrain-restart-owner-20261020/ai_flow_live.html?bench=1050&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1050`); it opens the seed that parts earliest, and the dropdowns choose another.

