'use strict';

// CDP timeDeltas attribute sampled wall microseconds, not exact CPU cycles.
// Preserve unknown sample IDs explicitly instead of silently losing time.
module.exports = function summarizeCPUProfile(profile) {
  const nodes = new Map((profile.nodes || []).map(node => [node.id, node]));
  const parents = new Map();
  for (const node of nodes.values()) for (const child of node.children || []) parents.set(child, node.id);
  const rows = new Map();
  let sampledUs = 0,
    unattributedUs = 0,
    untimedSamples = 0;
  function rowFor(node) {
    const frame = node.callFrame || {};
    const key = JSON.stringify([frame.functionName, frame.url, frame.lineNumber, frame.columnNumber]);
    let row = rows.get(key);
    if (!row) {
      row = {
        functionName: frame.functionName || '(anonymous)',
        url: frame.url || '',
        line: Number.isInteger(frame.lineNumber) && frame.lineNumber >= 0 ? frame.lineNumber + 1 : null,
        column:
          Number.isInteger(frame.columnNumber) && frame.columnNumber >= 0 ? frame.columnNumber + 1 : null,
        selfSamples: 0,
        selfUs: 0,
        inclusiveUs: 0
      };
      rows.set(key, row);
    }
    return row;
  }
  for (let i = 0; i < (profile.samples || []).length; i++) {
    const delta = profile.timeDeltas?.[i];
    if (!Number.isFinite(delta) || delta < 0) {
      untimedSamples++;
      continue;
    }
    sampledUs += delta;
    let node = nodes.get(profile.samples[i]);
    if (!node) {
      unattributedUs += delta;
      continue;
    }
    const self = rowFor(node);
    self.selfSamples++;
    self.selfUs += delta;
    const visitedNodes = new Set(),
      visitedFrames = new Set();
    // Recursive frames may occur more than once in a stack. Inclusive time for
    // one source location counts the sample once, not once per recursion level.
    while (node && !visitedNodes.has(node.id)) {
      visitedNodes.add(node.id);
      const row = rowFor(node);
      if (!visitedFrames.has(row)) {
        row.inclusiveUs += delta;
        visitedFrames.add(row);
      }
      node = nodes.get(parents.get(node.id));
    }
  }
  const functions = [...rows.values()].sort((a, b) => b.selfUs - a.selfUs || b.inclusiveUs - a.inclusiveUs);
  for (const row of functions) row.selfPercent = sampledUs ? +((100 * row.selfUs) / sampledUs).toFixed(2) : 0;
  return {
    format: 'grasstex-js-cpu-samples-v1',
    units: 'sampled-wall-microseconds',
    scope: 'page evaluation: restart/setup and deterministic simulation stepping',
    samples: (profile.samples || []).length,
    sampledUs,
    unattributedUs,
    untimedSamples,
    durationUs: profile.endTime - profile.startTime,
    functions
  };
};
