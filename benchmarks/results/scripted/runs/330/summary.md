# Benchmark run #330 · 100 seeds from `phase-0g3-fireteam-split` (meeting), windows `contact+120`

- **OFF** flags: `fireteamSplit=0` · **ON** flags: `fireteamSplit=1`
- main @ d49e1ff · [run](https://github.com/APPARANYX/grasstex/actions/runs/37298722928) · build v29-dev

## Verdict

**MOVED: 96 of 100 pairs changed (median first part 172.05 s); 2 of 32 counters under p 0.05 (about 1.6 by chance), 1 under 0.0016; casualties -12.4% (p 0.302)**

- Clears the Bonferroni line (p < 0.0016): movementResolver.changes 167391 to 163859 (-2.1%, p 0).
- Under 0.05 only: squadPerformance.meanCohesion 9413.099999999997 to 9416.700000000004 (+0.0%, p 0.0163).

## Paired comparison (off against on)

- **100** pairs (unpaired: off 0, on 0) · identical in every field: **4** · runtime errors off 0 / on 0 · wall time on/off x0.985 (gate 1.25)
- the 87 changed records first part at simulated second: min 105, p10 132, median 172.05, p90 215.1, max 240

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 458 | 401 | -0.57 | 46 | 19 | 27 | 0.302 |
| `usKills` | 179 | 144 | -0.35 | 35 | 15 | 20 | 0.4996 |
| `geKills` | 279 | 257 | -0.22 | 45 | 19 | 26 | 0.3713 |
| `fire.total` | 4941 | 4556 | -3.85 | 56 | 25 | 31 | 0.5044 |
| `fire.hits` | 873 | 765 | -1.08 | 55 | 24 | 31 | 0.4188 |
| `retreatSamples` | 711 | 637 | -0.74 | 31 | 16 | 15 | 1 |
| `movementResolver.changes` | 167391 | 163859 | -35.32 | 87 | 16 | 71 | 0 |
| `movementStalls.length` | 10 | 10 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 1 | 0 | -0.01 | 1 | 0 | 1 | 1 |
| `loopAlerts.length` | 44 | 47 | 0.03 | 22 | 11 | 11 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 33 | 31 | -0.02 | 3 | 1 | 2 | 1 |
| `stallOutcomes.wakes` | 5 | 8 | 0.03 | 2 | 2 | 0 | 0.5 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 199 | 199 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 1341 | 1341 | 0 | 13 | 6 | 7 | 1 |
| `recon.contacts` | 37 | 37 | 0 | 6 | 3 | 3 | 1 |
| `recon.noContact` | 1220 | 1220 | 0 | 4 | 2 | 2 | 1 |
| `recon.timeouts` | 28 | 30 | 0.02 | 2 | 2 | 0 | 0.5 |
| `recon.cancelled` | 37 | 36 | -0.01 | 11 | 5 | 6 | 1 |
| `recon.reportsDelivered` | 241 | 228 | -0.13 | 5 | 2 | 3 | 1 |
| `recon.retriggerBlocked` | 1212 | 1214 | 0.02 | 6 | 4 | 2 | 0.6875 |
| `squadPerformance.meanOverall` | 9001.599999999999 | 8997.600000000006 | -0.04 | 62 | 26 | 36 | 0.2529 |
| `squadPerformance.p10Overall` | 8586.7 | 8618.700000000003 | 0.32 | 48 | 23 | 25 | 0.8854 |
| `squadPerformance.lowScoreSquads` | 0 | 1 | 0.01 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMission` | 8318.499999999996 | 8313.900000000001 | -0.046 | 38 | 17 | 21 | 0.6271 |
| `squadPerformance.meanMovement` | 9935.4 | 9937.199999999997 | 0.018 | 38 | 20 | 18 | 0.8714 |
| `squadPerformance.meanControl` | 9831.700000000003 | 9827.500000000002 | -0.042 | 38 | 16 | 22 | 0.4177 |
| `squadPerformance.meanCohesion` | 9413.099999999997 | 9416.700000000004 | 0.036 | 57 | 38 | 19 | 0.0163 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

phase-0g3-fireteam-split-0010 105 s (timeline) · phase-0g3-fireteam-split-0005 106.05 s (timeline) · phase-0g3-fireteam-split-0099 119.1 s (timeline) · phase-0g3-fireteam-split-0058 121.05 s (timeline) · phase-0g3-fireteam-split-0095 123 s (timeline) · phase-0g3-fireteam-split-0034 126 s (timeline) · phase-0g3-fireteam-split-0086 127.05 s (timeline) · phase-0g3-fireteam-split-0072 128.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=330&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=330`); it opens the seed that parts earliest, and the dropdowns choose another.

