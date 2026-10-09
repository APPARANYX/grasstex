# Seeded world placement and objective-marker grounding

## First-load seed behavior

A visit to `battle_sim.php` / the local battle page **without** an explicit
`?seed=` chooses a new `BattleScenarioGenerator.newSeed('live')` on every page
load or refresh, including default-entry links. We do not rewrite that seed into the URL. The chosen seed remains
visible in the HUD and diagnostics. An explicit `?seed=example` is deterministic
and remains suitable for bug reproduction and benchmarks; operator scenario
controls may also deliberately select a specific seed.

## Terrain contact for objective art

Capture flags and poles sample the **rendered `battleField` GroundMesh**
height (`getHeightAtCoordinates`) when available, using the usual
`sim.heightAt` in headless contexts. The pole embeds slightly into its ground.
Each visible sandbag bottom embeds a little below the lowest sampled longitudinal
end; this avoids separated sandbag pieces visibly hovering over hills. This
adjusts marker presentation only, not objective gameplay coordinates.

When a seed places a flag inside a solid structure/cover, its **visual pole**
chooses the nearest deterministic clear spot within 21 m of the logical
capture point. If nothing clears, the marker is omitted instead of rendering
through a wall. The capture zone itself never moves.

Individual decorative sandbags are omitted if they would intersect a building,
cover volume or roadway. They are **not** silently added as new nav collision
bodies; six short, separated clusters remain an indication, not a continuous
defensive wall.

## Nonintersecting cover

`BattleTerrainFeatures.scatter` now validates candidate hedge runs, tree
trunks/foliage, rocks, logs and low walls against the already accepted *exact*
physical footprints. Rotated rectangles use separating axes and circles use
nearest point on the box. A cheaply rejected bounding-circle test avoids most
work. Continuous hedge pieces may meet at their intended joints; independently
generated cover may not intersect them. Roads and visual flag/sandbag positions
reserve clear approach lanes. Buildings retain their existing exclusion zones.
A rejected candidate is **omitted**, not shoved into another barrier; the same
seed produces the same decision with no new RNG draws.

A continuous hedge consists of touching terrain-prism sections; numerical
rounding at the shared face does not count as a physical overlap. Distinct
intersections still fail the seeded geometry regression.

This prevents generator-created impassable crossings; it does **not** replace
runtime Navigation, guarantee every possible dynamic fortification avoids every
other object, or guarantee that every squad can reach every location. A full
movement/connectivity benchmark is still recommended before calling the
navigation problem comprehensively solved.

## Checks

- `node tools/ai-sim-harness/world-placement-check.js`: seeded replay,
  physical-to-physical separation, road/building and marker clearance,
  actual rendered-height priority, explicit-seed replay behavior
- Existing `map-pipeline-check.js`, `objective-marker-check.js`,
  `objective-nav-check.js` and engagement regression suites
- Visual QA: start with a bare URL twice, confirm two seed labels; reload a
  `?seed=...` URL and confirm identical world; inspect flags and sandbags from
  ground-level player view and a hill; check roads, hedge junctions and cover
  near building entrances from above.
