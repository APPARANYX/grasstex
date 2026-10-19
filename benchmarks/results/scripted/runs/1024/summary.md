# Benchmark run #1024 · scripted scenario `live-mvfk4j06-117yk` (meeting), windows `contact+60,every60`

- **OFF** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1` · **ON** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1`
- work/strategic-preview-review-20261019 @ c2d6ef9 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39301251137) · build v29-dev

## Verdict

**INERT: all 6 pairs identical in every field**


## Paired comparison (off against on)

- **6** pairs (unpaired: off 0, on 0) · identical in every field: **6** · runtime errors off 0 / on 0 · wall time on/off x1.014 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 69 | 69 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 61 | 61 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 133 | 133 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 50 | 50 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 137 | 137 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 4316 | 4316 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 23 | 23 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 50 | 50 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 33 | 33 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 39 | 39 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 539.4 | 539.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 470.99999999999994 | 470.99999999999994 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 507 | 507 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 554.7 | 554.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 577.9 | 577.9 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 533 | 533 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

live-mvfk4j06-117yk (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1024&pick=-end&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/strategic-preview-review-20261019/ai_flow_live.html?bench=1024&pick=-end&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1024`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

