# Benchmark run #929 · 3 seeds from `phase-c-natural-20261012` (us-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-mainline-integration @ 8dff174 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38492191266) · build v29-dev

## Verdict

**MOVED: 24 of 24 pairs changed (median first part 150 s); 5 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties -3.8% (p 0.8238)**

- Clears the Bonferroni line (p < 0.0012): movementResolver.changes 43306 to 38508 (-11.1%, p 0).
- Under 0.05 only: regroups.entries 54 to 23 (-57.4%, p 0.0213); recon.orders 460 to 392 (-14.8%, p 0.0266); recon.contacts 67 to 60 (-10.4%, p 0.049); recon.noContact 240 to 235 (-2.1%, p 0.049).
- Unpaired records: off 1, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **24** pairs (unpaired: off 1, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.095 (gate 1.25)
- the 24 changed records first part at simulated second: min 83.1, p10 83.1, median 150, p90 161.1, max 161.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 890 | 856 | -1.4167 | 20 | 11 | 9 | 0.8238 |
| `usKills` | 376 | 477 | 4.2083 | 23 | 11 | 12 | 1 |
| `geKills` | 514 | 379 | -5.625 | 22 | 10 | 12 | 0.8318 |
| `fire.total` | 864 | 648 | -9 | 20 | 8 | 12 | 0.5034 |
| `fire.hits` | 332 | 276 | -2.3333 | 18 | 8 | 10 | 0.8145 |
| `retreatSamples` | 6945 | 6147 | -33.25 | 21 | 10 | 11 | 1 |
| `movementResolver.changes` | 43306 | 38508 | -199.9167 | 24 | 2 | 22 | 0 |
| `grenades.throws` | 1 | 0 | -0.0417 | 1 | 0 | 1 | 1 |
| `grenades.bursts` | 1 | 0 | -0.0417 | 1 | 0 | 1 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 10 | 7 | -0.125 | 9 | 3 | 6 | 0.5078 |
| `loopAlerts.length` | 41 | 37 | -0.1667 | 15 | 7 | 8 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 54 | 23 | -1.2917 | 16 | 3 | 13 | 0.0213 |
| `stallOutcomes.wakes` | 1 | 0 | -0.0417 | 1 | 0 | 1 | 1 |
| `stallOutcomes.repeats` | 1 | 0 | -0.0417 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 460 | 392 | -2.8333 | 21 | 5 | 16 | 0.0266 |
| `recon.contacts` | 67 | 60 | -0.2917 | 17 | 4 | 13 | 0.049 |
| `recon.noContact` | 240 | 235 | -0.2083 | 17 | 4 | 13 | 0.049 |
| `recon.timeouts` | 16 | 21 | 0.2083 | 5 | 5 | 0 | 0.0625 |
| `recon.cancelled` | 121 | 61 | -2.5 | 22 | 7 | 15 | 0.1338 |
| `recon.reportsDelivered` | 363 | 330 | -1.375 | 20 | 7 | 13 | 0.2632 |
| `recon.retriggerBlocked` | 237 | 253 | 0.6667 | 17 | 9 | 8 | 1 |
| `squadPerformance.meanOverall` | 2075.2999999999997 | 2084.3 | 0.375 | 24 | 14 | 10 | 0.5413 |
| `squadPerformance.p10Overall` | 1895.2999999999995 | 1910.3999999999992 | 0.6292 | 14 | 10 | 4 | 0.1796 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1719.4000000000005 | 1716.3000000000004 | -0.1292 | 23 | 14 | 9 | 0.4049 |
| `squadPerformance.meanMovement` | 2393.4 | 2392.8999999999996 | -0.0208 | 14 | 7 | 7 | 1 |
| `squadPerformance.meanControl` | 2377.2999999999997 | 2378.2000000000003 | 0.0375 | 19 | 10 | 9 | 1 |
| `squadPerformance.meanCohesion` | 2070.3 | 2099.4 | 1.2125 | 24 | 14 | 10 | 0.5413 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0002 83.1 s (timeline) · phase-c-natural-20261012-0003 150 s (timeline) · phase-c-natural-20261012-0001 161.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=929&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-mainline-integration/ai_flow_live.html?bench=929&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=929`); it opens the seed that parts earliest, and the dropdowns choose another.

