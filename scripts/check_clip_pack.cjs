/* CI: Assets/animations/prepared-clips.bin still matches the checkout. It must hold every CLIPS
 * entry with the same spec, built from the same clip FBX bytes, by the same conversion code and
 * the Babylon version the page pins. A stale pack would still load (the runtime falls back to FBX
 * only for clips whose spec changed), so this is what keeps it honest. On failure, rebuild:
 *   NODE_PATH=$(npm root -g) node scripts/build_clip_pack.cjs   (with the repo served, see AGENTS.md)
 * No browser; reads the pack's JSON header only.
 */
const { PACK, expected, readHeader } = require('./lib/clip-pack-sources.cjs');

const want = expected();
const { header } = readHeader();
const problems = [];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const packed = {};
for (const c of header.clips) packed[c.key] = c.spec;
for (const key of Object.keys(want.clips)) {
  if (!(key in packed)) problems.push(`clip ${key} is in CLIPS but not in the pack`);
  else if (!same(packed[key], want.clips[key])) problems.push(`clip ${key}: CLIPS has ${JSON.stringify(want.clips[key])}, the pack ${JSON.stringify(packed[key])}`);
}
for (const key of Object.keys(packed)) if (!(key in want.clips)) problems.push(`clip ${key} is in the pack but no longer in CLIPS`);
for (const [file, sha] of Object.entries(want.sources)) {
  const had = header.sources && header.sources[file];
  if (!had) problems.push(`${file}.fbx is not in the pack's sources`);
  else if (had !== sha) problems.push(`${file}.fbx changed since the pack was built`);
}
if (header.converter !== want.converter) problems.push('the clip conversion code in 53-fbx-soldier-backend.js changed since the pack was built');
if (header.babylon !== want.babylon) problems.push(`the pack was built with Babylon ${header.babylon}, the page pins ${want.babylon}`);

if (problems.length) {
  console.error(`${PACK} is stale:\n  - ${problems.slice(0, 20).join('\n  - ')}${problems.length > 20 ? `\n  - …and ${problems.length - 20} more` : ''}`);
  console.error('Rebuild it with the repo served locally: NODE_PATH=$(npm root -g) node scripts/build_clip_pack.cjs');
  process.exit(1);
}
console.log(`${PACK}: ${header.clips.length} clips from ${Object.keys(want.sources).length} FBX match CLIPS, their sources, the converter and Babylon ${want.babylon}`);
