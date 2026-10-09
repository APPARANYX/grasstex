#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, json, os, re
from pathlib import Path

STATIC_FILES = [
    ("ai_flow_live.html", "ai_flow_live.html"),
    ("battle_sim_local.php", "battle_sim.php"),
    ("battle_log.php", "battle_log.php"),
    ("battle_log_stats.php", "battle_log_stats.php"),
    ("battle_policy.php", "battle_policy.php"),
    ("battle_learning.php", "battle_learning.php"),
    ("battle_metrics.php", "battle_metrics.php"),
    # Branch preview launcher: stages a branch's runtime into preview/ref-<sha>/ on request.
    ("preview.php", "preview.php"),
]
# The repo's FBX Motion Lab (labs/): workbench, asset inventory and the endpoint that saves
# per-model sidecar calibrations (Assets/soldiers/<model>.json) the game reads at load. These
# exact paths are the only lab files the deploy owns; it uploads them and never deletes them.
# The sidecars it writes stay server-owned (protected below), so a deploy never clobbers a tuning.
MANAGED_LAB = ["labs/fbx-animation-lab.html", "labs/fbx-animation-root-lock.js", "labs/fbx-animation-compat.js",
               "labs/asset-list.php", "labs/save-calibration.php"]
STATIC_FILES += [(path, path) for path in MANAGED_LAB]
# Every runtime the page loads. A file missing from this list is simply never uploaded, so the
# deployed loader ends up requesting a 404 - keep it in step with the script tags in
# battle/battle_sim.html and the lists in battle_sim_local.php.
BATTLE_FILES = [
    "battle_sim.html","core-runtime.js","soldier.js","weapons.js","obstacle-field.js","terrain-features.js",
    "squad-ai.js","movement-resolver.js","engagement.js","battle-sim.js","camera-controls.js","acoustics.js",
    "scenario-generator.js","battle-navigation.js","town-objectives.js","module-registry.js",
    "ai-policy.js","objective-system.js","battle-telemetry.js","commander-doctrine.js",
    "commander-routes.js","commander-ai.js","ai-trainer.js","battle-control.js",
]
# Imported soldier models, animation masters, the prepared clip pack (Assets/animations/prepared-clips.bin) and weapon
# models (source .zip packs stay out). The FBX soldier backend (battle/modules/53-fbx-soldier-backend.js) reads them
# from the same-origin Assets/ directory.
SOLDIER_ASSET_GLOBS = [("Assets/soldiers", "*.fbx"), ("Assets/animations", "*.fbx"), ("Assets/animations", "*.bin"),
                       ("Assets/weapons", "*.fbx"), ("Assets/weapons", "*.glb"),
                       ("Assets/effects/muzzle-flash", "*.png"), ("Assets/effects/decals", "*.png")]
# Non-voice audio: weapon reports, handling foley, vehicle and ambience beds. The voice
# callouts are staged separately by the deploy workflow's pitch-variant step, but nothing
# else uploads these, and Assets/audio/manifest.json points the runtime straight at them.
AUDIO_ASSET_GLOBS = [("Assets/audio", "*.mp3"), ("Assets/audio/weapons", "*.mp3"),
                     ("Assets/audio/weapons/foley", "*.mp3"),
                     ("Assets/audio/vehicles", "*.mp3"), ("Assets/audio/ambience", "*.mp3"),
                     ("Assets/audio/footsteps/001-pasture-grass", "*.mp3"),
                     ("Assets/audio/footsteps/004-cobbled-street", "*.mp3"),
                     ("Assets/audio/footsteps/009-rubble", "*.mp3")]
# Combat sound effects (combat-sfx-manifest.json), one flat folder per group.
AUDIO_ASSET_GLOBS += [("Assets/audio/combat/"+g, "*.mp3") for g in ("flyby", "ricochet", "impacts", "flesh", "pain")]
# Per-model weapon folders (manifest categories weapon.<model>); weapons/foley is listed above.
WEAPON_AUDIO = Path("Assets/audio/weapons")
AUDIO_ASSET_GLOBS += [(d.as_posix(), "*.mp3") for d in sorted(WEAPON_AUDIO.iterdir() if WEAPON_AUDIO.is_dir() else [])
                      if d.is_dir() and d.name != "foley"]
