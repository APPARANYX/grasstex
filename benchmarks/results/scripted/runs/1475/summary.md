# Benchmark run #1475 · 60 seeds from `controller-fin-20261031` (meeting), windows `contact+120`

- **OFF** flags: `strategicInterception=0&tacticalController=new&rosterKeep=0&noHopStall=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/final662-31f9d9e5 @ 31f9d9e · [run](https://github.com/APPARANYX/grasstex/actions/runs/41190027717) · build v29-dev

## Verdict

**WEAK: 60 of 60 pairs changed (median first part 209.1 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties +5.4% (p 0.4188)**

- Under 0.05 only: movementResolver.changes 174017 to 171092 (-1.7%, p 0.0086).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.971 (gate 1.25)
- the 60 changed records first part at simulated second: min 156, p10 174, median 209.1, p90 236.1, max 258

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 932 | 982 | 0.8333 | 55 | 31 | 24 | 0.4188 |
| `usKills` | 391 | 387 | -0.0667 | 48 | 23 | 25 | 0.8854 |
| `geKills` | 541 | 595 | 0.9 | 52 | 33 | 19 | 0.0704 |
| `fire.total` | 22829 | 23220 | 6.5167 | 59 | 33 | 26 | 0.435 |
| `fire.hits` | 1988 | 2114 | 2.1 | 52 | 31 | 21 | 0.2116 |
| `retreatSamples` | 6037 | 5673 | -6.0667 | 58 | 26 | 32 | 0.5118 |
| `movementResolver.changes` | 174017 | 171092 | -48.75 | 59 | 19 | 40 | 0.0086 |
| `grenades.throws` | 13 | 17 | 0.0667 | 11 | 7 | 4 | 0.5488 |
| `grenades.bursts` | 13 | 17 | 0.0667 | 11 | 7 | 4 | 0.5488 |
| `grenades.wounded` | 12 | 18 | 0.1 | 4 | 4 | 0 | 0.125 |
| `grenades.casualties` | 6 | 8 | 0.0333 | 2 | 2 | 0 | 0.5 |
| `grenades.suppressed` | 20 | 34 | 0.2333 | 8 | 7 | 1 | 0.0703 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 3 | 2 | -0.0167 | 3 | 1 | 2 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 20 | 29 | 0.15 | 12 | 9 | 3 | 0.146 |
| `loopAlerts.length` | 686 | 672 | -0.2333 | 43 | 19 | 24 | 0.5424 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 122 | 120 | -0.0333 | 35 | 17 | 18 | 1 |
| `stallOutcomes.wakes` | 36 | 36 | 0 | 4 | 2 | 2 | 1 |
| `stallOutcomes.repeats` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1111 | 1121 | 0.1667 | 35 | 19 | 16 | 0.7359 |
| `recon.contacts` | 71 | 68 | -0.05 | 22 | 10 | 12 | 0.8318 |
| `recon.noContact` | 557 | 554 | -0.05 | 11 | 4 | 7 | 0.5488 |
| `recon.timeouts` | 5 | 4 | -0.0167 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 471 | 487 | 0.2667 | 35 | 22 | 13 | 0.1755 |
| `recon.reportsDelivered` | 367 | 361 | -0.1 | 24 | 12 | 12 | 1 |
| `recon.retriggerBlocked` | 921 | 914 | -0.1167 | 25 | 10 | 15 | 0.4244 |
| `squadPerformance.meanOverall` | 5082.5 | 5076.600000000001 | -0.0983 | 58 | 30 | 28 | 0.8957 |
| `squadPerformance.p10Overall` | 4643.900000000001 | 4626.999999999999 | -0.2817 | 53 | 29 | 24 | 0.5831 |
| `squadPerformance.lowScoreSquads` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMission` | 4295.9 | 4336.400000000001 | 0.675 | 58 | 33 | 25 | 0.3581 |
| `squadPerformance.meanMovement` | 5905.400000000002 | 5901.999999999998 | -0.0567 | 55 | 24 | 31 | 0.4188 |
| `squadPerformance.meanControl` | 5565.400000000001 | 5555.2 | -0.17 | 56 | 26 | 30 | 0.6889 |
| `squadPerformance.meanCohesion` | 5429.4000000000015 | 5363.3 | -1.1017 | 58 | 23 | 35 | 0.148 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

controller-fin-20261031-0056 156 s (timeline) · controller-fin-20261031-0030 170.1 s (timeline) · controller-fin-20261031-0020 171 s (timeline) · controller-fin-20261031-0006 172.05 s (timeline) · controller-fin-20261031-0026 173.1 s (timeline) · controller-fin-20261031-0008 174 s (timeline) · controller-fin-20261031-0013 176.1 s (timeline) · controller-fin-20261031-0029 183 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1475&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-final662-31f9d9e5/ai_flow_live.html?bench=1475&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1475`); it opens the seed that parts earliest, and the dropdowns choose another.

