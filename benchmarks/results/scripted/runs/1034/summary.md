# Benchmark run #1034 · 3 seeds from `pr585-full5km-pilot-us-defend-20261019` (us-defend), windows `0+10800`

- **OFF** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1` · **ON** flags: `strategicInterception=1&frontLines=1&reinforcements=1&motorTransport=1&aerialRecon=1&interception=1&pinSeed=1`
- work/strategic-benchmark-endurance-20261019 @ 8c80298 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39352967545) · build v29-dev

## Verdict

**INERT: all 3 pairs identical in every field**


## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **3** · runtime errors off 0 / on 0 · wall time on/off x0.99 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 408 | 408 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 212 | 212 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 196 | 196 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 1914 | 1914 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 824 | 824 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 244254 | 244254 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 15435 | 15435 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 128 | 128 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 74 | 74 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 57 | 57 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 44 | 44 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 165 | 165 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 962 | 962 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 165 | 165 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 962 | 962 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 177 | 177 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 88 | 88 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 64 | 64 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 15 | 15 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 117 | 117 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 231.8 | 231.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 220.2 | 220.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 171.10000000000002 | 171.10000000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 286.2 | 286.2 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 282.7 | 282.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 289.9 | 289.9 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

pr585-full5km-pilot-us-defend-20261019-0001 (identical) · pr585-full5km-pilot-us-defend-20261019-0002 (identical) · pr585-full5km-pilot-us-defend-20261019-0003 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1034&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/strategic-benchmark-endurance-20261019/ai_flow_live.html?bench=1034&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1034`); it opens the seed that parts earliest, and the dropdowns choose another.

