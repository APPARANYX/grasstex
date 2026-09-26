/* Bullet impacts: material bursts, and decals from the sprite sheets in Assets/effects/decals.

   Cosmetic only: consumes the ballistic result (shot.impact, normal, blocker, zone, victim) and never
   casts another damage ray or draws from the battle RNG. Every decal has a hard budget, and restart
   clears them all.

     body hit       blood burst; a wound decal riding the bone that was hit (head, chest, belly, arm
                    or leg) and, where the round went through, an exit spray on the ground behind him;
                    a splash on the ground under the hit
     wall / stone   masonry hole with spall; timber gets a splintered hole; metal a bright dent
     ground         dirt strike; suppressive bursts kick a few up around the point they are laid on
     hedge / grass  a burst of leaves, no hole

   Sheets: a fixed 4 x 4 grid (tools/generate-decal-atlas.js writes them). DECAL_SHEETS addresses
   cells by row and column only, so a sheet can be replaced at any resolution that keeps the grid.
   World decals are thin instances of one quad per cell (one draw call per used cell); wound decals
   are small quads parented to the soldier's bone so they follow the animation. */
(function (root) {
  'use strict';
  if (!root.BattleSim || !root.BattleModules || typeof BABYLON === 'undefined' || root.BattleImpactFx) return;
  var B = BABYLON,
    oldStart = root.BattleSim.start,
    MAX_BURSTS = 28,
    MAX_DECALS = 360,
    MAX_BODY_DECALS = 120,
    MAX_PER_SOLDIER = 6,
    DECAL_LIFE = 150,
    LIFT = 0.012,
    WALL_HALF = 0.165,
    SUPPRESSION_STRIKES = 3;
  var DECAL_SHEETS = {
    blood: { file: 'blood.png', grid: [4, 4], rows: { wound: 0, soak: 1, pool: 2, spray: 3 } },
    holes: { file: 'bullet-holes.png', grid: [4, 4], rows: { masonry: 0, wood: 1, dirt: 2, metal: 3 } }
  };
  /* Decal size in metres per kind: [min, max]. */
  var SIZE = {
    wound: [0.1, 0.14],
    soak: [0.16, 0.24],
    pool: [0.35, 0.6],
    spray: [0.9, 1.5],
    masonry: [0.13, 0.2],
    wood: [0.1, 0.15],
    dirt: [0.14, 0.24],
    metal: [0.07, 0.1]
  };
  var STYLES = {
    blood: { color: [0.48, 0.025, 0.035], count: 9, size: 0.075, power: 1.6, life: 0.42 },
    dirt: { color: [0.42, 0.29, 0.16], count: 9, size: 0.16, power: 1.5, life: 0.55 },
    cement: { color: [0.65, 0.63, 0.58], count: 8, size: 0.12, power: 1.7, life: 0.42 },
    metal: { color: [1, 0.69, 0.24], count: 7, size: 0.055, power: 3.5, life: 0.25 },
    vegetation: { color: [0.3, 0.43, 0.13], count: 8, size: 0.095, power: 1.5, life: 0.48 }
  };
  /* Where a wound decal rides: bone (FBX canonical name / procedural rig part) and how far out
     from the bone the skin is, toward the shooter. */
  var BODY = {
    head: { fbx: ['head'], rig: ['head'], out: 0.1 },
    chest: { fbx: ['spine2'], rig: ['chest'], out: 0.15 },
    abdomen: { fbx: ['spine0', 'spine1'], rig: ['spine'], out: 0.14 },
    arm: { fbx: ['leftarm', 'rightarm'], rig: ['upperArmL', 'upperArmR'], out: 0.05, sided: true },
    leg: { fbx: ['leftupleg', 'rightupleg'], rig: ['thighL', 'thighR'], out: 0.08, sided: true }
  };

  function material(shot) {
    if (shot.stoppedBy === 'soldier') return 'blood';
    if (shot.blocker === 'ground') return 'dirt';
    var s = String(shot.surface || '').toLowerCase();
    if (/metal|steel|iron|armou?r|vehicle/.test(s)) return 'metal';
    if (/hedge|tree|log|wood|bush|grass|leaf|vegetation/.test(s)) return 'vegetation';
    if (/dirt|earth|soil|ground|sand|mud/.test(s)) return 'dirt';
    return 'cement';
  }
  /* Which hole a surface takes; null leaves none (foliage). */
  function holeKind(shot, kind) {
    if (kind === 'dirt') return 'dirt';
    if (kind === 'metal') return 'metal';
    if (kind === 'vegetation')
      return /tree|log|wood|timber|plank|door/.test(String(shot.surface || '').toLowerCase()) ? 'wood' : null;
    return 'masonry';
  }
  function randomFor(seed) {
    var n = seed || 1;
    return function () {
      n ^= n << 13;
      n ^= n >>> 17;
      n ^= n << 5;
      return (n >>> 0) / 4294967296;
    };
  }
  function groundHeight(sim, x, z) {
    var y = sim.heightAt(x, z),
      scenario = sim.scene.metadata && sim.scene.metadata.battleScenario,
      buildings = (scenario && scenario.buildings) || [];
    for (var i = 0; i < buildings.length; i++) {
      var b = buildings[i],
        dx = x - b.x,
        dz = z - b.z,
        c = Math.cos(b.rot || 0),
        s = Math.sin(b.rot || 0);
      if (Math.abs(dx * c - dz * s) < b.w / 2 && Math.abs(dx * s + dz * c) < b.d / 2)
        y = Math.max(y, sim.heightAt(b.x, b.z) + 0.08);
    }
    return y;
  }
  function groundNormal(sim, x, z) {
    var e = 0.25,
      nx = sim.heightAt(x - e, z) - sim.heightAt(x + e, z),
      nz = sim.heightAt(x, z - e) - sim.heightAt(x, z + e),
      l = Math.hypot(nx, 2 * e, nz);
    return { x: nx / l, y: (2 * e) / l, z: nz / l };
  }
  function norm(v) {
    var l = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / l, y: v.y / l, z: v.z / l };
  }
  /* World matrix (Babylon row-major) of a unit quad in XY laid on a surface with normal n at p:
     its +Z is n, its +X points along `along` (projected into the surface) or a random roll. */
  function basis(n, along, roll) {
    n = norm(n);
    var x;
    if (along) {
      var d = along.x * n.x + along.y * n.y + along.z * n.z;
      x = { x: along.x - n.x * d, y: along.y - n.y * d, z: along.z - n.z * d };
    }
    if (!x || Math.hypot(x.x, x.y, x.z) < 1e-4) {
      var up = Math.abs(n.y) > 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
      x = { x: up.y * n.z - up.z * n.y, y: up.z * n.x - up.x * n.z, z: up.x * n.y - up.y * n.x };
    }
    x = norm(x);
    var y = { x: n.y * x.z - n.z * x.y, y: n.z * x.x - n.x * x.z, z: n.x * x.y - n.y * x.x };
    if (roll) {
      var c = Math.cos(roll),
        s = Math.sin(roll),
        rx = { x: x.x * c + y.x * s, y: x.y * c + y.y * s, z: x.z * c + y.z * s };
      y = { x: -x.x * s + y.x * c, y: -x.y * s + y.y * c, z: -x.z * s + y.z * c };
      x = rx;
    }
    return { x: x, y: y, z: n };
  }
  function composeInto(out, o, b, p, size) {
    out[o] = b.x.x * size;
    out[o + 1] = b.x.y * size;
    out[o + 2] = b.x.z * size;
    out[o + 3] = 0;
    out[o + 4] = b.y.x * size;
    out[o + 5] = b.y.y * size;
    out[o + 6] = b.y.z * size;
    out[o + 7] = 0;
    out[o + 8] = b.z.x;
    out[o + 9] = b.z.y;
    out[o + 10] = b.z.z;
    out[o + 11] = 0;
    out[o + 12] = p.x;
    out[o + 13] = p.y;
    out[o + 14] = p.z;
    out[o + 15] = 1;
    return out;
  }
  /* UV rectangle of a sheet cell. Textures load with invertY, so v runs up from the bottom row. */
  function cellUV(sheet, row, col) {
    var g = DECAL_SHEETS[sheet].grid,
      cw = 1 / g[0],
      ch = 1 / g[1];
    return { u0: col * cw, u1: (col + 1) * cw, v0: 1 - (row + 1) * ch, v1: 1 - row * ch };
  }

  function state(sim) {
    return (
      sim._impactFx ||
      (sim._impactFx = {
        bursts: [],
        decals: [],
        body: [],
        cells: {},
        materials: {},
        texture: null,
        serial: 0
      })
    );
  }
  function texture(sim, st) {
    if (st.texture) return st.texture;
    var size = 32,
      data = new Uint8Array(size * size * 4);
    for (var y = 0; y < size; y++)
      for (var x = 0; x < size; x++) {
        var d = Math.hypot((x + 0.5 - size / 2) / (size / 2), (y + 0.5 - size / 2) / (size / 2)),
          i = (x + y * size) * 4;
        data[i] = data[i + 1] = data[i + 2] = 255;
        data[i + 3] = Math.round(255 * Math.pow(Math.max(0, 1 - d), 1.4));
      }
    st.texture = B.RawTexture.CreateRGBATexture(
      data,
      size,
      size,
      sim.scene,
      false,
      false,
      B.Texture.BILINEAR_SAMPLINGMODE
    );
    st.texture.hasAlpha = true;
    return st.texture;
  }
  function decalBase() {
    return (
      String(root.BATTLE_SOLDIER_ASSET_BASE || root.BATTLE_ASSET_BASE || '../Assets/').replace(/\/?$/, '/') +
      'effects/decals/'
    );
  }
  function sheetMaterial(sim, st, sheet) {
    if (st.materials[sheet]) return st.materials[sheet];
    var mat = new B.StandardMaterial('decal-' + sheet, sim.scene),
      tex = new B.Texture(decalBase() + DECAL_SHEETS[sheet].file, sim.scene, false, true);
    tex.hasAlpha = true;
    mat.diffuseTexture = tex;
    mat.useAlphaFromDiffuseTexture = true;
    mat.specularColor = B.Color3.Black();
    mat.backFaceCulling = false;
    mat.zOffset = -2;
    st.materials[sheet] = mat;
    return mat;
  }
  function quad(sim, name, uv) {
    var mesh = new B.Mesh(name, sim.scene),
      data = new B.VertexData();
    data.positions = [-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0];
    data.normals = [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1];
    data.uvs = [uv.u0, uv.v0, uv.u1, uv.v0, uv.u1, uv.v1, uv.u0, uv.v1];
    data.indices = [0, 2, 1, 0, 3, 2];
    data.applyToMesh(mesh);
    mesh.isPickable = false;
    mesh.receiveShadows = true;
    return mesh;
  }
  /* One thin-instanced quad per sheet cell carries every world decal drawn from that cell. */
  function cell(sim, st, sheet, row, col) {
    var key = sheet + ':' + row + ':' + col;
    if (st.cells[key]) return st.cells[key];
    var mesh = quad(sim, 'decal-' + key, cellUV(sheet, row, col));
    mesh.material = sheetMaterial(sim, st, sheet);
    mesh.alwaysSelectAsActiveMesh = true;
    mesh.setEnabled(false);
    return (st.cells[key] = {
      key: key,
      sheet: sheet,
      row: row,
      col: col,
      mesh: mesh,
      dirty: false,
      count: 0
    });
  }
  function pick(sheet, kind, rng) {
    var g = DECAL_SHEETS[sheet].grid;
    return { row: DECAL_SHEETS[sheet].rows[kind], col: Math.floor(rng() * g[0]) % g[0] };
  }
  function size(kind, rng) {
    var s = SIZE[kind];
    return s[0] + rng() * (s[1] - s[0]);
  }
  function worldDecal(sim, st, sheet, kind, p, n, rng, along) {
    while (st.decals.length >= MAX_DECALS) {
      var old = st.decals.shift();
      old.cell.dirty = true;
    }
    var at = pick(sheet, kind, rng),
      c = cell(sim, st, sheet, at.row, at.col),
      b = basis(n, along, along ? 0 : rng() * Math.PI * 2),
      m = composeInto(
        new Float32Array(16),
        0,
        b,
        { x: p.x + n.x * LIFT, y: p.y + n.y * LIFT, z: p.z + n.z * LIFT },
        size(kind, rng)
      );
    var d = { cell: c, kind: kind, matrix: m, at: sim.time };
    st.decals.push(d);
    c.dirty = true;
    return d;
  }
  function flush(st) {
    var keys = Object.keys(st.cells),
      k,
      i;
    for (k = 0; k < keys.length; k++) {
      var c = st.cells[keys[k]];
      if (!c.dirty) continue;
      var list = [];
      for (i = 0; i < st.decals.length; i++) if (st.decals[i].cell === c) list.push(st.decals[i]);
      var buf = new Float32Array(Math.max(1, list.length) * 16);
      for (i = 0; i < list.length; i++) buf.set(list[i].matrix, i * 16);
      c.count = list.length;
      c.mesh.thinInstanceSetBuffer('matrix', list.length ? buf : null, 16, false);
      c.mesh.setEnabled(list.length > 0);
      c.dirty = false;
    }
  }

  function burst(sim, shot, kind, st) {
    while (st.bursts.length >= MAX_BURSTS) st.bursts.shift().system.dispose(false);
    var style = STYLES[kind],
      c = style.color,
      p = shot.impact,
      n = shot.normal || { x: 0, y: 1, z: 0 };
    var ps = new B.ParticleSystem('impact-' + kind, style.count, sim.scene);
    ps.particleTexture = texture(sim, st);
    ps.emitter = new B.Vector3(p.x + n.x * 0.025, p.y + n.y * 0.025, p.z + n.z * 0.025);
    ps.minEmitBox = new B.Vector3(-0.035, -0.025, -0.035);
    ps.maxEmitBox = new B.Vector3(0.035, 0.025, 0.035);
    ps.direction1 = new B.Vector3(n.x - 0.65, n.y * 0.65 + 0.15, n.z - 0.65);
    ps.direction2 = new B.Vector3(n.x + 0.65, n.y * 0.65 + 0.9, n.z + 0.65);
    ps.color1 = new B.Color4(c[0], c[1], c[2], 0.9);
    ps.color2 = new B.Color4(c[0] * 0.65, c[1] * 0.65, c[2] * 0.65, 0.7);
    ps.colorDead = new B.Color4(c[0] * 0.5, c[1] * 0.5, c[2] * 0.5, 0);
    ps.minSize = style.size * 0.45;
    ps.maxSize = style.size;
    ps.minLifeTime = style.life * 0.55;
    ps.maxLifeTime = style.life;
    ps.minEmitPower = style.power * 0.4;
    ps.maxEmitPower = style.power;
    ps.gravity = new B.Vector3(0, kind === 'metal' ? -8 : -4, 0);
    ps.blendMode = kind === 'metal' ? B.ParticleSystem.BLENDMODE_ADD : B.ParticleSystem.BLENDMODE_STANDARD;
    ps.emitRate = 0;
    ps.manualEmitCount = style.count;
    ps.updateSpeed = 1 / 60;
    ps.start();
    st.bursts.push({ system: ps, until: sim.time + style.life + 0.3 });
  }

  /* The bone a wound rides and the side it is on, relative to the shot. */
  function bodyNode(victim, zone, shot) {
    var spec = BODY[zone];
    if (!spec || !victim) return null;
    var side = 0;
    if (spec.sided && shot.direction && victim.root) {
      /* Right of the shot line (seen by the shooter) is the victim's left when he faces the shooter. */
      var p = victim.root.position,
        d = shot.direction,
        cross = (shot.impact.x - p.x) * d.z - (shot.impact.z - p.z) * d.x;
      side = cross > 0 ? 0 : 1;
    }
    var F = root.BattleFbxSoldier,
      node = F && F.boneNode ? F.boneNode(victim, spec.fbx[Math.min(side, spec.fbx.length - 1)]) : null;
    if (!node && victim.rig) node = victim.rig[spec.rig[Math.min(side, spec.rig.length - 1)]] || null;
    return node && !(node.isDisposed && node.isDisposed()) ? node : null;
  }
  function woundDecal(sim, st, shot, rng) {
    var victim = shot.victim,
      zone = shot.zone || 'chest',
      node = bodyNode(victim, zone, shot);
    if (!node || !node.getAbsolutePosition || !shot.direction) return;
    var mine = 0;
    for (var i = 0; i < st.body.length; i++) if (st.body[i].soldier === victim) mine++;
    if (mine >= MAX_PER_SOLDIER) return;
    while (st.body.length >= MAX_BODY_DECALS) {
      var old = st.body.shift();
      if (!old.mesh.isDisposed || !old.mesh.isDisposed()) old.mesh.dispose();
    }
    if (node.computeWorldMatrix) node.computeWorldMatrix(true);
    var anchor = node.getAbsolutePosition(),
      out = norm({ x: -shot.direction.x, y: 0, z: -shot.direction.z }),
      lift =
        zone === 'chest' || zone === 'abdomen' ? Math.max(-0.1, Math.min(0.1, shot.impact.y - anchor.y)) : 0,
      kind = rng() < 0.35 ? 'soak' : 'wound',
      at = pick('blood', kind, rng),
      p = { x: anchor.x + out.x * BODY[zone].out, y: anchor.y + lift, z: anchor.z + out.z * BODY[zone].out },
      b = basis(out, null, rng() * 0.6 - 0.3),
      s = size(kind, rng) * (zone === 'arm' || zone === 'head' ? 0.75 : 1);
    var mesh = quad(sim, 'wound-' + zone, cellUV('blood', at.row, at.col));
    mesh.material = sheetMaterial(sim, st, 'blood');
    var m = B.Matrix.FromArray(composeInto(new Float32Array(16), 0, b, p, s)),
      scale = new B.Vector3(),
      rot = new B.Quaternion(),
      pos = new B.Vector3();
    m.decompose(scale, rot, pos);
    mesh.scaling.copyFrom(scale);
    mesh.rotationQuaternion = rot;
    mesh.position.copyFrom(pos);
    mesh.setParent(node);
    st.body.push({ mesh: mesh, soldier: victim, at: sim.time });
  }
  function bloodOnGround(sim, st, shooter, shot, rng) {
    var p = shot.impact,
      d = shot.direction || { x: 0, y: 0, z: 1 },
      flat = norm({ x: d.x, y: 0, z: d.z }),
      gy = groundHeight(sim, p.x, p.z);
    /* The splash under the hit. */
    worldDecal(
      sim,
      st,
      'blood',
      'pool',
      { x: p.x + (rng() - 0.5) * 0.2, y: gy, z: p.z + (rng() - 0.5) * 0.2 },
      groundNormal(sim, p.x, p.z),
      rng
    );
    /* A full-power round through the body throws an exit spray on the ground behind him. */
    var stats = shooter && shooter.weapon && shooter.weapon.stats,
      through = shot.zone && shot.zone !== 'arm' && shot.zone !== 'leg' && (!stats || !(stats.power < 0.9));
    if (!through) return;
    var reach = 0.5 + rng() * 0.6,
      q = { x: p.x + flat.x * reach, z: p.z + flat.z * reach };
    worldDecal(
      sim,
      st,
      'blood',
      'spray',
      { x: q.x, y: groundHeight(sim, q.x, q.z), z: q.z },
      groundNormal(sim, q.x, q.z),
      rng,
      flat
    );
  }
  function hole(sim, st, shot, kind, rng) {
    var hk = holeKind(shot, kind);
    if (!hk) return;
    var n = shot.normal || { x: 0, y: 1, z: 0 },
      p = shot.impact;
    if (hk === 'dirt') {
      n = groundNormal(sim, p.x, p.z);
      p = { x: p.x, y: groundHeight(sim, p.x, p.z), z: p.z };
    } else if (shot.blocker === 'wall') {
      /* Navigation walls are centre lines; the rendered wall face is half its thickness out. */
      p = { x: p.x + n.x * WALL_HALF, y: p.y, z: p.z + n.z * WALL_HALF };
    }
    worldDecal(sim, st, 'holes', hk, p, n, rng);
  }

  function impact(sim, shot, shooter) {
    if (!sim || !sim.scene || !shot || !shot.impact || shot.stoppedBy === 'range') return;
    if (shot.stoppedBy !== 'soldier' && shot.stoppedBy !== 'environment') return;
    var p = shot.impact;
    if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.z)) return;
    var st = state(sim),
      kind = material(shot),
      rng = randomFor(((++st.serial * 73856093) ^ Math.floor(sim.time * 1000)) | 1);
    burst(sim, shot, kind, st);
    if (kind === 'blood') {
      woundDecal(sim, st, shot, rng);
      bloodOnGround(sim, st, shooter, shot, rng);
    } else hole(sim, st, shot, kind, rng);
  }
  /* Area fire has no rays: kick up a few strikes in the ground around the point it is laid on. */
  function suppressionStrikes(sim, shooter, point, rounds) {
    if (!sim || !sim.scene || !point || !(rounds > 0)) return;
    var st = state(sim),
      rng = randomFor(((++st.serial * 19349663) ^ Math.floor(sim.time * 1000)) | 1),
      n = Math.min(SUPPRESSION_STRIKES, Math.ceil(rounds / 2));
    for (var i = 0; i < n; i++) {
      var a = rng() * Math.PI * 2,
        r = 0.5 + rng() * 3,
        x = point.x + Math.cos(a) * r,
        z = point.z + Math.sin(a) * r,
        at = { x: x, y: groundHeight(sim, x, z), z: z };
      var strike = { impact: at, normal: groundNormal(sim, x, z), blocker: 'ground', surface: 'dirt' };
      burst(sim, strike, 'dirt', st);
      worldDecal(sim, st, 'holes', 'dirt', at, strike.normal, rng);
    }
  }
  function tick(sim) {
    var st = sim && sim._impactFx;
    if (!st) return;
    for (var i = st.bursts.length - 1; i >= 0; i--)
      if (sim.time >= st.bursts[i].until) {
        st.bursts[i].system.dispose(false);
        st.bursts.splice(i, 1);
      }
    while (st.decals.length && sim.time - st.decals[0].at >= DECAL_LIFE) st.decals.shift().cell.dirty = true;
    for (i = st.body.length - 1; i >= 0; i--)
      if (st.body[i].mesh.isDisposed && st.body[i].mesh.isDisposed()) st.body.splice(i, 1);
    flush(st);
  }
  function clear(sim) {
    var st = sim && sim._impactFx;
    if (!st) return;
    st.bursts.forEach(function (b) {
      b.system.dispose(false);
    });
    st.body.forEach(function (b) {
      if (!b.mesh.isDisposed || !b.mesh.isDisposed()) b.mesh.dispose();
    });
    st.bursts = [];
    st.body = [];
    st.decals.forEach(function (d) {
      d.cell.dirty = true;
    });
    st.decals = [];
    flush(st);
    st.serial = 0;
  }
  function install(sim) {
    if (!sim || sim._impactFxInstalled) return sim;
    sim._impactFxInstalled = true;
    var oldShot = sim.onShot,
      oldSuppressive = sim.onSuppressiveShot;
    sim.onShot = function (shooter, target, hit, d, shot) {
      if (oldShot) oldShot.apply(sim, arguments);
      if (shot && shot.delay > 0 && sim.presentAfter)
        sim.presentAfter(shot.delay, function () {
          impact(sim, shot, shooter);
        });
      else impact(sim, shot, shooter);
    };
    sim.onSuppressiveShot = function (shooter, point, hit, rounds) {
      if (oldSuppressive) oldSuppressive.apply(sim, arguments);
      suppressionStrikes(sim, shooter, point, rounds || 1);
    };
    // Match visual particle time to the simulation, including pause and fast-forward.
    var observer = sim.scene.onBeforeRenderObservable.add(function () {
      var st = sim._impactFx;
      if (!st) return;
      var dt =
        sim.paused || sim.winner
          ? 0
          : Math.min(0.25, (sim.scene.getEngine().getDeltaTime() / 1000) * (sim.timeScale || 1));
      var speed = dt / Math.max(0.001, sim.scene.getAnimationRatio());
      st.bursts.forEach(function (b) {
        b.system.updateSpeed = speed;
      });
      flush(st);
    });
    sim.scene.onDisposeObservable.addOnce(function () {
      clear(sim);
      sim.scene.onBeforeRenderObservable.remove(observer);
      var st = sim._impactFx;
      if (st) {
        if (st.texture) st.texture.dispose();
        Object.keys(st.cells).forEach(function (k) {
          st.cells[k].mesh.dispose();
        });
        Object.keys(st.materials).forEach(function (k) {
          if (st.materials[k].diffuseTexture) st.materials[k].diffuseTexture.dispose();
          st.materials[k].dispose();
        });
      }
      delete sim._impactFx;
    });
    return sim;
  }
  root.BattleSim.start = function (scene, opts) {
    return install(oldStart(scene, opts));
  };
  root.BattleModules.registerSystem('bullet-impact-fx', {
    version: '2.0',
    onSimulationStep: tick,
    beforeBattleRestart: clear
  });
  root.BattleImpactFx = {
    version: '2.0-decal-sheets',
    install: install,
    impact: impact,
    suppressionStrikes: suppressionStrikes,
    material: material,
    holeKind: holeKind,
    cellUV: cellUV,
    sheets: DECAL_SHEETS,
    clear: clear,
    tick: tick,
    maxBursts: MAX_BURSTS,
    maxDecals: MAX_DECALS,
    maxBodyDecals: MAX_BODY_DECALS,
    decalLife: DECAL_LIFE
  };
})(typeof window !== 'undefined' ? window : globalThis);
