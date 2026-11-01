# Benchmark run #1570 · 3 seeds from `controller-natural-20261026` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/controller-meso-wrap-20261101 @ 902f870 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41290256663) · build v29-dev

## Verdict

**QUIET: 3 of 3 pairs changed (median first part 0.15 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -18.2% (p 0.25)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Wall time on/off x1.944 is over the 1.25 gate.

## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.944 (gate 1.25)
- the 3 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 159 | 130 | -9.6667 | 3 | 0 | 3 | 0.25 |
| `usKills` | 81 | 44 | -12.3333 | 3 | 0 | 3 | 0.25 |
| `geKills` | 78 | 86 | 2.6667 | 3 | 3 | 0 | 0.25 |
| `fire.total` | 2553 | 3474 | 307 | 3 | 3 | 0 | 0.25 |
| `fire.hits` | 329 | 268 | -20.3333 | 3 | 1 | 2 | 1 |
| `retreatSamples` | 5994 | 5917 | -25.6667 | 3 | 1 | 2 | 1 |
| `movementResolver.changes` | 10310 | 14741 | 1477 | 3 | 3 | 0 | 0.25 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 13 | 21 | 2.6667 | 3 | 2 | 1 | 1 |
| `loopAlerts.length` | 16 | 54 | 12.6667 | 3 | 3 | 0 | 0.25 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 8 | 8 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 64 | 73 | 3 | 3 | 2 | 1 | 1 |
| `recon.contacts` | 5 | 5 | 0 | 2 | 1 | 1 | 1 |
| `recon.noContact` | 45 | 40 | -1.6667 | 3 | 1 | 2 | 1 |
| `recon.timeouts` | 1 | 0 | -0.3333 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 12 | 23 | 3.6667 | 3 | 3 | 0 | 0.25 |
| `recon.reportsDelivered` | 29 | 25 | -1.3333 | 3 | 1 | 2 | 1 |
| `recon.retriggerBlocked` | 49 | 64 | 5 | 3 | 3 | 0 | 0.25 |
| `squadPerformance.meanOverall` | 239.8 | 238 | -0.6 | 3 | 1 | 2 | 1 |
| `squadPerformance.p10Overall` | 223.9 | 222 | -0.6333 | 1 | 0 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 187.7 | 179.8 | -2.6333 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanMovement` | 299.2 | 297.5 | -0.5667 | 2 | 0 | 2 | 0.5 |
| `squadPerformance.meanControl` | 287.2 | 277.4 | -3.2667 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanCohesion` | 272.40000000000003 | 280.3 | 2.6333 | 3 | 3 | 0 | 0.25 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

controller-natural-20261026-0001 0.15 s (timeline) · controller-natural-20261026-0002 0.15 s (timeline) · controller-natural-20261026-0003 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1570&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/controller-meso-wrap-20261101/ai_flow_live.html?bench=1570&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1570`); it opens the seed that parts earliest, and the dropdowns choose another.

