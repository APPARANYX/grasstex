# Runtime verification — 2026-10-20

**Verdict: substantial verified functionality, with bounded robustness defects and significant remaining coverage gaps. No basis for an unconditional correctness or efficiency certification.** The evidence supports incremental corrections, not a rewrite.

## Reproduction and scope

Frozen gameplay baseline: `f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9`. Audit parent `5945793baa5a78762a4105039f23857115b1cac0` differs only in five existing audit documents. Branch `audit/runtime-verification-20261020`. Current upstream main at start: `fa99ec8f15acf0f76d83e7f5a4317191ab5a61e5`; its newer defaults are **not** the baseline. [Environment and open PR inventory](artifacts/environment.json), [default-drift execution](artifacts/default-drift.json).

Success criteria: fresh deterministic-seed executions; measured runtime/CPU evidence; explicit composed flag checks; isolated reproducible failures; committed reports and artifacts; no gameplay edits, test weakening, merge or deployment. Execution evidence is delivered; exhaustive coverage and live production certification are not achieved.

46 standard benchmark battles, 28 repeated profile battles, and 11 native interception battles: **85 fixed-step battle executions**. Short rendered smoke/5 km checks, lifecycle pulses and unit-test fixtures are counted separately. Benchmark battles alone cover **11937.45 simulated seconds**. Five seeds per main scenario class; the original six paired native long battles are supplemented by five observe-only runs across five unique seeds; this is not five native seeds per defensive deployment. Each benchmark seed and exact query is saved in [campaign summary](artifacts/campaign-summary.json) and batch manifests. Prefixes differ between scenario classes: these are coverage runs, not paired tactical effect estimates.

| Campaign | Battles | Sim seconds | Outcomes | Total captures | Movement/route/loop alerts | Runtime errors |
|---|---:|---:|---|---:|---|---:|
| all-intended | 5 | 3000.75 | {'ge': 3, 'us': 2} | 10 | 31/9/48 | 0 |
| combined | 5 | 3000.75 | {'ge': 2, 'us': 3} | 60 | 0/0/58 | 0 |
| endurance | 1 | 535.95 | {'ge': 1} | 7 | 0/0/8 | 0 |
| ge-defend | 5 | 600.00 | {'ge': 5} | 1 | 0/0/1 | 0 |
| intercept | 5 | 900.00 | {'ge': 3, 'draw': 2} | 33 | 26/0/0 | 0 |
| meeting | 5 | 600.00 | {'draw': 3, 'ge': 2} | 2 | 0/0/0 | 0 |
| motor | 5 | 900.00 | {'draw': 5} | 30 | 54/0/0 | 0 |
| recon | 5 | 900.00 | {'draw': 5} | 30 | 0/0/0 | 0 |
| strategic | 5 | 900.00 | {'draw': 5} | 30 | 0/0/0 | 0 |
| us-defend | 5 | 600.00 | {'us': 5} | 0 | 0/0/2 | 0 |

## What actually ran

- Existing `run_battle_benchmark.mjs`: full shipping simulation, procedural soldier rigs, 0.15 s fixed steps and 0.45 s commander updates, existing timeline/evidence diagnostics. Rendering stopped during battle stepping; live telemetry writes disabled; policy endpoint deliberately unavailable, falling back to stashed runtime defaults. This is not the native render-loop scheduler.
- Existing `probe_strategic_5km.cjs`: real Chromium/Babylon terrain, 5 km bounds, 12 objectives, six base routes, simulation advancement, classic map control, and **explicitly forced** road-handoff fixture. Private audio replaced with the probe's existing silent WAV fixture; navigation and AI are real. No claim that the forced re-task was a natural command decision.
- Existing native interception probe: shipping 5 km sim, 900 s per case, paired interception gates, fleet/reserve/planner/physical timing traces. Media-only preload uses the same silent WAV method as the 5 km probe; no synthetic enemies or hits. See [native evidence](artifacts/native-interception/native-interception-evidence.json), [execution manifest](artifacts/extra-executions.json).
- Existing browser smoke: constructed and advanced to 4.25 s, but exited nonzero on absent private MP3 assets. That infrastructure failure remains recorded in [log](artifacts/browser-smoke.log); it was not converted into a pass.
- 227 existing harness invocations passed: 219 `*-check.js` files plus `run.js` at seeds 12345,1,2,3,5,8,13,21. The harness extracts production movement code while stubbing animation/local steering and Babylon; never equate these checks with browser battles. [Results](artifacts/checks.json).
- 582 syntax/loader/strategic checks passed. These include tracked JS/PHP syntax, preview launcher and strategic script contracts, not a GitHub CI run. Private-audio mastering, deployment and secret-dependent jobs were not run. The follow-up also reran strategic-interception-check.js successfully after adding optional probe seed/mode selection. [Results](artifacts/static-checks.json).

The pinned hosted stage returned HTTP 404. Local unpushed-checkout fallback used PHP 8 and Playwright 1.55.0 / Chromium 140.0.7339.16 on Apple M1, 16 GiB, macOS (exact versions in environment artifact). No preview launcher staging, branch push or deployment was performed. SwiftShader and missing assets limit rendering/device conclusions.

## Findings and confidence limits

Normal benchmark records reported zero non-asset browser runtime errors and zero writer conflicts. Stall/loop alerts are triage evidence, **not confirmed bugs**: motor and interception short runs contain movement alerts; long all-intended runs contain route/vacancy alerts. Preserve the seeds and inspect their windows before changing tactics. Short classic battles often had no captures because movement had not reached objectives; strategic initial captures include own-side base objectives.

Repeated same-seed profiling runs agree on their captured final counters/fleet/recon state across plain, wrapped and CDP runs. This is coarse replay consistency, not byte-identical internal-state or cross-browser determinism. Independent fresh-session full-state replay remains outstanding.

The ineffective `soldiers=200` query was detected from actual roster counts (100). That campaign and its profile are retained as a 100-soldier control. Real 200-soldier stress uses five production infantry reinforcements per faction and verifies 100+100 actors before measurement.

Failure classification: no existing harness/static baseline failures were observed; the original smoke/full-fidelity failures were missing-private-audio infrastructure failures; the full-fidelity follow-up passed with the explicit silent-media fixture. The first native launch failed before browser execution because NODE_OPTIONS split a path containing spaces; the launch was corrected to pass --require as a separate argv element and all six native cases then passed. That first diagnostic launch failure is retained in native-interception-first-launch.log and native-interception-launch-failure.json. No test was disabled or weakened, no identified flaky test was relabeled as a pass, and injected failure-path results are separate from natural battle behavior.

No exhaustive soldier/geometry penetration census, every-frame seat ownership census, every mission-version transition, heap-retention proof, all 174 query candidates' semantics, or deployed effective configuration was established. No experimental simplifications were merged or gameplay behavior altered. See [defects](confirmed-defects.md), [CPU](cpu-performance.md), [state machines](state-machines.md), [flags](feature-flags.md), and [roadmap](architecture-simplification-roadmap.md).
