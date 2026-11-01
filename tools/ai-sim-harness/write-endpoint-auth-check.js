#!/usr/bin/env node
'use strict';
/* SEC-01: battle_policy.php and battle_learning.php used to accept a write after only an Origin check,
   which any script can fake. A write now also needs the write key (X-Write-Key), checked against a hash in
   state/write-key.php that lives on the server only. No key file means writes are off. Reads stay open.
   This runs each endpoint under PHP's built-in server in a scratch copy and posts to it. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');

const REPO = process.env.GRASSTEX_SOURCE_ROOT || path.resolve(__dirname, '../..');
const KEY = 'test-only-key-' + crypto.randomBytes(6).toString('hex');
const ORIGIN = 'https://test.ivandpopov.com';
if (spawnSync('php', ['-v']).status !== 0) {
  console.log('write-endpoint-auth-check: php not available, skipped');
  process.exit(0);
}

const policyBody = {
  genome: {
    parameters: {
      cohesionRadius: 30,
      captainlessCohesion: 25,
      regroupHold: 0.5,
      cornerHold: 0.6,
      cornerNoCaptainExtra: 0.3,
      supportDelay: 10,
      sectorNeutralNeed: 60,
      sectorEnemyNeed: 100,
      sectorActiveBonus: 10,
      sectorDistanceWeight: 0.5,
      routeArrivalRadius: 8,
      finalRouteRadius: 12,
      captureCommitRatio: 0.8,
      contactDistance: 30,
      townBoundary: 60,
      engagedRallyAdvance: 0.1,
      pressObjectiveMinDistance: 6,
      pressEnemyClearance: 30,
      scoutLead: 3,
      gunnerTrail: 2,
      decisionSnapshotSeconds: 6
    },
    doctrine: {
      reserveFraction: 0.2,
      localSuperiority: 1.2,
      flankPreference: 0.5,
      defenseCommitment: 0.5,
      riskTolerance: 0.5,
      objectiveStrategy: 'balanced'
    },
    rules: [{ id: 'r1', when: ['enemyNear'], action: 'hold', weight: 0.5 }]
  },
  baseRevision: 0
};
const learningBody = {
  type: 'experience',
  experience: {
    fingerprint: { keys: ['a'], vector: [0.5] },
    genome: policyBody.genome,
    seed: 's',
    score: 1,
    winner: 'us'
  }
};

async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'write-auth-'));
  for (const f of ['battle_policy.php', 'battle_learning.php'])
    fs.copyFileSync(path.join(REPO, f), path.join(dir, f));
  const port = 20000 + Math.floor(Math.random() * 20000);
  const srv = spawn('php', ['-S', '127.0.0.1:' + port, '-t', dir], { stdio: 'ignore' });
  const base = 'http://127.0.0.1:' + port + '/';
  try {
    for (let i = 0; ; i++) {
      try {
        await fetch(base + 'battle_policy.php');
        break;
      } catch (e) {
        if (i > 50) throw e;
        await new Promise(r => setTimeout(r, 100));
      }
    }
    const post = (file, body, headers) =>
      fetch(base + file, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
        body: JSON.stringify(body)
      });
    const cases = [
      ['battle_policy.php', policyBody, 'ai-policy.json'],
      ['battle_learning.php', learningBody, 'scenario-memory.json']
    ];
    const stored = f => fs.existsSync(path.join(dir, 'state', f));

    for (const [file, body, out] of cases) {
      let r = await post(file, body, { Origin: ORIGIN });
      assert.equal(r.status, 503, file + ': a correct Origin alone must not write when no key is set');
      r = await post(file, body, {});
      assert.equal(r.status, 403, file + ': no Origin is refused');
      assert.equal(stored(out), false, file + ': nothing stored so far');
    }

    fs.mkdirSync(path.join(dir, 'state'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'state', 'write-key.php'),
      "<?php return '" + crypto.createHash('sha256').update(KEY).digest('hex') + "';\n"
    );

    for (const [file, body, out] of cases) {
      let r = await post(file, body, { Origin: ORIGIN });
      assert.equal(r.status, 401, file + ': Origin without the key is refused');
      r = await post(file, body, { Origin: ORIGIN, 'X-Write-Key': 'wrong' });
      assert.equal(r.status, 401, file + ': wrong key is refused');
      r = await post(file, body, { 'X-Write-Key': KEY });
      assert.equal(r.status, 403, file + ': the key without an Origin is refused');
      assert.equal(stored(out), false, file + ': nothing stored by refused writes');
      r = await post(file, body, { Origin: ORIGIN, 'X-Write-Key': KEY });
      assert.equal(r.status, 200, file + ': Origin plus the right key writes');
      assert.equal(stored(out), true, file + ': the write landed');
    }
    for (const f of ['battle_policy.php', 'battle_learning.php']) {
      assert.equal((await fetch(base + f)).status, 200, f + ': reads stay open');
    }
    console.log('write-endpoint-auth-check: ok');
  } finally {
    srv.kill();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
main().catch(e => {
  console.error(e);
  process.exit(1);
});
