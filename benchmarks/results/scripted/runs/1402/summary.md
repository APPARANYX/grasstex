# Benchmark run #1402 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/tactical-contact-route-graph-20261026 @ 3193dec · [run](https://github.com/APPARANYX/grasstex/actions/runs/40338985328) · build v29-dev

## Verdict

**QUIET: 8 of 8 pairs changed (median first part 340.05 s); 0 of 42 counters under p 0.05 (about 2.1 by chance); casualties -10.3% (p 0.0625)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.
- Unpaired records: off 7, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **8** pairs (unpaired: off 7, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.99 (gate 1.25)
- the 5 changed records first part at simulated second: min 340.05, p10 340.05, median 340.05, p90 340.05, max 340.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 175 | 157 | -2.25 | 5 | 0 | 5 | 0.0625 |
| `usKills` | 74 | 89 | 1.875 | 5 | 4 | 1 | 0.375 |
| `geKills` | 101 | 68 | -4.125 | 5 | 0 | 5 | 0.0625 |
| `fire.total` | 182 | 177 | -0.625 | 3 | 1 | 2 | 1 |
| `fire.hits` | 68 | 58 | -1.25 | 3 | 1 | 2 | 1 |
| `retreatSamples` | 696 | 639 | -7.125 | 4 | 1 | 3 | 0.625 |
| `movementResolver.changes` | 6507 | 5323 | -148 | 5 | 1 | 4 | 0.375 |
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
| `vacantObjectiveStalls.length` | 2 | 0 | -0.25 | 1 | 0 | 1 | 1 |
| `loopAlerts.length` | 8 | 9 | 0.125 | 1 | 1 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 14 | 12 | -0.25 | 2 | 0 | 2 | 0.5 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 121 | 115 | -0.75 | 6 | 1 | 5 | 0.2188 |
| `recon.contacts` | 15 | 11 | -0.5 | 4 | 0 | 4 | 0.125 |
| `recon.noContact` | 35 | 40 | 0.625 | 3 | 3 | 0 | 0.25 |
| `recon.timeouts` | 20 | 21 | 0.125 | 1 | 1 | 0 | 1 |
| `recon.cancelled` | 34 | 25 | -1.125 | 5 | 0 | 5 | 0.0625 |
| `recon.reportsDelivered` | 76 | 52 | -3 | 4 | 0 | 4 | 0.125 |
| `recon.retriggerBlocked` | 61 | 60 | -0.125 | 2 | 1 | 1 | 1 |
| `squadPerformance.meanOverall` | 733.1 | 735.5000000000001 | 0.3 | 5 | 4 | 1 | 0.375 |
| `squadPerformance.p10Overall` | 661.6 | 663.7000000000002 | 0.2625 | 5 | 3 | 2 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 678.9000000000001 | 680.7 | 0.225 | 4 | 3 | 1 | 0.625 |
| `squadPerformance.meanMovement` | 771.5 | 771.6999999999999 | 0.025 | 4 | 2 | 2 | 1 |
| `squadPerformance.meanControl` | 793.3 | 792.5 | -0.1 | 3 | 0 | 3 | 0.25 |
| `squadPerformance.meanCohesion` | 725.4999999999999 | 739.1999999999999 | 1.7125 | 5 | 4 | 1 | 0.375 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 1 seed that part earliest (simulated seconds)

phase-c-natural-20261012-0002 340.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1402&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/tactical-contact-route-graph-20261026/ai_flow_live.html?bench=1402&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1402`); it opens the seed that parts earliest, and the dropdowns choose another.

