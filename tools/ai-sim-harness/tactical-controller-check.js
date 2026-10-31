#!/usr/bin/env node
'use strict';
/* Tactical controller lifecycle (#602 runtime foundation): legacy by default, rejected switches with a
   specific reason, exclusive dispatch across the six entry points, stale-token and foreign-actor
   rejection, cancellation before a switch, interrupts that release once, cleanup retries, reentrant
   cancellation and the restart barrier. Fixture provider only; no gameplay acceptance is implied. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const REPO = path.resolve(__dirname, '../..');
let n = 0;
function test(name, fn) {
  fn();
  n++;
  console.log('PASS ' + name);
}
function boot(withContract = true) {
  const root = { GTLog() {} };
  root.window = root;
  if (withContract)
    root.BattleTacticalCapabilityContract = require('../../battle/tactical-capability-contract');
  const ends = [],
    cleared = [],
    suppressed = [],
    released = [];
  root.BattleLeases = {
    end(sq, kind, t, why) {
      ends.push(kind + ':' + why);
    }
  };
  root.BattleEngagement = {
    clearBoundOrders(sq) {
      cleared.push(sq.id);
    },
    assignSuppressors(sq, sim, members, known) {
      suppressed.push(known);
    }
  };
  root.BattleTacticalPositions = {
    current: s => (s.station ? s.station : null),
    release(s, sim, why) {
      released.push(s.id + ':' + why);
      s.station = null;
    }
  };
  new Function(
    'window',
    fs.readFileSync(path.join(REPO, 'battle/modules/13a-tactical-controller.js'), 'utf8')
  )(root);
  return { root, TC: root.BattleTacticalController, ends, cleared, suppressed, released };
}
function squad(id, faction, ids) {
  return {
    id,
    faction,
    members: ids.map(i => ({ id: i, dead: false, isPlayer: false })),
    _macroMission: { version: 1 }
  };
}
function sim() {
  const us = squad('us-0', 'us', [1, 2, 3]),
    us2 = squad('us-1', 'us', [4, 5]),
    ge = squad('ge-0', 'ge', [1, 9]);
  return { time: 5, factions: { us: { squads: [us, us2] }, ge: { squads: [ge] } }, us, us2, ge };
}
/* A complete fixture provider: every policy, adapter and lifecycle adapter, with a call log. */
function provider(TC, id, opts = {}) {
  const log = [],
    ctxs = [],
    p = { id, policies: {}, adapters: {}, lifecycle: {} };
  TC.points.forEach(point => {
    p.policies[point] = ctx => {
      log.push('policy:' + point);
      ctxs.push(ctx);
      if (opts.policy) opts.policy(ctx, point);
    };
  });
  Object.keys(require('../../battle/tactical-capability-contract').capabilities).forEach(cap => {
    p.adapters[cap] = req => {
      log.push('adapter:' + cap + ':' + req.actorId);
      return opts.accept ? opts.accept(req) : true;
    };
  });
  p.lifecycle.cancel = (req, why) => {
    log.push('cancel:' + req.actionId + ':' + why);
    return opts.cancel ? opts.cancel(req, why) : true;
  };
  p.lifecycle.release = (req, why) => {
    log.push('release:' + req.actionId + ':' + why);
    return opts.release ? opts.release(req, why) : true;
  };
  p.lifecycle.stage = req => (opts.stage ? opts.stage(req) : { stage: 'accepted', reason: 'fixture', at: 0 });
  (opts.omit || []).forEach(k => {
    const [group, name] = k.split(':');
    delete p[group][name];
  });
  return { spec: p, log, ctxs, last: () => ctxs[ctxs.length - 1] };
}
const MOVE = { point: { x: 1, z: 2 } };
function owned(w, opts) {
  const s = sim(),
    P = provider(w.TC, 'fixture', opts);
  assert.equal(w.TC.registerProvider(P.spec).ok, true);
  assert.equal(w.TC.requestMode(s, s.us, 'new', 'fixture').reason, 'switched');
  return { s, P };
}

