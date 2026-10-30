# Benchmark run #1424 · 3 seeds from `contact-690-2km` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0&pinBridge=1&pinNerve=1` · **ON** flags: `strategicInterception=0&pinBridge=1&pinNerve=1&tacticalController=new`
- work/contact-role-stability-20261030 @ f541b2d · [run](https://github.com/APPARANYX/grasstex/actions/runs/40996729038) · build v29-dev

## Verdict

**QUIET: 3 of 3 pairs changed (median first part 1.05 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -22.2% (p 0.25)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Wall time on/off x2.35 is over the 1.25 gate.

## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x2.35 (gate 1.25)
- the 3 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 144 | 112 | -10.6667 | 3 | 0 | 3 | 0.25 |
| `usKills` | 68 | 55 | -4.3333 | 3 | 1 | 2 | 1 |
| `geKills` | 76 | 57 | -6.3333 | 3 | 1 | 2 | 1 |
| `fire.total` | 2606 | 3174 | 189.3333 | 3 | 3 | 0 | 0.25 |
| `fire.hits` | 349 | 313 | -12 | 3 | 0 | 3 | 0.25 |
| `retreatSamples` | 5559 | 3683 | -625.3333 | 3 | 1 | 2 | 1 |
| `movementResolver.changes` | 11581 | 13663 | 694 | 3 | 3 | 0 | 0.25 |
| `grenades.throws` | 0 | 2 | 0.6667 | 2 | 2 | 0 | 0.5 |
| `grenades.bursts` | 0 | 2 | 0.6667 | 2 | 2 | 0 | 0.5 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 18 | 29 | 3.6667 | 3 | 3 | 0 | 0.25 |
| `loopAlerts.length` | 44 | 48 | 1.3333 | 1 | 1 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 13 | 11 | -0.6667 | 2 | 1 | 1 | 1 |
| `stallOutcomes.wakes` | 0 | 7 | 2.3333 | 3 | 3 | 0 | 0.25 |
| `stallOutcomes.repeats` | 0 | 4 | 1.3333 | 3 | 3 | 0 | 0.25 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 90 | 75 | -5 | 3 | 0 | 3 | 0.25 |
| `recon.contacts` | 3 | 8 | 1.6667 | 2 | 2 | 0 | 0.5 |
| `recon.noContact` | 62 | 44 | -6 | 3 | 0 | 3 | 0.25 |
| `recon.timeouts` | 2 | 0 | -0.6667 | 2 | 0 | 2 | 0.5 |
| `recon.cancelled` | 22 | 23 | 0.3333 | 3 | 2 | 1 | 1 |
| `recon.reportsDelivered` | 10 | 54 | 14.6667 | 3 | 3 | 0 | 0.25 |
| `recon.retriggerBlocked` | 72 | 70 | -0.6667 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanOverall` | 240.29999999999998 | 243.39999999999998 | 1.0333 | 3 | 3 | 0 | 0.25 |
| `squadPerformance.p10Overall` | 224.5 | 225.4 | 0.3 | 2 | 1 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 183.7 | 191.6 | 2.6333 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanMovement` | 299.3 | 297.9 | -0.4667 | 2 | 0 | 2 | 0.5 |
| `squadPerformance.meanControl` | 281.5 | 273.7 | -2.6 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanCohesion` | 277 | 277.6 | 0.2 | 3 | 1 | 2 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

contact-690-2km-0001 1.05 s (timeline) · contact-690-2km-0002 1.05 s (timeline) · contact-690-2km-0003 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1424&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/contact-role-stability-20261030/ai_flow_live.html?bench=1424&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1424`); it opens the seed that parts earliest, and the dropdowns choose another.

