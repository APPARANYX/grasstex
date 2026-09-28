<?php
/* Branch preview launcher: /grasstex/preview.php
   Type a branch name, a PR number or a GitHub branch/PR URL and this page stages that commit's battle
   runtime (battle/battle_sim.html, battle/*.js, battle/modules/*.js) into
   /grasstex/preview/ref-<sha12>/ and opens it. No Actions run and no work/** branch needed.

   It reuses the branch-preview contract of battle_sim_local.php (a preview.json beside the loader):
   the preview reads production assets, audio, policy and scenario memory and makes no telemetry,
   policy or learning writes.

   Trust: only branches of this repository (and PRs whose head is one) are accepted. Never a bare
   sha, since GitHub resolves commits from any fork through the parent repo. The PHP loader is never
   taken from the branch: the host's own loader is copied in, so a branch can only change JS/HTML.
   The branch's soldier models, clips, weapons and effect sprites come too (stage_assets: unchanged
   files are hard links to production, new ones are downloaded). A branch that changes the loader
   itself still needs the Actions preview (push to work/** or preview/**); the page says so.

   ?ref=<branch> always resolves the branch's current head, so that URL is a stable link to share.
   Staged commits are immutable and reused; the oldest are pruned past KEEP. */

$repo = 'APPARANYX/grasstex';
$root = dirname(__FILE__);
$previewRoot = $root . '/preview';
$cacheFile = $previewRoot . '/.ref-cache.json';
const KEEP = 12;
const MARKER = '.ref-preview';
const MAX_ASSET_DOWNLOAD = 314572800; /* 300 MB of new or changed assets per commit */

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Robots-Tag: noindex');
@set_time_limit(180);

function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

/* Optional token for the GitHub API rate limit (60/h unauthenticated per host IP):
   state/github-token.php containing <?php return 'github_pat_...'; (read-only public access is enough). */
function gh_headers() {
    static $headers = null;
    if ($headers !== null) return $headers;
    $headers = array('User-Agent: grasstex-preview', 'Accept: application/vnd.github+json');
    $tokenFile = dirname(__FILE__) . '/state/github-token.php';
    if (is_file($tokenFile)) {
        $token = @include $tokenFile;
        if (is_string($token) && preg_match('/^[A-Za-z0-9_]{20,255}$/', $token)) $headers[] = 'Authorization: Bearer ' . $token;
    }
    return $headers;
}

function curl_handle($url) {
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 30, CURLOPT_HTTPHEADER => gh_headers(),
    ));
    return $ch;
}

function gh_json($path, &$error) {
    $ch = curl_handle('https://api.github.com/repos/' . $GLOBALS['repo'] . '/' . $path);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($body === false) { $error = 'GitHub is unreachable from the host'; return null; }
    $data = json_decode($body, true);
    if ($code === 404) { $error = 'not found on GitHub'; return null; }
    if ($code === 403 || $code === 429) { $error = 'GitHub API rate limit hit; try again in a few minutes (or add state/github-token.php)'; return null; }
    if ($code < 200 || $code >= 300 || !is_array($data)) { $error = 'GitHub answered HTTP ' . $code; return null; }
    return $data;
}

function read_cache($file) {
    $d = is_file($file) ? json_decode(@file_get_contents($file), true) : null;
    return is_array($d) ? $d : array();
}

function write_cache($file, $data) {
    if (!is_dir(dirname($file))) @mkdir(dirname($file), 0775, true);
    @file_put_contents($file, json_encode($data), LOCK_EX);
}

function valid_branch($name) {
    return is_string($name) && preg_match('#^[A-Za-z0-9._/-]{1,200}$#', $name)
        && strpos($name, '..') === false && strpos($name, '//') === false && $name[0] !== '/' && $name[0] !== '-';
}

