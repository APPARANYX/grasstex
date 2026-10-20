# GRASSTEX systems integrity and architecture audit — 2026-10-20

**Status: evidence-driven initial audit, NOT a certified exhaustive verification.** No gameplay change, merge, deployment, remote mutation, live browser reproduction, or profiler run was conducted by this audit. The evidence was inspected through the GitHub repository source and workflow records; several high-risk behaviors require execution and independent reproduction.

- Repository: `APPARANYX/grasstex`
- Source baseline: `main` at [`f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9`](https://github.com/APPARANYX/grasstex/commit/f89939f2f6e8ff21063d1b24c28a8ab73fe9d2e9), the merge of PR #590.
- Audit branch: `audit/comprehensive-integrity-20261020` (branched directly from that SHA).
- Review type: source-code inspection + tracked-tree inventory + CI/workflow history, NOT an executed full-system benchmark.
- Tracked-tree inventory: 1,053 files; 121 files under `battle/modules/`, 236 files under `tools/ai-sim-harness/`, 74 under `scripts/probes/`, 32 GitHub workflow definitions. File counts are inventory, not lines-of-code or test-coverage measures.

## Audit report navigation

1. [Architecture and state ownership](architecture-and-state.md): complete high-level execution graph, data flows, state tables, and coupling analysis.
2. [Evidence and findings register](findings.md): severity, source and line references, root causes, recommendations, risk, and confidence.
3. [Validation, testing, security, and performance](validation-and-performance.md): coverage review, CI history, unmeasured benchmarks, required repro suites, endpoint boundaries.
4. [Target architecture and incremental PR plan](roadmap.md): A/B/C priorities, measurable acceptance gates, complexity-reduction targets, five highest-value changes.

## Executive assessment

**The foundations are sound enough to improve incrementally, but the architecture is not yet cohesive or consistently enforced.** GRASSTEX implements real separation of macro/meso/micro intentions, an explicit movement resolver, module lifecycle hooks, deterministic seeded scenario construction, a substantial regression harness, a physical-obstacle field, and visual/authoritative truck separation. Those are meaningful investments.

However, authority is still distributed through runtime monkey-patch chains; dynamic-geometry enforcement depends on a late physicality wrapper over the base navigation module; command, transport and lifecycle state have multiple synchronized representations; there are observational hooks that can swallow essential failures; the preview flag contract differs from the actual strategic feature dependencies; and two persistent PHP write endpoints rely on Origin rather than caller authentication. The actual runtime impact of some findings remains unmeasured. **This does not justify a wholesale rewrite.** It justifies a sequence of bounded architectural corrections with old/new deterministic replay, invariant assertions, browser parity and profiling.

### Highest-confidence findings

| ID | Priority | Status | Finding |
| --- | --- | --- | --- |
| SEC-01 | High | Confirmed source-level security weakness | Persistent policy and learning POST routes use Origin host checking, without a demonstrated authentication boundary. |
| PHY-01 | Medium | Confirmed layered implementation; discrepancy unproven | The base navigation module is static-only, but the physicality extension wraps its public movement, routing, and collision APIs and **does** check dynamic truck footprints when `truckCollision=1`. The concern is the fragile layered contract, not proven missing runtime collision. |
| LIFE-01 | High | Confirmed architecture debt; no observed crash | Startup and restart functionality is installed by nested method wrappers, independent render observers and hook lifecycle events. |
| PREV-01 | Medium | Confirmed source-level behavior | Preview launcher drops `motorTransport`, `aerialRecon`, `interception` and `truckCollision` URL flags although those can be required by the actual runtime. |
| TRN-01 | Medium | Confirmed missing liveness branch, impact unproven | A blocked dismount returns indefinitely without a timeout or alternative release transition in the local dismount path. |
| BALL-01 | Medium | Confirmed fail-open exception handling | Ballistic obstruction-query exceptions are silently swallowed, allowing an unchecked result. |
| PHASE-01 | Medium | Confirmed complexity / architectural risk | Eleven Squad Leader phase labels have fully connected transition adjacency; validity depends on external mission guards, not the phase transition table. |
| STATE-01 | Medium | Architectural risk only | Fleet, squad transport, command reception, plan and movement hold parallel data; no duplicate-owner corruption demonstrated. |

## Important limits

- This is **not** a claim that every file has been individually read, every state enumerated, or every flag pair tested. The repository tree was inventoried; critical runtime, navigation, transport, command, lifecycle, UI, backend and workflow implementation points were sampled with precise line references. FBX rig math, audio-specific synthesis, every PHP route, every historical commit, browser camera/input edge cases and all optional labs have not been exhaustively audited.
- **No measured new p95/p99, CPU percentages, heap usage, GC, rendering throughput, or seed-parity output.** See validation plan before acting on performance conjecture.
- The PR-head CI and 5 km workflow passed, but this does not prove every behavior on the resulting merge commit or every optional flag combination.
- Every issue is tagged as confirmed source-level defect, architectural risk, performance hypothesis, or missing test evidence. A source-level error path is not represented as an observed live failure.

## Decision

Proceed with **incremental architecture consolidation, not a broad rewrite**, beginning with authentication of state-changing endpoints, dynamic-collision consistency, executable lifecycle contracts, and full flag propagation. Commit no gameplay changes as part of this report. Explicit owner authorization is required before any corrective PR, deployment, or merge.
