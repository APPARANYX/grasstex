# Benchmark run #523 · 20 seeds from `issue361-nav-us-defend` (us-defend), windows `every60`

- **OFF** flags: `steerNavForward=0` · **ON** flags: `none`
- work/issue361-ge4-rootcause @ 31c727b · [run](https://github.com/APPARANYX/grasstex/actions/runs/38022641162) · build v29-dev

## Verdict

**MOVED: 180 of 180 pairs changed (median first part 46.05 s); 6 of 42 counters under p 0.05 (about 2.1 by chance), 3 under 0.0012; casualties +6.4% (p 0.1949)**

- Clears the Bonferroni line (p < 0.0012): recon.contacts 361 to 275 (-23.8%, p 0); recon.timeouts 200 to 47 (-76.5%, p 0); recon.reportsDelivered 2041 to 1324 (-35.1%, p 0).
- Under 0.05 only: geKills 2799 to 3085 (+10.2%, p 0.0016); regroups.entries 223 to 289 (+29.6%, p 0.0138); squadPerformance.meanCohesion 15701.1 to 15970.300000000005 (+1.7%, p 0.0261).
- Unpaired records: off 1, on 7 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **180** pairs (unpaired: off 1, on 7) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.972 (gate 1.25)
- the 171 changed records first part at simulated second: min 19.05, p10 27, median 46.05, p90 88.05, max 106.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4735 | 5036 | 1.6722 | 134 | 75 | 59 | 0.1949 |
| `usKills` | 1936 | 1951 | 0.0833 | 129 | 65 | 64 | 1 |
| `geKills` | 2799 | 3085 | 1.5889 | 131 | 84 | 47 | 0.0016 |
| `fire.total` | 4093 | 4304 | 1.1722 | 129 | 67 | 62 | 0.7249 |
| `fire.hits` | 1678 | 1715 | 0.2056 | 124 | 59 | 65 | 0.6536 |
| `retreatSamples` | 33068 | 36741 | 20.4056 | 137 | 77 | 60 | 0.1714 |
| `movementResolver.changes` | 261223 | 267884 | 37.0056 | 162 | 88 | 74 | 0.3071 |
| `grenades.throws` | 12 | 8 | -0.0222 | 7 | 5 | 2 | 0.4531 |
| `grenades.bursts` | 12 | 8 | -0.0222 | 8 | 5 | 3 | 0.7266 |
| `grenades.wounded` | 23 | 8 | -0.0833 | 5 | 2 | 3 | 1 |
| `grenades.casualties` | 6 | 6 | 0 | 2 | 1 | 1 | 1 |
| `grenades.suppressed` | 57 | 11 | -0.2556 | 5 | 2 | 3 | 1 |
| `grenades.friendlyWounded` | 1 | 1 | 0 | 2 | 1 | 1 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 0 | -0.0056 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 42 | 52 | 0.0556 | 42 | 24 | 18 | 0.4408 |
| `loopAlerts.length` | 73 | 71 | -0.0111 | 61 | 34 | 27 | 0.4426 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 223 | 289 | 0.3667 | 88 | 56 | 32 | 0.0138 |
| `stallOutcomes.wakes` | 7 | 1 | -0.0333 | 8 | 1 | 7 | 0.0703 |
| `stallOutcomes.repeats` | 0 | 1 | 0.0056 | 1 | 1 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3111 | 3007 | -0.5778 | 132 | 56 | 76 | 0.0978 |
| `recon.contacts` | 361 | 275 | -0.4778 | 100 | 28 | 72 | 0 |
| `recon.noContact` | 1740 | 1811 | 0.3944 | 96 | 57 | 39 | 0.0822 |
| `recon.timeouts` | 200 | 47 | -0.85 | 87 | 5 | 82 | 0 |
| `recon.cancelled` | 662 | 725 | 0.35 | 119 | 68 | 51 | 0.1421 |
| `recon.reportsDelivered` | 2041 | 1324 | -3.9833 | 117 | 31 | 86 | 0 |
| `recon.retriggerBlocked` | 1824 | 1808 | -0.0889 | 104 | 47 | 57 | 0.3776 |
| `squadPerformance.meanOverall` | 16004.900000000005 | 16116.8 | 0.6217 | 155 | 76 | 79 | 0.8724 |
| `squadPerformance.p10Overall` | 14832.100000000019 | 14994.300000000021 | 0.9011 | 94 | 53 | 41 | 0.2564 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 14040.099999999997 | 14069.7 | 0.1644 | 138 | 60 | 78 | 0.1476 |
| `squadPerformance.meanMovement` | 17801.799999999992 | 17924.300000000007 | 0.6806 | 103 | 55 | 48 | 0.5546 |
| `squadPerformance.meanControl` | 17845.600000000002 | 17941.400000000005 | 0.5322 | 100 | 53 | 47 | 0.6173 |
| `squadPerformance.meanCohesion` | 15701.1 | 15970.300000000005 | 1.4956 | 159 | 94 | 65 | 0.0261 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

issue361-nav-us-defend-0019 19.05 s (timeline) · issue361-nav-us-defend-0020 27 s (timeline) · issue361-nav-us-defend-0005 27.15 s (timeline) · issue361-nav-us-defend-0007 30 s (timeline) · issue361-nav-us-defend-0018 30.15 s (timeline) · issue361-nav-us-defend-0013 38.1 s (timeline) · issue361-nav-us-defend-0011 41.1 s (stress) · issue361-nav-us-defend-0004 44.1 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=523&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/issue361-ge4-rootcause/ai_flow_live.html?bench=523&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=523`); it opens the seed that parts earliest, and the dropdowns choose another.

