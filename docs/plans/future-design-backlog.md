# Future Design Backlog

> Status: brainstorming / post-#299 parking lot. Items here are not commitments and must not expand active #299 scope without being promoted into a scoped implementation plan or PR.

## Design north star

Grasstex should feel like a procedurally generated WWII battle against an opposing command system rather than bots selecting canned scripts. Information should remain grounded in what soldiers and commanders could plausibly know.

**Information rule:** if the player knows something, the game should be able to explain how the player's soldier learned it: direct observation, squad report, radio/command report, reconnaissance, or another legitimate source.

## Immediate sequencing

1. Finish and stabilize #299 tactical planning.
2. Complete tactical-map and presentation work that exposes existing state without changing tactical authority.
3. Formation-completeness pass for specialist capabilities.
4. Playable commander and pre-battle planning.
5. Logistics/economy and reconnaissance layers.
6. Revisit Genome and learned tactical reasoning only after the deterministic tactical baseline is stable.

## Tactical map and battlefield presentation

- Battle momentum / tug-of-war meter derived from underlying battle state; presentation must not drive AI decisions.
- 360-degree HUD compass and consistent map bearings.
- Structured contact reports with threat type, bearing/direction, estimated range, location/landmark, age, and confidence.
- Prefer audible soldier callouts over supernatural 3D enemy pings.
- Immediate local reports may use clock direction; deliberate reports should favor absolute bearings.
- Reported contacts should create uncertain/fuzzy map intelligence, not perfect enemy coordinates.
- Contact precision/confidence should improve as observations corroborate.
- Tactical map should share the same information model used by AI TacticalSituation and player-facing reports.

## Minimal HUD philosophy

Avoid exposing omniscient engine state simply because it exists.

Candidate default HUD information:
- current weapon / weapon state
- stance
- immediate medical state such as bleeding
- contextual interactions
- compass/bearing information where appropriate
- squad information the soldier could plausibly know

Long-term candidates for removal/replacement:
- conventional health bar
- exact arcade-style ammunition counter

Prefer physical/audio/inventory cues for ammunition and wounds where practical.

## Formation completeness and specialist units

Treat specialists as tactical capabilities understood by the planner, not merely NPC classes.

- Medics: casualty response, treatment priorities, casualty collection behavior.
- Snipers: observation, overwatch, interdiction, priority-target tasks.
- Engineers: explicit engineering objectives/tasks rather than opportunistic generic behavior.
- Extend planning vocabulary and TacticalSituation only when the capability has a clear command/execution contract.

## Playable commander / HQ layer

- Persistent physical commander entity.
- Historically grounded HQ detachment/security rather than an arcade elite bodyguard.
- Player can assume commander authority through the same planning primitives used by AI command.
- Clean AI -> player -> AI authority handoff without immediate countermanding.
- Commander may still enter/possess frontline soldiers after issuing plans.
- Physical command post creates meaningful location/risk and possible enemy command disruption.

## Pre-battle planning phase

- Generated battlefield briefing and legitimate initial intelligence.
- Choose command-post/start location.
- Review objectives and known/suspected enemy information.
- Allocate squads and designate main/supporting efforts, axes, roles, reserves, etc.
- Potential limited pre-battle reconnaissance spending.
- Transition: planning -> briefing -> deployment -> execution -> reports/contact -> replanning -> outcome.
- Future AI voice briefing should render the actual structured plan rather than inventing a separate narrative plan.

## Logistics, reconnaissance, and battle economy

Start at engagement logistics before attempting a broad strategic production economy.

Potential constrained resources:
- ammunition/resupply
- artillery shell/allocation pool
- fuel
- aerial reconnaissance sorties
- reinforcements/replacements
- transport and supply vehicles
- depots/supply points

Resources should constrain real tactical choices rather than exist as abstract currencies. Losing or capturing logistics assets may affect battlefield capability.

## Doctrine and Genome revival

#299 establishes tactical competence; Genome should later create bounded variation.

- Doctrine provides broad tendencies/constraints.
- Genome biases valid decision weights rather than directly overriding behavior.
- Candidate traits: aggression, casualty tolerance, reserve commitment, maneuver preference, defensive depth, reconnaissance emphasis, disengagement willingness.
- Tactical legality and situational awareness remain authoritative.
- Do not reintroduce Genome until the deterministic planner is stable enough to distinguish intentional variation from bugs.

## Bespoke tactical reasoning model — long-term research

Potential future experiment: a compact specialized learned model at commander reasoning/planning level, not an LLM controlling soldiers.

Conceptual interface:

`TacticalSituation + memory + doctrine/Genome -> structured tactical intent`

The deterministic tactical stack remains authoritative for legality and execution.

Research principles:
- tightly structured inputs and outputs
- wake at meaningful decision/replan events, not every simulation tick
- preserve fog of war and human-scale command latency outside the model
- validate/repair proposed plans through #299 primitives
- begin with compact pretrained/fine-tuned/distilled models rather than training a general model from scratch
- preserve #299 decision traces, situations, plans, and outcomes as possible future training/evaluation data
- investigate whether a sub-1B to low-single-digit-billion-parameter specialized model is sufficient; do not commit to a size before evaluation

## Difficulty philosophy

Do not make competent AI fun by making it artificially stupid or psychic.

Difficulty should primarily tune bounded human limitations:
- information quality and propagation delay
- recognition/reaction latency
- uncertainty/confidence thresholds
- planning sophistication
- memory quality/decay
- reserve efficiency and coordination

Even high difficulty should operate from legitimate battlefield information and human-scale command tempo.

## Promotion rule

When an item becomes actionable, move its detailed design into a dedicated `docs/plans/` document and scope it to its own PR/issue. This backlog remains the cross-cutting parking lot and roadmap, not an implementation specification.
