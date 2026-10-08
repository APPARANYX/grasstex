# Benchmark run #420 · 60 seeds from `control` (meeting), windows `every120`

- **OFF** flags: `fireLineContact=0` · **ON** flags: `none`
- claude/project-thread-uuv1hd @ 3bd3143 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37778715330) · build v29-dev

## Verdict

**MOVED: 263 of 290 pairs changed (median first part 230.1 s); 8 of 34 counters under p 0.05 (about 1.7 by chance), 4 under 0.0015; casualties +5.1% (p 0.0013)**

- Clears the Bonferroni line (p < 0.0015): movementResolver.changes 633806 to 655442 (+3.4%, p 0); stallOutcomes.wakes 66 to 17 (-74.2%, p 0); recon.retriggerBlocked 5063 to 5203 (+2.8%, p 0.0002); casualties 8042 to 8455 (+5.1%, p 0.0013).
- Under 0.05 only: recon.orders 6605 to 6777 (+2.6%, p 0.0042); geKills 4443 to 4658 (+4.8%, p 0.0061); recon.timeouts 162 to 200 (+23.5%, p 0.0115); stallOutcomes.repeats 28 to 8 (-71.4%, p 0.0309).
- Unpaired records: off 3, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **290** pairs (unpaired: off 3, on 1) · identical in every field: **27** · runtime errors off 0 / on 0 · wall time on/off x0.997 (gate 1.25)
- the 192 changed records first part at simulated second: min 172.05, p10 182.1, median 230.1, p90 298.05, max 351

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 8042 | 8455 | 1.4241 | 173 | 108 | 65 | 0.0013 |
| `usKills` | 3599 | 3797 | 0.6828 | 166 | 90 | 76 | 0.313 |
| `geKills` | 4443 | 4658 | 0.7414 | 164 | 100 | 64 | 0.0061 |
| `fire.total` | 21558 | 21261 | -1.0241 | 178 | 87 | 91 | 0.8222 |
| `fire.hits` | 7326 | 7384 | 0.2 | 174 | 94 | 80 | 0.3244 |
| `retreatSamples` | 92427 | 95404 | 10.2655 | 173 | 97 | 76 | 0.1281 |
| `movementResolver.changes` | 633806 | 655442 | 74.6069 | 192 | 141 | 51 | 0 |
| `movementStalls.length` | 10 | 10 | 0 | 2 | 1 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 285 | 306 | 0.0724 | 99 | 52 | 47 | 0.6879 |
| `loopAlerts.length` | 243 | 236 | -0.0241 | 118 | 63 | 55 | 0.5195 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 507 | 535 | 0.0966 | 107 | 59 | 48 | 0.3337 |
| `stallOutcomes.wakes` | 66 | 17 | -0.169 | 45 | 6 | 39 | 0 |
| `stallOutcomes.repeats` | 28 | 8 | -0.069 | 18 | 4 | 14 | 0.0309 |
| `timeline.stalledOnsets` | 10 | 10 | 0 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamples` | 593 | 546 | -0.1621 | 4 | 2 | 2 | 1 |
| `timeline.stalledOnsetsRepeated` | 30 | 30 | 0 | 5 | 3 | 2 | 1 |
| `timeline.stalledSamplesRepeated` | 1677 | 1435 | -0.8345 | 8 | 5 | 3 | 0.7266 |
| `recon.orders` | 6605 | 6777 | 0.5931 | 134 | 84 | 50 | 0.0042 |
| `recon.contacts` | 303 | 304 | 0.0034 | 88 | 45 | 43 | 0.9152 |
| `recon.noContact` | 4418 | 4465 | 0.1621 | 106 | 61 | 45 | 0.1448 |
| `recon.timeouts` | 162 | 200 | 0.131 | 70 | 46 | 24 | 0.0115 |
| `recon.cancelled` | 1546 | 1583 | 0.1276 | 119 | 64 | 55 | 0.4635 |
| `recon.reportsDelivered` | 1616 | 1618 | 0.0069 | 99 | 53 | 46 | 0.5467 |
| `recon.retriggerBlocked` | 5063 | 5203 | 0.4828 | 124 | 83 | 41 | 0.0002 |
| `squadPerformance.meanOverall` | 25182.099999999984 | 25105.299999999992 | -0.2648 | 175 | 91 | 84 | 0.6503 |
| `squadPerformance.p10Overall` | 23697.49999999998 | 23577.199999999968 | -0.4148 | 134 | 62 | 72 | 0.437 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 20994.699999999986 | 20932.499999999985 | -0.2145 | 175 | 84 | 91 | 0.6503 |
| `squadPerformance.meanMovement` | 28697.199999999993 | 28600.800000000014 | -0.3324 | 168 | 74 | 94 | 0.1425 |
| `squadPerformance.meanControl` | 28691.299999999996 | 28583.400000000012 | -0.3721 | 159 | 77 | 82 | 0.7512 |
| `squadPerformance.meanCohesion` | 25574.59999999999 | 25505.899999999983 | -0.2369 | 172 | 90 | 82 | 0.5936 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0002 172.05 s (timeline) · control-0040 173.1 s (timeline) · control-0029 176.1 s (timeline) · control-0057 176.1 s (timeline) · control-0022 178.05 s (timeline) · control-0019 182.1 s (timeline) · control-0008 186 s (timeline) · control-0059 187.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=420&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=420`); it opens the seed that parts earliest, and the dropdowns choose another.

