#!/usr/bin/env node
'use strict';
/* Phase 1 state owners. This is a focused source check, not a JavaScript type checker:
   follow local aliases, helper returns/arguments and literal bracket keys; reject direct
   writes, record replacement and standard Object/Reflect mutation APIs. Generic state,
   status and timer fields are not protected. No parser dependency is needed in CI.
   Phase 2a: the squad's anchor pair (`orderAnchor`, `rally`) has an owner FUNCTION as well as an owner
   file: only `publishAnchor` in the Squad Leader may assign either, so the Squad Leader cannot split its
   own publisher again (two sites in one file were the writer-ping-pong).
   GRASSTEX_SOURCE_ROOT lets this same check demonstrate the pre-refactor failures. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const REPO = process.env.GRASSTEX_SOURCE_ROOT || path.resolve(__dirname, '../..');
const ENG = 1,
  MISSION = 2,
  ENG_API = 4;
const owners = {
  'eng.state': 'engagement.js',
  'eng.since': 'engagement.js',
  'eng.until': 'engagement.js',
  eng: 'engagement.js',
  '_macroMission.status': 'commander-ai.js',
  _macroMission: 'commander-ai.js',
  commandPhase: 'modules/16-squad-plan-stability.js',
  orderAnchor: 'modules/16-squad-plan-stability.js',
  rally: 'modules/16-squad-plan-stability.js'
};
// Fields whose owner is one function in the owner file, not the whole file.
const ownerFunction = { orderAnchor: 'publishAnchor', rally: 'publishAnchor' };
const ownerName = field => owners[field] + (ownerFunction[field] ? ':' + ownerFunction[field] + '()' : '');

function tokens(src) {
  const out = [];
  const re =
    /\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/|'(?:\\[\s\S]|[^'\\])*'|"(?:\\[\s\S]|[^"\\])*"|`(?:\\[\s\S]|[^`\\])*`|(?:[A-Za-z_$][\w$]*)|(?:\d+(?:\.\d*)?)|(?:===|!==|>>>=|\*\*=|&&=|\|\|=|\?\?=|=>|==|!=|<=|>=|\+\+|--|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|<<=|>>=|&&|\|\||\?\?|\?\.|\.\.\.)|./gy;
  let m,
    line = 1;
  while ((m = re.exec(src))) {
    const raw = m[0],
      at = line;
    line += (raw.match(/\n/g) || []).length;
    if (/^\s|^\/\/|^\/\*/.test(raw)) continue;
    // A regexp's contents are data, not writes. Slash after an expression is division.
    if (raw === '/' && (!out.length || /^(?:[=(:,!&|?;{]|return|case|=>)$/.test(out[out.length - 1].v))) {
      let end = re.lastIndex,
        inClass = false;
      for (; end < src.length; end++) {
        if (src[end] === '\\') {
          end++;
          continue;
        }
        if (src[end] === '[') inClass = true;
        if (src[end] === ']') inClass = false;
        if (src[end] === '/' && !inClass) break;
      }
      if (end < src.length) {
        while (/[a-z]/i.test(src[end + 1] || '') && end + 1 < src.length) end++;
        re.lastIndex = end + 1;
        out.push({ v: '<regexp>', line: at, start: m.index, end: re.lastIndex });
        continue;
      }
    }
    const string = /^['"`]/.test(raw);
    out.push({
      v: string ? raw.slice(1, -1).replace(/\\(['"`\\])/g, '$1') : raw,
      string,
      line: at,
      start: m.index,
      end: re.lastIndex
    });
  }
  const stack = [];
  out.forEach((t, i) => {
    if (t.string) return;
    if ('([{'.includes(t.v)) stack.push(i);
    else if (')]}'.includes(t.v)) {
      const open = stack.pop();
      assert.notEqual(open, undefined, 'unbalanced source at line ' + t.line);
      assert.equal(
        '([{'.indexOf(out[open].v),
        ')]}'.indexOf(t.v),
        'unbalanced source at line ' + t.line + ' (open ' + out[open].v + ' at ' + out[open].line + ')'
      );
      out[open].pair = i;
      t.pair = open;
    }
  });
  assert.equal(stack.length, 0, 'unbalanced source');
  return out;
}

function scan(src, file) {
  const t = tokens(src),
    top = { parent: null, vars: new Map(), returns: 0 },
    functions = [],
    bindings = [];
  const value = i => t[i] && t[i].v;
  const ident = i => t[i] && !t[i].string && /^[A-Za-z_$][\w$]*$/.test(value(i));
  function bind(scope, name) {
    if (!scope.vars.has(name)) scope.vars.set(name, { kind: 0, literal: undefined, fn: null });
    return scope.vars.get(name);
  }
  function lookup(scope, name) {
    for (let s = scope; s; s = s.parent) if (s.vars.has(name)) return s.vars.get(name);
    return bind(top, name);
  }
  // First assign lexical function scopes. Object and control-flow braces need no
  // bindings for this var-based runtime. Nested functions keep independent aliases.
  const starts = new Map();
  for (let i = 0; i < t.length; i++) {
    if (value(i) !== 'function' || t[i].string) continue;
    let p = i + 1;
    if (value(p) === '*') p++;
    const name = ident(p) ? value(p++) : null;
    if (value(p) !== '(') continue;
    const body = t[p].pair + 1;
    if (value(body) !== '{') continue;
    starts.set(body, {
      parent: null,
      vars: new Map(),
      returns: 0,
      start: i,
      end: t[body].pair,
      name,
      paramStart: p
    });
  }
  let scope = top;
  for (let i = 0; i < t.length; i++) {
    if (starts.has(i)) {
      const fn = starts.get(i);
      fn.parent = scope;
      if (fn.name) bind(scope, fn.name).fn = fn;
      fn.params = [];
      for (let p = fn.paramStart + 1; p < t[fn.paramStart].pair; p++) {
        if (ident(p)) fn.params.push(bind(fn, value(p)));
      }
      functions.push(fn);
      scope = fn;
    }
    t[i].scope = scope;
    if (i === scope.end) scope = scope.parent;
  }
  function endExpr(a, limit = t.length) {
    let b = a;
    for (; b < limit; b++) {
      if ([';', ',', ')', ']', '}'].includes(value(b)) && !t[b].string) break;
      if (t[b].pair > b) b = t[b].pair;
    }
    return b;
  }
  function split(a, b, separator = ',') {
    const parts = [];
    let start = a;
    for (let i = a; i < b; i++) {
      if (value(i) === separator && !t[i].string) {
        parts.push([start, i]);
        start = i + 1;
      } else if (t[i].pair > i) i = t[i].pair;
    }
    parts.push([start, b]);
    return parts;
  }
  function unparen(a, b) {
    while (value(a) === '(' && t[a].pair === b - 1) {
      a++;
      b--;
    }
    return [a, b];
  }
  function literal(a, b) {
    [a, b] = unparen(a, b);
    if (b !== a + 1) return undefined;
    if (t[a].string) return value(a);
    return ident(a) ? lookup(t[a].scope, value(a)).literal : undefined;
  }
  function member(a, b) {
    [a, b] = unparen(a, b);
    if (value(b - 1) === ']' && t[b - 1].pair > a) {
      const p = t[b - 1].pair;
      return { a, b: p, key: literal(p + 1, b - 1) };
    }
    if (['.', '?.'].includes(value(b - 2)) && ident(b - 1)) return { a, b: b - 2, key: value(b - 1) };
    return null;
  }
  function kind(a, b) {
    [a, b] = unparen(a, b);
    if (a >= b) return 0;
    // Guarded/fallback aliases retain identity; derived field values do not.
    let branches = 0,
      start = a,
      branching = false;
    for (let i = a; i < b; i++) {
      if (['&&', '||', '??', '?', ':', '='].includes(value(i)) && !t[i].string) {
        branches |= kind(start, i);
        start = i + 1;
        branching = true;
      } else if (t[i].pair > i) i = t[i].pair;
    }
    if (branching) return branches | kind(start, b);
    if (b === a + 1 && ident(a)) return lookup(t[a].scope, value(a)).kind;
    const m = member(a, b);
    if (m) {
      if (m.key === 'eng') return ENG;
      if (m.key === '_macroMission') return MISSION;
      if (m.key === 'BattleEngagement') return ENG_API;
      return 0;
    }
    if (value(b - 1) === ')' && t[b - 1].pair > a) {
      const p = t[b - 1].pair,
        callee = member(a, p);
      if (callee && callee.key === 'stateOf' && kind(callee.a, callee.b) & ENG_API) return ENG;
      if (p === a + 1 && ident(a)) {
        const fn = lookup(t[a].scope, value(a)).fn;
        return fn ? fn.returns : 0;
      }
      if (callee && callee.key === 'assign' && value(a) === 'Object') return kind(...split(p + 1, b - 1)[0]);
    }
    return 0;
  }
  // Declarations plus plain assignments supply the alias edges. Forward references
  // are solved to a fixed point together with helper returns and call arguments.
  for (let i = 0; i < t.length; i++) {
    if (['var', 'let', 'const'].includes(value(i)) && !t[i].string) {
      let p = i + 1;
      while (p < t.length) {
        if (ident(p)) {
          const dest = bind(t[i].scope, value(p));
          if (value(p + 1) === '=') bindings.push({ dest, a: p + 2, b: endExpr(p + 2) });
        } else if (value(p) === '{') {
          const end = t[p].pair;
          if (value(end + 1) === '=') {
            for (const [a, b] of split(p + 1, end)) {
              const key = value(a),
                name = value(value(a + 1) === ':' ? a + 2 : a);
              if (name && b > a)
                bindings.push({
                  dest: bind(t[i].scope, name),
                  fixed: key === 'eng' ? ENG : key === '_macroMission' ? MISSION : 0
                });
            }
          }
        } else break;
        const end = endExpr(p);
        if (value(end) !== ',') break;
        p = end + 1;
      }
    }
    if (ident(i) && value(i + 1) === '=' && !['.', '?.'].includes(value(i - 1))) {
      bindings.push({ name: value(i), scope: t[i].scope, a: i + 2, b: endExpr(i + 2) });
    }
  }
  let changed = true;
  function add(dest, next) {
    if ((dest.kind | next) !== dest.kind) {
      dest.kind |= next;
      changed = true;
    }
  }
  for (let pass = 0; changed && pass < t.length; pass++) {
    changed = false;
    for (const edge of bindings) {
      const dest = edge.dest || lookup(edge.scope, edge.name);
      add(dest, edge.fixed == null ? kind(edge.a, edge.b) : edge.fixed);
      if (edge.a != null && dest.literal === undefined) {
        const next = literal(edge.a, edge.b);
        if (next !== undefined) {
          dest.literal = next;
          changed = true;
        }
      }
    }
    for (let i = 0; i < t.length; i++) {
      if (value(i) === 'return' && !t[i].string && t[i].scope !== top) {
        const fn = t[i].scope,
          next = kind(i + 1, endExpr(i + 1));
        if ((fn.returns | next) !== fn.returns) {
          fn.returns |= next;
          changed = true;
        }
      }
      if (!ident(i) || value(i + 1) !== '(' || value(i - 1) === 'function') continue;
      const fn = lookup(t[i].scope, value(i)).fn;
      if (!fn) continue;
      split(i + 2, t[i + 1].pair).forEach((arg, p) => {
        if (fn.params[p]) add(fn.params[p], kind(...arg));
      });
    }
  }
  function exprStart(end) {
    let a = end - 1;
    if (a < 0) return 0;
    if (t[a].pair < a) {
      const close = value(a);
      a = t[a].pair;
      if (close === ']' || (close === ')' && (ident(a - 1) || [')', ']'].includes(value(a - 1)))))
        a = exprStart(a);
    }
    if (['.', '?.'].includes(value(a - 1))) a = exprStart(a - 1);
    return a;
  }
  const found = [];
  function write(a, b, at, explicitKey) {
    const m = explicitKey === undefined ? member(a, b) : { a, b, key: explicitKey };
    if (!m) return;
    const k = kind(m.a, m.b);
    const field = ['commandPhase', 'eng', '_macroMission', 'orderAnchor', 'rally'].includes(m.key)
      ? m.key
      : k & ENG && ['state', 'since', 'until'].includes(m.key)
        ? 'eng.' + m.key
        : k & MISSION && m.key === 'status'
          ? '_macroMission.status'
          : null;
    if (!field) return;
    // The innermost function the write sits in; a nested helper is not its enclosing owner function.
    const inside = t[at].scope && t[at].scope.name;
    if (owners[field] !== file || (ownerFunction[field] && inside !== ownerFunction[field]))
      found.push({ file, line: t[at].line, field, at });
  }
  for (let i = 0; i < t.length; i++) {
    if (t[i].string) continue;
    if (/^(?:=|\+=|-=|\*=|\/=|%=|\*\*=|&&=|\|\|=|\?\?=|&=|\|=|\^=|<<=|>>=|>>>=)$/.test(value(i)))
      write(exprStart(i), i, i);
    if (['++', '--'].includes(value(i))) {
      write(exprStart(i), i, i);
      let b = i + 2;
      while (['.', '?.', '['].includes(value(b))) b = value(b) === '[' ? t[b].pair + 1 : b + 2;
      write(i + 1, b, i);
    }
    if (value(i) === 'delete') {
      let b = i + 2;
      while (['.', '?.', '['].includes(value(b))) b = value(b) === '[' ? t[b].pair + 1 : b + 2;
      write(i + 1, b, i);
    }
    // A new protected record must also originate with its owner. Ordinary snapshots
    // (eng: someValue) and unrelated commandPhase label maps are not record creation.
    if (['eng', '_macroMission'].includes(value(i)) && value(i + 1) === ':' && value(i + 2) === '{') {
      const keys = split(i + 3, t[i + 2].pair).map(([a]) => value(a));
      if (keys.some(k => (value(i) === 'eng' ? ['state', 'since', 'until'].includes(k) : k === 'status'))) {
        if (owners[value(i)] !== file) found.push({ file, line: t[i].line, field: value(i), at: i });
      }
    }
    if (!['Object', 'Reflect'].includes(value(i)) || value(i + 1) !== '.' || value(i + 3) !== '(') continue;
    const method = value(i + 2),
      args = split(i + 4, t[i + 3].pair);
    if (method === 'assign') {
      for (const [a, b] of args.slice(1))
        if (value(a) === '{' && t[a].pair === b - 1) {
          for (const [p] of split(a + 1, b - 1))
            write(...args[0], i, value(p) === '[' ? literal(p + 1, t[p].pair) : value(p));
        }
    } else if (['defineProperty', 'set', 'deleteProperty'].includes(method) && args[1]) {
      write(...args[0], i, literal(...args[1]));
    } else if (method === 'defineProperties' && args[1] && value(args[1][0]) === '{') {
      for (const [p] of split(args[1][0] + 1, args[1][1] - 1)) write(...args[0], i, value(p));
    }
  }
  // These two exact setup fallbacks predate the owner and only run when it is absent.
  // Check the guard/API arm as well as the write so a nearby unrelated call cannot
  // bless a new runtime writer. No broad file exemption.
  const fallback = {
    'commander-routes.js':
      'if(root.BattleSquadStability)root.BattleSquadStability.initialPhase(sq,phase);elsesq.commandPhase=phase;',
    'modules/21-defender-engineers.js':
      'if(root.BattleSquadStability)root.BattleSquadStability.initialPhase(sq,defend);elsesq.commandPhase=defend;'
  }[file];
  return found
    .filter(hit => {
      if (!fallback || hit.field !== 'commandPhase') return true;
      const start = hit.at - 21,
        end = hit.at + 3;
      return (
        t
          .slice(Math.max(0, start), end)
          .map(x => x.v)
          .join('') !== fallback
      );
    })
    .map(({ at, ...hit }) => hit);
}

function selfTest() {
  const bad = [
    ["soldier.eng.state = 'bound';", 'eng.state'],
    ["const e = soldier['eng']; e['since'] += 1;", 'eng.since'],
    ['let e; e = soldier.eng; const copy = e; copy.until++;', 'eng.until'],
    ["const k = 'state'; const e = soldier.eng; e[k] = 'bound';", 'eng.state'],
    ['const {eng: e} = soldier; delete e.state;', 'eng.state'],
    [
      "function get(s) { return s.eng || {}; } function mutate(e) { e.state = 'alert'; } mutate(get(s));",
      'eng.state'
    ],
    ['const E = root.BattleEngagement; const e = E.stateOf(s); ++e.since;', 'eng.since'],
    [
      "function get(q) { return q && q._macroMission; } const m = get(sq); m['status'] = 'executing';",
      '_macroMission.status'
    ],
    ["Object.assign(s.eng, {state: 'bound', until: 5});", 'eng.state'],
    ["Object.defineProperty(s.eng, 'since', {value: 9});", 'eng.since'],
    ['Object.defineProperties(s.eng, {until: {value: 9}});', 'eng.until'],
    ["Reflect.set(sq._macroMission, 'status', 'executing');", '_macroMission.status'],
    ["s.eng = {state: 'advance'};", 'eng'],
    ["sq['_macroMission'] = {};", '_macroMission'],
    ["const s = {eng: {state: 'advance'}};", 'eng'],
    ["const sq = {_macroMission: {status: 'issued'}};", '_macroMission'],
    ["q['commandPhase'] = 'defend';", 'commandPhase'],
    ['sq.rally = { x: 1, z: 2 };', 'rally'],
    ['survivor["orderAnchor"] = p; ++survivor.rally.x;', 'orderAnchor'],
    ['Object.assign(sq, { rally: p });', 'rally'],
    ["Object.defineProperty(sq, 'orderAnchor', { value: p });", 'orderAnchor'],
    ['delete sq.rally;', 'rally']
  ];
  for (const [source, field] of bad)
    assert.ok(
      scan(source, 'mutation.js').some(x => x.field === field),
      'missed mutation: ' + source
    );
  const clean = [
    "const e = unrelated; e.state = 'active'; e.until = 8; const m = unrelated; m.status = 'ready';",
    "function one(s) { const e = s.eng; return e.state; } function other() { const e = {}; e.state = 'generic'; }",
    "const e = s.eng.state; e.state = 'generic'; const m = sq._macroMission.status; m.status = 'generic';",
    "const e = Object.assign({}, s.eng); e.state = 'snapshot';",
    "// s.eng.state = 'fake';\nconst msg = 's.eng.since = 4'; const regex = /s.eng.state = x/;",
    'const row = {commandPhase: sq.commandPhase, eng: s.eng.state, status: sq._macroMission.status};',
    "const eng = {}; eng.state = 'generic'; root.BattleEngagement.requestState(s, b, 'shared-contact', 3);"
  ];
  for (const source of clean) assert.deepEqual(scan(source, 'mutation.js'), [], 'false positive: ' + source);
  for (const [field, owner] of Object.entries(owners)) {
    const source =
      field === 'eng'
        ? 's.eng = {};'
        : field === '_macroMission'
          ? 'sq._macroMission = {};'
          : field === 'commandPhase'
            ? 'sq.commandPhase = "hold";'
            : ownerFunction[field]
              ? 'function ' + ownerFunction[field] + '(sq, p) { sq.' + field + ' = p; }'
              : 's.' + field + ' = 1;';
    assert.deepEqual(scan(source, owner), [], 'owner rejected: ' + field);
  }
  // The anchor pair has an owner function inside the owner file: the same file, anywhere else, is a second publisher.
  const squadLeader = owners.rally;
  const publish =
    'function publishAnchor(sq, p) { sq.orderAnchor = { x: p.x, z: p.z }; sq.rally = { x: p.x, z: p.z }; }';
  assert.deepEqual(scan(publish, squadLeader), [], 'the publisher may assign both');
  for (const [source, field, why] of [
    [
      'function advanceSquadAnchor(sq) { sq.rally = { x: 1, z: 2 }; }',
      'rally',
      'another function in the owner file'
    ],
    [
      'function updateCohesion(sq, a) { sq.orderAnchor = a; sq.rally = a; }',
      'orderAnchor',
      'the regroup assigning it itself'
    ],
    ['sq.rally = p;', 'rally', 'top level of the owner file'],
    [
      'function publishAnchor(sq, p) { function later() { sq.rally = p; } later(); }',
      'rally',
      'a helper nested in the publisher'
    ],
    [
      'var publishAnchor = function (sq, p) { sq.rally = p; };',
      'rally',
      'an anonymous function bound to the name'
    ]
  ])
    assert.ok(
      scan(source, squadLeader).some(x => x.field === field),
      'second publisher accepted: ' + why
    );
  assert.deepEqual(
    scan('function other(sq) { const rally = sq.rally; return rally.x + sq.orderAnchor.z; }', squadLeader),
    [],
    'reading the pair is not publishing it'
  );
  for (const [file, phase] of [
    ['commander-routes.js', 'phase'],
    ['modules/21-defender-engineers.js', "'defend'"]
  ]) {
    const source = `if(root.BattleSquadStability) root.BattleSquadStability.initialPhase(sq, ${phase}); else sq.commandPhase = ${phase};`;
    assert.deepEqual(scan(source, file), [], 'guarded setup rejected');
    assert.equal(
      scan(source.replace('if(root.BattleSquadStability)', 'if(true)'), file).length,
      1,
      'unguarded fallback accepted'
    );
    assert.equal(
      scan(source + ' sq.commandPhase = "assault";', file).length,
      1,
      'setup exemption escaped its branch'
    );
  }
  return bad.length + clean.length + Object.keys(owners).length + 6 + 7;
}

const n = selfTest();
console.log('PASS state-owner scanner mutations and false-positive controls (' + n + ' cases)');
const dir = path.join(REPO, 'battle');
const files = fs
  .readdirSync(dir)
  .filter(f => f.endsWith('.js'))
  .concat(
    fs
      .readdirSync(path.join(dir, 'modules'))
      .filter(f => f.endsWith('.js'))
      .map(f => 'modules/' + f)
  );
const violations = files.flatMap(file => {
  try {
    return scan(fs.readFileSync(path.join(dir, file), 'utf8'), file);
  } catch (error) {
    throw new Error(file + ': ' + error.message, { cause: error });
  }
});
if (violations.length) {
  for (const v of violations)
    console.error(
      'FAIL ' + v.file + ':' + v.line + ' writes ' + v.field + ' (owner: ' + ownerName(v.field) + ')'
    );
  process.exitCode = 1;
} else
  console.log(
    'PASS only state owners write protected fields (' +
      files.length +
      ' runtime files; 2 guarded setup fallbacks)'
  );