test('legacy owns every squad by default; no entry point reaches a provider', () => {
  const w = boot(),
    s = sim(),
    P = provider(w.TC, 'fixture');
  w.TC.registerProvider(P.spec);
  assert.deepEqual(w.TC.points, [
    'squadCommand',
    'commanderTick',
    'fireAndMovement',
    'executeMission',
    'engagement',
    'stationSelection'
  ]);
  w.TC.points.forEach(point => assert.equal(w.TC.dispatch(s, s.us, point), false));
  assert.equal(w.TC.controls(s, s.us), false);
  assert.equal(w.TC.mode(s, s.us), 'legacy');
  assert.deepEqual(P.log, []);
  assert.deepEqual(w.TC.summary(s).legacy, 3);
});

test('an incomplete or unknown replacement is rejected with a specific reason and legacy keeps the squad', () => {
  const cases = [
    [{}, 'unknown-provider', 'nobody'],
    [{ omit: ['policies:stationSelection'] }, 'missing-policy:stationSelection'],
    [{ omit: ['adapters:transport.cancel'] }, 'missing-adapter:transport.cancel'],
    [{ omit: ['adapters:movement.move'] }, 'missing-adapter:movement.move'],
    [{ omit: ['lifecycle:release'] }, 'missing-lifecycle:release'],
    [{ omit: ['lifecycle:stage'] }, 'missing-lifecycle:stage']
  ];
  cases.forEach(([opts, reason, id]) => {
    const w = boot(),
      s = sim(),
      P = provider(w.TC, 'fixture', opts);
    w.TC.registerProvider(P.spec);
    assert.deepEqual(w.TC.requestMode(s, s.us, 'new', id || 'fixture'), { ok: false, reason });
    assert.equal(w.TC.mode(s, s.us), 'legacy');
    assert.equal(w.TC.dispatch(s, s.us, 'squadCommand'), false);
    assert.equal(w.ends.length, 0, 'a rejected switch releases no legacy work');
  });
  const w = boot(false),
    s = sim();
  w.TC.registerProvider(provider(w.TC, 'fixture').spec);
  assert.equal(w.TC.requestMode(s, s.us, 'new', 'fixture').reason, 'contract-unavailable');
  assert.equal(w.TC.requestMode(s, s.us, 'replacement', 'fixture').reason, 'unknown-mode');
  assert.equal(w.TC.registerProvider(provider(w.TC, 'fixture').spec).reason, 'duplicate-provider');
  assert.equal(w.TC.summary(s).stats.rejected['contract-unavailable'], 1);
});

test('a complete replacement owns its squad exclusively at all six entry points; others stay legacy', () => {
  const w = boot(),
    { s, P } = owned(w);
  w.TC.points.forEach(point => {
    assert.equal(w.TC.dispatch(s, s.us, point, { fact: point }), true);
    assert.equal(w.TC.dispatch(s, s.us2, point), false);
    assert.equal(w.TC.dispatch(s, s.ge, point), false);
  });
  assert.deepEqual(
    P.log,
    w.TC.points.map(p => 'policy:' + p)
  );
  assert.equal(P.ctxs[2].facts.fact, 'fireAndMovement');
  assert.equal(w.TC.controls(s, s.us), true);
  assert.deepEqual(
    w.ends,
    ['bound', 'bound-cycle', 'regroup-bypass', 'route-transition', 'corner-hold'].map(
      k => k + ':controller-switched'
    ),
    'policy leases end; regroup goes through its owner; retreat-anchor, rally-recovery, succession stay'
  );
  assert.deepEqual(w.cleared, ['us-0']);
  assert.deepEqual(w.suppressed, [null], 'legacy suppressor jobs are cleared, not reassigned');
});

test('switching to a replacement releases legacy-held stations through their owner', () => {
  const w = boot(),
    s = sim();
  s.us.members[1].station = { id: 'w1' };
  w.TC.registerProvider(provider(w.TC, 'fixture').spec);
  w.TC.requestMode(s, s.us, 'new', 'fixture');
  assert.deepEqual(w.released, ['2:controller-switched']);
});

test('shadow has no effect authority, and returning from shadow to legacy cancels nothing', () => {
  const w = boot(),
    s = sim(),
    P = provider(w.TC, 'fixture');
  w.TC.registerProvider(P.spec);
  assert.equal(w.TC.requestMode(s, s.us, 'shadow').reason, 'switched');
  w.TC.points.forEach(point => assert.equal(w.TC.dispatch(s, s.us, point), false));
  assert.equal(w.TC.requestMode(s, s.us, 'legacy').reason, 'switched');
  assert.deepEqual(P.log, []);
  assert.equal(w.ends.length, 0);
});

