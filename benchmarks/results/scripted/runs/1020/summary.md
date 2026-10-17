# Benchmark run #1020 · 60 seeds from `exec361p` (meeting), windows `contact+600`

- **OFF** flags: `screenStallHold=0&transportHandoff=0` · **ON** flags: `none`
- work/strategic-interception-macro-20261016 @ 1b465cd · [run](https://github.com/APPARANYX/grasstex/actions/runs/39003933781) · build v29-dev

## Verdict

**INERT: all 60 pairs identical in every field**


## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **60** · runtime errors off 0 / on 0 · wall time on/off x0.995 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 3161 | 3161 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1443 | 1443 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1718 | 1718 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 14186 | 14186 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 6105 | 6105 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 85274 | 85274 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 179546 | 179546 | 0 | 0 | 0 | 0 | 1 |
| `grenades.throws` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 11 | 11 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 20 | 20 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 328 | 328 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 802 | 802 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 203 | 203 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1906 | 1906 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 97 | 97 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1154 | 1154 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 19 | 19 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 558 | 558 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 466 | 466 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1461 | 1461 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4860.000000000001 | 4860.000000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4503.399999999999 | 4503.399999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4084.5999999999985 | 4084.5999999999985 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5934.8 | 5934.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5500.600000000002 | 5500.600000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 5288.0999999999985 | 5288.0999999999985 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

exec361p-0001 (identical) · exec361p-0002 (identical) · exec361p-0003 (identical) · exec361p-0004 (identical) · exec361p-0005 (identical) · exec361p-0006 (identical) · exec361p-0007 (identical) · exec361p-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1020&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/strategic-interception-macro-20261016/ai_flow_live.html?bench=1020&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1020`); it opens the seed that parts earliest, and the dropdowns choose another.

