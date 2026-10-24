# Benchmark run #1290 · 100 seeds from `stack-20261024-m` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&squadCleared=1`
- work/squad-cleared-20261024 @ 0b99876 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40058419122) · build v29-dev

## Verdict

**MOVED: 100 of 100 pairs changed (median first part 175.05 s); 7 of 42 counters under p 0.05 (about 2.1 by chance), 2 under 0.0012; casualties -4.9% (p 0.0439)**

- Clears the Bonferroni line (p < 0.0012): fire.total 24962 to 43353 (+73.7%, p 0); squadPerformance.meanMission 6645.600000000003 to 6460.9000000000015 (-2.8%, p 0.0001).
- Under 0.05 only: loopAlerts.length 674 to 844 (+25.2%, p 0.0046); fire.hits 10368 to 9506 (-8.3%, p 0.0061); retreatSamples 142225 to 163069 (+14.7%, p 0.0066); casualties 5241 to 4986 (-4.9%, p 0.0439); squadPerformance.meanOverall 8151.099999999998 to 8118.4 (-0.4%, p 0.0439).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.96 (gate 1.25)
- the 100 changed records first part at simulated second: min 144, p10 156, median 175.05, p90 211.05, max 228

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5241 | 4986 | -2.55 | 99 | 39 | 60 | 0.0439 |
| `usKills` | 2486 | 2419 | -0.67 | 95 | 41 | 54 | 0.2181 |
| `geKills` | 2755 | 2567 | -1.88 | 91 | 38 | 53 | 0.1418 |
| `fire.total` | 24962 | 43353 | 183.91 | 100 | 94 | 6 | 0 |
| `fire.hits` | 10368 | 9506 | -8.62 | 98 | 35 | 63 | 0.0061 |
| `retreatSamples` | 142225 | 163069 | 208.44 | 100 | 64 | 36 | 0.0066 |
| `movementResolver.changes` | 314843 | 314515 | -3.28 | 100 | 47 | 53 | 0.6173 |
| `grenades.throws` | 28 | 18 | -0.1 | 12 | 3 | 9 | 0.146 |
| `grenades.bursts` | 27 | 18 | -0.09 | 11 | 3 | 8 | 0.2266 |
| `grenades.wounded` | 19 | 25 | 0.06 | 8 | 3 | 5 | 0.7266 |
| `grenades.casualties` | 8 | 8 | 0 | 4 | 2 | 2 | 1 |
| `grenades.suppressed` | 43 | 53 | 0.1 | 12 | 5 | 7 | 0.7744 |
| `grenades.friendlyWounded` | 4 | 2 | -0.02 | 4 | 2 | 2 | 1 |
| `grenades.friendlyCasualties` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `grenades.aborted` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 2 | 1 | -0.01 | 2 | 1 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 523 | 499 | -0.24 | 88 | 42 | 46 | 0.7493 |
| `loopAlerts.length` | 674 | 844 | 1.7 | 92 | 60 | 32 | 0.0046 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 393 | 367 | -0.26 | 86 | 40 | 46 | 0.59 |
| `stallOutcomes.wakes` | 9 | 2 | -0.07 | 11 | 2 | 9 | 0.0654 |
| `stallOutcomes.repeats` | 4 | 0 | -0.04 | 4 | 0 | 4 | 0.125 |
| `timeline.stalledOnsets` | 3 | 1 | -0.02 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamples` | 89 | 5 | -0.84 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 3 | 1 | -0.02 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 89 | 5 | -0.84 | 2 | 1 | 1 | 1 |
| `recon.orders` | 3107 | 3090 | -0.17 | 97 | 49 | 48 | 1 |
| `recon.contacts` | 138 | 131 | -0.07 | 57 | 26 | 31 | 0.5966 |
| `recon.noContact` | 1947 | 1975 | 0.28 | 90 | 49 | 41 | 0.4608 |
| `recon.timeouts` | 37 | 30 | -0.07 | 32 | 14 | 18 | 0.5966 |
| `recon.cancelled` | 838 | 815 | -0.23 | 87 | 39 | 48 | 0.3912 |
| `recon.reportsDelivered` | 585 | 654 | 0.69 | 71 | 36 | 35 | 1 |
| `recon.retriggerBlocked` | 2415 | 2421 | 0.06 | 90 | 49 | 41 | 0.4608 |
| `squadPerformance.meanOverall` | 8151.099999999998 | 8118.4 | -0.327 | 99 | 39 | 60 | 0.0439 |
| `squadPerformance.p10Overall` | 7477.6 | 7489.700000000002 | 0.121 | 57 | 32 | 25 | 0.427 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 6645.600000000003 | 6460.9000000000015 | -1.847 | 99 | 30 | 69 | 0.0001 |
| `squadPerformance.meanMovement` | 9973.5 | 9974.400000000001 | 0.009 | 68 | 37 | 31 | 0.5446 |
| `squadPerformance.meanControl` | 9425.5 | 9415.299999999997 | -0.102 | 98 | 45 | 53 | 0.4797 |
| `squadPerformance.meanCohesion` | 9016.2 | 9080.099999999999 | 0.639 | 100 | 57 | 43 | 0.1933 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

stack-20261024-m-0002 144 s (timeline) · stack-20261024-m-0015 152.1 s (timeline) · stack-20261024-m-0022 152.1 s (timeline) · stack-20261024-m-0076 153 s (timeline) · stack-20261024-m-0087 153 s (timeline) · stack-20261024-m-0008 154.05 s (stress) · stack-20261024-m-0083 154.05 s (timeline) · stack-20261024-m-0027 155.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1290&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/squad-cleared-20261024/ai_flow_live.html?bench=1290&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1290`); it opens the seed that parts earliest, and the dropdowns choose another.

