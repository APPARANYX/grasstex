# Benchmark run #466 · 60 seeds from `exec361p` (us-defend), windows `contact+600`

- **OFF** flags: `retreatPosture=0` · **ON** flags: `none`
- claude/stale-withdraw @ cc84371 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37852749973) · build v29-dev

## Verdict

**QUIET: 11 of 53 pairs changed (median first part 452.1 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties +0.1% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **42** · runtime errors off 0 / on 0 · wall time on/off x1.006 (gate 1.25)
- the 7 changed records first part at simulated second: min 365.1, p10 365.1, median 452.1, p90 583.05, max 583.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2554 | 2557 | 0.0566 | 3 | 2 | 1 | 1 |
| `usKills` | 1137 | 1145 | 0.1509 | 4 | 3 | 1 | 0.625 |
| `geKills` | 1417 | 1412 | -0.0943 | 5 | 2 | 3 | 1 |
| `fire.total` | 17801 | 17887 | 1.6226 | 5 | 3 | 2 | 1 |
| `fire.hits` | 6028 | 6043 | 0.283 | 4 | 3 | 1 | 0.625 |
| `retreatSamples` | 87186 | 87148 | -0.717 | 4 | 2 | 2 | 1 |
| `movementResolver.changes` | 154834 | 154950 | 2.1887 | 7 | 5 | 2 | 0.4531 |
| `movementStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 69 | 69 | 0 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 234 | 234 | 0 | 4 | 2 | 2 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 161 | 141 | -0.3774 | 4 | 2 | 2 | 1 |
| `stallOutcomes.wakes` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3318 | 3321 | 0.0566 | 3 | 2 | 1 | 1 |
| `recon.contacts` | 311 | 310 | -0.0189 | 4 | 2 | 2 | 1 |
| `recon.noContact` | 1244 | 1250 | 0.1132 | 5 | 4 | 1 | 0.375 |
| `recon.timeouts` | 970 | 965 | -0.0943 | 5 | 3 | 2 | 1 |
| `recon.cancelled` | 732 | 736 | 0.0755 | 4 | 3 | 1 | 0.625 |
| `recon.reportsDelivered` | 1374 | 1381 | 0.1321 | 4 | 2 | 2 | 1 |
| `recon.retriggerBlocked` | 1273 | 1277 | 0.0755 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanOverall` | 4370.700000000001 | 4371.5 | 0.0151 | 5 | 3 | 2 | 1 |
| `squadPerformance.p10Overall` | 3976.1999999999994 | 3974.2999999999993 | -0.0358 | 2 | 1 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3592.7000000000003 | 3592.7999999999997 | 0.0019 | 4 | 1 | 3 | 0.625 |
| `squadPerformance.meanMovement` | 5269.7 | 5270.3 | 0.0113 | 4 | 4 | 0 | 0.125 |
| `squadPerformance.meanControl` | 5158.800000000001 | 5158.7 | -0.0019 | 4 | 2 | 2 | 1 |
| `squadPerformance.meanCohesion` | 4637.700000000001 | 4640.6 | 0.0547 | 6 | 5 | 1 | 0.2188 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 7 seeds that part earliest (simulated seconds)

exec361p-0018 365.1 s (timeline) · exec361p-0049 385.05 s (timeline) · exec361p-0026 389.1 s (timeline) · exec361p-0006 452.1 s (timeline) · exec361p-0050 515.1 s (timeline) · exec361p-0031 547.05 s (timeline) · exec361p-0011 583.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=466&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=466`); it opens the seed that parts earliest, and the dropdowns choose another.

