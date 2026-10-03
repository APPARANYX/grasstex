# AGENTS.md

The single working guide for this repo. Every other doc was folded in here except
`battle/AI_TACTICS_OUTLINE.md` (tactical doctrine from MCDP 1-3 / MCTP 12-10B / MCWP 3-35.3),
which is design reference; read it when the task is about tactics, not plumbing. The full
original docs (roadmaps, lab notes, measurements) are in git history at `1a5b0cf`. `TUNABLES.md`
lists every tunable number by layer; it is Phase 5's inventory, not a guide.

## Working rules

- **A/B WORK IS DONE WITH THE GITHUB STANDARD BENCHMARK, NOT LOCALLY. NO LOCAL PROBE ARMS. NO FINGERPRINT COMPARISONS
  (`ab_fingerprints.sh`, `state-fingerprint`, `PROBE_CONTROL=1` on many battles). THEY TAKE HOURS AND THE BENCHMARK DOES
  THE SAME JOB.** THE BENCHMARK TAKES PARAMETERS: DISPATCH `battle-benchmark-standard.yml` WITH `seed` (THE EXACT SCENARIO SEED, THE SAME
  FOR BOTH ARMS) AND `query_off` / `query_on` (THE PAGE FLAGS OF EACH ARM, E.G. `query_on=coa=1`, OR `query_off=morale=0` FOR THE FLAT RETREAT;
  BOTH EMPTY IS A CONTROL: THE ARMS MUST COME OUT IDENTICAL) AND `seeds` (1 IS THE SCRIPTED SCENARIO; MORE, E.G. 100, IS A PAIRED RUN ACROSS SEEDS, `seed` THEN THE PREFIX). ONE RUN IS BOTH ARMS, ONE AFTER THE OTHER ON ONE RUNNER, AND THE RUN COMPARES THEM. COMPARE ACROSS RUNS (`main` AGAINST A BRANCH) WITH `compare_benchmark_arms.cjs` (`--count <path>`
  PAIRS ANY RECORD FIELD). IDENTICAL RECORDS ON `main` AND ON A BRANCH ARE THE PROOF THAT A CHANGE IS INERT. A PROBE IS FOR
  ONE SEED AND A FEW MINUTES, NEVER FOR AN ARM OF TWENTY SEEDS. (Said three times by the owner, 2026-09-30.)
- **Squad-performance scores are benchmark triage, never a pass/fail gate.** `run_battle_benchmark.mjs` samples each squad every 2.5 simulated seconds and records a role-aware vector (mission, movement, control, cohesion, combat when exposed, preservation) plus the raw measurements behind it. Support/reserve/garrison squads are not penalized for holding still. Standard paired runs compare the per-battle squad mean, p10/tail and dimension means; use the raw squad rows and reproducible seed before changing AI from a score.
- **Don't create new plan/roadmap/summary `.md` files.** The one exception is `TUNABLES.md`, the
  inventory of every tunable number by layer (Phase 5, the input to the genome rewrite). Update this
  file only when a command, contract or rule actually changes. Findings go in the commit message or PR body. Open issues
  hold the current state and the next step, not run-by-run logs: cite the PR that has the numbers.
- **State success criteria up front, prove them with a harness below, report the output.**
  Never claim visual/browser validation that wasn't performed.
- **Keep probes.** A one-off measurement script is a probe: commit it as `scripts/probes/<name>.js`
  (run with `scripts/run_probe.cjs`) or extend a close-up tool (`closeup.cjs` for a posed soldier,
  `closeup_battle.cjs` for one in a fight), never leave it in `/tmp`.
- **Browser probes run against the preview, not a local server.** Push the branch and point the
  script's URL variable (`CLOSEUP_URL`, `CULL_URL`, `BF_URL`, …) at
  `https://test.ivandpopov.com/grasstex/preview.php?ref=<branch>` (only the flags listed in `preview.php`'s
  `$pass` pass through, and it drops the rest silently: `morale`, `coa`, `mind`, `stats`, `perception`, `geScout`,
  `groundSteps` and any probe flag are not among them, so three "flag" arms of the 3b/3c probes once ran flag-off,
  identical to the control in 60 of 60 battles; for those, open the staged page the launcher redirects to,
  `https://test.ivandpopov.com/grasstex/preview/ref-<sha12>/battle_sim.php?<flags>`, and check the flag arrived,
  e.g. `BattleSquadStability.moraleOn()`). It has
  the real textures and hosting and loads far faster than `php -S` under SwiftShader, where the ground
  renders red. Use the local server only for what the preview can't serve: an unpushed tree, a
  `git worktree` A/B, or a change to `battle_sim_local.php`.
- **Stay in scope.** Don't touch audio, assets or animation unless asked. Unnamed uploads: ask
  what they are and where they belong.
- `main` deploys to production on every push. Put anything visual on a `work/**` or `preview/**`
  branch first (that publishes a preview; see Deploy), or open any branch in the live preview
  launcher (`https://test.ivandpopov.com/grasstex/preview.php?ref=<branch|PR#>`).
- **After a branch you worked on merges, read the run summaries** before calling it done:
  **Branch housekeeping** (deleted, or kept and why: commits pushed after the merge never reached
  `main`, so open a PR for them) and **Deploy Battle Runtime to 50webs** (the `build-v<N>` it shipped, and
  that it passed). Report both. Push further work to a fresh branch from `main`, not the merged one.
- **A PR merges only after its own CI has finished green on its head.** Never merge while CI is still running or
  was cancelled, and merge stacked PRs one at a time, each after CI and the deploy on `main` for the one before
  have finished (phases 3b to 5 merged within 13 seconds, CI on two was cancelled, and `main` stayed red until
  #123). Branch housekeeping deletes a merged PR's head branch even when other open PRs are based on it (it only
  looks for open PRs whose *head* is that branch), so retarget stacked PRs to `main` right after the merge. Nothing
  in GitHub enforces any of this; it is written down.
- **Subscribe to every PR you open or are asked to merge** (`subscribe_pr_activity`): CI results, reviews, conflicts and the
  merge arrive as events, so nobody has to say "CI passed" and the agent does not poll. Merge when the head's CI events are
  green; cover the gaps (commit-status CI, merge-queue branches, a lost delivery) with one `send_later` check-in.

## What's here

| Area | Entry points | Status |
| --- | --- | --- |
| **Battle Sim** (WW2 squad-AI lab, 50v50 US vs GE) | `battle_sim.php` → `battle/battle_sim.html`; runtime in `battle/*.js`, `battle/modules/NN-*.js` (auto-discovered, load in numeric order) | Active. Proving ground for systems that later move to `ww2fps`. |
| Grass renderer | `game.html`, `grass-api.js`, `grass-streaming.js`, `grass-realism.js`, `grass-effects.js`, `terrain-demo.js`, `terrain-baked.js` | Ported to `ww2fps`; grass is **off** unless `?grass=1` or `window.GRASS_SIM_ENABLED=true`. |
| Terrain bake | `tools/terrain-bake/` | Prototype. |
| Learning/telemetry backend | `battle_learning.php`, `battle_policy.php`, `battle_log*.php`, `battle_metrics.php` ("What We Learned" page) | Active. The page no longer reads or writes the policy and learning endpoints: the genome is stashed (below). |
| FBX Motion Lab | `labs/fbx-animation-lab.html` (calibration workbench), in-page **Motion Lab** button | Previews clips; measures hand/weapon contacts and saves per-model sidecars the game loads. |

### Tactical overlay extension point

The tactical status overlay is data-driven. `battle/module-registry.js` owns the
`tacticalSymbols` and `tacticalOverlayProviders` registries; the starter catalog is
`battle/modules/40-tactical-symbol-catalog.js`, and `41-squad-status-overlay.js` is only the renderer/read model.

- For another squad/team type, set `tacticalSymbol` on the squad or declare `tacticalSymbol` on its registered
  unit type. Add/replace its SVG primitives through `BattleModules.registerTacticalSymbol(id, spec)`; do not
  hard-code another glyph into module 41.
- For non-squad formations such as tanks, artillery batteries or aircraft, register a
  `tacticalOverlayProvider`. Its `entities(sim,faction)` may return the native objects and an optional
  `view(entity,sim)` maps each one to the small overlay contract: `faction`, position/root, `tacticalSymbol`,
  `overlayStatus`, optional `overlayDestination`, `overlayObjective`, `overlayMoving`, and `overlayInContact`.
  This keeps vehicle/air gameplay ownership out of the UI.
- Historical provenance belongs on each symbol spec. Only a spec explicitly marked
  `verifiedHistorical:true` should be presented as period-authentic; readable placeholders stay marked false
  until researched/replaced.