# Every MP3 has two Opus twins beside it (about half the size): .caf for Safari/iOS, .ogg for Chrome,
# Edge, Firefox and Android, loaded instead where the browser decodes them
# (battle/modules/00-audio-format.js). Voices and their pitch variants are staged by the workflow.
AUDIO_ASSET_GLOBS += [(folder, "*." + ext) for folder, pattern in list(AUDIO_ASSET_GLOBS) if pattern == "*.mp3"
                      for ext in ("caf", "ogg")]
# None of these clips is in this repo: scripts/fetch_private_audio.sh overlays them from the private
# APPARANYX/grasstex-audio first.
def missing_private_clips(manifest_path: Path) -> list[str]:
    """Every clip the manifest's categories name, and its .caf and .ogg twins, must be on disk before a deploy."""
    try:
        cats = json.loads(manifest_path.read_text(encoding="utf-8")).get("categories", {})
    except (OSError, ValueError):
        return []
    held = placeholders()
    return sorted(clip for groups in cats.values() for files in groups.values() for f in files if f not in held
                  for clip in ((f, f[:-4] + ".caf", f[:-4] + ".ogg") if f.endswith(".mp3") else (f,))
                  if not (Path("Assets/audio") / clip).is_file())
def placeholders() -> set[str]:
    p = Path("Assets/audio/.manifest-placeholders.txt")
    return {l.strip() for l in p.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")} if p.is_file() else set()
# Generated by scripts/build_version.py at the start of a deploy; the loader reads it for the build
# id and cache epoch, so it must ship with the runtime it labels.
GENERATED_FILES = ["build-version.json"]
# Server-side files this deploy must never delete or overwrite: hand-placed sidecar JSON (clip,
# model and lab metadata beside the FBX assets), the FBX soldier-animation lab, and anything else
# the repo does not manage. The only JSON the deploy owns are the two it generates below.
MANAGED_JSON = {"battle/build-version.json", "Assets/audio/manifest.json"}
PROTECTED = [re.compile(r"\.json$", re.I), re.compile(r"lab", re.I), re.compile(r"sidecar", re.I)]
# The only remote files a deploy may delete: a battle module it deployed itself that left the repo.
DELETABLE = re.compile(r"^battle/modules/[A-Za-z0-9._-]+\.js$")
# A handful of modules retire per release; more means the checkout or state is wrong, not a cleanup.
MAX_DELETES = int(os.environ.get("DEPLOY_MAX_DELETES", "8"))
def is_protected(remote: str) -> bool:
    return remote not in MANAGED_JSON and remote not in MANAGED_LAB and any(p.search(remote) for p in PROTECTED)
def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024*1024), b""):
            h.update(chunk)
    return h.hexdigest()
def lftp_quote(value: str) -> str:
    return '"' + value.replace("\\","\\\\").replace('"','\\"') + '"'
def read_remote_manifest(path: Path | None) -> dict[str,str]:
    if path is None or not path.is_file():
        return {}
    out={}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line=raw.strip()
        if not line or line.startswith("#"): continue
        try: digest, remote = line.split("\t",1)
        except ValueError: continue
        digest=digest.strip().lower(); remote=remote.strip().lstrip("./")
        if len(digest)==64 and all(c in "0123456789abcdef" for c in digest) and remote:
            out[remote]=digest
    return out
