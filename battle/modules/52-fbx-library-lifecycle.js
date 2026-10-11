/* #456 R3: asynchronous FBX library lifecycle and binding to each scene.
   This module owns the existing one-shot load orchestration and ready/error state,
   while scene ownership, asset parsing, pack/source transforms, pose and grips stay
   with their explicit backend and helper owners. */
(function (root) {
  'use strict';
  if (root.BattleFbxLibraryLifecycle) return;
  root.BattleFbxLibraryLifecycle = {
    create: function (deps) {
      var sceneState = deps.sceneState,
        assetBase = deps.assetBase,
        assetMark = deps.assetMark,
        meshoptReady = deps.meshoptReady,
        fetchClipPack = deps.fetchClipPack,
        MODELS = deps.MODELS,
        loadSidecars = deps.loadSidecars,
        loadProgress = deps.loadProgress,
        ensureLoader = deps.ensureLoader,
        ASSET = deps.ASSET,
        wrapFbxParse = deps.wrapFbxParse,
        loadContainer = deps.loadContainer,
        perfNow = deps.perfNow,
        prepareModel = deps.prepareModel,
        assetAdd = deps.assetAdd,
        loadWeapons = deps.loadWeapons,
        CLIPS = deps.CLIPS,
        CLIP_PACK_ON = deps.CLIP_PACK_ON,
        clipsByFile = deps.clipsByFile,
        loadClipFiles = deps.loadClipFiles,
        retargetClips = deps.retargetClips,
        BONE = deps.BONE,
        isUpper = deps.isUpper,
        SIDE_CONTACTS = deps.SIDE_CONTACTS,
        SOLDIER_CONTACTS = deps.SOLDIER_CONTACTS,
        V3 = deps.V3,
        weaponFiles = deps.weaponFiles,
        WEAPON_POINTS = deps.WEAPON_POINTS,
        solveGrips = deps.solveGrips,
        hookRender = deps.hookRender,
        meshLodInstall = deps.meshLodInstall,
        MODEL_SET = deps.MODEL_SET,
        SMOOTH_NORMALS = deps.SMOOTH_NORMALS;
      function loadLibrary(scene) {
        var st = sceneState(scene);
        if (st.loading) return st.loading;
        var base = assetBase(),
          started = Date.now();
        assetMark('start');
        var meshopt =
          meshoptReady(); /* fetched alongside the models; the far lists are built once it and the models are in */
        var packWork = fetchClipPack(base); /* likewise: the prepared clips download while the models parse */
        var files = {};
        Object.keys(MODELS).forEach(function (f) {
          Object.keys(MODELS[f]).forEach(function (role) {
            files[MODELS[f][role]] = 1;
          });
        });
        var modelTotal = Object.keys(files).length,
          modelsDone = 0;
        /* Sidecars (per-model Motion Lab calibrations) only need the file names: fetched from the start,
       applied before the grip solve that reads them. */
        var sideWork = loadSidecars(base, Object.keys(files)).then(function () {
          return null;
        });
        loadProgress('models', 0, modelTotal, 'models');
        st.loading = ensureLoader()
          .then(function () {
            assetMark('loaderReady');
            if (ASSET.on) ASSET.loaderScriptMs = ASSET.marks.loaderReady - ASSET.marks.start;
            wrapFbxParse();
            return Promise.all(
              Object.keys(files)
                .map(function (file) {
                  return loadContainer(scene, base + 'soldiers/' + file, 'model', file).then(function (c) {
                    var t0 = ASSET.on ? perfNow() : 0;
                    c._battleFile = file;
                    st.libs[file] = prepareModel(c);
                    st.libs[file].file = file;
                    assetAdd('model', file, 'prepare', perfNow() - t0);
                    loadProgress('models', ++modelsDone, modelTotal, 'models');
                  });
                })
                .concat([loadWeapons(scene, st, base)])
            );
          })
          .then(function () {
            /* The sidecars (fetched since the start) and the clips must both be in before retarget/solve. */
            assetMark('modelsWeaponsDone');
            var clipWork = packWork.then(function (pack) {
              /* Prepared clips whose spec still matches CLIPS; each other clip file loads once, however
           many keys use it. The pack's source rig names the bones either way. */
              var fromPack = [],
                missing = [];
              if (pack) {
                st.src = pack.src;
                st.bones = pack.src.bones;
              }
              Object.keys(CLIPS).forEach(function (key) {
                var p = pack && pack.clips[key];
                if (p && JSON.stringify(p.spec) === JSON.stringify(CLIPS[key])) fromPack.push(p.clip);
                else missing.push(key);
              });
              var byFile = clipsByFile(missing),
                files = Object.keys(byFile);
              st.clipPack = {
                on: CLIP_PACK_ON,
                loaded: !!pack,
                fromPack: fromPack.length,
                fromFbx: missing.length,
                fbxFiles: files.length
              };
              if (pack && missing.length)
                console.warn(
                  '[ANIM] prepared clips miss ' +
                    missing.length +
                    ' clip(s) (' +
                    missing.slice(0, 5).join(', ') +
                    '); they load from FBX. Rebuild with scripts/build_clip_pack.cjs.'
                );
              var done = 0,
                total = files.length + (pack ? 1 : 0);
              if (pack) done = 1;
              loadProgress('clips', done, total, 'clips');
              return loadClipFiles(scene, st, base, byFile, function () {
                loadProgress('clips', ++done, total, 'clips');
              }).then(function (list) {
                return fromPack.concat(list);
              });
            });
            return Promise.all([clipWork, sideWork]).then(function (parts) {
              return parts[0];
            });
          })
          .then(function (list) {
            /* Binding is one synchronous pass: let the load bar paint that it has started. */
            var L = root.BattleLoading;
            if (!L || !L.frame) return list;
            L.note('soldiers', 'binding clips to models…');
            return L.frame().then(function () {
              return list;
            });
          })
          .then(function (list) {
            assetMark('bindClipsStart');
            st.clips = {};
            list.forEach(function (clip) {
              st.clips[clip.key] = clip;
            });
            Object.keys(st.libs).forEach(function (f) {
              var t0 = ASSET.on ? perfNow() : 0;
              retargetClips(st.libs[f], st.src, st.clips, st.bones);
              assetAdd('model', f, 'retarget', perfNow() - t0);
            });
            st.animated = [];
            st.upper = [];
            st.hips = st.bones.indexOf(BONE.hips);
            st.spineRoot = st.bones.indexOf(BONE.spine0);
            st.bones.forEach(function (name, i) {
              if (
                list.some(function (c) {
                  return !!c.channels[i];
                })
              )
                st.animated.push(i);
              st.upper[i] = isUpper(name);
            });
            Object.keys(st.libs).forEach(function (f) {
              var lib = st.libs[f];
              lib.grips = {};
              var measured = SIDE_CONTACTS[f] || SOLDIER_CONTACTS[f];
              if (measured) {
                if (measured.right)
                  lib.palms[BONE.rightHand] = new V3(measured.right[0], measured.right[1], measured.right[2]);
                if (measured.left)
                  lib.palms[BONE.leftHand] = new V3(measured.left[0], measured.left[1], measured.left[2]);
                lib.palms[BONE.rightHand + 'Source'] = measured.right
                  ? 'stored'
                  : lib.palms[BONE.rightHand + 'Source'];
                lib.palms[BONE.leftHand + 'Source'] = measured.left
                  ? 'stored'
                  : lib.palms[BONE.leftHand + 'Source'];
              }
              var pistols = ['pistol'].concat(weaponFiles('us', 'pistol'), weaponFiles('ge', 'pistol')),
                tg = ASSET.on ? perfNow() : 0;
              solveGrips(
                lib,
                lib.clips.aim,
                st.bones,
                Object.keys(WEAPON_POINTS).filter(function (k) {
                  return pistols.indexOf(k) < 0;
                })
              );
              solveGrips(lib, lib.clips.pistolIdle, st.bones, pistols);
              assetAdd('model', f, 'grips', perfNow() - tg);
              root.GTLog(
                '[ANIM] hand sockets ' +
                  f +
                  ': R=' +
                  lib.palms[BONE.rightHand + 'Source'] +
                  ' L=' +
                  lib.palms[BONE.leftHand + 'Source'] +
                  ' Rverts=' +
                  lib.palms[BONE.rightHand + 'Vertices'] +
                  ' Lverts=' +
                  lib.palms[BONE.leftHand + 'Vertices']
              );
            });
            hookRender(scene, st);
            st.ready = true;
            assetMark('ready');
            if (ASSET.on) ASSET.bindClipsMs = ASSET.marks.ready - ASSET.marks.bindClipsStart;
            meshopt.then(function (M) {
              meshLodInstall(st, M);
            });
            root.GTLog(
              '[ANIM] FBX soldiers ready: ' +
                MODEL_SET +
                ' ' +
                Object.keys(st.libs)
                  .map(function (f) {
                    return f.replace('.fbx', '') + (st.libs[f].retargeted ? '*' : '');
                  })
                  .join(' ') +
                ', weapons ' +
                Object.keys(st.weapons || {}).join(' ') +
                ', ' +
                list.length +
                ' clips, ' +
                st.animated.length +
                ' animated bones, ' +
                (Date.now() - started) +
                ' ms' +
                (SMOOTH_NORMALS ? ', smoothed normals' : '')
            );
            return true;
          })
          .catch(function (error) {
            st.error = error;
            console.error('[ANIM] FBX soldiers failed to load', error);
            return false;
          });
        return st.loading;
      }
      return { loadLibrary: loadLibrary };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
