## Battle Sim architecture: M3C (Macro / Meso / Micro Combat)

**Prime rule: one owner per responsibility.** Fix a bad behaviour at the layer that owns it. Don't
stack cooldowns, blockers, retries or extra movement writers to make one counter improve. A fix is
good if the system is easier to explain afterwards. `wire-map-check.js` holds the rule: every squad,
soldier or Engagement-record field that more than one file writes is listed, with a role and a reason,
in `tools/ai-sim-harness/fixtures/wire-map-baseline.json`, and the list only shrinks. A new writer
file needs an entry there, which a reviewer sees; a fix that removes a writer must remove its entry.

`General (Macro) → Squad Leader (Meso) → Engagement → Movement Resolver → Movement Execution → Navigation`.
Intent flows down and status flows up. No layer rewrites another's state.

| Layer                              | Owner (file)                                                                                                                                                                                                                                                                     | Owns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Must not                                                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Macro: Force Command               | `commander-ai.js`, `commander-doctrine.js`, `commander-routes.js`                                                                                                                                                                                                                | `_macroMission` brief {intent, action, objectiveId, point, flank leg, status}, `targetObjective`, `commandRole`, force allocation, reserves                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | write `commandPhase`/`objective`/route legs, cover, slots or soldier destinations                                         |
| Meso: Squad Leader / Squad Command | `modules/16-squad-plan-stability.js` (`executeMission`, `fireAndMovement`; SquadAI's `squadCommand` owner)                                                                                                                                                                       | stable squad plan: fireteams, formation, order anchor, fire and movement (assault authorisation, bound cycle and team), corner pauses, defensive posts, regroup, the forward line (`sq._forwardLine`), objective phase; the only writer of `commandPhase` (setup states it through `initialPhase`); the only publisher of the anchor pair `orderAnchor` + `rally` (`BattleSquadStability.publishAnchor`: its advance, its regroup, the General's merge and the garrison setup all call it); the roster (`squad.members`, `soldier.squad`: `reform` and `disband` for a merge, `detachFled` for a man who has fled, `absorb` for one a retreating squad takes in) and the squad's `safePoint` | do obstacle avoidance; republish orders every tick                                                                        |
| Micro: Engagement                  | `engagement.js` (+ `modules/44-combat-urgency.js` drills on its `afterDrill` slot)                                                                                                                                                                                               | per-soldier state machine, stance (`prone`/`crawling`/`tacticalCrouch`), permission to fire, combat proposals to the resolver, the squad contact report (`inContact`, base of fire, pinned, and the men reacting to stress), the stress reactions (`cower`, `flee`, `freeze`, `rage`, behind `?stressAct=`), the fled man's phases and the decision to leave his weapons (`BattleWeapons.abandon`) and take a new one at base (`SquadAI.rearm`); reads each man's Perception-owned picture through `SquadAI.soldierContact`                                                                                                                                                                  | write final destination; pick objectives; decide squad bounds; promote squad aggregate contact into personal truth        |
| Perception + shared primitives     | `squad-ai.js`                                                                                                                                                                                                                                                                    | who sees whom (view cones), per-man `soldier._beliefs` (seen/told/heard facts with provenance, confidence and expiry), the aggregate upward `squad.contact`, gunfire memory, shot resolution and `areaFire` suppression; `SquadAI.soldierContact` is the personal read API and `resetPerceptionBattleState` owns battle-lifecycle cleanup; hosts the declared extension points (`SquadAI.extend`) and `BattleLeases`; a status-only squad update when no `squadCommand` owner is loaded                                                                                                                                                                                                      | set stance/destination in combat; let presentation or hidden truth validate/upgrade a belief                              |
| Soldier condition                  | `modules/17-soldier-mind.js`                                                                                                                                                                                                                                                     | `soldier.mind` (stress, band, shock) and the `squad.mind` roll-up: what suppression, wounds, casualties, leadership and company do to a man; the four modifiers Engagement and the shot model read                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | write stance, destination, target or another layer's timer; draw the combat RNG                                           |
| Soldier stats                      | `modules/10-soldier-stats.js` (`BattleSoldierStats`)                                                                                                                                                                                                                             | `soldier.stats` (six hash rolls of faction and id) and `squad.stats` (means over the living): the numbers the reading layers price, and the ranks the General reads                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | write any timer, stance, destination or another layer's state; draw the combat RNG                                        |
| Tactical positions                 | `modules/20-building-hardpoints.js` (`BattleTacticalPositions`: `claim`/`current`/`station`/`release`)                                                                                                                                                                           | window/hardpoint reservations `assigned→ingress→occupying→holding→released`, committed ingress route                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |                                                                                                                           |
| Window firing port                 | `battle-navigation.js` (`station.port`, `aperture`, `inSector`, `rejectedWindows`) with Engagement's `station`                                                                                                                                                                   | the aperture geometry (sill, head, jambs, the anchor, the stance the sill fits, the exterior sector) and the per-tick question of whether his eye and his bore pass through it; the post itself, its bounded local pose (`t.pose`) and the aperture report (`t.aperture`) are the Tactical positions manager's record                                                                                                                                                                                                                                                                                                                                                                        | assign or release a window, pick a destination, write another layer's state; bypass the wall (LOS elsewhere is unchanged) |
| Tactical routing                   | `modules/52-survival-tactical-route.js`                                                                                                                                                                                                                                          | safe ingress, suppressed cover detours                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | resurrect an obsolete objective                                                                                           |
| Movement Resolver                  | `movement-resolver.js`                                                                                                                                                                                                                                                           | **sole normal-runtime writer of `soldier.destination`**; coalesces Engagement's per-tick combat requests and arbitrates Meso vs Micro proposals                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | act as a garbage collector for redundant producers                                                                        |
| Diagnostics                        | `modules/36-order-provenance.js` (writer provenance, fast setters, 1.6 s in-place sampler), `32` Loop Watch, `43` forward progress, `99` the one diagnostics exporter (full, loops and orders via `BattleDiagnosticsExport.snapshot(kind)`; `38` only adds its AI Graph buttons) | observe only: removing them leaves a battle identical (~4% wall time); Loop Watch evaluates squad order churn only within one movement authority, so phase/recon/mission-hold handoffs and retreat ownership are not stitched into a false command loop                                                                                                                                                                                                                                                                                                                                                                                                                                      | change gameplay                                                                                                           |
| Navigation                         | `battle-navigation.js`, `modules/39-navigation-physicality-debug.js`                                                                                                                                                                                                             | doors, stations, pathfinding, 0.45 m body legality                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | assign or release tasks                                                                                                   |
| Personal space                     | `modules/51-soldier-personal-space.js`                                                                                                                                                                                                                                           | local physical correction                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | own commands                                                                                                              |

The Squad Leader declares its 11 execution phases in `BattleSquadStability.states`; setup,
mission execution and regroup all enter through `transitionPhase`. A replacement brief may select
any phase, so legality comes from the mission/route/lease guards rather than a restrictive phase-only
adjacency. Retreat remains `sq.state`, not a `commandPhase`.

Brief lifecycle: `issued → executing → completed | invalid | failed | superseded`. The General
wakes only on: initial brief, mission complete or invalid, reserve due, a defence request that
changes the task, an objective vacated or changing control on a defend brief, a 120 s strategic
stall (`STRATEGIC_STALL_REPLAN`, the one stall clock: the coordination-health sampler's `replanDue` is that same number read from the General, an export flag nothing reads), a Squad Leader `doctrine-review` escalation, or a merge (`squad-reconstituted`). Wakes are
exported under `macroCommand`.

Strategic-recovery validity and lifecycle (module 22a, the strategic-freeze fix): the stall
ladder (reconcile 120 s → release 180 s → main-effort 240 s → reset 300 s of faction objective
stall) is one pass per episode, the episode keyed to the last objective progress — and a side
that recovers nothing makes none, so the ladder alone could leave a front unreviewed for the
rest of the battle. Three lifecycle rules close that without touching Squad Leader ownership:

- a later stage holds (bounded by one 60 s adoption window) while a brief the previous stage
  published is still young and unaccepted, instead of superseding an in-flight adoption;
- once the ladder is exhausted, a review pass re-runs the reset population every
  `STRATEGIC_STALL_REPLAN` of continued stall — deterministic cadence, never a new timer. The
  population still excludes useful defenders and squads with a measurable-progress pulse, and a
  pass that re-derives the identical brief is deduped into a recorded ineffective wake
  (`recovery.history` stage `review` with `pass`/`issued`/`ineffective`), so a static world
  produces no churn;
- a strategic reset that keeps the squad on its failing objective re-briefs it through the
  objective's flank point rather than re-deriving the identical brief (which `issueMission`
  dedup would leave in place — the no-new-brief lock). The flank point is a deterministic
  function of objective and squad, so the rule is stable: an unmoved squad re-derives the same
  key and dedups; only a changed decision (another effort, an owner flip) produces a new brief.
  Resets that switch objectives are untouched, and the stalled objective is never excluded —
  with every effort stalled it may still be the correct one.

