<?php
/* Motion/Vehicle Lab asset inventory.
   Production scans its own Assets/ directory. A branch preview stages only
   modified assets; absent ones are served through Assets/.htaccess from
   production. The inventory therefore merges production and preview filenames
   while honoring branch-deleted assets from asset-overlay.json.
   No directory paths, server internals, or preview credentials are returned. */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Grasstex-Source: fbx-lab-asset-list');

$previewRoot = dirname(__DIR__);
$assetRoot = $previewRoot . '/Assets/';
$previewManifest = $previewRoot . '/asset-overlay.json';
$inPreview = false;
$deleted = array();
if (is_file($previewManifest) && is_readable($previewManifest)
    && is_file($previewRoot . '/preview.json')) {
    $meta = json_decode(@file_get_contents($previewManifest), true);
    if (is_array($meta) && isset($meta['assetOverlay']) && $meta['assetOverlay'] === true
        && isset($meta['version']) && $meta['version'] === 1) {
        $inPreview = true;
        foreach ((array)($meta['removedAssets'] ?? array()) as $path) {
            if (is_string($path) && preg_match('#^(soldiers|animations|weapons|vehicles)/[^/]+\.(fbx|glb|bin)$#i', $path)) {
                $deleted[$path] = true;
            }
        }
    }
}
$productionAssets = dirname(dirname(dirname(__DIR__))) . '/Assets/';
$folders = array('soldiers' => 'soldiers', 'animations' => 'animations', 'weapons' => 'weapons', 'vehicles' => 'vehicles');
$out = array();
foreach ($folders as $key => $dir) {
    $found = array();
    $roots = $inPreview ? array($productionAssets, $assetRoot) : array($assetRoot);
    foreach ($roots as $root) {
        $path = $root . $dir;
        if (!is_dir($path) || !is_readable($path)) continue;
        foreach (scandir($path) as $entry) {
            /* Asset categories are allowlisted; no nested or executable files. */
            if (!preg_match($key === 'vehicles' ? '/\.(?:fbx|glb)$/i' : '/\.fbx$/i', $entry)
                || strpos($entry, '/') !== false || $entry[0] === '.') continue;
            if (isset($deleted[$dir . '/' . $entry])) continue;
            $full = $path . '/' . $entry;
            if (!is_file($full) || !is_readable($full)) continue;
            $found[$entry] = true;
        }
    }
    $out[$key] = array_keys($found);
    usort($out[$key], function ($a, $b) { return strcasecmp($a, $b); });
}
echo json_encode(array('assets' => '../Assets/', 'files' => $out));
