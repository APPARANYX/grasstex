#!/usr/bin/env python3
"""Generate the combat sound effects in Assets/audio/combat-sfx-manifest.json (near-miss flybys,
ricochets, surface impacts, flesh hits, pain) with ElevenLabs Sound Effects, one generation per
variation. Only clips missing from both .runtime/combat-sfx/ and Assets/audio/ are generated, so a
rerun costs nothing unless --force names a group or clip.

Route (AGENTS.md Audio): fetch into gitignored .runtime/combat-sfx/, onset-check, master with
normalize_audio.sh, copy into Assets/audio/ and commit only the MP3s. The workflow
.github/workflows/combat-sfx-generate.yml does all of it on a branch.

Usage:
  export ELEVENLABS_API_KEY=...                  # never commit it
  python3 scripts/generate_combat_sfx.py         # every missing clip
  python3 scripts/generate_combat_sfx.py --only flyby pain     # groups (or group.clip)
  python3 scripts/generate_combat_sfx.py --dry-run
  python3 scripts/generate_combat_sfx.py --force impacts.metal
"""
import argparse
import generation_guard
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import generate_weapon_sfx as sfx  # noqa: E402  (shares the API call and its retries)

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(REPO, "Assets/audio/combat-sfx-manifest.json")
OUT_ROOT = os.path.join(REPO, ".runtime/combat-sfx")


def clips(man):
    for group, entries in man["groups"].items():
        for cid, c in entries.items():
            yield group, cid, c


def wanted(names, group, cid):
    return not names or group in names or f"{group}.{cid}" in names


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", nargs="+", help="groups or group.clip ids")
    ap.add_argument("--force", nargs="+", help="regenerate these groups or group.clip ids")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--max-new", type=int, help="most missing clips one run may generate (default 12, 0 = no cap)")
    args = ap.parse_args()
    if not sfx.API_KEY and not args.dry_run:
        sys.exit("ELEVENLABS_API_KEY is not set. Export it before running this script; never commit it.")
    man = json.load(open(MANIFEST_PATH, encoding="utf-8"))
    jobs = []
    declared = present = unforced = 0
    for group, cid, c in clips(man):
        if not wanted(args.only, group, cid):
            continue
        forced = bool(args.force) and wanted(args.force, group, cid)
        for rel in c["files"]:
            out_path = os.path.join(OUT_ROOT, rel)
            have = any(os.path.isfile(p) and os.path.getsize(p) > 0
                       for p in (out_path, os.path.join(REPO, "Assets/audio", rel)))
            declared += 1
            present += bool(have)
            if have and not forced:
                continue
            unforced += not forced
            jobs.append((group, cid, c, rel, out_path))
    if not jobs:
        print("No matching clips need generation.")
        return
    if not args.dry_run:
        generation_guard.check("combat SFX", declared, present, unforced, generation_guard.max_new(args.max_new))
    print(f"{'Would generate' if args.dry_run else 'Generating'} {len(jobs)} clip(s) into {OUT_ROOT}")
    ok, failed = 0, []
    for i, (group, cid, c, rel, out_path) in enumerate(jobs, 1):
        print(f"[{i}/{len(jobs)}] {group}.{cid} -> {rel}")
        if args.dry_run:
            continue
        try:
            audio = sfx.generate(c["prompt"], c["maxDurationS"], prompt_influence=0.7)
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, "wb") as fh:
                fh.write(audio)
            ok += 1
        except Exception as exc:  # report every failure, then fail the run
            print(f"    FAILED: {exc}", file=sys.stderr)
            failed.append((rel, str(exc)))
        time.sleep(0.3)
    if args.dry_run:
        return
    print(f"Done. {ok} succeeded, {len(failed)} failed.")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
