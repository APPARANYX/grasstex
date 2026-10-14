# Benchmark run #958 · 3 seeds from `phase-c-natural-20261012` (meeting), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1&fireCoverCycle=1&squadReturnFire=1`
- work/phase-c-natural-readiness-diagnostics @ dc56795 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38648673125) · build v29-dev

## Verdict

**WEAK: 17 of 17 pairs changed (median first part 168 s); 3 of 42 counters under p 0.05 (about 2.1 by chance); casualties -13.5% (p 0.0213)**

- Under 0.05 only: regroups.entries 45 to 32 (-28.9%, p 0.0078); casualties 645 to 558 (-13.5%, p 0.0213); recon.contacts 13 to 5 (-61.5%, p 0.0215).
- Unpaired records: off 5, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **17** pairs (unpaired: off 5, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.133 (gate 1.25)
- the 17 changed records first part at simulated second: min 162, p10 162, median 168, p90 186, max 186

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 645 | 558 | -5.1176 | 16 | 3 | 13 | 0.0213 |
| `usKills` | 329 | 270 | -3.4706 | 16 | 5 | 11 | 0.2101 |
| `geKills` | 316 | 288 | -1.6471 | 16 | 7 | 9 | 0.8036 |
| `fire.total` | 618 | 1124 | 29.7647 | 16 | 11 | 5 | 0.2101 |
| `fire.hits` | 300 | 258 | -2.4706 | 16 | 5 | 11 | 0.2101 |
| `retreatSamples` | 4013 | 3286 | -42.7647 | 16 | 8 | 8 | 1 |
| `movementResolver.changes` | 42460 | 41643 | -48.0588 | 17 | 7 | 10 | 0.6291 |
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
| `vacantObjectiveStalls.length` | 10 | 12 | 0.1176 | 6 | 4 | 2 | 0.6875 |
| `loopAlerts.length` | 43 | 45 | 0.1176 | 12 | 4 | 8 | 0.3877 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 45 | 32 | -0.7647 | 8 | 0 | 8 | 0.0078 |
| `stallOutcomes.wakes` | 4 | 0 | -0.2353 | 4 | 0 | 4 | 0.125 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 340 | 347 | 0.4118 | 14 | 7 | 7 | 1 |
| `recon.contacts` | 13 | 5 | -0.4706 | 10 | 1 | 9 | 0.0215 |
| `recon.noContact` | 243 | 239 | -0.2353 | 5 | 2 | 3 | 1 |
| `recon.timeouts` | 6 | 2 | -0.2353 | 4 | 0 | 4 | 0.125 |
| `recon.cancelled` | 71 | 88 | 1 | 12 | 8 | 4 | 0.3877 |
| `recon.reportsDelivered` | 62 | 40 | -1.2941 | 13 | 4 | 9 | 0.2668 |
| `recon.retriggerBlocked` | 269 | 266 | -0.1765 | 7 | 4 | 3 | 1 |
| `squadPerformance.meanOverall` | 1466.3999999999999 | 1457.7 | -0.5118 | 16 | 7 | 9 | 0.8036 |
| `squadPerformance.p10Overall` | 1365.4 | 1343.7999999999997 | -1.2706 | 15 | 6 | 9 | 0.6072 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1199.7 | 1202.1000000000001 | 0.1412 | 17 | 9 | 8 | 1 |
| `squadPerformance.meanMovement` | 1665.1000000000001 | 1658.8000000000002 | -0.3706 | 16 | 10 | 6 | 0.4545 |
| `squadPerformance.meanControl` | 1671.7000000000003 | 1666.5 | -0.3059 | 17 | 10 | 7 | 0.6291 |
| `squadPerformance.meanCohesion` | 1528.4 | 1476.7 | -3.0412 | 16 | 5 | 11 | 0.2101 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0003 162 s (timeline) · phase-c-natural-20261012-0002 168 s (timeline) · phase-c-natural-20261012-0001 186 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=958&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=958&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=958`); it opens the seed that parts earliest, and the dropdowns choose another.

