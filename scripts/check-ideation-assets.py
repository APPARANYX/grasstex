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
assert 'id="liveStatus"' in page, "Live polling status indicator missing"
assert "}, 2000);" in app, "Live match must poll every 2 seconds"
assert "autoPollInFlight" in app, "Live polling must avoid overlapping requests"
assert "if (!unchanged) render(data);" in app, "Unchanged polls must not redraw map"
assert "!document.hidden" in app, "Background tabs must not poll continuously"
assert "!archiveAttempt" in app, "Read-only archives must not poll continuously"
assert "last.series?.champion" not in app, "Live matches must keep polling through rematches and completed rounds"
assert "effective_rules: last.effective_rules" in app, "Commander packet must disclose actual match rules"
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
assert 'id="debriefPanel"' in page and 'id="debriefInput"' in page, "AI debrief UI missing"
assert 'id="exportDebriefs"' in page and 'id="copyDebriefPrompt"' in page, "AI debrief controls missing"
assert "if ($op==='debrief_export')" in api, "Admin debrief export endpoint missing"
assert "if ($op==='debrief')" in api, "Commander debrief endpoint missing"
assert 'id="mapExpand"' in page, "Tactical map expand button missing"
assert 'class="tacticalLayout"' in page, "Tactical layout missing"
assert 'Field parcels and hedgerows are illustrative' in page, "Do not imply simulator terrain is loaded"
map_script = (root / "wargame/map.js").read_text(encoding="utf-8")
assert 'function cartography(svg)' in map_script, "Tactical cartography missing"
assert "panel.classList.toggle('expanded')" in map_script, "Expanded tactical map control missing"
assert 'historical unit coordinates' in map_script, "Legacy replay limitation not explained"
assert "role === 'admin'" in map_script, "Observer-only historical unit data guard missing"
assert 'id="fieldContacts"' in page, "Field contact sidebar missing"
assert 'id="fieldDetails"' in page, "Field marker detail panel missing"
assert "role === 'admin' ? completeWorld?.field_objects" in map_script, "Field truth must be observer-only"
assert "round?.field_contacts || []" in map_script, "Replay must use per-turn authorized contacts"
print(f"PASS: Wargame v{version} matches browser and PHP, asset URLs match Git blobs")
