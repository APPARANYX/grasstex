# Benchmark run #400 · 60 seeds from `relayfresh` (ge-defend), windows `every120`

- **OFF** flags: `squadRelay=0` · **ON** flags: `none`
- claude/squad-relay @ 768c593 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37766530873) · build v29-dev

## Verdict

**MOVED: 274 of 279 pairs changed (median first part 74.1 s); 9 of 34 counters under p 0.05 (about 1.7 by chance), 3 under 0.0015; casualties +6.5% (p 0.0035)**

- Clears the Bonferroni line (p < 0.0015): recon.orders 11659 to 12132 (+4.1%, p 0); recon.noContact 3926 to 4291 (+9.3%, p 0); movementResolver.changes 418086 to 426559 (+2.0%, p 0.0007).
- Under 0.05 only: usKills 2646 to 2883 (+9.0%, p 0.002); casualties 5483 to 5838 (+6.5%, p 0.0035); squadPerformance.meanCohesion 23593.400000000005 to 23686.2 (+0.4%, p 0.0096); recon.cancelled 2006 to 2182 (+8.8%, p 0.022); geKills 2837 to 2955 (+4.2%, p 0.0382); stallOutcomes.wakes 124 to 123 (-0.8%, p 0.043).
- Unpaired records: off 1, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **279** pairs (unpaired: off 1, on 0) · identical in every field: **5** · runtime errors off 0 / on 0 · wall time on/off x0.949 (gate 1.25)
- the 242 changed records first part at simulated second: min 22.05, p10 23.1, median 74.1, p90 186, max 339.15

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5483 | 5838 | 1.2724 | 189 | 115 | 74 | 0.0035 |
| `usKills` | 2646 | 2883 | 0.8495 | 187 | 115 | 72 | 0.002 |
| `geKills` | 2837 | 2955 | 0.4229 | 183 | 106 | 77 | 0.0382 |
| `fire.total` | 13557 | 15061 | 5.3907 | 200 | 104 | 96 | 0.6207 |
| `fire.hits` | 4611 | 5043 | 1.5484 | 200 | 113 | 87 | 0.0768 |
| `retreatSamples` | 79475 | 80847 | 4.9176 | 192 | 94 | 98 | 0.8287 |
| `movementResolver.changes` | 418086 | 426559 | 30.3692 | 235 | 144 | 91 | 0.0007 |
| `movementStalls.length` | 6 | 1 | -0.0179 | 2 | 1 | 1 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 22 | 22 | 0 | 26 | 14 | 12 | 0.845 |
| `loopAlerts.length` | 168 | 155 | -0.0466 | 97 | 48 | 49 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 286 | 264 | -0.0789 | 109 | 50 | 59 | 0.4437 |
| `stallOutcomes.wakes` | 124 | 123 | -0.0036 | 63 | 23 | 40 | 0.043 |
| `stallOutcomes.repeats` | 25 | 29 | 0.0143 | 18 | 10 | 8 | 0.8145 |
| `timeline.stalledOnsets` | 6 | 1 | -0.0179 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamples` | 1052 | 62 | -3.5484 | 6 | 2 | 4 | 0.6875 |
| `timeline.stalledOnsetsRepeated` | 24 | 4 | -0.0717 | 8 | 4 | 4 | 1 |
| `timeline.stalledSamplesRepeated` | 2324 | 212 | -7.5699 | 8 | 4 | 4 | 1 |
| `recon.orders` | 11659 | 12132 | 1.6953 | 205 | 137 | 68 | 0 |
| `recon.contacts` | 871 | 875 | 0.0143 | 162 | 79 | 83 | 0.8138 |
| `recon.noContact` | 3926 | 4291 | 1.3082 | 160 | 115 | 45 | 0 |
| `recon.timeouts` | 4453 | 4355 | -0.3513 | 189 | 94 | 95 | 1 |
| `recon.cancelled` | 2006 | 2182 | 0.6308 | 184 | 108 | 76 | 0.022 |
| `recon.reportsDelivered` | 4303 | 4289 | -0.0502 | 175 | 93 | 82 | 0.4498 |
| `recon.retriggerBlocked` | 4825 | 4872 | 0.1685 | 179 | 92 | 87 | 0.7651 |
| `squadPerformance.meanOverall` | 24687.3 | 24671.4 | -0.057 | 218 | 110 | 108 | 0.946 |
| `squadPerformance.p10Overall` | 22925.799999999992 | 22999.69999999999 | 0.2649 | 170 | 90 | 80 | 0.4901 |
| `squadPerformance.lowScoreSquads` | 1 | 0 | -0.0036 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanMission` | 21900.19999999997 | 21844.999999999967 | -0.1978 | 189 | 90 | 99 | 0.5607 |
| `squadPerformance.meanMovement` | 27731.099999999995 | 27728.900000000005 | -0.0079 | 165 | 81 | 84 | 0.8763 |
| `squadPerformance.meanControl` | 27758.999999999985 | 27757.599999999995 | -0.005 | 169 | 90 | 79 | 0.4419 |
| `squadPerformance.meanCohesion` | 23593.400000000005 | 23686.2 | 0.3326 | 228 | 134 | 94 | 0.0096 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

relayfresh-0014 22.05 s (timeline) · relayfresh-0004 23.1 s (timeline) · relayfresh-0025 23.1 s (timeline) · relayfresh-0032 23.1 s (timeline) · relayfresh-0033 23.1 s (timeline) · relayfresh-0037 23.1 s (timeline) · relayfresh-0049 23.1 s (timeline) · relayfresh-0050 23.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=400&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=400`); it opens the seed that parts earliest, and the dropdowns choose another.

