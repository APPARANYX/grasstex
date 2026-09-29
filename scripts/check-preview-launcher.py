#!/usr/bin/env python3
"""Offline launcher checks using real PHP/cURL and a concurrent local HTTP fixture."""
import os
from pathlib import Path
import subprocess
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = Path(__file__).resolve().parents[1]
events = []
lock = threading.Lock()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_GET(self):
        name = self.path.rsplit('/', 1)[-1]
        with lock:
            events.append((name, 'start', time.monotonic()))
        if name == 'queue-0.js':
            time.sleep(0.5)
        body = ('fixture:' + name).encode()
        self.send_response(404 if name == 'missing.js' else 200)
        self.send_header('Content-Length', str(len(body) + (10 if name == 'partial.js' else 0)))
        self.end_headers()
        self.wfile.write(body)
        with lock:
            events.append((name, 'end', time.monotonic()))


PHP = r'''<?php
$source = file_get_contents($argv[1] . '/preview.php');
$source = substr($source, 5, strpos($source, '/* Game flags') - 5);
// Route only transport/metadata to fixtures; execute the shipping staging functions unchanged.
$source = str_replace('curl_init($url)', 'curl_init(getenv("PREVIEW_TEST_URL") . parse_url($url, PHP_URL_PATH))', $source);
$source = str_replace('function gh_json(', 'function unused_gh_json(', $source);
eval($source);
function gh_json($path, &$error) { return $GLOBALS['testTree']; }
function check($ok, $message) { if (!$ok) throw new Exception($message); }
function put($path, $body) {
    if (!is_dir(dirname($path))) mkdir(dirname($path), 0775, true);
    file_put_contents($path, $body); clearstatcache(true, $path);
}
function entry($path, $body) {
    return array('path' => $path, 'type' => 'blob', 'sha' => sha1('blob ' . strlen($body) . "\0" . $body), 'size' => strlen($body));
}
$base = $argv[2]; $root = $base . '/host'; $previewRoot = $root . '/preview';
mkdir($previewRoot, 0775, true);
$commit = str_repeat('a', 40); $entries = array();
for ($i = 0; $i < 24; $i++) {
    $path = 'battle/queue-' . $i . '.js';
    $body = 'fixture:queue-' . $i . '.js';
    $entries[] = entry($path, $body);
    put($root . '/' . $path, $body);
}
$expected = array_column($entries, 'sha', 'path');
check(fetch_files($commit, array_keys($expected), $base . '/cold', $expected) === array(), 'cold queue');
$before = microtime(true);
check(stage_runtime($commit, $entries, $root, $base . '/warm', $previewRoot, $reused) === array(), 'warm runtime');
check($reused === 24, 'unchanged runtime must use zero downloads');
$warmMs = (microtime(true) - $before) * 1000;
// A production deploy must not mutate a staged runtime via shared inodes.
put($root . '/battle/queue-1.js', 'changed production');
check(file_get_contents($base . '/warm/battle/queue-1.js') === 'fixture:queue-1.js', 'preview immutability');
$prior = $previewRoot . '/ref-' . substr($commit, 0, 12);
rename($base . '/warm', $prior); put($prior . '/' . MARKER, $commit);
check(stage_runtime($commit, $entries, $root, $base . '/previous', $previewRoot, $reused) === array(), 'previous runtime');
check($reused === 24, 'previous preview avoids downloading changed production file');
$entries[] = entry('battle/new.js', 'fixture:new.js');
check(stage_runtime($commit, $entries, $root, $base . '/delta', $previewRoot, $reused) === array(), 'delta runtime');
check($reused === 24 && file_get_contents($base . '/delta/battle/new.js') === 'fixture:new.js', 'only new file downloaded');
$bad = array('battle/partial.js', 'battle/missing.js', 'battle/wrong.js');
$failed = fetch_files($commit, $bad, $base . '/failed', array('battle/wrong.js' => str_repeat('0', 40)));
sort($bad); sort($failed); check($failed === $bad, 'partial, HTTP and hash failures rejected');
foreach ($bad as $path) check(!file_exists($base . '/failed/' . $path), 'failed file removed');
// Asset linking, sidecars, download cap and production fallback retain their contracts.
$asset = entry('Assets/soldiers/model.fbx', 'fixture:model.fbx');
put($root . '/' . $asset['path'], 'fixture:model.fbx');
put($root . '/Assets/soldiers/model.fbx.json', '{"hostOwned":true}');
list($ok, $note) = stage_assets($commit, array($asset), $root, $base . '/assets-local', $previewRoot);
check($ok && file_get_contents($base . '/assets-local/Assets/soldiers/model.fbx.json') === '{"hostOwned":true}', 'asset and sidecar reuse');
$newAsset = entry('Assets/soldiers/new-model.fbx', 'fixture:new-model.fbx');
list($ok, $note) = stage_assets($commit, array($newAsset), $root, $base . '/assets-new', $previewRoot);
check($ok, 'new asset download');
$newAsset['sha'] = str_repeat('0', 40);
list($ok, $note) = stage_assets($commit, array($newAsset), $root, $base . '/assets-bad', $previewRoot);
check(!$ok && !is_dir($base . '/assets-bad/Assets'), 'bad asset falls back to production');
$newAsset['size'] = MAX_ASSET_DOWNLOAD + 1;
list($ok, $note) = stage_assets($commit, array($newAsset), $root, $base . '/assets-limit', $previewRoot);
check(!$ok && strpos($note, 'limit') !== false, 'download cap');
// Full publish path: only branch runtime, host-owned loader, reuse on a second launch.
$loader = '<?php /* BATTLE_PREVIEW preview.json */'; put($root . '/battle_sim.php', $loader);
$html = entry('battle/battle_sim.html', 'fixture:battle_sim.html');
$testTree = array('tree' => array_merge($entries, array($html, entry('untrusted.php', '<?php evil();'))));
$error = null; $newCommit = str_repeat('b', 40);
$slug = stage('main', $newCommit, $root, $previewRoot, $error);
check($slug !== null, 'full staging: ' . $error);
$dest = $previewRoot . '/' . $slug;
check(file_get_contents($dest . '/battle_sim.php') === $loader, 'host loader retained');
check(!file_exists($dest . '/untrusted.php'), 'branch PHP excluded');
$meta = read_cache($dest . '/preview.json');
check($meta['runtimeReused'] === 24 && $meta['runtimeDownloaded'] === 2, 'reuse counters');
$testTree = null;
check(stage('main', $newCommit, $root, $previewRoot, $error) === $slug, 'staged launch requires no tree fetch');
$testTree = array('tree' => array($html), 'truncated' => true);
check(stage('truncated', str_repeat('c', 40), $root, $previewRoot, $error) === null, 'incomplete trees rejected');
$testTree = array('tree' => array($html, entry('battle/wrong.js', 'not the response')));
check(stage('bad', str_repeat('d', 40), $root, $previewRoot, $error) === null, 'bad download cannot publish');
check(!is_dir($previewRoot . '/ref-' . str_repeat('d', 12)), 'no partial publication');
check(parse_ref_input('https://github.com/APPARANYX/grasstex/tree/main', $error) === array('branch', 'main'), 'organization URL');
check(parse_ref_input('https://github.com/Teethree89/grasstex/tree/main', $error) === array('branch', 'main'), 'legacy repository URL');
check(parse_ref_input('https://github.com/other/grasstex/tree/main', $error) === null, 'foreign URL rejected');
echo json_encode(array('warmRuntimeMs' => round($warmMs, 2), 'runtimeFiles' => 24, 'warmDownloads' => 0, 'deltaDownloads' => 1)) . "\n";
'''


