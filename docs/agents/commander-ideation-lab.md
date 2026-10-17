# GRASSTEX Commander Ideation Lab — GitHub Discussions V1

**Status:** experimental, review-only thought-wargame. Does not run the browser battle, move real actors, or validate actual game combat/locomotion. Do not call these outcomes benchmark passes.

## Concept

A single GitHub Discussion is the durable match transcript. One short GitHub Actions invocation produces one full simultaneous-orders round:

1. Read the thread and decrypt the last referee state.
2. Send **US** only public world state + US intel; separately send **GE** only public world state + GE intel.
3. Await both orders *before revealing either*.
4. Send the neutral **umpire** the prior complete state and both orders for bounded qualitative adjudication.
5. Publish one round comment with both orders, public adjudication, capability candidates and an encrypted next-state record.
6. Stop. An authorized human decides when the next round is played.

The US, German and umpire model calls have separate input contexts. This is safer than trying to keep two manually operated public Discussion participants from reading each other's orders before submission. There are **three isolated API calls**, not three self-running ChatGPT app windows. Separate ChatGPT chats have no unattended background Discussion polling.

## Setup after review

1. **Enable GitHub Discussions** for `APPARANYX/grasstex`, if disabled.
2. Configure repository Actions secrets:
   - `OPENAI_API_KEY` — API key with usage/quota available; never print it or place it in the Discussion.
   - `WARGAME_STATE_KEY` — unique randomly generated high-entropy secret (at least 24 characters). Keep stable across an existing match or its encrypted state becomes inaccessible.
3. Optionally set Actions repository variable `WARGAME_MODEL` (default `gpt-5-mini`). The model must support the Responses API JSON-object output format. Three billable API requests are made per completed round.
4. After this workflow is reviewed and available on the repository **default branch**, create a new Discussion in a normal category with title beginning **`[WARGAME]`** and scenario body below.
5. Start using the Actions tab **Commander Ideation Lab → Run workflow** and provide that Discussion's number. Afterwards, an OWNER/MEMBER/COLLABORATOR may comment `!wargame next` to play the next round; `!wargame start` is an alias. Multiple comments are handled by workflow concurrency, not by a long-running polling job.
6. Read the posted decision trace; compare invented commands with the authoritative GRASSTEX commander implementation before labeling them native.

**Important:** `discussion_comment` workflows only trigger when the workflow file is already on the default branch. This draft branch does not activate the listener. Do **not** merge automatically. GitHub Actions permissions require `discussions: write`. An org/repo policy may further restrict the default token or available models. Keep model/API spending under review; the prototype has no autonomous next-turn loop.

## Discussion template

Title: `[WARGAME] Junction interception 001`

Body:

    Commander Ideation Lab / experimental thought game
    Turn limit: 8

    ## Scenario
    Fictional 5 km x 5 km battlefield. US and GE each control five infantry
    squads, with three distributed bases per faction, contested crossroads,
    secondary objectives, branching roads, and limited trucks.

    ## Victory conditions
    Control the central junction and at least one secondary objective by
    the turn limit, or achieve an uncontested decisive advantage.

    ## Turn model
    Each turn represents 10 abstract minutes. Roads, preparation, concealment,
    intelligence age, uncertainty, and travel times must matter. The umpire
    may estimate outcomes but must label them hypothetical.

    ## Available actions (declare only features implemented in the selected branch)
    Assign or redirect a squad mission; hold or defend an objective;
    request a bounded reconnaissance event if allowed by scenario;
    use already available trucks under actual availability constraints.

    ## Explicit missing-action policy
    Commanders may propose additional hypothetical orders. The referee
    can assess these as ideas only, with realistic costs and limitations.
    Record gaps for real simulation implementation and subsequent testing.

    ## Context
    Do not assume PR #527 is merged. Do not assume draft PR #545/#548 or
    associated strategic features exist on main. The scenario can describe
    hypothetical capabilities, but must distinguish these from shipped ones.

The example action list is **illustrative**, not a verified runtime capability inventory. For a meaningful A/B, snapshot actions from the target commit/ref and keep the scenario identical across arms.

## Guardrails and limitations

- The Discussion is a **public transcript** in a public repository. Both completed orders appear together after simultaneous commitment. Referee-private and faction-specific state are AES-256-GCM encrypted before being posted as an HTML comment marker, using the repository secret.
- Do not put private information or actual credentials in the scenario body, replies or model prompts.
- State is reconstructed from encrypted comments; the action does not maintain an always-on process. Preserve the secret to resume. The `[WARGAME]` title prefix is required. The workflow ignores ordinary comments and unauthorized `!wargame` commands.
- This is a **heuristic evaluator**, not deterministic combat adjudication. No three-party vote makes a fabricated tactical consequence empirically true. To evaluate learning, compare repeated paired scenarios, rotate US/GE models and seeds, log capability proposals, then test promising actions in the shipping simulation.
- Model output is not allowed to execute code, change repository files, issue gameplay commands, spend arbitrary external resources or merge PRs. Only a Discussion comment is posted.
- Workflow dispatch is privileged by GitHub repository access. Manual dispatch advances one round; Discussion command events are additionally gated by the author's association.
- Each command uses up to three API calls and may incur cost. Model failures stop the run without publishing a new turn; retrying before a comment was posted may generate a different hypothetical outcome. The encrypted comment is the canonical checkpoint once published.
- Current prototype does not supply a built-in *actual runtime* action manifest. Until that is added, the scenario author is responsible for declaring the existing command vocabulary. The models classify unsupported actions as proposals but can misclassify; audit the output.

## Acceptance before merge

- `node --test scripts/check-ideation-wargame.cjs` passes on Node 22.
- Review the GitHub Discussions event/permissions policy and cost controls.
- Add both secrets, then explicitly authorize activation on main if desired.
- Smoke-test a single three-call round on a fresh `[WARGAME]` Discussion.
- Verify neither US nor GE request contained the other's confidential faction intel, and a rerun/next trigger resumes the posted checkpoint.
- Benchmark the **resulting ideas** against the real simulation; never replace runtime benchmarks with umpire narrative.