/* Branch, "#47", "pr/47", "47", github.com/<repo>/tree/<branch>, github.com/<repo>/pull/47. */
function parse_ref_input($input, &$error) {
    $input = trim((string)$input);
    $pos = false;
    foreach (array($GLOBALS['repo'], 'Teethree89/grasstex') as $repoName) {
        $prefix = 'github.com/' . $repoName . '/';
        $pos = stripos($input, $prefix);
        if ($pos !== false) break;
    }
    if ($pos !== false) {
        $rest = preg_replace('/[?#].*$/', '', substr($input, $pos + strlen($prefix)));
        if (preg_match('#^pull/(\d+)#', $rest, $m)) return array('pr', $m[1]);
        if (preg_match('#^(tree|commits)/(.+?)/?$#', $rest, $m)) $input = rawurldecode($m[2]);
        else { $error = 'use a branch or pull request URL of ' . $GLOBALS['repo']; return null; }
    }
    if (preg_match('#^(https?://)?(www\.)?github\.com/#i', $input)) { $error = 'only ' . $GLOBALS['repo'] . ' can be previewed'; return null; }
    if (preg_match('/^(#|pr\/|pull\/)?(\d{1,6})$/i', $input, $m)) return array('pr', $m[2]);
    if (!valid_branch($input)) { $error = 'not a valid branch name'; return null; }
    return array('branch', $input);
}

/* -> array(branch, sha) or null. Branch heads are cached briefly so reloads cost no API calls. */
function resolve_ref($input, $cacheFile, &$error) {
    $parsed = parse_ref_input($input, $error);
    if (!$parsed) return null;
    list($kind, $value) = $parsed;
    $cache = read_cache($cacheFile);
    $key = $kind . ':' . $value;
    if (isset($cache['heads'][$key]) && time() - $cache['heads'][$key]['at'] < 20) return $cache['heads'][$key]['r'];
    if ($kind === 'pr') {
        $pr = gh_json('pulls/' . $value, $error);
        if (!$pr) { $error = 'PR #' . $value . ': ' . $error; return null; }
        if (!isset($pr['head']['repo']['full_name']) || strcasecmp($pr['head']['repo']['full_name'], $GLOBALS['repo']) !== 0) {
            $error = 'PR #' . $value . ' comes from a fork; only branches of ' . $GLOBALS['repo'] . ' can be previewed'; return null;
        }
        /* The head sha, not the branch: a merged PR's branch is usually deleted. */
        if (!isset($pr['head']['sha']) || !preg_match('/^[0-9a-f]{40}$/', $pr['head']['sha'])) { $error = 'PR #' . $value . ' has no head commit'; return null; }
        $result = array('PR #' . $value . ' (' . $pr['head']['ref'] . ')', $pr['head']['sha']);
    } else {
        $branch = gh_json('branches/' . str_replace('%2F', '/', rawurlencode($value)), $error);
        if (!$branch || !isset($branch['commit']['sha']) || !preg_match('/^[0-9a-f]{40}$/', $branch['commit']['sha'])) {
            $error = 'branch "' . $value . '": ' . ($error ?: 'no commit'); return null;
        }
        $result = array($branch['name'], $branch['commit']['sha']);
    }
    $cache = read_cache($cacheFile);
    $cache['heads'][$key] = array('at' => time(), 'r' => $result);
    write_cache($cacheFile, $cache);
    return $result;
}

function host_loader($root) {
    foreach (array('battle_sim.php', 'battle_sim_local.php') as $name) {
        $p = $root . '/' . $name;
        if (!is_file($p)) continue;
        $src = @file_get_contents($p);
        if ($src !== false && strpos($src, 'BATTLE_PREVIEW') !== false && strpos($src, 'preview.json') !== false) return $src;
    }
    return null;
}

function rrmdir($dir) {
    if (is_link($dir) || !is_dir($dir)) { @unlink($dir); return; }
    foreach (scandir($dir) as $f) if ($f !== '.' && $f !== '..') rrmdir($dir . '/' . $f);
    @rmdir($dir);
}

