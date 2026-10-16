#!/usr/bin/env python3
"""Stage only branch-modified public model/effect assets for an isolated preview.

Unchanged objects are served directly from /grasstex/Assets/ by an Apache rewrite
in the preview's Assets/.htaccess, avoiding an ~850 MB per-branch FTP copy.
Unlike size-only lftp mirroring, git's tree diff correctly detects same-size edits.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path

EXTENSIONS = {
    "soldiers": {".fbx"},
    "animations": {".fbx", ".bin"},
    "weapons": {".fbx", ".glb"},
    "vehicles": {".fbx", ".glb"},
    "effects": {".png", ".webp", ".jpg", ".jpeg"},
    "terrain": {".png", ".bin"},
}


def managed_asset(path: str) -> bool:
    parts = Path(path).parts
    return (
        len(parts) >= 3
        and parts[0] == "Assets"
        and parts[1] in EXTENSIONS
        and Path(path).suffix.lower() in EXTENSIONS[parts[1]]
        and bool(re.fullmatch(r"[A-Za-z0-9 ._()/-]+", path))
        and all(part not in ("", ".", "..") for part in parts)
    )


def changed_assets(base_ref: str) -> list[str]:
    # NUL separators are essential: hundreds of animations have spaces in names.
    data = subprocess.check_output(
        ["git", "diff", "--name-only", "-z", "--no-renames", base_ref, "HEAD", "--", "Assets/"]
    )
    return sorted(
        {raw.decode("utf-8") for raw in data.split(b"\0") if raw},
        key=str.casefold,
    )


def rewrite_rules(removed: list[str]) -> str:
    lines = [
        "# Branch asset overlay: files present here win; unchanged assets reuse production.",
        "# This file is generated at preview deploy time, never deployed into /grasstex/Assets.",
        "<IfModule mod_rewrite.c>",
        "  RewriteEngine On",
    ]
    for path in removed:
        rel = path[len("Assets/") :]
        # Escaped names cannot introduce Apache directives or cross directories.
        lines.append("  RewriteRule ^" + re.escape(rel) + "$ - [G,L]")
    lines.extend(
        [
            "  RewriteCond %{REQUEST_FILENAME} !-f",
            "  RewriteCond %{REQUEST_FILENAME} !-d",
            "  RewriteRule ^(soldiers|animations|weapons|vehicles|effects|terrain)/(.+)$ /grasstex/Assets/$1/$2 [L,NE]",
            "</IfModule>",
            "",
        ]
    )
    return "\n".join(lines)


def build_overlay(base_ref: str, destination: Path) -> dict:
    assets = destination / "Assets"
    assets.mkdir(parents=True, exist_ok=True)
    copied, removed = [], []
    for path in changed_assets(base_ref):
        if not managed_asset(path):
            # Do not expose private audio, host-owned calibration JSON, PHP, or
            # other files from the repository through the public preview.
            continue
        src = Path(path)
        if src.is_symlink():
            raise RuntimeError(f"Refusing to stage a symlinked asset: {path}")
        if src.is_file():
            dst = destination / path
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            copied.append({"path": path, "bytes": src.stat().st_size})
        else:
            removed.append(path)
    manifest = {
        "version": 1,
        "assetOverlay": True,
        "copied": copied,
        "removedAssets": [p[len("Assets/") :] for p in removed],
        "totalBytes": sum(item["bytes"] for item in copied),
    }
    (destination / "asset-overlay.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    (destination / "asset-overlay.htaccess").write_text(
        rewrite_rules(removed), encoding="utf-8"
    )
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-ref", default="origin/main")
    parser.add_argument("--output", type=Path, default=Path(".preview"))
    args = parser.parse_args()
    result = build_overlay(args.base_ref, args.output)
    print(
        "Preview asset overlay: "
        f"{len(result['copied'])} changed files / "
        f"{result['totalBytes']:,} bytes to upload, "
        f"{len(result['removedAssets'])} deleted; "
        "all unchanged assets resolve to production."
    )


if __name__ == "__main__":
    main()
