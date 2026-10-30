# Benchmark run #1427 · 3 seeds from `contact-690-5km` (meeting), windows `0+1800`

- **OFF** flags: `strategicInterception=1&pinBridge=1&pinNerve=1` · **ON** flags: `strategicInterception=1&pinBridge=1&pinNerve=1&tacticalController=new`
- work/contact-role-stability-20261030 @ f541b2d · [run](https://github.com/APPARANYX/grasstex/actions/runs/40996738182) · build v29-dev

## Verdict

**QUIET: 3 of 3 pairs changed (median first part 1.05 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -42.5% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.243 (gate 1.25)
- the 3 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 181 | 104 | -25.6667 | 3 | 1 | 2 | 1 |
| `usKills` | 104 | 51 | -17.6667 | 3 | 1 | 2 | 1 |
| `geKills` | 77 | 53 | -8 | 3 | 1 | 2 | 1 |
| `fire.total` | 2484 | 3999 | 505 | 3 | 2 | 1 | 1 |
| `fire.hits` | 396 | 210 | -62 | 3 | 1 | 2 | 1 |
| `retreatSamples` | 19808 | 19560 | -82.6667 | 3 | 1 | 2 | 1 |
| `movementResolver.changes` | 21744 | 12174 | -3190 | 3 | 0 | 3 | 0.25 |
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
| `targetlessStalls.length` | 1 | 3 | 0.6667 | 2 | 2 | 0 | 0.5 |
| `vacantObjectiveStalls.length` | 37 | 46 | 3 | 3 | 2 | 1 | 1 |
| `loopAlerts.length` | 52 | 48 | -1.3333 | 2 | 0 | 2 | 0.5 |
| `writerConflicts` | 0 | 17 | 5.6667 | 2 | 2 | 0 | 0.5 |
| `regroups.entries` | 25 | 16 | -3 | 3 | 2 | 1 | 1 |
| `stallOutcomes.wakes` | 0 | 1 | 0.3333 | 1 | 1 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 1 | 0.3333 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 88 | 66 | -7.3333 | 3 | 0 | 3 | 0.25 |
| `recon.contacts` | 6 | 4 | -0.6667 | 2 | 1 | 1 | 1 |
| `recon.noContact` | 38 | 20 | -6 | 3 | 0 | 3 | 0.25 |
| `recon.timeouts` | 20 | 16 | -1.3333 | 2 | 0 | 2 | 0.5 |
| `recon.cancelled` | 24 | 26 | 0.6667 | 3 | 2 | 1 | 1 |
| `recon.reportsDelivered` | 39 | 22 | -5.6667 | 2 | 1 | 1 | 1 |
| `recon.retriggerBlocked` | 57 | 50 | -2.3333 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanOverall` | 240.10000000000002 | 237.5 | -0.8667 | 3 | 1 | 2 | 1 |
| `squadPerformance.p10Overall` | 220.70000000000002 | 222 | 0.4333 | 3 | 2 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 188.3 | 174 | -4.7667 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanMovement` | 285.29999999999995 | 293.4 | 2.7 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanControl` | 281 | 274.9 | -2.0333 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanCohesion` | 286.4 | 288.8 | 0.8 | 3 | 2 | 1 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

contact-690-5km-0001 1.05 s (timeline) · contact-690-5km-0002 1.05 s (timeline) · contact-690-5km-0003 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1427&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/contact-role-stability-20261030/ai_flow_live.html?bench=1427&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1427`); it opens the seed that parts earliest, and the dropdowns choose another.

