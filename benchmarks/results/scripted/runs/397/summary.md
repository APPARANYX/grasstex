# Benchmark run #397 · 60 seeds from `sqrelay` (ge-defend), windows `every120`

- **OFF** flags: `squadRelay=0` · **ON** flags: `none`
- claude/bench-relay-stack @ 73bc172 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37764532373) · build v29-dev

## Verdict

**MOVED: 269 of 275 pairs changed (median first part 69 s); 4 of 34 counters under p 0.05 (about 1.7 by chance), 3 under 0.0015; casualties +1.9% (p 0.2661)**

- Clears the Bonferroni line (p < 0.0015): recon.noContact 3922 to 4160 (+6.1%, p 0); squadPerformance.meanCohesion 23180.599999999984 to 23542.60000000001 (+1.6%, p 0); regroups.entries 354 to 259 (-26.8%, p 0.0001).
- Under 0.05 only: recon.orders 12056 to 12254 (+1.6%, p 0.0054).
- Unpaired records: off 0, on 1 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **275** pairs (unpaired: off 0, on 1) · identical in every field: **6** · runtime errors off 0 / on 0 · wall time on/off x0.987 (gate 1.25)
- the 254 changed records first part at simulated second: min 22.05, p10 23.1, median 69, p90 189, max 380.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 6751 | 6879 | 0.4655 | 207 | 112 | 95 | 0.2661 |
| `usKills` | 3175 | 3245 | 0.2545 | 193 | 103 | 90 | 0.3878 |
| `geKills` | 3576 | 3634 | 0.2109 | 202 | 103 | 99 | 0.8329 |
| `fire.total` | 16522 | 17421 | 3.2691 | 217 | 111 | 106 | 0.7861 |
| `fire.hits` | 5563 | 5893 | 1.2 | 208 | 113 | 95 | 0.2384 |
| `retreatSamples` | 91761 | 92130 | 1.3418 | 204 | 100 | 104 | 0.8337 |
| `movementResolver.changes` | 476444 | 478056 | 5.8618 | 244 | 119 | 125 | 0.749 |
| `movementStalls.length` | 2 | 4 | 0.0073 | 3 | 1 | 2 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 36 | 39 | 0.0109 | 47 | 23 | 24 | 1 |
| `loopAlerts.length` | 186 | 212 | 0.0945 | 126 | 74 | 52 | 0.0609 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 354 | 259 | -0.3455 | 122 | 39 | 83 | 0.0001 |
| `stallOutcomes.wakes` | 13 | 12 | -0.0036 | 11 | 5 | 6 | 1 |
| `stallOutcomes.repeats` | 3 | 1 | -0.0073 | 4 | 1 | 3 | 0.625 |
| `timeline.stalledOnsets` | 1 | 4 | 0.0109 | 2 | 1 | 1 | 1 |
| `timeline.stalledSamples` | 11 | 17 | 0.0218 | 3 | 1 | 2 | 1 |
| `timeline.stalledOnsetsRepeated` | 4 | 16 | 0.0436 | 8 | 4 | 4 | 1 |
| `timeline.stalledSamplesRepeated` | 42 | 68 | 0.0945 | 8 | 4 | 4 | 1 |
| `recon.orders` | 12056 | 12254 | 0.72 | 218 | 130 | 88 | 0.0054 |
| `recon.contacts` | 1054 | 1052 | -0.0073 | 178 | 94 | 84 | 0.5001 |
| `recon.noContact` | 3922 | 4160 | 0.8655 | 147 | 99 | 48 | 0 |
| `recon.timeouts` | 4269 | 4170 | -0.36 | 194 | 98 | 96 | 0.9428 |
| `recon.cancelled` | 2373 | 2433 | 0.2182 | 190 | 96 | 94 | 0.9422 |
| `recon.reportsDelivered` | 5046 | 4897 | -0.5418 | 197 | 103 | 94 | 0.5688 |
| `recon.retriggerBlocked` | 4752 | 4804 | 0.1891 | 188 | 98 | 90 | 0.6098 |
| `squadPerformance.meanOverall` | 24258.40000000001 | 24288.7 | 0.1102 | 239 | 133 | 106 | 0.0924 |
| `squadPerformance.p10Overall` | 22583.899999999976 | 22571.099999999966 | -0.0465 | 187 | 96 | 91 | 0.77 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21407.3 | 21387.79999999999 | -0.0709 | 206 | 105 | 101 | 0.8345 |
| `squadPerformance.meanMovement` | 27359.800000000003 | 27335.40000000001 | -0.0887 | 174 | 76 | 98 | 0.1111 |
| `squadPerformance.meanControl` | 27355.50000000001 | 27343.299999999977 | -0.0444 | 178 | 84 | 94 | 0.5001 |
| `squadPerformance.meanCohesion` | 23180.599999999984 | 23542.60000000001 | 1.3164 | 240 | 152 | 88 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

sqrelay-0003 22.05 s (timeline) · sqrelay-0054 22.05 s (timeline) · sqrelay-0005 23.1 s (timeline) · sqrelay-0007 23.1 s (timeline) · sqrelay-0008 23.1 s (timeline) · sqrelay-0011 23.1 s (timeline) · sqrelay-0029 23.1 s (timeline) · sqrelay-0041 23.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=397&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=397`); it opens the seed that parts earliest, and the dropdowns choose another.

