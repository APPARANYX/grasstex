# Benchmark run #1435 · 3 seeds from `contact-690-5km` (ge-defend), windows `0+1800`

- **OFF** flags: `strategicInterception=1&pinBridge=1&pinNerve=1` · **ON** flags: `strategicInterception=1&pinBridge=1&pinNerve=1&tacticalController=new`
- work/contact-role-stability-20261030 @ bf00553 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40997896418) · build v29-dev

## Verdict

**QUIET: 3 of 3 pairs changed (median first part 1.05 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -44.8% (p 0.25)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Wall time on/off x1.375 is over the 1.25 gate.

## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.375 (gate 1.25)
- the 3 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 201 | 111 | -30 | 3 | 0 | 3 | 0.25 |
| `usKills` | 55 | 11 | -14.6667 | 3 | 0 | 3 | 0.25 |
| `geKills` | 146 | 100 | -15.3333 | 3 | 0 | 3 | 0.25 |
| `fire.total` | 3014 | 5072 | 686 | 3 | 3 | 0 | 0.25 |
| `fire.hits` | 448 | 216 | -77.3333 | 3 | 0 | 3 | 0.25 |
| `retreatSamples` | 31463 | 35069 | 1202 | 3 | 2 | 1 | 1 |
| `movementResolver.changes` | 15422 | 5922 | -3166.6667 | 3 | 0 | 3 | 0.25 |
| `grenades.throws` | 1 | 0 | -0.3333 | 1 | 0 | 1 | 1 |
| `grenades.bursts` | 1 | 0 | -0.3333 | 1 | 0 | 1 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 9 | 0 | -3 | 2 | 0 | 2 | 0.5 |
| `routeStalls.length` | 6 | 0 | -2 | 2 | 0 | 2 | 0.5 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 14 | 23 | 3 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 49 | 78 | 9.6667 | 3 | 2 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 62 | 5 | -19 | 3 | 0 | 3 | 0.25 |
| `stallOutcomes.wakes` | 0 | 2 | 0.6667 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 2 | 0.6667 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 13 | 0 | -4.3333 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledSamples` | 57 | 0 | -19 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledOnsetsRepeated` | 13 | 0 | -4.3333 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledSamplesRepeated` | 57 | 0 | -19 | 2 | 0 | 2 | 0.5 |
| `recon.orders` | 96 | 48 | -16 | 3 | 0 | 3 | 0.25 |
| `recon.contacts` | 9 | 6 | -1 | 2 | 1 | 1 | 1 |
| `recon.noContact` | 30 | 13 | -5.6667 | 3 | 0 | 3 | 0.25 |
| `recon.timeouts` | 23 | 17 | -2 | 3 | 0 | 3 | 0.25 |
| `recon.cancelled` | 33 | 12 | -7 | 3 | 0 | 3 | 0.25 |
| `recon.reportsDelivered` | 43 | 29 | -4.6667 | 3 | 1 | 2 | 1 |
| `recon.retriggerBlocked` | 65 | 36 | -9.6667 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanOverall` | 240.6 | 242.6 | 0.6667 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.p10Overall` | 222 | 222.3 | 0.1 | 1 | 1 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 187.3 | 180.2 | -2.3667 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanMovement` | 293.7 | 296.70000000000005 | 1 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanControl` | 286.5 | 284.8 | -0.5667 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanCohesion` | 280.4 | 288.5 | 2.7 | 3 | 3 | 0 | 0.25 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

contact-690-5km-0001 1.05 s (timeline) · contact-690-5km-0002 1.05 s (timeline) · contact-690-5km-0003 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1435&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/contact-role-stability-20261030/ai_flow_live.html?bench=1435&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1435`); it opens the seed that parts earliest, and the dropdowns choose another.

