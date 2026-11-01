'use strict';
/* Test-only source evaluation. Bindings are explicit: omitting `location` must
   retain Node's global lookup; supplying undefined deliberately shadows it.
   Never contextify the fixture root or cache a mutable world between calls. */
const fs = require('node:fs');
const path = require('node:path');
const REPO = path.resolve(__dirname, '../..');
const quietConsole = Object.freeze({ log() {}, warn() {} });
function loadSource(root, source, bindings = {}, filename = 'fixture-source.js') {
  const globals = { window: root, globalThis: root, console, ...bindings };
  const names = Object.keys(globals);
  return new Function(...names, source + '\n//# sourceURL=' + filename)(...names.map(name => globals[name]));
}
function loadModule(root, file, bindings = {}) {
  return loadSource(root, fs.readFileSync(path.join(REPO, file), 'utf8'), bindings, file);
}
module.exports = { loadModule, loadSource, quietConsole };