test('stale tokens are rejected after a controller switch, a mission change and a restart', () => {
  const w = boot(),
    { s, P } = owned(w);
  w.TC.dispatch(s, s.us, 'fireAndMovement');
  const old = P.last();
  assert.equal(old.request('movement.move', 1, MOVE).ok, true);
  w.TC.requestMode(s, s.us, 'legacy');
  w.TC.requestMode(s, s.us, 'new', 'fixture');
  assert.equal(old.request('movement.move', 2, MOVE).reason, 'stale-controller');
  w.TC.dispatch(s, s.us, 'fireAndMovement');
  const beforeMission = P.last();
  s.us._macroMission = { version: 2 };
  assert.equal(beforeMission.request('movement.hold', 2, MOVE).reason, 'stale-mission');
  w.TC.dispatch(s, s.us, 'fireAndMovement');
  const beforeRestart = P.last();
  w.TC.beforeRestart(s);
  w.TC.requestMode(s, s.us, 'new', 'fixture');
  assert.equal(beforeRestart.request('movement.hold', 2, MOVE).reason, 'stale-generation');
  assert.equal(w.TC.summary(s).stats.staleRequests, 3);
});

test('a dispatch call cannot act on a foreign, dead or player-owned actor', () => {
  const w = boot(),
    { s, P } = owned(w);
  w.TC.dispatch(s, s.us, 'engagement');
  const ctx = P.last();
  assert.equal(ctx.request('movement.move', 4, MOVE).reason, 'invalid-actor', 'same faction, other squad');
  assert.equal(ctx.request('movement.move', 9, MOVE).reason, 'invalid-actor', 'enemy soldier');
  assert.equal(ctx.request('movement.move', 'nobody', MOVE).reason, 'invalid-actor');
  assert.equal(ctx.request('mission.accept', 9, { version: 1 }).reason, 'invalid-actor');
  s.us.members[1].dead = true;
  s.us.members[2].isPlayer = true;
  w.TC.dispatch(s, s.us, 'engagement');
  const after = P.last();
  assert.equal(after.request('movement.move', 2, MOVE).reason, 'actor-dead');
  assert.equal(after.request('movement.move', 3, MOVE).reason, 'player-owned');
  assert.equal(P.log.filter(e => e.startsWith('adapter:')).length, 0, 'no owner adapter was called');
});

test('owner rejection and resource conflicts leave no live action', () => {
  const w = boot(),
    { s, P } = owned(w, { accept: req => req.capability !== 'station.claim' });
  w.TC.dispatch(s, s.us, 'stationSelection');
  const ctx = P.last();
  assert.equal(
    ctx.request('station.claim', 1, { stationId: 'w1', threat: { x: 0, z: 9 } }).reason,
    'owner-rejected'
  );
  assert.equal(ctx.request('movement.move', 1, MOVE).ok, true);
  assert.equal(ctx.request('movement.hold', 1, MOVE).reason, 'resource-conflict');
  assert.equal(ctx.request('movement.hold', 2, MOVE).ok, true);
  assert.equal(w.TC.summary(s).actions, 2);
});

test('an action with unconfirmed cancellation still holds its resources', () => {
  const w = boot(),
    { s, P } = owned(w, { release: () => false });
  w.TC.dispatch(s, s.us, 'engagement');
  P.last().request('movement.move', 1, MOVE);
  w.TC.interrupt(s, s.us, 1, 'emergency-cover');
  assert.equal(w.TC.summary(s).pending, 1);
  w.TC.dispatch(s, s.us, 'engagement');
  assert.equal(P.last().request('movement.move', 1, MOVE).reason, 'resource-conflict');
  assert.equal(P.last().request('movement.move', 2, MOVE).ok, true);
});

test('the roster is read once per tick for dispatch, but a request always checks the live roster', () => {
  const w = boot(),
    { s, P } = owned(w);
  w.TC.dispatch(s, s.us, 'engagement');
  s.us.members[2].dead = true;
  w.TC.dispatch(s, s.us, 'engagement');
  assert.equal(P.last().token.rosterRevision, 0, 'same sim time: cached');
  assert.equal(P.last().request('movement.move', 1, MOVE).reason, 'stale-roster');
  s.time += 0.15;
  w.TC.dispatch(s, s.us, 'engagement');
  assert.equal(P.last().token.rosterRevision, 1);
  assert.equal(P.last().request('movement.move', 1, MOVE).ok, true);
  assert.equal(w.TC.summary(s).stats.dispatches.engagement, 3);
});