def write_commands(path: Path, pairs):
    # put -o does not create directories; asset uploads may be the first file in theirs.
    dirs=sorted({remote.rsplit("/",1)[0] for _,remote in pairs if "/" in remote})
    lines=[f"mkdir -p -f {lftp_quote(d)}" for d in dirs]
    lines+=[f"put {lftp_quote(str(local))} -o {lftp_quote(remote)}" for local,remote in pairs]
    path.write_text(("\n".join(lines)+"\n") if lines else "# no files to upload\n", encoding="utf-8")
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--remote-manifest",default=".deploy-remote.sha256.tsv")
    ap.add_argument("--audio-manifest",default=".audio-deploy/manifest.json")
    ap.add_argument("--output",default=".deploy-plan")
    args=ap.parse_args()
    out_dir=Path(args.output); out_dir.mkdir(parents=True, exist_ok=True)
    runtime=[(Path(local),remote) for local,remote in STATIC_FILES]
    runtime += [(Path("battle")/name, f"battle/{name}") for name in BATTLE_FILES + GENERATED_FILES]
    runtime += [(p,p.as_posix()) for p in sorted(Path("battle/modules").glob("*.js"))]
    runtime += [(p,p.as_posix()) for folder,pattern in SOLDIER_ASSET_GLOBS for p in sorted(Path(folder).glob(pattern))]
    # Uploaded with the runtime, ahead of the manifest in `post`, so the manifest never goes
    # live naming a clip the server does not have yet.
    runtime += [(p,p.as_posix()) for folder,pattern in AUDIO_ASSET_GLOBS for p in sorted(Path(folder).glob(pattern))]
    post=[(Path(args.audio_manifest),"Assets/audio/manifest.json")]
    absent=missing_private_clips(Path(args.audio_manifest))
    if absent: raise SystemExit(f"{len(absent)} audio clip(s) missing (first: {absent[0]}); "
                                "run scripts/fetch_private_audio.sh to overlay APPARANYX/grasstex-audio first")
    managed=runtime+post
    missing=[str(local) for local,_ in managed if not local.is_file() or local.stat().st_size<=0]
    if missing: raise SystemExit("missing/empty managed deployment file(s): "+", ".join(missing))
    current={remote:sha256(local) for local,remote in managed}
    remote_path=Path(args.remote_manifest)
    remote_state_available=remote_path.is_file()
    previous=read_remote_manifest(remote_path)
    runtime_uploads=[(local,remote) for local,remote in runtime if previous.get(remote)!=current[remote]]
    post_uploads=[(local,remote) for local,remote in post if previous.get(remote)!=current[remote]]
    clobbered=sorted(remote for remote in current if is_protected(remote))
    if clobbered: raise SystemExit("refusing to upload over protected server file(s): "+", ".join(clobbered))
    stale=sorted(remote for remote in previous if remote not in current)
    deletes=[remote for remote in stale if DELETABLE.match(remote) and not is_protected(remote)]
    kept=[remote for remote in stale if remote not in deletes]
    if kept: print("Not deleting "+str(len(kept))+" stale state entr(ies) outside battle/modules/*.js or protected: "+", ".join(kept))
    if len(deletes)>MAX_DELETES:
        raise SystemExit(f"refusing to delete {len(deletes)} remote modules (limit {MAX_DELETES}; set DEPLOY_MAX_DELETES to override): "+", ".join(deletes))
    write_commands(out_dir/"uploads.lftp",runtime_uploads)
    write_commands(out_dir/"post-uploads.lftp",post_uploads)
    (out_dir/"deletes.lftp").write_text(("\n".join(f"rm -f {lftp_quote(remote)}" for remote in deletes)+"\n") if deletes else "# no managed files to delete\n",encoding="utf-8")
    (out_dir/"current.sha256.tsv").write_text("".join(f"{current[remote]}\t{remote}\n" for remote in sorted(current)),encoding="utf-8")
    summary={"remoteStateAvailable":remote_state_available,"managedFiles":len(managed),"runtimeUploads":len(runtime_uploads),"postUploads":len(post_uploads),"deletes":len(deletes),"unchanged":len(managed)-len(runtime_uploads)-len(post_uploads)}
    (out_dir/"summary.json").write_text(json.dumps(summary,indent=2)+"\n",encoding="utf-8")
    if not remote_state_available: print("No remote deployment hash state found: bootstrapping with one full managed-runtime upload.")
    print(f"Incremental deploy plan: {summary['runtimeUploads']} runtime upload(s), {summary['postUploads']} post upload(s), {summary['deletes']} delete(s), {summary['unchanged']} unchanged/skipped.")
if __name__=="__main__":
    main()
