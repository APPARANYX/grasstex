'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');
const { loadModule } = require('./module-loader');
const r = H.bootstrap({ modules: false }),
  hooks = {};
r.BattleModules = {
  registerSystem(id, h) {
    hooks[id] = h;
  },
  unitsFor(b) {
    return ['us', 'ge'].flatMap(f => (b.factions[f].squads || []).flatMap(q => q.members));
  },
  listSystems() {
    return Object.values(hooks);
  }
};
for (const f of [
  '54-tactical-situation',
  '54a-urban-operating-picture',
  '97-ai-timeline-recorder',
  '99-session-diagnostics-export'
])
  loadModule(r, 'battle/modules/' + f + '.js');
const b = H.makeBattle(r, { seed: 12345 });
const us = H.addSquad(r, b, { id: 'us-0', faction: 'us', x: 0, z: 0, objective: { x: 0, z: 100 } });
H.addSquad(r, b, { id: 'ge-0', faction: 'ge', x: 0, z: 80, objective: { x: 0, z: 0 } });
b.scene = {
  metadata: {
    battleScenario: {
      seed: 'diagnostic-fixture',
      buildings: [{ id: 'cell', x: 0, z: 0, w: 20, d: 20, rot: 0 }],
      roads: []
    }
  }
};
us.contact = { x: 8, z: 8, at: 9, source: 'heard' };
b.time = 10;
const T = r.BattleTacticalSituation,
  U = r.BattleUrbanOperatingPicture,
  D = r.BattleDiagnosticsExport,
  L = r.BattleAITimeline;
assert.equal(L.snapshot(b).observations, undefined, 'default timeline shape stays unchanged');
const off = D.compact(b);
assert.equal(
  off.observations.tacticalSituation.us.contactCount,
  1,
  'explicit export obtains current reports with collectors off'
);
assert.equal(
  b._tacticalSituation,
  undefined,
  'on-demand export does not enable/store automatic observations'
);
assert.equal(b._urbanOperatingPicture, undefined);
off.observations.tacticalSituation.us.contacts[0].x = 999;
assert.equal(us.contact.x, 8);
r.location = { search: '?tacticalSituation=1&urbanPicture=1' };
L.reset(b);
T.sample(b);
U.sample(b);
const savedCompute = T.compute;
T.compute = () => {
  throw Error('timeline must not recompute observer or LOS');
};
hooks['ai-timeline-recorder'].onSimulationStep(b);
const history = L.snapshot(b).observations;
assert.equal(history.frames[0].us.tactical.contacts, 1);
assert.equal(history.frames[0].us.urban.reportedBuildings, 1);
assert.equal(history.frames[0].us.urban.control, 'unknown');
assert.equal(history.frames[0].us.tactical.age, 0);
assert.equal(history.frames[0].ge.tactical.contacts, 0);
history.frames[0].us.tactical.contacts = 999;
assert.equal(L.snapshot(b).observations.frames[0].us.tactical.contacts, 1, 'history snapshot is detached');
for (let i = 11; i <= 615; i++) {
  b.time = i;
  hooks['ai-timeline-recorder'].onSimulationStep(b);
}
const capped = L.snapshot(b).observations;
assert.equal(capped.frames.length, 600);
assert.equal(capped.omitted, 6, 'bounded history names omitted frames');
assert.ok(
  capped.frames.at(-1).us.urban.age > 600,
  'old observation is explicitly aged rather than refreshed'
);
T.compute = savedCompute;
const full = D.snapshot('full', b),
  compact = D.compact(b),
  focused = D.snapshot('orders', b);
for (const p of [full, compact, focused]) {
  assert.equal(p.observations.time, 615);
  assert.equal(
    p.observations.tacticalSituation.us.contactCount,
    0,
    'expired contacts excluded on current export'
  );
}
for (const h of Object.values(hooks)) if (h.onBattleRestart) h.onBattleRestart(b);
b.time = 10;
assert.equal(
  L.snapshot(b).observations,
  undefined,
  'nonempty observer history clears on same-object restart'
);
T.sample(b);
U.sample(b);
L.reset(b);
hooks['ai-timeline-recorder'].onSimulationStep(b);
const replay = L.snapshot(b).observations;
const rows = D.timelineJsonl(D.compact(b)).trim().split('\n').map(JSON.parse);
assert.equal(rows.find(x => x.type === 'tactical-history').omitted, 0);
assert.deepEqual(
  rows.filter(x => x.type === 'tactical-frame').map(x => x.data),
  replay.frames
);
assert.equal(rows.find(x => x.type === 'tactical-snapshot').data.tacticalSituation.us.contactCount, 1);
assert.deepEqual(
  rows.filter(x => x.type === 'sample').map(x => x.data),
  L.snapshot(b).samples
);
const legacy = D.compact(b);
delete legacy.observations;
delete legacy.timeline.observations;
assert.equal(D.timelineJsonl(legacy).includes('tactical-'), false, 'legacy JSONL stays unchanged');
T.sample(b);
U.sample(b);
L.reset(b);
hooks['ai-timeline-recorder'].onSimulationStep(b);
assert.deepEqual(L.snapshot(b).observations, replay, 'same sim-time state yields deterministic history');
const html = fs.readFileSync(path.join(H.REPO, 'ai_flow_live.html'), 'utf8');
for (const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) new Function(m[1]);
console.log(
  'PASS tactical diagnostics on-demand export, separate bounded deterministic history, aging and restart'
);
