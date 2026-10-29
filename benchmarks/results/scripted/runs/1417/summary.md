# Benchmark run #1417 · 60 seeds from `pr683-gate-20261029` (ge-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/pr683-f845a2d6 @ f845a2d · [run](https://github.com/APPARANYX/grasstex/actions/runs/40944261420) · build v29-dev

## Verdict

**MOVED: 54 of 54 pairs changed (median first part 1.05 s); 15 of 42 counters under p 0.05 (about 2.1 by chance), 13 under 0.0012; casualties +5.3% (p 1)**

- Clears the Bonferroni line (p < 0.0012): fire.total 6165 to 12272 (+99.1%, p 0); loopAlerts.length 90 to 489 (+443.3%, p 0); regroups.entries 72 to 0 (-100.0%, p 0); recon.orders 827 to 271 (-67.2%, p 0); recon.contacts 78 to 0 (-100.0%, p 0); recon.noContact 483 to 0 (-100.0%, p 0); recon.reportsDelivered 373 to 0 (-100.0%, p 0); recon.retriggerBlocked 482 to 0 (-100.0%, p 0); squadPerformance.meanControl 5322.300000000002 to 5117.099999999999 (-3.9%, p 0); squadPerformance.meanCohesion 4771.6 to 4382.5 (-8.2%, p 0); recon.timeouts 22 to 0 (-100.0%, p 0.0001); squadPerformance.meanOverall 4762.200000000001 to 4570.900000000001 (-4.0%, p 0.0001); recon.cancelled 198 to 271 (+36.9%, p 0.0006).
- Under 0.05 only: retreatSamples 7555 to 11655 (+54.3%, p 0.0091); squadPerformance.p10Overall 4296.999999999999 to 4135 (-3.8%, p 0.0328).
- Wall time on/off x1.427 is over the 1.25 gate.

## Paired comparison (off against on)

- **54** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.427 (gate 1.25)
- the 54 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1295 | 1363 | 1.2593 | 52 | 26 | 26 | 1 |
| `usKills` | 483 | 526 | 0.7963 | 53 | 29 | 24 | 0.5831 |
| `geKills` | 812 | 837 | 0.463 | 52 | 30 | 22 | 0.3317 |
| `fire.total` | 6165 | 12272 | 113.0926 | 54 | 50 | 4 | 0 |
| `fire.hits` | 2398 | 2528 | 2.4074 | 53 | 28 | 25 | 0.7838 |
| `retreatSamples` | 7555 | 11655 | 75.9259 | 54 | 37 | 17 | 0.0091 |
| `movementResolver.changes` | 67240 | 67381 | 2.6111 | 54 | 27 | 27 | 1 |
| `grenades.throws` | 5 | 6 | 0.0185 | 6 | 3 | 3 | 1 |
| `grenades.bursts` | 5 | 4 | -0.0185 | 5 | 2 | 3 | 1 |
| `grenades.wounded` | 4 | 8 | 0.0741 | 4 | 2 | 2 | 1 |
| `grenades.casualties` | 2 | 1 | -0.0185 | 1 | 0 | 1 | 1 |
| `grenades.suppressed` | 9 | 20 | 0.2037 | 5 | 3 | 2 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 2 | 0.037 | 2 | 2 | 0 | 0.5 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 7 | 0.0926 | 9 | 7 | 2 | 0.1797 |
| `loopAlerts.length` | 90 | 489 | 7.3889 | 54 | 53 | 1 | 0 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 72 | 0 | -1.3333 | 36 | 0 | 36 | 0 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 827 | 271 | -10.2963 | 54 | 0 | 54 | 0 |
| `recon.contacts` | 78 | 0 | -1.4444 | 43 | 0 | 43 | 0 |
| `recon.noContact` | 483 | 0 | -8.9444 | 54 | 0 | 54 | 0 |
| `recon.timeouts` | 22 | 0 | -0.4074 | 15 | 0 | 15 | 0.0001 |
| `recon.cancelled` | 198 | 271 | 1.3519 | 51 | 38 | 13 | 0.0006 |
| `recon.reportsDelivered` | 373 | 0 | -6.9074 | 37 | 0 | 37 | 0 |
| `recon.retriggerBlocked` | 482 | 0 | -8.9259 | 54 | 0 | 54 | 0 |
| `squadPerformance.meanOverall` | 4762.200000000001 | 4570.900000000001 | -3.5426 | 54 | 12 | 42 | 0.0001 |
| `squadPerformance.p10Overall` | 4296.999999999999 | 4135 | -3 | 50 | 17 | 33 | 0.0328 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4369.200000000001 | 4077.7000000000003 | -5.3981 | 54 | 20 | 34 | 0.0759 |
| `squadPerformance.meanMovement` | 5382.600000000002 | 5382.999999999997 | 0.0074 | 48 | 18 | 30 | 0.1114 |
| `squadPerformance.meanControl` | 5322.300000000002 | 5117.099999999999 | -3.8 | 53 | 2 | 51 | 0 |
| `squadPerformance.meanCohesion` | 4771.6 | 4382.5 | -7.2056 | 54 | 8 | 46 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

pr683-gate-20261029-0001 1.05 s (timeline) · pr683-gate-20261029-0002 1.05 s (timeline) · pr683-gate-20261029-0003 1.05 s (timeline) · pr683-gate-20261029-0004 1.05 s (timeline) · pr683-gate-20261029-0005 1.05 s (timeline) · pr683-gate-20261029-0006 1.05 s (timeline) · pr683-gate-20261029-0007 1.05 s (timeline) · pr683-gate-20261029-0008 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1417&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pr683-f845a2d6/ai_flow_live.html?bench=1417&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1417`); it opens the seed that parts earliest, and the dropdowns choose another.

