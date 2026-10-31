# Benchmark run #1498 · 60 seeds from `p698` (ge-defend), windows `0+600`

- **OFF** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1&supportWait=0&releasedOrder=0` · **ON** flags: `tacticalController=new&strategicInterception=0&localPlan=1&localTasks=1&localStructures=1&localEntry=1&localEntryGate=1&localSurvey=1&localWatch=1&localContactResume=1&localContinuity=1&localStructureOrders=1`
- work/pin/s698-bc23ab80 @ bc23ab8 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41217985791) · build v29-dev

## Verdict

**QUIET: 60 of 60 pairs changed (median first part 0.15 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -1.9% (p 0.5758)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **60** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.943 (gate 1.25)
- the 60 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 2017 | 1979 | -0.6333 | 51 | 23 | 28 | 0.5758 |
| `usKills` | 797 | 819 | 0.3667 | 48 | 25 | 23 | 0.8854 |
| `geKills` | 1220 | 1160 | -1 | 51 | 22 | 29 | 0.4011 |
| `fire.total` | 49888 | 49336 | -9.2 | 52 | 23 | 29 | 0.4885 |
| `fire.hits` | 4440 | 4417 | -0.3833 | 52 | 27 | 25 | 0.8899 |
| `retreatSamples` | 124865 | 122890 | -32.9167 | 51 | 27 | 24 | 0.7798 |
| `movementResolver.changes` | 174263 | 168306 | -99.2833 | 60 | 31 | 29 | 0.8974 |
| `grenades.throws` | 31 | 34 | 0.05 | 21 | 11 | 10 | 1 |
| `grenades.bursts` | 31 | 32 | 0.0167 | 20 | 10 | 10 | 1 |
| `grenades.wounded` | 12 | 5 | -0.1167 | 7 | 2 | 5 | 0.4531 |
| `grenades.casualties` | 1 | 3 | 0.0333 | 4 | 3 | 1 | 0.625 |
| `grenades.suppressed` | 20 | 10 | -0.1667 | 12 | 5 | 7 | 0.7744 |
| `grenades.friendlyWounded` | 2 | 1 | -0.0167 | 3 | 1 | 2 | 1 |
| `grenades.friendlyCasualties` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `grenades.aborted` | 6 | 5 | -0.0167 | 6 | 3 | 3 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 62 | 42 | -0.3333 | 33 | 13 | 20 | 0.2962 |
| `loopAlerts.length` | 789 | 797 | 0.1333 | 18 | 11 | 7 | 0.4807 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 219 | 231 | 0.2 | 46 | 23 | 23 | 1 |
| `stallOutcomes.wakes` | 2 | 5 | 0.05 | 6 | 4 | 2 | 0.6875 |
| `stallOutcomes.repeats` | 0 | 1 | 0.0167 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1469 | 1499 | 0.5 | 47 | 23 | 24 | 1 |
| `recon.contacts` | 225 | 245 | 0.3333 | 45 | 28 | 17 | 0.1352 |
| `recon.noContact` | 492 | 489 | -0.05 | 42 | 17 | 25 | 0.28 |
| `recon.timeouts` | 45 | 46 | 0.0167 | 25 | 12 | 13 | 1 |
| `recon.cancelled` | 657 | 664 | 0.1167 | 49 | 23 | 26 | 0.7754 |
| `recon.reportsDelivered` | 1005 | 1079 | 1.2333 | 50 | 30 | 20 | 0.2026 |
| `recon.retriggerBlocked` | 629 | 625 | -0.0667 | 44 | 20 | 24 | 0.6516 |
| `squadPerformance.meanOverall` | 4991.6 | 5000.199999999999 | 0.1433 | 51 | 26 | 25 | 1 |
| `squadPerformance.p10Overall` | 4633.3 | 4647.8 | 0.2417 | 32 | 17 | 15 | 0.8601 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4027.399999999999 | 4055.500000000001 | 0.4683 | 52 | 24 | 28 | 0.6778 |
| `squadPerformance.meanMovement` | 5992.699999999998 | 5992.299999999999 | -0.0067 | 23 | 10 | 13 | 0.6776 |
| `squadPerformance.meanControl` | 5751.299999999999 | 5742.700000000002 | -0.1433 | 51 | 24 | 27 | 0.7798 |
| `squadPerformance.meanCohesion` | 5591.3 | 5561.999999999999 | -0.4883 | 52 | 25 | 27 | 0.8899 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

p698-0001 0.15 s (timeline) · p698-0002 0.15 s (timeline) · p698-0003 0.15 s (timeline) · p698-0004 0.15 s (timeline) · p698-0005 0.15 s (timeline) · p698-0006 0.15 s (timeline) · p698-0007 0.15 s (timeline) · p698-0008 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1498&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-s698-bc23ab80/ai_flow_live.html?bench=1498&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1498`); it opens the seed that parts earliest, and the dropdowns choose another.

