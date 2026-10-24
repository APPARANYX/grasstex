# Benchmark run #1291 · 100 seeds from `stack-20261024-u` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&squadCleared=1`
- work/squad-cleared-20261024 @ 0b99876 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40058421289) · build v29-dev

## Verdict

**MOVED: 96 of 100 pairs changed (median first part 148.05 s); 9 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties -6.4% (p 0.0012)**

- Clears the Bonferroni line (p < 0.0012): fire.total 22634 to 34760 (+53.6%, p 0).
- Under 0.05 only: casualties 4550 to 4261 (-6.4%, p 0.0012); movementResolver.changes 223888 to 213577 (-4.6%, p 0.0016); geKills 2392 to 2024 (-15.4%, p 0.0019); squadPerformance.meanMission 7431.100000000001 to 7194.000000000002 (-3.2%, p 0.0025); squadPerformance.meanOverall 8510.899999999998 to 8454.599999999999 (-0.7%, p 0.0088); retreatSamples 150253 to 175635 (+16.9%, p 0.0178); recon.retriggerBlocked 1256 to 1147 (-8.7%, p 0.0308); recon.cancelled 449 to 384 (-14.5%, p 0.0395).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **4** · runtime errors off 0 / on 0 · wall time on/off x0.991 (gate 1.25)
- the 87 changed records first part at simulated second: min 97.05, p10 109.05, median 148.05, p90 182.1, max 202.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4550 | 4261 | -2.89 | 82 | 26 | 56 | 0.0012 |
| `usKills` | 2158 | 2237 | 0.79 | 84 | 49 | 35 | 0.1557 |
| `geKills` | 2392 | 2024 | -3.68 | 83 | 27 | 56 | 0.0019 |
| `fire.total` | 22634 | 34760 | 121.26 | 87 | 77 | 10 | 0 |
| `fire.hits` | 8508 | 8025 | -4.83 | 86 | 38 | 48 | 0.3318 |
| `retreatSamples` | 150253 | 175635 | 253.82 | 87 | 55 | 32 | 0.0178 |
| `movementResolver.changes` | 223888 | 213577 | -103.11 | 86 | 28 | 58 | 0.0016 |
| `grenades.throws` | 20 | 8 | -0.12 | 9 | 3 | 6 | 0.5078 |
| `grenades.bursts` | 19 | 8 | -0.11 | 9 | 3 | 6 | 0.5078 |
| `grenades.wounded` | 3 | 1 | -0.02 | 4 | 1 | 3 | 0.625 |
| `grenades.casualties` | 3 | 0 | -0.03 | 3 | 0 | 3 | 0.25 |
| `grenades.suppressed` | 32 | 4 | -0.28 | 7 | 1 | 6 | 0.125 |
| `grenades.friendlyWounded` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `grenades.friendlyCasualties` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 210 | 218 | 0.08 | 71 | 36 | 35 | 1 |
| `loopAlerts.length` | 532 | 560 | 0.28 | 79 | 41 | 38 | 0.8221 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 366 | 332 | -0.34 | 71 | 33 | 38 | 0.6353 |
| `stallOutcomes.wakes` | 2 | 4 | 0.02 | 3 | 2 | 1 | 1 |
| `stallOutcomes.repeats` | 0 | 1 | 0.01 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 2014 | 1879 | -1.35 | 83 | 35 | 48 | 0.1875 |
| `recon.contacts` | 166 | 165 | -0.01 | 63 | 30 | 33 | 0.8013 |
| `recon.noContact` | 1192 | 1137 | -0.55 | 75 | 33 | 42 | 0.3557 |
| `recon.timeouts` | 84 | 75 | -0.09 | 46 | 21 | 25 | 0.6587 |
| `recon.cancelled` | 449 | 384 | -0.65 | 77 | 29 | 48 | 0.0395 |
| `recon.reportsDelivered` | 690 | 772 | 0.82 | 77 | 38 | 39 | 1 |
| `recon.retriggerBlocked` | 1256 | 1147 | -1.09 | 78 | 29 | 49 | 0.0308 |
| `squadPerformance.meanOverall` | 8510.899999999998 | 8454.599999999999 | -0.563 | 85 | 30 | 55 | 0.0088 |
| `squadPerformance.p10Overall` | 7761.9000000000015 | 7723.300000000002 | -0.386 | 52 | 21 | 31 | 0.2116 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 7431.100000000001 | 7194.000000000002 | -2.371 | 87 | 29 | 58 | 0.0025 |
| `squadPerformance.meanMovement` | 9987.399999999992 | 9985.899999999992 | -0.015 | 45 | 18 | 27 | 0.2327 |
| `squadPerformance.meanControl` | 9681.699999999999 | 9696.199999999997 | 0.145 | 85 | 45 | 40 | 0.6646 |
| `squadPerformance.meanCohesion` | 8949.000000000004 | 9015.7 | 0.667 | 87 | 47 | 40 | 0.5203 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

stack-20261024-u-0010 97.05 s (timeline) · stack-20261024-u-0080 98.1 s (timeline) · stack-20261024-u-0097 99 s (timeline) · stack-20261024-u-0059 105 s (timeline) · stack-20261024-u-0015 107.1 s (timeline) · stack-20261024-u-0035 107.1 s (timeline) · stack-20261024-u-0045 107.1 s (timeline) · stack-20261024-u-0036 109.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1291&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/squad-cleared-20261024/ai_flow_live.html?bench=1291&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1291`); it opens the seed that parts earliest, and the dropdowns choose another.

