#!/usr/bin/env node
/* Generates the damage decal sprite sheets in Assets/effects/decals/.

     node tools/generate-decal-atlas.js [--cell 128] [--out Assets/effects/decals] [--seed 1944]

   Each sheet is a fixed 4 x 4 grid: one decal kind per row, four variants per row. The runtime
   (battle/modules/15-bullet-impact-fx.js, DECAL_SHEETS) addresses cells by grid position, never by
   pixel, so a sheet can be regenerated at a higher --cell size, or replaced by a hand-painted one
   of any resolution, as long as it keeps the grid. Rows:

     blood.png         0 wound     entry wound on a uniform: dark hole, wet rim, a run below it
                       1 soak      blood soaking out through cloth around a wound
                       2 pool      splash on the ground under a hit, satellite drops
                       3 spray     directional exit spray on the ground (+u is away from the shooter)
     bullet-holes.png  0 masonry   hole in plaster/stone/cement with a chipped spall crater and cracks
                       1 wood      hole in timber with splinters along the grain (grain runs along v)
                       2 dirt      round strike in soil: dark crater, thrown-up earth ring, clods
                       3 metal     bright-rimmed dent with a scorched centre

   Content stays inside the middle 88% of each cell so mipmaps never bleed between cells. No
   dependencies: the PNG is written with node's zlib. Deterministic for a given seed and cell size. */
'use strict';
const fs = require('fs'),
  path = require('path'),
  zlib = require('zlib');

function arg(name, fallback) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const CELL = Math.max(16, +arg('cell', 128) | 0),
  GRID = 4,
  OUT = path.resolve(arg('out', path.join(__dirname, '..', 'Assets', 'effects', 'decals'))),
  SEED = +arg('seed', 1944) | 0;

/* ---- deterministic noise ---------------------------------------------------------------------- */
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(x, y, s) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function smooth(t) {
  return t * t * (3 - 2 * t);
}
function valueNoise(x, y, s) {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    fx = smooth(x - xi),
    fy = smooth(y - yi);
  const a = hash2(xi, yi, s),
    b = hash2(xi + 1, yi, s),
    c = hash2(xi, yi + 1, s),
    d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
function fbm(x, y, s, octaves) {
  let sum = 0,
    amp = 0.5,
    f = 1;
  for (let i = 0; i < (octaves || 4); i++) {
    sum += amp * valueNoise(x * f, y * f, s + i * 17);
    f *= 2;
    amp *= 0.5;
  }
  return sum;
}
function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}
function sstep(e0, e1, x) {
  return smooth(clamp((x - e0) / (e1 - e0), 0, 1));
}
function mix(a, b, t) {
  return a + (b - a) * t;
}

/* ---- sheet raster ----------------------------------------------------------------------------- */
function sheet() {
  const size = CELL * GRID;
  return { size, px: new Float32Array(size * size * 4) };
}
/* Paints one cell. fn(u, v, r) returns [r, g, b, a] in 0..1 for cell-local u, v in -1..1 (the
   usable 88% of the cell); r is the variant's own random stream. Over-composited onto the cell. */
