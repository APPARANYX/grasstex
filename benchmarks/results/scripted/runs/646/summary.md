# Benchmark run #646 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/299-c3-effective-fire-voice @ 5c2e528 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38264559341) · build v29-dev

## Verdict

**MOVED: 22 of 22 pairs changed (median first part 150 s); 12 of 42 counters under p 0.05 (about 2.1 by chance), 4 under 0.0012; casualties -1.2% (p 0.8238)**

- Clears the Bonferroni line (p < 0.0012): usKills 277 to 175 (-36.8%, p 0.0004); recon.orders 424 to 347 (-18.2%, p 0.0004); recon.contacts 61 to 35 (-42.6%, p 0.0005); recon.reportsDelivered 317 to 162 (-48.9%, p 0.0005).
- Under 0.05 only: squadPerformance.meanControl 2196.5 to 2189.5 (-0.3%, p 0.0042); squadPerformance.meanMission 1499.5 to 1579.8 (+5.4%, p 0.0043); recon.retriggerBlocked 252 to 217 (-13.9%, p 0.0129); recon.timeouts 23 to 14 (-39.1%, p 0.0156); retreatSamples 6802 to 5386 (-20.8%, p 0.0169); recon.noContact 233 to 211 (-9.4%, p 0.0215); regroups.entries 16 to 46 (+187.5%, p 0.0225); loopAlerts.length 4 to 19 (+375.0%, p 0.0386).
- Unpaired records: off 3, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **22** pairs (unpaired: off 3, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.105 (gate 1.25)
- the 22 changed records first part at simulated second: min 83.1, p10 83.1, median 150, p90 162, max 162

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 689 | 681 | -0.3636 | 20 | 9 | 11 | 0.8238 |
| `usKills` | 277 | 175 | -4.6364 | 20 | 2 | 18 | 0.0004 |
| `geKills` | 412 | 506 | 4.2727 | 19 | 13 | 6 | 0.1671 |
| `fire.total` | 701 | 680 | -0.9545 | 20 | 10 | 10 | 1 |
| `fire.hits` | 260 | 234 | -1.1818 | 20 | 10 | 10 | 1 |
| `retreatSamples` | 6802 | 5386 | -64.3636 | 22 | 5 | 17 | 0.0169 |
| `movementResolver.changes` | 39944 | 42668 | 123.8182 | 22 | 14 | 8 | 0.2863 |
| `grenades.throws` | 1 | 0 | -0.0455 | 1 | 0 | 1 | 1 |
| `grenades.bursts` | 1 | 0 | -0.0455 | 1 | 0 | 1 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 1 | 0 | -0.0455 | 1 | 0 | 1 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 6 | 12 | 0.2727 | 9 | 7 | 2 | 0.1797 |
| `loopAlerts.length` | 4 | 19 | 0.6818 | 12 | 10 | 2 | 0.0386 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 16 | 46 | 1.3636 | 13 | 11 | 2 | 0.0225 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 424 | 347 | -3.5 | 20 | 2 | 18 | 0.0004 |
| `recon.contacts` | 61 | 35 | -1.1818 | 12 | 0 | 12 | 0.0005 |
| `recon.noContact` | 233 | 211 | -1 | 10 | 1 | 9 | 0.0215 |
| `recon.timeouts` | 23 | 14 | -0.4091 | 7 | 0 | 7 | 0.0156 |
| `recon.cancelled` | 90 | 72 | -0.8182 | 16 | 4 | 12 | 0.0768 |
| `recon.reportsDelivered` | 317 | 162 | -7.0455 | 16 | 1 | 15 | 0.0005 |
| `recon.retriggerBlocked` | 252 | 217 | -1.5909 | 14 | 2 | 12 | 0.0129 |
| `squadPerformance.meanOverall` | 1899.4 | 1914.6 | 0.6909 | 21 | 14 | 7 | 0.1892 |
| `squadPerformance.p10Overall` | 1752.6999999999996 | 1757.0999999999992 | 0.2 | 10 | 6 | 4 | 0.7539 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1499.5 | 1579.8 | 3.65 | 22 | 18 | 4 | 0.0043 |
| `squadPerformance.meanMovement` | 2192.6000000000004 | 2187.8 | -0.2182 | 13 | 6 | 7 | 1 |
| `squadPerformance.meanControl` | 2196.5 | 2189.5 | -0.3182 | 16 | 2 | 14 | 0.0042 |
| `squadPerformance.meanCohesion` | 2002.3999999999996 | 1962.2000000000003 | -1.8273 | 20 | 8 | 12 | 0.5034 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0003 150 s (timeline) · phase-c-natural-20261012-0001 162 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=646&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/299-c3-effective-fire-voice/ai_flow_live.html?bench=646&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=646`); it opens the seed that parts earliest, and the dropdowns choose another.

