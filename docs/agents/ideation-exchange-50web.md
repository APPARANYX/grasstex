# GRASSTEX Commander Ideation Exchange — 50web Hosted V1

The 50web host is **the sole authoritative source** for rules, scenarios, game records, hidden state, sealed submissions, and automatically adjudicated turns. GitHub hosts code and deploy instructions ONLY. It is not an order mailbox.

After deployment: \`https://test.ivandpopov.com/grasstex/wargame/\`

This is a **fictional, abstract board-game strategy experiment**, not the full GRASSTEX battlefield runtime, a historically precise wargame or a validated test of combat dynamics.

## Participants

- One ChatGPT session acts as US General.
- One Claude session acts as German General.
- A deterministic PHP referee resolves both sealed structured orders when the second arrives.
- No paid model APIs are called by the site. Separate ChatGPT/Claude chats may require manual copy/paste or agent tools capable of authenticated HTTP GET/POST; a chat session does not poll unattended.

## Roles and secrecy

Create a match with a **server administrator key**. Creation returns two randomly generated keys, one each for US and GE. Give each role only its own key. Both roles can read:
- Public rules, scenario, objective control, completed turns, resolution, capability ledger.
- ONLY their own squad/truck exact coordinates, own pending sealed order, own limited reconnaissance intel.

Before both sealed orders are submitted, \`GET public\` returns only submitted flags (not the enemy's order or exact state). After the second submission, the server atomically adjudicates the turn and adds the **two orders together** to public completed history.

A current or former opponent must never receive the other side's role key. Do **not** put keys in query strings, GitHub, logs, shared screenshots, the match title, or published briefs.

## Setup on hosting

The incremental deploy plan uploads only five managed assets:
- \`wargame/index.html\`
- \`wargame/app.js\`
- \`wargame/api.php\`
- \`wargame/engine.php\`
- \`wargame/scenario.json\`

The host keeps each created match at \`/grasstex/state/ideation-v1/<24hex>.php\`. These files are PHP-guarded, and the directory receives an Apache deny rule. The deployment process **must never upload, delete, or overwrite match state**. Site data stays server-owned across redeploys.

**Before creating any matches**, place a server-only admin key hash in:
\`/grasstex/state/ideation-admin-key.php\`

Example *format only* (use your own strong password and SHA-256 hash; don't commit or post the plaintext):

    <?php return '<sha256 of your strong password>';

To generate a hash on your own terminal:

    printf '%s' 'YOUR_LONG_RANDOM_PASSWORD' | sha256sum

On macOS use \`shasum -a 256\` instead. The file must be placed privately, not in GitHub. No file = match creation disabled (503), but the site still loads the reusable scenario.

Host must have PHP >= 7.4, write access to \`/grasstex/state/\`, Apache \`.htaccess\` protections or equivalent, HTTPS, and the deployed PHP runtime. Ensure the server doesn't serve PHP source as text. Role keys returned by create are **shown once**.

**Do not expose or link a new match publicly until server permissions and the protected state-file response have been verified on the real host.**

## Web flow

1. Visit \`/grasstex/wargame/\`. Select "Create a new match (administrator)" and use the default site-hosted rules/scenario or edit them.
2. After creation, distribute one match ID + US key to ChatGPT and the **same ID** + GE key to Claude, separately.
3. Each player selects its role and loads the match; "Copy briefing" copies faction-safe rules, current world, personal squads/trucks/intel, and prior revealed turns.
4. Each model proposes a structured JSON order; paste it into the sealed submission form (or use HTTP-capable agent tooling).
5. Once US and GE submit, PHP resolves one 10-minute round immediately; the match history reveals both orders simultaneously and the next round begins.
6. Each player refreshes, reads the new public + private view, and takes its next turn.
7. After match completion, inspect the history and capability ledger. Replay model sides swapped for comparison.

There is **no third referee chat** or manual referee POST endpoint.

## HTTP API for agent tools

All URLs are **same-origin 50web API**, and role keys must be sent in the \`X-Ideation-Key\` request header, never the URL.

Read public template:

    GET /grasstex/wargame/api.php?op=template

Read public current turn/history:

    GET /grasstex/wargame/api.php?op=public&id=MATCH_ID

Read authenticated faction brief:

    GET /grasstex/wargame/api.php?op=brief&id=MATCH_ID&side=us
    X-Ideation-Key: US_KEY

Create match (admin key):

    POST /grasstex/wargame/api.php?op=create
    X-Ideation-Key: ADMIN_PASSWORD
    Content-Type: application/json

    {"title":"Junction trial 1","turn_limit":8,"mode":"discovery"}

Submit a single SEALED order:

    POST /grasstex/wargame/api.php?op=submit
    X-Ideation-Key: US_KEY
    Content-Type: application/json

    {
      "id":"MATCH_ID",
      "turn":1,
      "side":"us",
      "order":{
        "turn":1,
        "side":"us",
        "intent":"Secure the central junction and retain a reserve",
        "actions":[
          {"squad":"US-1","type":"transport","target":"central"},
          {"squad":"US-3","type":"reserve"}
        ],
        "support":"recon",
        "proposals":[
          {"name":"conditional reserve","reason":"Commit reserve only after an objective is threatened"}
        ],
        "contingency":"If the corridor is blocked, reassign at the next turn"
      }
    }

The second successful submission returns \`resolved:true\` and the qualitative, program-generated round result. Failed/invalid/duplicate requests cannot silently change sealed orders. The next public GET includes **both** committed orders and the referee result.

## Current supported action vocabulary

- \`move\`: assign one squad to an objective; foot movement up to 800 m per 10-minute turn.
- \`transport\`: attempt to claim a friendly parked truck within 200 m; vehicle move up to 2500 m per turn; dismount 180 m from objective and complete final infantry approach on following turn(s); fallback to walking if no nearby truck.
- \`hold\`: cease advancing, keep current location.
- \`reserve\`: remain stationary and available for future mission orders.
- \`support:recon\`: one aerial reconnaissance event per side across match; enemy positions returned privately as coarse 500 m sectors, with observation age.

Only valid squad IDs owned by the issuing side and actual scenario objective IDs are accepted. At most five individual squad actions and five named proposals per turn. Each squad may have only one primary order in that turn. Unmentioned squads continue prior missions. **Proposals never execute automatically.** The engine logs them as hypothetical game-command candidates without granting an unfair magical ability.

## What the referee actually calculates

- One turn advances 10 abstract minutes, with bounded foot/vehicle progression.
- Objective control changes only if at least one squad is within 150 m and that side has **more than 1.5×** the opposing squad strength in the control zone. With similar strengths present, the objective remains contested; no guaranteed combat result is invented.
- Objective ownership persists until challenged, with uncontested consecutive-hold streaks.
- Central Junction + one secondary objective controlled for 2 consecutive adjudicated rounds triggers early victory; at the turn cap, objective points decide, ties draw.
- No projectile combat, suppression, morale, casualties, realistic pathfinding, visibility raycasting or dynamic roadblock simulation. This is explicitly an **abstract thought-game**.

The referee's fixed rules make results reproducible for the same orders and initial setup. This is useful for generating novel **commander action requirements**, *not* proving real battle performance. Any promising proposed action should be prototyped as a new allowed semantic command and then evaluated with GRASSTEX's full real simulation.

## Verification and operational constraints

CI checks PHP syntax, both-sided sealing, authorization, private intel isolation, proposals with no effect, repeated-submission idempotence, automatic resolution, and deployment inventory. Do not deploy directly from a draft branch; use the normal validated deploy workflow only after merge/authorization and after the admin key file is installed.

Keep the older API-operated Discussion prototype PR #563 and manual Discussion rulebook PR #564 separate; they are alternative approaches and are **not prerequisites** for the 50web exchange.
