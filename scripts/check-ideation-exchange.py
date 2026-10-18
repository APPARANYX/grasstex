#!/usr/bin/env python3
"""End-to-end contract test for the 50web PHP sealed-order exchange."""
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
PORT = None
for _ in range(20):
    s = socket.socket()
    try:
        s.bind(("127.0.0.1", 0))
        PORT = s.getsockname()[1]
        break
    finally:
        s.close()
assert PORT is not None
URL = f"http://127.0.0.1:{PORT}/wargame/api.php"
STATE = ROOT / "state"
STATE.mkdir(exist_ok=True)
ADMIN = STATE / "ideation-admin-key.php"
assert not ADMIN.exists(), "Do not overwrite a real administrator credential"
PASSWORD = "example-test-admin-secret-not-for-production"
ADMIN.write_text("<?php return '" + hashlib.sha256(PASSWORD.encode()).hexdigest() + "';\n", encoding="utf8")
server = None
match_id = None
match_ids = []


def call(op, method="GET", data=None, key=None, query=""):
    u = f"{URL}?op={op}{query}"
    headers = {"Accept": "application/json"}
    if key is not None:
        headers["X-Ideation-Key"] = key
    if method == "POST":
        headers["Content-Type"] = "application/json"
        headers["Origin"] = f"http://127.0.0.1:{PORT}"
    payload = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(u, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status, json.loads(response.read())
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read())
        except ValueError:
            body = {}
        return e.code, body


