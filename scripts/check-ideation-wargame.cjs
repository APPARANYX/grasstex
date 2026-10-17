#!/usr/bin/env node
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  turnLimit, authorized, encrypt, decrypt, latest, checkOrder, checkUmpire, postBody
} = require('./ideation-wargame-discussion.cjs');

const SECRET = 'not-a-production-key-only-for-tests-123';
const ownerEvent = {
  action: 'created',
  comment: { author_association: 'OWNER', body: '!wargame next' }
};

test('authorizes explicit commands from repository collaborators', () => {
  assert.equal(authorized('discussion_comment', ownerEvent), true);
  assert.equal(authorized('discussion_comment', {
    ...ownerEvent, comment: { author_association: 'MEMBER', body: '!wargame start' }
  }), true);
  assert.equal(authorized('workflow_dispatch', {}), true);
});
test('rejects unrelated, edited, and outsider comments', () => {
  assert.equal(authorized('discussion_comment', {
    ...ownerEvent, comment: { author_association: 'NONE', body: '!wargame next' }
  }), false);
  assert.equal(authorized('discussion_comment', {
    ...ownerEvent, comment: { author_association: 'OWNER', body: 'next' }
  }), false);
  assert.equal(authorized('discussion_comment', { ...ownerEvent, action: 'edited' }), false);
  assert.equal(authorized('push', ownerEvent), false);
});
test('limits the number of turns', () => {
  assert.equal(turnLimit('Turn limit: 8'), 8);
  assert.equal(turnLimit('Turn limit: 9000'), 15);
  assert.equal(turnLimit('Turn limit: 0'), 2);
  assert.equal(turnLimit('No limit'), 10);
});
test('encryption is randomized, authenticated, and roundtrips', () => {
  const record = {
    turn: 3, outcome: 'ongoing',
    state: { us_intel: { secret: 'RED' }, ge_intel: { secret: 'BLUE' } }
  };
  const a = encrypt(record, SECRET), b = encrypt(record, SECRET);
  assert.notEqual(a, b);
  assert.deepEqual(decrypt(a, SECRET), record);
  assert.throws(() => decrypt(a, SECRET + 'wrong'));
});
test('finds highest valid encrypted state and ignores malicious malformed markers', () => {
  const make = turn => ({
    body: '<!-- WARGAME_STATE_V1:' +
      encrypt({ turn, outcome: 'ongoing', state: { public: turn } }, SECRET) + ' -->'
  });
  const rows = [make(1), { body: '<!-- WARGAME_STATE_V1:deadbeef -->' }, make(3), make(2)];
  assert.equal(latest(rows, SECRET).turn, 3);
});
test('validates commander protocol', () => {
  assert.deepEqual(checkOrder({ intent: 'hold', native_actions: [], proposed_actions: [] }),
    { intent: 'hold', native_actions: [], proposed_actions: [] });
  assert.throws(() => checkOrder({ intent: 'hold', native_actions: [] }));
  assert.throws(() => checkOrder({ intent: '', native_actions: [], proposed_actions: [] }));
});
test('validates umpire protocol', () => {
  const data = {
    public_report: 'nothing changed', us_report: 'no contact', ge_report: 'no contact',
    outcome: 'ongoing', capability_findings: [],
    state: { public: {}, us_intel: {}, ge_intel: {}, hidden: {} }
  };
  assert.equal(checkUmpire(data, 4).state.turn, 4);
  assert.throws(() => checkUmpire({ ...data, outcome: 'infinite_victory' }, 5));
});
test('published public comment contains orders but no unencrypted faction intel', () => {
  const state = encrypt({ turn: 1, state: { us_intel: { confidential: 'SECRET-US' } } }, SECRET);
  const result = postBody(1, 10,
    { intent: 'hold', native_actions: [], proposed_actions: [] },
    { intent: 'advance', native_actions: [], proposed_actions: [] },
    { public_report: 'fog', capability_findings: [], outcome: 'ongoing' }, state);
  assert.match(result, /US committed order/);
  assert.match(result, /German committed order/);
  assert.match(result, /WARGAME_STATE_V1/);
  assert.doesNotMatch(result, /SECRET-US/);
});
