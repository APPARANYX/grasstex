/* What Assets/animations/prepared-clips.bin must match, read from the checkout without a browser.
 * Shared by scripts/build_clip_pack.cjs (writes it into the pack's header) and
 * scripts/check_clip_pack.cjs (CI: fails when the pack no longer matches).
 *
 * - clips: the CLIPS table from battle/modules/53-fbx-clip-table.js (key -> spec);
 * - sources: sha256 of each clip FBX the table plays;
 * - converter: sha256 of the exact function/declarator bodies that produce the pack across
 *   the rig-canonicalizer and FBX backend, so editing any of them
 *   asks for a rebuild while unrelated backend edits do not;
 * - babylon: the Babylon version the page pins (its FBX loader produced the samples).
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..');
const TABLE = 'battle/modules/53-fbx-clip-table.js';
const RIG_CANON = 'battle/modules/52-fbx-rig-canon.js';
const BACKEND = 'battle/modules/53-fbx-soldier-backend.js';
const PAGE = 'battle/battle_sim.html';
const PACK = 'Assets/animations/prepared-clips.bin';
const CONVERTER_FUNCTIONS = ['rigScheme', 'canon', 'sourceRig', 'convertClip', 'encodeClipPack'];
const CONVERTER_VARS = ['SPINE_MAP', 'CANON_ALIAS', 'CLIP_PACK_FORMAT', 'FPS'];

const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');

function clipTable(root = ROOT) {
  const sandbox = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, TABLE), 'utf8'), { globalThis: sandbox, window: sandbox });
  return JSON.parse(JSON.stringify(sandbox.BattleFbxClips.clips));
}

/* The source text of `function name(...) {...}`, brace-matched (these functions hold no braces in
   strings or regexes), and of each `NAME=` declarator up to its terminating comma or semicolon.
   Formatting-tolerant since the Prettier ratchet (#304): declarations may be indented inside the
   IIFE and declarators may carry spaces around `=`. What matters is the code, not its layout. */
function converterText(src) {
  const parts = [];
  for (const name of CONVERTER_FUNCTIONS) {
    const m = new RegExp(`^[ \\t]*function ${name}\\(`, 'm').exec(src);
    if (!m) throw new Error(`${BACKEND}: function ${name} not found`);
    let i = src.indexOf('{', m.index), depth = 0;
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}' && --depth === 0) break;
    }
    parts.push(src.slice(m.index, i + 1));
  }
  for (const name of CONVERTER_VARS) {
    const m = new RegExp(`[\\s,]${name}[ \\t]*=`).exec(src);
    if (!m) throw new Error(`${BACKEND}: ${name}= not found`);
    let i = m.index + m[0].length, depth = 0;
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === '{' || c === '[' || c === '(') depth++;
      else if (c === '}' || c === ']' || c === ')') depth--;
      else if ((c === ',' || c === ';') && depth === 0) break;
    }
    parts.push(src.slice(m.index + 1, i));
  }
  return parts.join('\n');
}

function expected(root = ROOT) {
  const clips = clipTable(root);
  const sources = {};
  for (const file of [...new Set(Object.values(clips).map(spec => spec[0]))].sort()) {
    sources[file] = sha256(fs.readFileSync(path.join(root, 'Assets/animations', `${file}.fbx`)));
  }
  /* The rig canonicalizer moved out of the backend in #470. Read its real source as part
   of the same deterministic converter hash rather than assuming every owner is in 53.
   Extracted function/declarator bytes are unchanged; module wrappers are not hashed. */
  const converterOwners = [RIG_CANON, BACKEND].map(file => fs.readFileSync(path.join(root, file), 'utf8'));
  const converter = sha256(converterText(converterOwners.join('\n')));
  const pin = /babylonjs@([0-9][0-9A-Za-z.-]*)\/babylon\.js/.exec(fs.readFileSync(path.join(root, PAGE), 'utf8'));
  if (!pin) throw new Error(`${PAGE}: no pinned babylonjs@<version>/babylon.js`);
  return { clips, sources, converter, babylon: pin[1] };
}

/* The pack's JSON header (the Float32 data after it is the browser's business). */
function readHeader(file = path.join(ROOT, PACK)) {
  const buf = fs.readFileSync(file);
  if (buf.length < 8 || buf.toString('latin1', 0, 4) !== 'GCP1') throw new Error(`${file}: not a clip pack`);
  const len = buf.readUInt32LE(4);
  return { header: JSON.parse(buf.toString('utf8', 8, 8 + len)), bytes: buf.length, dataBytes: buf.length - 8 - len };
}

module.exports = { ROOT, PACK, expected, readHeader, sha256, converterText };
