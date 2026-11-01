'use strict';
/* Native map DOM/layout and pointer checks. Also reused by shipping-page QA.
   Standalone mode uses empty intelligence and public fixture terrain, no game engine. */
const assert = require('node:assert/strict');
const path = require('node:path');

async function exerciseLayout(page) {
  const layouts = [];
  for (const size of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 1024, height: 768 }
  ]) {
    await page.setViewportSize(size);
    const layout = await page.evaluate(() => {
      const shell = document.querySelector('#battleTacticalMap .gtm-shell');
      const body = shell.querySelector('.gtm-body');
      const map = shell.querySelector('svg').getBoundingClientRect();
      const rect = shell.getBoundingClientRect();
      return {
        width: innerWidth,
        height: innerHeight,
        shell: { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom },
        overflowX: body.scrollWidth - body.clientWidth,
        map: { width: map.width, height: map.height },
        sidebarScrollable: getComputedStyle(shell.querySelector('.gtm-side')).overflowY
      };
    });
    assert.ok(
      layout.shell.x >= -1 && layout.shell.right <= size.width + 1,
      'map shell overflows horizontally: ' + JSON.stringify(layout)
    );
    assert.ok(
      layout.shell.y >= -1 && layout.shell.bottom <= size.height + 1,
      'map shell overflows vertically: ' + JSON.stringify(layout)
    );
    assert.ok(layout.overflowX <= 1, 'map contents overflow horizontally: ' + JSON.stringify(layout));
    assert.ok(
      layout.map.width > 200 && layout.map.height > 100,
      'map must remain usable: ' + JSON.stringify(layout)
    );
    if (size.width > 620) assert.equal(layout.sidebarScrollable, 'auto', 'short-screen sidebar must scroll');
    layouts.push(layout);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const gestures = await page.evaluate(() => {
    const map = document.querySelector('#battleTacticalMap svg');
    const r = map.getBoundingClientRect(),
      x = r.x + r.width / 2,
      y = r.y + r.height / 2;
    function pointer(type, id, px, py) {
      map.dispatchEvent(
        new PointerEvent(type, {
          pointerId: id,
          pointerType: 'touch',
          clientX: px,
          clientY: py,
          button: 0,
          bubbles: true
        })
      );
    }
    // Synthetic pointer capture is unavailable; the native browser gesture check
    // below still exercises exactly the map's registered multi-pointer listeners.
    const capture = map.setPointerCapture;
    map.setPointerCapture = () => {};
    try {
      BattleTacticalMap.resetViewport();
      pointer('pointerdown', 71, x - 30, y);
      pointer('pointerdown', 72, x + 30, y);
      pointer('pointermove', 71, x - 60, y);
      pointer('pointermove', 72, x + 60, y);
      const zoomed = map.getAttribute('viewBox').split(' ').map(Number);
      pointer('pointerup', 72, x + 60, y);
      pointer('pointermove', 71, x - 40, y);
      const panned = map.getAttribute('viewBox').split(' ').map(Number);
      pointer('pointercancel', 71, x - 40, y);
      pointer('pointermove', 71, x, y);
      const cancelled = map.getAttribute('viewBox');
      BattleTacticalMap.resetViewport();
      return { zoomed, panned, cancelled };
    } finally {
      map.setPointerCapture = capture;
    }
  });
  assert.ok(Math.abs(gestures.zoomed[2] - 500) < 1, 'two-finger spread must zoom to 200%');
  assert.notEqual(gestures.panned[0], gestures.zoomed[0], 'lifting one finger must continue panning');
  assert.equal(gestures.cancelled, gestures.panned.join(' '), 'cancelled touch cannot keep dragging');
  let nativeTouch = null;
  if (page.context().browser().browserType().name() === 'chromium') {
    const box = await page.locator('#battleTacticalMap svg').boundingBox();
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    const session = await page.context().newCDPSession(page);
    try {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [
          { x: x - 30, y, id: 1 },
          { x: x + 30, y, id: 2 }
        ]
      });
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          { x: x - 60, y, id: 1 },
          { x: x + 60, y, id: 2 }
        ]
      });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      nativeTouch = await page.evaluate(() => ({
        viewBox: document.querySelector('#battleTacticalMap svg').getAttribute('viewBox'),
        pageScale: visualViewport.scale
      }));
      assert.ok(
        Math.abs(Number(nativeTouch.viewBox.split(' ')[2]) - 500) < 1,
        'native two-finger spread must zoom the map'
      );
      assert.equal(nativeTouch.pageScale, 1, 'map pinch must not zoom the whole page');
      await page.evaluate(() => BattleTacticalMap.resetViewport());
    } finally {
      await session.detach();
    }
  }
  return { layouts, gestures, nativeTouch };
}

async function main() {
  let pw;
  try {
    pw = require('playwright');
  } catch (_) {
    const { execSync } = require('node:child_process');
    pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  }
  const engine = process.env.MAP_LAYOUT_BROWSER || 'chromium';
  const browser = await pw[engine].launch();
  try {
    const page = await browser.newPage({ hasTouch: true, isMobile: true });
    await page.setContent(
      '<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;overflow:hidden}</style>'
    );
    await page.evaluate(() => {
      window.BattleModules = {
        registerSystem(id, spec) {
          window.mapSystem = spec;
        }
      };
      window.BattleTacticalSituation = {
        compute() {
          return { contacts: [], aliveSquads: 0 };
        }
      };
      window.BATTLE_SCENARIO = { map: { width: 5000, depth: 5000 }, roads: [], objectives: [] };
    });
    await page.addScriptTag({
      path: path.resolve(__dirname, '../../battle/modules/55-reported-contact-tactical-map.js')
    });
    await page.evaluate(() => {
      mapSystem.onBattleStart({ time: 0, factions: { us: { squads: [] }, ge: { squads: [] } } });
      BattleTacticalMap.setOpen(true);
    });
    console.log('tactical-map-layout PASS ' + JSON.stringify({ engine, ...(await exerciseLayout(page)) }));
  } finally {
    await browser.close();
  }
}
if (require.main === module)
  main().catch(e => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { exerciseLayout };
