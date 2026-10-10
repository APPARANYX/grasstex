/* Pure FBX rig naming and upper-body mask, loaded before 53-fbx-soldier-backend.
   No Babylon dependency, mutable rig allocations or rendering side effects. */
(function (root) {
  'use strict';
  if (root.BattleFbxRigCanon) return;
  /* Rigs differ in bone naming: the clips use Mixamo names ("mixamorig:Spine/Spine1/Spine2"), the
   older characters use "Spine02/Spine01/Spine" for the same three bones, and Mixamo's leaf bones
   spell out "HeadTop_End". Every rig is read through canon(): names are lowercased, the prefix and
   punctuation dropped, and the spine chain mapped to spine0/1/2 by the scheme the rig uses, so
   binding, retargeting, the palm anchors and the weapon chain all work across both. */
  var SPINE_MAP = {
    mixamo: { spine: 'spine0', spine1: 'spine1', spine2: 'spine2' },
    legacy: { spine02: 'spine0', spine01: 'spine1', spine: 'spine2' }
  };
  var CANON_ALIAS = {
    headtopend: 'headend',
    headend: 'headend',
    lefttoeend: 'lefttoeend',
    righttoeend: 'righttoeend'
  };
  function rigScheme(names) {
    for (var i = 0; i < names.length; i++) {
      var n = String(names[i]).toLowerCase();
      if (n.indexOf('spine02') >= 0) return 'legacy';
    }
    return 'mixamo';
  }
  function canon(name, scheme) {
    var n = String(name || '')
      .toLowerCase()
      .replace(/^mixamorig[:_]?/, '')
      .replace(/[^a-z0-9]/g, '');
    var spine = SPINE_MAP[scheme || 'mixamo'];
    if (spine && spine[n]) return spine[n];
    return CANON_ALIAS[n] || n;
  }
  var BONE = {
    hips: 'hips',
    spine0: 'spine0',
    spine2: 'spine2',
    neck: 'neck',
    head: 'head',
    leftHand: 'lefthand',
    rightHand: 'righthand',
    leftFoot: 'leftfoot',
    rightFoot: 'rightfoot'
  };
  var UPPER_CANON = {
    spine0: 1,
    spine1: 1,
    spine2: 1,
    neck: 1,
    head: 1,
    headend: 1,
    headfront: 1,
    leftshoulder: 1,
    leftarm: 1,
    leftforearm: 1,
    lefthand: 1,
    rightshoulder: 1,
    rightarm: 1,
    rightforearm: 1,
    righthand: 1
  };
  function isUpper(canonName) {
    /* Fingers ride with the hand they belong to. */
    return !!UPPER_CANON[canonName] || /^(left|right)hand(thumb|index|middle|ring|pinky)/.test(canonName);
  }
  root.BattleFbxRigCanon = {
    rigScheme: rigScheme,
    canon: canon,
    BONE: BONE,
    isUpper: isUpper
  };
})(window);
