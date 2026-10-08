# Benchmark run #392 · 60 seeds from `sqrelay` (meeting), windows `every120`

- **OFF** flags: `squadRelay=0` · **ON** flags: `none`
- claude/squad-relay @ 768c593 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37762208205) · build v29-dev

## Verdict

**WEAK: 272 of 279 pairs changed (median first part 32.1 s); 3 of 34 counters under p 0.05 (about 1.7 by chance); casualties -0.9% (p 0.5117)**

- Under 0.05 only: vacantObjectiveStalls.length 240 to 189 (-21.3%, p 0.021); usKills 3355 to 3046 (-9.2%, p 0.0271); recon.timeouts 216 to 166 (-23.1%, p 0.0334).
- Unpaired records: off 3, on 5 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **279** pairs (unpaired: off 3, on 5) · identical in every field: **7** · runtime errors off 0 / on 0 · wall time on/off x0.997 (gate 1.25)
- the 250 changed records first part at simulated second: min 22.05, p10 23.1, median 32.1, p90 233.1, max 331.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 7613 | 7543 | -0.2509 | 188 | 99 | 89 | 0.5117 |
| `usKills` | 3355 | 3046 | -1.1075 | 185 | 77 | 108 | 0.0271 |
| `geKills` | 4258 | 4497 | 0.8566 | 200 | 113 | 87 | 0.0768 |
| `fire.total` | 18696 | 18083 | -2.1971 | 201 | 97 | 104 | 0.6722 |
| `fire.hits` | 6711 | 6644 | -0.2401 | 190 | 93 | 97 | 0.8278 |
| `retreatSamples` | 83961 | 82960 | -3.5878 | 192 | 100 | 92 | 0.6135 |
| `movementResolver.changes` | 597282 | 592340 | -17.7133 | 233 | 106 | 127 | 0.19 |
| `movementStalls.length` | 39 | 23 | -0.0573 | 8 | 1 | 7 | 0.0703 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 240 | 189 | -0.1828 | 100 | 38 | 62 | 0.021 |
| `loopAlerts.length` | 206 | 183 | -0.0824 | 124 | 57 | 67 | 0.4191 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 590 | 538 | -0.1864 | 124 | 57 | 67 | 0.4191 |
| `stallOutcomes.wakes` | 53 | 69 | 0.0573 | 59 | 36 | 23 | 0.1175 |
| `stallOutcomes.repeats` | 18 | 18 | 0 | 20 | 10 | 10 | 1 |
| `timeline.stalledOnsets` | 45 | 21 | -0.086 | 8 | 1 | 7 | 0.0703 |
| `timeline.stalledSamples` | 1424 | 793 | -2.2616 | 14 | 4 | 10 | 0.1796 |
| `timeline.stalledOnsetsRepeated` | 134 | 79 | -0.1971 | 14 | 3 | 11 | 0.0574 |
| `timeline.stalledSamplesRepeated` | 4003 | 2658 | -4.8208 | 19 | 6 | 13 | 0.1671 |
| `recon.orders` | 6393 | 6476 | 0.2975 | 161 | 87 | 74 | 0.3443 |
| `recon.contacts` | 302 | 294 | -0.0287 | 123 | 51 | 72 | 0.0709 |
| `recon.noContact` | 4264 | 4325 | 0.2186 | 135 | 76 | 59 | 0.1683 |
| `recon.timeouts` | 216 | 166 | -0.1792 | 98 | 38 | 60 | 0.0334 |
| `recon.cancelled` | 1426 | 1496 | 0.2509 | 150 | 87 | 63 | 0.06 |
| `recon.reportsDelivered` | 1655 | 1534 | -0.4337 | 142 | 65 | 77 | 0.356 |
| `recon.retriggerBlocked` | 4986 | 4992 | 0.0215 | 166 | 82 | 84 | 0.9382 |
| `squadPerformance.meanOverall` | 24290.899999999994 | 24309.799999999992 | 0.0677 | 209 | 108 | 101 | 0.6782 |
| `squadPerformance.p10Overall` | 22799.899999999983 | 22868.899999999983 | 0.2473 | 178 | 94 | 84 | 0.5001 |
| `squadPerformance.lowScoreSquads` | 0 | 1 | 0.0036 | 1 | 1 | 0 | 1 |
| `squadPerformance.meanMission` | 20435.2 | 20406.399999999994 | -0.1032 | 200 | 95 | 105 | 0.5246 |
| `squadPerformance.meanMovement` | 27547.000000000015 | 27600.300000000007 | 0.191 | 190 | 101 | 89 | 0.4249 |
| `squadPerformance.meanControl` | 27600.9 | 27611.89999999999 | 0.0394 | 179 | 86 | 93 | 0.6539 |
| `squadPerformance.meanCohesion` | 24543.49999999999 | 24617.699999999983 | 0.2659 | 226 | 116 | 110 | 0.7395 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

sqrelay-0027 22.05 s (timeline) · sqrelay-0054 22.05 s (timeline) · sqrelay-0003 23.1 s (timeline) · sqrelay-0005 23.1 s (timeline) · sqrelay-0008 23.1 s (timeline) · sqrelay-0011 23.1 s (timeline) · sqrelay-0012 23.1 s (timeline) · sqrelay-0017 23.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=392&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=392`); it opens the seed that parts earliest, and the dropdowns choose another.

