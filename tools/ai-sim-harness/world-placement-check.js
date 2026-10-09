#!/usr/bin/env node
'use strict';
/* Real shipping seed + terrain scatter, without WebGL presentation.
   Reject overlapping solid clutter, blocked roads, and flag/sandbag geometry
   that lies on top of another physical obstacle or a building. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const REPO = path.resolve(__dirname, '../..');
function stub() {
  const props = new Map();
  return new Proxy(function () {}, {
    get(t, key) {
      if (key === Symbol.toPrimitive) return () => 0;
      if (key === 'then') return undefined;
      if (!props.has(key)) props.set(key, stub());
      return props.get(key);
    },
    set(t, key, value) { props.set(key, value); return true; },
    apply() { return stub(); },
    construct() { return stub(); }
  });
}
function load(root, filename) {
  const code = fs.readFileSync(path.join(REPO, filename), 'utf8');
  new Function('window', 'globalThis', 'BABYLON', 'console', code)(root, root, root.BABYLON, {
    log() {}, warn() {}
  });
}
function world(seed) {
  const root = { BABYLON: stub(), GTLog() {} };
  root.window = root;
  load(root, 'battle/core-runtime.js');
  load(root, 'battle/terrain-features.js');
  load(root, 'battle/scenario-generator.js');
  const scenario = root.BattleScenarioGenerator.activate(seed);
  const heightAt = (x, z) => Math.sin(x * .013) * 1.7 + Math.cos(z * .011) * 1.3;
  const scene = { metadata: { battleScenario: scenario } };
  const field = root.BattleTerrainFeatures.scatter(scene, heightAt, {
    seed: root.BattleScenarioGenerator.hashSeed(seed + '|terrain-clutter'),
    fieldW: 2000, fieldD: 1200, keepoutZ: 528
  });
  return { root, scene, scenario, field, heightAt };
}
function signatures(items) {
  return items.map(p => [
    p.type, p.shape, p.x.toFixed(3), p.z.toFixed(3),
    (p.hx || 0).toFixed(3), (p.hz || 0).toFixed(3)
  ].join(':')).join('|');
}
const seeds = ['default', 'standard-benchmark-meeting-s1-b0001-0001',
  'standard-benchmark-us-defend-s1-b0002-0001', 'flag-grounding-regression'];
for (const seed of seeds) {
  const w = world(seed), T = w.root.BattleTerrainFeatures,
    physical = w.field.obstacles.__physicalFootprints,
    objects = w.scenario.objectives, roads = w.scenario.roads,
    buildings = w.scenario.buildings;
  assert.ok(physical.length > 20, 'representative map contains actual solid cover');
  let overlaps = 0, roadsBlocked = 0, buildingsBlocked = 0, markersBlocked = 0;
  for (let i = 0; i < physical.length; i++) {
    const a = physical[i];
    for (let j = i + 1; j < physical.length; j++)
      if (T.footprintOverlap(a, physical[j], 0)) overlaps++;
    if (!T.roadClear(roads, a, 0)) roadsBlocked++;
    for (const b of buildings) {
      if (T.footprintOverlap(a, T.rectFootprint(b.x, b.z, b.w/2, b.d/2, b.rot||0), 0))
        buildingsBlocked++;
    }
    for (const o of objects) {
      if (T.footprintOverlap(a, { shape:'circle', x:o.x,z:o.z,radius:3 }, 0))
        markersBlocked++;
    }
  }
  assert.equal(overlaps, 0, seed + ' solid cover footprints must not overlap');
  assert.equal(roadsBlocked, 0, seed + ' road approaches must be open');
  assert.equal(buildingsBlocked, 0, seed + ' obstacles must not occupy building footprints');
  assert.equal(markersBlocked, 0, seed + ' obstacle must not occupy flag base');
  const same = world(seed);
  assert.equal(signatures(physical), signatures(same.field.obstacles.__physicalFootprints),
    seed + ' layout is replayable from seed');
  console.log('PASS '+seed+': '+physical.length+' physical cover pieces, no crossings');
}
/* The placement test uses the exact same module as the live capture markers;
   this check is not a hand-written approximation of their collision code. */
{
  const w = world('marker-grounding');
  const root = w.root, T = root.BattleTerrainFeatures;
  root.BattleModules = { registerObjectiveType() {}, registerSystem() {} };
  load(root, 'battle/modules/01-capture-zone.js');
  const M = root.BattleCaptureMarkerGeometry;
  assert.ok(M, 'marker geometry helpers exposed');
  const sim = {
    scene: {
      metadata: { battleScenario: { buildings: [], roads: [] } },
      getMeshByName(name) {
        assert.equal(name, 'battleField');
        return { getHeightAtCoordinates(x, z) { return 14 + x * .02 - z * .01; } };
      }
    },
    heightAt() { return -30; },
    obstacles: []
  };
  assert.equal(M.surfaceY(sim, 10, 5), 14.15,
    'visual terrain triangles override stale simulation height on marker placement');
  sim.scene.getMeshByName = () => null;
  assert.equal(M.surfaceY(sim, 10, 5), -30,
    'headless marker placement retains simulation-height fallback');
  sim.scene.metadata.battleScenario.buildings = [{ x:0,z:0,w:9,d:9,rot:0 }];
  assert.equal(M.footprintClear(sim, 0, 0, .5, .5, 0, false), false,
    'a pole or sandbag may not occupy a building');
  const safe = M.anchor(sim, 0, 0);
  assert.ok(safe && Math.hypot(safe.x, safe.z) <= 21,
    'pole relocates visibly within objective radius when seed places building on it');
  assert.equal(M.footprintClear(sim, safe.x, safe.z, .48, .48, 0, false), true,
    'relocated pole must have actual collision clearance');
  sim.scene.metadata.battleScenario.buildings = [];
  sim.obstacles.__physicalFootprints = [T.rectFootprint(5, 7, 2, 1, Math.PI/4)];
  assert.equal(M.footprintClear(sim, 5, 7, .75, .36, 0, false), false,
    'sandbag cannot clip a rotated existing physical obstacle');
  sim.scene.metadata.battleScenario.roads = [{ax:-10,az:0,bx:10,bz:0,width:7}];
  assert.equal(M.footprintClear(sim, 0, 0, .75, .36, 0, true), false,
    'sandbag cannot visually block a road');
  console.log('PASS objective marker rendered-height and footprint safety');
}
const page = fs.readFileSync(path.join(REPO, 'battle/battle_sim.html'), 'utf8');
assert.doesNotMatch(page, /history\.replaceState\([^)]*seed/,
  'bare-URL random seed must never get pinned to address bar');
assert.match(page, /requested\|\|BattleScenarioGenerator\.newSeed\('live'\)/,
  'no-seed load creates a fresh seed');
console.log('PASS first load randomizes and explicit seed links remain deterministic');
