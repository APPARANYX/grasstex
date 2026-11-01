# Targeted Fire-Control Benchmark

Observe the **shipping battle**, not a simplified firefight: select actors and decision
checkpoints to diagnose German fire-control failures while the other faction, Macro/Meso
and all movement/ballistics keep running. There is no gameplay tuning in this probe.

## Run on a work branch

Use the repo's existing headless browser harness. Launch with the same local
multi-worker PHP server that `scripts/run_probe.cjs` uses:

```bash
mkdir -p /tmp/battle-www
ln -sfn "$PWD" /tmp/battle-www/grasstex
PHP_CLI_SERVER_WORKERS=4 php -S 127.0.0.1:8765 -t /tmp/battle-www
```

In a second terminal (with Node 22 and Playwright installed):

```bash
TARGET_SEEDS=20 TARGET_SIDE=ge TARGET_ROLE=gunner,sergeant,rifleman \
  TARGET_CONTROL=1 node scripts/run_targeted_fire_benchmark.cjs
```

Or run **⭐ Targeted MG42 Fire Benchmark** on the branch's GitHub Actions PR
checks; once it is on main, the workflow can also be dispatched manually.
The workflow runs 20 seeds for each of `meeting`, `us-defend`, `ge-defend`,
with the same seed re-run probe-free and the results uploaded as artifacts.
Use the workflow's `ids` input to isolate **German gunner #76** from the live v432
battle, but remember an id is a roster slot, not necessarily the same casualty
or tactical situation across scenarios.

## Filters

- `TARGET_SIDE=ge|us|all` (default `ge`)
- `TARGET_ROLE=gunner,sergeant,rifleman` (default; `all` accepted)
- `TARGET_IDS=76` and `TARGET_SQUADS=ge-2` (optional CSV filters)
- `TARGET_WATCH=command,gates,setup,stress,fire,los` (default all)
- `TARGET_TYPES=meeting,us-defend,ge-defend`
- `TARGET_SEEDS=20` per scenario, `TARGET_SECONDS=600`,
  `TARGET_SEED_PREFIX=targeted-mg42` and `TARGET_OUT=reports/targeted-fire`
- `TARGET_CONTROL=1` (default) runs the same seed a second time **without**
  observational probes and requires an identical battle fingerprint.

Files: `reports/targeted-fire/raw.json` (all per-seed details),
`summary.json` (scenario + role aggregates) and `summary.md` (human report).

## Evidence contract

The `targeted-fire-control` probe samples selected living units after each
0.15 s simulated AI step. It records the first **inferred** blocking condition
(e.g. `no-personal-target`, `stress:cower`, `mg-setup`,
`fire-order:hold`, `facing`, `aim-settle`) and the MG42's setup
transitions, adopted personal fire order, engagement state, and reaction.
These gate sample counts are **not** instrumented function-call counts;
some allow or reject decisions may happen earlier in the same tick.
It never invokes `BattleCommandReception.adopted()` or
`BattleDirectFireLOSGate.blocked()` because both write internal state.

Actual runtime firing is measured via the chained `sim.onFire` callback:
rounds and trigger pulls per selected soldier. The LOS, crest and suppressive
terrain rejection counters are read from the real trigger path. Held-target
periods of five or more seconds without a shot are diagnostic candidates,
not automatically defects. A man may legitimately hold fire, be pinned,
reload, or lack a ballistic line.

**Interpretation:** first compare MG42 rounds per target-second, cower/setup
cycles, personal order state and LOS reject deltas by seed and scenario.
Inspect the exact per-unit episodes before changing any gameplay rule.
If `sameBattle=false` or there are browser errors, invalidate that seed's
causal conclusions and fix the probe/harness first. After a source fix,
repeat identical seeds on main versus the work branch to attribute changes.

The probe does not instrument arbitrary private JavaScript closures by name.
`TARGET_WATCH` selects the defined observable decision channels, not call
stack tracing; use `scripts/profile_battle_hotpaths.mjs` if wall-time per
function is the question.
