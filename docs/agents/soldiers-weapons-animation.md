## Soldiers, weapons, animation

AI requests semantic tags and the backend renders them. The tags are `locomotion.idle|walk|crouch-walk|prone-crawl`,
`combat.aim|fire|reload|hit`, `stance.stand|crouch|prone` and `death.front|back|side`, and
`BattleSoldierModel.TAGS` is the source of truth. The backend (`modules/53-fbx-soldier-backend.js`)
never decides tactics, ammo, hits or paths.

- Models, one per class (`MODEL_SETS` in the backend, keyed by role): `Assets/soldiers/{us,ge}-captain.fbx`
  (sergeant; the file keeps its old name), `-scout`, `-gunner`, `-engineer`, and `-paratrooper` for
  riflemen and any role without a model. `?soldiers=rifleman` shows the older `-rifleman-rigged.fbx`.
- Clips: `Assets/animations/*.fbx` (Mixamo rig with fingers, named `<description> - <clip name>`),
  keyed in `CLIPS`, `FAMILIES` (8-way) and `FOUR_WAY` in `modules/53-fbx-clip-table.js`
  (`BattleFbxClips`, data only). The battle fetches only those files, and the lab loads the same table
  for its **Show all animation clips** toggle (off: only in-game clips; on: all, in-game marked ●).
  Bone names are canonicalised at load, so `mixamorig:` and older rigs bind the same clips.
- **Prepared clips.** The battle loads every `CLIPS` entry from one file,
  `Assets/animations/prepared-clips.bin` (~4.5 MiB instead of ~36 MiB of clip FBX), already through
  `sourceRig` + `convertClip`; retargeting onto each model still runs at load. A clip whose spec no
  longer matches `CLIPS` loads from its FBX. **After changing a clip FBX, `CLIPS` or the conversion
  code, rebuild it** with the repo served: `NODE_PATH=$(npm root -g) node scripts/build_clip_pack.cjs`
  (the backend's own code in headless Chromium; byte-for-byte repeatable). `check_clip_pack.cjs`
  fails CI and the deploy until then. Changing the pack's layout or meaning means bumping
  `CLIP_PACK_FORMAT`. The Motion Lab still reads FBX.
- Weapons (the model `BattleWeapons.PROFILES` names per side and kind): rifle Garand / Kar98k, LMG M1919A6 /
  MG42 (folded-bipod carry variants), scouts M1 Carbine / FG42, sergeants Thompson / MP40,
  sidearms M1911A1 / P38 (sergeants and gunners carry one holstered). Babylon is pinned to `babylonjs@9.27.1`.
- **Weapon seats and sidecars.** Hand contacts and weapon points default to `SOLDIER_CONTACTS`,
  `WEAPON_POINTS` and `WEAPON_MODEL_POINTS`. A per-model sidecar `Assets/soldiers/<model>.fbx.json`
  (contacts, one slot per weapon: grip / fore-near / fore-far, pistol arm and wrist dials) overrides
  them; the backend fetches it on load (`BattleFbxSoldier.sidecars()` lists what loaded). Measure in
  `labs/fbx-animation-lab.html` (pick model, clip and weapon, click the contact vertices, **Seat
  weapon**, then **Per-model sidecar** → Save), which posts to `labs/save-calibration.php` (validated
  numbers, existing soldier FBX names only). Saving needs the lab password, asked once per browser;
  its hash lives only on the host in `state/lab-key.php` (`<?php return '<sha256 hex>';`, from
  `printf '%s' 'password' | shasum -a 256`), and without that file saving is off. Pistol slots
  never carry fore points (one-hand hold, in the lab and the game). Only `us-captain` has one on the host. Its weapon slots are embedded in the backend as `DEFAULT_SEATS`
  and fill every model's missing slots (a model's own sidecar and a `WEAPON_MODEL_POINTS` exception win;
  contacts stay per model). Sidecars are server-owned:
  never committed, never deployed or deleted.
- Clips are retargeted at load (rest pose, units, hip height), in quaternions (`retargetRotations`). Looping clips have hip drift removed,
  and that drift becomes their natural ground speed. Playback rate is ground speed ÷ clip speed.
  The upper-body overlay (aim/fire/reload) sits on the lower locomotion layer. The weapon grip snaps
  to a right-palm anchor, the fore-end runs through the left palm, and aim uses a capped spine twist (≤40°).
- No fallback in the game: the page waits for the FBX soldiers however long they take, and a failed
  load shows the load error (`BattleSoldierModel.preload` rejects). Each soldier is a bare body
  (`BattleSoldierModel.createBody`: root, pose root, weapon socket, no meshes) wearing his model,
  with `rig===null` and a `_fbx` binding. The procedural rig in `battle/soldier.js` is only the body
  the trainer and headless benchmark use (`setImportedEnabled(scene,false)`); those soldiers keep
  their `rig` object. `scripts/probe_soldier_load.cjs` checks both the normal load and a blocked
  asset.