def main():
    source = (ROOT / 'preview.php').read_text()
    pass_segment = source[source.index('/* Game flags passed through'):source.index('$error = null;')]
    required = ['damageRange', 'rangeTarget', 'rangeZone', 'rangeExit', 'rangeAuto', 'rangeInterval', 'rangeOrbit', 'rangeDist', 'rangeUi', 'rangeFps']
    missing = [name for name in required if ("'" + name + "'") not in pass_segment]
    assert not missing, 'damage-range preview flags missing: ' + ', '.join(missing)
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with tempfile.TemporaryDirectory(prefix='preview-check-') as tmp:
            test = Path(tmp) / 'check.php'
            test.write_text(PHP)
            env = dict(os.environ, PREVIEW_TEST_URL=f'http://127.0.0.1:{server.server_port}')
            result = subprocess.run(['php', str(test), str(ROOT), tmp], env=env, capture_output=True, text=True, timeout=30)
            if result.returncode:
                raise RuntimeError(result.stdout + result.stderr)
            times = {(name, event): at for name, event, at in events}
            assert times['queue-10.js', 'start'] < times['queue-0.js', 'end'], 'queue waited for slow batch member'
            starts = [name for name, event, _ in events if event == 'start']
            assert starts.count('queue-1.js') == 1, 'unchanged/previous runtime re-downloaded'
            assert starts.count('new.js') == 2, 'delta/full stage downloaded unexpected files'
            print('PASS: rolling queue; exact local reuse; immutable scripts; delta downloads; failed transfers; atomic publication; org URL; damage-range flags')
            print(result.stdout.strip())
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    main()
