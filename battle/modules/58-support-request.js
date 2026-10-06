/* Phase G2: SupportRequest lifecycle. No combat effects — just the request
   lifecycle. A SupportRequest has: requester, asset type, priority, status,
   effect card, result confidence. */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleSupportRequest) return;

  var PRIORITIES = { urgent: 3, priority: 2, routine: 1 };
  var STATUSES = ['pending', 'approved', 'denied', 'in-flight', 'completed', 'cancelled'];
  var EFFECTS = ['suppress', 'obscure', 'interdict', 'protect'];
  var CONFIDENCE = ['observed', 'inferred', 'unknown'];

  var nextId = 1;
  var requests = {};

  function create(spec) {
    var req = {
      id: 'sr-' + (nextId++),
      requester: spec.requester || null,
      requesterSquad: spec.requesterSquad || null,
      assetType: spec.assetType || null,
      priority: spec.priority || 'routine',
      status: 'pending',
      effect: spec.effect || 'suppress',
      resultConfidence: 'unknown',
      point: spec.point ? { x: +spec.point.x || 0, z: +spec.point.z || 0 } : null,
      createdAt: +spec.time || 0,
      decidedAt: null,
      completedAt: null,
      abortReason: null
    };
    requests[req.id] = req;
    return req;
  }

  function approve(id, time) {
    var r = requests[id];
    if (!r || r.status !== 'pending') return false;
    r.status = 'approved';
    r.decidedAt = +time || 0;
    return true;
  }

  function deny(id, time, reason) {
    var r = requests[id];
    if (!r || r.status !== 'pending') return false;
    r.status = 'denied';
    r.decidedAt = +time || 0;
    r.abortReason = reason || 'denied';
    return true;
  }

  function launch(id, time) {
    var r = requests[id];
    if (!r || r.status !== 'approved') return false;
    r.status = 'in-flight';
    return true;
  }

  function complete(id, time, confidence) {
    var r = requests[id];
    if (!r) return false;
    r.status = 'completed';
    r.completedAt = +time || 0;
    r.resultConfidence = confidence || 'unknown';
    return true;
  }

  function cancel(id, time, reason) {
    var r = requests[id];
    if (!r) return false;
    r.status = 'cancelled';
    r.completedAt = +time || 0;
    r.abortReason = reason || 'cancelled';
    return true;
  }

  function get(id) { return requests[id] || null; }
  function list() { return Object.keys(requests).map(function (k) { return requests[k]; }); }
  function pending() { return list().filter(function (r) { return r.status === 'pending'; }); }
  function active() { return list().filter(function (r) { return r.status === 'approved' || r.status === 'in-flight'; }); }

  root.BattleSupportRequest = {
    version: '1.0-g2',
    PRIORITIES: PRIORITIES,
    STATUSES: STATUSES,
    EFFECTS: EFFECTS,
    CONFIDENCE: CONFIDENCE,
    create: create,
    approve: approve,
    deny: deny,
    launch: launch,
    complete: complete,
    cancel: cancel,
    get: get,
    list: list,
    pending: pending,
    active: active
  };

  if (root.BattleModules) {
    root.BattleModules.registerSystem('support-request', {
      version: '1.0-g2',
      onBattleStart: function () { requests = {}; nextId = 1; },
      onBattleRestart: function () { requests = {}; nextId = 1; }
    });
  }
  console.log('[TACTICS] G2: SupportRequest lifecycle loaded (no combat effects)');
})(typeof window !== 'undefined' ? window : globalThis);
