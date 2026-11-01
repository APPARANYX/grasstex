# GRASSTEX feature-flag default review — 2026-10-20

This file describes the **player-facing strategic defaults**, their explicit regression opt-outs, and the remaining categories of opt-in flags discovered during the follow-up sweep. It is not a request to automatically turn on every experimental or diagnostic switch.

## Integrated strategic gameplay: on by default

| Query parameter | Default without query | Where the decision lives | Explicit control |
| --- | --- | --- | --- |
| `strategicInterception` | On: 5 km strategic map | `battle/battle-sim.js`, `battle/scenario-generator.js` | `=0` restores the classic 2 km profile |
| `frontLines` | On: five-line objective layout | `battle/scenario-generator.js` | `=0` restores the 12-objective strategic layout |
| `motorTransport` | On in strategic scenarios | `battle/modules/58-strategic-abstract-transport.js` | `=0` |
| `truckAccess` | On with transport: physical boarding and staged dismount | `battle/modules/58-strategic-abstract-transport.js` | `=0` |
| `truckCollision` | On with transport: physical and ballistic vehicle footprints | `battle/modules/58-strategic-abstract-transport.js` | `=0` |
| `truckVisual` | On with strategic transport | `battle/modules/59-strategic-truck-visual.js` | `=0` (already an opt-out) |
| `aerialRecon` | On in strategic scenarios | `battle/modules/59-strategic-aerial-recon.js` | `=0` |
| `interception` | On in strategic scenarios with transport/recon | `battle/modules/59b-strategic-interception.js` | `=0` |
| `reinforcements` | On for front-lines strategic layout | `battle/modules/21c-strategic-reinforcements.js` | `=0` |
| `reinforcementSortie` | On when front-line reinforcements are active | `battle/modules/21c-strategic-reinforcements.js` | `=0` |

Flags do not override prerequisite system ownership. Combat Lab remains isolated from the strategic scenario and AI. For paired benchmark baselines, specify the relevant `=0` flags rather than relying on omission.

## Already default-on refinements (no change needed)

Inspected existing default-on/explicit-`=0` controls including:

- Recon: `reconCorridors`, `reconOverflight`, `ambushBeforeObjective`, `ambushNextObjective`, `lineApproachPost`, `lineSortie`.
- Strategic routes and objectives: `frontLineRule`, `splitRoads`, `roadFromHere`.
- Vehicle behavior and performance: `truckLite`, `truckPhysics`, `truckOnRoad`, `truckSpacing`, `truckReach`, `truckStaysPut`, `crewEyes`, `boardFacing`, `transportHandoff`.
- Core infantry and command controls: `morale`, `coa`, `generalIntel`, `fledElimination`, `squadBroadcast`, `commandPosture`, `commandMovement`, `commandRelay`, plus multiple navigation and animation improvements.

These switches should not be renamed or removed casually: deterministic benchmarks and historical controls depend on them.

## Intentionally left opt-in

**Parked/experimental tactical behavior** (do not silently promote to production gameplay): `localPlan`, `localResources`, `localDegrade`, `localTasks`, `localStructures`, `localEntry`, `localEntryGate`, `localSurvey`, `localWatch`, `localContactResume`, `localContinuity`, `localAmbush`, `localManeuver`, `coveredBounds`, and related Phase C posture knobs. See parked PR #527 and campaign #299 before considering any default change.

**Read-only telemetry/visual analysis**: `tacticalSituation`, `urbanPicture`. Turning these on would add observability and per-tick work, not player-facing gameplay.

**Developer, performance, and manual test controls**: `bench`, `damageRange`, `fixedClock=all`, `devModules`, editor/lab modes, detailed probes, and URL-selected benchmark arms. Preserve opt-in to avoid unexpectedly expensive or altered runs.

**Separate policy review**: `ACTION_DOCTRINE_ON = false` in `battle/commander-doctrine.js` is an intentional hard-coded policy safeguard, not an omitted transport feature. Do not flip it as part of a default-on rollout.

## Validation requirements

- Assert default 5 km/front-lines scenario and explicit classic 5 km/2 km controls.
- Assert default-on fleet, boarding, truck collision, rendered trucks, recon and interception gates, with independent `=0` controls.
- Preserve Combat Lab isolation and deterministic replay.
- Keep historical tests and A/B benchmark scripts on **explicit** control flags, not on absence of a flag.
- Require passing current-head CI, strategic Chromium smoke, native interception ON/OFF, and aerial event rejection checks before merging.
- After deployment, verify a clean no-query production load and an explicit legacy control URL; never infer production state from a PR head alone.

The codebase-wide audit of architectural complexity and redundant switches remains a separate task. This review changes supported strategic defaults only.
