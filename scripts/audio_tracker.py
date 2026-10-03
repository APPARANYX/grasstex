#!/usr/bin/env python3
"""Has the audio changed? CI and the deploy ask this first and skip their audio steps when not.

The audio inputs are everything under Assets/audio plus the scripts and workflows that check,
master, pitch-shift or upload it (INPUTS below). Two questions, one list:

  python3 scripts/audio_tracker.py snapshot > tracker.json
      A tracker JSON: the SHA-256 of every audio input in the checkout and one digest over all of
      them. The deploy uploads it to the host last (`.battle-audio-tracker.json`), so it describes
      audio that is live.

  python3 scripts/audio_tracker.py compare <previous tracker.json> [--github-output FILE]
      Against a previous tracker (the one on the host): prints the inputs added, removed or
      changed, and `changed=true|false`. A missing or unreadable previous tracker is `true`.

  python3 scripts/audio_tracker.py diff <base ref> [--github-output FILE]
      Against a git ref (a pull request's base, the commit before a push): the audio inputs that
      differ between it and HEAD, and `changed=true|false`. A ref git cannot resolve is `true`.

Every doubt answers `changed=true`, so a skip only happens when the audio is provably the same.
"""
import argparse
import hashlib
import json
import subprocess
import sys

FORMAT = "grasstex-audio-tracker-v1"
INPUTS = (
    "Assets/audio/",
    "scripts/recipes/",
    "scripts/normalize_audio.sh",
    "scripts/build_voice_pitch_variants.sh",
    "scripts/validate_voice_manifest.py",
    "scripts/check_audio_manifest.py",
    "scripts/check_weapon_clips.py",
    "scripts/fetch_weapon_audio.sh",
    "scripts/slice_weapon_shots.py",
    "scripts/audio_tracker.py",
    ".github/workflows/ci.yml",
    ".github/workflows/deploy-50webs-php.yml",
)


def tracked(path):
    return any(path == p or (p.endswith("/") and path.startswith(p)) for p in INPUTS)


def git(*args):
    return subprocess.run(("git",) + args, check=True, capture_output=True, text=True).stdout


def snapshot():
    files = {}
    for path in sorted(p for p in git("ls-files", "-z").split("\0") if p and tracked(p)):
        h = hashlib.sha256()
        with open(path, "rb") as fh:
            for chunk in iter(lambda: fh.read(1 << 20), b""):
                h.update(chunk)
        files[path] = h.hexdigest()
    digest = hashlib.sha256("".join(f"{p}\t{s}\n" for p, s in files.items()).encode()).hexdigest()
    return {"format": FORMAT, "digest": digest, "inputs": list(INPUTS), "files": files}


def report(changed, paths, output):
    for p in paths[:50]:
        print(f"  {p}")
    if len(paths) > 50:
        print(f"  ... and {len(paths) - 50} more")
    print(f"Audio changed: {'yes' if changed else 'no'}")
    if output:
        with open(output, "a", encoding="utf-8") as fh:
            fh.write(f"changed={'true' if changed else 'false'}\n")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("snapshot")
    c = sub.add_parser("compare")
    c.add_argument("previous")
    c.add_argument("--github-output")
    d = sub.add_parser("diff")
    d.add_argument("base")
    d.add_argument("--github-output")
    args = ap.parse_args()

    if args.cmd == "snapshot":
        json.dump(snapshot(), sys.stdout, indent=1, sort_keys=True)
        print()
        return

    if args.cmd == "compare":
        now = snapshot()
        try:
            prev = json.load(open(args.previous, encoding="utf-8"))
            assert prev.get("format") == FORMAT and isinstance(prev.get("files"), dict)
        except Exception as exc:  # no tracker yet, or not one we can read: do the audio steps
            print(f"No usable previous tracker ({exc.__class__.__name__}): treating audio as changed.")
            return report(True, [], args.github_output)
        old, new = prev["files"], now["files"]
        paths = sorted(p for p in set(old) | set(new) if old.get(p) != new.get(p))
        if prev.get("inputs") != now["inputs"]:
            paths.insert(0, "(the list of audio inputs itself)")
        return report(bool(paths) or prev.get("digest") != now["digest"], paths, args.github_output)

    try:
        git("rev-parse", "--verify", "--quiet", args.base + "^{commit}")
        names = git("diff", "--name-only", "--no-renames", args.base, "HEAD").splitlines()
    except subprocess.CalledProcessError:
        print(f"Cannot compare with {args.base!r}: treating audio as changed.")
        return report(True, [], args.github_output)
    paths = sorted(p for p in names if tracked(p))
    report(bool(paths), paths, args.github_output)


if __name__ == "__main__":
    main()