test('a switch away from the replacement cancels its actions first, then changes owner', () => {
  const w = boot();
  let modeAtCancel = null;
  const { s, P } = owned(w, {
    cancel: () => {
      modeAtCancel = w.TC.mode(s, s.us);
      return true;
    }
  });
  w.TC.dispatch(s, s.us, 'fireAndMovement');
  const id = P.last().request('movement.move', 1, MOVE).actionId;
  assert.equal(w.TC.requestMode(s, s.us, 'legacy').reason, 'switched');
  assert.equal(modeAtCancel, 'new', 'cancellation ran while the replacement still owned the squad');
  assert.deepEqual(P.log.slice(-2), [
    'cancel:' + id + ':controller-switched',
    'release:' + id + ':controller-switched'
  ]);
  assert.equal(w.TC.dispatch(s, s.us, 'fireAndMovement'), false);
});

test('unconfirmed cleanup blocks the switch, keeps one owner and is retried on the next dispatch', () => {
  const w = boot();
  let confirm = false;
  const { s, P } = owned(w, { release: () => confirm });
  w.TC.dispatch(s, s.us, 'squadCommand');
  const id = P.last().request('movement.move', 1, MOVE).actionId;
  assert.deepEqual(w.TC.requestMode(s, s.us, 'legacy'), { ok: false, reason: 'cleanup-pending' });
  assert.equal(w.TC.controls(s, s.us), true, 'never left without a controller, never two');
  assert.equal(w.TC.summary(s).pending, 1);
  confirm = true;
  w.TC.dispatch(s, s.us, 'squadCommand');
  assert.equal(w.TC.summary(s).pending, 0);
  assert.equal(
    P.log.filter(e => e === 'cancel:' + id + ':controller-switched').length,
    1,
    'cancel is not repeated'
  );
  assert.equal(P.log.filter(e => e.startsWith('release:' + id)).length, 2, 'release retried until confirmed');
  assert.equal(w.TC.requestMode(s, s.us, 'legacy').reason, 'switched');
});

test('repeated interrupts release an actor resources once and leave his comrades alone', () => {
  const w = boot(),
    { s, P } = owned(w);
  w.TC.dispatch(s, s.us, 'engagement');
  const a = P.last().request('movement.move', 1, MOVE).actionId,
    b = P.last().request('movement.move', 2, MOVE).actionId;
  assert.equal(w.TC.interrupt(s, s.us, 1, 'emergency-cover').reason, 'cancelled');
  w.TC.interrupt(s, s.us, 1, 'emergency-cover');
  w.TC.interrupt(s, s.us, '1', 'emergency-cover');
  assert.equal(P.log.filter(e => e === 'release:' + a + ':emergency-cover').length, 1);
  assert.equal(P.log.filter(e => e.startsWith('release:' + b)).length, 0);
  assert.equal(w.TC.summary(s).actions, 1);
  assert.equal(w.TC.interrupt(s, s.us2, 4, 'emergency-cover').reason, 'not-controlled');
});

test('reentrant cancellation neither recurses nor releases twice, and blocks new requests', () => {
  const w = boot(),
    seen = [];
  let ctx = null;
  const { s, P } = owned(w, {
    cancel: () => {
      seen.push(w.TC.requestMode(s, s.us, 'legacy').reason);
      seen.push(w.TC.interrupt(s, s.us, null, 'again').reason);
      seen.push(ctx.request('movement.hold', 3, MOVE).reason);
      return true;
    }
  });
  w.TC.dispatch(s, s.us, 'fireAndMovement');
  ctx = P.last();
  const a = ctx.request('movement.move', 1, MOVE).actionId;
  ctx.request('movement.move', 2, MOVE);
  assert.equal(w.TC.requestMode(s, s.us, 'legacy').reason, 'switched');
  assert.deepEqual(seen, [
    'cancelling',
    'cancelling',
    'cancelling',
    'cancelling',
    'cancelling',
    'cancelling'
  ]);
  assert.equal(P.log.filter(e => e.startsWith('release:' + a)).length, 1);
  assert.equal(P.log.filter(e => e.startsWith('release:')).length, 2);
  assert.equal(w.TC.mode(s, s.us), 'legacy');
});

