/* Who writes a squad's `rally` and `orderAnchor`, and is the writer-ping-pong the benchmark counts
   (BattleOrderProvenance `writer-ping-pong`: owner A, B, A on one field within 8 s) two deciders fighting or
   one owner reached by two code paths? Observe only.

   Every assignment to either field is caught on the accessor module 36 installs (the probe wraps the setter
   and calls it unchanged) with the calling file:function:line from the stack. Module 36 records a move over
   0.9 m and labels it with the owner context it ran in: `squad-stability` inside a module hook, else (before
   the single publisher) the field's inferred owner `squad-orders`. In-place moves (`anchor.x += ...`, also
   before the publisher) never reach a setter; module 36's 1.6 s sampler logs them as `in-place/unknown`. The
   probe joins the two: each squad's recorded events for
   the two fields (read from the squad's own provenance store every step) carry the site of the assignment
   that caused them, when there was one.

   Report:
     writes              assignments by field and calling site, and whether they moved the point
     recorded            provenance events by field, label and site
     labelConflicts      module 36's own test replayed on the recorded events (a conflict is raised as the
                         event arrives, so these are raw detections, before its dedupe and 80-conflict cap):
                         count by kind and field, the label sequences, and the (phase/state) of the three
                         writes; `benchmark` is module 36's real list for the same fields to check against
     siteConflicts       the same test with the calling site in place of the label
     divergence          steps on which rally and orderAnchor differ by over 0.9 m, by phase/state
     examples            the first few label ping-pongs with every write between (time, site, label, phase) */
