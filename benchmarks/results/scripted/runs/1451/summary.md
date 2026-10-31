# Benchmark run #1451 · 60 seeds from `cfr-20261031-m` (meeting), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&contactFireResume=0` · **ON** flags: `tacticalController=new&strategicInterception=0`
- work/benchmark-launch/contactfire-resume-20261031 @ 6169ba0 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41183798035) · build v29-dev

## Verdict

**WEAK: 60 of 60 pairs changed (median first part 219 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties -2.5% (p 0.3317)**

- Under 0.05 only: squadPerformance.meanCohesion 5559.9 to 5600.5 (+0.7%, p 0.0363).

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.007 (gate 1.25)
- the 60 changed records first part at simulated second: min 158.1, p10 174, median 219, p90 264, max 312

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1986 | 1937 | -0.8167 | 52 | 22 | 30 | 0.3317 |
| `usKills` | 773 | 795 | 0.3667 | 57 | 26 | 31 | 0.5966 |
| `geKills` | 1213 | 1142 | -1.1833 | 59 | 25 | 34 | 0.2976 |
| `fire.total` | 47601 | 46966 | -10.5833 | 60 | 30 | 30 | 1 |
| `fire.hits` | 4619 | 4244 | -6.25 | 59 | 25 | 34 | 0.2976 |
| `retreatSamples` | 94626 | 101979 | 122.55 | 59 | 33 | 26 | 0.435 |
| `movementResolver.changes` | 246498 | 247339 | 14.0167 | 60 | 27 | 33 | 0.519 |
| `grenades.throws` | 44 | 35 | -0.15 | 21 | 8 | 13 | 0.3833 |
| `grenades.bursts` | 44 | 35 | -0.15 | 21 | 8 | 13 | 0.3833 |
| `grenades.wounded` | 43 | 37 | -0.1 | 12 | 5 | 7 | 0.7744 |
| `grenades.casualties` | 7 | 15 | 0.1333 | 8 | 5 | 3 | 0.7266 |
| `grenades.suppressed` | 91 | 86 | -0.0833 | 15 | 8 | 7 | 1 |
| `grenades.friendlyWounded` | 1 | 2 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 14 | 7 | -0.1167 | 9 | 3 | 6 | 0.5078 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 420 | 427 | 0.1167 | 50 | 24 | 26 | 0.8877 |
| `loopAlerts.length` | 962 | 987 | 0.4167 | 38 | 20 | 18 | 0.8714 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 451 | 530 | 1.3167 | 55 | 31 | 24 | 0.4188 |
| `stallOutcomes.wakes` | 123 | 135 | 0.2 | 29 | 18 | 11 | 0.2649 |
| `stallOutcomes.repeats` | 38 | 39 | 0.0167 | 19 | 10 | 9 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1688 | 1731 | 0.7167 | 53 | 30 | 23 | 0.4101 |
| `recon.contacts` | 101 | 118 | 0.2833 | 43 | 22 | 21 | 1 |
| `recon.noContact` | 790 | 795 | 0.0833 | 49 | 22 | 27 | 0.5682 |
| `recon.timeouts` | 17 | 16 | -0.0167 | 4 | 2 | 2 | 1 |
| `recon.cancelled` | 714 | 739 | 0.4167 | 53 | 33 | 20 | 0.0984 |
| `recon.reportsDelivered` | 458 | 545 | 1.45 | 46 | 20 | 26 | 0.4614 |
| `recon.retriggerBlocked` | 1349 | 1326 | -0.3833 | 55 | 26 | 29 | 0.7877 |
| `squadPerformance.meanOverall` | 4821.2 | 4811.199999999999 | -0.1667 | 59 | 28 | 31 | 0.7948 |
| `squadPerformance.p10Overall` | 4481.3 | 4472.4 | -0.1483 | 34 | 14 | 20 | 0.3915 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3727.4000000000005 | 3667.0999999999995 | -1.005 | 59 | 27 | 32 | 0.6029 |
| `squadPerformance.meanMovement` | 5966.800000000001 | 5967 | 0.0033 | 45 | 23 | 22 | 1 |
| `squadPerformance.meanControl` | 5517.0999999999985 | 5532.599999999999 | 0.2583 | 59 | 31 | 28 | 0.7948 |
| `squadPerformance.meanCohesion` | 5559.9 | 5600.5 | 0.6767 | 59 | 38 | 21 | 0.0363 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

cfr-20261031-m-0017 158.1 s (timeline) · cfr-20261031-m-0023 161.1 s (timeline) · cfr-20261031-m-0009 164.1 s (timeline) · cfr-20261031-m-0058 166.05 s (timeline) · cfr-20261031-m-0014 173.1 s (timeline) · cfr-20261031-m-0024 174 s (timeline) · cfr-20261031-m-0054 175.05 s (timeline) · cfr-20261031-m-0044 177 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1451&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/benchmark-launch-contactfire-resume-20261031/ai_flow_live.html?bench=1451&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1451`); it opens the seed that parts earliest, and the dropdowns choose another.

