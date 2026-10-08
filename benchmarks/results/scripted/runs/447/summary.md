# Benchmark run #447 · 60 seeds from `exec361` (ge-defend), windows `contact+300`

- **OFF** flags: `none` · **ON** flags: `none`
- bench/387-control-3a11b52 @ 3a11b52 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37825143914) · build v29-dev

## Verdict

**INERT: all 54 pairs identical in every field**


## Paired comparison (off against on)

- **54** pairs (unpaired: off 0, on 0) · identical in every field: **54** · runtime errors off 0 / on 0 · wall time on/off x0.986 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1534 | 1534 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 618 | 618 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 916 | 916 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 11499 | 11499 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 3806 | 3806 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 32155 | 32155 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 96558 | 96558 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 14 | 14 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 85 | 85 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 116 | 116 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 31 | 31 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 61 | 61 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 731 | 731 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 61 | 61 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 731 | 731 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2358 | 2358 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 202 | 202 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 773 | 773 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 907 | 907 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 414 | 414 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 945 | 945 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 967 | 967 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4584.400000000001 | 4584.400000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 4139.199999999999 | 4139.199999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3931.6000000000004 | 3931.6000000000004 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5376.399999999999 | 5376.399999999999 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5319.300000000002 | 5319.300000000002 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4610.000000000001 | 4610.000000000001 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

exec361-0002 (identical) · exec361-0003 (identical) · exec361-0004 (identical) · exec361-0005 (identical) · exec361-0006 (identical) · exec361-0007 (identical) · exec361-0008 (identical) · exec361-0010 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=447&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=447`); it opens the seed that parts earliest, and the dropdowns choose another.