test('mission supersession and roster changes cancel the old actions before the policy runs', () => {
  const w = boot(),
    { s, P } = owned(w);
  w.TC.dispatch(s, s.us, 'executeMission');
  const a = P.last().request('movement.move', 1, MOVE).actionId;
  s.us._macroMission = { version: 2 };
  w.TC.dispatch(s, s.us, 'executeMission');
  assert.ok(
    P.log.indexOf('cancel:' + a + ':mission-superseded') < P.log.lastIndexOf('policy:executeMission')
  );
  const b = P.last().request('movement.move', 1, MOVE).actionId;
  s.us.members[0].dead = true;
  w.TC.dispatch(s, s.us, 'executeMission');
  assert.ok(P.log.includes('release:' + b + ':roster-changed'), "the dead man's own action is released");
  assert.equal(P.last().token.rosterRevision, 1);
});

test("a death elsewhere in the squad leaves the other men's actions in place and new requests still work", () => {
  const w = boot(),
    { s, P } = owned(w);
  w.TC.dispatch(s, s.us, 'executeMission');
  const kept = P.last().request('movement.move', 1, MOVE).actionId,
    gone = P.last().request('movement.move', 2, MOVE).actionId;
  s.us.members[1].dead = true;
  w.TC.dispatch(s, s.us, 'executeMission');
  assert.ok(P.log.includes('release:' + gone + ':roster-changed'));
  assert.ok(!P.log.includes('release:' + kept + ':roster-changed'), 'the survivor keeps his action');
  assert.equal(P.last().token.rosterRevision, 1);
  assert.equal(
    w.TC.summary(s).live.some(a => a.actionId === kept),
    true,
    'still live at the owner'
  );
  const next = P.last().request('movement.move', 3, MOVE);
  assert.equal(next.ok, true, "a new request is not refused for the kept action's older revision");
  assert.equal(P.last().finish(kept), true, 'the kept action can still be finished');
});

test('an owner adapter cannot switch controllers while accepting; the action stays with its issuer', () => {
  const w = boot(),
    seen = [];
  const B = provider(w.TC, 'fixture-b');
  w.TC.registerProvider(B.spec);
  let s = null;
  const { s: sim0, P } = owned(w, {
    accept: () => {
      seen.push(w.TC.requestMode(s, s.us, 'new', 'fixture-b').reason);
      return true;
    }
  });
  s = sim0;
  w.TC.dispatch(s, s.us, 'fireAndMovement');
  const id = P.last().request('movement.move', 1, MOVE).actionId;
  assert.deepEqual(seen, ['accepting']);
  assert.equal(w.TC.requestMode(s, s.us, 'new', 'fixture-b').reason, 'switched');
  assert.ok(
    P.log.includes('cancel:' + id + ':controller-switched'),
    'the issuing provider cancels its own action'
  );
  assert.equal(B.log.filter(e => e.startsWith('cancel:')).length, 0);
  assert.equal(w.TC.summary(s).actions, 0);
});

test('an owner that completes synchronously inside acceptance leaves no ghost action', () => {
  const w = boot();
  let ctx = null,
    finished = null;
  const { s, P } = owned(w, {
    accept: req => {
      finished = ctx.finish(req.actionId, 'completed');
      return true;
    }
  });
  w.TC.dispatch(s, s.us, 'engagement');
  ctx = P.last();
  const r = ctx.request('movement.move', 1, MOVE);
  assert.equal(r.ok, true);
  assert.equal(finished, true);
  assert.equal(w.TC.summary(s).actions, 0);
  assert.equal(P.log.filter(e => e === 'release:' + r.actionId + ':completed').length, 1);
});

test('an older policy context cannot finish a newer controller action', () => {
  const w = boot(),
    { s, P } = owned(w);
  w.TC.dispatch(s, s.us, 'engagement');
  const old = P.last();
  const a = old.request('movement.move', 1, MOVE).actionId;
  assert.equal(old.finish(a), true, 'its own context may finish it');
  w.TC.requestMode(s, s.us, 'legacy');
  w.TC.requestMode(s, s.us, 'new', 'fixture');
  w.TC.dispatch(s, s.us, 'engagement');
  const b = P.last().request('movement.move', 1, MOVE).actionId;
  assert.equal(old.finish(b), false);
  assert.equal(w.TC.summary(s).actions, 1);
  assert.equal(P.log.filter(e => e.startsWith('release:' + b)).length, 0);
  w.TC.beforeRestart(s);
  assert.equal(P.last().finish(b), false, 'nor after a restart');
});

