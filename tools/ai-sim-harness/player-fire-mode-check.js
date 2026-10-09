#!/usr/bin/env node
'use strict';
/* The player's trigger and fire selector. An automatic fires at its own cyclic rate for as long as the
   trigger is held: no burst length and no re-lay pause (those are a gunner's trigger discipline, the AI's
   to model). A weapon that really had a selector (Thompson M1A1, FG 42) answers to it; one that did not
   (MP 40, M1919A6, MG 42) is full auto only. The AI's bursts are untouched by either. */
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  H = require('./harness');

let checks = 0;
function test(name, fn) {
  fn();
  checks++;
  console.log('PASS ' + name);
}
function load(r, p) {
  new Function('window', 'globalThis', 'console', fs.readFileSync(path.join(H.REPO, p), 'utf8'))(r, r, {
    log() {},
    warn() {}
  });
}

const r = H.bootstrap({ modules: false });
r.BattleModules = { registerSystem() {}, unitsFor: b => (b._roster.us || []).concat(b._roster.ge || []) };
load(r, 'battle/movement-resolver.js');
load(r, 'battle/modules/14-z-ballistic-raycast.js');
load(r, 'battle/modules/46-ammunition-stoppages.js');
const S = r.SquadAI,
  W = r.BattleWeapons,
  AIM = { x: 0, y: 1.2, z: 80 };

/* A fresh battle with one possessed man carrying the side's weapon for `role`. `log` holds when each
   round is presented (sim time + its cyclic offset) and the climb index it was resolved with. */
function rig(faction, role) {
  H.resetIds();
  const b = H.makeBattle(r, { seed: 5, obstacles: [] });
  b.random = () => 0.5;
  const sq = H.addSquad(r, b, {
    id: faction + '-0',
    faction,
    x: 0,
    z: 0,
    objective: { x: 0, z: 100 },
    composition: [role]
  });
  const s = sq.members[0];
  s.isPlayer = true;
  s.root.position.x = 0;
  s.root.position.z = 0;
  s.root.rotation.y = 0;
  const log = { at: [], climb: [] };
  b.onFire = (soldier, delay) => log.at.push(b.time + (delay || 0));
  const real = r.BattleBallistics.resolvePlayerRay;
  b.__restore = () => (r.BattleBallistics.resolvePlayerRay = real);
  r.BattleBallistics.resolvePlayerRay = function (shooter, aim, battle, round, delay) {
    log.climb.push(round);
    return real.apply(this, arguments);
  };
  return { b, s, log };
}
/* Hold the trigger for `seconds` of sim time in steps of `dt`; each step is one frame of the player loop. */
function hold(g, seconds, dt) {
  for (let t = 0; t < seconds - 1e-9; t += dt) {
    g.b.time += dt;
    S.tickFireCooldown(g.s, dt);
    S.playerFireRay(g.s, AIM, g.b);
  }
}
function idle(g, seconds, dt) {
  for (let t = 0; t < seconds - 1e-9; t += dt) {
    g.b.time += dt;
    S.tickFireCooldown(g.s, dt);
  }
}
function done(g) {
  g.b.__restore();
}
function maxGap(at) {
  let gap = 0;
  for (let i = 1; i < at.length; i++) gap = Math.max(gap, at[i] - at[i - 1]);
  return gap;
}

test('selector data: only the Thompson M1A1 and the FG 42 have one', () => {
  const modes = (f, k) => {
    const w = W.issue({ kind: k }, f);
    return [W.fireModes(w), W.fireMode(w)];
  };
  assert.deepEqual(modes('us', 'smg'), [['auto', 'semi'], 'auto'], 'Thompson is drawn on full auto');
  assert.deepEqual(modes('ge', 'carbine'), [['semi', 'auto'], 'semi'], 'FG 42 is drawn on semi');
  for (const [f, k] of [
    ['ge', 'smg'],
    ['us', 'lmg'],
    ['ge', 'lmg']
  ])
    assert.deepEqual(modes(f, k), [null, 'auto'], f + ' ' + k + ' is full auto only');
  for (const [f, k] of [
    ['us', 'rifle'],
    ['ge', 'rifle'],
    ['us', 'carbine'],
    ['us', 'pistol'],
    ['ge', 'pistol']
  ])
    assert.deepEqual(modes(f, k), [null, 'semi'], f + ' ' + k + ' is semi only');
  const mp = W.issue({ kind: 'smg' }, 'ge');
  assert.equal(W.cycleFireMode(mp), null, 'no selector, no change');
  assert.equal(W.fireMode(mp), 'auto');
  const tommy = W.issue({ kind: 'smg' }, 'us');
  assert.equal(W.cycleFireMode(tommy), 'semi');
  assert.equal(W.cycleFireMode(tommy), 'auto', 'the selector cycles');
});

