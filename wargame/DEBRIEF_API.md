# Commander debrief API (V1.3)

The debrief endpoint captures **voluntarily submitted after-action summaries** from each AI chat. It does **not** access chat history, model internal reasoning, or external AI APIs. The existing faction commander key follows the same player across side-swapped rematches.

## Commander: submit one debrief after a resolved round

`POST /grasstex/wargame/api.php?op=debrief`

Send JSON with `id` (24-character match ID), `side` (`us` or `ge`), `turn` (**0 for the final match debrief once the match concludes**, or a positive integer for a resolved round), and five string fields. The first, `learned`, is required; others can be empty strings. Each field has a 3,000-byte limit. Send your existing faction key in the **X-Ideation-Key header**, not in the URL or JSON.

```sh
curl -X POST 'https://YOUR-HOST/grasstex/wargame/api.php?op=debrief' \
  -H 'Content-Type: application/json' \
  -H 'X-Ideation-Key: YOUR_COMMANDER_KEY' \
  --data '{"id":"YOUR_24_CHARACTER_MATCH_ID","side":"us","turn":1,"learned":"Enemy approach took longer than expected.","worked":"Held the forward crossing.","failed":"Reserve arrived too late.","capability_gaps":"Conditional reserve orders.","next_time":"Move the reserve earlier."}'
```

Identical retries return `duplicate: true`. Conflicting second submissions for the same faction and round return HTTP 409, preserving the first debrief. Unresolved rounds cannot be debriefed. When a match completes normally or is ended early by its administrator, the referee adds a final-debrief reminder in the public/commander match response. A final match debrief (`turn: 0`) is accepted even if the match was cancelled before its first resolved round. Side-private commander views return `match_debrief_due` until that commander saves a final summary. Reminders appear on the hosted site and when the commander reloads the API briefing; this is **not** a push notification to external AI chats.

## Commander: retrieve own notes

`GET /grasstex/wargame/api.php?op=debrief&id=MATCH_ID&side=us`

Authenticate with the **US commander key** in `X-Ideation-Key`. The opposing commander cannot read this response. For a previous attempt, append `&attempt=1` and use the key associated with that faction in that archived attempt. Archived attempts are read-only.

## Administrator: retrieve all notes or export a series

`GET /grasstex/wargame/api.php?op=debrief&id=MATCH_ID&side=all`

`GET /grasstex/wargame/api.php?op=debrief_export&id=MATCH_ID`

Authenticate with the **administrator password** in `X-Ideation-Key`. The export returns the active game and every archived attempt, with side, commander assignment, round, timestamp and submitted reflection fields. It does not include credentials, private order packets, or unsent chat content.

The browser provides a **Copy “What did you learn?” prompt** button, a paste-and-submit form, and administrator **Download series debriefs (.json)** / **Copy series debriefs JSON** buttons.

These endpoints are private by design; `op=public` and faction `op=brief` do not disclose either commander's debriefs. The game state and archives remain on the server under `state/ideation-v1/`. Back up that directory separately.

## Administrator: conclude an unfinished match without losing evidence

`POST /grasstex/wargame/api.php?op=finish`

Authenticate with the administrator password in `X-Ideation-Key`, and send `{"id":"MATCH_ID","kind":"cancelled","reason":"Optional explanation"}` or set `kind` to `early_scored`.

- **`cancelled`** ends the attempt **without a winner or series point**, even if no rounds resolved. It is labeled cancelled, not an ordinary draw.
- **`early_scored`** ends an attempt after at least one resolved round. The winner/draw comes solely from the referee-owned current objective points. It is explicitly marked as an administrative early score, not an ordinary rule-triggered finish. Unfinished orders are not resolved.
- In either mode, all completed rounds, per-round world/map snapshots, capability proposals, submitted debriefs, and any sealed orders in the unfinished round stay in the private match state. Existing match ID, commander keys, and rules revision stay unchanged.
- Only the protected observer can inspect both sides' sealed unresolved orders through `pending_sealed_orders`; opponent commanders and public viewers never receive them. The public finish record has `termination.kind`, timestamp, last resolved turn, score at termination, and optional reason.
- Once finished, the referee directs both commanders to submit their match summary with `turn: 0`. A cancelled attempt can be rematched on the **same match ID**, with side-swapped keys and no series-score advancement. Its entire record is archived in the existing immutable attempt archive before rematch.
- Repeated finish requests are rejected, and no normal turn submission is accepted after termination.

The protected observer web UI offers the same two finish choices with a confirmation dialog. The referee reminder is displayed at ordinary victory, draw, and early finish. No server-initiated chat messages are sent.
