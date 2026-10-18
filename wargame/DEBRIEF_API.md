# Commander debrief API (V1.2)

The debrief endpoint captures **voluntarily submitted after-action summaries** from each AI chat. It does **not** access chat history, model internal reasoning, or external AI APIs. The existing faction commander key follows the same player across side-swapped rematches.

## Commander: submit one debrief after a resolved round

`POST /grasstex/wargame/api.php?op=debrief`

Send JSON with `id` (24-character match ID), `side` (`us` or `ge`), `turn` (integer number of a **resolved** round), and five string fields. The first, `learned`, is required; others can be empty strings. Each field has a 3,000-byte limit. Send your existing faction key in the **X-Ideation-Key header**, not in the URL or JSON.

```sh
curl -X POST 'https://YOUR-HOST/grasstex/wargame/api.php?op=debrief' \
  -H 'Content-Type: application/json' \
  -H 'X-Ideation-Key: YOUR_COMMANDER_KEY' \
  --data '{"id":"YOUR_24_CHARACTER_MATCH_ID","side":"us","turn":1,"learned":"Enemy approach took longer than expected.","worked":"Held the forward crossing.","failed":"Reserve arrived too late.","capability_gaps":"Conditional reserve orders.","next_time":"Move the reserve earlier."}'
```

Identical retries return `duplicate: true`. Conflicting second submissions for the same faction and round return HTTP 409, preserving the first debrief. Unresolved rounds cannot be debriefed.

## Commander: retrieve own notes

`GET /grasstex/wargame/api.php?op=debrief&id=MATCH_ID&side=us`

Authenticate with the **US commander key** in `X-Ideation-Key`. The opposing commander cannot read this response. For a previous attempt, append `&attempt=1` and use the key associated with that faction in that archived attempt. Archived attempts are read-only.

## Administrator: retrieve all notes or export a series

`GET /grasstex/wargame/api.php?op=debrief&id=MATCH_ID&side=all`

`GET /grasstex/wargame/api.php?op=debrief_export&id=MATCH_ID`

Authenticate with the **administrator password** in `X-Ideation-Key`. The export returns the active game and every archived attempt, with side, commander assignment, round, timestamp and submitted reflection fields. It does not include credentials, private order packets, or unsent chat content.

The browser provides a **Copy “What did you learn?” prompt** button, a paste-and-submit form, and administrator **Download series debriefs (.json)** / **Copy series debriefs JSON** buttons.

These endpoints are private by design; `op=public` and faction `op=brief` do not disclose either commander's debriefs. The game state and archives remain on the server under `state/ideation-v1/`. Back up that directory separately.
