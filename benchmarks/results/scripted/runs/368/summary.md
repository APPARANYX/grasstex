# Benchmark run #368 · 60 seeds from `hill` (us-defend), windows `every120`

- **OFF** flags: `fireLineContact=0` · **ON** flags: `none`
- claude/project-thread-uuv1hd @ 6352d64 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37711716375) · build v29-dev

## Verdict

**MOVED: 254 of 275 pairs changed (median first part 179.1 s); 12 of 32 counters under p 0.05 (about 1.6 by chance), 9 under 0.0016; casualties +11.4% (p 0)**

- Clears the Bonferroni line (p < 0.0016): casualties 5988 to 6671 (+11.4%, p 0); movementResolver.changes 438012 to 487007 (+11.2%, p 0); stallOutcomes.wakes 81 to 26 (-67.9%, p 0); recon.contacts 742 to 1018 (+37.2%, p 0); recon.cancelled 2116 to 2343 (+10.7%, p 0); recon.orders 11931 to 12371 (+3.7%, p 0.0002); usKills 2410 to 2895 (+20.1%, p 0.0003); recon.reportsDelivered 3232 to 3914 (+21.1%, p 0.0005); retreatSamples 82164 to 92715 (+12.8%, p 0.0006).
- Under 0.05 only: fire.hits 4837 to 5475 (+13.2%, p 0.0025); stallOutcomes.repeats 14 to 1 (-92.9%, p 0.0117); squadPerformance.meanMission 21708.9 to 21512.799999999967 (-0.9%, p 0.0305).
- Unpaired records: off 0, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **275** pairs (unpaired: off 0, on 1) · identical in every field: **21** · runtime errors off 0 / on 0 · wall time on/off x0.985 (gate 1.25)
- the 213 changed records first part at simulated second: min 108, p10 121.05, median 179.1, p90 234, max 342.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5988 | 6671 | 2.4836 | 192 | 130 | 62 | 0 |
| `usKills` | 2410 | 2895 | 1.7636 | 172 | 110 | 62 | 0.0003 |
| `geKills` | 3578 | 3776 | 0.72 | 181 | 101 | 80 | 0.1369 |
| `fire.total` | 13818 | 15622 | 6.56 | 200 | 114 | 86 | 0.056 |
| `fire.hits` | 4837 | 5475 | 2.32 | 195 | 119 | 76 | 0.0025 |
| `retreatSamples` | 82164 | 92715 | 38.3673 | 190 | 119 | 71 | 0.0006 |
| `movementResolver.changes` | 438012 | 487007 | 178.1636 | 212 | 179 | 33 | 0 |
| `movementStalls.length` | 5 | 7 | 0.0073 | 7 | 4 | 3 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 27 | 42 | 0.0545 | 40 | 26 | 14 | 0.0807 |
| `loopAlerts.length` | 185 | 183 | -0.0073 | 113 | 65 | 48 | 0.1319 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 355 | 375 | 0.0727 | 117 | 65 | 52 | 0.2672 |
| `stallOutcomes.wakes` | 81 | 26 | -0.2 | 55 | 11 | 44 | 0 |
| `stallOutcomes.repeats` | 14 | 1 | -0.0473 | 11 | 1 | 10 | 0.0117 |
| `timeline.stalledOnsets` | 10 | 19 | 0.0327 | 8 | 5 | 3 | 0.7266 |
| `timeline.stalledSamples` | 218 | 1699 | 5.3855 | 8 | 5 | 3 | 0.7266 |
| `recon.orders` | 11931 | 12371 | 1.6 | 176 | 113 | 63 | 0.0002 |
| `recon.contacts` | 742 | 1018 | 1.0036 | 158 | 106 | 52 | 0 |
| `recon.noContact` | 4110 | 3938 | -0.6255 | 120 | 54 | 66 | 0.3153 |
| `recon.timeouts` | 4513 | 4592 | 0.2873 | 160 | 89 | 71 | 0.1788 |
| `recon.cancelled` | 2116 | 2343 | 0.8255 | 172 | 114 | 58 | 0 |
| `recon.reportsDelivered` | 3232 | 3914 | 2.48 | 170 | 108 | 62 | 0.0005 |
| `recon.retriggerBlocked` | 4755 | 4793 | 0.1382 | 163 | 90 | 73 | 0.21 |
| `squadPerformance.meanOverall` | 24307.800000000003 | 24255.3 | -0.1909 | 202 | 88 | 114 | 0.0783 |
| `squadPerformance.p10Overall` | 22669.89999999999 | 22607.799999999992 | -0.2258 | 145 | 70 | 75 | 0.7399 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21708.9 | 21512.799999999967 | -0.7131 | 193 | 81 | 112 | 0.0305 |
| `squadPerformance.meanMovement` | 27330.700000000023 | 27345.300000000025 | 0.0531 | 167 | 86 | 81 | 0.757 |
| `squadPerformance.meanControl` | 27341.399999999998 | 27347.6 | 0.0225 | 165 | 89 | 76 | 0.3502 |
| `squadPerformance.meanCohesion` | 23037.80000000002 | 23099.199999999993 | 0.2233 | 200 | 109 | 91 | 0.2292 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hill-0007 108 s (timeline) · hill-0034 114 s (timeline) · hill-0020 118.05 s (timeline) · hill-0022 119.1 s (timeline) · hill-0025 121.05 s (stress) · hill-0044 126 s (timeline) · hill-0030 128.1 s (timeline) · hill-0011 132 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=368&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=368`); it opens the seed that parts earliest, and the dropdowns choose another.