(function (root) {
  'use strict';
  var FIELDS = ['rally', 'orderAnchor'];
  var WINDOW = 8;
  var EPS = 0.9;
  var writes, siteById, chains, lastId, diverged, hooked, steps;

  function bump(map, key, n) {
    map[key] = (map[key] || 0) + (n || 1);
  }
  function sum(map) {
    return Object.keys(map).reduce(function (n, k) {
      return n + map[k];
    }, 0);
  }
  function dist(a, b) {
    return a && b ? Math.hypot(a.x - b.x, a.z - b.z) : Infinity;
  }
  function competing(owner) {
    return !!owner && owner !== 'unknown' && owner !== 'in-place/unknown' && owner !== 'diagnostics';
  }
  /* The first stack frame that is not this probe: file:function:line. Behind the single publisher every write
     is `publishAnchor`, so its caller (advance, regroup, merge, setup) is added: file:publishAnchor:line<caller. */
  function site() {
    var lines = String(new Error().stack || '').split('\n'),
      found = null;
    for (var i = 1; i < lines.length; i++) {
      var m = /at (?:(.*?) \()?(.*?):(\d+):\d+\)?\s*$/.exec(lines[i]);
      if (!m) continue;
      var fn = m[1] || '(anonymous)',
        file = m[2].split('?')[0].split('/').pop();
      if (fn === 'site' || fn === 'wrapped' || /rally-writers|^<anonymous>$/.test(file)) continue;
      if (!found) {
        found = file + ':' + fn + ':' + m[3];
        if (fn !== 'publishAnchor' && fn.split('.').pop() !== 'publishAnchor') return found;
        continue;
      }
      return found + '<' + fn.split('.').pop();
    }
    return found || 'unknown';
  }
  function hook(sq) {
    FIELDS.forEach(function (field) {
      var d = Object.getOwnPropertyDescriptor(sq, field);
      if (!d || !d.set || d.set.__rallyProbe) return;
      var set = d.set;
      var wrapped = function (v) {
        var at = site(),
          sim = root.__battle__,
          store = sim && sim._orderProvenance,
          before = this[field] && { x: this[field].x, z: this[field].z },
          seq = store ? store.seq : 0;
        set.call(this, v);
        bump(writes, field + ' ' + at + (dist(before, v) > EPS ? ' moved' : ' same'));
        if (store && store.seq > seq) siteById[store.seq] = at;
      };
      wrapped.__rallyProbe = true;
      Object.defineProperty(sq, field, {
        enumerable: d.enumerable,
        configurable: true,
        get: d.get,
        set: wrapped
      });
    });
  }
  function scan(sq) {
    var ts = sq.__orderProvenance;
    if (!ts) return;
    var key = sq.faction + ':' + sq.id,
      from = lastId[key] || 0;
    for (var i = 0; i < ts.events.length; i++) {
      var e = ts.events[i];
      if (e.id <= from) continue;
      lastId[key] = Math.max(lastId[key] || 0, e.id);
      if (FIELDS.indexOf(e.field) < 0) continue;
      (chains[key + ':' + e.field] = chains[key + ':' + e.field] || []).push({
        id: e.id,
        t: e.time,
        owner: e.owner,
        site: siteById[e.id] || '(in-place)',
        why: e.site,
        phase: e.phase,
        inContact: e.inContact
      });
    }
  }
  /* module 36's conflictKind, with `pick` choosing what counts as the owner. */
  function kindOf(events, t, pick) {
    var n = events.length;
    if (n >= 3) {
      var a = events[n - 3],
        b = events[n - 2],
        c = events[n - 1];
      if (
        competing(pick(a)) &&
        competing(pick(b)) &&
        competing(pick(c)) &&
        pick(a) === pick(c) &&
        pick(a) !== pick(b) &&
        c.t - a.t <= WINDOW
      )
        return 'writer-ping-pong';
    }
    var owners = [],
      switches = 0,
      last = null,
      first = null;
    for (var i = Math.max(0, n - 5); i < n; i++) {
      var o = pick(events[i]);
      if (!competing(o)) continue;
      if (first == null) first = events[i].t;
      if (o !== last) {
        if (last != null) switches++;
        last = o;
        if (owners.indexOf(o) < 0) owners.push(o);
      }
    }
    return owners.length >= 3 && switches >= 3 && t - first <= WINDOW ? 'writer-churn' : null;
  }
  function replay(pick) {
    var found = { total: 0, byKind: {}, sequences: {}, phases: {} },
      list = [];
    Object.keys(chains).forEach(function (key) {
      var chain = chains[key],
        field = key.split(':').pop();
      for (var k = 0; k < chain.length; k++) {
        var win = chain.slice(Math.max(0, k - 6), k + 1),
          kind = kindOf(win, chain[k].t, pick);
        if (!kind) continue;
        found.total++;
        bump(found.byKind, field + ' ' + kind);
        var last3 = win.slice(-3);
        bump(found.sequences, field + ' ' + kind + ': ' + last3.map(pick).join(' > '));
        bump(
          found.phases,
          field +
            ' ' +
            last3
              .map(function (e) {
                return e.phase || '-';
              })
              .join(' > ')
        );
        list.push({
          chain: key,
          kind: kind,
          from: chain[Math.max(0, k - 2)].t,
          to: chain[k].t,
          trace: win.slice(-3)
        });
      }
    });
    return { summary: found, list: list };
  }
  (root.BattleProbes = root.BattleProbes || {})['rally-writers'] = {
    every: 0,
    start: function () {
      writes = {};
      siteById = {};
      chains = {};
      lastId = {};
      diverged = {};
      hooked = new Set();
      steps = 0;
    },
    sample: function (sim) {
      steps++;
      ['us', 'ge'].forEach(function (f) {
        (sim.factions[f].squads || []).forEach(function (sq) {
          if (!hooked.has(sq)) {
            hook(sq);
            hooked.add(sq);
          }
          scan(sq);
          if (dist(sq.rally, sq.orderAnchor) > EPS && sq.rally && sq.orderAnchor)
            bump(diverged, (sq.commandPhase || '-') + '/' + (sq.state || '-'));
        });
      });
    },
    report: function (sim) {
      var recorded = {};
      Object.keys(chains).forEach(function (key) {
        chains[key].forEach(function (e) {
          bump(recorded, key.split(':').pop() + ' ' + e.owner + ' <- ' + e.site);
        });
      });
      var byLabel = replay(function (e) {
          return e.owner;
        }),
        bySite = replay(function (e) {
          return e.site;
        }),
        real = root.BattleOrderProvenance ? root.BattleOrderProvenance.conflicts(sim) : [],
        mine = real.filter(function (c) {
          return FIELDS.indexOf(c.field) >= 0;
        });
      return {
        steps: steps,
        writes: writes,
        recorded: recorded,
        labelConflicts: byLabel.summary,
        siteConflicts: bySite.summary,
        benchmark: {
          allFields: real.length,
          rallyOrOrderAnchor: mine.length,
          list: mine.map(function (c) {
            return {
              t: c.time,
              field: c.field,
              kind: c.kind,
              squad: c.faction + ':' + c.squad,
              owners: c.owners
            };
          })
        },
        divergence: { steps: sum(diverged), byPhase: diverged },
        examples: byLabel.list.slice(0, 4)
      };
    }
  };
})(window);
