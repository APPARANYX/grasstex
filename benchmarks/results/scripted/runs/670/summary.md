# Benchmark run #670 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ 5999d70 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38271969306) · build v29-dev

## Verdict

**MOVED: 22 of 22 pairs changed (median first part 150 s); 11 of 42 counters under p 0.05 (about 2.1 by chance), 5 under 0.0012; casualties +0.0% (p 1)**

- Clears the Bonferroni line (p < 0.0012): recon.orders 424 to 334 (-21.2%, p 0); recon.contacts 61 to 22 (-63.9%, p 0); retreatSamples 6802 to 4881 (-28.2%, p 0.0001); squadPerformance.meanMission 1499.5 to 1609.3999999999999 (+7.3%, p 0.0001); recon.reportsDelivered 317 to 67 (-78.9%, p 0.0005).
- Under 0.05 only: usKills 277 to 176 (-36.5%, p 0.0026); regroups.entries 16 to 45 (+181.3%, p 0.0063); recon.cancelled 90 to 64 (-28.9%, p 0.0075); recon.timeouts 23 to 14 (-39.1%, p 0.0156); squadPerformance.meanControl 2196.5 to 2193.2 (-0.2%, p 0.0309); recon.retriggerBlocked 252 to 208 (-17.5%, p 0.0352).
- Unpaired records: off 3, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **22** pairs (unpaired: off 3, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.106 (gate 1.25)
- the 22 changed records first part at simulated second: min 83.1, p10 83.1, median 150, p90 162, max 162

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 689 | 689 | 0 | 21 | 10 | 11 | 1 |
| `usKills` | 277 | 176 | -4.5909 | 20 | 3 | 17 | 0.0026 |
| `geKills` | 412 | 513 | 4.5909 | 21 | 14 | 7 | 0.1892 |
| `fire.total` | 701 | 712 | 0.5 | 20 | 9 | 11 | 0.8238 |
| `fire.hits` | 260 | 252 | -0.3636 | 18 | 8 | 10 | 0.8145 |
| `retreatSamples` | 6802 | 4881 | -87.3182 | 22 | 2 | 20 | 0.0001 |
| `movementResolver.changes` | 39944 | 42353 | 109.5 | 22 | 13 | 9 | 0.5235 |
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
| `vacantObjectiveStalls.length` | 6 | 9 | 0.1364 | 6 | 4 | 2 | 0.6875 |
| `loopAlerts.length` | 4 | 8 | 0.1818 | 9 | 7 | 2 | 0.1797 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 16 | 45 | 1.3182 | 12 | 11 | 1 | 0.0063 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 424 | 334 | -4.0909 | 20 | 1 | 19 | 0 |
| `recon.contacts` | 61 | 22 | -1.7727 | 16 | 0 | 16 | 0 |
| `recon.noContact` | 233 | 214 | -0.8636 | 8 | 3 | 5 | 0.7266 |
| `recon.timeouts` | 23 | 14 | -0.4091 | 7 | 0 | 7 | 0.0156 |
| `recon.cancelled` | 90 | 64 | -1.1818 | 18 | 3 | 15 | 0.0075 |
| `recon.reportsDelivered` | 317 | 67 | -11.3636 | 16 | 1 | 15 | 0.0005 |
| `recon.retriggerBlocked` | 252 | 208 | -2 | 15 | 3 | 12 | 0.0352 |
| `squadPerformance.meanOverall` | 1899.4 | 1922.8999999999999 | 1.0682 | 20 | 14 | 6 | 0.1153 |
| `squadPerformance.p10Overall` | 1752.6999999999996 | 1765.1999999999994 | 0.5682 | 12 | 7 | 5 | 0.7744 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1499.5 | 1609.3999999999999 | 4.9955 | 22 | 20 | 2 | 0.0001 |
| `squadPerformance.meanMovement` | 2192.6000000000004 | 2188.3 | -0.1955 | 14 | 6 | 8 | 0.7905 |
| `squadPerformance.meanControl` | 2196.5 | 2193.2 | -0.15 | 18 | 4 | 14 | 0.0309 |
| `squadPerformance.meanCohesion` | 2002.3999999999996 | 1949.6000000000004 | -2.4 | 21 | 7 | 14 | 0.1892 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0003 150 s (timeline) · phase-c-natural-20261012-0001 162 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=670&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=670&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=670`); it opens the seed that parts earliest, and the dropdowns choose another.

