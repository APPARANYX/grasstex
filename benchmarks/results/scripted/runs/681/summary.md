# Benchmark run #681 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ 62ebfe0 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38279438475) · build v29-dev

## Verdict

**MOVED: 26 of 26 pairs changed (median first part 152.1 s); 5 of 42 counters under p 0.05 (about 2.1 by chance), 2 under 0.0012; casualties -1.9% (p 0.69)**

- Clears the Bonferroni line (p < 0.0012): recon.cancelled 155 to 39 (-74.8%, p 0); recon.orders 488 to 365 (-25.2%, p 0.0005).
- Under 0.05 only: recon.reportsDelivered 165 to 243 (+47.3%, p 0.0034); movementResolver.changes 48649 to 48572 (-0.2%, p 0.0094); squadPerformance.meanCohesion 2349.8000000000006 to 2282.3999999999996 (-2.9%, p 0.029).

## Paired comparison (off against on)

- **26** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.117 (gate 1.25)
- the 26 changed records first part at simulated second: min 143.1, p10 143.1, median 152.1, p90 169.05, max 169.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 976 | 957 | -0.7308 | 25 | 11 | 14 | 0.69 |
| `usKills` | 546 | 514 | -1.2308 | 25 | 12 | 13 | 1 |
| `geKills` | 430 | 443 | 0.5 | 23 | 12 | 11 | 1 |
| `fire.total` | 942 | 866 | -2.9231 | 24 | 9 | 15 | 0.3075 |
| `fire.hits` | 332 | 340 | 0.3077 | 22 | 10 | 12 | 0.8318 |
| `retreatSamples` | 7084 | 7503 | 16.1154 | 25 | 15 | 10 | 0.4244 |
| `movementResolver.changes` | 48649 | 48572 | -2.9615 | 26 | 20 | 6 | 0.0094 |
| `grenades.throws` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.bursts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.wounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.casualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.suppressed` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyWounded` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.friendlyCasualties` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `grenades.aborted` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `movementStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `routeStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `targetlessStalls.length` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `vacantObjectiveStalls.length` | 13 | 11 | -0.0769 | 9 | 5 | 4 | 1 |
| `loopAlerts.length` | 32 | 4 | -1.0769 | 11 | 3 | 8 | 0.2266 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 39 | 47 | 0.3077 | 12 | 7 | 5 | 0.7744 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 488 | 365 | -4.7308 | 23 | 3 | 20 | 0.0005 |
| `recon.contacts` | 42 | 48 | 0.2308 | 10 | 8 | 2 | 0.1094 |
| `recon.noContact` | 252 | 245 | -0.2692 | 17 | 5 | 12 | 0.1435 |
| `recon.timeouts` | 18 | 23 | 0.1923 | 5 | 5 | 0 | 0.0625 |
| `recon.cancelled` | 155 | 39 | -4.4615 | 25 | 1 | 24 | 0 |
| `recon.reportsDelivered` | 165 | 243 | 3 | 13 | 12 | 1 | 0.0034 |
| `recon.retriggerBlocked` | 244 | 226 | -0.6923 | 15 | 5 | 10 | 0.3018 |
| `squadPerformance.meanOverall` | 2276.2999999999993 | 2267.1999999999994 | -0.35 | 26 | 9 | 17 | 0.1686 |
| `squadPerformance.p10Overall` | 2093.6999999999994 | 2090.1999999999994 | -0.1346 | 13 | 6 | 7 | 1 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1879.9 | 1891 | 0.4269 | 26 | 11 | 15 | 0.5572 |
| `squadPerformance.meanMovement` | 2580.7 | 2590.1 | 0.3615 | 17 | 10 | 7 | 0.6291 |
| `squadPerformance.meanControl` | 2588.4 | 2594.7000000000003 | 0.2423 | 20 | 13 | 7 | 0.2632 |
| `squadPerformance.meanCohesion` | 2349.8000000000006 | 2282.3999999999996 | -2.5923 | 26 | 7 | 19 | 0.029 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 143.1 s (timeline) · phase-c-natural-20261012-0003 152.1 s (timeline) · phase-c-natural-20261012-0002 169.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=681&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=681&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=681`); it opens the seed that parts earliest, and the dropdowns choose another.

