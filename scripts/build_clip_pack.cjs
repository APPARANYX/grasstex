/* Build Assets/animations/prepared-clips.bin: every clip in the CLIPS table
 * (battle/modules/53-fbx-clip-table.js), converted from its FBX by the game's own backend code
 * (sourceRig + convertClip in 53-fbx-soldier-backend.js) in a real browser with the pinned Babylon
 * FBX loader, and written as one package the runtime loads instead of ~90 clip FBX.
 *
 * Rebuild it whenever a clip FBX, the CLIPS table or the conversion code changes;
 * scripts/check_clip_pack.cjs (CI) says when. Serve the repo first (AGENTS.md "Browser smoke"):
 *   NODE_PATH=$(npm root -g) node scripts/build_clip_pack.cjs
 * Env: CLIP_PACK_URL (the served repo root, default http://127.0.0.1:8765/grasstex/),
 *      CLIP_PACK_OUT (default Assets/animations/prepared-clips.bin).
 */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, PACK, expected, readHeader } = require('./lib/clip-pack-sources.cjs');

const BASE = (process.env.CLIP_PACK_URL || 'http://127.0.0.1:8765/grasstex/').replace(/\/?$/, '/');
const OUT = path.resolve(process.env.CLIP_PACK_OUT || path.join(ROOT, PACK));

(async () => {
  const want = expected();
  const t0 = Date.now();
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--ignore-certificate-errors'] });
  const page = await browser.newPage({ ignoreHTTPSErrors: true });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.stack || e).slice(0, 400)));
  /* A page of its own beside the runtime: Babylon, the soldier model API, weapons, the clip table
     and the backend, nothing else, so no battle or model loads alongside. */
  const builder = BASE + 'battle/clip-pack-builder.html';
  await page.route(builder, route => route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><meta charset="utf-8"><canvas id="c" width="64" height="64"></canvas>
<script src="https://cdn.jsdelivr.net/npm/babylonjs@${want.babylon}/babylon.js"></script>
<script src="core-runtime.js"></script><script src="soldier.js"></script><script src="weapons.js"></script>
<script src="modules/53-fbx-clip-table.js"></script><script src="modules/53-fbx-soldier-backend.js"></script>`,
  }));
  await page.goto(builder, { waitUntil: 'load' });
  const result = await page.evaluate(async extra => {
    if (!window.BattleFbxSoldier || !BattleFbxSoldier.clipPack) throw new Error('backend without clipPack: ' + (window.BattleFbxSoldier ? 'old backend' : 'backend did not load'));
    if (BABYLON.Engine.Version !== extra.babylon) throw new Error(`Babylon ${BABYLON.Engine.Version} loaded, page pins ${extra.babylon}`);
    const engine = new BABYLON.Engine(document.getElementById('c'), false, { preserveDrawingBuffer: false });
    const scene = new BABYLON.Scene(engine);
    const bytes = await BattleFbxSoldier.clipPack.build(scene, extra);
    const pack = BattleFbxSoldier.clipPack.decode(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return { b64: btoa(s), clips: Object.keys(pack.clips).length, bones: pack.src.bones.length };
  }, { sources: want.sources, converter: want.converter, babylon: want.babylon });
  await browser.close();
  if (errors.length) throw new Error('page errors:\n' + errors.join('\n'));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, Buffer.from(result.b64, 'base64'));
  const { header, bytes, dataBytes } = readHeader(OUT);
  const keys = Object.keys(want.clips).length;
  if (header.clips.length !== keys) throw new Error(`pack has ${header.clips.length} clips, CLIPS has ${keys}`);
  console.log(`${path.relative(ROOT, OUT)}: ${header.clips.length} clips from ${Object.keys(header.sources).length} FBX, ${result.bones} bones, `
    + `${(bytes / 1048576).toFixed(2)} MiB (${(dataBytes / 1048576).toFixed(2)} MiB samples), format ${header.format}, Babylon ${header.babylon}, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
