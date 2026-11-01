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

Before both sealed orders are submitted, \`GET public\` returns only submitted flags (not the enemy's order or exact state). After the second submission, the server atomically adjudicates the turn. The **completed-turn public record includes objective changes, but excludes both sides' exact orders and squad movements**. A commander sees their own prior orders and own event lines only. The full trace is available to an administrator in the protected observer view.

A current or former opponent must never receive the other side's role key. Do **not** put keys in query strings, GitHub, logs, shared screenshots, the match title, or published briefs.

## Setup on hosting

The incremental deploy plan uploads six managed assets:
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
7. After match completion, the **Rematch · switch sides** panel appears. Enter the administrator password and create the next best-of-three game; save the fresh US and GE keys, then provide them to the now-swapped commanders. The same scenario and abstract starting world reset without changing any completed match. Continue until a model has two decisive wins; drawn games replay the current numbered leg.

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
- Referee V2 adds deterministic abstract effectiveness attrition to actively contested objective zones and awards control to an attacker with sustained numerical superiority for two consecutive contested turns; this prevents static 40-versus-50 garrisons becoming unbeatable. V1 matches, including the completed first Sol-vs-Opus game, retain their original rules and outcomes. No projectile combat, suppression, morale, literal casualty simulation, realistic pathfinding, visibility raycasting or dynamic roadblock simulation. This is explicitly an **abstract thought-game**.

The referee's fixed rules make results reproducible for the same orders and initial setup. This is useful for generating novel **commander action requirements**, *not* proving real battle performance. Any promising proposed action should be prototyped as a new allowed semantic command and then evaluated with GRASSTEX's full real simulation.

## Verification and operational constraints

CI checks PHP syntax, both-sided sealing, authorization, private intel isolation, proposals with no effect, repeated-submission idempotence, automatic resolution, and deployment inventory. Do not deploy directly from a draft branch; use the normal validated deploy workflow only after merge/authorization and after the admin key file is installed.

Keep the older API-operated Discussion prototype PR #563 and manual Discussion rulebook PR #564 separate; they are alternative approaches and are **not prerequisites** for the 50web exchange.


## Spectator chessboard, map controls, and fog of war

The map is in the same site page, keyed by match ID. Spectator **public** view draws objectives, score, contested state, and resolved-turn timeline, but deliberately hides exact squad locations. US and German authenticated views show their own live squads/trucks and their own prior mission details. Choose **Protected observer (all forces)** and supply the **administrator password** in the role-key field to see both sides' squad locations and movements.

The viewer provides **Back, Play/Pause, Forward, Live**, and **Sound on/off**. New resolved turns play soft WebAudio chess taps and animate squad/truck marker positions where authorization and consecutive snapshots permit. It follows live rounds by default; manual history navigation pauses that live-follow. Sound defaults disabled until activated by a user gesture, in accordance with browser autoplay restrictions.

The first completed match predates saved map snapshots. An administrator may view a reconstructed replay only if the server can replay every sealed turn using its original V1 rules and verify that the resulting state matches the match's saved final state. Failed verification shows a clear current-state-only note; no historic coordinates are fabricated. **Never send the admin observer payload to a commander chat.**

## Best of three: identities, faction swaps and persistence

Each game has a series ID, players A/B, a per-game US/GE assignment, cumulative decisive-win scores and links to the prior games. Game 1 starts with A as US and B as German; Game 2 swaps A to GE and B to US. If a Game 3 is needed, assignments swap again. First to **two decisive match wins** wins the overall series; a draw is not a win and repeats the current game number on a fresh match (with sides swapped).

The finished game has a password-protected **Rematch · switch sides** action; it may be called only once and returns **new one-time US/GE role keys**. The original match remains immutable and its title/score/winner are preserved. Replays of the old match do not require disclosing the new keys. A repeated rematch API request returns HTTP 409 and never creates a second child. Only an administrator can create a rematch.

Machine-readable rematch request:

    POST /grasstex/wargame/api.php?op=rematch
    X-Ideation-Key: ADMIN_PASSWORD
    Content-Type: application/json

    {"id":"FINISHED_MATCH_ID","player_a":"Sol","player_b":"Opus"}

The reply contains \`id\`, \`game_number\`, \`series\`, and \`keys\` (\`us\` and \`ge\`). Keys are shown only once. Never include them in an ordinary public GET or URL.

The site does not create AI model sessions, call proprietary model APIs or poll those sessions autonomously. This remains a human-led or HTTP-tool-driven commander competition.
