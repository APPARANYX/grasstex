/* Audio format: Opus, in whichever container this browser decodes, with MP3 as the fallback.
   Every clip the manifest names stays an MP3 path. Clips with Opus twins beside them (the same
   path ending .caf and .ogg, about half the size) are fetched as a twin once a probe has proven
   this browser decodes it: CAF first (Safari, iOS), then Ogg (Chrome, Edge, Firefox, Android). The
   probe fetches a single twin per container and decodes it in an OfflineAudioContext (no user
   gesture needed); until one succeeds, or if both fail, everything stays MP3, so a page can never go
   silent for want of a codec.
   Which clips have twins: every file in a `weapon.<model>` category, or every MP3 the page loads
   when the manifest says `"opusTwins": "all"` (the private APPARANYX/grasstex-audio repo ships
   them). `?audioFormat=mp3` skips the probe; `=caf` or `=ogg` probes only that container.
   Presentation only: no simulation state, no combat RNG. */
(function (root) {
  'use strict';
  if (root.BattleAudioFormat) return;
  var ORDER = ['caf', 'ogg'];
  var m = typeof location !== 'undefined' && /[?&]audioFormat=(mp3|caf|ogg)\b/.exec(location.search || '');
  var ONLY = m ? m[1] : null;
  var state = 'mp3',
    twins = null,
    all = false,
    pending = null;

  function twinSet(manifest) {
    var set = {},
      c = (manifest && manifest.categories) || {};
    Object.keys(c).forEach(function (name) {
      if (name.indexOf('weapon.') !== 0) return;
      Object.keys(c[name]).forEach(function (action) {
        (c[name][action] || []).forEach(function (f) {
          if (/\.mp3$/.test(f)) set[f] = true;
        });
      });
    });
    return set;
  }
  function twinOf(path, ext) {
    return path.replace(/\.mp3$/, '.' + ext);
  }
  /* The URL to load for a manifest path (relative to the audio base, or already joined to it). */
  function url(path) {
    if ((state !== 'caf' && state !== 'ogg') || typeof path !== 'string' || !/\.mp3$/.test(path)) return path;
    if (all) return twinOf(path, state);
    var rel = path,
      base = String(root.BATTLE_AUDIO_BASE || '');
    if (base && rel.indexOf(base) === 0) rel = rel.slice(base.length);
    return twins && twins[rel] ? twinOf(path, state) : path;
  }
  function decodes(get, Ctx, href) {
    return get(href)
      .then(function (r) {
        if (!r || !r.ok) throw new Error('no twin');
        return r.arrayBuffer();
      })
      .then(function (buf) {
        return new Promise(function (resolve, reject) {
          var ctx = new Ctx(1, 48000, 48000),
            p = ctx.decodeAudioData(buf, resolve, reject);
          if (p && p.then) p.then(resolve, reject);
        });
      })
      .then(function (decoded) {
        if (!decoded || !(decoded.length > 0)) throw new Error('empty');
        return true;
      });
  }
  /* opts (tests): manifest, base, fetch, Ctx. Resolves to the format in use. */
  function probe(opts) {
    return (pending = run(opts));
  }
  function run(opts) {
    opts = opts || {};
    var manifest = opts.manifest || root.BATTLE_AUDIO_MANIFEST,
      base = opts.base != null ? opts.base : String(root.BATTLE_AUDIO_BASE || 'audio/'),
      get = opts.fetch || (typeof fetch !== 'undefined' ? fetch.bind(root) : null),
      Ctx = opts.Ctx || root.OfflineAudioContext || root.webkitOfflineAudioContext;
    twins = twinSet(manifest);
    all = !!(manifest && manifest.opusTwins === 'all');
    var first = Object.keys(twins)[0];
    var order = ONLY ? (ONLY === 'mp3' ? [] : [ONLY]) : ORDER;
    if (!order.length || !first || !get || !Ctx || typeof Promise === 'undefined') return Promise.resolve((state = 'mp3'));
    state = 'probing';
    var i = 0;
    function next() {
      if (i >= order.length) return Promise.resolve((state = 'mp3'));
      var ext = order[i++];
      return decodes(get, Ctx, base + twinOf(first, ext)).then(function () {
        return (state = ext);
      }, next);
    }
    return next().catch(function () {
      return (state = 'mp3');
    });
  }

  root.BattleAudioFormat = {
    url: url,
    probe: probe,
    twinSet: twinSet,
    get state() {
      return state;
    },
    /* Resolves once the format is settled: wait on it before creating voices, so a page that
       decodes Opus does not build its pools from the MP3s in the instant before the probe returns. */
    get ready() {
      return pending || (typeof Promise !== 'undefined' ? Promise.resolve(state) : null);
    }
  };
  if (typeof window !== 'undefined' && root === window && typeof document !== 'undefined') probe();
})(typeof window !== 'undefined' ? window : globalThis);
