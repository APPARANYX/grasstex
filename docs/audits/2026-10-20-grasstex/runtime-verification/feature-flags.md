# Feature-flag verification

**64 composed activation cases passed**: all 32 combinations of five strategic switches on strategic and legacy fixture profiles. This is exhaustive for those gates only, not for all gameplay interactions. Hooks and public production APIs initialize fleets/colliders and expose recon/interception state; no regex-only fake activation result is substituted. [Matrix](artifacts/strategic-flag-matrix.json), runner `scripts/audit/verify-runtime-contracts.cjs`.

| Flag | Baseline default | Prerequisites and activated owner | Preview allowlist | Observed/source result |
|---|---|---|---|---|
| strategicInterception | Off; classic map | Scenario selector; recon/interception additionally depend on strategic profile | Forwarded | Distinct scenario switch, not an alias of interception |
| motorTransport | Off | strategic profile; transport owner 58 | Dropped | Fleet allocated only when effective gate true |
| aerialRecon | Off | strategic profile + strategicInterception=1; owner 59 | Dropped | status.enabled checked in every gate case; immutable report tests passed |
| interception | Off | strategic profile + all preceding switches; owner 59b | Dropped | enabled checked; native probe records actual decisions separately |
| truckCollision | Off | Live transport fleet; transport + obstacle/physicality owners | Dropped | Collider count equals fleet count only when enabled; composed collision fixture passed |

These five names are separate switches, with dependency-driven inactive combinations. The shipping loader silently accepts incomplete combinations instead of rejecting them. Those cases are recorded as inactive-by-prerequisite, not ordinary gameplay failures. A QA/configuration validator should reject a request claiming interception without its prerequisites.

Baseline no-query production source defaults to classic gameplay with these features off. Preview forwarding means asking the launcher for all five still activates only the map selector at this baseline. Direct local URLs used the full explicit query. **Actual deployed production/preview effective values were not certified.** The pinned hosted stage was unavailable; source defaults are not a deployment attestation.

Current-main source at `fa99ec8f1` changes these defaults to on and changes strategic layout/access/reinforcement defaults too. [Six source-executed drift cases](artifacts/default-drift.json) use exact Git objects in an isolated strategic fixture: absent queries produce no baseline fleet/recon/interception but produce four fixture trucks/recon/interception/colliders on current main. Explicit 0 controls still disable them. This is not a fresh browser campaign on current main. The preview allowlist is unchanged, so dropping explicit opt-outs is also a current-main risk.

## Broader inventory and tested interactions

[Query-read inventory](artifacts/query-read-inventory.json) records **174 discovered candidates** with source/line snippets and preview forwarding status. It scans battle JS/HTML, loaders and preview PHP for literal query reads, regex gates and selected helper calls. Numeric controls, enums and developer modes are included; indirect dynamic keys and hard-coded switches need additional manual review. Defaults/effective deployed values marked unresolved remain unresolved. This is deliberately a candidate inventory, **not a complete semantic feature catalog**.

Other reviewed strategic controls: truckAccess is baseline opt-in; truckPhysics, truckVisual, crewEyes, reconCorridors and reconOverflight are default-on refinements with their own prerequisites. frontLines/reinforcements/reinforcementSortie are explicitly enabled in the all-intended batch. Parked Phase C local* experiments and diagnostic/editor modes are not intended default gameplay and were not blindly enabled. ACTION_DOCTRINE_ON=false and stashed genome policy are hard-coded policy controls, not URL aliases.

Five seeds each cover map-only, motor, aerial, interception, five-switch combined and expanded all-intended configurations. The expanded query includes truckAccess=1, frontLines=1, reinforcements=1 and reinforcementSortie=1. The real baseline five-switch profile observed 12 live colliders and enabled recon/interception; native traces establish actual fleet and planner execution. All six 900 s native cases produced zero interception dispatches and zero physically early interceptions. Enabled cases did issue eight forward screens that reached their posts (11 ground reports), so forward screening executed; second-truck support remained zero. Successful natural interception is not established. Existing harness tests include command/stance/perception/grenade defaults and strategic flag isolation. They do not provide exhaustive cross-product coverage of 174 candidates.

A complete default/dependency/module/test mapping for every candidate, broad pairwise optional-module interactions and deployed preview flag introspection remain outstanding. Do not interpret query acceptance as activation: soldiers=200 failed to increase the roster and is retained as evidence of that exact pitfall.
