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

## Offscreen squads

The tactical squad overlay retains its existing on-screen historical symbols.
When a squad is outside the camera projection (including behind it), its marker
is replaced by a faction-colored, labeled edge chevron following the squad's
world-space bearing. If the squad/destination is offscreen, the existing
momentary long-range command arrow connects to clamped screen-edge anchors.
The overlay toggle continues to control these indications.

## Regression checks

- `node tools/ai-sim-harness/player-control-check.js` (Menu tap/hold timing and roster safety)
- `node tools/ai-sim-harness/squad-status-overlay-check.js`
- Manual smoke: switch possession, sprint to exhaustion/recovery, fire a loaded
  weapon and an empty one, take a hit from several bearings and turn, confirm
  bleed status continues without repeated vibration, look behind offscreen
  squads, and exit player mode. Check haptics on supported physical devices.