/* Only directories this page created (they carry MARKER) are ever pruned. */
function prune($previewRoot, $keepSlug) {
    $dirs = array();
    foreach ((array)glob($previewRoot . '/ref-*', GLOB_ONLYDIR) as $d) {
        if (is_link($d) || !is_file($d . '/' . MARKER)) continue;
        $dirs[$d] = filemtime($d . '/' . MARKER);
    }
    arsort($dirs);
    foreach (array_slice(array_keys($dirs), KEEP) as $d) if (basename($d) !== $keepSlug) rrmdir($d);
    foreach ((array)glob($previewRoot . '/.staging-*', GLOB_ONLYDIR) as $d) if (time() - filemtime($d) > 600) rrmdir($d);
}

/* Keep ten transfers busy, refilling immediately instead of waiting for an entire batch.
   A 200 response can still be truncated: require a successful transfer and the Git blob id. */
function fetch_files($sha, $paths, $dir, $expected = array()) {
    $failed = array(); $handles = array(); $next = 0;
    $mh = curl_multi_init();
    do {
        while (count($handles) < 10 && $next < count($paths)) {
            $path = $paths[$next++];
            $target = $dir . '/' . $path;
            if (!is_dir(dirname($target))) @mkdir(dirname($target), 0775, true);
            $fp = @fopen($target, 'wb');
            if (!$fp) { $failed[] = $path; continue; }
            $ch = curl_handle('https://raw.githubusercontent.com/' . $GLOBALS['repo'] . '/' . $sha . '/' . implode('/', array_map('rawurlencode', explode('/', $path))));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
            curl_setopt($ch, CURLOPT_FILE, $fp);
            curl_setopt($ch, CURLOPT_TIMEOUT, 150);
            curl_multi_add_handle($mh, $ch);
            $handles[$path] = array($ch, $fp);
        }
        do { $status = curl_multi_exec($mh, $running); } while ($status === CURLM_CALL_MULTI_PERFORM);
        while ($done = curl_multi_info_read($mh)) {
            foreach ($handles as $path => $pair) {
                if ($pair[0] !== $done['handle']) continue;
                $ok = $done['result'] === CURLE_OK && curl_getinfo($pair[0], CURLINFO_HTTP_CODE) === 200;
                curl_multi_remove_handle($mh, $pair[0]);
                curl_close($pair[0]);
                fclose($pair[1]);
                $fresh = array();
                if ($ok && isset($expected[$path])) $ok = blob_sha($dir . '/' . $path, $fresh) === $expected[$path];
                if (!$ok) { $failed[] = $path; @unlink($dir . '/' . $path); }
                unset($handles[$path]);
                break;
            }
        }
        if ($status !== CURLM_OK) {
            foreach ($handles as $path => $pair) {
                curl_multi_remove_handle($mh, $pair[0]); curl_close($pair[0]); fclose($pair[1]);
                $failed[] = $path; @unlink($dir . '/' . $path);
            }
            $handles = array();
            $failed = array_merge($failed, array_slice($paths, $next));
            break;
        }
        if ($handles && (count($handles) === 10 || $next === count($paths))) {
            if (curl_multi_select($mh, 1.0) === -1) usleep(1000);
        }
    } while ($handles || $next < count($paths));
    curl_multi_close($mh);
    return $failed;
}

/* Scripts are small: copy and verify the destination so later production deploys cannot
   mutate an immutable preview through a hard link. Older previews need no new manifest. */
