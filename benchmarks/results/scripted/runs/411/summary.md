# Benchmark run #411 · 60 seeds from `egar-ud` (us-defend), windows `every60`

- **OFF** flags: `engineerGarrison=0` · **ON** flags: `none`
- claude/project-thread-9tosy9-engineer-garrison @ c5d1e1f · [run](https://github.com/APPARANYX/grasstex/actions/runs/37774237211) · build v29-dev

## Verdict

**MOVED: 394 of 546 pairs changed (median first part 271.05 s); 22 of 34 counters under p 0.05 (about 1.7 by chance), 15 under 0.0015; casualties +7.3% (p 0)**

- Clears the Bonferroni line (p < 0.0015): casualties 10896 to 11689 (+7.3%, p 0); geKills 6391 to 6884 (+7.7%, p 0); fire.total 13414 to 14641 (+9.1%, p 0); fire.hits 4706 to 5261 (+11.8%, p 0); movementResolver.changes 832371 to 846859 (+1.7%, p 0); recon.orders 23210 to 21408 (-7.8%, p 0); recon.contacts 1618 to 1479 (-8.6%, p 0); recon.noContact 8793 to 8259 (-6.1%, p 0); recon.timeouts 7990 to 7469 (-6.5%, p 0); recon.cancelled 3908 to 3463 (-11.4%, p 0); recon.reportsDelivered 7894 to 7044 (-10.8%, p 0); recon.retriggerBlocked 9398 to 8916 (-5.1%, p 0); squadPerformance.meanMission 44152.39999999998 to 43736.29999999998 (-0.9%, p 0); squadPerformance.meanOverall 48761.50000000002 to 48649.60000000001 (-0.2%, p 0.0009); retreatSamples 72867 to 78067 (+7.1%, p 0.0011).
- Under 0.05 only: squadPerformance.meanMovement 54238.60000000002 to 54162.100000000035 (-0.1%, p 0.002); squadPerformance.meanCohesion 45228.50000000003 to 45478.60000000003 (+0.6%, p 0.0025); usKills 4505 to 4805 (+6.7%, p 0.0028); squadPerformance.meanControl 54434.400000000016 to 54456.69999999998 (+0.0%, p 0.0073); vacantObjectiveStalls.length 28 to 52 (+85.7%, p 0.0195); timeline.stalledOnsetsRepeated 40 to 46 (+15.0%, p 0.0313); timeline.stalledSamplesRepeated 1116 to 1208 (+8.2%, p 0.0313).

## Paired comparison (off against on)

- **546** pairs (unpaired: off 0, on 0) · identical in every field: **152** · runtime errors off 0 / on 0 · wall time on/off x0.994 (gate 1.25)
- the 247 changed records first part at simulated second: min 154.05, p10 218.1, median 271.05, p90 375, max 443.1

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 10896 | 11689 | 1.4524 | 205 | 151 | 54 | 0 |
| `usKills` | 4505 | 4805 | 0.5495 | 190 | 116 | 74 | 0.0028 |
| `geKills` | 6391 | 6884 | 0.9029 | 195 | 141 | 54 | 0 |
| `fire.total` | 13414 | 14641 | 2.2473 | 211 | 140 | 71 | 0 |
| `fire.hits` | 4706 | 5261 | 1.0165 | 199 | 133 | 66 | 0 |
| `retreatSamples` | 72867 | 78067 | 9.5238 | 208 | 128 | 80 | 0.0011 |
| `movementResolver.changes` | 832371 | 846859 | 26.5348 | 244 | 155 | 89 | 0 |
| `movementStalls.length` | 4 | 5 | 0.0018 | 1 | 1 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 28 | 52 | 0.044 | 42 | 29 | 13 | 0.0195 |
| `loopAlerts.length` | 184 | 140 | -0.0806 | 78 | 38 | 40 | 0.9099 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 743 | 779 | 0.0659 | 101 | 53 | 48 | 0.6908 |
| `stallOutcomes.wakes` | 156 | 156 | 0 | 38 | 18 | 20 | 0.8714 |
| `stallOutcomes.repeats` | 61 | 73 | 0.022 | 21 | 13 | 8 | 0.3833 |
| `timeline.stalledOnsets` | 4 | 5 | 0.0018 | 1 | 1 | 0 | 1 |
| `timeline.stalledSamples` | 117 | 135 | 0.033 | 2 | 2 | 0 | 0.5 |
| `timeline.stalledOnsetsRepeated` | 40 | 46 | 0.011 | 6 | 6 | 0 | 0.0313 |
| `timeline.stalledSamplesRepeated` | 1116 | 1208 | 0.1685 | 6 | 6 | 0 | 0.0313 |
| `recon.orders` | 23210 | 21408 | -3.3004 | 231 | 28 | 203 | 0 |
| `recon.contacts` | 1618 | 1479 | -0.2546 | 160 | 48 | 112 | 0 |
| `recon.noContact` | 8793 | 8259 | -0.978 | 145 | 31 | 114 | 0 |
| `recon.timeouts` | 7990 | 7469 | -0.9542 | 168 | 40 | 128 | 0 |
| `recon.cancelled` | 3908 | 3463 | -0.815 | 192 | 48 | 144 | 0 |
| `recon.reportsDelivered` | 7894 | 7044 | -1.5568 | 172 | 47 | 125 | 0 |
| `recon.retriggerBlocked` | 9398 | 8916 | -0.8828 | 180 | 48 | 132 | 0 |
| `squadPerformance.meanOverall` | 48761.50000000002 | 48649.60000000001 | -0.2049 | 238 | 93 | 145 | 0.0009 |
| `squadPerformance.p10Overall` | 45356.199999999924 | 45312.69999999993 | -0.0797 | 150 | 74 | 76 | 0.935 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 44152.39999999998 | 43736.29999999998 | -0.7621 | 240 | 76 | 164 | 0 |
| `squadPerformance.meanMovement` | 54238.60000000002 | 54162.100000000035 | -0.1401 | 178 | 68 | 110 | 0.002 |
| `squadPerformance.meanControl` | 54434.400000000016 | 54456.69999999998 | 0.0408 | 181 | 109 | 72 | 0.0073 |
| `squadPerformance.meanCohesion` | 45228.50000000003 | 45478.60000000003 | 0.4581 | 233 | 140 | 93 | 0.0025 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

egar-ud-0010 154.05 s (timeline) · egar-ud-0054 197.1 s (timeline) · egar-ud-0053 214.05 s (timeline) · egar-ud-0015 218.1 s (timeline) · egar-ud-0018 220.05 s (timeline) · egar-ud-0006 222 s (timeline) · egar-ud-0003 227.1 s (timeline) · egar-ud-0039 227.1 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=411&view=brain3d)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=411`); it opens the seed that parts earliest, and the dropdowns choose another.