test('a rejected acceptance is removed and releases nothing', () => {
  const w = boot(),
    { s, P } = owned(w, { accept: () => false });
  w.TC.dispatch(s, s.us, 'engagement');
  assert.equal(P.last().request('movement.move', 1, MOVE).reason, 'owner-rejected');
  assert.equal(w.TC.summary(s).actions, 0);
  assert.equal(P.log.filter(e => e.startsWith('release:')).length, 0);
});

test('cleanup retries are guarded against reentrant lifecycle callbacks', () => {
  const w = boot(),
    seen = [];
  let tries = 0,
    s = null;
  const { s: sim0, P } = owned(w, {
    release: () => {
      tries++;
      if (tries === 1) return false;
      seen.push(w.TC.interrupt(s, s.us, null, 'again').reason);
      seen.push(w.TC.requestMode(s, s.us, 'legacy').reason);
      return true;
    }
  });
  s = sim0;
  w.TC.dispatch(s, s.us, 'squadCommand');
  const id = P.last().request('movement.move', 1, MOVE).actionId;
  w.TC.interrupt(s, s.us, 1, 'emergency-cover');
  assert.equal(w.TC.summary(s).stats.interruptsUnconfirmed, 1);
  w.TC.dispatch(s, s.us, 'squadCommand');
  assert.deepEqual(seen, ['cancelling', 'cancelling']);
  assert.equal(P.log.filter(e => e.startsWith('release:' + id)).length, 2, 'one failed try, one confirmed');
  assert.equal(w.TC.summary(s).pending, 0);
});

test('stale mission and roster contexts cannot complete an old action and do not bypass cleanup', () => {
  const w = boot(),
    { s, P } = owned(w);
  w.TC.dispatch(s, s.us, 'fireAndMovement');
  const first = P.last(),
    a = first.request('movement.move', 1, MOVE).actionId;
  s.us._macroMission = { version: 2 };
  assert.equal(first.finish(a), false, 'the original mission no longer owns completion');
  w.TC.dispatch(s, s.us, 'fireAndMovement');
  assert.ok(P.log.includes('cancel:' + a + ':mission-superseded'));
  const second = P.last(),
    b = second.request('movement.move', 1, MOVE).actionId;
  s.us.members[0].dead = true;
  assert.equal(second.finish(b), false, 'the old roster cannot complete a live action');
  w.TC.dispatch(s, s.us, 'fireAndMovement');
  assert.ok(P.log.includes('cancel:' + b + ':roster-changed'), 'dispatch still detects the roster change');
});

test('a native station that refuses release blocks controller takeover', () => {
  const w = boot(),
    s = sim(),
    P = provider(w.TC, 'fixture');
  w.TC.registerProvider(P.spec);
  s.us.members[1].station = { id: 'still-held' };
  let releases = 0;
  w.root.BattleTacticalPositions.release = () => (releases++, false);
  assert.equal(w.TC.requestMode(s, s.us, 'new', 'fixture').reason, 'cleanup-pending');
  assert.equal(w.TC.mode(s, s.us), 'legacy');
  assert.deepEqual(w.TC.summary(s).refused, [
    { squad: s.us.id, holdouts: ['station:' + s.us.members[1].id] }
  ]);
  for (let i = 0; i < 5; i++) w.TC.requestMode(s, s.us, 'new', 'fixture');
  assert.equal(releases, 1, 'retries do not rerun cleanup on a squad legacy still commands');
  assert.equal(w.TC.summary(s).stats.releaseRefused, 1);
  delete s.us.members[1].station;
  assert.equal(
    w.TC.requestMode(s, s.us, 'new', 'fixture').ok,
    true,
    'once the holdout is gone the switch proceeds'
  );
  assert.equal(w.TC.summary(s).refused, undefined);
});

