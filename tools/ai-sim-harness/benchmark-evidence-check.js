#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const { assessEvidence } = require("../../scripts/lib/benchmark-evidence.cjs");

const timeline = {
  markers: [
    { t: 3, kind: "stall-start", side: "ge", squad: "a", soldier: "1", owner: "navigation" },
    { t: 7, kind: "phase-change", side: "ge", squad: "a" },
    { t: 9, kind: "stall-end", side: "ge", squad: "a", soldier: "1", reason: "moving" },
    { t: 12, kind: "stall-start", side: "us", squad: "b", soldier: "2" },
  ],
};
const data = {
  timeline,
  writerConflicts: 2,
  diagnosticEvidence: {
    conflicts: [{ at: 4 }, { at: 8 }],
    loops: [],
    sourceTotals: { conflicts: 8, loops: 1 },
  },
};
const full = assessEvidence(data);
assert.equal(full.movementStallCompleted, 1);
assert.equal(full.movementStallCensored, 1);
assert.equal(full.movementStallEpisodes[0].durationSeconds, 6);
assert.equal(full.movementStallEpisodes[0].resolution, "moving");
assert.equal(full.integrity.ok, true);

const windowed = assessEvidence({ ...data, window: { openedAt: 5, closedAt: 10 } });
assert.deepEqual(windowed.incidentKinds, { "phase-change": 1, "stall-end": 1 });
assert.equal(windowed.movementStallCompleted, 1, "stall ending in window carries prior onset");
assert.equal(windowed.movementStallCensored, 0);

const bad = assessEvidence({ ...data, writerConflicts: 3 });
assert.deepEqual(bad.integrity.discrepancies, ["writer-conflict-count"]);

const trace = assessEvidence({
  timeline: {
    markers: [
      { t: 1, kind: "brief-change", side: "ge", squad: "A", objective: "O2" },
      { t: 3, kind: "phase-change", side: "ge", squad: "A", from: "hold", to: "advance" },
      { t: 5, kind: "stall-start", side: "ge", squad: "A", soldier: "7" },
      { t: 12, kind: "strategic-stall-wake", side: "ge", squad: "A", objective: "O2" },
      { t: 14, kind: "brief-change", side: "ge", squad: "A", objective: "O3" },
    ],
  },
});
assert.equal(trace.commandEpisodes.length, 2);
assert.equal(trace.commandEpisodes[0].outcome, "superseded");
assert.equal(trace.commandEpisodes[0].phaseTransitions.length, 1);
assert.equal(trace.commandEpisodes[0].stallOnsets.length, 1);
assert.equal(trace.commandEpisodes[0].acceptance, "not-observed");
assert.equal(trace.strategicWakeEpisodes[0].nextBriefAt, 14);
assert.equal(trace.strategicWakeEpisodes[0].outcome, "unverified");

console.log(
  "PASS benchmark evidence: scoped timeline events, cross-window stall pairing, censored episodes and count integrity",
);
