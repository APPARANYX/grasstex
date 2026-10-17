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
    style = null,
    reportsNode = null,
    airSection = null,
    airButton = null,
    airStatus = null,
    airReportsNode = null,
    objectivesNode = null,
    headerInfo = null,
    operationalInfo = null,
    zoomText = null,
    staticLayer = null,
    dynamicLayer = null,
    backdropScenario = null,
    backdropFootprints = null;
  var viewport = { zoom: 1, cx: 500, cy: 300 },
    drag = null;
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
  function scenario() {
    var gen = root.BattleScenarioGenerator;
    return gen && gen.current ? gen.current() : root.BATTLE_SCENARIO;
  }
  function gridRef(point, dimensions) {
    if (!finitePoint(point)) return '—';
    var col = Math.max(0, Math.min(9, Math.floor((+point.x / dimensions.width + 0.5) * 10)));
    var row = Math.max(0, Math.min(5, Math.floor((0.5 - +point.z / dimensions.depth) * 6)));
    return 'ABCDEFGHIJ'.charAt(col) + (row + 1);
  }
  /* Cartographic decoration is deterministic and never reads tactical RNG.
     Actual geographic claims (roads, buildings, hedges, trees, objectives)
     come from the existing scenario and field footprint descriptors. */
  function shade(seed, n) {
    var v = (Math.imul((n + 3) ^ seed, 1664525) + 1013904223) | 0;
    v = Math.imul(v ^ (v >>> 16), 2246822519);
    return ((v ^ (v >>> 13)) >>> 0) / 4294967296;
  }
  function renderTerrain(layer, sim, dimensions) {
    var sc = scenario();
    var hash = root.BattleScenarioGenerator && root.BattleScenarioGenerator.hashSeed;
    var seed = hash ? hash(sc && sc.seed) : 137;
    add(layer, 'rect', { x: 0, y: 0, width: 1000, height: 600, fill: '#222b28' });
    var paper = add(layer, 'g', { 'class': 'gtm-paper' });
    add(paper, 'rect', { x: 30, y: 20, width: 940, height: 560, fill: '#96977a' });
    /* Field-paper blocks provide subtle relief without implying non-existent
       rivers, towns or roads. Their coordinates are strictly decorative. */
    var palette = ['#839071', '#abb08d', '#a0a384', '#858d70', '#b1aa8e', '#929b79'];
    for (var row = 0; row < 7; row++)
      for (var col = 0; col < 12; col++) {
        var i = row * 12 + col;
        var x = 30 + col * (940 / 12),
          y = 20 + row * 80;
        var variation = shade(seed, i);
        add(paper, 'path', {
          d:
            'M' +
            x +
            ' ' +
            y +
            ' l' +
            940 / 12 +
            ' 0 l' +
            (shade(seed, i + 144) * 16 - 8) +
            ' 80 l-' +
            940 / 12 +
            ' 0 Z',
          fill: palette[Math.floor(variation * palette.length)],
          'fill-opacity': 0.42
        });
        if (variation > 0.45)
          add(paper, 'path', {
            d: 'M' + (x + 8) + ' ' + (y + 20) + ' l' + (940 / 12 - 18) + ' -9',
            stroke: '#4c5946',
            'stroke-opacity': 0.09,
            'stroke-width': 1,
            fill: 'none'
          });
      }
    /* Display the same actual physical hedge and tree placement used by the
       three-dimensional battlefield, if the clutter placement is available. */
    var footprints = (sim && sim.obstacles && sim.obstacles.__physicalFootprints) || [];
    var cover = add(layer, 'g', { 'class': 'gtm-cover' });
    var drawn = 0;
    footprints.forEach(function (fp) {
      if (!fp || drawn >= 900 || !finitePoint(fp)) return;
      if (fp.type !== 'tree' && fp.type !== 'hedge') return;
      var p = project(fp, dimensions);
      if (!p || p.x < 32 || p.x > 968 || p.y < 22 || p.y > 578) return;
      if (fp.type === 'tree') {
        add(cover, 'circle', {
          cx: p.x,
          cy: p.y,
          r: 2.7,
          fill: '#364f3e',
          stroke: '#738767',
          'stroke-width': 0.65,
          opacity: 0.85
        });
      } else if (fp.shape === 'obb') {
        var ux = ((+fp.ux || 0) * (+fp.hx || 0) * 940) / dimensions.width,
          uz = ((+fp.uz || 0) * (+fp.hx || 0) * -560) / dimensions.depth;
        add(cover, 'path', {
          d: 'M' + (p.x - ux) + ' ' + (p.y - uz) + ' L' + (p.x + ux) + ' ' + (p.y + uz),
          stroke: '#415d46',
          'stroke-width': 2.1,
          'stroke-linecap': 'round',
          opacity: 0.78
        });
      }
      drawn++;
    });
    if (sc) {
      (sc.roads || []).forEach(function (r) {
        var a = project({ x: r.ax, z: r.az }, dimensions),
          b = project({ x: r.bx, z: r.bz }, dimensions);
        if (!a || !b) return;
        var w = Math.max(2, ((+r.width || 8) * 940) / dimensions.width);
        add(layer, 'line', {
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          stroke: '#515950',
          'stroke-width': w + 2,
          'stroke-opacity': 0.6
        });
        add(layer, 'line', {
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          stroke: '#d1c7a8',
          'stroke-width': w,
          'stroke-opacity': 0.94
        });
        add(layer, 'line', {
          x1: a.x,
          y1: a.y,
          x2: b.x,
          y2: b.y,
          stroke: '#817f6c',
          'stroke-width': 0.8,
          'stroke-dasharray': '5 6'
        });
      });
      var city = add(layer, 'g', { 'class': 'gtm-buildings' });
      (sc.buildings || []).forEach(function (b) {
        var p = project(b, dimensions);
        if (!p || !(b.w > 0) || !(b.d > 0)) return;
        var w = (b.w / dimensions.width) * 940,
          h = (b.d / dimensions.depth) * 560;
        var house = add(city, 'g', {
          transform: 'translate(' + p.x + ' ' + p.y + ') rotate(' + (-(+b.rot || 0) * 180) / Math.PI + ')'
        });
        add(house, 'rect', {
          x: -w / 2,
          y: -h / 2,
          width: w,
          height: h,
          fill: '#41433a',
          stroke: '#c4b99b',
          'stroke-width': 0.8
        });
      });
    }
    /* The same 200 m world grid used by the scenario, shown as map squares. */
    var grid = add(layer, 'g', { 'class': 'gtm-coordinate-grid' });
    for (var ix = 0; ix <= 10; ix++) {
      var gx = 30 + 94 * ix;
      add(grid, 'line', {
        x1: gx,
        y1: 20,
        x2: gx,
        y2: 580,
        stroke: '#26352c',
        'stroke-opacity': 0.3,
        'stroke-width': ix % 5 === 0 ? 1.5 : 0.8
      });
      if (ix < 10)
        add(
          grid,
          'text',
          {
            x: gx + 47,
            y: 14,
            'text-anchor': 'middle',
            fill: '#eee4c7',
            'font-size': 12
          },
          'ABCDEFGHIJ'.charAt(ix)
        );
    }
    for (var iy = 0; iy <= 6; iy++) {
      var gy = 20 + (560 / 6) * iy;
      add(grid, 'line', {
        x1: 30,
        y1: gy,
        x2: 970,
        y2: gy,
        stroke: '#26352c',
        'stroke-opacity': 0.3,
        'stroke-width': iy % 3 === 0 ? 1.5 : 0.8
      });
      if (iy < 6)
        add(
          grid,
          'text',
          {
            x: 16,
            y: gy + 560 / 12 + 4,
            'text-anchor': 'middle',
            fill: '#eee4c7',
            'font-size': 12
          },
          String(iy + 1)
        );
    }
    add(layer, 'rect', {
      x: 30,
      y: 20,
      width: 940,
      height: 560,
      fill: 'none',
      stroke: '#222b28',
      'stroke-width': 2
    });
    add(
      layer,
      'text',
      {
        x: 48,
        y: 47,
        fill: '#252b25',
        'font-size': 18,
        'font-weight': 700,
        'paint-order': 'stroke',
        stroke: '#bdc4a4',
        'stroke-width': 2.5
      },
      'N ↑'
    );
    var meters = 200,
      px = (meters * 940) / dimensions.width;
    var bar = add(layer, 'g', { 'class': 'gtm-scale', transform: 'translate(62 555)' });
    add(bar, 'rect', { x: -8, y: -19, width: px + 54, height: 30, fill: '#ddd3b4', opacity: 0.72 });
    add(bar, 'line', { x1: 0, y1: 0, x2: px, y2: 0, stroke: '#172820', 'stroke-width': 3 });
    [0, px / 2, px].forEach(function (x) {
      add(bar, 'line', { x1: x, y1: -4, x2: x, y2: 4, stroke: '#172820', 'stroke-width': 2 });
    });
    add(bar, 'text', { x: 0, y: -8, 'font-size': 10, fill: '#172820' }, '0');
    add(bar, 'text', { x: px, y: -8, 'font-size': 10, 'text-anchor': 'end', fill: '#172820' }, '200 m');
  }
  function renderReports(contacts, dims, sim) {
    if (!reportsNode) return;
    clear(reportsNode);
    var ordered = contacts.slice().sort(function (a, b) {
      return a.age - b.age || String(a.key).localeCompare(String(b.key));
    });
    if (!ordered.length) {
      var empty = document.createElement('p');
      empty.className = 'gtm-report-empty';
      empty.textContent = 'No current reported enemy contacts. Unobserved enemy forces are not displayed.';
      reportsNode.appendChild(empty);
    }
    ordered.slice(0, 8).forEach(function (c, i) {
      var item = document.createElement('div');
      item.className = 'gtm-report-row';
      var badge = document.createElement('span');
      badge.className = 'gtm-report-marker';
      badge.textContent = gridRef(c, dims);
      item.appendChild(badge);
      var detail = document.createElement('div');
      var age = document.createElement('strong');
      age.textContent = 'CONTACT ' + String(i + 1).padStart(2, '0') + ' · ' + Math.floor(c.age) + 's AGO';
      detail.appendChild(age);
      var explanation = document.createElement('small');
      var source = /heard|sound|noise/i.test(c.source || '')
        ? 'HEARD'
        : /relay|told|broadcast/i.test(c.source || '')
          ? 'RELAYED'
          : 'REPORTED';
      explanation.textContent =
        source +
        ' · ' +
        (c.squad == null ? 'UNKNOWN SQUAD' : String(c.squad)) +
        (c.movement ? ' · TWO FIXES' : '') +
        (c.age > FRESH_SECONDS ? ' · AGING' : '');
      detail.appendChild(explanation);
      item.appendChild(detail);
      reportsNode.appendChild(item);
    });
    if (ordered.length > 8) {
      var more = document.createElement('p');
      more.className = 'gtm-report-empty';
      more.textContent = '+' + (ordered.length - 8) + ' additional reports marked on map';
      reportsNode.appendChild(more);
    }
  }
  /* Objective letters stay at actual capture coordinates. Full labels and
     grid references move to the rail so clustered strongpoints remain legible. */
  function renderObjectives(layer, sim, dimensions) {
    var sc = scenario();
    ((sc && sc.objectives) || []).forEach(function (o, i) {
      var p = project(o.point || o, dimensions);
      if (!p) return;
      var sector = sim.objectiveControl && sim.objectiveControl.sectors && sim.objectiveControl.sectors[o.id];
      var owner = sector && sector.owner;
      var color = owner === 'us' ? '#90bce9' : owner === 'ge' ? '#ef8e83' : '#f4e2a4';
      var key = String.fromCharCode(65 + (i % 26));
      var g = add(layer, 'g', { 'class': 'gtm-objective', transform: 'translate(' + p.x + ' ' + p.y + ')' });
      add(g, 'path', {
        d: 'M0 -15 L15 0 L0 15 L-15 0 Z',
        fill: '#29312b',
        stroke: color,
        'stroke-width': 2.4
      });
      add(
        g,
        'text',
        {
          x: 0,
          y: 5,
          fill: color,
          'text-anchor': 'middle',
          'font-size': 13,
          'font-weight': 700
        },
        key
      );
      add(g, 'title', {}, key + ': ' + String(o.label || o.id) + ' · ' + gridRef(o.point || o, dimensions));
    });
  }
  function renderObjectiveList(sim, dimensions) {
    if (!objectivesNode) return;
    clear(objectivesNode);
    var sc = scenario();
    ((sc && sc.objectives) || []).forEach(function (o, i) {
      var sector = sim.objectiveControl && sim.objectiveControl.sectors && sim.objectiveControl.sectors[o.id];
      var owner = sector && sector.owner;
      var color = owner === 'us' ? 'friendly' : owner === 'ge' ? 'hostile' : 'neutral';
      var item = document.createElement('div');
      item.className = 'gtm-objective-row';
      var letter = document.createElement('span');
      letter.className = 'gtm-obj-id ' + color;
      letter.textContent = String.fromCharCode(65 + (i % 26));
      item.appendChild(letter);
      var description = document.createElement('span');
      description.textContent = String(o.label || o.id);
      item.appendChild(description);
      var grid = document.createElement('small');
      grid.textContent = gridRef(o.point || o, dimensions);
      item.appendChild(grid);
      objectivesNode.appendChild(item);
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
  /* Air reconnaissance is a bounded General-owned observation, not a second
     perception system. Only the selected faction's immutable, still-valid
     BattleAerialRecon.forGeneral DTO may be plotted or described. */
  function aerialView(sim, faction) {
    var A = root.BattleAerialRecon,
      status = A && A.status ? A.status(sim, faction) : { enabled: false, used: false },
      event = A && A.forGeneral ? A.forGeneral(sim, faction) : null;
    return { status: status, event: event };
  }
  function renderAerial(layer, reports, dimensions, sim, faction) {
    var view = aerialView(sim, faction), status = view.status, event = view.event;
    if (airSection) airSection.hidden = !status.enabled;
    if (!status.enabled) return;
    if (airButton) {
      airButton.disabled = !!status.used || sim.paused || (+sim.time || 0) < 5;
      airButton.textContent = status.used ? 'SORTIE EXPENDED' : 'REQUEST AIR RECON';
      airButton.title = 'One authorized air survey per General; no exact enemy targeting information';
    }
    if (airStatus) {
      airStatus.textContent = status.used
        ? event
          ? 'REPORT RECEIVED · ' + status.contacts + ' moving contacts · expires in ' +
            Math.max(0, Math.ceil(event.validUntil - sim.time)) + 's'
          : 'SORTIE COMPLETE · INTELLIGENCE EXPIRED'
        : sim.paused || sim.time < 5
          ? 'AVAILABLE AFTER DEPLOYMENT · ONE SORTIE'
          : 'ONE SORTIE AVAILABLE · REPORTS LAST 45s';
    }
    if (airReportsNode) clear(airReportsNode);
    if (!event) return;
    (event.contacts || []).forEach(function (c) {
      var p = project(c, dimensions);
      if (!p || p.x < 30 || p.x > 970 || p.y < 20 || p.y > 580) return;
      var ring = Math.max(5, (c.positionUncertaintyM || 40) * 940 / dimensions.width),
        group = add(layer, 'g', {
          'class': 'gtm-air-fix',
          transform: 'translate(' + p.x + ' ' + p.y + ')'
        });
      add(group, 'circle', {
        r: ring, fill: '#ecbc71', 'fill-opacity': .09, stroke: '#f7c37c',
        'stroke-width': 1.6, 'stroke-dasharray': '5 4'
      });
      add(group, 'path', { d: 'M0 -10 L8 7 L0 3 L-8 7 Z',
        fill: '#f4cf91', stroke: '#403527', 'stroke-width': 1,
        transform: 'rotate(' + ((c.headingRadians || 0) * 180 / Math.PI) + ')'
      });
      add(group, 'title', {},
        'AIR RECON · approximate fix · ' + gridRef(c, dimensions) +
        ' · heading and speed uncertain · observation ' + event.observedAt + 's');
      if (!airReportsNode) return;
      var item = document.createElement('div');
      item.className = 'gtm-air-contact';
      var age = Math.max(0, Math.floor(sim.time - event.observedAt));
      item.textContent = 'AIR FIX ' + gridRef(c, dimensions) +
        ' · ' + age + 's OLD · ~' + c.speedMps + 'm/s' +
        ' · CONF ' + Math.round(100 * c.confidence) + '%' +
        ' · ±' + c.positionUncertaintyM + 'm';
      airReportsNode.appendChild(item);
    });
    if (airReportsNode && !event.contacts.length) {
      var empty = document.createElement('p');
      empty.className = 'gtm-report-empty';
      empty.textContent = 'No qualifying moving enemy formations observed on this sortie.';
      airReportsNode.appendChild(empty);
    }
  }
  function requestAerialRecon() {
    if (!simRef || !opened) return null;
    var A = root.BattleAerialRecon, faction = playerSide(simRef) || viewFaction;
    if (!A || !A.request) return null;
    var event = A.request(simRef, faction, { playerOrdered: true });
    render();
    return event;
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
    var sc = scenario(),
      footprints = sim.obstacles && sim.obstacles.__physicalFootprints;
    if (!staticLayer || backdropScenario !== sc || backdropFootprints !== footprints) {
      clear(svg);
      staticLayer = add(svg, 'g', { 'class': 'gtm-static-map' });
      dynamicLayer = add(svg, 'g', { 'class': 'gtm-dynamic-map' });
      var defs = add(staticLayer, 'defs');
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
      renderTerrain(staticLayer, sim, dims);
      backdropScenario = sc;
      backdropFootprints = footprints;
    }
    clear(dynamicLayer);
    renderObjectives(dynamicLayer, sim, dims);
    renderObjectiveList(sim, dims);
    renderFriendlies(dynamicLayer, sim, faction, dims);
    renderContacts(dynamicLayer, contacts, dims);
    renderReports(contacts, dims, sim);
    renderAerial(dynamicLayer, contacts, dims, sim, faction);
    if (headerInfo)
      headerInfo.textContent = (faction === 'us' ? 'UNITED STATES' : 'GERMANY') + ' / INTELLIGENCE VIEW';
    if (operationalInfo)
      operationalInfo.textContent =
        (sc && sc.seed ? 'SCENARIO ' + String(sc.seed).slice(0, 34) : 'FIELD MAP') +
        ' · ' +
        dims.width +
        ' × ' +
        dims.depth +
        'm';
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
    return !!(target && (/^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName || '') || target.isContentEditable));
  }
  /* M toggles the map without granting any enemy knowledge. Escape dismisses it.
     Capture before the desktop camera's bubble listener so player/flight controls
     cannot fire while the map has keyboard focus. Native select/close controls
     continue to handle their own input. */
  function mapKeyDown(event) {
    if (!event) return;
    var key = String(event.key || '').toLowerCase();
    if (
      key === 'm' &&
      !event.repeat &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !isEditable(event.target)
    ) {
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
  function applyViewport() {
    if (!svg) return;
    var w = 1000 / viewport.zoom,
      h = 600 / viewport.zoom;
    viewport.cx = Math.max(w / 2, Math.min(1000 - w / 2, viewport.cx));
    viewport.cy = Math.max(h / 2, Math.min(600 - h / 2, viewport.cy));
    svg.setAttribute('viewBox', [viewport.cx - w / 2, viewport.cy - h / 2, w, h].join(' '));
    if (zoomText) zoomText.textContent = Math.round(viewport.zoom * 100) + '%';
  }
  function zoomTo(amount) {
    viewport.zoom = Math.max(1, Math.min(3.5, amount));
    applyViewport();
  }
  function resetViewport() {
    viewport.zoom = 1;
    viewport.cx = 500;
    viewport.cy = 300;
    applyViewport();
  }
  function setOpen(value) {
    var next = !!value;
    if (opened === next) return opened;
    opened = next;
    /* The pointer must leave FPS mouse capture so the map can be interacted with.
       Restore it only if this map released it, and only when play resumes. */
    if (typeof document !== 'undefined' && opened) {
      previouslyLockedCanvas = !!(
        document.pointerLockElement && document.pointerLockElement.id === 'renderCanvas'
      );
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
      '#battleTacticalMap{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;background:#0c1414e8;pointer-events:auto;color:#e8e5da;font-family:Arial,sans-serif}',
      '#battleTacticalMap[hidden]{display:none!important}',
      '.gtm-shell{width:min(98vw,1570px);height:min(96vh,940px);min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;background:#17201e;border:1px solid #69766b;box-shadow:0 18px 80px #000e;overflow:hidden}',
      '.gtm-toolbar{display:flex;align-items:center;gap:16px;padding:14px 22px;border-bottom:1px solid #526057;background:#17201f}',
      '.gtm-brand{display:flex;flex-direction:column;gap:4px;min-width:0;margin-right:auto}',
      '.gtm-toolbar strong{font:700 clamp(17px,2vw,26px) Arial;letter-spacing:.16em;color:#efe9d7}',
      '.gtm-toolbar small{font:700 10px Arial;letter-spacing:.19em;color:#aebcae}',
      '.gtm-toolbar select,.gtm-toolbar button,.gtm-map-actions button{font:700 12px Arial;padding:9px 13px;color:#e6eadf;background:#27352f;border:1px solid #849385;border-radius:2px;cursor:pointer}',
      '.gtm-toolbar select:disabled{opacity:.55;cursor:not-allowed}',
      '.gtm-body{display:grid;grid-template-columns:minmax(0,1fr) 290px;min-height:0}',
      '.gtm-map-column{display:flex;flex-direction:column;min-height:0;min-width:0;background:#1d2925;padding:16px 15px 8px 16px}',
      '.gtm-map-head{display:flex;justify-content:space-between;gap:10px;margin:0 4px 9px;color:#d3d6c5;font:700 11px Arial;letter-spacing:.1em}',
      '.gtm-map-surface{min-width:0;min-height:0;flex:1;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#242d26}',
      '#battleTacticalMap svg{display:block;max-width:100%;max-height:100%;width:100%;height:100%;aspect-ratio:5/3;cursor:grab;touch-action:none;user-select:none}',
      '#battleTacticalMap svg.gtm-dragging{cursor:grabbing}',
      '.gtm-friendly{color:#94c5fc}.gtm-enemy{color:#f5887c}.gtm-stale{opacity:.5}',
      '#battleTacticalMap .sso-frame{fill:#20322d;stroke:currentColor;stroke-width:2.6}',
      '#battleTacticalMap .sso-symbol-stroke{stroke:currentColor;fill:none;stroke-width:2.3}',
      '#battleTacticalMap .sso-symbol-fill{fill:currentColor;stroke:currentColor}',
      '#battleTacticalMap .sso-symbol-text{fill:currentColor;font:700 13px Arial;text-anchor:middle}',
      '#battleTacticalMap .sso-echelon{fill:currentColor}',
      '.gtm-map-actions{display:flex;align-items:center;gap:6px;justify-content:flex-end;margin-top:8px;color:#bfcbbe}',
      '.gtm-map-actions button{padding:5px 10px;min-width:32px}',
      '.gtm-zoom-label{font:700 10px Arial;min-width:42px;text-align:center}',
      '.gtm-side{display:flex;flex-direction:column;gap:0;min-height:0;border-left:1px solid #68736a;background:#1a2222}',
      '.gtm-side-section{padding:15px 15px 17px;border-bottom:1px solid #48534d}',
      '.gtm-side h3{font:700 13px Arial;letter-spacing:.12em;color:#eeece0;margin:0 0 13px}',
      '.gtm-legend-line{display:flex;align-items:center;gap:11px;margin:10px 0;color:#cbd2c6;font:12px Arial}',
      '.gtm-swatch{display:inline-flex;align-items:center;justify-content:center;width:28px;min-width:28px;height:19px;font-size:17px;font-weight:700}',
      '.gtm-swatch.friendly{color:#91c2fd}.gtm-swatch.hostile{color:#fb887b}.gtm-swatch.unknown{color:#e1d6af}',
      '.gtm-swatch.road{height:3px;background:#c9bb99;margin:8px 0}.gtm-swatch.cover{height:9px;background:#496b4e;margin:5px 0}',
      '.gtm-objectives{max-height:215px;overflow:auto}',
      '.gtm-objective-row{display:flex;align-items:center;gap:9px;color:#cdd3c5;font:11px Arial;margin:7px 0}',
      '.gtm-obj-id{width:23px;min-width:23px;height:23px;border:1px solid #ebdba7;display:inline-flex;align-items:center;justify-content:center;color:#ebdba7;font-weight:700;background:#28322a}',
      '.gtm-obj-id.friendly{color:#94c5fc;border-color:#94c5fc}.gtm-obj-id.hostile{color:#f5887c;border-color:#f5887c}',
      '.gtm-objective-row small{margin-left:auto;color:#adbcae;font-weight:700}',
      '.gtm-reports{flex:1;min-height:0;overflow:auto}',
      '.gtm-report-row{display:flex;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid #39453f}',
      '.gtm-report-marker{background:#3d3331;border:1px solid #a46d5d;color:#ffd6c9;font:700 12px Arial;padding:8px 6px;min-width:30px;text-align:center}',
      '.gtm-report-row strong{display:block;color:#e2e3d8;font:700 11px Arial;margin-bottom:5px}',
      '.gtm-report-row small{display:block;color:#9fac9f;font:10px Arial;line-height:1.5;overflow-wrap:anywhere}',
      '.gtm-report-empty{color:#b1bbae;font:12px/1.5 Arial;margin:8px 0}',
      '.gtm-air-section{background:#293028;border-bottom:1px solid #60654c}',
      '.gtm-air-section[hidden]{display:none!important}',
      '.gtm-air-section button{display:block;width:100%;padding:9px 8px;margin:8px 0;color:#efe9d7;background:#3e5142;border:1px solid #9baa82;border-radius:3px;font:700 11px Arial;cursor:pointer}',
      '.gtm-air-section button:disabled{opacity:.57;cursor:default}',
      '.gtm-air-status{font:11px/1.4 Arial;color:#efcb8b;margin:8px 0}',
      '.gtm-air-contact{font:10px/1.5 Arial;color:#efd9b1;padding:7px 0;border-top:1px solid #626455}',
      '.gtm-caption{font:700 11px Arial;color:#c4d5c5;line-height:1.4;margin:12px 0}',
      '.gtm-legend{font:11px/1.45 Arial;color:#aab9ad;margin:8px 0 0}',
      '.gtm-footer{display:flex;align-items:center;flex-wrap:wrap;gap:18px;background:#101818;padding:10px 21px;border-top:1px solid #49574e;color:#c0cbc0;font:12px Arial}',
      '.gtm-key{display:inline-block;padding:3px 7px;border:1px solid #b3bcb2;color:#e7e9df;background:#303b35;font-weight:700;margin-right:5px}',
      '@media(max-width:900px){.gtm-body{grid-template-columns:minmax(0,1fr) 205px}.gtm-toolbar{padding:9px 12px}.gtm-map-column{padding:9px}.gtm-side-section{padding:10px}.gtm-footer{gap:9px;padding:8px 12px}.gtm-shell{height:98vh}}',
      '@media(max-width:620px){.gtm-shell{width:100vw;height:100dvh;border:0}.gtm-toolbar strong{font-size:15px}.gtm-toolbar{gap:5px;flex-wrap:wrap}.gtm-toolbar small{font-size:8px}.gtm-body{display:flex;flex-direction:column;overflow:auto}.gtm-map-column{flex:none;height:min(61vw,360px);min-height:245px}.gtm-side{border-left:0;border-top:1px solid #68736a;display:grid;grid-template-columns:1fr 1fr}.gtm-side-section{border-bottom:0;min-width:0}.gtm-reports{max-height:200px}.gtm-footer{font-size:10px}.gtm-map-head{font-size:9px}}'
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
    var toolbar = document.createElement('header');
    toolbar.className = 'gtm-toolbar';
    var brand = document.createElement('div');
    brand.className = 'gtm-brand';
    var heading = document.createElement('strong');
    heading.textContent = 'TACTICAL MAP';
    brand.appendChild(heading);
    headerInfo = document.createElement('small');
    headerInfo.textContent = 'BATTLEFIELD INTELLIGENCE';
    brand.appendChild(headerInfo);
    toolbar.appendChild(brand);
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
    var bodyWrap = document.createElement('div');
    bodyWrap.className = 'gtm-body';
    var mapColumn = document.createElement('div');
    mapColumn.className = 'gtm-map-column';
    var mapHead = document.createElement('div');
    mapHead.className = 'gtm-map-head';
    var theatre = document.createElement('span');
    theatre.textContent = 'AREA OF OPERATIONS / FIELD MAP';
    mapHead.appendChild(theatre);
    operationalInfo = document.createElement('span');
    operationalInfo.textContent = '2,000 × 1,200m';
    mapHead.appendChild(operationalInfo);
    mapColumn.appendChild(mapHead);
    var surface = document.createElement('div');
    surface.className = 'gtm-map-surface';
    svg = node('svg', {
      viewBox: '0 0 1000 600',
      role: 'img',
      'aria-label':
        'Zoomable top-down battlefield; actual roads, buildings, cover and reported enemy contacts'
    });
    surface.appendChild(svg);
    mapColumn.appendChild(surface);
    var actions = document.createElement('div');
    actions.className = 'gtm-map-actions';
    function mapAction(label, handler, description) {
      var action = document.createElement('button');
      action.type = 'button';
      action.textContent = label;
      action.title = description;
      action.onclick = handler;
      actions.appendChild(action);
      return action;
    }
    mapAction(
      '−',
      function () {
        zoomTo(viewport.zoom / 1.3);
      },
      'Zoom out'
    );
    zoomText = document.createElement('span');
    zoomText.className = 'gtm-zoom-label';
    actions.appendChild(zoomText);
    mapAction(
      '+',
      function () {
        zoomTo(viewport.zoom * 1.3);
      },
      'Zoom in'
    );
    mapAction(
      'FIT',
      function () {
        resetViewport();
      },
      'Fit whole battlefield'
    );
    mapColumn.appendChild(actions);
    bodyWrap.appendChild(mapColumn);
    var sidebar = document.createElement('aside');
    sidebar.className = 'gtm-side';
    var legend = document.createElement('section');
    legend.className = 'gtm-side-section';
    var legendTitle = document.createElement('h3');
    legendTitle.textContent = 'MAP LEGEND';
    legend.appendChild(legendTitle);
    [
      ['friendly', '▣', 'Friendly formation'],
      ['hostile', '◇', 'Reported enemy position'],
      ['unknown', '↗', 'Movement between reports'],
      ['road', '', 'Actual road'],
      ['cover', '', 'Placed trees / hedgerows'],
      ['unknown', '◇', 'Capture objective']
    ].forEach(function (entry) {
      var line = document.createElement('div');
      line.className = 'gtm-legend-line';
      var swatch = document.createElement('span');
      swatch.className = 'gtm-swatch ' + entry[0];
      swatch.textContent = entry[1];
      line.appendChild(swatch);
      var text = document.createElement('span');
      text.textContent = entry[2];
      line.appendChild(text);
      legend.appendChild(line);
    });
    sidebar.appendChild(legend);
    airSection = document.createElement('section');
    airSection.className = 'gtm-side-section gtm-air-section';
    airSection.hidden = true;
    var airHeading = document.createElement('h3');
    airHeading.textContent = 'AERIAL RECONNAISSANCE';
    airSection.appendChild(airHeading);
    airStatus = document.createElement('p');
    airStatus.className = 'gtm-air-status';
    airStatus.textContent = 'One sortie per General';
    airSection.appendChild(airStatus);
    airButton = document.createElement('button');
    airButton.type = 'button';
    airButton.id = 'battleRequestAirRecon';
    airButton.textContent = 'REQUEST AIR RECON';
    airButton.onclick = requestAerialRecon;
    airSection.appendChild(airButton);
    airReportsNode = document.createElement('div');
    airReportsNode.id = 'battleAirReconReports';
    airSection.appendChild(airReportsNode);
    sidebar.appendChild(airSection);
    var objectives = document.createElement('section');
    objectives.className = 'gtm-side-section gtm-objectives';
    var objectivesTitle = document.createElement('h3');
    objectivesTitle.textContent = 'FIELD OBJECTIVES';
    objectives.appendChild(objectivesTitle);
    objectivesNode = document.createElement('div');
    objectives.appendChild(objectivesNode);
    sidebar.appendChild(objectives);
    var latest = document.createElement('section');
    latest.className = 'gtm-side-section gtm-reports';
    var latestTitle = document.createElement('h3');
    latestTitle.textContent = 'RECENT REPORTS';
    latest.appendChild(latestTitle);
    reportsNode = document.createElement('div');
    latest.appendChild(reportsNode);
    sidebar.appendChild(latest);
    var sideFoot = document.createElement('section');
    sideFoot.className = 'gtm-side-section';
    caption = document.createElement('p');
    caption.className = 'gtm-caption';
    sideFoot.appendChild(caption);
    var note = document.createElement('p');
    note.className = 'gtm-legend';
    note.textContent =
      'No enemy radar. Only reported fixes appear. Stale reports fade and expire after 60 simulation seconds. Arrows link observed fixes; they do not predict movement.';
    sideFoot.appendChild(note);
    sidebar.appendChild(sideFoot);
    bodyWrap.appendChild(sidebar);
    shell.appendChild(bodyWrap);
    var footer = document.createElement('footer');
    footer.className = 'gtm-footer';
    [
      ['M', 'Close/open'],
      ['Esc', 'Close'],
      ['DRAG', 'Pan'],
      ['SCROLL / + −', 'Zoom'],
      ['D-PAD →', 'Gamepad toggle']
    ].forEach(function (entry) {
      var item = document.createElement('span');
      var key = document.createElement('span');
      key.className = 'gtm-key';
      key.textContent = entry[0];
      item.appendChild(key);
      var name = document.createElement('span');
      name.textContent = entry[1];
      item.appendChild(name);
      footer.appendChild(item);
    });
    shell.appendChild(footer);
    panel.appendChild(shell);
    svg.addEventListener(
      'wheel',
      function (event) {
        if (event.preventDefault) event.preventDefault();
        zoomTo(viewport.zoom * (event.deltaY < 0 ? 1.13 : 1 / 1.13));
      },
      { passive: false }
    );
    svg.addEventListener('pointerdown', function (event) {
      if (event.button != null && event.button !== 0) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      if (svg.setPointerCapture) svg.setPointerCapture(event.pointerId);
      if (svg.classList && svg.classList.add) svg.classList.add('gtm-dragging');
    });
    svg.addEventListener('pointermove', function (event) {
      if (!drag || drag.id !== event.pointerId) return;
      var rect = svg.getBoundingClientRect ? svg.getBoundingClientRect() : null;
      var w = (rect && rect.width) || 1000,
        h = (rect && rect.height) || 600;
      viewport.cx -= ((event.clientX - drag.x) * 1000) / (viewport.zoom * w);
      viewport.cy -= ((event.clientY - drag.y) * 600) / (viewport.zoom * h);
      drag.x = event.clientX;
      drag.y = event.clientY;
      applyViewport();
    });
    function endDrag(event) {
      if (!drag || drag.id !== event.pointerId) return;
      drag = null;
      if (svg.classList && svg.classList.remove) svg.classList.remove('gtm-dragging');
    }
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);
    resetViewport();
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
    backdropScenario = backdropFootprints = staticLayer = dynamicLayer = null;
    install();
    resetViewport();
    if (!raf && typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(loop);
  }
  function reset() {
    resetLedgers();
    backdropScenario = backdropFootprints = staticLayer = dynamicLayer = null;
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
    panel =
      button =
      style =
      svg =
      sideSelect =
      caption =
      reportsNode =
      airSection =
      airButton =
      airStatus =
      airReportsNode =
      headerInfo =
      operationalInfo =
      zoomText =
        null;
    backdropScenario = backdropFootprints = staticLayer = dynamicLayer = drag = null;
    objectivesNode = null;
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
    isOpen: function () {
      return opened;
    },
    mapKeyDown: mapKeyDown,
    gridRef: gridRef,
    resetViewport: resetViewport,
    zoomTo: zoomTo,
    render: render,
    aerialView: aerialView,
    requestAerialRecon: requestAerialRecon,
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
