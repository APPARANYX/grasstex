# Matrix diagnostic evidence contract (October 2026)

**Workflow:** `.github/workflows/battle-benchmark.yml` — ⭐ M3C Battle Benchmark Matrix.
**Source:** one verified main commit, 30 workers (meeting, US defend, GE defend × 10).
**Typical size:** 10 battles/worker = 300 requested; 600 simulated seconds per battle,
0.15-second fixed step. Workers preserve completed battles at a 10-minute cutoff.
A partial result is **not** a 300-battle pass.

## Current diagnostics

The matrix still uses the **shipping browser simulation**, via
`scripts/run_battle_benchmark.mjs`; it does not use an alternate simplified AI.
Its `battle-benchmark.json` preserves every emitted record including:

- `timeline` (`grasstex-ai-timeline-v1`): canonical simulated-time one-second
  samples, semantic markers, and `observer`
  (`grasstex-battle-observer-v1`) 0.5-second triggered focus windows;
- `diagnosticEvidence` (`grasstex-benchmark-evidence-v1`): untruncated,
  window-scoped writer conflicts and loop alerts;
- `diagnosticAnalysis` (`grasstex-benchmark-analysis-v1`): stall episodes,
  censored episodes, coordination and wake context, integrity results;
- raw movement, combat, objectives, squad-performance and stress metrics.

`scripts/lib/matrix-diagnostic-audit.cjs` now validates their presence and
time alignment in **each battle**, preserving full per-record verdicts and
bounded problem examples. It refuses to treat duplicate seeds or stale/missing
diagnostic formats as valid. It does not require a focus window: the observer
is **triggered**, so a quiet battle legitimately has none.

The merger writes `summary.diagnosticAudit` and compatible
`summary.diagnosticEvidence`, plus diagnostic columns in the CSV and a
Diagnostic evidence audit in the Markdown report. It reports focus windows,
frames, dropped windows, timeline samples, markers and real writer/loop events.
A stall marked ended only means the episode ended; it is **not** proof that the
soldier resumed sustained forward movement.

## Completeness and publishing

A merged run is:

- **complete** only if the total **and each of the three scenarios** has all
  requested seeds, AND every battle passes diagnostic-integrity checks;
- **partial** when valid data is present but a worker hit the time budget or
  scenario coverage is short;
- **invalid** if diagnostics are missing, inconsistent, or corrupted, even
  when all 300 battle results are present.

The full report artifact is always retained if generated. The `benchmark-results`
branch retains compact status and summary; after evidence publication an
**invalid** run fails the Actions merge job. The notification then reports the
failure rather than celebrating it as a complete validation. An incomplete
but diagnostically sound run remains labelled `partial`, not a pass.

**Important limitation:** the matrix is a bulk aggregate benchmark, **not**
the on-demand full `BattleDiagnosticsExport.snapshot('full', sim)` end-session
dump, which contains per-soldier weapons, command reception, and tactical
state. The matrix retains timeline and evidence contracts but does not embed
full session dumps for every seed. Use `scripts/run_probe.cjs`,
`scripts/run_m3c_replay.cjs`, or the targeted fire benchmark for deeper
per-unit causal investigation. Do not multiply full-session diagnostic dumps
across 300 seeds without an explicit size and performance budget.

## Testing / running

The PR checks run both
`tools/ai-sim-harness/matrix-diagnostics-check.js` (schema, clock, observer,
integrity and duplicate-seed cases) and
`tools/ai-sim-harness/matrix-diagnostics-merge-check.js` (real merger on
valid and invalid synthetic shards). These validate the merger but do **not** substitute for a browser run.
The `⭐ Matrix Diagnostics Smoke` PR workflow additionally runs **one genuine
browser battle per scenario** with current sources and checks their merged
diagnostics. Even that three-battle check is **not** a statistical
300-battle regression run.

Matrix workflow deliberately restricts manual dispatches to `main`. Once
this PR passes CI and is merged, use **Actions → ⭐ M3C Battle Benchmark
Matrix → Run workflow → main**. Start with a small requested count, verify
three scenario reports and published diagnostic validity, then run the full
10-battles-per-worker matrix. The local runner uses
`PHP_CLI_SERVER_WORKERS=4` to avoid browser asset request starvation.
