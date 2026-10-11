/* #456 R3: prepared-clip pack decode, cache-safe fetch/fallback and offline builder.
   Keeps the exact GCP1 codec, error messages, clip grouping and telemetry semantics.
   Authoritative FBX source conversion and pack ENCODING remain in the backend so
   the shipped prepared-clips.bin fingerprint and format are not changed. */
(function (root) {
  'use strict';
  if (root.BattleFbxPreparedPack) return;
  root.BattleFbxPreparedPack = {
    create: function (deps) {
      var Q = deps.Q,
        V3 = deps.V3,
        FPS = deps.FPS,
        CLIP_PACK_FORMAT = deps.CLIP_PACK_FORMAT,
        CLIP_PACK_FILE = deps.CLIP_PACK_FILE,
        CLIP_PACK_ON = deps.CLIP_PACK_ON,
        CLIPS = deps.CLIPS,
        ASSET = deps.ASSET,
        perfNow = deps.perfNow,
        assetLoaded = deps.assetLoaded,
        assetAdd = deps.assetAdd,
        assetEntry = deps.assetEntry,
        ensureLoader = deps.ensureLoader,
        loadClipFiles = deps.loadClipFiles,
        assetBase = deps.assetBase,
        encodeClipPack = deps.encodeClipPack;
      function decodeClipPack(buf) {
        var bytes = new Uint8Array(buf),
          len = buf.byteLength >= 8 ? new DataView(buf).getUint32(4, true) : 0;
        if (!len || String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== 'GCP1' || len % 4)
          throw new Error('not a clip pack');
        var head = JSON.parse(new TextDecoder().decode(bytes.subarray(8, 8 + len)));
        if (head.format !== CLIP_PACK_FORMAT || head.fps !== FPS)
          throw new Error(
            'clip pack format ' +
              head.format +
              ' at ' +
              head.fps +
              ' fps, runtime wants ' +
              CLIP_PACK_FORMAT +
              ' at ' +
              FPS
          );
        var data = new Float32Array(buf, 8 + len, (buf.byteLength - 8 - len) >> 2),
          rest = {},
          clips = {};
        Object.keys(head.src.rest).forEach(function (b) {
          var r = head.src.rest[b];
          rest[b] = { q: new Q(r.q[0], r.q[1], r.q[2], r.q[3]), p: new V3(r.p[0], r.p[1], r.p[2]) };
        });
        head.clips.forEach(function (c) {
          var channels = new Array(head.src.bones.length);
          c.channels.forEach(function (e) {
            channels[e[0]] = {
              rot: e[1] < 0 ? null : data.subarray(e[1], e[1] + c.frames * 4),
              pos: e[2] < 0 ? null : data.subarray(e[2], e[2] + c.frames * 3)
            };
          });
          clips[c.key] = {
            spec: c.spec,
            clip: {
              key: c.key,
              file: c.spec[0],
              loop: c.loop,
              frames: c.frames,
              duration: c.duration,
              travel: c.travel,
              speed: 0,
              turnRate: c.turnRate,
              channels: channels
            }
          };
        });
        return {
          src: { bones: head.src.bones, rest: rest, scheme: head.src.scheme },
          clips: clips,
          sources: head.sources || null
        };
      }
      function fetchClipPack(base) {
        if (!CLIP_PACK_ON || typeof fetch !== 'function') return Promise.resolve(null);
        /* no-cache revalidates: an unchanged pack costs one 304, a regenerated one is never served stale. */
        var url = base + 'animations/' + CLIP_PACK_FILE,
          t0 = perfNow();
        return fetch(url, { cache: 'no-cache' })
          .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.arrayBuffer();
          })
          .then(function (buf) {
            if (ASSET.on) assetLoaded('pack', CLIP_PACK_FILE, url, t0);
            var t1 = perfNow(),
              pack = decodeClipPack(buf);
            assetAdd('pack', CLIP_PACK_FILE, 'convert', perfNow() - t1);
            if (ASSET.on && !assetEntry('pack', CLIP_PACK_FILE).bytes)
              assetEntry('pack', CLIP_PACK_FILE).bytes = buf.byteLength;
            return pack;
          })
          .catch(function (error) {
            console.warn(
              '[ANIM] prepared clips unavailable, clips load from FBX:',
              (error && error.message) || error
            );
            return null;
          });
      }
      function clipsByFile(keys) {
        var byFile = {};
        keys.forEach(function (key) {
          (byFile[CLIPS[key][0]] || (byFile[CLIPS[key][0]] = [])).push(key);
        });
        return byFile;
      }
      function buildClipPack(scene, extra) {
        var st = { src: null, bones: null };
        return ensureLoader()
          .then(function () {
            return loadClipFiles(scene, st, assetBase(), clipsByFile(Object.keys(CLIPS)));
          })
          .then(function (list) {
            var order = {};
            Object.keys(CLIPS).forEach(function (k, i) {
              order[k] = i;
            });
            list.sort(function (a, b) {
              return order[a.key] - order[b.key];
            });
            return encodeClipPack(st.src, list, extra);
          });
      }
      return {
        decodeClipPack: decodeClipPack,
        fetchClipPack: fetchClipPack,
        clipsByFile: clipsByFile,
        buildClipPack: buildClipPack
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
