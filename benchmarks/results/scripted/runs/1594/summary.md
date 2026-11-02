# Benchmark run #1594 · 3 seeds from `controller-natural-20261026` (meeting), windows `0+600`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/meso708-physical-query-fastpath-20261102 @ 2da5f5d · [run](https://github.com/APPARANYX/grasstex/actions/runs/41383921180) · build v29-dev

## Verdict

**QUIET: 3 of 3 pairs changed (median first part 0.15 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -21.1% (p 0.25)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Wall time on/off x2 is over the 1.25 gate.

## Paired comparison (off against on)

- **3** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x2 (gate 1.25)
- the 3 changed records first part at simulated second: min 0.15, p10 0.15, median 0.15, p90 0.15, max 0.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 166 | 131 | -11.6667 | 3 | 0 | 3 | 0.25 |
| `usKills` | 83 | 45 | -12.6667 | 3 | 0 | 3 | 0.25 |
| `geKills` | 83 | 86 | 1 | 3 | 2 | 1 | 1 |
| `fire.total` | 2655 | 3498 | 281 | 3 | 3 | 0 | 0.25 |
| `fire.hits` | 349 | 273 | -25.3333 | 3 | 0 | 3 | 0.25 |
| `retreatSamples` | 6013 | 5949 | -21.3333 | 3 | 1 | 2 | 1 |
| `movementResolver.changes` | 10343 | 14824 | 1493.6667 | 3 | 3 | 0 | 0.25 |
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
| `vacantObjectiveStalls.length` | 12 | 19 | 2.3333 | 3 | 2 | 1 | 1 |
| `loopAlerts.length` | 14 | 54 | 13.3333 | 3 | 3 | 0 | 0.25 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 6 | 11 | 1.6667 | 2 | 1 | 1 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 63 | 75 | 4 | 3 | 3 | 0 | 0.25 |
| `recon.contacts` | 4 | 5 | 0.3333 | 1 | 1 | 0 | 1 |
| `recon.noContact` | 45 | 40 | -1.6667 | 3 | 1 | 2 | 1 |
| `recon.timeouts` | 1 | 0 | -0.3333 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 12 | 25 | 4.3333 | 3 | 3 | 0 | 0.25 |
| `recon.reportsDelivered` | 24 | 25 | 0.3333 | 3 | 2 | 1 | 1 |
| `recon.retriggerBlocked` | 49 | 65 | 5.3333 | 3 | 3 | 0 | 0.25 |
| `squadPerformance.meanOverall` | 239.3 | 237.7 | -0.5333 | 3 | 1 | 2 | 1 |
| `squadPerformance.p10Overall` | 223.9 | 222 | -0.6333 | 1 | 0 | 1 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 183.8 | 179.3 | -1.5 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanMovement` | 299.09999999999997 | 297.5 | -0.5333 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanControl` | 289.2 | 277.29999999999995 | -3.9667 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanCohesion` | 275 | 280.8 | 1.9333 | 3 | 3 | 0 | 0.25 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

controller-natural-20261026-0001 0.15 s (timeline) · controller-natural-20261026-0002 0.15 s (timeline) · controller-natural-20261026-0003 0.15 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1594&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/meso708-physical-query-fastpath-20261102/ai_flow_live.html?bench=1594&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1594`); it opens the seed that parts earliest, and the dropdowns choose another.

