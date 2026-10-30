# Benchmark run #1446 · 60 seeds from `roundstats-20261030` (us-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0&roundStats=0` · **ON** flags: `strategicInterception=0`
- work/pin/roundstats-a018ab1b @ a018ab1 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41133758527) · build v29-dev

## Verdict

**QUIET: 3 of 53 pairs changed (median first part 172.05 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -0.6% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Runtime errors: off 1, on 0.

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **50** · runtime errors off 1 / on 0 · wall time on/off x0.966 (gate 1.25)
- the 1 changed records first part at simulated second: min 172.05, p10 172.05, median 172.05, p90 172.05, max 172.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 825 | 820 | -0.0943 | 1 | 0 | 1 | 1 |
| `usKills` | 464 | 458 | -0.1132 | 1 | 0 | 1 | 1 |
| `geKills` | 361 | 362 | 0.0189 | 1 | 1 | 0 | 1 |
| `fire.total` | 13502 | 13376 | -2.3774 | 1 | 0 | 1 | 1 |
| `fire.hits` | 1921 | 1920 | -0.0189 | 1 | 0 | 1 | 1 |
| `retreatSamples` | 6003 | 5952 | -0.9623 | 1 | 0 | 1 | 1 |
| `movementResolver.changes` | 72235 | 72306 | 1.3396 | 1 | 1 | 0 | 1 |
| `grenades.throws` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 2 | 2 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 235 | 229 | -0.1132 | 1 | 0 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 58 | 58 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 743 | 747 | 0.0755 | 1 | 1 | 0 | 1 |
| `recon.contacts` | 84 | 86 | 0.0377 | 1 | 1 | 0 | 1 |
| `recon.noContact` | 461 | 461 | 0 | 0 | 0 | 0 | 1 |
| `recon.timeouts` | 16 | 16 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 145 | 147 | 0.0377 | 1 | 1 | 0 | 1 |
| `recon.reportsDelivered` | 455 | 467 | 0.2264 | 1 | 1 | 0 | 1 |
| `recon.retriggerBlocked` | 432 | 432 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4599.4000000000015 | 4601.9000000000015 | 0.0472 | 1 | 1 | 0 | 1 |
| `squadPerformance.p10Overall` | 4128.299999999999 | 4130.4 | 0.0396 | 1 | 1 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4100.9 | 4103.699999999999 | 0.0528 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMovement` | 5277.099999999999 | 5276.9 | -0.0038 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanControl` | 5146.200000000001 | 5149.300000000001 | 0.0585 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4672.899999999999 | 4672.799999999998 | -0.0019 | 1 | 0 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 1 seed that part earliest (simulated seconds)

roundstats-20261030-0037 172.05 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1446&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-roundstats-a018ab1b/ai_flow_live.html?bench=1446&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1446`); it opens the seed that parts earliest, and the dropdowns choose another.

