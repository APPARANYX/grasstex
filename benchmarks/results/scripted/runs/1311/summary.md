# Benchmark run #1311 · 100 seeds from `tgpb-20261024-a` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&pinBridge=1` · **ON** flags: `strategicInterception=0&localPlan=1&localResources=1&coveredBounds=1&reactiveFireManeuver=1&contactCoverFirst=1&gapHold=1&suppressBelieved=1&suppressorLock=1&pinBridge=1&talkingGuns=1`
- work/talking-guns-20261024 @ e91fa6d · [run](https://github.com/APPARANYX/grasstex/actions/runs/40118026348) · build v29-dev

## Verdict

**WEAK: 100 of 100 pairs changed (median first part 203.1 s); 2 of 42 counters under p 0.05 (about 2.1 by chance); casualties +4.6% (p 0.1002)**

- Under 0.05 only: squadPerformance.meanCohesion 9305.599999999999 to 9260.400000000001 (-0.5%, p 0.0103); fire.total 43464 to 40923 (-5.8%, p 0.0154).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.995 (gate 1.25)
- the 99 changed records first part at simulated second: min 156, p10 169.05, median 203.1, p90 266.1, max 495

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4298 | 4497 | 1.99 | 95 | 56 | 39 | 0.1002 |
| `usKills` | 2050 | 2177 | 1.27 | 91 | 52 | 39 | 0.2082 |
| `geKills` | 2248 | 2320 | 0.72 | 95 | 53 | 42 | 0.3049 |
| `fire.total` | 43464 | 40923 | -25.41 | 99 | 37 | 62 | 0.0154 |
| `fire.hits` | 8483 | 8956 | 4.73 | 97 | 55 | 42 | 0.2229 |
| `retreatSamples` | 245259 | 236861 | -83.98 | 98 | 46 | 52 | 0.6137 |
| `movementResolver.changes` | 327579 | 326417 | -11.62 | 99 | 49 | 50 | 1 |
| `grenades.throws` | 16 | 22 | 0.06 | 12 | 6 | 6 | 1 |
| `grenades.bursts` | 16 | 22 | 0.06 | 12 | 6 | 6 | 1 |
| `grenades.wounded` | 16 | 16 | 0 | 6 | 4 | 2 | 0.6875 |
| `grenades.casualties` | 5 | 6 | 0.01 | 7 | 4 | 3 | 1 |
| `grenades.suppressed` | 24 | 26 | 0.02 | 8 | 5 | 3 | 0.7266 |
| `grenades.friendlyWounded` | 1 | 2 | 0.01 | 2 | 1 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 1 | 0.01 | 1 | 1 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 15 | 18 | 0.03 | 2 | 2 | 0 | 0.5 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 533 | 506 | -0.27 | 84 | 37 | 47 | 0.3261 |
| `loopAlerts.length` | 928 | 940 | 0.12 | 92 | 48 | 44 | 0.7547 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 411 | 442 | 0.31 | 85 | 48 | 37 | 0.278 |
| `stallOutcomes.wakes` | 5 | 4 | -0.01 | 9 | 4 | 5 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsets` | 21 | 24 | 0.03 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledSamples` | 505 | 584 | 0.79 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledOnsetsRepeated` | 21 | 24 | 0.03 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledSamplesRepeated` | 505 | 584 | 0.79 | 2 | 2 | 0 | 0.5 |
| `recon.orders` | 3116 | 3118 | 0.02 | 94 | 42 | 52 | 0.3533 |
| `recon.contacts` | 149 | 168 | 0.19 | 63 | 38 | 25 | 0.1299 |
| `recon.noContact` | 1931 | 1920 | -0.11 | 90 | 43 | 47 | 0.752 |
| `recon.timeouts` | 43 | 39 | -0.04 | 29 | 13 | 16 | 0.7111 |
| `recon.cancelled` | 861 | 842 | -0.19 | 84 | 36 | 48 | 0.2299 |
| `recon.reportsDelivered` | 654 | 774 | 1.2 | 77 | 43 | 34 | 0.362 |
| `recon.retriggerBlocked` | 2405 | 2389 | -0.16 | 90 | 42 | 48 | 0.5984 |
| `squadPerformance.meanOverall` | 8000.299999999999 | 7998.299999999998 | -0.02 | 96 | 49 | 47 | 0.9188 |
| `squadPerformance.p10Overall` | 7451.500000000002 | 7445.200000000002 | -0.063 | 30 | 12 | 18 | 0.3616 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 5939.1 | 5988.799999999999 | 0.497 | 96 | 57 | 39 | 0.0822 |
| `squadPerformance.meanMovement` | 9977.599999999991 | 9977.199999999995 | -0.004 | 64 | 29 | 35 | 0.5323 |
| `squadPerformance.meanControl` | 9530.900000000005 | 9513.199999999995 | -0.177 | 98 | 43 | 55 | 0.2664 |
| `squadPerformance.meanCohesion` | 9305.599999999999 | 9260.400000000001 | -0.452 | 96 | 35 | 61 | 0.0103 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

tgpb-20261024-a-0004 156 s (timeline) · tgpb-20261024-a-0012 157.05 s (timeline) · tgpb-20261024-a-0023 158.1 s (timeline) · tgpb-20261024-a-0031 162 s (timeline) · tgpb-20261024-a-0093 162 s (stress) · tgpb-20261024-a-0096 166.05 s (timeline) · tgpb-20261024-a-0033 167.1 s (timeline) · tgpb-20261024-a-0045 168 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1311&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/talking-guns-20261024/ai_flow_live.html?bench=1311&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1311`); it opens the seed that parts earliest, and the dropdowns choose another.

