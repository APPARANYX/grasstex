# Benchmark run #1432 · 3 seeds from `contact-690-2km` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&pinBridge=1&pinNerve=1` · **ON** flags: `strategicInterception=0&pinBridge=1&pinNerve=1&tacticalController=new`
- work/contact-role-stability-20261030 @ bf00553 · [run](https://github.com/APPARANYX/grasstex/actions/runs/40997887480) · build v29-dev

## Verdict

**QUIET: 3 of 3 pairs changed (median first part 1.05 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -27.2% (p 0.25)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Wall time on/off x2.181 is over the 1.25 gate.

## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x2.181 (gate 1.25)
- the 3 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 136 | 99 | -12.3333 | 3 | 0 | 3 | 0.25 |
| `usKills` | 72 | 65 | -2.3333 | 3 | 2 | 1 | 1 |
| `geKills` | 64 | 34 | -10 | 3 | 0 | 3 | 0.25 |
| `fire.total` | 2214 | 3298 | 361.3333 | 3 | 3 | 0 | 0.25 |
| `fire.hits` | 296 | 291 | -1.6667 | 3 | 2 | 1 | 1 |
| `retreatSamples` | 5342 | 7122 | 593.3333 | 3 | 3 | 0 | 0.25 |
| `movementResolver.changes` | 8516 | 9512 | 332 | 3 | 2 | 1 | 1 |
| `grenades.throws` | 5 | 5 | 0 | 2 | 1 | 1 | 1 |
| `grenades.bursts` | 5 | 5 | 0 | 2 | 1 | 1 | 1 |
| `grenades.wounded` | 2 | 1 | -0.3333 | 1 | 0 | 1 | 1 |
| `grenades.casualties` | 1 | 0 | -0.3333 | 1 | 0 | 1 | 1 |
| `grenades.suppressed` | 15 | 3 | -4 | 2 | 1 | 1 | 1 |
| `grenades.friendlyWounded` | 0 | 1 | 0.3333 | 1 | 1 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 4 | 4 | 0 | 2 | 1 | 1 | 1 |
| `loopAlerts.length` | 43 | 48 | 1.6667 | 3 | 2 | 1 | 1 |
| `writerConflicts` | 0 | 21 | 7 | 1 | 1 | 0 | 1 |
| `regroups.entries` | 14 | 25 | 3.6667 | 3 | 3 | 0 | 0.25 |
| `stallOutcomes.wakes` | 2 | 7 | 1.6667 | 3 | 3 | 0 | 0.25 |
| `stallOutcomes.repeats` | 1 | 2 | 0.3333 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 90 | 34 | -18.6667 | 3 | 0 | 3 | 0.25 |
| `recon.contacts` | 16 | 1 | -5 | 3 | 0 | 3 | 0.25 |
| `recon.noContact` | 55 | 9 | -15.3333 | 3 | 0 | 3 | 0.25 |
| `recon.timeouts` | 1 | 0 | -0.3333 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 18 | 24 | 2 | 2 | 2 | 0 | 0.5 |
| `recon.reportsDelivered` | 55 | 4 | -17 | 3 | 0 | 3 | 0.25 |
| `recon.retriggerBlocked` | 43 | 21 | -7.3333 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanOverall` | 242.3 | 245 | 0.9 | 3 | 2 | 1 | 1 |
| `squadPerformance.p10Overall` | 222 | 224.1 | 0.7 | 1 | 1 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 196.3 | 191 | -1.7667 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanMovement` | 299.5 | 299.6 | 0.0333 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanControl` | 280.8 | 286.70000000000005 | 1.9667 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanCohesion` | 267.2 | 284.4 | 5.7333 | 3 | 3 | 0 | 0.25 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

contact-690-2km-0001 1.05 s (timeline) · contact-690-2km-0002 1.05 s (timeline) · contact-690-2km-0003 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1432&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/contact-role-stability-20261030/ai_flow_live.html?bench=1432&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1432`); it opens the seed that parts earliest, and the dropdowns choose another.

