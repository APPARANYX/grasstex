/* Large-scale battlefield relief layered on top of the existing dirt terrain.
   The base terrain remains the authoritative small undulation field and keeps the same dirt
   material. This module adds deterministic, seed-specific hills, a genuinely flat-topped plateau
   and a shallow basin so a 2000 x 1200 m map reads as terrain instead of a textured tabletop.

   It wraps BattleSim before the page creates the scene. Terrain meshes, height queries, infantry,
   scattered cover and ballistic LOS therefore all agree on the same final surface. */
(function (root) {
  'use strict';
  if (!root.BattleSim || root.BattleMacroRelief) return;

  var B = root.BattleSim,
    baseHeight = B.heightAt,
    baseBuild = B.buildTerrain,
    baseApply = B.applyScenarioTerrain,
    baseStart = B.start;
  var cache = { key: null, profile: null },
    surface = null;

  function hash(seed) {
    return root.BattleScenarioGenerator && root.BattleScenarioGenerator.hashSeed
      ? root.BattleScenarioGenerator.hashSeed(seed)
      : 2166136261;
  }
  function unit(h, shift) {
    return ((h >>> shift) & 1023) / 1023;
  }
  function smooth(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  function ellipse(x, z, f) {
    var dx = (x - f.x) / f.rx,
      dz = (z - f.z) / f.rz;
    return Math.sqrt(dx * dx + dz * dz);
  }
  function dome(x, z, f) {
    var d = ellipse(x, z, f);
    return d >= 1 ? 0 : f.amp * smooth(1 - d);
  }
  function plateauWeight(x, z, f) {
    var d = ellipse(x, z, f);
    if (d >= 1) return 0;
    if (d <= f.inner) return 1;
    return 1 - smooth((d - f.inner) / (1 - f.inner));
  }

  function profile() {
    var s =
      root.BattleScenarioGenerator && root.BattleScenarioGenerator.current
        ? root.BattleScenarioGenerator.current()
        : null;
    var seed = (s && s.seed) || 'default',
      key = (s && s.id) || seed;
    if (cache.key === key && cache.profile) return cache.profile;
    var a = hash(seed + '|macro-hill-a'),
      b = hash(seed + '|macro-hill-b'),
      c = hash(seed + '|macro-plateau'),
      d = hash(seed + '|macro-basin');
    var p = {
      hillA: {
        x: -610 + unit(a, 0) * 390,
        z: -300 + unit(a, 10) * 600,
        rx: 285 + unit(a, 20) * 105,
        rz: 205 + unit(a, 6) * 90,
        amp: 24 + unit(a, 16) * 13
      },
      hillB: {
        x: 190 + unit(b, 0) * 470,
        z: -310 + unit(b, 10) * 620,
        rx: 245 + unit(b, 20) * 115,
        rz: 185 + unit(b, 6) * 95,
        amp: 20 + unit(b, 16) * 12
      },
      plateau: {
        x: -250 + unit(c, 0) * 500,
        z: -245 + unit(c, 10) * 490,
        rx: 190 + unit(c, 20) * 75,
        rz: 155 + unit(c, 6) * 70,
        inner: 0.36 + unit(c, 16) * 0.08,
        amp: 18 + unit(c, 26) * 9
      },
      basin: {
        x: -500 + unit(d, 0) * 1000,
        z: -330 + unit(d, 10) * 660,
        rx: 300 + unit(d, 20) * 120,
        rz: 230 + unit(d, 6) * 90,
        amp: -(7 + unit(d, 16) * 7)
      }
    };
    /* A plateau should actually read flat. Its top level is based on the old terrain at its centre,
     then raised by the seeded plateau amplitude. The smooth skirt blends that plane back into the
     surrounding hills without changing materials. */
    p.plateau.level = baseHeight(p.plateau.x, p.plateau.z) + p.plateau.amp;
    cache = { key: key, profile: p };
    return p;
  }

  function analyticHeight(x, z) {
    var p = profile(),
      h = baseHeight(x, z);
    h += dome(x, z, p.hillA) + dome(x, z, p.hillB) + dome(x, z, p.basin);
    var w = plateauWeight(x, z, p.plateau);
    if (w > 0) h = h + (p.plateau.level - h) * w;
    return h;
  }
  /* The rendered ground is a triangle mesh. LOS, bullets, cover placement and feet must sample that
   triangle surface, not re-evaluate the smooth hill formula between vertices: at a crest the two
   can differ by enough to put a visible ridge above a supposedly clear fire line. */
  function captureSurface(pos) {
    surface = null;
    if (!pos || pos.length < 12) return;
    var n = pos.length / 3,
      z0 = +pos[2],
      cols = 1;
    while (cols < n && Math.abs(+pos[cols * 3 + 2] - z0) < 1e-5) cols++;
    var rows = n / cols;
    if (cols < 2 || rows < 2 || rows !== Math.floor(rows)) return;
    var x0 = +pos[0],
      x1 = +pos[(cols - 1) * 3],
      z1 = +pos[(rows - 1) * cols * 3 + 2],
      dx = (x1 - x0) / (cols - 1),
      dz = (z0 - z1) / (rows - 1);
    if (!(dx > 0) || !(dz > 0)) return;
    var h = new Float32Array(n);
    for (var i = 0; i < n; i++) h[i] = +pos[i * 3 + 1];
    surface = { h: h, cols: cols, rows: rows, x0: x0, z0: z0, dx: dx, dz: dz };
  }
  function meshHeight(x, z) {
    var s = surface;
    if (!s) return null;
    var fc = (x - s.x0) / s.dx,
      i = Math.floor(fc),
      u = fc - i,
      fr = (s.z0 - z) / s.dz,
      j = Math.floor(fr),
      v = fr - j;
    if (i < 0 || j < 0 || i >= s.cols - 1 || j >= s.rows - 1) return null;
    var k = i + j * s.cols,
      hC = s.h[k],
      hB = s.h[k + 1],
      hD = s.h[k + s.cols],
      hA = s.h[k + s.cols + 1];
    return u >= v ? hC + u * (hB - hC) + v * (hA - hB) : hC + v * (hD - hC) + u * (hA - hD);
  }
  function heightAt(x, z) {
    var h = meshHeight(x, z);
    return h == null ? analyticHeight(x, z) : h;
  }

  function deform(ground) {
    if (!ground || typeof BABYLON === 'undefined' || !BABYLON.VertexBuffer || !BABYLON.VertexData)
      return ground;
    cache.key = null;
    surface = null;
    var pos = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    if (!pos) return ground;
    for (var i = 0; i < pos.length; i += 3) pos[i + 1] = analyticHeight(pos[i], pos[i + 2]);
    ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, pos);
    captureSurface(pos);
    var indices = ground.getIndices && ground.getIndices(),
      normals = [];
    if (indices) {
      BABYLON.VertexData.ComputeNormals(pos, indices, normals);
      ground.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
    }
    if (ground.refreshBoundingInfo) ground.refreshBoundingInfo();
    return ground;
  }
  function settleUnits(sim) {
    if (!sim || !sim._roster) return;
    ['us', 'ge'].forEach(function (f) {
      var a = sim._roster[f] || [];
      for (var i = 0; i < a.length; i++) {
        var s = a[i];
        if (s && s.root && s.root.position)
          s.root.position.y = heightAt(s.root.position.x, s.root.position.z);
      }
    });
  }

  B.heightAt = heightAt;
  B.buildTerrain = function (scene) {
    return deform(baseBuild.apply(this, arguments));
  };
  B.applyScenarioTerrain = function (scenario) {
    var out = baseApply.apply(this, arguments);
    cache.key = null;
    return deform(out);
  };
  B.start = function (scene, opts) {
    var sim = baseStart.apply(this, arguments);
    sim.heightAt = heightAt;
    settleUnits(sim);
    var restart = sim.restart && sim.restart.bind(sim);
    if (restart)
      sim.restart = function () {
        var out = restart();
        this.heightAt = heightAt;
        settleUnits(this);
        return out;
      };
    return sim;
  };

  root.BattleMacroRelief = {
    version: '1.1-mesh-authoritative',
    heightAt: heightAt,
    profile: function () {
      return JSON.parse(JSON.stringify(profile()));
    }
  };
  root.GTLog('[TERRAIN] deterministic macro hills + flat dirt plateau active');
})(typeof window !== 'undefined' ? window : globalThis);
