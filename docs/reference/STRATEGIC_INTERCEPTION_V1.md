# Strategic Interception V1 — Open-Country Ambush Program

**Status:** kickoff specification only. No gameplay changes are authorized by this document.
**Branch:** `work/strategic-interception-20261015`, created **directly from `main` commit `bd7d19d71d9b72e4ac660e1baaca8d99d3fe1b92`**.
**Feature flag:** future opt-in `?strategicInterception=1`; OFF preserves existing generated scenarios and benchmark behavior.
**Legacy tactical work:** [PR #527](https://github.com/APPARANYX/grasstex/pull/527) remains a **draft, parked for dense urban/tactical combat**, not discarded. Related experiments [#542](https://github.com/APPARANYX/grasstex/pull/542), [#543](https://github.com/APPARANYX/grasstex/pull/543), and [#544](https://github.com/APPARANYX/grasstex/pull/544) remain independent and **must not be cherry-picked or merged as prerequisites**.

## Front lines layout and the ww2fps merge point — October 17, 2026

`?frontLines=1` (with `?strategicInterception=1`) swaps the 12-point ring for a chain of five lines from base line to base line, modelled on Hell Let Loose sectors: the US base line (3 bases), line 1, the centre line 2, line 3, and the German base line. `createFrontLines` in `battle/scenario-generator.js` builds it from the seed: each middle line has one point on one of three seeded sites, typed `town` (with a settlement from the grasstex town generator), `forest` or `open`. Main roads run base to line 1 to centre to line 3 to base; side roads give every line a second road in. `scenario.frontLines` lists the lines and the start owners per battle type (meeting: both forward lines held, centre neutral; a defender also holds the centre).

`battle/modules/21b-strategic-front-lines.js` is the one owner of the line rules: start ownership; which objectives a side may attack (only the first line from its own rear that it does not fully hold, so a lost rear objective is retaken first; `?frontLineRule=0` lifts this); and each squad's rear point, the nearest objective of the line behind the front. When the front moves, a capture brief against a line that is no longer attackable wakes the General (`front-line-moved`). Retreat, extraction and reconstitution keep their owners and read the rear point through `SquadAI.extractionHome`. Capture briefs on a line are split over the roads into it from ground the side holds (the main road and the side road): each brief takes the road fewest of its side's other briefs use, and the truck drives that road (`approachRoadId`; `?splitRoads=0` sends everyone by the shortest road). Each time a line changes hands (an objective gets a new owner; neutralising it does not count) each General may fly one more sortie, and a squad standing on held ground with its truck stopped may answer that report (`?lineSortie=0` keeps one sortie per battle). Such a report may also send one squad of a held line's garrison on foot to a post within its walking reach; the line keeps another garrison squad unless the enemy may not attack it yet, and only one squad per line is out at a time; a squad that left its line empty is recalled (`garrison-line-threatened`) through its own prepared-defense brief once the enemy may attack that line (`?garrisonAmbush=0` keeps garrisons in place). Engineers fortify the lines their side holds with the usual limits (sandbags then foxholes, two works per objective; none in meeting battles, as before). A defender's prepared sectors are its held lines, front first, each falling back to the one behind.

**Merge point.** The output is shaped like the ww2fps map generator's (ordered control points typed town, forest or open, a main road through them plus side roads, defensive sectors that name their fallback) so its generator can replace `createFrontLines` later without touching the AI: it has to produce `objectives` with `frontLine`, `roads` with `fromObjectiveId`/`toObjectiveId`, `settlements` and `scenario.frontLines`. No ww2fps code is copied here. That swap needs the owner's word, since ww2fps is private and this repository is public.

**Exposed-line security.** `BattleFrontLines.garrisonFor` supplies Macro a defense request for one squad already present at the last fully held non-base line while the enemy may attack that line and another active squad remains available. A present defender is preferred to another capturer, so arriving squads do not churn the guard. The General retains that squad after the ordinary 18 s capture-security window; other squads can advance. Losing the line, advancing the front, or the guard retreating releases/replaces the request. The last active squad is never pinned by this rule. This reads public ownership and friendly positions only; it neither moves squads nor creates prepared fortifications.

## Reinforcement trial on the front lines — October 17, 2026

The owner asked for a small, controlled respawn trial, because one life per squad leaves ambushes nothing to hit: every squad races to the centre once and is then busy holding or capturing. `?reinforcements=1` (front-lines layout only; the 12-point map keeps one life) adds fresh whole squads, nothing more:

- **Pool:** one fresh squad per base of the side (three each).
- **Trigger:** the side's own losses. Each time its dead reach another full squad's worth (`SquadAI.COMPOSITION`, ten men) beyond the squads already sent, one squad is due. There is no wave clock; the check rides the General's existing tick.
- **Where:** a held objective of the rearmost line the side holds any of (normally a base, `BattleFrontLines.rearmostHeld`), in turn. Never one with a live enemy soldier inside its capture radius (the true position, as invariant 8 of `docs/plans/reinforcement-forward-spawns.md` asks); with none clear the squad stays due and the block is reported once (`strategic-reinforcement-blocked`).
- **What it is:** an ordinary squad built by the infantry-squad unit module. The General briefs it like any squad without a mission; it takes a truck only if one is parked or stopped nearby, otherwise it walks the roads. No new movement writer, order path or timer.
- **Base stamp:** the fresh squad's `homeBaseObjectiveId` (and `homeBaseId` when it enters on a base) is written once, in `reinforce()` right after the unit module builds it, on that new squad only. The only other writer is `battle-sim.js` spawnSide, once per opening squad at battle start; nothing writes either field during the battle, every other module only reads them (checked 10-19; wire map roles owner and `spawn-stamp`).
- **A sortie per fresh squad (opt-in `?reinforcementSortie=1`; the owner kept the trial as first built on 10-18):** each arrival earns its General one more air sortie, asked for at once, and the fresh squad gets no brief while that sortie is in the air, so the report can send it to an ambush post instead of a capture (it counts in the sortie key of `59-strategic-aerial-recon.js`; a sortie that never launches holds nobody).
- **Not in the trial:** individual soldier respawns, the reinforcing/rejoin lifecycle, forward hardpoints, HLL-style tickets or a different battle end (the time-limit score and a side with no men still decide it). Those stay in the reinforcement plan.

`battle/modules/21c-strategic-reinforcements.js` is the one owner; `scripts/check-strategic-reinforcements.cjs` covers it. Telemetry: `strategic-reinforcement` (faction, wave, squad, objective, losses) and `BattleStrategicReinforcements.summary(sim)`.

## Light trucks for phones — October 18, 2026

The owner's iPhone reloads the page after a few minutes. Measured under phone emulation, the truck model (191 meshes, 138 materials, 136 textures) was copied whole for each of the 12 trucks. Light trucks are the default; `?truckLite=0` restores the full copies. Presentation only: no movement, transport, sight or fire reads any of it, and a battle plays out the same with the flag on or off.

- Each truck is an instance of the one imported model, so each mesh of it is one draw for the whole fleet.
- On a phone (coarse primary pointer) the truck's textures are capped at 256 px (`?truckTex=<px>` sets the cap, 2048 keeps them full size), like the soldiers' `?soldierTex=`.
- A truck too far away to cover 3 pixels of the screen is not drawn; its riders and the vehicle itself are untouched.

Phone emulation, start of a meeting battle: 1,893 draws to 365, truck textures about 101 MB to 19 MB.

## Truck crews, boarding and the reload breadcrumb — October 19, 2026

From the owner's phone test of the light trucks:

- **Crew eyes (`?crewEyes=0` restores blind passengers).** Men on a truck still look out (squad-ai perceive runs for passengers; they never shoot or move from there). A man with an enemy in his own sight stops the truck and the squad dismounts (transport end reason `crew-sighting`). Two enemy trucks meeting on a road now stop for each other instead of driving past: staged head-on 300 m apart on one road (meeting-0001), the US truck stopped after 6.4 s at 147 m and the German after 7.0 s at 142 m, each on its own crew's sighting; with `?crewEyes=0` they drove through each other. On 8 fresh seeds (meeting 0004-0007, us-defend and ge-defend 0004-0005, 600 s) every one of the 10 crew stops was American: no German truck came within 270 m of a live US soldier while driving (closest 274-1161 m), so the one-sidedness is exposure, not a German-side fault. Winners show no consistent swing (US won 4 of 7 meeting battles either way). Nothing beyond what that crew sees is used.
- **Boarding (`?boardFacing=0` restores the slide).** A man walking to his seat turns to face the way he walks and plays his walk; the transport still moves him.
- **The "second truck" at departure** is the base's other parked truck (two per base). A real case from a later export: two of a side's trucks briefed down the same road parked in one turnout, so when one drove off the other looked like a clone left behind. **A turnout holds one truck (`?truckSpacing=0` restores the shared spot):** the shoulder is refused while one of the side's own trucks stands there or is driving to it, and the truck stops at the next turnout back along the same road. Own side only.
- **Truck handling (`?truckPhysics=0` restores the constant-speed, snap-turning carrier).** The carrier in `58-strategic-abstract-transport.js` (still the one owner of truck and rider positions) now drives the truck as a body: it steers toward a point a little down its path, turning no tighter than its wheelbase and 35 degree steering lock allow; it pulls away and brakes (about twelve seconds to road speed, 0.3 g braking), slows for bends to what 0.25 g of sideways grip allows and stops gently at its turnout; on roads the driver drifts and corrects within a tenth of the road width, a smooth function of the truck's id and distance driven, so seeded battles replay exactly. A steering step onto unsafe ground falls back to the exact path step. Trips take a few percent longer than the planned drive time (113 s against 107 s on the 1.2 km test road).
- **Reused trucks (`?truckOnRoad=0`, `?truckStaysPut=0`).** A stopped truck already on a road into its squad's goal, past that road's entry, drives on from where it stands (the same read as `roadFromHere`, from `BattleFrontLines.alreadyOn`); before, a truck that had dropped its squad 180 m short drove back to the base end of the road and down again to the same spot. From 180 m out that leaves no ride worth taking, so the squad walks on. A reused truck whose new trip ends before it moves stays where it stood; before, it jumped to its base bay. On four local lines battles (900 s) round trips went from 10 to 0 and jumps from 2 to 0.
- **No donuts (`?truckReach=0`).** The truck steered for a point a turning radius down its path and only passed a waypoint by driving over it. Out of a base bay (the join 12 m beside the truck) and at the hairpin where a base road meets a forward line's road, that point sat inside the circle of its tightest turn, and the truck circled it on full lock, up to five times, until something moved the point on. The driver now steers for where the path leaves a circle two turning radii across round the truck (outside both turning circles) and counts a waypoint short of the stop as passed once it is inside that circle. Four local lines battles (1200 s): trips turning more than a full circle in 40 s went from 5 or 6 per battle to 0.
- **Retreat strides (`?retreatStride=0`, all battles, not only strategic).** A retreating squad's anchor moves in 13 m strides (`ORDER_STRIDE`); the next one used to come only when the squad centre had closed on the anchor or every man stood at his slot, so the leading men ran 13 m, stood, and ran again. The next stride now comes once the squad is making progress and its first man is as near his slot as an advancing squad's men are when their next stride comes (`ORDER_ARRIVAL_RADIUS`, 8 m), as long as the centre is within a stride of the anchor. One local battle with squad retreats: time stood between strides 70 s to 13 s, mean run 5.6 s to 7.3 s. Lone fled men waiting at their refuge are the fled-man design (`FLED_WAIT`), unchanged. Needs a tactical flag pair before it goes anywhere near #559.
- **On from where the truck left it (`?roadFromHere=0` restores the walk back).** A squad re-briefed while already out on a road into its line (past that road's entry objective and nearest to that road) keeps that road from where it stands. Before, the split-roads rule routed it back through the road's entry, which for a side road is the base: Ivan saw squads ride towards the centre, then walk home.
- **Foot/vehicle handoff.** Force Command checks nearby free trucks on an accepted foot mission as well as at initial briefing; the objective and mission version stay unchanged. One ride attempt per brief prevents a stopped/blocked trip from repeatedly boarding itself. Boarding invalidates the suspended infantry navigation cache. After a driven trip ends on arrival or interruption under the same brief, the Squad Leader resumes the reached road segment, keeping untravelled corners instead of comparing distance to the final objective. World Debug omits passenger foot paths/slots and cached routes for superseded destinations.
- **Reload breadcrumb (`?breadcrumb=0` off).** Every 5 s the page writes a small load record (scene meshes, textures, materials, trucks, battle time, heap where the browser reports it) to localStorage and marks it closed when left normally. If the page opens to an unclosed record from the last half hour, a banner shows it (tap to copy). Diagnostics only.

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

## Full-screen tactical map and actionable aerial reconnaissance (draft #562)

- Reuse the **full-screen WWII command map** developed in draft [PR #499](https://github.com/APPARANYX/grasstex/pull/499): field-paper public terrain/roads/buildings/cover, objective labels, blue friendly symbols, red **reported-only** enemy contacts, confidence/age/source sidebar, zoom/pan and mobile view. **M** or gamepad **D-pad Right** opens it, **Escape** closes it; opening suppresses soldier firing and fly controls.
- Touch uses one finger to pan and two fingers to zoom around their midpoint; lifting one finger continues panning. The map fits the dynamic phone viewport, and its sidebar scrolls on short landscape screens. Browser QA checks portrait, landscape and tablet bounds and gestures in Chromium and WebKit.
- Remove the always-visible 252 px strategic minimap and its direct enemy-squad transform sampling. Never show both armies' exact live positions just because the player is spectating.
- On a strategic battle with `aerialRecon=1`, the map offers a **Request Air Recon** action after deployment begins (5 simulated seconds). It spends **the same one authorized sortie** as the General's automatic doctrinal reconnaissance; a used sortie never refreshes or refunds on expiry. The AI General continues to obtain the same frozen, faction-local report if its authorized opportunity occurs before player action.
- The reported map displays only `BattleAerialRecon.forGeneral(sim,faction)` for the chosen/possessed perspective. An air fix is **35 m quantized**, carries a **40 m uncertainty halo**, measured speed and approximate heading, and expires after **45 simulated seconds**. Hidden/ambush formations remain unobserved. **Exposed stationary** formations produce lower-confidence **position-only** fixes (speed 0, heading null), not fabricated movement estimates; the General's moving-corridor interception scorer correctly declines them. Air sightings are intelligence, never automatic targeting or a combat command.
- **Acceptance (native browser now asserts at least one visible true air-recon fix, not merely a consumed sortie):** on actual 5 km browser build the minimap DOM is absent; the full map opens/closes, scales to 5 km, renders ordinary faction reports without actor truth, obeys player faction lock, and an early human action spends a single genuinely sampled sortie with a visible fading report. Preserve OFF-mode, existing aerial General decisions and restart privacy. No physical aircraft visual, new fuel economy or reusable flight budget is asserted.

---

## 5 km player QA camera travel — October 16, 2026

To navigate and inspect the larger strategic map in **free-fly spectator mode** without changing infantry movement or smaller-map controls, keyboard **Shift** and gamepad **RB** share the strategic fast-flight speed of **420 world units per second** (previously 175). Normal free-flight remains 68; smaller maps' fast-flight remains 175; existing wheel/D-pad throttle and LB precision controls stay as before. A dedicated `camera-strategic-fast-flight-check.js` asserts these distinctions. This is a player-camera presentation/control change, not a gameplay transport or soldier-speed change.

---

### Transport lifecycle playtest adjustments (draft #561)

The user-observed early-transport and presentation contract is now:
- Second actual base truck departs **35 simulated seconds after its lead's capture brief**, if the General's faction-local reports do not identify known enemy pressure; its launch does not wait for objective ownership. A known hostile-held objective is never treated as uncontested.
- Forward screen drives through the real road graph to a **25 m standoff from its ahead-of-objective observation post**, unlike standard assaults that retain 180 m. All transport missions include a verified **11 m drive onto a clear shoulder** before unloading, not a teleport or a road-blocking abandoned vehicle.
- The same existing ten soldiers approach the vehicle, then enter **one at a time** in deterministic driver-to-rear seat order, with 0.8 s minimum separation between seat occupancy events; no new soldier rigs, actor duplication or cosmetic pop-in. The native truck Chromium QA explicitly checks the rider-attachment sequence from **zero through ten** distinct occupied seats for both factions.
- A parked truck keeps its heading while soldiers board. Departures replan from the **actual parked position** and public road instead of backtracking to an obsolete home waypoint; orientation changes are driven by actual travel.
- A squad with a new General objective may take a **stopped, unclaimed same-faction truck within 200 m**, prioritizing the truck it previously used. Its onward route starts at that physical position, never teleports a vehicle to the squad. The initial six-base, twelve-truck inventory stays fixed. A stopped truck must rejoin the nearest physically connected road segment from its shoulder location before following the public road graph; no diagonal shortcut to the next junction is permitted. Because normal assault dismount occurs 180 m short of the objective, the 200 m pickup radius accommodates returning to the original truck. Boarding timeout scales with the actual approach distance and sequential seat interval for accepted missions; an unaccepted mission still expires on the original 35 s cap.
- Do **not** merge this draft into #559 or #545 until regressions and native Chromium evidence verify each behavior; no change to garage/respawn roadmap or `main`.

---

## Purpose-first lead and forward-screen doctrine — October 16, 2026

This is the intended strategic sequence for opt-in Phase 3B in [draft #559](https://github.com/APPARANYX/grasstex/pull/559). **Do not merge into main or claim natural ambush acceptance without real-seed proof.** Keep the already verified **two existing trucks per base** (six bases, twelve trucks total), parked and visible at load. No random-spawn vehicles, new garage mechanic, or scripted enemy contact.

1. **Lead, first:** The first combat-ready squad at a base accepts a normal capture/secure objective brief. It takes one real parked transport and travels to the assigned objective using the existing 12 m/s road carrier and 180 m pre-goal dismount.
2. **Second squad has a conditional purpose:** If a distinct second squad actually started at the **same** base, assign it a genuine short-term forward-screen follow-on brief; a lone squad cannot be idled under a fictitious reserve. Its own second truck must already exist.
3. **If the objective is contested:** If friendly physical contact or recent *friendly-reported* enemies near the lead objective establish resistance, use the available second truck to **reinforce the contested capture**, not blindly pass the threat. Normal Squad Leader movement/combat authority applies.
4. **If secure and no known contact:** Only after the objective's public control is friendly, the lead is physically near it, and no recent credible friendly report identifies local enemy pressure, send the second squad down a connected forward road roughly **215–340 metres beyond that objective**. An absence of reports is *not* omniscient proof of safety.
5. **Physically establish the screen:** The second squad drives, dismounts, walks the final leg, sets a real post, and observes from there. No virtual scouts or scripted ambush occupancy. Infantry retains independent LOS and weapons.
6. **Report before ambush planning:** The actual Soldiers' **firsthand** stored contact observations move upward through the faction-local tactical report reader. Hearing/secondhand reports do not count as fresh firsthand motion evidence. A direction/speed inference needs **two observed positions at distinct times**; sightings without sufficient motion remain useful reported sightings, **not valid future-route predictions**.
7. **General chooses:** Using only those reports and public roads, the General scores a future intercept point, actual friendly foot travel from the screen, setup budget and uncertainty, and predicted enemy ETA. **Only issue an interception if the friendly squad can arrive first**; the physically established screen can itself hold an already advantageous watch position. Existing aerial recon may supplement intelligence but cannot steal the second squad from its intended mission.
8. **Authority and limits:** General owns mission intent, Squad Leader owns road/foot execution and post establishment, Soldier/Engagement owns perception, aim and firing. No automatic LOS, magical enemy destination, new truck generation, respawn, garage, or covert target-order injection.

**Acceptance to collect:** Per-base lead/screen assignment; second real vehicle ownership; evidence-backed contested vs secured branch; forward post ahead of objective; actual traveled/dismount/on-post stamps; provenance-separated contact relay; two-sighting route inference; physical intercept before enemy; normal combat acquisition; zero duplicate vehicles or hidden intelligence; seed-matched OFF control and restart cleanup. Existing green CI for basic Phase 3B does not establish these additional native outcomes.

---

### Native 40-second mission-ownership correction

Earlier meeting-seed triage found that two squads were *eligible* for forward-screen duty but every squad had already been committed to a capture truck by 40.05 s. The block was not a late ETA or route obstacle: ordinary `request-changed` and `reserve-commit` reconsiderations displaced the intended second-truck reservation. The corrected opt-in command path now:

- assigns the purpose-first screen brief on the second squad's **initial** Macro mission (not only after a reserve already exists);
- protects the explicit second-truck reserve *ahead of* ordinary catalog/request wake reasons;
- uses the reserve only after the lead reaches a genuinely uncontested objective, or uses its truck to reinforce a genuinely contested lead;
- releases an unfulfilled reserve to normal General reconsideration after 600 simulated seconds to avoid permanent idling.

**Evidence status:** dedicated deterministic mission checks cover the physical 12-vehicle inventory and report provenance. The *native* long-horizon screen, intercept and contact chain remains subject to ON/OFF browser proof; do not convert diagnostic CI green into an accepted natural ambush claim.

---

## Phase 3B implementation checkpoint — event-driven interception proposal

**Draft child [#559](https://github.com/APPARANYX/grasstex/pull/559); not yet accepted or merged.** Opt in to `?strategicInterception=1&motorTransport=1&aerialRecon=1&interception=1`. Default-off behavior and parked #527 are unchanged.

- Aerial module #549 remains the **sole permitted hostile-truth sampler**, runs at most once per General and exposes only expiring, uncertain, faction-specific observation DTOs.
- The General ranks public road edges near moving, sufficiently confident aerial sightings. Contact direction identifies the approaching road segment; potential objectives are **inferred**, never obtained from the enemy's hidden mission. Watch positions lie ahead of the observed enemy and before the next road fork where feasible.
- Access can use either road endpoint; a base truck cannot shortcut through terrain. A **side-effect-free quote** in the existing #558 transport allocator tests available parked vehicle, actual road path, obstacle clearance and minimum 650 m driving distance. Quote uses actual 12 m/s road travel, boarding, 180 m foot dismount approach, preparation, and conservative uncertainty margin. Rejection if the friendly squad cannot arrive first.
- Only the Macro / General mission owner issues `intent=intercept, action=intercept` via its normal lifecycle. The Squad Leader adopts the road legs and records a physical on-post position before holding. Soldiers retain their own LOS, combat decisions, animations, and fire; no automated first shot or artificial enemy coordinates.
- The one aerial event is evaluated only once per faction; no artificial reruns. Expired intercepts return to normal General mission choice without assuming repeated reconnaissance.
- **Evidence needed before acceptance:** deterministic causal quote/selection/decline tests; full CI and tactical/strategic browser compatibility; paired native seed runs with real vehicle dispatch, vehicle journey, on-post arrival and enemy corridor arrival (arrival lead must be genuine), firsthand enemy reacquisition and ordinary independent firing. No forced scenario, forged intelligence, scored tactical success, or relaxed casualty/mission acceptance metric.

This slice intentionally does not add garages, vehicle respawns, replacement soldiers, airborne insertion or a new infantry fighting system.

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

Do **not** modify/merge legacy #527 or its experiments, normalize their acceptance metrics, add respawns (beyond the flagged reinforcement trial above), route-memory ground-scout ambushes, parachute insertion, full vehicle physics, free tactical map reveals, scripted enemy movement, or any hidden actor-position access outside the one bounded aerial observation event.