function stage_runtime($sha, $entries, $root, $tmp, $previewRoot, &$reused) {
    $sources = array($root);
    foreach ((array)glob($previewRoot . '/ref-*', GLOB_ONLYDIR) as $d) {
        if (!is_link($d) && is_file($d . '/' . MARKER)) $sources[] = $d;
    }
    $download = array(); $expected = array(); $reused = 0;
    foreach ($entries as $e) {
        $path = $e['path']; $expected[$path] = $e['sha'];
        $target = $tmp . '/' . $path;
        if (!is_dir(dirname($target))) @mkdir(dirname($target), 0775, true);
        $found = false;
        foreach ($sources as $source) {
            $file = $source . '/' . $path;
            if (!is_file($file) || (isset($e['size']) && filesize($file) !== $e['size'])) continue;
            $fresh = array();
            if (blob_sha($file, $fresh) !== $e['sha'] || !@copy($file, $target)) continue;
            $fresh = array(); clearstatcache(true, $target);
            if (blob_sha($target, $fresh) === $e['sha']) { $found = true; $reused++; break; }
            @unlink($target);
        }
        if (!$found) $download[] = $path;
    }
    return fetch_files($sha, $download, $tmp, $expected);
}

/* Git blob id of a host file, cached by size and mtime (hashing ~500 MB of FBX takes seconds). */
function blob_sha($file, &$cache) {
    clearstatcache(true, $file);
    $size = filesize($file); $mtime = filemtime($file);
    if (isset($cache[$file]) && $cache[$file][0] === $size && $cache[$file][1] === $mtime) return $cache[$file][2];
    $ctx = hash_init('sha1');
    hash_update($ctx, 'blob ' . $size . "\0");
    hash_update_file($ctx, $file);
    $sha = hash_final($ctx);
    $cache[$file] = array($size, $mtime, $sha);
    return $sha;
}

/* Soldier models, clips, weapons and effect sprites. The runtime reads them all from one base
   (BATTLE_SOLDIER_ASSET_BASE), which is the preview's own Assets/ once it has Assets/soldiers, so a
   preview carries the full set: files identical to production are hard links to the production
   copy (no extra disk), new or changed ones are downloaded from the branch. Production's
   server-owned sidecar JSON beside them is linked too, so hand contacts match production.
   Returns a status string; on any gap the staged Assets/ is removed and production assets serve. */
function stage_assets($sha, $treeEntries, $root, $tmp, $previewRoot) {
    $hashFile = $previewRoot . '/.asset-hash.json';
    $hashes = read_cache($hashFile);
    $download = array(); $expected = array(); $downloadBytes = 0; $linked = 0; $copied = 0; $problem = null;
    foreach ($treeEntries as $e) {
        $path = $e['path'];
        $prod = $root . '/' . $path;
        if (is_file($prod) && blob_sha($prod, $hashes) === $e['sha']) {
            if (!is_dir(dirname($tmp . '/' . $path))) @mkdir(dirname($tmp . '/' . $path), 0775, true);
            if (@link($prod, $tmp . '/' . $path)) $linked++;
            elseif (filesize($prod) < 4194304 && @copy($prod, $tmp . '/' . $path)) $copied++;
            else { $problem = 'cannot hard-link production assets on this host'; break; }
        } else {
            $download[] = $path; $expected[$path] = $e['sha']; $downloadBytes += isset($e['size']) ? $e['size'] : 0;
        }
    }
    write_cache($hashFile, $hashes);
    if (!$problem && $downloadBytes > MAX_ASSET_DOWNLOAD) $problem = round($downloadBytes / 1048576) . ' MB of new assets (limit ' . (MAX_ASSET_DOWNLOAD / 1048576) . ' MB); use the Actions preview';
    if (!$problem && $download) {
        $failed = fetch_files($sha, $download, $tmp, $expected);
        if ($failed) $problem = 'asset download failed for ' . implode(', ', array_slice($failed, 0, 3));
    }
    if (!$problem) {
        foreach (array('soldiers', 'animations', 'weapons') as $d) {
            foreach ((array)glob($root . '/Assets/' . $d . '/*.json') as $json) {
                $to = $tmp . '/Assets/' . $d . '/' . basename($json);
                if (!is_file($to) && is_dir(dirname($to)) && !@link($json, $to)) @copy($json, $to);
            }
        }
        return array(true, count($download) . ' from branch (' . round($downloadBytes / 1048576, 1) . ' MB), ' . ($linked + $copied) . ' from production');
    }
    rrmdir($tmp . '/Assets');
    return array(false, $problem);
}

