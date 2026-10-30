# Benchmark run #1434 · 3 seeds from `contact-690-5km` (us-defend), windows `0+1800`

- **OFF** flags: `strategicInterception=1&pinBridge=1&pinNerve=1` · **ON** flags: `strategicInterception=1&pinBridge=1&pinNerve=1&tacticalController=new`
- work/contact-role-stability-20261030 @ bf00553 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40997894453) · build v29-dev

## Verdict

**QUIET: 3 of 3 pairs changed (median first part 1.05 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -25.9% (p 0.25)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.11 (gate 1.25)
- the 3 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 158 | 117 | -13.6667 | 3 | 0 | 3 | 0.25 |
| `usKills` | 88 | 76 | -4 | 3 | 1 | 2 | 1 |
| `geKills` | 70 | 41 | -9.6667 | 3 | 0 | 3 | 0.25 |
| `fire.total` | 2301 | 3766 | 488.3333 | 3 | 3 | 0 | 0.25 |
| `fire.hits` | 382 | 260 | -40.6667 | 3 | 0 | 3 | 0.25 |
| `retreatSamples` | 33584 | 32156 | -476 | 3 | 1 | 2 | 1 |
| `movementResolver.changes` | 12430 | 9348 | -1027.3333 | 3 | 0 | 3 | 0.25 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 17 | 2 | -5 | 3 | 0 | 3 | 0.25 |
| `routeStalls.length` | 2 | 0 | -0.6667 | 1 | 0 | 1 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 30 | 16 | -4.6667 | 3 | 0 | 3 | 0.25 |
| `loopAlerts.length` | 69 | 58 | -3.6667 | 3 | 1 | 2 | 1 |
| `writerConflicts` | 0 | 21 | 7 | 2 | 2 | 0 | 0.5 |
| `regroups.entries` | 37 | 46 | 3 | 3 | 1 | 2 | 1 |
| `stallOutcomes.wakes` | 0 | 1 | 0.3333 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 1 | 0.3333 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 22 | 3 | -6.3333 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledSamples` | 77 | 9 | -22.6667 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledOnsetsRepeated` | 22 | 3 | -6.3333 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledSamplesRepeated` | 77 | 9 | -22.6667 | 3 | 0 | 3 | 0.25 |
| `recon.orders` | 122 | 53 | -23 | 3 | 0 | 3 | 0.25 |
| `recon.contacts` | 9 | 0 | -3 | 3 | 0 | 3 | 0.25 |
| `recon.noContact` | 44 | 19 | -8.3333 | 3 | 0 | 3 | 0.25 |
| `recon.timeouts` | 27 | 15 | -4 | 3 | 0 | 3 | 0.25 |
| `recon.cancelled` | 36 | 19 | -5.6667 | 2 | 0 | 2 | 0.5 |
| `recon.reportsDelivered` | 72 | 0 | -24 | 3 | 0 | 3 | 0.25 |
| `recon.retriggerBlocked` | 79 | 36 | -14.3333 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanOverall` | 242.09999999999997 | 242.5 | 0.1333 | 3 | 1 | 2 | 1 |
| `squadPerformance.p10Overall` | 222 | 224.1 | 0.7 | 1 | 1 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 190.3 | 180.8 | -3.1667 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanMovement` | 293.70000000000005 | 294.4 | 0.2333 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanControl` | 286 | 286.7 | 0.2333 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanCohesion` | 281.8 | 289.9 | 2.7 | 3 | 2 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

contact-690-5km-0001 1.05 s (timeline) · contact-690-5km-0002 1.05 s (timeline) · contact-690-5km-0003 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1434&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/contact-role-stability-20261030/ai_flow_live.html?bench=1434&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1434`); it opens the seed that parts earliest, and the dropdowns choose another.

