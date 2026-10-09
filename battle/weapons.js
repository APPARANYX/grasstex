/* Low-poly WW2 small arms + animation-friendly magazine/reload metadata. */
(function (root) {
  'use strict';
  if (typeof BABYLON === 'undefined') return;
  function c3(hex) {
    hex = hex.replace('#', '');
    return new BABYLON.Color3(
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255
    );
  }
  var WOOD = c3('5b3a20'),
    METAL = c3('2e2f29'),
    METAL_L = c3('54564c');
  function paint(mesh, color) {
    var n = mesh.getTotalVertices(),
      data = new Float32Array(n * 4);
    for (var i = 0; i < n; i++) {
      data[i * 4] = color.r;
      data[i * 4 + 1] = color.g;
      data[i * 4 + 2] = color.b;
      data[i * 4 + 3] = 1;
    }
    mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, data);
    return mesh;
  }
  function box(scene, size, color, pos) {
    var m = BABYLON.MeshBuilder.CreateBox('w', { width: size[0], height: size[1], depth: size[2] }, scene);
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    m.bakeCurrentTransformIntoVertices();
    return paint(m, color);
  }
  function cyl(scene, d, height, color, pos, rot) {
    var m = BABYLON.MeshBuilder.CreateCylinder('w', { diameter: d, height: height, tessellation: 6 }, scene);
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
    m.bakeCurrentTransformIntoVertices();
    return paint(m, color);
  }
  var sharedMat = null;
  function weaponMaterial(scene) {
    if (sharedMat && sharedMat.getScene() === scene) return sharedMat;
    sharedMat = new BABYLON.StandardMaterial('weaponMat', scene);
    sharedMat.specularColor = BABYLON.Color3.Black();
    sharedMat.ambientColor = new BABYLON.Color3(1, 1, 1);
    if (sharedMat.freeze) sharedMat.freeze();
    return sharedMat;
  }
  function buildRifle(scene, short) {
    var len = short ? 0.78 : 1.0,
      parts = [
        box(scene, [0.06, 0.09, len], WOOD, [0, 0, len * 0.15]),
        cyl(scene, 0.035, len * 0.62, METAL, [0, 0.01, len * 0.62], [Math.PI / 2, 0, 0])
      ],
      mesh = BABYLON.Mesh.MergeMeshes(parts, true, true, undefined, false, false);
    mesh.material = weaponMaterial(scene);
    mesh.isPickable = false;
    return { mesh: mesh, muzzle: [0, 0.01, len * 0.95] };
  }
  function buildLmg(scene) {
    var parts = [
        box(scene, [0.09, 0.11, 0.55], WOOD, [0, 0, 0.1]),
        cyl(scene, 0.05, 0.72, METAL, [0, 0.02, 0.55], [Math.PI / 2, 0, 0]),
        box(scene, [0.1, 0.16, 0.14], METAL_L, [0, -0.02, 0.3]),
        box(scene, [0.02, 0.22, 0.02], METAL, [0.05, -0.14, 0.82]),
        box(scene, [0.02, 0.22, 0.02], METAL, [-0.05, -0.14, 0.82])
      ],
      mesh = BABYLON.Mesh.MergeMeshes(parts, true, true, undefined, false, false);
    mesh.material = weaponMaterial(scene);
    mesh.isPickable = false;
    return { mesh: mesh, muzzle: [0, 0.02, 0.91] };
  }
  function buildPistol(scene) {
    var parts = [
        box(scene, [0.05, 0.12, 0.05], METAL, [0, -0.02, 0.02]),
        box(scene, [0.045, 0.06, 0.16], METAL_L, [0, 0.03, 0.11])
      ],
      mesh = BABYLON.Mesh.MergeMeshes(parts, true, true, undefined, false, false);
    mesh.material = weaponMaterial(scene);
    mesh.isPickable = false;
    return { mesh: mesh, muzzle: [0, 0.03, 0.19] };
  }
  var BUILDERS = {
    rifle: function (s) {
      return buildRifle(s, false);
    },
    carbine: function (s) {
      return buildRifle(s, true);
    },
    smg: function (s) {
      return buildRifle(s, true);
    },
    lmg: buildLmg,
    pistol: buildPistol
  };
  /* Per weapon kind, the generic numbers every soldier with that kind starts from.
     rof      aimed trigger pulls per second for semi-automatic and bolt-action fire;
     cyclic   rounds per second while the trigger is held (automatic weapons only). An automatic
              trigger pull is a burst of burst[0]..burst[1] rounds at the cyclic rate, then
              burstPause seconds to re-lay the gun; burstClimb widens each later round's group.
     damage   wound severity of a hit on the torso (hp); the wound model scales it by hit zone.
     power    cartridge energy class (full-power rifle 1.0): how likely a hit is to drop a man
              outright rather than wound him. */
  var STATS = {
    rifle: {
      label: 'M1-pattern rifle',
      damage: 55,
      power: 1,
      rof: 0.95,
      range: 140,
      falloffStart: 85,
      accuracy: 0.8,
      suppressive: false,
      magazine: 8,
      reloadTime: 2.6
    },
    carbine: {
      label: 'carbine',
      damage: 38,
      power: 0.62,
      rof: 1.35,
      range: 110,
      falloffStart: 65,
      accuracy: 0.76,
      suppressive: false,
      magazine: 15,
      reloadTime: 2.25
    },
    smg: {
      label: 'submachine gun',
      damage: 32,
      power: 0.55,
      rof: 2.4,
      cyclic: 10,
      burst: [3, 5],
      burstPause: 0.75,
      burstClimb: 0.12,
      range: 90,
      falloffStart: 45,
      accuracy: 0.62,
      suppressive: false,
      magazine: 30,
      reloadTime: 2.6
    },
    lmg: {
      label: 'light machine gun',
      damage: 55,
      power: 1,
      rof: 3.4,
      cyclic: 10,
      burst: [4, 7],
      burstPause: 0.95,
      burstClimb: 0.09,
      range: 165,
      falloffStart: 100,
      accuracy: 0.52,
      suppressive: true,
      magazine: 250,
      reloadTime: 6.5
    },
    pistol: {
      label: 'sidearm',
      damage: 28,
      power: 0.5,
      rof: 1.6,
      range: 55,
      falloffStart: 28,
      accuracy: 0.64,
      suppressive: false,
      magazine: 8,
      reloadTime: 2.0
    }
  };
  /* The weapon each side actually issued for a kind. A profile inherits the kind's numbers (so the
     practical ranges set in 10-effective-ranges.js apply to both) and overrides what differed.
     Sources: FM 23-5/23-45/23-55 and the German Merkblatt/H.Dv. figures for cyclic rates, capacity
     and feed; aimed rates are practical combat rates, not mechanical maximums.
       M1 Garand    .30-06, 8-rd en-bloc clip, semi-auto, ~30-40 aimed rpm
       Kar98k       7.92 mm, 5-rd stripper clip, bolt action, ~15-25 aimed rpm
       Thompson     .45 ACP, 30-rd box, ~700 rpm (M1A1)
       MP40         9 mm, 32-rd box, ~500-550 rpm
       M1919A6      .30-06, 250-rd belt, ~450-500 rpm, bursts of 4-6
       MG42         7.92 mm, 50/250-rd belt, ~1,200 rpm, bursts of 5-7 (climbs hard)
       M1911A1      .45 ACP, 7 rds; P38 9 mm, 8 rds
       M1 Carbine   .30 Carbine, 15-rd box, semi-auto; practical range ~180-270 m
       FG 42        7.92 mm (the rifle cartridge), 20-rd box, ~750 rpm; ~600 m maximum effective,
                    used at 100-400 m on semi-auto, since its recoil made automatic fire at range
                    wasted rounds. `autoWithin` is the distance inside which a trigger pull is a burst;
                    beyond it the weapon fires single aimed rounds at `rof`. `carried` overrides the
                    kind's combat load (46-ammunition-stoppages). */
  var PROFILES = {
    us: {
      rifle: { model: 'm1-garand', label: 'M1 Garand', magazine: 8, rof: 0.95, reloadTime: 2.4 },
      smg: {
        model: 'thompson',
        label: 'Thompson M1A1',
        magazine: 30,
        cyclic: 11.7,
        burst: [3, 5],
        burstClimb: 0.14,
        damage: 34,
        power: 0.6
      },
      lmg: {
        model: 'm1919a6',
        label: 'Browning M1919A6',
        magazine: 250,
        cyclic: 8,
        burst: [4, 6],
        burstPause: 0.95,
        burstClimb: 0.07,
        reloadTime: 7.5
      },
      carbine: { model: 'm1-carbine', label: 'M1 Carbine', magazine: 15 },
      pistol: { model: 'm1911a1', label: 'M1911A1', magazine: 7, damage: 30, power: 0.55 }
    },
    ge: {
      rifle: { model: 'kar98k', label: 'Karabiner 98k', magazine: 5, rof: 0.5, reloadTime: 3.2 },
      smg: {
        model: 'mp40',
        label: 'MP 40',
        magazine: 32,
        cyclic: 9.2,
        burst: [3, 6],
        burstClimb: 0.08,
        damage: 30,
        power: 0.5
      },
      lmg: {
        model: 'mg42',
        label: 'MG 42',
        magazine: 250,
        cyclic: 20,
        burst: [5, 8],
        burstPause: 1.0,
        burstClimb: 0.12,
        reloadTime: 6.0
      },
      carbine: {
        model: 'fg42',
        label: 'FG 42',
        damage: 55,
        power: 1,
        magazine: 20,
        carried: 160,
        rof: 0.9,
        cyclic: 12.5,
        burst: [3, 5],
        burstPause: 0.9,
        burstClimb: 0.2,
        autoWithin: 50,
        range: 450,
        falloffStart: 300,
        accuracy: 0.78,
        combatSigmaAt100: 0.11,
        rangeDispersion: 0.45,
        reloadTime: 2.6
      },
      pistol: { model: 'p38', label: 'Walther P38', magazine: 8, damage: 28, power: 0.5 }
    }
  };
  /* `?geScout=carbine`: the German scout's weapon before PR #55 (the generic carbine, 250 m), for
     A/B benchmarks only: the FG 42 and the view cones shipped together and the swing in meeting
     wins is not yet attributed. The FBX backend still draws the FG 42. */
  if (typeof location !== 'undefined' && /[?&]geScout=carbine\b/.test(location.search || ''))
    PROFILES.ge.carbine = { model: 'fg42', label: 'carbine (pre-FG 42)' };
  function profileStats(kind, faction) {
    var base = STATS[kind] || STATS.rifle,
      over = PROFILES[faction] && PROFILES[faction][kind];
    if (!over) return base;
    var stats = Object.create(base);
    for (var k in over) stats[k] = over[k];
    return stats;
  }
  /* Deal the side's own weapon to a soldier: its numbers and a full magazine. */
  function issue(weapon, faction) {
    if (!weapon) return weapon;
    var stats = profileStats(weapon.kind, faction);
    weapon.stats = stats;
    weapon.profile = stats.model || weapon.kind;
    weapon.magSize = stats.magazine || 8;
    weapon.ammo = weapon.magSize;
    return weapon;
  }
  function attachWeapon(scene, socket, kind) {
    var build = (BUILDERS[kind] || BUILDERS.rifle)(scene),
      stats = STATS[kind] || STATS.rifle;
    build.mesh.parent = socket;
    build.mesh.position.set(0, 0, 0);
    return {
      kind: kind,
      mesh: build.mesh,
      muzzleLocal: build.muzzle,
      stats: stats,
      socket: socket,
      magSize: stats.magazine || 8,
      ammo: stats.magazine || 8
    };
  }
  /* A holstered weapon is carried but not drawn: its mesh (and bipod) are hidden. */
  function show(weapon, on) {
    if (!weapon) return;
    if (weapon.mesh && weapon.mesh.setEnabled) weapon.mesh.setEnabled(!!on);
    if (weapon.bipodMesh && weapon.bipodMesh.setEnabled && !on) weapon.bipodMesh.setEnabled(false);
  }
  function holster(weapon) {
    show(weapon, false);
    return weapon;
  }
  /* Bring the soldier's other weapon to hand: it becomes `weapon` (what he shoots and what the pose
     follows) and the one he had is holstered as `secondary`. */
  function equip(soldier, next) {
    if (!soldier || !next) return false;
    var old = soldier.weapon;
    if (next === old) return false;
    soldier.weapon = next;
    soldier.secondary = old || null;
    show(old, false);
    show(next, true);
    return true;
  }
  /* He leaves his weapons behind (a fled man: Engagement decides, this owner removes the gameplay references).
     The primary stays where it lies for presentation to draw as a prop; the holstered sidearm goes with it.
     Returns the primary he left, or null if he carried none. */
  function abandon(soldier) {
    if (!soldier || !soldier.weapon) return null;
    var left = soldier.weapon,
      side = soldier.secondary,
      r = soldier.root;
    /* Where it lies: presentation draws the prop there whenever it next poses him (he may be off screen now). */
    if (r && r.position)
      left.droppedAt = {
        x: r.position.x,
        y: r.position.y || 0,
        z: r.position.z,
        yaw: (r.rotation && r.rotation.y) || 0
      };
    soldier.weapon = null;
    soldier.secondary = null;
    if (side && side.mesh && typeof side.mesh.dispose === 'function') side.mesh.dispose();
    return left;
  }
  /* Issue a man a fresh loadout (a fled man at base): the weapon he shoots and the holstered one. */
  function arm(soldier, weapon, secondary) {
    if (!soldier || !weapon || soldier.weapon) return false;
    soldier.weapon = weapon;
    soldier.secondary = secondary || null;
    return true;
  }
  root.BattleWeapons = {
    STATS: STATS,
    PROFILES: PROFILES,
    profileStats: profileStats,
    issue: issue,
    attachWeapon: attachWeapon,
    holster: holster,
    equip: equip,
    abandon: abandon,
    arm: arm
  };
})(typeof window !== 'undefined' ? window : globalThis);