/* A preview staged before assets were staged (no assetsStaged key) is restaged once. */
function staged_current($dest) {
    $d = json_decode(@file_get_contents($dest . '/preview.json'), true);
    return is_array($d) && array_key_exists('assetsStaged', $d);
}

/* Download the commit's runtime into preview/ref-<sha12>/ unless it is already there. */
function stage($branch, $sha, $root, $previewRoot, &$error) {
    $slug = 'ref-' . substr($sha, 0, 12);
    $dest = $previewRoot . '/' . $slug;
    if (is_file($dest . '/' . MARKER) && staged_current($dest)) { @touch($dest . '/' . MARKER); return $slug; }
    $loader = host_loader($root);
    if ($loader === null) { $error = 'the host has no preview-capable battle loader'; return null; }
    if (!is_dir($previewRoot) && !@mkdir($previewRoot, 0775, true)) { $error = 'cannot create the preview directory'; return null; }
    $lock = fopen($previewRoot . '/.ref-lock', 'c');
    if ($lock) flock($lock, LOCK_EX);
    if (is_file($dest . '/' . MARKER) && staged_current($dest)) { if ($lock) fclose($lock); return $slug; }
    if (is_file($dest . '/' . MARKER)) rrmdir($dest);

    $tree = gh_json('git/trees/' . $sha . '?recursive=1', $error);
    if (!$tree || !isset($tree['tree']) || !empty($tree['truncated'])) { $error = 'commit tree: ' . ($error ?: 'incomplete GitHub tree'); if ($lock) fclose($lock); return null; }
    $files = array(); $assets = array(); $branchLoaderSha = null;
    foreach ($tree['tree'] as $e) {
        if (!isset($e['type'], $e['path'], $e['sha']) || $e['type'] !== 'blob') continue;
        $path = $e['path'];
        if ($path === 'battle_sim_local.php') $branchLoaderSha = $e['sha'];
        if (preg_match('#^battle/(battle_sim\.html|[A-Za-z0-9._-]+\.js|modules/[A-Za-z0-9._-]+\.js)$#', $path)) $files[$path] = $e;
        elseif (preg_match('#^Assets/((soldiers|animations|weapons)/[^/]+\.fbx|effects/.+\.png)$#', $path)
            && strpos($path, '..') === false && strpos($path, '/.') === false && preg_match('#^[A-Za-z0-9 ._()/-]+$#', $path)) $assets[] = $e;
    }
    if (!isset($files['battle/battle_sim.html'])) { $error = 'this commit has no battle/battle_sim.html'; if ($lock) fclose($lock); return null; }

    $tmp = $previewRoot . '/.staging-' . substr($sha, 0, 12) . '-' . getmypid();
    rrmdir($tmp);
    @mkdir($tmp . '/battle/modules', 0775, true);
    $runtimeReused = 0;
    $failed = stage_runtime($sha, $files, $root, $tmp, $previewRoot, $runtimeReused);
    if ($failed) { rrmdir($tmp); $error = 'download failed for ' . implode(', ', array_slice($failed, 0, 5)); if ($lock) fclose($lock); return null; }
    list($assetsStaged, $assetNote) = stage_assets($sha, $assets, $root, $tmp, $previewRoot);

    $hostLoaderSha = sha1('blob ' . strlen($loader) . "\0" . $loader);
    $meta = array('ref' => $branch, 'sha' => $sha, 'deployedAt' => gmdate('Y-m-d\TH:i:s\Z'), 'source' => 'preview.php',
                  'files' => count($files), 'runtimeReused' => $runtimeReused, 'runtimeDownloaded' => count($files) - $runtimeReused, 'loaderMatchesBranch' => $branchLoaderSha === null || $branchLoaderSha === $hostLoaderSha,
                  'assetsStaged' => $assetsStaged, 'assets' => $assetNote);
    file_put_contents($tmp . '/battle_sim.php', $loader);
    file_put_contents($tmp . '/preview.json', json_encode($meta));
    file_put_contents($tmp . '/' . MARKER, $sha);
    if (!@rename($tmp, $dest)) { rrmdir($tmp); if (!is_file($dest . '/' . MARKER)) { $error = 'could not publish the staged preview'; if ($lock) fclose($lock); return null; } }
    prune($previewRoot, $slug);
    if ($lock) fclose($lock);
    return $slug;
}

