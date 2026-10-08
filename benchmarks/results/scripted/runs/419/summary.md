# Benchmark run #419 · 24 seeds from `fl13` (meeting), windows `every60`

- **OFF** flags: `none` · **ON** flags: `none`
- claude/planlocal-widening @ 3324470 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37775469223) · build v29-dev

## Verdict

**INERT: all 228 pairs identical in every field**


## Paired comparison (off against on)

- **228** pairs (unpaired: off 0, on 0) · identical in every field: **228** · runtime errors off 0 / on 0 · wall time on/off x0.991 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5716 | 5716 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 2247 | 2247 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 3469 | 3469 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 8008 | 8008 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 2676 | 2676 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 33516 | 33516 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 455913 | 455913 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 94 | 94 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 71 | 71 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 277 | 277 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 78 | 78 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 24 | 24 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 5178 | 5178 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 278 | 278 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 3343 | 3343 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 157 | 157 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 1213 | 1213 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 1423 | 1423 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 3913 | 3913 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 20033.399999999994 | 20033.399999999994 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 18968.099999999995 | 18968.099999999995 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 16934.400000000012 | 16934.400000000012 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 22565.599999999995 | 22565.599999999995 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 22673.199999999986 | 22673.199999999986 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 19928.99999999999 | 19928.99999999999 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

fl13-0001 (identical) · fl13-0002 (identical) · fl13-0003 (identical) · fl13-0004 (identical) · fl13-0005 (identical) · fl13-0006 (identical) · fl13-0007 (identical) · fl13-0008 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=419&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=419`); it opens the seed that parts earliest, and the dropdowns choose another.

