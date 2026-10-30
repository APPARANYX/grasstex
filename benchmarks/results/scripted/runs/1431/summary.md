# Benchmark run #1431 · 3 seeds from `contact-690-2km` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&pinBridge=1&pinNerve=1` · **ON** flags: `strategicInterception=0&pinBridge=1&pinNerve=1&tacticalController=new`
- work/contact-role-stability-20261030 @ bf00553 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40997882872) · build v29-dev

## Verdict

**QUIET: 3 of 3 pairs changed (median first part 1.05 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties +3.3% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Wall time on/off x1.903 is over the 1.25 gate.

## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.903 (gate 1.25)
- the 3 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 121 | 125 | 1.3333 | 3 | 1 | 2 | 1 |
| `usKills` | 53 | 35 | -6 | 3 | 1 | 2 | 1 |
| `geKills` | 68 | 90 | 7.3333 | 3 | 2 | 1 | 1 |
| `fire.total` | 1770 | 2706 | 312 | 3 | 2 | 1 | 1 |
| `fire.hits` | 265 | 254 | -3.6667 | 3 | 1 | 2 | 1 |
| `retreatSamples` | 6519 | 7077 | 186 | 3 | 2 | 1 | 1 |
| `movementResolver.changes` | 8846 | 8548 | -99.3333 | 3 | 2 | 1 | 1 |
| `grenades.throws` | 2 | 1 | -0.3333 | 2 | 1 | 1 | 1 |
| `grenades.bursts` | 2 | 1 | -0.3333 | 2 | 1 | 1 | 1 |
| `grenades.wounded` | 3 | 2 | -0.3333 | 2 | 1 | 1 | 1 |
| `grenades.casualties` | 2 | 0 | -0.6667 | 1 | 0 | 1 | 1 |
| `grenades.suppressed` | 6 | 3 | -1 | 2 | 1 | 1 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 4 | 0.6667 | 2 | 2 | 0 | 0.5 |
| `loopAlerts.length` | 48 | 48 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 2 | 0.6667 | 1 | 1 | 0 | 1 |
| `regroups.entries` | 13 | 13 | 0 | 2 | 1 | 1 | 1 |
| `stallOutcomes.wakes` | 1 | 6 | 1.6667 | 3 | 3 | 0 | 0.25 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 97 | 34 | -21 | 3 | 0 | 3 | 0.25 |
| `recon.contacts` | 17 | 2 | -5 | 3 | 0 | 3 | 0.25 |
| `recon.noContact` | 41 | 17 | -8 | 3 | 0 | 3 | 0.25 |
| `recon.timeouts` | 5 | 1 | -1.3333 | 2 | 1 | 1 | 1 |
| `recon.cancelled` | 33 | 14 | -6.3333 | 3 | 0 | 3 | 0.25 |
| `recon.reportsDelivered` | 67 | 8 | -19.6667 | 3 | 0 | 3 | 0.25 |
| `recon.retriggerBlocked` | 46 | 25 | -7 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanOverall` | 242.70000000000002 | 243.39999999999998 | 0.2333 | 3 | 2 | 1 | 1 |
| `squadPerformance.p10Overall` | 222 | 222 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 194.3 | 190.60000000000002 | -1.2333 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanMovement` | 299.40000000000003 | 298.6 | -0.2667 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanControl` | 284.1 | 283 | -0.3667 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanCohesion` | 271.79999999999995 | 284.9 | 4.3667 | 3 | 3 | 0 | 0.25 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

contact-690-2km-0001 1.05 s (timeline) · contact-690-2km-0002 1.05 s (timeline) · contact-690-2km-0003 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1431&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/contact-role-stability-20261030/ai_flow_live.html?bench=1431&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1431`); it opens the seed that parts earliest, and the dropdowns choose another.