function recent_previews($previewRoot) {
    $out = array();
    foreach ((array)glob($previewRoot . '/*/preview.json') as $f) {
        $d = json_decode(@file_get_contents($f), true);
        if (!is_array($d) || !isset($d['sha'])) continue;
        $slug = basename(dirname($f));
        $d['slug'] = $slug;
        $d['mtime'] = is_file(dirname($f) . '/' . MARKER) ? filemtime(dirname($f) . '/' . MARKER) : filemtime($f);
        $d['kind'] = strpos($slug, 'ref-') === 0 ? 'launcher' : 'actions';
        $out[] = $d;
    }
    usort($out, function ($a, $b) { return $b['mtime'] - $a['mtime']; });
    return array_slice($out, 0, 20);
}

function branch_list($cacheFile) {
    $cache = read_cache($cacheFile);
    if (isset($cache['branches']) && time() - $cache['branchesAt'] < 300) return $cache['branches'];
    $err = null; $list = gh_json('branches?per_page=100', $err);
    if (!is_array($list)) return isset($cache['branches']) ? $cache['branches'] : array();
    $names = array();
    foreach ($list as $b) if (isset($b['name'])) $names[] = $b['name'];
    $cache = read_cache($cacheFile);
    $cache['branches'] = $names; $cache['branchesAt'] = time();
    write_cache($cacheFile, $cache);
    return $names;
}

/* Game flags passed through to the preview page (keep in step with the URL flags in AGENTS.md). */
$pass = array();
foreach (array('seed', 'defender', 'soldiers', 'smooth', 'grass', 'animLod', 'soldierLod', 'weaponInstances', 'mergeWalls', 'perfTimings', 'bench', 'benchSeconds', 'benchWarmup', 'benchCam', 'benchAuto', 'benchHide') as $k) {
    if (isset($_GET[$k]) && $_GET[$k] !== '' && preg_match('/^[A-Za-z0-9_.-]{1,100}$/', $_GET[$k])) $pass[$k] = $_GET[$k];
}

$error = null;
$refInput = isset($_GET['ref']) ? (string)$_GET['ref'] : '';
if ($refInput !== '') {
    $resolved = resolve_ref($refInput, $cacheFile, $error);
    if ($resolved) {
        list($branch, $sha) = $resolved;
        $slug = stage($branch, $sha, $root, $previewRoot, $error);
        if ($slug) {
            $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
            header('Location: ' . $base . '/preview/' . $slug . '/battle_sim.php' . ($pass ? '?' . http_build_query($pass) : ''), true, 302);
            exit;
        }
    }
}

