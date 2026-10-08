# Benchmark run #412 · 60 seeds from `egar-gd` (ge-defend), windows `every60`

- **OFF** flags: `engineerGarrison=0` · **ON** flags: `none`
- claude/project-thread-9tosy9-engineer-garrison @ c5d1e1f · [run](https://github.com/APPARANYX/grasstex/actions/runs/37774240454) · build v29-dev

## Verdict

**MOVED: 399 of 519 pairs changed (median first part 262.05 s); 19 of 34 counters under p 0.05 (about 1.7 by chance), 12 under 0.0015; casualties +9.0% (p 0)**

- Clears the Bonferroni line (p < 0.0015): casualties 8717 to 9498 (+9.0%, p 0); usKills 4148 to 4743 (+14.3%, p 0); movementResolver.changes 721600 to 745173 (+3.3%, p 0); recon.orders 21686 to 20192 (-6.9%, p 0); recon.noContact 8225 to 7868 (-4.3%, p 0); recon.timeouts 8281 to 7507 (-9.3%, p 0); recon.cancelled 2855 to 2696 (-5.6%, p 0); recon.retriggerBlocked 9122 to 8671 (-4.9%, p 0); squadPerformance.meanOverall 46381.50000000003 to 46233.19999999998 (-0.3%, p 0); squadPerformance.meanMission 42317.80000000003 to 41821.89999999999 (-1.2%, p 0); recon.reportsDelivered 7791 to 7338 (-5.8%, p 0.0001); recon.contacts 1500 to 1433 (-4.5%, p 0.0008).
- Under 0.05 only: timeline.stalledOnsetsRepeated 26 to 42 (+61.5%, p 0.0034); squadPerformance.meanCohesion 42490.70000000001 to 42863.200000000026 (+0.9%, p 0.005); retreatSamples 60811 to 64012 (+5.3%, p 0.0057); squadPerformance.meanMovement 51550.399999999994 to 51444.30000000004 (-0.2%, p 0.0122); squadPerformance.p10Overall 43330.89999999993 to 43183.89999999989 (-0.3%, p 0.0125); vacantObjectiveStalls.length 21 to 38 (+81.0%, p 0.0161); squadPerformance.meanControl 51760.90000000004 to 51778.20000000002 (+0.0%, p 0.035).

## Paired comparison (off against on)

- **519** pairs (unpaired: off 0, on 0) · identical in every field: **120** · runtime errors off 0 / on 0 · wall time on/off x0.978 (gate 1.25)
- the 240 changed records first part at simulated second: min 163.05, p10 176.1, median 262.05, p90 351, max 506.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 8717 | 9498 | 1.5048 | 205 | 133 | 72 | 0 |
| `usKills` | 4148 | 4743 | 1.1464 | 179 | 126 | 53 | 0 |
| `geKills` | 4569 | 4755 | 0.3584 | 201 | 109 | 92 | 0.259 |
| `fire.total` | 12052 | 13086 | 1.9923 | 199 | 112 | 87 | 0.0886 |
| `fire.hits` | 4156 | 4683 | 1.0154 | 193 | 110 | 83 | 0.061 |
| `retreatSamples` | 60811 | 64012 | 6.1676 | 200 | 120 | 80 | 0.0057 |
| `movementResolver.changes` | 721600 | 745173 | 45.42 | 239 | 167 | 72 | 0 |
| `movementStalls.length` | 4 | 8 | 0.0077 | 5 | 4 | 1 | 0.375 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 21 | 38 | 0.0328 | 30 | 22 | 8 | 0.0161 |
| `loopAlerts.length` | 146 | 109 | -0.0713 | 74 | 33 | 41 | 0.416 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 547 | 599 | 0.1002 | 101 | 56 | 45 | 0.3197 |
| `stallOutcomes.wakes` | 149 | 148 | -0.0019 | 33 | 13 | 20 | 0.2962 |
| `stallOutcomes.repeats` | 29 | 41 | 0.0231 | 12 | 9 | 3 | 0.146 |
| `timeline.stalledOnsets` | 4 | 10 | 0.0116 | 7 | 6 | 1 | 0.125 |
| `timeline.stalledSamples` | 905 | 481 | -0.817 | 9 | 3 | 6 | 0.5078 |
| `timeline.stalledOnsetsRepeated` | 26 | 42 | 0.0308 | 13 | 12 | 1 | 0.0034 |
| `timeline.stalledSamplesRepeated` | 3491 | 2267 | -2.3584 | 14 | 8 | 6 | 0.7905 |
| `recon.orders` | 21686 | 20192 | -2.8786 | 227 | 25 | 202 | 0 |
| `recon.contacts` | 1500 | 1433 | -0.1291 | 166 | 61 | 105 | 0.0008 |
| `recon.noContact` | 8225 | 7868 | -0.6879 | 140 | 25 | 115 | 0 |
| `recon.timeouts` | 8281 | 7507 | -1.4913 | 182 | 18 | 164 | 0 |
| `recon.cancelled` | 2855 | 2696 | -0.3064 | 176 | 51 | 125 | 0 |
| `recon.reportsDelivered` | 7791 | 7338 | -0.8728 | 176 | 62 | 114 | 0.0001 |
| `recon.retriggerBlocked` | 9122 | 8671 | -0.869 | 178 | 47 | 131 | 0 |
| `squadPerformance.meanOverall` | 46381.50000000003 | 46233.19999999998 | -0.2857 | 228 | 83 | 145 | 0 |
| `squadPerformance.p10Overall` | 43330.89999999993 | 43183.89999999989 | -0.2832 | 165 | 66 | 99 | 0.0125 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 42317.80000000003 | 41821.89999999999 | -0.9555 | 233 | 72 | 161 | 0 |
| `squadPerformance.meanMovement` | 51550.399999999994 | 51444.30000000004 | -0.2044 | 185 | 75 | 110 | 0.0122 |
| `squadPerformance.meanControl` | 51760.90000000004 | 51778.20000000002 | 0.0333 | 177 | 103 | 74 | 0.035 |
| `squadPerformance.meanCohesion` | 42490.70000000001 | 42863.200000000026 | 0.7177 | 225 | 134 | 91 | 0.005 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

egar-gd-0052 163.05 s (timeline) · egar-gd-0020 169.05 s (timeline) · egar-gd-0044 176.1 s (timeline) · egar-gd-0048 188.1 s (timeline) · egar-gd-0024 191.1 s (timeline) · egar-gd-0007 195 s (timeline) · egar-gd-0023 197.1 s (timeline) · egar-gd-0015 198 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=412&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=412`); it opens the seed that parts earliest, and the dropdowns choose another.

