/* Contact sheet of the decal sprite sheets, for checking a regenerated or hand-painted sheet before
   it ships. Each sheet is drawn over a background like the surface it lands on (blood over olive
   uniform/earth, holes over plaster grey) with the 4 x 4 cell grid and row names overlaid, so
   bleeding across cells, wrong rows or an off-grid layout show at a glance.

     node scripts/preview_decal_sheets.cjs            # DECAL_PREVIEW_OUT (default decal-sheets.png)

   No server needed: loads Assets/effects/decals/*.png from disk in headless Chromium. Rows come
   from DECAL_SHEETS in battle/modules/15-bullet-impact-fx.js (kept in step by hand below). */
'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os');
const { execSync } = require('node:child_process');
function loadPlaywright() {
  try {
    return require('playwright');
  } catch (e) {}
  return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}
const repo = path.resolve(__dirname, '..'),
  out = path.resolve(process.env.DECAL_PREVIEW_OUT || 'decal-sheets.png');
const SHEETS = [
  { file: 'blood.png', bg: '#6b6a55', rows: ['wound', 'soak', 'pool', 'spray'] },
  { file: 'bullet-holes.png', bg: '#a39d90', rows: ['masonry', 'wood', 'dirt', 'metal'] }
];
const cell = 128;
const html =
  '<html><body style="margin:0;display:flex;gap:8px;background:#222;font:12px sans-serif;color:#fff">' +
  SHEETS.map(
    s =>
      '<div style="background:' + s.bg + ';padding:8px"><div style="margin-bottom:4px">' + s.file + '</div>' +
      '<div style="position:relative;width:' + cell * 4 + 'px;height:' + cell * 4 + 'px">' +
      '<img src="file://' + path.join(repo, 'Assets/effects/decals', s.file) + '" style="width:100%;height:100%">' +
      s.rows.map((r, i) => '<div style="position:absolute;left:2px;top:' + (i * cell + 2) + 'px;text-shadow:0 0 3px #000">' + i + ' ' + r + '</div>').join('') +
      '<div style="position:absolute;inset:0;background-image:linear-gradient(#fff4 1px,transparent 1px),linear-gradient(90deg,#fff4 1px,transparent 1px);background-size:' + cell + 'px ' + cell + 'px"></div>' +
      '</div></div>'
  ).join('') +
  '</body></html>';
(async () => {
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'decals-')), 'preview.html');
  fs.writeFileSync(tmp, html);
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: cell * 8 + 48, height: cell * 4 + 40 } });
  await page.goto('file://' + tmp);
  await page.screenshot({ path: out });
  await browser.close();
  console.log('wrote ' + path.relative(process.cwd(), out));
})().catch(e => {
  console.error('PREVIEW FAIL', e.message);
  process.exit(1);
});
