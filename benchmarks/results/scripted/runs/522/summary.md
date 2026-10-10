# Benchmark run #522 · 20 seeds from `issue361-nav-meeting` (meeting), windows `every60`

- **OFF** flags: `steerNavForward=0` · **ON** flags: `none`
- work/issue361-ge4-rootcause @ 31c727b · [run](https://github.com/APPARANYX/grasstex/actions/runs/38022638202) · build v29-dev

## Verdict

**MOVED: 174 of 174 pairs changed (median first part 57 s); 7 of 42 counters under p 0.05 (about 2.1 by chance), 3 under 0.0012; casualties -0.4% (p 1)**

- Clears the Bonferroni line (p < 0.0012): geKills 2765 to 2321 (-16.1%, p 0); recon.timeouts 29 to 1 (-96.6%, p 0); usKills 1967 to 2390 (+21.5%, p 0.0001).
- Under 0.05 only: recon.noContact 2355 to 2400 (+1.9%, p 0.0051); fire.hits 1860 to 1964 (+5.6%, p 0.0054); regroups.entries 350 to 332 (-5.1%, p 0.0169); fire.total 4972 to 5261 (+5.8%, p 0.0323).
- Unpaired records: off 6, on 6 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **174** pairs (unpaired: off 6, on 6) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x0.963 (gate 1.25)
- the 162 changed records first part at simulated second: min 21, p10 24, median 57, p90 93, max 133.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 4732 | 4711 | -0.1207 | 111 | 56 | 55 | 1 |
| `usKills` | 1967 | 2390 | 2.431 | 110 | 76 | 34 | 0.0001 |
| `geKills` | 2765 | 2321 | -2.5517 | 118 | 35 | 83 | 0 |
| `fire.total` | 4972 | 5261 | 1.6609 | 116 | 70 | 46 | 0.0323 |
| `fire.hits` | 1860 | 1964 | 0.5977 | 110 | 70 | 40 | 0.0054 |
| `retreatSamples` | 24018 | 24484 | 2.6782 | 115 | 64 | 51 | 0.2631 |
| `movementResolver.changes` | 344232 | 346890 | 15.2759 | 153 | 81 | 72 | 0.5179 |
| `grenades.throws` | 9 | 12 | 0.0172 | 7 | 5 | 2 | 0.4531 |
| `grenades.bursts` | 9 | 12 | 0.0172 | 4 | 3 | 1 | 0.625 |
| `grenades.wounded` | 9 | 11 | 0.0115 | 4 | 3 | 1 | 0.625 |
| `grenades.casualties` | 3 | 5 | 0.0115 | 3 | 2 | 1 | 1 |
| `grenades.suppressed` | 36 | 24 | -0.069 | 4 | 2 | 2 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 1 | 0 | -0.0057 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 82 | 92 | 0.0575 | 58 | 31 | 27 | 0.694 |
| `loopAlerts.length` | 76 | 80 | 0.023 | 63 | 33 | 30 | 0.8013 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 350 | 332 | -0.1034 | 78 | 28 | 50 | 0.0169 |
| `stallOutcomes.wakes` | 11 | 9 | -0.0115 | 20 | 9 | 11 | 0.8238 |
| `stallOutcomes.repeats` | 3 | 9 | 0.0345 | 12 | 9 | 3 | 0.146 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 3554 | 3478 | -0.4368 | 106 | 46 | 60 | 0.2065 |
| `recon.contacts` | 196 | 159 | -0.2126 | 74 | 30 | 44 | 0.1302 |
| `recon.noContact` | 2355 | 2400 | 0.2586 | 94 | 61 | 33 | 0.0051 |
| `recon.timeouts` | 29 | 1 | -0.1609 | 23 | 1 | 22 | 0 |
| `recon.cancelled` | 835 | 789 | -0.2644 | 97 | 42 | 55 | 0.2229 |
| `recon.reportsDelivered` | 954 | 753 | -1.1552 | 90 | 49 | 41 | 0.4608 |
| `recon.retriggerBlocked` | 2856 | 2789 | -0.3851 | 100 | 42 | 58 | 0.1332 |
| `squadPerformance.meanOverall` | 15420.399999999998 | 15401.700000000006 | -0.1075 | 137 | 65 | 72 | 0.6084 |
| `squadPerformance.p10Overall` | 14564.400000000014 | 14507.60000000001 | -0.3264 | 111 | 53 | 58 | 0.7044 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 13205.100000000011 | 13116.700000000006 | -0.508 | 124 | 58 | 66 | 0.5298 |
| `squadPerformance.meanMovement` | 17244.6 | 17217.400000000005 | -0.1563 | 114 | 58 | 56 | 0.9254 |
| `squadPerformance.meanControl` | 17290.399999999994 | 17293.699999999997 | 0.019 | 111 | 63 | 48 | 0.1837 |
| `squadPerformance.meanCohesion` | 15323.800000000001 | 15449.099999999999 | 0.7201 | 143 | 71 | 72 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

issue361-nav-meeting-0013 21 s (timeline) · issue361-nav-meeting-0011 24 s (timeline) · issue361-nav-meeting-0002 35.1 s (timeline) · issue361-nav-meeting-0010 35.1 s (timeline) · issue361-nav-meeting-0019 38.1 s (timeline) · issue361-nav-meeting-0003 42.15 s (timeline) · issue361-nav-meeting-0015 43.05 s (timeline) · issue361-nav-meeting-0007 52.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=522&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/issue361-ge4-rootcause/ai_flow_live.html?bench=522&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=522`); it opens the seed that parts earliest, and the dropdowns choose another.

