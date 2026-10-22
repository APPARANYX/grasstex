# Benchmark run #1276 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/gap-holding-20261022 @ bdb3fc1 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39832222668) · build v29-dev

## Verdict

**WEAK: 20 of 20 pairs changed (median first part 424.05 s); 3 of 42 counters under p 0.05 (about 2.1 by chance); casualties +0.0% (p 1)**

- Under 0.05 only: recon.orders 312 to 293 (-6.1%, p 0.0078); recon.contacts 17 to 10 (-41.2%, p 0.0156); recon.cancelled 88 to 79 (-10.2%, p 0.0156).

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.032 (gate 1.25)
- the 3 changed records first part at simulated second: min 424.05, p10 424.05, median 424.05, p90 424.05, max 424.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 411 | 411 | 0 | 0 | 0 | 0 | 1 |
| `usKills` | 266 | 266 | 0 | 0 | 0 | 0 | 1 |
| `geKills` | 145 | 145 | 0 | 0 | 0 | 0 | 1 |
| `fire.total` | 531 | 537 | 0.3 | 2 | 2 | 0 | 0.5 |
| `fire.hits` | 246 | 237 | -0.45 | 2 | 0 | 2 | 0.5 |
| `retreatSamples` | 3331 | 3302 | -1.45 | 2 | 0 | 2 | 0.5 |
| `movementResolver.changes` | 15144 | 15024 | -6 | 3 | 0 | 3 | 0.25 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 1 | 0 | -0.05 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 6 | 6 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 31 | 34 | 0.15 | 1 | 1 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 8 | 9 | 0.05 | 1 | 1 | 0 | 1 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 8 | 2 | -0.3 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 8 | 2 | -0.3 | 1 | 0 | 1 | 1 |
| `recon.orders` | 312 | 293 | -0.95 | 8 | 0 | 8 | 0.0078 |
| `recon.contacts` | 17 | 10 | -0.35 | 7 | 0 | 7 | 0.0156 |
| `recon.noContact` | 78 | 77 | -0.05 | 1 | 0 | 1 | 1 |
| `recon.timeouts` | 78 | 78 | 0 | 0 | 0 | 0 | 1 |
| `recon.cancelled` | 88 | 79 | -0.45 | 7 | 0 | 7 | 0.0156 |
| `recon.reportsDelivered` | 57 | 52 | -0.25 | 1 | 0 | 1 | 1 |
| `recon.retriggerBlocked` | 152 | 152 | 0 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanOverall` | 1780.1999999999998 | 1781.6999999999998 | 0.075 | 3 | 3 | 0 | 0.25 |
| `squadPerformance.p10Overall` | 1579.7999999999997 | 1582.2999999999997 | 0.125 | 2 | 2 | 0 | 0.5 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1525.5000000000002 | 1529.6000000000001 | 0.205 | 3 | 3 | 0 | 0.25 |
| `squadPerformance.meanMovement` | 1961.3 | 1961.1 | -0.01 | 3 | 1 | 2 | 1 |
| `squadPerformance.meanControl` | 1980.7 | 1978.8 | -0.095 | 2 | 0 | 2 | 0.5 |
| `squadPerformance.meanCohesion` | 1830.7 | 1834.3 | 0.18 | 3 | 3 | 0 | 0.25 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 1 seed that part earliest (simulated seconds)

phase-c-natural-20261012-0002 424.05 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1276&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/gap-holding-20261022/ai_flow_live.html?bench=1276&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1276`); it opens the seed that parts earliest, and the dropdowns choose another.

