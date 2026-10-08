# Benchmark run #373 · 60 seeds from `hill` (ge-defend), windows `every120`

- **OFF** flags: `fireLineContact=0` · **ON** flags: `none`
- claude/project-thread-uuv1hd @ 0166b50 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37715883520) · build v29-dev

## Verdict

**MOVED: 257 of 275 pairs changed (median first part 168 s); 13 of 32 counters under p 0.05 (about 1.6 by chance), 10 under 0.0016; casualties +20.4% (p 0)**

- Clears the Bonferroni line (p < 0.0016): casualties 5502 to 6626 (+20.4%, p 0); geKills 2821 to 3778 (+33.9%, p 0); fire.total 13044 to 16655 (+27.7%, p 0); fire.hits 4534 to 5607 (+23.7%, p 0); retreatSamples 79525 to 89873 (+13.0%, p 0); movementResolver.changes 408275 to 469520 (+15.0%, p 0); stallOutcomes.wakes 144 to 27 (-81.3%, p 0); stallOutcomes.repeats 38 to 3 (-92.1%, p 0); recon.cancelled 1669 to 1942 (+16.4%, p 0); recon.orders 11607 to 12252 (+5.6%, p 0.0002).
- Under 0.05 only: squadPerformance.meanControl 27353.8 to 27368.099999999995 (+0.1%, p 0.0074); timeline.stalledOnsets 30 to 47 (+56.7%, p 0.0313); timeline.stalledSamples 6909 to 7054 (+2.1%, p 0.0313).

## Paired comparison (off against on)

- **275** pairs (unpaired: off 0, on 0) · identical in every field: **18** · runtime errors off 0 / on 0 · wall time on/off x0.975 (gate 1.25)
- the 214 changed records first part at simulated second: min 94.05, p10 123, median 168, p90 220.05, max 560.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5502 | 6626 | 4.0873 | 195 | 139 | 56 | 0 |
| `usKills` | 2681 | 2848 | 0.6073 | 186 | 105 | 81 | 0.0914 |
| `geKills` | 2821 | 3778 | 3.48 | 195 | 145 | 50 | 0 |
| `fire.total` | 13044 | 16655 | 13.1309 | 203 | 139 | 64 | 0 |
| `fire.hits` | 4534 | 5607 | 3.9018 | 197 | 132 | 65 | 0 |
| `retreatSamples` | 79525 | 89873 | 37.6291 | 192 | 129 | 63 | 0 |
| `movementResolver.changes` | 408275 | 469520 | 222.7091 | 213 | 190 | 23 | 0 |
| `movementStalls.length` | 10 | 19 | 0.0327 | 3 | 3 | 0 | 0.25 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 25 | 31 | 0.0218 | 36 | 20 | 16 | 0.6177 |
| `loopAlerts.length` | 137 | 164 | 0.0982 | 107 | 58 | 49 | 0.4394 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 499 | 511 | 0.0436 | 119 | 66 | 53 | 0.2712 |
| `stallOutcomes.wakes` | 144 | 27 | -0.4255 | 80 | 5 | 75 | 0 |
| `stallOutcomes.repeats` | 38 | 3 | -0.1273 | 27 | 0 | 27 | 0 |
| `timeline.stalledOnsets` | 30 | 47 | 0.0618 | 6 | 6 | 0 | 0.0313 |
| `timeline.stalledSamples` | 6909 | 7054 | 0.5273 | 6 | 6 | 0 | 0.0313 |
| `recon.orders` | 11607 | 12252 | 2.3455 | 171 | 110 | 61 | 0.0002 |
| `recon.contacts` | 911 | 1007 | 0.3491 | 158 | 89 | 69 | 0.1304 |
| `recon.noContact` | 4678 | 4760 | 0.2982 | 115 | 62 | 53 | 0.4558 |
| `recon.timeouts` | 3964 | 4106 | 0.5164 | 157 | 80 | 77 | 0.8732 |
| `recon.cancelled` | 1669 | 1942 | 0.9927 | 183 | 125 | 58 | 0 |
| `recon.reportsDelivered` | 4531 | 4957 | 1.5491 | 177 | 102 | 75 | 0.0504 |
| `recon.retriggerBlocked` | 4927 | 5036 | 0.3964 | 158 | 89 | 69 | 0.1304 |
| `squadPerformance.meanOverall` | 24297.40000000001 | 24241.499999999978 | -0.2033 | 200 | 91 | 109 | 0.2292 |
| `squadPerformance.p10Overall` | 22643.399999999983 | 22523.99999999997 | -0.4342 | 165 | 72 | 93 | 0.1192 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21593.99999999998 | 21386.799999999977 | -0.7535 | 199 | 86 | 113 | 0.065 |
| `squadPerformance.meanMovement` | 27343.899999999998 | 27306.000000000015 | -0.1378 | 177 | 78 | 99 | 0.1325 |
| `squadPerformance.meanControl` | 27353.8 | 27368.099999999995 | 0.052 | 172 | 104 | 68 | 0.0074 |
| `squadPerformance.meanCohesion` | 23240.9 | 23211.799999999992 | -0.1058 | 205 | 99 | 106 | 0.6753 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hill-0043 94.05 s (timeline) · hill-0031 106.05 s (timeline) · hill-0013 107.1 s (timeline) · hill-0024 119.1 s (timeline) · hill-0045 123 s (timeline) · hill-0019 128.1 s (timeline) · hill-0040 131.1 s (timeline) · hill-0046 136.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=373&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=373`); it opens the seed that parts earliest, and the dropdowns choose another.

