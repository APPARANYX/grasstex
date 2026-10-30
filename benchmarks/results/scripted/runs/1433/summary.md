# Benchmark run #1433 · 3 seeds from `contact-690-5km` (meeting), windows `0+1800`

- **OFF** flags: `strategicInterception=1&pinBridge=1&pinNerve=1` · **ON** flags: `strategicInterception=1&pinBridge=1&pinNerve=1&tacticalController=new`
- work/contact-role-stability-20261030 @ bf00553 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40997890494) · build v29-dev

## Verdict

**QUIET: 3 of 3 pairs changed (median first part 1.05 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -59.7% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Wall time on/off x1.361 is over the 1.25 gate.

## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.361 (gate 1.25)
- the 3 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 181 | 73 | -36 | 3 | 1 | 2 | 1 |
| `usKills` | 104 | 46 | -19.3333 | 3 | 1 | 2 | 1 |
| `geKills` | 77 | 27 | -16.6667 | 3 | 0 | 3 | 0.25 |
| `fire.total` | 2484 | 5385 | 967 | 3 | 3 | 0 | 0.25 |
| `fire.hits` | 396 | 138 | -86 | 3 | 0 | 3 | 0.25 |
| `retreatSamples` | 19808 | 26796 | 2329.3333 | 3 | 2 | 1 | 1 |
| `movementResolver.changes` | 21744 | 12513 | -3077 | 3 | 0 | 3 | 0.25 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 4 | 0 | -1.3333 | 3 | 0 | 3 | 0.25 |
| `targetlessStalls.length` | 1 | 5 | 1.3333 | 3 | 3 | 0 | 0.25 |
| `vacantObjectiveStalls.length` | 37 | 28 | -3 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 52 | 79 | 9 | 2 | 1 | 1 | 1 |
| `writerConflicts` | 0 | 20 | 6.6667 | 2 | 2 | 0 | 0.5 |
| `regroups.entries` | 25 | 14 | -3.6667 | 3 | 2 | 1 | 1 |
| `stallOutcomes.wakes` | 0 | 2 | 0.6667 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 2 | 0.6667 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 88 | 62 | -8.6667 | 3 | 0 | 3 | 0.25 |
| `recon.contacts` | 6 | 4 | -0.6667 | 2 | 1 | 1 | 1 |
| `recon.noContact` | 38 | 22 | -5.3333 | 2 | 0 | 2 | 0.5 |
| `recon.timeouts` | 20 | 14 | -2 | 2 | 0 | 2 | 0.5 |
| `recon.cancelled` | 24 | 22 | -0.6667 | 2 | 1 | 1 | 1 |
| `recon.reportsDelivered` | 39 | 22 | -5.6667 | 2 | 1 | 1 | 1 |
| `recon.retriggerBlocked` | 57 | 44 | -4.3333 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanOverall` | 240.10000000000002 | 234.5 | -1.8667 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.p10Overall` | 220.70000000000002 | 224.1 | 1.1333 | 3 | 3 | 0 | 0.25 |
| `squadPerformance.lowScoreSquads` | 0 | 3 | 1 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanMission` | 188.3 | 166.2 | -7.3667 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanMovement` | 285.29999999999995 | 293 | 2.5667 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanControl` | 281 | 276.2 | -1.6 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanCohesion` | 286.4 | 290.2 | 1.2667 | 3 | 2 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

contact-690-5km-0001 1.05 s (timeline) · contact-690-5km-0002 1.05 s (timeline) · contact-690-5km-0003 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1433&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/contact-role-stability-20261030/ai_flow_live.html?bench=1433&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1433`); it opens the seed that parts earliest, and the dropdowns choose another.

