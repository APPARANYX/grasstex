# Player-mode feedback (battle UI)

Implementation: `battle/camera-controls.js` (player possession/HUD/haptic input),
`battle/modules/41-squad-status-overlay.js` (offscreen tactical unit cues).
This is a presentation layer plus a **player-only sprint budget**; combat hits,
casualties, wounds, shooting, and AI orders remain with their existing owners.

## HUD and damage feedback

- Tap standard gamepad **Menu/Start** to enter player mode or switch to another living
  soldier of your current faction; hold Menu for **650 ms** to open **Player Settings**.
  Desktop **P** still enters/switches soldiers; **O** opens the settings panel.
  The menu supports faction (US/Germany), active unit/squad, and individual living soldier
  selection, plus a haptic feedback toggle. D-pad up/down changes fields, left/right changes
  selections, **A** deploys/toggles haptics, **B** backs out; keyboard, mouse and touch can
  operate the native selectors and buttons. Menu pauses a running battle while open,
  resumes only if it initiated the pause, and blocks player movement/firing underneath.
  Selection never creates a soldier and refuses dead or stale roster entries.
- The lower-left HUD
  shows current soldier/faction, soldier `hp / maxHp`, stamina, and wound-model
  `bleedRate` with explicit bleeding/wounded/stable statuses.
- The player stamina budget starts at 100 on possession, drains 12 points per
  second of active running, and recovers at 12 points/second while moving slowly
  or 18 while idle. Once exhausted, running resumes after reaching 25 points.
  Paused and finished battles do not advance this budget. AI movement is unchanged.
- A **new wound** generates a red feathered screen-space arc at the shooter's
  world bearing, relative to the player's current camera yaw. The arc rotates as
  the player looks around, fades over 1.7 seconds, and does not pulse again for
  subsequent bleeding ticks. The source is taken from the wound model's
  `_lastHitBy` reference and sampled when that new wound is observed.
- Successful `SquadAI.playerFireRay` triggers brief haptics; a new wound
  triggers a stronger haptic. Unsupported `Gamepad.vibrationActuator`,
  legacy `hapticActuators`, and `navigator.vibrate` APIs are silent no-ops.
  On many iOS browsers, phone haptics are not exposed through the web.
  Vibration can never authorize a shot or change hit simulation.
- HUD and damage arc disappear when player possession ends. There are no
  on-screen touch fire/movement buttons added here; phone controls still
  require the existing compatible controller path.

## Third-person aiming reticle and shot feedback

- The fixed 15 px camera-center reticle now has **1 px strokes** instead of two thick
  solid bars. A brief X flashes over it **only when an authoritative ballistic round
  actually struck an enemy soldier**. It does not activate for shots fired into
  cover, empty magazines, misses, or friendly/noncombat contact. Multiple hits in
  the same burst aggregate; selection resets the marker to the new soldier's hits.
- A **separate 4 px hollow bore ring** projects the soldier's bore-line first contact
  onto the actual camera screen using `BattleBallistics.previewPlayerRay`.
  The preview shares the simulated muzzle, enemy body ellipsoids, terrain and
  physical-cover blockers with real rounds. It is sampled at most every 90 ms,
  and **never consumes combat RNG, damages soldiers, or emits shot events**.
  The preview deliberately excludes random dispersion: actual rounds still scatter.
  The ring position eases in screen space (80 ms exponential response, with frame
  deltas capped at 50 ms) rather than snapping on low-FPS frames. A newly visible
  point initializes at the correct position; leaving player mode or switching
  soldiers clears the old smoothed position. For 160 ms after an accepted shot,
  the ring instead shows the fired round's
  **recorded ballistic impact**, then returns to the stable bore preview.
  No target lock, target selection or automatic aim correction is introduced.
  The two indicators intentionally need not overlap, especially next to walls or
  when the muzzle is low in crouch/prone. That discrepancy is useful feedback,
  not a command to bend the bullet toward the camera center.
- Holding **RMB/LT to aim** now applies a **0.18 sensitivity multiplier** to
  both mouse X/Y and right-stick X/Y, while unzoomed looking remains unchanged.
  This scales look motion only, not weapon dispersion, ballistic accuracy or
  AI movement.
- All reticle elements clear on player exit or transfer. When the physical
  contact projects behind the camera or outside its viewport, the dot hides
  rather than lying about impact position.

## Offscreen squads

The tactical squad overlay retains its existing on-screen historical symbols.
When a squad is outside the camera projection (including behind it), it shows
a faction-colored, labeled edge chevron. For a unit in front of the camera,
the pointer follows a ray from **screen center toward that unit's actual
projected screen coordinate**, intersected with the safe inset screen rectangle.
This respects perspective, camera pitch, ultrawide aspect ratio and canvas
offset—unlike the old flat compass ellipse that pointed up for any unit ahead.
Behind-camera units deliberately use camera-relative rear/left/right bearings
because the perspective projection flips behind the camera.

An offscreen mission objective has a separate compact edge diamond labeled
OBJ. A long-range command-intent curve is now displayed **only while both
the squad and destination markers are onscreen**. Drawing curves from an
offscreen edge anchor made soldiers appear to assault objectives 'from space';
the edge cues now remain independent until both endpoints enter view.
The on-screen arrow wipe plays when the command first becomes visible, but
does not invent extra orders or change any squad/Movement authority.
The overlay toggle continues to control these indications.

Visual smoke: from player mode on a fixed seed, look level at friendly squads
that are offscreen ahead, behind and to either side. The chevron must intersect
the inset **screen rectangle** in the same direction as the unit's projected
screen position (not automatically at the top merely because the unit is ahead).
Turn and pitch the camera until the objective moves behind the view; its diamond
must stay rearward, and there must be no long movement spline painted from an
offscreen border into empty sky. On-screen command movement remains unchanged.

## Regression checks

- `node tools/ai-sim-harness/player-control-check.js` (Menu tap/hold timing and roster safety)
- `node tools/ai-sim-harness/squad-status-overlay-check.js` (projected bearings,
  rear-camera fallback, rectangular edge intersection, and offscreen-only cues)
- Low-frame-rate aim smoke: pan near a crest at 60 FPS and throttled 10–20 FPS.
  The small unfilled ring should ease toward muzzle parallax, not snap across
  the viewport; the center reticle and the actual bullet impact remain authoritative.
- Manual smoke: switch possession, sprint to exhaustion/recovery, fire a loaded
  weapon and an empty one, aim near a wall/crest and verify the dot separates from center, score enemy hits and misses,
  compare zoomed/unzoomed mouse and right-stick look, take a hit from several bearings and turn, confirm
  bleed status continues without repeated vibration, look behind offscreen
  squads, and exit player mode. Check haptics on supported physical devices.