test('a momentary refusal earns one more release after a mission change or a replaced holdout', () => {
  const w = boot(),
    s = sim(),
    P = provider(w.TC, 'fixture');
  w.TC.registerProvider(P.spec);
  const man = s.us.members[1];
  man.station = { id: 'busy' };
  let releases = 0,
    refuse = true;
  w.root.BattleTacticalPositions.release = m => {
    releases++;
    if (refuse) return false;
    delete m.station;
    return true;
  };
  assert.equal(w.TC.requestMode(s, s.us, 'new', 'fixture').reason, 'cleanup-pending');
  refuse = false;
  w.TC.requestMode(s, s.us, 'new', 'fixture');
  assert.equal(releases, 1, 'same holdout, same mission and roster: no rerun');
  s.us._macroMission = { version: 7 };
  assert.equal(w.TC.requestMode(s, s.us, 'new', 'fixture').ok, true, 'a mission change reruns cleanup once');
  assert.equal(releases, 2);

  const w2 = boot(),
    s2 = sim(),
    P2 = provider(w2.TC, 'fixture');
  w2.TC.registerProvider(P2.spec);
  s2.us.members[1].station = { id: 'first' };
  let tries = 0;
  w2.root.BattleTacticalPositions.release = () => (tries++, false);
  w2.TC.requestMode(s2, s2.us, 'new', 'fixture');
  w2.TC.requestMode(s2, s2.us, 'new', 'fixture');
  assert.equal(tries, 1);
  s2.us.members[1].station = { id: 'second' };
  w2.TC.requestMode(s2, s2.us, 'new', 'fixture');
  assert.equal(tries, 2, 'a new holdout with the same name is not the old refusal');
});

test('a stage report that throws shows the action as unknown, never hides it, and the read changes nothing', () => {
  const w = boot(),
    { s, P } = owned(w, {
      stage: () => {
        throw new Error('boom');
      }
    });
  w.TC.dispatch(s, s.us, 'fireAndMovement');
  const a = P.last().request('movement.move', 1, MOVE).actionId,
    sum = w.TC.summary(s);
  assert.equal(sum.live.length, 1);
  assert.equal(sum.live[0].actionId, a);
  assert.equal(sum.live[0].stage, 'unknown');
  assert.equal(sum.live[0].reason, 'stage-fault');
  assert.deepEqual(w.TC.summary(s), sum, 'a second read is identical');
});

test('a provider fault never hands the tick back to legacy', () => {
  const w = boot(),
    { s } = owned(w, {
      policy: () => {
        throw new Error('fixture fault');
      }
    });
  assert.equal(w.TC.dispatch(s, s.us, 'commanderTick'), true);
  assert.equal(w.TC.summary(s).stats.faults, 1);
  assert.throws(() => w.TC.dispatch(s, s.us, 'notAPoint'), /Unknown tactical entry point/);
});

test('the restart barrier cancels with the battle-restart reason, then returns every squad to legacy', () => {
  const w = boot(),
    { s, P } = owned(w, { release: () => false });
  w.TC.dispatch(s, s.us, 'fireAndMovement');
  const a = P.last().request('movement.move', 1, MOVE).actionId;
  P.last().request('movement.move', 2, MOVE);
  const out = w.TC.beforeRestart(s);
  assert.deepEqual(out, { cancelled: 0, unconfirmed: 2 });
  assert.equal(w.TC.summary(s).stats.restartDropped, 2, 'dropped cleanup is counted');
  assert.ok(P.log.includes('cancel:' + a + ':battle-restart'));
  assert.equal(w.TC.mode(s, s.us), 'legacy');
  assert.equal(w.TC.summary(s).generation, 1);
  assert.equal(w.TC.summary(s).new, 0);
});

test('static: the controller adds no timer, RNG draw, movement writer or squad/soldier field', () => {
  const src = fs.readFileSync(path.join(REPO, 'battle/modules/13a-tactical-controller.js'), 'utf8');
  assert.doesNotMatch(src, /setTimeout|setInterval|requestAnimationFrame|Math\.random|\.random\(/);
  assert.doesNotMatch(src, /\.destination\s*=|proposeOrder|proposeCombat|\.stance\s*=/);
  assert.doesNotMatch(src, /\b(sq|s|squad|soldier|a\[i\])\.[A-Za-z_$]+\s*=[^=]/);
});

console.log(n + ' tactical controller lifecycle checks passed');
