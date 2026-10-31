# Benchmark run #1461 · 60 seeds from `controller-rk-20261031` (ge-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0&tacticalController=new&rosterKeep=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/rosterkeep-f3e1bfa2 @ f3e1bfa · [run](https://github.com/APPARANYX/grasstex/actions/runs/41184613003) · build v29-dev

## Verdict

**WEAK: 37 of 37 pairs changed (median first part 167.1 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties +2.5% (p 0.5966)**

- Under 0.05 only: squadPerformance.meanMovement 3681.300000000001 to 3678.6000000000004 (-0.1%, p 0.0081).
- Unpaired records: off 6, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **37** pairs (unpaired: off 6, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.13 (gate 1.25)
- the 37 changed records first part at simulated second: min 113.1, p10 121.05, median 167.1, p90 238.05, max 256.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 522 | 535 | 0.3514 | 32 | 14 | 18 | 0.5966 |
| `usKills` | 184 | 184 | 0 | 30 | 14 | 16 | 0.8555 |
| `geKills` | 338 | 351 | 0.3514 | 33 | 17 | 16 | 1 |
| `fire.total` | 12511 | 11803 | -19.1351 | 37 | 18 | 19 | 1 |
| `fire.hits` | 1263 | 1217 | -1.2432 | 32 | 13 | 19 | 0.3771 |
| `retreatSamples` | 3937 | 3261 | -18.2703 | 36 | 12 | 24 | 0.0652 |
| `movementResolver.changes` | 65395 | 64531 | -23.3514 | 37 | 13 | 24 | 0.0989 |
| `grenades.throws` | 9 | 10 | 0.027 | 7 | 3 | 4 | 1 |
| `grenades.bursts` | 6 | 7 | 0.027 | 3 | 1 | 2 | 1 |
| `grenades.wounded` | 4 | 7 | 0.0811 | 4 | 3 | 1 | 0.625 |
| `grenades.casualties` | 1 | 3 | 0.0541 | 2 | 1 | 1 | 1 |
| `grenades.suppressed` | 4 | 13 | 0.2432 | 4 | 3 | 1 | 0.625 |
| `grenades.friendlyWounded` | 1 | 0 | -0.027 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 2 | 2 | 0 | 2 | 1 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 308 | 294 | -0.3784 | 29 | 15 | 14 | 1 |
| `writerConflicts` | 2 | 2 | 0 | 2 | 1 | 1 | 1 |
| `regroups.entries` | 128 | 148 | 0.5405 | 19 | 14 | 5 | 0.0636 |
| `stallOutcomes.wakes` | 35 | 35 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 7 | 7 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 845 | 866 | 0.5676 | 31 | 17 | 14 | 0.7201 |
| `recon.contacts` | 122 | 145 | 0.6216 | 25 | 15 | 10 | 0.4244 |
| `recon.noContact` | 217 | 218 | 0.027 | 10 | 5 | 5 | 1 |
| `recon.timeouts` | 17 | 14 | -0.0811 | 3 | 0 | 3 | 0.25 |
| `recon.cancelled` | 441 | 442 | 0.027 | 32 | 17 | 15 | 0.8601 |
| `recon.reportsDelivered` | 508 | 640 | 3.5676 | 25 | 16 | 9 | 0.2295 |
| `recon.retriggerBlocked` | 297 | 300 | 0.0811 | 20 | 11 | 9 | 0.8238 |
| `squadPerformance.meanOverall` | 3188.7000000000003 | 3196.3999999999996 | 0.2081 | 36 | 19 | 17 | 0.8679 |
| `squadPerformance.p10Overall` | 2864.2000000000003 | 2871.899999999999 | 0.2081 | 30 | 18 | 12 | 0.3616 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 2834.3999999999987 | 2840.8 | 0.173 | 37 | 16 | 21 | 0.5114 |
| `squadPerformance.meanMovement` | 3681.300000000001 | 3678.6000000000004 | -0.073 | 29 | 7 | 22 | 0.0081 |
| `squadPerformance.meanControl` | 3505.7999999999997 | 3512.9 | 0.1919 | 36 | 17 | 19 | 0.8679 |
| `squadPerformance.meanCohesion` | 3200.099999999999 | 3196.9999999999995 | -0.0838 | 36 | 20 | 16 | 0.6177 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

controller-rk-20261031-0015 113.1 s (timeline) · controller-rk-20261031-0004 118.05 s (timeline) · controller-rk-20261031-0054 118.05 s (timeline) · controller-rk-20261031-0006 121.05 s (timeline) · controller-rk-20261031-0040 123 s (timeline) · controller-rk-20261031-0007 129 s (timeline) · controller-rk-20261031-0018 139.05 s (timeline) · controller-rk-20261031-0043 140.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1461&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-rosterkeep-f3e1bfa2/ai_flow_live.html?bench=1461&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1461`); it opens the seed that parts earliest, and the dropdowns choose another.

