# Benchmark run #1425 · 3 seeds from `contact-690-2km` (ge-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0&pinBridge=1&pinNerve=1` · **ON** flags: `strategicInterception=0&pinBridge=1&pinNerve=1&tacticalController=new`
- work/contact-role-stability-20261030 @ f541b2d · [run](https://github.com/APPARANYX/grasstex/actions/runs/40996733342) · build v29-dev

## Verdict

**QUIET: 3 of 3 pairs changed (median first part 1.05 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -19.9% (p 0.25)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Wall time on/off x1.677 is over the 1.25 gate.

## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.677 (gate 1.25)
- the 3 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 136 | 109 | -9 | 3 | 0 | 3 | 0.25 |
| `usKills` | 72 | 64 | -2.6667 | 3 | 2 | 1 | 1 |
| `geKills` | 64 | 45 | -6.3333 | 3 | 0 | 3 | 0.25 |
| `fire.total` | 2214 | 2749 | 178.3333 | 3 | 2 | 1 | 1 |
| `fire.hits` | 296 | 290 | -2 | 3 | 2 | 1 | 1 |
| `retreatSamples` | 5342 | 6722 | 460 | 3 | 3 | 0 | 0.25 |
| `movementResolver.changes` | 8516 | 9384 | 289.3333 | 3 | 2 | 1 | 1 |
| `grenades.throws` | 5 | 4 | -0.3333 | 3 | 2 | 1 | 1 |
| `grenades.bursts` | 5 | 4 | -0.3333 | 3 | 2 | 1 | 1 |
| `grenades.wounded` | 2 | 0 | -0.6667 | 1 | 0 | 1 | 1 |
| `grenades.casualties` | 1 | 0 | -0.3333 | 1 | 0 | 1 | 1 |
| `grenades.suppressed` | 15 | 2 | -4.3333 | 3 | 2 | 1 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 1 | 0.3333 | 1 | 1 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 4 | 13 | 3 | 2 | 2 | 0 | 0.5 |
| `loopAlerts.length` | 43 | 48 | 1.6667 | 3 | 2 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 14 | 14 | 0 | 3 | 2 | 1 | 1 |
| `stallOutcomes.wakes` | 2 | 7 | 1.6667 | 3 | 3 | 0 | 0.25 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 90 | 32 | -19.3333 | 3 | 0 | 3 | 0.25 |
| `recon.contacts` | 16 | 2 | -4.6667 | 3 | 0 | 3 | 0.25 |
| `recon.noContact` | 55 | 10 | -15 | 3 | 0 | 3 | 0.25 |
| `recon.timeouts` | 1 | 0 | -0.3333 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 18 | 20 | 0.6667 | 3 | 2 | 1 | 1 |
| `recon.reportsDelivered` | 55 | 9 | -15.3333 | 3 | 0 | 3 | 0.25 |
| `recon.retriggerBlocked` | 43 | 20 | -7.6667 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanOverall` | 242.3 | 244.4 | 0.7 | 3 | 2 | 1 | 1 |
| `squadPerformance.p10Overall` | 222 | 222 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 196.3 | 191.1 | -1.7333 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanMovement` | 299.5 | 299.7 | 0.0667 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanControl` | 280.8 | 285 | 1.4 | 3 | 2 | 1 | 1 |
| `squadPerformance.meanCohesion` | 267.2 | 282.8 | 5.2 | 3 | 3 | 0 | 0.25 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

contact-690-2km-0001 1.05 s (timeline) · contact-690-2km-0002 1.05 s (timeline) · contact-690-2km-0003 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1425&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/contact-role-stability-20261030/ai_flow_live.html?bench=1425&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1425`); it opens the seed that parts earliest, and the dropdowns choose another.

