#!/usr/bin/env python3
"""Guard against stale, mixed-version Wargame browser and PHP deployments."""
from pathlib import Path
import hashlib
import re

root = Path(__file__).resolve().parent.parent
page = (root / "wargame/index.html").read_text(encoding="utf-8")
app = (root / "wargame/app.js").read_text(encoding="utf-8")
api = (root / "wargame/api.php").read_text(encoding="utf-8")
match = re.search(r"WARGAME v(\d+\.\d+\.\d+)", page)
assert match, "Wargame HTML must show a visible build version"
version = match.group(1)
assert f"const CLIENT_VERSION = '{version}'" in app, "app.js version must match HTML"
assert f"const IDEATION_API_VERSION = '{version}'" in api, "PHP API version must match HTML"
assert 'id="buildDiagnostic"' in page, "Browser/API diagnostics missing"
for name in ("map.js", "app.js"):
    data = (root / "wargame" / name).read_bytes()
    blob = hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()
    expected = f'<script src="./{name}?v={blob[:12]}"></script>'
    assert expected in page, (
        f"Outdated asset URL for {name}. Use ?v={blob[:12]} in "
        "wargame/index.html so Safari loads the current file."
    )
assert 'id="mapPanel"' in page, "Map viewer panel missing"
assert 'id="seriesPanel"' in page, "Best-of-three series panel missing"
print(f"PASS: Wargame v{version} matches browser and PHP, asset URLs match Git blobs")
