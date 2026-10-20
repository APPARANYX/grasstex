/* Battle Sim / ww2fps AI lab v20 seeded scenario generator.
   Data-only on purpose: generation can later move into ww2fps unchanged while renderers, units
   and trainers consume the same descriptor. Battlefield scale matches ww2fps: 100x60 map units
   at 20 metres per unit = 2000m x 1200m. */
(function (root) {
  'use strict';

  var MAP_W = root.PHASE_C_COMBAT_LAB ? 280 : 2000,
    MAP_D = root.PHASE_C_COMBAT_LAB ? 240 : 1200;
  var FEATURE_KEYS = [
    'buildingDensity',
    'objectiveCount',
    'settlementAspect',
    'meanBuildingArea',
    'openFraction',
    'objectiveSpacing',
    'laneSpread',
    'urbanComplexity',
    'doorDensity',
    'windowDensity',
    'roadComplexity',
    'terrainRoughness'
  ];
  var active = null;

  function hashSeed(s) {
    s = String(s == null ? 'default' : s);
    var h = 1779033703 ^ s.length;
    for (var i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rngFor(seed, salt) {
    return mulberry32(hashSeed(String(seed) + '|' + String(salt || '')));
  }
  function rr(r, a, b) {
    return a + r() * (b - a);
  }
  var clamp = root.GTMath.clamp;
  function round(v, n) {
    var p = Math.pow(10, n || 0);
    return Math.round(v * p) / p;
  }
  var dist = root.GTMath.distStrict;
  function overlaps(a, b, pad) {
    pad = pad || 0;
    return Math.abs(a.x - b.x) < (a.w + b.w) / 2 + pad && Math.abs(a.z - b.z) < (a.d + b.d) / 2 + pad;
  }

  function openingsFor(building, r) {
    var sides = ['north', 'south', 'east', 'west'],
      openings = [],
      windows = [];
    var doorSide = sides[Math.floor(r() * sides.length)],
      doorOffset = 0;
    var doorLength = doorSide === 'north' || doorSide === 'south' ? building.w : building.d;
    doorOffset = rr(r, -doorLength * 0.18, doorLength * 0.18);
    openings.push({
      id: building.id + '-door-0',
      type: 'door',
      side: doorSide,
      offset: round(doorOffset, 2),
      width: 1.35,
      bottom: 0,
      top: 2.2
    });
    for (var si = 0; si < sides.length; si++) {
      var side = sides[si],
        len = side === 'north' || side === 'south' ? building.w : building.d;
      var bays = Math.max(1, Math.floor((len - 2.2) / 4.0));
      for (var i = 0; i < bays; i++) {
        var off = -len / 2 + ((i + 1) * len) / (bays + 1);
        if (side === doorSide && Math.abs(off - doorOffset) < 1.7) continue;
        if (r() < 0.18) continue;
        var win = {
          id: building.id + '-win-' + side + '-' + i,
          type: 'window',
          side: side,
          offset: round(off, 2),
          width: 1.25,
          bottom: 0.92,
          top: 2.08
        };
        openings.push(win);
        windows.push(win);
      }
    }
    /* A second door on larger structures prevents one-entry dead ends and makes indoor routing
       useful rather than decorative. */
    if (building.w * building.d > 185 && r() > 0.28) {
      var opposite = { north: 'south', south: 'north', east: 'west', west: 'east' }[doorSide],
        len2 = opposite === 'north' || opposite === 'south' ? building.w : building.d;
      openings.push({
        id: building.id + '-door-1',
        type: 'door',
        side: opposite,
        offset: round(rr(r, -len2 * 0.15, len2 * 0.15), 2),
        width: 1.35,
        bottom: 0,
        top: 2.2
      });
    }
    building.openings = openings;
    building.windowCount = windows.length;
    building.doorCount = openings.filter(function (o) {
      return o.type === 'door';
    }).length;
  }

  function makeBuilding(id, x, z, w, d, r) {
    var b = {
      id: id,
      x: round(x, 2),
      z: round(z, 2),
      w: round(w, 2),
      d: round(d, 2),
      h: 3.15,
      rot: r() > 0.5 ? 0 : Math.PI / 2,
      openings: []
    };
    openingsFor(b, r);
    return b;
  }

  function generateBuildings(r, cx, cz, spanX, spanZ, count) {
    var out = [],
      attempts = 0;
    while (out.length < count && attempts < count * 55) {
      attempts++;
      var avenue = r() < 0.55,
        side = r() < 0.5 ? -1 : 1;
      var x, z;
      if (avenue) {
        x = cx + side * rr(r, 22, spanX * 0.44);
        z = cz + rr(r, -spanZ * 0.43, spanZ * 0.43);
      } else {
        x = cx + rr(r, -spanX * 0.43, spanX * 0.43);
        z = cz + side * rr(r, 20, spanZ * 0.43);
      }
      x += rr(r, -15, 15);
      z += rr(r, -15, 15);
      var w = rr(r, 11, 22),
        d = rr(r, 9, 18),
        candidate = { x: x, z: z, w: w, d: d };
      var ok = true;
      for (var i = 0; i < out.length; i++)
        if (overlaps(candidate, out[i], 7)) {
          ok = false;
          break;
        }
      if (!ok) continue;
      out.push(makeBuilding('B' + (out.length + 1), x, z, w, d, r));
    }
    return out;
  }

  function generateObjectives(r, cx, cz, spanX, spanZ, count) {
    var out = [];
    /* Always include a central tactical objective, then distribute the rest through the settlement. */
    out.push({
      id: 'obj-center',
      type: 'capture-zone',
      x: round(cx, 1),
      z: round(cz, 1),
      radius: 34,
      label: 'Central strongpoint',
      value: 1.35
    });
    for (var i = 1; i < count; i++) {
      var angle = ((i - 1) / Math.max(1, count - 1)) * Math.PI * 2 + rr(r, -0.32, 0.32),
        rad = rr(r, 0.22, 0.44);
      out.push({
        id: 'obj-' + (i + 1),
        type: 'capture-zone',
        x: round(cx + Math.cos(angle) * spanX * rad, 1),
        z: round(cz + Math.sin(angle) * spanZ * rad, 1),
        radius: rr(r, 28, 40),
        label: 'Objective ' + (i + 1),
        value: round(rr(r, 0.85, 1.45), 2)
      });
    }
    return out;
  }

  function averageSpacing(points) {
    if (points.length < 2) return 0;
    var sum = 0,
      n = 0;
    for (var i = 0; i < points.length; i++)
      for (var j = i + 1; j < points.length; j++) {
        sum += dist(points[i], points[j]);
        n++;
      }
    return sum / n;
  }
  function fingerprint(s) {
    var settleArea = s.settlement.spanX * s.settlement.spanZ,
      foot = 0,
      doors = 0,
      windows = 0,
      meanArea = 0;
    s.buildings.forEach(function (b) {
      var a = b.w * b.d;
      foot += a;
      meanArea += a;
      doors += b.doorCount || 0;
      windows += b.windowCount || 0;
    });
    meanArea /= Math.max(1, s.buildings.length);
    var f = {
      buildingDensity: clamp(s.buildings.length / 28, 0, 1),
      objectiveCount: clamp(s.objectives.length / 7, 0, 1),
      settlementAspect: clamp(
        Math.min(s.settlement.spanX, s.settlement.spanZ) / Math.max(s.settlement.spanX, s.settlement.spanZ),
        0,
        1
      ),
      meanBuildingArea: clamp(meanArea / 360, 0, 1),
      openFraction: clamp(1 - foot / Math.max(1, settleArea), 0, 1),
      objectiveSpacing: clamp(averageSpacing(s.objectives) / 500, 0, 1),
      laneSpread: clamp(
        (s.spawnZones.us.lanes[s.spawnZones.us.lanes.length - 1] - s.spawnZones.us.lanes[0]) / MAP_W,
        0,
        1
      ),
      urbanComplexity: clamp((s.buildings.length + s.objectives.length * 2) / 42, 0, 1),
      doorDensity: clamp(doors / Math.max(1, s.buildings.length * 2), 0, 1),
      windowDensity: clamp(windows / Math.max(1, s.buildings.length * 14), 0, 1),
      roadComplexity: clamp(s.roads.length / 6, 0, 1),
      terrainRoughness: clamp(s.terrain.roughness, 0, 1)
    };
    var vector = FEATURE_KEYS.map(function (k) {
      return round(f[k], 4);
    });
    return { version: 1, keys: FEATURE_KEYS.slice(), vector: vector, features: f };
  }
  function similarity(a, b) {
    var av = (a && a.vector) || a,
      bv = (b && b.vector) || b;
    if (!av || !bv) return 0;
    var n = Math.min(av.length, bv.length),
      sum = 0,
      weight = 0;
    for (var i = 0; i < n; i++) {
      var w = i === 0 || i === 4 || i === 5 || i === 7 ? 1.35 : 1,
        d = (+av[i] || 0) - (+bv[i] || 0);
      sum += w * d * d;
      weight += w;
    }
    return clamp(1 - Math.sqrt(sum / Math.max(0.0001, weight)), 0, 1);
  }

  /* Separate deterministic 5 km profile. The legacy generator and RNG draw sequence stay intact. */
  function pointSegmentDistance(x, z, road) {
    var dx = road.bx - road.ax,
      dz = road.bz - road.az,
      d2 = dx * dx + dz * dz || 1,
      t = clamp(((x - road.ax) * dx + (z - road.az) * dz) / d2, 0, 1);
    return Math.hypot(x - road.ax - t * dx, z - road.az - t * dz);
  }
  function createStrategic(seed, opts) {
    var r = rngFor(seed, 'strategic-5km-v1'),
      jitter = function (n) {
        return round(rr(r, -n, n), 1);
      },
      points = [
        [-1710, -2060],
        [1600, -1950],
        [-100, -1530],
        [-1640, 2040],
        [1690, 1980],
        [190, 1540],
        [-1650, -620],
        [1510, -570],
        [-130, -410],
        [-1590, 650],
        [1560, 720],
        [210, 510]
      ],
      names = [
        'US western base',
        'US eastern base',
        'US inland base',
        'German western base',
        'German eastern base',
        'German inland base',
        'Western approach',
        'Eastern approach',
        'Southern crossroads',
        'Northern ford',
        'Eastern junction',
        'Northern crossroads'
      ],
      objectives = points.map(function (p, i) {
        return {
          id: 'strategic-obj-' + i,
          type: 'capture-zone',
          x: p[0] + jitter(42),
          z: p[1] + jitter(42),
          radius: i < 6 ? 66 : 55,
          label: names[i],
          value: i < 6 ? 1.1 : round(rr(r, 1.1, 1.5), 2),
          baseFaction: i < 3 ? 'us' : i < 6 ? 'ge' : null
        };
      });
    var links = [
      [0, 6],
      [1, 7],
      [2, 8],
      [3, 9],
      [4, 10],
      [5, 11],
      [6, 8],
      [8, 7],
      [9, 11],
      [11, 10],
      [6, 9],
      [8, 11],
      [7, 10],
      [6, 11],
      [7, 11],
      [8, 9],
      [8, 10],
      [0, 8],
      [1, 8],
      [3, 11],
      [4, 11]
    ];
    var roads = links.map(function (pair, i) {
      var a = objectives[pair[0]],
        b = objectives[pair[1]];
      return {
        id: 'strategic-road-' + i,
        fromObjectiveId: a.id,
        toObjectiveId: b.id,
        ax: a.x,
        az: a.z,
        bx: b.x,
        bz: b.z,
        width: i < 13 ? 11 : 8
      };
    });
    var buildings = [],
      settlements = [];
    /* Small hamlets flank approach junctions; neither roads nor spawn/capture hubs are blocked. */
    for (var c = 6; c < 12; c++) {
      var hub = objectives[c],
        placed = 0,
        tries = 0;
      settlements.push({ id: 'hamlet-' + c, x: hub.x, z: hub.z, objectiveId: hub.id });
      while (placed < 4 && tries++ < 140) {
        var angle = rr(r, 0, Math.PI * 2),
          distance = rr(r, 100, 175),
          x = round(hub.x + Math.cos(angle) * distance, 2),
          z = round(hub.z + Math.sin(angle) * distance, 2),
          w = rr(r, 11, 21),
          d = rr(r, 9, 18),
          candidate = { x: x, z: z, w: w, d: d },
          radius = Math.hypot(w, d) / 2 + 6;
        if (Math.abs(x) > 2400 || Math.abs(z) > 2400) continue;
        if (
          objectives.some(function (o) {
            return Math.hypot(o.x - x, o.z - z) < o.radius + radius;
          })
        )
          continue;
        if (
          roads.some(function (road) {
            return pointSegmentDistance(x, z, road) < road.width / 2 + radius;
          })
        )
          continue;
        if (
          buildings.some(function (b) {
            return overlaps(candidate, b, 12);
          })
        )
          continue;
        buildings.push(makeBuilding('SB' + (buildings.length + 1), x, z, w, d, r));
        placed++;
      }
    }
    var bases = { us: [], ge: [] };
    ['us', 'ge'].forEach(function (faction, fi) {
      for (var b = 0; b < 3; b++) {
        var o = objectives[fi * 3 + b];
        bases[faction].push({ id: faction + '-base-' + b, objectiveId: o.id, x: o.x, z: o.z });
      }
    });
    var scenario = {
      version: 21,
      profile: 'strategic',
      seed: seed,
      id: 'strategic-' + hashSeed(seed).toString(16),
      map: { width: 5000, depth: 5000, unitM: 20, source: 'strategic-5km' },
      terrain: { roughness: round(rr(r, 0.22, 0.52), 3) },
      settlement: { cx: 0, cz: 0, spanX: 4500, spanZ: 4500 },
      settlements: settlements,
      spawnZones: {
        us: {
          z: bases.us[2].z,
          lanes: bases.us.map(function (b) {
            return b.x;
          }),
          bases: bases.us
        },
        ge: {
          z: bases.ge[2].z,
          lanes: bases.ge.map(function (b) {
            return b.x;
          }),
          bases: bases.ge
        }
      },
      roads: roads,
      buildings: buildings,
      objectives: objectives,
      center: { x: 0, z: 0 },
      radius: 2400,
      timeLimitSeconds: 1800,
      metadata: {
        trainingSeed: opts.trainingSeed || null,
        scenarioIndex: opts.scenarioIndex == null ? null : opts.scenarioIndex,
        strategicProfile: true
      }
    };
    scenario.sectors = scenario.objectives;
    scenario.fingerprint = fingerprint(scenario);
    return scenario;
  }

  /* Front-lines variant of the 5 km profile (?frontLines=1): Hell Let Loose style lines from base
     to base. Line 0 is the US base line, line 4 the German one; lines 1-3 hold one capture point
     each, sited on one of three seeded spots and flavoured town, forest or open. Every point is
     reached by a main road from the line behind it and a side road, so the ground between a
     held line and the contested one has two approaches. Same objective/road/spawnZones shape as
     createStrategic, plus `frontLines` (lines in order, start owners, fallbacks); its own RNG
     salt, so the default layout's draws are untouched. */
  var FRONT_LINE_Z = [-900, 0, 900],
    FRONT_LINE_SITES = [-1500, 0, 1500],
    FRONT_LINE_NAMES = ['US forward line', 'Centre line', 'German forward line'];
  function createFrontLines(seed, opts) {
    var r = rngFor(seed, 'strategic-front-lines-v1'),
      jitter = function (n) {
        return round(rr(r, -n, n), 1);
      },
      basePoints = [
        [-1710, -2060],
        [1600, -1950],
        [-100, -1530],
        [-1640, 2040],
        [1690, 1980],
        [190, 1540]
      ],
      baseNames = [
        'US western base',
        'US eastern base',
        'US inland base',
        'German western base',
        'German eastern base',
        'German inland base'
      ],
      objectives = basePoints.map(function (p, i) {
        return {
          id: 'strategic-obj-' + i,
          type: 'capture-zone',
          x: p[0] + jitter(42),
          z: p[1] + jitter(42),
          radius: 66,
          label: baseNames[i],
          value: 1.1,
          baseFaction: i < 3 ? 'us' : 'ge',
          frontLine: i < 3 ? 0 : 4
        };
      }),
      previousFlavor = null,
      lines = [];
    FRONT_LINE_Z.forEach(function (z, li) {
      var site = Math.floor(r() * FRONT_LINE_SITES.length),
        weights = { town: 0.45, forest: 0.3, open: 0.25 },
        keys = Object.keys(weights),
        total = 0;
      keys.forEach(function (k) {
        if (k === previousFlavor) weights[k] *= 0.3;
        total += weights[k];
      });
      var pick = r() * total,
        flavor = keys[keys.length - 1];
      for (var k = 0; k < keys.length; k++) {
        if (pick < weights[keys[k]]) {
          flavor = keys[k];
          break;
        }
        pick -= weights[keys[k]];
      }
      previousFlavor = flavor;
      var o = {
        id: 'strategic-obj-' + (6 + li),
        type: 'capture-zone',
        x: FRONT_LINE_SITES[site] + jitter(120),
        z: z + jitter(60),
        radius: 55,
        label: FRONT_LINE_NAMES[li] + ' (' + flavor + ')',
        value: round(rr(r, 1.1, 1.5), 2),
        baseFaction: null,
        frontLine: li + 1,
        flavor: flavor,
        siteIndex: site
      };
      objectives.push(o);
      lines.push(o);
    });
    var links = [
      // Main roads: each base to its forward line, then line to line.
      [0, 6, 'main'],
      [1, 6, 'main'],
      [2, 6, 'main'],
      [3, 8, 'main'],
      [4, 8, 'main'],
      [5, 8, 'main'],
      [6, 7, 'main'],
      [7, 8, 'main'],
      // Side roads: a second approach into every capture point.
      [2, 7, 'side'],
      [5, 7, 'side'],
      [6, 8, 'side']
    ];
    var roads = links.map(function (pair, i) {
      var a = objectives[pair[0]],
        b = objectives[pair[1]];
      return {
        id: 'strategic-road-' + i,
        fromObjectiveId: a.id,
        toObjectiveId: b.id,
        ax: a.x,
        az: a.z,
        bx: b.x,
        bz: b.z,
        width: pair[2] === 'main' ? 11 : 8,
        frontLineRoad: pair[2]
      };
    });
    var buildings = [],
      settlements = [];
    lines.forEach(function (hub) {
      if (hub.flavor !== 'town') return;
      var placed = 0,
        tries = 0;
      settlements.push({ id: 'town-' + hub.id, x: hub.x, z: hub.z, objectiveId: hub.id });
      while (placed < 8 && tries++ < 240) {
        var angle = rr(r, 0, Math.PI * 2),
          distance = rr(r, 85, 190),
          x = round(hub.x + Math.cos(angle) * distance, 2),
          z = round(hub.z + Math.sin(angle) * distance, 2),
          w = rr(r, 11, 21),
          d = rr(r, 9, 18),
          candidate = { x: x, z: z, w: w, d: d },
          radius = Math.hypot(w, d) / 2 + 6;
        if (Math.abs(x) > 2400 || Math.abs(z) > 2400) continue;
        if (
          objectives.some(function (o) {
            return Math.hypot(o.x - x, o.z - z) < o.radius + radius;
          })
        )
          continue;
        if (
          roads.some(function (road) {
            return pointSegmentDistance(x, z, road) < road.width / 2 + radius;
          })
        )
          continue;
        if (
          buildings.some(function (b) {
            return overlaps(candidate, b, 12);
          })
        )
          continue;
        buildings.push(makeBuilding('SB' + (buildings.length + 1), x, z, w, d, r));
        placed++;
      }
    });
    var bases = { us: [], ge: [] };
    ['us', 'ge'].forEach(function (faction, fi) {
      for (var b = 0; b < 3; b++) {
        var o = objectives[fi * 3 + b];
        bases[faction].push({ id: faction + '-base-' + b, objectiveId: o.id, x: o.x, z: o.z });
      }
    });
    function ids(index) {
      return objectives
        .filter(function (o) {
          return o.frontLine === index;
        })
        .map(function (o) {
          return o.id;
        });
    }
    var scenario = {
      version: 21,
      profile: 'strategic',
      seed: seed,
      id: 'strategic-lines-' + hashSeed(seed).toString(16),
      map: { width: 5000, depth: 5000, unitM: 20, source: 'strategic-5km-front-lines' },
      terrain: { roughness: round(rr(r, 0.22, 0.52), 3) },
      settlement: { cx: 0, cz: 0, spanX: 4500, spanZ: 4500 },
      settlements: settlements,
      spawnZones: {
        us: {
          z: bases.us[2].z,
          lanes: bases.us.map(function (b) {
            return b.x;
          }),
          bases: bases.us
        },
        ge: {
          z: bases.ge[2].z,
          lanes: bases.ge.map(function (b) {
            return b.x;
          }),
          bases: bases.ge
        }
      },
      roads: roads,
      buildings: buildings,
      objectives: objectives,
      center: { x: 0, z: 0 },
      radius: 2400,
      timeLimitSeconds: 1800,
      /* Lines in order from the US rear (0) to the German rear (4). Start owners per battle type:
         a meeting engagement leaves the centre neutral; a prepared defender also holds it. */
      frontLines: {
        version: 1,
        lines: [0, 1, 2, 3, 4].map(function (i) {
          return { index: i, objectiveIds: ids(i) };
        }),
        startOwners: {
          meeting: ['us', 'us', null, 'ge', 'ge'],
          us: ['us', 'us', 'us', 'ge', 'ge'],
          ge: ['us', 'us', 'ge', 'ge', 'ge']
        }
      },
      metadata: {
        trainingSeed: opts.trainingSeed || null,
        scenarioIndex: opts.scenarioIndex == null ? null : opts.scenarioIndex,
        strategicProfile: true,
        frontLines: true
      }
    };
    scenario.sectors = scenario.objectives;
    scenario.fingerprint = fingerprint(scenario);
    return scenario;
  }

  /* Match battle-sim's early geometry gate regardless of module load order.
     Both 5 km and front-line objectives ship on; explicit =0 restores the
     previous scenario for A/B tests. Combat Lab always wins isolation. */
  root.STRATEGIC_INTERCEPTION_ENABLED =
    !root.PHASE_C_COMBAT_LAB &&
    root.STRATEGIC_INTERCEPTION_ENABLED !== false &&
    root.BattleStrategicConfig.flag('strategicInterception');
  root.STRATEGIC_FRONT_LINES =
    !root.PHASE_C_COMBAT_LAB &&
    root.STRATEGIC_FRONT_LINES !== false &&
    root.BattleStrategicConfig.flag('frontLines');

  function create(seed, opts) {
    opts = opts || {};
    seed = String(seed == null ? 'default' : seed);
    if (!root.PHASE_C_COMBAT_LAB && (opts.profile === 'strategic' || root.STRATEGIC_INTERCEPTION_ENABLED))
      return opts.frontLines || root.STRATEGIC_FRONT_LINES
        ? createFrontLines(seed, opts)
        : createStrategic(seed, opts);
    var r = rngFor(seed, 'scenario');
    var lab = !!root.PHASE_C_COMBAT_LAB,
      spanX = lab ? 205 : rr(r, 430, 720),
      spanZ = lab ? 166 : rr(r, 300, 500),
      cx = lab ? 0 : rr(r, -180, 180),
      cz = lab ? 0 : rr(r, -85, 85);
    var buildingCount = lab ? 6 : Math.round(rr(r, 12, 28)),
      objectiveCount = lab ? 1 : Math.round(rr(r, 3, 6));
    var lanes = lab ? [-25, 25] : [-700, -350, 0, 350, 700],
      spawnZ = MAP_D / 2 - (lab ? 30 : 90);
    var scenario = {
      version: 20,
      seed: seed,
      id: 'scn-' + hashSeed(seed).toString(16),
      map: { width: MAP_W, depth: MAP_D, unitM: 20, source: 'ww2fps MAPW/MAPH' },
      terrain: { roughness: round(rr(r, 0.18, 0.78), 3) },
      settlement: { cx: round(cx, 1), cz: round(cz, 1), spanX: round(spanX, 1), spanZ: round(spanZ, 1) },
      spawnZones: {
        us: { z: -spawnZ, lanes: lanes.slice() },
        ge: { z: spawnZ, lanes: lab ? [0] : lanes.slice() }
      },
      roads: [
        { id: 'road-ns', ax: cx, az: cz - spanZ * 0.58, bx: cx, bz: cz + spanZ * 0.58, width: 10 },
        { id: 'road-ew', ax: cx - spanX * 0.58, az: cz, bx: cx + spanX * 0.58, bz: cz, width: 10 }
      ],
      buildings: [],
      objectives: [],
      metadata: {
        trainingSeed: opts.trainingSeed || null,
        scenarioIndex: opts.scenarioIndex == null ? null : opts.scenarioIndex
      }
    };
    if (r() > 0.38)
      scenario.roads.push({
        id: 'road-diag',
        ax: cx - spanX * 0.46,
        az: cz - spanZ * 0.38,
        bx: cx + spanX * 0.46,
        bz: cz + spanZ * 0.38,
        width: 7
      });
    scenario.buildings = generateBuildings(r, cx, cz, spanX, spanZ, buildingCount);
    scenario.objectives = generateObjectives(r, cx, cz, spanX, spanZ, objectiveCount);
    scenario.sectors = scenario.objectives;
    scenario.center = { x: cx, z: cz };
    scenario.radius = Math.max(spanX, spanZ) * 0.62;
    scenario.fingerprint = fingerprint(scenario);
    return scenario;
  }
  function activate(seed, opts) {
    active = create(seed, opts);
    root.BATTLE_SCENARIO = active;
    return active;
  }
  function setActive(s) {
    active = s || null;
    root.BATTLE_SCENARIO = active;
    return active;
  }
  function current() {
    return active || root.BATTLE_SCENARIO || null;
  }
  function newSeed(prefix) {
    return (
      String(prefix || 'train') +
      '-' +
      Date.now().toString(36) +
      '-' +
      Math.floor(Math.random() * 0xffffff).toString(36)
    );
  }

  /* Old builds copied automatically generated live-* seeds into the address bar.
     Loading that legacy URL must not silently pin every subsequent refresh.
     Explicit named seeds, and live-* seeds with ?pinSeed=1, still replay exactly. */
  function initialLoadSeed(search, serverSeed, generateSeed) {
    var params = new URLSearchParams(search || ''),
      urlSeed = params.get('seed') || '',
      supplied = urlSeed || String(serverSeed || ''),
      autoUrlSeed = /^live-[a-z0-9]+-[a-z0-9]+$/i.test(urlSeed) && params.get('pinSeed') !== '1',
      requested = autoUrlSeed ? '' : supplied;
    return {
      seed: requested || (generateSeed || newSeed)('live'),
      requested: requested,
      removeAutoSeed: autoUrlSeed
    };
  }

  root.BattleScenarioGenerator = {
    MAP_W: MAP_W,
    MAP_D: MAP_D,
    FEATURE_KEYS: FEATURE_KEYS.slice(),
    hashSeed: hashSeed,
    rngFor: rngFor,
    create: create,
    createStrategic: createStrategic,
    createFrontLines: createFrontLines,
    activate: activate,
    setActive: setActive,
    current: current,
    newSeed: newSeed,
    initialLoadSeed: initialLoadSeed,
    fingerprint: fingerprint,
    similarity: similarity
  };
  root.GTLog('[SCENARIO] generator v20 loaded; battlefield=' + MAP_W + 'x' + MAP_D + 'm');
})(typeof window !== 'undefined' ? window : globalThis);
