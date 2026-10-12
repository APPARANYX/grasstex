# Benchmark run #614 · 3 seeds from `phase-c-natural-20261012` (ge-defend), windows `contact+60,every60`

- **OFF** flags: `none` · **ON** flags: `localPlan=1&localAmbush=1&localManeuver=1&coveredBounds=1`
- work/phase-c-natural-readiness-diagnostics @ 690ce85 · [run](https://github.com/APPARANYX/grasstex/actions/runs/38261712735) · build v29-dev

## Verdict

**MOVED: 26 of 26 pairs changed (median first part 152.1 s); 3 of 42 counters under p 0.05 (about 2.1 by chance), 1 under 0.0012; casualties -4.5% (p 0.2632)**

- Clears the Bonferroni line (p < 0.0012): recon.cancelled 169 to 88 (-47.9%, p 0).
- Under 0.05 only: recon.orders 486 to 406 (-16.5%, p 0.0146); movementResolver.changes 45954 to 48488 (+5.5%, p 0.029).

## Paired comparison (off against on)

- **26** pairs (unpaired: off 0, on 0) · identical in every field: **0** · runtime errors off 0 / on 0 · wall time on/off x1.08 (gate 1.25)
- the 26 changed records first part at simulated second: min 137.1, p10 137.1, median 152.1, p90 169.05, max 169.05

| counter | off | on | mean diff per pair | pairs changed | on more | on fewer | sign p |
|---|---:|---:|---:|---:|---:|---:|---:|
| `casualties` | 986 | 942 | -1.6923 | 20 | 7 | 13 | 0.2632 |
| `usKills` | 511 | 498 | -0.5 | 22 | 8 | 14 | 0.2863 |
| `geKills` | 475 | 444 | -1.1923 | 20 | 10 | 10 | 1 |
| `fire.total` | 922 | 995 | 2.8077 | 23 | 11 | 12 | 1 |
| `fire.hits` | 317 | 356 | 1.5 | 23 | 14 | 9 | 0.4049 |
| `retreatSamples` | 6417 | 7919 | 57.7692 | 24 | 14 | 10 | 0.5413 |
| `movementResolver.changes` | 45954 | 48488 | 97.4615 | 26 | 19 | 7 | 0.029 |
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
| `vacantObjectiveStalls.length` | 12 | 10 | -0.0769 | 13 | 5 | 8 | 0.5811 |
| `loopAlerts.length` | 5 | 4 | -0.0385 | 3 | 1 | 2 | 1 |
| `writerConflicts` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `regroups.entries` | 68 | 31 | -1.4231 | 16 | 5 | 11 | 0.2101 |
| `stallOutcomes.wakes` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `stallOutcomes.repeats` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsets` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamples` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledOnsetsRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `timeline.stalledSamplesRepeated` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `recon.orders` | 486 | 406 | -3.0769 | 25 | 6 | 19 | 0.0146 |
| `recon.contacts` | 37 | 48 | 0.4231 | 19 | 11 | 8 | 0.6476 |
| `recon.noContact` | 243 | 232 | -0.4231 | 14 | 4 | 10 | 0.1796 |
| `recon.timeouts` | 24 | 26 | 0.0769 | 8 | 5 | 3 | 0.7266 |
| `recon.cancelled` | 169 | 88 | -3.1154 | 23 | 0 | 23 | 0 |
| `recon.reportsDelivered` | 248 | 200 | -1.8462 | 21 | 7 | 14 | 0.1892 |
| `recon.retriggerBlocked` | 239 | 223 | -0.6154 | 12 | 6 | 6 | 1 |
| `squadPerformance.meanOverall` | 2271.3999999999996 | 2262.9 | -0.3269 | 25 | 10 | 15 | 0.4244 |
| `squadPerformance.p10Overall` | 2082.599999999999 | 2077.3999999999996 | -0.2 | 14 | 5 | 9 | 0.424 |
| `squadPerformance.lowScoreSquads` | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| `squadPerformance.meanMission` | 1905.8000000000002 | 1840.7999999999995 | -2.5 | 23 | 10 | 13 | 0.6776 |
| `squadPerformance.meanMovement` | 2590.1000000000004 | 2586.4 | -0.1423 | 20 | 8 | 12 | 0.5034 |
| `squadPerformance.meanControl` | 2593.7 | 2594.5 | 0.0308 | 14 | 7 | 7 | 1 |
| `squadPerformance.meanCohesion` | 2264.7 | 2351.5 | 3.3385 | 24 | 17 | 7 | 0.0639 |

With this many counters a p of 0.05 is expected by chance in about one of twenty: read the size and the direction across counters, not one p.

## The 3 seeds that part earliest (simulated seconds)

phase-c-natural-20261012-0001 137.1 s (timeline) · phase-c-natural-20261012-0003 152.1 s (timeline) · phase-c-natural-20261012-0002 169.05 s (timeline)

## Viewer

[Open both arms in the 3D map](https://test.ivandpopov.com/grasstex/ai_flow_live.html?bench=614&view=brain3d) · [the same on this branch's viewer](https://test.ivandpopov.com/grasstex/preview/phase-c-natural-readiness-diagnostics/ai_flow_live.html?bench=614&view=brain3d) (it has the change before it reaches main)

The viewer loads `off.json` and `on.json` from the `benchmark-results` branch (`?bench=614`); it opens the seed that parts earliest, and the dropdowns choose another.

