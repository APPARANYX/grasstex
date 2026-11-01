# Benchmark run #1571 · 3 seeds from `controller-natural-20261026` (us-defend), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/controller-meso-wrap-20261101 @ 902f870 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41290259056) · build v29-dev

## Verdict

**QUIET: 3 of 3 pairs changed (median first part 0.15 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -3.4% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Wall time on/off x2.41 is over the 1.25 gate.

## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x2.41 (gate 1.25)
- the 3 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 87 | 84 | -1 | 2 | 1 | 1 | 1 |
| `usKills` | 28 | 32 | 1.3333 | 2 | 1 | 1 | 1 |
| `geKills` | 59 | 52 | -2.3333 | 2 | 1 | 1 | 1 |
| `fire.total` | 838 | 2496 | 552.6667 | 2 | 2 | 0 | 0.5 |
| `fire.hits` | 146 | 228 | 27.3333 | 2 | 1 | 1 | 1 |
| `retreatSamples` | 2120 | 4077 | 652.3333 | 2 | 2 | 0 | 0.5 |
| `movementResolver.changes` | 5607 | 8459 | 950.6667 | 3 | 3 | 0 | 0.25 |
| `grenades.throws` | 0 | 1 | 0.3333 | 1 | 1 | 0 | 1 |
| `grenades.bursts` | 0 | 1 | 0.3333 | 1 | 1 | 0 | 1 |
| `grenades.wounded` | 0 | 1 | 0.3333 | 1 | 1 | 0 | 1 |
| `grenades.casualties` | 0 | 1 | 0.3333 | 1 | 1 | 0 | 1 |
| `grenades.suppressed` | 0 | 5 | 1.6667 | 1 | 1 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 1 | 0.3333 | 1 | 1 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 6 | 1.3333 | 1 | 1 | 0 | 1 |
| `loopAlerts.length` | 29 | 32 | 1 | 2 | 1 | 1 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 8 | 11 | 1 | 2 | 1 | 1 | 1 |
| `stallOutcomes.wakes` | 1 | 0 | -0.3333 | 1 | 0 | 1 | 1 |
| `stallOutcomes.repeats` | 1 | 0 | -0.3333 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 67 | 88 | 7 | 3 | 3 | 0 | 0.25 |
| `recon.contacts` | 10 | 18 | 2.6667 | 2 | 1 | 1 | 1 |
| `recon.noContact` | 20 | 21 | 0.3333 | 2 | 1 | 1 | 1 |
| `recon.timeouts` | 2 | 2 | 0 | 2 | 1 | 1 | 1 |
| `recon.cancelled` | 28 | 41 | 4.3333 | 3 | 3 | 0 | 0.25 |
| `recon.reportsDelivered` | 49 | 83 | 11.3333 | 2 | 1 | 1 | 1 |
| `recon.retriggerBlocked` | 24 | 25 | 0.3333 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanOverall` | 258.6 | 257.6 | -0.3333 | 3 | 1 | 2 | 1 |
| `squadPerformance.p10Overall` | 240.8 | 242.2 | 0.4667 | 1 | 1 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 223.60000000000002 | 216.3 | -2.4333 | 2 | 0 | 2 | 0.5 |
| `squadPerformance.meanMovement` | 299.5 | 299.8 | 0.1 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanControl` | 288.5 | 290.3 | 0.6 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.meanCohesion` | 275.4 | 280.79999999999995 | 1.8 | 3 | 3 | 0 | 0.25 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

controller-natural-20261026-0001 0.15 s (timeline) · controller-natural-20261026-0002 0.15 s (timeline) · controller-natural-20261026-0003 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1571&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/controller-meso-wrap-20261101/ai_flow_live.html?bench=1571&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1571`); it opens the seed that parts earliest, and the dropdowns choose another.

