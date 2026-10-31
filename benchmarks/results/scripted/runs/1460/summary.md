# Benchmark run #1460 · 60 seeds from `controller-rk-20261031` (us-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0&tacticalController=new&rosterKeep=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/rosterkeep-f3e1bfa2 @ f3e1bfa · [run](https://github.com/APPARANYX/grasstex/actions/runs/41184600257) · build v29-dev

## Verdict

**MOVED: 53 of 53 pairs changed (median first part 166.05 s); 3 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties -2.5% (p 0.5515)**

- Clears the Bonferroni line (p < 0.0012): movementResolver.changes 95304 to 92323 (-3.1%, p 0.0008).
- Under 0.05 only: recon.retriggerBlocked 383 to 403 (+5.2%, p 0.0094); usKills 362 to 325 (-10.2%, p 0.0488).

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.968 (gate 1.25)
- the 53 changed records first part at simulated second: min 121.05, p10 137.1, median 166.05, p90 222, max 285

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 706 | 688 | -0.3396 | 45 | 20 | 25 | 0.5515 |
| `usKills` | 362 | 325 | -0.6981 | 44 | 15 | 29 | 0.0488 |
| `geKills` | 344 | 363 | 0.3585 | 45 | 25 | 20 | 0.5515 |
| `fire.total` | 19022 | 18664 | -6.7547 | 52 | 21 | 31 | 0.2116 |
| `fire.hits` | 1504 | 1528 | 0.4528 | 48 | 24 | 24 | 1 |
| `retreatSamples` | 4843 | 5248 | 7.6415 | 50 | 25 | 25 | 1 |
| `movementResolver.changes` | 95304 | 92323 | -56.2453 | 53 | 14 | 39 | 0.0008 |
| `grenades.throws` | 9 | 9 | 0 | 8 | 4 | 4 | 1 |
| `grenades.bursts` | 9 | 8 | -0.0189 | 7 | 3 | 4 | 1 |
| `grenades.wounded` | 10 | 12 | 0.0377 | 3 | 2 | 1 | 1 |
| `grenades.casualties` | 6 | 6 | 0 | 2 | 1 | 1 | 1 |
| `grenades.suppressed` | 25 | 30 | 0.0943 | 3 | 2 | 1 | 1 |
| `grenades.friendlyWounded` | 1 | 0 | -0.0189 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 1 | 0 | -0.0189 | 1 | 0 | 1 | 1 |
| `grenades.aborted` | 1 | 2 | 0.0189 | 3 | 2 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 3 | 0 | -0.0566 | 2 | 0 | 2 | 0.5 |
| `loopAlerts.length` | 460 | 425 | -0.6604 | 44 | 19 | 25 | 0.4514 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 152 | 142 | -0.1887 | 25 | 10 | 15 | 0.4244 |
| `stallOutcomes.wakes` | 50 | 50 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1018 | 1059 | 0.7736 | 46 | 30 | 16 | 0.0541 |
| `recon.contacts` | 148 | 156 | 0.1509 | 34 | 19 | 15 | 0.6076 |
| `recon.noContact` | 377 | 382 | 0.0943 | 13 | 9 | 4 | 0.2668 |
| `recon.timeouts` | 16 | 15 | -0.0189 | 3 | 1 | 2 | 1 |
| `recon.cancelled` | 428 | 452 | 0.4528 | 45 | 29 | 16 | 0.0725 |
| `recon.reportsDelivered` | 601 | 665 | 1.2075 | 37 | 23 | 14 | 0.1877 |
| `recon.retriggerBlocked` | 383 | 403 | 0.3774 | 26 | 20 | 6 | 0.0094 |
| `squadPerformance.meanOverall` | 4599.9000000000015 | 4596.3 | -0.0679 | 53 | 28 | 25 | 0.7838 |
| `squadPerformance.p10Overall` | 4158 | 4123.999999999999 | -0.6415 | 48 | 21 | 27 | 0.4709 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4105.4000000000015 | 4079.7999999999997 | -0.483 | 51 | 26 | 25 | 1 |
| `squadPerformance.meanMovement` | 5272.7 | 5271.4 | -0.0245 | 41 | 17 | 24 | 0.3489 |
| `squadPerformance.meanControl` | 5010.2 | 5045.099999999999 | 0.6585 | 51 | 30 | 21 | 0.2624 |
| `squadPerformance.meanCohesion` | 4653.7 | 4654.200000000001 | 0.0094 | 53 | 25 | 28 | 0.7838 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

controller-rk-20261031-0025 121.05 s (stress) · controller-rk-20261031-0001 127.05 s (timeline) · controller-rk-20261031-0020 130.05 s (timeline) · controller-rk-20261031-0047 131.1 s (timeline) · controller-rk-20261031-0039 132 s (timeline) · controller-rk-20261031-0053 137.1 s (timeline) · controller-rk-20261031-0031 138 s (timeline) · controller-rk-20261031-0057 139.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1460&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-rosterkeep-f3e1bfa2/ai_flow_live.html?bench=1460&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1460`); it opens the seed that parts earliest, and the dropdowns choose another.