The sampler (module 40, `2.1-strategic-chain`) also publishes
`strategicChain`, an observation-only reconstruction of the chain a stall recovery depends on:
per faction the last time each link moved (objective change and progress, brief issued, Squad
Leader acceptance, local phase change, measurable movement toward the mission point, stall
detection, stall wake, recovery stage), one outcome record per strategic-family wake (the brief
before and after, whether a new brief was generated or `issueMission`'s dedup left the old one,
acceptance, local phase change, and whether objective or point progress followed within the
General's 120 s replan window), and a census of squads whose executing mission has shown no
point progress for longer than that window (owner and vacancy recorded, never a verdict: an
empty objective alone is not evidence of a stale plan). It rides the full-diagnostics export and
the benchmark record's `coordinationHealth`; nothing in the runtime reads it
(`strategic-chain-check.js`). `commander-ai.js` declares the lifecycle as `missionStates`; every
write, including a Squad Leader acceptance request, goes through `transitionMission`/`acceptMission`.
Terminal records cannot reopen; a new issue creates a new brief object.

<details>
<summary><strong>Completed foundation: Macro/Meso command, reconstitution, morale + COA</strong></summary>

**Main effort** (`commander-doctrine.js` `chooseObjective`, Macro only). Saturation (55 per squad past
an objective's allowance) stops a side piling onto one objective; the frontage limit stops it spreading
over all of them. A side attacks at most `maxEfforts` (2) objectives it does not hold at once; opening
another costs `frontageCost` (140), so the next squad reinforces an open effort. Taking an objective
closes its effort. Defending owned objectives doesn't count. A strategic-stall wake closes the
efforts its stalled capture briefs were on: each costs `stallCost` (150) and no longer fills the
frontage, so the side masses on new objectives (`commander-ai.js` `stalledEfforts`; outcomes under
`macroCommand.state.stallOutcomes`). All three are scores, never vetoes.

**Reconstitution** (`commander-ai.js` `reconstitute`, Macro only). SquadAI owns the shared
survivor-remnant boundary (`REMNANT_EXTRACTION_MAX = 4`), which Force Command exposes as
`RECON_POOL_MAX`. A retreating squad with 1-4 living men is no longer a tactical formation: until a
real reconstitution brief moves its assembly state to `to-rally`, the Squad Leader pins its anchor to
`home` and gives every survivor the same homeward **survival fallback**. That fallback is continuation
of the already-entered retreat state, not a new tactical command, so it does not require a scattered
man to remain inside voice/visual Command Reception range. It opens no local morale-rally recovery and
never uses the sliding retreat-anchor/recentring path. A dazed, frozen or otherwise delayed survivor
may lag; men already farther rearward are never ordered back toward him. Navigation still legalizes
each man's route around terrain. A later `to-rally` reconstitution brief is a real new command again:
home remains the live fallback while that replacement is pending, and Command Reception takes movement
authority back only when the reconstitution order is personally adopted. Once the remnant reaches home and is out of
contact it is `at-base` and waits in the survivor pool. Five or more survivors remain a viable squad
and keep the ordinary retreat-anchor / morale-recovery behavior. Reconstitution needs at least 6 combined survivors
(`RECON_MIN_STRENGTH`) and never splits a source squad or reconstitutes one remnant with itself.
The General chooses geographically coherent remnants rather than simply taking the strongest first:
for each possible seed it adds the nearest remnant to the moving centroid until the minimum is met,
then selects the candidate with the smallest worst source-to-centre march (then total travel, then
fuller strength). A candidate is rejected when its neutral meeting point would require any source to
travel more than 300 m (`RECON_MAX_CENTER_TRAVEL`). This prevents a rear-left remnant from being bound
to a rear-right remnant merely because their combined manpower is sufficient.

The rendezvous is based on the grouped squads' actual at-base positions, not their historical home
lanes. From that neutral centre the General projects toward the objective it expects to task next and
slides the meeting point forward only while every source squad's route remains within 115% of its
straight route to the neutral centre (`RECON_FORWARD_DETOUR = 1.15`), with an absolute 180 m cap
(`RECON_FORWARD_MAX`). For two squads this is the Pythagorean hypotenuse budget; the same direct
distance test generalizes it to three-plus remnants. The brief carries the selected objective only as
`plannedObjectiveId`, never `targetObjective`, so retreating squads are not counted at the objective;
after the merge the General sends the rebuilt squad there unless control changed
(`to-rally`, `SquadAI.retreatGoal`). Diagnostics expose waiting survivors/source positions, whether
enough manpower exists but geography blocks grouping, and each formed group's neutral centre,
maximum centre travel and forward shift.
Once all are there the General merges them: the strongest squad with a living leader survives,
otherwise the most senior survivor is promoted (ex-leader, rifleman, scout, gunner last). The re-formed
squad has `leaderId`, `establishment` 10 and only living members; absorbed squads are `disbanded`.
Command is `SquadAI.leaderOf`/`isLeader`, never a role check. **Succession** (Squad Leader,
`updateSuccession`): a squad whose leader is killed is leaderless for the 6 s `succession` lease
(leaderless cohesion/corner rules, 0.8 accuracy), then `SquadAI.mostSenior` (sergeant, rifleman,
scout, gunner last; lowest id breaks ties) takes command and slot 0 and the penalty ends. At a merge
the most senior surviving leader commands.

**Group morale and course of action** (`modules/16-squad-plan-stability.js`, the Squad Leader; read once at load from
`location.search`: both are **on by default**; `?morale=0` restores the flat retreat rule and `?coa=0` disables COA gating). Group morale replaces the flat 60% casualty retreat in
`updateSquadState`: a squad breaks (`sq.state = 'retreat'`) at `breakBase` (0.6) minus `breakSlope` (0.3) per unit of
`squad.mind.mean` stress, never below `breakMin` (0.25), so calm men break exactly where they did before; a retreating
squad goes back to `engaged`/`advance` only when mean stress is under `rallyStress` (0.15) and its casualty fraction is
under the break threshold at that stress less `rallyGap` (0.05), so it cannot break again on the same inputs. Casualties do not heal, so a squad that broke at 60% rallies only if a merge restores its strength.
The squad mean reaches it through the soldier condition's `morale` lever (`BattleSoldierMind.squadStress`), so `?mind=0` and `?mind=observe` leave the flat rule alone.
The numbers are `BattleSquadStability.tuning.morale`. With COA on by default, on every tick the squad is in contact the Squad Leader
scores the declared COAs (`COAS`: `assault`, `defend`) against declared inputs (`COA_INPUTS`: casualty fraction, mean
stress, leader down) with declared weights (`COA_WEIGHTS`), keeps the winner as `sq.coa` and draws no random number; a
tie goes to the first name, `assault`. `defend` clears `_assaultAuthorized`, which
holds the bounds in `fireAndMovement`; `assault` changes nothing else. With the shipped weights `assault` wins while
`2.5 x casualties + 1.5 x stress + 2 x leaderDown <= 1`: a squad without a leader when contact starts defends for that
contact, and calm men defend from 5 casualties of 10. `sq.coa` is set on each in-contact tick, is never cleared and is not
in the diagnostics export. `morale-check.js` and `coa-check.js` exercise both flag-on paths and the `morale-decisions` and `coa-decisions` probes
measure them (60 battles and 600 squad-battles per arm, 2026-09-30, numbers in #133; every decision was re-derived from its
inputs with 0 mismatches bar 3 of 14,661 COA scorings, a succession resolving in the same tick). **Morale:** a ten-man
squad's casualty fraction moves in 0.1 steps, so the lever can only differ from the flat rule at mean stress 1/3 with 5
casualties, 2/3 with 4 or 1.0 with 3 (`breakMin` never binds); mean stress is 0.05 at the median and above 1/3 in 3.6%
of in-contact squad-time. On the flat rule's own battles it would touch 28 of 100 squad-battles and, for all but 8 of the
167 it touches, only retreats the squad earlier (median 5.8 s, mean 19.8 s; the 8 are retreats the flat rule never
makes). Flag on, 168 of 348 retreats come one casualty early (144 at 5, 24 at 4) and 5 squads rallied in 600 squad-battles:
a squad that broke at 5 or 6 casualties can never meet the rally's casualty ceiling (0.6% of retreat seconds are under
it, 75% are calm). The 17 merged squads all returned with mean stress under 0.15 (p90 0.07), so a merged squad staying in
`retreat` while shaken did not happen. With `breakSlope` tripled (diagnostic only) early breaks rise 2.6x and rallies
5 to 118: the lever is wired, the shipped dose is small. A rally ceiling above the break point flips a squad every tick
(diagnostic, `rallyCasualty` 0.7: about 111,000 flips in 600 squad-battles), so a reachable rally needs a gap between
break and rally. Retreat is 58 entries per 100 squad-battles either way and 54% of the retreating squads are still
retreating when the battle ends (15 to 17 merges per 600 squad-battles). **COA:** a contact starts 24 times per squad per
battle (median 0.45 s; 88% shorter than the 9 s bound-cycle wait that each start renews), so `sq.coa` was scored at each of
them, not once, until it became a per-tick evaluation (#137); 54% start in `assault` and 0.1% in `approach`; `defend` wins 25% of the starts (17% in a bounding phase; 94%
by casualties and stress, 6% by a leader down). The gate is exact: under `defend` in a bounding phase 1 bound was sent
against 4.5 per contact-minute under `assault`, and nothing set `_assaultAuthorized` again. It withholds about 6.5% of a
battle's bounds (691 to 646 per 100 squad-battles) and holds the squad in contact (`advanceSquadAnchor`: held while
`inContact` without a bound), so contacts run longer. Forcing `defend` everywhere (diagnostic only): 0 bounds, movement
stalls 35 to 16 over 60 battles (10 battles fewer, 2 more). **Standard benchmark** (prefix `ai-layers-20260929`, 100
battles per arm, branch on main `ee12d8c`, its own flags-off run as the baseline: identical to `main` in 100 of 100
records, #133): `?morale=1` changes 95 of 100 battles and moves retreat, not outcomes: `withdraw` man-samples +31% (more
in 67 battles, fewer in 28, sign p 0.0001), resolver changes +7.7% (65 to 30, p 0.0004), reconstitution groups formed
42 to 65 (p 0.006), time-limit battles 35 to 49 (McNemar p 0.016), `low-forward-progress` loops 537 to 464 (25 to 47,
p 0.013), movement stalls 40 to 42, 0 runtime errors: squads that break one casualty early leave the fight with a living
man more and, with no reachable rally, for good. `?coa=1` changes 71 of 100 and moves no efficiency counter beyond noise
(bound-state samples -3%, p 0.21; time-limit battles 35 to 39, p 0.42; 1 of 17 counters under p 0.05). Wall-time ratios
between arms (1.26 and 1.21) are not readable: the two flags-off runs, identical in every record, read 0.85 under the same
runner load. Win rates are reported and were not used for any of this. **COA per tick** (#137; both seed prefixes, 200
battles, against the flags-off run of each: identical to `main` in 100 of 100 records): `?coa=1` evaluated on each
in-contact tick, with no margin, meets the efficiency gate: resolver changes -2.6% (fewer in 120 battles, more in 73, sign
p 0.0009), `withdraw` man-samples -7% (p 0.03), movement stalls 101 to 118 (per-battle p 0.87), `low-forward-progress`
loops, stuck detections and forward-progress alerts unchanged, 0 runtime errors. It moves behaviour: bound-state samples
-10%, time-limit battles 75 to 94 (McNemar p 0.015, reported not gated), winners identical (94 and 106). Re-run on `main` at
`c7a527f` (prefix `ai-layers-20260929`, 100 battles): flags off identical to `main` in 100 of 100 records; `?coa=1` changes 95,
bound-state samples -11% (p 0.0026), movement stalls 17 to 15, `low-forward-progress` loops 553 to 540, stuck detections 226 to
204, resolver changes -2.7% (p 0.06), 0 runtime errors, wall time x0.90. One counter went the other way in all three 100-battle
runs: strategic-stall repeats 72 to 87, 93 to 97, 72 to 94 (p 0.03 on the last; 1 of 20 counters), not a gated counter. A margin on the
COA (switch only when the other leads by 0.25) was measured on one prefix and dropped: it latches squads in `defend`
(casualties never heal and stress only falls), bounds -8% and time-limit battles 35 to 52 (p 0.0023).
**Morale rally gap and morale on by default** (#142; #136 was the first attempt, closed unmerged, and its COA half is #137). A rally that
needs a gap below the break point (`rallyGap` 0.05), plus the General dissolving a reconstitution group whose member rallied, made the
rally reachable and stopped the tick-by-tick flip (a rally ceiling above the break point), but the lever still fails the efficiency
gate on 200 battles (both prefixes, each arm against its own flags-off run, flags off identical to `main` in 100 of 100 records):
`withdraw` man-samples +10.7% (more in 120 battles, fewer in 72, sign p 0.0007), resolver changes +6.7% (126 to 66, p 0.0000),
reconstitution groups dissolved 12 to 23 (p 0.03), against `low-forward-progress` loops -12% (p 0.0012) and forward-progress alerts
-9% (p 0.018); movement stalls 101 to 121 (per-battle p 0.52), 0 runtime errors. The rally stays rare (a squad is calm again by the
time it has lost its sixth man) and the cost is paid at the early break. **Re-run on this PR's branch** (#142, standard benchmark, both prefixes,
200 battles pooled, the `morale=0` arm identical to `main` flags off in 100 of 100 records on each prefix; default against `morale=0`):
`low-forward-progress` loops 1,104 to 977 (-11%, fewer in 99 battles, more in 58, sign p 0.0013), forward-progress alerts -8% (p 0.0084),
movement stalls 51 to 39 (p 0.63), retreat samples -7% (p 0.10), against resolver changes +5.8% (119 battles more, 74 fewer, p 0.0015),
`withdraw` man-samples +6.4% (p 0.014) and regroup entries +9% (p 0.063); reported, not gated: US wins 96 to 85 (McNemar p 0.15),
time-limit battles 94 to 81 (p 0.14); 0 runtime errors, 0 writer conflicts, wall time x1.03. **Owner decision, 2026-10-01: morale is on by default anyway**,
the failed gate recorded and not waived; `?morale=0` is the flat rule for any A/B. From that day a default battle has group morale,
so "flags off identical to `main`" compares against a `main` that has it, and every measurement in this file that says flags off
was taken with it off. What replaces the flat retreat in the long run is a separate design (fall back and hold), and a squad's
shakiness is to come from what its men do (Stress reactions, under The soldier layer, in slices).