test('MG 42 held: one round per cyclic interval, no burst cap and no re-lay pause', () => {
  const g = rig('ge', 'gunner'),
    cyclic = g.s.weapon.stats.cyclic;
  assert.equal(cyclic, 20);
  hold(g, 2, 1 / 60);
  /* An AI burst would be 5-8 rounds then a ~1 s pause: at most ~16 rounds in two seconds. */
  assert.ok(g.log.at.length >= 39 && g.log.at.length <= 41, 'about 40 rounds in 2 s, got ' + g.log.at.length);
  assert.ok(maxGap(g.log.at) <= 1.5 / cyclic, 'no pause between rounds: gap ' + maxGap(g.log.at));
  done(g);
});

test('the cadence survives a slow frame (rounds due are fired together, none are lost)', () => {
  for (const dt of [1 / 30, 0.1]) {
    const g = rig('ge', 'gunner');
    hold(g, 2, dt);
    assert.ok(
      g.log.at.length >= 38 && g.log.at.length <= 42,
      'dt ' + dt.toFixed(3) + ': about 40 rounds in 2 s, got ' + g.log.at.length
    );
    done(g);
  }
});

test('a tap is a short burst the player chose, and letting go stops the gun at once', () => {
  const g = rig('ge', 'gunner');
  hold(g, 0.1, 1 / 60);
  const fired = g.log.at.length;
  assert.ok(fired >= 2 && fired <= 3, 'a 0.1 s tap on an MG 42 is 2-3 rounds, got ' + fired);
  idle(g, 1, 1 / 60);
  assert.equal(g.log.at.length, fired, 'no round after the trigger is let go');
  done(g);
});

test('M1919A6 and MP 40 fire at their own cyclic rates', () => {
  for (const [f, role, want] of [
    ['us', 'gunner', 8],
    ['ge', 'sergeant', 9.2]
  ]) {
    const g = rig(f, role);
    assert.equal(W.cycleFireMode(g.s.weapon), null);
    hold(g, 2, 1 / 60);
    const got = g.log.at.length;
    assert.ok(Math.abs(got - 2 * want) <= 1.5, f + ' ' + role + ': ' + got + ' rounds vs ' + 2 * want);
    done(g);
  }
});

test('Thompson: full auto by default, one aimed round per cooldown on semi', () => {
  const g = rig('us', 'sergeant');
  hold(g, 2, 1 / 60);
  assert.ok(g.log.at.length >= 22 && g.log.at.length <= 25, 'full auto ~23 rounds, got ' + g.log.at.length);
  assert.ok(maxGap(g.log.at) <= 1.5 / 11.7, 'no pause on full auto');
  done(g);

  const s = rig('us', 'sergeant');
  assert.equal(W.cycleFireMode(s.s.weapon), 'semi');
  hold(s, 2, 1 / 60);
  /* rof 2.4/s with the aimed-fire jitter: about 5 rounds, each its own trigger pull, none delayed. */
  assert.ok(s.log.at.length >= 3 && s.log.at.length <= 6, 'semi ~5 rounds in 2 s, got ' + s.log.at.length);
  assert.ok(
    s.log.at.every((t, i) => i === 0 || t - s.log.at[i - 1] >= 1 / 2.4 / 1.2),
    'semi rounds are separated by the aimed cooldown'
  );
  done(s);
});

