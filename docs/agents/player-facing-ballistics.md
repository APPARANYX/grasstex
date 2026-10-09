# Player weapon facing versus independent third-person camera

A third-person camera can orbit past the soldier's shoulders without rotating the body.
A possessed soldier's ballistic origin must **never** move behind the body just
because the camera crosshair is pointing behind it.

- `BattleBallistics.muzzleOrigin` places **player** muzzle positions along the
  real soldier root yaw. AI muzzle placement retains its target-facing behavior.
- `BattleBallistics.playerBoreDirection` is the single constrained aiming basis
  for both `resolvePlayerRay` and `previewPlayerRay`. Maximum sideways yaw
  relative to the body: prone 0.20 rad, crouch 0.32 rad, stand 0.38 rad.
  Pitch is limited to ±0.55 rad.
- The player may orbit the camera freely. Aiming/firing posts an
  `Engagement.playerFace` hint to the existing movement turn integrator. The
  soldier rotates at its existing stance-specific rate, which eventually brings
  the gun and camera into alignment. The FBX visual aim receives the constrained
  bore endpoint too, so gun animation and fired rounds share the same forward arc.
  If the camera is more than 90 degrees behind the body, the weapon keeps
  pointing straight ahead until the soldier turns. No shot can travel backward
  or sideways merely because the player orbited the view.
- The separate muzzle indicator shows the preview's actual restricted bore
  contact (with normal terrain and body occlusion). It is not target-lock or
  aim assist, and the real round still uses the existing weapon dispersion.
- AI fire behavior was **not changed**. Engagement already uses `AIM_CONE=0.22`
  to enforce its own target-facing fire readiness.

## Regression

`node tools/ai-sim-harness/player-facing-bore-check.js`

Covers prone 180-degree and 90-degree camera/soldier mismatch, crouch/standing
limits, normal forward enemy hits, and unchanged AI muzzle semantics. Also run
the existing player-control and prone-terrain / ballistics geometry tests.

Visual QA: on a low hill, lie prone, orbit the camera 180 degrees without
turning the soldier, then fire. A bullet must not go backward through the
model. Hold aim and watch the soldier turn before firing toward the new
camera bearing. Repeat standing and crouched.