In the page: a load overlay (`BattleLoading`, in `battle_sim.html`) shows each boot phase (runtime
scripts, scenario, terrain, soldiers/weapons/clips, cover, navigation and squads); the FBX backend
reports per-file progress to it. **Start Battle** unpauses and unlocks audio (iOS needs the gesture).
`window.__battle__` is the live `BattleSim`. HUD buttons: World Debug, Motion Lab. **The AI Graph workbench
is stashed** (modules 30-38, until the UI pass): it does not define `BattleAIGraphEditor`, the gate every
graph module checks, so there is no AI Graph button, Macro ON/OFF button, Leases panel, Loop Watch / Order
Trace panel or export button, and `?editor=ai` / `#ai-graph` open nothing. What sat behind them still runs:
`BattleCommanderAI.setMacroEnabled`, `BattleLeases`, Loop Watch and `BattleOrderProvenance` collection, and
`BattleDiagnosticsExport.snapshot(kind)`. It comes back once the whole AI system is complete, and then it
should mirror the layers and their mapping visually (the layer table under M3C: who owns what, what flows
down and up), not the old policy-node view alone.
**The policy genome is stashed with it**, on the same switch (`STASHED` in `ai-policy.js`; the editor, the
trainer and the Genome v2 Training button read `BattleAIPolicy.stashed`). Force Command's doctrine and IF/THEN
rules and the Squad Leader's eight tuning numbers (`cfg()` in module 16, through
`BattleCommanderDoctrine.policyFor`) run on the code defaults in every environment, whatever
`state/ai-policy.json`, the scenario memory or a match's own genome says: the revision reads 0, and `set`,
`setMatchPolicies`, `refresh`, `persist` and `remember` do nothing and never touch the network. Until then a
battle depended on data outside the repo (the live genome, r14 on 2026-09-29, differed from the defaults in
22 of 28 values and in its rules), so no phase of the AI rewrite had one baseline to measure against.
Benchmarks label the policy `stashed-defaults`. **Genome off means the code defaults in `commander-doctrine.js`**
(`FALLBACK`, `FALLBACK_DOCTRINE` and the four `FALLBACK_RULES`), read from there whether or not `ai-policy.js` is
loaded (`BattleCommanderDoctrine.genomeOff()`: the module absent, as in the Node harness, or stashed): Force
Command decides a brief through `BattleCommanderDoctrine.ruleFor`, so the harness runs the same rules as the page.
The genome module's own copy of the defaults is held equal by `genome-gate-check.js`. Edges: `objectiveHoldWin`
is a genome value nothing reads; the "Training review" link stays.
**Once the whole AI system rewrite is finished, rewrite the genome** (what it parameterises, what it should
leave to the layers, one owner per number) before flipping the switch back; do not revive the old one as it
stands.
URL flags: `?seed=`, `?defender=us|ge`, `?soldiers=rifleman`, `?smooth=0`, `?animLod=0` (pose every soldier every frame), `?mergeWalls=0` (draw each building wall piece separately), `?soldierLod=0` (every soldier at full mesh detail), `?soldierCull=0` (draw soldiers outside the view too), `?clipPack=0` (parse every clip from its FBX instead of the prepared pack), `?fastRetarget=0` (retarget clips with the old matrix loop), `?cloneBounds=1` (Babylon's skinned bounds when cloning a soldier), `?farHz=<n>` (re-pose soldiers beyond the screen-space-scaled 100 m reference band at n Hz, default 10; 1080p / 0.8 rad FOV = 100 m), `?boneTextures=1` / `=0` (force bone matrices through a texture per skeleton / shader uniforms; default: uniforms where the GPU has room), `?weaponInstances=0` (a cloned weapon mesh per soldier), `?tracerPool=0` (a new line mesh per tracer, as before the pool), `?fxPrewarm=0` (build muzzle flashes, tracer lines and decals on first use, as before), `?perfTimings=1`, `?bench=1` (device benchmark, below). Behaviour A/B flags (they change the battle; for paired benchmarks only, via the standard benchmark's `query_on` / `query_off` inputs): `?stanceVis=0` (old stance visibility: crouch 72%, prone 45%, moving +22%; default 60% / 35% / +18%), `?fireControl=0` (old immediate-fire behavior; default Squad Leader hold/prepare/open-fire discipline), `?slStress=pick,hold,review` (the Squad Leader reads its men's stress through the `lead` lever, module 16, **all three on by default since 2026-10-01**; `?slStress=0` is none, `1`/`all` all three, a list exactly those named: `pick` sends the calmest fireteam that can bound instead of the next in rotation, `hold` skips a bound cycle when every team that could go is at the shaken band, `review` asks the General for a doctrine review when a squad on a hold/support/regroup brief stays at mean stress 1/3 for 10 s of contact; `squad-stress-check.js`), `?perception=0` (perception before #55: no view cone or sector scan, nothing heard or relayed), `?geScout=carbine` (German scouts on the generic 250 m carbine instead of the FG 42), `?mind=0` / `?mind=observe` / `?mind=react,aim,hesitate,shock,morale,act` (soldier condition, module 17: off; state kept but nothing reads it; only the levers named; default all), `?stats=0` / `?stats=for,tac,...` / `?stats=all,deal` (soldier stats, module 10: `?stats=0` off; a list enables only the named levers; **default all stats, `squad`, and `deal`**, so each squad's roles/weapons are assigned from its men's stats at spawn), `?stressMem=lasting,floor,relief` (stress memory, module 17; **all three are on by default**, `?stressMem=0` disables memory, a list names exactly the producers that run, `1` or `all` for the three: `lasting` stops stress draining on its timer while the squad is in contact or he is under fire, `floor` the ratchet of health lost times stress that nothing takes him below, `relief` kills, a taken objective, cover reached under fire and a spell of fire survived taking stress off; described under Soldier condition), `?stressAct=cower,flee,freeze,rage` (stress reactions, Engagement, **all four on by default**; `?stressAct=0` disables them, a comma list enables exactly those named, and `1` or `all` enables all four: a rattled man under fire goes to ground, a broken man runs, stops or charges; described under Soldier condition), `?rageLock=0` (**rage lock, trance and charge guard are on by default since 2026-10-02**, measured in PR #158; `=0` turns each off alone: a man in `rage` charges the nearer of his own target and his squad's contact, the enemy his break measured; off, a target past `RAGE_REACH` with the squad's contact inside `RAGE_RANGE` ends the charge on the tick it began and he breaks again the next tick, renewing the guard each time; `stress-reactions-check.js`), `?rageGuard=0` (on by default; off, the berserk guard lasts `RAGE_GUARD_SECONDS` from the break; on, the berserk guard lasts the charge, from the break until he is within `MELEE_RANGE` of the man he charges, dies or leaves `rage`; `stress-reactions-check.js`), `?rageTrance=0` (on by default; `=0` is the old rage that ends `REACT_MIN` after he calms: rage is a trance, final like a flee: calm, `REACT_MIN` and his squad's retreat or regroup do not end it, only his death or nobody within `RAGE_REACH`; for all of it he takes `RAGE_TRANCE_GUARD` (an eighth) of every hit, runs at `RAGE_SPEED` of his gait (module 11; a leg wound does not slow him) and shoots a `RAGE_AIM` group (`14-z`); the hp the guard held back is owed and comes due when the trance ends with him alive (`BattleWounds.succumb`, no roll), killing him if it takes him to the collapse line; `stress.acts.rage` counts `kills`, `survived`, `debtHp` and `succumbed`; `stress-reactions-check.js`), `?morale=0` (group morale off: the flat 60% casualty retreat instead of the Squad Leader's break and rally) and `?coa=0` (course of action off: no `assault`/`defend` bound gate); **both are on by default**, both in module 16 and described under Group morale and course of action, `?coverFire=0` (cover and stance the old way: any slot that shelters him, and the stance he wants even if it blinds him; default: cover keeps a line to the threat unless he is under fire, and he takes the lowest stance that still sees his target), `?windowPort=0` (window stations the old way: a point .775 m inside the wall, a fixed crouch, fire gated on a 75° cone the opening does not let through, facing the claim-time threat; default: a firing port, see Tactical positions), `?steerLeg=0` (steering looks 1.8 m ahead past the end of its leg, and only the destination's circles are exempt), `?crawlFit=0` (a suppressed man crawls to any cover under 14 m, even at a run, instead of only to cover he can crawl to inside the bound's window from a standing start), `?navCorner=0` (navigation keeps a corner he stands on within 0.35 m, when the edge onward is not clear from his foot, instead of consuming it: he never walks to it, and every replan returned it; `objective-nav-check.js`), `?contactStance=0` (an advancing man stands as soon as `squad.inContact` blinks, instead of staying low while the squad's picture is within `ALERT_HOLD`), `?coverStance=0` (stance the old way: the Squad Leader's hold-fire drill lays every man prone and a man fights prone at long range or under fire wherever he is; default: prone only in the open, in cover he crouches behind it and `seeingStance` raises him as far as he must to see over it, prone in cover only under fire behind cover too low to crouch behind; Engagement, `fightingStance`, `prepareFireControl`, `alert`), `?alertHold=0` (alert lapses after `ALERT_HOLD` and he stands to march; default: a man who has seen the enemy or prepared a volley stays in the fight, `eng.engaged`, holding his sector low until it is won, lost or the squad has lost contact: `engagementLive`, `squad.inContact` or the squad's own first-hand sighting within Perception's `CONTACT_MEMORY`; heard and relayed word do not keep it on), `?alertAdvance=0` (on by default; off, an alerted squad holds its cover for as long as its picture of the enemy lasts; on, once nobody in it has seen an enemy or been shot at for `CLEAR_AFTER` (6 s) and it still has its own first-hand picture, the Squad Leader orders it to move up on the last place it saw the enemy (`sq.clearContact`, module 16 `updateClearContact`): the anchor advances on that point (its first stride at once), fire control opens and stays open while the order stands, and Engagement's `alert` lets a latched man past his sector hold who is not suppressing follow his order crouched, watching the point (`s.state` `clear`); it ends on a sighting, fire, arrival (`cleared`), `CLEAR_MAX` (90 s), a holding phase or retreat, and a picture already cleared is not ordered again; `clear-contact-check.js`, `clear-contact` probe), `?scoutsForward=0` (**Scouts Forward is on by default after #196**; `=0` is the legacy no-recon control: on an unknown/observation-limited approach the Squad Leader may hold the main body and send a deterministic scout-first pair through normal Movement Resolver/navigation, ending on reportable contact, interruption, completed observation, timeout or command invalidation; Perception is the only source of scout knowledge and only delivered `BattleCallouts` create `told` beliefs; no-contact remains unknown; `scouts-forward-check.js`, `scouts-forward` probe), `?leaderlessIntent=0` (**Leaderless intent continuation is on by default after #197**; `=0` restores the pre-slice succession-gap behavior where module 16 can keep making fresh Meso decisions despite no Squad Leader. Default behavior captures the last valid parent intent when the existing 6 s `succession` lease begins, freezes new Meso route/phase/anchor/plan/COA/fire-control/recon/regroup/bound decisions, permits already-published Movement Resolver orders and an inherited bound to finish, keeps Engagement/Perception/self-preservation and survival retreat alive, and hands normal ownership back to the promoted successor; `leaderless-intent-check.js`, `leaderless-intent` probe), `?callouts=0` (tactical callouts, `modules/09-tactical-callouts.js`, **on by default since 2026-10-02** (owner's decision on #170; run 230, 100 seeds: casualties in the first two minutes -20%, resolver changes -13%, strategic-stall wakes +49%), `=0` is the old free relay: word of the enemy passes between squads only as a call a man of the listening squad heard, `CALL_RANGE` 60 m from the caller, after it is said and heard, and it can be missed (deterministically, more often far off, in gunfire and under fire; a frozen or fleeing man does not listen), replacing the free relay between squad centres within 50 m; voice stays presentation; `callouts-check.js`), `?groundSteps=<n>` (how many samples `groundStop` takes along a round's line, 12 to 96, **default 48**; `?groundSteps=24` is the sampling before #126, for a paired A/B; `14-z`, and see `ground-stop-check.js`). Measured 2026-09-30 (runs 105/106 against 97/100, 200 paired battles, numbers in #126): winners 81 to 88 US (p = 0.38), time-limit 108 to 105, movement stalls 102 to 65 (per-battle p = 0.28), wall time x1.027, 0 runtime errors: no detectable effect either way; 48 is the default because `ground-stop-check.js` proves the 24-step blind spot, not because a benchmark showed a gain.

**Command isolation / recovery controls (default on):** `?generalIntel=0` restores the pre-#201 Macro truth-read control; shipping Force Command runs two explicit per-battle General contexts (US/GE), each with separate mutable state and hostile information only from its own squads' reported contacts. `?combatHandoff=0` restores immediate Micro→formation release; shipping Engagement requires 2.5 s continuous quiet before yielding movement. `?rallyRecovery=0` restores morale-only rally; shipping retreat remains authoritative after psychological recovery until the Squad Leader has stopped the survivors at a local rally point, restored physical cohesion and held it for 4 s. These are paired-validation controls, not alternate owners.

## Test harnesses

All of these run offline in seconds unless noted, and all pass on `main`.

**Node sim checks** (`tools/ai-sim-harness/`). They load the shipping sources with no Babylon and
no browser. CI runs every `*-check.js` plus `run.js` across 8 seeds.

```bash
for c in tools/ai-sim-harness/*-check.js; do node "$c" || break; done
for s in 12345 1 2 3 5 8 13 21; do HARNESS_SEED=$s node tools/ai-sim-harness/run.js >/dev/null || echo "seed $s FAIL"; done
```

| Check | Asserts |
| --- | --- |
| `run.js` | Engagement contract: orient before firing, cover used, get down in contact, a squad in contact stops marching, suppression pins, no stance churn, 10v10 resolves. `HARNESS_SEED=<n>` swaps the battle. Its scenarios isolate base Engagement from higher layers (`H.bootstrap({search: '?morale=0&stressAct=0'})`): on some seeds a squad that has taken casualties under fire breaks early, which is the Squad Leader's business and has its own checks. `?slStress=0` too: a squad just pinned flat is shaken, and holding its bound cycle is the Squad Leader's stress lever (`squad-stress-check.js`), not base Engagement. |
| `engagement-state-check.js` | Engagement declares every stored state and legal transition, preserves the distinct legacy effects of drill, urgent-cover, shared-contact and station-release entries, and rejects illegal requests. |
| `squad-phase-check.js` | Squad Leader command phases are declared as data behind one transition function; setup/regroup remain silent, mission changes retain their telemetry, and mutations cannot add another writer. |
| `macro-state-check.js` | Macro brief lifecycle (`issued → executing → terminal`) has one owner; ordinary and repeated assembly acceptance keep their legacy clocks/events, and terminal records stay immutable. |
| `general-isolation-check.js` | US and GE General contexts are distinct; unreported enemy transforms/roster strength are invisible to Macro, while own-side squad reports supply stable last-known hostile information. |
| `faction-progress-check.js` | Strategic objective-progress clocks are faction-local; one side's capture/progress cannot reset the other General's stall age, and retreat fragments are excluded from assignment-health counts. |
| `combat-handoff-check.js` | The US-3-style Micro→formation transition requires 2.5 s of continuous quiet; renewed contact cancels the release clock. |
| `rally-recovery-check.js` | The US-1 backwards-assault regression: morale recovery alone cannot reverse retreat movement; physical cohesion + rally dwell are required before mission hand-back. |
| `loop-evidence-window-check.js` | Loop alerts attach order/conflict evidence only for the same entity within ±30 s, rather than misleading battle-wide history. |
| `squad-performance-check.js` | Role-aware benchmark scoring stays bounded, makes severe backwards progress/churn visibly worse, and does not punish support/reserve squads for correctly holding position or invent a combat failure when they had no combat opportunity. |
| `state-ownership-check.js` | Static ownership ratchet for Engagement state/clocks, Squad Leader `commandPhase`, Macro brief/status, the anchor pair (`orderAnchor`/`rally`: `publishAnchor` only) and the two soldier status timers (`suppressedUntil`: `SquadAI.pin`; `_combatUrgentUntil`: `BattleEngagement.markUrgent`/`clearUrgent`; `createSoldier`'s spawn stamp aside), including alias/bracket/mutation APIs and only the two guarded setup fallbacks. |
| `wire-map-check.js` | Writer-file ratchet over every squad, soldier, Engagement-record (`soldier.eng`) and mind field (`wire-map.js`: a dependency-free scan of `battle/`; chains, `delete`, prefix `++`, indexed receivers and per-file aliases). Each field that more than one file writes is in `fixtures/wire-map-baseline.json` with a role per writer (owner, layer, setup, fallback, slot, body, debt) and a reason; debt names its phase or `unscheduled`. A new writer file, or a new field with two, fails until the baseline says why; a listed writer that stopped writing fails until its entry is removed, so the list only shrinks. Also: scanner fixtures (what it finds and what it ignores), real recall anchors, agreement with `state-ownership-check.js`, and an excluded file may write only what `EXCLUDED_WRITES` declares. |
| `objective-nav-check.js` | Real worst-seed defects: a corner he stands on within 0.35 m is consumed (`?navCorner=0` holds it, the control), never permanently refused a step at a building, no all-squads-one-objective, a side attacks at most 2 objectives at once yet every objective is attacked once the efforts before it fall, capture progress survives an interrupted hold, door/window routing, `stepMovement` aim smoothing |
| `tactical-positions-check.js` | Window/hardpoint reservation ownership, ingress routes, release reasons, diagnostics |
| `cover-positions-check.js` | Cover-slot selection against obstacles and physical footprints; cover is for fighting from (a slot no stance sees the threat from is refused unless he is evading fire; `?coverFire=0` is the old choice), he rises to see over a low wall, reaching cover ends the run's crouch, and a suppressed man crawls only to cover he can crawl to inside the bound window from a standing start (`?crawlFit=0` is the old `d < 14`) |
| `personal-space-check.js` | Physical endpoint allocation and body separation |
| `fireteam-frontage-check.js` | Each fireteam holds its own ground: published fireteam anchors stay ≥5 m apart while squads march, deploy and fight |
| `formation-backward-check.js` | While a squad advances, no formation destination lies >3 m behind both the man and his fireteam's forward line: a team's anchor follows the team forward when its men ran ahead of a held squad anchor, at fireteam renewal and when a teammate falls |
| `movement-recovery-check.js` | Recovery episode state machine, goal resets, unreachable criteria, retreat override |
| `movement-state-check.js` | Resolver/movement-progress state for bounds and assault |
| `lean-runtime-check.js` | Squad-plan stability + resolver + tactical route with no extra modules |
| `macro-command-toggle-check.js` | Macro OFF suppresses Force Command while downstream hooks still run |
| `map-pipeline-check.js` | Scenario regeneration publishes the same geometry as a page load (benchmarks once ran 10-70x slow on 4x the hedges) |
| `sight-query-check.js` | Pruned geometry queries answer exactly as unpruned: `sightBlocked` (crossed cells, first hit) vs nearest-hit `sightBlocker`, and `movementClear` with vs without wall bounding boxes, on real scenarios |
| `impact-fx-check.js` | Impact materials, hole kind per surface, decals on terrain/wall face, wound decals on the hit bone, exit spray, sheet-cell UVs, FX budgets, restart cleanup (render stub) |
| `loadout-check.js` | `ROLES` carries no weapon, `SquadAI.loadoutFor(role, faction)` is the only place a role picks one and returns a copy, the default table deals what the roles carried before (a battle is unchanged), a dealt squad wears the loadout's kind and the side's profile |
| `sidearm-check.js` | Module 47: a man with a holstered sidearm draws it inside `NEAR` when his primary is jammed, reloading or empty, or inside `CLOSE` when it is a long gun (an SMG is not clumsy), takes the primary back after `HOLD` past `LEAVE` or when the pistol is dry; the draw costs `DRAW` before the next shot and unemplaces an MG, a jam survives the draw and is cleared at a cost on return, no combat-RNG draw, no stance write, no sidearm means no change |
| `weapon-wound-check.js` | Side-specific weapons (Garand/Kar98k, M1919A6/MG42, Thompson/MP40, M1 Carbine/FG42 with the scout's reach following his weapon), bursts at the cyclic rate, the FG42 automatic only inside `autoWithin`, sustained rates, a burst stops when the belt runs dry, hit zones from the ray, head/chest/leg/arm wound outcomes, bleed-out, drop odds per zone and cartridge, a rifle round through one man into the next (less energy, deflected) and a pistol round stopping |
| `world-debug-check.js` | World Debug overlay UI handlers (DOM stub) |
| `extension-order-check.js` | No module replaces `SquadAI.tryFire`/`areaFire`/`updateSoldier`/`updateSquad` or `BattleEngagement.updateSoldier`; the declared fire order (ammunition → ballistics range → trigger-time LOS) holds; undeclared extensions throw |
| `genome-gate-check.js` | The stashed genome is the code defaults: a hostile server genome, scenario memory or per-match genome changes nothing (revision 0; Force Command's doctrine and the Squad Leader's tuning numbers read the defaults); `set`, `setMatchPolicies`, `refresh`, `persist` and `remember` do nothing and never call `fetch`; the trainer does not load; only `ai-policy.js` reads `BATTLE_AI_POLICY`, `BATTLE_AI_MEMORY` or `.aiGenomes`; the genome's defaults and the doctrine module's `FALLBACK`, `FALLBACK_DOCTRINE` and `FALLBACK_RULES` agree (bar the unread `objectiveHoldWin`); genome off (stashed, or no genome module), all 512 combinations of the brief's context flags get the same rule with or without the module, and Force Command asks `ruleFor`, never the genome module; with the switch flipped the same inputs DO take effect (the control). |
| `window-port-check.js` | Window firing port (`station.port`, built by Navigation from the opening's metadata; `?windowPort=0` is the old station, the control): anchor .45 m behind the wall plane (the inner face is .16), stance from the sill (low sill crouch, normal stand, a high one only if the eye still clears; an opening no stance fits is rejected into `N.rejectedWindows` with a reason and never offered), sector from the jambs; `N.aperture` follows a 3D line to the wall plane and asks jamb, sill and lintel (eye and bore, from the stock, are separate lines: eye sees and bore blocked holds fire and keeps the post); a bad first pose is corrected inside the port through `BattleTacticalPositions.adjustPose` (forward, then along the sill, a listed stance; never a release or a new route); target loss, a target past the jambs and a reload hold the post and fire resumes; exclusivity, no sergeant, one registered owner, the route legal and ending on the anchor; `BattleNavigationPhysicality.windowDiagnostics` rows |
| `lease-check.js` | `BattleLeases` primitive, tactical-plan and regroup lease lifecycles, regroup re-forms on the rally point |
| `reconstitution-check.js` | Retreated squads home and out of contact reaching 10 survivors group (fewest squads; none planned en route), march to the rally point, merge under one leader (promotion never picks the gunner), get re-tasked; below-strength groups dissolve; a merged squad that is still shaken rests at base and is not grouped with itself again (stress that lasts made this common; the loop was 281 groups in 420 s); Macro OFF does nothing |
| `regroup-axis-check.js` | A man behind the regroup anchor is a trimmable straggler, never an outrunner (the regroup keeps the direction the squad was marching), men ahead or to the side still block, and a regroup whose only scattered man is behind ends on `cohesion restored`, not on the clock; swept over march directions (main fails it) |
| `succession-check.js` | A killed leader is replaced by the most senior survivor after the 6 s `succession` lease, never more than one leader, the gunner only as the last man, successors replaced in turn, no lease on a led or wiped-out squad, seniority order |
| `leaderless-intent-check.js` | Intent-based continuation during the existing succession gap (`?leaderlessIntent=0` legacy control): leader loss captures the inherited mission/phase/route/objective/anchor/member task destinations; fresh Meso evolution is frozen; already-published Movement Resolver movement and a live inherited bound can finish; immediate contact remains Engagement-owned without creating a replacement Macro brief; retreat remains legal; successor hand-back is explicit and deterministic; flag-off preserves the pre-slice control behavior. COA's own leader-down assertions explicitly use `leaderlessIntent=0` so the two ownership contracts stay isolated. |
| `perception-check.js` | View cones (120° focus at full range, ±100° periphery shorter, behind only within 10 m), head turn toward the squad's known threat, a sector scan while holding still with no known threat, contact relayed to a friendly squad within 50 m (first-hand only, keeps its age), enemy gunfire heard within 120 m with a distance-scaled position error, own sightings outrank both, no combat-RNG draws |
| `threat-disposition-check.js` | Perception's one read-only threat classification: active threat vs visible non-threat vs inactive; normal/cower/rage/reconstituted soldiers remain threats; freeze/flee and explicit civilian-style `combatant=false` remain physically visible but do not become/retain targets, shared contacts, suppression victims, fire-control targets or tactical-route threats; rage remains aimed-fire/suppression eligible; known non-threats do not fall back to last-seen threat memory; returned records are frozen and classification draws no combat RNG. |
| `squad-stress-check.js` | The Squad Leader's stress lever (`?slStress=pick,hold,review`, all three on by default, `?slStress=0` none): the flag parse; off (`0`, `off`, an unknown name), the rotation is stress-blind (same teams, same order, same telemetry); `pick` sends the calmest team that can go (a tie keeps the rotation, a team that cannot go is never picked); `hold` skips the cycle (a `bound-cycle` lease, `decision-bound-held`) only when every team that could go is at `tuning.lead.holdAt`; `review` raises one doctrine-review request per hold/support/regroup brief after `reviewAfter` s at `reviewAt` with `reviewMin` living men, the clock restarting on a dip; module 17's `teamStress`/`leadStress` read stress only through the `lead` lever. |
| `fire-control-check.js` | Squad Leader fire discipline: first visual contact holds fire, the squad prepares prone, 70% readiness/strength/MKM opens a volley, long range can designate one high-MKM scout/marksman, personal incoming fire bypasses the hold and opens the squad on the next command tick, and `?fireControl=0` restores immediate fire. `run.js` deliberately uses that control (and `?stanceVis=0`, the old stance visibility) because it is the isolated base-Engagement harness; this file owns fire-control regression coverage. |
| `crest-fire-check.js` | Permission to fire tests the round's own line: over a crest that shows the head but would take the round (or a narrow crest between sight samples) he still sees the man but pulls no trigger; suppressive/area fire uses the same ballistic ground-line test instead of shooting a remembered position through a hill; on open ground or over a lower crest he fires; terrain refusals are counted for diagnostics and the gate draws no combat RNG |
| `macro-relief-height-check.js` | Macro relief's runtime `heightAt` samples the exact triangles of the deformed rendered ground, so feet, LOS, cover and ballistics cannot see a smoother/lower hill than the player sees. |
| `ground-stop-check.js` | Ground stop (14-z `groundStop`, `?groundSteps=<n>`, 12 to 96, default 48): the flag parses as documented and the shipped default is the 48-step scan; a 12 m ridge between two samples of a 450 m rifle's range (37.5 and 56.25 m at 24 steps) lets the round through into the man at 24 steps and takes it at 48, and a 3.2 m ridge in the trigger gate's span is let through at 24 and refused at 48; on 500 rolling-ground shots 48 steps stop every round 24 stop (24 samples are a subset of 48). `--measure` prints how many of 6,000 shots end differently and the cost per shot. The module is loaded from its shipping source with a stub `location`. |
| `voice-determinism-check.js` | Voice callouts never draw from the combat RNG: a battle is identical with and without voice |
| `combat-audio-check.js` | Combat audio (module 15-combat-audio.js, presentation only, `?combatAudio=0` off): a round passing within 10 m of the camera plays one flyby (crack within 6 m for a supersonic round, whiz beyond or for a .45; nothing for the shooter's own round within 6 m of its muzzle); the round's end one impact by surface or, on stone and metal, sometimes a ricochet instead (a hash of the point, likelier grazing, never the RNG); each body struck one flesh hit and its man one cry (`wounded`/`down`, none for a killing head shot, none again within 3 s); per-group caps on clips at once and the gap between starts, so a burst is never a wall of noise; sounds wait for the speed of sound; no combat-RNG read. |
| `weapon-foley-audio-check.js` | Weapon foley and burst tails (module 15-weapon-foley-audio.js, presentation only, `?weaponFoley=0` off), against the real manifest: every fielded model has single-round `fire`, `fireDistant` and stoppage clips; each mechanism's reload plays its own stages in order at fractions of the reload (belt: cover open, belt, cover shut, charge; en bloc: clip in, op rod home; stripper: bolt open, clip, bolt shut; magazine: out, in, charge or slide release), none after he dies; a stoppage clicks then racks clear; a bipod gun deploys going prone and folds getting up; a bolt gun cycles after a shot that leaves a round, a Garand pings out an empty clip; an automatic plays one tail after `TAIL_QUIET` cyclic intervals of quiet, heard to 600 m while handling stops at 30 m; no soldier write, no `Math.random`. |
| `voice-observations-check.js` | The voice that reads the battle (modules 47 and 48, presentation only: module 48 speaks the scripted lines of #170, from heard gunfire and fire-control orders to wounds, jams and stress reactions, on the state change that causes each) leaves a four-squad battle identical (positions, health, deaths, combat-RNG draws) with every line enabled and without it, speaks new lines on it, and every line it speaks is recorded for both sides |
| `local-steering-check.js` | `stepMovement`'s soft steering (`steerAroundObstacles`, loaded from `battle-sim.js`; the harness stubs it out of `stepMovement`): a man bounding to a wall's cover slot between two tactical circles reaches it, the circles his destination hugs never push him, avoidance deflects but never turns him round, and it still steers round an obstacle on the way elsewhere; the look-ahead never passes the end of his leg and circles holding his waypoint do not push (the scout's real wall, three circles) |
| `stance-ownership-check.js` | Engagement is the only stance writer: no other runtime file sets `prone`/`tacticalCrouch`/`crawling`/`crouching` (the body's `setCrouch`/`setProne` and SquadAI's no-Engagement fallback aside), `crouching` is derived from the committed flags (never stored, a write throws), `BattleEngagement.requestStance` only takes a man lower, and an advancing man is crouched while his squad is on the enemy's heels (`inContact` or a picture within `ALERT_HOLD`) or he is under fire |
| `clear-contact-check.js` | Clearing the last contact (`?alertAdvance=0` the control): the flag parse; the Squad Leader orders `sq.clearContact` only after `CLEAR_AFTER` quiet seconds on the squad's own first-hand picture (never heard word), opens a waiting hold-fire order, follows a newer sighting, ends on a sighting, fire, a holding phase, retreat, arrival (`cleared`) or `CLEAR_MAX` (`timeout`) and does not re-order a cleared picture; the anchor heads for the point, not the objective, with no forced stride when the point moves; an alerted man past his sector hold follows the order crouched (`clear`) and proposes no hold, and without the order he holds. |
| `scouts-forward-check.js` | Scouts Forward (`?scoutsForward=0` legacy control): qualifying unknown/crest approaches, adequate-current-picture suppression, deterministic scout-first/buddy selection with no combat-RNG draw, main-body hold and normal Movement Resolver ownership, hidden-truth isolation, personal `seen` until callout delivery, delivered `told` versus missed/out-of-range ignorance, no-contact uncertainty, bounded timeout/cancellation, same-approach retrigger blocking, and the bounded no-contact recon-rejoin use of the existing regroup-bypass lease. |
| `player-control-check.js` | Player possession is a short movement lease above AI goals; while live it prevents Perception/Engagement from replacing the player's target, carries the L3 run multiplier through the real movement integrator, changes crouch/prone/stand through Engagement's stance owner, and after release normal Perception reacquires the enemy. |
| `soldier-mind-check.js` | Soldier condition (module 17): a friend down is felt by distance, line of sight past 8 m and squad (not by enemies, the far or the blind), the leader down by the whole squad within 60 m, suppression/wounds/aimed rounds add stress (rounds by range), decay with the leader, cover and company calming and being under fire slowing it, contagion never past the neighbour, stress in [0, 1], band hysteresis, levers neutral when off, the module writes only `mind`, and a full firefight with it observing is the same battle (end state and combat-RNG draws) as one without it |
| `soldier-mind-behaviour-check.js` | What stress costs a man: recognition (`reactTime`, the orient window, the re-orient) stretches, the shot group widens, an ordered bound waits (never past the 3.6 s window, forgotten with the order), a shocked man does not fire, halts and crouches if only advancing, and starts no bound; each lever neutral when off and separately switchable, the `morale` lever included (the squad mean the Squad Leader reads is the roll-up with it on and calm men with it off, observing or not listed) |
| `soldier-mind-telemetry-check.js` | What the benchmark's `stress` block counts and that counting changes nothing (module 17 `noteReact`, `noteAim`, `noteBound`, `noteLapse`, `noteShock`, `step`, `telemetry`): a recognition is one decision when it begins (not each tick of the orient window), a round is one when it leaves the muzzle, a bound when it starts and whether it waited, an order that ended while he waited is a lapse; the freeze is counted only when it alone stopped a decision (Engagement asks it last, and `fireAllowed` gives the same answer as before in all 128 combinations of its conditions); lever off counts nothing changed, `?mind=0` keeps nothing; no combat-RNG draw and nothing written but the man's own `mind`; the series is one row per side per simulated second in the named columns, cumulative where it counts, squads are over at mean stress 1/3 (and with 3+ living men) with an entry marker at the simulated second, markers are capped and the overflow counted, sides add up to the whole and bands to the changed decisions, `reset` clears it, a 600 s block stays under 200 KB |
| `mind-read-map-check.js` | The read-side ratchet for stress (scanner: `mind-read-map.js`; the wire map's sibling for reads): every file under `battle/` that reads `BattleSoldierMind`, `soldier.mind` or `squad.mind` is a row of `BattleSoldierMind.READERS` (kind, lever, layer, file, reader, member read and how many times, unit, flag), member by member and count by count; an unlisted file, an unlisted member, a different number of reads, a stale row and a row for a file that is gone all fail; every lever has a reader row and a telemetry row; tooling (scripts) is held to the file. Scanner fixtures: a function of the module by its global, an alias (`M` in Engagement, `Mind` in World Debug), optional chains and bracket forms are found, writes, deletes, increments, comments, strings, regular expressions and object-literal keys are not. `GRASSTEX_SOURCE_ROOT=<checkout>` runs it against another tree. |
| `callouts-check.js` | Tactical callouts (module 09, on by default, `?callouts=0` the control): off, the module is inert and the 50 m relay is unchanged; on, a squad's first-hand sighting is called by the man who saw it, men of other squads within `CALL_RANGE` hear it no sooner than `SPEAK + REACT` (plus distance / sound) and only then is it their squad's relayed contact (age kept, the call named); out of earshot nobody learns; frozen, fleeing and dead men do not hear; a stale sighting is dropped; a squad calls again only after `CALL_REPEAT` or for another enemy; calls never chain; misses are deterministic, rarer close and in quiet than far and in gunfire; no combat-RNG draw. |
| `soldier-events-check.js` | Module 08: the vocabulary is declared data with distinct priorities and an unknown kind throws; a kind nobody reads is not queued and a dead man is not posted to; a reader drains only its own kinds by priority then posting order; the queue is bounded and counts what it drops; a casualty is logged and announced once to living men of his side inside reach; `SquadAI.pin` posts the hold it set and the wound model posts only a hit he survives; no combat-RNG draw. |
| `stress-memory-check.js` | Stress memory (module 17, `?stressMem=lasting,floor,relief`; **all three on by default**, `?stressMem=0` none, a list exactly those named): the flag parse (the default, `0`, a list without lasting); `lasting` holds stress while the squad is in contact or he is under fire and drains it once both have been quiet for `CALM_AFTER` (off, it drains as before, and a tick's gain is the same either way); `floor` is the larger of itself and (share of health lost) x stress, the worked example from AGENTS.md (50% health and 60% stress is 30%; 40% and 80% is 48%), nothing takes stress below it, a man never hurt has none, a healed man's floor falls with the lost health it was set at (a floor of 50% at 50% health, healed to 85%, is 15%); `relief` kinds are queued only when read and each takes `RELIEF[kind]` x nerve off, never below the floor, counted by kind; the wound model tells the shooter of a kill (never of a friend), Engagement reports cover reached under fire and a spell of fire survived (not one that wounded him), the capture zone tells the takers who stood in it, on capture and on neutralising; nothing written but `mind`, no combat-RNG draw, the telemetry's memory block. |
| `stress-reactions-check.js` | Stress reactions (Engagement, `?stressAct=cower,flee,freeze,rage`, all four on by default; `0` off, a comma list exact): the flag parse; the four states declared with their transitions and enterable from every other state; nobody reacts with it off, with `?mind=0`, `?mind=observe` or a lever list without `act`; `cower` (rattled and under fire goes to ground, prone or crouched, holds, no aimed fire, up again when the fire has been quiet for `COWER_QUIET`; not when shaken or not shot at); the break by temper x situation (flee needs trouble, freeze fits fire, rage needs an enemy within `RAGE_RANGE` and a weapon, ties flee/freeze/rage, nothing enabled or no weight means no break); `flee` leaves his weapons, runs to his squad's last safe point (else its home), never fires, holds on arrival, releases a firing station and does not end (calm and his squad's retreat leave a fled man fled; the rest of the lifecycle is `fled-man-check.js`); `freeze` holds, no fire, ignores a bound order; `rage` charges, fires on the move and strikes at arm's length (the blow rolls the combat RNG, the choice never does), ends with no enemy in `RAGE_REACH`; a freeze, cower or charge lasts at least `REACT_MIN` (cower: until the fire is quiet); a retreating squad is not reacted for; the squad report names the men reacting and the Squad Leader does not send them (a mutant without the filter fails it), they are not base of fire or suppressors; the resolver ranks `flee` 92, `rage-charge` 72 and a hold while down 85, and drops a flee or charge outside its state; the reaction counts in the telemetry; the berserk guard (a quarter of the damage, of the chance to drop him and of the bleed for 5 s from the break, the same two draws from the combat RNG, none for any other reaction, counted in `stress.acts.rage`; three mutants of the wound model fail it). Swept over `HARNESS_SEED=1..40`. |
| `fled-man-check.js` | The man who has fled (`?stressAct=flee`, the whole lifecycle through the shipping Squad Leader, General, resolver, Engagement, module 17 and the ammunition module): he leaves his weapons (`BattleWeapons.abandon`, the sidearm with the primary, the primary's `droppedAt`), tells the soldier condition (stress never drains below `FLED_FLOOR` 0.2) and runs to the squad's `safePoint` (the last place it stood out of contact with nobody known near; with trouble known it stops following the squad) or to its home when the trouble is within `FLED_SAFE` of it; the Squad Leader lets him go from the roster (a squad of one in retreat, a full squad's strength missing, `fledId`; a leader who runs leaves the squad leaderless and succession follows); at the refuge he waits `FLED_WAIT` seconds however calm he gets, then goes home alone; an enemy known within `FLED_ENEMY_NEAR` sends him home at once; the General has a retreating squad out of contact within `FLED_PICKUP_RANGE` take in a man who is waiting (not one still running, not one near a squad in contact or far off), and he goes home with it; at base `SquadAI.rearm` issues his role's loadout, a man of a retreating squad of one, still on his own, recovering to the floor and no lower; reconstitution groups him with other at-base survivors and he rejoins the fight in a full squad, armed; the ammunition module, the sidearm hook, `tryFire`, the squad report and the ammunition snapshot run with an unarmed man; a man in a fled phase is outside the roster's cohesion assessment (the control: three ordinary men 200 m behind are a dispersal); no combat-RNG draw from the break to the weapon at base; cower and freeze keep their weapons and their roster. 12 one-edit mutants (the resolver exception, the abandonment, the drill order, the detach, the re-issue, the wait, the pick-up, the floor, the safe point, the enemy test, the wait-only release, the report) each fail it. |
| `stress-reaction-animation-check.js` | Presentation contract for those states: cower enters/holds/leaves through the kneeling-prayer clips; freeze enters terrified then deterministically cross-fades to standing prayer, sitting dazed or fallen (no RNG); a fled man runs (`flee` run) whenever he moves and waits at his refuge as a freeze hold; cower/freeze put the weapon beside the man and restore it afterward, while a weapon the sim took away (`soldier.weapon` null, Engagement's `BattleWeapons.abandon`) stays where it lay as a world prop and the backend never writes a soldier's weapons; rage keeps ordinary fighting locomotion and fire; every named FBX exists and one-shots remove horizontal root travel. |
| `anchor-publisher-check.js` | One publisher for `orderAnchor` + `rally`: the Squad Leader's advance, its regroup commit, the General's merge and the garrison setup all go through `BattleSquadStability.publishAnchor`, the pair never disagrees, and module 36 labels every write `squad-stability` (no `writer-ping-pong` from one owner reached by two paths). `GRASSTEX_SOURCE_ROOT=<checkout>` runs it against another tree (main must fail). |
| `stall-clock-check.js` | One stall clock: the sampler's threshold is `BattleCommanderAI.strategicStallReplan` (120 s), the flag flips exactly at it, nothing is ever due with no General, and the General's wake reads the stall seconds, never `replanDue`. |
| `status-writers-check.js` | The two status timers have one writer each: `SquadAI.pin` (sets, extends, never shortens; area fire and the wound shock go through it) and `BattleEngagement.markUrgent`/`clearUrgent`. |
| `soldier-stats-check.js` | Soldier stats (module 10): hash rolls of faction and id (role-independent, bell-shaped, six independent), the declared `EFFECTS` table is the whole vocabulary, an average man is exactly 1 on every effect, `?stats=0` is the module absent, levers are separately switchable, squad means over the living, side ranks, and `deal` at spawn (a permutation of the squad's ids, best of what is left per command slot) is **on by default**; no combat-RNG draw, the module writes only `stats`. |
| `stats-levers-check.js` | What each stat buys at the layer that reads it (hold, nerve, recognition, sight, group, settle, cover search, pace, fitness, setup, stoppage, clear, build): direction, bound and neutrality with the module absent or `?stats=0`. |
| `squad-fit-check.js` | The General's use of squad means (2e): with the geometry tied exactly, the fastest squad takes the first objective, the steadiest the furthest, the best base of fire the safest; the pull is above the side's median only, bounded by `SQUAD_FIT`, a score not a veto (saturation still wins), off with `?stats=0` or without `squad`, never on a defence, no random draw. |
| `morale-check.js` | Group morale (module 16, **on by default**, `?morale=0` the only way off), loaded from the shipping source with a stub `location`: the flag parse (on with no `location` at all, as in the Node harness); off, and on with calm men, exactly the flat 60% rule with no memory; the dose map of a ten-man squad (morale differs from the flat rule only from mean stress 1/3 at 5 casualties, 2/3 at 4, 1.0 at 3; `breakMin` never binds); rally needs calm men (mean stress under 0.15) and a casualty fraction a gap (`rallyGap` 0.05) below the break threshold at that stress: a squad that broke early (4 or 5) rallies when calm, one the flat rule broke (6 or more) never does, and no casualty count and stress flips (2,211 points); a merged squad stays in `retreat` while its men are shaken; only the mean is read; the numbers are the live `tuning.morale`. |
| `coa-check.js` | Course of action (module 16, **on by default**, `?coa=0` disables it), Engagement's contact report scripted: the flag parse; the declared scores against the closed form (`assault` while 2.5 x casualties + 1.5 x stress + 2 x leaderDown <= 1, a tie is `assault`); the COA is the better score on the squad's inputs at each in-contact tick (a tie is `assault`; it follows a change inside a contact in both directions, a blink is not a decision, and there is no margin); `defend` authorises no bound and never starts the team rotation, `assault` bounds after `BOUND_CYCLE` in assault, capture and clear-town only (every other phase the two COAs are the same squad); `?coa=0` never sets `sq.coa`; a contact that blinks faster than `BOUND_CYCLE` never bounds under either COA (each start renews the wait); `_assaultAuthorized` has one writer file. |
| `benchmark-compare-check.js` | The two tools an A/B rests on, on synthetic records: `compare_benchmark_arms.cjs` calls two records one battle whatever the wall clock, the run's index and the page's build stamp said (`timeline.ref` is `local-<mtime of the checkout>`, so it differs between any two runs of a commit), `--ignore a.b` leaves a field out of identity (a build that adds a field matches one that lacks it: `--ignore stress`); scripted windows pair on `<seed>-<window>`, and a window only one arm reached is `unpaired`, not compared with another; the seeds-mode planner covers every seed once over at most 20 balanced shards, `casualties` pairs across pooled shard reports, the formatter renders a table with no hole, the verdict reads inert / one battle / quiet / weak / moved and names a coincidence, and the processed result keeps one slim record per scenario (the earliest-parting seeds in seeds mode) and builds the link that opens them, a changed battle reports the simulated second its timeline or stress series first differs; `scripts/lib/stress-summary.mjs` sums the stress blocks (bands, squads over 1/3, decisions by lever and band, per-battle spread), skips a record with the module off and is null with nothing to sum |

`harness.js` loads the shipping `stepMovement()` from `battle/battle-sim.js` with render stubs.
Navigation is optional via the harness battle's `_movementRoot`; ordinary combat checks omit it. `bootstrap()` returns the loaded globals for throwaway probes. Write
assertions about mechanism, not dice outcomes, and sweep `HARNESS_SEED=1..40` before trusting a
new check.

**M3C ownership checks** (`scripts/check-*.cjs`). Not in CI, so run them when touching command or movement ownership:

```bash
for c in scripts/check-*.cjs; do node "$c" || break; done
```

These are `macro-mission-command` (brief lifecycle; honours `GRASSTEX_SOURCE_ROOT=<checkout>` for
negative-control runs against another tree), `meso-formation-frame-stability`,
`meso-micro-movement-ownership`, `movement-order-ownership` and `physical-waypoint-refill`.

**Browser smoke + screenshot.** Proves the page boots and the sim runs. Playwright is installed
globally here; don't run `playwright install`.

```bash
mkdir -p /tmp/www && ln -sfn "$PWD" /tmp/www/grasstex
php -S 127.0.0.1:8765 -t /tmp/www >/tmp/php.log 2>&1 &
node scripts/smoke_battle_page.cjs          # SMOKE_SEED, SMOKE_SECONDS, SMOKE_OUTPUT=shot.png
```

Hosted textures 404 when served locally, so the ground renders red. That's expected. Scripts below
default to this local URL; run them against the branch preview instead (see Working rules).

**Visual checks: keep these, don't rewrite them.** Look at a change on the live host rather than a
local red-ground page, and reuse these harnesses instead of writing one-off probes:

- **Open any branch live:** `https://test.ivandpopov.com/grasstex/preview.php?ref=<branch|#PR|GitHub URL>`
  (see CI and workflows). The link follows the branch head. It carries the branch's own models, clips,
  weapons and effect sprites, so new decals or FBX show up.
- **Close-ups in a real fight:** `scripts/closeup_battle.cjs` runs a battle in fixed 0.15 s steps
  until a soldier matches `CLOSEUP_TARGET` (`casualty`, `wounded`, `any`, `role:ge/gunner`, `id:<n>`),
  pauses, and photographs him from `CLOSEUP_VIEWS` (`front,left,back,top,right,wide`). Output is
  `<view>-<id>.png` plus `summary.json` (hp, wounds, casualty zone, weapon, FBX or not, and `timings`
  per phase). It blocks telemetry, learning and policy writes, so it's safe against production and
  previews. A live run takes ~1 min. Page build is ~20 s, the sim fast-forward is ~5 s for two minutes
  of battle, and software rendering is ~0.3-0.6 s a frame. Clips run on sim time, so it renders only
  6 settle frames and 1 per view. `Math.random` is seeded from the seed, but a rerun can still match a
  different man at a different time (seen 2026-09-28), and decal variants drawn on async timers
  differ, so it is for looking, not for before/after comparisons (see Before/after pictures). Env: `CLOSEUP_URL`, `CLOSEUP_SEED`, `CLOSEUP_COUNT`,
  `CLOSEUP_AFTER` (sim seconds after the match, default 1.5), `CLOSEUP_DIST`, `CLOSEUP_WAIT`,
  `CLOSEUP_OUT`, `CLOSEUP_UI=1`.
  ```bash
  CLOSEUP_URL='https://test.ivandpopov.com/grasstex/preview.php?ref=<branch>' CLOSEUP_TARGET=wounded \
    CLOSEUP_OUT=out/closeup node scripts/closeup_battle.cjs
  ```
- **Close-ups of one posed soldier:** `scripts/closeup.cjs` puts any `faction/role[/weapon.fbx]` in
  any Motion Lab pose at any time, alone in its own scene, through the game's FBX backend at a fixed
  30 Hz, from `front`/`side` (or `right`)/`back`/`left`/`three-quarter`/`top`, framed on
  `body`/`hands`/`weapon`. Use it for a hold or a clip. Use `closeup_battle.cjs` for anything the
  fight itself causes (wounds, death falls, stance under fire). `Math.random` is seeded, so the same env
  gives the same frames, death clips included. Env: `CLOSEUP_SOLDIERS`, `CLOSEUP_POSES`, `CLOSEUP_TIMES`,
  `CLOSEUP_VIEWS`, `CLOSEUP_FRAMING`, `CLOSEUP_SIDECAR`, `CLOSEUP_OUT`, `CLOSEUP_URL`. Writes PNGs and
  `summary.json` (clips, two-hand state, support error).
- **Damage decals themselves:** `scripts/closeup_damage_fx.cjs` shoots the newest decal of each kind
  (wound, exit, pool, spray, masonry, wood, dirt, metal) along its surface normal, plus a
  `summary.json` of wounds by zone and decals by kind; works against a `preview.php?ref=` URL.
  `scripts/preview_decal_sheets.cjs` checks the sprite sheets themselves (no server).
- **Interactive damage range:** add `?damageRange=1` to a normal battle/preview URL. It freezes combat
  AI and lays out one US shooter plus US/GE rifleman, sergeant, scout, gunner and engineer targets on
  a raised inspection deck. The range uses the shipping FBX models, weapon presentation, hit/death
  animation bridge and impact/UV-wound system; Fire itself does not alter HP, while **Kill** is
  explicit so wounds can accumulate before a death pose is inspected. Controls in the page select
  target and zone, entry-only vs through-shot, single/3-shot, auto cycling, orbit, FPS aim, clear and reset.
  FPS aim puts a UniversalCamera just in front of the shooter's face/chest line, shows a centered reticle,
  and sends shots through the reticle: body hits are classified into head/chest/abdomen/arm/leg while a
  miss paints the backstop. Drag/touch or the right stick aims; changing target/zone recenters the reticle.
  The panel is docked off-center and collapsible; `rangeAuto=1` starts with the compact panel unless
  `rangeUi=full` is supplied (`rangeUi=compact` forces compact mode). Keyboard: Space fire, arrows
  target, 1-5 zone, F FPS aim, E exit, O orbit, A auto, C clear. Xbox/standard gamepad: A fire,
  RT also fires in FPS aim, X 3-shot, D-pad left/right target, D-pad up/down zone, Menu toggles FPS,
  Y auto, B clear, LB exit, RB orbit, right stick aim/orbit, LT ADS in FPS, R3 kill, View toggles the panel.
  URL setup: `rangeTarget=0..9`, `rangeZone=head|chest|abdomen|arm|leg`, `rangeExit=0|1`,
  `rangeAuto=0|1`, `rangeInterval=<seconds>`, `rangeOrbit=0|1`, `rangeDist=<metres>`,
  `rangeUi=full|compact`, `rangeFps=0|1`.
  **V1 closeout:** PR #103 adds the off-centre/collapsible UI, Xbox controls, FPS aim/reticle and
  preview-launcher pass-through for every range flag.
- **Every model with its weapon, plus the Motion Lab poses:** `scripts/fbx-soldier-lineup.cjs`
  (see Soldiers, weapons, animation).
- **Pistol support hand numbers:** `scripts/probe_pistol_cup.cjs` (see the replay table below).

In a cloud sandbox Chromium sees the proxy's CA, so launch with `--ignore-certificate-errors`
(these scripts do). Otherwise Babylon never loads from the CDN and `__battle__` never appears:
the symptom is a `waitForFunction` timeout after 180 s, not an error. A new Playwright script
needs the flag in `chromium.launch` args; `ignoreHTTPSErrors` on the page alone is not enough.

**Before/after pictures (pixel A/B of a presentation change).** Learned the slow way (PR #86):
- **Use `closeup.cjs` (posed soldier), not `closeup_battle.cjs`.** The fight close-up is not
  deterministic across page loads here: the same build and seed matched a different soldier at a
  different sim time on a rerun, so its differences prove nothing either way. `closeup.cjs` is
  seeded and steps at a fixed 30 Hz, so the same env gives the same bytes.
- **Put the old and new code behind a URL flag** (as `?cloneBounds=1`, `?fastRetarget=0`,
  `?soldierLod=0` do) and run the same tool against both URLs from one checkout. Comparing two
  trees also works: serve a `git worktree` of `main` at `/tmp/www/<name>` and drop a
  `preview.json` in its root (and one in yours), or `battle_sim_local.php` serves `/grasstex/`'s
  runtime for both. Never commit those `preview.json` files.
- **Run a control first:** the same URL twice. If the control differs, the tool is not
  deterministic for that case and an A/B means nothing.
- **Compare with `scripts/compare_screenshots.cjs <dirA> <dirB>`** (byte-identical, else the share
  and box of differing pixels; decodes in Chromium, as there is no Python imaging library here).
- Keep a run small (a few soldiers, poses and views): each image renders under SwiftShader.
- **A script that pauses the battle must wait for Start first:** its click handler awaits the audio
  unlock and then calls `battle.resume()`, so a pause set right after `startBtn.click()` is undone
  a moment later (wait until `startBtn.hidden`). Let the first few renders after a fast-forward play
  out too: effects the steps queued on wall-clock timers keep appearing (`probe_soldier_cull.cjs`).

**Deterministic replay / profilers** (Playwright; each takes a URL variable, point it at the branch preview):

| Script | Use |
| --- | --- |
| `scripts/run_m3c_replay.cjs` | One seed, fixed step, full diagnostic JSON. `M3C_SEED`, `M3C_URL`, `M3C_OUTPUT`, `M3C_MACRO=off`. Use for paired before/after comparisons. `M3C_RENDER_EVERY=<n>` renders a frame (sim paused) every n steps so the FBX pose code runs; `M3C_PERF=on\|off` sets the timing switch below. An on/off pair must end identically. |
| `scripts/benchmark_full_fidelity.cjs` | Full-fidelity browser benchmark: real FBX soldiers, weapons, clips and rendering; fails on a failed FBX load or any procedural soldier. Startup phases and per-file timings, then `FF_SECONDS` (60) rendered after `FF_WARMUP` (90) fast-forwarded sim seconds: FPS, CPU, render, sim, pose per layer, draw calls, GPU where supported. Writes `full-fidelity.json` + `.md` to `FF_OUT`. `FF_URL`, `FF_SEED`, `FF_TIMESCALE` (4), `FF_VIEWPORT`, `FF_GPU=1`, `FF_ISOLATE=0`, `FF_QUERY` (e.g. `animLod=0`), `FF_CADENCE=60` (a virtual 60 Hz clock so per-frame numbers describe a 60 FPS device; wall FPS is then meaningless). Served cross-origin isolated for 5 µs timers. SwiftShader numbers are a CPU-only baseline; the headless benchmark stays the AI regression benchmark. |
| `scripts/ab_fingerprints.sh [--control] [ref]` | Identical-end-state proof (optional; see the phase map): serves a `git worktree` of `ref` (default origin/main) and this checkout, runs `run_probe.cjs` `PROBE=state-fingerprint` on both for each arm (`AB_ARMS`, default default / `mind=0` / `stats=0`; `AB_PER_TYPE`, `AB_OUT`) and compares with `compare_battle_fingerprints.cjs`. `--control` first runs the base against itself. Exit 1 on any difference. |
| `scripts/compare_benchmark_arms.cjs A.json[,..] B.json[,..]` | Paired report of two standard-benchmark arms (a comma list pools seed prefixes): identical battles, exact McNemar on winner / time-limit / no-capture, captures, movement stalls, runtime errors, median wall time against the 25% gate; `--count <path>` adds a per-battle counter (`--count stress.decisions.react.changed`; `--count casualties` is usKills + geKills); `--ignore <path>` leaves a field out of the identity test (`--ignore stress` for a build that adds the stress block, compared with main, which has none); `timeline.ref` and `timeline.build` are never part of identity; changed battles report the simulated second at which their `timeline` or `stress.series` first differs (`firstDivergence`); `--count timeline.stalledOnsets` and `--count timeline.stalledSamples` read the timeline's per-second `stalled` series (men newly stalled, man-seconds stalled), the stall counts the runner's `movementStalls` now agrees with (until the stall-clock fix its clock kept running through the states and phases it skipped, so a man who held in `cower` was reported the moment he was back in `advance`; records from before it, such as the reaction arms of #144, read the timeline's numbers instead). Exit 1 on a runtime error or a slowdown above 25%. |
| `scripts/run_battle_benchmark.mjs` | N headless battles, or with `BATTLE_BENCHMARK_WINDOWS` (`contact+60,every60`) one scripted battle measured in segments, one record per segment. `BATTLE_BENCHMARK_COUNT/SEED/URL/STEP/TIME_LIMIT/OUTPUT`; `BATTLE_BENCHMARK_FIRST=<n>` numbers the seeds from n+1 (a shard of a larger run; set, even to 0, a count of 1 is numbered too). `merge_battle_benchmarks.mjs` merges shards. |
| `scripts/profile_battle_hotpaths.mjs` (+ `battle-hotpath-profiler.cjs`) | Inclusive wall time per hot function. `BATTLE_PROFILE_SEED/TYPE/SECONDS`. |
| `scripts/profile_meso_churn.mjs` (+ `meso-churn-profiler.cjs`) | Meso fireteam order churn attribution |
| `order-ingress-`, `physical-point-`, `movement-goal-transition-`, `resolver-order-mutation-profiler.cjs` | Inject-only observers: who proposes orders, destination provenance, goal transitions, resolver mutations. They never change behaviour. |
| `scripts/battle-benchmark-intent.cjs` | Shared benchmark predicates (targetless/route-active) |
| `scripts/closeup_damage_fx.cjs` | Damage FX close-ups (see Visual checks); on the UV-wound preview it fails on page errors or any FBX wound that falls back from the private UV paint path, and records UV-map/skin-anchor diagnostics in `summary.json`. `CLOSEUP_OUT` (default `closeups/`, gitignored), `CLOSEUP_SEED`, `CLOSEUP_SHOTS`, `CLOSEUP_SIM`, `CLOSEUP_BODY`, `CLOSEUP_DIST`. 5-10 min under software WebGL. |
| `scripts/preview_decal_sheets.cjs` | Contact sheet of `Assets/effects/decals/*.png` over surface-like backgrounds with the 4 x 4 grid and row names; check a regenerated or painted sheet before it ships. No server. `DECAL_PREVIEW_OUT`. |
| `scripts/probe_pistol_cup.cjs` | Motion Lab pistol support cup at a fixed 60 Hz: cup gap (cm), degrees the left arm is bent off the clip, and hand jerk (deg/frame², solved vs the clip's own) per clip. `CUP_SIDECAR=<model>.fbx.json` (a server sidecar; they are never committed), `CUP_CLIPS`, `CUP_SERIES=1`. |
| `scripts/probe_bocage_preview.cjs` | Live generated bocage scale/occlusion: tallest runtime prism, min/max visible height, a 1.55 m standing line that must block and a line above the top that must clear; saves JSON + a focused screenshot. `BOCAGE_URL`, `BOCAGE_SEED`, `BOCAGE_OUT`. |
| `scripts/probe_lod_shadows.cjs` | Animation LOD vs shadows: adds a directional light and ShadowGenerator, aims a narrow camera at one soldier's shadow with him out of view, and checks he is held with no caster, posed as a caster, held when the shadow falls away, posed under a caster predicate, and that off-screen culling disables his meshes exactly when he is held. `LODSHADOW_URL`. |
| `scripts/probe_merged_walls.cjs` | Merged building walls: loads one seed with and without `?mergeWalls=0` and checks building meshes and draw calls, total vertices, world bounds, and a town screenshot from one camera with the HUD hidden (fails above `MW_MAXDIFF`, 0.2% of pixels). `MW_URL`, `MW_SEED`, `MW_OUT`. |
| `scripts/probe_soldier_mesh_lod.cjs` | Soldier mesh LOD: each model's full and far triangle/vertex counts, and one posed soldier (after ~20 s of battle) shot at full detail and on the far list from `SMLOD_DIST` metres at the iPhone canvas size, side by side (`d<m>m.png`, full \| far) with the share of differing pixels. Tune `meshLod.far` from these. `SMLOD_URL`, `SMLOD_SEED`, `SMLOD_VIEW`, `SMLOD_OUT`. |
| `scripts/probe_bench_census.cjs` | Device benchmark's draw-calls-by-kind census vs Babylon's measured draw calls, with weapon instances on and off (`?weaponInstances=0`): instanced weapons must count once per source mesh. `BC_URL`, `BC_SEED`, `BC_SECONDS`, `BC_WARMUP`, `BC_TOL`. |
| `scripts/probe_bench_follow.cjs` | Device benchmark `benchCam=follow`: samples the chase camera while it measures (active camera, distance to its target, living soldiers within 45 m of the eye), screenshots it, and checks the page camera comes back. `BF_URL`, `BF_SEED`, `BF_SECONDS`, `BF_WARMUP`, `BF_DIST`, `BF_OUT`. |
| `scripts/probe_follow_camera.cjs` | Normal-play persistent visual-QA camera: verifies `?follow=1` holds a fixed close bearing and `?orbit=1` implies follow + auto-orbit, while tracking a living soldier at the requested `followDist`. `PFC_URL`, `PFC_SEED`, `PFC_DIST`, `PFC_SPEED`, `PFC_OUT`. |
| `scripts/probe_damage_range.cjs` | Interactive damage-range regression: boots `?damageRange=1`, verifies the stationary 10-man role lineup + selected-target camera, fires the shipping FX path, requires UV-only 512² wound accumulation with one private map per wounded soldier, checks Clear, then explicit death. `DR_URL`, `DR_SEED`, `DR_OUT`. |
| `scripts/probe_soldier_cull.cjs` | Off-screen soldier culling: a paused combat frame from the overview and chase cameras (12/25/45 m, 8 bearings, high and ground-level) rendered cull on, on again (control), off, on; every image must be byte-identical. Reports draw calls on vs off. `CULL_URL`, `CULL_SEED`, `CULL_WARMUP`, `CULL_VIEWPORTS`. |
| `scripts/probe_rotation.cjs` | Rotating the phone after load: fires `resize`/`orientationchange` before the viewport rotates and swallows the late real `resize` (the iOS order), then checks the canvas drawing buffer matches its box, portrait → landscape → portrait. `main` before the fix stays stale (the negative control). `ROT_URL`, `ROT_SEED`, `ROT_PORTRAIT`, `ROT_LANDSCAPE`, `ROT_SETTLE`. |
| `scripts/probe_weapon_instances.cjs` | Weapon instancing: draw calls with and without `?weaponInstances=0` over the armies, and inside the instanced page each weapon's world matrix and a close-up against a temporary clone on the same socket (same frame, so exact). `WI_URL`, `WI_SEED`, `WI_OUT`, `WI_MAXDIFF`. |
| `scripts/probe_clip_pack.cjs` | Loads the page with `?clipPack=0` and as shipped, each in a fresh context: every converted and every model's retargeted clip must be bit-identical, and the shipped load must fetch no clip FBX. Reports the soldiers phase, FBX parse and clip bytes each way. `CLIPPACK_URL`, `CLIPPACK_OUT`. |
| `scripts/probe_retarget.cjs` | Quaternion retarget vs `?fastRetarget=0` (matrix), each load in a fresh context: worst difference in every model's rotation and position samples, clip speeds and strides, and solved grips, plus retarget time each way. Fails above `RT_MAX_ROT`/`RT_MAX_POS` (1e-5). `RT_URL`. |
| `scripts/probe_soldier_load.cjs` | Per URL, a fresh load: soldiers that wear their FBX model vs procedural, body build and bind time, and the load phases. `SL_FAIL=<asset path fragment>` aborts that request: the page must show its load error and build no procedural soldiers. `SL_URLS` (comma-separated, for a before/after), `SL_WAIT`. |
| `scripts/probe_gait_clips.cjs` | Which FBX locomotion family (walk/run/sprint/crouch/crouchRun) each sim gait actually plays, at what rate, plus each model's natural clip speeds (in-place clips: foot stride). `GAIT_URL` (default production), `GAIT_SEED`, `GAIT_SECONDS`, `GAIT_OUT`. |
| `scripts/probe_ai_graph_stash.cjs` | Are the AI Graph and the genome really stashed: loads the page under test, and optionally a control page that still has them (`STASH_CONTROL_URL`), and reads the DOM (`aiGraph*` / `ag*` ids, the AI Graph button, the Genome v2 Training button), the eight graph globals, the HUD buttons (World Debug and Motion Lab must stay) and the runtime under the graph (Macro switch API, `BattleLeases`, `BattleOrderProvenance`, `BattleDiagnosticsExport.snapshot`). The page under test also loads with `?editor=ai` and `#ai-graph` and runs a few seconds of battle, then (last, on a page about to close) tries a hostile `BattleAIPolicy.set()` and `setMatchPolicies()`: while stashed the genome must read revision 0, be the defaults, and leave `policyFor` at the default 34 m cohesion radius. The control makes the negatives mean something: it must have the graph, its `?editor=ai` must open the panel, and the same hostile calls must take effect. `STASH_URL`, `STASH_CONTROL_URL`, `STASH_EXPECT=present` for when the graph and genome return, `STASH_SEED`, `STASH_SECONDS`, `STASH_OUT`. |
| `scripts/probe_genome_gate_mutants.cjs` | Mutation test of `genome-gate-check.js`: 19 mutants in a private temp copy of `battle/` (the server genome, the scenario memory, a per-match genome, `set`, `refresh`, `persist`, `remember`, the exported flag, the switch itself, the trainer loading, two second doors around `ai-policy.js`, the two copies of the defaults drifting, a default rule drifting or misread, the genome never being off, Force Command deciding a brief through the genome module), each of which must make the check fail. A missing anchor means the source text changed: update the anchor, never drop the mutant. About 5 s. |
| `scripts/probe_genome_gate_battle.cjs` | Does a hostile server genome change a whole battle while the genome is stashed: plays the fixed-step benchmark battle (`run_probe.cjs`, `state-fingerprint`) in four arms on two served worktrees (as shipped, and with only `var STASHED=true;` flipped), each with and without a hostile `state/ai-policy.json` (every tuning number at an extreme, and a rule that holds on every neutral objective). Stashed with the hostile genome must be the same battle as stashed without it; with the switch flipped it must differ (the control), and with the switch flipped but no data it must be the same. Setup in the script header. `GG_STASHED_URL`, `GG_LIVE_URL`, `GG_STATE_DIR`, `GG_BATTLES`, `GG_SECONDS`, `GG_OUT`. |
| `scripts/probe_wire_map_recall.cjs` | Recall of the wire-map scanner against a TypeScript AST scan of `battle/`: every write found from the AST and classified by the scanner's own vocabulary, compared per file and field (exit 1 on any difference), plus the vocabulary gaps (receivers the scanner does not list that write a tracked field). Static and offline; TypeScript is only the measuring instrument, so CI does not run it: `NODE_PATH=$(npm root -g) node scripts/probe_wire_map_recall.cjs`. |
| `scripts/probe_wire_map_mutants.cjs` | Mutation test of the ratchet: 21 tree and baseline mutants (a new writer file, a stale or shrunken entry, an excluded file that writes, every way the baseline can be malformed) and 66 one-edit mutants of `wire-map.js` (write forms, chain and receiver rules, tokeniser, file list), each in a private temp copy; every one must make `wire-map-check.js` fail. A missing anchor means the scanner text changed: update the anchor, never drop the mutant. `ratchet` or `scanner` runs one family (~10 s in all). |
| `scripts/run_probe.cjs` + `scripts/probes/*.js` | Observe-only probes on full benchmark battles (0.15 s step, procedural rig). `PROBE=<name>[,<name>]`, `PROBE_BATTLES=<type>:<seed>,…` (default one standard seed per type), `PROBE_SECONDS`, `PROBE_OUTPUT`, `PROBE_CONTROL=1` (also runs each battle without probes and fails if the end state differs). Serve with `PHP_CLI_SERVER_WORKERS=4 php -S …` or page loads stall. Probes: `station-occupancy` (bodies vs reservations at firing stations), `close-pairs` (who the <0.9 m pairs are, and the rate after formation/facing changes; `crossTeamFormation` classes each different-fireteam `formation+formation` onset by time, formation, gap between the two slots, lateral order and on/off slot: colliding slots are an allocation problem, men >3 m off their slots are in transit), `regroup-episodes` (every `regroup` lease: end reason, order anchor and destinations vs the rally point), `stall-wakes` (each strategic-stall wake: repeat, and whether another objective was open), `damage` (rounds by weapon, wounds by zone and outcome, and of body hits the share that went through, struck a second man or flew on), `fire-gates` (per role: trigger pulls, target distance bands, and the first fire condition that fails while a man holds a target), `backward-orders` (new destinations behind the man's fireteam line or behind the man himself while the squad advances, by producer and phase, and `behindAndBackBy` producer | reason | suppressed; for formation orders `formationCause` (team anchor moved or unchanged, man ahead of or on his team line), `formationKind` (formation vs prepared post) and `formationExamples` with the anchor's and the man's offset from the team line; a producer label can lag the resolver's final destination, so check `publishedToDestM` before blaming formation), `move-stalls` (the standard benchmark's soldier-movement stall, with `_movementStopReason` and the order kind), `bound-episodes` (every Engagement `bound`: duration, how it ended, distance to its cover at the end; bounds that never arrive), `spawn-slots` (per squad, the first minute: frame turn from the first fireteam order to 3 s, contact onsets and how many cross fireteams), `bound-motion` (how a man moves in a bound: direction reversals with the obstacles around him, goal flips, dives to prone at speed, what ended each bound and whether he could see the last-seen enemy from the slot), `outcome` (winner, living, kills, time; the quick local look for A/B arms), `timeline` (one-second per-side living/kills/objectives/advance/contact/pinned/stalled series plus exact phase/brief/retreat/capture/stall-wake/merge/wipeout markers; importable by `ai_flow_live.html` for A/B scrubbing), `clear-contact` (the Squad Leader's clearing orders: begun, how each ended and how long, squad-seconds clearing, how far the anchor moved), `stance-churn` (shown stance changes per man-minute by asking function (`byCaller`), stand->down->stand loops, share of advance time spent low, by writing file, A→B→A bounces under 1 s, trigger pulls within `AIM_SETTLE` of a change, prone spells shorter than `PRONE_HOLD`), `lfp` (module 43 stays the authority for `low-forward-progress`; module 43 restarts its centroid odometer whenever the living roster changes, because pre/post casualty or flee centroids are different measurement populations; windows dominated by materially detouring physical paths whose direct routes are actually blocked are recorded separately as `navigation-detour-progress` instead of pathological LFP; each alert carries its exact track start/end; the probe freezes that exact interval at 0.5 s resolution with travel/net/efficiency, command phase and goal distance, roster continuity, contact provenance, under-fire/suppression, Engagement-state and stance mixes, Movement Resolver owner/kind/reason and exact destination changes, order-provenance events, actual local-avoidance/stop-reason samples (a no-op personal-space reservation does not count), nearby obstacles, physical-navigation detours, progress-giveback/tactical-cover classification, and other non-causal evidence tags), `regroup-axis` (regroup ticks whose forward axis collapsed, and men behind the anchor scored as outrunners), `sidearm` (draws and returns by reason, rounds by weapon kind, men with the sidearm in hand), `perception` (acquisitions by angle band and by what the squad already knew; first contact per squad by source; mid-fight re-acquisitions: a squad blind ≥5 s that regains contact, by source and gap; acquisitions by a man standing still whose squad knew of nobody), `experience` (what a man lives through: aimed rounds by range, suppression spells, comrades falling within 12/25 m, leader distance, isolation, cover), `mind` (soldier condition on real battles: band shares overall, per role and faction and for men in contact, who reached which band, what added the stress, shocks and hesitations, stress percentiles). `retreat-episodes` (every entry into `retreat`: casualty fraction, squad stress roll-up, leader and contact, whether it reached base or merged; and what the squads that never retreated carried), `rally-writers` (who assigns `rally`/`orderAnchor`, by calling site, and module 36's own writer-ping-pong test replayed on the events), `deal-roster` (per role, the mean of the stat pair the `deal` ranks it on, squads still holding ten consecutive ids, weapons by role), `morale-decisions` (the morale rule against the flat 60% rule, per squad-tick, on the inputs the decision saw: early breaks and how long they lead the flat retreat, held retreats, stress by casualty count, rally halves, merges and groups; `selfCheck` re-derives each decision and must be 0; run it flag-off too, where it is the counterfactual dose), `coa-decisions` (every contact start: phase, inputs, scores, winner, length, bounds sent, opportunity ticks the COA withheld; `authViolations` and `selfCheck` must be 0, the latter allowing a leader succession resolving in the same tick) and `stress-reactions` (stress reactions on real battles: per reaction the episodes, men, how long, how each ended (Engagement's recorded reason, a death, the end of the battle), re-entries within 5 s, a flee's distance moved and whether it reached its refuge, a charge's distance at start, nearest approach, blows struck and landed and whether he fell; run it with `?stressAct=all` in the page query), `fled-men` (the man who has fled on real battles, `?stressAct=flee` in the page query, sampled every step: per man when and where he broke, his hp, wounds and bleeding then, the phases he went through and how long, how the wait ended (picked up, an enemy, the clock), whether he was armed again at base, or died (in which phase, of what, how far the nearest enemy was) or was still on his way when the battle ended; per side the totals, and a series every 30 simulated seconds of the fled men in each phase and the lone squads), `regroup-fled` (who regroups when men flee, `?stressAct=flee` in the page query: every `regroup` lease start with whose squad it is, its size and phase, the spread, how long ago it lost a man to flight or took one in, and how many men on its roster are in a fled phase; the totals by cause), `stress-decisions` (what a stress-driven lever above the soldier would have to act on, from wrappers that pass everything through: at each issued bound, the three fireteams rebuilt the way `fireAndMovement` builds them with their movers' mean stress, so how often two or more could go, how much calmer the calmest is than the one the rotation sent, how often the rotation sent a team at or over the shaken band while another was under it, and how often every team that could go was shaken; at each of the General's attack and defence picks and each brief that changed, the squad's mean stress (3+ living men) against its side's median; `selfCheck` re-derives the team the rotation sent and must be 0 mismatches; the battle matches its probe-free control) and `exaggerated-dose` (POSITIVE CONTROL, the one probe that writes: `?dose=<path>:<value>,…` into `BattleSquadStability.tuning`; diagnostic arms only, never shipped). `scripts/summarize_lever_probes.cjs <label>=<output.json>[,…]` adds the first two up per 100 squad-battles. Arms from `git worktree`s: serve each at `/tmp/www/<name>` with a `preview.json` (`{"ref":"local"}`; an empty object reads as no marker) or its page silently runs `/grasstex/`'s runtime, and set `PROBE_URL=http://127.0.0.1:8765/<name>/battle_sim_local.php`; compare worktree arms with each other, not with `/grasstex/` (preview mode reads state from two directories up). |

**AI runtime timeline / timestamp contract** (diagnostics, probes, benchmarks, and `ai_flow_live.html`):
- **Simulation time is canonical.** Every timeline sample and semantic marker uses `t` in **simulated battle seconds**. Align paired arms by `t`, especially the same seed with one flag changed. Wall-clock fields such as `exportedAt`, `generatedAt`, Actions timestamps, and benchmark wall time are provenance/performance metadata only; never use them as the battle x-axis.
- **The timestamped JSON is the diagnostic substrate; the visual brain is the navigation layer.** For automated analysis, inspect the structured series/events first to find the first divergence and what changed before it. Then use `ai_flow_live.html` to project that evidence onto Mission Lifecycle, Command Phase, Engagement FSM, Movement Intent, source, and Deep Branch CFG. The AI does not need the visual graph to compare runs; the graph makes the result human-readable and traceable into code.
- `battle/modules/97-ai-timeline-recorder.js` is observe-only, draws no RNG, writes no gameplay state, and records one compact sample per simulated second through `BattleAITimeline.snapshot(sim)`. Per side the sample includes living men, kills, objectives held/contested, advancing, in contact, pinned, stalled, command-phase counts, macro-brief status counts, Engagement-state counts, and Movement Resolver intent counts. Its movement-stall predicate is intentionally kept in step with `scripts/probes/move-stalls.js` and the benchmark runner's `movementStalls`: all three start a man's clock again when he stops qualifying.
- Markers keep their exact simulation timestamp where the runtime exposes it: first contact, command-phase changes, macro-brief changes, retreat, objective capture/neutralization, strategic-stall wakes, reconstitution merges, and side wipeout. When explaining causality, distinguish the first metric/state divergence from later outcome markers instead of inferring cause from end totals.
- Full `BattleDiagnosticsExport.snapshot(...)` exports now carry `timeline`; old diagnostics without timeline are still valid but represent a **single timestamp only** at `battle.time`. Individual records in `scripts/run_battle_benchmark.mjs` also retain the same timeline, so a merged full `battle-benchmark.json` can be compared seed-for-seed instead of only by final counters. `scripts/probes/timeline.js` exposes the same schema through the generic probe runner.
- The viewer accepts a single diagnostics export, a timeline/probe JSON, or a full benchmark JSON. **Import A / Import B** is for paired arms; when both contain multiple battles, pair the same seed and battle type. By address (nothing is written): `?a=<url>&b=<url>` loads the two arms (http(s) JSON the page may read, e.g. raw.githubusercontent.com, which allows any origin), `?pick=<text>` opens the first record whose label or seed contains it (`-end` is a scripted run's full-length record), `?bench=<run>` is the shorthand for `a` and `b` of a run on the `benchmark-results` branch (`?repo=owner/name` for another repository), `?view=<id>` opens a view (`brain3d`, `brain`, `full`, `cfg`, `macro`, `meso`, `micro`, `move`, `health`). The branch preview stages `ai_flow_live.html` beside that branch's `battle/` source, so the map it shows is the branch's code. Scrubbing must move both arms on the same simulated-time axis and update the state-count badges on the AI diagram.
- End-of-battle totals remain useful regression summaries, but they are insufficient for timing claims such as “10-20 s longer,” stalls, time-limit battles, or delayed captures. For those claims, preserve and inspect the timestamped series and markers; report where the runs first diverge, then what state/event changed next.

**Persistent visual-QA camera** (`battle/camera-controls.js`, presentation only): normal battle/preview URLs may use
`?follow=1` for a close ArcRotate chase camera (default `followDist=10` m). `?orbit=1` implies follow
and continuously circles the tracked soldier; `orbitSpeed=.22` is radians/sec and may be negative,
while `followHeight=1.05`, `followBeta=1.18`, and `followAlpha=-1.5708` are optional framing
controls. The camera follows the busiest living soldier initially and transfers to the nearest living
soldier 3 sim seconds after death. It reads presentation transforms only and never writes simulation
state. The user can still drag to change bearing/elevation and wheel to zoom. This is separate from
the benchmark-only `benchCam=follow` camera.

**Battle player mode** (`battle/camera-controls.js` + existing AI owners): on the normal battle
page, desktop **P** enters player mode by choosing a random living soldier from a random live squad
on the player's faction (`us` by default; `?playerFaction=ge` chooses German). Press **P** again to
jump to another random living soldier on the same faction; **V** returns to the free camera.
Keyboard/mouse controls: **WASD** move, **Shift** run, **mouse** look, **RMB** aim, **LMB** fire,
**C** crouch/stand, **Z** prone/stand. On a standard Xbox controller, **Menu/Start** enters or switches
player mode, **View** exits, **LS** moves, **L3** runs, **RS** looks, **LT** aims, **RT** fires,
**B** crouches/stands and **A** goes prone/stands. Keyboard/mouse and gamepad inputs feed the same
player-control path and can be mixed; losing the controller leaves possession active so keyboard/mouse
takes over.
The possessed soldier carries `isPlayer=true` for the full possession lifetime; that flag, not the
short render-time movement proposal, gates the entire soldier Micro path. While it is set, SquadAI
does not run before/after Micro extensions, Perception or Engagement for that man, the Movement
Resolver never falls through to squad/tactical routing if an input proposal expires, and building
hardpoints cannot assign or retain him. Squad command and every other soldier keep running.
Possession starts in a player-owned standing stance. The player's walk/run choice overrides squad
hold/defend gait selection for that soldier only. Player fire is true free-fire: it launches the
crosshair ray even with no AI target lock, using the normal ammunition/reload/stoppage owner and
physical ballistics through terrain, buildings, bodies, penetration, wounds and presentation FX.
Movement still goes through `BattleMovementResolver` and the shipping movement integrator, stance
through `BattleEngagement.commitStance`, and optional reticle selection through `SquadAI.playerAim`.
The third-person camera is terrain-clamped so its shoulder position cannot drop below the ground.
`isPlayer` is cleared only on switch/exit/death handoff, at which point normal Micro resumes.

**Device benchmark** (`modules/97-device-benchmark.js`, inert without the flag): open the page with
`?bench=1` on any phone or computer, tap **Start benchmark** and keep the tab in front. It
fast-forwards `benchWarmup` (60) sim seconds to contact, plays `benchSeconds` (60) with the normal
render loop and reports (result v7): FPS (median, mean, 5%/1% lows); frame, CPU, render, sim and
pose time; GPU time where the browser has a timer query; device and renderer; the load breakdown;
where `scene.render` goes (hooks by name, active-mesh evaluation, `Skeleton.prepare`, draw,
unattributed); draw calls by kind; frame pacing (refresh rate, share of frames taking 1, 2, 3…
refreshes); and the 10 worst frames, with the meshes created just before each. **Copy results** /
**Download JSON** (nothing is uploaded; also `window.__deviceBench`). Flags: `benchCam=close` (the
biggest group from 90 m, the touch camera's limit), `benchCam=follow` (a chase camera `benchFollow`
(25) m from a man in the biggest group, onto the nearest living man 3 s after he falls; the result
records who and how many switches), `soldierCull=0` (cull before/after), `benchHide=soldiers[,weapons,decals,hedges,terrain,objectives,walls,cover]`
(stop drawing those kinds, to cost them on a device with no GPU timer), `benchAuto=1` (no tap),
`animLod=0` (LOD before/after). This is how real devices are measured; `benchmark_full_fidelity.cjs`
is the scripted equivalent.

**Runtime timing switch** (`modules/53-fbx-soldier-backend.js`, observe only, no sim writes or RNG draws):
`BattleAssetTimings.snapshot()` gives the load overlay's phase times, and per FBX file the download
(browser stall and transfer), queue wait, Babylon parse, prepare, clip conversion, retarget, grip solve
and sidecar fetch, plus per-soldier bind, totals and the 10 slowest files. It is on by default.
`BattlePoseTimings` times `applyPose` per frame and per soldier, split into setup, base, overlay,
dials, weapon, aim and support layers, and counts how often each layer's inputs changed since it last
ran. It is off by default and measures nothing until turned on. `?perfTimings=1` or
`window.BATTLE_PERF_TIMINGS=true` turns both on; `=0`/`false` turns both off.

**Preview launcher:** `python3 scripts/check-preview-launcher.py` runs offline with PHP/cURL and a concurrent local HTTP fixture. Checks runtime reuse, the rolling download queue, integrity failures and publication. `preview.json` records `runtimeReused` and `runtimeDownloaded`; only changed runtime files download, with matching copies taken from production or earlier launcher previews.

**Repo-wide checks** (match CI):

```bash
python3 scripts/validate_voice_manifest.py     # voice manifest resolves
python3 scripts/check_audio_manifest.py        # every clip referenced and present
python3 scripts/check_deploy_coverage.py       # deploy plan covers every page runtime
python3 scripts/check_deploy_safety.py         # deploy never deletes/overwrites sidecar JSON, lab or unmanaged server files
node scripts/check_clip_pack.cjs               # prepared-clips.bin matches the clip FBX, CLIPS and the converter
for r in scripts/recipes/*.json; do python3 scripts/slice_weapon_shots.py "$r" --check-only; done
bash scripts/normalize_audio.sh Assets/audio && git diff --quiet -- Assets/audio   # needs ffmpeg
```

## CI and workflows

| Workflow | Trigger | Does |
| --- | --- | --- |
| `ci.yml` | PR, push to main | Syntax (JS/PHP/Py/sh/JSON), audio library, sim regressions (all harness checks + 8 seeds), deploy plan + deploy safety + prepared clips current |
| `deploy-50webs-php.yml` | push to main | Stamps `build-v<N>`, reruns checks and the deploy-safety check, uploads by content hash to production |
| `deploy-50webs-preview.yml` | push `work/**`, `preview/**` | `https://test.ivandpopov.com/grasstex/preview/<slug>/battle_sim.php`; never touches prod, makes no telemetry/learning writes; its `mirror --delete` skips JSON and lab files |
| `preview.php` (on the host, not a workflow) | `?ref=<branch>`, `#47`, or a GitHub branch/PR URL | Stages that commit's `battle/` runtime from GitHub into `preview/ref-<sha12>/` with the host's own loader and opens it (same preview contract, no writes). Only this repo's branches and same-repo PRs (a PR uses its head commit, so merged ones still open); keeps the 12 most recent. Branch FBX, clips, weapons and `Assets/effects` PNGs come too: files identical to production are hard links, and new ones download (≤300 MB). A branch that changes `battle_sim_local.php` still needs the Actions preview. Optional `state/github-token.php` (`<?php return '<token>';`) lifts the 60/h API limit. |
| `battle-benchmark-standard.yml` | dispatch | **One scripted scenario, two arms.** One seed (`seed`, used exactly as given; default `scripted-scout-0003`) is stepped unmeasured to first contact, measured for 60 simulated seconds, then run to the end of the battle with a record at every 60 simulated seconds and one at the end (`windows`, default `contact+60,every60`; `battle_type` picks meeting / us-defend / ge-defend), once with `query_off` and once with `query_on` as page flags, one after the other on one runner (so wall time is comparable), then compared with `compare_benchmark_arms.cjs` (the counters are in the workflow). Each segment is one full benchmark record (`<seed>-contact`, `<seed>-t180`, `<seed>-t240`, … `<seed>-end`; every field of the old record, counted inside the segment, with kills, survivors, captures, `timeline` and `stress` as of its close, copied when it closes, and a `window` block), so the old stats and telemetry are all there; segments that touch carry the stall and objective trackers across, so a stall over a checkpoint is one stall. `end` is the winner or the time limit, and covers what is left since the last checkpoint; an arm that ends earlier has fewer `tN` records and a shorter `end`, and a checkpoint only one arm reached shows as `unpaired`. Both queries empty is a control and the arms must be identical (two fresh runs of one seed were, field for field bar wall time). **The run processes its own result** (`scripts/process_benchmark_results.cjs`): a verdict (inert, one battle, quiet, weak or moved, with the Bonferroni line named and the chance count stated), the paired table, the seeds that part earliest and slim viewer files (`off.json`, `on.json`: the full-length record of a scripted run; in seeds mode the 8 seeds whose timelines part earliest). It is the head of the run summary, is printed in the job log, and is pushed (`scripts/publish_benchmark_result.sh`) to the `benchmark-results` branch at `benchmarks/results/scripted/runs/<run>/` (`summary.md`, `result.json`, `compare.json`, `off.json`, `on.json`; the newest 30 runs stay; `benchmarks/results/standard` is not touched), so read a run with `get_file_contents` on that path, not by downloading an artifact. The notification's click opens `ai_flow_live.html?bench=<run>&view=brain3d` with both arms loaded: on the server's map once its viewer has the loading code (it has it when this reaches `main`), until then on the viewer of the branch that ran (`/preview/<slug>/`, which the preview deploy now uploads), and on the run page if neither is up; the full artifacts keep every record. `BATTLE_BENCHMARK_WINDOWS` is the runner's switch, and without it the runner is the whole battle as one record (the milestone `battle-benchmark.yml` still uses that). **`seeds` above 1 is a paired run across seeds**: `seed` is then the prefix, the seeds are `<prefix>-0001` to `<prefix>-<N>`, `scripts/plan_benchmark_shards.cjs` spreads them over up to 20 shard jobs (`BATTLE_BENCHMARK_FIRST` numbers a shard's seeds) that each play both arms on one runner over `windows` (default `contact+120`, the first two minutes of fighting, one record per seed), and a last job pools the shards and compares them paired by seed (`compare_benchmark_arms.cjs`, `--count casualties` among the counters; `scripts/format_benchmark_compare.cjs` renders the table in the run summary). One shard failing leaves its seeds out of the pairs and fails the run. |
| `battle-benchmark.yml` | tag `benchmark-*` or dispatch (source must be on main) | 30 workers × 10 = **300 battles**, 100 per type. Major milestones only. |
| `battle-hotpath-profile.yml` | dispatch (type/seed/seconds) | Hot-path profile on one seed |
| `branch-housekeeping.yml` | PR merged; Mondays; dispatch (`dry_run`, default on) | Deletes a merged PR's head branch unless it moved past the merged commit or another open PR uses it; the sweep deletes branches with every commit already in `main` (`git cherry`), no open PR and a tip ≥7 days old. Never `main`/`benchmark-results`; unmerged branches are only listed in the run summary. |
| `tripo-model-sync.yml` | dispatch | Tripo FBX export via `scripts/tripo_models.py` (needs the `TRIP_API` secret) |

Benchmark battles are 600 simulated seconds at a fixed 0.15 s step. Results go to the
`benchmark-results` branch.

**Benchmarks run on GitHub, never locally.** Dispatch `battle-benchmark-standard.yml` on the branch
and on `main` with the same `seed` input and no flags for a paired comparison across commits, or on the branch with `query_on`
set for an A/B of a flag, and `seeds` (e.g. 100) when the flag needs a verdict and not only a look. The result is published to the `benchmark-results` branch and the artifacts keep every record. Local Playwright runs are for
probes and single-seed replays only (the scripted benchmark is one seed, about two minutes: `BATTLE_BENCHMARK_WINDOWS=contact+60,every60
BATTLE_BENCHMARK_COUNT=1 BATTLE_BENCHMARK_SEED=<seed> node scripts/run_battle_benchmark.mjs`).

## Battle Sim architecture: M3C (Macro / Meso / Micro Combat)

**Prime rule: one owner per responsibility.** Fix a bad behaviour at the layer that owns it. Don't
stack cooldowns, blockers, retries or extra movement writers to make one counter improve. A fix is
good if the system is easier to explain afterwards. `wire-map-check.js` holds the rule: every squad,
soldier or Engagement-record field that more than one file writes is listed, with a role and a reason,
in `tools/ai-sim-harness/fixtures/wire-map-baseline.json`, and the list only shrinks. A new writer
file needs an entry there, which a reviewer sees; a fix that removes a writer must remove its entry.

`General (Macro) → Squad Leader (Meso) → Engagement → Movement Resolver → Movement Execution → Navigation`.
Intent flows down and status flows up. No layer rewrites another's state.

| Layer | Owner (file) | Owns | Must not |
| --- | --- | --- | --- |
| Macro: Force Command | `commander-ai.js`, `commander-doctrine.js`, `commander-routes.js` | `_macroMission` brief {intent, action, objectiveId, point, flank leg, status}, `targetObjective`, `commandRole`, force allocation, reserves | write `commandPhase`/`objective`/route legs, cover, slots or soldier destinations |
| Meso: Squad Leader / Squad Command | `modules/16-squad-plan-stability.js` (`executeMission`, `fireAndMovement`; SquadAI's `squadCommand` owner) | stable squad plan: fireteams, formation, order anchor, fire and movement (assault authorisation, bound cycle and team), corner pauses, defensive posts, regroup, the forward line (`sq._forwardLine`), objective phase; the only writer of `commandPhase` (setup states it through `initialPhase`); the only publisher of the anchor pair `orderAnchor` + `rally` (`BattleSquadStability.publishAnchor`: its advance, its regroup, the General's merge and the garrison setup all call it); the roster (`squad.members`, `soldier.squad`: `reform` and `disband` for a merge, `detachFled` for a man who has fled, `absorb` for one a retreating squad takes in) and the squad's `safePoint` | do obstacle avoidance; republish orders every tick |
| Micro: Engagement | `engagement.js` (+ `modules/44-combat-urgency.js` drills on its `afterDrill` slot) | per-soldier state machine, stance (`prone`/`crawling`/`tacticalCrouch`), permission to fire, combat proposals to the resolver, the squad contact report (`inContact`, base of fire, pinned, and the men reacting to stress), the stress reactions (`cower`, `flee`, `freeze`, `rage`, behind `?stressAct=`), the fled man's phases and the decision to leave his weapons (`BattleWeapons.abandon`) and take a new one at base (`SquadAI.rearm`); reads each man's Perception-owned picture through `SquadAI.soldierContact` | write final destination; pick objectives; decide squad bounds; promote squad aggregate contact into personal truth |
| Perception + shared primitives | `squad-ai.js` | who sees whom (view cones), per-man `soldier._beliefs` (seen/told/heard facts with provenance, confidence and expiry), the aggregate upward `squad.contact`, gunfire memory, shot resolution and `areaFire` suppression; `SquadAI.soldierContact` is the personal read API and `resetPerceptionBattleState` owns battle-lifecycle cleanup; hosts the declared extension points (`SquadAI.extend`) and `BattleLeases`; a status-only squad update when no `squadCommand` owner is loaded | set stance/destination in combat; let presentation or hidden truth validate/upgrade a belief |
| Soldier condition | `modules/17-soldier-mind.js` | `soldier.mind` (stress, band, shock) and the `squad.mind` roll-up: what suppression, wounds, casualties, leadership and company do to a man; the four modifiers Engagement and the shot model read | write stance, destination, target or another layer's timer; draw the combat RNG |
| Soldier stats | `modules/10-soldier-stats.js` (`BattleSoldierStats`) | `soldier.stats` (six hash rolls of faction and id) and `squad.stats` (means over the living): the numbers the reading layers price, and the ranks the General reads | write any timer, stance, destination or another layer's state; draw the combat RNG |
| Tactical positions | `modules/20-building-hardpoints.js` (`BattleTacticalPositions`: `claim`/`current`/`station`/`release`) | window/hardpoint reservations `assigned→ingress→occupying→holding→released`, committed ingress route | |
| Window firing port | `battle-navigation.js` (`station.port`, `aperture`, `inSector`, `rejectedWindows`) with Engagement's `station` | the aperture geometry (sill, head, jambs, the anchor, the stance the sill fits, the exterior sector) and the per-tick question of whether his eye and his bore pass through it; the post itself, its bounded local pose (`t.pose`) and the aperture report (`t.aperture`) are the Tactical positions manager's record | assign or release a window, pick a destination, write another layer's state; bypass the wall (LOS elsewhere is unchanged) |
| Tactical routing | `modules/52-survival-tactical-route.js` | safe ingress, suppressed cover detours | resurrect an obsolete objective |
| Movement Resolver | `movement-resolver.js` | **sole normal-runtime writer of `soldier.destination`**; coalesces Engagement's per-tick combat requests and arbitrates Meso vs Micro proposals | act as a garbage collector for redundant producers |
| Diagnostics | `modules/36-order-provenance.js` (writer provenance, fast setters, 1.6 s in-place sampler), `32` Loop Watch, `43` forward progress, `99` the one diagnostics exporter (full, loops and orders via `BattleDiagnosticsExport.snapshot(kind)`; `38` only adds its AI Graph buttons) | observe only: removing them leaves a battle identical (~4% wall time) | change gameplay |
| Navigation | `battle-navigation.js`, `modules/39-navigation-physicality-debug.js` | doors, stations, pathfinding, 0.45 m body legality | assign or release tasks |
| Personal space | `modules/51-soldier-personal-space.js` | local physical correction | own commands |

The Squad Leader declares its 11 execution phases in `BattleSquadStability.states`; setup,
mission execution and regroup all enter through `transitionPhase`. A replacement brief may select
any phase, so legality comes from the mission/route/lease guards rather than a restrictive phase-only
adjacency. Retreat remains `sq.state`, not a `commandPhase`.

Brief lifecycle: `issued → executing → completed | invalid | failed | superseded`. The General
wakes only on: initial brief, mission complete or invalid, reserve due, a defence request that
changes the task, an objective vacated or changing control on a defend brief, a 120 s strategic
stall (`STRATEGIC_STALL_REPLAN`, the one stall clock: the coordination-health sampler's `replanDue` is that same number read from the General, an export flag nothing reads), a Squad Leader `doctrine-review` escalation, or a merge (`squad-reconstituted`). Wakes are
exported under `macroCommand`. `commander-ai.js` declares the lifecycle as `missionStates`; every
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

**Reconstitution** (`commander-ai.js` `reconstitute`, Macro only). A retreating squad's Squad Leader
walks it home (`_assembly` `to-base`); home and out of contact it is `at-base`. Only `at-base` squads
form the pool, so no group is planned for a squad still on its way. When the pool holds 10+ survivors
the General groups the fewest squads that reach 10 (never splitting one; a squad that already holds 10 living men is not pooled: it rests at base, in `retreat` while group morale says its men are not calm, and the Squad Leader rallies it, where it would otherwise be "merged" with itself on every command tick: 397 groups in one battle with stress that lasts), picks the objective it will
send them to next (`chooseObjective`, strongest squad as reference) and gives each a `reconstitute`
brief to a rally point on the approach to it: on the spawn line 30 m forward, in line with the
objective, clamped to the side's lanes (centre of the home points if there is no objective). The
brief carries it as `plannedObjectiveId`, never `targetObjective`, so a retreating squad is not counted
at the objective; after the merge the General sends the squad there unless it changed hands
(`to-rally`, `SquadAI.retreatGoal`).
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
queries enemy truth. A fresh, adequate *leader-owned* `SquadAI.soldierContact` suppresses the order; aggregate
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
**Stress reactions** (`engagement.js`, `?stressAct=cower,flee,freeze,rage`; all four on by default, `?stressAct=0` disables them and a comma list selects an exact subset; owner direction 2026-09-30). Stress changes what a man does. The reactions are Engagement states declared in `BattleEngagement.states` (`cower`, `flee`, `freeze`, `rage`, enterable from every other state, leaving by `advance` or `withdraw`, a flee only by `advance` at base); module 17 still writes only `mind` and supplies numbers through `BattleSoldierMind.view` (his band and since when, whether he is under fire, and his *temper*: three fixed unit hashes of faction and id, never the combat RNG). `cower`: rattled and under fire goes to ground (prone, crouched for a role that does not go prone), holds, fires nothing, and gets up when the fire on him has been quiet for `COWER_QUIET` (3 s) or he has calmed below rattled. A broken man breaks by his best enabled reaction, temper x situation (declared, deterministic, ties in the order flee, freeze, rage): `flee` weighs his flee temper by whether there is trouble to run from (0.3 if not), `freeze` his freeze temper by whether he is under fire (0.7 if not), `rage` his rage temper if an enemy is within `RAGE_RANGE` (120 m) and he has a weapon with ammunition. `flee` is final (below, **The fled man**): he runs (`flee` intent, resolver priority 92, which a squad's retreat neither rejects nor overrides for him) to a refuge chosen once and standing until he is there (a first version looked again as the threat moved and one man ran 1.1 km; now a man who makes no headway for 4 s, twice, waits where he is), never fires, and releases a firing station first (a man who is down, running or charging is not eligible for one). `freeze` holds where he is, crouched, fires nothing and takes no order. `rage` charges the nearest enemy (`rage-charge`, priority 72), fires on the move (the speed gate is not his; the shot group is already wider for a man who moves) and strikes at 2.2 m every 1.4 s: a roll of the combat RNG (60%) and a chest wound at 0.8 of a rifle round's energy through the wound model; he gives it up when nobody is within `RAGE_REACH` (160 m). **The berserk guard** (owner, 2026-10-01): for `RAGE_GUARD_SECONDS` (5 s) from the moment he breaks into `rage` (`eng.guardUntil`, set by Engagement, whether or not the charge lasts the five seconds; a new break renews it) he takes `RAGE_GUARD_SCALE` (0.25) of every hit: of its hp damage, of its chance to drop him and of the bleed it starts. The wound model asks `BattleEngagement.guardOnHit(victim, battle, damage)` for the multiplier and draws exactly the same two rolls guarded or not; nobody else has a guard (cower and freeze have none), and `stress.acts.rage` counts the hits taken under it (`guarded`) and the hp it saved (`savedHp`). A freeze or a charge lasts at least `REACT_MIN` (4 s) and ends once he is below broken, then he rejoins the fight through `advance`; a flee never ends that way. A squad that is already retreating is not reacted for: the retreat outranks every drill. Upward the reactions are status only: `updateSquad`'s report carries `reacting`, a man in it is neither base of fire nor a mover nor a suppressor, and no layer reads a man's state. The numbers are `BattleEngagement.tuning.ACT_TUNING`, declared and not tuned. **The fled man** (`?stressAct=flee`; owner direction 2026-10-01): a broken man who runs is done with the fight for good. At the break Engagement (`beginFled`) leaves his weapons where he stands (`BattleWeapons.abandon`: the primary, with where it lies, and the holstered sidearm) and posts the `fled` event, so his stress never drains below `FLED_FLOOR` (0.2, module 17: he can recover to it at base and no lower). The squad report's `fled` list tells the Squad Leader, who lets him go from the roster (`BattleSquadStability.detachFled`): he is a squad of one in `retreat` (`fledId`, a full squad's strength missing, his old squad's home), and a leader who runs leaves his squad leaderless (succession). He runs (`flee`) to the squad's `safePoint` (the Squad Leader's record of the last place it stood out of contact with nobody known near; `squad.rally` is the moving anchor, at the front, so it is not that), or to its home when the trouble is known within `FLED_SAFE` (80 m) of it; waits there (`fledPhase` `wait`: a hold, shown as a freeze hold) for `FLED_WAIT` (180 s); and goes home (`home`, a flee run) when a retreating squad takes him in, when an enemy known within `FLED_ENEMY_NEAR` (80 m) gets near him, or when the wait is over. A retreating squad takes him in when the General finds one out of contact within `FLED_PICKUP_RANGE` (50 m) of a man who is waiting (`pickUpFled`, Macro; a man still running to his refuge is not picked up): the Squad Leader rewrites its own roster (`absorb`: he is on the squad's roster and his squad of one is gone, like a squad absorbed by a merge) and Engagement is told (`releaseFled`), and he goes home with them. A man in a fled phase is not part of the squad he is on the roster of for the Squad Leader's cohesion and advance gate (`commanded` in module 16): a squad that took him in and rallied before he got home would otherwise read him as scattered, and its regroup order (resolver priority 95) outranked his flee (92), so he was pulled back every ~10 s and never got home (seed 0004, 61 regroups against 10 with flee off, 8 of 17 US men still on the way home at the end). At base (`FLED_HOME_RADIUS`, 12 m of home) `SquadAI.rearm` issues his role's loadout (`BattleWeapons.arm`, ammunition initialised) and he is a man of a retreating squad of one again, recovering, still on his own: at-base squads are what reconstitution groups, so he rejoins the fight in a full squad and never in the one he left. Nothing ends it but base: calm, and his squad's retreat, do not. The resolver lets a flee intent through a squad of one's retreat (it neither rejects nor overrides it), because he does not take the order home. The numbers are `ACT_TUNING` (`FLED_*`), `BattleCommanderAI.fledPickupRange` and `BattleSoldierMind.tuning.FLED_FLOOR`, declared and not tuned. The benchmark's `stress.acts.flee` counts spells begun, seconds, and `waited`, `waitSeconds`, `homeEnemy`, `homeTimeout`, `homePickup` and `rearmed`. `fled-man-check.js` holds all of it. The benchmark's `stress.acts` counts spells begun, seconds in each, and the charge's blows struck and landed. Presentation is owned by the FBX backend and never feeds the simulation: cower cross-fades through stand-to-prayer, the kneeling prayer hold and its rise; freeze enters through the terrified clip and then picks standing prayer, sitting dazed or fallen from a stable hash of faction + soldier id (no RNG); a fled man turns into his authored run and runs whenever he moves, and while he waits at his refuge shows his freeze hold; rage keeps its ordinary sprint, aim and fire layers because he is still fighting; cower and freeze leave the weapon beside the man and restore it when the reaction ends; a weapon the sim took from a fled man (`BattleWeapons.abandon`, which records where it lay) stays there as a world prop, and the one he is issued at base is drawn in his hands: the backend only draws what it finds and writes no weapon. `stress-reaction-animation-check.js` holds the mapping and the renderer rates live in `REACTION_ANIM`. `stress-reactions-check.js` holds it and the `stress-reactions` probe shows what each reaction looks like on real battles (episodes, how long, how each ended, a flee's distance and refuge, a charge's approach and blows). Dose on three local battles (not an arm): `?stressAct=all` alone began 88 cowers (4.4 s each), 16 flees and 15 freezes and no charge (the enemy is almost never within 120 m); with `?stressMem=all` 95 cowers, 21 flees (26 s each), 32 freezes and 1 charge. The paired benchmark numbers are in the PR that carries them. **Reading the stall counters for these arms (fixed since: the runner clears the clock like module 97, see the compare tool's row):** the runner's `movementStalls` doubled under `stressAct=cower` (39 to 78 reports in 100 battles a prefix, battles with a stall 12 to 54), but the extra reports are not stalls: its tracker (`scripts/run_battle_benchmark.mjs`, `unitTrack`) `continue`d past a man in a combat state, one with a target or one in a phase that does not advance, without clearing his clock, so a man who has held 12 s or more in `cower` can be reported on the first tick he is back in `advance` and not yet moving (read from the code: the benchmark's shard battles did not replay locally, so no man was traced), while module 97's `stalled` series (the same predicate) clears the clock whenever he stops qualifying. On `main` the two agree battle for battle (reports equal timeline onsets in 395 of 400 battles, never more); under `stressAct=cower` 38 battles report more than the timeline counts (44 extra reports), and the timeline's own onsets (45 to 40) and man-seconds stalled (745 to 596), and MovementProgress's stuck detections (473 to 493, p 0.37), did not rise. The runner was fixed afterwards (a separate PR, so that the field changes in one place); records from before it keep the old counts, so for those use `--count timeline.stalledOnsets` / `timeline.stalledSamples`.
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
  offset and the over-shift in Engagement's `portLines`/`portSolve`: no `tuning` object yet and not in `TUNABLES.md`.

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
them back into long single lines.

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
4. Name the one owning layer and subsystem; two apparent owners is itself the bug. 5. Trace the
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

### Open issues (as of 2026-10-01)

Keep this section to **work that is genuinely still open**. Completed investigations and shipped
fixes belong in their subsystem sections, commit messages and PRs; do not leave them here as a
pseudo-backlog. Long-form historical notes remain in git history
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
  `flatDamage` was removed in #121, and the tunable inventory shipped as `TUNABLES.md` in #129. The proposed
  "fresh reader" ceremony was not separately run and is not a blocker.

Owner decision 2026-10-01: treat the **AI-polish campaign as closed**, not as a phase queue that must be reopened
until every discarded experiment is implemented. New behavior belongs in the active soldier roadmap below or in
`battle/AI_TACTICS_OUTLINE.md`; new performance work starts from a measured regression.

</details>

**Residual small debt (track individually, not as “AI polish”).**
- `objectiveHoldWin` remains an unread legacy genome parameter while the genome is stashed; remove/settle it during
  the eventual genome rewrite rather than reviving it now.

**Small debt cleanup (2026-10-03).** `soldier.fireCooldown` now has one direct writer,
`squad-ai.js`: spawn stamps, frame countdown, reload holds and sidearm draw/clear delays all route through
`setFireCooldown` / `extendFireCooldown` / `tickFireCooldown`, and the wire-map multi-writer entry is gone.
`modules/52-combat-posture-visual.js` no longer swaps `soldier.target`; it sends a static
`animateWalk(..., {aimPoint})` presentation input through the gait/stance wrapper chain to the procedural/FBX
presentation backends. Perception keeps ownership of gameplay target state.

**Soldier-level AI continuation (active plan; repo archaeology refreshed 2026-10-01).** This is the
active behavioral roadmap below the Squad Leader. It is deliberately separate from the larger architecture in
`battle/AI_TACTICS_OUTLINE.md`. The Sept. 13 outline (`f71ab0dd55cd03daae4b07c81665d3d74452618c`) also describes
structure-control, street/route-transition plans, a versioned `SquadIntent`, a stronger Squad Leader local planner,
objective secure/exploit/handoff and later combined arms. Those remain the major AI addition we are intentionally
waiting on: keep their detailed design in the outline and do **not** pull them into the current implementation queue
piecemeal. The window archaeology is the warning case: the physical/tactical-position substrate survived while the
full use of the opening had to be recovered later; the firing-port implementation is now back on main
(`e10622a3893f5eecfb2bbdefc80b7140e4b7ee37`, with the merge preserved by `e0455331d9ae8b26c47dc455f9c5b97945791278`).
Do not let the soldier-level items below collapse back into a one-line future note.

**Shipped baseline to preserve.** Perception/view cones, hearing/relay and sector scanning; per-soldier loadouts and
sidearms; soldier condition/stress and its lasting-memory path; cower/flee/freeze/rage (all four on by default since
2026-10-01); the fled-man lifecycle; Engagement-owned stance/cover; last-known-threat alert posture; and tactical
firing stations/window ports are existing substrate. Extend these owners instead of creating parallel systems.

<details>
<summary><strong>Completed: post-v278 stabilization phases</strong> — #159, #160, #161, #162, #164 and #165 are on main</summary>

The six stabilization slices are closed and no longer part of the active queue:

- #159: freeze/flee are visible non-threats and frozen men suspend active perception/facing.
- #160: freeze duration is bounded by recent stress tempo (12–48 s) with diagnostics.
- #161: retreat anchors/intents are stabilized with the sliding lease and progress checks.
- #162: fire-control evidence and posture-churn diagnostics are exported.
- #164: strategic objective-stall recovery escalates through reconcile/release/main-effort/reset.
- #165: Perception owns the shared threat-disposition contract for active threat / visible non-threat / inactive.

Their detailed behavior, harnesses and tuning live in the subsystem sections, carrying PRs and git history. Do not
reopen these phases as backlog items unless a new measured defect points back to them.

</details>

**Remaining soldier-level slices, in order:**

Slices 1 through 3 of the original continuation are already shipped:
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

The small soldier-level continuation sequence is complete. The active AI queue returns to
`battle/AI_TACTICS_OUTLINE.md`'s **Immediate first implementation slice**:

1. Add `TacticalSituation` plus a read-only street/building-control diagnostic snapshot.
2. Render/export that diagnostic state without changing behavior.
3. Add version/reason/confidence metadata to the existing `SquadIntent` command surface.
4. Add one named `route-transition` lease with progress/abort telemetry.
5. Validate those control-plane changes on fixed seeds before enabling new route or structure behavior.

**Rules for every slice above.** One conceptual behavior change at a time; existing owner boundaries remain
authoritative; new state has an explicit owner and reader; no presentation system writes simulation truth; no
combat-RNG draw merely to choose tactics; add a deterministic harness/check before relying on a visual impression;
add observe-only probe/telemetry that measures the decision dose; ship behavioral changes behind a flag until the
paired GitHub benchmark shows the efficiency gate is acceptable. **Do not make a behavioral feature imitate the old
simulation merely to satisfy an equality test.** New tactics are expected to change decisions and outcomes; benchmarks
gate broken invariants, determinism, pathological stalls/loops/churn, runtime errors and performance, while behavioral
deltas are evidence to understand rather than something to erase. Equality/neutrality checks belong only to explicitly
non-behavioral tooling or a deliberately isolated legacy/control arm. Once a slice ships, move its evidence into the
subsystem section but leave this sequence accurate so the next unfinished slice remains visible.

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
(#139-#147, #150-#153), not in the active backlog. Future work starts with the soldier-level sequence above, not by
reopening the reaction rollout.

</details>

The loadout, sidearm, perception and weapon-seat work shipped (see Loadouts and sidearms and Perception).
The active soldier-level continuation is listed above and is **not** part of this deferred list. The larger
command/urban/route architecture stays in `battle/AI_TACTICS_OUTLINE.md` until that major AI phase is resumed.
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
  truth is `battle/AI_TACTICS_OUTLINE.md` (introduced by `f71ab0dd55cd03daae4b07c81665d3d74452618c`); do not
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

## Soldiers, weapons, animation

AI requests semantic tags and the backend renders them. The tags are `locomotion.idle|walk|crouch-walk|prone-crawl`,
`combat.aim|fire|reload|hit`, `stance.stand|crouch|prone` and `death.front|back|side`, and
`BattleSoldierModel.TAGS` is the source of truth. The backend (`modules/53-fbx-soldier-backend.js`)
never decides tactics, ammo, hits or paths.

- Models, one per class (`MODEL_SETS` in the backend, keyed by role): `Assets/soldiers/{us,ge}-captain.fbx`
  (sergeant; the file keeps its old name), `-scout`, `-gunner`, `-engineer`, and `-paratrooper` for
  riflemen and any role without a model. `?soldiers=rifleman` shows the older `-rifleman-rigged.fbx`.
- Clips: `Assets/animations/*.fbx` (Mixamo rig with fingers, named `<description> - <clip name>`),
  keyed in `CLIPS`, `FAMILIES` (8-way) and `FOUR_WAY` in `modules/53-fbx-clip-table.js`
  (`BattleFbxClips`, data only). The battle fetches only those files, and the lab loads the same table
  for its **Show all animation clips** toggle (off: only in-game clips; on: all, in-game marked ●).
  Bone names are canonicalised at load, so `mixamorig:` and older rigs bind the same clips.
- **Prepared clips.** The battle loads every `CLIPS` entry from one file,
  `Assets/animations/prepared-clips.bin` (~4.5 MiB instead of ~36 MiB of clip FBX), already through
  `sourceRig` + `convertClip`; retargeting onto each model still runs at load. A clip whose spec no
  longer matches `CLIPS` loads from its FBX. **After changing a clip FBX, `CLIPS` or the conversion
  code, rebuild it** with the repo served: `NODE_PATH=$(npm root -g) node scripts/build_clip_pack.cjs`
  (the backend's own code in headless Chromium; byte-for-byte repeatable). `check_clip_pack.cjs`
  fails CI and the deploy until then. Changing the pack's layout or meaning means bumping
  `CLIP_PACK_FORMAT`. The Motion Lab still reads FBX.
- Weapons (the model `BattleWeapons.PROFILES` names per side and kind): rifle Garand / Kar98k, LMG M1919A6 /
  MG42 (folded-bipod carry variants), scouts M1 Carbine / FG42, sergeants Thompson / MP40,
  sidearms M1911A1 / P38 (sergeants and gunners carry one holstered). Babylon is pinned to `babylonjs@9.27.1`.
- **Weapon seats and sidecars.** Hand contacts and weapon points default to `SOLDIER_CONTACTS`,
  `WEAPON_POINTS` and `WEAPON_MODEL_POINTS`. A per-model sidecar `Assets/soldiers/<model>.fbx.json`
  (contacts, one slot per weapon: grip / fore-near / fore-far, pistol arm and wrist dials) overrides
  them; the backend fetches it on load (`BattleFbxSoldier.sidecars()` lists what loaded). Measure in
  `labs/fbx-animation-lab.html` (pick model, clip and weapon, click the contact vertices, **Seat
  weapon**, then **Per-model sidecar** → Save), which posts to `labs/save-calibration.php` (validated
  numbers, existing soldier FBX names only). Saving needs the lab password, asked once per browser;
  its hash lives only on the host in `state/lab-key.php` (`<?php return '<sha256 hex>';`, from
  `printf '%s' 'password' | shasum -a 256`), and without that file saving is off. Pistol slots
  never carry fore points (one-hand hold, in the lab and the game). Only `us-captain` has one on the host. Its weapon slots are embedded in the backend as `DEFAULT_SEATS`
  and fill every model's missing slots (a model's own sidecar and a `WEAPON_MODEL_POINTS` exception win;
  contacts stay per model). Sidecars are server-owned:
  never committed, never deployed or deleted.
- Clips are retargeted at load (rest pose, units, hip height), in quaternions (`retargetRotations`). Looping clips have hip drift removed,
  and that drift becomes their natural ground speed. Playback rate is ground speed ÷ clip speed.
  The upper-body overlay (aim/fire/reload) sits on the lower locomotion layer. The weapon grip snaps
  to a right-palm anchor, the fore-end runs through the left palm, and aim uses a capped spine twist (≤40°).
- No fallback in the game: the page waits for the FBX soldiers however long they take, and a failed
  load shows the load error (`BattleSoldierModel.preload` rejects). Each soldier is a bare body
  (`BattleSoldierModel.createBody`: root, pose root, weapon socket, no meshes) wearing his model,
  with `rig===null` and a `_fbx` binding. The procedural rig in `battle/soldier.js` is only the body
  the trainer and headless benchmark use (`setImportedEnabled(scene,false)`); those soldiers keep
  their `rig` object. `scripts/probe_soldier_load.cjs` checks both the normal load and a blocked
  asset.
- **Animation LOD** (`53-fbx-soldier-backend.js`, `BattleFbxSoldier.lod`, presentation only): the
  render hook re-poses a soldier every frame within 35 m of the camera, at ~30 Hz within 100 m and
  ~10 Hz beyond (each on his own phase), never while he is outside the view frustum, and only once
  while his pose inputs are static (a finished death clip, a paused sim). Shadow-aware: a soldier
  whose meshes cast shadows (in any shadow generator's caster list, or any generator with a
  `renderListPredicate`) is held off-screen only when the ground his shadow falls on is out of view
  too; `scripts/probe_lod_shadows.cjs` proves it with positive and negative controls. Add soldier
  shadow casters through a ShadowGenerator and the LOD follows, with nothing to register. Clip clocks stay on sim
  time. A held soldier's skeletons are not re-prepared either: Babylon's `Skeleton.prepare` would copy
  every linked bone node and rebuild and re-upload the bone matrices each frame, so each soldier's
  skeletons prepare once per pose (`lod.skeletons`). `?animLod=0` turns both off.
  **Off-screen culling** (`BattleFbxSoldier.cull`): bind makes soldier meshes always active (their
  bounds are the bind pose), so Babylon never culled them and the GPU skinned all 100 every frame. The
  render hook now disables a soldier's meshes while a 3 m sphere around him is out of view and no
  shadow of his could be in it (the LOD's shadow rule); weapons and decals are culled by Babylon.
  `?soldierCull=0` draws them all; `probe_soldier_cull.cjs` proves the frames identical. Thresholds are tuned from close-ups, never tied to gameplay.
- **Soldier mesh LOD** (`53-fbx-soldier-backend.js`, `BattleFbxSoldier.meshLod`, presentation only):
  beyond `far` (45 m, 3 m hysteresis) a soldier draws a meshoptimizer-simplified triangle list
  (~12%: ~1,250 of ~10,400 triangles, ~1,300 of ~22,000 vertices) over his model's own vertex
  buffer, so bone weights, clips, poses and the animation LOD are unchanged. The lists are built once
  per model when meshoptimizer (jsDelivr) arrives, which never holds the load; without it soldiers
  draw at full detail (`meshLod.failed` says why). The models ship unwelded, so they are welded by
  position for the simplifier (`Sparse`), and each kept corner takes the vertex whose UV agrees
  with its triangle, so texture seams hold. `?soldierLod=0` turns it off; tune `far`
  from `probe_soldier_mesh_lod.cjs`. Baking the lists offline belongs with the startup item in Open issues.
- Wired beyond the basics: turn-in-place (standing, crouch, prone), death pools, hit reactions
  (`combat.hit`), idle variants and suppression flinches. Still unused: prone roll right (a left roll
  needs mirroring) and the kneel set. Jump clips need a nav vault edge.
  Not in the pack: sideways crawl, grenade throw, melee, limp, climb, window lean.

**Asset pipeline.** Use the Blender app bundle `/Applications/Blender.app/Contents/MacOS/Blender`, not the
broken `blender` on PATH. Use lowercase filenames, since the host is case-sensitive (`git mv` to rename).

**Approved runtime-format direction (2026-09-27):** FBX is the authoring/ingress format, not the
long-term browser runtime format. The pipeline should convert FBX soldiers/clips/weapons as needed
into measured game-ready artifacts (GLB/glTF or a compact custom representation) and ship those
prepared outputs. Keep raw/source FBX for regeneration and Motion Lab/source workflows where needed;
do not make production clients repeat deterministic parsing, resampling or rig-preparation work that
can be done once offline.

```bash
Blender -b --factory-startup --python tools/fix-soldier-model.py -- --input raw.fbx --output Assets/soldiers/<fac>-<name>.fbx --texture-name <fac>-<name>-albedo [--fit-skin]
Blender -b --factory-startup --python tools/prepare-weapon-model.py -- --input raw.fbx --output Assets/weapons/<name>.fbx --name <name> --length <m> [--fold-bipod]
python3 tools/prepare-muzzle-flashes.py --input pack.zip --output Assets/effects/muzzle-flash   # update FLASH_COUNT if count changes
```

Soldier FBX requirements: one skinned mesh, the shared bone names (`Hips`, `Spine02/01/Spine`, `neck`,
`Head`, `Left/Right Shoulder/Arm/ForeArm/Hand/UpLeg/Leg/Foot/ToeBase`), no normal maps, and a unique
embedded albedo name. Weapon layout: barrel on +Z, butt 0.40 m behind the grip, barrel top +0.03 m.
Lengths: Garand 1.107, Kar98k 1.11, MG42 1.224, M1919A6 1.346, M1 Carbine 0.904, FG42 0.975,
Thompson 0.857, MP40 0.833, M1911A1 0.216, P38 0.216 (pistols add `--butt 0.06`). A generator
character in an A-pose must be moved to the library's T-pose rest first (`tools/match-rest-pose.py
--rest-from <library clip>`, refuses above 1°); an unrigged one borrows a rigged twin's weights
(`tools/rig-soldier-model.py`). `tools/blender-presets/` holds the matching manual FBX export presets.

Before committing, run the lineup: `node scripts/fbx-soldier-lineup.cjs` against the local server
checks every faction/role model + weapon pair and the two-hand hold, and writes close-ups to
`$FBX_OUT` (`FBX_CHROME` picks a browser; visual PASS is still a human judgement: lit, no holes,
factions textured differently, weapon on the hands). Keep weapon source `.zip` packs next to the
`.fbx`; new generator packs in `Assets/soldiers/new/` are gitignored. Only the `.fbx` deploys.

## Audio

`Assets/audio/manifest.json` is the runtime contract, and the runtime never calls an API.

- **Route:** fetch into gitignored `.runtime/`, slice, master, register in `manifest.json`, then commit
  the MP3s only.
  - Fetch: `fetch_sonniss_ww2.py scan|fetch <year>`, which does range requests into bundle zips, or
    `fetch_freesound_cc0.py <ids>`, which refuses anything not CC0.
  - Slice: `slice_weapon_shots.py scripts/recipes/<recipe>.json`. It uses transient detection, or
    `segments` for engines.
  - Master: `bash scripts/normalize_audio.sh Assets/audio`. It's incremental via `.mastering-state.tsv`.
    Delete that file to force a remaster when a target changes. `--explain <path>` shows the
    target, and `UNCOVERED` means no target exists, so the file would ship unmastered.
- **Targets:** mono MP3 48 kHz/128 kbps with a -1 dBTP ceiling.
  - One-shots are levelled on the loudest 100 ms (dBFS, not LUFS): small arms -16, cannon -13,
    foley -26, with at most +6 dB boost.
  - Sustained material uses EBU R128: voices -18, engines -22, ambience -26 LUFS.
  - Do distance in the runtime mix, never in the master.
- **Placeholders:** declared-but-unrecorded clips are listed in `Assets/audio/.manifest-placeholders.txt`.
  Delete a line when its audio lands; CI fails if a listed clip exists. New directories must be in
  `AUDIO_ASSET_GLOBS` in `prepare_incremental_deploy.py`, or they 404 live.
- **Voices:** generated with ElevenLabs `eleven_v3` via `scripts/generate_voice_callouts.py
  [--faction us|ge] [--force [EVENT]]`, which needs `ELEVENLABS_API_KEY` (never commit it).
  - Voice IDs: US `TxWZERZ5Hc6h9dGxVmXa`, GE `Z2yQ1EdlDmcIgh9Pn4Lw`. Prompt prefix
    `[shouting][hoarse][panicked]`, settings stability .4, similarity .7, style .9, speaker boost.
  - Don't rename generated files.
  - Pitch variants (-1.4 / 0 / +1.3 semitones, split 30/40/30, tempo-compensated) are built at deploy
    by `build_voice_pitch_variants.sh` and aren't committed.
- **Acoustics:** 1 unit ≈ 1 m, 20·log10(r) spreading, 343 m/s delay. Shout culls at 150 m,
  small arms at 1200 m. Settings live in `Assets/audio/acoustics.json`.
- **Licensing:** Sonniss GDC bundles (royalty-free, no attribution; **no AI training and no
  redistribution as a library**), Freesound CC0, and **licensed third-party small-arms recordings** for every small
  arm (owner's single-user licence: use inside the game only, **never redistributed or offered as
  individual stems**). The licensed clips therefore live in the **private** repo `APPARANYX/grasstex-audio`,
  never here: `.gitignore` keeps `Assets/audio/weapons/*/` out, CI, the voice/combat-SFX generators and the production deploy check out
  the commit pinned in `Assets/audio/weapon-audio.lock.json` with the read-only deploy key in the
  `PRIVATE_AUDIO_READ_KEY` secret and overlay it (`scripts/fetch_weapon_audio.sh`). A fork's PR has no
  secret, so its audio and deploy-plan jobs fail. Changing clips: push to grasstex-audio, bump the lock
  and the clips' `.mastering-state.tsv` lines here. Older provenance: `git show 1a5b0cf:Assets/audio/WW2_SOURCES.md`.

**Weapon SFX (`Assets/audio/weapon-clip-manifest.json`, shipped from licensed third-party audio).** Replaced
`manifest.json`'s Sonniss-derived `categories.weapons` small-arms pools and `weaponFoley`, which were
keyed by sim kind and whose automatic-weapon "shots" were recorded bursts. The clip manifest is keyed
one entry per `battle/weapons.js` `PROFILES[faction][kind].model` (10 weapons: Garand, Kar98k, M1
Carbine, Thompson, FG42, MP40, M1919A6, MG42, M1911A1, P38), one action per sim event (fire, distant
fire, burst tail, reload stages by mechanism, stoppage click/clear, bipod deploy/fold, plus the Garand's
clip ping and the Kar98k's bolt cycle). Every action is cut from licensed third-party small-arms recordings
(`grasstex-audio`'s `tools/build.py`; its `SOURCES.csv` records each clip's source take): `fire` from
the 3 m construction-kit takes, one discharge per file, attack within 10 ms; `fireDistant` from the
100 m takes; `fireTail` the echo after a designed single shot (never an automatic recording); foley
from the designed and construction-kit mechanics takes. The pack has no M1919 or M1911: the M1919A6 is
Bren shots pitched -1 st with MG 42 belt foley pitched -1.5 st, the M1911A1 is TT 33 pitched -2 st, and
both bipods are the DP 27's. The 17 pack guns the game does not field (StG 44, Bren, DP 27, AVS 36,
SVT 40, Gewehr 41, G33, Mosin M38, M3, MP28, PPD 40, PPS 43, Sten, PPK, TT 33, M30 Drilling rifle and
shotgun) are clipped and registered too, ready for a profile to name them. Not recorded: `shared`
casings and the `impacts` set (flybys and impacts already play from `combat/`), mg42 `barrelChange`.
The clip manifest's `prompt`s are kept for any clip regenerated with ElevenLabs
(`scripts/generate_weapon_sfx.py`); `scripts/check_weapon_clips.py --shots` vets a shot before import.

Runtime: `manifest.json` category `weapon.<model>` holds each model's actions. `battle-sim.js`
`buildWeaponAudio` keys shots by `weapon.profile`: one `fire` per round (automatic fire is retriggered
per round, never a recorded burst), `fireDistant` from `DISTANT_FROM` (90 m: the near voices' linear
roll-off is silent by ~97 m), voice pools of `ceil(cyclic x 0.9 s) + 2` so a fast gun never cuts off
its own last round; a model with no clips falls back to the kind's `SFX_FILES`. Module
`15-weapon-foley-audio.js` plays the rest (reload stages, stoppages, bipod, bolt cycle, clip ping,
burst tails; see its harness row). File layout keys the mastering targets: `weapons/<model>/<action>-NN.mp3`
(smallArms -16 dBFS) and `weapons/foley/<model>-<action>-NN.mp3` (-26 dBFS).

**Combat sounds (`Assets/audio/combat-sfx-manifest.json`).** What a round sounds like after it leaves the muzzle: near-miss
flybys (`crack`, `whiz`), ricochets, impacts by surface (dirt, masonry, wood, metal, vegetation), flesh hits and pain (`wounded`,
`down`), 58 ElevenLabs Sound Effects clips under `Assets/audio/combat/<group>/`, each with its prompt in the manifest, mirrored
into `manifest.json` categories `flyby`, `ricochet`, `impacts`, `flesh` and `pain` (`check_audio_manifest.py` holds the two equal).
`.github/workflows/combat-sfx-generate.yml` generates the missing ones on a branch (never main; repo secret `ELEVEN_LABS_API`;
`scripts/generate_combat_sfx.py`), masters them (`combat/*` targets: -22 dBFS, pain -18) and commits them; a rerun generates only
what is missing. `battle/modules/15-combat-audio.js` plays them (see its harness row): one sound per instance, capped per group.

**Audio tracker: CI and the deploy skip audio work when no audio changed.** `scripts/audio_tracker.py` lists the audio inputs
(`Assets/audio/`, the audio scripts and recipes, `ci.yml`, the production deploy). CI's audio job asks it first (`diff` against the
pull request's base or the commit before a push) and skips ffmpeg and every audio check when nothing changed; the production deploy
compares a `snapshot` with the tracker the last successful deploy uploaded (`/grasstex/.battle-audio-tracker.json`, put after the
hash state) and skips ffmpeg, the voice inventory, the pitch variants and the voice upload when they match. Any doubt (no base, no
tracker on the host, no remote hash state) counts as changed.

**Footsteps (`categories.footsteps` in `manifest.json`, real files, nothing plays them yet).**
Ported directly from the sibling project `Teethree89/ww2fps`'s ElevenLabs-generated battlefield
sound library (its `sound-manifest.json` concepts `001_pasture_grass`, `004_cobbled_street`,
`009_rubble`; 6 walk + 6 run takes each) rather than regenerated, so both projects sound
consistent underfoot. Converted from its 48 kHz/24-bit stereo WAV to this project's mono MP3 and
mastered under the foley target (-26 dBFS). `AUDIO_ASSET_GLOBS` in `prepare_incremental_deploy.py`
has one entry per surface folder (a flat, non-recursive glob per directory, same as
`weapons/foley`). Not yet done: which surface plays under a soldier's feet needs a terrain/zone
signal Battle Sim doesn't have yet (its splat/terrain data is host-only), and a footfall-cadence
hook into the animation/movement system - both real engineering, out of scope here.

## Deploy and assets

- Production `/grasstex/battle_sim.php` is `battle_sim_local.php`, uploaded under that name by the
  deploy; it serves the deployed runtime and writes nothing to the host. The repo's own
  `battle_sim.php` (a GitHub-mirroring loader that writes git-tracked `Assets/` to the host and
  never deletes) is not deployed.
- `scripts/prepare_incremental_deploy.py` uploads by content hash: `.fbx` from soldiers,
  animations and weapons, muzzle-flash `.png`, audio, and the Motion Lab's own files
  (`MANAGED_LAB`: `labs/fbx-animation-lab.html`, its two `.js`, `asset-list.php`,
  `save-calibration.php`). `scripts/build_version.py stamp|show|tag`
  derives the version from `build-v<N>` tags. Each deploy also lists the host's
  `Assets/{soldiers,animations,weapons}` and re-uploads any FBX the hash state records but the host
  no longer has (`prune_missing_remote_assets.py`), so a folder can be cleared on the host and
  refilled by running the deploy (Actions → Deploy Battle Runtime → Run workflow).
- **The deploy never deletes or overwrites server files the repo does not manage.** Hand-placed
  sidecar JSON (clip/model/lab metadata beside the FBX assets), the live FBX soldier-animation lab
  files and everything else unmanaged stay put. The planner may delete only a
  `battle/modules/*.js` it deployed itself that has left the repo; any JSON other than
  `battle/build-version.json` and `Assets/audio/manifest.json`, and any path containing `lab` or
  `sidecar`, can never be deleted or uploaded over, except the exact `MANAGED_LAB` paths, which
  are uploaded but never deleted; more than 8 deletes in one run aborts the
  deploy (`DEPLOY_MAX_DELETES` to override an intended bulk retirement). `check_deploy_safety.py`
  proves this in CI and again inside the deploy before anything is uploaded. Keep it that way:
  don't add `mirror --delete` or broaden the delete rule for production.
- `Assets/terrain/{terrain.json,terrain.bin,splat.png,roaduv.png}` exist only on the host. **Don't
  add placeholders** with those names.
- Hosted textures load only from `test.ivandpopov.com` (WebGL rejects them cross-origin).

## Grass & terrain (reference)

- `GrassAPI` (`grass-api.js`):
  - Masks: `addArea` / `excludeCircle|Box|Polygon|Corridor|Segment`.
  - Surfaces: `allowSurface` / `excludeSurface` + `setSurfaceResolver`.
  - Terrain: `setTerrainSampler` / `setTerrainMesh` / `setMaxSlope`.
  - Queries and rebuilds: `isAllowed`, `snapshot()`, `requestRebuild()`. Set `autoRebuild=false`
    for bulk edits.
  - Placement is deterministic per seed.
- **Invariant:** grass, shadows and the camera must sample *the rendered mesh* (or the same
  heightfield the mesh displaces from), never the analytic height. The gap was 0.41 m beside the road.
  - `sampleAt` interpolates the GPU's triangle: vertex `col+row*GRID`, z falls with row, split
    `(A,B,C)` if u≥v, else `(D,A,C)`.
  - With non-uniform columns, use the real column width, keep UVs world-linear in X, and use
    `Uint32Array` indices.
- Shadow decals tilt into the terrain tangent plane, and their alpha must reach 0 at `SHADOW_END`.
- `tools/terrain-bake/`:
  - `node genmap.js --seed 7` generates `map.svg`, with graded routed roads.
  - `node --max-old-space-size=4096 run.js` bakes the heightfield and splat, and `render.js` draws figures.
  - `lod.js` and `stream.js` do camera LOD with crack snapping and hysteresis.
  - `terrain-baked.js` feeds one field to both grass and mesh.
  - Known gap: its `ShaderMaterial` doesn't receive cascaded shadows.

## Conversation maintenance (local Codex / VS Code only)

Hooks in `.claude/settings.json` and `.codex/hooks.json` run `scripts/conversation-maintenance.py`
to queue `/compact` and `/clear` via keystrokes or the Codex app-server. They do nothing in cloud
sessions.

- When a task gets long, run `scripts/conversation-maintenance.py compact --reason "context is long"`.
- On a clear task pivot, tell the user it hit a task-pivot marker and run `clear "next task" --reason "task pivot" --summary "…" --criteria "…"`.
  This writes `.runtime/handoff-prompt.md`, which the SessionStart/UserPromptSubmit hooks inject once.
- Prerequisites: `codex` on PATH (or `CODEX_BIN`), plus macOS Accessibility permission for VS Code.
  Re-approve hook trust after editing either hook file.
- Use `--transport auto` and `--refresh-mode window`. `webview` froze Codex once.
