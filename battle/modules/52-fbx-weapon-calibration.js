/* Weapon points and Motion Lab sidecar calibration for the imported FBX soldiers.
   Pure model/weapon values and per-model calibration state only: the backend still owns
   asynchronous sidecar fetch, scene assets, Babylon transforms and weapon sockets. */
(function (root) {
  'use strict';
  if (root.BattleFbxWeaponCalibration) return;
  /* Right-hand grip point in each weapon mesh's local space (metres), as in soldier.js GRIPS. */
  var GRIP = {
    rifle: [0, -0.055, -0.12],
    carbine: [0, -0.055, -0.09],
    smg: [0, -0.055, -0.09],
    lmg: [0, -0.07, -0.02],
    pistol: [0.02, -0.07, 0]
  };
  /* Weapon reference points in local metres after prepareWeapon (barrel +Z). `trigger` is the
   centre of the visible trigger/guard, measured from the prepared mesh's side profile. The
   right palm sits behind it at `grip`, over the stock wrist or pistol grip, not on the trigger
   itself; `fore` records the support hand's fore-end range. */
  var WEAPON_POINTS = {
    'm1-garand.fbx': { trigger: [0, -0.08, -0.03], grip: [0, -0.065, -0.06], fore: [0, -0.025, 0.06, 0.42] },
    'kar98k.fbx': { trigger: [0, -0.08, -0.035], grip: [0, -0.05, -0.06], fore: [0, -0.01, 0.06, 0.45] },
    'mg42.fbx': { trigger: [0, -0.08, -0.025], grip: [0, -0.1, -0.09], fore: [0, -0.01, 0.15, 0.45] },
    'm1919a6.fbx': { trigger: [0, -0.1, 0.1], grip: [0, -0.14, 0.05], fore: [0, -0.05, 0.2, 0.6] },
    'm1-carbine.fbx': { trigger: [0, -0.075, -0.07], grip: [0, -0.055, -0.1], fore: [0, -0.015, 0.06, 0.26] },
    'fg42.fbx': { trigger: [0, -0.1, -0.055], grip: [0, -0.095, -0.12], fore: [0, -0.025, 0.08, 0.3] },
    'thompson.fbx': { trigger: [0, -0.08, 0.01], grip: [0, -0.1, -0.06], fore: [0, -0.015, 0.13, 0.34] },
    'mp40.fbx': { trigger: [0, -0.075, -0.055], grip: [0, -0.1, -0.125], fore: [0, -0.035, 0.06, 0.17] },
    /* Pistol frame sits deeper into the sergeant's right palm: back, toward body centre, lower. */
    'm1911a1.fbx': { trigger: [0, -0.07, 0.04], grip: [0.035, 0, 0.015], fore: null },
    'p38.fbx': { trigger: [0, -0.07, 0.03], grip: [0.035, -0.005, 0.01], fore: null },
    rifle: { grip: GRIP.rifle, fore: [0, -0.05, 0.05, 0.35] },
    carbine: { grip: GRIP.carbine, fore: [0, -0.05, 0.04, 0.28] },
    smg: { grip: GRIP.smg, fore: [0, -0.05, 0.04, 0.28] },
    lmg: { grip: GRIP.lmg, fore: [0, -0.075, 0.15, 0.45] },
    pistol: { grip: GRIP.pistol, fore: null }
  };
  /* Per-model grip overrides for measured exceptions. Every model first uses its own hand-web
   anchors with the weapon's physical grip point. An override wins only when a posed lineup
   shows that a particular model/weapon pair needs a different contact point. */
  var WEAPON_MODEL_POINTS = {
    /* The GE scout's 0.342 m aiming web spacing exceeds the generic MP40 fore-end limit.
     Its barrel jacket continues here, so put the left hand on that reachable surface. */
    'ge-scout.fbx': {
      'mp40.fbx': { trigger: [0, -0.075, -0.055], grip: [0, -0.1, -0.125], fore: [0, -0.035, 0.06, 0.23] }
    }
  };
  /* Runtime sidecar overlays (Assets/soldiers/<model>.json, written by the Motion Lab):
   SIDE_MODEL_POINTS[model][weapon] wins over WEAPON_MODEL_POINTS, SIDE_CONTACTS[model]
   wins over SOLDIER_CONTACTS, SIDE_ARM[model][weapon] carries the lab's left-arm dial
   degrees {shoulder,elbow,wrist} for that pair (pistol support cup), SIDE_LEFT_GRIP
   carries its right-hand-local support target, and
   SIDE_WRISTR[model][weapon] the right-wrist dial (straight stocks, finger on trigger). */
  var SIDE_MODEL_POINTS = {},
    SIDE_CONTACTS = {},
    SIDE_ARM = {},
    SIDE_WRISTR = {},
    SIDE_LEFT_GRIP = {};
  function isSideTriplet(a) {
    return (
      Array.isArray(a) &&
      a.length === 3 &&
      a.every(function (n) {
        return typeof n === 'number' && isFinite(n);
      })
    );
  }
  function applySidecarData(file, data) {
    if (!file || !data) return;
    if (
      data.contacts &&
      (isSideTriplet(data.contacts.right) ||
        data.contacts.right === null ||
        isSideTriplet(data.contacts.left) ||
        data.contacts.left === null)
    ) {
      SIDE_CONTACTS[file] = { right: data.contacts.right || null, left: data.contacts.left || null };
    }
    var weapons = data.weapons || {};
    Object.keys(weapons).forEach(function (w) {
      var slot = weapons[w] || {};
      if (!isSideTriplet(slot.grip) && !(slot.grip === null)) return;
      var fore = null;
      if (isSideTriplet(slot.foreNear) && isSideTriplet(slot.foreFar)) {
        // Backend fore shares x/y: [x,y,zNear,zFar]. The lab warns when near/far x/y differ.
        fore = [slot.foreNear[0], slot.foreNear[1], slot.foreNear[2], slot.foreFar[2]];
      }
      var base = WEAPON_POINTS[w] || WEAPON_POINTS.rifle;
      (SIDE_MODEL_POINTS[file] || (SIDE_MODEL_POINTS[file] = {}))[w] = {
        trigger: (base && base.trigger) || [0, 0, 0],
        grip: slot.grip ? slot.grip.slice() : base && base.grip ? base.grip.slice() : [0, 0, 0],
        fore: fore
      };
      /* Right-wrist dial for straight stocks: rotate the firing hand so the finger meets
       the trigger. Stored only when non-zero; applied with the same yaw/pitch/roll
       order as the lab preview, ahead of the hand chains. */
      if (
        isSideTriplet(slot.wristR) &&
        slot.wristR.some(function (n) {
          return Math.abs(n) > 1e-9;
        })
      ) {
        (SIDE_WRISTR[file] || (SIDE_WRISTR[file] = {}))[w] = slot.wristR.slice();
      }
      if (isSideTriplet(slot.leftGripR)) {
        (SIDE_LEFT_GRIP[file] || (SIDE_LEFT_GRIP[file] = {}))[w] = slot.leftGripR.slice();
      }
      var arm = slot.armDeg;
      if (arm && (isSideTriplet(arm.shoulder) || isSideTriplet(arm.elbow) || isSideTriplet(arm.wrist))) {
        var nz = function (a) {
          return (
            isSideTriplet(a) &&
            a.some(function (n) {
              return Math.abs(n) > 1e-9;
            })
          );
        };
        if (nz(arm.shoulder) || nz(arm.elbow) || nz(arm.wrist)) {
          (SIDE_ARM[file] || (SIDE_ARM[file] = {}))[w] = {
            shoulder: arm.shoulder ? arm.shoulder.slice() : [0, 0, 0],
            elbow: arm.elbow ? arm.elbow.slice() : [0, 0, 0],
            wrist: arm.wrist ? arm.wrist.slice() : [0, 0, 0]
          };
        }
      }
    });
  }
  /* Weapon seats measured on the US sergeant (us-captain.fbx.json, Motion Lab), the only model with a
   sidecar: the fallback for every model that has none, so a man holding a weapon another model was
   never seated for gets a measured grip, fore-end, wrist and pistol-cup seat instead of the generic
   point. A model's own sidecar slot wins, so does a WEAPON_MODEL_POINTS exception, and contacts stay
   per model (hand-web offsets belong to one body). Never overwrites a sidecar that loaded. */
  var DEFAULT_SEATS = {
    'kar98k.fbx': {
      'grip': [-0.011, -0.034, -0.107],
      'foreNear': [0.013, -0.0237, -0.147],
      'foreFar': [0.013, -0.0237, 0.6189],
      'trigger': [-0.0098, -0.0607, -0.0585],
      'armDeg': { 'shoulder': [0, 0, 0], 'elbow': [0, 0, 0], 'wrist': [0, 0, 0] },
      'wristR': [-1, -17, 18]
    },
    'm1-carbine.fbx': {
      'grip': [-0.011, -0.018, -0.125],
      'foreNear': [0.017, -0.035, -0.147],
      'foreFar': [0.017, -0.035, 0.6189],
      'trigger': null,
      'armDeg': { 'shoulder': [0, 0, 0], 'elbow': [0, 0, 0], 'wrist': [0, 0, 0] },
      'wristR': [-11, -17, 14]
    },
    'm1919a6.fbx': {
      'grip': [0.0196, -0.104, 0.0049],
      'foreNear': [0.017, -0.1, -0.147],
      'foreFar': [0.017, -0.1, 0.6189],
      'armDeg': { 'shoulder': [0, 0, 0], 'elbow': [0, 0, 0], 'wrist': [0, 0, 0] }
    },
    'fg42.fbx': {
      'grip': [-0.011, -0.075, -0.115],
      'foreNear': [0.017, -0.058, -0.147],
      'foreFar': [0.017, -0.058, 0.6189],
      'trigger': null,
      'armDeg': { 'shoulder': [0, 0, 0], 'elbow': [0, 0, 0], 'wrist': [0, 0, 0] },
      'wristR': [0, 0, 3]
    },
    'm1-garand.fbx': {
      'grip': [-0.011, -0.046, -0.076],
      'foreNear': [0.017, -0.035, -0.147],
      'foreFar': [0.017, -0.035, 0.6189],
      'trigger': null,
      'armDeg': { 'shoulder': [0, 0, 0], 'elbow': [0, 0, 0], 'wrist': [0, 0, 0] },
      'wristR': [-1, -17, 18]
    },
    'm1919a6-bipod.fbx': {
      'grip': [0.0196, -0.104, 0.0049],
      'foreNear': [0.017, -0.1, -0.147],
      'foreFar': [0.017, -0.1, 0.6189],
      'armDeg': { 'shoulder': [0, 0, 0], 'elbow': [0, 0, 0], 'wrist': [0, 0, 0] }
    },
    'm1911a1.fbx': {
      'grip': [0.0045, -0.0217, -0.027],
      'foreNear': null,
      'foreFar': null,
      'leftGripR': [-0.0138, 0.0844, -0.0208],
      'armDeg': { 'shoulder': [0, 0, -8], 'elbow': [0, -60, 20], 'wrist': [-23, -34, 0] },
      'wristR': [0, 0, 3]
    },
    'mg42-bipod.fbx': {
      'grip': [0.0196, -0.066, -0.094],
      'foreNear': [0.017, -0.029, -0.147],
      'foreFar': [0.017, -0.029, 0.6189],
      'armDeg': { 'shoulder': [0, 0, 0], 'elbow': [0, 0, 0], 'wrist': [0, 0, 0] }
    },
    'mg42.fbx': {
      'grip': [0.0196, -0.066, -0.094],
      'foreNear': [0.017, -0.029, -0.147],
      'foreFar': [0.017, -0.029, 0.6189],
      'armDeg': { 'shoulder': [0, 0, 0], 'elbow': [0, 0, 0], 'wrist': [0, 0, 0] }
    },
    'mp40.fbx': {
      'grip': [0.006, -0.067, -0.125],
      'foreNear': [0.017, -0.029, -0.147],
      'foreFar': [0.017, -0.029, 0.6189],
      'trigger': null,
      'armDeg': { 'shoulder': [0, 0, 0], 'elbow': [0, 0, 0], 'wrist': [0, 0, 0] },
      'wristR': [0, 0, 3]
    },
    'p38.fbx': {
      'grip': [0.0065, -0.0222, -0.027],
      'foreNear': null,
      'foreFar': null,
      'armDeg': { 'shoulder': [0, 0, 0], 'elbow': [0, 0, 0], 'wrist': [0, 0, 0] },
      'wristR': [0, 0, 3]
    },
    'thompson.fbx': {
      'grip': [0.0196, -0.077, -0.076],
      'foreNear': [0.017, -0.029, -0.147],
      'foreFar': [0.017, -0.029, 0.6189],
      'armDeg': { 'shoulder': [0, 0, 0], 'elbow': [0, 0, 0], 'wrist': [0, 0, 0] }
    }
  };
  function applyDefaultSeats(file) {
    var have = SIDE_MODEL_POINTS[file] || {},
      mine = WEAPON_MODEL_POINTS[file] || {},
      pick = {};
    Object.keys(DEFAULT_SEATS).forEach(function (w) {
      if (!have[w] && !mine[w]) pick[w] = DEFAULT_SEATS[w];
    });
    applySidecarData(file, { weapons: pick });
  }
  function pointsFor(file, kind) {
    var s = file && SIDE_MODEL_POINTS[file];
    if (s && s[kind]) return s[kind];
    var m = file && WEAPON_MODEL_POINTS[file];
    if (m && m[kind]) return m[kind];
    return WEAPON_POINTS[kind];
  }
  function armDegFor(modelFile, weaponFile) {
    var m = modelFile && SIDE_ARM[modelFile];
    return (m && weaponFile && m[weaponFile]) || null;
  }
  function wristRFor(modelFile, weaponFile) {
    var m = modelFile && SIDE_WRISTR[modelFile];
    return (m && weaponFile && m[weaponFile]) || null;
  }
  function leftGripFor(modelFile, weaponFile) {
    var m = modelFile && SIDE_LEFT_GRIP[modelFile];
    return (m && weaponFile && m[weaponFile]) || null;
  }
  root.BattleFbxWeaponCalibration = {
    WEAPON_POINTS: WEAPON_POINTS,
    WEAPON_MODEL_POINTS: WEAPON_MODEL_POINTS,
    SIDE_MODEL_POINTS: SIDE_MODEL_POINTS,
    SIDE_CONTACTS: SIDE_CONTACTS,
    SIDE_ARM: SIDE_ARM,
    SIDE_WRISTR: SIDE_WRISTR,
    SIDE_LEFT_GRIP: SIDE_LEFT_GRIP,
    applySidecarData: applySidecarData,
    applyDefaultSeats: applyDefaultSeats,
    pointsFor: pointsFor,
    armDegFor: armDegFor,
    wristRFor: wristRFor,
    leftGripFor: leftGripFor
  };
})(window);
