<?php
/* Shared server-side runtime contract. This selects optional modules and forwards URL
   controls; each pinned JS runtime remains the owner of its gameplay defaults/parsing. */
function grasstex_runtime_contract() {
    static $contract = null;
    if ($contract === null) $contract = array(
        'version' => 1,
        'previewOptions' => array('seed','defender','soldiers','smooth','stanceVis','fireControl','grass','grenades','animLod','soldierLod','clipPack','fastRetarget','farHz','boneTextures','fxPrewarm','weaponInstances','tracerPool','mergeWalls','perfTimings','bench','benchSeconds','benchWarmup','benchCam','benchAuto','benchHide','damageRange','rangeTarget','rangeZone','rangeExit','rangeAuto','rangeInterval','rangeOrbit','rangeDist','rangeUi','rangeFps','strategicInterception','frontLines','motorTransport','truckAccess','truckCollision','truckVisual','aerialRecon','interception','reinforcements','reinforcementSortie','blockedExit','tacticalController','audioBackend','audioSpatial','audioMix','audioDiag','audioFormat','acoustics','projectileFlight','combatAccuracy','combatTempo','firstContactResponse'),
        'optionalModules' => array(
            'graph' => array('30-ai-graph-editor.js','31-ai-graph-logic.js','33-ai-graph-usability.js','34-ai-timing-map.js','37-lease-panel.js','38-ai-diagnostics-export.js'),
            'bench' => array('97-device-benchmark.js'),
            'damageRange' => array('97z-damage-range-lifetime.js','97z-damage-range-panel.js','97z-damage-range-session.js','97z-damage-range-view.js','98-damage-range.js')
        )
    );
    return $contract;
}
function grasstex_runtime_modules($files, $query) {
    $all = isset($query['devModules']) && $query['devModules'] === '1';
    $enabled = array(
        'graph' => $all || (isset($query['editor']) && $query['editor'] === 'ai'),
        'bench' => $all || (isset($query['bench']) && $query['bench'] === '1'),
        'damageRange' => $all || (isset($query['damageRange']) && $query['damageRange'] === '1')
    );
    $groups = grasstex_runtime_contract()['optionalModules'];
    return array_values(array_filter($files, static function ($name) use ($groups, $enabled) {
        foreach ($groups as $group => $members) {
            if (in_array($name, $members, true)) return $enabled[$group];
        }
        return true;
    }));
}
function grasstex_preview_options($query) {
    $pass = array();
    foreach (grasstex_runtime_contract()['previewOptions'] as $name) {
        if (isset($query[$name]) && is_string($query[$name]) &&
            preg_match('/\A[A-Za-z0-9_.-]{1,100}\z/', $query[$name])) $pass[$name] = $query[$name];
    }
    return $pass;
}