**Buddy pairs inside each fireteam** (#187, Squad Leader/Meso owner). Stable pairs are deterministic adjacent-slot
relationships inside the existing command/alpha/bravo/charlie fireteams; they are **on by default** and
`?buddyPairs=0` is the legacy no-pair control. Pair identity is not command: a pair never writes a destination,
publishes an order or calls Movement Resolver. During an already-authorized bound, the Squad Leader may leave one
buddy who is already in Engagement's base of fire covering while the other takes the bound; if that condition is
not available, the existing whole-fireteam bound passes through. Casualty/fireteam changes deterministically retire
and re-pair survivors; suppression, freeze/flee/rage/cower, incompatible tactical-position work, blocked movement,
route divergence and separation only degrade cooperation. Separation/route recovery uses hysteresis plus a 1.5 s
stable-reform window, so diagnostic state does not chatter while physical movement crosses a threshold. Pair identity,
task context, separation/route gap, state/reason, break/reform timing and cover/move actors are exported through
`BattleSquadStability.buddySnapshot`; `buddy-pairs-check.js` owns the deterministic contract and the observe-only
`scripts/probes/buddy-pairs.js` measures real usage. Standard benchmark #272, 100 paired meeting battles,
`buddyPairs=0` vs `buddyPairs=1`, `contact+120`: 135 cover/move activations; 6,396 degraded episodes and 4,124
reforms across all squads (4,708 separation, 631 suppression, 338 incompatibility, 19 blocked, 12 route-diverged);
resolver changes 153,211→150,895 (-1.5%, sign p 0.001), loop alerts 59→40, movement-stall reports 26→31 in only
3 paired battles (sign p 0.25), writer conflicts 0→0, runtime errors 0→0 and median wall time x1.001 (gate 1.25).
The earlier #271 measurement exposed plan-refresh/threshold diagnostic churn (40,477 breaks / 37,980 reforms);
the shipped hysteresis/task-context fix reduced those counts by 84% / 89% before the default-on decision.

**Scouts Forward** (#196, Squad Leader/Meso owner) is **on by default**; `?scoutsForward=0` is the legacy
control. Module 16 owns one `recon` lease and its decision/lifecycle. The leader may recon an unknown objective
approach, a crest detected from terrain height, or a visual screen already represented by LOS/obstacles, but it never
queries enemy truth. A fresh, adequate _leader-owned_ `SquadAI.soldierContact` suppresses the order; aggregate
`squad.contact` is not personal knowledge. Scout selection is deterministic, scout-role first, keeps an eligible
scout buddy pair together where practical, never sends the whole squad, and draws no combat RNG. The main-body anchor
and non-scout hold points stay fixed while scout order intents flow through the existing squad-stability producer,
normal navigation and the Movement Resolver; scouts remain ordinary Engagement/Perception actors.

A scout's direct sight is a personal `seen` belief. Recon ends on reportable scout sight, other meaningful contact/
under-fire, completed observation, an 18 s timeout, retreat, leader/mission/phase invalidation or battle end. The
existing `BattleCallouts` path is the only report transport: only listeners who actually receive the message acquire
`told` beliefs; a missed/out-of-range call creates no knowledge. No-contact completion remains uncertainty. A
mission/route/goal signature prevents recon-release-recon churn on the same approach. After only a no-contact completion
or timeout, the existing `regroup-bypass` lease gives the main body at most 9 s to absorb the intentionally-forward
scout geometry and releases early when the scouts are back inside the ordinary cohesion-release band.

`BattleSquadStability.reconTelemetry` and the `scouts-forward` observe-only probe expose order reasons, selected
men, scout distance/time, endings, contact/report delivery, wait time, same-approach retrigger blocks, duplicate tasks,
main-body stop context and live anchor drift. `scouts-forward-check.js` owns the deterministic contract. Full-battle
paired benchmark run **37117876560** (36 seeds: 12 meeting, 12 US-defend, 12 GE-defend; OFF `scoutsForward=0`,
ON `=1`) passed: runtime errors 0→0, writer/strategic-writer conflicts 0→0, wall time x0.991 (1.25 gate),
route/targetless stalls 0→0, regroups 195→180, loop alerts 173→97, vacant-objective stalls 28→23, simulated duration
-2.36 s/pair, first contact +3.27 s/pair, first objective progress -2.36 s/pair, captures 60→62. ON issued 363 recon
orders: 301 observed-no-contact completions, 14 scout contacts, 9 timeouts, 36 other cancellations and 77 actually
delivered scout-report beliefs; 307 same-approach retrigger attempts were suppressed. Resolver changes rose by about
100/pair as expected from the added scout/hold/release movement, but movement stalls were 1→2 total and timeline stalled
man-seconds fell 56→20. The fixed-scenario probe was behavior-neutral in all three scenarios, with zero duplicate
same-signature orders and zero live-recon anchor drift; its meeting scenario observed a real scout-contact episode with
8 delivered report events.

**Intent-based continuation after Squad Leader loss** (#197, Squad Leader/Meso owner) is **on by default**;
`?leaderlessIntent=0` is the legacy control. The existing 6 s `succession` lease still determines when the
most-senior survivor becomes the new leader. At leader loss, module 16 snapshots the last valid parent intent:
mission/macro version, command phase, route index, objective, squad anchor, order version, plan serial/status,
fire-control state, and each surviving man's current fireteam task/destination. While no leader exists, module 16
may not invent or refresh a Meso decision: no new route leg/phase/objective/anchor stride, plan stage/review, COA,
fire-control decision, clear-contact order, recon, regroup, bound, or fireteam destination publication. Already
published Movement Resolver orders remain ordinary physical intents and can finish; an already-live bound can expire
normally; Perception/Engagement still own immediate threat acquisition, firing, suppression/stress and local survival;
retreat remains legal through its existing owner. Ordinary contact is reported through existing Perception/Callouts
channels and does **not** manufacture a special General retask during the short command gap. When succession completes,
the successor receives an explicit hand-back and normal Meso ownership resumes.

`BattleSquadStability.leaderlessTelemetry` records inherit/hand-back episodes, duration and local action classes;
the `leaderless-intent` observe-only probe checks route/phase/order-version/objective/anchor/fireteam drift and new
Meso-lease creation. `leaderless-intent-check.js` owns the deterministic contract. Final full-battle paired benchmark
run **37121639099** (36 seeds: 12 meeting, 12 US-defend, 12 GE-defend; OFF `leaderlessIntent=0`, ON `=1`) passed:
runtime errors 0→0, writer/strategic-writer conflicts 0→0, wall time x0.975 (1.25 gate), movement stalls 2→2,
route/targetless stalls 0→0, stall wakes/repeats 263→263 / 62→62, timeline stalled onsets/samples 2→2 / 6→6,
Movement Resolver changes 80,292→80,215, regroups 201→202 and long regroups 0→0. The ON arm exercised **110**
leaderless episodes totaling **633.75 squad-seconds**: 102 successor hand-backs, 7 squads destroyed before hand-back,
and 1 episode live at the time limit. Behavioral differences were small but real: casualties 833→828 and captures
49→47; first-contact/first-fire timing was unchanged.

Loop alerts rose 117→148, so they were investigated rather than ignored. The +31 alerts occur in four affected pairs:
**+27 are existing posture-churn diagnostics** (Engagement/stance ownership), while the remaining +4 in one meeting
seed are 2 order-churn, 1 position-seeking and 1 low-forward-progress alert during a changed downstream trajectory.
That seed still has zero movement/route/targetless/timeline stalls and finishes substantially earlier; aggregate
stall wakes/repeats remain exactly flat, so no new succession/release command loop was found. Targeted read-only probe
run **37122188486** then exercised **56 non-retreat leaderless samples** on known affected seeds and found 0 route-index,
phase, order-version, objective, anchor, fireteam-destination or new-Meso-lease violations, with 0 m max anchor/objective/
fireteam drift; both probe battles matched their probe-free controls exactly.

</details>

<details>
<summary><strong>Completed foundation: ranks, perception, soldier mind/stress, events + stats</strong></summary>

**Ranks.** The squad leader is the `sergeant` role (US Staff Sergeant, GE Unteroffizier); the Meso
layer is the Squad Leader (`squad-leader`: `squadCommand` owner and lease owner). "Captain" is only
the company echelon in `00-battle-sides.js`. Names that stay `captain*` on purpose, because stored or
exported data uses them: the policy keys `captainlessCohesion`, `cornerNoCaptainExtra`,
`captainDead` (server genomes, `battle_policy.php`), the telemetry and wake names
`decision-captain-request` and `captain-request`, the export keys `captainAlive`, `captainRequest`,
`captainWindowAssignments` and `captainlessSamples`, the module file and system id
`13-captain-command-throttle`, and the trait seed in `11-soldier-individuality.js` (it still hashes
`captain` so existing seeds replay the same battle).

**Perception** (`squad-ai.js`, `SquadAI.PERCEPTION`). Target stance is a real concealment signature:
standing 1.00, crouched 0.60 and prone 0.35 of the observer's stance-scaled range; movement adds 0.18
(`?stanceVis=0` restores the old 1.00 / 0.72 / 0.45 + 0.22 curve for A/B work). A man spots at his full stance-scaled range
inside ±60° of where he looks, at 35% of it out to ±100° (55% for a moving man), and behind that only
within 10 m; he looks where his body faces, or at the squad's known threat if a ≤70° head turn reaches
it. Holding still with no known threat he scans his sector: his look sweeps `SCAN_SWEEP` (40°) either side
of his body and back every `SCAN_PERIOD` (8 s), each man on his own phase, on sim time and his id, never
the combat RNG. The sweep stays inside the 60° focus, so his front is never out of focus (a 70° sweep
lost the man straight ahead: `run.js` seeds 6 and 23). Tracking a man he already has is not cone-limited. Personal threat beliefs are now the shipping behavior
(`?soldierBeliefs=0` is the legacy shared-contact control). Perception owns `soldier._beliefs`: direct sight creates
an exact `seen` fact; an actually delivered tactical callout can create a `told` fact; personally heard enemy gunfire
can create a lower-confidence, imprecise `heard` fact. Facts carry source/provenance, location/sector, observed/reported/
received time, confidence and expiry; unknown is valid, direct sight outranks weaker information, and stale memory expires
without asking hidden live truth whether it is still correct. `SquadAI.soldierContact(s,battle)` is the consumer view used
by Engagement, combat urgency and tactical routing. A told/heard point never becomes an exact hidden target merely because
the target object still exists.

`squad.contact` remains Perception's aggregate picture **upward** for squad/commander status: its own sightings, else a
friendly squad's first-hand sighting actually delivered through the tactical callout channel (module 09; `?callouts=0`
is the legacy free relay), else enemy gunfire within 120 m. It is not instant common knowledge inside Engagement.
Battle restarts clear Perception-owned gunfire, aggregate contact, belief telemetry and per-man belief stores, and module 09
clears its own pending/by-soldier/by-squad callout delivery state; this matters because simulated time returns to zero and
old evidence would otherwise look fresh/future-dated. The grouped restart regression is guarded by
`benchmark-restart-isolation-check.js` and `callouts-check.js`.

Measured Slice 2 evidence: grouped benchmark #280 (20 paired meeting seeds, five sequential seeds per browser worker,
`contact+120`) reproduced the isolated-worker control after the restart fix: wall-time ratio ON/OFF 0.903 (1.25 gate),
movement-resolver changes 34,951→35,196 (+0.7%), regroups 76→80, acquisitions 5,343→5,337, no runtime errors and no
route/targetless stalls. The earlier large churn was benchmark state leakage, not a beliefs effect.

**Soldier condition** (`modules/17-soldier-mind.js`, `BattleSoldierMind`). Each man carries `soldier.mind`: `stress`
(0 calm, 1 broken) read in four bands with hysteresis (steady; shaken from 0.30, rattled from 0.55, broken from
0.80; back down below 0.24, 0.47, 0.72). It updates inside the fixed AI tick on SquadAI's `beforeSoldier` slot and
drains its four kinds from the man's event queue (below) at its tick: a friend down, a wound, a suppression and
the fire aimed at him (`{from, rounds, d}`, posted after the burst so it cannot change it). It rises with suppression (0.05/s while `suppressedUntil` holds), a wound that did not drop
him (0.30), a friend down within 30 m (0.16, by distance, x1.3 in his squad, with sight beyond 8 m), the squad
leader down within 60 m (0.20), aimed rounds (0.02 each, by range, nothing from 300 m), no leader, no squadmate
within 30 m, and a neighbour within 8 m who is worse off (never past the neighbour). It decays (tau 22 s), faster
with the leader within 12 m, in useful cover and among steady men, x2.5 slower while under fire. Nerve (a hash of
faction and id, +15% for a sergeant) scales every gain; the module draws nothing from the combat RNG and writes
only `mind`. Engagement and the shot model read four levers, and the Squad Leader a fifth (`morale`, below), each separately switchable: `react` (recognition up to
x1.6: `reactTime`, the orient window, the re-orient), `aim` (shot group up to x1.8: `14-z` `dispersionSigma`),
`hesitate` (an ordered bound waits 2.2 s per unit of stress over 0.35, at most 2 s, under the 3.6 s bound window;
the wait is cleared with the order) and `shock` (a friend down within 10 m, or the leader within 30 m, freezes his
trigger for 0.35 s plus 2 s per unit of stress it added, at most 1 s, and stops him if he is only advancing; not
again within 3 s). `?mind=0` is off, `?mind=observe` keeps the state and reads none of it (identical to off:
`soldier-mind-check.js` and a control on six full battles), `?mind=react,aim,...` only those levers. `squad.mind`
(mean, max, men per band) is Micro status upward; the export reads it and so does the Squad Leader, through the `morale` lever (`BattleSoldierMind.squadStress`: group morale, on by default, and COA (on by default; `?coa=0` disables it); see Group morale and course of action). A squad with nobody living is rolled up over nobody (`n` 0, everything 0) and settled once by the module (`settle`), so a wiped-out squad does not keep its last living reading. Measured 2026-09-29 (`experience`
and `mind` probes, six 600 s battles, 216,000 man-seconds, no constants tuned): 88% of aimed rounds arrive from
250 m or more, so they add under 1% of the stress; it comes from friends down 31%, wounds 20%, isolation 15%,
leader down 13%, suppression 10%, contagion 6%, no leader 4%. Man-time is 95.9% steady, 2.9% shaken, 0.8% rattled,
0.4% broken; for men whose squad is in contact 92.6 / 5.3 / 1.5 / 0.7. Constants are `BattleSoldierMind.tuning`,
outside the policy genome. Paired standard benchmark (seed `soldier-mind-20260929`, one commit, flags `mind=0` /
`mind=observe` / none, 100 battles each): `observe` is identical to `mind=0` in all 100; all levers on against
off moved 30 winners both ways (16 GE to US, 14 US to GE, exact McNemar p = 0.86; US wins 43 to 45), time-limit
battles 52 to 51, no-capture 14 to 14, captures 3.81 to 3.73, health 82.7 to 82.1, no runtime errors: no measurable
effect on mission outcomes. The World Debug **Composure** layer draws it (a ring per shaken/rattled/broken man, a
cross on a frozen one), and `closeup_battle.cjs` takes `CLOSEUP_TARGET=stressed` and `CLOSEUP_OVERLAY=composure`. What a stressed man does about it, and
how stress builds and recovers, is owner direction and not built (Open issues, The soldier layer, in slices: Stress reactions).
**Who reads stress** is declared in module 17 (`BattleSoldierMind.READERS`: kind, lever, layer, file, reader, what it reads and how often, unit, flag; one row per reader) and held by `mind-read-map-check.js`, which fails on a file that reads `BattleSoldierMind`, `soldier.mind` or `squad.mind` and is not in the table, on a member the table does not list for it, on a different number of reads and on a row whose read is gone: a new reader is an edit to the table that a reviewer sees. Today the runtime readers are Engagement (recognition, bound hesitation and the freeze), the shot model (the group), the Squad Leader (the squad mean through `BattleSoldierMind.squadStress`, the `morale` lever: group morale and COA, both on by default (`?morale=0` / `?coa=0` disable them); its fireteams' and squad's stress through `teamStress`/`leadStress`, the `lead` lever, on by default (`?slStress=0` disables it)), World Debug and the diagnostics export. The General, Perception and the Movement Resolver read nothing, and nothing reads `sim._mindSummary`. The `morale` lever is a squad decision, not a man's: it is not in the benchmark record's `decisions`, and the `morale-decisions` probe counts it.
**Stress reactions** (`engagement.js`, `?stressAct=cower,flee,freeze,rage`; all four on by default, `?stressAct=0` disables them and a comma list selects an exact subset; owner direction 2026-09-30). Stress changes what a man does. The reactions are Engagement states declared in `BattleEngagement.states` (`cower`, `flee`, `freeze`, `rage`, enterable from every other state, leaving by `advance` or `withdraw`, a flee only by `advance` at base); module 17 still writes only `mind` and supplies numbers through `BattleSoldierMind.view` (his band and since when, whether he is under fire, and his _temper_: three fixed unit hashes of faction and id, never the combat RNG). `cower`: rattled and under fire goes to ground (prone, crouched for a role that does not go prone), holds, fires nothing, and gets up when the fire on him has been quiet for `COWER_QUIET` (3 s) or he has calmed below rattled. A broken man breaks by his best enabled reaction, temper x situation (declared, deterministic, ties in the order flee, freeze, rage): `flee` weighs his flee temper by whether there is trouble to run from (0.3 if not), `freeze` his freeze temper by whether he is under fire (0.7 if not), `rage` his rage temper if an enemy is within `RAGE_RANGE` (120 m) and he has a weapon with ammunition. `flee` is final (below, **The fled man**): he runs (`flee` intent, resolver priority 92, which a squad's retreat neither rejects nor overrides for him) to a refuge chosen once and standing until he is there (a first version looked again as the threat moved and one man ran 1.1 km; now a man who makes no headway for 4 s, twice, waits where he is), never fires, and releases a firing station first (a man who is down, running or charging is not eligible for one). `freeze` holds where he is, crouched, fires nothing and takes no order. `rage` charges the nearest enemy (`rage-charge`, priority 72), fires on the move (the speed gate is not his; the shot group is already wider for a man who moves) and strikes at 2.2 m every 1.4 s: a roll of the combat RNG (60%) and a chest wound at 0.8 of a rifle round's energy through the wound model; he gives it up when nobody is within `RAGE_REACH` (160 m). **The berserk guard** (owner, 2026-10-01): for `RAGE_GUARD_SECONDS` (5 s) from the moment he breaks into `rage` (`eng.guardUntil`, set by Engagement, whether or not the charge lasts the five seconds; a new break renews it) he takes `RAGE_GUARD_SCALE` (0.25) of every hit: of its hp damage, of its chance to drop him and of the bleed it starts. The wound model asks `BattleEngagement.guardOnHit(victim, battle, damage)` for the multiplier and draws exactly the same two rolls guarded or not; nobody else has a guard (cower and freeze have none), and `stress.acts.rage` counts the hits taken under it (`guarded`) and the hp it saved (`savedHp`). A freeze or a charge lasts at least `REACT_MIN` (4 s) and ends once he is below broken, then he rejoins the fight through `advance`; a flee never ends that way. A squad that is already retreating is not reacted for: the retreat outranks every drill. Upward the reactions are status only: `updateSquad`'s report carries `reacting`, a man in it is neither base of fire nor a mover nor a suppressor, and no layer reads a man's state. The numbers are `BattleEngagement.tuning.ACT_TUNING`, declared and not tuned. **The fled man** (`?stressAct=flee`; owner direction 2026-10-01): a broken man who runs is done with the fight for good. At the break Engagement (`beginFled`) leaves his weapons where he stands (`BattleWeapons.abandon`: the primary, with where it lies, and the holstered sidearm) and posts the `fled` event, so his stress never drains below `FLED_FLOOR` (0.2, module 17: he can recover to it at base and no lower). The squad report's `fled` list tells the Squad Leader, who lets him go from the roster (`BattleSquadStability.detachFled`): he is a squad of one in `retreat` (`fledId`, a full squad's strength missing, his old squad's home), and a leader who runs leaves his squad leaderless (succession). He runs (`flee`) to the squad's `safePoint` (the Squad Leader's record of the last place it stood out of contact with nobody known near; `squad.rally` is the moving anchor, at the front, so it is not that), or to its home when the trouble is known within `FLED_SAFE` (80 m) of it; waits there (`fledPhase` `wait`: a hold, shown as a freeze hold) for `FLED_WAIT` (180 s); and goes home (`home`, a flee run) when a retreating squad takes him in, when an enemy known within `FLED_ENEMY_NEAR` (80 m) gets near him, or when the wait is over. A retreating squad takes him in when the General finds one out of contact within `FLED_PICKUP_RANGE` (50 m) of a man who is waiting (`pickUpFled`, Macro; a man still running to his refuge is not picked up): the Squad Leader rewrites its own roster (`absorb`: he is on the squad's roster and his squad of one is gone, like a squad absorbed by a merge) and Engagement is told (`releaseFled`), and he goes home with them. A man in a fled phase is not part of the squad he is on the roster of for the Squad Leader's cohesion and advance gate (`commanded` in module 16): a squad that took him in and rallied before he got home would otherwise read him as scattered, and its regroup order (resolver priority 95) outranked his flee (92), so he was pulled back every ~10 s and never got home (seed 0004, 61 regroups against 10 with flee off, 8 of 17 US men still on the way home at the end). At base (`FLED_HOME_RADIUS`, 12 m of home) `SquadAI.rearm` issues his role's loadout (`BattleWeapons.arm`, ammunition initialised) and he is a man of a retreating squad of one again, recovering, still on his own: at-base squads are what reconstitution groups, so he rejoins the fight in a full squad and never in the one he left. Nothing ends it but base: calm, and his squad's retreat, do not. The resolver lets a flee intent through a squad of one's retreat (it neither rejects nor overrides it), because he does not take the order home. A man who has fled is out of his side's count as well: Engagement marks him (`countsForElimination=false`) out of the General's force accounting (`BattleCommanderDoctrine.forceUnits`: elimination and the time-limit force score) from the break until he legitimately returns to a fighting roster — either a retreating squad takes him in (`releaseFled`) or successful reconstitution merges him back into a viable rebuilt squad (`restoreFledForceCount`); `?fledElimination=0` is the legacy control that still counts him. The numbers are `ACT_TUNING` (`FLED_*`), `BattleCommanderAI.fledPickupRange` and `BattleSoldierMind.tuning.FLED_FLOOR`, declared and not tuned. The benchmark's `stress.acts.flee` counts spells begun, seconds, and `waited`, `waitSeconds`, `homeEnemy`, `homeTimeout`, `homePickup` and `rearmed`. `fled-man-check.js` holds all of it. The benchmark's `stress.acts` counts spells begun, seconds in each, and the charge's blows struck and landed. Presentation is owned by the FBX backend and never feeds the simulation: cower cross-fades through stand-to-prayer, the kneeling prayer hold and its rise; freeze enters through the terrified clip and then picks standing prayer, sitting dazed or fallen from a stable hash of faction + soldier id (no RNG); a fled man turns into his authored run and runs whenever he moves, and while he waits at his refuge shows his freeze hold; rage keeps its ordinary sprint, aim and fire layers because he is still fighting; cower and freeze leave the weapon beside the man and restore it when the reaction ends; a weapon the sim took from a fled man (`BattleWeapons.abandon`, which records where it lay) stays there as a world prop, and the one he is issued at base is drawn in his hands: the backend only draws what it finds and writes no weapon. `stress-reaction-animation-check.js` holds the mapping and the renderer rates live in `REACTION_ANIM`. `stress-reactions-check.js` holds it and the `stress-reactions` probe shows what each reaction looks like on real battles (episodes, how long, how each ended, a flee's distance and refuge, a charge's approach and blows). Dose on three local battles (not an arm): `?stressAct=all` alone began 88 cowers (4.4 s each), 16 flees and 15 freezes and no charge (the enemy is almost never within 120 m); with `?stressMem=all` 95 cowers, 21 flees (26 s each), 32 freezes and 1 charge. The paired benchmark numbers are in the PR that carries them. **Reading the stall counters for these arms (fixed since: the runner clears the clock like module 97, see the compare tool's row):** the runner's `movementStalls` doubled under `stressAct=cower` (39 to 78 reports in 100 battles a prefix, battles with a stall 12 to 54), but the extra reports are not stalls: its tracker (`scripts/run_battle_benchmark.mjs`, `unitTrack`) `continue`d past a man in a combat state, one with a target or one in a phase that does not advance, without clearing his clock, so a man who has held 12 s or more in `cower` can be reported on the first tick he is back in `advance` and not yet moving (read from the code: the benchmark's shard battles did not replay locally, so no man was traced), while module 97's `stalled` series (the same predicate) clears the clock whenever he stops qualifying. On `main` the two agree battle for battle (reports equal timeline onsets in 395 of 400 battles, never more); under `stressAct=cower` 38 battles report more than the timeline counts (44 extra reports), and the timeline's own onsets (45 to 40) and man-seconds stalled (745 to 596), and MovementProgress's stuck detections (473 to 493, p 0.37), did not rise. The runner was fixed afterwards (a separate PR, so that the field changes in one place); records from before it keep the old counts, so for those use `--count timeline.stalledOnsets` / `timeline.stalledSamples`.
**Stress memory** (`?stressMem=lasting,floor,relief`, module 17; owner direction 2026-09-30; **all three are on by default since 2026-10-01**, `?stressMem=0` is the old no-memory control and a list names exactly the producers that run). Three producers, each behind its own switch, none read by anything but module 17's own tick. `lasting`: while his squad is in contact (`squad.inContact`, Engagement's report) or he is under fire (suppressed, or an aimed round in the last 3 s) stress does not drain on its timer; it drains once both have been quiet for `CALM_AFTER` (12 s), with the same leader, cover and company calming as before. Gains are untouched. `floor`: whenever his health or stress changes the floor becomes the larger of itself and `(1 - hp / maxHp) x stress` and nothing takes his stress below it; healing (none yet: bleeding only takes health away) lowers it by `floor x lost now / lost before`, so healed to full it is gone; a man who was never hurt has none. `relief`: `kill`, `objective`, `cover` and `survived` events (modules/08-soldier-events.js) take `RELIEF[kind]` x his nerve off (0.12, 0.15, 0.06, 0.05), down to the floor and no further; exposure without a hit used to be only a cost. The numbers are `BattleSoldierMind.tuning` (`CALM_AFTER`, `RELIEF`), declared and not tuned to an outcome. The benchmark's `stress.memory` block counts the seconds held, the floors and the relief by kind. `stress-memory-check.js` holds all of it. Dose on three local battles (not an arm; numbers for sizing only): `lasting` alone took broken man-time from 0.3% to 3.9% and squad-seconds at mean 1/3 from 472 to 2,597; `floor` alone moved little (broken 0.4%); `relief` alone calmed the army (steady 96.4% to 97.7%; `survived` was most of it); all three together read 87.5 / 7.6 / 3.1 / 1.7. The paired benchmark numbers are in the PR that carries them (#143; `lasting` against the old drain: `withdraw` man-samples +17%, resolver changes +8 to 12%, against fewer loops, alerts and stalls: **it fails the efficiency gate, recorded and not waived: owner decision, 2026-10-01, as for group morale**; re-measured as the default in #147: `withdraw` +22.6%, resolver changes +12.0%, regroup entries +10.9%, low-forward-progress loops -20.1%, forward-progress alerts -16.2%, 200 battles). From that day a default battle has lasting stress, so a flags-off arm is compared with a `main` that has it, and the arm for the old battle is `?stressMem=0`; every measurement in this file that says flags off before then was taken without it.
**Stress telemetry** (no behaviour change). Every benchmark record carries `stress` (`BattleSoldierMind.telemetry(sim)`, format `grasstex-stress-v1`), and the run summary prints its dose map (`scripts/lib/stress-summary.mjs`): man-seconds per band (and per side, and for men whose squad is in contact: `contactBandSeconds`, sampled once per simulated second), men by peak band, squads at mean stress 1/3 or more (all, and with 3+ living men: squads, squad-seconds, entries), shocks, hesitations, and per lever `decisions`: `total` it could have changed, `changed` those where its answer was not neutral, `byBand` by the band he was in (band 0 is stress under 0.30: too small to see), `mag` what it cost in its own unit, `firstAt`, plus `lapsed` for a wait that ended with its order and `kinds` for the freeze (`fire`, `suppress`, `bound`, `advance`). A decision is counted where it is made, once: a recognition when it begins (not each tick of the orient window), a round when it leaves the muzzle (`shotDirection`), a bound when it starts, and the freeze only when it alone stopped the decision (Engagement asks it last in `fireAllowed` and `suppress`, the same answer in any order). The counts are one more set of numbers on the man's own `mind`; nothing reads them back. `series` is one row per side per simulated second (`series.columns`: men, mean, max, shaken, rattled, broken, squadsOver, squads, then the cumulative changed decisions of the four levers and the shocks, then the men in a squad in contact), `markers` carry `squad-stress-over` at the simulated second a squad first reaches 1/3 (capped at 200, the overflow counted). `t` is simulated seconds, as in the timeline contract below.
**Measured 2026-10-01** (PR #139, standard benchmark, both seed prefixes, 200 battles, group morale on by default; runs 145 and 147 on `3d9c3fa`, each against `main` at `1bc52de` with the same `x=1`, runs 144 and 146). Inert: 100 of 100 records identical on every field `main` has, per-second `timeline` included, on each prefix (`--ignore stress`; `timeline.ref` differs between any two runs, so it is not part of identity), 0 runtime errors; wall time x0.997 and x0.833 on two pairs whose records are identical, so the ratio is runner load, not cost. The stress block costs about 300 KB a battle in the pretty-printed merged JSON (125 MB a run against 96 MB). The dose, 200 battles: man-time 96.3% steady, 2.5% shaken, 0.8% rattled, 0.4% broken; for men whose squad is in contact (37% of man-time) 93.3 / 4.5 / 1.4 / 0.8. 58.6% of men reach shaken or worse at some point and 18.5% reach broken, for 0.4% of man-time (it decays, tau 22 s). Squads at mean stress 1/3: 1,163 of 2,000 squad-battles, in 194 of 200 battles, for 3.1% of living squad-seconds (2.2% with 3+ living men; median battle 133 squad-seconds). Per 100 battles the levers changed: recognition 36,800 times of 60,000 (61.3%) but by 22 ms on average, under one AI tick (11% of the changed ones by men shaken or worse); the shot group 48,500 of 61,500 rounds (78.8%; 16% of the changed ones by men shaken or worse, 6.3% wider on average); a bound start waited 620 of 16,700 (3.7%, 0.56 s on average, 38 orders lapsed while waiting); the freeze blocked 20,900 decisions (59% a march, 38% a shot, 1.5% a suppression burst, 0.9% a bound; 48% of them by men shaken or worse). 76 shocks and 7 hesitations a battle. The first decision any lever changes comes at a median 99 s (recognition), the first freeze at 121 s. Morale on by default (#142) moved none of this: the first map (`main` `e829872`, morale off) read 96.1 / 2.6 / 0.9 / 0.5 and 1,210 of 2,000 squad-battles.
**Soldier events** (`modules/08-soldier-events.js`, `BattleSoldierEvents`). What happens to a man reaches the layer that
reads it through one queue per soldier (`soldier._eventQueue`), one declared vocabulary (`KINDS`: kind, fixed
priority, producer, payload) and `post` / `drain`. Kinds, in priority order: `casualty` 0 (a man of his side went down
within 62 m; `announceCasualties`, once per AI time from the readers' tick, also keeps the casualty log), `wound` 1
(a hit he survived; the wound model), `suppressed` 2 (`SquadAI.pin`, carrying the `until` it set after the fortitude
scale, never a recomputation), `aimed` 3 (SquadAI's `aimedAt` slot), then the four relief kinds the soldier condition reads behind `?stressMem=relief`: `kill` 4 (the wound model, to the shooter), `objective` 5 (the capture zone, to the men of the side that took it standing in it), `cover` 6 and `survived` 7 (Engagement: cover reached while under fire, a spell of fire that ended without a wound), and `fled` 8 (Engagement: he broke for good; the soldier condition reads it always, it sets his stress floor). A reader subscribes to the kinds it reads and
drains them by priority then posting order; a kind nobody reads is not queued (`?mind=0` queues nothing); the queue is
bounded (128; the lowest-priority, oldest event goes and is counted). The priorities are the order the soldier
condition used to add what it lived through, so its arithmetic is unchanged. The urgent status
(`_combatUrgentUntil`) is not queued: modules 11 and 44 poll a timestamp and nothing wants an event; it joins with the
callout channel. `soldier-events-check.js` holds it; `state-fingerprint` ignores the queue's bookkeeping.
**Soldier stats** (`modules/10-soldier-stats.js`, `BattleSoldierStats`). Six fixed traits per man, PHY, MKM, FOR, TAC,
AGI, TEC, each the mean of three hashes of faction and id (bell-shaped around 0.5, independent of role, no combat RNG).
The module only supplies numbers; the layer that reads one decides what it costs. What a stat is worth is one declared
table (`EFFECTS`: stat, signed span, unit, reader), and a man of 0.5 is exactly 1 on every effect: FOR scales how long a
suppression or a wound's shock holds him (`SquadAI.pin`) and how much stress he takes (module 17); TAC scales
recognition time (`reactTime`, the orient window) and sight range; MKM the shot group (`14-z` `dispersionSigma`); AGI
how fast his aim settles after a stance change, how often he searches for cover under fire, and sprint pace; PHY every
gait speed, and machine-gun emplacing time; TEC how often a gun jams, how fast a stoppage clears and how fast an
engineer builds. The two soldier status timers have one writer each: `suppressedUntil` is written by `SquadAI.pin`
(sets, extends, never shortens) and `_combatUrgentUntil` by `BattleEngagement.markUrgent`/`clearUrgent`
(`status-writers-check.js`, `state-ownership-check.js`). **The General reads squad means** (`squad` lever):
`BattleCommanderDoctrine.chooseObjective` adds at most `SQUAD_FIT` (30) points, a score never a veto, to an objective
that suits a squad in the top half of its side on a composite: pace (PHY, AGI) pulls it to the nearest-home objective,
grit (FOR) to the furthest, support (TEC, MKM) to the safest ground (near home, far from the enemy, owned by its side);
a squad of fewer than 3 living men is noise and pulls nothing, and a defence is never pulled. TAC has no Macro use yet
(the `eyes` composite is ranked and unread). Flags: `?stats=0` is the module absent (the same battle as without it;
`soldier-stats-check.js`, `stats-levers-check.js`), `?stats=for,tac,...` only those stats, `squad` the General's use, `deal`
(default-on; omit it with an exact stats list) deals each squad's roles from its ten men's stats at spawn: the same ten ids per squad, the sergeant the
steadiest and most alert (FOR+TAC), the gunner the strongest technician left (PHY+TEC), the scouts the quickest good
shots left (AGI+MKM), riflemen whoever remains, and the role still issues the weapon. Constants live in `EFFECTS`,
`COMPOSITES` and `BattleCommanderDoctrine.tuning`, outside the policy genome; nothing here was tuned to an outcome.

</details>

**Engagement states:** `advance → orient → (decide) → bound → engage`, then
`pinned`, `assault`, `alert`, `withdraw`, `station` (plus the default-on stress states `cower`, `flee`, `freeze`, `rage`; `?stressAct=0` is the legacy control: see Stress reactions). `orient` never fires (REACT 0.45 s scout to
0.85 s gunner). `engage` pins position and commits stance. `alert` holds the sector for
`ALERT_HOLD`. Fire requires: a live target, not reloading, past `eng.fireReadyAt`, speed ≤12% and
not crawling, within `AIM_CONE` (~12.6°), and gunner emplaced. `squad.inContact` is
`contactCount>0 || suppressors>0`. Suppression deals no damage, only pins. There are at most
`MAX_SUPPRESSORS` suppressors, the MG first. The Squad Leader (`fireAndMovement`) sends one fireteam
forward every `BOUND_CYCLE` if ≥2 are shooting, only in an assault phase, and the MG never moves.
`engagement.js` declares each stored state's meaning, entries, exits, update rate and legal next
states in `BattleEngagement.states`; its transition function is the only state/clock writer.
Combat urgency and firing-station release request their legacy entry semantics through
`BattleEngagement.requestState`, so those modules do not write `eng.state/since/until`.
**Squad fire control / crest preparation** (`modules/16-squad-plan-stability.js` owns the order;
Engagement executes it; `?fireControl=0` is the immediate-fire control). A first-hand visual contact is a request
to open fire, not permission to shoot. The Squad Leader starts at `hold`: the squad stops, faces the first-hand
contact and goes prone; each man may make only a local forward adjustment (0.75 m samples, at most 6 m, through the
Movement Resolver) to find a prone eye + ballistic line over the crest. If the full 6 s preparation window produces
**zero** usable prone firing lines, the leader changes to `reposition`: fire remains forbidden, but the forced-prone
drill releases so normal Engagement cover-seeking can move men to a viable fighting position. A man who reaches a
position from which only crouch/stand clears the obstacle may count ready in that lowest viable fighting stance;
prone remains the preferred initial ambush posture, not a terrain deadlock. Engagement's trigger and suppressive-fire
paths both read the same permission. A man who is already being shot at (suppressed or aimed at in the last 3 s)
may return fire immediately, **incoming fire itself keeps the squad in contact**, and the Squad Leader opens the
squad on its next tick even if the posture change briefly cost everyone visual target lock.

The normal volley target is deliberately not "all ten men or deadlock": all available men adopt the low posture,
but the leader accepts the firing line when 70% of the commanded survivors (minimum three) are stationary, prone,
armed and have both sight and a clear ballistic line. It then considers squad strength and mean MKM: at 85 m or
closer it opens once prepared; farther out a squad normally needs at least 55% of establishment and mean MKM 0.42.
After 6 s, two usable rifles are enough for the leader to accept a partial line rather than freeze forever on bad
terrain. At 140 m+ the leader first looks for a precision shot: the best in-range non-MG marksman is selected by
MKM with a role preference for sniper/scout/rifleman; MKM 0.62+ gets `precision`, authorizing only that shooter
while the rest stay prone and silent. Any received enemy fire escalates `precision`/ `hold` to `open`.
No combat-RNG draw chooses any of this. `decision-fire-control` telemetry records state, reason, range, strength,
marksmanship, ready/living counts and designated shooter. The tuning lives in
`BattleSquadStability.tuning.fireControl`; Perception still owns who was actually seen, the Squad Leader owns the
permission, Engagement owns stance/trigger execution, Ballistics owns the crest line, and the Movement Resolver
owns the physical adjustment.

**Stance has one writer: Engagement** (`commitStance`, with `STANCE_HOLD`/`PRONE_HOLD` holds and
`AIM_SETTLE` after a change). `stepMovement` only shows the committed stance; another layer (the
reload hook, module 44's drills) asks through `BattleEngagement.requestStance`, which only takes a man
lower, or, as a drill running on Engagement's `afterDrill` slot, commits through `commitStance`
(`stance-ownership-check.js`). A man advancing under fire or while his squad is in contact moves
crouched. **Cover and stance are for fighting from** (`findCover` `evade`, `seeingStance`): `coverCandidates` keeps slots whose shelter lies between slot and threat, so every one hides him; unless under fire a slot must give him a line to the threat standing, and the stance in `engage`, `orient` and `alert` is the lowest that still sees his target or the last known threat. Before this, 83% of bounds ended `engage -> alert: target lost` at the slot (`bound-motion` probe). `soldier.crouching` is derived from `prone`/`tacticalCrouch` in `SquadAI.createSoldier`, not a mirror. **A crawl is for cover he can crawl to** (`bound`, `canCrawlTo`): a suppressed rifleman or gunner crawls only if crawling to the slot fits the bound's own window (a crawl covers `BattleSoldierIndividuality.crawlFactor`, 0.23, of a run, and the window is sized for a run) and he is not already running, else he runs in crouched. The old `d < 14` rule dropped men to ground at 2-3 m/s (the FBX plays a dive clip while the body slides on) for cover that took ~20 s to crawl to in a ~10 s window (`bound overran`); fitting the window alone made it worse (68 to 117 dives: a runner dropped to a crawl as cover neared), so the standing start is part of the rule. `?crawlFit=0` is the old rule. `bound-motion` probe, 12 battles x 600 s: dives 68 to 9, prone spells shorter than the hold 530 to 328, US wins 4 to 6. Not yet in a paired GitHub benchmark (#131's runs 107-110 predate it).
Engagement constants live at the top of `engagement.js` (`BattleEngagement.tuning`), bound timing in
`16-squad-plan-stability.js`; both are deliberately outside the policy genome. Sight and cover are
per stance (`obstacle-field.js`), so going prone genuinely helps.

**Extend through declared slots, never by replacing a function.** `SquadAI` declares `fireGate`,
`shotModel`, `woundModel`, `areaFireGate`, `roundGate`, `afterShot`, `squadCommand`, `beforeSoldier`, `afterSoldier`, `aimedAt`;
`BattleEngagement` declares `afterDrill`. Sidearm switching (module 47) is the `beforeSoldier` extension `sidearm`; the soldier condition (module 17) is `soldier-mind` on `beforeSoldier`, and the `aimedAt` slot's one extension is `soldier-events` (module 08), which posts the shot to the man's event queue. Add the id to the declared order and attach with
`extend(stage, id, fn)`; reassigning `tryFire`/`updateSoldier`/`updateSquad` makes behaviour depend
on module file order (`14-z-ballistic-raycast.js` once silently discarded the LOS gate that way).

**A command hold is a lease.** Commitments that block another layer's intent change live in
`BattleLeases` (`squad-ai.js`, one table per squad: kind, owner, since, until, reason, release, plus
an ended log): `tactical-plan`, `regroup`, `regroup-cooldown`, `regroup-bypass`, `corner-hold`,
`bound`, `bound-cycle`, `succession` (Squad Leader) and `objective-security` (capture zone). `holds()` is `t < until`.
Each owner declares its kinds with `BattleLeases.define(kind, {priority, timer, progress})`: priority
orders live leases (`active()`, `top()`); `timer: true` marks a pure clock that `prune()` ends as
`expired` once its time is up (the Squad Leader prunes each command tick); kinds whose expired record
still means something (`objective-security`, `succession`, `regroup`) are never timers; `progress` is
a read-only "is this hold getting anywhere?" test. The session export lists each squad's live and
recently ended leases and `missionHeldBy`; the AI Graph **Leases** panel (`modules/37-lease-panel.js`, stashed
with the graph) shows them live when the graph is on. Don't add a new `...Until` field for a hold. Deliberately not leases: fireteam order renewal (on the order
record), the garrison request (a standing constraint), and execution timing inside one owner.

**Loadouts and sidearms.** What a man is issued is `SquadAI.LOADOUTS` by role (`loadoutFor(role, faction)`
is the one place a role picks a weapon; `ROLES` carries none): a `primary` kind and an optional `secondary`.
`dealLoadout` builds both through `attachWeapon` (the side's own model and numbers); the sidearm is
holstered (`soldier.secondary`, mesh hidden, its own magazine and reserve from the ammunition module).
`BattleWeapons.equip` swaps `soldier.weapon` (what he shoots; the pose, grip and ranges follow it) and
holsters the other. Machine-gun behaviour (emplacing, setUp accuracy, first suppressor, never bounds,
firing-station range) follows `SquadAI.isMachineGun(s)` (`weapon.kind === 'lmg'`), not the role; slots and
hardpoint eligibility stay role jobs. Module 47 (`BattleSidearm`, tuning `DRAW/CLEAR/NEAR/CLOSE/HOLD/LEAVE`)
draws the sidearm when the primary is out of action inside 20 m, or a long gun is at arm's length (8 m),
and puts it away after 3 s once the target is past 35 m or the pistol is dry. At the standard seeds it
never fires (2026-09-29, `sidearm` probe, seeds 1-4, 12 battles: 0 draws): contacts are at 150 m or more and
no gun runs dry in 600 s. It matters for close fights (buildings, hedges) and future ammunition pressure.

**Window firing port** (`battle-navigation.js`, Engagement's `station`, the Tactical positions manager; `?windowPort=0` is the old
station). A window station is a firing port, not a point in the room. Navigation builds `station.port` once from the opening's own
metadata. The anchor is `.45` m behind the wall plane (the wall is drawn `.32` thick, so its inner face is `.16` back, and a man is
`.25` in radius; the old station was `.775` back). The stance is the lowest that clears the sill by `.25`: a `.92` sill, which is every
generated window, gives `stand`, a `.3` sill `crouch`, and a high sill takes any stance whose eye still clears it by `.12` and stays under
the lintel by `.1`. The exterior sector is what the jambs let through from the anchor: 50.5 degrees each side of a 1.25 m window, where the
old station let through 42 while `select` and the fire gate allowed 71 and 75. An opening no stance fits is never offered: it is listed
in `N.rejectedWindows` with its reason (`sill-too-high`, `lintel-too-low`, `too-short`, `too-narrow`, `bad-opening`; a generated town has
none). `N.aperture(station, from, to, floorY)` follows one 3D line to the wall plane and asks the jambs, the sill and the lintel (`.08`
frame margin). On each station update a man at the anchor with a target in the sector asks it twice, once for the eye and once for the bore
(from a stock point `.5` m behind the ballistics muzzle), and fires only when both pass. When one does not, the pose is corrected inside the
port through `BattleTacticalPositions.adjustPose`: forward to `.30` m behind the plane, then along the sill within `halfWidth - .08 - .25`
(about `.30` m on a 1.25 m window), or to a stance the port lists. The manager keeps the pose (`t.pose`) and the last aperture report
(`t.aperture`) with the task, and the resolver walks to `BattleTacticalPositions.anchor(s)`. The claim, the reservation, the committed
ingress route, the captain exclusion and the release rules are untouched: no target, a target outside the sector, a closed line and a reload
all hold the post, and only the manager releases it. `BattleNavigationPhysicality.windowDiagnostics(sim)` returns one row per window
(assignee, anchor, pose, facing, aperture, stance, eye and bore status with the reason, target, state) and the Window Slots overlay draws
the frame, the facing, the sector and the two rays. `window-port-check.js` holds it.

What the port does not do (2026-10-01):

- **Not measured, not looked at.** It is on by default and has had no paired standard benchmark (`query_off=windowPort=0`, `seeds`, both
  prefixes) and no browser look at the pose or the overlay: the checks are Node only, so what a posted man and the Window Slots rays look
  like on the preview is unseen (the Window Slots button, and `closeup_battle.cjs` with `CLOSEUP_TARGET=id:<n>` on a man the diagnostics show
  holding a window, are the way to look).
- **Sill and lintel are enforced by the station's own fire gate only.** Every other ray through a window (`hasLineOfSight`, `canSuppress`,
  the ballistics wall test, `select`'s claim test, perception) still goes through `lineOfSightBlocked`, which ignores height and opens a window at
  every height. So the sill shields nobody from incoming fire: a round at his legs crosses the opening, and the `.92` sill now gives `stand`
  where the old station was a fixed crouch, a bigger target. Making global LOS height-aware needs the floor height under a building (the
  port's caller passes `battle.heightAt` today) and changes every ray through a window: its own flag and its own paired benchmark.
- **The sector is a fixed cone from the anchor** (`sectorHalf`); a pose shift does not widen it, and a target just past it is held, not engaged.
- **No window animation.** No firing pose, no rifle braced on the sill, no window reload: he uses the stand and crouch clips with the
  rifle through the opening, and the bore line is the ballistics module's semantic muzzle, not the skinned weapon.
- **The numbers are constants, not tuning.** `PORT_INSET`, `FRAME`, `SILL_CLEAR`, `SILL_PREFER`, `HEAD_CLEAR`, `MIN_HEIGHT`, `MIN_WIDTH`,
  `SECTOR_MAX` and the two stance eye heights (repeated from SquadAI and the ballistics module) live in `battle-navigation.js`, and the stock
  offset and the over-shift in Engagement's `portLines`/`portSolve`: no `tuning` object yet and not in `docs/reference/TUNABLES.md`.

**Weapons and wounds.** `BattleWeapons.STATS` holds each kind's numbers and `PROFILES` each side's
weapon for it (Garand/Kar98k, M1919A6/MG42, Thompson/MP40, M1 Carbine/FG42, M1911A1/P38);
`SquadAI.createSoldier` issues it (`weapon.profile`, `magSize`, and `carried` where the load differs
from the kind's). A man opens aimed fire out to `SquadAI.engageRange(s)`: his weapon's range (roles no longer carry one,
except as a cap where the job is not the firefight: the defending engineer's 130 m), so the US scout
stops at the carbine's 250 m and the German scout reaches 450 m with the FG42's rifle cartridge. The
FBX backend draws the model the profile names (`PROFILES.<side>.<kind>.model` + `.fbx`), so what a man
carries and how it shoots cannot disagree. The squad leader keeps his SMG on purpose: he
commands, and his fire is close defence (measured 2026-09-29, `fire-gates`, three standard battles: he
held a target for ~10,000 samples, 98% of them at 150 m or more, `engageRange` stopped him in ~90% of
them, and he fired 0/94/0 rounds against 280-422 for a rifleman; the gate is right, the contacts are far).
A rifle for leaders would be a loadout change (`LOADOUTS`) needing the Garand/Kar98k seat checked on the
captain models in Motion Lab. A selective-fire weapon (`autoWithin`, the FG42: 50 m) bursts only inside
that distance and fires single aimed rounds beyond it. `rof` is the aimed rate of a semi-auto or bolt action; an
automatic has `cyclic` (rounds/s), `burst` [min, max], `burstPause` and `burstClimb`. One trigger pull
fires the whole burst on one AI tick (0.15 s, slower than an MG42 cycles); each round goes through
`roundGate`, `shotModel(…, round, delay)` and `afterShot`, and `onFire(soldier, delay)` / the shot's
`delay` let presentation play it at the cyclic rate (`BattleSim.presentAfter`). What a hit does is the
`woundModel` (`modules/14-wound-model.js`, `BattleWounds`): the ray's hit zone (head, chest, abdomen,
arm, leg; `BattleBallistics.hitZone`), a drop chance per zone scaled by the cartridge's `power`,
bleeding that eases with time, leg wounds slowing (`woundSpeed`, applied in `11-soldier-individuality`)
and arm/torso wounds widening the shot group (`woundSigma`). A round can go through a man
(`14-z-ballistic-raycast.js` over-penetration: chance from the weapon's `penetration`, else full-power
cartridges only, times the zone; it keeps part of its energy, deflects ~7° and flies on) and strike
the next enemy behind him with a wound scaled by `hit.energy`/`hit.power`. The shot reports every
body in `shot.passes` (entry, exit, zone, energy) and where the spent round ended in `shot.final`;
`shot.victim`/`impact`/`zone` stay the first body. Incapacitated and killed both go through
`killSoldier` (`soldier.casualty` says which and where).

**Decals.** Sprite sheets in `Assets/effects/decals/` (`blood.png`, `bullet-holes.png`) are a fixed
4 x 4 grid, one kind per row and four variants per row, generated by `node tools/generate-decal-atlas.js
[--cell 256]`. `15-bullet-impact-fx.js` (`DECAL_SHEETS`) addresses cells by grid position, so a sheet
can be regenerated larger or replaced by a painted one of any resolution that keeps the grid. World
decals (holes, blood on the ground) are thin instances per cell. FBX wound decals choose the nearest
currently skinned body vertex to the ballistic entry/exit point, store that vertex's bind position,
normal and skin weights, and resample only that vertex from the live skeleton each render; the quad
sits 12 mm above the sampled skin normal. A wound event forces that soldier's current pose/world
matrix before the lookup, so a hit between rendered frames cannot fall back because of stale
presentation state. Procedural soldiers retain the bone-parented fallback. Exit wounds are larger,
on the far side, with an exit spray on the ground wherever a round came out.

**Presentation never touches the combat RNG.** Voice, FX and audio must not draw from
`battle.random`; the same seed must simulate the same battle with or without assets
(`voice-determinism-check.js`).

**Formatting:** the M3C behaviour files (command, squad, engagement, movement, weapon rules) are
Prettier-formatted with `.prettierrc.json` (`npx prettier@3 --write <file>`). Don't hand-compress
them back into long single lines. CI enforces this as a ratchet: every `.js` file a pull request
touches must pass `prettier --check`, so files stay on-standard once they are cleaned.

**Frozen:** path clearance, body width and hedgerow X/Z layout, width and gaps. Hedges remain one
authoritative 3D volume for rendering, nav, LOS and ballistics. PR #99 explicitly lifted the old
2.2 m height freeze only: each generated hedge run now has a deterministic visible height of
2.8-4.57 m, with every 3 m render chunk in that run sharing the same height so the coalesced
runtime prism remains identical to what is drawn. Height uses a separate RNG stream and therefore
cannot shift the frozen terrain layout. Change these physical rules only with deterministic
map/navigation regression coverage and a paired benchmark. v128 is the reference for movement feel.

### Evidence-first workflow (behaviour or performance regressions)

1. Reproduce on the exact seed/scenario. 2. Measure before editing (diagnostics, provenance,
   route/movement/position state, counters). 3. Name the broken invariant in one sentence.
2. Name the one owning layer and subsystem; two apparent owners is itself the bug. 5. Trace the
   **producer**, not the resolver. 6. Add a failing deterministic check (harness above) when
   practical. 7. Make the smallest structural fix at the owner, preferring deletion. 8. Re-run the same
   seed and compare before/after. 9. Run the full harness suite. 10. Benchmark only after a
   material change is stable: standard 100 for checkpoints, 300 for milestones.

**Stop and write a root-cause chain** (observed → evidence → owner → invariant → fix → test)
before coding if any of these hold:

- the fix needs guards in two or more unrelated modules;
- a timer is added to counter another timer;
- A→B→A churn is being fixed in the resolver instead of the producer;
- a soldier with a legal destination stands still with `stuck=false`;
- reservations are unique but bodies still stack;
- metrics improve but it looks worse;
- the explanation got longer.

**Performance is a gate.** A median slowdown of more than ~25% per battle on the same profile
means stop and profile. Don't hide it with a bigger step, shorter battles or disabled systems.
Wrap hot functions in the harness and fix the dominant subsystem at its owner. Optimisations must
preserve determinism and behaviour.

**Change discipline:** one conceptual change per commit. Use a branch plus preview for anything
that crosses an ownership boundary. If a candidate regresses movement feel, revert it as a unit.
Small root-caused fixes may go straight to main.

**Statistics:** the standard benchmark with `seeds` 1 is one battle per arm, so it proves that a change is inert (identical records) and
where and how an arm first diverges (`firstDivergence`, the per-window counters); it carries no rate, no p-value and no win
split, and one battle's counters are a size, not a finding. With `seeds` above 1 the unit is the seed, and the paired sign test on an
event count (casualties, shots, retreat samples, resolver changes, loops) is the evidence, as in the old 100-battle runs; the null arm
measured on one seed (a 0.07% step nudge, three runs) moved total casualties 68 to 81 against `coa=1` at 53, so a single battle's
difference between arms is inside that spread until many seeds say otherwise. Win splits are underpowered. Telling 10% from 3.3% needs ~216 runs per arm, and a
30-run arm can't carry a claim. Report Fisher p-values and don't read mechanism into a
four-run swing. Live-browser runs at `timeScale` 8 aren't deterministic, so use the replay script
for controlled pairs, and serve both arms the same way: `battle_sim_local.php` in preview mode (a
`preview.json` beside it) reads `state/` and the audio manifest two directories up.

### Open issues (as of 2026-10-03)

Keep this section to **work that is genuinely still open**. The visible, uncollapsed text should describe
unfinished work, current debt or the next queue. If a shipped baseline or completed campaign must remain here
for orientation, put it in a collapsed `<details>` block so it cannot read like active backlog. Detailed evidence
belongs in subsystem sections, commit messages and PRs. Long-form historical notes remain in git history
(`git show 3972d3b:AGENTS.md`).

**Concrete sim work**

<details>
<summary><strong>Closed: AI layers polish (2026-09-29 → 2026-10-01)</strong> — ownership/state-machine cleanup is no longer an active umbrella project</summary>

The phase campaign did its job: the runtime now has explicit Engagement/Squad Leader/Macro state machines,
writer-file and read-side ratchets, one anchor publisher, owned status clocks, leases, soldier events/stats,
group morale/COA, the tunable inventory, and the Navigation-owned cache invalidation path. The detailed PR/benchmark
history remains in git (#110-#130, especially #111-#124 and #129).

Not every proposed Phase 4/5 micro-item shipped, by design:

- **Phase 4 nav-cache ownership shipped** in #120/#123.
- The experimental **LOS cache was tried and removed** on the #122 work because string-key/cache maintenance cost
  outweighed hits for moving soldiers.
- The **40-scan perception budget was measured and rejected** in #125: it refused 4-13% of scans overall,
  overwhelmingly on the German side because of walk order, changed 199/200 battles, saved no wall time
  (median x1.035), and therefore was correctly closed unmerged.
- Wake staggering was not carried to `main`; without a measured performance regression it is not an active item.
- **Phase 5 contracts were verified** on the #122 work (all runtime modules had top-of-file contracts),
  `flatDamage` was removed in #121, and the tunable inventory shipped as `docs/reference/TUNABLES.md` in #129. The proposed
  "fresh reader" ceremony was not separately run and is not a blocker.

Owner decision 2026-10-01: treat the **AI-polish campaign as closed**, not as a phase queue that must be reopened
until every discarded experiment is implemented. New behavior belongs in the active soldier roadmap below or in
`docs/reference/AI_TACTICS_OUTLINE.md`; new performance work starts from a measured regression.

</details>

**Residual small debt (track individually, not as “AI polish”).**

- `objectiveHoldWin` remains an unread legacy genome parameter while the genome is stashed; remove/settle it during
  the eventual genome rewrite rather than reviving it now.

<details>
<summary><strong>Completed: small debt cleanup (2026-10-03)</strong></summary>

`soldier.fireCooldown` now has one direct writer, `squad-ai.js`: spawn stamps, frame countdown, reload holds and
sidearm draw/clear delays all route through `setFireCooldown` / `extendFireCooldown` / `tickFireCooldown`, and the
wire-map multi-writer entry is gone. `modules/52-combat-posture-visual.js` no longer swaps `soldier.target`; it sends
a static `animateWalk(..., {aimPoint})` presentation input through the gait/stance wrapper chain to the
procedural/FBX presentation backends. Perception keeps ownership of gameplay target state.

</details>

**AI continuation handoff (current queue below; archaeology refreshed 2026-10-03).** The small
soldier-level continuation is complete; the active behavioral roadmap has returned to
`docs/reference/AI_TACTICS_OUTLINE.md`. The Sept. 13 outline (`f71ab0dd55cd03daae4b07c81665d3d74452618c`) describes
structure-control, street/route-transition plans, a versioned `SquadIntent`, a stronger Squad Leader local planner,
objective secure/exploit/handoff and later combined arms. Keep that detailed design in the outline and do **not**
pull isolated pieces into the queue ad hoc. The window archaeology is the warning case: the physical/tactical-position
substrate survived while the full use of the opening had to be recovered later; the firing-port implementation is
now back on main (`e10622a3893f5eecfb2bbdefc80b7140e4b7ee37`, with the merge preserved by
`e0455331d9ae8b26c47dc455f9c5b97945791278`). Completed handoffs below stay collapsed for orientation; the next
unfinished queue stays visible.

<details>
<summary><strong>Shipped baseline to preserve</strong> — existing substrate, not open work</summary>

Perception/view cones, hearing/relay and sector scanning; per-soldier loadouts and sidearms; soldier condition/stress
and its lasting-memory path; cower/flee/freeze/rage (all four on by default since 2026-10-01); the fled-man lifecycle;
Engagement-owned stance/cover; last-known-threat alert posture; and tactical firing stations/window ports are existing
substrate. Extend these owners instead of creating parallel systems.

</details>

<details>
<summary><strong>Completed: post-v278 stabilization phases</strong> — #159, #160, #161, #162, #164 and #165 are on main</summary>

The six stabilization slices are closed and no longer part of the active queue:

- #159: freeze/flee are visible non-threats and frozen men suspend active perception/facing.
- #160: freeze duration is bounded by recent stress tempo (12–48 s) with diagnostics.
- #161: retreat anchors/intents are stabilized with the sliding lease and progress checks.
- #162: fire-control evidence and posture-churn diagnostics are exported.
- #164: strategic objective-stall recovery escalates through reconcile/release/main-effort/reset. The 120 s reconcile stage does not replace a valid capture brief while the squad is still physically executing movement; later stages remain the backstop for motion that never produces strategic progress.
- strategic-freeze fix: exhausting the #164 ladder no longer ends strategic review. Review passes recur every `STRATEGIC_STALL_REPLAN` of continued stall, stages hold on young unaccepted briefs (adoption window = `progressWindow`), and a same-objective reset varies the approach instead of deduping into a no-op. `strategic-recovery-review-check.js` owns both sides of the invariant.
- #165: Perception owns the shared threat-disposition contract for active threat / visible non-threat / inactive.

Their detailed behavior, harnesses and tuning live in the subsystem sections, carrying PRs and git history. Do not
reopen these phases as backlog items unless a new measured defect points back to them.

</details>

<details>
<summary><strong>Completed: soldier-level continuation</strong> — #157, #170, #190, #196 and #197 shipped/default-on</summary>

- **Squad Leader stress-aware local execution — #157.** `?slStress=pick,hold,review` is on by default; the Squad
  Leader picks the calmest viable fireteam that can bound, can hold a bound cycle when every viable team is shaken,
  and can raise a doctrine-review wake after sustained squad stress. `squad-stress-check.js` owns the regression contract.
- **Tactical callout channel — #170.** `BattleCallouts` is on by default; messages have delivery delay, can be
  missed deterministically, carry source/confidence/outcome data, and feed relayed squad contact only after a man
  actually hears them. Voice remains presentation-only. `callouts-check.js` owns the regression contract.
- **Per-man threat beliefs — #190.** `soldierBeliefs` is on by default; Perception owns seen/told/heard facts and
  their expiry, Engagement consumes only the man's valid view, and `squad.contact` stays the aggregate upward
  picture. `soldier-beliefs-check.js`, `lean-runtime-check.js`, `callouts-check.js` and the grouped restart
  benchmark protect the information and lifecycle contracts.

- **Scouts Forward — #196.** The Squad Leader's bounded `recon` lease, deterministic scouts, main-body
  hold, Perception/Callouts report path, uncertainty-preserving release, same-approach guard and recon-rejoin handoff
  are shipped and default-on; the subsystem section above owns its benchmark/probe evidence.
- **Intent-based continuation after Squad Leader loss — #197.** The existing succession lease now owns a real
  command-vacancy interval: inherited parent intent is preserved, fresh Meso decisions freeze, Micro combat/survival
  and already-issued movement remain legal, and the successor receives an explicit hand-back. The subsystem section
  above owns its benchmark/probe evidence.

The small soldier-level continuation sequence is complete. These entries are retained only as a compact handoff
record; their detailed contracts and evidence live in the subsystem sections and carrying PRs.

</details>

**Active AI queue — immediate prerequisite: individual command reception/execution.** Before adding new
urban/route tactics, remove the remaining "psychic squad bus": publishing a squad/fireteam order must not make every
soldier know, orient to, or execute it on the same tick. Squad/Meso remains the command owner, but each man gets a
personal receipt/adoption state between the published order and Engagement/Movement execution. That state may record
`issued -> heard/seen -> processing -> adopted -> executing` (exact field names are implementation detail), and it
must not become another stance, destination, target, or path owner.

The same contract applies to both classes of currently synchronized behavior:

- **Posture/fire-control orders.** A shared HOLD FIRE / prepare / "get down" decision is published once, then each
  soldier receives and adopts it on his own deterministic timing. Recognition/TAC, stress, current task, distance,
  audibility/visibility and a stable per-soldier offset may affect latency. Immediate survival reactions (incoming
  fire, suppression, wounds, personally seeing a threat) stay individual and may pre-empt or beat the command.
- **Movement orders.** Regroup, new anchor/fireteam destinations, move-to-cover/structure and later directional
  commands must not expose a new exact destination to every man immediately. A soldier keeps executing his last
  adopted order until he personally receives/processes the replacement. Spatial orders may require a brief
  orient/locate step when the reference is not already obvious; simple already-forward commands need not force a
  theatrical turn.

Implement this in **small phases**, each with its own deterministic harness/probe and no combat-RNG draw:

1. **Receipt telemetry, behavior-neutral — shipped in #212.** Versioned command envelopes and per-soldier
   receive/process/adopt diagnostics now observe current posture/fire-control and movement publications with no
   combat-RNG draw and no gameplay write.
2. **Posture/fire-control adoption — shipped in #214, opt-in pending paired benchmark.** Engagement can consume
   each soldier's adopted HOLD/OPEN/precision version with `?commandPosture=1`; under-fire reflexes remain immediate,
   Squad/Meso still owns the shared decision, and the default/off arm remains Phase 0A behavior.
3. **Movement adoption — shipped in #215, opt-in pending paired benchmark.** With `?commandMovement=1`,
   Squad Command applies only each soldier's personally adopted replacement while Movement Resolver remains the
   final-destination arbiter; a pending order cannot erase the previous adopted slot. The default/off arm remains
   immediate publication.
   Arrival acknowledges the latest personally published movement envelope, not the old destination
   retained during reception. The Squad Leader cannot repeatedly spend the same old arrival to advance
   its anchor while replacement orders are pending. Destination coalescing must also verify that
   execution acknowledges the current envelope: returning to an earlier mission with the same point
   still supersedes an intervening pending order. These are issuer/execution checks; Command Reception
   remains information-only and tactical combat commitments retain Movement Resolver arbitration.
4. **Orientation and relay — current phase, split small.**
   - **0D1 reference-sensitive orientation — shipped in #216.** Distinguish simple, directional, point and object
     references so "get down", "shift fire left", "move there" and "get in that building" pay bounded,
     deterministic processing/orient/locate costs appropriate to the reference instead of one generic spatial delay.
     Command Reception still must not physically turn a man or become a stance/movement owner.
   - **0D2 relay topology — shipped in #223, opt-in via `?commandRelay=1`.** Add bounded direct voice/visual receipt and, where needed,
     Squad Leader -> fireteam relay -> member timing.
5. **Close the direct-read gaps — Phase 0E in progress.** Add a static/runtime ratchet for command-bearing squad fields so new behavior
   cannot bypass personal adoption, then run fixed-seed and paired benchmarks for churn, stalls, response latency,
   cohesion and mission progress.
6. **Inter-squad tactical broadcast — Phase 0F, design in `docs/reference/AI_TACTICS_OUTLINE.md`.** Nearby squads
   share tactical contact beyond the General's stale intel rollup. Today a squad creeping up a hill, a squad
   watching from a distance, and a squad fighting for its life from sniper fire each act on their own picture.
   0F adds a Meso-layer broadcast channel: when a squad's contact picture changes meaningfully it publishes a
   tactical broadcast to nearby squads within `BROADCAST_RANGE`; receiving squads merge the broadcast into their
   own `squad.contact` picture and the Squad Leader can react. Sliced as 0F1 (telemetry, behavior-neutral),
   0F2 (reception, default-on; `?squadBroadcast=0` is the telemetry-only control), 0F3 (reaction, shipped with reception). This is squad-to-squad, not
   Macro and not Micro; it does not bypass Movement Resolver or Engagement ownership.
7. **Multi-contact awareness — Phase 0G, design in `docs/reference/AI_TACTICS_OUTLINE.md`.** Today every layer
   tracks one threat at a time: `selectBelief` returns one winner, `squad.contact` is a single object,
   Engagement's `decide()` reads one contact. A soldier being shot at from the north while engaging an enemy
   to the south _knows_ about both (both are in `_beliefs.byKey`) but _acts on_ only one. 0G makes the existing
   multi-belief data consumable: Perception exposes a prioritized list, Engagement reacts to secondary threats,
   and the Squad Leader can assign fireteams to different threat sectors. Sliced as 0G1 (secondary threat
   awareness, opt-in `?secondaryThreat=1`), 0G2 (the read-only squad-level contacts map, available whenever default-on soldier beliefs are active; the old `?squadContacts=1` documentation is obsolete), 0G3
   (fireteam split on multi-contact, default-on; `?fireteamSplit=0` is the legacy control).

**After that prerequisite ships**, return to `docs/reference/AI_TACTICS_OUTLINE.md`'s tactical control-plane sequence:
`TacticalSituation` + read-only street/building-control diagnostics, richer `SquadIntent` metadata, then one named
`route-transition` lease before new route/structure behavior.

**Rules for active AI slices.** One conceptual behavior change at a time; existing owner boundaries remain
authoritative; new state has an explicit owner and reader; no presentation system writes simulation truth; no
combat-RNG draw merely to choose tactics; add a deterministic harness/check before relying on a visual impression;
add observe-only probe/telemetry that measures the decision dose; ship behavioral changes behind a flag until the
paired GitHub benchmark shows the efficiency gate is acceptable. **Do not make a behavioral feature imitate the old
simulation merely to satisfy an equality test.** New tactics are expected to change decisions and outcomes; benchmarks
gate broken invariants, determinism, pathological stalls/loops/churn, runtime errors and performance, while behavioral
deltas are evidence to understand rather than something to erase. Equality/neutrality checks belong only to explicitly
non-behavioral tooling or a deliberately isolated legacy/control arm. Once a slice ships, move its evidence into the subsystem section; if a compact status record must remain here,
keep it inside a collapsed completed-work accordion so the next unfinished slice stays visually obvious.

<details>
<summary><strong>Completed: soldier stress memory + reactions rollout</strong> — default shipping behavior; expand for status</summary>

The stress work that used to live in this backlog is shipped. `cower`, `flee`, `freeze` and `rage` are
Engagement states and are **all on by default** (`?stressAct=0` disables them; a comma list selects an exact subset).
The fled-man lifecycle is final: abandon weapons, leave roster cohesion, seek refuge, wait/pickup/home, rearm at base,
then reconstitute. Stress memory's `lasting`, `floor` and `relief` producers are also **all on by default**
(`?stressMem=0` is the legacy no-memory control). Presentation mappings are held by
`stress-reaction-animation-check.js`; simulation behavior by `stress-reactions-check.js`,
`stress-memory-check.js` and `fled-man-check.js`.

Historical sizing/benchmark detail belongs in the completed Soldier mind accordion above and the carrying PRs
(#139-#147, #150-#153), not in the active backlog. Future work starts with the visible active AI queue above, not by
reopening the reaction rollout.

</details>

The active AI queue is listed above and is **not** part of this deferred list. The larger command/urban/route
architecture stays in `docs/reference/AI_TACTICS_OUTLINE.md` until that major AI phase is resumed.
The unrelated asset, tuning and later-system items below remain deferred by the 2026-09-29 decision.

**Deferred / future — not V1 blockers**

Deferred 2026-09-29, none is a broken system. The first five were open items: sniper roles is a feature
that waits for models, the next four are measured tuning questions that each need a paired benchmark
before any effect is claimed.

- **Sniper roles.** Loadouts, MG-by-kind and the sidearm switch are shipped (see Loadouts and
  sidearms). Left: sniper roles (M1903A4 / Kar98k ZF39). They need a model and a weapon seat measured in
  Motion Lab, so they wait for that; the sidearm's pose and grip on the sergeant and gunner models is
  also worth a Motion Lab look once a close fight shows it. Any new role changes combat: benchmark it paired.
- **Grenades** (owner, 2026-10-02: after the open soldier-level slices, behind a flag). A carried count in
  `LOADOUTS`; a blast as a radius with falloff and a line-of-sight check through the wound model (zone, energy),
  posting the existing suppression and stress events; one new Engagement throw action (enemy inside ~30 m behind
  cover or in a building, no friend near the landing point, a cooldown, landing scatter from a fixed hash, never the
  combat RNG). Needs assets first: a throw clip (not in the pack), Mk 2 and stick-grenade models, an explosion
  sprite and sound. Contacts are mostly 150 m+, so it pays off in house and hedge fights; building clearing
  (`AI_TACTICS_OUTLINE.md`) will use it. Benchmark paired like any new weapon.
- **FG 42 balance.** The four-arm benchmark attributed the scout balance shift to the FG 42, not
  the perception cones. Test one lever at a time: Kar98k assignment, shorter practical FG 42 range,
  or wider dispersion/grouping at range. Use the existing `perception=0` / `geScout=carbine`
  arms and paired benchmark; do not bundle this with unrelated tactics changes.
- **Fighting stance doctrine.** Ownership is fixed: Engagement is the only stance writer. The open
  question is tactical policy only: whether long/medium/close combat should map more aggressively
  to prone/crouch/stand than the current `fightingStance` thresholds. Treat any change as tactics
  and benchmark it.
- **Strategic-stall scoring.** The stall mechanism is working, but ~43-46% of live-policy wakes can
  repeat the same effort because distance can outweigh `stallCost`. If revisited, tune score
  weighting with the existing `stallOutcomes`/ `stall-wakes` evidence and a paired benchmark;
  claim outcome effects only from the large benchmark.
- **Movement tolerance audit.** Cover-bound deadlock: fixed, see `bound-episodes`. Movement Progress still uses a
  3 m arrival band while some destinations require tighter placement; cover has its own bound
  window now. Audit another destination kind only if a real stuck case appears.
- **Performance:** the 100-soldier targets are met. Do not restart the audit without a measured
  regression. Startup prebaking of the 10 model FBXs / far-LOD lists is worth at most ~1 s;
  retargeted clip prebaking stays rejected at ~45 MiB. Sim CPU work (Engagement/sight and movement
  resolver) is deferred until `ww2fps` decides it will reuse this AI implementation. The trainer
  and headless benchmark staying on the procedural rig is also deferred.
- **Damage asset upgrade:** UV-painted body wounds V1 is accepted on the monolithic FBX. When Tripo
  or manual segmentation provides separate helmet/holster/major-gear meshes, add material-specific
  impact layers and detachable-equipment effects. Segmentation is not required for V1.
- **Command architecture / tactics outline:** the General/Squad Leader/Engagement ownership split and
  mission contract are already shipped. The larger next AI phase remains intentionally out of the current queue:
  versioned `SquadIntent`/single intent resolver, the stronger Squad Leader local planner, structure-control and
  street/route-transition state machines, objective secure/exploit/handoff, then platoon/company command,
  fallback/counterattack and combined arms when force size/vehicle work justifies them. The detailed source of
  truth is `docs/reference/AI_TACTICS_OUTLINE.md` (introduced by `f71ab0dd55cd03daae4b07c81665d3d74452618c`); do not
  duplicate that roadmap here or implement isolated pieces as ad-hoc substitutes. ~5 squads per side still does
  not justify a platoon layer yet.
- **Height-aware window LOS, window animation.** The limits under Window firing port: global LOS ignores the sill and the lintel, the
  sector does not follow the pose, and there is no firing, braced or reload pose at a window. Any change to global LOS is a behaviour
  change for every ray through a window: its own flag and a paired benchmark.
- **Genome rewrite and AI Graph return.** Both are stashed (see the top of this file), so the genome is the
  code defaults. When the whole AI system rewrite is finished, rewrite the genome against the finished layers
  (what it parameterises, what the layers own, one owner per number, the unread `objectiveHoldWin` settled), bring the graph back to mirror the layers and their mapping,
  then flip `STASHED` in `ai-policy.js` and run `probe_ai_graph_stash.cjs` with `STASH_EXPECT=present` and a
  paired benchmark against the defaults baseline. Not before. It must settle two things, and one direction is
  recorded:
  - **One default parameter surface.** The machines' numbers live in five places today: `BattleEngagement.tuning`,
    module 16's bound timing and `cfg()` defaults, `BattleSoldierMind.tuning`, `commander-doctrine.js`
    `FALLBACK`/`FALLBACK_DOCTRINE` and the genome's `DEFAULT_PARAMETERS`/`DEFAULT_DOCTRINE`. Make it one declared
    table (name, owner layer, default, range, unit, the states that read it) that the genome, the harness and the
    graph all read, so the duplicated defaults and `genome-gate-check.js`'s agreement test go away.
  - **The genome tunes, it never rewires.** It may change the numbers and scoring weights the declared states read
    (thresholds, holds, wake times, weights, inside their ranges) and pick among declared actions by weighted
    score with a deterministic tiebreak. States, legal transitions and owners stay code (the Phase 1 tables), so
    the ownership checks hold whatever a genome says: a genome cannot add a transition or a writer.
  - **Direction, not committed: the genome as the basis for a very light LLM planner.** It would compose a
    standing order from the declared vocabulary, e.g. "we need to retreat; base is reachable but the route
    crosses enemy ground, so retreat to the last known safe location, wait there for reinforcement or another
    retreating squad, and hold at the rally point to the last man until then". Its limits: it runs only on the
    General's and Squad Leader's declared wakes (never per soldier or per tick); its output is data checked
    against the vocabulary and executed through the existing owners (`transitionMission`, leases, the resolver),
    so a bad output is rejected, not obeyed; it is deterministic (decisions recorded with the seed and replayed,
    no live model call in a benchmark or fingerprint run, no combat-RNG draw). The example needs pieces that do not
    exist yet, each a code state or action first, with the model only choosing among them: a per-side memory of
    safe points ("last known safe location"), an assessment of a route through enemy ground, a hold with an exit
    condition ("until reinforced or joined by a retreating squad"; today a retreating squad walks `to-base` and
    reconstitution groups the `at-base` survivors at a rally point), and a hold-to-the-last-man terminal.

**Watch only**

- By design: Movement Progress ignores retreat (`movementStopReason` is the observable), and
  meeting engagements get no runtime engineer fortification (`engineerTick` exits early).
