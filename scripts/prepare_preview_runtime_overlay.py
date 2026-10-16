#!/usr/bin/env python3
"""Stage a *thin* branch-preview battle runtime against current production main.

Unlike copying all battle/modules/*.js for every preview, this script stages
only tracked, changed JS/CSS files. An Apache rewrite serves unchanged files
from /grasstex/battle/ while the PHP loader uses a complete branch module
manifest rather than a glob of the small override directory.

The page HTML is always staged: battle_sim_local.php reads it from disk.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path

SAFE_FILE = re.compile(r"^battle/(?:modules/)?[A-Za-z0-9._-]+\.(?:js|css)$")
SAFE_MODULE = re.compile(r"^[A-Za-z0-9._-]+\.js$")


def allowed_runtime(path: str) -> bool:
    return SAFE_FILE.fullmatch(path) is not None


def diff_paths(ref: str) -> list[str]:
    data = subprocess.check_output(
        ["git", "diff", "--name-only", "--no-renames", "-z", ref, "HEAD", "--", "battle/"]
    )
    return sorted({entry.decode("utf-8") for entry in data.split(b"\0") if entry})


def listed_modules() -> list[str]:
    # The branch's tracked files, not the production tree, define module loading.
    data = subprocess.check_output(
        ["git", "ls-files", "-z", "--", "battle/modules/"]
    )
    modules = set()
    for raw in data.split(b"\0"):
        if not raw:
            continue
        path = raw.decode("utf-8")
        name = Path(path).name
        if path == "battle/modules/" + name and SAFE_MODULE.fullmatch(name):
            if not Path(path).is_file():
                raise RuntimeError(f"Tracked module missing from working tree: {path}")
            modules.add(name)
    return sorted(modules)


def rewrite_rules(removed: list[str]) -> str:
    rules = [
        "# Preview-only runtime overlay, generated at deploy time.",
        "# Local modified JS/CSS wins; unchanged code resolves to production.",
        "<IfModule mod_rewrite.c>",
        "  RewriteEngine On",
    ]
    for path in removed:
        name = path[len("battle/"):]
        rules.append("  RewriteRule ^" + re.escape(name) + "$ - [G,L]")
    rules.extend([
        "  RewriteCond %{REQUEST_FILENAME} !-f",
        "  RewriteCond %{REQUEST_FILENAME} !-d",
        "  RewriteRule ^((?:modules/)?[A-Za-z0-9._-]+\\.(?:js|css))$ /grasstex/battle/$1 [L,NE]",
        "</IfModule>",
        "",
    ])
    return "\n".join(rules)


def build_overlay(base_ref: str, output: Path) -> dict:
    battle_dir = output / "battle"
    battle_dir.mkdir(parents=True, exist_ok=True)
    page = Path("battle/battle_sim.html")
    if not page.is_file() or not page.stat().st_size:
        raise RuntimeError("Branch battle/battle_sim.html missing or empty")
    shutil.copy2(page, battle_dir / "battle_sim.html")
    copied: list[dict] = []
    removed: list[str] = []
    for path in diff_paths(base_ref):
        if not allowed_runtime(path):
            continue
        src = Path(path)
        if src.is_symlink():
            raise RuntimeError(f"Refusing to stage symlinked script: {path}")
        if src.is_file():
            target = output / path
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, target)
            copied.append({"path": path, "bytes": src.stat().st_size})
        else:
            removed.append(path)
    modules = listed_modules()
    manifest = {
        "version": 1,
        "runtimeOverlay": True,
        "modules": modules,
        "copied": copied,
        "removedRuntime": [path[len("battle/"):] for path in removed],
        "totalBytes": sum(item["bytes"] for item in copied),
    }
    (output / "runtime-overlay.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    (output / "runtime-overlay.htaccess").write_text(
        rewrite_rules(removed), encoding="utf-8"
    )
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-ref", default="origin/main")
    parser.add_argument("--output", type=Path, default=Path(".preview"))
    args = parser.parse_args()
    summary = build_overlay(args.base_ref, args.output)
    print(
        f"Preview runtime overlay: {len(summary['copied'])} branch-changed code file(s) "
        f"/ {summary['totalBytes']:,} bytes staged; "
        f"{len(summary['removedRuntime'])} deletions blocked; "
        f"{len(summary['modules'])} modules listed without copying them."
    )


if __name__ == "__main__":
    main()