- **Animation LOD** (`53-fbx-soldier-backend.js`, `BattleFbxSoldier.lod`, presentation only): the
  render hook re-poses a soldier every frame within 35 m of the camera, at ~30 Hz within 100 m and
  ~10 Hz beyond (each on his own phase), never while he is outside the view frustum, and only once
  while his pose inputs are static (a finished death clip, a paused sim). Shadow-aware: a soldier
  whose meshes cast shadows (in any shadow generator's caster list, or any generator with a
  `renderListPredicate`) is held off-screen only when the ground his shadow falls on is out of view
  too; `scripts/probe_lod_shadows.cjs` proves it with positive and negative controls. Add soldier
  shadow casters through a ShadowGenerator and the LOD follows, with nothing to register. Clip clocks stay on sim
  time. A held soldier's skeletons are not re-prepared either: Babylon's `Skeleton.prepare` would copy
  every linked bone node and rebuild and re-upload the bone matrices each frame, so each soldier's
  skeletons prepare once per pose (`lod.skeletons`). `?animLod=0` turns both off.
  **Off-screen culling** (`BattleFbxSoldier.cull`): bind makes soldier meshes always active (their
  bounds are the bind pose), so Babylon never culled them and the GPU skinned all 100 every frame. The
  render hook now disables a soldier's meshes while a 3 m sphere around him is out of view and no
  shadow of his could be in it (the LOD's shadow rule); weapons and decals are culled by Babylon.
  `?soldierCull=0` draws them all; `probe_soldier_cull.cjs` proves the frames identical. Thresholds are tuned from close-ups, never tied to gameplay.
- **Soldier mesh LOD** (`53-fbx-soldier-backend.js`, `BattleFbxSoldier.meshLod`, presentation only):
  beyond `far` (45 m, 3 m hysteresis) a soldier draws a meshoptimizer-simplified triangle list
  (~12%: ~1,250 of ~10,400 triangles, ~1,300 of ~22,000 vertices) over his model's own vertex
  buffer, so bone weights, clips, poses and the animation LOD are unchanged. The lists are built once
  per model when meshoptimizer (jsDelivr) arrives, which never holds the load; without it soldiers
  draw at full detail (`meshLod.failed` says why). The models ship unwelded, so they are welded by
  position for the simplifier (`Sparse`), and each kept corner takes the vertex whose UV agrees
  with its triangle, so texture seams hold. `?soldierLod=0` turns it off; tune `far`
  from `probe_soldier_mesh_lod.cjs`. Baking the lists offline belongs with the startup item in Open issues.
- Wired beyond the basics: turn-in-place (standing, crouch, prone), death pools, hit reactions
  (`combat.hit`), idle variants and suppression flinches. Still unused: prone roll right (a left roll
  needs mirroring) and the kneel set. Jump clips need a nav vault edge.
  The grenade action uses standing, crouched and prone throw clips (`combat.throw`), with
  their measured release phase retimed to the simulation's windup. Imported GLB Mk 2/M24 props
  follow the right palm, then the immutable simulated flight; the rifle is slung during the clip.
  Regenerate the original project-authored props with `tools/build-grenade-models.py` in Blender.
  `scripts/probe_grenade_presentation.cjs` checks imported props, throw clips, attachment and restart.
  Not in the pack: sideways crawl, melee, limp, climb, window lean.

**Vehicle Animation Lab (authoring only).** `labs/vehicle-animation-lab.html` is the
Vehicles category reachable from the existing FBX Motion Lab. It imports deployed
`Assets/vehicles/*.{fbx,glb}` through `labs/asset-list.php`, shares the pinned Babylon FBX
loader with the soldier lab, and can load any matching `Assets/animations/*Truck*.fbx`
as per-seat passenger or driver poses. The vehicle lab defaults to two-sided rendering of vehicle materials
(`backFaceCulling=false`, `twoSidedLighting=true`; toggleable at runtime).
That reveals inward-facing polygons but cannot repair absent faces or missing
texture data. The lab also has read-only **surface diagnostics**: unlit-material
preview, contrasting background to identify missing polygons/holes, and truck
mesh clicking that reports material name, texture channels, UVs and normals.
The **Show full crew** button selects a German paratrooper model
when available, fills all four starter seats, and previews the available
Driving/Sitting clips. The author places editable seat anchors
(position in vehicle-local metres, yaw, role, occupied flag and animation filename)
on the vehicle's normalized 6.2 m preview; `FrontWheels` and `RearWheels` hierarchy
names are inspected but not blindly spun (a group containing both wheels may not
have independent wheel pivots). Axle **FrontWheels/RearWheels** group roots are reparented under separate
calibration pivots at the measured bounds centers; Babylon `setParent`
preserves their import-world transforms. The front/rear center position and
X/Z rotation axis are editable independently in vehicle-root-local metres,
with clickable hub selection and visible center/axis markers. Adjusting a
pivot compensates wheel-root local positions to keep the wheels visually fixed
at the zero spin angle; actual axle pivots belong in the gameplay renderer
only after verified. JSON **version 2** includes optional
`axles.front/rear: {center:[x,y,z], axis:'x'|'z'}` alongside seats, while
old version-1 seat-only JSON still imports; neither is uploaded automatically.
JSON seat and axle configs can be downloaded/imported or saved locally;
no calibration is written to production, and no gameplay transport logic is
changed. The preview's normalized length is a **calibration aid**, not a
historically verified vehicle dimension; the transport renderer must adopt a
confirmed transform and seat contract before consuming any sidecar.

**Strategic battlefield integration (#545).** The opt-in transport renderer applies the same independent FrontWheels/RearWheels auto-centered-pivot approach at truck instantiation and advances visual rotation by actual carrier distance, not frame time. No gameplay movement authority or passenger state is changed by wheel visuals. The lab's editable JSON v2 axle calibration remains an authoring/diagnostic aid; it is not silently loaded into live battles.

**Asset pipeline.** Use the Blender app bundle `/Applications/Blender.app/Contents/MacOS/Blender`, not the
broken `blender` on PATH. Use lowercase filenames, since the host is case-sensitive (`git mv` to rename).

**Approved runtime-format direction (2026-09-27):** FBX is the authoring/ingress format, not the
long-term browser runtime format. The pipeline should convert FBX soldiers/clips/weapons as needed
into measured game-ready artifacts (GLB/glTF or a compact custom representation) and ship those
prepared outputs. Keep raw/source FBX for regeneration and Motion Lab/source workflows where needed;
do not make production clients repeat deterministic parsing, resampling or rig-preparation work that
can be done once offline.

**R3 ownership update (audit #456, October 11):** the approved audit decomposes the backend
behind its existing semantic tag contract. `52-fbx-animation-state.js` owns event/tag decisions,
reaction presentation and simulation-time clip clocks. `52-fbx-render-pose.js` owns rendered bone
poses, overlay composition, weapon support, spine aiming and pistol cup IK; its private scratch
objects are per backend and its LOD clock dependency stays live. Import, conversion, retarget,
prepared-pack, library lifecycle, calibration, wounds and render cadence have separate owners.
The backend binds these modules and preserves the public `BattleFbxSoldier` interface.
Any further split must retain clip-pack SHA integrity, packed/raw bit parity, real-model pose/IK
parity (`scripts/probe_fbx_render_pose.cjs`), player/touch/restart QA and visual lineup acceptance.
R3 overall requires dynamic visual and prolonged frame/heap acceptance before it can close.

```bash
Blender -b --factory-startup --python tools/fix-soldier-model.py -- --input raw.fbx --output Assets/soldiers/<fac>-<name>.fbx --texture-name <fac>-<name>-albedo [--fit-skin]
Blender -b --factory-startup --python tools/prepare-weapon-model.py -- --input raw.fbx --output Assets/weapons/<name>.fbx --name <name> --length <m> [--fold-bipod]
python3 tools/prepare-muzzle-flashes.py --input pack.zip --output Assets/effects/muzzle-flash   # update FLASH_COUNT if count changes
```

Soldier FBX requirements: one skinned mesh, the shared bone names (`Hips`, `Spine02/01/Spine`, `neck`,
`Head`, `Left/Right Shoulder/Arm/ForeArm/Hand/UpLeg/Leg/Foot/ToeBase`), no normal maps, and a unique
embedded albedo name. Weapon layout: barrel on +Z, butt 0.40 m behind the grip, barrel top +0.03 m.
Lengths: Garand 1.107, Kar98k 1.11, MG42 1.224, M1919A6 1.346, M1 Carbine 0.904, FG42 0.975,
Thompson 0.857, MP40 0.833, M1911A1 0.216, P38 0.216 (pistols add `--butt 0.06`). A generator
character in an A-pose must be moved to the library's T-pose rest first (`tools/match-rest-pose.py
--rest-from <library clip>`, refuses above 1°); an unrigged one borrows a rigged twin's weights
(`tools/rig-soldier-model.py`). `tools/blender-presets/` holds the matching manual FBX export presets.

Before committing, run the lineup: `node scripts/fbx-soldier-lineup.cjs` against the local server
checks every faction/role model + weapon pair and the two-hand hold, and writes close-ups to
`$FBX_OUT` (`FBX_CHROME` picks a browser; visual PASS is still a human judgement: lit, no holes,
factions textured differently, weapon on the hands). Source `.zip` packs are not tracked
any more (removed in the repo-hygiene pass; recover one from git history with
`git checkout <sha> -- <path>` when a re-export is needed, or re-download the generator
pack); new generator packs in `Assets/soldiers/new/` are gitignored. Only the `.fbx` deploys.


Mounted soldiers keep camera-distance mesh LOD updates while the seat owns their animation pose; approaching the truck restores the full mesh just as it does for infantry. Crew sight exempts only the boarded observer's own truck envelope. Other trucks and static cover still occlude sight. Dismount processes any free occupied exit independently and uses reachable flank/front assembly space when the usual rear line is obstructed. Fully blocked exits remain seated until safe space opens.