function paintCell(sh, col, row, variantSeed, fn) {
  const r = rng(variantSeed),
    setup = fn.setup ? fn.setup(r) : null,
    inset = 0.88;
  for (let y = 0; y < CELL; y++)
    for (let x = 0; x < CELL; x++) {
      const u = (((x + 0.5) / CELL) * 2 - 1) / inset,
        v = (((y + 0.5) / CELL) * 2 - 1) / inset;
      if (Math.abs(u) > 1 || Math.abs(v) > 1) continue;
      const c = fn(u, v, setup);
      if (!c || c[3] <= 0) continue;
      const i = ((row * CELL + y) * sh.size + col * CELL + x) * 4,
        a = clamp(c[3], 0, 1),
        da = sh.px[i + 3],
        oa = a + da * (1 - a);
      for (let k = 0; k < 3; k++) sh.px[i + k] = oa > 0 ? (c[k] * a + sh.px[i + k] * da * (1 - a)) / oa : 0;
      sh.px[i + 3] = oa;
    }
}
/* Edge fade so nothing ever reaches the inset border. */
function border(u, v) {
  return 1 - sstep(0.86, 1, Math.max(Math.abs(u), Math.abs(v)));
}
function writePng(file, sh) {
  const size = sh.size,
    raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4,
        o = y * (size * 4 + 1) + 1 + x * 4;
      for (let k = 0; k < 4; k++) raw[o + k] = Math.round(clamp(sh.px[i + k], 0, 1) * 255);
    }
  }
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  function crc(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function chunk(type, data) {
    const len = Buffer.alloc(4),
      body = Buffer.concat([Buffer.from(type, 'ascii'), data]),
      sum = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
  fs.writeFileSync(file, png);
}

/* ---- blood ------------------------------------------------------------------------------------ */
const BLOOD_DARK = [0.2, 0.012, 0.016],
  BLOOD = [0.42, 0.02, 0.03],
  BLOOD_WET = [0.55, 0.05, 0.05];
function blob(u, v, cx, cy, rad, s, rough) {
  const dx = u - cx,
    dy = v - cy,
    d = Math.hypot(dx, dy),
    a = Math.atan2(dy, dx);
  const edge = rad * (1 + (fbm(Math.cos(a) * 2 + s, Math.sin(a) * 2 + s, s, 3) - 0.5) * (rough || 0.8));
  return d / Math.max(1e-4, edge);
}
function droplets(r, n, spread, minR, maxR, dir) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const ang = dir == null ? r() * Math.PI * 2 : dir + (r() - 0.5) * 0.9,
      dist = spread[0] + r() * (spread[1] - spread[0]);
    out.push({
      x: Math.cos(ang) * dist,
      y: Math.sin(ang) * dist,
      r: minR + r() * (maxR - minR),
      stretch: dir == null ? 1 : 1.6 + r() * 1.8,
      ang: ang
    });
  }
  return out;
}
function dropMask(u, v, drops) {
  let m = 0;
  for (const d of drops) {
    const dx = u - d.x,
      dy = v - d.y,
      c = Math.cos(d.ang),
      s = Math.sin(d.ang),
      along = (dx * c + dy * s) / d.stretch,
      across = -dx * s + dy * c,
      q = Math.hypot(along, across) / d.r;
    m = Math.max(m, 1 - sstep(0.75, 1, q));
  }
  return m;
}
const bloodCells = {
  wound: Object.assign(
    function (u, v, st) {
      const core = blob(u, v, 0, 0, 0.16, st.s, 0.5),
        rim = blob(u, v, 0, 0.02, 0.42, st.s + 3, 1.1),
        run = Math.abs(u - st.runX * v * 0.2) < 0.07 * (1 - sstep(0.1, st.runLen, v)) && v > 0 && v < st.runLen;
      const n = fbm(u * 6, v * 6, st.s, 3);
      let a = Math.max(1 - sstep(0.85, 1, rim), run ? 0.9 : 0) * (0.75 + 0.25 * n);
      let col = BLOOD.map((c, k) => mix(c, BLOOD_WET[k], n * 0.6));
      if (core < 1) {
        a = 1;
        col = BLOOD_DARK.map(c => c * 0.4);
      }
      return [col[0], col[1], col[2], a * border(u, v)];
    },
    { setup: r => ({ s: (r() * 1000) | 0, runX: r() - 0.5, runLen: 0.45 + r() * 0.45 }) }
  ),
  soak: Object.assign(
    function (u, v, st) {
      const d = blob(u, v, st.cx, st.cy, 0.62, st.s, 1.3),
        n = fbm(u * 4 + st.s, v * 4, st.s, 5);
      const a = (1 - sstep(0.7, 1.05, d)) * (0.55 + 0.45 * n);
      const dark = sstep(0.2, 0.9, 1 - d);
      const col = BLOOD.map((c, k) => mix(c, BLOOD_DARK[k], dark));
      return [col[0], col[1], col[2], a * 0.92 * border(u, v)];
    },
    { setup: r => ({ s: (r() * 1000) | 0, cx: (r() - 0.5) * 0.15, cy: (r() - 0.5) * 0.15 }) }
  ),
  pool: Object.assign(
    function (u, v, st) {
      const d = blob(u, v, 0, 0, 0.5, st.s, 1.2),
        n = fbm(u * 5, v * 5, st.s + 9, 4);
      let a = Math.max(1 - sstep(0.85, 1, d), dropMask(u, v, st.drops));
      const col = BLOOD.map((c, k) => mix(BLOOD_DARK[k], c, 0.4 + 0.6 * n));
      return [col[0], col[1], col[2], a * (0.8 + 0.2 * n) * border(u, v)];
    },
    { setup: r => ({ s: (r() * 1000) | 0, drops: droplets(r, 14, [0.5, 0.95], 0.02, 0.07) }) }
  ),
  spray: Object.assign(
    function (u, v, st) {
      /* A fan from the left edge (u = -1) toward +u, elongated drops along their travel. */
      const d = blob(u, v, -0.72, 0, 0.2, st.s, 0.9),
        fan = dropMask(u, v, st.drops),
        n = fbm(u * 7, v * 7, st.s, 3);
      const a = Math.max(1 - sstep(0.8, 1, d), fan);
      const col = BLOOD.map((c, k) => mix(BLOOD_DARK[k], c, 0.5 + 0.5 * n));
      return [col[0], col[1], col[2], a * 0.9 * border(u, v)];
    },
    {
      setup: r => {
        const drops = droplets(r, 34, [0.15, 1.55], 0.015, 0.055, 0).map(d => ({
          ...d,
          x: d.x - 0.72
        }));
        return { s: (r() * 1000) | 0, drops };
      }
    }
  )
};

