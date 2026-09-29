#!/usr/bin/env node
'use strict';
/* Recall probe for tools/ai-sim-harness/wire-map.js: does the token scanner find every write that
   a real parser finds?

   Two measurements, both static and offline:

   1. Mechanics. Every write in every scanned file is found from a TypeScript AST (assignments and
      compound assignments, ++/--, delete), classified by the scanner's own vocabulary() and
      target(), and compared per file and field with what scan() reports. Any difference is a bug in
      the scanner's tokenising, chain parsing or write-form detection. Exits 1 on a difference.
   2. Vocabulary gaps. Writes through a receiver the vocabulary does not list, to a field the map
      already tracks: the way a writer slips past. This is how `unit` in module-registry.js and
      `next` in module 16 were found. Printed for review; nothing to fail on, since most are records
      of other owners (leases, briefs, stats) that share a field name.

   TypeScript is only a measuring instrument here, so CI does not need it (the harness stays
   dependency-free). Run with the global package on the path:

     NODE_PATH=$(npm root -g) node scripts/probe_wire_map_recall.cjs [repo-root]

   Measured 2026-09-29 on main with the Phase 1 merge: 618 writes on classified receivers, 344
   file/field cells, 0 differing. */
const fs = require('node:fs');
const path = require('node:path');
let ts;
try {
  ts = require('typescript');
} catch (error) {
  console.error(
    'typescript is not resolvable. Run: NODE_PATH=$(npm root -g) node ' +
      path.relative(process.cwd(), __filename)
  );
  process.exit(2);
}
const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const W = require(path.join(ROOT, 'tools/ai-sim-harness/wire-map.js'));
const K = ts.SyntaxKind;
const ASSIGN = new Set([
  K.EqualsToken,
  K.PlusEqualsToken,
  K.MinusEqualsToken,
  K.AsteriskEqualsToken,
  K.SlashEqualsToken,
  K.PercentEqualsToken,
  K.AsteriskAsteriskEqualsToken,
  K.AmpersandEqualsToken,
  K.BarEqualsToken,
  K.CaretEqualsToken,
  K.LessThanLessThanEqualsToken,
  K.GreaterThanGreaterThanEqualsToken,
  K.GreaterThanGreaterThanGreaterThanEqualsToken,
  K.BarBarEqualsToken,
  K.AmpersandAmpersandEqualsToken,
  K.QuestionQuestionEqualsToken
]);

/* The write targets of a source file: [{root, parts}] with parts as the scanner names them
   ('[]' for a computed key, the text for a string-literal key). Parentheses and calls end a chain. */
function targets(sf) {
  const out = [];
  function chain(node) {
    const parts = [];
    for (;;) {
      if (ts.isPropertyAccessExpression(node)) {
        parts.unshift(node.name.text);
        node = node.expression;
      } else if (ts.isElementAccessExpression(node)) {
        parts.unshift(ts.isStringLiteralLike(node.argumentExpression) ? node.argumentExpression.text : '[]');
        node = node.expression;
      } else break;
    }
    return ts.isIdentifier(node) ? { root: node.text, parts } : null;
  }
  (function walk(n) {
    let t = null;
    if (ts.isBinaryExpression(n) && ASSIGN.has(n.operatorToken.kind)) t = n.left;
    else if (
      (ts.isPrefixUnaryExpression(n) || ts.isPostfixUnaryExpression(n)) &&
      (n.operator === K.PlusPlusToken || n.operator === K.MinusMinusToken)
    )
      t = n.operand;
    else if (ts.isDeleteExpression(n)) t = n.expression;
    const c = t && chain(t);
    if (c && c.parts.length) out.push(c);
    ts.forEachChild(n, walk);
  })(sf);
  return out;
}

let cells = 0,
  differing = 0,
  writes = 0;
const gaps = {};
const tracked = new Set();
for (const file of W.files(ROOT)) {
  const source = fs.readFileSync(path.join(ROOT, 'battle', file), 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const vocab = W.vocabulary(file),
    truth = {},
    got = {};
  for (const c of targets(sf)) {
    const hit = vocab.has(c.root) && W.target(vocab.get(c.root), c.parts);
    if (!hit) continue;
    const key = hit.kind + '.' + hit.field;
    truth[key] = (truth[key] || 0) + 1;
    writes++;
    tracked.add(hit.field);
  }
  for (const w of W.scan(source, file)) got[w.kind + '.' + w.field] = (got[w.kind + '.' + w.field] || 0) + 1;
  for (const key of new Set(Object.keys(truth).concat(Object.keys(got)))) {
    cells++;
    if ((truth[key] || 0) !== (got[key] || 0)) {
      differing++;
      console.log('DIFF ' + file + ' ' + key + ': ast ' + (truth[key] || 0) + ', scanner ' + (got[key] || 0));
    }
  }
}
for (const file of W.files(ROOT)) {
  const source = fs.readFileSync(path.join(ROOT, 'battle', file), 'utf8');
  const vocab = W.vocabulary(file);
  for (const c of targets(
    ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  )) {
    if (vocab.has(c.root) || c.parts[0] === '[]' || !tracked.has(c.parts[0])) continue;
    const key = file + '  ' + c.root + '.' + c.parts[0];
    gaps[key] = (gaps[key] || 0) + 1;
  }
}
console.log(
  'mechanics: ' +
    writes +
    ' AST writes on classified receivers, ' +
    cells +
    ' file/field cells compared, ' +
    differing +
    ' differing'
);
const list = Object.keys(gaps).sort();
console.log(
  '\nvocabulary gaps: ' +
    list.length +
    " (receiver not in the vocabulary, field tracked elsewhere; review, most are other owners' records)"
);
for (const key of list) console.log('  ' + key.padEnd(64) + gaps[key]);
process.exit(differing ? 1 : 0);
