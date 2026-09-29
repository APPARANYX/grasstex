/* Who gets blood? Boots the page with FBX soldiers, steps the sim at 0.15 s, and tallies per victim:
   wound events reaching woundDecal (skinAnchor calls), anchors that came back null (no decal at all),
   UV paints, how many stamps the victim's private map holds, and whether the renderer texture exists.
   Then screenshots every casualty from above so the spread can be seen. Env: WS_URL, WS_SEED, WS_SIM
   (sim seconds, 240), WS_OUT. Point WS_URL at a preview.php?ref= link or the local server. */
const fs = require('node:fs'), path = require('node:path'), { execSync } = require('node:child_process');
function pw() { try { return require('playwright'); } catch (e) {} return require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const env = process.env, url = env.WS_URL || 'http://127.0.0.1:8765/grasstex/battle_sim_local.php',
  seed = env.WS_SEED || '12345', simMax = +(env.WS_SIM || 240), out = path.resolve(env.WS_OUT || 'closeups/wound-spread');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await pw().chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--ignore-certificate-errors'] });
  const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1000, height: 700 } });
  page.on('pageerror', e => console.log('pageerror', String(e)));
  page.on('console', m => { if (/ANIM|wound/i.test(m.text())) console.log('console:', m.text().slice(0, 200)); });
  await page.goto(url + (url.includes('?') ? '&' : '?') + 'seed=' + seed, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__battle__ && window.__battle__._roster.us.some(s => s._fbx), null, { timeout: 600000 });
  await page.evaluate(() => {
    window.__ws = {};
    const F = window.BattleFbxSoldier, a = F.skinAnchor, p = F.paintSurfaceWound;
    const rec = id => (window.__ws[id] = window.__ws[id] || { events: 0, nullAnchor: 0, painted: 0, paintNull: 0 });
    F.skinAnchor = function (s, pt) { const r = a.apply(this, arguments); const e = rec(s.id); e.events++; if (!r) { e.nullAnchor++; (window.__nulls = window.__nulls || []).push({ id: s.id, dead: !!s.dead, prone: !!s.prone, crawl: !!s.crawling, crouch: !!(s.crouching || s.tacticalCrouch), dy: +(pt.y - (s.position ? s.position.y : 0)).toFixed(2), dh: s.position ? +Math.hypot(pt.x - s.position.x, pt.z - s.position.z).toFixed(2) : null, t: +window.__battle__.time.toFixed(1), hp: s.health }); } return r; };
    F.paintSurfaceWound = function (an, st, out, dia, ang) { (window.__last = window.__last || {})[an.soldier.id] = [an, st, out, dia, ang]; const t0 = performance.now();  const on = an.mesh.isEnabled(); const r = p.apply(this, arguments); const e = rec(an.soldier.id); e.readyAtPaint = an.mesh._battleSurfaceDamage.renderer.isReady(); e.pending = !!(r && r.pending); if (r) { e.painted++; if (!on) e.paintedWhileCulled = (e.paintedWhileCulled || 0) + 1; } else e.paintNull++; return r; };
  });
  await page.getByText('Start battle').first().click().catch(() => {});
  for (;;) {
    const s = await page.evaluate(() => { const b = window.__battle__; b.paused = false; for (let i = 0; i < 100 && !b.winner; i++) b._frame(0.15); return { t: b.time, w: b.winner }; });
    if (s.t >= simMax || s.w) break;
  }
  await page.waitForTimeout(2000);
  const rows = await page.evaluate(async () => {
    const b = window.__battle__, all = b._roster.us.concat(b._roster.ge);
    const rowsOut = await Promise.all(all.map(async s => {
      const e = window.__ws[s.id] || { events: 0, nullAnchor: 0, painted: 0, paintNull: 0 };
      const maps = (s._fbx ? s._fbx.meshes : []).map(m => m._battleSurfaceDamage).filter(Boolean);
      return { id: s.id, f: s.faction, role: s.role, dead: !!s.dead, casualty: s.casualty && s.casualty.type, ...e, paintedWhileCulled: e.paintedWhileCulled || 0, mapWounds: maps.reduce((n, d) => n + d.wounds, 0), ink: await (async () => { let n = 0; for (const m of (s._fbx ? s._fbx.meshes : [])) { const d = m._battleSurfaceDamage, t = d && d.renderer && d.renderer.texture; if (!t) continue; const px = await t.readPixels(); if (px && px.length) for (let i = 3; i < px.length; i += 4) if (px[i] > 8) n++; } return n; })(), rttReady: maps.some(d => d.renderer && d.renderer.texture) };
    }));
    return rowsOut.filter(r => r.events || r.dead);
  });
  console.table(rows); console.log(await page.evaluate(() => { const b = window.__battle__; return JSON.stringify({ t: b.time, us: b.factions.us.alive, ge: b.factions.ge.alive, fx: !!b._impactFx, body: b._impactFx && b._impactFx.body.length }); }));
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(rows, null, 1));
  console.log('nulls', JSON.stringify(await page.evaluate(() => window.__nulls), null, 0));
  const dead = rows.filter(r => r.dead);
  console.log('paints total', rows.reduce((n, r) => n + r.painted, 0), 'while culled', rows.reduce((n, r) => n + r.paintedWhileCulled, 0), 'soldiers with every paint culled', rows.filter(r => r.painted && r.paintedWhileCulled === r.painted).length, 'of', rows.filter(r => r.painted).length);
  if (env.WS_RETRY) {
    const res = await page.evaluate(async () => {
      const F = window.BattleFbxSoldier, out = [];
      const ink = async m => { const t = m._battleSurfaceDamage.renderer.texture, px = await t.readPixels(); let n = 0; for (let i = 3; i < px.length; i += 4) if (px[i] > 8) n++; return n; };
      for (const id of Object.keys(window.__last)) {
        const [an, st, o, dia, ang] = window.__last[id];
        const before = await ink(an.mesh);
        if (before) continue;
        const r0 = F.paintSurfaceWound(an, st, o, dia, ang);
        await new Promise(r => setTimeout(r, 400));
        out.push({ id, before, afterRetry: await ink(an.mesh), ready: an.mesh._battleSurfaceDamage.renderer.isReady(), enabled: an.mesh.isEnabled(), dia, pendingRetry: !!(r0 && r0.pending) });
      }
      return out;
    });
    console.log('retry', JSON.stringify(res));
  }
  const dead0 = rows.filter(r => r.dead);
  console.log('dead with paints but no ink in the map', dead0.filter(r => r.painted && !r.ink).length, 'of', dead0.filter(r => r.painted).length, ' max marks on one man', Math.max(0, ...rows.map(r => r.painted)));
  console.log('dead', dead.length, 'dead with 0 painted', dead.filter(r => !r.painted).length, 'max painted', Math.max(0, ...rows.map(r => r.painted)));
  await page.evaluate(() => { window.__battle__.paused = true; document.querySelectorAll('div').forEach(d => { if (/AI LAB/.test(d.textContent) && d.children.length > 5) d.style.display = 'none'; }); });
  for (const r of dead.slice(0, +(env.WS_SHOTS || 6))) {
    await page.evaluate(id => {
      const b = window.__battle__, s = b._roster.us.concat(b._roster.ge).find(x => x.id === id), cam = b.scene.activeCamera, p = s.root ? s.root.getAbsolutePosition() : s.position;
      cam.setTarget && cam.setTarget(new BABYLON.Vector3(p.x, 0.2, p.z)); if ('alpha' in cam) { cam.beta = 0.35; cam.radius = 4; }
      b.scene.render();
    }, r.id);
    await page.screenshot({ path: path.join(out, 'dead-' + r.id + '.png') });
  }
  await browser.close();
})();
