/* Reload breadcrumb for phones. iOS reloads a tab that runs out of memory without a console the
   player can read, so every few seconds this writes a small record of the page's load (scene
   meshes, textures, materials, soldiers, trucks, voice clips, battle time and, where the browser
   has it, the JS heap) to localStorage, and marks it closed when the page is left normally. A page
   that opens to an unclosed record from the last half hour was reloaded mid-battle: a banner shows
   that record so it can be read or copied, and window.__lastReload holds it. Diagnostics only;
   nothing in the battle reads it. `?breadcrumb=0` turns it off. */
(function (root) {
  'use strict';
  if (root.BattleReloadBreadcrumb || typeof root.document === 'undefined') return;
  var KEY = 'grasstex.reloadBreadcrumb',
    EVERY_MS = 5000,
    FRESH_MS = 30 * 60 * 1000;
  var search = (root.location && root.location.search) || '';
  if (/(?:^|[?&])breadcrumb=0(?:&|$)/.test(search)) return;
  function store() {
    try {
      return root.localStorage || null;
    } catch (_) {
      return null;
    }
  }
  function read() {
    var ls = store();
    if (!ls) return null;
    try {
      return JSON.parse(ls.getItem(KEY) || 'null');
    } catch (_) {
      return null;
    }
  }
  function write(record) {
    var ls = store();
    if (!ls) return;
    try {
      ls.setItem(KEY, JSON.stringify(record));
    } catch (_) {}
  }
  function count(list, test) {
    var n = 0;
    for (var i = 0; i < (list || []).length; i++) if (test(list[i])) n++;
    return n;
  }
  function snapshot() {
    var sim = root.__battle__,
      scene = sim && sim.scene,
      memory = root.performance && root.performance.memory,
      record = { at: Date.now(), page: search.slice(0, 400), closed: false };
    if (scene) {
      record.simTime = Math.round(+sim.time || 0);
      record.alive = sim.factions ? { us: sim.factions.us.alive, ge: sim.factions.ge.alive } : null;
      record.meshes = scene.meshes.length;
      record.enabledMeshes = count(scene.meshes, function (m) {
        return m.isEnabled && m.isEnabled();
      });
      record.textures = scene.textures.length;
      record.materials = scene.materials.length;
      record.geometries = scene.geometries ? scene.geometries.length : null;
      record.transformNodes = scene.transformNodes.length;
      record.sounds =
        scene.mainSoundTrack && scene.mainSoundTrack.soundCollection
          ? scene.mainSoundTrack.soundCollection.length
          : null;
      var engine = scene.getEngine && scene.getEngine();
      if (engine) record.render = [engine.getRenderWidth(), engine.getRenderHeight()];
      var trucks = root.BattleTransportVehicleVisual && root.BattleTransportVehicleVisual.summary;
      if (trucks)
        try {
          record.trucks = trucks(sim).length;
        } catch (_) {}
    }
    if (memory) record.heapMB = Math.round(memory.usedJSHeapSize / 1048576);
    return record;
  }
  function banner(last) {
    var minutes = Math.round((Date.now() - last.at) / 60000),
      box = root.document.createElement('div'),
      text = JSON.stringify(last);
    box.style.cssText =
      'position:fixed;left:8px;right:8px;bottom:8px;z-index:99999;background:rgba(20,20,20,.92);' +
      'color:#f3e6c4;font:12px/1.4 system-ui,sans-serif;padding:8px 10px;border-radius:8px;' +
      'max-height:40vh;overflow:auto;word-break:break-all';
    box.textContent =
      'The last battle page was reloaded ' +
      minutes +
      ' min ago without closing. Its last record: ' +
      text +
      ' (tap to copy, double-tap to close)';
    box.addEventListener('click', function () {
      if (root.navigator && root.navigator.clipboard)
        root.navigator.clipboard.writeText(text).catch(function () {});
    });
    box.addEventListener('dblclick', function () {
      box.remove();
    });
    root.document.body.appendChild(box);
  }
  var last = read();
  if (last && !last.closed && Date.now() - last.at < FRESH_MS) {
    root.__lastReload = last;
    if (root.document.body) banner(last);
    else
      root.addEventListener('DOMContentLoaded', function () {
        banner(last);
      });
  }
  write(snapshot());
  var timer = root.setInterval(function () {
    write(snapshot());
  }, EVERY_MS);
  root.addEventListener('pagehide', function () {
    var record = snapshot();
    record.closed = true;
    write(record);
  });
  root.BattleReloadBreadcrumb = {
    last: function () {
      return root.__lastReload || null;
    },
    snapshot: snapshot,
    stop: function () {
      root.clearInterval(timer);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
