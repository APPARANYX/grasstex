# Causal inaction benchmark: firing and movement

Scope: observe the shipping headless browser battle through the existing scripts/run_probe.cjs harness. The probe never issues orders, moves units, settles command reception, recomputes sight lines or draws game RNG.

## Run on a work branch

Start the ordinary local battle server with PHP_CLI_SERVER_WORKERS=4 (see docs/agents/targeted-fire-benchmark.md), then run:

    CAUSAL_SEEDS=20 CAUSAL_CONTROL=1 node scripts/run_causal_inaction_benchmark.cjs

Or use Actions > ⭐ Causal Inaction Benchmark on a branch containing the workflow. PR checks use one paired seed per scenario; manual dispatch defaults to 20 paired seeds per scenario. Scenarios: meeting, us-defend, ge-defend.

To replay an exact known incident seed without renaming it:

    CAUSAL_BATTLES=us-defend:hill-0002 CAUSAL_CONTROL=1 node scripts/run_causal_inaction_benchmark.cjs

CAUSAL_BATTLES accepts comma-separated type:seed pairs, overrides generated seed names and validates duplicates. In workflow_dispatch, exact_seed runs the named seed once in each scenario.

Filters: CAUSAL_TYPES, CAUSAL_BATTLES, CAUSAL_SEEDS, CAUSAL_SECONDS, CAUSAL_SIDE (all/us/ge), CAUSAL_ROLE (CSV or all), CAUSAL_IDS, CAUSAL_SQUADS, CAUSAL_PREFIX, CAUSAL_URL, CAUSAL_OUT, CAUSAL_CONTROL (default 1). Corresponding browser selectors: probeSide, probeRole, probeIds, probeSquads.

Files in reports/causal-inaction/: raw.json (per-battle original evidence), summary.json (all reported episodes by seed), summary.md (human-readable aggregate).

## Contract and interpretation

- Fire: five consecutive simulated seconds with a personally assigned living target and no actual onFire rounds produces a single episode. Direct Engagement fireAllowed / tryFire rejection branches optionally report exact denial reasons. Real trigger-path LOS, crest and suppressive-terrain rejection counters supply independent shot-attempt evidence. A shot resets the silence clock.
- Movement: a stable order/destination at least 8 m away, under 1.5 m net movement in 12 seconds and a speed under 0.35 m/s produces an episode.
- Cover: the shipping Engagement cover planner reports each real candidate-selection invocation as `normal-cover:selected`, `normal-cover:no-viable-cover`, `normal-cover:incumbent-preferred` or `normal-cover:reservation-failed`. Rejection counters record the actual gates taken: forward-guard, unreachable-memory, leader-anchor-limit, target-too-close, behind-order-line, lower-ranked-slot, no-standing-los, and path-unreachable. A planner invocation may reject multiple different slots; these are not mutually exclusive. The read-only cover observer never recomputes LOS or navigation itself.
- Firing-lane: when a candidate branch supports an end-of-hedge flank search it may also report `firing-lane` selections/rejections through the same read-only hook. The probe separately observes real soldier arrival within 0.6 m of the selected position and subsequent onFire callbacks; this is *not* proof that a fired round hit the old target. A rejected slot is an authoritative decision, but alone does not establish why the entire inaction episode occurred.
 BattleExecutionOutcome.man is the read-only authority for current order adoption, resolver hold, movement execution block, and handoff. Order changes or actual travel reset the clock.
- Verified: an authoritative record (actual Engagement rejection, trigger-path reject, resolver arbitration, Command Reception outcome or Movement Execution blocker) was observed. It proves the named event, not the entire absence of action.
- Likely: a restrictive firing order or stress state was observed but not a corresponding direct denial event. Correlation only.
- Unknown: no sufficient authoritative reason. Do not invent root causes.
- Distinguish a justified hold from a defect. A soldier guarding a prepared post or retreating may correctly decline to obey a formation movement request.

Each episode records actor and squad, interval, reason code, confidence, causal scope, order and resolver evidence, and up to 10 recent one-second samples. At most 160 episodes per battle, 160 recent direct-denial events per actor, 320 cover-decision details per battle, and 12 recent cover decisions per actor are retained; omitted counts are surfaced. Aggregate planner-gate counts remain complete when decision details are truncated.

Every seed is also replayed without the probe by default. A divergent fingerprint, runtime error, missing payload or missing seed invalidates the run. Read-only is a required functional property, not an assumption.

## Boundaries

This first slice traces Engagement fire refusal sites, trigger-path rejection and order/movement execution evidence. It does not instrument every weapon/ammunition branch, suppressive-area fire decision, all movement pathfinder branches, or commander tactical choice. It now records **actual normal-cover selection/rejection gates**; an opt-in hedgerow branch can extend that coverage to firing-lane decisions. A verified refusal does not demonstrate that no other reason was active.

Use Standard Battle Benchmark and the M3C Matrix for aggregate battle outcomes. The Targeted MG42 Fire Benchmark remains useful for per-unit post-step gate samples. This focused forensic tool complements, not replaces, either.
