#!/usr/bin/env python3
"""Regression checks for thin branch preview asset overlays.

A local git fixture proves that preview assets are selected by changed Git
content (not size/mtime) and that unchanged production FBX is never staged.
"""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "preview_overlay", ROOT / "scripts" / "prepare_preview_asset_overlay.py"
)
overlay = importlib.util.module_from_spec(spec)
spec.loader.exec_module(overlay)


def run(*cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


with tempfile.TemporaryDirectory(prefix="grasstex-preview-overlay-") as folder:
    base = Path(folder)
    repo = base / "git"
    repo.mkdir()
    old = os.getcwd()
    try:
        os.chdir(repo)
        run("git", "init", "-q")
        run("git", "config", "user.name", "Preview Fixture")
        run("git", "config", "user.email", "fixture@example.invalid")
        files = {
            "Assets/soldiers/ge-paratrooper.fbx": b"OLD_SOLDIER_BYTES",
            "Assets/animations/Rifle Walk.fbx": b"OLD_ANIMATION",
            "Assets/animations/Removed.fbx": b"OLD_REMOVED",
            "Assets/vehicles/unchanged.fbx": b"OLD_TRUCK",
            "Assets/vehicles/same-size.fbx": b"AAAA",
            "Assets/audio/private.bin": b"PRIVATE_AUDIO",
            "Assets/soldiers/host-owned.fbx.json": b"PRIVATE_SIDECAR",
        }
        for name, data in files.items():
            p = Path(name)
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(data)
        run("git", "add", ".")
        run("git", "commit", "-qm", "base")
        run("git", "branch", "-M", "main")
        Path("Assets/vehicles/same-size.fbx").write_bytes(b"BBBB")
        Path("Assets/animations/Removed.fbx").unlink()
        Path("Assets/animations/Truck - Sitting 1.fbx").write_bytes(b"NEW_CLIP")
        Path("Assets/audio/private.bin").write_bytes(b"BAD_AUDIO2")
        Path("Assets/soldiers/host-owned.fbx.json").write_bytes(b"SIDECAR2")
        run("git", "add", "-A")
        run("git", "commit", "-qm", "branch changes")
        stage = base / "stage"
        result = overlay.build_overlay("main", stage)
        expected = [
            "Assets/animations/Truck - Sitting 1.fbx",
            "Assets/vehicles/same-size.fbx",
        ]
        assert [item["path"] for item in result["copied"]] == expected, result
        assert result["removedAssets"] == ["animations/Removed.fbx"], result
        assert result["totalBytes"] == 4 + 8
        for name in expected:
            assert (stage / name).read_bytes() == Path(name).read_bytes()
        for name in (
            "Assets/soldiers/ge-paratrooper.fbx",
            "Assets/animations/Rifle Walk.fbx",
            "Assets/vehicles/unchanged.fbx",
            "Assets/audio/private.bin",
            "Assets/soldiers/host-owned.fbx.json",
        ):
            assert not (stage / name).exists(), f"Unchanged/private asset copied: {name}"
        rules = (stage / "asset-overlay.htaccess").read_text()
        assert "RewriteEngine On" in rules
        assert "animations/Removed\\.fbx$ - [G,L]" in rules
        assert "RewriteCond %{REQUEST_FILENAME} !-f" in rules
        assert "/grasstex/Assets/$1/$2" in rules
        assert json.loads((stage / "asset-overlay.json").read_text()) == result
        # Identical asset trees must stage zero FBX and keep production fallback.
        clean = base / "clean"
        zero = overlay.build_overlay("HEAD", clean)
        assert zero["copied"] == [] and zero["removedAssets"] == []
        assert (clean / "asset-overlay.htaccess").is_file()
    finally:
        os.chdir(old)

print("PASS: preview overlay stages only changed content, detects same-size edits and deletions,")
print("      keeps source/sidecars safe, and reuses all unchanged production assets")
