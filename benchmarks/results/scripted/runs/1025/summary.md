# Benchmark run #1025 · scripted scenario `live-mvfkx3w6-8ekep` (meeting), windows `contact+60,every60`

- **OFF** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1` · **ON** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1`
- claude/strategic-preview-hye9fi @ ce293e7 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39305818308) · build v29-dev

## Verdict

**INERT: all 6 pairs identical in every field**


## Paired comparison (off against on)

- **6** pairs (unpaired: off 0, on 0) · identical in every field: **6** · runtime errors off 0 / on 0 · wall time on/off x1.018 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 116 | 116 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 51 | 51 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 65 | 65 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 140 | 140 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 60 | 60 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 482 | 482 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 3683 | 3683 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 71 | 71 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 24 | 24 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 142 | 142 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 46 | 46 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 28 | 28 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 28 | 28 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 542.4 | 542.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 469.1 | 469.1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 480.20000000000005 | 480.20000000000005 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 563.6999999999999 | 563.6999999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 588.2 | 588.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 585.7 | 585.7 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## Where the arms part (simulated seconds)

live-mvfkx3w6-8ekep (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1025&pick=-end&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1025`); it opens the full-length record (`pick=-end`), and the dropdowns choose another.

