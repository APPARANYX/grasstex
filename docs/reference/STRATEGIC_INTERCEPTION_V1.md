# Strategic Interception V1 — Open-Country Ambush Program

**Status:** kickoff specification only. No gameplay changes are authorized by this document.
**Branch:** `work/strategic-interception-20261015`, created **directly from `main` commit `bd7d19d71d9b72e4ac660e1baaca8d99d3fe1b92`**.
**Feature flag:** future opt-in `?strategicInterception=1`; OFF preserves existing generated scenarios and benchmark behavior.
**Legacy tactical work:** [PR #527](https://github.com/APPARANYX/grasstex/pull/527) remains a **draft, parked for dense urban/tactical combat**, not discarded. Related experiments [#542](https://github.com/APPARANYX/grasstex/pull/542), [#543](https://github.com/APPARANYX/grasstex/pull/543), and [#544](https://github.com/APPARANYX/grasstex/pull/544) remain independent and **must not be cherry-picked or merged as prerequisites**.

## Vehicle persistence and future garages — October 16, 2026

Implementation proposal in [#558](https://github.com/APPARANYX/grasstex/pull/558), targeting the draft strategic parent #545:

- **Six base-owned depots, two trucks per base (twelve total)** are allocated deterministically during the strategic battle's initial reset, before the General issues any transport brief.
- Each vehicle has a permanent `baseId`, `slot`, and `vehicleId`; empty trucks are visible at their parking pads and do not instantiate in response to a randomly timed transport request. Until garage geometry exists, pads sit alongside the base's first connected public road.
- Macro may claim an **already parked truck at the squad's actual home base**; the squad walks to that parked position, transitions through real boarding, and follows the existing carrier movement authority. No overlapping claims or a magically conjured third truck at the same base.
- A truck remains in the world where it stopped after an ordinary dismount, obstacle, contact, or mission interruption. An unused reservation abandoned before boarding releases the same parking slot. No instant return to base and no respawning replacement in V1.
- The **future garage system** should use these base/vehicle identities as its interface, adding physical garage structures, visible doors, drive-out/return-to-depot tasks, and explicit repair/resupply before any replacement truck exists. A replacement should never appear mid-battle without a modeled source/route.
- Still a presentation-only FBX vehicle (the existing transport/path and weapon/LOS authority remain unchanged), and both factions temporarily display the existing German model. Preserve the original soldier FBX rigs and independently centered wheel axle animation.

Acceptance requires a real paused-at-load browser capture of all twelve empty trucks, deterministic fleet-count/claim/reset tests, 5 km render and 30-battle transport non-regression, and no default tactical or combat-lab leakage.

---

## New primary scenario

Model deliberate **General-directed route interception** in a large open-country battlefield. A friendly General optionally calls a one-time aerial reconnaissance event. Based on a time-stamped snapshot of enemy squads' positions, headings, and speeds, it evaluates plausible objective routes, chooses an interception corridor **between the enemy and its plausible objective(s)**, and allocates an available motorized squad only when it can dismount and occupy that corridor *before* the enemy is expected to reach it. The Squad Leader receives a high-level intercept mission; soldiers independently establish observation/firing posts and engage under ordinary combat rules.

Unlike the existing local Phase C tactical-posture work, **no three-man/four-second gate is a prerequisite for useful behavior**. Those measurements may remain diagnostic observations of a prepared fireteam. A squad that misses an intercept continues ordinary mission execution; a failed ambush is not a simulation dead-end.

Ownership invariant: **General = Macro** (air-recon request, target and corridor ranking, mission assignment, transport allocation), **Squad Leader = Meso** (travel/dismount coordination, position use, reserve and fire-support coordination), **Soldier = Micro** (individual visibility, cover, stance, aiming, fire). Neither General nor Squad Leader reads hidden enemy transforms outside the one authorized aerial recon sampling event. Movement has one authoritative final arbiter.

## Delivery 1: 5 km × 5 km strategic battlefield

- Add a separately enabled seeded scenario profile. Default `2000 m × 1200 m` and `PHASE_C_COMBAT_LAB` small-scale profiles remain **bit-for-bit deterministic** for their existing seeds and test cases.
- Strategic profile `5000 m × 5000 m`; three geographically separated, **not uniformly collinear**, home spawn bases per faction, each with its own meaningful capture/defend objective (six spawn-base objectives).
- Initially keep existing five infantry squads **per side**, assigned deterministically among the three friendly bases; don't multiply actors just because the map is larger. Plan for later per-base reinforcement/respawn without implementing it now.
- Add a configurable set of forward and contested objectives across the full field (initial candidate: six more, twelve objectives overall), connected by **branching**, believable road corridors and scattered villages/junctions. Enforce meaningful minimum distance and avoid duplicate, tightly packed center objectives. A strategic shared corridor can serve multiple nearby objectives.
- Make `scenario.map.width/depth`, terrain height/mesh sampling, terrain scatter density, feature distribution, map bounds, camera/minimap, squad initial lanes, route scoring, pathfinding and objective evaluation agree; do not change two constants and accidentally leave soldier positions/navigability on the old 2 km rectangle.
- Revisit battle duration and benchmark time horizon; e.g. a >1 km transport trip cannot be judged against the old 600-second infantry-only expectation without considering setup and objectives. Make the new profile independently testable with deterministic seed/map fingerprints and balanced objectives.

**Acceptance:** all units spawn within bounds, all twelve objective points exist and are valid, route crossings remain navigable, bases/objectives are geographically distributed, no out-of-bounds or pathing/time-limit artifacts, old standard seeds unchanged, acceptable deterministic performance/memory.

## Delivery 2: abstract motorized squad transport (no visible vehicle yet)

- Provide an explicit squad `embarked` transport task granted by its General, with only one transport position/route owner. All squadmembers move **as one very tight formation** representing passengers, rather than individually sprinting faster or competing with normal formation orders.
- Proposed tunable provisional travel speeds for testing: road travel ~10–14 m/s (36–50 km/h), rough off-road travel substantially slower; use road/path and terrain restrictions. These are starting hypotheses requiring actual simulation timing checks, not hard-coded promises.
- A real route must be evaluated for reachability (road/turn/obstacle/edge constraints); no teleporting, phasing through structures, or secretly boosting unrelated squads. Passenger formation must not report ordinary walking locomotion or get independent movement destinations while embarked.
- Upon reaching a safe approach point, **dismount as an atomic transition** into normal soldier navigation/Engagement; the Squad Leader finishes deployment from there. Enemy contact/damage/blocked route/time expiry cancels or aborts the transport task safely.
- The transport is initially abstract, with optional tactical-map marker and diagnostic state; no vehicle meshes, armor, combat, fuel, respawning or passenger casualties are required in V1.

**Acceptance:** travel time corresponds to travelled path and vehicle speed, all members remain grouped with intact ownership, blocked routes stop/replan rather than clip, all actors transfer cleanly back to normal combat movement on dismount, normal foot movement untouched.

## Delivery 3: one-shot aerial recon + intercept orders

- Each independently owned US/GE General may request **one aerial reconnaissance event per battle**. Event reports a timestamped snapshot of currently detectable enemy **squads on that enemy's own half of the map** with approximate squad center, travel heading and ground speed; omit known concealed ambush dispositions/hidden ambush positions. No enemy-wide persistent truth reads, permanent reveal, retroactive precision, or hidden targeting.
- Recon event is the **only scoped truth-sampling exception** to General's normal report-derived intel boundary. It publishes immutable, faction-owned observation DTOs with `source:aerial`, observation time, bounded confidence/location uncertainty, and decay. The opposing General receives no data from the other side's event. The event never authorizes shooting.
- Do not fabricate enemy objective intent. Generate plausible destinations from owned/contested objectives, vector alignment of the observed heading, distance, and route availability. If nearby objectives are ambiguous, rank the **shared approach corridor BEFORE the fork**; if movement is stationary/heading unknown, no confident interception prediction.
- For each viable candidate calculate **enemy ETA**, friendly **vehicle route ETA + dismount + infantry setup time + uncertainty/safety margin**, score terrain masking/observation/terrain route viability and strategic importance. If friendly arrival is late, no safe road exists, or confidence is insufficient, **do not order an intercept**; proceed with standard Macro missions.
- When one opportunity is genuinely feasible, General issues an **intercept mission** with a corridor/sector and expiry. Squad Leader handles route stage and actual deployment, and Soldiers retain normal firsthand contact and combat rules. The order is neither perfect enemy coordinates nor an immediate synchronized volley.
- Recon is a mission-level event, **not a new soldier reconnaissance system**. Leave local-scout prediction, respawn-route ambushes, airheads and airborne insertions for later campaigns.

**Acceptance:** one event max per General, no observation of hidden ambush posts, consistent squad movement vectors at sampling, asymmetric faction-local intel, no information after event that has not been refreshed, target-selection explanation grounded in score and travel ETA, at least one genuine seeded intercept with physically verified friendly arrival ahead of the enemy, independent firing/suppression, zero artificial contacts/shots.

## Build order and isolation

1. **Map and distributed objectives** — independently green seeded generator, compatibility and performance checks.
2. **Abstract transport** — independently green time/route/dismount tests on the strategic profile.
3. **Aerial recon** — one-shot provenance, direction/speed confidence, hidden-ambush exclusion, per-General isolation.
4. **Macro intercept scoring + mission handoff** — native seed A/B with and without strategic interception, no scripted enemy routes or forced firing.

Each step is a separate reviewable commit/PR checkpoint on the **new main-based branch**, not dependent on #527/#542–#544. Preserve other gameplay defaults and existing AI General/Squad Leader/Soldier ownership throughout. Do not merge to main until map, vehicle, recon integrity and actual native interception all pass their own tests.

## Useful telemetry

- Strategic scenario map dimensions, objective count and nearest-neighbor distances, spawn-base locations and origin.
- Per-side aerial event count and time, scoped contact count, hidden-ambush exclusions, observed heading/speed and uncertainty.
- Candidate `enemyETA`, `friendlyRouteETA`, `dismountETA`, `setupETA`, `margin`, rejection reason, chosen objective/corridor and scored alternatives.
- Transport state, ground displacement, blocked road/terrain, member grouping variance, authority handoff and actual dismount times.
- Squad on-post arrival time vs enemy actual corridor arrival, real personal sighting, actual independent shots and supporting fire; explicit failures and no unearned success.

## Non-goals

Do **not** modify/merge legacy #527 or its experiments, normalize their acceptance metrics, add respawns, route-memory ground-scout ambushes, parachute insertion, full vehicle physics, free tactical map reveals, scripted enemy movement, or any hidden actor-position access outside the one bounded aerial observation event.
