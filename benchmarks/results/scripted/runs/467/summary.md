# Benchmark run #467 · 60 seeds from `exec361p` (ge-defend), windows `contact+600`

- **OFF** flags: `retreatPosture=0` · **ON** flags: `none`
- claude/stale-withdraw @ cc84371 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37852753193) · build v29-dev

## Verdict

**QUIET: 11 of 53 pairs changed (median first part 544.575 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties +0.2% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **42** · runtime errors off 0 / on 0 · wall time on/off x0.977 (gate 1.25)
- the 6 changed records first part at simulated second: min 453, p10 453, median 544.575, p90 570, max 570

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2590 | 2595 | 0.0943 | 1 | 1 | 0 | 1 |
| `usKills` | 1110 | 1114 | 0.0755 | 1 | 1 | 0 | 1 |
| `geKills` | 1480 | 1481 | 0.0189 | 1 | 1 | 0 | 1 |
| `fire.total` | 17973 | 18000 | 0.5094 | 1 | 1 | 0 | 1 |
| `fire.hits` | 6013 | 6021 | 0.1509 | 1 | 1 | 0 | 1 |
| `retreatSamples` | 89234 | 89225 | -0.1698 | 2 | 1 | 1 | 1 |
| `movementResolver.changes` | 142480 | 142516 | 0.6792 | 5 | 3 | 2 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 60 | 60 | 0 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 172 | 172 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 145 | 145 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3525 | 3525 | 0 | 3 | 1 | 2 | 1 |
| `recon.contacts` | 304 | 304 | 0 | 0 | 0 | 0 | 1 |
| `recon.noContact` | 1277 | 1280 | 0.0566 | 5 | 4 | 1 | 0.375 |
| `recon.timeouts` | 1119 | 1116 | -0.0566 | 3 | 0 | 3 | 0.25 |
| `recon.cancelled` | 747 | 749 | 0.0377 | 2 | 2 | 0 | 0.5 |
| `recon.reportsDelivered` | 1347 | 1347 | 0 | 0 | 0 | 0 | 1 |
| `recon.retriggerBlocked` | 1387 | 1386 | -0.0189 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanOverall` | 4396.799999999999 | 4396.499999999999 | -0.0057 | 3 | 2 | 1 | 1 |
| `squadPerformance.p10Overall` | 3996.4999999999995 | 3996.1 | -0.0075 | 1 | 0 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3645.4999999999995 | 3646.5999999999995 | 0.0208 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMovement` | 5268.8 | 5268.8 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanControl` | 5177.4 | 5177.1 | -0.0057 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanCohesion` | 4644.2 | 4643.9 | -0.0057 | 4 | 3 | 1 | 0.625 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 6 seeds that part earliest (simulated seconds)

exec361p-0047 453 s (timeline) · exec361p-0050 523.05 s (timeline) · exec361p-0057 541.05 s (timeline) · exec361p-0014 548.1 s (timeline) · exec361p-0038 552 s (timeline) · exec361p-0022 570 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=467&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=467`); it opens the seed that parts earliest, and the dropdowns choose another.

