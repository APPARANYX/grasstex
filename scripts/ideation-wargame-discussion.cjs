#!/usr/bin/env node
'use strict';
// Fictional WWII strategic ideation lab. No game simulation or battle code is run.
const fs = require('node:fs');
const crypto = require('node:crypto');

const ALLOWED = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);
const OUTCOMES = new Set(['ongoing', 'us_win', 'ge_win', 'draw']);
const MARK = /<!-- WARGAME_STATE_V1:([A-Za-z0-9+/=]+) -->/;

function turnLimit(body) {
  const match = String(body || '').match(/^\s*Turn limit:\s*(\d+)\s*$/im);
  return match ? Math.max(2, Math.min(15, Number(match[1]))) : 10;
}
function authorized(name, event) {
  if (name === 'workflow_dispatch') return true;
  return name === 'discussion_comment' && event.action === 'created' &&
    ALLOWED.has(event.comment?.author_association) &&
    /^!wargame (start|next)$/i.test(String(event.comment?.body || '').trim());
}
function key(secret) {
  if (!secret || secret.length < 24) throw new Error('Set WARGAME_STATE_KEY secret (at least 24 characters)');
  return crypto.scryptSync(secret, 'grasstex-wargame-v1', 32);
}
function encrypt(record, secret) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(secret), iv);
  const bytes = Buffer.concat([c.update(JSON.stringify(record)), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), bytes]).toString('base64');
}
function decrypt(encoded, secret) {
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.length < 29) throw new Error('Invalid encrypted record');
  const d = crypto.createDecipheriv('aes-256-gcm', key(secret), bytes.subarray(0, 12));
  d.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(Buffer.concat([d.update(bytes.subarray(28)), d.final()]).toString('utf8'));
}
function latest(comments, secret) {
  let current = null;
  for (const comment of comments) {
    const match = String(comment.body || '').match(MARK);
    if (!match) continue;
    try {
      const item = decrypt(match[1], secret);
      if (Number.isInteger(item.turn) && item.turn > 0 &&
          (!current || current.turn < item.turn)) current = item;
    } catch (_) { /* Ignore copied, edited or malformed ciphertext. */ }
  }
  return current;
}
function checkOrder(o) {
  if (!o || typeof o.intent !== 'string' || !o.intent.trim() ||
      !Array.isArray(o.native_actions) || !Array.isArray(o.proposed_actions) ||
      o.native_actions.length > 8 || o.proposed_actions.length > 8)
    throw new Error('Invalid commander order contract');
  return o;
}
function checkUmpire(u, turn) {
  if (!u || !OUTCOMES.has(u.outcome) || typeof u.public_report !== 'string' ||
      typeof u.us_report !== 'string' || typeof u.ge_report !== 'string' ||
      !Array.isArray(u.capability_findings) || !u.state ||
      !('public' in u.state) || !('us_intel' in u.state) ||
      !('ge_intel' in u.state) || !('hidden' in u.state))
    throw new Error('Invalid umpire state contract');
  u.state.turn = turn;
  return u;
}
async function github(query, variables) {
  const r = await fetch(process.env.GITHUB_GRAPHQL_URL || 'https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
      accept: 'application/vnd.github+json', 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  const json = await r.json();
  if (!r.ok || json.errors?.length)
    throw new Error('Discussion API error: ' + JSON.stringify(json.errors || r.status).slice(0, 500));
  return json.data;
}
async function discussion(owner, repo, number) {
  const q = 'query($owner:String!,$repo:String!,$number:Int!,$after:String){repository(owner:$owner,name:$repo){discussion(number:$number){id title body comments(first:100,after:$after){nodes{body}pageInfo{hasNextPage endCursor}}}}}';
  let data = null, comments = [], after = null;
  do {
    const response = await github(q, { owner, repo, number, after });
    data = response.repository?.discussion;
    if (!data) throw new Error('Discussion not found; confirm Discussions are enabled');
    comments.push(...data.comments.nodes);
    if (comments.length > 1500) throw new Error('Discussion exceeds history safety limit');
    after = data.comments.pageInfo.hasNextPage ? data.comments.pageInfo.endCursor : null;
  } while (after);
  return { ...data, comments };
}
async function publish(id, body) {
  const q = 'mutation($id:ID!,$body:String!){addDiscussionComment(input:{discussionId:$id,body:$body}){comment{url}}}';
  const result = await github(q, { id, body });
  return result.addDiscussionComment.comment.url;
}
async function model(instructions, input) {
  const r = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
      'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.WARGAME_MODEL || 'gpt-5-mini',
      instructions, input: JSON.stringify(input),
      max_output_tokens: 3500,
      text: { format: { type: 'json_object' } }
    })
  });
  const data = await r.json();
  if (!r.ok) throw new Error('Model HTTP ' + r.status + ': ' + String(data.error?.message || '').slice(0, 200));
  const raw = (data.output || []).flatMap(x => x.content || [])
    .filter(x => x.type === 'output_text').map(x => x.text).join('');
  try { return JSON.parse(raw); }
  catch (_) { throw new Error('Model did not return valid JSON'); }
}
const COMMON = [
  'You are a WW2 fictional-game commander running a design thought experiment, NOT a battle simulation.',
  'Use ONLY the public_state and own_intel in your input. Do not infer privileged enemy state as fact.',
  'Optimize scenario objectives. Make thoughtful choices under uncertainty and resource/time limits.',
  'Only label a command native if the scenario specifically lists it as currently supported.',
  'Propose unsupported abilities separately, describing drawbacks, delay, conditions and limitations.',
  'Avoid costless teleportation, guaranteed contacts or unlimited resources.',
  'Output JSON: {"intent":"...","native_actions":[{"actor":"...","action":"...","target":"..."}],',
  '"proposed_actions":[{"name":"...","reason":"...","constraints":"..."}],"contingency":"...","confidence":0.5}.',
  'Maximum four actions of each kind. No commentary outside the JSON.'
].join('\n');
const REFEREE = [
  'You are the neutral umpire for a fictional WWII strategy-game ideation exercise.',
  'This is NOT the real GRASSTEX simulator: outcomes are qualitative hypotheses, not measured evidence.',
  'Simultaneously adjudicate both commander orders using time, terrain, uncertainty, intel age,',
  'travel/resources, and force commitments. No side wins merely by proposing an invented capability.',
  'A proposed new command can have a hypothetical effect only with sensible costs and delay.',
  'Keep fog of war. State.public has SHARED information only; state.us_intel is US-only,',
  'state.ge_intel GE-only; state.hidden contains confidential ground truth.',
  'Preserve relevant scenario constraints and game resources through future rounds.',
  'Keep world state compact, avoid unsupported exact enemy detections, and distinguish guesses.',
  'Respond with JSON keys: public_report (string), us_report (string), ge_report (string),',
  'outcome (ongoing|us_win|ge_win|draw), capability_findings (array), rationale (string),',
  'state (object containing public, us_intel, ge_intel, hidden). Be consistent and concise.'
].join('\n');
function postBody(n, limit, us, ge, referee, encrypted) {
  const fence = String.fromCharCode(96, 96, 96);
  return [
    '## Commander Ideation — Round ' + n + '/' + limit, '',
    '**US committed order**', fence + 'json', JSON.stringify(us, null, 2), fence, '',
    '**German committed order**', fence + 'json', JSON.stringify(ge, null, 2), fence, '',
    '**Umpire (hypothetical):** ' + referee.public_report, '',
    '**Capability candidates:**', fence + 'json',
    JSON.stringify(referee.capability_findings, null, 2), fence, '',
    '**Outcome:** ' + referee.outcome +
      (n === limit && referee.outcome === 'ongoing' ? ' (turn limit reached)' : ''), '',
    'Faction-private reports and world state are encrypted, not posted in readable form.',
    'This is ideation evidence, not verified gameplay. An authorized collaborator may post',
    String.fromCharCode(96) + '!wargame next' + String.fromCharCode(96) + ' to advance.', '',
    '<!-- WARGAME_STATE_V1:' + encrypted + ' -->'
  ].join('\n');
}
async function main() {
  const eventName = process.env.GITHUB_EVENT_NAME || 'workflow_dispatch';
  const event = process.env.GITHUB_EVENT_PATH ?
    JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : {};
  if (!authorized(eventName, event)) {
    console.log('Ignored: unauthorized or non-wargame command');
    return;
  }
  const number = Number(process.env.DISCUSSION_NUMBER || event.discussion?.number);
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('Invalid discussion number');
  const [owner, repo] = String(process.env.GITHUB_REPOSITORY || '').split('/');
  if (!owner || !repo || !process.env.GITHUB_TOKEN) throw new Error('Repository/token unavailable');
  if (!process.env.OPENAI_API_KEY) throw new Error('Set OPENAI_API_KEY repository secret');
  if (!process.env.WARGAME_STATE_KEY) throw new Error('Set WARGAME_STATE_KEY repository secret');
  const thread = await discussion(owner, repo, number);
  if (!thread.title.startsWith('[WARGAME]')) {
    console.log('Ignored: not a [WARGAME] discussion');
    return;
  }
  const prior = latest(thread.comments, process.env.WARGAME_STATE_KEY);
  const commandId = eventName === 'discussion_comment' ?
    'comment:' + String(event.comment?.id || '') :
    'dispatch:' + String(process.env.GITHUB_RUN_ID || 'manual');
  if (prior?.commandId === commandId) {
    console.log('Already processed this command; no additional round');
    return;
  }
  if (prior?.outcome && prior.outcome !== 'ongoing') {
    console.log('Already concluded: ' + prior.outcome);
    return;
  }
  const n = (prior?.turn || 0) + 1;
  const limit = turnLimit(thread.body);
  if (n > limit) {
    console.log('Turn limit reached');
    return;
  }
  const state = prior?.state || { turn: 0, public: { scenario: thread.body },
    us_intel: {}, ge_intel: {}, hidden: {} };
  const [us, ge] = await Promise.all([
    model(COMMON + '\nYou command ONLY the US faction.', {
      round: n, scenario: thread.body, side: 'US', public_state: state.public,
      own_intel: state.us_intel, own_previous_order: prior?.orders?.us,
      own_previous_report: prior?.reports?.us
    }).then(checkOrder),
    model(COMMON + '\nYou command ONLY the GE faction.', {
      round: n, scenario: thread.body, side: 'GE', public_state: state.public,
      own_intel: state.ge_intel, own_previous_order: prior?.orders?.ge,
      own_previous_report: prior?.reports?.ge
    }).then(checkOrder)
  ]);
  const ref = checkUmpire(await model(REFEREE, {
    round: n, scenario: thread.body, prior_state: state, us_orders: us, ge_orders: ge
  }), n);
  const record = { turn: n, commandId, outcome: ref.outcome, state: ref.state,
    orders: { us, ge }, reports: { us: ref.us_report, ge: ref.ge_report } };
  const url = await publish(thread.id, postBody(n, limit, us, ge, ref,
    encrypt(record, process.env.WARGAME_STATE_KEY)));
  console.log('Round ' + n + ' published: ' + url);
}
module.exports = { turnLimit, authorized, encrypt, decrypt, latest, checkOrder, checkUmpire, postBody };
if (require.main === module) main().catch(e => {
  console.error('Commander ideation failed: ' + e.message);
  process.exitCode = 1;
});
