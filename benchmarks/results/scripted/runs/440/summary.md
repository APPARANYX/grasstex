# Benchmark run #440 · 60 seeds from `control` (us-defend), windows `every120`

- **OFF** flags: `woundRally=0` · **ON** flags: `none`
- claude/project-thread-kxo7sg @ f8e48cd · [run](https://github.com/APPARANYX/grasstex/actions/runs/37821555662) · build v29-dev

## Verdict

**WEAK: 172 of 276 pairs changed (median first part 280.05 s); 2 of 34 counters under p 0.05 (about 1.7 by chance); casualties -1.2% (p 0.8176)**

- Under 0.05 only: fire.total 14958 to 14352 (-4.1%, p 0.0238); squadPerformance.meanMission 21699.399999999987 to 21729.099999999984 (+0.1%, p 0.0474).

## Paired comparison (off against on)

- **276** pairs (unpaired: off 0, on 0) · identical in every field: **104** · runtime errors off 0 / on 0 · wall time on/off x0.967 (gate 1.25)
- the 92 changed records first part at simulated second: min 201, p10 214.05, median 280.05, p90 384.15, max 555

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 6132 | 6061 | -0.2572 | 75 | 36 | 39 | 0.8176 |
| `usKills` | 2789 | 2751 | -0.1377 | 69 | 30 | 39 | 0.3356 |
| `geKills` | 3343 | 3310 | -0.1196 | 65 | 34 | 31 | 0.8043 |
| `fire.total` | 14958 | 14352 | -2.1957 | 79 | 29 | 50 | 0.0238 |
| `fire.hits` | 4962 | 4786 | -0.6377 | 74 | 30 | 44 | 0.1302 |
| `retreatSamples` | 78689 | 78582 | -0.3877 | 79 | 37 | 42 | 0.653 |
| `movementResolver.changes` | 454624 | 455522 | 3.2536 | 94 | 48 | 46 | 0.9179 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 38 | 35 | -0.0109 | 19 | 9 | 10 | 1 |
| `loopAlerts.length` | 152 | 160 | 0.029 | 33 | 15 | 18 | 0.7283 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 512 | 500 | -0.0435 | 44 | 19 | 25 | 0.4514 |
| `stallOutcomes.wakes` | 90 | 85 | -0.0181 | 13 | 4 | 9 | 0.2668 |
| `stallOutcomes.repeats` | 10 | 8 | -0.0072 | 6 | 2 | 4 | 0.6875 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 11980 | 12097 | 0.4239 | 72 | 42 | 30 | 0.1945 |
| `recon.contacts` | 699 | 705 | 0.0217 | 45 | 22 | 23 | 1 |
| `recon.noContact` | 4837 | 4853 | 0.058 | 44 | 21 | 23 | 0.8804 |
| `recon.timeouts` | 4027 | 4086 | 0.2138 | 50 | 32 | 18 | 0.0649 |
| `recon.cancelled` | 2033 | 2043 | 0.0362 | 61 | 31 | 30 | 1 |
| `recon.reportsDelivered` | 2988 | 3084 | 0.3478 | 51 | 30 | 21 | 0.2624 |
| `recon.retriggerBlocked` | 4925 | 4975 | 0.1812 | 66 | 35 | 31 | 0.7122 |
| `squadPerformance.meanOverall` | 24405 | 24407.500000000004 | 0.0091 | 75 | 42 | 33 | 0.3557 |
| `squadPerformance.p10Overall` | 22689.799999999963 | 22684.999999999967 | -0.0174 | 50 | 25 | 25 | 1 |
| `squadPerformance.lowScoreSquads` | 1 | 1 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21699.399999999987 | 21729.099999999984 | 0.1076 | 74 | 46 | 28 | 0.0474 |
| `squadPerformance.meanMovement` | 27429.300000000017 | 27427.800000000003 | -0.0054 | 63 | 33 | 30 | 0.8013 |
| `squadPerformance.meanControl` | 27445.39999999999 | 27449.1 | 0.0134 | 59 | 31 | 28 | 0.7948 |
| `squadPerformance.meanCohesion` | 23266.39999999999 | 23220.499999999993 | -0.1663 | 80 | 40 | 40 | 1 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

control-0002 201 s (timeline) · control-0048 211.05 s (timeline) · control-0031 214.05 s (stress) · control-0044 218.1 s (timeline) · control-0060 219 s (timeline) · control-0005 244.05 s (timeline) · control-0046 247.05 s (timeline) · control-0015 260.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=440&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=440`); it opens the seed that parts earliest, and the dropdowns choose another.

