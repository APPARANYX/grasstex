# Benchmark run #1234 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/squad-firing-positions-20261021 @ 588afb2 · [run](https://github.com/APPARANYX/grasstex/actions/runs/39773802393) · build v29-dev

## Verdict

**WEAK: 20 of 20 pairs changed (median first part 410.1 s); 1 of 42 counters under p 0.05 (about 2.1 by chance); casualties +6.7% (p 0.0703)**

- Under 0.05 only: usKills 224 to 261 (+16.5%, p 0.0039).

## Paired comparison (off against on)

- **20** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.055 (gate 1.25)
- the 13 changed records first part at simulated second: min 269.1, p10 269.1, median 410.1, p90 458.1, max 458.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 419 | 447 | 1.4 | 8 | 7 | 1 | 0.0703 |
| `usKills` | 224 | 261 | 1.85 | 9 | 9 | 0 | 0.0039 |
| `geKills` | 195 | 186 | -0.45 | 9 | 2 | 7 | 0.1797 |
| `fire.total` | 512 | 616 | 5.2 | 8 | 5 | 3 | 0.7266 |
| `fire.hits` | 215 | 258 | 2.15 | 7 | 4 | 3 | 1 |
| `retreatSamples` | 4190 | 3946 | -12.2 | 9 | 3 | 6 | 0.5078 |
| `movementResolver.changes` | 14428 | 14638 | 10.5 | 12 | 9 | 3 | 0.146 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 5 | 5 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 16 | 12 | -0.2 | 6 | 3 | 3 | 1 |
| `loopAlerts.length` | 36 | 44 | 0.4 | 8 | 5 | 3 | 0.7266 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 3 | 3 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.wakes` | 2 | 0 | -0.1 | 2 | 0 | 2 | 0.5 |
| `stallOutcomes.repeats` | 2 | 0 | -0.1 | 2 | 0 | 2 | 0.5 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 242 | 243 | 0.05 | 6 | 2 | 4 | 0.6875 |
| `recon.contacts` | 14 | 13 | -0.05 | 7 | 3 | 4 | 1 |
| `recon.noContact` | 27 | 31 | 0.2 | 6 | 3 | 3 | 1 |
| `recon.timeouts` | 65 | 65 | 0 | 2 | 1 | 1 | 1 |
| `recon.cancelled` | 87 | 88 | 0.05 | 3 | 2 | 1 | 1 |
| `recon.reportsDelivered` | 78 | 46 | -1.6 | 4 | 0 | 4 | 0.125 |
| `recon.retriggerBlocked` | 90 | 98 | 0.4 | 6 | 5 | 1 | 0.2188 |
| `squadPerformance.meanOverall` | 1636.6999999999998 | 1644.0000000000002 | 0.365 | 12 | 6 | 6 | 1 |
| `squadPerformance.p10Overall` | 1491.5999999999995 | 1483.5999999999995 | -0.4 | 8 | 4 | 4 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1290 | 1311.7 | 1.085 | 11 | 7 | 4 | 0.5488 |
| `squadPerformance.meanMovement` | 1842.8000000000002 | 1843.2 | 0.02 | 9 | 5 | 4 | 1 |
| `squadPerformance.meanControl` | 1880.9 | 1877.4000000000003 | -0.175 | 10 | 4 | 6 | 0.7539 |
| `squadPerformance.meanCohesion` | 1778.5000000000002 | 1786.6 | 0.405 | 11 | 7 | 4 | 0.5488 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 269.1 s (timeline) · phase-c-natural-20261012-0002 410.1 s (timeline) · phase-c-natural-20261012-0003 458.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1234&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/squad-firing-positions-20261021/ai_flow_live.html?bench=1234&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1234`); it opens the seed that parts earliest, and the dropdowns choose another.

