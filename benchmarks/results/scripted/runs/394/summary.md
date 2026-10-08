# Benchmark run #394 · 60 seeds from `sqrelay` (ge-defend), windows `every120`

- **OFF** flags: `squadRelay=0` · **ON** flags: `none`
- claude/squad-relay @ 768c593 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37762216338) · build v29-dev

## Verdict

**MOVED: 267 of 275 pairs changed (median first part 70.05 s); 9 of 34 counters under p 0.05 (about 1.7 by chance), 2 under 0.0015; casualties +2.7% (p 0.4763)**

- Clears the Bonferroni line (p < 0.0015): squadPerformance.meanCohesion 23174.499999999985 to 23586.00000000001 (+1.8%, p 0); squadPerformance.meanOverall 24286.69999999999 to 24350.100000000002 (+0.3%, p 0.001).
- Under 0.05 only: movementResolver.changes 421291 to 422503 (+0.3%, p 0.0054); recon.noContact 3965 to 4092 (+3.2%, p 0.0064); recon.orders 11388 to 11577 (+1.7%, p 0.0101); retreatSamples 86031 to 81650 (-5.1%, p 0.0266); recon.timeouts 4178 to 4060 (-2.8%, p 0.0314); stallOutcomes.repeats 12 to 2 (-83.3%, p 0.0386); geKills 2955 to 3091 (+4.6%, p 0.0447).
- Unpaired records: off 1, on 0 (a seed or checkpoint only one arm reached: the flag changed how long the battle lasted, or a shard failed).

## Paired comparison (off against on)

- **275** pairs (unpaired: off 1, on 0) · identical in every field: **8** · runtime errors off 0 / on 0 · wall time on/off x0.977 (gate 1.25)
- the 248 changed records first part at simulated second: min 22.05, p10 23.1, median 70.05, p90 153, max 564

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 5802 | 5961 | 0.5782 | 197 | 104 | 93 | 0.4763 |
| `usKills` | 2847 | 2870 | 0.0836 | 186 | 92 | 94 | 0.9416 |
| `geKills` | 2955 | 3091 | 0.4945 | 195 | 112 | 83 | 0.0447 |
| `fire.total` | 13529 | 14718 | 4.3236 | 214 | 113 | 101 | 0.4522 |
| `fire.hits` | 4818 | 5087 | 0.9782 | 207 | 106 | 101 | 0.7811 |
| `retreatSamples` | 86031 | 81650 | -15.9309 | 196 | 82 | 114 | 0.0266 |
| `movementResolver.changes` | 421291 | 422503 | 4.4073 | 240 | 142 | 98 | 0.0054 |
| `movementStalls.length` | 3 | 4 | 0.0036 | 3 | 1 | 2 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 36 | 36 | 0 | 39 | 18 | 21 | 0.7493 |
| `loopAlerts.length` | 161 | 188 | 0.0982 | 101 | 59 | 42 | 0.1109 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 313 | 235 | -0.2836 | 121 | 51 | 70 | 0.1014 |
| `stallOutcomes.wakes` | 67 | 52 | -0.0545 | 57 | 25 | 32 | 0.427 |
| `stallOutcomes.repeats` | 12 | 2 | -0.0364 | 12 | 2 | 10 | 0.0386 |
| `timeline.stalledOnsets` | 3 | 4 | 0.0036 | 3 | 1 | 2 | 1 |
| `timeline.stalledSamples` | 18 | 17 | -0.0036 | 4 | 1 | 3 | 0.625 |
| `timeline.stalledOnsetsRepeated` | 10 | 16 | 0.0218 | 8 | 4 | 4 | 1 |
| `timeline.stalledSamplesRepeated` | 63 | 68 | 0.0182 | 8 | 4 | 4 | 1 |
| `recon.orders` | 11388 | 11577 | 0.6873 | 219 | 129 | 90 | 0.0101 |
| `recon.contacts` | 833 | 916 | 0.3018 | 176 | 95 | 81 | 0.3271 |
| `recon.noContact` | 3965 | 4092 | 0.4618 | 166 | 101 | 65 | 0.0064 |
| `recon.timeouts` | 4178 | 4060 | -0.4291 | 195 | 82 | 113 | 0.0314 |
| `recon.cancelled` | 2055 | 2137 | 0.2982 | 189 | 98 | 91 | 0.6626 |
| `recon.reportsDelivered` | 4127 | 4573 | 1.6218 | 191 | 105 | 86 | 0.1926 |
| `recon.retriggerBlocked` | 4646 | 4578 | -0.2473 | 184 | 83 | 101 | 0.21 |
| `squadPerformance.meanOverall` | 24286.69999999999 | 24350.100000000002 | 0.2305 | 231 | 141 | 90 | 0.001 |
| `squadPerformance.p10Overall` | 22650.599999999973 | 22627.899999999983 | -0.0825 | 184 | 97 | 87 | 0.5071 |
| `squadPerformance.lowScoreSquads` | 1 | 0 | -0.0036 | 1 | 0 | 1 | 1 |
| `squadPerformance.meanMission` | 21484.79999999998 | 21563.09999999999 | 0.2847 | 198 | 112 | 86 | 0.0754 |
| `squadPerformance.meanMovement` | 27353 | 27320.09999999998 | -0.1196 | 164 | 79 | 85 | 0.6963 |
| `squadPerformance.meanControl` | 27358.500000000007 | 27349.499999999996 | -0.0327 | 170 | 76 | 94 | 0.1921 |
| `squadPerformance.meanCohesion` | 23174.499999999985 | 23586.00000000001 | 1.4964 | 235 | 149 | 86 | 0 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

sqrelay-0003 22.05 s (timeline) · sqrelay-0054 22.05 s (timeline) · sqrelay-0005 23.1 s (timeline) · sqrelay-0007 23.1 s (timeline) · sqrelay-0008 23.1 s (timeline) · sqrelay-0011 23.1 s (timeline) · sqrelay-0029 23.1 s (timeline) · sqrelay-0041 23.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=394&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=394`); it opens the seed that parts earliest, and the dropdowns choose another.