test('FG 42: semi by default, full auto on the selector, whatever the range', () => {
  const g = rig('ge', 'scout');
  assert.equal(g.s.weapon.stats.autoWithin, 50, 'the AI rule is still there');
  hold(g, 2, 1 / 60);
  assert.ok(g.log.at.length >= 1 && g.log.at.length <= 3, 'semi ~2 rounds in 2 s, got ' + g.log.at.length);
  done(g);

  const a = rig('ge', 'scout');
  assert.equal(W.cycleFireMode(a.s.weapon), 'auto');
  hold(a, 1.2, 1 / 60);
  /* The aim point is 80 m away: the AI would fire single rounds there, the player's selector decides.
     1.2 s stays inside the 20-round magazine (12.5 rounds/s). */
  assert.ok(a.log.at.length >= 14 && a.log.at.length <= 16, 'auto ~15 rounds, got ' + a.log.at.length);
  done(a);
});

test('climb counts rounds since the trigger was let go and stops at the longest AI burst', () => {
  const g = rig('ge', 'gunner'),
    top = g.s.weapon.stats.burst[1] - 1;
  hold(g, 3, 1 / 60);
  assert.equal(g.log.climb[0], 0, 'a fresh pull starts at the bottom of the climb');
  assert.equal(Math.max.apply(null, g.log.climb), top, 'never wider than the worst round of an AI burst');
  assert.equal(g.log.climb[g.log.climb.length - 1], top, 'a held trigger stays there');
  const before = g.log.climb.length;
  idle(g, 0.4, 1 / 60);
  hold(g, 0.1, 1 / 60);
  assert.equal(g.log.climb[before], 0, 'the gun comes back down once the trigger is let go');
  done(g);
});

test('a bolt action or semi-automatic is exactly what it was', () => {
  const g = rig('ge', 'rifleman');
  hold(g, 4, 1 / 60);
  /* Kar98k rof .5: one round every ~2 s, drawn from the same aimed-cooldown jitter. */
  assert.ok(
    g.log.at.length >= 2 && g.log.at.length <= 3,
    'bolt action ~2 rounds in 4 s, got ' + g.log.at.length
  );
  assert.ok(
    g.log.climb.every(c => c === 0),
    'single shots never climb'
  );
  done(g);
});

test('AI bursts are untouched by the player selector', () => {
  for (const [f, role] of [
    ['ge', 'gunner'],
    ['us', 'sergeant']
  ]) {
    const g = rig(f, role),
      shooter = g.s;
    shooter.isPlayer = false;
    shooter.weapon.fireMode = 'semi'; // a selector the AI must never read
    S.setFireCooldown(shooter, 0);
    shooter.target = null;
    g.b.time += 1;
    S.areaFire(shooter, { x: 0, z: 40 }, g.b);
    const stats = shooter.weapon.stats,
      n = g.log.at.length;
    assert.ok(
      n >= stats.burst[0] && n <= stats.burst[1],
      f + ' ' + role + ': an AI trigger pull is still a burst of ' + stats.burst.join('-') + ', got ' + n
    );
    assert.ok(
      shooter.fireCooldown > n / stats.cyclic + 0.5,
      f + ' ' + role + ': the AI still re-lays the gun after a burst'
    );
    done(g);
  }
});

test('the camera wires B / Y to the selector and shows the mode on the HUD', () => {
  const cam = fs.readFileSync(path.join(H.REPO, 'battle/camera-controls.js'), 'utf8');
  assert.match(
    cam,
    /key === 'b'\) \{\s*if \(!event\.repeat\) cyclePlayerFireMode\(\);/,
    'B cycles once per press'
  );
  assert.match(cam, /padPressedOnce\(pad, 3\)\) cyclePlayerFireMode\(\)/, 'Y cycles on the controller');
  assert.match(cam, /W\.cycleFireMode\(player\.weapon\)/, "the selector is the weapon owner's");
  assert.match(cam, /id="battlePlayerFireMode"/, 'the HUD has a fire-mode cell');
  assert.match(cam, /'FULL AUTO'[\s\S]{0,40}'SEMI'/, 'the HUD names the mode');
  assert.doesNotMatch(cam, /burstLength|burstPause/, 'the camera never imposes a burst');
});

console.log('player-fire-mode-check: ' + checks + ' checks passed');
