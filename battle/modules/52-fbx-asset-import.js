/* #456 R3: FBX loader, import telemetry and raw animation-clip fallback.
   Models, source converters, retry policy, pack compatibility and all in-flight
   scene ownership remain with the backend; this module owns the async import
   primitives and their single once-per-runtime loader-promise cache. */
(function (root) {
  'use strict';
  if (root.BattleFbxAssetImport) return;
  root.BattleFbxAssetImport = {
    create: function (deps) {
      var BABYLON = deps.BABYLON,
        ASSET = deps.ASSET,
        perfNow = deps.perfNow,
        assetLoaded = deps.assetLoaded,
        assetAdd = deps.assetAdd,
        CLIPS = deps.CLIPS,
        sourceRig = deps.sourceRig,
        convertClip = deps.convertClip;
      /* Soldier assets can live beside a branch preview's runtime; everything else is shared. */
      function assetBase() {
        return String(root.BATTLE_SOLDIER_ASSET_BASE || root.BATTLE_ASSET_BASE || '../Assets/').replace(
          /\/?$/,
          '/'
        );
      }

      var loaderPromise = null;
      function ensureLoader() {
        if (BABYLON.FBXFileLoader) return Promise.resolve();
        if (loaderPromise) return loaderPromise;
        if (typeof document === 'undefined') return Promise.reject(new Error('FBX loader needs a document'));
        /* The loader bundle must match the engine build exactly. */
        loaderPromise = new Promise(function (ok, fail) {
          var tag = document.createElement('script');
          tag.async = true;
          tag.src =
            'https://cdn.jsdelivr.net/npm/babylonjs-loaders@' +
            BABYLON.Engine.Version +
            '/babylonjs.loaders.min.js';
          tag.onload = function () {
            if (BABYLON.FBXFileLoader) ok();
            else fail(new Error('loader bundle has no FBX loader'));
          };
          tag.onerror = function () {
            fail(new Error('FBX loader script failed to load'));
          };
          document.head.appendChild(tag);
        });
        return loaderPromise;
      }
      function loadContainer(scene, url, kind, file) {
        var p = BABYLON.LoadAssetContainerAsync(url, scene, { pluginExtension: '.fbx' });
        if (!ASSET.on || !kind) return p;
        var t0 = perfNow();
        return p.then(function (c) {
          assetLoaded(kind, file, url, t0);
          return c;
        });
      }

      /* Load and convert clip FBX files ({file: [keys]}); resolves to the converted clips. */
      function loadClipFiles(scene, st, base, byFile, progress) {
        return Promise.all(
          Object.keys(byFile).map(function (file) {
            return loadContainer(
              scene,
              base + 'animations/' + encodeURIComponent(file) + '.fbx',
              'clip',
              file + '.fbx'
            ).then(function (c) {
              var t0 = ASSET.on ? perfNow() : 0,
                t1 = 0;
              try {
                if (!st.src) {
                  st.src = sourceRig(c);
                  st.bones = st.src.bones;
                }
                var out = byFile[file].map(function (key) {
                  return convertClip(c, key, CLIPS[key], st.bones);
                });
                t1 = ASSET.on ? perfNow() : 0;
                return out;
              } finally {
                if (ASSET.on && !t1) t1 = perfNow();
                c.dispose();
                if (ASSET.on) {
                  assetAdd('clip', file + '.fbx', 'convert', t1 - t0);
                  assetAdd('clip', file + '.fbx', 'dispose', perfNow() - t1);
                }
                if (progress) progress();
              }
            });
          })
        ).then(function (groups) {
          return [].concat.apply([], groups);
        });
      }
      return {
        assetBase: assetBase,
        ensureLoader: ensureLoader,
        loadContainer: loadContainer,
        loadClipFiles: loadClipFiles
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