header('Content-Type: text/html; charset=utf-8');
$branches = branch_list($cacheFile);
$recent = recent_previews($previewRoot);
?><!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Battle Sim Preview</title>
<style>
:root{--bg:#14161a;--panel:#1d2026;--line:#2d3139;--text:#e8e6e1;--muted:#9a9ca3;--accent:#c9a54a;--bad:#e06c5a}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.45 system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:760px;margin:0 auto;padding:28px 16px 48px}h1{font-size:22px;margin:0 0 4px}p.sub{color:var(--muted);margin:0 0 22px}
form{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:16px}
label{display:block;font-size:13px;color:var(--muted);margin:0 0 6px}
input,select,button{font:inherit;color:var(--text);background:#0f1114;border:1px solid var(--line);border-radius:6px;padding:9px 10px}
input[name=ref]{width:100%}.row{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;align-items:end}.row>div{flex:1 1 140px}
.row input,.row select{width:100%}button{background:var(--accent);color:#161616;border:0;font-weight:600;cursor:pointer;padding:10px 18px}
.err{background:#3a1d1a;border:1px solid var(--bad);color:#ffd9d3;border-radius:6px;padding:10px 12px;margin:0 0 14px}
h2{font-size:15px;margin:28px 0 8px}table{width:100%;border-collapse:collapse;font-size:14px}td{border-top:1px solid var(--line);padding:8px 6px;vertical-align:top}
a{color:var(--accent)}code{font-size:13px;color:var(--muted)}.tag{font-size:11px;color:var(--muted);border:1px solid var(--line);border-radius:4px;padding:1px 5px}
.warn{color:#f0c36a;font-size:12px}
</style></head><body><main>
<h1>Battle Sim Preview</h1>
<p class="sub">Play any branch of <code><?= h($repo) ?></code> on the live host. Production is untouched; previews make no telemetry, policy or learning writes.</p>
<?php if ($error): ?><div class="err">Couldn't open <strong><?= h($refInput) ?></strong>: <?= h($error) ?></div><?php endif; ?>
<form method="get">
  <label for="ref">Branch, PR number or GitHub URL</label>
  <input id="ref" name="ref" list="branches" value="<?= h($refInput) ?>" placeholder="work/my-change · #47 · https://github.com/<?= h($repo) ?>/tree/…" autofocus required>
  <datalist id="branches"><?php foreach ($branches as $b): ?><option value="<?= h($b) ?>"><?php endforeach; ?></datalist>
  <div class="row">
    <div><label for="seed">Seed</label><input id="seed" name="seed" value="<?= h(isset($pass['seed']) ? $pass['seed'] : '') ?>" placeholder="random"></div>
    <div><label for="defender">Scenario</label><select id="defender" name="defender">
      <option value="">Meeting</option>
      <option value="us"<?= (isset($pass['defender']) && $pass['defender'] === 'us') ? ' selected' : '' ?>>US defending</option>
      <option value="ge"<?= (isset($pass['defender']) && $pass['defender'] === 'ge') ? ' selected' : '' ?>>German defending</option>
    </select></div>
    <div style="flex:0 0 auto"><button type="submit">Launch</button></div>
  </div>
</form>
<p class="sub" style="margin-top:12px;font-size:13px">A link like <code>preview.php?ref=work/my-change</code> always opens that branch's latest commit. The first open of a commit takes a few seconds to copy its runtime. The branch's own models, clips, weapons and effect sprites come with it (unchanged files are linked from production). Branches that change <code>battle_sim_local.php</code> need the Actions preview (push to <code>work/**</code>).</p>
<?php if ($recent): ?>
<h2>Recent previews</h2>
<table><?php foreach ($recent as $r): ?>
<tr><td><a href="preview/<?= h(rawurlencode($r['slug'])) ?>/battle_sim.php"><?= h(isset($r['ref']) ? $r['ref'] : $r['slug']) ?></a>
  <?php if (isset($r['loaderMatchesBranch']) && !$r['loaderMatchesBranch']): ?><div class="warn">This branch changes the loader; served with the host's loader.</div><?php endif; ?>
  <?php if (isset($r['assetsStaged']) && !$r['assetsStaged']): ?><div class="warn">Production assets: <?= h($r['assets']) ?></div><?php endif; ?></td>
<td><code><?= h(substr($r['sha'], 0, 7)) ?></code></td>
<td><span class="tag"><?= $r['kind'] === 'launcher' ? 'launcher' : 'actions' ?></span></td>
<td><code><?= h(gmdate('M j H:i', $r['mtime'])) ?> UTC</code></td></tr>
<?php endforeach; ?></table>
<?php endif; ?>
</main></body></html>
