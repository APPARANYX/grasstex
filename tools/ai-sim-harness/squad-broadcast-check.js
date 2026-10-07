#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./harness');

function load(root, rel) {
  const code = fs.readFileSync(path.join(H.REPO, rel), 'utf8');
  new Function('window', 'globalThis', 'console', 'location', code)(
    root,
    root,
    { log() {}, warn() {} },
    root.location || { search: '' }
  );
}
function setup(xs) {
  H.resetIds();
  const r = H.bootstrap({ search: '?squadBroadcast=1' }),
    systems = {};
  r.BattleModules.registerSystem = function (id, sys) {
    systems[id] = sys;
  };
  r.BattleTelemetry = { record() {} };
  load(r, 'battle/modules/49-squad-broadcast.js');
  const b = H.makeBattle(r, { seed: 17 }),
    squads = xs.map((x, i) =>
      H.addSquad(r, b, {
        id: 'us-' + i,
        faction: 'us',
        x: x,
        z: 0,
        objective: { x: x, z: 100 },
        facing: 0
      })
    ),
    ge = H.addSquad(r, b, {
      id: 'ge-0',
      faction: 'ge',
      x: 0,
      z: 220,
      objective: { x: 0, z: 0 },
      facing: Math.PI
    });
  return { r, b, squads, foe: ge.members[0], sys: systems['squad-broadcast'] };
}
function seen(w, sq, x, at) {
  sq.contact = {
    unit: w.foe,
    x: x,
    z: 40,
    at: at,
    seenBy: sq.members[0].id,
    firstHandAt: at
  };
}
function tick(w, t) {
  w.b.time = t;
  w.sys.onCommanderTick(w.b);
}

{
  const w = setup([0, 100, 200, 300]),
    [a, b, c, d] = w.squads;
  seen(w, a, 0, 10);
  tick(w, 10);
  assert.ok(b.contact && b.contact.broadcast, 'nearest squad receives the report');
  assert.equal(c.contact, null, 'same tick does not relay through the newly updated neighbour');
  assert.equal(d.contact, null);
  tick(w, 14);
  assert.equal(c.contact, null, 'a received broadcast is not a source on the next tick either');
}

{
  const w = setup([0, 60]),
    [a, b] = w.squads;
  seen(w, a, 0, 10);
  tick(w, 10);
  assert.equal(b.contact.x, 0);
  seen(w, a, 45, 11);
  tick(w, 11);
  assert.equal(b.contact.x, 0, 'cooldown suppresses the immediate update');
  tick(w, 14);
  assert.equal(b.contact.x, 45, 'suppressed update retries after cooldown');
  assert.equal(b.contact.at, 11, 'retry keeps source observation time');
  assert.ok(w.r.BattleSquadBroadcast.summary(w.b).suppressed >= 1);
}

{
  const w = setup([0, 60]),
    [a, b] = w.squads;
  seen(w, a, 0, 1);
  b.contact = { unit: null, x: 12, z: 40, at: 9, heard: true, firstHandAt: null };
  tick(w, 10);
  assert.equal(b.contact.at, 9, 'older report does not overwrite fresher local information');
  assert.equal(b.contact.x, 12);
}

{
  const w = setup([0, 60]),
    [a, b] = w.squads;
  seen(w, a, 0, 1);
  tick(w, 10);
  assert.equal(b.contact.at, 1, 'aggregate report keeps the original observation time');
  const man = b.members.find(s => !s.dead),
    c = w.r.SquadAI.soldierContact(man, w.b),
    snap = w.r.SquadAI.beliefSnapshot(man, w.b);
  assert.ok(c && c.source === 'told', 'recipient gets personal reported knowledge');
  assert.equal(c.unit, null, 'reported knowledge is not promoted to a live target');
  assert.equal(c.at, 1);
  assert.ok(snap.beliefs.some(x => x.observedAt === 1 && x.source === 'told'));
  const summary = w.r.BattleSquadBroadcast.summary(w.b);
  assert.ok(summary.beliefsApplied >= 1, JSON.stringify(summary));
}

console.log('PASS squad broadcast source isolation, cooldown retry, freshness, and personal belief delivery');
