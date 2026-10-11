/* Reported-contact tactical map. Presentation only: no omniscient hostile transforms,
   targeting, orders, RNG, perception refresh or game-state writes.
   Contacts come exclusively from the selected faction's TacticalSituation read model. */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleTacticalMap) return;

  var NS = 'http://www.w3.org/2000/svg';
  var RETAIN_SECONDS = 60;
  var FRESH_SECONDS = 8;
  var MOVEMENT_SECONDS = 12;
  var FRAME_MS = 260;
  var simRef = null,
    opened = false,
    viewFaction = 'us';
  var panel = null,
    svg = null,
    button = null,
    sideSelect = null,
    caption = null,
    style = null;
  var raf = 0,
    lastFrame = 0,
    keyListenerBound = false,
    previouslyLockedCanvas = false;
  var ledgers = {
    us: { lastTime: null, byKey: Object.create(null) },
    ge: { lastTime: null, byKey: Object.create(null) }
  };

  function finitePoint(p) {
    return p && Number.isFinite(+p.x) && Number.isFinite(+p.z) ? { x: +p.x, z: +p.z } : null;
  }
  function mapSize() {
    var gen = root.BattleScenarioGenerator;
    var s = gen && gen.current ? gen.current() : root.BATTLE_SCENARIO;
    return {
      width: s && s.map && s.map.width > 0 ? +s.map.width : (gen && gen.MAP_W) || 2000,
      depth: s && s.map && s.map.depth > 0 ? +s.map.depth : (gen && gen.MAP_D) || 1200
    };
  }
  function project(point, dimensions) {
    if (!finitePoint(point)) return null;
    dimensions = dimensions || mapSize();
    return {
      x: 500 + (+point.x / dimensions.width) * 940,
      y: 300 - (+point.z / dimensions.depth) * 560
    };
  }
  function node(tag, attrs, value) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      n.setAttribute(key, String(attrs[key]));
    });
    if (value != null) n.textContent = String(value);
    return n;
  }
  function add(parent, tag, attrs, value) {
    var n = node(tag, attrs, value);
    parent.appendChild(n);
    return n;
  }
  function clear(element) {
    while (element && element.firstChild) element.removeChild(element.firstChild);
  }
  function symbol(parent, entity, scale) {
    /* Reuse the squad-overlay's registered symbol kit. Do not fork new glyph artwork. */
    var kit = root.BattleTacticalSymbols;
    var spec = kit && kit.resolve ? kit.resolve(entity) : null;
    if (!spec) return;
    var group = add(parent, 'g', { transform: 'scale(' + scale + ')' });
    function primitive(p) {
      if (!p || !/^(rect|path|circle|ellipse|line|polygon|text)$/.test(p.tag)) return;
      add(group, p.tag, p.attrs || {}, p.text);
    }
    primitive(spec.frame);
    (spec.primitives || []).forEach(primitive);
    if (spec.echelon && spec.echelon.kind === 'dots') {
      var count = Math.max(0, Math.min(4, +spec.echelon.count || 0));
      for (var i = 0; i < count; i++)
        add(group, 'circle', {
          'class': 'sso-echelon',
          cx: (i - (count - 1) / 2) * 8,
          cy: Number.isFinite(+spec.echelon.y) ? +spec.echelon.y : -22,
          r: 3.2
        });
    }
  }
  function friendlyPosition(entity) {
    var explicit = finitePoint(entity && entity.overlayPosition);
    if (explicit) return explicit;
    var rootPos = finitePoint(entity && entity.root && entity.root.position);
    if (rootPos) return rootPos;
    var members = (entity && entity.members) || [];
    var x = 0,
      z = 0,
      count = 0;
    members.forEach(function (s) {
      var p = !s.dead && finitePoint(s.root && s.root.position);
      if (p) {
        x += p.x;
        z += p.z;
        count++;
      }
    });
    return count ? { x: x / count, z: z / count } : null;
  }
  function playerSide(sim) {
    var f = sim && sim.factions;
    if (!f) return null;
    for (var i = 0; i < 2; i++) {
      var side = i === 0 ? 'us' : 'ge';
      var squads = (f[side] && f[side].squads) || [];
      for (var j = 0; j < squads.length; j++) {
        if (
          (squads[j].members || []).some(function (s) {
            return s && s.isPlayer;
          })
        )
          return side;
      }
    }
    return null;
  }
  function resetLedgers() {
    ledgers = {
      us: { lastTime: null, byKey: Object.create(null) },
      ge: { lastTime: null, byKey: Object.create(null) }
    };
  }
  function reportKey(row) {
    if (row.targetId != null && String(row.targetId) !== '') return 'target:' + String(row.targetId);
    /* Unknown contacts cannot be correlated across positions: no inferred track. */
    return 'unidentified:' + String(row.squad) + ':' + Math.round(row.x / 20) + ':' + Math.round(row.z / 20);
  }
  function reconcile(ledger, reports, now) {
    now = +now;
    if (!Number.isFinite(now) || now < 0) return [];
    if (ledger.lastTime != null && now < ledger.lastTime) ledger.byKey = Object.create(null);
    ledger.lastTime = now;
    var best = Object.create(null);
    (reports || []).forEach(function (c) {
      if (!finitePoint(c) || !Number.isFinite(+c.at) || +c.at > now || now - +c.at > RETAIN_SECONDS) return;
      var key = reportKey(c);
      if (
        !best[key] ||
        +c.at > +best[key].at ||
        (+c.at === +best[key].at && String(c.squad) < String(best[key].squad))
      )
        best[key] = c;
    });
    Object.keys(best)
      .sort()
      .forEach(function (key) {
        var c = best[key],
          prev = ledger.byKey[key],
          at = +c.at;
        if (prev && at < prev.at) return;
        var move = prev ? prev.movement : null;
        /* Velocity cues require successive first-hand/reported fixes, never live
         enemy positions or an extrapolation into unobserved territory. */
        if (prev && at - prev.at >= 1.5 && key.indexOf('target:') === 0) {
          var d = Math.hypot(+c.x - prev.x, +c.z - prev.z);
          if (d >= 6 && d / (at - prev.at) <= 8) {
            move = { from: { x: prev.x, z: prev.z }, to: { x: +c.x, z: +c.z }, at: at };
          } else if (d > 0) move = null;
        }
        ledger.byKey[key] = {
          key: key,
          x: +c.x,
          z: +c.z,
          at: at,
          squad: c.squad,
          source: c.source == null ? null : String(c.source),
          confidence: c.confidence,
          targetId: c.targetId,
          movement: move
        };
      });
    Object.keys(ledger.byKey).forEach(function (key) {
      if (now - ledger.byKey[key].at > RETAIN_SECONDS) delete ledger.byKey[key];
    });
    return Object.keys(ledger.byKey)
      .sort()
      .map(function (key) {
        var c = ledger.byKey[key];
        return {
          key: c.key,
          x: c.x,
          z: c.z,
          at: c.at,
          age: Math.max(0, now - c.at),
          squad: c.squad,
          source: c.source,
          confidence: c.confidence,
          targetId: c.targetId,
          movement: c.movement && now - c.movement.at <= MOVEMENT_SECONDS ? c.movement : null
        };
      });
  }
  function snapshot(sim, faction) {
    var T = root.BattleTacticalSituation;
    return T && typeof T.compute === 'function' ? T.compute(sim, faction) : null;
  }
  function renderTerrain(layer, sim, dimensions) {
    var sc =
      root.BattleScenarioGenerator && root.BattleScenarioGenerator.current
        ? root.BattleScenarioGenerator.current()
        : root.BATTLE_SCENARIO;
    add(layer, 'rect', { x: 0, y: 0, width: 1000, height: 600, fill: '#28392f' });
    add(layer, 'rect', {
      x: 30,
      y: 20,
      width: 940,
      height: 560,
      fill: '#415144',
      stroke: '#9ea994',
      'stroke-width': 2
    });
    for (var x = -dimensions.width / 2 + 200; x < dimensions.width / 2; x += 200) {
      var px = project({ x: x, z: 0 }, dimensions).x;
      add(layer, 'line', { x1: px, y1: 20, x2: px, y2: 580, stroke: '#9bb19a', 'stroke-opacity': 0.2 });
    }
    for (var z = -dimensions.depth / 2 + 200; z < dimensions.depth / 2; z += 200) {
      var py = project({ x: 0, z: z }, dimensions).y;
      add(layer, 'line', { x1: 30, y1: py, x2: 970, y2: py, stroke: '#9bb19a', 'stroke-opacity': 0.2 });
    }
    if (sc) {
      (sc.roads || []).forEach(function (r) {
        var a = project({ x: r.ax, z: r.az }, dimensions),
          b = project({ x: r.bx, z: r.bz }, dimensions);
        if (!a || !b) return;
        add(layer, 'line', {
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          stroke: '#a6a38d',
          'stroke-width': 7,
          'stroke-opacity': 0.65
        });
        add(layer, 'line', {
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          stroke: '#d1c9aa',
          'stroke-width': 2,
          'stroke-dasharray': '12 9'
        });
      });
      (sc.buildings || []).forEach(function (b) {
        var p = project(b, dimensions);
        if (!p || !(b.w > 0) || !(b.d > 0)) return;
        var w = (b.w / dimensions.width) * 940,
          h = (b.d / dimensions.depth) * 560;
        add(layer, 'rect', {
          x: p.x - w / 2,
          y: p.y - h / 2,
          width: w,
          height: h,
          fill: '#202d26',
          stroke: '#9caa95',
          'stroke-width': 0.9
        });
      });
    }
    add(layer, 'text', { x: 52, y: 52, fill: '#e7ead2', 'font-size': 16, 'font-weight': 700 }, 'N ↑');
    add(
      layer,
      'text',
      { x: 950, y: 568, fill: '#d6ddc8', 'font-size': 11, 'text-anchor': 'end' },
      dimensions.width + ' × ' + dimensions.depth + ' m'
    );
  }
  function renderObjectives(layer, sim, dimensions) {
    var sc =
      root.BattleScenarioGenerator && root.BattleScenarioGenerator.current
        ? root.BattleScenarioGenerator.current()
        : root.BATTLE_SCENARIO;
    ((sc && sc.objectives) || []).forEach(function (o) {
      var p = project(o.point || o, dimensions);
      if (!p) return;
      var sector = sim.objectiveControl && sim.objectiveControl.sectors && sim.objectiveControl.sectors[o.id];
      var owner = sector && sector.owner;
      var color = owner === 'us' ? '#90bce9' : owner === 'ge' ? '#ef8e83' : '#f4e2a4';
      var g = add(layer, 'g', { transform: 'translate(' + p.x + ' ' + p.y + ')' });
      add(g, 'path', {
        d: 'M0 -13 L13 0 L0 13 L-13 0 Z',
        fill: '#263329',
        stroke: color,
        'stroke-width': 2.2
      });
      add(
        g,
        'text',
        { x: 0, y: 27, fill: '#f2eddb', 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700 },
        String(o.id)
      );
    });
  }
  function renderFriendlies(layer, sim, faction, dimensions) {
    var O = root.BattleSquadStatusOverlay;
    var entities =
      O && O.overlayEntities
        ? O.overlayEntities(sim, faction)
        : (((sim.factions || {})[faction] || {}).squads || []).map(function (sq) {
            return { entity: sq };
          });
    entities.forEach(function (row) {
      var sq = row.entity,
        at = friendlyPosition(sq),
        p = project(at, dimensions);
      if (!p || p.x < 30 || p.x > 970 || p.y < 20 || p.y > 580) return;
      var g = add(layer, 'g', { 'class': 'gtm-friendly', transform: 'translate(' + p.x + ' ' + p.y + ')' });
      symbol(g, sq, 0.5);
      add(
        g,
        'text',
        { x: 0, y: 27, 'text-anchor': 'middle', fill: '#e6f1fd', 'font-size': 11, 'font-weight': 700 },
        String(sq.overlayLabel != null ? sq.overlayLabel : sq.id)
      );
      var title = add(
        g,
        'title',
        {},
        String(sq.id) + ' · ' + (O && O.statusFor ? O.statusFor(sq, sim).label : 'FRIENDLY')
      );
    });
  }
  function renderContacts(layer, contacts, dimensions) {
    contacts.forEach(function (c) {
      var p = project(c, dimensions);
      if (!p || p.x < 30 || p.x > 970 || p.y < 20 || p.y > 580) return;
      var stale = c.age > FRESH_SECONDS;
      var heard = /heard|sound|noise|told|broadcast/i.test(c.source || '');
      var g = add(layer, 'g', {
        'class': 'gtm-enemy' + (stale ? ' gtm-stale' : ''),
        transform: 'translate(' + p.x + ' ' + p.y + ')'
      });
      /* A report is not a confirmed squad-size formation: use the infantry-type
         kit as a contact glyph, not the icon's squad-echelon dot. */
      var spec = root.BattleTacticalSymbols;
      var mark = spec && spec.get ? spec.get('infantry') : null;
      if (mark) {
        var stamp = add(g, 'g', { transform: 'scale(.43)' });
        function part(v) {
          if (v && /^(rect|path|circle|ellipse|line|polygon|text)$/.test(v.tag))
            add(stamp, v.tag, v.attrs || {}, v.text);
        }
        part(mark.frame);
        (mark.primitives || []).forEach(part);
      } else {
        add(g, 'circle', { r: 9, fill: 'none', stroke: '#ef9389', 'stroke-width': 2 });
      }
      add(g, 'circle', {
        r: heard ? 22 : 15,
        fill: 'none',
        stroke: '#f6a494',
        'stroke-opacity': stale ? 0.26 : heard ? 0.6 : 0.3,
        'stroke-dasharray': heard || stale ? '4 4' : 'none'
      });
      add(
        g,
        'text',
        { x: 0, y: 28, fill: '#ffe0cf', 'font-size': 10, 'font-weight': 700, 'text-anchor': 'middle' },
        Math.floor(c.age) + 's'
      );
      add(
        g,
        'title',
        {},
        'Enemy report, last fix ' +
          Math.floor(c.age) +
          's ago · ' +
          (c.source || 'unknown source') +
          ' · reporting squad ' +
          c.squad
      );
      if (c.movement) {
        var a = project(c.movement.from, dimensions),
          b = project(c.movement.to, dimensions);
        if (a && b) {
          add(layer, 'path', {
            d: 'M' + a.x + ' ' + a.y + ' L' + b.x + ' ' + b.y,
            fill: 'none',
            stroke: '#ffd2a6',
            'stroke-width': 2.3,
            'stroke-dasharray': '5 3',
            'marker-end': 'url(#gtm-arrow)'
          });
        }
      }
    });
  }
  function render() {
    if (!opened || !svg || !simRef) return;
    var sim = simRef;
    var locked = playerSide(sim);
    var faction = locked || viewFaction;
    if (sideSelect) {
      sideSelect.disabled = !!locked;
      sideSelect.value = faction;
      sideSelect.title = locked
        ? 'Possession locks intelligence to your faction'
        : 'Choose report perspective';
    }
    var situation = snapshot(sim, faction);
    if (!situation) return;
    var contacts = reconcile(ledgers[faction], situation.contacts, +sim.time || 0);
    var dims = mapSize();
    clear(svg);
    var defs = add(svg, 'defs');
    var marker = add(defs, 'marker', {
      id: 'gtm-arrow',
      markerWidth: 7,
      markerHeight: 7,
      refX: 5,
      refY: 3,
      orient: 'auto',
      markerUnits: 'strokeWidth'
    });
    add(marker, 'path', { d: 'M0 0 L6 3 L0 6 Z', fill: '#ffd2a6' });
    renderTerrain(svg, sim, dims);
    renderObjectives(svg, sim, dims);
    renderFriendlies(svg, sim, faction, dims);
    renderContacts(svg, contacts, dims);
    if (caption)
      caption.textContent =
        faction.toUpperCase() +
        ' intelligence · ' +
        situation.aliveSquads +
        ' friendly squads · ' +
        contacts.length +
        ' reported contacts · sim ' +
        Math.floor(+sim.time || 0) +
        's' +
        (locked ? ' · PLAYER LOCKED' : '');
  }
  function isEditable(target) {
    return !!(
      target &&
      (/^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName || '') || target.isContentEditable)
    );
  }
  /* M toggles the map without granting any enemy knowledge. Escape dismisses it.
     Capture before the desktop camera's bubble listener so player/flight controls
     cannot fire while the map has keyboard focus. Native select/close controls
     continue to handle their own input. */
  function mapKeyDown(event) {
    if (!event) return;
    var key = String(event.key || '').toLowerCase();
    if (key === 'm' && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey &&
        !isEditable(event.target)) {
      setOpen(!opened);
      if (event.preventDefault) event.preventDefault();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      return;
    }
    if (!opened) return;
    if (key === 'escape') {
      setOpen(false);
      if (event.preventDefault) event.preventDefault();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      return;
    }
    /* Keep arrows, typing and keyboard button activation working inside the
       map, but stop the same events reaching camera/player controls. */
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    if (!isEditable(event.target) && !(panel && panel.contains && panel.contains(event.target))) {
      if (event.preventDefault) event.preventDefault();
    }
  }
  function setOpen(value) {
    var next = !!value;
    if (opened === next) return opened;
    opened = next;
    /* The pointer must leave FPS mouse capture so the map can be interacted with.
       Restore it only if this map released it, and only when play resumes. */
    if (typeof document !== 'undefined' && opened) {
      previouslyLockedCanvas =
        !!(document.pointerLockElement && document.pointerLockElement.id === 'renderCanvas');
      if (previouslyLockedCanvas && document.exitPointerLock) document.exitPointerLock();
    } else if (typeof document !== 'undefined' && previouslyLockedCanvas) {
      previouslyLockedCanvas = false;
      var canvas = document.getElementById && document.getElementById('renderCanvas');
      if (canvas && canvas.requestPointerLock) {
        try {
          var request = canvas.requestPointerLock();
          if (request && request.catch) request.catch(function () {});
        } catch (_) {}
      }
    }
    if (panel) panel.hidden = !opened;
    if (button) {
      button.setAttribute('aria-expanded', String(opened));
      button.classList.toggle('active', opened);
    }
    if (opened) render();
    return opened;
  }
  function install() {
    if (typeof document === 'undefined' || panel) return;
    style = document.createElement('style');
    style.textContent = [
      '#battleTacticalMapButton{position:fixed;left:12px;bottom:51px;z-index:59;padding:8px 11px;background:#233a31;color:#f0efdb;border:1px solid #9aa989;border-radius:6px;font:700 11px Arial;cursor:pointer}',
      '#battleTacticalMapButton.active{background:#52664b}',
      '#battleTacticalMap{position:fixed;inset:3% 3%;z-index:60;display:flex;align-items:center;justify-content:center;pointer-events:none}',
      '#battleTacticalMap[hidden]{display:none!important}',
      '.gtm-shell{pointer-events:auto;width:min(96vw,960px);max-height:93vh;overflow:auto;box-sizing:border-box;padding:12px;background:#15231d;border:2px solid #8f9e82;border-radius:9px;box-shadow:0 8px 50px #000c;color:#efeddb;font:12px Arial}',
      '.gtm-toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:8px}',
      '.gtm-toolbar strong{font-size:17px;letter-spacing:.05em;margin-right:auto}',
      '.gtm-toolbar select,.gtm-toolbar button{font:700 12px Arial;padding:7px 10px;color:#eff3e7;background:#293e32;border:1px solid #9caa93;border-radius:5px;cursor:pointer}',
      '.gtm-toolbar select:disabled{opacity:.6;cursor:default}',
      '#battleTacticalMap svg{display:block;width:100%;height:auto;max-height:66vh;aspect-ratio:5/3;background:#28392f}',
      '.gtm-friendly{color:#99c6f5}.gtm-enemy{color:#ff9989}.gtm-stale{opacity:.52}',
      '#battleTacticalMap .sso-frame{fill:#192724;stroke:currentColor;stroke-width:2.6}',
      '#battleTacticalMap .sso-symbol-stroke{stroke:currentColor;fill:none;stroke-width:2.3}',
      '#battleTacticalMap .sso-symbol-fill{fill:currentColor;stroke:currentColor}',
      '#battleTacticalMap .sso-symbol-text{fill:currentColor;font:700 13px Arial;text-anchor:middle}',
      '#battleTacticalMap .sso-echelon{fill:currentColor}',
      '.gtm-caption{margin:8px 0 4px;font:700 11px Arial;color:#c5d5c0}',
      '.gtm-legend{margin:5px 0 0;color:#b9c7b9;font:11px Arial;line-height:1.4}'
    ].join('');
    document.head.appendChild(style);
    button = document.createElement('button');
    button.id = 'battleTacticalMapButton';
    button.type = 'button';
    button.textContent = 'Tactical Map [M]';
    button.title = 'Press M to open or close the full tactical map';
    button.setAttribute('aria-controls', 'battleTacticalMap');
    button.setAttribute('aria-expanded', 'false');
    button.onclick = function () {
      setOpen(!opened);
    };
    document.body.appendChild(button);
    panel = document.createElement('section');
    panel.id = 'battleTacticalMap';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Reported-contact tactical map');
    var shell = document.createElement('div');
    shell.className = 'gtm-shell';
    var toolbar = document.createElement('div');
    toolbar.className = 'gtm-toolbar';
    var heading = document.createElement('strong');
    heading.textContent = 'TACTICAL MAP / CONTACT PICTURE';
    toolbar.appendChild(heading);
    sideSelect = document.createElement('select');
    sideSelect.setAttribute('aria-label', 'Friendly intelligence perspective');
    ['us', 'ge'].forEach(function (side) {
      var option = document.createElement('option');
      option.value = side;
      option.textContent = side === 'us' ? 'US Reports' : 'GE Reports';
      sideSelect.appendChild(option);
    });
    sideSelect.onchange = function () {
      viewFaction = sideSelect.value;
      render();
    };
    toolbar.appendChild(sideSelect);
    var close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Close [M / Esc]';
    close.onclick = function () {
      setOpen(false);
    };
    toolbar.appendChild(close);
    shell.appendChild(toolbar);
    svg = node('svg', {
      viewBox: '0 0 1000 600',
      role: 'img',
      'aria-label': 'Top-down battlefield with friendly formations and reported enemy contacts'
    });
    shell.appendChild(svg);
    caption = document.createElement('p');
    caption.className = 'gtm-caption';
    shell.appendChild(caption);
    var legend = document.createElement('p');
    legend.className = 'gtm-legend';
    legend.textContent =
      'Blue: friendly units · Red: last reported enemy locations · Dashed/faded: old or uncertain reports · Tan arrows: movement between two reported fixes (not prediction). Reports disappear after 60 simulated seconds; this map never tracks unseen enemies.';
    shell.appendChild(legend);
    panel.appendChild(shell);
    document.body.appendChild(panel);
    if (!keyListenerBound && root.addEventListener) {
      root.addEventListener('keydown', mapKeyDown, true);
      keyListenerBound = true;
    }
  }
  function loop(ms) {
    raf = 0;
    if (opened && (!lastFrame || ms - lastFrame >= FRAME_MS)) {
      lastFrame = ms || 0;
      render();
    }
    if (typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(loop);
  }
  function start(sim) {
    simRef = sim || root.__battle__ || null;
    resetLedgers();
    setOpen(false);
    install();
    if (!raf && typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(loop);
  }
  function reset() {
    resetLedgers();
    setOpen(false);
  }
  function dispose() {
    if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
    raf = 0;
    if (keyListenerBound && root.removeEventListener) {
      root.removeEventListener('keydown', mapKeyDown, true);
      keyListenerBound = false;
    }
    setOpen(false);
    previouslyLockedCanvas = false;
    [panel, button, style].forEach(function (el) {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    panel = button = style = svg = sideSelect = caption = null;
    simRef = null;
    resetLedgers();
  }
  root.BattleTacticalMap = {
    version: '1.0',
    project: project,
    reconcile: reconcile,
    reportKey: reportKey,
    playerSide: playerSide,
    snapshot: snapshot,
    setOpen: setOpen,
    isOpen: function () { return opened; },
    mapKeyDown: mapKeyDown,
    render: render,
    dispose: dispose,
    retentionSeconds: RETAIN_SECONDS
  };
  root.BattleModules.registerSystem('reported-contact-tactical-map', {
    version: '1.0',
    onBattleStart: start,
    beforeBattleRestart: reset,
    onBattleRestart: start
  });
  if (typeof document !== 'undefined') install();
})(typeof window !== 'undefined' ? window : globalThis);
