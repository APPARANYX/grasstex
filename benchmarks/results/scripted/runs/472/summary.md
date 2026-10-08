# Benchmark run #472 · 60 seeds from `exec361p` (us-defend), windows `contact+600`

- **OFF** flags: `fledWaitMerge=0` · **ON** flags: `none`
- claude/fled-refuge-group @ e20424b · [run](https://github.com/APPARANYX/grasstex/actions/runs/37857442488) · build v29-dev

## Verdict

**QUIET: 1 of 53 pairs changed; 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties +0.0% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **52** · runtime errors off 0 / on 0 · wall time on/off x0.996 (gate 1.25)
- no record has a timeline or stress series that parts

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2554 | 2554 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 1137 | 1137 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 1417 | 1417 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 17801 | 17801 | 0 | 0 | 0 | 0 | 1 |
| `fire.hits` | 6028 | 6028 | 0 | 0 | 0 | 0 | 1 |
| `retreatSamples` | 87186 | 87186 | 0 | 0 | 0 | 0 | 1 |
| `movementResolver.changes` | 154834 | 154834 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 69 | 69 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 234 | 234 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 161 | 161 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3318 | 3318 | 0 | 0 | 0 | 0 | 1 |
| `recon.contacts` | 311 | 311 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1244 | 1244 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 970 | 970 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 732 | 732 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 1374 | 1374 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1273 | 1273 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4370.700000000001 | 4370.700000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.p10Overall` | 3976.1999999999994 | 3976.1999999999994 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3592.7000000000003 | 3592.7000000000003 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMovement` | 5269.7 | 5269.7 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5158.800000000001 | 5158.800000000001 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4637.700000000001 | 4637.700000000001 | 0 | 0 | 0 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

exec361p-0001 (identical) · exec361p-0002 (identical) · exec361p-0006 (identical) · exec361p-0007 (identical) · exec361p-0008 (identical) · exec361p-0010 (identical) · exec361p-0011 (identical) · exec361p-0013 (identical)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=472&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=472`); it opens the seed that parts earliest, and the dropdowns choose another.