/* ---- bullet holes ----------------------------------------------------------------------------- */
function crater(u, v, st, rad) {
  return blob(u, v, 0, 0, rad, st.s, 0.9);
}
const holeCells = {
  masonry: Object.assign(
    function (u, v, st) {
      const hole = crater(u, v, st, 0.12),
        spall = blob(u, v, 0, 0, 0.46, st.s + 5, 1.4),
        a0 = Math.atan2(v, u),
        d = Math.hypot(u, v),
        n = fbm(u * 8, v * 8, st.s, 4);
      let crack = 0;
      for (const c of st.cracks) {
        const da = Math.abs(Math.atan2(Math.sin(a0 - c.a), Math.cos(a0 - c.a)));
        const wob = (fbm(d * 6, c.a * 3, st.s, 2) - 0.5) * 0.12;
        if (d > 0.25 && d < c.len) crack = Math.max(crack, 1 - sstep(0.004, 0.02, Math.abs(da + wob) * d));
      }
      if (hole < 1) return [0.05, 0.045, 0.04, border(u, v)];
      if (spall < 1) {
        /* Freshly chipped: lighter than the wall, darker toward the hole. */
        const t = sstep(0.2, 1, spall),
          g = mix(0.3, 0.8, t) * (0.85 + 0.2 * n);
        return [g, g * 0.97, g * 0.92, (1 - sstep(0.88, 1, spall)) * border(u, v)];
      }
      return crack > 0 ? [0.12, 0.11, 0.1, crack * 0.8 * border(u, v)] : null;
    },
    {
      setup: r => {
        const cracks = [];
        for (let i = 0, n = 3 + ((r() * 3) | 0); i < n; i++) cracks.push({ a: r() * Math.PI * 2, len: 0.5 + r() * 0.45 });
        return { s: (r() * 1000) | 0, cracks };
      }
    }
  ),
  wood: Object.assign(
    function (u, v, st) {
      const hole = blob(u, v, 0, 0, 0.11, st.s, 0.6),
        n = fbm(u * 18, v * 2.5, st.s, 3),
        splinter = blob(u * 2.6, v * 0.55, 0, st.shift, 0.4, st.s + 2, 1.6);
      if (hole < 1) return [0.04, 0.03, 0.02, border(u, v)];
      if (splinter < 1) {
        /* Torn fibres: pale fresh wood streaked along the grain. */
        const t = sstep(0, 1, splinter),
          c = 0.55 + 0.3 * n;
        return [c * 0.95, c * 0.78, c * 0.52, (1 - t * t) * 0.95 * border(u, v)];
      }
      return null;
    },
    { setup: r => ({ s: (r() * 1000) | 0, shift: (r() - 0.5) * 0.3 }) }
  ),
  dirt: Object.assign(
    function (u, v, st) {
      const hole = crater(u, v, st, 0.2),
        ring = blob(u, v, 0, 0, 0.5, st.s + 4, 1.3),
        n = fbm(u * 7, v * 7, st.s, 4),
        clods = dropMask(u, v, st.clods);
      if (hole < 1) {
        const t = hole;
        return [mix(0.07, 0.16, t), mix(0.05, 0.11, t), mix(0.03, 0.07, t), border(u, v)];
      }
      if (ring < 1) {
        const c = 0.28 + 0.14 * n;
        return [c, c * 0.74, c * 0.48, (1 - sstep(0.7, 1, ring)) * 0.9 * border(u, v)];
      }
      return clods > 0 ? [0.24, 0.17, 0.1, clods * 0.9 * border(u, v)] : null;
    },
    { setup: r => ({ s: (r() * 1000) | 0, clods: droplets(r, 12, [0.5, 0.95], 0.025, 0.06) }) }
  ),
  metal: Object.assign(
    function (u, v, st) {
      const d = Math.hypot(u, v) / (0.2 + st.size),
        n = fbm(u * 10, v * 10, st.s, 3);
      if (d < 0.55) return [0.06, 0.06, 0.07, border(u, v)];
      if (d < 1) {
        /* Bright bare-metal ring where the paint was knocked off. */
        const t = sstep(0.55, 1, d),
          g = mix(0.85, 0.5, t) * (0.9 + 0.15 * n);
        return [g, g * 0.97, g * 0.92, border(u, v)];
      }
      if (d < 2.2) return [0.08, 0.07, 0.06, (1 - sstep(1, 2.2, d)) * 0.55 * n * border(u, v)];
      return null;
    },
    { setup: r => ({ s: (r() * 1000) | 0, size: r() * 0.08 }) }
  )
};

function build(name, rows) {
  const sh = sheet();
  rows.forEach((fn, row) => {
    for (let col = 0; col < GRID; col++) paintCell(sh, col, row, SEED * 131 + row * 17 + col * 7919 + name.length, fn);
  });
  const file = path.join(OUT, name);
  writePng(file, sh);
  return file;
}

fs.mkdirSync(OUT, { recursive: true });
const made = [
  build('blood.png', [bloodCells.wound, bloodCells.soak, bloodCells.pool, bloodCells.spray]),
  build('bullet-holes.png', [holeCells.masonry, holeCells.wood, holeCells.dirt, holeCells.metal])
];
made.forEach(f => console.log('wrote ' + path.relative(process.cwd(), f) + ' (' + CELL * GRID + ' px, ' + GRID + 'x' + GRID + ' grid)'));
