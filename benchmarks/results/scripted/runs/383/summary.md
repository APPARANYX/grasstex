# Benchmark run #383 · 60 seeds from `hill` (ge-defend), windows `every120`

- **OFF** flags: `fireLineContact=0&unreachableAnchor=0` · **ON** flags: `none`
- claude/bench-363-368 @ 0277c68 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37735989485) · build v29-dev

## Verdict

**MOVED: 257 of 275 pairs changed (median first part 168 s); 14 of 34 counters under p 0.05 (about 1.7 by chance), 10 under 0.0015; casualties +22.7% (p 0)**

- Clears the Bonferroni line (p < 0.0015): casualties 5502 to 6753 (+22.7%, p 0); geKills 2821 to 3899 (+38.2%, p 0); fire.total 13044 to 16679 (+27.9%, p 0); fire.hits 4534 to 5674 (+25.1%, p 0); retreatSamples 79525 to 91373 (+14.9%, p 0); movementResolver.changes 408275 to 465701 (+14.1%, p 0); stallOutcomes.wakes 144 to 27 (-81.3%, p 0); stallOutcomes.repeats 38 to 3 (-92.1%, p 0); recon.cancelled 1669 to 1941 (+16.3%, p 0); recon.orders 11607 to 12233 (+5.4%, p 0.0001).
- Under 0.05 only: squadPerformance.meanControl 27353.8 to 27369.6 (+0.1%, p 0.0095); timeline.stalledOnsetsRepeated 30 to 46 (+53.3%, p 0.0313); timeline.stalledSamplesRepeated 6909 to 7107 (+2.9%, p 0.0313); squadPerformance.meanMission 21593.99999999998 to 21341.99999999998 (-1.2%, p 0.04).

## Paired comparison (off against on)

- **275** pairs (unpaired: off 0, on 0) · identical in every field: **18** · runtime errors off 0 / on 0 · wall time on/off x0.995 (gate 1.25)
- the 215 changed records first part at simulated second: min 55.05, p10 119.1, median 168, p90 220.05, max 560.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5502 | 6753 | 4.5491 | 195 | 148 | 47 | 0 |
| `usKills` | 2681 | 2854 | 0.6291 | 188 | 106 | 82 | 0.0932 |
| `geKills` | 2821 | 3899 | 3.92 | 195 | 150 | 45 | 0 |
| `fire.total` | 13044 | 16679 | 13.2182 | 201 | 140 | 61 | 0 |
| `fire.hits` | 4534 | 5674 | 4.1455 | 196 | 135 | 61 | 0 |
| `retreatSamples` | 79525 | 91373 | 43.0836 | 194 | 131 | 63 | 0 |
| `movementResolver.changes` | 408275 | 465701 | 208.8218 | 214 | 188 | 26 | 0 |
| `movementStalls.length` | 10 | 18 | 0.0291 | 3 | 3 | 0 | 0.25 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 25 | 33 | 0.0291 | 38 | 21 | 17 | 0.6271 |
| `loopAlerts.length` | 137 | 172 | 0.1273 | 110 | 60 | 50 | 0.3909 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 499 | 499 | 0 | 114 | 63 | 51 | 0.3029 |
| `stallOutcomes.wakes` | 144 | 27 | -0.4255 | 80 | 5 | 75 | 0 |
| `stallOutcomes.repeats` | 38 | 3 | -0.1273 | 27 | 0 | 27 | 0 |
| `timeline.stalledOnsets` | 10 | 23 | 0.0473 | 3 | 3 | 0 | 0.25 |
| `timeline.stalledSamples` | 3263 | 3446 | 0.6655 | 3 | 3 | 0 | 0.25 |
| `timeline.stalledOnsetsRepeated` | 30 | 46 | 0.0582 | 6 | 6 | 0 | 0.0313 |
| `timeline.stalledSamplesRepeated` | 6909 | 7107 | 0.72 | 6 | 6 | 0 | 0.0313 |
| `recon.orders` | 11607 | 12233 | 2.2764 | 172 | 112 | 60 | 0.0001 |
| `recon.contacts` | 911 | 1000 | 0.3236 | 157 | 85 | 72 | 0.3382 |
| `recon.noContact` | 4678 | 4821 | 0.52 | 113 | 64 | 49 | 0.1876 |
| `recon.timeouts` | 3964 | 4045 | 0.2945 | 159 | 77 | 82 | 0.7512 |
| `recon.cancelled` | 1669 | 1941 | 0.9891 | 185 | 125 | 60 | 0 |
| `recon.reportsDelivered` | 4531 | 4940 | 1.4873 | 177 | 97 | 80 | 0.229 |
| `recon.retriggerBlocked` | 4927 | 5076 | 0.5418 | 156 | 90 | 66 | 0.0652 |
| `squadPerformance.meanOverall` | 24297.40000000001 | 24239.099999999973 | -0.212 | 203 | 95 | 108 | 0.3997 |
| `squadPerformance.p10Overall` | 22643.399999999983 | 22516.79999999998 | -0.4604 | 164 | 72 | 92 | 0.1377 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21593.99999999998 | 21341.99999999998 | -0.9164 | 200 | 85 | 115 | 0.04 |
| `squadPerformance.meanMovement` | 27343.899999999998 | 27305.800000000014 | -0.1385 | 173 | 76 | 97 | 0.1281 |
| `squadPerformance.meanControl` | 27353.8 | 27369.6 | 0.0575 | 173 | 104 | 69 | 0.0095 |
| `squadPerformance.meanCohesion` | 23240.9 | 23272.399999999998 | 0.1145 | 206 | 108 | 98 | 0.5307 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

hill-0029 55.05 s (timeline) · hill-0043 94.05 s (timeline) · hill-0031 106.05 s (timeline) · hill-0013 107.1 s (timeline) · hill-0024 119.1 s (timeline) · hill-0045 123 s (timeline) · hill-0019 128.1 s (timeline) · hill-0010 130.05 s (stress)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=383&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=383`); it opens the seed that parts earliest, and the dropdowns choose another.

