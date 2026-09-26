/* How often rounds go through a body, and how often the round that exits strikes a second man.
   Headless (the ai-sim harness with the shipping ballistics module), no browser, seconds to run.

     node scripts/probe_penetration_rates.cjs        # PEN_SEEDS (default 20), PEN_SECONDS (default 120)

   Runs PEN_SEEDS 10v10 fights 90 m apart and counts, over every round that struck a body:
   through (exited the first man), second (also struck another), final (the spent round went on to
   hit the environment or ran out of range). The harness packs squads ~2.5 m apart, far tighter than
   in-game formations, so `second` is an upper bound. Used to tune DEFLECT in
   battle/modules/14-z-ballistic-raycast.js (0.06 rad: 22% second; 0.12: 14%). */
'use strict';
const fs = require('fs'),
  path = require('path'),
  H = require('../tools/ai-sim-harness/harness.js');
const seeds = +(process.env.PEN_SEEDS || 20),
  seconds = +(process.env.PEN_SECONDS || 120);
const log = console.log;
console.log = (...a) => (typeof a[0] === 'string' && a[0][0] === '[' ? undefined : log(...a));
const src = fs.readFileSync(path.join(H.REPO, 'battle/modules/14-z-ballistic-raycast.js'), 'utf8');
const n = { hits: 0, through: 0, second: 0, final: 0, byZone: {} };
for (let seed = 1; seed <= seeds; seed++) {
  H.resetIds();
  const r = H.bootstrap();
  r.BattleModules.unitsFor = b => b._roster.us.concat(b._roster.ge);
  new Function('window', 'globalThis', 'console', src)(r, r, { log() {} });
  const b = H.makeBattle(r, { seed });
  b.onShot = (a, t, hit, d, m) => {
    if (!m || !m.passes || !m.passes.length) return;
    const z = (n.byZone[m.passes[0].zone] = n.byZone[m.passes[0].zone] || { hits: 0, through: 0 });
    n.hits++;
    z.hits++;
    if (m.passes[0].exit) (n.through++, z.through++);
    if (m.passes.length > 1) n.second++;
    if (m.final) n.final++;
  };
  H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: -45, objective: { x: 0, z: 45 }, seed });
  H.addSquad(r, b, { id: 'ge-0', faction: 'ge', x: 0, z: 45, objective: { x: 0, z: -45 }, facing: Math.PI, seed: seed + 1 });
  H.run(r, b, seconds);
}
const pct = (a, b) => (b ? ((100 * a) / b).toFixed(0) + '%' : '-');
log('body hits ' + n.hits + ': through ' + pct(n.through, n.hits) + ', second body ' + pct(n.second, n.hits) +
  ', spent round flew on ' + pct(n.final, n.hits));
Object.keys(n.byZone).forEach(k => log('  ' + k.padEnd(8) + n.byZone[k].hits + ' hits, through ' + pct(n.byZone[k].through, n.byZone[k].hits)));
