/* #456 R3: clip-layer clock, cross-fade and per-bone pose sampling.
   Pure animation data operations: no model, weapon, scene, Babylon or gameplay ownership.
   The caller owns the layers, clip buffers and scratch output objects. */
(function (root) {
  'use strict';
  if (root.BattleFbxClipMixer) return;
  root.BattleFbxClipMixer = {
    create: function (fps) {
      var FPS = fps;
      function setClip(layer, clip, rate, fade, restart, keepPhase) {
        var entries = layer.entries,
          top = entries[entries.length - 1];
        if (top && top.clip === clip && !restart) {
          top.rate = rate;
          return top;
        }
        var t = 0;
        if (keepPhase && top && top.clip.loop && clip.loop) t = (top.t / top.clip.duration) * clip.duration;
        var entry = { clip: clip, t: t, rate: rate, w: entries.length ? 0 : 1 };
        entries.push(entry);
        layer.fade = Math.max(0.01, fade);
        if (entries.length > 4) entries.splice(0, entries.length - 4);
        return entry;
      }
      function advanceLayer(layer, dt) {
        var entries = layer.entries,
          n = entries.length;
        if (!n) return;
        for (var i = 0; i < n; i++) {
          var e = entries[i],
            d = e.clip.duration;
          e.t += dt * e.rate;
          e.t = e.clip.loop ? ((e.t % d) + d) % d : Math.min(d, e.t);
        }
        var top = entries[n - 1],
          rest = 0;
        top.w = Math.min(1, top.w + dt / (layer.fade || 0.25));
        for (i = 0; i < n - 1; i++) rest += entries[i].w;
        var scale = rest > 0 ? (1 - top.w) / rest : 0;
        for (i = n - 2; i >= 0; i--) {
          entries[i].w *= scale;
          if (entries[i].w < 0.002) entries.splice(i, 1);
        }
        if (entries.length === 1) top.w = 1;
      }
      function topEntry(layer) {
        return layer.entries[layer.entries.length - 1] || null;
      }
      function sampleLayer(layer, bone, q, pos) {
        var entries = layer.entries,
          total = 0,
          hasPos = false;
        q.set(0, 0, 0, 0);
        pos.set(0, 0, 0);
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i],
            ch = e.clip.channels[bone];
          if (!ch || e.w <= 0) continue;
          var f = e.t * FPS,
            last = e.clip.frames - 1,
            i0 = Math.min(last, Math.floor(f)),
            i1 = Math.min(last, i0 + 1),
            u = Math.min(1, Math.max(0, f - i0)),
            w = e.w;
          if (ch.rot) {
            var r = ch.rot,
              a = i0 * 4,
              b = i1 * 4,
              x = r[a] + (r[b] - r[a]) * u,
              y = r[a + 1] + (r[b + 1] - r[a + 1]) * u,
              z = r[a + 2] + (r[b + 2] - r[a + 2]) * u,
              ww = r[a + 3] + (r[b + 3] - r[a + 3]) * u;
            if (total > 0 && x * q.x + y * q.y + z * q.z + ww * q.w < 0) w = -w;
            q.x += x * w;
            q.y += y * w;
            q.z += z * w;
            q.w += ww * w;
          }
          if (ch.pos) {
            var s = ch.pos,
              c = i0 * 3,
              d = i1 * 3,
              wp = Math.abs(w);
            pos.x += (s[c] + (s[d] - s[c]) * u) * wp;
            pos.y += (s[c + 1] + (s[d + 1] - s[c + 1]) * u) * wp;
            pos.z += (s[c + 2] + (s[d + 2] - s[c + 2]) * u) * wp;
            hasPos = true;
          }
          total += Math.abs(e.w);
        }
        if (total <= 0) return 0;
        q.normalize();
        if (hasPos) pos.scaleInPlace(1 / total);
        return hasPos ? 2 : 1;
      }
      return {
        setClip: setClip,
        advanceLayer: advanceLayer,
        topEntry: topEntry,
        sampleLayer: sampleLayer
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
