# Benchmark run #1556 · 60 seeds from `vret` (ge-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1&controllerRetreat=0` · **ON** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- work/pin/retreat-54aff277 @ 54aff27 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41257327448) · build v29-dev

## Verdict

**MOVED: 49 of 55 pairs changed (median first part 210.525 s); 3 of 42 counters under p 0.05 (about 2.1 by chance), 2 under 0.0012; casualties +11.6% (p 0.0005)**

- Clears the Bonferroni line (p < 0.0012): movementResolver.changes 107698 to 109202 (+1.4%, p 0); casualties 767 to 856 (+11.6%, p 0.0005).
- Under 0.05 only: geKills 529 to 601 (+13.6%, p 0.0014).

## Paired comparison (off against on)

- **55** pairs (unpaired: off 0, on 0) · identical in every field: **6** · runtime errors off 0 / on 0 · wall time on/off x0.991 (gate 1.25)
- the 42 changed records first part at simulated second: min 112.05, p10 151.05, median 210.525, p90 249, max 284.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 767 | 856 | 1.6182 | 35 | 28 | 7 | 0.0005 |
| `usKills` | 238 | 255 | 0.3091 | 20 | 14 | 6 | 0.1153 |
| `geKills` | 529 | 601 | 1.3091 | 30 | 24 | 6 | 0.0014 |
| `fire.total` | 20930 | 21140 | 3.8182 | 42 | 24 | 18 | 0.4408 |
| `fire.hits` | 1811 | 1885 | 1.3455 | 38 | 23 | 15 | 0.2559 |
| `retreatSamples` | 5968 | 5987 | 0.3455 | 34 | 16 | 18 | 0.8642 |
| `movementResolver.changes` | 107698 | 109202 | 27.3455 | 43 | 35 | 8 | 0 |
| `grenades.throws` | 13 | 13 | 0 | 4 | 1 | 3 | 0.625 |
| `grenades.bursts` | 13 | 13 | 0 | 4 | 1 | 3 | 0.625 |
| `grenades.wounded` | 5 | 8 | 0.0545 | 1 | 1 | 0 | 1 |
| `grenades.casualties` | 1 | 3 | 0.0364 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 13 | 17 | 0.0727 | 1 | 1 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 507 | 495 | -0.2182 | 29 | 14 | 15 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 115 | 118 | 0.0545 | 14 | 9 | 5 | 0.424 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 933 | 934 | 0.0182 | 27 | 16 | 11 | 0.4421 |
| `recon.contacts` | 83 | 81 | -0.0364 | 15 | 8 | 7 | 1 |
| `recon.noContact` | 359 | 357 | -0.0364 | 1 | 0 | 1 | 1 |
| `recon.timeouts` | 28 | 28 | 0 | 2 | 1 | 1 | 1 |
| `recon.cancelled` | 429 | 431 | 0.0364 | 21 | 12 | 9 | 0.6636 |
| `recon.reportsDelivered` | 370 | 367 | -0.0545 | 17 | 10 | 7 | 0.6291 |
| `recon.retriggerBlocked` | 464 | 466 | 0.0364 | 6 | 4 | 2 | 0.6875 |
| `squadPerformance.meanOverall` | 4761.799999999999 | 4759.2 | -0.0473 | 39 | 22 | 17 | 0.5224 |
| `squadPerformance.p10Overall` | 4306.799999999999 | 4290.6 | -0.2945 | 30 | 11 | 19 | 0.2005 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4273.400000000002 | 4277.1 | 0.0673 | 33 | 15 | 18 | 0.7283 |
| `squadPerformance.meanMovement` | 5474.600000000001 | 5474.500000000001 | -0.0018 | 21 | 10 | 11 | 1 |
| `squadPerformance.meanControl` | 5209.2 | 5206.3 | -0.0527 | 35 | 17 | 18 | 1 |
| `squadPerformance.meanCohesion` | 4766.699999999999 | 4780.999999999999 | 0.26 | 36 | 22 | 14 | 0.243 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

vret-0054 112.05 s (timeline) · vret-0052 134.1 s (timeline) · vret-0007 138 s (stress) · vret-0008 140.1 s (timeline) · vret-0051 151.05 s (stress) · vret-0047 154.05 s (timeline) · vret-0018 159 s (timeline) · vret-0040 163.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1556&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-retreat-54aff277/ai_flow_live.html?bench=1556&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1556`); it opens the seed that parts earliest, and the dropdowns choose another.

