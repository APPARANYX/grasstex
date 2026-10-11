# Benchmark run #537 · 2 seeds from `phase-a-control` (ge-defend), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `none`
- work/tactics-b1-intent-evidence @ c95399b · [run](https://github.com/APPARANYX/grasstex/actions/runs/38147036111) · build v29-dev

## Verdict

**INERT: all 2 pairs identical in every field**


## Paired comparison (off against on)

- **2** pairs (unpaired: off 0, on 0) · identical in every field: **2** · runtime errors off 0 / on 0 · wall time on/off x0.94 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 43 | 43 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 23 | 23 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 233 | 233 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 85 | 85 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 400 | 400 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 2538 | 2538 | 0 | 0 | 0 | 0 | 1 |
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
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 37 | 37 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 21 | 21 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 21 | 21 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 170.7 | 170.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 151 | 151 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 142.7 | 142.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 199.8 | 199.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 198.8 | 198.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 182.8 | 182.8 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

phase-a-control-0001 (identical) · phase-a-control-0002 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=537&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/tactics-b1-intent-evidence/ai_flow_live.html?bench=537&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=537`); it opens the seed that parts earliest, and the dropdowns choose another.

