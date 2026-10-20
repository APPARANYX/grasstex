# Benchmark run #1035 · 3 seeds from `pr585-full5km-pilot-ge-defend-20261019` (ge-defend), windows `0+10800`

- **OFF** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1` · **ON** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1`
- work/strategic-benchmark-endurance-20261019 @ 8c80298 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39352981574) · build v29-dev

## Verdict

**INERT: all 3 pairs identical in every field**


## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x1.07 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 353 | 353 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 159 | 159 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 194 | 194 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 1570 | 1570 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 656 | 656 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 281751 | 281751 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 13462 | 13462 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 56 | 56 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 27 | 27 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 54 | 54 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 138 | 138 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 77 | 77 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 531 | 531 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 77 | 77 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 531 | 531 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 111 | 111 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 54 | 54 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 39 | 39 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 17 | 17 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 67 | 67 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 236.6 | 236.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 222 | 222 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 179.4 | 179.4 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 287 | 287 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 287.6 | 287.6 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 290.9 | 290.9 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

pr585-full5km-pilot-ge-defend-20261019-0001 (identical) · pr585-full5km-pilot-ge-defend-20261019-0002 (identical) · pr585-full5km-pilot-ge-defend-20261019-0003 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1035&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/strategic-benchmark-endurance-20261019/ai_flow_live.html?bench=1035&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1035`); it opens the seed that parts earliest, and the dropdowns choose another.

