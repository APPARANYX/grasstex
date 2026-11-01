/* Compare two sets of screenshots (a before/after of a close-up tool): per file, byte-identical or
 * the share of pixels that differ (any channel by more than COMPARE_TOLERANCE, default 8) and the
 * box around them. Decodes in headless Chromium, so it needs no Python imaging library.
 *   NODE_PATH=$(npm root -g) node scripts/compare_screenshots.cjs <dirA> <dirB>
 * Compares every PNG in dirA with the same name in dirB. Exits non-zero if any differs by more than
 * COMPARE_MAX_SHARE percent (default 0: any differing pixel fails).
 * Only compare runs of a deterministic tool (closeup.cjs, same env); see AGENTS.md Visual checks.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}
const [A, B] = process.argv.slice(2);
if (!A || !B) { console.error('usage: node scripts/compare_screenshots.cjs <dirA> <dirB>'); process.exit(2); }
const TOL = Number(process.env.COMPARE_TOLERANCE || 8);
const MAX_SHARE = Number(process.env.COMPARE_MAX_SHARE || 0);

(async () => {
  const files = fs.readdirSync(A).filter(f => /\.png$/i.test(f)).sort();
  if (!files.length) throw new Error(`no PNG files in ${A}`);
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let identical = 0, failed = 0;
  for (const f of files) {
    const pb = path.join(B, f);
    if (!fs.existsSync(pb)) { console.log(`${f}: missing in ${B}`); failed++; continue; }
    const a = fs.readFileSync(path.join(A, f)), b = fs.readFileSync(pb);
    if (a.equals(b)) { identical++; continue; }
    const r = await page.evaluate(async ([x, y, tol]) => {
      const load = src => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = src; });
      const [ia, ib] = await Promise.all([load(x), load(y)]);
      if (ia.width !== ib.width || ia.height !== ib.height) return { size: [ia.width, ia.height, ib.width, ib.height] };
      const cv = document.createElement('canvas'); cv.width = ia.width; cv.height = ia.height;
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, cv.width, cv.height).data;
      g.clearRect(0, 0, cv.width, cv.height); g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, cv.width, cv.height).data;
      let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let k = 0; k < da.length; k += 4) {
        if (Math.abs(da[k] - db[k]) > tol || Math.abs(da[k + 1] - db[k + 1]) > tol || Math.abs(da[k + 2] - db[k + 2]) > tol) {
          n++; const px = (k >> 2) % cv.width, py = Math.floor((k >> 2) / cv.width);
          x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py);
        }
      }
      return { share: n / (cv.width * cv.height) * 100, pixels: n, box: n ? [x0, y0, x1, y1] : null };
    }, ['data:image/png;base64,' + a.toString('base64'), 'data:image/png;base64,' + b.toString('base64'), TOL]);
    if (r.size) { console.log(`${f}: size differs ${r.size.join(' ')}`); failed++; continue; }
    const bad = r.share > MAX_SHARE;
    if (bad) failed++; else identical++;
    console.log(`${f}: ${r.pixels} pixels differ (${r.share.toFixed(3)}%)${r.box ? ` in [${r.box.join(', ')}]` : ''}${bad ? '' : ' (within limit)'}`);
  }
  await browser.close();
  console.log(`${identical} of ${files.length} match${MAX_SHARE ? ` (within ${MAX_SHARE}%)` : ''}, ${failed} differ`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