try:
    server = subprocess.Popen(["php", "-S", f"127.0.0.1:{PORT}", "-t", str(ROOT)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, cwd=ROOT)
    for _ in range(50):
        try:
            code, template = call("template")
            if code == 200:
                break
        except (OSError, TimeoutError):
            pass
        time.sleep(0.1)
    assert code == 200 and template["ok"] and template["template"]["config"], template
    code, version = call("version")
    assert code == 200 and version["api_version"] == "0.9.0", version
    # Preserve the original three-objective smoke fixture; the default
    # template below separately exercises the new nine-objective V6 board.
    legacy_config = {"objectives": [
        {"id": "central", "x": 2500, "z": 2500, "points": 3},
        {"id": "north", "x": 2500, "z": 3750, "points": 1},
        {"id": "south", "x": 2500, "z": 1250, "points": 1},
    ]}
    code, layout_game = call("create", "POST",
        {"title": "Five-line V6 board", "turn_limit": 2}, PASSWORD)
    assert code == 201, layout_game
    match_ids.append(layout_game["id"])
    code, layout = call("public", query=f"&id={layout_game['id']}")
    assert code == 200 and layout["rules_revision"] == 6
    assert layout["effective_rules"]["five_line_layout"] is True
    assert layout["effective_rules"]["majority_victory"] is True
    assert len(layout["objective_candidates"]) == 15
    assert sum(not p["active"] for p in layout["objective_candidates"]) == 6
    board = layout["public_world"]["objectives"]
    assert len(board) == 9 and sum(o["owner"] == "us" for o in board) == 3
    assert sum(o["owner"] == "ge" for o in board) == 3
    assert sum(o["owner"] == "neutral" for o in board) == 3
    assert {o["id"] for o in board if o["owner"] == "neutral"} == {"line2", "line3", "line4"}
    assert sum(o["points"] for o in board) == 9
    assert {o["id"] for o in board if o["owner"] == "us"} == {"us-left", "us-center", "us-right"}
    assert {o["id"] for o in board if o["owner"] == "ge"} == {"ge-left", "ge-center", "ge-right"}
    bad_inactive = {"turn": 1, "side": "us", "intent": "Try inactive candidate",
        "actions": [{"squad": "US-1", "type": "move", "target": "line2-left"}]}
    code, rejected = call("submit", "POST",
        {"id": layout_game["id"], "turn": 1, "side": "us", "order": bad_inactive},
        layout_game["keys"]["us"])
    assert code == 400 and "Unknown target objective" in rejected["error"], rejected
    code, new = call("create", "POST",
        {"title": "Automated contract smoke", "turn_limit": 3, "config": legacy_config}, PASSWORD)
    assert code == 201 and new["ok"], new
    match_id = new["id"]
    match_ids.append(match_id)
    assert len(new["keys"]) == 2
    us_key, ge_key = new["keys"]["us"], new["keys"]["ge"]
    code, public = call("public", query=f"&id={match_id}")
    assert code == 200 and public["phase"] == "orders" and public["turn"] == 1
    assert public["api_version"] == "0.9.0"
    assert public["rules_revision"] == 6
    assert public["effective_rules"]["neutral_contested_siege"] is True
    assert public["effective_rules"]["contested_attrition"] is True
    assert public["current_orders"] is None and "key_hashes" not in public
    assert "units" not in public and "intel" not in public
    code, wrong = call("brief", key=ge_key, query=f"&id={match_id}&side=us")
    assert code == 401, wrong
    code, stale = call("brief", key=PASSWORD, query=f"&id={match_id}&side=admin")
    assert code == 426 and "Outdated spectator script" in stale["error"], stale
    code, us = call("brief", key=us_key, query=f"&id={match_id}&side=us")
    assert code == 200 and len(us["own_state"]["squads"]) == 5, us
    assert all(x["side"] == "us" for x in us["own_state"]["squads"].values())
    us_order = {"turn": 1, "side": "us", "intent": "Advance from south",
        "actions": [{"squad": "US-1", "type": "transport", "target": "south"}],
        "support": "recon",
        "activities": [{"squad": "US-1", "kind": "wire",
            "description": "Private US wire activity at its actual squad position"}],
        "proposals": [{"name": "Conditional reserve", "reason": "Need event-based orders"}]}
    code, submitted = call("submit", "POST",
        {"id": match_id, "turn": 1, "side": "us", "order": us_order}, us_key)
    assert code == 200 and submitted["accepted"] and not submitted["resolved"], submitted
    code, still_public = call("public", query=f"&id={match_id}")
    assert code == 200 and still_public["submitted"]["us"] and not still_public["submitted"]["ge"]
    assert still_public["current_orders"] is None and not still_public["history"]
    assert "Conditional reserve" not in json.dumps(still_public)
    code, repeat = call("submit", "POST",
        {"id": match_id, "turn": 1, "side": "us", "order": us_order}, us_key)
    assert code == 200 and repeat["duplicate"], repeat
    ge_order = {"turn": 1, "side": "ge", "intent": "Defend the east",
        "actions": [{"squad": "GE-1", "type": "reserve"}],
        "support": "none",
        "activities": [{"squad": "GE-1", "kind": "roadblock",
            "description": "SECRET GE east roadblock at actual squad position"}],
        "proposals": []}
    code, resolved = call("submit", "POST",
        {"id": match_id, "turn": 1, "side": "ge", "order": ge_order}, ge_key)
    assert code == 200 and resolved["resolved"] and resolved["turn"] == 2, resolved
    code, public = call("public", query=f"&id={match_id}")
    assert code == 200 and public["turn"] == 2 and len(public["history"]) == 1, public
    # No enemy order, capability or movement may be delivered to public or side-private views.
    assert "orders" not in public["history"][0], public["history"][0]
    assert not public["history"][0]["capabilities"]
    assert "US-1:" not in json.dumps(public["history"])
    assert "GE-1:" not in json.dumps(public["history"])
    assert "Conditional reserve" not in json.dumps(public["history"])
    assert "SECRET GE" not in json.dumps(public)
    assert "field_contacts" not in json.dumps(public)
    assert public["public_world"]["clock_minutes"] == 10
    code, intel = call("brief", key=us_key, query=f"&id={match_id}&side=us")
    assert code == 200 and intel["own_state"]["intel_reports"][0]["source"] == "limited_aerial"
    code, hidden = call("brief", key=ge_key, query=f"&id={match_id}&side=ge")
    assert code == 200 and not hidden["own_state"]["intel_reports"]
    us_contacts = intel["own_state"]["field_contacts"]
    ge_contacts = hidden["own_state"]["field_contacts"]
    assert len(us_contacts) == 2, us_contacts  # own wire + GE roadblock via recon
    assert len(ge_contacts) == 1, ge_contacts  # only own roadblock, US is too far
    assert us_contacts[0]["confidence"] == "confirmed_friendly"
    assert us_contacts[0]["stats"]["effect"] == "foot_slow"
    assert us_contacts[0]["stats"]["speed_multiplier"] == 0.5
    assert us_contacts[0]["stats"]["blocks_fire"] is False
    assert us_contacts[0]["effects_enabled"] is True
    assert us_contacts[0]["active"] is False  # builds on creation turn
    assert ge_contacts[0]["stats"]["effect"] == "vehicle_slow"
    assert any(c["source"] == "aerial" and c["kind"] == "roadblock" for c in us_contacts)
    assert "SECRET GE" not in json.dumps(intel)
    assert "Private US wire" not in json.dumps(hidden)
    assert len(intel["history"][0]["field_contacts"]) == 2
    assert len(hidden["history"][0]["field_contacts"]) == 1
    assert "own_order" in intel["history"][0]
    assert "own_order" in hidden["history"][0]
    assert "GE-1:" not in json.dumps(intel["history"][0])
    assert "US-1:" not in json.dumps(hidden["history"][0])
    assert "transport" not in json.dumps(hidden["history"][0])
    # The operator-only view has full orders and private snapshots.
    code, forbidden = call("observer", key=ge_key, query=f"&id={match_id}")
    assert code == 401, forbidden
    code, observer = call("observer", key=PASSWORD, query=f"&id={match_id}")
    assert code == 200 and observer["observer_world"]["units"], observer
    assert "orders" in observer["history"][0]
    assert observer["history"][0]["world_snapshot"]["units"]
    assert len(observer["history"][0]["world_snapshot"]["field_objects"]) == 2
    assert "SECRET GE east roadblock" in json.dumps(observer["history"][0])
    # Second-order response must never return other-side events.
    assert "resolution" not in resolved and "public_result" in resolved, resolved
    assert "events" not in json.dumps(resolved), resolved
    assert "Conditional reserve" not in json.dumps(resolved), resolved

    # Ground detection requires actual post-movement proximity, not public omniscience.
    code, ground_game = call("create", "POST",
        {"title": "Ground contact discovery", "turn_limit": 3, "config": legacy_config}, PASSWORD)
    assert code == 201, ground_game
    ground_id = ground_game["id"]
    match_ids.append(ground_id)
    for turn in (1, 2, 3):
        for side in ("us", "ge"):
            order = {"turn": turn, "side": side, "intent": "Approach south crossing",
                "actions": [{"squad": side.upper() + "-1", "type": "move", "target": "south"}],
                "support": "none", "proposals": []}
            if side == "ge" and turn == 3:
                order["activities"] = [{"squad": "GE-1", "kind": "fortification",
                    "description": "SECRET GE works under construction at crossing"}]
            code, result = call("submit", "POST",
                {"id": ground_id, "turn": turn, "side": side, "order": order},
                ground_game["keys"][side])
            assert code == 200, result
    code, ground_us = call("brief", key=ground_game["keys"]["us"],
        query=f"&id={ground_id}&side=us")
    assert code == 200, ground_us
    discovered = ground_us["own_state"]["field_contacts"]
    assert len(discovered) == 1 and discovered[0]["source"] == "ground", discovered
    assert discovered[0]["confidence"] == "probable"
    assert "SECRET GE" not in json.dumps(ground_us)
    assert ground_us["history"][2]["field_contacts"][0]["last_seen_turn"] == 3
    assert ground_us["history"][2]["field_contacts"][0]["stats"]["defense_strength"] == 1
    code, ground_public = call("public", query=f"&id={ground_id}")
    assert code == 200 and "field_contacts" not in json.dumps(ground_public)
    # Finish game 1 with US still controlling the south objective.
    for turn in (2, 3):
        u = {"turn": turn, "side": "us", "intent": "Stay and secure",
             "actions": [{"squad": "US-1", "type": "move", "target": "south"}],
             "support": "none", "proposals": []}
        g = {"turn": turn, "side": "ge", "intent": "Hold east",
             "actions": [{"squad": "GE-1", "type": "reserve"}],
             "support": "none", "proposals": []}
        assert call("submit", "POST", {"id": match_id, "turn": turn,
            "side": "us", "order": u}, us_key)[0] == 200
        assert call("submit", "POST", {"id": match_id, "turn": turn,
            "side": "ge", "order": g}, ge_key)[0] == 200
    code, final = call("public", query=f"&id={match_id}")
    assert code == 200 and final["phase"] == "complete" and final["winner"] == "us", final
    assert final["series"]["game_number"] == 1 and final["series"]["can_rematch"], final
    assert final["series"]["score"]["a"] == 1
    # Emulate an archived, pre-snapshot V1 match without touching real host data.
    # Old public history must still reconstruct objective ownership while hiding
    # all unit positions. Admin may see exact positions ONLY if replay verified.
    archive_path = STATE / "ideation-v1" / (match_id + ".php")
    guard, archive_json = archive_path.read_text().split("\n", 1)
    archived = json.loads(archive_json)
    archived.pop("rules_revision", None)
    archived.pop("series", None)
    for row in archived["history"]:
        row.pop("world_snapshot", None)
        row.pop("public_snapshot", None)
    archive_path.write_text(guard + "\n" + json.dumps(archived))
    code, older_public = call("public", query=f"&id={match_id}")
    assert code == 200 and older_public["history"][1]["public_snapshot"], older_public
    assert older_public["history"][1]["public_snapshot"]["snapshot_kind"] == "legacy_public_capture_reconstruction"
    assert "units" not in json.dumps(older_public["history"])
    assert older_public["rules_revision"] == 1
    assert older_public["effective_rules"]["contested_attrition"] is False
    assert older_public["effective_rules"]["neutral_contested_siege"] is False
    assert "LEGACY V1 MATCH" in older_public["effective_rules"]["notice"]
    code, older_admin = call("observer", key=PASSWORD, query=f"&id={match_id}")
    assert code == 200 and older_admin["replay_source"] == "reconstructed_verified_v1", older_admin.get("replay_note")
    assert len(older_admin["history"]) == 3
    assert all("world_snapshot" in row for row in older_admin["history"])
    # Force a divergent archived end-state. The administrator can watch an
    # explicitly unverified re-simulation, but public history stays redacted.
    archived["world"]["units"]["US-1"]["x"] += 17
    archive_path.write_text(guard + "\n" + json.dumps(archived))
    code, illustrative = call("observer", key=PASSWORD, query=f"&id={match_id}")
    assert code == 200 and illustrative["replay_source"] == "illustrative_unverified_v1", illustrative
    assert "UNVERIFIED" in illustrative["replay_note"]
    assert len(illustrative["history"]) == 3
    assert all("world_snapshot" in row for row in illustrative["history"])
    code, redacted = call("public", query=f"&id={match_id}")
    assert code == 200 and "world_snapshot" not in json.dumps(redacted["history"])
    # A bot key cannot spawn a series; admin alone may.
    bad_code, _ = call("rematch", "POST", {"id": match_id}, ge_key)
    assert bad_code == 401
    code, nextgame = call("rematch", "POST",
        {"id": match_id, "player_a": "Sol", "player_b": "Opus"}, PASSWORD)
    assert code == 201 and nextgame["game_number"] == 2, nextgame
    assert nextgame["series"]["assignments"] == {"us": "b", "ge": "a"}
    assert nextgame["series"]["score"] == {"a": 1, "b": 0}
    assert nextgame["series"]["players"] == {"a": "Sol", "b": "Opus"}
    next_id = nextgame["id"]
    assert next_id == match_id, "A rematch must preserve the exact match ID"
    assert nextgame["keys_reused"] is True and "keys" not in nextgame
    code, rematch_public = call("public", query=f"&id={next_id}")
    assert code == 200 and rematch_public["rules_revision"] == 1
    assert rematch_public["effective_rules"]["contested_attrition"] is False
    assert "LEGACY V1 MATCH" in rematch_public["effective_rules"]["notice"]
    assert rematch_public["turn"] == 1 and rematch_public["phase"] == "orders"
    assert rematch_public["series"]["stable_identity"] is True
    assert rematch_public["series"]["archive_attempts"] == [{"attempt": 1, "game_number": 1}]
    assert rematch_public["series"]["next_match_id"] is None
    # Original US commander's key is now valid for Germany, and vice versa.
    assert call("brief", key=us_key, query=f"&id={next_id}&side=ge")[0] == 200
    assert call("brief", key=ge_key, query=f"&id={next_id}&side=us")[0] == 200
    assert call("brief", key=us_key, query=f"&id={next_id}&side=us")[0] == 401
    assert call("brief", key=ge_key, query=f"&id={next_id}&side=ge")[0] == 401
    # Archived Game 1 is immutable, replayable, and retains the OLD key mapping.
    code, previous = call("public", query=f"&id={match_id}&attempt=1")
    assert code == 200 and previous["archive_view"] and previous["phase"] == "complete"
    assert previous["winner"] == "us" and len(previous["history"]) == 3
    assert call("brief", key=us_key, query=f"&id={match_id}&attempt=1&side=us")[0] == 200
    assert call("brief", key=ge_key, query=f"&id={match_id}&attempt=1&side=us")[0] == 401
    assert call("observer", key=PASSWORD, query=f"&id={match_id}&attempt=1")[0] == 200
    assert call("public", query=f"&id={match_id}&attempt=2")[0] == 404
    assert call("public", query=f"&id={match_id}&attempt=../../private")[0] == 400
    duplicate_code, _ = call("rematch", "POST", {"id": match_id}, PASSWORD)
    assert duplicate_code == 409
    # Game 2: with US idle, GE (now Sol) captures South on turn 3.
    for turn in (1, 2, 3):
        u = {"turn": turn, "side": "us", "intent": "Hold the home bases",
             "actions": [], "support": "none", "proposals": []}
        g = {"turn": turn, "side": "ge", "intent": "Secure south crossing",
             "actions": [{"squad": "GE-1", "type": "move", "target": "south"}],
             "support": "none", "proposals": []}
        assert call("submit", "POST", {"id": next_id, "turn": turn, "side": "us",
            "order": u}, ge_key)[0] == 200
        assert call("submit", "POST", {"id": next_id, "turn": turn, "side": "ge",
            "order": g}, us_key)[0] == 200
    code, champion = call("public", query=f"&id={next_id}")
    assert code == 200 and champion["winner"] == "ge", champion
    assert champion["series"]["champion"] == "a" and champion["series"]["score"]["a"] == 2
    assert not champion["series"]["can_rematch"]
    assert call("rematch", "POST", {"id": next_id}, PASSWORD)[0] == 409
    # A drawn match does not consume a decisive game slot.
    code, drawn = call("create", "POST",
        {"title": "Draw replay", "turn_limit": 2}, PASSWORD)
    assert code == 201
    match_ids.append(drawn["id"])
    for turn in (1, 2):
        for side in ("us", "ge"):
            noop = {"turn": turn, "side": side, "intent": "Hold",
                    "actions": [], "support": "none", "proposals": []}
            assert call("submit", "POST", {"id": drawn["id"], "turn": turn,
                "side": side, "order": noop}, drawn["keys"][side])[0] == 200
    assert call("public", query=f"&id={drawn['id']}")[1]["winner"] == "draw"
    code, repeat = call("rematch", "POST", {"id": drawn["id"]}, PASSWORD)
    assert code == 201 and repeat["game_number"] == 1
    assert repeat["series"]["assignments"] == {"us": "b", "ge": "a"}
    assert repeat["id"] == drawn["id"] and repeat["keys_reused"] is True
    original_layout = call("public", query=f"&id={drawn['id']}&attempt=1")[1]["objective_candidates"]
    repeat_layout = call("public", query=f"&id={repeat['id']}")[1]["objective_candidates"]
    assert original_layout == repeat_layout, "Side-swap rematch changed the objective geometry"
    match_ids.append(repeat["id"])
    code, bad = call("resolve", "POST", {"id": match_id}, us_key)
    assert code == 404, bad
    record = STATE / "ideation-v1" / (match_id + ".php")
    assert record.exists() and record.read_text().startswith("<?php http_response_code(404); exit; ?>")
    print("PASS: isolated sealed orders, redacted submit and historical events, admin observer, "
          "private replay, automatic referee, stable rematch ID and commander keys, faction swaps, best-of-three winner, "
          "and draw replay")
finally:
    if server is not None:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()
    for path_id in match_ids:
        (STATE / "ideation-v1" / (path_id + ".php")).unlink(missing_ok=True)
        for archived in (STATE / "ideation-v1").glob(path_id + "-attempt-*.php"):
            archived.unlink(missing_ok=True)
    ADMIN.unlink(missing_ok=True)
