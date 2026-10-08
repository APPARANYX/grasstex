# Benchmark run #435 · 60 seeds from `exfresh` (ge-defend), windows `contact+300`

- **OFF** flags: `executionReport=0` · **ON** flags: `none`
- claude/project-thread-d6qmpr @ 281eecf · [run](https://github.com/APPARANYX/grasstex/actions/runs/37786005765) · build v29-dev

## Verdict

**QUIET: 3 of 53 pairs changed (median first part 42 s); 0 of 34 counters under p 0.05 (about 1.7 by chance); casualties -0.2% (p 1)**

- No counter has a sign test under 0.05: no detectable effect on these counters at this many seeds.

## Paired comparison (off against on)

- **53** pairs (unpaired: off 0, on 0) · identical in every field: **50** · runtime errors off 0 / on 0 · wall time on/off x0.993 (gate 1.25)
- the 1 changed records first part at simulated second: min 42, p10 42, median 42, p90 42, max 42

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1545 | 1542 | -0.0566 | 1 | 0 | 1 | 1 |
| `usKills` | 819 | 815 | -0.0755 | 1 | 0 | 1 | 1 |
| `geKills` | 726 | 727 | 0.0189 | 1 | 1 | 0 | 1 |
| `fire.total` | 10810 | 10787 | -0.434 | 1 | 0 | 1 | 1 |
| `fire.hits` | 3837 | 3826 | -0.2075 | 1 | 0 | 1 | 1 |
| `retreatSamples` | 29394 | 29427 | 0.6226 | 1 | 1 | 0 | 1 |
| `movementResolver.changes` | 98664 | 98584 | -1.5094 | 1 | 0 | 1 | 1 |
| `movementStalls.length` | 4 | 3 | -0.0189 | 1 | 0 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 9 | 9 | 0 | 0 | 0 | 0 | 1 |
| `loopAlerts.length` | 77 | 77 | 0 | 0 | 0 | 0 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 73 | 75 | 0.0377 | 1 | 1 | 0 | 1 |
| `stallOutcomes.wakes` | 22 | 22 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 5 | 4 | -0.0189 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamples` | 523 | 521 | -0.0377 | 1 | 0 | 1 | 1 |
| `timeline.stalledOnsetsRepeated` | 5 | 4 | -0.0189 | 1 | 0 | 1 | 1 |
| `timeline.stalledSamplesRepeated` | 523 | 521 | -0.0377 | 1 | 0 | 1 | 1 |
| `recon.orders` | 2490 | 2483 | -0.1321 | 1 | 0 | 1 | 1 |
| `recon.contacts` | 208 | 207 | -0.0189 | 1 | 0 | 1 | 1 |
| `recon.noContact` | 771 | 770 | -0.0189 | 1 | 0 | 1 | 1 |
| `recon.timeouts` | 927 | 923 | -0.0755 | 1 | 0 | 1 | 1 |
| `recon.cancelled` | 514 | 514 | 0 | 0 | 0 | 0 | 1 |
| `recon.reportsDelivered` | 930 | 924 | -0.1132 | 1 | 0 | 1 | 1 |
| `recon.retriggerBlocked` | 963 | 963 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanOverall` | 4497.7 | 4498.799999999999 | 0.0208 | 1 | 1 | 0 | 1 |
| `squadPerformance.p10Overall` | 4053.5000000000005 | 4054.3000000000006 | 0.0151 | 1 | 1 | 0 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 3867.999999999999 | 3865.599999999999 | -0.0453 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanMovement` | 5278.100000000001 | 5279.200000000002 | 0.0208 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanControl` | 5211.400000000001 | 5211.500000000001 | 0.0019 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanCohesion` | 4537.800000000001 | 4543.200000000001 | 0.1019 | 1 | 1 | 0 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 1 seed that part earliest (simulated seconds)

exfresh-0058 42 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=435&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=435`); it opens the seed that parts earliest, and the dropdowns choose another.

