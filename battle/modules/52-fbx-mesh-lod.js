/* #456 R3: presentation-only FBX mesh simplification and meshoptimizer lifecycle.
   One scene-independent, once-per-runtime owner. Gameplay and clip clocks stay with the battle. */
(function (root) {
  'use strict';
  if (root.BattleFbxMeshLod) return;
  root.BattleFbxMeshLod = {
    create: function (deps) {
      var BABYLON = deps.BABYLON,
        ASSET = deps.ASSET,
        perfNow = deps.perfNow,
        assetAdd = deps.assetAdd;
      /* ---- Soldier mesh LOD (presentation only) ---------------------------------------------------
     A soldier is ~22k vertices with 6-7 bone weights each, and the GPU skins every one every frame:
     on an iPhone that was ~9 ms of a 37 ms frame (device benchmark, benchHide=soldiers). Beyond
     `meshLod.far` metres a soldier draws a simplified triangle list instead (meshoptimizer, ~`ratio`
     of the triangles). It indexes the model's own vertex buffer, so every vertex it keeps carries its
     own bone weights, UVs and normals, and clips, poses and the animation LOD are unchanged; the GPU
     only skins the vertices the list uses. One list per model, built once before binding and appended
     to the model's shared index buffer; each soldier's mesh gets a second sub-mesh over it and the
     render hook picks one by apparent screen size. The models ship unwelded (flat-shaded, ~2 vertices
     per triangle), so the simplifier sees them welded by position first; a welded corner takes the
     first vertex at that position. `?soldierLod=0` draws every soldier at full detail. `far` and
     `band` remain the 1080p/default-FOV reference distances from the close-up tuning probe; runtime
     multiplies them by BattleScreenSpaceLod.scale(scene), so small/wide views simplify sooner and
     large/narrow views preserve detail farther out. */
      var MESH_LOD = {
          on: !(typeof location !== 'undefined' && /[?&]soldierLod=0\b/.test(location.search || '')),
          far: 45,
          band: 3,
          screenScale: 1,
          ratio: 0.12,
          error: 0.08,
          lib: 'https://cdn.jsdelivr.net/npm/meshoptimizer@0.22.0/meshopt_simplifier.js',
          models: {},
          failed: null
        },
        meshoptPromise = null;
      function meshoptReady() {
        if (!MESH_LOD.on || typeof document === 'undefined') return Promise.resolve(null);
        if (meshoptPromise) return meshoptPromise;
        meshoptPromise = new Promise(function (ok) {
          var settled = false,
            done = function (v, why) {
              if (settled) return;
              settled = true;
              if (why) MESH_LOD.failed = why;
              ok(v);
            };
          if (root.MeshoptSimplifier)
            return root.MeshoptSimplifier.ready.then(
              function () {
                done(root.MeshoptSimplifier);
              },
              function () {
                done(null, 'meshoptimizer did not initialise');
              }
            );
          var tag = document.createElement('script');
          tag.async = true;
          tag.src = MESH_LOD.lib;
          tag.onload = function () {
            var M = root.MeshoptSimplifier;
            if (!M) return done(null, 'meshoptimizer script has no simplifier');
            M.ready.then(
              function () {
                done(M);
              },
              function () {
                done(null, 'meshoptimizer did not initialise');
              }
            );
          };
          tag.onerror = function () {
            done(null, 'meshoptimizer failed to load');
          };
          document.head.appendChild(tag);
        });
        return meshoptPromise;
      }
      function buildMeshLod(lib, M) {
        if (!M || !MESH_LOD.on) return;
        lib.container.meshes.forEach(function (m) {
          var g = m.geometry;
          if (!g || g._fbxLod || !m.skeleton || !m.subMeshes || m.subMeshes.length !== 1) return;
          var pos = m.getVerticesData(BABYLON.VertexBuffer.PositionKind),
            idx = m.getIndices();
          if (!pos || !idx || !idx.length) return;
          var n = pos.length / 3,
            key = {},
            rep = new Uint32Array(n),
            i;
          for (i = 0; i < n; i++) {
            var k = pos[i * 3].toFixed(4) + ',' + pos[i * 3 + 1].toFixed(4) + ',' + pos[i * 3 + 2].toFixed(4);
            if (key[k] == null) key[k] = i;
            rep[i] = key[k];
          }
          var welded = new Uint32Array(idx.length);
          for (i = 0; i < idx.length; i++) welded[i] = rep[idx[i]];
          var target = Math.max(3, Math.floor((idx.length * MESH_LOD.ratio) / 3) * 3),
            res = M.simplify(
              welded,
              pos instanceof Float32Array ? pos : new Float32Array(pos),
              3,
              target,
              MESH_LOD.error,
              ['Sparse']
            ),
            out = res[0];
          /* Sparse: the welded list uses ~a quarter of the buffer's vertices; without it the simplifier
         barely removes a triangle (10450 -> 10444 on a paratrooper). */
          if (!out || out.length < 3 || out.length >= idx.length * 0.8) {
            MESH_LOD.skipped = (MESH_LOD.skipped || 0) + 1;
            return;
          }
          /* Welding gave each position its first vertex, whose UV is wrong on the far side of a texture
         seam. Give each kept triangle, per corner, the vertex at that position whose UV agrees best
         with the other two corners (the combination with the smallest UV spread). */
          var uv = m.getVerticesData(BABYLON.VertexBuffer.UVKind);
          if (uv) {
            var at = {};
            for (i = 0; i < n; i++) {
              var r = rep[i];
              (at[r] || (at[r] = [])).push(i);
            }
            var d2 = function (a, b) {
              var x = uv[a * 2] - uv[b * 2],
                y = uv[a * 2 + 1] - uv[b * 2 + 1];
              return x * x + y * y;
            };
            for (i = 0; i < out.length; i += 3) {
              var A = at[out[i]].slice(0, 8),
                B = at[out[i + 1]].slice(0, 8),
                C = at[out[i + 2]].slice(0, 8),
                best = Infinity,
                ba = A[0],
                bb = B[0],
                bc = C[0];
              if (A.length * B.length * C.length === 1) continue;
              for (var ai = 0; ai < A.length; ai++)
                for (var bi = 0; bi < B.length; bi++) {
                  var ab = d2(A[ai], B[bi]);
                  if (ab >= best) continue;
                  for (var ci = 0; ci < C.length; ci++) {
                    var sc = ab + d2(B[bi], C[ci]) + d2(C[ci], A[ai]);
                    if (sc < best) {
                      best = sc;
                      ba = A[ai];
                      bb = B[bi];
                      bc = C[ci];
                    }
                  }
                }
              out[i] = ba;
              out[i + 1] = bb;
              out[i + 2] = bc;
            }
          }
          var sub = m.subMeshes[0],
            all = new Uint32Array(idx.length + out.length);
          all.set(idx, 0);
          all.set(out, idx.length);
          var sharers = (g.meshes || [m]).filter(function (x) {
            return x.subMeshes && x.subMeshes.length === 1;
          });
          g.setIndices(all, n, true);
          /* setIndices rebuilds a global sub-mesh over the whole buffer on every mesh sharing the geometry
         (soldiers bound before the lists were built too); give each back its full-detail one. */
          sharers.forEach(function (x) {
            x.subMeshes = [];
            new BABYLON.SubMesh(sub.materialIndex, sub.verticesStart, sub.verticesCount, 0, idx.length, x);
          });
          var used = new Uint8Array(n),
            kept = 0;
          for (i = 0; i < out.length; i++)
            if (!used[out[i]]) {
              used[out[i]] = 1;
              kept++;
            }
          g._fbxLod = { start: idx.length, count: out.length };
          MESH_LOD.models[lib.file || m.name] = {
            triangles: idx.length / 3,
            lodTriangles: out.length / 3,
            vertices: n,
            lodVertices: kept,
            error: +res[1].toFixed(4)
          };
        });
      }
      /* Per soldier: the full and the far sub-mesh of each body mesh that has a far list. */
      function meshLodBind(meshes) {
        var out = [];
        meshes.forEach(function (m) {
          var L = m.geometry && m.geometry._fbxLod;
          if (!L || !m.subMeshes || m.subMeshes.length !== 1) return;
          var full = m.subMeshes.slice(),
            far = new BABYLON.SubMesh(
              full[0].materialIndex,
              0,
              m.getTotalVertices(),
              L.start,
              L.count,
              m,
              undefined,
              true,
              false
            );
          out.push({ mesh: m, full: full, far: [far] });
        });
        return out.length ? out : null;
      }
      /* Called when meshoptimizer is ready, which may be after soldiers are bound: never holds the battle. */
      function meshLodInstall(st, M) {
        if (!M || !MESH_LOD.on) return;
        Object.keys(st.libs || {}).forEach(function (f) {
          var t0 = ASSET.on ? perfNow() : 0;
          try {
            buildMeshLod(st.libs[f], M);
          } catch (e) {
            MESH_LOD.failed = String((e && e.message) || e);
          }
          assetAdd('model', f, 'meshLod', perfNow() - t0);
        });
        (st.active || []).forEach(function (fx) {
          if (!fx.meshLod && !fx.holder.isDisposed()) {
            fx._meshFar = undefined;
            fx.meshLod = meshLodBind(fx.meshes);
          }
        });
      }
      function meshLodApply(fx, far) {
        if (fx._meshFar === far) return;
        fx._meshFar = far;
        for (var i = 0; i < fx.meshLod.length; i++) {
          var e = fx.meshLod[i];
          e.mesh.subMeshes = far ? e.far : e.full;
        }
      }
      return {
        MESH_LOD: MESH_LOD,
        meshoptReady: meshoptReady,
        meshLodBind: meshLodBind,
        meshLodInstall: meshLodInstall,
        meshLodApply: meshLodApply
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
