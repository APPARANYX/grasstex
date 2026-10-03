/* Audio format: Opus-in-CAF where the browser can decode it, MP3 everywhere else.
   Every clip the manifest names stays an MP3 path. Clips with an Opus-in-CAF twin beside them (the
   same path ending .caf, about half the size) are fetched as the twin once a probe has proven this
   browser decodes one: Safari and iOS do, Chrome, Firefox and Android do not. The probe fetches a
   single twin and decodes it in an OfflineAudioContext (no user gesture needed); until it succeeds,
   or if it fails, everything stays MP3, so a page can never go silent for want of a codec.
   Which clips have twins: every file in a `weapon.<model>` category (the licensed small-arms clips
   in the private APPARANYX/grasstex-audio repo, which ships both). `?audioFormat=mp3` skips the probe.
   Presentation only: no simulation state, no combat RNG. */
(function (root) {
  'use strict';
  if (root.BattleAudioFormat) return;
  var FORCE_MP3 = typeof location !== 'undefined' && /[?&]audioFormat=mp3\b/.test(location.search || '');
  var state = 'mp3',
    twins = null,
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
  function twinOf(path) {
    return path.replace(/\.mp3$/, '.caf');
  }
  /* The URL to load for a manifest path (relative to the audio base, or already joined to it). */
  function url(path) {
    if (state !== 'caf' || !twins || typeof path !== 'string') return path;
    var rel = path,
      base = String(root.BATTLE_AUDIO_BASE || '');
    if (base && rel.indexOf(base) === 0) rel = rel.slice(base.length);
    return twins[rel] ? twinOf(path) : path;
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
    var first = Object.keys(twins)[0];
    if (FORCE_MP3 || !first || !get || !Ctx || typeof Promise === 'undefined') return Promise.resolve((state = 'mp3'));
    state = 'probing';
    return get(base + twinOf(first))
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
      .then(
        function (decoded) {
          if (!decoded || !(decoded.length > 0)) throw new Error('empty');
          return (state = 'caf');
        },
        function () {
          return (state = 'mp3');
        }
      )
      .catch(function () {
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
       decodes CAF does not build its pools from the MP3s in the instant before the probe returns. */
    get ready() {
      return pending || (typeof Promise !== 'undefined' ? Promise.resolve(state) : null);
    }
  };
  if (typeof window !== 'undefined' && root === window && typeof document !== 'undefined') probe();
})(typeof window !== 'undefined' ? window : globalThis);
