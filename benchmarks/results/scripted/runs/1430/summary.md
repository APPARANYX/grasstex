# Benchmark run #1430 · 3 seeds from `contact-690-2km` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&pinBridge=1&pinNerve=1` · **ON** flags: `strategicInterception=0&pinBridge=1&pinNerve=1&tacticalController=new`
- work/contact-role-stability-20261030 @ bf00553 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40997880886) · build v29-dev

## Verdict

**QUIET: 3 of 3 pairs changed (median first part 1.05 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -20.8% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Wall time on/off x2.237 is over the 1.25 gate.

## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x2.237 (gate 1.25)
- the 3 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 144 | 114 | -10 | 3 | 1 | 2 | 1 |
| `usKills` | 68 | 46 | -7.3333 | 3 | 1 | 2 | 1 |
| `geKills` | 76 | 68 | -2.6667 | 3 | 1 | 2 | 1 |
| `fire.total` | 2606 | 3400 | 264.6667 | 3 | 2 | 1 | 1 |
| `fire.hits` | 349 | 296 | -17.6667 | 3 | 1 | 2 | 1 |
| `retreatSamples` | 5559 | 3560 | -666.3333 | 3 | 0 | 3 | 0.25 |
| `movementResolver.changes` | 11581 | 13656 | 691.6667 | 3 | 3 | 0 | 0.25 |
| `grenades.throws` | 0 | 3 | 1 | 2 | 2 | 0 | 0.5 |
| `grenades.bursts` | 0 | 3 | 1 | 2 | 2 | 0 | 0.5 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 1 | 0.3333 | 1 | 1 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 18 | 27 | 3 | 3 | 3 | 0 | 0.25 |
| `loopAlerts.length` | 44 | 51 | 2.3333 | 1 | 1 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 13 | 21 | 2.6667 | 2 | 1 | 1 | 1 |
| `stallOutcomes.wakes` | 0 | 7 | 2.3333 | 3 | 3 | 0 | 0.25 |
| `stallOutcomes.repeats` | 0 | 4 | 1.3333 | 3 | 3 | 0 | 0.25 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 90 | 86 | -1.3333 | 3 | 1 | 2 | 1 |
| `recon.contacts` | 3 | 9 | 2 | 3 | 3 | 0 | 0.25 |
| `recon.noContact` | 62 | 50 | -4 | 2 | 0 | 2 | 0.5 |
| `recon.timeouts` | 2 | 1 | -0.3333 | 3 | 1 | 2 | 1 |
| `recon.cancelled` | 22 | 24 | 0.6667 | 3 | 2 | 1 | 1 |
| `recon.reportsDelivered` | 10 | 58 | 16 | 3 | 3 | 0 | 0.25 |
| `recon.retriggerBlocked` | 72 | 80 | 2.6667 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanOverall` | 240.29999999999998 | 241.3 | 0.3333 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.p10Overall` | 224.5 | 225 | 0.1667 | 3 | 1 | 2 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 183.7 | 193.29999999999998 | 3.2 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanMovement` | 299.3 | 297.1 | -0.7333 | 2 | 0 | 2 | 0.5 |
| `squadPerformance.meanControl` | 281.5 | 265.3 | -5.4 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanCohesion` | 277 | 275.2 | -0.6 | 3 | 1 | 2 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

contact-690-2km-0001 1.05 s (timeline) · contact-690-2km-0002 1.05 s (timeline) · contact-690-2km-0003 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1430&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/contact-role-stability-20261030/ai_flow_live.html?bench=1430&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1430`); it opens the seed that parts earliest, and the dropdowns choose another.

