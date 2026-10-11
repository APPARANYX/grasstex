# Benchmark run #535 · 2 seeds from `phase-a-control` (meeting), windows `contact+120`

- **OFF** flags: `none` · **ON** flags: `none`
- work/tactics-b1-intent-evidence @ c95399b · [run](https://github.com/APPARANYX/grasstex/actions/runs/38147031450) · build v29-dev

## Verdict

**INERT: all 2 pairs identical in every field**


## Paired comparison (off against on)

- **2** pairs (unpaired: off 0, on 0) · identical in every field: **2** · runtime errors off 0 / on 0 · wall time on/off x0.955 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 46 | 46 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 21 | 21 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 25 | 25 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 258 | 258 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 95 | 95 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 214 | 214 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 4635 | 4635 | 0 | 0 | 0 | 0 | 1 |
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
| `loopAlerts.length` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 45 | 45 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 29 | 29 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 18 | 18 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 36 | 36 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 169.9 | 169.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 150.5 | 150.5 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 144.7 | 144.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 197.39999999999998 | 197.39999999999998 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 193.7 | 193.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 178.5 | 178.5 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 2 seeds that part earliest (simulated seconds)

phase-a-control-0001 (identical) · phase-a-control-0002 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=535&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/tactics-b1-intent-evidence/ai_flow_live.html?bench=535&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=535`); it opens the seed that parts earliest, and the dropdowns choose another.

