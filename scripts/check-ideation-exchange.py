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
    code, new = call("create", "POST", {"title": "Automated contract smoke", "turn_limit": 3}, PASSWORD)
    assert code == 201 and new["ok"], new
    match_id = new["id"]
    assert len(new["keys"]) == 2
    us_key, ge_key = new["keys"]["us"], new["keys"]["ge"]
    code, public = call("public", query=f"&id={match_id}")
    assert code == 200 and public["phase"] == "orders" and public["turn"] == 1
    assert public["current_orders"] is None and "key_hashes" not in public
    assert "units" not in public and "intel" not in public
    code, wrong = call("brief", key=ge_key, query=f"&id={match_id}&side=us")
    assert code == 401, wrong
    code, us = call("brief", key=us_key, query=f"&id={match_id}&side=us")
    assert code == 200 and len(us["own_state"]["squads"]) == 5, us
    assert all(x["side"] == "us" for x in us["own_state"]["squads"].values())
    us_order = {"turn": 1, "side": "us", "intent": "Advance from south",
        "actions": [{"squad": "US-1", "type": "transport", "target": "south"}],
        "support": "recon",
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
        "support": "none", "proposals": []}
    code, resolved = call("submit", "POST",
        {"id": match_id, "turn": 1, "side": "ge", "order": ge_order}, ge_key)
    assert code == 200 and resolved["resolved"] and resolved["turn"] == 2, resolved
    code, public = call("public", query=f"&id={match_id}")
    assert code == 200 and public["turn"] == 2 and len(public["history"]) == 1, public
    assert public["history"][0]["orders"]["us"]["intent"] == us_order["intent"]
    assert public["history"][0]["orders"]["ge"]["intent"] == ge_order["intent"]
    assert public["history"][0]["capabilities"][0]["status"] == "PROPOSED_NO_AUTOMATIC_EFFECT"
    assert public["public_world"]["clock_minutes"] == 10
    code, intel = call("brief", key=us_key, query=f"&id={match_id}&side=us")
    assert code == 200 and intel["own_state"]["intel_reports"][0]["source"] == "limited_aerial"
    code, hidden = call("brief", key=ge_key, query=f"&id={match_id}&side=ge")
    assert code == 200 and not hidden["own_state"]["intel_reports"]
    code, bad = call("resolve", "POST", {"id": match_id}, us_key)
    assert code == 404, bad
    record = STATE / "ideation-v1" / (match_id + ".php")
    assert record.exists() and record.read_text().startswith("<?php http_response_code(404); exit; ?>")
    print("PASS: sealed one-sided order, no secret leakage, idempotent submit, automatic referee,"
          " faction isolation, capability-only proposals, two-sided turn reveal")
finally:
    if server is not None:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()
    if match_id:
        (STATE / "ideation-v1" / (match_id + ".php")).unlink(missing_ok=True)
    ADMIN.unlink(missing_ok=True)
