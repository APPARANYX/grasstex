# Benchmark run #1428 · 3 seeds from `contact-690-5km` (us-defend), windows `0+1800`

- **OFF** flags: `strategicInterception=1&pinBridge=1&pinNerve=1` · **ON** flags: `strategicInterception=1&pinBridge=1&pinNerve=1&tacticalController=new`
- work/contact-role-stability-20261030 @ f541b2d · [run](https://github.com/APPARANYX/grasstex/actions/runs/40996740786) · build v29-dev

## Verdict

**QUIET: 3 of 3 pairs changed (median first part 1.05 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -31.6% (p 0.25)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Wall time on/off x1.298 is over the 1.25 gate.

## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.298 (gate 1.25)
- the 3 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 158 | 108 | -16.6667 | 3 | 0 | 3 | 0.25 |
| `usKills` | 88 | 55 | -11 | 3 | 0 | 3 | 0.25 |
| `geKills` | 70 | 53 | -5.6667 | 3 | 1 | 2 | 1 |
| `fire.total` | 2301 | 5658 | 1119 | 3 | 3 | 0 | 0.25 |
| `fire.hits` | 382 | 257 | -41.6667 | 3 | 0 | 3 | 0.25 |
| `retreatSamples` | 33584 | 37718 | 1378 | 3 | 2 | 1 | 1 |
| `movementResolver.changes` | 12430 | 6359 | -2023.6667 | 3 | 0 | 3 | 0.25 |
| `grenades.throws` | 0 | 1 | 0.3333 | 1 | 1 | 0 | 1 |
| `grenades.bursts` | 0 | 1 | 0.3333 | 1 | 1 | 0 | 1 |
| `grenades.wounded` | 0 | 2 | 0.6667 | 1 | 1 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 2 | 0.6667 | 1 | 1 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 17 | 4 | -4.3333 | 3 | 0 | 3 | 0.25 |
| `routeStalls.length` | 2 | 0 | -0.6667 | 1 | 0 | 1 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 30 | 21 | -3 | 3 | 0 | 3 | 0.25 |
| `loopAlerts.length` | 69 | 49 | -6.6667 | 1 | 0 | 1 | 1 |
| `writerConflicts` | 0 | 24 | 8 | 3 | 3 | 0 | 0.25 |
| `regroups.entries` | 37 | 12 | -8.3333 | 2 | 0 | 2 | 0.5 |
| `stallOutcomes.wakes` | 0 | 3 | 1 | 2 | 2 | 0 | 0.5 |
| `stallOutcomes.repeats` | 0 | 3 | 1 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledOnsets` | 22 | 5 | -5.6667 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledSamples` | 77 | 26 | -17 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledOnsetsRepeated` | 22 | 5 | -5.6667 | 3 | 0 | 3 | 0.25 |
| `timeline.stalledSamplesRepeated` | 77 | 26 | -17 | 3 | 0 | 3 | 0.25 |
| `recon.orders` | 122 | 55 | -22.3333 | 3 | 0 | 3 | 0.25 |
| `recon.contacts` | 9 | 2 | -2.3333 | 3 | 0 | 3 | 0.25 |
| `recon.noContact` | 44 | 19 | -8.3333 | 3 | 0 | 3 | 0.25 |
| `recon.timeouts` | 27 | 20 | -2.3333 | 3 | 1 | 2 | 1 |
| `recon.cancelled` | 36 | 14 | -7.3333 | 3 | 0 | 3 | 0.25 |
| `recon.reportsDelivered` | 72 | 8 | -21.3333 | 3 | 0 | 3 | 0.25 |
| `recon.retriggerBlocked` | 79 | 40 | -13 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanOverall` | 242.09999999999997 | 239.39999999999998 | -0.9 | 2 | 0 | 2 | 0.5 |
| `squadPerformance.p10Overall` | 222 | 222 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 190.3 | 174.7 | -5.2 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanMovement` | 293.70000000000005 | 296.1 | 0.8 | 3 | 3 | 0 | 0.25 |
| `squadPerformance.meanControl` | 286 | 283 | -1 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanCohesion` | 281.8 | 290.2 | 2.8 | 3 | 2 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

contact-690-5km-0001 1.05 s (timeline) · contact-690-5km-0002 1.05 s (timeline) · contact-690-5km-0003 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1428&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/contact-role-stability-20261030/ai_flow_live.html?bench=1428&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1428`); it opens the seed that parts earliest, and the dropdowns choose another.

