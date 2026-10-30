# Benchmark run #1440 · 60 seeds from `controller-pacing3-20261030` (us-defend), windows `contact+120`

- **OFF** flags: `strategicInterception=0` · **ON** flags: `strategicInterception=0&tacticalController=new`
- work/pin/pacing-c75d7825 @ c75d782 · [run](https://github.com/APPARANYX/grasstex/actions/runs/41005404628) · build v29-dev

## Verdict

**MOVED: 57 of 57 pairs changed (median first part 1.05 s); 19 of 42 counters under p 0.05 (about 2.1 by chance), 14 under 0.0012; casualties -22.5% (p 0.0001)**

- Clears the Bonferroni line (p < 0.0012): fire.hits 2400 to 1781 (-25.8%, p 0); retreatSamples 7597 to 10262 (+35.1%, p 0); movementResolver.changes 79775 to 106345 (+33.3%, p 0); loopAlerts.length 209 to 551 (+163.6%, p 0); stallOutcomes.wakes 0 to 56 (new, p 0); recon.orders 885 to 1414 (+59.8%, p 0); recon.contacts 89 to 207 (+132.6%, p 0); recon.noContact 532 to 455 (-14.5%, p 0); recon.cancelled 187 to 635 (+239.6%, p 0); squadPerformance.meanMission 4446.9 to 4124.500000000001 (-7.2%, p 0); squadPerformance.meanControl 5567.999999999999 to 5415.700000000001 (-2.7%, p 0); casualties 1084 to 840 (-22.5%, p 0.0001); recon.reportsDelivered 422 to 942 (+123.2%, p 0.0001); fire.total 13928 to 18676 (+34.1%, p 0.0002).
- Under 0.05 only: geKills 542 to 429 (-20.8%, p 0.0022); squadPerformance.meanOverall 4948.4 to 4846.800000000001 (-2.1%, p 0.0032); usKills 542 to 411 (-24.2%, p 0.0078); regroups.entries 77 to 199 (+158.4%, p 0.0161); squadPerformance.meanCohesion 4936.400000000001 to 5060.300000000002 (+2.5%, p 0.0222).
- Wall time on/off x1.852 is over the 1.25 gate.
- Runtime errors: off 2, on 0.

## Paired comparison (off against on)

- **57** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 2 / on 0 · wall time on/off x1.852 (gate 1.25)
- the 57 changed records first part at simulated second: min 1.05, p10 1.05, median 1.05, p90 1.05, max 1.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 1084 | 840 | -4.2807 | 55 | 13 | 42 | 0.0001 |
| `usKills` | 542 | 411 | -2.2982 | 52 | 16 | 36 | 0.0078 |
| `geKills` | 542 | 429 | -1.9825 | 53 | 15 | 38 | 0.0022 |
| `fire.total` | 13928 | 18676 | 83.2982 | 57 | 43 | 14 | 0.0002 |
| `fire.hits` | 2400 | 1781 | -10.8596 | 57 | 11 | 46 | 0 |
| `retreatSamples` | 7597 | 10262 | 46.7544 | 57 | 44 | 13 | 0 |
| `movementResolver.changes` | 79775 | 106345 | 466.1404 | 57 | 57 | 0 | 0 |
| `grenades.throws` | 5 | 2 | -0.0526 | 4 | 1 | 3 | 0.625 |
| `grenades.bursts` | 5 | 2 | -0.0526 | 4 | 1 | 3 | 0.625 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 4 | 2 | -0.0351 | 3 | 1 | 2 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 2 | 2 | 0 | 4 | 2 | 2 | 1 |
| `loopAlerts.length` | 209 | 551 | 6 | 55 | 47 | 8 | 0 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 77 | 199 | 2.1404 | 45 | 31 | 14 | 0.0161 |
| `stallOutcomes.wakes` | 0 | 56 | 0.9825 | 54 | 54 | 0 | 0 |
| `stallOutcomes.repeats` | 0 | 5 | 0.0877 | 4 | 4 | 0 | 0.125 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 885 | 1414 | 9.2807 | 57 | 52 | 5 | 0 |
| `recon.contacts` | 89 | 207 | 2.0702 | 52 | 43 | 9 | 0 |
| `recon.noContact` | 532 | 455 | -1.3509 | 46 | 3 | 43 | 0 |
| `recon.timeouts` | 40 | 34 | -0.1053 | 7 | 1 | 6 | 0.125 |
| `recon.cancelled` | 187 | 635 | 7.8596 | 54 | 54 | 0 | 0 |
| `recon.reportsDelivered` | 422 | 942 | 9.1228 | 51 | 40 | 11 | 0.0001 |
| `recon.retriggerBlocked` | 475 | 494 | 0.3333 | 48 | 29 | 19 | 0.1934 |
| `squadPerformance.meanOverall` | 4948.4 | 4846.800000000001 | -1.7825 | 57 | 17 | 40 | 0.0032 |
| `squadPerformance.p10Overall` | 4436.999999999999 | 4383.800000000001 | -0.9333 | 52 | 20 | 32 | 0.1263 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 4446.9 | 4124.500000000001 | -5.6561 | 57 | 12 | 45 | 0 |
| `squadPerformance.meanMovement` | 5679 | 5679.799999999998 | 0.014 | 47 | 23 | 24 | 1 |
| `squadPerformance.meanControl` | 5567.999999999999 | 5415.700000000001 | -2.6719 | 57 | 8 | 49 | 0 |
| `squadPerformance.meanCohesion` | 4936.400000000001 | 5060.300000000002 | 2.1737 | 56 | 37 | 19 | 0.0222 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 8 seeds that part earliest (simulated seconds)

controller-pacing3-20261030-0001 1.05 s (timeline) · controller-pacing3-20261030-0002 1.05 s (timeline) · controller-pacing3-20261030-0003 1.05 s (timeline) · controller-pacing3-20261030-0004 1.05 s (timeline) · controller-pacing3-20261030-0005 1.05 s (timeline) · controller-pacing3-20261030-0006 1.05 s (timeline) · controller-pacing3-20261030-0007 1.05 s (timeline) · controller-pacing3-20261030-0008 1.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=1440&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/pin-pacing-c75d7825/ai_flow_live.html?bench=1440&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=1440`); it opens the seed that parts earliest, and the dropdowns choose another.

