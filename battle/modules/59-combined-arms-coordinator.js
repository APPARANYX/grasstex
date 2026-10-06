/* Phase G3: CombinedArmsCoordinator — scheduler that accepts/denies/expire/
   traces support requests, resolves conflicts, publishes to AI graph.
   No combat effects. */
(function (root) {
  'use strict';
  if (!root.BattleModules || root.BattleCombinedArmsCoordinator) return;

  var SR = function () { return root.BattleSupportRequest; };
  var AR = function () { return root.BattleCombinedArmsRegistry; };
  var decisions = [];

  /* Resolve conflicts: two squads request the same asset — higher priority wins */
  function resolveConflicts(sim) {
    var sr = SR();
    if (!sr) return;
    var pending = sr.pending();
    if (pending.length < 2) return;

    /* Group by assetType */
    var groups = {};
    pending.forEach(function (r) {
      var key = r.assetType;
      (groups[key] = groups[key] || []).push(r);
    });

    var now = +sim.time || 0;
    Object.keys(groups).forEach(function (key) {
      var group = groups[key];
      if (group.length < 2) return;
      /* Sort by priority (urgent > priority > routine), then by creation time */
      group.sort(function (a, b) {
        var pa = sr.PRIORITIES[a.priority] || 1, pb = sr.PRIORITIES[b.priority] || 1;
        if (pa !== pb) return pb - pa;
        return a.createdAt - b.createdAt;
      });
      /* Approve the first, deny the rest */
      sr.approve(group[0].id, now);
      decisions.push({ id: group[0].id, action: 'approved', reason: 'highest-priority', at: now });
      for (var i = 1; i < group.length; i++) {
        sr.deny(group[i].id, now, 'conflict-resolved');
        decisions.push({ id: group[i].id, action: 'denied', reason: 'conflict', at: now });
      }
    });
  }

  /* Expire stale requests (pending for > 60s) */
  function expireStale(sim) {
    var sr = SR();
    if (!sr) return;
    var now = +sim.time || 0;
    sr.pending().forEach(function (r) {
      if (now - r.createdAt > 60) {
        sr.cancel(r.id, now, 'expired');
        decisions.push({ id: r.id, action: 'expired', at: now });
      }
    });
  }

  /* Publish decision to AI graph (telemetry) */
  function publish(sim) {
    if (!root.BattleTelemetry) return;
    decisions.slice(-20).forEach(function (d) {
      root.BattleTelemetry.record('decision-support-request', {
        id: d.id, action: d.action, reason: d.reason || null, time: d.at
      }, sim);
    });
  }

  function tick(sim) {
    resolveConflicts(sim);
    expireStale(sim);
    publish(sim);
  }

  function summary() {
    var sr = SR();
    if (!sr) return null;
    var all = sr.list();
    return {
      total: all.length,
      pending: sr.pending().length,
      active: sr.active().length,
      decisions: decisions.length,
      recent: decisions.slice(-20)
    };
  }

  root.BattleCombinedArmsCoordinator = {
    version: '1.0-g3',
    resolveConflicts: resolveConflicts,
    expireStale: expireStale,
    tick: tick,
    summary: summary
  };

  if (root.BattleModules) {
    root.BattleModules.registerSystem('combined-arms-coordinator', {
      version: '1.0-g3',
      onCommanderTick: tick,
      onBattleStart: function () { decisions = []; },
      onBattleRestart: function () { decisions = []; }
    });
  }
  console.log('[TACTICS] G3: CombinedArmsCoordinator loaded (no combat effects)');
})(typeof window !== 'undefined' ? window : globalThis);
