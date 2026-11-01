# Benchmark run #1557 · 60 seeds from `vret` (us-defend), windows `contact+120`

- **OFF** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1&controllerRetreat=0` · **ON** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- work/pin/retreat-54aff277 @ 54aff27 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41257341385) · build v29-dev

## Verdict

**WEAK: 54 of 55 pairs changed (median first part 222.6 s); 3 of 42 counters under p 0.05 (about 2.1 by chance); casualties +4.9% (p 0.0895)**

- Under 0.05 only: retreatSamples 6095 to 6284 (+3.1%, p 0.0201); movementResolver.changes 115889 to 117152 (+1.1%, p 0.0259); usKills 402 to 436 (+8.5%, p 0.0351).

## Paired comparison (off against on)

- **55** pairs (unpaired: off 0, on 0) · identical in every field: **1** · runtime errors off 0 / on 0 · wall time on/off x0.993 (gate 1.25)
- the 44 changed records first part at simulated second: min 155.1, p10 178.05, median 222.6, p90 265.05, max 298.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 876 | 919 | 0.7818 | 35 | 23 | 12 | 0.0895 |
| `usKills` | 402 | 436 | 0.6182 | 33 | 23 | 10 | 0.0351 |
| `geKills` | 474 | 483 | 0.1636 | 31 | 17 | 14 | 0.7201 |
| `fire.total` | 25047 | 25732 | 12.4545 | 41 | 27 | 14 | 0.0596 |
| `fire.hits` | 2037 | 2149 | 2.0364 | 40 | 23 | 17 | 0.4296 |
| `retreatSamples` | 6095 | 6284 | 3.4364 | 32 | 23 | 9 | 0.0201 |
| `movementResolver.changes` | 115889 | 117152 | 22.9636 | 46 | 31 | 15 | 0.0259 |
| `grenades.throws` | 11 | 17 | 0.1091 | 5 | 4 | 1 | 0.375 |
| `grenades.bursts` | 8 | 14 | 0.1091 | 2 | 2 | 0 | 0.5 |
| `grenades.wounded` | 10 | 17 | 0.1273 | 2 | 2 | 0 | 0.5 |
| `grenades.casualties` | 2 | 5 | 0.0545 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 22 | 46 | 0.4364 | 2 | 2 | 0 | 0.5 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 13 | 12 | -0.0182 | 3 | 1 | 2 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 0 | -0.0182 | 1 | 0 | 1 | 1 |
| `loopAlerts.length` | 527 | 541 | 0.2545 | 33 | 19 | 14 | 0.4869 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 89 | 87 | -0.0364 | 9 | 4 | 5 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 854 | 842 | -0.2182 | 25 | 10 | 15 | 0.4244 |
| `recon.contacts` | 64 | 65 | 0.0182 | 14 | 7 | 7 | 1 |
| `recon.noContact` | 438 | 441 | 0.0545 | 2 | 2 | 0 | 0.5 |
| `recon.timeouts` | 29 | 31 | 0.0364 | 5 | 3 | 2 | 1 |
| `recon.cancelled` | 299 | 281 | -0.3273 | 16 | 5 | 11 | 0.2101 |
| `recon.reportsDelivered` | 319 | 310 | -0.1636 | 12 | 6 | 6 | 1 |
| `recon.retriggerBlocked` | 460 | 457 | -0.0545 | 11 | 4 | 7 | 0.5488 |
| `squadPerformance.meanOverall` | 4735.900000000002 | 4723.500000000003 | -0.2255 | 37 | 13 | 24 | 0.0989 |
| `squadPerformance.p10Overall` | 4290.299999999999 | 4263.699999999999 | -0.4836 | 29 | 9 | 20 | 0.0614 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4236.6 | 4233.200000000001 | -0.0618 | 32 | 17 | 15 | 0.8601 |
| `squadPerformance.meanMovement` | 5473.900000000001 | 5472.6 | -0.0236 | 26 | 10 | 16 | 0.3269 |
| `squadPerformance.meanControl` | 5191.100000000001 | 5181.2 | -0.18 | 35 | 19 | 16 | 0.7359 |
| `squadPerformance.meanCohesion` | 4798.599999999999 | 4798.2 | -0.0073 | 40 | 19 | 21 | 0.8746 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

vret-0027 155.1 s (timeline) · vret-0053 156 s (timeline) · vret-0019 166.05 s (stress) · vret-0007 171 s (timeline) · vret-0046 178.05 s (timeline) · vret-0042 181.05 s (timeline) · vret-0050 185.1 s (timeline) · vret-0043 194.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1557&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-retreat-54aff277/ai_flow_live.html?bench=1557&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1557`); it opens the seed that parts earliest, and the dropdowns choose another.

