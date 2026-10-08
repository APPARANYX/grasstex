# Benchmark run #396 · 60 seeds from `sqrelay` (us-defend), windows `every120`

- **OFF** flags: `squadRelay=0` · **ON** flags: `none`
- claude/bench-relay-stack @ 73bc172 · [run](https://github.com/APPARANYX/grasstex/actions/runs/37764528837) · build v29-dev

## Verdict

**MOVED: 270 of 275 pairs changed (median first part 89.1 s); 12 of 34 counters under p 0.05 (about 1.7 by chance), 5 under 0.0015; casualties -0.7% (p 0.9413)**

- Clears the Bonferroni line (p < 0.0015): recon.orders 13568 to 14107 (+4.0%, p 0); recon.noContact 5478 to 5875 (+7.2%, p 0); recon.cancelled 2044 to 2309 (+13.0%, p 0.0001); squadPerformance.meanOverall 24247.600000000017 to 24324.40000000001 (+0.3%, p 0.0009); stallOutcomes.wakes 27 to 7 (-74.1%, p 0.0014).
- Under 0.05 only: movementResolver.changes 495957 to 504886 (+1.8%, p 0.0039); recon.retriggerBlocked 5271 to 5487 (+4.1%, p 0.0044); squadPerformance.meanMission 21535.300000000007 to 21823.699999999968 (+1.3%, p 0.0054); recon.timeouts 4533 to 4366 (-3.7%, p 0.0085); recon.reportsDelivered 4781 to 4430 (-7.3%, p 0.019); retreatSamples 88936 to 83827 (-5.7%, p 0.0361); squadPerformance.meanMovement 27355.099999999995 to 27343.800000000003 (-0.0%, p 0.0389).

## Paired comparison (off against on)

- **275** pairs (unpaired: off 0, on 0) · identical in every field: **5** · runtime errors off 0 / on 0 · wall time on/off x0.978 (gate 1.25)
- the 240 changed records first part at simulated second: min 22.05, p10 23.1, median 89.1, p90 201, max 370.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 6702 | 6657 | -0.1636 | 184 | 91 | 93 | 0.9413 |
| `usKills` | 3090 | 2959 | -0.4764 | 181 | 80 | 101 | 0.1369 |
| `geKills` | 3612 | 3698 | 0.3127 | 185 | 94 | 91 | 0.8831 |
| `fire.total` | 16195 | 16162 | -0.12 | 202 | 99 | 103 | 0.8329 |
| `fire.hits` | 5699 | 5652 | -0.1709 | 190 | 98 | 92 | 0.7169 |
| `retreatSamples` | 88936 | 83827 | -18.5782 | 192 | 81 | 111 | 0.0361 |
| `movementResolver.changes` | 495957 | 504886 | 32.4691 | 233 | 139 | 94 | 0.0039 |
| `movementStalls.length` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 56 | 61 | 0.0182 | 61 | 32 | 29 | 0.7982 |
| `loopAlerts.length` | 204 | 158 | -0.1673 | 119 | 52 | 67 | 0.1992 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 442 | 400 | -0.1527 | 118 | 50 | 68 | 0.1172 |
| `stallOutcomes.wakes` | 27 | 7 | -0.0727 | 30 | 6 | 24 | 0.0014 |
| `stallOutcomes.repeats` | 3 | 2 | -0.0036 | 5 | 2 | 3 | 1 |
| `timeline.stalledOnsets` | 4 | 4 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 694 | 694 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 12 | 12 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 1700 | 1700 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 13568 | 14107 | 1.96 | 203 | 136 | 67 | 0 |
| `recon.contacts` | 1035 | 1051 | 0.0582 | 168 | 87 | 81 | 0.6998 |
| `recon.noContact` | 5478 | 5875 | 1.4436 | 167 | 120 | 47 | 0 |
| `recon.timeouts` | 4533 | 4366 | -0.6073 | 178 | 71 | 107 | 0.0085 |
| `recon.cancelled` | 2044 | 2309 | 0.9636 | 181 | 117 | 64 | 0.0001 |
| `recon.reportsDelivered` | 4781 | 4430 | -1.2764 | 187 | 77 | 110 | 0.019 |
| `recon.retriggerBlocked` | 5271 | 5487 | 0.7855 | 179 | 109 | 70 | 0.0044 |
| `squadPerformance.meanOverall` | 24247.600000000017 | 24324.40000000001 | 0.2793 | 220 | 135 | 85 | 0.0009 |
| `squadPerformance.p10Overall` | 22590.69999999997 | 22669.599999999988 | 0.2869 | 174 | 90 | 84 | 0.7048 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 21535.300000000007 | 21823.699999999968 | 1.0487 | 198 | 119 | 79 | 0.0054 |
| `squadPerformance.meanMovement` | 27355.099999999995 | 27343.800000000003 | -0.0411 | 159 | 66 | 93 | 0.0389 |
| `squadPerformance.meanControl` | 27331.199999999993 | 27356.299999999985 | 0.0913 | 167 | 91 | 76 | 0.2786 |
| `squadPerformance.meanCohesion` | 22912.099999999988 | 22818.999999999996 | -0.3385 | 228 | 116 | 112 | 0.8426 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

sqrelay-0012 22.05 s (timeline) · sqrelay-0017 22.05 s (timeline) · sqrelay-0041 22.05 s (timeline) · sqrelay-0023 23.1 s (timeline) · sqrelay-0027 23.1 s (timeline) · sqrelay-0044 23.1 s (timeline) · sqrelay-0045 23.1 s (timeline) · sqrelay-0054 23.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=396&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=396`); it opens the seed that parts earliest, and the dropdowns choose another.

